import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRouter from "./routes/auth";
import billingRouter from "./routes/billing";
import videosRouter from "./routes/videos";
import { requireAuth, requireRole } from "./middleware/auth";
import Stripe from "stripe";
import { prisma } from "./lib/prisma";

dotenv.config();

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}

const app = express();
app.use(
  cors({
    origin: true, // reflect request origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Handle preflight without wildcard route patterns (Express 5 compatibility)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
// Debug helper for webhook
const webhookDebugLog = (context: string, data: any) => {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] [WEBHOOK DEBUG] ${context}:`,
    JSON.stringify(data, null, 2)
  );
};

// Stripe webhook must be before JSON parser to access raw body
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    webhookDebugLog("WEBHOOK_RECEIVED", {
      headers: {
        "stripe-signature": req.headers["stripe-signature"]
          ? "present"
          : "missing",
        "content-type": req.headers["content-type"],
        "user-agent": req.headers["user-agent"],
      },
      bodySize: req.body?.length || 0,
      timestamp: new Date().toISOString(),
    });

    const sig = req.headers["stripe-signature"] as string | undefined;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    webhookDebugLog("WEBHOOK_ENV_CHECK", {
      hasSignature: !!sig,
      hasEndpointSecret: !!endpointSecret,
      signatureLength: sig?.length || 0,
      signaturePreview: sig ? sig.substring(0, 20) + "..." : "none",
      endpointSecretPreview: endpointSecret ? endpointSecret.substring(0, 20) + "..." : "none"
    });

    if (!endpointSecret || !sig) {
      webhookDebugLog("WEBHOOK_MISSING_CONFIG", {
        hasSig: !!sig,
        hasSecret: !!endpointSecret,
        error: "Missing signature or endpoint secret",
      });
      return res.status(400).send("Missing signature");
    }

    let event: Stripe.Event;
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

      webhookDebugLog("WEBHOOK_EVENT_CONSTRUCTED", {
        type: event.type,
        id: event.id,
        created: event.created,
        livemode: event.livemode,
        apiVersion: event.api_version,
      });
    } catch (err: any) {
      webhookDebugLog("WEBHOOK_SIGNATURE_VERIFICATION_FAILED", {
        error: err?.message,
        stack: err?.stack,
        type: err?.type,
        code: err?.code,
      });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      webhookDebugLog("WEBHOOK_EVENT_PROCESSING_START", {
        eventType: event.type,
        eventId: event.id,
      });

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        webhookDebugLog("CHECKOUT_SESSION_COMPLETED", {
          sessionId: session.id,
          clientReferenceId: session.client_reference_id,
          customerId: session.customer,
          paymentStatus: session.payment_status,
          mode: session.mode,
          successUrl: session.success_url,
          cancelUrl: session.cancel_url,
          amountTotal: session.amount_total,
          currency: session.currency,
        });

        const clientRef = session.client_reference_id;
        if (clientRef) {
          const userId = parseInt(clientRef, 10);

          webhookDebugLog("USER_ACTIVATION_START", {
            userId,
            clientReferenceId: clientRef,
            isValidUserId: !isNaN(userId),
          });

          // Check user before update
          const userBefore = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              isActive: true,
              email: true,
              createdAt: true,
            },
          });

          webhookDebugLog("USER_BEFORE_UPDATE", {
            user: userBefore,
            exists: !!userBefore,
          });

          if (!userBefore) {
            webhookDebugLog("USER_NOT_FOUND", {
              userId,
              clientReferenceId: clientRef,
              error: "User not found in database",
            });
            return res.status(404).json({ message: "User not found" });
          }

          // Update user
          const updateResult = await prisma.user.update({
            where: { id: userId },
            data: { isActive: true },
          });

          webhookDebugLog("USER_UPDATE_RESULT", {
            userId,
            updateResult: {
              id: updateResult.id,
              isActive: updateResult.isActive,
              createdAt: updateResult.createdAt,
            },
          });

          // Read back to verify
          const userAfter = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              isActive: true,
              email: true,
              createdAt: true,
            },
          });

          // Get database info for debugging
          let dbHost: string | undefined;
          let dbName: string | undefined;
          try {
            const u = new URL(process.env.DATABASE_URL || "");
            dbHost = u.hostname;
            dbName = u.pathname.substring(1);
          } catch {
            dbHost = undefined;
            dbName = undefined;
          }

          webhookDebugLog("USER_ACTIVATION_COMPLETE", {
            userId,
            userBefore: {
              isActive: userBefore.isActive,
              createdAt: userBefore.createdAt,
            },
            userAfter: {
              isActive: userAfter?.isActive,
              createdAt: userAfter?.createdAt,
            },
            activationSuccessful: userAfter?.isActive === true,
            dbInfo: {
              host: dbHost,
              name: dbName,
              url: process.env.DATABASE_URL ? "present" : "missing",
            },
          });
        } else {
          webhookDebugLog("MISSING_CLIENT_REFERENCE_ID", {
            sessionId: session.id,
            clientReferenceId: session.client_reference_id,
            error: "No client_reference_id found on session",
          });
        }
      } else {
        webhookDebugLog("UNHANDLED_EVENT_TYPE", {
          eventType: event.type,
          eventId: event.id,
          message: "Event type not handled",
        });
      }

      webhookDebugLog("WEBHOOK_PROCESSING_COMPLETE", {
        eventType: event.type,
        eventId: event.id,
        success: true,
      });

      res.json({ received: true });
    } catch (e) {
      webhookDebugLog("WEBHOOK_PROCESSING_ERROR", {
        error: (e as any)?.message || e,
        stack: (e as any)?.stack,
        eventType: event?.type,
        eventId: event?.id,
      });
      res.status(500).json({ message: "Webhook handling failed" });
    }
  }
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/billing", billingRouter);
app.use("/api/videos", videosRouter);

app.get("/api/protected", requireAuth, (_req, res) => res.json({ ok: true }));
app.get("/api/admin", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ users });
});

// Unified error handler to return JSON and log server-side
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err?.message || err);
    const status = typeof err?.status === "number" ? err.status : 500;
    res.status(status).json({
      message: err?.message || "Internal Server Error",
    });
  }
);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

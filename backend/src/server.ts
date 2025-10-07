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

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string | undefined;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret || !sig) {
      return res.status(400).send("Missing signature");
    }

    let event: Stripe.Event;
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const clientRef = session.client_reference_id;

        if (clientRef) {
          const userId = parseInt(clientRef, 10);

          if (!isNaN(userId)) {
            // Check if user exists
            const user = await prisma.user.findUnique({
              where: { id: userId },
            });

            if (user) {
              // Activate user
              await prisma.user.update({
                where: { id: userId },
                data: { isActive: true },
              });
            }
          }
        }
      }

      res.json({ received: true });
    } catch (e) {
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

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    // Swallow console output in production; rely on HTTP response
    const status = typeof err?.status === "number" ? err.status : 500;
    res.status(status).json({
      message: err?.message || "Internal Server Error",
    });
  }
);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  // server listening
});

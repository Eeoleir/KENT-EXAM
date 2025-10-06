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
// Stripe webhook must be before JSON parser to access raw body
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string | undefined;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret || !sig) {
      console.warn("Stripe webhook: missing signature or endpoint secret", {
        hasSig: !!sig,
        hasSecret: !!endpointSecret,
      });
      return res.status(400).send("Missing signature");
    }
    let event: Stripe.Event;
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log("Stripe webhook: event constructed", { type: event.type });
    } catch (err: any) {
      console.error(
        "Stripe webhook: signature verification failed",
        err?.message
      );
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Stripe webhook: checkout.session.completed", {
          sessionId: session.id,
          clientReferenceId: session.client_reference_id,
        });
        const clientRef = session.client_reference_id;
        if (clientRef) {
          const userId = parseInt(clientRef, 10);
          console.log("Stripe webhook: activating user", { userId });
          await prisma.user.update({
            where: { id: userId },
            data: { isActive: true },
          });
          // Read back isActive and print DB host to confirm same database
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isActive: true },
          });
          let dbHost: string | undefined;
          try {
            const u = new URL(process.env.DATABASE_URL || "");
            dbHost = u.hostname;
          } catch {
            dbHost = undefined;
          }
          console.log("Stripe webhook: user activated", {
            userId,
            readBackIsActive: user?.isActive,
            dbHost,
          });
        } else {
          console.warn(
            "Stripe webhook: missing client_reference_id on session",
            {
              sessionId: session.id,
            }
          );
        }
      }
      res.json({ received: true });
    } catch (e) {
      console.error(
        "Stripe webhook: handling failed",
        (e as any)?.message || e
      );
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

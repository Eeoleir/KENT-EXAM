import { Router } from "express";
import dotenv from "dotenv";
import Stripe from "stripe";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

dotenv.config();
const router = Router();

router.post(
  "/create-checkout-session",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      // Validate environment variables
      if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
        return res
          .status(500)
          .json({ message: "Stripe configuration missing" });
      }

      const origin = (req.headers.origin as string) || "http://localhost:3000";
      const userId = req.user!.id;

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription" as const,
        client_reference_id: String(userId),
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID!,
            quantity: 1,
          },
        ],
        success_url: `${origin}/?status=success`,
        cancel_url: `${origin}/?status=cancelled`,
      });

      return res.json({ url: session.url });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message || "Failed to create session" });
    }
  }
);

router.get("/status", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { isActive: true },
    });

    res.json({ active: !!user?.isActive });
  } catch (err: any) {
    res.status(500).json({
      error: "Failed to check status",
      active: false,
    });
  }
});

export default router;

import { Router } from "express";
import dotenv from "dotenv";
import Stripe from "stripe";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

dotenv.config();
const router = Router();

// Debug helper function
const debugLog = (context: string, data: any) => {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] [BILLING DEBUG] ${context}:`,
    JSON.stringify(data, null, 2)
  );
};

router.post(
  "/create-checkout-session",
  requireAuth,
  async (req: AuthRequest, res) => {
    debugLog("CREATE_CHECKOUT_SESSION_START", {
      userId: req.user?.id,
      headers: {
        origin: req.headers.origin,
        userAgent: req.headers["user-agent"],
        authorization: req.headers.authorization ? "present" : "missing",
      },
    });

    try {
      // Check environment variables
      const envCheck = {
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
        STRIPE_PRICE_ID: !!process.env.STRIPE_PRICE_ID,
        STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      };
      debugLog("ENVIRONMENT_CHECK", envCheck);

      if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
        debugLog("ENVIRONMENT_ERROR", {
          message: "Stripe configuration missing",
          missing: {
            STRIPE_SECRET_KEY: !process.env.STRIPE_SECRET_KEY,
            STRIPE_PRICE_ID: !process.env.STRIPE_PRICE_ID,
          },
        });
        return res
          .status(500)
          .json({ message: "Stripe configuration missing" });
      }

      const origin = (req.headers.origin as string) || "http://localhost:3000";
      const userId = req.user!.id;

      debugLog("USER_INFO", {
        userId,
        origin,
        userRole: req.user?.role,
      });

      // Check current user status before creating session
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          isActive: true,
          email: true,
          createdAt: true,
        },
      });

      debugLog("USER_CURRENT_STATUS", {
        user: currentUser,
        isActive: currentUser?.isActive,
      });

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      const sessionConfig = {
        mode: "subscription" as const,
        client_reference_id: String(userId),
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: `${origin}/?status=success`,
        cancel_url: `${origin}/?status=cancelled`,
      };

      debugLog("STRIPE_SESSION_CONFIG", sessionConfig);

      const session = await stripe.checkout.sessions.create(sessionConfig);

      debugLog("STRIPE_SESSION_CREATED", {
        sessionId: session.id,
        url: session.url,
        clientReferenceId: session.client_reference_id,
        mode: session.mode,
        status: session.status,
      });

      return res.json({ url: session.url });
    } catch (err: any) {
      debugLog("CREATE_CHECKOUT_SESSION_ERROR", {
        error: err?.message,
        stack: err?.stack,
        code: err?.code,
        type: err?.type,
        userId: req.user?.id,
      });

      return res
        .status(500)
        .json({ message: err?.message || "Failed to create session" });
    }
  }
);

router.get("/status", requireAuth, async (req: AuthRequest, res) => {
  debugLog("STATUS_CHECK_START", {
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        isActive: true,
        email: true,
        createdAt: true,
      },
    });

    debugLog("STATUS_CHECK_RESULT", {
      userId: req.user!.id,
      user: user,
      isActive: user?.isActive,
      active: !!user?.isActive,
    });

    res.json({ active: !!user?.isActive });
  } catch (err: any) {
    debugLog("STATUS_CHECK_ERROR", {
      userId: req.user?.id,
      error: err?.message,
      stack: err?.stack,
    });

    res.status(500).json({
      error: "Failed to check status",
      active: false,
    });
  }
});

// Debug endpoint to get detailed user information
router.get("/debug/user", requireAuth, async (req: AuthRequest, res) => {
  debugLog("DEBUG_USER_REQUEST", {
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        isActive: true,
        role: true,
        createdAt: true,
      },
    });

    debugLog("DEBUG_USER_RESULT", {
      user: user,
      exists: !!user,
    });

    res.json({
      user,
      debug: {
        timestamp: new Date().toISOString(),
        userId: req.user!.id,
        userExists: !!user,
      },
    });
  } catch (err: any) {
    debugLog("DEBUG_USER_ERROR", {
      userId: req.user?.id,
      error: err?.message,
      stack: err?.stack,
    });

    res.status(500).json({
      error: "Failed to get user debug info",
      message: err?.message,
    });
  }
});

// Debug endpoint to check system health and configuration
router.get("/debug/system", requireAuth, async (req: AuthRequest, res) => {
  debugLog("DEBUG_SYSTEM_REQUEST", {
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  });

  try {
    // Check environment variables
    const envStatus = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_PRICE_ID: !!process.env.STRIPE_PRICE_ID,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Check database connection
    let dbStatus = "unknown";
    let dbError = null;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "connected";
    } catch (err: any) {
      dbStatus = "error";
      dbError = err.message;
    }

    // Get database info
    let dbInfo = null;
    try {
      const u = new URL(process.env.DATABASE_URL || "");
      dbInfo = {
        host: u.hostname,
        port: u.port,
        database: u.pathname.substring(1),
        protocol: u.protocol,
      };
    } catch {
      dbInfo = null;
    }

    // Get user count
    let userCount = 0;
    let activeUserCount = 0;
    try {
      userCount = await prisma.user.count();
      activeUserCount = await prisma.user.count({ where: { isActive: true } });
    } catch (err: any) {
      debugLog("DEBUG_SYSTEM_DB_COUNT_ERROR", { error: err.message });
    }

    const systemInfo = {
      timestamp: new Date().toISOString(),
      environment: envStatus,
      database: {
        status: dbStatus,
        error: dbError,
        info: dbInfo,
      },
      users: {
        total: userCount,
        active: activeUserCount,
        inactive: userCount - activeUserCount,
      },
      currentUser: {
        id: req.user!.id,
        role: req.user?.role,
      },
    };

    debugLog("DEBUG_SYSTEM_RESULT", systemInfo);

    res.json(systemInfo);
  } catch (err: any) {
    debugLog("DEBUG_SYSTEM_ERROR", {
      userId: req.user?.id,
      error: err?.message,
      stack: err?.stack,
    });

    res.status(500).json({
      error: "Failed to get system debug info",
      message: err?.message,
    });
  }
});

// Debug endpoint to simulate webhook (for testing)
router.post(
  "/debug/simulate-webhook",
  requireAuth,
  async (req: AuthRequest, res) => {
    debugLog("SIMULATE_WEBHOOK_REQUEST", {
      userId: req.user?.id,
      body: req.body,
      timestamp: new Date().toISOString(),
    });

    try {
      const { sessionId, clientReferenceId } = req.body;

      if (!sessionId || !clientReferenceId) {
        return res.status(400).json({
          error: "Missing sessionId or clientReferenceId",
          required: ["sessionId", "clientReferenceId"],
        });
      }

      const userId = parseInt(clientReferenceId, 10);

      if (isNaN(userId)) {
        return res.status(400).json({
          error: "Invalid clientReferenceId",
          clientReferenceId,
        });
      }

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

      debugLog("SIMULATE_WEBHOOK_USER_BEFORE", {
        userId,
        user: userBefore,
        exists: !!userBefore,
      });

      if (!userBefore) {
        return res.status(404).json({
          error: "User not found",
          userId,
        });
      }

      // Update user
      const updateResult = await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      });

      debugLog("SIMULATE_WEBHOOK_UPDATE_RESULT", {
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

      debugLog("SIMULATE_WEBHOOK_COMPLETE", {
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
      });

      res.json({
        success: true,
        message: "Webhook simulation completed",
        data: {
          sessionId,
          clientReferenceId,
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
        },
      });
    } catch (err: any) {
      debugLog("SIMULATE_WEBHOOK_ERROR", {
        userId: req.user?.id,
        error: err?.message,
        stack: err?.stack,
      });

      res.status(500).json({
        error: "Failed to simulate webhook",
        message: err?.message,
      });
    }
  }
);

export default router;

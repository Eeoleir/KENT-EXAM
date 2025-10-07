import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export interface AuthRequest extends Request {
  user?: { id: number; role: "USER" | "ADMIN" };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ message: "Server configuration error" });
      return;
    }

    const payload = jwt.verify(token, jwtSecret) as { userId: number };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(role: "USER" | "ADMIN") {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (role === "ADMIN" && req.user.role !== "ADMIN") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  };
}

// Helper function to extract token from request
function extractToken(req: AuthRequest): string | null {
  // Try Bearer token first
  const bearer = req.headers.authorization;
  if (bearer && bearer.startsWith("Bearer ")) {
    const token = bearer.split(" ")[1];
    return token || null;
  }

  // Fallback to cookie
  const cookies = req.cookies as { token?: string } | undefined;
  return cookies?.token ? cookies.token : null;
}

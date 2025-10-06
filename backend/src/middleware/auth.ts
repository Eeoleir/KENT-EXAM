import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: { id: number; role: "USER" | "ADMIN" };
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const bearer = req.headers.authorization;
  const token =
    (req as any).cookies?.token ||
    (bearer && bearer.startsWith("Bearer ") ? bearer.split(" ")[1] : undefined);
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number;
    };
    prisma.user
      .findUnique({ where: { id: payload.userId } })
      .then((user: { id: number; role: "USER" | "ADMIN" } | null) => {
        if (!user) return res.status(401).json({ message: "Unauthorized" });
        (req as AuthRequest).user = { id: user.id, role: user.role as any };
        next();
      })
      .catch(() => res.status(500).json({ message: "Server error" }));
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(role: "USER" | "ADMIN") {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (role === "ADMIN" && req.user.role !== "ADMIN")
      return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

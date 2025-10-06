"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function requireAuth(req, res, next) {
    const bearer = req.headers.authorization;
    const token = req.cookies?.token ||
        (bearer && bearer.startsWith("Bearer ") ? bearer.split(" ")[1] : undefined);
    if (!token)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        prisma.user
            .findUnique({ where: { id: payload.userId } })
            .then((user) => {
            if (!user)
                return res.status(401).json({ message: "Unauthorized" });
            req.user = { id: user.id, role: user.role };
            next();
        })
            .catch(() => res.status(500).json({ message: "Server error" }));
    }
    catch {
        return res.status(401).json({ message: "Invalid token" });
    }
}
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        if (role === "ADMIN" && req.user.role !== "ADMIN")
            return res.status(403).json({ message: "Forbidden" });
        next();
    };
}

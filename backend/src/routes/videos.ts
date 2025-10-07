import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// YouTube URL validation
function isYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const hostname = u.hostname.replace(/^www\./, "");

    if (!/(youtube\.com|youtu\.be)$/i.test(hostname)) {
      return false;
    }

    // Accept typical formats like https://www.youtube.com/watch?v=ID or https://youtu.be/ID
    if (hostname.includes("youtu.be")) {
      return u.pathname.length > 1;
    }

    if (hostname.includes("youtube.com")) {
      return !!(u.searchParams.get("v") || u.pathname.startsWith("/shorts/"));
    }

    return false;
  } catch {
    return false;
  }
}

// Validation schema
const addVideoSchema = z.object({
  url: z.string().url().min(6),
});

// List videos for the authenticated active subscriber
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { isActive: true },
    });

    if (!user?.isActive) {
      return res.status(402).json({ message: "Subscription required" });
    }

    const videos = await prisma.video.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add a YouTube URL
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { isActive: true },
    });

    if (!user?.isActive) {
      return res.status(402).json({ message: "Subscription required" });
    }

    const parse = addVideoSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const { url } = parse.data;

    if (!isYouTubeUrl(url)) {
      return res.status(400).json({ message: "Invalid YouTube URL" });
    }

    const created = await prisma.video.create({
      data: { url, userId: req.user!.id },
    });

    res.status(201).json(created);
  } catch (e: any) {
    // Unique composite constraint (url, userId)
    if (e.code === "P2002") {
      return res.status(409).json({ message: "Video already added" });
    }

    res.status(500).json({ message: "Server error" });
  }
});

export default router;

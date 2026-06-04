import { Router, Request, Response } from "express";
import { sanitizeInput } from "../lib/guards";
import prisma from "../db";

const router = Router();

const VALID_ROLES = ["user", "assistant"];

// GET /conversations — liệt kê tất cả sessions (cho log panel)
router.get("/", async (_req: Request, res: Response) => {
  try {
    // Lấy tất cả messages, group theo sessionId
    const messages = await prisma.conversationMessage.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Group by sessionId
    const sessionMap = new Map<string, {
      sessionId: string;
      firstUserMessage: string;
      messageCount: number;
      startedAt: Date;
      lastActivity: Date;
      lastLevel: string | null;
    }>();

    for (const msg of messages) {
      const existing = sessionMap.get(msg.sessionId);
      if (!existing) {
        const meta = msg.metadata as Record<string, unknown> | null;
        sessionMap.set(msg.sessionId, {
          sessionId: msg.sessionId,
          firstUserMessage: msg.role === "user" ? msg.content : "",
          messageCount: 1,
          startedAt: msg.createdAt,
          lastActivity: msg.createdAt,
          lastLevel: meta?.level as string ?? null,
        });
      } else {
        existing.messageCount++;
        if (!existing.firstUserMessage && msg.role === "user") {
          existing.firstUserMessage = msg.content;
        }
        if (msg.createdAt < existing.startedAt) existing.startedAt = msg.createdAt;
        if (msg.createdAt > existing.lastActivity) existing.lastActivity = msg.createdAt;
        const meta = msg.metadata as Record<string, unknown> | null;
        if (meta?.level) existing.lastLevel = meta.level as string;
      }
    }

    // Sort sessions by lastActivity (mới nhất trước)
    const sessions = Array.from(sessionMap.values())
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    res.json({ sessions });
  } catch (err) {
    console.error("[conversations GET all]", err);
    res.status(500).json({ error: "DB_ERROR", message: "Lỗi kết nối PostgreSQL." });
  }
});

// POST /conversations — lưu 1 lượt tin nhắn
router.post("/", async (req: Request, res: Response) => {
  const { sessionId, role, content, metadata } = req.body;

  if (!sessionId || !role || !content) {
    res.status(400).json({ error: "MISSING_FIELDS", message: "Thiếu sessionId, role hoặc content." });
    return;
  }
  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({ error: "INVALID_ROLE", message: "role phải là 'user' hoặc 'assistant'." });
    return;
  }

  const cleanContent = sanitizeInput(String(content));
  if (cleanContent.length === 0) {
    res.status(400).json({ error: "MISSING_FIELDS", message: "content không được để trống." });
    return;
  }
  if (cleanContent.length > 2000) {
    res.status(400).json({ error: "CONTENT_TOO_LONG", message: "content không được vượt quá 2000 ký tự." });
    return;
  }

  try {
    const msg = await prisma.conversationMessage.create({
      data: {
        sessionId: String(sessionId).trim(),
        role,
        content: cleanContent,
        metadata: metadata ?? undefined,
      },
    });
    res.status(201).json({ ok: true, messageId: msg.id });
  } catch (err) {
    console.error("[conversations POST]", err);
    res.status(500).json({ error: "DB_ERROR", message: "Lỗi kết nối PostgreSQL." });
  }
});

// GET /conversations/:sessionId — lấy toàn bộ lịch sử 1 session
router.get("/:sessionId", async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!sessionId || sessionId.trim().length === 0) {
    res.status(400).json({ error: "INVALID_SESSION", message: "sessionId không hợp lệ." });
    return;
  }

  try {
    const messages = await prisma.conversationMessage.findMany({
      where: { sessionId: sessionId.trim() },
      orderBy: { createdAt: "asc" },
    });
    res.json({ sessionId, messages });
  } catch (err) {
    console.error("[conversations GET]", err);
    res.status(500).json({ error: "DB_ERROR", message: "Lỗi kết nối PostgreSQL." });
  }
});

export default router;

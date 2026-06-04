import { Router, Request, Response } from "express";
import prisma from "../db";

const router = Router();

// POST /log
router.post("/", async (req: Request, res: Response) => {
  const { symptoms, aiLevel, aiSuggested, userAction, userSelected } = req.body;

  if (!symptoms || !aiLevel || !userAction) {
    res.status(400).json({ error: "MISSING_FIELDS", message: "Thiếu symptoms, aiLevel hoặc userAction." });
    return;
  }
  if (!["override", "retry"].includes(userAction)) {
    res.status(400).json({ error: "INVALID_ACTION", message: "userAction phải là 'override' hoặc 'retry'." });
    return;
  }

  try {
    const log = await prisma.triageLog.create({
      data: {
        symptoms,
        aiLevel,
        aiSuggested: aiSuggested ?? null,
        userAction,
        userSelected: userSelected ?? null,
      },
    });
    res.json({ ok: true, logId: log.id });
  } catch (err) {
    console.error("[log]", err);
    res.status(500).json({ error: "DB_ERROR", message: "Lỗi kết nối PostgreSQL." });
  }
});

export default router;

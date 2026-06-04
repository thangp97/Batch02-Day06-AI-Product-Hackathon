import { Router, Request, Response } from "express";
import { sanitizeInput } from "../lib/guards";
import prisma from "../db";

const router = Router();

// POST /feedback — gửi đánh giá
router.post("/", async (req: Request, res: Response) => {
  const { sessionId, bookingId, rating, comment } = req.body;

  if (rating === undefined || rating === null) {
    res.status(400).json({ error: "MISSING_FIELDS", message: "Thiếu rating." });
    return;
  }

  const parsedRating = parseInt(rating);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    res.status(400).json({ error: "INVALID_RATING", message: "rating phải là số nguyên từ 1 đến 5." });
    return;
  }

  // Validate bookingId nếu có
  let parsedBookingId: number | undefined;
  if (bookingId !== undefined && bookingId !== null) {
    parsedBookingId = parseInt(bookingId);
    if (isNaN(parsedBookingId)) {
      res.status(400).json({ error: "INVALID_ID", message: "bookingId không hợp lệ." });
      return;
    }
  }

  const cleanComment = comment ? sanitizeInput(String(comment)).slice(0, 1000) : undefined;

  try {
    // Kiểm tra bookingId tồn tại nếu được cung cấp
    if (parsedBookingId !== undefined) {
      const booking = await prisma.booking.findUnique({ where: { id: parsedBookingId } });
      if (!booking) {
        res.status(404).json({ error: "BOOKING_NOT_FOUND", message: "Booking không tồn tại." });
        return;
      }
    }

    const fb = await prisma.feedback.create({
      data: {
        sessionId: sessionId ? String(sessionId).trim() : undefined,
        bookingId: parsedBookingId ?? undefined,
        rating: parsedRating,
        comment: cleanComment ?? undefined,
      },
    });
    res.status(201).json({ ok: true, feedbackId: fb.id });
  } catch (err) {
    console.error("[feedback POST]", err);
    res.status(500).json({ error: "DB_ERROR", message: "Lỗi kết nối PostgreSQL." });
  }
});

// GET /feedback — danh sách feedback (dùng cho admin/demo)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { booking: { include: { slot: { include: { specialty: true } } } } },
    });
    res.json({ feedbacks });
  } catch (err) {
    console.error("[feedback GET]", err);
    res.status(500).json({ error: "DB_ERROR", message: "Lỗi kết nối PostgreSQL." });
  }
});

export default router;

import { Router, Request, Response } from "express";
import { sanitizeInput, isValidPhone } from "../lib/guards";
import prisma from "../db";

const router = Router();

// POST /bookings — đặt lịch khám
router.post("/", async (req: Request, res: Response) => {
  const { slotId, patientName: rawName, patientPhone: rawPhone, bookingType: rawType } = req.body;

  if (!slotId || !rawName || !rawPhone) {
    res.status(400).json({
      error: "MISSING_FIELDS",
      message: "Thiếu slotId, patientName hoặc patientPhone.",
    });
    return;
  }

  const parsedSlotId = parseInt(slotId);
  if (isNaN(parsedSlotId)) {
    res.status(400).json({ error: "INVALID_ID", message: "slotId không hợp lệ." });
    return;
  }

  const patientName  = sanitizeInput(String(rawName));
  const patientPhone = String(rawPhone).trim();
  const bookingType  = rawType === "followup" ? "followup" : "new";

  if (patientName.length === 0) {
    res.status(400).json({ error: "MISSING_FIELDS", message: "Tên bệnh nhân không được để trống." });
    return;
  }
  if (!isValidPhone(patientPhone)) {
    res.status(400).json({ error: "INVALID_PHONE", message: "Số điện thoại không hợp lệ (vd: 0901234567)." });
    return;
  }

  try {
    // Dùng transaction để check + book slot atomically
    const booking = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({ where: { id: parsedSlotId } });

      if (!slot) {
        throw { code: "SLOT_NOT_FOUND", status: 404, message: "Slot không tồn tại." };
      }
      if (!slot.available) {
        throw { code: "SLOT_UNAVAILABLE", status: 409, message: "Slot này đã được đặt, vui lòng chọn slot khác." };
      }

      // Đánh dấu slot đã được đặt
      await tx.slot.update({
        where: { id: parsedSlotId },
        data: { available: false },
      });

      return tx.booking.create({
        data: { slotId: parsedSlotId, patientName, patientPhone, bookingType },
        include: { slot: { include: { specialty: true } } },
      });
    });

    res.status(201).json({
      ok: true,
      bookingId: booking.id,
      detail: {
        bookingType:  booking.bookingType,
        specialty:    booking.slot.specialty.name,
        doctor:       booking.slot.doctor,
        scheduledAt:  booking.slot.scheduledAt,
        patientName:  booking.patientName,
        patientPhone: booking.patientPhone,
      },
    });
  } catch (err: any) {
    if (err.code && err.status) {
      res.status(err.status).json({ error: err.code, message: err.message });
      return;
    }
    console.error("[bookings]", err);
    res.status(500).json({ error: "DB_ERROR", message: "Lỗi kết nối PostgreSQL." });
  }
});

// GET /bookings/:id — xem chi tiết booking
router.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "INVALID_ID", message: "ID không hợp lệ." });
    return;
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { slot: { include: { specialty: true } } },
    });

    if (!booking) {
      res.status(404).json({ error: "BOOKING_NOT_FOUND", message: "Booking không tồn tại." });
      return;
    }

    res.json({
      bookingId:    booking.id,
      bookingType:  booking.bookingType,
      specialty:    booking.slot.specialty.name,
      doctor:       booking.slot.doctor,
      scheduledAt:  booking.slot.scheduledAt,
      patientName:  booking.patientName,
      patientPhone: booking.patientPhone,
      createdAt:    booking.createdAt,
    });
  } catch (err) {
    console.error("[bookings/:id]", err);
    res.status(500).json({ error: "DB_ERROR", message: "Lỗi kết nối PostgreSQL." });
  }
});

export default router;

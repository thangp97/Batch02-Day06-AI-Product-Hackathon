import { Router, Request, Response } from "express";
import prisma from "../db";

const router = Router();

// GET /specialties
router.get("/", async (_req: Request, res: Response) => {
  try {
    const specialties = await prisma.specialty.findMany({ orderBy: { id: "asc" } });
    res.json({ specialties });
  } catch (err) {
    console.error("[specialties]", err);
    res.status(500).json({ error: "DB_ERROR", message: "Lỗi kết nối PostgreSQL." });
  }
});

// GET /specialties/:id/slots
router.get("/:id/slots", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "INVALID_ID", message: "ID không hợp lệ." });
    return;
  }

  try {
    const specialty = await prisma.specialty.findUnique({ where: { id } });
    if (!specialty) {
      res.status(404).json({ error: "SPECIALTY_NOT_FOUND", message: "Chuyên khoa không tồn tại." });
      return;
    }

    const dateFilter = req.query.date as string | undefined;
    const slots = await prisma.slot.findMany({
      where: {
        specialtyId: id,
        ...(dateFilter && {
          scheduledAt: {
            gte: new Date(`${dateFilter}T00:00:00Z`),
            lt:  new Date(`${dateFilter}T23:59:59Z`),
          },
        }),
      },
      orderBy: { scheduledAt: "asc" },
    });

    res.json({ specialty, slots });
  } catch (err) {
    console.error("[specialties/:id/slots]", err);
    res.status(500).json({ error: "DB_ERROR", message: "Lỗi kết nối PostgreSQL." });
  }
});

export default router;

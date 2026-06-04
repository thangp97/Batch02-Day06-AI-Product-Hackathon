import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper: tạo ngày giờ theo giờ VN (UTC+7 → lưu UTC)
function vn(dateStr: string, hour: number, minute = 0): Date {
  // dateStr: "2026-06-05", hour theo giờ VN
  const utcHour = hour - 7;
  return new Date(`${dateStr}T${String(utcHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`);
}

async function main() {
  // --- Specialties ---
  const specialties = await Promise.all([
    prisma.specialty.upsert({ where: { code: "MAT" },         update: {}, create: { code: "MAT",         name: "Chuyên khoa Mắt" } }),
    prisma.specialty.upsert({ where: { code: "THAN_KINH" },   update: {}, create: { code: "THAN_KINH",   name: "Thần kinh" } }),
    prisma.specialty.upsert({ where: { code: "NOI_TONG_QUAT" }, update: {}, create: { code: "NOI_TONG_QUAT", name: "Nội tổng quát" } }),
    prisma.specialty.upsert({ where: { code: "TIEU_HOA" },    update: {}, create: { code: "TIEU_HOA",    name: "Tiêu hóa" } }),
    prisma.specialty.upsert({ where: { code: "TIM_MACH" },    update: {}, create: { code: "TIM_MACH",    name: "Tim mạch" } }),
    prisma.specialty.upsert({ where: { code: "CO_XUONG_KHOP" }, update: {}, create: { code: "CO_XUONG_KHOP", name: "Cơ xương khớp" } }),
  ]);
  console.log(`✓ Seeded ${specialties.length} specialties`);

  const sm = Object.fromEntries(specialties.map((s) => [s.code, s.id]));

  // --- Slots (xóa theo đúng thứ tự FK: feedback → booking → slot) ---
  await prisma.feedback.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();

  type SlotInput = { code: string; doctor: string; scheduledAt: Date; available?: boolean };

  const slots: SlotInput[] = [
    // ── Chuyên khoa Mắt ──────────────────────────────────────────
    { code: "MAT", doctor: "PGS.TS. Nguyễn Thị Lan Anh",  scheduledAt: vn("2026-06-05", 8, 0) },
    { code: "MAT", doctor: "PGS.TS. Nguyễn Thị Lan Anh",  scheduledAt: vn("2026-06-05", 9, 0) },
    { code: "MAT", doctor: "BS.CK2 Trần Văn Minh",         scheduledAt: vn("2026-06-05", 14, 0) },
    { code: "MAT", doctor: "BS.CK2 Trần Văn Minh",         scheduledAt: vn("2026-06-06", 8, 30), available: false },
    { code: "MAT", doctor: "ThS.BS Lê Thị Thu Hằng",       scheduledAt: vn("2026-06-06", 10, 0) },
    { code: "MAT", doctor: "ThS.BS Lê Thị Thu Hằng",       scheduledAt: vn("2026-06-07", 13, 30) },

    // ── Thần kinh ────────────────────────────────────────────────
    { code: "THAN_KINH", doctor: "GS.TS. Phạm Đình Lộc",      scheduledAt: vn("2026-06-05", 7, 30) },
    { code: "THAN_KINH", doctor: "GS.TS. Phạm Đình Lộc",      scheduledAt: vn("2026-06-05", 8, 30), available: false },
    { code: "THAN_KINH", doctor: "TS.BS Hoàng Minh Đức",       scheduledAt: vn("2026-06-06", 9, 0) },
    { code: "THAN_KINH", doctor: "TS.BS Hoàng Minh Đức",       scheduledAt: vn("2026-06-06", 15, 0) },
    { code: "THAN_KINH", doctor: "BS.CK1 Vũ Thị Bích Ngọc",   scheduledAt: vn("2026-06-07", 10, 0) },

    // ── Nội tổng quát ────────────────────────────────────────────
    { code: "NOI_TONG_QUAT", doctor: "BS.CK2 Nguyễn Văn Hùng",   scheduledAt: vn("2026-06-05", 8, 0) },
    { code: "NOI_TONG_QUAT", doctor: "BS.CK2 Nguyễn Văn Hùng",   scheduledAt: vn("2026-06-05", 10, 0) },
    { code: "NOI_TONG_QUAT", doctor: "ThS.BS Trần Thị Kim Oanh",  scheduledAt: vn("2026-06-05", 14, 30), available: false },
    { code: "NOI_TONG_QUAT", doctor: "ThS.BS Trần Thị Kim Oanh",  scheduledAt: vn("2026-06-06", 8, 0) },
    { code: "NOI_TONG_QUAT", doctor: "BS.CK1 Lê Quang Vinh",      scheduledAt: vn("2026-06-07", 9, 0) },
    { code: "NOI_TONG_QUAT", doctor: "BS.CK1 Lê Quang Vinh",      scheduledAt: vn("2026-06-07", 14, 0) },

    // ── Tiêu hóa ─────────────────────────────────────────────────
    { code: "TIEU_HOA", doctor: "PGS.TS. Đặng Thị Minh Châu", scheduledAt: vn("2026-06-05", 9, 30) },
    { code: "TIEU_HOA", doctor: "PGS.TS. Đặng Thị Minh Châu", scheduledAt: vn("2026-06-06", 9, 30), available: false },
    { code: "TIEU_HOA", doctor: "BS.CK2 Bùi Văn Thắng",        scheduledAt: vn("2026-06-06", 14, 0) },
    { code: "TIEU_HOA", doctor: "ThS.BS Ngô Thị Hải Yến",      scheduledAt: vn("2026-06-07", 8, 0) },
    { code: "TIEU_HOA", doctor: "ThS.BS Ngô Thị Hải Yến",      scheduledAt: vn("2026-06-07", 15, 30) },

    // ── Tim mạch ─────────────────────────────────────────────────
    { code: "TIM_MACH", doctor: "GS.TS. Phan Đình Phùng",      scheduledAt: vn("2026-06-05", 7, 30) },
    { code: "TIM_MACH", doctor: "GS.TS. Phan Đình Phùng",      scheduledAt: vn("2026-06-06", 7, 30), available: false },
    { code: "TIM_MACH", doctor: "BS.CK2 Đinh Thị Lan Phương",  scheduledAt: vn("2026-06-06", 13, 0) },
    { code: "TIM_MACH", doctor: "TS.BS Lưu Văn Khánh",         scheduledAt: vn("2026-06-07", 8, 0) },
    { code: "TIM_MACH", doctor: "TS.BS Lưu Văn Khánh",         scheduledAt: vn("2026-06-07", 16, 0) },

    // ── Cơ xương khớp ────────────────────────────────────────────
    { code: "CO_XUONG_KHOP", doctor: "BS.CK2 Dương Thị Thanh Hoa", scheduledAt: vn("2026-06-05", 11, 0) },
    { code: "CO_XUONG_KHOP", doctor: "BS.CK2 Dương Thị Thanh Hoa", scheduledAt: vn("2026-06-06", 11, 0) },
    { code: "CO_XUONG_KHOP", doctor: "ThS.BS Cao Văn Nghĩa",        scheduledAt: vn("2026-06-06", 15, 30), available: false },
    { code: "CO_XUONG_KHOP", doctor: "BS.CK1 Tống Thị Mỹ Linh",    scheduledAt: vn("2026-06-07", 10, 30) },
    { code: "CO_XUONG_KHOP", doctor: "BS.CK1 Tống Thị Mỹ Linh",    scheduledAt: vn("2026-06-07", 14, 30) },
  ];

  const result = await prisma.slot.createMany({
    data: slots.map(({ code, doctor, scheduledAt, available = true }) => ({
      specialtyId: sm[code],
      doctor,
      scheduledAt,
      available,
    })),
  });

  console.log(`✓ Seeded ${result.count} slots`);
  console.log(`  (${slots.filter((s) => s.available === false).length} marked unavailable)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

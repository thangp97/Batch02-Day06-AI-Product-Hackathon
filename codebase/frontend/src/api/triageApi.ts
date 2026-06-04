import axios from "axios"
import type { TriageResponse, Specialty, Slot, FeedbackPayload, BookingResponse } from "../types"

const MOCK_MODE = false  // false = gọi backend thật (Docker)

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000/api"

const delay = (ms = 900) => new Promise((r) => setTimeout(r, ms))

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SPECIALTIES: Specialty[] = [
  { id: 1, code: "MAT",          name: "Chuyên khoa Mắt" },
  { id: 2, code: "THAN_KINH",    name: "Thần kinh" },
  { id: 3, code: "NOI_TONG_QUAT",name: "Nội tổng quát" },
  { id: 4, code: "TIEU_HOA",     name: "Tiêu hóa" },
  { id: 5, code: "TIM_MACH",     name: "Tim mạch" },
  { id: 6, code: "CO_XUONG_KHOP",name: "Cơ xương khớp" },
]

function mockSlotsFor(specialtyId: number): Slot[] {
  const doctors: Record<number, string[]> = {
    1: ["BS. Nguyễn Văn A", "BS. Trần Thị B"],
    2: ["BS. Lê Văn C", "BS. Phạm Thị D"],
    3: ["BS. Đỗ Văn E", "BS. Hoàng Thị F"],
    4: ["BS. Vũ Văn G", "BS. Bùi Thị H"],
    5: ["BS. Đinh Văn I", "BS. Ngô Thị J"],
    6: ["BS. Trịnh Văn K", "BS. Lý Thị L"],
  }
  const names = doctors[specialtyId] ?? ["BS. Nguyễn Văn X", "BS. Trần Thị Y"]
  return [
    { id: 1, doctor: names[0], scheduledAt: "2026-06-07T09:00:00Z", available: true },
    { id: 2, doctor: names[1], scheduledAt: "2026-06-07T14:00:00Z", available: false },
    { id: 3, doctor: names[0], scheduledAt: "2026-06-08T09:00:00Z", available: true },
  ]
}

function mockTriage(symptoms: string): TriageResponse {
  const s = symptoms.toLowerCase()

  // Red-flag keywords
  const redFlags = ["đau ngực", "khó thở", "tay trái tê", "tê tay", "ngất", "sắp ngất", "đột quỵ", "mất ý thức"]
  if (redFlags.some((kw) => s.includes(kw))) {
    return {
      level: "red-flag",
      message: "Triệu chứng của bạn có thể là dấu hiệu cấp cứu. Hãy đến cơ sở y tế gần nhất ngay lập tức hoặc gọi 115.",
      question: null,
      specialty: null,
      slots: null,
      hotline: "115",
      disclaimer: "Đây là gợi ý tham khảo — gặp bác sĩ để xác nhận.",
    }
  }

  // Low-confidence keywords
  const lowConf = ["mệt mỏi", "mệt", "đau đầu", "chóng mặt", "khó ngủ", "uể oải"]
  if (lowConf.some((kw) => s.includes(kw)) && !s.includes("mắt") && !s.includes("bụng")) {
    return {
      level: "low-confidence",
      message: "Triệu chứng của bạn có thể thuộc nhiều chuyên khoa. Cho tôi hỏi thêm một chút.",
      question: "Bạn có bị chóng mặt hoặc buồn nôn kèm theo không?",
      specialty: null,
      slots: null,
      disclaimer: "Đây là gợi ý tham khảo — gặp bác sĩ để xác nhận.",
    }
  }

  // Clear — map keywords to specialty
  let specialty = MOCK_SPECIALTIES[2] // default: Nội tổng quát
  if (s.includes("mắt"))                              specialty = MOCK_SPECIALTIES[0]
  else if (s.includes("thần kinh") || s.includes("tê bì")) specialty = MOCK_SPECIALTIES[1]
  else if (s.includes("bụng") || s.includes("tiêu hóa"))   specialty = MOCK_SPECIALTIES[3]
  else if (s.includes("tim") || s.includes("huyết áp"))    specialty = MOCK_SPECIALTIES[4]
  else if (s.includes("xương") || s.includes("khớp"))      specialty = MOCK_SPECIALTIES[5]

  return {
    level: "clear",
    message: `Triệu chứng của bạn phù hợp với ${specialty.name}.`,
    question: null,
    specialty,
    slots: mockSlotsFor(specialty.id),
    disclaimer: "Đây là gợi ý tham khảo — gặp bác sĩ để xác nhận.",
  }
}

// ─── API functions ─────────────────────────────────────────────────────────────

export async function postTriage(symptoms: string): Promise<TriageResponse> {
  if (MOCK_MODE) {
    await delay()
    return mockTriage(symptoms)
  }
  const res = await axios.post(`${BASE}/triage`, { symptoms })
  return res.data
}

export async function postFollowup(
  symptoms: string,
  answer: string
): Promise<TriageResponse> {
  if (MOCK_MODE) {
    await delay()
    const s = (symptoms + " " + answer).toLowerCase()
    // Nếu câu trả lời gợi ý red-flag thì escalate
    if (s.includes("ngất") || s.includes("đau ngực")) {
      return {
        level: "red-flag",
        message: "Triệu chứng của bạn có thể là dấu hiệu cấp cứu. Hãy gọi 115 ngay.",
        question: null,
        specialty: null,
        slots: null,
        hotline: "115",
        disclaimer: "Đây là gợi ý tham khảo — gặp bác sĩ để xác nhận.",
      }
    }
    // Fallback: Nội tổng quát
    const specialty = MOCK_SPECIALTIES[2]
    return {
      level: "clear",
      message: `Dựa trên triệu chứng, bạn nên khám ${specialty.name} trước để được tư vấn thêm.`,
      question: null,
      specialty,
      slots: mockSlotsFor(specialty.id),
      disclaimer: "Đây là gợi ý tham khảo — gặp bác sĩ để xác nhận.",
    }
  }
  const res = await axios.post(`${BASE}/triage/followup`, { symptoms, answer })
  return res.data
}

export async function getSpecialties(): Promise<Specialty[]> {
  if (MOCK_MODE) {
    await delay(300)
    return MOCK_SPECIALTIES
  }
  const res = await axios.get(`${BASE}/specialties`)
  return res.data.specialties
}

export async function getSlotsBySpecialty(
  specialtyId: number
): Promise<{ specialty: Specialty; slots: Slot[] }> {
  if (MOCK_MODE) {
    await delay(400)
    const specialty = MOCK_SPECIALTIES.find((s) => s.id === specialtyId) ?? MOCK_SPECIALTIES[2]
    return { specialty, slots: mockSlotsFor(specialtyId) }
  }
  const res = await axios.get(`${BASE}/specialties/${specialtyId}/slots`)
  return res.data
}

export async function getDoctorsBySpecialty(specialtyId: number): Promise<string[]> {
  if (MOCK_MODE) {
    await delay(300)
    const doctors: Record<number, string[]> = {
      1: ["BS. Nguyễn Văn A", "BS. Trần Thị B"],
      2: ["BS. Lê Văn C", "BS. Phạm Thị D"],
      3: ["BS. Đỗ Văn E", "BS. Hoàng Thị F"],
      4: ["BS. Vũ Văn G", "BS. Bùi Thị H"],
      5: ["BS. Đinh Văn I", "BS. Ngô Thị J"],
      6: ["BS. Trịnh Văn K", "BS. Lý Thị L"],
    }
    return doctors[specialtyId] ?? []
  }
  const res = await axios.get(`${BASE}/specialties/${specialtyId}/doctors`)
  return res.data.doctors
}

export async function getSlotsByDoctor(
  specialtyId: number,
  doctor: string
): Promise<{ specialty: Specialty; slots: Slot[] }> {
  if (MOCK_MODE) {
    await delay(400)
    const specialty = MOCK_SPECIALTIES.find((s) => s.id === specialtyId) ?? MOCK_SPECIALTIES[2]
    return { specialty, slots: mockSlotsFor(specialtyId).filter((s) => s.doctor === doctor) }
  }
  const res = await axios.get(`${BASE}/specialties/${specialtyId}/slots`, { params: { doctor } })
  return res.data
}

export async function postLog(payload: {
  symptoms: string
  aiLevel: string
  aiSuggested: string | null
  userAction: "override" | "retry"
  userSelected?: string | null
}): Promise<void> {
  if (MOCK_MODE) {
    console.log("[mock log]", payload)
    return
  }
  await axios.post(`${BASE}/log`, payload).catch(() => {})
}

export async function postFeedback(payload: FeedbackPayload): Promise<void> {
  if (MOCK_MODE) {
    console.log("[mock feedback]", payload)
    return
  }
  // Build comment từ correctSpecialty + note
  const parts: string[] = []
  if (payload.correctSpecialty) parts.push(`Chuyên khoa đúng: ${payload.correctSpecialty}`)
  if (payload.note) parts.push(payload.note)

  await axios.post(`${BASE}/feedback`, {
    rating: payload.rating,
    comment: parts.join(" — ") || undefined,
    bookingId: payload.bookingId ?? undefined,
  }).catch(() => {})
}

export async function postBooking(payload: {
  slotId: number
  patientName: string
  patientPhone: string
  bookingType?: "new" | "followup"
}): Promise<BookingResponse> {
  if (MOCK_MODE) {
    await delay(700)
    return { ok: true, bookingId: Math.floor(Math.random() * 1000) + 1 }
  }
  const res = await axios.post(`${BASE}/bookings`, payload)
  return res.data
}

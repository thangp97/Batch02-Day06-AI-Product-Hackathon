export type TriageLevel =
  | "clear"
  | "low-confidence"
  | "red-flag"
  | "out-of-scope"
  | "booking-prompt"
  | "followup-intent"
  | "greeting"

export type Specialty = {
  id: number
  code: string
  name: string
}

export type Slot = {
  id: number
  doctor: string
  scheduledAt: string
  available: boolean
}

export type TriageResponse = {
  level: TriageLevel
  message: string
  question: string | null
  specialty: Specialty | null
  slots: Slot[] | null
  hotline?: string
  mentalHealthHotline?: string
  disclaimer: string | null
}

export type MessageRole = "user" | "ai"

export type Message = {
  id: string
  role: MessageRole
  content: string
  triageData?: TriageResponse
}

export type Phase =
  | "idle"
  | "loading"
  | "clear"
  | "low-confidence"
  | "low-confidence-loading"
  | "red-flag"
  | "override"
  | "followup-booking"
  | "booking-form"
  | "booking-loading"
  | "booked"

export type FeedbackPayload = {
  symptoms: string
  aiLevel: string
  aiSuggested: string | null
  correctSpecialty: string | null
  note: string
  rating: number
  bookingId?: number | null
}

export type BookingResponse = {
  ok: boolean
  bookingId: number
}

export type ConversationSession = {
  sessionId: string
  firstUserMessage: string
  messageCount: number
  startedAt: string
  lastActivity: string
  lastLevel: string | null
}

export type ConversationLog = {
  id: number
  sessionId: string
  role: "user" | "assistant"
  content: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

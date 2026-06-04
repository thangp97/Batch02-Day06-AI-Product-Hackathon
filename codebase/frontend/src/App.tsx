import { useEffect, useRef, useState } from "react"
import type { Message, Phase, Specialty, Slot, TriageResponse, FeedbackPayload } from "./types"
import {
  postTriage,
  postFollowup,
  getSpecialties,
  postLog,
  postFeedback,
  postBooking,
} from "./api/triageApi"
import ChatBubble from "./components/ChatBubble"
import ChatInput from "./components/ChatInput"
import LoadingBubble from "./components/LoadingBubble"
import ClearCard from "./components/ClearCard"
import RedFlagBanner from "./components/RedFlagBanner"
import FollowupInput from "./components/FollowupInput"
import OverridePanel from "./components/OverridePanel"
import BookedCard from "./components/BookedCard"
import BookingModal from "./components/BookingModal"
import FeedbackModal from "./components/FeedbackModal"

type ConversationState = {
  phase: Phase
  symptoms: string
  messages: Message[]
  lastTriage: TriageResponse | null
  specialties: Specialty[]
  // Booking
  pendingSlot: Slot | null
  pendingSpecialty: Specialty | null
  bookedSpecialty: Specialty | null
  bookedSlot: Slot | null
  bookingId: number | null
  followupUsed: boolean
  // Modals
  showFeedback: boolean
}

const INIT_STATE: ConversationState = {
  phase: "idle",
  symptoms: "",
  messages: [],
  lastTriage: null,
  specialties: [],
  pendingSlot: null,
  pendingSpecialty: null,
  bookedSpecialty: null,
  bookedSlot: null,
  bookingId: null,
  followupUsed: false,
  showFeedback: false,
}

const HINTS = [
  "đau mắt đỏ, chảy nước mắt 2 ngày",
  "hay mệt mỏi, đôi khi đau đầu",
  "đau ngực, khó thở, tay trái tê",
]

function uid() {
  return Math.random().toString(36).slice(2)
}

export default function App() {
  const [state, setState] = useState<ConversationState>(INIT_STATE)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [state.messages, state.phase])

  function addMessage(msg: Omit<Message, "id">) {
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, { ...msg, id: uid() }],
    }))
  }

  function reset() {
    setState(INIT_STATE)
  }

  /* ── Triage ── */
  async function handleSymptomSubmit(symptoms: string) {
    addMessage({ role: "user", content: symptoms })
    setState((prev) => ({ ...prev, phase: "loading", symptoms }))
    try {
      const triage = await postTriage(symptoms)
      handleTriageResponse(triage, symptoms)
    } catch {
      addMessage({ role: "ai", content: "Có lỗi xảy ra khi kết nối server. Vui lòng thử lại." })
      setState((prev) => ({ ...prev, phase: "idle" }))
    }
  }

  function handleTriageResponse(triage: TriageResponse, symptoms: string) {
    addMessage({ role: "ai", content: triage.message, triageData: triage })
    if (triage.level === "red-flag") {
      setState((prev) => ({ ...prev, phase: "red-flag", lastTriage: triage }))
      return
    }
    if (triage.level === "low-confidence") {
      setState((prev) => ({ ...prev, phase: "low-confidence", lastTriage: triage, symptoms }))
      return
    }
    setState((prev) => ({ ...prev, phase: "clear", lastTriage: triage }))
  }

  /* ── Followup ── */
  async function handleFollowupSubmit(answer: string) {
    addMessage({ role: "user", content: answer })
    setState((prev) => ({ ...prev, phase: "low-confidence-loading", followupUsed: true }))
    try {
      const triage = await postFollowup(state.symptoms, answer)
      handleTriageResponse(triage, state.symptoms)
    } catch {
      addMessage({ role: "ai", content: "Có lỗi xảy ra. Vui lòng thử lại." })
      setState((prev) => ({ ...prev, phase: "idle" }))
    }
  }

  /* ── Override ── */
  async function handleOverride() {
    let specialties = state.specialties
    if (specialties.length === 0) {
      specialties = await getSpecialties().catch(() => [])
    }
    setState((prev) => ({ ...prev, phase: "override", specialties }))
    postLog({
      symptoms: state.symptoms,
      aiLevel: state.lastTriage?.level ?? "clear",
      aiSuggested: state.lastTriage?.specialty?.name ?? null,
      userAction: "override",
    })
  }

  function handleRetry() {
    postLog({
      symptoms: state.symptoms,
      aiLevel: state.lastTriage?.level ?? "clear",
      aiSuggested: state.lastTriage?.specialty?.name ?? null,
      userAction: "retry",
    })
    reset()
  }

  /* ── Booking ── */
  function handleInitiateBook(slot: Slot, specialty: Specialty) {
    setState((prev) => ({
      ...prev,
      pendingSlot: slot,
      pendingSpecialty: specialty,
      phase: "booking-form",
    }))
  }

  function handleBookFromClear(slot: Slot) {
    if (!state.lastTriage?.specialty) return
    handleInitiateBook(slot, state.lastTriage.specialty)
  }

  function handleCancelBooking() {
    setState((prev) => ({
      ...prev,
      pendingSlot: null,
      pendingSpecialty: null,
      phase: "clear",
    }))
  }

  async function handleConfirmBooking(patientName: string, patientPhone: string) {
    if (!state.pendingSlot || !state.pendingSpecialty) return
    setState((prev) => ({ ...prev, phase: "booking-loading" }))
    try {
      const result = await postBooking({
        slotId: state.pendingSlot!.id,
        patientName,
        patientPhone,
      })
      setState((prev) => ({
        ...prev,
        phase: "booked",
        bookedSpecialty: prev.pendingSpecialty,
        bookedSlot: prev.pendingSlot,
        bookingId: result.bookingId,
        pendingSlot: null,
        pendingSpecialty: null,
      }))
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Không thể đặt lịch. Slot có thể đã được đặt, vui lòng chọn slot khác."
      addMessage({ role: "ai", content: msg })
      setState((prev) => ({
        ...prev,
        phase: "clear",
        pendingSlot: null,
        pendingSpecialty: null,
      }))
    }
  }

  /* ── Feedback ── */
  function handleOpenFeedback() {
    setState((prev) => ({ ...prev, showFeedback: true }))
  }

  function handleCloseFeedback() {
    setState((prev) => ({ ...prev, showFeedback: false }))
  }

  async function handleFeedbackSubmit(payload: FeedbackPayload) {
    await postFeedback({ ...payload, bookingId: state.bookingId })
    setState((prev) => ({ ...prev, showFeedback: false }))
  }

  /* ── Render helpers ── */
  const isLoading =
    state.phase === "loading" ||
    state.phase === "low-confidence-loading" ||
    state.phase === "booking-loading"
  const isTerminal = state.phase === "booked" || state.phase === "red-flag"
  const showMainInput =
    !isTerminal &&
    state.phase !== "low-confidence" &&
    state.phase !== "low-confidence-loading" &&
    state.phase !== "booking-form" &&
    state.phase !== "booking-loading"

  return (
    <>
      {/* Background */}
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse 90% 70% at 50% -10%, #0a1a3a 0%, #050d1a 65%)",
        }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,212,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.035) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        {/* Chat container */}
        <div
          className="glass w-full max-w-lg rounded-3xl flex flex-col overflow-hidden relative"
          style={{ height: "90vh" }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex-shrink-0 flex items-center gap-3"
            style={{
              borderBottom: "1px solid rgba(0,212,255,0.12)",
              background: "rgba(5,15,40,0.85)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
              style={{
                background: "linear-gradient(135deg, rgba(0,212,255,0.18), rgba(0,85,204,0.25))",
                border: "1px solid rgba(0,212,255,0.25)",
                boxShadow: "0 0 14px rgba(0,212,255,0.2)",
              }}
            >
              ⬡
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-sm tracking-widest uppercase" style={{ color: "#e0f0ff", letterSpacing: "0.12em" }}>
                Triage AI
              </h1>
              <p className="text-xs" style={{ color: "rgba(224,240,255,0.38)" }}>
                Gợi ý chuyên khoa từ triệu chứng
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ff9d", boxShadow: "0 0 6px #00ff9d" }} />
              <span className="text-xs" style={{ color: "rgba(0,255,157,0.7)" }}>ONLINE</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
            {/* Welcome */}
            {state.messages.length === 0 && (
              <div className="text-center py-8 px-5 animate-fade-in">
                <p className="text-4xl mb-3" style={{ filter: "drop-shadow(0 0 10px rgba(0,212,255,0.5))" }}>⬡</p>
                <p className="text-sm font-semibold mb-1" style={{ color: "#e0f0ff" }}>
                  Xin chào! Tôi có thể giúp bạn
                </p>
                <p className="text-xs" style={{ color: "rgba(224,240,255,0.38)" }}>
                  Nhập triệu chứng để nhận gợi ý chuyên khoa phù hợp
                </p>
                <div className="mt-5 flex flex-wrap gap-2 justify-center">
                  {HINTS.map((hint) => (
                    <button
                      key={hint}
                      onClick={() => handleSymptomSubmit(hint)}
                      className="text-xs px-3 py-1.5 rounded-full transition-all"
                      style={{
                        background: "rgba(0,212,255,0.08)",
                        border: "1px solid rgba(0,212,255,0.18)",
                        color: "rgba(0,212,255,0.8)",
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.15)"
                        ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.35)"
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.08)"
                        ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.18)"
                      }}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat history */}
            {state.messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}

            {/* Loading */}
            {isLoading && <LoadingBubble />}

            {/* Clear */}
            {state.phase === "clear" && state.lastTriage?.specialty && (
              <ClearCard
                specialty={state.lastTriage.specialty}
                slots={state.lastTriage.slots ?? []}
                disclaimer={state.lastTriage.disclaimer}
                onBook={handleBookFromClear}
                onRetry={handleRetry}
                onOverride={handleOverride}
                onFeedback={handleOpenFeedback}
              />
            )}

            {/* Red-flag */}
            {state.phase === "red-flag" && state.lastTriage && (
              <RedFlagBanner
                message={state.lastTriage.message}
                hotline={state.lastTriage.hotline ?? "115"}
                disclaimer={state.lastTriage.disclaimer}
                onRetry={handleRetry}
                onFeedback={handleOpenFeedback}
              />
            )}

            {/* Low-confidence */}
            {state.phase === "low-confidence" && state.lastTriage?.question && (
              <FollowupInput
                question={state.lastTriage.question}
                disclaimer={state.lastTriage.disclaimer}
                onSubmit={handleFollowupSubmit}
                onFeedback={handleOpenFeedback}
              />
            )}
            {state.phase === "low-confidence-loading" && state.lastTriage?.question && (
              <FollowupInput
                question={state.lastTriage.question}
                disclaimer={state.lastTriage.disclaimer}
                disabled
                onSubmit={() => {}}
                onFeedback={handleOpenFeedback}
              />
            )}

            {/* Override */}
            {state.phase === "override" && (
              <OverridePanel
                specialties={state.specialties}
                onBook={(specialty, slot) => handleInitiateBook(slot, specialty)}
                onRetry={handleRetry}
                onFeedback={handleOpenFeedback}
              />
            )}

            {/* Booked */}
            {state.phase === "booked" && state.bookedSpecialty && state.bookedSlot && (
              <BookedCard
                specialty={state.bookedSpecialty}
                slot={state.bookedSlot}
                bookingId={state.bookingId}
                onReset={reset}
                onFeedback={handleOpenFeedback}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Main input */}
          {showMainInput && (
            <ChatInput
              onSubmit={handleSymptomSubmit}
              disabled={isLoading}
              placeholder={
                state.phase === "override"
                  ? "Hoặc nhập lại triệu chứng..."
                  : "Nhập triệu chứng của bạn..."
              }
            />
          )}

          {/* Reset for terminal states */}
          {isTerminal && (
            <div
              className="p-4 flex-shrink-0"
              style={{ borderTop: "1px solid rgba(0,212,255,0.1)", background: "rgba(5,13,26,0.8)" }}
            >
              <button onClick={reset} className="btn-ghost w-full py-2.5 text-sm">
                Bắt đầu lại
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Booking modal */}
      <BookingModal
        isOpen={state.phase === "booking-form" || state.phase === "booking-loading"}
        slot={state.pendingSlot}
        specialty={state.pendingSpecialty}
        loading={state.phase === "booking-loading"}
        onConfirm={handleConfirmBooking}
        onCancel={handleCancelBooking}
      />

      {/* Feedback modal */}
      <FeedbackModal
        isOpen={state.showFeedback}
        symptoms={state.symptoms}
        aiLevel={state.lastTriage?.level ?? "clear"}
        aiSuggested={state.lastTriage?.specialty?.name ?? null}
        bookingId={state.bookingId}
        onClose={handleCloseFeedback}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  )
}

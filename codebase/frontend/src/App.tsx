import { useEffect, useRef, useState } from "react"
import type { Message, Phase, Specialty, Slot, TriageResponse, FeedbackPayload } from "./types"
import {
  postTriage, postFollowup, getSpecialties, postLog, postFeedback, postBooking, postConversation,
} from "./api/triageApi"
import ChatBubble from "./components/ChatBubble"
import ChatInput from "./components/ChatInput"
import LoadingBubble from "./components/LoadingBubble"
import ClearCard from "./components/ClearCard"
import RedFlagBanner from "./components/RedFlagBanner"
import FollowupInput from "./components/FollowupInput"
import OverridePanel from "./components/OverridePanel"
import FollowupBookingPanel from "./components/FollowupBookingPanel"
import BookedCard from "./components/BookedCard"
import BookingModal from "./components/BookingModal"
import FeedbackModal from "./components/FeedbackModal"
import LogPanel from "./components/LogPanel"
import type { LogPanelHandle } from "./components/LogPanel"

type ConversationState = {
  phase: Phase
  sessionId: string
  symptoms: string
  messages: Message[]
  lastTriage: TriageResponse | null
  specialties: Specialty[]
  pendingSlot: Slot | null
  pendingSpecialty: Specialty | null
  pendingBookingType: "new" | "followup"
  bookedSpecialty: Specialty | null
  bookedSlot: Slot | null
  bookingId: number | null
  followupUsed: boolean
  showFeedback: boolean
}

function uid() { return Math.random().toString(36).slice(2) }

const INIT_STATE: ConversationState = {
  phase: "idle", sessionId: uid(), symptoms: "", messages: [], lastTriage: null,
  specialties: [], pendingSlot: null, pendingSpecialty: null,
  pendingBookingType: "new",
  bookedSpecialty: null, bookedSlot: null, bookingId: null,
  followupUsed: false, showFeedback: false,
}

const HINTS = [
  "Mắt đỏ, chảy nước mắt 2 ngày",
  "Hay mệt mỏi, đôi khi đau đầu",
  "Đau ngực, khó thở, tay trái tê",
  "Tôi muốn tái khám",
]

export default function App() {
  const [state, setState] = useState<ConversationState>(INIT_STATE)
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") ?? "light"
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const logPanelRef = useRef<LogPanelHandle>(null)
  const [logPanelOpen, setLogPanelOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [state.messages, state.phase])

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"))
  }

  function addMessage(msg: Omit<Message, "id">) {
    setState((prev) => ({ ...prev, messages: [...prev.messages, { ...msg, id: uid() }] }))
    postConversation({
      sessionId: state.sessionId,
      role: msg.role === "ai" ? "assistant" : "user",
      content: msg.content,
      ...(msg.triageData && {
        metadata: {
          level: msg.triageData.level,
          specialtyCode: msg.triageData.specialty?.code ?? null,
        },
      }),
    }).then(() => {
      // Auto-refresh log panel sau khi lưu message
      logPanelRef.current?.refresh()
    })
  }

  function reset() { setState({ ...INIT_STATE, sessionId: uid() }) }

  /* ── Triage ── */
  async function handleSymptomSubmit(symptoms: string) {
    addMessage({ role: "user", content: symptoms })
    setState((prev) => ({ ...prev, phase: "loading", symptoms }))
    try {
      const triage = await postTriage(symptoms, state.sessionId)
      handleTriageResponse(triage, symptoms)
    } catch {
      addMessage({ role: "ai", content: "Có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại." })
      setState((prev) => ({ ...prev, phase: "idle" }))
    }
  }

  async function handleTriageResponse(triage: TriageResponse, symptoms: string) {
    addMessage({ role: "ai", content: triage.message, triageData: triage })

    if (triage.level === "red-flag") {
      setState((prev) => ({ ...prev, phase: "red-flag", lastTriage: triage }))
      return
    }
    if (triage.level === "low-confidence") {
      setState((prev) => ({ ...prev, phase: "low-confidence", lastTriage: triage, symptoms }))
      return
    }
    // out-of-scope, booking-prompt, hoặc greeting → giữ idle để user tiếp tục nhập
    if (triage.level === "out-of-scope" || triage.level === "booking-prompt" || triage.level === "greeting") {
      setState((prev) => ({ ...prev, phase: "idle", lastTriage: triage }))
      return
    }
    // followup-intent → load specialties rồi hiện FollowupBookingPanel
    if (triage.level === "followup-intent") {
      const specialties = await getSpecialties().catch(() => [])
      setState((prev) => ({ ...prev, phase: "followup-booking", specialties, lastTriage: triage }))
      return
    }
    // clear
    setState((prev) => ({ ...prev, phase: "clear", lastTriage: triage }))
  }

  /* ── Followup ── */
  async function handleFollowupSubmit(answer: string) {
    addMessage({ role: "user", content: answer })
    setState((prev) => ({ ...prev, phase: "low-confidence-loading", followupUsed: true }))
    try {
      const triage = await postFollowup(state.symptoms, answer, state.sessionId)
      handleTriageResponse(triage, state.symptoms)
    } catch {
      addMessage({ role: "ai", content: "Có lỗi xảy ra. Vui lòng thử lại." })
      setState((prev) => ({ ...prev, phase: "idle" }))
    }
  }

  /* ── Override ── */
  async function handleOverride() {
    let specialties = state.specialties
    if (specialties.length === 0) specialties = await getSpecialties().catch(() => [])
    setState((prev) => ({ ...prev, phase: "override", specialties }))
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
  function handleInitiateBook(slot: Slot, specialty: Specialty, bookingType: "new" | "followup" = "new") {
    if (state.phase === "override") {
      postLog({
        symptoms: state.symptoms,
        aiLevel: state.lastTriage?.level ?? "clear",
        aiSuggested: state.lastTriage?.specialty?.name ?? null,
        userAction: "override",
        userSelected: specialty.name,
      })
    }
    setState((prev) => ({ ...prev, pendingSlot: slot, pendingSpecialty: specialty, pendingBookingType: bookingType, phase: "booking-form" }))
  }

  function handleBookFromClear(slot: Slot) {
    if (!state.lastTriage?.specialty) return
    handleInitiateBook(slot, state.lastTriage.specialty, "new")
  }

  function handleCancelBooking() {
    const returnPhase = state.pendingBookingType === "followup" ? "followup-booking" : "clear"
    setState((prev) => ({ ...prev, pendingSlot: null, pendingSpecialty: null, phase: returnPhase }))
  }

  async function handleConfirmBooking(patientName: string, patientPhone: string) {
    if (!state.pendingSlot || !state.pendingSpecialty) return
    setState((prev) => ({ ...prev, phase: "booking-loading" }))
    try {
      const result = await postBooking({
        slotId: state.pendingSlot!.id,
        patientName,
        patientPhone,
        bookingType: state.pendingBookingType,
      })
      setState((prev) => ({
        ...prev, phase: "booked",
        bookedSpecialty: prev.pendingSpecialty, bookedSlot: prev.pendingSlot,
        bookingId: result.bookingId, pendingSlot: null, pendingSpecialty: null,
      }))
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Không thể đặt lịch. Slot có thể đã được đặt, vui lòng chọn slot khác."
      addMessage({ role: "ai", content: msg })
      setState((prev) => ({ ...prev, phase: "clear", pendingSlot: null, pendingSpecialty: null }))
    }
  }

  /* ── Feedback ── */
  function handleOpenFeedback() { setState((prev) => ({ ...prev, showFeedback: true })) }
  function handleCloseFeedback() { setState((prev) => ({ ...prev, showFeedback: false })) }
  async function handleFeedbackSubmit(payload: FeedbackPayload) {
    await postFeedback({ ...payload, bookingId: state.bookingId, sessionId: state.sessionId })
    setState((prev) => ({ ...prev, showFeedback: false }))
  }

  /* ── Render ── */
  const isLoading = state.phase === "loading" || state.phase === "low-confidence-loading" || state.phase === "booking-loading"
  const isTerminal = state.phase === "booked" || state.phase === "red-flag"
  const showMainInput =
    !isTerminal &&
    state.phase !== "low-confidence" && state.phase !== "low-confidence-loading" &&
    state.phase !== "followup-booking" &&
    state.phase !== "booking-form" && state.phase !== "booking-loading"

  return (
    <>
      {/* Page layout */}
      <div className="app-layout">
        {/* Chat window */}
        <div className="chat-container w-full max-w-lg flex flex-col" style={{ height: "92vh" }}>

          {/* ── Header ── */}
          <div className="chat-header px-4 py-3 flex-shrink-0 flex items-center gap-3">
            {/* Logo */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0"
              style={{ background: "var(--primary)" }}
            >
              ✚
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base leading-tight" style={{ color: "var(--text-primary)" }}>
                Triage AI
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Gợi ý chuyên khoa từ triệu chứng
              </p>
            </div>

            {/* Status + Theme toggle */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "var(--success)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Online</span>
              </div>
              <button
                onClick={toggleTheme}
                className="theme-toggle"
                title={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto py-4 space-y-1" style={{ background: "var(--bg-page)" }}>

            {/* Welcome screen */}
            {state.messages.length === 0 && (
              <div className="text-center py-8 px-6 animate-fade-in">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl text-white mx-auto mb-4"
                  style={{ background: "var(--primary)", boxShadow: "var(--shadow-md)" }}
                >
                  ✚
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  Xin chào! 👋 Tôi có thể giúp gì?
                </h2>
                <p className="text-base mb-4" style={{ color: "var(--text-secondary)" }}>
                  Mô tả triệu chứng của bạn để nhận gợi ý chuyên khoa phù hợp
                </p>

                {/* Danh sách khoa khám */}
                <div className="text-left mx-auto mb-5 px-4 py-3 rounded-xl" style={{ background: "var(--bg-secondary)", maxWidth: "320px" }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>🏥 Các chuyên khoa hiện có:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { icon: "👁️", name: "Chuyên khoa Mắt" },
                      { icon: "🧠", name: "Thần kinh" },
                      { icon: "🩺", name: "Nội tổng quát" },
                      { icon: "🫃", name: "Tiêu hóa" },
                      { icon: "❤️", name: "Tim mạch" },
                      { icon: "🦴", name: "Cơ xương khớp" },
                    ].map((s) => (
                      <div key={s.name} className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                        <span>{s.icon}</span>
                        <span>{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  {HINTS.map((hint) => (
                    <button key={hint} onClick={() => handleSymptomSubmit(hint)} className="hint-chip">
                      {hint}
                    </button>
                  ))}
                </div>
                <p className="text-sm mt-6" style={{ color: "var(--text-muted)" }}>
                  💡 Hoặc nhập triệu chứng của bạn vào ô bên dưới
                </p>
              </div>
            )}

            {/* Chat history */}
            {state.messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}

            {/* Loading */}
            {isLoading && <LoadingBubble />}

            {/* Clear result */}
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

            {/* Red-flag (kể cả crisis tâm lý) */}
            {state.phase === "red-flag" && state.lastTriage && (
              <RedFlagBanner
                message={state.lastTriage.message}
                hotline={state.lastTriage.hotline ?? "115"}
                mentalHealthHotline={state.lastTriage.mentalHealthHotline}
                disclaimer={state.lastTriage.disclaimer ?? ""}
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

            {/* Override panel */}
            {state.phase === "override" && (
              <OverridePanel
                specialties={state.specialties}
                onBook={(specialty, slot) => handleInitiateBook(slot, specialty, "new")}
                onRetry={handleRetry}
                onFeedback={handleOpenFeedback}
              />
            )}

            {/* Followup booking panel — đặt tái khám */}
            {state.phase === "followup-booking" && (
              <FollowupBookingPanel
                specialties={state.specialties}
                onBook={(specialty, slot) => handleInitiateBook(slot, specialty, "followup")}
                onRetry={reset}
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

          {/* ── Main input ── */}
          {showMainInput && (
            <ChatInput
              onSubmit={handleSymptomSubmit}
              disabled={isLoading}
              placeholder={state.phase === "override" ? "Hoặc nhập lại triệu chứng..." : "Nhập triệu chứng của bạn..."}
            />
          )}

          {/* ── Reset button for terminal states ── */}
          {isTerminal && (
            <div className="chat-footer px-4 py-3 flex-shrink-0">
              <button onClick={reset} className="btn btn-outline w-full">
                ↩ Bắt đầu lại
              </button>
            </div>
          )}
        </div>

        {/* Log panel */}
        <LogPanel ref={logPanelRef} currentSessionId={state.sessionId} />

        {/* Mobile toggle button */}
        <button
          className="log-toggle-btn"
          onClick={() => setLogPanelOpen(!logPanelOpen)}
          title="Lịch sử hội thoại"
        >
          📋
        </button>
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

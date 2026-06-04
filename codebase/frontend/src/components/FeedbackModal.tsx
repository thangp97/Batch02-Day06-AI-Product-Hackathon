import { useState } from "react"
import type { FeedbackPayload } from "../types"

type Props = {
  isOpen: boolean
  symptoms: string
  aiLevel: string
  aiSuggested: string | null
  bookingId?: number | null
  onClose: () => void
  onSubmit: (payload: FeedbackPayload) => void
}

const LEVEL_LABEL: Record<string, { label: string; color: string }> = {
  "red-flag":       { label: "Cảnh báo cấp cứu", color: "#ff2d55" },
  "clear":          { label: "Rõ — gợi ý khoa",  color: "#00ff9d" },
  "low-confidence": { label: "Cần làm rõ",         color: "#f59e0b" },
}

const STARS = [1, 2, 3, 4, 5]
const STAR_LABELS = ["Rất tệ", "Tệ", "Bình thường", "Tốt", "Rất tốt"]

export default function FeedbackModal({
  isOpen,
  symptoms,
  aiLevel,
  aiSuggested,
  bookingId,
  onClose,
  onSubmit,
}: Props) {
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [correctSpecialty, setCorrectSpecialty] = useState("")
  const [note, setNote] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [ratingError, setRatingError] = useState(false)

  if (!isOpen) return null

  const levelInfo = LEVEL_LABEL[aiLevel] ?? { label: aiLevel, color: "#e0f0ff" }
  const displayRating = hoverRating || rating

  function handleSubmit() {
    if (rating === 0) { setRatingError(true); return }
    onSubmit({
      symptoms,
      aiLevel,
      aiSuggested,
      correctSpecialty: correctSpecialty.trim() || null,
      note: note.trim(),
      rating,
      bookingId: bookingId ?? null,
    })
    setSubmitted(true)
  }

  function handleClose() {
    setSubmitted(false)
    setRating(0)
    setHoverRating(0)
    setCorrectSpecialty("")
    setNote("")
    setRatingError(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="glass w-full max-w-md rounded-2xl overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(0,212,255,0.12)" }}>
          <div>
            <p className="font-bold" style={{ color: "#e0f0ff" }}>Báo vấn đề</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(224,240,255,0.38)" }}>
              Phản hồi giúp bệnh viện cải thiện AI
            </p>
          </div>
          <button onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-xl leading-none"
            style={{ color: "rgba(224,240,255,0.4)", background: "rgba(255,255,255,0.06)" }}>
            ×
          </button>
        </div>

        {submitted ? (
          <div className="px-5 py-10 text-center">
            <p className="text-4xl mb-3" style={{ filter: "drop-shadow(0 0 10px rgba(0,255,157,0.7))" }}>✦</p>
            <p className="font-bold text-base" style={{ color: "#00ff9d" }}>Đã gửi báo cáo</p>
            <p className="text-xs mt-1" style={{ color: "rgba(224,240,255,0.38)" }}>Cảm ơn phản hồi của bạn</p>
            <button onClick={handleClose} className="btn-ghost mt-5 px-8 py-2.5 text-sm">Đóng</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">

            {/* Context */}
            <div className="rounded-xl p-3 space-y-2"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Row label="Triệu chứng" value={symptoms} />
              <Row label="AI phân loại" value={levelInfo.label} valueColor={levelInfo.color} />
              {aiSuggested && <Row label="Gợi ý" value={aiSuggested} />}
              {bookingId && <Row label="Mã đặt lịch" value={`#${bookingId}`} valueColor="#00d4ff" />}
            </div>

            {/* Star rating */}
            <div>
              <label className="block text-xs mb-2 uppercase tracking-widest"
                style={{ color: "rgba(224,240,255,0.45)", fontSize: "0.62rem" }}>
                Đánh giá trải nghiệm *
              </label>
              <div className="flex gap-2 items-center">
                {STARS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setRating(s); setRatingError(false) }}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-2xl transition-all duration-100"
                    style={{
                      color: displayRating >= s ? "#f59e0b" : "rgba(224,240,255,0.2)",
                      filter: displayRating >= s ? "drop-shadow(0 0 6px rgba(245,158,11,0.6))" : "none",
                      transform: displayRating >= s ? "scale(1.15)" : "scale(1)",
                    }}
                  >
                    ★
                  </button>
                ))}
                {displayRating > 0 && (
                  <span className="text-xs ml-1" style={{ color: "rgba(245,158,11,0.7)" }}>
                    {STAR_LABELS[displayRating - 1]}
                  </span>
                )}
              </div>
              {ratingError && (
                <p className="text-xs mt-1" style={{ color: "#ff2d55" }}>Vui lòng chọn số sao</p>
              )}
            </div>

            {/* Correct specialty */}
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-widest"
                style={{ color: "rgba(224,240,255,0.45)", fontSize: "0.62rem" }}>
                Chuyên khoa đúng (nếu AI sai) — tùy chọn
              </label>
              <input type="text" value={correctSpecialty}
                onChange={(e) => setCorrectSpecialty(e.target.value)}
                placeholder="Ví dụ: Thần kinh, Nội tổng quát..."
                className="input-dark" />
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-widest"
                style={{ color: "rgba(224,240,255,0.45)", fontSize: "0.62rem" }}>
                Mô tả vấn đề — tùy chọn
              </label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                rows={3} placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                className="input-dark resize-none" />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button onClick={handleClose} className="btn-ghost flex-1 py-2.5 text-sm">Hủy</button>
              <button onClick={handleSubmit} className="btn-cyan flex-1 py-2.5 text-sm">Gửi báo cáo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, valueColor = "#e0f0ff" }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-start gap-3 text-xs">
      <span style={{ color: "rgba(224,240,255,0.38)", flexShrink: 0 }}>{label}</span>
      <span className="font-medium text-right" style={{ color: valueColor, wordBreak: "break-word" }}>{value}</span>
    </div>
  )
}

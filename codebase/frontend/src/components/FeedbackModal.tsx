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
  "red-flag":       { label: "Cảnh báo cấp cứu", color: "var(--danger)" },
  "clear":          { label: "Rõ — gợi ý chuyên khoa", color: "var(--success)" },
  "low-confidence": { label: "Cần làm rõ thêm", color: "var(--warning)" },
}

const STARS = [1, 2, 3, 4, 5]
const STAR_LABELS = ["Rất tệ", "Tệ", "Bình thường", "Tốt", "Rất tốt"]

export default function FeedbackModal({ isOpen, symptoms, aiLevel, aiSuggested, bookingId, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [correctSpecialty, setCorrectSpecialty] = useState("")
  const [note, setNote] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [ratingError, setRatingError] = useState(false)

  if (!isOpen) return null

  const levelInfo = LEVEL_LABEL[aiLevel] ?? { label: aiLevel, color: "var(--text-secondary)" }
  const displayRating = hoverRating || rating

  function handleSubmit() {
    if (rating === 0) { setRatingError(true); return }
    onSubmit({
      symptoms, aiLevel, aiSuggested,
      correctSpecialty: correctSpecialty.trim() || null,
      note: note.trim(),
      rating,
      bookingId: bookingId ?? null,
    })
    setSubmitted(true)
  }

  function handleClose() {
    setSubmitted(false); setRating(0); setHoverRating(0)
    setCorrectSpecialty(""); setNote(""); setRatingError(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal-card animate-slide-up">

        {/* Header */}
        <div className="modal-header">
          <div>
            <p className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Đánh giá & Báo vấn đề</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Phản hồi giúp cải thiện AI triage</p>
          </div>
          <button onClick={handleClose} className="modal-close">×</button>
        </div>

        {submitted ? (
          <div className="px-6 py-12 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ background: "var(--success-bg)", border: "2px solid var(--success-border)" }}
            >
              ✓
            </div>
            <p className="font-bold text-xl" style={{ color: "var(--success-label)" }}>Đã gửi báo cáo!</p>
            <p className="text-base mt-2" style={{ color: "var(--text-secondary)" }}>Cảm ơn phản hồi của bạn</p>
            <button onClick={handleClose} className="btn btn-outline mt-6 px-8">Đóng</button>
          </div>
        ) : (
          <div className="p-5 space-y-5">

            {/* Context summary */}
            <div className="rounded-xl p-4 space-y-2"
              style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}>
              <InfoRow label="Triệu chứng" value={symptoms} />
              <InfoRow label="AI phân loại" value={levelInfo.label} valueColor={levelInfo.color} />
              {aiSuggested && <InfoRow label="Gợi ý khoa" value={aiSuggested} />}
              {bookingId && <InfoRow label="Mã đặt lịch" value={`#${bookingId}`} valueColor="var(--primary)" />}
            </div>

            {/* Star rating */}
            <div>
              <label className="block font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "0.9375rem" }}>
                Đánh giá trải nghiệm <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <div className="flex gap-1 items-center">
                {STARS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setRating(s); setRatingError(false) }}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`star-btn ${displayRating >= s ? "active" : ""}`}
                    title={STAR_LABELS[s - 1]}
                  >
                    ★
                  </button>
                ))}
                {displayRating > 0 && (
                  <span className="text-base font-medium ml-2" style={{ color: "var(--warning)" }}>
                    {STAR_LABELS[displayRating - 1]}
                  </span>
                )}
              </div>
              {ratingError && (
                <p className="text-sm mt-1.5 font-medium" style={{ color: "var(--danger)" }}>Vui lòng chọn số sao</p>
              )}
            </div>

            {/* Correct specialty */}
            <div>
              <label className="block font-semibold mb-2" style={{ color: "var(--text-primary)", fontSize: "0.9375rem" }}>
                Chuyên khoa đúng (nếu AI gợi sai) — tùy chọn
              </label>
              <input
                type="text"
                value={correctSpecialty}
                onChange={(e) => setCorrectSpecialty(e.target.value)}
                placeholder="Ví dụ: Thần kinh, Tim mạch..."
                className="input-field"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block font-semibold mb-2" style={{ color: "var(--text-primary)", fontSize: "0.9375rem" }}>
                Mô tả vấn đề — tùy chọn
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                className="input-field resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button onClick={handleClose} className="btn btn-outline flex-1">Hủy</button>
              <button onClick={handleSubmit} className="btn btn-primary flex-1">Gửi báo cáo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value, valueColor = "var(--text-primary)" }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-start gap-3 text-sm">
      <span style={{ color: "var(--text-secondary)", flexShrink: 0 }}>{label}</span>
      <span className="font-semibold text-right" style={{ color: valueColor, wordBreak: "break-word" }}>{value}</span>
    </div>
  )
}

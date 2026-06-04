import type { Slot, Specialty } from "../types"

type Props = {
  specialty: Specialty
  slot: Slot
  bookingId: number | null
  onReset: () => void
  onFeedback?: () => void
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("vi-VN", {
    weekday: "long", day: "2-digit", month: "2-digit",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export default function BookedCard({ specialty, slot, bookingId, onReset, onFeedback }: Props) {
  return (
    <div className="card card-success mx-3 mb-4 animate-slide-up">
      {/* Success header */}
      <div className="card-header card-header-success text-center py-5">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-3"
          style={{ background: "var(--success-bg)", border: "2px solid var(--success-border)" }}
        >
          ✓
        </div>
        <p className="font-bold text-xl" style={{ color: "var(--success-label)" }}>
          Đặt lịch thành công!
        </p>
        {bookingId && (
          <p className="text-sm mt-1 font-medium" style={{ color: "var(--success)" }}>
            Mã đặt lịch #{bookingId}
          </p>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div>
          {[
            { label: "Chuyên khoa", value: specialty.name },
            { label: "Bác sĩ",     value: slot.doctor },
            { label: "Thời gian",   value: formatDateTime(slot.scheduledAt) },
          ].map(({ label, value }) => (
            <div key={label} className="info-row">
              <span style={{ color: "var(--text-secondary)", flexShrink: 0 }}>{label}</span>
              <span className="font-semibold text-right ml-4" style={{ color: "var(--text-primary)", wordBreak: "break-word" }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-lg p-3 text-sm text-center" style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}>
          <span style={{ color: "var(--text-secondary)" }}>
            📌 Vui lòng đến đúng giờ. Mang <strong>CCCD</strong> và <strong>thẻ BHYT</strong> (nếu có).
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 space-y-2">
        <button onClick={onReset} className="btn btn-primary w-full">
          Đặt lịch khác
        </button>
        {onFeedback && (
          <div className="text-center">
            <button onClick={onFeedback} className="feedback-link">
              ⭐ Đánh giá trải nghiệm / Báo vấn đề
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

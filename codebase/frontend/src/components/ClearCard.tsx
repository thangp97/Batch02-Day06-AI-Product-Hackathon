import type { Specialty, Slot } from "../types"
import Disclaimer from "./Disclaimer"

type Props = {
  specialty: Specialty
  slots: Slot[]
  disclaimer: string | null
  onBook: (slot: Slot) => void
  onRetry: () => void
  onOverride: () => void
  onFeedback?: () => void
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("vi-VN", {
    weekday: "short", day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function ClearCard({ specialty, slots, disclaimer, onBook, onRetry, onOverride, onFeedback }: Props) {
  const availableSlots = slots.filter((s) => s.available)

  return (
    <div className="card card-success mx-3 mb-4 animate-slide-up">
      {/* Header */}
      <div className="card-header card-header-success flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "var(--success-bg)", border: "2px solid var(--success-border)" }}
        >
          ✓
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--success)" }}>
            Gợi ý chuyên khoa
          </p>
          <p className="font-bold text-lg" style={{ color: "var(--success-label)" }}>
            {specialty.name}
          </p>
        </div>
      </div>

      {/* Slots */}
      <div className="p-4">
        {availableSlots.length === 0 ? (
          <p className="text-center py-3" style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>
            Hiện không có lịch khám trống cho chuyên khoa này.
          </p>
        ) : (
          <>
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
              📅 Lịch khám khả dụng
            </p>
            <div className="space-y-2">
              {availableSlots.map((slot) => (
                <div key={slot.id} className="slot-item">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text-primary)", fontSize: "0.9375rem" }}>
                      {slot.doctor}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {formatDateTime(slot.scheduledAt)}
                    </p>
                  </div>
                  <button onClick={() => onBook(slot)} className="btn btn-success text-sm" style={{ minHeight: "38px", padding: "0 1rem" }}>
                    Đặt lịch
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex gap-2">
        <button onClick={onRetry} className="btn btn-outline flex-1 text-sm">
          ↩ Nhập lại
        </button>
        <button onClick={onOverride} className="btn btn-outline flex-1 text-sm">
          Chọn khoa khác
        </button>
      </div>

      {onFeedback && (
        <div className="px-4 pb-3 text-center">
          <button onClick={onFeedback} className="feedback-link">
            AI gợi sai? Báo vấn đề
          </button>
        </div>
      )}

      <div className="px-4 pb-3">
        <Disclaimer text={disclaimer} />
      </div>
    </div>
  )
}

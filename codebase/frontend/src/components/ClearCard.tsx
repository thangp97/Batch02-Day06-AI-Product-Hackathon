import type { Specialty, Slot } from "../types"
import Disclaimer from "./Disclaimer"

type Props = {
  specialty: Specialty
  slots: Slot[]
  disclaimer: string
  onBook: (slot: Slot) => void
  onRetry: () => void
  onOverride: () => void
  onFeedback?: () => void
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function ClearCard({
  specialty,
  slots,
  disclaimer,
  onBook,
  onRetry,
  onOverride,
  onFeedback,
}: Props) {
  const availableSlots = slots.filter((s) => s.available)

  return (
    <div
      className="mx-2 mb-4 rounded-2xl overflow-hidden animate-slide-up"
      style={{
        border: "1px solid rgba(0,255,157,0.22)",
        background: "rgba(0,255,157,0.03)",
        boxShadow: "0 0 24px rgba(0,255,157,0.07)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(0,255,157,0.14)" }}
      >
        <span style={{ color: "#00ff9d", fontSize: "1.1rem", filter: "drop-shadow(0 0 6px rgba(0,255,157,0.6))" }}>
          ✦
        </span>
        <div>
          <p
            className="text-xs uppercase tracking-widest font-semibold"
            style={{ color: "rgba(0,255,157,0.65)", fontSize: "0.6rem" }}
          >
            Gợi ý chuyên khoa
          </p>
          <p
            className="font-bold text-base"
            style={{ color: "#00ff9d", textShadow: "0 0 10px rgba(0,255,157,0.4)" }}
          >
            {specialty.name}
          </p>
        </div>
      </div>

      {/* Slots */}
      <div className="px-4 py-3">
        {availableSlots.length === 0 ? (
          <p className="text-sm text-center py-2" style={{ color: "rgba(224,240,255,0.38)" }}>
            Không có slot khả dụng
          </p>
        ) : (
          <div className="space-y-2">
            <p
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: "rgba(224,240,255,0.35)", fontSize: "0.6rem" }}
            >
              Lịch khám khả dụng
            </p>
            {availableSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "#e0f0ff" }}>
                    {slot.doctor}
                  </p>
                  <p className="text-xs" style={{ color: "rgba(224,240,255,0.42)" }}>
                    {formatDateTime(slot.scheduledAt)}
                  </p>
                </div>
                <button onClick={() => onBook(slot)} className="btn-green px-4 py-1.5 text-xs">
                  Đặt lịch
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Escape hatch */}
      <div className="px-4 pb-3 flex gap-2">
        <button onClick={onRetry} className="btn-ghost flex-1 py-2 text-xs">
          Nhập lại triệu chứng
        </button>
        <button onClick={onOverride} className="btn-ghost flex-1 py-2 text-xs">
          Chọn chuyên khoa khác
        </button>
      </div>

      {/* Feedback */}
      {onFeedback && (
        <div className="px-4 pb-2 text-center">
          <button
            onClick={onFeedback}
            className="text-xs underline"
            style={{ color: "rgba(224,240,255,0.5)", textDecorationColor: "rgba(224,240,255,0.3)" }}
          >
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

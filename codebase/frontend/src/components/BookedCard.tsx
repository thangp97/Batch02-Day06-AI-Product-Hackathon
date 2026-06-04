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
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function BookedCard({ specialty, slot, bookingId, onReset, onFeedback }: Props) {
  return (
    <div
      className="mx-2 mb-4 rounded-2xl overflow-hidden animate-slide-up"
      style={{
        border: "1px solid rgba(0,255,157,0.28)",
        background: "rgba(0,255,157,0.04)",
        boxShadow: "0 0 28px rgba(0,255,157,0.1)",
      }}
    >
      {/* Success header */}
      <div className="px-4 py-5 text-center" style={{ borderBottom: "1px solid rgba(0,255,157,0.14)" }}>
        <p className="text-4xl mb-2" style={{ filter: "drop-shadow(0 0 12px rgba(0,255,157,0.7))" }}>✦</p>
        <p className="font-black text-base" style={{ color: "#00ff9d", textShadow: "0 0 12px rgba(0,255,157,0.5)" }}>
          Đặt lịch thành công!
        </p>
        {bookingId && (
          <p className="text-xs mt-1" style={{ color: "rgba(0,255,157,0.5)" }}>Mã đặt lịch #{bookingId}</p>
        )}
      </div>

      {/* Info rows */}
      <div className="p-4 space-y-0">
        {[
          { label: "Chuyên khoa", value: specialty.name },
          { label: "Bác sĩ", value: slot.doctor },
          { label: "Thời gian", value: formatDateTime(slot.scheduledAt) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex justify-between items-center text-sm py-2.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span style={{ color: "rgba(224,240,255,0.42)" }}>{label}</span>
            <span className="font-medium text-right ml-4" style={{ color: "#e0f0ff" }}>{value}</span>
          </div>
        ))}
        <p className="text-xs text-center pt-3" style={{ color: "rgba(224,240,255,0.28)" }}>
          Vui lòng đến đúng giờ. Mang CCCD và thẻ BHYT (nếu có).
        </p>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 space-y-2">
        <button onClick={onReset} className="btn-ghost w-full py-2.5 text-sm">Đặt lịch khác</button>
        {onFeedback && (
          <div className="text-center">
            <button
              onClick={onFeedback}
              className="text-xs underline"
              style={{ color: "rgba(224,240,255,0.5)", textDecorationColor: "rgba(224,240,255,0.3)" }}
            >
              Đánh giá trải nghiệm / Báo vấn đề
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

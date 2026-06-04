import { useEffect, useState } from "react"
import type { Specialty, Slot } from "../types"
import { getSlotsBySpecialty } from "../api/triageApi"

type Props = {
  specialties: Specialty[]
  onBook: (specialty: Specialty, slot: Slot) => void
  onRetry: () => void
  onFeedback?: () => void
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("vi-VN", {
    weekday: "short", day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function OverridePanel({ specialties, onBook, onRetry, onFeedback }: Props) {
  const [selectedId, setSelectedId] = useState<number | "">("")
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedId === "") { setSlots([]); setSelectedSpecialty(null); return }
    const sp = specialties.find((s) => s.id === selectedId) ?? null
    setSelectedSpecialty(sp)
    setLoading(true)
    getSlotsBySpecialty(selectedId)
      .then(({ slots }) => setSlots(slots))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [selectedId, specialties])

  const availableSlots = slots.filter((s) => s.available)

  return (
    <div className="card card-warning mx-3 mb-4 animate-slide-up">
      <div className="card-header card-header-warning flex items-center gap-2">
        <span style={{ fontSize: "1.25rem" }}>🔍</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--warning)" }}>
            Chọn chuyên khoa
          </p>
          <p className="text-sm font-medium mt-0.5" style={{ color: "var(--warning-label)" }}>
            Chọn thủ công nếu AI gợi ý chưa phù hợp
          </p>
        </div>
      </div>

      <div className="p-4">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value === "" ? "" : Number(e.target.value))}
          className="input-field"
          style={{ fontSize: "1rem" }}
        >
          <option value="">-- Chọn chuyên khoa --</option>
          {specialties.map((sp) => (
            <option key={sp.id} value={sp.id}>{sp.name}</option>
          ))}
        </select>

        {loading && (
          <p className="text-center py-4" style={{ color: "var(--text-muted)" }}>Đang tải lịch khám...</p>
        )}

        {!loading && selectedId !== "" && availableSlots.length === 0 && (
          <p className="text-center py-4" style={{ color: "var(--text-muted)" }}>Không có lịch khám trống.</p>
        )}

        {!loading && availableSlots.length > 0 && (
          <div className="mt-3 space-y-2">
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
                <button
                  onClick={() => selectedSpecialty && onBook(selectedSpecialty, slot)}
                  className="btn btn-success text-sm"
                  style={{ minHeight: "38px", padding: "0 1rem" }}
                >
                  Đặt lịch
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-4 space-y-2">
        <button onClick={onRetry} className="btn btn-outline w-full text-sm">
          ↩ Nhập lại triệu chứng
        </button>
        {onFeedback && (
          <div className="text-center">
            <button onClick={onFeedback} className="feedback-link">Báo vấn đề</button>
          </div>
        )}
      </div>
    </div>
  )
}

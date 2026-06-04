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
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function OverridePanel({ specialties, onBook, onRetry, onFeedback }: Props) {
  const [selectedId, setSelectedId] = useState<number | "">("")
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedId === "") {
      setSlots([])
      setSelectedSpecialty(null)
      return
    }
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
    <div
      className="mx-2 mb-4 rounded-2xl overflow-hidden animate-slide-up"
      style={{
        border: "1px solid rgba(245,158,11,0.2)",
        background: "rgba(245,158,11,0.03)",
      }}
    >
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(245,158,11,0.12)" }}>
        <p
          className="text-xs uppercase tracking-widest font-semibold"
          style={{ color: "rgba(245,158,11,0.65)", fontSize: "0.6rem" }}
        >
          Chọn chuyên khoa thủ công
        </p>
      </div>

      <div className="p-4">
        <select
          value={selectedId}
          onChange={(e) =>
            setSelectedId(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="input-dark"
          style={{ cursor: "pointer" }}
        >
          <option value="">-- Chọn chuyên khoa --</option>
          {specialties.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.name}
            </option>
          ))}
        </select>

        {loading && (
          <p className="text-sm text-center py-3" style={{ color: "rgba(224,240,255,0.38)" }}>
            Đang tải slot...
          </p>
        )}

        {!loading && selectedId !== "" && availableSlots.length === 0 && (
          <p className="text-sm text-center py-3" style={{ color: "rgba(224,240,255,0.38)" }}>
            Không có slot khả dụng
          </p>
        )}

        {!loading && availableSlots.length > 0 && (
          <div className="mt-3 space-y-2">
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
                <button
                  onClick={() => selectedSpecialty && onBook(selectedSpecialty, slot)}
                  className="btn-green px-4 py-1.5 text-xs"
                >
                  Đặt lịch
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-4 space-y-2">
        <button onClick={onRetry} className="btn-ghost w-full py-2 text-xs">
          Nhập lại triệu chứng
        </button>
        {onFeedback && (
          <div className="text-center">
            <button
              onClick={onFeedback}
              className="text-xs underline"
              style={{ color: "rgba(224,240,255,0.5)", textDecorationColor: "rgba(224,240,255,0.3)" }}
            >
              Báo vấn đề
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

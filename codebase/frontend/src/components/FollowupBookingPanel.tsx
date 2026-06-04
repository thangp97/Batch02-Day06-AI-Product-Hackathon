import { useEffect, useState } from "react"
import type { Specialty, Slot } from "../types"
import { getDoctorsBySpecialty, getSlotsByDoctor } from "../api/triageApi"

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

export default function FollowupBookingPanel({ specialties, onBook, onRetry, onFeedback }: Props) {
  const [selectedId, setSelectedId]         = useState<number | "">("")
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null)
  const [doctors, setDoctors]               = useState<string[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<string>("")
  const [slots, setSlots]                   = useState<Slot[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [loadingSlots, setLoadingSlots]     = useState(false)

  // Khi chọn chuyên khoa → load danh sách bác sĩ
  useEffect(() => {
    if (selectedId === "") {
      setDoctors([]); setSelectedDoctor(""); setSlots([]); setSelectedSpecialty(null)
      return
    }
    const sp = specialties.find((s) => s.id === selectedId) ?? null
    setSelectedSpecialty(sp)
    setSelectedDoctor("")
    setSlots([])
    setLoadingDoctors(true)
    getDoctorsBySpecialty(selectedId)
      .then(setDoctors)
      .catch(() => setDoctors([]))
      .finally(() => setLoadingDoctors(false))
  }, [selectedId, specialties])

  // Khi chọn bác sĩ → load slot của bác sĩ đó
  useEffect(() => {
    if (!selectedId || !selectedDoctor) { setSlots([]); return }
    setLoadingSlots(true)
    getSlotsByDoctor(Number(selectedId), selectedDoctor)
      .then(({ slots }) => setSlots(slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [selectedDoctor, selectedId])

  const availableSlots = slots.filter((s) => s.available)

  return (
    <div className="card card-neutral mx-3 mb-4 animate-slide-up"
      style={{ borderColor: "var(--primary-border)" }}>

      {/* Header */}
      <div className="card-header flex items-center gap-2"
        style={{ borderBottomColor: "var(--primary-border)", background: "var(--primary-bg)" }}>
        <span style={{ fontSize: "1.25rem" }}>🔄</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
            Đặt lịch tái khám
          </p>
          <p className="text-sm font-medium mt-0.5" style={{ color: "var(--text-primary)" }}>
            Chọn chuyên khoa và bác sĩ bạn muốn gặp lại
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Bước 1: Chuyên khoa */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
            style={{ color: "var(--text-secondary)" }}>
            Bước 1 — Chuyên khoa
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value === "" ? "" : Number(e.target.value))}
            className="input-field"
          >
            <option value="">-- Chọn chuyên khoa --</option>
            {specialties.map((sp) => (
              <option key={sp.id} value={sp.id}>{sp.name}</option>
            ))}
          </select>
        </div>

        {/* Bước 2: Bác sĩ */}
        {selectedId !== "" && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
              style={{ color: "var(--text-secondary)" }}>
              Bước 2 — Bác sĩ
            </label>
            {loadingDoctors ? (
              <p className="text-sm py-2" style={{ color: "var(--text-muted)" }}>
                Đang tải danh sách bác sĩ...
              </p>
            ) : (
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="input-field"
                disabled={doctors.length === 0}
              >
                <option value="">-- Chọn bác sĩ --</option>
                {doctors.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Bước 3: Slot */}
        {loadingSlots && (
          <p className="text-center py-3" style={{ color: "var(--text-muted)" }}>
            Đang tải lịch khám...
          </p>
        )}

        {!loadingSlots && selectedDoctor !== "" && availableSlots.length === 0 && (
          <p className="text-center py-3 text-sm" style={{ color: "var(--text-muted)" }}>
            Không có lịch trống cho bác sĩ này. Vui lòng chọn bác sĩ khác.
          </p>
        )}

        {!loadingSlots && availableSlots.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-secondary)" }}>
              Bước 3 — Chọn khung giờ
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
                  <button
                    onClick={() => selectedSpecialty && onBook(selectedSpecialty, slot)}
                    className="btn btn-primary text-sm"
                    style={{ minHeight: "38px", padding: "0 1rem" }}
                  >
                    Đặt tái khám
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 space-y-2">
        <button onClick={onRetry} className="btn btn-outline w-full text-sm">
          ↩ Quay lại
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

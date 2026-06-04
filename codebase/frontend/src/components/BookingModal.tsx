import { useState } from "react"
import type { Slot, Specialty } from "../types"

type Props = {
  isOpen: boolean
  slot: Slot | null
  specialty: Specialty | null
  loading: boolean
  onConfirm: (patientName: string, patientPhone: string) => void
  onCancel: () => void
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("vi-VN", {
    weekday: "short", day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function BookingModal({ isOpen, slot, specialty, loading, onConfirm, onCancel }: Props) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  if (!isOpen || !slot || !specialty) return null

  function validate() {
    const e: { name?: string; phone?: string } = {}
    if (!name.trim()) e.name = "Vui lòng nhập họ và tên"
    if (!phone.trim()) e.phone = "Vui lòng nhập số điện thoại"
    else if (!/^(0|\+84)[0-9]{8,9}$/.test(phone.trim()))
      e.phone = "Số điện thoại không hợp lệ (vd: 0901234567)"
    return e
  }

  function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    onConfirm(name.trim(), phone.trim())
  }

  function handleKeyDown(ev: React.KeyboardEvent) {
    if (ev.key === "Enter") handleSubmit()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !loading && onCancel()}>
      <div className="modal-card animate-slide-up">

        {/* Header */}
        <div className="modal-header">
          <div>
            <p className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Xác nhận đặt lịch</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Điền thông tin để hoàn tất</p>
          </div>
          {!loading && (
            <button onClick={onCancel} className="modal-close">×</button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Slot summary */}
          <div className="rounded-xl p-4 space-y-2"
            style={{ background: "var(--success-bg)", border: "1.5px solid var(--success-border)" }}>
            <div className="info-row" style={{ borderBottomColor: "var(--success-border)" }}>
              <span style={{ color: "var(--text-secondary)" }}>Chuyên khoa</span>
              <span className="font-bold" style={{ color: "var(--success-label)" }}>{specialty.name}</span>
            </div>
            <div className="info-row" style={{ borderBottomColor: "var(--success-border)" }}>
              <span style={{ color: "var(--text-secondary)" }}>Bác sĩ</span>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{slot.doctor}</span>
            </div>
            <div className="info-row" style={{ border: "none" }}>
              <span style={{ color: "var(--text-secondary)" }}>Thời gian</span>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{formatDateTime(slot.scheduledAt)}</span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block font-semibold mb-2" style={{ color: "var(--text-primary)", fontSize: "0.9375rem" }}>
              Họ và tên <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })) }}
              onKeyDown={handleKeyDown}
              placeholder="Nguyễn Văn A"
              disabled={loading}
              className="input-field"
            />
            {errors.name && (
              <p className="text-sm mt-1.5 font-medium" style={{ color: "var(--danger)" }}>{errors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block font-semibold mb-2" style={{ color: "var(--text-primary)", fontSize: "0.9375rem" }}>
              Số điện thoại <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })) }}
              onKeyDown={handleKeyDown}
              placeholder="0901234567"
              disabled={loading}
              className="input-field"
            />
            {errors.phone && (
              <p className="text-sm mt-1.5 font-medium" style={{ color: "var(--danger)" }}>{errors.phone}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={onCancel} disabled={loading} className="btn btn-outline flex-1">
              Hủy
            </button>
            <button onClick={handleSubmit} disabled={loading} className="btn btn-success flex-1" id="confirm-booking-btn">
              {loading ? "Đang đặt..." : "✓ Xác nhận"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

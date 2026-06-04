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
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function BookingModal({
  isOpen,
  slot,
  specialty,
  loading,
  onConfirm,
  onCancel,
}: Props) {
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
      <div className="glass w-full max-w-md rounded-2xl overflow-hidden animate-slide-up">

        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(0,212,255,0.12)" }}
        >
          <div>
            <p className="font-bold" style={{ color: "#e0f0ff" }}>Xác nhận đặt lịch</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(224,240,255,0.38)" }}>
              Điền thông tin để hoàn tất
            </p>
          </div>
          {!loading && (
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-xl leading-none"
              style={{ color: "rgba(224,240,255,0.4)", background: "rgba(255,255,255,0.06)" }}
            >
              ×
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Slot info */}
          <div
            className="rounded-xl p-3 space-y-1"
            style={{ background: "rgba(0,255,157,0.06)", border: "1px solid rgba(0,255,157,0.18)" }}
          >
            <div className="flex justify-between text-xs">
              <span style={{ color: "rgba(224,240,255,0.42)" }}>Chuyên khoa</span>
              <span className="font-semibold" style={{ color: "#00ff9d" }}>{specialty.name}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "rgba(224,240,255,0.42)" }}>Bác sĩ</span>
              <span className="font-medium" style={{ color: "#e0f0ff" }}>{slot.doctor}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "rgba(224,240,255,0.42)" }}>Thời gian</span>
              <span className="font-medium" style={{ color: "#e0f0ff" }}>{formatDateTime(slot.scheduledAt)}</span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-widest"
              style={{ color: "rgba(224,240,255,0.45)", fontSize: "0.62rem" }}>
              Họ và tên *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })) }}
              onKeyDown={handleKeyDown}
              placeholder="Nguyễn Văn A"
              disabled={loading}
              className="input-dark"
            />
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: "#ff2d55" }}>{errors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-widest"
              style={{ color: "rgba(224,240,255,0.45)", fontSize: "0.62rem" }}>
              Số điện thoại *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })) }}
              onKeyDown={handleKeyDown}
              placeholder="0901234567"
              disabled={loading}
              className="input-dark"
            />
            {errors.phone && (
              <p className="text-xs mt-1" style={{ color: "#ff2d55" }}>{errors.phone}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button onClick={onCancel} disabled={loading} className="btn-ghost flex-1 py-2.5 text-sm">
              Hủy
            </button>
            <button onClick={handleSubmit} disabled={loading} className="btn-green flex-1 py-2.5 text-sm">
              {loading ? "Đang đặt..." : "Xác nhận đặt lịch"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import Disclaimer from "./Disclaimer"

type Props = {
  message: string
  hotline?: string
  disclaimer: string
  onRetry: () => void
  onFeedback?: () => void
}

export default function RedFlagBanner({ message, hotline = "115", disclaimer, onRetry, onFeedback }: Props) {
  return (
    <div className="card card-danger mx-3 mb-4 animate-slide-up animate-pulse-danger">
      {/* Header */}
      <div className="card-header card-header-danger flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "var(--danger-bg)", border: "2px solid var(--danger-border)" }}
        >
          🚨
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--danger)" }}>
            Cảnh báo khẩn cấp
          </p>
          <p className="font-bold text-base" style={{ color: "var(--danger-label)" }}>
            Cần được hỗ trợ y tế ngay
          </p>
        </div>
      </div>

      {/* Message */}
      <div className="p-4">
        <p className="text-base leading-relaxed font-medium" style={{ color: "var(--danger-label)" }}>
          {message}
        </p>
      </div>

      {/* Hotline */}
      <div className="mx-4 mb-4 rounded-xl p-4 flex items-center justify-between"
        style={{ background: "var(--danger-bg)", border: "1.5px solid var(--danger-border)" }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--danger)" }}>
            Đường dây cấp cứu
          </p>
          <p className="font-black text-4xl" style={{ color: "var(--danger)", fontVariantNumeric: "tabular-nums" }}>
            {hotline}
          </p>
        </div>
        <a
          href={`tel:${hotline}`}
          className="btn btn-danger"
          style={{ textDecoration: "none", borderRadius: "0.75rem" }}
        >
          📞 Gọi ngay
        </a>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 space-y-2">
        <button onClick={onRetry} className="btn btn-outline w-full text-sm">
          ↩ Nhập lại triệu chứng
        </button>
        {onFeedback && (
          <div className="text-center">
            <button onClick={onFeedback} className="feedback-link">Báo vấn đề</button>
          </div>
        )}
        <Disclaimer text={disclaimer} />
      </div>
    </div>
  )
}

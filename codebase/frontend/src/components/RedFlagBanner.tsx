import Disclaimer from "./Disclaimer"

type Props = {
  message: string
  hotline?: string
  disclaimer: string
  onRetry: () => void
  onFeedback?: () => void
}

export default function RedFlagBanner({
  message,
  hotline = "115",
  disclaimer,
  onRetry,
  onFeedback,
}: Props) {
  return (
    <div
      className="mx-2 mb-4 rounded-2xl overflow-hidden animate-slide-up animate-pulse-red"
      style={{
        border: "2px solid rgba(255,45,85,0.55)",
        background: "rgba(255,45,85,0.06)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{
          background: "rgba(255,45,85,0.14)",
          borderBottom: "1px solid rgba(255,45,85,0.2)",
        }}
      >
        <span className="text-xl">🚨</span>
        <p
          className="font-black text-sm uppercase tracking-widest"
          style={{ color: "#ff2d55", textShadow: "0 0 10px rgba(255,45,85,0.6)" }}
        >
          Cảnh báo khẩn cấp
        </p>
      </div>

      {/* Message */}
      <div className="px-4 py-4">
        <p className="text-sm leading-relaxed font-medium" style={{ color: "#ffb0be" }}>
          {message}
        </p>
      </div>

      {/* Hotline */}
      <div
        className="mx-4 mb-4 rounded-xl p-4 flex items-center justify-between"
        style={{
          background: "rgba(255,45,85,0.1)",
          border: "1px solid rgba(255,45,85,0.24)",
        }}
      >
        <div>
          <p
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: "rgba(255,160,176,0.65)", fontSize: "0.6rem" }}
          >
            Đường dây cấp cứu
          </p>
          <p
            className="text-4xl font-black"
            style={{
              color: "#ff2d55",
              textShadow: "0 0 16px rgba(255,45,85,0.7)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {hotline}
          </p>
        </div>
        <a
          href={`tel:${hotline}`}
          className="px-5 py-2.5 rounded-xl font-bold text-sm text-white"
          style={{ background: "#ff2d55", boxShadow: "0 0 20px rgba(255,45,85,0.5)" }}
        >
          Gọi ngay
        </a>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 space-y-2">
        <button onClick={onRetry} className="btn-ghost w-full py-2 text-xs">
          Nhập lại triệu chứng
        </button>
        {onFeedback && (
          <div className="text-center">
            <button
              onClick={onFeedback}
              className="text-xs underline"
              style={{ color: "rgba(224,240,255,0.24)", textDecorationColor: "rgba(224,240,255,0.14)" }}
            >
              Báo vấn đề
            </button>
          </div>
        )}
        <Disclaimer text={disclaimer} />
      </div>
    </div>
  )
}

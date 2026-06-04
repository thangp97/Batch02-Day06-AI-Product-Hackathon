export default function LoadingBubble() {
  return (
    <div className="flex justify-start mb-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #00d4ff, #0055cc)",
          boxShadow: "0 0 12px rgba(0,212,255,0.45)",
          color: "#050d1a",
        }}
      >
        AI
      </div>
      <div className="glass-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
    </div>
  )
}

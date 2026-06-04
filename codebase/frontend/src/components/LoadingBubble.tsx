export default function LoadingBubble() {
  return (
    <div className="flex justify-start mb-3 px-3">
      <div className="bubble-avatar bubble-avatar-ai mr-2">AI</div>
      <div className="bubble-ai flex items-center gap-1.5 py-3">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
    </div>
  )
}

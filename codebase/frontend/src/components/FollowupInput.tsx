import { useState } from "react"
import Disclaimer from "./Disclaimer"

type Props = {
  question: string
  disclaimer: string
  disabled?: boolean
  onSubmit: (answer: string) => void
}

export default function FollowupInput({
  question,
  disclaimer,
  disabled = false,
  onSubmit,
}: Props) {
  const [answer, setAnswer] = useState("")

  function handleSubmit() {
    const trimmed = answer.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setAnswer("")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className="mx-2 mb-3 rounded-2xl overflow-hidden animate-slide-up"
      style={{
        border: "1px solid rgba(245,158,11,0.22)",
        background: "rgba(245,158,11,0.04)",
      }}
    >
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(245,158,11,0.14)" }}>
        <p
          className="text-xs uppercase tracking-widest mb-1 font-semibold"
          style={{ color: "rgba(245,158,11,0.65)", fontSize: "0.6rem" }}
        >
          Câu hỏi làm rõ
        </p>
        <p className="text-sm font-medium" style={{ color: "#e0f0ff" }}>
          {question}
        </p>
      </div>

      <div className="p-3 flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Trả lời tại đây..."
          className="input-dark flex-1"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !answer.trim()}
          className="btn-cyan px-4 py-2 text-lg flex-shrink-0"
        >
          →
        </button>
      </div>

      <div className="px-4 pb-3">
        <Disclaimer text={disclaimer} />
      </div>
    </div>
  )
}

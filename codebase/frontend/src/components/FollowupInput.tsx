import { useState } from "react"
import Disclaimer from "./Disclaimer"

type Props = {
  question: string
  disclaimer: string
  disabled?: boolean
  onSubmit: (answer: string) => void
  onFeedback?: () => void
}

export default function FollowupInput({ question, disclaimer, disabled = false, onSubmit, onFeedback }: Props) {
  const [answer, setAnswer] = useState("")

  function handleSubmit() {
    const trimmed = answer.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setAnswer("")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  return (
    <div className="card card-warning mx-3 mb-3 animate-slide-up">
      <div className="card-header card-header-warning">
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--warning)" }}>
          💬 Cần làm rõ thêm
        </p>
        <p className="font-semibold text-base" style={{ color: "var(--warning-label)" }}>
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
          placeholder="Nhập câu trả lời của bạn..."
          className="input-field flex-1"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !answer.trim()}
          className="btn btn-primary flex-shrink-0"
          style={{ width: "48px", height: "48px", padding: 0, borderRadius: "0.75rem", fontSize: "1.25rem" }}
        >
          ↑
        </button>
      </div>

      <div className="px-4 pb-3 space-y-1">
        {onFeedback && (
          <div className="text-center">
            <button onClick={onFeedback} className="feedback-link">AI hỏi sai? Báo vấn đề</button>
          </div>
        )}
        <Disclaimer text={disclaimer} />
      </div>
    </div>
  )
}

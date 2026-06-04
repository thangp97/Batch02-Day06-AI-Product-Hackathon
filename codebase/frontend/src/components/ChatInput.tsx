import { useState } from "react"

type Props = {
  onSubmit: (text: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function ChatInput({
  onSubmit,
  disabled = false,
  placeholder = "Nhập triệu chứng của bạn...",
}: Props) {
  const [value, setValue] = useState("")

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setValue("")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className="flex gap-2 p-4 flex-shrink-0"
      style={{
        borderTop: "1px solid rgba(0,212,255,0.1)",
        background: "rgba(5,13,26,0.8)",
      }}
    >
      <textarea
        className="input-dark flex-1 resize-none"
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="btn-cyan px-5 flex-shrink-0 text-lg font-bold"
      >
        →
      </button>
    </div>
  )
}

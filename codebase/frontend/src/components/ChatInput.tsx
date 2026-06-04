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
    <div className="chat-footer px-4 py-3 flex gap-3 flex-shrink-0">
      <textarea
        className="input-field flex-1 resize-none"
        style={{ minHeight: "52px", maxHeight: "120px" }}
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
        className="btn btn-primary flex-shrink-0 text-xl"
        style={{ width: "52px", height: "52px", padding: 0, borderRadius: "0.75rem", alignSelf: "flex-end" }}
        title="Gửi"
      >
        ↑
      </button>
    </div>
  )
}

import type { Message } from "../types"

export default function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 animate-slide-up`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 mt-1"
          style={{
            background: "linear-gradient(135deg, #00d4ff, #0055cc)",
            boxShadow: "0 0 12px rgba(0,212,255,0.45)",
            color: "#050d1a",
          }}
        >
          AI
        </div>
      )}

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser ? "rounded-tr-sm" : "glass-sm rounded-tl-sm"
        }`}
        style={
          isUser
            ? {
                background: "linear-gradient(135deg, #00d4ff, #0099cc)",
                color: "#050d1a",
                fontWeight: 500,
                boxShadow: "0 0 16px rgba(0,212,255,0.25)",
              }
            : { color: "#e0f0ff" }
        }
      >
        {message.content}
      </div>

      {isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ml-2 flex-shrink-0 mt-1"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.14)",
            color: "rgba(224,240,255,0.7)",
          }}
        >
          U
        </div>
      )}
    </div>
  )
}

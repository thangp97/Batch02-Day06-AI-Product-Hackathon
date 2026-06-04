import type { Message } from "../types"

export default function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 px-3 animate-slide-up`}>
      {!isUser && (
        <div className="bubble-avatar bubble-avatar-ai mr-2">AI</div>
      )}

      <div className={isUser ? "bubble-user" : "bubble-ai"}>
        {message.content}
      </div>

      {isUser && (
        <div className="bubble-avatar bubble-avatar-user ml-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        </div>
      )}
    </div>
  )
}

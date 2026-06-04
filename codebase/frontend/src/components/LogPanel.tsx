import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import type { ConversationSession, ConversationLog } from "../types"
import { getSessions, getSessionMessages } from "../api/triageApi"

const LEVEL_BADGE: Record<string, { label: string; color: string }> = {
  clear:           { label: "✅ Clear",      color: "var(--success)" },
  "low-confidence":{ label: "⚠️ Low",        color: "var(--warning)" },
  "red-flag":      { label: "🚨 Red",        color: "var(--danger)" },
  "out-of-scope":  { label: "💬 OOS",        color: "var(--text-muted)" },
  greeting:        { label: "👋 Greet",      color: "var(--primary)" },
  "booking-prompt":{ label: "📋 Book",       color: "var(--primary)" },
  "followup-intent":{ label: "🔄 Follow",    color: "var(--primary)" },
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "vừa xong"
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  const days = Math.floor(hrs / 24)
  return `${days} ngày trước`
}

export type LogPanelHandle = { refresh: () => void }

const LogPanel = forwardRef<LogPanelHandle, { currentSessionId: string }>(
  ({ currentSessionId }, ref) => {
    const [sessions, setSessions] = useState<ConversationSession[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedSession, setSelectedSession] = useState<string | null>(null)
    const [chatLog, setChatLog] = useState<ConversationLog[]>([])
    const [logLoading, setLogLoading] = useState(false)

    async function loadSessions() {
      setLoading(true)
      try {
        const data = await getSessions()
        setSessions(data)
      } catch {
        setSessions([])
      }
      setLoading(false)
    }

    useImperativeHandle(ref, () => ({ refresh: loadSessions }))

    useEffect(() => { loadSessions() }, [])

    async function openSession(sessionId: string) {
      setSelectedSession(sessionId)
      setLogLoading(true)
      try {
        const msgs = await getSessionMessages(sessionId)
        setChatLog(msgs)
      } catch {
        setChatLog([])
      }
      setLogLoading(false)
    }

    function closeDetail() {
      setSelectedSession(null)
      setChatLog([])
    }

    return (
      <div className="log-panel">
        {/* Header */}
        <div className="log-panel-header">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h2>Lịch sử hội thoại</h2>
          </div>
          <button onClick={loadSessions} className="log-refresh-btn" title="Tải lại">
            🔄
          </button>
        </div>

        {/* Session list */}
        <div className="log-panel-body">
          {loading ? (
            <div className="log-empty">
              <div className="log-spinner" />
              <p>Đang tải...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="log-empty">
              <span className="text-3xl">📭</span>
              <p>Chưa có cuộc hội thoại nào</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Hãy bắt đầu nhập triệu chứng để tạo cuộc hội thoại đầu tiên
              </p>
            </div>
          ) : (
            <div className="log-session-list">
              {sessions.map((s) => {
                const badge = LEVEL_BADGE[s.lastLevel ?? ""] ?? { label: "—", color: "var(--text-muted)" }
                const isCurrent = s.sessionId === currentSessionId
                return (
                  <button
                    key={s.sessionId}
                    className={`log-session-item ${isCurrent ? "log-session-current" : ""}`}
                    onClick={() => openSession(s.sessionId)}
                  >
                    <div className="log-session-top">
                      <span
                        className="log-level-badge"
                        style={{ background: badge.color + "22", color: badge.color }}
                      >
                        {badge.label}
                      </span>
                      <span className="log-session-time">{relativeTime(s.lastActivity)}</span>
                    </div>
                    <p className="log-session-preview">
                      {s.firstUserMessage || "(trống)"}
                    </p>
                    <div className="log-session-meta">
                      <span>💬 {s.messageCount} tin nhắn</span>
                      {isCurrent && <span className="log-current-tag">Hiện tại</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Detail modal overlay */}
        {selectedSession && (
          <div className="log-detail-overlay" onClick={closeDetail}>
            <div className="log-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="log-detail-header">
                <h3>Chi tiết hội thoại</h3>
                <button onClick={closeDetail} className="log-detail-close">✕</button>
              </div>
              <div className="log-detail-body">
                {logLoading ? (
                  <div className="log-empty">
                    <div className="log-spinner" />
                    <p>Đang tải...</p>
                  </div>
                ) : chatLog.length === 0 ? (
                  <div className="log-empty">
                    <p>Không có tin nhắn</p>
                  </div>
                ) : (
                  chatLog.map((msg) => (
                    <div key={msg.id} className={`log-msg log-msg-${msg.role}`}>
                      <div className="log-msg-header">
                        <span className="log-msg-role">
                          {msg.role === "user" ? "👤 Người dùng" : "🤖 AI"}
                        </span>
                        <span className="log-msg-time">
                          {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit", minute: "2-digit", second: "2-digit"
                          })}
                        </span>
                      </div>
                      <p className="log-msg-content">{msg.content}</p>
                      {msg.metadata && (
                        <div className="log-msg-meta">
                          {(msg.metadata as any).level && (
                            <span className="log-meta-tag">
                              Level: {(msg.metadata as any).level}
                            </span>
                          )}
                          {(msg.metadata as any).specialtyCode && (
                            <span className="log-meta-tag">
                              Khoa: {(msg.metadata as any).specialtyCode}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

LogPanel.displayName = "LogPanel"
export default LogPanel

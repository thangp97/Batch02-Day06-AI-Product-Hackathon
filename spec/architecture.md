# Kiến trúc hệ thống — Triage Chatbot

---

## Tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER (trình duyệt)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND  (React + TS)                         │
│                     localhost:5173                                │
│                                                                  │
│   ┌───────────────┐   ┌──────────────────┐   ┌──────────────┐  │
│   │   ChatInput   │   │  ConversationCtx │   │ Path renders │  │
│   │  (textarea +  │──▶│  symptoms        │──▶│  ClearCard   │  │
│   │   send btn)   │   │  currentLevel    │   │  LCBubble    │  │
│   └───────────────┘   │  messages[]      │   │  RedFlagBan  │  │
│                        │  specialty       │   │  OverridePanel│ │
│   ┌───────────────┐   │  slots           │   └──────────────┘  │
│   │  ChatBubble   │◀──│  pendingQuestion │                      │
│   │  (user / ai)  │   └──────────────────┘                      │
│   └───────────────┘                                              │
│                                                                  │
│            ▲ render                   │ Axios HTTP calls         │
└────────────┼───────────────────────────┼────────────────────────┘
             │                           │
             │                           ▼  (CORS required)
┌────────────┼───────────────────────────────────────────────────┐
│            │            BACKEND  (Express + TS)                  │
│            │             localhost:5000                           │
│            │                                                     │
│   ┌────────┴─────────────────────────────────────────────────┐  │
│   │                    Routes                                  │  │
│   │  POST /triage          ──► triageHandler                  │  │
│   │  POST /triage/followup ──► followupHandler                │  │
│   │  GET  /specialties     ──► specialtiesHandler             │  │
│   │  GET  /specialties/:id/slots ──► slotsHandler             │  │
│   │  POST /log             ──► logHandler                     │  │
│   └───────────────────────────┬──────────────────────────────┘  │
│                               │                                  │
│          ┌────────────────────┴─────────────────────┐           │
│          │                                           │           │
│          ▼                                           ▼           │
│   ┌─────────────┐                        ┌───────────────────┐  │
│   │  Prisma ORM │                        │   LLM Client      │  │
│   │  (DB query) │                        │ claude-sonnet-4-6 │  │
│   └──────┬──────┘                        └───────────────────┘  │
│          │                                                       │
└──────────┼───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                           │
│                                                                   │
│  ┌──────────────┐  ┌─────────────────────┐  ┌────────────────┐  │
│  │ specialties  │  │       slots         │  │  triage_logs   │  │
│  │─────────────│  │─────────────────────│  │────────────────│  │
│  │ id (PK)      │  │ id (PK)             │  │ id (PK)        │  │
│  │ code         │◀─│ specialty_id (FK)   │  │ symptoms       │  │
│  │ name         │  │ doctor              │  │ ai_level       │  │
│  └──────────────┘  │ scheduled_at        │  │ ai_suggested   │  │
│                    │ available           │  │ user_action    │  │
│                    └─────────────────────┘  │ user_selected  │  │
│                                             │ created_at     │  │
│                                             └────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Luồng hội thoại (Conversation Flow)

```
User nhập triệu chứng
        │
        ▼
[Frontend] POST /triage {symptoms}
        │
        ▼
[Backend] gọi LLM → classify level
        │
        ├─── level = "clear" ───────────────────────────────────┐
        │                                                        │
        ├─── level = "low-confidence" ──────────┐               │
        │                                        │               │
        └─── level = "red-flag" ─────┐           │               │
                                     │           │               │
                                     ▼           ▼               ▼
                             ┌──────────┐  ┌──────────┐  ┌──────────────┐
                             │ RedFlag  │  │    LC    │  │    Clear     │
                             │ Banner   │  │  Bubble  │  │    Card      │
                             │          │  │ (câu hỏi)│  │  specialty   │
                             │ hotline  │  └────┬─────┘  │  slots[]     │
                             │   115    │       │        │  btn đặt lịch│
                             │          │  User trả lời  └──────┬───────┘
                             │ NO BOOK  │       │               │
                             └──────────┘       ▼          User chấp nhận
                                         POST /followup         │
                                                │               ▼
                                         re-classify         DONE ✓
                                                │
                                         ┌──────┴──────┐
                                         │    clear     │
                                         │  (hoặc NOI   │
                                         │ TONG QUAT)   │
                                         └─────────────┘
                                                │
                                         Hiện slot → Done ✓
```

---

## Luồng Override / Failure path

```
[Clear Card hiện ra]
        │
        ├─── User chấp nhận → Đặt lịch → DONE
        │
        └─── User biết AI sai
                    │
                    ├── "Nhập lại triệu chứng" → reset state → về input ban đầu
                    │                            POST /log {userAction: "retry"}
                    │
                    └── "Chọn chuyên khoa khác"
                                    │
                                    ▼
                            GET /specialties
                            (dropdown danh sách)
                                    │
                            User chọn khoa
                                    │
                            GET /specialties/:id/slots
                                    │
                            POST /log {userAction: "override"}
                                    │
                            Hiện slot của khoa mới → Done ✓
```

---

## State machine (Frontend)

```
          ┌──────┐
          │ IDLE │ ◀──── reset / "Nhập lại triệu chứng"
          └──┬───┘
             │ user submit
             ▼
        ┌─────────┐
        │ LOADING │ (POST /triage đang chạy)
        └────┬────┘
             │
    ┌────────┼──────────┐
    │        │          │
    ▼        ▼          ▼
┌───────┐ ┌────┐ ┌──────────┐
│ CLEAR │ │ LC │ │ RED_FLAG │
└───┬───┘ └─┬──┘ └──────────┘
    │        │ user trả lời
    │        ▼
    │   ┌─────────┐
    │   │ LOADING │ (POST /followup)
    │   └────┬────┘
    │        │
    │        ▼
    │   ┌───────┐
    └──▶│ CLEAR │ (hoặc fallback Nội tổng quát)
        └───┬───┘
            │ user bấm "Chọn chuyên khoa khác"
            ▼
       ┌──────────┐
       │ OVERRIDE │ (GET /specialties → dropdown)
       └──────────┘
```

---

## API Contract (tóm tắt)

| Endpoint | Request | Response quan trọng |
|----------|---------|---------------------|
| `POST /triage` | `{symptoms}` | `{level, message, question, specialty, slots, disclaimer}` |
| `POST /triage/followup` | `{symptoms, answer}` | Cấu trúc giống `/triage` |
| `GET /specialties` | — | `{specialties: Specialty[]}` |
| `GET /specialties/:id/slots` | — | `{specialty, slots: Slot[]}` |
| `POST /log` | `{symptoms, aiLevel, aiSuggested, userAction, userSelected}` | `{ok, logId}` |

### Guard bắt buộc

- `level = "red-flag"` → **backend strip `specialty` và `slots`** trước khi trả về
- `level = "red-flag"` → **frontend KHÔNG render slot/nút đặt lịch** dù response có gì đi nữa (defense-in-depth)
- `disclaimer` luôn hiển thị dưới mọi AI response
- `/triage/followup` chỉ gọi tối đa 1 lần / conversation — frontend giữ flag `followupUsed`

---

## Vấn đề kiến trúc cần lưu ý

| Vấn đề | Mức độ | Cách xử lý hiện tại |
|--------|--------|---------------------|
| Không có session ID → không enforce "max 1 followup" ở backend | Trung bình | Frontend giữ flag `followupUsed` |
| LLM trả JSON sai format → 500 crash | **Cao** | Thắng cần test prompt kỹ + try/catch fallback |
| CORS chưa cấu hình → mọi API call bị chặn | **Cao** | Thắng thêm `cors` middleware ngay khi setup Express |
| Không có streaming → loading 1–2s blank | Thấp | Chấp nhận cho hackathon |

# Triage Chatbot — Prototype

**Nhóm:** Zone 1 – Nhóm 2 | **Track:** Healthcare

---

## Luồng hoạt động

```
User nhập triệu chứng
        │
        ▼
┌───────────────────┐
│   POST /triage    │  ← gọi LLM phân tầng
└───────────────────┘
        │
        ├── level = "clear" ──────────────────────────────────────┐
        │                                                          │
        ├── level = "low-confidence" ──────┐                      │
        │                                  │                      │
        └── level = "red-flag" ───────┐    │                      │
                                      │    │                      │
                                      ▼    ▼                      ▼
                              ┌─────────────┐           ┌──────────────────┐
                              │  Block đặt  │           │ Gợi ý chuyên khoa│
                              │   lịch +    │           │  + hiện slot +   │
                              │  Hotline    │           │  offer đặt lịch  │
                              │    115      │           └──────────────────┘
                              └─────────────┘                    │
                                                                 │── User chấp nhận → Done
                                      │                          │
                              AI hỏi thêm 1 câu                 │── User từ chối → Override
                                      │
                              User trả lời
                                      │
                                      ▼
                              POST /triage/followup
                                      │
                              Re-classify → clear / fallback Nội tổng quát
```

---

## Bốn path demo

| Path | Input ví dụ | Kết quả |
|---|---|---|
| **Happy (clear)** | "đau mắt đỏ, chảy nước mắt 2 ngày" | Gợi ý Chuyên khoa Mắt → hiện slot → đặt lịch |
| **Low-confidence** | "hay mệt mỏi, đôi khi đau đầu" | AI hỏi thêm 1 câu → re-classify → gợi ý khoa |
| **Red-flag** | "đau ngực, khó thở, tay trái tê" | Block đặt lịch + cảnh báo + hotline 115 |
| **Failure/Override** | AI gợi sai → user biết | Nút "Nhập lại" hoặc "Chọn chuyên khoa khác" |

---

## Cấu trúc project

```
codebase/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       ← DB schema (Specialty, Slot, TriageLog)
│   │   └── seed.ts             ← Mock data: 6 khoa, 16 slot
│   ├── src/
│   │   ├── index.ts            ← Express app entry point
│   │   ├── db.ts               ← Prisma client
│   │   └── routes/
│   │       ├── triage.ts       ← POST /triage, POST /triage/followup
│   │       ├── specialties.ts  ← GET /specialties, GET /specialties/:id/slots
│   │       └── log.ts          ← POST /log
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── frontend/
    └── (React app)
```

---

## Cách chạy

### Yêu cầu

- Node.js >= 18
- PostgreSQL đang chạy local
- API key: Anthropic hoặc OpenAI

### Backend

```bash
cd codebase/backend

# Cài dependencies
npm install

# Tạo file .env từ mẫu và điền thông tin
cp .env.example .env

# Tạo bảng trong PostgreSQL
npm run db:migrate

# Seed mock data (6 chuyên khoa, 16 slot)
npm run db:seed

# Chạy dev server
npm run dev
# → http://localhost:5000
```

### Frontend

```bash
cd codebase/frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Công cụ và API đã dùng

| Hạng mục | Công nghệ |
|---|---|
| AI / LLM | Anthropic Claude (claude-sonnet-4-6) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Frontend | React, TypeScript, TailwindCSS |
| Dev tool | ts-node-dev, Prisma Studio |

---

## Phân công

| Thành viên | Phụ trách |
|---|---|
| **Vũ Duy Bảo** — 2A202600565 | Research & evidence, spec mục 1–3 |
| **Phạm Mạnh Thắng** — 2A202600921 | Backend: Express routes, prompt engineering, kiểm thử red-flag path |
| **Vũ Quang Bảo** — 2A202600610 | Frontend: React UI 4 path, demo script |

---

## Biến môi trường

Xem `.env.example` trong `backend/`. Không commit file `.env` thật vào repo.

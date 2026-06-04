# Triage Chatbot — Prototype

**Nhóm:** Zone 1 – Nhóm 2 | **Track:** Healthcare

---

## Luồng hoạt động

```
User nhập triệu chứng
        │
        ▼
┌───────────────────┐
│   POST /triage    │  ← gọi LLM qua OpenRouter, input wrap trong <symptoms>
└───────────────────┘
        │
        ├── level = "out-of-scope" ──→ Từ chối, hướng dẫn nhập triệu chứng
        │
        ├── level = "red-flag" ──────→ Block đặt lịch + cảnh báo + hotline 115
        │
        ├── level = "low-confidence" ─→ AI hỏi thêm 1 câu
        │                                      │
        │                               User trả lời
        │                                      │
        │                                      ▼
        │                         POST /triage/followup
        │                                      │
        │                         Re-classify → clear
        │                         (fallback Nội tổng quát nếu vẫn mờ)
        │                                      │
        └── level = "clear" ──────────────────►┤
                                               │
                                               ▼
                                  Gợi ý chuyên khoa + hiện slot
                                               │
                              ┌────────────────┴────────────────┐
                              │                                 │
                    User chấp nhận                    User từ chối (Override)
                              │                                 │
                              ▼                                 ▼
                     POST /bookings              GET /specialties → chọn thủ công
                              │                                 │
                              ▼                                 ▼
                  Booking thành công ✅              POST /bookings với khoa mới
```

---

## Bốn path demo

| Path | Input ví dụ | Kết quả |
|---|---|---|
| **Happy (clear)** | "đau mắt đỏ, chảy nước mắt 2 ngày" | Gợi ý Chuyên khoa Mắt → hiện slot → đặt lịch thành công |
| **Low-confidence** | "hay mệt mỏi, đôi khi đau đầu" | AI hỏi thêm 1 câu → re-classify → gợi ý khoa + đặt lịch |
| **Red-flag** | "đau ngực, khó thở, tay trái tê" | Block đặt lịch + cảnh báo + hotline 115 |
| **Failure/Override** | AI gợi sai → user biết | Nút "Nhập lại" hoặc dropdown chọn chuyên khoa khác |

---

## Cấu trúc project

```
codebase/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       ← 6 model: Specialty, Slot, Booking, TriageLog, ConversationMessage, Feedback
│   │   └── seed.ts             ← Mock data: 6 khoa, 33 slot với tên bác sĩ thật
│   ├── src/
│   │   ├── index.ts            ← Express app + helmet + rate limit + cors
│   │   ├── db.ts               ← Prisma client singleton
│   │   ├── lib/
│   │   │   ├── llm.ts          ← OpenRouter provider (openai-compatible)
│   │   │   └── guards.ts       ← detectInjection, sanitizeInput, isValidPhone, validateLLMResponse
│   │   └── routes/
│   │       ├── triage.ts       ← POST /triage, POST /triage/followup
│   │       ├── specialties.ts  ← GET /specialties, GET /specialties/:id/slots
│   │       ├── bookings.ts     ← POST /bookings, GET /bookings/:id
│   │       ├── conversations.ts ← POST /conversations, GET /conversations/:sessionId
│   │       ├── feedback.ts     ← POST /feedback, GET /feedback
│   │       └── log.ts          ← POST /log
│   ├── docker-compose.yml      ← PostgreSQL trên Docker (port 5433)
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
- Docker (để chạy PostgreSQL)
- OpenRouter API key — lấy tại openrouter.ai/keys

### Backend — chế độ dev (local)

```bash
cd codebase/backend

# Cài dependencies
npm install

# Tạo file .env và điền thông tin
cp .env.example .env

# Khởi động PostgreSQL qua Docker
docker-compose up -d postgres

# Push schema lên DB và seed data
npx prisma db push
npm run db:seed

# Chạy dev server (hot reload)
npm run dev
# → http://localhost:5000/api/health
```

### Backend — chế độ production (Docker full-stack)

```bash
cd codebase/backend

# Tạo .env với OPENROUTER_API_KEY
cp .env.example .env
# Điền OPENROUTER_API_KEY vào .env

# Lần đầu: build + khởi động + seed
RUN_SEED=true docker-compose up --build -d

# Các lần tiếp theo (không seed lại)
docker-compose up -d

# Xem log
docker-compose logs -f backend

# Seed thủ công khi cần
docker-compose exec backend npx ts-node prisma/seed.ts

# Dừng toàn bộ
docker-compose down
```

> **Lưu ý:** Khi chạy full Docker, backend kết nối DB qua hostname nội bộ `postgres:5432` (không phải `localhost:5433`). Biến `DATABASE_URL` trong `docker-compose.yml` đã được set sẵn — không cần sửa `.env`.

### Frontend

```bash
cd codebase/frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Biến môi trường (`.env`)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/triage_chatbot"
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="openai/gpt-4o-mini"
PORT=5000
```

---

## Công cụ và API đã dùng

| Hạng mục | Công nghệ |
|---|---|
| AI / LLM | OpenRouter (gpt-4o-mini mặc định) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM + Docker |
| Frontend | React, TypeScript, TailwindCSS |
| Dev tool | ts-node-dev, Prisma Studio, Docker |

---

## Phân công

| Thành viên | Phụ trách |
|---|---|
| **Vũ Duy Bảo** — 2A202600565 | Research & evidence, spec mục 1–3 |
| **Phạm Mạnh Thắng** — 2A202600921 | Backend: Express routes, prompt engineering, kiểm thử red-flag path |
| **Vũ Quang Bảo** — 2A202600610 | Frontend: React UI 4 path, demo script |

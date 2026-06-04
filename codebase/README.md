# Triage Chatbot — Prototype

**Nhóm:** Zone 1 – Nhóm 2 | **Track:** Healthcare

---

## Luồng hoạt động

### Luồng triage (khám mới)

```
User nhập triệu chứng
        │
        ▼
┌───────────────────┐
│   POST /triage    │  ← crisis detection trước, rồi gọi LLM qua OpenRouter
└───────────────────┘
        │
        ├── crisis (tự tử / mất máu / bất tỉnh)
        │       └─→ red-flag ngay (không qua LLM) + hotline 115 + 1800 599 920
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
              POST /bookings (bookingType:"new")   GET /specialties → chọn thủ công
                              │                                 │
                              ▼                                 ▼
                  Booking thành công ✅         POST /bookings với khoa mới
```

### Luồng tái khám

```
User chọn "Đặt tái khám"
        │
        ▼
GET /specialties          ← danh sách 6 chuyên khoa
        │
        ▼
GET /specialties/:id/doctors  ← danh sách bác sĩ của khoa đã chọn
        │
        ▼
GET /specialties/:id/slots?doctor=<tên>  ← slot còn trống của bác sĩ đó
        │
        ▼
POST /bookings (bookingType:"followup")
        │
        ▼
Tái khám đặt thành công ✅
```

---

## Các path demo

| Path | Input ví dụ | Kết quả |
|---|---|---|
| **Happy (clear)** | "đau mắt đỏ, chảy nước mắt 2 ngày" | Gợi ý Chuyên khoa Mắt → hiện slot → đặt lịch thành công |
| **Low-confidence** | "hay mệt mỏi, đôi khi đau đầu" | AI hỏi thêm 1 câu → re-classify → gợi ý khoa + đặt lịch |
| **Red-flag** | "đau ngực, khó thở, tay trái tê" | Block đặt lịch + cảnh báo + hotline 115 |
| **Crisis** | "tôi chán sống, tôi không muốn sống nữa" | Red-flag tức thì (không qua LLM) + hotline 115 + 1800 599 920 |
| **Failure/Override** | AI gợi sai → user biết | Nút "Nhập lại" hoặc dropdown chọn chuyên khoa khác |
| **Tái khám** | User chọn "Đặt tái khám" | Chọn khoa → chọn bác sĩ → chọn slot → đặt `bookingType:"followup"` |

---

## Cấu trúc project

```
codebase/
├── docker-compose.yml          ← Full-stack: PostgreSQL + Backend + Frontend
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       ← 6 model: Specialty, Slot, Booking, TriageLog, ConversationMessage, Feedback
│   │   └── seed.ts             ← Mock data: 6 khoa, 32 slot với tên bác sĩ thật
│   ├── src/
│   │   ├── index.ts            ← Express app + helmet + rate limit + cors
│   │   ├── db.ts               ← Prisma client singleton
│   │   ├── lib/
│   │   │   ├── llm.ts          ← OpenRouter provider (openai-compatible)
│   │   │   └── guards.ts       ← detectCrisis, detectInjection, sanitizeInput, isValidPhone
│   │   └── routes/
│   │       ├── triage.ts       ← POST /triage (+ crisis detection), POST /triage/followup
│   │       ├── specialties.ts  ← GET /specialties, GET /specialties/:id/doctors, GET /specialties/:id/slots
│   │       ├── bookings.ts     ← POST /bookings (new + followup), GET /bookings/:id
│   │       ├── conversations.ts ← POST /conversations, GET /conversations/:sessionId
│   │       ├── feedback.ts     ← POST /feedback, GET /feedback
│   │       └── log.ts          ← POST /log
│   ├── docker-compose.yml      ← Backend + PostgreSQL (dev, không có frontend)
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   └── App.tsx             ← React 19 + Vite + TailwindCSS 4 + Axios
    ├── Dockerfile              ← Multi-stage: node:20-alpine → nginx:stable-alpine
    ├── nginx.conf              ← SPA fallback + static asset caching
    └── package.json
```

---

## Cách chạy

### Yêu cầu

- Node.js >= 18 (chỉ cần khi chạy dev)
- Docker Desktop — tải tại [docker.com](https://www.docker.com/products/docker-desktop)
- OpenRouter API key — lấy tại [openrouter.ai/keys](https://openrouter.ai/keys)

---

### Chạy toàn bộ dự án bằng Docker (khuyên dùng)

```powershell
cd codebase

# Bước 1: Tạo file .env cho backend
cp backend/.env.example backend/.env
# Mở backend/.env và điền OPENROUTER_API_KEY=sk-or-v1-...

# Bước 2: Build + khởi động toàn bộ stack (lần đầu — có seed data)
$env:RUN_SEED="true"; docker compose up --build -d

# Bước 3: Kiểm tra các service đã chạy
docker compose ps
```

Sau khi chạy xong:

| Service | URL |
|---|---|
| **Frontend** (React) | http://localhost:3000 |
| **Backend API** | http://localhost:5000/api/health |
| **PostgreSQL** | localhost:5433 (user: postgres / postgres) |

```powershell
# Các lần chạy tiếp theo (không seed lại)
docker compose up -d

# Xem log realtime
docker compose logs -f

# Xem log từng service
docker compose logs -f backend
docker compose logs -f frontend

# Seed lại dữ liệu thủ công
docker compose exec backend npx ts-node prisma/seed.ts

# Dừng toàn bộ (giữ data)
docker compose down

# Dừng và xoá toàn bộ data
docker compose down -v
```

---

### Chạy dev (local, hot reload)

#### Backend

```powershell
cd codebase/backend

npm install
cp .env.example .env
# Điền OPENROUTER_API_KEY vào .env

# Khởi động PostgreSQL
docker compose up -d postgres

# Push schema + seed
npx prisma db push
npm run db:seed

# Dev server (hot reload)
npm run dev
# → http://localhost:5000/api/health
```

#### Frontend

```powershell
cd codebase/frontend

npm install
npm run dev
# → http://localhost:5173
```

> **Lưu ý:** Khi chạy dev, frontend gọi backend qua `http://localhost:5000/api` (mặc định trong Vite). Đảm bảo backend đang chạy trước khi mở frontend.

---

## Biến môi trường

### `backend/.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/triage_chatbot"
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="openai/gpt-4o-mini"
PORT=5000
```

> Khi chạy Docker full-stack, `DATABASE_URL` bị override bởi `docker-compose.yml` để dùng hostname nội bộ `postgres:5432` — chỉ cần điền `OPENROUTER_API_KEY`.

### Frontend (`VITE_API_URL`)

Biến này được bake vào bundle lúc build. Mặc định `http://localhost:5000/api` — phù hợp cả Docker và dev local. Để đổi (ví dụ deploy lên server):

```powershell
$env:VITE_API_URL="https://api.example.com/api"; docker compose up --build -d
```

---

## Công cụ và API đã dùng

| Hạng mục | Công nghệ |
|---|---|
| AI / LLM | OpenRouter API — model `gpt-4o-mini` (mặc định) |
| Backend | Node.js 20, Express 5, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 (Alpine) |
| Frontend | React 19, Vite 8, TailwindCSS 4, Axios, TypeScript |
| Bảo mật | helmet, express-rate-limit, prompt injection guard, crisis detection |
| Container | Docker multi-stage build, nginx (serve frontend), docker compose |
| Dev tool | ts-node-dev, Prisma Studio |

---

## Phân công

| Thành viên | Phụ trách |
|---|---|
| **Vũ Duy Bảo** — 2A202600565 | Research & evidence, spec mục 1–3 |
| **Phạm Mạnh Thắng** — 2A202600921 | Backend: Express routes, prompt engineering, kiểm thử red-flag path |
| **Vũ Quang Bảo** — 2A202600610 | Frontend: React UI 4 path, demo script |

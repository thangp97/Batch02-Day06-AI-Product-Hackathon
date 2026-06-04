# API Spec — Triage Chatbot

**Stack:** Node.js + Express + PostgreSQL (Prisma ORM) + LLM (Claude / OpenAI)  
**Base URL:** `http://localhost:5000/api`

---

## Database Schema (PostgreSQL)

```sql
-- Danh sách chuyên khoa
CREATE TABLE specialties (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(20)  UNIQUE NOT NULL,  -- vd: 'MAT', 'THAN_KINH'
  name        VARCHAR(100) NOT NULL
);

-- Slot khám theo chuyên khoa
CREATE TABLE slots (
  id             SERIAL PRIMARY KEY,
  specialty_id   INTEGER REFERENCES specialties(id) ON DELETE CASCADE,
  doctor         VARCHAR(100) NOT NULL,
  scheduled_at   TIMESTAMP   NOT NULL,
  available      BOOLEAN     DEFAULT TRUE
);

-- Log hành động chỉnh sửa của user (tập kiểm thử)
CREATE TABLE triage_logs (
  id               SERIAL PRIMARY KEY,
  symptoms         TEXT        NOT NULL,
  ai_level         VARCHAR(20) NOT NULL,   -- 'clear' | 'low-confidence' | 'red-flag'
  ai_suggested     VARCHAR(100),
  user_action      VARCHAR(10) NOT NULL,   -- 'override' | 'retry'
  user_selected    VARCHAR(100),
  created_at       TIMESTAMP   DEFAULT NOW()
);
```

---

## Tổng quan các endpoint

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/triage` | Phân tầng triệu chứng lần đầu |
| `POST` | `/triage/followup` | Re-triage sau câu hỏi thu hẹp |
| `GET` | `/specialties` | Lấy danh sách chuyên khoa |
| `GET` | `/specialties/:id/slots` | Lấy slot khả dụng theo chuyên khoa |
| `POST` | `/log` | Lưu hành động user (override, nhập lại) |

---

## 1. `POST /triage`

Nhận triệu chứng đầu vào, gọi LLM phân tầng, trả về action tương ứng.

### Request

```json
{
  "symptoms": "hay mệt mỏi, đôi khi đau đầu"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `symptoms` | `string` | ✅ | Triệu chứng do user nhập, tối đa 500 ký tự |

### Response

```json
{
  "level": "low-confidence",
  "message": "Bạn có bị chóng mặt hoặc buồn nôn kèm theo không?",
  "question": "Bạn có bị chóng mặt hoặc buồn nôn kèm theo không?",
  "specialty": null,
  "slots": null,
  "disclaimer": "Đây là gợi ý tham khảo — gặp bác sĩ để xác nhận."
}
```

| Field | Type | Mô tả |
|---|---|---|
| `level` | `"clear" \| "low-confidence" \| "red-flag"` | Mức phân tầng |
| `message` | `string` | Nội dung hiển thị trong chat bubble |
| `question` | `string \| null` | Câu hỏi thu hẹp — chỉ có khi `level = low-confidence` |
| `specialty` | `Specialty \| null` | Chuyên khoa gợi ý — chỉ có khi `level = clear` |
| `slots` | `Slot[] \| null` | Danh sách slot — chỉ có khi `level = clear` |
| `disclaimer` | `string` | Luôn có ở mọi response |

### Ví dụ theo từng path

**Clear**
```json
// Request
{ "symptoms": "đau mắt đỏ, chảy nước mắt 2 ngày" }

// Response
{
  "level": "clear",
  "message": "Triệu chứng của bạn phù hợp với Chuyên khoa Mắt.",
  "question": null,
  "specialty": { "id": 1, "code": "MAT", "name": "Chuyên khoa Mắt" },
  "slots": [
    { "id": 1, "doctor": "BS. Nguyễn Văn A", "scheduledAt": "2026-06-07T09:00:00Z", "available": true },
    { "id": 2, "doctor": "BS. Trần Thị B",   "scheduledAt": "2026-06-07T14:00:00Z", "available": true }
  ],
  "disclaimer": "Đây là gợi ý tham khảo — gặp bác sĩ để xác nhận."
}
```

**Low-confidence**
```json
// Request
{ "symptoms": "hay mệt mỏi, đôi khi đau đầu" }

// Response
{
  "level": "low-confidence",
  "message": "Bạn có bị chóng mặt hoặc buồn nôn kèm theo không?",
  "question": "Bạn có bị chóng mặt hoặc buồn nôn kèm theo không?",
  "specialty": null,
  "slots": null,
  "disclaimer": "Đây là gợi ý tham khảo — gặp bác sĩ để xác nhận."
}
```

**Red-flag**
```json
// Request
{ "symptoms": "đau ngực, khó thở, tay trái tê" }

// Response
{
  "level": "red-flag",
  "message": "Triệu chứng của bạn có thể là dấu hiệu cấp cứu. Hãy đến cơ sở y tế gần nhất ngay lập tức hoặc gọi 115.",
  "question": null,
  "specialty": null,
  "slots": null,
  "hotline": "115",
  "disclaimer": "Đây là gợi ý tham khảo — gặp bác sĩ để xác nhận."
}
```

---

## 2. `POST /triage/followup`

Re-triage sau khi user trả lời câu hỏi thu hẹp. Chỉ gọi khi `level = low-confidence`.

### Request

```json
{
  "symptoms": "hay mệt mỏi, đôi khi đau đầu",
  "answer": "có, tôi bị chóng mặt khi đứng dậy"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `symptoms` | `string` | ✅ | Triệu chứng gốc từ lượt đầu |
| `answer` | `string` | ✅ | Câu trả lời của user cho câu hỏi thu hẹp |

### Response

Cấu trúc giống `/triage`. Nếu vẫn không rõ sau 1 vòng hỏi thêm, trả về fallback Nội tổng quát:

```json
{
  "level": "clear",
  "message": "Dựa trên triệu chứng, bạn nên khám Nội tổng quát trước để được tư vấn thêm.",
  "question": null,
  "specialty": { "id": 3, "code": "NOI_TONG_QUAT", "name": "Nội tổng quát" },
  "slots": [ ... ],
  "disclaimer": "Đây là gợi ý tham khảo — gặp bác sĩ để xác nhận."
}
```

> **Lưu ý:** Endpoint này chỉ được gọi tối đa 1 lần cho mỗi conversation. Nếu sau followup AI vẫn low-confidence, backend tự fallback về Nội tổng quát — không hỏi thêm lần 3.

---

## 3. `GET /specialties`

Lấy danh sách chuyên khoa từ bảng `specialties` trong PostgreSQL.

### Response

```json
{
  "specialties": [
    { "id": 1, "code": "MAT",          "name": "Chuyên khoa Mắt" },
    { "id": 2, "code": "THAN_KINH",    "name": "Thần kinh" },
    { "id": 3, "code": "NOI_TONG_QUAT","name": "Nội tổng quát" },
    { "id": 4, "code": "TIEU_HOA",     "name": "Tiêu hóa" },
    { "id": 5, "code": "TIM_MACH",     "name": "Tim mạch" },
    { "id": 6, "code": "CO_XUONG_KHOP","name": "Cơ xương khớp" }
  ]
}
```

Dùng cho **Failure/Override path** — frontend hiển thị dropdown để user chọn thủ công.

---

## 4. `GET /specialties/:id/slots`

Lấy slot khả dụng của một chuyên khoa từ bảng `slots`.

### Params

| Param | Type | Mô tả |
|---|---|---|
| `id` | `integer` | ID chuyên khoa (từ bảng `specialties`) |

### Query (tuỳ chọn)

| Param | Type | Mô tả |
|---|---|---|
| `date` | `string` (YYYY-MM-DD) | Lọc slot theo ngày |

### Response

```json
{
  "specialty": { "id": 1, "code": "MAT", "name": "Chuyên khoa Mắt" },
  "slots": [
    { "id": 1, "doctor": "BS. Nguyễn Văn A", "scheduledAt": "2026-06-07T09:00:00Z", "available": true },
    { "id": 2, "doctor": "BS. Trần Thị B",   "scheduledAt": "2026-06-07T14:00:00Z", "available": false },
    { "id": 3, "doctor": "BS. Nguyễn Văn A", "scheduledAt": "2026-06-08T09:00:00Z", "available": true }
  ]
}
```

---

## 5. `POST /log`

INSERT một bản ghi vào bảng `triage_logs`. Gọi khi user override chuyên khoa hoặc nhập lại triệu chứng.

### Request

```json
{
  "symptoms": "hay mệt mỏi, đôi khi đau đầu",
  "aiLevel": "clear",
  "aiSuggested": "Nội tổng quát",
  "userAction": "override",
  "userSelected": "Thần kinh"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `symptoms` | `string` | ✅ | Triệu chứng gốc user đã nhập |
| `aiLevel` | `"clear" \| "low-confidence" \| "red-flag"` | ✅ | Mức AI đã classify |
| `aiSuggested` | `string \| null` | ✅ | Chuyên khoa AI đã gợi ý |
| `userAction` | `"override" \| "retry"` | ✅ | `override` = chọn khoa khác, `retry` = nhập lại triệu chứng |
| `userSelected` | `string \| null` | | Chuyên khoa user chọn thủ công (nếu `override`) |

### Response

```json
{ "ok": true, "logId": 42 }
```

> `logId` là `id` của bản ghi vừa INSERT vào `triage_logs`.

---

## Kiểu dữ liệu dùng chung

```typescript
type TriageLevel = "clear" | "low-confidence" | "red-flag"

type Specialty = {
  id: number          // SERIAL từ PostgreSQL
  code: string        // vd: "MAT", "THAN_KINH"
  name: string
}

type Slot = {
  id: number          // SERIAL từ PostgreSQL
  doctor: string
  scheduledAt: string // ISO 8601 — "2026-06-07T09:00:00Z"
  available: boolean
}

type TriageResponse = {
  level: TriageLevel
  message: string
  question: string | null
  specialty: Specialty | null
  slots: Slot[] | null
  hotline?: string      // chỉ khi red-flag
  disclaimer: string
}
```

---

## Error responses

| HTTP Status | Code | Khi nào |
|---|---|---|
| `400` | `MISSING_SYMPTOMS` | `symptoms` rỗng hoặc thiếu |
| `400` | `SYMPTOMS_TOO_LONG` | `symptoms` vượt 500 ký tự |
| `404` | `SPECIALTY_NOT_FOUND` | `id` không tồn tại trong bảng `specialties` |
| `500` | `LLM_ERROR` | LLM không trả về JSON hợp lệ |
| `500` | `DB_ERROR` | Lỗi kết nối PostgreSQL |

```json
{
  "error": "SPECIALTY_NOT_FOUND",
  "message": "Chuyên khoa không tồn tại."
}
```

---

## Quy tắc bắt buộc (Backend guard)

1. Nếu `level = red-flag`: **strip toàn bộ** `specialty` và `slots` trước khi trả về — dù LLM có trả về hay không.
2. `disclaimer` luôn có mặt trong mọi response thành công.
3. `/triage/followup` chỉ được gọi tối đa 1 lần — backend không có endpoint `followup/followup`.
4. Tất cả query PostgreSQL phải dùng **parameterized queries** (qua Prisma hoặc `pg` với `$1, $2`) — không nối string SQL trực tiếp.



Người 1 — Frontend (React)

  ┌───────────────────────┬─────────────────────────────────────────────────────────────────────────────────┐
  │         Việc          │                                    Chi tiết                                     │
  ├───────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Chat UI               │ Khung chat: input triệu chứng, hiển thị bubble AI/user, loading state           │
  ├───────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Clear path            │ Card gợi ý chuyên khoa + danh sách slot mock + nút "Đặt lịch"                   │
  ├───────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Low-confidence path   │ Bubble câu hỏi thu hẹp của AI → input trả lời → re-render kết quả               │
  ├───────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Red-flag path         │ Banner cảnh báo nổi bật + số hotline cấp cứu + ẩn hoàn toàn nút đặt lịch        │
  ├───────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ Failure/Override path │ Nút "Nhập lại triệu chứng" + dropdown chọn chuyên khoa thủ công                 │
├───────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ State management      │ Quản lý trạng thái conversation (triệu chứng, path hiện tại, lịch sử hội thoại) │
  └───────────────────────┴─────────────────────────────────────────────────────────────────────────────────┘

  Stack: React, TailwindCSS (hoặc shadcn/ui), Axios
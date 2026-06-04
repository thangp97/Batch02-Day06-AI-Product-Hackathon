# API Spec — Triage Chatbot

**Stack:** Node.js + Express + PostgreSQL + LLM (Claude / OpenAI)  
**Base URL:** `http://localhost:5000/api`

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
| `specialty` | `string \| null` | Tên chuyên khoa gợi ý — chỉ có khi `level = clear` |
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
  "specialty": "Chuyên khoa Mắt",
  "slots": [
    { "id": "slot_01", "doctor": "BS. Nguyễn Văn A", "time": "09:00 - 07/06/2026", "available": true },
    { "id": "slot_02", "doctor": "BS. Trần Thị B",   "time": "14:00 - 07/06/2026", "available": true }
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

Cấu trúc giống `/triage`. Nếu vẫn không rõ sau 1 vòng hỏi thêm, trả về fallback:

```json
{
  "level": "clear",
  "message": "Dựa trên triệu chứng, bạn nên khám Nội tổng quát trước để được tư vấn thêm.",
  "question": null,
  "specialty": "Nội tổng quát",
  "slots": [ ... ],
  "disclaimer": "Đây là gợi ý tham khảo — gặp bác sĩ để xác nhận."
}
```

> **Lưu ý:** Endpoint này chỉ được gọi tối đa 1 lần cho mỗi conversation. Nếu sau followup AI vẫn low-confidence, backend tự fallback về Nội tổng quát — không hỏi thêm lần 3.

---

## 3. `GET /specialties`

Lấy danh sách chuyên khoa (mock data từ PostgreSQL).

### Response

```json
{
  "specialties": [
    { "id": "sp_mat",    "name": "Chuyên khoa Mắt" },
    { "id": "sp_than",   "name": "Thần kinh" },
    { "id": "sp_noi",    "name": "Nội tổng quát" },
    { "id": "sp_tieuhoa","name": "Tiêu hóa" },
    { "id": "sp_tim",    "name": "Tim mạch" },
    { "id": "sp_xuong",  "name": "Cơ xương khớp" }
  ]
}
```

Dùng cho **Failure/Override path** — frontend hiển thị dropdown để user chọn thủ công.

---

## 4. `GET /specialties/:id/slots`

Lấy slot khả dụng của một chuyên khoa.

### Params

| Param | Type | Mô tả |
|---|---|---|
| `id` | `string` | ID chuyên khoa (từ `/specialties`) |

### Response

```json
{
  "specialty": "Chuyên khoa Mắt",
  "slots": [
    { "id": "slot_01", "doctor": "BS. Nguyễn Văn A", "time": "09:00 - 07/06/2026", "available": true },
    { "id": "slot_02", "doctor": "BS. Trần Thị B",   "time": "14:00 - 07/06/2026", "available": false },
    { "id": "slot_03", "doctor": "BS. Nguyễn Văn A", "time": "09:00 - 08/06/2026", "available": true }
  ]
}
```

---

## 5. `POST /log`

Lưu hành động chỉnh sửa của user để làm tập kiểm thử. Gọi khi user override chuyên khoa hoặc nhập lại triệu chứng.

### Request

```json
{
  "symptoms": "hay mệt mỏi, đôi khi đau đầu",
  "aiSuggested": "Nội tổng quát",
  "userAction": "override",
  "userSelected": "Thần kinh"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `symptoms` | `string` | ✅ | Triệu chứng gốc user đã nhập |
| `aiSuggested` | `string \| null` | ✅ | Chuyên khoa AI đã gợi ý |
| `userAction` | `"override" \| "retry"` | ✅ | `override` = chọn khoa khác, `retry` = nhập lại triệu chứng |
| `userSelected` | `string \| null` | | Chuyên khoa user chọn thủ công (nếu `override`) |

### Response

```json
{ "ok": true }
```

---

## Kiểu dữ liệu dùng chung

```typescript
type TriageLevel = "clear" | "low-confidence" | "red-flag"

type Slot = {
  id: string
  doctor: string
  time: string        // "HH:mm - DD/MM/YYYY"
  available: boolean
}

type TriageResponse = {
  level: TriageLevel
  message: string
  question: string | null
  specialty: string | null
  slots: Slot[] | null
  hotline?: string            // chỉ khi red-flag
  disclaimer: string
}
```

---

## Error responses

| HTTP Status | Code | Khi nào |
|---|---|---|
| `400` | `MISSING_SYMPTOMS` | `symptoms` rỗng hoặc thiếu |
| `400` | `SYMPTOMS_TOO_LONG` | `symptoms` vượt 500 ký tự |
| `500` | `LLM_ERROR` | LLM không trả về JSON hợp lệ |
| `500` | `DB_ERROR` | Lỗi kết nối PostgreSQL |

```json
{
  "error": "MISSING_SYMPTOMS",
  "message": "Vui lòng nhập triệu chứng trước khi gửi."
}
```

---

## Quy tắc bắt buộc (Backend guard)

1. Nếu `level = red-flag`: **strip toàn bộ** `specialty` và `slots` trước khi trả về — dù LLM có trả về hay không.
2. `disclaimer` luôn có mặt trong mọi response thành công.
3. `/triage/followup` chỉ được gọi tối đa 1 lần — backend không có endpoint `followup/followup`.

# SPEC — Triage Chatbot Đặt Lịch Khám

**Nhóm:** Zone 1 – Nhóm 2  
**Track:** Healthcare  
**Ngày:** 04/06/2026

---

## 1. Bằng chứng

### Trải nghiệm trực tiếp (self-test)

| Quan sát | Nguồn | Path liên quan | Điều học được |
|---|---|---|---|
| Nhập "đau mắt đỏ, chảy nước mắt 2 ngày" → AI gợi ý đúng Chuyên khoa Mắt, offer đặt lịch ngay | Self-test BookingCare AI (`asset/Screenshot_1.png`) | Happy | Happy path hoạt động tốt khi triệu chứng rõ — không cần làm lại |
| Nhập "hay mệt mỏi, đôi khi đau đầu" → AI liệt kê 7 nhóm nguyên nhân, không gợi ý được 1 khoa cụ thể, hỏi chung "tìm bác sĩ phù hợp không?" | Self-test BookingCare AI (`asset/Screenshot_2.png`) | Low-confidence | AI dump thông tin thay vì hỏi thêm để thu hẹp → user đọc xong vẫn không biết đi đâu |
| Nhập "đau ngực, khó thở, tay trái tê" → AI cảnh báo "đến cấp cứu ngay" nhưng ngay sau vẫn hỏi "bạn có muốn đặt lịch Tim mạch không?" | Self-test BookingCare AI (`asset/Screenshot_3.png`) | Red-flag | Mâu thuẫn logic trực tiếp: cảnh báo cấp cứu + offer đặt lịch thường trong cùng 1 response — failure mode nguy hiểm nhất |
| Form Vinmec bắt user tự chọn Bệnh viện → Chuyên khoa → Bác sĩ trước khi thấy slot; không có gợi ý từ triệu chứng | Self-test Vinmec.com (`asset/vinmec1.png`) | Low-confidence | Toàn bộ gánh nặng chẩn đoán sơ bộ đẩy về user — ai không biết mình cần khoa nào sẽ bị kẹt ngay bước đầu |
| Nhập "Lý do khám: Tôi đau đầu lắm sắp ngất rồi" vào Vinmec → không có triage, không cảnh báo, xử lý như booking thường, hiện nút "Gửi thông tin" | Self-test Vinmec.com (`asset/vinmec2.png`) | Red-flag | Zero safety guardrail tại điểm nhập lý do khám — nguy hiểm hơn cả BookingCare vì không có cảnh báo gì |

### Nguồn bên ngoài nhóm

| Trích dẫn | Nguồn | Pain/failure mode |
|---|---|---|
| "Em đăng ký đóng tiền xong tới bệnh viện người ta bắt bốc số lại nè. Không xài được đâu mọi người đừng đăng ký phí tiền." | App Store Customer Reviews | On-to-Off gap: mã đặt chỗ bị vô hiệu hóa tại quầy → **Backlog** |
| "Có thím nào đặt hẹn khám bệnh qua web Bookingcare.vn chưa cho em chút kinh nghiệm với. Liệu có uy tín lắm không?" | Diễn đàn VOZ – Thread #87515 | Digital Trust: lo ngại lịch hẹn không được cơ sở y tế xác nhận chính thức → **Backlog** |
| "Phòng khám đổi lịch bác sĩ đột xuất nhưng tổng đài không báo trước, đến nơi mới ngã ngửa." | BookingCare Official Fanpage | Real-time sync gap → **Backlog** |
| August AI: 47% fewer questions, 95.8% accuracy gợi ý chuyên khoa | arxiv.org/pdf/2412.12538 | Conversational triage (hỏi thêm 1–2 câu) đã được validate — feasible trong 1 ngày với 1 LLM call |
| Symptomate / Ada Health: tách rõ 3 care level, không bao giờ offer đặt lịch khi output là cấp cứu | Symptomate, Ada Health (public) | Red-flag block pattern đã được quốc tế chứng minh — áp dụng được ngay |

### Pain statement

Người dùng lần đầu nhập triệu chứng vào chatbot đặt lịch khám online đang gặp khó ở bước **ra quyết định**: nên đi cấp cứu ngay hay đặt lịch khám chuyên khoa nào — vì AI hiện tại (BookingCare) hoặc dump tràn lan 7 nhóm nguyên nhân không dẫn đến quyết định (triệu chứng mơ hồ), hoặc mâu thuẫn logic nguy hiểm — vừa cảnh báo cấp cứu vừa offer đặt lịch thường trong cùng 1 response (triệu chứng nguy cấp). Dẫn tới user bị hoang mang, không biết hành động tiếp theo là gì, hoặc tệ hơn — bỏ qua dấu hiệu cấp cứu vì chatbot đã offer đặt lịch thường.

---

## 2. Lát cắt để build

**User:** Người bệnh lần đầu nhập triệu chứng vào chatbot trước khi đặt lịch khám online — chưa biết nên khám khoa nào hoặc đang có dấu hiệu khẩn cấp chưa nhận ra.

**AI decision:** Phân tầng triệu chứng (triage) thành 3 mức và tự động route action tương ứng.

| Path | Điều kiện | AI làm gì | Kết quả trả về |
|---|---|---|---|
| **Clear** | Triệu chứng đủ rõ, ánh xạ được 1 chuyên khoa | Classify = clear → chọn chuyên khoa | Gợi ý 1 chuyên khoa cụ thể + hiện slot khả dụng + offer đặt lịch bằng 1 thao tác |
| **Low-confidence** | Triệu chứng mơ hồ, có thể thuộc nhiều khoa | Classify = low-confidence → hỏi thêm 1 câu thu hẹp → đợi user trả lời → re-classify | Câu hỏi làm rõ → sau khi user trả lời: gợi ý 1 khoa + offer đặt lịch (hoặc fallback Nội tổng quát nếu vẫn mơ hồ) |
| **Red-flag** | Triệu chứng có dấu hiệu cấp cứu | Classify = red-flag → block đặt lịch | Chỉ hiển thị cảnh báo + số hotline cấp cứu — không có nút đặt lịch nào |
| **Failure / Override** | AI gợi sai chuyên khoa (user nhận ra) | Không re-classify tự động | Hiển thị "Nhập lại triệu chứng" và "Chọn chuyên khoa khác" — user override thủ công, flow không bị kẹt |

---

## 3. AI Product Canvas

### Value — Giá trị

- **Dành cho ai:** Người bệnh lần đầu dùng chatbot đặt lịch khám online, chưa biết mình cần khám khoa nào hoặc chưa nhận ra dấu hiệu khẩn cấp.
- **Họ đau ở đâu:** Không ra được quyết định sau khi đọc output của AI (triệu chứng mơ hồ) hoặc bị confuse bởi logic mâu thuẫn nguy hiểm (triệu chứng cấp cứu).
- **AI giải được gì mà cách làm hiện tại chưa giải:** Phân tầng nguy cơ tự động → route đúng hành động cho từng mức, thay vì dump thông tin hay mâu thuẫn logic. BookingCare đã có happy path tốt — prototype chỉ fix 2 gap: low-confidence và red-flag.

### Trust — Niềm tin

- **Khi AI sai chuyên khoa (clear/low-confidence):** User thấy nút "Nhập lại triệu chứng" và "Chọn chuyên khoa khác" — có thể override thủ công, flow không bị kẹt.
- **Khi AI classify nhầm red-flag thành clear:** Disclaimer bắt buộc "Đây là gợi ý tham khảo — gặp bác sĩ để xác nhận" xuất hiện ở mọi output. User có thể nhập lại triệu chứng.
- **Khi AI nhận đúng red-flag:** Block hoàn toàn nút đặt lịch, chỉ hiển thị cảnh báo + số hotline cấp cứu, không có lựa chọn nào khác.

### Feasibility — Tính khả thi

- **Chi phí mỗi lượt gọi:** 1 LLM call cho triage (classify + action), thêm 1 LLM call nếu low-confidence cần hỏi thêm — tổng tối đa 2 call/lượt.
- **Độ trễ:** ~1–2 giây/call, chấp nhận được với UX chat.
- **Dữ liệu cần có:** Mock data bác sĩ và slot — không cần API bệnh viện thật cho Day 06.
- **Rủi ro lớn nhất:** AI bỏ sót red-flag → xử lý bằng prompt engineering strict + disclaimer bắt buộc.
- **Ngưỡng dừng:** Nếu red-flag block không hoạt động ổn định qua 3 test case thực → dừng demo path đó, không ship.

### Tín hiệu học

Khi user nhập lại triệu chứng hoặc override chuyên khoa sau khi nhận gợi ý của AI, dữ liệu (input gốc + hành động chỉnh sửa + chuyên khoa cuối user chọn) được lưu lại làm tập kiểm thử. Tín hiệu là tỉ lệ override trên tổng lượt triage — nếu tỉ lệ cao ở một cụm triệu chứng cụ thể thì đó là điểm cần cải thiện prompt.

---

## 4. Tăng năng lực hay tự động hóa

**Lựa chọn: Conditional automation** — AI tự hành động trong case hẹp; case mơ hồ/rủi ro chuyển người.

| Case | AI làm gì | Human role |
|---|---|---|
| clear | AI tự classify + gợi ý 1 khoa + offer đặt lịch | Decider — user xác nhận bằng 1 thao tác |
| low-confidence | AI hỏi thêm 1 câu → đợi user trả lời → re-classify | Decider — user xác nhận sau câu hỏi thu hẹp |
| red-flag | AI block đặt lịch + hiển thị cảnh báo | Rescuer — bác sĩ/cấp cứu thay thế hoàn toàn, AI không có quyền quyết định |

**Lý do chọn mức này:** Domain y tế yêu cầu human-in-the-loop ở case rủi ro — automation hoàn toàn không phù hợp khi output ảnh hưởng tính mạng. Pattern này đã được Ada Health và Symptomate validate ở quy mô quốc tế.

---

## 5. Bốn đường đi của trải nghiệm

| Đường đi | Kịch bản cụ thể | Prototype thể hiện gì |
|---|---|---|
| **Đường thuận (Happy)** | User nhập "đau mắt đỏ, chảy nước mắt 2 ngày" → AI classify = clear | Gợi ý Chuyên khoa Mắt → hiện slot khả dụng → user đặt lịch thành công trong 1 flow không bị gián đoạn |
| **Khi AI không chắc (Low-confidence)** | User nhập "hay mệt mỏi, đôi khi đau đầu" → AI classify = low-confidence | AI hỏi thêm 1 câu ("Bạn có bị chóng mặt hoặc buồn nôn kèm không?") → user trả lời → AI re-classify → gợi ý 1 khoa cụ thể + offer đặt lịch |
| **Khi AI sai (Failure)** | AI gợi ý Nội tổng quát nhưng user biết mình cần Thần kinh | Prototype hiển thị nút "Nhập lại triệu chứng" và "Chọn chuyên khoa khác" → user override thủ công, flow không bị kẹt |
| **Khi người dùng sửa (Correction)** | User nhập "đau bụng" → AI gợi ý Tiêu hóa → user bổ sung "kèm sốt 38.5°C" | AI re-triage với đủ thông tin → gợi ý chuyên khoa có thể thay đổi; input mới + output mới được lưu vào tập kiểm thử |

---

## 6. Những kiểu lỗi đáng lo nhất

### Lỗi 1 — AI offer đặt lịch thường khi triệu chứng là red-flag (nguy hiểm nhất)

```
Xuất hiện khi: User nhập triệu chứng nguy cấp (ví dụ "đau ngực, khó thở, tay trái tê")
               nhưng AI classify nhầm thành clear hoặc vẫn hiện nút đặt lịch song song
               với cảnh báo cấp cứu — y hệt lỗi đã chứng minh trên BookingCare AI (Screenshot 3).

Ai chịu thiệt: User có thể bỏ qua dấu hiệu cấp cứu, chọn đặt lịch thường → nguy hiểm tính mạng trực tiếp.

Xử lý: Block hoàn toàn nút đặt lịch khi classify = red-flag.
        Chỉ hiển thị cảnh báo + số hotline cấp cứu, không có lựa chọn nào khác trong response.
        Kiểm thử bắt buộc trước demo — owner: Phạm Mạnh Thắng.
```

### Lỗi 2 — AI gợi sai chuyên khoa (clear case nhưng classify nhầm khoa)

```
Xuất hiện khi: Triệu chứng có thể thuộc nhiều khoa (ví dụ "đau đầu" → Thần kinh vs. Nội tổng quát),
               AI chọn sai khoa mà không có cơ chế escape.

Ai chịu thiệt: User đặt lịch sai khoa → mất thời gian, chi phí tái khám.

Xử lý: Hiển thị nút "Nhập lại triệu chứng" và "Chọn chuyên khoa khác" ở mọi output clear.
        Disclaimer bắt buộc: "Đây là gợi ý tham khảo — gặp bác sĩ để xác nhận."
```

### Lỗi 3 — Low-confidence loop không hội tụ (AI hỏi thêm nhưng vẫn không ra được khoa)

```
Xuất hiện khi: Sau 1 câu hỏi thu hẹp, triệu chứng vẫn mơ hồ, AI tiếp tục trả về low-confidence.

Ai chịu thiệt: User bị kẹt trong vòng hỏi-đáp, không ra được quyết định — đúng pain ban đầu.

Xử lý: Giới hạn tối đa 1 vòng hỏi thêm. Nếu sau 1 câu hỏi AI vẫn low-confidence,
        fallback về "Gặp bác sĩ đa khoa để được tư vấn" + offer đặt lịch Nội tổng quát.
```

---

## 7. Kế hoạch kiểm thử và bằng chứng demo

### Hai đầu vào chuẩn bị sẵn

| Loại | Input | Kết quả kỳ vọng |
|---|---|---|
| Đầu vào bình thường | "đau mắt đỏ, chảy nước mắt 2 ngày" | Classify = clear → gợi ý Chuyên khoa Mắt → offer đặt lịch |
| Đầu vào khó / gây nhiễu | "đau ngực, khó thở, tay trái tê" | Classify = red-flag → block đặt lịch → chỉ hiện cảnh báo + hotline cấp cứu, không có nút đặt lịch |

### Bằng chứng cần giữ lại trong repo

- `asset/Screenshot_1-3.png` — 3 case self-test BookingCare AI
- `asset/vinmec1.png`, `asset/vinmec2.png` — 2 case Vinmec
- Nhật ký prompt (prompt version + thay đổi) lưu trong `asset/prompt-log.md`
- Video/screenshot demo failure path (red-flag block + override chuyên khoa)
- Danh sách các case đã test và kết quả

---

## 8. Phân công

| Thành viên | Phụ trách | Bằng chứng trong repo |
|---|---|---|
| **Vũ Duy Bảo** — 2A202600565 | Research & evidence: self-test BookingCare AI (3 case), competitor analysis (August AI, Symptomate, Ada Health), social evidence (VOZ, App Store, Fanpage) | `evidence-pack-template.md` + `asset/Screenshot_1-3.png` |
| **Phạm Mạnh Thắng** — 2A202600921 | Evidence Vinmec (2 case) + synthesis mục 3–7 (opportunity, build slice, failure mode nguy hiểm nhất) + kiểm thử red-flag path và correction path | `asset/vinmec1.png`, `vinmec2.png` + `synthesis-decide-toolkit.md` + video demo failure path |
| **Vũ Quang Bảo** — 2A202600610 | SPEC mục 4–6 (build slice, auto/aug decision, four paths) + prototype Day 06 + demo script 4 path trong 3–5 phút | `spec.md` mục 4–6 + `demo-script.md` (hoặc `README`) |

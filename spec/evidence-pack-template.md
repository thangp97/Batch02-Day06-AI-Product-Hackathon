# Template — Evidence Pack

Nộp kèm thin SPEC cuối Day 05.

## 1. Nhóm và track

**Tên nhóm:**  Zone 1 - nhóm 2
**Track:**  Healcare
**Product/app đã chọn:**  Đặt lịch
**Build slice đang nghĩ:**   Từ triệu chứng gợi ý phòng khám và lịch khám
## 2. Self-use evidence

Nhóm tự dùng app/workflow và ghi lại điểm gãy.

| Observation | Screenshot/link | Path liên quan | Điều học được |
|---|---|---|---|
| Nhập "đau mắt đỏ, chảy nước mắt 2 ngày" → AI gợi ý đúng Chuyên khoa Mắt, offer đặt lịch ngay | ![BookingCare Happy Path](asset/Screenshot_1.png) | Happy | Happy path hoạt động tốt khi triệu chứng rõ ràng, 1 khoa |
| Nhập "hay mệt mỏi, đôi khi đau đầu" → AI liệt kê 7 nhóm nguyên nhân, không gợi ý được 1 khoa cụ thể, hỏi chung "tìm bác sĩ phù hợp không?" | ![BookingCare Low-confidence](asset/Screenshot_2.png) | Low-confidence | AI dump thông tin thay vì hỏi thêm để thu hẹp → user đọc xong vẫn không biết đi đâu |
| Nhập "đau ngực, khó thở, tay trái tê" → AI cảnh báo "đến cấp cứu ngay" nhưng ngay sau vẫn hỏi "bạn có muốn đặt lịch Tim mạch không?" | ![BookingCare Red Flag](asset/Screenshot_3.png) | Failure | Mâu thuẫn logic: cảnh báo cấp cứu + offer đặt lịch thường trong cùng 1 response — failure mode nguy hiểm nhất |
| **[Vinmec]** Form yêu cầu user tự chọn Bệnh viện → Chuyên khoa → Bác sĩ trước khi thấy slot — không có gợi ý từ triệu chứng | ![Vinmec booking form](asset/vinmec1.png) | Low-confidence | Toàn bộ burden chẩn đoán sơ bộ đẩy về user: ai không biết mình cần khoa gì sẽ bị kẹt ngay bước đầu |
| **[Vinmec]** Nhập "Lý do khám: Tôi đau đầu lắm sắp ngất rồi" (dấu hiệu cấp cứu tiềm năng) → hệ thống không có triage, không cảnh báo, xử lý như booking thường và hiển thị nút "Gửi thông tin" | ![Vinmec no safety guardrail](asset/vinmec2.png) | Failure | No safety guardrail tại điểm nhập lý do khám — triệu chứng nghiêm trọng bị bỏ qua hoàn toàn, nguy hiểm hơn cả BookingCare AI vì không có cảnh báo gì |
| **[Vinmec]** Sau khi submit form đầy đủ, hệ thống hiện note: "Tổng đài viên Vinmec sẽ gọi lại để xác nhận thời gian" → lịch chưa được xác nhận ngay | ![Vinmec callback note](asset/vinmec1.png) | Low-confidence | On-to-Off gap: đặt lịch online ≠ xác nhận lịch, vẫn phụ thuộc human loop — tương đồng với review App Store ở Section 3 |

## 3. User / review / social evidence (Vũ Duy Bảo - 2A202600565)

Nguồn có thể là review App Store/Play, group, comment, phỏng vấn nhanh, hoặc nguồn public khác.

| Quote / review / observation | Nguồn | User là ai? | Pain/failure mode |
|---|---|---|---|
| "Em đăng ký đóng tiền xong tới bệnh viện người ta bắt bốc số lại nè. Không xài được đâu mọi người đừng đăng ký phí tiền." | App Store Customer Reviews | Bệnh nhân đặt khám tại tuyến viện công lớn. | Lỗi đứt gãy kết nối On-to-Off: Hệ thống app và bệnh viện không đồng bộ diện rộng, mã đặt chỗ bị vô hiệu hóa tại quầy tiếp đón trực tiếp. |
| "Có thím nào đặt hẹn khám bệnh qua web Bookingcare.vn chưa cho em chút kinh nghiệm với. Liệu có uy tín lắm không?" | Diễn đàn VOZ - Thread #87515 | Người dùng mới đang khảo sát mức độ uy tín của bên thứ ba. | Rào cản lòng tin kỹ thuật số (Digital Trust): Người bệnh lo ngại lịch hẹn không được cơ sở y tế xác nhận chính thức. |
| "App lỗi, vô đăng kí không load nổi form chọn ngày tháng..." và các phàn nàn về hiệu năng thiết bị. | Google Play Store Reviews | Người dùng thiết bị Android (hệ điều hành cũ). | Lỗi tối ưu hóa ứng dụng (App Optimization): Tốc độ tải trang (UI/UX) chậm, gây treo máy hoặc gián đoạn luồng đặt lịch/thanh toán. |
| "Phòng khám đổi lịch bác sĩ đột xuất nhưng tổng đài không báo trước, đến nơi mới ngã ngửa làm mất công xin nghỉ làm." | BookingCare Official Fanpage | Bệnh nhân đặt lịch đích danh chuyên gia/bác sĩ giỏi. | Thiếu hệ thống cập nhật thời gian thực (Real-time Sync): Lịch trực của bác sĩ tại viện thay đổi nhưng không được tự động đồng bộ sang nền tảng BookingCare. |

Nếu chưa có nguồn ngoài nhóm, ghi rõ:

```text
Đây là giả định. Nhóm sẽ kiểm bằng [cách] trước checkpoint M1 Day 06.
```

## 4. Competitor / analog evidence

| App / mô hình tham khảo | Họ xử lý task này thế nào? | Pattern học được | Có áp dụng trong 1 ngày không? |
|---|---|---|---|
| BookingCare AI — Trợ lý AI đặt lịch (bookingcare.vn/tro-ly-ai/dat-lich-i1) | Happy path: gợi ý đúng khoa khi triệu chứng rõ. Low-confidence: dump 7 nhóm nguyên nhân, không thu hẹp, không hỏi thêm. Red flag: cảnh báo cấp cứu nhưng vẫn offer đặt lịch thường trong cùng response | Gap rõ ở low-confidence (không dẫn đến quyết định) và red flag (logic mâu thuẫn). Happy path đã ổn — không cần làm lại | ✅ Fix 2 gap này đủ differentiation trong 1 ngày |
| August AI chatbot — AI triage quốc tế (arxiv.org/pdf/2412.12538) | Hỏi ít câu hơn (47% fewer questions), đạt 95.8% accuracy gợi ý chuyên khoa, có confidence score rõ ràng | Conversational triage: hỏi thêm 1–2 câu để thu hẹp thay vì dump thông tin | ✅ Reuse prompt approach, đơn giản hóa thành 1 LLM call |
| Symptomate / Ada Health — symptom checker quốc tế | Hỏi triệu chứng tuần tự → gợi ý condition → gợi ý care level (tự theo dõi / đặt lịch / cấp cứu) | Tách rõ 3 care level output — không bao giờ offer đặt lịch khi output là cấp cứu | ✅ Pattern red flag handling áp dụng được ngay |
| Vinmec.com — form-based booking truyền thống (không có AI) | User tự chọn bệnh viện → chuyên khoa → bác sĩ → slot → điền form tự do. Field "Lý do khám" free text, không triage. Sau submit vẫn cần tổng đài gọi lại xác nhận. | Baseline không có AI: user burden cao nhất, zero symptom→specialty mapping, zero urgency detection, zero instant confirm — contrast rõ nhất để thấy AI có thể fill gap gì | ✅ Dùng làm baseline so sánh, không cần rebuild |

## 5. Evidence -> Insight (Vũ Duy Bảo - 2A202600565)

Evidence nổi bật nhất:
AI của BookingCare bị mâu thuẫn logic nghiêm trọng khi xử lý triệu chứng nguy hiểm ("đau ngực, khó thở, tay trái tê"): vừa cảnh báo người dùng đi cấp cứu ngay, vừa chào mời đặt lịch khám Tim mạch thường trong cùng một câu trả lời. Ngoài ra, AI đổ tràn lan thông tin (7 nhóm nguyên nhân) khi gặp triệu chứng mơ hồ thay vì hỏi thêm để thu hẹp chuyên khoa

Insight:
User không chỉ gặp [lỗi mâu thuẫn logic và tràn dữ liệu của chatbot].
Thật ra họ cần [sự định hướng y khoa an toàn, phân tầng nguy cơ chính xác để hỗ trợ ra quyết định mà không gây hoang mang hay nguy hiểm tính mạng].

Opportunity:
AI có thể giúp bằng cách [thiết lập rào chắn an toàn (Guardrails) để chặn đặt lịch thường khi có dấu hiệu cấp cứu, đồng thời tự động kích hoạt bộ câu hỏi trắc nghiệm lâm sàng để thu hẹp chuyên khoa khi triệu chứng mơ hồ].

## 6. Evidence đổi SPEC như thế nào?

- [ ] Đổi user chính.
- [x] Đổi pain statement.
- [x] Đổi build slice.
- [ ] Đổi Auto/Aug decision.
- [x] Đổi failure mode.
- [ ] Đổi 4 paths.
- [ ] Đổi owner/test plan.

Trước evidence, nhóm định build app đặt lịch khám với AI gợi ý
chuyên khoa từ triệu chứng — giả định không có competitor làm việc này.

Sau evidence, nhóm xác nhận BookingCare đã có AI triage.
Đổi focus sang 2 gap cụ thể: (1) low-confidence path — 
BookingCare dump thông tin, không dẫn đến quyết định; 
(2) red flag path — BookingCare mâu thuẫn logic khi vừa 
cảnh báo cấp cứu vừa offer đặt lịch thường.

Lý do: evidence từ self-test 3 case thật trên BookingCare AI,
ngày 03/06/2026.

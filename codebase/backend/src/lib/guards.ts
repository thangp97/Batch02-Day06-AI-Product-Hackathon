// Pattern phát hiện khủng hoảng / nguy hiểm tính mạng — ưu tiên xử lý trước LLM
const CRISIS_PATTERNS = [
  // Ý định tự tử / không muốn sống
  // Negative lookahead để tránh "chết đói", "chết cười", "chết khát"
  /tôi\s+(sắp|muốn|sẽ)\s+chết(?!\s*(đói|khát|cười|vì\s+cười|buồn\s+cười))/i,
  /không\s+(muốn|thể)\s+sống\s+(nữa|tiếp)/i,
  /chán\s+sống/i,
  /muốn\s+tự\s+tử/i,
  /\btự\s+tử\b/i,
  /kết\s+thúc\s+(cuộc\s+đời|tất\s+cả|mọi\s+thứ)/i,
  /không\s+muốn\s+sống/i,
  // Xuất huyết nặng / nguy hiểm thể chất cấp tính
  /mất\s+(nhiều|quá\s+nhiều)\s+máu/i,
  /đang\s+chảy\s+máu\s+(nhiều|không\s+ngừng|liên\s+tục)/i,
  /không\s+thở\s+được/i,
  /\bbất\s+tỉnh\b/i,
  /\bco\s+giật\b/i,
  /tim\s+(ngừng|không\s+đập)/i,
];

/** Trả về true nếu input chứa dấu hiệu khủng hoảng hoặc nguy hiểm tính mạng */
export function detectCrisis(input: string): boolean {
  return CRISIS_PATTERNS.some((p) => p.test(input));
}

// Pattern phát hiện ý định tái khám
const FOLLOWUP_INTENT_PATTERNS = [
  /tái\s+khám/i,
  /khám\s+lại/i,
  /tái\s+chẩn/i,
  /muốn\s+tái\s+khám/i,    // cụ thể hơn, tránh "muốn tái bào ngư"
  /đặt\s+lịch\s+tái/i,
  /gặp\s+lại\s+bác\s+sĩ/i,
];

/** Trả về true nếu user muốn đặt lịch tái khám */
export function detectFollowupIntent(input: string): boolean {
  return FOLLOWUP_INTENT_PATTERNS.some((p) => p.test(input));
}

// Pattern phát hiện ý định đặt lịch khám mới (chưa có triệu chứng cụ thể)
const BOOKING_INTENT_PATTERNS = [
  /muốn\s+đặt\s+(lịch|khám)/i,
  /đặt\s+lịch\s+khám/i,
  /đặt\s+lịch\s+bác\s+sĩ/i,
  /đăng\s+ký\s+khám/i,
  /book(ing)?\s+lịch/i,
  /cho\s+tôi\s+đặt\s+lịch/i,
  /tôi\s+muốn\s+đặt/i,
];

// Từ khóa triệu chứng thường gặp — nếu có trong input thì để LLM xử lý
const SYMPTOM_KEYWORDS = /đau|sốt|buồn\s+nôn|chóng\s+mặt|ho|khó\s+thở|ngứa|sưng|tê|mệt|tiêu\s+chảy|táo\s+bón|chảy\s+máu|xuất\s+huyết|đau\s+đầu|đau\s+bụng|đau\s+ngực|đau\s+lưng|đau\s+khớp|mờ\s+mắt|đỏ\s+mắt/i;

/**
 * Trả về true nếu user muốn đặt lịch nhưng chưa mô tả triệu chứng.
 * Bỏ qua nếu input cũng chứa từ khóa triệu chứng — để LLM triage xử lý.
 */
export function detectBookingIntent(input: string): boolean {
  if (SYMPTOM_KEYWORDS.test(input)) return false;
  return BOOKING_INTENT_PATTERNS.some((p) => p.test(input));
}

// Pattern phát hiện lời chào / giao tiếp xã hội / hỏi thông tin dịch vụ
const GREETING_PATTERNS = [
  // Lời chào
  /^(xin\s+)?chào(\s+bạn)?[.!]?$/i,
  /^hello[.!]?$/i,
  /^hi[.!]?$/i,
  /^hey[.!]?$/i,
  /^chào\s+(buổi\s+)?(sáng|chiều|tối)[.!]?$/i,
  /^alo[.!]?$/i,

  // Cảm ơn
  /c[aả]m\s+ơn/i,
  /^thanks?(\s+you)?[.!]?$/i,

  // Hỏi thăm / giới thiệu
  /^bạn\s+(là\s+)?(ai|gì)[?]?$/i,
  /^bot\s+(là\s+)?(ai|gì)[?]?$/i,
  /bạn\s+(có\s+thể|giúp)\s+(làm\s+)?gì/i,
  /giúp\s+gì\s+được/i,
  /bạn\s+làm\s+được\s+gì/i,
  /dùng\s+(như\s+)?thế\s+nào/i,
  /sử\s+dụng\s+(như\s+)?thế\s+nào/i,

  // Hỏi về dịch vụ / chuyên khoa — trả lời bằng danh sách khoa từ DB
  /có\s+(những\s+)?khoa\s+(gì|nào)/i,
  /những\s+khoa\s+(gì|nào)/i,
  /danh\s+sách\s+(chuyên\s+)?khoa/i,
  /chuyên\s+khoa\s+(gì|nào)/i,
  /khám\s+(được\s+)?(những\s+)?gì/i,
  /có\s+dịch\s+vụ\s+(gì|nào)/i,
  /đặt\s+lịch\s+(được\s+)?(những\s+)?gì/i,
  /có\s+thể\s+đặt\s+(lịch\s+)?(gì|nào)/i,
  /hướng\s+dẫn/i,

  // Tạm biệt
  /^(tạm\s+biệt|bye|goodbye)[.!]?$/i,

  // Chào hỏi kèm từ khóa
  /^(xin\s+)?chào[,.]?\s+tôi\s+muốn\s+(hỏi|biết)/i,
];

/** Trả về true nếu input là lời chào hoặc giao tiếp xã hội thân thiện */
export function detectGreeting(input: string): boolean {
  return GREETING_PATTERNS.some((p) => p.test(input));
}

// Pattern phát hiện prompt injection trước khi gọi LLM
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /forget\s+(all\s+)?(previous|prior)/i,
  /override\s+(your\s+)?(previous\s+)?instructions?/i,
  /disregard\s+(all\s+)?(previous\s+)?/i,
  /you\s+are\s+now\s+/i,
  /act\s+as\s+(a\s+)?(different|new|another)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /new\s+instructions?\s*:/i,
  /system\s*prompt\s*:/i,
  /\[system\]/i,
  /<\/?system>/i,
  /jailbreak/i,
  /###\s*instruction/i,
  /return\s+level\s*=/i,         // vd: "Return level=clear"
  /set\s+level\s+to/i,
];

/** Trả về true nếu input chứa dấu hiệu prompt injection rõ ràng */
export function detectInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(input));
}

/** Strip HTML tags khỏi string — tránh XSS và noise trong prompt */
export function sanitizeInput(raw: string): string {
  return raw.replace(/<[^>]*>/g, "").trim();
}

/** Validate số điện thoại Việt Nam (10 số, bắt đầu 0 hoặc +84) */
export function isValidPhone(phone: string): boolean {
  return /^(0|\+84)[0-9]{8,9}$/.test(phone.trim());
}

type LLMRaw = Record<string, unknown>;

/** Validate schema JSON trả về từ LLM — tránh partial/malformed response */
export function validateLLMResponse(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as LLMRaw;

  const validLevels = ["clear", "low-confidence", "red-flag", "out-of-scope"];
  if (!validLevels.includes(d.level as string)) return false;
  if (typeof d.message !== "string" || d.message.trim() === "") return false;

  if (d.level === "clear") {
    if (typeof d.specialtyCode !== "string" || typeof d.specialtyName !== "string") return false;
  }
  if (d.level === "low-confidence") {
    if (typeof d.question !== "string" || d.question.trim() === "") return false;
  }

  return true;
}

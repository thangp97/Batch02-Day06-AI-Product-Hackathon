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

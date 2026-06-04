import OpenAI from "openai";

// OpenRouter dùng OpenAI-compatible API
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5000",
    "X-Title": "Triage Chatbot",
  },
});

// Đổi model tại đây nếu cần — xem danh sách tại openrouter.ai/models
const MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-flash-1.5";

export async function chatComplete(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userMessage },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}

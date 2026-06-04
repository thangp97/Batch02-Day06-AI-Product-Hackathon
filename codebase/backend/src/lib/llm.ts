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
const MODEL = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

export async function chatComplete(
  systemPrompt: string,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const messages: any[] = [{ role: "system", content: systemPrompt }];
  
  // Natively inject conversation history for better LLM context understanding
  for (const msg of history) {
    messages.push({ role: msg.role, content: msg.content });
  }
  
  messages.push({ role: "user", content: userMessage });

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 512,
    messages: messages,
  });

  return response.choices[0]?.message?.content ?? "";
}

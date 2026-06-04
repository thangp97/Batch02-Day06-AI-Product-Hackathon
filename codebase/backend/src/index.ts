import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import triageRouter from "./routes/triage";
import specialtiesRouter from "./routes/specialties";
import logRouter from "./routes/log";
import bookingsRouter from "./routes/bookings";
import conversationsRouter from "./routes/conversations";
import feedbackRouter from "./routes/feedback";

const app = express();
const PORT = process.env.PORT ?? 5000;

// Lớp 4: HTTP security headers
app.use(helmet());

app.use(cors());

// Giới hạn kích thước request body — tránh payload attack
app.use(express.json({ limit: "16kb" }));

// Lớp 5: Rate limiting
// /api/triage — tốn kém (gọi LLM), giới hạn chặt hơn
const triageRateLimit = rateLimit({
  windowMs: 60 * 1000,   // 1 phút
  max: 15,
  message: { error: "RATE_LIMIT", message: "Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Các endpoint còn lại
const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "RATE_LIMIT", message: "Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/triage", triageRateLimit, triageRouter);
app.use("/api/specialties", generalRateLimit, specialtiesRouter);
app.use("/api/log", generalRateLimit, logRouter);
app.use("/api/bookings", generalRateLimit, bookingsRouter);
app.use("/api/conversations", generalRateLimit, conversationsRouter);
app.use("/api/feedback", generalRateLimit, feedbackRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "DB_ERROR", message: "Lỗi máy chủ, vui lòng thử lại." });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

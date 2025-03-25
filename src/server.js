// @ts-check

import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ★ CORS 設定：明示的にオリジンを指定！
// これを追加！全てのOPTIONSリクエストにCORS対応
app.options("*", cors({
  origin: 'https://salone-new-flower.vercel.app',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// 念のため、app.use() のあとに fallback 的に明示ヘッダー追加
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://salone-new-flower.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(express.json());
console.log('呼ばれた')
app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.RECEIVER_EMAIL,
    subject: `${name}`,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "メールが送信されました。" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

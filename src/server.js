// @ts-check

import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS を全体に適用（これが必要！！）
const corsOptions = {
  origin: 'https://salone-new-flower.vercel.app',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ← プリフライトにも対応

app.use(express.json());

app.post("/send-email", async (req, res) => {
  console.log('呼ばれた');
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

// @ts-check

import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

// .envの読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: "https://salone-new-flower.vercel.app", // フロントの開発URL
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions)); // CORS設定を追加
app.options("*", cors(corsOptions)); // プリフライトにも対応
app.use(express.json());

app.post("/send-reservation", async (req, res) => {
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
    // 件名↓
    subject: `${name}`,
    text: message,
  };

  const mailOptions2 = {
    from: email,
    to: email,
    // 件名↓
    subject: `${name}`,
    text: message,
  };


  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptions2);
    res.json({ success: true, message: "メールが送信されました。" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

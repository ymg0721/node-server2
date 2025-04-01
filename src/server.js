import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS設定（ローカル用）ここが重要！
const corsOptions = {
  origin: "https://salone-new-flower.vercel.app", // フロントの開発URL
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions)); // ← これでCORSが通る
app.options("*", cors(corsOptions)); // ← プリフライトにも対応

app.use(express.json());

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
    subject: `${name}様からのお問い合わせ`,
    text: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
　お問い合わせ内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ お名前
${name}

■ メールアドレス
${email}

■ お問い合わせ内容
${message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,
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

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
  const { name, email, phone, date, product, isLesson } = req.body;

  // 予約内容を整形
  const formattedDate = new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // メール本文を作成
  const emailBody = `
【予約内容】

■ お客様情報
お名前: ${name}
メールアドレス: ${email}
電話番号: ${phone}
予約日: ${formattedDate}

■ 予約内容
${isLesson ? "レッスン予約" : "商品予約"}
${
  product
    ? `
商品名: ${product.name}
種類: ${product.type}
サイズ: ${product.size}
価格: ¥${product.price.toLocaleString()}
`
    : ""
}

ご予約ありがとうございます。
担当者より確認のご連絡をさせていただきます。
`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 店舗宛のメール
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECEIVER_EMAIL,
    subject: `【予約】${name}様 - ${formattedDate}`,
    text: emailBody,
  };

  // お客様宛のメール
  const customerMailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `【予約確認】${formattedDate}のご予約ありがとうございます`,
    text: emailBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(customerMailOptions);
    res.json({ success: true, message: "メールが送信されました。" });
  } catch (error) {
    console.error("メール送信エラー:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

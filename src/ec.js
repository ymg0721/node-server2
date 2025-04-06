const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS設定
const corsOptions = {
  origin: "https://salone-new-flower.vercel.app",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "sec-ch-ua",
    "sec-ch-ua-mobile",
    "sec-ch-ua-platform",
    "User-Agent",
    "Referer",
  ],
  credentials: true,
};

// ミドルウェアの設定
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// メール送信のためのトランスポーター設定
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 購入処理API
app.post("/send-purchase", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      postalCode,
      city,
      paymentMethod,
      paymentDetails,
      product,
    } = req.body;

    // 支払い方法に応じた処理
    let paymentInfo = "";
    if (paymentMethod === "credit") {
      // クレジットカード情報の処理（実際の環境では決済処理を行う）
      paymentInfo = `
        お支払い方法: クレジットカード
        カード番号: ${maskCardNumber(paymentDetails.cardNumber)}
        カード名義人: ${paymentDetails.cardName}
        有効期限: ${paymentDetails.cardExpiry}
      `;
    } else if (paymentMethod === "bank") {
      // 銀行振込情報の処理
      paymentInfo = `
        お支払い方法: 銀行振込
        銀行名: ${paymentDetails.bankName}
        口座名義: ${paymentDetails.accountHolder}
        口座番号: ${paymentDetails.accountNumber}
      `;
    } else if (paymentMethod === "cod") {
      // 代金引換の処理
      paymentInfo = "お支払い方法: 代金引換";
    }

    // 購入確認メールの送信
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "【購入確認】ご注文ありがとうございます",
      html: `
        <h2>ご購入ありがとうございます</h2>
        <p>${name} 様</p>
        <p>ご注文いただいた商品は、ご登録いただいた住所へお届けいたします。</p>
        
        <h3>商品情報</h3>
        <p>商品名: ${product.name} (${product.type})</p>
        <p>価格: ¥${product.price.toLocaleString()}</p>
        <p>サイズ: ${product.size}</p>
        
        <h3>お届け先情報</h3>
        <p>〒${postalCode}</p>
        <p>${city} ${address}</p>
        <p>TEL: ${phone}</p>
        
        <h3>お支払い情報</h3>
        <p>${paymentInfo}</p>
        
        <p>ご購入ありがとうございました。</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    // 管理者への通知メール
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "【新規購入】新しい注文がありました",
      html: `
        <h2>新規購入通知</h2>
        <p>新しい注文がありました。</p>
        
        <h3>お客様情報</h3>
        <p>お名前: ${name}</p>
        <p>メールアドレス: ${email}</p>
        <p>電話番号: ${phone}</p>
        <p>郵便番号: ${postalCode}</p>
        <p>住所: ${city} ${address}</p>
        
        <h3>商品情報</h3>
        <p>商品名: ${product.name} (${product.type})</p>
        <p>価格: ¥${product.price.toLocaleString()}</p>
        <p>サイズ: ${product.size}</p>
        
        <h3>お支払い情報</h3>
        <p>${paymentInfo}</p>
      `,
    };

    await transporter.sendMail(adminMailOptions);

    res.status(200).json({ success: true, message: "購入処理が完了しました" });
  } catch (error) {
    console.error("購入処理エラー:", error);
    res
      .status(500)
      .json({ success: false, message: "購入処理中にエラーが発生しました" });
  }
});

// 予約処理API
app.post("/send-reservation", async (req, res) => {
  try {
    const { name, email, phone, date, product, isLesson } = req.body;

    // 予約確認メールの送信
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "【予約確認】ご予約ありがとうございます",
      html: `
        <h2>ご予約ありがとうございます</h2>
        <p>${name} 様</p>
        <p>ご予約いただいた内容は以下の通りです。</p>
        
        <h3>予約情報</h3>
        <p>予約日時: ${formatDate(date)}</p>
        <p>予約タイプ: ${isLesson ? "レッスン" : "商品予約"}</p>
        
        <h3>商品情報</h3>
        <p>商品名: ${product.name} (${product.type})</p>
        <p>価格: ¥${product.price.toLocaleString()}</p>
        <p>サイズ: ${product.size}</p>
        
        <p>ご予約ありがとうございました。</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    // 管理者への通知メール
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "【新規予約】新しい予約がありました",
      html: `
        <h2>新規予約通知</h2>
        <p>新しい予約がありました。</p>
        
        <h3>お客様情報</h3>
        <p>お名前: ${name}</p>
        <p>メールアドレス: ${email}</p>
        <p>電話番号: ${phone}</p>
        
        <h3>予約情報</h3>
        <p>予約日時: ${formatDate(date)}</p>
        <p>予約タイプ: ${isLesson ? "レッスン" : "商品予約"}</p>
        
        <h3>商品情報</h3>
        <p>商品名: ${product.name} (${product.type})</p>
        <p>価格: ¥${product.price.toLocaleString()}</p>
        <p>サイズ: ${product.size}</p>
      `,
    };

    await transporter.sendMail(adminMailOptions);

    res.status(200).json({ success: true, message: "予約処理が完了しました" });
  } catch (error) {
    console.error("予約処理エラー:", error);
    res
      .status(500)
      .json({ success: false, message: "予約処理中にエラーが発生しました" });
  }
});

// カード番号をマスクする関数
function maskCardNumber(cardNumber) {
  if (!cardNumber) return "";
  const parts = cardNumber.split(" ");
  if (parts.length !== 4) return cardNumber;
  return `**** **** **** ${parts[3]}`;
}

// 日付をフォーマットする関数
function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});

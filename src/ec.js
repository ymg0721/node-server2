const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const path = require("path");
const stripe = require("./config/stripe");
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
    "stripe-signature",
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
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

// Stripeチェックアウトセッション作成API
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { name, email, phone, address, postalCode, city, product } = req.body;

    // 商品情報の取得
    const { id, name: productName, type, price, size } = product;

    // Stripeのチェックアウトセッションを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: productName,
              description: `${type} - ${size}`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${
        process.env.FRONTEND_URL || "https://salone-new-flower.vercel.app"
      }/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.FRONTEND_URL || "https://salone-new-flower.vercel.app"
      }/cancel`,
      customer_email: email,
      shipping_address_collection: {
        allowed_countries: ["JP"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "jpy",
            },
            display_name: "通常配送",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 3,
              },
              maximum: {
                unit: "business_day",
                value: 5,
              },
            },
          },
        },
      ],
      metadata: {
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        customerPostalCode: postalCode,
        customerCity: city,
        productId: id,
        productName: productName,
        productType: type,
        productSize: size,
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error("Stripeセッション作成エラー:", error);
    res.status(500).json({ error: "決済セッションの作成に失敗しました" });
  }
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

// Stripe Webhook処理API
app.post("/webhook", (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret =
    process.env.STRIPE_WEBHOOK_SECRET || "whsec_your_webhook_secret";

  // 生のリクエストボディを取得
  let rawBody = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    rawBody += chunk;
  });

  req.on("end", async () => {
    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        endpointSecret
      );

      // イベントタイプに応じた処理
      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object;

          // メタデータから顧客情報と商品情報を取得
          const {
            customerName,
            customerPhone,
            customerAddress,
            customerPostalCode,
            customerCity,
            productName,
            productType,
            productSize,
          } = session.metadata;

          // 購入確認メールの送信
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: session.customer_email,
            subject: "【購入完了】ご注文ありがとうございます",
            html: `
            <h2>ご購入ありがとうございます</h2>
            <p>${customerName} 様</p>
            <p>ご注文いただいた商品は、ご登録いただいた住所へお届けいたします。</p>
            
            <h3>商品情報</h3>
            <p>商品名: ${productName} (${productType})</p>
            <p>サイズ: ${productSize}</p>
            <p>お支払い金額: ¥${session.amount_total.toLocaleString()}</p>
            
            <h3>お届け先情報</h3>
            <p>〒${customerPostalCode}</p>
            <p>${customerCity} ${customerAddress}</p>
            <p>TEL: ${customerPhone}</p>
            
            <p>ご購入ありがとうございました。</p>
          `,
          };

          try {
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
              <p>お名前: ${customerName}</p>
              <p>メールアドレス: ${session.customer_email}</p>
              <p>電話番号: ${customerPhone}</p>
              <p>郵便番号: ${customerPostalCode}</p>
              <p>住所: ${customerCity} ${customerAddress}</p>
              
              <h3>商品情報</h3>
              <p>商品名: ${productName} (${productType})</p>
              <p>サイズ: ${productSize}</p>
              <p>お支払い金額: ¥${session.amount_total.toLocaleString()}</p>
              
              <h3>決済情報</h3>
              <p>決済ID: ${session.payment_intent}</p>
              <p>決済方法: クレジットカード</p>
            `,
            };

            await transporter.sendMail(adminMailOptions);
          } catch (error) {
            console.error("メール送信エラー:", error);
          }
          break;
        default:
          console.log(`未処理のイベントタイプ: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error(`Webhookエラー: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });
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

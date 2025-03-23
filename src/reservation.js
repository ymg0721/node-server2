// @ts-check

import express from "express";
import sendmail from "sendmail";
import cors from "cors";
import dotenv from "dotenv";

// .envの読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post("/send-reservation", (req, res) => {
  const { name, email, message } = req.body;

  const mailOptions = {
    from: email,
    to: process.env.RECEIVER_EMAIL, // 受信者のメールアドレス
    subject: `予約が確定しました。２`,
    text: message,
  };

  sendmail(mailOptions, (err, reply) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: "メールが送信されました。" });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

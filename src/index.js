// @ts-check

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise'; // プロミスベースの MySQL クライアント
import dotenv from 'dotenv';

// 環境変数を読み込む
dotenv.config();

const app = express();
const port = 8000;

// JSONリクエストを解析
app.use(express.json());

// CORSを有効化
app.use(
  cors({
    origin: 'http://localhost:3000', // フロントエンドのURL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 許可するHTTPメソッド
    allowedHeaders: ['Content-Type'], // 許可するヘッダー
  }),
);

// MySQL接続設定
const pool = mysql.createPool({
  host: 'localhost',       // MySQLサーバーのホスト名
  user: 'root',            // MySQLのユーザー名
  password: 'bbcmns1197',            // MySQLのパスワード
  database: 'yoshinaga',   // 接続するデータベース名
});

// シンプルなルートを定義
app.get('/', (req, res) => {
  res.send('Hello, API Server!');
});


// データ取得用のAPI例
app.get('/api/data', async (req, res) => {
  try {
    // データベースからデータを取得
    const [rows] = await pool.query('SELECT * FROM yoshinaga'); // 適切なテーブル名を設定
    res.json({ message: 'データを取得しました！', data: rows });
  } catch (error) {
    console.error('データ取得エラー:', error);
    res.status(500).json({ message: 'データ取得に失敗しました', error: error.message });
  }
});


// サーバーを起動
app.listen(port, () => {
  console.log(`🚀 サーバーが起動しました: http://localhost:${port}`);
});

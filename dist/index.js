import express from 'express';
const app = express();
const port = 3000;
// JSONリクエストを解析
app.use(express.json());
// シンプルなルートを定義
app.get('/', (req, res) => {
    res.send('Hello, API Server!');
});
// データ取得用のAPI例
app.get('/api/data', (req, res) => {
    res.json({ message: 'データを取得しました！' });
});
// サーバーを起動
app.listen(port, () => {
    console.log(`🚀 サーバーが起動しました: http://localhost:${port}`);
});

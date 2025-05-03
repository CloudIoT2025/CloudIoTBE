const express = require('express');
require('dotenv').config();
const app = express();
const userRoutes = require('./routes/user');
const exerciseRoutes = require('./routes/exercise');
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3001', // 프론트엔드 포트
  credentials: true, // 쿠키 전달이 필요하면 true
}));
app.use(express.json());

app.use('/api/user', userRoutes);
app.use('/api/results', userRoutes);  // 같은 파일 내에서 today, goal, weekly 사용
app.use('/api/exercise', exerciseRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
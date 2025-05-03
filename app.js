require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fitbitRoutes = require('./routes/fitbitRoutes');
const userRoutes = require('./routes/user');
const exerciseRoutes = require('./routes/exercise');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
app.use(cors({
  origin: 'http://localhost:3001', // 프론트엔드 포트
  credentials: true
}));
app.use(express.json());
app.use(bodyParser.json());

app.use('/auth/fitbit', fitbitRoutes);  // ex) /auth/fitbit/login
// app.use('/api', apiRoutes);            // ex) /api/user
app.use('/api/user', userRoutes);
app.use('/api/results', userRoutes);  // 같은 파일 내에서 today, goal, weekly 사용
app.use('/api/exercise', exerciseRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 서버 실행 중 (포트 ${PORT})`));
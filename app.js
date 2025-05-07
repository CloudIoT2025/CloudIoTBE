const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const fitbitRoutes = require('./routes/fitbitRoutes');
const userRoutes = require('./routes/user');
const exerciseRoutes = require('./routes/exercise');
const apiRoutes = require('./routes/apiRoutes');
const authenticate = require('./middlewares/authentication');

require('./mqtt/broker');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(bodyParser.json());

app.use('/auth/fitbit', fitbitRoutes); // ex) /auth/fitbit/login
// app.use('/api', apiRoutes);            // ex) /api/user
app.use('/api/user', authenticate, userRoutes);
app.use('/api/results', authenticate, userRoutes); // 같은 파일 내에서 today, goal, weekly 사용
app.use('/api/exercise', authenticate, exerciseRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 서버 실행 중 (포트 ${PORT})`));
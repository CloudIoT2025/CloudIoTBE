require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const fitbitRoutes = require('./routes/fitbitRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/auth/fitbit', fitbitRoutes);  // ex) /auth/fitbit/login
app.use('/api', apiRoutes);            // ex) /api/user

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 서버 실행 중 (포트 ${PORT})`));
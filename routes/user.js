const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const mqtt = require('mqtt');
const { DateTime } = require('luxon');
const { waitForMqttMessage, sendMqttMessage } = require('../mqtt/mqttHandler');

// 유저 정보 조회
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id as userId FROM users LIMIT 1');
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ status: 400, message: '결제 상태 조회가 실패하였습니다.' });
  }
});

// 오늘 칼로리 조회
router.get('/today', async (req, res) => {
  const userId = req.user;

  try {
    const [[caloriesBurnedWithUsRows]] = await pool.query(
      'SELECT calories_rsp FROM rsp_move_data WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
      [userId]
    );
    const caloriesBurnedWithUs = caloriesBurnedWithUsRows
      ? caloriesBurnedWithUsRows.calories_rsp
      : 0;

    const [[caloriesBurnedOutsideRows]] = await pool.query(
      'SELECT calories_fitbit FROM fitbit_data WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
      [userId]
    );
    const caloriesBurnedOutside = caloriesBurnedOutsideRows
      ? caloriesBurnedOutsideRows.calories_fitbit
      : 0;

    const [[caloriesToBurnRows]] = await pool.query(
      'SELECT goal_calories FROM users WHERE id = ?',
      [userId]
    );
    const caloriesToBurn = caloriesToBurnRows
      ? caloriesToBurnRows.goal_calories
      : 0;

    return res
      .status(200)
      .json({ caloriesToBurn, caloriesBurnedOutside, caloriesBurnedWithUs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err });
  }
});

// 목표 칼로리 조회
router.get('/goal', async (req, res) => {
  const userId = req.user;
  try {
    const [row] = await pool.query(
      'SELECT goal_calories FROM users WHERE id = ?',
      [userId]
    );
    const goal = row[0].goal_calories;
    return res.status(200).json({ goal });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ detail: err.message });
  }
});

// 목표 칼로리 설정
router.put('/goal', async (req, res) => {
  const userId = req.user;
  const { goal } = req.body;
  try {
    await pool.query('UPDATE users SET goal_calories = ? WHERE id = ?', [
      goal,
      userId,
    ]);
    return res.status(200).json({ goal });
  } catch (err) {
    console.error(error);
    return res.status(500).send(err.message);
  }
});

// 주간 그래프 조회
router.get('/weekly', async (req, res) => {
  // calories_fitbit 최근 7일
  // calories_rsp 최근 7일
  // calories_fitbit, calories_rsp 갯수 같아야함.

  const userId = req.user;
  const today = DateTime.now().setZone('Asia/Seoul').startOf('day');
  const startDate = today.minus({ days: 6 });

  console.log(`Start Date: ${startDate.toISO()} End Date: ${today.toISO()}`);

  const response = [];
  for (let i = 0; i < 7; i++) {
    response.push({
      date: startDate.plus({ days: i }).toFormat('yyyy-MM-dd'),
      caloriesBurnedOutside: 0,
      caloriesBurnedWithUs: 0,
    });
  }

  try {
    const [caloriesBurnedOutsideRows] = await pool.query(
      'SELECT user_id, calories_fitbit, date FROM fitbit_data WHERE user_id = ? AND date between ? AND ? ORDER BY date DESC LIMIT 7',
      [userId, startDate.toFormat('yyyy-MM-dd'), today.toFormat('yyyy-MM-dd')]
    );
    if (caloriesBurnedOutsideRows.length > 0) {
      for (const { calories_fitbit, date } of caloriesBurnedOutsideRows) {
        const dateObject = DateTime.fromISO(date.toISOString()).setZone(
          'Asia/Seoul'
        );
        const index = dateObject.startOf('day').diff(startDate, 'days').days;

        console.log(
          `Found record on ${dateObject.toISO()}, with difference of ${index} days`
        );

        response[index].caloriesBurnedOutside = calories_fitbit;
      }
    }

    const [caloriesBurnedWithUsRows] = await pool.query(
      'SELECT user_id, calories_rsp, date FROM rsp_move_data WHERE user_id = ? AND date between ? AND ? ORDER BY date DESC LIMIT 7',
      [userId, startDate.toFormat('yyyy-MM-dd'), today.toFormat('yyyy-MM-dd')]
    );
    if (caloriesBurnedWithUsRows.length > 0) {
      for (const { calories_rsp, date } of caloriesBurnedWithUsRows) {
        const index = DateTime.fromISO(date.toISOString())
          .setZone('Asia/Seoul')
          .startOf('day')
          .diff(startDate, 'days').days;
        response[index].caloriesBurnedWithUs = calories_rsp;
      }
    }

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).send({ detail: err.message });
  }
});

// 라즈베리파이 아이디 확인
router.post('/rsp/validate', async (req, res) => {
  const { code } = req.body;

  try {
    const result = waitForMqttMessage(`response/clientCheck/${code}`);
    sendMqttMessage('clientCheck/rsp', code);
    result.then((result) => {
      console.log(`response/clientCheck/${code}: ${result}`);
      const valid = result === '1' ? true : false;
      res.status(200).json({ valid, rspId: code });
    }).catch((error) => {
      console.error('Error waiting for MQTT message:', error);
      res.status(500).json({ error: '서버 오류' });
    });
  } catch (error) {
    console.error('라즈베리 코드 확인 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
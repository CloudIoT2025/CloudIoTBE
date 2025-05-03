const express = require('express');
const router = express.Router();
const pool = require('../db');

// 유저 정보 조회
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id as userId, username as name FROM users LIMIT 1');
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ status: 400, message: "결제 상태 조회가 실패하였습니다." });
  }
});

// 오늘 칼로리 조회
router.get('/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const [rows] = await pool.query(`
      SELECT f.calories_fitbit AS calroies, u.goal_calories AS goal
      FROM fitbit_data AS f 
      JOIN users AS u 
      ON f.user_id = u.id
      WHERE f.date = ? 
      AND f.user_id = 1746278561833 
      ORDER BY f.created_at DESC LIMIT 1`, [today]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ status: 400, message: "결제취소가 실패하였습니다." });
  }
});

// 목표 칼로리 설정
router.put('/goal', async (req, res) => {
  const { goal } = req.body;
  try {
    await pool.query('UPDATE users SET goal_calories = ? WHERE id = 1746278561833', [goal]);
    res.json({ goal });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 주간 그래프 조회
router.get('/weekly', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT calories_fitbit AS calroies, created_at as createdAt
      FROM fitbit_data 
      WHERE user_id = 1746278561833 
      ORDER BY created_at DESC LIMIT 7
    `);
    res.json(rows.reverse());
  } catch (err) {
    res.status(500).send(err.message);
  }
});
// 라즈베리파이 아이디 확인
router.post('/rsp/validate', async (req, res) => {
  const { code } = req.body;

  try {
    // TODO: 라즈베리 파이 아이디 확인하는 부분
    const rspId = "0"
    const valid = rspId == code;

    res.json({ valid });
  } catch (err) {
    console.error('라즈베리 코드 확인 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});
module.exports = router;

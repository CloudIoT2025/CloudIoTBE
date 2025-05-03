const express = require('express');
const router = express.Router();
const pool = require('../db');

// 운동 종료
router.get('/end', async (req, res) => {
  const { videoId } = req.query;

  try {
    const calroies = 200;
    const [goalRow] = await pool.query('SELECT goal_calories as goal FROM users WHERE id = 1746278561833');

    res.json({ calroies, goal: goalRow[0].goal });
  } catch (err) {
    console.error('운동 종료 API 오류:', err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
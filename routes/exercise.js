const express = require('express');
const router = express.Router();
const pool = require('../db');

// 운동 종료
router.get('/end', async (req, res) => {
  const { videoId } = req.query;

  try {
    let calroies = 0
    if(videoId == 1){ calroies = 4}
    else if (videoId == 2) {calroies = 40}
    else if (videoId == 3) { calroies = 150}

    const ex_calroies = 5
    const goal_calroies = calroies
    res.json({ burned: ex_calroies, goal: goal_calroies });
  } catch (err) {
    console.error('운동 종료 API 오류:', err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
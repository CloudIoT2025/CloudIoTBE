const express = require('express');
const router = express.Router();
const pool = require('../db');

// 운동 시작
router.get('/start', async (req, res) => {
  const { videoId } = req.query;

  try {
    console.log(`🚀 운동 시작: videoId=${videoId}`);

    try {
      const [rows] = await pool.query(
          'SELECT id FROM s3_data WHERE video_id = ?',
          [videoId]
      );

      if (rows.length === 0) {
        // 없을 경우 처리
        return res.status(404).json({ message: '해당 videoId에 대한 데이터가 없습니다.' });
      }

      const s3DataId = rows[0].id;
      // TODO: 운동 시작 시 s3DataId를 라즈베리파이로 넘겨줌

    } catch (err) {
      console.error('영상 정보 조회 실패:', err);
      res.status(500).json({ error: 'DB 조회 오류' });
    }

    res.status(200).json({ message: '운동이 시작되었습니다.', videoId });
  } catch (err) {
    console.error('운동 시작 API 오류:', err);
    res.status(500).json({ error: '운동 시작 처리 중 오류 발생' });
  }
});

// 운동 종료
router.get('/end', async (req, res) => {
  const { videoId } = req.query;

  try {
    let calroies = 0
    if(videoId == 1){ calroies = 4}
    else if (videoId == 2) {calroies = 40}
    else if (videoId == 3) { calroies = 150}

    // TODO : 운동 결과를 라즈베리파이에서 가져옴
    const ex_calroies = 5
    const goal_calroies = calroies
    res.json({ burned: ex_calroies, goal: goal_calroies });
  } catch (err) {
    console.error('운동 종료 API 오류:', err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
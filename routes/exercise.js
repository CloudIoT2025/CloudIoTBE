const express = require('express');
const pool = require('../utils/db');
const { DateTime } = require('luxon');
const waitForMqttMessage = require('../mqtt/mqttHandler').waitForMqttMessage;
const sendMqttMessage = require('../mqtt/mqttHandler').sendMqttMessage;

const router = express.Router();

// 운동 시작
router.get('/start', async (req, res) => {
  const userId = req.user;
  const { videoId, rspId } = req.query;

  if (!videoId || !rspId) {
    return res.status(400).json({ error: 'videoId랑 rspId를 보내주세요' });
  }

  console.log(`[운동 시작] Video ID: ${videoId}, Rsp ID: ${rspId}`);

  try {
    const [rows] = await pool.query(
      'SELECT id, s3url FROM s3_data WHERE video_id = ?',
      [videoId]
    );

    if (rows.length === 0) {
      // 없을 경우 처리
      return res
        .status(404)
        .json({ message: '해당 videoId에 대한 데이터가 없습니다.' });
    }

    const s3DataId = rows[0].id;
    const s3DataUrl = rows[0].s3url;
    // TODO: 운동 시작 시 s3DataId를 라즈베리파이로 넘겨줌
    
    const result = waitForMqttMessage(`response/move/start/${rspId}`);
    
    sendMqttMessage(
      `move/start/${rspId}`,
      `${s3DataId},${s3DataUrl},${userId}`
    );

    result.then((message) => {
      console.log(`/response/move/start/${rspId}: ${message}`);
      const data = message.trim();
      const valid = data === '1' ? true : false;
      if (valid) {
        // 운동 시작 가능 상태
        return res
          .status(200)
          .json({ message: '운동이 시작되었습니다.', videoId });
      } else {
        // 라즈베리파이 사용중(e.g. 다른 운동 중) 이라 운동 시작 불가능 상태
        return res.status(400).json({
          message:
            '다른 운동 중 등의 이유로 사용중이기 때문에 현재 운동을 시작할 수 없습니다',
        });
      }
    }).catch((err) => {
      console.error(`운동 시작 응답 대기 중 오류: ${err}`);
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ detail: err.message });
  }
});

// 운동 종료
router.get('/end', async (req, res) => {
  const userId = req.user;
  const { videoId, rspId } = req.query;

  if (!videoId || !rspId) {
    return res.status(400).json({ error: 'videoId랑 rspId를 보내주세요' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, video_calories FROM s3_data WHERE video_id = ?',
      [videoId]
    );

    if (rows.length === 0) {
      // 없을 경우 처리
      return res
        .status(404)
        .json({ message: '해당 videoId에 대한 데이터가 없습니다.' });
    }

    const goal_calories = rows[0].video_calories;
    // TODO : 운동 결과를 라즈베리파이에서 가져옴
    const result = await waitForMqttMessage(`move/end/${rspId}`);
    console.log(`/move/end/${rspId}: ${result}`);
    const ex_calories = Math.round(parseFloat(result.split(',')[0]));

    const now = DateTime.now().setZone('Asia/Seoul');
    const today = now.startOf('day');

    const [rspMoveDataRows] = await pool.query(
      'SELECT id, calories_rsp FROM rsp_move_data WHERE user_id = ? AND date = ?',
      [userId, today.toFormat('yyyy-MM-dd HH:mm:ss')]
    );
    if (rspMoveDataRows.length > 0) {
      const { id, calories_rsp } = rspMoveDataRows[0];
      await pool.query(
        'UPDATE rsp_move_data SET calories_rsp = ?, updated_at = ? WHERE id = ?',
        [calories_rsp + ex_calories, now.toFormat('yyyy-MM-dd HH:mm:ss'), id]
      );
    } else {
      await pool.query(
        'INSERT INTO rsp_move_data (id, user_id, calories_rsp, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [
          DateTime.now().valueOf(),
          userId,
          ex_calories,
          today.toFormat('yyyy-MM-dd HH:mm:ss'),
          now.toFormat('yyyy-MM-dd HH:mm:ss'),
          now.toFormat('yyyy-MM-dd HH:mm:ss'),
        ]
      );
    }

    return res.status(200).json({ burned: ex_calories, goal: goal_calories });
  } catch (err) {
    console.error('운동 종료 API 오류:', err);
    return res.status(500).send({ detail: err.message });
  }
});

module.exports = router;
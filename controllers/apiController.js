const pool = require('../utils/db');

exports.getUserInfo = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username as name FROM users LIMIT 1'
    );
    if (rows.length > 0) {
      res.status(200).json(rows[0]);
    } else {
      res.status(404).json({ message: '사용자 정보 없음' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTodayResults = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [rows] = await pool.query(
      'SELECT calories_fitbit AS calories, goal FROM fitbit_data WHERE date = ? ORDER BY created_at DESC LIMIT 1',
      [today]
    );
    if (rows.length > 0) {
      res.status(201).json(rows[0]);
    } else {
      res.status(404).json({ message: '오늘의 데이터 없음' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateGoal = async (req, res) => {
  const { goal } = req.body;
  try {
    await pool.query('UPDATE users SET goal = ? WHERE id = 1', [goal]);
    res.status(200).json({ goal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWeeklyData = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT calories_fitbit AS calories, date AS createdAt FROM fitbit_data ORDER BY date ASC LIMIT 7'
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exerciseEnd = async (req, res) => {
  const { videoId } = req.body;
  res.status(200).json({ score: 90, calories: 200, goal: 2500 });
};

exports.exerciseStart = async (req, res) => {
  const { videoId } = req.body;
  res.status(200).json({ success: true, videoId });
};

exports.getVideos = async (req, res) => {
  const videos = [
    { videoId: 1, title: '저강도 운동', goal: 200, duration: 1200 },
    { videoId: 2, title: '중강도 운동', goal: 300, duration: 1300 },
    { videoId: 3, title: '고강도 운동', goal: 500, duration: 1500 },
  ];
  res.status(200).json(videos);
};
const axios = require('axios');
const { DateTime } = require('luxon');
const pool = require('../utils/db');

exports.showLoginPage = (req, res) => {
  console.log('/ 진입 - Fitbit 로그인 페이지');
  res.sendStatus(200);
};

exports.redirectToFitbit = (req, res) => {
  console.log('/auth/fitbit/login 진입');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.FITBIT_CLIENT_ID,
    redirect_uri: process.env.FITBIT_REDIRECT_URI,
    scope: 'activity profile',
    expires_in: '604800',
  });
  const authUrl = `https://www.fitbit.com/oauth2/authorize?${params.toString()}`;
  console.log('🔗 Fitbit 인증 URL:', authUrl);
  res.redirect(authUrl);
};

exports.handleCallback = async (req, res) => {
  console.log('➡️  /auth/fitbit/callback 진입');
  const { code, error, error_description } = req.query;

  if (error) {
    console.error('Fitbit 인증 에러:', error, error_description);
    return res
      .status(400)
      .send(`Fitbit 인증 에러: ${error}\n${error_description}`);
  }
  if (!code) {
    console.log('인증 코드 없음');
    return res.status(400).send('인증 코드가 없습니다.');
  }

  try {
    const tokenRes = await axios.post(
      'https://api.fitbit.com/oauth2/token',
      new URLSearchParams({
        client_id: process.env.FITBIT_CLIENT_ID,
        grant_type: 'authorization_code',
        redirect_uri: process.env.FITBIT_REDIRECT_URI,
        code: code,
      }),
      {
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(
              `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
            ).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('토큰 발급 응답:', tokenRes.data);
    const { access_token, refresh_token, user_id: encodedId } = tokenRes.data;

    const now = DateTime.now().setZone('Asia/Seoul');
    const dateString = now.startOf('day').toFormat('yyyy-MM-dd HH:mm:ss');
    const dateTimeString = now.toFormat('yyyy-MM-dd HH:mm:ss');

    let [userRows] = await pool.query(
      'SELECT id FROM users WHERE encodedId = ?',
      [encodedId]
    );
    let userId;

    // edit or create users row
    if (userRows.length > 0) {
      userId = userRows[0].id;
      await pool.query(
        'UPDATE users SET access_token=?, refresh_token=?, updated_at=? WHERE id=?',
        [access_token, refresh_token, dateTimeString, userId]
      );
      console.log('기존 사용자 정보 업데이트:', userId);
    } else {
      userId = now.valueOf();
      await pool.query(
        'INSERT INTO users (id, encodedId, access_token, refresh_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [
          userId,
          encodedId,
          access_token,
          refresh_token,
          dateTimeString,
          dateTimeString,
        ]
      );
      console.log('신규 사용자 정보 저장:', userId);
    }

    console.log('Fitbit 활동 데이터 요청:', now.toFormat('yyyy-MM-dd'));
    const activityRes = await axios.get(
      `https://api.fitbit.com/1/user/${encodedId}/activities/date/${now.toFormat(
        'yyyy-MM-dd'
      )}.json`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    const calories = activityRes.data.summary.caloriesOut;
    console.log('오늘의 칼로리 소모량:', calories);

    // 날짜마다 레코드가 하나씩 보장되도록 해야함.
    // 오늘자 fitbit_data 레코드 조회하기
    const [fitbitDataRows] = await pool.query(
      'SELECT id FROM fitbit_data WHERE user_id = ? AND date = ?',
      [userId, dateString]
    );

    if (fitbitDataRows.length > 0) {
      const recordId = fitbitDataRows[0].id;
      await pool.query(
        'UPDATE fitbit_data SET calories_fitbit=?, updated_at=? WHERE id=?',
        [calories, now.toFormat('yyyy-MM-dd HH:mm:ss'), recordId]
      );
      console.log('fitbit_data 업데이트 완료');
    } else {
      await pool.query(
        'INSERT INTO fitbit_data (id, user_id, encoded_id, calories_fitbit, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          `${encodedId}-${now.valueOf()}`,
          userId,
          encodedId,
          calories,
          dateString,
          dateTimeString,
          dateTimeString,
        ]
      );
      console.log('fitbit_data 저장 완료');
    }

    console.log(
      `✅ Fitbit 연동 성공 - 날짜: ${now.toFormat(
        'yyyy-MM-dd'
      )}, 칼로리: ${calories}, 사용자 ID: ${encodedId}`
    );
    res.redirect(
      `${process.env.FRONT_URL}/logincompleted?id=${userId}&access=${access_token}`
    );
  } catch (err) {
    console.error(err);
    console.error(
      'Fitbit 인증/저장 중 오류:',
      err.response?.data || err.message
    );
    res
      .status(500)
      .send(
        '오류 발생: ' +
          (err.response?.data?.errors?.[0]?.message || err.message)
      );
  }
};

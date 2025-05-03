const axios = require('axios');
const pool = require('../utils/db');

exports.showLoginPage = (req, res) => {
    console.log('/ 진입 - Fitbit 로그인 페이지');
    res.sendStatus(200);
};

exports.redirectToFitbit = (req, res) => {
    console.log('/auth/fitbit 진입');
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.FITBIT_CLIENT_ID,
        redirect_uri: process.env.FITBIT_REDIRECT_URI,
        scope: 'activity profile',
        expires_in: '604800'
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
        return res.status(400).send(`Fitbit 인증 에러: ${error}\n${error_description}`);
    }
    if (!code) {
        console.log('인증 코드 없음');
        return res.status(400).send('인증 코드가 없습니다.');
    }

    try {
        const tokenRes = await axios.post('https://api.fitbit.com/oauth2/token',
            new URLSearchParams({
                client_id: process.env.FITBIT_CLIENT_ID,
                grant_type: 'authorization_code',
                redirect_uri: process.env.FITBIT_REDIRECT_URI,
                code: code
            }),
            {
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        console.log('토큰 발급 응답:', tokenRes.data);
        const { access_token, refresh_token, user_id } = tokenRes.data;

        const now = new Date();
        let [rows] = await pool.query('SELECT id FROM users WHERE encodedId = ?', [user_id]);
        let userId;

        if (rows.length > 0) {
            userId = rows[0].id;
            await pool.query(
                'UPDATE users SET access_token=?, refresh_token=?, updated_at=? WHERE id=?',
                [access_token, refresh_token, now, userId]
            );
            console.log('기존 사용자 정보 업데이트:', userId);
        } else {
            userId = Date.now();
            await pool.query(
                'INSERT INTO users (id, username, encodedId, access_token, refresh_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, '', user_id, access_token, refresh_token, now, now]
            );
            console.log('신규 사용자 정보 저장:', userId);
        }

        const today = new Date().toISOString().slice(0, 10);
        console.log('Fitbit 활동 데이터 요청:', today);
        const activityRes = await axios.get(`https://api.fitbit.com/1/user/${user_id}/activities/date/${today}.json`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const calories = activityRes.data.summary.caloriesOut;
        console.log('오늘의 칼로리 소모량:', calories);

        await pool.query(
            'INSERT INTO fitbit_data (id, user_id, encodedId, calories_fitbit, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [Date.now(), userId, user_id, calories, today, now, now]
        );
        console.log('fitbit_data 저장 완료');

        console.log(`✅ Fitbit 연동 성공 - 날짜: ${today}, 칼로리: ${calories}, 사용자 ID: ${user_id}`);
        res.sendStatus(200);
    } catch (err) {
        console.error('Fitbit 인증/저장 중 오류:', err.response?.data || err.message);
        res.status(500).send('오류 발생: ' + (err.response?.data?.errors?.[0]?.message || err.message));
    }
};
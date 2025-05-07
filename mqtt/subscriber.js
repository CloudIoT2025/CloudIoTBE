// subscriber.js
const mqtt = require('mqtt');

const brokerUrl = 'mqtt://localhost:1883';
const options = {
  clientId: `nodejs-subscriber-${Math.random().toString(16).substr(2, 8)}`, // 랜덤 ID 부여
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000, // 2초마다 자동 재연결 시도
  // username: 'user',
  // password: 'password'
};

const client = mqtt.connect(brokerUrl, options);

const TOPICS = [
  'response/move/start/#',
  'move/end/#',
  'response/clientCheck/rsp',
];

client.on('connect', () => {
  console.log(`[${new Date().toISOString()}] ▶ 브로커에 연결됨`);
  client.subscribe(TOPICS, { qos: 0 }, (err, granted) => {
    if (err) {
      console.error('Subscribe error:', err);
    } else {
      console.log('Subscribed to:', granted.map(g => g.topic).join(', '));
    }
  });
});

// client.on('reconnect', () => {
//   console.log(`[${new Date().toISOString()}] 🔄 재연결 시도 중...`);
// });

// client.on('close', () => {
//   console.log(`[${new Date().toISOString()}] ◀ 연결 종료됨`);
// });

// client.on('offline', () => {
//   console.log(`[${new Date().toISOString()}] ⚠️ 클라이언트 오프라인 상태`);
// });

// client.on('error', (err) => {
//   console.error(`[${new Date().toISOString()}] ❌ 에러 발생:`, err.message);
//   // 자동 재연결을 위해 client.end() 호출은 제거했습니다.
// });

client.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    if (topic.startsWith('response/move/start/')) {
      // data = 1,userId or 0,userId
      const rsp_id = topic.split('/')[3];
      console.log(`response for ${rsp_id}:`, data);
      // 운동시작 응답 처리 로직
    } else if (topic.startsWith('move/end/')) {
      // data = 칼로리, userId
      const rsp_id = topic.split('/')[3];
      console.log(`Move end for ${rsp_id}:`, data);
      // DB에 운동 칼로리 저장 로직
    } else if (topic === 'response/clientCheck/rsp') {
      // data = 1,rspId or 0,rspId
      console.log(`response/clientCheck/rsp:`, data);
      // 클라이언트 체크 응답 처리
    }
  } catch (e) {
    console.log(`Received on ${topic}:`, message.toString());
  }
});
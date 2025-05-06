const mqtt = require('mqtt');

// 클라이언트 ID 지정
const options = {
  clientId: 'nodejs-publisher-' + Math.random().toString(16).substr(2, 8), // 랜덤 ID 부여
};

const client = mqtt.connect('mqtt://localhost:1883', options);

client.on('connect', () => {
  client.publish('move/start/12345', '1,url,userId'); // 1번 운동 시작
  // client.publish('move/start/12345', '2,url');  // 2번 운동 시작
  // client.publish('move/start/12345', '3,url');  // 3번 운동 시작
  // client.publish('move/end/12345', '0.92');
  // client.publish('ip/12345', '192.168.1.1');
  // client.publish('clientCheck/rsp', '12345')
  client.end();
});

const mqtt = require('mqtt');

// MQTT 브로커 주소 (예: localhost, 포트 1883)
const brokerUrl = 'mqtt://localhost:1883';

// 옵션 (필요시)
const options = {
    clientId: 'nodejs-client-' + Math.random().toString(16).substr(2, 8),
    clean: true,
    connectTimeout: 4000,
    // username: 'user', // 필요시
    // password: 'pass', // 필요시
};

// 클라이언트 생성 및 연결
const client = mqtt.connect(brokerUrl, options);

// 연결 이벤트
client.on('connect', () => {
    console.log('MQTT 연결 성공');
    // 예시: 특정 토픽 구독
    client.subscribe('test/topic', (err) => {
        if (!err) {
            console.log('test/topic 구독 성공');
        }
    });
});

// 메시지 수신 이벤트
client.on('message', (topic, message) => {
    console.log(`수신: [${topic}] ${message.toString()}`);
    // 여기서 메시지 처리 로직 작성
});

// 에러 이벤트
client.on('error', (err) => {
    console.error('MQTT 에러:', err);
});

// publish 함수 (외부에서 사용 가능)
function publish(topic, msg) {
    client.publish(topic, msg, (err) => {
        if (err) {
            console.error('메시지 발행 실패:', err);
        }
    });
}

// 모듈로 export
module.exports = {
    client,
    publish,
};

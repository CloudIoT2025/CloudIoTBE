const mqtt = require('mqtt');

const brokerUrl = 'mqtt://localhost:1883';

async function waitForMqttMessage(topic) {
    const options = {
    clientId: 'nodejs-subscriber' + Math.random().toString(16).substr(2, 8), // 랜덤 ID 부여
    };
  const client = mqtt.connect(brokerUrl, options);

  return new Promise((resolve, reject) => {
    client.on('connect', () => {
      client.subscribe(topic, (err) => {
        if (err) reject(err);
      });
    });

    client.on('message', (recvTopic, payload) => {
      if (recvTopic === topic) {
        // payload는 Buffer
        const msg = payload.toString();
        client.end();        // 더 이상 필요 없다면 연결 종료
        resolve(msg);        // 여기서 프로미스가 풀리면서 다음 줄로 진행
      }
    });

    client.on('error', (err) => {
      client.end();
      reject(err);
    });
  });
}

function sendMqttMessage(topic, message) {
    const options = {
    clientId: 'nodejs-publisher-' + Math.random().toString(16).substr(2, 8), // 랜덤 ID 부여
    };

    const client = mqtt.connect(brokerUrl, options);

    client.on('connect', () => {
    client.publish('move/start/12345', '1,url,userId');
    client.end();
    })
}

module.exports = {
    sendMqttMessage,
    waitForMqttMessage,
  };
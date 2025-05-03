const mqtt = require('mqtt');

// const brokerUrl = 'mqtt://localhost:1883';
const brokerUrl = 'mqtt://ec2-43-201-68-3.ap-northeast-2.compute.amazonaws.com:1883';

async function waitForMqttMessage(topic, timeoutMs = 500) {
  const options = {
    clientId: 'nodejs-subscriber-' + Math.random().toString(16).substr(2, 8),
    clean: false,
  };
  const client = mqtt.connect(brokerUrl, options);

  return new Promise((resolve, reject) => {
    // 타임아웃 타이머 설정
    const timer = setTimeout(() => {
      client.end();
      reject(new Error(`Timeout: no message received on topic "${topic}" within ${timeoutMs}ms`));
    }, timeoutMs);

    client.on('connect', () => {
      client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          clearTimeout(timer);
          client.end();
          return reject(err);
        }
      });
    });

    client.on('message', (recvTopic, payload) => {
      if (recvTopic === topic) {
        clearTimeout(timer);
        const msg = payload.toString();
        client.end();
        resolve(msg);
      }
    });

    client.on('error', (err) => {
      clearTimeout(timer);
      client.end();
      reject(err);
    });
  });
}


function sendMqttMessage(topic, message) {
  const options = {
    clientId: 'nodejs-publisher-' + Math.random().toString(16).substr(2, 8),
    clean: true,
  };
  const client = mqtt.connect(brokerUrl, options);

  client.on('connect', () => {
    // QoS 1로 퍼블리시
    client.publish(topic, message, { qos: 1,retain: true }, (err) => {
      if (err) console.error('Publish error:', err);
      client.end();
    });
  });
}

module.exports = {
  sendMqttMessage,
  waitForMqttMessage,
};

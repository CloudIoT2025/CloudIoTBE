const mqtt = require('mqtt');

const brokerUrl = 'mqtt://localhost:1883';

async function waitForMqttMessage(topic) {
  const options = {
    clientId: 'nodejs-subscriber-' + Math.random().toString(16).substr(2, 8),
    clean: true,
  };
  const client = mqtt.connect(brokerUrl, options);

  return new Promise((resolve, reject) => {
    client.on('connect', () => {
      // QoS 1로 구독
      client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) return reject(err);
      });
    });

    client.on('message', (recvTopic, payload) => {
      if (recvTopic === topic) {
        const msg = payload.toString();
        client.end();
        resolve(msg);
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
    clientId: 'nodejs-publisher-' + Math.random().toString(16).substr(2, 8),
    clean: true,
  };
  const client = mqtt.connect(brokerUrl, options);

  client.on('connect', () => {
    // QoS 1로 퍼블리시
    client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) console.error('Publish error:', err);
      client.end();
    });
  });
}

module.exports = {
  sendMqttMessage,
  waitForMqttMessage,
};

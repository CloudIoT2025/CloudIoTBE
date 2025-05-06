// broker.js
const aedes = require('aedes')();
const net = require('net');

const PORT = 1883;
const server = net.createServer(aedes.handle);
const topicLogs = [
  'move/start/',
  'response/move/start/',
  'client/',
  'move/end/',
  'response/move/end/',
  'response/clientCheck/',
];

const clientList = new Set();

server.listen(PORT, () => {
  console.log(`Aedes MQTT broker listening on port ${PORT}`);
});

// 1) 모든 PUBLISH 패킷 로그
aedes.on('publish', (packet, client) => {
  const sender = client ? client.id : 'BROKER';
  // 1-1) 특정 토픽에 대한 로그 필터링
  if (topicLogs.some(topic => packet.topic.startsWith(topic))) {
    console.log(`📡 ${sender} → ${packet.topic}: ${packet.payload.toString()}`);
  }

  // console.log(`[${new Date().toISOString()}] ${sender} → ${packet.topic}: ${packet.payload.toString()}`);
  // 2) 특정 토픽에 대한 별도 처리
  if (packet.topic === 'commands/restart') {
    // 예: 리스타트 명령을 받았을 때 실행할 함수 호출
    handleRestartCommand(packet.payload.toString());
  }

  if (packet.topic === 'clientCheck/rsp') {
    rspid = packet.payload.toString();
    // 연결된 클라이언트중에 rspid와 같은 id를 가진 클라이언트가 있는지 확인
    if (clientList.has('rsp-' + rspid)) {
      console.log(`클라이언트 ${rspid} 연결되어있음`);
      // response/clientCheck/rsp 로 결과 전송
      aedes.publish({
        topic: `response/clientCheck/${rspid}`,
        payload: '1',
        qos: 1,
        retain: true,
      });
    } else {
      console.log(`클라이언트 ${rspid} 연결되어있지 않음`);
      // response/clientCheck/rsp 로 결과 전송
      aedes.publish({
        topic: `response/clientCheck/${rspid}`,
        payload: '0',
        qos: 1,
        retain: true,
      });
    }
  }
});

// 3) 특정 SUBSCRIBE 이벤트 처리
aedes.on('subscribe', (subscriptions, client) => {
  subscriptions.forEach(sub => {
    if (sub.topic === 'alerts/#') {
      console.log(
        `🔔 ALERT 구독: ${client.id}님이 ${sub.topic}을(를) 구독했습니다.`
      );
      // 필요시 별도 초기화 로직 등 수행
      initAlertSessionFor(client.id);
    }
  });
});

// (선택) CONNECT / DISCONNECT 이벤트도 잡아서 처리 가능
aedes.on('client', client => {
  console.log(`클라이언트 연결: ${client.id}`);
  clientList.add(client.id);
});

aedes.on('clientDisconnect', client => {
  console.log(`클라이언트 해제: ${client.id}`);
  clientList.delete(client.id);
});

// --- 커스텀 핸들러 예시 함수들 ---
function handleRestartCommand(payload) {
  console.log('🚀 리스타트 명령 수신:', payload);
  // 실제 리스타트 로직을 여기에…
}

function initAlertSessionFor(clientId) {
  console.log(`⚙️ Alert 세션 초기화 for ${clientId}`);
  // 세션 초기화 로직을 여기에…
}
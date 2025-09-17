# 🌐 CloudIoTBE

> **Fitbit + Raspberry Pi 기반 스마트 헬스케어 웹 서비스의 백엔드**  
> 사용자 인증, 운동 기록 관리, Fitbit 연동, IoT 장비 제어 기능을 제공하며 EC2 서버에서 수동 배포하여 운영할 수 있도록 구성된 Node.js 기반 API 서버입니다.

---

## 🧩 프로젝트 개요

이 백엔드는 헬스케어 웹서비스의 핵심 로직을 처리합니다.  
Fitbit에서 사용자 활동 데이터를 수집하고, Raspberry Pi 장비와 MQTT로 통신하여 운동을 시작/종료하며, 주간 운동 기록과 목표를 비교하여 시각화할 데이터를 제공합니다.

---

## 📁 디렉토리 구조

```
CloudIoTBE/
├── app.js                # 서버 초기화
├── server.js             # 서버 실행 시작점
├── db.js                 # MySQL 연결
├── .env                  # 환경변수 설정 파일
├── routes/               # 라우팅 구성
├── controllers/          # 컨트롤러 (핸들러)
├── middlewares/          # 인증/공통 미들웨어
├── utils/                # 유틸 함수
├── mqtt/                 # MQTT 통신 (Raspberry Pi)
├── RaspberryPi/          # 장비와의 연동 코드
```

---

## 🔌 주요 API 기능

| 라우트 | 설명 |
|--------|------|
| `POST /api/user/register` | 사용자 회원가입 |
| `POST /api/user/login` | 로그인, 토큰 발급 |
| `GET /api/fitbit/data` | Fitbit 사용자 데이터 수집 |
| `POST /api/exercise/start` | 운동 시작 트리거 (MQTT) |
| `POST /api/exercise/end` | 운동 종료 및 기록 저장 |
| `GET /api/exercise/weekly` | 주간 운동 통계 데이터 제공 |

---

## 🔒 주요 기능 요약

- 사용자 인증 (JWT)
- Fitbit OAuth2 로그인 및 데이터 수집
- 운동 시작/종료 처리 및 기록 저장
- 주간 운동 통계 API
- MQTT 기반 Raspberry Pi 연동
- .env를 통한 환경 분리 구성

---

## 🛠 사용 기술

| 항목 | 내용 |
|------|------|
| 언어/프레임워크 | Node.js + Express |
| DB | MySQL |
| 인증 | JWT (Access Token) |
| 외부 연동 | Fitbit API, MQTT |
| 배포 | AWS EC2, Github Action 기반 자동 배포 |

---

## 🌱 .env 환경변수 예시

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=cloudiot
ACCESS_TOKEN_SECRET=yourAccessTokenSecret
MQTT_BROKER=mqtt://localhost
```

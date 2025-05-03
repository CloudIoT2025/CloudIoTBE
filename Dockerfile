# [1단계] 빌드 이미지
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# [2단계] 실행 이미지
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 8080
EXPOSE 1883
CMD ["sh", "-c", "npm run broker & npm start"]

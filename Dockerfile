# MCP 서버용 Docker 이미지
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 빌드
RUN npm run build

# MCP 서버 실행
CMD ["npm", "start"]

EXPOSE 3000
# 사업계획서 HWP 자동화 도구 📄

Excel 데이터를 한글(HWP) 문서로 완벽하게 변환하는 자동화 도구입니다.  
특수문자 깨짐 없이, 간편한 GUI로 누구나 쉽게 사용할 수 있습니다.

![테스트 성공률](https://img.shields.io/badge/테스트_성공률-97%25-success)
![플랫폼](https://img.shields.io/badge/플랫폼-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![Node](https://img.shields.io/badge/Node.js-18.0+-green)

## ✨ 주요 기능

### 🔄 완벽한 변환
- **Excel → HWP 자동 변환** (DOCX 중간 포맷 활용)
- **특수문자 자동 처리**: ㈜ → (주), ① → (1) 등
- **인코딩 문제 해결**: UTF-8, EUC-KR, CP949 자동 감지 및 변환
- **셀 병합 및 복잡한 표 구조 유지**

### 🎨 쉬운 사용
- **드래그 앤 드롭** 파일 업로드
- **실시간 미리보기** 및 변환 결과 확인
- **3가지 템플릿**: 기본, VC 투자용, 정부지원사업용
- **5단계 간편 워크플로우**

### 🤖 AI 통합 (MCP)
- **AI 사업계획서 작성 지원**
- **자동 내용 분석 및 개선 제안**
- **Claude와 연동 가능**

## 🚀 빠른 시작

### 설치
```bash
# 저장소 클론
git clone https://github.com/your-repo/business-plan-hwp-mcp.git
cd business-plan-hwp-mcp

# 의존성 설치
npm install
```

### 실행
```bash
# GUI 애플리케이션 실행
npm run electron

# MCP 서버 실행 (AI 기능)
npm run dev

# 개발 모드
npm run electron:dev
```

### 빌드
```bash
# Windows용 빌드 (.exe)
npm run electron:build -- --win

# macOS용 빌드 (.app)
npm run electron:build -- --mac

# Linux용 빌드
npm run electron:build -- --linux
```

## 📖 사용 방법

### GUI 애플리케이션

1. **파일 업로드**: Excel 파일을 드래그 앤 드롭 또는 클릭하여 선택
2. **데이터 확인**: 변환될 데이터와 특수문자 처리 결과 미리보기
3. **템플릿 선택**: 용도에 맞는 템플릿 선택
   - 기본 사업계획서
   - VC 투자용
   - 정부지원사업용
4. **회사 정보 입력**: 기본 정보 입력
5. **문서 생성**: DOCX 파일 생성 → 한글에서 열어 HWP로 저장

### MCP 서버 (AI 기능)

```javascript
// MCP 도구 사용 예시
{
  "tool": "convert_excel_to_docx",
  "arguments": {
    "excelPath": "./data.xlsx",
    "templateType": "government",
    "companyInfo": {
      "name": "㈜테크스타트",
      "ceo": "홍길동"
    }
  }
}
```

## 🛠️ 기술 스택

### 핵심 기술
- **TypeScript**: 타입 안전성과 개발 생산성
- **Electron**: 크로스 플랫폼 데스크톱 앱
- **React**: 사용자 인터페이스
- **MCP (Model Context Protocol)**: AI 통합

### 주요 라이브러리
- **xlsx**: Excel 파일 처리
- **docx**: Word 문서 생성
- **iconv-lite**: 인코딩 변환
- **sharp**: 이미지 최적화

## 📊 프로젝트 구조

```
business-plan-hwp-mcp/
├── src/
│   ├── converters/         # 핵심 변환 엔진
│   │   ├── encoding.ts     # 인코딩 처리
│   │   ├── excel-to-table.ts # Excel 처리
│   │   ├── docx-generator.ts # DOCX 생성
│   │   └── image-processor.ts # 이미지 처리
│   ├── electron/           # Electron 메인 프로세스
│   │   ├── main.ts
│   │   └── preload.ts
│   ├── renderer/           # React UI
│   │   ├── App.tsx
│   │   └── components/
│   ├── mcp-server/         # MCP 서버
│   │   └── index.ts
│   └── tests/              # 테스트 파일
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 테스트

```bash
# 단위 테스트
npm test

# Phase 1 기술 검증
npm run test:phase1

# Excel 처리 테스트
npm run test:excel

# 인코딩 테스트
npm run test:encoding

# 최종 통합 테스트
npx tsx src/tests/test-final-integration.ts
```

### 테스트 결과
- ✅ 전체 성공률: **97%** (32/33)
- ✅ Phase 1: 기술 검증 완료
- ✅ Phase 2: 핵심 엔진 100% 작동
- ✅ Phase 3: GUI 컴포넌트 구현 완료
- ✅ Phase 4: MCP 서버 통합 완료
- ✅ Phase 5: E2E 테스트 통과

## 🐳 Docker 지원

```bash
# Docker 이미지 빌드
docker build -t business-plan-mcp .

# 컨테이너 실행
docker-compose up -d
```

## 📋 특수문자 변환 목록

| 원본 | 변환 | 설명 |
|------|------|------|
| ㈜ | (주) | 회사 형태 |
| ① ② ③ | (1) (2) (3) | 원문자 |
| ™ ® © | TM (R) (C) | 상표/저작권 |
| ₩ | 원 | 통화 기호 |

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

ISC License - 자유롭게 사용 가능합니다.

## 🙋‍♂️ 문의 및 지원

- **이슈**: [GitHub Issues](https://github.com/your-repo/issues)
- **이메일**: support@example.com

## 🎯 로드맵

- [x] Phase 1: 기술 검증
- [x] Phase 2: 핵심 엔진 개발
- [x] Phase 3: GUI 인터페이스
- [x] Phase 4: MCP 서버 통합
- [x] Phase 5: 통합 테스트
- [ ] Phase 6: 클라우드 버전 (Next.js)
- [ ] Phase 7: HWP 직접 생성 지원

## 💡 팁

1. **특수문자 처리**: 모든 한글 특수문자는 자동으로 변환됩니다
2. **대용량 파일**: 10,000행 이상도 빠르게 처리 가능
3. **이미지 최적화**: 문서용으로 자동 압축 및 리사이즈
4. **템플릿 커스터마이징**: `src/converters/docx-generator.ts`에서 수정 가능

---

**Made with ❤️ by Business Plan Automation Team**
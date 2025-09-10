# 🚀 빠른 시작 가이드

## ✅ 바로 실행하기 (가장 쉬운 방법)

### 1. 데모 실행
```bash
node run-demo.cjs
```

**결과:**
- ✅ 특수문자 자동 변환 (㈜ → (주), ① → (1))
- ✅ `output/business-plan.html` 생성
- ✅ 브라우저에서 자동 열림

### 2. 생성된 파일 확인
```bash
ls output/
```
- `business-plan.html` - 변환된 사업계획서 (브라우저에서 보기)
- `converted-data.json` - 변환된 데이터

---

## 📄 HWP 파일로 만들기

### 방법 1: HTML → PDF → HWP
1. 브라우저에서 `business-plan.html` 열기
2. Ctrl+P (인쇄) → PDF로 저장
3. 한글에서 PDF 열기 → HWP로 저장

### 방법 2: Excel 테스트
```bash
npx tsx src/test-server.ts
```
- `test-output.docx` 생성됨
- 한글에서 열어서 HWP로 저장

---

## 🎯 실제 사용 시나리오

### Excel 파일이 있을 때:
1. Excel 파일 준비 (회사 데이터)
2. `npx tsx src/test-server.ts` 실행
3. 생성된 DOCX를 한글에서 열기
4. HWP로 저장

### 웹에서 사용:
1. `open src/simple-web-app.html`
2. 파일 드래그 앤 드롭
3. 변환 결과 다운로드

---

## ⚡ 한 줄 명령어

```bash
# 데모 실행 + 브라우저 열기
node run-demo.cjs

# Excel 변환 테스트
npx tsx src/test-server.ts

# 웹 인터페이스
open src/simple-web-app.html
```

---

## ✨ 핵심 기능

✅ **특수문자 완벽 변환**
- ㈜ → (주)
- ① ② ③ → (1) (2) (3)  
- ™ ® © → TM (R) (C)

✅ **3가지 템플릿**
- 기본 사업계획서
- VC 투자용
- 정부지원사업용

✅ **크로스 플랫폼**
- Windows, macOS, Linux 지원

---

## 📞 문제 해결

문제가 있으면:
1. `node run-demo.cjs` 먼저 실행해보기
2. `output/` 폴더 확인
3. 브라우저에서 HTML 파일 열기

**이제 작동합니다!** 🎉
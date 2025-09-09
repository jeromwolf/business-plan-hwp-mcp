# Phase 1: 기술 검증 및 환경 설정 체크리스트

## 🎯 Day 1: 개발 환경 구축 (3.5시간)

### Morning (1.5시간)
```bash
# Task 1.1.1: 프로젝트 초기화 (30분)
□ mkdir business-plan-hwp-mcp && cd business-plan-hwp-mcp
□ git init
□ npm init -y
□ .gitignore 생성

# Task 1.1.2: TypeScript 설정 (30분)
□ npm install -D typescript @types/node
□ npx tsc --init
□ tsconfig.json 수정

# Task 1.1.3: 린터 설정 (30분)
□ npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
□ .eslintrc.json 생성
□ npm install -D prettier
□ .prettierrc 생성
```

### Afternoon (2시간)
```bash
# Task 1.1.4: 필수 패키지 설치 (1시간)
□ npm install @modelcontextprotocol/sdk
□ npm install electron --save-dev
□ npm install xlsx
□ npm install iconv-lite
□ npm install sharp
□ npm install winston  # 로깅용

# Task 1.1.5: 폴더 구조 생성 (30분)
□ mkdir -p src/{mcp-server,hwp,converters,gui,utils,config}
□ mkdir -p tests/{unit,integration,fixtures}
□ mkdir -p assets/{templates,samples,icons}
□ mkdir -p docs

# Task 1.1.6: 기본 파일 생성 (30분)
□ touch src/index.ts
□ touch src/mcp-server/index.ts
□ touch src/gui/main.ts
□ touch README.md
```

### ✅ Day 1 완료 조건
- [ ] npm start 실행 가능
- [ ] TypeScript 컴파일 성공
- [ ] 기본 구조 완성

---

## 🎯 Day 2-3: HWP 처리 검증 (8시간)

### Day 2 Morning (4시간)
```javascript
// Task 1.2.1: hwp.js 테스트
□ git clone https://github.com/hahnlee/hwp.js ../hwp.js-test
□ cd ../hwp.js-test && npm install && npm run build

// test-hwp-parse.ts 작성
□ 샘플 HWP 파일 3개 준비 (간단/보통/복잡)
□ 파싱 테스트 스크립트 작성
□ 실행 및 결과 기록

// 테스트 항목
□ 텍스트 추출 성공 여부
□ 표 데이터 추출 성공 여부
□ 이미지 감지 성공 여부
□ 메타데이터 읽기 성공 여부
```

### Day 2 Afternoon (4시간)
```javascript
// Task 1.2.2: HWP 생성 POC
□ HWP 파일 구조 문서 조사
□ 최소 HWP 파일 바이너리 분석
□ 간단한 텍스트만 있는 HWP 생성 시도

// 의사결정 매트릭스
□ HWP 직접 생성 가능? → 난이도 평가
□ HWPX (XML) 사용 가능? → 호환성 확인  
□ DOCX 변환 방식? → 추가 단계 평가
□ 최종 결정: _______________
```

### ✅ Day 2-3 완료 조건
- [ ] HWP 파싱 성공/실패 확정
- [ ] HWP 생성 방식 결정
- [ ] 기술적 리스크 문서화

---

## 🎯 Day 4: Excel 처리 검증 (5시간)

### Morning (3시간)
```javascript
// Task 1.3.1: Excel 읽기 테스트
// test-excel.ts 작성

const testFiles = [
  'simple.xlsx',      // 단순 데이터
  'merged-cells.xlsx', // 셀 병합
  'formulas.xlsx',    // 수식 포함
  'korean.xlsx'       // 한글 데이터
];

□ 각 파일별 읽기 테스트
□ 데이터 구조 출력
□ 한글 깨짐 확인
□ 셀 병합 정보 확인
```

### Afternoon (2시간)
```javascript
// Task 1.3.2: 데이터 타입 처리
□ 숫자 포맷 (통화, 퍼센트, 일반)
□ 날짜 포맷 (yyyy-mm-dd, yyyy/mm/dd)
□ 시간 포맷
□ 텍스트 (좌/우/중앙 정렬)
□ 빈 셀 처리 로직
□ 수식 → 값 변환
```

### ✅ Day 4 완료 조건
- [ ] Excel 파일 100% 읽기 성공
- [ ] 한글 데이터 정상 출력
- [ ] 모든 데이터 타입 처리

---

## 🎯 Day 5: 인코딩 처리 검증 (7시간)

### Morning (3시간)
```javascript
// Task 1.4.1: 인코딩 변환 테스트
// test-encoding.ts

const testCases = [
  { input: '㈜회사', expected: '(주)회사' },
  { input: '①②③', expected: '(1)(2)(3)' },
  { input: '한글English中文', expected: '한글English中文' },
  { input: '특수문자™®©', expected: '특수문자TM(R)(C)' }
];

□ UTF-8 → EUC-KR 변환 테스트
□ EUC-KR → UTF-8 역변환 테스트
□ CP949 처리 테스트
□ 손실 없는 변환 확인
```

### Afternoon (4시간)
```javascript
// Task 1.4.2: 자동 감지 및 복구
// encoding-detector.ts

□ chardet 라이브러리 테스트
□ 자체 감지 로직 구현
□ 신뢰도 점수 계산
□ 폴백 체인 구현
□ 깨진 문자 복구 로직
□ 특수문자 매핑 테이블 완성
```

### ✅ Day 5 완료 조건
- [ ] 인코딩 자동 감지 90% 정확도
- [ ] 특수문자 변환 100% 성공
- [ ] 깨짐 복구 로직 작동

---

## 📊 Phase 1 최종 체크리스트

### 기술 검증 결과
```yaml
HWP 처리:
  파싱: □ 가능 / □ 불가능
  생성: □ 직접 / □ DOCX 경유 / □ 템플릿
  결정: _______________

Excel 처리:
  읽기: □ 성공 / □ 부분 성공
  한글: □ 정상 / □ 깨짐 있음
  병합: □ 지원 / □ 미지원

인코딩:
  자동감지: □ 구현 / □ 미구현
  변환성공률: ____%
  특수문자: □ 완료 / □ 부분완료
```

### Go/No-Go 결정
```yaml
진행 가능 조건:
  □ HWP 파싱 또는 생성 가능
  □ Excel 데이터 90% 이상 읽기
  □ 한글 인코딩 80% 이상 성공

현재 상태:
  □ GO - Phase 2 진행
  □ PIVOT - 기술 스택 변경
  □ NO-GO - 프로젝트 재검토

결정일: 2024-__-__
결정자: ___________
```

### 리스크 및 이슈
```yaml
식별된 리스크:
  1. _______________
  2. _______________
  3. _______________

해결 방안:
  1. _______________
  2. _______________
  3. _______________

에스컬레이션 필요:
  □ Yes / □ No
```

## 📝 Phase 1 회고

### 잘된 점 (Keep)
- 

### 개선할 점 (Problem)
- 

### 시도할 점 (Try)
- 

### 배운 점 (Learn)
- 

---

## ⏭️ Phase 2 준비

Phase 1이 성공적으로 완료되면:

1. **Phase 2 킥오프 미팅**
   - 기술 검증 결과 공유
   - 아키텍처 확정
   - 일정 조정

2. **개발 환경 최종화**
   - 선택된 기술 스택 설치
   - CI/CD 파이프라인 구성
   - 테스트 환경 구축

3. **상세 설계**
   - 클래스 다이어그램
   - 시퀀스 다이어그램
   - API 명세

---

**Note**: 각 작업 완료 시 ✅ 체크하고, 이슈 발생 시 즉시 기록하세요.
# AI 자동화 시스템 설계서

## 1. 시스템 개요

### 목표
사용자 설문을 통해 맞춤형 사업계획서를 AI로 자동 생성하고, 기존 UI에서 편집 가능하도록 통합

### 플로우
```
[모드 선택] → [설문조사] → [AI 생성] → [기존 UI 편집] → [다운로드]
```

## 2. 주요 컴포넌트

### 2.1 설문 시스템 (Survey System)
- **목적**: 사용자 비즈니스 컨텍스트 수집
- **구성**: 5-7개 핵심 질문
- **출력**: 구조화된 프로파일 데이터

### 2.2 AI 엔진 (AI Engine)
- **목적**: 설문 데이터 기반 콘텐츠 생성
- **방식**: Claude API 활용
- **출력**: 섹션별 구조화된 콘텐츠

### 2.3 매핑 시스템 (Mapping System)
- **목적**: AI 생성 콘텐츠를 기존 폼에 자동 입력
- **방식**: 필드별 매핑 규칙
- **출력**: 채워진 폼 데이터

## 3. 설문 데이터 구조

```javascript
{
  // 기본 정보
  basic: {
    companyName: "회사명",
    industry: "업종",
    establishDate: "설립일/예정일",
    stage: "사업단계" // 아이디어|창업준비|초기운영|성장단계
  },
  
  // 비즈니스 정보
  business: {
    problem: "해결하려는 문제",
    solution: "제공하는 솔루션",
    targetMarket: "타겟 시장",
    marketSize: "시장 규모",
    competitors: "주요 경쟁사"
  },
  
  // 차별화 요소
  differentiation: {
    usp: "핵심 경쟁력",
    technology: "핵심 기술/특허",
    team: "팀 강점"
  },
  
  // 재무/투자
  financial: {
    revenueModel: "수익 모델",
    currentRevenue: "현재 매출",
    fundingNeed: "필요 자금",
    fundingPurpose: "자금 용도"
  },
  
  // 문서 목적
  purpose: {
    documentType: "문서 용도", // 투자유치|정부지원|내부용
    deadline: "제출 기한",
    specialRequirements: "특별 요구사항"
  }
}
```

## 4. AI 프롬프트 전략

### 4.1 시스템 프롬프트
```
당신은 한국의 사업계획서 작성 전문가입니다.
제공된 정보를 바탕으로 전문적이고 설득력 있는 사업계획서를 작성합니다.
한국 비즈니스 관행과 투자자/정부기관의 선호도를 고려합니다.
```

### 4.2 섹션별 프롬프트 템플릿
```javascript
const sectionPrompts = {
  executive_summary: `
    다음 정보로 사업계획서 요약을 작성하세요:
    - 회사: {companyName}
    - 문제: {problem}
    - 솔루션: {solution}
    - 시장규모: {marketSize}
    형식: 3-4 문단, 각 문단 3-4문장
  `,
  
  business_model: `
    다음 정보로 비즈니스 모델을 상세히 설명하세요:
    - 수익모델: {revenueModel}
    - 타겟고객: {targetMarket}
    - 핵심가치: {usp}
    포함사항: 수익구조, 가격전략, 성장전략
  `,
  
  // ... 각 섹션별 프롬프트
}
```

## 5. UI 통합 방안

### 5.1 모드 선택 화면
```html
<div class="mode-selection">
  <button onclick="startManualMode()">직접 작성</button>
  <button onclick="startAIMode()">AI 자동 작성</button>
</div>
```

### 5.2 설문 모달
```html
<div class="survey-modal">
  <div class="progress-bar"></div>
  <div class="question-container">
    <!-- 동적 생성 -->
  </div>
  <div class="navigation">
    <button onclick="prevQuestion()">이전</button>
    <button onclick="nextQuestion()">다음</button>
  </div>
</div>
```

### 5.3 로딩 상태
```html
<div class="ai-loading">
  <div class="spinner"></div>
  <div class="status-text">AI가 콘텐츠를 생성 중입니다...</div>
  <div class="progress-detail">
    <!-- 섹션별 진행 상황 -->
  </div>
</div>
```

## 6. 구현 단계

### Phase 1: 설문 시스템 (Week 1)
- [ ] 설문 UI 컴포넌트 개발
- [ ] 질문 플로우 로직
- [ ] 데이터 검증 및 저장

### Phase 2: AI 엔진 (Week 2)
- [ ] Claude API 연동
- [ ] 프롬프트 템플릿 작성
- [ ] 응답 파싱 및 구조화

### Phase 3: 통합 (Week 3)
- [ ] 콘텐츠 매핑 로직
- [ ] 기존 UI 연동
- [ ] 에러 처리

### Phase 4: 최적화 (Week 4)
- [ ] 사용성 테스트
- [ ] 성능 최적화
- [ ] 버그 수정

## 7. 기술 스택

- **Frontend**: Vanilla JS (기존 유지)
- **AI**: Claude API
- **Storage**: localStorage
- **상태관리**: 간단한 상태 머신

## 8. 예상 파일 구조

```
business-plan-hwp-mcp/
├── business-plan-ultimate-fixed.html (기존)
├── js/
│   ├── ai-automation.js (신규)
│   ├── survey-system.js (신규)
│   ├── ai-engine.js (신규)
│   └── content-mapper.js (신규)
├── css/
│   └── ai-components.css (신규)
└── templates/
    └── prompts.js (신규)
```

## 9. 성공 지표

- 설문 완료율 > 80%
- AI 생성 시간 < 30초
- 사용자 수정 비율 < 30%
- 전체 작성 시간 단축 > 70%

## 10. 리스크 및 대응

| 리스크 | 대응방안 |
|--------|----------|
| AI 응답 품질 불안정 | 프롬프트 지속 개선, 폴백 템플릿 준비 |
| API 비용 증가 | 캐싱 전략, 사용량 제한 |
| 사용자 거부감 | 수동/자동 선택권 제공 |
| 기술적 복잡도 | 단계별 구현, 충분한 테스트 |

---

*작성일: 2025-09-10*
*버전: 1.0*
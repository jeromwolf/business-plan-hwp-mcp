# 사업계획서 HWP MCP - 최종 설계

## 핵심 기능 (필수)

### 1. 포맷별 AI 사업계획서 작성
- 정부 지원사업 포맷
- VC 투자 포맷  
- 은행 대출 포맷

### 2. 멀티미디어 통합
- Excel 데이터 → HWP 표 변환
- 이미지 삽입 (제품, 차트, 다이어그램)
- 첨부파일 관리

### 3. HWP 생성
- AI 텍스트 + 미디어 통합
- 한글 인코딩 완벽 처리
- Mac에서 작동

## MCP 도구 정의

```typescript
interface MCPTools {
  // 1. 포맷 선택 및 생성
  createBusinessPlan: {
    input: {
      format: 'government' | 'vc' | 'bank';
      businessInfo: string;
      requirements: string[];
    };
    output: {
      documentId: string;
      sections: string[];
    };
  };
  
  // 2. Excel 데이터 삽입
  insertExcelData: {
    input: {
      documentId: string;
      excelPath: string;
      targetSection: string;
    };
  };
  
  // 3. 이미지 삽입
  insertImage: {
    input: {
      documentId: string;
      imagePath: string;
      caption?: string;
    };
  };
  
  // 4. 최종 HWP 생성
  generateHWP: {
    input: {
      documentId: string;
    };
    output: {
      hwpPath: string;
    };
  };
}
```

## 사용 시나리오

```
User: "정부 지원사업 사업계획서 작성해줘. 
       우리는 AI 교육 플랫폼 스타트업이야"

Claude: [createBusinessPlan 실행]
        "사업계획서 초안을 작성했습니다.
         Excel 재무 데이터가 있으신가요?"

User: [financial.xlsx 업로드]

Claude: [insertExcelData 실행]
        "재무제표를 삽입했습니다.
         제품 스크린샷이 있으신가요?"

User: [screenshots.png 업로드]

Claude: [insertImage 실행]
        [generateHWP 실행]
        "완성된 HWP 파일입니다."
```

## 기술 구현

### MCP 서버 구조
```
src/
├── mcp-server/
│   ├── index.ts           # MCP 서버 메인
│   ├── tools/
│   │   ├── createPlan.ts  # 사업계획서 생성
│   │   ├── insertData.ts  # 데이터 삽입
│   │   └── generateHWP.ts # HWP 생성
│   └── templates/         # 포맷별 템플릿
│       ├── government.json
│       ├── vc.json
│       └── bank.json
│
├── hwp/
│   ├── generator.ts       # HWP 생성 엔진
│   ├── encoder.ts         # 인코딩 처리
│   └── parser.ts          # HWP 파싱
│
└── converters/
    ├── excel-to-table.ts  # Excel → 표 변환
    └── image-processor.ts # 이미지 처리
```

## 개발 우선순위

1. **Week 1**: MCP 서버 기본 구조
2. **Week 2**: 포맷별 템플릿 시스템
3. **Week 3**: Excel/이미지 통합
4. **Week 4**: HWP 생성 및 인코딩

## 삭제된 기능
- ~~HWP → MD 변환~~ (불필요)
- ~~Electron GUI~~ (MCP로 충분)
- ~~Standalone 모드~~ (MCP 전용)
- ~~PDF 변환~~ (HWP만 집중)
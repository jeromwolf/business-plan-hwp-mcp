# 포맷 기반 AI 사업계획서 작성 + 멀티미디어 통합 HWP 시스템

## 핵심 컨셉

```
사업계획서 포맷 선택 (정부지원, VC투자, 대출 등)
    ↓
포맷별 섹션에 AI가 콘텐츠 생성
    ↓
사용자가 이미지/엑셀 데이터 추가
    ↓
모든 요소 통합하여 HWP 생성
```

## 1. 사업계획서 포맷 라이브러리

### 1.1 정부 지원사업 포맷
```yaml
government_support_format:
  sections:
    - title: "사업 개요"
      subsections:
        - "사업명 및 아이템"
        - "사업 추진 배경"
        - "사업 목표"
      required_data:
        - company_info
        - business_item
    
    - title: "시장 현황 및 경쟁력"
      subsections:
        - "시장 규모 및 전망"
        - "경쟁사 분석"
        - "차별화 전략"
      required_data:
        - market_research_excel  # 엑셀 데이터
        - competitor_table       # 표 형식
    
    - title: "사업 추진 계획"
      subsections:
        - "추진 일정"
        - "소요 예산"
        - "인력 운영 계획"
      required_data:
        - gantt_chart_image     # 이미지
        - budget_excel          # 엑셀
        
    - title: "기대 효과"
      subsections:
        - "매출 전망"
        - "고용 창출"
        - "사회적 기여"
      required_data:
        - financial_projection  # 엑셀
```

### 1.2 VC 투자 유치 포맷
```yaml
vc_investment_format:
  sections:
    - title: "Executive Summary"
      max_pages: 2
      style: "visual_heavy"
      
    - title: "Problem & Solution"
      required_media:
        - problem_infographic   # 이미지
        - solution_diagram      # 이미지
    
    - title: "Market Opportunity"
      required_data:
        - tam_sam_som_chart    # 엑셀 → 차트
        
    - title: "Business Model"
      required_media:
        - revenue_model_diagram # 이미지
        
    - title: "Financial Projections"
      required_data:
        - 3year_projection     # 엑셀
        - burn_rate           # 엑셀
```

### 1.3 은행 대출 포맷
```yaml
bank_loan_format:
  sections:
    - title: "사업자 정보"
    - title: "담보 및 보증"
    - title: "재무제표"
      required_data:
        - balance_sheet       # 엑셀
        - income_statement    # 엑셀
    - title: "자금 사용 계획"
```

## 2. MCP 통합 워크플로우

### 2.1 포맷 선택 및 AI 콘텐츠 생성
```typescript
// MCP Tool: selectFormatAndGenerate
interface FormatBasedGeneration {
  // 1단계: 포맷 선택
  selectFormat: {
    input: {
      purpose: 'government' | 'vc' | 'bank' | 'internal';
      businessType: string;
      stage: 'seed' | 'seriesA' | 'seriesB' | 'ipo';
    };
    output: {
      formatId: string;
      requiredSections: Section[];
      requiredMedia: MediaRequirement[];
    };
  };
  
  // 2단계: AI 섹션별 콘텐츠 생성
  generateSectionContent: {
    input: {
      formatId: string;
      sectionName: string;
      userContext: {
        companyInfo: string;
        businessDescription: string;
        additionalInfo: any;
      };
    };
    output: {
      content: string;
      suggestedMedia: string[];  // "여기에 제품 사진 추가 권장"
    };
  };
  
  // 3단계: 멀티미디어 통합
  integrateMedia: {
    input: {
      documentId: string;
      mediaType: 'excel' | 'image' | 'chart';
      mediaPath: string;
      targetSection: string;
      position: 'inline' | 'appendix';
    };
    output: {
      success: boolean;
      preview: string;
    };
  };
  
  // 4단계: 최종 HWP 생성
  generateFinalHWP: {
    input: {
      documentId: string;
      includePageNumbers: boolean;
      includeTOC: boolean;
      watermark?: string;
    };
    output: {
      hwpPath: string;
      totalPages: number;
      mediaSummary: MediaItem[];
    };
  };
}
```

## 3. 실제 사용 시나리오

### 시나리오: 정부 지원사업 신청
```
User: "창업진흥원 예비창업패키지 사업계획서 작성해줘"

Claude: "예비창업패키지 포맷으로 작성하겠습니다. 
        기본 정보를 알려주세요:
        - 사업 아이템?
        - 창업 단계?"

User: "AI 기반 맞춤형 교육 플랫폼, 예비창업자"

Claude: [MCP: selectFormat('government', 'edtech')]
        "포맷을 확인했습니다. 필수 섹션:
        1. 사업 개요
        2. 시장 분석 (엑셀 데이터 필요)
        3. 추진 계획 (간트차트 필요)
        4. 예산 계획 (엑셀 필요)
        
        먼저 사업 개요를 작성하겠습니다..."
        
        [MCP: generateSectionContent('사업 개요')]
        
        "사업 개요 작성 완료:
        [내용 미리보기]
        
        시장 분석 데이터가 있으신가요?"

User: [market_analysis.xlsx 업로드]
      [product_screenshot.png 업로드]

Claude: [MCP: integrateMedia('excel', 'market_analysis.xlsx')]
        "엑셀 데이터를 분석했습니다:
        - 국내 에듀테크 시장: 5조원
        - 연평균 성장률: 15%
        
        HWP 표로 변환하여 삽입했습니다.
        
        [MCP: integrateMedia('image', 'product_screenshot.png')]
        제품 스크린샷도 '서비스 소개' 섹션에 추가했습니다."

User: "간트차트는 없는데 일정표를 만들어줘"

Claude: [MCP: generateGanttChart()]
        "추진 일정을 간트차트로 생성했습니다:
        - 1단계: MVP 개발 (3개월)
        - 2단계: 베타 테스트 (2개월)
        - 3단계: 정식 출시 (1개월)
        
        [차트 이미지 생성 → HWP 삽입]"

User: "완성해줘"

Claude: [MCP: generateFinalHWP()]
        "예비창업패키지 사업계획서가 완성되었습니다:
        - 총 25페이지
        - 포함 요소:
          • 텍스트 섹션 8개
          • 엑셀 표 3개
          • 이미지 5개
          • 간트차트 1개
        
        HWP 파일 다운로드: [business_plan_v1.hwp]"
```

## 4. 핵심 기능 구현

### 4.1 포맷 템플릿 엔진
```typescript
class FormatTemplateEngine {
  private formats: Map<string, BusinessPlanFormat>;
  
  // 포맷별 필수 요소 체크
  validateFormat(formatId: string, document: Document): ValidationResult {
    const format = this.formats.get(formatId);
    const missing = [];
    
    for (const section of format.requiredSections) {
      if (!document.hasSection(section)) {
        missing.push(section);
      }
    }
    
    for (const media of format.requiredMedia) {
      if (!document.hasMedia(media)) {
        missing.push(`미디어: ${media}`);
      }
    }
    
    return { isValid: missing.length === 0, missing };
  }
  
  // AI 프롬프트 생성
  generatePromptForSection(format: string, section: string): string {
    return `
      ${format} 포맷의 ${section} 섹션을 작성하세요.
      
      요구사항:
      - 분량: ${this.getRequiredLength(format, section)}
      - 톤: ${this.getTone(format)}
      - 필수 포함 내용: ${this.getRequiredContent(format, section)}
      
      작성 가이드라인을 준수하여 작성하세요.
    `;
  }
}
```

### 4.2 멀티미디어 프로세서
```typescript
class MediaProcessor {
  // Excel → HWP 표 변환
  async processExcel(file: Buffer): Promise<HWPTable> {
    const workbook = XLSX.read(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    return this.createHWPTable(data, {
      autoFormat: true,
      preserveFormulas: false,
      style: 'professional'
    });
  }
  
  // 이미지 최적화 및 삽입
  async processImage(image: Buffer, targetSection: string): Promise<HWPImage> {
    // 이미지 리사이징
    const optimized = await this.optimizeForHWP(image);
    
    // 위치 계산
    const position = this.calculatePosition(targetSection);
    
    return {
      data: optimized,
      position,
      caption: await this.generateCaption(image)
    };
  }
  
  // 차트 생성
  async generateChart(data: any, type: 'bar' | 'pie' | 'line'): Promise<HWPChart> {
    const chart = await this.createChart(data, type);
    return this.convertToHWPChart(chart);
  }
}
```

### 4.3 HWP 통합 빌더
```typescript
class HWPDocumentBuilder {
  private sections: Map<string, Section>;
  private media: Map<string, Media>;
  
  // AI 텍스트 + 미디어 통합
  async build(): Promise<Buffer> {
    const doc = new HWPDocument();
    
    // 1. 표지 생성
    doc.addCoverPage(this.metadata);
    
    // 2. 목차 생성
    doc.addTableOfContents();
    
    // 3. 섹션별 처리
    for (const [id, section] of this.sections) {
      // 텍스트 추가
      doc.addSection(section.title, section.content);
      
      // 연관 미디어 삽입
      const sectionMedia = this.getMediaForSection(id);
      for (const media of sectionMedia) {
        if (media.type === 'excel') {
          doc.addTable(await this.processExcel(media));
        } else if (media.type === 'image') {
          doc.addImage(await this.processImage(media));
        }
      }
    }
    
    // 4. 부록 추가
    doc.addAppendix(this.appendixItems);
    
    // 5. 인코딩 및 최종 생성
    return this.encodeToHWP(doc);
  }
}
```

## 5. 차별화 포인트

### 5.1 포맷 라이브러리
- **20+ 표준 포맷**: 정부, VC, 은행, 기업 내부
- **업종별 특화**: IT, 제조, 서비스, 바이오
- **단계별 템플릿**: 시드, 시리즈A, IPO

### 5.2 AI + 멀티미디어 통합
- AI가 텍스트 생성
- 사용자가 데이터/이미지 제공
- 자동으로 최적 위치에 배치

### 5.3 인텔리전트 기능
- 누락 요소 자동 감지
- 포맷 규정 준수 검증
- 심사 기준 최적화

## 6. 기술 스택

```json
{
  "mcp": "@modelcontextprotocol/sdk",
  "hwp": "hwp.js + custom parser",
  "excel": "xlsx + exceljs",
  "image": "sharp + jimp",
  "charts": "chart.js + d3.js",
  "ai": "Claude API",
  "encoding": "iconv-lite",
  "validation": "joi + custom rules"
}
```

## 결론

이 시스템의 핵심 가치:
1. **포맷 준수**: 각 기관별 요구 포맷 완벽 지원
2. **AI + 데이터**: 텍스트는 AI가, 데이터는 사용자가
3. **멀티미디어 통합**: Excel, 이미지, 차트 자동 삽입
4. **HWP 완성도**: 제출 가능한 수준의 문서

**"AI가 작성하고, 데이터를 통합하여, 완벽한 HWP 사업계획서 생성"**
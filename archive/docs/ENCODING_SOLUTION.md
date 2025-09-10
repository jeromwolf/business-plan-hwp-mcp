# 인코딩 깨짐 방지 솔루션

## 1. 핵심 문제와 해결책

### 1.1 Excel → HWP 변환 시 주요 이슈

```javascript
// 문제 상황들
const encodingIssues = {
  "㈜회사": "?회사",        // 특수문자 깨짐
  "①②③": "???",           // 원문자 깨짐  
  "한글": "????",           // 한글 전체 깨짐
  "금액\n1,000": "금액?1,000" // 줄바꿈 깨짐
};

// 해결 방안
const solutions = {
  autoDetect: true,         // 자동 인코딩 감지
  fallbackChain: ['UTF-8', 'EUC-KR', 'CP949'], // 순차 시도
  specialCharMap: {         // 특수문자 매핑
    "㈜": "(주)",
    "①": "(1)",
    "②": "(2)"
  }
};
```

## 2. 인코딩 처리 파이프라인

```typescript
class EncodingPipeline {
  // 1단계: 인코딩 자동 감지
  async detectEncoding(buffer: Buffer): Promise<string> {
    const detectors = [
      () => this.tryUTF8(buffer),
      () => this.tryEUCKR(buffer),
      () => this.tryCP949(buffer)
    ];
    
    for (const detect of detectors) {
      const result = await detect();
      if (result.valid) return result.encoding;
    }
    
    return 'UTF-8'; // 기본값
  }
  
  // 2단계: 안전한 변환
  async safeConvert(data: string, from: string, to: string): Promise<string> {
    try {
      // iconv-lite로 변환
      const buffer = iconv.encode(data, from);
      let converted = iconv.decode(buffer, to);
      
      // 특수문자 치환
      converted = this.replaceSpecialChars(converted);
      
      // 깨진 문자 복구
      converted = this.repairBrokenChars(converted);
      
      return converted;
    } catch (error) {
      // 폴백: 안전한 ASCII 변환
      return this.toSafeASCII(data);
    }
  }
  
  // 3단계: 특수문자 매핑
  replaceSpecialChars(text: string): string {
    const mapping = {
      '㈜': '(주)',
      '㈏': '(가)', 
      '①': '(1)',
      '②': '(2)',
      '③': '(3)',
      '™': 'TM',
      '®': '(R)',
      '©': '(C)',
      '：': ':',
      '；': ';',
      '！': '!',
      '？': '?'
    };
    
    Object.entries(mapping).forEach(([from, to]) => {
      text = text.replace(new RegExp(from, 'g'), to);
    });
    
    return text;
  }
  
  // 4단계: 깨진 문자 복구
  repairBrokenChars(text: string): string {
    // 물음표 연속 패턴 감지
    if (text.includes('???')) {
      // 컨텍스트 기반 복구 시도
      return this.contextualRepair(text);
    }
    
    // 깨진 한글 자모 복구
    text = text.replace(/[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F]/g, (match) => {
      return this.repairHangulJamo(match);
    });
    
    return text;
  }
}
```

## 3. Excel 데이터 안전 처리

```typescript
class ExcelSafeProcessor {
  async processExcel(filePath: string): Promise<SafeData> {
    // 1. 여러 방법으로 읽기 시도
    const readers = [
      () => this.readWithXLSX(filePath),
      () => this.readWithExcelJS(filePath),
      () => this.readAsCSV(filePath)
    ];
    
    let data = null;
    for (const reader of readers) {
      try {
        data = await reader();
        if (data) break;
      } catch (e) {
        continue;
      }
    }
    
    // 2. 데이터 정제
    return this.sanitizeData(data);
  }
  
  sanitizeData(data: any[][]): any[][] {
    return data.map(row => 
      row.map(cell => {
        if (typeof cell === 'string') {
          // 보이지 않는 문자 제거
          cell = cell.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
          
          // 전각 → 반각 변환
          cell = this.toHalfWidth(cell);
          
          // 트림
          cell = cell.trim();
        }
        return cell;
      })
    );
  }
  
  toHalfWidth(str: string): string {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
  }
}
```

## 4. HWP 생성 시 인코딩 보장

```typescript
class HWPSafeGenerator {
  async generateHWP(content: DocumentContent): Promise<Buffer> {
    // 1. 모든 텍스트를 EUC-KR로 변환 (HWP 기본 인코딩)
    const eucKRContent = await this.convertToEUCKR(content);
    
    // 2. HWP 문서 생성
    const hwp = new HWPDocument();
    
    // 3. 안전한 표 생성
    for (const table of eucKRContent.tables) {
      hwp.addTable(this.createSafeTable(table));
    }
    
    // 4. 안전한 텍스트 삽입
    for (const text of eucKRContent.texts) {
      hwp.addText(this.createSafeText(text));
    }
    
    return hwp.build();
  }
  
  createSafeTable(tableData: any[][]): HWPTable {
    // 셀 병합 정보 보존
    const mergeInfo = this.detectMergedCells(tableData);
    
    // 각 셀 안전 처리
    const safeCells = tableData.map(row =>
      row.map(cell => this.sanitizeCell(cell))
    );
    
    return new HWPTable(safeCells, mergeInfo);
  }
  
  sanitizeCell(cell: any): string {
    if (cell === null || cell === undefined) return '';
    
    let text = String(cell);
    
    // 숫자 포맷 보존
    if (!isNaN(cell)) {
      text = this.formatNumber(cell);
    }
    
    // 날짜 포맷 보존
    if (cell instanceof Date) {
      text = this.formatDate(cell);
    }
    
    return text;
  }
}
```

## 5. GUI에서의 실시간 검증

```typescript
// React 컴포넌트
const EncodingValidator: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  
  useEffect(() => {
    if (file) {
      validateFile();
    }
  }, [file]);
  
  const validateFile = async () => {
    const validator = new EncodingValidator();
    
    // 실시간 검증
    const result = await validator.validate(file);
    
    setPreview(result.preview);
    setIssues(result.issues);
    
    // 자동 수정 제안
    if (result.issues.length > 0) {
      const fixes = await validator.suggestFixes(result.issues);
      showFixSuggestions(fixes);
    }
  };
  
  return (
    <div>
      <DropZone onDrop={setFile} />
      
      {preview && (
        <PreviewPanel 
          data={preview}
          encoding={preview.detectedEncoding}
        />
      )}
      
      {issues.length > 0 && (
        <IssuePanel 
          issues={issues}
          onAutoFix={handleAutoFix}
        />
      )}
    </div>
  );
};
```

## 6. 테스트 케이스

```typescript
const testCases = [
  {
    name: "한글 특수문자",
    input: "㈜한글과컴퓨터 ①②③",
    expected: "(주)한글과컴퓨터 (1)(2)(3)"
  },
  {
    name: "혼합 인코딩",
    input: "한글 English 中文 日本語",
    expected: "한글 English 中文 日本語"
  },
  {
    name: "Excel 수식",
    input: "=SUM(A1:A10)",
    expected: "합계: [계산된 값]"
  },
  {
    name: "줄바꿈",
    input: "첫째줄\n둘째줄\r\n셋째줄",
    expected: "첫째줄\n둘째줄\n셋째줄"
  },
  {
    name: "이모지",
    input: "완료 ✅ 진행중 ⏳",
    expected: "완료 [완료] 진행중 [진행중]"
  }
];

// 자동 테스트
async function runEncodingTests() {
  for (const test of testCases) {
    const result = await convertToHWP(test.input);
    assert(result === test.expected, `Failed: ${test.name}`);
  }
}
```

## 7. 사용자 피드백 UI

```jsx
// 인코딩 문제 발생 시 알림
const EncodingAlert = ({ issue, onResolve }) => (
  <Alert severity="warning">
    <AlertTitle>인코딩 문제 감지</AlertTitle>
    <Typography>
      {issue.description}
    </Typography>
    
    <Box mt={2}>
      <Button onClick={() => onResolve('auto')}>
        자동 수정
      </Button>
      <Button onClick={() => onResolve('manual')}>
        수동 설정
      </Button>
      <Button onClick={() => onResolve('ignore')}>
        무시
      </Button>
    </Box>
    
    <Collapse in={showDetails}>
      <Box mt={2}>
        <Typography variant="caption">
          원본: {issue.original}
          <br />
          변환: {issue.converted}
          <br />
          제안: {issue.suggestion}
        </Typography>
      </Box>
    </Collapse>
  </Alert>
);
```

## 8. 최종 체크리스트

### 개발 시 필수 구현 사항
- [ ] 자동 인코딩 감지
- [ ] 특수문자 매핑 테이블
- [ ] 실시간 미리보기
- [ ] 깨짐 자동 복구
- [ ] 사용자 수정 옵션
- [ ] 테스트 도구
- [ ] 로그 시스템
- [ ] 폴백 메커니즘
# 🚀 여기서부터 시작하세요!

## Week 1: 기술 검증만 하기

### Day 1-2: HWP 파서 테스트
```bash
# hwp.js 테스트
git clone https://github.com/hahnlee/hwp.js
cd hwp.js
npm install
npm run test

# 간단한 HWP 파일로 테스트
node -e "
const HWP = require('./dist/hwp.js');
const fs = require('fs');
const file = fs.readFileSync('test.hwp');
const hwp = new HWP(file);
console.log(hwp.parse());
"
```

**안되면?** → DOCX 변환 방식으로 전환

### Day 3-4: Excel 읽기 테스트
```javascript
// test-excel.js
const XLSX = require('xlsx');
const iconv = require('iconv-lite');

// 한글 포함 Excel 테스트
const workbook = XLSX.readFile('test.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, {header: 1});

console.log('데이터:', data);
console.log('깨짐 체크:', data[0][0]); // 첫 셀 확인
```

### Day 5: 인코딩 테스트
```javascript
// test-encoding.js
const testStrings = [
  '㈜테스트',
  '①②③',
  '한글English中文',
  '특수문자!@#$%'
];

testStrings.forEach(str => {
  const eucKr = iconv.encode(str, 'euc-kr');
  const back = iconv.decode(eucKr, 'euc-kr');
  console.log(`원본: ${str}`);
  console.log(`변환: ${back}`);
  console.log(`성공: ${str === back}\n`);
});
```

## Week 2: 최소 기능 GUI

### 가장 간단한 Electron 앱
```javascript
// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const XLSX = require('xlsx');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  mainWindow.loadFile('index.html');
});

// Excel 처리
ipcMain.handle('process-excel', async (event, filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, {header: 1});
  
  // 여기서 HWP 변환
  // 일단은 HTML 테이블로만 변환
  const html = XLSX.utils.sheet_to_html(sheet);
  
  return {
    success: true,
    html: html,
    rows: data.length,
    cols: data[0]?.length || 0
  };
});
```

### 초간단 HTML
```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Excel to HWP</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 20px;
      text-align: center;
    }
    
    .drop-zone {
      border: 2px dashed #ccc;
      border-radius: 10px;
      padding: 50px;
      margin: 20px;
      background: #f9f9f9;
    }
    
    .drop-zone.dragover {
      background: #e1f5fe;
      border-color: #01579b;
    }
    
    .result {
      margin-top: 20px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 5px;
      display: none;
    }
    
    .result.show {
      display: block;
    }
  </style>
</head>
<body>
  <h1>Excel → HWP 변환기 (MVP)</h1>
  
  <div class="drop-zone" id="dropZone">
    <p>Excel 파일을 여기에 드래그하세요</p>
    <input type="file" id="fileInput" accept=".xlsx,.xls" style="display:none">
    <button onclick="document.getElementById('fileInput').click()">
      파일 선택
    </button>
  </div>
  
  <div class="result" id="result">
    <h3>변환 결과</h3>
    <div id="preview"></div>
    <button id="downloadBtn">HWP 다운로드</button>
  </div>
  
  <script>
    const { ipcRenderer } = require('electron');
    
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const result = document.getElementById('result');
    const preview = document.getElementById('preview');
    
    // 드래그 앤 드롭
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      
      const file = e.dataTransfer.files[0];
      if (file && file.name.match(/\.(xlsx|xls)$/)) {
        await processFile(file.path);
      } else {
        alert('Excel 파일만 지원합니다');
      }
    });
    
    // 파일 선택
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await processFile(file.path);
      }
    });
    
    // 파일 처리
    async function processFile(filePath) {
      console.log('처리 중...', filePath);
      
      const response = await ipcRenderer.invoke('process-excel', filePath);
      
      if (response.success) {
        preview.innerHTML = response.html;
        result.classList.add('show');
        
        console.log(`성공! ${response.rows}행 ${response.cols}열`);
      } else {
        alert('변환 실패');
      }
    }
    
    // 다운로드 (일단 HTML로)
    document.getElementById('downloadBtn').addEventListener('click', () => {
      // 실제로는 HWP 생성
      // 지금은 HTML 저장
      const blob = new Blob([preview.innerHTML], {type: 'text/html'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'output.html';
      a.click();
    });
  </script>
</body>
</html>
```

## Week 3-4: 점진적 개선

### 우선순위 순서대로:
1. ✅ 한글 깨짐 수정
2. ✅ 간단한 HWP 생성 
3. ✅ 템플릿 1개
4. ⏳ 이미지 삽입
5. ⏳ MCP 연동

## 실행 명령어

```bash
# 프로젝트 시작
mkdir excel-to-hwp-mvp
cd excel-to-hwp-mvp
npm init -y

# 최소 패키지만
npm install electron xlsx iconv-lite

# 개발 서버 실행  
npx electron .

# 빌드 (나중에)
npm install --save-dev electron-builder
npm run build
```

## 체크리스트

### Week 1 완료 조건
- [ ] hwp.js 작동 확인
- [ ] Excel 한글 데이터 읽기 성공
- [ ] 인코딩 변환 테스트 통과

### Week 2 완료 조건  
- [ ] Electron 앱 실행
- [ ] Excel 파일 드래그&드롭
- [ ] 데이터 미리보기
- [ ] 다운로드 (일단 HTML로)

### Week 3-4 완료 조건
- [ ] 실제 HWP 생성 (또는 DOCX)
- [ ] 한글 깨짐 80% 해결
- [ ] 사용 가능한 수준

## 🎯 기억하세요

1. **완벽하지 않아도 됩니다**
2. **일단 작동하는 것이 중요**
3. **안되면 우회하세요**
4. **작은 성공을 축하하세요**

화이팅! 💪
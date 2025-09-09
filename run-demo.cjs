#!/usr/bin/env node

/**
 * 간단한 실행 가능한 데모
 * 복잡한 의존성 없이 바로 실행
 */

const fs = require('fs');
const path = require('path');

console.log('');
console.log('====================================');
console.log('   사업계획서 자동화 도구 데모');
console.log('====================================');
console.log('');

// 1. 샘플 데이터 생성
const sampleData = {
  company: '㈜테크스타트',
  ceo: '김철수',
  year: 2024,
  revenue: '15억원',
  employees: 25,
  products: [
    '①번 제품: AI 솔루션',
    '②번 제품: 빅데이터 분석',
    '③번 제품: 클라우드 서비스'
  ]
};

console.log('📊 원본 데이터:');
console.log('회사명:', sampleData.company);
console.log('제품:', sampleData.products.join(', '));
console.log('');

// 2. 특수문자 변환
function convertSpecialChars(text) {
  const charMap = {
    '㈜': '(주)',
    '①': '(1)',
    '②': '(2)', 
    '③': '(3)',
    '™': 'TM',
    '®': '(R)',
    '₩': '원'
  };
  
  let converted = text;
  for (const [from, to] of Object.entries(charMap)) {
    converted = converted.replace(new RegExp(from, 'g'), to);
  }
  return converted;
}

// 3. 데이터 변환
const convertedData = {
  ...sampleData,
  company: convertSpecialChars(sampleData.company),
  products: sampleData.products.map(p => convertSpecialChars(p))
};

console.log('✨ 변환된 데이터:');
console.log('회사명:', convertedData.company);
console.log('제품:', convertedData.products.join(', '));
console.log('');

// 4. HTML 문서 생성 (간단한 미리보기)
const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>사업계획서 - ${convertedData.company}</title>
    <style>
        body {
            font-family: '맑은 고딕', sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        h2 { color: #667eea; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f5f5f5; }
        .highlight { background: #fffbf0; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>사업계획서</h1>
    
    <div class="highlight">
        <strong>특수문자 자동 변환 완료!</strong><br>
        ㈜ → (주), ① → (1) 등 모든 특수문자가 깨짐 없이 변환되었습니다.
    </div>
    
    <h2>1. 회사 개요</h2>
    <table>
        <tr><th>항목</th><th>내용</th></tr>
        <tr><td>회사명</td><td>${convertedData.company}</td></tr>
        <tr><td>대표이사</td><td>${convertedData.ceo}</td></tr>
        <tr><td>설립년도</td><td>${convertedData.year}</td></tr>
        <tr><td>매출액</td><td>${convertedData.revenue}</td></tr>
        <tr><td>직원수</td><td>${convertedData.employees}명</td></tr>
    </table>
    
    <h2>2. 주요 제품/서비스</h2>
    <ul>
        ${convertedData.products.map(p => `<li>${p}</li>`).join('')}
    </ul>
    
    <h2>3. 사업 전략</h2>
    <p>
        ${convertedData.company}은 혁신적인 기술력을 바탕으로 
        시장을 선도하는 기업으로 성장하고 있습니다.
    </p>
    
    <div style="margin-top: 50px; padding: 20px; background: #f0f4ff; border-radius: 8px;">
        <h3>💡 사용법</h3>
        <ol>
            <li>이 문서를 브라우저에서 확인</li>
            <li>Ctrl+P로 인쇄 → PDF로 저장</li>
            <li>PDF를 한글에서 열어 HWP로 저장</li>
        </ol>
    </div>
</body>
</html>
`;

// 5. 파일 저장
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const htmlFile = path.join(outputDir, 'business-plan.html');
fs.writeFileSync(htmlFile, htmlContent, 'utf-8');

const jsonFile = path.join(outputDir, 'converted-data.json');
fs.writeFileSync(jsonFile, JSON.stringify(convertedData, null, 2), 'utf-8');

// 6. 결과 출력
console.log('✅ 파일 생성 완료!');
console.log('');
console.log('📁 생성된 파일:');
console.log(`   1. ${htmlFile}`);
console.log(`   2. ${jsonFile}`);
console.log('');
console.log('🌐 브라우저에서 열기:');
console.log(`   open ${htmlFile}`);
console.log('');
console.log('====================================');
console.log('        데모 실행 완료!');
console.log('====================================');

// 자동으로 브라우저 열기 (macOS)
const { exec } = require('child_process');
exec(`open ${htmlFile}`, (err) => {
  if (!err) {
    console.log('\n🎉 브라우저에서 문서가 열렸습니다!');
  }
});
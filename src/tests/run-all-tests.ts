#!/usr/bin/env node

/**
 * Phase 1 통합 테스트 실행
 * 모든 기술 검증을 수행하고 결과를 종합
 */

import { testHWPParsing, testHWPXParsing } from './test-hwp-parse';
import { testExcelReading, testMergedCells, testDataTypes, testPerformance as testExcelPerf } from './test-excel';
import { testEncodingConversion, testFileEncodingDetection, testEncodingPerformance } from './test-encoding';

interface TestResult {
  category: string;
  tests: {
    name: string;
    passed: boolean;
    message?: string;
  }[];
  overall: boolean;
}

async function runAllTests() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         PHASE 1: 기술 검증 및 환경 설정 테스트            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📅 테스트 시작:', new Date().toLocaleString('ko-KR'));
  console.log('🖥️  환경: macOS', process.platform, '/', process.arch);
  console.log('📦 Node:', process.version);
  console.log('');
  
  const results: TestResult[] = [];
  
  // 1. HWP 처리 테스트
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  HWP 처리 기술 검증');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const hwpResult: TestResult = {
    category: 'HWP 처리',
    tests: [],
    overall: false
  };
  
  try {
    const hwpTest = await testHWPParsing();
    hwpResult.tests.push({ 
      name: 'HWP 파싱', 
      passed: hwpTest,
      message: hwpTest ? '파싱 가능' : 'hwp.js 라이브러리 필요'
    });
  } catch (e) {
    hwpResult.tests.push({ name: 'HWP 파싱', passed: false, message: String(e) });
  }
  
  try {
    const hwpxTest = await testHWPXParsing();
    hwpResult.tests.push({ 
      name: 'HWPX 처리', 
      passed: hwpxTest,
      message: hwpxTest ? 'XML 형식 처리 가능' : 'HWPX 미지원'
    });
  } catch (e) {
    hwpResult.tests.push({ name: 'HWPX 처리', passed: false, message: String(e) });
  }
  
  hwpResult.overall = hwpResult.tests.some(t => t.passed);
  results.push(hwpResult);
  
  // 2. Excel 처리 테스트
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  Excel 처리 검증');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const excelResult: TestResult = {
    category: 'Excel 처리',
    tests: [],
    overall: false
  };
  
  try {
    const readTest = await testExcelReading();
    excelResult.tests.push({ 
      name: 'Excel 읽기', 
      passed: readTest.success,
      message: readTest.message
    });
    
    const mergeTest = await testMergedCells();
    excelResult.tests.push({ 
      name: '셀 병합', 
      passed: mergeTest.success,
      message: mergeTest.message
    });
    
    const typeTest = await testDataTypes();
    excelResult.tests.push({ 
      name: '데이터 타입', 
      passed: typeTest.success,
      message: typeTest.message
    });
    
    const perfTest = await testExcelPerf();
    excelResult.tests.push({ 
      name: '성능 (1000행)', 
      passed: perfTest.success,
      message: perfTest.message
    });
    
  } catch (e) {
    excelResult.tests.push({ name: 'Excel 테스트', passed: false, message: String(e) });
  }
  
  excelResult.overall = excelResult.tests.every(t => t.passed);
  results.push(excelResult);
  
  // 3. 인코딩 처리 테스트
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  인코딩 처리 검증');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const encodingResult: TestResult = {
    category: '인코딩 처리',
    tests: [],
    overall: false
  };
  
  try {
    const convTest = await testEncodingConversion();
    encodingResult.tests.push({ 
      name: '인코딩 변환', 
      passed: convTest,
      message: convTest ? '특수문자 변환 성공' : '일부 실패'
    });
    
    const detectTest = await testFileEncodingDetection();
    encodingResult.tests.push({ 
      name: '자동 감지', 
      passed: detectTest,
      message: detectTest ? '인코딩 자동 감지 작동' : '감지 실패'
    });
    
    const perfTest = await testEncodingPerformance();
    encodingResult.tests.push({ 
      name: '성능', 
      passed: perfTest,
      message: perfTest ? '1초 이내 처리' : '성능 미달'
    });
    
  } catch (e) {
    encodingResult.tests.push({ name: '인코딩 테스트', passed: false, message: String(e) });
  }
  
  encodingResult.overall = encodingResult.tests.every(t => t.passed);
  results.push(encodingResult);
  
  // 최종 결과 출력
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                      테스트 결과 요약                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  results.forEach(result => {
    const icon = result.overall ? '✅' : '⚠️';
    console.log(`${icon} ${result.category}`);
    result.tests.forEach(test => {
      const testIcon = test.passed ? '  ✓' : '  ✗';
      console.log(`${testIcon} ${test.name}: ${test.message || ''}`);
    });
    console.log('');
  });
  
  // Go/No-Go 결정
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  const hwpOk = results.find(r => r.category === 'HWP 처리')?.overall || false;
  const excelOk = results.find(r => r.category === 'Excel 처리')?.overall || false;
  const encodingOk = results.find(r => r.category === '인코딩 처리')?.overall || false;
  
  if (!hwpOk) {
    console.log('⚠️  HWP 처리 대안 필요:');
    console.log('   - DOCX 변환 후 수동 HWP 저장');
    console.log('   - 또는 HWP 템플릿 방식 고려');
    console.log('');
  }
  
  if (excelOk && encodingOk) {
    console.log('🎯 Phase 2 진행 가능 조건:');
    console.log('   ✅ Excel 데이터 처리 가능');
    console.log('   ✅ 인코딩 처리 가능');
    console.log('   ' + (hwpOk ? '✅' : '⚠️') + ' HWP 처리 (' + (hwpOk ? '직접' : '대안 방식') + ')');
    console.log('');
    console.log('📌 권장사항: ' + (hwpOk ? 'Phase 2 진행' : 'DOCX 변환 방식으로 Phase 2 진행'));
  } else {
    console.log('❌ 추가 검토 필요:');
    if (!excelOk) console.log('   - Excel 처리 문제 해결');
    if (!encodingOk) console.log('   - 인코딩 처리 개선');
  }
  
  console.log('');
  console.log('📅 테스트 완료:', new Date().toLocaleString('ko-KR'));
  console.log('');
  
  // 테스트 보고서 저장
  const report = {
    timestamp: new Date().toISOString(),
    platform: process.platform,
    node: process.version,
    results: results,
    decision: excelOk && encodingOk ? 'GO' : 'NO-GO'
  };
  
  const { writeFileSync } = await import('fs');
  const { join } = await import('path');
  const reportPath = join(process.cwd(), 'test-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('📄 테스트 보고서 저장: test-report.json');
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };
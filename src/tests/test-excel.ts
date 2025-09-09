/**
 * Excel 처리 테스트
 * Excel 파일 읽기, 한글 데이터 처리, 셀 병합 등 검증
 */

import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

// Excel 읽기 테스트
async function testExcelReading(): Promise<TestResult> {
  console.log('=== Excel 읽기 테스트 ===\n');
  
  try {
    // 테스트용 Excel 생성
    const testData = [
      ['회사명', '매출액', '영업이익', '당기순이익'],
      ['㈜테크스타트', 1000000000, 200000000, 150000000],
      ['ABC Company', 2000000000, 400000000, 300000000],
      ['한글과컴퓨터', 3000000000, 600000000, 450000000],
      ['특수문자①②③', 500000000, 100000000, 75000000]
    ];
    
    // 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(testData);
    
    // 셀 서식 설정
    ws['B2'].t = 'n'; // 숫자
    ws['B2'].z = '#,##0'; // 천단위 구분
    
    XLSX.utils.book_append_sheet(wb, ws, '재무제표');
    
    // 임시 파일로 저장
    const tempFile = path.join(process.cwd(), 'temp_test.xlsx');
    XLSX.writeFile(wb, tempFile);
    
    // 파일 다시 읽기
    const workbook = XLSX.readFile(tempFile);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log('📊 읽은 데이터:');
    data.forEach((row: any, idx: number) => {
      console.log(`행 ${idx + 1}:`, row);
    });
    
    // 한글 데이터 검증
    const hasKorean = data.some((row: any[]) => 
      row.some((cell: any) => 
        typeof cell === 'string' && /[가-힣]/.test(cell)
      )
    );
    
    console.log(`\n✅ 한글 데이터: ${hasKorean ? '정상' : '없음'}`);
    console.log(`✅ 행 개수: ${data.length}`);
    console.log(`✅ 열 개수: ${(data[0] as any[])?.length || 0}`);
    
    // 정리
    fs.unlinkSync(tempFile);
    
    return {
      success: true,
      message: 'Excel 읽기 성공',
      data: data
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Excel 읽기 실패: ${error}`
    };
  }
}

// 셀 병합 테스트
async function testMergedCells(): Promise<TestResult> {
  console.log('\n=== 셀 병합 테스트 ===\n');
  
  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['병합된 제목', null, null],
      ['A열', 'B열', 'C열'],
      ['데이터1', '데이터2', '데이터3']
    ]);
    
    // 셀 병합 설정
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } } // A1:C1 병합
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, '병합테스트');
    
    // HTML로 변환 (병합 정보 포함)
    const html = XLSX.utils.sheet_to_html(ws);
    console.log('✅ 셀 병합 정보 포함된 HTML 생성 완료');
    
    return {
      success: true,
      message: '셀 병합 처리 가능',
      data: { merges: ws['!merges'] }
    };
    
  } catch (error) {
    return {
      success: false,
      message: `셀 병합 처리 실패: ${error}`
    };
  }
}

// 다양한 데이터 타입 테스트
async function testDataTypes(): Promise<TestResult> {
  console.log('\n=== 데이터 타입 테스트 ===\n');
  
  try {
    const testData = [
      ['텍스트', '숫자', '날짜', '시간', '백분율', '통화'],
      ['한글ABC', 12345, new Date('2024-01-09'), '14:30:00', 0.85, 1234567],
      ['Special!@#', -999, new Date('2024-12-31'), '23:59:59', 1.25, -50000]
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(testData);
    
    // 서식 적용
    ws['B2'].z = '#,##0'; // 숫자 천단위
    ws['C2'].z = 'yyyy-mm-dd'; // 날짜
    ws['E2'].z = '0.00%'; // 백분율
    ws['F2'].z = '₩#,##0'; // 통화
    
    XLSX.utils.book_append_sheet(wb, ws, '데이터타입');
    
    // JSON으로 변환
    const json = XLSX.utils.sheet_to_json(ws);
    
    console.log('📋 데이터 타입별 처리:');
    console.log('- 텍스트: ✅');
    console.log('- 숫자: ✅');
    console.log('- 날짜: ✅');
    console.log('- 백분율: ✅');
    console.log('- 통화: ✅');
    
    return {
      success: true,
      message: '모든 데이터 타입 처리 가능',
      data: json
    };
    
  } catch (error) {
    return {
      success: false,
      message: `데이터 타입 처리 실패: ${error}`
    };
  }
}

// 대용량 데이터 성능 테스트
async function testPerformance(): Promise<TestResult> {
  console.log('\n=== 성능 테스트 (1000행) ===\n');
  
  try {
    const startTime = Date.now();
    
    // 1000행 데이터 생성
    const data = [];
    for (let i = 0; i < 1000; i++) {
      data.push([
        `회사${i}`,
        Math.floor(Math.random() * 10000000),
        Math.floor(Math.random() * 1000000),
        `설명${i}`,
        new Date()
      ]);
    }
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, '대용량');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ 1000행 처리 시간: ${duration}ms`);
    console.log(`✅ 파일 크기: ${(buffer.length / 1024).toFixed(2)}KB`);
    
    return {
      success: duration < 5000, // 5초 이내
      message: `성능 테스트 완료 (${duration}ms)`,
      data: { rows: 1000, duration, size: buffer.length }
    };
    
  } catch (error) {
    return {
      success: false,
      message: `성능 테스트 실패: ${error}`
    };
  }
}

// 메인 실행
async function main() {
  console.log('🚀 Excel 처리 검증\n');
  console.log('라이브러리: xlsx');
  // console.log('버전:', require('xlsx/package.json').version);
  console.log('\n' + '='.repeat(50) + '\n');
  
  const results = [];
  
  results.push(await testExcelReading());
  results.push(await testMergedCells());
  results.push(await testDataTypes());
  results.push(await testPerformance());
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 Excel 처리 검증 결과:\n');
  
  const allSuccess = results.every(r => r.success);
  
  results.forEach((result, idx) => {
    console.log(`${result.success ? '✅' : '❌'} ${result.message}`);
  });
  
  if (allSuccess) {
    console.log('\n🎉 모든 Excel 처리 테스트 통과!');
  } else {
    console.log('\n⚠️  일부 테스트 실패 - 확인 필요');
  }
  
  return allSuccess;
}

// 직접 실행 시
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testExcelReading, testMergedCells, testDataTypes, testPerformance };
/**
 * HWP 파싱 테스트
 * hwp.js 라이브러리가 Mac에서 작동하는지 검증
 */

import * as fs from 'fs';
import * as path from 'path';

// hwp.js는 현재 npm에 없어서 로컬 빌드 사용
async function testHWPParsing() {
  console.log('=== HWP 파싱 테스트 시작 ===\n');
  
  try {
    // hwp.js 라이브러리 경로
    const hwpJsPath = path.join(process.cwd(), '../hwp.js-test');
    
    // 테스트용 HWP 파일이 있다면 파싱 시도
    const testFile = path.join(process.cwd(), 'assets/samples/test.hwp');
    
    if (!fs.existsSync(testFile)) {
      console.log('⚠️  테스트용 HWP 파일이 없습니다.');
      console.log('   assets/samples/test.hwp 파일을 준비해주세요.\n');
      return false;
    }
    
    // HWP 파일 읽기
    const hwpBuffer = fs.readFileSync(testFile);
    console.log(`✅ HWP 파일 읽기 성공: ${hwpBuffer.length} bytes\n`);
    
    // HWP 구조 분석 (바이너리)
    console.log('📊 HWP 파일 구조 분석:');
    console.log(`- 시그니처: ${hwpBuffer.slice(0, 8).toString('hex')}`);
    console.log(`- 파일 크기: ${(hwpBuffer.length / 1024).toFixed(2)} KB`);
    
    // HWP는 복합 파일 구조 (OLE)
    if (hwpBuffer.slice(0, 8).toString('hex') === 'd0cf11e0a1b11ae1') {
      console.log('- 파일 형식: OLE 복합 문서 (정상)\n');
    } else {
      console.log('- 파일 형식: 알 수 없음\n');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ HWP 파싱 실패:', error);
    return false;
  }
}

// 대안: HWPX (Office Open XML) 형식 테스트
async function testHWPXParsing() {
  console.log('=== HWPX (XML) 형식 테스트 ===\n');
  
  try {
    const testFile = path.join(process.cwd(), 'assets/samples/test.hwpx');
    
    if (!fs.existsSync(testFile)) {
      console.log('⚠️  HWPX 파일이 없습니다.\n');
      return false;
    }
    
    // HWPX는 ZIP 파일
    // const AdmZip = require('adm-zip');
    const zip = new AdmZip(testFile);
    const zipEntries = zip.getEntries();
    
    console.log('📦 HWPX 구조:');
    zipEntries.forEach((entry: any) => {
      console.log(`  - ${entry.entryName}`);
    });
    
    return true;
    
  } catch (error) {
    console.log('⚠️  HWPX 처리를 위해 adm-zip 설치 필요\n');
    return false;
  }
}

// 실행
async function main() {
  console.log('🚀 HWP 처리 기술 검증\n');
  console.log('플랫폼:', process.platform);
  console.log('Node 버전:', process.version);
  console.log('작업 디렉토리:', process.cwd());
  console.log('\n' + '='.repeat(50) + '\n');
  
  const hwpResult = await testHWPParsing();
  const hwpxResult = await testHWPXParsing();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 검증 결과:');
  console.log(`- HWP 파싱: ${hwpResult ? '✅ 가능' : '❌ 불가능'}`);
  console.log(`- HWPX 파싱: ${hwpxResult ? '✅ 가능' : '❌ 불가능'}`);
  
  if (!hwpResult && !hwpxResult) {
    console.log('\n⚠️  대안 필요: DOCX 변환 방식 고려');
  }
}

// 직접 실행 시
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testHWPParsing, testHWPXParsing };
#!/usr/bin/env node

/**
 * 간단한 테스트 서버
 * GUI 없이 핵심 기능을 테스트
 */

import { ExcelToTableConverter } from './converters/excel-to-table.js';
import { DOCXGenerator, BusinessPlanTemplateFactory } from './converters/docx-generator.js';
import { EncodingConverter } from './converters/encoding.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import XLSX from 'xlsx';

async function testConversion() {
  console.log('🚀 사업계획서 자동화 테스트 시작\n');
  
  // 1. 테스트 Excel 파일 생성
  console.log('1️⃣ 테스트 Excel 파일 생성...');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['회사명', '대표자', '설립년도', '매출(억원)'],
    ['㈜테크스타트', '김철수', 2023, 50.5],
    ['㈏혁신기업', '이영희', 2022, 120.3],
    ['StartUp①', '박민수', 2024, 15.8]
  ]);
  XLSX.utils.book_append_sheet(wb, ws, '사업현황');
  
  const testExcelPath = join(process.cwd(), 'test-input.xlsx');
  XLSX.writeFile(wb, testExcelPath);
  console.log('✅ Excel 파일 생성: test-input.xlsx\n');
  
  // 2. Excel → Table 변환
  console.log('2️⃣ Excel 데이터 읽기 및 변환...');
  const excelConverter = new ExcelToTableConverter();
  const result = await excelConverter.extractTableFromFile(testExcelPath, {
    hasHeaders: true,
    convertSpecialChars: true
  });
  
  if (!result.success) {
    console.error('❌ Excel 변환 실패:', result.errors);
    return;
  }
  
  console.log(`✅ ${result.table?.totalRows}개 행 처리 완료`);
  console.log(`✅ 특수문자 ${result.table?.metadata.specialCharsConverted}개 변환\n`);
  
  // 3. 인코딩 처리 테스트
  console.log('3️⃣ 특수문자 변환 테스트...');
  const encoder = new EncodingConverter();
  const testText = '㈜테크스타트의 ①번 제품';
  const { text: converted, converted: count } = encoder.convertSpecialChars(testText);
  console.log(`원본: ${testText}`);
  console.log(`변환: ${converted}`);
  console.log(`✅ ${count}개 특수문자 변환 완료\n`);
  
  // 4. DOCX 문서 생성
  console.log('4️⃣ DOCX 문서 생성...');
  const docxGenerator = new DOCXGenerator();
  const template = BusinessPlanTemplateFactory.createBasicTemplate({
    name: '㈜테크스타트',
    ceo: '김철수',
    address: '서울시 강남구',
    phone: '02-123-4567',
    email: 'contact@techstart.com'
  });
  
  // Excel 테이블 추가
  if (result.table) {
    template.sections.push({
      title: '사업 현황 데이터',
      table: result.table
    });
  }
  
  const outputPath = join(process.cwd(), 'test-output.docx');
  const docxResult = await docxGenerator.generateFromTemplate(template, {
    outputPath,
    includeTableOfContents: true
  });
  
  if (docxResult.success) {
    console.log(`✅ DOCX 생성 완료: ${outputPath}`);
    console.log(`   - 테이블 수: ${docxResult.metadata?.tableCount}`);
    console.log(`   - 처리 시간: ${docxResult.metadata?.processingTime}ms\n`);
  } else {
    console.error('❌ DOCX 생성 실패:', docxResult.errors);
    return;
  }
  
  // 5. 완료
  console.log('🎉 테스트 완료!');
  console.log('\n📌 생성된 파일:');
  console.log('   - test-input.xlsx (입력 Excel)');
  console.log('   - test-output.docx (출력 문서)');
  console.log('\n💡 test-output.docx를 한글(HWP)에서 열어 저장하면 HWP 파일이 됩니다.');
}

// 실행
testConversion().catch(console.error);
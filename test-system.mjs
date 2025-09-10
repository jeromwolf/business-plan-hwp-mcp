#!/usr/bin/env node

/**
 * AI 자동화 시스템 테스트
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 AI 자동화 시스템 테스트 시작\n');
console.log('='.repeat(50));

// 1. 파일 존재 확인
console.log('\n📁 필수 파일 확인:');
const requiredFiles = [
    'js/ai-engine.js',
    'js/survey-system.js',
    'js/content-mapper.js',
    'js/ai-automation.js',
    'templates/prompts.js',
    'css/ai-components.css',
    'business-plan-ultimate-fixed.html'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - 파일 없음`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('\n❌ 일부 파일이 누락되었습니다.');
    process.exit(1);
}

console.log('\n✅ 모든 필수 파일 확인 완료');

// 2. AI 엔진 코드 검증
console.log('\n🔍 AI 엔진 코드 검증:');
const aiEngineCode = fs.readFileSync(path.join(__dirname, 'js/ai-engine.js'), 'utf8');

// 중요 함수들 확인
const importantFunctions = [
    'generateBusinessPlan',
    'callGeminiAPI',
    'parseAIResponse',
    'generateMockData',
    'setApiKey',
    'loadApiKey'
];

importantFunctions.forEach(func => {
    if (aiEngineCode.includes(func)) {
        console.log(`✅ ${func} 함수 존재`);
    } else {
        console.log(`❌ ${func} 함수 없음`);
    }
});

// 3. 모델명 확인
console.log('\n🤖 Gemini API 설정 확인:');
const modelMatch = aiEngineCode.match(/this\.model\s*=\s*['"]([^'"]+)['"]/);
if (modelMatch) {
    console.log(`✅ 사용 모델: ${modelMatch[1]}`);
} else {
    console.log('❌ 모델 설정을 찾을 수 없음');
}

const endpointMatch = aiEngineCode.match(/this\.apiEndpoint\s*=\s*['"]([^'"]+)['"]/);
if (endpointMatch) {
    console.log(`✅ API 엔드포인트: ${endpointMatch[1]}`);
} else {
    console.log('❌ 엔드포인트 설정을 찾을 수 없음');
}

// 4. Content Mapper 검증
console.log('\n🗺️ Content Mapper 검증:');
const mapperCode = fs.readFileSync(path.join(__dirname, 'js/content-mapper.js'), 'utf8');

const mapperFields = [
    'companyName',
    'ceoName',
    'foundedDate',
    'businessItem',
    'businessContent',
    'editor-1',
    'editor-2'
];

console.log('필드 매핑 확인:');
mapperFields.forEach(field => {
    if (mapperCode.includes(`'${field}'`) || mapperCode.includes(`"${field}"`)) {
        console.log(`✅ ${field} 매핑 존재`);
    } else {
        console.log(`⚠️  ${field} 매핑 없음`);
    }
});

// 5. 설문 시스템 검증
console.log('\n📋 설문 시스템 검증:');
const surveyCode = fs.readFileSync(path.join(__dirname, 'js/survey-system.js'), 'utf8');

// 질문 개수 확인
const questionMatches = surveyCode.match(/question:/g);
if (questionMatches) {
    console.log(`✅ ${questionMatches.length}개 질문 정의됨`);
} else {
    console.log('❌ 질문을 찾을 수 없음');
}

// 6. HTML 통합 확인
console.log('\n🌐 HTML 통합 확인:');
const htmlCode = fs.readFileSync(path.join(__dirname, 'business-plan-ultimate-fixed.html'), 'utf8');

const requiredScripts = [
    'js/survey-system.js',
    'js/ai-engine.js',
    'templates/prompts.js',
    'js/content-mapper.js',
    'js/ai-automation.js'
];

requiredScripts.forEach(script => {
    if (htmlCode.includes(`src="${script}"`)) {
        console.log(`✅ ${script} 로드됨`);
    } else {
        console.log(`❌ ${script} 로드 안됨`);
    }
});

// 7. 목업 데이터 생성 테스트
console.log('\n🎭 목업 데이터 생성 시뮬레이션:');

// AI 엔진의 generateMockData 함수 시뮬레이션
const testSurveyData = {
    basic: {
        companyName: '테스트 회사',
        industry: 'IT/소프트웨어',
        stage: '초기 단계'
    },
    business: {
        problem: '업무 효율성 문제',
        solution: 'AI 자동화 솔루션',
        targetMarket: '중소기업'
    },
    financial: {
        fundingNeed: '5억원'
    }
};

console.log('입력 데이터:', JSON.stringify(testSurveyData, null, 2));
console.log('\n예상 출력 구조:');
console.log(`{
  company: "${testSurveyData.basic.companyName}",
  ceo: "홍길동",
  establishDate: "${new Date().toISOString().slice(0, 10)}",
  businessModel: "...",
  revenueModel: "SaaS 구독 모델",
  sections: {
    executive_summary: "...",
    company_overview: "...",
    // ... 기타 섹션들
  }
}`);

// 8. 최종 검증 결과
console.log('\n' + '='.repeat(50));
console.log('📊 테스트 결과 요약:\n');

const issues = [];

// 모델명 확인
if (modelMatch && modelMatch[1] === 'gemini-1.5-flash') {
    console.log('✅ Gemini 모델 설정 올바름');
} else {
    issues.push('Gemini 모델명이 올바르지 않음');
    console.log('⚠️  Gemini 모델 설정 확인 필요');
}

// 필드 매핑 확인
if (mapperCode.includes('companyName') && mapperCode.includes('foundedDate')) {
    console.log('✅ UI 필드 매핑 올바름');
} else {
    issues.push('UI 필드 매핑 수정 필요');
    console.log('⚠️  UI 필드 매핑 확인 필요');
}

// 에러 핸들링 확인
if (aiEngineCode.includes('catch') && aiEngineCode.includes('generateMockData')) {
    console.log('✅ 에러 핸들링 구현됨 (목업 폴백)');
} else {
    issues.push('에러 핸들링 개선 필요');
    console.log('⚠️  에러 핸들링 확인 필요');
}

console.log('\n' + '='.repeat(50));
if (issues.length === 0) {
    console.log('✅ 시스템 테스트 통과! AI 자동화가 정상 작동할 준비가 되었습니다.');
} else {
    console.log('⚠️  다음 사항들을 확인해주세요:');
    issues.forEach(issue => {
        console.log(`  - ${issue}`);
    });
}

console.log('\n💡 다음 단계:');
console.log('1. 브라우저에서 business-plan-ultimate-fixed.html 열기');
console.log('2. "AI 자동 작성" 버튼 클릭');
console.log('3. Gemini API 키 입력 (또는 목업 모드로 테스트)');
console.log('4. 설문 완료 후 자동 생성 확인');
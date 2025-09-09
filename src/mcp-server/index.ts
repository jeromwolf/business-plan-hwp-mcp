#!/usr/bin/env node

/**
 * MCP 서버 메인 엔트리
 * Phase 2 모듈들과 완전 통합된 사업계획서 자동화 서버
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Phase 2 모듈들 임포트
import { ExcelToTableConverter } from '../converters/excel-to-table.js';
import { DOCXGenerator, BusinessPlanTemplateFactory } from '../converters/docx-generator.js';
import { EncodingConverter } from '../converters/encoding.js';
import { ImageProcessor } from '../converters/image-processor.js';
import { logger } from '../utils/logger.js';
import { existsSync } from 'fs';

// 서버 인스턴스 생성
const server = new Server(
  {
    name: 'business-plan-hwp-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// 컨버터 인스턴스
const excelConverter = new ExcelToTableConverter();
const docxGenerator = new DOCXGenerator();
const encodingConverter = new EncodingConverter();
const imageProcessor = new ImageProcessor();

// Tool 정의
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'convert_excel_to_docx',
      description: 'Excel 데이터를 DOCX 문서로 변환 (한글 특수문자 자동 처리)',
      inputSchema: {
        type: 'object',
        properties: {
          excelPath: {
            type: 'string',
            description: 'Excel 파일 경로',
          },
          templateType: {
            type: 'string',
            enum: ['basic', 'government', 'vc'],
            description: '사업계획서 템플릿 유형',
          },
          outputPath: {
            type: 'string',
            description: '출력 DOCX 파일 경로',
          },
          companyInfo: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              ceo: { type: 'string' },
              address: { type: 'string' },
              phone: { type: 'string' },
              email: { type: 'string' },
            },
            required: ['name'],
          },
        },
        required: ['excelPath', 'templateType', 'companyInfo'],
      },
    },
    {
      name: 'process_special_chars',
      description: '한글 특수문자 변환 (㈜→(주), ①→(1) 등)',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: '변환할 텍스트',
          },
        },
        required: ['text'],
      },
    },
    {
      name: 'optimize_image',
      description: '문서용 이미지 최적화',
      inputSchema: {
        type: 'object',
        properties: {
          imagePath: {
            type: 'string',
            description: '이미지 파일 경로',
          },
          maxWidth: {
            type: 'number',
            description: '최대 너비 (픽셀)',
            default: 800,
          },
          quality: {
            type: 'number',
            description: '품질 (1-100)',
            default: 85,
          },
        },
        required: ['imagePath'],
      },
    },
    {
      name: 'analyze_excel',
      description: 'Excel 데이터 분석 및 테이블 구조 확인',
      inputSchema: {
        type: 'object',
        properties: {
          excelPath: {
            type: 'string',
            description: 'Excel 파일 경로',
          },
          sheetName: {
            type: 'string',
            description: '시트 이름 (선택)',
          },
        },
        required: ['excelPath'],
      },
    },
    {
      name: 'generate_business_plan',
      description: 'AI 기반 사업계획서 내용 생성',
      inputSchema: {
        type: 'object',
        properties: {
          companyName: {
            type: 'string',
            description: '회사명',
          },
          businessType: {
            type: 'string',
            description: '사업 분야',
          },
          targetAudience: {
            type: 'string',
            enum: ['government', 'vc', 'bank'],
            description: '대상 기관',
          },
          keyPoints: {
            type: 'array',
            items: { type: 'string' },
            description: '핵심 포인트들',
          },
        },
        required: ['companyName', 'businessType', 'targetAudience'],
      },
    },
  ],
}));

// Tool 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  logger.info(`Tool called: ${name}`, args);
  
  try {
    switch (name) {
      case 'convert_excel_to_docx': {
        const { excelPath, templateType, outputPath, companyInfo } = args as any;
        
        // 파일 존재 확인
        if (!existsSync(excelPath)) {
          throw new Error(`Excel 파일을 찾을 수 없습니다: ${excelPath}`);
        }
        
        // Excel 파일 처리
        const excelResult = await excelConverter.extractTableFromFile(excelPath, {
          hasHeaders: true,
          convertSpecialChars: true,
          encoding: 'utf8',
        });
        
        if (!excelResult.success) {
          throw new Error(`Excel 처리 실패: ${excelResult.errors?.join(', ')}`);
        }
        
        // 템플릿 생성
        let template;
        switch (templateType) {
          case 'vc':
            template = BusinessPlanTemplateFactory.createVCTemplate(companyInfo);
            break;
          case 'government':
            template = BusinessPlanTemplateFactory.createGovernmentTemplate(companyInfo);
            break;
          default:
            template = BusinessPlanTemplateFactory.createBasicTemplate(companyInfo);
        }
        
        // 테이블 데이터 추가
        if (excelResult.table) {
          template.sections.push({
            title: '데이터 분석',
            table: excelResult.table,
          });
        }
        
        // DOCX 생성
        const docxResult = await docxGenerator.generateFromTemplate(template, {
          outputPath: outputPath || `사업계획서_${companyInfo.name}.docx`,
          includeTableOfContents: true,
          convertSpecialChars: true,
        });
        
        if (!docxResult.success) {
          throw new Error(`문서 생성 실패: ${docxResult.errors?.join(', ')}`);
        }
        
        return {
          content: [{
            type: 'text',
            text: `✅ 문서 생성 완료!\n\n📄 파일: ${docxResult.filePath}\n📊 테이블: ${docxResult.metadata?.tableCount}개\n⏱️ 처리 시간: ${docxResult.metadata?.processingTime}ms\n\n💡 팁: 생성된 DOCX 파일을 한글(HWP)에서 열어 저장하면 완벽한 HWP 문서가 됩니다.`,
          }],
        };
      }
      
      case 'process_special_chars': {
        const { text } = args as any;
        
        const { text: converted, converted: count } = encodingConverter.convertSpecialChars(text);
        
        return {
          content: [{
            type: 'text',
            text: `✅ 특수문자 변환 완료 (${count}개)\n\n원본:\n${text}\n\n변환:\n${converted}`,
          }],
        };
      }
      
      case 'optimize_image': {
        const { imagePath, maxWidth, quality } = args as any;
        
        if (!existsSync(imagePath)) {
          throw new Error(`이미지 파일을 찾을 수 없습니다: ${imagePath}`);
        }
        
        const result = await imageProcessor.processImage(imagePath, {
          resize: { 
            width: maxWidth || 800, 
            fit: 'inside',
            withoutEnlargement: true,
          },
          quality: { quality: quality || 85 },
          docxOptimized: true,
        });
        
        if (result.errors && result.errors.length > 0) {
          throw new Error(`이미지 처리 실패: ${result.errors.join(', ')}`);
        }
        
        const sizeReduction = Math.round((1 - result.optimized.sizeAfter / result.optimized.sizeBefore) * 100);
        
        return {
          content: [{
            type: 'text',
            text: `✅ 이미지 최적화 완료!\n\n📏 크기: ${result.metadata.width}x${result.metadata.height}\n💾 원본: ${(result.optimized.sizeBefore / 1024).toFixed(1)}KB\n💾 최적화: ${(result.optimized.sizeAfter / 1024).toFixed(1)}KB\n📉 압축률: ${sizeReduction}% 감소`,
          }],
        };
      }
      
      case 'analyze_excel': {
        const { excelPath, sheetName } = args as any;
        
        if (!existsSync(excelPath)) {
          throw new Error(`Excel 파일을 찾을 수 없습니다: ${excelPath}`);
        }
        
        const result = await excelConverter.extractTableFromFile(excelPath, {
          sheetName,
          hasHeaders: true,
        });
        
        if (!result.success) {
          throw new Error(`Excel 분석 실패: ${result.errors?.join(', ')}`);
        }
        
        const table = result.table!;
        const validation = excelConverter.validateTable(table);
        
        return {
          content: [{
            type: 'text',
            text: `📊 Excel 분석 결과\n\n📋 시트: ${table.metadata.sheetName}\n📏 크기: ${table.totalRows}행 x ${table.totalCols}열\n🔤 인코딩: ${table.metadata.encoding}\n✨ 특수문자: ${table.metadata.specialCharsConverted}개 발견\n\n${validation.valid ? '✅ 데이터 구조 정상' : '⚠️ 문제 발견:\n' + validation.issues.join('\n')}`,
          }],
        };
      }
      
      case 'generate_business_plan': {
        const { companyName, businessType, targetAudience, keyPoints } = args as any;
        
        // 간단한 템플릿 기반 생성 (실제로는 AI 모델 활용)
        const templates = {
          government: `# ${companyName} 사업계획서 (정부지원사업용)

## 1. 사업 개요
${companyName}은(는) ${businessType} 분야의 혁신적인 기업입니다.

### 1.1 사업의 배경 및 필요성
- 정부 정책 방향과 일치
- 사회적 문제 해결에 기여
${keyPoints?.map((p: string) => `- ${p}`).join('\n') || ''}

### 1.2 사업 목표
- 기술 혁신을 통한 산업 발전
- 일자리 창출 및 지역 경제 활성화

## 2. 기술개발 계획
- 핵심 기술 개발 로드맵
- 특허 및 지적재산권 확보 전략

## 3. 시장분석 및 사업화
- 목표 시장 규모 및 성장성
- 사업화 전략 및 수익 모델`,
          
          vc: `# ${companyName} Investment Deck

## Executive Summary
${companyName} is disrupting the ${businessType} industry.

## Problem & Solution
### Problem
- Market inefficiencies in ${businessType}
${keyPoints?.map((p: string) => `- ${p}`).join('\n') || ''}

### Solution
- Innovative approach using cutting-edge technology
- Scalable business model

## Market Opportunity
- TAM: $X billion
- SAM: $Y billion
- SOM: $Z million

## Business Model
- SaaS subscription model
- B2B2C marketplace approach`,
          
          bank: `# ${companyName} 사업계획서 (대출용)

## 1. 회사 개요
- 회사명: ${companyName}
- 사업 분야: ${businessType}
- 설립 연도: 2024년

## 2. 사업 현황
- 안정적인 매출 구조
- 검증된 비즈니스 모델
${keyPoints?.map((p: string) => `- ${p}`).join('\n') || ''}

## 3. 재무 현황
- 최근 3년 매출 성장률
- 부채 비율 및 유동성

## 4. 대출 상환 계획
- 예상 현금 흐름
- 담보 제공 계획`,
        };
        
        const content = templates[targetAudience as keyof typeof templates] || templates.government;
        
        return {
          content: [{
            type: 'text',
            text: content,
          }],
        };
      }
      
      default:
        throw new Error(`알 수 없는 도구: ${name}`);
    }
  } catch (error) {
    logger.error(`Tool execution error (${name}):`, error);
    return {
      content: [{
        type: 'text',
        text: `❌ 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      }],
    };
  }
});

// Resource 정의
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'template://basic',
      name: '기본 사업계획서 템플릿',
      description: '일반적인 사업계획서 양식',
      mimeType: 'application/json',
    },
    {
      uri: 'template://government',
      name: '정부지원사업 템플릿',
      description: '정부 지원사업 신청용 템플릿',
      mimeType: 'application/json',
    },
    {
      uri: 'template://vc',
      name: 'VC 투자 템플릿',
      description: '벤처캐피탈 투자유치용 템플릿',
      mimeType: 'application/json',
    },
    {
      uri: 'guide://special-chars',
      name: '특수문자 변환 가이드',
      description: '자동 변환되는 특수문자 목록',
      mimeType: 'text/plain',
    },
  ],
}));

// Resource 읽기 핸들러
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  
  if (uri.startsWith('template://')) {
    const templateType = uri.replace('template://', '');
    const templates = {
      basic: BusinessPlanTemplateFactory.createBasicTemplate({ name: '예시 회사' }),
      government: BusinessPlanTemplateFactory.createGovernmentTemplate({ name: '예시 회사' }),
      vc: BusinessPlanTemplateFactory.createVCTemplate({ name: '예시 회사' }),
    };
    
    const template = templates[templateType as keyof typeof templates];
    
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(template, null, 2),
      }],
    };
  }
  
  if (uri === 'guide://special-chars') {
    return {
      contents: [{
        uri,
        mimeType: 'text/plain',
        text: `특수문자 자동 변환 목록:

회사 형태:
㈜ → (주)
㈏ → (가)
㈐ → (나)

원문자:
① → (1)
② → (2)
③ → (3)
... 
⑮ → (15)

상표/저작권:
™ → TM
® → (R)
© → (C)

통화:
₩ → 원
¥ → 엔
€ → 유로
£ → 파운드`,
      }],
    };
  }
  
  throw new Error(`Unknown resource: ${uri}`);
});

// Prompt 정의
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: 'business_plan_writer',
      description: '사업계획서 작성 도우미',
      arguments: [
        {
          name: 'company',
          description: '회사명',
          required: true,
        },
        {
          name: 'business',
          description: '사업 분야',
          required: true,
        },
        {
          name: 'target',
          description: '대상 기관',
          required: false,
        },
      ],
    },
  ],
}));

// Prompt 실행 핸들러
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'business_plan_writer') {
    return {
      messages: [
        {
          role: 'system',
          content: {
            type: 'text',
            text: '당신은 전문 사업계획서 작성 컨설턴트입니다.',
          },
        },
        {
          role: 'user',
          content: {
            type: 'text',
            text: `${args?.company || '회사'}의 ${args?.business || '사업'} 분야 사업계획서를 작성해주세요. 대상: ${args?.target || '일반'}`,
          },
        },
      ],
    };
  }
  
  throw new Error(`Unknown prompt: ${name}`);
});

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP Server started - Phase 4 complete integration');
  console.error('Business Plan HWP MCP Server ready');
}

main().catch((error) => {
  logger.error('Server startup error:', error);
  process.exit(1);
});
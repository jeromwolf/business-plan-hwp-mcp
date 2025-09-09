import { DocumentStore } from '../../utils/documentStore.js';
import { HWPGenerator } from '../../hwp/generator.js';
import { logger } from '../../utils/logger.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface GenerateHWPArgs {
  documentId: string;
}

export async function generateHWP(args: GenerateHWPArgs) {
  try {
    const document = DocumentStore.get(args.documentId);
    if (!document) {
      throw new Error(`Document not found: ${args.documentId}`);
    }
    
    // HWP 생성기 초기화
    const generator = new HWPGenerator();
    
    // 문서 생성
    const hwpBuffer = await generator.generate({
      format: document.format,
      sections: document.sections,
      media: document.media,
      metadata: {
        title: `사업계획서_${document.format}`,
        author: 'Business Plan HWP MCP',
        createdAt: document.createdAt,
      },
    });
    
    // 파일 저장
    const outputDir = process.env.OUTPUT_DIR || './output';
    const fileName = `business_plan_${args.documentId}.hwp`;
    const filePath = join(outputDir, fileName);
    
    writeFileSync(filePath, hwpBuffer);
    
    logger.info(`Generated HWP file: ${filePath}`);
    
    return {
      content: [
        {
          type: 'text',
          text: `HWP 파일을 생성했습니다.\n경로: ${filePath}\n크기: ${(hwpBuffer.length / 1024).toFixed(2)}KB`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error generating HWP:', error);
    throw error;
  }
}
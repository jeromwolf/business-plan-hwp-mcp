import { DocumentStore } from '../../utils/documentStore.js';
import { processImage } from '../../converters/image-processor.js';
import { logger } from '../../utils/logger.js';
import { readFileSync } from 'fs';

interface InsertImageArgs {
  documentId: string;
  imagePath: string;
  caption?: string;
}

export async function insertImage(args: InsertImageArgs) {
  try {
    const document = DocumentStore.get(args.documentId);
    if (!document) {
      throw new Error(`Document not found: ${args.documentId}`);
    }
    
    // 이미지 파일 읽기
    const imageBuffer = readFileSync(args.imagePath);
    
    // 이미지 처리 (리사이징, 최적화)
    const processedImage = await processImage(imageBuffer);
    
    // 문서에 이미지 추가
    document.media.push({
      type: 'image',
      data: processedImage,
      caption: args.caption,
      sourcePath: args.imagePath,
    });
    
    DocumentStore.update(args.documentId, document);
    
    logger.info(`Inserted image into document: ${args.documentId}`);
    
    return {
      content: [
        {
          type: 'text',
          text: `이미지를 삽입했습니다.\n파일: ${args.imagePath}${args.caption ? `\n캡션: ${args.caption}` : ''}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error inserting image:', error);
    throw error;
  }
}
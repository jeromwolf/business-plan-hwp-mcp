import { v4 as uuidv4 } from 'uuid';
import { DocumentStore } from '../../utils/documentStore.js';
import { getTemplate } from '../templates/index.js';
import { logger } from '../../utils/logger.js';

interface CreatePlanArgs {
  format: 'government' | 'vc' | 'bank';
  businessInfo: string;
  requirements?: string[];
}

export async function createBusinessPlan(args: CreatePlanArgs) {
  try {
    const documentId = uuidv4();
    const template = getTemplate(args.format);
    
    // AI 콘텐츠 생성을 위한 섹션 구조
    const sections = template.sections.map(section => ({
      id: section.id,
      title: section.title,
      content: '', // AI가 채울 내용
      requiredData: section.requiredData,
    }));
    
    // 문서 저장소에 초기화
    DocumentStore.create(documentId, {
      format: args.format,
      businessInfo: args.businessInfo,
      requirements: args.requirements || [],
      sections,
      media: [],
      createdAt: new Date(),
    });
    
    logger.info(`Created business plan: ${documentId}`, { format: args.format });
    
    return {
      content: [
        {
          type: 'text',
          text: `사업계획서를 생성했습니다.\n문서 ID: ${documentId}\n포맷: ${template.name}\n섹션: ${sections.map(s => s.title).join(', ')}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error creating business plan:', error);
    throw error;
  }
}
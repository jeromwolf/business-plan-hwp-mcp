/**
 * DOCX 문서 생성 모듈
 * 사업계획서 템플릿 기반 DOCX 생성 및 Excel 테이블 삽입
 * HWP 대안으로서 완전 호환성 지원
 */

import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, AlignmentType, BorderStyle, ShadingType, HeightRule, VerticalAlign } from 'docx';
import { ProcessedTable, ProcessedRow, ProcessedCell, CellAlignment } from './excel-to-table';
import { EncodingUtils } from './encoding';
import { writeFileSync } from 'fs';

// 문서 스타일 옵션
export interface DocumentStyle {
  fontFamily?: string;
  fontSize?: number;
  lineSpacing?: number;
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  pageSize?: {
    width?: number;
    height?: number;
  };
}

// 테이블 스타일 옵션
export interface TableStyle {
  borderStyle?: typeof BorderStyle;
  borderSize?: number;
  borderColor?: string;
  headerBackground?: string;
  alternateRowBackground?: string;
  width?: string;
  alignment?: typeof AlignmentType;
}

// 사업계획서 섹션
export interface BusinessPlanSection {
  title: string;
  content?: string;
  table?: ProcessedTable;
  subsections?: BusinessPlanSection[];
  pageBreak?: boolean;
}

// 사업계획서 템플릿
export interface BusinessPlanTemplate {
  title: string;
  subtitle?: string;
  companyInfo: {
    name: string;
    ceo?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  sections: BusinessPlanSection[];
  documentStyle?: DocumentStyle;
  tableStyle?: TableStyle;
}

// 문서 생성 옵션
export interface DocumentGenerationOptions {
  template?: BusinessPlanTemplate;
  outputPath?: string;
  encoding?: string;
  convertSpecialChars?: boolean;
  optimizeTables?: boolean;
  includeTableOfContents?: boolean;
  watermark?: string;
  footerText?: string;
}

// 생성 결과
export interface GenerationResult {
  success: boolean;
  filePath?: string;
  buffer?: Buffer;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    pageCount?: number;
    tableCount?: number;
    wordCount?: number;
    processingTime: number;
  };
}

/**
 * DOCX 문서 생성기 클래스
 */
export class DOCXGenerator {
  private defaultStyle: DocumentStyle = {
    fontFamily: '맑은 고딕',
    fontSize: 11,
    lineSpacing: 1.5,
    margins: {
      top: 1440,    // 1 inch = 1440 twips
      right: 1440,
      bottom: 1440,
      left: 1440
    }
  };
  
  private defaultTableStyle: TableStyle = {
    borderStyle: BorderStyle.SINGLE,
    borderSize: 1,
    borderColor: '000000',
    headerBackground: 'E6E6FA',
    width: '100%',
    alignment: AlignmentType.CENTER
  };
  
  /**
   * 사업계획서 템플릿으로 문서 생성
   */
  async generateFromTemplate(
    template: BusinessPlanTemplate,
    options: DocumentGenerationOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    
    try {
      // 스타일 병합
      const docStyle = { ...this.defaultStyle, ...template.documentStyle };
      const tableStyle = { ...this.defaultTableStyle, ...template.tableStyle };
      
      // 문서 생성
      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: docStyle.fontFamily,
                size: docStyle.fontSize! * 2 // DOCX uses half-points
              }
            }
          }
        },
        sections: []
      });
      
      const children: (Paragraph | Table)[] = [];
      
      // 제목 페이지
      children.push(...this.createTitlePage(template));
      
      // 목차 (옵션)
      if (options.includeTableOfContents) {
        children.push(...this.createTableOfContents(template.sections));
      }
      
      // 각 섹션 처리
      let tableCount = 0;
      for (const section of template.sections) {
        const sectionElements = await this.processSectionElements(
          section, 
          tableStyle, 
          options
        );
        
        children.push(...sectionElements);
        
        // 테이블 카운트
        tableCount += this.countTables(section);
        
        if (section.pageBreak) {
          // 페이지 브레이크는 섹션 구분으로 처리
        }
      }
      
      // 문서 섹션 생성
      const docSection = {
        properties: {
          page: {
            size: {
              width: docStyle.pageSize?.width || 11906, // A4 width in twips
              height: docStyle.pageSize?.height || 16838 // A4 height in twips
            },
            margin: docStyle.margins
          }
        },
        children
      };
      
      // 바이너리 생성
      const buffer = await Packer.toBuffer(doc);
      
      // 파일 저장 (옵션)
      let filePath: string | undefined;
      if (options.outputPath) {
        writeFileSync(options.outputPath, buffer);
        filePath = options.outputPath;
      }
      
      return {
        success: true,
        filePath,
        buffer,
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata: {
          tableCount,
          processingTime: Date.now() - startTime
        }
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : '문서 생성 실패'],
        metadata: {
          processingTime: Date.now() - startTime
        }
      };
    }
  }
  
  /**
   * 단일 테이블로 문서 생성
   */
  async generateTableDocument(
    table: ProcessedTable,
    options: DocumentGenerationOptions = {}
  ): Promise<GenerationResult> {
    const template: BusinessPlanTemplate = {
      title: table.title || '데이터 테이블',
      companyInfo: {
        name: '데이터 분석'
      },
      sections: [{
        title: '데이터 테이블',
        table
      }]
    };
    
    return this.generateFromTemplate(template, options);
  }
  
  /**
   * 제목 페이지 생성
   */
  private createTitlePage(template: BusinessPlanTemplate): Paragraph[] {
    const elements: Paragraph[] = [];
    
    // 메인 제목
    elements.push(new Paragraph({
      children: [new TextRun({
        text: template.title,
        size: 32,
        bold: true
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }));
    
    // 부제목
    if (template.subtitle) {
      elements.push(new Paragraph({
        children: [new TextRun({
          text: template.subtitle,
          size: 24
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      }));
    }
    
    // 회사 정보
    elements.push(new Paragraph({
      children: [new TextRun({
        text: template.companyInfo.name,
        size: 20,
        bold: true
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }));
    
    if (template.companyInfo.ceo) {
      elements.push(new Paragraph({
        children: [new TextRun({
          text: `대표이사: ${template.companyInfo.ceo}`,
          size: 14
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      }));
    }
    
    // 날짜
    elements.push(new Paragraph({
      children: [new TextRun({
        text: new Date().toLocaleDateString('ko-KR'),
        size: 12
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 }
    }));
    
    return elements;
  }
  
  /**
   * 목차 생성
   */
  private createTableOfContents(sections: BusinessPlanSection[]): Paragraph[] {
    const elements: Paragraph[] = [];
    
    elements.push(new Paragraph({
      children: [new TextRun({
        text: '목    차',
        size: 24,
        bold: true
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }));
    
    let pageNum = 3; // 제목 페이지, 목차 후 시작
    sections.forEach((section, index) => {
      elements.push(new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${section.title}`,
            size: 14
          }),
          new TextRun({
            text: ` ......................................... ${pageNum}`,
            size: 12
          })
        ],
        spacing: { after: 100 }
      }));
      pageNum += this.estimateSectionPages(section);
    });
    
    return elements;
  }
  
  /**
   * 섹션 요소 처리
   */
  private async processSectionElements(
    section: BusinessPlanSection,
    tableStyle: TableStyle,
    options: DocumentGenerationOptions
  ): Promise<(Paragraph | Table)[]> {
    const elements: (Paragraph | Table)[] = [];
    
    // 섹션 제목
    elements.push(new Paragraph({
      children: [new TextRun({
        text: section.title,
        size: 20,
        bold: true
      })],
      spacing: { before: 400, after: 200 }
    }));
    
    // 섹션 내용
    if (section.content) {
      const content = options.convertSpecialChars !== false ?
        await EncodingUtils.toDOCXSafe(section.content) :
        section.content;
        
      elements.push(new Paragraph({
        children: [new TextRun({
          text: content,
          size: 11
        })],
        spacing: { after: 200 }
      }));
    }
    
    // 테이블
    if (section.table) {
      try {
        const table = await this.createTableFromData(section.table, tableStyle, options);
        elements.push(table);
      } catch (error) {
        console.warn(`테이블 생성 실패: ${error}`);
        elements.push(new Paragraph({
          children: [new TextRun({
            text: '[테이블 생성 오류]',
            italics: true,
            color: 'red'
          })]
        }));
      }
    }
    
    // 하위 섹션
    if (section.subsections) {
      for (const subsection of section.subsections) {
        const subElements = await this.processSectionElements(
          subsection, 
          tableStyle, 
          options
        );
        elements.push(...subElements);
      }
    }
    
    return elements;
  }
  
  /**
   * 테이블 데이터를 DOCX 테이블로 변환
   */
  private async createTableFromData(
    tableData: ProcessedTable,
    style: TableStyle,
    options: DocumentGenerationOptions
  ): Promise<Table> {
    const rows: TableRow[] = [];
    
    // 헤더 처리
    if (tableData.headers.length > 0) {
      for (const headerRow of tableData.headers) {
        const row = await this.createTableRow(headerRow, style, true);
        rows.push(row);
      }
    }
    
    // 데이터 행 처리
    for (let i = 0; i < tableData.rows.length; i++) {
      const isAlternate = i % 2 === 1;
      const row = await this.createTableRow(
        tableData.rows[i], 
        style, 
        false, 
        isAlternate
      );
      rows.push(row);
    }
    
    return new Table({
      rows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      borders: {
        top: { style: style.borderStyle, size: style.borderSize, color: style.borderColor },
        bottom: { style: style.borderStyle, size: style.borderSize, color: style.borderColor },
        left: { style: style.borderStyle, size: style.borderSize, color: style.borderColor },
        right: { style: style.borderStyle, size: style.borderSize, color: style.borderColor },
        insideHorizontal: { style: style.borderStyle, size: style.borderSize, color: style.borderColor },
        insideVertical: { style: style.borderStyle, size: style.borderSize, color: style.borderColor }
      }
    });
  }
  
  /**
   * 테이블 행 생성
   */
  private async createTableRow(
    rowData: ProcessedRow,
    style: TableStyle,
    isHeader: boolean = false,
    isAlternate: boolean = false
  ): Promise<TableRow> {
    const cells: TableCell[] = [];
    
    for (const cellData of rowData.cells) {
      const cell = await this.createTableCell(cellData, style, isHeader, isAlternate);
      cells.push(cell);
    }
    
    return new TableRow({
      children: cells,
      height: rowData.height ? {
        value: rowData.height,
        rule: HeightRule.EXACT
      } : undefined
    });
  }
  
  /**
   * 테이블 셀 생성
   */
  private async createTableCell(
    cellData: ProcessedCell,
    style: TableStyle,
    isHeader: boolean = false,
    isAlternate: boolean = false
  ): Promise<TableCell> {
    // 텍스트 처리
    const text = await EncodingUtils.toDOCXSafe(cellData.displayValue.toString());
    
    // 정렬 설정
    let alignment = AlignmentType.LEFT;
    if (cellData.style?.alignment) {
      switch (cellData.style.alignment) {
        case CellAlignment.CENTER:
          alignment = AlignmentType.CENTER;
          break;
        case CellAlignment.RIGHT:
          alignment = AlignmentType.RIGHT;
          break;
        case CellAlignment.JUSTIFY:
          alignment = AlignmentType.JUSTIFIED;
          break;
      }
    }
    
    // 배경색 결정
    let backgroundColor: string | undefined;
    if (isHeader && style.headerBackground) {
      backgroundColor = style.headerBackground;
    } else if (isAlternate && style.alternateRowBackground) {
      backgroundColor = style.alternateRowBackground;
    }
    
    return new TableCell({
      children: [new Paragraph({
        children: [new TextRun({
          text,
          bold: isHeader || cellData.style?.bold,
          italics: cellData.style?.italic,
          underline: cellData.style?.underline ? {} : undefined,
          size: cellData.style?.fontSize ? cellData.style.fontSize * 2 : undefined,
          color: cellData.style?.fontColor
        })],
        alignment
      })],
      columnSpan: cellData.colspan,
      rowSpan: cellData.rowspan,
      shading: backgroundColor ? {
        type: ShadingType.SOLID,
        color: backgroundColor
      } : undefined,
      verticalAlign: VerticalAlign.CENTER
    });
  }
  
  /**
   * 섹션의 페이지 수 추정
   */
  private estimateSectionPages(section: BusinessPlanSection): number {
    let pages = 1;
    if (section.table && section.table.rows.length > 20) {
      pages += Math.ceil(section.table.rows.length / 25);
    }
    if (section.subsections) {
      pages += section.subsections.length;
    }
    return pages;
  }
  
  /**
   * 섹션의 테이블 수 계산
   */
  private countTables(section: BusinessPlanSection): number {
    let count = section.table ? 1 : 0;
    if (section.subsections) {
      count += section.subsections.reduce((sum, sub) => sum + this.countTables(sub), 0);
    }
    return count;
  }
}

/**
 * 사업계획서 템플릿 팩토리
 */
export class BusinessPlanTemplateFactory {
  /**
   * 기본 사업계획서 템플릿
   */
  static createBasicTemplate(companyInfo: any): BusinessPlanTemplate {
    return {
      title: '사업계획서',
      subtitle: companyInfo.name,
      companyInfo,
      sections: [
        {
          title: '1. 사업 개요',
          content: '사업의 목적과 비전을 설명합니다.'
        },
        {
          title: '2. 시장 분석',
          content: '대상 시장과 경쟁 환경을 분석합니다.'
        },
        {
          title: '3. 제품/서비스',
          content: '제공할 제품이나 서비스를 설명합니다.'
        },
        {
          title: '4. 마케팅 전략',
          content: '마케팅 및 영업 전략을 설명합니다.'
        },
        {
          title: '5. 재무 계획',
          content: '재무 계획과 투자 계획을 설명합니다.'
        }
      ]
    };
  }
  
  /**
   * VC 투자용 템플릿
   */
  static createVCTemplate(companyInfo: any): BusinessPlanTemplate {
    return {
      title: '투자제안서',
      subtitle: `${companyInfo.name} 투자 계획`,
      companyInfo,
      sections: [
        {
          title: 'Executive Summary',
          content: '사업 요약 및 투자 포인트'
        },
        {
          title: 'Problem & Solution',
          content: '해결하고자 하는 문제와 솔루션'
        },
        {
          title: 'Market Opportunity',
          content: '시장 기회와 규모'
        },
        {
          title: 'Product & Technology',
          content: '제품 및 기술적 우위'
        },
        {
          title: 'Business Model',
          content: '수익 모델과 비즈니스 구조'
        },
        {
          title: 'Go-to-Market Strategy',
          content: '시장 진출 전략'
        },
        {
          title: 'Financial Projections',
          content: '재무 전망 및 투자 계획'
        },
        {
          title: 'Team',
          content: '팀 소개 및 역량'
        }
      ]
    };
  }
  
  /**
   * 정부 지원사업용 템플릿
   */
  static createGovernmentTemplate(companyInfo: any): BusinessPlanTemplate {
    return {
      title: '사업계획서',
      subtitle: '정부지원사업 신청용',
      companyInfo,
      sections: [
        {
          title: '1. 사업 개요',
          subsections: [
            { title: '1-1. 사업의 배경 및 필요성', content: '' },
            { title: '1-2. 사업의 목표', content: '' },
            { title: '1-3. 사업의 내용', content: '' }
          ]
        },
        {
          title: '2. 기술개발 계획',
          subsections: [
            { title: '2-1. 기술개발 목표', content: '' },
            { title: '2-2. 기술개발 내용 및 방법', content: '' },
            { title: '2-3. 기대효과', content: '' }
          ]
        },
        {
          title: '3. 시장분석 및 사업화 계획',
          content: '시장 현황 분석 및 사업화 전략'
        },
        {
          title: '4. 연구개발 추진체계',
          content: '연구개발 조직 및 역할'
        },
        {
          title: '5. 소요예산 및 조달계획',
          content: '예산 계획 및 자금 조달 방안'
        }
      ]
    };
  }
}

/**
 * 편의 함수들
 */
export class DOCXUtils {
  private static generator = new DOCXGenerator();
  
  /**
   * Excel 파일을 DOCX로 변환
   */
  static async convertExcelToDocx(
    excelPath: string,
    outputPath: string
  ): Promise<boolean> {
    try {
      const { ExcelToTableConverter } = await import('./excel-to-table');
      const converter = new ExcelToTableConverter();
      
      const result = await converter.extractTableFromFile(excelPath);
      if (!result.success || !result.table) return false;
      
      const docResult = await this.generator.generateTableDocument(
        result.table,
        { outputPath }
      );
      
      return docResult.success;
    } catch {
      return false;
    }
  }
  
  /**
   * 기본 사업계획서 생성
   */
  static async createBusinessPlan(
    companyInfo: any,
    outputPath: string,
    templateType: 'basic' | 'vc' | 'government' = 'basic'
  ): Promise<boolean> {
    try {
      let template: BusinessPlanTemplate;
      
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
      
      const result = await this.generator.generateFromTemplate(template, {
        outputPath,
        includeTableOfContents: true
      });
      
      return result.success;
    } catch {
      return false;
    }
  }
}

export default DOCXGenerator;
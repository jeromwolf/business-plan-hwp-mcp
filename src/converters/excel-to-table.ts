/**
 * Excel to Table 변환 모듈
 * Excel 데이터를 DOCX 표 구조로 변환하는 핵심 엔진
 * Phase 1 테스트에서 검증된 Excel 처리 기능 기반
 */

import XLSX from 'xlsx';
import { EncodingConverter, SupportedEncoding } from './encoding';

// 셀 정렬 옵션
export enum CellAlignment {
  LEFT = 'left',
  CENTER = 'center', 
  RIGHT = 'right',
  JUSTIFY = 'justify'
}

// 셀 데이터 타입
export enum CellDataType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  FORMULA = 'formula',
  BOOLEAN = 'boolean'
}

// 셀 스타일
export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  alignment?: CellAlignment;
}

// 변환된 셀 정보
export interface ProcessedCell {
  value: string | number | boolean;
  displayValue: string;
  type: CellDataType;
  style?: CellStyle;
  colspan?: number;
  rowspan?: number;
  formula?: string;
}

// 변환된 행 정보
export interface ProcessedRow {
  cells: ProcessedCell[];
  height?: number;
  style?: {
    backgroundColor?: string;
    borderColor?: string;
  };
}

// 변환된 테이블 정보
export interface ProcessedTable {
  title?: string;
  headers: ProcessedRow[];
  rows: ProcessedRow[];
  totalRows: number;
  totalCols: number;
  style?: {
    borderStyle?: string;
    borderWidth?: number;
    borderColor?: string;
    width?: string;
  };
  metadata: {
    sheetName: string;
    originalRange: string;
    encoding: SupportedEncoding;
    specialCharsConverted: number;
    processingTime: number;
  };
}

// Excel 처리 옵션
export interface ExcelProcessingOptions {
  sheetName?: string;
  range?: string; // 예: "A1:E10"
  hasHeaders?: boolean;
  headerRows?: number;
  encoding?: SupportedEncoding;
  convertSpecialChars?: boolean;
  preserveFormulas?: boolean;
  dateFormat?: string;
  numberPrecision?: number;
}

// 처리 결과
export interface ProcessingResult {
  success: boolean;
  table?: ProcessedTable;
  errors?: string[];
  warnings?: string[];
}

/**
 * Excel to Table 변환기 클래스
 */
export class ExcelToTableConverter {
  private encodingConverter: EncodingConverter;
  
  constructor() {
    this.encodingConverter = new EncodingConverter();
  }
  
  /**
   * Excel 파일에서 테이블 추출
   */
  async extractTableFromFile(
    filePath: string, 
    options: ExcelProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Excel 파일 읽기
      const workbook = XLSX.readFile(filePath);
      const sheetName = options.sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        return {
          success: false,
          errors: [`시트 '${sheetName}'을 찾을 수 없습니다`]
        };
      }
      
      return this.extractTableFromWorksheet(worksheet, {
        ...options,
        sheetName
      }, startTime);
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : '파일 읽기 실패']
      };
    }
  }
  
  /**
   * Excel 버퍼에서 테이블 추출
   */
  async extractTableFromBuffer(
    buffer: Buffer,
    options: ExcelProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = options.sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        return {
          success: false,
          errors: [`시트 '${sheetName}'을 찾을 수 없습니다`]
        };
      }
      
      return this.extractTableFromWorksheet(worksheet, {
        ...options,
        sheetName
      }, startTime);
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : '버퍼 읽기 실패']
      };
    }
  }
  
  /**
   * 워크시트에서 테이블 데이터 추출
   */
  private async extractTableFromWorksheet(
    worksheet: XLSX.WorkSheet,
    options: ExcelProcessingOptions,
    startTime: number
  ): Promise<ProcessingResult> {
    try {
      // 범위 결정
      const range = options.range ? XLSX.utils.decode_range(options.range) : worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : null;
      
      if (!range) {
        return {
          success: false,
          errors: ['유효한 데이터 범위를 찾을 수 없습니다']
        };
      }
      
      // 병합된 셀 정보 가져오기
      const merges = worksheet['!merges'] || [];
      const mergeMap = this.buildMergeMap(merges);
      
      const rows: ProcessedRow[] = [];
      let totalSpecialCharsConverted = 0;
      const warnings: string[] = [];
      
      // 각 행 처리
      for (let R = range.s.r; R <= range.e.r; R++) {
        const cells: ProcessedCell[] = [];
        
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cellObj = worksheet[cellAddress];
          
          // 병합된 셀 처리
          const mergeInfo = mergeMap[cellAddress];
          if (mergeInfo && !mergeInfo.isOrigin) {
            // 병합된 셀의 시작점이 아니면 건너뛰기
            continue;
          }
          
          const processedCell = await this.processCell(
            cellObj,
            cellAddress,
            mergeInfo,
            options
          );
          
          if (processedCell) {
            // 특수문자 변환
            if (options.convertSpecialChars !== false && 
                typeof processedCell.displayValue === 'string') {
              const { text, converted } = this.encodingConverter.convertSpecialChars(
                processedCell.displayValue
              );
              processedCell.displayValue = text;
              totalSpecialCharsConverted += converted;
            }
            
            cells.push(processedCell);
          } else {
            // 빈 셀 처리
            cells.push({
              value: '',
              displayValue: '',
              type: CellDataType.TEXT
            });
          }
        }
        
        if (cells.length > 0) {
          rows.push({ cells });
        }
      }
      
      // 헤더와 데이터 행 분리
      const headerRows = options.hasHeaders !== false ? 
        (options.headerRows || 1) : 0;
      
      const headers = rows.slice(0, headerRows);
      const dataRows = rows.slice(headerRows);
      
      // 테이블 구조 생성
      const table: ProcessedTable = {
        headers,
        rows: dataRows,
        totalRows: rows.length,
        totalCols: range.e.c - range.s.c + 1,
        metadata: {
          sheetName: options.sheetName || 'Sheet1',
          originalRange: XLSX.utils.encode_range(range),
          encoding: options.encoding || 'utf8',
          specialCharsConverted: totalSpecialCharsConverted,
          processingTime: Date.now() - startTime
        }
      };
      
      return {
        success: true,
        table,
        warnings: warnings.length > 0 ? warnings : undefined
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : '워크시트 처리 실패']
      };
    }
  }
  
  /**
   * 개별 셀 처리
   */
  private async processCell(
    cellObj: XLSX.CellObject | undefined,
    address: string,
    mergeInfo: any,
    options: ExcelProcessingOptions
  ): Promise<ProcessedCell | null> {
    if (!cellObj) return null;
    
    const cell: ProcessedCell = {
      value: cellObj.v,
      displayValue: '',
      type: this.determineCellType(cellObj)
    };
    
    // 표시값 결정
    if (cellObj.w) {
      cell.displayValue = cellObj.w; // 포맷된 값
    } else if (cellObj.v !== undefined) {
      cell.displayValue = String(cellObj.v);
    } else {
      cell.displayValue = '';
    }
    
    // 병합 정보 추가
    if (mergeInfo && mergeInfo.isOrigin) {
      cell.colspan = mergeInfo.colspan;
      cell.rowspan = mergeInfo.rowspan;
    }
    
    // 수식 정보
    if (cellObj.f && options.preserveFormulas !== false) {
      cell.formula = cellObj.f;
    }
    
    // 데이터 타입별 후처리
    switch (cell.type) {
      case CellDataType.NUMBER:
        if (options.numberPrecision !== undefined && typeof cell.value === 'number') {
          cell.value = Number(cell.value.toFixed(options.numberPrecision));
          cell.displayValue = cell.value.toString();
        }
        break;
        
      case CellDataType.DATE:
        if (options.dateFormat && cell.value instanceof Date) {
          cell.displayValue = this.formatDate(cell.value, options.dateFormat);
        }
        break;
    }
    
    return cell;
  }
  
  /**
   * 셀 데이터 타입 결정
   */
  private determineCellType(cellObj: XLSX.CellObject): CellDataType {
    switch (cellObj.t) {
      case 'n': return CellDataType.NUMBER;
      case 'b': return CellDataType.BOOLEAN;
      case 'd': return CellDataType.DATE;
      case 's': return CellDataType.TEXT;
      default:
        // 수식인지 확인
        if (cellObj.f) return CellDataType.FORMULA;
        return CellDataType.TEXT;
    }
  }
  
  /**
   * 병합 셀 맵 구성
   */
  private buildMergeMap(merges: XLSX.Range[]): Record<string, any> {
    const mergeMap: Record<string, any> = {};
    
    merges.forEach(merge => {
      const startAddr = XLSX.utils.encode_cell(merge.s);
      const colspan = merge.e.c - merge.s.c + 1;
      const rowspan = merge.e.r - merge.s.r + 1;
      
      // 시작 셀 정보
      mergeMap[startAddr] = {
        isOrigin: true,
        colspan,
        rowspan
      };
      
      // 병합된 다른 셀들 표시
      for (let r = merge.s.r; r <= merge.e.r; r++) {
        for (let c = merge.s.c; c <= merge.e.c; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (addr !== startAddr) {
            mergeMap[addr] = {
              isOrigin: false,
              mergedTo: startAddr
            };
          }
        }
      }
    });
    
    return mergeMap;
  }
  
  /**
   * 날짜 포맷팅
   */
  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day);
  }
  
  /**
   * 테이블 검증
   */
  validateTable(table: ProcessedTable): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // 기본 구조 검증
    if (!table.rows || table.rows.length === 0) {
      issues.push('테이블에 데이터 행이 없습니다');
    }
    
    if (table.totalCols <= 0) {
      issues.push('유효한 열이 없습니다');
    }
    
    // 행별 셀 수 일관성 검증
    let expectedCols = table.totalCols;
    table.rows.forEach((row, idx) => {
      if (row.cells.length !== expectedCols) {
        issues.push(`행 ${idx + 1}: 예상 열 수(${expectedCols})와 실제 열 수(${row.cells.length})가 다릅니다`);
      }
    });
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * 테이블 최적화
   */
  optimizeTable(table: ProcessedTable): ProcessedTable {
    // 빈 행 제거
    const nonEmptyRows = table.rows.filter(row => 
      row.cells.some(cell => 
        cell.displayValue.trim() !== ''
      )
    );
    
    // 빈 열 제거 (모든 행에서 빈 열인 경우)
    const nonEmptyColIndices: number[] = [];
    for (let colIdx = 0; colIdx < table.totalCols; colIdx++) {
      const hasContent = nonEmptyRows.some(row => 
        row.cells[colIdx] && row.cells[colIdx].displayValue.trim() !== ''
      );
      if (hasContent) {
        nonEmptyColIndices.push(colIdx);
      }
    }
    
    // 최적화된 테이블 생성
    const optimizedTable: ProcessedTable = {
      ...table,
      headers: table.headers.map(row => ({
        ...row,
        cells: row.cells.filter((_, idx) => nonEmptyColIndices.includes(idx))
      })),
      rows: nonEmptyRows.map(row => ({
        ...row,
        cells: row.cells.filter((_, idx) => nonEmptyColIndices.includes(idx))
      })),
      totalRows: nonEmptyRows.length,
      totalCols: nonEmptyColIndices.length
    };
    
    return optimizedTable;
  }
}

/**
 * 편의 함수들
 */
export class ExcelTableUtils {
  private static converter = new ExcelToTableConverter();
  
  /**
   * 간단한 Excel 파일 변환
   */
  static async convertFile(filePath: string): Promise<ProcessedTable | null> {
    const result = await this.converter.extractTableFromFile(filePath, {
      hasHeaders: true,
      convertSpecialChars: true
    });
    
    return result.success ? result.table! : null;
  }
  
  /**
   * Excel 버퍼를 테이블로 변환
   */
  static async convertBuffer(buffer: Buffer): Promise<ProcessedTable | null> {
    const result = await this.converter.extractTableFromBuffer(buffer, {
      hasHeaders: true,
      convertSpecialChars: true
    });
    
    return result.success ? result.table! : null;
  }
  
  /**
   * 테이블을 CSV 형식으로 변환
   */
  static tableToCSV(table: ProcessedTable): string {
    const allRows = [...table.headers, ...table.rows];
    return allRows.map(row =>
      row.cells.map(cell => 
        `"${cell.displayValue.toString().replace(/"/g, '""')}"`
      ).join(',')
    ).join('\n');
  }
  
  /**
   * 테이블을 HTML 형식으로 변환
   */
  static tableToHTML(table: ProcessedTable): string {
    let html = '<table border="1">';
    
    // 헤더
    if (table.headers.length > 0) {
      html += '<thead>';
      table.headers.forEach(row => {
        html += '<tr>';
        row.cells.forEach(cell => {
          const colspanAttr = cell.colspan && cell.colspan > 1 ? ` colspan="${cell.colspan}"` : '';
          const rowspanAttr = cell.rowspan && cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : '';
          html += `<th${colspanAttr}${rowspanAttr}>${cell.displayValue}</th>`;
        });
        html += '</tr>';
      });
      html += '</thead>';
    }
    
    // 데이터 행
    html += '<tbody>';
    table.rows.forEach(row => {
      html += '<tr>';
      row.cells.forEach(cell => {
        const colspanAttr = cell.colspan && cell.colspan > 1 ? ` colspan="${cell.colspan}"` : '';
        const rowspanAttr = cell.rowspan && cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : '';
        html += `<td${colspanAttr}${rowspanAttr}>${cell.displayValue}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    
    return html;
  }
}

export default ExcelToTableConverter;
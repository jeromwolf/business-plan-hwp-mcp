import * as XLSX from 'xlsx';
import { DocumentStore } from '../../utils/documentStore.js';
import { convertExcelToHWPTable } from '../../converters/excel-to-table.js';
import { logger } from '../../utils/logger.js';
import { readFileSync } from 'fs';

interface InsertExcelArgs {
  documentId: string;
  excelPath: string;
  targetSection: string;
}

export async function insertExcelData(args: InsertExcelArgs) {
  try {
    const document = DocumentStore.get(args.documentId);
    if (!document) {
      throw new Error(`Document not found: ${args.documentId}`);
    }
    
    // Excel 파일 읽기
    const buffer = readFileSync(args.excelPath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Excel 데이터를 배열로 변환
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    // HWP 표 형식으로 변환
    const hwpTable = convertExcelToHWPTable(data);
    
    // 문서에 표 추가
    document.media.push({
      type: 'table',
      targetSection: args.targetSection,
      data: hwpTable,
      sourcePath: args.excelPath,
    });
    
    DocumentStore.update(args.documentId, document);
    
    logger.info(`Inserted Excel data into document: ${args.documentId}`);
    
    return {
      content: [
        {
          type: 'text',
          text: `Excel 데이터를 삽입했습니다.\n파일: ${args.excelPath}\n대상 섹션: ${args.targetSection}\n행: ${data.length}, 열: ${data[0]?.length || 0}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error inserting Excel data:', error);
    throw error;
  }
}
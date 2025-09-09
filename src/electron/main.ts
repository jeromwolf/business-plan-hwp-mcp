/**
 * Electron 메인 프로세스
 * 애플리케이션 생명주기 및 창 관리
 */

import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

// Phase 2 모듈들 임포트
import { ExcelToTableConverter } from '../converters/excel-to-table.js';
import { DOCXGenerator, BusinessPlanTemplateFactory } from '../converters/docx-generator.js';
import { ImageProcessor } from '../converters/image-processor.js';
import { EncodingConverter } from '../converters/encoding.js';

let mainWindow: BrowserWindow | null = null;
let isDev = process.env.NODE_ENV === 'development';

// 싱글톤 인스턴스 생성
const excelConverter = new ExcelToTableConverter();
const docxGenerator = new DOCXGenerator();
const imageProcessor = new ImageProcessor();
const encodingConverter = new EncodingConverter();

/**
 * 메인 윈도우 생성
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    icon: join(__dirname, '../../assets/icon.png'),
    show: false
  });

  // 개발 모드에서는 React 개발 서버 연결
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
  }

  // 창 준비 완료 시 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 메뉴 설정
  createMenu();
}

/**
 * 애플리케이션 메뉴 생성
 */
function createMenu() {
  const template: any[] = [
    {
      label: '파일',
      submenu: [
        {
          label: 'Excel 파일 열기',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu-open-file');
          }
        },
        {
          label: '템플릿 선택',
          submenu: [
            {
              label: '기본 사업계획서',
              click: () => {
                mainWindow?.webContents.send('menu-select-template', 'basic');
              }
            },
            {
              label: 'VC 투자용',
              click: () => {
                mainWindow?.webContents.send('menu-select-template', 'vc');
              }
            },
            {
              label: '정부지원사업용',
              click: () => {
                mainWindow?.webContents.send('menu-select-template', 'government');
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: '종료',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '편집',
      submenu: [
        { label: '실행 취소', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '다시 실행', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '잘라내기', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '복사', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '붙여넣기', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: '도움말',
      submenu: [
        {
          label: '사용 가이드',
          click: () => {
            mainWindow?.webContents.send('menu-show-guide');
          }
        },
        {
          label: '정보',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '사업계획서 자동화 도구',
              message: '사업계획서 HWP 자동화 도구',
              detail: 'Version 0.1.0\n\nExcel 데이터를 한글 문서로 변환하는 도구입니다.\n특수문자 깨짐 없이 완벽한 변환을 지원합니다.',
              buttons: ['확인']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============= IPC 핸들러 =============

/**
 * 파일 선택 다이얼로그
 */
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Excel Files', extensions: ['xlsx', 'xls', 'csv'] },
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

/**
 * 저장 경로 선택 다이얼로그
 */
ipcMain.handle('select-save-path', async (event, defaultName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName,
    filters: [
      { name: 'Word Document', extensions: ['docx'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePath) {
    return result.filePath;
  }
  return null;
});

/**
 * Excel 파일 처리
 */
ipcMain.handle('process-excel', async (event, filePath: string, options: any) => {
  try {
    const result = await excelConverter.extractTableFromFile(filePath, options);
    
    if (result.success && result.table) {
      // 테이블 검증
      const validation = excelConverter.validateTable(result.table);
      
      // 테이블 최적화
      const optimizedTable = excelConverter.optimizeTable(result.table);
      
      return {
        success: true,
        table: optimizedTable,
        validation,
        warnings: result.warnings
      };
    }
    
    return {
      success: false,
      errors: result.errors
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : '처리 실패']
    };
  }
});

/**
 * DOCX 생성
 */
ipcMain.handle('generate-docx', async (event, data: any) => {
  try {
    const { templateType, companyInfo, tableData, outputPath } = data;
    
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
    if (tableData) {
      template.sections.push({
        title: '데이터 테이블',
        table: tableData
      });
    }
    
    // DOCX 생성
    const result = await docxGenerator.generateFromTemplate(template, {
      outputPath,
      includeTableOfContents: true,
      convertSpecialChars: true
    });
    
    return result;
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : '생성 실패']
    };
  }
});

/**
 * 이미지 처리
 */
ipcMain.handle('process-image', async (event, imagePath: string) => {
  try {
    const result = await imageProcessor.optimizeForDocx(imagePath);
    
    if (result.errors) {
      return {
        success: false,
        errors: result.errors
      };
    }
    
    return {
      success: true,
      buffer: result.buffer,
      metadata: result.metadata,
      optimized: result.optimized
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : '처리 실패']
    };
  }
});

/**
 * 텍스트 인코딩 변환
 */
ipcMain.handle('convert-encoding', async (event, text: string) => {
  try {
    const result = await encodingConverter.convert(text, 'utf8', 'utf8');
    
    return {
      success: result.success,
      text: result.text,
      specialCharsConverted: result.specialCharsConverted,
      errors: result.errors
    };
  } catch (error) {
    return {
      success: false,
      text: text,
      errors: [error instanceof Error ? error.message : '변환 실패']
    };
  }
});

/**
 * 파일 존재 확인
 */
ipcMain.handle('check-file-exists', async (event, filePath: string) => {
  return existsSync(filePath);
});

// ============= 앱 이벤트 핸들러 =============

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 개발 모드에서 핫 리로드
if (isDev) {
  try {
    require('electron-reloader')(module, {
      debug: true,
      watchRenderer: true
    });
  } catch {}
}
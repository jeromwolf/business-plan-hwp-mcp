/**
 * Electron Preload Script
 * 렌더러 프로세스와 메인 프로세스 간 안전한 통신 브리지
 */

import { contextBridge, ipcRenderer } from 'electron';

// 렌더러 프로세스에서 사용할 API 정의
const electronAPI = {
  // 파일 작업
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectSavePath: (defaultName: string) => ipcRenderer.invoke('select-save-path', defaultName),
  checkFileExists: (filePath: string) => ipcRenderer.invoke('check-file-exists', filePath),
  
  // Excel 처리
  processExcel: (filePath: string, options: any) => 
    ipcRenderer.invoke('process-excel', filePath, options),
  
  // DOCX 생성
  generateDocx: (data: any) => ipcRenderer.invoke('generate-docx', data),
  
  // 이미지 처리
  processImage: (imagePath: string) => ipcRenderer.invoke('process-image', imagePath),
  
  // 인코딩 변환
  convertEncoding: (text: string) => ipcRenderer.invoke('convert-encoding', text),
  
  // 메뉴 이벤트 리스너
  onMenuAction: (callback: (action: string, data?: any) => void) => {
    ipcRenderer.on('menu-open-file', () => callback('open-file'));
    ipcRenderer.on('menu-select-template', (event, template) => 
      callback('select-template', template));
    ipcRenderer.on('menu-show-guide', () => callback('show-guide'));
  },
  
  // 리스너 제거
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('menu-open-file');
    ipcRenderer.removeAllListeners('menu-select-template');
    ipcRenderer.removeAllListeners('menu-show-guide');
  }
};

// Window 객체에 API 노출
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript 타입 정의
export type ElectronAPI = typeof electronAPI;
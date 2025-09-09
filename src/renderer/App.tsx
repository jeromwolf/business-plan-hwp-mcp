/**
 * React 메인 애플리케이션 컴포넌트
 * 사업계획서 자동화 도구 UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// 컴포넌트들
import FileUploadArea from './components/FileUploadArea';
import DataPreview from './components/DataPreview';
import TemplateSelector from './components/TemplateSelector';
import CompanyInfoForm from './components/CompanyInfoForm';
import ConversionProgress from './components/ConversionProgress';
import ResultView from './components/ResultView';

// 타입 정의
interface AppState {
  currentStep: 'upload' | 'preview' | 'template' | 'info' | 'processing' | 'complete';
  selectedFile: string | null;
  tableData: any | null;
  selectedTemplate: 'basic' | 'vc' | 'government';
  companyInfo: {
    name: string;
    ceo: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  conversionResult: any | null;
  isProcessing: boolean;
  errors: string[];
}

// Window 인터페이스 확장
declare global {
  interface Window {
    electronAPI: {
      selectFile: () => Promise<string | null>;
      selectSavePath: (defaultName: string) => Promise<string | null>;
      processExcel: (filePath: string, options: any) => Promise<any>;
      generateDocx: (data: any) => Promise<any>;
      processImage: (imagePath: string) => Promise<any>;
      convertEncoding: (text: string) => Promise<any>;
      onMenuAction: (callback: (action: string, data?: any) => void) => void;
      removeAllListeners: () => void;
    };
  }
}

function App() {
  const [state, setState] = useState<AppState>({
    currentStep: 'upload',
    selectedFile: null,
    tableData: null,
    selectedTemplate: 'basic',
    companyInfo: {
      name: '',
      ceo: '',
      address: '',
      phone: '',
      email: '',
      website: ''
    },
    conversionResult: null,
    isProcessing: false,
    errors: []
  });

  // 메뉴 이벤트 리스너 설정
  useEffect(() => {
    window.electronAPI.onMenuAction((action, data) => {
      switch (action) {
        case 'open-file':
          handleFileSelect();
          break;
        case 'select-template':
          setState(prev => ({ ...prev, selectedTemplate: data }));
          break;
        case 'show-guide':
          showGuide();
          break;
      }
    });

    return () => {
      window.electronAPI.removeAllListeners();
    };
  }, []);

  // 파일 선택 처리
  const handleFileSelect = useCallback(async () => {
    const filePath = await window.electronAPI.selectFile();
    if (filePath) {
      setState(prev => ({
        ...prev,
        selectedFile: filePath,
        currentStep: 'preview',
        errors: []
      }));
      
      // Excel 파일 처리
      await processExcelFile(filePath);
    }
  }, []);

  // Excel 파일 처리
  const processExcelFile = async (filePath: string) => {
    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const result = await window.electronAPI.processExcel(filePath, {
        hasHeaders: true,
        convertSpecialChars: true,
        encoding: 'utf8'
      });
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          tableData: result.table,
          isProcessing: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          errors: result.errors || ['파일 처리 실패'],
          isProcessing: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: ['Excel 파일 처리 중 오류가 발생했습니다.'],
        isProcessing: false
      }));
    }
  };

  // 템플릿 선택
  const handleTemplateSelect = (template: 'basic' | 'vc' | 'government') => {
    setState(prev => ({
      ...prev,
      selectedTemplate: template,
      currentStep: 'info'
    }));
  };

  // 회사 정보 업데이트
  const handleCompanyInfoUpdate = (info: typeof state.companyInfo) => {
    setState(prev => ({
      ...prev,
      companyInfo: info
    }));
  };

  // DOCX 생성 시작
  const handleStartConversion = async () => {
    setState(prev => ({
      ...prev,
      currentStep: 'processing',
      isProcessing: true,
      errors: []
    }));

    try {
      // 저장 경로 선택
      const savePath = await window.electronAPI.selectSavePath(
        `사업계획서_${state.companyInfo.name || '회사명'}.docx`
      );
      
      if (!savePath) {
        setState(prev => ({
          ...prev,
          currentStep: 'info',
          isProcessing: false
        }));
        return;
      }

      // DOCX 생성
      const result = await window.electronAPI.generateDocx({
        templateType: state.selectedTemplate,
        companyInfo: state.companyInfo,
        tableData: state.tableData,
        outputPath: savePath
      });

      if (result.success) {
        setState(prev => ({
          ...prev,
          currentStep: 'complete',
          conversionResult: result,
          isProcessing: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          errors: result.errors || ['문서 생성 실패'],
          currentStep: 'info',
          isProcessing: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: ['문서 생성 중 오류가 발생했습니다.'],
        currentStep: 'info',
        isProcessing: false
      }));
    }
  };

  // 처음부터 다시 시작
  const handleReset = () => {
    setState({
      currentStep: 'upload',
      selectedFile: null,
      tableData: null,
      selectedTemplate: 'basic',
      companyInfo: {
        name: '',
        ceo: '',
        address: '',
        phone: '',
        email: '',
        website: ''
      },
      conversionResult: null,
      isProcessing: false,
      errors: []
    });
  };

  // 가이드 표시
  const showGuide = () => {
    alert(`사업계획서 자동화 도구 사용법

1. Excel 파일 업로드
   - 드래그 앤 드롭 또는 클릭하여 파일 선택
   - xlsx, xls, csv 형식 지원

2. 데이터 미리보기
   - 특수문자 변환 결과 확인
   - 테이블 구조 검증

3. 템플릿 선택
   - 기본 사업계획서
   - VC 투자용
   - 정부지원사업용

4. 회사 정보 입력
   - 필수 정보 입력

5. 문서 생성
   - DOCX 파일로 저장
   - HWP로 변환 가능`);
  };

  // 단계별 렌더링
  const renderStep = () => {
    switch (state.currentStep) {
      case 'upload':
        return (
          <FileUploadArea
            onFileSelect={handleFileSelect}
            selectedFile={state.selectedFile}
          />
        );
      
      case 'preview':
        return (
          <DataPreview
            tableData={state.tableData}
            onNext={() => setState(prev => ({ ...prev, currentStep: 'template' }))}
            onBack={() => setState(prev => ({ ...prev, currentStep: 'upload' }))}
            isLoading={state.isProcessing}
          />
        );
      
      case 'template':
        return (
          <TemplateSelector
            selectedTemplate={state.selectedTemplate}
            onSelect={handleTemplateSelect}
            onBack={() => setState(prev => ({ ...prev, currentStep: 'preview' }))}
          />
        );
      
      case 'info':
        return (
          <CompanyInfoForm
            companyInfo={state.companyInfo}
            onChange={handleCompanyInfoUpdate}
            onNext={handleStartConversion}
            onBack={() => setState(prev => ({ ...prev, currentStep: 'template' }))}
          />
        );
      
      case 'processing':
        return (
          <ConversionProgress
            isProcessing={state.isProcessing}
          />
        );
      
      case 'complete':
        return (
          <ResultView
            result={state.conversionResult}
            onNewDocument={handleReset}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>사업계획서 자동화 도구</h1>
        <p>Excel 데이터를 한글 문서로 완벽하게 변환</p>
      </header>
      
      <main className="app-main">
        {/* 진행 상태 표시 */}
        <div className="progress-indicator">
          <div className={`step ${state.currentStep === 'upload' ? 'active' : ''}`}>
            1. 파일 업로드
          </div>
          <div className={`step ${state.currentStep === 'preview' ? 'active' : ''}`}>
            2. 데이터 확인
          </div>
          <div className={`step ${state.currentStep === 'template' ? 'active' : ''}`}>
            3. 템플릿 선택
          </div>
          <div className={`step ${state.currentStep === 'info' ? 'active' : ''}`}>
            4. 정보 입력
          </div>
          <div className={`step ${state.currentStep === 'processing' || state.currentStep === 'complete' ? 'active' : ''}`}>
            5. 문서 생성
          </div>
        </div>

        {/* 에러 메시지 */}
        {state.errors.length > 0 && (
          <div className="error-messages">
            {state.errors.map((error, index) => (
              <div key={index} className="error-message">
                ⚠️ {error}
              </div>
            ))}
          </div>
        )}

        {/* 현재 단계 컨텐츠 */}
        <div className="step-content">
          {renderStep()}
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2025 Business Plan Automation Tool</p>
      </footer>
    </div>
  );
}

export default App;
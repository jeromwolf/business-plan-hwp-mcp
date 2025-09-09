/**
 * 결과 화면 컴포넌트
 * 문서 생성 완료 후 결과 표시
 */

import React from 'react';
import './ResultView.css';

interface ResultViewProps {
  result: any;
  onNewDocument: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, onNewDocument }) => {
  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}초`;
  };

  return (
    <div className="result-view-container">
      <div className="success-animation">
        <div className="checkmark-circle">
          <svg className="checkmark" viewBox="0 0 52 52">
            <circle className="checkmark-circle-bg" cx="26" cy="26" r="25" fill="none"/>
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
      </div>
      
      <h2>🎉 문서 생성 완료!</h2>
      <p className="success-message">사업계획서가 성공적으로 생성되었습니다</p>
      
      {result && (
        <div className="result-details">
          <h3>📊 생성 결과</h3>
          
          <div className="detail-grid">
            {result.filePath && (
              <div className="detail-item">
                <span className="label">저장 위치:</span>
                <span className="value file-path">{result.filePath}</span>
              </div>
            )}
            
            {result.metadata && (
              <>
                {result.metadata.tableCount !== undefined && (
                  <div className="detail-item">
                    <span className="label">포함된 테이블:</span>
                    <span className="value">{result.metadata.tableCount}개</span>
                  </div>
                )}
                
                {result.metadata.pageCount !== undefined && (
                  <div className="detail-item">
                    <span className="label">총 페이지:</span>
                    <span className="value">{result.metadata.pageCount}페이지</span>
                  </div>
                )}
                
                {result.metadata.processingTime !== undefined && (
                  <div className="detail-item">
                    <span className="label">처리 시간:</span>
                    <span className="value">{formatTime(result.metadata.processingTime)}</span>
                  </div>
                )}
              </>
            )}
            
            {result.buffer && (
              <div className="detail-item">
                <span className="label">파일 크기:</span>
                <span className="value">{formatFileSize(result.buffer.length)}</span>
              </div>
            )}
          </div>
          
          {result.warnings && result.warnings.length > 0 && (
            <div className="warnings">
              <h4>⚠️ 경고</h4>
              <ul>
                {result.warnings.map((warning: string, index: number) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="next-steps">
        <h3>다음 단계</h3>
        <div className="steps">
          <div className="step">
            <span className="step-icon">📄</span>
            <span className="step-text">생성된 DOCX 파일을 한글(HWP)에서 열어 저장</span>
          </div>
          <div className="step">
            <span className="step-icon">✏️</span>
            <span className="step-text">필요한 부분 수정 및 보완</span>
          </div>
          <div className="step">
            <span className="step-icon">📤</span>
            <span className="step-text">최종 문서 제출</span>
          </div>
        </div>
      </div>
      
      <div className="button-group">
        <button 
          onClick={() => {
            if (result?.filePath) {
              // Electron에서 파일 탐색기 열기
              require('electron').shell.showItemInFolder(result.filePath);
            }
          }}
          className="btn btn-secondary"
        >
          폴더 열기
        </button>
        <button onClick={onNewDocument} className="btn btn-primary">
          새 문서 만들기
        </button>
      </div>
    </div>
  );
};

export default ResultView;
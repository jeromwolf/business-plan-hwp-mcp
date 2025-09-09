/**
 * 파일 업로드 영역 컴포넌트
 * 드래그 앤 드롭 및 클릭으로 파일 선택
 */

import React, { useState, useCallback } from 'react';
import './FileUploadArea.css';

interface FileUploadAreaProps {
  onFileSelect: () => void;
  selectedFile: string | null;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ onFileSelect, selectedFile }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // 파일 선택 처리는 메인 프로세스에서
    onFileSelect();
  }, [onFileSelect]);

  const getFileName = (path: string | null) => {
    if (!path) return null;
    return path.split(/[/\\]/).pop();
  };

  return (
    <div className="file-upload-container">
      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onFileSelect}
      >
        <div className="upload-icon">📁</div>
        <h2>Excel 파일을 선택하세요</h2>
        <p>드래그 앤 드롭 또는 클릭하여 파일 선택</p>
        <p className="supported-formats">
          지원 형식: .xlsx, .xls, .csv
        </p>
        
        {selectedFile && (
          <div className="selected-file">
            ✅ 선택된 파일: <strong>{getFileName(selectedFile)}</strong>
          </div>
        )}
      </div>
      
      <div className="upload-tips">
        <h3>💡 팁</h3>
        <ul>
          <li>Excel 파일에 특수문자(㈜, ①, ② 등)가 있어도 자동 변환됩니다</li>
          <li>병합된 셀도 정상적으로 처리됩니다</li>
          <li>한글 인코딩 문제를 자동으로 해결합니다</li>
          <li>이미지가 포함된 경우 별도로 처리됩니다</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUploadArea;
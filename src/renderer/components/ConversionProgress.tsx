/**
 * 변환 진행 상태 컴포넌트
 * 문서 생성 진행 상황 표시
 */

import React, { useEffect, useState } from 'react';
import './ConversionProgress.css';

interface ConversionProgressProps {
  isProcessing: boolean;
}

const ConversionProgress: React.FC<ConversionProgressProps> = ({ isProcessing }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  const steps = [
    '데이터 분석 중...',
    '특수문자 변환 중...',
    '테이블 구조 생성 중...',
    '문서 템플릿 적용 중...',
    'DOCX 파일 생성 중...',
    '최종 검증 중...'
  ];

  useEffect(() => {
    if (isProcessing) {
      let currentProgress = 0;
      let stepIndex = 0;
      
      const interval = setInterval(() => {
        currentProgress += 100 / steps.length;
        
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
        } else {
          stepIndex = Math.floor((currentProgress / 100) * steps.length);
          setCurrentStep(steps[stepIndex]);
        }
        
        setProgress(currentProgress);
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  return (
    <div className="conversion-progress-container">
      <div className="progress-content">
        <div className="progress-icon">
          <div className="spinner-large"></div>
        </div>
        
        <h2>문서 생성 중...</h2>
        <p className="current-step">{currentStep || steps[0]}</p>
        
        <div className="progress-bar-wrapper">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-percentage">{Math.round(progress)}%</span>
        </div>
        
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`step-item ${index <= Math.floor((progress / 100) * steps.length) ? 'completed' : ''}`}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-text">{step}</span>
            </div>
          ))}
        </div>
        
        <p className="progress-note">
          잠시만 기다려주세요. 문서 생성이 곧 완료됩니다.
        </p>
      </div>
    </div>
  );
};

export default ConversionProgress;
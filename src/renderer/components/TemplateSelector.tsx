/**
 * 템플릿 선택 컴포넌트
 * 사업계획서 템플릿 종류 선택
 */

import React from 'react';
import './TemplateSelector.css';

interface TemplateSelectorProps {
  selectedTemplate: 'basic' | 'vc' | 'government';
  onSelect: (template: 'basic' | 'vc' | 'government') => void;
  onBack: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  selectedTemplate, 
  onSelect, 
  onBack 
}) => {
  const templates = [
    {
      id: 'basic' as const,
      title: '기본 사업계획서',
      icon: '📋',
      description: '일반적인 사업계획서 양식',
      features: [
        '사업 개요',
        '시장 분석',
        '제품/서비스 소개',
        '마케팅 전략',
        '재무 계획'
      ]
    },
    {
      id: 'vc' as const,
      title: 'VC 투자용',
      icon: '💰',
      description: '벤처캐피탈 투자 유치용',
      features: [
        'Executive Summary',
        'Problem & Solution',
        'Market Opportunity',
        'Business Model',
        'Financial Projections',
        'Team'
      ]
    },
    {
      id: 'government' as const,
      title: '정부지원사업용',
      icon: '🏛️',
      description: '정부 지원사업 신청용',
      features: [
        '사업 배경 및 필요성',
        '기술개발 계획',
        '시장분석 및 사업화',
        '연구개발 추진체계',
        '소요예산 및 조달계획'
      ]
    }
  ];

  return (
    <div className="template-selector-container">
      <h2>📑 템플릿 선택</h2>
      <p className="subtitle">사업계획서 용도에 맞는 템플릿을 선택하세요</p>
      
      <div className="template-grid">
        {templates.map(template => (
          <div 
            key={template.id}
            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => onSelect(template.id)}
          >
            <div className="template-icon">{template.icon}</div>
            <h3>{template.title}</h3>
            <p className="template-description">{template.description}</p>
            
            <div className="template-features">
              <h4>포함 내용:</h4>
              <ul>
                {template.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            
            {selectedTemplate === template.id && (
              <div className="selected-badge">✅ 선택됨</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="button-group">
        <button onClick={onBack} className="btn btn-secondary">
          이전
        </button>
        <button 
          onClick={() => onSelect(selectedTemplate)} 
          className="btn btn-primary"
        >
          다음 단계
        </button>
      </div>
    </div>
  );
};

export default TemplateSelector;
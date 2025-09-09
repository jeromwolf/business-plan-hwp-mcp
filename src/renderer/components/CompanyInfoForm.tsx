/**
 * 회사 정보 입력 폼 컴포넌트
 * 사업계획서에 들어갈 기본 정보 입력
 */

import React, { useState } from 'react';
import './CompanyInfoForm.css';

interface CompanyInfo {
  name: string;
  ceo: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

interface CompanyInfoFormProps {
  companyInfo: CompanyInfo;
  onChange: (info: CompanyInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

const CompanyInfoForm: React.FC<CompanyInfoFormProps> = ({
  companyInfo,
  onChange,
  onNext,
  onBack
}) => {
  const [errors, setErrors] = useState<Partial<CompanyInfo>>({});

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    onChange({
      ...companyInfo,
      [field]: value
    });
    
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<CompanyInfo> = {};
    
    if (!companyInfo.name.trim()) {
      newErrors.name = '회사명은 필수입니다';
    }
    
    if (!companyInfo.ceo.trim()) {
      newErrors.ceo = '대표자명은 필수입니다';
    }
    
    if (companyInfo.email && !isValidEmail(companyInfo.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }
    
    if (companyInfo.phone && !isValidPhone(companyInfo.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    return /^[\d-]+$/.test(phone);
  };

  const handleSubmit = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="company-info-container">
      <h2>🏢 회사 정보 입력</h2>
      <p className="subtitle">사업계획서에 표시될 회사 정보를 입력하세요</p>
      
      <form className="info-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div className="form-group">
          <label htmlFor="name" className="required">회사명</label>
          <input
            id="name"
            type="text"
            value={companyInfo.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="예: ㈜테크스타트"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="ceo" className="required">대표자</label>
          <input
            id="ceo"
            type="text"
            value={companyInfo.ceo}
            onChange={(e) => handleChange('ceo', e.target.value)}
            placeholder="예: 홍길동"
            className={errors.ceo ? 'error' : ''}
          />
          {errors.ceo && <span className="error-message">{errors.ceo}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="address">주소</label>
          <input
            id="address"
            type="text"
            value={companyInfo.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="예: 서울특별시 강남구 테헤란로 123"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">전화번호</label>
          <input
            id="phone"
            type="tel"
            value={companyInfo.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="예: 02-1234-5678"
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            value={companyInfo.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="예: contact@company.com"
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="website">웹사이트</label>
          <input
            id="website"
            type="url"
            value={companyInfo.website}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="예: https://www.company.com"
          />
        </div>

        <div className="form-note">
          <p>💡 <strong>팁:</strong> 특수문자(㈜, ① 등)는 자동으로 변환됩니다</p>
        </div>

        <div className="button-group">
          <button type="button" onClick={onBack} className="btn btn-secondary">
            이전
          </button>
          <button type="submit" className="btn btn-primary">
            문서 생성 시작
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyInfoForm;
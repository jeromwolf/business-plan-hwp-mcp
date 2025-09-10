/**
 * AI 엔진 모듈
 * Gemini API를 활용한 사업계획서 콘텐츠 생성
 */

class AIEngine {
    constructor() {
        // Gemini API 설정
        this.apiKey = null; // 사용자가 입력하도록 변경 예정
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/';
        this.model = 'gemini-1.5-flash'; // 최신 Gemini 1.5 Flash 모델 사용
        this.maxTokens = 4000;
    }

    /**
     * API 키 설정
     */
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
    }

    /**
     * 저장된 API 키 로드
     */
    loadApiKey() {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            this.apiKey = savedKey;
            return true;
        }
        return false;
    }

    /**
     * 사업계획서 전체 생성
     */
    async generateBusinessPlan(surveyData) {
        if (!this.apiKey) {
            // API 키가 없으면 목업 데이터 반환 (개발/테스트용)
            return this.generateMockData(surveyData);
        }

        try {
            const sections = await this.generateAllSections(surveyData);
            return this.structureBusinessPlan(surveyData, sections);
        } catch (error) {
            console.error('AI 생성 오류:', error);
            // 오류 발생 시 목업 데이터 반환
            return this.generateMockData(surveyData);
        }
    }

    /**
     * 모든 섹션 생성
     */
    async generateAllSections(surveyData) {
        const sections = {};
        const sectionPromises = [];

        // 각 섹션별 생성 (병렬 처리)
        const sectionTypes = [
            'executive_summary',
            'company_overview',
            'business_model',
            'market_analysis',
            'marketing_strategy',
            'operation_plan',
            'financial_plan',
            'team_organization',
            'risk_management'
        ];

        for (const sectionType of sectionTypes) {
            sectionPromises.push(
                this.generateSection(sectionType, surveyData)
                    .then(content => ({ type: sectionType, content }))
                    .catch(error => {
                        console.error(`섹션 생성 실패 (${sectionType}):`, error);
                        return { type: sectionType, content: this.getMockSectionContent(sectionType, surveyData) };
                    })
            );
        }

        const results = await Promise.all(sectionPromises);
        
        results.forEach(result => {
            sections[result.type] = result.content;
        });

        return sections;
    }

    /**
     * 개별 섹션 생성
     */
    async generateSection(sectionType, surveyData) {
        const prompt = this.buildSectionPrompt(sectionType, surveyData);
        
        if (!this.apiKey) {
            // 목업 데이터 반환
            return this.getMockSectionContent(sectionType, surveyData);
        }

        const response = await this.callGeminiAPI(prompt);
        return this.parseAIResponse(response);
    }

    /**
     * 섹션별 프롬프트 생성
     */
    buildSectionPrompt(sectionType, surveyData) {
        const systemPrompt = `당신은 한국의 사업계획서 작성 전문가입니다. 
제공된 정보를 바탕으로 전문적이고 설득력 있는 사업계획서를 작성합니다.
한국 비즈니스 관행과 투자자/정부기관의 선호도를 고려합니다.
구체적인 수치와 실행 가능한 계획을 포함합니다.`;

        const sectionPrompts = {
            executive_summary: `
다음 정보로 사업계획서 요약을 작성하세요:
- 회사명: ${surveyData.basic?.companyName || ''}
- 업종: ${surveyData.basic?.industry || ''}
- 해결하려는 문제: ${surveyData.business?.problem || ''}
- 제공하는 솔루션: ${surveyData.business?.solution || ''}
- 타겟 시장: ${surveyData.business?.targetMarket || ''}
- 필요 자금: ${surveyData.financial?.fundingNeed || ''}

요구사항:
1. 3-4 문단으로 작성
2. 핵심 가치 제안 명확히 표현
3. 시장 기회와 성장 가능성 강조
4. 투자 매력 포인트 포함`,

            company_overview: `
다음 정보로 회사 개요를 작성하세요:
- 회사명: ${surveyData.basic?.companyName || ''}
- 업종: ${surveyData.basic?.industry || ''}
- 사업 단계: ${surveyData.basic?.stage || ''}

포함 내용:
1. 회사 설립 배경과 미션
2. 핵심 가치와 비전
3. 주요 연혁 (가상으로 작성)
4. 법인 정보 및 조직 구조`,

            business_model: `
다음 정보로 비즈니스 모델을 상세히 설명하세요:
- 솔루션: ${surveyData.business?.solution || ''}
- 타겟 고객: ${surveyData.business?.targetMarket || ''}
- 업종 특성: ${surveyData.basic?.industry || ''}

포함 내용:
1. 제품/서비스 상세 설명
2. 수익 모델 (B2B/B2C/B2G 등)
3. 가격 전략
4. 경쟁 우위 요소`,

            market_analysis: `
다음 정보로 시장 분석을 작성하세요:
- 타겟 시장: ${surveyData.business?.targetMarket || ''}
- 업종: ${surveyData.basic?.industry || ''}
- 문제점: ${surveyData.business?.problem || ''}

포함 내용:
1. 시장 규모와 성장률 (한국 시장 기준)
2. 목표 고객 세분화
3. 경쟁사 분석 (3-5개 주요 경쟁사)
4. 시장 진입 전략`,

            marketing_strategy: `
마케팅 전략을 작성하세요:
- 타겟 고객: ${surveyData.business?.targetMarket || ''}
- 제품/서비스: ${surveyData.business?.solution || ''}

포함 내용:
1. 브랜드 포지셔닝
2. 고객 획득 전략 (온/오프라인)
3. 판매 채널 전략
4. 프로모션 계획`,

            operation_plan: `
운영 계획을 작성하세요:
- 사업 단계: ${surveyData.basic?.stage || ''}
- 업종: ${surveyData.basic?.industry || ''}

포함 내용:
1. 핵심 운영 프로세스
2. 생산/서비스 제공 계획
3. 공급망 관리
4. 품질 관리 체계`,

            financial_plan: `
재무 계획을 작성하세요:
- 필요 자금: ${surveyData.financial?.fundingNeed || ''}
- 사업 단계: ${surveyData.basic?.stage || ''}

포함 내용:
1. 자금 조달 계획
2. 매출 예측 (3개년)
3. 손익 계획
4. 투자금 사용 계획`,

            team_organization: `
팀 구성과 조직을 설명하세요:
- 회사명: ${surveyData.basic?.companyName || ''}
- 사업 단계: ${surveyData.basic?.stage || ''}

포함 내용:
1. 핵심 경영진 소개
2. 조직도
3. 인력 운영 계획
4. 핵심 역량과 전문성`,

            risk_management: `
리스크 관리 계획을 작성하세요:
- 업종: ${surveyData.basic?.industry || ''}
- 사업 단계: ${surveyData.basic?.stage || ''}

포함 내용:
1. 주요 리스크 식별
2. 리스크별 대응 전략
3. 비상 계획
4. 보험 및 법적 보호 방안`
        };

        return {
            system: systemPrompt,
            user: sectionPrompts[sectionType] || '해당 섹션의 내용을 작성해주세요.'
        };
    }

    /**
     * Gemini API 호출
     */
    async callGeminiAPI(prompt) {
        const url = `${this.apiEndpoint}${this.model}:generateContent?key=${this.apiKey}`;
        
        const headers = {
            'Content-Type': 'application/json'
        };

        // Gemini API 형식에 맞게 변환
        const body = {
            contents: [
                {
                    parts: [
                        {
                            text: `${prompt.system}\n\n${prompt.user}`
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: this.maxTokens,
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`API 오류 (${response.status}):`, error);
                throw new Error(`API 오류: ${response.status} - ${error}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Gemini API 호출 실패:', error);
            throw error;
        }
    }

    /**
     * AI 응답 파싱
     */
    parseAIResponse(response) {
        // Gemini API 응답 형식
        if (response.candidates && response.candidates[0]) {
            const candidate = response.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
                return candidate.content.parts[0].text;
            }
        }
        return '';
    }

    /**
     * 사업계획서 구조화
     */
    structureBusinessPlan(surveyData, sections) {
        return {
            // 기본 정보
            company: surveyData.basic?.companyName || '회사명',
            ceo: '대표이사',
            establishDate: new Date().toISOString().slice(0, 10),
            businessModel: sections.business_model || '',
            revenueModel: this.extractRevenueModel(sections.business_model),
            
            // 섹션별 콘텐츠
            sections: {
                executive_summary: sections.executive_summary || '',
                company_overview: sections.company_overview || '',
                business_model: sections.business_model || '',
                market_analysis: sections.market_analysis || '',
                marketing_strategy: sections.marketing_strategy || '',
                operation_plan: sections.operation_plan || '',
                financial_plan: sections.financial_plan || '',
                team_organization: sections.team_organization || '',
                risk_management: sections.risk_management || ''
            },
            
            // 메타 정보
            metadata: {
                generatedAt: new Date().toISOString(),
                surveyData: surveyData,
                aiModel: this.model
            }
        };
    }

    /**
     * 수익 모델 추출
     */
    extractRevenueModel(businessModelText) {
        // 비즈니스 모델 텍스트에서 수익 모델 부분 추출
        const keywords = ['수익 모델', '수익 구조', '매출 방식'];
        // 간단한 추출 로직 (향후 개선 필요)
        return '구독 기반 SaaS 모델';
    }

    /**
     * 목업 데이터 생성 (개발/테스트용)
     */
    generateMockData(surveyData) {
        const companyName = surveyData.basic?.companyName || '테스트 회사';
        const industry = surveyData.basic?.industry || 'IT/소프트웨어';
        
        return {
            company: companyName,
            ceo: '홍길동',
            establishDate: '2024-01-01',
            businessModel: `${companyName}는 ${industry} 분야의 혁신적인 솔루션을 제공합니다.`,
            revenueModel: 'SaaS 구독 모델',
            
            sections: {
                executive_summary: `${companyName}는 ${industry} 분야에서 혁신적인 솔루션을 제공하는 스타트업입니다. 
                우리는 고객의 문제를 해결하고 시장의 니즈를 충족시키기 위해 노력하고 있습니다.`,
                
                company_overview: `회사 개요: ${companyName}는 2024년에 설립된 ${industry} 전문 기업입니다.`,
                
                business_model: `비즈니스 모델: B2B SaaS 플랫폼을 통해 기업 고객에게 서비스를 제공합니다.`,
                
                market_analysis: `시장 분석: ${industry} 시장은 연평균 15% 성장하고 있으며, 2025년까지 500억 규모로 성장할 전망입니다.`,
                
                marketing_strategy: `마케팅 전략: 디지털 마케팅과 파트너십을 통한 시장 진출 전략을 수립했습니다.`,
                
                operation_plan: `운영 계획: 효율적인 개발 프로세스와 고객 지원 체계를 구축했습니다.`,
                
                financial_plan: `재무 계획: 3년 내 손익분기점 달성을 목표로 하고 있습니다.`,
                
                team_organization: `팀 구성: 업계 경험이 풍부한 전문가들로 구성되어 있습니다.`,
                
                risk_management: `리스크 관리: 시장, 기술, 재무 리스크에 대한 대응 방안을 마련했습니다.`
            },
            
            metadata: {
                generatedAt: new Date().toISOString(),
                surveyData: surveyData,
                aiModel: 'mock'
            }
        };
    }

    /**
     * 개별 섹션 목업 콘텐츠
     */
    getMockSectionContent(sectionType, surveyData) {
        const mockContents = {
            executive_summary: `[요약]
${surveyData.basic?.companyName || '우리 회사'}는 ${surveyData.basic?.industry || 'IT'} 분야의 선도 기업을 목표로 합니다.
주요 고객은 ${surveyData.business?.targetMarket || '중소기업'}이며, 
${surveyData.business?.problem || '업무 효율성 문제'}를 해결하는 
${surveyData.business?.solution || '혁신적인 솔루션'}을 제공합니다.`,

            company_overview: `[회사 개요]
설립일: 2024년 1월
업종: ${surveyData.basic?.industry || 'IT/소프트웨어'}
사업 단계: ${surveyData.basic?.stage || '초기 운영'}
미션: 고객의 성공을 돕는 최고의 파트너가 되자`,

            // ... 다른 섹션들도 유사하게 작성
        };

        return mockContents[sectionType] || `[${sectionType}] 섹션 내용이 생성됩니다.`;
    }
}

// 전역 인스턴스 생성
const aiEngine = new AIEngine();
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
            return this.generateMockDataV2(surveyData);
        }

        try {
            const sections = await this.generateAllSectionsV2(surveyData);
            return this.structureBusinessPlanV2(surveyData, sections);
        } catch (error) {
            console.error('AI 생성 오류:', error);
            // 오류 발생 시 목업 데이터 반환
            return this.generateMockDataV2(surveyData);
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
    
    /**
     * V2: 5개 섹션 생성
     */
    async generateAllSectionsV2(surveyData) {
        const sections = {};
        
        // 5개 섹션 생성
        const sectionPromises = [
            this.generateSectionV2('section1', surveyData),
            this.generateSectionV2('section2', surveyData),
            this.generateSectionV2('section3', surveyData),
            this.generateSectionV2('section4', surveyData),
            this.generateSectionV2('section5', surveyData)
        ];
        
        const results = await Promise.all(sectionPromises);
        
        results.forEach((content, index) => {
            sections[`section${index + 1}`] = content;
        });
        
        return sections;
    }
    
    /**
     * V2: 개별 섹션 생성
     */
    async generateSectionV2(sectionType, surveyData) {
        const prompt = this.buildSectionPromptV2(sectionType, surveyData);
        
        if (!this.apiKey) {
            return this.getMockSectionContentV2(sectionType, surveyData);
        }
        
        try {
            const response = await this.callGeminiAPI(prompt);
            return this.parseAIResponse(response);
        } catch (error) {
            console.error(`섹션 생성 실패 (${sectionType}):`, error);
            return this.getMockSectionContentV2(sectionType, surveyData);
        }
    }
    
    /**
     * V2: 섹션별 프롬프트 생성
     */
    buildSectionPromptV2(sectionType, surveyData) {
        const systemPrompt = `당신은 한국의 사업계획서 작성 전문가입니다. 
제공된 정보를 바탕으로 전문적이고 상세한 사업계획서 섹션을 작성해주세요.
구체적인 내용과 실제적인 계획을 포함해주세요.`;
        
        let userPrompt = '';
        
        switch(sectionType) {
            case 'section1':
                const s1 = surveyData.section1_overview || {};
                userPrompt = `다음 정보로 '사업 개요' 섹션을 상세히 작성해주세요:
- 회사명: ${s1.companyName}
- 사업 아이템: ${s1.businessItem}
- 대표자: ${s1.ceoName}
- 설립일: ${s1.foundedDate}
- 사업 목표: ${s1.businessGoal}

포함할 내용:
1. 회사 소개 및 설립 배경
2. 사업 아이템 상세 설명
3. 비전과 미션
4. 핵심 가치
5. 주요 연혁 및 계획`;
                break;
                
            case 'section2':
                const s2 = surveyData.section2_market || {};
                userPrompt = `다음 정보로 '시장 분석' 섹션을 상세히 작성해주세요:
- 목표 시장: ${s2.targetMarket}
- 시장 성장률: ${s2.marketGrowth}
- 경쟁사: ${s2.competitors}
- 경쟁 우위: ${s2.competitiveAdvantage}

포함할 내용:
1. 시장 규모와 성장성 분석
2. 목표 고객 세분화
3. 경쟁사 상세 분석
4. SWOT 분석
5. 시장 진입 전략`;
                break;
                
            case 'section3':
                const s3 = surveyData.section3_product || {};
                userPrompt = `다음 정보로 '제품/서비스' 섹션을 상세히 작성해주세요:
- 주요 제품: ${s3.mainProduct}
- 핵심 기능: ${s3.productFeatures}
- 핵심 기술: ${s3.technology}
- 가격 정책: ${s3.pricing}

포함할 내용:
1. 제품/서비스 상세 설명
2. 핵심 기능과 차별화 요소
3. 기술적 우위
4. 개발 로드맵
5. 가격 전략과 수익 구조`;
                break;
                
            case 'section4':
                const s4 = surveyData.section4_marketing || {};
                userPrompt = `다음 정보로 '마케팅 전략' 섹션을 상세히 작성해주세요:
- 타겟 고객: ${s4.targetCustomer}
- 마케팅 채널: ${s4.marketingChannels}
- 판매 전략: ${s4.salesStrategy}
- 고객 확보: ${s4.customerAcquisition}

포함할 내용:
1. 타겟 고객 상세 분석
2. 브랜드 포지셔닝
3. 마케팅 믹스 (4P)
4. 온/오프라인 마케팅 전략
5. 고객 유지 및 확대 전략`;
                break;
                
            case 'section5':
                const s5 = surveyData.section5_financial || {};
                userPrompt = `다음 정보로 '재무 계획' 섹션을 상세히 작성해주세요:
- 초기 투자금: ${s5.initialInvestment}
- 수익 모델: ${s5.revenueModel}
- 1차년도 매출: ${s5.year1Revenue}
- 2차년도 매출: ${s5.year2Revenue}
- 3차년도 매출: ${s5.year3Revenue}
- 손익분기점: ${s5.breakEven}

포함할 내용:
1. 자금 조달 계획
2. 3개년 매출 계획 상세
3. 비용 구조 분석
4. 손익 계산서
5. 투자 회수 계획`;
                break;
        }
        
        return {
            system: systemPrompt,
            user: userPrompt
        };
    }
    
    /**
     * V2: 사업계획서 구조화
     */
    structureBusinessPlanV2(surveyData, sections) {
        const s1 = surveyData.section1_overview || {};
        
        return {
            // 기본 정보
            companyName: s1.companyName || '회사명',
            ceoName: s1.ceoName || '대표자',
            foundedDate: s1.foundedDate || '2024년',
            businessItem: s1.businessItem || '사업 아이템',
            
            // 5개 섹션 콘텐츠
            sections: {
                section1: sections.section1 || '',
                section2: sections.section2 || '',
                section3: sections.section3 || '',
                section4: sections.section4 || '',
                section5: sections.section5 || ''
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
     * V2: 목업 데이터 생성
     */
    generateMockDataV2(surveyData) {
        const s1 = surveyData.section1_overview || {};
        const s2 = surveyData.section2_market || {};
        const s3 = surveyData.section3_product || {};
        const s4 = surveyData.section4_marketing || {};
        const s5 = surveyData.section5_financial || {};
        
        return {
            companyName: s1.companyName || '테스트 회사',
            ceoName: s1.ceoName || '김철수',
            foundedDate: s1.foundedDate || '2024년 1월',
            businessItem: s1.businessItem || 'AI 솔루션',
            
            sections: {
                section1: this.getMockSectionContentV2('section1', surveyData),
                section2: this.getMockSectionContentV2('section2', surveyData),
                section3: this.getMockSectionContentV2('section3', surveyData),
                section4: this.getMockSectionContentV2('section4', surveyData),
                section5: this.getMockSectionContentV2('section5', surveyData)
            },
            
            metadata: {
                generatedAt: new Date().toISOString(),
                surveyData: surveyData,
                aiModel: 'mock'
            }
        };
    }
    
    /**
     * V2: 섹션별 목업 콘텐츠
     */
    getMockSectionContentV2(sectionType, surveyData) {
        const mockContents = {
            section1: `[사업 개요]
회사명: ${surveyData.section1_overview?.companyName || '(주)테크이노베이션'}
대표자: ${surveyData.section1_overview?.ceoName || '김철수'}
설립일: ${surveyData.section1_overview?.foundedDate || '2024년 1월'}
사업 아이템: ${surveyData.section1_overview?.businessItem || 'AI 기반 스마트팜 솔루션'}

1. 회사 소개
${surveyData.section1_overview?.companyName || '(주)테크이노베이션'}은 최첨단 AI 기술을 활용한 스마트팜 솔루션을 제공하는 농업 기술 전문 기업입니다. 
${surveyData.section1_overview?.businessGoal || '국내 최고의 AI 농업 솔루션 기업으로 성장'}을 목표로 하고 있습니다.

2. 사업 배경
농업 인구 감소와 기후 변화로 인한 농업 생산성 저하 문제를 해결하기 위해 설립되었습니다.

3. 핵심 가치
- 혁신: 최신 AI 기술 적용
- 신뢰: 농가와의 상생
- 지속가능성: 친환경 농업 실현`,
            
            section2: `[시장 분석]
목표 시장: ${surveyData.section2_market?.targetMarket || '국내 스마트팜 시장'}
시장 규모: ${surveyData.section2_market?.marketGrowth || '연평균 15% 성장'}

1. 시장 현황
${surveyData.section2_market?.targetMarket || '국내 스마트팜 시장은 2023년 기준 약 5조원 규모로 추정되며'}, 
${surveyData.section2_market?.marketGrowth || '연평균 15% 이상 성장하여 2025년에는 10조원 규모로 확대될 전망입니다'}.

2. 경쟁 환경
주요 경쟁사: ${surveyData.section2_market?.competitors || 'A사(30%), B사(25%), C사(20%)'}
우리의 경쟁 우위: ${surveyData.section2_market?.competitiveAdvantage || '특허 기술, 가격 경쟁력, 맞춤형 서비스'}

3. 시장 기회
- 정부의 스마트팜 육성 정책
- 청년 농업인 증가
- ESG 경영 확산`,
            
            section3: `[제품/서비스]
주요 제품: ${surveyData.section3_product?.mainProduct || 'AI 기반 작물 생육 예측 시스템'}

1. 제품 개요
${surveyData.section3_product?.mainProduct || 'AI 기반 작물 생육 예측 시스템'}은 딥러닝 기술을 활용하여 
작물의 생육 상태를 실시간으로 모니터링하고 최적의 재배 환경을 제공합니다.

2. 핵심 기능
${surveyData.section3_product?.productFeatures || '1) 실시간 모니터링 2) 자동 환경 제어 3) 수확량 예측 4) 병해충 조기 진단'}

3. 기술적 우위
${surveyData.section3_product?.technology || '딥러닝, IoT 센서, 빅데이터 분석'} 기술을 통합하여 
업계 최고 수준의 정확도(95% 이상)를 달성했습니다.

4. 가격 정책
${surveyData.section3_product?.pricing || '월 구독료 50만원, 초기 설치비 500만원'}`,
            
            section4: `[마케팅 전략]
타겟 고객: ${surveyData.section4_marketing?.targetCustomer || '중대형 스마트팜 운영 농가'}

1. 목표 고객
${surveyData.section4_marketing?.targetCustomer || '중대형 스마트팜 운영 농가 및 농업 법인'}을 주요 타겟으로 설정하였습니다.

2. 마케팅 채널
${surveyData.section4_marketing?.marketingChannels || 'B2B 직접 영업, 농업 박람회 참가, 온라인 마케팅'}을 통해 
고객에게 접근할 계획입니다.

3. 판매 전략
${surveyData.section4_marketing?.salesStrategy || '파트너사 협력, 정부 지원사업 연계'}를 통해 
초기 시장 진입을 가속화할 예정입니다.

4. 고객 확보
${surveyData.section4_marketing?.customerAcquisition || '무료 시범 서비스, 얼리어답터 할인'} 등의 
프로모션을 통해 초기 고객을 확보하겠습니다.`,
            
            section5: `[재무 계획]
필요 투자금: ${surveyData.section5_financial?.initialInvestment || '10억원'}

1. 자금 조달 계획
초기 투자금 ${surveyData.section5_financial?.initialInvestment || '10억원'}은 
시드 투자(5억원) + 정부 지원금(3억원) + 자체 자금(2억원)으로 조달 예정입니다.

2. 매출 계획
- 1차년도: ${surveyData.section5_financial?.year1Revenue || '5억원'}
- 2차년도: ${surveyData.section5_financial?.year2Revenue || '15억원'}
- 3차년도: ${surveyData.section5_financial?.year3Revenue || '30억원'}

3. 수익 구조
${surveyData.section5_financial?.revenueModel || 'SaaS 구독료(70%), 설치/유지보수(20%), 컨설팅(10%)'}

4. 손익분기점
${surveyData.section5_financial?.breakEven || '2차년도 하반기'} 달성 예정

5. 투자 회수
3년 내 투자금 전액 회수 및 영업이익률 20% 달성 목표`
        };
        
        return mockContents[sectionType] || `[${sectionType}] 섹션 내용`;
    }
}

// 전역 인스턴스 생성
const aiEngine = new AIEngine();
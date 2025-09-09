/**
 * 인코딩 처리 모듈
 * UTF-8, EUC-KR, CP949 변환 및 특수문자 처리
 * Phase 1 테스트 결과를 바탕으로 구현
 */

import iconv from 'iconv-lite';

// 특수문자 매핑 테이블 (Phase 1에서 검증된 것)
export const SPECIAL_CHAR_MAP: Record<string, string> = {
  // 회사 형태
  '㈜': '(주)',
  '㈏': '(가)',
  '㈐': '(나)',
  '㈑': '(다)',
  '㈒': '(라)',
  
  // 원문자
  '①': '(1)', '②': '(2)', '③': '(3)', '④': '(4)', '⑤': '(5)',
  '⑥': '(6)', '⑦': '(7)', '⑧': '(8)', '⑨': '(9)', '⑩': '(10)',
  '⑪': '(11)', '⑫': '(12)', '⑬': '(13)', '⑭': '(14)', '⑮': '(15)',
  
  // 상표 기호
  '™': 'TM',
  '®': '(R)',
  '©': '(C)',
  
  // 통화
  '₩': '원',
  '¥': '엔',
  '€': '유로',
  '£': '파운드',
  
  // 문장 부호
  '：': ':',
  '；': ';',
  '！': '!',
  '？': '?',
  '～': '~',
  '－': '-',
  '․': '·',
  '‥': '..',
  '…': '...',
  '″': '"',
  '′': "'",
  '※': '*',
  
  // 도형 기호
  '◎': '◎', '○': 'O', '●': '●',
  '◇': '◇', '◆': '◆',
  '□': '□', '■': '■',
  '△': '△', '▲': '▲',
  '▽': '▽', '▼': '▼',
  
  // 카드 기호 (유지)
  '♤': '♤', '♠': '♠',
  '♡': '♡', '♥': '♥',
  '♧': '♧', '♣': '♣',
  
  // 기타
  '⊙': '⊙',
  '◈': '◈',
  '▣': '▣'
};

// 지원하는 인코딩 타입
export type SupportedEncoding = 'utf8' | 'euc-kr' | 'cp949';

// 인코딩 감지 결과
export interface EncodingDetectionResult {
  encoding: SupportedEncoding;
  confidence: number; // 0-1 사이의 신뢰도
  isValid: boolean;
}

// 변환 결과
export interface ConversionResult {
  success: boolean;
  text: string;
  originalEncoding: SupportedEncoding;
  targetEncoding: SupportedEncoding;
  specialCharsConverted: number;
  errors?: string[];
}

/**
 * 인코딩 자동 감지 클래스
 */
export class EncodingDetector {
  /**
   * 버퍼에서 인코딩을 자동 감지
   */
  static detect(buffer: Buffer): EncodingDetectionResult {
    // BOM 체크 (UTF-8)
    if (buffer.length >= 3 && 
        buffer[0] === 0xEF && 
        buffer[1] === 0xBB && 
        buffer[2] === 0xBF) {
      return {
        encoding: 'utf8',
        confidence: 1.0,
        isValid: true
      };
    }
    
    // UTF-8 검증
    const utf8Result = this.tryUTF8(buffer);
    if (utf8Result.isValid && utf8Result.confidence > 0.8) {
      return utf8Result;
    }
    
    // EUC-KR 검증
    const eucKrResult = this.tryEUCKR(buffer);
    if (eucKrResult.isValid && eucKrResult.confidence > 0.8) {
      return eucKrResult;
    }
    
    // CP949 검증
    const cp949Result = this.tryCP949(buffer);
    if (cp949Result.isValid && cp949Result.confidence > 0.8) {
      return cp949Result;
    }
    
    // 가장 신뢰도 높은 것 반환
    const results = [utf8Result, eucKrResult, cp949Result]
      .sort((a, b) => b.confidence - a.confidence);
    
    return results[0];
  }
  
  /**
   * UTF-8 검증
   */
  private static tryUTF8(buffer: Buffer): EncodingDetectionResult {
    try {
      const text = buffer.toString('utf8');
      const reEncoded = Buffer.from(text, 'utf8');
      
      // 바이트 단위로 비교
      const matches = this.compareBuffers(buffer, reEncoded);
      const confidence = matches / buffer.length;
      
      return {
        encoding: 'utf8',
        confidence,
        isValid: confidence > 0.9 && !text.includes('�')
      };
    } catch (error) {
      return {
        encoding: 'utf8',
        confidence: 0,
        isValid: false
      };
    }
  }
  
  /**
   * EUC-KR 검증
   */
  private static tryEUCKR(buffer: Buffer): EncodingDetectionResult {
    try {
      const text = iconv.decode(buffer, 'euc-kr');
      const reEncoded = iconv.encode(text, 'euc-kr');
      
      const matches = this.compareBuffers(buffer, reEncoded);
      const confidence = matches / buffer.length;
      
      return {
        encoding: 'euc-kr',
        confidence,
        isValid: confidence > 0.9 && !text.includes('�')
      };
    } catch (error) {
      return {
        encoding: 'euc-kr',
        confidence: 0,
        isValid: false
      };
    }
  }
  
  /**
   * CP949 검증
   */
  private static tryCP949(buffer: Buffer): EncodingDetectionResult {
    try {
      const text = iconv.decode(buffer, 'cp949');
      const reEncoded = iconv.encode(text, 'cp949');
      
      const matches = this.compareBuffers(buffer, reEncoded);
      const confidence = matches / buffer.length;
      
      return {
        encoding: 'cp949',
        confidence,
        isValid: confidence > 0.9 && !text.includes('�')
      };
    } catch (error) {
      return {
        encoding: 'cp949',
        confidence: 0,
        isValid: false
      };
    }
  }
  
  /**
   * 두 버퍼를 비교하여 일치하는 바이트 수 반환
   */
  private static compareBuffers(buf1: Buffer, buf2: Buffer): number {
    const minLength = Math.min(buf1.length, buf2.length);
    let matches = 0;
    
    for (let i = 0; i < minLength; i++) {
      if (buf1[i] === buf2[i]) {
        matches++;
      }
    }
    
    return matches;
  }
}

/**
 * 인코딩 변환기 클래스
 */
export class EncodingConverter {
  private specialCharMap: Record<string, string>;
  
  constructor(customMap?: Record<string, string>) {
    this.specialCharMap = { ...SPECIAL_CHAR_MAP, ...customMap };
  }
  
  /**
   * 특수문자 변환
   */
  convertSpecialChars(text: string): { text: string; converted: number } {
    let converted = 0;
    let result = text;
    
    for (const [from, to] of Object.entries(this.specialCharMap)) {
      const regex = new RegExp(from, 'g');
      const matches = (result.match(regex) || []).length;
      if (matches > 0) {
        result = result.replace(regex, to);
        converted += matches;
      }
    }
    
    return { text: result, converted };
  }
  
  /**
   * 안전한 인코딩 변환
   */
  async convert(
    input: string | Buffer,
    fromEncoding: SupportedEncoding,
    toEncoding: SupportedEncoding
  ): Promise<ConversionResult> {
    try {
      // 입력 처리
      let text: string;
      if (Buffer.isBuffer(input)) {
        if (fromEncoding === 'utf8') {
          text = input.toString('utf8');
        } else {
          text = iconv.decode(input, fromEncoding);
        }
      } else {
        text = input;
      }
      
      // 특수문자 변환
      const { text: convertedText, converted: specialCharsConverted } = 
        this.convertSpecialChars(text);
      
      // 인코딩 변환
      let finalText: string;
      if (fromEncoding === toEncoding) {
        finalText = convertedText;
      } else {
        // 중간 버퍼를 통한 안전한 변환
        const buffer = fromEncoding === 'utf8' 
          ? Buffer.from(convertedText, 'utf8')
          : iconv.encode(convertedText, fromEncoding);
          
        finalText = toEncoding === 'utf8'
          ? buffer.toString('utf8')
          : iconv.decode(buffer, toEncoding);
      }
      
      // 깨진 문자 검증
      const hasGarbageChars = finalText.includes('�') || 
                              finalText.includes('\uFFFD');
      
      return {
        success: !hasGarbageChars,
        text: finalText,
        originalEncoding: fromEncoding,
        targetEncoding: toEncoding,
        specialCharsConverted,
        errors: hasGarbageChars ? ['일부 문자가 깨졌습니다'] : undefined
      };
      
    } catch (error) {
      return {
        success: false,
        text: input.toString(),
        originalEncoding: fromEncoding,
        targetEncoding: toEncoding,
        specialCharsConverted: 0,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      };
    }
  }
  
  /**
   * 자동 감지 후 변환
   */
  async autoConvert(
    input: string | Buffer,
    targetEncoding: SupportedEncoding
  ): Promise<ConversionResult> {
    const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
    const detection = EncodingDetector.detect(buffer);
    
    if (!detection.isValid) {
      // 폴백: UTF-8로 시도
      return this.convert(input, 'utf8', targetEncoding);
    }
    
    return this.convert(input, detection.encoding, targetEncoding);
  }
  
  /**
   * 깨진 문자 복구 시도
   */
  repairBrokenChars(text: string, context?: string): string {
    let repaired = text;
    
    // 연속된 물음표 패턴 처리
    repaired = repaired.replace(/\?{2,}/g, '□'); // 알 수 없는 문자로 표시
    
    // 유니코드 replacement 문자 처리
    repaired = repaired.replace(/\uFFFD/g, '□');
    
    // 컨텍스트 기반 복구 (간단한 예)
    if (context) {
      if (context.includes('회사') && repaired.includes('□')) {
        // 회사명 컨텍스트에서 □를 추정
        repaired = repaired.replace(/□/g, '(주)');
      } else if (context.includes('숫자') && repaired.includes('□')) {
        // 숫자 컨텍스트에서 □를 추정
        repaired = repaired.replace(/□/g, '(1)');
      }
    }
    
    return repaired;
  }
  
  /**
   * 전각 문자를 반각으로 변환
   */
  toHalfWidth(text: string): string {
    return text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    });
  }
  
  /**
   * 안전한 ASCII 변환 (폴백용)
   */
  toSafeASCII(text: string): string {
    return text
      .replace(/[^\x00-\x7F]/g, '?') // 비ASCII 문자를 ?로 대체
      .replace(/\?+/g, '[?]'); // 연속 ?를 [?]로 대체
  }
}

/**
 * 편의 함수들
 */
export class EncodingUtils {
  private static converter = new EncodingConverter();
  
  /**
   * 간단한 특수문자 변환
   */
  static convertSpecialChars(text: string): string {
    return this.converter.convertSpecialChars(text).text;
  }
  
  /**
   * 자동 감지 후 UTF-8로 변환
   */
  static async toUTF8(input: string | Buffer): Promise<string> {
    const result = await this.converter.autoConvert(input, 'utf8');
    return result.text;
  }
  
  /**
   * 자동 감지 후 EUC-KR로 변환
   */
  static async toEUCKR(input: string | Buffer): Promise<string> {
    const result = await this.converter.autoConvert(input, 'euc-kr');
    return result.text;
  }
  
  /**
   * DOCX 생성용 안전한 텍스트 변환
   */
  static async toDOCXSafe(text: string): Promise<string> {
    const converter = new EncodingConverter();
    
    // 특수문자 변환
    const { text: converted } = converter.convertSpecialChars(text);
    
    // 전각 → 반각
    const halfWidth = converter.toHalfWidth(converted);
    
    // 제어 문자 제거
    const cleaned = halfWidth.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    return cleaned.trim();
  }
}

export default EncodingConverter;
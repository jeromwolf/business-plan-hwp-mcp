/**
 * 이미지 처리 모듈
 * 사업계획서용 이미지 최적화 및 DOCX 삽입 처리
 * Sharp 라이브러리 기반 고성능 이미지 처리
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, extname, basename } from 'path';
import { v4 as uuidv4 } from 'uuid';

// 지원하는 이미지 형식
export type SupportedImageFormat = 'jpeg' | 'jpg' | 'png' | 'gif' | 'bmp' | 'tiff' | 'webp';

// 이미지 크기 옵션
export interface ImageResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: string;
  background?: string;
  withoutEnlargement?: boolean;
}

// 이미지 품질 옵션
export interface ImageQualityOptions {
  quality?: number; // 1-100
  progressive?: boolean; // JPEG용
  compressionLevel?: number; // PNG용
  effort?: number; // WebP용
}

// 워터마크 옵션
export interface WatermarkOptions {
  text?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity?: number; // 0-1
  fontSize?: number;
  color?: string;
  background?: string;
}

// 이미지 메타데이터
export interface ImageMetadata {
  format: string;
  width: number;
  height: number;
  channels: number;
  density?: number;
  hasProfile?: boolean;
  hasAlpha?: boolean;
  size: number; // 파일 크기 (bytes)
  originalPath: string;
}

// 처리된 이미지 정보
export interface ProcessedImage {
  originalPath: string;
  processedPath?: string;
  buffer: Buffer;
  metadata: ImageMetadata;
  optimized: {
    sizeBefore: number;
    sizeAfter: number;
    compressionRatio: number;
  };
  errors?: string[];
  warnings?: string[];
}

// 이미지 처리 옵션
export interface ImageProcessingOptions {
  resize?: ImageResizeOptions;
  quality?: ImageQualityOptions;
  format?: SupportedImageFormat;
  watermark?: WatermarkOptions;
  outputDir?: string;
  keepOriginal?: boolean;
  maxFileSize?: number; // MB
  docxOptimized?: boolean; // DOCX 최적화 여부
}

// 배치 처리 결과
export interface BatchProcessingResult {
  success: boolean;
  processed: ProcessedImage[];
  failed: { path: string; error: string }[];
  totalSizeBefore: number;
  totalSizeAfter: number;
  processingTime: number;
}

/**
 * 이미지 처리기 클래스
 */
export class ImageProcessor {
  private tempDir: string;
  
  // DOCX 최적화 기본 설정
  private docxOptimizedSettings: ImageProcessingOptions = {
    resize: {
      width: 800,
      height: 600,
      fit: 'inside',
      withoutEnlargement: true
    },
    quality: {
      quality: 85,
      progressive: true
    },
    format: 'jpeg',
    maxFileSize: 2 // 2MB
  };
  
  constructor(tempDir?: string) {
    this.tempDir = tempDir || join(process.cwd(), 'temp', 'images');
    this.ensureTempDir();
  }
  
  /**
   * 단일 이미지 처리
   */
  async processImage(
    imagePath: string,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    try {
      if (!existsSync(imagePath)) {
        throw new Error(`이미지 파일을 찾을 수 없습니다: ${imagePath}`);
      }
      
      // 원본 이미지 정보
      const originalBuffer = readFileSync(imagePath);
      const originalMetadata = await sharp(originalBuffer).metadata();
      const originalSize = originalBuffer.length;
      
      // Sharp 인스턴스 생성
      let processor = sharp(originalBuffer);
      
      // DOCX 최적화가 활성화된 경우 기본 설정 적용
      if (options.docxOptimized) {
        options = { ...this.docxOptimizedSettings, ...options };
      }
      
      // 리사이즈 처리
      if (options.resize) {
        processor = processor.resize({
          width: options.resize.width,
          height: options.resize.height,
          fit: options.resize.fit as any,
          position: options.resize.position as any,
          background: options.resize.background,
          withoutEnlargement: options.resize.withoutEnlargement
        });
      }
      
      // 포맷 및 품질 설정
      if (options.format) {
        switch (options.format) {
          case 'jpeg':
          case 'jpg':
            processor = processor.jpeg({
              quality: options.quality?.quality || 85,
              progressive: options.quality?.progressive !== false
            });
            break;
          case 'png':
            processor = processor.png({
              quality: options.quality?.quality || 90,
              compressionLevel: options.quality?.compressionLevel || 6
            });
            break;
          case 'webp':
            processor = processor.webp({
              quality: options.quality?.quality || 85,
              effort: options.quality?.effort || 4
            });
            break;
        }
      }
      
      // 처리된 이미지 버퍼 생성
      let processedBuffer = await processor.toBuffer();
      
      // 최대 파일 크기 체크 및 재압축
      if (options.maxFileSize) {
        const maxSizeBytes = options.maxFileSize * 1024 * 1024;
        let quality = options.quality?.quality || 85;
        
        while (processedBuffer.length > maxSizeBytes && quality > 20) {
          quality -= 10;
          
          processor = sharp(originalBuffer);
          
          if (options.resize) {
            processor = processor.resize(options.resize as any);
          }
          
          processor = processor.jpeg({ quality, progressive: true });
          processedBuffer = await processor.toBuffer();
        }
      }
      
      // 워터마크 추가
      if (options.watermark) {
        processedBuffer = await this.addWatermark(processedBuffer, options.watermark);
      }
      
      // 처리된 이미지 메타데이터
      const processedMetadata = await sharp(processedBuffer).metadata();
      
      // 결과 파일 저장 (옵션)
      let processedPath: string | undefined;
      if (options.outputDir) {
        const fileName = `${basename(imagePath, extname(imagePath))}_processed.${options.format || 'jpg'}`;
        processedPath = join(options.outputDir, fileName);
        writeFileSync(processedPath, processedBuffer);
      }
      
      const result: ProcessedImage = {
        originalPath: imagePath,
        processedPath,
        buffer: processedBuffer,
        metadata: {
          format: processedMetadata.format || 'unknown',
          width: processedMetadata.width || 0,
          height: processedMetadata.height || 0,
          channels: processedMetadata.channels || 0,
          density: processedMetadata.density,
          hasProfile: !!processedMetadata.hasProfile,
          hasAlpha: !!processedMetadata.hasAlpha,
          size: processedBuffer.length,
          originalPath: imagePath
        },
        optimized: {
          sizeBefore: originalSize,
          sizeAfter: processedBuffer.length,
          compressionRatio: Math.round((1 - processedBuffer.length / originalSize) * 100)
        }
      };
      
      // 파일 크기 검증
      if (options.maxFileSize && processedBuffer.length > options.maxFileSize * 1024 * 1024) {
        result.warnings = [`처리된 이미지가 최대 크기(${options.maxFileSize}MB)를 초과했습니다`];
      }
      
      return result;
      
    } catch (error) {
      return {
        originalPath: imagePath,
        buffer: Buffer.alloc(0),
        metadata: {
          format: 'unknown',
          width: 0,
          height: 0,
          channels: 0,
          size: 0,
          originalPath: imagePath
        },
        optimized: {
          sizeBefore: 0,
          sizeAfter: 0,
          compressionRatio: 0
        },
        errors: [error instanceof Error ? error.message : '이미지 처리 실패']
      };
    }
  }
  
  /**
   * 배치 이미지 처리
   */
  async processBatch(
    imagePaths: string[],
    options: ImageProcessingOptions = {}
  ): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    const processed: ProcessedImage[] = [];
    const failed: { path: string; error: string }[] = [];
    let totalSizeBefore = 0;
    let totalSizeAfter = 0;
    
    for (const imagePath of imagePaths) {
      try {
        const result = await this.processImage(imagePath, options);
        
        if (result.errors && result.errors.length > 0) {
          failed.push({ path: imagePath, error: result.errors.join(', ') });
        } else {
          processed.push(result);
          totalSizeBefore += result.optimized.sizeBefore;
          totalSizeAfter += result.optimized.sizeAfter;
        }
      } catch (error) {
        failed.push({ 
          path: imagePath, 
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    }
    
    return {
      success: failed.length === 0,
      processed,
      failed,
      totalSizeBefore,
      totalSizeAfter,
      processingTime: Date.now() - startTime
    };
  }
  
  /**
   * 워터마크 추가
   */
  private async addWatermark(
    imageBuffer: Buffer,
    watermarkOptions: WatermarkOptions
  ): Promise<Buffer> {
    if (!watermarkOptions.text) return imageBuffer;
    
    const image = sharp(imageBuffer);
    const { width = 800, height = 600 } = await image.metadata();
    
    // 워터마크 텍스트를 이미지로 변환
    const fontSize = watermarkOptions.fontSize || Math.max(width, height) / 40;
    const textColor = watermarkOptions.color || 'rgba(255,255,255,0.7)';
    
    // SVG로 텍스트 워터마크 생성
    const svgWatermark = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text 
          x="${this.getWatermarkX(watermarkOptions.position || 'bottom-right', width, watermarkOptions.text.length * fontSize * 0.6)}" 
          y="${this.getWatermarkY(watermarkOptions.position || 'bottom-right', height, fontSize)}"
          font-family="Arial, sans-serif" 
          font-size="${fontSize}" 
          fill="${textColor}"
          opacity="${watermarkOptions.opacity || 0.5}"
        >${watermarkOptions.text}</text>
      </svg>
    `;
    
    const watermarkBuffer = Buffer.from(svgWatermark);
    
    return image
      .composite([{ input: watermarkBuffer, blend: 'over' }])
      .toBuffer();
  }
  
  /**
   * 워터마크 X 좌표 계산
   */
  private getWatermarkX(position: string, width: number, textWidth: number): number {
    switch (position) {
      case 'top-left':
      case 'bottom-left':
        return 20;
      case 'top-right':
      case 'bottom-right':
        return width - textWidth - 20;
      case 'center':
        return (width - textWidth) / 2;
      default:
        return width - textWidth - 20;
    }
  }
  
  /**
   * 워터마크 Y 좌표 계산
   */
  private getWatermarkY(position: string, height: number, fontSize: number): number {
    switch (position) {
      case 'top-left':
      case 'top-right':
        return fontSize + 20;
      case 'bottom-left':
      case 'bottom-right':
        return height - 20;
      case 'center':
        return height / 2 + fontSize / 2;
      default:
        return height - 20;
    }
  }
  
  /**
   * 이미지 정보 분석
   */
  async analyzeImage(imagePath: string): Promise<ImageMetadata | null> {
    try {
      if (!existsSync(imagePath)) return null;
      
      const buffer = readFileSync(imagePath);
      const metadata = await sharp(buffer).metadata();
      
      return {
        format: metadata.format || 'unknown',
        width: metadata.width || 0,
        height: metadata.height || 0,
        channels: metadata.channels || 0,
        density: metadata.density,
        hasProfile: !!metadata.hasProfile,
        hasAlpha: !!metadata.hasAlpha,
        size: buffer.length,
        originalPath: imagePath
      };
    } catch {
      return null;
    }
  }
  
  /**
   * DOCX 최적화된 이미지 처리
   */
  async optimizeForDocx(imagePath: string): Promise<ProcessedImage> {
    return this.processImage(imagePath, {
      ...this.docxOptimizedSettings,
      docxOptimized: true
    });
  }
  
  /**
   * 임시 디렉토리 확인/생성
   */
  private ensureTempDir(): void {
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }
  }
  
  /**
   * 임시 파일 정리
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      const { readdir, unlink } = await import('fs').then(m => m.promises);
      const files = await readdir(this.tempDir);
      
      for (const file of files) {
        if (file.endsWith('_processed.jpg') || file.endsWith('_processed.png')) {
          await unlink(join(this.tempDir, file));
        }
      }
    } catch {
      // 정리 실패는 무시
    }
  }
}

/**
 * 이미지 유틸리티 함수들
 */
export class ImageUtils {
  private static processor = new ImageProcessor();
  
  /**
   * 지원 형식 체크
   */
  static isSupportedFormat(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase().slice(1);
    const supportedFormats: SupportedImageFormat[] = ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'tiff', 'webp'];
    return supportedFormats.includes(ext as SupportedImageFormat);
  }
  
  /**
   * 이미지 크기를 문서 크기에 맞게 조정
   */
  static getDocumentFitSize(
    originalWidth: number, 
    originalHeight: number, 
    maxWidth: number = 600, 
    maxHeight: number = 400
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return { 
      width: Math.round(width), 
      height: Math.round(height) 
    };
  }
  
  /**
   * 파일 크기를 읽기 쉬운 형태로 변환
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * 빠른 이미지 최적화 (기본 설정)
   */
  static async quickOptimize(imagePath: string): Promise<Buffer | null> {
    try {
      const result = await this.processor.optimizeForDocx(imagePath);
      return result.errors ? null : result.buffer;
    } catch {
      return null;
    }
  }
  
  /**
   * 이미지를 Base64로 변환 (웹 표시용)
   */
  static async toBase64(imagePath: string, maxSize: number = 1024): Promise<string | null> {
    try {
      const result = await this.processor.processImage(imagePath, {
        resize: { width: maxSize, height: maxSize, fit: 'inside' },
        quality: { quality: 80 },
        format: 'jpeg'
      });
      
      return result.errors ? null : `data:image/jpeg;base64,${result.buffer.toString('base64')}`;
    } catch {
      return null;
    }
  }
  
  /**
   * 다중 이미지 최적화
   */
  static async optimizeBatch(imagePaths: string[]): Promise<ProcessedImage[]> {
    const result = await this.processor.processBatch(imagePaths, {
      docxOptimized: true
    });
    
    return result.processed;
  }
}

/**
 * 이미지 처리 상수
 */
export const IMAGE_CONSTANTS = {
  // DOCX 최적 크기
  DOCX_MAX_WIDTH: 800,
  DOCX_MAX_HEIGHT: 600,
  DOCX_MAX_FILE_SIZE: 2, // MB
  
  // 품질 설정
  HIGH_QUALITY: 95,
  MEDIUM_QUALITY: 85,
  LOW_QUALITY: 70,
  
  // 지원 형식
  SUPPORTED_FORMATS: ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'tiff', 'webp'] as SupportedImageFormat[]
};

export default ImageProcessor;
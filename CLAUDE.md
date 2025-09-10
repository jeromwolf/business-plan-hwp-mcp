# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**사업계획서 HWP 자동화 도구** - Excel 데이터를 한글(HWP) 문서로 자동 변환하는 웹 기반 도구

## Current Status (2025-09-10)

### 핵심 파일
- **business-plan-ultimate-fixed.html**: 메인 웹 애플리케이션 (완전 독립 실행형)
  - 섹션별 편집 기능
  - Excel/이미지 업로드 및 삽입
  - PDF/DOCX/HWP 문서 생성
  - localStorage 자동 저장

### 주요 기능
1. **문서 생성**: 3가지 템플릿 (기본/VC투자/정부지원)
2. **미디어 관리**: Excel 데이터와 이미지 통합
3. **특수문자 처리**: 한글 특수문자 자동 변환
4. **다운로드 옵션**:
   - **DOCX** (권장): 이미지 포함, 한글/Word 호환
   - **HWP HTML**: 텍스트와 표만 (이미지는 플레이스홀더)
   - **PDF**: 브라우저 인쇄 기능 사용

### 기술 스택
- **Frontend**: Vanilla JavaScript + HTML5
- **라이브러리**: 
  - xlsx (Excel 처리)
  - html2canvas, jsPDF (PDF 생성)
- **Backend**: Node.js + TypeScript (MCP 서버)
- **Desktop**: Electron (선택적)

## Build and Development Commands

```bash
# 웹 버전 실행 (간단)
open business-plan-ultimate-fixed.html

# MCP 서버 실행
npm run dev

# Electron 앱 실행
npm run electron

# 테스트
npm test
```

## Known Issues (해결 중)

1. **DOCX 이미지 회색 표시 문제**
   - 현상: base64 이미지가 Word/한글에서 회색으로 표시
   - 원인: HTML 형식의 DOCX는 base64 이미지 지원 제한
   - 임시 해결: DOCX 확장자 사용, 크기 조정
   - 근본 해결 필요: 실제 DOCX 라이브러리 사용 검토

2. **HWP 네이티브 형식 미지원**
   - 현상: 직접 HWP 파일 생성 불가
   - 현재: HTML로 다운로드 후 한글에서 변환
   - 이미지 포함 시 한글이 파일을 열지 못함
   - 해결 방향: HWP 라이브러리 또는 서버사이드 처리

## Recent Updates (2025-09-10)

### 오늘 수정 사항
1. **DOCX 이미지 자동 리사이징**
   - 최대 너비 400px로 자동 조정
   - 비율 유지하며 크기 최적화

2. **다운로드 우선순위 변경**
   - DOCX를 메인으로 (이미지 포함)
   - HWP는 텍스트 전용으로 보조

3. **한글 호환성 개선 시도**
   - MS Word 호환 HTML 형식 적용
   - .doc → .docx 확장자 변경
   - 여전히 base64 이미지 문제 존재

### 이전 수정 사항
1. **PDF 한글 깨짐 해결**
   - 브라우저 인쇄 기능 사용으로 변경
   - 한글 폰트 완벽 지원

2. **JavaScript 오류 수정**
   - 탭 전환 이벤트 처리 수정
   - 문자열 내 script 태그 이스케이프

3. **왼쪽 패딩 추가**
   - PDF 출력 시 여백 확보 (30mm)

## Project Conventions

- **인코딩**: UTF-8 사용
- **특수문자 변환**: charMap 객체로 관리
- **스타일**: 인라인 스타일 사용 (독립 실행 위해)
- **저장**: localStorage 활용 (자동 저장)

## Testing Checklist

- [ ] 사업계획서 생성
- [ ] 섹션별 편집
- [ ] Excel 업로드 및 삽입
- [ ] 이미지 업로드 및 삽입
- [ ] PDF 다운로드 (인쇄)
- [ ] HWP 호환 HTML 다운로드
- [ ] 특수문자 변환 확인
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**사업계획서 HWP 자동화 도구** - Excel 데이터를 한글(HWP) 문서로 자동 변환하는 웹 기반 도구

## Current Status (2025-09-10)

### 핵심 파일
- **business-plan-ultimate-fixed.html**: 메인 웹 애플리케이션 (완전 독립 실행형)
  - 섹션별 편집 기능
  - Excel/이미지 업로드 및 삽입
  - PDF/HWP 문서 생성
  - localStorage 자동 저장

### 주요 기능
1. **문서 생성**: 3가지 템플릿 (기본/VC투자/정부지원)
2. **미디어 관리**: Excel 데이터와 이미지 통합
3. **특수문자 처리**: 한글 특수문자 자동 변환
4. **다운로드**: HTML(HWP 호환) 및 PDF 저장

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

## Known Issues (수정 예정)

1. **DOCX 이미지 크기 문제**
   - 현상: 이미지가 너무 크게 표시됨
   - 해결 방안: 이미지 자동 리사이징 기능 추가

2. **HWP 다운로드**
   - 현상: HTML 파일로 다운로드됨
   - 해결 방안: 한글에서 열어서 HWP로 저장 필요
   - 향후: 직접 HWP 생성 기능 개발

## Recent Fixes (2025-09-10)

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
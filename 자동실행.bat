@echo off
chcp 65001 >nul
title 사업계획서 HWP 자동화 도구

cls
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║   🚀 사업계획서 HWP 자동화 도구 - 완전 자동 실행  ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo 실행 중...
echo.

REM 웹 인터페이스 자동 열기
start auto-converter.html

echo ✅ 웹 인터페이스가 열렸습니다!
echo.
echo 📝 사용 방법:
echo   1. 회사명, 대표자, 사업내용 입력
echo   2. [자동 변환 시작] 클릭
echo   3. 변환 결과 확인
echo   4. [문서 다운로드] 클릭
echo.
echo 💡 다운로드한 HTML을:
echo   • 브라우저에서 Ctrl+P → PDF 저장
echo   • 한글에서 PDF 열기 → HWP 저장
echo.
echo 종료하려면 아무 키나 누르세요...
pause >nul
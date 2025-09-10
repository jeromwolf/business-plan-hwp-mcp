#!/bin/bash

# 한글 파일명으로 더 쉽게!
cd "$(dirname "$0")"

clear
echo ""
echo "🚀 사업계획서 자동 변환 프로그램"
echo "================================"
echo ""
echo "1️⃣  데모 실행 중..."
echo ""

node run-demo.cjs

echo ""
echo "================================"
echo "✅ 변환 완료!"
echo ""
echo "📌 브라우저에 문서가 열렸습니다"
echo "📌 인쇄(Cmd+P) → PDF 저장 → 한글에서 HWP로 저장"
echo ""
echo "종료하려면 Enter 키를 누르세요..."
read
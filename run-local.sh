#!/bin/bash
# 로컬 개발 환경 실행 스크립트

echo "로컬 개발 환경으로 실행합니다..."

# .env.local.example이 있으면 .env로 복사
if [ -f .env.local.example ] && [ ! -f .env ]; then
    echo ".env 파일이 없습니다. .env.local.example을 .env로 복사합니다..."
    cp .env.local.example .env
fi

# LOCAL_BASE_URL 설정
LOCAL_BASE_URL=${LOCAL_BASE_URL:-http://localhost}

# 환경 변수 설정 (포트 포함)
FRONTEND_URL="${LOCAL_BASE_URL}:5054"
NEXT_PUBLIC_RESEARCH_API_BASE_URL="${LOCAL_BASE_URL}:5588"
BACKEND_URL="${LOCAL_BASE_URL}:5588"

# .env 파일에 환경 변수 추가/업데이트
if [ -f .env ]; then
    # 기존 값이 있으면 업데이트, 없으면 추가
    if grep -q "^FRONTEND_URL=" .env; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^FRONTEND_URL=.*|FRONTEND_URL=${FRONTEND_URL}|" .env
        else
            sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=${FRONTEND_URL}|" .env
        fi
    else
        echo "FRONTEND_URL=${FRONTEND_URL}" >> .env
    fi
    
    if grep -q "^NEXT_PUBLIC_RESEARCH_API_BASE_URL=" .env; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^NEXT_PUBLIC_RESEARCH_API_BASE_URL=.*|NEXT_PUBLIC_RESEARCH_API_BASE_URL=${NEXT_PUBLIC_RESEARCH_API_BASE_URL}|" .env
        else
            sed -i "s|^NEXT_PUBLIC_RESEARCH_API_BASE_URL=.*|NEXT_PUBLIC_RESEARCH_API_BASE_URL=${NEXT_PUBLIC_RESEARCH_API_BASE_URL}|" .env
        fi
    else
        echo "NEXT_PUBLIC_RESEARCH_API_BASE_URL=${NEXT_PUBLIC_RESEARCH_API_BASE_URL}" >> .env
    fi
    
    if grep -q "^BACKEND_URL=" .env; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^BACKEND_URL=.*|BACKEND_URL=${BACKEND_URL}|" .env
        else
            sed -i "s|^BACKEND_URL=.*|BACKEND_URL=${BACKEND_URL}|" .env
        fi
    else
        echo "BACKEND_URL=${BACKEND_URL}" >> .env
    fi
else
    # .env 파일이 없으면 생성
    echo "FRONTEND_URL=${FRONTEND_URL}" > .env
    echo "NEXT_PUBLIC_RESEARCH_API_BASE_URL=${NEXT_PUBLIC_RESEARCH_API_BASE_URL}" >> .env
    echo "BACKEND_URL=${BACKEND_URL}" >> .env
fi

# 환경 변수 export (docker-compose에도 전달)
export FRONTEND_URL
export NEXT_PUBLIC_RESEARCH_API_BASE_URL
export BACKEND_URL

# Docker Compose 실행
docker-compose up -d --build "$@"


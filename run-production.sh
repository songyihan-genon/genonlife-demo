#!/bin/bash
# 서버 프로덕션 환경 실행 스크립트

echo "서버 프로덕션 환경으로 실행합니다..."

# .env.production.example이 있으면 .env로 복사
if [ -f .env.production.example ] && [ ! -f .env ]; then
    echo ".env 파일이 없습니다. .env.production.example을 .env로 복사합니다..."
    cp .env.production.example .env
    echo "⚠️  주의: .env 파일에서 GOOGLE_CLIENT_SECRET을 실제 값으로 수정해주세요!"
fi

# SERVER_BASE_URL 설정 (기본값, .env에서 읽거나 기본값 사용)
if [ -f .env ]; then
    # .env 파일에서 SERVER_BASE_URL 읽기
    SERVER_BASE_URL=$(grep "^SERVER_BASE_URL=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
fi
SERVER_BASE_URL=${SERVER_BASE_URL:-https://research-dev.genon.ai:3443}

# 환경 변수 설정
# FRONTEND_URL은 포트 포함 (3443)
FRONTEND_URL="${SERVER_BASE_URL}"
# 백엔드 URL 설정
# 백엔드가 도메인 연결이 안 되어 있는 경우 .env에서 직접 설정 필요
# 예: NEXT_PUBLIC_RESEARCH_API_BASE_URL=http://localhost:5588 (같은 서버 내부 접근)
# 또는 백엔드도 도메인 연결: NEXT_PUBLIC_RESEARCH_API_BASE_URL=https://research-dev.genon.ai:5588
if [ -f .env ] && grep -q "^NEXT_PUBLIC_RESEARCH_API_BASE_URL=" .env; then
    NEXT_PUBLIC_RESEARCH_API_BASE_URL=$(grep "^NEXT_PUBLIC_RESEARCH_API_BASE_URL=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
else
    # 기본값: SERVER_BASE_URL에서 포트 제거 후 5588 추가
    # 주의: 백엔드가 도메인 연결이 되어 있어야 함
    BASE_DOMAIN=$(echo "$SERVER_BASE_URL" | sed 's|:[0-9]*$||')
    NEXT_PUBLIC_RESEARCH_API_BASE_URL="${BASE_DOMAIN}:5588"
    echo "⚠️  경고: NEXT_PUBLIC_RESEARCH_API_BASE_URL이 .env에 설정되지 않았습니다."
    echo "   백엔드가 도메인 연결이 안 되어 있다면 .env에 명시적으로 설정해주세요."
    echo "   예: NEXT_PUBLIC_RESEARCH_API_BASE_URL=http://localhost:5588"
fi
BACKEND_URL="${NEXT_PUBLIC_RESEARCH_API_BASE_URL}"

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

# Docker Compose 실행 (백그라운드)
docker-compose up --build -d "$@"


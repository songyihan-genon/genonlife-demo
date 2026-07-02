# AI Research Portal

두 개(포털 프론트 `frontend/`, 리서치 에이전트/번역 백엔드 `backend/`)를 한 번에 띄우는 간단한 묶음입니다. Docker Compose 명령어만 실행하면 됩니다.

- 포함 서비스
  - web: 포털 프론트엔드 (Next.js, `frontend/`) — http://localhost:5054
  - api: 리서치 에이전트 + 번역 API (FastAPI, `backend/`)
  - redis: 세션/스토리지

## 환경 설정

환경 변수는 루트 디렉토리의 `.env` 파일에서 관리합니다.

### 로컬 개발 환경

```bash
# 스크립트 실행 (권장)
./run-local.sh

# 또는 수동 실행
cp .env.local.example .env
# .env 파일 수정 후
docker-compose up --build
```

**로컬 환경 변수:**
- `LOCAL_BASE_URL=http://localhost` (기본값)
- `FRONTEND_URL=http://localhost:5054` (자동 설정)
- `NEXT_PUBLIC_RESEARCH_API_BASE_URL=http://localhost:5588` (자동 설정)
- `BACKEND_URL=http://localhost:5588` (자동 설정)

### 서버 프로덕션 환경

```bash
# 스크립트 실행 (권장)
./run-production.sh

# 또는 수동 실행
cp .env.production.example .env
# .env 파일에서 GOOGLE_CLIENT_SECRET 등 실제 값으로 수정
docker-compose up --build -d
```

**서버 환경 변수:**
- `SERVER_BASE_URL=https://research-dev.genon.ai:3443` (기본값)
- `FRONTEND_URL=https://research-dev.genon.ai:3443` (자동 설정)
- `NEXT_PUBLIC_RESEARCH_API_BASE_URL=https://research-dev.genon.ai:3443:5588` (자동 설정)
- `BACKEND_URL=https://research-dev.genon.ai:3443:5588` (자동 설정)

### 환경 변수 파일

- `.env.local.example`: 로컬 개발 환경 예제
- `.env.production.example`: 서버 프로덕션 환경 예제
- `.env`: 실제 사용되는 파일 (위 예제 파일 중 하나를 복사하여 사용)

### 필수 환경 변수

- `FRONTEND_URL`: 프론트엔드 URL (포트 포함)
- `NEXT_PUBLIC_RESEARCH_API_BASE_URL`: 프론트엔드에서 접근할 백엔드 URL
- `BACKEND_URL`: 백엔드 URL
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret (서버 필수)
- `REDIS_URL`: Redis 연결 URL
- `DEEPSEARCH_API_KEY`: DeepSearch API 키
- `OPENROUTER_API_KEY`: OpenRouter API 키 (선택사항)
- `SEARCHAPI_KEY`: SearchAPI 키 (선택사항)
- `JWT_SECRET_KEY`: JWT 토큰 시크릿 키 (선택사항, 자동 생성됨)

## Feature

```
리서치 에이전트
├─ AI Chat
└─ 프롬프트 허브

리서치 어시스턴트
├─ 콘텐츠 포맷팅
├─ 템플릿 기반 문서화
```

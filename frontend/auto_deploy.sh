#!/bin/bash

# --- 설정 (필요시 수정) ---
# 프로젝트의 전체 경로
PROJECT_DIR="/home/seonggyun_hong/ssrc/frontend"
# 사용할 Git 브랜치 이름
BRANCH="main"
# tmux 세션 이름을 지정
TMUX_SESSION="ai-portal-server"
# --- 설정 끝 ---

# 프로젝트 디렉토리로 이동합니다. (실패 시 스크립트 중단)
cd "$PROJECT_DIR" || exit

echo "Starting auto-deployment script..."
echo "Monitoring branch: $BRANCH"
echo "Project directory: $PROJECT_DIR"
echo "--------------------------------"

# 처음 시작할 때 tmux 세션 생성 및 애플리케이션 실행
echo "Creating initial tmux session and starting application..."
tmux kill-session -t "$TMUX_SESSION" 2>/dev/null
npm run build
tmux new-session -d -s "$TMUX_SESSION" "npm run start"
echo "🚀 Initial deployment completed!"
echo "--------------------------------"

# 무한 루프를 돌면서 5초마다 확인합니다.
while true
do
    # 1. 원격 저장소의 최신 정보를 가져옵니다.
    git fetch origin

    # 2. 로컬 브랜치가 원격 브랜치보다 뒤처져 있는지 확인합니다.
    if git status -uno | grep -q "behind"; then
        echo "✅ New commits detected on branch '$BRANCH'! [$(date)]"
        
        # 3. 로컬 변경사항을 강제로 덮어쓰고 원격의 최신 커밋을 가져옵니다.
        echo "Pulling latest changes from origin/$BRANCH..."
        git reset --hard "origin/$BRANCH"
        
        # 4. tmux 세션을 종료합니다.
        echo "Restarting application..."
        tmux kill-session -t "$TMUX_SESSION" 2>/dev/null
        
        # 5. 프로젝트를 빌드하고 프로덕션 서버를 실행합니다.
        echo "Building the project..."
        npm run build

        # 6. 새로운 tmux 세션을 만들고 프로덕션 서버를 실행합니다.
        tmux new-session -d -s "$TMUX_SESSION" "npm run start"
        
        echo "🚀 Deployment finished successfully!"
        echo "--------------------------------"
    fi
    
    # 5초 동안 대기합니다.
    sleep 5
done

# tmux new-session -d -s auto_deploy_monitor bash auto_deploy.sh

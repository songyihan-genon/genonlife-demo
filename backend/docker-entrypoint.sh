#!/bin/sh
set -e

start_worker() {
  if [ "${DISABLE_TRANSLATION_WORKER:-0}" = "1" ]; then
    echo "[entrypoint] Translation worker disabled via DISABLE_TRANSLATION_WORKER=1"
    return
  fi
  echo "[entrypoint] Starting translation worker..."
  python -m app.services.translation.workers.translate_worker &
  WORKER_PID=$!
  echo "[entrypoint] Translation worker running with PID ${WORKER_PID}"
}

start_worker

echo "[entrypoint] Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 5588

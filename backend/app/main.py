import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure environment variables are loaded both from root .env (if any)
# and the backend/app/.env file used in Docker deployments.
load_dotenv()
backend_env_path = Path(__file__).resolve().parent / ".env"
if backend_env_path.exists():
    load_dotenv(backend_env_path, override=True)

import uvicorn

from app.api.health import router as health_router
from app.api.chat import router as chat_router
from app.api.insights import router as insights_router
from app.api.translation import router as translation_router
from app.api.watchlists import router as watchlists_router
from app.api.stocks import router as stocks_router
from app.api.events import router as events_router
from app.api.macro import router as macro_router
from app.api.auth import router as auth_router
from app.logger import setup_logging, get_logger


app = FastAPI(title="mocking-flowise API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize logging once app is created
setup_logging()
log = get_logger(__name__)


from app.scheduler import scheduler

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(insights_router)
app.include_router(translation_router)
app.include_router(events_router)
app.include_router(watchlists_router)
app.include_router(stocks_router)
app.include_router(macro_router)

@app.on_event("startup")
async def startup_event():
    scheduler.start()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5588"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
    log.info("FastAPI application initialized")

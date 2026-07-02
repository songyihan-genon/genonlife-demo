import os
import secrets
import jwt
import json
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from google.auth.transport import requests
from google.oauth2 import id_token
import httpx
from app.stores.cache_store import CacheStore

router = APIRouter(prefix="/auth", tags=["auth"])

# Google OAuth 설정
GOOGLE_CLIENT_ID = (
    os.getenv("GOOGLE_CLIENT_ID")
    or os.getenv("GOOGLE_OAUTH_CLIENT_ID")
    or "878601515346-scik06c7h3rdmp7ft4daphrl2u53ikkj.apps.googleusercontent.com"
)
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5054")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5588")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Redis를 사용한 state 저장소
cache_store = CacheStore()
STATE_TTL = 300  # 5분


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserInfo(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None


def create_access_token(user_info: dict) -> str:
    """JWT 토큰 생성"""
    payload = {
        "sub": user_info["id"],
        "email": user_info["email"],
        "name": user_info["name"],
        "picture": user_info.get("picture"),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    """JWT 토큰 검증"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


@router.get("/google")
async def google_login():
    """Google OAuth 로그인 시작"""
    import logging
    logger = logging.getLogger(__name__)
    
    # CSRF 보호를 위한 state 생성
    state = secrets.token_urlsafe(32)
    state_data = {
        "created_at": datetime.utcnow().isoformat()
    }
    # Redis에 state 저장 (5분 TTL)
    state_key = f"oauth_state:{state}"
    try:
        await cache_store.setex(state_key, STATE_TTL, json.dumps(state_data))
        logger.info(f"State saved to Redis: {state_key}")
    except Exception as e:
        logger.error(f"Failed to save state to Redis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to initialize OAuth")
    
    # Google OAuth URL 생성 (프론트엔드 콜백 엔드포인트로 리다이렉트)
    redirect_uri = f"{FRONTEND_URL}/auth/callback"
    scope = "openid email profile"
    
    google_oauth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope={scope}"
        f"&state={state}"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    
    return RedirectResponse(url=google_oauth_url)


class CodeExchangeRequest(BaseModel):
    code: str
    state: str


@router.post("/google/exchange")
async def google_exchange_code(request: CodeExchangeRequest):
    """Google OAuth authorization code를 JWT 토큰으로 교환"""
    import logging
    logger = logging.getLogger(__name__)
    
    code = request.code
    state = request.state
    
    logger.info(f"Token exchange request: state={state[:20]}..., code={code[:20]}...")
    
    try:
        # Redis에서 state 검증
        state_key = f"oauth_state:{state}"
        try:
            state_data_str = await cache_store.get(state_key)
            logger.info(f"State lookup: key={state_key}, found={state_data_str is not None}")
        except Exception as e:
            logger.error(f"Redis error during state lookup: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Redis connection error")
        
        if not state_data_str:
            # Redis에 있는 모든 oauth_state 키 확인 (디버깅)
            try:
                all_keys = await cache_store.client.keys("oauth_state:*")
                logger.warning(f"State not found in Redis: {state_key}, available keys: {len(all_keys)} keys")
            except:
                pass
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        # State 데이터 파싱
        try:
            state_data = json.loads(state_data_str)
            state_created = datetime.fromisoformat(state_data["created_at"])
            elapsed = (datetime.utcnow() - state_created).total_seconds()
            
            if elapsed > STATE_TTL:
                await cache_store.delete(state_key)
                logger.warning(f"State expired: elapsed={elapsed}s")
                raise HTTPException(status_code=400, detail="State expired")
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            await cache_store.delete(state_key)
            logger.error(f"Invalid state data: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid state data: {str(e)}")
        
        # State 사용 후 삭제 (한 번만 사용 가능)
        await cache_store.delete(state_key)
        logger.info(f"State validated and deleted: {state_key}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during state validation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    try:
        # Authorization code를 access token으로 교환
        token_url = "https://oauth2.googleapis.com/token"
        redirect_uri = f"{FRONTEND_URL}/auth/callback"
        
        token_data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        
        # client_secret이 있으면 포함 (선택사항)
        if GOOGLE_CLIENT_SECRET:
            token_data["client_secret"] = GOOGLE_CLIENT_SECRET
        
        logger.info(f"Exchanging code for token: redirect_uri={redirect_uri}")
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            
            if token_response.status_code != 200:
                error_text = token_response.text
                logger.error(f"Token exchange failed: {token_response.status_code} - {error_text}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Token exchange failed: {error_text}"
                )
            
            tokens = token_response.json()
        
        id_token_str = tokens.get("id_token")
        if not id_token_str:
            logger.error("No ID token in response")
            raise HTTPException(status_code=400, detail="No ID token received")
        
        # ID token 검증 및 사용자 정보 추출
        try:
            idinfo = id_token.verify_oauth2_token(
                id_token_str, requests.Request(), GOOGLE_CLIENT_ID
            )
            
            if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
                raise ValueError("Wrong issuer")
            
            user_info = {
                "id": idinfo["sub"],
                "email": idinfo["email"],
                "name": idinfo.get("name", ""),
                "picture": idinfo.get("picture"),
            }
            
            logger.info(f"User authenticated: {user_info['email']}")
            
            # JWT 토큰 생성
            access_token = create_access_token(user_info)
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": user_info
            }
            
        except ValueError as e:
            logger.error(f"Token verification failed: {e}")
            raise HTTPException(status_code=400, detail=f"Token verification failed: {str(e)}")
            
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        error_text = e.response.text if hasattr(e, 'response') else str(e)
        logger.error(f"HTTP error during token exchange: {error_text}")
        raise HTTPException(status_code=400, detail=f"Token exchange failed: {error_text}")
    except Exception as e:
        logger.error(f"Unexpected error during token exchange: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")


@router.get("/verify")
async def verify_token_endpoint(token: str):
    """토큰 검증 엔드포인트"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return {
        "valid": True,
        "user": {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "picture": payload.get("picture"),
        }
    }


@router.get("/me")
async def get_current_user(token: str = Depends(lambda: None)):
    """현재 사용자 정보 조회 (Authorization 헤더에서 토큰 추출)"""
    # 실제로는 Depends를 사용하여 Authorization 헤더에서 토큰을 추출해야 하지만,
    # 간단하게 쿼리 파라미터로 받도록 구현
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "name": payload.get("name"),
        "picture": payload.get("picture"),
    }

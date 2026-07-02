from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.services.insight_service import InsightService
from app.schemas import Insight, InsightCreate

router = APIRouter(prefix="/insights", tags=["insights"])
service = InsightService()

@router.post("/generate", response_model=Insight)
async def generate_insight(payload: InsightCreate = None, background_tasks: BackgroundTasks = None):
    """
    Trigger generation of a new daily insight.
    """
    try:
        topic = payload.topic if payload else None
        # Generate synchronously for now to return the result, 
        # but in production this might be a background task
        insight = await service.generate_insight(topic)
        return insight
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/latest", response_model=Insight)
async def get_latest_insight():
    """
    Get the most recent insight.
    """
    insight = service.get_latest_insight()
    if not insight:
        # If no insight exists, try to generate one (auto-init)
        try:
            insight = await service.generate_insight()
        except Exception as e:
             raise HTTPException(status_code=404, detail="No insights available and generation failed")
    return insight

@router.get("/history", response_model=list[Insight])
async def get_insight_history():
    """
    Get list of past insights.
    """
    return service.get_insight_history()

import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.services.insight_service import InsightService
from app.logger import get_logger

log = get_logger(__name__)

class Scheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.insight_service = InsightService()

    def start(self):
        # Schedule daily insight generation at 09:00 KST
        # KST is UTC+9, so we can use the server's timezone if it's set correctly, 
        # or specify timezone explicitly. For simplicity, assuming server time or handling offset.
        # If server is UTC, 09:00 KST is 00:00 UTC.
        
        # Using CronTrigger for flexibility
        trigger = CronTrigger(hour=9, minute=0, timezone='Asia/Seoul')
        
        self.scheduler.add_job(
            self.run_daily_insight,
            trigger=trigger,
            id="daily_insight_generation",
            replace_existing=True
        )
        
        self.scheduler.start()
        log.info("Scheduler started. Daily insight generation scheduled for 09:00 KST.")

    async def run_daily_insight(self):
        log.info("Starting scheduled daily insight generation...")
        try:
            insight = await self.insight_service.generate_insight()
            log.info(f"Scheduled insight generated successfully: {insight.title}")
        except Exception as e:
            log.error(f"Scheduled insight generation failed: {e}")

scheduler = Scheduler()

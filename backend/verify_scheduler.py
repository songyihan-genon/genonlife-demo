import asyncio
import sys
import os
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Add app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Mock the service to avoid actual API calls during scheduler test
from unittest.mock import MagicMock
import app.scheduler
app.scheduler.InsightService = MagicMock()

from app.scheduler import scheduler

async def main():
    print("Starting scheduler verification...")
    
    # Start the scheduler
    scheduler.start()
    
    # Check if the job is added
    jobs = scheduler.scheduler.get_jobs()
    print(f"Number of jobs: {len(jobs)}")
    
    found = False
    for job in jobs:
        print(f"Job ID: {job.id}, Next Run: {job.next_run_time}")
        if job.id == "daily_insight_generation":
            found = True
            
    if found:
        print("SUCCESS: Daily insight generation job found.")
    else:
        print("FAILURE: Daily insight generation job NOT found.")
        
    # Stop scheduler
    scheduler.scheduler.shutdown()

if __name__ == "__main__":
    asyncio.run(main())

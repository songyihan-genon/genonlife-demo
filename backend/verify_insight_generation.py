import asyncio
import os
import sys
try:
    from dotenv import load_dotenv
    # Load env vars
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "app", ".env"))
except ImportError:
    print("Warning: python-dotenv not found. Environment variables from .env might not be loaded.")

# Add app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.insight_service import InsightService

async def main():
    print("Initializing InsightService...")
    service = InsightService()
    
    print("Testing fetch_daily_trend...")
    topic = await service.fetch_daily_trend()
    print(f"Topic: {topic}")
    
    print("Testing deep_dive_analysis (mocking search if key missing)...")
    # We can't easily mock the internal calls without more complex setup, 
    # but we can run it and see if it crashes.
    try:
        context = await service.deep_dive_analysis(topic)
        print(f"Context length: {len(context)}")
    except Exception as e:
        print(f"Deep dive failed (expected if key missing/network issue): {e}")

    print("Testing generate_insight...")
    try:
        insight = await service.generate_insight(topic)
        print("Insight generated successfully!")
        print(f"Title: {insight.title}")
        print(f"Summary: {insight.summary}")
    except Exception as e:
        print(f"Insight generation failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())

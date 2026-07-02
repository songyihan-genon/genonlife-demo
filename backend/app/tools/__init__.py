from .web_search import web_search, WEB_SEARCH
from .open_url import open, OPEN_URL
from .chart_visualization import create_chart, CHART_VISUALIZATION


async def get_tool_map():
    return {
        "search": web_search,
        "open": open,
        "create_chart": create_chart
    }


async def get_tools_for_llm():
    return [
        WEB_SEARCH,
        OPEN_URL,
        CHART_VISUALIZATION
    ]

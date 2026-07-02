import json
import base64
from typing import Literal, Optional
from pydantic import BaseModel, Field
from app.logger import get_logger
from app.utils import States

log = get_logger(__name__)


class ChartData(BaseModel):
    """차트 데이터 모델"""
    chart_type: Literal["line", "bar", "pie"] = Field(description="Chart type: line, bar, or pie")
    title: str = Field(description="Chart title")
    labels: list[str] = Field(description="X-axis labels or category labels")
    datasets: list[dict] = Field(
        description="Array of dataset objects. Each dataset should have 'label' (string) and 'data' (array of numbers). For pie charts, only one dataset is recommended."
    )
    x_axis_label: Optional[str] = Field(description="X-axis label (optional)", default=None)
    y_axis_label: Optional[str] = Field(description="Y-axis label (optional)", default=None)


CHART_VISUALIZATION = {
    "type": "function",
    "function": {
        "name": "create_chart",
        "description": "Create interactive charts (line, bar, or pie) using Chart.js. Returns an iframe-embeddable visualization. Useful when user asks for data visualization, graphs, or charts.",
        "parameters": {
            "type": "object",
            "properties": {
                "chart_type": {
                    "type": "string",
                    "enum": ["line", "bar", "pie"],
                    "description": "Type of chart to create"
                },
                "title": {
                    "type": "string",
                    "description": "Title of the chart"
                },
                "labels": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "X-axis labels or category labels"
                },
                "datasets": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "label": {"type": "string", "description": "Dataset label"},
                            "data": {
                                "type": "array",
                                "items": {"type": "number"},
                                "description": "Array of numeric values"
                            },
                            "backgroundColor": {
                                "type": "string",
                                "description": "Background color (optional, will use defaults if not provided)"
                            },
                            "borderColor": {
                                "type": "string",
                                "description": "Border color (optional, will use defaults if not provided)"
                            }
                        },
                        "required": ["label", "data"]
                    },
                    "description": "Array of dataset objects with label and data"
                },
                "x_axis_label": {
                    "type": "string",
                    "description": "X-axis label (optional)"
                },
                "y_axis_label": {
                    "type": "string",
                    "description": "Y-axis label (optional)"
                }
            },
            "required": ["chart_type", "title", "labels", "datasets"]
        }
    }
}


def generate_chart_html(chart_data: ChartData) -> str:
    """Generate HTML with Chart.js visualization"""
    
    # Default color palettes
    default_colors = [
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(199, 199, 199, 0.6)',
        'rgba(83, 102, 255, 0.6)',
        'rgba(255, 99, 255, 0.6)',
        'rgba(50, 205, 50, 0.6)'
    ]
    
    default_border_colors = [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)',
        'rgba(83, 102, 255, 1)',
        'rgba(255, 99, 255, 1)',
        'rgba(50, 205, 50, 1)'
    ]
    
    # Prepare datasets with colors
    processed_datasets = []
    for idx, dataset in enumerate(chart_data.datasets):
        processed_dataset = {
            "label": dataset.get("label", f"Dataset {idx + 1}"),
            "data": dataset.get("data", [])
        }
        
        # For pie charts, use multiple colors for each segment
        if chart_data.chart_type == "pie":
            processed_dataset["backgroundColor"] = dataset.get(
                "backgroundColor", 
                default_colors[:len(chart_data.labels)]
            )
            processed_dataset["borderColor"] = dataset.get(
                "borderColor",
                default_border_colors[:len(chart_data.labels)]
            )
        else:
            # For line and bar charts, use single color per dataset
            color_idx = idx % len(default_colors)
            processed_dataset["backgroundColor"] = dataset.get(
                "backgroundColor", 
                default_colors[color_idx]
            )
            processed_dataset["borderColor"] = dataset.get(
                "borderColor",
                default_border_colors[color_idx]
            )
            if chart_data.chart_type == "line":
                processed_dataset["borderWidth"] = 2
                processed_dataset["tension"] = 0.1
            else:
                processed_dataset["borderWidth"] = 1
        
        processed_datasets.append(processed_dataset)
    
    # Build chart configuration
    chart_config = {
        "type": chart_data.chart_type,
        "data": {
            "labels": chart_data.labels,
            "datasets": processed_datasets
        },
        "options": {
            "responsive": True,
            "maintainAspectRatio": True,
            "plugins": {
                "title": {
                    "display": True,
                    "text": chart_data.title,
                    "font": {
                        "size": 18
                    }
                },
                "legend": {
                    "display": True,
                    "position": "top"
                }
            }
        }
    }
    
    # Add axis labels for non-pie charts
    if chart_data.chart_type != "pie":
        chart_config["options"]["scales"] = {
            "y": {
                "beginAtZero": True,
                "title": {
                    "display": bool(chart_data.y_axis_label),
                    "text": chart_data.y_axis_label or ""
                }
            },
            "x": {
                "title": {
                    "display": bool(chart_data.x_axis_label),
                    "text": chart_data.x_axis_label or ""
                }
            }
        }
    
    chart_config_json = json.dumps(chart_config, ensure_ascii=False)
    
    html_template = f"""
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{chart_data.title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        body {{
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #ffffff;
            overflow: hidden;
        }}
        .chart-container {{
            position: relative;
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
        }}
        canvas {{
            display: block;
        }}
    </style>
</head>
<body>
    <div class="chart-container">
        <canvas id="myChart"></canvas>
    </div>
    <script>
        const ctx = document.getElementById('myChart').getContext('2d');
        const config = {chart_config_json};
        const myChart = new Chart(ctx, config);
        
        // 차트 렌더링 완료 후 높이 전달
        function sendHeight() {{
            const height = document.body.scrollHeight;
            window.parent.postMessage({{
                type: 'chart-resize',
                height: height
            }}, '*');
        }}
        
        // 차트 애니메이션 완료 후 높이 전달
        myChart.options.animation = {{
            ...myChart.options.animation,
            onComplete: function() {{
                setTimeout(sendHeight, 100);
            }}
        }};
        
        // 초기 로드 시에도 높이 전달
        window.addEventListener('load', function() {{
            setTimeout(sendHeight, 200);
        }});
        
        // 리사이즈 이벤트 처리
        window.addEventListener('resize', function() {{
            setTimeout(sendHeight, 100);
        }});
        
        // 즉시 한 번 실행
        setTimeout(sendHeight, 100);
    </script>
</body>
</html>
"""
    return html_template


async def create_chart(states: States, **tool_input) -> str:
    """
    Create a chart visualization using Chart.js.
    
    Args:
        states: State object containing tool state
        **tool_input: Chart parameters (chart_type, title, labels, datasets, etc.)
    
    Returns:
        str: Success message with chart ID reference
    """
    try:
        # Validate input
        chart_data = ChartData(**tool_input)
        
        log.info("Creating chart", extra={
            "chart_type": chart_data.chart_type,
            "title": chart_data.title,
            "num_labels": len(chart_data.labels),
            "num_datasets": len(chart_data.datasets)
        })
        
        # Generate HTML
        html_content = generate_chart_html(chart_data)
        
        # Create unique ID for this chart
        chart_id = f"{states.turn}:chart"
        
        # Store in tool state for frontend rendering
        states.tool_state.id_to_iframe[chart_id] = html_content
        
        # Increment turn counter
        states.turn += 1
        
        log.info("Chart created successfully", extra={
            "chart_id": chart_id,
            "html_length": len(html_content)
        })
        
        # Return reference to the chart
        return f"✓ Chart '{chart_data.title}' created successfully. Display it using: 【{chart_id}】"
        
    except Exception as e:
        log.exception("Failed to create chart")
        return f"Failed to create chart: {str(e)}"


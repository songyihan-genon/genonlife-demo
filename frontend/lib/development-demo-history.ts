import { Message } from "@/lib/event-system"

type DevelopmentHistoryPreset = {
  id: string
  title: string
  description: string
  messages: Message[]
}

function buildMessages(sessionId: string, baseTimeIso: string, userContent: string, assistantContent: string): Message[] {
  const baseTime = new Date(baseTimeIso)

  return [
    {
      id: `${sessionId}-user`,
      role: "user",
      content: userContent,
      timestamp: baseTime,
      sessionId,
    },
    {
      id: `${sessionId}-assistant`,
      role: "assistant",
      content: assistantContent,
      timestamp: new Date(baseTime.getTime() + 60_000),
      sessionId,
      isMarkdown: true,
    },
  ]
}

export const developmentPromptSuggestions = [
  "상담 안내 메시지 발송 API 예시를 만들어줘.",
  "일별 상담량 집계 SQL 예시를 작성해줘.",
  "민원 후속 안내 배치 스크립트 구조를 제안해줘.",
]

export const developmentHistoryPresets: DevelopmentHistoryPreset[] = [
  {
    id: "reservation-api",
    title: "상담 안내 API 생성",
    description: "상담 안내 메시지 발송용 API 예시",
    messages: buildMessages(
      "development-history-reservation-api",
      "2026-03-23T13:10:00+09:00",
      "상담 안내 메시지를 생성하는 API 예시를 FastAPI 기준으로 만들어줘.",
      [
        "아래처럼 시작하면 데모와 실제 확장 모두 대응하기 좋습니다.",
        "",
        "```python",
        "from fastapi import APIRouter",
        "from pydantic import BaseModel",
        "",
        'router = APIRouter(prefix=\"/api/counseling\", tags=[\"counseling\"])',
        "",
        "class CounselingMessageRequest(BaseModel):",
        "    request_id: str",
        "    customer_name: str",
        "    request_date: str",
        "    counseling_type: str",
        "    scenario: str",
        "",
        "class CounselingMessageResponse(BaseModel):",
        "    message_title: str",
        "    message_body: str",
        "    channel: str",
        "",
        "@router.post(\"/message\", response_model=CounselingMessageResponse)",
        "def generate_counseling_message(payload: CounselingMessageRequest):",
        "    return CounselingMessageResponse(",
        '        message_title=\"상담 안내\",',
        '        message_body=f\"안녕하세요. 제논라이프입니다. {payload.request_date} 상담 안내를 보내드립니다.\",',
        '        channel=\"kakao\",',
        "    )",
        "```",
        "",
        "필요하면 같은 구조로 SMS, 카카오 알림톡, 이메일 채널 분기까지 확장할 수 있습니다.",
      ].join("\n"),
    ),
  },
  {
    id: "sales-sql",
    title: "일별 상담량 집계 SQL",
    description: "운영 리포트용 상담량 집계 쿼리",
    messages: buildMessages(
      "development-history-sales-sql",
      "2026-03-23T13:30:00+09:00",
      "일별 상담량 추이를 보는 SQL 예시를 만들어줘. 채무조정, 소액대출, 일반문의 건수를 함께 보는 형태면 돼.",
      [
        "운영 대시보드용으로는 아래 예시처럼 작성할 수 있습니다.",
        "",
        "```sql",
        "SELECT",
        "  counseling_date,",
        "  SUM(debt_adjustment_count) AS debt_adjustment_count,",
        "  SUM(microloan_count) AS microloan_count,",
        "  SUM(general_inquiry_count) AS general_inquiry_count,",
        "  SUM(debt_adjustment_count + microloan_count + general_inquiry_count) AS total_count",
        "FROM daily_counseling_summary",
        "WHERE counseling_date BETWEEN DATE '2026-03-01' AND DATE '2026-03-31'",
        "GROUP BY counseling_date",
        "ORDER BY counseling_date ASC;",
        "```",
        "",
        "여기에 평균 응답 시간이나 완료율을 조인하면 운영 분석 화면과도 자연스럽게 연결됩니다.",
      ].join("\n"),
    ),
  },
  {
    id: "protection-batch",
    title: "민원 후속 안내 배치",
    description: "후속 안내 메시지 발송 작업 예시",
    messages: buildMessages(
      "development-history-protection-batch",
      "2026-03-23T13:50:00+09:00",
      "민원 접수 이후 후속 안내 메시지를 보내는 배치 스크립트 구조를 간단히 보여줘.",
      [
        "배치 작업은 아래처럼 구성할 수 있습니다.",
        "",
        "```python",
        "def run_followup_notification_batch(target_date: str):",
        "    targets = load_followup_targets(target_date)",
        "",
        "    for customer in targets:",
        "        message = build_followup_message(",
        "            customer_name=customer[\"name\"],",
        "            counseling_type=customer[\"counseling_type\"],",
        "            support_contact=\"1600-5500\",",
        "        )",
        "        send_kakao_notification(customer[\"phone\"], message)",
        "",
        "    return {",
        '        \"target_count\": len(targets),',
        '        \"status\": \"completed\",',
        "    }",
        "```",
        "",
        "실서비스에서는 대상 추출, 발송 로그 적재, 실패 재시도까지 함께 두는 편이 좋습니다.",
      ].join("\n"),
    ),
  },
]

export function getDevelopmentPresetMessages(presetId: string | null) {
  if (!presetId) return null
  return developmentHistoryPresets.find((item) => item.id === presetId)?.messages ?? null
}

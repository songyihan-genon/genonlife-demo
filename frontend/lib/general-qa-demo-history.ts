import { Message } from "@/lib/event-system"

type GeneralQaHistoryPreset = {
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
    },
  ]
}

export const generalQaPromptSuggestions = [
  "제논라이프의 대표적인 보험금 청구 절차를 간단히 설명해줘.",
  "보험금 청구와 계약 변경 요청의 차이를 쉽게 설명해줘.",
  "고객 상담 전에 준비하면 좋은 기본 서류를 알려줘.",
]

export const generalQaHistoryPresets: GeneralQaHistoryPreset[] = [
  {
    id: "claims-process",
    title: "보험금 청구 절차 안내",
    description: "대표 청구 절차 설명",
    messages: buildMessages(
      "general-qa-claims-process",
      "2026-04-09T09:30:00+09:00",
      "제논라이프의 보험금 청구 절차를 간단히 알려줘.",
      [
        "대표적으로는 아래 순서로 안내할 수 있습니다.",
        "",
        "- **접수 단계**: 사고 내용 확인 후 모바일, 홈페이지, 고객센터를 통해 청구 접수를 진행합니다.",
        "- **서류 제출 단계**: 진단서, 입퇴원 확인서, 영수증 등 필요한 서류를 제출합니다.",
        "- **심사 및 안내 단계**: 접수된 서류를 기준으로 심사를 진행하고, 필요 시 추가 서류를 안내합니다.",
        "",
        "정확한 필요 서류와 처리 기간은 상품 유형과 사고 내용에 따라 달라질 수 있어 상담을 통해 확인하는 것이 가장 좋습니다.",
      ].join("\n")
    ),
  },
  {
    id: "request-difference",
    title: "업무 유형 차이 설명",
    description: "보험금 청구 vs 계약 변경",
    messages: buildMessages(
      "general-qa-request-difference",
      "2026-04-09T10:10:00+09:00",
      "보험금 청구와 계약 변경 요청 차이를 쉽게 설명해줘.",
      [
        "쉽게 정리하면 아래처럼 설명할 수 있습니다.",
        "",
        "- **보험금 청구**: 사고나 진단, 입원 등 보장 사유가 발생했을 때 보험금 지급을 요청하는 업무입니다.",
        "- **계약 변경 요청**: 주소, 수익자, 자동이체, 특약 등 계약 정보를 수정하거나 갱신하는 업무입니다.",
        "",
        "즉, 보험금 청구는 지급 심사 중심이고, 계약 변경은 계약 유지와 정보 관리 중심의 요청이라고 볼 수 있습니다.",
      ].join("\n")
    ),
  },
]

export function getGeneralQaPresetMessages(presetId: string | null) {
  if (!presetId) return null
  return generalQaHistoryPresets.find((item) => item.id === presetId)?.messages ?? null
}

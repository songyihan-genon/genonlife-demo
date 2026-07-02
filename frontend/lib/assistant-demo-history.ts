import { Message } from "@/lib/event-system"

type AssistantHistoryPreset = {
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

export const assistantPromptSuggestions = [
  "보험금 청구 고객에게 보낼 첫 안내 문구를 정중한 톤으로 정리해 주세요.",
  "상담 예약 안내 문장을 더 친절하고 간결하게 수정해 주세요.",
  "추가 서류 제출 요청 안내 문구를 짧고 이해하기 쉽게 다듬어 주세요.",
]

export const assistantHistoryPresets: AssistantHistoryPreset[] = [
  {
    id: "notice-title",
    title: "보험금 청구 안내 문구 정리",
    description: "초기 안내 메시지를 정중하게 정리",
    messages: buildMessages(
      "assistant-history-notice-title",
      "2026-03-23T09:10:00+09:00",
      "보험금 청구 고객에게 보내는 첫 안내 메시지를 보다 정중하고 간결하게 다듬어 주세요. 접수 절차와 준비 서류를 간단히 포함해 주시기 바랍니다.",
      [
        "아래처럼 정리할 수 있습니다.",
        "",
        "안녕하세요. 제논라이프입니다.",
        "보험금 청구 접수가 정상적으로 완료되었으며, 순차적으로 심사 절차를 안내드릴 예정입니다.",
        "심사 전 필요한 기본 서류는 별도 안내에 따라 준비해 주시면 보다 원활한 진행이 가능합니다.",
        "",
        "필요하시면 문자형, 이메일형, 콜센터 후속 안내형으로 나눠 다시 정리드릴 수 있습니다.",
      ].join("\n")
    ),
  },
  {
    id: "customer-reply",
    title: "고객 상담 일정 안내 정리",
    description: "상담 일정을 알리는 문구 정리",
    messages: buildMessages(
      "assistant-history-customer-reply",
      "2026-03-23T10:00:00+09:00",
      "상담 일정 안내 문장을 보다 친절하고 자연스럽게 수정해 주세요. 원문은 '상담 일정은 담당자가 확인 후 별도로 안내드립니다.' 입니다.",
      [
        "다듬은 문장은 아래처럼 쓸 수 있습니다.",
        "",
        "안녕하세요. 상담 일정은 담당자가 확인 후 순차적으로 별도 안내드릴 예정입니다.",
        "",
        "조금 더 짧게 쓰면:",
        "상담 일정은 확인 후 개별적으로 안내드리겠습니다.",
      ].join("\n")
    ),
  },
  {
    id: "schedule-notice",
    title: "추가 서류 제출 요청 안내",
    description: "보완 요청 문구를 부드럽게 정리",
    messages: buildMessages(
      "assistant-history-schedule-notice",
      "2026-03-23T10:10:00+09:00",
      "서류 보완 요청 안내 문구를 부드럽고 간결하게 다듬어 주세요. 민원인에게 발송하는 문자 형식으로 작성 부탁드립니다.",
      [
        "문자 안내용으로는 아래처럼 정리할 수 있습니다.",
        "",
        "안녕하세요. 접수하신 상담 건과 관련하여 추가 확인이 필요한 서류가 있어 안내드립니다.",
        "관련 서류를 보완해 주시면 이후 절차를 보다 신속하게 진행할 수 있습니다.",
        "문의 사항이 있으시면 상담센터로 연락 부탁드립니다.",
      ].join("\n")
    ),
  },
]

export function getAssistantPresetMessages(presetId: string | null) {
  if (!presetId) return null
  return assistantHistoryPresets.find((item) => item.id === presetId)?.messages ?? null
}

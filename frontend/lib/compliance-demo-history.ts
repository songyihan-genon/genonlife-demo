import { Message } from "@/lib/event-system"

type ComplianceHistoryPreset = {
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

const POLICY_FOOTER = "※ 본 답변은 AI가 생성한 참고 문안이며, 반드시 담당자의 검토, 승인을 거쳐야 합니다."

function buildPolicyResponse(answerSummary: string, guidance: string[], regulationName: string, clause: string, effectiveDate: string, sourceQuote: string) {
  return [
    `${answerSummary}`,
    "",
    "답변은 아래 기준으로 확인하시면 됩니다.",
    "",
    ...guidance.map((item) => `- ${item}`),
    "",
    "---",
    "",
    "#### 관련 레퍼런스",
    "",
    `- 규정명: ${regulationName}`,
    `- 근거 조항: ${clause}`,
    `- 시행일: ${effectiveDate}`,
    "",
    "#### 참고 원문",
    "",
    `> ${sourceQuote}`,
    "",
    POLICY_FOOTER,
  ].join("\n")
}

export const compliancePromptSuggestions = [
  "복무규정에서 연차 사용 기준을 규정명과 조항까지 포함하여 설명해 주세요.",
  "출장 여비 정산 기준을 관련 규정과 시행일 기준으로 정리해 주세요.",
  "유연근무 신청 가능 조건을 근거 조항과 함께 안내해 주세요.",
]

export const complianceHistoryPresets: ComplianceHistoryPreset[] = [
  {
    id: "leave-policy",
    title: "연차 사용 기준 확인",
    description: "복무규정, 조항, 시행일 포함 답변",
    messages: buildMessages(
      "compliance-history-leave-policy",
      "2026-03-23T11:00:00+09:00",
      "복무규정에서 연차 사용 기준을 규정명과 조항까지 포함하여 설명해 주세요.",
      buildPolicyResponse(
        "연차는 발생 일수와 잔여 일수를 확인한 뒤, 사전 승인 절차에 따라 사용할 수 있습니다.",
        [
          "당해 연도 발생 연차와 잔여 일수를 먼저 확인합니다.",
          "부서장 승인 여부와 업무 인수인계 필요성을 함께 검토합니다.",
          "반차·반반차 사용 가능 여부는 운영 지침을 추가 확인합니다.",
        ],
        "복무규정",
        "제14조(연차휴가) 제1항, 제3항",
        "2025-01-01",
        "직원은 연차휴가 발생 범위 내에서 소속 부서장의 승인을 받아 휴가를 사용할 수 있다.",
      ),
    ),
  },
  {
    id: "travel-expense-policy",
    title: "출장 여비 기준 확인",
    description: "여비규정과 지급 기준 예시",
    messages: buildMessages(
      "compliance-history-travel-expense",
      "2026-03-23T11:20:00+09:00",
      "출장 여비 정산 기준을 관련 규정과 시행일 기준으로 정리해 주세요.",
      buildPolicyResponse(
        "출장 여비는 사전 승인된 출장에 한해 지급되며, 교통비·식비·숙박비는 정해진 기준 범위 내에서 정산합니다.",
        [
          "출장 명령 승인 여부를 먼저 확인합니다.",
          "영수증 등 증빙자료 제출 범위를 함께 안내합니다.",
          "교통수단별 정산 가능 기준을 구분해 설명합니다.",
        ],
        "여비규정",
        "제7조(여비의 종류), 제10조(지급 기준)",
        "2025-01-01",
        "여비는 출장 목적과 기간, 이동 수단에 따라 정한 기준에 따라 지급한다.",
      ),
    ),
  },
  {
    id: "flex-work-policy",
    title: "유연근무 신청 기준",
    description: "근무운영지침 기반 답변 예시",
    messages: buildMessages(
      "compliance-history-flex-work",
      "2026-03-23T11:40:00+09:00",
      "유연근무 신청 가능 조건을 근거 조항과 함께 안내해 주세요.",
      buildPolicyResponse(
        "유연근무는 직무 특성과 부서 운영 상황을 고려해 신청할 수 있으며, 승인 권한자 검토 후 적용됩니다.",
        [
          "직무별 적용 가능 여부를 확인합니다.",
          "부서장 승인 및 운영 일정 반영 여부를 함께 검토합니다.",
          "복무관리 시스템 신청 절차를 추가 안내합니다.",
        ],
        "근무운영지침",
        "제9조(유연근무 신청), 제11조(승인 및 운영)",
        "2026-01-15",
        "유연근무는 기관 운영에 지장이 없는 범위에서 신청할 수 있으며, 승인권자의 승인을 받아 시행한다.",
      ),
    ),
  },
]

export function getCompliancePresetMessages(presetId: string | null) {
  if (!presetId) return null
  return complianceHistoryPresets.find((item) => item.id === presetId)?.messages ?? null
}

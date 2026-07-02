import { Message } from "@/lib/event-system"

type StaffSearchHistoryPreset = {
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

export const staffSearchPromptSuggestions = [
  "개인회생 신청 후 보완 서류 문의 건의 연결 가능한 담당자를 확인해 주세요.",
  "소액대출 관련 문의가 접수되었을 때 우선 배정할 부서와 담당자를 안내해 주세요.",
  "민원인의 진행 상황 확인 요청 건에 대해 연결 가능한 담당자 후보를 제시해 주세요.",
]

export const staffSearchHistoryPresets: StaffSearchHistoryPreset[] = [
  {
    id: "rehab-doc-owner",
    title: "개인회생 서류 보완 담당",
    description: "보완 서류 검토 담당자 추천",
    messages: buildMessages(
      "staff-search-rehab-doc-owner",
      "2026-03-23T13:00:00+09:00",
      "개인회생 신청 후 보완 서류 관련 문의가 접수되었습니다. 우선 연결할 담당자를 확인해 주세요.",
      [
        "개인회생 보완 서류 문의는 아래 순서로 배정하는 것이 적절합니다.",
        "",
        "### 1차 추천 담당자",
        "- 성명: 김하늘",
        "- 부서: 채무조정지원부",
        "- 역할: 개인회생 접수 및 보완 서류 검토",
        "- 연락처: 내선 2184 / 02-0000-2184",
        "",
        "### 2차 협업 담당자",
        "- 성명: 박정우",
        "- 부서: 민원지원센터",
        "- 역할: 접수 상태 확인 및 민원 응대",
        "- 연락처: 내선 1107",
        "",
        "### 배정 기준",
        "- 보완 서류의 적정성 검토가 필요한 경우 채무조정지원부를 우선 배정합니다.",
        "- 진행 상태 확인만 필요한 경우 민원지원센터에서 1차 응대 후 이관할 수 있습니다.",
      ].join("\n"),
    ),
  },
  {
    id: "microloan-owner",
    title: "소액대출 문의 담당",
    description: "소액대출 접수 담당자 예시",
    messages: buildMessages(
      "staff-search-microloan-owner",
      "2026-03-23T13:20:00+09:00",
      "소액대출 관련 문의가 접수되었습니다. 우선 배정할 부서와 담당자를 안내해 주세요.",
      [
        "소액대출 문의는 다음과 같이 배정할 수 있습니다.",
        "",
        "### 우선 배정 담당자",
        "- 성명: 이수민",
        "- 부서: 서민금융지원부",
        "- 역할: 소액대출 상품 안내 및 자격 검토",
        "- 연락처: 내선 3072",
        "",
        "### 대체 담당자",
        "- 성명: 정현우",
        "- 부서: 고객상담센터",
        "- 역할: 기본 자격 안내 및 상담 예약 연계",
        "- 연락처: 내선 1003",
        "",
        "### 안내 메모",
        "- 상품 자격 확인이 필요한 경우 서민금융지원부 우선 배정",
        "- 단순 문의는 고객상담센터에서 기본 응대한 뒤 이관 가능",
      ].join("\n"),
    ),
  },
  {
    id: "status-followup-owner",
    title: "진행상황 확인 담당",
    description: "상태 조회용 담당자 후보",
    messages: buildMessages(
      "staff-search-status-followup-owner",
      "2026-03-23T13:40:00+09:00",
      "민원인으로부터 진행 상황 확인 요청이 접수되었습니다. 연결 가능한 담당자 후보를 제시해 주세요.",
      [
        "진행 상황 확인 요청은 아래 담당자 후보로 연결할 수 있습니다.",
        "",
        "### 1순위",
        "- 성명: 최유진",
        "- 부서: 민원지원센터",
        "- 역할: 접수 상태 조회 및 회신 일정 안내",
        "",
        "### 2순위",
        "- 성명: 한도윤",
        "- 부서: 고객경험혁신팀",
        "- 역할: 장기 미회신 민원 escalations",
        "",
        "### 배정 기준",
        "- 접수번호가 있는 일반 조회 건은 민원지원센터 우선",
        "- 지연 민원 또는 민감 민원은 고객경험혁신팀 병행 검토",
      ].join("\n"),
    ),
  },
]

export function getStaffSearchPresetMessages(presetId: string | null) {
  if (!presetId) return null
  return staffSearchHistoryPresets.find((item) => item.id === presetId)?.messages ?? null
}

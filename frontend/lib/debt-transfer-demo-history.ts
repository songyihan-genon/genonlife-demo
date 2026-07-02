import { Message } from "@/lib/event-system"

// ─────────────────────────────────────────────
// Chain visualization HTML helper
// ─────────────────────────────────────────────

type ChainStep = {
  name: string
  role: string
  period?: string   // e.g. "2022~2023"
  type?: string     // e.g. "매각"
  isFinal?: boolean
}

function buildChainViz(steps: ChainStep[]): string {
  const nodeStyle = (isFinal?: boolean) =>
    isFinal
      ? `background:#005BAC;color:#ffffff;border-radius:8px;padding:10px 18px;text-align:center;flex-shrink:0;outline:2px solid rgba(255,145,0,0.3);outline-offset:2px`
      : `background:#153AD4;color:#ffffff;border-radius:8px;padding:10px 18px;text-align:center;flex-shrink:0`

  const arrowBlock = (period: string, type: string) =>
    `<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;padding:0 6px;color:#9CA3AF">` +
    `<span style="font-size:10px;white-space:nowrap;margin-bottom:2px">${period} · ${type}</span>` +
    `<span style="font-size:22px;line-height:1">→</span>` +
    `</div>`

  const nodeBlock = (step: ChainStep) =>
    `<div style="${nodeStyle(step.isFinal)}">` +
    `<div style="font-size:13px;font-weight:700;letter-spacing:-0.3px">${step.name}</div>` +
    `<div style="font-size:10px;margin-top:3px;opacity:0.85">${step.role}</div>` +
    `</div>`

  let inner = ""
  steps.forEach((step, i) => {
    inner += nodeBlock(step)
    if (i < steps.length - 1) {
      const next = steps[i + 1]
      inner += arrowBlock(next.period ?? "", next.type ?? "매각")
    }
  })

  return (
    `<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;` +
    `padding:16px 20px;background:linear-gradient(135deg,#F0F4FF 0%,#F8FAFF 100%);` +
    `border-radius:12px;border:1px solid #D5DFF7;margin:12px 0">` +
    inner +
    `</div>`
  )
}

const CHAIN_A = buildChainViz([
  { name: "A카드",    role: "원채권기관" },
  { name: "D대부업체", role: "1차 양수기관", period: "2022~2023", type: "매각" },
  { name: "M자산관리", role: "최종 보유(추정)", period: "2024~2025", type: "매각", isFinal: true },
])

// ─────────────────────────────────────────────
// Seed messages
// ─────────────────────────────────────────────

const baseTime = new Date("2026-03-23T09:00:00+09:00")
const sessionId = "seed-debt-transfer"

export const debtTransferSeedMessages: Message[] = [
  {
    id: "debt-transfer-user-1",
    role: "user",
    content: "A카드 채권이 현재 어디에 있을 가능성이 높아?",
    timestamp: baseTime,
    sessionId,
  },
  {
    id: "debt-transfer-assistant-1",
    role: "assistant",
    content: [
      "A카드 채권의 최근 3년간 양수도 이력 분석 결과입니다.",
      "",
      "### 양도 대상 기관 예상 목록",
      "",
      "| 순위 | 양수기관 | 유형 | 추정 건수 | 비중 | 신뢰도 |",
      "|------|----------|------|-----------|------|--------|",
      "| 1 | **D대부업체** | 대부업체 | 5,230건 | 43.2% | 88% |",
      "| 2 | B채권관리 | 채권관리사 | 3,800건 | 31.4% | 82% |",
      "| 3 | C에셋대부 | 대부업체 | 3,080건 | 25.4% | 78% |",
      "",
      "### 연도별 트렌드",
      "",
      "- **2022년**: D대부업체, B채권관리로 1차 양도 (총 9,030건)",
      "- **2023~2024년**: D대부업체 → M자산관리로 2차 양도 (600건)",
      "- **2025년**: B채권관리, C에셋대부로 분산 보유 중",
      "",
      "---",
      "",
      "※ 과거 실적 기반 참고 정보입니다. 실제 현황과 다를 수 있으며, 공식 확인 후 활용하세요.",
    ].join("\n"),
    timestamp: new Date(baseTime.getTime() + 60_000),
    sessionId,
    isMarkdown: true,
  },
  {
    id: "debt-transfer-user-2",
    role: "user",
    content: "3년 전 받은 독촉장인데 A카드라고 적혀 있어. 현재 양도 가능성이 높은 기관은?",
    timestamp: new Date(baseTime.getTime() + 120_000),
    sessionId,
  },
  {
    id: "debt-transfer-assistant-2",
    role: "assistant",
    content: [
      "A카드 채권의 2022년 이후 양수도 체인을 추적한 결과입니다.",
      "",
      CHAIN_A,
      "",
      "D대부업체가 1차 양수기관(5,230건, 43.2%)이나, D대부업체에서 M자산관리로 2차 양도된 이력이 600건 확인됩니다. 현 시점에서는 **M자산관리**가 최종 보유기관일 가능성이 있습니다.",
      "",
      "| 구분 | 기관 | 이전 유형 | 건수 | 기간 |",
      "|------|------|-----------|------|------|",
      "| 1차 양수 | D대부업체 | 매각 | 5,230건 | 2022.01~2023.12 |",
      "| 2차 양수 | M자산관리 | 매각 | 600건 | 2024.01~2025.12 |",
      "",
      "참고: 해당 이전 중 합병에 의한 변경 건은 없으며, 모두 채권기관 변경(매각)으로 신고된 건입니다.",
      "",
      "---",
      "",
      "※ 과거 실적 기반 참고 정보입니다. 실제 현황과 다를 수 있으며, 공식 확인 후 활용하세요.",
    ].join("\n"),
    timestamp: new Date(baseTime.getTime() + 180_000),
    sessionId,
    isMarkdown: true,
  },
]

// ─────────────────────────────────────────────
// Prompt suggestions
// ─────────────────────────────────────────────

export const debtTransferPromptSuggestions: string[] = [
  "A카드 채권이 현재 어디에 있을 가능성이 높아?",
  "3년 전 받은 독촉장인데 A카드라고 적혀 있어. 현재 양도 가능성이 높은 기관은?",
  "B채권관리가 보유한 채권의 원채권 기관을 알려줘.",
  "전체 양수도 이력 현황을 요약해줘.",
]

// ─────────────────────────────────────────────
// Mock response generator
// ─────────────────────────────────────────────

export function generateDebtTransferResponse(userMsg: string): string {
  const msg = userMsg.toLowerCase()

  if (msg.includes("독촉장") || msg.includes("체인") || msg.includes("추적") || msg.includes("양도 가능성")) {
    return [
      "A카드 채권의 2022년 이후 양수도 체인을 추적한 결과입니다.",
      "",
      CHAIN_A,
      "",
      "D대부업체가 1차 양수기관(5,230건, 43.2%)이나, D대부업체에서 M자산관리로 2차 양도된 이력이 600건 확인됩니다. 현 시점에서는 **M자산관리**가 최종 보유기관일 가능성이 있습니다.",
      "",
      "| 구분 | 기관 | 이전 유형 | 건수 | 기간 |",
      "|------|------|-----------|------|------|",
      "| 1차 양수 | D대부업체 | 매각 | 5,230건 | 2022.01~2023.12 |",
      "| 2차 양수 | M자산관리 | 매각 | 600건 | 2024.01~2025.12 |",
      "",
      "참고: 해당 이전 중 합병에 의한 변경 건은 없으며, 모두 채권기관 변경(매각)으로 신고된 건입니다.",
      "",
      "---",
      "※ 과거 실적 기반 참고 정보입니다. 실제 현황과 다를 수 있으며, 공식 확인 후 활용하세요.",
    ].join("\n")
  }

  if (msg.includes("a카드") || msg.includes("어디") || msg.includes("가능성")) {
    return [
      "A카드 채권의 최근 3년간 양수도 이력 분석 결과입니다.",
      "",
      "### 양도 대상 기관 예상 목록",
      "",
      "| 순위 | 양수기관 | 유형 | 추정 건수 | 비중 | 신뢰도 |",
      "|------|----------|------|-----------|------|--------|",
      "| 1 | **D대부업체** | 대부업체 | 5,230건 | 43.2% | 88% |",
      "| 2 | B채권관리 | 채권관리사 | 3,800건 | 31.4% | 82% |",
      "| 3 | C에셋대부 | 대부업체 | 3,080건 | 25.4% | 78% |",
      "",
      "### 연도별 트렌드",
      "",
      "- **2022년**: D대부업체, B채권관리로 1차 양도 (총 9,030건)",
      "- **2023~2024년**: D대부업체 → M자산관리로 2차 양도 (600건)",
      "- **2025년**: B채권관리, C에셋대부로 분산 보유 중",
      "",
      "---",
      "※ 과거 실적 기반 참고 정보입니다. 실제 현황과 다를 수 있으며, 공식 확인 후 활용하세요.",
    ].join("\n")
  }

  if (msg.includes("b채권관리")) {
    return [
      "**B채권관리** 역방향 탐색 결과입니다.",
      "",
      "B채권관리는 아래 원채권 기관으로부터 채권을 양수한 이력이 확인됩니다.",
      "",
      "| 원채권 기관 | 채권 유형 | 양수 건수 | 양수 기간 |",
      "|------------|-----------|-----------|-----------|",
      "| A카드 | 카드채권 | 3,800건 | 2022.03~2022.12 |",
      "| E캐피탈 | 할부채권 | 1,200건 | 2023.06~2023.12 |",
      "",
      "---",
      "※ 과거 실적 기반 참고 정보입니다.",
    ].join("\n")
  }

  if (msg.includes("d대부업체")) {
    return [
      "**D대부업체** 보유 채권 내역입니다.",
      "",
      "| 원채권 기관 | 채권 유형 | 건수 | 양수 기간 |",
      "|------------|-----------|------|-----------|",
      "| A카드 | 카드채권 | 5,230건 | 2022.01~2023.12 |",
      "",
      "이 중 600건은 M자산관리로 2차 양도된 이력이 있습니다.",
      "",
      "---",
      "※ 과거 실적 기반 참고 정보입니다.",
    ].join("\n")
  }

  if (msg.includes("m자산관리")) {
    return [
      "**M자산관리** 보유 채권 내역입니다.",
      "",
      "| 원채권 기관 | 이전 경로 | 건수 | 양수 기간 |",
      "|------------|-----------|------|-----------|",
      "| A카드 | A카드 → D대부업체 → M자산관리 | 600건 | 2024.01~2025.12 |",
      "",
      "---",
      "※ 과거 실적 기반 참고 정보입니다.",
    ].join("\n")
  }

  if (msg.includes("전체") || msg.includes("현황") || msg.includes("이력") || msg.includes("요약")) {
    return [
      "현재 지식베이스에 구성된 **채권양수도 이력 현황**입니다.",
      "",
      "| 구분 | 내용 |",
      "|------|------|",
      "| 총 이벤트 수 | 8건 |",
      "| 원채권 기관 | A카드, E캐피탈 |",
      "| 중간 양수 기관 | D대부업체, B채권관리 |",
      "| 최종 보유 기관 | M자산관리, C에셋대부 |",
      "| 총 양수도 건수 | 약 13,910건 |",
      "| 데이터 출처 | 채권기관 변경 신고 |",
      "",
      "추론 또는 역방향 탐색을 원하시면 기관명을 말씀해주세요.",
    ].join("\n")
  }

  return [
    "안녕하세요. **채권양수도 에이전트**입니다.",
    "",
    "아래와 같은 질의를 처리할 수 있습니다.",
    "",
    "- **채권 위치 추론**: \"A카드 채권이 지금 어디 있나요?\"",
    "- **체인 추적**: \"3년 전 독촉장인데 A카드라고 적혀 있어. 현재 양도 가능성이 높은 기관은?\"",
    "- **역방향 탐색**: \"B채권관리가 보유한 채권의 원채권 기관을 알려줘\"",
    "- **이력 현황**: \"전체 양수도 이력을 요약해줘\"",
    "",
    "질문을 입력해 주세요.",
  ].join("\n")
}

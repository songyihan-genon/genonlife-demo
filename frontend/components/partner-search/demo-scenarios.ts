/**
 * SFR-021 · Agent 협약기관 검색 시연용 시나리오 3종.
 *
 * 초기 화면의 추천 질문 카드에서 선택하면 해당 시나리오의
 * 자연어 질의 → 검색 조건 자동 추출 → 하이브리드 검색 결과가 대화창에 재생된다.
 */

import type { PresetQuery } from "./types"

export interface PartnerSearchScenario {
  id: "A" | "B" | "C"
  /** 초기 화면 카드·대화창 상단에 노출되는 짧은 부제 */
  caption: string
  /** 사용자 자연어 질의 (추천 질문 그대로 재생) */
  userQuery: string
  /** 검색 조건 자동 추출 결과 */
  extractedFilters: PresetQuery["extractedFilters"]
  /** 하이브리드 검색 결과 ID 리스트 */
  resultIds: string[]
  /** 약칭/유사 명칭 매칭 시 하이라이트할 토큰 (옵션) */
  highlightAlias?: string
}

export const partnerSearchScenarios: PartnerSearchScenario[] = [
  {
    id: "A",
    caption: "제도 중심 · 개인회생 취급 기관",
    userQuery: "개인회생 지원을 해주는 협약기관을 찾아 주세요.",
    extractedFilters: [
      { label: "제도: 개인회생", category: "제도" },
      { label: "기관유형: 협회", category: "기관유형" },
    ],
    resultIds: ["p-001", "p-002", "p-005", "p-012"],
  },
  {
    id: "B",
    caption: "지역 + 제도 복합 · 수도권 소액대출",
    userQuery: "수도권에서 소액대출을 연계해 주는 기관이 있을까요?",
    extractedFilters: [
      { label: "지역: 서울·경기·인천", category: "지역" },
      { label: "제도: 소액대출", category: "제도" },
    ],
    resultIds: ["p-008", "p-003", "p-004", "p-005"],
  },
  {
    id: "C",
    caption: "약칭 매칭 · '신복위 서울'",
    userQuery: "‘신복위 서울’ 근처에서 상담 받을 수 있는 곳을 알려 주세요.",
    extractedFilters: [
      { label: "지역: 서울", category: "지역" },
      { label: "약칭: 신복위 서울", category: "기관유형" },
    ],
    resultIds: ["p-001", "p-008", "p-013"],
    highlightAlias: "신복위",
  },
]

export function getScenarioById(
  id: PartnerSearchScenario["id"],
): PartnerSearchScenario {
  const found = partnerSearchScenarios.find((s) => s.id === id)
  if (!found) {
    throw new Error(`Unknown SFR-021 scenario id: ${id}`)
  }
  return found
}

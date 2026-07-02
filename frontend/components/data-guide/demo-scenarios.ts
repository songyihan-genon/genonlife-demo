/**
 * SFR-016 · Agent 데이터길잡이 시연용 시나리오 3종.
 *
 * 구성도의 "사용자 질의 + 파일" 조합을 그대로 반영해, 각 시나리오가
 * PPT 화면 예시 슬라이드 한 장의 재료가 된다. 채팅 카드에 사용자 메시지
 * (질의 + 파일 첨부 칩)와 에이전트 응답(분석/문서/PII 차단)을 차례로 렌더한다.
 */

import type { DataGuideScenario } from "./types"

export const dataGuideScenarios: DataGuideScenario[] = [
  {
    id: "A",
    label: "상담 데이터 분석",
    userQuery: "상담유형별 평균 처리시간이 어떻게 되는지 분석해 주세요.",
    fileKind: "xlsx",
    mode: "data",
  },
  {
    id: "B",
    label: "개정안 문서 분석",
    userQuery: "이번 개정안의 핵심 변경 사항과 근거 조항을 요약해 주세요.",
    fileKind: "hwpx",
    mode: "document",
  },
  {
    id: "C",
    label: "PII 자동 차단",
    userQuery: "이번 달 민원 이력 데이터를 분석해 주세요.",
    fileKind: "xlsx-pii",
    mode: "pii-blocked",
    clarifyTurn: {
      agentQuestion:
        "업로드 파일에서 개인정보가 탐지되었습니다.\n\n· 주민등록번호 2건\n· 전화번호 5건\n\n비식별화 처리 후 다시 업로드해 주세요.",
      userFollowUp: "이 파일로 분석 진행해 주세요.",
    },
  },
  {
    id: "D",
    label: "질의 불명확 · 역질문",
    userQuery: "상담이력 파일 좀 정리해서 보여주세요.",
    fileKind: "xlsx",
    mode: "clarify",
    clarifyTurn: {
      agentQuestion:
        "분석 기준을 조금 더 구체적으로 알려주시면 적합한 파이프라인을 실행할 수 있습니다. 어떤 관점으로 정리할까요? (예: 상담유형별 · 월별 · 담당부서별) 어떤 지표를 우선으로 보시겠어요? (예: 건수 · 평균 처리시간 · 만족도)",
      userFollowUp: "상담유형별로 평균 처리시간을 분석해 주세요.",
    },
  },
  {
    id: "E",
    label: "필수 데이터 누락",
    userQuery: "상담 만족도 추이를 분석해 주세요.",
    fileKind: "xlsx-incomplete",
    mode: "missing-data",
  },
]

export function getScenarioById(
  id: DataGuideScenario["id"],
): DataGuideScenario {
  const found = dataGuideScenarios.find((s) => s.id === id)
  if (!found) {
    throw new Error(`Unknown SFR-016 scenario id: ${id}`)
  }
  return found
}

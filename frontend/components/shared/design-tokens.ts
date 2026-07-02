/**
 * 목업 전용 디자인 토큰.
 *
 * PPT 컬러칩과 1:1 매핑.
 * 전역 포털 primary(#005BAC)는 건드리지 않고, 목업 내부에서만 사용한다.
 */

export const designColors = {
  /** 핵심 처리 노드 — Agent 주요 단계 박스·Citation 배지 */
  nodePrimary: "#4A90D9",
  /** 평가/가드레일/오류 대응 — 관련도 평가·PII 경고·오류 로그 */
  nodeGuardrail: "#1B3A4B",
  /** 시작/끝/분기 — 입출력 노드·분기점 */
  nodeTerminal: "#D9D9D9",
  /** 보조/역질문/재작성 — 비활성·점선 루프·retry */
  nodeAuxiliary: "#8C8C8C",
  /** 영역별 KB 배경 */
  knowledgeBaseBg: "#e8f0fe",
  /** 데이터분석 모드 배경 */
  dataAnalysisBg: "#c4d8ef",
} as const

export type DesignColorKey = keyof typeof designColors

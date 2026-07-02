/**
 * SFR-016 · Agent 데이터길잡이 목업 공용 타입.
 */

/**
 * 업로드 파일 유형.
 * - `xlsx`: 정상 XLSX/CSV (데이터 분석 모드)
 * - `hwpx`: 정상 HWPX/PDF (문서 분석 모드)
 * - `xlsx-pii`: 개인정보가 포함된 XLSX — 업로드 즉시 차단
 */
export type SampleFileKind = "xlsx" | "hwpx" | "xlsx-pii" | "xlsx-incomplete"

export interface SampleFile {
  kind: SampleFileKind
  name: string
  sizeLabel: string
}

export interface DataColumn {
  name: string
  dtype: string
  examples: string[]
}

export interface AnalysisResultRow {
  category: string
  avgMinutes: number
  count: number
}

export interface MetricRow {
  label: string
  value: string
  delta?: string
}

export interface DocumentTreeNode {
  id: string
  title: string
  children?: DocumentTreeNode[]
}

export interface CitationSnippet {
  id: string
  label: string
  quote: string
}

export interface SummaryParagraph {
  body: string
  citations: string[]
}

export interface AdminDataset {
  name: string
  owner: string
  registeredAt: string
  status: "비식별화 완료" | "비식별화 진행" | "검토 필요"
}

/**
 * 에이전트 응답 모드.
 * - `data`: 데이터 분석 파이프라인 (컬럼 인식 → 코드 생성 → 격리 실행 → 결과)
 * - `document`: 문서 분석 파이프라인 (파싱 → RAG → 출처 명시)
 * - `pii-blocked`: PII 탐지로 업로드 차단 — 사용자에게 재업로드 유도
 * - `clarify`: 질의가 모호해 Agent가 역질문으로 정보 구체화 요청
 */
export type DataGuideMode = "data" | "document" | "pii-blocked" | "clarify" | "missing-data"

/**
 * SFR-016 시나리오 — 사용자 질의 + 첨부 파일 조합.
 * 초기 화면의 추천 질문 카드에서 선택하면 해당 시나리오가 대화창에 재생된다.
 */
export interface DataGuideScenario {
  id: "A" | "B" | "C" | "D" | "E"
  /** 탭 라벨 · 추천 질문 카테고리 */
  label: string
  /** 사용자 자연어 질의 */
  userQuery: string
  /** 첨부 파일 */
  fileKind: SampleFileKind
  /** 분기될 모드 */
  mode: DataGuideMode
  /**
   * 멀티턴 시나리오 — 질의가 모호할 때 Agent가 역질문을 하고
   * 사용자가 구체적인 답변을 제시한 뒤 분석 결과를 내는 흐름에 사용한다.
   * `clarify` 모드에서만 세팅.
   */
  clarifyTurn?: {
    /** Agent의 역질문 문장 */
    agentQuestion: string
    /** 사용자의 구체적인 재답변 */
    userFollowUp: string
  }
}

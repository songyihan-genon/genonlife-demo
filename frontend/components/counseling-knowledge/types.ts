/**
 * SFR-015 · Agent 상담지식 목업 공용 타입.
 */

export type ChatRole = "user" | "agent"

export type AgentBubbleTone = "normal" | "clarify" | "advisory-confirm"

export interface ChatMessage {
  id: string
  role: ChatRole
  /** 표시용 텍스트. agent 메시지 중 final=true인 경우 AnswerCard로 렌더링된다. */
  text: string
  /** 역질문 등 강조가 필요한 agent 메시지 톤 */
  tone?: AgentBubbleTone
  /** 최종 답변 여부 (마지막 agent 메시지에만 true) */
  final?: boolean
  /** PII 마스킹 원본 (시연용) */
  piiOriginal?: string
  /**
   * 이 메시지에 직접 매달려 표시될 처리 과정 트레이스/답변 데이터.
   * - clarify(역질문) 버블: intent만 채움
   * - final 답변 버블: intent + retrieval + relevance + answer 모두 채움
   */
  intent?: IntentClassification
  retrieval?: RagRetrieval
  relevance?: RelevanceEvaluation
  answer?: AnswerArtifact
}

export interface IntentClassification {
  /** 분류된 업무 영역 */
  domain: string
  /** 후보 영역 (복수 영역 시) */
  candidates?: { domain: string; score: number }[]
  /** 0 ~ 1 */
  confidence: number
  /** 임계값 (기본 0.7) */
  threshold: number
  /** 역질문 발동 여부 */
  triggeredClarify: boolean
  /** 역질문 발동 시 보여줄 로그 */
  clarifyPrompt?: string
}

export interface RetrievalHit {
  title: string
  snippet: string
  score: number
}

export interface RagRetrieval {
  knowledgeBase: string
  strategy: string
  hits: RetrievalHit[]
}

export interface RelevanceEvaluation {
  score: number
  threshold: number
  passed: boolean
  /** 재쿼리 로그 (미달 시) */
  rewriteLog?: {
    rewrittenQuery: string
    secondScore: number
  }
}

export interface CitationChip {
  label: string
  source: string
}

/**
 * CoT 추론 단계 — 구조화 문서의
 *   "근거 선택 이유(질의-근거 관련도 판단 근거) 및 추가 확인 필요 사항을 단계별로 표시"
 * 요구사항을 타입으로 반영한 구조.
 */
export interface CotStep {
  /** 단계 제목 — 예: "근거 1 · 운영규정 제5조(지원 대상)" */
  title: string
  /** 근거 선택 이유 — 질의·근거 관련도 판단의 근거 서술 */
  rationale: string
  /** (선택) 추가 확인 필요 사항 — 상담 창구에서 검증해야 할 항목 */
  followUp?: string
}

export interface AnswerArtifact {
  /** 답변 본문 텍스트 */
  body: string
  /** 인용 근거 */
  citations: CitationChip[]
  /** CoT 추론 단계 */
  cot: CotStep[]
  /** PII 마스킹 적용 메모 */
  piiMaskedFrom?: string
  /** 공통 처치 체크리스트 (항상 4개) */
  treatments: {
    citation: boolean
    cot: boolean
    advisory: boolean
    pii: boolean
  }
}

export interface CounselingPreset {
  id: "A" | "B" | "C"
  label: string
  /** 버튼에 보이는 질의 요약 */
  query: string
  /** 시나리오 설명 */
  description: string
  /** 채팅 대화 전체 (user + agent 턴) */
  messages: ChatMessage[]
  intent: IntentClassification
  retrieval: RagRetrieval
  relevance: RelevanceEvaluation
  answer: AnswerArtifact
}

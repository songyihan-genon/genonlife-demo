/**
 * SFR-021 · Agent 협약기관 검색 목업에서 공유하는 타입.
 */

export type InstitutionType = "은행" | "신협" | "협회" | "사회복지기관" | "공사"

export type PartnerProgram =
  | "개인회생"
  | "새출발기금"
  | "소액대출"
  | "사전채무조정"
  | "신용교육"

export type PartnerRegion =
  | "서울"
  | "경기"
  | "인천"
  | "부산"
  | "대구"
  | "대전"
  | "광주"
  | "강원"

export interface Partner {
  id: string
  name: string
  shortName?: string
  region: PartnerRegion
  institutionType: InstitutionType
  programs: PartnerProgram[]
  address: string
  phone: string
  /** 담당 부서 — RFP "담당자 정보를 검색·응답" 요구사항 대응 */
  department: string
  metaScore: number
  vectorScore: number
}

export type FilterCategory = "지역" | "제도" | "기관유형"

export interface ExtractedFilter {
  label: string
  category: FilterCategory
}

export interface PresetQuery {
  id: string
  query: string
  extractedFilters: ExtractedFilter[]
  resultIds: string[]
  /** 약칭/유사 명칭 하이라이트 데모용 — 매칭 대상 부분 문자열 */
  highlightAlias?: string
}

export type BatchStatus = "성공" | "실패" | "부분 성공"

export interface BatchLogEntry {
  id: string
  executedAt: string
  totalCount: number
  successCount: number
  failureCount: number
  status: BatchStatus
  duration: string
}

export interface ErrorLogEntry {
  id: string
  title: string
  occurredAt: string
  detail: string
  kbRetained: boolean
  reasonLogged: boolean
  adminNotified: boolean
}

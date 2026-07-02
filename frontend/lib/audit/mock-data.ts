import type { AuditCase, CaseDetail } from "./types"

export const CENTER_OPTIONS = [
  "전체",
  "본사",
  "강남 콜센터",
  "부산 콜센터",
  "광주 콜센터",
  "대전 콜센터",
  "인천 콜센터",
] as const

export const CONSULT_TYPE_OPTIONS = [
  "전체",
  "가입 상담",
  "해지 상담",
  "보장 변경",
  "보험금 청구",
  "만기 안내",
  "납입 변경",
  "기타 문의",
] as const

export const DEFAULT_FILTER = {
  contactDate: "2026-05-12",
  center: "전체",
  consultType: "전체",
}

export const TOTAL_QA_PAIRS = 24000

export const AUDIT_CASES: AuditCase[] = [
  { id: "K20260512-001", customerId: "C001", callId: "K123", agentName: "김상담 #25", contactTime: "14:23", reason: "환급률 안내 불일치", status: "review" },
  { id: "K20260512-002", customerId: "C002", callId: "K124", agentName: "박상담 #34", contactTime: "15:01", reason: "보장범위 누락 안내", status: "review" },
  { id: "K20260512-003", customerId: "C003", callId: "K125", agentName: "이상담 #41", contactTime: "16:12", reason: "만기일 안내 오류", status: "confirmed" },
  { id: "K20260512-004", customerId: "C004", callId: "K126", agentName: "정상담 #18", contactTime: "16:45", reason: "면책기간 안내 누락", status: "review" },
  { id: "K20260512-005", customerId: "C005", callId: "K127", agentName: "최상담 #52", contactTime: "17:08", reason: "납입주기 안내 불일치", status: "confirmed" },
  { id: "K20260512-006", customerId: "C006", callId: "K128", agentName: "강상담 #07", contactTime: "09:11", reason: "보험금 청구절차 누락", status: "review" },
  { id: "K20260512-007", customerId: "C007", callId: "K129", agentName: "윤상담 #22", contactTime: "09:42", reason: "특약 조건 오안내", status: "review" },
  { id: "K20260512-008", customerId: "C008", callId: "K130", agentName: "장상담 #39", contactTime: "10:05", reason: "갱신주기 안내 오류", status: "confirmed" },
  { id: "K20260512-009", customerId: "C009", callId: "K131", agentName: "한상담 #16", contactTime: "10:33", reason: "해지환급금 산정 오안내", status: "review" },
  { id: "K20260512-010", customerId: "C010", callId: "K132", agentName: "서상담 #04", contactTime: "11:01", reason: "보험료 납입 면제 조건 불일치", status: "review" },
  { id: "K20260512-011", customerId: "C011", callId: "K133", agentName: "오상담 #28", contactTime: "11:24", reason: "수익자 변경 절차 누락", status: "confirmed" },
  { id: "K20260512-012", customerId: "C012", callId: "K134", agentName: "권상담 #11", contactTime: "11:58", reason: "보장개시일 안내 오류", status: "review" },
  { id: "K20260512-013", customerId: "C013", callId: "K135", agentName: "황상담 #46", contactTime: "13:02", reason: "중도인출 조건 오안내", status: "review" },
  { id: "K20260512-014", customerId: "C014", callId: "K136", agentName: "송상담 #19", contactTime: "13:31", reason: "약관대출 한도 안내 오류", status: "confirmed" },
  { id: "K20260512-015", customerId: "C015", callId: "K137", agentName: "임상담 #33", contactTime: "13:55", reason: "면책사유 안내 누락", status: "review" },
  { id: "K20260512-016", customerId: "C016", callId: "K138", agentName: "조상담 #08", contactTime: "14:10", reason: "갱신 보험료 안내 불일치", status: "review" },
  { id: "K20260512-017", customerId: "C017", callId: "K139", agentName: "신상담 #27", contactTime: "14:48", reason: "고지의무 안내 누락", status: "confirmed" },
  { id: "K20260512-018", customerId: "C018", callId: "K140", agentName: "백상담 #13", contactTime: "15:20", reason: "보험금 지급 기한 오안내", status: "review" },
  { id: "K20260512-019", customerId: "C019", callId: "K141", agentName: "노상담 #36", contactTime: "15:42", reason: "할인특약 적용 조건 오류", status: "review" },
  { id: "K20260512-020", customerId: "C020", callId: "K142", agentName: "유상담 #29", contactTime: "16:03", reason: "재가입 가능 여부 오안내", status: "confirmed" },
  { id: "K20260512-021", customerId: "C021", callId: "K143", agentName: "전상담 #15", contactTime: "16:27", reason: "보장한도 안내 누락", status: "review" },
  { id: "K20260512-022", customerId: "C022", callId: "K144", agentName: "남상담 #21", contactTime: "16:51", reason: "청약철회 기간 안내 오류", status: "review" },
  { id: "K20260512-023", customerId: "C023", callId: "K145", agentName: "심상담 #44", contactTime: "17:14", reason: "보험계약 부활 조건 오안내", status: "confirmed" },
  { id: "K20260512-024", customerId: "C024", callId: "K146", agentName: "배상담 #06", contactTime: "17:38", reason: "면책기간 산정 오류", status: "review" },
]

export const CASE_DETAILS: Record<string, CaseDetail> = {
  "K20260512-001": {
    callId: "K20260512-K123",
    dialog: [
      { speaker: "customer", time: "14:23:15", text: "5년 됐는데 해지하면 얼마 받아요?" },
      { speaker: "agent", time: "14:23:22", text: "네 고객님, 이 상품의 환급률은 100%입니다." },
      { speaker: "customer", time: "14:23:30", text: "아 100%면 다 받는 거네요. 알겠습니다." },
    ],
    verdict: {
      kind: "misguidance",
      result: "misguidance",
      reason:
        "고객이 5년 경과 시점 환급률을 문의했으나, 상담사는 100%로 안내함. 약관 제22조에 따르면 가입 후 5년 경과 시 환급률은 80%이므로 잘못된 안내.",
    },
    knowledgeChunks: [
      {
        source: "약관 제22조 (환급률)",
        content:
          "본 상품의 환급률은 가입 후 5년 경과 시 80%, 10년 경과 시 100%이며, 가입 시점부터 경과 연수에 따라 차등 적용됩니다.",
        link: "/sok/yakgwan/22",
        highlight: "가입 후 5년 경과 시 80%",
      },
      {
        source: "내규 5장 3절 (환급률 안내 기준)",
        content:
          "상담사는 환급률 안내 시 고객의 가입 경과 연수를 반드시 확인하고, 해당 시점의 환급률을 정확히 안내해야 한다. 100%로 일괄 안내하는 것은 금지된다.",
        link: "/sok/naekyu/5-3",
      },
    ],
    highlightChunk: "가입 후 5년 경과 시 80%",
  },
}

export function getCaseDetail(caseId: string | null): CaseDetail | null {
  if (!caseId) return null
  return CASE_DETAILS[caseId] ?? CASE_DETAILS["K20260512-001"]
}

import type {
  ChecklistItem,
  ContractHistoryRow,
  WorkAuditCase,
  WorkCaseDetail,
} from "./types"

export { CENTER_OPTIONS, CONSULT_TYPE_OPTIONS, DEFAULT_FILTER } from "./mock-data"

export const TOTAL_CALLS = 12000

export const WORK_AUDIT_CASES: WorkAuditCase[] = [
  { id: "K20260512-W001", customerId: "C001", callId: "K123", contractId: "L20260512-987", agentName: "김상담 #25", contactTime: "14:23", missingItems: "본인확인, 제3자 동의, 인출 동의", missingRatio: "3/8", status: "review" },
  { id: "K20260512-W002", customerId: "C002", callId: "K124", contractId: "L20260512-654", agentName: "박상담 #34", contactTime: "15:01", missingItems: "수집 동의", missingRatio: "1/8", status: "review" },
  { id: "K20260512-W003", customerId: "C003", callId: "K125", contractId: "L20260512-321", agentName: "이상담 #41", contactTime: "16:12", missingItems: "금칙어 사용", missingRatio: "2/8", status: "confirmed" },
  { id: "K20260512-W004", customerId: "C004", callId: "K126", contractId: "L20260512-445", agentName: "정상담 #18", contactTime: "16:45", missingItems: "녹취 고지, 가입 설계 동의", missingRatio: "2/8", status: "review" },
  { id: "K20260512-W005", customerId: "C005", callId: "K127", contractId: "L20260512-789", agentName: "최상담 #52", contactTime: "17:08", missingItems: "본인확인", missingRatio: "1/8", status: "confirmed" },
  { id: "K20260512-W006", customerId: "C006", callId: "K128", contractId: "L20260512-112", agentName: "강상담 #07", contactTime: "09:11", missingItems: "마무리 안내, 인사 멘트", missingRatio: "2/8", status: "review" },
  { id: "K20260512-W007", customerId: "C007", callId: "K129", contractId: "L20260512-203", agentName: "윤상담 #22", contactTime: "09:42", missingItems: "수집 동의, 제3자 동의", missingRatio: "2/8", status: "review" },
  { id: "K20260512-W008", customerId: "C008", callId: "K130", contractId: "L20260512-378", agentName: "장상담 #39", contactTime: "10:05", missingItems: "녹취 고지", missingRatio: "1/8", status: "confirmed" },
  { id: "K20260512-W009", customerId: "C009", callId: "K131", contractId: "L20260512-516", agentName: "한상담 #16", contactTime: "10:33", missingItems: "본인확인, 가입 설계 동의, 마무리 안내", missingRatio: "3/8", status: "review" },
  { id: "K20260512-W010", customerId: "C010", callId: "K132", contractId: "L20260512-624", agentName: "서상담 #04", contactTime: "11:01", missingItems: "제3자 동의", missingRatio: "1/8", status: "review" },
  { id: "K20260512-W011", customerId: "C011", callId: "K133", contractId: "L20260512-741", agentName: "오상담 #28", contactTime: "11:24", missingItems: "인출 동의, 수집 동의", missingRatio: "2/8", status: "confirmed" },
  { id: "K20260512-W012", customerId: "C012", callId: "K134", contractId: "L20260512-852", agentName: "권상담 #11", contactTime: "11:58", missingItems: "본인확인", missingRatio: "1/8", status: "review" },
  { id: "K20260512-W013", customerId: "C013", callId: "K135", contractId: "L20260512-963", agentName: "황상담 #46", contactTime: "13:02", missingItems: "녹취 고지, 본인확인, 수집 동의", missingRatio: "3/8", status: "review" },
  { id: "K20260512-W014", customerId: "C014", callId: "K136", contractId: "L20260512-174", agentName: "송상담 #19", contactTime: "13:31", missingItems: "가입 설계 동의", missingRatio: "1/8", status: "confirmed" },
  { id: "K20260512-W015", customerId: "C015", callId: "K137", contractId: "L20260512-285", agentName: "임상담 #33", contactTime: "13:55", missingItems: "마무리 안내", missingRatio: "1/8", status: "review" },
  { id: "K20260512-W016", customerId: "C016", callId: "K138", contractId: "L20260512-396", agentName: "조상담 #08", contactTime: "14:10", missingItems: "본인확인, 제3자 동의", missingRatio: "2/8", status: "review" },
  { id: "K20260512-W017", customerId: "C017", callId: "K139", contractId: "L20260512-407", agentName: "신상담 #27", contactTime: "14:48", missingItems: "수집 동의, 인출 동의", missingRatio: "2/8", status: "confirmed" },
  { id: "K20260512-W018", customerId: "C018", callId: "K140", contractId: "L20260512-518", agentName: "백상담 #13", contactTime: "15:20", missingItems: "본인확인, 녹취 고지, 가입 설계 동의, 마무리 안내", missingRatio: "4/8", status: "review" },
]

const FIRST_CASE_CHECKLIST: ChecklistItem[] = [
  { no: 1, item: "인사 멘트", done: true, location: "발화 #1", expectedScript: "안녕하세요, OO생명 ○○입니다" },
  { no: 2, item: "본인확인 멘트", done: false, location: "미수행", expectedScript: "주민등록번호 앞 6자리를 말씀해 주시겠어요?" },
  { no: 3, item: "녹취 고지", done: true, location: "발화 #3", expectedScript: "본 통화는 녹음되고 있음을 알려드립니다" },
  { no: 4, item: "수집 동의", done: true, location: "발화 #5", expectedScript: "개인정보 수집 및 이용에 동의하시겠습니까?" },
  { no: 5, item: "제3자 동의", done: false, location: "미수행", expectedScript: "타인 정보 이용에 동의하시겠습니까?" },
  { no: 6, item: "가입 설계 동의", done: true, location: "발화 #12", expectedScript: "가입설계서 발송에 동의하시겠습니까?" },
  { no: 7, item: "인출 동의", done: false, location: "미수행", expectedScript: "보험료 자동 인출에 동의하시겠습니까?" },
  { no: 8, item: "마무리 안내", done: true, location: "발화 #18", expectedScript: "추가 문의 사항이 있으시면 언제든 연락 주세요" },
]

const FIRST_CASE_HISTORY: ContractHistoryRow[] = [
  { date: "2026-04-15", callId: "K20260415-K087", missingCount: "1/8", missingItems: "본인확인", finalVerdict: "확정 (재교육 대상)", isNormal: false },
  { date: "2026-03-20", callId: "K20260320-K042", missingCount: "0/8", missingItems: "-", finalVerdict: "정상 처리", isNormal: true },
  { date: "2026-02-08", callId: "K20260208-K025", missingCount: "2/8", missingItems: "녹취 고지, 수집 동의", finalVerdict: "확정 (재교육 대상)", isNormal: false },
]

export const WORK_CASE_DETAILS: Record<string, WorkCaseDetail> = {
  "K20260512-W001": {
    callId: "K20260512-K123",
    contractId: "L20260512-987",
    dialog: [
      { speaker: "customer", time: "14:23:15", text: "가입하고 싶은데요, 어떻게 해야 하나요?" },
      { speaker: "agent", time: "14:23:22", text: "네 안녕하세요 고객님, OO생명 김상담입니다. 가입 도와드리겠습니다." },
      { speaker: "agent", time: "14:23:35", text: "본 통화는 품질 향상을 위해 녹음되고 있음을 알려드립니다." },
      { speaker: "customer", time: "14:24:10", text: "네 알겠습니다." },
      { speaker: "agent", time: "14:24:15", text: "개인정보 수집 및 이용에 동의하시겠습니까?" },
    ],
    verdict: {
      kind: "missing",
      missingItems: ["본인확인", "제3자 동의", "인출 동의"],
      missingCount: 3,
      totalCount: 8,
      reason:
        "매뉴얼 8개 항목 중 본인확인 멘트, 제3자 동의 확인, 인출 동의 멘트가 누락 확인됨",
    },
    checklist: FIRST_CASE_CHECKLIST,
    history: FIRST_CASE_HISTORY,
    historySummary:
      "본 계약 관련 상담에서 본인확인 / 녹취 고지 누락이 반복 확인되고 있습니다.",
    historyEmphasis: "재발 방지 점검 권장",
  },
}

export function getWorkCaseDetail(caseId: string | null): WorkCaseDetail | null {
  if (!caseId) return null
  return WORK_CASE_DETAILS[caseId] ?? WORK_CASE_DETAILS["K20260512-W001"]
}

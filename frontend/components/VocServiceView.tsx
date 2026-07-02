"use client"

/* ================================================================== */
/* AI VoC 서비스 — 콜/이메일/대외기관 민원 VoC AI 분석·예측·대응·리포트 콘솔     */
/*  탭: 민원 예측 / VoC 분류·이관 / 답변 초안 / 리포트 / 이슈 모니터링      */
/* ================================================================== */

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Megaphone, TrendingUp, ListChecks, FileText, BarChart3, Activity,
  AlertTriangle, Mail, Send, ShieldAlert, Sparkles, ArrowRight, CheckCircle2, Check,
  Phone, Inbox, FileWarning, MessageSquare, Bell, CalendarRange, ChevronDown, Search, Headset, X, Loader2, Tag, Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

/* ----------------------------- 모델 ----------------------------- */
export type Channel = "콜센터" | "이메일" | "대외기관 민원" | "모바일 챗봇"
type Exp = "칭찬" | "불만" | "건의·제안" | "단순문의" | "철회항변" | "기타"
type Level = "낮음" | "보통" | "높음" | "매우높음"

export type VoC = {
  id: string; customer: string; channel: Channel; datetime: string
  vocType: string; exp: Exp; dept: string; keywords: string[]
  summary: string; score: number; risk: Level; triggers: string[]; status: string
}

const CH_ICON: Record<Channel, typeof Phone> = { 콜센터: Phone, 이메일: Inbox, "대외기관 민원": FileWarning, "모바일 챗봇": MessageSquare }

export const VOCS: VoC[] = [
  { id: "VOC-260616-001", customer: "김도윤", channel: "콜센터", datetime: "06.16 09:41", vocType: "보험금 지급", exp: "불만", dept: "보상서비스부",
    keywords: ["암 진단", "부지급", "사유 불충분"], summary: "암 진단 보험금 부지급 사유에 강하게 항의, 금융감독원 민원 제기 의사 표명.", score: 88, risk: "높음", triggers: ["금감원", "분쟁조정"], status: "이관 완료" },
  { id: "VOC-260616-002", customer: "이서아", channel: "이메일", datetime: "06.16 10:08", vocType: "해지·환급", exp: "불만", dept: "고객만족부",
    keywords: ["해지환급금", "안내 상이", "차액"], summary: "해지환급금이 가입 시 안내와 다르다며 차액 근거 요구, 법적 대응 언급.", score: 73, risk: "높음", triggers: ["법적 조치"], status: "분석 완료" },
  { id: "VOC-260616-003", customer: "박준서", channel: "대외기관 민원", datetime: "06.16 10:35", vocType: "응대·서비스", exp: "불만", dept: "고객만족부",
    keywords: ["응대 불친절", "재발 방지"], summary: "상담사 응대 태도에 불쾌감 표현, 재발 방지 요청.", score: 56, risk: "보통", triggers: [], status: "이관 완료" },
  { id: "VOC-260616-004", customer: "최유나", channel: "콜센터", datetime: "06.16 11:02", vocType: "수금·납입", exp: "불만", dept: "수금관리부",
    keywords: ["자동이체", "이중 출금", "환불"], summary: "보험료 이중 출금 확인 및 환불 요청.", score: 55, risk: "보통", triggers: [], status: "처리 중" },
  { id: "VOC-260616-005", customer: "정민호", channel: "이메일", datetime: "06.16 11:24", vocType: "전산·디지털", exp: "단순문의", dept: "디지털서비스부",
    keywords: ["앱", "인증 오류"], summary: "모바일 앱 본인인증 실패 문의, 재시도 안내로 해소.", score: 24, risk: "낮음", triggers: [], status: "처리 완료" },
  { id: "VOC-260616-006", customer: "한지우", channel: "콜센터", datetime: "06.16 13:10", vocType: "불완전판매", exp: "철회항변", dept: "준법감시부",
    keywords: ["불완전판매", "설명 미흡", "계약 재검토"], summary: "가입 시 설명과 보장이 다르다며 불완전판매 주장, 금감원·법적 대응 언급.", score: 84, risk: "높음", triggers: ["금감원", "법적 조치"], status: "분석 완료" },
  { id: "VOC-260616-007", customer: "윤하린", channel: "콜센터", datetime: "06.16 14:15", vocType: "응대·서비스", exp: "칭찬", dept: "고객만족부",
    keywords: ["친절 응대", "감사"], summary: "상담 응대에 만족, 감사 표현.", score: 6, risk: "낮음", triggers: [], status: "처리 완료" },
  { id: "VOC-260616-008", customer: "강시우", channel: "대외기관 민원", datetime: "06.16 14:52", vocType: "계약 유지·변경", exp: "건의·제안", dept: "계약관리부",
    keywords: ["수익자 변경", "처리 지연", "절차 개선"], summary: "수익자 변경 처리 지연 불만 및 절차 간소화 건의.", score: 40, risk: "보통", triggers: [], status: "이관 완료" },
  { id: "VOC-260616-009", customer: "정수빈", channel: "콜센터", datetime: "06.16 15:20", vocType: "해지·환급", exp: "불만", dept: "고객만족부",
    keywords: ["해지환급금", "예상보다 적음"], summary: "해지환급금이 예상보다 적게 나왔다며 산출 근거 요구.", score: 58, risk: "보통", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-010", customer: "오현우", channel: "콜센터", datetime: "06.16 16:03", vocType: "전산·디지털", exp: "단순문의", dept: "디지털서비스부",
    keywords: ["납입 오류 반복", "답변 불충분"], summary: "납입 오류 관련 반복 문의 — 응대 불충분에 불만 누적 조짐(전이 위험).", score: 44, risk: "보통", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-011", customer: "한지민", channel: "콜센터", datetime: "06.16 16:30", vocType: "계약 유지·변경", exp: "단순문의", dept: "계약관리부",
    keywords: ["처리 지연", "재문의"], summary: "변경 처리 지연으로 재문의 반복 — 어조 격앙 조짐(전이 위험).", score: 26, risk: "낮음", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-012", customer: "배준호", channel: "콜센터", datetime: "06.16 17:02", vocType: "보험금 지급", exp: "단순문의", dept: "보상서비스부",
    keywords: ["청구 진행 문의", "지연 불만"], summary: "보험금 청구 진행 단순 문의였으나 처리 지연에 어조 격앙 — 부지급 항의로 발전 우려.", score: 92, risk: "매우높음", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-013", customer: "신유나", channel: "콜센터", datetime: "06.16 17:25", vocType: "해지·환급", exp: "단순문의", dept: "고객만족부",
    keywords: ["해지 절차 문의", "환급 재확인"], summary: "해지 절차 문의 반복 — 환급금 기대치와 차이로 불만 잠재.", score: 46, risk: "보통", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-014", customer: "임도현", channel: "콜센터", datetime: "06.16 17:48", vocType: "수금·납입", exp: "단순문의", dept: "수금관리부",
    keywords: ["납입 변경 문의", "이전 안내 상이"], summary: "납입 변경 문의 중 이전 안내와 다르다고 주장 — 오안내 불만 잠재.", score: 27, risk: "낮음", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-101", customer: "정해성", channel: "콜센터", datetime: "06.16 09:12", vocType: "보험금 지급", exp: "단순문의", dept: "보상서비스부", keywords: ["청구 진행", "지연"], summary: "보험금 청구 진행 문의 중 처리 지연에 불만 조짐.", score: 78, risk: "높음", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-102", customer: "문가영", channel: "콜센터", datetime: "06.16 09:34", vocType: "해지·환급", exp: "단순문의", dept: "고객만족부", keywords: ["해지 절차", "환급 차이"], summary: "해지 절차 문의 — 환급금 기대치 차이로 불만 잠재.", score: 47, risk: "보통", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-103", customer: "류준영", channel: "콜센터", datetime: "06.16 09:58", vocType: "수금·납입", exp: "단순문의", dept: "수금관리부", keywords: ["납입일 변경", "안내 혼선"], summary: "납입일 변경 문의 — 안내 혼선으로 재문의.", score: 29, risk: "낮음", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-104", customer: "백지호", channel: "콜센터", datetime: "06.16 10:20", vocType: "계약 유지·변경", exp: "단순문의", dept: "계약관리부", keywords: ["수익자 변경", "처리 지연"], summary: "수익자 변경 문의 — 처리 지연 우려.", score: 24, risk: "낮음", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-105", customer: "서아람", channel: "콜센터", datetime: "06.16 10:41", vocType: "보험금 지급", exp: "단순문의", dept: "보상서비스부", keywords: ["지급일 문의", "지연"], summary: "보험금 지급일 문의 중 지연 불만 조짐.", score: 52, risk: "보통", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-106", customer: "조민석", channel: "콜센터", datetime: "06.16 11:05", vocType: "전산·디지털", exp: "단순문의", dept: "디지털서비스부", keywords: ["앱 조회 오류", "반복"], summary: "앱 조회 오류 문의 — 안내로 해소.", score: 28, risk: "낮음", triggers: [], status: "처리 완료" },
  { id: "VOC-260616-107", customer: "남도현", channel: "콜센터", datetime: "06.16 11:28", vocType: "해지·환급", exp: "단순문의", dept: "고객만족부", keywords: ["환급 과소", "항의"], summary: "환급금이 과소하다는 주장 — 항의 조짐.", score: 24, risk: "낮음", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-108", customer: "하예린", channel: "콜센터", datetime: "06.16 11:50", vocType: "수금·납입", exp: "단순문의", dept: "수금관리부", keywords: ["출금일 문의", "혼선"], summary: "자동이체 출금일 문의 — 안내 혼선.", score: 28, risk: "낮음", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-109", customer: "고은서", channel: "콜센터", datetime: "06.16 13:06", vocType: "보험금 지급", exp: "단순문의", dept: "보상서비스부", keywords: ["서류 보완", "재안내"], summary: "청구 서류 보완 재안내 문의.", score: 31, risk: "낮음", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-110", customer: "권태욱", channel: "콜센터", datetime: "06.16 13:27", vocType: "계약 유지·변경", exp: "단순문의", dept: "계약관리부", keywords: ["변경 진행", "확인"], summary: "계약 변경 처리 진행 상황 문의 — 정상 안내.", score: 25, risk: "낮음", triggers: [], status: "처리 완료" },
  { id: "VOC-260616-111", customer: "민서진", channel: "콜센터", datetime: "06.16 13:49", vocType: "응대·서비스", exp: "단순문의", dept: "고객만족부", keywords: ["이전 응대", "재문의"], summary: "이전 응대 불만으로 재문의.", score: 25, risk: "낮음", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-112", customer: "오세훈", channel: "콜센터", datetime: "06.16 14:08", vocType: "해지·환급", exp: "단순문의", dept: "고객만족부", keywords: ["해지", "보장 종료"], summary: "해지 시 보장 종료 시점 문의.", score: 30, risk: "낮음", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-113", customer: "윤재호", channel: "콜센터", datetime: "06.16 14:30", vocType: "보험금 지급", exp: "단순문의", dept: "보상서비스부", keywords: ["거절 사유", "재확인"], summary: "청구 거절 사유 재확인 요구.", score: 88, risk: "매우높음", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-114", customer: "장하준", channel: "콜센터", datetime: "06.16 14:52", vocType: "수금·납입", exp: "단순문의", dept: "수금관리부", keywords: ["이중 출금", "의심"], summary: "이중 출금 의심 문의.", score: 26, risk: "낮음", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-115", customer: "전소민", channel: "콜센터", datetime: "06.16 15:14", vocType: "전산·디지털", exp: "단순문의", dept: "디지털서비스부", keywords: ["본인인증 실패", "반복"], summary: "본인인증 실패 문의 — 재시도 안내로 해소.", score: 22, risk: "낮음", triggers: [], status: "처리 완료" },
  { id: "VOC-260616-116", customer: "채우진", channel: "콜센터", datetime: "06.16 15:36", vocType: "계약 유지·변경", exp: "단순문의", dept: "계약관리부", keywords: ["연락처 변경", "처리"], summary: "주소·연락처 변경 처리 문의 — 정상 처리.", score: 31, risk: "낮음", triggers: [], status: "처리 완료" },
  { id: "VOC-260616-117", customer: "한도윤", channel: "콜센터", datetime: "06.16 15:58", vocType: "보험금 지급", exp: "단순문의", dept: "보상서비스부", keywords: ["지급 예정일", "재확인"], summary: "지급 예정일 재확인 문의.", score: 51, risk: "보통", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-118", customer: "황지아", channel: "콜센터", datetime: "06.16 16:20", vocType: "해지·환급", exp: "단순문의", dept: "고객만족부", keywords: ["산정 기준", "문의"], summary: "환급금 산정 기준 문의.", score: 23, risk: "낮음", triggers: [], status: "분석 완료" },
  // 모바일 챗봇 · 이메일 · 대외기관 인입 샘플(만족/칭찬 제외)
  { id: "VOC-260616-201", customer: "서지안", channel: "모바일 챗봇", datetime: "06.16 09:55", vocType: "전산·디지털", exp: "불만", dept: "디지털서비스부", keywords: ["앱 오류", "결제 실패", "반복"], summary: "앱에서 보험료 결제가 반복 실패한다며 불만 제기, 빠른 조치 요구.", score: 61, risk: "보통", triggers: ["반복 문의"], status: "분석 완료" },
  { id: "VOC-260616-202", customer: "남윤호", channel: "모바일 챗봇", datetime: "06.16 11:18", vocType: "보험금 지급", exp: "단순문의", dept: "보상서비스부", keywords: ["청구 서류", "진행 상황"], summary: "챗봇으로 보험금 청구 진행 상황 문의 — 지연에 어조 격앙 조짐.", score: 49, risk: "보통", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-203", customer: "조하람", channel: "모바일 챗봇", datetime: "06.16 14:40", vocType: "계약 유지·변경", exp: "건의·제안", dept: "계약관리부", keywords: ["챗봇 한계", "상담 연결"], summary: "챗봇 답변이 부정확하다며 상담사 연결 절차 개선 건의.", score: 33, risk: "낮음", triggers: [], status: "분석 완료" },
  { id: "VOC-260616-204", customer: "백서윤", channel: "이메일", datetime: "06.16 13:22", vocType: "불완전판매", exp: "철회항변", dept: "준법감시부", keywords: ["불완전판매", "청약 철회", "설명 미흡"], summary: "가입 설명이 미흡했다며 청약 철회 및 보상 요구, 민원 제기 시사.", score: 80, risk: "높음", triggers: ["금감원", "청약철회"], status: "분석 완료" },
  { id: "VOC-260616-205", customer: "도경민", channel: "대외기관 민원", datetime: "06.16 15:48", vocType: "보험금 지급", exp: "불만", dept: "보상서비스부", keywords: ["부지급", "분쟁조정 신청"], summary: "보험금 부지급에 대해 금융감독원 분쟁조정 신청, 사실관계 회신 요구.", score: 90, risk: "매우높음", triggers: ["금감원", "분쟁조정"], status: "분석 완료" },
  { id: "VOC-260616-206", customer: "유시연", channel: "대외기관 민원", datetime: "06.16 16:34", vocType: "수금·납입", exp: "불만", dept: "수금관리부", keywords: ["과다 청구", "환불 지연"], summary: "보험료 과다 청구·환불 지연을 대외기관에 민원 접수, 신속 처리 요구.", score: 72, risk: "높음", triggers: ["감독기관"], status: "분석 완료" },
  // 대외기관 민원 — 생명보험 유형별 데모(부지급/불완전판매/손해사정/고지의무/해지환급/단순응대)
  { id: "VOC-260616-207", customer: "한승우", channel: "대외기관 민원", datetime: "06.16 09:30", vocType: "보험금 지급", exp: "철회항변", dept: "준법감시부", keywords: ["고지의무 위반", "계약 해지", "부지급"], summary: "고지의무 위반을 이유로 한 계약 해지·부지급이 부당하다며 금감원 분쟁조정 신청.", score: 91, risk: "매우높음", triggers: ["금감원", "분쟁조정"], status: "분석 완료" },
  { id: "VOC-260616-208", customer: "오지환", channel: "대외기관 민원", datetime: "06.16 10:05", vocType: "보험금 지급", exp: "불만", dept: "보상서비스부", keywords: ["손해사정 지연", "절차 위반"], summary: "후유장해 보험금 손해사정이 지연되고 절차가 미흡하다며 대외기관 민원 제기.", score: 74, risk: "높음", triggers: ["금감원"], status: "분석 완료" },
  { id: "VOC-260616-209", customer: "임세라", channel: "대외기관 민원", datetime: "06.16 11:40", vocType: "해지·환급", exp: "불만", dept: "고객만족부", keywords: ["해지환급금", "산출 기준"], summary: "장기 유지한 저축성보험 해지환급금이 납입 원금보다 적게 산정된 데 이의를 제기하며 산출 기준·공제 내역과 차액 근거를 요구.", score: 44, risk: "보통", triggers: ["감독기관"], status: "분석 완료" },
  { id: "VOC-260616-210", customer: "조태현", channel: "대외기관 민원", datetime: "06.16 13:15", vocType: "응대·서비스", exp: "불만", dept: "고객만족부", keywords: ["회신 지연", "처리 태도"], summary: "민원 회신 지연·응대 태도 불만으로 금감원 이첩 — 신속 회신 요구.", score: 33, risk: "낮음", triggers: ["감독기관"], status: "분석 완료" },
  { id: "VOC-260616-211", customer: "권나윤", channel: "대외기관 민원", datetime: "06.16 14:22", vocType: "불완전판매", exp: "철회항변", dept: "준법감시부", keywords: ["설명의무 위반", "해피콜 미흡", "변액보험"], summary: "변액보험 가입 시 설명의무 위반·해피콜 미흡을 주장하며 금감원 분쟁조정 신청.", score: 83, risk: "높음", triggers: ["금감원", "분쟁조정"], status: "분석 완료" },
]

/* ── 금감원 접수 원문(대외기관 민원) ── 실제 민원 연계 스키마: 민원인 신청 내용(fss_ds_cont) + 금감원 처리 의뢰 공문(fss_ds_req) + 접수 메타.
   예시는 카드사 민원 포맷을 생명보험 기준으로 해석·치환한 데모 데이터. 키 = VoC id. */
export type FssDetail = {
  idMinwon?: string     // id_minwon    사내 민원관리번호
  docNo?: string        // 금감원 문서번호
  noRecv: string        // fss_no_recv  금감원 접수번호
  ymdRecv: string       // fss_ymd_recv 접수일(YYYYMMDD)
  ymdReq?: string       // fss_ymd_req  금감원 처리 의뢰일
  ymdDeadline?: string  // fss_ymd_deadline 처리기한(회신기한)
  reqKind: string       // fss_req_kind 자율조정 / 사실조회 / 직접처리
  dept?: string         // 금감원 담당 부서
  officer?: string      // 금감원 담당자
  reminwon: string      // fss_fg_reminwon 원민원 / 재민원
  phone?: string        // 민원인 연락처(표시 시 가운데 가명화)
  product?: string      // 관련 계약 상품
  policyNo?: string     // 증권번호
  inquiryItems?: string[] // 사실조회 요청사항
  empId?: string        // id_mw_dist_emp 사내 배정 담당자
  custReq: string       // 민원인 신청 내용(원문)
  fssReq: string        // 금감원 처리 의뢰 공문
}
const fmtYmd = (s?: string) => (s && /^\d{8}$/.test(s) ? `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}` : s ?? "")
// 연락처 가운데 가명화 — 010-1234-5678 → 010-****-5678
const maskPhone = (p?: string) => { if (!p) return ""; const a = p.split("-"); return a.length === 3 ? `${a[0]}-****-${a[2]}` : p.replace(/\d(?=\d{4})/g, "*") }
const FSS_DETAIL: Record<string, FssDetail> = {
  // 이첩 — 해지환급금 산정 기준 안내 요청(민원인에게 직접 회신 후 결과 보고)
  "VOC-260616-002": {
    idMinwon: "MW20260616-056845", noRecv: "2026V9501", ymdRecv: "20260616", ymdReq: "2026-06-18", ymdDeadline: "2026-07-07",
    reqKind: "이첩", docNo: "금소보-2026-제03825호", dept: "금융소비자보호처 보험민원국 중소서민민원팀", officer: "박상담 선임", reminwon: "원민원", phone: "010-3022-7741", product: "무배당 제논라이프 종신보험", policyNo: "SL-2015-3391742", empId: "A403185",
    custReq:
      "10년 넘게 유지해 온 종신보험을 최근 해지하였는데, 돌려받은 해지환급금이 그동안 납입한 보험료보다 현저히 적게 산정되어 그 이유를 도무지 알 수 없습니다.\n\n가입 당시 설계사로부터 '오래 유지하면 납입한 금액 이상을 돌려받을 수 있다'고 안내받았는데, 실제 환급금은 납입 원금에 한참 못 미쳤습니다. 어떤 기준으로 환급금이 산정되었는지, 어떤 명목으로 얼마가 공제되었는지 구체적인 내역을 전혀 안내받지 못했습니다.\n\n해지환급금 산정 기준과 공제 내역(사업비 등), 그리고 가입 당시 안내와 차이가 발생한 사유를 명확히 설명해 주시기 바랍니다. 납득할 만한 근거가 제시되지 않을 경우 법적 대응도 검토하겠습니다.",
    fssReq:
      "1. 우리원에 접수된 민원(2026V9501)을 귀사로 이첩하니, 민원인에게 직접 처리결과를 회신한 후 그 결과를 14일 이내에 우리원에 보고하여 주시기 바랍니다.\n\n2. 처리 시 민원인이 충분히 이해할 수 있도록 약관상 산출 기준 등을 구체적으로 안내하여 주시기 바랍니다.\n\n3. 아울러 본 민원제출로 인하여 민원인의 권익이 침해되지 않도록 하시고, 민원서류의 내용을 본건 처리 이외의 목적으로 사용하는 것은 「신용정보의 이용 및 보호에 관한 법률」 등에 따라 금지되어 있으니 유의하여 주시기 바랍니다.",
  },
  // 이첩 — 상담사 응대 불만(민원인 직접 회신·재발방지)
  "VOC-260616-003": {
    idMinwon: "MW20260615-056610", noRecv: "2026V9487", ymdRecv: "20260615", ymdReq: "2026-06-17", ymdDeadline: "2026-07-01",
    reqKind: "이첩", docNo: "금소보-2026-제03790호", dept: "금융소비자보호처 보험민원국 중소서민민원팀", officer: "이감독 책임", reminwon: "원민원", phone: "010-4471-2092", product: "무배당 제논라이프 건강보험", policyNo: "SL-2019-2204471", empId: "A402260",
    custReq:
      "보험금 청구 관련하여 콜센터에 문의하는 과정에서 상담사로부터 불친절하고 고압적인 응대를 받았습니다. 같은 내용을 여러 번 설명해야 했고, 담당자가 바뀔 때마다 안내 내용이 달라 큰 불편을 겪었습니다.\n\n응대 과정에 대한 사과와 함께, 동일한 일이 재발하지 않도록 어떤 조치를 취할 것인지 알려 주시기 바랍니다.",
    fssReq:
      "1. 우리원에 접수된 민원(2026V9487)을 귀사로 이첩하니, 민원인에게 직접 처리결과를 회신한 후 그 결과를 14일 이내에 우리원에 보고하여 주시기 바랍니다.\n\n2. 응대 경위를 확인하고 재발 방지 대책을 포함하여 민원인이 납득할 수 있도록 처리하여 주시기 바랍니다.\n\n3. 아울러 민원서류의 내용을 본건 처리 이외의 목적으로 사용하는 것은 관계 법령에 따라 금지되어 있으니 유의하여 주시기 바랍니다.",
  },
  // 이첩 — 수익자 변경 처리 지연·절차 개선 건의(민원인 직접 회신)
  "VOC-260616-008": {
    idMinwon: "MW20260615-056622", noRecv: "2026V9492", ymdRecv: "20260615", ymdReq: "2026-06-17", ymdDeadline: "2026-07-03",
    reqKind: "이첩", docNo: "금소보-2026-제03802호", dept: "금융소비자보호처 보험민원국 중소서민민원팀", officer: "정감독 선임", reminwon: "원민원", phone: "010-7785-3340", product: "무배당 제논라이프 변액연금보험", policyNo: "SL-2018-5530034", empId: "A402905",
    custReq:
      "보험계약의 수익자 변경을 신청하였는데 처리가 지나치게 지연되고, 필요 서류 안내도 그때그때 달라 여러 차례 다시 제출해야 했습니다.\n\n수익자 변경 처리가 현재 어떤 단계인지 알려 주시고, 처리 절차와 필요 서류를 한 번에 명확히 안내하는 등 절차를 개선해 주시기 바랍니다.",
    fssReq:
      "1. 우리원에 접수된 민원(2026V9492)을 귀사로 이첩하니, 민원인에게 직접 처리결과를 회신한 후 그 결과를 14일 이내에 우리원에 보고하여 주시기 바랍니다.\n\n2. 처리 진행 상황과 절차·필요 서류를 민원인이 이해할 수 있도록 구체적으로 안내하여 주시기 바랍니다.\n\n3. 아울러 민원서류의 내용을 본건 처리 이외의 목적으로 사용하는 것은 관계 법령에 따라 금지되어 있으니 유의하여 주시기 바랍니다.",
  },
  // 불완전판매 — 사칭 설계사 부당 모집·승환, 청약철회 거부 (예시1 카드깡 사건을 생보로 해석)
  "VOC-260616-211": {
    idMinwon: "MW20260602-055120", noRecv: "2026V3187", ymdRecv: "20260602", ymdReq: "2026-06-03", ymdDeadline: "2026-06-26",
    reqKind: "자율조정", docNo: "금소보-2026-제03611호", dept: "금융소비자보호처 보험민원국 보험민원2팀", officer: "최감독 책임", reminwon: "원민원", phone: "010-2847-3361", product: "무배당 제논라이프 변액유니버셜보험", policyNo: "SL-2023-7781120", empId: "EMP2041",
    custReq:
      "박영희라는 여성이 귀사(생명보험사) 소속 전속설계사라고 신분을 밝히며 2024년 3월부터 접근하여, 기존에 유지하던 보장성 종신보험을 해지하고 '원금이 보장되면서 수익률이 높은 상품'이라며 변액유니버셜보험 가입을 적극 권유하였습니다. 그 말을 믿고 저(권나윤)와 가족(배우자 김도현, 자녀 권시우) 명의로 월 납입 합계 약 180만원 규모의 변액·저축성 보험 4건에 가입하였습니다.\n\n처음에는 정상적인 재무설계로 믿고 협조하였으나, 이후 확인해보니 기존 종신보험을 부당하게 해지·승환시키고 원금 손실 위험이 큰 변액상품을 '확정 수익'으로 잘못 설명한 불완전판매였습니다. 가입 당시 상품설명서·핵심설명서 교부와 적합성·적정성 진단이 제대로 이루어지지 않았고, 완전판매 모니터링(해피콜) 역시 설계사가 대신 응답하도록 유도하였습니다.\n\n피해 내역은 다음과 같습니다: 권나윤(본인) 변액유니버셜 2건(월 90만원), 김도현(배우자) 저축성보험 1건(월 60만원), 권시우(자녀) 변액보험 1건(월 30만원). (상세 내역은 별첨 자료 참조)\n\n뒤늦게 불완전판매 사실을 알고 각 보험사에 청약철회·환급을 요청하였는데, A생명과 B생명은 모집 과정의 하자를 인정하여 청약철회 및 납입보험료 전액을 환급해 주었습니다. 그러나 귀사는 '해피콜 정상 완료 및 자필서명 확인'만을 이유로 환급을 거부하였습니다.\n\n박영희는 다수 피해자에 대한 보험 부당모집·사기 혐의로 현재 구속 기소된 상태입니다(사건번호 2026고단4821호). A생명과 B생명이 환급해 준 것은 청약철회가 정당하다고 판단하였기 때문입니다. 저의 억울함을 해소할 수 있도록 귀사도 동일하게 청약철회 및 납입보험료 환급을 반드시 처리해 주시기 바랍니다.",
    fssReq:
      "1. 우리원에 접수된 민원(2026V3187)과 관련하여 자율조정을 의뢰하니, 자율조정 대상인 경우에는 자율조정제도 운영지침에 따라 처리한 후 자율조정 결과 등 관련서류를 14일 이내에 제출하여 주시기 바랍니다.\n\n2. 동 건이 자율조정 대상이 아니거나, 자율조정이 불성립된 경우에는 위 기한 내에 붙임과 같이 사실조회 결과 등 관련서류를 제출하여 주시기 바라며, 만약 동 기한까지 제출하지 못할 때에는 지연사유 및 제출예정 일자를 명시한 사유서를 동 기한 내에 제출하여 주시기 바랍니다.\n\n3. 아울러 본 민원제출로 인하여 민원인의 권익이 침해되지 않도록 하시고, 특히 민원서류의 내용을 본건 처리 이외의 여타 목적으로 사용하는 것은 「신용정보의 이용 및 보호에 관한 법률」 등에 따라 금지되어 있으니 유의하여 주시기 바랍니다.",
  },
  // 보험금 부지급 — 암 진단보험금 면책·부지급 불복, 분쟁조정·사실조회
  "VOC-260616-205": {
    idMinwon: "MW20260520-053944", noRecv: "2026V2901", ymdRecv: "20260520", ymdReq: "2026-05-21", ymdDeadline: "2026-06-26",
    reqKind: "사실조회", docNo: "금소보-2026-제03488호", dept: "금융소비자보호처 보험민원국 보험민원2팀", officer: "김감독 선임", reminwon: "원민원", phone: "010-5520-1187", product: "무배당 제논라이프 종신보험", policyNo: "SL-2019-7788123",
    inquiryItems: ["청구 건 접수일자 및 심사·손해사정 진행 경과", "보험금 부지급(또는 감액) 결정의 구체적 사유 및 적용 약관 조항", "청약 당시 계약 전 알릴 의무(고지) 안내 및 질문표 작성 내역", "부지급 결정의 민원인 통보 일자 및 방법", "향후 처리 계획(입장 유지 / 재검토 여부)"], empId: "EMP1180",
    custReq:
      "저는 2019년 3월 귀사의 무배당 종신보험(암진단특약 포함)에 가입하여 매월 보험료를 성실히 납입해 왔습니다. 2026년 5월 종합병원에서 암 진단을 받고 진단보험금 3,000만원을 청구하였으나, 귀사는 '청약 전 발병이 의심된다'는 사유로 면책·부지급 결정을 통보하였습니다.\n\n그러나 주치의 소견서상 최초 진단 확정일은 가입일보다 한참 이후이며, 손해사정 과정에서 진단 시점에 대한 판단이 자의적이었다고 생각합니다. 동일한 약관의 다른 가입자는 유사한 사안에서 보험금을 지급받은 사례가 있는데 저에게만 부지급 결정을 내린 것은 부당합니다.\n\n귀사에 수차례 재심사를 요청하였으나 동일한 답변만 반복되어, 부득이 금융감독원에 분쟁조정을 신청하게 되었습니다. 약관상 면책 사유에 실제로 해당하는지, 손해사정 결과의 근거가 무엇인지 사실관계를 명확히 회신하여 주시기 바랍니다.",
    fssReq:
      "1. 우리원에 접수된 민원(2026V2901)과 관련하여 붙임 민원내용에 대한 사실조회를 의뢰하니, 처리기한 내에 사실조회 결과 및 관련 증빙서류(약관, 청구·심사 기록, 손해사정 결과서 등)를 제출하여 주시기 바랍니다.\n\n2. 처리기한까지 제출이 곤란한 경우에는 지연사유 및 제출예정 일자를 명시한 사유서를 동 기한 내에 제출하여 주시기 바랍니다.\n\n3. 아울러 민원서류의 내용을 본건 처리 이외의 여타 목적으로 사용하는 것은 관계 법령에 따라 금지되어 있으니 유의하여 주시기 바랍니다.",
  },
  // 해지·환급 — 저축성보험 해지환급금 이의, 자율조정 의뢰(이첩 성격)
  "VOC-260616-209": {
    idMinwon: "MW20260610-056301", noRecv: "2026V3340", ymdRecv: "20260610", ymdReq: "2026-06-11", ymdDeadline: "2026-06-25",
    reqKind: "자율조정", docNo: "금소보-2026-제03560호", dept: "금융소비자보호처 보험민원국 중소서민민원팀", officer: "한감독 선임", reminwon: "원민원", phone: "010-3391-7742", product: "무배당 제논라이프 저축보험", policyNo: "SL-2015-3340778", empId: "A401359",
    custReq:
      "10년간 납입해 온 저축성보험을 해지하였는데, 해지환급금이 그동안 납입한 원금보다 크게 적게 산정되었습니다. 가입 당시 설계사로부터 '10년 이상 유지하면 납입원금 이상을 환급받을 수 있다'고 안내받았는데, 실제로는 그렇지 않아 납득하기 어렵습니다.\n\n해지환급금 산출 근거(경과기간별 해지환급률, 사업비 공제 내역 등)를 명확히 밝혀 주시고, 가입 시 안내와 다른 부분에 대해서는 차액을 환급해 주실 것을 요청합니다.",
    fssReq:
      "1. 우리원에 접수된 민원(2026V3340)과 관련하여 자율조정을 의뢰하니, 자율조정 대상인 경우에는 자율조정제도 운영지침에 따라 처리한 후 자율조정 결과 등 관련서류를 14일 이내에 제출하여 주시기 바랍니다.\n\n2. 동 건이 자율조정 대상이 아니거나, 자율조정이 불성립된 경우에는 위 기한 내에 사실조회 결과 등 관련서류를 제출하여 주시기 바라며, 동 기한까지 제출하지 못할 때에는 지연사유 및 제출예정 일자를 명시한 사유서를 제출하여 주시기 바랍니다.\n\n3. 아울러 본 민원제출로 인하여 민원인의 권익이 침해되지 않도록 하시고, 특히 민원서류의 내용을 본건 처리 이외의 여타 목적으로 사용하는 것은 「신용정보의 이용 및 보호에 관한 법률」 등에 따라 금지되어 있으니 유의하여 주시기 바랍니다.",
  },
}


/* ----------------------------- 표기 ----------------------------- */
type Tone = "good" | "warn" | "bad" | "muted"
// 브랜드 3톤 — 파랑(bad·강조) / 하늘(warn·중간) / 민트(good·완료) / 슬레이트(muted·중립)
const tone = (l: Tone) => l === "bad" ? "border-[#bcd3ef] bg-[#eaf2fc] text-[#0f3468]" : l === "warn" ? "border-[#bae6fd] bg-[#e8f6fe] text-[#0369a1]" : l === "good" ? "border-[#b9ece0] bg-[#e9faf4] text-[#0f766e]" : "border-slate-200 bg-slate-50 text-slate-500"
const TONE_HEX: Record<Tone, string> = { bad: "#0f3468", warn: "#38bdf8", good: "#14b8a6", muted: "#cbd5e1" }
const riskTone = (l: Level): Tone => l === "높음" || l === "매우높음" ? "bad" : l === "보통" ? "warn" : "good"
const expTone = (e: Exp): Tone => e === "불만" || e === "철회항변" ? "bad" : e === "칭찬" ? "good" : e === "건의·제안" ? "warn" : "muted"

function Chip({ label, level, dot }: { label: string; level: Tone; dot?: boolean }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[10px] font-medium", tone(level))}>{dot ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: TONE_HEX[level] }} /> : null}{label}</span>
}
function ScoreBar({ value, level }: { value: number; level: Tone }) {
  return <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eef2f7]"><div className="h-full rounded-full" style={{ width: `${value}%`, background: TONE_HEX[level] }} /></div>
}
function ChannelTag({ c }: { c: Channel }) {
  const I = CH_ICON[c]
  return <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><I className="h-3 w-3" />{c}</span>
}

/* ----------------------------- 탭 (역할별) ----------------------------- */
type TabDef = { key: string; label: string; icon: typeof TrendingUp }
// 상담사: 콜 민원 상담만. 관리자: 분석·조회 + 민원처리 + 이슈모니터링 + 리포트
const AGENT_TABS: TabDef[] = [
  { key: "analyze", label: "민원 상담", icon: Headset },
]
const ADMIN_TABS: TabDef[] = [
  { key: "analyze", label: "VoC 분석·조회", icon: ListChecks },
  { key: "reply", label: "민원 처리", icon: FileText },
  { key: "monitor", label: "이슈 모니터링", icon: Activity },
  { key: "report", label: "VoC 리포트", icon: BarChart3 },
]

export function VocServiceView() {
  return <Suspense fallback={<div className="flex-1" />}><Inner /></Suspense>
}

function Inner() {
  const sp = useSearchParams()
  const router = useRouter()
  // 초기 렌더부터 역할 반영(agent 기본 시 관리자 탭(monitor/reply)이 analyze로 폴백→리다이렉트되는 문제 방지)
  const [role, setRole] = useState<"agent" | "admin">(() => { try { return localStorage.getItem("genon:role") === "admin" ? "admin" : "agent" } catch { return "agent" } })
  useEffect(() => { try { const r = localStorage.getItem("genon:role"); if (r === "admin" || r === "agent") setRole(r) } catch { /* 데모 */ } }, [])
  const tabs = role === "admin" ? ADMIN_TABS : AGENT_TABS
  const reqTab = sp.get("tab") || "analyze"
  const tab = tabs.some((t) => t.key === reqTab) ? reqTab : "analyze"
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f1f5fb]">
      {/* 헤더 + 탭 */}
      <div className="shrink-0 border-b border-[#dbe5f1] bg-white px-6 pt-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f3468]/10 text-[#0f3468]"><Megaphone className="h-4 w-4" /></span>
          <div className="leading-tight">
            <div className="text-[14px] font-bold text-[#10233f]">AI VoC 서비스</div>
            <div className="text-[10.5px] text-muted-foreground">콜·이메일·대외기관 민원 VoC 자동 분석 · 악성민원 발전 예측 · 대응 초안 · 리포트</div>
          </div>
        </div>
        {tabs.length > 1 ? (
          <>
            <div className="-mx-6 mt-3 border-t border-[#e6edf5]" />
            <div className="flex gap-1">
              {tabs.map((t) => (
                <button key={t.key} type="button" onClick={() => router.replace(`/voc?tab=${t.key}`)}
                  className={cn("flex items-center gap-1.5 border-b-2 px-3 py-2 text-[12px] font-semibold transition-colors",
                    tab === t.key ? "border-[#0f3468] text-[#0f3468]" : "border-transparent text-[#5b6b80] hover:text-[#10233f]")}>
                  <t.icon className="h-3.5 w-3.5" />{t.label}
                </button>
              ))}
            </div>
          </>
        ) : <div className="h-3" />}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "reply" ? <ReplyTab /> : tab === "report" ? <ReportTab /> : tab === "monitor" ? <MonitorTab /> : <AnalyzeTab />}
      </div>
    </div>
  )
}

/* ============ 1) VoC AI 분석·조회·관리 (유입→분석→배정→처리) ============ */
export const NEED: Record<string, string> = {
  "VOC-260616-001": "부지급 사유 설명 및 재심사 요구",
  "VOC-260616-002": "환급금 차액 근거 제시 및 정정 요구",
  "VOC-260616-003": "응대 사과 및 재발 방지 요구",
  "VOC-260616-004": "이중 출금분 즉시 환불 요구",
  "VOC-260616-005": "앱 본인인증 방법 안내 요청",
  "VOC-260616-006": "불완전판매 인정 및 보상 요구",
  "VOC-260616-007": "별도 요구 없음 (만족 표현)",
  "VOC-260616-008": "변경 처리 신속화 및 절차 개선 요구",
  "VOC-260616-009": "해지환급금 산출 근거 제시 요구",
  "VOC-260616-010": "납입 오류 해소 및 재발 방지 요구",
  "VOC-260616-011": "변경 처리 지연 사유 설명 및 신속 처리 요구",
  "VOC-260616-012": "청구 진행 상황 안내 및 처리 기일 단축 요구",
  "VOC-260616-013": "해지 환급금 산정 기준 사전 안내 요구",
  "VOC-260616-014": "납입 변경 정확한 안내 및 오안내 정정 요구",
}
// 상담사 상세 보조 지표
const senti = (v: VoC) => (v.exp === "칭찬" ? 76 : v.risk === "높음" ? -86 : v.risk === "보통" ? -54 : -16)
const sentiLabel = (n: number) => (n <= -60 ? "매우 부정" : n < -20 ? "부정" : n < 20 ? "중립" : "긍정")
const TYPE_RECENT: Record<string, number> = { "보험금 지급": 38, "해지·환급": 21, "응대·서비스": 14, "수금·납입": 11, "전산·디지털": 9, "불완전판매": 17, "계약 유지·변경": 7 }

export const STATUS_FLOW = ["분석 완료", "부서 배정", "처리 중", "처리 완료"]
const normStatus = (s: string) => (s === "이관 완료" ? "부서 배정" : s)
const statusTone = (s: string): Tone => (s === "처리 완료" ? "good" : s === "처리 중" ? "warn" : "muted")

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
// 문의(전체 인입) 중 민원성 건 = VoC. VoC = 명백 민원(complaint) + 잠재 민원(potential).
type Period = { key: string; label: string; total: number; complaint: number; potential: number; high: number; mid: number; low: number; avg: number; sub: string }
const PERIODS: Period[] = [
  { key: "10m", label: "최근 10분", total: 203, complaint: 12, potential: 20, high: 8, mid: 14, low: 10, avg: 53, sub: "실시간 인입 (10분)" },
  { key: "today", label: "오늘", total: 4280, complaint: 232, potential: 380, high: 96, mid: 318, low: 198, avg: 49, sub: "2026-06-17" },
  { key: "7d", label: "최근 7일", total: 29800, complaint: 1560, potential: 2560, high: 642, mid: 2180, low: 1298, avg: 47, sub: "06.11 ~ 06.17" },
  { key: "30d", label: "최근 30일", total: 128400, complaint: 6680, potential: 10920, high: 2740, mid: 9320, low: 5540, avg: 46, sub: "05.18 ~ 06.17" },
]

// VoC 유형 자동 분류 비중 + 유형 내 악성민원 발전 위험 구성비 [높음, 보통, 낮음]
const TYPE_SHARE: { k: string; share: number; mix: [number, number, number] }[] = [
  { k: "보험금 지급", share: 0.22, mix: [0.55, 0.30, 0.15] },
  { k: "해지·환급", share: 0.18, mix: [0.40, 0.40, 0.20] },
  { k: "응대·서비스", share: 0.16, mix: [0.20, 0.45, 0.35] },
  { k: "수금·납입", share: 0.14, mix: [0.12, 0.33, 0.55] },
  { k: "계약 유지·변경", share: 0.12, mix: [0.10, 0.30, 0.60] },
  { k: "불완전판매", share: 0.10, mix: [0.60, 0.30, 0.10] },
  { k: "전산·디지털", share: 0.08, mix: [0.05, 0.25, 0.70] },
]

/* 상담사(민원처리) 본인 기준 — 내 팀 이관 + 내가 상담한 고객 */
const MY_TEAM = "고객만족부"
const MY_CASES = new Set(["VOC-260616-001", "VOC-260616-004"])
const mineReason = (v: VoC) => (v.dept === MY_TEAM ? "내 팀 이관" : MY_CASES.has(v.id) ? "내 상담 고객" : null)

// STEP0 · 콜센터 상담사 본인이 응대한 콜 (콜센터 채널 한정)
const MY_CALLS = new Set([
  "VOC-260616-001", "VOC-260616-004", "VOC-260616-006", "VOC-260616-009", "VOC-260616-010", "VOC-260616-011", "VOC-260616-012", "VOC-260616-013", "VOC-260616-014",
  ...Array.from({ length: 18 }, (_, i) => `VOC-260616-${101 + i}`),
])
// 잠재 민원 위험도 색 (낮음=회색 / 보통=민트 / 높음=톤다운 네이비 / 매우높음=네이비)
const aRiskHex = (l: Level) => (l === "매우높음" ? "#0f3468" : l === "높음" ? "#2f6bb0" : l === "보통" ? "#14b8a6" : "#94a3b8")
// 감지된 문장(원문) + 분석 — 잠재 민원 케이스별
const DETECT: Record<string, { quote: string; analysis: string }[]> = {
  "VOC-260616-010": [
    { quote: "아니 이거 저번에도 물어봤는데 또 안 돼요?", analysis: "동일 문의 반복 — 미해결 누적으로 불만 전이 신호" },
    { quote: "자꾸 이러면 곤란한데…", analysis: "부정 감정 표출 · 응대 불충분 인식" },
  ],
  "VOC-260616-011": [
    { quote: "처리해 준다더니 아직도 안 됐잖아요.", analysis: "약속 처리 지연 — 신뢰 저하·격앙 조짐" },
    { quote: "도대체 며칠을 더 기다려요?", analysis: "처리 기한 불만 — 항의로 발전 가능" },
  ],
  "VOC-260616-012": [
    { quote: "보험금 언제 나오는 거예요? 한참 됐는데.", analysis: "청구 지연 인지 — 부지급 항의로 전이 우려" },
    { quote: "이거 안 주면 나도 가만 안 있어요.", analysis: "위협성 발언 — 악성민원 전이 고위험" },
  ],
  "VOC-260616-013": [
    { quote: "해지하면 얼마 돌려받는 거예요? 생각보다 너무 적네…", analysis: "환급금 기대 차이 — 해지환급 불만 잠재" },
  ],
  "VOC-260616-014": [
    { quote: "저번 상담사는 다르게 말했는데요?", analysis: "안내 불일치 인지 — 오안내 불만 전이 신호" },
  ],
}
const detectOf = (v: VoC) => DETECT[v.id] ?? [{ quote: `“${v.summary}”`, analysis: "통화 내용 기반 전이 위험 감지" }]
// 상담 주의 유형 · 응대 포인트 (고객 민원 탐지 카드)
const ATTN: { topic: string; count: number; risk: Level; caution: string }[] = [
  { topic: "보험금 부지급·지급 지연", count: 4, risk: "높음", caution: "부지급 사유를 약관 근거와 함께 명확히 설명하고 처리 일정을 안내하세요." },
  { topic: "해지환급금 안내", count: 3, risk: "높음", caution: "가입 경과 연수별 환급률을 확인하고(100% 일괄 안내 금지), 보장 종료를 먼저 고지하세요." },
  { topic: "자동이체·수금", count: 2, risk: "보통", caution: "이중 출금 여부와 변경 적용일(출금 5영업일 전)을 정확히 안내하세요." },
  { topic: "상품 설명·불완전판매", count: 2, risk: "보통", caution: "보장 범위·면책 사항을 재확인하고 가입 시 설명 이력을 점검하세요." },
]

// 역할 디스패처 — 상담사(콜센터)는 본 화면, 관리자(전사)는 통합 콘솔로 이동
// AI VoC 서비스 분석·조회 — 관리자/상담사 모두 동일한 VoC 분석 대시보드를 사용
function AnalyzeTab() {
  return <AgentAnalyze />
}

/* ===== 상담사(콜센터) 뷰 — 내 콜·내 담당 중심 ===== */
function AgentAnalyze() {
  const callVocs = [...VOCS].filter((v) => v.channel === "콜센터").sort((a, b) => b.score - a.score)
  const [riskF, setRiskF] = useState<Level | "전체">("전체")
  const [attnOpen, setAttnOpen] = useState(false)
  const myCalls = callVocs.filter((v) => MY_CALLS.has(v.id))
  // 대기열 = 내 일반 문의(단순문의) — 낮음/보통/높음 전이 위험 (명백 민원·칭찬 제외)
  const myQueue = myCalls.filter((v) => v.exp === "단순문의")
  const potList = myQueue.filter((v) => v.risk !== "낮음") // 잠재(보통·높음)
  const [sel, setSel] = useState<string>(potList[0]?.id ?? myQueue[0]?.id ?? callVocs[0].id)
  const [fu, setFu] = useState<Record<string, string>>({})
  const d = VOCS.find((v) => v.id === sel) ?? potList[0] ?? callVocs[0]
  const shown = myQueue.filter((v) => riskF === "전체" || v.risk === riskF)
  const statusOf = (v: VoC) => fu[v.id] || (v.risk === "낮음" ? "확인" : "후속 필요")
  const stTone = (s: string): Tone => (s === "완료" || s === "확인" ? "good" : "warn")
  const fuPending = potList.filter((v) => fu[v.id] !== "완료").length
  // 오늘 상담 구성 — 일반 문의 / 민원 (내 콜 기준)
  const complaintCnt = myCalls.filter((v) => v.exp === "불만" || v.exp === "철회항변" || v.triggers.length).length
  const total = myCalls.length
  const COMP = [
    { k: "일반 문의", n: myQueue.length, c: "#cbd5e1" },
    { k: "민원", n: complaintCnt, c: "#0f3468" },
  ]
  // 잠재 민원 위험도 — 대기열(일반 문의) 실제 분포에서 파생
  const rCnt = (l: Level) => myQueue.filter((v) => v.risk === l).length
  const rTot = myQueue.length || 1
  const potTotal = rCnt("보통") + rCnt("높음") + rCnt("매우높음")
  const RISK_SEG = (["낮음", "보통", "높음", "매우높음"] as Level[]).map((l) => ({ k: l, n: rCnt(l), c: aRiskHex(l) }))
  let _ra = 0
  const riskStops = RISK_SEG.map((s) => { const a = (_ra / rTot) * 360; _ra += s.n; const b = (_ra / rTot) * 360; return `${s.c} ${a}deg ${b}deg` }).join(", ")
  // 유형별 (대기열 일반 문의 그룹)
  const TYPE_GROUPS = Object.values(myQueue.reduce((acc: Record<string, { k: string; total: number; pot: number }>, v) => {
    (acc[v.vocType] ??= { k: v.vocType, total: 0, pot: 0 }); acc[v.vocType].total++; if (v.risk !== "낮음") acc[v.vocType].pot++; return acc
  }, {})).sort((a, b) => b.total - a.total)

  return (
    <div className="flex flex-col">
      {/* 내 상담 현황 (VoC 현황 스타일) */}
      <div className="border-b border-[#dbe5f1] bg-[#f4f8fd] px-6 py-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="text-[13px] font-bold text-[#10233f]">오늘 상담 분석</div>
          <span className="inline-flex items-center gap-1 rounded-md border border-[#dbe5f1] bg-white px-2 py-0.5 text-[10px] text-[#0b4f91]"><Phone className="h-3 w-3" /> 콜센터 · 오늘</span>
          <button type="button" onClick={() => setAttnOpen(true)} className="ml-auto inline-flex items-center gap-1 rounded-md border border-[#dbe5f1] bg-white px-2.5 py-1 text-[10.5px] font-semibold text-[#0b4f91] hover:bg-[#f2f8ff]"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> 상담 주의 유형 · 응대 포인트</button>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {/* 오늘 상담 구성 — 일반 문의 / 상담 */}
          <div className="rounded-sm border border-[#e2eaf4] bg-white p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#10233f]">오늘 상담 구성</span>
              <span className="ml-auto rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">후속 대기 {fuPending}건</span>
            </div>
            <div className="mb-3 flex items-baseline gap-1.5">
              <span className="text-[26px] font-bold leading-none tabular-nums text-[#10233f]">{total}</span>
              <span className="text-[11px] text-muted-foreground">건 · 오늘 처리</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-[#eef2f7]">
              {COMP.map((c) => <div key={c.k} className="h-full" style={{ width: `${(c.n / total) * 100}%`, background: c.c }} title={`${c.k} ${c.n}건`} />)}
            </div>
            <div className="mt-3 flex gap-6">
              {COMP.map((c) => (
                <div key={c.k}>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="h-2 w-2 rounded-sm" style={{ background: c.c }} />{c.k}</div>
                  <div className="mt-0.5 text-[16px] font-bold tabular-nums text-[#10233f]">{c.n}<span className="ml-0.5 text-[9.5px] font-normal text-muted-foreground">건</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* 잠재 민원 위험도 — 파이(낮음/보통/높음) + 유형별 */}
          <div className="rounded-sm border border-[#e2eaf4] bg-white p-4">
            <div className="mb-2.5 flex items-baseline gap-1.5">
              <span className="text-[11px] font-bold text-[#10233f]">잠재 민원 위험도</span>
              <span className="text-[10px] text-muted-foreground">일반 문의 {rTot}건</span>
            </div>
            <div className="flex items-center gap-3">
              {/* 위험도 파이 */}
              <div className="relative h-[78px] w-[78px] shrink-0 rounded-full" style={{ background: `conic-gradient(${riskStops})` }}>
                <div className="absolute inset-[11px] flex flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-[14px] font-bold leading-none text-[#10233f]">{rTot}</span>
                  <span className="mt-0.5 text-[8px] text-muted-foreground">일반 문의</span>
                </div>
              </div>
              {/* 위험도 + 유형별 구분 */}
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex gap-3 border-b border-[#eef2f7] pb-1.5">
                  {RISK_SEG.map((r) => (
                    <div key={r.k} className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-sm" style={{ background: r.c }} /><span className="text-muted-foreground">{r.k}</span><b className="tabular-nums text-[#10233f]">{r.n}</b></div>
                  ))}
                </div>
                <div className="space-y-0.5">
                  {TYPE_GROUPS.map((t) => (
                    <div key={t.k} className="flex items-center gap-1.5 text-[10px]">
                      <span className="min-w-0 flex-1 truncate text-[#33445c]">{t.k}</span>
                      <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">{t.total}건</span>
                      <span className="w-[46px] shrink-0 text-right">
                        {t.pot ? <span className="rounded-sm bg-[#e9faf4] px-1 py-px text-[9px] font-semibold text-[#0f766e]">잠재 {t.pot}</span> : null}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {potTotal ? <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-[#eaf2fc] px-2.5 py-1.5 text-[10.5px] text-[#0f3468]"><ShieldAlert className="h-3.5 w-3.5" /> 잠재 민원 <b className="mx-0.5">{potTotal}건</b>(보통·높음) — 선제 후속 권고</div> : null}
          </div>

        </div>
      </div>

      <div className="flex items-start gap-3 px-6 py-4">
        {/* 좌: 내 콜 처리 대기열 */}
        <section className="flex flex-1 flex-col overflow-hidden border border-[#dbe5f1] bg-white">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#eef2f7] px-3 py-2.5">
            <div className="text-[12px] font-bold text-[#10233f]">잠재 민원 처리 후속 대기열</div>
            <div className="ml-auto flex gap-1">
              {(["전체", "매우높음", "높음", "보통", "낮음"] as const).map((f) => (
                <button key={f} type="button" onClick={() => setRiskF(f)} className={cn("rounded-md border px-2 py-1 text-[10.5px]", riskF === f ? "border-[#0f3468] bg-[#f2f8ff] text-[#0b4f91]" : "border-[#dbe5f1] bg-white text-[#5b6b80] hover:bg-[#f7fafe]")}>{f}</button>
              ))}
            </div>
          </div>
          <div>
            <table className="w-full border-collapse text-left">
              <thead className="bg-[#f7fafe] text-[10px] font-semibold text-[#3a5e8c]">
                <tr><th className="px-3 py-2">고객</th><th className="px-2 py-2">통화 시각</th><th className="px-2 py-2">문의 유형</th><th className="px-3 py-2">전이 위험</th><th className="px-2 py-2 text-center">내 조치 상태</th></tr>
              </thead>
              <tbody>
                {shown.map((v) => (
                  <tr key={v.id} onClick={() => setSel(v.id)} className={cn("cursor-pointer border-t border-[#eef3f9] align-top text-[11.5px] transition-colors", v.id === sel ? "bg-[#f2f8ff]" : "hover:bg-[#f7fafe]")}>
                    <td className="px-3 py-2 font-semibold text-[#10233f]">{v.customer}</td>
                    <td className="px-2 py-2 text-[10.5px] text-[#5b6b80]">{v.datetime}</td>
                    <td className="px-2 py-2 text-[11px] text-[#10233f]">{v.vocType}</td>
                    <td className="w-[136px] px-3 py-2">
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold tabular-nums text-[#10233f]">{v.score}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: aRiskHex(v.risk) }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: aRiskHex(v.risk) }} />{v.risk}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eef2f7]"><div className="h-full rounded-full" style={{ width: `${v.score}%`, background: aRiskHex(v.risk) }} /></div>
                    </td>
                    <td className="px-2 py-2 text-center"><Chip label={statusOf(v)} level={stTone(statusOf(v))} dot /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 우: 상세 + 후속 */}
        <aside className="sticky top-4 flex w-[384px] shrink-0 flex-col border border-[#e6edf5] bg-white">
          <div className="border-b border-[#eef2f7] px-3 py-2.5 text-[12px] font-bold text-[#10233f]">상담 상세 · 후속 조치</div>
          <div className="space-y-3 p-3">
            <div className="flex items-center gap-1.5"><span className="text-[12px] font-bold text-[#10233f]">{d.customer}</span><ChannelTag c={d.channel} /><span className="ml-auto text-[10px] text-muted-foreground">{d.datetime}</span></div>

            {/* 악성민원 위험 */}
            <div className={cn("rounded-lg border p-2.5", d.risk === "높음" ? "border-[#bcd3ef] bg-[#eef4fb]" : "border-[#e2eaf4] bg-[#fbfdff]")}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><ShieldAlert className="h-3 w-3" /> 악성민원 발전 위험</span>
                <span className="flex items-center gap-1.5 text-[11px] font-bold tabular-nums text-[#10233f]">{d.score}<span className="text-[9px] font-normal text-muted-foreground">/100</span><span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: aRiskHex(d.risk) }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: aRiskHex(d.risk) }} />{d.risk}</span></span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eef2f7]"><div className="h-full rounded-full" style={{ width: `${d.score}%`, background: aRiskHex(d.risk) }} /></div>
              {d.triggers.length ? <div className="mt-2 flex flex-wrap items-center gap-1"><span className="text-[9.5px] text-muted-foreground">트리거</span>{d.triggers.map((t) => <Chip key={t} label={t} level="bad" />)}</div> : <div className="mt-2 text-[9.5px] text-muted-foreground">위험 트리거 미검출</div>}
              {d.risk === "높음" ? <div className="mt-2 flex items-start gap-1 rounded-md bg-[#eaf2fc] px-2 py-1 text-[10px] text-[#0f3468]"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> 악성민원 발전 위험 — 신중 응대 · 후속 조치 권고</div> : null}
              {/* 보조 지표 */}
              <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-[#cfdcec] pt-2.5">
                <div><div className="text-[9px] text-muted-foreground">고객 감정</div><div className="text-[11px] font-bold" style={{ color: senti(d) < -20 ? "#0f3468" : senti(d) < 20 ? "#5b6b80" : "#0f766e" }}>{sentiLabel(senti(d))} <span className="text-[9px] font-normal tabular-nums text-muted-foreground">{senti(d)}</span></div></div>
                <div><div className="text-[9px] text-muted-foreground">유사 문의 (7일)</div><div className="text-[11px] font-bold tabular-nums text-[#10233f]">{TYPE_RECENT[d.vocType] ?? 0}건</div></div>
              </div>
              <div className="mt-2">
                <div className="mb-1 text-[9px] text-muted-foreground">감지 키워드</div>
                <div className="flex flex-wrap gap-1">
                  {d.keywords.map((k) => <span key={k} className="rounded border border-[#dbe5f1] bg-white px-1.5 py-0.5 text-[9.5px] text-[#0b4f91]">{k}</span>)}
                  {d.triggers.map((t) => <span key={t} className="rounded border border-[#bcd3ef] bg-[#eaf2fc] px-1.5 py-0.5 text-[9.5px] font-medium text-[#0f3468]">{t}</span>)}
                </div>
              </div>
            </div>

            {/* 감지된 문장(원문) + 분석 */}
            <div className="rounded-lg border border-[#e2eaf4] bg-white p-2.5">
              <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><AlertTriangle className="h-3 w-3" /> 감지된 문장 · 분석</div>
              <ul className="space-y-2">
                {detectOf(d).map((s, i) => (
                  <li key={i} className="rounded-md bg-[#f7fafe] px-2.5 py-2">
                    <div className="text-[11px] leading-5 text-[#10233f]">“{s.quote}”</div>
                    <div className="mt-1 flex items-start gap-1 border-t border-[#eef2f7] pt-1 text-[9.5px] leading-[1.5] text-muted-foreground"><Sparkles className="mt-[1px] h-2.5 w-2.5 shrink-0 text-[#0f3468]" />{s.analysis}</div>
                  </li>
                ))}
              </ul>
            </div>

            {/* 핵심 요약 */}
            <div className="rounded-lg border border-[#e2eaf4] bg-[#fbfdff] p-2.5">
              <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><FileText className="h-3 w-3" /> 통화 요약</div>
              <p className="text-[11px] leading-5 text-[#10233f]">{d.summary}</p>
              <div className="mt-2 border-t border-[#eef2f7] pt-1.5 text-[10.5px]"><span className="text-muted-foreground">고객 요구사항 · </span><span className="font-medium text-[#10233f]">{NEED[d.id] ?? "—"}</span></div>
            </div>

            {/* 후속 조치 */}
            <div className="rounded-lg border border-[#e2eaf4] bg-white p-2.5">
              <div className="mb-1.5 text-[10px] font-semibold text-[#0b4f91]">후속 조치</div>
              <div className="flex flex-wrap gap-1.5">
                {(["콜백 예약", "문자 안내", "부서 이관 요청"] as const).map((a) => (
                  <button key={a} type="button" onClick={() => setFu((p) => ({ ...p, [d.id]: a }))} className={cn("rounded-md border px-2 py-1 text-[10.5px]", fu[d.id] === a ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#dbe5f1] bg-white text-[#5b6b80] hover:bg-[#f7fafe]")}>{a}</button>
                ))}
              </div>
              <Button size="sm" onClick={() => setFu((p) => ({ ...p, [d.id]: "완료" }))} className="mt-2 h-7 w-full gap-1.5 bg-[#14b8a6] text-[11px] hover:bg-[#0f9e8c]"><CheckCircle2 className="h-3.5 w-3.5" /> 후속 완료 처리</Button>
              {fu[d.id] ? <div className="mt-1.5 text-[10px] text-[#0f766e]">현재 조치: <b>{fu[d.id]}</b></div> : null}
              <div className="mt-1.5 text-[9px] text-muted-foreground">※ 부서 배정·정형 회신은 관리자/민원처리에서 진행됩니다.</div>
            </div>
          </div>
        </aside>
      </div>

      {/* 상담 주의 유형 · 응대 포인트 — 팝업 */}
      {attnOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setAttnOpen(false)}>
          <div className="w-full max-w-[440px] overflow-hidden rounded-lg border border-[#e6edf5] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1.5 border-b border-[#eef2f7] px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-[13px] font-bold text-[#10233f]">상담 주의 유형 · 응대 포인트</span>
              <span className="text-[10px] text-muted-foreground">민원 빈발 주제</span>
              <button type="button" onClick={() => setAttnOpen(false)} className="ml-auto text-muted-foreground hover:text-[#10233f]"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[60vh] space-y-1.5 overflow-y-auto p-4">
              {ATTN.map((a) => (
                <div key={a.topic} className="rounded-md border border-[#eef2f7] bg-[#fbfdff] px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TONE_HEX[riskTone(a.risk)] }} />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#10233f]">{a.topic}</span>
                    <span className="shrink-0 rounded-sm bg-[#eef4fb] px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#0b4f91]">{a.count}건</span>
                  </div>
                  <div className="mt-1 flex items-start gap-1 text-[10px] leading-[1.5] text-[#33445c]">
                    <AlertTriangle className="mt-[1px] h-3 w-3 shrink-0 text-amber-500" />{a.caution}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


/* ===== 관리자(전사) 뷰 ===== */
export function AdminAnalyze() {
  const router = useRouter()
  const rows = [...VOCS].sort((a, b) => b.score - a.score)
  const [riskF, setRiskF] = useState<Level | "전체">("전체")
  const [sel, setSel] = useState<string>(rows[0].id)
  const [statusMap, setStatusMap] = useState<Record<string, string>>({})
  const [alertMap, setAlertMap] = useState<Record<string, boolean>>({})
  const [role, setRole] = useState<"agent" | "admin">("agent")
  const [scope, setScope] = useState<"mine" | "all">("mine")
  useEffect(() => {
    const r = localStorage.getItem("genon:role")
    if (r === "admin" || r === "agent") { setRole(r); setScope(r === "admin" ? "all" : "mine") }
  }, [])
  const stat = (id: string, base: string) => statusMap[id] ?? normStatus(base)
  const mineCount = rows.filter((r) => mineReason(r)).length
  const scoped = rows.filter((r) => scope === "all" || mineReason(r))
  const shown = scoped.filter((r) => riskF === "전체" || r.risk === riskF)
  const d = VOCS.find((v) => v.id === sel) ?? rows[0]
  const [periodKey, setPeriodKey] = useState("10m")
  const [from, setFrom] = useState("2026-06-01")
  const [to, setTo] = useState("2026-06-17")
  const base = PERIODS.find((p) => p.key === periodKey)
  const P: Period = base ?? { key: "custom", label: "선택 기간", total: 18600, complaint: 980, potential: 1580, high: 402, mid: 1360, low: 798, avg: 48, sub: `${from} ~ ${to}` }
  const voc = P.complaint + P.potential
  const TYPES = TYPE_SHARE.map((t) => ({ k: t.k, n: Math.round(voc * t.share), mix: t.mix }))
  const typeMax = Math.max(...TYPES.map((t) => t.n), 1)
  const COMP = [
    { k: "일반 질의", n: P.total - voc, c: "#cbd5e1", isVoc: false },
    { k: "잠재 민원", n: P.potential, c: "#38bdf8", isVoc: true },
    { k: "민원", n: P.complaint, c: "#0f3468", isVoc: true },
  ]
  const RISK = [
    { k: "높음", n: P.high, c: "#0f3468" },
    { k: "보통", n: P.mid, c: "#38bdf8" },
    { k: "낮음", n: P.low, c: "#14b8a6" },
  ]
  const pctT = (n: number) => Math.round((n / P.total) * 100)
  const pctV = (n: number) => Math.round((n / voc) * 100)
  let _acc = 0
  const riskStops = RISK.map((s) => { const a = (_acc / voc) * 360; _acc += s.n; const b = (_acc / voc) * 360; return `${s.c} ${a}deg ${b}deg` }).join(", ")

  return (
    <div className="flex flex-col">
      {/* 현황 밴드 — 화면을 가로지르는 구분선으로 구분 */}
      <div className="border-b border-[#dbe5f1] bg-[#f4f8fd] px-6 py-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="text-[13px] font-bold text-[#10233f]">VoC 현황</div>
          <span className="text-[10px] text-muted-foreground">{P.label} · {P.sub}</span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><CalendarRange className="h-3.5 w-3.5" /> 기간</span>
            {PERIODS.map((p) => (
              <button key={p.key} type="button" onClick={() => setPeriodKey(p.key)} className={cn("rounded-md border px-2 py-1 text-[10.5px]", periodKey === p.key ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#dbe5f1] bg-white text-[#5b6b80] hover:bg-[#f7fafe]")}>{p.label}</button>
            ))}
            <button type="button" onClick={() => setPeriodKey("custom")} className={cn("rounded-md border px-2 py-1 text-[10.5px]", periodKey === "custom" ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#dbe5f1] bg-white text-[#5b6b80] hover:bg-[#f7fafe]")}>사용자 지정</button>
            {periodKey === "custom" ? (
              <span className="flex items-center gap-1">
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-[#dbe5f1] bg-white px-2 py-1 text-[10.5px] text-[#10233f] outline-none focus:border-[#0f3468]" />
                <span className="text-[10px] text-muted-foreground">~</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-[#dbe5f1] bg-white px-2 py-1 text-[10.5px] text-[#10233f] outline-none focus:border-[#0f3468]" />
              </span>
            ) : null}
          </div>
        </div>
        <div className={cn("grid gap-3", role === "admin" ? "grid-cols-[1.1fr_0.95fr_0.95fr_0.7fr]" : "grid-cols-[1.25fr_1fr_1.05fr]")}>
          {/* 문의 구성 카드 */}
          <div className="rounded-xl border border-[#e2eaf4] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#10233f]">문의 구성</span>
              <span className="text-[10px] text-muted-foreground">VoC = 민원 + 잠재 민원</span>
            </div>
            <div className="mb-3 flex items-baseline gap-1.5">
              <span className="text-[26px] font-bold leading-none tabular-nums text-[#10233f]">{fmt(P.total)}</span>
              <span className="text-[11px] text-muted-foreground">건 · 전체 문의</span>
              <span className="ml-auto rounded-md bg-[#eaf2fc] px-2 py-1 text-[10.5px] font-semibold text-[#0f3468]">VoC {fmt(voc)}건 · {pctT(voc)}%</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-[#eef2f7]">
              {COMP.map((c) => <div key={c.k} className="h-full" style={{ width: `${(c.n / P.total) * 100}%`, background: c.c }} />)}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {COMP.map((c) => (
                <div key={c.k} className={cn("rounded-lg border px-2.5 py-2", c.isVoc ? "border-[#cfe0f1] bg-[#f2f8ff]" : "border-[#e6edf5] bg-[#f8fafd]")}>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="h-2 w-2 rounded-sm" style={{ background: c.c }} />{c.k}</div>
                  <div className="mt-1 flex items-baseline gap-1"><span className="text-[16px] font-bold tabular-nums text-[#10233f]">{fmt(c.n)}</span><span className="text-[9.5px] text-muted-foreground">건 · {pctT(c.n)}%</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* VoC 유형 분포 카드 */}
          <div className="rounded-xl border border-[#e2eaf4] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#10233f]">주요 VoC 유형</span>
              <span className="text-[10px] text-muted-foreground">자동 분류 · VoC {fmt(voc)}건</span>
            </div>
            <div className="space-y-1.5">
              {TYPES.map((t) => (
                <div key={t.k} className="flex items-center gap-2 text-[10.5px]">
                  <span className="w-[68px] shrink-0 truncate text-[#33445c]">{t.k}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef2f7]">
                    <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${(t.n / typeMax) * 100}%` }}>
                      <div className="h-full" style={{ width: `${t.mix[2] * 100}%`, background: TONE_HEX.good }} />
                      <div className="h-full" style={{ width: `${t.mix[1] * 100}%`, background: TONE_HEX.warn }} />
                      <div className="h-full" style={{ width: `${t.mix[0] * 100}%`, background: TONE_HEX.bad }} />
                    </div>
                  </div>
                  <span className="w-7 text-right font-semibold tabular-nums text-[#10233f]">{fmt(t.n)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex items-center gap-3 border-t border-[#eef2f7] pt-2 text-[9px] text-muted-foreground">
              {(["낮음", "보통", "높음"] as Level[]).map((l) => (
                <span key={l} className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: TONE_HEX[riskTone(l)] }} /> {l}</span>
              ))}
            </div>
          </div>

          {/* 악성민원 발전 위험 카드 */}
          <div className="rounded-xl border border-[#e2eaf4] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#10233f]">악성민원 발전 위험</span>
              <span className="text-[10px] text-muted-foreground">VoC {fmt(voc)}건 기준</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-[84px] w-[84px] shrink-0 rounded-full" style={{ background: `conic-gradient(${riskStops})` }}>
                <div className="absolute inset-[12px] flex flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-[16px] font-bold leading-none text-[#10233f]">{P.avg}</span>
                  <span className="mt-0.5 text-[8px] text-muted-foreground">평균 스코어</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                {RISK.map((r) => (
                  <div key={r.k} className="flex items-center gap-1.5 text-[10.5px]">
                    <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: r.c }} />
                    <span className="text-muted-foreground">{r.k}</span>
                    <span className="ml-auto font-semibold tabular-nums text-[#10233f]">{fmt(r.n)}</span>
                    <span className="w-9 text-right text-[9.5px] text-muted-foreground">{pctV(r.n)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded-md bg-[#eaf2fc] px-2.5 py-1.5 text-[10.5px] text-[#0f3468]">
              <ShieldAlert className="h-3.5 w-3.5" /> 高 위험 <b className="mx-0.5">{fmt(P.high)}건</b> — 우선 대응 필요
            </div>
          </div>

          {/* 처리 현황 카드 — 관리자 전용 */}
          {role === "admin" ? (
            <div className="rounded-xl border border-[#e2eaf4] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-bold text-[#10233f]">처리 현황</span><span className="text-[10px] text-muted-foreground">우선 대응 {rows.length}건</span></div>
              <div className="space-y-1.5">
                {STATUS_FLOW.map((s) => (
                  <div key={s} className="flex items-center justify-between text-[10.5px]">
                    <span className="flex items-center gap-1.5 text-[#33445c]"><span className={cn("h-1.5 w-1.5 rounded-full", s === "처리 완료" ? "bg-[#14b8a6]" : s === "처리 중" ? "bg-[#38bdf8]" : s === "부서 배정" ? "bg-[#0f3468]" : "bg-slate-300")} /> {s}</span>
                    <b className="tabular-nums text-[#10233f]">{rows.filter((r) => stat(r.id, r.status) === s).length}</b>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-start gap-3 px-6 py-4">
        {/* 좌: 분석 결과 목록 패널 (각진 테이블) */}
        <section className="flex flex-1 flex-col overflow-hidden border border-[#dbe5f1] bg-white">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#eef2f7] bg-gradient-to-r from-[#e8f1fb] to-white px-3 py-2.5">
            <div className="text-[12px] font-bold text-[#10233f]">{role === "agent" ? "내 민원 처리 대기열" : "민원 VoC 분석 결과"}</div>
            {role === "agent" ? (
              <div className="flex gap-1">
                <button type="button" onClick={() => setScope("mine")} className={cn("rounded-md border px-2 py-1 text-[10.5px]", scope === "mine" ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#dbe5f1] bg-white text-[#5b6b80] hover:bg-[#f7fafe]")}>내 담당 {mineCount}</button>
                <button type="button" onClick={() => setScope("all")} className={cn("rounded-md border px-2 py-1 text-[10.5px]", scope === "all" ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#dbe5f1] bg-white text-[#5b6b80] hover:bg-[#f7fafe]")}>전체 {rows.length}</button>
              </div>
            ) : null}
            <span className="text-[10px] text-muted-foreground">악성민원 위험순 · {shown.length}건</span>
            <div className="ml-auto flex gap-1">
              {(["전체", "높음", "보통", "낮음"] as const).map((f) => (
                <button key={f} type="button" onClick={() => setRiskF(f)} className={cn("rounded-md border px-2 py-1 text-[10.5px]", riskF === f ? "border-[#0f3468] bg-[#f2f8ff] text-[#0b4f91]" : "border-[#dbe5f1] bg-white text-[#5b6b80] hover:bg-[#f7fafe]")}>{f}</button>
              ))}
            </div>
          </div>
          {role === "agent" && scope === "mine" ? (
            <div className="flex items-center gap-1.5 border-b border-[#eef2f7] bg-[#f2f8ff] px-3 py-1.5 text-[10px] text-[#0b4f91]">
              <Inbox className="h-3 w-3 shrink-0" /> 내 팀(<b>{MY_TEAM}</b>) 이관 건 + 내가 상담한 고객 기준으로 조회됩니다. 후속 조치가 필요한 건을 우선 처리하세요.
            </div>
          ) : null}
          <div>
            <table className="w-full border-collapse text-left">
              <thead className="bg-[#f7fafe] text-[10px] font-semibold text-[#3a5e8c]">
                <tr><th className="px-3 py-2">VoC · 고객</th><th className="px-2 py-2">유형</th><th className="px-2 py-2">고객 경험</th><th className="px-3 py-2">악성민원 위험</th><th className="px-2 py-2">유관 부서</th><th className="px-2 py-2 text-center">처리 상태</th></tr>
              </thead>
              <tbody>
                {shown.map((v) => (
                  <tr key={v.id} onClick={() => setSel(v.id)} className={cn("cursor-pointer border-t border-[#eef3f9] align-top text-[11.5px] transition-colors", v.id === sel ? "bg-[#f2f8ff]" : "hover:bg-[#f7fafe]")}>
                    <td className="px-3 py-2"><div className="font-mono text-[10px] text-[#0f3468]/70">{v.id}</div><div className="flex items-center gap-1.5"><span className="font-semibold text-[#10233f]">{v.customer}</span><ChannelTag c={v.channel} />{role === "agent" && scope === "all" && mineReason(v) ? <span className="rounded-sm border border-[#bad6f4] bg-[#f2f8ff] px-1 py-px text-[8.5px] text-[#0b4f91]">{mineReason(v)}</span> : null}</div></td>
                    <td className="px-2 py-2 text-[11px] text-[#10233f]">{v.vocType}</td>
                    <td className="px-2 py-2"><Chip label={v.exp} level={expTone(v.exp)} /></td>
                    <td className="w-[136px] px-3 py-2"><div className="mb-1 flex items-center gap-1.5"><span className="text-[10px] font-semibold tabular-nums text-[#10233f]">{v.score}</span><Chip label={v.risk} level={riskTone(v.risk)} dot /></div><ScoreBar value={v.score} level={riskTone(v.risk)} /></td>
                    <td className="px-2 py-2 text-[11px] text-[#10233f]">{v.dept}</td>
                    <td className="px-2 py-2 text-center"><Chip label={stat(v.id, v.status)} level={statusTone(stat(v.id, v.status))} dot /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 우: 상세 분석·처리 패널 */}
        <aside className="sticky top-4 flex w-[384px] shrink-0 flex-col border border-[#e6edf5] bg-white">
          <div className="border-b border-[#eef2f7] bg-gradient-to-r from-[#e8f1fb] to-white px-3 py-2.5 text-[12px] font-bold text-[#10233f]">VoC 상세 분석 · 처리</div>
          <div className="space-y-3 p-3">
            <div className="flex items-center gap-1.5"><span className="font-mono text-[10px] text-[#0f3468]/70">{d.id}</span><span className="text-[12px] font-bold text-[#10233f]">{d.customer}</span><span className="ml-auto text-[10px] text-muted-foreground">{d.datetime}</span></div>

            {/* 악성민원 발전 위험 */}
            <div className={cn("rounded-lg border p-2.5", d.risk === "높음" ? "border-[#bcd3ef] bg-[#eef4fb]" : "border-[#e2eaf4] bg-[#fbfdff]")}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><ShieldAlert className="h-3 w-3" /> 악성민원 발전 위험</span>
                <span className="flex items-center gap-1.5 text-[11px] font-bold tabular-nums text-[#10233f]">{d.score}<span className="text-[9px] font-normal text-muted-foreground">/100</span><Chip label={d.risk} level={riskTone(d.risk)} dot /></span>
              </div>
              <ScoreBar value={d.score} level={riskTone(d.risk)} />
              {d.triggers.length ? <div className="mt-2 flex flex-wrap items-center gap-1"><span className="text-[9.5px] text-muted-foreground">트리거</span>{d.triggers.map((t) => <Chip key={t} label={t} level="bad" />)}</div> : <div className="mt-2 text-[9.5px] text-muted-foreground">위험 트리거 키워드 미검출</div>}
              {d.risk === "높음" ? <div className="mt-2 flex items-start gap-1 rounded-md bg-[#eaf2fc] px-2 py-1 text-[10px] text-[#0f3468]"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> 악성민원 발전 위험 — 담당 부서 우선 배정·대응 필요</div> : null}
            </div>

            {/* 다음 업무 · 메일 답변 초안 */}
            <Button onClick={() => router.push(`/voc?tab=reply&voc=${d.id}`)} className="h-9 w-full gap-1.5 bg-[#0f3468] text-[11.5px] hover:bg-[#0b2547]"><Mail className="h-4 w-4" /> 민원 처리하기</Button>

            {/* AI 1차 분류 */}
            <div>
              <div className="mb-1 text-[10px] font-semibold text-[#0b4f91]">AI 1차 분류</div>
              <div className="grid grid-cols-3 gap-1.5">
                <Meta label="VoC 유형" value={d.vocType} />
                <Meta label="고객 경험" value={d.exp} level={expTone(d.exp)} />
                <Meta label="유관 부서" value={d.dept} />
              </div>
            </div>

            {/* 핵심 요약 */}
            <div className="rounded-lg border border-[#e2eaf4] bg-[#fbfdff] p-2.5">
              <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><FileText className="h-3 w-3" /> 핵심 요약</div>
              <p className="text-[11px] leading-5 text-[#10233f]">{d.summary}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">{d.keywords.map((k) => <span key={k} className="rounded border border-[#dbe5f1] bg-[#f7fafe] px-1.5 py-0.5 text-[9.5px] text-[#0b4f91]">#{k}</span>)}</div>
              <div className="mt-2 border-t border-[#eef2f7] pt-1.5 text-[10.5px]"><span className="text-muted-foreground">고객 요구사항 · </span><span className="font-medium text-[#10233f]">{NEED[d.id] ?? "—"}</span></div>
            </div>

            {/* 담당 부서 자동 배정 + 알림 */}
            <div className="rounded-lg border border-[#e2eaf4] bg-white p-2.5">
              <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><ArrowRight className="h-3 w-3" /> 담당 부서 자동 배정</div>
              <p className="text-[11px] text-[#10233f]">VoC 유형·악성민원 발전 위험 기준 <b>{d.dept}</b>로 배정되었습니다.</p>
              {alertMap[d.id] ? (
                <div className="mt-2 flex items-center gap-1.5 rounded-md border border-[#b9ece0] bg-[#e9faf4] px-2 py-1.5 text-[10.5px] text-[#0f766e]"><CheckCircle2 className="h-3.5 w-3.5" /> {d.dept} 담당자 메일 알림 발송 완료</div>
              ) : (
                <Button size="sm" onClick={() => { setAlertMap((p) => ({ ...p, [d.id]: true })); setStatusMap((p) => ({ ...p, [d.id]: stat(d.id, d.status) === "분석 완료" ? "부서 배정" : stat(d.id, d.status) })) }} className="mt-2 h-7 w-full gap-1.5 bg-[#0f3468] text-[11px] hover:bg-[#0b2547]"><Bell className="h-3.5 w-3.5" /> {d.dept} 담당자 알림 발송</Button>
              )}
            </div>

            {/* 처리 상태 관리 */}
            <div className="rounded-lg border border-[#e2eaf4] bg-white p-2.5">
              <div className="mb-1.5 text-[10px] font-semibold text-[#0b4f91]">처리 상태 관리</div>
              <div className="flex flex-wrap gap-1">
                {STATUS_FLOW.map((s) => {
                  const active = stat(d.id, d.status) === s
                  return <button key={s} type="button" onClick={() => setStatusMap((p) => ({ ...p, [d.id]: s }))} className={cn("rounded-md border px-2 py-1 text-[10.5px]", active ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#dbe5f1] bg-white text-[#5b6b80] hover:bg-[#f7fafe]")}>{s}</button>
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Meta({ label, value, level }: { label: string; value: string; level?: Tone }) {
  return <div className={cn("rounded-lg border px-2 py-1.5", level ? tone(level) : "border-[#e2eaf4] bg-white")}><div className="text-[9px] opacity-80">{label}</div><div className={cn("mt-0.5 text-[11px] font-bold", level ? "" : "text-[#10233f]")}>{value}</div></div>
}

/* ===================== 3) 답변 초안 ===================== */
type ReplyTpl = { key: string; name: string; desc: string; sections: string[]; forType?: string }
const TEMPLATES: ReplyTpl[] = [
  { key: "부지급 안내", name: "부지급 안내 템플릿", desc: "보험금 부지급 사유·약관 근거·재심사 안내", sections: ["청구 내용 확인", "부지급 사유(약관 근거)", "재심사 절차 안내", "분쟁조정 안내"], forType: "보험금 지급" },
  { key: "불완전판매 회신", name: "불완전판매 회신 템플릿", desc: "가입 경위·판매 적정성 검토·보상/철회 안내", sections: ["가입 경위", "판매 적정성 검토", "보상·철회 조치 안내"], forType: "불완전판매" },
  { key: "환급금 안내", name: "환급금 안내 템플릿", desc: "환급금 산출 기준·차액 사유·정정 안내", sections: ["환급금 산출 기준", "차액 발생 사유", "정정·지급 안내"], forType: "해지·환급" },
  { key: "응대 사과", name: "응대 사과 템플릿", desc: "응대 불만 사과·사실관계·재발 방지", sections: ["사과 표명", "사실관계 확인", "재발 방지 조치"], forType: "응대·서비스" },
  { key: "기본", name: "기본 회신 템플릿", desc: "민원 요지·사실관계·회사 의견 표준 구성", sections: ["민원 요지", "사실관계 및 처리 경과", "회사 의견"] },
]
// 유사사례 → 검토의견 작성 지원. format/formatCust = 쟁점 대응 논점(고른 것만 검토의견에 삽입), defense = 방어 자료·전략 요약(읽기 전용).
type Boost = { label: string; body: string }
// 유사 분석 — 현재 건 대비 축별 비교(민원 유형/가입 상품/핵심 쟁점/고객 컨텍스트 등)
type CasePoint = { k: string; v: string; m: "동일" | "유사" | "관련" }
type PastCase = { sim: number; id: string; title: string; result: string; reply: string; format?: Boost[]; formatCust?: Boost[]; defense?: string[]; secs?: string[]; cust?: string; why?: string; outcome?: string; points?: CasePoint[]; profile?: { customer: string; product: string; inquiry: string }; complaint?: string; custRaw?: string }
const GENERIC_CASES: PastCase[] = [
  { sim: 86, id: "C-2025-1024", title: "동일 유형 고객 불만 처리", result: "약관 설명 후 종결", reply: "제기하신 내용을 검토한 결과, 관련 약관 제○조에 따라 적정하게 처리되었음을 안내드렸습니다." },
  { sim: 79, id: "C-2025-0837", title: "유사 항변 처리", result: "분쟁조정 후 합의", reply: "분쟁조정 절차를 통해 양측 의견을 조율하여 원만히 합의에 이르렀습니다." },
  { sim: 72, id: "C-2024-2451", title: "개선 요청 처리", result: "절차 개선 반영", reply: "제안 주신 사항을 내부 검토하여 처리 절차를 개선·반영하였습니다." },
]
const SIMILAR_BY_TYPE: Record<string, PastCase[]> = {
  "보험금 지급": [
    { sim: 94, id: "C-2025-1182", title: "암 진단 보험금 부지급 항의", result: "재심사 후 일부 지급", reply: "추가 제출하신 진단서·조직검사 결과를 재심사한 결과, 약관상 보장 범위 내 진단으로 확인되어 보험금 일부를 지급하기로 결정하였습니다." },
    { sim: 88, id: "C-2025-0974", title: "보험금 부지급 분쟁조정 제기", result: "부지급 유지·분쟁조정 종결", reply: "약관 제○조의 면책 사유에 해당하여 부지급 결정을 유지하였으며, 금융분쟁조정위원회 조정 결과 동일하게 확정되었습니다." },
    { sim: 81, id: "C-2024-2310", title: "진단 보험금 청구 서류 미비", result: "서류 보완 안내 후 지급", reply: "청구 서류 일부 미비로 보완을 안내드렸고, 보완 접수 후 정상 지급 처리되었습니다." },
  ],
  "불완전판매": [
    { sim: 91, id: "C-2025-0663", title: "불완전판매 주장·계약 재검토", result: "청약철회·보험료 환급", reply: "판매 과정의 설명 의무 이행 여부를 검토한 결과 일부 미흡이 확인되어, 청약철회 및 납입 보험료를 환급하였습니다." },
    { sim: 84, id: "C-2025-0521", title: "설명 미흡 항변", result: "판매 적정·민원 종결", reply: "녹취 및 청약서 검토 결과 설명 의무가 적정히 이행되어 계약이 유효함을 안내드렸습니다." },
  ],
  "해지·환급": [
    {
      sim: 92, id: "C-2025-0902", title: "저축성보험 해지환급금 차액 이의 (분쟁조정)", result: "산출근거 소명 · 단순오류 1건 정정·차액 지급 후 종결",
      why: "저축성보험 가입 고객이 납입원금 대비 해지환급금이 적다며 산출 기준·차액 근거를 요구한 건으로, 상품군(저축성)·핵심 쟁점(환급금 산출)·고객 컨텍스트가 현재 건과 가장 유사합니다.",
      outcome: "차액 지급·합의 종결",
      profile: { customer: "50대 · 저축성보험 12년 유지 고객", product: "무배당 저축보험 (월납 · 납입원금 1,800만원)", inquiry: "해지환급금이 납입원금보다 적다며 산출 기준·차액 근거 요구" },
      complaint: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              금  융  감  독  원
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
수신   제논라이프생명보험(주) 소비자보호팀장
참조   민원 담당자
제목   금융민원 관련 자율조정 의뢰

문서번호   금소보-2025-제02871호
접수번호   2025V4820
처리구분   자율조정 (불성립 시 사실조회)
민원구분   일반민원
접수일자   2025. 4. 3.
회신기한   2025. 4. 23. (의뢰일로부터 14일)
담당부서   금융소비자보호처 보험민원국 보험민원2팀
담당자     이심사 선임 (전화 02-000-0000)
민원인     김OO (연락처 010-0000-0000)
관련계약   무배당 제논저축보험 / 증권 GN-2013-1188920
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 귀사의 금융소비자 보호 업무에 노고가 많으십니다.

2. 우리 원에 아래와 같은 민원이 접수되어 자율조정을
   의뢰하오니, 처리 후 관련서류를 회신하여 주시기 바랍니다.

──────────────────────────────────
[민원 요지]  ※ 민원인이 제출한 원문

  2013년경 가입하여 12년간 매월 성실히 납입한
  저축성보험을 해지하였으나, 지급된 해지환급금이
  납입원금보다 현저히 적음. 저축 목적으로 가입하였음에도
  원금에도 미치지 못하는 사유를 이해할 수 없으며,
  해지환급금 산출 기준과 항목별 공제 내역, 차액에 대한
  구체적 근거의 제시를 요청함.
──────────────────────────────────

[처리 지시]
  1. 자율조정 대상인 경우, 운영지침에 따라 처리 후
     자율조정 결과 등 관련서류를 14일 이내 제출.
  2. 대상이 아니거나 불성립된 경우, 위 기한 내 붙임과
     같이 사실조회 결과 등 관련서류를 제출.

[사실조회 요청사항]  ※ 자율조정 불성립 시
  가. 해지환급금 산출 근거·항목별 공제 내역(산출명세서)
  나. 약관 별표(경과기간별 해지환급률) 적용 내역
  다. 가입 당시 상품설명서 교부·설명 여부
  라. 향후 처리 계획

[유의사항]
  - 민원서류는 본건 처리 목적 외 사용 금지(신용정보법 등)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        금융감독원  보험민원국장  (직인 생략)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      custRaw: "12년간 매달 꼬박꼬박 넣은 저축보험을 해지했는데, 돌려받은 돈이 제가 낸 원금보다 훨씬 적습니다. 저축이라길래 믿고 들었는데 원금도 안 된다는 게 말이 됩니까? 도대체 무슨 기준으로 이렇게 적게 주는 건지, 뭘 얼마나 떼어간 건지 하나하나 밝혀 주세요. 도저히 납득할 수 없습니다.",
      points: [
        { k: "민원 유형", v: "해지·환급 · 환급금 산출 이의", m: "동일" },
        { k: "가입 상품", v: "저축성보험(장기 납입)", m: "동일" },
        { k: "핵심 쟁점", v: "납입원금 대비 환급금 과소 · 산출근거 요구", m: "동일" },
        { k: "고객 정보", v: "50대 · 12년 유지 장기 고객", m: "유사" },
        { k: "민원 정황", v: "장기 납입 후 해지, 차액 소명 요구", m: "유사" },
      ],
      reply: "민원인이 납입원금 대비 해지환급금이 과소하다며 산출 기준과 차액 근거를 요구한 건. 경과기간별 해지환급률(별표)과 위험보험료·사업비(부가보험료)·해약공제액 공제 내역을 산출명세서로 항목화하여 제시하고, 검증 과정에서 확인된 단순 합산 오류 1건을 정정해 차액을 지급한 뒤, 동일 유형 분쟁조정 결정례(산출근거 적정 시 환급금 유지)와 정합함을 들어 종결한 사례.",
      format: [
        { label: "산출 구조 설명", body: "납입보험료와 해지환급금의 차액은 계약 초기에 집중 부과되는 신계약비 등 사업비와 보장에 사용된 위험보험료가 공제된 데 따른 것으로, 이는 해지를 전제로 한 정상적인 산출 구조입니다." },
        { label: "공제 내역 항목화", body: "해지환급금은 책임준비금에서 해약공제액을 차감하고 약관 별표의 경과기간별 해지환급률을 적용하여 산출되며, 위험보험료·사업비(부가보험료)·해약공제액의 공제 내역을 산출명세서로 항목화하여 제시하였습니다." },
        { label: "산출 재검증 결과", body: "민원 제기에 따라 해지환급금 산출 과정을 재검증한 결과, 약관 별표의 해지환급률과 공제 항목이 정상 적용되어 산정상의 오류는 발견되지 않았습니다." },
        { label: "분쟁조정례 정합", body: "동일 유형의 금융분쟁조정 결정례에서도 산출근거가 약관에 부합하는 경우 해지환급금을 그대로 유지하도록 결정된 바, 본 건 처리는 이와 정합합니다." },
        { label: "재발방지 조치", body: "산출 시스템 점검을 통해 동일 오류의 재발 방지 조치를 완료하였습니다." },
      ],
      defense: [
        "해지환급금 산출명세서로 위험보험료·사업비(부가보험료)·해약공제액을 항목 분해하여 제시",
        "약관 별표(경과기간별 해지환급률)를 산출 근거로 첨부",
        "동일 유형 금융분쟁조정 결정례를 인용해 산출근거 적정성·정합성 확보",
      ],
      secs: [
        "납입원금 대비 해지환급금이 과소하게 산정되었다며 산출 기준·공제 내역과 차액 근거의 제시를 요구함.",
        "해지환급금은 약관 별표의 경과기간별 해지환급률에 따라 책임준비금에서 해약공제액을 차감하여 산출됨. 본 건은 납입원금 18,000,000원, 경과 12년 기준 사업비(부가보험료) 3,960,000원을 공제하고 적용 해지환급률 79.2%를 반영하여 해지환급금 14,256,000원이 산출되었음. 산출 재검증 중 공제액 중복 반영 1건을 확인하여 정정하고 차액 426,000원을 추가 지급함.",
        "자체 조사결과 모집·심사 과정의 위규사항은 발견되지 않았으며, 산출 시스템 점검으로 동일 오류 재발 방지 조치를 완료함.",
        "해지환급금 산출명세서 및 약관 별표(해지환급률), 동일 유형 분쟁조정 결정례를 붙임.",
      ],
      cust: "고객님께서 해지환급금 산출 기준에 대하여 제기하신 사안을 안내드립니다.\n\n해지환급금은 납입하신 보험료 전액이 아니라, 약관에서 정한 경과기간별 해지환급률에 따라 사업비·위험보험료 등을 공제하여 산출됩니다. 고객님 계약의 산출 내역을 재확인한 결과 일부 단순 오류가 확인되어 이를 정정하고 차액을 추가로 지급해 드렸습니다.\n\n자세한 산출 내역은 동봉한 산출명세서를 참고하여 주시기 바라며, 추가 문의는 아래 연락처로 연락 주시기 바랍니다.",
      formatCust: [
        { label: "쉬운 말 설명", body: "해지환급금은 납입하신 보험료 전액이 아니라, 계약 초기에 집중되는 사업비와 그동안 보장에 사용된 위험보험료를 공제한 뒤 약관에서 정한 해지환급률을 적용하여 산출됩니다." },
        { label: "오류 확인 결과 안내", body: "고객님 계약의 산출 내역을 다시 확인해 드린 결과, 약관에서 정한 기준에 따라 정상적으로 산출되었음을 확인하였습니다." },
        { label: "유지 대안 안내", body: "해지하실 경우 보장이 종료되는 점도 함께 말씀드리며, 보험료 부담이 크시다면 감액완납·납입유예 등으로 보장을 유지하는 방법도 안내해 드릴 수 있습니다." },
      ],
    },
    {
      sim: 84, id: "C-2025-0418", title: "콜센터 안내액과 실제 환급금 상이 항의", result: "안내 시점차 설명 · 산출명세 제공 후 종결",
      why: "콜센터 안내 금액과 실제 해지환급금이 다르다는 항의로, 해지·환급 유형과 '안내 시점차' 쟁점 컨텍스트가 현재 건과 유사합니다.",
      outcome: "설명·자료 제공 후 합의 종결",
      profile: { customer: "40대 · 저축성/종신 계열 가입", product: "저축성보험", inquiry: "콜센터 안내 금액과 실제 해지환급금이 다르다며 사유 요구" },
      complaint: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              금  융  감  독  원
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
수신   제논라이프생명보험(주) 소비자보호팀장
참조   민원 담당자
제목   금융민원 관련 자율조정 의뢰

문서번호   금소보-2025-제01344호
접수번호   2025V2117
처리구분   자율조정 (불성립 시 사실조회)
민원구분   일반민원
접수일자   2025. 2. 6.
회신기한   2025. 2. 26. (의뢰일로부터 14일)
담당부서   금융소비자보호처 보험민원국 보험민원2팀
담당자     이심사 선임 (전화 02-000-0000)
민원인     박OO (연락처 010-0000-0000)
관련계약   무배당 제논저축보험 / 증권 GN-2018-4472013
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 귀사의 금융소비자 보호 업무에 노고가 많으십니다.

2. 우리 원에 아래와 같은 민원이 접수되어 자율조정을
   의뢰하오니, 처리 후 관련서류를 회신하여 주시기 바랍니다.

──────────────────────────────────
[민원 요지]  ※ 민원인이 제출한 원문

  콜센터 문의 시 안내받은 해지환급금과 실제 조회·지급된
  금액이 상이함. 상담원이 안내한 금액을 신뢰하여 해지를
  결정하였는데 금액이 달라진 사유와 어느 금액이 정확한지
  명확한 설명을 요청함.
──────────────────────────────────

[처리 지시]
  1. 자율조정 대상인 경우, 운영지침에 따라 처리 후
     자율조정 결과 등 관련서류를 14일 이내 제출.
  2. 대상이 아니거나 불성립된 경우, 위 기한 내 붙임과
     같이 사실조회 결과 등 관련서류를 제출.

[사실조회 요청사항]  ※ 자율조정 불성립 시
  가. 콜센터 안내 시점·금액 및 녹취 내역
  나. 해지 시점 경과기간별 해지환급률 적용 내역
  다. 안내 스크립트상 시점차 고지 여부
  라. 향후 처리 계획

[유의사항]
  - 민원서류는 본건 처리 목적 외 사용 금지(신용정보법 등)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        금융감독원  보험민원국장  (직인 생략)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      custRaw: "지난주에 콜센터에 전화해서 해지하면 얼마 받는지 물어봤고, 그 금액을 믿고 해지했는데 실제로는 다른 금액이 나왔습니다. 상담원 말만 믿은 제가 잘못입니까? 왜 금액이 다른지, 어느 게 맞는 건지 제대로 설명해 주세요.",
      points: [
        { k: "민원 유형", v: "해지·환급 · 환급금 상이 항의", m: "동일" },
        { k: "가입 상품", v: "저축성/종신 계열", m: "유사" },
        { k: "핵심 쟁점", v: "안내 금액과 실제 환급금 차이", m: "유사" },
        { k: "고객 정보", v: "40대 · 저축성 가입 고객", m: "유사" },
        { k: "민원 정황", v: "콜센터 안내 후 해지 진행", m: "유사" },
      ],
      reply: "콜센터 안내 금액과 실제 해지환급금이 다르다는 항의 건. 안내 시점과 해지 시점의 경과기간 차이로 해지환급률이 달라짐을 설명하고, 100% 일괄 안내가 아닌 경과연수별 환급률 표와 산출명세서를 제공해 종결한 사례.",
      format: [
        { label: "시점차 환급률 변동", body: "해지환급금은 해지하는 시점의 경과기간에 따른 해지환급률로 산출되므로, 콜센터 안내 시점과 실제 해지 시점의 경과기간 차이로 금액이 달라질 수 있습니다." },
        { label: "경과연수별 환급률 표", body: "100% 일괄 안내가 아닌 경과연수별 해지환급률 표와 산출명세서를 제공하여 시점별 금액 차이의 근거를 제시하였습니다." },
        { label: "보장 종료 우선 고지", body: "해지 시 보장이 종료되는 사실을 우선 고지하였으며, 안내 과정의 오해 소지를 줄이기 위한 조치를 병행하였습니다." },
      ],
      defense: [
        "경과연수별 해지환급률 표와 산출명세서를 제공해 시점별 금액 차이의 근거 제시",
        "콜센터 안내 스크립트에 '경과 시점별 환급률 변동' 고지 문구 보완(재발 방지)",
      ],
      secs: [
        "콜센터 안내 금액과 실제 해지환급금이 상이하다며 그 사유를 요구함.",
        "해지환급금은 해지 시점의 경과기간에 따른 해지환급률로 산출되며, 안내 시점과 실제 해지 시점의 경과기간 차이로 금액이 달라질 수 있음. 경과연수별 해지환급률 표와 산출명세서를 제공함.",
        "콜센터 안내 스크립트에 '경과 시점별 환급률 변동' 고지 문구를 보완함.",
        "경과연수별 해지환급률 표, 산출명세서를 붙임.",
      ],
      cust: "콜센터 안내 금액과 실제 해지환급금이 다른 사유를 안내드립니다.\n\n해지환급금은 해지하시는 시점의 경과기간에 따른 해지환급률로 산출되어, 문의하신 시점과 실제 해지 시점의 차이에 따라 금액이 달라질 수 있습니다. 경과연수별 환급률과 산출 내역을 동봉하오니 참고하여 주시기 바랍니다.",
    },
    {
      sim: 76, id: "C-2024-1755", title: "장기 유지 계약 환급률 불만 (유지 유도)", result: "환급/유지 비교 안내 · 유지 전환 종결",
      why: "장기 유지 계약의 환급률이 낮다는 불만으로, 해지·환급 유형과 '장기 유지 고객' 컨텍스트가 유사합니다.",
      outcome: "유지 전환·합의 종결",
      profile: { customer: "60대 · 장기 유지 고객", product: "장기 저축성보험", inquiry: "장기 유지했는데 환급률이 낮다며 불만 제기" },
      complaint: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              금  융  감  독  원
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
수신   제논라이프생명보험(주) 소비자보호팀장
참조   민원 담당자
제목   금융민원 관련 자율조정 의뢰

문서번호   금소보-2024-제07725호
접수번호   2024V9188
처리구분   자율조정 (불성립 시 사실조회)
민원구분   일반민원
접수일자   2024. 9. 2.
회신기한   2024. 9. 22. (의뢰일로부터 14일)
담당부서   금융소비자보호처 보험민원국 보험민원2팀
담당자     이심사 선임 (전화 02-000-0000)
민원인     정OO (연락처 010-0000-0000)
관련계약   무배당 제논저축보험 / 증권 GN-2009-2210774
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 귀사의 금융소비자 보호 업무에 노고가 많으십니다.

2. 우리 원에 아래와 같은 민원이 접수되어 자율조정을
   의뢰하오니, 처리 후 관련서류를 회신하여 주시기 바랍니다.

──────────────────────────────────
[민원 요지]  ※ 민원인이 제출한 원문

  장기간 유지해 온 계약의 해지환급률이 지나치게 낮음.
  오래 유지할수록 환급이 많아야 함에도 그렇지 않은 점에
  불만이 있으며, 현 시점 해지와 계속 유지 시의 환급
  조건을 비교하여 안내해 줄 것을 요청함.
──────────────────────────────────

[처리 지시]
  1. 자율조정 대상인 경우, 운영지침에 따라 처리 후
     자율조정 결과 등 관련서류를 14일 이내 제출.
  2. 대상이 아니거나 불성립된 경우, 위 기한 내 붙임과
     같이 사실조회 결과 등 관련서류를 제출.

[사실조회 요청사항]  ※ 자율조정 불성립 시
  가. 경과기간별 해지환급률·현재 해지환급금 산출 내역
  나. 유지 시 환급률 회복 추이 안내 자료
  다. 감액완납·납입유예 등 유지 대안 안내 여부
  라. 향후 처리 계획

[유의사항]
  - 민원서류는 본건 처리 목적 외 사용 금지(신용정보법 등)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        금융감독원  보험민원국장  (직인 생략)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      custRaw: "이 보험 오래 유지하면 나중에 많이 돌려받는다고 해서 지금까지 유지했는데, 막상 해지하려니 환급률이 형편없습니다. 오래 부은 게 무슨 소용입니까. 지금 해지하는 것과 계속 두는 것 중 무엇이 나은지 알려 주세요.",
      points: [
        { k: "민원 유형", v: "해지·환급 · 환급률 불만", m: "동일" },
        { k: "가입 상품", v: "장기 저축성/종신", m: "유사" },
        { k: "핵심 쟁점", v: "장기 유지 대비 낮은 환급률", m: "유사" },
        { k: "고객 정보", v: "60대 · 장기 유지 고객", m: "유사" },
        { k: "민원 정황", v: "장기 유지 계약 · 해지 고민", m: "유사" },
      ],
      reply: "장기 유지했는데 환급률이 낮다는 불만 건. 현 시점 해지환급금과 향후 유지 시 환급률 회복 추이를 비교 안내하고, 감액완납·납입유예 등 유지 대안을 제시하여 계약을 유지 전환한 사례.",
      format: [
        { label: "환급/유지 비교 제시", body: "현 시점의 해지환급금과 계약을 유지할 경우 향후 경과기간별로 회복되는 환급률 추이를 비교하여 제시하였습니다." },
        { label: "유지 대안 안내", body: "감액완납·납입유예 등 보험료 부담을 줄이면서 보장을 유지할 수 있는 대안을 안내하였습니다." },
        { label: "해지 손실 고지", body: "해지 시 발생하는 환급 손실과 보장 종료의 영향을 함께 고지하였습니다." },
      ],
      defense: [
        "현 시점 환급금과 향후 경과기간별 환급률 회복 추이를 비교한 표 제시",
        "감액완납·납입유예 등 보장 유지 대안 안내문 첨부",
      ],
      secs: [
        "장기 유지했음에도 해지환급률이 낮다며 불만을 제기함.",
        "현 시점 해지환급금과 향후 경과기간별 환급률 회복 추이를 비교 제시하고, 감액완납·납입유예 등 계약 유지 대안을 안내함. 해지 시 손실 및 보장 종료 영향을 함께 고지함.",
        "자체 조사결과 위규사항은 없으며, 유지 상담 절차를 보완함.",
        "환급률 회복 추이표 및 유지 대안 안내문을 붙임.",
      ],
      cust: "장기간 계약을 유지해 주셔서 감사드립니다. 해지환급률 관련하여 안내드립니다.\n\n현재 해지하실 경우의 환급금과, 계약을 유지하실 경우 향후 회복되는 환급률 추이를 비교하여 동봉하였습니다. 보험료 부담이 있으신 경우 감액완납·납입유예 등으로 보장을 유지하실 수 있으니 함께 검토하여 주시기 바랍니다.",
    },
  ],
}
// ── 민원 유형(생명보험) ── 트랙(이첩/사실조회)이 '문서 종류'를 정하고, 유형은 그 안의 '쟁점·대응 논리'를 정한다.
// 공문에서 자동 추출 + 담당자 확정 → 유형에 따라 패널 우선순위 · 기본 템플릿 · 근거 자료가 바뀐다.
type RightTab = "템플릿" | "사례" | "근거" | "어시스턴트" | "체크"
type CatKey = "부지급" | "불완전판매" | "손해사정" | "계약해지" | "고지의무" | "단순응대"
type Cat = {
  label: string; short: string; desc: string
  focus: RightTab; order: RightTab[]; template: string; dispute: boolean
  timeline: { k: string; at: string; detail: string }[]
  evidenceLabel: string
  evidence: string[]
  clauseLabel: string
  clauses: { id: string; title: string; text: string }[]
  similar: PastCase[]
  reviewPoints: string[]
  required: string[] // 당사가 답변서에 필수로 기재하는 항목(유형별)
}
const CATS: Record<CatKey, Cat> = {
  부지급: {
    label: "보험금 부지급·감액", short: "부지급", desc: "약관 근거로 지급 판단의 정당성을 사실·조항으로 입증 — 검토의견 중심",
    focus: "근거", order: ["근거", "사례", "템플릿", "어시스턴트", "체크"], template: "부지급 안내", dispute: true,
    timeline: [
      { k: "계약", at: "2019-03-12", detail: "무배당 종신보험 가입 · 월 보험료 18만원 · 가입설계 정상" },
      { k: "청구", at: "2026-05-20", detail: "암 진단 보험금 3,000만원 청구 접수(진단서·조직검사 결과 첨부)" },
      { k: "심사", at: "2026-05-28", detail: "약관상 면책 사유 검토 → 부지급 결정 통보" },
      { k: "손해사정", at: "2026-06-02", detail: "손해사정사 의료자문 회신 · 진단 시점 쟁점 확인" },
      { k: "통화", at: "2026-06-10", detail: "민원인 항의 통화 2건 · '금감원 민원' 언급" },
    ],
    evidenceLabel: "제출 증빙 — 지급 심사",
    evidence: ["약관(면책·보상조항) 사본", "청구서·진단서", "손해사정 결과서", "심사·부지급 결정 내역"],
    clauseLabel: "약관·법령 근거",
    clauses: [
      { id: "약관 제12조", title: "보험금 지급사유", text: "회사는 피보험자가 보험기간 중 약관에서 정한 진단확정을 받은 경우 해당 보험금을 지급합니다." },
      { id: "약관 제14조", title: "지급하지 않는 사유(면책)", text: "고의·중대한 과실, 면책기간 내 진단 등 약관에서 정한 사유에 대해서는 보험금을 지급하지 않습니다." },
      { id: "약관 제30조", title: "분쟁의 조정", text: "보험금 지급 등에 관한 분쟁은 금융분쟁조정위원회에 조정을 신청할 수 있습니다." },
    ],
    similar: SIMILAR_BY_TYPE["보험금 지급"],
    reviewPoints: ["적용한 면책 조항이 사실관계와 정확히 대응하는가", "손해사정 결과와 부지급 결정이 일치하는가", "유사 분쟁조정 결론(부지급 유지/일부 지급)과 정합적인가"],
    required: ["청구 내용 및 심사·손해사정 진행 경과", "부지급·감액 사유와 적용 약관 조항(면책)", "재심사 절차 및 금융분쟁조정 신청 안내"],
  },
  불완전판매: {
    label: "불완전판매·모집", short: "불완전판매", desc: "약관 해석이 아닌 모집 과정의 사실 입증 — 모집 증빙 중심 · 톤 조절",
    focus: "근거", order: ["근거", "체크", "사례", "템플릿", "어시스턴트"], template: "불완전판매 회신", dispute: true,
    timeline: [
      { k: "청약", at: "2023-08-14", detail: "변액종신보험 청약 · 월 30만원 · 모집인 OOO" },
      { k: "설명", at: "2023-08-14", detail: "상품설명서·핵심설명서 교부 · 자필서명 확인" },
      { k: "해피콜", at: "2023-08-21", detail: "완전판매 모니터링(해피콜) 정상 완료 · 녹취 보관" },
      { k: "전자서명", at: "2023-08-14", detail: "전자청약 서명·본인인증 기록 보관" },
      { k: "민원", at: "2026-05-30", detail: "설명 미흡 주장 · 청약철회 및 보험료 환급 요구" },
    ],
    evidenceLabel: "제출 증빙 — 모집 적정성",
    evidence: ["청약서·상품설명서", "완전판매 모니터링(해피콜) 녹취", "전자서명·자필서명 기록", "적합성·적정성 진단 결과"],
    clauseLabel: "법령 근거 — 모집·설명",
    clauses: [
      { id: "보험업법 제95조의2", title: "설명의무", text: "보험회사는 계약 체결 시 보험료·보장내용 등 중요사항을 일반금융소비자가 이해할 수 있도록 설명하여야 합니다." },
      { id: "보험업법 제97조", title: "부당권유 금지", text: "보험계약의 체결 또는 모집에 종사하는 자는 부당하게 계약을 권유하거나 중요사항을 누락·왜곡하여서는 아니 됩니다." },
      { id: "약관 제16조", title: "청약의 철회", text: "계약자는 청약일로부터 일정 기간 내에 청약을 철회할 수 있으며, 회사는 납입 보험료를 반환합니다." },
    ],
    similar: SIMILAR_BY_TYPE["불완전판매"],
    reviewPoints: ["설명의무 이행을 녹취·서명으로 입증할 수 있는가", "자필/전자서명·청약서 누락이 없는가", "회사 안내 미흡분만 한정 인정하고 과도한 책임 표현은 배제했는가(톤 조절)"],
    required: ["가입 경위 및 모집 과정 사실관계", "설명의무 이행 입증(상품설명서·해피콜·서명)", "청약철회·보상 가능 여부 및 조치 내용"],
  },
  손해사정: {
    label: "손해사정 절차", short: "손해사정", desc: "결과보다 '절차를 제대로 밟았는가' — 진행 일자·통보 내역 타임라인 중심",
    focus: "근거", order: ["근거", "사례", "템플릿", "어시스턴트", "체크"], template: "기본", dispute: false,
    timeline: [
      { k: "청구", at: "2026-04-10", detail: "후유장해 보험금 청구 접수" },
      { k: "착수", at: "2026-04-12", detail: "손해사정 착수 통보 발송(접수 2일 내)" },
      { k: "보완요청", at: "2026-04-25", detail: "추가 의무기록 보완 요청 공문 발송" },
      { k: "보완접수", at: "2026-05-08", detail: "민원인 보완 자료 접수" },
      { k: "결과통보", at: "2026-05-20", detail: "손해사정 결과 통보(장해지급률 확정·지급 결정)" },
    ],
    evidenceLabel: "제출 증빙 — 절차 입증",
    evidence: ["손해사정 착수 통보 내역", "자료 보완 요청 공문", "손해사정 결과서", "독립 손해사정사 선임 안내"],
    clauseLabel: "법령·규정 근거 — 손해사정",
    clauses: [
      { id: "보험업법 제185조", title: "손해사정사", text: "보험회사는 손해사정사를 고용하거나 손해사정업자에게 위탁하여 손해사정을 하게 하여야 합니다." },
      { id: "감독규정 §9-16", title: "손해사정 절차·통보", text: "손해사정 착수·자료 보완 요청·결과는 지체 없이 문서로 통보하여야 합니다." },
      { id: "금소법 제19조", title: "설명·통보 의무", text: "금융상품판매업자등은 처리 경과 및 결과를 소비자가 이해할 수 있도록 통보하여야 합니다." },
    ],
    similar: [
      { sim: 89, id: "C-2025-0712", title: "손해사정 지연 민원", result: "절차 적법 확인·종결", reply: "청구 접수일·사정 착수일·결과 통보일이 규정 기한 내였음을 통보 내역으로 확인하여 안내드렸습니다." },
      { sim: 81, id: "C-2024-1990", title: "독립 손해사정사 선임 요청", result: "선임 안내·절차 진행", reply: "피보험자의 독립 손해사정사 선임권을 안내하고 관련 절차를 진행하였습니다." },
    ],
    reviewPoints: ["접수→착수→통보 일자가 규정 기한 내인가", "자료 보완 요청·결과 통보가 문서로 입증되는가", "독립 손해사정사 선임 안내가 이뤄졌는가"],
    required: ["손해사정 진행 일자(접수·착수·통보)", "자료 보완 요청 및 결과 통보 내역", "독립 손해사정사 선임권 안내"],
  },
  계약해지: {
    label: "계약 유지·해지·환급", short: "해지·환급", desc: "약관상 산출 기준·계약 상태를 정확한 수치로 안내 — 빠른 회신 중심",
    focus: "템플릿", order: ["템플릿", "근거", "사례", "어시스턴트", "체크"], template: "환급금 안내", dispute: false,
    timeline: [
      { k: "계약", at: "2015-06-01", detail: "종신보험 체결 · 월 보험료 12만원" },
      { k: "신청", at: "2026-06-01", detail: "해지 신청 접수(또는 환급금 문의)" },
      { k: "산출", at: "2026-06-02", detail: "경과기간별 해지환급률 적용 → 해지환급금 산출" },
      { k: "안내", at: "2026-06-03", detail: "해지환급금·계약 상태 안내" },
    ],
    evidenceLabel: "제출 증빙 — 계약·산출",
    evidence: ["해지환급금 산출 내역", "계약 상태·납입 내역", "약관 해지환급률 표"],
    clauseLabel: "약관·법령 근거",
    clauses: [
      { id: "약관 제35조", title: "해지환급금", text: "계약이 해지된 경우 회사는 약관에서 정한 해지환급금을 계약자에게 지급합니다." },
      { id: "약관 제27조", title: "보험계약의 부활", text: "해지된 계약은 약관에서 정한 기간·요건을 충족하면 부활(효력 회복)을 청약할 수 있습니다." },
      { id: "보험업법 §", title: "해약환급금 산출", text: "해약환급금은 책임준비금 등을 기준으로 산출기준에 따라 계산합니다." },
    ],
    similar: SIMILAR_BY_TYPE["해지·환급"],
    reviewPoints: ["경과기간별 해지환급률 적용·산출이 정확한가", "계약 상태·납입 내역이 일치하는가", "수치·기준을 알기 쉽게 안내했는가"],
    required: ["해지환급금 산출 기준(경과기간별 해지환급률)", "계약 상태 및 납입 내역", "환급·정정 절차 안내"],
  },
  고지의무: {
    label: "고지의무·면책 분쟁", short: "고지의무", desc: "법적 다툼 소지 큼 — 판례·분쟁조정 사례 의존도 최상",
    focus: "사례", order: ["사례", "근거", "템플릿", "어시스턴트", "체크"], template: "기본", dispute: true,
    timeline: [
      { k: "계약", at: "2024-02-10", detail: "계약 체결 · 계약 전 알릴 의무(고지) 작성" },
      { k: "사고", at: "2026-03-15", detail: "질병 진단 · 보험금 청구 접수" },
      { k: "조사", at: "2026-03-28", detail: "과거 진료이력 조사 · 고지의무 위반 정황 확인" },
      { k: "해지", at: "2026-04-05", detail: "고지의무 위반으로 계약 해지·부지급 통보" },
      { k: "민원", at: "2026-05-10", detail: "해지 부당 주장 · 금감원 분쟁조정 신청" },
    ],
    evidenceLabel: "제출 증빙 — 고지·인과관계",
    evidence: ["청약서 고지사항(계약 전 알릴 의무)", "과거 진료·의무기록", "고지의무 위반 입증자료", "해지·부지급 통보 내역"],
    clauseLabel: "법령·판례 근거",
    clauses: [
      { id: "상법 제651조", title: "고지의무 위반으로 인한 계약해지", text: "보험계약자 등이 고의 또는 중대한 과실로 중요한 사항을 고지하지 아니한 때 회사는 계약을 해지할 수 있습니다." },
      { id: "상법 제655조", title: "계약해지와 보험금청구권", text: "고지의무 위반 사실이 보험사고 발생에 영향을 미치지 아니하였음이 증명된 경우 보험금을 지급합니다(인과관계)." },
      { id: "약관 제13조", title: "계약 전 알릴 의무", text: "계약자·피보험자는 청약 시 청약서에서 질문한 중요한 사항을 사실대로 알려야 합니다." },
      { id: "대법원 판례", title: "고지의무 인과관계", text: "고지의무 위반과 보험사고 사이 인과관계가 부정되면 보험금 지급의무가 인정된다(2019다○○○○○)." },
    ],
    similar: [
      { sim: 92, id: "C-2025-0455", title: "고지의무 위반 계약 해지 불복", result: "해지 유지·분쟁조정 기각", reply: "과거 진료 이력이 계약 전 알릴 의무 사항에 해당하고 보험사고와 인과관계가 인정되어 해지가 정당함을 판례·약관으로 소명하였습니다." },
      { sim: 85, id: "C-2024-2087", title: "고지의무 인과관계 다툼", result: "인과관계 부정·보험금 지급", reply: "고지의무 위반 사실은 인정되나 보험사고와의 인과관계가 부정되어(상법 제655조) 보험금을 지급하였습니다." },
    ],
    reviewPoints: ["고지의무 위반과 보험사고 간 인과관계가 입증되는가(상법 제655조)", "제척기간 내 해지권을 적법하게 행사했는가", "유사 판례·분쟁조정 결론과 부합하는가"],
    required: ["고지의무 위반 사실 및 보험사고와의 인과관계", "적용 약관·상법 조항 및 해지·부지급 통보 내역", "분쟁조정·이의 제기 절차 안내"],
  },
  단순응대: {
    label: "응대·처리 지연 등 단순 민원", short: "단순응대", desc: "정형·경미 — 템플릿 기반 빠른 회신이 가장 효과적",
    focus: "템플릿", order: ["템플릿", "사례", "어시스턴트", "근거", "체크"], template: "응대 사과", dispute: false,
    timeline: [
      { k: "문의", at: "2026-06-05", detail: "보험금 청구 진행 문의 인바운드 콜 접수(상담 5분 12초)" },
      { k: "응대", at: "2026-06-05", detail: "1차 상담사 안내 · 추가 확인 후 콜백 약속" },
      { k: "지연", at: "2026-06-09", detail: "약속한 콜백 미이행 · 재문의 시 상담사 변경으로 안내 상이" },
      { k: "민원", at: "2026-06-12", detail: "응대 지연·태도 불만으로 금감원 이첩 민원 접수" },
    ],
    evidenceLabel: "제출 증빙 — 응대 경과",
    evidence: ["상담 녹취·이력", "처리 경과 기록"],
    clauseLabel: "내규·법령 근거",
    clauses: [
      { id: "금소법 제28조", title: "자료열람·민원처리", text: "금융상품판매업자등은 소비자의 민원을 신속·공정하게 처리하고 결과를 통보하여야 합니다." },
      { id: "민원처리 운영규정", title: "회신 기한", text: "접수된 민원은 표준 처리기한 내에 회신하며, 지연 시 중간 통보합니다." },
    ],
    similar: [
      { sim: 88, id: "C-2026-0102", title: "회신 지연 불만", result: "사과·신속 회신 종결", reply: "회신이 지연된 점을 사과드리고 처리 경과를 안내드린 뒤 신속히 종결하였습니다." },
      { sim: 80, id: "C-2026-0066", title: "응대 태도 불만", result: "사과·재발방지 교육", reply: "응대 과정의 불편에 사과드리고 담당자 교육 등 재발 방지 조치를 안내드렸습니다." },
    ],
    reviewPoints: ["불편을 끼친 사실관계가 확인되는가", "사과·재발방지 조치가 포함됐는가", "신속 회신 기한을 지켰는가"],
    required: ["불편 사실관계 확인 및 사과", "처리 경과 및 결과 안내", "재발 방지 조치"],
  },
}
// 분류 보정 — 규칙만으로 어긋나는 건을 케이스 단위로 고정(데이터 정합성)
const CAT_OVERRIDE: Record<string, CatKey> = { "VOC-260616-008": "단순응대" } // 수익자 변경 '처리 지연' 건 → 단순응대
function catOf(v: VoC): CatKey {
  if (CAT_OVERRIDE[v.id]) return CAT_OVERRIDE[v.id]
  const s = `${v.vocType} ${v.summary} ${v.keywords.join(" ")}`
  if (/불완전판매|설명\s*의무|설명\s*미흡|부당\s*권유|청약\s*철회|모집|해피콜/.test(s)) return "불완전판매"
  if (/고지\s*의무|고지\s*위반|알릴\s*의무|계약\s*전\s*알릴/.test(s)) return "고지의무"
  if (/손해사정|사정\s*지연|사정\s*절차|손사/.test(s)) return "손해사정"
  if (/부지급|지급\s*거절|감액|보험금/.test(s)) return "부지급"
  if (/해지|환급|부활|납입|수금|계약\s*유지|계약\s*변경/.test(s)) return "계약해지"
  return "단순응대"
}
const recoFor = (v: VoC) => CATS[catOf(v)].template

// ── 금감원 제출 답변 서식 ── 처리 구분이 서식을 결정(실제 표준 서식 A/B를 보험 기준으로 구성)
//  서식 A = 사실조회 답변서(7개 항목) · 서식 B = 분쟁조정·자율조정 답변서(4개 항목)
const FSS_FORM_A = {
  code: "A", name: "사실조회 답변서",
  sections: [
    "제3자 여부·소송 관련 사항·긴급처리 요부",
    "민원인 주장 요지",
    "동일·유사 민원 중복 접수 여부",
    "민원인 주장·요구에 대한 당사 자체 조사결과(사실관계)",
    "자체 조사결과 발견된 임직원의 위규·위법 사항",
    "동 민원에 대한 당사 의견 및 향후 처리방안",
    "기타 동 민원 관련 참고사항",
  ],
}
const FSS_FORM_B = {
  code: "B", name: "분쟁조정·자율조정 답변서",
  sections: [
    "민원인 주장 요지",
    "피신청인(당사) 답변(향후 처리방향 포함) 및 소명자료",
    "피신청인 자체 조사결과 및 위규사항에 대한 조치",
    "기타 동 민원 관련 참고사항",
  ],
}
const FSS_FORM_C = {
  code: "C", name: "처리결과 보고서",
  sections: [
    "민원 처리 결과 요지",
    "민원인 회신 일자 및 회신 방법",
    "처리 경위 및 조치 내용",
    "재발 방지 및 향후 계획",
  ],
}
const fssForm = (kind: FssKind) => (kind === "사실조회" ? FSS_FORM_A : kind === "이첩" ? FSS_FORM_C : FSS_FORM_B)
// 처리 구분별 답변 절차 가이드 — 담당자가 무엇을, 어떤 순서로 처리해야 하는지
const PROC_GUIDE: Record<FssKind, { doc: string; steps: string[]; note: string }> = {
  이첩: { doc: "민원인 회신문(+ 처리결과 보고)", steps: ["민원인에게 직접 회신문 작성·발송", "처리결과를 회신기한(접수 14일) 내 금감원 보고"], note: "약관상 기준·계약 상태를 민원인이 이해하도록 쉽게 안내" },
  자율조정: { doc: "자율조정 결과 보고서(서식 B)", steps: ["민원인과 자율조정 시도", "성립 시 조정 결과 보고 · 불성립 시 사실조회 답변서 제출"], note: "조정 가능 범위와 회사 입장을 균형 있게 제시" },
  사실조회: { doc: "사실조회 답변서(서식 A·7개 항목)", steps: ["서식 A 항목별 사실관계·근거 작성", "금감원 회신시스템 전자회신 + 증빙(약관·심사·손해사정) 첨부"], note: "적용 약관 조항과 처리 경위를 항목별로 입증" },
  직접처리: { doc: "제출 문서 없음", steps: ["금감원이 자체 처리·종결 — 회사 제출 문서 없음"], note: "" },
}
// 사실관계 이벤트별 데이터 출처(소스 시스템)·유형 — 정형(자동 조회) / 문서(원본 링크) / 녹취(STT·확인필요)
type FactType = "정형" | "문서" | "녹취"
const FACT_META: Record<string, { src: string; type: FactType }> = {
  계약: { src: "계약원장", type: "정형" }, 청약: { src: "청약·모집", type: "정형" }, 설명: { src: "청약·모집", type: "문서" },
  해피콜: { src: "완전판매 모니터링", type: "녹취" }, 전자서명: { src: "전자청약", type: "정형" },
  청구: { src: "청구·심사", type: "정형" }, 심사: { src: "청구·심사", type: "정형" }, 사고: { src: "청구·심사", type: "정형" }, 조사: { src: "청구·심사", type: "정형" },
  손해사정: { src: "손해사정", type: "문서" }, 착수: { src: "손해사정", type: "정형" }, 보완요청: { src: "손해사정", type: "정형" }, 보완접수: { src: "손해사정", type: "정형" }, 결과통보: { src: "손해사정", type: "문서" },
  통화: { src: "콜센터·CRM", type: "녹취" }, 응대: { src: "콜센터·CRM", type: "녹취" }, 문의: { src: "콜센터·CRM", type: "녹취" }, 지연: { src: "콜센터·CRM", type: "정형" }, 안내: { src: "콜센터·CRM", type: "정형" },
  민원: { src: "민원접수", type: "문서" }, 해지: { src: "계약원장", type: "정형" }, 신청: { src: "계약원장", type: "정형" }, 산출: { src: "계약원장", type: "정형" },
}
const factMeta = (k: string): { src: string; type: FactType } => FACT_META[k] ?? { src: "코어 시스템", type: "정형" }
const FACT_TYPE_STYLE: Record<FactType, { label: string; cls: string }> = {
  정형: { label: "정형 조회", cls: "text-[#0f766e]" },
  문서: { label: "문서 · 원본", cls: "text-[#0b4f91]" },
  녹취: { label: "녹취 · STT 확인", cls: "text-[#8995a6]" },
}
// 약관 전문(PDF) 목업 — 상담사가 작성 시 참고하는 약관 원문 문서
const YAKGWAN: { a: string; t: string; b: string }[] = [
  { a: "제1조", t: "목적", b: "이 약관은 계약자와 회사가 보험계약을 체결함에 있어 상호 간의 권리와 의무에 관한 사항을 정함을 목적으로 합니다." },
  { a: "제2조", t: "용어의 정의", b: "이 약관에서 사용하는 주요 용어의 정의는 다음과 같습니다. ① '계약자'란 회사와 계약을 체결하고 보험료를 납입할 의무를 지는 사람을 말합니다. ② '피보험자'란 보험사고 발생의 객체가 되는 사람을 말합니다. ③ '보험수익자'란 보험금의 지급을 받는 사람을 말합니다." },
  { a: "제12조", t: "보험금의 지급사유", b: "회사는 피보험자가 보험기간 중 이 약관에서 정한 진단확정을 받거나 보험사고가 발생한 경우 보험수익자에게 약정한 보험금을 지급합니다." },
  { a: "제13조", t: "계약 전 알릴 의무", b: "계약자 또는 피보험자는 청약 시 청약서에서 질문한 중요한 사항에 대하여 알고 있는 사실을 사실대로 알려야 합니다. 이를 위반한 경우 회사는 법령 및 약관에서 정한 바에 따라 계약을 해지할 수 있습니다." },
  { a: "제14조", t: "보험금을 지급하지 않는 사유(면책)", b: "회사는 다음 중 어느 하나에 해당하는 사유로 보험금 지급사유가 발생한 때에는 보험금을 지급하지 않습니다. ① 피보험자가 고의로 자신을 해친 경우 ② 계약자가 고의로 피보험자를 해친 경우 ③ 면책기간 내에 진단확정된 경우 등 이 약관에서 정한 사유에 해당하는 경우." },
  { a: "제16조", t: "청약의 철회", b: "계약자는 보험증권을 받은 날부터 15일 이내(통신판매계약은 30일 이내)에 청약을 철회할 수 있으며, 회사는 청약철회를 접수한 날부터 3영업일 이내에 이미 납입한 보험료를 반환합니다." },
  { a: "제30조", t: "분쟁의 조정", b: "계약에 관하여 분쟁이 있는 경우 계약자, 피보험자 또는 보험수익자는 금융감독원장에게 조정을 신청할 수 있습니다." },
  { a: "제35조", t: "해지환급금", b: "계약이 해지된 경우 회사는 경과기간별 해지환급률에 따라 산출한 해지환급금을 계약자에게 지급합니다. 해지환급금은 납입한 보험료에서 계약의 체결·유지·관리에 소요된 비용(사업비) 등을 차감하여 산출되므로 이미 납입한 보험료보다 적거나 없을 수 있습니다." },
]
// 문서형 원천(PDF) 목업 — 상담사 작성 참고용 전체 문서
type PdfBlock = { h: string; b?: string; table?: { cols: string[]; rows: string[][] } }
const pdfDoc = (kind: string, product: string): { title: string; org: string; blocks: PdfBlock[] } => {
  if (kind === "손해사정서") return {
    title: "손해사정 결과 보고서", org: "한울손해사정법인 (위탁)",
    blocks: [
      { h: "1. 손해사정 개요", b: "사정번호 LA-2026-01187 · 청구 담보: 암진단보험금 · 청구금액: 30,000,000원 · 착수 통보일: 2026-04-12 · 자료 보완요청: 2026-04-25 · 결과 통보일: 2026-05-20." },
      { h: "2. 사실관계 및 의학적 소견", b: "청구 시 제출된 진단서 및 조직검사 결과를 검토하고 전문의 의료자문을 시행하였음. 진단확정 시점 및 발병 추정 시기에 대한 자문 결과를 종합함." },
      { h: "3. 약관상 검토", b: "약관 제12조(보험금 지급사유) 및 제14조(보험금을 지급하지 않는 사유)의 적용 여부를 검토함. 계약 전 발병이 의심되는 정황에 따라 면책 조항 해당 여부를 판단함." },
      { h: "4. 손해사정 결론", b: "상기 검토 결과 본 건은 약관 제14조의 면책 사유에 해당하는 것으로 사정함. 최종 지급·부지급 결정은 회사의 심사 절차에 따름." },
    ],
  }
  if (kind === "해지환급금 산출 명세서") return {
    title: "해지환급금 산출 명세서", org: "제논라이프생명보험(주) · 계약관리부",
    blocks: [
      { h: "1. 계약 정보", b: `상품명: ${product} · 계약일: 2015-06-01 · 해지 신청일: 2026-06-01 · 경과기간: 11년 0개월 · 납입 상태: 정상(완납)` },
      { h: "2. 납입 내역", b: "월 보험료: 120,000원 · 총 납입: 120회 · 납입원금 합계: 14,400,000원" },
      { h: "3. 해지환급금 산출", b: "적립부분 책임준비금: 14,400,000원\n(-) 해지공제(미상각 신계약비 등 사업비): 3,168,000원\n(=) 해지환급금: 11,232,000원  ·  해지환급률: 78.0%" },
      { h: "4. 산출 근거 및 안내", b: "해지환급금은 경과기간별 해지환급률에 따라 산출되며, 계약 초기에 집중되는 신계약비(사업비) 공제로 인해 납입원금보다 적을 수 있습니다. 산출 기준은 약관 제35조(해지환급금)에 따릅니다." },
    ],
  }
  if (kind === "상품설명서") return {
    title: `${product} 상품설명서`, org: "제논라이프생명보험(주)",
    blocks: [
      { h: "1. 상품 개요", b: "본 상품은 피보험자의 사망·진단 등 약관에서 정한 보험사고 발생 시 약정한 보험금을 지급하는 보장성 보험입니다." },
      { h: "2. 주요 보장 내용", b: "주계약 및 특약에서 정한 진단·입원·사망 등 보장 항목과 지급 사유를 안내합니다. 구체적 보장 범위는 약관에 따릅니다." },
      { h: "3. 보험료 및 납입", b: "보험료는 가입 시점의 연령·성별·보장내용에 따라 산출되며, 약정한 납입기간 동안 납입합니다." },
      { h: "4. 해지환급금", b: "계약을 중도 해지하는 경우 경과기간별 해지환급률에 따라 해지환급금이 지급되며, 사업비 차감으로 납입한 보험료보다 적을 수 있습니다." },
      { h: "5. 청약철회 및 유의사항", b: "보험증권을 받은 날부터 15일(통신판매 30일) 이내 청약을 철회할 수 있습니다. 변액보험 등 실적배당형 상품은 운용 실적에 따라 원금 손실이 발생할 수 있습니다." },
    ],
  }
  return { title: `${product} 약관`, org: "제논라이프생명보험(주)", blocks: YAKGWAN.map((y) => ({ h: `${y.a}(${y.t})`, b: y.b })) }
}
// 답변서에 첨부하는 소명 표(legal_references와 함께 항목에 인용) — 유형별 대표 표
const CAT_TABLE: Record<CatKey, { title: string; rows: [string, string][] }> = {
  부지급: { title: "보험금 심사·손해사정 결과", rows: [["청구 보험금", "암진단보험금 30,000,000원"], ["손해사정 결과", "약관상 면책 사유 해당"], ["적용 조항", "약관 제14조(면책)"], ["부지급 결정일", "2026-05-28"]] },
  불완전판매: { title: "모집 적정성 점검 결과", rows: [["상품설명서·핵심설명서 교부", "완료(자필서명 확인)"], ["적합성·적정성 진단", "완료"], ["완전판매 모니터링(해피콜)", "정상 완료 · 녹취 보관"], ["전자서명 기록", "보관"]] },
  손해사정: { title: "손해사정 절차 진행 내역", rows: [["청구 접수", "2026-04-10"], ["손해사정 착수 통보", "2026-04-12"], ["자료 보완 요청", "2026-04-25"], ["손해사정 결과 통보", "2026-05-20"]] },
  계약해지: { title: "해지환급금 산출 내역", rows: [["납입 원금", "14,400,000원"], ["경과기간", "10년(120회 완납)"], ["사업비 공제", "3,168,000원"], ["적용 해지환급률", "78.0%"], ["해지환급금", "11,232,000원"]] },
  고지의무: { title: "고지의무 위반·인과관계 판단", rows: [["계약 전 알릴의무 위반", "고혈압 치료력 미고지"], ["보험사고", "뇌출혈"], ["인과관계", "인정(상법 제655조)"], ["당사 조치", "계약 해지·부지급"]] },
  단순응대: { title: "민원 응대 경과", rows: [["최초 문의", "2026-06-05"], ["콜백 약속", "2026-06-05"], ["콜백 누락", "2026-06-09"], ["민원 접수", "2026-06-12"]] },
}
// 유형별 민원인 회신 안내 — 번호 없이 정중한 서신체(절차를 따르되 고객에게 답변하는 톤)
const CAT_CUSTGUIDE: Record<CatKey, string> = {
  부지급: "고객님께서 청구하신 보험금에 대하여 손해사정과 약관 검토를 진행한 결과, 약관상 보험금을 지급하지 않는 사유(면책)에 해당하여 부득이 부지급으로 결정되었음을 알려드립니다. 청구 접수부터 심사·손해사정 진행 경과와 적용 약관 조항은 아래와 같으며, 본 결정에 이견이 있으신 경우 재심사 청구 또는 금융감독원 금융분쟁조정을 신청하실 수 있습니다.",
  불완전판매: "가입 당시의 상품설명서 교부, 자필(전자)서명, 완전판매 모니터링(해피콜) 기록을 통해 모집 과정의 적정성을 확인하였습니다. 확인 결과를 아래와 같이 안내드리며, 설명이 미흡했던 부분이 확인되는 경우 청약철회 및 납입보험료 환급 등 필요한 조치를 안내드리겠습니다.",
  손해사정: "고객님의 보험금 청구 건에 대한 손해사정 진행 경과(접수·착수·자료 보완·결과 통보)와 향후 절차를 아래와 같이 안내드립니다. 진행 과정에서 추가로 필요한 자료가 있는 경우 별도로 안내드리겠습니다.",
  계약해지: "해지환급금은 경과기간별 해지환급률에 따라 산출되며, 계약 초기에 집중되는 사업비(신계약비) 공제로 인해 납입하신 보험료보다 적을 수 있습니다. 고객님 계약의 해지환급금 산출 내역과 계약 상태를 아래와 같이 안내드립니다.",
  고지의무: "계약 전 알릴 의무 위반 여부와 보험사고와의 인과관계를 검토한 결과 및 그에 따른 처리 내용을 아래와 같이 안내드립니다. 본 결정에 이견이 있으신 경우 금융감독원 금융분쟁조정을 신청하실 수 있습니다.",
  단순응대: "상담 응대 과정에서 불편을 드린 점 진심으로 사과드립니다. 응대 경위를 확인하였으며, 동일한 일이 재발하지 않도록 상담 절차 보완과 담당자 교육 등 재발 방지 조치를 시행하였음을 알려드립니다.",
}
const renderTable = (t: { title: string; rows: [string, string][] }) => `   〔${t.title}〕\n` + t.rows.map((r) => `     · ${r[0]}: ${r[1]}`).join("\n")
const companyDocNo = (id: string) => `제논라이프 제 2026-${String(((s: string) => { let n = 0; for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0; return n })(id) % 9000 + 1000).padStart(4, "0")}호`
// 대외기관(금감원) 접수 메타 — 접수 시각 / 처리 기한(D-day) 결정적 산출
const fssHash = (s: string) => { let n = 0; for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0; return n }
const INTAKE_TIMES = ["오늘 09:12", "오늘 10:35", "오늘 11:48", "어제 16:20", "어제 14:05", "2일 전 15:30"]
const isFssCase = (v: VoC) => v.channel === "대외기관 민원" || v.triggers.some((t) => /금감원|분쟁조정|감독원|법적|소송/.test(t))
// 금감원 처리 구분 — 이첩(회사가 민원인에 직접 회신) / 사실조회(금감원에 답변서·자료 제출) / 직접처리(회사 문서 불요)
type FssKind = "이첩" | "사실조회" | "직접처리" | "자율조정"
// 금감원 의뢰 종류(fss_req_kind) → 내부 처리 구분
const reqKindToFss = (k: string): FssKind => /자율조정/.test(k) ? "자율조정" : /사실조회/.test(k) ? "사실조회" : /직접/.test(k) ? "직접처리" : "이첩"
// 트랙은 유형(쟁점)과 상관관계가 있다 — 단순응대는 이첩, 불완전판매는 사실조회, 부지급/고지의무는 다툼이 크다.
function fssKind(v: VoC): FssKind {
  const n = fssHash(v.id); const c = catOf(v)
  if (c === "단순응대") return "이첩"
  if (c === "계약해지") return n % 5 === 0 ? "직접처리" : "이첩"
  if (c === "불완전판매") return "사실조회"
  if (c === "부지급" || c === "고지의무") return n % 2 === 0 ? "사실조회" : "이첩"
  if (c === "손해사정") return n % 2 === 0 ? "사실조회" : "이첩"
  return n % 9 === 0 ? "직접처리" : n % 3 === 0 ? "사실조회" : "이첩"
}
// 민원 성격 — 일반민원(단순 불만·질의, 약 2주) / 분쟁민원(지급 거절 등 다툼, 두세 달)
type FssTrack = "일반민원" | "분쟁민원"
function fssTrack(v: VoC): FssTrack { return CATS[catOf(v)].dispute || v.risk === "매우높음" ? "분쟁민원" : "일반민원" }
const NOW_YMD = "2026-06-24" // 데모 기준일
const ddayTo = (deadline: string) => Math.round((new Date(deadline).getTime() - new Date(NOW_YMD).getTime()) / 86400000)
function intakeMeta(v: VoC) {
  const n = fssHash(v.id); const track = fssTrack(v)
  const fd = FSS_DETAIL[v.id]
  if (fd) {
    // 실제 금감원 접수 원문이 있는 건 — 공문 메타를 그대로 사용
    const dday = fd.ymdDeadline ? ddayTo(fd.ymdDeadline) : (track === "분쟁민원" ? 22 + (n % 45) : 1 + (n % 6))
    return { at: fmtYmd(fd.ymdRecv), dday, isNew: fmtYmd(fd.ymdRecv) === NOW_YMD.replace(/-/g, "."), fss: true, kind: reqKindToFss(fd.reqKind), track, no: fd.noRecv, mwNo: fd.idMinwon ?? `MW-${(n % 900000) + 100000}`, reminwon: fd.reminwon, detail: fd }
  }
  const kind = fssKind(v)
  const dday = track === "분쟁민원" ? 22 + (n % 45) : 1 + (n % 6) // 분쟁민원은 처리기한이 길다(평균 ~80일)
  const no = `2026-${(n % 90000) + 10000}` // 금감원 민원 접수번호
  const at = INTAKE_TIMES[n % INTAKE_TIMES.length]
  // 사내 민원관리번호(id_minwon) — 결정적 생성, 재민원 여부도 해시로 소수만 재민원 처리
  const mwNo = `MW2026${String((n % 1200) + 100).padStart(4, "0").slice(0, 2)}${String((n % 28) + 1).padStart(2, "0")}-${String((n % 900000) + 100000)}`
  return { at, dday, isNew: at.startsWith("오늘"), fss: isFssCase(v), kind, track, no, mwNo, reminwon: n % 7 === 0 ? "재민원" : "원민원", detail: undefined as FssDetail | undefined }
}
// 진행 단계 — 처리 구분/성격에 따른 흐름
function fssStages(kind: FssKind, track: FssTrack): string[] {
  if (kind === "직접처리") return ["접수", "금감원 직접 처리", "종결"]
  if (kind === "자율조정") return ["접수", "자율조정 의뢰", "자율조정 시도", "결과 보고", "종결"]
  const mid = kind === "사실조회" ? "사실조회 요청" : "이첩"
  const resolve = track === "분쟁민원" ? "분쟁조정 회부" : "자율조정"
  return ["접수", mid, "회사 답변", resolve, "종결"]
}
const DOC_SECTIONS = ["민원 요지", "사실관계", "검토 의견", "처리 내용", "첨부 자료"]
const BANNED = ["무조건", "절대", "책임 없", "걱정 마"]
// 처리 구분 태그 — 각진 보수적 스타일(좌측 단색 액센트 + 명칭)
const KIND_TONE: Record<FssKind, string> = { 이첩: "#5b6b80", 자율조정: "#2f5a8f", 사실조회: "#1f3a5f", 직접처리: "#94a3b8" }
function KindTag({ kind, className }: { kind: FssKind; className?: string }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-[2px] border border-l-[3px] border-[#c4cedd] bg-[#fafbfd] px-1.5 py-[3px] text-[9px] font-semibold leading-none tracking-tight text-[#2b3a4f]", className)} style={{ borderLeftColor: KIND_TONE[kind] }}>{kind}</span>
}
// 민원 미선택 시 — 선택 후 레이아웃 골격은 유지하고 내용만 비운 플레이스홀더 컬럼
function EmptyPane({ side, cls, label }: { side: "l" | "r"; cls: string; label: string; lines?: number[] }) {
  return (
    <aside className={cn("flex flex-col bg-white", side === "l" ? "border-r" : "border-l", "border-[#dbe5f1]", cls)}>
      <div className="flex h-[38px] shrink-0 items-center border-b border-[#eef2f7] px-3"><span className="text-[10.5px] font-bold text-[#33445c]">{label}</span></div>
      <div className="relative min-h-0 flex-1 p-3">
        <div className="h-full rounded-lg border border-dashed border-[#dbe5f1] bg-[#fbfcfe]" />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
          <Inbox className="h-6 w-6 text-[#cbd5e1]" />
          <div className="text-[10.5px] leading-relaxed">좌측 <b className="text-[#94a3b8]">금감원 접수함</b>에서<br />민원을 선택하면 표시됩니다</div>
        </div>
      </div>
    </aside>
  )
}

export function ReplyTab({ vocId, fssOnly }: { vocId?: string; fssOnly?: boolean } = {}) {
  const sp = useSearchParams()
  // 금감원 접수 원문이 준비된 건만 처리 가능 — 준비된 건을 상단으로, 나머지는 비활성
  const isReady = (v: VoC) => !!FSS_DETAIL[v.id]
  const cases = [...VOCS].filter((v) => !fssOnly || isFssCase(v)).sort((a, b) => (isReady(b) ? 1 : 0) - (isReady(a) ? 1 : 0) || intakeMeta(a).dday - intakeMeta(b).dday || b.score - a.score)
  const vocParam = vocId ?? sp.get("voc")
  const init = vocParam && VOCS.some((v) => v.id === vocParam) ? vocParam : null
  const [sel, setSel] = useState<string | null>(init)
  const [done, setDone] = useState<Record<string, boolean>>({})
  const d = VOCS.find((v) => v.id === sel) ?? cases[0]
  // 민원 유형 — 공문 자동 추출(catOf) + 담당자 확정(override) → 패널 우선순위·템플릿·근거를 결정
  const [catOverride, setCatOverride] = useState<Record<string, CatKey>>({})
  const catKey = catOverride[d.id] ?? catOf(d)
  const cat = CATS[catKey]
  const [tplKey, setTplKey] = useState(init ? recoFor(VOCS.find((v) => v.id === init)!) : "기본")
  const [q, setQ] = useState("")
  const [qc, setQc] = useState("")
  const [mode, setMode] = useState<"fss" | "customer">("fss") // 항상 금감원 회신 탭을 기본으로
  const [showDoc, setShowDoc] = useState(!!(init && FSS_DETAIL[init])) // 금감원 공문·민원인 신청 원문 모달 — 건 선택 시 기본 노출
  const [openSrc, setOpenSrc] = useState<string | null>(null) // 사실관계 원천 시스템 조회 뷰어
  const [openPdf, setOpenPdf] = useState<{ kind: string; title: string; org: string; blocks: PdfBlock[]; hi?: string; demo?: boolean } | null>(null) // 문서형 PDF 뷰어
  // 실사례 상세 목업: 도경민(부지급)·손해사정서 / 임세라(해지환급)·해지환급금 산출 명세서. 그 외는 데모용 목업 명시.
  const isRealistic = (kind: string) => (d.id === "VOC-260616-205" && kind === "손해사정서") || (d.id === "VOC-260616-209" && kind === "해지환급금 산출 명세서")
  const openDocPdf = (kind: string) => setOpenPdf({ kind, demo: !isRealistic(kind), ...pdfDoc(kind, km?.detail?.product ?? "무배당 보험") })
  // 금감원 제출 증빙 서류 — 클릭 시 해당 첨부 파일(PDF) 열람
  const openEvidence = (item: string) => {
    const prod = km?.detail?.product ?? "무배당 보험"; const pno = km?.detail?.policyNo ?? "—"; const cust = d.customer
    // 기존 문서 매핑
    if (/약관/.test(item) && !/환급률/.test(item)) return setOpenPdf({ kind: "약관", demo: true, ...pdfDoc("약관", prod) })
    if (/손해사정/.test(item)) return setOpenPdf({ kind: "손해사정서", demo: !isRealistic("손해사정서"), ...pdfDoc("손해사정서", prod) })
    if (/상품설명서|모집/.test(item)) return setOpenPdf({ kind: "상품설명서", demo: true, ...pdfDoc("상품설명서", prod) })
    if (/해지환급금\s*산출/.test(item)) return setOpenPdf({ kind: "해지환급금 산출 명세서", demo: !isRealistic("해지환급금 산출 명세서"), ...pdfDoc("해지환급금 산출 명세서", prod) })
    // 신규 상세 증빙 문서(더미)
    if (/계약\s*상태/.test(item)) return setOpenPdf({ kind: "계약 상태·납입 내역", demo: false, title: "계약 상태 및 납입 내역 확인서", org: "제논라이프생명보험(주) · 계약관리부", blocks: [
      { h: "1. 계약 개요", b: `증권번호 ${pno} · 상품 ${prod} · 계약자/피보험자 ${cust} · 계약일 2015-06-01 · 계약상태 해지(2026-06-01)` },
      { h: "2. 납입 정보", b: "납입주기 월납 · 보험료 120,000원 · 납입기간 10년납 · 자동이체(국민 ***-**-1234)" },
      { h: "3. 납입 이력", table: { cols: ["기간", "납입횟수", "납입보험료", "상태"], rows: [["2015–2016", "12회", "1,440,000원", "정상"], ["2017–2020", "48회", "5,760,000원", "정상"], ["2021–2024", "48회", "5,760,000원", "정상"], ["2025", "12회", "1,440,000원", "정상"], ["합계", "120회", "14,400,000원", "완납"]] } },
    ] })
    if (/환급률/.test(item)) return setOpenPdf({ kind: "해지환급률 표", demo: false, title: "경과기간별 해지환급률 표 (약관 별표)", org: "제논라이프생명보험(주)", blocks: [
      { h: "별표. 해지환급률", b: "아래는 경과기간별 해지환급금 산출에 적용되는 해지환급률입니다.", table: { cols: ["경과연도", "해지환급률", "비고"], rows: [["1년", "12.5%", ""], ["2년", "28.4%", ""], ["3년", "41.0%", ""], ["5년", "58.6%", ""], ["7년", "68.9%", ""], ["10년", "78.0%", "본건 적용"], ["15년", "92.3%", ""], ["20년(만기)", "100.0%", ""]] } },
      { h: "안내", b: "계약 초기에 집중되는 신계약비(사업비) 공제로 계약 초기 해지환급률이 낮으며, 경과기간이 길수록 증가합니다(약관 제35조)." },
    ] })
    if (/청구서|진단서/.test(item)) return setOpenPdf({ kind: "청구서·진단서", demo: false, title: "보험금 청구서 · 진단서 (사본)", org: "제논라이프생명보험(주) · 보상서비스부 접수", blocks: [
      { h: "1. 보험금 청구서", b: `접수번호 CLM-2026-058217 · 청구인 ${cust} · 피보험자 ${cust} · 청구일 2026-05-20 · 청구 담보 암진단보험금 · 청구금액 30,000,000원` },
      { h: "2. 진단서 (요약)", b: "병명 위암(C16) · 진단확정일 2026-05-12 · 진단방법 조직검사(병리) · 진단의 김OO · 의료기관 OO대학교병원" },
      { h: "3. 제출 서류 현황", table: { cols: ["서류", "제출", "비고"], rows: [["보험금 청구서", "O", ""], ["진단서", "O", "조직검사 결과 포함"], ["입·퇴원 확인서", "O", ""], ["신분증 사본", "O", ""]] } },
    ] })
    if (/심사|부지급\s*결정/.test(item)) return setOpenPdf({ kind: "심사 결정서", demo: false, title: "보험금 심사 결정서 (부지급)", org: "제논라이프생명보험(주) · 보상심사부", blocks: [
      { h: "1. 청구 건 개요", b: `청구번호 CLM-2026-058217 · 피보험자 ${cust} · 담보 암진단보험금 · 청구금액 30,000,000원 · 접수일 2026-05-20` },
      { h: "2. 심사 결정", b: "결정 부지급 · 결정일 2026-05-28 · 심사역 박OO · 사유코드 C14" },
      { h: "3. 부지급 사유", b: "손해사정 및 의료자문 결과 청약 전 발병이 의심되는 정황이 확인되어, 약관 제14조(보험금을 지급하지 않는 사유)에 해당하는 것으로 판단함." },
      { h: "4. 적용 약관", b: "약관 제12조(보험금 지급사유) · 제14조(면책)" },
      { h: "5. 민원인 통보", b: "부지급 결정 및 사유, 재심사·금융분쟁조정 신청 절차를 2026-05-28 서면 및 유선으로 통보함." },
    ] })
    if (/상담\s*녹취|상담\s*이력/.test(item)) return setOpenPdf({ kind: "상담 이력", demo: false, title: "상담 이력 및 녹취 내역", org: "제논라이프생명보험(주) · 콜센터(CRM)", blocks: [
      { h: "1. 상담 개요", b: `민원인 ${cust} · 채널 인바운드 콜 · 관련 상담 3건` },
      { h: "2. 통화 이력", table: { cols: ["일시", "유형", "상담사", "결과", "녹취"], rows: [["2026-06-05 10:12", "청구 진행 문의", "상담사 A", "안내·콜백 약속", "REC-…001"], ["2026-06-09 14:40", "재문의(콜백 누락)", "상담사 B", "안내 상이·불만", "REC-…002"], ["2026-06-11 16:05", "책임자 연결 요구", "상담팀장", "민원 안내", "REC-…003"]] } },
      { h: "3. 비고", b: "녹취 원본은 음성 파일로 보관되며, 상세 발언 내용은 STT(음성→텍스트) 변환 후 확인합니다." },
    ] })
    if (/처리\s*경과/.test(item)) return setOpenPdf({ kind: "처리 경과 기록", demo: false, title: "민원 처리 경과 기록", org: "제논라이프생명보험(주) · 고객만족부", blocks: [
      { h: "1. 처리 경과", table: { cols: ["일자", "처리 내용", "담당"], rows: [["2026-06-12", "금감원 이첩 접수·배정", "고객만족부"], ["2026-06-13", "상담 녹취·이력 확인", `담당 ${km?.detail?.empId ?? "-"}`], ["2026-06-14", "응대 경위 조사 · 회신문 초안", `담당 ${km?.detail?.empId ?? "-"}`], ["2026-06-16", "민원인 유선 사과 · 재발방지 안내", `담당 ${km?.detail?.empId ?? "-"}`]] } },
      { h: "2. 조치 사항", b: "응대 지연 및 안내 상이에 대해 사과하고, 콜백 누락 방지를 위한 상담 프로세스 보완과 담당자 교육을 실시함." },
    ] })
    // 그 외 — 데모 목업 스텁
    setOpenPdf({ kind: "증빙", demo: true, title: item, org: "사내 문서관리시스템(EDMS)", blocks: [{ h: item, b: `본 문서는 「${item}」의 스캔 원본(PDF)으로, 금감원 제출 답변서에 증빙으로 첨부됩니다.` }] })
  }
  const openClausePdf = (c: { id: string; title: string; text: string }) => {
    if (/약관/.test(c.id)) setOpenPdf({ kind: "약관", demo: true, ...pdfDoc("약관", km?.detail?.product ?? "무배당 보험"), hi: c.id.match(/제\s*\d+\s*조/)?.[0]?.replace(/\s/g, "") })
    else setOpenPdf({ kind: /판례|대법원/.test(c.id) ? "판례" : "법령", demo: true, title: `${c.id}`, org: "관계 법령·판례 DB", blocks: [{ h: `${c.id} (${c.title})`, b: c.text }] })
  }
  const [evidence, setEvidence] = useState<Record<string, boolean>>({})
  const [kindFilter, setKindFilter] = useState<"전체" | FssKind>("전체")
  const [scope, setScope] = useState<"pending" | "done" | "all">("pending") // 접수함 범위: 미처리(기본) / 완료 / 전체
  const [drafts, setDrafts] = useState<{ fss: string; customer: string }>({ fss: "", customer: "" })
  const [openCase, setOpenCase] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([
    "[2026-06-16] 자동 초안 생성 완료",
    "[2026-06-16] 초안 수정 및 검수 완료",
    "[2026-06-17] 최종 확정 완료",
  ])
  const tpl = TEMPLATES.find((t) => t.key === tplKey) ?? TEMPLATES[TEMPLATES.length - 1]
  const reco = sel ? recoFor(d) : null
  const topKey = sel ? recoFor(d) : "기본"
  const ordered = [TEMPLATES.find((t) => t.key === topKey)!, ...TEMPLATES.filter((t) => t.key !== topKey)]
  const shownTpls = ordered.filter((t) => !q || t.name.includes(q) || t.desc.includes(q) || t.sections.some((s) => s.includes(q)))
  const similar = sel ? (cat.similar ?? GENERIC_CASES) : GENERIC_CASES
  const shownCases = similar.filter((c) => !qc || c.title.includes(qc) || c.result.includes(qc) || c.id.includes(qc))
  const log = (m: string) => setHistory((h) => [`[2026-06-17] ${m}`, ...h])

  // 금감원 제출 답변서 자동 초안 — 처리 구분에 따른 표준 서식(A 7항목 / B 4항목)에 유형별 내용·표·근거를 채움
  const build = (t: ReplyTpl) => {
    const m = intakeMeta(d); const ck = catOverride[d.id] ?? catOf(d); const c = CATS[ck]
    const form = fssForm(m.kind)
    const tbl = renderTable(CAT_TABLE[ck])
    const reqList = c.required.map((r, i) => `     ${i + 1}) ${r}`).join("\n")
    const cite = `(적용 근거: ${c.clauses.map((x) => x.id).join(", ")})`
    const rday = fmtYmd(m.detail?.ymdReq?.replace(/-/g, "")) || fmtYmd(m.detail?.ymdRecv) || "2026.06.16"
    // 사용자가 고른 유사사례 보강 포인트(현재 탭에 첨부된 것)만 본문에 삽입한다. 미선택 시 간단 판단 문구.
    const caseBodies = attached.filter((a) => a.group === "사례" && a.text).map((a) => a.text)
    const opinionBody = caseBodies.length
      ? `${caseBodies.join("\n     ")}\n     ${cite}`
      : `검토 결과 당사 처리는 관련 약관·법령에 따라 적정하게 이루어진 것으로 판단됩니다.\n     ${cite}`
    const custGuide = caseBodies.length
      ? `${CAT_CUSTGUIDE[ck]}\n\n${caseBodies.join("\n\n")}`
      : CAT_CUSTGUIDE[ck]
    const secs = form.code === "A" ? [
      `1. ${form.sections[0]}\n   - 본 건은 제3자(모집·대리 등) 개입 및 소송 계류 사항이 없으며, 긴급처리 대상이 아닙니다.`,
      `2. ${form.sections[1]}\n   - ${d.summary}`,
      `3. ${form.sections[2]}\n   - 동일 내용의 민원 중복·재접수는 확인되지 않았습니다.`,
      `4. ${form.sections[3]}\n   - 사실관계 조사결과는 아래와 같습니다.\n${tbl}`,
      `5. ${form.sections[4]}\n   - 자체 조사결과 임직원의 위규·위법 사항은 발견되지 않았습니다.`,
      `6. ${form.sections[5]}\n   - ${opinionBody}`,
      `7. ${form.sections[6]}\n   - 유사 분쟁조정 결정례 및 처리 기준 등 참고사항은 붙임과 같습니다.`,
    ] : form.code === "C" ? [
      `1. ${form.sections[0]}\n   - 본 민원은 민원인에게 직접 회신하여 처리하였으며, 그 결과를 보고드립니다.`,
      `2. ${form.sections[1]}\n   - 회신 일자: ${rday} · 회신 방법: 서면(우편) 및 유선 안내`,
      `3. ${form.sections[2]}\n   - ${d.summary}\n   - ${opinionBody}`,
      `4. ${form.sections[3]}\n   - 동일 민원 재발 방지를 위한 조치 계획은 붙임과 같습니다.`,
    ] : [
      `1. ${form.sections[0]}\n   - ${d.summary}`,
      `2. ${form.sections[1]}\n   - 당사 답변 및 향후 처리방향은 아래와 같습니다.\n${tbl}\n   - ${opinionBody}`,
      `3. ${form.sections[2]}\n   - 자체 조사결과 위규사항은 발견되지 않았습니다.`,
      `4. ${form.sections[3]}\n   - 기타 동 민원 관련 참고사항은 붙임과 같습니다.`,
    ]
    const attBlock = (() => {
      const items = attached.filter((a) => ["근거", "사실"].includes(a.group))
      if (!items.length) return ""
      const byG = (g: string) => items.filter((a) => a.group === g)
      const part = (title: string, g: string) => byG(g).length ? `\n[${title}]\n` + byG(g).map((a) => `  - ${a.text}`).join("\n") : ""
      return `\n\n[붙임]${part("적용 근거", "근거")}${part("사실관계", "사실")}`
    })()
    return {
      fss: `${secs.join("\n\n")}${attBlock}\n\n담당 부서: ${d.dept}`,
      customer: `${d.customer} 고객님, 안녕하십니까.\n평소 제논라이프생명보험에 보내주신 관심에 진심으로 감사드립니다.\n\n고객님께서 제기하신 「${c.label}」 관련 민원에 대하여 검토한 결과를 다음과 같이 안내드립니다.\n\n${ck === "단순응대" ? `${tbl}\n\n${custGuide}` : `${custGuide}\n\n${tbl}`}\n\n불편을 드린 점 너른 양해 부탁드리며, 본 안내와 관련하여 추가로 궁금하신 사항은 아래 연락처로 문의하여 주시기 바랍니다. 앞으로도 최선을 다하겠습니다. 감사합니다.\n\n      제논라이프생명보험(주) ${d.dept}\n      담당 ${m.detail?.empId ?? "-"} · 대표상담 1588-0000\n      ${fmtYmd(m.detail?.ymdRecv) || "2026.06.25"}`,
    }
  }
  const has = drafts.fss || drafts.customer
  const collapseNav = (collapsed: boolean) => { window.dispatchEvent(new CustomEvent("genon:sidebar-collapse", { detail: { collapsed } })) }
  const pickPerson = (id: string) => { const v = VOCS.find((x) => x.id === id)!; setSel(id); setTplKey(recoFor(v)); setDrafts({ fss: "", customer: "" }); setAttachMap({ fss: [], customer: [] }); setMode("fss"); setShowDoc(!!FSS_DETAIL[id]); collapseNav(true); setRightTab("사례") }
  // 건 선택 시 네비바 축소 → 메인 화면 확장. 화면을 떠나면 복원.
  useEffect(() => { if (init) collapseNav(true); return () => collapseNav(false) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // 사실관계 카드의 소스 시스템 — 실제 연동 시 조회되는 원천 레코드(mock)
  const srcRecord = (src: string): { sys: string; rows: [string, string][]; note: string } => {
    const pno = km?.detail?.policyNo ?? "—"; const prod = km?.detail?.product ?? "—"; const cust = d.customer
    const M: Record<string, { sys: string; rows: [string, string][]; note: string }> = {
      "계약원장": { sys: "계약관리시스템 · Policy Admin", rows: [["증권번호", pno], ["상품명", prod], ["계약자 / 피보험자", `${cust} / ${cust}`], ["계약일", "2015-06-01"], ["월 보험료", "120,000원 · 자동이체"], ["납입 상태", "정상 (경과 11년)"], ["계약 상태", "해지 · 2026-06-01"]], note: "실시간 조회(계정계 거래)" },
      "청구·심사": { sys: "청구·심사시스템 · Claims", rows: [["청구번호", "CLM-2026-058217"], ["청구 접수일", "2026-05-20"], ["청구 담보", "암진단보험금"], ["청구 금액", "30,000,000원"], ["심사 상태", "부지급 결정"], ["부지급 사유코드", "C14 · 면책(계약 전 발병)"], ["민원인 통보일", "2026-05-28"]], note: "실시간 조회(계정계 거래)" },
      "손해사정": { sys: "손해사정시스템 · 위탁 연계", rows: [["사정번호", "LA-2026-01187"], ["착수 통보일", "2026-04-12"], ["자료 보완요청", "2026-04-25"], ["결과 통보일", "2026-05-20"], ["손해사정서", "DOC-LA-58217.pdf"]], note: "일자 정형 자동 · 손해사정서는 EDMS 문서" },
      "콜센터·CRM": { sys: "콜센터·CRM · 상담이력", rows: [["상담건번호", "CS-2026-77120"], ["일시", "2026-06-10 14:22"], ["채널", "인바운드 콜"], ["담당 상담사", "상담사 A"], ["콜 결과", "민원 접수 안내"], ["녹취 ID", "REC-2026-77120"]], note: "메타 정형 자동 · 녹취 내용은 STT 확인" },
      "청약·모집": { sys: "청약·모집관리 · 판매", rows: [["청약번호", "APP-2023-33910"], ["모집인", "설계사 (코드 8842)"], ["상품설명서 교부", "완료 · DOC-APP-33910.pdf"], ["적합성·적정성 진단", "완료"], ["청약일", "2023-08-14"]], note: "정형 로그 자동 · 청약서·설명서는 EDMS 문서" },
      "전자청약": { sys: "전자청약 · 서명로그", rows: [["전자서명 일시", "2023-08-14 10:31"], ["인증 수단", "휴대폰 본인인증"], ["서명 로그 ID", "ESIGN-33910"], ["서명 구분", "전자서명"]], note: "정형 로그 실시간 조회" },
      "완전판매 모니터링": { sys: "완전판매 모니터링 · 해피콜", rows: [["해피콜 일시", "2023-08-21 16:05"], ["결과", "정상 완료"], ["녹취 ID", "HC-2023-33910"], ["녹취 보관", "보관 중(5년)"]], note: "결과 정형 자동 · 녹취 내용은 STT 확인" },
      "민원접수": { sys: "민원접수 · 금감원 연계", rows: [["접수번호", km?.detail?.noRecv ?? "—"], ["접수일", fmtYmd(km?.detail?.ymdRecv)], ["처리 구분", km?.detail?.reqKind ?? "—"], ["담당 부서", km?.detail?.dept ?? "—"]], note: "금감원 공문 연계" },
    }
    return M[src] ?? { sys: src, rows: [["조회", "데이터 연동 예정"]], note: "" }
  }
  // 인용 자료 첨부 토글 — 카드 우상단 컴팩트 버튼
  const AttachBtn = ({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) => (
    <button type="button" disabled={disabled} onClick={onClick} className={cn("ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-[3px] border px-1.5 py-0.5 text-[8.5px] font-semibold transition-colors", disabled ? "cursor-not-allowed border-[#e4e7ec] bg-[#f5f6f8] text-[#c2ccd9]" : on ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#cfd8e4] bg-white text-[#0f3468] hover:bg-[#eef4fb]")}>{on ? <><CheckCircle2 className="h-2.5 w-2.5" /> 첨부됨</> : <>＋ 첨부</>}</button>
  )

  // ── 보조 작업 상태 (단일 초안 기준) ──
  const [citeOk, setCiteOk] = useState<Record<string, boolean>>({})
  const [cites, setCites] = useState<Record<string, string[]>>({}) // 건별 인용 조항
  const [rightTab, setRightTab] = useState<"사실" | "근거" | "사례">("사례")
  const [caseView, setCaseView] = useState<PastCase | null>(null) // 유사사례 답변서·회신문 열람
  const [caseTab, setCaseTab] = useState<"sim" | "doc">("sim") // 유사사례 팝업 좌측 탭 — 유사 분석 / 과거 답변서
  const [removedTags, setRemovedTags] = useState<string[]>([])
  const [chat, setChat] = useState<{ who: "u" | "ai"; text: string }[]>([])
  const [chatInput, setChatInput] = useState("")
  const km = sel ? intakeMeta(d) : null
  const form = km ? fssForm(km.kind) : null // 처리 구분에 따른 답변 서식(A/B)
  const ck = (cid: string) => `${d?.id}::${cid}`
  const issueTags = (d?.keywords ?? []).filter((k) => !removedTags.includes(k))
  // 우측 패널에서 선택한 근거/사실/사례 — 첨부파일처럼 모았다가 [초안 생성] 시 반영
  type Attach = { key: string; group: "사실" | "근거" | "사례"; label: string; text: string }
  // 첨부 인용은 금감원 답변서(fss)·민원인 회신문(customer)별로 독립
  const [attachMap, setAttachMap] = useState<{ fss: Attach[]; customer: Attach[] }>({ fss: [], customer: [] })
  const attached = attachMap[mode]
  const isAttached = (k: string) => attached.some((x) => x.key === k)
  const toggleAttach = (a: Attach) => setAttachMap((p) => ({ ...p, [mode]: p[mode].some((x) => x.key === a.key) ? p[mode].filter((x) => x.key !== a.key) : [...p[mode], a] }))
  // 유사사례 열람 시 쟁점 대응 논점을 기본 전체 체크(첨부) 상태로 시작
  useEffect(() => {
    if (!caseView) return
    const bl = (mode === "fss" ? caseView.format : caseView.formatCust) ?? []
    setAttachMap((p) => {
      const cur = p[mode]
      const add = bl.map((f, i) => ({ key: `사례:${caseView.id}:${i}`, group: "사례" as const, label: f.label, text: f.body })).filter((a) => !cur.some((x) => x.key === a.key))
      return add.length ? { ...p, [mode]: [...cur, ...add] } : p
    })
  }, [caseView?.id, mode]) // eslint-disable-line react-hooks/exhaustive-deps
  const curCites = cites[d?.id ?? ""] ?? []
  const allText = `${drafts.fss}\n${drafts.customer}`
  const checks = [
    { k: "근거 인용 연결", ok: /\[|「/.test(allText) },
    { k: "미검증 인용 0건", ok: curCites.length > 0 ? curCites.every((cid) => citeOk[ck(cid)]) : true },
    { k: "회신 기한 내", ok: (km?.dday ?? 1) > 0 },
    { k: "금지표현 없음", ok: !BANNED.some((b) => allText.includes(b)) },
  ]
  const canSubmit = (drafts[mode]?.trim().length ?? 0) > 20
  const sendChat = () => { if (!chatInput.trim()) return; const qq = chatInput.trim(); setChat((c) => [...c, { who: "u" as const, text: qq }, { who: "ai" as const, text: `'${qq}' 관련 — 약관 제14조 면책 사유와 유사사례 처리 기준을 근거로 검토의견 보강안을 제안합니다. (데모 응답)` }]); setChatInput("") }

  return (
    <div className="relative flex h-full min-h-0">
        {/* 패널 1 — 금감원 접수함 (실시간) · 전체 높이 좌측 컬럼 */}
        <aside className="flex w-[212px] shrink-0 flex-col border-r border-[#dbe5f1] bg-white xl:w-[244px] 2xl:w-[268px]">
          <div className="flex h-[40px] shrink-0 items-center gap-1.5 border-b border-[#eef2f7] px-3">
            <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#15c2a2] opacity-75" /><span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#0c8f78]" /></span>
            <span className="text-[12px] font-bold text-[#10233f]">금감원 접수함</span>
            {(() => { const imm = cases.filter((v) => !done[v.id] && intakeMeta(v).dday <= 2).length; return <span className="ml-auto rounded-full bg-[#fbeceb] px-1.5 py-0.5 text-[9px] font-semibold text-[#b3261e]">기한 임박 {imm}</span> })()}
          </div>
          {/* 처리 범위 — 미처리(기본) / 완료 / 전체 */}
          <div className="flex h-[34px] shrink-0 items-center gap-1 border-b border-[#f0f3f8] bg-[#fbfdff] px-2">
            {([["pending", "미처리"], ["done", "완료"], ["all", "전체"]] as const).map(([k, l]) => { const n = k === "pending" ? cases.filter((v) => !done[v.id]).length : k === "done" ? cases.filter((v) => done[v.id]).length : cases.length; return (
              <button key={k} type="button" onClick={() => setScope(k)} className={cn("rounded-md px-2 py-0.5 text-[9.5px] font-semibold transition-colors", scope === k ? "bg-[#0f3468] text-white" : "text-[#5b6b80] hover:bg-[#eef2f7]")}>{l} <span className="tabular-nums">{n}</span></button>
            ) })}
            <span className="ml-auto text-[9px] text-muted-foreground">기한 임박순</span>
          </div>
          {/* 처리 구분 필터 — 언더라인 탭 */}
          <div className="flex h-[38px] shrink-0 items-end gap-3 border-b border-[#e6edf5] px-3">
            {(["전체", "이첩", "자율조정", "사실조회"] as const).map((k) => { const n = k === "전체" ? cases.length : cases.filter((v) => intakeMeta(v).kind === k).length; return (
              <button key={k} type="button" onClick={() => setKindFilter(k)} className={cn("-mb-px flex items-center gap-1 border-b-2 py-1.5 text-[10px] font-semibold transition-colors", kindFilter === k ? "border-[#0f3468] text-[#0f3468]" : "border-transparent text-[#5b6b80] hover:text-[#10233f]")}>{k}<span className="tabular-nums text-[9px] font-normal text-muted-foreground">{n}</span></button>
            ) })}
          </div>
          <div className="min-h-0 flex-1 divide-y divide-[#eef1f6] overflow-y-auto">
            {(() => { const shown = cases.filter((v) => (scope === "pending" ? !done[v.id] : scope === "done" ? done[v.id] : true)).filter((v) => kindFilter === "전체" || intakeMeta(v).kind === kindFilter); if (shown.length === 0) return <div className="px-3 py-8 text-center text-[10px] text-muted-foreground">해당 조건의 민원이 없습니다.</div>; return shown.map((v) => { const m = intakeMeta(v); const imminent = !done[v.id] && m.dday <= 2; const ready = isReady(v); return (
              <button key={v.id} type="button" disabled={!ready} onClick={() => pickPerson(v.id)} className={cn("flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors", !ready ? "cursor-not-allowed opacity-45" : v.id === sel ? "bg-[#f2f8ff]" : "hover:bg-[#f7fafe]")}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-muted-foreground">접수 {m.at}</span>
                    <KindTag kind={m.kind} className="ml-auto shrink-0" />
                    <span className={cn("shrink-0 rounded-[2px] border px-1 py-px text-[8px] font-semibold", m.reminwon === "재민원" ? "border-[#bcd3ef] bg-[#eef4fb] text-[#0b4f91]" : "border-[#dde3ec] text-[#8995a6]")}>{m.reminwon}</span>
                    {!ready ? <span className="shrink-0 rounded-[2px] border border-[#d6dde7] bg-[#f3f5f8] px-1.5 py-px text-[7.5px] font-semibold text-[#94a3b8]">처리예정</span> : done[v.id] ? <CheckCircle2 className="h-3 w-3 shrink-0 text-[#14b8a6]" /> : m.isNew ? <span className="shrink-0 rounded-[2px] bg-[#0f3468] px-1 py-px text-[7.5px] font-bold text-white">신규</span> : null}
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="w-[34px] shrink-0 text-[8px] text-[#9aa6b6]">접수번호</span>
                    <span className="truncate font-mono text-[11px] font-bold leading-tight text-[#10233f]">{m.no}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="w-[34px] shrink-0 text-[8px] text-[#9aa6b6]">관리번호</span>
                    <span className="truncate font-mono text-[9px] leading-tight text-[#6b7888]">{m.mwNo}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[9.5px]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TONE_HEX[riskTone(v.risk)] }} />
                    <span className="font-semibold text-[#33445c]">{v.customer}</span>
                    <span className="min-w-0 truncate text-muted-foreground">· {CATS[catOf(v)].short}</span>
                    <span className={cn("ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-[2px] px-1 py-px text-[9px] font-semibold tabular-nums", done[v.id] ? "bg-[#eef2f7] text-[#94a3b8]" : imminent ? "bg-[#fbeceb] text-[#b3261e]" : "bg-[#eef4fb] text-[#0b4f91]")}>{imminent ? <AlertTriangle className="h-2.5 w-2.5" /> : null}D-{m.dday}</span>
                  </div>
                </div>
              </button>
            ) }) })()}
          </div>
        </aside>

        {/* 우측: 고객정보 밴드 + 작업 영역 (접수함 옆에서 시작) */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* 상단 컨텍스트 밴드 — 민원 선택 시에만 표시 */}
        {sel ? (
        <div className="flex h-[74px] shrink-0 flex-col justify-center border-b border-[#dbe5f1] bg-white px-6">
          {(() => { const m = intakeMeta(d); const imminent = !done[d.id] && m.dday <= 2; const stages = fssStages(m.kind, m.track); const cur = done[d.id] ? stages.length - 1 : Math.min(2, stages.length - 2); return (
          <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-[10px] font-semibold text-[#0b4f91]">금감원 {m.no}</span>
            <span className="text-[13px] font-bold text-[#10233f]">{d.customer}</span>
            <KindTag kind={m.kind} />
            {m.detail?.product ? <span className="inline-flex items-center gap-1 text-[11px] text-[#33445c]"><FileText className="h-3 w-3 text-[#9aa6b6]" /><span className="font-medium text-[#10233f]">{m.detail.product}</span>{m.detail.policyNo ? <span className="font-mono text-[10px] text-[#6b7888]">· {m.detail.policyNo}</span> : null}</span> : null}
            <span className={cn("ml-auto inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tabular-nums", done[d.id] ? "bg-[#eef2f7] text-[#94a3b8]" : imminent ? "bg-[#fbeceb] text-[#b3261e]" : "bg-[#eef4fb] text-[#0b4f91]")}>{imminent ? <AlertTriangle className="h-3 w-3" /> : null}처리기한 D-{m.dday}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {stages.map((s, i) => (
              <span key={s} className="flex items-center gap-1">
                <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-semibold", i < cur ? "bg-[#e9faf4] text-[#0f766e]" : i === cur ? "bg-[#0f3468] text-white" : "bg-[#eef2f7] text-[#94a3b8]")}>{i < cur ? <CheckCircle2 className="h-2.5 w-2.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}{s}</span>
                {i < stages.length - 1 ? <span className="text-[#cbd5e1]">›</span> : null}
              </span>
            ))}
          </div>
          </>
          ) })()}
        </div>
        ) : (
        <div className="h-[74px] shrink-0 border-b border-[#dbe5f1] bg-white" />
        )}
        <div className="flex min-h-0 min-w-0 flex-1">

        {/* ② 민원 컨텍스트 + 사실관계 타임라인 */}
        {sel ? (
        <aside className="flex min-w-[210px] max-w-[400px] flex-1 flex-col border-r border-[#dbe5f1] bg-white">
          <div className="flex h-[38px] shrink-0 items-center border-b border-[#eef2f7] px-3 text-[10.5px] font-bold text-[#33445c]">민원 내용</div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {/* 1) 금감원 의뢰 정보 — 최상단 */}
            {km?.detail ? (
              <div className="rounded-lg border border-[#cfe0f1] bg-[#f6faff] p-2.5">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#10233f]">금감원 의뢰 정보</span>
                  <span className="ml-auto font-mono text-[10px] font-semibold text-[#0b4f91]">{km.detail.noRecv}</span>
                </div>
                <div className="space-y-1 text-[9.5px] text-[#5b6b80]">
                  <div className="flex justify-between gap-2"><span className="shrink-0 text-[#9aa6b6]">담당 부서</span><span className="min-w-0 truncate text-right font-medium text-[#33445c]">{km.detail.dept}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-[#9aa6b6]">담당자</span><span className="font-medium text-[#33445c]">{km.detail.officer}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-[#9aa6b6]">접수 / 회신기한</span><span className="font-medium text-[#33445c]">{fmtYmd(km.detail.ymdRecv)} / {fmtYmd(km.detail.ymdDeadline?.replace(/-/g, ""))}</span></div>
                  <div className="flex justify-between gap-2"><span className="shrink-0 text-[#9aa6b6]">관련 계약</span><span className="min-w-0 truncate text-right font-medium text-[#33445c]">{km.detail.product}{km.detail.policyNo ? ` · ${km.detail.policyNo}` : ""}</span></div>
                </div>
                <button type="button" onClick={() => setShowDoc(true)} className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-[#cfe0f1] bg-white py-1.5 text-[10px] font-semibold text-[#0b4f91] hover:bg-[#eef6ff]"><FileText className="h-3 w-3" /> 접수 원문 보기</button>
              </div>
            ) : null}
            {/* 2) 답변 작성 가이드 — 트랙→서식 / 유형 + 민원 요지 + 금감원 제출 vs 민원인 회신 정보 */}
            {km ? (() => { const g = PROC_GUIDE[km.kind]; const showFss = km.kind !== "직접처리"; const showCust = km.kind !== "직접처리"
              const SecHead = ({ children }: { children: React.ReactNode }) => <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.05em] text-[#5b6b80]"><span className="h-3 w-[3px] rounded-sm bg-[#0f3468]" />{children}</div>
              const Outline = ({ items }: { items: string[] }) => <ol className="overflow-hidden rounded-[3px] border border-[#e6ebf2]">{items.map((s, i) => <li key={i} className="flex gap-2 border-b border-[#f0f3f8] px-2 py-1.5 text-[10px] leading-4 text-[#33445c] last:border-0"><span className="shrink-0 pt-px font-mono text-[9px] text-[#aab3c0]">{String(i + 1).padStart(2, "0")}</span><span>{s}</span></li>)}</ol>
              return (
              <div>
                <div className="mb-2 flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5 text-[#0f3468]" /><span className="text-[10px] font-bold text-[#10233f]">답변 작성 절차 요약</span></div>
                {/* 트랙 → 보고서 서식 / 민원 유형 */}
                <div className="mb-2.5 space-y-1 rounded-[3px] bg-[#f6f9fd] px-2 py-1.5">
                  <div className="flex items-baseline gap-1.5 text-[9.5px]"><span className="w-[48px] shrink-0 text-[#9aa6b6]">처리 트랙</span><span className="font-semibold text-[#0f3468]">{km.kind}</span></div>
                  <div className="flex items-baseline gap-1.5 text-[9.5px]"><span className="w-[48px] shrink-0 text-[#9aa6b6]">작성 서식</span><span className="min-w-0 font-semibold text-[#10233f]">{g.doc}</span></div>
                  <div className="flex items-baseline gap-1.5 text-[9.5px]"><span className="w-[48px] shrink-0 text-[#9aa6b6]">민원 유형</span><span className="font-semibold text-[#10233f]">{cat.label}</span></div>
                  <div className="flex gap-1.5 border-t border-[#e4ebf4] pt-1.5 text-[9.5px]"><span className="w-[48px] shrink-0 text-[#9aa6b6]">민원 요지</span><span className="min-w-0 leading-4 text-[#33445c]">{d.summary}</span></div>
                </div>
                {/* 금감원 제출 답변서 항목 */}
                {showFss && form ? (
                  <div className="mb-2.5">
                    <SecHead>금감원 제출 — {form?.name}</SecHead>
                    <Outline items={form.sections} />
                    {g.note && km.kind === "사실조회" ? <p className="mt-1.5 text-[9px] leading-4 text-[#8995a6]">※ {g.note}</p> : null}
                  </div>
                ) : null}
                {/* 민원인(고객) 회신 안내 정보 */}
                {showCust ? (
                  <div>
                    <SecHead>민원인 회신문</SecHead>
                    <Outline items={cat.required} />
                    {g.note && km.kind !== "사실조회" ? <p className="mt-1.5 text-[9px] leading-4 text-[#8995a6]">※ {g.note}</p> : null}
                  </div>
                ) : null}
              </div>
              )
            })() : null}
          </div>
        </aside>
        ) : <EmptyPane side="l" cls="min-w-[210px] max-w-[400px] flex-1" label="민원 내용" lines={[64, 76, 40, 96]} />}

        {/* ③ 섹션 에디터 */}
        {sel && intakeMeta(d).kind === "직접처리" ? (
          <div className="flex min-w-0 flex-[2] flex-col items-center justify-center gap-3 bg-white p-8 text-center">
            <Inbox className="h-8 w-8 text-[#94a3b8]" />
            <div className="text-[12px] font-bold text-[#10233f]">금감원 직접 처리 건</div>
            <p className="max-w-[340px] text-[11px] leading-5 text-muted-foreground">금감원이 자료 요구·이첩 없이 자체적으로 처리·종결하는 건입니다. 회사가 제출할 문서가 없으며, 협회 공시·실태평가 집계에서도 제외됩니다.</p>
            <Button size="sm" onClick={() => { log("금감원 직접 처리 · 확인"); setDone((p) => ({ ...p, [d.id]: true })) }} className="h-8 gap-1 bg-[#0f3468] text-[11px] hover:bg-[#0b2547]"><CheckCircle2 className="h-3.5 w-3.5" /> 확인 처리</Button>
          </div>
        ) : sel ? (
        <section className="flex min-w-0 flex-[2] flex-col bg-white">
          <div className="flex h-[38px] shrink-0 items-end gap-3 border-b border-[#eef2f7] px-4">
            {([["fss", "금감원 제출 답변서"], ["customer", "민원인 회신문"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setMode(k)} className={cn("-mb-px border-b-2 px-1 pb-2 text-[11.5px] font-semibold transition-colors", mode === k ? "border-[#0f3468] text-[#0f3468]" : "border-transparent text-[#5b6b80] hover:text-[#10233f]")}>{l}</button>
            ))}
            {mode === "fss" && form ? <span className="ml-auto inline-flex items-center gap-1.5 pb-1.5 text-[10px] text-muted-foreground"><span className="rounded-sm bg-[#eef4fb] px-1.5 py-0.5 font-semibold text-[#0b4f91]">서식 {form.code} · {form.sections.length}개 항목</span><span className="font-mono text-[#10233f]">{companyDocNo(d.id)}</span></span> : <span className="ml-auto pb-1.5 text-[10px] text-muted-foreground">템플릿 <b className="text-[#10233f]">{tpl.name}</b></span>}
          </div>
          {/* 제출 증빙 첨부 — 금감원 제출 답변서(사실조회·자율조정) 상단 고정 영역 */}
          {(km?.kind === "사실조회" || km?.kind === "자율조정") && mode === "fss" ? (
            <div className="shrink-0 border-b border-[#eef2f7] bg-white px-4 py-2.5">
              <div className="rounded-md border border-[#e4e7ec] bg-[#f5f6f8] p-2.5">
                <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold text-[#33445c]"><FileText className="h-3.5 w-3.5 text-[#5b6b80]" /> 금감원 제출 증빙 첨부<span className="ml-1.5 font-normal text-[9px] text-[#9aa6b6]">서류명 클릭 시 첨부파일 열람</span><span className="ml-auto rounded-sm border border-[#d6dde7] bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[#5b6b80]">{cat.evidence.filter((it) => evidence[`${d.id}::${it}`]).length}/{cat.evidence.length}</span></div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.evidence.map((it) => { const key = `${d.id}::${it}`; const on = evidence[key]; return (
                    <div key={it} className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] transition-colors", on ? "border-[#0f3468] bg-[#eef4fb]" : "border-[#dde2e9] bg-white")}>
                      <button type="button" onClick={() => setEvidence((p) => ({ ...p, [key]: !p[key] }))} aria-label="제출 첨부 선택" className={cn("flex h-3 w-3 shrink-0 items-center justify-center", on ? "text-[#0f3468]" : "text-[#aab3c0] hover:text-[#5b6b80]")}>{on ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-2.5 w-2.5 rounded-sm border border-current" />}</button>
                      <button type="button" onClick={() => openEvidence(it)} className={cn("inline-flex items-center gap-1 font-medium hover:underline", on ? "text-[#0f3468]" : "text-[#5b6b80]")}><FileText className="h-2.5 w-2.5 shrink-0" />{it}</button>
                    </div>
                  ) })}
                </div>
              </div>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="flex min-h-full flex-col overflow-hidden rounded-[3px] border border-[#e2e7ee] bg-white">
              {/* 문서 머리글(메타) — 메일/게시판처럼 본문과 한 문서로, 읽기전용 */}
              {(() => { const meta: [string, string][] = mode === "fss"
                ? [["문서번호", companyDocNo(d.id)], ["수신", `금융감독원${km?.detail?.dept ? ` ${km.detail.dept}` : ""}`], ["접수번호", km?.no ?? "-"], ["제목", `「${cat.label}」 관련 ${form?.name ?? "답변서"}`], ["작성기준", `${tpl.name} · 처리구분 ${km?.kind ?? ""}`]]
                : [["수신", `${d.customer} 귀하`], ["발신", `제논라이프생명보험(주) ${d.dept}`], ["제목", `「${cat.label}」 관련 민원 회신 안내`]]
                return (
                  <div className="shrink-0 border-b border-[#e2e7ee]">
                    <table className="w-full border-collapse text-[10px]">
                      <tbody>
                        {meta.map(([label, val]) => <tr key={label} className="border-b border-[#eef2f7] last:border-0"><td className="w-[68px] border-r border-[#eef2f7] bg-[#f7f8fa] px-2.5 py-1.5 align-top font-medium text-[#5b6b80]">{label}</td><td className="px-2.5 py-1.5 font-medium text-[#10233f]">{val}</td></tr>)}
                      </tbody>
                    </table>
                  </div>
                ) })()}
              <Textarea value={drafts[mode]} onChange={(e) => setDrafts((p) => ({ ...p, [mode]: e.target.value }))} placeholder={`하단 [초안 생성]을 누르면 ${mode === "fss" ? (form ? `${form.name}(서식 ${form.code})` : "답변서") : "민원인 회신문"} 본문이 필수 기재 항목과 첨부한 인용 자료로 작성됩니다.`} className="min-h-[300px] w-full flex-1 resize-none border-0 bg-transparent px-4 py-3 text-[10px] leading-[1.7] caret-[#0f3468] shadow-none focus-visible:ring-0 md:text-[10px]" />
            </div>
          </div>
          {/* 하단 작업 바 — 첨부 인용 자료 + 생성(생성 버튼은 이 영역에만) */}
          <div className="shrink-0 space-y-2 border-t border-[#eef2f7] bg-white p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9aa6b6]">적용 근거</span>
              {attached.length ? (<>
                {/* 사례 — 케이스별 1개 태그(사례 - 사례번호) */}
                {[...new Set(attached.filter((a) => a.group === "사례").map((a) => a.key.split(":")[1]))].map((cid) => (
                  <span key={`case:${cid}`} className="inline-flex items-center gap-1 rounded-[3px] border border-[#cfe0f1] bg-[#f4f9ff] py-0.5 pl-1.5 pr-1 text-[9px] font-medium text-[#0b4f91]"><span className="text-[#9aa6b6]">사례</span> {cid}<button type="button" onClick={() => setAttachMap((p) => ({ ...p, [mode]: p[mode].filter((x) => !(x.group === "사례" && x.key.split(":")[1] === cid)) }))} className="text-[#9aa6b6] hover:text-[#0f3468]"><X className="h-2.5 w-2.5" /></button></span>
                ))}
                {/* 근거·사실 — 개별 태그 */}
                {attached.filter((a) => a.group !== "사례").map((a) => (
                  <span key={a.key} className="inline-flex items-center gap-1 rounded-[3px] border border-[#cfe0f1] bg-[#f4f9ff] py-0.5 pl-1.5 pr-1 text-[9px] font-medium text-[#0b4f91]"><span className="text-[#9aa6b6]">{a.group}</span>{a.label}<button type="button" onClick={() => toggleAttach(a)} className="text-[#9aa6b6] hover:text-[#0f3468]"><X className="h-2.5 w-2.5" /></button></span>
                ))}
              </>) : <span className="text-[9px] text-muted-foreground">우측 유사사례·근거·사실관계를 적용하면 초안 재생성 시 반영됩니다</span>}
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <button type="button" onClick={() => { const r = build(tpl); setDrafts((p) => ({ ...p, [mode]: r[mode] })); const np = attached.filter((a) => a.group === "사례").length; log(`${mode === "fss" ? "금감원 제출 답변서" : "민원인 회신문"} ${drafts[mode] ? "재생성" : "생성"}${np ? ` · 유사사례 보강 포인트 ${np}건 반영` : ""}`) }} className="inline-flex h-7 items-center gap-1 rounded-md border border-[#0f3468] bg-white px-3 text-[10.5px] font-semibold text-[#0f3468] hover:bg-[#eef4fb]"><Sparkles className="h-3 w-3" /> {drafts[mode] ? "초안 재생성" : "초안 생성"}</button>
              <button type="button" disabled={!canSubmit} onClick={() => { log(km?.kind === "사실조회" ? "사실조회 답변서 제출" : "회신 발송·처리결과 보고"); setDone((p) => ({ ...p, [d.id]: true })) }} className={cn("inline-flex h-7 items-center gap-1 rounded-md px-3 text-[10.5px] font-semibold text-white transition-colors", canSubmit ? "bg-[#14b8a6] hover:bg-[#0f9e8c]" : "cursor-not-allowed bg-[#cbd5e1]")}><Send className="h-3 w-3" /> {km?.kind === "사실조회" ? "답변서 제출" : "회신 발송·확정"}</button>
            </div>
          </div>
        </section>
        ) : (
          <section className="flex min-w-0 flex-[2] flex-col bg-white">
            <div className="flex h-[38px] shrink-0 items-end gap-3 border-b border-[#eef2f7] px-4">
              <span className="-mb-px border-b-2 border-transparent px-1 pb-2 text-[11.5px] font-semibold text-[#5b6b80]">금감원 제출 답변서</span>
              <span className="-mb-px border-b-2 border-transparent px-1 pb-2 text-[11.5px] font-semibold text-[#5b6b80]">민원인 회신문</span>
            </div>
            <div className="relative min-h-0 flex-1 p-4">
              <div className="h-full rounded-lg border border-dashed border-[#dbe5f1] bg-[#fbfcfe]" />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Inbox className="h-7 w-7 text-[#cbd5e1]" />
                <div className="text-[11px]">좌측 <b className="text-[#94a3b8]">금감원 접수함</b>에서 민원을 선택하면 회신문 작성을 시작합니다</div>
              </div>
            </div>
          </section>
        )}

        {/* ④ 근거·AI 보조 탭 */}
        {sel && intakeMeta(d).kind !== "직접처리" ? (
        <aside className="flex w-[252px] shrink-0 flex-col border-l border-[#dbe5f1] bg-white xl:w-[292px] 2xl:w-[330px]">
          {/* 인용 자료 헤더 */}
          <div className="flex h-[38px] shrink-0 items-center gap-1.5 border-b border-[#eef2f7] px-3">
            <span className="text-[10.5px] font-bold text-[#33445c]">인용 자료</span>
            <span className="ml-auto text-[8.5px] text-[#9aa6b6]">첨부 → 하단 [초안 생성] 반영</span>
          </div>
          {/* 자료 종류 탭 */}
          <div className="flex shrink-0 items-end gap-1 border-b border-[#eef2f7] px-2">
            {([["사례", "유사사례"], ["사실", "사실관계"], ["근거", "약관·법령 근거"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setRightTab(k)} className={cn("-mb-px border-b-2 px-2 py-1.5 text-[10.5px] font-semibold transition-colors", rightTab === k ? "border-[#0f3468] text-[#0f3468]" : "border-transparent text-[#5b6b80] hover:text-[#10233f]")}>{l}</button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {rightTab === "사실" ? (
              <div className="space-y-1.5">
                <div className="mb-1.5 rounded-[3px] bg-[#f5f6f8] px-2 py-1.5 text-[9px] leading-4 text-[#5b6b80]">사내 코어 시스템(계약원장·청구심사·손해사정·콜센터 등)에서 연동된 처리 기록. 첨부 시 답변서 <b className="text-[#33445c]">사실관계 항목</b>에 인용됩니다.</div>
                {cat.timeline.map((f, i) => { const key = `사실:${i}`; const on = isAttached(key); const fm = factMeta(f.k); return (
                  <div key={i} className={cn("rounded-md border bg-white p-2.5 transition-colors", on ? "border-[#0f3468]" : "border-[#e6edf5] hover:border-[#cfe0f1]")}>
                    <div className="flex items-center gap-1.5"><span className="rounded-sm bg-[#eef2f7] px-1 py-px text-[8.5px] font-bold text-[#5b6b80]">{f.k}</span><span className="text-[9px] text-muted-foreground">{f.at}</span><AttachBtn on={on} onClick={() => toggleAttach({ key, group: "사실", label: f.k, text: `[${f.k} ${f.at}] ${f.detail}` })} /></div>
                    <div className="mt-1.5 text-[10px] leading-4 text-[#33445c]">{f.detail}</div>
                    <div className="mt-1.5 flex items-center gap-1.5 border-t border-[#f0f3f8] pt-1.5 text-[8.5px] text-[#8995a6]"><button type="button" onClick={() => setOpenSrc(fm.src)} className="inline-flex items-center gap-1 rounded-[3px] border border-[#cfe0f1] bg-[#f4f9ff] px-1.5 py-0.5 text-[8.5px] font-semibold text-[#0b4f91] transition-colors hover:border-[#0f3468] hover:bg-[#eef4fb]"><Search className="h-2.5 w-2.5" />{fm.src} 조회<ArrowRight className="h-2.5 w-2.5" /></button>{fm.type !== "정형" ? <span>· {fm.type === "문서" ? "원본 문서" : "녹취(STT 확인)"}</span> : null}</div>
                  </div>
                ) })}
              </div>
            ) : rightTab === "근거" ? (
              <div className="space-y-1.5">
                <div className="mb-1.5 rounded-[3px] bg-[#f5f6f8] px-2 py-1.5 text-[9px] leading-4 text-[#5b6b80]">사내 보유 <b className="text-[#33445c]">약관 원문·법령/판례 DB</b>에서 발췌. 조항을 누르면 원문을 확인하고, 첨부 시 <b className="text-[#33445c]">당사 의견·답변 항목</b>에 인용됩니다.</div>
                {cat.clauses.map((c) => { const key = `근거:${c.id}`; const on = isAttached(key); return (
                  <div key={c.id} className={cn("rounded-md border bg-white p-2.5 transition-colors", on ? "border-[#0f3468]" : "border-[#e6edf5] hover:border-[#cfe0f1]")}>
                    <div className="flex items-center gap-1.5"><span className="rounded-sm bg-[#eef4fb] px-1.5 py-0.5 text-[9.5px] font-bold text-[#0b4f91]">{c.id}</span><span className="min-w-0 truncate text-[10.5px] font-semibold text-[#10233f]">{c.title}</span><AttachBtn on={on} onClick={() => toggleAttach({ key, group: "근거", label: c.id, text: `「${c.id}」 ${c.text}` })} /></div>
                    <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-[#33445c]">{c.text}</p>
                    <button type="button" onClick={() => openClausePdf(c)} className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-semibold text-[#0b4f91] hover:underline"><FileText className="h-2.5 w-2.5" /> 원문 보기</button>
                  </div>
                ) })}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="mb-1.5 rounded-[3px] bg-[#f5f6f8] px-2 py-1.5 text-[9px] leading-4 text-[#5b6b80]">유사 트랙·유형의 <b className="text-[#33445c]">과거 처리 사례</b>입니다. 카드를 누르면 당시 답변서·종결 결과와 함께 그 사례의 <b className="text-[#33445c]">쟁점 대응 논점·방어 자료·전략</b>을 요약해 보여주고, 원하는 논점을 골라 내 검토의견에 활용할 수 있습니다.</div>
                {shownCases.map((c) => (
                  <button key={c.id} type="button" onClick={() => { setCaseView(c); setCaseTab("sim") }} className="block w-full rounded-md border border-[#e6edf5] bg-white p-2.5 text-left transition-colors hover:border-[#cfe0f1] hover:bg-[#f7fafe]">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-sm bg-[#eaf2fc] px-1.5 py-0.5 text-[9.5px] font-bold tabular-nums text-[#0f3468]">{c.sim}%</span>
                      <span className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-[#10233f]">{c.title}</span>
                      <FileText className="h-3 w-3 shrink-0 text-[#9aa6b6]" />
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[9px]"><span className="font-mono text-muted-foreground">{c.id}</span><span className="rounded-[2px] bg-[#eef4fb] px-1 py-px font-semibold text-[#0f3468]">{c.result}</span></div>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#5b6b80]">{c.reply}</p>
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-semibold text-[#0b4f91]"><FileText className="h-2.5 w-2.5" />답변서·회신문 열람</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
        ) : <EmptyPane side="r" cls="w-[252px] shrink-0 xl:w-[292px] 2xl:w-[330px]" label="인용 자료" lines={[40, 60, 60, 48]} />}
      </div>
      </div>

      {/* 원문 모달 — 금감원 처리 의뢰 공문 + 민원인 신청 내용 */}
      {showDoc && sel && km?.detail ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 p-6" onClick={() => setShowDoc(false)}>
          <div className="flex h-[640px] max-h-full w-[760px] max-w-full flex-col overflow-hidden rounded-[3px] border border-[#d6dee9] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex shrink-0 items-center gap-2 bg-[#0f3468] px-5 py-3 text-white">
              <FileWarning className="h-4 w-4 text-white/90" />
              <span className="text-[13px] font-bold">금감원 접수 원문</span>
              <span className="font-mono text-[11px] font-semibold text-[#cfe0f1]">{km.detail.noRecv}</span>
              <KindTag kind={km.kind} />
              <button type="button" onClick={() => setShowDoc(false)} className="ml-auto rounded-[3px] p-1 text-white/70 hover:bg-white/15 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid shrink-0 grid-cols-3 gap-x-5 gap-y-1.5 border-b border-[#eef2f7] bg-[#fbfdff] px-5 py-3 text-[10px]">
              <div className="flex gap-1.5"><span className="w-[44px] shrink-0 text-[#9aa6b6]">문서번호</span><b className="font-mono text-[#10233f]">{km.detail.docNo}</b></div>
              <div className="flex gap-1.5"><span className="w-[44px] shrink-0 text-[#9aa6b6]">접수번호</span><b className="font-mono text-[#10233f]">{km.detail.noRecv}</b></div>
              <div className="flex gap-1.5"><span className="w-[44px] shrink-0 text-[#9aa6b6]">접수일자</span><b className="text-[#10233f]">{fmtYmd(km.detail.ymdRecv)}</b></div>
              <div className="flex gap-1.5"><span className="w-[44px] shrink-0 text-[#9aa6b6]">처리구분</span><b className="text-[#0f3468]">{km.detail.reqKind}</b></div>
              <div className="flex gap-1.5"><span className="w-[44px] shrink-0 text-[#9aa6b6]">민원구분</span><b className="text-[#10233f]">{km.detail.reminwon}</b></div>
              <div className="flex gap-1.5"><span className="w-[44px] shrink-0 text-[#9aa6b6]">회신기한</span><b className="text-[#10233f]">{fmtYmd(km.detail.ymdDeadline?.replace(/-/g, ""))}</b></div>
              <div className="flex gap-1.5"><span className="w-[44px] shrink-0 text-[#9aa6b6]">담당부서</span><b className="min-w-0 truncate text-[#10233f]">{km.detail.dept}</b></div>
              <div className="col-span-2 flex gap-1.5"><span className="w-[44px] shrink-0 text-[#9aa6b6]">민원인</span><b className="text-[#10233f]">{d.customer} <span className="font-normal text-[#5b6b80]">(연락처 {maskPhone(km.detail.phone)})</span></b></div>
              <div className="flex gap-1.5"><span className="w-[44px] shrink-0 text-[#9aa6b6]">담당자</span><b className="min-w-0 truncate text-[#10233f]">{km.detail.officer}</b></div>
              <div className="col-span-2 flex gap-1.5"><span className="w-[44px] shrink-0 text-[#9aa6b6]">관련계약</span><b className="min-w-0 truncate text-[#10233f]">{km.detail.product ? `${km.detail.product}${km.detail.policyNo ? ` · ${km.detail.policyNo}` : ""}` : "-"}</b></div>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-[#eef2f7] overflow-hidden">
              <div className="flex min-h-0 flex-col">
                <div className="flex shrink-0 items-center gap-1.5 border-b border-[#eef2f7] bg-[#f3f7fc] px-4 py-2 text-[11px] font-bold text-[#0f3468]"><FileText className="h-3.5 w-3.5" /> 금감원 처리 의뢰 공문</div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  <div className="min-h-full space-y-3 rounded-[3px] border border-[#dfe4ec] bg-white p-4 shadow-[0_1px_3px_rgba(15,52,104,0.08)]">
                    <p className="whitespace-pre-wrap text-[11px] leading-6 text-[#33445c]">{km.detail.fssReq}</p>
                    {km.detail.inquiryItems?.length ? (
                      <div className="rounded-[3px] border border-[#dbe5f1] bg-[#f7fbff] p-2.5">
                        <div className="mb-1.5 text-[10px] font-bold text-[#0b4f91]">사실조회 요청사항</div>
                        <ol className="space-y-1">
                          {km.detail.inquiryItems.map((it, i) => <li key={i} className="flex gap-1.5 text-[10.5px] leading-4 text-[#33445c]"><span className="shrink-0 font-semibold text-[#0b4f91]">{"가나다라마바사아"[i]}.</span><span>{it}</span></li>)}
                        </ol>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex min-h-0 flex-col">
                <div className="flex shrink-0 items-center gap-1.5 border-b border-[#eef2f7] bg-[#fbfdff] px-4 py-2 text-[11px] font-bold text-[#10233f]"><MessageSquare className="h-3.5 w-3.5 text-[#2f6bb0]" /> 민원인 신청 내용</div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  <p className="min-h-full whitespace-pre-wrap rounded-[3px] border border-[#dfe4ec] bg-white p-4 text-[11px] leading-6 text-[#33445c] shadow-[0_1px_3px_rgba(15,52,104,0.08)]">{km.detail.custReq}</p>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 border-t border-[#e6edf5] px-5 py-2.5">
              <span className="text-[9.5px] text-muted-foreground">금감원 연계 시스템 원문 · 본건 처리 목적 외 사용 금지(신용정보법 등)</span>
              <button type="button" onClick={() => setShowDoc(false)} className="ml-auto inline-flex items-center gap-1 rounded-md border border-[#dbe5f1] bg-white px-3 py-1.5 text-[10.5px] font-semibold text-[#0f3468] hover:bg-[#f7fafe]">닫기</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 유사사례 열람 — 현재 탭(금감원 답변서 / 민원인 회신문)에 맞춰 과거 문서 + 보강 */}
      {caseView ? (() => {
        const cv = caseView
        const isFss = mode === "fss"
        // 현재 탭과 동일한 형식의 과거 문서
        const docText = isFss
          ? (cv.secs?.length && form ? form.sections.map((s, i) => `${i + 1}. ${s}\n   - ${cv.secs?.[i] ?? "(해당 항목 없음)"}`).join("\n\n") : cv.reply)
          : (cv.cust ?? cv.reply)
        const boost = isFss ? (cv.format ?? []) : (cv.formatCust ?? [])
        const target = isFss ? `답변서 「${form?.sections[1] ?? "당사 답변"}」` : "민원인 회신문"
        const pickedN = boost.filter((_, i) => isAttached(`사례:${cv.id}:${i}`)).length
        // 실제 대응 결과 배지 — 무채색·네이비(부지급만 경고색)
        const oc = /부지급/.test(cv.result) ? { l: "부지급 유지", c: "#b3261e" } : /지급|차액/.test(cv.result) ? { l: "지급", c: "#0f3468" } : /환급|철회/.test(cv.result) ? { l: "환급", c: "#0f3468" } : /합의|조정/.test(cv.result) ? { l: "합의·조정", c: "#0f3468" } : /유지|전환/.test(cv.result) ? { l: "유지 전환", c: "#0f3468" } : { l: "종결", c: "#5b6b80" }
        const matchTone = (m: string) => m === "동일" ? "bg-[#0f3468] text-white" : m === "유사" ? "border border-[#cfe0f1] bg-[#eef4fb] text-[#0f3468]" : "border border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b]"
        const simPoints = cv.points ?? [{ k: "민원 유형", v: cv.title, m: "유사" as const }]
        return (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 p-6" onClick={() => setCaseView(null)}>
            <div className="flex h-[560px] max-h-full w-[680px] max-w-full flex-col overflow-hidden rounded-[3px] border border-[#d6dee9] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex shrink-0 items-center gap-2 bg-[#0f3468] px-5 py-3 text-white">
                <FileText className="h-4 w-4 text-white/90" />
                <span className="text-[13px] font-bold">유사사례</span>
                <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[9.5px] font-bold">{isFss ? "금감원 답변서" : "민원인 회신문"}</span>
                <span className="font-mono text-[11px] font-semibold text-[#cfe0f1]">{cv.id}</span>
                <span className="text-[10px] text-[#cfe0f1]">유사도 {cv.sim}%</span>
                <button type="button" onClick={() => setCaseView(null)} className="ml-auto rounded-[3px] p-1 text-white/70 hover:bg-white/15 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex shrink-0 flex-col gap-1 border-b border-[#eef2f7] bg-[#fbfdff] px-5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-[#10233f]">{cv.title}</span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#dbe5f1] bg-white px-2 py-0.5 text-[9px] font-bold text-[#0f3468]"><CheckCircle2 className="h-3 w-3" />종결</span>
                  <span className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ color: oc.c, background: `${oc.c}1a` }}>{oc.l}</span>
                </div>
                <div className="text-[9.5px] leading-[1.4] text-[#5b6b80]">{cv.result}</div>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-[1.5fr_1fr] divide-x divide-[#eef2f7] overflow-hidden">
                {/* 좌: 원본 자료 / 과거 답변서 (탭) */}
                <div className="flex min-h-0 flex-col">
                  <div className="flex shrink-0 items-center gap-3 border-b border-[#eef2f7] bg-[#f3f7fc] px-4">
                    {([["sim", "과거 사례 원본 자료"], ["doc", isFss ? `과거 금감원 제출 답변서 (서식 ${form?.code ?? "B"})` : "과거 민원인 회신문"]] as const).map(([k, l]) => (
                      <button key={k} type="button" onClick={() => setCaseTab(k)} className={cn("relative py-2 text-[10px] font-bold transition-colors", caseTab === k ? "text-[#0f3468]" : "text-[#8a97a8] hover:text-[#10233f]")}>{l}{caseTab === k ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#0f3468]" /> : null}</button>
                    ))}
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-3">
                    {caseTab === "sim" ? (
                      <div className="space-y-2.5">
                        {/* 사례 개요 — 유사 분석의 근거가 되는 원천 정보 */}
                        {cv.profile ? (
                          <div className="rounded-[4px] border border-[#dfe4ec] bg-white px-3 py-2.5">
                            <div className="mb-1 text-[9px] font-bold text-[#0b4f91]">사례 개요</div>
                            <dl className="space-y-0.5 text-[10px]">
                              <div className="flex gap-2"><dt className="w-[58px] shrink-0 text-muted-foreground">고객</dt><dd className="flex-1 text-[#10233f]">{cv.profile.customer}</dd></div>
                              <div className="flex gap-2"><dt className="w-[58px] shrink-0 text-muted-foreground">가입 상품</dt><dd className="flex-1 text-[#10233f]">{cv.profile.product}</dd></div>
                              <div className="flex gap-2"><dt className="w-[58px] shrink-0 text-muted-foreground">민원 요지</dt><dd className="flex-1 text-[#10233f]">{cv.profile.inquiry}</dd></div>
                            </dl>
                          </div>
                        ) : null}
                        {/* 이첩 민원 원문 */}
                        <div className="rounded-[4px] border border-[#dfe4ec] bg-white p-3">
                          <pre className="whitespace-pre-wrap font-mono text-[9px] leading-[1.55] text-[#33445c]">{cv.complaint ?? cv.profile?.inquiry ?? "(민원 원문 없음)"}</pre>
                        </div>
                      </div>
                    ) : (
                      <p className="min-h-full whitespace-pre-wrap rounded-[3px] border border-[#dfe4ec] bg-white p-4 text-[11px] leading-6 text-[#33445c] shadow-[0_1px_3px_rgba(15,52,104,0.08)]">{docText}</p>
                    )}
                  </div>
                </div>
                {/* 우: 분석 — 유사 분석 탭이면 유사 분석, 과거 답변서 탭이면 검토의견 작성 지원 */}
                <div className="flex min-h-0 flex-col bg-[#f7fbff]">
                  <div className="flex shrink-0 items-center gap-1.5 border-b border-[#eef2f7] px-3 py-2 text-[10.5px] font-bold text-[#0b4f91]"><Sparkles className="h-3.5 w-3.5" /> 유사도 분석 및 검토 의견</div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-3">
                    {caseTab === "sim" ? (
                      <div className="space-y-2.5">
                        {/* 유사도 개요 */}
                        <div>
                          <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold text-[#0b4f91]">유사도 개요<span className="rounded-full bg-[#eef4fb] px-1.5 py-0.5 text-[8.5px] font-bold text-[#0f3468]">유사도 {cv.sim}%</span></div>
                          <p className="rounded-[4px] border border-[#e6edf5] bg-white px-2.5 py-2 text-[10px] leading-[1.6] text-[#33445c]">{cv.why ?? "현재 건과 민원 유형·핵심 쟁점이 일치하는 과거 처리 사례입니다."}</p>
                        </div>
                        {/* 유사 요소 대조 */}
                        <div>
                          <div className="mb-1.5 text-[9px] font-bold text-[#0b4f91]">유사 요소 대조</div>
                          <div className="overflow-hidden rounded-[4px] border border-[#e6edf5] bg-white">
                            {simPoints.map((p, i) => (
                              <div key={i} className="flex items-center gap-2 border-b border-[#eef2f7] px-2.5 py-1.5 last:border-0">
                                <span className="w-[62px] shrink-0 text-[9px] font-semibold text-[#5b6b80]">{p.k}</span>
                                <span className="min-w-0 flex-1 text-[10px] leading-[1.4] text-[#10233f]">{p.v}</span>
                                <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[8.5px] font-bold", matchTone(p.m))}>{p.m}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* 실제 대응 결과 */}
                        <div>
                          <div className="mb-1.5 text-[9px] font-bold text-[#0b4f91]">과거 처리 결과</div>
                          <div className="rounded-[4px] border border-[#e6edf5] bg-white px-2.5 py-2">
                            <div className="flex items-start gap-1.5">
                              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-[3px] px-1.5 py-0.5 text-[9px] font-bold" style={{ color: oc.c, background: `${oc.c}1a` }}><CheckCircle2 className="h-2.5 w-2.5" />{oc.l}</span>
                              <span className="text-[10px] leading-[1.5] text-[#33445c]">{cv.outcome ?? cv.result}</span>
                            </div>
                            <p className="mt-1.5 text-[9.5px] leading-[1.6] text-[#5b6b80]">{cv.reply}</p>
                          </div>
                        </div>
                      </div>
                    ) : boost.length ? (
                      <div className="space-y-2.5">
                        <div className="rounded-[4px] border border-[#dce6f3] bg-white px-2.5 py-1.5 text-[9px] leading-4 text-[#5b6b80]"><b className="text-[#0f3468]">선례</b> · 이 유형은 「{cv.result}」(으)로 종결됨. 검증된 대응 논리이므로 동일한 방어선을 확보할 수 있습니다.</div>
                      {/* ① 쟁점 대응 논점 */}
                      {/* ① 쟁점 대응 논점 — 검토의견에 삽입 */}
                      <div className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-bold text-[#33445c]"><span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#0f3468] text-[8px] text-white">1</span> 쟁점 대응 논점<span className="font-normal text-[8.5px] text-muted-foreground">· 체크한 논점이 검토의견에 들어갑니다</span></div>
                      <ul className="space-y-1.5">
                        {boost.map((f, i) => { const key = `사례:${cv.id}:${i}`; const on = isAttached(key); return (
                          <li key={i}>
                            <button type="button" onClick={() => toggleAttach({ key, group: "사례", label: f.label, text: f.body })} className="flex w-full gap-2 px-1 py-1 text-left transition-colors">
                              <span className={cn("mt-px flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border", on ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#c2ccd9] bg-white text-transparent")}><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[10px] font-bold text-[#10233f]">{f.label}</span>
                                <span className="mt-0.5 block text-[9.5px] leading-[1.5] text-[#5b6b80]">{f.body}</span>
                              </span>
                            </button>
                          </li>
                        ) })}
                      </ul>
                      {/* ② 방어 자료·전략 — 읽기 전용 요약 */}
                      {isFss && cv.defense?.length ? (
                        <div className="mt-3">
                          <div className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-bold text-[#33445c]"><span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#0f3468] text-[8px] text-white">2</span> 방어 자료·전략<span className="font-normal text-[8.5px] text-muted-foreground">· 이 사례가 근거로 활용한 자료</span></div>
                          <ul className="space-y-1 rounded-[4px] border border-[#e6edf5] bg-white px-2.5 py-2">
                            {cv.defense.map((s, i) => <li key={i} className="flex gap-1.5 text-[9.5px] leading-[1.5] text-[#5b6b80]"><FileText className="mt-px h-2.5 w-2.5 shrink-0 text-[#0f3468]" />{s}</li>)}
                          </ul>
                          <div className="mt-1 text-[8.5px] leading-4 text-[#9aa6b6]">우측 [사실관계]·[약관·법령 근거] 탭에서 해당 자료를 첨부해 붙임으로 인용하세요.</div>
                        </div>
                      ) : null}
                      </div>
                    ) : <div className="rounded-[4px] border border-dashed border-[#dce6f3] bg-white px-3 py-4 text-center text-[10px] leading-5 text-muted-foreground">이 탭에 활용할 대응 논점이 없는 사례입니다 · 열람 전용</div>}
                  </div>
                  {boost.length ? (
                    <div className="shrink-0 border-t border-[#eef2f7] p-2.5">
                      <button type="button" onClick={() => { const fresh = boost.filter((_, i) => !isAttached(`사례:${cv.id}:${i}`)); if (!pickedN) fresh.forEach((f, i2) => { const idx = boost.indexOf(f); toggleAttach({ key: `사례:${cv.id}:${idx}`, group: "사례", label: f.label, text: f.body }) }); const r = build(tpl); setDrafts((p) => ({ ...p, [mode]: r[mode] })); log(`${isFss ? "금감원 제출 답변서" : "민원인 회신문"} ${drafts[mode] ? "재생성" : "생성"} · 유사사례 ${cv.id} 적용`); setCaseView(null) }} className="flex w-full items-center justify-center gap-1 rounded-md bg-[#0f3468] px-3 py-2 text-[10.5px] font-bold text-white transition-colors hover:bg-[#0b2547]"><Sparkles className="h-3.5 w-3.5" /> 해당 사례를 초안에 적용</button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )
      })() : null}

      {/* 사실관계 원천 시스템 조회 — 어떤 시스템과 연동돼 데이터가 오는지 */}
      {openSrc ? (() => { const r = srcRecord(openSrc); return (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 p-6" onClick={() => setOpenSrc(null)}>
          <div className="flex max-h-full w-[460px] max-w-full flex-col overflow-hidden rounded-[3px] border border-[#d6dee9] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex shrink-0 items-center gap-2 bg-[#0f3468] px-4 py-2.5 text-white">
              <Activity className="h-4 w-4 text-white/90" />
              <span className="text-[12px] font-bold">원천 데이터 조회</span>
              <span className="text-[10px] text-[#cfe0f1]">{r.sys}</span>
              <button type="button" onClick={() => setOpenSrc(null)} className="ml-auto rounded-[3px] p-1 text-white/70 hover:bg-white/15 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <table className="w-full border-collapse text-[10.5px]">
                <tbody>
                  {r.rows.map(([label, val], i) => (
                    <tr key={i} className="border-b border-[#eef2f7] last:border-0">
                      <td className="w-[120px] bg-[#f6f8fb] px-2.5 py-1.5 align-top font-semibold text-[#5b6b80]">{label}</td>
                      <td className="px-2.5 py-1.5 font-medium text-[#10233f]">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex shrink-0 items-center gap-2 border-t border-[#e6edf5] px-4 py-2 text-[9px] text-muted-foreground">
              <Activity className="h-3 w-3 text-[#9aa6b6]" /> 사내 {r.sys} · {r.note}
              {(() => { const doc = openSrc === "계약원장" ? (catKey === "계약해지" ? "해지환급금 산출 명세서" : "약관") : openSrc === "손해사정" ? "손해사정서" : openSrc === "청약·모집" ? "상품설명서" : null; return doc ? <button type="button" onClick={() => openDocPdf(doc)} className="ml-auto inline-flex items-center gap-1 rounded-md border border-[#dbe5f1] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#0f3468] hover:bg-[#eef4fb]"><FileText className="h-3 w-3" /> {doc}{doc === "약관" ? " 전문" : ""}(PDF) 열람</button> : null })()}
            </div>
          </div>
        </div>
      ) })() : null}

      {/* 문서형 PDF 뷰어 — 약관·손해사정서·상품설명서·법령/판례 원문 (작성 참고용) */}
      {openPdf ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-6" onClick={() => setOpenPdf(null)}>
          <div className="flex h-[88%] w-[600px] max-w-full flex-col overflow-hidden rounded-[3px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex shrink-0 items-center gap-2 bg-[#0f3468] px-4 py-2.5 text-white">
              <FileText className="h-4 w-4 text-white/90" />
              <span className="text-[12px] font-bold">{openPdf.kind} · PDF</span>
              <span className="truncate text-[10px] text-[#cfe0f1]">{openPdf.title}</span>
              <button type="button" onClick={() => setOpenPdf(null)} className="ml-auto rounded-[3px] p-1 text-white/70 hover:bg-white/15 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#525659] p-5">
              <div className="mx-auto flex min-h-[679px] w-[480px] max-w-full flex-col bg-white px-9 py-10 shadow-lg">
                {openPdf.demo ? <div className="mb-4 rounded-[2px] border border-[#e0e5ec] bg-[#f5f6f8] px-2.5 py-1.5 text-center text-[9px] text-[#8995a6]">※ 본 문서는 데모용 목업입니다. 실제 환경에서는 사내 시스템에 보관된 원본 문서가 표시됩니다.</div> : null}
                <div className="text-center">
                  <div className="text-[15px] font-bold tracking-tight text-[#10233f]">{openPdf.title}</div>
                  <div className="mt-1 text-[10px] text-[#5b6b80]">{openPdf.org}</div>
                </div>
                <div className="my-4 border-t border-[#222]" />
                <div className="space-y-3.5">
                  {openPdf.blocks.map((blk, i) => { const on = openPdf.hi && blk.h.replace(/\s/g, "").includes(openPdf.hi); return (
                    <div key={i} className={cn(on ? "-mx-2 rounded border-l-2 border-[#0f3468] bg-[#eef4fb] px-2 py-1" : "")}>
                      <div className="text-[11.5px] font-bold text-[#10233f]">{blk.h}{on ? <span className="ml-1.5 rounded-sm bg-[#0f3468] px-1 py-px text-[7.5px] font-semibold text-white align-middle">관련 조항</span> : null}</div>
                      {blk.b ? <p className="mt-1 whitespace-pre-wrap text-justify text-[10.5px] leading-6 text-[#2b3a4f]">{blk.b}</p> : null}
                      {blk.table ? (
                        <table className="mt-2 w-full border-collapse text-[9.5px]">
                          <thead><tr>{blk.table.cols.map((c, ci) => <th key={ci} className="border border-[#cdd6e2] bg-[#eef1f5] px-2 py-1 text-left font-semibold text-[#33445c]">{c}</th>)}</tr></thead>
                          <tbody>{blk.table.rows.map((row, ri) => <tr key={ri} className={row.some((c) => /적용/.test(c)) ? "bg-[#eef4fb]" : ""}>{row.map((cell, ci) => <td key={ci} className={cn("border border-[#dfe4ec] px-2 py-1 text-[#2b3a4f]", ci === 0 ? "font-medium" : "")}>{cell}</td>)}</tr>)}</tbody>
                        </table>
                      ) : null}
                    </div>
                  ) })}
                </div>
                <div className="mt-auto pt-8 text-center text-[9px] text-[#9aa6b6]">- 1 -</div>
              </div>
              <div className="mx-auto mt-4 max-w-[480px] text-center text-[9px] text-white/60">{openPdf.kind === "약관" ? "사내 약관관리시스템" : /법령|판례/.test(openPdf.kind) ? "관계 법령·판례 DB" : "사내 문서관리시스템(EDMS)"} 보관 원문 · 작성 참고용</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ===================== 4) 리포트 ===================== */
const REPORT_CENTERS = ["전체 센터", "서울 콜센터", "부산 콜센터", "광주 콜센터"]
const REPORT_CHANNELS = ["콜센터", "이메일", "대외기관 민원"]
const DAILY_SECTIONS = ["급증 키워드", "차트(추이·분포)", "주요 VoC 접수", "고객 경험별 현황", "금감원 민원"]
type RptHist = { id: string; type: "daily" | "monthly"; sub: string; center: string; ch: string; at: string; day?: string; from?: string; to?: string }
const REPORT_HISTORY: RptHist[] = [
  { id: "d1", type: "daily", sub: "2026-06-17 · 전체 센터", center: "전체 센터", ch: "전 채널", at: "06-17 09:12", day: "2026-06-17" },
  { id: "d2", type: "daily", sub: "2026-06-16 · 전체 센터", center: "전체 센터", ch: "전 채널", at: "06-16 09:05", day: "2026-06-16" },
  { id: "d3", type: "daily", sub: "2026-06-16 · 서울 콜센터", center: "서울 콜센터", ch: "콜센터", at: "06-16 18:40", day: "2026-06-16" },
  { id: "d4", type: "daily", sub: "2026-06-15 · 서울 콜센터", center: "서울 콜센터", ch: "콜센터·이메일", at: "06-15 09:03", day: "2026-06-15" },
  { id: "d5", type: "daily", sub: "2026-06-14 · 부산 콜센터", center: "부산 콜센터", ch: "전 채널", at: "06-14 08:58", day: "2026-06-14" },
  { id: "d6", type: "daily", sub: "2026-06-13 · 전체 센터", center: "전체 센터", ch: "전 채널", at: "06-13 09:10", day: "2026-06-13" },
  { id: "d7", type: "daily", sub: "2026-06-12 · 광주 콜센터", center: "광주 콜센터", ch: "콜센터", at: "06-12 17:22", day: "2026-06-12" },
  { id: "m1", type: "monthly", sub: "2026-05 · 전체 센터", center: "전체 센터", ch: "전 채널", at: "06-01 10:30", from: "2026-05", to: "2026-05" },
  { id: "m2", type: "monthly", sub: "2026-04 · 전체 센터", center: "전체 센터", ch: "전 채널", at: "05-02 10:18", from: "2026-04", to: "2026-04" },
  { id: "m3", type: "monthly", sub: "2026-03 · 서울 콜센터", center: "서울 콜센터", ch: "콜센터", at: "04-01 11:05", from: "2026-03", to: "2026-03" },
  { id: "m4", type: "monthly", sub: "2026-02 · 전체 센터", center: "전체 센터", ch: "전 채널", at: "03-02 10:42", from: "2026-02", to: "2026-02" },
  { id: "m5", type: "monthly", sub: "2026-01~04 · 전체 센터", center: "전체 센터", ch: "전 채널", at: "05-06 14:20", from: "2026-01", to: "2026-04" },
  { id: "m6", type: "monthly", sub: "2025-12 · 전체 센터", center: "전체 센터", ch: "전 채널", at: "01-03 10:15", from: "2025-12", to: "2025-12" },
]

export function ReportTab() {
  const [period, setPeriod] = useState<"daily" | "monthly">("daily")
  const [center, setCenter] = useState(REPORT_CENTERS[0])
  const [chs, setChs] = useState<string[]>(REPORT_CHANNELS)
  const [sections, setSections] = useState<Record<string, boolean>>(Object.fromEntries(DAILY_SECTIONS.map((s) => [s, true])))
  const [fromM, setFromM] = useState("2026-01")
  const [toM, setToM] = useState("2026-06")
  const [day, setDay] = useState("2026-06-16")
  const [built, setBuilt] = useState(false)
  const [histSel, setHistSel] = useState<string | null>(null)
  const openHist = (h: RptHist) => { setPeriod(h.type); setCenter(h.center); setChs(REPORT_CHANNELS); if (h.day) setDay(h.day); if (h.from) setFromM(h.from); if (h.to) setToM(h.to); setGenerating(false); setBuilt(true); setHistSel(h.id) }
  const [generating, setGenerating] = useState(false)
  const generate = () => { setHistSel(null); setBuilt(false); setGenerating(true); window.setTimeout(() => { setGenerating(false); setBuilt(true) }, 5000) }
  const selectPeriod = (k: "daily" | "monthly") => { setPeriod(k); setBuilt(false); setHistSel(null) }
  const toggleCh = (c: string) => setChs((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))
  const toggleSec = (s: string) => setSections((p) => ({ ...p, [s]: !p[s] }))
  const chLabel = chs.length === REPORT_CHANNELS.length ? "전체 채널" : chs.join("·") || "채널 미선택"
  const surge = ["부지급", "환급금 차액", "이중 출금", "앱 인증"]
  const monthTrend = [["1월", 142], ["2월", 158], ["3월", 171], ["4월", 165], ["5월", 188], ["6월", 214]] as const
  // 월간 리포트 데이터
  const vocStatus = [
    ["전체 VoC", "1,280", "100%", "+10%", "6,800", "+5%"],
    ["불만", "650", "50.8%", "+12%", "3,450", "+8%"],
    ["만족", "400", "31.3%", "-5%", "2,150", "+2%"],
    ["제안", "150", "11.7%", "+20%", "680", "+15%"],
    ["기타", "80", "6.3%", "0%", "320", "-3%"],
  ]
  const topVoc = [["보험금 부지급", 88], ["고객센터 상담", 80], ["앱·전산 오류", 70], ["해지환급금", 66], ["자동이체·수금", 50], ["불완전판매", 40], ["계약 변경", 24]] as const
  const topVocMax = Math.max(...topVoc.map((t) => t[1]))
  const improveRows = [
    ["보상서비스부", "부지급 불만 증가 및 처리 지연", "심사 기준 안내 강화 및 처리 SLA 정비"],
    ["디지털서비스부", "앱 오류 및 인증 버그", "앱 업데이트 및 버그 수정"],
    ["고객만족부", "자주 묻는 문의 및 FAQ 제출", "FAQ 개선 및 상담 스크립트 업데이트"],
  ]
  // 일일 리포트 데이터
  const hourly = [["08시", 8], ["10시", 12], ["12시", 15], ["14시", 14], ["16시", 18], ["18시", 17], ["20시", 25]] as const
  const expSegs = [
    { label: "불만", value: 25, color: "#0f3468" },
    { label: "만족", value: 16, color: "#14b8a6" },
    { label: "제안", value: 9, color: "#38bdf8" },
    { label: "단순문의", value: 20, color: "#94a3b8" },
    { label: "철회항변", value: 5, color: "#2f6bb0" },
  ]
  const expTotal = expSegs.reduce((s, x) => s + x.value, 0)
  const EXP_NOTE: Record<string, string> = { 불만: "지연·서비스 품질 등", 만족: "신속한 응대", 제안: "개선 아이디어 제출", 단순문의: "서비스 관련 문의", 철회항변: "환불·불완전판매" }
  const expRows = expSegs.map((s) => [s.label, `${s.value}`, `${Math.round((s.value / expTotal) * 100)}%`, EXP_NOTE[s.label]])
  const majorVoc = [
    ["1", "불만", "서비스 지연으로 인한 불만 접수", "모바일 앱"],
    ["2", "만족", "신속한 응대에 대한 긍정 피드백", "웹사이트"],
    ["3", "철회항변", "불완전판매 관련 항변 접수", "콜센터"],
  ]
  const fssRows = [["제기", "8", "서비스 불만 관련 민원 접수"], ["처리", "3", "진행 중인 민원 건수"]]
  const fssMajor = [["2026-06-16", "서비스 개선 요청 및 불편 사항"], ["2026-06-16", "불공정 거래 관련 민원 제기"]]
  return (
    <div className="min-h-full bg-[#e6eaf1] px-6 py-6">
      <div className="mx-auto w-[794px] max-w-full space-y-4 xl:-translate-x-[96px]">
      {/* 리포트 생성 설정 */}
      <div className="rounded-[3px] border border-[#dbe5f1] bg-white px-4 py-2.5 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#10233f]"><FileText className="h-3.5 w-3.5 text-[#0f3468]" /> 리포트 생성 설정</div>
          <div className="flex items-center gap-1 rounded-lg border border-[#dbe5f1] bg-[#f7fafe] p-0.5">
            {([["daily", "일일 리포트"], ["monthly", "월간 리포트"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => selectPeriod(k)} className={cn("rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition-colors", period === k ? "bg-[#0f3468] text-white" : "text-[#33445c] hover:bg-white")}>{l}</button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5 text-[10.5px]">
          {/* 센터 · 기간 */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <label className="flex items-center gap-1.5">
              <span className="font-semibold text-[#0b4f91]">센터</span>
              <select value={center} onChange={(e) => { setCenter(e.target.value); setBuilt(false) }} className="rounded-md border border-[#dbe5f1] bg-white px-2 py-1 text-[10.5px] text-[#10233f] outline-none focus:border-[#0f3468]">
                {REPORT_CENTERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <span className="font-semibold text-[#0b4f91]">{period === "daily" ? "보고 일자" : "보고 기간"}</span>
              {period === "daily" ? (
                <input type="date" value={day} onChange={(e) => { setDay(e.target.value); setBuilt(false) }} className="rounded-md border border-[#dbe5f1] bg-white px-2 py-1 text-[10.5px] text-[#10233f] outline-none focus:border-[#0f3468]" />
              ) : (
                <span className="flex items-center gap-1.5">
                  <input type="month" value={fromM} onChange={(e) => { setFromM(e.target.value); setBuilt(false) }} className="rounded-md border border-[#dbe5f1] bg-white px-2 py-1 text-[10.5px] text-[#10233f] outline-none focus:border-[#0f3468]" />
                  <span className="text-[10px] text-muted-foreground">~</span>
                  <input type="month" value={toM} onChange={(e) => { setToM(e.target.value); setBuilt(false) }} className="rounded-md border border-[#dbe5f1] bg-white px-2 py-1 text-[10.5px] text-[#10233f] outline-none focus:border-[#0f3468]" />
                </span>
              )}
            </label>
          </div>
          {/* 채널 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 font-semibold text-[#0b4f91]">채널</span>
            {REPORT_CHANNELS.map((c) => (
              <button key={c} type="button" onClick={() => { toggleCh(c); setBuilt(false) }} className={cn("rounded-full border px-2.5 py-0.5 text-[10px]", chs.includes(c) ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#dbe5f1] bg-white text-[#5b6b80] hover:bg-[#f7fafe]")}>{c}</button>
            ))}
          </div>
          {/* 일일: 포함 섹션 */}
          {period === "daily" ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-0.5 font-semibold text-[#0b4f91]">포함 섹션</span>
              {DAILY_SECTIONS.map((s) => (
                <button key={s} type="button" onClick={() => { toggleSec(s); setBuilt(false) }} className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px]", sections[s] ? "border-[#0f3468] bg-[#f2f8ff] text-[#0b4f91]" : "border-[#dbe5f1] bg-white text-[#9aa7b8] hover:bg-[#f7fafe]")}>
                  {sections[s] ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-[#cbd5e1]" />}{s}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="mt-2 flex items-center gap-2 border-t border-[#eef2f7] pt-2">
          <span className="text-[10px] text-muted-foreground">{center} · {chLabel} · {period === "daily" ? day : `${fromM} ~ ${toM}`}</span>
          <Button size="sm" disabled={generating} onClick={generate} className="ml-auto h-7 gap-1 bg-[#0f3468] text-[11px] hover:bg-[#0b2547] disabled:opacity-80">{generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} {generating ? "생성 중…" : built ? "다시 생성" : "리포트 생성"}</Button>
        </div>
      </div>

      <div className="relative min-h-[78vh]">
      {/* 생성 이력 — 리포트 영역 우측, 장바구니형 목록 (현재 탭 기준) */}
      <aside className="absolute left-full top-0 bottom-0 ml-3 hidden w-[176px] xl:block">
        <div className="sticky top-6 flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[3px] border border-[#dbe5f1] bg-white shadow-sm">
          <div className="flex items-center gap-1 border-b border-[#eef2f7] bg-[#f7fafe] px-3 py-2 text-[10.5px] font-bold text-[#10233f]"><ListChecks className="h-3.5 w-3.5 text-[#0f3468]" /> {period === "daily" ? "일일" : "월간"} 생성 이력 <span className="ml-auto rounded-full bg-[#0f3468] px-1.5 py-0.5 text-[8.5px] font-bold text-white">{REPORT_HISTORY.filter((h) => h.type === period).length}</span></div>
          <div className="flex-1 divide-y divide-[#f0f3f8] overflow-y-auto">
            {REPORT_HISTORY.filter((h) => h.type === period).map((h) => (
              <button key={h.id} type="button" onClick={() => openHist(h)} className={cn("flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors", histSel === h.id ? "bg-[#f2f8ff]" : "hover:bg-[#f7fafe]")}>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3 shrink-0 text-[#0f3468]" />
                  <span className="text-[10px] font-semibold text-[#10233f]">{h.type === "daily" ? "일일 리포트" : "월간 리포트"}</span>
                  <span className="ml-auto text-[8px] text-muted-foreground">{h.at}</span>
                </div>
                <div className="truncate pl-[18px] text-[9px] font-medium text-[#33445c]">{h.sub.split(" · ")[0]}</div>
                <div className="truncate pl-[18px] text-[8.5px] text-muted-foreground">{h.center} · {h.ch}</div>
              </button>
            ))}
          </div>
        </div>
      </aside>
      {generating ? (
        <div className="flex min-h-[74vh] flex-col items-center justify-center rounded-[3px] border border-dashed border-[#cfd8e6] bg-white/60 py-16 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-[#0f3468]" />
          <div className="mt-3 text-[12px] font-semibold text-[#10233f]">리포트를 생성하고 있습니다…</div>
          <div className="mt-0.5 text-[10px]">{center} · {chLabel} · {period === "daily" ? day : `${fromM} ~ ${toM}`} 데이터 집계 중</div>
        </div>
      ) : !built ? (
        <div className="flex min-h-[74vh] flex-col items-center justify-center rounded-[3px] border border-dashed border-[#cfd8e6] bg-white/60 py-16 text-center text-muted-foreground">
          <FileText className="h-8 w-8 text-[#cfd8e6]" />
          <div className="mt-2 text-[12px]">조건을 설정한 뒤 <b className="text-[#0f3468]">리포트 생성</b>을 눌러주세요</div>
          <div className="mt-0.5 text-[10px]">센터·채널·{period === "daily" ? "포함 섹션" : "기간"}이 리포트에 반영됩니다</div>
        </div>
      ) : period === "daily" ? (
        <div className="space-y-5 rounded-[3px] bg-white px-[58px] py-[52px] shadow-[0_4px_28px_rgba(15,35,68,0.16)]">
          {/* 리포트 헤더 */}
          <div className="flex items-start justify-between border-b border-[#eef2f7] pb-3">
            <div className="leading-snug">
              <div className="text-[15px] font-bold text-[#10233f]">일일 VoC 리포트</div>
              <div className="mt-1 text-[10.5px] text-muted-foreground">보고일자: {day} · {center} · {chLabel}</div>
              <div className="text-[10.5px] text-muted-foreground">요약 정보: 해당일 VoC 데이터 분석 결과 주요 이슈 및 특이사항 반영</div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#bae6fd] bg-[#e8f6fe] px-2.5 py-1 text-[10.5px] font-semibold text-[#0369a1]"><AlertTriangle className="h-3.5 w-3.5" /> 주의 알림: 급증 키워드 감지</span>
          </div>

          {/* 급증 키워드 자동 강조 */}
          {sections["급증 키워드"] ? (
          <div className="rounded-none border border-[#bcd3ef] bg-[#eef4fb] px-3 py-2">
            <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-[#0f3468]"><TrendingUp className="h-3 w-3" /> 전일 대비 급증 키워드 · 특이사항</div>
            <div className="flex flex-wrap gap-1.5">{surge.map((s) => <span key={s} className="inline-flex items-center gap-1 rounded-full border border-[#bcd3ef] bg-white px-2 py-0.5 text-[10.5px] font-medium text-[#0f3468]">#{s}</span>)}</div>
          </div>
          ) : null}

          {/* 차트 3종 */}
          {sections["차트(추이·분포)"] ? (
          <div className="grid grid-cols-3 gap-3">
            <Card title="VoC 접수 건수 추이 (시간대별)"><LineChart points={hourly} /></Card>
            <Card title="고객 경험 분포"><Donut segs={expSegs} /></Card>
            <Card title="금감원 민원 건수"><MiniBars data={[["제기", 8], ["처리", 3]]} /></Card>
          </div>
          ) : null}

          {/* 주요 VoC 접수 내용 */}
          {sections["주요 VoC 접수"] ? <ReportTable title="주요 VoC 접수 내용" head={["NO", "분류", "내용", "접수 경로"]} rows={majorVoc} /> : null}

          {/* 고객 경험별 일 접수 현황 */}
          {sections["고객 경험별 현황"] ? <ReportTable title="고객 경험별 일 접수 현황" head={["고객 경험 유형", "접수건", "비율", "주요 내용"]} rows={expRows} footer={`총계: ${expTotal}건`} /> : null}

          {/* 금감원 민원 */}
          {sections["금감원 민원"] ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#10233f]"><ShieldAlert className="h-4 w-4 text-[#0f3468]" /> 금감원 민원</div>
            <ReportTable title="민원 접수 현황" head={["구분", "건수", "내용"]} rows={fssRows} />
            <ReportTable title="주요 민원" head={["민원 접수일", "내용"]} rows={fssMajor} />
          </div>
          ) : null}

          {/* 내보내기 */}
          <div className="flex justify-end gap-2 border-t border-[#eef2f7] pt-3">
            <Button size="sm" className="h-8 gap-1 bg-[#0f3468] text-[11px] hover:bg-[#0b2547]"><FileText className="h-3.5 w-3.5" /> PDF 다운로드</Button>
            <Button size="sm" className="h-8 gap-1 bg-[#14b8a6] text-[11px] hover:bg-[#0f9e8c]"><BarChart3 className="h-3.5 w-3.5" /> 엑셀 내보내기</Button>
            <Button size="sm" variant="outline" className="h-8 text-[11px]">인쇄</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 rounded-[3px] bg-white px-[58px] py-[52px] shadow-[0_4px_28px_rgba(15,35,68,0.16)]">
          {/* 헤더 */}
          <div className="flex items-start justify-between rounded-none border border-[#bad6f4] bg-[#f2f8ff] px-3 py-2.5">
            <div className="leading-snug">
              <div className="text-[10.5px] font-semibold text-[#0b4f91]">보고 기간: {fromM} ~ {toM} · {center} · {chLabel}</div>
              <div className="mt-0.5 text-[10.5px] text-[#0b4f91]">요약: 총 VoC 1,280건, 기간 VoC 비중 및 전월 대비 변화, 연누계 및 전년동기 수치 확인</div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#b9ece0] bg-[#e9faf4] px-2.5 py-1 text-[10.5px] font-semibold text-[#0f766e]"><CheckCircle2 className="h-3.5 w-3.5" /> 업데이트 완료</span>
          </div>

          {/* VoC 현황 */}
          <ReportTable title="VoC 현황" head={["구분", "총 건수", "당월 비중", "전월비", "연누계", "전년동기비"]} rows={vocStatus} />

          {/* 당월 상위 VoC 분석 */}
          <div>
            <div className="mb-1.5 text-[12px] font-bold text-[#10233f]">당월 상위 VoC 분석</div>
            <div className="grid grid-cols-2 gap-3">
              <Card title="상위 VoC 주요 이슈">
                <p className="text-[11px] leading-5 text-[#10233f]">당월 접수 VoC 중 보험금·해지 관련 이슈가 두드러집니다. 특히 보험금 부지급·환급률 안내·불완전판매 항목에서 전월 대비 각각 +12%, +8%, +5%의 변화가 확인됩니다.</p>
                <div className="mt-2 text-[9.5px] text-muted-foreground">전월比 변화 반영</div>
              </Card>
              <Card title="상위 VoC 현황"><Bars data={topVoc} max={topVocMax} /></Card>
            </div>
          </div>

          {/* 월간 발생 추이 */}
          <Card title="월간 VoC 발생 추이"><LineChart points={monthTrend} /></Card>

          {/* 주요 개선 사례 */}
          <ReportTable title="주요 개선 사례" head={["담당 조직", "VoC 내용", "개선 조치"]} rows={improveRows} />

          {/* 내보내기 */}
          <div className="flex justify-end gap-2 border-t border-[#eef2f7] pt-3">
            <Button size="sm" className="h-8 gap-1 bg-[#0f3468] text-[11px] hover:bg-[#0b2547]"><FileText className="h-3.5 w-3.5" /> PDF 다운로드</Button>
            <Button size="sm" className="h-8 gap-1 bg-[#14b8a6] text-[11px] hover:bg-[#0f9e8c]"><BarChart3 className="h-3.5 w-3.5" /> 엑셀 내보내기</Button>
            <Button size="sm" variant="outline" className="h-8 text-[11px]">인쇄</Button>
            <Button size="sm" className="h-8 gap-1 bg-[#14b8a6] text-[11px] hover:bg-[#0f9e8c]"><Send className="h-3.5 w-3.5" /> 리포트 공유</Button>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  )
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-none border border-[#e6edf5] bg-white p-3"><div className="mb-2 text-[11px] font-bold text-[#10233f]">{title}</div>{children}</div>
}
function Bars({ data, max }: { data: readonly (readonly [string, number])[]; max: number }) {
  return <div className="space-y-1">{data.map(([k, v]) => <div key={k} className="flex items-center gap-2 text-[10px]"><span className="w-[80px] shrink-0 truncate text-muted-foreground">{k}</span><div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-[#eef2f7]"><div className="h-full rounded-sm bg-[#2f6bb0]" style={{ width: `${(v / max) * 100}%` }} /></div><span className="w-5 text-right tabular-nums text-[#10233f]">{v}</span></div>)}</div>
}
function LineChart({ points }: { points: readonly (readonly [string, number])[] }) {
  const W = 300, H = 116, padX = 10, padTop = 14, padBot = 18
  const baseY = H - padBot, innerH = baseY - padTop
  const max = Math.max(...points.map((p) => p[1]), 1)
  const cx = (i: number) => padX + (i * (W - padX * 2)) / (points.length - 1)
  const y = (v: number) => baseY - (v / max) * innerH
  const line = points.map((p, i) => `${cx(i)},${y(p[1])}`).join(" ")
  const area = `${padX},${baseY} ${line} ${cx(points.length - 1)},${baseY}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[116px] w-full">
      <polygon points={area} fill="#2f6bb0" fillOpacity={0.1} />
      <polyline points={line} fill="none" stroke="#2f6bb0" strokeWidth={1.8} strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={cx(i)} cy={y(p[1])} r={2} fill="#2f6bb0" />)}
      {points.map((p, i) => <text key={`x${i}`} x={cx(i)} y={H - 5} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 7 }}>{p[0]}</text>)}
    </svg>
  )
}
function Donut({ segs }: { segs: { label: string; value: number; color: string }[] }) {
  const total = segs.reduce((s, x) => s + x.value, 0) || 1
  let acc = 0
  const stops = segs.map((s) => { const a = (acc / total) * 360; acc += s.value; const b = (acc / total) * 360; return `${s.color} ${a}deg ${b}deg` }).join(", ")
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-[76px] w-[76px] shrink-0 rounded-full" style={{ background: `conic-gradient(${stops})` }}>
        <div className="absolute inset-[11px] flex flex-col items-center justify-center rounded-full bg-white"><span className="text-[13px] font-bold leading-none text-[#10233f]">{total}</span><span className="mt-0.5 text-[8px] text-muted-foreground">건</span></div>
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        {segs.map((s) => <div key={s.label} className="flex items-center gap-1.5 text-[9.5px]"><span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: s.color }} /><span className="truncate text-muted-foreground">{s.label}</span><span className="ml-auto font-semibold tabular-nums text-[#10233f]">{s.value}</span></div>)}
      </div>
    </div>
  )
}
function MiniBars({ data }: { data: readonly (readonly [string, number])[] }) {
  const max = Math.max(...data.map((d) => d[1]), 1)
  return (
    <div className="flex items-end justify-around gap-3 pt-1" style={{ height: 100 }}>
      {data.map(([k, v]) => (
        <div key={k} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[9px] font-bold text-[#0b4f91]">{v}</span>
          <div className="w-9 rounded-sm bg-[#f0b35b]" style={{ height: `${(v / max) * 70}px` }} />
          <span className="text-[9px] text-muted-foreground">{k}</span>
        </div>
      ))}
    </div>
  )
}
function ReportTable({ title, head, rows, footer }: { title: string; head: string[]; rows: string[][]; footer?: string }) {
  return (
    <div>
      <div className="mb-1.5 text-[12px] font-bold text-[#10233f]">{title}</div>
      <div className="overflow-hidden rounded-none border border-[#e6edf5]">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[#f7fafe] text-[10px] font-semibold text-[#3a5e8c]"><tr>{head.map((h, i) => <th key={i} className="px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, ri) => <tr key={ri} className="border-t border-[#eef3f9] text-[11px] text-[#10233f]">{r.map((c, ci) => <td key={ci} className="px-3 py-2">{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {footer ? <div className="mt-1 text-right text-[10.5px] font-semibold text-[#10233f]">{footer}</div> : null}
    </div>
  )
}

/* ===================== 5) 이슈·트렌드 모니터링 ===================== */
const RANGES: [string, string][] = [["am", "오전"], ["pm", "오후"], ["today", "오늘"], ["custom", "기간선택"]]
// 후처리로 추려진 핵심 이슈 용어 (범용어·내부 절차어 제외) — 크기 = 언급량
const CLOUD_WORDS: [string, number][] = [
  ["부지급", 50], ["환급금 과소", 38], ["이중출금", 30], ["보험료 인상", 34], ["자동이체 오류", 22],
  ["앱 오류", 26], ["로그인 실패", 16], ["본인인증 실패", 20], ["보장 제외", 32], ["면책", 24],
  ["부당 권유", 36], ["설명 미흡", 28], ["상담 연결 지연", 18], ["응대 불만", 23], ["환불 요구", 21],
  ["부당 안내", 19], ["청구 거절", 25], ["처리 지연", 17], ["금감원", 42], ["법적 대응", 29],
]
const CLOUD_COLORS = ["#0f3468", "#2f6bb0", "#38bdf8", "#14b8a6", "#0ea5e9", "#5b6b80", "#10233f"]
// 보관: 통계용 트리거 키워드 — 추후 통계/리포트에 사용 (현재 UI 미노출)
export const RESERVED_TRIGGER_KEYWORDS = ["금감원", "법적 조치", "분쟁조정", "욕설", "언론 제보", "집단 민원", "녹취", "고소·고발", "국민신문고"]
const ALL_CHANNELS: Channel[] = ["콜센터", "이메일", "대외기관 민원"]
export function MonitorTab() {
  const [range, setRange] = useState("today")
  const [from, setFrom] = useState("2026-06-01")
  const [to, setTo] = useState("2026-06-17")
  const [channels, setChannels] = useState<Channel[]>(ALL_CHANNELS)
  const toggleCh = (c: Channel) => setChannels((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c])
  const allCh = channels.length === ALL_CHANNELS.length
  const [kwPage, setKwPage] = useState(0)
  useEffect(() => { const id = setInterval(() => setKwPage((p) => (p + 1) % 2), 3500); return () => clearInterval(id) }, [])
  // 급증 키워드 (실시간 언급량)
  const surgeKw: [string, number][] = [
    ["부지급", 13000], ["환급금 과소", 980], ["이중출금", 640], ["앱 오류", 420], ["보험료 인상", 310],
    ["부당 권유", 280], ["보장 제외", 240], ["설명 미흡", 210], ["본인인증 실패", 180], ["청구 거절", 150],
  ]
  // AI 유형 분류(2차 가공) — 여러 원천 표현이 하나의 유형으로 묶임 (다대일)
  const typeRows: { type: string; dept: string; n: number; wow: number; kws: string[] }[] = [
    { type: "보험금 부지급", dept: "보상서비스부", n: 1300, wow: 24, kws: ["부지급 사유 불만", "재심사 요구", "약관 해석 이견"] },
    { type: "해지·환급금", dept: "고객만족부", n: 980, wow: 9, kws: ["환급금 과소 지급", "차액 환불 요구", "해지 요청"] },
    { type: "전산·인증 오류", dept: "디지털서비스부", n: 640, wow: 18, kws: ["앱 접속 오류", "본인인증 실패", "로그인 장애"] },
    { type: "보장 범위 분쟁", dept: "보상서비스부", n: 540, wow: 12, kws: ["보장 제외 불만", "면책 이견"] },
    { type: "수금·이중출금", dept: "수금관리부", n: 420, wow: 6, kws: ["이중 출금", "자동이체 오류"] },
    { type: "불완전판매", dept: "준법감시부", n: 310, wow: 15, kws: ["설명 의무 미흡", "가입 권유 항변"] },
  ]
  // 부서별 처리 현황 — 신규 유입 vs 처리 완료
  const deptRows: { dept: string; inflow: number; done: number; backlog: number }[] = [
    { dept: "보상서비스부", inflow: 480, done: 300, backlog: 420 },
    { dept: "준법감시부", inflow: 180, done: 130, backlog: 110 },
    { dept: "디지털서비스부", inflow: 240, done: 210, backlog: 95 },
    { dept: "고객만족부", inflow: 300, done: 288, backlog: 70 },
    { dept: "수금관리부", inflow: 160, done: 158, backlog: 40 },
    { dept: "계약관리부", inflow: 90, done: 90, backlog: 18 },
  ]
  const procRate = (r: { inflow: number; done: number }) => Math.round((r.done / r.inflow) * 100)
  const bnTone = (r: { inflow: number; done: number }): Tone => { const p = r.done / r.inflow; return p < 0.7 ? "bad" : p < 0.9 ? "warn" : "good" }
  const bnLabel = (t: Tone) => (t === "bad" ? "병목" : t === "warn" ? "주의" : "정상")
  const issues = [
    { title: "보험금 부지급 불만 급증", desc: "최근 1시간 관련 VoC 6건 — 평소 대비 +180%", level: "bad" as Tone, time: "방금" },
    { title: "‘금감원’ 키워드 급증", desc: "악성민원 발전 위험 트리거 키워드 30분 내 4건 감지", level: "bad" as Tone, time: "10분 전" },
    { title: "자동이체 이중 출금 다발", desc: "수금·납입 유형 VoC 연속 접수 — 시스템 점검 권고", level: "warn" as Tone, time: "32분 전" },
    { title: "불완전판매 항변 연속 접수", desc: "준법감시부 이관 건 30분 내 3건 — 검토 권고", level: "bad" as Tone, time: "41분 전" },
    { title: "앱 인증 오류 문의 급증", desc: "전산·디지털 유형 VoC 급증 — 디지털서비스부 확인 필요", level: "warn" as Tone, time: "55분 전" },
    { title: "해지환급금 차액 항의 증가", desc: "환급금 안내 상이 관련 VoC +60%", level: "warn" as Tone, time: "1시간 전" },
  ]
  return (
    <div className="space-y-4 px-6 py-4">
      {/* 상단: 실시간 모니터링 + 채널 + 기간 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b9ece0] bg-[#e9faf4] px-2.5 py-1 text-[11px] font-semibold text-[#0f766e]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#14b8a6]" /> 실시간 모니터링 중</span>
        <span className="mx-0.5 h-4 w-px bg-[#dbe5f1]" />
        <span className="text-[10px] text-muted-foreground">채널</span>
        <button type="button" onClick={() => setChannels(ALL_CHANNELS)} className={cn("rounded-full border px-2.5 py-1 text-[10.5px] transition-colors", allCh ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#dbe5f1] bg-white text-[#5b6b80] hover:bg-[#f7fafe]")}>전체</button>
        {ALL_CHANNELS.map((c) => {
          const I = CH_ICON[c]
          const on = !allCh && channels.includes(c)
          return <button key={c} type="button" onClick={() => toggleCh(c)} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] transition-colors", on ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#dbe5f1] bg-white text-[#5b6b80] hover:bg-[#f7fafe]")}><I className="h-3 w-3" />{c}</button>
        })}
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {RANGES.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setRange(k)} className={cn("rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors", range === k ? "text-[#0f3468]" : "text-[#9aa7b8] hover:text-[#33445c]")}>{l}</button>
          ))}
          <span className="flex items-center gap-1 rounded-md border border-[#dbe5f1] bg-white px-2 py-1">
            <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} disabled={range !== "custom"} className="bg-transparent text-[10.5px] text-[#10233f] outline-none disabled:text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">~</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} disabled={range !== "custom"} className="bg-transparent text-[10.5px] text-[#10233f] outline-none disabled:text-muted-foreground" />
          </span>
        </div>
      </div>

      {/* 실시간 이슈 알림 (카루셀) */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-[#10233f]"><Bell className="h-4 w-4 text-[#0f3468]" /> 실시간 이슈 알림 <span className="text-[10px] font-normal text-muted-foreground">· 실시간 감지 스트림</span></div>
        <div className="relative overflow-hidden border border-[#e6edf5] bg-[#fbfdff] py-3">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#fbfdff] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#fbfdff] to-transparent" />
          <div className="flex w-max animate-[voc-marquee_36s_linear_infinite] hover:[animation-play-state:paused]">
            {[0, 1].map((g) => (
              <div key={g} className="flex shrink-0 gap-3 pl-3" aria-hidden={g === 1}>
                {issues.map((it, i) => (
                  <div key={`${g}-${i}`} className={cn("flex w-[270px] shrink-0 flex-col border p-3", it.level === "bad" ? "border-[#bcd3ef] bg-[#eef4fb]" : "border-[#bae6fd] bg-[#eaf7fe]")}>
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className={cn("h-3.5 w-3.5 shrink-0", it.level === "bad" ? "text-[#0f3468]" : "text-[#0ea5e9]")} />
                      <span className="truncate text-[11.5px] font-bold text-[#10233f]">{it.title}</span>
                      <span className="ml-auto shrink-0 text-[9px] text-muted-foreground">{it.time}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-[10.5px] leading-4 text-[#33445c]">{it.desc}</div>
                    <button type="button" className="mt-2 inline-flex items-center gap-1 self-start text-[10px] font-semibold text-[#0f3468] hover:underline"><Send className="h-3 w-3" /> 담당 부서 알림</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes voc-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } } @keyframes voc-fade { from { opacity: 0; transform: translateY(5px) } to { opacity: 1; transform: none } }`}</style>
      </div>

      {/* 급증 키워드 TOP10 + 워드 클라우드 */}
      <div className="flex items-stretch gap-3">
        {/* 급상승 표현 TOP 10 (우, 5개씩 자동 업데이트) */}
        <div className="order-2 flex w-[340px] shrink-0 flex-col border border-[#e6edf5] bg-white p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#10233f]">급증 키워드</span>
            <span className="rounded bg-[#0f3468] px-1.5 py-0.5 text-[8.5px] font-bold text-white">TOP 10</span>
            <span className="ml-auto tabular-nums text-[9.5px] text-muted-foreground">{kwPage * 5 + 1}–{kwPage * 5 + 5}위</span>
          </div>
          <div key={kwPage} className="flex-1 animate-[voc-fade_.5s_ease] space-y-1">
            {surgeKw.slice(kwPage * 5, kwPage * 5 + 5).map(([name, n], i) => {
              const rank = kwPage * 5 + i + 1
              return (
                <div key={name} className="flex items-center gap-2 px-2 py-2 hover:bg-[#f7fafe]">
                  <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold", rank <= 3 ? "bg-[#0f3468] text-white" : "bg-[#eef2f7] text-[#5b6b80]")}>{rank}</span>
                  <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-[#10233f]">{name}</span>
                  <span className="shrink-0 tabular-nums text-[11px] font-semibold text-[#0f3468]">{fmt(n)}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex items-center justify-center gap-1 border-t border-[#eef2f7] pt-2">
            {[0, 1].map((p) => <span key={p} className={cn("h-1.5 rounded-full transition-all", p === kwPage ? "w-4 bg-[#0f3468]" : "w-1.5 bg-[#d6deea]")} />)}
          </div>
        </div>

        {/* 워드 클라우드 (좌) */}
        <div className="order-1 flex min-w-0 flex-1 flex-col border border-[#e6edf5] bg-white p-5">
          <div className="mb-2 text-[11px] font-bold text-[#10233f]">주요 키워드 클라우드</div>
          <div className="flex flex-1 flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {CLOUD_WORDS.map(([w, size], i) => (
              <span key={i} className="leading-none" style={{ fontSize: `${size}px`, color: CLOUD_COLORS[i % CLOUD_COLORS.length], fontWeight: size >= 34 ? 800 : size >= 22 ? 700 : 500, opacity: size < 15 ? 0.7 : size < 20 ? 0.85 : 1 }}>{w}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 급증 유형 — 유형 / 주요 토픽 분리 */}
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-[#10233f]">급증 유형</div>
          <div className="overflow-hidden border border-[#dbe5f1] bg-white">
            <table className="w-full table-fixed border-collapse text-left">
              <thead className="bg-[#f7fafe] text-[10px] font-semibold text-[#3a5e8c]">
                <tr><th className="w-8 px-2 py-2 text-center">NO</th><th className="w-[88px] px-3 py-2">유형</th><th className="px-2 py-2">주요 토픽</th><th className="w-12 px-2 py-2 text-right">건수</th><th className="w-12 px-2 py-2 text-right">전일</th></tr>
              </thead>
              <tbody>
                {typeRows.map((r, i) => (
                  <tr key={i} className="h-[46px] border-t border-[#eef3f9] align-middle text-[11px]">
                    <td className="px-2 text-center text-muted-foreground">{i + 1}</td>
                    <td className="px-3 font-semibold text-[#10233f]">{r.type}</td>
                    <td className="truncate px-2 text-[10px] text-[#5b6b80]">{r.kws.join(" · ")}</td>
                    <td className="px-2 text-right font-semibold tabular-nums text-[#10233f]">{fmt(r.n)}</td>
                    <td className="px-2 text-right text-[10px] font-semibold text-[#0f3468]">▲{r.wow}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 부서별 처리 현황 — 처리완료/신규유입 + 처리율 바 */}
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-[#10233f]">부서별 처리 현황 <span className="text-[9.5px] font-normal text-muted-foreground">처리 완료 / 신규 유입</span></div>
          <div className="overflow-hidden border border-[#dbe5f1] bg-white">
            <table className="w-full table-fixed border-collapse text-left">
              <thead className="bg-[#f7fafe] text-[10px] font-semibold text-[#3a5e8c]">
                <tr><th className="w-8 px-2 py-2 text-center">NO</th><th className="px-3 py-2">부서</th><th className="w-24 px-2 py-2 text-center">처리/유입</th><th className="w-[120px] px-3 py-2">처리율</th><th className="w-14 px-2 py-2 text-center">상태</th></tr>
              </thead>
              <tbody>
                {deptRows.map((r, i) => {
                  const t = bnTone(r)
                  return (
                    <tr key={i} className="h-[46px] border-t border-[#eef3f9] align-middle text-[11px]">
                      <td className="px-2 text-center text-muted-foreground">{i + 1}</td>
                      <td className="truncate px-3 font-semibold text-[#10233f]">{r.dept}</td>
                      <td className="px-2 text-center tabular-nums text-[#10233f]"><b>{fmt(r.done)}</b><span className="text-muted-foreground"> / {fmt(r.inflow)}</span></td>
                      <td className="px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-8 shrink-0 text-right font-semibold tabular-nums" style={{ color: TONE_HEX[t] }}>{procRate(r)}%</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef2f7]"><div className="h-full rounded-full" style={{ width: `${procRate(r)}%`, background: TONE_HEX[t] }} /></div>
                        </div>
                      </td>
                      <td className="px-2 text-center"><Chip label={bnLabel(t)} level={t} dot /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
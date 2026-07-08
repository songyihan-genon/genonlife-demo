"use client"

/* ================================================================== */
/* 민원 탐지 처리 이력 — 콜 ID별 STT 기반 AI 불편 탐지·민원 평가 화면(초안)  */
/*  상단: 기간 필터 + 인사이트 대시보드(추이·등록 전환·유형별 위험)         */
/*  하단 2분할: (좌) 위험순 탐지 카드 피드 + 인라인 VOC 등록              */
/*            (우) AI 평가 기준(수정·추가) + 참고 사례                  */
/* ================================================================== */

import { Fragment, Suspense, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import {
  Siren, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Search,
  ClipboardList, Sparkles, Pencil, Plus, ArrowRight, ArrowUpRight, ArrowDownRight,
  Ban, FileText, ListChecks, ChevronDown, ChevronRight, Check, Lock, Filter, Activity, BarChart3, Info,
  Phone, Inbox, FileWarning, Bell, Mail, ShieldAlert, Building2, Headset, X, MessageSquare, Send, Lightbulb, LayoutDashboard, TrendingUp,
  Scale, Flame, Frown, Repeat, Tag, Megaphone, Landmark, Wallet, CalendarRange,
} from "lucide-react"
import {
  ResponsiveContainer, AreaChart, Area, ComposedChart, Line, Bar, CartesianGrid, XAxis, YAxis,
  Tooltip as ReTooltip, RadialBarChart, RadialBar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadarChart as ReRadarChart, Radar, ScatterChart, Scatter, ZAxis, Cell, Treemap as ReTreemap, LabelList,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AdminAnalyze, ReplyTab, MonitorTab, ReportTab, VOCS, NEED, STATUS_FLOW, type VoC } from "@/components/VocServiceView"

/* ----------------------------- 도메인 모델 ----------------------------- */

export type Sentiment = "긍정" | "보통" | "부정"
export type Level = "낮음" | "보통" | "높음" | "매우높음"
export type Urgency = "낮음" | "보통" | "높음" | "긴급"
type RegState = "비대상" | "대상" | "등록완료" | "제외" | "실패"

type Detection = {
  callId: string; customer: string; customerNo: string; datetime: string; channel: string
  sentiment: Sentiment; discomfort: number; signal: string; systemArea?: string
  risk: Level; riskScore: number; urgency: Urgency; reason: string
  vocMajor: string; vocMinor: string
  reg: RegState; vocId?: string; vocStatus?: string; failReason?: string
  summary: string; cues: string[]
}

const DETECTIONS: Detection[] = [
  {
    callId: "CL-20260612-201", customer: "김도윤", customerNo: "C-10550231", datetime: "2026.06.12 09:41", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 88, signal: "법적 언급·반복 항의", systemArea: "심사 기준", risk: "높음", riskScore: 86, urgency: "긴급",
    reason: "보험금 부지급 사유에 강한 불만을 반복 제기하고 금융감독원 민원 제기를 언급했습니다.",
    vocMajor: "보험금 청구·지급", vocMinor: "부지급·일부지급 불만", reg: "대상",
    summary: "암 진단 보험금 부지급 통보에 대해 사유 설명을 요구하며 강하게 항의, 민원 제기 의사 표명.",
    cues: ["“이거 부지급이 말이 됩니까”", "“금감원에 민원 넣겠습니다”", "“납득이 안 가요”"],
  },
  {
    callId: "CL-20260612-202", customer: "이서아", customerNo: "C-10488120", datetime: "2026.06.12 10:08", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 77, signal: "금액 불만·차이 주장", risk: "높음", riskScore: 73, urgency: "높음",
    reason: "예상보다 적은 해지환급금에 대한 불만이 크고, 안내받은 금액과 차이가 있다고 주장합니다.",
    vocMajor: "해지·환급", vocMinor: "환급금 불만", reg: "실패", failReason: "VOC 표준 필수항목(접수경로 코드) 누락",
    summary: "해지환급금이 가입 시 안내와 다르다며 불만 제기, 차액 근거 요구.",
    cues: ["“받은 금액이 너무 적어요”", "“처음 들은 거랑 다르잖아요”"],
  },
  {
    callId: "CL-20260612-203", customer: "박준서", customerNo: "C-10399201", datetime: "2026.06.12 10:35", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 83, signal: "고성·폭언", risk: "높음", riskScore: 76, urgency: "높음",
    reason: "상담 중 반말과 고성·폭언을 반복하며 응대 태도에 강하게 항의했습니다.",
    vocMajor: "상담 응대·서비스", vocMinor: "응대 불친절", reg: "등록완료", vocId: "VOC-2026-061203",
    summary: "상담 진행 중 반말·고성과 폭언을 반복, 응대 태도에 격하게 항의.",
    cues: ["“당신 일을 이따위로 할 거야?”", "“말이 되는 소리를 해”"],
  },
  {
    callId: "CL-20260612-204", customer: "최유나", customerNo: "C-10322874", datetime: "2026.06.12 11:02", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 64, signal: "오류·반복 문의", systemArea: "수금 프로세스", risk: "보통", riskScore: 55, urgency: "보통",
    reason: "자동이체가 이중 출금되어 불만 제기. 동일 건으로 VOC 기접수 이력이 확인됩니다.",
    vocMajor: "납입·수금", vocMinor: "자동이체 오류", reg: "제외", vocId: "VOC-2026-060988", vocStatus: "처리 중 · 환불 진행",
    summary: "보험료 이중 출금 확인 및 환불 요청 — 기존 접수 건 진행 중.",
    cues: ["“두 번 빠져나갔어요”", "“언제 환불되나요”"],
  },
  {
    callId: "CL-20260612-205", customer: "정민호", customerNo: "C-10277541", datetime: "2026.06.12 11:24", channel: "콜센터 IB",
    sentiment: "보통", discomfort: 46, signal: "단순 불편", risk: "낮음", riskScore: 31, urgency: "낮음",
    reason: "앱 인증 오류로 불편을 겪었으나 안내 후 해소되어 위험도가 낮습니다.",
    vocMajor: "전산·디지털", vocMinor: "인증 실패", reg: "비대상",
    summary: "모바일 앱 본인인증 실패 문의, 재시도 안내로 해결.",
    cues: ["“인증이 자꾸 안 돼요”"],
  },
  {
    callId: "CL-20260612-206", customer: "한지우", customerNo: "C-10201339", datetime: "2026.06.12 13:10", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 82, signal: "불완전판매 주장", systemArea: "판매 프로세스", risk: "높음", riskScore: 79, urgency: "높음",
    reason: "가입 시 설명과 보장 내용이 다르다며 불완전판매를 주장, 계약 재검토를 요구합니다.",
    vocMajor: "상품·가입", vocMinor: "불완전판매", reg: "대상",
    summary: "보장 범위가 설명과 다르다며 불완전판매 주장 및 보상 요구.",
    cues: ["“가입할 때 설명을 제대로 못 들었어요”", "“이건 불완전판매 아닌가요”"],
  },
  {
    callId: "CL-20260612-207", customer: "오세진", customerNo: "C-10166207", datetime: "2026.06.12 13:48", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 68, signal: "처리 지연 불만", risk: "보통", riskScore: 61, urgency: "높음",
    reason: "보험금 지급 지연에 대한 불만으로 처리 일정에 대한 즉시 확인을 요구합니다.",
    vocMajor: "보험금 청구·지급", vocMinor: "지급 지연", reg: "등록완료", vocId: "VOC-2026-061207",
    summary: "청구 후 2주 경과에도 지급되지 않아 일정 확인 요구.",
    cues: ["“2주가 지났는데 왜 안 들어와요”"],
  },
  {
    callId: "CL-20260612-208", customer: "윤하린", customerNo: "C-10120944", datetime: "2026.06.12 14:15", channel: "콜센터 IB",
    sentiment: "긍정", discomfort: 12, signal: "만족 표현", risk: "낮음", riskScore: 8, urgency: "낮음",
    reason: "안내에 만족을 표현했으며 불편·민원 신호가 확인되지 않았습니다.",
    vocMajor: "상담 응대·서비스", vocMinor: "해당 없음", reg: "비대상",
    summary: "보험금 청구 절차 안내에 만족, 추가 문의 없음.",
    cues: ["“친절하게 설명해주셔서 감사합니다”"],
  },
  {
    callId: "CL-20260612-209", customer: "강시우", customerNo: "C-10098455", datetime: "2026.06.12 14:52", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 66, signal: "지연 불만", risk: "보통", riskScore: 57, urgency: "보통",
    reason: "수익자 변경 처리가 지연되어 불만 제기. 표준 등록 중 시스템 오류가 발생했습니다.",
    vocMajor: "계약 유지·변경", vocMinor: "변경 처리 지연", reg: "실패", failReason: "VOC 연계 시스템 일시 오류(timeout)",
    summary: "수익자 변경 신청 후 처리 지연으로 진행 상황 확인 요구.",
    cues: ["“신청한 지 한참 됐는데 왜 안 바뀌어요”"],
  },
  {
    callId: "CL-20260612-210", customer: "조하준", customerNo: "C-10071520", datetime: "2026.06.12 15:18", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 81, signal: "서류 과다 불만·법적 언급", systemArea: "심사 기준", risk: "높음", riskScore: 80, urgency: "긴급",
    reason: "보험금 청구 시 요구 서류가 과도하다며 강하게 항의하고 분쟁조정 신청을 언급했습니다.",
    vocMajor: "보험금 청구·지급", vocMinor: "구비서류 과다 요구", reg: "대상",
    summary: "청구 구비서류가 과하다며 항의, 분쟁조정 신청 의사 표명.",
    cues: ["“왜 이렇게 서류를 많이 떼오라는 거예요”", "“분쟁조정 신청할 겁니다”"],
  },
  {
    callId: "CL-20260612-211", customer: "한서윤", customerNo: "C-10063391", datetime: "2026.06.12 15:40", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 72, signal: "보험료 인상 불만", risk: "보통", riskScore: 60, urgency: "보통",
    reason: "갱신 시 보험료 인상 폭이 과도하다며 불만을 제기했습니다.",
    vocMajor: "납입·수금", vocMinor: "보험료 과다 청구", reg: "대상",
    summary: "갱신 보험료 인상에 대한 불만 및 산정 근거 요구.",
    cues: ["“보험료가 너무 많이 올랐어요”"],
  },
  {
    callId: "CL-20260612-212", customer: "서지안", customerNo: "C-10052277", datetime: "2026.06.12 16:02", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 74, signal: "금리 불만·반복 문의", systemArea: "상품구조", risk: "보통", riskScore: 63, urgency: "높음",
    reason: "약관대출 금리가 높다며 불만을 제기하고 산정 방식을 반복 문의했습니다.",
    vocMajor: "상품·가입", vocMinor: "상품 설명 미흡", reg: "실패", failReason: "VOC 연계 시스템 일시 오류(timeout)",
    summary: "약관대출 금리 수준·산정 방식에 대한 불만 및 반복 문의.",
    cues: ["“대출 금리가 왜 이렇게 높아요”", "“계산이 어떻게 되는 거예요”"],
  },
  {
    callId: "CL-20260612-213", customer: "강민서", customerNo: "C-10041188", datetime: "2026.06.12 16:25", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 62, signal: "정보 오류 정정 요청", risk: "보통", riskScore: 52, urgency: "보통",
    reason: "계약 정보가 잘못 등록되어 정정을 요청했습니다.",
    vocMajor: "계약 유지·변경", vocMinor: "계약 정보 오류", reg: "등록완료", vocId: "VOC-2026-061213",
    summary: "계약 정보 오류 확인 및 정정 요청.",
    cues: ["“주소가 잘못 들어가 있어요”"],
  },
  {
    callId: "CL-20260612-214", customer: "임도경", customerNo: "C-10039042", datetime: "2026.06.12 16:48", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 58, signal: "대기시간 불만", risk: "낮음", riskScore: 38, urgency: "낮음",
    reason: "상담 연결 대기시간이 길다는 불만으로 위험도는 낮습니다.",
    vocMajor: "상담 응대·서비스", vocMinor: "대기시간 과다", reg: "비대상",
    summary: "콜센터 연결 대기시간 과다에 대한 불만.",
    cues: ["“전화 연결이 너무 오래 걸려요”"],
  },
  {
    callId: "CL-20260612-215", customer: "윤채원", customerNo: "C-10028830", datetime: "2026.06.12 17:05", channel: "콜센터 IB",
    sentiment: "보통", discomfort: 44, signal: "시스템 오류 문의", risk: "낮음", riskScore: 29, urgency: "낮음",
    reason: "홈페이지 접속 오류 문의로, 안내 후 해소되어 위험도가 낮습니다.",
    vocMajor: "전산·디지털", vocMinor: "홈페이지 장애", reg: "비대상",
    summary: "홈페이지 접속 장애 문의, 우회 경로 안내로 해결.",
    cues: ["“홈페이지가 자꾸 에러가 나요”"],
  },
  // ── 쇼케이스 리치 건(유형별 고위험 상단 노출) — 실제 감지 발화 cues 포함 ──
  {
    callId: "CL-20260613-216", customer: "박정애", customerNo: "C-10561204", datetime: "2026.06.13 09:18", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 90, signal: "환급금 불만·반복 항의", systemArea: "상품구조", risk: "매우높음", riskScore: 91, urgency: "긴급",
    reason: "10년 납입한 저축성보험 해지환급금이 납입원금보다 크게 적다며 사업비 공제에 강하게 항의했습니다.",
    vocMajor: "해지·환급", vocMinor: "환급금 과소 산정", reg: "대상",
    summary: "장기 납입 해지환급금 과소에 항의, 사업비 공제 근거와 산출 내역 설명을 요구.",
    cues: ["“10년을 부었는데 환급금이 이거밖에 안 돼요?”", "“사업비를 대체 얼마나 떼간 거예요”", "“산출 근거를 서면으로 주세요”"],
  },
  {
    callId: "CL-20260613-217", customer: "손영길", customerNo: "C-10559871", datetime: "2026.06.13 09:42", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 78, signal: "이중출금·환불 요구", systemArea: "수금 프로세스", risk: "높음", riskScore: 74, urgency: "높음",
    reason: "보험료가 이번 달에 두 번 출금되었다며 즉시 환불을 요구했습니다.",
    vocMajor: "납입·수금", vocMinor: "이중 출금·환불 지연", reg: "대상",
    summary: "자동이체 이중 출금 발생, 환불·정산 지연에 항의하며 즉시 처리 요구.",
    cues: ["“이번 달에 보험료가 두 번 빠져나갔어요”", "“당장 환불해 주세요”", "“이거 누가 책임질 거예요”"],
  },
  {
    callId: "CL-20260613-218", customer: "한복순", customerNo: "C-10557330", datetime: "2026.06.13 10:05", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 86, signal: "불완전판매 주장·신고 언급", systemArea: "판매 프로세스", risk: "매우높음", riskScore: 88, urgency: "긴급",
    reason: "가입 당시 원금 보장으로 안내받았다며 불완전판매를 주장하고 신고 의사를 밝혔습니다.",
    vocMajor: "상품·가입", vocMinor: "불완전판매 주장", reg: "대상",
    summary: "가입 시 설명 미흡·원금보장 오인 주장, 청약철회 및 불완전판매 신고 의사 표명.",
    cues: ["“가입할 때 이런 설명은 들은 적도 없어요”", "“원금은 보장된다고 했잖아요”", "“불완전판매로 신고하겠습니다”"],
  },
  {
    callId: "CL-20260613-219", customer: "오세훈", customerNo: "C-10556012", datetime: "2026.06.13 10:33", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 72, signal: "응대 불만·반복 문의", risk: "높음", riskScore: 70, urgency: "높음",
    reason: "상담 연결이 반복적으로 지연되고 응대가 불친절하다며 책임자 연결을 요구했습니다.",
    vocMajor: "상담 응대·서비스", vocMinor: "응대 태도 불만", reg: "대상",
    summary: "상담 연결 지연·응대 불만으로 책임자 연결과 사과를 요구.",
    cues: ["“세 번이나 전화했는데 자꾸 끊겨요”", "“상담원 태도가 너무 불친절해요”", "“책임자 바꿔주세요”"],
  },
  {
    callId: "CL-20260613-220", customer: "나경원", customerNo: "C-10554418", datetime: "2026.06.13 11:02", channel: "콜센터 IB",
    sentiment: "보통", discomfort: 58, signal: "변경 처리 지연", risk: "보통", riskScore: 56, urgency: "보통",
    reason: "수익자 변경 신청 후 처리가 지연되어 진행 상황을 문의했습니다.",
    vocMajor: "계약 유지·변경", vocMinor: "수익자 변경 지연", reg: "대상",
    summary: "수익자 변경 처리 지연 문의, 처리 기한 안내 요구.",
    cues: ["“수익자 변경 신청한 지 2주가 지났어요”", "“언제까지 기다려야 하나요”"],
  },
  {
    callId: "CL-20260613-221", customer: "권태영", customerNo: "C-10552207", datetime: "2026.06.13 11:30", channel: "콜센터 IB",
    sentiment: "보통", discomfort: 50, signal: "앱·인증 오류", systemArea: "디지털 채널", risk: "보통", riskScore: 48, urgency: "보통",
    reason: "모바일 앱 로그인과 전자서명이 반복 실패한다고 문의했습니다.",
    vocMajor: "전산·디지털", vocMinor: "앱 로그인·전자서명 오류", reg: "대상",
    summary: "앱 로그인·전자서명 오류 반복, 본인인증 실패로 처리 불가 호소.",
    cues: ["“앱에서 로그인이 계속 안 돼요”", "“전자서명이 자꾸 실패해요”"],
  },
  {
    callId: "CL-20260613-222", customer: "배수지", customerNo: "C-10550990", datetime: "2026.06.13 13:12", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 84, signal: "손해사정 이의·재심사 요구", systemArea: "심사 기준", risk: "매우높음", riskScore: 87, urgency: "긴급",
    reason: "손해사정 결과 일부지급에 불복하며 재심사와 손해사정사 교체를 요구했습니다.",
    vocMajor: "보험금 청구·지급", vocMinor: "손해사정 결과 이의", reg: "대상",
    summary: "손해사정 결과 불복, 일부지급 사유 이의 및 재심사·사정사 교체 요구.",
    cues: ["“손해사정 결과를 못 믿겠어요”", "“왜 일부만 지급되는 거죠”", "“재심사 요구합니다”"],
  },
  {
    callId: "CL-20260613-223", customer: "황정민", customerNo: "C-10549771", datetime: "2026.06.13 13:40", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 92, signal: "분쟁조정·법적 대응 언급", systemArea: "판매 프로세스", risk: "매우높음", riskScore: 93, urgency: "긴급",
    reason: "이미 금융감독원 분쟁조정을 신청했고 변호사 상담 중이라며 강하게 압박했습니다.",
    vocMajor: "상품·가입", vocMinor: "분쟁조정·법적 대응", reg: "대상",
    summary: "불완전판매 관련 분쟁조정 신청·법적 대응 예고, 대외기관 연계 가능성 높음.",
    cues: ["“이미 금감원에 분쟁조정 신청했습니다”", "“변호사랑 상담 중이에요”", "“법적으로 갈 겁니다”"],
  },
  {
    callId: "CL-20260613-224", customer: "고두심", customerNo: "C-10548203", datetime: "2026.06.13 14:08", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 70, signal: "지급 지연 불만", systemArea: "심사 기준", risk: "높음", riskScore: 69, urgency: "높음",
    reason: "보험금 청구 후 지급이 계속 지연된다며 처리 기한을 요구했습니다.",
    vocMajor: "보험금 청구·지급", vocMinor: "지급 지연 항의", reg: "대상",
    summary: "보험금 청구 후 지급 지연에 항의, 처리 일정과 사유 설명 요구.",
    cues: ["“청구한 지 한 달이 다 됐는데 왜 안 나와요”", "“대체 언제 지급되나요”"],
  },
  {
    callId: "CL-20260613-225", customer: "류승완", customerNo: "C-10546650", datetime: "2026.06.13 14:35", channel: "콜센터 IB",
    sentiment: "부정", discomfort: 66, signal: "안내액 상이 항의", systemArea: "상품구조", risk: "높음", riskScore: 64, urgency: "높음",
    reason: "콜센터 안내 해지환급금과 실제 환급금이 다르다며 항의했습니다.",
    vocMajor: "해지·환급", vocMinor: "안내액과 상이", reg: "대상",
    summary: "콜센터 안내 환급금과 실제 지급액 차이에 항의, 산출 명세 요구.",
    cues: ["“상담원이 알려준 금액이랑 실제가 달라요”", "“그때는 더 준다고 했잖아요”"],
  },
]

/* ----- 기간별 집계(데모) — 금일 13 / 최근 7일 68 / 최근 30일 214 ----- */
type PeriodKey = "today" | "7d" | "30d"
type Bucket = { x: string; total: number; high: number }
export type VocAgg = { major: string; total: number; high: number }
type AttnItem = { topic: string; count: number; risk: Level; caution: string } // 빈발 민원 주제 + 응대 주의 포인트
type PeriodAgg = {
  label: string; total: number
  products: { type: string; value: number }[] // 상품 유형별 민원
  voc: VocAgg[]
  attn: AttnItem[]
  kpi: { pending: number; sysImprove: number; avgRisk: number; deltaPct: number }
}

// 민원 위험 탐지 추이 — 최근 6개월(월별, 기간 필터와 무관한 장기 추이)
const MONTHLY_TREND: Bucket[] = [
  { x: "1월", total: 142, high: 41 },
  { x: "2월", total: 158, high: 47 },
  { x: "3월", total: 171, high: 52 },
  { x: "4월", total: 165, high: 49 },
  { x: "5월", total: 188, high: 58 },
  { x: "6월", total: 214, high: 67 },
]
// 민원 탐지 추이 — 최근 4주(주별)
const WEEKLY_TREND: Bucket[] = [
  { x: "3주 전", total: 44, high: 13 },
  { x: "2주 전", total: 51, high: 16 },
  { x: "1주 전", total: 47, high: 14 },
  { x: "금주", total: 58, high: 19 },
]
// 민원 탐지 추이 — 최근 7일(일별) + 평소(기대) 범위 밴드 lo~hi
const DAILY_TREND = [
  { x: "월", total: 9, high: 3, lo: 6, hi: 11 },
  { x: "화", total: 11, high: 4, lo: 7, hi: 12 },
  { x: "수", total: 8, high: 2, lo: 6, hi: 11 },
  { x: "목", total: 13, high: 5, lo: 7, hi: 12 }, // 평소 상회
  { x: "금", total: 15, high: 6, lo: 8, hi: 13 }, // 평소 상회(급증)
  { x: "토", total: 7, high: 2, lo: 4, hi: 9 },
  { x: "일", total: 6, high: 2, lo: 3, hi: 8 },
]

// 응대 주의 포인트(주제별 가이드 — 기간 무관 공통)
const CAUTION = {
  claim: "부지급 사유를 약관 근거와 함께 명확히 설명하고 처리 일정을 안내하세요.",
  surrender: "가입 경과 연수별 환급률을 확인하고(100% 일괄 안내 금지), 보장 종료를 먼저 고지하세요.",
  debit: "이중 출금 여부와 변경 적용일(출금 5영업일 전)을 정확히 안내하세요.",
  product: "보장 범위·면책 사항을 재확인하고 가입 시 설명 이력을 점검하세요.",
}

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "금일" },
  { key: "7d", label: "최근 7일" },
  { key: "30d", label: "최근 30일" },
]

const PERIOD_DATA: Record<PeriodKey, PeriodAgg> = {
  today: {
    label: "금일", total: 16,
    voc: [
      { major: "보험금 청구·지급", total: 4, high: 2 }, { major: "상담 응대·서비스", total: 3, high: 0 },
      { major: "해지·환급", total: 2, high: 1 }, { major: "상품·가입", total: 1, high: 1 },
      { major: "납입·수금", total: 1, high: 0 }, { major: "계약 유지·변경", total: 1, high: 1 }, { major: "전산·디지털", total: 1, high: 0 },
    ],
    attn: [
      { topic: "보험금 부지급·지급 지연", count: 4, risk: "높음", caution: CAUTION.claim },
      { topic: "해지환급금 안내", count: 2, risk: "높음", caution: CAUTION.surrender },
      { topic: "자동이체·수금", count: 1, risk: "보통", caution: CAUTION.debit },
      { topic: "상품 설명·불완전판매", count: 1, risk: "보통", caution: CAUTION.product },
    ],
    products: [
      { type: "종신·정기", value: 3 }, { type: "건강·암", value: 3 }, { type: "실손의료비", value: 4 },
      { type: "연금·저축", value: 2 }, { type: "변액·기타", value: 1 },
    ],
    kpi: { pending: 3, sysImprove: 3, avgRisk: 58, deltaPct: 12 },
  },
  "7d": {
    label: "최근 7일", total: 68,
    voc: [
      { major: "보험금 청구·지급", total: 18, high: 7 }, { major: "상담 응대·서비스", total: 14, high: 3 },
      { major: "해지·환급", total: 11, high: 5 }, { major: "납입·수금", total: 9, high: 2 },
      { major: "상품·가입", total: 8, high: 4 }, { major: "계약 유지·변경", total: 5, high: 1 }, { major: "전산·디지털", total: 3, high: 0 },
    ],
    attn: [
      { topic: "보험금 부지급·지급 지연", count: 18, risk: "높음", caution: CAUTION.claim },
      { topic: "해지환급금 안내", count: 11, risk: "높음", caution: CAUTION.surrender },
      { topic: "자동이체·수금", count: 9, risk: "보통", caution: CAUTION.debit },
      { topic: "상품 설명·불완전판매", count: 8, risk: "보통", caution: CAUTION.product },
    ],
    products: [
      { type: "종신·정기", value: 18 }, { type: "건강·암", value: 14 }, { type: "실손의료비", value: 16 },
      { type: "연금·저축", value: 12 }, { type: "변액·기타", value: 8 },
    ],
    kpi: { pending: 11, sysImprove: 14, avgRisk: 55, deltaPct: 8 },
  },
  "30d": {
    label: "최근 30일", total: 214,
    voc: [
      { major: "보험금 청구·지급", total: 58, high: 22 }, { major: "상담 응대·서비스", total: 44, high: 9 },
      { major: "해지·환급", total: 33, high: 14 }, { major: "납입·수금", total: 29, high: 6 },
      { major: "상품·가입", total: 24, high: 11 }, { major: "계약 유지·변경", total: 18, high: 4 }, { major: "전산·디지털", total: 8, high: 1 },
    ],
    attn: [
      { topic: "보험금 부지급·지급 지연", count: 58, risk: "높음", caution: CAUTION.claim },
      { topic: "해지환급금 안내", count: 33, risk: "높음", caution: CAUTION.surrender },
      { topic: "자동이체·수금", count: 29, risk: "보통", caution: CAUTION.debit },
      { topic: "상품 설명·불완전판매", count: 24, risk: "보통", caution: CAUTION.product },
    ],
    products: [
      { type: "종신·정기", value: 56 }, { type: "건강·암", value: 44 }, { type: "실손의료비", value: 52 },
      { type: "연금·저축", value: 38 }, { type: "변액·기타", value: 24 },
    ],
    kpi: { pending: 17, sysImprove: 46, avgRisk: 54, deltaPct: -5 },
  },
}

type Criterion = {
  id: string; name: string; desc: string
  stage: "불편 탐지" | "위험도 평가" | "긴급도 산정" | "VOC 분류"
  ai: "적용 가능" | "검토 필요" | "제한적"; validity: "검증 완료" | "검토 중"; enabled: boolean
}
const CRITERIA_SEED: Criterion[] = [
  { id: "c1", name: "부정 감정어 탐지", desc: "욕설·불만 표현·반복 항의 등 부정 발화 비율로 불편도(0-100)를 정량 산정합니다.", stage: "불편 탐지", ai: "적용 가능", validity: "검증 완료", enabled: true },
  { id: "c2", name: "민원 발생 위험도 평가", desc: "불편 강도·요구 수준·반복 문의·법적/감독기관 언급을 가중 합산해 위험도를 평가합니다.", stage: "위험도 평가", ai: "적용 가능", validity: "검증 완료", enabled: true },
  { id: "c3", name: "당사 제도 개선 신호 탐지", desc: "개인 응대가 아닌 제도·프로세스 자체에 대한 불만 패턴을 식별합니다.", stage: "위험도 평가", ai: "검토 필요", validity: "검토 중", enabled: true },
  { id: "c4", name: "민원 처리 긴급도 산정", desc: "법적 대응·감독기관 언급·즉시 처리 요구가 있으면 긴급도를 상향합니다.", stage: "긴급도 산정", ai: "적용 가능", validity: "검증 완료", enabled: true },
  { id: "c5", name: "VOC 유형 자동 분류", desc: "발화 주제를 VOC 대분류 7종·중분류 55종 체계에 매핑합니다.", stage: "VOC 분류", ai: "적용 가능", validity: "검증 완료", enabled: true },
  { id: "c6", name: "중복 접수 필터", desc: "기존 VOC 접수 고객을 식별해 등록 대상에서 제외하고 진행 상태를 표시합니다.", stage: "VOC 분류", ai: "적용 가능", validity: "검증 완료", enabled: true },
]
const REFERENCE_CASES: { cue: string; result: string; risk: Level }[] = [
  { cue: "“금감원에 민원 넣겠습니다”", result: "법적/감독기관 언급 → 위험도·긴급도 상향, 등록 대상 선별", risk: "높음" },
  { cue: "“두 번 빠져나갔어요 / 환불 언제”", result: "기존 VOC 접수 확인 → 등록 제외 + 진행 상태 안내", risk: "보통" },
  { cue: "“친절하게 설명해주셔서 감사합니다”", result: "긍정 감정 → 불편 미탐지, 등록 비대상", risk: "낮음" },
]

/* ----------------------------- 표기 도우미 ----------------------------- */

export type Tone = "good" | "warn" | "bad" | "muted"
export function tone(level: Tone) {
  return level === "bad" ? "border-red-200 bg-red-50 text-red-600"
    : level === "warn" ? "border-amber-200 bg-amber-50 text-amber-700"
    : level === "good" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-50 text-slate-500"
}
// 차분한 통일 태그 — 무채색 칩. 의미색 점은 dot 지정 시(위험·긴급)에만, 아이콘은 등록 상태에만
export function Chip({ label, level, icon: Icon, dot, sm }: { label: string; level: Tone; icon?: typeof Siren; dot?: boolean; sm?: boolean }) {
  const accent = level === "bad" ? "text-red-500" : level === "warn" ? "text-amber-500" : level === "good" ? "text-emerald-500" : "text-slate-400"
  const dotc = level === "bad" ? "bg-red-500" : level === "warn" ? "bg-amber-500" : level === "good" ? "bg-emerald-500" : "bg-slate-300"
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-sm border border-[#e2eaf4] bg-[#f7fafe] font-medium text-[#475569]", sm ? "gap-0.5 px-1 py-px text-[8.5px]" : "gap-1 px-1.5 py-0.5 text-[10px]")}>
      {Icon ? <Icon className={cn(sm ? "h-2.5 w-2.5" : "h-3 w-3", accent)} /> : dot ? <span className={cn("shrink-0 rounded-full", sm ? "h-1 w-1" : "h-1.5 w-1.5", dotc)} /> : null}
      {label}
    </span>
  )
}
const sentimentLevel = (s: Sentiment): Tone => (s === "부정" ? "bad" : s === "보통" ? "warn" : "good")
export const levelTone = (l: Level): Tone => (l === "높음" || l === "매우높음" ? "bad" : l === "보통" ? "warn" : "muted")
export const urgencyTone = (u: Urgency): Tone => (u === "긴급" ? "bad" : u === "높음" ? "warn" : "muted")

export function ScoreBar({ value, level }: { value: number; level: Tone }) {
  const c = level === "bad" ? "bg-red-500" : level === "warn" ? "bg-amber-500" : level === "good" ? "bg-emerald-500" : "bg-slate-300"
  return <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eef2f7]"><div className={cn("h-full rounded-full", c)} style={{ width: `${value}%` }} /></div>
}

/* ----------------------------- 시각화 ----------------------------- */

export function DashCard({ title, sub, right, children, className }: { title: string; sub?: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#e6edf5] bg-white p-2.5", className)}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-[#10233f]">{title}</span>
        {sub ? <span className="text-[9px] text-muted-foreground">{sub}</span> : null}
        {right ? <span className="ml-auto">{right}</span> : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center">{children}</div>
    </div>
  )
}

// 화면 분할용 패널 — 카드 아닌 구분선 기반 영역(한 줄 배치)
function Panel({ title, sub, right, children, grow, className }: { title: string; sub?: string; right?: React.ReactNode; children: React.ReactNode; grow?: number; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col px-4 first:pl-0 last:pr-0", className)} style={{ flexGrow: grow ?? 1, flexShrink: 1, flexBasis: 0 }}>
      <div className="mb-1 flex items-center gap-1.5">
        <span className="whitespace-nowrap text-[11px] font-bold text-[#10233f]">{title}</span>
        {sub ? <span className="truncate text-[9px] text-muted-foreground">{sub}</span> : null}
        {right ? <span className="ml-auto shrink-0">{right}</span> : null}
      </div>
      <div className="flex flex-1 flex-col justify-center">{children}</div>
    </div>
  )
}

// 추이 — 전체 탐지(막대 + 건수 라벨) + 위험 높음(라인)
function TrendChart({ points }: { points: Bucket[] }) {
  const W = 340, H = 116, padX = 12, padTop = 16, padBot = 16
  const baseY = H - padBot, innerH = baseY - padTop
  const max = Math.max(...points.map((p) => p.total), 1)
  const slot = (W - padX * 2) / points.length
  const cx = (i: number) => padX + slot * i + slot / 2
  const barW = Math.min(26, slot * 0.5)
  const y = (v: number) => baseY - (v / max) * innerH
  const highLine = points.map((p, i) => `${cx(i)},${y(p.high)}`).join(" ")
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[120px] w-full">
      <line x1={padX} y1={baseY} x2={W - padX} y2={baseY} stroke="#e6edf5" strokeWidth={1} />
      {points.map((p, i) => (
        <g key={i}>
          <rect x={cx(i) - barW / 2} y={y(p.total)} width={barW} height={baseY - y(p.total)} rx={2} fill="#9bb9d8" />
          <text x={cx(i)} y={y(p.total) - 3} textAnchor="middle" className="fill-[#0b4f91]" style={{ fontSize: 8.5, fontWeight: 700 }}>{p.total}</text>
          <text x={cx(i)} y={H - 4} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 8 }}>{p.x}</text>
        </g>
      ))}
      <polyline points={highLine} fill="none" stroke="#ef4444" strokeWidth={1.8} strokeLinejoin="round" />
      {points.map((p, i) => <circle key={`c${i}`} cx={cx(i)} cy={y(p.high)} r={2.2} fill="#ef4444" />)}
    </svg>
  )
}

// 위험도 분포 도넛
export function Donut({ segments, centerTop, centerSub, hideLegend, size = 78 }: { segments: { label: string; value: number; color: string }[]; centerTop: string; centerSub: string; hideLegend?: boolean; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  let acc = 0
  const stops = segments.filter((s) => s.value > 0).map((s) => {
    const a = (acc / total) * 360; acc += s.value; const b = (acc / total) * 360
    return `${s.color} ${a}deg ${b}deg`
  }).join(", ")
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative rounded-full" style={{ height: size, width: size, background: stops ? `conic-gradient(${stops})` : "#eef2f7" }}>
        <div className="absolute flex flex-col items-center justify-center rounded-full bg-white" style={{ inset: Math.round(size * 0.14) }}>
          <span className="font-bold leading-none text-[#10233f]" style={{ fontSize: Math.max(12, Math.round(size * 0.18)) }}>{centerTop}</span>
          <span className="mt-0.5 text-[8px] text-muted-foreground">{centerSub}</span>
        </div>
      </div>
      {hideLegend ? null : (
        <div className="w-full space-y-0.5">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-[9.5px]">
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: s.color }} />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="ml-auto font-semibold tabular-nums text-[#10233f]">{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// VOC 유형 — 건수 막대 + 위험 높음 비중(빨강)
export function VocRiskBars({ data }: { data: VocAgg[] }) {
  const max = Math.max(...data.map((d) => d.total), 1)
  return (
    <div className="space-y-1">
      {data.map((d) => (
        <div key={d.major} className="flex items-center gap-2 text-[10px]">
          <span className="w-[92px] shrink-0 truncate text-muted-foreground">{d.major}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-[#eef2f7]">
            <div className="flex h-full overflow-hidden rounded-sm" style={{ width: `${(d.total / max) * 100}%` }}>
              <div className="h-full bg-[#9bb9d8]" style={{ width: `${100 - (d.total ? (d.high / d.total) * 100 : 0)}%` }} />
              <div className="h-full bg-red-500" style={{ width: `${d.total ? (d.high / d.total) * 100 : 0}%` }} />
            </div>
          </div>
          <span className="w-12 shrink-0 text-right tabular-nums text-[#10233f]">{d.total}<span className="text-red-500"> · {d.high}</span></span>
        </div>
      ))}
      <div className="flex items-center gap-1 pt-0.5 text-[8.5px] text-muted-foreground"><span className="h-2 w-2 rounded-sm bg-[#9bb9d8]" /> 전체 · <span className="h-2 w-2 rounded-sm bg-red-500" /> 민원 건수(우측)</div>
    </div>
  )
}

// 인입 플로우(고객여정) — 채널 → 유형 분류 → 담당 부서 (Sankey)
const FLOW_CHANNELS = [
  { k: "콜센터", n: 520, c: "#0f3468" },
  { k: "이메일", n: 240, c: "#2f6bb0" },
  { k: "모바일 챗봇", n: 180, c: "#15a0a0" },
  { k: "대외기관 민원", n: 60, c: "#7cc0c0" },
]
const FLOW_TYPES = ["보험금 청구·지급", "해지·환급", "상품·가입", "계약 유지·변경", "납입·수금", "상담 응대·서비스", "전산·디지털"]
const FLOW_W: Record<string, number[]> = {
  "콜센터": [0.30, 0.18, 0.10, 0.12, 0.10, 0.13, 0.07],
  "이메일": [0.22, 0.24, 0.16, 0.10, 0.08, 0.12, 0.08],
  "모바일 챗봇": [0.10, 0.10, 0.08, 0.14, 0.16, 0.18, 0.24],
  "대외기관 민원": [0.36, 0.22, 0.20, 0.06, 0.02, 0.12, 0.02],
}
function InflowFlow() {
  const W = 760, H = 252, nodeW = 11, gap = 6, padY = 14
  const grand = FLOW_CHANNELS.reduce((a, c) => a + c.n, 0)
  const scale = (H - padY * 2 - gap * 6) / grand
  let cy = padY; const chN = FLOW_CHANNELS.map((c) => { const h = c.n * scale; const o = { ...c, y: cy, h }; cy += h + gap; return o })
  const tyVal = FLOW_TYPES.map((_, j) => FLOW_CHANNELS.reduce((a, c) => a + c.n * FLOW_W[c.k][j], 0))
  let tyy = padY; const tyN = FLOW_TYPES.map((t, j) => { const h = tyVal[j] * scale; const o = { k: t, y: tyy, h, val: tyVal[j], dept: DEPT_BY_TYPE[t] ?? "고객만족부" }; tyy += h + gap; return o })
  const deptOrder: string[] = []; FLOW_TYPES.forEach((t) => { const d = DEPT_BY_TYPE[t] ?? "고객만족부"; if (!deptOrder.includes(d)) deptOrder.push(d) })
  const deVal: Record<string, number> = {}; tyN.forEach((n) => { deVal[n.dept] = (deVal[n.dept] ?? 0) + n.val })
  let dy = padY; const deN = deptOrder.map((d) => { const h = deVal[d] * scale; const o = { k: d, y: dy, h, val: deVal[d] }; dy += h + gap; return o })
  const x1 = 76, x2 = W / 2 - nodeW / 2, x3 = W - 76 - nodeW
  const chOut: number[] = chN.map(() => 0); const tyIn: number[] = tyN.map(() => 0)
  const links1: { sx: number; sy: number; tx: number; ty: number; t: number; c: string }[] = []
  chN.forEach((c, ci) => FLOW_TYPES.forEach((_, j) => {
    const t = c.n * FLOW_W[c.k][j] * scale; if (t < 0.4) return
    links1.push({ sx: x1 + nodeW, sy: chN[ci].y + chOut[ci] + t / 2, tx: x2, ty: tyN[j].y + tyIn[j] + t / 2, t, c: c.c })
    chOut[ci] += t; tyIn[j] += t
  }))
  const TYPE_TONES = ["#264f86", "#2f6bb0", "#4a82c2", "#6398cf", "#7eaedb", "#99c2e6", "#b3d2ef"]
  const deIn: Record<string, number> = {}
  const links2 = tyN.map((n, j) => { const t = n.val * scale; const di = deN.findIndex((d) => d.k === n.dept); const l = { sx: x2 + nodeW, sy: n.y + n.h / 2, tx: x3, ty: deN[di].y + (deIn[n.dept] ?? 0) + t / 2, t, c: TYPE_TONES[j % TYPE_TONES.length] }; deIn[n.dept] = (deIn[n.dept] ?? 0) + t; return l })
  const path = (l: { sx: number; sy: number; tx: number; ty: number }) => `M${l.sx},${l.sy} C${(l.sx + l.tx) / 2},${l.sy} ${(l.sx + l.tx) / 2},${l.ty} ${l.tx},${l.ty}`
  const lbl = (x: number, anchor: "start" | "end", y: number, text: string) => <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize="8.5" fill="#33445c" stroke="#fff" strokeWidth={2.4} paintOrder="stroke" style={{ paintOrder: "stroke" }}>{text}</text>
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <text x={x1} y={6} textAnchor="start" fontSize="8" fontWeight={700} fill="#9aa6b6">채널</text>
      <text x={x2 + nodeW / 2} y={6} textAnchor="middle" fontSize="8" fontWeight={700} fill="#9aa6b6">유형 분류</text>
      <text x={x3 + nodeW} y={6} textAnchor="end" fontSize="8" fontWeight={700} fill="#9aa6b6">담당 부서</text>
      {links1.map((l, i) => <path key={"a" + i} d={path(l)} stroke={l.c} strokeWidth={Math.max(0.6, l.t)} fill="none" opacity={0.2} />)}
      {links2.map((l, i) => <path key={"b" + i} d={path(l)} stroke={l.c} strokeWidth={Math.max(0.6, l.t)} fill="none" opacity={0.32} />)}
      {chN.map((n, i) => <g key={"c" + i}><rect x={x1} y={n.y} width={nodeW} height={Math.max(1, n.h)} rx={2} fill={n.c} />{lbl(x1 - 6, "end", n.y + n.h / 2, n.k)}</g>)}
      {tyN.map((n, i) => <g key={"t" + i}><rect x={x2} y={n.y} width={nodeW} height={Math.max(1, n.h)} rx={2} fill={TYPE_TONES[i % TYPE_TONES.length]} />{lbl(x2 + nodeW + 5, "start", n.y + n.h / 2, n.k)}</g>)}
      {deN.map((n, i) => <g key={"d" + i}><rect x={x3} y={n.y} width={nodeW} height={Math.max(1, n.h)} rx={2} fill="#0c8f78" />{lbl(x3 - 6, "end", n.y + n.h / 2, n.k)}</g>)}
    </svg>
  )
}

// 상담 주의 유형 — 빈발 민원 주제별 건수 + 응대 시 주의 포인트(콜 가이드)
function AttnInsight({ data }: { data: AttnItem[] }) {
  const dot = (r: Level) => (r === "높음" || r === "매우높음" ? "bg-red-500" : r === "보통" ? "bg-amber-500" : "bg-slate-300")
  return (
    <div className="space-y-1.5">
      {data.map((a) => (
        <div key={a.topic} className="rounded-md border border-[#eef2f7] bg-[#fbfdff] px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot(a.risk))} />
            <span className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-[#10233f]">{a.topic}</span>
            <span className="shrink-0 rounded-sm bg-[#eef4fb] px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#0b4f91]">{a.count}건</span>
          </div>
          <div className="mt-0.5 flex items-start gap-1 text-[9px] leading-[1.45] text-muted-foreground">
            <AlertTriangle className="mt-[1px] h-2.5 w-2.5 shrink-0 text-amber-500" />{a.caution}
          </div>
        </div>
      ))}
    </div>
  )
}

export function MiniKpi({ label, value, level, delta }: { label: string; value: string; level?: Tone; delta?: number }) {
  return (
    <div className="flex flex-col rounded-lg border border-[#e6edf5] bg-white px-3 py-1.5">
      <span className="text-[9.5px] text-muted-foreground">{label}</span>
      <span className="mt-0.5 flex items-center gap-1">
        <span className={cn("text-[15px] font-bold tabular-nums leading-none",
          level === "bad" ? "text-red-600" : level === "warn" ? "text-amber-600" : level === "good" ? "text-emerald-600" : "text-[#10233f]")}>{value}</span>
        {delta !== undefined ? (
          <span className={cn("inline-flex items-center text-[9px] font-semibold", delta >= 0 ? "text-red-500" : "text-emerald-600")}>
            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(delta)}%
          </span>
        ) : null}
      </span>
    </div>
  )
}

/* ================================================================== */
/* 메인                                                                */
/* ================================================================== */

const urgencyWeight: Record<Urgency, number> = { 긴급: 30, 높음: 20, 보통: 10, 낮음: 0 }

/* ================================================================== */
/* VoC 통합 분석 — 콜(STT 탐지) + 이메일/대외기관 민원(VOCS) 단일 인입 큐         */
/*  탐지·평가 → 유형 분류 → 부서 매핑/배정(설정) → 직접 민원 처리           */
/* ================================================================== */

const CH_ICON: Record<string, typeof Phone> = { 콜센터: Phone, 이메일: Inbox, "모바일 챗봇": MessageSquare, "대외기관 민원": FileWarning }
const DEPTS = ["보상서비스부", "고객만족부", "수금관리부", "디지털서비스부", "계약관리부", "준법감시부"]
// 유형 → 담당 부서(주). 같은 유형이라도 디테일에 따라 다른 부서로 갈 수 있어(ALT_DEPT) 부서별 칸반은 유형별과 다른 묶음을 보여준다.
const DEPT_BY_TYPE: Record<string, string> = {
  "보험금 청구·지급": "보상서비스부",
  "상담 응대·서비스": "고객만족부",
  "해지·환급": "고객만족부",
  "납입·수금": "수금관리부",
  "상품·가입": "준법감시부",
  "계약 유지·변경": "계약관리부",
  "전산·디지털": "디지털서비스부",
}
// 유형 → 부서 가중 분배(다대다) — 한 유형이 성격에 따라 여러 부서로 이관
const TYPE_DEPT_MIX: Record<string, [string, number][]> = {
  "보험금 청구·지급": [["보상서비스부", 0.74], ["준법감시부", 0.16], ["고객만족부", 0.10]],
  "해지·환급": [["고객만족부", 0.58], ["계약관리부", 0.30], ["준법감시부", 0.12]],
  "상품·가입": [["준법감시부", 0.50], ["계약관리부", 0.34], ["고객만족부", 0.16]],
  "계약 유지·변경": [["계약관리부", 0.70], ["고객만족부", 0.20], ["수금관리부", 0.10]],
  "납입·수금": [["수금관리부", 0.74], ["계약관리부", 0.16], ["고객만족부", 0.10]],
  "상담 응대·서비스": [["고객만족부", 0.80], ["준법감시부", 0.12], ["보상서비스부", 0.08]],
  "전산·디지털": [["디지털서비스부", 0.80], ["고객만족부", 0.20]],
}
// 위험 등급(매우높음 포함) 표기
const riskHexU = (r: string) => (r === "매우높음" ? "#0f3468" : r === "높음" ? "#2f6bb0" : r === "보통" ? "#f59e0b" : "#94a3b8")
// 잠재 위험 막대 — 빨강/주황 대신 네이비·블루·그레이 톤
const riskBarHex = (r: string) => (r === "매우높음" ? "#0f3468" : r === "높음" ? "#2f6bb0" : r === "보통" ? "#5b8fc9" : "#cbd5e1")
// 위험 전이 바 — 등급별 라이트→다크 그라데이션
const riskBarGrad = (r: string) => (r === "매우높음" ? "linear-gradient(90deg,#3b7ac0,#0f3468)" : r === "높음" ? "linear-gradient(90deg,#7aa9dc,#2f6bb0)" : r === "보통" ? "linear-gradient(90deg,#aecae6,#5b8fc9)" : "linear-gradient(90deg,#e8edf4,#cbd5e1)")
// 문의 식별자 — 모든 건은 '문의' 영역(VOC 접두어를 INQ로 표기)
const inqId = (id: string) => id.replace(/^VOC-?/, "INQ-")
const statusToneU = (s: string): Tone => (s === "처리 완료" ? "good" : s === "처리 중" || s === "부서 배정" ? "warn" : "muted")
const urgencyFromRisk = (r: string): Urgency => (r === "매우높음" ? "긴급" : r === "높음" ? "높음" : r === "보통" ? "보통" : "낮음")
const expFromSentiment = (s: Sentiment): string => (s === "긍정" ? "칭찬" : s === "부정" ? "불만" : "단순문의")
const statusFromReg = (reg: RegState): string => (reg === "등록완료" ? "부서 배정" : reg === "제외" ? "처리 중" : "분석 완료")

/* 단일 인입 모델 — 두 소스를 하나의 큐로 정규화 */
type Inflow = {
  key: string; source: "detect" | "voc"; channel: string
  id: string; customer: string; datetime: string
  vocType: string; vocMinor?: string; exp: string
  risk: string; score: number; urgency: Urgency
  dept: string; status: string; summary: string
  keywords: string[]; triggers: string[]; need?: string
  cause: "상담 품질" | "제도 개선" | "개별 민원"; systemArea?: string
  rawDetection?: Detection; rawVoc?: VoC
}
// 민원 원인 분류 — 상담 품질(서비스 불만족) / 제도 개선 영역 / 개별 민원
const isQuality = (vocType: string) => vocType === "상담 응대·서비스" || vocType === "응대·서비스"
// 데모 인입 일시를 오늘 기준으로 동적 관리 — 시드의 고정일(기준 06.13)을 실제 오늘로 평행 이동
const CD_DAY_MS = 86400000
const CD_REAL_TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })()
const CD_BASIS_MS = new Date(2026, 5, 13).getTime() // 시드 데이터상 최신일(금일 기준) = 2026.06.13
const cdPad = (n: number) => String(n).padStart(2, "0")
const CD_TODAY_MD = `${cdPad(CD_REAL_TODAY.getMonth() + 1)}.${cdPad(CD_REAL_TODAY.getDate())}` // 오늘 MM.DD
// "2026.06.12 09:41" / "06.12 09:41" → 오늘 기준 상대 일시로 변환(06.13→오늘, 06.12→어제 …)
function remapCDDate(dt: string): string {
  const [dp, tp = ""] = dt.split(" ")
  const p = dp.split(".").map(Number)
  const [y, mo, da] = p.length === 3 ? p : [2026, p[0], p[1]]
  const shifted = new Date(CD_REAL_TODAY.getTime() + (new Date(y, mo - 1, da).getTime() - CD_BASIS_MS))
  const out = `${shifted.getFullYear()}.${cdPad(shifted.getMonth() + 1)}.${cdPad(shifted.getDate())}`
  return tp ? `${out} ${tp}` : out
}

const fromDetection = (d: Detection): Inflow => ({
  key: `d:${d.callId}`, source: "detect", channel: "콜센터",
  id: d.callId, customer: d.customer, datetime: remapCDDate(d.datetime).slice(5),
  vocType: d.vocMajor, vocMinor: d.vocMinor, exp: expFromSentiment(d.sentiment),
  risk: d.risk, score: d.riskScore, urgency: d.urgency,
  dept: DEPT_BY_TYPE[d.vocMajor] ?? "고객만족부", status: statusFromReg(d.reg),
  summary: d.summary, keywords: d.systemArea ? [d.systemArea] : [], triggers: [d.signal],
  cause: d.systemArea ? "제도 개선" : isQuality(d.vocMajor) ? "상담 품질" : "개별 민원", systemArea: d.systemArea,
  rawDetection: d,
})
const fromVoc = (v: VoC): Inflow => ({
  key: `v:${v.id}`, source: "voc", channel: v.channel,
  id: v.id, customer: v.customer, datetime: v.datetime,
  vocType: v.vocType, exp: v.exp,
  risk: v.risk, score: v.score, urgency: urgencyFromRisk(v.risk),
  dept: v.dept, status: v.status,
  summary: v.summary, keywords: v.keywords, triggers: v.triggers, need: NEED[v.id],
  cause: isQuality(v.vocType) ? "상담 품질" : "개별 민원",
  rawVoc: v,
})
// 콜 = STT 탐지 피드 / 이메일·대외기관 민원 = 접수 VoC (콜센터 VOCS는 탐지 피드와 중복되어 제외)
// 상세 시드(풍부한 상세 패널용) — 콜 STT 탐지 + 비(非)콜 VoC
const SEED_INFLOW: Inflow[] = [
  ...DETECTIONS.map(fromDetection),
  ...VOCS.filter((v) => v.channel !== "콜센터" && v.channel !== "대외기관 민원").map(fromVoc),
].filter((r) => r.exp !== "칭찬") // 만족/칭찬 건은 잠재민원 큐에서 제외
// 합성 VoC 큐 — 채널별 VoC 목표(CH_STATS와 정합)까지 시드 부족분을 채워 큐를 집계 규모로 맞춤.
// 위험 분포(고위험 22% / 보통 44% / 낮음 33%)와 처리 상태(미배정 35% / 배정 25% / 처리중 20% / 완료 20%)를 인덱스로 분배.
const Q_NAMES = ["김영수", "이정희", "박상철", "최순자", "정만수", "강미경", "조병호", "윤숙자", "장태식", "임경자", "한동근", "오말순", "서동철", "나정숙", "권혁수", "문경자", "배상우", "신영호", "유미정", "남기철", "천복순", "곽재근", "황보영", "마성호", "구본식", "노미숙", "류재만", "백승현", "안경자", "양동수", "엄정화", "위성훈", "전말례", "정해숙", "조윤발", "채광주", "표인봉", "하정우", "허금자", "홍순길", "고영태"]
const Q_TYPES = ["보험금 청구·지급", "보험금 청구·지급", "보험금 청구·지급", "상담 응대·서비스", "상담 응대·서비스", "납입·수금", "납입·수금", "상품·가입", "상품·가입", "해지·환급", "계약 유지·변경", "전산·디지털"]
const Q_SUMMARY: Record<string, string> = {
  "보험금 청구·지급": "보험금 지급 지연·부지급 사유 문의",
  "상담 응대·서비스": "상담 연결 지연·응대 불만",
  "납입·수금": "보험료 자동이체·수금·환불 문의",
  "상품·가입": "가입 상품 설명 미흡 항의",
  "해지·환급": "해지환급금 산출 기준 문의",
  "계약 유지·변경": "계약·수익자 변경 문의",
  "전산·디지털": "앱 로그인·전자서명 오류",
}
const Q_PREFIX: Record<string, string> = { 콜센터: "CL", 이메일: "EM", "모바일 챗봇": "CB", "대외기관 민원": "EX" }
// 같은 유형이라도 디테일(분쟁 소지·보전 검토 등)에 따라 다른 부서로 배정될 수 있음 → 대체 부서.
// AI는 기본(주) 부서를 배정하되 일부 건은 대체 부서로 배정 → 유형별 칸반 한 컬럼에 여러 부서가 섞이고, 사람이 검토·확정.
const ALT_DEPT: Record<string, string> = {
  "보험금 청구·지급": "준법감시부", "상담 응대·서비스": "보상서비스부", "납입·수금": "계약관리부",
  "상품·가입": "계약관리부", "해지·환급": "계약관리부", "계약 유지·변경": "고객만족부", "전산·디지털": "고객만족부",
}
const RISK_RANK: Record<string, number> = { 매우높음: 3, 높음: 2, 보통: 1, 낮음: 0 }
// 유형별 카드에 표시할 '세부 사유' — 같은 유형 안에서도 건마다 달라 의미 있는 값. (유형 태그 중복 대신)
const Q_MINOR: Record<string, string[]> = {
  "보험금 청구·지급": ["지급 지연 항의", "부지급 사유 이의", "지급액 산정 불만", "손해사정 결과 이의", "서류 보완 반복"],
  "상담 응대·서비스": ["상담 연결 지연", "응대 태도 불만", "콜백 누락"],
  "납입·수금": ["자동이체 오류", "이중 출금", "환불·정산 지연", "납입 안내 누락"],
  "상품·가입": ["설명 미흡 항변", "청약 철회 요구", "적합성 문제 제기"],
  "해지·환급": ["환급금 과소 산정", "해지 처리 지연", "공제액 설명 요구"],
  "계약 유지·변경": ["수익자 변경", "납입 방법 변경", "보전 처리 지연"],
  "전산·디지털": ["앱 로그인 오류", "전자서명 실패", "본인인증 오류"],
}
// 합성 카드 상세용 감지 발화(cues) — 유형별 실제 발화 예시(상세 패널·근거 표시)
const Q_CUES: Record<string, string[]> = {
  "보험금 청구·지급": ["“보험금이 왜 이것밖에 안 나와요”", "“청구한 지 한참인데 감감무소식이에요”", "“부지급 사유를 납득 못 하겠어요”"],
  "상담 응대·서비스": ["“상담원이 너무 불친절해요”", "“연결이 계속 지연돼요”", "“콜백 준다더니 연락이 없어요”"],
  "납입·수금": ["“보험료가 또 빠져나갔어요”", "“환불은 대체 언제 되나요”", "“이중으로 출금됐어요”"],
  "상품·가입": ["“가입할 때 이런 설명 못 들었어요”", "“이런 상품인 줄 몰랐어요”", "“원금 보장된다고 했잖아요”"],
  "해지·환급": ["“환급금이 너무 적어요”", "“낸 돈에 비해 말이 안 돼요”", "“사업비를 왜 이렇게 떼가요”"],
  "계약 유지·변경": ["“변경 신청이 처리가 안 됐어요”", "“언제까지 기다려야 하죠”"],
  "전산·디지털": ["“앱이 자꾸 오류가 나요”", "“로그인이 안 돼요”", "“전자서명이 실패해요”"],
}
function genVoc(channel: string, count: number): Inflow[] {
  // 채널별 오프셋 — 같은 인덱스라도 채널마다 시각·고객이 겹치지 않도록(동일 고객이 같은 시각에 여러 채널로 문의하는 비상식 케이스 방지)
  const off = channel === "이메일" ? 37 : channel === "모바일 챗봇" ? 71 : 0
  return Array.from({ length: count }, (_, i) => {
    const vt = Q_TYPES[i % Q_TYPES.length]
    const rb = i % 9 // 0-1 고위험, 2-5 보통, 6-8 낮음
    const risk = rb < 2 ? (i % 2 ? "높음" : "매우높음") : rb < 6 ? "보통" : "낮음"
    const score = risk === "매우높음" ? 86 - (i % 8) : risk === "높음" ? 73 - (i % 8) : risk === "보통" ? 54 - (i % 10) : 28 - (i % 8)
    const sb = i % 20 // 미배정 35% / 배정 25% / 처리중 20% / 완료 20%
    const status = sb < 7 ? "분석 완료" : sb < 12 ? "부서 배정" : sb < 16 ? "처리 중" : "처리 완료"
    // 고위험은 1/3, 그 외는 1/7 확률로 대체 부서 배정(디테일에 따른 분기) → 같은 유형이라도 부서가 달라짐
    const dept = (i % (rb < 2 ? 3 : 7) === 0) ? (ALT_DEPT[vt] ?? DEPT_BY_TYPE[vt] ?? "고객만족부") : (DEPT_BY_TYPE[vt] ?? "고객만족부")
    const hh = 9 + ((i + off) % 9), mm = ((i * 13) + (off * 7)) % 60
    const sc = Math.max(12, score)
    const minor = (Q_MINOR[vt] ?? [])[i % (Q_MINOR[vt]?.length || 1)]
    const id = `${Q_PREFIX[channel] ?? "QV"}-2026-${1000 + i}`
    const cust = Q_NAMES[(i + off) % Q_NAMES.length]
    const datetime = `${CD_TODAY_MD} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
    const cuePool = Q_CUES[vt] ?? []
    const cues = cuePool.length ? [cuePool[i % cuePool.length], cuePool[(i + 1) % cuePool.length]].slice(0, sc >= 60 ? 2 : 1) : []
    const summary = Q_SUMMARY[vt] ?? `${vt} 관련 문의`
    return {
      key: `g:${channel}:${i}`, source: "voc" as const, channel,
      id, customer: cust, datetime,
      vocType: vt, vocMinor: minor, exp: rb < 2 ? "불만" : "불만 가능성",
      risk, score: sc, urgency: urgencyFromRisk(risk),
      dept, status,
      summary, keywords: [], triggers: [],
      cause: (isQuality(vt) ? "상담 품질" : "개별 민원") as Inflow["cause"],
      // 합성 상세 — 감지 발화·불편도·감정(상세 패널 풍부화)
      rawDetection: { callId: id, customer: cust, customerNo: `C-${10000000 + (i * 37) % 900000}`, datetime: `2026.${datetime}`, channel, sentiment: sc >= 55 ? "부정" : "보통", discomfort: sc, signal: minor ?? summary, risk, riskScore: sc, urgency: urgencyFromRisk(risk), reason: summary, vocMajor: vt, vocMinor: minor ?? "", reg: status === "분석 완료" ? "대상" : "등록완료", summary, cues },
    }
  })
}
// 채널별 VoC 목표(CH_STATS) 대비 시드 부족분을 합성으로 보충
const VOC_TARGET: Record<string, number> = { 콜센터: 192, 이메일: 38, "모바일 챗봇": 36 }
const INFLOW: Inflow[] = [
  ...SEED_INFLOW,
  ...Object.entries(VOC_TARGET).flatMap(([ch, target]) => genVoc(ch, Math.max(0, target - SEED_INFLOW.filter((r) => r.channel === ch).length))),
]
const CHANNELS = ["전체", "콜센터", "이메일", "모바일 챗봇"] as const
const fmtN = (n: number) => n.toLocaleString("en-US")
// 일시 표시용 — 월.일 (요일) + 시각 분리
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]
function whenParts(dt: string) {
  const [d, t = ""] = dt.split(" ")
  const seg = d.split(".").map((s) => s.trim())
  const [y, mo, da] = seg.length === 3 ? seg : ["2026", seg[0] ?? "", seg[1] ?? ""]
  const wd = WEEKDAYS[new Date(Number(y), Number(mo) - 1, Number(da)).getDay()] ?? ""
  return { date: `${mo}.${da}`, wd, time: t }
}
// 동일 고객 인입 빈도(반복 인입 = 민원 발전 위험 피쳐)
const CUST_FREQ: Record<string, number> = {}
INFLOW.forEach((r) => { CUST_FREQ[r.customer] = (CUST_FREQ[r.customer] ?? 0) + 1 })
// 민원다발 유형 — 민원으로 발전하는 비율이 높은 고난도 주제(사망보험금·부지급·불완전판매 등)
const HIGH_DIFFICULTY = /사망|부지급|일부지급|지급\s?거절|불완전판매|면책|후유장해|암\s?진단|분쟁/
// AI 감지 신호 — 행동(욕설·법적·기관·언론·반복)과 쟁점(보상·불완전판매·해지·수금·응대·디지털)을 구체 근거와 함께 다각화
type Sig = { label: string; detail: string; Icon: typeof Activity }
function signalsOf(r: Inflow): Sig[] {
  const text = `${r.summary} ${(r.rawDetection?.cues ?? []).join(" ")} ${r.vocMinor ?? ""} ${r.triggers.join(" ")} ${r.keywords.join(" ")}`
  const disc = r.rawDetection?.discomfort ?? r.score
  const freq = CUST_FREQ[r.customer] ?? 0
  const out: Sig[] = []
  // ① 행동 신호(에스컬레이션) — 우선
  if (/욕설|폭언|고성|막말|반말|쌍욕/.test(text)) out.push({ label: "욕설·폭언", detail: "고성·폭언 발화", Icon: AlertTriangle })
  if (/소송|법적|변호사|고발|손해배상/.test(text)) out.push({ label: "법적 대응 시사", detail: /변호사/.test(text) ? "변호사 상담 언급" : "소송·고발 언급", Icon: Scale })
  if (/금감원|감독원|분쟁조정/.test(text)) out.push({ label: "감독기관 민원", detail: /분쟁조정/.test(text) ? "분쟁조정 신청" : "금감원 민원 예고", Icon: Landmark })
  if (/언론|제보|기사|뉴스/.test(text)) out.push({ label: "언론·제보 위협", detail: "언론 제보 언급", Icon: Megaphone })
  // ② 쟁점 신호(유형 뿌리) — 하나만
  if (/부지급|일부지급|지급\s?거절|면책|손해사정|지급\s?지연/.test(text)) out.push({ label: "보상 쟁점", detail: /부지급/.test(text) ? "부지급 불복" : /일부지급/.test(text) ? "일부지급 이의" : /면책/.test(text) ? "면책 다툼" : /손해사정/.test(text) ? "손해사정 이의" : "지급 지연", Icon: Flame })
  else if (/불완전판매|설명\s?미흡|원금\s?보장|적합성/.test(text)) out.push({ label: "불완전판매 소지", detail: /원금/.test(text) ? "원금보장 오인" : /적합성/.test(text) ? "적합성 문제" : "설명의무 다툼", Icon: Tag })
  else if (/해지|해약|환급|청약철회/.test(text)) out.push({ label: "해지·이탈 의향", detail: /환급/.test(text) ? "환급금 불만" : "해지 의향", Icon: ArrowDownRight })
  else if (/자동이체|이중\s?출금|환불|미납|수금|정산/.test(text)) out.push({ label: "수금·환불 쟁점", detail: /이중/.test(text) ? "이중 출금" : /환불/.test(text) ? "환불 지연" : "수금 오류", Icon: Wallet })
  else if (/응대|불친절|연결\s?지연|콜백|상담원/.test(text)) out.push({ label: "응대 품질 불만", detail: /연결/.test(text) ? "연결 지연" : /콜백/.test(text) ? "콜백 누락" : "응대 태도", Icon: MessageSquare })
  else if (/앱|로그인|전자서명|인증|시스템|오류/.test(text)) out.push({ label: "디지털 오류", detail: /로그인/.test(text) ? "로그인 실패" : /전자서명/.test(text) ? "전자서명 오류" : "인증 오류", Icon: Activity })
  // ③ 보조 신호
  if (freq >= 2) out.push({ label: "반복 인입", detail: `${freq}회 인입`, Icon: Repeat })
  if (disc >= 80) out.push({ label: "고불편 감정", detail: `불편도 ${disc}점`, Icon: Frown })
  if (out.length === 0 && (r.exp === "불만" || r.rawDetection?.sentiment === "부정")) out.push({ label: "부정 감정", detail: `불편도 ${disc}점`, Icon: Frown })
  if (out.length === 0 && /또|계속|다시|벌써|한참|아직/.test(text)) out.push({ label: "반복 항의", detail: "통화 내 반복", Icon: MessageSquare })
  return out
}
function detectSignalsAll(r: Inflow): string[] { return signalsOf(r).map((s) => s.label) }
const detectSignal = (r: Inflow): string | null => signalsOf(r)[0]?.label ?? null
function signalView(r: Inflow): Sig | null { return signalsOf(r)[0] ?? null }
// 인박스 '감지신호' 전용 — 위험 신호(행동·지표) 중심. 보상 등 쟁점 태그 배제, 발화 분석 키워드(요약)와 중복 최소화.
// 감지 신호 판정용 키워드 사전
const SIG_SWEAR = ["욕설", "폭언", "고성", "막말", "반말", "쌍욕", "협박", "위협"]
const SIG_LEGAL = ["법적", "소송", "고소", "변호사", "민사", "손해배상", "내용증명"]
const SIG_AGENCY = ["금감원", "금융감독원", "분쟁조정", "신고", "진정"]
const SIG_MEDIA = ["언론", "보도", "기사", "공론화", "국민청원", "커뮤니티"]
const sigHit = (text: string, words: string[]) => words.filter((w) => text.includes(w))
function riskSignal(r: Inflow): Sig | null {
  const text = `${r.summary} ${(r.rawDetection?.cues ?? []).join(" ")} ${r.triggers.join(" ")} ${r.rawDetection?.signal ?? ""} ${r.rawDetection?.reason ?? ""}`
  const disc = r.rawDetection?.discomfort ?? r.score
  const freq = CUST_FREQ[r.customer] ?? 0
  const sw = sigHit(text, SIG_SWEAR), lg = sigHit(text, SIG_LEGAL), ag = sigHit(text, SIG_AGENCY), md = sigHit(text, SIG_MEDIA)
  // 1) 욕설·폭언 — 매칭된 표현을 근거로 표기
  if (sw.length) return { label: "욕설·폭언", detail: sw.slice(0, 2).join("·"), Icon: AlertTriangle }
  // 2) 악성 전이 위험 — 위험 최상위. 불편도 대신 감지 근거(신호)를 표기
  if (r.risk === "매우높음") return { label: "악성 전이 위험", detail: r.rawDetection?.signal || [...lg, ...ag, ...md].slice(0, 2).join("·") || "복합 위험 신호", Icon: Flame }
  // 3) 법적 대응 언급 — 매칭 키워드 부가
  if (lg.length) return { label: "법적 대응 언급", detail: lg.slice(0, 2).join("·"), Icon: Scale }
  // 4) 대외기관 신고 언급 — 금감원·분쟁조정 등
  if (ag.length) return { label: "대외기관 신고", detail: ag.slice(0, 2).join("·"), Icon: Landmark }
  // 5) 언론·공론화 언급
  if (md.length) return { label: "언론·공론화", detail: md.slice(0, 2).join("·"), Icon: Megaphone }
  // 6) 반복 인입 — 3회 이상만
  if (freq >= 3) return { label: "반복 인입", detail: `${freq}회 인입`, Icon: Repeat }
  // 7) 부정 감정 — 감정 격화(단일 카테고리). 강도는 불편도로 표시
  if (disc >= 55 || r.exp === "불만" || r.rawDetection?.sentiment === "부정") return { label: "부정 감정", detail: `불편도 ${disc}점`, Icon: Frown }
  // 8) 정상 범위
  return { label: "정상 범위", detail: `불편도 ${disc}점`, Icon: Activity }
}
// 상세 카드 — 감지 신호의 실제 근거 값(테이블은 배지, 상세는 실측값)
function riskEvidence(r: Inflow): [string, string][] {
  const rows: [string, string][] = []
  if (r.rawDetection) rows.push(["감정 분석", `${r.rawDetection.sentiment} · 불편도 ${r.rawDetection.discomfort}/100`])
  else rows.push(["고객 경험", r.exp])
  const trg = r.triggers.filter(Boolean)
  if (trg.length) rows.push(["위험 신호어", trg.join(", ")])
  if (r.keywords.length) rows.push(["키워드", r.keywords.join(", ")])
  if ((CUST_FREQ[r.customer] ?? 0) >= 2) rows.push(["반복 인입", `동일 고객 ${CUST_FREQ[r.customer]}건`])
  return rows
}
// 원문 목업 — 채널별 접수 원문(이메일 본문 / 챗봇 대화 / 대외기관 민원서)
const RAW_BODY: Record<string, string> = {
  "VOC-260616-002": "안녕하세요. 이서아입니다.\n\n작년에 가입한 종신보험을 최근 해지했는데, 환급받은 금액이 가입 당시 설계사가 안내한 예상 환급금과 크게 차이가 납니다. 당시 \"7년만 납입하면 원금 수준은 돌려받는다\"는 설명을 분명히 들었습니다.\n\n환급금 산정 근거와 공제 내역을 항목별로 보내주시고, 납득할 만한 설명이 없으면 법적 대응도 검토하겠습니다. 회신 부탁드립니다.",
  "VOC-260616-003": "[대외기관 이첩 민원]\n\n민원인 박준서 님은 0월 0일 상담 과정에서 담당 상담사의 응대 태도(반말·고압적 말투)로 불쾌감을 느꼈으며, 회사의 공식 사과와 재발 방지 대책을 요구하고 있습니다.\n\n해당 통화 내역 확인 후 사실관계와 회사의 조치 계획을 회신해 주시기 바랍니다.",
  "VOC-260616-201": "고객: 보험금 청구했는데 왜 아직도 처리가 안 되나요? 벌써 2주째예요.\n상담봇: 청구 건 확인 중입니다. 잠시만 기다려 주세요.\n고객: 계속 기다리라고만 하고… 도대체 언제 되는 거죠? 너무 답답합니다.",
  "VOC-260616-202": "고객: 자동이체 계좌를 바꾸고 싶은데 어떻게 하나요?\n상담봇: 앱 > 계약관리 > 납입정보 변경에서 가능합니다.\n고객: 거기서 안 바뀌어서요. 오류가 나요.",
  "VOC-260616-203": "고객: 앱에 보험료 납입 내역을 한눈에 볼 수 있는 기능이 있으면 좋겠어요.\n상담봇: 소중한 의견 감사합니다. 개선 부서에 전달하겠습니다.",
  "VOC-260616-204": "안녕하세요. 청약철회를 요청합니다.\n\n가입한 지 며칠 되지 않았고, 상품 설명을 충분히 듣지 못한 채 가입했습니다. 청약철회 및 납입 보험료 전액 환급을 요청하며, 처리 절차를 안내해 주세요.",
  "VOC-260616-205": "[대외기관 이첩 민원]\n\n민원인은 보험금 지급이 정당한 사유 없이 지연되고 있다고 주장하며, 감독기관을 통해 신속한 처리와 지연 사유에 대한 공식 답변을 요구하고 있습니다.",
  "VOC-260616-206": "[대외기관 이첩 민원]\n\n민원인은 불완전판매로 인한 피해를 주장하며 계약 무효 및 납입 보험료 환급을 요구하고 있습니다. 판매 과정 녹취 및 관련 서류 확인 후 회신 요망.",
}
// 채널별 원문 폴백 — 목업 프리셋이 없을 때 요약 기반으로 자연스러운 원문 생성
function rawInquiry(r: Inflow): string {
  if (RAW_BODY[r.id]) return RAW_BODY[r.id]
  const kw = r.keywords.join(", ")
  if (r.channel === "이메일") return `안녕하세요. ${r.customer}입니다.\n\n${r.summary}${kw ? `\n특히 ${kw} 부분에 대한 명확한 설명과 조치를 요청드립니다.` : ""}\n\n빠른 회신 부탁드립니다.`
  if (r.channel === "모바일 챗봇") return `고객: ${r.summary}\n상담봇: 문의 주신 내용 확인 중입니다.\n고객: ${r.need ?? "빠른 처리 부탁드려요."}`
  if (r.channel === "대외기관 민원") return `[대외기관 이첩 민원]\n\n민원인 ${r.customer} 님이 제기한 민원입니다.\n\n${r.summary}\n\n사실관계 확인 및 회사의 조치 계획에 대한 회신을 요청합니다.`
  return r.summary
}
// 감지된 문장 · 분석 — 원문에서 전이 위험 신호 문장 추출 + AI 분석(콜상담 VoC 탭 디자인 차용)
const DETECTED_SENT: Record<string, { quote: string; analysis: string }[]> = {
  "VOC-260616-002": [
    { quote: "7년만 납입하면 원금 수준은 돌려받는다는 설명을 분명히 들었습니다.", analysis: "가입 시 안내와 환급금 불일치 주장 — 불완전판매·오안내 전이 신호" },
    { quote: "납득할 만한 설명이 없으면 법적 대응도 검토하겠습니다.", analysis: "법적 대응 시사 — 분쟁 비화 고위험" },
  ],
  "VOC-260616-003": [
    { quote: "상담사의 응대 태도(반말·고압적 말투)로 불쾌감을 느꼈습니다.", analysis: "응대 품질 불만 — 감정 격앙·재상담 회피 신호" },
    { quote: "공식 사과와 재발 방지 대책을 요구합니다.", analysis: "공식 조치 요구 — 대외기관 이첩된 정식 민원" },
  ],
  "VOC-260616-201": [
    { quote: "벌써 2주째예요. 도대체 언제 되는 거죠?", analysis: "처리 지연 — 불만 누적·항의 전이" },
    { quote: "계속 기다리라고만 하고… 너무 답답합니다.", analysis: "응대 불충분 — 부정 감정 표출" },
  ],
  "VOC-260616-204": [
    { quote: "상품 설명을 충분히 듣지 못한 채 가입했습니다.", analysis: "불완전판매 주장 — 청약철회·분쟁 사유" },
    { quote: "청약철회 및 납입 보험료 전액 환급을 요청합니다.", analysis: "철회·환급 요구 — 즉시 처리 필요" },
  ],
  "VOC-260616-205": [
    { quote: "정당한 사유 없이 지급이 지연되고 있습니다.", analysis: "부지급·지연 항의 — 감독기관 이첩 고위험" },
  ],
  "VOC-260616-206": [
    { quote: "불완전판매로 인한 피해를 입었습니다. 계약 무효를 요구합니다.", analysis: "불완전판매 분쟁 — 계약 무효·환급 요구" },
  ],
}
function analyzeQuote(q: string): string {
  if (/금감원|감독원|분쟁조정/.test(q)) return "감독기관·분쟁조정 언급 — 대외 민원 전이 고위험"
  if (/법적|소송|고발|변호사/.test(q)) return "법적 대응 시사 — 분쟁 비화 위험"
  if (/가만|책임|곤란/.test(q)) return "위협성 발언 — 악성 전이 고위험"
  if (/또|저번|다시|계속|아직|벌써|한참/.test(q)) return "반복·지연 — 불만 누적 신호"
  if (/안 돼|안돼|오류|왜|안 나|안나/.test(q)) return "처리 미흡·오류 호소 — 불만 고조 신호"
  if (/너무|적|다르|차이/.test(q)) return "안내 불일치 주장 — 불완전판매·오안내 전이 신호"
  return "부정 정서 감지 — 전이 위험 모니터링 대상"
}
// 감지 발화 분석에서 추출한 짧은 키워드(— 앞부분) — 요약/카드의 위험 태그로 활용
function analysisKeywords(r: Inflow): string[] {
  const cues = r.rawDetection?.cues ?? []
  const ks = cues.map((c) => analyzeQuote(c.replace(/^[“"]|[”"]$/g, "")).split("—")[0].trim())
  return [...new Set(ks)].slice(0, 2)
}
function detectedSentences(d: Inflow): { quote: string; analysis: string }[] {
  if (DETECTED_SENT[d.id]) return DETECTED_SENT[d.id]
  if (d.rawDetection?.cues?.length) return d.rawDetection.cues.map((c) => { const q = c.replace(/^[“"]|[”"]$/g, ""); return { quote: q, analysis: analyzeQuote(q) } })
  return [{ quote: d.summary, analysis: "원문 기반 전이 위험 감지" }]
}
// 원문 보기 — 고객·상담사 대화 말풍선으로 변환
const AGENT_LINES = ["네 고객님, 무엇을 도와드릴까요?", "확인해 보겠습니다. 잠시만 기다려 주세요.", "불편을 드려 죄송합니다. 바로 처리 도와드리겠습니다.", "말씀 주신 내용 확인했습니다. 추가로 안내드리겠습니다."]
function transcript(d: Inflow): { who: "고객" | "상담사" | "기관"; text: string }[] {
  if (d.source === "detect" && d.rawDetection?.cues?.length) {
    const out: { who: "고객" | "상담사" | "기관"; text: string }[] = []
    d.rawDetection.cues.forEach((c, i) => {
      out.push({ who: "상담사", text: AGENT_LINES[i % AGENT_LINES.length] })
      out.push({ who: "고객", text: c.replace(/^[“"]|[”"]$/g, "") })
    })
    out.push({ who: "상담사", text: "안내해 드린 내용으로 처리 도와드리겠습니다. 추가 문의 있으실까요?" })
    return out
  }
  const raw = rawInquiry(d)
  if (/^(고객|상담봇|상담사)\s*:/m.test(raw)) {
    return raw.split(/\n+/).map((line) => {
      const m = line.match(/^(고객|상담봇|상담사)\s*:\s*(.*)$/)
      if (m) return { who: m[1] === "고객" ? ("고객" as const) : ("상담사" as const), text: m[2] }
      return { who: "고객" as const, text: line }
    }).filter((b) => b.text)
  }
  return [{ who: d.channel === "대외기관 민원" ? ("기관" as const) : ("고객" as const), text: raw }]
}
// 문의 유형 분류 체계(대 › 소) — 상세 카드에서 관리자 수정용
const TYPE_TREE: Record<string, string[]> = {
  "보험금 청구·지급": ["부지급·일부지급 불만", "지급 지연", "구비서류 과다 요구", "보험금 산정 이의"],
  "해지·환급": ["환급금 불만", "해지 처리 지연", "해지 안내 미흡"],
  "상품·가입": ["불완전판매", "상품 설명 미흡", "가입 조건 안내 오류"],
  "계약 유지·변경": ["변경 처리 지연", "계약 정보 오류", "납입 변경 오류"],
  "납입·수금": ["자동이체 오류", "보험료 과다 청구", "납입 안내 미흡"],
  "상담 응대·서비스": ["응대 불친절", "대기시간 과다", "안내 오류"],
  "전산·디지털": ["인증 실패", "홈페이지 장애", "앱 오류"],
}
// 실시간 갱신 효과 — tick·seed 기반 ±3% 결정적 변동(랜덤 아님 → 하이드레이션 안전)
const jit = (base: number, seed: number, tick: number) => Math.max(0, Math.round(base + base * 0.03 * Math.sin((tick + seed) * 1.7)))
// SLA·예외 판정 (우선순위 인박스)
const hashNum = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0)
const SLA_BASE: Record<Urgency, number> = { 긴급: 9, 높음: 28, 보통: 95, 낮음: 240 }

// 채널별 실시간 현황 목업 집계 (전사 규모 · 1000단위)
type ChStat = { total: number; complaint: number; potential: number; high: number; mid: number; low: number; dod: number; depts: Record<string, number> }
// 금일(평일) 14시경 누적 집계(채널별). 설계 로직:
//  · total = 전체 문의,  VoC = complaint(불만) + potential(잠재),  단순문의 = total − VoC
//  · high/mid/low = VoC 내부 위험도 분포(높음=고위험) → high+mid+low = VoC (전체 문의가 아니라 VoC 대비)
//  · depts = 채널별 VoC를 담당부서로 분배(합 = 그 채널 VoC)
// VoC율은 인입 대비 현실치(콜·챗봇 3~4%, 이메일·대외는 상대적으로 높음). 인입 대부분은 단순 조회·변경.
// 합계: 전체 6,396 · VoC 282(불만 114 + 잠재 168, 인입대비 4.4%) · 위험 高62/中118/低102 · 평균위험 46 · 단순 6,114
const CH_STATS: Record<string, ChStat> = {
  콜센터: { total: 4800, complaint: 72, potential: 120, high: 36, mid: 84, low: 72, dod: 6, depts: { 보상서비스부: 50, 고객만족부: 56, 수금관리부: 32, 준법감시부: 24, 계약관리부: 16, 디지털서비스부: 14 } },
  이메일: { total: 480, complaint: 18, potential: 20, high: 10, mid: 16, low: 12, dod: 3, depts: { 보상서비스부: 10, 고객만족부: 11, 수금관리부: 6, 준법감시부: 5, 계약관리부: 3, 디지털서비스부: 3 } },
  "모바일 챗봇": { total: 1100, complaint: 10, potential: 26, high: 4, mid: 14, low: 18, dod: 12, depts: { 보상서비스부: 9, 고객만족부: 11, 수금관리부: 7, 준법감시부: 3, 계약관리부: 3, 디지털서비스부: 3 } },
  "대외기관 민원": { total: 16, complaint: 14, potential: 2, high: 12, mid: 4, low: 0, dod: -4, depts: { 보상서비스부: 3, 고객만족부: 2, 수금관리부: 1, 준법감시부: 8, 계약관리부: 2, 디지털서비스부: 0 } },
}

// 실시간 급증 키워드 / 급증 유형 (전사 목업)
// AI 미분류 — 방금 인입돼 유형 분류 대기 중인 건
const UNCLASSIFIED: { id: string; customer: string; channel: string; datetime: string }[] = [
  { id: "CL-20260616-330", customer: "표지원", channel: "콜센터", datetime: "16:41" },
  { id: "EM-20260616-118", customer: "구본혁", channel: "이메일", datetime: "16:39" },
  { id: "MB-20260616-205", customer: "심다은", channel: "모바일 챗봇", datetime: "16:38" },
  { id: "CL-20260616-331", customer: "방현수", channel: "콜센터", datetime: "16:36" },
]
const SURGE_KW: [string, number][] = [
  ["부지급", 1240], ["환급금 과소", 1080], ["이중출금", 940], ["앱 오류", 860], ["보험료 인상", 780], ["부당 권유", 710],
  ["보장 제외", 650], ["설명 미흡", 590], ["본인인증 실패", 540], ["청구 거절", 500], ["지급 지연", 460], ["대기시간", 420],
]
const TOP_TYPES: { type: string; kws: string[]; n: number; pending: number; high: number; dept: string; wow: number }[] = [
  { type: "보험금 부지급", kws: ["부지급 사유 불만", "재심사 요구", "약관 해석 이견", "분쟁조정 언급"], n: 1300, pending: 240, high: 410, dept: "보상서비스부", wow: 24 },
  { type: "해지·환급금", kws: ["환급금 과소 지급", "차액 환불 요구", "해지 절차 불만", "산출 기준 문의"], n: 980, pending: 90, high: 180, dept: "고객만족부", wow: 9 },
  { type: "전산·인증 오류", kws: ["앱 접속 오류", "본인인증 실패", "로그인 장애", "조회 화면 오류"], n: 640, pending: 60, high: 70, dept: "디지털서비스부", wow: 18 },
  { type: "보장 범위 분쟁", kws: ["보장 제외 불만", "면책 사유 이견", "보장 한도 항변"], n: 540, pending: 120, high: 160, dept: "보상서비스부", wow: 12 },
  { type: "수금·이중출금", kws: ["이중 출금", "자동이체 오류", "출금일 변경 혼선", "보험료 인상 불만"], n: 420, pending: 35, high: 40, dept: "수금관리부", wow: 6 },
  { type: "불완전판매", kws: ["설명 의무 미흡", "가입 권유 항변", "부당 승환 의심"], n: 310, pending: 70, high: 110, dept: "준법감시부", wow: 15 },
]

// 부서별 처리 현황 (전사 목업) — 신규 유입 vs 처리 완료
// 배정 = 오늘 누적 유입 / 완료 = 오늘 누적 처리 / 대기 = 배정 − 완료(현재 실시간 적체)
// 적체율 = 대기 ÷ 배정 × 100 → 병목 ≈ 90%, 주의 ≥ 70%
// 배정(inflow) = 금일 부서로 이관된 전사 VoC(합 ≈ 전사 VoC 3,650 · CH_STATS depts 합과 정합) / 완료(done) = 금일 처리 / 대기 = 배정 − 완료
const DEPT_PROC: { dept: string; inflow: number; done: number }[] = [
  { dept: "고객만족부", inflow: 990, done: 928 },     // 미처리 62 · 6.3%
  { dept: "보상서비스부", inflow: 940, done: 848 },   // 미처리 92 · 9.8% (최다)
  { dept: "수금관리부", inflow: 600, done: 576 },     // 미처리 24 · 4.0%
  { dept: "준법감시부", inflow: 460, done: 424 },     // 미처리 36 · 7.8%
  { dept: "계약관리부", inflow: 390, done: 368 },     // 미처리 22 · 5.6%
  { dept: "디지털서비스부", inflow: 270, done: 262 }, // 미처리 8 · 3.0%
]
// 전일 기준 부서별 추가 통계 — SLA 준수율(%) / 평균 처리시간(리드타임) / 적체 전일 대비 증감(건)
const DEPT_DAILY: Record<string, { sla: number; aht: string; dBacklog: number; reCx: number }> = {
  고객만족부: { sla: 91, aht: "2.4h", dBacklog: 4, reCx: 5 },
  보상서비스부: { sla: 86, aht: "6.1h", dBacklog: 9, reCx: 8 },
  수금관리부: { sla: 97, aht: "1.3h", dBacklog: -3, reCx: 3 },
  준법감시부: { sla: 88, aht: "7.2h", dBacklog: 2, reCx: 6 },
  계약관리부: { sla: 93, aht: "2.9h", dBacklog: -2, reCx: 4 },
  디지털서비스부: { sla: 98, aht: "0.8h", dBacklog: -4, reCx: 2 },
}
// 전일(어제) 부서별 배정·완료 — 오늘 대비 비교용 고스트 바
const DEPT_PREV: Record<string, { inflow: number; done: number }> = {
  고객만족부: { inflow: 880, done: 858 },   // 오늘 배정·완료 증가
  보상서비스부: { inflow: 1030, done: 946 }, // 오늘 감소(어제 더 많았음)
  수금관리부: { inflow: 512, done: 500 },    // 오늘 증가
  준법감시부: { inflow: 528, done: 486 },    // 오늘 감소
  계약관리부: { inflow: 322, done: 312 },    // 오늘 증가
  디지털서비스부: { inflow: 330, done: 322 }, // 오늘 감소
}
// 부서별 금일 처리율(완료/배정) — 스코프(채널·센터)로 배정량이 바뀌어도 적체 패턴은 유지. 보상 병목.
const DEPT_DONE_RATE: Record<string, number> = { 보상서비스부: 0.19, 고객만족부: 0.36, 수금관리부: 0.82, 준법감시부: 0.26, 계약관리부: 0.64, 디지털서비스부: 0.83 }
// 처리 완료 건 — 부서별 처리 담당자 / 유형별 처리 결과 코멘트(상담 검수 결과 스타일 목업)
const PROC_HANDLERS: Record<string, string> = { 보상서비스부: "김보상", 고객만족부: "이만족", 수금관리부: "박수금", 준법감시부: "정준법", 계약관리부: "최계약", 디지털서비스부: "한디지" }
const PROC_COMMENT: Record<string, string> = {
  "보험금 부지급": "약관상 부지급 사유를 근거 조항과 함께 안내하고, 재심사 요청 접수 후 처리 일정(영업일 5일)을 회신 완료. 고객 수용 확인.",
  "해지·환급금": "경과기간별 환급률 산출 근거를 설명하고 차액 재정산 결과를 SMS로 통지 완료. 추가 이의 없음.",
  "전산·인증 오류": "앱 인증 로그 확인 후 임시 인증 우회 처리, 정식 패치 예정일 안내 완료.",
  "보장 범위 분쟁": "보장 제외 조항을 원문과 함께 안내하고 분쟁조정 신청 절차를 병행 안내 완료.",
  "수금·이중출금": "이중 출금분 즉시 환불 처리하고 자동이체 계좌 정정 완료. 재발 방지 안내.",
  "불완전판매": "모집 과정 녹취 확인 후 자율조정 기준에 따라 보상안을 안내하고 합의 완료.",
}
const UNASSIGNED_RATE = 0.35 // VoC 중 아직 부서 미배정(배정 대기) 비율 — 카드②′ 이관 진행률·카드③ 부서 배정량이 공유
const procRate = (r: { inflow: number; done: number }) => Math.round((r.done / r.inflow) * 100)
// 금일 전사 유형별 VoC 분해(고위험은 VoC 대비) — total=유형별 VoC, high=고위험 VoC. 합계가 전사 VoC와 정합(VoC 282 · 고위험 62).
const TODAY_TYPES: { major: string; total: number; high: number }[] = [
  { major: "보험금 청구·지급", total: 72, high: 24 },
  { major: "상담 응대·서비스", total: 46, high: 6 },
  { major: "납입·수금", total: 46, high: 5 },
  { major: "상품·가입", total: 24, high: 6 },
  { major: "해지·환급", total: 34, high: 7 },
  { major: "계약 유지·변경", total: 24, high: 1 },
  { major: "전산·디지털", total: 20, high: 1 },
]
const TODAY_TYPES_TOTAL = TODAY_TYPES.reduce((a, v) => a + v.total, 0)
// 콜센터만 관할 센터 단위가 존재 — 이메일·모바일챗봇·대외기관은 본사 전사 집중(센터 없음)
const CALL_CENTERS = ["서울센터", "부산센터", "대구센터", "광주센터"] as const
const CALL_CENTER_SHARE: Record<string, number> = { 서울센터: 0.4, 부산센터: 0.25, 대구센터: 0.2, 광주센터: 0.15 }
// 큐 행을 센터 점유율(CALL_CENTER_SHARE)에 맞춰 가중 배정 — 집계 센터 스케일과 큐 분포가 일치
const callCenterOf = (id: string) => { const r = (hashNum(id) % 100) / 100; let acc = 0; for (const c of CALL_CENTERS) { acc += CALL_CENTER_SHARE[c]; if (r < acc) return c } return CALL_CENTERS[CALL_CENTERS.length - 1] }
const procTone = (r: { inflow: number; done: number }): Tone => { const p = r.done / r.inflow; return p < 0.7 ? "bad" : p < 0.9 ? "warn" : "good" }
const procLabel = (t: Tone) => (t === "bad" ? "병목" : t === "warn" ? "주의" : "정상")
const TONE_HEX2: Record<Tone, string> = { bad: "#0f3468", warn: "#f59e0b", good: "#14b8a6", muted: "#94a3b8" }

// 민원 원인 분류 (전사 목업) — 서비스 불만족·상담 품질 / 제도·프로세스 개선 영역
const CAUSE_STATS = {
  service: { label: "서비스 불만족 · 상담 품질", color: "#2f8bff", items: [{ k: "응대 불친절·태도", n: 760 }, { k: "안내 오류·불일치", n: 640 }, { k: "대기시간 과다", n: 440 }] },
  system: { label: "제도·프로세스 개선 영역", color: "#0f3468", items: [{ k: "심사 기준", n: 880 }, { k: "판매 프로세스", n: 640 }, { k: "수금 프로세스", n: 520 }, { k: "상품 구조", n: 320 }] },
}

export function UnifiedVocAnalysis({ onProcess, fullTabs }: { onProcess: (vocId: string) => void; fullTabs?: boolean }) {
  const [chF, setChF] = useState<(typeof CHANNELS)[number]>("전체")
  const [center, setCenter] = useState<string>("전 센터") // 콜센터 선택 시에만 적용
  const [query, setQuery] = useState("")
  const [sel, setSel] = useState<string>(INFLOW[0]?.key ?? "")
  const [deptMap, setDeptMap] = useState<Record<string, string>>({})
  const [statusMap, setStatusMap] = useState<Record<string, string>>({})
  const [alertMap, setAlertMap] = useState<Record<string, boolean>>({})
  const [regMap, setRegMap] = useState<Record<string, RegState>>({})
  const [dashView, setDashView] = useState<"summary" | "ops" | "insight" | "stats" | "flow">("summary")
  const [riskBy, setRiskBy] = useState<"channel" | "type">("channel") // 위험 비중 카드 — 채널/유형 슬라이드
  const [donutBy, setDonutBy] = useState<"product" | "dept">("product") // 통계 도넛 — 상품유형/부서 슬라이드
  const [compBy, setCompBy] = useState<"composition" | "risk">("composition") // 문의 구성 ↔ 악성민원 발전 위험 슬라이드
  const [detailOpen, setDetailOpen] = useState(false)
  const [showRaw, setShowRaw] = useState(false)
  const [regOpen, setRegOpen] = useState(false)
  // VoC 등록 팝업 — 표준 등록 형식 항목 수정 편집
  const [editReg, setEditReg] = useState(false)
  const [regEdits, setRegEdits] = useState<Record<string, string>>({})
  const [kwPage, setKwPage] = useState(0)
  const KW_PAGES = Math.ceil(SURGE_KW.length / 6)
  useEffect(() => { const t = setInterval(() => setKwPage((p) => (p + 1) % KW_PAGES), 3500); return () => clearInterval(t) }, [KW_PAGES])
  // 실시간 갱신 — 10초마다 표시 수치 미세 변동(안내: 10분 단위 갱신)
  const [tick, setTick] = useState(0)
  useEffect(() => { const t = setInterval(() => setTick((v) => v + 1), 10000); return () => clearInterval(t) }, [])
  // 슬라이드 카드 — 카드별로 엇갈려(번갈아) 자동 전환
  useEffect(() => {
    let i = 0
    const t = setInterval(() => {
      i += 1
      if (i % 2 === 1) setCompBy((v) => (v === "composition" ? "risk" : "composition"))
      else { setRiskBy((v) => (v === "channel" ? "type" : "channel")); setDonutBy((v) => (v === "product" ? "dept" : "product")) }
    }, 5000)
    return () => clearInterval(t)
  }, [])

  const [typeMap, setTypeMap] = useState<Record<string, string>>({})
  const [minorMap, setMinorMap] = useState<Record<string, string>>({})
  const deptOf = (r: Inflow) => deptMap[r.key] ?? r.dept
  const statusOf = (r: Inflow) => statusMap[r.key] ?? r.status
  // 이관 후 진행 상태 라벨(배정완료 → 처리완료) — 이관 완료 = 배정완료 + 처리완료
  const procLabel = (st: string) => (st === "처리 완료" ? "처리 완료" : st === "처리 중" ? "처리 중" : "배정 완료")
  const typeOf = (r: Inflow) => typeMap[r.key] ?? r.vocType
  const minorOf = (r: Inflow) => minorMap[r.key] ?? r.vocMinor ?? ""
  // 대분류 변경 시 소분류는 해당 분류의 첫 항목으로 초기화
  const setMajor = (r: Inflow, major: string) => { setTypeMap((p) => ({ ...p, [r.key]: major })); setMinorMap((p) => ({ ...p, [r.key]: TYPE_TREE[major]?.[0] ?? "" })) }

  // 우선순위 인박스 — 예외 처리 중심
  const [picked, setPicked] = useState<string[]>([])
  const [auto, setAuto] = useState(true)
  const [focus, setFocus] = useState<"all" | "unassigned" | "done">("unassigned")
  // 완료(배정완료·처리완료) / 미배정(SLA 임박·고위험) 세부 필터
  // 진행 상태 컬럼 헤더 필터(세모 드롭다운) — 미배정 / 배정 완료 / 처리 완료
  const [statusFilter, setStatusFilter] = useState<"all" | "unassigned" | "assigned" | "processed">("all")
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  // 상세 카드에서 방금 이관 확정/VoC 등록한 건 — 초록 알림을 1회성으로만 노출(재진입 시 숨김)
  const [assignFlash, setAssignFlash] = useState<string | null>(null)
  const [regFlash, setRegFlash] = useState<string | null>(null)
  const [bulkDept, setBulkDept] = useState(DEPTS[0])
  const [qMode, setQMode] = useState<"inbox" | "kanban">("kanban")
  const [kanbanBy, setKanbanBy] = useState<"유형" | "부서" | "상태">("유형")
  const [assignedTypes, setAssignedTypes] = useState<string[]>([])
  const [unclIds, setUnclIds] = useState<string[]>(UNCLASSIFIED.map((u) => u.id))
  const [manualAdds, setManualAdds] = useState<Inflow[]>([]) // 사람이 수동 분류해 큐에 편입한 건
  const [draftMap, setDraftMap] = useState<Record<string, string>>({})
  const fssDraft = (v: Inflow) => `[금융감독원 회신 초안]\n\n■ 민원인: ${v.customer}\n■ 접수 유형: ${v.vocType}${v.vocMinor ? ` › ${v.vocMinor}` : ""}\n■ 민원 요지: ${v.summary}\n\n1. 처리 경위\n   - (사실관계 및 확인 내용 기재)\n2. 회사 의견\n   - 관련 약관 및 처리 기준에 따라 적정하게 처리되었음을 안내드립니다.\n3. 향후 조치\n   - ${v.need ?? "추가 요청 사항에 대해 신속히 처리하겠습니다."}\n\n※ AI 생성 초안 — 관리자 검토 후 확정·발송됩니다.`
  const slaOf = (r: Inflow) => Math.max(1, SLA_BASE[r.urgency] - (hashNum(r.id) % Math.round(SLA_BASE[r.urgency] / 2)))
  const isHighRisk = (r: Inflow) => r.risk === "높음" || r.risk === "매우높음"
  const slaImminent = (r: Inflow) => slaOf(r) <= 15
  const isUnassigned = (r: Inflow) => statusOf(r) === "분석 완료"
  const isException = (r: Inflow) => isUnassigned(r) || isHighRisk(r) || slaImminent(r)

  // 콜센터 + 특정 센터 선택 시에만 센터로 한정(그 외 채널은 센터 개념 없음)
  const centerSel = chF === "콜센터" && center !== "전 센터" ? center : null
  const scoped = [...INFLOW, ...manualAdds].filter((r) => (chF === "전체" || r.channel === chF) && (!centerSel || (r.channel === "콜센터" && callCenterOf(r.id) === centerSel)))
  const isDone = (r: Inflow) => statusOf(r) !== "분석 완료" || regMap[r.key] === "등록완료" || alertMap[r.key]
  // 상단 탭: 전체 / 완료 / 미배정
  const focusMatch = (r: Inflow) => (focus === "all" ? true : focus === "done" ? isDone(r) : isUnassigned(r))
  // 진행 상태 컬럼 필터: 미배정 / 배정 완료(처리완료 아닌 이관건) / 처리 완료
  const statusMatch = (r: Inflow) =>
    statusFilter === "all" ? true
      : statusFilter === "unassigned" ? statusOf(r) === "분석 완료"
      : statusFilter === "processed" ? statusOf(r) === "처리 완료"
      : (isDone(r) && statusOf(r) !== "처리 완료") // assigned
  const rows = scoped
    .filter(focusMatch)
    .filter(statusMatch)
    .filter((r) => !query.trim() || r.customer.includes(query) || r.id.includes(query) || r.vocType.includes(query))
    .sort((a, b) => (RISK_RANK[b.risk] ?? 0) - (RISK_RANK[a.risk] ?? 0) || b.score - a.score)
  // 필터별 카운트(채널 스코프)
  const cnt = { unassigned: scoped.filter(isUnassigned).length, done: scoped.filter(isDone).length }
  const statusCnt = {
    all: scoped.length,
    unassigned: scoped.filter((r) => statusOf(r) === "분석 완료").length,
    assigned: scoped.filter((r) => isDone(r) && statusOf(r) !== "처리 완료").length,
    processed: scoped.filter((r) => statusOf(r) === "처리 완료").length,
  }
  const intakePerMin = jit(20, 0, tick)
  const togglePick = (k: string) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))
  // 칸반 드래그 — 부서별: 카드를 다른 부서로 끌어 재배정 / 유형별: 다른 유형으로 끌어 재분류(+그 유형 기본부서로 재배정)
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null) // 갭이 열릴 카드(삽입 지점)
  const [toast, setToast] = useState<string | null>(null) // 이관 완료 알림
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2800); return () => clearTimeout(t) }, [toast])
  const endDrag = () => { setDragKey(null); setDragOverCol(null); setDragOverKey(null) }
  const dropToCol = (label: string) => {
    if (!dragKey) { endDrag(); return }
    if (kanbanBy === "부서") setDeptMap((p) => ({ ...p, [dragKey]: label }))
    else { setTypeMap((p) => ({ ...p, [dragKey]: label })); setMinorMap((p) => ({ ...p, [dragKey]: "" })); setDeptMap((p) => ({ ...p, [dragKey]: DEPT_BY_TYPE[label] ?? p[dragKey] ?? "고객만족부" })) }
    endDrag()
  }
  // 이관 확정 — AI가 배정한 부서로 이관 처리 + VoC 자동 등록(사람은 검토 후 확정만)
  const transfer = (items: Inflow[]) => {
    const tk = items.map((t) => t.key)
    setStatusMap((p) => { const n = { ...p }; tk.forEach((k) => (n[k] = "부서 배정")); return n })
    setDeptMap((p) => { const n = { ...p }; items.forEach((i) => (n[i.key] = deptMap[i.key] ?? i.dept)); return n })
    setAlertMap((p) => { const n = { ...p }; tk.forEach((k) => (n[k] = true)); return n })
    setRegMap((p) => { const n = { ...p }; tk.forEach((k) => (n[k] = "등록완료")); return n }) // 이관 시 VoC 자동 등록
    setPicked((p) => p.filter((k) => !tk.includes(k)))
    if (tk.length) setToast(`${tk.length}건 담당 부서 이관·VoC 등록 완료 · 담당자 알림 발송`)
  }
  // 인박스 2단계 — 1) 담당 부서 이관(배정) 2) VoC 등록
  const assignDept = (items: Inflow[]) => {
    const tk = items.map((t) => t.key)
    setStatusMap((p) => { const n = { ...p }; tk.forEach((k) => (n[k] = "부서 배정")); return n })
    setDeptMap((p) => { const n = { ...p }; items.forEach((i) => (n[i.key] = deptMap[i.key] ?? i.dept)); return n })
    setAlertMap((p) => { const n = { ...p }; tk.forEach((k) => (n[k] = true)); return n })
    if (tk.length) setToast(`${tk.length}건 담당 부서 이관 완료 · 담당자 알림 발송`)
  }
  const register = (items: Inflow[]) => {
    const tk = items.map((t) => t.key)
    setRegMap((p) => { const n = { ...p }; tk.forEach((k) => (n[k] = "등록완료")); return n })
    if (tk.length) setToast(`${tk.length}건 VoC 시스템 등록 완료`)
  }
  // 미분류 건 수동 분류 — AI가 분류하지 못한 건을 사람이 유형 지정 → 해당 유형 컬럼으로 편입(부서 자동 라우팅, 이관 대기)
  const classifyUncl = (u: { id: string; customer: string; channel: string; datetime: string }, vt: string) => {
    const dep = DEPT_BY_TYPE[vt] ?? "고객만족부"
    setUnclIds((p) => p.filter((x) => x !== u.id))
    setManualAdds((p) => [...p, { key: `m:${u.id}`, source: "voc", channel: u.channel, id: u.id, customer: u.customer, datetime: u.datetime, vocType: vt, exp: "불만 가능성", risk: "보통", score: 50, urgency: "보통", dept: dep, status: "분석 완료", summary: `${vt} 관련 문의 (수동 분류)`, keywords: [], triggers: [], cause: (isQuality(vt) ? "상담 품질" : "개별 민원") as Inflow["cause"] }])
    setToast(`수동 분류 완료 · ${vt} → ${dep} 이관 대기`)
  }
  const toggleColAll = (keys: string[]) => setPicked((p) => (keys.every((k) => p.includes(k)) ? p.filter((k) => !keys.includes(k)) : [...new Set([...p, ...keys])]))
  // 컬럼 단위: 체크된 게 있으면 그것만, 없으면 컬럼의 미배정 전체 이관
  const transferCol = (items: Inflow[]) => { const inCol = items.filter((i) => picked.includes(i.key)); transfer(inCol.length ? inCol : items.filter((i) => statusOf(i) === "분석 완료")) }
  const d = INFLOW.find((r) => r.key === sel) ?? rows[0] ?? INFLOW[0]

  // 실시간 현황 집계(채널 필터 반영 · 전사 규모 목업)
  const statKeys = chF === "전체" ? (["콜센터", "이메일", "모바일 챗봇"] as const) : ([chF] as const)
  // 콜센터 + 특정 센터 선택 시 콜센터 집계를 센터 점유율만큼 축소(전사 합과 정합 유지)
  const centerFactor = centerSel ? (CALL_CENTER_SHARE[centerSel] ?? 1) : 1
  const scaleStat = (s: ChStat): ChStat => centerFactor === 1 ? s : { ...s, total: Math.round(s.total * centerFactor), complaint: Math.round(s.complaint * centerFactor), potential: Math.round(s.potential * centerFactor), high: Math.round(s.high * centerFactor), mid: Math.round(s.mid * centerFactor), low: Math.round(s.low * centerFactor), depts: Object.fromEntries(Object.entries(s.depts).map(([k, v]) => [k, Math.round(v * centerFactor)])) }
  const statByKey = (k: string) => { const s = CH_STATS[k]; return s ? scaleStat(s) : s }
  const statRows = statKeys.map((k) => statByKey(k)).filter(Boolean)
  const sum = (f: (s: ChStat) => number) => statRows.reduce((a, s) => a + f(s), 0)
  const totalN = sum((s) => s.total), complN = sum((s) => s.complaint), potN = sum((s) => s.potential)
  const highN = sum((s) => s.high), midN = sum((s) => s.mid), lowN = sum((s) => s.low)
  const riskBase = highN + midN + lowN // = VoC (위험도는 VoC 대비)
  const avgScore = riskBase ? Math.round((highN * 82 + midN * 50 + lowN * 20) / riskBase) : 0
  const riskSegs = [
    { label: "높음·매우높음", value: highN, color: "#0f3468" },
    { label: "보통", value: midN, color: "#f59e0b" },
    { label: "낮음", value: lowN, color: "#cbd5e1" },
  ]
  const deptAgg = DEPTS.map((dep) => ({ dep, n: sum((s) => s.depts[dep] ?? 0) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n)
  const deptMax = Math.max(...deptAgg.map((x) => x.n), 1)
  // 현재 스코프(채널·센터)의 부서 배정량 + 처리율 → 카드③용. deptAgg(부서별 VoC)가 이미 centerFactor·chF로 스케일됨.
  // 배정(inflow) = 부서별 VoC × (1−미배정율). 나머지(미배정)는 카드②′ 이관 진행률에서 잡힘.
  // 이관 확정(원래 미배정 → 배정)된 건을 부서별 처리 현황에 카운트업 반영
  const transferredByDept: Record<string, number> = {}
  scoped.forEach((r) => { if (r.status === "분석 완료" && statusOf(r) !== "분석 완료") { const dep = deptOf(r); transferredByDept[dep] = (transferredByDept[dep] ?? 0) + 1 } })
  const deptProc = deptAgg.map(({ dep, n }) => { const inflow0 = Math.round(n * (1 - UNASSIGNED_RATE)); const added = transferredByDept[dep] ?? 0; return { dept: dep, inflow: inflow0 + added, done: Math.round(inflow0 * (DEPT_DONE_RATE[dep] ?? 0.5)) } })
  // 채널별 민원 접수 건수
  // 고정 순서(콜센터 → 이메일 → 대외기관 민원), 대외기관 민원은 항상 맨 아래
  const chMix = statKeys.map((k) => ({ ch: k, complaint: CH_STATS[k].complaint, total: CH_STATS[k].total, dod: CH_STATS[k].dod }))
  const chMax = Math.max(...chMix.map((x) => x.complaint), 1)

  const assign = (r: Inflow) => {
    setStatusMap((p) => ({ ...p, [r.key]: "부서 배정" }))
    setAlertMap((p) => ({ ...p, [r.key]: true }))
    setAssignFlash(r.key) // 방금 배정한 건만 1회 초록 알림
  }
  const registerVoc = (r: Inflow) => setRegMap((p) => ({ ...p, [r.key]: "등록완료" }))
  const dDetection: Detection | undefined = d?.rawDetection ? { ...d.rawDetection, reg: regMap[d.key] ?? d.rawDetection.reg } : undefined

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-col overflow-hidden border-b border-[#dbe5f1] bg-[#fafcff] px-6 py-1.5" style={{ flex: "3 1 0%" }}>
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <div className="text-[12.5px] font-bold text-[#10233f]">전사 고객 문의·민원 현황</div>
          <span className="rounded-full bg-[#eef4fb] px-2 py-0.5 text-[9.5px] text-[#0b4f91]">금일 · 인입 {fmtN(totalN)}건</span>
          {dashView === "summary" || dashView === "ops" ? <span className="flex items-center gap-1 text-[9.5px] text-muted-foreground"><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#15c2a2] opacity-75" /><span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#0c8f78]" /></span>10분 단위 실시간 갱신</span> : null}
          <div className="ml-auto flex items-center gap-2">
            <FilterPills label="채널" value={chF} options={[...CHANNELS]} onChange={(v) => setChF(v as never)} />
            {/* 센터 선택 — 항상 같은 자리·폭(레이아웃 점프 없음). 콜센터일 때만 활성 */}
            <div className="flex items-center gap-1">
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground"><Building2 className="h-3 w-3" />센터</span>
              <select value={chF === "콜센터" ? center : "전사 집중"} disabled={chF !== "콜센터"} onChange={(e) => setCenter(e.target.value)}
                className="w-[78px] rounded-md border border-[#dbe5f1] bg-white px-1.5 py-0.5 text-[10px] text-[#33445c] outline-none focus:border-[#0f3468] disabled:cursor-not-allowed disabled:border-[#e6edf5] disabled:bg-[#f3f5f8] disabled:text-[#94a3b8]">
                {chF === "콜센터"
                  ? ["전 센터", ...CALL_CENTERS].map((c) => <option key={c} value={c}>{c}</option>)
                  : <option value="전사 집중">전사 집중</option>}
              </select>
            </div>
          </div>
        </div>
        {fullTabs ? (
        <div className="mb-2.5 flex w-fit items-center gap-1 rounded-lg border border-[#dbe5f1] bg-[#f7fafe] p-0.5">
          {([["summary", "통합 현황"], ["ops", "실시간 현황"], ["insight", "부서별 현황"]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setDashView(k)} className={cn("rounded-md px-3 py-1 text-[11px] font-semibold transition-colors", dashView === k ? "bg-[#0f3468] text-white shadow-sm" : "text-[#33445c] hover:bg-white")}>{l}</button>
          ))}
        </div>
        ) : null}
        {dashView === "summary" ? (
        <div className="flex min-h-0 flex-1 gap-2.5">
          {/* ① 문의 구성 ↔ 악성민원 발전 위험 — 슬라이드 (25%) */}
          {(() => {
            const simpleN = Math.max(0, totalN - complN - potN)
            const comp = [{ k: "단순 문의", n: simpleN, c: "#cbd5e1" }, { k: "불만VoC", n: complN, c: "#0f3468" }, { k: "잠재VoC", n: potN, c: "#2f6bb0" }]
            const risk = [{ k: "높음·매우높음", n: highN, c: "#0f3468" }, { k: "보통", n: midN, c: "#5b8fc9" }, { k: "낮음", n: lowN, c: "#15c2a2" }]
            const riskTot = Math.max(1, highN + midN + lowN)
            return (
              <DashCard title={compBy === "composition" ? "VoC 비중 분석" : "악성민원 발전 위험"} sub="금일 14:30 업데이트" className="min-w-0 grow-[2] basis-0">
                <style>{`@keyframes voc-slide { from { opacity: 0; transform: translateX(10px) } to { opacity: 1; transform: none } }`}</style>
                {(() => {
                  const isComp = compBy === "composition"
                  const list = isComp ? comp : risk
                  const ctot = isComp ? totalN : riskTot
                  return (
                    <div key={compBy} className="animate-[voc-slide_.35s_ease] flex min-h-0 flex-1 flex-col justify-center gap-1.5">
                      <div className="flex items-center gap-3">
                        <Donut segments={list.map((c) => ({ label: c.k, value: c.n, color: c.c }))} centerTop={isComp ? fmtN(totalN) : `${avgScore}`} centerSub={isComp ? "전체 문의" : "평균 위험"} hideLegend size={62} />
                        <div className="min-w-0 flex-1 space-y-1">
                          {list.map((c) => <div key={c.k} className="flex items-center gap-1.5 text-[9.5px]"><span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: c.c }} /><span className="min-w-0 flex-1 truncate text-[#33445c]">{c.k}</span><b className="tabular-nums text-[#10233f]">{fmtN(c.n)}</b><span className="w-7 text-right text-muted-foreground">{Math.round((c.n / ctot) * 100)}%</span></div>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 rounded-md bg-[#eef4fb] px-2 py-1 text-[9px] text-[#0f3468]">{isComp ? <><Activity className="h-3 w-3 shrink-0" />VoC {fmtN(complN + potN)}건 = 불만VoC {fmtN(complN)} + 잠재VoC {fmtN(potN)}</> : <><ShieldAlert className="h-3 w-3 shrink-0" />고위험 {fmtN(highN)}건 · 우선 대응</>}</div>
                    </div>
                  )
                })()}
                <div className="mt-1.5 flex items-center justify-center gap-1.5 border-t border-[#eef2f7] pt-1.5">
                  {([["composition", "VoC 비중"], ["risk", "발전 위험"]] as const).map(([k, l]) => <button key={k} type="button" aria-label={l} onClick={() => setCompBy(k)} className={cn("h-1.5 rounded-full transition-all", compBy === k ? "w-4 bg-[#0f3468]" : "w-1.5 bg-[#d6deea] hover:bg-[#aab4c2]")} />)}
                  <span className="ml-2 text-[9px] font-medium text-muted-foreground">{compBy === "composition" ? "VoC 비중" : "발전 위험"}</span>
                </div>
              </DashCard>
            )
          })()}
          {/* ② 고위험 민원 비중 — 채널/유형 슬라이드 */}
          {(() => {
            const rows = riskBy === "channel"
              ? statKeys.map((k) => { const s = statByKey(k); return { label: k as string, Icon: (CH_ICON[k] ?? Phone) as typeof Phone | null, low: s.low, mid: s.mid, high: s.high, dod: s.dod } })
              : TODAY_TYPES.slice(0, 6).map((v) => { const f = (complN + potN) / TODAY_TYPES_TOTAL; const total = Math.round(v.total * f); const high = Math.round(v.high * f); const rest = Math.max(0, total - high); const mid = Math.round(rest * 0.45); return { label: v.major, Icon: null as typeof Phone | null, low: rest - mid, mid, high, dod: (hashNum(v.major) % 21) - 8 } })
            return (
              <DashCard title={riskBy === "channel" ? "채널별 고위험 민원 비중" : "유형별 고위험 민원 비중"} sub="14:30 기준" className="min-w-0 grow-[3] basis-0">
                <style>{`@keyframes voc-slide { from { opacity: 0; transform: translateX(10px) } to { opacity: 1; transform: none } }`}</style>
                <div key={riskBy} className="animate-[voc-slide_.35s_ease] flex min-h-0 flex-1 flex-col justify-center gap-1 overflow-hidden">
                  {(() => { const maxTot = Math.max(...rows.map((x) => x.low + x.mid + x.high), 1); return rows.map((r) => { const t = Math.max(1, r.low + r.mid + r.high); const Icon = r.Icon; return (
                    <div key={r.label} className="flex items-center gap-1.5 text-[9.5px]">
                      <span className="flex w-[64px] shrink-0 items-center gap-1 text-[#33445c]">{Icon ? <Icon className="h-2.5 w-2.5 shrink-0" /> : null}<span className="truncate">{r.label}</span></span>
                      <div className="flex h-2 min-w-0 flex-1 items-center overflow-hidden rounded-[2px] bg-[#eef2f7]">
                        <div className="flex h-full overflow-hidden rounded-[2px]" style={{ width: `${(t / maxTot) * 100}%` }}>
                          <div className="h-full" style={{ width: `${(r.low / t) * 100}%`, background: "#15c2a2" }} />
                          <div className="h-full" style={{ width: `${(r.mid / t) * 100}%`, background: "#5b8fc9" }} />
                          <div className="h-full" style={{ width: `${(r.high / t) * 100}%`, background: "#0f3468" }} />
                        </div>
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-right tabular-nums text-[#10233f]">고위험 <b className="text-[#0f3468]">{fmtN(r.high)}</b><span className="text-muted-foreground">/{fmtN(t)}</span></span>
                      <span className={cn("flex w-8 shrink-0 items-center justify-end gap-0.5 whitespace-nowrap text-[8.5px] font-semibold tabular-nums", r.dod >= 0 ? "text-[#0f3468]" : "text-[#0c8f78]")}>{r.dod >= 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}{Math.abs(r.dod)}%</span>
                    </div>
                  ) }) })()}
                </div>
                <div className="mt-1 flex items-center gap-2 border-t border-[#eef2f7] pt-1 text-[8.5px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#15c2a2]" />낮음</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#5b8fc9]" />보통</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#0f3468]" />높음</span>
                  <div className="ml-auto flex items-center gap-1">
                    {([["channel", "채널별"], ["type", "유형별"]] as const).map(([k, l]) => <button key={k} type="button" aria-label={l} onClick={() => setRiskBy(k)} className={cn("h-1.5 rounded-full transition-all", riskBy === k ? "w-4 bg-[#0f3468]" : "w-1.5 bg-[#d6deea] hover:bg-[#aab4c2]")} />)}
                  </div>
                </div>
              </DashCard>
            )
          })()}
          {/* ②' 이관 진행률 — 하단 처리 큐와 동일 모집단(scoped)에서 집계 → 미배정 수가 큐와 정확히 일치 */}
          {(() => {
            const total = Math.max(1, scoped.length)
            const una = scoped.filter(isUnassigned).length // 미배정 = 큐의 미배정 수와 동일
            const done = scoped.filter((r) => statusOf(r) === "처리 완료").length // 처리완료
            const assigned = Math.max(0, scoped.length - una - done) // 배정완료(처리 중)
            const rate = Math.round(((scoped.length - una) / total) * 100)
            // 진행 순서(좌→우): 처리완료 → 배정완료 → 미배정
            const segs = [
              { k: "처리 완료", n: done, c: "#15c2a2" },
              { k: "배정 완료", n: assigned, c: "#2f6bb0" },
              { k: "미배정", n: una, c: "#d6deea" },
            ]
            return (
              <DashCard title="이관 진행률" sub={`처리 대상 ${fmtN(scoped.length)}건 기준`} className="min-w-0 grow-[2] basis-0">
                <div className="flex min-h-0 flex-1 items-center gap-3">
                  <div className="shrink-0 text-center">
                    <div className="flex items-baseline justify-center gap-0.5"><span className="text-[26px] font-bold leading-none tabular-nums text-[#0f3468]">{rate}</span><span className="text-[11px] font-medium text-muted-foreground">%</span></div>
                    <div className="mt-0.5 text-[9px] text-muted-foreground">이관 완료</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-[2px] bg-[#eef2f7]">{segs.map((s) => <div key={s.k} className="h-full" style={{ width: `${(s.n / total) * 100}%`, background: s.c }} />)}</div>
                    <div className="mt-1.5 space-y-0.5">
                      {[...segs].reverse().map((s) => <div key={s.k} className="flex items-center gap-1.5 text-[9.5px]"><span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: s.c }} /><span className="min-w-0 flex-1 truncate text-[#33445c]">{s.k}</span><b className="tabular-nums text-[#10233f]">{fmtN(s.n)}건</b><span className="w-8 text-right text-muted-foreground">{Math.round((s.n / total) * 100)}%</span></div>)}
                    </div>
                  </div>
                </div>
              </DashCard>
            )
          })()}
          {/* ③ 부서별 현황 — 배정·완료·대기 + 병목 (40%) */}
          {(() => {
            const MINT = "#15c2a2"
            // 대기(적체) 많은 순 정렬
            const sorted = [...deptProc].sort((a, b) => (b.inflow - b.done) - (a.inflow - a.done))
            const stat = (bl: number) => bl >= 80 ? { k: "병목", c: "#0f3468" } : bl >= 60 ? { k: "주의", c: "#2f6bb0" } : { k: "정상", c: "#0c8f78" }
            return (
              <DashCard title="부서별 민원 처리 현황" sub="금일 배정 기준 · 처리 적체" className="min-w-0 grow-[3] basis-0">
                <div className="flex min-h-0 flex-1 flex-col justify-center gap-1 overflow-hidden">
                  {sorted.map((r) => { const wait = r.inflow - r.done; const bl = Math.round((wait / r.inflow) * 100); const s = stat(bl); return (
                    <div key={r.dept} className="flex items-center gap-1.5 text-[9.5px]">
                      <span className="w-[68px] shrink-0 truncate font-semibold text-[#10233f]">{r.dept}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-[2px] bg-[#eef2f7]"><div className="h-full" style={{ width: `${bl}%`, background: MINT }} /></div>
                      <span className="w-[94px] shrink-0 text-right tabular-nums text-[#10233f]">대기 <b className="text-[#0f3468]">{fmtN(wait)}</b> <span className="text-[8.5px] text-muted-foreground">({fmtN(r.done)}/{fmtN(r.inflow)})</span></span>
                      <span className="inline-flex w-[28px] shrink-0 items-center justify-center rounded-sm py-px text-[8px] font-semibold" style={{ color: s.c, background: `${s.c}1a` }}>{s.k}</span>
                    </div>
                  ) })}
                </div>
                <div className="mt-1 flex items-center justify-end gap-2 border-t border-[#eef2f7] pt-1 text-[8.5px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#0c8f78]" />정상</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#2f6bb0]" />주의</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#0f3468]" />병목</span>
                </div>
              </DashCard>
            )
          })()}
        </div>
        ) : dashView === "ops" ? (
        <div className="flex min-h-[150px] divide-x divide-[#eef2f7]">
          {/* 채널별 민원 접수 — 좌측 고정 */}
          <Panel title="채널별 민원" sub={`민원 ${fmtN(complN)}건`} grow={1.4}>
            <div className="space-y-1">
              {chMix.map((x, i) => { const ChIcon = CH_ICON[x.ch] ?? Phone; const cv = jit(x.complaint, i * 7, tick); return (
                <div key={x.ch} className="flex items-center gap-2 text-[10.5px]">
                  <span className="flex w-[96px] shrink-0 items-center gap-1 whitespace-nowrap text-muted-foreground"><ChIcon className="h-3 w-3 shrink-0" />{x.ch}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#eef2f7]"><div className="h-full rounded-full bg-[#0f3468] transition-all duration-700" style={{ width: `${(cv / chMax) * 100}%` }} /></div>
                  <span className="w-10 text-right font-semibold tabular-nums text-[#10233f]">{fmtN(cv)}</span>
                  <span className={cn("flex w-12 shrink-0 items-center justify-end gap-0.5 text-[9px] font-semibold tabular-nums", x.dod >= 0 ? "text-red-500" : "text-emerald-600")}>{x.dod >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(x.dod)}%</span>
                </div>
              ) })}
            </div>
            <div className="mt-2 border-t border-[#eef2f7] pt-1.5 text-[9.5px] text-muted-foreground">전체 인입 {fmtN(totalN)}건 중 민원 {fmtN(complN)}건 · 전일 동시간 대비 증감</div>
          </Panel>
          {/* 실시간 주요 민원 유형 */}
          <Panel title="실시간 주요 민원 유형" grow={2.2}
            right={<span className="flex items-center gap-2 text-[9px] text-muted-foreground"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "#0f3468" }} />고위험</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "#e5484d" }} />처리대기 적체</span></span>}>
            <div className="overflow-hidden border border-[#dbe5f1]">
              <table className="w-full table-fixed border-collapse text-left">
                <thead className="bg-[#f7fafe] text-[9.5px] font-semibold text-[#3a5e8c]">
                  <tr><th className="w-[84px] px-2 py-1">유형</th><th className="px-2 py-1">주요 토픽</th><th className="w-[104px] px-2 py-1 text-center">인입건수</th><th className="w-14 px-2 py-1 text-right">처리대기</th></tr>
                </thead>
                <tbody>
                  {[...TOP_TYPES].sort((a, b) => b.n - a.n).map((r, i) => { const n = jit(r.n, i * 3, tick); const high = jit(r.high, i * 3 + 1, tick); const pending = jit(r.pending, i * 3 + 2, tick); return (
                    <tr key={r.type} className="border-t border-[#eef3f9] align-middle text-[10.5px]">
                      <td className="px-2 py-1 font-semibold text-[#10233f]">{r.type}</td>
                      <td className="truncate px-2 py-1 text-[9.5px] text-[#5b6b80]">{r.kws.slice(0, 3).join(" · ")}</td>
                      <td className="whitespace-nowrap px-2 py-1 text-right">
                        <span className="rounded-sm bg-[#eef4fb] px-1 py-px text-[9px] font-semibold tabular-nums text-[#0f3468]">고위험 {fmtN(high)}</span>
                        <span className="ml-[5px] font-semibold tabular-nums text-[#10233f]">{fmtN(n)}</span>
                      </td>
                      <td className="px-2 py-1 text-right font-semibold tabular-nums" style={{ color: pending >= 100 ? "#e5484d" : "#94a3b8" }}>{fmtN(pending)}</td>
                    </tr>
                  ) })}
                </tbody>
              </table>
            </div>
          </Panel>
          {/* 급증 키워드 — 12위까지 6개씩 자동 순환 */}
          <Panel title="급증 키워드" sub={`실시간 · ${kwPage * 6 + 1}–${kwPage * 6 + 6}위`} grow={1.2}>
            <style>{`@keyframes voc-fade { from { opacity: 0; transform: translateY(5px) } to { opacity: 1; transform: none } }`}</style>
            <div key={kwPage} className="animate-[voc-fade_.5s_ease] space-y-0.5">
              {SURGE_KW.slice(kwPage * 6, kwPage * 6 + 6).map(([name, n], i) => { const rank = kwPage * 6 + i + 1; return (
                <div key={name} className="flex items-center gap-2 px-1 py-0.5 text-[10.5px]">
                  <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-md text-[9px] font-bold", rank <= 3 ? "bg-[#0f3468] text-white" : "bg-[#eef2f7] text-[#5b6b80]")}>{rank}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-[#10233f]">{name}</span>
                  <span className="shrink-0 tabular-nums text-[10px] font-semibold text-[#0f3468]">{fmtN(jit(n, rank * 5, tick))}</span>
                </div>
              ) })}
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-1 border-t border-[#eef2f7] pt-1.5">
              {Array.from({ length: KW_PAGES }).map((_, p) => <span key={p} className={cn("h-1.5 rounded-full transition-all", p === kwPage ? "w-4 bg-[#0f3468]" : "w-1.5 bg-[#d6deea]")} />)}
            </div>
          </Panel>
        </div>
        ) : dashView === "insight" ? (
        <div className="flex min-h-[150px] divide-x divide-[#eef2f7]">
          {/* 부서별 현황 — 배정·처리·미처리(잔여)·처리율 통합 */}
          <Panel title="부서별 현황" grow={2}>
            <div className="overflow-hidden border border-[#dbe5f1]">
              <table className="w-full border-collapse text-left">
                <thead className="bg-[#f7fafe] text-[9.5px] font-semibold text-[#3a5e8c]">
                  <tr><th className="px-3 py-1">부서</th><th className="w-[150px] px-2 py-1 text-center">배정 (처리 / 잔여)</th><th className="w-[130px] px-3 py-1">처리율</th><th className="w-14 px-2 py-1 text-center">상태</th></tr>
                </thead>
                <tbody>
                  {[...DEPT_PROC].sort((a, b) => (b.inflow - b.done) - (a.inflow - a.done)).map((r) => { const t = procTone(r); const backlog = r.inflow - r.done; return (
                    <tr key={r.dept} className="border-t border-[#eef3f9] align-middle text-[11px]">
                      <td className="px-3 py-0.5 font-semibold text-[#10233f]">{r.dept}</td>
                      <td className="whitespace-nowrap px-2 py-0.5 text-center tabular-nums text-[#10233f]">
                        <span className="font-semibold">{fmtN(r.inflow)}</span>
                        <span className="ml-1 text-muted-foreground">({fmtN(r.done)}<span className="mx-1 text-[#cbd5e1]">/</span><span className="font-semibold" style={{ color: backlog > 0 ? "#0f3468" : "#94a3b8" }}>{fmtN(backlog)}</span>)</span>
                      </td>
                      <td className="px-3 py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-8 shrink-0 text-right font-semibold tabular-nums" style={{ color: TONE_HEX2[t] }}>{procRate(r)}%</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-[2px] bg-[#eef2f7]"><div className="h-full" style={{ width: `${procRate(r)}%`, background: TONE_HEX2[t] }} /></div>
                        </div>
                      </td>
                      <td className="px-2 py-0.5 text-center"><span className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9.5px] font-medium" style={{ color: TONE_HEX2[t], background: `${TONE_HEX2[t]}1a` }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: TONE_HEX2[t] }} />{procLabel(t)}</span></td>
                    </tr>
                  ) })}
                </tbody>
              </table>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-[9px] text-muted-foreground">
              <span>배정 = 유입 · 처리 = 완료 · 잔여 = 미처리 적체</span>
              <span className="ml-auto flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "#14b8a6" }} />정상</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "#f59e0b" }} />주의</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "#0f3468" }} />병목</span>
              </span>
            </div>
          </Panel>
          {/* VoC 유형 · 민원 비중 — 유관 부서 연계 */}
          <Panel title="VoC 유형 · 민원 비중" grow={2}>
            {(() => {
              const voc = PERIOD_DATA["30d"].voc
              const max = Math.max(...voc.map((v) => v.total), 1)
              return (
                <div className="space-y-0.5">
                  {voc.map((v) => {
                    const dep = DEPT_BY_TYPE[v.major] ?? "—"
                    const highPct = v.total ? (v.high / v.total) * 100 : 0
                    return (
                      <div key={v.major} className="flex items-center gap-2 text-[10px]">
                        <span className="w-[84px] shrink-0 truncate text-[#33445c]">{v.major}</span>
                        <span className="w-[72px] shrink-0 truncate rounded-sm border border-[#dbe5f1] bg-[#f7fafe] px-1 py-px text-[8.5px] text-[#0b4f91]">{dep}</span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-[#eef2f7]">
                          <div className="flex h-full overflow-hidden rounded-sm" style={{ width: `${(v.total / max) * 100}%` }}>
                            <div className="h-full bg-[#9bb9d8]" style={{ width: `${100 - highPct}%` }} />
                            <div className="h-full bg-red-500" style={{ width: `${highPct}%` }} />
                          </div>
                        </div>
                        <span className="w-12 shrink-0 text-right tabular-nums text-[#10233f]">{v.total}<span className="text-red-500"> · {v.high}</span></span>
                      </div>
                    )
                  })}
                  <div className="flex items-center gap-2 pt-0.5 text-[8.5px] text-muted-foreground"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#9bb9d8]" />전체</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-500" />민원</span></div>
                </div>
              )
            })()}
          </Panel>
        </div>
        ) : null}
      </div>

      {/* 하단 — 민원 처리 큐 (화면 분할 하단, 현황:큐 = 30:70) */}
      <div className="flex min-h-0 flex-col px-6 pb-4 pt-2" style={{ flex: "7 1 0%" }}>
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-[#eef2f7] bg-gradient-to-r from-[#e8f1fb] to-white px-3 py-1.5">
            <div className="text-[11.5px] font-bold text-[#10233f]">민원 처리 큐</div>
            <div className="flex items-center gap-0.5 rounded-md border border-[#dbe5f1] bg-[#f7fafe] p-0.5">
              {([["kanban", "칸반"], ["inbox", "인박스"]] as const).map(([k, l]) => (
                <button key={k} type="button" onClick={() => setQMode(k)} className={cn("rounded px-2 py-0.5 text-[10px] font-semibold transition-colors", qMode === k ? "bg-[#0f3468] text-white shadow-sm" : "text-[#33445c] hover:bg-white")}>{l}</button>
              ))}
            </div>
            {qMode === "kanban" ? (
              <div className="inline-flex items-center gap-0.5 rounded-md bg-[#eef1f6] p-0.5">
                {(["유형", "부서"] as const).map((g) => (
                  <button key={g} type="button" onClick={() => setKanbanBy(g)} className={cn("rounded px-2 py-0.5 text-[10px] font-medium transition-colors", kanbanBy === g ? "bg-white text-[#0f3468] shadow-sm" : "text-[#5b6b80] hover:text-[#10233f]")}>{g}별</button>
                ))}
              </div>
            ) : null}
            {qMode === "inbox" ? (
              <div className="inline-flex items-center gap-0.5 rounded-md bg-[#eef1f6] p-0.5">
                {([["all", "전체", scoped.length], ["done", "완료", cnt.done], ["unassigned", "미배정", cnt.unassigned]] as const).map(([k, label, n]) => (
                  <button key={k} type="button" onClick={() => { setFocus(k as never); setStatusFilter(k === "unassigned" ? "unassigned" : "all") }} className={cn("flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors", focus === k ? "bg-white text-[#0f3468] shadow-sm" : "text-[#5b6b80] hover:text-[#10233f]")}>{label}<span className={cn("tabular-nums", focus === k ? "font-bold text-[#0f3468]" : "text-muted-foreground")}>{n}</span></button>
                ))}
              </div>
            ) : null}
            {/* 자동배정·검색은 항상 우측 고정(모드/그룹 변화에 흔들리지 않게) */}
            <div className="ml-auto flex items-center gap-2">
              {qMode === "inbox" ? <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#15c2a2] opacity-75" /><span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#0c8f78]" /></span>인입 {intakePerMin}건/분</span> : null}
              <button type="button" onClick={() => setAuto((v) => !v)} className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors", auto ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#dbe5f1] bg-white text-[#5b6b80]")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", auto ? "bg-[#5fe3c0]" : "bg-slate-300")} />자동 배정 {auto ? "ON" : "OFF"}
              </button>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/50" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="고객명·문의 ID 검색" className="h-7 w-[150px] pl-7 !text-[10px] placeholder:text-[10px] placeholder:text-muted-foreground/60" />
              </div>
            </div>
          </div>

          {qMode === "inbox" ? (<>
          {/* 일괄 배정 바 */}
          {picked.length ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-[#bcd3ef] bg-[#f2f8ff] px-3 py-2 text-[11px]">
              <span className="font-semibold text-[#0b4f91]">{picked.length}건 선택</span>
              <span className="text-muted-foreground">→ AI 배정 부서로 이관</span>
              <Button size="sm" onClick={() => transfer(INFLOW.filter((r) => picked.includes(r.key)))} className="h-7 gap-1 bg-[#0f3468] text-[11px] hover:bg-[#0b2547]"><Bell className="h-3 w-3" /> 이관 확정·알림</Button>
              <button type="button" onClick={() => setPicked([])} className="text-[10px] text-muted-foreground hover:text-[#10233f]">선택 해제</button>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1160px] table-fixed border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#f7fafe] text-[10px] font-semibold text-[#3a5e8c]">
              <tr>
                <th className="w-8 px-2 py-2 text-center"><input type="checkbox" checked={rows.length > 0 && rows.every((r) => picked.includes(r.key))} onChange={(e) => setPicked(e.target.checked ? rows.map((r) => r.key) : [])} className="h-3 w-3 align-middle accent-[#0f3468]" /></th>
                <th className="w-[108px] px-2 py-2">VoC</th>
                <th className="w-[54px] px-2 py-2">일시</th>
                <th className="w-[256px] px-2 py-2">VoC 요약</th>
                <th className="w-[150px] px-2 py-2">VoC 유형</th>
                <th className="w-[110px] px-2 py-2">감지 신호</th>
                <th className="w-[78px] px-2 py-2">민원 전이 위험</th>
                <th className="w-[124px] px-2 py-2"><span className="group/tt relative inline-flex items-center gap-0.5 whitespace-nowrap">긴급도 · 처리기한(SLA)<Info className="h-2.5 w-2.5 shrink-0 cursor-help text-[#9aa6b6]" /><span className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-[188px] whitespace-normal rounded-md border border-[#e6edf5] bg-white p-2.5 text-left text-[9px] font-normal leading-relaxed text-[#33445c] shadow-lg group-hover/tt:block"><b className="text-[#0f3468]">긴급도</b> — 등급별 표준 처리기한:<span className="mt-1 flex flex-col gap-0.5"><span>· <b className="text-[#10233f]">긴급</b> — 10분 이내</span><span>· <b className="text-[#10233f]">높음</b> — 30분 이내</span><span>· <b className="text-[#10233f]">보통</b> — 100분 이내</span><span>· <b className="text-[#10233f]">낮음</b> — 4시간 이내</span></span></span></span></th>
                <th className="w-[128px] px-2 py-2 text-center">이관 부서</th>
                <th className="w-[96px] px-2 py-2 text-center">
                  <div className="relative inline-flex items-center justify-center gap-0.5">
                    진행 상태
                    <button type="button" onClick={() => setStatusMenuOpen((v) => !v)} className={cn("flex h-4 w-4 items-center justify-center rounded transition-colors", statusFilter !== "all" || statusMenuOpen ? "text-[#0f3468]" : "text-[#9aa6b6] hover:text-[#0f3468]")} aria-label="진행 상태 필터">
                      <ChevronDown className={cn("h-3 w-3 transition-transform", statusMenuOpen && "rotate-180")} />
                    </button>
                    {statusFilter !== "all" ? <span className="h-1.5 w-1.5 rounded-full bg-[#0f3468]" /> : null}
                    {statusMenuOpen ? (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setStatusMenuOpen(false)} />
                        <div className="absolute right-0 top-full z-50 mt-1 min-w-[128px] rounded-md border border-[#dbe5f1] bg-white p-1 text-left font-normal shadow-lg">
                          {([["all", "전체"], ["unassigned", "미배정"], ["assigned", "배정 완료"], ["processed", "처리 완료"]] as const).map(([k, label]) => { const on = statusFilter === k; return (
                            <button key={k} type="button" onClick={() => { setStatusFilter(k as never); setFocus(k === "unassigned" ? "unassigned" : k === "all" ? "all" : "done"); setStatusMenuOpen(false) }} className={cn("flex w-full items-center justify-between gap-3 rounded px-2 py-1 text-[10px] font-medium transition-colors", on ? "bg-[#eef4fb] text-[#0f3468]" : "text-[#33445c] hover:bg-[#f2f8ff]")}>{label}<span className={cn("tabular-nums", on ? "font-bold text-[#0f3468]" : "text-muted-foreground")}>{statusCnt[k]}</span></button>
                          ) })}
                        </div>
                      </>
                    ) : null}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-[11.5px] text-muted-foreground">처리할 예외 건이 없습니다. 모두 자동 배정되었습니다.</td></tr>
              ) : rows.map((r) => {
                const ChIcon = CH_ICON[r.channel] ?? Phone
                const st = statusOf(r); const m = slaOf(r); const imminent = slaImminent(r)
                const slaTxt = m >= 60 ? `${Math.floor(m / 60)}시간` : `${m}분`
                const sig = detectSignal(r)
                return (
                  <tr key={r.key} onClick={() => { setSel(r.key); setDetailOpen(true); setAssignFlash(null); setRegFlash(null) }} className={cn("group cursor-default border-t border-[#eef3f9] align-middle text-[11.5px] transition-colors", picked.includes(r.key) ? "bg-[#f2f8ff]" : "hover:bg-[#f7fafe]")}>
                    <td className="px-2 py-2 text-center align-middle" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={picked.includes(r.key)} onChange={() => togglePick(r.key)} className="h-3 w-3 align-middle accent-[#0f3468]" /></td>
                    <td className="px-2 py-2">
                      <div className="font-mono text-[9px] font-semibold text-[#10233f]">{inqId(r.id)}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-[9.5px] text-muted-foreground"><span className="text-[#5b6b80]">{r.customer}</span><span>·</span><ChIcon className="h-2.5 w-2.5" /><span>{r.channel}</span></div>
                    </td>
                    <td className="px-2 py-2 text-[9px] leading-tight text-[#5b6b80]">{(() => { const w = whenParts(r.datetime); return <><div>{w.date} ({w.wd})</div><div>{w.time}</div></> })()}</td>
                    <td className="px-2 py-2">
                      <div className="truncate text-[10px] text-[#33445c]">{r.summary}</div>
                      {(() => { const ks = analysisKeywords(r); return ks.length ? <div className="mt-1 flex flex-wrap items-center gap-1">{ks.map((k) => <span key={k} className="inline-flex items-center gap-0.5 rounded-sm border border-[#e7c9a0] bg-[#fdf6ec] px-1 py-px text-[8.5px] font-medium text-[#9a6a1f]"><AlertTriangle className="h-2 w-2 shrink-0" />{k}</span>)}</div> : null })()}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-[9.5px] text-[#10233f]">{typeOf(r)}{minorOf(r) ? <span> › {minorOf(r)}</span> : null}</td>
                    <td className="px-2 py-2">{(() => { const sv = riskSignal(r); return sv ? <div className="flex flex-col gap-0.5"><span className="inline-flex w-fit max-w-full items-center gap-0.5 rounded-sm border border-[#cfd8e3] bg-[#eef2f7] px-1 py-0.5 text-[9px] font-medium text-[#0f3468]"><sv.Icon className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{sv.label}</span></span>{sv.detail ? <span className="pl-0.5 text-[8.5px] text-muted-foreground">{sv.detail}</span> : null}</div> : null })()}</td>
                    <td className="px-2 py-2 align-middle">
                      <div className="flex items-center gap-1"><span className="text-[10px] font-bold tabular-nums text-[#10233f]">{r.risk}</span><span className="font-mono text-[9.5px] text-muted-foreground">{r.score}</span></div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#eef2f7]"><div className="h-full rounded-full" style={{ width: `${r.score}%`, background: riskBarGrad(r.risk) }} /></div>
                    </td>
                    <td className="px-2 py-2 align-middle"><div className="flex items-center justify-center gap-1"><Chip label={r.urgency} level={urgencyTone(r.urgency)} sm />{imminent ? <span className="inline-flex items-center gap-0.5 rounded-sm bg-[#fbeceb] px-1 py-px text-[8.5px] font-semibold tabular-nums text-[#b3261e]"><AlertTriangle className="h-2 w-2" />{slaTxt}</span> : <span className="text-[8.5px] tabular-nums text-muted-foreground">{slaTxt}</span>}</div></td>
                    <td className="px-2 py-2 align-middle" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <select value={deptOf(r)} onChange={(e) => setDeptMap((p) => ({ ...p, [r.key]: e.target.value }))} className="h-6 w-[80px] rounded-md border border-[#dbe5f1] bg-white px-1 text-center text-[9.5px] text-[#10233f] outline-none focus:border-[#0f3468]">
                          {DEPTS.map((dp) => <option key={dp} value={dp}>{dp}</option>)}
                        </select>
                        <button type="button" disabled={st !== "분석 완료"} onClick={() => transfer([r])} title="담당 부서로 이관·VoC 등록" className="inline-flex h-6 shrink-0 items-center gap-0.5 rounded-md bg-[#0f3468] px-1.5 text-[9px] font-semibold text-white transition-colors hover:bg-[#0b2547] disabled:cursor-not-allowed disabled:bg-[#e6edf5] disabled:text-[#a8b3c2]"><Bell className="h-2.5 w-2.5" /> 이관</button>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center align-middle">
                      {(() => {
                        const label = st === "분석 완료" ? "미배정" : st === "처리 완료" ? "처리 완료" : "배정 완료"
                        // 무채색 톤으로 단계 구분(미배정: 옅은 회색 → 배정 완료: 중간 회색 → 처리 완료: 진한 회색 채움)
                        const tone = st === "분석 완료" ? "border-[#e2e8f0] bg-[#f8fafc] text-[#94a3b8]" : st === "처리 완료" ? "border-[#94a3b8] bg-[#e2e8f0] text-[#1e293b]" : "border-[#cbd5e1] bg-[#f1f5f9] text-[#475569]"
                        return <span className={cn("inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[9px] font-semibold", tone)}>{st !== "분석 완료" ? <CheckCircle2 className="h-2.5 w-2.5" /> : null}{label}</span>
                      })()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
          </>) : (
          /* 칸반 — 그룹 기준은 헤더에서 선택 */
          <>
          <div className="flex min-h-0 flex-1 gap-3 overflow-auto p-2">
            {(() => {
              const byType = kanbanBy === "유형"
              // 큐 = 미배정(AI 분류 완료, 이관 대기)만. 배정·완료건은 큐에서 제외.
              const base = scoped.filter(isUnassigned).filter((r) => !query.trim() || r.customer.includes(query) || r.id.includes(query) || r.vocType.includes(query))
              let cols: [string, Inflow[]][]
              if (kanbanBy === "부서") cols = DEPTS.map((d) => [d, base.filter((r) => deptOf(r) === d)] as [string, Inflow[]])
              else cols = TODAY_TYPES.map((t) => [t.major, base.filter((r) => typeOf(r) === t.major)] as [string, Inflow[]])
              // 고위험 많은 컬럼을 좌측에(동수면 전체 건수 순) → 전부 처리된 빈 보드는 우측으로 밀리되 사라지지 않음
              cols = cols.sort((a, b) => b[1].filter(isHighRisk).length - a[1].filter(isHighRisk).length || b[1].length - a[1].length)
              return (<>{cols.map(([label, items]) => { const keys = items.map((i) => i.key); const allSel = keys.length > 0 && keys.every((k) => picked.includes(k)); const highCnt = items.filter(isHighRisk).length; const pickedN = items.filter((i) => picked.includes(i.key)).length; return (
                <div key={label} onDragOver={(e) => { if (dragKey) { e.preventDefault(); if (dragOverCol !== label) setDragOverCol(label) } }} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol((c) => (c === label ? null : c)) }} onDrop={(e) => { e.preventDefault(); dropToCol(label) }} className={cn("flex w-[238px] shrink-0 flex-col overflow-hidden rounded-lg border bg-[#f7fafe] transition-colors", dragOverCol === label ? "border-[#0f3468] ring-2 ring-[#0f3468]/25" : "border-[#e2eaf4]")}>
                  <div className="border-b border-[#e6edf5] bg-white px-2 py-1.5">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span className="min-w-0 truncate text-[11px] font-bold text-[#10233f]">{label}</span>
                      <span className="ml-auto flex shrink-0 items-center gap-1">
                        {highCnt > 0 ? <span className="rounded-full bg-[#fbeceb] px-1.5 py-0.5 text-[9px] font-bold text-[#b3261e]">고위험 {highCnt}</span> : null}
                        <span className="rounded-full bg-[#eef2f7] px-1.5 py-0.5 text-[9px] font-bold text-[#5b6b80]">{items.length}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="flex shrink-0 cursor-pointer items-center gap-1 text-[9px] font-medium text-[#5b6b80]"><input type="checkbox" checked={allSel} onChange={() => toggleColAll(keys)} className="h-3 w-3 accent-[#0f3468]" />전체 선택</label>
                      <Button size="sm" onClick={() => transferCol(items)} disabled={items.length === 0} className={cn("ml-auto h-5 gap-1 px-2.5 text-[10px] leading-none disabled:opacity-40", pickedN ? "bg-[#0f3468] text-white hover:bg-[#0b2547]" : "border border-[#cfe0f1] bg-white text-[#0f3468] hover:border-[#0f3468] hover:bg-[#0f3468] hover:text-white")}><Bell className="h-2.5 w-2.5" /> 이관 확정{pickedN ? ` (${pickedN})` : ""}</Button>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
                    {items.length === 0 && dragOverCol === label && dragKey ? <div className="h-[22px] rounded-sm border border-dashed border-[#0f3468]/40 bg-[#eef4fb]/60" /> : null}
                    {items.length === 0 && !(dragOverCol === label && dragKey) ? <div className="flex flex-col items-center gap-1 px-1 py-6 text-center text-[10px] text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-[#cbd5e1]" />처리할 건 없음</div> : [...items].sort((a, b) => (RISK_RANK[b.risk] ?? 0) - (RISK_RANK[a.risk] ?? 0) || b.score - a.score).map((r) => { const ChIcon = CH_ICON[r.channel] ?? Phone; const sel2 = picked.includes(r.key); const showGap = !!dragKey && dragKey !== r.key && dragOverKey === r.key; return (
                      <Fragment key={r.key}>
                      {showGap ? <div className="h-[22px] rounded-sm border border-dashed border-[#0f3468]/40 bg-[#eef4fb]/60" /> : null}
                      <div draggable onDragStart={(e) => { setDragKey(r.key); e.dataTransfer.effectAllowed = "move" }} onDragEnd={endDrag} onDragOver={(e) => { if (dragKey && dragKey !== r.key) { e.preventDefault(); if (dragOverKey !== r.key) setDragOverKey(r.key) } }} onClick={() => { setSel(r.key); setDetailOpen(true); setAssignFlash(null); setRegFlash(null) }} className={cn("cursor-grab rounded-md border bg-white p-2 active:cursor-grabbing", dragKey === r.key ? "opacity-40" : "", sel2 ? "border-[#0f3468] ring-1 ring-[#0f3468]/20" : "border-[#e2eaf4] hover:border-[#bcd3ef]")}>
                        <div className="flex items-start gap-1.5">
                          <input type="checkbox" checked={sel2} onClick={(e) => e.stopPropagation()} onChange={() => togglePick(r.key)} className="mt-0.5 h-3 w-3 shrink-0 accent-[#0f3468]" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1"><span className="text-[11px] font-semibold text-[#10233f]">{r.customer}</span><span className="inline-flex items-center gap-0.5 rounded-sm border border-[#dbe5f1] bg-[#f7fafe] px-1 py-px text-[8px] text-[#5b6b80]"><ChIcon className="h-2 w-2" />{r.channel}</span><span className="ml-auto text-[8.5px] text-muted-foreground">{r.datetime}</span></div>
                            <div className="font-mono text-[8.5px] text-muted-foreground">{r.id}</div>
                          </div>
                        </div>
                        <div className="mt-1 truncate text-[10px] text-[#33445c]">{byType ? (r.vocMinor ?? r.summary) : (r.vocMinor ?? r.vocType)}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: riskHexU(r.risk) }} /><span className="text-[9.5px] font-semibold tabular-nums text-[#5b6b80]">{r.risk}·{r.score}</span><Chip label={r.urgency} level={urgencyTone(r.urgency)} sm />{(() => { const sv = signalView(r); return sv ? <span className="inline-flex items-center gap-0.5 rounded-sm border border-[#cfd8e3] bg-[#eef2f7] px-1 py-px text-[8.5px] font-medium text-[#0f3468]"><sv.Icon className="h-2 w-2 shrink-0" />{sv.label}</span> : null })()}</div>
                        {(() => { const ks = analysisKeywords(r); return ks.length ? <div className="mt-1 flex flex-wrap items-center gap-1">{ks.map((k) => <span key={k} className="inline-flex items-center gap-0.5 rounded-sm border border-[#e7c9a0] bg-[#fdf6ec] px-1 py-px text-[8px] font-medium text-[#9a6a1f]"><AlertTriangle className="h-2 w-2 shrink-0" />{k}</span>)}</div> : null })()}
                        <div className="mt-1.5 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <select value={deptOf(r)} onChange={(e) => setDeptMap((p) => ({ ...p, [r.key]: e.target.value }))} className="h-6 min-w-0 flex-1 rounded-md border border-[#dbe5f1] bg-white px-1 text-[9.5px] text-[#10233f] outline-none focus:border-[#0f3468]">{DEPTS.map((dp) => <option key={dp} value={dp}>{dp}</option>)}</select>
                          <button type="button" onClick={() => transfer([r])} className="shrink-0 rounded-md border border-[#cfe0f1] bg-white px-2 py-1 text-[9px] font-semibold text-[#0f3468] hover:border-[#0f3468] hover:bg-[#0f3468] hover:text-white">이관</button>
                        </div>
                      </div>
                      </Fragment>
                    ) })}
                  </div>
                </div>
              ) })}
              {byType ? (() => { const list = UNCLASSIFIED.filter((u) => unclIds.includes(u.id)); return (
                <div className="flex w-[210px] shrink-0 flex-col overflow-hidden rounded-lg border border-dashed border-[#cbd5e1] bg-[#fbfcfe]">
                  <div className="flex items-center gap-1.5 border-b border-[#e6edf5] bg-white px-2.5 py-2 text-[11px] font-bold text-[#5b6b80]"><Sparkles className="h-3 w-3 text-[#94a3b8]" />미분류<span className="text-[8.5px] font-normal text-muted-foreground">· AI 분류 실패, 수동 지정</span><span className="ml-auto rounded-full bg-[#f1f5f9] px-1.5 py-0.5 text-[9px] font-bold text-[#5b6b80]">{list.length}</span></div>
                  <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
                    {list.length === 0 ? <div className="px-1 py-6 text-center text-[10px] text-muted-foreground">분류 대기 없음</div> : list.map((u) => { const ChIcon = CH_ICON[u.channel] ?? Phone; return (
                      <div key={u.id} className="rounded-md border border-dashed border-[#d4dde9] bg-white p-2">
                        <div className="flex items-center gap-1.5"><span className="text-[11px] font-semibold text-[#10233f]">{u.customer}</span><ChIcon className="ml-auto h-3 w-3 text-muted-foreground" /></div>
                        <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">{u.id} · {u.datetime}</div>
                        <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                          <select defaultValue="" onChange={(e) => { if (e.target.value) classifyUncl(u, e.target.value) }} className="h-6 w-full rounded-md border border-[#dbe5f1] bg-white px-1.5 text-[9.5px] text-[#10233f] outline-none focus:border-[#0f3468]">
                            <option value="" disabled>유형 직접 지정…</option>
                            {TODAY_TYPES.map((t) => <option key={t.major} value={t.major}>{t.major}</option>)}
                          </select>
                        </div>
                      </div>
                    ) })}
                  </div>
                </div>
              ) })() : null}
              </>)
            })()}
          </div>
          </>
          )}
        </section>
      </div>

      {/* 이관 완료 토스트 */}
      {toast ? <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#0f3468] px-4 py-2 text-[12px] font-semibold text-white shadow-lg"><CheckCircle2 className="h-4 w-4 text-[#5fe3c0]" />{toast}</div> : null}

      {/* 민원 상세·처리 — 팝업 모달 */}
      {detailOpen && d ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6" onClick={() => setDetailOpen(false)}>
          <div className="my-auto w-[420px] max-w-full overflow-hidden rounded-xl border border-[#e6edf5] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-[#eef2f7] bg-gradient-to-r from-[#e8f1fb] to-white px-3 py-2.5">
              <span className="text-[12px] font-bold text-[#10233f]">민원 상세 · 처리</span>
              <button type="button" onClick={() => setDetailOpen(false)} className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-[#eef2f7] hover:text-[#10233f]"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[80vh] space-y-3 overflow-y-auto p-3">
              {/* 헤더 — 채널·문의ID·고객·상태·일시 */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(() => { const ChIcon = CH_ICON[d.channel] ?? Phone; return <span className="inline-flex items-center gap-1 rounded-sm border border-[#dbe5f1] bg-[#f7fafe] px-1 py-px text-[9px] text-[#0b4f91]"><ChIcon className="h-2.5 w-2.5" />{d.channel}</span> })()}
                <span className="font-mono text-[10px] text-[#0f3468]/70">{inqId(d.id)}</span>
                <span className="text-[12px] font-bold text-[#10233f]">{d.customer}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{d.datetime}</span>
              </div>

              {/* 처리 진행 스테퍼 — 이관 대기 → 배정 완료 → 처리 완료. 배정 완료 스텝 바로 아래에 유형·담당 부서 세부정보 */}
              {(() => {
                const st = statusOf(d)
                const activeIdx = st === "분석 완료" ? 0 : st === "처리 완료" ? 2 : 1
                const assigned = st !== "분석 완료"
                const STEPS = ["이관 대기", "배정 완료", "처리 완료"]
                return (
                  <div className={cn("border-b border-[#eef2f7] px-0.5", assigned ? "pb-10" : "pb-3")}>
                    {/* 스텝 행 — 라인이 끊기지 않도록 라벨만 인라인. 배정 완료 세부는 라벨 시작점 기준 하단 절대배치 */}
                    <div className="flex items-center gap-1.5">
                      {STEPS.map((label, i) => {
                        const state = i < activeIdx ? "done" : i === activeIdx ? "current" : "todo"
                        return (
                          <Fragment key={label}>
                            {i > 0 ? <span className={cn("h-px rounded-full transition-colors", i === 1 ? "flex-[0.5]" : "flex-[1.5]", i <= activeIdx ? "bg-[#0f3468]" : "bg-[#e2eaf4]")} /> : null}
                            <span className="relative inline-flex shrink-0 items-center gap-1.5">
                              <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold transition-all", state === "current" ? "bg-[#0f3468] text-white ring-4 ring-[#0f3468]/12" : state === "done" ? "bg-[#0f3468] text-white" : "border border-[#d4dbe6] bg-white text-[#b3bdca]")}>
                                {state === "done" ? <Check className="h-3 w-3" /> : i + 1}
                              </span>
                              <span className={cn("text-[10.5px] leading-none transition-colors", state === "current" ? "font-bold text-[#10233f]" : state === "done" ? "font-semibold text-[#0f3468]" : "font-medium text-[#b3bdca]")}>{label}</span>
                              {/* 배정 완료 라벨 시작점(원 20px + 간격 6px = 26px)에 맞춰 하단에 유형·담당 부서 */}
                              {i === 1 && assigned ? (
                                <span className="absolute left-[26px] top-full mt-1.5 flex flex-col gap-0.5 whitespace-nowrap text-left text-[9px] leading-tight text-muted-foreground">
                                  <span>유형 · <span className="font-semibold text-[#10233f]">{typeOf(d)}{minorOf(d) ? ` › ${minorOf(d)}` : ""}</span></span>
                                  <span>담당 · <span className="font-semibold text-[#10233f]">{deptOf(d)}</span></span>
                                </span>
                              ) : null}
                            </span>
                          </Fragment>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* 민원 감지 — 위험·신호·원문·요약 통합 */}
              <section className="rounded-lg border border-[#e2eaf4] bg-white p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-[#0f3468]" />
                  <span className="text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#9aa6b6]">민원 감지</span>
                  <button type="button" onClick={() => setShowRaw((v) => !v)} className="ml-auto flex items-center gap-0.5 rounded-md border border-[#dbe5f1] bg-white px-1.5 py-0.5 text-[9.5px] font-medium text-[#0b4f91] hover:bg-[#f7fafe]"><ClipboardList className="h-2.5 w-2.5" /> {showRaw ? "원문 닫기" : "원문 보기"}</button>
                </div>
                {/* AI 문의 요약 — 헤더 바로 밑 */}
                <div className="mb-2">
                  <div className="mb-1 text-[9px] font-semibold text-[#9aa6b6]">AI 문의 요약</div>
                  <p className="text-[11px] leading-5 text-[#10233f]">{d.summary}</p>
                  {(() => { const kws = d.keywords.filter((k) => k !== d.systemArea && !/심사\s?기준/.test(k)); return kws.length ? <div className="mt-1.5 flex flex-wrap gap-1">{kws.map((k) => <span key={k} className="rounded border border-[#dbe5f1] bg-[#f7fafe] px-1.5 py-0.5 text-[9.5px] text-[#0b4f91]">#{k}</span>)}</div> : null })()}
                  {d.need ? <div className="mt-1.5 text-[10.5px]"><span className="text-muted-foreground">고객 요구사항 · </span><span className="font-medium text-[#10233f]">{d.need}</span></div> : null}
                </div>
                {/* 원문 보기 — 고객·상담사 말풍선 */}
                {showRaw ? (
                  <div className="mb-2 rounded-lg border border-[#e6ebf2] bg-[#f8fafd] px-2.5 py-2">
                    <div className="mb-1.5 text-[9px] font-semibold text-[#9aa6b6]">{d.source === "detect" ? "통화 전문" : `접수 원문 · ${d.channel}`}</div>
                    <div className="max-h-[240px] space-y-1.5 overflow-y-auto">
                      {transcript(d).map((b, i) => (
                        <div key={i} className={cn("flex", b.who === "상담사" ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[82%] rounded-lg px-2 py-1", b.who === "상담사" ? "bg-[#0f3468] text-white" : "bg-white text-[#27456b] ring-1 ring-[#e6ebf2]")}>
                            <div className={cn("mb-0.5 text-[8px] font-semibold", b.who === "상담사" ? "text-white/70" : "text-[#9aa6b6]")}>{b.who}</div>
                            <div className="whitespace-pre-line text-[10px] leading-[1.5]">{b.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {/* 위험 게이지 + 긴급 + SLA */}
                <div className="flex items-center gap-2 border-t border-[#eef2f7] pt-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-[9px] text-[#9aa6b6]"><span>민원 전이 위험</span><span className="font-mono text-[10px] font-bold text-[#10233f]">{d.score}/100 · {d.risk}</span></div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#eef1f6]"><div className="h-full rounded-full" style={{ width: `${d.score}%`, background: "#0f3468" }} /></div>
                  </div>
                  <Chip label={d.urgency} level={urgencyTone(d.urgency)} dot />
                  {(() => { const m = slaOf(d); const t = m >= 60 ? `${Math.floor(m / 60)}시간` : `${m}분`; return <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold tabular-nums", slaImminent(d) ? "bg-[#fbeceb] text-[#b3261e]" : "bg-[#eef2f7] text-[#5b6b80]")}>SLA {t}</span> })()}
                </div>
                {/* 감지 신호 */}
                {(() => { const sigs = detectSignalsAll(d); return sigs.length ? <div className="mt-2 flex flex-wrap items-center gap-1">{sigs.map((s) => <span key={s} className="inline-flex items-center gap-0.5 rounded bg-[#eaeef6] px-1.5 py-0.5 text-[9.5px] font-medium text-[#0f3468]"><Activity className="h-2.5 w-2.5" />{s}</span>)}</div> : null })()}
                {/* 감정·근거 실측값 */}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[9.5px] text-[#9aa6b6]">
                  {riskEvidence(d).map(([k, v]) => <span key={k}>{k} · <span className="font-medium text-[#27456b]">{v}</span></span>)}
                </div>
                {/* AI 감지 발화 · 분석 — 문장 옆에 분석 배치 */}
                <div className="mt-2 rounded-lg border border-[#e6ebf2] bg-[#f8fafd] px-2.5 py-2">
                  <div className="mb-1.5 text-[9px] font-semibold text-[#9aa6b6]">AI 감지 발화 · 분석</div>
                  <ul className="space-y-1.5">
                    {detectedSentences(d).map((s, i) => (
                      <li key={i} className="text-[10.5px] leading-[1.6]">
                        <span className="text-[#27456b]">“{s.quote}”</span> <Sparkles className="inline h-2.5 w-2.5 align-[-1px] text-[#0f3468]" /> <span className="text-[#9aa6b6]">{s.analysis}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* 민원 유형 분류 및 담당 부서 이관 */}
              <section className="rounded-lg border border-[#e2eaf4] bg-white p-2.5">
                {(() => { const locked = !!alertMap[d.key] || statusOf(d) !== "분석 완료"; const selCls = cn("h-8 rounded-md border border-[#dbe5f1] bg-white px-2 text-[11px] text-[#10233f] outline-none focus:border-[#0f3468] disabled:cursor-not-allowed disabled:border-[#e2eaf4] disabled:bg-[#f1f5f9] disabled:text-[#9aa6b6]"); return (<>
                <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><ListChecks className="h-3 w-3" /> 민원 유형 분류 및 담당 부서 이관 <span className="font-normal text-muted-foreground">{locked ? <span className="inline-flex items-center gap-0.5"><Lock className="h-2.5 w-2.5" /> 이관 확정 완료</span> : "· AI 추천 · 수정 가능"}</span></div>
                <div className="mb-1 text-[9.5px] text-muted-foreground">민원 유형 (대 › 소)</div>
                <div className="flex items-center gap-1.5">
                  <select disabled={locked} value={typeOf(d)} onChange={(e) => setMajor(d, e.target.value)} className={cn(selCls, "min-w-0 flex-1")}>
                    {(TYPE_TREE[typeOf(d)] ? Object.keys(TYPE_TREE) : [typeOf(d), ...Object.keys(TYPE_TREE)]).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-muted-foreground">›</span>
                  <select disabled={locked} value={minorOf(d)} onChange={(e) => setMinorMap((p) => ({ ...p, [d.key]: e.target.value }))} className={cn(selCls, "min-w-0 flex-1")}>
                    {(() => { const opts = TYPE_TREE[typeOf(d)] ?? []; const cur = minorOf(d); const list = cur && !opts.includes(cur) ? [cur, ...opts] : opts; return (list.length ? list : ["해당 없음"]).map((mn) => <option key={mn} value={mn}>{mn || "해당 없음"}</option>) })()}
                  </select>
                </div>
                <div className="mb-1 mt-2 text-[9.5px] text-muted-foreground">담당 부서</div>
                <select disabled={locked} value={deptOf(d)} onChange={(e) => setDeptMap((p) => ({ ...p, [d.key]: e.target.value }))} className={cn(selCls, "w-full")}>
                  {DEPTS.map((dep) => <option key={dep} value={dep}>{dep}</option>)}
                </select>
                {!locked ? (
                  <Button onClick={() => assign(d)} className="mt-2 h-8 w-full gap-1.5 bg-[#0f3468] text-[11px] hover:bg-[#0b2547]"><Bell className="h-3.5 w-3.5" /> 이관 확정 · 담당자 알림</Button>
                ) : assignFlash === d.key ? (
                  <div className="mt-2 flex items-center gap-1.5 rounded-md border border-[#b9ece0] bg-[#e9faf4] px-2 py-1.5 text-[10.5px] font-medium text-[#0f766e]"><CheckCircle2 className="h-3.5 w-3.5" /> {deptOf(d)}에 배정되었습니다 · 담당자 알림 발송 완료</div>
                ) : null}
                </>) })()}
              </section>

              {/* 처리 상세 — 처리 완료 건: 담당자 + 처리 결과 코멘트(상담 검수 결과 스타일) */}
              {statusOf(d) === "처리 완료" ? (
                <section className="rounded-lg border border-[#e2eaf4] bg-white p-2.5">
                  <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><ClipboardList className="h-3 w-3" /> 처리 상세<span className="ml-auto inline-flex items-center gap-0.5 rounded-sm bg-[#e9faf4] px-1.5 py-0.5 text-[9px] font-medium text-[#0f766e]"><CheckCircle2 className="h-2.5 w-2.5" /> 처리 완료</span></div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                    <span>담당 · <span className="font-semibold text-[#10233f]">{deptOf(d)} {PROC_HANDLERS[deptOf(d)] ? `${PROC_HANDLERS[deptOf(d)]} 담당자` : "담당자"}</span></span>
                    <span>처리 유형 · <span className="font-medium text-[#27456b]">{typeOf(d)}</span></span>
                  </div>
                  <div className="mt-1.5 rounded-md border border-[#e6ebf2] bg-[#f8fafd] px-2.5 py-2">
                    <div className="mb-1 text-[9px] font-semibold text-[#9aa6b6]">처리 담당자 코멘트</div>
                    <p className="text-[10.5px] leading-[1.6] text-[#27456b]">{PROC_COMMENT[typeOf(d)] ?? "고객 요청사항 확인 후 처리 기준에 따라 안내·회신 완료. 추가 이의 없음."}</p>
                  </div>
                </section>
              ) : null}

              {/* VoC 시스템 등록 */}
              <section className="rounded-lg border border-[#e2eaf4] bg-[#fbfdff] p-2.5">
                {(() => { const assigned = !!alertMap[d.key] || statusOf(d) !== "분석 완료"; const registered = regMap[d.key] === "등록완료" || d.rawDetection?.reg === "등록완료"; return (<>
                <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><ShieldCheck className="h-3 w-3" /> VoC 시스템 등록{registered ? <span className="inline-flex items-center gap-0.5 font-normal text-muted-foreground"><Lock className="h-2.5 w-2.5" /> 등록 완료</span> : !assigned ? <span className="ml-auto rounded-sm bg-[#f1f3f7] px-1.5 py-0.5 text-[9px] font-medium text-[#5b6b80]">이관 확정 후 진행</span> : null}</div>
                {(() => {
                  if (!assigned) return <div className="rounded-md border border-dashed border-[#dbe5f1] bg-[#f7fafe] px-2.5 py-3 text-center text-[10px] text-muted-foreground">부서 이관을 확정하면 VoC 표준 등록이 진행됩니다.</div>
                  if (registered) {
                    const stdRows: [string, string][] = [
                      ["접수번호", inqId(d.id)],
                      ["접수일시", d.datetime],
                      ["접수채널", d.channel],
                      ["고객", `${d.customer}${d.rawDetection?.customerNo ? ` (${d.rawDetection.customerNo})` : ""}`],
                      ["VOC 유형", `${typeOf(d)}${minorOf(d) ? ` › ${minorOf(d)}` : ""}`],
                      ["고객 경험", d.exp],
                      ["위험·긴급", `${d.risk}(${d.score}) · ${d.urgency}`],
                      ["이관 부서", deptOf(d)],
                      ["민원 요지", d.summary],
                    ]
                    return (
                      <div className="space-y-2">
                        {/* 초록 등록 완료 알림 — 방금 등록 버튼을 누른 건에만 1회 노출 */}
                        {regFlash === d.key ? <div className="flex items-center gap-1.5 rounded-md border border-[#b9ece0] bg-[#e9faf4] px-2 py-1.5 text-[10.5px] font-medium text-[#0f766e]"><CheckCircle2 className="h-3.5 w-3.5" /> VOC 등록 완료 · <span className="font-semibold">{d.rawDetection?.vocId ?? inqId(d.id)}</span></div> : null}
                        {/* 표준 등록 형식 — 헤더 없이 등록 내용만 박제 */}
                        <div className="rounded-lg border border-[#e2eaf4] bg-white">
                          <dl className="divide-y divide-[#eef3f9] text-[10.5px]">
                            {stdRows.map(([k, v]) => <div key={k} className="flex gap-2 px-2.5 py-1.5"><dt className="w-[64px] shrink-0 text-muted-foreground">{k}</dt><dd className="flex-1 text-[#10233f]">{v}</dd></div>)}
                          </dl>
                        </div>
                      </div>
                    )
                  }
                  return <Button onClick={() => { setEditReg(false); setRegEdits({}); setRegOpen(true) }} className="h-8 w-full gap-1.5 bg-[#0f3468] text-[11px] hover:bg-[#0b2547]"><ShieldCheck className="h-3.5 w-3.5" /> VoC 시스템 등록</Button>
                })()}
                </>) })()}
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {/* VoC 시스템 등록 — 확정 모달 */}
      {regOpen && d ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6" onClick={() => setRegOpen(false)}>
          <div className="w-[400px] max-w-full overflow-hidden rounded-xl border border-[#e6edf5] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-[#eef2f7] bg-gradient-to-r from-[#e8f1fb] to-white px-3 py-2.5">
              <ShieldCheck className="h-4 w-4 text-[#0f3468]" />
              <span className="text-[12px] font-bold text-[#10233f]">VoC 시스템 등록</span>
              <button type="button" onClick={() => setRegOpen(false)} className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-[#eef2f7] hover:text-[#10233f]"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[80vh] space-y-2 overflow-y-auto p-3">
              {(() => {
                const reg: string = d.rawDetection ? (regMap[d.key] ?? d.rawDetection.reg) : (regMap[d.key] === "등록완료" ? "등록완료" : "대상")
                const stdRows: [string, string][] = [
                  ["접수번호", inqId(d.id)],
                  ["접수일시", d.datetime],
                  ["접수채널", d.channel],
                  ["고객", `${d.customer}${d.rawDetection?.customerNo ? ` (${d.rawDetection.customerNo})` : ""}`],
                  ["VOC 유형", `${typeOf(d)}${minorOf(d) ? ` › ${minorOf(d)}` : ""}`],
                  ["고객 경험", d.exp],
                  ["위험·긴급", `${d.risk}(${d.score}) · ${d.urgency}`],
                  ["이관 부서", deptOf(d)],
                  ["민원 요지", d.summary],
                ]
                const StdForm = (
                  <div className="rounded-lg border border-[#e2eaf4] bg-white">
                    <div className="flex items-center gap-1 border-b border-[#eef3f9] bg-[#f7fafe] px-2.5 py-1.5 text-[10px] font-bold text-[#0b4f91]">VOC 표준 등록 형식<button type="button" onClick={() => setEditReg((v) => !v)} className={cn("ml-auto flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[8.5px] font-medium transition-colors", editReg ? "bg-[#0f3468] text-white" : "bg-[#eef4fb] text-[#0b4f91] hover:bg-[#e3f0fc]")}><Pencil className="h-2.5 w-2.5" /> {editReg ? "완료" : "수정 편집"}</button></div>
                    <dl className="divide-y divide-[#eef3f9] text-[10.5px]">
                      {stdRows.map(([k, v]) => <div key={k} className="flex items-center gap-2 px-2.5 py-1.5"><dt className="w-[64px] shrink-0 text-muted-foreground">{k}</dt><dd className="flex-1 text-[#10233f]">{editReg ? <input value={regEdits[k] ?? v} onChange={(e) => setRegEdits((p) => ({ ...p, [k]: e.target.value }))} className="w-full rounded border border-[#dbe5f1] bg-white px-1.5 py-0.5 text-[10.5px] text-[#10233f] outline-none focus:border-[#0f3468]" /> : (regEdits[k] ?? v)}</dd></div>)}
                    </dl>
                  </div>
                )
                const confirm = () => { registerVoc(d); setRegFlash(d.key); setRegOpen(false) }
                if (reg === "비대상") return <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[10.5px] text-slate-600"><Ban className="h-4 w-4 shrink-0 text-slate-400" /> 위험도가 낮아 VOC 등록 대상이 아닙니다.</div>
                if (reg === "제외") return <div className="space-y-2"><div className="flex items-start gap-2 rounded-lg border border-[#dbe5f1] bg-[#f7fafe] p-2.5 text-[10.5px] text-[#10233f]"><Ban className="mt-0.5 h-4 w-4 shrink-0 text-[#0f3468]" /><div><div className="font-semibold">기존 VOC 접수 고객 — 등록 제외</div>{d.rawDetection?.vocId ? <div className="mt-0.5 text-[10px] text-muted-foreground">{d.rawDetection.vocId} · <span className="font-medium text-[#0b4f91]">{d.rawDetection.vocStatus}</span></div> : null}</div></div>{StdForm}</div>
                if (reg === "등록완료") return <div className="space-y-2"><div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-[10.5px] text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> VOC 등록 완료 · <span className="font-semibold">{d.rawDetection?.vocId ?? inqId(d.id)}</span></div>{StdForm}</div>
                if (reg === "실패") return <div className="space-y-2"><div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/60 p-2.5 text-[10.5px] text-red-700"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" /><div><div className="font-semibold">자동 등록 실패</div>{d.rawDetection?.failReason ? <div className="mt-0.5 text-[10px] text-red-600/90">{d.rawDetection.failReason}</div> : null}</div></div>{StdForm}<Button onClick={confirm} className="mt-1 h-9 w-full gap-1.5 bg-[#0f3468] text-[11.5px] hover:bg-[#0b2547]"><RefreshCw className="h-4 w-4" /> 등록 재수행</Button></div>
                return <div className="space-y-2">{StdForm}<Button onClick={confirm} className="mt-1 h-9 w-full gap-1.5 bg-[#0f3468] text-[11.5px] hover:bg-[#0b2547]"><ShieldCheck className="h-4 w-4" /> VoC 등록 확정</Button></div>
              })()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ----------------------------- 관리자 콘솔 (탭 셸) ----------------------------- */

/* ===================== 통계 대시보드 — recharts 시각화 ===================== */
// 통일 팔레트 — 네이비 · 블루그레이 · 뮤트 블루 · 뮤트 민트/틸 (처리실적·기간추세 블루그레이 톤과 접점)
const VIZ_PAL = ["#13355c", "#2f6aa8", "#5a8fbf", "#89abcf", "#17b39a", "#0c8f78"]
// nivo 차트 — SSR 회피 위해 client-only 동적 로드
const NivoFunnel = dynamic(() => import("./CompareFunnels").then((m) => m.NivoFunnel), { ssr: false, loading: () => <div className="h-[54px]" /> })
const NivoSparkline = dynamic(() => import("./CompareFunnels").then((m) => m.NivoSparkline), { ssr: false, loading: () => <div className="h-[28px]" /> })
const NivoPie = dynamic(() => import("./CompareFunnels").then((m) => m.NivoPie), { ssr: false, loading: () => <div className="h-[64px]" /> })
const EChartSankey = dynamic(() => import("./CompareFunnels").then((m) => m.EChartSankey), { ssr: false, loading: () => <div className="h-[300px]" /> })
const EChartTreemap = dynamic(() => import("./CompareFunnels").then((m) => m.EChartTreemap), { ssr: false, loading: () => <div className="h-[200px]" /> })
const EChartBubble = dynamic(() => import("./CompareFunnels").then((m) => m.EChartBubble), { ssr: false, loading: () => <div className="h-[200px]" /> })
const EChartRadar = dynamic(() => import("./CompareFunnels").then((m) => m.EChartRadar), { ssr: false, loading: () => <div className="h-[200px]" /> })
const EChartCauseBar = dynamic(() => import("./CompareFunnels").then((m) => m.EChartCauseBar), { ssr: false, loading: () => <div className="h-[200px]" /> })

// 공통 커스텀 툴팁
function VizTip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  // 내부용 밴드 계산 키(lo·band)는 툴팁에서 숨김
  const rows = payload.filter((p: any) => p.dataKey !== "lo" && p.dataKey !== "band")
  if (!rows.length) return null
  return (
    <div className="rounded-[4px] border border-[#e2eaf4] bg-white/95 px-2.5 py-1.5 shadow-lg backdrop-blur">
      {label != null ? <div className="mb-0.5 text-[10px] font-bold text-[#10233f]">{label}</div> : null}
      {rows.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5 text-[10px]">
          <span className="h-2 w-2 rounded-sm" style={{ background: p.color || p.fill }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-2 font-bold tabular-nums text-[#10233f]">{typeof p.value === "number" ? p.value.toLocaleString("en-US") : p.value}{unit || ""}</span>
        </div>
      ))}
    </div>
  )
}
function BubbleTip({ active, payload }: any) {
  const d = active && payload?.length ? payload[0]?.payload : null
  if (!d) return null
  return (
    <div className="rounded-[4px] border border-[#e2eaf4] bg-white/95 px-2.5 py-1.5 shadow-lg backdrop-blur">
      <div className="mb-0.5 flex items-center gap-1.5 text-[10.5px] font-bold text-[#10233f]"><span className="h-2 w-2 rounded-sm" style={{ background: d.color }} />{d.label}</div>
      <div className="space-y-0.5 text-[9.5px] text-muted-foreground">
        <div>건수 <b className="text-[#10233f]">{d.x.toLocaleString("en-US")}</b></div>
        <div>위험 비중 <b className="text-[#10233f]">{d.y}%</b></div>
        <div>처리 대기 <b className="text-[#10233f]">{d.z}</b></div>
      </div>
    </div>
  )
}

// 추이 — 평소(기대) 범위 밴드 + 전체 탐지 선 + 위험 선. 밴드 이탈 = 평소 대비 급증/급감
// 운영시간(09~17시 시작, 9개 슬롯) 시간대 가중치 — 오전 완만 상승 → 점심 하락 → 오후 피크
const TREND_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17]
const TREND_HOUR_W = [0.6, 0.9, 1.15, 0.55, 0.85, 1.15, 1.3, 1.05, 0.75]
function AreaTrend({ points }: { points: { x: string; total: number; high: number; lo?: number; hi?: number }[] }) {
  const hasBand = points.some((p) => p.hi != null)
  const data = points.map((p) => {
    const row: Record<string, number | string> = { name: p.x, 전체: p.total, 위험: p.high, lo: p.lo ?? 0, band: p.hi != null && p.lo != null ? p.hi - p.lo : 0 }
    // 요일별 운영시간 9개 시간대 바 (일 총량을 시간대 가중치로 분배)
    const monMorning = p.x === "월" // 월요일 오전(9~11시) 일시 급증
    TREND_HOURS.forEach((h, i) => {
      const w = TREND_HOUR_W[i] * (monMorning && h >= 9 && h <= 11 ? 1.8 : 1)
      row[`h${h}`] = Math.max(1, Math.round(p.total * w))
    })
    return row
  })
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 12, right: 10, bottom: 0, left: -18 }} barGap={0} barCategoryGap="0%">
        <CartesianGrid strokeDasharray="3 4" stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
        {/* 라인 전용 point 스케일 축 — 양끝(첫·마지막 요일)까지 선이 닿도록 */}
        <XAxis xAxisId="pt" dataKey="name" hide scale="point" padding={{ left: 0, right: 0 }} />
        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={36} />
        {/* 바(시간대)는 별도 우측 스케일 — 일별 라인과 독립 */}
        <YAxis yAxisId="hr" hide domain={[0, "dataMax"]} />
        <ReTooltip content={<VizTip unit="건" />} />
        {/* 요일별 운영시간(09~18시) 9개 시간대 바 — 라인 뒤 옅은 블루 */}
        {TREND_HOURS.map((h) => (
          <Bar key={h} yAxisId="hr" dataKey={`h${h}`} name={`${h}시`} fill="#c3d5ea" isAnimationActive={false} legendType="none" />
        ))}
        {/* 평소 범위 밴드 — lo 바닥(투명) 위에 band(회색) 스택 */}
        {hasBand ? <Area xAxisId="pt" type="monotone" dataKey="lo" stackId="band" stroke="none" fill="none" isAnimationActive={false} legendType="none" /> : null}
        {hasBand ? <Area xAxisId="pt" type="monotone" dataKey="band" stackId="band" stroke="none" fill="#e8edf3" fillOpacity={0.6} isAnimationActive={false} legendType="none" /> : null}
        <Line xAxisId="pt" type="monotone" dataKey="전체" stroke="#0f3468" strokeWidth={1.8} dot={{ r: 2, fill: "#fff", stroke: "#0f3468", strokeWidth: 1.4 }} activeDot={{ r: 3.2 }} />
        <Line xAxisId="pt" type="monotone" dataKey="위험" stroke="#e2604f" strokeWidth={1.3} strokeDasharray="4 3" dot={{ r: 1.8, fill: "#e2604f" }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// 게이지 — 동심 RadialBar
// 부서 막대 높이 — 실제 건수 정비례 대신 구간별 매핑(고값 800~900대 차이 부각 · 중값 200~400대 중간 · 미처리 소량도 가시)
// 최고 ~78%로 상단에 증감 라벨 헤드룸 확보
function deptBarH(v: number) {
  if (v >= 600) return 50 + (Math.min(v, 1000) - 600) / 400 * 28 // 600→50%, 1000→78%
  if (v >= 200) return 30 + (v - 200) / 400 * 20                 // 200→30%, 600→50%
  return 10 + (v / 200) * 20                                     // 0→10%, 200→30%
}
const deltaMark = (d: number) => `${d >= 0 ? "▲" : "▼"}${Math.abs(d)}`
// 부서 1칸 = 세로 막대(오늘 + 전일 고스트) · 각 바 위 전일 대비 증감 · SLA·평균처리 보조
function DeptMiniChart({ name, rate, sla, aht, bars }: { name: string; rate: number; sla: number; aht: string; bars: { label: string; value: number; color: string; prev?: number }[] }) {
  return (
    <div className="rounded-[4px] border border-[#eef2f7] p-2">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="min-w-0 truncate text-[9.5px] font-bold text-[#10233f]">{name}</span>
        <span className="ml-auto shrink-0 rounded-full bg-[#f4f6fa] px-1 py-0 text-[7.5px] font-bold tabular-nums text-[#5b6b80]">처리율 {rate}%</span>
      </div>
      {/* 배정·완료·미처리 세로 막대 — 오늘(앞·좌) + 전일 고스트(뒤·우로 살짝 밀림) · 증감은 더 높은 바 위에 */}
      <div className="mt-1 flex gap-2" style={{ height: 52 }}>
        {bars.map((b) => {
          const topH = Math.max(deptBarH(b.value), b.prev != null ? deptBarH(b.prev) : 0)
          const d = b.prev != null ? b.value - b.prev : null
          return (
            <div key={b.label} className="flex flex-1 items-end justify-center">
              <div className="relative h-full" style={{ width: 20 }}>
                {b.prev != null ? (
                  <div className="absolute bottom-0 right-0 w-[13px] bg-[#c0cbdb]" style={{ height: `${deptBarH(b.prev)}%` }} title={`전일 ${fmtN(b.prev)}건`} />
                ) : null}
                <div className="absolute bottom-0 left-0 w-[13px]" style={{ height: `${deptBarH(b.value)}%`, background: b.color }} title={`오늘 ${fmtN(b.value)}건`} />
                {d != null ? (
                  <div className="absolute inset-x-0 text-center text-[7.5px] font-bold leading-none tabular-nums" style={{ bottom: `calc(${topH}% + 3px)`, color: d >= 0 ? "#c2452f" : "#0c8f78" }}>{deltaMark(d)}</div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-0.5 flex gap-2">
        {bars.map((b) => (
          <div key={b.label} className="flex-1 text-center leading-tight">
            <div className="text-[9px] font-bold tabular-nums text-[#10233f]">{fmtN(b.value)}<span className="text-[7px] font-normal text-muted-foreground">건</span></div>
            <div className="text-[7.5px] text-muted-foreground">{b.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-1 space-y-0.5 border-t border-[#eef2f7] pt-1 text-[8px] text-muted-foreground">
        <div className="flex items-center justify-between"><span>SLA 준수</span><b className="tabular-nums text-[#10233f]">{sla}%</b></div>
        <div className="flex items-center justify-between"><span>평균 처리시간</span><b className="tabular-nums text-[#10233f]">{aht}</b></div>
      </div>
    </div>
  )
}
function GaugeRing({ metrics }: { metrics: { label: string; value: number; max: number; unit: string; color: string }[] }) {
  const data = metrics.map((m) => ({ name: m.label, value: Math.round((m.value / m.max) * 100), fill: m.color }))
  return (
    <div className="flex w-full items-center justify-center gap-4">
      <div className="relative h-[116px] w-[116px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="62%" outerRadius="102%" data={data} startAngle={90} endAngle={-270} barSize={12}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background={{ fill: "#f0f3f8" }} dataKey="value" cornerRadius={0} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[19px] font-extrabold leading-none tabular-nums" style={{ color: metrics[0].color }}>{metrics[0].value}<span className="text-[9px] font-bold text-muted-foreground">{metrics[0].unit}</span></span>
          <span className="mt-0.5 text-[8px] font-medium text-muted-foreground">{metrics[0].label}</span>
        </div>
      </div>
      <div className="space-y-1">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: m.color }} />
            <span className="w-[48px] text-[8.5px] text-[#5b6b80]">{m.label}</span>
            <span className="w-8 text-right tabular-nums"><b className="text-[11px] text-[#10233f]">{m.value}</b><span className="text-[7.5px] font-normal text-muted-foreground">{m.unit}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 레이더 — 채널별 위험 프로파일
function RadarChart({ axes, series }: { axes: string[]; series: { name: string; color: string; values: number[] }[] }) {
  const data = axes.map((a, i) => { const row: Record<string, number | string> = { axis: a }; series.forEach((s) => { row[s.name] = s.values[i] }); return row })
  return (
    <ResponsiveContainer width="100%" height={158}>
      <ReRadarChart data={data} outerRadius="66%">
        <PolarGrid stroke="#e6edf5" />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 8.5, fill: "#5b6b80" }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        {series.map((s) => <Radar key={s.name} name={s.name} dataKey={s.name} stroke={s.color} strokeWidth={1.5} fill={s.color} fillOpacity={0.18} isAnimationActive={false} />)}
        <ReTooltip content={<VizTip />} />
      </ReRadarChart>
    </ResponsiveContainer>
  )
}

// 버블 — 유형 포지셔닝(건수 × 위험 비중 × 처리 대기)
function BubbleChart({ items }: { items: { label: string; x: number; y: number; r: number; color: string }[] }) {
  const data = items.map((it) => ({ x: it.x, y: it.y, z: it.r, label: it.label, color: it.color }))
  return (
    <ResponsiveContainer width="100%" height={152}>
      <ScatterChart margin={{ top: 14, right: 14, bottom: 2, left: -10 }}>
        <CartesianGrid strokeDasharray="3 4" stroke="#eef2f7" />
        <XAxis type="number" dataKey="x" name="건수" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis type="number" dataKey="y" name="위험" unit="%" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={34} />
        <ZAxis type="number" dataKey="z" range={[140, 900]} />
        <ReTooltip cursor={{ strokeDasharray: "3 3" }} content={<BubbleTip />} />
        <Scatter data={data} isAnimationActive={false}>
          <LabelList dataKey="label" position="top" offset={6} style={{ fontSize: 8.5, fontWeight: 500, fill: "#334155" }} />
          {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.55} stroke={d.color} strokeWidth={1.2} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}


// 히트맵 — 가로: 요일 / 세로: 시간대. 색은 흰색 위 opacity(회색기) 대신 라이트네이비→딥네이비 톤 램프
const HEAT_CELL = 20
function Heatmap({ days, hours, val, color }: { days: string[]; hours: number[]; val: (d: number, h: number) => number; color: string }) {
  const max = Math.max(...days.flatMap((_, di) => hours.map((h) => val(di, h)))) || 1
  // 3단 램프: 낮음=밝은 하늘 → 중간=선명한 블루 → 높음=딥 네이비(color). 단색 opacity의 안개 느낌 제거
  const lo = [226, 234, 246]   // #e2eaf6 연한 네이비
  const mid = [45, 88, 148]    // #2d5894 중간 네이비 블루
  const hi = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)]
  const lerp = (a: number[], b: number[], t: number) => a.map((x, i) => Math.round(x + (b[i] - x) * t))
  const ramp = (t: number) => { const c = t < 0.5 ? lerp(lo, mid, t / 0.5) : lerp(mid, hi, (t - 0.5) / 0.5); return `rgb(${c[0]},${c[1]},${c[2]})` }
  const cellFor = (v: number) => ramp(Math.pow(v / max, 0.85))
  const colW = `${HEAT_CELL}px`
  return (
    <div className="mx-auto w-fit">
      {/* 헤더 — 요일(가로) */}
      <div className="flex gap-[3px]">
        <div className="shrink-0" style={{ width: 22 }} />
        {days.map((d) => <div key={d} className="text-center text-[8.5px] font-semibold text-[#5b6b80]" style={{ width: colW }}>{d}</div>)}
      </div>
      {/* 행 — 시간대(세로) */}
      {hours.map((h) => (
        <div key={h} className="mt-[3px] flex items-center gap-[3px]">
          <div className="shrink-0 pr-1 text-right text-[8px] text-muted-foreground" style={{ width: 22 }}>{h}</div>
          {days.map((d, di) => { const v = val(di, h); return (
            <div key={d} className="rounded-[3px] transition-transform hover:scale-110" style={{ width: HEAT_CELL, height: HEAT_CELL, background: cellFor(v) }} title={`${d} ${h}시 · ${v}건`} />
          ) })}
        </div>
      ))}
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[8px] text-muted-foreground">낮음<div className="flex gap-[2px]">{[0.12, 0.4, 0.68, 1].map((t) => <span key={t} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: ramp(t) }} />)}</div>높음</div>
    </div>
  )
}

// 트리맵 — squarify 알고리즘
// 트리맵 셀 — 유형 점유율(recharts Treemap content)
function TreemapContent({ x, y, width, height, index, name, value, depth, total }: any) {
  if (depth === 0 || width == null) return null
  const big = width > 48 && height > 30
  const color = VIZ_PAL[index % VIZ_PAL.length]
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={2} fill={color} stroke="#fff" strokeWidth={1.5} />
      {big ? (
        <>
          <text x={x + 8} y={y + 17} fill="#fff" style={{ fontSize: 10, fontWeight: 500 }}>{name}</text>
          <text x={x + 8} y={y + 29} fill="#fff" fillOpacity={0.85} style={{ fontSize: 9, fontWeight: 400 }}>{Math.round((value / total) * 100)}%</text>
        </>
      ) : null}
    </g>
  )
}
function Treemap({ items }: { items: { label: string; value: number }[] }) {
  const total = items.reduce((a, b) => a + b.value, 0) || 1
  const data = items.map((it) => ({ name: it.label, size: it.value }))
  return (
    <ResponsiveContainer width="100%" height={150}>
      <ReTreemap data={data} dataKey="size" stroke="#fff" isAnimationActive={false} content={<TreemapContent total={total} />} />
    </ResponsiveContainer>
  )
}

// 시각화용 데이터 (전사 목업)
const RADAR_AXES = ["보험금", "해지·환급", "전산·인증", "응대·서비스", "수금", "불완전판매"]
// 고객 성별 민원 프로파일 — 유형별 상대 강도(0–100)
const RADAR_GENDER = [
  { name: "남성", color: "#2f6aa8", values: [78, 52, 62, 58, 66, 40] },
  { name: "여성", color: "#17b39a", values: [60, 74, 44, 72, 48, 58] },
]
// 고객 나이대 민원 프로파일 — 3구간 묶음, 유형별 상대 강도(0–100)
const RADAR_AGE = [
  { name: "20~30대", color: "#5a8fbf", values: [40, 50, 78, 60, 36, 64] },
  { name: "40~50대", color: "#2f6aa8", values: [72, 66, 48, 58, 62, 48] },
  { name: "60~70대", color: "#0c8f78", values: [88, 52, 30, 66, 64, 36] },
]
// 상품별 민원 점유율 — 트리맵(생명·건강·저축 등 상품군 세분화)
const PRODUCT_MIX: { label: string; value: number }[] = [
  { label: "종신보험", value: 1180 },
  { label: "실손의료보험", value: 960 },
  { label: "암보험", value: 720 },
  { label: "변액보험", value: 640 },
  { label: "연금보험", value: 520 },
  { label: "저축보험", value: 430 },
  { label: "정기보험", value: 350 },
  { label: "CI보험", value: 300 },
  { label: "어린이보험", value: 240 },
  { label: "치아보험", value: 180 },
  { label: "간병보험", value: 150 },
]
const HEAT_DAYS = ["월", "화", "수", "목", "금", "토", "일"]
const HEAT_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
// 요일별 인입량 가중(월~일) — 금요일 최고, 월요일 높음, 주말 낮음
const HEAT_DAY_W = [0.96, 0.82, 0.76, 0.9, 1.2, 0.44, 0.32]
// 요일별 오후 피크 시간 이동(시) — 후반부로 갈수록 늦은 피크
const HEAT_PM_SHIFT = [-0.8, 0.0, 0.3, 0.7, 1.1, 1.4, 1.6]
const heatVal = (di: number, h: number) => {
  const amC = 11 + di * 0.12 // 오전 피크 소폭 이동
  const pmC = 15.3 + (HEAT_PM_SHIFT[di] ?? 0) // 오후 피크 요일별 이동
  const monAmSurge = di === 0 ? Math.exp(-Math.pow(h - 9.8, 2) / 2.6) * 0.85 : 0 // 월요일 오전 일시 급증
  const peak = Math.exp(-Math.pow(h - amC, 2) / 6.5) + Math.exp(-Math.pow(h - pmC, 2) / 5.5) * 1.05 + monAmSurge
  const lunch = h === 12 || h === 13 ? 0.5 : 1
  // 셀별 결정적 텍스처(요일·시간 해시) — 같은 시간대라도 요일마다 미세 변주
  const seed = Math.sin(di * 12.9898 + h * 78.233) * 43758.5453
  const jitter = 0.82 + (seed - Math.floor(seed)) * 0.36 // 0.82~1.18
  const base = 100 * (HEAT_DAY_W[di] ?? 0.5)
  return Math.max(0, Math.round(base * peak * lunch * jitter))
}

// 통계 대시보드 섹션 헤더 — 아이콘 칩 + 제목 + 부제 + 헤어라인(일관된 위계)
function StatSection({ icon: Icon, title, sub }: { icon: typeof BarChart3; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-[#e2edfb] text-[#1b5fb0]"><Icon className="h-3.5 w-3.5" /></span>
      <span className="text-[11.5px] font-bold tracking-tight text-[#10233f]">{title}</span>
      <span className="text-[9px] text-muted-foreground">{sub}</span>
      <span className="ml-1 h-px flex-1 bg-[#cdd9e8]" />
    </div>
  )
}
// 섹션별 AI 종합 분석 카드 — 섹션 오른쪽, 포스트잇처럼 컴팩트(하늘색 톤). 맨 위 결론 한 줄 + 근거 불릿
function InsightCard({ title, summary, items }: { title: string; summary: string; items: string[] }) {
  return (
    <aside className="flex min-h-[230px] w-[230px] shrink-0 self-start flex-col rounded-[4px] border border-[#cfe0f4] bg-[#eef5fd] p-3 shadow-[0_1px_3px_rgba(16,35,68,0.05)]">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-[#dbeafe] text-[#1b5fb0]"><Sparkles className="h-2.5 w-2.5" /></span>
        <span className="text-[9.5px] font-bold text-[#1b5fb0]">{title} · AI 종합 분석</span>
      </div>
      <div className="mb-2 rounded-[3px] bg-white/70 px-2 py-1.5 text-[11px] font-bold leading-snug text-[#0f3468]">{summary}</div>
      <ul className="space-y-1.5 text-[9.5px] leading-relaxed text-[#4a5568]">
        {items.map((t, i) => <li key={i} className="flex gap-1.5"><span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[#8aa6c6]" /><span>{t}</span></li>)}
      </ul>
    </aside>
  )
}
// 접이식 섹션 헤더(<summary>용) — ④⑤ 탐색용 섹션에서 사용
function CollapsibleSectionHeader({ icon: Icon, title, sub }: { icon: typeof BarChart3; title: string; sub: string }) {
  return (
    <summary className="flex cursor-pointer list-none items-center gap-2 pt-1 [&::-webkit-details-marker]:hidden">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-[#e2edfb] text-[#1b5fb0]"><Icon className="h-3.5 w-3.5" /></span>
      <span className="text-[11.5px] font-bold tracking-tight text-[#10233f]">{title}</span>
      <span className="text-[9px] text-muted-foreground">{sub}</span>
      <span className="ml-1 h-px flex-1 bg-[#cdd9e8]" />
      <ChevronDown className="chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform" />
    </summary>
  )
}
// 도넛 + 우측 범례 한 세트 — VoC 구성(유형별 · 위험도별)
function DonutWithLegend({ caption, segments, centerSub }: { caption: string; segments: { label: string; value: number; color: string }[]; centerSub: string }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  return (
    <div className="flex items-center gap-2.5">
      <NivoPie segments={segments} centerTop={`${fmtN(total)}건`} centerSub={centerSub} size={104} />
      <div className="min-w-0">
        <div className="mb-1 text-[9px] font-semibold text-[#5b6b80]">{caption}</div>
        <div className="space-y-1">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-[9.5px] leading-none">
              <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: s.color }} />
              <span className="w-[52px] shrink-0 text-[#5b6b80]">{s.label}</span>
              <b className="tabular-nums text-[#10233f]">{fmtN(s.value)}건</b>
              <span className="tabular-nums text-muted-foreground">{Math.round((s.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
// 통계 대시보드 — 전사 VoC 통계/시각화 모음. 각 카드 → VoC 리포트 / 관리자 메인에 추가 가능
function StatsDashboard() {
  const [statPeriod, setStatPeriod] = useState<"today" | "week" | "month" | "custom">("today")
  const [statFrom, setStatFrom] = useState("2026-06-01")
  const [statTo, setStatTo] = useState("2026-06-17")
  const [pinReport, setPinReport] = useState<Record<string, boolean>>({})
  const [pinMain, setPinMain] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)
  const pin = (kind: "report" | "main", id: string, label: string) => {
    const set = kind === "report" ? setPinReport : setPinMain
    const cur = kind === "report" ? pinReport : pinMain
    const on = !cur[id]
    set((p) => ({ ...p, [id]: on }))
    setToast(on ? `‘${label}’ 카드를 ${kind === "report" ? "VoC 리포트" : "관리자 메인"}에 추가했습니다` : `${kind === "report" ? "VoC 리포트" : "관리자 메인"}에서 제외했습니다`)
    window.setTimeout(() => setToast(null), 2200)
  }
  // 카드 헤더 우측 액션 — [리포트에 추가] / [메인에 추가]
  const acts = (id: string, label: string) => {
    const r = pinReport[id], m = pinMain[id]
    return (
      <div className="flex items-center gap-0.5">
        <button type="button" title="VoC 리포트에 추가" onClick={() => pin("report", id, label)}
          className={cn("inline-flex items-center gap-0.5 rounded-[3px] border px-1 py-[1px] text-[8px] font-semibold transition-colors",
            r ? "border-[#bcd3ef] bg-[#eef4fb] text-[#0f3468]" : "border-[#e2eaf4] bg-white text-[#5b6b80] hover:border-[#bcd3ef] hover:text-[#0f3468]")}>
          {r ? <CheckCircle2 className="h-2.5 w-2.5" /> : <FileText className="h-2.5 w-2.5" />}{r ? "리포트 추가됨" : "리포트"}
        </button>
        <button type="button" title="관리자 메인에 추가" onClick={() => pin("main", id, label)}
          className={cn("inline-flex items-center gap-0.5 rounded-[3px] border px-1 py-[1px] text-[8px] font-semibold transition-colors",
            m ? "border-[#9fe0d3] bg-[#e8faf5] text-[#0c8f78]" : "border-[#e2eaf4] bg-white text-[#5b6b80] hover:border-[#9fe0d3] hover:text-[#0c8f78]")}>
          {m ? <CheckCircle2 className="h-2.5 w-2.5" /> : <LayoutDashboard className="h-2.5 w-2.5" />}{m ? "메인 추가됨" : "메인"}
        </button>
      </div>
    )
  }
  // KPI 밴드 — 전사 실시간 집계
  const sum = (f: (s: typeof CH_STATS[string]) => number) => Object.values(CH_STATS).reduce((a, s) => a + f(s), 0)
  const totalAll = sum((s) => s.total), compAll = sum((s) => s.complaint), potAll = sum((s) => s.potential), highAll = sum((s) => s.high)
  const midAll = sum((s) => s.mid), lowAll = sum((s) => s.low)
  const backlog = DEPT_PROC.reduce((a, r) => a + (r.inflow - r.done), 0)
  const extAgency = CH_STATS["대외기관 민원"]?.total ?? 0
  const vocAll = compAll + potAll + extAgency // 전체 VoC = 불만VoC + 잠재VoC + 대외민원
  const overallRate = Math.round((DEPT_PROC.reduce((a, r) => a + r.done, 0) / DEPT_PROC.reduce((a, r) => a + r.inflow, 0)) * 100)
  // KPI 퍼널 — 전체 문의 → 전체 VoC → 불만/잠재/대외 → 위험 높음. 증감 기준 = 전일 동시간 대비
  // spark: 금일 시간대 추이 / sparkBase: 저번달 동일 시간대 평균(회색 배경, 차이 비교용)
  const KPIS: { label: string; value: number; unit: string; delta: number; accent: string; spark: number[]; sparkBase: number[]; icon: typeof BarChart3 }[] = [
    { label: "전체 문의", value: totalAll, unit: "건", delta: 5, accent: "#0f3468", icon: Inbox, spark: [58, 118, 74, 130, 120, 96, 60], sparkBase: [40, 82, 52, 91, 84, 67, 42] }, // 오전·오후 쌍봉
    { label: "전체 VoC (불만+잠재+대외)", value: vocAll, unit: "건", delta: 6, accent: "#1a4f8f", icon: MessageSquare, spark: [20, 30, 28, 40, 55, 50, 34], sparkBase: [14, 21, 20, 28, 38, 35, 24] }, // 오후 집중
    { label: "불만VoC", value: compAll, unit: "건", delta: 4, accent: "#2f6aa8", icon: ShieldAlert, spark: [10, 28, 19, 16, 14, 12, 9], sparkBase: [7, 20, 13, 11, 10, 8, 6] }, // 오전 급증
    { label: "잠재VoC", value: potAll, unit: "건", delta: 9, accent: "#5a8fbf", icon: FileWarning, spark: [11, 15, 19, 23, 27, 29, 27], sparkBase: [8, 10, 13, 16, 19, 20, 19] }, // 완만 상승
    { label: "대외민원", value: extAgency, unit: "건", delta: 3, accent: "#0c8f78", icon: Landmark, spark: [2, 2, 3, 9, 4, 3, 2], sparkBase: [1, 1, 2, 6, 3, 2, 1] }, // 단발 스파이크
    { label: "위험 높음", value: highAll, unit: "건", delta: 12, accent: "#1e477e", icon: Flame, spark: [4, 7, 8, 10, 13, 17, 16], sparkBase: [3, 5, 6, 7, 9, 12, 11] }, // 마감 직전 상승
  ]
  // 핵심 운영 게이지
  const GAUGE = [
    { label: "처리율", value: overallRate, max: 100, unit: "%", color: "#0f3468" },
    { label: "평균 위험도", value: 54, max: 100, unit: "점", color: "#2f8bff" },
    { label: "SLA 준수", value: 88, max: 100, unit: "%", color: "#15c2a2" },
  ]
  // 전일 처리 실적 집계 (부서 데이터 기반, 처리량 가중 평균)
  const dAssigned = DEPT_PROC.reduce((a, r) => a + r.inflow, 0)
  const dDone = DEPT_PROC.reduce((a, r) => a + r.done, 0)
  const dRate = Math.round((dDone / dAssigned) * 100)
  const dBacklog = dAssigned - dDone
  const dBacklogDelta = DEPT_PROC.reduce((a, r) => a + (DEPT_DAILY[r.dept]?.dBacklog ?? 0), 0)
  const dSla = Math.round(DEPT_PROC.reduce((a, r) => a + (DEPT_DAILY[r.dept]?.sla ?? 0) * r.done, 0) / dDone)
  const dAht = (DEPT_PROC.reduce((a, r) => a + parseFloat(DEPT_DAILY[r.dept]?.aht ?? "0") * r.done, 0) / dDone).toFixed(1)
  const dQuality = Math.round(100 - DEPT_PROC.reduce((a, r) => a + (DEPT_DAILY[r.dept]?.reCx ?? 0) * r.done, 0) / dDone)
  // 과녁(링) 게이지 — 전부 '높을수록 좋은 %' 달성률 지표
  const DAILY_GAUGE = [
    { label: "처리율", value: dRate, max: 100, unit: "%", color: "#13355c" },
    { label: "SLA 준수", value: dSla, max: 100, unit: "%", color: "#4a6f9e" },
    { label: "처리 품질", value: dQuality, max: 100, unit: "%", color: "#8aa6c6" },
  ]
  const dReComplaint = Math.round(DEPT_PROC.reduce((a, r) => a + ((DEPT_DAILY[r.dept]?.reCx ?? 0) / 100) * r.done, 0))
  const dSlaViol = Math.round(DEPT_PROC.reduce((a, r) => a + ((100 - (DEPT_DAILY[r.dept]?.sla ?? 0)) / 100) * r.done, 0))
  // 링 게이지 하단 보조 — 하루(전일) 절대 실적. 적체 증감은 전전일 대비
  const DAILY_ABS: { label: string; value: string; unit: string; delta?: number }[] = [
    { label: "배정", value: fmtN(dAssigned), unit: "건" },
    { label: "처리 완료", value: fmtN(dDone), unit: "건" },
    { label: "적체", value: fmtN(dBacklog), unit: "건", delta: dBacklogDelta },
    { label: "평균 처리", value: dAht, unit: "h" },
    { label: "재접수", value: fmtN(dReComplaint), unit: "건" },
    { label: "SLA 위반", value: fmtN(dSlaViol), unit: "건" },
  ]
  // 인입 → 처리 퍼널 (전체 문의 ⊃ VoC ⊃ 위험 높음 ⊃ 처리 대기) — 색은 깔때기 연속 그라데이션 위치에 맞춰 샘플링
  // 각 단계는 앞 단계의 부분집합 — 마지막은 '위험 높음 중 아직 미처리(적체)' 건만
  const highBacklog = Math.round(highAll * 0.39)
  const FUNNEL_RAW: { k: string; v: number; c: string }[] = [
    { k: "전체 문의", v: totalAll, c: "#13355c" },
    { k: "전체 VoC", v: vocAll, c: "#2f6aa8" },
    { k: "고위험건", v: highAll, c: "#4a89b8" },
    { k: "고위험건 적체", v: highBacklog, c: "#17b39a" },
  ]
  const FUNNEL = FUNNEL_RAW.map((s) => ({ name: `${s.k} · ${Math.round((s.v / FUNNEL_RAW[0].v) * 100)}%`, value: s.v, fill: s.c }))
  // 유형 포지셔닝 버블 — 건수 × 위험 비중 × 처리 대기
  const BUBBLES = TOP_TYPES.map((t, i) => ({ label: t.type, x: t.n, y: Math.round((t.high / t.n) * 100), r: t.pending, color: VIZ_PAL[i % VIZ_PAL.length] }))
  // 트리맵/도넛 데이터 — 상품 유형 / 부서
  // 인입 플로우 생키 데이터 — 채널 → 유형 → 부서(가중 분배, 다대다)
  const sankeyData = (() => {
    const mixOf = (t: string) => TYPE_DEPT_MIX[t] ?? [[DEPT_BY_TYPE[t] ?? "고객만족부", 1]]
    const depts = Array.from(new Set(FLOW_TYPES.flatMap((t) => mixOf(t).map(([d]) => d))))
    const nodes = [
      // 채널(좌) 딥네이비 → 유형(중) → 부서(우) 라이트로, 톤온톤 통일
      ...FLOW_CHANNELS.map((c, i) => ({ id: c.k, nodeColor: ["#12385f", "#2c5486", "#4a6f9e", "#6d8cb0"][i] ?? "#4a6f9e" })),
      ...FLOW_TYPES.map((t) => ({ id: t, nodeColor: "#8aa6c6" })),
      ...depts.map((d) => ({ id: d, nodeColor: "#b3c6dd" })),
    ]
    const links: { source: string; target: string; value: number }[] = []
    const typeIn: Record<string, number> = {}
    FLOW_CHANNELS.forEach((c) => FLOW_TYPES.forEach((t, j) => {
      const v = Math.round(c.n * FLOW_W[c.k][j])
      if (v >= 3) { links.push({ source: c.k, target: t, value: v }); typeIn[t] = (typeIn[t] ?? 0) + v }
    }))
    FLOW_TYPES.forEach((t) => {
      const total = typeIn[t] ?? 0
      if (total <= 0) return
      mixOf(t).forEach(([d, w]) => { const v = Math.round(total * w); if (v >= 2) links.push({ source: t, target: d, value: v }) })
    })
    return { nodes, links }
  })()
  // 섹션별 AI 종합 분석 — 우측 날개창에 모아서 표시
  const bsvc = DEPT_PROC.find((r) => r.dept === "보상서비스부")
  const INSIGHTS: { title: string; summary: string; items: string[] }[] = [
    { title: "① 일일 현황", summary: "위험 민원 급증 — 익일 모니터링 강화", items: [
      `전체 문의 ${fmtN(totalAll)}건 중 VoC ${fmtN(vocAll)}건(${Math.round((vocAll / totalAll) * 100)}%)으로 전환, 전전일 대비 +6% — 잠재VoC가 +9%로 상승세.`,
      `위험 높음 ${fmtN(highAll)}건(+12%)이 최대 증가폭이며 마감 직전(16~18시)에 집중 — 익일 해당 시간대 모니터링 강화 권고.`,
      `대외기관 민원은 소량이나 고위험 비중이 높아 금감원 이첩 건 우선 대응.`,
    ] },
    { title: "② 처리 실적", summary: "보상서비스부 병목 — 인력 재배치 우선", items: [
      `전일 처리율 ${dRate}%·SLA ${dSla}%로 양호하나, 보상서비스부가 SLA ${DEPT_DAILY["보상서비스부"]?.sla ?? 0}%·평균 ${DEPT_DAILY["보상서비스부"]?.aht ?? "-"}로 병목.`,
      `미처리(이월)는 보상서비스부가 최다(${fmtN((bsvc?.inflow ?? 0) - (bsvc?.done ?? 0))}건) — 인력 재배치·우선 처리 권고.`,
      `수금·디지털서비스부는 처리율 95%+·SLA 97%+로 안정적 운영.`,
    ] },
    { title: "③ 기간 추세", summary: "금요일·월요일 오전 피크 — 인력 선제 배치", items: [
      `주간 인입은 금요일 최고·오후 15~16시 피크 — 해당 요일·시간대 상담 인력 보강.`,
      `월요일 오전(09~11시) 일시 급증 — 주말 누적 문의 유입, 개장 직후 처리 여력 확보 필요.`,
      `최근 7일 위험 탐지가 목~금 평소 범위를 상회 — 주말 전 리스크 관리 강화.`,
    ] },
    { title: "④ 유형 분석", summary: "종신보험·고령층 보험금 민원 집중", items: [
      `종신·실손·암보험이 민원 상위 — 종신보험 집중도가 높아 약관·안내 개선 우선.`,
      `60~70대는 보험금, 20~30대는 전산·인증 이슈 중심 — 연령대별 응대 채널 최적화.`,
      `여성은 해지·환급/응대, 남성은 보험금/수금 민원이 상대적으로 높음 — 서비스 품질 개선 영역 우세.`,
    ] },
    { title: "⑤ 인입 플로우", summary: "콜센터·고위험 유형이 보상서비스부로 집중", items: [
      `콜센터 인입이 전 채널 중 최다 — 보험금·해지 유형으로 주로 유입.`,
      `보험금 부지급·보장 분쟁이 보상서비스부로 집중 이관 — 병목 심화 원인.`,
      `전산·인증 유형은 디지털서비스부로 분산되어 비교적 원활히 처리.`,
    ] },
  ]
  return (
    <div className="h-full overflow-y-auto bg-[#f5f7fa] px-[4%] py-2.5">
      {/* details[open] 시 chevron 회전 */}
      <style>{`details[open] > summary .chevron { transform: rotate(180deg); }`}</style>
      <div className="space-y-2">
        {/* 헤더 */}
        <div className="flex items-center gap-2 pb-0.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-[#0f3468] shadow-sm"><BarChart3 className="h-3.5 w-3.5 text-white" /></span>
          <span className="text-[13.5px] font-bold tracking-tight text-[#10233f]">VoC 통계 대시보드</span>
          <span className="text-[10px] text-muted-foreground">전사 · 매일 전일 데이터 집계 · 위젯별 리포트·메인 추가</span>
          {/* 기간 필터 — 실시간 이슈 모니터링과 동일 디자인 재사용 */}
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {([["today", "전일"], ["week", "이번주"], ["month", "이번달"], ["custom", "기간 설정"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setStatPeriod(k)} className={cn("rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors", statPeriod === k ? "text-[#0f3468]" : "text-[#9aa7b8] hover:text-[#33445c]")}>{l}</button>
            ))}
            <span className="flex items-center gap-1 rounded-md border border-[#dbe5f1] bg-white px-2 py-1">
              <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
              <input type="date" value={statFrom} onChange={(e) => setStatFrom(e.target.value)} disabled={statPeriod !== "custom"} className="bg-transparent text-[10.5px] text-[#10233f] outline-none disabled:text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">~</span>
              <input type="date" value={statTo} onChange={(e) => setStatTo(e.target.value)} disabled={statPeriod !== "custom"} className="bg-transparent text-[10.5px] text-[#10233f] outline-none disabled:text-muted-foreground" />
            </span>
          </div>
        </div>

        {/* ───────────────────────── ① 금일 현황 ───────────────────────── */}
        <StatSection icon={Activity} title="일일 현황" sub="전일 기준 집계 · 증감 전전일 대비" />
        <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-2">
        {/* KPI 6종 — "위험 높음"만 빨강 강조 */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {KPIS.map((m) => {
            const isDanger = m.label === "위험 높음"
            return (
              <div key={m.label} className="group overflow-hidden rounded-[6px] border border-[#e8ecf2] bg-white p-2 shadow-[0_1px_3px_rgba(16,35,68,0.05)] transition-shadow hover:shadow-[0_5px_16px_rgba(16,35,68,0.10)]">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px]"
                    style={isDanger ? { background: "#fdecec", color: "#b3261e" } : { background: `${m.accent}14`, color: m.accent }}>
                    <m.icon className="h-2.5 w-2.5" />
                  </span>
                  <div className={cn("min-w-0 flex-1 truncate text-[9px] leading-tight", isDanger ? "font-semibold text-[#b3261e]" : "text-muted-foreground")}>{m.label}</div>
                  <span className={cn("inline-flex shrink-0 items-center text-[8.5px] font-semibold", m.delta >= 0 ? "text-[#b3261e]" : "text-[#0c8f78]")}>
                    {m.delta >= 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}{Math.abs(m.delta)}%
                  </span>
                </div>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className={cn("text-[15px] font-bold leading-none tabular-nums", isDanger ? "text-[#b3261e]" : "text-[#10233f]")}>{fmtN(m.value)}</span>
                  <span className="text-[8.5px] text-muted-foreground">{m.unit}</span>
                </div>
                <div className="mt-0.5"><NivoSparkline data={m.spark} baseline={m.sparkBase} color={isDanger ? "#e2604f" : m.accent} /></div>
              </div>
            )
          })}
        </div>
        {/* VoC 구성(도넛 2종) + 인입 → 처리 퍼널 */}
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-[60fr_40fr]">
          <section className="flex flex-col rounded-[4px] border border-[#e8ecf2] bg-white p-2.5 shadow-[0_1px_3px_rgba(16,35,68,0.05)] transition-shadow hover:shadow-[0_5px_16px_rgba(16,35,68,0.08)]">
            <div className="mb-1 flex items-center gap-1.5"><span title="유형별 · 위험도별" className="cursor-help text-[11px] font-bold text-[#10233f]">VoC 구성</span><span className="ml-auto">{acts("stat-voc", "VoC 구성")}</span></div>
            <div className="flex flex-1 flex-wrap items-center justify-around gap-x-4 gap-y-2">
              <DonutWithLegend caption="유형별" centerSub="VoC" segments={[{ label: "불만VoC", value: compAll, color: "#2f6aa8" }, { label: "잠재VoC", value: potAll, color: "#5a8fbf" }, { label: "대외민원", value: extAgency, color: "#17b39a" }]} />
              <DonutWithLegend caption="위험도별" centerSub="VoC" segments={[{ label: "고위험", value: highAll, color: "#d1493b" }, { label: "중위험", value: midAll, color: "#e6a83e" }, { label: "저위험", value: lowAll, color: "#5b93b5" }]} />
            </div>
          </section>
          <section className="flex flex-col rounded-[4px] border border-[#e8ecf2] bg-white p-2.5 shadow-[0_1px_3px_rgba(16,35,68,0.05)] transition-shadow hover:shadow-[0_5px_16px_rgba(16,35,68,0.08)]">
            <div className="mb-1 flex items-center gap-1.5"><span title="전체 문의 → VoC → 고위험건 → 고위험건 적체(각 단계는 앞 단계의 부분집합)" className="cursor-help text-[11px] font-bold text-[#10233f]">민원 리스크 단계 퍼널</span><span className="ml-auto">{acts("stat-funnel", "민원 리스크 단계 퍼널")}</span></div>
            <div className="flex flex-1 items-center"><div className="w-full"><NivoFunnel data={FUNNEL_RAW} /></div></div>
            {/* 단계 범례 — 색·단계명·건수 */}
            <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
              {FUNNEL_RAW.map((s) => (
                <span key={s.k} className="inline-flex items-center gap-1 text-[8.5px] text-[#5b6b80]">
                  <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: s.c }} />
                  <span className="truncate">{s.k}</span>
                  <b className="ml-auto tabular-nums text-[#10233f]">{fmtN(s.v)}</b>
                </span>
              ))}
            </div>
          </section>
        </div>
        </div>
        <InsightCard title={INSIGHTS[0].title} summary={INSIGHTS[0].summary} items={INSIGHTS[0].items} />
        </div>

        {/* ───────────────────────── ② 처리 실적 ───────────────────────── */}
        <StatSection icon={ListChecks} title="처리 실적" sub="전일 기준 · 부서별 처리량·적체·SLA·리드타임" />
        <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-[3fr_7fr]">
          {/* 핵심 지표 (전일) — 달성률 과녁 게이지 + 절대 실적 */}
          <section className="flex flex-col rounded-[4px] border border-[#e8ecf2] bg-white p-2.5 shadow-[0_1px_3px_rgba(16,35,68,0.05)] transition-shadow hover:shadow-[0_5px_16px_rgba(16,35,68,0.08)]">
            <div className="mb-1 flex items-center gap-1.5"><span title="처리율 · SLA · 처리 품질" className="cursor-help text-[11px] font-bold text-[#10233f]">핵심 지표</span><span className="ml-auto">{acts("stat-daily-kpi", "전일 핵심 지표")}</span></div>
            <div className="flex flex-1 flex-col justify-between gap-2 py-1">
              <div className="flex flex-1 items-center"><GaugeRing metrics={DAILY_GAUGE} /></div>
              <div className="grid grid-cols-3 gap-x-3 gap-y-2 border-t border-[#eef2f7] pt-2">
                {DAILY_ABS.map((k) => (
                  <div key={k.label} className="text-center leading-tight">
                    <div className="text-[8px] text-muted-foreground">{k.label}</div>
                    <div className="flex items-baseline justify-center gap-0.5"><span className="text-[12px] font-bold tabular-nums text-[#10233f]">{k.value}</span><span className="text-[7.5px] text-muted-foreground">{k.unit}</span></div>
                    {k.delta !== undefined ? <div className={cn("text-[8px] font-semibold tabular-nums", k.delta > 0 ? "text-[#b3261e]" : "text-[#0c8f78]")}>{k.delta > 0 ? "▲" : "▼"}{Math.abs(k.delta)}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 부서별 처리 현황 (전일) */}
          <section className="rounded-[4px] border border-[#e8ecf2] bg-white p-2.5 shadow-[0_1px_3px_rgba(16,35,68,0.05)] transition-shadow hover:shadow-[0_5px_16px_rgba(16,35,68,0.08)]">
            <div className="mb-1 flex items-center gap-1.5">
              <span title="배정 · 완료 · 미처리(이월)" className="cursor-help text-[11px] font-bold text-[#10233f]">부서별 처리 현황</span>
              <span className="ml-auto flex items-center gap-2 text-[8px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2 rounded-[1px] bg-[#5b6b80]" />오늘</span>
                <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2 rounded-[1px] border border-[#93a3ba] bg-[#c0cbdb]" />전일</span>
                {acts("stat-dept", "부서별 처리 현황")}
              </span>
            </div>
            {(() => {
              const ordered = [...DEPT_PROC].sort((a, b) => (a.inflow - a.done) - (b.inflow - b.done)).reverse() // 미처리(이월) 많은 순
              return (
                <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
                  {ordered.map((r) => { const d = DEPT_DAILY[r.dept]; const pv = DEPT_PREV[r.dept]; return (
                    <DeptMiniChart key={r.dept} name={r.dept} rate={procRate(r)} sla={d?.sla ?? 0} aht={d?.aht ?? "-"} bars={[
                      { label: "배정", value: r.inflow, color: "#8aa6c6", prev: pv?.inflow },
                      { label: "완료", value: r.done, color: "#13355c", prev: pv?.done },
                      { label: "미처리", value: r.inflow - r.done, color: "#b3261e", prev: pv ? pv.inflow - pv.done : undefined },
                    ]} />
                  ) })}
                </div>
              )
            })()}
          </section>
        </div>
        </div>
        <InsightCard title={INSIGHTS[1].title} summary={INSIGHTS[1].summary} items={INSIGHTS[1].items} />
        </div>

        {/* ───────────────────────── ③ 기간 추세 ───────────────────────── */}
        <StatSection icon={TrendingUp} title="기간 추세" sub="주 단위 · 추세 · 시점 패턴" />
        <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-[7fr_3fr]">
          {/* 추이 — 일별 최근 7일 */}
          <section className="flex flex-col rounded-[4px] border border-[#e8ecf2] bg-white p-2.5 shadow-[0_1px_3px_rgba(16,35,68,0.05)] transition-shadow hover:shadow-[0_5px_16px_rgba(16,35,68,0.08)]">
            <div className="mb-1 flex items-center gap-1.5">
              <span title="일별 · 최근 7일 · 운영시간대(09–18시)" className="cursor-help text-[11px] font-bold text-[#10233f]">민원 탐지 추이</span>
              <span className="ml-auto">{acts("stat-trend", "민원 탐지 추이")}</span>
            </div>
            <div className="min-h-[48px] flex-1"><AreaTrend points={DAILY_TREND} /></div>
            <div className="mt-1 flex items-center gap-2 text-[8.5px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm bg-[#0f3468]" /> 전체 탐지</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm bg-[#e2604f]" /> 위험 높음</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2 rounded-sm bg-[#c3d5ea]" /> 시간대별</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-[#e8edf3]" /> 평소 범위</span>
            </div>
          </section>
          {/* 민원 인입 강도 */}
          <section className="flex flex-col rounded-[4px] border border-[#e8ecf2] bg-white p-2.5 shadow-[0_1px_3px_rgba(16,35,68,0.05)] transition-shadow hover:shadow-[0_5px_16px_rgba(16,35,68,0.08)]">
            <div className="mb-1 flex items-center gap-1.5"><span title="요일 × 시간대 · 30일 평균" className="cursor-help text-[11px] font-bold text-[#10233f]">민원 인입 강도</span><span className="ml-auto">{acts("stat-heat", "민원 인입 강도")}</span></div>
            <div className="flex flex-1 items-center"><Heatmap days={HEAT_DAYS} hours={HEAT_HOURS} val={heatVal} color="#102f5e" /></div>
          </section>
        </div>
        </div>
        <InsightCard title={INSIGHTS[2].title} summary={INSIGHTS[2].summary} items={INSIGHTS[2].items} />
        </div>

        {/* ───────────────────────── ④ 유형 분석 (항상 열림) ───────────────────────── */}
        <StatSection icon={BarChart3} title="유형 분석" sub="고객 프로파일 · 포지셔닝 · 상품 점유 · 원인" />
        <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {/* 고객 유형별 민원 프로파일 — 성별·나이대 레이더 2종(한 카드) */}
          <section className="flex flex-col rounded-[4px] border border-[#e8ecf2] bg-white p-2.5 shadow-[0_1px_3px_rgba(16,35,68,0.05)] transition-shadow hover:shadow-[0_5px_16px_rgba(16,35,68,0.08)]">
            <div className="mb-1 flex items-center gap-1.5"><span title="성별 · 나이대" className="cursor-help text-[11px] font-bold text-[#10233f]">고객 유형별 민원 프로파일</span><span className="ml-auto">{acts("stat-radar", "고객 유형별 민원 프로파일")}</span></div>
            <div className="grid grid-cols-2 gap-1">
              <div>
                <div className="mb-0.5 pl-1 text-left text-[9px] font-semibold text-[#5b6b80]">성별</div>
                <EChartRadar axes={RADAR_AXES} series={RADAR_GENDER} height={200} />
              </div>
              <div>
                <div className="mb-0.5 pl-1 text-left text-[9px] font-semibold text-[#5b6b80]">나이대</div>
                <EChartRadar axes={RADAR_AXES} series={RADAR_AGE} height={200} />
              </div>
            </div>
          </section>

          {/* 유형 포지셔닝 (버블) */}
          <section className="flex flex-col rounded-[4px] border border-[#e8ecf2] bg-white p-2.5 shadow-[0_1px_3px_rgba(16,35,68,0.05)] transition-shadow hover:shadow-[0_5px_16px_rgba(16,35,68,0.08)]">
            <div className="mb-1 flex items-center gap-1.5"><span title="건수 × 위험% × 대기(원 크기)" className="cursor-help text-[11px] font-bold text-[#10233f]">유형 포지셔닝</span><span className="ml-auto">{acts("stat-bubble", "유형 포지셔닝")}</span></div>
            <EChartBubble items={BUBBLES} />
          </section>

          {/* 상품별 민원 점유율 (트리맵) */}
          <section className="flex flex-col rounded-[4px] border border-[#e8ecf2] bg-white p-2.5 shadow-[0_1px_3px_rgba(16,35,68,0.05)] transition-shadow hover:shadow-[0_5px_16px_rgba(16,35,68,0.08)]">
            <div className="mb-1 flex items-center gap-1.5"><span title="상품군별 민원 건수" className="cursor-help text-[11px] font-bold text-[#10233f]">상품별 민원 점유율</span><span className="ml-auto">{acts("stat-tree", "상품별 민원 점유율")}</span></div>
            <EChartTreemap items={PRODUCT_MIX} />
          </section>

          {/* 민원 원인 분류 (가로 막대) */}
          <section className="flex flex-col rounded-[4px] border border-[#e8ecf2] bg-white p-2.5 shadow-[0_1px_3px_rgba(16,35,68,0.05)] transition-shadow hover:shadow-[0_5px_16px_rgba(16,35,68,0.08)]">
            <div className="mb-1 flex items-center gap-1.5"><span title="서비스 품질 / 제도 개선" className="cursor-help text-[11px] font-bold text-[#10233f]">민원 원인 분류</span><span className="ml-auto">{acts("stat-cause", "민원 원인 분류")}</span></div>
            <EChartCauseBar items={[...CAUSE_STATS.service.items.map((x) => ({ ...x, c: "#17b39a" })), ...CAUSE_STATS.system.items.map((x) => ({ ...x, c: "#13355c" }))]} />
            <div className="mt-1 flex items-center justify-center gap-2 text-[9px] text-[#5b6b80]">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2.5 rounded-sm bg-[#17b39a]" />서비스 품질</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2.5 rounded-sm bg-[#13355c]" />제도 개선</span>
            </div>
          </section>
        </div>
        </div>
        <InsightCard title={INSIGHTS[3].title} summary={INSIGHTS[3].summary} items={INSIGHTS[3].items} />
        </div>

        {/* ───────────── ⑤ 인입 플로우 · 고객여정 — 접이식(기본 접힘) ───────────── */}
        <details className="group" onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) window.dispatchEvent(new Event("resize")) }}>
          <CollapsibleSectionHeader icon={Activity} title="인입 플로우 · 고객여정" sub="채널 → 유형 분류 → 담당 부서" />
          <div className="mt-2 flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <section className="rounded-[4px] border border-[#e8ecf2] bg-white p-2.5 shadow-[0_1px_3px_rgba(16,35,68,0.05)] transition-shadow hover:shadow-[0_5px_16px_rgba(16,35,68,0.08)]">
                <div className="mb-1 flex items-center gap-1.5"><span title="가중 분배 · 다대다" className="cursor-help text-[11px] font-bold text-[#10233f]">채널 → 유형 → 부서</span><span className="ml-auto">{acts("stat-flow", "인입 플로우")}</span></div>
                <EChartSankey data={sankeyData} />
              </section>
            </div>
            <InsightCard title={INSIGHTS[4].title} summary={INSIGHTS[4].summary} items={INSIGHTS[4].items} />
          </div>
        </details>
      </div>

      {/* 추가 피드백 토스트 */}
      {toast ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[4px] border border-[#cde0f3] bg-[#0f3468] px-4 py-2 text-[11px] font-semibold text-white shadow-lg">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#7fe3ce]" />{toast}</span>
        </div>
      ) : null}
    </div>
  )
}

const CD_TABS: { key: string; label: string; icon: typeof Siren }[] = [
  { key: "analysis", label: "VoC 통합 분석", icon: ListChecks },
  { key: "report", label: "VoC 리포트", icon: BarChart3 },
  { key: "statsboard", label: "통계 대시보드", icon: BarChart3 },
  { key: "detect", label: "고객 민원 탐지", icon: Siren },
  { key: "analyze", label: "VoC 분석·조회", icon: ClipboardList },
  { key: "criteria", label: "AI 평가 기준", icon: Sparkles },
  { key: "reply", label: "민원 처리", icon: FileText },
  { key: "monitor", label: "실시간 이슈 모니터링", icon: Activity },
]

export function ComplaintDetectionView({ initialTab, tabs, title = "VoC 통합 관리 콘솔", sub = "관리자 · 통합 분석 · 평가 기준 · 민원 처리 · 모니터링 · 리포트", analysisFullTabs }: { initialTab?: string; tabs?: string[]; title?: string; sub?: string; analysisFullTabs?: boolean } = {}) {
  const shownTabs = tabs ? tabs.map((k) => CD_TABS.find((t) => t.key === k)).filter(Boolean) as typeof CD_TABS : CD_TABS
  const [tab, setTab] = useState(initialTab ?? shownTabs[0]?.key ?? "analysis")
  const [replyVoc, setReplyVoc] = useState<string | undefined>(undefined)
  const openReply = (vocId: string) => { setReplyVoc(vocId); setTab("reply") }
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f1f5fb]">
      <div className="shrink-0 border-b border-[#dbe5f1] bg-white px-6 pt-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f3468]/10 text-[#0f3468]"><Headset className="h-4 w-4" /></span>
          <div className="leading-tight">
            <div className="text-[14px] font-bold text-[#10233f]">{title}</div>
            <div className="text-[10.5px] text-muted-foreground">{sub}</div>
          </div>
        </div>
        {shownTabs.length > 1 ? (
          <>
            <div className="-mx-6 mt-3 border-t border-[#e6edf5]" />
            <div className="flex gap-1">
              {shownTabs.map((t) => (
                <button key={t.key} type="button" onClick={() => setTab(t.key)}
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
        <Suspense fallback={<div className="p-6 text-[11px] text-muted-foreground">불러오는 중…</div>}>
          {tab === "detect" ? <DetectScreen /> : tab === "analyze" ? <AdminAnalyze /> : tab === "criteria" ? <CriteriaConsole /> : tab === "reply" ? <ReplyTab vocId={replyVoc} fssOnly /> : tab === "monitor" ? <MonitorTab /> : tab === "report" ? <ReportTab /> : tab === "statsboard" ? <StatsDashboard /> : <UnifiedVocAnalysis onProcess={openReply} fullTabs={analysisFullTabs} />}
        </Suspense>
      </div>
    </div>
  )
}

/* ----------------------------- (기존) 고객 민원 탐지 화면 ----------------------------- */

function DetectScreen() {
  const [period, setPeriod] = useState<PeriodKey>("today")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [riskFilter, setRiskFilter] = useState<"전체" | Level>("전체")
  const [regFilter, setRegFilter] = useState<"전체" | RegState>("전체")
  const [query, setQuery] = useState("")
  const [regOverride, setRegOverride] = useState<Record<string, { reg: RegState; vocId?: string }>>({})

  const pd = PERIOD_DATA[period]
  const mom = Math.round(((MONTHLY_TREND[5].total - MONTHLY_TREND[4].total) / MONTHLY_TREND[4].total) * 100) // 전월比 증감(추이 카드)
  const rows = useMemo(() => DETECTIONS.map((d) => {
    const o = regOverride[d.callId]
    return o ? { ...d, reg: o.reg, vocId: o.vocId ?? d.vocId } : d
  }), [regOverride])

  const filtered = rows
    .filter((d) => riskFilter === "전체" || d.risk === riskFilter)
    .filter((d) => regFilter === "전체" || d.reg === regFilter)
    .filter((d) => !query.trim() || d.customer.includes(query) || d.callId.includes(query) || d.vocMinor.includes(query))
    .sort((a, b) => (b.riskScore + urgencyWeight[b.urgency]) - (a.riskScore + urgencyWeight[a.urgency]))

  const registerVoc = (callId: string) => setRegOverride((p) => ({ ...p, [callId]: { reg: "등록완료", vocId: `VOC-2026-${callId.slice(-6)}` } }))

  return (
    <div className="flex min-h-full flex-col bg-[#f1f5fb]">
      {/* 헤더 + 기간 필터 + KPI */}
      <div className="shrink-0 border-b border-[#dbe5f1] bg-white px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f3468]/10 text-[#0f3468]"><Siren className="h-4 w-4" /></span>
            <div className="leading-tight">
              <div className="text-[14px] font-bold text-[#10233f]">민원 탐지 처리 이력</div>
              <div className="text-[10.5px] text-muted-foreground">콜 STT 기반 AI 불편 탐지 · 민원 위험 평가 · VOC 자동 등록</div>
            </div>
          </div>
          {/* 기간 필터 */}
          <div className="flex items-center gap-1 rounded-lg border border-[#dbe5f1] bg-[#f7fafe] p-0.5">
            {PERIODS.map((p) => (
              <button key={p.key} type="button" onClick={() => setPeriod(p.key)}
                className={cn("rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  period === p.key ? "bg-[#0f3468] text-white shadow-sm" : "text-[#33445c] hover:bg-white")}>{p.label}</button>
            ))}
          </div>
          {/* KPI */}
          <div className="ml-auto flex items-center gap-2">
            <MiniKpi label="기간 내 탐지" value={`${pd.total}`} delta={pd.kpi.deltaPct} />
            <MiniKpi label="처리 필요" value={`${pd.kpi.pending}`} level="warn" />
            <MiniKpi label="제도 개선 신호" value={`${pd.kpi.sysImprove}`} level="bad" />
            <MiniKpi label="평균 위험도" value={`${pd.kpi.avgRisk}`} />
          </div>
        </div>
      </div>

      {/* 인사이트 대시보드 */}
      <div className="grid shrink-0 grid-cols-5 gap-3 px-6 pt-4">
        <DashCard title="민원 위험 탐지 추이" sub="최근 6개월 · 월별" className="col-span-2"
          right={<span className={cn("inline-flex items-center gap-0.5 text-[10px] font-semibold", mom >= 0 ? "text-red-500" : "text-emerald-600")}>{mom >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}전월比 {Math.abs(mom)}%</span>}>
          <TrendChart points={MONTHLY_TREND} />
          <div className="mt-1 flex items-center gap-3 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2.5 rounded-sm bg-[#9bb9d8]" /> 전체 탐지(막대)</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm bg-red-500" /> 위험 높음(선)</span>
          </div>
        </DashCard>
        <DashCard title="상품 유형별 민원" sub="유형 비중">
          {(() => {
            const palette = ["#0f3468", "#2f6bb0", "#15a0a0", "#7cc0c0", "#cbd5e1"]
            const segs = pd.products.map((p, i) => ({ label: p.type, value: p.value, color: palette[i % palette.length] }))
            const top = [...pd.products].sort((a, b) => b.value - a.value)[0]
            return <Donut segments={segs} centerTop={`${Math.round((top.value / pd.total) * 100)}%`} centerSub={top.type} />
          })()}
        </DashCard>
        <DashCard title="VOC 유형 · 위험 비중" sub="대7·중55">
          <VocRiskBars data={pd.voc} />
        </DashCard>
        <DashCard title="상담 주의 유형 · 응대 포인트" sub="민원 빈발 주제">
          <AttnInsight data={pd.attn} />
        </DashCard>
      </div>

      {/* 2분할 */}
      <div className="flex flex-1 items-start gap-4 px-6 py-4">
        {/* 좌: 잠재 민원 케이스 (테이블) */}
        <div className="flex flex-1 flex-col">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#10233f]"><Siren className="h-4 w-4 text-[#0f3468]" /> 잠재 민원 케이스</div>
            <span className="rounded-full bg-[#eef4fb] px-2 py-0.5 text-[9.5px] text-[#0b4f91]">{pd.label} 전체 {pd.total}건 · 위험 우선 {filtered.length}건</span>
            <div className="relative ml-auto">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="상담 ID·고객·VOC" className="h-8 w-[180px] pl-8 text-[11px]" />
            </div>
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <FilterPills label="위험도" value={riskFilter} options={["전체", "높음", "보통", "낮음"]} onChange={(v) => setRiskFilter(v as never)} />
            <FilterPills label="등록" value={regFilter} options={["전체", "대상", "등록완료", "실패", "제외", "비대상"]} onChange={(v) => setRegFilter(v as never)} />
          </div>
          <div className="overflow-hidden rounded-lg border border-[#dbe5f1] bg-white">
            <table className="w-full border-collapse text-left">
              <thead className="bg-[#f7fafe] text-[10px] font-semibold text-[#3a5e8c]">
                <tr>
                  <th className="px-3 py-2">상담 ID · 고객</th>
                  <th className="px-3 py-2">VOC 유형</th>
                  <th className="px-3 py-2">불편 탐지</th>
                  <th className="px-3 py-2">민원 발전 위험</th>
                  <th className="px-2 py-2 text-center">긴급도</th>
                  <th className="px-3 py-2 text-center">등록 상태</th>
                  <th className="px-2 py-2 text-center">제도 개선 영역</th>
                  <th className="w-7" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-[11.5px] text-muted-foreground">조건에 맞는 케이스가 없습니다.</td></tr>
                ) : filtered.map((d) => {
                  const open = expandedId === d.callId
                  return (
                    <Fragment key={d.callId}>
                      <tr onClick={() => setExpandedId((cur) => (cur === d.callId ? null : d.callId))}
                        className={cn("cursor-pointer border-t border-[#eef3f9] align-top text-[11.5px] transition-colors", open ? "bg-[#f2f8ff]" : "hover:bg-[#f7fafe]")}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", d.risk === "높음" ? "bg-red-500" : d.risk === "보통" ? "bg-amber-500" : "bg-slate-300")} />
                            <span className="font-mono text-[11px] font-bold text-[#10233f]">{d.callId}</span>
                          </div>
                          <div className="mt-0.5 pl-3 text-[10px] text-muted-foreground">{d.customer} · {d.datetime.slice(11)}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-[11px] font-medium text-[#10233f]">{d.vocMajor}</div>
                          <div className="text-[10px] text-muted-foreground">{d.vocMinor}</div>
                        </td>
                        <td className="px-3 py-2"><Chip label={d.signal} level={sentimentLevel(d.sentiment)} /></td>
                        <td className="px-3 py-2">
                          <div className="mb-1 flex items-center gap-1.5"><Chip label={d.risk} level={levelTone(d.risk)} dot /><span className="text-[10px] tabular-nums text-muted-foreground">{d.riskScore}</span></div>
                          <ScoreBar value={d.riskScore} level={levelTone(d.risk)} />
                        </td>
                        <td className="px-2 py-2 text-center"><Chip label={d.urgency} level={urgencyTone(d.urgency)} dot /></td>
                        <td className="px-3 py-2 text-center"><RegBadge reg={d.reg} /></td>
                        <td className="px-2 py-2 text-center">{d.systemArea ? <Chip label={d.systemArea} level="warn" /> : <span className="text-[10px] text-muted-foreground/40">—</span>}</td>
                        <td className="px-2 py-2 text-center"><ChevronDown className={cn("mx-auto h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} /></td>
                      </tr>
                      {open ? (
                        <tr className="bg-[#fbfdff]">
                          <td colSpan={8} className="border-t border-[#eef3f9] px-4 py-3">
                            <DetectionDetail d={d} onRegister={() => registerVoc(d.callId)} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 우: AI 평가 기준 */}
        <aside className="flex w-[372px] shrink-0 flex-col">
          <CriteriaPanel />
        </aside>
      </div>
    </div>
  )
}

function CriteriaPanel() {
  const [criteria, setCriteria] = useState<Criterion[]>(CRITERIA_SEED)
  const [editId, setEditId] = useState<string | null>(null)
  const addCriterion = () => {
    const id = `c-${criteria.length}-${criteria.length + 1}`
    setCriteria((p) => [...p, { id, name: "신규 평가 기준", desc: "기준 설명을 입력하세요.", stage: "불편 탐지", ai: "검토 필요", validity: "검토 중", enabled: false }])
    setEditId(id)
  }
  const update = (id: string, patch: Partial<Criterion>) => setCriteria((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  const remove = (id: string) => { setCriteria((p) => p.filter((c) => c.id !== id)); if (editId === id) setEditId(null) }
  return (
    <div className="flex flex-col rounded-xl border border-[#e6edf5] bg-white">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-[#eef2f7] px-3 py-2.5">
        <ListChecks className="h-4 w-4 text-[#0f3468]" />
        <span className="text-[12px] font-bold text-[#10233f]">AI 평가 기준</span>
        <span className="text-[10px] text-muted-foreground">{criteria.length}</span>
        <Button size="sm" variant="outline" onClick={addCriterion} className="ml-auto h-7 gap-1 text-[10.5px]"><Plus className="h-3.5 w-3.5" /> 추가</Button>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start gap-1.5 rounded-lg border border-[#bad6f4] bg-[#f2f8ff] px-2.5 py-2 text-[10px] leading-4 text-[#0b4f91]">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
          <span>AI 적용 가능성·기준 유효성을 검토해 평가 기준을 수정·추가할 수 있습니다.</span>
        </div>
        {criteria.map((c) => (
          <CriterionCard key={c.id} c={c} editing={editId === c.id} onEdit={() => setEditId(c.id)} onClose={() => setEditId(null)} onChange={(patch) => update(c.id, patch)} onRemove={() => remove(c.id)} />
        ))}
        <div className="pt-1">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#10233f]"><ClipboardList className="h-3.5 w-3.5 text-[#0f3468]" /> 탐지 반영 참고 사례</div>
          <div className="space-y-1.5">
            {REFERENCE_CASES.map((r) => (
              <div key={r.cue} className="rounded-lg border border-[#e2eaf4] bg-[#fbfdff] p-2">
                <div className="flex items-center gap-1.5">
                  <span className="min-w-0 flex-1 truncate rounded-sm border-l-2 border-[#bad6f4] bg-white px-1.5 py-0.5 text-[10px] text-[#10233f]">{r.cue}</span>
                  <Chip label={r.risk} level={levelTone(r.risk)} />
                </div>
                <div className="mt-1 flex items-start gap-1 text-[9.5px] leading-4 text-[#33445c]"><ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />{r.result}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterPills({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={cn("rounded-md border px-1.5 py-0.5 text-[10px] transition-colors",
            value === o ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#dbe5f1] bg-white text-[#33445c] hover:bg-muted/40")}>{o}</button>
      ))}
    </div>
  )
}

function RegBadge({ reg }: { reg: RegState }) {
  const map: Record<RegState, { label: string; icon: typeof Siren; level: Tone }> = {
    비대상: { label: "등록 비대상", icon: Ban, level: "muted" },
    대상: { label: "등록 대상", icon: AlertTriangle, level: "warn" },
    등록완료: { label: "VOC 등록완료", icon: CheckCircle2, level: "good" },
    제외: { label: "기존접수 제외", icon: Ban, level: "muted" },
    실패: { label: "등록 실패", icon: XCircle, level: "bad" },
  }
  const m = map[reg]
  return <Chip label={m.label} level={m.level} icon={m.icon} />
}

/* ----------------------------- 케이스 상세(행 펼침) ----------------------------- */

function DetectionDetail({ d, onRegister }: { d: Detection; onRegister: () => void }) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-3">
      <div className="space-y-2.5">
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="font-semibold text-[#0b4f91]">불편도 정량 평가</span>
            <span className="tabular-nums text-muted-foreground">{d.discomfort} / 100</span>
          </div>
          <ScoreBar value={d.discomfort} level={sentimentLevel(d.sentiment)} />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Metric label="제도 개선" value={d.systemArea ?? "없음"} level={d.systemArea ? "warn" : "muted"} />
          <Metric label="위험도" value={`${d.risk}·${d.riskScore}`} level={levelTone(d.risk)} />
          <Metric label="긴급도" value={d.urgency} level={urgencyTone(d.urgency)} />
        </div>
        <div className="rounded-lg border border-[#e2eaf4] bg-[#fbfdff] p-2.5">
          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><FileText className="h-3 w-3" /> 평가 사유</div>
          <p className="text-[11px] leading-5 text-[#10233f]">{d.reason}</p>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><ClipboardList className="h-3 w-3" /> STT 탐지 근거</div>
          <p className="mb-1 text-[10.5px] leading-4 text-[#33445c]">{d.summary}</p>
          <div className="space-y-1">{d.cues.map((c) => <div key={c} className="rounded-md border-l-2 border-[#bad6f4] bg-[#f7fafe] px-2 py-1 text-[10px] text-[#10233f]">{c}</div>)}</div>
        </div>
      </div>
      <div>
        <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><ShieldCheck className="h-3 w-3" /> VOC 시스템 등록</div>
        <VocRegistration d={d} onRegister={onRegister} />
      </div>
    </div>
  )
}

function Metric({ label, value, level }: { label: string; value: string; level: Tone }) {
  return (
    <div className={cn("rounded-lg border px-1.5 py-1 text-center", tone(level))}>
      <div className="text-[9px] opacity-80">{label}</div>
      <div className="mt-0.5 text-[10.5px] font-bold">{value}</div>
    </div>
  )
}

function VocRegistration({ d, onRegister }: { d: Detection; onRegister: () => void }) {
  const StdForm = (
    <div className="rounded-lg border border-[#e2eaf4] bg-white">
      <div className="border-b border-[#eef3f9] bg-[#f7fafe] px-2.5 py-1.5 text-[10px] font-bold text-[#0b4f91]">VOC 표준 등록 형식</div>
      <dl className="divide-y divide-[#eef3f9] text-[10.5px]">
        {([
          ["접수 경로", "AI 자동 탐지 (콜 STT)"],
          ["VOC 유형", `${d.vocMajor} › ${d.vocMinor}`],
          ["고객", `${d.customer} (${d.customerNo})`],
          ["불편/위험", `${d.sentiment}·불편 ${d.discomfort} / 위험 ${d.risk}(${d.riskScore})`],
          ["처리 긴급도", d.urgency],
        ] as [string, string][]).map(([k, v]) => (
          <div key={k} className="flex gap-2 px-2.5 py-1.5"><dt className="w-[58px] shrink-0 text-muted-foreground">{k}</dt><dd className="flex-1 text-[#10233f]">{v}</dd></div>
        ))}
      </dl>
    </div>
  )
  if (d.reg === "비대상")
    return <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[10.5px] text-slate-600"><Ban className="h-4 w-4 shrink-0 text-slate-400" /> 위험도가 낮아 VOC 등록 대상이 아닙니다.</div>
  if (d.reg === "제외")
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2 rounded-lg border border-[#dbe5f1] bg-[#f7fafe] p-2.5 text-[10.5px] text-[#10233f]"><Ban className="mt-0.5 h-4 w-4 shrink-0 text-[#0f3468]" /><div><div className="font-semibold">기존 VOC 접수 고객 — 등록 제외</div><div className="mt-0.5 text-[10px] text-muted-foreground">{d.vocId} · <span className="font-medium text-[#0b4f91]">{d.vocStatus}</span></div></div></div>
        {StdForm}
      </div>
    )
  if (d.reg === "등록완료")
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-[10.5px] text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> VOC 등록 완료 · <span className="font-semibold">{d.vocId}</span></div>
        {StdForm}
      </div>
    )
  if (d.reg === "실패")
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/60 p-2.5 text-[10.5px] text-red-700"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" /><div><div className="font-semibold">자동 등록 실패</div><div className="mt-0.5 text-[10px] text-red-600/90">{d.failReason}</div></div></div>
        {StdForm}
        <Button size="sm" onClick={onRegister} className="w-full gap-1.5 bg-[#0f3468] hover:bg-[#0b2547]"><RefreshCw className="h-3.5 w-3.5" /> 등록 재수행</Button>
      </div>
    )
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 text-[10.5px] text-amber-800"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" /> 위험도 평가 결과 <span className="font-semibold">등록 대상</span>으로 선별됨</div>
      {StdForm}
      <Button size="sm" onClick={onRegister} className="w-full gap-1.5 bg-[#0f3468] hover:bg-[#0b2547]"><ShieldCheck className="h-3.5 w-3.5" /> VOC 시스템 자동 등록</Button>
    </div>
  )
}

/* ----------------------------- AI 평가 기준 패널 ----------------------------- */

function CriteriaConsole() {
  const [criteria, setCriteria] = useState<Criterion[]>(CRITERIA_SEED)
  const [editId, setEditId] = useState<string | null>(null)
  const addCriterion = () => {
    const id = `c-${criteria.length}-${criteria.length + 1}`
    setCriteria((p) => [...p, { id, name: "신규 평가 기준", desc: "기준 설명을 입력하세요.", stage: "불편 탐지", ai: "검토 필요", validity: "검토 중", enabled: false }])
    setEditId(id)
  }
  const update = (id: string, patch: Partial<Criterion>) => setCriteria((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  const remove = (id: string) => { setCriteria((p) => p.filter((c) => c.id !== id)); if (editId === id) setEditId(null) }
  const on = (id: string) => criteria.find((c) => c.id === id)?.enabled ?? false
  const enabledCnt = criteria.filter((c) => c.enabled).length
  const validCnt = criteria.filter((c) => c.enabled && c.validity === "검증 완료").length

  // 탐지 검증 — 표본 콜에 현재 기준을 적용한 결과(기준 토글에 반응)
  const SAMPLES = ["CL-20260612-201", "CL-20260612-204", "CL-20260612-208"].map((id) => DETECTIONS.find((d) => d.callId === id)!).filter(Boolean)
  const evalSample = (d: Detection) => ({
    불편도: on("c1") ? `${d.discomfort} / 100` : "미산정",
    위험도: on("c2") ? `${d.risk} · ${d.riskScore}` : "미산정",
    제도개선: on("c3") && d.systemArea ? d.systemArea : "—",
    긴급도: on("c4") ? d.urgency : "보통(기본)",
    유형: on("c5") ? `${d.vocMajor}` : "미분류",
    등록: !on("c2") ? "보류" : on("c6") && d.reg === "제외" ? "기존접수 제외" : d.reg,
  })

  return (
    <div className="min-h-full bg-[#f1f5fb] px-6 py-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#0f3468]" />
        <div className="text-[13px] font-bold text-[#10233f]">AI 평가 기준 · 탐지 검증</div>
        <span className="text-[10.5px] text-muted-foreground">기준을 등록·수정하고, 표본 콜에 적용한 탐지 결과를 미리 확인합니다.</span>
        <span className="ml-auto rounded-full bg-[#eef4fb] px-2 py-0.5 text-[9.5px] text-[#0b4f91]">적용 {enabledCnt} · 검증 완료 {validCnt}</span>
      </div>
      <div className="grid grid-cols-[1.05fr_1fr] gap-4 items-start">
        {/* 좌: 평가 기준 관리 */}
        <div className="flex flex-col rounded-xl border border-[#e6edf5] bg-white">
          <div className="flex shrink-0 items-center gap-1.5 border-b border-[#eef2f7] px-3 py-2.5">
            <ListChecks className="h-4 w-4 text-[#0f3468]" />
            <span className="text-[12px] font-bold text-[#10233f]">평가 기준</span>
            <span className="text-[10px] text-muted-foreground">{criteria.length}</span>
            <Button size="sm" variant="outline" onClick={addCriterion} className="ml-auto h-7 gap-1 text-[10.5px]"><Plus className="h-3.5 w-3.5" /> 추가</Button>
          </div>
          <div className="space-y-2 p-3">
            <div className="flex items-start gap-1.5 rounded-lg border border-[#bad6f4] bg-[#f2f8ff] px-2.5 py-2 text-[10px] leading-4 text-[#0b4f91]">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
              <span>AI 적용 가능성·기준 유효성을 검토해 평가 기준을 수정·추가하고, 적용 여부를 토글하세요. 우측에서 결과가 즉시 반영됩니다.</span>
            </div>
            {criteria.map((c) => (
              <CriterionCard key={c.id} c={c} editing={editId === c.id} onEdit={() => setEditId(c.id)} onClose={() => setEditId(null)} onChange={(patch) => update(c.id, patch)} onRemove={() => remove(c.id)} />
            ))}
          </div>
        </div>

        {/* 우: 탐지 검증 + 참고 사례 */}
        <div className="space-y-3">
          <div className="rounded-xl border border-[#e6edf5] bg-white">
            <div className="flex items-center gap-1.5 border-b border-[#eef2f7] px-3 py-2.5">
              <ShieldCheck className="h-4 w-4 text-[#0f3468]" />
              <span className="text-[12px] font-bold text-[#10233f]">탐지 검증 (표본 콜 적용)</span>
              <span className="ml-auto text-[10px] text-muted-foreground">기준 토글 → 결과 반영</span>
            </div>
            <div className="space-y-2 p-3">
              {SAMPLES.map((d) => {
                const r = evalSample(d)
                return (
                  <div key={d.callId} className="rounded-lg border border-[#e2eaf4] bg-[#fbfdff] p-2.5">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-[#0f3468]/70">{d.callId}</span>
                      <span className="text-[11px] font-semibold text-[#10233f]">{d.customer}</span>
                      <span className="ml-auto truncate text-[9.5px] text-muted-foreground">{d.cues[0]}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {Object.entries(r).map(([k, v]) => (
                        <div key={k} className={cn("rounded-md border px-1.5 py-1 text-center", v === "미산정" || v === "미분류" || v === "보류" || v === "—" || v === "보통(기본)" ? "border-slate-200 bg-slate-50 text-slate-400" : "border-[#dbe5f1] bg-white text-[#10233f]")}>
                          <div className="text-[9px] opacity-80">{k}</div>
                          <div className="mt-0.5 text-[10px] font-bold">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="rounded-xl border border-[#e6edf5] bg-white p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#10233f]"><ClipboardList className="h-3.5 w-3.5 text-[#0f3468]" /> 탐지 반영 참고 사례</div>
            <div className="space-y-1.5">
              {REFERENCE_CASES.map((r) => (
                <div key={r.cue} className="rounded-lg border border-[#e2eaf4] bg-[#fbfdff] p-2">
                  <div className="flex items-center gap-1.5">
                    <span className="min-w-0 flex-1 truncate rounded-sm border-l-2 border-[#bad6f4] bg-white px-1.5 py-0.5 text-[10px] text-[#10233f]">{r.cue}</span>
                    <Chip label={r.risk} level={levelTone(r.risk)} />
                  </div>
                  <div className="mt-1 flex items-start gap-1 text-[9.5px] leading-4 text-[#33445c]"><ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />{r.result}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CriterionCard({ c, editing, onEdit, onClose, onChange, onRemove }:
  { c: Criterion; editing: boolean; onEdit: () => void; onClose: () => void; onChange: (p: Partial<Criterion>) => void; onRemove: () => void }) {
  const aiLevel: Tone = c.ai === "적용 가능" ? "good" : c.ai === "검토 필요" ? "warn" : "muted"
  return (
    <div className={cn("rounded-lg border bg-white p-2.5 transition-colors", editing ? "border-[#0f3468]" : c.enabled ? "border-[#e2eaf4]" : "border-dashed border-[#d4dde9] opacity-75")}>
      {editing ? (
        <div className="space-y-2">
          <Input value={c.name} onChange={(e) => onChange({ name: e.target.value })} className="h-8 text-[11.5px] font-semibold" />
          <Textarea value={c.desc} onChange={(e) => onChange({ desc: e.target.value })} className="min-h-[48px] text-[10.5px] leading-4" />
          <div className="flex flex-wrap gap-1.5 text-[9.5px]">
            <SelectMini label="단계" value={c.stage} options={["불편 탐지", "위험도 평가", "긴급도 산정", "VOC 분류"]} onChange={(v) => onChange({ stage: v as never })} />
            <SelectMini label="AI" value={c.ai} options={["적용 가능", "검토 필요", "제한적"]} onChange={(v) => onChange({ ai: v as never })} />
            <SelectMini label="유효성" value={c.validity} options={["검증 완료", "검토 중"]} onChange={(v) => onChange({ validity: v as never })} />
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" onClick={onClose} className="h-7 flex-1 bg-[#0f3468] text-[11px] hover:bg-[#0b2547]">완료</Button>
            <Button size="sm" variant="outline" onClick={onRemove} className="h-7 text-[11px] text-red-600 hover:bg-red-50">삭제</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-1.5">
            <span className="text-[11px] font-bold text-[#10233f]">{c.name}</span>
            <button type="button" onClick={onEdit} className="ml-auto shrink-0 text-muted-foreground hover:text-[#0f3468]"><Pencil className="h-3 w-3" /></button>
          </div>
          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{c.desc}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span className="rounded-sm border border-[#dbe5f1] bg-[#f7fafe] px-1.5 py-0.5 text-[9px] font-medium text-[#0b4f91]">{c.stage}</span>
            <Chip label={`AI ${c.ai}`} level={aiLevel} />
            <Chip label={c.validity} level={c.validity === "검증 완료" ? "good" : "warn"} />
            <button type="button" onClick={() => onChange({ enabled: !c.enabled })}
              className={cn("ml-auto rounded-full px-2 py-0.5 text-[9px] font-semibold transition-colors", c.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
              {c.enabled ? "적용 중" : "미적용"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function SelectMini({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-1">
      <span className="text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded border border-[#dbe5f1] bg-white px-1 py-0.5 text-[9.5px] text-[#10233f] outline-none">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}
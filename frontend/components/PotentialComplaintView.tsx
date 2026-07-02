"use client"

/* ================================================================== */
/* 잠재 민원 탐지 — 오늘 인입 문의(콜·챗봇·이메일) 중 민원 발전 가능 건을      */
/* 감지하고, 유형을 분류해 담당 부서로 이관하는 화면                         */
/*  핵심 1) 문의 → 민원 감지  /  핵심 2) 유형 분류 및 부서 이관              */
/* ================================================================== */

import { useState } from "react"
import {
  Phone, MessageSquare, Mail, AlertTriangle, Activity,
  Building2, ArrowRightLeft, ChevronDown, Check, Sparkles, Search, User, ShieldAlert,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PotentialDetectTabs } from "@/components/PotentialDetectTabs"
// VoC 통합관리와 동일한 시각화 컴포넌트 재사용
import { DashCard, Donut, VocRiskBars, MiniKpi, Chip, ScoreBar, levelTone, urgencyTone } from "@/components/ComplaintDetectionView"
import type { Level, Urgency, Sentiment, VocAgg } from "@/components/ComplaintDetectionView"

type Channel = "콜센터" | "모바일 챗봇" | "이메일"
type Status = "미분류" | "분류 완료" | "이관 완료"

type Inquiry = {
  id: string
  channel: Channel
  customer: string
  customerNo: string
  time: string
  summary: string
  cues: string[]          // AI가 감지한 민원 신호 발화/문구(날것)
  sentiment: Sentiment
  discomfort: number      // 불편 강도 0~100
  riskScore: number       // 민원 발전 위험 0~100
  urgency: Urgency
  signal: string          // 감지 요약 신호
  vocMajor: string        // AI 1차 유형(대분류)
  vocMinor: string        // AI 1차 유형(소분류)
}

/* ── 부서·유형 분류 체계 ── */
const DEPTS = ["보상서비스부", "고객만족부", "수금관리부", "디지털서비스부", "계약관리부", "준법감시부"]
const DEPT_BY_TYPE: Record<string, string> = {
  "보험금 청구·지급": "보상서비스부", "해지·환급": "고객만족부", "상담 응대·서비스": "고객만족부",
  "납입·수금": "수금관리부", "상품·가입": "준법감시부", "계약 유지·변경": "계약관리부", "전산·디지털": "디지털서비스부",
}
const TYPE_OPTIONS: { major: string; minors: string[] }[] = [
  { major: "보험금 청구·지급", minors: ["부지급·일부지급 불만", "지급 지연", "구비서류 과다 요구"] },
  { major: "해지·환급", minors: ["환급금 불만", "해지 처리 지연"] },
  { major: "상담 응대·서비스", minors: ["응대 불친절", "대기시간 과다", "안내 오류"] },
  { major: "납입·수금", minors: ["자동이체 오류", "보험료 과다 청구"] },
  { major: "상품·가입", minors: ["불완전판매", "상품 설명 미흡"] },
  { major: "계약 유지·변경", minors: ["변경 처리 지연", "계약 정보 오류"] },
  { major: "전산·디지털", minors: ["인증 실패", "앱·홈페이지 장애"] },
]

/* ── 오늘 인입 문의 (2026-06-19 가정) ── */
const INQUIRIES: Inquiry[] = [
  {
    id: "INQ-260619-014", channel: "콜센터", customer: "김도윤", customerNo: "C-10455213", time: "14:52",
    summary: "암 진단 보험금 부지급 사유에 강하게 항의, 금융감독원 민원 제기 의사 표명.",
    cues: ["“이거 금감원에 민원 넣겠습니다”", "“말도 안 되는 부지급 사유 아닙니까”"],
    sentiment: "부정", discomfort: 88, riskScore: 86, urgency: "긴급", signal: "법적 언급 · 반복 항의",
    vocMajor: "보험금 청구·지급", vocMinor: "부지급·일부지급 불만",
  },
  {
    id: "INQ-260619-021", channel: "이메일", customer: "박준서", customerNo: "C-10319874", time: "13:35",
    summary: "가입 시 설명과 보장이 다르다며 불완전판매 주장, 법적 대응 언급.",
    cues: ["“설명 들은 것과 보장이 완전히 다릅니다”", "“불완전판매로 신고하겠습니다”"],
    sentiment: "부정", discomfort: 82, riskScore: 80, urgency: "높음", signal: "불완전판매 주장",
    vocMajor: "상품·가입", vocMinor: "불완전판매",
  },
  {
    id: "INQ-260619-008", channel: "모바일 챗봇", customer: "최서아", customerNo: "C-10402556", time: "13:08",
    summary: "보험금 청구 후 2주째 처리 지연, 구비서류 반복 요구에 불만 누적.",
    cues: ["“서류를 몇 번이나 더 내라는 거예요”", "“2주째 감감무소식이네요”"],
    sentiment: "부정", discomfort: 81, riskScore: 78, urgency: "긴급", signal: "서류 과다 · 처리 지연",
    vocMajor: "보험금 청구·지급", vocMinor: "구비서류 과다 요구",
  },
  {
    id: "INQ-260619-033", channel: "콜센터", customer: "정유나", customerNo: "C-10388190", time: "12:40",
    summary: "해지환급금이 안내받은 금액보다 적다며 금액 차이에 대해 강하게 항의.",
    cues: ["“들은 금액이랑 왜 이렇게 차이가 나요”", "“손해 보고 해지하라는 거예요?”"],
    sentiment: "부정", discomfort: 77, riskScore: 73, urgency: "높음", signal: "환급금 금액 불만",
    vocMajor: "해지·환급", vocMinor: "환급금 불만",
  },
  {
    id: "INQ-260619-027", channel: "이메일", customer: "한지우", customerNo: "C-10277430", time: "11:55",
    summary: "자동이체가 중복 출금되어 환불을 요구, 반복 발생에 대한 시정 요청.",
    cues: ["“두 번 빠져나갔어요”", "“이런 일이 벌써 두 번째입니다”"],
    sentiment: "부정", discomfort: 68, riskScore: 64, urgency: "높음", signal: "자동이체 오류 · 반복",
    vocMajor: "납입·수금", vocMinor: "자동이체 오류",
  },
  {
    id: "INQ-260619-019", channel: "모바일 챗봇", customer: "오민재", customerNo: "C-10366012", time: "11:30",
    summary: "보험료가 갱신되며 인상된 데 대한 불만, 인상 근거 설명 요구.",
    cues: ["“왜 이렇게 많이 올랐죠”", "“납득이 안 됩니다”"],
    sentiment: "부정", discomfort: 62, riskScore: 58, urgency: "보통", signal: "보험료 인상 불만",
    vocMajor: "납입·수금", vocMinor: "보험료 과다 청구",
  },
  {
    id: "INQ-260619-041", channel: "콜센터", customer: "백서진", customerNo: "C-10299551", time: "10:48",
    summary: "상담사 응대가 불친절했다는 불만, 재발 방지 요구.",
    cues: ["“말투가 너무 불친절하던데요”"],
    sentiment: "부정", discomfort: 58, riskScore: 52, urgency: "보통", signal: "응대 불친절",
    vocMajor: "상담 응대·서비스", vocMinor: "응대 불친절",
  },
  {
    id: "INQ-260619-052", channel: "모바일 챗봇", customer: "강하루", customerNo: "C-10411203", time: "10:20",
    summary: "계약 정보(주소·연락처) 정정 요청, 처리 절차 문의.",
    cues: ["“정보가 잘못 등록돼 있어요”"],
    sentiment: "보통", discomfort: 44, riskScore: 38, urgency: "낮음", signal: "정보 정정 요청",
    vocMajor: "계약 유지·변경", vocMinor: "계약 정보 오류",
  },
  {
    id: "INQ-260619-060", channel: "이메일", customer: "조시현", customerNo: "C-10350778", time: "09:52",
    summary: "모바일 앱 로그인 인증이 반복 실패한다는 문의.",
    cues: ["“앱 로그인이 자꾸 안 돼요”"],
    sentiment: "보통", discomfort: 41, riskScore: 31, urgency: "낮음", signal: "인증 실패 문의",
    vocMajor: "전산·디지털", vocMinor: "인증 실패",
  },
  {
    id: "INQ-260619-066", channel: "콜센터", customer: "윤하경", customerNo: "C-10287644", time: "09:30",
    summary: "보험금 청구 진행 상황 단순 확인 문의, 특이 불만 없음.",
    cues: [],
    sentiment: "보통", discomfort: 22, riskScore: 18, urgency: "낮음", signal: "단순 진행 확인",
    vocMajor: "보험금 청구·지급", vocMinor: "지급 지연",
  },
  {
    id: "INQ-260619-071", channel: "모바일 챗봇", customer: "이준호", customerNo: "C-10266540", time: "09:12",
    summary: "신규 상품 가입 절차 안내 요청, 긍정적 문의.",
    cues: [],
    sentiment: "긍정", discomfort: 10, riskScore: 8, urgency: "낮음", signal: "가입 절차 문의",
    vocMajor: "상품·가입", vocMinor: "상품 설명 미흡",
  },
]

/* ── 헬퍼 ── */
const CH_META: Record<Channel, { icon: typeof Phone; tone: string }> = {
  콜센터: { icon: Phone, tone: "text-[#2f6bb0]" },
  "모바일 챗봇": { icon: MessageSquare, tone: "text-[#3aa088]" },
  이메일: { icon: Mail, tone: "text-[#5a72c9]" },
}
const DETECT_THRESHOLD = 50 // 잠재 민원 감지 기준 점수
const riskLevelOf = (s: number): Level => (s >= 70 ? "높음" : s >= 45 ? "보통" : "낮음")
// 도넛/막대와 동일한 위험 컬러(높음=네이비 / 보통=앰버 / 낮음=그레이)
const RISK_HEX: Record<Level, string> = { 높음: "#0f3468", 보통: "#f59e0b", 낮음: "#cbd5e1" }

export function PotentialComplaintView() {
  const [chFilter, setChFilter] = useState<"전체" | Channel>("전체")
  const [selId, setSelId] = useState(INQUIRIES[0].id)
  // 분류·이관 상태(데모: 메모리)
  const [ov, setOv] = useState<Record<string, { major?: string; minor?: string; dept?: string; status?: Status }>>({})

  const detectedAll = INQUIRIES.filter((i) => i.riskScore >= DETECT_THRESHOLD)
  const list = (chFilter === "전체" ? INQUIRIES : INQUIRIES.filter((i) => i.channel === chFilter))
    .sort((a, b) => b.riskScore - a.riskScore)
  const sel = INQUIRIES.find((i) => i.id === selId) ?? INQUIRIES[0]

  const stateOf = (i: Inquiry): Status | "감지 제외" =>
    i.riskScore < DETECT_THRESHOLD ? "감지 제외" : ov[i.id]?.status ?? "미분류"
  const majorOf = (i: Inquiry) => ov[i.id]?.major ?? i.vocMajor
  const minorOf = (i: Inquiry) => ov[i.id]?.minor ?? i.vocMinor
  const deptOf = (i: Inquiry) => ov[i.id]?.dept ?? DEPT_BY_TYPE[majorOf(i)] ?? "고객만족부"

  const setMajor = (id: string, major: string) => setOv((p) => ({ ...p, [id]: { ...p[id], major, minor: TYPE_OPTIONS.find((t) => t.major === major)?.minors[0], dept: DEPT_BY_TYPE[major], status: p[id]?.status === "이관 완료" ? "이관 완료" : "분류 완료" } }))
  const setMinor = (id: string, minor: string) => setOv((p) => ({ ...p, [id]: { ...p[id], minor, status: p[id]?.status === "이관 완료" ? "이관 완료" : "분류 완료" } }))
  const setDept = (id: string, dept: string) => setOv((p) => ({ ...p, [id]: { ...p[id], dept } }))
  const transfer = (id: string) => setOv((p) => ({ ...p, [id]: { ...p[id], status: "이관 완료" } }))

  // KPI
  const totalToday = INQUIRIES.length
  const detectedN = detectedAll.length
  const transferredN = detectedAll.filter((i) => ov[i.id]?.status === "이관 완료").length
  const pendingN = detectedN - transferredN
  const urgentN = detectedAll.filter((i) => i.urgency === "긴급").length

  const CHANNELS: ("전체" | Channel)[] = ["전체", "콜센터", "모바일 챗봇", "이메일"]

  // 현황 대시보드 집계 — VoC 통합관리와 동일 컴포넌트(Donut/VocRiskBars)에 맞춰 가공
  const CH_PALETTE = ["#0f3468", "#2f6bb0", "#5b8fc9"]
  const chSegs = (["콜센터", "모바일 챗봇", "이메일"] as Channel[]).map((ch, idx) => ({
    label: ch, value: INQUIRIES.filter((i) => i.channel === ch).length, color: CH_PALETTE[idx],
  }))
  const topCh = [...chSegs].sort((a, b) => b.value - a.value)[0]
  const vocAgg: VocAgg[] = Object.entries(detectedAll.reduce<Record<string, number>>((m, i) => { m[i.vocMajor] = (m[i.vocMajor] ?? 0) + 1; return m }, {}))
    .map(([major, total]) => ({ major, total, high: detectedAll.filter((i) => i.vocMajor === major && riskLevelOf(i.riskScore) === "높음").length }))
    .sort((a, b) => b.total - a.total)
  const riskSegs = (["높음", "보통", "낮음"] as Level[]).map((l) => ({ label: l, value: detectedAll.filter((i) => riskLevelOf(i.riskScore) === l).length, color: RISK_HEX[l] }))

  const selState = stateOf(sel)
  const selDetected = sel.riskScore >= DETECT_THRESHOLD

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f4f6fb]">
      <PotentialDetectTabs />
      {/* 헤더 */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#e6ebf2] bg-white px-6 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f3468] text-white"><ShieldAlert className="h-4 w-4" /></span>
          <div className="leading-tight">
            <div className="text-[14.5px] font-bold tracking-tight text-[#10233f]">잠재 민원 탐지</div>
            <div className="text-[10.5px] text-[#6b7888]">오늘 인입 문의(콜·챗봇·이메일)에서 민원 발전 가능 건을 감지 → 유형 분류 → 부서 이관</div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* 좌: 인입 문의 큐 */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* 채널 필터 */}
          <div className="flex shrink-0 items-center gap-1.5 border-b border-[#e6ebf2] bg-white px-5 py-2.5">
            <div className="flex items-center gap-0.5 rounded-lg bg-[#eef1f6] p-0.5">
              {CHANNELS.map((c) => (
                <button key={c} type="button" onClick={() => setChFilter(c)} className={cn("rounded-md px-2.5 py-1 text-[10.5px] font-semibold transition-all", chFilter === c ? "bg-white text-[#0f3468] shadow-sm" : "text-[#6b7888] hover:text-[#10233f]")}>{c}</button>
              ))}
            </div>
            <span className="ml-auto text-[10px] text-[#9aa6b6]">금일 · 10분 단위 실시간 갱신 · {list.length}건</span>
          </div>

          {/* 큐 + 현황 대시보드 */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {/* KPI */}
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <MiniKpi label="오늘 인입 문의" value={`${totalToday}`} />
              <MiniKpi label="민원 감지" value={`${detectedN}`} />
              <MiniKpi label="긴급" value={`${urgentN}`} level="bad" />
              <MiniKpi label="이관 대기" value={`${pendingN}`} level="warn" />
              <MiniKpi label="이관 완료" value={`${transferredN}`} level="good" />
            </div>

            {/* 현황 대시보드 — VoC 통합관리와 동일 컴포넌트 */}
            <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <DashCard title="문의 구성" sub="채널별 인입">
                <Donut segments={chSegs} centerTop={`${totalToday}`} centerSub={topCh.label} />
              </DashCard>
              <DashCard title="VOC 유형 · 위험 비중" sub={`감지 ${detectedN}건`}>
                <VocRiskBars data={vocAgg} />
              </DashCard>
              <DashCard title="위험 등급 분포" sub="감지 건 기준">
                <Donut segments={riskSegs} centerTop={`${detectedN}`} centerSub="감지" />
              </DashCard>
            </div>

            {/* 인입 문의 큐 */}
            <div className="mb-2 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-[#0f3468]" /><span className="text-[12px] font-bold text-[#10233f]">인입 문의 큐</span><span className="text-[10px] text-[#9aa6b6]">{list.length}건</span></div>
            <div className="overflow-hidden rounded-xl border border-[#e6ebf2] bg-white shadow-[0_1px_2px_rgba(16,35,63,0.04)]">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-[#dbe5f1] bg-[#eef2f8] text-[9px] font-semibold uppercase tracking-[0.05em] text-[#7a8699]">
                    <th className="px-3 py-2.5">채널 · 문의</th>
                    <th className="px-3 py-2.5">감지 신호</th>
                    <th className="px-3 py-2.5">잠재 위험</th>
                    <th className="px-3 py-2.5">긴급도</th>
                    <th className="px-3 py-2.5">AI 분류 유형</th>
                    <th className="px-3 py-2.5">추천 부서</th>
                    <th className="px-3 py-2.5">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((i) => {
                    const st = stateOf(i)
                    const detected = i.riskScore >= DETECT_THRESHOLD
                    const Ch = CH_META[i.channel].icon
                    return (
                      <tr key={i.id} onClick={() => setSelId(i.id)}
                        className={cn("cursor-pointer border-b border-[#f0f3f7] transition-colors last:border-0", selId === i.id ? "bg-[#eef4fb]" : "hover:bg-[#f8fafd]")}>
                        <td className="py-3 pl-3 pr-3" style={{ boxShadow: detected ? `inset 3px 0 0 ${RISK_HEX[riskLevelOf(i.riskScore)]}` : "inset 3px 0 0 transparent" }}>
                          <div className="flex items-center gap-1.5"><Ch className={cn("h-3.5 w-3.5 shrink-0", CH_META[i.channel].tone)} /><span className="text-[11px] font-semibold text-[#10233f]">{i.customer}</span><span className="font-mono text-[9px] text-[#9aa6b6]">{i.time}</span></div>
                          <div className="mt-0.5 max-w-[260px] truncate text-[10px] text-[#6b7888]">{i.summary}</div>
                        </td>
                        <td className="px-3 py-3"><span className="text-[10px] text-[#27456b]">{i.signal}</span></td>
                        <td className="px-3 py-3">{detected ? <div className="flex items-center gap-1.5"><div className="w-14"><ScoreBar value={i.riskScore} level={levelTone(riskLevelOf(i.riskScore))} /></div><span className="font-mono text-[10.5px] font-bold tabular-nums text-[#10233f]">{i.riskScore}</span></div> : <span className="text-[9.5px] text-[#9aa6b6]">기준 미만</span>}</td>
                        <td className="px-3 py-3"><Chip label={i.urgency} level={urgencyTone(i.urgency)} dot /></td>
                        <td className="px-3 py-3"><div className="text-[10.5px] font-medium text-[#10233f]">{majorOf(i)}</div><div className="text-[9px] text-[#9aa6b6]">{minorOf(i)}</div></td>
                        <td className="px-3 py-3"><span className="inline-flex items-center gap-1 text-[10px] text-[#27456b]"><Building2 className="h-3 w-3 text-[#9aa6b6]" />{detected ? deptOf(i) : "—"}</span></td>
                        <td className="px-3 py-3"><StatusTag s={st} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 우: 감지·분류·이관 상세 */}
        <aside className="flex w-[340px] shrink-0 flex-col overflow-y-auto border-l border-[#e6ebf2] bg-white">
          <div className="border-b border-[#e6ebf2] px-4 py-3">
            <div className="flex items-center gap-1.5">
              {(() => { const Ch = CH_META[sel.channel].icon; return <Ch className={cn("h-3.5 w-3.5", CH_META[sel.channel].tone)} /> })()}
              <span className="text-[10px] font-semibold text-[#6b7888]">{sel.channel}</span>
              <span className="ml-auto font-mono text-[10px] text-[#9aa6b6]">{sel.id}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#9aa6b6]" />
              <span className="text-[13px] font-bold text-[#10233f]">{sel.customer}</span>
              <span className="font-mono text-[9.5px] text-[#9aa6b6]">{sel.customerNo}</span>
              <span className="ml-auto"><StatusTag s={selState} /></span>
            </div>
          </div>

          {/* 1) 문의 → 민원 감지 */}
          <div className="border-b border-[#e6ebf2] px-4 py-3.5">
            <div className="mb-2 flex items-center gap-1.5"><Search className="h-3.5 w-3.5 text-[#0f3468]" /><span className="text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#9aa6b6]">1. 민원 감지</span></div>
            {selDetected ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[9px] text-[#9aa6b6]"><span>잠재 민원 위험</span><span className="font-mono text-[10px] font-bold text-[#10233f]">{sel.riskScore}/100</span></div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#eef1f6]"><div className="h-full rounded-full" style={{ width: `${sel.riskScore}%`, background: RISK_HEX[riskLevelOf(sel.riskScore)] }} /></div>
                  </div>
                  <Chip label={sel.urgency} level={urgencyTone(sel.urgency)} dot />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded bg-[#fbeceb] px-1.5 py-0.5 font-semibold text-[#b3261e]"><AlertTriangle className="h-3 w-3" />{sel.signal}</span>
                  <span className="text-[#9aa6b6]">감정 {sel.sentiment} · 불편 {sel.discomfort}</span>
                </div>
                {sel.cues.length ? (
                  <div className="mt-2 rounded-lg border border-[#e6ebf2] bg-[#f8fafd] px-2.5 py-2">
                    <div className="mb-1 text-[9px] font-semibold text-[#9aa6b6]">AI 감지 발화</div>
                    <ul className="space-y-1">{sel.cues.map((c, k) => <li key={k} className="text-[10.5px] leading-4 text-[#27456b]">{c}</li>)}</ul>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-[#e6ebf2] px-3 py-3 text-center text-[10px] text-[#9aa6b6]">위험 점수 {sel.riskScore} · 감지 기준({DETECT_THRESHOLD}) 미만<br />단순 문의로 분류되어 이관 대상이 아닙니다.</div>
            )}
          </div>

          {selDetected ? (
            <>
              {/* 2) 유형 분류 */}
              <div className="border-b border-[#e6ebf2] px-4 py-3.5">
                <div className="mb-2 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#0f3468]" /><span className="text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#9aa6b6]">2. 민원 유형 분류</span><span className="ml-auto rounded-sm bg-[#eef4fb] px-1.5 py-0.5 text-[8.5px] font-medium text-[#0b4f91]">AI 1차 분류</span></div>
                <label className="block text-[9px] font-medium text-[#9aa6b6]">대분류</label>
                <SelectBox value={majorOf(sel)} onChange={(v) => setMajor(sel.id, v)} options={TYPE_OPTIONS.map((t) => t.major)} />
                <label className="mt-2 block text-[9px] font-medium text-[#9aa6b6]">소분류</label>
                <SelectBox value={minorOf(sel)} onChange={(v) => setMinor(sel.id, v)} options={TYPE_OPTIONS.find((t) => t.major === majorOf(sel))?.minors ?? [minorOf(sel)]} />
              </div>

              {/* 3) 담당 부서 이관 */}
              <div className="px-4 py-3.5">
                <div className="mb-2 flex items-center gap-1.5"><ArrowRightLeft className="h-3.5 w-3.5 text-[#0f3468]" /><span className="text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#9aa6b6]">3. 담당 부서 이관</span></div>
                <label className="block text-[9px] font-medium text-[#9aa6b6]">담당 부서 <span className="text-[#0c8f78]">(유형 기반 자동 추천)</span></label>
                <SelectBox value={deptOf(sel)} onChange={(v) => setDept(sel.id, v)} options={DEPTS} icon={Building2} />
                {selState === "이관 완료" ? (
                  <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-[#cfe4dd] bg-[#f0fbf8] py-2.5 text-[11.5px] font-bold text-[#0c8f78]"><Check className="h-4 w-4" /> {deptOf(sel)} 이관 완료 · 담당자 알림 발송됨</div>
                ) : (
                  <button type="button" onClick={() => transfer(sel.id)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0f3468] py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[#0b2547]"><ArrowRightLeft className="h-4 w-4" /> {deptOf(sel)}로 이관</button>
                )}
                <p className="mt-2 text-[9px] leading-4 text-[#9aa6b6]">이관 시 담당 부서에 알림이 발송되고, VoC 통합 관리에 처리 건으로 등록됩니다.</p>
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function StatusTag({ s }: { s: Status | "감지 제외" }) {
  const map: Record<string, string> = {
    "미분류": "bg-amber-50 text-amber-700 border-amber-200",
    "분류 완료": "bg-[#eef4fb] text-[#0b4f91] border-[#cfe0f1]",
    "이관 완료": "bg-[#f0fbf8] text-[#0c8f78] border-[#cfe4dd]",
    "감지 제외": "bg-[#f1f3f7] text-[#9aa6b6] border-[#e2e8f0]",
  }
  return <span className={cn("inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[9px] font-bold", map[s])}>{s === "이관 완료" ? <Check className="h-2.5 w-2.5" /> : null}{s}</span>
}

function SelectBox({ value, onChange, options, icon: Icon }: { value: string; onChange: (v: string) => void; options: string[]; icon?: typeof Building2 }) {
  return (
    <div className="relative mt-1">
      {Icon ? <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9aa6b6]" /> : null}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={cn("w-full appearance-none rounded-md border border-[#dbe5f1] bg-white py-1.5 pr-7 text-[11.5px] font-medium text-[#10233f] outline-none focus:border-[#0f3468]", Icon ? "pl-8" : "pl-2.5")}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9aa6b6]" />
    </div>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Activity,
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Gauge,
  Headphones,
  Headset,
  Loader2,
  Mail,
  Building2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  PhoneIncoming,
  ScrollText,
  Search,
  FileText,
  X,
  ShieldCheck,
  Smile,
  Sparkles,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* 데모 데이터                                                         */
/* ------------------------------------------------------------------ */


// 최근 상담 이력(=상담 이력 관리 리스트) — 후처리 진행 상태 포함
const RECENT: {
  customer: string
  cid: string
  topic: string
  time: string
  status: "후처리 필요" | "검수 대기" | "완료"
  kind: "contact" | "sms" | "audit" | null
}[] = [
  { customer: "이준호", cid: "CS-240611-042", topic: "보험금 청구 서류 보완", time: "오늘 09:42", status: "후처리 필요", kind: "contact" },
  { customer: "최유진", cid: "CS-240611-039", topic: "보험금 부지급 사유 문의", time: "오늘 09:18", status: "검수 대기", kind: "audit" },
  { customer: "정민서", cid: "CS-240611-035", topic: "해지환급금 SMS 안내", time: "오늘 08:55", status: "후처리 필요", kind: "sms" },
  { customer: "강도윤", cid: "CS-240611-031", topic: "자동이체 계좌 변경", time: "오늘 08:33", status: "후처리 필요", kind: "contact" },
  { customer: "윤서아", cid: "CS-240611-028", topic: "갱신 보험료 안내", time: "오늘 08:10", status: "완료", kind: null },
  { customer: "박지훈", cid: "CS-240611-051", topic: "약관대출 한도 문의", time: "오늘 10:05", status: "완료", kind: null },
  { customer: "김하늘", cid: "CS-240611-056", topic: "수익자 변경 신청", time: "오늘 10:22", status: "완료", kind: null },
]
const STATUS_META: Record<string, string> = {
  "후처리 필요": "border-amber-200 bg-amber-50 text-amber-700",
  "검수 대기": "border-sky-200 bg-sky-50 text-sky-700",
  완료: "border-emerald-200 bg-emerald-50 text-emerald-700",
}
const ASSIST_SUGGEST = ["실손 청구 구비서류 기준은?", "자동이체 변경 적용일은?", "해지환급금 계산 방법은?", "갱신 보험료 안내 스크립트"]
// 업무 어시스턴트 목업 답변 — 검색 시 같은 화면 결과 패널에 표시
const ASSIST_ANSWERS: Record<string, { answer: string; sources: string[] }> = {
  "실손 청구 구비서류 기준은?": {
    answer: "실손의료비 청구 기본 서류는 ① 보험금청구서 ② 진단서 또는 진료확인서 ③ 진료비 영수증·세부내역서 ④ 신분증 사본입니다. 청구금액이 100만원을 초과하면 진단서 원본이 필요하고, 통원 청구는 처방전·약제비 영수증을 추가로 제출합니다.",
    sources: ["실손의료비 특약 약관 §7", "보험금 청구 업무 매뉴얼 3.2"],
  },
  "자동이체 변경 적용일은?": {
    answer: "자동이체 계좌·출금일 변경은 신청일 기준 영업일 2일 이후 출금분부터 적용됩니다. 마감 시각(오후 3시) 이후 신청 건은 익영업일 접수로 처리되며, 변경 완료 시 SMS로 안내됩니다.",
    sources: ["수납·자동이체 운영지침 2.1"],
  },
  "해지환급금 계산 방법은?": {
    answer: "해지환급금 = 책임준비금 − 미상각 신계약비(해지공제)입니다. 가입 초기에는 해지공제가 커서 환급률이 낮고, 경과기간이 늘수록 상승합니다. 상품·경과월별 환급률은 설계서 및 약관 별표를 따르며, 100% 환급을 일괄 안내하지 않도록 유의합니다.",
    sources: ["해지환급금 산출기준", "약관 별표 · 해지환급금표"],
  },
  "갱신 보험료 안내 스크립트": {
    answer: "표준 안내: “고객님, 이번 갱신은 연령 증가와 위험률 변동으로 보험료가 조정됩니다. 갱신 후 보험료는 월 OO원이며 보장은 동일하게 유지됩니다. 부담되실 경우 감액·특약 조정 옵션도 함께 안내드릴 수 있습니다.”",
    sources: ["갱신 안내 표준 스크립트 v3"],
  },
}
const assistAnswer = (q: string) => ASSIST_ANSWERS[q] ?? { answer: `“${q}”에 대한 요약 답변입니다. 관련 약관·규정·스크립트를 근거로 정리했으며, 자세한 내용은 상담지식 검색에서 확인할 수 있습니다.`, sources: ["상담지식 베이스"] }
// 근거(매뉴얼·약관·규정) 원문 — 근거 태그 클릭 시 팝업으로 표시
const MANUALS: Record<string, { title: string; category: string; body: string }> = {
  "실손의료비 특약 약관 §7": { title: "실손의료비 보장 특약 약관 제7조 (보험금 청구 서류)", category: "약관", body: "① 회사는 보험금 청구 시 다음 각 호의 서류를 확인한다.\n  1. 보험금 청구서(회사 소정 양식)\n  2. 병원 진단서 또는 진료확인서\n  3. 진료비 영수증 및 진료비 세부내역서\n  4. 청구인 신분증 사본\n② 청구금액이 100만원을 초과하는 경우 진단서 원본을 제출하여야 한다.\n③ 통원 의료비는 처방전 및 약제비 영수증을 추가로 제출한다." },
  "보험금 청구 업무 매뉴얼 3.2": { title: "보험금 청구 업무 매뉴얼 3.2 (구비서류 안내)", category: "매뉴얼", body: "상담사는 청구 유형(입원·통원·수술)에 따라 필요한 구비서류를 안내한다. 서류 누락은 접수 지연 사유가 되므로 청구 전 체크리스트로 사전 확인한다.\n\n고액 청구(100만원 초과) 건은 진단서 원본 제출 및 추가 심사가 필요함을 반드시 안내한다." },
  "수납·자동이체 운영지침 2.1": { title: "수납·자동이체 운영지침 2.1 (변경 적용 기준)", category: "지침", body: "자동이체 계좌·출금일 변경은 신청일 기준 영업일 2일 이후 출금분부터 적용한다.\n\n마감 시각(15:00) 이후 접수 건은 익영업일 접수로 처리하며, 변경 완료 시 고객에게 SMS로 통지한다." },
  "해지환급금 산출기준": { title: "해지환급금 산출기준", category: "규정", body: "해지환급금 = 책임준비금 − 미상각 신계약비(해지공제)\n\n가입 초기에는 해지공제가 커서 환급률이 낮고, 경과기간이 늘수록 상승한다. 100% 환급을 일괄 안내하지 않으며, 경과월별 환급률은 약관 별표를 따른다." },
  "약관 별표 · 해지환급금표": { title: "약관 별표 · 해지환급금표", category: "약관", body: "상품별·경과월별 해지환급률을 정한 별표. 설계서에 첨부된 예시표와 동일 기준을 적용한다.\n\n예) 종신보험 10년납 기준 — 1년 경과 약 8%, 3년 약 34%, 5년 약 58%, 10년 약 92% (상품·특약에 따라 상이)." },
  "갱신 안내 표준 스크립트 v3": { title: "갱신 보험료 안내 표준 스크립트 v3", category: "스크립트", body: "“고객님, 이번 갱신은 연령 증가와 위험률 변동으로 보험료가 조정됩니다. 갱신 후 보험료는 월 OOO원이며 보장은 동일하게 유지됩니다.\n\n부담되실 경우 감액 또는 특약 조정 옵션도 함께 안내드릴 수 있습니다.”" },
  "상담지식 베이스": { title: "상담지식 베이스", category: "지식", body: "약관·규정·매뉴얼·QnA를 통합 검색하는 상담지식 베이스입니다. 상세 내용은 상담지식 검색에서 확인하세요." },
}

const TOOLS = [
  { label: "상담지식 검색", href: "/counseling-knowledge", icon: BookOpen },
  { label: "사내규정 검색", href: "/insight-chat?agent=compliance&feature=policy-search", icon: ShieldCheck },
  { label: "상담 스크립트", href: "/documentation?feature=script-studio", icon: ScrollText },
  { label: "민원 조회", href: "/complaint-detection", icon: Gauge },
]

const STATS: { label: string; sub?: string; value: string; smile?: boolean }[] = [
  { label: "평균 응대대기", sub: "(ASA)", value: "0:21" },
  { label: "평균 통화시간", sub: "(ATT)", value: "5:18" },
  { label: "SLA 준수율", sub: "(20초)", value: "93%" },
  { label: "금주의", sub: "고객만족도", value: "4.6", smile: true },
]

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

export function MainHome() {
  const [role, setRole] = useState<"agent" | "admin">("agent")
  useEffect(() => {
    try {
      const r = localStorage.getItem("genon:role")
      if (r === "admin" || r === "agent") setRole(r)
    } catch {
      /* noop */
    }
  }, [])
  if (role === "admin") return <AdminHome />
  return <AgentHome />
}

function AgentHome() {
  const router = useRouter()
  // 대기 → 인입 실시간 전환(데모)
  const [phase, setPhase] = useState<"idle" | "incoming">("idle")
  const [waitingCalls, setWaitingCalls] = useState(1)
  useEffect(() => {
    if (phase !== "idle") return // 인입 후에는 계속 인입 상태 유지
    const t = window.setTimeout(() => setPhase("incoming"), 3000)
    return () => window.clearTimeout(t)
  }, [phase])
  useEffect(() => {
    if (phase !== "incoming") return // 인입 10초 이후부터 대기 콜 누적(5초마다 +1, 최대 6)
    const timers: number[] = []
    timers.push(
      window.setTimeout(() => {
        setWaitingCalls(2)
        timers.push(window.setInterval(() => setWaitingCalls((c) => Math.min(c + 1, 6)), 5000))
      }, 10000),
    )
    return () => timers.forEach((t) => { window.clearTimeout(t); window.clearInterval(t) })
  }, [phase])
  // 대기 시간 = 콜이 큐에 인입된 시점부터의 경과(실시간 카운트업)
  const [waitSec, setWaitSec] = useState(0)
  useEffect(() => {
    if (phase !== "incoming") {
      setWaitSec(0)
      return
    }
    const i = window.setInterval(() => setWaitSec((s) => s + 1), 1000)
    return () => window.clearInterval(i)
  }, [phase])
  // 인입 직후 0~5초: 고객 정보 로딩 → 이후 표시
  const [infoLoaded, setInfoLoaded] = useState(false)
  useEffect(() => {
    if (phase !== "incoming") {
      setInfoLoaded(false)
      return
    }
    setInfoLoaded(false)
    const t = window.setTimeout(() => setInfoLoaded(true), 1000)
    return () => window.clearTimeout(t)
  }, [phase])
  const incoming = phase === "incoming"
  const waitLabel = `${Math.floor(waitSec / 60)}:${String(waitSec % 60).padStart(2, "0")}`

  // 업무 어시스턴트 빠른 검색
const [q, setQ] = useState("")
  const [thread, setThread] = useState<{ id: number; q: string; done: boolean }[]>([])
  const askIdRef = useRef(0)
  const askAssistant = (text: string) => {
    const t = text.trim()
    if (!t) return
    const id = ++askIdRef.current
    setThread((prev) => [...prev, { id, q: t, done: false }])
    setQ("")
    // 데모: 답변 생성 로딩 흉내 후 노출
    window.setTimeout(() => setThread((prev) => prev.map((it) => (it.id === id ? { ...it, done: true } : it))), 850)
  }
  const [manual, setManual] = useState<string | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  // 새 질문 시 마지막(최신) 버블의 상단으로 스크롤 → 매번 같은 시작점에서 답변을 읽음
  useEffect(() => {
    const el = threadRef.current
    if (!el) return
    const last = el.lastElementChild as HTMLElement | null
    el.scrollTop = last ? last.offsetTop : el.scrollHeight
  }, [thread])
  const needCount = RECENT.filter((r) => r.status !== "완료").length
  const [historyOpen, setHistoryOpen] = useState(true)

  return (
    <div className="flex h-full min-h-0 overflow-hidden">

      {/* ════════════════════════════════
          LEFT — 메인 작업 존 (화이트)
      ════════════════════════════════ */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#f8fbfe]">
        <div className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col xl:max-w-4xl 2xl:max-w-5xl">

        {/* ── 웰컴 + KPI ── */}
        <div className="px-10 pb-6 pt-9 xl:px-16 2xl:px-24">
          {/* 웰컴 행 */}
          <div className="mb-5">
            <p className="mb-0.5 text-[11px] font-medium text-muted-foreground">고객서비스팀</p>
            <h1 className="text-[22px] font-bold leading-tight text-[#10233f]">안녕하세요, 김제나 상담사님</h1>
          </div>

          {/* KPI — 라벨 h-9 고정(justify-end), 진행바 absolute → 셀 높이 통일 → items-center */}
          <div className="flex items-center divide-x divide-[#eef2f7]">
            {/* 오늘의 상담 — 진행바 absolute, pb로 셀 높이 다른 셀과 통일 */}
            <div className="relative flex flex-col pb-[10px] px-7">
              <div className="flex h-9 flex-col justify-start">
                <span className="text-[11px] text-muted-foreground">오늘의</span>
                <span className="text-[11px] text-muted-foreground">상담 목표율</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[18px] font-semibold tabular-nums leading-none text-[#10233f]">14</span>
                <span className="text-[12px] text-muted-foreground">/ 60</span>
              </div>
              <div className="absolute bottom-0 left-7 h-[2px] w-16 overflow-hidden rounded-full bg-[#e8f0f9]">
                <div className="h-full rounded-full bg-[#3a5e8c]" style={{ width: "23%" }} />
              </div>
            </div>
            {/* 나머지 KPI — label 위, sub 아래, pb로 셀 높이 통일 */}
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col pb-[10px] px-7">
                <div className="flex h-9 flex-col justify-start">
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  {s.sub && <p className="text-[11px] text-muted-foreground">{s.sub}</p>}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[18px] font-semibold tabular-nums leading-none text-[#10233f]">{s.value}</span>
                  {s.smile && <Smile className="h-4 w-4 text-amber-400" />}
                </div>
              </div>
            ))}
            {/* 후처리 대기 — 최우측 */}
            <div className="flex flex-col pb-[10px] pl-7">
              <div className="flex h-9 flex-col justify-start">
                <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                  후처리 대기
                  {needCount > 0 && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" />}
                </span>
              </div>
              <span className="mt-1 text-[18px] font-semibold tabular-nums leading-none text-[#10233f]">
                {needCount}<span className="ml-1 text-[12px] font-normal text-muted-foreground">건</span>
              </span>
            </div>
          </div>
        </div>

        {/* 구분선 — 네이비→민트 그라데이션 */}
        <div className="mx-10 h-px xl:mx-16 2xl:mx-24" style={{ background: "linear-gradient(to right, #0f3468 0%, #2f8bff 45%, #15c2a2 100%)", opacity: 0.5 }} />

        {/* ── 업무 어시스턴트 ── */}
        <div className="flex min-h-0 flex-1 flex-col px-10 pb-8 pt-6 xl:px-16 2xl:px-24">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#3db0ff] via-[#2f8bff] to-[#15c2a2] shadow-sm shadow-[#15457f]/20">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="text-[14px] font-semibold text-foreground">나만의 업무 어시스턴트</span>
          </div>
          {thread.length === 0 ? <p className="mb-4 text-[11.5px] text-muted-foreground">약관·규정·스크립트를 빠르게 검색하거나 아래 예시 질문을 선택하세요.</p> : null}

          {/* 결과 — 검색 후 상단에 표시(검색창은 자연스럽게 아래로) */}
          {thread.length > 0 ? (
            <div ref={threadRef} className="relative mb-5 max-h-[68vh] space-y-4 overflow-y-auto pr-1">
              {thread.map((it, idx) => { const a = assistAnswer(it.q); const isLast = idx === thread.length - 1; return (
                <div key={it.id} className={cn("space-y-2", isLast && thread.length > 1 && "min-h-[68vh]")}>
                  <div className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-[#e2e8f0] bg-[#eef1f5] px-3 py-2 text-[11.5px] leading-snug text-[#33445c]">{it.q}</div></div>
                  <div className="rounded-xl border border-[#cfe0f4] bg-[#f6fbff] p-3.5">
                    <div className="mb-1.5 flex items-center gap-1.5"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-[#3db0ff] via-[#2f8bff] to-[#15c2a2] shadow-sm shadow-[#15457f]/20"><Sparkles className="h-3 w-3 text-white" /></span><span className="text-[11px] font-semibold text-[#10233f]">AI 어시스턴트</span></div>
                    {it.done ? (
                      <>
                        <p className="whitespace-pre-line text-[12px] leading-6 text-[#27456b]">{a.answer}</p>
                        {a.sources.length ? (
                          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#e0ebf6] pt-2.5">
                            <span className="text-[10px] font-medium text-muted-foreground">근거</span>
                            {a.sources.map((s) => <button key={s} type="button" onClick={() => setManual(s)} className="inline-flex items-center gap-1 rounded border border-[#dbe5f1] bg-white px-1.5 py-0.5 text-[10px] text-[#0b4f91] transition-colors hover:border-[#9cc4ee] hover:bg-[#eef4fb]"><FileText className="h-2.5 w-2.5" />{s}</button>)}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 py-1">
                        <span className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8aa6c6] [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8aa6c6] [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8aa6c6]" />
                        </span>
                        <span className="text-[10.5px] text-muted-foreground">답변 생성 중…</span>
                      </div>
                    )}
                  </div>
                </div>
              ) })}
            </div>
          ) : null}

          {/* 검색창 — chat-interface 스타일 */}
          <div className="relative mb-4 rounded-xl bg-gradient-to-r from-[#3db0ff] via-[#2f8bff] to-[#15c2a2] p-[1.5px] shadow-sm">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) askAssistant(q) }}
              placeholder="어떤 도움이 필요하신가요?"
              className="h-11 rounded-[10.5px] border-0 bg-white pr-12 text-[13px] placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <button
              type="button"
              onClick={() => askAssistant(q)}
              disabled={!q.trim()}
              className={cn("absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white transition-all", q.trim() ? "bg-gradient-to-r from-[#3db0ff] via-[#2f8bff] to-[#15c2a2] shadow-sm shadow-[#15457f]/25 hover:brightness-105" : "cursor-not-allowed bg-[#d3ddea]")}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 예시 질문 — 초기: 리스트형 / 질문 후: 검색창 아래 알약(pill) 칩 */}
          {thread.length === 0 ? (
            <div className="mb-6 shrink-0 overflow-hidden rounded-xl border border-[#e6edf5] bg-white">
              {ASSIST_SUGGEST.map((s, i) => (
                <div key={s}>
                  <button
                    type="button"
                    onClick={() => askAssistant(s)}
                    className="flex w-full min-w-0 items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#f5f8fc]"
                  >
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                    <span className="min-w-0 flex-1 text-[11.5px] leading-snug text-muted-foreground hover:text-foreground">{s}</span>
                  </button>
                  {i < ASSIST_SUGGEST.length - 1 && <div className="h-px bg-[#eef2f7]" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-6 flex flex-wrap gap-2">
              {ASSIST_SUGGEST.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => askAssistant(s)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe5f1] bg-white px-3 py-1.5 text-[11px] text-[#5b6b80] transition-colors hover:border-[#9cc4ee] hover:bg-[#eef4fb] hover:text-[#0f3468]"
                >
                  <Search className="h-3 w-3 shrink-0 text-muted-foreground/50" />{s}
                </button>
              ))}
            </div>
          )}

          {/* 바로가기 — 화면 하단 정렬(mt-auto) */}
          <div className="mt-auto pt-6">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70">바로가기</p>
            <div className="grid grid-cols-4 gap-3.5">
              {TOOLS.map((t) => (
                <div key={t.label}
                  className="group flex cursor-default flex-col items-center gap-2.5 rounded-xl border border-[#e6edf5] bg-white px-3 py-5 transition-all hover:border-[#cfe4f6] hover:shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3db0ff] via-[#2f8bff] to-[#15c2a2] p-[1.5px] shadow-sm shadow-[#15457f]/20">
                    <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white transition-colors group-hover:bg-transparent"><t.icon className="h-4 w-4 text-[#2f8bff] transition-colors group-hover:text-white" /></div>
                  </div>
                  <span className="text-center text-[11.5px] font-medium text-muted-foreground transition-colors group-hover:text-[#10233f]">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>{/* max-w wrapper */}
      </div>

      {/* ════════════════════════════════
          RIGHT — 사이드바 (연청)
      ════════════════════════════════ */}
      <div className="hidden w-[340px] shrink-0 flex-col border-l border-[#e6edf5] bg-white lg:flex">

        {/* ── 콜 인입 ── */}
        <div className="flex flex-1 min-h-0 flex-col">
          {/* 섹션 헤더 */}
          <div className="flex shrink-0 items-center justify-between border-b border-[#eef2f7] bg-gradient-to-r from-[#f2f8ff] to-white px-5 py-3">
            <div className="flex items-center gap-2">
              <PhoneIncoming className={cn("h-3.5 w-3.5", incoming ? "text-[#0f3468]" : "text-muted-foreground")} />
              <span className="text-[12px] font-semibold text-[#10233f]">콜 인입</span>
            </div>
            <span className={cn("inline-flex items-center gap-1.5 text-[10.5px] font-medium",
              incoming ? "text-[#0f3468]" : "text-emerald-600")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", incoming ? "animate-pulse bg-[#0f3468]" : "bg-emerald-500")} />
              {incoming ? "인입 중" : "수신 대기"}
            </span>
          </div>

          {!incoming ? (
            /* 대기 상태 — 깔끔한 센터 */
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4fb]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0f3468]/15" />
                <PhoneIncoming className="relative h-5 w-5 text-[#0f3468]/60" />
              </span>
              <div className="space-y-0.5">
                <p className="text-[12px] font-medium text-[#10233f]">수신 대기 중</p>
                <p className="text-[11px] text-muted-foreground">다음 콜을 준비하세요</p>
              </div>
            </div>
          ) : (
            /* 인입 상태 */
            <div className="flex flex-1 flex-col gap-0 overflow-y-auto">
              {/* 대기 수치 — 심플 행 */}
              <div className="flex items-center divide-x divide-[#eef2f7] border-b border-[#eef2f7] bg-white">
                {[["대기 콜", String(waitingCalls) + "건"], ["대기 시간", waitLabel], ["채널", "IB"]].map(([l, v]) => (
                  <div key={l} className="flex flex-1 flex-col items-center py-2.5">
                    <span className="text-[9px] text-muted-foreground">{l}</span>
                    <span className="mt-0.5 text-[14px] font-semibold tabular-nums text-[#10233f]">{v}</span>
                  </div>
                ))}
              </div>

              {/* 통화 받기 */}
              <div className="px-4 py-3">
                <Link href="/insight-chat?agent=assistant&feature=counseling&case=kim">
                  <Button className="w-full animate-pulse rounded-lg bg-[#154a80] text-[12.5px] font-semibold shadow-md ring-2 ring-[#154a80]/25 hover:bg-[#0f3a64]">
                    <Headphones className="mr-2 h-4 w-4" /> 통화 받기
                  </Button>
                </Link>
              </div>

              {/* 고객 정보 */}
              {!infoLoaded ? (
                <div className="flex items-center gap-2 mx-4 mb-3 rounded-xl border border-[#e6edf5] bg-[#f7fafd] px-4 py-3 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0f3468]" /> 고객 정보 불러오는 중…
                </div>
              ) : (
                <div className="mx-4 overflow-hidden border border-[#e6edf5]">
                  <table className="w-full border-collapse">
                    <tbody>
                      {([
                        ["고객명", "김민준"],
                        ["고객번호", "C-10294857"],
                        ["고객등급", "우량"],
                        ["상담채널", "콜센터 IB"],
                      ] as [string, string][]).map(([label, value]) => (
                        <tr key={label} className="border-b border-[#eef2f7] last:border-0">
                          <td className="w-[72px] bg-[#f7fafd] px-4 py-2 text-[10.5px] text-muted-foreground">{label}</td>
                          <td className="px-4 py-2 text-[11.5px] font-medium text-[#10233f]">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center gap-1.5 border-t border-[#eef2f7] px-4 py-2.5">
                    <Sparkles className="h-3 w-3 shrink-0 text-[#0f3468]" />
                    <p className="text-[10.5px] text-[#10233f]"><span className="font-medium text-[#0f3468]">AI</span> 예상 문의 · <span className="font-medium">보험금 접수 진행 상황 문의</span></p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 오늘의 고객 상담 이력 ── */}
        <div className={cn("flex min-h-0 flex-col border-t border-[#e6edf5] transition-all duration-300", historyOpen ? "flex-1" : "shrink-0")}>
          {/* 토글 헤더 */}
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex w-full shrink-0 items-center justify-between bg-gradient-to-r from-[#f2f8ff] to-white px-5 py-3 transition-colors hover:from-[#eaf2fc]"
          >
            <div className="flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5 text-[#0f3468]" />
              <span className="text-[12px] font-semibold text-[#10233f]">오늘의 고객 상담 이력</span>
            </div>
            <span className="text-[11px] font-medium text-[#0f3468]">
              {historyOpen ? "접기" : "펼치기"}
            </span>
          </button>

          {/* 이력 목록 */}
          {historyOpen && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {RECENT.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => router.push(r.kind ? `/post-consultation?task=${r.kind}` : "/post-consultation")}
                  className={cn("flex w-full items-center gap-3 bg-white px-5 py-2.5 text-left transition-colors hover:bg-[#f5f8fc] border-t border-[#eef2f7]", i === RECENT.length - 1 && "border-b border-[#eef2f7]")}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="shrink-0 text-[12px] font-medium text-[#10233f]">{r.customer}</span>
                      <span className="truncate text-[10.5px] text-muted-foreground">{r.topic}</span>
                    </div>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                      <span className="font-mono text-[#0f3468]/70">{r.cid}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{r.time}</span>
                    </span>
                  </div>
                  {r.status === "후처리 필요" && (
                    <span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-medium", STATUS_META[r.status])}>{r.status}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 근거 매뉴얼/약관 팝업 */}
      {manual ? (() => { const m = MANUALS[manual] ?? { title: manual, category: "문서", body: "문서 내용을 찾을 수 없습니다." }; return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setManual(null)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#e6edf5] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-2 border-b border-[#eef2f7] px-5 py-3.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#eef4fb] text-[#0f3468]"><FileText className="h-3.5 w-3.5" /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-[#8aa6c6]">{m.category}</div>
                <div className="text-[13px] font-bold text-[#10233f]">{m.title}</div>
              </div>
              <button type="button" onClick={() => setManual(null)} className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-[#f1f5f9]"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-5 py-4"><p className="whitespace-pre-line text-[12px] leading-6 text-[#27456b]">{m.body}</p></div>
          </div>
        </div>
      ) })() : null}
    </div>
  )
}

/* ================================================================== */
/* 관리자 홈 — 상담사 실시간 모니터링 + 상담 검수 중심                    */
/* ================================================================== */

// 실시간 상담사 가동 현황 (관리 20명 / 상담 중 16명)
const AGENTS: { name: string; state: "상담 중" | "후처리" | "대기" | "이석"; info: string; dur?: string }[] = [
  { name: "김제나", state: "상담 중", info: "김민준 · 해지환급금 안내", dur: "06:12" },
  { name: "박정우", state: "후처리", info: "접촉이력 등록 중", dur: "01:08" },
  { name: "이수민", state: "상담 중", info: "박서윤 · 실효·부활 문의", dur: "02:41" },
  { name: "한도현", state: "대기", info: "수신 대기" },
  { name: "최가람", state: "상담 중", info: "정해린 · 자동이체 변경", dur: "03:55" },
  { name: "윤지호", state: "상담 중", info: "이준호 · 보험금 청구 서류", dur: "04:18" },
  { name: "서민아", state: "상담 중", info: "최유진 · 부지급 사유 문의", dur: "01:52" },
  { name: "강하늘", state: "상담 중", info: "정민서 · 해지환급금 SMS", dur: "07:33" },
  { name: "임채린", state: "상담 중", info: "강도윤 · 자동이체 변경", dur: "02:09" },
  { name: "조은별", state: "상담 중", info: "박지훈 · 약관대출 한도", dur: "05:41" },
  { name: "신우진", state: "상담 중", info: "김하늘 · 수익자 변경", dur: "03:07" },
  { name: "배예나", state: "상담 중", info: "한지우 · 갱신 보험료", dur: "00:48" },
  { name: "문성호", state: "상담 중", info: "오세훈 · 약관대출 상환", dur: "06:55" },
  { name: "노아라", state: "상담 중", info: "서민재 · 납입 유예", dur: "02:24" },
  { name: "류정민", state: "상담 중", info: "임채원 · 청구 진행 상황", dur: "04:46" },
  { name: "백서진", state: "상담 중", info: "신예은 · 해지 상담", dur: "01:30" },
  { name: "고다은", state: "상담 중", info: "한가람 · 보험료 변경", dur: "03:18" },
  { name: "표준혁", state: "상담 중", info: "유나래 · 청구 추가서류", dur: "00:22" },
  { name: "정유진", state: "후처리", info: "SMS 안내 작성 중", dur: "00:36" },
  { name: "오세영", state: "이석", info: "휴식 중" },
]
const AGENT_STATE_META: Record<string, string> = {
  "상담 중": "border-[#bad6f4] bg-[#f2f8ff] text-[#0b4f91]",
  후처리: "border-[#dbe5f1] bg-[#f7fafe] text-[#5b6b80]",
  대기: "border-[#bfe7dd] bg-[#eafaf5] text-[#0f766e]",
  이석: "border-slate-200 bg-slate-50 text-slate-500",
}
// 검수 대기 큐 (상담번호·담당 상담사 중심)
const REVIEW_QUEUE: { cid: string; agent: string; type: string; severity: "심각" | "경미"; time: string }[] = [
  { cid: "CL-20260513-027", agent: "최가람", type: "오안내·안내 누락", severity: "심각", time: "어제 17:42" },
  { cid: "CL-20260513-097", agent: "김제나", type: "오안내", severity: "심각", time: "어제 16:20" },
  { cid: "CL-20260512-070", agent: "노아라", type: "오안내·안내 누락", severity: "심각", time: "05.12 15:46" },
  { cid: "CL-20260512-066", agent: "문성호", type: "안내 누락", severity: "경미", time: "05.12 14:02" },
  { cid: "CL-20260513-041", agent: "조은별", type: "오안내", severity: "경미", time: "어제 13:55" },
  { cid: "CL-20260513-019", agent: "이수민", type: "안내 누락", severity: "심각", time: "어제 11:08" },
  { cid: "CL-20260512-088", agent: "강하늘", type: "오안내", severity: "경미", time: "05.12 10:33" },
  { cid: "CL-20260512-052", agent: "서민아", type: "안내 누락", severity: "경미", time: "05.12 09:41" },
  { cid: "CL-20260511-073", agent: "윤지호", type: "오안내·안내 누락", severity: "심각", time: "05.11 16:27" },
]
const ADMIN_TOOLS = [
  { label: "실시간 모니터링", href: "/realtime-monitoring", icon: Activity },
  { label: "상담 검수", href: "/post-consultation?task=audit-result", icon: ShieldCheck },
  { label: "민원 탐지", href: "/complaint-detection", icon: Gauge },
  { label: "운영 대시보드", href: "/admin", icon: ClipboardCheck },
]
const ADMIN_STATS: { label: string; sub?: string; value: string; suffix?: string }[] = [
  { label: "대외기관", sub: "회신 대기", value: "6", suffix: "건" },
  { label: "미배정", sub: "분류·이관", value: "38", suffix: "건" },
]
// 대시보드 시각화 데이터
const AGENT_DIST = [
  { label: "상담 중", value: 16, color: "#0f3468" },
  { label: "후처리", value: 2, color: "#5b8fc9" },
  { label: "대기", value: 1, color: "#15c2a2" },
  { label: "이석", value: 1, color: "#cbd5e1" },
]
const AUDIT_DIST = [
  { label: "통과", value: 32, color: "#15c2a2" },
  { label: "경미", value: 8, color: "#5b8fc9" },
  { label: "심각", value: 4, color: "#0f3468" },
]
const COMPLAINTS = [
  { label: "청구 지연", value: 12 },
  { label: "응대 불만", value: 8 },
  { label: "불완전판매", value: 5 },
  { label: "상품 설명", value: 4 },
  { label: "기타", value: 3 },
]
const QUALITY: { label: string; value: string; trend: string; up: boolean }[] = [
  { label: "검수 통과율", value: "91%", trend: "+2.1%p", up: true },
  { label: "오안내율", value: "3.2%", trend: "-0.8%p", up: true },
  { label: "안내 누락율", value: "5.1%", trend: "-1.2%p", up: true },
  { label: "고객만족도", value: "4.6", trend: "+0.1", up: true },
]
// 민원 추이 — 일자·채널별 (최근 7일, 마지막=오늘)
const TREND_CH = [
  { key: "콜센터", color: "#0f3468" },
  { key: "이메일", color: "#2f6bb0" },
  { key: "모바일 챗봇", color: "#5b8fc9" },
  { key: "대외기관", color: "#15c2a2" },
] as const
const TREND_DAYS: { d: string; 콜센터: number; 이메일: number; "모바일 챗봇": number; 대외기관: number }[] = [
  { d: "06.13", 콜센터: 34, 이메일: 14, "모바일 챗봇": 9, 대외기관: 5 },
  { d: "06.14", 콜센터: 26, 이메일: 11, "모바일 챗봇": 8, 대외기관: 3 },
  { d: "06.15", 콜센터: 41, 이메일: 16, "모바일 챗봇": 12, 대외기관: 5 },
  { d: "06.16", 콜센터: 22, 이메일: 9, "모바일 챗봇": 6, 대외기관: 3 },
  { d: "06.17", 콜센터: 32, 이메일: 13, "모바일 챗봇": 9, 대외기관: 4 },
  { d: "06.18", 콜센터: 18, 이메일: 7, "모바일 챗봇": 6, 대외기관: 2 },
  { d: "오늘", 콜센터: 28, 이메일: 11, "모바일 챗봇": 8, 대외기관: 3 },
]
const TREND_MONTHS: { d: string; 콜센터: number; 이메일: number; "모바일 챗봇": number; 대외기관: number }[] = [
  { d: "1월", 콜센터: 720, 이메일: 290, "모바일 챗봇": 180, 대외기관: 88 },
  { d: "2월", 콜센터: 760, 이메일: 305, "모바일 챗봇": 205, 대외기관: 92 },
  { d: "3월", 콜센터: 810, 이메일: 330, "모바일 챗봇": 230, 대외기관: 96 },
  { d: "4월", 콜센터: 788, 이메일: 318, "모바일 챗봇": 248, 대외기관: 90 },
  { d: "5월", 콜센터: 842, 이메일: 345, "모바일 챗봇": 270, 대외기관: 102 },
  { d: "6월", 콜센터: 690, 이메일: 286, "모바일 챗봇": 232, 대외기관: 84 },
]
// 실시간 모니터링 — 주목 통화(최장/난이도/민원다수)
const MONITOR_FLAGS: { tag: string; agent: string; info: string; meta: string; live?: boolean }[] = [
  { tag: "AI 위험 신호", agent: "김제나", info: "김민준 · 해지환급금 안내", meta: "06:12", live: true },
  { tag: "최장 통화", agent: "강하늘", info: "정민서 · 해지환급금 SMS", meta: "07:33" },
  { tag: "민원 다수", agent: "서민아", info: "최유진 · 부지급 사유 문의", meta: "누적 4" },
]
// 콜상담 운영 — 카루셀 보조 통계
const AGENT_CALLS = [{ k: "콜 인바운드", n: 12 }, { k: "콜 아웃바운드", n: 3 }, { k: "콜백 예약", n: 5 }]
const AGENT_TIMES = [{ k: "평균 응대", v: "3:12" }, { k: "평균 대기", v: "0:42" }, { k: "평균 후처리", v: "1:05" }]
// 시간대별 콜 인입·응대 (오늘)
const CALL_HOURLY: { h: string; in: number; ans: number }[] = [
  { h: "09", in: 38, ans: 36 }, { h: "10", in: 52, ans: 49 }, { h: "11", in: 61, ans: 55 },
  { h: "12", in: 33, ans: 31 }, { h: "13", in: 47, ans: 44 }, { h: "14", in: 64, ans: 57 },
  { h: "15", in: 58, ans: 54 }, { h: "16", in: 49, ans: 46 }, { h: "17", in: 41, ans: 39 },
]
// 3) 민원 현황 · 4) 담당 부서 이관 상태
const EXTERNAL_VOC = { wait: 6, sla: 2, sent: 14 }
const ROUTING = { unassigned: 38, intake: 312, routed: 274 }
const COMPLAINT_CHANNELS = [{ k: "콜센터", n: 182 }, { k: "이메일", n: 74 }, { k: "모바일 챗봇", n: 42 }, { k: "대외기관", n: 14 }]
const TRANSFER_DIST = [
  { label: "이관 완료", value: 248, color: "#15c2a2" },
  { label: "처리 중", value: 26, color: "#5b8fc9" },
  { label: "미배정", value: 38, color: "#0f3468" },
]
const TRANSFER_DEPTS = [{ k: "보상서비스부", n: 92 }, { k: "고객만족부", n: 78 }, { k: "준법감시부", n: 44 }]
// 우측 4대 업무 큐
const EXT_QUEUE: { id: string; customer: string; type: string; sla: string; urgent: boolean; voc?: string }[] = [
  { id: "2026V2901", voc: "VOC-260616-205", customer: "도경민", type: "보험금 부지급 사실조회", sla: "D-1", urgent: true },
  { id: "2026V3187", voc: "VOC-260616-211", customer: "권나윤", type: "불완전판매 자율조정", sla: "D-1", urgent: true },
  { id: "2026V3340", voc: "VOC-260616-209", customer: "임세라", type: "해지환급금 이의 회신", sla: "D-2", urgent: false },
  { id: "FSS-20260618-017", customer: "한지우", type: "보장 제외 분쟁 회신", sla: "내일", urgent: false },
  { id: "FSS-20260617-033", customer: "오세진", type: "지급 지연 민원 회신", sla: "2일", urgent: false },
  { id: "FSS-20260617-028", customer: "조하준", type: "구비서류 과다 회신", sla: "2일", urgent: false },
]
const ROUTE_QUEUE: { id: string; customer: string; type: string; channel: string; dept: string; risk: "높음" | "보통" | "낮음" }[] = [
  { id: "VOC-260619-141", customer: "정해성", type: "보험금 지급 지연", channel: "콜센터", dept: "보상서비스부", risk: "높음" },
  { id: "VOC-260619-138", customer: "문가영", type: "해지·환급 불만", channel: "이메일", dept: "고객만족부", risk: "보통" },
  { id: "VOC-260619-135", customer: "류준영", type: "자동이체 오류", channel: "모바일 챗봇", dept: "수금관리부", risk: "보통" },
  { id: "VOC-260619-129", customer: "백지호", type: "불완전판매 항변", channel: "콜센터", dept: "준법감시부", risk: "높음" },
  { id: "VOC-260619-124", customer: "서아람", type: "앱 인증 오류", channel: "모바일 챗봇", dept: "디지털서비스부", risk: "낮음" },
  { id: "VOC-260619-118", customer: "남도현", type: "계약 정보 정정", channel: "이메일", dept: "계약관리부", risk: "낮음" },
]

// 실시간 카운터 — target 변경 시 부드럽게 업/다운 트윈
function LiveNum({ value, className }: { value: number; className?: string }) {
  const [disp, setDisp] = useState(value)
  const ref = useRef(value)
  useEffect(() => {
    const from = ref.current, to = value
    if (from === to) return
    const start = performance.now(); let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 600)
      const cur = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)))
      ref.current = cur; setDisp(cur)
      if (p < 1) raf = requestAnimationFrame(tick); else ref.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className={className}>{disp.toLocaleString()}</span>
}

function Donut({ items, center, centerSub }: { items: { label: string; value: number; color: string }[]; center: string; centerSub: string }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1
  let acc = 0
  const stops = items
    .map((i) => {
      const a = (acc / total) * 100
      acc += i.value
      const b = (acc / total) * 100
      return `${i.color} ${a}% ${b}%`
    })
    .join(", ")
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-[64px] w-[64px] shrink-0 rounded-full" style={{ background: `conic-gradient(${stops})` }}>
        <div className="absolute inset-[27%] flex flex-col items-center justify-center rounded-full bg-white shadow-[0_0_0_1px_rgba(15,35,68,0.05)]">
          <span className="text-[14px] font-bold leading-none tracking-tight text-[#10233f]">{center}</span>
          <span className="mt-0.5 text-[7.5px] text-muted-foreground">{centerSub}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {items.map((i) => (
          <div key={i.label} className="flex items-center gap-1.5 text-[10px]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: i.color }} />
            <span className="min-w-0 flex-1 truncate text-[#33445c]">{i.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-[#10233f]">{i.value}</span>
            <span className="w-7 shrink-0 text-right text-[9px] tabular-nums text-muted-foreground">{Math.round((i.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 콜상담 운영 — 좌우 카루셀 카드 (상태 / 콜 유형 / 응대 시간)
function OpsAgentCard({ onDuty, dist }: { onDuty: number; dist: { label: string; value: number; color: string }[] }) {
  const SLIDES = ["상담사 상태", "콜 유형 처리", "응대 시간"]
  const [i, setI] = useState(0)
  const go = (d: number) => setI((p) => (p + d + SLIDES.length) % SLIDES.length)
  return (
    <div className="flex flex-col rounded-xl border border-[#e9eef6] bg-white p-4 shadow-[0_1px_2px_rgba(16,35,68,0.05)]">
      <div className="mb-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#10233f]">
        <Users className="h-3.5 w-3.5 text-[#0f3468]" /> {SLIDES[i]}
        <span className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => go(-1)} className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[#eef4fb] hover:text-[#0f3468]"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => go(1)} className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[#eef4fb] hover:text-[#0f3468]"><ChevronRight className="h-3.5 w-3.5" /></button>
        </span>
      </div>
      <div className="flex flex-col justify-center" style={{ minHeight: 96 }}>
        {i === 0 ? <Donut items={dist} center={String(onDuty)} centerSub="상담 중" /> : null}
        {i === 1 ? (
          <div className="space-y-1.5">
            {AGENT_CALLS.map((c) => { const max = Math.max(...AGENT_CALLS.map((x) => x.n)); return (
              <div key={c.k} className="flex items-center gap-2 text-[10.5px]">
                <span className="w-[68px] shrink-0 text-[#33445c]">{c.k}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef2f7]"><div className="h-full rounded-full bg-[#2f6bb0]" style={{ width: `${(c.n / max) * 100}%` }} /></div>
                <span className="w-5 text-right font-semibold tabular-nums text-[#10233f]">{c.n}</span>
              </div>
            ) })}
          </div>
        ) : null}
        {i === 2 ? (
          <div className="grid grid-cols-3 gap-2">
            {AGENT_TIMES.map((t) => (
              <div key={t.k} className="rounded-lg border border-[#eef2f7] bg-[#fafcff] py-2 text-center">
                <div className="text-[9px] text-muted-foreground">{t.k}</div>
                <div className="mt-0.5 text-[14px] font-bold tabular-nums text-[#10233f]">{t.v}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1">
        {SLIDES.map((_, di) => <button key={di} type="button" onClick={() => setI(di)} className={cn("h-1.5 rounded-full transition-all", di === i ? "w-4 bg-[#0f3468]" : "w-1.5 bg-[#d6deea]")} />)}
      </div>
    </div>
  )
}

// 민원 추이 — 주간(일별 7일) / 월간(월별 6개월) 토글 + 채널 누적 막대 + 추세선
function TrendCard() {
  const [unit, setUnit] = useState<"week" | "month">("week")
  const data = unit === "week" ? TREND_DAYS : TREND_MONTHS
  const totals = data.map((d) => TREND_CH.reduce((s, c) => s + d[c.key], 0))
  const max = Math.max(...totals)
  const sumAll = totals.reduce((s, v) => s + v, 0)
  const n = data.length, W = 480, plotH = 126, padX = 10, top = 14, baseY = top + plotH
  const slot = (W - padX * 2) / n
  const cx = (idx: number) => padX + slot * idx + slot / 2
  const barW = unit === "week" ? 14 : 16
  const lp = data.map((_, idx) => [cx(idx), baseY - (totals[idx] / max) * plotH] as const)
  return (
    <div className="col-span-2 rounded-xl border border-[#e9eef6] bg-white p-4 shadow-[0_1px_2px_rgba(16,35,68,0.05)]">
      <style>{`@keyframes mhfade{from{opacity:0}to{opacity:1}}`}</style>
      <div className="mb-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#10233f]">
        <Activity className="h-3.5 w-3.5 text-[#0f3468]" /> 민원 추이
        <div className="ml-1.5 flex items-center gap-0.5 rounded-md border border-[#dbe5f1] bg-[#f7fafe] p-0.5">
          {([["week", "주간"], ["month", "월간"]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setUnit(k)} className={cn("rounded px-1.5 py-0.5 text-[9.5px] font-semibold transition-colors", unit === k ? "bg-[#0f3468] text-white" : "text-[#5b6b80] hover:bg-white")}>{l}</button>
          ))}
        </div>
        <span className="ml-auto text-[10px] font-normal text-muted-foreground">{unit === "week" ? "최근 7일" : "최근 6개월"} 합계 <b className="font-semibold tabular-nums text-[#10233f]">{sumAll.toLocaleString()}</b>건</span>
      </div>
      <svg key={unit} viewBox={`0 0 ${W} ${baseY + 16}`} className="h-[178px] w-full animate-[mhfade_.35s_ease]">
        <line x1={padX} y1={baseY} x2={W - padX} y2={baseY} stroke="#eef2f7" strokeWidth={1} />
        {data.map((day, idx) => { let yc = baseY; return (
          <g key={day.d}>
            {TREND_CH.map((c) => { const h = (day[c.key] / max) * plotH; yc -= h; return <rect key={c.key} x={cx(idx) - barW / 2} y={yc} width={barW} height={h} fill={c.color} opacity={0.92} rx={1} /> })}
          </g>
        ) })}
        <polyline points={lp.map((p) => p.join(",")).join(" ")} fill="none" stroke="#0f3468" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
        {lp.map((p, idx) => <circle key={idx} cx={p[0]} cy={p[1]} r={2.2} fill="#fff" stroke="#0f3468" strokeWidth={1.4} />)}
        {data.map((day, idx) => <text key={day.d} x={cx(idx)} y={lp[idx][1] - 5} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700 }} className="fill-[#0f3468]">{totals[idx]}</text>)}
        {data.map((day, idx) => { const cur = day.d === "오늘" || day.d === "6월"; return <text key={day.d} x={cx(idx)} y={baseY + 12} textAnchor="middle" style={{ fontSize: 8, fontWeight: cur ? 700 : 400 }} className={cur ? "fill-[#0f3468]" : "fill-muted-foreground"}>{day.d}</text> })}
      </svg>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#eef2f7] pt-2">
        {TREND_CH.map((c) => <span key={c.key} className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="h-2 w-2 rounded-sm" style={{ background: c.color }} />{c.key}</span>)}
      </div>
    </div>
  )
}

function AdminHome() {
  const router = useRouter()
  const baseDuty = AGENTS.filter((a) => a.state === "상담 중").length
  // 실시간 변동(상담 중 / 미배정) — 마운트 후 일정 간격 ±변동
  const [liveDuty, setLiveDuty] = useState(baseDuty)
  const [liveUnassigned, setLiveUnassigned] = useState(ROUTING.unassigned)
  useEffect(() => {
    const id = setInterval(() => {
      setLiveDuty((v) => Math.min(18, Math.max(13, v + (Math.random() < 0.5 ? -1 : 1))))
      setLiveUnassigned((v) => Math.min(46, Math.max(31, v + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.4 ? 2 : 1))))
    }, 7000)
    return () => clearInterval(id)
  }, [])
  const onDuty = liveDuty
  const liveAgentDist = [{ label: "상담 중", value: liveDuty, color: "#0f3468" }, ...AGENT_DIST.slice(1)]

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* LEFT */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-white">
        <div className="mx-auto flex w-full max-w-3xl xl:max-w-5xl 2xl:max-w-none min-h-0 flex-1 flex-col">
          <div className="px-10 pb-7 pt-9 2xl:px-14">
            <div className="mb-5">
              <p className="mb-0.5 text-[11px] font-medium text-muted-foreground">운영관리팀</p>
              <h1 className="text-[22px] font-bold leading-tight text-[#10233f]">안녕하세요, 박관리 관리자님</h1>
            </div>
            <div className="flex items-stretch gap-5">
              {/* 상담 운영 */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#0b4f91]/70">콜상담 운영 관리</span>
                <div className="flex items-center divide-x divide-[#eef2f7]">
                  <div className="flex flex-col pb-[10px] pr-6">
                    <div className="flex h-9 flex-col justify-start"><span className="text-[11px] text-muted-foreground">실시간</span><span className="text-[11px] text-muted-foreground">상담 중</span></div>
                    <div className="mt-1 flex items-baseline gap-1"><LiveNum value={liveDuty} className="text-[18px] font-semibold tabular-nums leading-none text-[#10233f]" /><span className="text-[12px] text-muted-foreground">명</span></div>
                  </div>
                  <div className="flex flex-col px-6 pb-[10px]">
                    <div className="flex h-9 flex-col justify-start"><span className="text-[11px] text-muted-foreground">1차 검수</span><span className="text-[11px] text-muted-foreground">심각 건</span></div>
                    <div className="mt-1 flex items-baseline gap-1"><span className="text-[18px] font-semibold tabular-nums leading-none text-[#10233f]">{AUDIT_DIST[2].value}</span><span className="text-[12px] text-muted-foreground">건</span></div>
                  </div>
                </div>
              </div>
              <div className="my-1 w-px bg-[#e2eaf4]" />
              {/* 민원 처리 */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#0b4f91]/70">VoC 처리 관리</span>
                <div className="flex items-center divide-x divide-[#eef2f7]">
                  {ADMIN_STATS.map((s) => s.label === "미배정" ? (
                    <div key={s.label} className="relative flex flex-col px-6 pb-[10px]">
                      <div className="flex h-9 flex-col justify-start"><p className="text-[11px] text-muted-foreground">미배정</p><p className="text-[11px] text-muted-foreground">전체 {ROUTING.intake}건 중</p></div>
                      <div className="mt-1 flex items-baseline gap-1"><LiveNum value={liveUnassigned} className="text-[18px] font-semibold tabular-nums leading-none text-[#10233f]" /><span className="text-[12px] text-muted-foreground">건</span><span className="ml-1 text-[11px] font-semibold tabular-nums text-[#0f3468]">{Math.round((liveUnassigned / ROUTING.intake) * 100)}%</span></div>
                      <div className="absolute bottom-0 left-6 right-6 h-[3px] overflow-hidden rounded-full bg-[#e8f0f9]"><div className="h-full rounded-full bg-[#0f3468] transition-[width] duration-500" style={{ width: `${(liveUnassigned / ROUTING.intake) * 100}%` }} /></div>
                    </div>
                  ) : (
                    <div key={s.label} className="flex flex-col pb-[10px] px-6 first:pl-0">
                      <div className="flex h-9 flex-col justify-start"><p className="text-[11px] text-muted-foreground">{s.label}</p>{s.sub && <p className="text-[11px] text-muted-foreground">{s.sub}</p>}</div>
                      <div className="mt-1 flex items-baseline gap-1"><span className="text-[18px] font-semibold tabular-nums leading-none text-[#10233f]">{s.value}</span>{s.suffix && <span className="text-[12px] text-muted-foreground">{s.suffix}</span>}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="my-1 w-px bg-[#e2eaf4]" />
              {/* 알림 */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#0b4f91]/70">알림</span>
                <div className="flex flex-col pb-[10px]">
                  <div className="flex h-9 flex-col justify-start">
                    <span className="whitespace-nowrap text-[11px] text-muted-foreground">조치 필요<span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#0f3468] align-middle" /></span>
                    <span className="whitespace-nowrap text-[11px] text-muted-foreground">SLA 2·고위험 2·심각 1</span>
                  </div>
                  <span className="mt-1 text-[18px] font-semibold tabular-nums leading-none text-[#10233f]">5<span className="ml-1 text-[12px] font-normal text-muted-foreground">건</span></span>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-10 h-px 2xl:mx-14" style={{ background: "linear-gradient(to right, #0f3468 0%, #2f8bff 45%, #15c2a2 100%)", opacity: 0.5 }} />

          <div className="flex min-h-0 flex-1 flex-col px-10 py-8 2xl:px-14">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#3db0ff] via-[#2f8bff] to-[#15c2a2] shadow-sm shadow-[#15457f]/20"><Activity className="h-3.5 w-3.5 text-white" /></span>
              <span className="text-[14px] font-semibold text-foreground">운영 대시보드</span>
              <span className="text-[10.5px] text-muted-foreground">실시간 현황 · 오늘</span>
            </div>

            <div className="space-y-3.5 2xl:grid 2xl:grid-cols-2 2xl:items-start 2xl:gap-4 2xl:space-y-0">
              {/* 상담 운영 */}
              <div className="rounded-2xl border border-[#e6edf6] bg-[#f6f9fd] p-3.5">
                <div className="mb-2.5 flex items-center gap-1.5"><span className="h-3 w-1 rounded-full bg-[#0f3468]" /><span className="text-[11.5px] font-bold text-[#10233f]">콜상담 운영 관리</span><span className="text-[9.5px] text-muted-foreground">실시간 모니터링 · 품질 검수</span></div>
                <div className="grid grid-cols-2 gap-3">
                  <OpsAgentCard onDuty={onDuty} dist={liveAgentDist} />
                  <div className="rounded-xl border border-[#e9eef6] bg-white p-4 shadow-[0_1px_2px_rgba(16,35,68,0.05)]">
                    <div className="mb-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#10233f]"><ShieldCheck className="h-3.5 w-3.5 text-[#0f3468]" /> 상담 품질 AI 1차 검수 <span className="text-[10px] font-normal text-muted-foreground">오늘</span></div>
                    <Donut items={AUDIT_DIST} center={String(AUDIT_DIST.reduce((s, i) => s + i.value, 0))} centerSub="건" />
                  </div>
                  <div className="col-span-2 rounded-xl border border-[#e9eef6] bg-white p-4 shadow-[0_1px_2px_rgba(16,35,68,0.05)]">
                    <div className="mb-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#10233f]"><ClipboardCheck className="h-3.5 w-3.5 text-[#0f3468]" /> 상담 품질 지표 <span className="text-[10px] font-normal text-muted-foreground">전주 대비</span></div>
                    <div className="grid grid-cols-4 gap-x-3">
                      {QUALITY.map((m) => (
                        <div key={m.label}>
                          <div className="text-[9.5px] text-muted-foreground">{m.label}</div>
                          <div className="flex items-baseline gap-1"><span className="text-[15px] font-bold tabular-nums leading-none text-[#10233f]">{m.value}</span><span className={cn("text-[9px] font-medium", m.up ? "text-[#0f766e]" : "text-[#5b6b80]")}>{m.trend}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 rounded-xl border border-[#e9eef6] bg-white p-4 shadow-[0_1px_2px_rgba(16,35,68,0.05)]">
                    <div className="mb-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#10233f]"><PhoneIncoming className="h-3.5 w-3.5 text-[#0f3468]" /> 시간대별 콜 인입·응대 <span className="text-[10px] font-normal text-muted-foreground">오늘</span><span className="ml-auto text-[9px] font-normal text-muted-foreground">응대율 93%</span></div>
                    {(() => { const max = Math.max(...CALL_HOURLY.map((x) => x.in)); return (
                      <div className="flex items-end gap-1.5">
                        {CALL_HOURLY.map((d) => (
                          <div key={d.h} className="flex flex-1 flex-col items-center gap-1">
                            <div className="relative h-[104px] w-full">
                              <div className="absolute inset-x-[22%] bottom-0 rounded-t-sm bg-[#dbe7f4]" style={{ height: `${(d.in / max) * 100}%` }} />
                              <div className="absolute inset-x-[22%] bottom-0 rounded-t-sm bg-[#0f3468]" style={{ height: `${(d.ans / max) * 100}%` }} />
                            </div>
                            <span className="text-[8px] tabular-nums text-muted-foreground">{d.h}</span>
                          </div>
                        ))}
                      </div>
                    ) })()}
                    <div className="mt-2 flex items-center gap-3 border-t border-[#eef2f7] pt-2 text-[8.5px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#dbe7f4]" /> 인입</span>
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#0f3468]" /> 응대</span>
                      <span className="ml-auto">피크 14시 · 평균 응대 3:12</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 민원 처리 */}
              <div className="rounded-2xl border border-[#e6edf6] bg-[#f6f9fd] p-3.5">
                <div className="mb-2.5 flex items-center gap-1.5"><span className="h-3 w-1 rounded-full bg-[#2f6bb0]" /><span className="text-[11.5px] font-bold text-[#10233f]">VoC 처리 관리</span><span className="text-[9.5px] text-muted-foreground">민원 대응 · 부서 이관</span></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#e9eef6] bg-white p-4 shadow-[0_1px_2px_rgba(16,35,68,0.05)]">
                    <div className="mb-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#10233f]"><Gauge className="h-3.5 w-3.5 text-[#0f3468]" /> 민원 현황 <span className="text-[10px] font-normal text-muted-foreground">채널별 인입</span><span className="ml-auto text-[9px] font-normal text-muted-foreground">10:24 기준</span></div>
                    <div className="mb-3 flex items-stretch divide-x divide-[#eef2f7]">
                      <div className="flex flex-1 flex-col items-center"><span className="text-[8.5px] text-muted-foreground">오늘 인입</span><span className="text-[15px] font-bold tabular-nums text-[#10233f]">{ROUTING.intake}</span></div>
                      <div className="flex flex-1 flex-col items-center"><span className="text-[8.5px] text-muted-foreground">미배정</span><span className="text-[15px] font-bold tabular-nums text-[#0f3468]">{ROUTING.unassigned}</span></div>
                      <div className="flex flex-1 flex-col items-center"><span className="text-[8.5px] text-muted-foreground">대외기관 회신</span><span className="text-[15px] font-bold tabular-nums text-[#2f6bb0]">{EXTERNAL_VOC.wait}</span></div>
                    </div>
                    <div className="space-y-1">
                      {COMPLAINT_CHANNELS.map((c) => { const max = Math.max(...COMPLAINT_CHANNELS.map((x) => x.n)); return (
                        <div key={c.k} className="flex items-center gap-2 text-[10px]">
                          <span className="w-[60px] shrink-0 truncate text-[#33445c]">{c.k}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef2f7]"><div className="h-full rounded-full bg-gradient-to-r from-[#2f8bff] to-[#15c2a2]" style={{ width: `${(c.n / max) * 100}%` }} /></div>
                          <span className="w-6 text-right font-mono tabular-nums text-muted-foreground">{c.n}</span>
                        </div>
                      ) })}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#e9eef6] bg-white p-4 shadow-[0_1px_2px_rgba(16,35,68,0.05)]">
                    <div className="mb-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#10233f]"><Building2 className="h-3.5 w-3.5 text-[#0f3468]" /> 담당 부서 이관 상태</div>
                    <Donut items={TRANSFER_DIST} center={`${Math.round((TRANSFER_DIST[0].value / TRANSFER_DIST.reduce((s, i) => s + i.value, 0)) * 100)}%`} centerSub="이관 완료" />
                    <div className="mt-3 space-y-1 border-t border-[#eef2f7] pt-2.5">
                      {TRANSFER_DEPTS.map((t) => { const max = Math.max(...TRANSFER_DEPTS.map((x) => x.n)); return (
                        <div key={t.k} className="flex items-center gap-2 text-[9.5px]">
                          <span className="w-[68px] shrink-0 truncate text-[#33445c]">{t.k}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef2f7]"><div className="h-full rounded-full bg-[#2f6bb0]" style={{ width: `${(t.n / max) * 100}%` }} /></div>
                          <span className="w-5 text-right font-mono tabular-nums text-muted-foreground">{t.n}</span>
                        </div>
                      ) })}
                    </div>
                  </div>
                  <TrendCard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — 업무 요약 → 진입 */}
      <div className="hidden w-[220px] shrink-0 flex-col border-l border-[#e6edf5] bg-white lg:flex xl:w-[247px] 2xl:w-[284px]">
        <div className="flex min-h-0 flex-1 flex-col divide-y divide-[#eef2f7]">
          {/* ── 콜상담 운영 관리 ── */}
          <div className="shrink-0 bg-[#f0f5fb] px-5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#6b7f99]">콜상담 운영 관리</div>
          {/* 업무1 — 실시간 상담 모니터링 (상담사 3명 노출) */}
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-1.5 border-b border-[#eef2f7] bg-white px-5 py-2">
              <Activity className="h-3.5 w-3.5 text-[#0f3468]" /><span className="text-[11.5px] font-semibold text-[#10233f]">실시간 상담 모니터링</span>
              <span className="text-[9.5px] text-muted-foreground">상담 중 {onDuty} · 대기 7</span>
              <button type="button" onClick={() => router.push("/realtime-monitoring")} className="ml-auto text-[10px] font-medium text-[#0f3468] hover:underline">전체 →</button>
            </div>
            <div className="min-h-0 flex-1 divide-y divide-[#eef2f7] overflow-y-auto">
              {MONITOR_FLAGS.slice(0, 3).map((f) => (
                <div key={f.tag} role={f.live ? "button" : undefined} onClick={f.live ? () => router.push(`/realtime-monitoring?agent=${encodeURIComponent(f.agent)}`) : undefined} className={cn("flex items-center gap-2.5 px-5 py-2 text-left transition-colors hover:bg-[#f7fafe]", f.live && "cursor-pointer")}>
                  <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0f3468] text-white"><Headset className="h-3.5 w-3.5" /><span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-[#eef4fb] text-[7.5px] font-bold text-[#0f3468]">{f.agent.slice(0, 1)}</span></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5"><span className="text-[12px] font-medium text-[#10233f]">{f.agent} 상담사</span><span className={cn("rounded-sm border px-1 py-px text-[8.5px] font-medium", f.live ? "border-[#f0c98a] bg-[#fff6e8] text-[#b27516]" : "border-[#dbe5f1] bg-[#f7fafe] text-[#0b4f91]")}>{f.tag}</span><span className="font-mono text-[9px] text-muted-foreground">{f.meta}</span></div>
                    <span className="block truncate text-[10px] text-muted-foreground">{f.info}</span>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); if (f.live) router.push(`/realtime-monitoring?agent=${encodeURIComponent(f.agent)}`) }} className={cn("flex shrink-0 items-center gap-0.5 rounded-md bg-[#0f3468] px-1.5 py-0.5 text-[9px] font-semibold text-white transition-all", f.live ? "cursor-pointer hover:bg-[#0b2547] hover:shadow-md hover:-translate-y-px active:translate-y-0 active:scale-95 ring-1 ring-[#2f6bb0]/0 hover:ring-[#2f6bb0]/40" : "cursor-default")}><Headphones className="h-2.5 w-2.5" /> 입장</button>
                </div>
              ))}
            </div>
          </section>

          {/* 업무2 — 상담 품질 검수 (심각 4건 노출) */}
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-1.5 border-b border-[#eef2f7] bg-white px-5 py-2">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0f3468]" /><span className="text-[11.5px] font-semibold text-[#10233f]">상담 품질 검수</span>
              <span className="text-[9.5px] text-muted-foreground">심각 {AUDIT_DIST[2].value} · 대기 {REVIEW_QUEUE.length}</span>
              <button type="button" onClick={() => router.push("/post-consultation?task=audit-result")} className="ml-auto text-[10px] font-medium text-[#0f3468] hover:underline">전체 →</button>
            </div>
            <div className="min-h-0 flex-1 divide-y divide-[#eef2f7] overflow-y-auto">
              {REVIEW_QUEUE.filter((r) => r.severity === "심각").slice(0, 3).map((r) => (
                <button key={r.cid} type="button" onClick={() => router.push(`/post-consultation?task=audit-result&id=${r.cid}`)} className="flex w-full items-center gap-3 px-5 py-1.5 text-left transition-colors hover:bg-[#f7fafe]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5"><span className="shrink-0 font-mono text-[10.5px] font-semibold text-[#10233f]">{r.cid}</span><span className="truncate text-[10px] text-muted-foreground">{r.type}</span></div>
                    <span className="mt-0.5 block text-[9.5px] text-muted-foreground">담당 <span className="font-medium text-[#33445c]">{r.agent}</span> · {r.time}</span>
                  </div>
                  <span className="shrink-0 rounded-sm border border-[#bcd3ef] bg-[#eef4fb] px-1.5 py-0.5 text-[8.5px] font-bold text-[#0f3468]">심각</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#cbd5e1]" />
                </button>
              ))}
            </div>
          </section>

          {/* ── VoC 처리 관리 ── */}
          <div className="shrink-0 bg-[#f0f5fb] px-5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#6b7f99]">VoC 처리 관리</div>
          {/* 업무3 — 대외 민원 처리 */}
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-1.5 border-b border-[#eef2f7] bg-white px-5 py-2">
              <Mail className="h-3.5 w-3.5 text-[#0f3468]" /><span className="text-[11.5px] font-semibold text-[#10233f]">대외 민원 처리</span>
              <span className="text-[9.5px] text-muted-foreground">대기 {EXT_QUEUE.length} · 임박 {EXT_QUEUE.filter((e) => e.urgent).length}</span>
              <button type="button" onClick={() => router.push("/external-complaint")} className="ml-auto text-[10px] font-medium text-[#0f3468] hover:underline">전체 →</button>
            </div>
            <div className="min-h-0 flex-1 divide-y divide-[#eef2f7] overflow-y-auto">
              {EXT_QUEUE.slice(0, 3).map((e) => (
                <button key={e.id} type="button" onClick={() => router.push(e.voc ? `/external-complaint?voc=${e.voc}` : "/external-complaint")} className="flex w-full items-center gap-3 px-5 py-2 text-left transition-colors hover:bg-[#f7fafe]">
                  <div className="min-w-0 flex-1">
                    <span className="block font-mono text-[11.5px] font-bold text-[#10233f]">{e.id}</span>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="font-medium text-[#33445c]">{e.customer}</span><span className="truncate">· {e.type}</span></div>
                  </div>
                  <span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-medium", e.urgent ? "border-[#bcd3ef] bg-[#eef4fb] text-[#0f3468]" : "border-[#dbe5f1] bg-[#f7fafe] text-[#5b6b80]")}>SLA {e.sla}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#cbd5e1]" />
                </button>
              ))}
            </div>
          </section>

          {/* 업무4 — 민원 탐지 이관 */}
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-1.5 border-b border-[#eef2f7] bg-white px-5 py-2">
              <Building2 className="h-3.5 w-3.5 text-[#0f3468]" /><span className="text-[11.5px] font-semibold text-[#10233f]">민원 탐지 이관</span>
              <span className="text-[9.5px] text-muted-foreground">미배정 {liveUnassigned}</span>
              <button type="button" onClick={() => router.push("/complaint-detection")} className="ml-auto text-[10px] font-medium text-[#0f3468] hover:underline">전체 →</button>
            </div>
            <div className="min-h-0 flex-1 divide-y divide-[#eef2f7] overflow-y-auto">
              {ROUTE_QUEUE.slice(0, 3).map((r) => { const ChIcon = r.channel === "콜센터" ? PhoneIncoming : r.channel === "이메일" ? Mail : r.channel === "모바일 챗봇" ? MessageSquare : Gauge; return (
                <button key={r.id} type="button" onClick={() => router.push("/complaint-detection")} className="flex w-full items-center gap-3 px-5 py-2 text-left transition-colors hover:bg-[#f7fafe]">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", r.risk === "높음" ? "bg-[#0f3468]" : r.risk === "보통" ? "bg-[#5b8fc9]" : "bg-slate-300")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5"><span className="text-[12px] font-medium text-[#10233f]">{r.customer}</span><span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground"><ChIcon className="h-2.5 w-2.5" />{r.channel}</span></div>
                    <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{r.type} · <span className="text-[#0b4f91]">{r.dept}</span></span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#cbd5e1]" />
                </button>
              ) })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 공용                                                                */
/* ------------------------------------------------------------------ */




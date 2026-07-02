"use client"

/* ================================================================== */
/* 실시간 상담 모니터링 — 관리자(박관리) 화면                            */
/*  [정의] 실시간 코칭을 위한 관할 상담사들의 실시간 상담 모니터링 화면     */
/*  헤더에서 모니터링 대상 상담사 선택                                   */
/*  좌: 고객 정보(업무정보) / 중1: 실시간 STT / 중2: 상담지식(RAG)        */
/*  우: 실시간 코칭 채팅(관리자 메인 작업영역)                           */
/* ================================================================== */

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Headset, Send, CircleDot, MessageSquare, Activity,
  Sparkles, Radio, Bot, ShieldCheck, Search, User,
  Clock, ChevronRight, ChevronLeft, Mail, Check, X, Building2, ChevronDown, AlertTriangle, HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { WorkInfo } from "./CounselingAssistantView"

type AgentState = "상담 중" | "후처리" | "대기" | "이석"
type Line = { speaker: "agent" | "customer"; time: string; text: string; flag?: boolean; live?: boolean }
type MonAgent = {
  name: string; state: AgentState; topic?: string; dur?: string
  customer?: string; customerNo?: string; grade?: string
  flags?: string[]; figures?: [string, string][]
  sentiment?: "긍정" | "보통" | "부정"; alert?: string
  transcript?: Line[]
}

const AGENTS: MonAgent[] = [
  {
    name: "김제나", state: "상담 중", customer: "김민준", customerNo: "C-10294857", grade: "우량", topic: "해지환급금 안내", dur: "06:12",
    sentiment: "보통", alert: "해지 안내 — 보장 종료·재가입 제한 고지 필요",
    flags: ["실효 이력 3건", "보험금 접수 중"],
    figures: [["보유 계약", "(무)제논종신보험 외 1"], ["월 보험료", "12.8만원"], ["예상 해지환급금", "18,420,000원"], ["납입 상태", "정상 납입"]],
    transcript: [
      { speaker: "agent", time: "10:20", text: "안녕하세요 고객님, 제논라이프 상담사 김제나입니다. 무엇을 도와드릴까요?" },
      { speaker: "customer", time: "10:20", text: "네, 보험 하나 정리 좀 하려고 하는데요." },
      { speaker: "agent", time: "10:21", text: "본인 확인을 위해 성함과 생년월일을 말씀해 주시겠어요?" },
      { speaker: "customer", time: "10:21", text: "김민준이고 90년 3월 12일이요." },
      { speaker: "agent", time: "10:22", text: "확인되었습니다. 어떤 계약 관련해서 문의 주셨을까요?" },
      { speaker: "customer", time: "10:23", text: "예전에 가입한 종신보험 해지하면 환급금이 얼마나 나오나요?", live: true },
      { speaker: "agent", time: "10:23", text: "네 고객님, 해지환급금 조회 도와드리겠습니다." },
      { speaker: "customer", time: "10:24", text: "그냥 낸 거 다 돌려받을 수 있는 거죠?" },
      { speaker: "agent", time: "10:24", text: "예상 환급금을 확인해서 안내드리겠습니다." },
    ],
  },
  {
    name: "최가람", state: "상담 중", customer: "정복순", customerNo: "C-10422190", grade: "표준", topic: "자동이체 변경", dur: "03:55",
    sentiment: "보통", alert: "환급률 안내 정확성 주의 (경과 연수 확인)",
    flags: ["자동이체 등록"],
    figures: [["보유 계약", "(무)제논종신보험"], ["환급률(5년 경과)", "80%"], ["월 보험료", "9.2만원"], ["납입 상태", "정상 납입"]],
    transcript: [
      { speaker: "customer", time: "13:31", text: "5년 됐는데 지금 해지하면 얼마 받아요?" },
      { speaker: "agent", time: "13:32", text: "환급률은 100%라서 납입하신 만큼 받으실 수 있어요.", flag: true },
      { speaker: "customer", time: "13:32", text: "아 그럼 손해는 없네요?" },
    ],
  },
  {
    name: "서민아", state: "상담 중", customer: "최영자", customerNo: "C-10377201", grade: "표준", topic: "부지급 사유 문의", dur: "01:52",
    sentiment: "부정", alert: "고객 불만 고조 — 부지급 항의",
    flags: ["보험금 청구 진행"],
    figures: [["청구 건", "실손 보험금"], ["심사 상태", "부지급 통보"], ["부지급 사유", "면책 기간 해당"]],
    transcript: [
      { speaker: "customer", time: "09:18", text: "이게 왜 부지급이에요? 납득이 안 가는데요.", flag: true },
      { speaker: "agent", time: "09:18", text: "고객님, 부지급 사유를 다시 확인해 안내드리겠습니다." },
    ],
  },
  {
    name: "이수민", state: "상담 중", customer: "박순옥", customerNo: "C-10288011", grade: "표준", topic: "실효·부활 문의", dur: "02:41",
    sentiment: "보통",
    flags: ["보험료 미납 2회"],
    figures: [["보유 계약", "(무)제논건강보험"], ["미납", "2회 · 납입최고 중"], ["부활 가능", "실효 후 3년 이내"]],
    transcript: [
      { speaker: "customer", time: "10:40", text: "보험료를 몇 달 못 냈는데 살릴 수 있나요?" },
      { speaker: "agent", time: "10:40", text: "실효일로부터 3년 이내 부활 청약이 가능합니다." },
    ],
  },
  {
    name: "윤지호", state: "상담 중", customer: "이상철", customerNo: "C-10266540", grade: "우량", topic: "보험금 청구 서류", dur: "04:18",
    sentiment: "보통",
    flags: ["청구 접수 대기"],
    figures: [["청구 건", "실손 의료비"], ["제출", "진료비계산서 완료"], ["미제출", "세부내역서"]],
    transcript: [
      { speaker: "customer", time: "10:35", text: "청구하려면 어떤 서류가 필요해요?" },
      { speaker: "agent", time: "10:35", text: "진료비계산서·세부내역서가 기본 구비서류입니다." },
    ],
  },
  {
    name: "강하늘", state: "상담 중", customer: "정민서", customerNo: "C-10241882", grade: "표준", topic: "해지환급금 SMS", dur: "20:00",
    sentiment: "긍정", alert: "장시간 통화 — 20분 경과, 응대 상태 점검 필요",
    flags: ["장시간 통화"],
    figures: [["보유 계약", "(무)제논연금보험"], ["예상 해지환급금", "9,180,000원"]],
    transcript: [
      { speaker: "customer", time: "10:30", text: "안내 문자로도 받아볼 수 있을까요?" },
      { speaker: "agent", time: "10:30", text: "네, 조회 후 문자로 안내드리겠습니다." },
    ],
  },
  { name: "한지민", state: "상담 중", customer: "박명자", customerNo: "C-10455213", grade: "표준", topic: "보험금 청구 진행", dur: "03:12", sentiment: "보통", flags: ["청구 접수"] },
  { name: "조은채", state: "상담 중", customer: "김서아", customerNo: "C-10319874", grade: "우량", topic: "계약대출 문의", dur: "02:05", sentiment: "긍정", flags: [] },
  { name: "임수호", state: "상담 중", customer: "이도현", customerNo: "C-10402556", grade: "표준", topic: "자동이체 변경", dur: "01:30", sentiment: "보통", flags: [] },
  { name: "배정후", state: "상담 중", customer: "정유나", customerNo: "C-10388190", grade: "표준", topic: "실손 보장범위 안내", dur: "04:47", sentiment: "보통", flags: ["보장 확인"] },
  { name: "노아인", state: "상담 중", customer: "한지우", customerNo: "C-10277430", grade: "우량", topic: "연금 개시 안내", dur: "05:20", sentiment: "긍정", flags: [] },
  { name: "신유나", state: "상담 중", customer: "오민재", customerNo: "C-10366012", grade: "표준", topic: "수익자 변경", dur: "02:58", sentiment: "보통", flags: [] },
  { name: "권태양", state: "상담 중", customer: "백종근", customerNo: "C-10299551", grade: "표준", topic: "만기 환급 안내", dur: "06:40", sentiment: "부정", alert: "만기 환급 불만 — 기대 금액 차이 설명 필요", flags: ["환급 문의"] },
  { name: "류세아", state: "상담 중", customer: "조시현", customerNo: "C-10350778", grade: "표준", topic: "보험료 납입 문의", dur: "03:48", sentiment: "보통", flags: [] },
  { name: "차도윤", state: "상담 중", customer: "윤하경", customerNo: "C-10287644", grade: "표준", topic: "청약 철회 문의", dur: "02:22", sentiment: "부정", alert: "청약 철회 — 환급·불이익 안내 정확성 주의", flags: ["철회 요청"] },
  { name: "박정우", state: "후처리", topic: "접촉이력 등록 중", dur: "01:08" },
  { name: "정유진", state: "후처리", topic: "SMS 안내 작성 중", dur: "00:36" },
  { name: "한도현", state: "대기", topic: "수신 대기" },
  { name: "양세빈", state: "대기", topic: "수신 대기" },
  { name: "오세영", state: "이석", topic: "휴식 중" },
]

const COACH_TEMPLATES = [
  "해지 시 보장 종료·재가입 제한을 먼저 고지하세요.",
  "환급률은 가입 경과 연수를 확인 후 안내하세요.",
  "정확한 금액은 조회 후 문자로 안내하세요.",
  "고객 응대 톤을 차분하게 유지해 주세요.",
]

type CoachMsg = { role: "admin" | "agent" | "system"; text: string; time: string }
const COACH_SEED: Record<string, CoachMsg[]> = {
  김제나: [
    { role: "system", text: "박관리 관리자가 모니터링을 시작했습니다.", time: "10:24" },
    { role: "admin", text: "해지환급금 문의 안내시에는 보장 종료·재가입 제한을 먼저 고지해 주세요.", time: "10:24" },
  ],
  최가람: [
    { role: "system", text: "박관리 관리자가 모니터링을 시작했습니다.", time: "13:32" },
    { role: "admin", text: "가입 경과 연수에 따라 환급률이 달라집니다. 100% 일괄 안내에 유의하세요.", time: "13:32" },
  ],
  서민아: [
    { role: "system", text: "박관리 관리자가 모니터링을 시작했습니다.", time: "09:18" },
    { role: "admin", text: "고객 불만이 큽니다. 공감 표현 후 부지급 사유를 근거와 함께 설명하세요.", time: "09:18" },
  ],
}

// 상담지식(RAG) — 데모용 지식 답변
const RAG_FAQ = ["해지환급금 산출 기준", "자동이체 변경 기준", "실손 청구 구비서류", "부지급 사유 고지 기준"]
function ragAnswer(q: string): { sources: string; text: string } {
  if (/해지|환급|해약/.test(q)) return { sources: "종신 약관 제30조 · 해지방어 가이드", text: "해지환급금 = 책임준비금 − 해지공제액. 해지 시 주계약·특약 보장이 동시 종료되며 동일 조건 재가입이 제한될 수 있어 사전 고지가 필요합니다. 경과 연수별 환급률을 반드시 확인하세요." }
  if (/자동이체|계좌|납입|카드/.test(q)) return { sources: "수금·자동이체 업무지침 제8조", text: "본인 명의 계좌 원칙이며, 출금 5영업일 전까지 신청 시 당월부터 새 계좌로 출금됩니다. 카드납 전환도 가능합니다." }
  if (/청구|서류|구비/.test(q)) return { sources: "청구 업무매뉴얼 v3.2", text: "실손 청구 기본 구비서류는 청구서·진료비계산서·세부내역서이며, 고액·특정 질환은 진단서가 추가됩니다. 실제 제출 현황은 업무정보에서 확인하세요." }
  if (/부지급|면책|지급/.test(q)) return { sources: "보험금 분쟁 예방 가이드", text: "부지급 시 약관상 면책 사유와 근거 조항을 명확히 고지하고, 고객의 이의 제기 절차(분쟁조정)도 함께 안내해야 합니다." }
  return { sources: "약관·업무 기준", text: "관련 약관·업무 기준을 확인해 정확히 안내가 필요한 사안입니다." }
}

export function RealtimeMonitoringView() {
  const searchParams = useSearchParams()
  const agent = searchParams?.get("agent")
  if (agent) return <MonitoringRoom name={agent} />
  return <MonitoringLobby />
}

function MonitoringRoom({ name }: { name: string }) {
  const router = useRouter()
  const selectedName = AGENTS.some((a) => a.name === name && a.state === "상담 중") ? name : "김제나"
  const [coachMap, setCoachMap] = useState<Record<string, CoachMsg[]>>(COACH_SEED)
  const [input, setInput] = useState("")
  const [whisper, setWhisper] = useState(true)
  const [rag, setRag] = useState<{ q: string; a: ReturnType<typeof ragAnswer> }[]>([])
  const [ragInput, setRagInput] = useState("")
  // 김민준 업무정보 패널(상담사 화면 WorkInfo 그대로)
  const [workTab, setWorkTab] = useState<"customer" | "products" | "claim">("customer")
  const [activeContract, setActiveContract] = useState("ALL")
  // 첫 입장 온보딩 가이드 — 4분할 모니터링 룸 사용 안내
  const [showGuide, setShowGuide] = useState(false)
  useEffect(() => { try { if (!localStorage.getItem("genon:guide:monitoring-room")) setShowGuide(true) } catch { /* 데모 */ } }, [])
  const closeGuide = () => { setShowGuide(false); try { localStorage.setItem("genon:guide:monitoring-room", "1") } catch { /* 데모 */ } }

  const selected = AGENTS.find((a) => a.name === selectedName) ?? AGENTS[0]
  const messages = coachMap[selectedName] ?? []

  // 모니터링 룸은 4분할로 화면이 좁아 입장 시 사이드바 자동 축소(목록 복귀 시 복원)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("genon:sidebar-collapse", { detail: { collapsed: true } }))
    return () => { window.dispatchEvent(new CustomEvent("genon:sidebar-collapse", { detail: { collapsed: false } })) }
  }, [])

  // STT — 입장 시 live(현재) 고객 발화를 최상단에 두고, 이전 대화는 위로 스크롤해야 보이게.
  // live 발화까지는 즉시 노출, 그 이후 응대만 한 줄씩 스트리밍.
  const fullTranscript = selected.transcript ?? []
  const liveIdx = fullTranscript.findIndex((l) => l.live)
  const initialShown = liveIdx < 0 ? Math.min(1, fullTranscript.length) : liveIdx + 1
  const [shown, setShown] = useState(initialShown)
  useEffect(() => {
    if (shown >= fullTranscript.length) return
    const id = setTimeout(() => setShown((s) => s + 1), 1800)
    return () => clearTimeout(id)
  }, [shown, fullTranscript.length])
  const transcript = fullTranscript.slice(0, shown)
  const streaming = shown < fullTranscript.length

  const sttScrollRef = useRef<HTMLDivElement>(null)
  const liveLineRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  // 입장 직후: live 고객 발화가 STT 영역 최상단에 오도록 스크롤(이전 대화는 위로 가림)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const c = sttScrollRef.current, el = liveLineRef.current
      if (c && el) c.scrollTop += el.getBoundingClientRect().top - c.getBoundingClientRect().top - 8
    })
    return () => cancelAnimationFrame(id)
  }, [])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }) }, [messages.length])

  const send = (text: string) => {
    if (!text.trim()) return
    setCoachMap((m) => ({ ...m, [selectedName]: [...(m[selectedName] ?? []), { role: "admin", text, time: "10:25" }] }))
    setInput("")
    // 상담사 실시간 응답 — 1초 뒤 짧은 수신 확인 멘트(랜덤)
    const replies = ["네, 알겠습니다.", "넵!", "네넵.", "확인했습니다.", "네, 바로 반영하겠습니다.", "죄송합니다, 바로 조치하겠습니다.", "네, 안내드리겠습니다."]
    const reply = replies[Math.floor(Math.random() * replies.length)]
    window.setTimeout(() => {
      setCoachMap((m) => ({ ...m, [selectedName]: [...(m[selectedName] ?? []), { role: "agent", text: reply, time: "10:25" }] }))
    }, 1000)
  }
  const askRag = (q: string) => { if (!q.trim()) return; setRag((r) => [...r, { q, a: ragAnswer(q) }]); setRagInput("") }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-[#f1f5fb]">
      {/* 헤더 + 상담사 선택 */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#dbe5f1] bg-white px-6 py-3">
        <button type="button" onClick={() => router.push("/realtime-monitoring")} className="flex items-center gap-1 rounded-lg border border-[#0f3468] bg-white px-3 py-1.5 text-[11.5px] font-bold text-[#0f3468] ring-1 ring-inset ring-[#0f3468]/25 transition-colors hover:bg-[#eef4fb]"><ChevronLeft className="h-4 w-4" /> 목록</button>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f3468]/10 text-[#0f3468]"><Activity className="h-4 w-4" /></span>
          <div className="leading-tight">
            <div className="text-[14px] font-bold text-[#10233f]">실시간 상담 모니터링</div>
            <div className="text-[10.5px] text-muted-foreground">관할 상담사 실시간 청취 · 실시간 코칭 · 박관리 관리자</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => setShowGuide(true)} title="화면 사용법 보기" className="inline-flex items-center gap-1 rounded-md border border-[#e2e8f0] bg-white px-2 py-1 text-[10px] font-semibold text-[#5b6b80] transition-colors hover:border-[#0f3468] hover:text-[#0f3468]"><HelpCircle className="h-3.5 w-3.5" />사용법</button>
          {/* 모니터링 대상 상담사 */}
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#bad6f4] bg-[#f2f8ff] px-2.5 py-1.5">
            <Headset className="h-3.5 w-3.5 text-[#0f3468]" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-[#0f3468]/60">상담사</span>
            <span className="text-[12px] font-bold text-[#10233f]">{selected.name} 상담사</span>
            <span className="ml-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> 상담 중 {selected.dur}</span>
          </span>
          {/* 응대 중 고객 (분리 표기) */}
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#dbe5f1] bg-white px-2.5 py-1.5">
            <User className="h-3.5 w-3.5 text-[#5b6b80]" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">고객</span>
            <span className="text-[12px] font-bold text-[#10233f]">{selected.customer}</span>
            <span className="font-mono text-[9.5px] text-muted-foreground">{selected.customerNo}</span>
            <span className="text-[10px] text-muted-foreground">· {selected.topic}</span>
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* 1: 실시간 STT */}
        <section className="flex min-w-0 flex-1 flex-col border-r border-[#d4e0ef] bg-white">
          <PanelHead icon={MessageSquare} title="실시간 STT">
            <span className="inline-flex items-center gap-1 rounded-sm border border-[#bad6f4] bg-[#f2f8ff] px-1.5 py-0.5 text-[10px] font-semibold text-[#0f3468]"><CircleDot className="h-3 w-3 animate-pulse fill-emerald-500 text-emerald-500" /> 청취 중</span>
          </PanelHead>
          {selected.alert ? (
            <div className="mx-3 mt-2 flex animate-pulse items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-[10.5px] text-amber-800 shadow-[0_0_0_3px_rgba(245,158,11,0.12)]">
              <span className="relative mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <Sparkles className="relative h-3.5 w-3.5 text-amber-500" />
              </span>
              <div><span className="font-bold">AI 실시간 신호</span> · {selected.alert}</div>
            </div>
          ) : null}
          <div ref={sttScrollRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-[#f7fafe] px-3 py-3">
            {transcript.length ? transcript.map((t, i) => {
              const isAgent = t.speaker === "agent"
              return (
                <div key={i} ref={i === liveIdx ? liveLineRef : undefined} className={cn("flex scroll-mt-3", i >= initialShown && "animate-in fade-in slide-in-from-bottom-1 duration-300", isAgent ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[86%] rounded-2xl px-3 py-1.5 text-[11.5px] leading-5 shadow-sm",
                    isAgent ? "rounded-tr-sm border border-[#cfe0f1] bg-[#eef4fb] text-[#27456b]" : "rounded-tl-sm border bg-white text-[#10233f]")}>
                    <div className="mb-0.5 flex items-center gap-1 text-[9px] opacity-70"><span>{isAgent ? "상담사" : "고객"}</span><span>{t.time}</span></div>
                    {t.text}
                  </div>
                </div>
              )
            }) : <div className="flex h-full items-center justify-center text-[11.5px] text-muted-foreground">실시간 상담 내용이 없습니다.</div>}
            {streaming ? <div className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> 수신 중…</div> : null}
            {/* live 발화를 최상단까지 끌어올릴 수 있도록 하단 스크롤 여백 확보 */}
            {liveIdx >= 0 ? <div aria-hidden className="min-h-full shrink-0" /> : null}
          </div>
        </section>

        {/* 2: 실시간 코칭 (실시간 STT 바로 옆) */}
        <section className="flex w-[372px] shrink-0 flex-col border-r border-[#d4e0ef] bg-white">
          <div className="flex shrink-0 items-center gap-2 bg-gradient-to-r from-[#0f3468] to-[#15457f] px-4 py-2.5 text-white">
            <Radio className="h-4 w-4" />
            <div className="leading-tight"><div className="text-[12.5px] font-bold">실시간 코칭</div><div className="text-[10px] text-white/70">{selected.name} 상담사에게 전달</div></div>
            <button type="button" onClick={() => setWhisper((v) => !v)} className="ml-auto rounded-full border border-white/30 bg-white/10 px-2 py-1 text-[9.5px] font-semibold transition-colors hover:bg-white/20">{whisper ? "🔒 귓속말(상담사만)" : "📢 전체 안내"}</button>
          </div>
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-[#f7fafe] px-3 py-3">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground"><Bot className="h-7 w-7 text-[#bad6f4]" /><p className="text-[11.5px]">상담을 청취하며 상담사에게<br />실시간 코칭을 전달하세요.</p></div>
            ) : messages.map((m, i) => {
              if (m.role === "system") return <div key={i} className="flex justify-center"><span className="rounded-full bg-[#e8eef6] px-2.5 py-1 text-[9.5px] text-muted-foreground">{m.text}</span></div>
              const admin = m.role === "admin"
              return (
                <div key={i} className={cn("flex", admin ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[88%] rounded-2xl px-3 py-2 text-[11.5px] leading-5 shadow-sm", admin ? "rounded-tr-sm bg-[#0f3468] text-white" : "rounded-tl-sm border bg-white text-[#10233f]")}>
                    <div className={cn("mb-0.5 text-[9px]", admin ? "text-white/60" : "text-muted-foreground")}>{admin ? "관리자(나)" : `${selected.name} 상담사`} · {m.time}</div>
                    {m.text}
                  </div>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>
          <div className="shrink-0 border-t bg-white px-3 py-2.5">
            <div className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground"><Sparkles className="h-2.5 w-2.5 text-[#0f3468]" /> 예상 코칭 멘트</div>
            <div className="mb-2 space-y-1">
              {COACH_TEMPLATES.map((t) => (
                <button key={t} type="button" onClick={() => send(t)} className="flex w-full items-start gap-1.5 rounded-md border border-[#dbe5f1] bg-[#f7fafe] px-2.5 py-1.5 text-left text-[10.5px] leading-4 text-[#0b4f91] transition-colors hover:border-[#0f3468] hover:bg-[#f2f8ff]">
                  <span className="mt-px text-[#0f3468]">›</span><span className="flex-1">{t}</span>
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input) } }}
                rows={2}
                placeholder="코칭 메시지를 작성하세요"
                className="max-h-28 min-h-[44px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-[12px] leading-5 outline-none focus-visible:border-[#0f3468] focus-visible:ring-1 focus-visible:ring-[#0f3468]"
              />
              <Button onClick={() => send(input)} className="h-11 shrink-0 gap-1 bg-[#0f3468] px-3 hover:bg-[#0b2547]"><Send className="h-4 w-4" /> 전송</Button>
            </div>
          </div>
        </section>

        {/* 중3: 상담지식(RAG) */}
        <section className="flex min-w-0 flex-1 flex-col border-r border-[#d4e0ef] bg-white">
          <PanelHead icon={Bot} title="상담지식 (RAG)"><span className="text-[9.5px] text-muted-foreground">약관·업무 기준</span></PanelHead>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f7fafe] px-3 py-3">
            {rag.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-2 text-center">
                <Bot className="mb-2 h-7 w-7 text-[#bad6f4]" />
                <p className="text-[11.5px] leading-5 text-muted-foreground">코칭에 필요한 약관·업무 기준을<br />검색해 정확히 안내하세요.</p>
              </div>
            ) : rag.map((m, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-end"><div className="rounded-2xl rounded-tr-sm border border-[#cfe0f1] bg-[#eef4fb] px-3 py-1.5 text-[11.5px] text-[#27456b]">{m.q}</div></div>
                <div className="rounded-2xl rounded-tl-sm border bg-white px-3 py-2 text-[11.5px] leading-5 text-[#10233f] shadow-sm">
                  {m.a.text}
                  <div className="mt-1.5 flex items-center gap-1 text-[9.5px] text-[#0b4f91]"><ShieldCheck className="h-3 w-3" /> {m.a.sources}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="shrink-0 border-t bg-white px-3 py-2.5">
            <div className="mb-2 flex flex-wrap gap-1">
              {RAG_FAQ.map((f) => <button key={f} type="button" onClick={() => askRag(f)} className="inline-flex items-center gap-1 rounded-full border border-[#dbe5f1] bg-[#f7fafe] px-2 py-0.5 text-[10px] text-[#0b4f91] transition-colors hover:border-[#0f3468] hover:bg-[#f2f8ff]"><Sparkles className="h-2.5 w-2.5" />{f}</button>)}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                <Input value={ragInput} onChange={(e) => setRagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") askRag(ragInput) }} placeholder="약관·업무 기준 검색" className="h-9 pl-8 text-[12px]" />
              </div>
              <Button onClick={() => askRag(ragInput)} className="h-9 shrink-0 bg-[#0f3468] hover:bg-[#0b2547]"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </section>

        {/* 3: 업무정보 (상담사 화면 김민준 WorkInfo 그대로) */}
        <aside className="flex w-[300px] shrink-0 flex-col border-r border-[#d4e0ef] bg-[#f1f5fb] p-3">
          <div className="min-h-0 flex-1">
            <WorkInfo activeContract={activeContract} onSelect={setActiveContract} tab={workTab} onTabChange={setWorkTab} loading={false} />
          </div>
        </aside>

      </div>

      {showGuide ? <RoomGuideOverlay onClose={closeGuide} /> : null}
    </div>
  )
}

/* ── 모니터링 로비 — 상담 채널(방) 선택 후 입장 ── */
const SENTIMENT_TONE: Record<string, { dot: string; label: string }> = {
  긍정: { dot: "bg-[#15c2a2]", label: "긍정" },
  보통: { dot: "bg-[#5b8fc9]", label: "보통" },
  부정: { dot: "bg-[#0f3468]", label: "부정" },
}
const STATE_ORDER: AgentState[] = ["상담 중", "후처리", "대기", "이석"]
// 상태 색 — 관리자 메인(AdminHome) 도넛과 동일 팔레트로 연동
const STATE_BAR: Record<AgentState, string> = {
  "상담 중": "#0f3468",
  후처리: "#5b8fc9",
  대기: "#15c2a2",
  이석: "#cbd5e1",
}
// 아바타 — 블루 계열 3종 + 어두운 회색 1종(상담사명 기반 결정적 선택)
const AVATAR_TONES = ["#2f6bb0", "#3d9be0", "#5b6675", "#5a72c9"]
// 센터/지점
const CENTERS = ["서울 · 잠실1센터", "서울 · 강남2센터", "경기 · 분당센터", "부산 · 서면센터", "대전 · 둔산센터"]
const STATE_PILL: Record<AgentState, string> = {
  "상담 중": "bg-[#e7f7f3] text-[#0c8f78]",
  후처리: "bg-[#edf3fb] text-[#3a6aa8]",
  대기: "bg-[#eef1f6] text-[#6b7888]",
  이석: "bg-[#f1f3f7] text-[#8a97a8]",
}
const toSec = (d?: string) => { if (!d) return 0; const [m, s] = d.split(":").map(Number); return (m || 0) * 60 + (s || 0) }
const fmtSec = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`
// 데모용 개인 KPI(상담사명 기반 결정적 산출)
const hashName = (s: string) => s.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
const agentKpi = (name: string) => {
  const h = hashName(name)
  return { calls: 18 + (h % 22), csat: 92 + (h % 8), aht: fmtSec(190 + (h % 130)) } // 처리 콜수 / 만족도% / 평균처리시간
}
// 데모용 상담사 프로필(근무 이력·품질·민원 전이)
const TEAMS = ["1상담파트", "2상담파트", "3상담파트", "VIP상담파트"]
const SKILLS = ["보험금", "계약·변경", "민원·VOC", "디지털·앱", "신계약"]
const EDUS = ["불완전판매 예방", "민원 응대 스킬", "개인정보보호", "해지방어 화법", "보험금 심사 이해"]
const CAMPAIGNS = ["해지방어 캠페인", "실손 청구 안내", "계약 갱신 유지", "디지털 전환 안내", "미배정"]
const agentProfile = (name: string) => {
  const h = hashName(name)
  const k = agentKpi(name)
  const years = 1 + (h % 7)
  const contractYr = 2026 + (h % 3 === 0 ? 0 : 1) // 계약 만료 연도
  return {
    ...k,
    empNo: `E${20 - years}${String(1000 + (h % 8999)).slice(0, 4)}`, // 사번(입사연차 반영)
    empType: h % 6 === 0 ? "정규직" : "계약직", // 대부분 계약직
    team: TEAMS[(h >> 2) % TEAMS.length],
    skill: SKILLS[(h >> 1) % SKILLS.length],
    joined: `${2026 - years}.${String(1 + (h % 12)).padStart(2, "0")}`,
    tenure: `${years}년 ${h % 12}개월`,
    contractEnd: `${contractYr}.${String(1 + (h % 12)).padStart(2, "0")}`, // 계약 만료
    lastEdu: `${EDUS[h % EDUS.length]} · ${String(1 + (h % 6)).padStart(2, "0")}.${String(1 + (h % 27)).padStart(2, "0")}`,
    campaign: CAMPAIGNS[(h >> 1) % CAMPAIGNS.length],
    cumCalls: 2400 + (h % 60) * 41,
    monthCalls: 380 + (h % 90),
    qualityPass: 90 + (h % 9),
    misGuide: h % 4,          // 오안내
    omission: (h >> 1) % 3,   // 안내 누락
    escalation: h % 3,        // 민원 전이
  }
}

function MonitoringLobby() {
  const router = useRouter()
  const enter = (name: string) => router.push(`/realtime-monitoring?agent=${encodeURIComponent(name)}`)
  const [filter, setFilter] = useState<"all" | AgentState>("all")
  const [center, setCenter] = useState(CENTERS[0])
  const [profileOf, setProfileOf] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"위험" | "이름">("위험")
  // 통화 경과 실시간 카운트업 (마운트 후 경과 초)
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => { const id = window.setInterval(() => setElapsed((e) => e + 1), 1000); return () => window.clearInterval(id) }, [])
  const liveDur = (a: MonAgent) => (effState(a) === "상담 중" && a.dur ? fmtSec(toSec(a.dur) + elapsed) : a.dur)
  // 상담 상태 변동 — 데모로 한 건만 전환 후 고정(상담 중 15명 유지). 대기 상담사가 후처리로 진입하는 모습만 반영
  const effState = (a: MonAgent): AgentState => (elapsed >= 5 && a.name === "한도현" ? "후처리" : a.state)
  // 카드 높이 — 쇼케이스(김제나) 카드 높이를 실측해 전체 카드에 동일 적용
  const showcaseRef = useRef<HTMLDivElement>(null)
  const [rowH, setRowH] = useState<number | undefined>(undefined)
  useEffect(() => {
    const measure = () => { if (showcaseRef.current) setRowH(showcaseRef.current.offsetHeight) }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [filter, sortBy])
  // 첫 진입 온보딩 가이드 커버 — 실제 요소를 측정해 스포트라이트
  const [showGuide, setShowGuide] = useState(false)
  useEffect(() => { try { if (!localStorage.getItem("genon:guide:monitoring")) setShowGuide(true) } catch { /* 데모 */ } }, [])
  const closeGuide = () => { setShowGuide(false); try { localStorage.setItem("genon:guide:monitoring", "1") } catch { /* 데모 */ } }
  // 쪽지 발송
  const [memoTo, setMemoTo] = useState<string | null>(null)
  const [memoText, setMemoText] = useState("")
  const [sentTo, setSentTo] = useState<string[]>([])
  const sendMemo = () => { if (memoTo && memoText.trim()) { setSentTo((s) => [...new Set([...s, memoTo])]); setMemoTo(null); setMemoText("") } }

  const counts = STATE_ORDER.map((s) => ({ state: s, n: AGENTS.filter((a) => effState(a) === s).length }))
  const total = AGENTS.length
  const active = AGENTS.filter((a) => effState(a) === "상담 중")
  const risks = active.filter((a) => a.alert)
  const durs = active.map((a) => toSec(a.dur)).filter(Boolean)
  const avgDur = durs.length ? fmtSec(durs.reduce((x, y) => x + y, 0) / durs.length) : "--:--"
  const longest = active.reduce<MonAgent | null>((m, a) => (toSec(a.dur) > toSec(m?.dur) ? a : m), null)
  const rank = (a: MonAgent) => STATE_ORDER.indexOf(effState(a))
  const SORTERS: Record<typeof sortBy, (a: MonAgent, b: MonAgent) => number> = {
    // 위험순 — 주의 신호 > 상태 > 통화시간, 동순위는 이름순
    위험: (a, b) => (b.alert ? 1 : 0) - (a.alert ? 1 : 0) || rank(a) - rank(b) || toSec(b.dur) - toSec(a.dur) || a.name.localeCompare(b.name, "ko"),
    이름: (a, b) => a.name.localeCompare(b.name, "ko"),
  }
  const sorted = [...(filter === "all" ? AGENTS : AGENTS.filter((a) => effState(a) === filter))].sort(SORTERS[sortBy])
  // 쇼케이스: 김제나 상담사를 항상 맨 앞에 고정
  const list = [...sorted.filter((a) => a.name === "김제나"), ...sorted.filter((a) => a.name !== "김제나")]
  // 상태 분포 도넛(conic-gradient)
  let acc = 0
  const donutBg = `conic-gradient(${counts.map((c) => {
    const start = (acc / total) * 360; acc += c.n; const end = (acc / total) * 360
    return `${STATE_BAR[c.state]} ${start}deg ${end}deg`
  }).join(", ")})`
  // 오늘의 운영 지표
  const kpis = AGENTS.map((a) => agentKpi(a.name))
  const handledToday = kpis.reduce((s, k) => s + k.calls, 0)
  const avgCsat = Math.round(kpis.reduce((s, k) => s + k.csat, 0) / kpis.length)
  const avgAht = fmtSec(kpis.reduce((s, k) => s + toSec(k.aht), 0) / kpis.length)
  const queue = counts.find((c) => c.state === "대기")?.n ? 6 : 6 // 데모: 응대 대기 콜
  const METRICS = [
    { label: "평균 통화", value: avgDur, mono: true },
    { label: "평균 응대", value: "00:21", mono: true },
    { label: "평균 처리(AHT)", value: avgAht, mono: true },
    { label: "오늘 처리량", value: `${handledToday}`, unit: "건" },
    { label: "평균 만족도", value: `${avgCsat}`, unit: "%" },
    { label: "응대 대기", value: `${queue}`, unit: "콜" },
  ]

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-[#f4f6fb]">
      {/* 헤더 */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#e6ebf2] bg-white px-6 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f3468]/10 text-[#0f3468]"><Activity className="h-4 w-4" /></span>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 text-[14.5px] font-bold tracking-tight text-[#10233f]">실시간 상담 모니터링 <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f7f3] px-1.5 py-0.5 text-[8.5px] font-bold text-[#0c8f78]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#15c2a2]" />LIVE</span></div>
            <div className="text-[10.5px] text-[#6b7888]">관할 상담사 실시간 현황 · 채널 선택 후 입장</div>
          </div>
        </div>
        <button type="button" onClick={() => setShowGuide(true)} title="화면 사용법 보기" className="ml-auto inline-flex items-center gap-1 rounded-md border border-[#e2e8f0] bg-white px-2 py-1 text-[10px] font-semibold text-[#5b6b80] transition-colors hover:border-[#0f3468] hover:text-[#0f3468]"><HelpCircle className="h-3.5 w-3.5" />사용법</button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* 좌: 상담사 월(그리드) */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* 필터 바 */}
          <div className="flex shrink-0 items-center gap-2 border-b border-[#e6ebf2] bg-white px-5 py-2.5">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-[#0f3468]" />
            <span className="text-[10px] font-medium text-[#9aa6b6]">담당 센터</span>
            <div className="relative flex items-center gap-1.5 rounded border border-[#e6ebf2] bg-white px-2.5 py-1 shadow-[0_1px_2px_rgba(16,35,63,0.05)] transition-colors hover:border-[#bcd0ea]">
              <span className="text-[11px] font-medium text-[#10233f]">{center}</span>
              <ChevronDown className="h-3 w-3 shrink-0 text-[#9aa6b6]" />
              <select value={center} onChange={(e) => setCenter(e.target.value)} className="absolute inset-0 cursor-pointer text-[11px] opacity-0" aria-label="담당 센터 선택">
                {CENTERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <span className="h-4 w-px bg-[#e6ebf2]" />
            <div className="flex items-center gap-0.5 rounded bg-[#eef1f6] p-0.5">
              <button type="button" onClick={() => setFilter("all")} className={cn("rounded-md px-2.5 py-1 text-[10.5px] font-semibold transition-all", filter === "all" ? "bg-white text-[#0f3468] shadow-sm" : "text-[#6b7888] hover:text-[#10233f]")}>전체 {total}</button>
              {counts.map((c) => (
                <button key={c.state} type="button" onClick={() => setFilter(c.state)} className={cn("flex items-center gap-1 rounded-md px-2.5 py-1 text-[10.5px] font-semibold transition-all", filter === c.state ? "bg-white text-[#0f3468] shadow-sm" : "text-[#6b7888] hover:text-[#10233f]")}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATE_BAR[c.state] }} /> {c.state} {c.n}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#9aa6b6]">정렬</span>
              <div className="flex items-center gap-0.5 rounded bg-[#eef1f6] p-0.5">
                {(["위험", "이름"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setSortBy(s)} className={cn("rounded-md px-2 py-1 text-[10px] font-semibold transition-all", sortBy === s ? "bg-white text-[#0f3468] shadow-sm" : "text-[#6b7888] hover:text-[#10233f]")}>{s}순</button>
                ))}
              </div>
            </div>
          </div>

          {/* 그리드 */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4">
              {list.map((a) => {
                const st = effState(a)
                const enterable = st === "상담 중"
                const sent = a.sentiment ? SENTIMENT_TONE[a.sentiment] : null
                const avatar = AVATAR_TONES[hashName(a.name) % AVATAR_TONES.length]
                const sent2 = sentTo.includes(a.name)
                return (
                  <div key={a.name}
                    ref={a.name === "김제나" ? showcaseRef : undefined}
                    style={a.name !== "김제나" && rowH ? { height: rowH } : undefined}
                    className={cn("group relative flex flex-col overflow-hidden rounded border bg-white p-3 text-left transition-all duration-150",
                      enterable
                        ? "border-[#e6ebf2] shadow-[0_1px_2px_rgba(16,35,63,0.05)] hover:border-[#bcd0ea] hover:shadow-[0_4px_14px_rgba(16,35,63,0.08)]"
                        : "border-[#edf1f6] bg-[#fafbfd]")}>
                    {/* 상단 존 — 영역 클릭 시 상담사 정보 */}
                    <div role="button" tabIndex={0} onClick={() => setProfileOf(a.name)} title={`${a.name} 상담사 정보 보기`}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setProfileOf(a.name) } }}
                      className="group/top -m-1 cursor-pointer rounded p-1 transition-colors hover:bg-[#f7fafe]">
                    {/* 헤더 */}
                    <div className="flex items-start gap-2">
                      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ background: avatar }}>
                        <Headset className="h-4 w-4" />
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-[#eef4fb] text-[7.5px] font-bold text-[#0f3468]">{a.name.slice(0, 1)}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11.5px] font-bold text-[#10233f]"><span className="underline-offset-2 transition-colors group-hover/top:text-[#0f3468] group-hover/top:underline">{a.name}</span><span className="ml-0.5 text-[9.5px] font-normal text-[#9aa6b6]">상담사</span></div>
                        <div className="mt-0.5 flex items-center gap-1 text-[9px] text-[#9aa6b6]">{a.dur ? <><Clock className="h-2.5 w-2.5" />{liveDur(a)}</> : "—"}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[8.5px] font-bold", STATE_PILL[st])}>{st}</span>
                        {a.alert ? <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-700"><span className="h-1 w-1 rounded-full bg-amber-500" />주의 필요</span> : null}
                      </div>
                    </div>
                    {/* 본문 — 현재 콜 */}
                    {enterable ? (
                      <div className="mt-2.5 border-t border-[#f0f3f7] pt-2">
                        <div className="flex items-center gap-1 text-[10px]"><User className="h-3 w-3 text-[#9aa6b6]" /><span className="font-semibold text-[#10233f]">{a.customer}</span><span className="font-mono text-[8.5px] text-[#9aa6b6]">{a.customerNo}</span>{a.grade ? <span className="ml-auto rounded bg-[#eef4fb] px-1 py-px text-[8px] font-semibold text-[#0b4f91]">{a.grade}</span> : null}</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px]"><span className="relative flex h-1.5 w-1.5 items-center justify-center"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#15c2a2] opacity-70" /><span className="relative h-1.5 w-1.5 rounded-full bg-[#15c2a2]" /></span><span className="shrink-0 text-[#9aa6b6]">현재 토픽 ·</span><span className="truncate font-semibold text-[#27456b]">{a.topic}</span></div>
                        {/* 현재 콜 핵심 지표 3 */}
                        <div className="mt-2 grid grid-cols-3 gap-1 rounded bg-[#f6f8fc] px-2 py-1.5 text-center">
                          <div><div className="font-mono text-[11px] font-bold tabular-nums text-[#10233f]">{liveDur(a)}</div><div className="text-[8px] text-[#9aa6b6]">통화 경과</div></div>
                          <div className="border-x border-[#e6ebf2]"><div className="flex items-center justify-center gap-0.5 text-[11px] font-bold text-[#10233f]">{sent ? <span className={cn("h-1.5 w-1.5 rounded-full", sent.dot)} /> : null}{sent?.label ?? "-"}</div><div className="text-[8px] text-[#9aa6b6]">고객 감정</div></div>
                          <div><div className={cn("text-[11px] font-bold", a.alert ? "text-amber-600" : "text-[#0c8f78]")}>{a.alert ? "주의" : "정상"}</div><div className="text-[8px] text-[#9aa6b6]">위험도</div></div>
                        </div>
                        {a.flags?.length ? <div className="mt-1 flex flex-wrap gap-1">{a.flags.map((f) => <span key={f} className="rounded bg-[#eef4fb] px-1.5 py-0.5 text-[8.5px] text-[#0b4f91]">{f}</span>)}</div> : null}
                      </div>
                    ) : (
                      <div className="mt-2.5 border-t border-[#f0f3f7] pt-2">
                        <div className="truncate text-[10px] text-[#9aa6b6]">{a.topic ?? "—"}</div>
                        <div className="mt-2 inline-flex items-center gap-1 rounded bg-[#f3f5f9] px-1.5 py-0.5 text-[9px] font-medium text-[#9aa6b6]">진행 중인 콜 없음</div>
                      </div>
                    )}
                    </div>
                    {/* 푸터(하단 존) — 호버 시 입장 버튼 강조 */}
                    <div className="group/bottom mt-auto flex items-center gap-1.5 pt-2.5">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setMemoText(""); setMemoTo(a.name) }}
                        className={cn("flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[9.5px] font-bold transition-colors",
                          sent2 ? "border-[#cfe4dd] bg-[#f0fbf8] text-[#0c8f78]" : "border-[#e2e8f0] bg-white text-[#5b6b80] hover:border-[#0f3468] hover:text-[#0f3468]")}>
                        {sent2 ? <><Check className="h-3 w-3" /> 발송됨</> : <><Mail className="h-3 w-3" /> 쪽지</>}
                      </button>
                      {enterable ? (
                        <button type="button" onClick={(e) => { e.stopPropagation(); enter(a.name) }}
                          className="flex flex-1 items-center justify-center gap-0.5 rounded-md border border-[#dbe7f4] bg-[#f5f9fe] px-2 py-1 text-[9.5px] font-bold text-[#0f3468] transition-colors group-hover/bottom:border-[#0f3468] group-hover/bottom:bg-[#0f3468] group-hover/bottom:text-white">입장 <ChevronRight className="h-3 w-3" /></button>
                      ) : (
                        <span className="flex flex-1 items-center justify-center rounded-md border border-dashed border-[#e6ebf2] px-2 py-1 text-[9px] font-medium text-[#b3bdca]">입장 불가</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 우: 실시간 현황 패널 */}
        <aside className="flex w-[284px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-[#e6ebf2] bg-white px-4 py-5">
          {/* 상태 분포 — 도넛 */}
          <div>
            <div className="mb-3 text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#9aa6b6]">상담사 상태 분포</div>
            <div className="flex items-center gap-3.5">
              <div className="relative h-[104px] w-[104px] shrink-0">
                <div className="h-full w-full rounded-full" style={{ background: donutBg }} />
                <div className="absolute inset-[15px] flex flex-col items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_1px_#eef1f6]">
                  <div className="text-[22px] font-bold leading-none tabular-nums text-[#10233f]">{total}</div>
                  <div className="mt-0.5 text-[8.5px] font-medium text-[#9aa6b6]">상담사</div>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                {counts.map((c) => (
                  <button key={c.state} type="button" onClick={() => setFilter(filter === c.state ? "all" : c.state)} className={cn("flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors", filter === c.state ? "bg-[#eef4fb]" : "hover:bg-[#f6f8fc]")}>
                    <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: STATE_BAR[c.state] }} />
                    <span className="truncate text-[10.5px] text-[#445268]">{c.state}</span>
                    <span className="ml-auto text-[11px] font-bold tabular-nums text-[#10233f]">{c.n}</span>
                    <span className="w-7 text-right text-[9px] tabular-nums text-[#9aa6b6]">{Math.round((c.n / total) * 100)}%</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 오늘의 운영 지표 — 1시간 단위 집계 */}
          <div>
            <div className="mb-2 flex items-center gap-1.5"><span className="text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#9aa6b6]">오늘의 운영 지표</span><span className="text-[8.5px] font-medium tabular-nums text-[#6b7888]">2026.06.26 (금)</span><span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#eef1f6] px-1.5 py-0.5 text-[8px] font-medium text-[#6b7888]"><Clock className="h-2.5 w-2.5" />1시간 단위 갱신</span></div>
            <div className="grid grid-cols-2 gap-2">
              {METRICS.map((m) => (
                <div key={m.label} className="rounded border border-[#e6ebf2] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(16,35,63,0.04)]">
                  <div className="text-[8.5px] font-semibold uppercase tracking-[0.06em] text-[#9aa6b6]">{m.label}</div>
                  <div className={cn("mt-1 text-[16px] font-bold leading-none text-[#10233f]", m.mono ? "font-mono" : "tabular-nums")}>{m.value}{m.unit ? <span className="ml-0.5 text-[10px] font-semibold text-[#9aa6b6]">{m.unit}</span> : null}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between rounded border border-[#e6ebf2] bg-white px-3 py-2 shadow-[0_1px_2px_rgba(16,35,63,0.04)]">
              <span className="text-[8.5px] font-semibold uppercase tracking-[0.06em] text-[#9aa6b6]">최장 통화</span>
              <span className="font-mono text-[12px] font-bold text-[#10233f]">{longest?.dur ?? "--:--"} <span className="font-sans text-[9px] font-medium text-[#9aa6b6]">· {longest?.name ?? "-"}</span></span>
            </div>
          </div>

          {/* AI 위험 신호 */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-1 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /><span className="text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#9aa6b6]">AI 위험 신호</span>
              <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-amber-700">{risks.length}</span>
            </div>
            <p className="mb-2 text-[8.5px] leading-[1.5] text-[#9aa6b6]">통화 중 부정 발화·응대 시간·상담 난이도와 고객의 민원 이력·만족도 추이를 가중 합산해 실시간 위험도를 산출합니다.</p>
            <div className="space-y-1.5">
              {risks.length ? risks.map((a) => (
                <button key={a.name} type="button" onClick={() => enter(a.name)} className="group flex w-full items-start gap-2 rounded border border-[#e6ebf2] bg-white px-2.5 py-2 text-left shadow-[0_1px_2px_rgba(16,35,63,0.04)] transition-all hover:border-amber-300 hover:bg-amber-50/60">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1"><span className="text-[11px] font-bold text-[#10233f]">{a.name}</span><span className="text-[9.5px] text-[#9aa6b6]">· {a.customer}</span></div>
                    <div className="mt-0.5 line-clamp-2 text-[9.5px] leading-3.5 text-[#7a6a55]">{a.alert}</div>
                  </div>
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c9b896] transition-transform group-hover:translate-x-0.5" />
                </button>
              )) : <div className="rounded border border-dashed border-[#e6ebf2] px-2.5 py-4 text-center text-[10px] text-[#9aa6b6]">감지된 위험 신호 없음</div>}
            </div>
          </div>
        </aside>
      </div>

      {/* 쪽지 발송 모달 */}
      {memoTo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10233f]/40 p-4" onClick={() => setMemoTo(null)}>
          <div className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-[#e6ebf2] px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0f3468]/[0.08] text-[#0f3468]"><Mail className="h-3.5 w-3.5" /></span>
              <div className="leading-tight">
                <div className="text-[12.5px] font-bold text-[#10233f]">쪽지 발송</div>
                <div className="text-[10px] text-[#9aa6b6]">{memoTo} 상담사에게 전송</div>
              </div>
              <button type="button" onClick={() => setMemoTo(null)} className="ml-auto rounded-md p-1 text-[#9aa6b6] hover:bg-[#f1f3f7] hover:text-[#10233f]"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-4 py-3">
              <div className="mb-1.5 flex flex-wrap gap-1">
                {["응대 톤 차분하게 유지해 주세요.", "통화 종료 후 검수 요청 바랍니다.", "휴식 후 대기 상태로 전환 부탁드립니다."].map((q) => (
                  <button key={q} type="button" onClick={() => setMemoText(q)} className="rounded-full border border-[#e2e8f0] bg-[#f7fafe] px-2 py-0.5 text-[9.5px] text-[#0b4f91] transition-colors hover:border-[#0f3468]">{q}</button>
                ))}
              </div>
              <textarea value={memoText} onChange={(e) => setMemoText(e.target.value)} rows={3} placeholder="전달할 쪽지 내용을 입력하세요" autoFocus
                className="w-full resize-none rounded-lg border border-[#e2e8f0] px-3 py-2 text-[12px] leading-5 outline-none focus-visible:border-[#0f3468] focus-visible:ring-1 focus-visible:ring-[#0f3468]" />
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e6ebf2] px-4 py-3">
              <button type="button" onClick={() => setMemoTo(null)} className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#5b6b80] hover:bg-[#f7fafe]">취소</button>
              <button type="button" onClick={sendMemo} disabled={!memoText.trim()} className="flex items-center gap-1 rounded-lg bg-[#0f3468] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#0b2547] disabled:opacity-40"><Send className="h-3.5 w-3.5" /> 발송</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 상담사 프로필 모달 */}
      {profileOf ? (() => {
        const p = agentProfile(profileOf)
        const a = AGENTS.find((x) => x.name === profileOf)
        const avatar = AVATAR_TONES[hashName(profileOf) % AVATAR_TONES.length]
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10233f]/40 p-4" onClick={() => setProfileOf(null)}>
            <div className="w-full max-w-[400px] overflow-hidden rounded-md bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* 헤더 */}
              <div className="flex items-center gap-3 border-b border-[#e6ebf2] px-5 py-4">
                <span className="relative flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: avatar }}>
                  <Headset className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-[#eef4fb] text-[8px] font-bold text-[#0f3468]">{profileOf.slice(0, 1)}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold text-[#10233f]">{profileOf} <span className="text-[10px] font-normal text-[#9aa6b6]">상담사 · {p.empType}</span></div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#9aa6b6]"><Building2 className="h-3 w-3" />{center} · {p.team}</div>
                </div>
                {a ? <span className={cn("rounded-sm px-2 py-0.5 text-[9px] font-bold", STATE_PILL[a.state])}>{a.state}</span> : null}
                <button type="button" onClick={() => setProfileOf(null)} className="rounded-sm p-1 text-[#9aa6b6] hover:bg-[#f1f3f7] hover:text-[#10233f]"><X className="h-4 w-4" /></button>
              </div>

              <div className="space-y-4 px-5 py-4">
                {/* 인사 정보 */}
                <div className="grid grid-cols-3 gap-2">
                  {[["사번", p.empNo], ["입사", p.joined], ["계약 만료", p.contractEnd]].map(([l, v]) => (
                    <div key={l} className="rounded-sm bg-[#f6f8fc] px-3 py-2 text-center"><div className="text-[8px] font-semibold uppercase tracking-[0.06em] text-[#9aa6b6]">{l}</div><div className="mt-0.5 truncate text-[11px] font-bold text-[#10233f]">{v}</div></div>
                  ))}
                </div>

                {/* 금일 성과 */}
                <div>
                  <div className="mb-2 text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#9aa6b6]">금일 성과</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-sm border border-[#e6ebf2] px-3 py-2.5 text-center"><div className="text-[17px] font-bold tabular-nums text-[#10233f]">{p.calls}</div><div className="text-[8.5px] text-[#9aa6b6]">오늘 콜</div></div>
                    <div className="rounded-sm border border-[#e6ebf2] px-3 py-2.5 text-center"><div className="font-mono text-[17px] font-bold text-[#10233f]">{p.aht}</div><div className="text-[8.5px] text-[#9aa6b6]">AHT</div></div>
                    <div className="rounded-sm border border-[#e6ebf2] px-3 py-2.5 text-center"><div className="text-[17px] font-bold tabular-nums text-[#10233f]">{p.csat}%</div><div className="text-[8.5px] text-[#9aa6b6]">만족도</div></div>
                  </div>
                </div>

                {/* 근무 이력 */}
                <div>
                  <div className="mb-2 text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#9aa6b6]">근무 이력</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center justify-between rounded-sm bg-[#f6f8fc] px-3 py-2"><span className="text-[#6b7888]">이번 달 응대</span><span className="font-bold tabular-nums text-[#10233f]">{p.monthCalls}건</span></div>
                    <div className="flex items-center justify-between rounded-sm bg-[#f6f8fc] px-3 py-2"><span className="text-[#6b7888]">누적 응대</span><span className="font-bold tabular-nums text-[#10233f]">{p.cumCalls.toLocaleString()}건</span></div>
                    <div className="flex items-center justify-between rounded-sm bg-[#f6f8fc] px-3 py-2"><span className="text-[#6b7888]">품질 검수 통과율</span><span className="font-bold tabular-nums text-[#10233f]">{p.qualityPass}%</span></div>
                    <div className="flex items-center justify-between rounded-sm bg-[#f6f8fc] px-3 py-2"><span className="text-[#6b7888]">담당 콜 유형</span><span className="font-bold text-[#10233f]">{p.skill}</span></div>
                  </div>
                </div>

                {/* 교육 · 캠페인 */}
                <div>
                  <div className="mb-2 text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#9aa6b6]">교육 · 캠페인</div>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between rounded-sm bg-[#f6f8fc] px-3 py-2"><span className="shrink-0 text-[#6b7888]">최근 교육 이수</span><span className="ml-3 truncate font-bold text-[#10233f]">{p.lastEdu}</span></div>
                    <div className="flex items-center justify-between rounded-sm bg-[#f6f8fc] px-3 py-2"><span className="shrink-0 text-[#6b7888]">배정 캠페인</span><span className="ml-3 truncate font-bold text-[#10233f]">{p.campaign}</span></div>
                  </div>
                </div>

                {/* 품질·민원 이력 (최근 90일) — 명암으로 표기 */}
                <div>
                  <div className="mb-2 text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#9aa6b6]">품질·민원 이력 <span className="font-normal normal-case tracking-normal">(최근 90일)</span></div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "오안내", n: p.misGuide },
                      { label: "안내 누락", n: p.omission },
                      { label: "민원 전이", n: p.escalation },
                    ].map((m) => (
                      <div key={m.label} className={cn("rounded-sm border px-3 py-2.5 text-center", m.n > 0 ? "border-[#cbd5e1] bg-[#eef1f6]" : "border-[#e6ebf2] bg-white")}>
                        <div className={cn("text-[17px] font-bold tabular-nums", m.n > 0 ? "text-[#0f3468]" : "text-[#c2cad6]")}>{m.n}</div>
                        <div className="text-[8.5px] text-[#9aa6b6]">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#e6ebf2] px-5 py-3">
                <button type="button" onClick={() => { setMemoText(""); setMemoTo(profileOf); setProfileOf(null) }} className="flex items-center gap-1 rounded-sm border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#5b6b80] hover:border-[#0f3468] hover:text-[#0f3468]"><Mail className="h-3.5 w-3.5" /> 쪽지</button>
                {a?.state === "상담 중" ? <button type="button" onClick={() => enter(profileOf)} className="flex items-center gap-1 rounded-sm bg-[#0f3468] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#0b2547]">모니터링 입장 <ChevronRight className="h-3.5 w-3.5" /></button> : null}
              </div>
            </div>
          </div>
        )
      })() : null}

      {showGuide ? <GuideOverlay onClose={closeGuide} /> : null}
    </div>
  )
}

function PanelHead({ icon: Icon, title, children }: { icon: typeof Headset; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex h-10 shrink-0 items-center gap-1.5 border-b bg-gradient-to-r from-[#f2f8ff] to-white px-3">
      <Icon className="h-3.5 w-3.5 text-[#0f3468]" />
      <span className="text-[12px] font-bold text-[#10233f]">{title}</span>
      {children ? <span className="ml-auto">{children}</span> : null}
    </div>
  )
}

/* ===================== 첫 진입 온보딩 가이드 커버 (코치마크) ===================== */
function SketchArrow({ dir, className }: { dir: "up" | "down" | "left" | "right"; className?: string }) {
  const rot = { up: -90, right: 0, down: 90, left: 180 }[dir]
  return (
    <svg viewBox="0 0 40 24" className={className} fill="none" style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M3 12 H29" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.5 5" />
      <path d="M23 5 L31 12 L23 19" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function GuideNote({ n, title, desc, dir, wide }: { n: number; title: string; desc: string; dir: "up" | "down"; wide?: boolean }) {
  return (
    <div className={cn("relative", wide ? "w-[252px]" : "w-[190px]")}>
      {dir === "up" ? <SketchArrow dir="up" className="absolute -top-[26px] left-7 h-6 w-6 drop-shadow" /> : null}
      <div className="-rotate-[0.6deg] rounded-[10px] border-2 border-dashed border-white/90 bg-white px-3 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.32)]">
        <div className="flex items-center gap-1.5"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0f3468] text-[9px] font-bold text-white">{n}</span><span className="text-[11px] font-bold text-[#10233f]">{title}</span></div>
        <p className="mt-1 text-[10px] leading-[1.5] text-[#5b6b80]">{desc}</p>
      </div>
      {dir === "down" ? <SketchArrow dir="down" className="absolute -bottom-[26px] right-7 h-6 w-6 drop-shadow" /> : null}
    </div>
  )
}
function GuideOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50">
      <div className="absolute inset-0 bg-[#0a1f3c]/65 backdrop-blur-[1.5px]" onClick={onClose} />
      {/* 타이틀 */}
      <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[15px] font-bold text-white ring-1 ring-white/25 backdrop-blur"><Sparkles className="h-4 w-4 text-[#7fe3ce]" />실시간 상담 모니터링 사용 안내</div>
        <div className="mt-1 text-[11px] text-white/70">주요 기능을 빠르게 살펴보세요</div>
      </div>
      {/* 화면 미러 — 영역별 코치마크 */}
      <div className="pointer-events-none flex h-full flex-col">
        <div className="shrink-0" style={{ height: 98 }} />
        <div className="flex min-h-0 flex-1">
          <div className="relative flex-1">
            <div className="absolute left-4 top-3"><GuideNote n={1} dir="up" title="센터 · 필터 · 정렬" desc="담당 센터를 고르고, 상태 필터와 위험·이름 정렬로 현황을 추립니다." /></div>
            <div className="absolute left-1/2 top-[150px] -translate-x-1/2"><GuideNote n={2} wide dir="up" title="상담사 카드" desc="카드를 누르면 상담사 정보, [입장] 버튼으로 실시간 통화 코칭 화면에 들어갑니다." /></div>
          </div>
          <div className="relative w-[284px]">
            <div className="absolute right-3 top-[136px]"><GuideNote n={3} dir="up" title="상태 분포" desc="도넛과 항목을 클릭해 상태별로 필터링합니다." /></div>
            <div className="absolute bottom-5 right-3"><GuideNote n={4} dir="down" title="AI 위험 신호" desc="주의가 필요한 상담을 먼저 확인하고 쪽지로 코칭하세요." /></div>
          </div>
        </div>
      </div>
      {/* 시작 버튼 */}
      <button type="button" onClick={onClose} className="absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[12px] font-bold text-[#0f3468] shadow-2xl transition-colors hover:bg-[#eef4fb]">둘러봤어요 · 시작하기 <ChevronRight className="h-4 w-4" /></button>
    </div>
  )
}

/* ── 모니터링 룸(입장 화면) 온보딩 가이드 — 4분할 패널 코치마크 ── */
function RoomGuideOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50">
      <div className="absolute inset-0 bg-[#0a1f3c]/65 backdrop-blur-[1.5px]" onClick={onClose} />
      {/* 타이틀 */}
      <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[15px] font-bold text-white ring-1 ring-white/25 backdrop-blur"><Sparkles className="h-4 w-4 text-[#7fe3ce]" />실시간 청취·코칭 화면 사용 안내</div>
        <div className="mt-1 text-[11px] text-white/70">상담을 청취하며 상담사를 실시간으로 코칭하세요</div>
      </div>
      {/* 화면 미러 — 4분할 패널별 코치마크 */}
      <div className="pointer-events-none flex h-full flex-col">
        <div className="shrink-0" style={{ height: 72 }} />
        <div className="flex min-h-0 flex-1">
          {/* 1: 실시간 STT */}
          <div className="relative flex-1"><div className="absolute left-1/2 top-3 -translate-x-1/2"><GuideNote n={1} dir="up" title="실시간 STT" desc="상담사·고객 통화 내용이 실시간 텍스트로. AI 위험 신호가 상단에 함께 표시됩니다." /></div></div>
          {/* 2: 실시간 코칭 */}
          <div className="relative w-[372px]"><div className="absolute left-1/2 top-3 -translate-x-1/2"><GuideNote n={2} dir="up" title="실시간 코칭" desc="예상 멘트를 고르거나 직접 작성해 상담사에게 전송. 귓속말(상담사만)·전체 안내를 선택합니다." /></div></div>
          {/* 3: 상담지식(RAG) */}
          <div className="relative flex-1"><div className="absolute left-1/2 top-3 -translate-x-1/2"><GuideNote n={3} dir="up" title="상담지식 (RAG)" desc="약관·업무 기준을 검색해 정확한 근거로 코칭합니다." /></div></div>
          {/* 4: 업무정보 */}
          <div className="relative w-[300px]"><div className="absolute right-3 top-3"><GuideNote n={4} dir="up" title="고객 업무정보" desc="응대 중 고객의 계약·청구 정보를 확인하며 상황을 파악합니다." /></div></div>
        </div>
      </div>
      {/* 시작 버튼 */}
      <button type="button" onClick={onClose} className="absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[12px] font-bold text-[#0f3468] shadow-2xl transition-colors hover:bg-[#eef4fb]">둘러봤어요 · 시작하기 <ChevronRight className="h-4 w-4" /></button>
    </div>
  )
}


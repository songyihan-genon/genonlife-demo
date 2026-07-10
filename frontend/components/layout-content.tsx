"use client"

import { Suspense, useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Sidebar } from "@/components/sidebar"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronDown, Headphones, PhoneIncoming, Settings, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { resetDemoFollowupOnce } from "@/lib/demo-session"

interface LayoutContentProps {
  children: React.ReactNode
}

export function LayoutContent({ children }: LayoutContentProps) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isCounseling = pathname === "/insight-chat" && searchParams?.get("feature") === "counseling"
  const isPublicPage = pathname === "/" || pathname.startsWith("/auth/callback")
  const isStandalonePage = pathname === "/login"
  const isPostConsult = pathname === "/post-consultation"
  const isMonitoring = pathname === "/realtime-monitoring"
  const [showThemePanel, setShowThemePanel] = useState(false)
  const [agentStatus, setAgentStatus] = useState<"통화 대기" | "이석" | "후처리 중">("통화 대기")
  const [callEnded, setCallEnded] = useState(false)
  const [callConnected, setCallConnected] = useState(false) // 상담 화면에서 실제 통화 연결 여부(대기/인입 중=false)
  // 로그인 역할 — 관리자는 상단 상태 밴드(상담사용) 미표시
  const [role, setRole] = useState<"agent" | "admin">("agent")
  useEffect(() => { try { const r = localStorage.getItem("genon:role"); if (r === "admin" || r === "agent") setRole(r) } catch { /* 데모 */ } }, [pathname])

  // 데모 세션: 새로고침당 1회 후속처리 baseline 초기화 (앱 진입점 — 어떤 후속처리보다 먼저 실행, DEMO_SPEC §7)
  useEffect(() => { resetDemoFollowupOnce() }, [])

  // 화면 전환에 따라 내 상태 자동 반영: 접촉이력 등록·SMS 안내(후처리) 화면 → 후처리 중, 그 외 → 통화 대기
  useEffect(() => {
    if (isCounseling) {
      setCallEnded(false)
      setCallConnected(false) // 상담 화면 진입 초기엔 대기(콜 연결 이벤트 수신 전)
      setAgentStatus("통화 대기")
    } else if (isPostConsult) {
      setAgentStatus("후처리 중")
    } else {
      setAgentStatus("통화 대기")
    }
  }, [pathname, isCounseling, isPostConsult])

  // 실시간 상담 화면에서 통화가 종료되면 자동으로 통화 대기로 전환
  useEffect(() => {
    const onCallStatus = (e: Event) => {
      const detail = (e as CustomEvent<{ ended?: boolean; connected?: boolean }>).detail
      setCallEnded(!!detail?.ended)
      setCallConnected(!!detail?.connected)
      if (detail?.ended) setAgentStatus("통화 대기")
    }
    window.addEventListener("genon:call-status", onCallStatus)
    return () => window.removeEventListener("genon:call-status", onCallStatus)
  }, [])

  if (isStandalonePage || (isPublicPage && !isAuthenticated)) {
    return <div className="h-screen bg-background text-foreground">{children}</div>
  }

  // 데모: 현재 로그인 상담사는 김제나로 고정 표시

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f4f7fb] text-foreground">
      {role === "admin" ? null : (
      <header className="flex h-10 shrink-0 items-center justify-between gap-3 bg-[#252c35] px-4 text-white shadow-sm">
        {/* 좌: 긴급공지 — subtle */}
        <Link href="/post-consultation" className="hidden items-center gap-1.5 text-[10px] text-white/60 transition-colors hover:text-white sm:flex">
          <span className="rounded border border-white/25 px-1.5 py-0.5 text-[9px] font-semibold text-white/80">긴급공지</span>
          <span>실손 청구 구비서류 기준 개정</span>
        </Link>

        {/* 우: 내 상태 */}
        <div className="flex shrink-0 items-center gap-1">
          <span className="hidden text-[9.5px] font-medium text-white/45 sm:inline">내 상태</span>
          {isMonitoring ? (
            <span className="flex items-center gap-1 rounded-full border border-[#1a4f8f] bg-[#0f3468] px-2 py-0.5 text-[10px] font-medium text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> 모니터링 중
            </span>
          ) : (["통화 대기", "이석", "후처리 중"] as const).map((s) => {
            // 상담 화면에서 실제 통화 연결(connected)일 때만 '통화 중', 대기/인입 중이면 '통화 대기'
            const inCall = s === "통화 대기" && isCounseling && callConnected && !callEnded
            const label = inCall ? "통화 중" : s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setAgentStatus(s)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                  agentStatus === s ? "border-[#1a4f8f] bg-[#0f3468] text-white" : "border-white/20 bg-white/5 text-white/65 hover:bg-white/15",
                )}
              >
                {s === "통화 대기" ? <span className={cn("h-1.5 w-1.5 rounded-full", inCall ? "bg-emerald-400" : "bg-slate-400")} /> : null}
                {label}
              </button>
            )
          })}
        </div>
      </header>
      )}

      <div className="flex min-h-0 flex-1">
        <Suspense fallback={<div>Loading...</div>}>
          <Sidebar />
        </Suspense>
        <main className="flex-1 overflow-y-auto bg-[#f7f9fc] text-foreground">{children}</main>
      </div>

      {showThemePanel ? (
        <div className="fixed inset-y-0 right-0 z-50 w-[280px] border-l border-[#c4cfdd] bg-white shadow-2xl">
          <div className="flex h-12 items-center justify-between border-b bg-[#f7f9fc] px-4">
            <div className="flex items-center gap-2 font-semibold text-[#10233f]">
              <Settings className="h-4 w-4 text-primary" />
              테마 설정
            </div>
            <button
              type="button"
              onClick={() => setShowThemePanel(false)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="테마 설정 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-6 p-4 text-sm">
            <div>
              <p className="mb-3 font-semibold">테마 컬러</p>
              <div className="grid grid-cols-8 gap-2">
                {["#005bac", "#0b2f5b", "#006fba", "#00a3e0", "#26b7ff", "#ff8a00", "#d64545", "#20242a"].map(
                  (color, index) => (
                    <div
                      key={color}
                      className="flex h-7 w-7 items-center justify-center rounded border"
                      style={{ backgroundColor: color }}
                    >
                      {index === 0 ? <Check className="h-4 w-4 text-white" /> : null}
                    </div>
                  ),
                )}
              </div>
            </div>
            <div>
              <p className="mb-3 font-semibold">포인트 컬러</p>
              <div className="grid grid-cols-8 gap-2">
                {["#009de0", "#1d74d8", "#1a91c9", "#00a3e0", "#ff9f1a", "#ef6f6c", "#b248d4", "#6b7280"].map(
                  (color, index) => (
                    <div
                      key={color}
                      className="flex h-7 w-7 items-center justify-center rounded border"
                      style={{ backgroundColor: color }}
                    >
                      {index === 3 ? <Check className="h-4 w-4 text-white" /> : null}
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="rounded-lg border bg-[#f7f9fc] p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold">폰트 사이즈</span>
                <div className="flex items-center rounded border bg-white">
                  <button className="px-2 py-1 text-muted-foreground" type="button">-</button>
                  <span className="border-x px-3 py-1">13</span>
                  <button className="px-2 py-1 text-muted-foreground" type="button">+</button>
                </div>
              </div>
              <ThemeToggle showLabel className="border bg-white hover:bg-[#edf6ff]" />
            </div>
            <Button
              type="button"
              onClick={() => setShowThemePanel(false)}
              className="w-full rounded-full bg-[#0b4f91] text-white hover:bg-[#083b70]"
            >
              테마 적용
              <ChevronDown className="ml-2 h-4 w-4 rotate-180" />
            </Button>
          </div>
        </div>
      ) : null}

      <IncomingCallBanner />
    </div>
  )
}

// 전역 인입 콜 배너 — 상담 이력 조회 화면에서만 콜 인입 시 표시(후처리 작업 중엔 미표시)
function IncomingCallBanner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  // 로그인 역할 — 관리자 계정에는 콜 인입 배너를 띄우지 않음(상담사 전용)
  const [role, setRole] = useState<"agent" | "admin">("agent")
  useEffect(() => {
    try { if (localStorage.getItem("genon:role") === "admin") setRole("admin") } catch { /* 데모 */ }
  }, [])
  // 상담사 계정 + 상담 이력 조회(/post-consultation, task 없음)에서만 — 후처리 작업(task=sms|contact|audit) 중엔 방해 X
  const eligible = role === "agent" && pathname === "/post-consultation" && !searchParams?.get("task")

  useEffect(() => {
    if (!eligible) {
      setShow(false)
      return
    }
    setDismissed(false)
    setShow(false)
    const t = window.setTimeout(() => setShow(true), 7000)
    return () => window.clearTimeout(t)
  }, [eligible])

  if (!eligible || !show || dismissed) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[300px] rounded-xl border border-[#cdddef] bg-white p-3 shadow-2xl duration-300 animate-in fade-in slide-in-from-bottom-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#005bac] text-white">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#005bac]/40" />
          <PhoneIncoming className="relative h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-[12.5px] font-bold text-[#10233f]">고객 콜 인입</div>
          <div className="truncate text-[10.5px] text-muted-foreground">유나래 · C-10620455 · IB</div>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-[#bad6f4] bg-[#f2f8ff] px-1.5 py-0.5 text-[9px] font-medium text-[#0b4f91]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#005bac]" /> 인입 중
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px]">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">첫 상담</span>
        <span className="text-muted-foreground">기존 계약 고객 · 상담 이력 없음</span>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        <Button size="sm" variant="outline" className="flex-1 hover:bg-muted hover:text-foreground" onClick={() => setDismissed(true)}>나중에</Button>
        <Button
          size="sm"
          className="flex-1 animate-pulse bg-[#005bac] hover:bg-[#084780]"
          onClick={() => {
            setShow(false)
            router.push("/insight-chat?agent=assistant&feature=counseling")
          }}
        >
          <Headphones className="mr-1 h-3.5 w-3.5" /> 통화 받기
        </Button>
      </div>
    </div>
  )
}

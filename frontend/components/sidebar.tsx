"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Activity,
  Siren,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  LogOut,
  Home,
  FileText,
  Headset,
  ShieldCheck,
  Briefcase,
  BotMessageSquare,
  ClipboardCheck,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    "실시간 고객 상담": true,
    "상담 품질 검수": true,
  })
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  // 로그인 계정 역할(상담사/관리자) — 좌측 패널 항목 분기
  const [role, setRole] = useState<"agent" | "admin">("agent")
  useEffect(() => {
    try {
      const r = localStorage.getItem("genon:role")
      if (r === "admin" || r === "agent") setRole(r)
    } catch {
      /* noop */
    }
  }, [])
  const pathname = usePathname()

  // 상담 상세 등 특정 화면에서 사이드바 자동 축소/복원 요청 수신
  useEffect(() => {
    const onCollapse = (e: Event) => setIsCollapsed(!!(e as CustomEvent<{ collapsed?: boolean }>).detail?.collapsed)
    window.addEventListener("genon:sidebar-collapse", onCollapse)
    return () => window.removeEventListener("genon:sidebar-collapse", onCollapse)
  }, [])
  // 화면(경로) 전환 시 축소 상태 초기화 — 축소가 필요한 화면은 진입 시 다시 collapse 이벤트를 보냄(상태 잔존 방지)
  useEffect(() => { setIsCollapsed(false) }, [pathname])
  const searchParams = useSearchParams()
  const { logout } = useAuth()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showUserMenu])

  const agent = searchParams?.get("agent")
  const feature = searchParams?.get("feature")
  const task = searchParams?.get("task")
  const caseParam = searchParams?.get("case")

  const serviceSections = [
    ...(role === "admin"
      ? [
          {
            title: "플랫폼 홈",
            titleIcon: Home,
            items: [
              { name: "AI 상담 홈", href: "/main", icon: BotMessageSquare, isActive: pathname === "/main" },
            ],
          },
          {
            title: "콜상담 운영 관리",
            titleIcon: Activity,
            items: [
              { name: "실시간 상담 모니터링", href: "/realtime-monitoring", icon: Activity, isActive: pathname === "/realtime-monitoring" },
              {
                name: "상담 품질 검수",
                href: "/post-consultation",
                icon: ClipboardCheck,
                isActive: pathname === "/post-consultation" && !task,
                children: [
                  { name: "상담 검수 결과", href: "/post-consultation?task=audit-result", isActive: pathname === "/post-consultation" && task === "audit-result" },
                ],
              },
            ],
          },
          {
            title: "VoC 통합 관리",
            titleIcon: Siren,
            items: [
              { name: "VoC 애널리틱스", href: "/voc-console", icon: BotMessageSquare, isActive: pathname === "/voc-console" },
              { name: "민원 탐지·이관", href: "/complaint-detection", icon: Siren, isActive: pathname === "/complaint-detection" },
              { name: "대외민원 처리", href: "/external-complaint", icon: FileText, isActive: pathname === "/external-complaint" },
            ],
          },
        ]
      : [
          {
            title: "플랫폼 홈",
            titleIcon: Home,
            items: [
              { name: "AI 상담 홈", href: "/main", icon: BotMessageSquare, isActive: pathname === "/main" },
              {
                name: "실시간 고객 상담",
                href: "/insight-chat?agent=assistant&feature=counseling",
                icon: Headset,
                isActive: pathname === "/insight-chat" && (!agent || agent === "assistant") && (!feature || feature === "counseling"),
                children: [
                  {
                    name: "데모 케이스 (김민준)",
                    href: "/insight-chat?agent=assistant&feature=counseling&case=kim",
                    isActive: pathname === "/insight-chat" && (!agent || agent === "assistant") && (!feature || feature === "counseling") && caseParam === "kim",
                  },
                ],
              },
              {
                name: "상담 이력 조회",
                href: "/post-consultation",
                icon: ClipboardCheck,
                isActive: pathname === "/post-consultation" && !task,
              },
            ],
          },
          {
            title: "후속업무지원",
            titleIcon: Briefcase,
            items: [
              { name: "접촉 이력 등록", href: "/post-consultation?task=contact", icon: ClipboardCheck, isActive: pathname === "/post-consultation" && task === "contact" },
              { name: "SMS 발송", href: "/post-consultation?task=sms", icon: MessageSquare, isActive: pathname === "/post-consultation" && task === "sms" },
              { name: "상담 검수 결과", href: "/post-consultation?task=audit-result", icon: ShieldCheck, isActive: pathname === "/post-consultation" && task === "audit-result" },
            ],
          },
        ]),
  ]

  return (
    <div
      className={cn(
        "relative flex flex-col border-r border-[#16345f] bg-gradient-to-br from-[#15457f] via-[#0f3468] to-[#0b2547] text-white shadow-[4px_0_18px_rgba(15,35,65,0.25)] transition-all duration-300",
        className,
      )}
      style={{
        width: isCollapsed ? "3.75rem" : "13.25rem",
      }}
    >
      {/* 배경 글로우 데코 — 사이드바 내부에서만 보이도록 클립 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(61,176,255,0.20) 0%, transparent 65%)" }} />
        <div className="absolute -bottom-20 -right-12 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(21,194,162,0.14) 0%, transparent 65%)" }} />
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-4 z-30 h-6 w-6 rounded-full border border-[#8fb4df] bg-white text-[#0b4f91] shadow-md hover:bg-[#edf6ff]"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      <div className="relative z-10 flex h-[76px] items-center border-b border-white/15 px-3">
        <Link href="/login" className={cn("flex w-full items-center gap-2.5 pl-1", isCollapsed && "justify-center gap-0 pl-0")}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#3db0ff] via-[#2f8bff] to-[#15c2a2] shadow-md shadow-black/25">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              {/* 새싹 — 생명/성장 */}
              <path d="M12 21.5 V11.5" stroke="white" strokeWidth="2.1" strokeLinecap="round" />
              <path d="M12 12.5 C12 7.5 15.5 5 20 5 C20 10 16.8 12.5 12 12.5 Z" fill="white" />
              <path d="M12 14.5 C12 10.4 9 8.6 5 8.6 C5 12.7 8.2 14.5 12 14.5 Z" fill="rgba(255,255,255,0.7)" />
            </svg>
          </span>
          {!isCollapsed ? (
            <span className="min-w-0 leading-tight">
              <span className="block text-[17px] font-extrabold tracking-tight text-white">
                GenON <span className="text-[#7fe6cb]">LIFE</span>
              </span>
              <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#9fc4ee]">AICC PORTAL</span>
            </span>
          ) : null}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {serviceSections.map((section, index) => (
          <div key={section.title}>
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => setCollapsedSections((prev) => ({ ...prev, [section.title]: !prev[section.title] }))}
                className="flex w-full items-center gap-2 px-3 pb-2 pt-4 text-[11px] font-bold tracking-tight text-white/65 transition-colors hover:text-white/90"
                aria-label={`${section.title} ${collapsedSections[section.title] ? "펼치기" : "접기"}`}
              >
                {section.titleIcon ? <section.titleIcon className="h-3.5 w-3.5" /> : null}
                <span className="flex-1 text-left">{section.title}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", collapsedSections[section.title] ? "-rotate-90" : "")} />
              </button>
            )}
            {isCollapsed || !collapsedSections[section.title] ? (
            <nav className="space-y-1 px-2">
              {section.items.map((item) => (
                <div key={item.name}>
                  <div
                    className={cn(
                      "flex items-center gap-0.5 rounded-md pr-0.5 transition-colors",
                      item.isActive
                        ? "bg-white text-[#0b4f91] shadow-sm"
                        : "text-white/90 hover:bg-white/12 hover:text-white",
                    )}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                        item.isActive ? "font-bold" : "",
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                    {!isCollapsed && item.children?.length ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMenus((prev) => ({
                            ...prev,
                            [item.name]: !prev[item.name],
                          }))
                        }
                        className="flex h-8 w-6 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent/80"
                        aria-label={`${item.name} 하위 메뉴 ${expandedMenus[item.name] ? "접기" : "펼치기"}`}
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedMenus[item.name] ? "rotate-180" : "",
                          )}
                        />
                      </button>
                    ) : null}
                  </div>
                  {!isCollapsed && item.children?.length && expandedMenus[item.name] ? (
                    <div className="mt-1 space-y-1 pl-9">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            "block rounded-md border-l-2 px-3 py-2 text-xs leading-5 transition-colors",
                            child.isActive
                              ? "border-white bg-white/18 font-semibold text-white"
                              : "border-transparent text-white/70 hover:bg-white/12 hover:text-white",
                          )}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </nav>
            ) : null}
            {index < serviceSections.length - 1 && <div className="mx-4 my-4 border-t border-white/15" />}
          </div>
        ))}
      </div>

      <div ref={menuRef} className="relative border-t border-white/15 bg-[#163f7d]">
        {showUserMenu && !isCollapsed && (
          <div className="absolute bottom-full left-0 right-0 mb-1 rounded-t-lg border border-[#c4cfdd] bg-white p-2 shadow-lg">
            <ThemeToggle
              showLabel
              className="mb-1 w-full justify-start text-foreground hover:bg-[#edf6ff]"
            />
            <div className="my-1 border-t border-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout()
                setShowUserMenu(false)
              }}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              로그아웃
            </Button>
          </div>
        )}

        <AgentInfo isCollapsed={isCollapsed} role={role} />
      </div>
    </div>
  )
}

function AgentInfo({ isCollapsed, role }: { isCollapsed: boolean; role: "agent" | "admin" }) {
  const isAdmin = role === "admin"
  const RoleIcon = isAdmin ? ShieldCheck : Headset
  const roleName = isAdmin ? "박관리 관리자" : "김제나 상담사"
  const [timestamp, setTimestamp] = useState("")
  const [elapsedSec, setElapsedSec] = useState(3 * 3600 + 12 * 60)

  useEffect(() => {
    const fmtTime = () => {
      const now = new Date()
      setTimestamp(
        now.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
          .replace(/\. /g, "-").replace(".", "")
      )
    }
    fmtTime()
    const t = window.setInterval(fmtTime, 60_000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    const t = window.setInterval(() => setElapsedSec((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [])

  const h = String(Math.floor(elapsedSec / 3600)).padStart(2, "0")
  const m = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, "0")
  const s = String(elapsedSec % 60).padStart(2, "0")
  const elapsed = `${h}:${m}:${s}`

  if (isCollapsed) return (
    <div className="flex justify-center border-t border-white/10 py-3">
      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#005bac]/30 text-[#7fc7ff]">
        <RoleIcon className="h-4 w-4" />
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#214f94] bg-emerald-400" />
      </div>
    </div>
  )

  return (
    <div className="border-t border-white/10 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#005bac]/30 text-[#7fc7ff]">
          <RoleIcon className="h-5 w-5" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#214f94] bg-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold leading-snug text-white">{roleName}</p>
          <p className="text-[10px] leading-snug text-white/60">{timestamp || "동기화 중"}</p>
          <p className="text-[9.5px] leading-snug text-white/50">경과 <span className="font-mono tabular-nums">{elapsed}</span></p>
        </div>
      </div>
    </div>
  )
}

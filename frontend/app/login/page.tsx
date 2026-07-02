"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Headset, ShieldCheck, ArrowRight, Lock, User } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Role = "agent" | "admin"

const ROLES: { key: Role; label: string; desc: string; icon: typeof Headset; id: string; href: string }[] = [
  { key: "agent", label: "상담사 계정", desc: "실시간 상담 · 후처리 · 검수", icon: Headset, id: "gena.kim", href: "/main" },
  { key: "admin", label: "관리자 계정", desc: "운영 모니터링 · 품질 관리", icon: ShieldCheck, id: "park.admin", href: "/main" },
]

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>("agent")
  const active = ROLES.find((r) => r.key === role)!

  const handleLogin = () => {
    try {
      localStorage.setItem("genon:role", role)
    } catch {
      /* 데모 — 저장 실패 무시 */
    }
    router.push(active.href)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0f1f3a]">
      {/* ── 좌: 브랜드 패널 ── */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#15457f] via-[#0f3468] to-[#0b2547] p-12 text-white lg:flex">
        {/* 데코 글로우 */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-[420px] w-[420px] rounded-full" style={{ background: "radial-gradient(circle, rgba(61,176,255,0.22) 0%, transparent 65%)" }} />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-[380px] w-[380px] rounded-full" style={{ background: "radial-gradient(circle, rgba(21,194,162,0.16) 0%, transparent 65%)" }} />

        {/* 로고 */}
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#3db0ff] via-[#2f8bff] to-[#15c2a2] shadow-lg shadow-black/30">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 21.5 V11.5" stroke="white" strokeWidth="2.1" strokeLinecap="round" />
              <path d="M12 12.5 C12 7.5 15.5 5 20 5 C20 10 16.8 12.5 12 12.5 Z" fill="white" />
              <path d="M12 14.5 C12 10.4 9 8.6 5 8.6 C5 12.7 8.2 14.5 12 14.5 Z" fill="rgba(255,255,255,0.7)" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-[19px] font-extrabold tracking-tight">GenON <span className="text-[#7fe6cb]">LIFE</span></p>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#9fc4ee]">AICC PORTAL</p>
          </div>
        </div>

        {/* 카피 */}
        <div className="relative max-w-md">
          <h1 className="text-[30px] font-bold leading-snug">
            AI 기반 상담 어시스턴트로<br />더 빠르고 정확한 고객 응대를
          </h1>
          <p className="mt-4 text-[13px] leading-6 text-white/60">
            실시간 상담 보조, 후처리 자동화, 오안내·업무 누락 검수까지 —
            제논라이프 컨택센터의 모든 업무를 하나의 포털에서.
          </p>
        </div>

        <p className="relative text-[11px] text-white/35">© 2026 GenON LIFE. AICC Portal 데모 환경</p>
      </div>

      {/* ── 우: 로그인 폼 ── */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 lg:w-[460px] lg:shrink-0">
        <div className="w-full max-w-[340px]">
          <div className="mb-7">
            <h2 className="text-[20px] font-bold text-[#10233f]">로그인</h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">계정 유형을 선택하고 로그인하세요.</p>
          </div>

          {/* 역할 선택 */}
          <div className="mb-5 grid grid-cols-2 gap-2.5">
            {ROLES.map((r) => {
              const selected = r.key === role
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRole(r.key)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all",
                    selected
                      ? "border-[#005bac] bg-[#f2f8ff] ring-1 ring-[#005bac]/30"
                      : "border-border bg-white hover:border-[#bad6f4] hover:bg-[#f7fbff]",
                  )}
                >
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", selected ? "bg-[#005bac] text-white" : "bg-[#eef3fa] text-[#5b6b80]")}>
                    <r.icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className={cn("block text-[12.5px] font-bold", selected ? "text-[#005bac]" : "text-[#10233f]")}>{r.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground">{r.desc}</span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* 입력 폼 */}
          <div className="space-y-2.5">
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                value={active.id}
                readOnly
                className="h-11 rounded-lg border-border bg-[#f8fafd] pl-9 text-[13px]"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                type="password"
                value="••••••••"
                readOnly
                className="h-11 rounded-lg border-border bg-[#f8fafd] pl-9 text-[13px]"
              />
            </div>
          </div>

          {/* 로그인 버튼 */}
          <Button
            onClick={handleLogin}
            className="mt-5 h-11 w-full gap-2 rounded-lg bg-[#005bac] text-[13.5px] font-semibold hover:bg-[#084780]"
          >
            {active.label}으로 로그인 <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="mt-5 text-center text-[10.5px] text-muted-foreground/70">
            데모 환경 — 계정 유형 선택 후 로그인 버튼으로 진입합니다.
          </p>
        </div>
      </div>
    </div>
  )
}
"use client"

/* 잠재민원 탐지 — 통합 비교 워크스페이스 하위 탭(기존 화면 복사본 연결) */
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldAlert, Siren, ClipboardList, Headset } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { key: "potential", label: "잠재민원 탐지", href: "/potential-complaint", icon: ShieldAlert },
  { key: "detect", label: "고객민원탐지", href: "/voc-detect-copy", icon: Siren },
  { key: "analyze", label: "VoC 분석", href: "/voc-analysis-copy", icon: ClipboardList },
  { key: "callvoc", label: "콜상담 VoC", href: "/ai-voc-copy", icon: Headset },
]

export function PotentialDetectTabs() {
  const pathname = usePathname()
  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-[#0b2547] bg-[#0f3468] px-4">
      {TABS.map((t) => {
        const active = pathname === t.href
        return (
          <Link key={t.key} href={t.href}
            className={cn("flex items-center gap-1.5 border-b-2 px-3 py-2 text-[12px] font-semibold transition-colors",
              active ? "border-white text-white" : "border-transparent text-white/55 hover:text-white/90")}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </Link>
        )
      })}
      <span className="ml-auto py-2 text-[9.5px] text-white/45">화면 비교·분석용 통합 워크스페이스 (복사본)</span>
    </div>
  )
}

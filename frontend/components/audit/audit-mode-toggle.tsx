"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

const MODES = [
  { label: "안내검수", value: "guidance" },
  { label: "업무검수", value: "work" },
] as const

export function AuditModeToggle() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams?.get("mode") === "work" ? "work" : "guidance"

  return (
    <nav className="inline-flex items-center gap-1 rounded-lg border border-border bg-input p-1">
      {MODES.map((mode) => {
        const isActive = current === mode.value
        const params = new URLSearchParams(searchParams?.toString())
        params.set("mode", mode.value)
        const href = `${pathname}?${params.toString()}`
        return (
          <Link
            key={mode.value}
            href={href}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background hover:text-foreground",
            )}
          >
            {mode.label}
          </Link>
        )
      })}
    </nav>
  )
}

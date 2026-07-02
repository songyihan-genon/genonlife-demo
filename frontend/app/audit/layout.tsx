"use client"

import { ReactNode } from "react"
import { AuditModeToggle } from "@/components/audit/audit-mode-toggle"

export default function AuditLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 bg-[#f4f7fb] px-6 py-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            후처리 검수 Agent
          </p>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            안내 / 업무 검수 처리 화면
          </h1>
        </div>
        <AuditModeToggle />
      </header>
      {children}
    </div>
  )
}

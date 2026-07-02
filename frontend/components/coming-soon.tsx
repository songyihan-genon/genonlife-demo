"use client"

import { Construction } from "lucide-react"

export function ComingSoon({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center bg-[#f1f5fb] p-10 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#005bac]/10 text-[#005bac]">
        <Construction className="h-8 w-8" />
      </div>
      <h1 className="text-lg font-bold text-[#10233f]">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc ?? "준비 중입니다. 곧 제공될 예정입니다."}</p>
      <span className="mt-4 rounded-full border border-[#dbe5f1] bg-white px-3 py-1 text-[11px] font-semibold text-[#0b4f91]">COMING SOON</span>
    </div>
  )
}

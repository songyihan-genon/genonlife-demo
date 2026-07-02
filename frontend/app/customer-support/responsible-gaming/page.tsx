"use client"

import { ResponsibleGamingTool } from "@/components/responsible-gaming-tool"

export default function ResponsibleGamingPage() {
  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-6xl space-y-4 px-6 py-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Customer Support</p>
          <h1 className="text-3xl font-bold text-foreground">레거시 고객보호 샘플</h1>
          <p className="text-sm text-muted-foreground">
            고객 보호 포스터와 상담 연계 메시지를 현장용 문안으로 생성하는 화면입니다.
          </p>
        </div>
        <ResponsibleGamingTool />
      </div>
    </div>
  )
}

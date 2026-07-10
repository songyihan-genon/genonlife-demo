"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CounselingAssistantView } from "@/components/CounselingAssistantView"

function InsightChatContent() {
  const searchParams = useSearchParams()
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      <CounselingAssistantView demoCase={searchParams.get("case")} />
    </div>
  )
}

export default function InsightChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <InsightChatContent />
    </Suspense>
  )
}
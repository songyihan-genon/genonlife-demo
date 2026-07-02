"use client"

import { Suspense } from "react"
import { DebtTransferTool } from "@/components/DebtTransferTool"

function DebtTransferPageContent() {
  return (
    <div className="h-full bg-background flex flex-col relative overflow-hidden">
      <DebtTransferTool />
    </div>
  )
}

export default function DebtTransferPage() {
  return (
    <Suspense>
      <DebtTransferPageContent />
    </Suspense>
  )
}

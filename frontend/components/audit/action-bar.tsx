"use client"

import { Check, MessageSquare, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ActionBar() {
  return (
    <div className="flex items-center justify-end gap-2 rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm">
      <span className="mr-auto text-xs text-muted-foreground">
        2차 검수 결과를 선택해 주세요.
      </span>
      <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
        <Check className="h-4 w-4" />
        AI 판정 동의
      </Button>
      <Button size="sm" variant="outline" className="gap-2 border-red-200 text-red-700 hover:bg-red-50">
        <RotateCcw className="h-4 w-4" />
        재검토 필요
      </Button>
      <Button size="sm" variant="outline" className="gap-2">
        <MessageSquare className="h-4 w-4" />
        코멘트 추가
      </Button>
    </div>
  )
}

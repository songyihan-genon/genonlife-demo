"use client"

import { ArrowRight, Ban, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

interface PiiBlockedCardProps {
  /** 다른 파일로 다시 시도 — 초기 화면으로 복귀 */
  onReset: () => void
}

/**
 * PII 업로드 차단 카드 — 경고 미해소 후 최종 차단.
 *
 * 경고 단계는 대화 흐름(PiiWarningCard)에서 이미 동일 디자인으로 표시되었으므로,
 * 이 카드는 "경고가 해소되지 않아 차단되었다"는 최종 결과만 보여준다.
 */
export function PiiBlockedCard({ onReset }: PiiBlockedCardProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 차단 상태 */}
      <div className="rounded-xl border border-red-200 bg-red-50/40 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Ban className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              업로드 차단
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              이전 경고가 해소되지 않은 파일이 다시 업로드되어 분석이 차단되었습니다.
              개인정보를 제거하거나 비식별화를 완료한 파일로 다시 시도해 주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 다시 시작 CTA */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#005BAC]/40 bg-[#EEF7FF]/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#005BAC]/10 text-[#005BAC]">
            <RotateCcw className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              비식별화된 파일로 다시 시도해 주세요
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              개인정보를 제거한 뒤 다시 업로드하면 분석을 시작할 수 있습니다.
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={onReset}
          className="gap-1.5 bg-[#005BAC] text-white hover:bg-[#004F9E]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          처음부터 다시 시작
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

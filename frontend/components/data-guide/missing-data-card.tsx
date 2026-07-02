"use client"

import { AlertTriangle, ArrowRight, RotateCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface MissingDataCardProps {
  /** 처음부터 다시 시작 — 초기 화면으로 복귀 */
  onReset: () => void
}

/**
 * 필수 데이터 누락 안내 카드.
 *
 * 요구사항: "필요 데이터가 없는 경우, 구체적 누락 항목을 명시하여 안내"
 * 분석에 필요한 필수 컬럼이 누락된 경우 어떤 항목이 빠졌는지 보여주고
 * 데이터를 보완해서 다시 업로드하도록 안내한다.
 */
export function MissingDataCard({ onReset }: MissingDataCardProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 누락 안내 */}
      <div className="rounded-xl border border-sky-300 bg-sky-50/60 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                필수 데이터 누락
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                업로드 파일에서 분석에 필요한 필수 컬럼이 확인되지 않아 진행할 수
                없습니다. 아래 항목을 포함한 파일로 다시 업로드해 주세요.
              </p>
            </div>

            {/* 누락 항목 */}
            <div className="rounded-lg border border-sky-200 bg-white p-3">
              <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                누락된 필수 컬럼
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant="outline"
                  className="border-sky-300 bg-sky-50 font-mono text-sky-800"
                >
                  처리시간_분
                </Badge>
                <Badge
                  variant="outline"
                  className="border-sky-300 bg-sky-50 font-mono text-sky-800"
                >
                  만족도
                </Badge>
              </div>
              <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
                요청하신 "만족도 추이 분석"을 위해 위 컬럼이 반드시 필요합니다.
              </p>
            </div>
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
              누락 항목을 보완해서 다시 업로드해 주세요
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              필수 컬럼이 포함된 파일로 다시 업로드하면 분석을 시작할 수 있습니다.
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

"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Archive,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  MessageCircleQuestion,
  ShieldAlert,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChatInputBar } from "@/components/shared"

import { dataGuideScenarios } from "./demo-scenarios"
import { adminDatasets } from "./mock-data"
import type { DataGuideScenario } from "./types"

interface InitialScreenProps {
  /** 카드 클릭 시 해당 시나리오로 대화를 시작 */
  onScenarioStart: (scenarioId: DataGuideScenario["id"]) => void
}

/** 시나리오별 아이콘 + 부제 (분석 유형) */
const scenarioMeta: Record<
  DataGuideScenario["id"],
  { icon: typeof BarChart3; caption: string }
> = {
  A: { icon: BarChart3, caption: "XLSX/CSV 데이터 분석" },
  B: { icon: FileText, caption: "HWPX/PDF 문서 분석" },
  C: { icon: ShieldAlert, caption: "PII 자동 검증" },
  D: { icon: MessageCircleQuestion, caption: "역질문으로 분석 기준 구체화" },
  E: { icon: AlertTriangle, caption: "필수 데이터 누락 시 안내" },
}

/**
 * SFR-016 초기 화면 — 파일 업로드 드롭존 + 분석 유형 카드 + 입력창.
 *
 * 추천 카드에는 파일 칩 없이 **분석 유형 부제만** 표시해, "시스템이 파일 유형에
 * 따라 자동 분기한다"는 컨셉을 유지한다. 클릭 시 대화 화면에서 파일 첨부 칩이
 * 자연스럽게 노출된다.
 */
export function InitialScreen({ onScenarioStart }: InitialScreenProps) {
  const [showGuide, setShowGuide] = useState(true)

  return (
    <div className="flex flex-col gap-6">
      {/* 1) 파일 업로드 드롭존 — 컴팩트 */}
      <div className="flex items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 px-6 py-6 transition-colors hover:border-[#005BAC]/50 hover:bg-[#EEF7FF]/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF7FF] text-[#005BAC]">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div className="space-y-0.5 text-left">
          <p className="text-sm font-semibold text-foreground">
            분석할 파일을 드래그하거나 클릭해 업로드하세요
          </p>
          <p className="text-xs text-muted-foreground">
            XLSX · CSV · HWPX · PDF 지원
          </p>
        </div>
      </div>

      {/* 2) 등록된 활용 데이터 — 접이식 */}
      <DataArchiveToggle />

      {/* 3) 분석 유형 안내 카드 — X 버튼으로 닫기 가능 */}
      {showGuide ? (
        <div className="relative rounded-xl border border-[#005BAC]/30 bg-white p-6">
          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={() => setShowGuide(false)}
            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="안내 닫기"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#005BAC]">
            <Sparkles className="h-3.5 w-3.5" />
            이렇게 활용해 보세요
          </div>
          <h3 className="text-base font-bold text-foreground">
            이런 분석을 할 수 있어요
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            파일을 업로드하고 질의를 입력하면 파일 유형에 맞는 분석 파이프라인이
            자동으로 실행됩니다.
          </p>

          <div className="mt-4 space-y-2.5">
            {dataGuideScenarios.map((scenario) => {
              const meta = scenarioMeta[scenario.id]
              const Icon = meta.icon
              return (
                <div
                  key={scenario.id}
                  role="presentation"
                  onClick={() => onScenarioStart(scenario.id)}
                  className="flex w-full items-start gap-3 rounded-lg border border-border/50 bg-white px-4 py-3 text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF7FF] text-[#005BAC]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm leading-6 text-foreground">
                      {scenario.userQuery}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {meta.caption}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* 4) 입력창 — 텍스트 + 전송만 (파일은 드롭존이 전담) */}
      <ChatInputBar placeholder="분석할 내용을 입력하세요..." hideAuxButtons />
    </div>
  )
}

/**
 * 관리자 등록 활용 데이터 — 접이식 토글.
 *
 * 드롭존 아래에 배치되어 "직접 업로드" 외에 "등록된 비식별 데이터로 분석"이라는
 * 대안 경로를 제공한다. 기본 닫힘 상태로 초기 화면 세로 길이 영향 최소화.
 */
function DataArchiveToggle() {
  const [open, setOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF7FF] text-[#005BAC]">
            <Archive className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              등록된 활용 데이터
            </p>
            <p className="text-[11px] text-muted-foreground">
              관리자가 사전 등록한 비식별화 자료를 조회하고 다운로드할 수 있습니다.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {adminDatasets.length}건
          </Badge>
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {open ? (
        <div className="border-t border-border/60 px-4 py-3">
          <div className="space-y-1.5">
            {adminDatasets.map((dataset) => (
              <div
                key={dataset.name}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-xs font-medium text-foreground"
                    title={dataset.name}
                  >
                    {dataset.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {dataset.owner} · {dataset.registeredAt}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`${dataset.name} 다운로드`}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            데이터 등록 및 권한 설정은 관리자에게 문의해 주세요.
          </p>
        </div>
      ) : null}
    </div>
  )
}

"use client"

import { Clock, Search, Sparkles } from "lucide-react"

import { ChatInputBar } from "@/components/shared"

import { partnerSearchScenarios } from "./demo-scenarios"
import { ingestionSummary } from "./mock-partners"
import type { PartnerSearchScenario } from "./demo-scenarios"

interface InitialScreenProps {
  /** 추천 질문 클릭 시 해당 시나리오로 검색 결과를 재생 */
  onScenarioStart: (scenarioId: PartnerSearchScenario["id"]) => void
}

/**
 * SFR-021 초기 화면 — 데이터 최신성 안내 + 추천 질문 카드 + 입력창.
 *
 * 사용자가 사이드바에서 "협약기관 검색"을 눌러 들어왔을 때 처음 만나는 화면.
 * SFR-015/016과 동일한 주황 톤 초기 화면 패턴을 채택한다.
 */
export function InitialScreen({ onScenarioStart }: InitialScreenProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* 데이터 최신성 안내 — 얇은 배너 */}
      <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">데이터 최신성 안내</span>
        <span>·</span>
        <span>
          마지막 동기화 {ingestionSummary.lastSyncAt} KST · {ingestionSummary.lastSyncRelative}
        </span>
      </div>

      {/* 추천 질문 카드 */}
      <div className="rounded-xl border border-[#005BAC]/30 bg-white p-6">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#005BAC]">
          <Sparkles className="h-3.5 w-3.5" />
          추천 질문
        </div>
        <h3 className="text-base font-bold text-foreground">바로 시작할 질문</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          아래 질문을 누르면 자연어 질의 기반 하이브리드 검색 결과가 바로 재생됩니다.
        </p>

        <div className="mt-4 space-y-2.5">
          {partnerSearchScenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => onScenarioStart(scenario.id)}
              className="flex w-full items-start gap-3 rounded-lg border border-[#005BAC]/30 bg-white px-4 py-3 text-left transition hover:border-[#005BAC]/60 hover:bg-[#EEF7FF]/50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF7FF] text-[#005BAC]">
                <Search className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm leading-6 text-foreground">
                  {scenario.userQuery}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {scenario.caption}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 입력창 */}
      <ChatInputBar placeholder="협약기관을 자연어로 검색해 보세요" />
    </div>
  )
}

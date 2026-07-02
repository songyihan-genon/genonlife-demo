"use client"

import { useState } from "react"

import { InitialScreen } from "./initial-screen"
import { PartnerConversation } from "./partner-conversation"
import { getScenarioById } from "./demo-scenarios"
import type { PartnerSearchScenario } from "./demo-scenarios"

type ViewState =
  | { step: "initial" }
  | { step: "conversation"; scenarioId: PartnerSearchScenario["id"] }

/**
 * SFR-021 · Agent 협약기관 검색 목업 최상위 뷰.
 *
 * SFR-015/016 과 동일한 "초기 화면 → 추천 질문 클릭 → 대화 재생" 패턴.
 * 관리자용 수집 파이프라인 대시보드는 이번 재구성에서 제외 (파일은 보존).
 *
 * - `step === "initial"` → `InitialScreen` (데이터 최신성 + 추천 질문 + 입력창)
 * - `step === "conversation"` → `PartnerConversation` (검색 조건 자동 추출 + 하이브리드 검색 결과)
 * - "← 새 검색" 클릭 시 초기 화면으로 복귀
 */
export function PartnerSearchView() {
  const [view, setView] = useState<ViewState>({ step: "initial" })

  const handleStart = (scenarioId: PartnerSearchScenario["id"]) => {
    setView({ step: "conversation", scenarioId })
  }

  const handleReset = () => {
    setView({ step: "initial" })
  }

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto w-full max-w-5xl space-y-4 px-6 py-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Partner Search
          </p>
          <h1 className="text-3xl font-bold text-foreground">제휴기관 검색</h1>
          <p className="text-sm text-muted-foreground">
            자연어 질의로 제논라이프 제휴기관과 외부 협력사를 찾아 안내하는 화면입니다.
          </p>
        </div>

        {view.step === "initial" ? (
          <InitialScreen onScenarioStart={handleStart} />
        ) : (
          <PartnerConversation
            scenario={getScenarioById(view.scenarioId)}
            onNewConversation={handleReset}
          />
        )}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"

import { ConversationView } from "./conversation-view"
import { DataAnalysisMode } from "./data-analysis-mode"
import { DocumentAnalysisMode } from "./document-analysis-mode"
import { InitialScreen } from "./initial-screen"
import { MissingDataCard } from "./missing-data-card"
import { PiiBlockedCard } from "./pii-blocked-card"
import { getScenarioById } from "./demo-scenarios"
import type { DataGuideScenario } from "./types"

type ViewState =
  | { step: "initial" }
  | { step: "conversation"; scenarioId: DataGuideScenario["id"] }

/**
 * SFR-016 · Agent 데이터길잡이 최상위 목업 뷰.
 *
 * 실제 사용자 흐름을 모사한다:
 *   1) 초기 화면(`InitialScreen`) — 파일 업로드 드롭존 + 추천 질문 + 입력창
 *   2) 드롭존 샘플 버튼이나 추천 질문 클릭 → 해당 시나리오의 대화 화면으로 전환
 *   3) 대화 화면(`ConversationView`) — 사용자 메시지·에이전트 응답·입력창·새 대화 버튼
 *   4) "← 새 대화" 또는 PII 차단 "다른 파일로 다시 시도" → 초기 화면 복귀
 *
 * 관리자 Web UI는 이번 재구성에서 제외 (추후 재도입 시 `admin-panel.tsx` 재사용).
 */
export function DataGuideView() {
  const [view, setView] = useState<ViewState>({ step: "initial" })

  const handleStart = (scenarioId: DataGuideScenario["id"]) => {
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
            Data Navigator
          </p>
          <h1 className="text-3xl font-bold text-foreground">데이터길잡이</h1>
          <p className="text-sm text-muted-foreground">
            상담·문서 파일을 업로드하고 자연어 질의로 분석 결과를 받아볼 수 있는 화면입니다.
          </p>
        </div>
        {view.step === "initial" ? (
          <InitialScreen onScenarioStart={handleStart} />
        ) : (
          <ConversationScene
            scenarioId={view.scenarioId}
            onNewConversation={handleReset}
          />
        )}
      </div>
    </div>
  )
}

function ConversationScene({
  scenarioId,
  onNewConversation,
}: {
  scenarioId: DataGuideScenario["id"]
  onNewConversation: () => void
}) {
  const scenario = getScenarioById(scenarioId)

  const agentResponse = (() => {
    if (scenario.mode === "document") return <DocumentAnalysisMode />
    if (scenario.mode === "pii-blocked") {
      return <PiiBlockedCard onReset={onNewConversation} />
    }
    if (scenario.mode === "missing-data") {
      return <MissingDataCard onReset={onNewConversation} />
    }
    // "data" 모드, 그리고 "clarify" 모드(역질문 후 구체 재답변) 모두
    // 최종 응답은 DataAnalysisMode — 사용자는 동일한 파이프라인 결과를 본다.
    return <DataAnalysisMode />
  })()

  return (
    <ConversationView
      scenario={scenario}
      agentResponse={agentResponse}
      onNewConversation={onNewConversation}
    />
  )
}

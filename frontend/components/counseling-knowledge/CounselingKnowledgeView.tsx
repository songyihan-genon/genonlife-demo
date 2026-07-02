"use client"

import { useMemo, useState } from "react"

import { ChatPanel } from "./chat-panel"
import { InitialScreen } from "./initial-screen"
import { getPresetById, presetToMessages } from "./demo-presets"
import type { CounselingPreset } from "./types"

type ViewState =
  | { step: "initial" }
  | { step: "conversation"; scenarioId: CounselingPreset["id"] }

/**
 * SFR-015 · Agent 상담지식 목업 최상위 뷰.
 *
 * SFR-016 과 동일한 "초기 화면 → 추천 질문 클릭 → 대화 재생" 패턴.
 * SfrPageShell 헤더 없이 바로 사용자 관점의 mockup 이 노출되도록 플랫 wrapper 만 유지한다.
 *
 * - `step === "initial"` → `InitialScreen` (추천 질문 카드 + 입력창)
 * - `step === "conversation"` → `ChatPanel` (선택한 시나리오의 대화 재생)
 * - "← 새 대화 시작" 클릭 시 초기 화면으로 복귀
 */
export function CounselingKnowledgeView() {
  const [view, setView] = useState<ViewState>({ step: "initial" })

  const messages = useMemo(() => {
    if (view.step !== "conversation") return []
    return presetToMessages(getPresetById(view.scenarioId))
  }, [view])

  const handleStart = (scenarioId: CounselingPreset["id"]) => {
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
            Counseling Knowledge
          </p>
          <h1 className="text-3xl font-bold text-foreground">상담지식 에이전트</h1>
          <p className="text-sm text-muted-foreground">
            보험금 청구, 계약 변경, 약관 안내 등 제논라이프 상담 업무 지식을 자연어로 질의할 수 있는 화면입니다.
          </p>
        </div>
        {view.step === "initial" ? (
          <InitialScreen onScenarioStart={handleStart} />
        ) : (
          <ChatPanel messages={messages} onNewConversation={handleReset} />
        )}
      </div>
    </div>
  )
}

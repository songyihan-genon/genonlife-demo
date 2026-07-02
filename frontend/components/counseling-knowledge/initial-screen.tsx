"use client"

import { Headset, Sparkles } from "lucide-react"

import { ChatInputBar } from "@/components/shared"

import { counselingPresets } from "./demo-presets"
import type { CounselingPreset } from "./types"

interface InitialScreenProps {
  /** 추천 질문 클릭 시 해당 시나리오로 대화를 시작 */
  onScenarioStart: (scenarioId: CounselingPreset["id"]) => void
}

/**
 * SFR-015 초기 화면 — 추천 질문 카드 + 입력창.
 *
 * 사용자가 사이드바에서 "상담지식 에이전트"를 눌러 들어왔을 때
 * 처음 만나는 화면. SFR-016 `initial-screen.tsx` 와 동일한 주황 톤 패턴을
 * 채택하되, 상담지식은 파일 업로드가 없으므로 드롭존은 생략하고 추천 질문과
 * 입력창만 노출한다.
 */
export function InitialScreen({ onScenarioStart }: InitialScreenProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* 추천 질문 카드 */}
      <div className="rounded-xl border border-[#005BAC]/30 bg-white p-6">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#005BAC]">
          <Sparkles className="h-3.5 w-3.5" />
          추천 질문
        </div>
        <h3 className="text-base font-bold text-foreground">바로 시작할 질문</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          아래 질문을 누르면 예시 시나리오가 바로 재생됩니다.
        </p>

        <div className="mt-4 space-y-2.5">
          {counselingPresets.map((preset) => {
            // preset.label 형식: "개인채무조정 대상 요건" / "새출발기금 지원 문의" / "두 제도 비교"
            // 부제(시나리오 성격) 매핑
            const caption = getScenarioCaption(preset.id)
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onScenarioStart(preset.id)}
                className="flex w-full items-start gap-3 rounded-lg border border-[#005BAC]/30 bg-white px-4 py-3 text-left transition hover:border-[#005BAC]/60 hover:bg-[#EEF7FF]/50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF7FF] text-[#005BAC]">
                  <Headset className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm leading-6 text-foreground">
                    {preset.query}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {caption}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 입력창 */}
      <ChatInputBar placeholder="상담지식 에이전트에게 물어보세요" />
    </div>
  )
}

/** 시나리오 성격을 한 줄로 요약한 부제 — 추천 질문 카드 하단에 노출 */
function getScenarioCaption(id: CounselingPreset["id"]): string {
  switch (id) {
    case "A":
      return "단일 영역 · 고신뢰 · 바로 답변"
    case "B":
      return "저신뢰 · 역질문으로 확정 · 재검색 · PII 자동 마스킹"
    case "C":
      return "복수 영역 · 병렬 검색 · 비교 답변"
  }
}

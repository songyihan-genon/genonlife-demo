"use client"

import Image from "next/image"
import { ArrowLeft, Clock, Database, Filter } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChatInputBar, SectionCard } from "@/components/shared"
import { cn } from "@/lib/utils"

import { ExtractedFilterChips } from "./extracted-filter-chips"
import { ResultCard } from "./result-card"
import { ingestionSummary, partnerById } from "./mock-partners"
import type { PartnerSearchScenario } from "./demo-scenarios"
import type { Partner } from "./types"

interface PartnerConversationProps {
  scenario: PartnerSearchScenario
  /** "← 새 검색" 클릭 시 호출 — 초기 화면 복귀 */
  onNewConversation: () => void
}

/**
 * SFR-021 대화 뷰 — 추천 질문 또는 입력창 전송 이후 재생되는 화면.
 *
 * 구성:
 *   1) 상단 "← 새 검색" 버튼
 *   2) 사용자 질의 버블 (우측)
 *   3) Agent 응답: 검색 조건 자동 추출 → 하이브리드 검색 결과
 *   4) 하단 데이터 최신성 소문구
 *   5) 하단 공유 ChatInputBar
 */
export function PartnerConversation({
  scenario,
  onNewConversation,
}: PartnerConversationProps) {
  const results: Partner[] = scenario.resultIds
    .map((id) => partnerById(id))
    .filter((p): p is Partner => Boolean(p))

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 툴바 — 새 검색 */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onNewConversation}
          className="gap-1.5 text-muted-foreground hover:text-[#005BAC]"
        >
          <ArrowLeft className="h-4 w-4" />
          새 검색
        </Button>
      </div>

      {/* 메시지 리스트 */}
      <div className="flex flex-col gap-6">
        {/* 사용자 질의 */}
        <div className="ml-auto flex w-full flex-row-reverse gap-4">
          <div className="h-8 w-8 flex-shrink-0" />
          <div className="max-w-md rounded-2xl bg-[#F0F4FA] px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-black">
              {scenario.userQuery}
            </p>
          </div>
        </div>

        {/* Agent 응답 */}
        <div className="flex w-full items-start gap-4">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
            <Image
              src="/shinhanlife-ai-mark.svg"
              alt="제휴기관 검색 에이전트"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            {/* 1) 검색 조건 자동 추출 */}
            <SectionCard
              title={
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Filter className="h-4 w-4 text-[#005BAC]" />
                  검색 조건 자동 추출
                </span>
              }
              description="질의에서 지역·제도·기관유형 등을 추출하여 메타데이터 필터를 구성합니다."
            >
              <ExtractedFilterChips filters={scenario.extractedFilters} />
            </SectionCard>

            {/* 2) 하이브리드 검색 결과 */}
            <SectionCard
              title={
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Database className="h-4 w-4 text-[#005BAC]" />
                  하이브리드 검색 결과
                </span>
              }
              description="메타필터와 벡터 유사도를 결합한 상위 결과입니다. 약칭·유사 명칭은 하이라이트로 일치 구간을 표시합니다."
              headerRight={
                <Badge
                  variant="outline"
                  className="gap-1 border-[#005BAC]/40 bg-[#EEF7FF] text-[10px] text-[#1B3A4B]"
                >
                  총 {results.length}건
                </Badge>
              }
            >
              <div className="flex flex-col gap-2">
                {results.map((partner) => (
                  <ResultCard
                    key={partner.id}
                    partner={partner}
                    highlight={scenario.highlightAlias}
                  />
                ))}
              </div>

              {/* 데이터 최신성 소문구 */}
              <div className="mt-3 flex items-center gap-1.5 border-t border-border/50 pt-2 text-[10.5px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  ※ 본 결과는 마지막 동기화({ingestionSummary.lastSyncAt} KST · {ingestionSummary.lastSyncRelative}) 시점 기준입니다.
                </span>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* 입력창 */}
      <ChatInputBar placeholder="협약기관을 자연어로 검색해 보세요" />
    </div>
  )
}

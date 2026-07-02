"use client"

import { useState } from "react"
import {
  AlertCircle,
  ChevronDown,
  FileText,
  ListOrdered,
  ShieldCheck,
  Shield,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { SectionCard } from "@/components/shared"
import { cn } from "@/lib/utils"

import { InlineReasoningTrace } from "./inline-reasoning-trace"
import type {
  AnswerArtifact,
  IntentClassification,
  RagRetrieval,
  RelevanceEvaluation,
} from "./types"

interface AnswerCardProps {
  answer: AnswerArtifact
  /** 답변 본문 상단에 노출할 에이전트 처리 과정 트레이스 */
  intent?: IntentClassification
  retrieval?: RagRetrieval
  relevance?: RelevanceEvaluation
  /** 역질문을 통해 의도가 확정된 상태인지 (트레이스 ① 배지 톤 전환) */
  confirmedByClarify?: boolean
}

/**
 * 최종 답변 카드. SFR-015 ④번 단계(답변 생성 및 출력)의 시각 표현.
 * 근거 인용, CoT 추론 경로, PII 마스킹 메모, 참고 정보 배지를 포함한다.
 */
export function AnswerCard({
  answer,
  intent,
  retrieval,
  relevance,
  confirmedByClarify = false,
}: AnswerCardProps) {
  const [cotOpen, setCotOpen] = useState(false)

  return (
    <SectionCard
      className="shadow-sm"
      contentClassName="gap-4"
    >
      {/* 상단 배지 영역 */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-[#005BAC]/50 bg-[#EEF7FF] text-[#1B3A4B]"
        >
          <Sparkles className="mr-1 h-3 w-3 text-[#005BAC]" />
          참고 정보
        </Badge>
        <Badge
          variant="outline"
          className="border-border/70 bg-background/60 text-muted-foreground"
        >
          <ShieldCheck className="mr-1 h-3 w-3" />
          근거 조항 인용
        </Badge>
        <Badge
          variant="outline"
          className="border-border/70 bg-background/60 text-muted-foreground"
        >
          <ListOrdered className="mr-1 h-3 w-3" />
          추론 경로 포함
        </Badge>
        {answer.piiMaskedFrom ? (
          <Badge
            variant="outline"
            className="border-border/70 bg-background/60 text-muted-foreground"
          >
            <Shield className="mr-1 h-3 w-3" />
            PII 자동 마스킹
          </Badge>
        ) : null}
      </div>

      {/* 에이전트 처리 과정 인라인 트레이스 */}
      {intent || retrieval || relevance ? (
        <InlineReasoningTrace
          intent={intent}
          retrieval={retrieval}
          relevance={relevance}
          confirmedByClarify={confirmedByClarify}
        />
      ) : null}

      {/* 본문 */}
      <p className="whitespace-pre-line text-sm leading-7 text-foreground">
        {answer.body}
      </p>

      {/* CoT 토글 */}
      <Collapsible open={cotOpen} onOpenChange={setCotOpen}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-md border border-border/70 bg-background/60 px-3 py-2",
            "text-xs font-medium text-muted-foreground transition hover:bg-background",
          )}
        >
          <span className="inline-flex items-center gap-2">
            <ListOrdered className="h-3.5 w-3.5" />
            추론 경로 (CoT) · {answer.cot.length}단계
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              cotOpen && "rotate-180",
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 rounded-md border border-dashed border-border/70 bg-background/40 px-3 py-3">
          <p className="mb-2 text-[10px] text-muted-foreground">
            각 단계는 근거 선택 이유(질의-근거 관련도 판단 근거)와 추가 확인 필요 사항을 포함합니다.
          </p>
          <ol className="space-y-2.5">
            {answer.cot.map((step, idx) => (
              <li key={idx} className="flex gap-2.5">
                <span
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                  style={{ backgroundColor: "#005BAC" }}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-xs font-semibold leading-5 text-foreground">
                    {step.title}
                  </div>
                  <p className="text-[11px] leading-5 text-muted-foreground">
                    {step.rationale}
                  </p>
                  {step.followUp ? (
                    <div className="mt-1.5 flex items-start gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5">
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-sky-700" />
                      <p className="text-[10.5px] leading-4 text-sky-900">
                        <span className="font-semibold">추가 확인 필요 · </span>
                        {step.followUp}
                      </p>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* 인용 */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          근거 조항
        </div>
        <div className="flex flex-wrap gap-1.5">
          {answer.citations.map((c) => (
            <Badge
              key={c.label}
              variant="outline"
              className="border-[#005BAC]/40 bg-[#EEF7FF]/70 font-normal text-[#1B3A4B]"
            >
              {c.label}
              <span className="ml-1 text-[10px] text-[#1B3A4B]/60">
                · {c.source}
              </span>
            </Badge>
          ))}
        </div>
      </div>

      <p className="text-[11px] leading-5 text-muted-foreground">
        본 답변은 규정·매뉴얼을 기반으로 한 참고 정보이며, 개별 사안에 대한 최종 판단은
        담당 상담사의 사실관계 확인을 통해 이루어집니다.
      </p>
    </SectionCard>
  )
}

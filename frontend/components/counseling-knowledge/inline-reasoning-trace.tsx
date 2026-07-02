"use client"

import { Activity, CheckCircle2, Database, Gauge, RotateCcw } from "lucide-react"

import { designColors } from "@/components/shared"
import { cn } from "@/lib/utils"

import type {
  IntentClassification,
  RagRetrieval,
  RelevanceEvaluation,
} from "./types"

interface InlineReasoningTraceProps {
  /** 의도 분류 결과 (역질문 버블·최종 답변 양쪽에 사용) */
  intent?: IntentClassification
  /** 영역별 RAG 검색 (최종 답변에만 사용) */
  retrieval?: RagRetrieval
  /** 관련도 평가 (최종 답변에만 사용, 재쿼리 포함) */
  relevance?: RelevanceEvaluation
  /**
   * 역질문을 거쳐 의도가 확정된 상태인지 여부.
   * true인 경우 ① 배지를 "역질문으로 확정" (emerald)으로 전환하여 최종 답변 문맥에
   * 맞는 상태를 보여준다. 기본 false (역질문 버블에서는 여전히 amber "미달 → 역질문").
   */
  confirmedByClarify?: boolean
  className?: string
}

/**
 * 에이전트 응답 버블 내부에 노출하는 "처리 과정" 미니 트레이스.
 *
 * 백그라운드에서 돌아가는 ①의도분류 → ②영역별 RAG → ③관련도 평가를
 * 최종 답변 본문 위에 얇게 붙여, 사용자가 대화만 봐도 에이전트의 판단 경로를
 * 파악할 수 있게 한다. 별도 사이드 패널 없이 채팅 흐름에 녹인다.
 */
export function InlineReasoningTrace({
  intent,
  retrieval,
  relevance,
  confirmedByClarify = false,
  className,
}: InlineReasoningTraceProps) {
  if (!intent && !retrieval && !relevance) return null

  const confidencePct = intent ? Math.round(intent.confidence * 100) : 0
  const thresholdPct = intent ? Math.round(intent.threshold * 100) : 70
  const intentOk = intent ? !intent.triggeredClarify || confirmedByClarify : true

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-background/70 px-3 py-2.5",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Activity className="h-3 w-3" />
        에이전트 처리 과정
      </div>
      <div className="space-y-1.5 text-[11px] leading-5">
        {intent ? (
          <div className="flex items-start gap-2">
            <StepDot n={1} color="#005BAC" />
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground">의도 분류</span>
              <span className="mx-1 text-muted-foreground">→</span>
              <span className="text-foreground">{intent.domain}</span>
              {confirmedByClarify ? (
                <span className="ml-1.5 inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  역질문으로 확정
                </span>
              ) : (
                <span
                  className={cn(
                    "ml-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
                    intentOk
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-sky-100 text-sky-800",
                  )}
                >
                  <Gauge className="h-2.5 w-2.5" />
                  신뢰도 {confidencePct}%{" "}
                  {intentOk
                    ? `(임계 ${thresholdPct}% 충족)`
                    : `(임계 ${thresholdPct}% 미달 → 역질문)`}
                </span>
              )}
            </div>
          </div>
        ) : null}

        {retrieval ? (
          <div className="flex items-start gap-2">
            <StepDot n={2} color="#005BAC" />
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground">영역별 RAG 검색</span>
              <span className="mx-1 text-muted-foreground">→</span>
              <span className="text-foreground">{retrieval.knowledgeBase}</span>
              <span className="ml-1.5 inline-flex items-center gap-1 rounded bg-[#e8f0fe] px-1.5 py-0.5 text-[10px] font-medium text-[#1B3A4B]">
                <Database className="h-2.5 w-2.5" />
                {retrieval.hits.length}건 히트
              </span>
            </div>
          </div>
        ) : null}

        {relevance ? (
          <div className="flex items-start gap-2">
            <StepDot
              n={3}
              color={
                relevance.passed || relevance.rewriteLog
                  ? "#005BAC"
                  : designColors.nodeGuardrail
              }
            />
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground">관련도 평가</span>
              <span className="mx-1 text-muted-foreground">→</span>
              {relevance.rewriteLog ? (
                <span className="text-foreground">
                  1차 {relevance.score.toFixed(2)} 미달
                  <RotateCcw className="mx-1 inline h-3 w-3 text-[#8C8C8C]" />
                  쿼리 재작성 → 재검색{" "}
                  <span className="rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-medium text-emerald-800">
                    {relevance.rewriteLog.secondScore.toFixed(2)} 통과
                  </span>
                </span>
              ) : (
                <span className="text-foreground">
                  점수 {relevance.score.toFixed(2)}
                  <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                    임계 {relevance.threshold.toFixed(2)} 통과
                  </span>
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function StepDot({ n, color }: { n: number; color: string }) {
  return (
    <span
      className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {n}
    </span>
  )
}

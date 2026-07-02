"use client"

import {
  ChevronRight,
  FileCheck2,
  FileText,
  Lightbulb,
  List,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import {
  citationSnippets,
  documentInsights,
  documentTree,
  summaryParagraphs,
} from "./mock-data"
import type { DocumentTreeNode } from "./types"

interface DocumentAnalysisModeProps {
  className?: string
}

/**
 * 문서분석 모드 — 사용자에게 보이는 문서 요약 리포트 형태.
 *
 * 파이프라인 단계(①②③)나 기술 설명 태그 없이, 문서 요약 결과를 자연스럽게 전달한다.
 * 구성: 문서 구조 → 핵심 요약 (출처 인용) → 주요 인사이트 → 안내 문구
 */
export function DocumentAnalysisMode({ className }: DocumentAnalysisModeProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("flex flex-col gap-5", className)}>
        {/* 문서 구조 */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <List className="h-4 w-4 text-[#005BAC]" />
            문서 구조
          </div>
          <p className="text-xs text-muted-foreground">
            업로드하신 문서에서 {documentTree.length}개 장, 총{" "}
            {documentTree.reduce(
              (acc, ch) => acc + (ch.children?.length ?? 0),
              0,
            )}
            개 조항을 인식했습니다.
          </p>
          <div className="rounded-lg border border-border/60 bg-background p-3">
            <ul className="space-y-0.5">
              {documentTree.map((chapter) => (
                <DocumentTreeItem
                  key={chapter.id}
                  node={chapter}
                  depth={0}
                />
              ))}
            </ul>
          </div>
        </section>

        {/* 핵심 요약 — 종합 답변 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-[#005BAC]" />
            핵심 변경 사항 요약
          </div>

          <div className="rounded-lg border border-border/60 bg-background p-4">
            {/* 종합 본문 */}
            <div className="space-y-3 text-sm leading-7 text-foreground">
              {summaryParagraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph.body}</p>
              ))}
            </div>

            {/* 출처 모음 — 하단 한 번에 */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-3">
              <span className="text-[10px] text-muted-foreground">
                인용 출처
              </span>
              {Array.from(
                new Set(summaryParagraphs.flatMap((p) => p.citations)),
              ).map((citeId) => {
                const snippet = citationSnippets[citeId]
                if (!snippet) return null
                return (
                  <Tooltip key={citeId}>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="cursor-help gap-1 border-[#005BAC]/40 bg-[#EEF7FF]/70 font-mono text-[10px] text-[#1B3A4B]"
                      >
                        <FileCheck2 className="h-3 w-3" />
                        {citeId}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-sm bg-foreground text-background"
                    >
                      <p className="text-[11px] font-semibold">
                        {snippet.label}
                      </p>
                      <p className="mt-1 text-[11px] leading-5">
                        {snippet.quote}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        </section>

        {/* 주요 인사이트 */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Lightbulb className="h-4 w-4 text-[#005BAC]" />
            주요 인사이트
          </div>
          <ul className="space-y-2">
            {documentInsights.map((insight, idx) => (
              <li
                key={idx}
                className="flex gap-2 rounded-lg border border-border/50 bg-background px-3 py-2.5 text-xs leading-5 text-foreground"
              >
                <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EEF7FF] text-[10px] font-semibold text-[#005BAC]">
                  {idx + 1}
                </span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 안내 문구 */}
        <p className="text-[11px] leading-5 text-muted-foreground">
          ※ 본 요약은 업로드하신 문서 원문을 기반으로 생성되었습니다. 출처가
          확인된 구절만 인용하며, 원문에 존재하지 않는 정보는 포함하지 않습니다.
        </p>
      </div>
    </TooltipProvider>
  )
}

function DocumentTreeItem({
  node,
  depth,
}: {
  node: DocumentTreeNode
  depth: number
}) {
  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded py-1 text-sm text-foreground",
          depth === 0
            ? "font-semibold"
            : "font-normal text-muted-foreground",
        )}
        style={{ paddingLeft: depth * 16 }}
      >
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        {node.title}
      </div>
      {node.children && node.children.length > 0 ? (
        <ul className="space-y-0.5">
          {node.children.map((child) => (
            <DocumentTreeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

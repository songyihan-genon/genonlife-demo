"use client"

import { useState } from "react"
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Code2,
  FileSpreadsheet,
  Lightbulb,
  TableProperties,
} from "lucide-react"
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import {
  analysisChartData,
  analysisInsights,
  analysisMetrics,
  dataColumns,
  generatedPythonCode,
} from "./mock-data"

interface DataAnalysisModeProps {
  className?: string
}

/**
 * 데이터분석 모드 — 사용자에게 보이는 분석 리포트 형태.
 *
 * 파이프라인 단계(①②③)나 기술 설명 태그 없이, 분석 결과를 자연스럽게 전달한다.
 * 구성: 파일 구조 확인 → 분석 결과 (차트 + 지표) → 주요 인사이트 → 분석 코드 (접기)
 */
export function DataAnalysisMode({ className }: DataAnalysisModeProps) {
  const [codeOpen, setCodeOpen] = useState(false)

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* 파일 구조 확인 */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <TableProperties className="h-4 w-4 text-[#005BAC]" />
          파일 구조 확인
        </div>
        <p className="text-xs text-muted-foreground">
          업로드하신 파일에서 {dataColumns.length}개 컬럼을 인식했습니다.
        </p>
        <div className="overflow-hidden rounded-lg border border-border/60 bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">컬럼명</TableHead>
                <TableHead className="w-[18%]">데이터 유형</TableHead>
                <TableHead>예시값</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataColumns.map((col) => (
                <TableRow key={col.name}>
                  <TableCell className="font-medium text-foreground">
                    {col.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px]"
                    >
                      {col.dtype}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {col.examples.join(" · ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* 분석 결과 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <BarChart3 className="h-4 w-4 text-[#005BAC]" />
          상담유형별 평균 처리시간 분석 결과
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* 차트 */}
          <div className="rounded-lg border border-border/60 bg-background p-3">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={analysisChartData}
                margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "#475569" }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#475569" }}
                  label={{
                    value: "분",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 11,
                    fill: "#475569",
                  }}
                />
                <ReTooltip
                  cursor={{ fill: "#005BAC1A" }}
                  formatter={(value: number, key: string) =>
                    key === "avgMinutes"
                      ? [`${value}분`, "평균 처리시간"]
                      : [value, key]
                  }
                />
                <Bar
                  dataKey="avgMinutes"
                  radius={[4, 4, 0, 0]}
                  fill="#005BAC"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 지표 카드 */}
          <div className="flex flex-col gap-2">
            {analysisMetrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2"
              >
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {metric.value}
                  </p>
                </div>
                {metric.delta ? (
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {metric.delta}
                  </span>
                ) : null}
              </div>
            ))}
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
          {analysisInsights.map((insight, idx) => (
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

      {/* 분석에 사용된 코드 (접기/펴기) */}
      <Collapsible open={codeOpen} onOpenChange={setCodeOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50"
          >
            {codeOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            <Code2 className="h-3.5 w-3.5" />
            분석에 사용된 코드 보기
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <pre className="max-h-72 overflow-auto rounded-lg border border-border/60 bg-[#0f172a] p-4 font-mono text-[11px] leading-5 text-slate-100">
            {generatedPythonCode}
          </pre>
        </CollapsibleContent>
      </Collapsible>

      {/* 안내 문구 — 요구사항: 모든 분석 결과 하단에 고정 표시 */}
      <p className="text-[11px] leading-5 text-muted-foreground">
        ※ 본 분석 결과는 업로드하신 데이터를 기준으로 생성되었습니다. 원본 데이터의 품질·범위에 따라 결과가 달라질 수 있습니다.
      </p>
    </div>
  )
}

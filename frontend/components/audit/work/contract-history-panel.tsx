import { AlertCircle, History } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ContractHistoryRow } from "@/lib/audit/types"

interface ContractHistoryPanelProps {
  contractId: string
  rows: ContractHistoryRow[]
  summary: string
  emphasis?: string
}

export function ContractHistoryPanel({ contractId, rows, summary, emphasis }: ContractHistoryPanelProps) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">계약별 이력</h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{contractId}</span>
      </header>

      <p className="border-b border-border bg-input/50 px-4 py-2 text-xs text-muted-foreground">
        동일 계약의 과거 검수 이력입니다.
      </p>

      <table className="w-full text-sm">
        <thead className="bg-input/30 text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th className="w-[110px] whitespace-nowrap px-3 py-2 text-left font-semibold">검수일</th>
            <th className="w-[140px] px-3 py-2 text-left font-semibold">콜ID</th>
            <th className="w-[70px] px-3 py-2 text-left font-semibold">누락</th>
            <th className="px-3 py-2 text-left font-semibold">미수행 항목</th>
            <th className="w-[140px] px-3 py-2 text-left font-semibold">최종 판정</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.callId} className="border-b border-border/60 last:border-b-0">
              <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted-foreground">{row.date}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-foreground/85">{row.callId}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-foreground/85">{row.missingCount}</td>
              <td className="px-3 py-2.5 text-foreground/85">{row.missingItems}</td>
              <td className="px-3 py-2.5">
                <span
                  className={cn(
                    "rounded border px-2 py-0.5 text-xs font-medium",
                    row.isNormal
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700",
                  )}
                >
                  {row.finalVerdict}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-start gap-2 border-t border-border bg-amber-50/60 px-4 py-3">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
        <p className="text-xs leading-relaxed text-amber-900">
          <span className="font-semibold">패턴 분석 · </span>
          {summary}
          {emphasis && (
            <>
              {" "}
              <strong className="font-bold">{emphasis}</strong>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

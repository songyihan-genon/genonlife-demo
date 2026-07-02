import { Check, ListChecks, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChecklistItem } from "@/lib/audit/types"

interface ChecklistPanelProps {
  items: ChecklistItem[]
}

export function ChecklistPanel({ items }: ChecklistPanelProps) {
  const missedCount = items.filter((it) => !it.done).length
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">매뉴얼 항목별 수행 여부</h2>
        </div>
        <span className="text-[11px] text-muted-foreground">
          총 {items.length}개 항목 중{" "}
          <span className="font-semibold text-red-600">{missedCount}개</span> 미수행
        </span>
      </header>

      <p className="border-b border-border bg-input/50 px-4 py-2 text-xs text-muted-foreground">
        미수행 항목은 행 전체가 옅은 빨간색으로 표시됩니다. 위치는 통화 내 해당 발화의 위치를 의미합니다.
      </p>

      <table className="w-full text-sm">
        <thead className="bg-input/30 text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th className="w-[40px] px-3 py-2 text-left font-semibold">#</th>
            <th className="px-3 py-2 text-left font-semibold">매뉴얼 항목</th>
            <th className="w-[80px] px-3 py-2 text-center font-semibold">수행</th>
            <th className="w-[100px] px-3 py-2 text-left font-semibold">위치</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.no}
              className={cn(
                "border-b border-border/60 last:border-b-0",
                !item.done && "bg-red-50/40",
              )}
            >
              <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                {item.no}
              </td>
              <td
                className={cn(
                  "px-3 py-2.5 text-foreground",
                  !item.done && "font-medium text-red-900",
                )}
              >
                {item.item}
              </td>
              <td className="px-3 py-2.5 text-center">
                {item.done ? (
                  <Check className="mx-auto h-4 w-4 text-emerald-500" />
                ) : (
                  <X className="mx-auto h-4 w-4 text-red-500" strokeWidth={2.5} />
                )}
              </td>
              <td
                className={cn(
                  "px-3 py-2.5 font-mono text-xs",
                  item.done ? "text-muted-foreground" : "font-semibold text-red-600",
                )}
              >
                {item.location}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

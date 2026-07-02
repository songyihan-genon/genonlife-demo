import { AlertCircle, Headphones, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AIVerdict, CaseDetail, DialogTurn, WorkCaseDetail } from "@/lib/audit/types"

interface ConversationPanelProps {
  detail: CaseDetail | WorkCaseDetail | null
}

export function ConversationPanel({ detail }: ConversationPanelProps) {
  if (!detail) {
    return <EmptyPanel title="상담 대화" hint="리스트에서 건을 선택하세요." />
  }
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-semibold text-foreground">상담 대화</h2>
        <span className="font-mono text-xs text-muted-foreground">콜ID · {detail.callId}</span>
      </header>

      <div className="flex flex-col gap-3 px-4 py-4">
        {detail.dialog.map((turn, idx) => (
          <DialogBubble key={idx} turn={turn} />
        ))}

        <VerdictBox verdict={detail.verdict} />
      </div>
    </div>
  )
}

function VerdictBox({ verdict }: { verdict: AIVerdict }) {
  const chipLabel =
    verdict.kind === "misguidance"
      ? verdict.result === "misguidance"
        ? "오안내"
        : "올바른 안내"
      : `누락 ${verdict.missingCount}건`

  return (
    <div className="mt-2 rounded-md border border-red-200 bg-red-50/70 px-4 py-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <p className="text-sm font-semibold text-red-900">
          AI 1차 검수 결과
          <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-700">
            {chipLabel}
          </span>
        </p>
      </div>

      {verdict.kind === "missing" && verdict.missingItems.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="mr-1 text-xs font-semibold text-foreground">미수행 항목 ·</span>
          {verdict.missingItems.map((item) => (
            <span
              key={item}
              className="rounded-md border border-red-200 bg-white px-2 py-0.5 text-xs font-medium text-red-700"
            >
              {item}
            </span>
          ))}
        </div>
      )}

      <p className="mt-2 text-sm leading-relaxed text-foreground/85">
        <span className="font-semibold text-foreground">판단 근거 · </span>
        {verdict.reason}
      </p>
    </div>
  )
}

function DialogBubble({ turn }: { turn: DialogTurn }) {
  const isCustomer = turn.speaker === "customer"
  return (
    <div className={cn("flex gap-2", isCustomer ? "justify-start" : "justify-end")}>
      {isCustomer && (
        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-input text-muted-foreground">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
      <div className={cn("flex max-w-[78%] flex-col gap-1", isCustomer ? "items-start" : "items-end")}>
        <span className="text-[11px] text-muted-foreground">
          {isCustomer ? "고객" : "상담사"} · {turn.time}
        </span>
        <p
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            isCustomer
              ? "rounded-bl-sm bg-input text-foreground"
              : "rounded-br-sm bg-primary text-primary-foreground",
          )}
        >
          {turn.text}
        </p>
      </div>
      {!isCustomer && (
        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Headphones className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  )
}

function EmptyPanel({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex min-h-[240px] flex-col rounded-lg border border-dashed border-border bg-card shadow-sm">
      <header className="border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </header>
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {hint}
      </div>
    </div>
  )
}

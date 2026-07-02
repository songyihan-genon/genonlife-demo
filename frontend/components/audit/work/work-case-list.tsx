"use client"

import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { TOTAL_CALLS, WORK_AUDIT_CASES } from "@/lib/audit/work-mock-data"
import type { AuditStatus, WorkAuditCase } from "@/lib/audit/types"

interface WorkCaseListProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

export function WorkCaseList({ selectedId, onSelect }: WorkCaseListProps) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-semibold text-foreground">업무누락 대상 리스트</h2>
        <p className="text-xs text-muted-foreground">
          총 <span className="font-semibold text-foreground">{WORK_AUDIT_CASES.length}건</span>{" "}
          (검수 대상 {TOTAL_CALLS.toLocaleString()}콜 중)
        </p>
      </div>

      <ScrollArea className="h-[240px]">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-10 bg-input text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border">
              <Th className="w-[140px]">접수 ID</Th>
              <Th className="w-[110px]">고객/콜ID</Th>
              <Th className="w-[150px]">계약번호</Th>
              <Th className="w-[110px]">상담사</Th>
              <Th className="w-[80px]">접촉시점</Th>
              <Th>미수행 항목</Th>
              <Th className="w-[80px]">누락 개수</Th>
              <Th className="w-[100px]">상태</Th>
            </tr>
          </thead>
          <tbody>
            {WORK_AUDIT_CASES.map((row) => (
              <CaseRow
                key={row.id}
                row={row}
                isSelected={selectedId === row.id}
                onClick={() => onSelect(row.id)}
              />
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  )
}

function CaseRow({
  row,
  isSelected,
  onClick,
}: {
  row: WorkAuditCase
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "cursor-pointer border-b border-border/60 transition-colors",
        "[&>td:first-child]:border-l-[3px]",
        isSelected
          ? "bg-primary/10 font-medium [&>td:first-child]:border-l-primary"
          : "hover:bg-input/60 [&>td:first-child]:border-l-transparent",
      )}
    >
      <Td className="font-mono text-xs">{row.id}</Td>
      <Td>
        <span className="text-foreground">{row.customerId}</span>
        <span className="mx-1 text-muted-foreground">/</span>
        <span className="text-muted-foreground">{row.callId}</span>
      </Td>
      <Td className="font-mono text-xs text-muted-foreground">{row.contractId}</Td>
      <Td>{row.agentName}</Td>
      <Td className="font-mono text-xs text-muted-foreground">{row.contactTime}</Td>
      <Td className="text-foreground/85">{row.missingItems}</Td>
      <Td>
        <MissingRatio ratio={row.missingRatio} />
      </Td>
      <Td>
        <StatusBadge status={row.status} />
      </Td>
    </tr>
  )
}

function MissingRatio({ ratio }: { ratio: string }) {
  const [missed, total] = ratio.split("/")
  return (
    <span className="font-mono text-sm">
      <span className="font-bold text-red-600">{missed}</span>
      <span className="text-muted-foreground">/{total}</span>
    </span>
  )
}

function StatusBadge({ status }: { status: AuditStatus }) {
  if (status === "review") {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
      >
        검수 대기
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
    >
      검수 완료
    </Badge>
  )
}

function Th({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <th className={cn("px-3 py-2 text-left text-[11px] font-semibold", className)}>
      {children}
    </th>
  )
}

function Td({ className, children }: { className?: string; children: ReactNode }) {
  return <td className={cn("px-3 py-2.5 text-foreground", className)}>{children}</td>
}

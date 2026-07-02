"use client"

import type { ReactNode } from "react"
import { Calendar as CalendarIcon, Download, Search, UserCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CENTER_OPTIONS, CONSULT_TYPE_OPTIONS } from "@/lib/audit/mock-data"
import type { FilterState } from "@/lib/audit/types"

interface FilterBarProps {
  value: FilterState
  onChange: (next: FilterState) => void
}

export function FilterBar({ value, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-semibold text-foreground">조회 조건</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserCircle2 className="h-3.5 w-3.5" />
          본사 운영팀 이검수
          <span className="mx-1 text-border">·</span>
          조회 권한 <span className="font-medium text-foreground">전체</span>
        </span>
      </header>
      <div className="flex flex-wrap items-end gap-4 p-4">
      <Field
        label="접촉일자"
        hint="당일 기준 30일 이전까지 선택 가능"
      >
        <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-input px-3 text-sm">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{value.contactDate}</span>
        </div>
      </Field>

      <Field label="센터">
        <Select
          value={value.center}
          onValueChange={(v) => onChange({ ...value, center: v })}
        >
          <SelectTrigger className="h-9 w-44 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CENTER_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="상담유형">
        <Select
          value={value.consultType}
          onValueChange={(v) => onChange({ ...value, consultType: v })}
        >
          <SelectTrigger className="h-9 w-44 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONSULT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" className="h-9 gap-2">
          <Search className="h-4 w-4" />
          조회
        </Button>
        <Button size="sm" variant="outline" className="h-9 gap-2">
          <Download className="h-4 w-4" />
          엑셀 다운로드
        </Button>
      </div>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  )
}

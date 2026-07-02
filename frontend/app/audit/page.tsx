"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { ActionBar } from "@/components/audit/action-bar"
import { CaseList } from "@/components/audit/case-list"
import { ConversationPanel } from "@/components/audit/conversation-panel"
import { FilterBar } from "@/components/audit/filter-bar"
import { SokPanel } from "@/components/audit/sok-panel"
import { ChecklistPanel } from "@/components/audit/work/checklist-panel"
import { ContractHistoryPanel } from "@/components/audit/work/contract-history-panel"
import { WorkCaseList } from "@/components/audit/work/work-case-list"
import { AUDIT_CASES, DEFAULT_FILTER, getCaseDetail } from "@/lib/audit/mock-data"
import { WORK_AUDIT_CASES, getWorkCaseDetail } from "@/lib/audit/work-mock-data"
import type { FilterState } from "@/lib/audit/types"

export default function AuditPage() {
  const searchParams = useSearchParams()
  const mode = searchParams?.get("mode") === "work" ? "work" : "guidance"

  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [guidanceId, setGuidanceId] = useState<string | null>(AUDIT_CASES[0].id)
  const [workId, setWorkId] = useState<string | null>(WORK_AUDIT_CASES[0].id)

  const guidanceDetail = getCaseDetail(guidanceId)
  const workDetail = getWorkCaseDetail(workId)

  const detailHint =
    mode === "guidance"
      ? "좌측 리스트에서 선택한 건의 상담 내용과 AI 검수 근거를 확인합니다."
      : "좌측 리스트에서 선택한 건의 상담 내용과 매뉴얼 수행 여부, 계약별 이력을 확인합니다."

  return (
    <div className="flex flex-col gap-4">
      <FilterBar value={filter} onChange={setFilter} />

      {mode === "guidance" ? (
        <CaseList selectedId={guidanceId} onSelect={setGuidanceId} />
      ) : (
        <WorkCaseList selectedId={workId} onSelect={setWorkId} />
      )}

      <div className="mt-2 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">선택 건 상세 검토</h2>
        <span className="text-xs text-muted-foreground">{detailHint}</span>
      </div>

      <div className="grid grid-cols-2 items-start gap-4">
        <ConversationPanel detail={mode === "guidance" ? guidanceDetail : workDetail} />
        {mode === "guidance" ? (
          <SokPanel detail={guidanceDetail} />
        ) : workDetail ? (
          <div className="flex flex-col gap-4">
            <ChecklistPanel items={workDetail.checklist} />
            <ContractHistoryPanel
              contractId={workDetail.contractId}
              rows={workDetail.history}
              summary={workDetail.historySummary}
              emphasis={workDetail.historyEmphasis}
            />
          </div>
        ) : null}
      </div>

      <ActionBar />
    </div>
  )
}

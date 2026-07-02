export type AuditStatus = "review" | "confirmed"

export type Speaker = "customer" | "agent"

export interface DialogTurn {
  speaker: Speaker
  time: string
  text: string
}

export type AIVerdict =
  | {
      kind: "misguidance"
      result: "misguidance" | "correct"
      reason: string
    }
  | {
      kind: "missing"
      missingItems: string[]
      missingCount: number
      totalCount: number
      reason: string
    }

export interface SokChunk {
  source: string
  content: string
  link: string
  highlight?: string
}

export interface AuditCase {
  id: string
  customerId: string
  callId: string
  agentName: string
  contactTime: string
  reason: string
  status: AuditStatus
}

export interface CaseDetail {
  callId: string
  dialog: DialogTurn[]
  verdict: AIVerdict
  knowledgeChunks: SokChunk[]
  highlightChunk: string
}

export interface FilterState {
  contactDate: string
  center: string
  consultType: string
}

export interface ChecklistItem {
  no: number
  item: string
  done: boolean
  location: string
  expectedScript?: string
}

export interface ContractHistoryRow {
  date: string
  callId: string
  missingCount: string
  missingItems: string
  finalVerdict: string
  isNormal: boolean
}

export interface WorkAuditCase {
  id: string
  customerId: string
  callId: string
  contractId: string
  agentName: string
  contactTime: string
  missingItems: string
  missingRatio: string
  status: AuditStatus
}

export interface WorkCaseDetail {
  callId: string
  contractId: string
  dialog: DialogTurn[]
  verdict: AIVerdict
  checklist: ChecklistItem[]
  history: ContractHistoryRow[]
  historySummary: string
  historyEmphasis?: string
}

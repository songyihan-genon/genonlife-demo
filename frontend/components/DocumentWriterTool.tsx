"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileUploadBox } from "@/components/FileUploadBox"
import { Check, ChevronDown, ChevronUp, Copy, CopyCheck, Download, FileText, Loader2, Minus, Plus, RotateCcw, Save, Settings2, Sparkles } from "lucide-react"
import { documentWritingTools } from "@/lib/document-writing-demo-history"
import type { DocumentWritingTool } from "@/lib/document-writing-demo-history"

// ─────────────────────────────────────────────
// Diff helpers (SFR-018: 원문-교정본 대조 뷰)
// ─────────────────────────────────────────────

type LineDiffRow =
  | { type: "same";    left: string; right: string; leftNum: number; rightNum: number }
  | { type: "removed"; left: string;                leftNum: number }
  | { type: "added";                 right: string;                  rightNum: number }
  | { type: "changed"; left: string; right: string; leftNum: number; rightNum: number }

function computeLineDiff(oldStr: string, newStr: string): LineDiffRow[] {
  const oldLines = oldStr.split("\n")
  const newLines = newStr.split("\n")
  const m = oldLines.length
  const n = newLines.length

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])

  const raw: { type: "same" | "removed" | "added"; line: string }[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      raw.unshift({ type: "same", line: oldLines[i - 1] }); i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      raw.unshift({ type: "added", line: newLines[j - 1] }); j--
    } else {
      raw.unshift({ type: "removed", line: oldLines[i - 1] }); i--
    }
  }

  const rows: LineDiffRow[] = []
  let ln = 1, rn = 1, p = 0
  while (p < raw.length) {
    const cur = raw[p]
    if (cur.type === "same") {
      rows.push({ type: "same", left: cur.line, right: cur.line, leftNum: ln++, rightNum: rn++ }); p++
    } else if (cur.type === "removed") {
      const next = raw[p + 1]
      if (next?.type === "added") {
        rows.push({ type: "changed", left: cur.line, right: next.line, leftNum: ln++, rightNum: rn++ }); p += 2
      } else {
        rows.push({ type: "removed", left: cur.line, leftNum: ln++ }); p++
      }
    } else {
      rows.push({ type: "added", right: cur.line, rightNum: rn++ }); p++
    }
  }
  return rows
}

function DiffView({ original, polished }: { original: string; polished: string }) {
  const rows = computeLineDiff(original, polished)

  const LineNum = ({ n, className }: { n?: number; className?: string }) => (
    <span className={`w-10 shrink-0 text-right pr-3 select-none text-[11px] py-[3px] ${className ?? ""}`}>
      {n ?? ""}
    </span>
  )

  return (
    <div className="rounded-lg border border-border overflow-hidden text-[13px] leading-6">
      {/* Header */}
      <div className="grid grid-cols-2 bg-muted/40 border-b text-[11px] font-medium text-muted-foreground">
        <div className="flex items-center gap-2 px-3 py-1.5 border-r">
          <span className="h-2 w-2 rounded-full bg-rose-400 inline-block" />원문
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />교정본
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/40 font-mono">
        {rows.map((row, idx) => {
          if (row.type === "same") return (
            <div key={idx} className="grid grid-cols-2">
              <div className="flex border-r border-border/40">
                <LineNum n={row.leftNum} className="text-muted-foreground/40 bg-muted/10" />
                <span className="px-3 py-[3px] whitespace-pre-wrap font-sans text-foreground/70 flex-1">{row.left || " "}</span>
              </div>
              <div className="flex">
                <LineNum n={row.rightNum} className="text-muted-foreground/40 bg-muted/10" />
                <span className="px-3 py-[3px] whitespace-pre-wrap font-sans text-foreground/70 flex-1">{row.right || " "}</span>
              </div>
            </div>
          )

          if (row.type === "removed") return (
            <div key={idx} className="grid grid-cols-2 bg-rose-50/60 dark:bg-rose-950/20">
              <div className="flex border-r border-rose-200/60 dark:border-rose-900/30">
                <LineNum n={row.leftNum} className="text-rose-400/70 bg-rose-100/50 dark:bg-rose-900/20" />
                <span className="px-3 py-[3px] whitespace-pre-wrap font-sans text-rose-800 dark:text-rose-300 flex-1">{row.left || " "}</span>
              </div>
              <div className="flex bg-muted/5">
                <LineNum className="bg-muted/10" />
                <span className="flex-1" />
              </div>
            </div>
          )

          if (row.type === "added") return (
            <div key={idx} className="grid grid-cols-2 bg-emerald-50/60 dark:bg-emerald-950/20">
              <div className="flex border-r border-border/40 bg-muted/5">
                <LineNum className="bg-muted/10" />
                <span className="flex-1" />
              </div>
              <div className="flex">
                <LineNum n={row.rightNum} className="text-emerald-500/70 bg-emerald-100/50 dark:bg-emerald-900/20" />
                <span className="px-3 py-[3px] whitespace-pre-wrap font-sans text-emerald-800 dark:text-emerald-300 flex-1">{row.right || " "}</span>
              </div>
            </div>
          )

          // changed
          return (
            <div key={idx} className="grid grid-cols-2">
              <div className="flex border-r border-rose-200/60 dark:border-rose-900/30 bg-rose-50/60 dark:bg-rose-950/20">
                <LineNum n={row.leftNum} className="text-rose-400/70 bg-rose-100/50 dark:bg-rose-900/20" />
                <span className="px-3 py-[3px] whitespace-pre-wrap font-sans text-rose-800 dark:text-rose-300 flex-1">{row.left || " "}</span>
              </div>
              <div className="flex bg-emerald-50/60 dark:bg-emerald-950/20">
                <LineNum n={row.rightNum} className="text-emerald-500/70 bg-emerald-100/50 dark:bg-emerald-900/20" />
                <span className="px-3 py-[3px] whitespace-pre-wrap font-sans text-emerald-800 dark:text-emerald-300 flex-1">{row.right || " "}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Download helpers
// ─────────────────────────────────────────────

function triggerBlobDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function buildFAQText(items: FAQItem[], title: string, sourceFile?: string): string {
  return [
    title,
    "제논라이프 내부 직원 관점으로 생성된 FAQ입니다.",
    "※ 본 자료는 AI 생성 참고 자료입니다. 근거 문서에 없는 내용은 포함되지 않으며, 해당 내용을 검토 후 사용해야 합니다.",
    sourceFile ? `근거 문서: ${sourceFile}` : "",
    "",
    ...items.flatMap((item, i) => [`Q${i + 1}. ${item.q}`, `A. ${item.a}`, ""]),
  ].join("\n")
}

// ─────────────────────────────────────────────
// Polish Panel (글다듬이) — SFR-018
// ─────────────────────────────────────────────

const SAMPLE_DRAFT =
  "신규 규정 시스템 4월 1일 오픈. 많은 사용 부탁드립니다."

const POLISH_RESULTS: Record<string, Record<string, string>> = {
  official: {
    polite:
      "신규 규정 시스템 오픈 안내의 건\n\n1. 귀 부서의 무궁한 발전을 기원합니다.\n2. 당 위원회는 업무 효율성을 제고하기 위하여 신규 규정 시스템을 구축 완료하였으며, 오는 4월 1일부로 정식 운용을 개시할 예정입니다.\n3. 원활한 업무 수행을 위하여 관련 임직원 여러분의 적극적인 활용을 권장해 드립니다.",
    formal:
      "신규 규정 시스템 운용 개시 공고\n\n본 위원회는 신규 규정 시스템 구축 완료에 따라 2026년 4월 1일부로 정식 운용을 개시함을 공고합니다.\n관련 임직원은 지정된 절차에 따라 적극 활용하시기 바랍니다.",
    friendly:
      "안녕하세요!\n\n새 규정 시스템이 드디어 완성됐습니다.\n4월 1일부터 정식으로 오픈되니 많이 활용해 주세요!\n여러분의 적극적인 참여를 기대합니다.",
    concise: "신규 규정 시스템 4월 1일 오픈. 임직원 적극 활용 바랍니다.",
  },
  mail: {
    polite:
      "안녕하세요.\n\n신규 규정 시스템 오픈 관련하여 안내드립니다.\n오는 4월 1일부터 신규 규정 시스템을 정식 운영할 예정이오니, 업무에 적극 활용해 주시기 바랍니다.\n\n감사합니다.",
    formal:
      "수신: 전 임직원\n제목: 신규 규정 시스템 오픈 안내\n\n신규 규정 시스템이 4월 1일 오픈됩니다. 해당 시스템을 업무에 활용하여 주시기 바랍니다.",
    friendly:
      "안녕하세요!\n\n드디어 새 규정 시스템이 4월 1일에 오픈됩니다.\n열심히 준비했으니 많이 사용해 주세요!\n\n감사합니다.",
    concise: "신규 규정 시스템 4월 1일 오픈 예정. 활용 바랍니다.",
  },
  press: {
    polite:
      "[보도자료]\n\n제논라이프, 신규 규정 관리 시스템 4월 1일 공식 오픈\n\n제논라이프는 내부 업무 효율화를 위해 신규 규정 관리 시스템을 구축하고, 오는 4월 1일부로 정식 서비스를 개시한다고 밝혔다.\n\n이번 시스템 구축을 통해 관련 업무 처리 시간 단축 및 정확도 향상이 기대된다.",
    formal: "[보도자료] 신규 규정 시스템 4월 1일 오픈. 위원회 업무 효율 제고 기대.",
    friendly: "[보도자료] 제논라이프가 새 규정 시스템을 4월 1일 오픈합니다. 많은 관심 바랍니다.",
    concise: "[보도자료] 신규 규정 시스템 4/1 오픈. 업무 효율 개선 기대.",
  },
  customer: {
    polite:
      "안녕하세요, 고객님.\n\n제논라이프입니다.\n\n당사는 더 나은 서비스 제공을 위해 신규 규정 관리 시스템을 도입하였습니다.\n4월 1일부로 개선된 서비스를 경험하실 수 있습니다.\n\n불편 사항은 고객센터(1600-XXXX)로 연락 주시기 바랍니다.",
    formal: "신규 규정 시스템 오픈(4/1) 안내. 더 나은 서비스를 제공해 드리겠습니다.",
    friendly: "안녕하세요! 4월 1일부터 새 시스템으로 더 편리한 서비스가 시작됩니다.",
    concise: "4월 1일부터 신규 시스템 오픈. 서비스 개선 예정.",
  },
  post: {
    polite:
      "[공지] 신규 규정 시스템 4월 1일 오픈\n\n임직원 여러분, 안녕하세요.\n\n이번 4월 1일부터 신규 규정 관리 시스템이 정식 오픈됩니다.\n시스템 활용에 앞서 사전 교육을 이수해 주시기 바랍니다.\n\n문의: 정보시스템팀 내선 1234",
    formal: "[공지] 신규 규정 시스템 4월 1일 오픈. 사전 교육 후 이용 바랍니다.",
    friendly: "[공지] 새 규정 시스템 드디어 4월 1일 오픈! 많이 활용해 주세요.",
    concise: "[공지] 신규 규정 시스템 4/1 오픈. 교육 후 이용.",
  },
  audit: {
    polite:
      "심사 의견:\n\n신규 규정 관리 시스템의 2026년 4월 1일 운용 개시에 따라, 관련 내부 통제 절차 및 접근 권한 관리 방안에 대한 검토가 필요합니다.\n시스템 도입 전 위험 평가 보고서 제출을 권고합니다.",
    formal: "심사 의견: 신규 시스템 4/1 오픈 관련 내부 통제 점검 필요.",
    friendly: "새 시스템 오픈 전에 내부 통제 절차를 검토해 주세요.",
    concise: "신규 시스템 4/1 오픈. 내부 통제 점검 권고.",
  },
}

function getPolishResult(docType: string, tone: string, draft: string): string {
  return POLISH_RESULTS[docType]?.[tone]
    ?? `[${docType} · ${tone}]\n\n${draft.trim()}\n\n(핵심 사실관계 유지 · AI 참고 초안)`
}

export function PolishPanel() {
  const [draftText, setDraftText] = useState(SAMPLE_DRAFT)
  const [docType, setDocType] = useState("official")
  const [tone, setTone] = useState("polite")
  const [result, setResult] = useState<string>(() => getPolishResult("official", "polite", SAMPLE_DRAFT))
  const [isLoading, setIsLoading] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [copied, setCopied] = useState(false)

  // 자원 관리 모달
  const [showResourceModal, setShowResourceModal] = useState(false)
  const defaultResourceSettings = {
    maxInputChars: 4000,
    allowMail: true,
    allowPost: true,
    allowPress: true,
    allowOfficial: true,
    allowCustomer: true,
    allowAudit: true,
  }
  const [resourceSettings, setResourceSettings] = useState(defaultResourceSettings)
  const [resourceSaved, setResourceSaved] = useState(false)

  function handleResourceSave() {
    setResourceSaved(true)
    setTimeout(() => setResourceSaved(false), 2500)
  }
  function handleResourceReset() {
    setResourceSettings(defaultResourceSettings)
    setResourceSaved(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePolish = async () => {
    if (!draftText.trim()) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setResult(getPolishResult(docType, tone, draftText))
    setShowDiff(false)
    setIsLoading(false)
  }

  const handleReset = () => {
    setDraftText("")
    setResult("")
    setShowDiff(false)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Options bar */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b bg-muted/20 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">문서 유형</span>
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger className="h-7 text-xs w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mail">메일</SelectItem>
              <SelectItem value="post">게시글</SelectItem>
              <SelectItem value="press">보도자료</SelectItem>
              <SelectItem value="official">공문</SelectItem>
              <SelectItem value="customer">고객 발송 문구</SelectItem>
              <SelectItem value="audit">심사 입력</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">톤</span>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="h-7 text-xs w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">공식적</SelectItem>
              <SelectItem value="polite">정중한</SelectItem>
              <SelectItem value="friendly">친근한</SelectItem>
              <SelectItem value="concise">간결한</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {result && (
          <button
            type="button"
            onClick={() => setShowDiff(!showDiff)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors ${
              showDiff
                ? "bg-[#005BAC]/10 border-[#005BAC] text-[#005BAC]"
                : "bg-card border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {showDiff ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            원문-교정본 대조
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowResourceModal(true)}
          className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 bg-muted/30 hover:bg-muted transition-colors"
        >
          <Settings2 className="h-3 w-3" />
          관리자 설정
        </button>
      </div>

      {/* Split panels */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Input */}
        <div className="flex-1 flex flex-col border-r min-w-0">
          <div className="px-5 py-2 bg-muted/10 border-b shrink-0">
            <span className="text-sm font-semibold">초안 입력</span>
          </div>
          <Textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="내용을 입력해주세요."
            className="flex-1 min-h-0 resize-none rounded-none border-0 focus-visible:ring-0 text-sm leading-7 px-5 py-4"
          />
          <div className="px-5 py-3 border-t bg-background shrink-0 flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={!draftText && !result}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
            <Button
              onClick={handlePolish}
              disabled={!draftText.trim() || isLoading}
              className="bg-[#005BAC] hover:bg-[#005BAC]/90 text-white"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />처리 중...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />다듬기</>
              )}
            </Button>
          </div>
        </div>

        {/* Right: Result */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 py-2 bg-[#005BAC]/5 border-b shrink-0 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#005BAC]">
              {showDiff ? "원문-교정본 대조" : "다듬기 결과"}
            </span>
            {result && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#005BAC] bg-[#005BAC]/10 px-2 py-0.5 rounded-full">AI 생성</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="클립보드에 복사"
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  {copied ? (
                    <><CopyCheck className="h-3 w-3 text-emerald-600" /><span className="text-emerald-600">복사됨</span></>
                  ) : (
                    <><Copy className="h-3 w-3" />복사</>
                  )}
                </button>
              </div>
            )}
          </div>

          {result ? (
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {showDiff ? (
                <DiffView original={draftText} polished={result} />
              ) : (
                <pre className="text-sm leading-7 whitespace-pre-wrap font-sans">{result}</pre>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center px-8 py-6">
              <div className="text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">다듬기 시작을 눌러주세요.</p>
                <p className="text-xs mt-1 opacity-70">최대 4,000자까지 정제 가능합니다.</p>
              </div>
            </div>
          )}

          {result && (
            <div className="px-5 py-2 border-t text-xs text-sky-700 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-900/10 shrink-0 space-y-0.5">
              <p>※ 본 결과는 AI가 생성한 참고 초안입니다. 담당자 검토 후 활용하시기 바랍니다.</p>
              {showDiff && (
                <p className="text-[11px] opacity-70">좌측 원문과 우측 교정본을 나란히 비교합니다.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 자원 관리 모달 */}
      <Dialog open={showResourceModal} onOpenChange={setShowResourceModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4 text-[#005BAC]" />
              자원 관리 설정
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {/* 입력 제한 설정 */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">입력 제한 설정</p>
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">최대 입력 글자 수</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={500}
                      max={20000}
                      step={500}
                      value={resourceSettings.maxInputChars}
                      onChange={(e) => setResourceSettings((s) => ({ ...s, maxInputChars: Math.min(20000, Math.max(500, parseInt(e.target.value) || 500)) }))}
                      className="w-20 h-7 text-center text-sm font-medium rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-[#005BAC]/30"
                    />
                    <span className="text-xs text-muted-foreground">자</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 문서 유형 허용 설정 */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">허용 문서 유형</p>
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div className="grid grid-cols-3 gap-y-2.5">
                  {(
                    [
                      { key: "allowMail", label: "메일" },
                      { key: "allowPost", label: "게시글" },
                      { key: "allowPress", label: "보도자료" },
                      { key: "allowOfficial", label: "공문" },
                      { key: "allowCustomer", label: "고객 발송" },
                      { key: "allowAudit", label: "심사 입력" },
                    ] as { key: keyof typeof defaultResourceSettings; label: string }[]
                  ).map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={resourceSettings[key] as boolean}
                        onChange={(e) => setResourceSettings((s) => ({ ...s, [key]: e.target.checked }))}
                        className="accent-[#005BAC] h-3.5 w-3.5"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleResourceReset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                초기화
              </button>
              <div className="flex items-center gap-2">
                {resourceSaved && (
                  <span className="text-xs text-green-600 font-medium">저장되었습니다.</span>
                )}
                <button
                  type="button"
                  onClick={handleResourceSave}
                  className="flex items-center gap-1.5 rounded-lg bg-[#005BAC] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#005BAC]/90 transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  저장
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─────────────────────────────────────────────
// Translation Panel (번역) — SFR-018
// ─────────────────────────────────────────────

const LANGS = [
  { value: "en", label: "영어 (EN)" },
  { value: "ko", label: "한국어 (KO)" },
]

const SAMPLE_ORIGINAL =
  "안녕하세요, 제논라이프입니다.\n상담을 시작하기 전에 본인 확인이 필요합니다.\n신분증을 제시해 주시겠습니까?\n\n현재 계약 및 요청 내용을 확인한 뒤, 고객별 상황에 맞는 안내를 제공해 드리겠습니다."

const DEMO_TRANSLATIONS: Record<string, { normal: string; colloquial: string }> = {
  en: {
    normal:
      "Hello, this is the Credit Counseling & Recovery Service (CCRS).\nWe require identity verification before beginning your consultation.\nCould you please present your identification?\n\nWe will review your current debt status and provide guidance on personalized debt restructuring options.",
    colloquial:
      "Hi there, you've reached the Credit Counseling & Recovery Service (CCRS).\nBefore we get started, I'll need to verify your identity.\nCould you show me your ID?\n\nLet's take a look at your current debt situation and find the best solution for you.",
  },
  ja: {
    normal:
      "こんにちは、信用回復委員会です。\nご相談を始める前に、本人確認が必要です。\n身分証明書をご提示いただけますか？\n\n現在の債務状況を確認し、個別の債務調整方法についてご案内いたします。",
    colloquial:
      "こんにちは！信用回復委員会です。\nお話を始める前に、身分証を見せていただけますか？\n\n今の借金の状況を一緒に確認して、最適な解決策をご提案します。",
  },
  zh_CN: {
    normal:
      "您好，这里是信用恢复委员会。\n在开始咨询之前，需要先验证您的身份。\n请您出示身份证件好吗？\n\n我们将核实您当前的债务状况，并为您提供个性化的债务调整方案。",
    colloquial:
      "您好！欢迎来到信用恢复委员会。\n在开始之前，能给我看一下您的证件吗？\n\n我们来看看您的债务情况，找到最适合您的解决方案。",
  },
  de: {
    normal:
      "Guten Tag, hier ist der Kreditberatungs- und Wiederherstellungsdienst (CCRS).\nBevor wir mit der Beratung beginnen, müssen wir Ihre Identität überprüfen.\nKönnten Sie bitte Ihren Ausweis vorzeigen?\n\nWir werden Ihre aktuelle Schuldensituation prüfen und individuelle Lösungsvorschläge erarbeiten.",
    colloquial:
      "Hallo! Hier ist der CCRS.\nBevor wir anfangen, brauchen wir kurz Ihren Ausweis.\n\nLassen Sie uns gemeinsam Ihre Schulden anschauen und die beste Lösung finden.",
  },
}

function getTranslation(lang: string, colloquial: boolean, inputText: string): string {
  const demo = DEMO_TRANSLATIONS[lang]
  if (demo) return colloquial ? demo.colloquial : demo.normal
  const label = LANGS.find((l) => l.value === lang)?.label ?? lang
  return `[${label} 번역 결과${colloquial ? " · 구어체" : ""}]\n\n${inputText.trim()}\n\n(위원회 도메인 영어사전 적용)`
}

function TranslationSideBySideView({ original, translated }: { original: string; translated: string }) {
  // Split into non-empty paragraph groups separated by blank lines
  const splitParagraphs = (text: string) => {
    const lines = text.split("\n")
    const groups: string[] = []
    let buf: string[] = []
    for (const line of lines) {
      if (line.trim() === "") {
        if (buf.length > 0) { groups.push(buf.join("\n")); buf = [] }
      } else {
        buf.push(line)
      }
    }
    if (buf.length > 0) groups.push(buf.join("\n"))
    return groups
  }

  const origParagraphs = splitParagraphs(original)
  const transParagraphs = splitParagraphs(translated)
  const len = Math.max(origParagraphs.length, transParagraphs.length)

  return (
    <div className="w-full text-sm font-sans">
      {/* Header row */}
      <div className="grid grid-cols-2 border-b bg-muted/40 sticky top-0 z-10">
        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground border-r">원문</div>
        <div className="px-4 py-2 text-xs font-semibold text-[#005BAC]">번역문</div>
      </div>
      {Array.from({ length: len }, (_, i) => {
        const orig = origParagraphs[i] ?? ""
        const trans = transParagraphs[i] ?? ""
        return (
          <div key={i} className="grid grid-cols-2 border-b border-border/50 hover:bg-muted/20 transition-colors">
            <div className="flex gap-3 px-4 py-3 border-r">
              <span className="shrink-0 w-5 text-right text-[11px] text-muted-foreground/50 select-none pt-0.5 leading-relaxed">{i + 1}</span>
              <p className="leading-relaxed whitespace-pre-wrap text-foreground/90">{orig}</p>
            </div>
            <div className="flex gap-3 px-4 py-3 bg-[#005BAC]/[0.02]">
              <span className="shrink-0 w-5 text-right text-[11px] text-muted-foreground/50 select-none pt-0.5 leading-relaxed">{trans ? i + 1 : ""}</span>
              <p className="leading-relaxed whitespace-pre-wrap text-foreground">{trans}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function TranslationPanel() {
  const [inputText, setInputText] = useState(SAMPLE_ORIGINAL)
  const [files, setFiles] = useState<File[]>([])
  const [lang, setLang] = useState("en")
  const [isColloquial, setIsColloquial] = useState(false)
  const [isDomainDict, setIsDomainDict] = useState(true)
  const [result, setResult] = useState<string>(() => getTranslation("en", false, SAMPLE_ORIGINAL))
  const [isLoading, setIsLoading] = useState(false)

  const hasInput = inputText.trim().length > 0 || files.length > 0

  const handleTranslate = async () => {
    if (!hasInput) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    if (files.length > 0) {
      const label = LANGS.find((l) => l.value === lang)?.label ?? lang
      setResult(
        `[${files[0].name} — ${label} 번역본]\n\nCredit Counseling & Recovery Service (CCRS) 업무 지침 번역 결과...\n(파일 업로드 시 OCR 추출 후 번역 처리됩니다.${isColloquial ? " 구어체 변환 적용." : ""})`,
      )
    } else {
      setResult(getTranslation(lang, isColloquial, inputText))
    }
    setIsLoading(false)
  }

  const handleReset = () => {
    setInputText("")
    setFiles([])
    setResult("")
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Options bar */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b bg-muted/20 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">목적 언어</span>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="h-7 text-xs w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGS.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          type="button"
          onClick={() => setIsColloquial(!isColloquial)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs transition-colors ${
            isColloquial
              ? "bg-[#005BAC]/10 border-[#005BAC] text-[#005BAC]"
              : "bg-card border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          {isColloquial && <Check className="h-3 w-3" />}
          구어체 변환
        </button>
        <button
          type="button"
          onClick={() => setIsDomainDict(!isDomainDict)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs transition-colors ${
            isDomainDict
              ? "bg-[#005BAC]/10 border-[#005BAC] text-[#005BAC]"
              : "bg-card border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          {isDomainDict && <Check className="h-3 w-3" />}
          위원회 도메인 영어사전
        </button>
      </div>

      {/* Split panels */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Input */}
        <div className="flex-1 flex flex-col border-r min-w-0">
          <div className="px-5 py-2 bg-muted/10 border-b shrink-0 flex items-center justify-between">
            <span className="text-sm font-semibold">원문</span>
            <span className="text-xs text-muted-foreground">텍스트 입력 또는 파일 업로드</span>
          </div>

          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="번역할 내용을 입력해주세요."
            disabled={files.length > 0}
            className="flex-1 min-h-0 resize-none rounded-none border-0 focus-visible:ring-0 text-sm leading-7 px-5 py-4 disabled:opacity-40"
          />

          <div className="px-4 py-3 border-t shrink-0">
            <FileUploadBox
              files={files}
              onFilesChange={(next) => {
                setFiles(next.slice(0, 1))
                if (next.length > 0) setInputText("")
              }}
              accept=".pdf,.hwp,.docx,.txt"
              placeholder="파일 업로드 (PDF, HWP, DOCX)"
              multiple={false}
            />
          </div>
          <div className="px-5 py-3 border-t bg-background shrink-0 flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={!hasInput && !result}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
            <Button
              onClick={handleTranslate}
              disabled={!hasInput || isLoading}
              className="bg-[#005BAC] hover:bg-[#005BAC]/90 text-white"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />번역 중...</>
              ) : (
                "번역하기"
              )}
            </Button>
          </div>
        </div>

        {/* Right: Result */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 py-2 bg-[#005BAC]/5 border-b shrink-0 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#005BAC]">원문 · 번역문 대조</span>
            {result && (
              <span className="text-[10px] text-[#005BAC] bg-[#005BAC]/10 px-2 py-0.5 rounded-full">
                {LANGS.find((l) => l.value === lang)?.label}
                {isColloquial ? " · 구어체" : ""}
              </span>
            )}
          </div>
          {result ? (
            <div className="flex-1 overflow-y-auto">
              <TranslationSideBySideView original={inputText || files[0]?.name || ""} translated={result} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center px-8 py-6">
              <div className="text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">번역 시작을 눌러주세요.</p>
                <p className="text-xs mt-1 opacity-70">원문 입력 또는 파일 업로드 후 번역하기를 누르세요.</p>
              </div>
            </div>
          )}
          {result && (
            <div className="px-5 py-2 border-t text-xs text-[#005BAC]/80 dark:text-[#005BAC]/60 bg-[#005BAC]/5 dark:bg-[#005BAC]/10 shrink-0">
              ※ {[isDomainDict && "위원회 도메인 영어사전", isColloquial && "구어체 변환"].filter(Boolean).join(" · ") || "기본 번역"}이 적용된 번역 결과입니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// FAQ Panel — SFR-018
// ─────────────────────────────────────────────

type FAQItem = { q: string; a: string }

const FAQ_DEMO_BANK: FAQItem[] = [
  { q: "외부망에서 사내 시스템 접속 시 필요한 절차는 무엇입니까?", a: "지침서 제3조에 근거하여, 사전에 등록된 VPN 클라이언트를 실행하고 이중 인증(2FA)을 완료한 후 접속해야 합니다." },
  { q: "업무용 PC의 비밀번호 변경 주기는 어떻게 됩니까?", a: "비밀번호는 최소 90일에 1회 이상 변경해야 하며, 변경 기한 7일 전부터 시스템 안내 팝업이 노출됩니다." },
  { q: "외부 USB 매체를 사용하려면 어떻게 해야 합니까?", a: "인가되지 않은 이동식 저장매체의 사용은 전면 금지되어 있습니다. 부득이한 경우 정보보안팀의 사전 승인 및 보안 USB 절차를 준수해야 합니다." },
  { q: "재택근무 시 사내 시스템 접속 방법은 무엇입니까?", a: "승인된 원격 근무 환경(VPN 필수)에서만 접속 가능하며, 개인 기기 사용은 별도 신청 절차가 필요합니다." },
  { q: "이상 징후 발견 시 어떻게 신고해야 합니까?", a: "정보보안 침해 신고 채널(내선 보안팀)을 통해 즉시 신고하고, 관련 증빙 자료를 보존해야 합니다." },
  { q: "개인정보 처리 방침 위반 시 제재 기준은 무엇입니까?", a: "위반 유형에 따라 경고, 감봉, 직위해제 등의 징계 처분이 부과되며, 형사 처벌로 이어질 수 있습니다." },
  { q: "신규 직원의 시스템 접근 권한은 어떻게 부여됩니까?", a: "부서장의 요청에 따라 IT 운영팀이 권한을 부여하며, 최소 권한 원칙에 따라 업무에 필요한 범위 내로 제한됩니다." },
  { q: "문서 보존 기간은 어떻게 됩니까?", a: "문서 종류에 따라 3~10년 이상의 보존 기간이 적용되며, 전자문서 관리 시스템에 의무적으로 등록해야 합니다." },
  { q: "사내 메신저에서 개인정보 공유가 가능합니까?", a: "승인된 내부 채널에서 업무 목적으로만 허용되며, 외부 메신저(카카오톡 등)를 통한 개인정보 전송은 금지됩니다." },
  { q: "정보보안 교육은 언제, 어떻게 이수해야 합니까?", a: "연 1회 이상 의무 이수이며, 사내 교육 시스템을 통해 온라인으로 완료할 수 있습니다. 미이수 시 경고 처분이 부과됩니다." },
  { q: "보험금 청구 시 기본 제출 서류는 무엇입니까?", a: "청구 유형에 따라 다르지만 통상 청구서, 신분증 사본, 진단서 또는 입퇴원 확인서, 영수증 등이 기본 서류로 요구될 수 있습니다." },
  { q: "추가 서류 요청을 받으면 어떻게 대응해야 합니까?", a: "안내받은 보완 서류를 준비해 고객센터나 모바일 채널을 통해 제출하면 되며, 접수 후 심사 일정은 별도 안내됩니다." },
  { q: "심사 진행 중 보완 요청이 반복되면 어떻게 됩니까?", a: "사안별로 필요한 근거 자료를 다시 요청할 수 있으며, 제출 완료 후 순차적으로 재심사가 진행됩니다." },
  { q: "보험금 청구 진행 중 다른 계약 변경도 동시에 요청할 수 있습니까?", a: "가능 여부는 업무 유형과 처리 단계에 따라 달라질 수 있어, 고객센터 또는 담당 부서를 통해 병행 처리 가능 여부를 확인하는 것이 좋습니다." },
  { q: "제논라이프 상담은 유료입니까?", a: "기본 고객 상담과 보험 관련 안내는 무료로 제공됩니다. 다만 상품 약관과 처리 기준에 따라 별도 수수료가 발생하는 업무는 개별 고지됩니다." },
  { q: "온라인으로 보험금 청구를 신청할 수 있습니까?", a: "제논라이프 홈페이지와 모바일 앱을 통해 온라인 청구가 가능하며, 추가 서류는 이미지 업로드 또는 별도 제출 방식으로 처리합니다." },
  { q: "보험금 청구와 계약 변경 요청의 차이는 무엇입니까?", a: "보험금 청구는 사고·진단 등 보장 사유에 대한 지급 심사 업무이고, 계약 변경은 수익자·주소·납입정보 등 계약 정보를 수정하는 업무입니다." },
  { q: "보험금 지급 완료 후 추가 확인 기간은 얼마나 됩니까?", a: "지급 완료 후에도 정산 내역이나 증빙 확인이 필요한 경우 일정 기간 추가 확인이 진행될 수 있으며, 상품별 기준은 개별 안내됩니다." },
  { q: "직원이 고객 정보를 외부에 공개할 수 있습니까?", a: "직원은 업무상 취득한 고객 정보를 외부에 공개하거나 제3자에게 제공하는 것이 엄격히 금지되며, 위반 시 내부 제재와 법적 책임이 발생할 수 있습니다." },
  { q: "보험금 청구 후 처리 기간은 얼마나 됩니까?", a: "접수 후 통상 수일에서 수주 내에 심사 결과가 안내되며, 사안이 복잡하거나 추가 서류가 필요한 경우 더 길어질 수 있습니다." },
]

const DEMO_FILE_NAME = "제논라이프_정보보안_업무지침_v2.pdf"

export function FAQPanel() {
  const [files, setFiles] = useState<File[]>([{ name: DEMO_FILE_NAME } as File])
  const [faqCount, setFaqCount] = useState(5)
  const [result, setResult] = useState<FAQItem[]>(() => FAQ_DEMO_BANK.slice(0, 5))
  const [isLoading, setIsLoading] = useState(false)

  // 자원 관리 모달
  const [showResourceModal, setShowResourceModal] = useState(false)
  const defaultResourceSettings = { maxFaqCount: 10, defaultFaqCount: 5, maxFileSizeMb: 50, allowPdf: true, allowHwp: true, allowDocx: true }
  const [resourceSettings, setResourceSettings] = useState(defaultResourceSettings)
  const [resourceSaved, setResourceSaved] = useState(false)

  function handleResourceSave() {
    setResourceSaved(true)
    setTimeout(() => setResourceSaved(false), 2500)
  }
  function handleResourceReset() {
    setResourceSettings(defaultResourceSettings)
    setResourceSaved(false)
  }

  const effectiveCount = Math.min(Math.max(faqCount || 5, 1), 20)
  const hasFile = files.length > 0

  const handleGenerate = async () => {
    if (!hasFile) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1500))
    setResult(FAQ_DEMO_BANK.slice(0, Math.min(effectiveCount, FAQ_DEMO_BANK.length)))
    setIsLoading(false)
  }

  const handleDownloadHWP = () => {
    if (!result) return
    const text = buildFAQText(result, "FAQ 생성 결과", files[0]?.name)
    triggerBlobDownload(text, "FAQ_생성결과.hwp", "application/octet-stream")
  }

  const handleDownloadPDF = () => {
    if (!result) return
    const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"/><title>FAQ 생성 결과</title>
<style>
body{font-family:'Malgun Gothic',sans-serif;padding:40px;font-size:13px;line-height:1.8;color:#1f2937}
h1{font-size:17px;border-bottom:2px solid #005BAC;padding-bottom:8px;color:#005BAC;margin-bottom:6px}
.meta{font-size:11px;color:#6b7280;margin-bottom:4px}
.notice{background:#fffbeb;border:1px solid #fcd34d;padding:8px 12px;border-radius:4px;font-size:11px;color:#92400e;margin-bottom:20px}
.item{margin-bottom:14px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden}
.q{background:#eff6ff;padding:10px 14px;font-weight:600;color:#1e40af;font-size:12px}
.a{padding:10px 14px;font-size:12px;color:#374151}
.source{font-size:10px;color:#9ca3af;margin-top:20px}
</style></head><body>
<h1>FAQ 생성 결과</h1>
<div class="meta">제논라이프 내부 직원 관점 · 근거 문서 기반</div>
<div class="notice">⚠ 본 자료는 AI 생성 참고 자료입니다. 근거 문서에 없는 내용은 포함하지 않았으나, 반드시 검토 후 사용해야 합니다.</div>
${result.map((item, i) => `<div class="item"><div class="q">Q${i + 1}. ${item.q}</div><div class="a">A. ${item.a}</div></div>`).join("")}
<div class="source">근거 문서: ${files[0]?.name ?? "업로드 문서"}</div>
</body></html>`
    triggerBlobDownload(html, "FAQ_생성결과.pdf", "application/pdf")
  }

  const handleReset = () => {
    setFiles([])
    setResult([])
    setFaqCount(5)
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full px-6 py-6 space-y-5">

        {/* File upload */}
        <div className="space-y-1.5">
          <p className="text-sm font-semibold">규정 문서 업로드</p>
          <FileUploadBox
            files={files}
            onFilesChange={(next) => {
              setFiles(next.slice(0, 1))
              setResult([])
            }}
            accept=".pdf,.hwp,.docx,.txt"
            placeholder="규정 문서를 업로드하세요 (PDF, HWP, DOCX · 최대 50MB)"
            multiple={false}
          />
        </div>

        {/* FAQ count */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">생성할 FAQ 개수</p>
            <button
              type="button"
              onClick={() => setShowResourceModal(true)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 bg-muted/30 hover:bg-muted transition-colors"
            >
              <Settings2 className="h-3 w-3" />
              관리자 설정
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFaqCount((v) => Math.max(1, v - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              min={1}
              max={20}
              value={faqCount}
              onChange={(e) => setFaqCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-16 h-8 text-center text-sm font-semibold rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-[#005BAC]/30"
            />
            <button
              type="button"
              onClick={() => setFaqCount((v) => Math.min(20, v + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm text-muted-foreground">개 (최대 20개)</span>
          </div>
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={!hasFile || isLoading}
          className="w-full bg-[#005BAC] hover:bg-[#005BAC]/90 text-white h-11"
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />FAQ 생성 중...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" />FAQ {effectiveCount}개 생성하기</>
          )}
        </Button>

        {/* Result */}
        {result.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-900/10 px-4 py-3">
              <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                ※ 본 자료는 AI 생성 참고 자료입니다. 해당 내용을 검토 후 사용해야 합니다.
              </p>
              <p className="text-xs text-sky-600/70 dark:text-sky-500/70 mt-0.5">
                근거 문서: {files[0]?.name ?? "업로드 문서"} · 총 {result.length}개 생성
              </p>
            </div>

            {/* Download buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadHWP} className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                HWP 다운로드
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                PDF 다운로드
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-muted-foreground shrink-0">
                <RotateCcw className="h-3.5 w-3.5" />
                초기화
              </Button>
            </div>

            {/* FAQ items */}
            <div className="space-y-3">
              {result.map((item, i) => (
                <div key={i} className="rounded-xl border bg-card overflow-hidden">
                  <div className="flex items-start gap-3 px-5 py-4 bg-[#005BAC]/[0.05]">
                    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#005BAC] text-white text-xs font-bold">
                      Q
                    </span>
                    <p className="text-sm font-semibold leading-6 pt-0.5">{item.q}</p>
                  </div>
                  <div className="flex items-start gap-3 px-5 py-4 border-t bg-muted/10">
                    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
                      A
                    </span>
                    <p className="text-sm leading-6 text-muted-foreground pt-0.5">{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 자원 관리 모달 */}
      <Dialog open={showResourceModal} onOpenChange={setShowResourceModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4 text-[#005BAC]" />
              자원 관리 설정
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {/* FAQ 자동생성 설정 */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">FAQ 자동생성 설정</p>
              <div className="space-y-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">최대 생성 개수</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={resourceSettings.maxFaqCount}
                      onChange={(e) => setResourceSettings((s) => ({ ...s, maxFaqCount: Math.min(50, Math.max(1, parseInt(e.target.value) || 1)) }))}
                      className="w-16 h-7 text-center text-sm font-medium rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-[#005BAC]/30"
                    />
                    <span className="text-xs text-muted-foreground">개</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">기본 생성 개수</label>
                  <select
                    value={resourceSettings.defaultFaqCount}
                    onChange={(e) => setResourceSettings((s) => ({ ...s, defaultFaqCount: parseInt(e.target.value) }))}
                    className="h-7 rounded-lg border border-border bg-card px-2 text-sm outline-none focus:ring-2 focus:ring-[#005BAC]/30"
                  >
                    {[3, 5, 10].map((n) => <option key={n} value={n}>{n}개</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 파일 업로드 설정 */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">파일 업로드 설정</p>
              <div className="space-y-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">최대 파일 용량</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={resourceSettings.maxFileSizeMb}
                      onChange={(e) => setResourceSettings((s) => ({ ...s, maxFileSizeMb: Math.min(200, Math.max(1, parseInt(e.target.value) || 1)) }))}
                      className="w-16 h-7 text-center text-sm font-medium rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-[#005BAC]/30"
                    />
                    <span className="text-xs text-muted-foreground">MB</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">허용 파일 형식</label>
                  <div className="flex items-center gap-3">
                    {(["allowPdf", "allowHwp", "allowDocx"] as const).map((key) => {
                      const label = key === "allowPdf" ? "PDF" : key === "allowHwp" ? "HWP" : "DOCX"
                      return (
                        <label key={key} className="flex items-center gap-1 text-xs cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={resourceSettings[key]}
                            onChange={(e) => setResourceSettings((s) => ({ ...s, [key]: e.target.checked }))}
                            className="accent-[#005BAC] h-3.5 w-3.5"
                          />
                          {label}
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleResourceReset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                초기화
              </button>
              <div className="flex items-center gap-2">
                {resourceSaved && (
                  <span className="text-xs text-green-600 font-medium">저장되었습니다.</span>
                )}
                <button
                  type="button"
                  onClick={handleResourceSave}
                  className="flex items-center gap-1.5 rounded-lg bg-[#005BAC] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#005BAC]/90 transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  저장
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main DocumentWriterTool
// ─────────────────────────────────────────────

interface DocumentWriterToolProps {
  activeTool: DocumentWritingTool
  onToolChange?: (tool: string) => void
}

export function DocumentWriterTool({ activeTool }: DocumentWriterToolProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTool === "polish" && <PolishPanel />}
        {activeTool === "translation" && <TranslationPanel />}
        {activeTool === "faq" && <FAQPanel />}
      </div>
    </div>
  )
}

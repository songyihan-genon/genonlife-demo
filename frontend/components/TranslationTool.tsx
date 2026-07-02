"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Languages, Loader2, Download, History, RotateCcw, FileText, Square, PanelRightOpen, Trash2 } from "lucide-react"
import { FileUploadBox } from "@/components/FileUploadBox"
import { DocxViewer } from "@/components/DocxViewer"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type BackendHistoryFile = {
  file_id?: string
  original_name?: string
  translated_name?: string
}

type BackendHistoryItem = {
  job_id: string
  completed_at?: number
  target_locale?: string
  source_locale?: string
  files?: BackendHistoryFile[]
}

type TranslationResult = {
  jobId: string
  fileName: string
  languageLabel: string
  url: string
  completedAt: number
}

type HistoryPreview = {
  jobId: string
  fileId?: string
  originalName?: string
  translatedName?: string
  languageLabel: string
  completedAt: number
  originalBlob?: Blob | null
  translatedBlob?: Blob | null
  originalText?: string
  translatedText?: string
  rowKey: string
  isDemo?: boolean
}

type ResultDisplay = {
  fileName: string
  languageLabel: string
  completedAt: number
}

type JobProgress = {
  totalBatches: number
  completedBatches: number
  totalSegments: number
  translatedSegments: number
}

type JobFileInfo = {
  file_id?: string
  name?: string
}

const LANGS: { value: string; label: string }[] = [
  { value: "en", label: "영어 (EN)" },
  { value: "ko", label: "한국어 (KO)" },
  { value: "ja", label: "일본어 (JA)" },
  { value: "zh-CN", label: "중국어 간체 (ZH-CN)" },
  { value: "zh-TW", label: "중국어 번체 (ZH-TW)" },
  { value: "de", label: "독일어 (DE)" },
  { value: "fr", label: "프랑스어 (FR)" },
  { value: "es", label: "스페인어 (ES)" },
]

const TARGET_LOCALE: Record<string, string> = {
  en: "en-US",
  ko: "ko-KR",
  ja: "ja-JP",
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
}

const LOCALE_LABELS: Record<string, string> = {
  "en-US": "영어 (EN)",
  "ko-KR": "한국어 (KO)",
  "ja-JP": "일본어 (JA)",
  "zh-CN": "중국어 간체 (ZH-CN)",
  "zh-TW": "중국어 번체 (ZH-TW)",
  "de-DE": "독일어 (DE)",
  "fr-FR": "프랑스어 (FR)",
  "es-ES": "스페인어 (ES)",
}

const TERMINAL_STATUSES = new Set(["SUCCEEDED", "FAILED", "CANCELLED"])

const DEMO_TRANSLATION_HISTORY: BackendHistoryItem[] = [
  {
    job_id: "demo-summary-kr-en",
    completed_at: Math.floor(Date.now() / 1000) - 3600,
    source_locale: "ko-KR",
    target_locale: "en-US",
    files: [
      {
        file_id: "demo-file-1",
        original_name: "2026_제논라이프_생성형AI_도입보고서.docx",
        translated_name: "2026_Kangwonland_Generative_AI_Adoption_Report.docx",
      },
    ],
  },
]

const DEMO_TRANSLATION_PREVIEWS: Record<string, Omit<HistoryPreview, "jobId" | "rowKey" | "languageLabel" | "completedAt">> = {
  "demo-summary-kr-en:demo-file-1": {
    originalName: "2026_제논라이프_생성형AI_도입보고서.docx",
    translatedName: "2026_Kangwonland_Generative_AI_Adoption_Report.docx",
    originalText: [
      "[원문 요약]",
      "",
      "문서명: 제논라이프 생성형 AI 도입 검토 보고",
      "",
      "1. 추진 배경",
      "- 고객 응대, 문서 작성, 운영 데이터 분석 업무에서 생성형 AI 활용 수요가 증가하고 있음",
      "- 부서별 개별 도입보다 단일 포털 기반 서비스 제공이 효율적임",
      "",
      "2. 기대 효과",
      "- 반복 문서 작성 시간 단축",
      "- 고객 응대 메시지 품질 표준화",
      "- 운영 지표 분석 지원",
      "",
      "3. 검토 의견",
      "- 시범 운영 후 단계적 확대가 적절함",
      "- 사내 로그인 및 권한 체계 연동이 필요함",
    ].join("\n"),
    translatedText: [
      "[Summary Translation]",
      "",
      "Document: Review Report on Generative AI Adoption at Kangwon Land",
      "",
      "1. Background",
      "- Demand for generative AI is increasing across customer support, document drafting, and operational data analysis.",
      "- A single portal-based service model is more efficient than department-level standalone adoption.",
      "",
      "2. Expected Benefits",
      "- Reduced time for repetitive document drafting",
      "- Standardized quality for customer-facing messages",
      "- Better support for operational KPI analysis",
      "",
      "3. Review Notes",
      "- A phased rollout after pilot operation is recommended.",
      "- Integration with internal login and permission controls is required.",
    ].join("\n"),
    isDemo: true,
  },
}

export function TranslationTool() {
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>([])
  const primaryFile = files[0] || null
  const [lang, setLang] = useState<string>("en")
  const [isTranslating, setIsTranslating] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [latestResult, setLatestResult] = useState<TranslationResult | null>(null)
  const [latestResultBlob, setLatestResultBlob] = useState<Blob | null>(null)
  const [history, setHistory] = useState<BackendHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [jobProgress, setJobProgress] = useState<JobProgress | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [currentJobStatus, setCurrentJobStatus] = useState<string | null>(null)
  const [currentFile, setCurrentFile] = useState<JobFileInfo | null>(null)
  const [currentFileProgress, setCurrentFileProgress] = useState<JobProgress | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historyPreview, setHistoryPreview] = useState<HistoryPreview | null>(null)
  const [historyPreviewLoadingKey, setHistoryPreviewLoadingKey] = useState<string | null>(null)

  useEffect(() => {
    refreshHistory()
  }, [])

  useEffect(() => {
    return () => {
      if (latestResult?.url) {
        URL.revokeObjectURL(latestResult.url)
      }
    }
  }, [latestResult?.url])

  const refreshHistory = async () => {
    setHistoryLoading(true)
    try {
      const response = await fetch("/api/translation/history", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`status ${response.status}`)
      }
      const data = await response.json()
      const items = Array.isArray(data.items) && data.items.length > 0 ? data.items : DEMO_TRANSLATION_HISTORY
      setHistory(items)
      if (!historyPreview && items[0]?.job_id === "demo-summary-kr-en") {
        const file = items[0].files?.[0]
        if (file) {
          setHistoryPreview(buildDemoHistoryPreview(items[0], file))
        }
      }
    } catch (error) {
      console.error("[translation] history fetch failed", error)
      setHistory(DEMO_TRANSLATION_HISTORY)
      if (!historyPreview) {
        const file = DEMO_TRANSLATION_HISTORY[0]?.files?.[0]
        if (file) {
          setHistoryPreview(buildDemoHistoryPreview(DEMO_TRANSLATION_HISTORY[0], file))
        }
      }
    } finally {
      setHistoryLoading(false)
    }
  }

  const resetJobTracking = () => {
    setActiveJobId(null)
    setJobProgress(null)
    setCurrentJobStatus(null)
    setCurrentFile(null)
    setCurrentFileProgress(null)
    setIsCanceling(false)
  }

  const applyProgressFromMeta = (meta: any) => {
    if (!meta) {
      return
    }
    setCurrentJobStatus(typeof meta.status === "string" ? meta.status : null)
    setCurrentFile(meta.current_file ?? null)
    const fileProgress = parseJobProgress(meta.current_file_progress)
    setCurrentFileProgress(fileProgress)
    const overallProgress = parseJobProgress(meta.progress) || fileProgress
    setJobProgress(overallProgress)
  }

  const translate = async () => {
    if (!primaryFile) {
      toast({ description: "번역할 DOCX 파일을 업로드하세요.", variant: "destructive" })
      return
    }
    setIsTranslating(true)
    setHistoryPreview(null)
    resetJobTracking()
    setStatusMessage("문서를 업로드하는 중입니다...")
    try {
      const formData = new FormData()
      formData.append("files", primaryFile)
      formData.append("target_locale", TARGET_LOCALE[lang] || "en-US")
      const response = await fetch("/api/translation/jobs", {
        method: "POST",
        body: formData,
      })
      if (!response.ok) {
        const errorPayload = await safeJson(response)
        throw new Error(errorPayload?.detail || "번역 작업 생성에 실패했습니다.")
      }
      const payload = await response.json()
      const jobId: string = payload.job_id
      setActiveJobId(jobId)
      setCurrentJobStatus("QUEUED")
      setStatusMessage("번역 중입니다...")
      const finalMeta = await pollUntilComplete(jobId)
      const finalStatus = (finalMeta?.status || "").toUpperCase()
      if (finalStatus === "CANCELLED") {
        toast({ description: "번역이 취소되었습니다." })
        return
      }
      setStatusMessage("번역 결과를 가져오는 중입니다...")
      const resultResponse = await fetch(`/api/translation/jobs/${jobId}/result`)
      if (!resultResponse.ok) {
        const errorPayload = await safeJson(resultResponse)
        throw new Error(errorPayload?.detail || "번역 결과를 가져오는 데 실패했습니다.")
      }
      const blob = await resultResponse.blob()
      const filename =
        parseFilename(resultResponse.headers.get("Content-Disposition")) ||
        `${stripExt(primaryFile.name)}.translated.docx`
      const url = URL.createObjectURL(blob)
      setLatestResult({
        jobId,
        fileName: filename,
        url,
        languageLabel: formatLocaleLabel(TARGET_LOCALE[lang] || "en-US"),
        completedAt: Date.now(),
      })
      setLatestResultBlob(blob)
      toast({ description: "번역이 완료되었습니다." })
      await refreshHistory()
    } catch (error) {
      console.error("[translation] failed", error)
      toast({
        title: "번역 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsTranslating(false)
      setStatusMessage(null)
      resetJobTracking()
    }
  }

  const cancelTranslation = async () => {
    if (!activeJobId || isCanceling) return
    setIsCanceling(true)
    setStatusMessage("취소 요청 중입니다...")
    try {
      const response = await fetch(`/api/translation/jobs/${activeJobId}/cancel`, {
        method: "POST",
        cache: "no-store",
      })
      const errorPayload = await safeJson(response)
      if (!response.ok) {
        throw new Error(errorPayload?.detail || "번역 취소에 실패했습니다.")
      }
      toast({ description: "번역 중지 요청을 완료했습니다." })
    } catch (error) {
      console.error("[translation] cancel failed", error)
      toast({
        title: "취소 실패",
        description: error instanceof Error ? error.message : "번역 취소 요청을 보낼 수 없습니다.",
        variant: "destructive",
      })
    } finally {
      setIsCanceling(false)
    }
  }

  const pollUntilComplete = async (jobId: string) => {
    const maxAttempts = 120
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`/api/translation/jobs/${jobId}`, { cache: "no-store" })
      if (!response.ok) {
        const errorPayload = await safeJson(response)
        throw new Error(errorPayload?.detail || "작업 상태를 조회할 수 없습니다.")
      }
      const meta = await response.json()
      applyProgressFromMeta(meta)
      const status = (meta.status || "").toUpperCase()
      if (status === "SUCCEEDED" || status === "CANCELLED") {
        return meta
      }
      if (status === "FAILED") {
        throw new Error("번역이 실패했습니다. 로그를 확인해주세요.")
      }
      await wait(2000)
    }
    throw new Error("번역 대기 시간이 초과되었습니다.")
  }

  const downloadTranslated = () => {
    if (historyPreview) {
      if (historyPreview.translatedBlob) {
        triggerDownloadFromBlob(
          historyPreview.translatedBlob,
          historyPreview.translatedName || historyPreview.originalName || "translated.docx",
        )
      } else if (historyPreview.translatedText) {
        triggerDownloadFromBlob(
          new Blob([historyPreview.translatedText], { type: "text/plain;charset=utf-8" }),
          `${stripExt(historyPreview.translatedName || historyPreview.originalName || "translated")}.txt`,
        )
      }
      return
    }
    if (!latestResult) return
    triggerDownloadFromUrl(latestResult.url, latestResult.fileName)
  }

  const reset = () => {
    setFiles([])
    setLatestResult(null)
    setLatestResultBlob(null)
    setStatusMessage(null)
    setHistoryPreview(null)
    resetJobTracking()
  }

  const downloadHistoryItem = async (item: BackendHistoryItem, file: BackendHistoryFile) => {
    try {
      const query = file.file_id ? `?fileId=${encodeURIComponent(file.file_id)}` : ""
      const response = await fetch(`/api/translation/jobs/${item.job_id}/result${query}`)
      if (!response.ok) {
        const errorPayload = await safeJson(response)
        throw new Error(errorPayload?.detail || "다운로드에 실패했습니다.")
      }
      const blob = await response.blob()
      const filename =
        parseFilename(response.headers.get("Content-Disposition")) ||
        file.translated_name ||
        `${file.original_name || "translated"}.docx`
      triggerDownloadFromBlob(blob, filename)
    } catch (error) {
      console.error("[translation] history download failed", error)
      toast({
        title: "다운로드 실패",
        description: error instanceof Error ? error.message : "파일을 다운로드할 수 없습니다.",
        variant: "destructive",
      })
    }
  }

  const deleteHistoryItem = async (jobId: string) => {
    if (!confirm("정말 이 번역 기록을 삭제하시겠습니까?")) return
    try {
      const response = await fetch(`/api/translation/history/${jobId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("삭제 실패")
      }
      toast({ description: "기록이 삭제되었습니다." })
      await refreshHistory()
      if (historyPreview?.jobId === jobId) {
        setHistoryPreview(null)
      }
    } catch (error) {
      console.error("[translation] delete failed", error)
      toast({
        title: "삭제 실패",
        description: "기록을 삭제하지 못했습니다.",
        variant: "destructive",
      })
    }
  }

  const viewHistoryItem = async (item: BackendHistoryItem, file: BackendHistoryFile) => {
    const key = `${item.job_id}-${file.file_id || file.translated_name || file.original_name || "file"}`
    setHistoryPreviewLoadingKey(key)
    try {
      if (item.job_id.startsWith("demo-")) {
        setHistoryPreview(buildDemoHistoryPreview(item, file))
        return
      }
      const query = file.file_id ? `?fileId=${encodeURIComponent(file.file_id)}` : ""
      const [sourceResponse, resultResponse] = await Promise.all([
        fetch(`/api/translation/jobs/${item.job_id}/source${query}`, { cache: "no-store" }),
        fetch(`/api/translation/jobs/${item.job_id}/result${query}`, { cache: "no-store" }),
      ])

      if (!sourceResponse.ok) {
        const errorPayload = await safeJson(sourceResponse)
        throw new Error(errorPayload?.detail || "원본 파일을 불러올 수 없습니다.")
      }
      if (!resultResponse.ok) {
        const errorPayload = await safeJson(resultResponse)
        throw new Error(errorPayload?.detail || "번역본을 불러올 수 없습니다.")
      }

      const [sourceBlob, translatedBlob] = await Promise.all([sourceResponse.blob(), resultResponse.blob()])
      setHistoryPreview({
        jobId: item.job_id,
        fileId: file.file_id,
        originalName: file.original_name,
        translatedName: file.translated_name,
        languageLabel: formatLocaleLabel(item.target_locale),
        completedAt: item.completed_at ? item.completed_at * 1000 : Date.now(),
        originalBlob: sourceBlob,
        translatedBlob,
        rowKey: key,
      })
    } catch (error) {
      console.error("[translation] preview load failed", error)
      toast({
        title: "미리보기 실패",
        description: error instanceof Error ? error.message : "히스토리 문서를 불러올 수 없습니다.",
        variant: "destructive",
      })
    } finally {
      setHistoryPreviewLoadingKey(null)
    }
  }

  const currentFileInfo = historyPreview ? (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2 text-base font-medium">
        <FileText className="h-4 w-4" />
        {historyPreview.originalName || historyPreview.translatedName || "원본 문서"}
      </div>
      <div className="text-muted-foreground">
        크기: {historyPreview.originalBlob ? formatBytes(historyPreview.originalBlob.size) : "샘플 문서"}
      </div>
      <div className="text-muted-foreground">
        번역 완료: {new Date(historyPreview.completedAt).toLocaleString()}
      </div>
      <div className="text-xs text-primary">
        {historyPreview.isDemo ? "샘플 번역 결과를 표시 중입니다." : "히스토리에서 선택한 원문을 표시 중입니다."}
      </div>
    </div>
  ) : primaryFile ? (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2 text-base font-medium">
        <FileText className="h-4 w-4" />
        {primaryFile.name}
      </div>
      <div className="text-muted-foreground">크기: {formatBytes(primaryFile.size)}</div>
      <div className="text-muted-foreground">
        업로드 시간: {new Date(primaryFile.lastModified).toLocaleString()}
      </div>
      <div className="text-xs text-muted-foreground">
        현재 DOCX(.docx) 파일 업로드를 지원합니다.
      </div>
    </div>
  ) : (
    <div className="text-sm text-muted-foreground">
      DOCX 파일을 업로드하면 메타데이터와 미리보기를 확인할 수 있습니다.
    </div>
  )

  const displayedResultInfo: ResultDisplay | null = historyPreview
    ? {
      fileName: historyPreview.translatedName || historyPreview.originalName || "번역본",
      languageLabel: historyPreview.languageLabel,
      completedAt: historyPreview.completedAt,
    }
    : latestResult
      ? {
        fileName: latestResult.fileName,
        languageLabel: latestResult.languageLabel,
        completedAt: latestResult.completedAt,
      }
      : null

  const overallPercent = jobProgress ? Math.round(getProgressPercent(jobProgress)) : null
  const currentFilePercent = currentFileProgress ? Math.round(getProgressPercent(currentFileProgress)) : null
  const normalizedJobStatus = (currentJobStatus || "").toUpperCase()
  const isJobCancelable = Boolean(
    activeJobId && (!normalizedJobStatus || !TERMINAL_STATUSES.has(normalizedJobStatus)),
  )
  const showCancelButton = Boolean(activeJobId && (isJobCancelable || isCanceling))

  return (
    <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
      <div className="h-full w-full bg-background overflow-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              <h1 className="text-xl font-bold">문서 요약/번역/정리</h1>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsHistoryOpen(true)}>
              <PanelRightOpen className="h-4 w-4" />
              <span className="hidden sm:inline">번역 히스토리</span>
            </Button>
          </div>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle>번역 요청</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>목적 언어</Label>
                <select
                  className="w-full rounded border bg-card px-3 py-2 text-sm"
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                >
                  {LANGS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <FileUploadBox
                label="DOCX 파일 업로드"
                accept=".docx"
                files={files}
                onFilesChange={(next) => {
                  setHistoryPreview(null)
                  setFiles(next.slice(0, 1))
                }}
                placeholder="DOCX 파일을 드래그하거나 클릭해서 업로드"
                multiple={false}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={translate} disabled={!primaryFile || isTranslating}>
                  {isTranslating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 번역 중...
                    </>
                  ) : (
                    "번역 실행"
                  )}
                </Button>
                <Button variant="outline" onClick={reset} disabled={!files.length && !latestResult && !historyPreview}>
                  <RotateCcw className="mr-2 h-4 w-4" /> 새 요청
                </Button>
                {showCancelButton && (
                  <Button
                    variant="destructive"
                    onClick={cancelTranslation}
                    disabled={!isJobCancelable || isCanceling}
                    className="flex items-center gap-1"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <Square className="h-3.5 w-3.5" />
                    {isCanceling ? "중지 요청 중..." : "중지"}
                  </Button>
                )}
              </div>
              {(statusMessage || jobProgress) && (
                <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {statusMessage && <div>{statusMessage}</div>}
                  {jobProgress && (
                    <div className="mt-2 space-y-1 text-left">
                      <Progress value={getProgressPercent(jobProgress)} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>배치 진행률</span>
                        <span>
                          {formatProgressLabel(jobProgress)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {activeJobId && (
            <Card className="bg-card border border-dashed border-primary/40">
              <CardHeader className="pb-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>번역 진행 상황</CardTitle>
                  <div className="text-[11px] text-muted-foreground truncate sm:max-w-xs">Job ID: {activeJobId}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>현재 상태</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
                    {formatJobStatus(currentJobStatus)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>전체 진행률</span>
                    <span className="font-medium text-foreground">
                      {overallPercent !== null ? `${overallPercent}%` : "대기 중"}
                    </span>
                  </div>
                  <Progress value={overallPercent ?? 0} />
                  <div className="text-xs text-muted-foreground">
                    {jobProgress ? formatProgressLabel(jobProgress) : "큐 대기 또는 세그먼트 분석 중"}
                  </div>
                </div>
                {currentFile && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">
                        현재 파일: <span className="font-medium text-foreground">{currentFile.name || currentFile.file_id || "파일"}</span>
                      </span>
                      {currentFilePercent !== null && (
                        <span className="font-medium text-foreground">{currentFilePercent}%</span>
                      )}
                    </div>
                    <Progress value={currentFilePercent ?? 0} />
                    <div className="text-xs text-muted-foreground">
                      {currentFileProgress ? formatProgressLabel(currentFileProgress) : "파일 준비 중"}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>업로드된 문서 뷰</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentFileInfo}
                {historyPreview?.originalText ? (
                  <DemoDocumentPreview
                    title="원문 요약 미리보기"
                    body={historyPreview.originalText}
                  />
                ) : (
                  <DocxViewer
                    file={(historyPreview ? historyPreview.originalBlob : primaryFile) || null}
                    emptyHint="DOCX 파일을 업로드하면 여기에서 미리보기를 확인할 수 있습니다."
                  />
                )}
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>번역 결과 뷰</CardTitle>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={downloadTranslated}
                  disabled={!historyPreview && !latestResult}
                >
                  <Download className="mr-2 h-4 w-4" /> 번역본 다운로드
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {displayedResultInfo ? (
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {historyPreview ? "히스토리에서 선택됨" : "번역 완료"}
                    </div>
                    <div className="text-base font-medium">{displayedResultInfo.fileName}</div>
                    <div className="mt-1 text-muted-foreground">
                      {displayedResultInfo.languageLabel} • {new Date(displayedResultInfo.completedAt).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">번역이 완료되면 결과 정보와 미리보기가 표시됩니다.</div>
                )}
                {historyPreview?.translatedText ? (
                  <DemoDocumentPreview
                    title="요약/번역 결과 미리보기"
                    body={historyPreview.translatedText}
                  />
                ) : (
                  <DocxViewer
                    file={(historyPreview ? historyPreview.translatedBlob : latestResultBlob) || null}
                    emptyHint="번역이 완료되면 번역본 미리보기가 표시됩니다."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <SheetContent side="right" className="w-full sm:w-[420px] overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <SheetHeader className="items-start text-left">
            <SheetTitle className="flex items-center gap-2">
              <History className="h-4 w-4" /> 번역 히스토리
            </SheetTitle>
            <SheetDescription>최근 번역 기록을 열어서 바로 미리보기로 확인할 수 있습니다.</SheetDescription>
          </SheetHeader>
          <Button size="sm" variant="outline" onClick={refreshHistory}>
            새로고침
          </Button>
        </div>
        <div className="mt-4">
          {historyLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중...
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">저장된 기록이 없습니다.</div>
          ) : (
            <div className="space-y-4 pb-10">
              {history.map((entry) => (
                <div key={entry.job_id} className="rounded border border-border bg-card/80 p-3">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{formatLocaleLabel(entry.target_locale)}</span>
                    <span>{formatTimestamp(entry.completed_at)}</span>
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">Job ID: {entry.job_id}</div>
                  <div className="mt-2 space-y-2">
                    {(entry.files || []).map((file) => {
                      const rowKey = `${entry.job_id}-${file.file_id || file.translated_name || file.original_name || "file"}`
                      const isActive = historyPreview?.rowKey === rowKey
                      const isLoading = historyPreviewLoadingKey === rowKey
                      return (
                        <div
                          key={rowKey}
                          role="button"
                          tabIndex={0}
                          onClick={() => viewHistoryItem(entry, file)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault()
                              viewHistoryItem(entry, file)
                            }
                          }}
                          className={`group rounded border px-3 py-2 text-sm transition ${isActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-medium">
                                {file.translated_name || file.original_name || "번역본"}
                              </div>
                              {file.original_name && (
                                <div className="truncate text-[10px] text-muted-foreground">원본: {file.original_name}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                              ) : (
                                <span className="text-[11px] text-muted-foreground">보기</span>
                              )}
                              {!entry.job_id.startsWith("demo-") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    downloadHistoryItem(entry, file)
                                  }}
                                >
                                  <Download className="mr-1 h-3 w-3" /> 다운
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {!entry.job_id.startsWith("demo-") && (
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px] text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteHistoryItem(entry.job_id)
                          }}
                        >
                          <Trash2 className="mr-1 h-3 w-3" /> 기록 삭제
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function buildDemoHistoryPreview(item: BackendHistoryItem, file: BackendHistoryFile): HistoryPreview {
  const previewKey = `${item.job_id}:${file.file_id || "file"}`
  const preset = DEMO_TRANSLATION_PREVIEWS[previewKey]
  return {
    jobId: item.job_id,
    fileId: file.file_id,
    originalName: preset?.originalName || file.original_name,
    translatedName: preset?.translatedName || file.translated_name,
    languageLabel: formatLocaleLabel(item.target_locale),
    completedAt: item.completed_at ? item.completed_at * 1000 : Date.now(),
    rowKey: `${item.job_id}-${file.file_id || file.translated_name || file.original_name || "file"}`,
    originalText: preset?.originalText,
    translatedText: preset?.translatedText,
    isDemo: preset?.isDemo,
  }
}

function DemoDocumentPreview({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed bg-muted/30 p-4">
      <div className="mb-3 text-sm font-medium text-foreground">{title}</div>
      <div className="h-[420px] overflow-auto rounded-md border bg-background px-5 py-4 text-sm leading-7 text-foreground whitespace-pre-wrap">
        {body}
      </div>
    </div>
  )
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function safeJson(response: Response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

function parseFilename(disposition: string | null) {
  if (!disposition) return null
  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1])
    } catch {
      return utfMatch[1]
    }
  }
  const match = disposition.match(/filename="?([^\";]+)"?/i)
  return match?.[1] ?? null
}

function stripExt(name: string) {
  const idx = name.lastIndexOf(".")
  return idx > 0 ? name.slice(0, idx) : name
}

function parseJobProgress(raw: any): JobProgress | null {
  if (!raw || typeof raw !== "object") {
    return null
  }
  const toNumber = (value: unknown) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
  }
  const totalBatches = Math.max(0, toNumber(raw.total_batches ?? raw.totalBatches))
  const completedBatches = Math.max(
    0,
    Math.min(totalBatches || Number.MAX_SAFE_INTEGER, toNumber(raw.completed_batches ?? raw.completedBatches)),
  )
  const totalSegments = Math.max(0, toNumber(raw.total_segments ?? raw.totalSegments))
  const translatedSegments = Math.max(
    0,
    Math.min(totalSegments || Number.MAX_SAFE_INTEGER, toNumber(raw.translated_segments ?? raw.translatedSegments)),
  )
  if (totalBatches <= 0 && totalSegments <= 0) {
    return null
  }
  return {
    totalBatches,
    completedBatches,
    totalSegments,
    translatedSegments,
  }
}

function getProgressPercent(progress: JobProgress) {
  if (progress.totalBatches > 0) {
    return Math.min(100, Math.max(0, (progress.completedBatches / progress.totalBatches) * 100))
  }
  if (progress.totalSegments > 0) {
    return Math.min(100, Math.max(0, (progress.translatedSegments / progress.totalSegments) * 100))
  }
  return 0
}

function formatProgressLabel(progress: JobProgress) {
  if (progress.totalBatches > 0) {
    const completed = Math.min(progress.completedBatches, progress.totalBatches)
    return `${completed}/${progress.totalBatches} 배치`
  }
  if (progress.totalSegments > 0) {
    const translated = Math.min(progress.translatedSegments, progress.totalSegments)
    return `${translated}/${progress.totalSegments} 세그먼트`
  }
  return "-/-"
}

function formatJobStatus(status?: string | null) {
  const normalized = (status || "").toUpperCase()
  switch (normalized) {
    case "QUEUED":
      return "대기 중"
    case "PROCESSING":
      return "번역 중"
    case "SUCCEEDED":
      return "완료"
    case "FAILED":
      return "실패"
    case "CANCELLED":
      return "취소됨"
    default:
      return status || "대기 중"
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatLocaleLabel(locale?: string) {
  if (!locale) return "언어 미지정"
  return LOCALE_LABELS[locale] || locale
}

function formatTimestamp(ts?: number) {
  if (!ts) return "-"
  const date = new Date(ts * 1000)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }
  return date.toLocaleString()
}

function triggerDownloadFromBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  triggerDownloadFromUrl(url, filename, true)
}

function triggerDownloadFromUrl(url: string, filename: string, revokeAfter = false) {
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  if (revokeAfter) {
    URL.revokeObjectURL(url)
  }
}

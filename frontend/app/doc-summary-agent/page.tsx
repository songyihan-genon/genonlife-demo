"use client"

import React, { useState, useRef, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Home,
  Upload,
  X,
  BookOpen,
  FileSpreadsheet,
  File,
  Sparkles,
  ClipboardList,
  Database,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Download,
  RotateCcw,
  AlertCircle,
  Info,
  FileWarning,
  Settings2,
  Plus,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type DocState = "idle" | "selected" | "loading" | "ready" | "downloading" | "done"
type DownloadFormat = "PDF" | "DOCX" | "PPTX" | "HWP" | "XLSX"
type FontOption = "Pretendard" | "나눔고딕" | "맑은 고딕"
type FontSizeOption = "소" | "중" | "대"

interface UploadedFile {
  id: string
  name: string
  size: number
  error?: string
}

interface SokDocument {
  id: string
  title: string
  category: string
  date: string
  pages: number
}

interface TemplateConfig {
  key: string
  label: string
  description: string
  icon: ReactNode
  prompt: string
  font: FontOption
  fontSize: FontSizeOption
  isCustom?: boolean
}

const VALID_EXTENSIONS = new Set([".pdf", ".docx", ".doc", ".xlsx", ".xls", ".txt", ".pptx", ".ppt", ".hwp", ".csv"])

const SOK_DOCUMENTS: SokDocument[] = [
  { id: "sok-1", title: "실손보험 표준 업무매뉴얼", category: "업무매뉴얼", date: "2026.03", pages: 64 },
  { id: "sok-2", title: "종신보험 약관 표준본", category: "약관", date: "2026.01", pages: 48 },
  { id: "sok-3", title: "고객 안내문 작성 가이드", category: "상품설명서", date: "2025.12", pages: 20 },
]

const INITIAL_TEMPLATES: TemplateConfig[] = [
  {
    key: "summary",
    label: "요약",
    description: "핵심 내용 요약본 생성",
    icon: <FileText className="h-4 w-4" />,
    prompt: "업로드된 문서의 핵심 내용을 간결하게 요약하세요. 주요 항목, 처리 기준, 핵심 포인트를 bullet point로 정리하고 3~5개의 섹션으로 구조화하여 작성하세요.",
    font: "Pretendard",
    fontSize: "중",
  },
  {
    key: "manual",
    label: "업무 매뉴얼",
    description: "담당자용 절차·기준 정리",
    icon: <ClipboardList className="h-4 w-4" />,
    prompt: "업로드된 문서를 바탕으로 업무 담당자가 참고할 수 있는 절차 매뉴얼을 작성하세요. 단계별 처리 순서, 체크포인트, 주의사항을 명확하게 서술하고 번호 체계로 구조화하세요.",
    font: "Pretendard",
    fontSize: "중",
  },
  {
    key: "sok",
    label: "SOK 콘텐츠",
    description: "SOK 지식센터 등록용 콘텐츠 생성",
    icon: <Database className="h-4 w-4" />,
    prompt: "SOK 지식센터 등록 표준 형식에 맞춰 콘텐츠를 생성하세요. 분류, 제목, 본문 요약, 상세 내용, 관련 태그, 등록 부서, 유효 기간 항목을 포함하여 작성하세요.",
    font: "Pretendard",
    fontSize: "중",
  },
]

const LOADING_STEPS = [
  "대상문서 파싱 및 청크 분할 중…",
  "RAG 검색 — 참조문서·약관·규정 탐색 중…",
  "Long Context Agent 분석 중…",
  "표준 템플릿 적용하여 문서 생성 중…",
]

const RAG_SOURCES: Record<string, string[]> = {
  summary: ["실손보험 약관 §3", "청구심사 기준표", "업무매뉴얼 v2.1"],
  manual: ["업무매뉴얼 처리절차 v2.1", "청구심사 기준표", "실손보험 약관 §3"],
  sok: ["SOK 지식센터 분류체계", "콘텐츠 작성 가이드", "종신보험 약관 §12"],
}

const DEFAULT_RAG_SOURCES = ["RAG 검색 결과", "참조문서", "SOK 지식센터"]

const MOCK_CONTENT: Record<string, string> = {
  summary: `■ 실손보험 보험금 청구 절차 요약

▶ 청구 접수 → 서류 검토 → 심사 처리 → 지급 통보

【주요 처리 기준】
• 접수 채널: 앱 / FAX / 우편 / 지점 방문
• 필수 서류: 진단서, 의료비 영수증, 청구서 (3종)
• 표준 심사 기간: 접수일로부터 3 영업일 이내
• 고액 청구(300만원↑): 별도 심층 심사 적용
• 지급 결정 후: 1 영업일 내 계좌 이체 및 SMS 통보

【미비 서류 처리】
서류 미비 시 고객에게 즉시 안내하고 보완 요청.
보완 기간 30일 초과 시 청구 반려 처리.`,

  manual: `■ 실손보험 보험금 청구 업무 처리 절차 매뉴얼

1. 청구 접수
   - 고객 청구 서류 수령 (FAX / 우편 / 앱 업로드)
   - 접수 시스템 등록 및 접수번호 부여
   - 고객에게 접수 완료 SMS 발송

2. 서류 검토
   - 필수 서류 완비 여부 확인 (진단서, 영수증, 청구서)
   - 미비 서류 발생 시 고객 안내 후 보완 요청
   - 약관 §3 기준 보장 범위 해당 여부 검토

3. 심사 처리
   - 표준 심사 기간: 접수일로부터 3 영업일 이내
   - 고액 청구(300만원 이상): 별도 심층 심사 절차 적용
   - 심사 완료 후 지급 결정 시스템 입력

4. 지급 및 통보
   - 지급 결정 후 1 영업일 이내 계좌 이체
   - 고객 SMS 및 서면 통보 (청구 결과 + 지급 내역)
   - 이의 신청 안내 문구 포함 필수`,

  sok: `[SOK 콘텐츠] 실손보험 보험금 청구 안내

■ 분류: 보험금 청구 > 실손보험 > 일반 청구

■ 제목
실손보험 보험금 청구 방법 및 구비서류 안내

■ 본문 요약
실손의료보험 보험금 청구 시 필요한 서류와 절차를 안내합니다.

■ 상세 내용
【청구 방법】
- 제논라이프 앱 → 보험금 청구 메뉴에서 온라인 접수
- 고객센터 (1588-8000) 전화 접수
- 가까운 지점 방문 접수

【필수 구비서류】
1. 보험금 청구서 (자필 서명)
2. 진단서 또는 입·퇴원 확인서 (원본)
3. 의료비 영수증 (세부 항목 포함)

【처리 기간】
서류 완비 기준 영업일 3일 이내 처리

■ 관련 태그
#실손보험 #보험금청구 #구비서류 #청구절차

■ 등록 부서: 보험금지급팀
■ 유효 기간: 2026.12.31`,
}

const MOCK_CONTENT_CUSTOM = `■ AI 생성 문서

선택한 대상문서와 템플릿 프롬프트를 바탕으로 내용을 생성하였습니다.

▶ 주요 내용 요약
• 문서의 핵심 항목을 분석하여 요청한 형식으로 정리하였습니다.
• 참조문서 및 RAG 검색 결과를 반영하여 정확도를 보완하였습니다.
• 추가 수정이 필요한 경우 하단의 수정 요청 사항란을 활용하세요.

필요에 따라 내용을 직접 수정하거나 재실행하여 결과를 개선할 수 있습니다.`

const REVISION_SUFFIX: Record<number, string> = {
  1: "\n\n※ 보완 사항: 관련 약관 조항 번호(§ 표기) 및 처리 기준을 추가 반영하였습니다.",
  2: "\n\n※ 재검토 사항: 최신 업무 매뉴얼(v2.1) 기준으로 절차 순서를 재정렬하였습니다.",
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase()
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return <FileSpreadsheet className="h-4 w-4 text-green-600" />
  if (ext === "pdf") return <FileText className="h-4 w-4 text-red-500" />
  if (ext === "pptx" || ext === "ppt") return <File className="h-4 w-4 text-orange-500" />
  if (ext === "hwp") return <File className="h-4 w-4 text-teal-500" />
  return <File className="h-4 w-4 text-blue-500" />
}

function formatNow() {
  const now = new Date()
  return (
    `${now.getFullYear()}-` +
    `${String(now.getMonth() + 1).padStart(2, "0")}-` +
    `${String(now.getDate()).padStart(2, "0")} ` +
    `${String(now.getHours()).padStart(2, "0")}:` +
    `${String(now.getMinutes()).padStart(2, "0")}:` +
    `${String(now.getSeconds()).padStart(2, "0")}`
  )
}

export default function DocSummaryAgentPage() {
  // 대상문서
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  // 참조문서
  const [refUploadedFiles, setRefUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedSokIds, setSelectedSokIds] = useState<Set<string>>(new Set())

  const [docState, setDocState] = useState<DocState>("idle")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [refIsDragging, setRefIsDragging] = useState(false)

  // template management
  const [templates, setTemplates] = useState<TemplateConfig[]>(INITIAL_TEMPLATES)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null) // null = new template
  const [editForm, setEditForm] = useState({
    label: "",
    description: "",
    prompt: "",
    font: "Pretendard" as FontOption,
    fontSize: "중" as FontSizeOption,
  })

  const [loadingStep, setLoadingStep] = useState(0)
  const [generatedContent, setGeneratedContent] = useState("")
  const [additionalPrompt, setAdditionalPrompt] = useState("")
  const [revisionCount, setRevisionCount] = useState(0)
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("PDF")
  const [downloadedAt, setDownloadedAt] = useState("")
  const [generationTargetDocs, setGenerationTargetDocs] = useState<string[]>([])
  const [generationRefDocs, setGenerationRefDocs] = useState<string[]>([])
  const [generationTemplate, setGenerationTemplate] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const refFileInputRef = useRef<HTMLInputElement>(null)

  const validFiles = uploadedFiles.filter((f) => !f.error)
  const errorFiles = uploadedFiles.filter((f) => f.error)
  const validRefFiles = refUploadedFiles.filter((f) => !f.error)

  // ── 대상문서 핸들러 ─────────────────────────────────────────────
  const addFiles = (files: FileList | null) => {
    if (!files) return
    const newEntries: UploadedFile[] = Array.from(files).map((f) => {
      const ext = "." + (f.name.split(".").pop()?.toLowerCase() ?? "")
      const isValid = VALID_EXTENSIONS.has(ext)
      return {
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: f.name,
        size: f.size,
        error: isValid ? undefined : `지원하지 않는 파일 형식 (${ext || "알 수 없음"})`,
      }
    })
    const updated = [...uploadedFiles, ...newEntries]
    setUploadedFiles(updated)
    const hasValid = updated.some((f) => !f.error)
    if (hasValid && docState === "idle") setDocState("selected")
  }

  const removeFile = (id: string) => {
    const updated = uploadedFiles.filter((f) => f.id !== id)
    setUploadedFiles(updated)
    if (!updated.some((f) => !f.error) && docState === "selected") {
      setDocState("idle")
      setSelectedTemplate(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files)
  }
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  // ── 참조문서 핸들러 ─────────────────────────────────────────────
  const addRefFiles = (files: FileList | null) => {
    if (!files) return
    const newEntries: UploadedFile[] = Array.from(files).map((f) => {
      const ext = "." + (f.name.split(".").pop()?.toLowerCase() ?? "")
      const isValid = VALID_EXTENSIONS.has(ext)
      return {
        id: `ref-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: f.name,
        size: f.size,
        error: isValid ? undefined : `지원하지 않는 파일 형식 (${ext || "알 수 없음"})`,
      }
    })
    setRefUploadedFiles((prev: UploadedFile[]) => [...prev, ...newEntries])
  }

  const removeRefFile = (id: string) => {
    setRefUploadedFiles((prev: UploadedFile[]) => prev.filter((f: UploadedFile) => f.id !== id))
  }

  const handleRefDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setRefIsDragging(false); addRefFiles(e.dataTransfer.files)
  }
  const handleRefDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setRefIsDragging(true) }
  const handleRefDragLeave = () => setRefIsDragging(false)

  // ── SOK 선택 ─────────────────────────────────────────────────────
  const toggleSokSelect = (id: string) => {
    setSelectedSokIds((prev: Set<string>) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // ── 템플릿 모달 ──────────────────────────────────────────────────
  const openEditModal = (tpl: TemplateConfig, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingKey(tpl.key)
    setEditForm({ label: tpl.label, description: tpl.description, prompt: tpl.prompt, font: tpl.font, fontSize: tpl.fontSize })
    setModalOpen(true)
  }

  const openNewModal = () => {
    setEditingKey(null)
    setEditForm({ label: "", description: "", prompt: "", font: "Pretendard", fontSize: "중" })
    setModalOpen(true)
  }

  const saveTemplate = () => {
    if (!editForm.label.trim()) return
    if (editingKey === null) {
      const newKey = `custom-${Date.now()}`
      setTemplates((prev: TemplateConfig[]) => [...prev, {
        key: newKey,
        label: editForm.label,
        description: editForm.description,
        icon: <Sparkles className="h-4 w-4" />,
        prompt: editForm.prompt,
        font: editForm.font,
        fontSize: editForm.fontSize,
        isCustom: true,
      }])
    } else {
      setTemplates((prev: TemplateConfig[]) => prev.map((t: TemplateConfig) =>
        t.key === editingKey ? { ...t, label: editForm.label, description: editForm.description, prompt: editForm.prompt, font: editForm.font, fontSize: editForm.fontSize } : t
      ))
    }
    setModalOpen(false)
  }

  const deleteTemplate = (key: string) => {
    setTemplates((prev: TemplateConfig[]) => prev.filter((t: TemplateConfig) => t.key !== key))
    if (selectedTemplate === key) setSelectedTemplate(null)
    setModalOpen(false)
  }

  // ── 생성 흐름 ────────────────────────────────────────────────────
  const runLoading = async (tplKey: string, revision: number) => {
    setDocState("loading")
    setLoadingStep(0)
    for (let i = 1; i <= 4; i++) {
      await new Promise((r) => setTimeout(r, 700))
      setLoadingStep(i)
    }
    const base = MOCK_CONTENT[tplKey] ?? MOCK_CONTENT_CUSTOM
    const suffix = revision > 0 ? (REVISION_SUFFIX[revision] ?? "") : ""
    setGeneratedContent(base + suffix)
    setDocState("ready")
  }

  const handleStartGeneration = async () => {
    if (!selectedTemplate) return
    setGenerationTargetDocs(validFiles.map((f) => f.name))
    setGenerationRefDocs([
      ...validRefFiles.map((f) => f.name),
      ...SOK_DOCUMENTS.filter((d) => selectedSokIds.has(d.id)).map((d) => d.title),
    ])
    setGenerationTemplate(selectedTemplate)
    setRevisionCount(0)
    setAdditionalPrompt("")
    await runLoading(selectedTemplate, 0)
  }

  const handleRegenerate = async () => {
    if (!generationTemplate) return
    const next = revisionCount + 1
    setRevisionCount(next)
    await runLoading(generationTemplate, next)
    setAdditionalPrompt("")
  }

  const handleDownload = async () => {
    setDocState("downloading")
    await new Promise((r) => setTimeout(r, 1000))
    setDownloadedAt(formatNow())
    setDocState("done")
  }

  const handleReset = () => {
    setDocState("idle"); setUploadedFiles([]); setRefUploadedFiles([]); setSelectedSokIds(new Set())
    setSelectedTemplate(null); setGeneratedContent(""); setAdditionalPrompt(""); setRevisionCount(0)
    setGenerationTargetDocs([]); setGenerationRefDocs([]); setGenerationTemplate(null); setDownloadFormat("PDF")
  }

  const currentTpl = templates.find((t: TemplateConfig) => t.key === generationTemplate)
  const downloadFileName = currentTpl
    ? `${(currentTpl.label).replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.${downloadFormat.toLowerCase()}`
    : ""
  const ragSources = generationTemplate ? (RAG_SOURCES[generationTemplate] ?? DEFAULT_RAG_SOURCES) : DEFAULT_RAG_SOURCES

  return (
    <div className="h-full flex flex-col bg-[#f4f7fb] relative">
      {/* Header */}
      <div className="border-b border-border bg-white px-6 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-[#005bac]" />
            <h1 className="text-base font-semibold">문서 요약/생성 Agent</h1>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="hover:bg-[#005bac] hover:text-white hover:border-[#005bac] transition-colors">
              <Home className="h-4 w-4 mr-1.5" />홈으로
            </Button>
          </Link>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: 문서 소스 패널 (40%) */}
        <div className="w-2/5 border-r border-border bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">문서 소스</h2>
              <div className="flex items-center gap-1.5">
                {errorFiles.length > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-100 text-red-600 border border-red-200 hover:bg-red-100">
                    오류 {errorFiles.length}건
                  </Badge>
                )}
                {validFiles.length > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-[#005bac] text-white hover:bg-[#005bac]">
                    대상 {validFiles.length}건
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-5">
            {/* ① 대상문서 */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Upload className="h-3.5 w-3.5 text-[#005bac]" />
                <p className="text-xs font-semibold text-[#005bac]">대상문서</p>
                <span className="text-[10px] text-muted-foreground">(필수 · 요약/생성 대상)</span>
              </div>
              <div
                onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all duration-150",
                  isDragging ? "border-[#005bac] bg-[#005bac]/5" : "border-border hover:border-[#005bac]/40 hover:bg-[#f4f7fb]",
                )}
              >
                <Upload className={cn("h-6 w-6 mx-auto mb-1.5", isDragging ? "text-[#005bac]" : "text-muted-foreground/40")} />
                <p className="text-xs font-medium text-muted-foreground">파일을 드래그하거나 클릭해서 업로드</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">PDF · DOCX · PPTX · HWP · XLSX · TXT</p>
              </div>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.pptx,.ppt,.hwp,.csv" className="hidden" onChange={(e) => addFiles(e.target.files)} />
              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {uploadedFiles.map((f) => (
                    <div key={f.id}>
                      <div className={cn("flex items-center gap-2.5 rounded-lg border px-3 py-2.5", f.error ? "border-red-200 bg-red-50" : "border-[#005bac]/30 bg-[#005bac]/5")}>
                        {f.error ? <FileWarning className="h-4 w-4 text-red-400 shrink-0" /> : <FileIcon name={f.name} />}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-medium truncate", f.error && "text-red-600")}>{f.name}</p>
                          <p className={cn("text-[11px]", f.error ? "text-red-400" : "text-muted-foreground")}>{f.error ? f.error : formatBytes(f.size)}</p>
                        </div>
                        {!f.error && <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100 shrink-0">신규</Badge>}
                        <button onClick={() => removeFile(f.id)} className="shrink-0 text-muted-foreground/50 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      {f.error && (
                        <div className="flex items-center gap-1.5 mt-1 px-1">
                          <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
                          <p className="text-[11px] text-red-500">업로드 실패 — {f.error}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {uploadedFiles.length === 0 && <p className="text-[11px] text-muted-foreground/60 text-center mt-2">업로드된 파일이 없습니다</p>}
            </div>

            <div className="border-t border-dashed border-border" />

            {/* ② 참조문서 */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-xs font-semibold text-slate-600">참조문서</p>
                <span className="text-[10px] text-muted-foreground">(선택 · RAG 검색 컨텍스트)</span>
              </div>
              <div
                onDrop={handleRefDrop} onDragOver={handleRefDragOver} onDragLeave={handleRefDragLeave}
                onClick={() => refFileInputRef.current?.click()}
                className={cn(
                  "rounded-lg border-2 border-dashed p-3.5 text-center cursor-pointer transition-all duration-150",
                  refIsDragging ? "border-slate-400 bg-slate-50" : "border-border hover:border-slate-300 hover:bg-slate-50/50",
                )}
              >
                <Upload className={cn("h-5 w-5 mx-auto mb-1", refIsDragging ? "text-slate-500" : "text-muted-foreground/40")} />
                <p className="text-xs font-medium text-muted-foreground">참조파일 드래그 또는 클릭</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">PDF · DOCX · XLSX · TXT</p>
              </div>
              <input ref={refFileInputRef} type="file" multiple accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.pptx,.ppt,.hwp,.csv" className="hidden" onChange={(e) => addRefFiles(e.target.files)} />
              {refUploadedFiles.length > 0 && (
                <div className="space-y-1.5">
                  {refUploadedFiles.map((f) => (
                    <div key={f.id}>
                      <div className={cn("flex items-center gap-2.5 rounded-lg border px-3 py-2", f.error ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50")}>
                        {f.error ? <FileWarning className="h-4 w-4 text-red-400 shrink-0" /> : <FileIcon name={f.name} />}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-medium truncate", f.error && "text-red-600")}>{f.name}</p>
                          <p className={cn("text-[11px]", f.error ? "text-red-400" : "text-muted-foreground")}>{f.error ? f.error : formatBytes(f.size)}</p>
                        </div>
                        <button onClick={() => removeRefFile(f.id)} className="shrink-0 text-muted-foreground/50 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      {f.error && (
                        <div className="flex items-center gap-1.5 mt-1 px-1">
                          <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
                          <p className="text-[11px] text-red-500">업로드 실패 — {f.error}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5">SOK 지식센터</p>
                <div className="space-y-1.5">
                  {SOK_DOCUMENTS.map((doc) => (
                    <div key={doc.id} className={cn("flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-all duration-150", selectedSokIds.has(doc.id) ? "border-slate-400 bg-slate-50" : "border-border bg-white hover:border-slate-300")} onClick={() => toggleSokSelect(doc.id)}>
                      <Checkbox checked={selectedSokIds.has(doc.id)} onCheckedChange={() => toggleSokSelect(doc.id)} onClick={(e) => e.stopPropagation()} className="shrink-0 data-[state=checked]:bg-slate-600 data-[state=checked]:border-slate-600" />
                      <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{doc.title}</p>
                        <p className="text-[11px] text-muted-foreground">{doc.category} · {doc.date} · {doc.pages}p</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {(validRefFiles.length > 0 || selectedSokIds.size > 0) && (
                <p className="text-[11px] text-slate-500 px-1">참조파일 {validRefFiles.length}건 · SOK {selectedSokIds.size}건 선택됨</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: 생성 작업 패널 (60%) */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {docState === "idle" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Upload className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">대상문서를 업로드하세요</p>
                <p className="text-xs text-muted-foreground/60 mt-1.5">왼쪽 상단 업로드 영역에 파일을 드래그하거나 클릭하세요</p>
              </div>
            </div>
          )}

          {docState === "selected" && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* 대상/참조 문서 칩 */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-[#005bac] mb-1.5">대상문서</p>
                  <div className="flex flex-wrap gap-1.5">
                    {validFiles.map((f) => (
                      <span key={f.id} className="inline-flex items-center gap-1.5 text-xs rounded-full border border-[#005bac]/40 bg-[#005bac]/5 text-[#005bac] px-2.5 py-0.5">
                        <FileIcon name={f.name} />{f.name}
                      </span>
                    ))}
                  </div>
                </div>
                {(validRefFiles.length > 0 || selectedSokIds.size > 0) && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">참조문서 (RAG)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {validRefFiles.map((f) => (
                        <span key={f.id} className="inline-flex items-center gap-1 text-xs rounded-full border border-slate-300 bg-slate-50 text-slate-600 px-2.5 py-0.5">
                          <FileText className="h-3 w-3" />{f.name}
                        </span>
                      ))}
                      {SOK_DOCUMENTS.filter((d) => selectedSokIds.has(d.id)).map((d) => (
                        <span key={d.id} className="inline-flex items-center gap-1 text-xs rounded-full border border-slate-300 bg-slate-50 text-slate-600 px-2.5 py-0.5">
                          <BookOpen className="h-3 w-3" />{d.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 문서 편집 유형 선택 */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-medium text-muted-foreground">문서 편집 유형 선택</p>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 gap-1 hover:bg-[#005bac] hover:text-white hover:border-[#005bac]" onClick={openNewModal}>
                    <Plus className="h-3 w-3" />새 템플릿
                  </Button>
                </div>
                <div className="space-y-2">
                  {templates.map((tpl: TemplateConfig) => (
                    <Card
                      key={tpl.key}
                      onClick={() => setSelectedTemplate(tpl.key)}
                      className={cn(
                        "cursor-pointer transition-all duration-150",
                        selectedTemplate === tpl.key ? "border-[#005bac] bg-[#005bac]/5 shadow-sm" : "border-border hover:border-[#005bac]/40 hover:bg-[#f4f7fb]",
                      )}
                    >
                      <CardContent className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors", selectedTemplate === tpl.key ? "bg-[#005bac] text-white" : "bg-muted text-muted-foreground")}>
                            {tpl.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium">{tpl.label}</p>
                              {tpl.isCustom && <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100">커스텀</Badge>}
                              {tpl.key === "sok" && <Badge className="text-[10px] px-1.5 py-0 h-4 bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-100">SOK 자동 등록</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{tpl.description}</p>
                          </div>
                          <button
                            onClick={(e) => openEditModal(tpl, e)}
                            className="shrink-0 p-1.5 rounded-md text-muted-foreground/50 hover:text-[#005bac] hover:bg-[#005bac]/8 transition-colors"
                            title="템플릿 설정"
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                          </button>
                          {selectedTemplate === tpl.key && (
                            <div className="h-4 w-4 rounded-full bg-[#005bac] flex items-center justify-center shrink-0">
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedTemplate === "sok" && (
                <div className="flex items-start gap-2.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-3">
                  <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-indigo-700">SOK 콘텐츠 등록 화면 연동 모드</p>
                    <p className="text-[11px] text-indigo-500 mt-0.5">생성 완료 후 SOK 지식센터 등록 화면으로 자동 연동됩니다.</p>
                  </div>
                </div>
              )}

              <div className="pt-1">
                <Button className="w-full bg-[#005bac] hover:bg-[#004a8f] text-white disabled:opacity-40" disabled={!selectedTemplate} onClick={handleStartGeneration}>
                  <Sparkles className="h-4 w-4 mr-2" />생성 시작<ChevronRight className="h-4 w-4 ml-1.5" />
                </Button>
                {!selectedTemplate && <p className="text-[11px] text-muted-foreground text-center mt-1.5">문서 편집 유형을 먼저 선택하세요</p>}
              </div>
            </div>
          )}

          {docState === "loading" && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-sm space-y-3">
                <p className="text-sm font-medium text-center mb-5">문서 생성 중…</p>
                {LOADING_STEPS.map((text, i) => (
                  <div key={i} className={cn("flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300", loadingStep > i ? "border-[#005bac]/30 bg-[#005bac]/5" : loadingStep === i ? "border-border bg-white" : "border-border/50 bg-white/50")}>
                    {loadingStep > i ? <CheckCircle2 className="h-4 w-4 text-[#005bac] shrink-0" /> : loadingStep === i ? <Loader2 className="h-4 w-4 text-[#005bac] animate-spin shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                    <span className={cn("text-xs", loadingStep >= i ? "text-foreground" : "text-muted-foreground/50")}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {docState === "ready" && generationTemplate && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <Card className="border-[#005bac]/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-[11px] text-[#005bac] font-medium shrink-0 mt-0.5">대상:</span>
                    <div className="flex flex-wrap gap-1">
                      {generationTargetDocs.map((label) => (
                        <span key={label} className="inline-flex items-center gap-1 text-[11px] rounded-full border border-[#005bac]/30 bg-[#005bac]/5 text-[#005bac] px-2 py-0.5">
                          <FileText className="h-3 w-3" />{label}
                        </span>
                      ))}
                    </div>
                  </div>
                  {generationRefDocs.length > 0 && (
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-[11px] text-slate-500 font-medium shrink-0 mt-0.5">참조:</span>
                      <div className="flex flex-wrap gap-1">
                        {generationRefDocs.map((label) => (
                          <span key={label} className="inline-flex items-center gap-1 text-[11px] rounded-full border border-slate-300 bg-slate-50 text-slate-600 px-2 py-0.5">
                            <BookOpen className="h-3 w-3" />{label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5 border-t border-border/50">
                    <span className="text-[11px] text-muted-foreground">RAG 참조:</span>
                    {ragSources.map((src) => (
                      <Badge key={src} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{src}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">생성 결과 (직접 수정 가능)</p>
                  <p className="text-[11px] text-muted-foreground">{generatedContent.length}자</p>
                </div>
                <Textarea className="resize-none font-mono text-sm leading-6 min-h-[240px] bg-white" value={generatedContent} onChange={(e) => setGeneratedContent(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">수정 요청 사항 (자연어 입력)</p>
                <div className="flex gap-2">
                  <Input placeholder="예) 약관 조항 번호 추가, 구비서류 항목 보완해줘" className="text-sm bg-white" value={additionalPrompt} onChange={(e) => setAdditionalPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleRegenerate() }} />
                  <Button variant="outline" size="sm" className="shrink-0 hover:bg-[#005bac] hover:text-white hover:border-[#005bac] transition-colors" onClick={handleRegenerate}>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />재실행
                  </Button>
                </div>
                {revisionCount > 0 && <p className="text-[11px] text-muted-foreground">재생성 {revisionCount}회</p>}
              </div>
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-muted-foreground">다운로드 형식</p>
                <div className="flex flex-wrap gap-1.5">
                  {(["PDF", "DOCX", "PPTX", "HWP", "XLSX"] as DownloadFormat[]).map((fmt) => (
                    <button key={fmt} onClick={() => setDownloadFormat(fmt)} className={cn("flex-1 min-w-[52px] rounded-lg border py-2 text-[11px] font-medium transition-all duration-150", downloadFormat === fmt ? "border-[#005bac] bg-[#005bac] text-white" : "border-border bg-white text-muted-foreground hover:border-[#005bac]/40")}>{fmt}</button>
                  ))}
                </div>
                <Button className="w-full bg-[#005bac] hover:bg-[#004a8f] text-white" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />{downloadFormat}로 다운로드
                </Button>
              </div>
            </div>
          )}

          {docState === "downloading" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-10 w-10 text-[#005bac] animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium">{downloadFormat} 파일 생성 중…</p>
              </div>
            </div>
          )}

          {docState === "done" && generationTemplate && currentTpl && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-sm space-y-4">
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 text-[#005bac] mx-auto mb-3" />
                  <p className="text-base font-semibold">다운로드 완료</p>
                  <p className="text-xs text-muted-foreground mt-1">문서가 성공적으로 생성되었습니다</p>
                </div>
                <Card className="border-[#005bac]/20">
                  <CardContent className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-xs text-muted-foreground">파일명</span><span className="font-medium text-xs">{downloadFileName}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-muted-foreground">유형</span><span className="font-medium">{currentTpl.label}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-muted-foreground">형식</span><span className="font-medium">{downloadFormat}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-muted-foreground">생성 시각</span><span className="font-medium">{downloadedAt}</span></div>
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground mb-1.5">대상문서</p>
                      <div className="flex flex-wrap gap-1">
                        {generationTargetDocs.map((label) => (
                          <span key={label} className="text-[11px] rounded-full border border-[#005bac]/20 bg-[#005bac]/5 text-[#005bac] px-2 py-0.5">{label}</span>
                        ))}
                      </div>
                    </div>
                    {generationRefDocs.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">참조문서</p>
                        <div className="flex flex-wrap gap-1">
                          {generationRefDocs.map((label) => (
                            <span key={label} className="text-[11px] rounded-full border border-muted px-2 py-0.5 text-muted-foreground">{label}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {generationTemplate === "sok" && (
                      <div className="border-t pt-3 flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <p className="text-[11px] text-indigo-600">SOK 지식센터에 자동 등록되었습니다</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Button variant="outline" className="w-full" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />새 문서 생성
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── 템플릿 설정 모달 ─────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-sm font-semibold">
                {editingKey === null ? "새 템플릿 추가" : "템플릿 설정"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground/50 hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="p-5 space-y-4 max-h-[calc(100vh-260px)] overflow-y-auto">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">유형 제목 *</label>
                <Input
                  value={editForm.label}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="예) 상품 요약서"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">목적</label>
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="예) 신상품 특징 요약 및 비교 정리"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">프롬프트 (생성 지시사항)</label>
                <Textarea
                  value={editForm.prompt}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, prompt: e.target.value }))}
                  placeholder="AI에게 전달할 생성 지시사항을 입력하세요&#10;예) 업로드된 문서를 바탕으로 고객용 요약문을 작성하세요. 전문용어는 쉬운 표현으로 바꾸고..."
                  className="resize-none text-sm min-h-[120px]"
                />
                <p className="text-[11px] text-muted-foreground mt-1">{editForm.prompt.length}자</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">글씨체</label>
                  <div className="space-y-1.5">
                    {(["Pretendard", "나눔고딕", "맑은 고딕"] as FontOption[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setEditForm((prev) => ({ ...prev, font: f }))}
                        className={cn(
                          "w-full px-3 py-2 rounded-md border text-xs text-left transition-all",
                          editForm.font === f ? "border-[#005bac] bg-[#005bac]/5 text-[#005bac] font-medium" : "border-border text-muted-foreground hover:border-[#005bac]/40",
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">크기</label>
                  <div className="space-y-1.5">
                    {([["소", "12px"], ["중", "14px"], ["대", "16px"]] as [FontSizeOption, string][]).map(([s, px]) => (
                      <button
                        key={s}
                        onClick={() => setEditForm((prev) => ({ ...prev, fontSize: s }))}
                        className={cn(
                          "w-full px-3 py-2 rounded-md border text-xs text-left transition-all",
                          editForm.fontSize === s ? "border-[#005bac] bg-[#005bac]/5 text-[#005bac] font-medium" : "border-border text-muted-foreground hover:border-[#005bac]/40",
                        )}
                      >
                        {s} <span className="text-muted-foreground">({px})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex items-center justify-between px-5 py-4 border-t bg-[#f4f7fb]/50">
              <div>
                {editingKey && templates.find((t: TemplateConfig) => t.key === editingKey)?.isCustom && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 gap-1.5"
                    onClick={() => deleteTemplate(editingKey)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />삭제
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>취소</Button>
                <Button
                  size="sm"
                  className="bg-[#005bac] hover:bg-[#004a8f] text-white disabled:opacity-40"
                  disabled={!editForm.label.trim()}
                  onClick={saveTemplate}
                >
                  저장
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

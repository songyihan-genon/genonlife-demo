"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { useToast } from "@/hooks/use-toast"
import {
  Headset,
  Copy,
  History,
  Loader2,
  RotateCcw,
  FileText,
  Upload,
  CheckCircle2,
  X,
  ChevronDown,
} from "lucide-react"

type SupportMode = "direction" | "draft" | "combined"

type SupportTemplate = {
  id: string
  key: SupportMode
  title: string
  description: string
}

type ComplaintForm = {
  civilPetitioner: string
  complaintId: string
  complaintType: string
  complaintTypeDetail: string
  submittedAt: string
  dueDate: string
  intakeChannel: string
  complaintTitle: string
  complaintBody: string
  extraRequest: string
  uploadedFileName: string
}

type GeneratedResult = {
  summary: string
  extractedPoints: string[]
  similarCases: Array<{ title: string; note: string; tag: string }>
  directionGuide: string[]
  responseDraft: string
}

type HistoryItem = {
  id: string
  timestamp: number
  template: SupportMode
  templateTitle: string
  form: ComplaintForm
  result: GeneratedResult
}

type FollowUpMessage = {
  role: "assistant" | "user"
  content: string
}

const HISTORY_KEY = "civil_support_history_v1"
const TEMPLATE_KEY = "civil_support_templates_v1"

const SUPPORT_TEMPLATES: SupportTemplate[] = [
  {
    id: "direction",
    key: "direction",
    title: "처리 방향 제시",
    description: "민원 핵심 쟁점과 우선 검토 방향을 정리합니다.",
  },
  {
    id: "draft",
    key: "draft",
    title: "답변 초안 작성",
    description: "민원인에게 발송할 답변 초안을 바로 작성합니다.",
  },
  {
    id: "combined",
    key: "combined",
    title: "통합 지원",
    description: "처리 방향과 답변 초안을 함께 생성합니다.",
  },
]

const INITIAL_FORM: ComplaintForm = {
  civilPetitioner: "",
  complaintId: "",
  complaintType: "",
  complaintTypeDetail: "",
  submittedAt: "",
  dueDate: "",
  intakeChannel: "",
  complaintTitle: "",
  complaintBody: "",
  extraRequest: "",
  uploadedFileName: "",
}

const DEMO_HISTORY: Array<{ template: SupportMode; form: ComplaintForm }> = [
  {
    template: "combined",
    form: {
      civilPetitioner: "김민수",
      complaintId: "VOC-20260408-011",
      complaintType: "채무조정 문의",
      complaintTypeDetail: "",
      submittedAt: "2026-04-08",
      dueDate: "2026-04-10",
      intakeChannel: "국민신문고",
      complaintTitle: "채무조정 접수 후 추가 진행 절차 문의",
      complaintBody:
        "채무조정 상담을 받은 뒤 추가로 제출해야 하는 서류와 심사 일정이 궁금하다는 민원입니다. 접수 이후 진행 상황을 어디서 확인할 수 있는지도 함께 안내해달라는 요청이 포함되어 있습니다.",
      extraRequest: "추가 제출 서류와 예상 회신 일정을 함께 설명해줘.",
      uploadedFileName: "민원내용_20260408.pdf",
    },
  },
  {
    template: "draft",
    form: {
      civilPetitioner: "이서연",
      complaintId: "VOC-20260408-017",
      complaintType: "상담 태도 민원",
      complaintTypeDetail: "",
      submittedAt: "2026-04-08",
      dueDate: "2026-04-11",
      intakeChannel: "이메일",
      complaintTitle: "전화 상담 응대 태도 관련 민원",
      complaintBody:
        "민원인은 전화 상담 과정에서 충분한 설명을 듣지 못했고 응대 태도가 사무적으로 느껴졌다고 주장합니다. 향후 처리 절차와 재발 방지 조치에 대한 설명을 요청하고 있습니다.",
      extraRequest: "사과 표현은 포함하되 과도하게 책임을 인정하는 문구는 피하고 싶어.",
      uploadedFileName: "",
    },
  },
]

function formatDateLabel(value: string) {
  if (!value) return "미정"
  return value.replaceAll("-", ".")
}

function getComplaintTypeLabel(form: Pick<ComplaintForm, "complaintType" | "complaintTypeDetail">) {
  if (form.complaintType === "기타") {
    return form.complaintTypeDetail.trim() || "기타 민원"
  }

  return form.complaintType || "민원 유형 미지정"
}

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function inferComplaintType(form: ComplaintForm) {
  const combined = `${form.complaintTitle} ${form.complaintBody} ${form.extraRequest}`.toLowerCase()

  if (combined.includes("채무조정")) return "채무조정 문의"
  if (combined.includes("소액대출") || combined.includes("대출")) return "소액대출 문의"
  if (combined.includes("상환") || combined.includes("납부") || combined.includes("일정")) return "상환 일정 문의"
  if (combined.includes("태도") || combined.includes("불친절") || combined.includes("설명 부족")) return "상담 태도 민원"
  if (combined.includes("서류") || combined.includes("보완")) return "서류 보완 요청"

  return "기타"
}

function inferComplaintTitle(form: ComplaintForm, complaintType: string) {
  if (form.complaintTitle.trim()) return form.complaintTitle.trim()

  if (complaintType === "채무조정 문의") return "채무조정 진행 절차 문의"
  if (complaintType === "소액대출 문의") return "소액대출 신청 및 조건 문의"
  if (complaintType === "상환 일정 문의") return "상환 일정 및 납부 방법 문의"
  if (complaintType === "상담 태도 민원") return "상담 응대 태도 관련 민원"
  if (complaintType === "서류 보완 요청") return "추가 제출 서류 및 보완 절차 문의"

  return "민원 처리 요청"
}

function finalizeComplaintForm(form: ComplaintForm): ComplaintForm {
  const complaintType = form.complaintType || inferComplaintType(form)
  const today = form.submittedAt || formatIsoDate(new Date())
  const dueSource = new Date()
  dueSource.setDate(dueSource.getDate() + 2)

  return {
    ...form,
    civilPetitioner: form.civilPetitioner || "민원인",
    complaintId: form.complaintId || `VOC-${today.replaceAll("-", "")}-001`,
    complaintType,
    complaintTitle: inferComplaintTitle(form, complaintType),
    submittedAt: today,
    dueDate: form.dueDate || formatIsoDate(dueSource),
    intakeChannel: form.intakeChannel || "국민신문고",
  }
}

function extractComplaintKeywords(form: ComplaintForm) {
  const combined = `${form.complaintTitle} ${form.complaintBody} ${form.extraRequest}`.toLowerCase()

  const points: string[] = []

  if (combined.includes("서류")) points.push("추가 제출 서류 및 확인 절차 안내 필요")
  if (combined.includes("일정") || combined.includes("기한") || combined.includes("언제")) points.push("처리 일정 및 회신 예정일 명시 필요")
  if (combined.includes("태도") || combined.includes("불친절") || combined.includes("설명")) points.push("응대 태도 관련 사과 및 재발 방지 표현 필요")
  if (combined.includes("확인") || combined.includes("진행 상황")) points.push("처리 단계 조회 방법 안내 필요")
  if (combined.includes("대출")) points.push("연계 가능 제도와 신청 조건 설명 필요")
  if (combined.includes("채무조정")) points.push("채무조정 절차 및 후속 심사 안내 필요")

  if (points.length === 0) {
    points.push("민원 요지를 기준으로 담당 부서 검토와 후속 절차 안내가 필요")
  }

  return points
}

function buildSimilarCases(form: ComplaintForm) {
  const type = getComplaintTypeLabel(form)

  if (type.includes("채무조정")) {
    return [
      {
        title: "채무조정 접수 후 추가 서류 안내 민원",
        note: "접수 후 제출 서류 목록과 심사 일정을 함께 안내해 민원 재문의율을 낮춘 사례",
        tag: "유사 민원",
      },
      {
        title: "진행 상황 조회 경로 문의",
        note: "민원 포털 및 상담센터 조회 경로를 함께 제시해 후속 문의를 줄인 사례",
        tag: "처리 참고",
      },
    ]
  }

  if (type.includes("상담 태도")) {
    return [
      {
        title: "상담 응대 품질 개선 요청 민원",
        note: "사과 문구와 내부 교육 계획을 함께 안내해 수용성을 높인 사례",
        tag: "유사 민원",
      },
      {
        title: "설명 부족 재문의 민원",
        note: "핵심 절차를 단계별로 다시 안내하고 후속 연락 계획을 명시한 사례",
        tag: "답변 참고",
      },
    ]
  }

  return [
    {
      title: "민원 접수 후 후속 절차 안내 사례",
      note: "처리 방향과 예상 일정을 함께 제시해 재문의율을 낮춘 사례",
      tag: "기본 사례",
    },
    {
      title: "담당 부서 검토 중 회신 초안",
      note: "추가 확인 중이라는 점과 회신 일정을 함께 안내한 사례",
      tag: "답변 참고",
    },
  ]
}

function buildDirectionGuide(form: ComplaintForm) {
  const type = getComplaintTypeLabel(form)
  const dueDate = formatDateLabel(form.dueDate)

  const base = [
    `민원 유형을 ${type} 기준으로 분류하고, 접수 경로(${form.intakeChannel || "미지정"})에 맞는 회신 형식을 우선 확인합니다.`,
    `민원 본문에서 핵심 쟁점과 추가 확인 필요 항목을 분리해 담당 부서 검토 포인트로 정리합니다.`,
    `${dueDate === "미정" ? "회신 예정일은 내부 검토 후 확정이 필요합니다." : `${dueDate} 전후 회신을 목표로 검토 일정을 안내합니다.`}`,
  ]

  if (type.includes("채무조정")) {
    base.push("채무조정 신청 절차, 필요 서류, 진행 상황 조회 경로를 한 문단으로 묶어 설명하는 것이 적절합니다.")
  } else if (type.includes("상담 태도")) {
    base.push("불편 경험에 대한 공감 표현과 함께 재발 방지 조치, 추가 확인 절차를 분리해 안내하는 구성이 적절합니다.")
  } else {
    base.push("민원 요지에 대한 사실 확인 범위와 후속 절차를 구분해 설명하는 구성이 적절합니다.")
  }

  return base
}

function buildResponseDraft(form: ComplaintForm) {
  const type = getComplaintTypeLabel(form)
  const submittedAt = formatDateLabel(form.submittedAt)
  const dueDate = formatDateLabel(form.dueDate)

  const opening =
    type.includes("상담 태도")
      ? `${form.civilPetitioner || "민원인"}님께서 느끼신 불편에 대해 유감스럽게 생각합니다.`
      : `${form.civilPetitioner || "민원인"}님께서 문의주신 내용은 정상적으로 접수되었습니다.`

  const body = type.includes("채무조정")
    ? "채무조정 관련 문의 사항은 제출 서류 확인과 내부 검토 절차를 거쳐 순차적으로 안내드리고 있습니다. 추가 제출이 필요한 자료와 진행 단계는 담당 부서 확인 후 별도 안내드릴 예정입니다."
    : type.includes("상담 태도")
      ? "말씀해주신 상담 과정은 관련 부서에서 확인 중이며, 응대 과정에서 부족했던 설명이 있었다면 해당 부분을 보완할 수 있도록 검토하겠습니다. 향후 동일한 불편이 발생하지 않도록 내부 안내 기준도 함께 점검하겠습니다."
      : "문의하신 내용은 담당 부서에서 검토 중이며, 확인이 필요한 항목을 정리해 회신드릴 예정입니다. 필요한 경우 추가 자료 요청 또는 유선 안내가 함께 진행될 수 있습니다."

  const additionalNotice = form.extraRequest.trim()
    ? type.includes("채무조정")
      ? "추가 제출 서류와 예상 회신 일정은 담당 부서 확인 후 함께 안내드리겠습니다."
      : type.includes("상담 태도")
        ? "추가로 요청하신 안내 사항은 사실관계 확인 결과와 함께 정리하여 안내드리겠습니다."
        : "추가 요청하신 사항은 검토 결과와 함께 정리하여 회신드리겠습니다."
    : ""

  return [
    `안녕하세요. 제논라이프입니다.`,
    ``,
    `${submittedAt} 접수된 민원(${form.complaintId || "VOC-XXXX"})에 대해 안내드립니다.`,
    opening,
    ``,
    body,
    ``,
    `${dueDate === "미정" ? "검토 결과는 확인되는 즉시 안내드리겠습니다." : `${dueDate} 전후로 1차 회신을 드릴 예정입니다.`}`,
    additionalNotice,
    `감사합니다.`,
  ]
    .filter(Boolean)
    .join("\n")
}

function buildGeneratedResult(form: ComplaintForm): GeneratedResult {
  const type = getComplaintTypeLabel(form)
  const extractedPoints = extractComplaintKeywords(form)
  const similarCases = buildSimilarCases(form)
  const directionGuide = buildDirectionGuide(form)
  const responseDraft = buildResponseDraft(form)

  return {
    summary: `${type} 관련 민원을 기반으로 유사 사례를 조회하고, 처리 방향과 회신 초안을 함께 생성한 결과입니다.`,
    extractedPoints,
    similarCases,
    directionGuide,
    responseDraft,
  }
}

function buildDirectionMarkdown(points: string[]) {
  return [
    "### 검토 방향",
    "",
    ...points.map((point) => `- ${point}`),
  ].join("\n")
}

function buildFollowUpAssistantReply(request: string) {
  const trimmed = request.trim()

  if (!trimmed) {
    return {
      requiresClarification: true,
      message: "추가로 반영할 요청을 입력해 주세요.",
    }
  }

  if (trimmed.length < 10 || ["수정해줘", "다듬어줘", "보완해줘", "조정해줘"].includes(trimmed)) {
    return {
      requiresClarification: true,
      message: "어떤 방향으로 수정할지 조금 더 알려주세요. 예를 들어 회신 톤 강화, 제출 서류 강조, 일정 문구 보완처럼 요청할 수 있습니다.",
    }
  }

  if (trimmed.includes("서류") || trimmed.includes("일정")) {
    return {
      requiresClarification: false,
      message: "제출 서류와 예상 회신 일정 안내를 강화하는 방향으로 결과를 갱신했습니다.",
    }
  }

  if (trimmed.includes("정중") || trimmed.includes("친절") || trimmed.includes("공손")) {
    return {
      requiresClarification: false,
      message: "회신 문체를 더 정중하게 다듬는 방향으로 답변 초안을 갱신했습니다.",
    }
  }

  return {
    requiresClarification: false,
    message: "추가 요청을 반영해 처리 방향과 답변 초안을 다시 정리했습니다.",
  }
}

export function FormattingTool() {
  const { toast } = useToast()
  const [template, setTemplate] = useState<SupportMode>("combined")
  const [templates, setTemplates] = useState<SupportTemplate[]>([])
  const [form, setForm] = useState<ComplaintForm>(INITIAL_FORM)
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isViewingHistory, setIsViewingHistory] = useState(false)
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>([])
  const [followUpInput, setFollowUpInput] = useState("")

  useEffect(() => {
    try {
      const rawTemplates = localStorage.getItem(TEMPLATE_KEY)
      if (rawTemplates) {
        const parsed = JSON.parse(rawTemplates) as SupportTemplate[]
        setTemplates(parsed.length ? parsed : SUPPORT_TEMPLATES)
      } else {
        setTemplates(SUPPORT_TEMPLATES)
      }

      const rawHistory = localStorage.getItem(HISTORY_KEY)
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory) as HistoryItem[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed)
          return
        }
      }

      const seededHistory = DEMO_HISTORY.map((item, index) => {
        const templateMeta = SUPPORT_TEMPLATES.find((templateItem) => templateItem.key === item.template) || SUPPORT_TEMPLATES[0]
        return {
          id: `demo-civil-support-${item.template}-${index}`,
          timestamp: Date.now() - index * 60 * 60 * 1000,
          template: item.template,
          templateTitle: templateMeta.title,
          form: item.form,
          result: buildGeneratedResult(item.form),
        }
      })
      setHistory(seededHistory)
    } catch {
      setTemplates(SUPPORT_TEMPLATES)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates))
    } catch {}
  }, [templates])

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch {}
  }, [history])

  const selectedTemplateMeta = useMemo(
    () => templates.find((item) => item.key === template) || SUPPORT_TEMPLATES[0],
    [template, templates],
  )
  const showDirectionResult = template === "direction" || template === "combined"
  const showDraftResult = template === "draft" || template === "combined"
  const showDualResultLayout = showDirectionResult && showDraftResult && !isViewingHistory
  const isComposerOnly = !result && !isViewingHistory
  const directionMarkdown = useMemo(() => {
    if (!result) return ""
    return buildDirectionMarkdown(result.directionGuide)
  }, [result])
  const extraRequestRows = useMemo(() => {
    const text = form.extraRequest || ""
    const lines = text.split("\n").length
    const wrapped = Math.ceil(text.length / 42)
    return Math.min(Math.max(Math.max(lines, wrapped), 4), 8)
  }, [form.extraRequest])

  const hasInput = Object.values(form).some((value) => value.trim().length > 0)

  const updateField = (field: keyof ComplaintForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const applyHistory = (item: HistoryItem) => {
    setTemplate(item.template)
    setForm({ ...INITIAL_FORM, ...item.form })
    setResult(item.result)
    setIsViewingHistory(true)
    setFollowUpInput("")
    setFollowUpMessages([
      {
        role: "assistant",
        content: "기존 민원 초안을 불러왔습니다. 추가 요청이 있으면 이어서 입력해 주세요.",
      },
      ...(item.form.extraRequest
        ? [
            {
              role: "user" as const,
              content: item.form.extraRequest,
            },
          ]
        : []),
    ])
  }

  const generateResult = async () => {
    if (!form.complaintBody.trim()) {
      toast({ description: "민원 내용을 입력해주세요." })
      return
    }

    setIsGenerating(true)
    try {
      const nextForm = finalizeComplaintForm(form)
      const nextResult = buildGeneratedResult(nextForm)
      setForm(nextForm)
      setResult(nextResult)
      setHistory((prev) => [
        {
          id: `${Date.now()}`,
          timestamp: Date.now(),
          template,
          templateTitle: selectedTemplateMeta.title,
          form: nextForm,
          result: nextResult,
        },
        ...prev,
      ].slice(0, 30))
      if (!isViewingHistory) {
        setFollowUpMessages([])
        setFollowUpInput("")
      }
      toast({ description: "민원처리 지원 결과를 생성했습니다." })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFollowUpSubmit = async () => {
    const interpretation = buildFollowUpAssistantReply(followUpInput)
    if (!followUpInput.trim()) {
      toast({ description: interpretation.message })
      return
    }

    const userMessage = followUpInput.trim()
    setFollowUpMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setFollowUpInput("")

    if (interpretation.requiresClarification) {
      setFollowUpMessages((prev) => [...prev, { role: "assistant", content: interpretation.message }])
      return
    }

    setIsGenerating(true)
    try {
      const nextForm = finalizeComplaintForm({ ...form, extraRequest: userMessage })
      const nextResult = buildGeneratedResult(nextForm)
      setForm(nextForm)
      setResult(nextResult)
      setFollowUpMessages((prev) => [...prev, { role: "assistant", content: interpretation.message }])
      setHistory((prev) => [
        {
          id: `${Date.now()}`,
          timestamp: Date.now(),
          template,
          templateTitle: selectedTemplateMeta.title,
          form: nextForm,
          result: nextResult,
        },
        ...prev,
      ].slice(0, 30))
      toast({ description: "추가 요청을 반영했습니다." })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyDraft = async () => {
    if (!result?.responseDraft.trim()) return
    try {
      await navigator.clipboard.writeText(result.responseDraft)
      toast({ description: "답변 초안을 복사했습니다." })
    } catch {
      toast({ description: "복사에 실패했습니다." })
    }
  }

  const resetRequest = () => {
    setForm(INITIAL_FORM)
    setResult(null)
    setIsGenerating(false)
    setIsViewingHistory(false)
    setFollowUpMessages([])
    setFollowUpInput("")
    toast({ description: "입력값을 초기화했습니다." })
  }

  return (
    <div className="h-full w-full overflow-auto bg-background">
      <div className={`space-y-6 p-6 ${isViewingHistory ? "mx-0 max-w-none" : "mx-auto max-w-5xl"}`}>
        {isComposerOnly ? (
          <div className="relative mx-auto max-w-4xl">
            <div className="flex items-center justify-center gap-2">
              <Headset className="h-5 w-5 text-[#005BAC]" />
              <h1 className="text-xl font-bold">민원처리 어시스턴트</h1>
            </div>
            <Button variant="outline" size="sm" className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowHistory(true)}>
              <History className="mr-2 h-4 w-4" />
              히스토리 보기
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Headset className="h-5 w-5 text-[#005BAC]" />
              <h1 className="text-xl font-bold">민원처리 어시스턴트</h1>
            </div>
            <div className="flex items-center gap-2">
              {isViewingHistory ? (
                <Button variant="outline" onClick={resetRequest}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  새 요청 시작
                </Button>
              ) : null}
              <Button variant="outline" size="sm" className="text-muted-foreground" onClick={() => setShowHistory(true)}>
                <History className="mr-2 h-4 w-4" />
                히스토리 보기
              </Button>
            </div>
          </div>
        )}

        <div className={isViewingHistory ? "flex flex-col gap-6 lg:flex-row lg:items-start" : "grid grid-cols-1 gap-6 lg:grid-cols-12"}>
          <div
            className={
              isComposerOnly
                ? "lg:col-span-8 lg:col-start-3"
                : isViewingHistory
                  ? "min-w-0 space-y-6 lg:w-[280px] lg:flex-none xl:w-[300px]"
                  : "space-y-6 lg:col-span-4"
            }
          >
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>지원 모드</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="inline-flex w-full rounded-xl border border-[#FFD39A] bg-[#FFF9F2] p-1">
                  {templates.map((item) => {
                    const active = item.key === template
                    return (
                      <button
                        key={item.key}
                        onClick={() => setTemplate(item.key)}
                        className={`flex-1 rounded-lg px-2 py-2 text-center text-[11px] font-semibold leading-tight break-keep transition-colors sm:px-3 sm:text-xs ${
                          active ? "bg-[#005BAC] text-white shadow-sm" : "text-[#0B4F91] hover:bg-white"
                        }`}
                      >
                        {item.title}
                      </button>
                    )
                  })}
                </div>
                {templates.map((item) => {
                  if (item.key !== template) return null
                  if (isViewingHistory) return null
                  return (
                    <div key={`${item.key}-description`} className="rounded-lg border border-[#FFE3BF] bg-[#FFF9F2] px-3 py-2 text-sm text-[#0B4F91]">
                      {item.description}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle>민원 입력</CardTitle>
                {!isViewingHistory ? (
                  <div className="text-sm text-muted-foreground">민원 내용을 붙여넣거나 첨부한 뒤, 필요한 요청만 간단히 추가하세요.</div>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="complaint-body">민원 내용 또는 첨부 자료</Label>
                  <div className="rounded-xl border border-[#FFE3BF] bg-[#FFF9F2] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white"
                        disabled={isViewingHistory}
                        onClick={() => updateField("uploadedFileName", "민원접수원문_20260408.pdf")}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        파일 업로드
                      </Button>
                      {form.uploadedFileName ? (
                        <Badge className="bg-white text-[#C96A00] hover:bg-white">{form.uploadedFileName}</Badge>
                      ) : null}
                      {form.uploadedFileName ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isViewingHistory}
                          onClick={() => updateField("uploadedFileName", "")}
                        >
                          첨부 해제
                        </Button>
                      ) : null}
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      데모에서는 버튼 클릭 시 첨부 문서가 반영된 상태로 결과를 생성합니다.
                    </div>
                    <Textarea
                      id="complaint-body"
                      value={form.complaintBody}
                      readOnly={isViewingHistory}
                      onChange={(event) => updateField("complaintBody", event.target.value)}
                      placeholder="민원 내용을 붙여넣거나 요약이 필요한 내용을 입력하세요."
                      className={`mt-4 min-h-[220px] bg-white ${isViewingHistory ? "cursor-not-allowed opacity-80" : ""}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extra-request">추가 요청</Label>
                  <Textarea
                    id="extra-request"
                    value={form.extraRequest}
                    readOnly={isViewingHistory}
                    onChange={(event) => updateField("extraRequest", event.target.value)}
                    placeholder="예: 민원인에게 안내할 때 제출 서류와 예상 회신 일정을 함께 설명해줘."
                    rows={isViewingHistory ? Math.max(extraRequestRows, 5) : extraRequestRows}
                    className={`min-h-[110px] resize-none ${isViewingHistory ? "cursor-not-allowed opacity-80" : ""}`}
                  />
                </div>

                {!isViewingHistory ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={generateResult} disabled={isGenerating} className="bg-[#005BAC] hover:bg-[#004F9E] text-white sm:flex-1">
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        "민원 처리 지원 실행"
                      )}
                    </Button>
                    <Button variant="outline" onClick={resetRequest} disabled={!hasInput && !result} className="sm:flex-1">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      초기화
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {!isComposerOnly ? (
          <div className={isViewingHistory ? "min-w-0 lg:flex-1" : "lg:col-span-8"}>
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>생성 결과</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {result ? (
                  <>
                    <div className={showDualResultLayout ? (isViewingHistory ? "grid gap-4 xl:grid-cols-2" : "grid gap-4 xl:grid-cols-2") : "space-y-4"}>
                      {showDirectionResult ? (
                        <Card className="bg-muted/20">
                          <CardHeader>
                            <CardTitle className="text-base">민원 대응 방향</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="rounded-xl border bg-background px-5 py-4">
                              <MarkdownRenderer content={directionMarkdown} className="prose prose-sm max-w-none text-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ) : null}

                      {showDraftResult ? (
                        <Card className="bg-muted/20">
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">민원 답변 초안</CardTitle>
                            <Button variant="outline" size="sm" onClick={copyDraft}>
                              <Copy className="mr-2 h-4 w-4" />
                              초안 복사
                            </Button>
                          </CardHeader>
                          <CardContent>
                            <Textarea
                              value={result.responseDraft}
                              onChange={(event) =>
                                setResult((prev) => (prev ? { ...prev, responseDraft: event.target.value } : prev))
                              }
                              className={showDualResultLayout ? "min-h-[320px] bg-background" : "min-h-[420px] bg-background"}
                            />
                          </CardContent>
                        </Card>
                      ) : null}
                    </div>

                    <details className="group rounded-xl border border-[#FFE3BF] bg-[#FFF9F2]">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-[#0B4F91]">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          분석 근거 보기
                        </div>
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="space-y-4 border-t px-4 py-4">
                        <div className="rounded-lg border bg-white px-4 py-3">
                          <div className="text-xs font-medium text-muted-foreground">처리 요약</div>
                          <p className="mt-2 text-sm leading-6 text-[#6F665C]">{result.summary}</p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg border bg-white px-4 py-3">
                            <div className="text-xs font-medium text-muted-foreground">민원 유형</div>
                            <div className="mt-1 text-sm font-medium">{getComplaintTypeLabel(form)}</div>
                          </div>
                          <div className="rounded-lg border bg-white px-4 py-3">
                            <div className="text-xs font-medium text-muted-foreground">민원 제목</div>
                            <div className="mt-1 text-sm font-medium">{form.complaintTitle || "민원 처리 요청"}</div>
                          </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                          <Card className="bg-white">
                            <CardHeader>
                              <CardTitle className="text-base">추출된 핵심 포인트</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {result.extractedPoints.map((point) => (
                                <div key={point} className="rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground">
                                  • {point}
                                </div>
                              ))}
                            </CardContent>
                          </Card>

                          <Card className="bg-white">
                            <CardHeader>
                              <CardTitle className="text-base">유사 민원 사례</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {result.similarCases.map((item) => (
                                <div key={item.title} className="rounded-lg border bg-background p-4">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-sm font-semibold">{item.title}</div>
                                    <Badge variant="outline">{item.tag}</Badge>
                                  </div>
                                  <div className="mt-2 text-sm leading-6 text-muted-foreground">{item.note}</div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </details>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#FFD39A] bg-[#FFF9F2] p-10 text-center">
                    <FileText className="mx-auto h-8 w-8 text-[#005BAC]" />
                    <div className="mt-4 text-base font-semibold">민원처리 지원 결과가 여기에 표시됩니다.</div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      민원 내용을 입력하고 실행하면 유사 민원 사례, 처리 방향, 답변 초안을 함께 확인할 수 있습니다.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          ) : null}

          {isViewingHistory ? (
            <Card className="min-w-0 bg-card lg:w-[300px] lg:flex-none xl:w-[320px]">
              <CardHeader>
                <CardTitle>추가 요청 대화</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-[420px] space-y-3 overflow-auto pr-1">
                  {followUpMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={
                        message.role === "assistant"
                          ? "rounded-2xl rounded-tl-md bg-muted px-4 py-3 text-sm leading-6 text-foreground"
                          : "ml-auto max-w-[90%] rounded-2xl rounded-tr-md bg-[#EEF7FF] px-4 py-3 text-sm leading-6 text-[#0B4F91]"
                      }
                    >
                      {message.content}
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <Textarea
                    value={followUpInput}
                    onChange={(event) => setFollowUpInput(event.target.value)}
                    placeholder="예: 제출 서류 목록을 조금 더 명확하게 안내해줘."
                    className="min-h-[120px]"
                  />
                  <Button onClick={handleFollowUpSubmit} disabled={isGenerating} className="w-full bg-[#005BAC] hover:bg-[#004F9E] text-white">
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        반영 중...
                      </>
                    ) : (
                      "추가 요청 반영"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

        </div>

        {showHistory ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/35"
              aria-label="히스토리 닫기"
              onClick={() => setShowHistory(false)}
            />
            <div className="absolute inset-y-0 right-0 flex w-full justify-end">
              <div className="h-full w-full max-w-md border-l border-border bg-background shadow-2xl">
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    <div className="text-base font-semibold">민원 처리 히스토리</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="h-[calc(100vh-73px)] overflow-auto p-5">
                  {history.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">내역이 없습니다.</div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div key={item.id} className="rounded border border-border p-3 hover:bg-muted/60">
                          <div className="text-[11px] text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</div>
                          <div className="mt-1 inline-flex rounded-full border border-border bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                            {item.templateTitle}
                          </div>
                          <div className="mt-3 rounded-lg border bg-background px-3 py-3">
                            <div className="text-sm font-medium">{item.form.complaintTitle || "민원 제목 없음"}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{getComplaintTypeLabel(item.form)}</div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {item.form.submittedAt || "-"} / {item.form.complaintId || "-"}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                applyHistory(item)
                                setShowHistory(false)
                              }}
                            >
                              열기
                            </Button>
                            <Button
                              size="sm"
                              onClick={async () => {
                                await navigator.clipboard.writeText(item.result.responseDraft)
                                toast({ description: "답변 초안을 복사했습니다." })
                              }}
                            >
                              복사
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

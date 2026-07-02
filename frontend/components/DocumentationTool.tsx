"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { FileText, Check, Loader2, Download, History, PanelRightOpen, PanelRightClose, Settings, RotateCcw, MessageSquare, SendHorizontal, Eye, ChevronDown, ChevronUp } from "lucide-react"
import { FileUploadBox } from "@/components/FileUploadBox"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

type OutputFormat = "pptx" | "docx"
type Template = {
  id: string
  title: string
  description: string
  output: OutputFormat
}

type HistoryItem = {
  id: string
  timestamp: number
  templateId: string
  templateTitle: string
  templateOutput: OutputFormat
  requestTitle: string
  sourceLabel: string
  form: DraftForm
  html: string
  editorDraft: string
  assistantMessages: AssistantMessage[]
}

type DraftForm = {
  requestTitle: string
  purpose: string
  background: string
  audience: string
  tone: string
  keywords: string
  approvalType: string
  requestPeriod: string
  requestDate: string
  requestItems: string
  requestAmount: string
  expectedBenefits: string
  approvalRequest: string
  projectScope: string
  requiredCapabilities: string
  evaluationCriteria: string
  projectSchedule: string
  coreMessage: string
  quote: string
  contactInfo: string
  systemTarget: string
  functionalRequirements: string
  acceptanceCriteria: string
  currentStatus: string
  issues: string
  actionPlan: string
}

type DemoScenario = {
  id: string
  title: string
  description: string
  templateId: string
  form: DraftForm
}

type FormFieldConfig = {
  key: keyof DraftForm
  label: string
  placeholder: string
  multiline?: boolean
  type?: "text" | "textarea" | "select"
}

type UserProfile = {
  name: string
  department: string
  team: string
  role: string
}

type RenderSection = {
  title: string
  lines: string[]
}

type AssistantMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

const TEMPLATES_KEY = "doc_templates_v1"
const HISTORY_KEY = "doc_history_v5"

const DEFAULT_TEMPLATES: Template[] = [
  { id: "approval-doc", title: "전자결재 초안", description: "추진 배경, 기대 효과, 요청 사항 중심의 결재 문서", output: "docx" },
  { id: "proposal-request", title: "제안요청서/RFP", description: "사업 개요, 요구사항, 평가 기준 섹션 구성", output: "docx" },
  { id: "spec-sheet", title: "시방서 초안", description: "기능 요구, 구축 범위, 검수 기준 정리", output: "docx" },
  { id: "press-release", title: "홍보/언론 기사", description: "보도자료 형식의 제목, 리드, 본문 구성", output: "docx" },
  { id: "briefing-deck", title: "보고자료 (PPTX)", description: "표지, 현황, 기대 효과, 추진 일정 슬라이드", output: "pptx" },
]

const INITIAL_FORM: DraftForm = {
  requestTitle: "",
  purpose: "",
  background: "",
  audience: "",
  tone: "정중하고 명확한 업무 문체",
  keywords: "",
  approvalType: "general",
  requestPeriod: "",
  requestDate: "",
  requestItems: "",
  requestAmount: "",
  expectedBenefits: "",
  approvalRequest: "",
  projectScope: "",
  requiredCapabilities: "",
  evaluationCriteria: "",
  projectSchedule: "",
  coreMessage: "",
  quote: "",
  contactInfo: "",
  systemTarget: "",
  functionalRequirements: "",
  acceptanceCriteria: "",
  currentStatus: "",
  issues: "",
  actionPlan: "",
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "approval-ai-support",
    title: "전자결재 예시",
    description: "고객응대 AI 도입 검토 보고",
    templateId: "approval-doc",
    form: {
      requestTitle: "고객응대 생성형 AI 도입 검토 보고",
      purpose: "비용 품의",
      background: "",
      audience: "경영진, 운영지원팀",
      tone: "정중하고 명확한 결재 문체",
      keywords: "고객응대, 운영효율, 생성형 AI, 시범운영",
      approvalType: "expense",
      requestPeriod: "",
      requestDate: "2026-03-25",
      requestItems: "고객응대 생성형 AI 시범 운영 관련 솔루션 사용료",
      requestAmount: "3,500,000원",
      expectedBenefits: "반복 문의 응답 시간 단축\n현장 안내 문구 품질 표준화\n고객센터 업무 부담 완화",
      approvalRequest: "시범 운영 승인 검토\n적용 대상 서비스 범위 확정\n추진 일정 협의",
      projectScope: "",
      requiredCapabilities: "",
      evaluationCriteria: "",
      projectSchedule: "",
      coreMessage: "",
      quote: "",
      contactInfo: "",
      systemTarget: "",
      functionalRequirements: "",
      acceptanceCriteria: "",
      currentStatus: "",
      issues: "",
      actionPlan: "",
    },
  },
  {
    id: "rfp-portal",
    title: "RFP 예시",
    description: "생성형 AI 도입 요구사항 초안",
    templateId: "proposal-request",
    form: {
      requestTitle: "제논라이프 생성형 AI 도입 제안요청서 초안",
      purpose: "생성형 AI 도입을 위한 제안요청서 초안 작성\n플랫폼 구성과 주요 서비스 범위를 정리",
      background: "사내 생성형 AI 활용 수요가 증가하고 있으며 문서 작성, 고객 응대, 데이터 분석 업무를 통합 지원할 플랫폼이 필요함\n보안성과 확장성을 고려한 업무형 포털 구성이 요구됨",
      audience: "구매부서, IT기획, 사업수행 후보사",
      tone: "공식적이고 구조적인 RFP 문체",
      keywords: "생성형 AI, 업무비서, 데이터분석, 고객지원, 권한관리",
      approvalType: "general",
      requestPeriod: "",
      requestDate: "",
      requestItems: "",
      requestAmount: "",
      expectedBenefits: "",
      approvalRequest: "",
      projectScope: "플랫폼 공통 홈, 권한 관리, 서비스 진입 UI 포함\nAI 업무비서, 데이터 분석, 고객 지원, 개발 지원 서비스 범위 정의",
      requiredCapabilities: "사내 로그인 연동\n대화형 인터페이스\n문서 업로드/요약\n운영 로그 및 관리자 기능",
      evaluationCriteria: "플랫폼 확장성\n보안 및 권한 관리\nUI 사용성\n유지보수 용이성",
      projectSchedule: "요구사항 분석\n프로토타입 구축\n시범 운영\n정식 확산",
      coreMessage: "",
      quote: "",
      contactInfo: "",
      systemTarget: "",
      functionalRequirements: "",
      acceptanceCriteria: "",
      currentStatus: "",
      issues: "",
      actionPlan: "",
    },
  },
  {
    id: "press-release",
    title: "보도자료 예시",
    description: "AI 포털 도입 홍보 초안",
    templateId: "press-release",
    form: {
      requestTitle: "제논라이프 생성형 AI 포털 도입 보도자료 초안",
      purpose: "생성형 AI 포털 도입 배경과 기대 효과를 외부 홍보용 보도자료 형식으로 작성",
      background: "제논라이프는 상담 품질과 내부 업무 생산성 강화를 위해 생성형 AI 기반 통합 포털 도입을 추진하고 있음\n이번 포털은 상담 지원, 지식 검색, 데이터 분석, 문서 작성 등 다양한 서비스를 하나의 플랫폼에서 제공하는 것이 핵심임",
      audience: "언론사, 대외 홍보 채널",
      tone: "대외 홍보용으로 명료하고 긍정적인 문체",
      keywords: "디지털 혁신, 생성형 AI, 고객 서비스, 업무 생산성",
      approvalType: "general",
      requestPeriod: "",
      requestDate: "",
      requestItems: "",
      requestAmount: "",
      expectedBenefits: "",
      approvalRequest: "",
      projectScope: "",
      requiredCapabilities: "",
      evaluationCriteria: "",
      projectSchedule: "",
      coreMessage: "고객 서비스 혁신과 내부 업무 생산성 강화를 동시에 추진하는 생성형 AI 포털 도입",
      quote: "제논라이프는 상담 현장과 내부 업무 전반에서 바로 활용 가능한 AI 서비스를 단계적으로 확대해 나갈 계획입니다.",
      contactInfo: "홍보팀 033-000-0000 / pr@kangwonland.local",
      systemTarget: "",
      functionalRequirements: "",
      acceptanceCriteria: "",
      currentStatus: "",
      issues: "",
      actionPlan: "",
    },
  },
]

const COMMON_FIELDS: FormFieldConfig[] = [
  {
    key: "requestTitle",
    label: "문서 제목 또는 요청명",
    placeholder: "예: 고객응대 AI 구축 검토 보고",
  },
  {
    key: "purpose",
    label: "문서 목적",
    placeholder: "예: 작성 목적과 활용 대상을 2~3줄로 입력",
    multiline: true,
  },
  {
    key: "audience",
    label: "대상 부서 또는 독자",
    placeholder: "예: 경영진, 운영지원팀, 언론사",
  },
  {
    key: "tone",
    label: "원하는 문체/톤",
    placeholder: "예: 정중하고 명확한 업무 문체",
  },
  {
    key: "keywords",
    label: "포함할 키워드",
    placeholder: "예: 고객응대, 생성형 AI, 운영효율",
  },
]

const APPROVAL_TYPE_OPTIONS = [
  { value: "general", label: "일반 결재" },
  { value: "annual-leave", label: "연차 사용" },
  { value: "meal", label: "식대 정산" },
  { value: "expense", label: "비용 품의" },
]

const TEMPLATE_FIELDS: Record<string, FormFieldConfig[]> = {
  "approval-doc": [
    {
      key: "approvalType",
      label: "결재 유형",
      placeholder: "결재 유형을 선택하세요",
      type: "select",
    },
    {
      key: "requestPeriod",
      label: "사용 기간",
      placeholder: "예: 2026-04-03 ~ 2026-04-04",
    },
  ],
  "proposal-request": [
    {
      key: "background",
      label: "사업 배경",
      placeholder: "예: 플랫폼 구축이 필요한 배경과 현재 한계",
      multiline: true,
    },
    {
      key: "projectScope",
      label: "구축 범위",
      placeholder: "예: 대상 서비스, 플랫폼 범위, 연계 대상",
      multiline: true,
    },
    {
      key: "requiredCapabilities",
      label: "필수 요구사항",
      placeholder: "예: 로그인 연동, 문서 처리, 관리자 기능",
      multiline: true,
    },
    {
      key: "evaluationCriteria",
      label: "평가 기준",
      placeholder: "예: 보안성, 확장성, 사용성, 유지보수성",
      multiline: true,
    },
    {
      key: "projectSchedule",
      label: "추진 일정",
      placeholder: "예: 분석, 구축, 시범 운영, 확산 일정",
      multiline: true,
    },
  ],
  "spec-sheet": [
    {
      key: "systemTarget",
      label: "대상 시스템/서비스",
      placeholder: "예: 민원상담 포털, 규정 검색 서비스",
      multiline: true,
    },
    {
      key: "functionalRequirements",
      label: "기능 요구사항",
      placeholder: "예: 사용자 기능, 관리자 기능, 연계 기능",
      multiline: true,
    },
    {
      key: "acceptanceCriteria",
      label: "검수 기준",
      placeholder: "예: 필수 기능 동작, 응답 시간, 로그 확인",
      multiline: true,
    },
  ],
  "press-release": [
    {
      key: "background",
      label: "도입 배경",
      placeholder: "예: 사업 추진 배경과 시장/운영 맥락",
      multiline: true,
    },
    {
      key: "coreMessage",
      label: "핵심 메시지",
      placeholder: "예: 대외적으로 강조할 핵심 메시지",
      multiline: true,
    },
    {
      key: "quote",
      label: "인용문",
      placeholder: "예: 담당자 또는 임원 인용문",
      multiline: true,
    },
    {
      key: "contactInfo",
      label: "문의처",
      placeholder: "예: 홍보팀 연락처와 이메일",
      multiline: true,
    },
  ],
  "briefing-deck": [
    {
      key: "currentStatus",
      label: "현황",
      placeholder: "예: 현재 운영 현황과 수치",
      multiline: true,
    },
    {
      key: "issues",
      label: "주요 이슈",
      placeholder: "예: 문제점, 리스크, 개선 필요 사항",
      multiline: true,
    },
    {
      key: "actionPlan",
      label: "추진 계획",
      placeholder: "예: 다음 단계와 일정",
      multiline: true,
    },
  ],
}

function getApprovalTypeLabel(value: string) {
  return APPROVAL_TYPE_OPTIONS.find((item) => item.value === value)?.label || "일반 결재"
}

function getCommonFields(templateId: string): FormFieldConfig[] {
  if (templateId === "approval-doc") {
    return [
      {
        key: "requestTitle",
        label: "문서 제목 또는 요청명",
        placeholder: "예: 4월 연차 사용 신청",
      },
      {
        key: "purpose",
        label: "결재 목적",
        placeholder: "예: 연차 사용, 식대 정산, 비용 집행",
      },
      {
        key: "audience",
        label: "결재 대상",
        placeholder: "예: 팀장, 실장, 부서장",
      },
      {
        key: "tone",
        label: "원하는 문체/톤",
        placeholder: "예: 정중하고 간결한 결재 문체",
      },
      {
        key: "keywords",
        label: "참고 키워드",
        placeholder: "예: 연차, 비용 집행, 정산",
      },
    ]
  }

  return COMMON_FIELDS
}

function getTemplateFieldConfigs(templateId: string, form: DraftForm): FormFieldConfig[] {
  if (templateId !== "approval-doc") {
    return TEMPLATE_FIELDS[templateId] || []
  }

  const base: FormFieldConfig[] = [
    {
      key: "approvalType",
      label: "결재 유형",
      placeholder: "결재 유형을 선택하세요",
      type: "select",
    },
  ]

  if (form.approvalType === "annual-leave") {
    return [
      ...base,
      {
        key: "requestPeriod",
        label: "사용 기간",
        placeholder: "예: 2026-04-03 ~ 2026-04-04",
      },
    ]
  }

  if (form.approvalType === "meal") {
    return [
      ...base,
      {
        key: "requestDate",
        label: "사용 일자",
        placeholder: "예: 2026-03-25",
      },
      {
        key: "requestItems",
        label: "정산 항목",
        placeholder: "예: 야간 근무 식대 3건",
      },
      {
        key: "requestAmount",
        label: "금액",
        placeholder: "예: 45,000원",
      },
    ]
  }

  if (form.approvalType === "expense") {
    return [
      ...base,
      {
        key: "requestDate",
        label: "집행 일자",
        placeholder: "예: 2026-03-25",
      },
      {
        key: "requestItems",
        label: "집행 항목",
        placeholder: "예: 외부 솔루션 사용료, 행사 운영 물품",
        multiline: true,
      },
      {
        key: "requestAmount",
        label: "집행 금액",
        placeholder: "예: 3,500,000원",
      },
    ]
  }

  return [
    ...base,
    {
      key: "requestDate",
      label: "요청 일자",
      placeholder: "예: 2026-03-25",
    },
    {
      key: "requestItems",
      label: "요청 항목",
      placeholder: "예: 결재 요청 대상 항목을 입력",
      multiline: true,
    },
  ]
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function buildSection(title: string, lines: string[]) {
  if (lines.length === 0) return ""
  return `
    <section>
      <h2>${escapeHtml(title)}</h2>
      <ul>
        ${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
      </ul>
    </section>
  `
}

function buildNarrativeParagraphs(value: string) {
  const lines = splitLines(value)
  if (lines.length === 0) return `<p>세부 내용을 입력하면 해당 영역에 반영됩니다.</p>`
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")
}

function buildApprovalRequestLines(form: DraftForm) {
  const typeLabel = getApprovalTypeLabel(form.approvalType)
  const lines = [`결재 유형: ${typeLabel}`, `결재 목적: ${form.purpose || typeLabel}`]

  if (form.approvalType === "annual-leave" && form.requestPeriod) {
    lines.push(`사용 기간: ${form.requestPeriod}`)
  }

  if (form.approvalType !== "annual-leave" && form.requestDate) {
    lines.push(`요청 일자: ${form.requestDate}`)
  }

  if (form.requestItems) {
    lines.push(`요청 항목: ${form.requestItems}`)
  }

  if (form.requestAmount) {
    lines.push(`금액: ${form.requestAmount}`)
  }

  return lines
}

function buildApprovalAutoReason(form: DraftForm) {
  if (form.approvalType === "annual-leave") {
    return [
      `${form.requestPeriod || "요청 기간"} 동안 ${form.purpose || "연차 사용"} 관련 결재를 요청드립니다.`,
      "업무 일정은 사전 조정하여 운영 공백이 발생하지 않도록 하겠습니다.",
    ]
  }

  if (form.approvalType === "meal") {
    return [
      `${form.requestDate || "해당 일자"} ${form.purpose || "식대 정산"} 건에 대한 결재를 요청드립니다.`,
      `${form.requestItems || "대상 식대 항목"} 기준으로 내부 정산 원칙에 맞춰 처리하고자 합니다.`,
    ]
  }

  if (form.approvalType === "expense") {
    return [
      `${form.requestDate || "해당 일자"} ${form.purpose || "비용 집행"} 관련 결재를 요청드립니다.`,
      `${form.requestItems || "집행 항목"}에 대해 ${form.requestAmount || "예상 금액"} 수준의 집행이 필요합니다.`,
    ]
  }

  return [
    `${form.purpose || "일반 결재"} 관련 승인 요청 드립니다.`,
    "세부 내용은 입력 항목을 기준으로 반영해 검토용 초안으로 정리했습니다.",
  ]
}

function getTemplateSections(templateId: string, form: DraftForm, profile: UserProfile): RenderSection[] {
  const profileLines = [
    `작성자: ${profile.name}`,
    `부서: ${profile.department}`,
    `소속: ${profile.team}`,
    `직급: ${profile.role}`,
  ]
  const audienceLines = splitLines(
    [form.audience, form.tone, form.keywords && `키워드: ${form.keywords}`].filter(Boolean).join("\n")
  )

  switch (templateId) {
    case "approval-doc":
      return [
        { title: "작성자 정보", lines: profileLines },
        { title: "결재 신청 정보", lines: buildApprovalRequestLines(form) },
        { title: "자동 작성 사유", lines: buildApprovalAutoReason(form) },
        { title: "검토 대상 및 작성 방향", lines: audienceLines },
      ]
    case "proposal-request":
      return [
        { title: "작성자 정보", lines: profileLines },
        { title: "문서 목적", lines: splitLines(form.purpose) },
        { title: "사업 배경", lines: splitLines(form.background) },
        { title: "구축 범위", lines: splitLines(form.projectScope) },
        { title: "필수 요구사항", lines: splitLines(form.requiredCapabilities) },
        { title: "평가 기준", lines: splitLines(form.evaluationCriteria) },
        { title: "추진 일정", lines: splitLines(form.projectSchedule) },
      ]
    case "press-release":
      return [
        { title: "작성자 정보", lines: profileLines },
        { title: "보도 목적", lines: splitLines(form.purpose) },
        { title: "도입 배경", lines: splitLines(form.background) },
        { title: "핵심 메시지", lines: splitLines(form.coreMessage) },
        { title: "인용문", lines: splitLines(form.quote) },
        { title: "문의처", lines: splitLines(form.contactInfo) },
        { title: "배포 대상 및 문체", lines: audienceLines },
      ]
    case "spec-sheet":
      return [
        { title: "작성자 정보", lines: profileLines },
        { title: "문서 목적", lines: splitLines(form.purpose) },
        { title: "대상 시스템/서비스", lines: splitLines(form.systemTarget) },
        { title: "기능 요구사항", lines: splitLines(form.functionalRequirements) },
        { title: "검수 기준", lines: splitLines(form.acceptanceCriteria) },
      ]
    case "briefing-deck":
      return [
        { title: "작성자 정보", lines: profileLines },
        { title: "보고 목적", lines: splitLines(form.purpose) },
        { title: "현황", lines: splitLines(form.currentStatus) },
        { title: "주요 이슈", lines: splitLines(form.issues) },
        { title: "추진 계획", lines: splitLines(form.actionPlan) },
        { title: "보고 대상 및 톤", lines: audienceLines },
      ]
    default:
      return [
        { title: "작성자 정보", lines: profileLines },
        { title: "문서 목적", lines: splitLines(form.purpose) },
        { title: "배경 및 현황", lines: splitLines(form.background) },
        { title: "대상 및 작성 방향", lines: audienceLines },
      ]
  }
}

function buildDocumentHtml(template: Template, form: DraftForm, sourceLabel: string, profile: UserProfile) {
  const now = new Date()
  const isPptx = template.output === "pptx"
  const sections = getTemplateSections(template.id, form, profile).filter((section) => section.lines.length > 0)
  const sectionHtml = sections.map((section) => buildSection(section.title, section.lines)).join("")
  const previewNarrative =
    form.background ||
    form.requestItems ||
    form.requestPeriod ||
    form.requestAmount ||
    form.expectedBenefits ||
    form.projectScope ||
    form.coreMessage ||
    form.functionalRequirements ||
    form.currentStatus ||
    form.purpose

  return `<!doctype html>
  <html lang="ko">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(template.title)} - ${escapeHtml(form.requestTitle)}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif; padding: 24px; color: #111827; }
        .muted { color: #6B7280; font-size: 12px; }
        .card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; background: #fff; }
        h1 { font-size: 22px; margin: 0 0 8px; }
        h2 { font-size: 18px; margin: 24px 0 8px; }
        ul { padding-left: 20px; }
        p { line-height: 1.8; margin: 0 0 10px; }
        .slides { display: grid; gap: 24px; }
        .slide { width: 960px; height: 540px; background: white; border: 1px solid #E5E7EB; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); padding: 24px; }
        .slide h2 { margin-top: 0; }
      </style>
    </head>
    <body>
      ${isPptx ? `
      <div class="slides">
        <div class="slide">
          <h2>${escapeHtml(form.requestTitle)}</h2>
          <div class="muted">${escapeHtml(template.title)} · ${now.toLocaleDateString()} · ${escapeHtml(sourceLabel)}</div>
        </div>
        ${sections.slice(0, 4).map((section) => `
        <div class="slide">
          <h2>${escapeHtml(section.title)}</h2>
          <ul>${section.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
        </div>
        `).join("")}
        <div class="slide">
          <h2>마무리 제안</h2>
          <ul>
            <li>결재 또는 대외 공유 전 검토 포인트를 마지막 슬라이드에 배치합니다.</li>
            <li>필요 시 이 초안을 PPT 발표자료 톤으로 더 간결하게 재구성할 수 있습니다.</li>
          </ul>
        </div>
      </div>
      ` : `
      <div class="card">
        <h1>${escapeHtml(form.requestTitle)}</h1>
        <div class="muted">문서 유형: ${escapeHtml(template.title)} · 생성 시각: ${now.toLocaleString()} · 참고자료: ${escapeHtml(sourceLabel)}</div>
        ${sectionHtml}
        <section>
          <h2>초안 문안</h2>
          ${buildNarrativeParagraphs(previewNarrative)}
        </section>
      </div>
      `}
    </body>
  </html>`
}

function buildEditorDraft(template: Template, form: DraftForm, sourceLabel: string, profile: UserProfile) {
  const sections = getTemplateSections(template.id, form, profile).filter((section) => section.lines.length > 0)
  const draftLines = [
    form.requestTitle || template.title,
    "",
    `문서 유형: ${template.title}`,
    `참고자료: ${sourceLabel}`,
    "",
  ]

  sections.forEach((section) => {
    draftLines.push(`[${section.title}]`)
    section.lines.forEach((line) => {
      draftLines.push(`- ${line}`)
    })
    draftLines.push("")
  })

  const narrative =
    form.background ||
    form.requestItems ||
    form.requestPeriod ||
    form.requestAmount ||
    form.expectedBenefits ||
    form.projectScope ||
    form.coreMessage ||
    form.functionalRequirements ||
    form.currentStatus ||
    form.purpose

  draftLines.push("[초안 문안]")
  if (narrative.trim()) {
    draftLines.push(...splitLines(narrative))
  } else {
    draftLines.push("세부 내용을 입력하면 이 영역에서 바로 수정 가능한 초안이 생성됩니다.")
  }

  return draftLines.join("\n")
}

function buildAssistantSeedMessages(template: Template | null, form: DraftForm): AssistantMessage[] {
  if (!template) return []

  const requestLabel = form.requestTitle || template.title
  const assistantReply =
    template.id === "approval-doc"
      ? "결재 목적과 결재 유형을 기준으로 사유 문구를 간결하게 정리했습니다. 우측 에디터에서 바로 수정하면서 사용하시면 됩니다."
      : template.id === "proposal-request"
        ? "사업 배경, 구축 범위, 요구사항 구조로 초안을 정리하기 좋습니다. 우측 에디터에서 문장을 다듬고 세부 항목을 보완해보세요."
        : template.id === "press-release"
          ? "대외 홍보 문체로 자연스럽게 읽히도록 핵심 메시지와 인용문 중심으로 정리하면 좋습니다."
          : "문서 목적과 대상에 맞춰 우측 에디터의 구조를 정리해 두었습니다. 필요한 문장을 바로 수정해보세요."

  return [
    {
      id: `assistant-seed-user-${template.id}`,
      role: "user",
      content: `${requestLabel} 초안을 더 읽기 쉽게 정리해줘.`,
    },
    {
      id: `assistant-seed-assistant-${template.id}`,
      role: "assistant",
      content: assistantReply,
    },
  ]
}

function buildAssistantReply(template: Template | null, form: DraftForm, prompt: string) {
  if (!template) {
    return "먼저 문서 유형을 선택하면 그에 맞는 작성 방향을 제안드릴 수 있습니다."
  }

  if (prompt.includes("제목")) {
    return `제목은 "${form.requestTitle || template.title}" 기준으로 유지하되, 조금 더 짧게 하려면 핵심 키워드만 남기는 방식이 좋습니다.`
  }

  if (prompt.includes("정중") || prompt.includes("문체") || prompt.includes("톤")) {
    return "문체는 현재보다 짧은 문장과 명확한 동사를 쓰면 더 정중하고 읽기 쉬워집니다. 우측 에디터에서 문장 길이를 한 단계만 줄여보세요."
  }

  if (prompt.includes("요약") || prompt.includes("정리")) {
    return "핵심만 남기려면 배경, 요청 사항, 기대 효과 순으로 3단 구성으로 줄이는 것이 가장 안정적입니다."
  }

  return "좋습니다. 현재 초안 기준으로는 목적과 대상은 충분히 드러나고 있어서, 우측 에디터에서 문장을 짧게 다듬고 강조할 키워드만 남기면 훨씬 깔끔해집니다."
}

function buildHtmlFromEditorDraft(title: string, editorDraft: string) {
  const htmlBody = editorDraft
    .split("\n")
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return "<br />"
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        return `<h2>${escapeHtml(trimmed.slice(1, -1))}</h2>`
      }
      if (trimmed.startsWith("- ")) {
        return `<p>&bull; ${escapeHtml(trimmed.slice(2))}</p>`
      }
      return `<p>${escapeHtml(trimmed)}</p>`
    })
    .join("")

  return `<!doctype html>
  <html lang="ko">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif; padding: 24px; color: #111827; line-height: 1.8; }
        h2 { margin-top: 24px; font-size: 18px; }
        p { margin: 0 0 10px; }
      </style>
    </head>
    <body>${htmlBody}</body>
  </html>`
}

function getAssistantQuickPrompts(templateId: string) {
  switch (templateId) {
    case "approval-doc":
      return [
        "결재 문체로 더 간결하게 다듬어줘.",
        "승인 요청 문구를 더 정중하게 바꿔줘.",
        "검토 포인트를 3가지로 정리해줘.",
      ]
    case "proposal-request":
      return [
        "필수 요구사항을 더 명확하게 정리해줘.",
        "평가 기준 문구를 제안요청서 톤으로 바꿔줘.",
        "범위와 일정 파트를 더 구조적으로 다듬어줘.",
      ]
    case "press-release":
      return [
        "보도자료 제목을 더 임팩트 있게 바꿔줘.",
        "대외 홍보 문체로 더 자연스럽게 수정해줘.",
        "핵심 메시지를 짧은 문장으로 정리해줘.",
      ]
    default:
      return [
        "문장을 더 짧고 읽기 쉽게 다듬어줘.",
        "핵심 항목만 남기고 요약해줘.",
        "업무 문체로 자연스럽게 정리해줘.",
      ]
  }
}

export function DocumentationTool() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [files, setFiles] = useState<File[]>([])
  const [draftForm, setDraftForm] = useState<DraftForm>(INITIAL_FORM)
  const [isGenerating, setIsGenerating] = useState(false)
  const [html, setHtml] = useState<string>("")
  const [editorDraft, setEditorDraft] = useState("")
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([])
  const [assistantInput, setAssistantInput] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [showHistory, setShowHistory] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(true)
  const [workspaceMode, setWorkspaceMode] = useState<"preview" | "editor">("preview")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TEMPLATES_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as any
        const arr: Template[] = Array.isArray(parsed) ? parsed.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          output: (t.output === 'pptx' || t.output === 'docx') ? t.output : 'docx',
        })) : []
        if (arr.length > 0) {
          setTemplates(arr)
          setSelectedTemplateId(arr[0].id)
        } else {
          setTemplates(DEFAULT_TEMPLATES)
          setSelectedTemplateId(DEFAULT_TEMPLATES[0].id)
        }
      } else {
        setTemplates(DEFAULT_TEMPLATES)
        setSelectedTemplateId(DEFAULT_TEMPLATES[0].id)
      }
    } catch {
      setTemplates(DEFAULT_TEMPLATES)
      setSelectedTemplateId(DEFAULT_TEMPLATES[0].id)
    }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates)) } catch {}
  }, [templates])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as HistoryItem[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed)
          return
        }
      }

      const seededHistory = DEMO_SCENARIOS.map((scenario, index) => {
        const template = DEFAULT_TEMPLATES.find((item) => item.id === scenario.templateId) || DEFAULT_TEMPLATES[0]
        const sourceLabel = "참고자료 없음"
        return {
          id: `demo-${scenario.id}`,
          timestamp: Date.now() - index * 60 * 60 * 1000,
          templateId: template.id,
          templateTitle: template.title,
          templateOutput: template.output,
          requestTitle: scenario.form.requestTitle,
          sourceLabel,
          form: scenario.form,
          html: buildDocumentHtml(template, scenario.form, sourceLabel, {
            name: "제논",
            department: "디지털혁신실",
            team: "AI전략TF",
            role: "과장",
          }),
          editorDraft: buildEditorDraft(template, scenario.form, sourceLabel, {
            name: "제논",
            department: "디지털혁신실",
            team: "AI전략TF",
            role: "과장",
          }),
          assistantMessages: buildAssistantSeedMessages(template, scenario.form),
        }
      })

      setHistory(seededHistory)
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)) } catch {}
  }, [history])

  const selectedTemplate = useMemo(() => templates.find(t => t.id === selectedTemplateId) || null, [templates, selectedTemplateId])
  const userProfile = useMemo<UserProfile>(
    () => ({
      name: user?.name || "제논",
      department: "디지털혁신실",
      team: "AI전략TF",
      role: "과장",
    }),
    [user?.name],
  )
  const commonFieldConfigs = useMemo(
    () => getCommonFields(selectedTemplateId),
    [selectedTemplateId],
  )
  const selectedFieldConfigs = useMemo(
    () => getTemplateFieldConfigs(selectedTemplateId, draftForm),
    [selectedTemplateId, draftForm],
  )

  const primaryFile = files[0] || null
  const hasDraftInput = Object.values(draftForm).some((value) => value.trim().length > 0)
  const assistantQuickPrompts = useMemo(() => getAssistantQuickPrompts(selectedTemplateId), [selectedTemplateId])
  const isEditorMode = workspaceMode === "editor"
  const showLeftRail = !isEditorMode && showHistory
  const previewHtml = useMemo(() => {
    if (editorDraft.trim()) {
      return buildHtmlFromEditorDraft(draftForm.requestTitle || selectedTemplate?.title || "document", editorDraft)
    }
    return html
  }, [draftForm.requestTitle, editorDraft, html, selectedTemplate?.title])

  const updateDraftField = (field: keyof DraftForm, value: string) => {
    setDraftForm((prev) => ({ ...prev, [field]: value }))
  }

  const applyDemoScenario = (scenario: DemoScenario) => {
    const template = templates.find((item) => item.id === scenario.templateId) || DEFAULT_TEMPLATES.find((item) => item.id === scenario.templateId) || DEFAULT_TEMPLATES[0]
    const sourceLabel = "참고자료 없음"
    setSelectedTemplateId(scenario.templateId)
    setDraftForm({ ...scenario.form })
    setHtml(buildDocumentHtml(template, scenario.form, sourceLabel, userProfile))
    setEditorDraft(buildEditorDraft(template, scenario.form, sourceLabel, userProfile))
    setAssistantMessages(buildAssistantSeedMessages(template, scenario.form))
    setAssistantInput("")
    setShowRequestForm(false)
    setWorkspaceMode("preview")
    setFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ""
    toast({ description: `${scenario.title} 내용을 불러왔습니다.` })
  }

  const openHistoryItem = (item: HistoryItem) => {
    setSelectedTemplateId(item.templateId)
    setDraftForm({ ...item.form })
    setHtml(item.html)
    setEditorDraft(item.editorDraft || "")
    setAssistantMessages(item.assistantMessages || [])
    setAssistantInput("")
    setShowRequestForm(false)
    setWorkspaceMode("preview")
    setFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const generateDoc = async () => {
    if (!selectedTemplate) { toast({ description: "템플릿을 선택하세요." }); return }
    if (!draftForm.requestTitle.trim()) { toast({ description: "문서 제목 또는 요청명을 입력하세요." }); return }
    if (!draftForm.purpose.trim()) { toast({ description: "문서 목적을 입력하세요." }); return }
    setIsGenerating(true)
    try {
      const sourceLabel = primaryFile ? `${primaryFile.name} 외 ${files.length - 1}건`.replace(" 외 0건", "") : "참고자료 없음"
      const htmlDoc = buildDocumentHtml(selectedTemplate, draftForm, sourceLabel, userProfile)
      const nextEditorDraft = buildEditorDraft(selectedTemplate, draftForm, sourceLabel, userProfile)
      const nextAssistantMessages = buildAssistantSeedMessages(selectedTemplate, draftForm)
      setHtml(htmlDoc)
      setEditorDraft(nextEditorDraft)
      setAssistantMessages(nextAssistantMessages)
      setAssistantInput("")
      setShowRequestForm(false)
      setWorkspaceMode("preview")
      const item: HistoryItem = {
        id: `${Date.now()}`,
        timestamp: Date.now(),
        templateId: selectedTemplate.id,
        templateTitle: selectedTemplate.title,
        templateOutput: selectedTemplate.output,
        requestTitle: draftForm.requestTitle,
        sourceLabel,
        form: { ...draftForm },
        html: htmlDoc,
        editorDraft: nextEditorDraft,
        assistantMessages: nextAssistantMessages,
      }
      setHistory(prev => [item, ...prev])
      toast({ description: "초안 생성이 완료되었습니다." })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadDoc = (name: string, content: string) => {
    const blob = new Blob([content], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = name.endsWith(".html") ? name : `${name}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setFiles([])
    setDraftForm(INITIAL_FORM)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setHtml("")
    setEditorDraft("")
    setAssistantMessages([])
    setAssistantInput("")
    setShowRequestForm(true)
    setWorkspaceMode("preview")
    setIsGenerating(false)
    toast({ description: "초기화했습니다." })
  }

  const sendAssistantPrompt = () => {
    if (!assistantInput.trim()) return
    const userPrompt = assistantInput.trim()
    const reply = buildAssistantReply(selectedTemplate, draftForm, userPrompt)

    setAssistantMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: userPrompt },
      { id: `assistant-${Date.now() + 1}`, role: "assistant", content: reply },
    ])
    setAssistantInput("")
  }

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="mx-auto max-w-[1680px] p-6 space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
            <h1 className="text-xl font-bold">문서 작성 지원</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/doc-templates">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" /> 템플릿 관리
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setShowHistory((v) => !v)} title={showHistory ? "히스토리 숨기기" : "히스토리 보이기"}>
              {showHistory ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Template selection and management */}
          {showLeftRail && (
          <div className="lg:col-span-3 space-y-6">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>문서 유형 선택</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.length === 0 && (
                  <div className="text-sm text-muted-foreground">템플릿이 없습니다. 아래에서 추가하세요.</div>
                )}
                {templates.map(t => {
                  const active = t.id === selectedTemplateId
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={`w-full text-left p-3 rounded-md border transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {active ? <Check className="mt-1 h-4 w-4 shrink-0 text-[#005BAC]" /> : <span className="mt-1 inline-block h-4 w-4 shrink-0 rounded border" />}
                        <div className="min-w-0 flex-1">
                          <div className="break-keep text-sm font-semibold leading-6">{t.title}</div>
                          <div className="mt-1 line-clamp-2 break-keep text-xs leading-5 text-muted-foreground">{t.description}</div>
                          <div className="mt-2 inline-flex rounded-full border border-border bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                            {(t.output || 'html').toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <CardTitle>문서화 히스토리</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">내역이 없습니다.</div>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                    {history.map((h) => (
                      <div key={h.id} className="rounded-lg border border-border p-3 hover:bg-muted">
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(h.timestamp).toLocaleString()}
                        </div>
                        <div className="mt-1 inline-flex rounded-full border border-border bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                          {h.templateTitle} · {h.templateOutput === "pptx" ? "PPTX" : "DOCX"}
                        </div>
                        <div className="mt-2 truncate text-sm font-medium" title={h.requestTitle || h.sourceLabel}>
                          {h.requestTitle || h.sourceLabel}
                        </div>
                        <div className="mt-1 truncate text-xs text-muted-foreground" title={h.sourceLabel}>
                          {h.sourceLabel}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openHistoryItem(h)}>열기</Button>
                          <Button size="sm" onClick={() => downloadDoc(`${h.requestTitle || h.templateTitle}.html`, h.html)}>다운로드</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}

          {/* Middle: Upload, actions, viewer */}
          <div
            className={
              isEditorMode
                ? "lg:col-span-12"
                : showLeftRail
                  ? showHistory
                    ? "lg:col-span-9"
                    : "lg:col-span-9"
                  : showHistory
                    ? "lg:col-span-9"
                    : "lg:col-span-12"
            }
          >
            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>문서 작성 요청</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRequestForm((prev) => !prev)}
                    className="gap-2"
                  >
                    {showRequestForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {showRequestForm ? "입력 정보 접기" : "입력 정보 펼치기"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label>빠른 예시</Label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {DEMO_SCENARIOS.map((scenario) => (
                      <button
                        key={scenario.id}
                        type="button"
                        onClick={() => applyDemoScenario(scenario)}
                        className="rounded-xl border border-border bg-card px-4 py-4 text-left transition-colors hover:bg-muted"
                      >
                        <div className="text-sm font-medium text-foreground">{scenario.title}</div>
                        <div className="mt-1 text-xs leading-5 text-muted-foreground">{scenario.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {showRequestForm ? (
                  <div className="space-y-6 rounded-2xl border border-border bg-muted/20 p-5">
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <div className="mb-3 text-sm font-medium text-foreground">사용자 정보 연동</div>
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-lg border border-border bg-background px-3 py-3">
                          <div className="text-[11px] text-muted-foreground">작성자</div>
                          <div className="mt-1 text-sm font-medium">{userProfile.name}</div>
                        </div>
                        <div className="rounded-lg border border-border bg-background px-3 py-3">
                          <div className="text-[11px] text-muted-foreground">부서</div>
                          <div className="mt-1 text-sm font-medium">{userProfile.department}</div>
                        </div>
                        <div className="rounded-lg border border-border bg-background px-3 py-3">
                          <div className="text-[11px] text-muted-foreground">소속</div>
                          <div className="mt-1 text-sm font-medium">{userProfile.team}</div>
                        </div>
                        <div className="rounded-lg border border-border bg-background px-3 py-3">
                          <div className="text-[11px] text-muted-foreground">직급</div>
                          <div className="mt-1 text-sm font-medium">{userProfile.role}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {commonFieldConfigs.map((field) => {
                        const value = draftForm[field.key] as string
                        const inputId = `draft-${String(field.key)}`
                        const className = field.multiline ? "min-h-[120px]" : undefined

                        return (
                          <div
                            key={field.key}
                            className={`space-y-2 ${field.multiline || field.key === "requestTitle" || field.key === "keywords" ? "md:col-span-2 xl:col-span-3" : ""}`}
                          >
                            <Label htmlFor={inputId}>{field.label}</Label>
                            {field.type === "select" ? (
                              <Select value={value} onValueChange={(nextValue) => updateDraftField(field.key, nextValue)}>
                                <SelectTrigger id={inputId}>
                                  <SelectValue placeholder={field.placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                  {APPROVAL_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : field.multiline ? (
                              <Textarea
                                id={inputId}
                                value={value}
                                onChange={(event) => updateDraftField(field.key, event.target.value)}
                                placeholder={field.placeholder}
                                className={className}
                              />
                            ) : (
                              <Input
                                id={inputId}
                                value={value}
                                onChange={(event) => updateDraftField(field.key, event.target.value)}
                                placeholder={field.placeholder}
                              />
                            )}
                          </div>
                        )
                      })}

                      {selectedFieldConfigs.map((field) => {
                        const value = draftForm[field.key] as string
                        const inputId = `draft-${String(field.key)}`

                        return (
                          <div key={field.key} className="space-y-2 md:col-span-2 xl:col-span-3">
                            <Label htmlFor={inputId}>{field.label}</Label>
                            {field.type === "select" ? (
                              <Select value={value} onValueChange={(nextValue) => updateDraftField(field.key, nextValue)}>
                                <SelectTrigger id={inputId}>
                                  <SelectValue placeholder={field.placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                  {APPROVAL_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : field.multiline ? (
                              <Textarea
                                id={inputId}
                                value={value}
                                onChange={(event) => updateDraftField(field.key, event.target.value)}
                                placeholder={field.placeholder}
                                className="min-h-[130px]"
                              />
                            ) : (
                              <Input
                                id={inputId}
                                value={value}
                                onChange={(event) => updateDraftField(field.key, event.target.value)}
                                placeholder={field.placeholder}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <FileUploadBox
                      label="참고자료 업로드 (선택)"
                      accept=".docx,.pdf,.txt"
                      files={files}
                      onFilesChange={setFiles}
                      placeholder="관련 문서가 있으면 선택적으로 업로드"
                      multiple
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    문서 작성 정보는 현재 세션에 저장된 상태입니다. 필요하면 상단의 `입력 정보 펼치기`를 눌러 다시 수정할 수 있습니다.
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button onClick={generateDoc} disabled={!selectedTemplate || isGenerating}>
                    {isGenerating ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> 초안 생성 중...</>) : "초안 생성"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      previewHtml &&
                      downloadDoc(`${draftForm.requestTitle || selectedTemplate?.title || "document"}.html`, previewHtml)
                    }
                    disabled={!previewHtml}
                  >
                    <Download className="h-4 w-4 mr-2" /> {selectedTemplate?.output === "pptx" ? "PPTX 다운로드" : "DOCX 다운로드"}
                  </Button>
                  <Button variant="outline" onClick={reset} disabled={!(files.length || html || hasDraftInput)}>
                    <RotateCcw className="h-4 w-4 mr-2" /> 새 요청
                  </Button>
                </div>

                <Separator />

                {workspaceMode === "preview" ? (
                  <Card className="border-border bg-background/50">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Eye className="h-4 w-4" />
                            생성 결과 미리보기
                          </CardTitle>
                          <div className="mt-1 text-sm text-muted-foreground">
                            문서 초안이 생성되면 이 영역에서 먼저 내용을 확인하고, 필요할 때 상세 수정 화면으로 이동할 수 있습니다.
                          </div>
                        </div>
                        {previewHtml ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <Button type="button" onClick={() => setWorkspaceMode("editor")}>
                              상세 수정 열기
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowRequestForm((prev) => !prev)}>
                              {showRequestForm ? "입력 정보 접기" : "입력 정보 보기"}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-xl border border-border bg-card">
                        <div className="h-[680px] overflow-hidden rounded-xl bg-background">
                          {previewHtml ? (
                            <iframe className="h-full w-full" srcDoc={previewHtml} title="문서 미리보기" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                              초안을 생성하면 이 영역에 문서 미리보기가 표시됩니다.
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-border bg-background/50">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <CardTitle className="text-base">문서 상세 수정</CardTitle>
                          <div className="mt-1 text-sm text-muted-foreground">
                            좌측에서 AI와 문장을 다듬고, 우측에서 문서를 직접 편집할 수 있습니다.
                          </div>
                        </div>
                        <Button type="button" variant="outline" onClick={() => setWorkspaceMode("preview")}>
                          미리보기로 돌아가기
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
                        <Card className="border-border bg-background/60">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <MessageSquare className="h-4 w-4" />
                              AI 작성 지원
                            </CardTitle>
                            <div className="text-sm text-muted-foreground">
                              문서 초안을 보면서 AI에게 문체 수정, 요약, 표현 보완을 요청할 수 있습니다.
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {assistantQuickPrompts.map((prompt) => (
                                <button
                                  key={prompt}
                                  type="button"
                                  onClick={() => setAssistantInput(prompt)}
                                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                                >
                                  {prompt}
                                </button>
                              ))}
                            </div>

                            <div className="rounded-xl border border-border bg-card p-4">
                              <div className="max-h-[640px] space-y-3 overflow-auto pr-1">
                                {assistantMessages.length > 0 ? (
                                  assistantMessages.map((message) => (
                                    <div
                                      key={message.id}
                                      className={`rounded-2xl px-4 py-3 text-[15px] leading-7 ${
                                        message.role === "user"
                                          ? "ml-3 bg-primary text-primary-foreground"
                                          : "mr-3 border border-border bg-background text-foreground"
                                      }`}
                                    >
                                      <div className="mb-1 text-[11px] font-medium opacity-70">
                                        {message.role === "user" ? "사용자 요청" : "AI 제안"}
                                      </div>
                                      <div className="whitespace-pre-wrap">{message.content}</div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                                    초안을 생성하면 AI 작성 지원 대화가 표시됩니다.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="doc-assistant-input">AI에게 추가 요청</Label>
                              <div className="flex items-end gap-2">
                                <Textarea
                                  id="doc-assistant-input"
                                  value={assistantInput}
                                  onChange={(event) => setAssistantInput(event.target.value)}
                                  placeholder="예: 이 문서를 더 정중한 결재 문체로 다듬어줘."
                                  className="min-h-[120px]"
                                />
                                <Button
                                  type="button"
                                  onClick={sendAssistantPrompt}
                                  disabled={!assistantInput.trim()}
                                  className="shrink-0"
                                >
                                  <SendHorizontal className="h-4 w-4 mr-2" />
                                  요청
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-border bg-background/60">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-3">
                              <CardTitle className="flex items-center gap-2 text-base">
                                <Eye className="h-4 w-4" />
                                문서 에디터
                              </CardTitle>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setWorkspaceMode("preview")}
                              >
                                미리보기
                              </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              생성된 초안을 넓은 작업 영역에서 바로 수정할 수 있습니다.
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Textarea
                              value={editorDraft}
                              onChange={(event) => setEditorDraft(event.target.value)}
                              placeholder="초안을 생성하면 이곳에서 바로 문서를 수정할 수 있습니다."
                              className="min-h-[880px] resize-y font-medium leading-7"
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}

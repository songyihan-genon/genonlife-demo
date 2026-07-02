"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Braces, Code2, FileText, Home, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import PDFViewer from "@/components/pdf-viewer"
import { useChat } from "@/hooks/use-chat"
import { ChatList } from "@/components/chat/chat-list"
import { ChatInput } from "@/components/chat/chat-input"
import { Message } from "@/lib/event-system"
import { assistantPromptSuggestions, getAssistantPresetMessages } from "@/lib/assistant-demo-history"
import { compliancePromptSuggestions, getCompliancePresetMessages } from "@/lib/compliance-demo-history"
import { developmentPromptSuggestions, getDevelopmentPresetMessages } from "@/lib/development-demo-history"
import { generalQaHistoryPresets, generalQaPromptSuggestions, getGeneralQaPresetMessages } from "@/lib/general-qa-demo-history"
import { staffSearchPromptSuggestions, getStaffSearchPresetMessages } from "@/lib/staff-search-demo-history"
import {
  getDocumentWritingPromptSuggestions,
  getDocumentWritingTool,
  getDocumentWritingPresetMessages,
  type DocumentWritingTool,
} from "@/lib/document-writing-demo-history"
import { DocumentWriterTool } from "@/components/DocumentWriterTool"
import { CounselingAssistantView } from "@/components/CounselingAssistantView"
import { debtTransferPromptSuggestions, debtTransferSeedMessages, generateDebtTransferResponse } from "@/lib/debt-transfer-demo-history"

function extractLatestCodePreview(messages: Message[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const current = messages[index]
    if (current.role !== "assistant") continue

    const matches = [...current.content.matchAll(/```([\w-]+)?\n([\s\S]*?)```/g)]
    if (matches.length === 0) continue

    const lastMatch = matches[matches.length - 1]
    const language = lastMatch[1] || "text"
    const code = lastMatch[2].trim()
    const summary = current.content
      .replace(/```[\w-]*\n[\s\S]*?```/g, "")
      .trim()
      .split("\n")
      .filter(Boolean)
      .slice(0, 3)
      .join(" ")

    return { language, code, summary }
  }

  return null
}

function createSeedMessages(agent: string | null, feature: string | null, documentTool?: string): Message[] {
  const sessionId = `seed-${agent || "assistant"}`
  const baseTime = new Date("2026-03-23T09:00:00+09:00")

  if (agent === "debt-transfer") {
    return debtTransferSeedMessages
  }

  if (agent === "compliance" && feature === "policy-search") {
    return [
      {
        id: "policy-search-user-1",
        role: "user",
        content: "복무규정에서 연차 사용 기준을 규정명과 조항까지 포함해 설명해줘.",
        timestamp: baseTime,
        sessionId,
      },
      {
        id: "policy-search-assistant-1",
        role: "assistant",
        content: [
          "연차는 발생 일수와 잔여 일수를 확인한 뒤, 사전 승인 절차에 따라 사용할 수 있습니다.",
          "",
          "답변은 아래 기준으로 확인하시면 됩니다.",
          "",
          "- 당해 연도 발생 연차와 잔여 일수를 먼저 확인합니다.",
          "- 부서장 승인 여부와 업무 인수인계 필요성을 함께 검토합니다.",
          "- 반차·반반차 사용 가능 여부는 운영 지침을 추가 확인합니다.",
          "",
          "---",
          "",
          "#### 관련 레퍼런스",
          "",
          "- 규정명: 복무규정",
          "- 근거 조항: 제14조(연차휴가) 제1항, 제3항",
          "- 시행일: 2025-01-01",
          "",
          "#### 참고 원문",
          "",
          "> 직원은 연차휴가 발생 범위 내에서 소속 부서장의 승인을 받아 휴가를 사용할 수 있다.",
          "",
          "※ 본 답변은 AI가 생성한 참고 문안이며, 반드시 담당자의 검토, 승인을 거쳐야 합니다.",
        ].join("\n"),
        timestamp: new Date(baseTime.getTime() + 60_000),
        sessionId,
        isMarkdown: true,
      },
    ]
  }

  if (agent === "assistant" && feature === "staff-search") {
    return [
      {
        id: "staff-search-user-1",
        role: "user",
        content: "개인회생 신청 후 보완 서류 문의가 들어왔어. 우선 연결할 담당자를 찾아줘.",
        timestamp: baseTime,
        sessionId,
      },
      {
        id: "staff-search-assistant-1",
        role: "assistant",
        content: [
          "개인회생 보완 서류 문의는 아래 순서로 배정하는 것이 적절합니다.",
          "",
          "### 1차 추천 담당자",
          "- 성명: 김하늘",
          "- 부서: 채무조정지원부",
          "- 역할: 개인회생 접수 및 보완 서류 검토",
          "- 연락처: 내선 2184 / 02-0000-2184",
          "",
          "### 2차 협업 담당자",
          "- 성명: 박정우",
          "- 부서: 민원지원센터",
          "- 역할: 접수 상태 확인 및 민원 응대",
          "- 연락처: 내선 1107",
          "",
          "### 배정 기준",
          "- 보완 서류의 적정성 검토가 필요한 경우 채무조정지원부를 우선 배정합니다.",
          "- 진행 상태 확인만 필요한 경우 민원지원센터에서 1차 응대 후 이관할 수 있습니다.",
        ].join("\n"),
        timestamp: new Date(baseTime.getTime() + 60_000),
        sessionId,
        isMarkdown: true,
      },
    ]
  }

  if (agent === "development") {
    return [
      {
        id: "development-user-1",
        role: "user",
        content: "상담 안내 메시지 생성 API를 만든다고 가정하면 요청/응답 구조를 예시로 작성해줘.",
        timestamp: baseTime,
        sessionId,
      },
      {
        id: "development-assistant-1",
        role: "assistant",
        content: [
          "아래처럼 단순한 JSON 구조로 시작하면 데모와 실제 확장 모두 대응하기 좋습니다.",
          "",
          "POST /api/customer-support/reservation-message",
          "",
          "요청 예시",
          "```json",
          "{",
          '  "reservationId": "RSV-20260323-001",',
          '  "customerName": "홍길동",',
          '  "checkInDate": "2026-03-28",',
          '  "checkOutDate": "2026-03-29",',
          '  "scenario": "민원 접수 후 초기 안내"',
          "}",
          "```",
          "",
          "응답 예시",
          "```json",
          "{",
          '  "messageTitle": "민원 안내",',
          '  "messageBody": "안녕하세요. 제논라이프입니다. 상담 일정과 준비 서류를 안내드립니다.",',
          '  "channels": ["sms", "kakao"],',
          '  "generatedAt": "2026-03-23T09:01:00+09:00"',
          "}",
          "```",
        ].join("\n"),
        timestamp: new Date(baseTime.getTime() + 60_000),
        sessionId,
        isMarkdown: true,
      },
    ]
  }

  if (agent === "document-writer") {
    if (documentTool === "translation") {
      return [
        {
          id: "document-writer-translation-user-1",
          role: "user",
          content: "[구어체 변환 요청]\n\n아래 제논라이프 안내 문구를 영어로 번역하고 구어체로 바꿔줘. '안녕하세요, 제논라이프입니다. 상담을 시작하기 전에 본인 확인이 필요합니다.'",
          timestamp: baseTime,
          sessionId,
        },
        {
          id: "document-writer-translation-assistant-1",
          role: "assistant",
          content: [
            "**[번역 결과 — 구어체 변환 적용 / 위원회 도메인 영어사전 반영]**",
            "",
            "| 원문 (좌) | 번역문 (우) |",
            "|-----------|------------|",
            "| 안녕하세요, 제논라이프입니다. | Hello, this is Shinhan Life. |",
            "| 상담을 시작하기 전에 본인 확인이 필요합니다. | I'll need to verify your identity before we begin our consultation. |",
            "",
            "**전체 번역문:**",
            "Hello, this is Shinhan Life. I'll need to verify your identity before we begin our consultation.",
            "",
            "> 💡 구어체 변환 및 사내 용어 기준 표현이 적용되었습니다.",
          ].join("\n"),
          timestamp: new Date(baseTime.getTime() + 60_000),
          sessionId,
          isMarkdown: true,
        },
      ]
    }

    if (documentTool === "faq") {
      return [
        {
          id: "document-writer-faq-user-1",
          role: "user",
          content: "[FAQ 5개 생성] [첨부: 제논라이프_운영지침.pdf]\n\n첨부한 규정 문서를 바탕으로 내부 직원(제논라이프) 관점의 FAQ 5개를 생성해줘. 문서에 없는 내용은 생성하지 마.",
          timestamp: baseTime,
          sessionId,
        },
        {
          id: "document-writer-faq-assistant-1",
          role: "assistant",
          content: [
            "**[FAQ 자동생성 결과 — 내부 직원(제논라이프) 관점]**",
            "",
            "> ⚠️ 본 자료는 AI 생성 참고 자료입니다. 해당 내용을 검토 후 사용해야 합니다.",
            "",
            "---",
            "**Q1. 외부망 접속 시 필요한 인증 절차는 무엇입니까?**",
            "A. 사전에 승인된 VPN 클라이언트를 통한 접속 및 2FA 인증이 필수입니다.",
            "",
            "**Q2. 업무용 PC 비밀번호 변경 주기는 어떻게 됩니까?**",
            "A. 최소 90일 주기로 변경해야 하며, 기한 7일 전 시스템 안내 팝업이 노출됩니다.",
            "",
            "**Q3. 외부 저장 매체 사용이 가능합니까?**",
            "A. 인가되지 않은 이동식 매체 사용은 전면 금지이며, 부득이한 경우 정보보안팀 사전 승인이 필요합니다.",
            "",
            "**Q4. 재택근무 시 사내 시스템 접속 방법은 무엇입니까?**",
            "A. 승인된 원격 근무 환경(VPN 필수)에서만 접속 가능하며, 개인 기기 사용은 별도 신청 절차가 필요합니다.",
            "",
            "**Q5. 이상 징후 발견 시 어떻게 신고해야 합니까?**",
            "A. 정보보안 침해 신고 채널(내선 보안팀)을 통해 즉시 신고하고, 관련 증빙 자료를 보존해야 합니다.",
            "",
            "---",
            "*근거 문서: 제논라이프_운영지침.pdf*",
          ].join("\n"),
          timestamp: new Date(baseTime.getTime() + 60_000),
          sessionId,
          isMarkdown: true,
        },
      ]
    }

    return [
      {
        id: "document-writer-polish-user-1",
        role: "user",
        content: "[문서 유형: 공문] [톤: 정중한]\n\n다음 초안을 정중한 공문 형식으로 다듬어 주세요.\n\n'신규 규정 시스템 4월 1일 오픈. 많은 사용 부탁드립니다.'",
        timestamp: baseTime,
        sessionId,
      },
      {
        id: "document-writer-polish-assistant-1",
        role: "assistant",
        content: [
          "**[글다듬이 결과 — 문서 유형: 공문 / 톤: 정중한]**",
          "",
          "> ⚠️ 본 결과는 AI 생성 참고 초안입니다. 핵심 사실관계를 임의 변경·삭제하지 않았으며, 입력 외 사실을 생성하지 않았습니다.",
          "",
          "---",
          "당 위원회는 신규 규정 시스템 구축을 완료하여 오는 4월부로 정식 운용을 개시할 예정입니다.",
          "원활한 업무 수행을 위하여 임직원 여러분의 적극적인 활용을 권장해 드립니다.",
          "---",
          "",
          "| 구분 | 내용 |",
          "|------|------|",
          "| 원문 | 신규 규정 시스템 4월 1일 오픈. 많은 사용 부탁드립니다. |",
          "| 정제본 | 신규 규정 시스템 4월 정식 개시 예정, 적극적인 활용 권장 |",
        ].join("\n"),
        timestamp: new Date(baseTime.getTime() + 60_000),
        sessionId,
        isMarkdown: true,
      },
    ]
  }

  return []
}

function InsightChatPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMessage = searchParams.get("message") || undefined
  const agent = searchParams.get("agent")
  const preset = searchParams.get("preset")
  const feature = searchParams.get("feature")
  const activeDocumentTool = getDocumentWritingTool(searchParams.get("tool"))
  // 실시간 고객상담 화면은 상단 타이틀 밴드를 표시하지 않음
  const isCounseling = (agent === "assistant" || !agent) && (!feature || feature === "counseling") && !preset
  const title =
    agent === "document-writer"
      ? "문서작성 지원 에이전트"
      : agent === "debt-transfer"
      ? "심사이력 추론 에이전트"
      : agent === "compliance"
      ? feature === "policy-search"
        ? "사내규정 검색"
        : "상담지식 에이전트"
      : agent === "development"
        ? "개발 지원"
        : feature === "general-qa"
          ? "단순 질의응답 챗봇"
        : feature === "staff-search"
          ? "업무담당자 검색"
          : feature === "partner-search"
            ? "제휴기관 검색"
            : "실시간 고객상담"
  const historyKey =
    agent === "document-writer"
      ? undefined
      : agent === "debt-transfer"
      ? "genportal.chat.debt-transfer.current.v1"
      : agent === "compliance"
      ? preset
        ? `genportal.chat.compliance.preset.${preset}.v1`
        : "genportal.chat.compliance.current.v1"
      : agent === "development"
        ? preset
          ? `genportal.chat.development.preset.${preset}.v1`
          : "genportal.chat.development.current.v1"
        : feature === "general-qa"
          ? preset
            ? `genportal.chat.assistant.general-qa.preset.${preset}.v1`
            : "genportal.chat.assistant.general-qa.current.v1"
        : feature === "staff-search"
          ? "genportal.chat.assistant.staff-search.current.v1"
          : feature === "partner-search"
            ? "genportal.chat.assistant.partner-search.current.v1"
        : preset
          ? `genportal.chat.assistant.preset.${preset}.v3`
          : "genportal.chat.assistant.current.v3"
  const seedMessages = useMemo(() => createSeedMessages(agent, feature, activeDocumentTool.id), [agent, feature, activeDocumentTool.id])
  const presetMessages = useMemo(
    () =>
      agent === "document-writer"
        ? getDocumentWritingPresetMessages(preset)
        : agent === "debt-transfer"
        ? null
        : agent === "development"
        ? getDevelopmentPresetMessages(preset)
        : agent === "compliance"
          ? getCompliancePresetMessages(preset)
          : feature === "general-qa"
            ? getGeneralQaPresetMessages(preset)
          : feature === "staff-search"
            ? getStaffSearchPresetMessages(preset)
          : feature === "counseling" || !feature
            ? getAssistantPresetMessages(preset)
            : null,
    [agent, feature, preset],
  )
  const promptSuggestions =
    agent === "document-writer"
      ? getDocumentWritingPromptSuggestions(activeDocumentTool.id)
      : agent === "debt-transfer"
      ? debtTransferPromptSuggestions
      : agent === "development"
      ? developmentPromptSuggestions
        : agent === "compliance"
          ? compliancePromptSuggestions
        : feature === "general-qa"
          ? generalQaPromptSuggestions
        : feature === "staff-search"
          ? staffSearchPromptSuggestions
        : feature === "partner-search"
            ? [
                "제논라이프 제휴기관 검색 예시를 보여줘.",
                "기관명이 정확하지 않을 때 후보 목록을 제시하는 예시를 보여줘.",
                "협약기관 담당자 정보를 찾는 질의 예시를 보여줘.",
              ]
            : assistantPromptSuggestions

  const {
    message,
    setMessage,
    setMessages,
    messages,
    isLoading,
    activeSteps,
    sourceDocuments,
    toolState,
    pdfViewer,
    messagesEndRef,
    messagesAreaRef,
    handleSendMessage,
    showPDFViewer,
    closePDFViewer,
    processContentWithPDFCitations
  } = useChat({ initialMessage, disableAutoScroll: true, historyKey, seedMessages })
  const latestCodePreview = useMemo(() => extractLatestCodePreview(messages), [messages])
  const [debtTransferLoading, setDebtTransferLoading] = useState(false)
  const activeIsLoading = agent === "debt-transfer" ? debtTransferLoading : isLoading

  useEffect(() => {
    if (agent === "assistant" || !agent || agent === "compliance" || agent === "development" || agent === "document-writer" || agent === "debt-transfer") {
      if (presetMessages) {
        setMessages(presetMessages)
      }
    }
  }, [agent, presetMessages, setMessages])

  const handleDebtTransferSend = async (text: string) => {
    const sid = `session-${Date.now()}`
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      content: text.trim(),
      role: "user",
      timestamp: new Date(),
      sessionId: sid,
    }
    setMessages((prev) => [...prev, userMsg])
    setMessage("")
    setDebtTransferLoading(true)

    await new Promise((r) => setTimeout(r, 1000))

    const assistantMsg: Message = {
      id: `assistant-${Date.now()}`,
      content: generateDebtTransferResponse(text),
      role: "assistant",
      timestamp: new Date(),
      sessionId: sid,
      isMarkdown: true,
    }
    setMessages((prev) => [...prev, assistantMsg])
    setDebtTransferLoading(false)
  }

  const handleSend = () => {
    if (!message.trim()) return
    if (agent === "debt-transfer") {
      handleDebtTransferSend(message)
    } else {
      handleSendMessage(message)
    }
  }

  const handleDocumentToolChange = (nextTool: string) => {
    const target = getDocumentWritingTool(nextTool)
    router.replace(`/insight-chat?agent=document-writer&tool=${target.id}`)
  }

  return (
    <div className="h-full bg-background flex flex-col relative overflow-hidden">
      {/* Header — 실시간 고객상담 화면에서는 숨김 */}
      {!isCounseling ? (
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{title}</h1>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2 hover:bg-[#153AD4] hover:text-white hover:border-[#153AD4] transition-colors">
                <Home className="h-4 w-4" />
                홈으로
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {agent === "document-writer" ? (
        <DocumentWriterTool
          activeTool={activeDocumentTool.id}
        />
      ) : (agent === "assistant" || !agent) && (!feature || feature === "counseling") && !preset ? (
        <CounselingAssistantView demoCase={searchParams.get("case")} />
      ) : agent === "development" ? (
        <div className="mx-auto flex h-full w-full max-w-7xl flex-1 gap-6 overflow-hidden px-6 py-6">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-background">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>개발 지원 대화</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto" ref={messagesAreaRef}>
              {messages.length === 0 ? (
                <div className="mx-auto flex h-full w-full max-w-4xl items-center px-8 py-14">
                  <div className="w-full">
                    <Card className="min-h-[430px] py-0">
                      <CardHeader className="px-8 pb-4 pt-8">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Sparkles className="h-4 w-4" />
                          <span className="text-sm">추천 요청</span>
                        </div>
                        <CardTitle>바로 시작할 개발 요청</CardTitle>
                        <CardDescription>
                          채팅으로 요청하면 오른쪽에서 생성 코드 예시를 함께 확인할 수 있습니다.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5 px-8 pb-8">
                        <div className="grid gap-4 md:grid-cols-1">
                          {promptSuggestions.map((prompt) => (
                            <button
                              key={prompt}
                              onClick={() => setMessage(prompt)}
                              className="w-full rounded-2xl border border-border bg-card px-7 py-7 text-left text-sm leading-7 transition-colors hover:bg-muted"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <ChatList
                  messages={messages}
                  activeSteps={activeSteps}
                  sourceDocuments={sourceDocuments}
                  toolState={toolState}
                  pdfViewer={pdfViewer}
                  isLoading={activeIsLoading}
                  messagesEndRef={messagesEndRef}
                  onPDFClick={showPDFViewer}
                  processContentWithPDFCitations={processContentWithPDFCitations}
                />
              )}
            </div>
            <ChatInput
              message={message}
              setMessage={setMessage}
              handleSend={handleSend}
              isLoading={activeIsLoading}
            />
          </div>

          <div className="hidden w-[420px] shrink-0 lg:block">
            <Card className="flex h-full flex-col overflow-hidden py-0">
              <CardHeader className="border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Code2 className="h-4 w-4" />
                  <span className="text-sm">코드 미리보기</span>
                </div>
                <CardTitle>생성 코드 결과</CardTitle>
                <CardDescription>
                  채팅 응답에 포함된 최신 코드 블록을 이 영역에 표시합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-6">
                {latestCodePreview ? (
                  <>
                    <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Braces className="h-4 w-4 text-[#153AD4]" />
                        {latestCodePreview.language.toUpperCase()}
                      </div>
                      <div className="text-xs text-muted-foreground">최신 생성 결과</div>
                    </div>
                    {latestCodePreview.summary ? (
                      <div className="rounded-xl border bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
                        {latestCodePreview.summary}
                      </div>
                    ) : null}
                    <div className="min-h-0 flex-1 overflow-auto rounded-2xl border bg-slate-950 p-4">
                      <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-100">
                        {latestCodePreview.code}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-sm leading-6 text-muted-foreground">
                    코드가 생성되면 이 영역에서 API, SQL, 스크립트 예시를 바로 확인할 수 있습니다.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto" ref={messagesAreaRef}>
            {messages.length === 0 ? (
              <div className="mx-auto flex h-full w-full max-w-6xl items-center px-8 py-14">
                <div className="w-full">
                  <Card className="min-h-[430px] py-0">
                    <CardHeader className="px-8 pb-4 pt-8">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm">추천 질문</span>
                      </div>
                      <CardTitle>바로 시작할 질문</CardTitle>
                      <CardDescription>
                        아래 질문을 눌러 입력창에 바로 불러올 수 있습니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 px-8 pb-8">
                      <div className="grid gap-4 md:grid-cols-1">
                        {promptSuggestions.map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => setMessage(prompt)}
                            className="w-full rounded-2xl border border-border bg-card px-7 py-7 text-left text-sm leading-7 transition-colors hover:bg-muted"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <ChatList
                messages={messages}
                activeSteps={activeSteps}
                sourceDocuments={sourceDocuments}
                toolState={toolState}
                pdfViewer={pdfViewer}
                isLoading={activeIsLoading}
                messagesEndRef={messagesEndRef}
                onPDFClick={showPDFViewer}
                processContentWithPDFCitations={processContentWithPDFCitations}
              />
            )}
          </div>

          {/* Suggestion Pills — debt-transfer only */}
          {agent === "debt-transfer" && (
            <div className="shrink-0 px-6 pt-3 pb-2 flex gap-2 flex-wrap">
              {promptSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setMessage(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <ChatInput
            message={message}
            setMessage={setMessage}
            handleSend={handleSend}
            isLoading={activeIsLoading}
          />
        </>
      )}

      {/* PDF Viewer */}
      <PDFViewer
        isVisible={pdfViewer.isVisible}
        filename={pdfViewer.filename}
        filePath={pdfViewer.currentPDF}
        onClose={closePDFViewer}
      />
    </div>
  )
}

export default function InsightChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InsightChatPageContent />
    </Suspense>
  )
}

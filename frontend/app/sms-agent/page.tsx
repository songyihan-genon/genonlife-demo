"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  MessageSquare,
  Home,
  Clock,
  Loader2,
  CheckCircle2,
  Send,
  RotateCcw,
  Sparkles,
  User,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type SmsState = "idle" | "loading" | "ready" | "sending" | "sent"

interface Consultation {
  id: string
  customerName: string
  customerId: string
  date: string
  type: string
  summary: string
  hasSmsRequest: boolean
  smsType?: string
}

const CONSULTATIONS: Consultation[] = [
  {
    id: "1",
    customerName: "김○○",
    customerId: "2024-38491",
    date: "14:20",
    type: "보험료 납입 문의",
    summary: "4월 보험료 자동이체 실패 관련 문의, 재납입 방법 안내 요청",
    hasSmsRequest: true,
    smsType: "보험료 납입 안내",
  },
  {
    id: "2",
    customerName: "이○○",
    customerId: "2024-29312",
    date: "13:45",
    type: "보험금 청구 문의",
    summary: "실손보험 청구 서류 제출 방법 및 처리 기간 안내",
    hasSmsRequest: false,
  },
  {
    id: "3",
    customerName: "박○○",
    customerId: "2023-91047",
    date: "13:10",
    type: "계약 만료 안내",
    summary: "6월 만료 예정 종신보험 갱신 여부 및 조건 상담, SMS 안내 요청",
    hasSmsRequest: true,
    smsType: "계약 만료 안내",
  },
  {
    id: "4",
    customerName: "최○○",
    customerId: "2025-10283",
    date: "12:30",
    type: "이벤트·혜택 문의",
    summary: "신규 건강보험 프로모션 조건 및 가입 혜택 문의",
    hasSmsRequest: false,
  },
  {
    id: "5",
    customerName: "정○○",
    customerId: "2024-77651",
    date: "11:55",
    type: "상담 예약 변경",
    summary: "기존 예약 취소 후 다음 주 재예약 요청",
    hasSmsRequest: false,
  },
]

const LOADING_STEPS = [
  "STT 오타 교정 및 상담 내용 전처리 중…",
  "RAG 검색 중 — 약관·구비서류·업무매뉴얼 탐색…",
  "CX 라이팅 적용하여 SMS 문구 생성 중…",
]

const RAG_SOURCES: Record<string, string[]> = {
  "1": ["납입 유예 규정 §4", "자동이체 안내 매뉴얼"],
  "3": ["종신보험 약관 §12", "계약 갱신 구비서류 안내"],
}

const MOCK_DRAFTS: Record<string, string> = {
  "1": `[제논라이프] 안녕하세요, 고객님.

4월 보험료 자동이체가 미처리 상태입니다.
원활한 보장 유지를 위해 아래 방법으로 납입 바랍니다.

▶ 앱/인터넷: 제논라이프 공식 앱 → 보험료 납입
▶ 고객센터: 1588-8000 (평일 09:00~18:00)

* 납입 기한 초과 시 계약이 실효될 수 있습니다.
수신거부 080-8000-8000`,
  "3": `[제논라이프] 안녕하세요, 고객님.

가입하신 종신보험이 2026년 6월에 만료 예정입니다.
갱신을 원하시면 아래 구비서류를 준비해 주세요.

▶ 필요서류: 신분증 사본, 갱신 신청서
▶ 제출처: 가까운 제논라이프 지점 또는 우편 접수

자세한 사항은 담당 상담사에게 문의해 주세요.
▶ 문의: 1588-8000
수신거부 080-8000-8000`,
}

const REVISION_SUFFIX: Record<number, string> = {
  1: "\n\n* 추가 안내: 납입 완료 후 앱에서 납입 확인서를 발급받으실 수 있습니다.",
  2: "\n\n* 문의 시 계약번호를 준비해 주시면 더 빠른 안내가 가능합니다.",
}

const SMS_BYTE_LIMIT = 2000

function getByteLength(str: string) {
  let byte = 0
  for (let i = 0; i < str.length; i++) {
    byte += str.charCodeAt(i) > 127 ? 2 : 1
  }
  return byte
}

export default function SmsAgentPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [smsState, setSmsState] = useState<SmsState>("idle")
  const [loadingStep, setLoadingStep] = useState(0)
  const [smsDraft, setSmsDraft] = useState("")
  const [additionalPrompt, setAdditionalPrompt] = useState("")
  const [revisionCount, setRevisionCount] = useState(0)
  const [sentAt, setSentAt] = useState("")
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  const selectedConsultation = CONSULTATIONS.find((c) => c.id === selectedId) ?? null

  const runLoading = async (id: string, revision = 0) => {
    setSmsState("loading")
    setLoadingStep(0)
    for (let i = 1; i <= 3; i++) {
      await new Promise((r) => setTimeout(r, 650))
      setLoadingStep(i)
    }
    const base = MOCK_DRAFTS[id] ?? ""
    const suffix = revision > 0 ? (REVISION_SUFFIX[revision] ?? "") : ""
    setSmsDraft(base + suffix)
    setSmsState("ready")
  }

  const handleSelect = async (consultation: Consultation) => {
    if (!consultation.hasSmsRequest) {
      setSelectedId(consultation.id)
      setSmsState("idle")
      return
    }
    setSelectedId(consultation.id)
    setAdditionalPrompt("")
    setRevisionCount(0)
    await runLoading(consultation.id, 0)
  }

  const handleRegenerate = async () => {
    if (!selectedId) return
    const next = revisionCount + 1
    setRevisionCount(next)
    await runLoading(selectedId, next)
    setAdditionalPrompt("")
  }

  const handleSend = async () => {
    setSmsState("sending")
    await new Promise((r) => setTimeout(r, 1000))
    const now = new Date()
    setSentAt(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ` +
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    )
    if (selectedId) setSentIds((prev: Set<string>) => new Set(prev).add(selectedId))
    setSmsState("sent")
  }

  const handleReset = () => {
    setSelectedId(null)
    setSmsState("idle")
    setSmsDraft("")
    setAdditionalPrompt("")
    setRevisionCount(0)
  }

  return (
    <div className="h-full flex flex-col bg-[#f4f7fb]">
      {/* Header */}
      <div className="border-b border-border bg-white px-6 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-[#005bac]" />
            <h1 className="text-base font-semibold">SMS 자동생성 Agent</h1>
          </div>
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-[#005bac] hover:text-white hover:border-[#005bac] transition-colors"
            >
              <Home className="h-4 w-4 mr-1.5" />
              홈으로
            </Button>
          </Link>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: 상담 이력 목록 (40%) */}
        <div className="w-2/5 border-r border-border bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">상담 이력</h2>
              <span className="text-xs text-muted-foreground">오늘 · {CONSULTATIONS.length}건</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">SMS 요청이 접수된 상담을 선택하세요</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {CONSULTATIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={cn(
                  "w-full text-left rounded-lg border p-3 transition-all duration-150",
                  selectedId === c.id
                    ? "border-[#005bac] bg-[#005bac]/5 shadow-sm"
                    : "border-border bg-white hover:border-[#005bac]/40 hover:bg-[#f4f7fb]",
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-sm font-medium">{c.customerName}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {sentIds.has(c.id) ? (
                      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-700 border border-green-300 hover:bg-green-100">
                        발송 완료
                      </Badge>
                    ) : c.hasSmsRequest ? (
                      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-100">
                        SMS 요청
                      </Badge>
                    ) : null}
                    <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {c.date}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#005bac] font-medium mb-1">{c.type}</p>
                <p className="text-xs text-muted-foreground leading-4 line-clamp-2">{c.summary}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1.5">{c.customerId}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: SMS 초안 패널 (60%) */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* idle — 미선택 또는 SMS 요청 없는 상담 선택 */}
          {smsState === "idle" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                {selectedConsultation && !selectedConsultation.hasSmsRequest ? (
                  <>
                    <p className="text-sm font-medium text-foreground mb-1">{selectedConsultation.type}</p>
                    <p className="text-xs text-muted-foreground">이 상담건에는 SMS 요청이 없습니다</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">왼쪽 목록에서 SMS 요청 상담을 선택하세요</p>
                    <p className="text-xs text-muted-foreground/60 mt-1.5 flex items-center justify-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-sm bg-amber-400" />
                      SMS 요청 표시가 있는 상담건을 클릭하세요
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* loading */}
          {smsState === "loading" && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-sm space-y-3">
                <p className="text-sm font-medium text-center mb-5">SMS 초안 생성 중…</p>
                {LOADING_STEPS.map((text, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300",
                      loadingStep > i
                        ? "border-[#005bac]/30 bg-[#005bac]/5"
                        : loadingStep === i
                        ? "border-border bg-white"
                        : "border-border/50 bg-white/50",
                    )}
                  >
                    {loadingStep > i ? (
                      <CheckCircle2 className="h-4 w-4 text-[#005bac] shrink-0" />
                    ) : loadingStep === i ? (
                      <Loader2 className="h-4 w-4 text-[#005bac] animate-spin shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-xs",
                        loadingStep >= i ? "text-foreground" : "text-muted-foreground/50",
                      )}
                    >
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ready — 초안 편집 */}
          {smsState === "ready" && selectedConsultation && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* 고객 정보 카드 */}
              <Card className="border-[#005bac]/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#005bac]/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-[#005bac]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{selectedConsultation.customerName}</p>
                        <p className="text-xs text-muted-foreground">{selectedConsultation.customerId} · {selectedConsultation.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-muted-foreground mr-1">RAG 참조:</span>
                      {(RAG_SOURCES[selectedConsultation.id] ?? []).map((src) => (
                        <Badge key={src} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {src}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SMS 초안 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">SMS 문구 (직접 수정 가능)</p>
                  <p className="text-[11px] text-muted-foreground">
                    {getByteLength(smsDraft)}byte
                    <span className={cn("ml-1", getByteLength(smsDraft) > SMS_BYTE_LIMIT ? "text-red-500" : "text-green-600")}>
                      {getByteLength(smsDraft) <= SMS_BYTE_LIMIT ? "✓ 적합" : "⚠ 초과"}
                    </span>
                  </p>
                </div>
                <Textarea
                  className="resize-none font-mono text-sm leading-6 min-h-[200px] bg-white"
                  value={smsDraft}
                  onChange={(e) => setSmsDraft(e.target.value)}
                />
              </div>

              {/* 추가 지시사항 */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">추가 지시사항 (선택)</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="예) 구비서류 항목 추가해줘, 약관 조항 번호 넣어줘"
                    className="text-sm bg-white"
                    value={additionalPrompt}
                    onChange={(e) => setAdditionalPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRegenerate() }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 hover:bg-[#005bac] hover:text-white hover:border-[#005bac] transition-colors"
                    onClick={handleRegenerate}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    재생성
                  </Button>
                </div>
                {revisionCount > 0 && (
                  <p className="text-[11px] text-muted-foreground">재생성 {revisionCount}회</p>
                )}
              </div>

              {/* 규정 준수 체크 */}
              {(() => {
                const byteOk = getByteLength(smsDraft) <= SMS_BYTE_LIMIT
                const checks = [
                  { label: "문자 발송 시간 준수", pass: true },
                  { label: "마케팅 수신 동의", pass: true },
                  { label: "개인정보 미포함", pass: true },
                  { label: "문구 길이 적합", pass: byteOk },
                ]
                return (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">규정 준수:</span>
                    {checks.map((item) => (
                      <span
                        key={item.label}
                        className={cn(
                          "inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 border",
                          item.pass
                            ? "text-green-700 bg-green-50 border-green-200"
                            : "text-red-600 bg-red-50 border-red-200",
                        )}
                      >
                        {item.pass
                          ? <CheckCircle2 className="h-3 w-3" />
                          : <XCircle className="h-3 w-3" />
                        }
                        {item.label}
                      </span>
                    ))}
                  </div>
                )
              })()}

              {/* 액션 버튼 */}
              <div className="flex gap-3 pt-1">
                <Button
                  className="flex-1 bg-[#005bac] hover:bg-[#004a8f] text-white"
                  onClick={handleSend}
                >
                  <Send className="h-4 w-4 mr-2" />
                  발송
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 hover:border-red-400 hover:text-red-600 transition-colors"
                  onClick={handleReset}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  반려
                </Button>
              </div>

            </div>
          )}

          {/* sending */}
          {smsState === "sending" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-10 w-10 text-[#005bac] animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium">Tele-Pro SMS 발송 중…</p>
              </div>
            </div>
          )}

          {/* sent */}
          {smsState === "sent" && selectedConsultation && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-sm space-y-4">
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 text-[#005bac] mx-auto mb-3" />
                  <p className="text-base font-semibold">발송 완료</p>
                  <p className="text-xs text-muted-foreground mt-1">SMS가 성공적으로 발송되었습니다</p>
                </div>

                <Card className="border-[#005bac]/20">
                  <CardContent className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">수신 고객</span>
                      <span className="font-medium">{selectedConsultation.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">발송 채널</span>
                      <span className="font-medium">Tele-Pro SMS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">발송 시각</span>
                      <span className="font-medium">{sentAt}</span>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground mb-1.5">발송 내용</p>
                      <div className="bg-muted/40 rounded-md p-3 text-xs font-mono leading-5 whitespace-pre-wrap">
                        {smsDraft}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button variant="outline" className="w-full" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  초기화
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

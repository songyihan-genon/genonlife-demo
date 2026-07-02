"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Bot,
  CircleDot,
  ClipboardList,
  Clock3,
  FileCheck2,
  Headphones,
  ListChecks,
  MessageCircle,
  PencilLine,
  PhoneCall,
  Save,
  ShieldCheck,
  Sparkles,
  Tag,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Speaker = "customer" | "agent"
type Phase = "live" | "ended" | "approved"

interface TranscriptItem {
  id: string
  speaker: Speaker
  time: string
  text: string
}

const transcriptSeed: TranscriptItem[] = [
  {
    id: "stt-1",
    speaker: "agent",
    time: "10:21:03",
    text: "안녕하세요. 제논라이프 고객센터 상담사 김제나입니다. 본인 확인 후 상담 도와드리겠습니다.",
  },
  {
    id: "stt-2",
    speaker: "customer",
    time: "10:21:18",
    text: "보험금 청구를 했는데 추가 서류가 필요하다는 문자를 받았습니다. 어떤 서류를 더 내야 하는지 알고 싶습니다.",
  },
  {
    id: "stt-3",
    speaker: "agent",
    time: "10:21:42",
    text: "확인해보겠습니다. 현재 접수하신 건은 실손의료비 청구 건이고, 진료비 세부내역서가 아직 접수되지 않은 상태로 보입니다.",
  },
  {
    id: "stt-4",
    speaker: "customer",
    time: "10:22:05",
    text: "진료비 영수증은 냈는데 세부내역서는 병원에서 다시 받아야 하는 건가요?",
  },
  {
    id: "stt-5",
    speaker: "agent",
    time: "10:22:31",
    text: "네, 병원 원무과에서 발급받으실 수 있습니다. 모바일 앱이나 홈페이지에서 추가 서류 제출 메뉴로 업로드하시면 됩니다.",
  },
  {
    id: "stt-6",
    speaker: "customer",
    time: "10:22:55",
    text: "제출하면 심사는 얼마나 걸리나요? 이번 주 안에 처리되는지도 궁금합니다.",
  },
  {
    id: "stt-7",
    speaker: "agent",
    time: "10:23:20",
    text: "서류가 모두 접수되면 통상 3영업일 이내 심사가 진행됩니다. 다만 추가 확인이 필요한 경우 기간이 더 소요될 수 있습니다.",
  },
]

const keywordCandidates = ["보험금 청구", "실손의료비", "추가 서류", "진료비 세부내역서", "심사 기간"]
const productCandidates = ["제논라이프 실손의료비 보장", "보험금 청구 서비스", "모바일 추가서류 제출"]
const contactTypePriorityRows = [
  {
    rank: "1",
    title: "보험금 청구 서류 보완 문의",
    weight: "72%",
    importance: "높음",
    major: "보험금 청구",
    middle: "서류 보완",
    minor: "진료비 세부내역서",
  },
  {
    rank: "2",
    title: "심사 기간 확인 문의",
    weight: "21%",
    importance: "보통",
    major: "보험금 청구",
    middle: "심사 진행",
    minor: "예상 처리 기간",
  },
  {
    rank: "3",
    title: "모바일 제출 경로 안내",
    weight: "7%",
    importance: "낮음",
    major: "계약/서비스 이용",
    middle: "모바일 서비스",
    minor: "추가서류 제출",
  },
]

export function CounselingSummaryTool() {
  const [phase, setPhase] = useState<Phase>("live")
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [isContactHistoryOpen, setIsContactHistoryOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(4)
  const [overallSummary, setOverallSummary] = useState(
    "고객은 실손의료비 보험금 청구 건의 보완 서류와 심사 기간을 문의했고, 상담사는 진료비 세부내역서 제출 경로와 예상 심사 기간을 안내했습니다.",
  )
  const [smsDraft, setSmsDraft] = useState(
    [
      "[제논라이프] 상담 안내드립니다.",
      "문의하신 실손의료비 보험금 청구 건은 진료비 세부내역서 추가 제출이 필요합니다.",
      "해당 서류는 병원 원무과에서 발급받으신 뒤, 제논라이프 모바일 앱 또는 홈페이지의 추가서류 제출 메뉴에서 업로드하실 수 있습니다.",
      "서류가 모두 접수되면 통상 3영업일 이내 심사가 진행됩니다. 감사합니다.",
    ].join("\n"),
  )
  const [agentSummary, setAgentSummary] = useState(
    [
      "상담사는 실손의료비 보험금 청구 건의 접수 상태를 확인하고, 미제출 서류로 진료비 세부내역서가 필요하다고 안내했습니다.",
      "추가 서류는 병원 원무과에서 발급 가능하며, 제논라이프 모바일 앱 또는 홈페이지의 추가 서류 제출 메뉴로 업로드할 수 있다고 설명했습니다.",
      "서류가 모두 접수되면 통상 3영업일 이내 심사가 진행되나, 추가 확인이 필요한 경우 기간이 연장될 수 있음을 안내했습니다.",
    ].join("\n"),
  )
  const [customerSummary, setCustomerSummary] = useState(
    [
      "고객은 보험금 청구 후 추가 서류 요청 문자를 받았고, 어떤 서류를 제출해야 하는지 문의했습니다.",
      "진료비 영수증은 이미 제출했으나 진료비 세부내역서를 별도로 발급받아야 하는지 확인했습니다.",
      "추가 서류 제출 이후 심사 소요 기간과 이번 주 내 처리 가능 여부를 문의했습니다.",
    ].join("\n"),
  )
  const [memo, setMemo] = useState("고객에게 진료비 세부내역서 발급 및 모바일 추가 제출 경로를 재안내했습니다.")
  const [historyRequested, setHistoryRequested] = useState(false)
  const [historySaved, setHistorySaved] = useState(false)
  const [contactHistory, setContactHistory] = useState(
    [
      "[상담 요약]",
      "고객은 실손의료비 보험금 청구 후 추가 서류 요청 문자를 받았으며, 필요한 서류와 제출 경로 및 심사 소요 기간을 문의했습니다.",
      "",
      "[상담사 안내]",
      "진료비 세부내역서가 미제출 상태임을 확인하고, 병원 원무과 발급 후 모바일 앱 또는 홈페이지의 추가 서류 제출 메뉴를 통해 업로드할 수 있음을 안내했습니다.",
      "",
      "[처리 정보]",
      "상담 ID CL-20260514-018, 고객번호 C-10294857, 계약번호 SL-2048-5521, 접촉일시 2026.05.14 15:14 기준으로 접촉이력 등록 대기 상태입니다.",
    ].join("\n"),
  )

  useEffect(() => {
    if (phase !== "live" || visibleCount >= transcriptSeed.length) return

    const timer = window.setTimeout(() => {
      setVisibleCount((count) => Math.min(count + 1, transcriptSeed.length))
    }, 1600)

    return () => window.clearTimeout(timer)
  }, [phase, visibleCount])

  const visibleTranscript = transcriptSeed.slice(0, visibleCount)
  const isCompleted = visibleCount >= transcriptSeed.length

  const customerTalks = useMemo(
    () => visibleTranscript.filter((item) => item.speaker === "customer").length,
    [visibleTranscript],
  )
  const agentTalks = useMemo(
    () => visibleTranscript.filter((item) => item.speaker === "agent").length,
    [visibleTranscript],
  )

  const endConsultation = () => {
    setVisibleCount(transcriptSeed.length)
    setPhase("ended")
  }

  return (
    <div className="min-h-full overflow-x-hidden bg-[#f7f9fc] px-6 py-6">
      <div className="mx-auto flex w-full max-w-[1600px] min-w-0 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#005bac]">
              <Headphones className="h-4 w-4" />
              상담 중 활용 Agent
            </div>
            <h1 className="text-2xl font-bold text-[#10233f]">실시간 상담 STT 요약 지원</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              상담사와 고객 발화를 구분해 수집하고, 상담 종료 후 요약·키워드·관련 상품을 검토 가능한 형태로 생성합니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-[#8fb4df] bg-white text-[#0b4f91]">
              <CircleDot className="mr-1 h-3 w-3 fill-emerald-500 text-emerald-500" />
              STT 수신 {phase === "live" ? "진행 중" : "종료"}
            </Badge>
            <Button
              variant="outline"
              onClick={() => {
                setPhase("live")
                setVisibleCount(1)
                setHistoryRequested(false)
                setHistorySaved(false)
              }}
            >
              새 상담 시작
            </Button>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
          <CustomerPanel />

          <Card className="min-h-[700px] min-w-0 overflow-hidden py-0">
            <CardHeader className="border-b bg-white px-7 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PhoneCall className="h-5 w-5 text-[#005bac]" />
                    실시간 STT 대화
                  </CardTitle>
                  <CardDescription>상담사/고객 발화가 화자별 말풍선으로 전송됩니다.</CardDescription>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>상담 ID: CL-20260514-018</div>
                  <div>경과 시간: 02:17</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex h-[610px] min-w-0 flex-col p-0">
              <div className="flex-1 space-y-5 overflow-y-auto bg-[#edf3fa] px-7 py-6">
                {visibleTranscript.map((item) => (
                  <TranscriptBubble key={item.id} item={item} />
                ))}
                {phase === "live" && !isCompleted ? (
                  <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    STT 라이브러리에서 다음 발화를 수신 중입니다.
                  </div>
                ) : null}
              </div>
              <div className="border-t bg-white px-7 py-5">
                {phase === "ended" || phase === "approved" ? (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#c7ddf4] bg-[#f2f8ff] px-5 py-4">
                    <div>
                      <p className="font-semibold text-[#10233f]">
                        {phase === "approved" ? "SMS 전송이 완료되었습니다." : "상담이 종료되었습니다."}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {phase === "approved"
                          ? "승인된 안내 문구는 고객 발송 대기 상태입니다."
                          : "고객에게 상담 내용을 요약한 안내 문자를 발송할 수 있습니다."}
                      </p>
                    </div>
                    <Button className="bg-[#005bac] hover:bg-[#084780]" onClick={() => setIsSummaryOpen(true)}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      SMS 전송
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      고객 발화 {customerTalks}건 · 상담사 발화 {agentTalks}건 · 키워드 후보 {keywordCandidates.length}건
                    </div>
                    <Button className="bg-[#005bac] hover:bg-[#084780]" onClick={endConsultation}>
                      상담 종료
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="min-w-0">
            <RealtimeInsightPanel
              visibleTranscript={visibleTranscript}
              isCompleted={phase === "ended" || phase === "approved"}
              onContactHistory={() => {
                setHistoryRequested(true)
                setIsContactHistoryOpen(true)
              }}
              isHistorySaved={historySaved}
            />
          </div>
        </div>

        <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
          <DialogContent
            className="max-h-[84vh] w-[min(94vw,980px)] max-w-[94vw] overflow-y-auto p-0 sm:max-w-[94vw] xl:max-w-[980px]"
            showCloseButton
          >
            <DialogHeader className="border-b bg-white px-7 py-5">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-[#005bac]" />
                SMS 전송 내용 검토
              </DialogTitle>
              <DialogDescription>
                상담 내용을 기반으로 생성된 고객 발송 문구를 확인하고 수정한 뒤 전송합니다.
              </DialogDescription>
            </DialogHeader>
          <SummaryReview
            phase={phase}
            overallSummary={overallSummary}
            smsDraft={smsDraft}
            agentSummary={agentSummary}
            customerSummary={customerSummary}
            memo={memo}
            setOverallSummary={setOverallSummary}
            setSmsDraft={setSmsDraft}
            setAgentSummary={setAgentSummary}
            setCustomerSummary={setCustomerSummary}
            setMemo={setMemo}
            onBack={() => setIsSummaryOpen(false)}
            onApprove={() => {
              setPhase("approved")
              setIsSummaryOpen(false)
            }}
          />
          </DialogContent>
        </Dialog>

        <Dialog open={isContactHistoryOpen} onOpenChange={setIsContactHistoryOpen}>
          <DialogContent
            className="max-h-[84vh] w-[min(94vw,1180px)] max-w-[94vw] overflow-y-auto p-0 sm:max-w-[94vw] xl:max-w-[1180px]"
            showCloseButton
          >
            <DialogHeader className="border-b bg-white px-7 py-5">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <ClipboardList className="h-5 w-5 text-[#005bac]" />
                접촉이력 등록
              </DialogTitle>
              <DialogDescription>
                STT 상담 내용과 과거이력을 분석해 Tele-Pro 등록용 접촉이력 초안을 생성합니다.
              </DialogDescription>
            </DialogHeader>
            <ContactHistoryReview
              phase={phase}
              historySaved={historySaved}
              contactHistory={contactHistory}
              onChange={setContactHistory}
              onClose={() => setIsContactHistoryOpen(false)}
              onSave={() => {
                setHistoryRequested(true)
                setHistorySaved(true)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function ContactHistoryRegistrationPanel({
  phase,
  historyRequested,
  historySaved,
  contactHistory,
  onRequest,
  onSave,
  onChange,
}: {
  phase: Phase
  historyRequested: boolean
  historySaved: boolean
  contactHistory: string
  onRequest: () => void
  onSave: () => void
  onChange: (value: string) => void
}) {
  const isLive = phase === "live"

  return (
    <Card className="min-w-0 overflow-hidden py-0">
      <CardHeader className="border-b bg-white px-7 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#005bac]" />
              접촉이력 등록
            </CardTitle>
            <CardDescription>
              상담 중 또는 종료 후 요청 시 Agent가 이력 유형을 구분하고 처리 정보를 포함해 등록 내용을 요약합니다.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border-[#bad6f4] bg-[#f2f8ff] text-[#0b4f91]",
                historySaved && "border-emerald-200 bg-emerald-50 text-emerald-700",
              )}
            >
              {historySaved ? "저장 완료" : historyRequested ? "상담사 검토 중" : "요청 전"}
            </Badge>
            <Button variant="outline" onClick={onRequest}>
              <Sparkles className="mr-2 h-4 w-4" />
              접촉이력 등록 요청
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-7">
        <ContactHistoryFlow isRequested={historyRequested} isSaved={historySaved} />

        {!historyRequested ? (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-[#d5e6f7] bg-[#fbfdff] p-5">
                <div className="mb-3 flex items-center gap-2 font-semibold text-[#10233f]">
                  <MessageCircle className="h-4 w-4 text-[#005bac]" />
                  상담 상태 메모리
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  {[
                    ["고객 요청", "추가 서류와 심사 기간 문의"],
                    ["상담사 안내", "진료비 세부내역서 제출 경로 안내"],
                    ["처리 결과", "서류 보완 필요 상태 확인"],
                    ["후속 조치", "모바일 업로드 및 심사 기간 재안내"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border bg-white px-4 py-3">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="mt-1 font-semibold text-[#10233f]">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#d5e6f7] bg-[#fbfdff] p-5">
                <div className="mb-3 flex items-center gap-2 font-semibold text-[#10233f]">
                  <Sparkles className="h-4 w-4 text-[#005bac]" />
                  Agent 실행 결과 미리보기
                </div>
                <div className="space-y-3 text-sm">
                  <div className="rounded-xl border bg-white px-4 py-3">
                    <div className="font-semibold">Multi-Intent 분석</div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      보험금 청구, 서류 보완, 심사 기간 문의를 분리하고 우선 등록 유형을 산정합니다.
                    </p>
                  </div>
                  <div className="rounded-xl border bg-white px-4 py-3">
                    <div className="font-semibold">정형 이력 초안 생성</div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      고객 요청, 상담사 안내, 처리 결과, 후속 조치 기준으로 CRM 저장 문구를 생성합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-[#bad6f4] bg-[#f2f8ff] p-5 text-sm leading-6 text-[#0b4f91]">
              {isLive
                ? "현재 상담 발화가 수신 중입니다. 상담 중에도 접촉이력 등록 요청을 실행하면 현재까지의 발화 기준으로 임시 등록 초안을 생성합니다."
                : "상담이 종료되었습니다. 접촉이력 등록 요청을 실행하면 전체 발화 기준으로 등록 초안을 생성합니다."}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="rounded-2xl border bg-white p-5">
                <div className="mb-4 flex items-center gap-2 font-semibold text-[#10233f]">
                  <MessageCircle className="h-4 w-4 text-[#005bac]" />
                  상담 상태 메모리
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    ["고객 요청", "보완 서류 및 심사 기간 문의"],
                    ["상담사 안내", "진료비 세부내역서 발급/제출 안내"],
                    ["처리 결과", "추가 서류 요청 상태 확인"],
                    ["후속 조치", "서류 업로드 후 심사 진행"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border bg-[#fbfdff] px-4 py-3">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="mt-1 font-semibold text-[#10233f]">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="mb-4 flex items-center gap-2 font-semibold text-[#10233f]">
                  <ListChecks className="h-4 w-4 text-[#005bac]" />
                  Multi-Intent 분석 및 접촉유형 분류
                </div>
                <div className="space-y-3">
                  {contactTypePriorityRows.map((item, index) => (
                    <HistoryTypePriorityCard key={item.rank} item={item} active={index === 0} compact />
                  ))}
                </div>
                <p className="mt-4 rounded-xl bg-[#f2f8ff] p-3 text-xs leading-5 text-[#0b4f91]">
                  발화 비중, 업무 중요도, 후속 처리 필요성을 기준으로 1~3순위 접촉 유형을 함께 제안합니다.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-[#10233f]">접촉이력 등록 내용</div>
                  <div className="text-xs text-muted-foreground">고객 요청, 상담사 안내, 처리 결과, 후속 조치 기준으로 생성된 초안입니다.</div>
                </div>
                <Badge variant="outline" className="border-[#bad6f4] bg-[#f2f8ff] text-[#0b4f91]">
                  Agent 초안
                </Badge>
              </div>
              <Textarea
                value={contactHistory}
                onChange={(event) => onChange(event.target.value)}
                className="min-h-[300px] resize-y text-sm leading-6"
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  저장 전 상담사가 문구와 처리 정보를 확인합니다.
                </p>
                <Button className="bg-[#005bac] hover:bg-[#084780]" onClick={onSave}>
                  <Save className="mr-2 h-4 w-4" />
                  내용 확인 후 직접 저장
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border bg-white p-5">
                <div className="mb-4 font-semibold text-[#10233f]">처리계 정보 결합</div>
                <div className="space-y-3 text-sm">
                  {[
                    ["상담 ID", "CL-20260514-018"],
                    ["고객번호", "C-10294857"],
                    ["계약번호", "SL-2048-5521"],
                    ["상담채널", "콜센터 인바운드"],
                    ["접촉일시", "2026.05.14 15:14"],
                    ["처리상태", historySaved ? "저장 완료" : "등록 대기"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border bg-[#fbfdff] px-4 py-3">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="mt-1 font-semibold text-[#10233f]">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              {historySaved ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800">
                  접촉이력이 저장되었습니다. 후처리 시스템의 고객 상담 이력에서 확인할 수 있습니다.
                </div>
              ) : (
                <div className="rounded-2xl border border-[#bad6f4] bg-[#f2f8ff] p-5 text-sm leading-6 text-[#0b4f91]">
                  상담사가 내용을 확인한 뒤 저장해야 최종 접촉이력으로 등록됩니다.
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ContactHistoryReview({
  phase,
  historySaved,
  contactHistory,
  onChange,
  onClose,
  onSave,
}: {
  phase: Phase
  historySaved: boolean
  contactHistory: string
  onChange: (value: string) => void
  onClose: () => void
  onSave: () => void
}) {
  const isLive = phase === "live"

  return (
    <div className="min-w-0 space-y-5 p-6">
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="py-0">
            <CardHeader className="border-b bg-white px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4 text-[#005bac]" />
                고객 요구사항
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5 text-sm">
              <div className="rounded-xl border bg-[#fbfdff] p-4">
                보험금 청구 후 추가 서류 요청 문자를 받았고, 필요한 서류와 제출 경로를 확인하고자 합니다.
              </div>
              <div className="rounded-xl border bg-[#fbfdff] p-4">
                진료비 세부내역서 제출 후 예상 심사 기간과 이번 주 처리 가능 여부를 문의했습니다.
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader className="border-b bg-white px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock3 className="h-4 w-4 text-[#005bac]" />
                과거이력 분석
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5 text-sm">
              {[
                ["2026.05.10", "보험금 청구 접수"],
                ["2026.05.12", "진료비 세부내역서 보완 요청"],
                ["2026.05.14", isLive ? "상담 진행 중 STT 기준 임시 분석" : "고객 전화 문의 상담 종료"],
              ].map(([date, content]) => (
                <div key={`${date}-${content}`} className="rounded-xl border bg-white px-4 py-3">
                  <div className="text-xs text-muted-foreground">{date}</div>
                  <div className="mt-1 font-semibold text-[#10233f]">{content}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="py-0">
            <CardHeader className="border-b bg-white px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ListChecks className="h-4 w-4 text-[#005bac]" />
                    접촉유형 및 처리내용
                  </CardTitle>
                  <CardDescription>
                    Agent가 다중 질의를 분석해 중요도 순으로 접촉유형 후보와 저장 초안을 생성합니다.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "border-[#bad6f4] bg-[#f2f8ff] text-[#0b4f91]",
                    historySaved && "border-emerald-200 bg-emerald-50 text-emerald-700",
                  )}
                >
                  {historySaved ? "저장 완료" : "검토 대기"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="rounded-2xl border bg-white p-4">
                <div className="mb-3 flex items-center gap-2 font-semibold text-[#10233f]">
                  <Tag className="h-4 w-4 text-[#005bac]" />
                  다중 질의 우선순위 및 접촉유형 분류
                </div>
                <div className="grid gap-3 xl:grid-cols-3">
                  {contactTypePriorityRows.map((item, index) => (
                    <HistoryTypePriorityCard key={item.rank} item={item} active={index === 0} />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 font-semibold text-[#10233f]">접촉이력 등록 초안</div>
                <Textarea
                  value={contactHistory}
                  onChange={(event) => onChange(event.target.value)}
                  className="min-h-[220px] resize-y text-sm leading-6"
                />
              </div>

              <div className="rounded-xl border border-[#c7ddf4] bg-[#f2f8ff] p-4 text-sm leading-6 text-[#0b4f91]">
                처리 정보: 상담 ID CL-20260514-018, 고객번호 C-10294857, 계약번호 SL-2048-5521, 접촉일시 2026.05.14 15:14
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  닫기
                </Button>
                <Button className="bg-[#005bac] hover:bg-[#084780]" onClick={onSave}>
                  <Save className="mr-2 h-4 w-4" />
                  내용 확인 후 Tele-Pro 저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ContactHistoryFlow({ isRequested, isSaved }: { isRequested: boolean; isSaved: boolean }) {
  const steps = [
    ["Input", "실시간 상담/STT", "STT 원문과 상담 요약본을 결합"],
    ["Memory", "상담 상태 메모리", "고객 요청·상담사 안내·처리 결과·후속 조치"],
    ["1", "Multi-Intent 분석", "요구사항 분리, 상담 비중, 업무 중요도 분석"],
    ["2", "접촉유형 분류", "대/중/소분류 자동 매핑"],
    ["3", "처리계 정보 결합", "계약정보, 거래로그, 처리 결과 결합"],
    ["4", "접촉이력 초안 생성", "CRM 저장용 정형 문구 생성"],
    ["5", "상담사 검토/수정", "상담사가 내용 보완"],
    ["6", "CRM / Tele-Pro 저장", "최종 접촉이력 등록"],
  ]

  const activeIndex = isSaved ? steps.length - 1 : isRequested ? 5 : 1

  return (
    <div className="rounded-2xl border border-[#d5e6f7] bg-gradient-to-r from-[#f7fbff] to-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-[#10233f]">접촉이력 등록 Agent 서비스 Flow</div>
          <div className="text-xs text-muted-foreground">
            상담 상태 메모리에서 접촉유형 분류, 처리계 정보 결합, CRM 저장까지 이어지는 흐름입니다.
          </div>
        </div>
        <Badge variant="outline" className="border-[#bad6f4] bg-white text-[#0b4f91]">
          Summary Memory 기반
        </Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        {steps.map(([step, title, description], index) => {
          const isActive = index <= activeIndex
          return (
            <div
              key={`${step}-${title}`}
              className={cn(
                "relative rounded-2xl border p-4 text-sm",
                isActive ? "border-[#8fb4df] bg-white shadow-sm" : "border-slate-200 bg-slate-50 text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "mb-3 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold",
                  isActive ? "bg-[#005bac] text-white" : "bg-slate-200 text-slate-500",
                )}
              >
                {step}
              </div>
              <div className="font-semibold text-[#10233f]">{title}</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HistoryTypePriorityCard({
  item,
  active = false,
  compact = false,
}: {
  item: (typeof contactTypePriorityRows)[number]
  active?: boolean
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        active ? "border-[#005bac] bg-[#f2f8ff]" : "bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              active ? "bg-[#005bac] text-white" : "bg-slate-100 text-slate-600",
            )}
          >
            {item.rank}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#10233f]">{item.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">상담 비중 {item.weight} · 중요도 {item.importance}</div>
          </div>
        </div>
        {active ? <Badge className="bg-[#005bac] text-white hover:bg-[#005bac]">우선 등록</Badge> : null}
      </div>
      <div className={cn("mt-4 grid gap-2", compact ? "grid-cols-1" : "grid-cols-1")}>
        {[
          ["대분류", item.major],
          ["중분류", item.middle],
          ["소분류", item.minor],
        ].map(([label, value]) => (
          <div key={`${item.rank}-${label}`} className="rounded-lg border bg-white/80 px-3 py-2">
            <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
            <div className="mt-0.5 text-sm font-semibold text-[#10233f]">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomerPanel() {
  return (
    <div className="space-y-5">
      <Card className="py-0">
        <CardHeader className="border-b bg-white px-6 py-5">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-[#005bac]" />
            고객 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6 text-sm">
          {[
            ["고객명", "김민준"],
            ["고객번호", "C-10294857"],
            ["본인확인", "완료"],
            ["상담채널", "콜센터 인바운드"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border bg-[#fbfdff] px-4 py-3">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardHeader className="border-b bg-white px-6 py-5">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-[#005bac]" />
            계약/상품 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6 text-sm">
          <div className="rounded-xl border border-[#c7ddf4] bg-[#f2f8ff] p-5">
            <div className="text-xs text-muted-foreground">주요 계약</div>
            <div className="mt-1 font-bold text-[#10233f]">제논라이프 실손의료비 보장</div>
            <div className="mt-2 text-xs leading-5 text-muted-foreground">
              계약번호: SL-2048-5521<br />
              청구상태: 추가 서류 요청
            </div>
          </div>
          <div className="rounded-xl border p-5">
            <div className="text-xs text-muted-foreground">최근 이력</div>
            <ul className="mt-2 space-y-2 text-xs leading-5">
              <li>2026.05.10 보험금 청구 접수</li>
              <li>2026.05.12 진료비 세부내역서 보완 요청</li>
              <li>2026.05.14 고객 전화 문의</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TranscriptBubble({ item }: { item: TranscriptItem }) {
  const isAgent = item.speaker === "agent"

  return (
    <div className={cn("flex min-w-0", isAgent ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[86%] min-w-0", isAgent ? "text-right" : "text-left")}>
        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
          {!isAgent ? <UserRound className="h-3.5 w-3.5" /> : null}
          <span>{isAgent ? "상담사" : "고객"}</span>
          <span>{item.time}</span>
          {isAgent ? <Headphones className="h-3.5 w-3.5" /> : null}
        </div>
        <div
          className={cn(
            "break-keep rounded-2xl px-5 py-4 text-sm leading-7 shadow-sm",
            isAgent
              ? "rounded-tr-sm bg-[#005bac] text-white"
              : "rounded-tl-sm border bg-white text-[#10233f]",
          )}
        >
          {item.text}
        </div>
      </div>
    </div>
  )
}

function RealtimeInsightPanel({
  visibleTranscript,
  isCompleted,
  onContactHistory,
  isHistorySaved,
}: {
  visibleTranscript: TranscriptItem[]
  isCompleted: boolean
  onContactHistory: () => void
  isHistorySaved: boolean
}) {
  const shownKeywords = keywordCandidates.slice(0, Math.min(5, Math.max(2, visibleTranscript.length - 1)))

  return (
    <div className="space-y-5">
      <Card className="py-0">
        <CardHeader className="border-b bg-white px-6 py-5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-[#005bac]" />
            실시간 분석
          </CardTitle>
          <CardDescription>STT 발화를 기반으로 추출되는 중간 결과입니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Tag className="h-4 w-4 text-[#005bac]" />
              핵심 키워드
            </div>
            <div className="flex flex-wrap gap-2">
              {shownKeywords.map((keyword) => (
                <Badge key={keyword} variant="outline" className="border-[#bad6f4] bg-[#f2f8ff] text-[#0b4f91]">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <FileCheck2 className="h-4 w-4 text-[#005bac]" />
              관련 상품/업무
            </div>
            <div className="space-y-2">
              {productCandidates.map((product, index) => (
                <div key={product} className="rounded-xl border bg-white px-4 py-4 text-sm">
                  <div className="font-semibold">{product}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    매칭 신뢰도 {index === 0 ? "높음" : "보통"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#c7ddf4] bg-[#f2f8ff] p-5 text-sm leading-6">
            <div className="mb-2 flex items-center gap-2 font-semibold text-[#0b4f91]">
              <Clock3 className="h-4 w-4" />
              다음 안내 후보
            </div>
            진료비 세부내역서 발급처, 모바일 추가서류 제출 경로, 예상 심사 기간을 안내해야 합니다.
          </div>

          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={onContactHistory}>
              <ClipboardList className="mr-2 h-4 w-4" />
              {isHistorySaved ? "접촉이력 보기" : "접촉이력 등록"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryReview({
  phase,
  overallSummary,
  smsDraft,
  agentSummary,
  customerSummary,
  memo,
  setOverallSummary,
  setSmsDraft,
  setAgentSummary,
  setCustomerSummary,
  setMemo,
  onBack,
  onApprove,
}: {
  phase: Phase
  overallSummary: string
  smsDraft: string
  agentSummary: string
  customerSummary: string
  memo: string
  setOverallSummary: (value: string) => void
  setSmsDraft: (value: string) => void
  setAgentSummary: (value: string) => void
  setCustomerSummary: (value: string) => void
  setMemo: (value: string) => void
  onBack: () => void
  onApprove: () => void
}) {
  return (
    <div className="min-w-0 space-y-5 p-6">
      <Card className="min-w-0 overflow-hidden py-0">
        <CardHeader className="border-b bg-white px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#005bac]" />
                상담 요약 검토
              </CardTitle>
              <CardDescription>기존 상담 요약을 확인하면서 고객에게 발송할 SMS 초안도 함께 검토합니다.</CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "border-[#bad6f4] bg-[#f2f8ff] text-[#0b4f91]",
                phase === "approved" && "border-emerald-200 bg-emerald-50 text-emerald-700",
              )}
            >
              {phase === "approved" ? "전송 완료" : "전송 대기"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <SummaryTextarea
            title="상담 요약"
            description="상담원이 최종 확인하는 대표 요약 문구"
            value={overallSummary}
            onChange={setOverallSummary}
            minHeight="min-h-[120px]"
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <SummaryTextarea
              title="상담원 안내 요약"
              description="상담사가 고객에게 안내한 내용"
              value={agentSummary}
              onChange={setAgentSummary}
            />
            <SummaryTextarea
              title="고객 문의 요약"
              description="고객 문의와 확인 요청 사항"
              value={customerSummary}
              onChange={setCustomerSummary}
            />
          </div>

          <SummaryTextarea
            title="SMS 전송 초안"
            description="고객에게 전송될 안내 문구입니다. 상담원이 수정 후 전송합니다."
            value={smsDraft}
            onChange={setSmsDraft}
            minHeight="min-h-[180px]"
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-[#fbfdff] p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold text-[#10233f]">
                <Tag className="h-4 w-4 text-[#005bac]" />
                핵심 키워드
              </div>
              <div className="flex flex-wrap gap-2">
                {keywordCandidates.map((keyword) => (
                  <Badge key={keyword} className="bg-[#005bac] text-white hover:bg-[#005bac]">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-[#fbfdff] p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold text-[#10233f]">
                <FileCheck2 className="h-4 w-4 text-[#005bac]" />
                관련 상품/업무
              </div>
              <div className="space-y-2">
                {productCandidates.slice(0, 2).map((product) => (
                  <div key={product} className="rounded-lg border bg-white px-3 py-2 text-sm">
                    {product}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SummaryTextarea
            title="후속 처리 메모"
            description="접촉이력 등록 또는 후처리 담당자에게 전달할 메모"
            value={memo}
            onChange={setMemo}
            minHeight="min-h-[90px]"
          />

          {phase === "approved" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
              SMS 전송이 완료되었습니다. 수정된 안내 문구가 고객에게 발송되었습니다.
            </div>
          ) : null}

          <div className="flex flex-col gap-2 border-t pt-5 sm:flex-row sm:justify-end">
            <Button variant="outline" className="sm:min-w-[140px]" onClick={onBack}>
              닫기
            </Button>
            <Button className="bg-[#005bac] hover:bg-[#084780] sm:min-w-[180px]" onClick={onApprove}>
              <MessageCircle className="mr-2 h-4 w-4" />
              SMS 전송
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryTextarea({
  title,
  description,
  value,
  onChange,
  minHeight = "min-h-[160px]",
}: {
  title: string
  description: string
  value: string
  onChange: (value: string) => void
  minHeight?: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="mb-3">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} className={minHeight} />
    </div>
  )
}

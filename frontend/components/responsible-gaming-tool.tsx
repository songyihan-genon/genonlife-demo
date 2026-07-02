"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Check, Copy, Loader2, PanelRightClose, PanelRightOpen, RotateCcw, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

type TemplateKey = "poster" | "counsel"

type ResponsibleGamingForm = {
  audienceGroup: string
  deliveryChannel: string
  tone: string
  campaignTitle: string
  supportContact: string
  note: string
}

type HistoryItem = {
  id: string
  timestamp: number
  template: TemplateKey
  title: string
  form: ResponsibleGamingForm
  output: string
}

const HISTORY_KEY = "responsible_gaming_history_v3"
const POSTER_IMAGE_SRC = "/responsible-gaming-poster.png"

const templates = [
  {
    key: "poster" as const,
    title: "중독 위험 고객 대상 메시지",
    description: "이용 주의사항과 보호 안내를 전달하는 캠페인형 메시지",
  },
  {
    key: "counsel" as const,
    title: "상담 연계 메시지",
    description: "고객 보호와 상담 연결을 중심으로 한 안내 문안",
  },
]

const AUDIENCE_OPTIONS = [
  "장시간 이용 고객",
  "현장 방문 고객",
  "보호 프로그램 안내 대상",
  "재방문 자제가 필요한 고객",
]

const DELIVERY_OPTIONS = ["현장 포스터", "문자", "카카오 알림톡"]

const TONE_OPTIONS = ["강한 경고", "차분한 안내", "보호 중심 안내"]

const CONTACT_OPTIONS = [
  "고객보호센터 1588-7789",
  "현장 고객보호센터",
  "24시간 도움전화 1336",
]

const INITIAL_FORM: ResponsibleGamingForm = {
  audienceGroup: "장시간 이용 고객",
  deliveryChannel: "현장 포스터",
  tone: "강한 경고",
  campaignTitle: "",
  supportContact: "고객보호센터 1588-7789",
  note: "",
}

const DEMO_HISTORY: Array<{ template: TemplateKey; form: ResponsibleGamingForm }> = [
  {
    template: "poster",
    form: {
      audienceGroup: "장시간 이용 고객",
      deliveryChannel: "현장 포스터",
      tone: "강한 경고",
      campaignTitle: "이용 시 주의사항 권고 알림",
      supportContact: "고객보호센터 1588-7789",
      note: "휴식 유도 문구와 상담 연결 문장을 함께 강조",
    },
  },
  {
    template: "counsel",
    form: {
      audienceGroup: "보호 프로그램 안내 대상",
      deliveryChannel: "문자",
      tone: "보호 중심 안내",
      campaignTitle: "상담 연계 안내",
      supportContact: "현장 고객보호센터",
      note: "고객이 부담을 느끼지 않도록 차분한 표현 사용",
    },
  },
]

function buildHistoryTitle(template: TemplateKey, form: ResponsibleGamingForm) {
  const prefix = template === "poster" ? "이용 주의 안내" : "상담 연계"
  return `${prefix} · ${form.audienceGroup}`
}

function buildResponsibleGamingMessage(template: TemplateKey, form: ResponsibleGamingForm) {
  const title = form.campaignTitle.trim() || (template === "poster" ? "이용 시 주의사항 권고 알림" : "상담 연계 안내")

  if (template === "poster") {
    const headline =
      form.tone === "강한 경고"
        ? "몰입이 길어질수록 일상은 더 멀어집니다."
        : form.tone === "차분한 안내"
          ? "지금의 이용 패턴을 잠시 돌아볼 시간입니다."
          : "지금 멈추고 보호 안내를 확인해보세요."

    return [
      `[${title}]`,
      "",
      headline,
      "",
      `대상: ${form.audienceGroup}`,
      `노출 채널: ${form.deliveryChannel}`,
      "",
      "권장 행동",
      "- 즉시 이용을 멈추고 충분한 휴식 시간을 확보하세요.",
      "- 혼자 해결하려 하지 말고 현장 보호 안내 또는 전문 상담을 이용하세요.",
      "- 필요 시 가족 또는 보호자와 현재 상황을 함께 공유하세요.",
      form.note.trim() ? `- 현장 반영 메모: ${form.note.trim()}` : undefined,
      "",
      `상담 및 보호 안내: ${form.supportContact}`,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n")
  }

  return [
    "[상담 연계 메시지]",
    "",
    `안녕하세요. 고객보호 안내입니다.`,
    `${form.audienceGroup} 고객님의 최근 이용 패턴을 고려해 보호 안내를 드립니다.`,
    "",
    "안내 내용",
    "- 무리한 추가 이용보다는 충분한 휴식과 이용 중단을 권장드립니다.",
    "- 전문 상담사를 통한 현재 상태 점검과 보호 프로그램 안내가 가능합니다.",
    "- 필요 시 가족 상담 또는 외부 전문기관 연계도 지원받을 수 있습니다.",
    form.note.trim() ? `- 추가 안내: ${form.note.trim()}` : undefined,
    "",
    `발송 채널: ${form.deliveryChannel}`,
    `상담 연결: ${form.supportContact}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n")
}

function getPosterPreviewCopy(form: ResponsibleGamingForm) {
  const accentWord =
    form.audienceGroup === "보호 프로그램 안내 대상"
      ? "도움이 필요한 신호"
      : form.audienceGroup === "재방문 자제가 필요한 고객"
        ? "멈추지 않는 몰입"
        : "멀어지는 일상"

  const lead =
    form.tone === "강한 경고"
      ? "지금의 선택이 평소의 일상을 흔들 수 있습니다."
      : form.tone === "차분한 안내"
        ? "잠시 멈추고 현재 이용 패턴을 돌아볼 시간입니다."
        : "지금 확인하는 보호 안내가 더 안전한 선택이 될 수 있습니다."

  return {
    eyebrow: "고객보호 안내",
    accentWord,
    lead,
    audience: form.audienceGroup,
    channel: form.deliveryChannel,
    contactPrimary: form.supportContact,
    contactSecondary: form.supportContact === "24시간 도움전화 1336" ? "고객보호센터 1588-7789" : "24시간 도움전화 1336",
  }
}

function getOutputPreviewText(output: string) {
  return output
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .slice(0, 3)
    .join(" ")
}

export function ResponsibleGamingTool() {
  const { toast } = useToast()
  const [template, setTemplate] = useState<TemplateKey>("poster")
  const [form, setForm] = useState<ResponsibleGamingForm>(INITIAL_FORM)
  const [output, setOutput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [history, setHistory] = useState<HistoryItem[]>([])

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
    } catch {}

    const seededHistory = DEMO_HISTORY.map((item, index) => ({
      id: `responsible-gaming-demo-${item.template}-${index}`,
      timestamp: Date.now() - index * 60 * 60 * 1000,
      template: item.template,
      title: buildHistoryTitle(item.template, item.form),
      form: item.form,
      output: buildResponsibleGamingMessage(item.template, item.form),
    }))

    setHistory(seededHistory)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch {}
  }, [history])

  const templateDescription = useMemo(
    () => templates.find((item) => item.key === template)?.description ?? "",
    [template],
  )
  const posterPreview = useMemo(() => getPosterPreviewCopy(form), [form])

  const updateField = (field: keyof ResponsibleGamingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const applyHistory = (item: HistoryItem) => {
    setTemplate(item.template)
    setForm({ ...INITIAL_FORM, ...item.form })
    setOutput(item.output)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 900))

      const content = buildResponsibleGamingMessage(template, form)
      setOutput(content)
      setHistory((prev) => [
        {
          id: `${Date.now()}`,
          timestamp: Date.now(),
          template,
          title: buildHistoryTitle(template, form),
          form: { ...form },
          output: content,
        },
        ...prev,
      ].slice(0, 30))
      toast({ description: "안내 메시지를 생성했습니다." })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyOutput = async () => {
    if (!output.trim()) return
    try {
      await navigator.clipboard.writeText(output)
      toast({ description: "메시지를 복사했습니다." })
    } catch {
      toast({ description: "복사 중 오류가 발생했습니다." })
    }
  }

  const resetRequest = () => {
    setForm(INITIAL_FORM)
    setOutput("")
    setTemplate("poster")
    toast({ description: "입력값을 초기화했습니다." })
  }

  return (
    <div className="h-full w-full overflow-auto bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            <h1 className="text-xl font-bold">고객보호 안내 메시지 생성</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory((value) => !value)}
            title={showHistory ? "히스토리 숨기기" : "히스토리 보이기"}
          >
            {showHistory ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>안내 유형</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((item) => {
                  const active = template === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => setTemplate(item.key)}
                      className={`w-full rounded-md border p-3 text-left transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {active ? <Check className="mt-0.5 h-4 w-4 text-[#005BAC]" /> : <span className="mt-1 inline-block h-4 w-4 rounded border" />}
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{item.description}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          <div className={showHistory ? "lg:col-span-6" : "lg:col-span-9"}>
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>고객보호 안내 제작</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                  {templateDescription}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-title">캠페인 또는 안내 제목</Label>
                    <Input
                      id="campaign-title"
                      value={form.campaignTitle}
                      onChange={(event) => updateField("campaignTitle", event.target.value)}
                      placeholder={template === "poster" ? "예: 이용 시 주의사항 권고 알림" : "예: 상담 연계 안내"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audience-group">대상 고객군</Label>
                    <Select value={form.audienceGroup} onValueChange={(value) => updateField("audienceGroup", value)}>
                      <SelectTrigger id="audience-group">
                        <SelectValue placeholder="대상 고객군 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {AUDIENCE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery-channel">발송/노출 채널</Label>
                    <Select value={form.deliveryChannel} onValueChange={(value) => updateField("deliveryChannel", value)}>
                      <SelectTrigger id="delivery-channel">
                        <SelectValue placeholder="채널 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tone">메시지 톤</Label>
                    <Select value={form.tone} onValueChange={(value) => updateField("tone", value)}>
                      <SelectTrigger id="tone">
                        <SelectValue placeholder="톤 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-contact">상담 연결 정보</Label>
                    <Select value={form.supportContact} onValueChange={(value) => updateField("supportContact", value)}>
                      <SelectTrigger id="support-contact">
                        <SelectValue placeholder="상담 채널 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="note">추가 안내 요청</Label>
                    <Textarea
                      id="note"
                      value={form.note}
                      onChange={(event) => updateField("note", event.target.value)}
                      className="min-h-[120px]"
                      placeholder="예: 상담 연결 문구를 마지막 줄에 넣고, 휴식 권고를 먼저 강조"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      "메시지 생성"
                    )}
                  </Button>
                  <Button variant="secondary" onClick={copyOutput} disabled={!output.trim()}>
                    <Copy className="mr-2 h-4 w-4" />
                    복사
                  </Button>
                  <Button variant="outline" onClick={resetRequest}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    새 요청
                  </Button>
                </div>

                <Separator />

                <Card className="border-dashed bg-muted/20 py-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">생성 결과 미리보기</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {template === "poster" ? (
                      <div className="space-y-4">
                        <div className="overflow-hidden rounded-[28px] border bg-slate-950 shadow-inner">
                          <div className="relative aspect-[4/7] w-full">
                            <Image
                              src={POSTER_IMAGE_SRC}
                              alt="고객보호 경고 포스터 예시"
                              fill
                              className="object-cover"
                              sizes="(max-width: 1024px) 100vw, 700px"
                              priority
                            />
                            <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-slate-950/72 via-slate-950/18 to-transparent p-6 text-white">
                              <p className="text-xs font-semibold tracking-[0.28em] text-white/80">{posterPreview.eyebrow}</p>
                              <div className="mt-3 max-w-md rounded-2xl bg-black/35 p-4 backdrop-blur-sm">
                                <div className="text-sm font-medium text-white/85">{posterPreview.audience}</div>
                                <div className="mt-1 text-2xl font-black leading-tight">{posterPreview.lead}</div>
                                <div className="mt-3 text-sm text-white/80">채널: {posterPreview.channel}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border bg-background p-6 whitespace-pre-wrap text-sm leading-7">
                          {output || "생성된 포스터 문안이 이 영역에 표시됩니다."}
                        </div>
                      </div>
                    ) : (
                      <div className="min-h-[280px] rounded-xl border bg-background p-6 whitespace-pre-wrap text-sm leading-7">
                        {output || "생성된 메시지가 이 영역에 표시됩니다."}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          {showHistory && (
            <div className="lg:col-span-3">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle>생성 히스토리</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">저장된 히스토리가 없습니다.</p>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="rounded-lg border p-3 transition-colors hover:bg-muted">
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString("ko-KR")}
                        </div>
                        <div className="mt-2 inline-flex rounded-full border border-border bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                          {item.template === "poster" ? "이용 주의 안내" : "상담 연계 메시지"}
                        </div>
                        {item.template === "poster" ? (
                          <div className="relative mt-3 aspect-[4/7] overflow-hidden rounded-lg border bg-slate-950">
                            <Image
                              src={POSTER_IMAGE_SRC}
                              alt="고객보호 포스터 히스토리 예시"
                              fill
                              className="object-cover"
                              sizes="220px"
                            />
                          </div>
                        ) : null}
                        <div className="mt-3 text-xs leading-5 text-muted-foreground">
                          {getOutputPreviewText(item.output)}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => applyHistory(item)}>
                            열기
                          </Button>
                          <Button
                            size="sm"
                            onClick={async () => {
                              await navigator.clipboard.writeText(item.output)
                              toast({ description: "메시지를 복사했습니다." })
                            }}
                          >
                            복사
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

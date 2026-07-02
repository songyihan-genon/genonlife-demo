"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Copy,
  Mail,
  History,
  RefreshCcw,
  Search,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  buildStaffAssignmentSession,
  getStaffAssignmentPreset,
  staffAssignmentHistoryPresets,
  staffAssignmentPromptSuggestions,
  type StaffAssignmentSession,
  type StaffAssignmentRequest,
} from "@/lib/staff-assignment-demo"

const HISTORY_STORAGE_KEY = "staff_assignment_demo_history_v1"

function readStoredHistory(): StaffAssignmentSession[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StaffAssignmentSession[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function persistHistory(history: StaffAssignmentSession[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 8)))
}

function createInitialDraft() {
  return {
    requestText: "",
    uploadedFileName: "",
    extraCondition: "",
  }
}

export function StaffAssignmentTool() {
  const searchParams = useSearchParams()
  const presetId = searchParams.get("preset")
  const view = searchParams.get("view")
  const { toast } = useToast()

  const [draft, setDraft] = useState<StaffAssignmentRequest>(createInitialDraft())
  const [activeSession, setActiveSession] = useState<StaffAssignmentSession | null>(null)
  const [historyItems, setHistoryItems] = useState<StaffAssignmentSession[]>([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const activePreset = useMemo(() => getStaffAssignmentPreset(presetId), [presetId])
  const criticalNotice = useMemo(
    () =>
      activeSession?.result.notices.find(
        (item) => item.includes("불일치") || item.includes("업데이트가 필요"),
      ) ?? null,
    [activeSession],
  )

  useEffect(() => {
    setHistoryItems(readStoredHistory())
  }, [])

  useEffect(() => {
    if (view === "new") {
      setActiveSession(null)
      setDraft(createInitialDraft())
      return
    }

    if (!activePreset) return

    const session = buildStaffAssignmentSession(activePreset.request, activePreset.id)
    setActiveSession(session)
    setDraft(activePreset.request)
  }, [activePreset, view])

  const saveSession = (session: StaffAssignmentSession) => {
    setHistoryItems((prev) => {
      const next = [session, ...prev.filter((item) => item.id !== session.id)]
      persistHistory(next)
      return next.slice(0, 8)
    })
  }

  const handleGenerate = () => {
    if (!draft.requestText.trim() && !draft.uploadedFileName.trim()) {
      toast({
        title: "민원 또는 업무 내용을 입력해 주세요.",
        description: "본문을 붙여넣거나 예시 파일을 첨부한 뒤 배정을 실행할 수 있습니다.",
      })
      return
    }

    const session = buildStaffAssignmentSession(draft)
    setActiveSession(session)
    saveSession(session)
  }

  const handleDemoUpload = () => {
    setDraft((prev) => ({
      ...prev,
      uploadedFileName: prev.uploadedFileName || "민원접수_요약문서.pdf",
    }))
  }

  const handleReset = () => {
    setDraft(createInitialDraft())
    setActiveSession(null)
  }

  const handleOpenHistory = (session: StaffAssignmentSession) => {
    setActiveSession(session)
    setDraft(session.request)
    setIsHistoryOpen(false)
  }

  const handleCopyAssignment = async () => {
    if (!activeSession) return

    const text = [
      `[추천 부서] ${activeSession.result.recommendedDepartment.name} / ${activeSession.result.recommendedDepartment.team}`,
      `[추천 담당자] ${activeSession.result.recommendedOwner.name} ${activeSession.result.recommendedOwner.position}`,
      `[연락처] ${activeSession.result.recommendedOwner.phone}`,
      `[이메일] ${activeSession.result.recommendedOwner.email}`,
      `[배정 근거] ${activeSession.result.rationale.join(" / ")}`,
    ].join("\n")

    await navigator.clipboard.writeText(text)
    toast({
      title: "배정 결과를 복사했습니다.",
      description: "추천 부서와 담당자 정보를 바로 전달할 수 있습니다.",
    })
  }

  const handleOpenMail = () => {
    if (!activeSession) return
    const owner = activeSession.result.recommendedOwner
    const subject = encodeURIComponent(`[업무 배정] ${activeSession.title}`)
    const body = encodeURIComponent(
      [
        `${owner.name} ${owner.position}님,`,
        "",
        "아래 업무 건의 담당 검토를 요청드립니다.",
        "",
        `- 분류: ${activeSession.result.intentLabel}`,
        `- 요청 요약: ${activeSession.request.requestText}`,
        activeSession.request.extraCondition ? `- 추가 조건: ${activeSession.request.extraCondition}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    window.location.href = `mailto:${owner.email}?subject=${subject}&body=${body}`
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-6 py-8">
      {!activeSession ? (
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-[#005BAC]" />
              <span>업무 지원</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">업무담당자 배정</h1>
            <p className="text-sm text-muted-foreground">
              민원·업무 내용을 기준으로 적정 부서와 담당자를 추천하고, 배정 근거와 검증 결과를 함께 제공합니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              새 요청 시작
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(true)}>
              <History className="mr-2 h-4 w-4" />
              히스토리 보기
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-[#005BAC]" />
              <span>업무 지원</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">업무담당자 배정</h1>
            <p className="text-sm text-muted-foreground">
              민원·업무 내용을 기준으로 적정 부서와 담당자를 추천하고, 배정 근거와 검증 결과를 함께 제공합니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              새 요청 시작
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(true)}>
              <History className="mr-2 h-4 w-4" />
              히스토리 보기
            </Button>
          </div>
        </div>
      )}

      {!activeSession ? (
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <Card className="border-border/70">
            <CardHeader className="pb-4">
              <CardTitle>빠른 예시</CardTitle>
              <CardDescription>업무 특성에 맞는 예시 요청을 눌러 바로 배정 결과를 확인할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {staffAssignmentHistoryPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleOpenHistory(buildStaffAssignmentSession(preset.request, preset.id))}
                  className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
                >
                  <div className="text-sm font-semibold">{preset.title}</div>
                  <div className="mt-2 text-xs leading-6 text-muted-foreground">{preset.description}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="pb-4">
              <CardTitle>배정 요청 입력</CardTitle>
              <CardDescription>
                민원 또는 업무 내용을 붙여넣고, 필요하면 문서를 첨부한 뒤 담당자 배정을 실행하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>민원 또는 업무 내용</Label>
                <Textarea
                  value={draft.requestText}
                  onChange={(event) => setDraft((prev) => ({ ...prev, requestText: event.target.value }))}
                  placeholder="예: 개인회생 접수 후 보완 서류와 진행상황 문의가 들어왔습니다. 어느 부서와 담당자에게 배정하는 것이 적절한지 알려주세요."
                  className="min-h-[220px]"
                />
              </div>

              <div className="rounded-2xl border border-dashed border-[#005BAC]/50 bg-[#005BAC]/5 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" onClick={handleDemoUpload}>
                    <Upload className="mr-2 h-4 w-4" />
                    파일 업로드
                  </Button>
                  {draft.uploadedFileName ? <Badge variant="outline">{draft.uploadedFileName}</Badge> : null}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  데모에서는 버튼 클릭 시 예시 문서가 첨부된 상태로 처리합니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label>추가 조건</Label>
                <Textarea
                  value={draft.extraCondition}
                  onChange={(event) => setDraft((prev) => ({ ...prev, extraCondition: event.target.value }))}
                  placeholder="예: 재직 중이며 오늘 바로 응대 가능한 담당자를 우선 추천해줘."
                  className="min-h-[120px]"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {staffAssignmentPromptSuggestions.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, requestText: prompt }))}
                    className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm leading-6 transition-colors hover:bg-muted"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleGenerate} className="min-w-[180px]">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  배정 실행
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-6 lg:flex-row">
          {/* 왼쪽: 입력 요약 + 검증 결과 */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <Card className="flex flex-1 flex-col border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">입력 요약</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 overflow-y-auto text-sm">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="text-xs font-medium text-muted-foreground">요청 내용</div>
                  <div className="mt-2 leading-7">{activeSession.request.requestText}</div>
                  {activeSession.request.extraCondition ? (
                    <div className="mt-4 rounded-lg border border-[#005BAC]/30 bg-[#005BAC]/5 px-3 py-2">
                      <div className="text-xs font-medium text-[#C46A00]">추가 고려사항</div>
                      <p className="mt-1 leading-7">{activeSession.request.extraCondition}</p>
                    </div>
                  ) : null}
                </div>
                {activeSession.request.uploadedFileName ? (
                  <div className="rounded-xl border border-dashed border-[#005BAC]/50 bg-[#005BAC]/5 p-4">
                    <div className="text-xs font-medium text-muted-foreground">첨부 문서</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline">{activeSession.request.uploadedFileName}</Badge>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="flex flex-1 flex-col border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">검증 결과</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 overflow-y-auto">
                {activeSession.result.verification.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="leading-7">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 가운데: 추천 배정 결과 */}
          <div className="min-w-0 shrink-0 space-y-5 lg:w-[750px]">
            <Card className="border-border/70">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">추천 배정 결과</CardTitle>
                    <CardDescription className="mt-1">
                      {activeSession.result.intentLabel} 기준으로 추천 부서와 담당자를 정리했습니다.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyAssignment}>
                      <Copy className="mr-2 h-4 w-4" />
                      배정 결과 복사
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleOpenMail}>
                      <Mail className="mr-2 h-4 w-4" />
                      이메일 열기
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {criticalNotice ? (
                  <div className="rounded-2xl border border-sky-300 bg-sky-50 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                      <div>
                        <div className="text-sm font-semibold text-sky-900">배정 전 업데이트 필요</div>
                        <p className="mt-1 text-sm leading-7 text-sky-900">{criticalNotice}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="flex h-full flex-col rounded-2xl border border-[#005BAC]/40 bg-[#005BAC]/5 p-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#C46A00]">
                      <Building2 className="h-4 w-4" />
                      추천 부서
                    </div>
                    <div className="mt-3 text-2xl font-semibold">{activeSession.result.recommendedDepartment.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{activeSession.result.recommendedDepartment.team}</div>
                    <div className="mt-3">
                      <Badge>{activeSession.result.recommendedDepartment.confidenceLabel}</Badge>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {activeSession.result.recommendedDepartment.reason}
                    </p>
                  </div>

                  <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <UserRound className="h-4 w-4" />
                      1순위 담당자
                    </div>
                    <div className="mt-3 text-2xl font-semibold">{activeSession.result.recommendedOwner.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {activeSession.result.recommendedOwner.position} · {activeSession.result.recommendedOwner.department}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">점수 {activeSession.result.recommendedOwner.score.toFixed(2)}</Badge>
                      <Badge variant="outline">{activeSession.result.recommendedOwner.phone}</Badge>
                      <Badge variant="outline">{activeSession.result.recommendedOwner.email}</Badge>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {activeSession.result.recommendedOwner.summary}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="text-sm font-medium text-muted-foreground">추출 키워드</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeSession.result.keywordSummary.map((keyword) => (
                      <Badge key={keyword} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="text-sm font-medium text-muted-foreground">대체 후보</div>
                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    {activeSession.result.alternateOwners.map((owner) => (
                      <div key={`${owner.name}-${owner.phone}`} className="flex h-full flex-col rounded-xl border border-border bg-background p-4">
                        <div className="font-semibold">{owner.name}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {owner.position} · {owner.department}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">{owner.phone}</div>
                        <p className="mt-3 text-sm leading-6">{owner.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 배정 근거 + 데이터 유의사항 */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <Card className="flex flex-1 flex-col border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">배정 근거</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 overflow-y-auto">
                {activeSession.result.rationale.map((item) => (
                  <div key={item} className="rounded-xl border border-border bg-card p-4 text-sm leading-7">
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="flex flex-1 flex-col border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">데이터 유의사항</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 overflow-y-auto">
                {activeSession.result.notices.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl border border-[#005BAC]/30 bg-[#005BAC]/5 p-4 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#005BAC]" />
                    <span className="leading-7">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          </div>

          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs leading-6 text-muted-foreground">
            ※ AI가 민원 내용, 업무분장 데이터, 인사정보를 종합해 추천한 참고 결과이며 최종 배정 전 담당 부서 확인이 필요합니다.
          </div>
        </div>
      )}

      {isHistoryOpen ? (
        <div className="fixed inset-0 z-40 bg-black/25" onClick={() => setIsHistoryOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l bg-background shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="text-sm font-semibold">배정 히스토리</div>
                <div className="text-xs text-muted-foreground">최근 실행 결과와 예시 프리셋을 열 수 있습니다.</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6 px-5 py-5">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <History className="h-4 w-4" />
                  최근 실행
                </div>
                <div className="space-y-3">
                  {historyItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      아직 저장된 실행 이력이 없습니다.
                    </div>
                  ) : (
                    historyItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleOpenHistory(item)}
                        className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold">{item.title}</div>
                          <Badge variant="outline">{new Date(item.timestamp).toLocaleDateString("ko-KR")}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">{item.description}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Search className="h-4 w-4" />
                  예시 프리셋
                </div>
                <div className="space-y-3">
                  {staffAssignmentHistoryPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleOpenHistory(buildStaffAssignmentSession(preset.request, preset.id))}
                      className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
                    >
                      <div className="font-semibold">{preset.title}</div>
                      <div className="mt-2 text-sm text-muted-foreground">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

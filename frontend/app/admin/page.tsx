"use client"

import Link from "next/link"
import { Suspense, type ComponentType, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  Database,
  FileClock,
  Gauge,
  Headphones,
  LineChart,
  Loader2,
  MessageSquareWarning,
  PhoneCall,
  RefreshCw,
  Search,
  ServerCog,
  ShieldCheck,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Login } from "@/components/login"
import { useAuth } from "@/contexts/auth-context"

type HealthLevel = "정상" | "주의" | "점검 필요"
type AdminFeature =
  | "dashboard"
  | "ai-usage"
  | "log-management"
  | "counseling-monitoring"
  | "counseling-history"
  | "quality-monitoring"

function levelColor(level: HealthLevel) {
  switch (level) {
    case "정상":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "주의":
      return "bg-sky-100 text-sky-700 border-sky-200"
    case "점검 필요":
      return "bg-red-100 text-red-700 border-red-200"
  }
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string
  description: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Card className="py-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-1 pb-5">
        <div className="text-2xl font-semibold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

const serviceUsageRows = [
  { service: "실시간 고객상담", calls: 1842, users: 126, tokens: "3.8M", success: 94, model: "Qwen3.5" },
  { service: "단순 질의응답 챗봇", calls: 936, users: 88, tokens: "1.7M", success: 91, model: "Qwen3.5" },
  { service: "상담지식 에이전트", calls: 742, users: 63, tokens: "2.2M", success: 96, model: "Qwen3.5" },
  { service: "접촉이력 등록", calls: 681, users: 54, tokens: "1.3M", success: 92, model: "Qwen3.5" },
  { service: "문서분석 지원", calls: 318, users: 31, tokens: "2.9M", success: 89, model: "Qwen3.5" },
]

const apiPerformanceRows = [
  { api: "STT 수신 API", endpoint: "STT Gateway -> 상담 화면", calls: "8,214", response: "420ms", p95: "1.1초", error: "0.6%", retry: "0.3%" },
  { api: "후처리 등록 API", endpoint: "상담 화면 -> Tele-Pro", calls: "3,106", response: "510ms", p95: "1.4초", error: "0.9%", retry: "0.5%" },
  { api: "지식검색 API", endpoint: "상담 화면 -> 지식검색 서버", calls: "5,428", response: "760ms", p95: "1.9초", error: "1.2%", retry: "0.8%" },
  { api: "공통 채팅 API", endpoint: "포털 화면 -> Agent Gateway", calls: "9,733", response: "350ms", p95: "980ms", error: "0.4%", retry: "0.2%" },
]

const logCollectionRows = [
  { source: "STT 발화 로그", count: "58,420건", status: "정상", detail: "화자 분리, 수신 시각, 상담 ID 수집" },
  { source: "채팅/Agent 요청 로그", count: "32,481건", status: "정상", detail: "프롬프트, 응답시간, 사용 모델 기록" },
  { source: "상담 요약 로그", count: "4,812건", status: "정상", detail: "요약 요청, 수정 여부, 승인 여부 수집" },
  { source: "접촉이력 등록 로그", count: "3,106건", status: "주의", detail: "초안 생성, 수정률, Tele-Pro 저장 결과 수집" },
  { source: "사용자 피드백 로그", count: "1,284건", status: "정상", detail: "좋아요/싫어요, 개선 의견, 재생성 요청 수집" },
]

const responseStatusRows = [
  { type: "정상 응답", level: "정상", count: "31,842건", detail: "요청이 정상 처리되어 화면 또는 후처리 시스템으로 응답 완료" },
  { type: "응답 실패", level: "점검 필요", count: "14건", detail: "API 또는 외부 시스템에서 정상 응답을 반환하지 못한 로그" },
  { type: "재시도 처리", level: "주의", count: "11건", detail: "일시 실패 후 재시도 정책으로 정상 처리된 요청" },
  { type: "처리 지연", level: "주의", count: "9건", detail: "기준 응답시간을 초과했지만 최종 응답은 완료된 요청" },
]

const behaviorRows = [
  { metric: "요약하기 클릭률", value: 86, description: "상담 종료 후 요약 요청 비율" },
  { metric: "접촉이력 등록 사용률", value: 74, description: "상담 중/후 Tele-Pro 초안 생성 비율" },
  { metric: "AI 초안 수정률", value: 23, description: "상담사가 저장 전 수정한 비율" },
  { metric: "저장 전 이탈률", value: 6, description: "초안 생성 후 미저장 비율" },
]

const recentResponseLogs = [
  { time: "15:12:08", user: "김제나", service: "실시간 고객상담", requestId: "REQ-260519-1208", endpoint: "/api/consulting/stt-summary", status: "성공", duration: "1.4초", summary: "상담 STT 요약 생성 완료", detail: "상담사/고객 발화를 분리해 상담 요약과 핵심 키워드를 생성했습니다.", response: "요약 1건, 키워드 5건, 관련 상품 2건 반환" },
  { time: "15:13:41", user: "박준호", service: "접촉이력 등록", requestId: "REQ-260519-1341", endpoint: "/api/contact-history/draft", status: "성공", duration: "1.6초", summary: "접촉이력 초안 생성 및 Tele-Pro 저장 완료", detail: "상담 요약본과 계약 정보를 결합해 접촉유형과 처리 내용을 생성했습니다.", response: "접촉유형: 보험금 청구/서류 보완, 저장 결과: 완료" },
  { time: "15:14:22", user: "김하늘", service: "상담지식 에이전트", requestId: "REQ-260519-1422", endpoint: "/api/knowledge/search", status: "지연", duration: "3.8초", summary: "상담 기준 문서 검색 응답 지연", detail: "검색 대상 문서 수가 증가해 기준 응답시간을 초과했지만 최종 답변은 반환되었습니다.", response: "관련 문서 4건, 근거 조항 2건 반환" },
  { time: "15:16:03", user: "김제나", service: "실시간 고객상담", requestId: "REQ-260519-1603", endpoint: "/api/consulting/realtime-analysis", status: "재시도", duration: "2.1초", summary: "실시간 분석 요청 재시도 후 성공", detail: "초기 요청에서 일시 타임아웃이 발생했으나 자동 재시도 후 정상 처리되었습니다.", response: "고객 의도 후보 3건, 다음 안내 후보 1건 반환" },
  { time: "15:17:19", user: "최민재", service: "문서분석 지원", requestId: "REQ-260519-1719", endpoint: "/api/document/summary", status: "성공", duration: "2.4초", summary: "PDF 요약 결과 생성 완료", detail: "업로드 문서를 분석해 주요 항목과 검토 포인트를 생성했습니다.", response: "요약 문단 3개, 확인 필요 항목 4건 반환" },
]

const monitoringRows = [
  { day: "05.09", calls: 428, complaints: 19, stt: 392, escalated: 24 },
  { day: "05.10", calls: 512, complaints: 27, stt: 481, escalated: 31 },
  { day: "05.11", calls: 486, complaints: 22, stt: 463, escalated: 26 },
  { day: "05.12", calls: 544, complaints: 35, stt: 518, escalated: 38 },
  { day: "05.13", calls: 579, complaints: 41, stt: 553, escalated: 44 },
  { day: "05.14", calls: 603, complaints: 46, stt: 581, escalated: 49 },
  { day: "05.15", calls: 337, complaints: 21, stt: 322, escalated: 18 },
]

const categoryRows = [
  { type: "보험금 청구 서류 보완", count: 318, complaint: 24, avg: "04:12", trend: "+8%" },
  { type: "심사 진행상황 확인", count: 246, complaint: 19, avg: "03:38", trend: "+4%" },
  { type: "계약/상품 보장 문의", count: 184, complaint: 7, avg: "05:21", trend: "-2%" },
  { type: "앱/홈페이지 이용 문의", count: 142, complaint: 11, avg: "02:49", trend: "+6%" },
]

const customerHistoryDb = [
  {
    name: "김민준",
    customerId: "C-10294857",
    phone: "010-****-4857",
    total: 4,
    recentType: "보험금 청구 서류 보완",
    risk: "반복 보완 문의",
    histories: [
      { no: 4, date: "2026.05.14 15:14", channel: "콜센터", type: "보험금 청구 > 서류 보완", summary: "진료비 세부내역서 제출 경로와 심사 기간 문의", status: "접촉이력 저장 완료" },
      { no: 3, date: "2026.05.12 10:03", channel: "모바일", type: "보험금 청구 > 추가 서류 요청", summary: "세부내역서 미제출로 보완 요청 문자 발송", status: "자동 알림 발송" },
      { no: 2, date: "2026.05.10 09:32", channel: "앱", type: "보험금 청구 > 청구 접수", summary: "실손의료비 청구 접수", status: "심사 접수" },
      { no: 1, date: "2026.04.22 14:21", channel: "콜센터", type: "계약 문의 > 보장 범위", summary: "실손의료비 보장 범위 문의", status: "상담 완료" },
    ],
  },
  {
    name: "박서연",
    customerId: "C-20481733",
    phone: "010-****-1733",
    total: 2,
    recentType: "계약 변경 문의",
    risk: "일반",
    histories: [
      { no: 2, date: "2026.05.15 11:04", channel: "콜센터", type: "계약관리 > 주소 변경", summary: "주소지 변경 및 알림 수신 채널 변경 요청", status: "변경 완료" },
      { no: 1, date: "2026.04.30 16:12", channel: "챗봇", type: "상품 문의 > 납입", summary: "보험료 납입일 확인", status: "상담 완료" },
    ],
  },
]

function AdminNavigationCards() {
  const searchParams = useSearchParams()
  const activeFeature = searchParams.get("feature") || "dashboard"
  const cards = [
    {
      title: "운영 대시보드",
      href: "/admin",
      feature: "dashboard",
      icon: ServerCog,
    },
    {
      title: "AI활용 및 통계",
      href: "/admin?feature=ai-usage",
      feature: "ai-usage",
      icon: BarChart3,
    },
    {
      title: "로그 관리",
      href: "/admin?feature=log-management",
      feature: "log-management",
      icon: FileClock,
    },
    {
      title: "상담 모니터링",
      href: "/admin?feature=counseling-monitoring",
      feature: "counseling-monitoring",
      icon: Headphones,
    },
    {
      title: "상담이력관리",
      href: "/admin?feature=counseling-history",
      feature: "counseling-history",
      icon: Database,
    },
  ]

  return (
    <div className="rounded-2xl border border-[#c7ddf4] bg-white p-2 shadow-sm">
      <div className="flex flex-wrap gap-2">
      {cards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            activeFeature === card.feature
              ? "bg-[#005bac] text-white shadow-sm"
              : "text-[#31547d] hover:bg-[#edf6ff] hover:text-[#005bac]"
          }`}
        >
          <card.icon className="h-4 w-4" />
          <span>{card.title}</span>
        </Link>
      ))}
      </div>
    </div>
  )
}

function MetricMiniChart({
  series,
  tone,
  chart,
}: {
  series: number[]
  tone: string
  chart: string
}) {
  const toneClass: Record<string, string> = {
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    amber: "bg-amber-500",
    orange: "bg-orange-500",
    blue: "bg-[#005bac]",
  }
  const strokeClass: Record<string, string> = {
    emerald: "stroke-emerald-500",
    sky: "stroke-sky-500",
    amber: "stroke-amber-500",
    orange: "stroke-orange-500",
    blue: "stroke-[#005bac]",
  }
  const dotClass = toneClass[tone] || "bg-[#005bac]"
  const lineClass = strokeClass[tone] || "stroke-[#005bac]"
  const max = Math.max(...series)
  const min = Math.min(...series)
  const range = Math.max(max - min, 1)
  const points = series
    .map((value, index) => {
      const x = (index / Math.max(series.length - 1, 1)) * 100
      const y = 52 - ((value - min) / range) * 42
      return `${x},${y}`
    })
    .join(" ")

  if (chart === "line") {
    return (
      <div className="mt-5 rounded-xl bg-[#f4f8fc] px-3 py-3">
        <svg viewBox="0 0 100 56" className="h-16 w-full overflow-visible">
          <polyline points={points} fill="none" className={`${lineClass} stroke-[3]`} strokeLinecap="round" strokeLinejoin="round" />
          {series.map((value, index) => {
            const x = (index / Math.max(series.length - 1, 1)) * 100
            const y = 52 - ((value - min) / range) * 42
            return <circle key={`${value}-${index}`} cx={x} cy={y} r="2.6" className={`${dotClass} fill-current text-white`} />
          })}
        </svg>
      </div>
    )
  }

  return (
    <div className="mt-5 flex h-20 items-end gap-1.5 rounded-xl bg-[#f4f8fc] px-3 py-3">
      {series.map((value, index) => (
        <div key={`${value}-${index}`} className="flex-1 rounded-t bg-[#dceafb]">
          <div className={`${dotClass} rounded-t shadow-sm`} style={{ height: `${Math.max((value / max) * 100, 10)}%` }} />
        </div>
      ))}
    </div>
  )
}

function DashboardView() {
  const metricPanels = [
    { title: "API 평균 응답시간", value: "420", unit: "ms", status: "정상", trend: "-8%", href: "/admin?feature=ai-usage", tone: "emerald", chart: "line", series: [58, 54, 49, 55, 46, 41, 37] },
    { title: "API 에러율", value: "0.8", unit: "%", status: "정상", trend: "-0.2%p", href: "/admin?feature=ai-usage", tone: "sky", chart: "line", series: [22, 19, 25, 16, 14, 17, 11] },
    { title: "요약 처리시간", value: "1.6", unit: "초", status: "정상", trend: "목표 3초 이내", href: "/admin?feature=ai-usage", tone: "emerald", chart: "bar", series: [32, 36, 44, 48, 42, 51, 58] },
    { title: "요청 처리량", value: "46", unit: "req/min", status: "정상", trend: "+12%", href: "/admin?feature=ai-usage", tone: "blue", chart: "bar", series: [38, 44, 52, 48, 61, 72, 68] },
    { title: "실시간 로그 수집률", value: "99.4", unit: "%", status: "정상", trend: "+0.1%p", href: "/admin?feature=log-management", tone: "emerald", chart: "line", series: [90, 92, 91, 95, 96, 97, 98] },
    { title: "응답 실패 로그", value: "14", unit: "건", status: "주의", trend: "+2건", href: "/admin?feature=log-management", tone: "orange", chart: "bar", series: [6, 8, 5, 10, 9, 12, 14] },
    { title: "상담 처리율", value: "96.2", unit: "%", status: "정상", trend: "+1.4%p", href: "/admin?feature=counseling-monitoring", tone: "emerald", chart: "line", series: [82, 84, 87, 86, 90, 94, 96] },
    { title: "후처리 저장률", value: "92", unit: "%", status: "정상", trend: "+3%p", href: "/admin?feature=counseling-history", tone: "blue", chart: "bar", series: [64, 70, 72, 76, 81, 88, 92] },
  ]

  const liveRows = [
    { name: "STT 수신 API", metric: "128 streams", health: "정상", value: 82 },
    { name: "RAG Search API", metric: "760ms", health: "주의", value: 64 },
    { name: "Contact History API", metric: "0.9% error", health: "정상", value: 71 },
    { name: "Log Collector", metric: "99.4%", health: "정상", value: 96 },
  ]

  return (
    <div className="space-y-6">
      <AdminNavigationCards />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricPanels.map((panel) => (
          <Link key={panel.title} href={panel.href} className="group overflow-hidden rounded-xl border border-[#c7ddf4] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#7eb7ef] hover:shadow-lg">
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-[#0d1d31] to-[#173b67] px-4 py-3 text-white">
              <span className="text-sm font-bold tracking-tight text-white">{panel.title}</span>
              <Badge className={panel.status === "정상" ? "border-emerald-400 bg-emerald-500/20 text-emerald-100" : "border-amber-400 bg-amber-500/20 text-amber-100"} variant="outline">
                {panel.status}
              </Badge>
            </div>
            <div className="p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <span className="font-mono text-3xl font-bold tracking-tight text-[#10233f]">{panel.value}</span>
                  <span className="ml-1 text-sm font-semibold text-muted-foreground">{panel.unit}</span>
                </div>
                <span className={panel.trend.startsWith("+") ? "text-sm font-semibold text-orange-600" : "text-sm font-semibold text-emerald-600"}>
                  {panel.trend}
                </span>
              </div>
              <MetricMiniChart series={panel.series} tone={panel.tone} chart={panel.chart} />
              <div className="mt-3 text-xs font-semibold text-[#005bac] opacity-0 transition group-hover:opacity-100">
                상세 보기
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base">실시간 서비스 상태</CardTitle>
            <CardDescription>주요 컴포넌트의 상태값을 통합 관제 형태로 표시합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {liveRows.map((row) => (
              <div key={row.name} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[180px_1fr_110px] md:items-center">
                <div>
                  <div className="font-semibold text-[#10233f]">{row.name}</div>
                  <div className="text-xs text-muted-foreground">{row.metric}</div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#dceafb]">
                  <div className={row.health === "정상" ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-amber-500"} style={{ width: `${row.value}%` }} />
                </div>
                <Badge className={levelColor(row.health as HealthLevel)} variant="outline">{row.health}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base">응답 실패 요약</CardTitle>
            <CardDescription>정상 응답을 반환하지 못한 API 호출과 재시도 현황입니다.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "5xx 응답 실패", value: "7", color: "text-red-600" },
              { label: "Tele-Pro 저장 실패", value: "4", color: "text-amber-600" },
              { label: "STT 수신 실패", value: "3", color: "text-orange-600" },
              { label: "재시도 후 성공", value: "11", color: "text-sky-600" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border bg-[#fbfdff] p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                <div className={`mt-2 font-mono text-3xl font-bold ${item.color}`}>{item.value}</div>
              </div>
            ))}
            <Link href="/admin?feature=log-management" className="col-span-full rounded-xl border border-[#b8d7f4] bg-[#eef6ff] p-4 text-center text-sm font-semibold text-[#005bac] hover:bg-[#e1f0ff]">
              로그 관리 상세 보기
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AiUsageView() {
  return (
    <div className="space-y-6">
      <AdminNavigationCards />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="서비스 호출량" value="32,481건" description="최근 7일 전체 Agent 호출" icon={BrainCircuit} />
        <StatCard title="활성 사용자" value="418명" description="상담사/관리자 기준" icon={Users} />
        <StatCard title="API 평균 응답시간" value="420ms" description="상담지원 API 평균" icon={Activity} />
        <StatCard title="API 에러율" value="0.8%" description="최근 24시간 4xx/5xx 기준" icon={AlertTriangle} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)]">
        <Card className="border-[#b9d7f5] py-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge className="border-[#b9d7f5] bg-[#eef7ff] text-[#005bac]" variant="outline">AI 서비스</Badge>
              <CardTitle className="text-lg">서비스별 AI 활용 통계</CardTitle>
            </div>
            <CardDescription>상담 요약, 접촉이력, 상담지식 등 업무 Agent별 이용량을 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>서비스</TableHead>
                  <TableHead>호출 수</TableHead>
                  <TableHead>사용자</TableHead>
                  <TableHead>토큰</TableHead>
                  <TableHead>성공률</TableHead>
                  <TableHead>사용 모델</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceUsageRows.map((row) => (
                  <TableRow key={row.service}>
                    <TableCell className="font-medium">{row.service}</TableCell>
                    <TableCell>{row.calls.toLocaleString()}</TableCell>
                    <TableCell>{row.users}명</TableCell>
                    <TableCell>{row.tokens}</TableCell>
                    <TableCell>{row.success}%</TableCell>
                    <TableCell>{row.model}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-[#b9d7f5] py-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge className="border-[#d3e5f8] bg-[#f3f8ff] text-[#1b5f9e]" variant="outline">API 통신</Badge>
              <CardTitle className="text-lg">서비스 간 API 통신 지표</CardTitle>
            </div>
            <CardDescription>화면, STT, 지식검색, 후처리 시스템 간 호출 응답시간과 오류율을 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>API</TableHead>
                  <TableHead>통신 구간</TableHead>
                  <TableHead>호출</TableHead>
                  <TableHead>평균 응답</TableHead>
                  <TableHead>P95 응답</TableHead>
                  <TableHead>에러율</TableHead>
                  <TableHead>재시도율</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiPerformanceRows.map((row) => (
                  <TableRow key={row.endpoint}>
                    <TableCell className="font-medium">{row.api}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.endpoint}</TableCell>
                    <TableCell>{row.calls}</TableCell>
                    <TableCell>{row.response}</TableCell>
                    <TableCell>{row.p95}</TableCell>
                    <TableCell>{row.error}</TableCell>
                    <TableCell>{row.retry}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LogManagementView() {
  const [selectedLog, setSelectedLog] = useState<(typeof recentResponseLogs)[number] | null>(null)

  return (
    <div className="space-y-6">
      <AdminNavigationCards />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="전체 로그 수집" value="128,420건" description="실시간 이벤트/운영 로그" icon={FileClock} />
        <StatCard title="실시간 수집률" value="99.4%" description="정상 수집 파이프라인 기준" icon={Activity} />
        <StatCard title="응답 실패" value="14건" description="API 및 외부 시스템 응답 실패" icon={AlertTriangle} />
        <StatCard title="백업 보관" value="180일" description="일 단위 백업/보관 정책" icon={Database} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base">로그 수집 현황</CardTitle>
            <CardDescription>어플리케이션 실행 중 발생하는 주요 이벤트를 식별해 실시간 수집합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>로그 소스</TableHead>
                  <TableHead>수집 건수</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>수집 항목</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logCollectionRows.map((row) => (
                  <TableRow key={row.source}>
                    <TableCell className="font-medium">{row.source}</TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell>
                      <Badge className={row.status === "주의" ? "border-sky-200 bg-sky-100 text-sky-700" : "border-emerald-200 bg-emerald-100 text-emerald-700"} variant="outline">
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.detail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base">응답 상태 요약</CardTitle>
            <CardDescription>AI 서비스 응답 결과를 정상, 실패, 재시도, 지연 상태로 구분해 표시합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {responseStatusRows.map((row) => (
              <div key={row.type} className="rounded-xl border p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="font-semibold">{row.type}</div>
                  <Badge className={levelColor(row.level as HealthLevel)} variant="outline">{row.level}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{row.count} · {row.detail}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(360px,0.8fr)_minmax(0,1.2fr)]">
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base">사용자 행동 분석</CardTitle>
            <CardDescription>상담사가 AI 결과를 어떻게 활용하는지 행동 로그로 분석합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {behaviorRows.map((row) => (
              <div key={row.metric} className="rounded-xl border p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold">{row.metric}</span>
                  <span>{row.value}%</span>
                </div>
                <Progress value={row.value} className="h-2" />
                <div className="mt-2 text-xs text-muted-foreground">{row.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">최근 응답 로그</CardTitle>
              <CardDescription>AI 서비스 요청별 응답 상태를 클릭해 상세 내용을 확인할 수 있습니다.</CardDescription>
            </div>
            <Button variant="outline" size="sm">로그 백업 설정</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시간</TableHead>
                  <TableHead>사용자</TableHead>
                  <TableHead>서비스</TableHead>
                  <TableHead>요청 ID</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>응답시간</TableHead>
                  <TableHead>상세</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentResponseLogs.map((row) => (
                  <TableRow
                    key={row.requestId}
                    className="cursor-pointer hover:bg-[#f3f8ff]"
                    onClick={() => setSelectedLog(row)}
                  >
                    <TableCell>{row.time}</TableCell>
                    <TableCell>{row.user}</TableCell>
                    <TableCell className="font-medium">{row.service}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.requestId}</TableCell>
                    <TableCell>
                      <Badge className={row.status === "성공" ? levelColor("정상") : levelColor("주의")} variant="outline">
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.duration}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(event) => {
                        event.stopPropagation()
                        setSelectedLog(row)
                      }}>
                        보기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base">로그 백업 및 보관 정책</CardTitle>
          <CardDescription>수집 로그의 보관 주기, 백업 상태, 검토 주기를 운영 정책으로 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border bg-[#f7fbff] p-4 text-sm leading-6"><b>보관 정책</b><br />원본 로그 180일, 요약 통계 3년 보관</div>
          <div className="rounded-xl border bg-[#f7fbff] p-4 text-sm leading-6"><b>백업 주기</b><br />일 1회 증분 백업, 주 1회 무결성 점검</div>
          <div className="rounded-xl border bg-[#f7fbff] p-4 text-sm leading-6"><b>운영 검토</b><br />응답 실패 로그는 실시간 확인, 관리 로그는 주기적 검토</div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>응답 로그 상세</DialogTitle>
            <DialogDescription>AI 서비스 요청과 응답 결과를 운영 검토용으로 확인합니다.</DialogDescription>
          </DialogHeader>
          {selectedLog ? (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-xl border bg-[#f7fbff] p-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">요청 ID</div>
                  <div className="mt-1 font-mono text-sm">{selectedLog.requestId}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">Endpoint</div>
                  <div className="mt-1 font-mono text-sm">{selectedLog.endpoint}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">서비스 / 사용자</div>
                  <div className="mt-1 text-sm">{selectedLog.service} · {selectedLog.user}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">상태 / 응답시간</div>
                  <div className="mt-1 text-sm">{selectedLog.status} · {selectedLog.duration}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <div className="text-sm font-semibold text-[#10233f]">요청 요약</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedLog.summary}</p>
                  <p className="mt-3 text-sm leading-6">{selectedLog.detail}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-sm font-semibold text-[#10233f]">응답 결과</div>
                  <p className="mt-2 text-sm leading-6">{selectedLog.response}</p>
                  <div className="mt-4 rounded-lg bg-[#eef6ff] p-3 text-xs leading-5 text-[#1b5f9e]">
                    운영자는 이 상세 로그를 통해 응답 지연, 재시도, 저장 실패 여부를 후속 점검할 수 있습니다.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CounselingMonitoringView() {
  const [period, setPeriod] = useState("7일")
  const totalCalls = monitoringRows.reduce((sum, row) => sum + row.calls, 0)
  const totalComplaints = monitoringRows.reduce((sum, row) => sum + row.complaints, 0)
  const maxCalls = Math.max(...monitoringRows.map((row) => row.calls))

  return (
    <div className="space-y-6">
      <AdminNavigationCards />
      <Card className="py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">기간 선택</CardTitle>
            <CardDescription>선택한 기간 기준으로 상담 유입과 민원 탐지 현황을 확인합니다.</CardDescription>
          </div>
          <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-md border bg-white px-3 py-2 text-sm">
            <option>오늘</option>
            <option>7일</option>
            <option>30일</option>
            <option>분기</option>
          </select>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title={`${period} 콜 상담`} value={`${totalCalls.toLocaleString()}건`} description="인바운드 상담 접수 기준" icon={PhoneCall} />
        <StatCard title="민원 탐지" value={`${totalComplaints}건`} description="불만/민원 의도 자동 감지" icon={MessageSquareWarning} />
        <StatCard title="STT 처리 완료" value="3,310건" description="화자 분리 및 전사 완료" icon={Headphones} />
        <StatCard title="상급자 이관" value="230건" description="민원/고위험 상담 이관" icon={AlertTriangle} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base">일자별 상담/민원 추이</CardTitle>
            <CardDescription>콜 상담 유입과 민원 탐지 건수를 함께 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {monitoringRows.map((row) => (
              <div key={row.day} className="grid grid-cols-[56px_minmax(0,1fr)_92px] items-center gap-3 text-sm">
                <div className="font-medium">{row.day}</div>
                <div className="space-y-2">
                  <div className="h-3 overflow-hidden rounded-full bg-[#e8f3ff]">
                    <div className="h-full rounded-full bg-[#005bac]" style={{ width: `${(row.calls / maxCalls) * 100}%` }} />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-orange-50">
                    <div className="h-full rounded-full bg-orange-400" style={{ width: `${(row.complaints / 50) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">{row.calls}건 / 민원 {row.complaints}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base">상담 유형별 모니터링</CardTitle>
            <CardDescription>민원 탐지와 평균 상담 시간을 유형별로 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상담 유형</TableHead>
                  <TableHead>건수</TableHead>
                  <TableHead>민원</TableHead>
                  <TableHead>평균</TableHead>
                  <TableHead>추이</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryRows.map((row) => (
                  <TableRow key={row.type}>
                    <TableCell className="font-medium">{row.type}</TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell>{row.complaint}</TableCell>
                    <TableCell>{row.avg}</TableCell>
                    <TableCell>{row.trend}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CounselingHistoryView() {
  const [query, setQuery] = useState("김민준")
  const [selectedName, setSelectedName] = useState("김민준")
  const customer = customerHistoryDb.find((item) => item.name === selectedName) || customerHistoryDb[0]

  return (
    <div className="space-y-6">
      <AdminNavigationCards />
      <Card className="py-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-[#005bac]" />
            고객 상담이력 DB 검색
          </CardTitle>
          <CardDescription>고객명을 검색하면 고객별 상담 횟수, 과거 상담유형, 접촉이력을 조회합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="고객명 입력 예: 김민준"
              className="min-w-[260px] flex-1 rounded-md border bg-white px-3 py-2 text-sm"
            />
            <Button
              className="bg-[#005bac] hover:bg-[#084780]"
              onClick={() => {
                const matched = customerHistoryDb.find((item) => item.name.includes(query.trim()))
                if (matched) setSelectedName(matched.name)
              }}
            >
              DB 검색
            </Button>
            {customerHistoryDb.map((item) => (
              <Button key={item.name} variant="outline" onClick={() => { setQuery(item.name); setSelectedName(item.name) }}>
                {item.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="고객명" value={customer.name} description={customer.customerId} icon={Users} />
        <StatCard title="누적 상담" value={`${customer.total}회`} description="최근 12개월 기준" icon={Headphones} />
        <StatCard title="최근 상담유형" value={customer.recentType} description="마지막 접촉이력 기준" icon={Database} />
        <StatCard title="관리 포인트" value={customer.risk} description={customer.phone} icon={ShieldCheck} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base">상담이력 목록</CardTitle>
            <CardDescription>몇 번째 상담인지와 과거 상담유형을 시간순으로 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>회차</TableHead>
                  <TableHead>일시</TableHead>
                  <TableHead>채널</TableHead>
                  <TableHead>상담유형</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.histories.map((row) => (
                  <TableRow key={`${customer.customerId}-${row.no}`}>
                    <TableCell>{row.no}회차</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.channel}</TableCell>
                    <TableCell className="font-medium">{row.type}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base">최근 상담 상세</CardTitle>
            <CardDescription>DB 검색 결과에서 선택된 고객의 최근 상담 요약입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.histories.slice(0, 3).map((row) => (
              <div key={row.no} className="rounded-xl border bg-[#fbfdff] p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant="outline">{row.no}회차</Badge>
                  <span className="text-xs text-muted-foreground">{row.date}</span>
                </div>
                <div className="font-semibold text-[#10233f]">{row.type}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{row.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QualityMonitoringView({ seed }: { seed: number }) {
  const rand = (n: number) => {
    const x = Math.sin(seed * (n + 1)) * 10000
    return x - Math.floor(x)
  }
  const rows = [
    { service: "실시간 고객상담", accuracy: "94%", hallucination: "1.8%", latency: "1.9초", feedback: "89%", level: "정상" as HealthLevel },
    { service: "상담지식 에이전트", accuracy: "96%", hallucination: "1.2%", latency: "2.3초", feedback: "91%", level: "정상" as HealthLevel },
    { service: "접촉이력 등록", accuracy: "92%", hallucination: "1.5%", latency: "1.6초", feedback: "87%", level: rand(1) > 0.7 ? "주의" as HealthLevel : "정상" as HealthLevel },
    { service: "업무담당자 배정", accuracy: "88%", hallucination: "1.9%", latency: "2.1초", feedback: "84%", level: "주의" as HealthLevel },
  ]

  return (
    <div className="space-y-6">
      <AdminNavigationCards />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="답변 정확도" value="94%" description="최근 7일 운영 검수 기준" icon={ShieldCheck} />
        <StatCard title="환각률" value="1.6%" description="근거 없는 응답으로 분류된 비율" icon={AlertTriangle} />
        <StatCard title="긍정 피드백" value="89%" description="좋아요·만족 응답 비중" icon={BrainCircuit} />
        <StatCard title="평균 응답시간" value="2.1초" description="서비스 전체 평균 응답 지연" icon={Activity} />
      </div>
      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base">서비스별 품질 현황</CardTitle>
          <CardDescription>운영 중인 핵심 서비스의 품질 지표를 비교합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>서비스</TableHead>
                <TableHead>정확도</TableHead>
                <TableHead>환각률</TableHead>
                <TableHead>응답시간</TableHead>
                <TableHead>만족도</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.service}>
                  <TableCell className="font-medium">{row.service}</TableCell>
                  <TableCell>{row.accuracy}</TableCell>
                  <TableCell>{row.hallucination}</TableCell>
                  <TableCell>{row.latency}</TableCell>
                  <TableCell>{row.feedback}</TableCell>
                  <TableCell><Badge className={levelColor(row.level)} variant="outline">{row.level}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminPageContent() {
  const { isAuthenticated, isLoading } = useAuth()
  const searchParams = useSearchParams()
  const [seed, setSeed] = useState(1)
  const feature = (searchParams.get("feature") || "dashboard") as AdminFeature

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  const titles: Record<AdminFeature, { title: string; description: string; icon: ComponentType<{ className?: string }> }> = {
    dashboard: { title: "AI 운영 대시보드", description: "AI 상담지원 Agent 운영 현황과 주요 관리 화면으로 이동합니다.", icon: ServerCog },
    "ai-usage": { title: "AI활용 및 통계", description: "AI 서비스 이용 현황과 서비스 간 API 통신 지표를 분리해 확인합니다.", icon: BarChart3 },
    "log-management": { title: "로그 관리", description: "실시간 로그 수집, 응답 실패 로그, 행동 로그 분석, 백업/보관 정책을 관리합니다.", icon: FileClock },
    "counseling-monitoring": { title: "상담 모니터링", description: "기간별 콜 상담 건수, 민원 탐지 건수, 상담 유형별 추이를 확인합니다.", icon: Headphones },
    "counseling-history": { title: "상담이력관리", description: "고객명 기반 DB 검색으로 과거 상담이력과 상담유형을 조회합니다.", icon: Database },
    "quality-monitoring": { title: "품질 모니터링", description: "답변 품질, 환각률, 만족도, 재생성 요청 비율을 점검합니다.", icon: ShieldCheck },
  }

  const current = titles[feature] || titles.dashboard
  const HeaderIcon = current.icon

  return (
    <div className="h-full overflow-auto bg-[#f7f9fc] p-6">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-[#005bac]">
            <HeaderIcon className="h-4 w-4" />
            <span>AI 운영 관리</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#10233f]">{current.title}</h1>
          <p className="text-sm text-muted-foreground">{current.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white">
            <CalendarDays className="mr-1 h-3.5 w-3.5" />
            2026.05.15 15:00 기준
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setSeed((value) => value + 1)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-7xl">
        {feature === "ai-usage" ? <AiUsageView /> : null}
        {feature === "log-management" ? <LogManagementView /> : null}
        {feature === "counseling-monitoring" ? <CounselingMonitoringView /> : null}
        {feature === "counseling-history" ? <CounselingHistoryView /> : null}
        {feature === "quality-monitoring" ? <QualityMonitoringView seed={seed} /> : null}
        {feature === "dashboard" || !titles[feature] ? <DashboardView /> : null}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">운영 관리 화면을 불러오는 중입니다.</div>}>
      <AdminPageContent />
    </Suspense>
  )
}

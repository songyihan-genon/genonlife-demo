"use client"

import { Suspense, useState, useRef, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, Bell, TrendingUp, TrendingDown, BarChart3, X, Settings, ChevronDown, ChevronUp, Globe, Clock, Play, Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import MarketSensingSettingsModal from "@/components/market-sensing-settings-modal"
import WordCloudCanvas from "@/components/word-cloud-canvas"
import InsightView from "@/components/insight-view"
import InsightList from "@/components/insight-list"
import { Insight } from "@/hooks/use-insight"
import { baseWordData } from "@/lib/mock/baseWordData"
import { sectorColors } from "@/lib/mock/sectorColors"
import { sampleChartData } from "@/lib/mock/sampleChartData"
import { mockSNSNews } from "@/lib/mock/mockSNSNews"
import { aiInsightReports } from "@/lib/mock/aiInsightReports"

// 업무 영역별 데이터 종류 정의
const sectorData = {
  "민원 상담": [
    {
      id: "counseling-volume",
      name: "상담 접수량",
      source: "상담시스템",
      enabled: false
    },
    {
      id: "counseling-completion-rate",
      name: "상담 완료율",
      source: "상담이력 DB",
      enabled: false
    },
    {
      id: "average-wait-time",
      name: "평균 응답 대기시간",
      source: "콜센터 로그",
      enabled: false
    }
  ],
  "채무조정/지원": [
    {
      id: "debt-adjustment-requests",
      name: "채무조정 신청 건수",
      source: "채무조정 시스템",
      enabled: false
    },
    {
      id: "microloan-linked-cases",
      name: "소액대출 연계 건수",
      source: "연계지원 DB",
      enabled: false
    },
    {
      id: "execution-rate",
      name: "지원안 실행률",
      source: "사후관리 지표",
      enabled: false
    }
  ],
  "민원/고객보호": [
    {
      id: "complaint-resolution-rate",
      name: "민원 해결률",
      source: "민원처리 시스템",
      enabled: false
    },
    {
      id: "repeat-inquiry-rate",
      name: "재문의율",
      source: "민원 재접수 로그",
      enabled: false
    },
    {
      id: "satisfaction-score",
      name: "상담 만족도",
      source: "만족도 설문",
      enabled: false
    }
  ],
  "기관/연계": [
    {
      id: "staff-search-count",
      name: "업무담당자 검색량",
      source: "인사정보 연동 로그",
      enabled: false
    },
    {
      id: "partner-search-count",
      name: "협약기관 조회량",
      source: "협약기관 DB",
      enabled: false
    },
    {
      id: "debt-transfer-inference-count",
      name: "채권양수도 추론 요청 수",
      source: "시범 추론 로그",
      enabled: false
    }
  ]
}


const getSampleData = (dataType: string) => {
  return sampleChartData[dataType] || sampleChartData["counseling-volume"];
}

const dashboardQueryScenarios = [
  {
    id: "counseling-load",
    question: "최근 민원 접수량과 상담 완료율 변화를 함께 분석해줘.",
    summaryTitle: "민원상담 운영 분석",
    summaryPoints: [
      "민원 접수량이 증가하는 구간에서도 상담 완료율은 비교적 안정적으로 유지되고 있습니다.",
      "다만 피크 구간에는 평균 응답 대기시간이 함께 확대되어 초기 안내 자동화 필요성이 확인됩니다.",
      "담당자 검색과 FAQ 연계를 함께 보면 후속 문의를 줄일 수 있는 구간을 더 빨리 찾을 수 있습니다.",
    ],
    metrics: ["상담 접수량", "상담 완료율", "평균 응답 대기시간"],
    exampleQuestion: "이 결과를 기준으로 우선 대응 포인트는 뭐야?",
    exampleAnswer:
      "피크 시간대 인력 배치와 FAQ 자동 응답을 우선 보강하고, 담당자 검색 연결을 함께 제공하면 초기 민원 소화 속도를 높일 수 있습니다.",
    selections: {
      "민원 상담-counseling-volume": true,
      "민원 상담-counseling-completion-rate": true,
      "민원 상담-average-wait-time": true,
      "민원/고객보호-complaint-resolution-rate": false,
      "기관/연계-staff-search-count": false,
    },
  },
  {
    id: "complaint-quality",
    question: "민원 해결률과 재문의율을 중심으로 상담 품질을 분석해줘.",
    summaryTitle: "민원 품질 및 고객보호 분석",
    summaryPoints: [
      "민원 해결률은 점진적으로 개선되고 있지만 일부 주제에서 재문의율이 남아 있습니다.",
      "상담 만족도와 재문의율을 함께 보면 표준 답변 문구의 보완 필요 구간을 파악할 수 있습니다.",
      "민원 처리 완료 이후 후속 안내가 부족한 구간이 고객보호 관점의 개선 포인트로 보입니다.",
    ],
    metrics: ["민원 해결률", "재문의율", "상담 만족도"],
    exampleQuestion: "품질 개선 관점에서는 어떤 액션이 먼저 필요할까?",
    exampleAnswer:
      "자주 반복되는 문의를 FAQ와 표준 스크립트로 먼저 정리하고, 처리 완료 후 후속 안내 문구를 통일하는 것이 재문의율 감소에 효과적입니다.",
    selections: {
      "민원/고객보호-complaint-resolution-rate": true,
      "민원/고객보호-repeat-inquiry-rate": true,
      "민원/고객보호-satisfaction-score": true,
      "민원 상담-counseling-volume": false,
      "기관/연계-staff-search-count": false,
    },
  },
  {
    id: "debt-transfer-tbd",
    question: "채권양수도 추론 관련 지표를 시범적으로 구성해줘.",
    summaryTitle: "채권양수도 추론(TBD)",
    summaryPoints: [
      "채권양수도 추론 기능은 아직 시범 단계이므로 정확도보다 요청 패턴과 조회 흐름을 먼저 보는 것이 적절합니다.",
      "업무담당자 검색량과 협약기관 조회량을 함께 보면 실제 실무 연결 지점을 파악할 수 있습니다.",
      "추론 결과의 정합성 검증 기준은 향후 데이터 정비 범위에 맞춰 단계적으로 고도화할 수 있습니다.",
    ],
    metrics: ["채권양수도 추론 요청 수", "협약기관 조회량", "업무담당자 검색량"],
    exampleQuestion: "이 기능은 지금 어떤 기준으로 시범 운영하는 게 좋을까?",
    exampleAnswer:
      "우선 요청량과 조회 패턴, 담당자 연결 빈도를 기준으로 로그를 축적하고, 이후 실제 양수도 이력 데이터가 정비되면 추론 정확도 지표를 단계적으로 추가하는 방식이 적절합니다.",
    selections: {
      "기관/연계-debt-transfer-inference-count": true,
      "기관/연계-partner-search-count": true,
      "기관/연계-staff-search-count": true,
      "민원 상담-counseling-volume": false,
      "채무조정/지원-debt-adjustment-requests": false,
    },
  },
]

function inferDashboardScenarioId(question: string) {
  const normalized = question.toLowerCase()

  if (normalized.includes("채권") || normalized.includes("양수도") || normalized.includes("협약기관") || normalized.includes("담당자")) return "debt-transfer-tbd"
  if (normalized.includes("민원") || normalized.includes("재문의") || normalized.includes("해결률") || normalized.includes("고객보호")) return "complaint-quality"
  return "counseling-load"
}

function buildEmptySectorSelections() {
  const emptySelections: { [key: string]: boolean } = {}

  Object.entries(sectorData).forEach(([sectorName, dataItems]) => {
    dataItems.forEach((dataItem) => {
      emptySelections[`${sectorName}-${dataItem.id}`] = false
    })
  })

  return emptySelections
}

function getMetricMeta(metricKey: string) {
  const separatorIndex = metricKey.indexOf("-")
  if (separatorIndex === -1) return null

  const sectorName = metricKey.slice(0, separatorIndex)
  const dataId = metricKey.slice(separatorIndex + 1)
  const items = sectorData[sectorName as keyof typeof sectorData] || []
  const dataItem = items.find((item) => item.id === dataId)

  if (!dataItem) return null

  return {
    key: metricKey,
    dataId,
    sectorName,
    label: dataItem.name,
    source: dataItem.source,
  }
}

function getMetricKeysForScenario(scenarioId: string) {
  const scenario = dashboardQueryScenarios.find((item) => item.id === scenarioId)
  if (!scenario) return []

  const keys: string[] = []
  scenario.metrics.forEach((metricLabel) => {
    Object.entries(sectorData).forEach(([sectorName, dataItems]) => {
      const matchedItem = dataItems.find((item) => item.name === metricLabel)
      if (matchedItem) {
        keys.push(`${sectorName}-${matchedItem.id}`)
      }
    })
  })

  return keys
}

function formatMetricValue(metricKey: string, value: number) {
  if (["counseling-volume", "debt-adjustment-requests", "microloan-linked-cases", "staff-search-count", "partner-search-count", "debt-transfer-inference-count"].includes(metricKey)) {
    return `${value.toLocaleString("ko-KR")}건`
  }
  if (metricKey === "average-wait-time") return `${value}초`
  return `${value}%`
}

function buildDashboardSummary(
  question: string,
  selectedMetrics: Array<{ key: string; dataId: string; label: string; sectorName: string; source: string }>,
) {
  const bullets: string[] = []
  const summaryTitle = question.trim() ? `질의 분석: ${question.trim()}` : "질의 분석 요약"

  selectedMetrics.forEach((metric) => {
    const series = sampleChartData[metric.dataId] || []
    if (series.length === 0) return

    const first = series[0]
    const last = series[series.length - 1]
    const peak = series.reduce((max, item) => (item.value > max.value ? item : max), series[0])

    if (metric.dataId === "counseling-volume") {
      bullets.push(`상담 접수량은 ${first.month} ${formatMetricValue(metric.dataId, first.value)}에서 ${peak.month} ${formatMetricValue(metric.dataId, peak.value)}까지 증가했고, ${last.month}에도 ${formatMetricValue(metric.dataId, last.value)} 수준을 유지하고 있습니다.`)
    } else if (metric.dataId === "counseling-completion-rate") {
      bullets.push(`상담 완료율은 ${first.month} ${formatMetricValue(metric.dataId, first.value)}에서 ${peak.month} ${formatMetricValue(metric.dataId, peak.value)}까지 완만하게 개선돼 기본 처리 품질은 안정적인 흐름을 보입니다.`)
    } else if (metric.dataId === "average-wait-time") {
      bullets.push(`평균 응답 대기시간은 ${first.month} ${formatMetricValue(metric.dataId, first.value)}에서 ${peak.month} ${formatMetricValue(metric.dataId, peak.value)}까지 확대돼 접수량이 몰리는 시점의 병목을 보여줍니다.`)
    } else if (metric.dataId === "debt-adjustment-requests") {
      bullets.push(`채무조정 신청 건수는 ${first.month} ${formatMetricValue(metric.dataId, first.value)}에서 ${peak.month} ${formatMetricValue(metric.dataId, peak.value)}까지 증가해 관련 설명과 후속 연결 수요가 함께 확대되는 흐름입니다.`)
    } else if (metric.dataId === "microloan-linked-cases") {
      bullets.push(`소액대출 연계 건수는 ${first.month} ${formatMetricValue(metric.dataId, first.value)}에서 ${peak.month} ${formatMetricValue(metric.dataId, peak.value)}까지 늘어나 부가 지원 서비스 안내 수요가 커지고 있습니다.`)
    } else if (metric.dataId === "complaint-resolution-rate") {
      bullets.push(`민원 해결률은 ${first.month} ${formatMetricValue(metric.dataId, first.value)}에서 ${peak.month} ${formatMetricValue(metric.dataId, peak.value)}까지 개선됐지만, 이후에도 후속 문의 관리가 필요한 수준으로 보입니다.`)
    } else if (metric.dataId === "repeat-inquiry-rate") {
      bullets.push(`재문의율은 ${peak.month} ${formatMetricValue(metric.dataId, peak.value)}를 기록한 뒤 최근 ${last.month} ${formatMetricValue(metric.dataId, last.value)} 수준으로 낮아졌지만 반복 주제는 계속 관리가 필요합니다.`)
    } else if (metric.dataId === "satisfaction-score") {
      bullets.push(`상담 만족도는 ${first.month} ${formatMetricValue(metric.dataId, first.value)}에서 ${peak.month} ${formatMetricValue(metric.dataId, peak.value)}까지 개선돼 응대 품질 전반은 안정화되고 있습니다.`)
    } else if (metric.dataId === "staff-search-count") {
      bullets.push(`업무담당자 검색량은 ${first.month} ${formatMetricValue(metric.dataId, first.value)}에서 ${peak.month} ${formatMetricValue(metric.dataId, peak.value)}까지 늘어 복수 부서 연결 문의가 증가하는 흐름을 보여줍니다.`)
    } else if (metric.dataId === "partner-search-count") {
      bullets.push(`협약기관 조회량은 ${first.month} ${formatMetricValue(metric.dataId, first.value)}에서 ${peak.month} ${formatMetricValue(metric.dataId, peak.value)}까지 증가해 외부 기관 정보 확인 수요가 높아지고 있습니다.`)
    } else if (metric.dataId === "debt-transfer-inference-count") {
      bullets.push(`채권양수도 추론 요청 수는 ${first.month} ${formatMetricValue(metric.dataId, first.value)}에서 ${peak.month} ${formatMetricValue(metric.dataId, peak.value)}까지 증가해 시범 기능 검토 수요가 누적되고 있습니다.`)
    }
  })

  const selectedMetricLabels = selectedMetrics.map((metric) => metric.label)

  if (selectedMetricLabels.includes("상담 접수량") && selectedMetricLabels.includes("평균 응답 대기시간")) {
    bullets.push("접수량이 증가하는 구간과 대기시간이 겹쳐 나타나므로 초기 안내 자동화와 피크 시간대 인력 배치가 핵심 대응 포인트로 보입니다.")
  }
  if (selectedMetricLabels.includes("민원 해결률") && selectedMetricLabels.includes("재문의율")) {
    bullets.push("민원 해결률이 개선돼도 재문의율이 남아 있다면 1차 안내 문구나 후속 안내 절차를 함께 손볼 필요가 있습니다.")
  }
  if (selectedMetricLabels.includes("채권양수도 추론 요청 수") && selectedMetricLabels.includes("협약기관 조회량")) {
    bullets.push("추론 요청과 기관 조회가 함께 증가하면 실제 실무에서는 데이터 정합성보다 먼저 조회 편의성과 연결 흐름 개선 요구가 커진 것으로 해석할 수 있습니다.")
  }

  if (bullets.length === 0) {
    bullets.push("선택한 지표를 기준으로 기간별 변화를 비교하면 상담 품질과 업무 연결 개선 포인트를 도출할 수 있습니다.")
  }

  return { summaryTitle, bullets }
}

function buildFollowUpAnswer(scenarioId: string, question: string, selectedMetricLabels: string[]) {
  const normalized = question.toLowerCase()
  const metricText = selectedMetricLabels.length > 0 ? selectedMetricLabels.join(", ") : "선택된 업무 지표"

  if (normalized.includes("원인") || normalized.includes("이유")) {
    return `${metricText} 기준으로 보면 최근 변화는 접수량 증가, 반복 문의 주제 집중, 업무 연결 수요 확대 영향으로 해석할 수 있습니다.`
  }

  if (normalized.includes("대응") || normalized.includes("조치") || normalized.includes("액션")) {
    return `${scenarioId === "debt-transfer-tbd" ? "조회 로그 축적과 기준 데이터 정비" : "초기 안내 문구와 담당자 연결 채널"}를 우선 보강하고, 선택 지표를 기준으로 주간 단위 모니터링을 권장합니다.`
  }

  if (normalized.includes("비교") || normalized.includes("함께")) {
    return `${metricText}를 함께 보면 단일 지표만으로는 보이지 않는 처리 품질과 업무 연결 영향도를 비교할 수 있습니다. 접수·처리·연계 지표를 묶어서 보는 방식이 특히 유효합니다.`
  }

  return `${metricText}를 기준으로 보면 현재 질의와 연관된 업무 변화는 계속 설명할 수 있습니다. 필요하면 특정 기간, 상담 단계, 민원 주제 기준으로 더 좁혀서 분석할 수 있습니다.`
}

function buildScenarioFollowUpSeed(scenarioId: string) {
  const scenario = dashboardQueryScenarios.find((item) => item.id === scenarioId)
  if (!scenario) return []

  return [
    {
      id: `seed-${scenario.id}`,
      question: scenario.exampleQuestion,
      answer: scenario.exampleAnswer,
    },
  ]
}


// 연관 키워드는 선택 키워드 패널에서 더 이상 사용하지 않음

// 실시간 알림 데이터
const generateRandomAlert = () => {
  const alertTypes = [
    {
      type: "occupancy",
      icon: TrendingUp,
      title: "민원 접수 증가",
      companies: ["민원 접수", "상담 예약", "서류 보완", "초기 안내"],
      messages: [
        "민원 접수량이 30분 내 25% 증가했습니다",
        "상담 대기시간이 목표치를 초과했습니다",
        "서류 보완 문의가 빠르게 늘고 있습니다"
      ]
    },
    {
      type: "volume",
      icon: BarChart3,
      title: "업무 지표 변동",
      companies: ["채무조정", "소액대출", "업무담당자", "협약기관"],
      messages: [
        "요청량이 일평균 대비 18% 증가했습니다",
        "조회량이 평소보다 빠르게 늘고 있습니다",
        "업무 연결 우선순위 재조정이 필요한 수준으로 지표가 변동 중입니다"
      ]
    },
    {
      type: "keyword",
      icon: TrendingUp,
      title: "이슈 키워드 상승",
      companies: ["채무조정", "민원처리", "상담품질", "고객만족"],
      messages: [
        "키워드 언급량이 1시간 내 200% 증가",
        "고객 후기 및 VOC 언급량이 빠르게 증가하고 있습니다",
        "운영 관련 이슈가 집중적으로 확산되고 있습니다"
      ]
    }
  ]

  const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)]
  const randomCompany = randomType.companies[Math.floor(Math.random() * randomType.companies.length)]
  const randomMessage = randomType.messages[Math.floor(Math.random() * randomType.messages.length)]

  return {
    id: Date.now() + Math.random(),
    type: randomType.type,
    icon: randomType.icon,
    title: randomType.title,
    company: randomCompany,
    message: randomMessage,
    time: new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    isRead: false,
    timestamp: Date.now()
  }
}

// 초기 알림 데이터 (빈 배열로 시작)
const initialAlerts: any[] = []


// 섹터 선택 컴포넌트
function SectorSelector({
  selectedSectors,
  onToggleSector,
  onToggleAllSector
}: {
  selectedSectors: { [key: string]: boolean }
  onToggleSector: (sectorName: string, dataId: string) => void
  onToggleAllSector: (sectorName: string) => void
}) {
  return (
    <div className="space-y-4">
      {Object.entries(sectorData).map(([sectorName, dataItems]) => (
        <div key={sectorName} className="space-y-2">
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox
              id={`sector-${sectorName}`}
              checked={dataItems.some(item => selectedSectors[`${sectorName}-${item.id}`])}
              onCheckedChange={() => onToggleAllSector(sectorName)}
            />
            <label htmlFor={`sector-${sectorName}`} className="font-medium text-sm">
              {sectorName}
            </label>
          </div>

          {dataItems.map((dataItem) => (
            <div key={dataItem.id} className="flex items-start space-x-2 ml-4">
              <Checkbox
                id={`${sectorName}-${dataItem.id}`}
                checked={selectedSectors[`${sectorName}-${dataItem.id}`] || false}
                onCheckedChange={() => onToggleSector(sectorName, dataItem.id)}
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={`${sectorName}-${dataItem.id}`}
                  className="text-sm font-medium cursor-pointer block"
                >
                  {dataItem.name}
                </label>
                <p className="text-xs text-muted-foreground">{dataItem.source}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// 대시보드 차트 컴포넌트
function DashboardCharts({
  selectedSectors
}: {
  selectedSectors: { [key: string]: boolean }
}) {
  // 선택된 데이터 항목들 가져오기
  const getSelectedDataItems = () => {
    const selectedItems: Array<{ sectorName: string, dataItem: any }> = []

    Object.entries(sectorData).forEach(([sectorName, dataItems]) => {
      dataItems.forEach(dataItem => {
        if (selectedSectors[`${sectorName}-${dataItem.id}`]) {
          selectedItems.push({ sectorName, dataItem })
        }
      })
    })

    return selectedItems
  }

  const selectedItems = getSelectedDataItems()

  if (selectedItems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">표시할 데이터를 선택해주세요</h3>
          <p className="text-sm">좌측에서 운영 영역과 지표를 선택하면 차트가 표시됩니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {selectedItems.map(({ sectorName, dataItem }, index) => (
        <Card key={`${sectorName}-${dataItem.id}`} className="bg-card">
          <CardHeader className="bg-card">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{dataItem.name}</CardTitle>
                <CardDescription>
                  <Badge
                    variant="outline"
                    className="mr-2"
                    style={{
                      borderColor: sectorColors[sectorName] || "#2563eb",
                      color: sectorColors[sectorName] || "#2563eb"
                    }}
                  >
                    {sectorName}
                  </Badge>
                  출처: {dataItem.source}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="bg-card">
            <div className="h-64 bg-background rounded-md">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getSampleData(dataItem.id)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={sectorColors[sectorName] || "#2563eb"}
                    strokeWidth={2}
                    name={dataItem.name}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function MarketSensingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const feature = searchParams.get("feature")
  const [activeTab, setActiveTab] = useState(
    tabParam === "wordcloud" || tabParam === "ai-insights" ? tabParam : "dashboard"
  )

  useEffect(() => {
    if (tabParam === "wordcloud" || tabParam === "dashboard" || tabParam === "ai-insights") {
      setActiveTab(tabParam)
    }
  }, [tabParam])
  const [sourceFilter, setSourceFilter] = useState("all") // all, sns, news
  const [timeFilter, setTimeFilter] = useState("realtime") // realtime, daily, weekly, monthly
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [relatedContentTab, setRelatedContentTab] = useState<"news" | "sns">("news")
  const topPopularKeywords = useMemo(() => baseWordData.slice(0, 5), [])
  const initialScenarioId = feature === "debt-transfer" ? "debt-transfer-tbd" : "counseling-load"

  // 섹터 선택 상태 (기본 선택 항목들)
  const [selectedSectors, setSelectedSectors] = useState<{ [key: string]: boolean }>({
    "민원 상담-counseling-volume": true,
    "민원 상담-counseling-completion-rate": true,
    "민원/고객보호-complaint-resolution-rate": true,
    "기관/연계-staff-search-count": true
  })
  const [selectedDashboardScenarioId, setSelectedDashboardScenarioId] = useState(initialScenarioId)
  const [dashboardQuestion, setDashboardQuestion] = useState(
    dashboardQueryScenarios.find((item) => item.id === initialScenarioId)?.question ?? dashboardQueryScenarios[0].question
  )
  const [followUpQuestion, setFollowUpQuestion] = useState("")
  const [followUpResponses, setFollowUpResponses] = useState<Array<{ id: string; question: string; answer: string }>>(
    buildScenarioFollowUpSeed(initialScenarioId),
  )

  // 알림 관련 상태
  const [alerts, setAlerts] = useState(initialAlerts)
  const [alertCounter, setAlertCounter] = useState(0) // 초기에는 알림이 없으므로 0부터 시작
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false)
  const [slidingAlert, setSlidingAlert] = useState<any>(null)
  const [showSlidingAlert, setShowSlidingAlert] = useState(false)
  // 좌측 패널 타이핑 애니메이션은 더 이상 사용하지 않음
  const [relatedSummaryStreamingText, setRelatedSummaryStreamingText] = useState("")
  const [isRelatedSummaryStreaming, setIsRelatedSummaryStreaming] = useState(false)
  const relatedSummaryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 선택 키워드 패널에서 관련 종목 리스트는 제거됨

  // 설정 모달 상태
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  // 리포트 모달 상태
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // 인기 키워드 드롭다운 상태
  const [expandedKeywords, setExpandedKeywords] = useState<{ [key: string]: boolean }>({})

  // AI 인사이트 필터 상태
  const [activeInsightFilter, setActiveInsightFilter] = useState<string>("전체")

  // AI Insight List/Detail View State
  const [viewMode, setViewMode] = useState<"list" | "detail">("list")
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null)

  const handleSelectInsight = (insight: Insight) => {
    setSelectedInsight(insight)
    setViewMode("detail")
  }

  const handleBackToList = () => {
    setSelectedInsight(null)
    setViewMode("list")
  }

  // Manual insight generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleGenerateInsight = async () => {
    setIsGenerating(true)

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to generate insight')
      }

      // Refresh the insight list after generation
      window.location.reload()
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Insight generation cancelled')
      } else {
        console.error('Error generating insight:', error)
        alert('인사이트 생성에 실패했습니다.')
      }
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsGenerating(false)
    }
  }

  const handleWordClick = (word: string) => {
    setSelectedWord(word)
    setRelatedContentTab("news")
  }

  const handleReportClick = (report: any) => {
    setSelectedReport(report)
    setIsReportModalOpen(true)
  }

  const toggleKeywordExpansion = (word: string) => {
    setExpandedKeywords(prev => ({
      ...prev,
      [word]: !prev[word]
    }))
  }

  const handleItemClick = (url: string) => {
    window.open(url, '_blank')
  }

  // 섹터 선택 관련 핸들러
  const handleToggleSector = (sectorName: string, dataId: string) => {
    setSelectedSectors(prev => ({
      ...prev,
      [`${sectorName}-${dataId}`]: !prev[`${sectorName}-${dataId}`]
    }))
  }

  const handleToggleAllSector = (sectorName: string) => {
    const sectorItems = sectorData[sectorName as keyof typeof sectorData] || []
    const allEnabled = sectorItems.every(item => selectedSectors[`${sectorName}-${item.id}`])

    const newSelections = { ...selectedSectors }
    sectorItems.forEach(item => {
      newSelections[`${sectorName}-${item.id}`] = !allEnabled
    })
    setSelectedSectors(newSelections)
  }

  const selectedDashboardScenario = useMemo(
    () => dashboardQueryScenarios.find((item) => item.id === selectedDashboardScenarioId) ?? dashboardQueryScenarios[0],
    [selectedDashboardScenarioId],
  )
  const recommendedMetricKeys = useMemo(
    () => getMetricKeysForScenario(selectedDashboardScenarioId),
    [selectedDashboardScenarioId],
  )
  const selectedMetricMeta = useMemo(
    () =>
      Object.entries(selectedSectors)
        .filter(([, isSelected]) => Boolean(isSelected))
        .map(([key]) => getMetricMeta(key))
        .filter((item): item is NonNullable<ReturnType<typeof getMetricMeta>> => Boolean(item)),
    [selectedSectors],
  )
  const dashboardSummary = useMemo(
    () => buildDashboardSummary(dashboardQuestion, selectedMetricMeta),
    [dashboardQuestion, selectedMetricMeta],
  )
  const analysisMessages = useMemo(
    () => [
      {
        id: "analysis-user",
        role: "user" as const,
        content: dashboardQuestion,
      },
      {
        id: "analysis-assistant",
        role: "assistant" as const,
        content: dashboardSummary.bullets,
      },
    ],
    [dashboardQuestion, dashboardSummary],
  )

  const applyDashboardScenario = (scenarioId: string, nextQuestion?: string) => {
    const scenario = dashboardQueryScenarios.find((item) => item.id === scenarioId)
    if (!scenario) return
    setSelectedDashboardScenarioId(scenario.id)
    setDashboardQuestion(nextQuestion ?? scenario.question)
    setFollowUpResponses(buildScenarioFollowUpSeed(scenario.id))
    setFollowUpQuestion("")
    setSelectedSectors({
      ...buildEmptySectorSelections(),
      ...scenario.selections,
    })
  }

  const runDashboardQuestion = () => {
    const scenarioId = inferDashboardScenarioId(dashboardQuestion)
    applyDashboardScenario(scenarioId, dashboardQuestion)
  }

  useEffect(() => {
    if (feature === "debt-transfer") {
      applyDashboardScenario("debt-transfer-tbd")
      return
    }

    if (feature === "data-guide") {
      applyDashboardScenario("counseling-load")
    }
  }, [feature])

  const toggleRecommendedMetric = (metricKey: string) => {
    setSelectedSectors((prev) => ({
      ...prev,
      [metricKey]: !prev[metricKey],
    }))
  }

  const submitFollowUpQuestion = () => {
    if (!followUpQuestion.trim()) return

    const answer = buildFollowUpAnswer(
      selectedDashboardScenarioId,
      followUpQuestion,
      selectedMetricMeta.map((item) => item.label),
    )

    setFollowUpResponses((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        question: followUpQuestion.trim(),
        answer,
      },
    ])
    setFollowUpQuestion("")
  }

  // 알림 관련 핸들러
  const addNewAlert = () => {
    let newAlert
    // alertCounter를 사용해서 처음 추가되는 5개는 핵심 운영 키워드 고정, 이후 랜덤으로 생성
    if (alertCounter < 5) {
      newAlert = {
        id: Date.now() + Math.random(),
        type: "keyword",
        icon: TrendingUp,
        title: "키워드 급상승",
        company: "민원접수",
        message: "민원 접수 관련 언급량이 1시간 내 250% 증가",
        time: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        isRead: false,
        timestamp: Date.now()
      }
    } else {
      newAlert = generateRandomAlert()
    }

    setAlerts(prev => [newAlert, ...prev].slice(0, 20)) // 최대 20개까지만 유지
    setAlertCounter(prev => prev + 1)

    // 슬라이딩 알림 표시
    setSlidingAlert(newAlert)
    // 약간의 지연을 두고 애니메이션 시작
    setTimeout(() => {
      setShowSlidingAlert(true)
    }, 10)

    // 3초 후 슬라이딩 알림 숨김
    setTimeout(() => {
      setShowSlidingAlert(false)
    }, 4000)
  }

  const markAlertAsRead = (alertId: number | string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    )
  }

  const handleAlertClick = (alert: any) => {
    // 알림을 읽음으로 표시
    markAlertAsRead(alert.id)

    // 핵심 운영 키워드 알림은 워드클라우드 탭으로 이동
    if (alert.company === "민원접수" && alert.type === "keyword") {
      setActiveTab("wordcloud")
      setIsAlertPanelOpen(false) // 알림 패널 닫기
    }
  }

  const markAllAlertsAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })))
  }

  const getUnreadCount = () => {
    return alerts.filter(alert => !alert.isRead).length
  }

  const handleCorrelationAnalysis = (stockName: string, stockCode: string) => {
    // 상관관계 분석 고도화 페이지로 이동
    router.push('/catalyst')
  }

  const handleFilterChange = (type: 'source' | 'time', value: string) => {
    if (type === 'source') {
      setSourceFilter(value)
    } else {
      setTimeFilter(value)
    }
    setSelectedWord(null)
    setRelatedContentTab("news")
  }

  const getFilteredWordData = () => {
    if (sourceFilter === "all") {
      return baseWordData
    } else if (sourceFilter === "sns") {
      return baseWordData.map(([word, freq]) => [word, Math.floor((freq as number) * 0.8)])
    } else {
      return baseWordData.map(([word, freq]) => [word, Math.floor((freq as number) * 0.6)])
    }
  }

  // Wordcloud rendering is handled by WordCloudCanvas component

  // 이전 좌측 패널 타이핑 애니메이션 로직 제거됨

  // Resize handled within WordCloudCanvas

  // 방향키 왼쪽으로 새로운 알림 생성
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        addNewAlert()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const getRelatedItems = (word: string) => {
    const items = mockSNSNews[word as keyof typeof mockSNSNews] || []
    if (sourceFilter === "sns") {
      return items.filter(item => item.type === "SNS")
    } else if (sourceFilter === "news") {
      return items.filter(item => item.type === "뉴스")
    }
    return items
  }

  useEffect(() => {
    if (relatedSummaryIntervalRef.current) {
      clearInterval(relatedSummaryIntervalRef.current)
      relatedSummaryIntervalRef.current = null
    }

    if (!selectedWord) {
      setRelatedSummaryStreamingText("")
      setIsRelatedSummaryStreaming(false)
      return
    }

    const items = getRelatedItems(selectedWord)
    const aiSummaryItem = items.find(item => item.type === "AI 뉴스 요약")

    if (!aiSummaryItem) {
      setRelatedSummaryStreamingText("")
      setIsRelatedSummaryStreaming(false)
      return
    }

    const fullText = aiSummaryItem.content
    setIsRelatedSummaryStreaming(true)
    setRelatedSummaryStreamingText("")

    let currentIndex = 0
    const intervalId = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setRelatedSummaryStreamingText(fullText.slice(0, currentIndex))
        currentIndex++
      } else {
        if (relatedSummaryIntervalRef.current) {
          clearInterval(relatedSummaryIntervalRef.current)
          relatedSummaryIntervalRef.current = null
        }
        setIsRelatedSummaryStreaming(false)
      }
    }, 20)

    relatedSummaryIntervalRef.current = intervalId

    return () => {
      clearInterval(intervalId)
    }
  }, [selectedWord, sourceFilter])

  const tabTriggerClass = "relative h-auto rounded-none border-0 bg-transparent px-0 pb-3 pt-2 text-base font-semibold text-[#7a6a58] transition-colors hover:text-[#005BAC] data-[state=active]:text-[#005BAC] data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:left-0 after:right-0 after:bottom-[-1px] after:h-[2px] after:bg-transparent data-[state=active]:after:bg-[#005BAC]"

  return (
    <div className="h-full overflow-auto">
    <div className="container mx-auto p-6 space-y-6 relative">
      {/* 헤더 섹션 */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              {activeTab === "wordcloud" && "이슈 키워드"}
              {activeTab === "dashboard" && "사내(시스템) 정보 분석"}
              {activeTab === "ai-insights" && "분석 리포트"}
            </h2>
          </div>

          {/* Generate Insight Button - Only show on AI Insights tab */}
          {activeTab === "ai-insights" && (
            <div className="flex items-center gap-3">
              <Button
                onClick={isGenerating ? handleStopGeneration : handleGenerateInsight}
                variant={isGenerating ? "destructive" : "default"}
                className={isGenerating ? "" : "bg-[#005BAC] hover:bg-[#004F9E] text-white"}
              >
                {isGenerating ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    중단
                  </>
                ) : (
                  "인사이트 생성"
                )}
              </Button>
              {isGenerating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>생성 중...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 실시간 알림 아이콘 */}
        <Sheet open={isAlertPanelOpen} onOpenChange={setIsAlertPanelOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="relative p-3">
              <Bell className="h-10 w-10" />
              {getUnreadCount() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {getUnreadCount()}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                실시간 운영 알림
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAlertsAsRead}
                  className="text-xs"
                >
                  모두 읽음
                </Button>
              </SheetTitle>
              <SheetDescription>
                실시간으로 주가, 거래량, 키워드 변화를 모니터링합니다
              </SheetDescription>
            </SheetHeader>

            {/* 알림 리스트 */}
            <div className="mt-6 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto px-2">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  알림이 없습니다
                </div>
              ) : (
                alerts.map((alert) => {
                  const IconComponent = alert.icon
                  return (
                    <div
                      key={alert.id}
                      className={`border rounded-lg p-4 mx-2 cursor-pointer transition-colors ${!alert.isRead
                        ? 'bg-primary/5 border-primary/40'
                        : 'bg-card border-border'
                        } hover:bg-muted/60`}
                      onClick={() => handleAlertClick(alert)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-full p-2 ${alert.type === 'stock' ? 'bg-green-100' :
                          alert.type === 'volume' ? 'bg-blue-100' : 'bg-sky-100'
                          }`}>
                          <IconComponent className={`h-4 w-4 ${alert.type === 'stock' ? 'text-green-600' :
                            alert.type === 'volume' ? 'text-blue-600' : 'text-sky-600'
                            }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {alert.title}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{alert.time}</span>
                          </div>
                          <p className="font-medium text-sm mb-1">{alert.company}</p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          {!alert.isRead && (
                            <div className="mt-2">
                              <Badge variant="default" className="text-xs">새 알림</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="wordcloud" className="space-y-6 block">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
            <div className="space-y-6">
              <Card className="bg-card">
                <CardHeader className="space-y-4 bg-card pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">키워드 군집 시각화</CardTitle>
                      <CardDescription>실시간 언급량 기반으로 키워드 크기와 색상이 달라집니다.</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm text-[#005BAC] hover:text-[#004F9E]"
                      onClick={() => setSelectedWord(null)}
                    >
                      선택 초기화
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#6c7380]">소스</span>
                      {[
                        { label: "전체", value: "all" },
                        { label: "SNS만", value: "sns" },
                        { label: "뉴스만", value: "news" }
                      ].map((option) => (
                        <Button
                          key={option.value}
                          size="sm"
                          variant={sourceFilter === option.value ? "default" : "outline"}
                          className={`rounded-full px-4 ${sourceFilter === option.value ? "bg-[#005BAC] text-white hover:bg-[#004F9E]" : "border-[#C9DDF2] text-[#6f665c]"}`}
                          onClick={() => handleFilterChange("source", option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#6c7380]">기간</span>
                      {[
                        { label: "실시간", value: "realtime" },
                        { label: "일간", value: "daily" },
                        { label: "주간", value: "weekly" },
                        { label: "월간", value: "monthly" }
                      ].map((option) => (
                        <Button
                          key={option.value}
                          size="sm"
                          variant={timeFilter === option.value ? "default" : "outline"}
                          className={`rounded-full px-4 ${timeFilter === option.value ? "bg-[#005BAC] text-white hover:bg-[#004F9E]" : "border-[#C9DDF2] text-[#6f665c]"}`}
                          onClick={() => handleFilterChange("time", option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="bg-card">
                  <WordCloudCanvas
                    className="h-[420px] w-full rounded-xl border border-dashed border-border bg-muted/40"
                    list={getFilteredWordData() as any}
                    selectedWord={selectedWord}
                    onWordClick={(w) => w ? handleWordClick(w) : setSelectedWord(null)}
                    grayscaleOthers
                  />
                </CardContent>
              </Card>

              {selectedWord && (
                <Card className="bg-card">
                  <CardHeader className="bg-card pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Badge variant="outline" className="mb-1 w-fit border-[#005BAC] text-[#005BAC]">
                          선택 키워드
                        </Badge>
                        <CardTitle className="text-2xl text-[#1a2a5b]">{selectedWord}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        {sourceFilter !== "all" && (
                          <Badge variant="secondary" className="bg-[#EEF7FF] text-[#005BAC]">
                            {sourceFilter.toUpperCase()}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="bg-[#f1f3f8] text-[#4f5665]">
                          {timeFilter === "realtime" ? "실시간" : timeFilter === "daily" ? "일간" : timeFilter === "weekly" ? "주간" : "월간"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs font-semibold text-[#005BAC]">AI 요약/분석</p>
                    <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
                      {(() => {
                        const relatedItems = getRelatedItems(selectedWord)
                        const aiSummary = relatedItems.find(item => item.type === "AI 뉴스 요약")
                        if (aiSummary) {
                          return (
                            <p className="whitespace-pre-line">
                              {isRelatedSummaryStreaming ? relatedSummaryStreamingText : (relatedSummaryStreamingText || aiSummary.content)}
                              {isRelatedSummaryStreaming && <span className="ml-1 animate-pulse">▌</span>}
                            </p>
                          )
                        }
                        if (relatedItems.length > 0) {
                          return <p className="whitespace-pre-line">{relatedItems[0].content}</p>
                        }
                        return <p>선택한 키워드에 대한 상세 요약을 준비 중입니다.</p>
                      })()}
                    </div>
                    {/* 관련 종목 및 연관 키워드 섹션 제거 */}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4 xl:max-h-[calc(100vh-200px)] xl:overflow-hidden">
              <Card className="bg-card xl:h-full xl:flex xl:flex-col xl:overflow-hidden">
                <CardHeader className="space-y-4 bg-card xl:flex-none">
                  <div>
                    <CardTitle className="text-xl">관련 뉴스/SNS</CardTitle>
                    <CardDescription>
                      {selectedWord ? `${selectedWord} 관련 최신 콘텐츠` : "키워드를 선택하면 관련 콘텐츠가 표시됩니다."}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={relatedContentTab === "news" ? "default" : "outline"}
                      className={`rounded-full px-4 ${relatedContentTab === "news" ? "bg-[#005BAC] text-white hover:bg-[#004F9E]" : "border-[#C9DDF2] text-[#6f665c]"}`}
                      onClick={() => setRelatedContentTab("news")}
                    >
                      뉴스
                    </Button>
                    <Button
                      size="sm"
                      variant={relatedContentTab === "sns" ? "default" : "outline"}
                      className={`rounded-full px-4 ${relatedContentTab === "sns" ? "bg-[#005BAC] text-white hover:bg-[#004F9E]" : "border-[#C9DDF2] text-[#6f665c]"}`}
                      onClick={() => setRelatedContentTab("sns")}
                    >
                      SNS
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 xl:flex-1 xl:overflow-hidden">
                  {(() => {
                    if (!selectedWord) {
                      return (
                        <div className="space-y-4">

                          <div className="rounded-lg border border-border bg-card">
                            <div className="flex items-start justify-between px-4 py-3">
                              <p className="text-sm font-semibold text-foreground">인기 검색어 TOP 5</p>
                              <p className="text-xs text-muted-foreground">언급량 기준 상위 키워드</p>
                            </div>
                            <div className="divide-y divide-border/60">
                              {topPopularKeywords.map(([word, volume], index) => (
                                <div key={word} className="flex items-center justify-between px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                      {index + 1}
                                    </span>
                                    <span className="text-sm font-semibold text-foreground">{word}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    언급량 <span className="ml-1 font-semibold text-primary">{volume.toLocaleString('ko-KR')}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    }

                    const relatedItems = getRelatedItems(selectedWord)
                    const aiSummary = relatedItems.find(item => item.type === "AI 뉴스 요약")
                    const newsItems = relatedItems.filter(item => item.type === "뉴스")
                    const snsItems = relatedItems.filter(item => item.type === "SNS")
                    const listToRender = relatedContentTab === "news" ? newsItems : snsItems

                    return (
                      <div className="space-y-4 xl:flex xl:h-full xl:flex-col">
                        {/* AI 요약을 해당 섹션에서 제거하고, 선택 키워드 패널로 이동 */}

                        {listToRender.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-[#D4E5F7] bg-[#F5FAFF] p-6 text-center text-sm text-muted-foreground">
                            표시할 {relatedContentTab === "news" ? "뉴스" : "SNS"} 콘텐츠가 없습니다.
                          </div>
                        ) : (
                          <div className="space-y-3 xl:flex-1 xl:overflow-y-auto xl:pr-2">
                            {listToRender.map(item => (
                              <div
                                key={item.id}
                                className="group cursor-pointer rounded-lg border border-[#D4E5F7] p-4 transition hover:border-[#005BAC] hover:shadow-sm"
                                onClick={() => handleItemClick(item.url)}
                              >
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{item.type}</span>
                                  <span>{item.date}</span>
                                </div>
                                <h4 className="mt-2 text-sm font-semibold text-[#5f3b16] group-hover:text-[#005BAC]">
                                  {item.title}
                                </h4>
                                <p className="mt-1 text-sm text-[#6f665c] line-clamp-2">{item.content}</p>
                                <div className="mt-3 flex items-center gap-1 text-xs text-[#005BAC]">
                                  자세히 보기
                                  <ExternalLink className="h-3 w-3" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="bg-card pb-4">
                  <CardTitle className="text-lg">연관 업무 주제</CardTitle>
                  <CardDescription>워드클라우드와 함께 자주 언급되는 연관 업무 주제를 빠르게 확인하세요.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { symbol: "POL", name: "사내규정 검색" },
                    { symbol: "STA", name: "업무담당자 검색" },
                    { symbol: "PAR", name: "제휴기관 검색" }
                  ].map(stock => (
                    <div key={stock.symbol} className="flex items-center justify-between rounded-lg border border-border p-3 bg-card">
                      <div>
                        <p className="text-sm font-semibold text-[#5f3b16]">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">{stock.name}</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-[#C9DDF2] text-[#005BAC] hover:border-[#005BAC]" onClick={() => handleCorrelationAnalysis(stock.name, stock.symbol)}>
                        상관관계 분석
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 대시보드 탭 */}
        <TabsContent value="dashboard" className="space-y-6 block">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>{feature === "debt-transfer" ? "채권양수도 추론 질의" : "업무 데이터 질의"}</CardTitle>
              <CardDescription>
                {feature === "debt-transfer"
                  ? "시범 지표를 기준으로 채권양수도 추론 요청 흐름과 연관 업무 데이터를 함께 확인할 수 있습니다."
                  : "업무 질의를 입력하면 관련 그래프와 분석 요약을 함께 확인할 수 있습니다."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-3 lg:flex-row">
                <Input
                  value={dashboardQuestion}
                  onChange={(event) => setDashboardQuestion(event.target.value)}
                  placeholder={feature === "debt-transfer" ? "예: 채권양수도 추론 관련 지표를 시범적으로 구성해줘." : "예: 최근 민원 접수량과 상담 완료율 변화를 함께 분석해줘."}
                  className="h-11"
                />
                <Button className="h-11 bg-[#005BAC] hover:bg-[#004F9E] text-white" onClick={runDashboardQuestion}>
                  분석 실행
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {dashboardQueryScenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => applyDashboardScenario(scenario.id)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      selectedDashboardScenarioId === scenario.id
                        ? "border-[#005BAC] bg-[#EEF7FF]"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    {scenario.summaryTitle}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <Card className="bg-muted/20 py-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">지표 선택</CardTitle>
                    <CardDescription>질의와 관련된 업무 지표를 직접 선택해 대시보드와 분석 요약에 반영할 수 있습니다.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {recommendedMetricKeys.map((metricKey) => {
                      const metric = getMetricMeta(metricKey)
                      if (!metric) return null

                      const active = Boolean(selectedSectors[metricKey])

                      return (
                        <button
                          key={metricKey}
                          type="button"
                          onClick={() => toggleRecommendedMetric(metricKey)}
                          className={`rounded-xl border px-4 py-4 text-left transition-all ${
                            active
                              ? "border-[#005BAC] bg-[#EEF7FF] shadow-sm"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Checkbox checked={active} className="pointer-events-none" />
                              <div className="text-xs text-muted-foreground">{metric.source}</div>
                            </div>
                            <div className={`rounded-full px-2 py-1 text-[11px] font-medium ${active ? "bg-[#005BAC] text-white" : "bg-muted text-muted-foreground"}`}>
                              {active ? "선택됨" : "선택 안 함"}
                            </div>
                          </div>
                          <div className="mt-3 text-sm font-semibold text-foreground">{metric.label}</div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            클릭하여 분석에 포함하거나 제외할 수 있습니다.
                          </div>
                        </button>
                      )
                    })}
                  </CardContent>
                </Card>

                <Card className="bg-muted/20 py-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">분석 결과</CardTitle>
                    <CardDescription>질의와 선택 지표를 바탕으로 생성된 분석 세션입니다.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {analysisMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`rounded-2xl border px-4 py-4 ${
                            message.role === "user"
                              ? "ml-8 bg-[#005BAC] text-white border-[#005BAC]"
                              : "mr-8 bg-background border-border"
                          }`}
                        >
                          <div className={`text-xs font-medium ${message.role === "user" ? "text-white/80" : "text-[#005BAC]"}`}>
                            {message.role === "user" ? "질문" : "분석 답변"}
                          </div>
                          {message.role === "user" ? (
                            <div className="mt-2 text-sm leading-6">{message.content}</div>
                          ) : (
                            <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                              {(message.content as string[]).map((point) => (
                                <div key={point} className="rounded-lg border bg-muted/20 px-4 py-3">
                                  • {point}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label htmlFor="follow-up-question">추가 질문</Label>
                      <div className="flex flex-col gap-3 lg:flex-row">
                        <Input
                          id="follow-up-question"
                          value={followUpQuestion}
                          onChange={(event) => setFollowUpQuestion(event.target.value)}
                          placeholder="예: 대응 방안은 어떻게 잡는 게 좋을까?"
                          className="h-10"
                        />
                        <Button variant="outline" className="h-10" onClick={submitFollowUpQuestion}>
                          질문하기
                        </Button>
                      </div>

                      {followUpResponses.length > 0 ? (
                        <div className="space-y-3">
                          {followUpResponses.map((item) => (
                            <div key={item.id} className="rounded-lg border bg-background p-4">
                              <div className="text-xs font-medium text-[#005BAC]">추가 질문</div>
                              <div className="mt-1 text-sm text-foreground">{item.question}</div>
                              <div className="mt-3 text-xs font-medium text-muted-foreground">분석 답변</div>
                              <div className="mt-1 text-sm leading-6 text-muted-foreground">{item.answer}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="bg-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>제논라이프 운영 데이터 대시보드</CardTitle>
                  <CardDescription>
                    선택한 지표를 기준으로 관련 그래프가 자동으로 구성됩니다.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  설정
                </Button>
              </div>
            </CardHeader>
            <CardContent className="bg-card">
              <DashboardCharts selectedSectors={selectedSectors} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI 인사이트 탭 */}
        <TabsContent value="ai-insights" className="space-y-6 block">
          <div className="h-[calc(100vh-150px)] overflow-y-auto">
            {viewMode === "list" ? (
              <InsightList onSelectInsight={handleSelectInsight} />
            ) : (
              <InsightView insight={selectedInsight} onBack={handleBackToList} />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 슬라이딩 알림 */}
      {slidingAlert && (
        <div
          className={`fixed top-20 right-4 bg-card border border-border rounded-lg shadow-lg px-4 pt-4 pb-2 w-80 z-50 transform transition-all duration-300 cursor-pointer ${showSlidingAlert ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}
          onClick={() => handleAlertClick(slidingAlert)}
        >
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${slidingAlert.type === 'stock' ? 'bg-green-100' :
              slidingAlert.type === 'volume' ? 'bg-blue-100' : 'bg-sky-100'
              }`}>
              <slidingAlert.icon className={`h-4 w-4 ${slidingAlert.type === 'stock' ? 'text-green-600' :
                slidingAlert.type === 'volume' ? 'text-blue-600' : 'text-sky-600'
                }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {slidingAlert.title}
                </Badge>
                <button
                  onClick={(e) => {
                    e.stopPropagation() // 이벤트 전파 방지
                    setShowSlidingAlert(false)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="font-medium text-sm mb-1">{slidingAlert.company}</p>
              <p className="text-sm text-muted-foreground">{slidingAlert.message}</p>
              <Badge variant="default" className="text-xs mt-2">실시간</Badge>
            </div>
          </div>
        </div>
      )}

      {/* 리포트 상세 모달 */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="!max-w-[82vw] max-h-[90vh] overflow-y-auto sm:!max-w-[45vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedReport?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedReport && selectedReport.id === 1 && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedReport.category}</Badge>
                  {selectedReport.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedReport.generatedAt} • {selectedReport.readTime} 읽기
                </div>
              </div>

              {/* 리포트 내용 */}
              <div className="prose prose-sm max-w-none">
                <h2 className="text-lg font-semibold mb-4">1. 이벤트 개요</h2>
                <p className="mb-4">
                  이번 리포트는 민원 접수, 상담 처리, 담당자 연결, 규정 검색 데이터를 함께 살펴보며
                  최근 제논라이프 주요 업무 흐름의 변화를 요약한 결과입니다. 상담 수요, 민원 처리 지연,
                  담당자 연결 병목까지 함께 확인하는 데 목적이 있습니다.
                </p>

                <h3 className="text-md font-semibold mb-2">주요 발표 포인트</h3>
                <ul className="mb-6 ml-4 list-disc">
                  <li>민원 접수량 증가에도 상담 완료율은 비교적 안정적으로 유지됨</li>
                  <li>피크 시간대 평균 응답 대기시간이 함께 확대되어 병목 구간이 확인됨</li>
                  <li>규정 검색과 담당자 연결 요청이 같은 주제에서 함께 증가함</li>
                  <li>표준 안내 문구 정비 이후 재문의율이 완만하게 낮아지는 흐름이 보임</li>
                </ul>

                <p className="mb-6">
                  분석 결과 핵심은 단순 접수량 증감보다 상담 병목과 후속 연결 지점을 조기에 파악해
                  FAQ, 담당자 연결, 규정 검색 경험을 함께 개선하는 데 있습니다.
                </p>

                <h2 className="text-lg font-semibold mb-4">2. AI 기반 분석 인사이트</h2>

                <h3 className="text-md font-semibold mb-2">(1) 민원 접수량과 처리 병목 파악</h3>
                <ul className="mb-4 ml-4 list-disc">
                  <li>민원 접수량과 평균 대기시간을 함께 보면 병목이 발생하는 시간대를 빠르게 식별할 수 있습니다.</li>
                  <li>FAQ 자동 응답과 담당자 연결을 함께 제공하면 초기 문의를 더 효율적으로 분산할 수 있습니다.</li>
                  <li>민원 상담 데이터와 규정 검색 로그를 같이 보면 반복 문의 주제를 빠르게 정리할 수 있습니다.</li>
                </ul>

                <h3 className="text-md font-semibold mb-2">(2) 민원 품질 개선 구간 식별</h3>
                <ul className="mb-4 ml-4 list-disc">
                  <li>민원 해결률이 개선돼도 재문의율이 남아 있다면 후속 안내와 문구 정비가 동시에 필요합니다.</li>
                  <li>상담 만족도와 재문의율을 함께 보면 단순 처리 완료만으로는 보이지 않는 품질 이슈를 확인할 수 있습니다.</li>
                  <li>업무 지표 이상 징후를 실시간 알림으로 연결하면 선제적 리소스 배분이 가능해집니다.</li>
                </ul>

                <h3 className="text-md font-semibold mb-2">(3) AI 해석 문구</h3>
                <div className="bg-[#EEF7FF] p-4 rounded-lg mb-6">
                  <p className="italic">"제논라이프 데이터 분석의 핵심은 단순 접수량 집계가 아니라, 상담 병목과 민원 지연 요인을 얼마나 빠르게 발견하고 고객 경험 개선으로 연결하느냐에 있다."</p>
                </div>

                <h2 className="text-lg font-semibold mb-4">3. 향후 체크 포인트</h2>

                <div className="grid gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">민원상담 운영 점검</h4>
                    <ul className="ml-4 list-disc text-sm">
                      <li>상담 접수량과 평균 대기시간이 함께 확대되는 구간 여부</li>
                      <li>상담 완료율이 피크 시간대에도 안정적으로 유지되는지 여부</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">고객 응대 품질</h4>
                    <ul className="ml-4 list-disc text-sm">
                      <li>민원 해결률 개선 이후 재문의율이 함께 낮아지는지 여부</li>
                      <li>표준 안내 문구 개편 이후 동일 주제 반복 문의가 줄어드는지 여부</li>
                      <li>상담 만족도와 처리 리드타임이 함께 개선되는지 여부</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">기관/연계 확장성</h4>
                    <ul className="ml-4 list-disc text-sm">
                      <li>업무담당자 검색량과 협약기관 조회량의 상관관계</li>
                      <li>채권양수도 추론 요청 수가 실제 담당자 연결 수요와 맞물리는지 여부</li>
                    </ul>
                  </div>
                </div>

                <h2 className="text-lg font-semibold mb-4">4. 종합 평가</h2>
                <p className="mb-4">
                  이번 화면은 제논라이프 운영 데이터를 한 화면에서 질문하고, 주요 KPI 차트와 AI 요약을 함께 보는
                  데이터 분석 에이전트의 예시입니다.
                </p>
                <p className="mb-4">
                  운영 담당자는 병목 구간과 반복 문의 원인을 빠르게 파악할 수 있고, 관리자는 월별 추세와
                  서비스 개선 우선순위를 함께 확인할 수 있습니다.
                </p>
                <p className="mb-6">
                  실제 서비스 단계에서는 상담시스템, 규정 문서, 인사정보, 협약기관 DB를 연결해 더 정교한 분석으로 확장할 수 있습니다.
                </p>

                <div className="bg-sky-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold mb-2">📌 결론</h3>
                  <p>
                    데이터길잡이의 가치는 단순 차트 조회가 아니라, 업무 데이터를 바탕으로
                    <strong>상담 병목, 반복 문의, 연계 필요 구간을 함께 해석해 실행 포인트까지 제시하는 것</strong>에 있습니다.
                  </p>
                </div>

                <h2 className="text-lg font-semibold mb-4">관련 이벤트 시뮬레이터</h2>
                <div className="mb-6">
                  <Card
                    className="hover:shadow-md transition-shadow bg-card cursor-pointer hover:border-primary/40 hover:bg-muted/40"
                    style={{
                      boxShadow: "0 0 10px rgba(21, 58, 212, 0.04)"
                    }}
                    onClick={() => {
                      router.push('/event-analysis')
                    }}
                  >
                    <CardContent className="px-6 py-4 bg-card">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base">민원 접수 급증 시 처리 영향 분석</h3>
                            <Badge variant="outline" className="bg-[#EEF7FF] text-[#9A4A00] border-[#FFC98A]">
                              긍정
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            접수량 급증 시 응답 대기시간, 담당자 연결, 민원 해결률에 미치는 영향을 시뮬레이션합니다.
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">
                              <Globe className="h-3 w-3 mr-1" />
                              한국
                            </Badge>
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              1일
                            </Badge>
                            <Badge className="text-xs" style={{ backgroundColor: '#F0F4FA', color: '#153AD4' }}>
                              민원
                            </Badge>
                            <Badge className="text-xs" style={{ backgroundColor: '#F0F4FA', color: '#153AD4' }}>
                              상담
                            </Badge>
                            <Badge className="text-xs" style={{ backgroundColor: '#F0F4FA', color: '#153AD4' }}>
                              처리품질
                            </Badge>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <Button
                            className="flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/event-analysis')
                            }}
                          >
                            <Play className="h-4 w-4" />
                            시뮬레이션 실행
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 표 */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">구분</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">주요 내용</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">운영 관점 핵심 질문</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-semibold">민원 상담</td>
                        <td className="border border-gray-300 px-4 py-2">상담 접수량, 상담 완료율, 평균 응답 대기시간</td>
                        <td className="border border-gray-300 px-4 py-2">"접수량 증가가 실제 처리 지연으로 이어지는 구간은 어디인가?"</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-semibold">민원/고객보호</td>
                        <td className="border border-gray-300 px-4 py-2">민원 해결률, 재문의율, 상담 만족도</td>
                        <td className="border border-gray-300 px-4 py-2">"반복 문의가 남는 지점은 어디이고 어떤 문구를 보완해야 하는가?"</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-semibold">채무조정/지원</td>
                        <td className="border border-gray-300 px-4 py-2">채무조정 신청 건수, 소액대출 연계 건수, 지원안 실행률</td>
                        <td className="border border-gray-300 px-4 py-2">"상담 이후 실제 지원안 연결이 얼마나 이어지고 있는가?"</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-semibold">기관/연계</td>
                        <td className="border border-gray-300 px-4 py-2">업무담당자 검색량, 협약기관 조회량, 채권양수도 추론 요청 수</td>
                        <td className="border border-gray-300 px-4 py-2">"연계 업무가 많은 영역에서 어떤 검색/추론 기능을 우선 고도화해야 하는가?"</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 설정 모달 */}
      <MarketSensingSettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
    </div>
    </div>
  )
}

export default function MarketSensingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MarketSensingPageContent />
    </Suspense>
  )
}

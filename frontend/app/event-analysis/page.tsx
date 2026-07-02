"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Globe,
  DollarSign,
  Users,
  Building2,
  BarChart3,
  Target,
  Search
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// 태그 선택 UI 제거로 Popover/Checkbox 불필요 (사용 안 함)

// 이벤트 데이터 구조
interface Event {
  id: string
  title: string
  description: string
  category: string
  severity: "low" | "medium" | "high" | "critical"
  probability: number
  impact: {
    market: number
    economy: number
    social: number
  }
  duration: string
  region: string
  relatedSectors: string[]
  tags: string[]
  createdAt: string
  isCustom?: boolean
}

// 샘플 이벤트 데이터
const sampleEvents: Event[] = [
  {
    id: "1",
    title: "미국 연준 금리 인상",
    description: "미국 연방준비제도가 기준금리를 0.5%p 인상할 경우의 시나리오",
    category: "경제정책",
    severity: "high",
    probability: 75,
    impact: {
      market: -15,
      economy: -8,
      social: -5
    },
    duration: "6개월",
    region: "미국",
    relatedSectors: ["금융", "부동산", "소비재"],
    tags: ["금리", "통화정책", "인플레이션"],
    createdAt: "2024-01-15"
  },
  {
    id: "2",
    title: "테슬라: 옵션 거래 급증",
    description: "2025년 9월 12일 만기 $360 콜옵션에 120,000건이 넘는 거래가 한날 집중적으로 이루어지면서 테슬라 주가가 4.3% 급등하는 이벤트가 발생했습니다.",
    category: "기술혁신",
    severity: "medium",
    probability: 85,
    impact: {
      market: 15,
      economy: 8,
      social: 5
    },
    duration: "1일",
    region: "미국",
    relatedSectors: ["테크", "자동차", "옵션거래"],
    tags: ["테슬라", "옵션", "급등"],
    createdAt: "2024-09-12"
  },
  {
    id: "3",
    title: "엔비디아: 중국 수출 라이선스 및 콘퍼런스 발표",
    description: "미국 정부가 최근 엔비디아와 AMD에 중국향 AI 칩 수출 허가 라이선스를 발급하고, 그 대가로 중국 매출의 15%를 미국에 넘기는 조치를 단행했습니다.",
    category: "지정학",
    severity: "high",
    probability: 70,
    impact: {
      market: 20,
      economy: 15,
      social: 8
    },
    duration: "6개월",
    region: "글로벌",
    relatedSectors: ["반도체", "AI", "중국사업"],
    tags: ["엔비디아", "중국", "라이선스"],
    createdAt: "2024-09-10"
  },
  {
    id: "4",
    title: "애플: 아이폰 에어/17 출시 이벤트",
    description: "9월 9일, 애플은 대대적인 제품 발표 행사를 통해 초박형 '아이폰 에어'를 공개하며 수년 만에 가장 큰 디자인 혁신을 선보였습니다.",
    category: "기술혁신",
    severity: "medium",
    probability: 90,
    impact: {
      market: 12,
      economy: 10,
      social: 15
    },
    duration: "3개월",
    region: "글로벌",
    relatedSectors: ["테크", "스마트폰", "소비자전자"],
    tags: ["애플", "아이폰", "신제품"],
    createdAt: "2024-09-09"
  }
]

export default function EventSimulatorPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>(sampleEvents)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // 새 시나리오 생성 폼 상태
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: "",
    description: "",
    category: "",
    severity: "medium",
    probability: 50,
    impact: { market: 0, economy: 0, social: 0 },
    duration: "",
    region: "",
    relatedSectors: [],
    tags: []
  })

  const getSeverityColor = (severity: Event["severity"]) => {
    switch (severity) {
      case "low": return "bg-green-100 text-green-800 border-green-200"
      case "medium": return "bg-sky-100 text-sky-800 border-sky-200"
      case "high": return "bg-blue-100 text-blue-800 border-blue-200"
      case "critical": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: Event["severity"]) => {
    switch (severity) {
      case "low": return <TrendingUp className="h-4 w-4" />
      case "medium": return <AlertTriangle className="h-4 w-4" />
      case "high": return <Zap className="h-4 w-4" />
      case "critical": return <AlertTriangle className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "경제정책": return <DollarSign className="h-5 w-5" />
      case "보건정책": return <Users className="h-5 w-5" />
      case "기술규제": return <Building2 className="h-5 w-5" />
      case "원자재": return <Globe className="h-5 w-5" />
      case "기술혁신": return <Zap className="h-5 w-5" />
      case "환경": return <Globe className="h-5 w-5" />
      case "지정학": return <Globe className="h-5 w-5" />
      default: return <BarChart3 className="h-5 w-5" />
    }
  }

  const createCustomEvent = () => {
    if (!newEvent.title || !newEvent.description) return

    const customEvent: Event = {
      id: `custom_${Date.now()}`,
      title: newEvent.title || "",
      description: newEvent.description || "",
      category: newEvent.category || "기타",
      severity: newEvent.severity || "medium",
      probability: newEvent.probability || 50,
      impact: newEvent.impact || { market: 0, economy: 0, social: 0 },
      duration: newEvent.duration || "미정",
      region: newEvent.region || "미정",
      relatedSectors: newEvent.relatedSectors || [],
      tags: newEvent.tags || [],
      createdAt: new Date().toISOString().split('T')[0],
      isCustom: true
    }

    setEvents(prev => [customEvent, ...prev])
    setIsCreateDialogOpen(false)
    setNewEvent({
      title: "",
      description: "",
      category: "",
      severity: "medium",
      probability: 50,
      impact: { market: 0, economy: 0, social: 0 },
      duration: "",
      region: "",
      relatedSectors: [],
      tags: []
    })
  }

  const categories = Array.from(new Set(events.map(e => e.category).filter(Boolean)))
  // 태그 필터 UI 제거: allTags 불필요

  const filteredEvents = events.filter(e => {
    const q = searchQuery.trim().toLowerCase()
    const matchSearch = !q || (e.title || "").toLowerCase().includes(q) || (e.description || "").toLowerCase().includes(q)
    const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(e.category)
    return matchSearch && matchCategory
  })

  return (
    <div className="container mx-auto p-6 space-y-6 bg-background">
      {/* 헤더 */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">이벤트 분석</h2>
        </div>
      </div>

      <div>
        <Card className="bg-card">
          <CardHeader className="bg-card">
            <div className="flex items-center justify-between">
              <CardTitle>이벤트 목록</CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">시나리오 생성</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>새 시나리오 생성</DialogTitle>
                    <DialogDescription>
                      사용자 정의 시나리오를 생성하여 시뮬레이션할 수 있습니다.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">제목</Label>
                      <Input
                        id="title"
                        value={newEvent.title || ""}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="시나리오 제목을 입력하세요"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">설명</Label>
                      <Textarea
                        id="description"
                        value={newEvent.description || ""}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="시나리오에 대한 상세 설명을 입력하세요"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">카테고리</Label>
                        <Select onValueChange={(value) => setNewEvent(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="카테고리 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="경제정책">경제정책</SelectItem>
                            <SelectItem value="보건정책">보건정책</SelectItem>
                            <SelectItem value="기술규제">기술규제</SelectItem>
                            <SelectItem value="원자재">원자재</SelectItem>
                            <SelectItem value="기술혁신">기술혁신</SelectItem>
                            <SelectItem value="환경">환경</SelectItem>
                            <SelectItem value="지정학">지정학</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="severity">심각도</Label>
                        <Select onValueChange={(value) => setNewEvent(prev => ({ ...prev, severity: value as Event["severity"] }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="심각도 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">낮음</SelectItem>
                            <SelectItem value="medium">보통</SelectItem>
                            <SelectItem value="high">높음</SelectItem>
                            <SelectItem value="critical">심각</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        취소
                      </Button>
                      <Button onClick={createCustomEvent}>
                        시나리오 생성
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="mt-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이벤트 제목/내용 검색"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategories.length === 0 ? "default" : "outline"}
                  className="h-9"
                  onClick={() => setSelectedCategories([])}
                >
                  전체
                </Button>
                {categories.map((c) => {
                  const selected = selectedCategories.includes(c)
                  return (
                    <Button
                      key={c}
                      variant={selected ? "default" : "outline"}
                      className="h-9"
                      onClick={() =>
                        setSelectedCategories((prev) =>
                          prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                        )
                      }
                    >
                      {c}
                    </Button>
                  )
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="bg-card">
            {/* 스크롤 가능한 이벤트 목록 */}
            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {filteredEvents.length === 0 && (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  검색 결과가 없습니다
                </div>
              )}
              {filteredEvents.map((event) => (
                <Card
                  key={event.id}
                  className="hover:shadow-md transition-shadow bg-card cursor-pointer"
                  onClick={() => router.push(`/event-analysis/${event.id}`)}
                >
                  <CardContent className="px-6 py-2 bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* 헤더 정보 */}
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base truncate">{event.title}</h3>
                          {event.isCustom && (
                            <Badge variant="outline" className="text-xs">
                              사용자 생성
                            </Badge>
                          )}
                        </div>

                        {/* 설명 */}
                        <p className="text-sm text-muted-foreground mb-1 line-clamp-1">
                          {event.description}
                        </p>

                        {/* 메타데이터 */}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            <Globe className="h-3 w-3 mr-1" />
                            {event.region}
                          </Badge>
                          {/* 기간 배지 제거 요청에 따라 미표시 */}

                          {/* 관련 섹터 태그 */}
                          {event.relatedSectors.slice(0, 3).map((sector, index) => (
                            <Badge key={index} className="text-xs text-white" style={{ backgroundColor: 'rgb(15, 31, 61)' }}>
                              {sector}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* 실행 버튼 제거 */}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

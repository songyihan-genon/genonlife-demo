"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, X, Send, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

interface InflectionPointChatbotProps {
  selectedDate: string
  selectedPrice: number
  stockTicker: string
  isVisible: boolean
  onClose: () => void
}

interface EventAnalysis {
  events: Array<{
    title: string
    date: string
    impact: string
    source: string
  }>
  marketRemark: string
}

export default function InflectionPointChatbot({
  selectedDate,
  selectedPrice,
  stockTicker,
  isVisible,
  onClose
}: InflectionPointChatbotProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<EventAnalysis | null>(null)
  const [message, setMessage] = useState("")

  // 모의 이벤트 분석 생성 함수
  const generateEventAnalysis = async (date: string, ticker: string): Promise<EventAnalysis> => {
    // 실제로는 API 호출이 들어갈 부분
    const mockEvents = [
      {
        title: `${ticker} 분기별 실적 발표`,
        date: date,
        impact: "주가 상승 압력 증대",
        source: "SEC Filing"
      },
      {
        title: "연방준비제도 금리 인상 발표",
        date: date,
        impact: "기술주 전반 하락 요인",
        source: "Federal Reserve"
      },
      {
        title: "업계 내 주요 파트너십 체결 발표",
        date: date,
        impact: "장기 성장 기대감 증가",
        source: "Company Press Release"
      }
    ]

    const mockRemark = `${date}의 변곡점은 주로 실적 발표와 금리 정책 변화의 복합적 영향으로 분석됩니다. ${ticker}의 강한 실적에도 불구하고 거시경제적 우려가 혼재되어 나타난 것으로 보이며, 단기적으로는 변동성이 지속될 것으로 예상됩니다. 장기적으로는 기업의 펀더멘털이 견고하다면 상승 여력이 있을 것으로 판단됩니다.`

    return {
      events: mockEvents,
      marketRemark: mockRemark
    }
  }

  const handleAnalyze = async () => {
    setIsLoading(true)
    try {
      const result = await generateEventAnalysis(selectedDate, stockTicker)
      setAnalysis(result)
    } catch (error) {
      console.error("분석 중 오류 발생:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      // 추가 질문 처리 로직
      console.log("사용자 메시지:", message)
      setMessage("")
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 w-96 h-[600px] z-50">
      <Card className="h-full bg-white shadow-lg border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle className="text-lg">변곡점 분석</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {selectedDate} - ${selectedPrice.toFixed(2)}
          </CardDescription>
        </CardHeader>

        <CardContent className="h-[calc(100%-120px)] flex flex-col">
          {!analysis ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">변곡점 이벤트 분석</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  선택한 날짜의 주요 이벤트와 주가 영향을 분석합니다.
                </p>
              </div>
              <Button onClick={handleAnalyze} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "분석 중..." : "이벤트 분석하기"}
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4 pr-4">
                  {/* 이벤트 리스트 */}
                  <div>
                    <h4 className="font-semibold mb-3">주요 이벤트</h4>
                    <div className="space-y-2">
                      {analysis.events.map((event, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-sm">{event.title}</h5>
                            <Badge variant="outline" className="text-xs">
                              {event.source}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            영향: {event.impact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 시장 분석 */}
                  <div>
                    <h4 className="font-semibold mb-3">시장 영향 분석</h4>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm leading-relaxed">
                        {analysis.marketRemark}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* 추가 질문 입력 */}
              <div className="flex gap-2">
                <Input
                  placeholder="추가 질문을 입력하세요..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
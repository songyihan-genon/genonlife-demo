import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { LightweightCandlestickChart, type ChartInflectionLine } from '@/components/lightweight-candlestick-chart'
import { StreamingText } from "@/components/ui/streaming-text"
import { ExternalLink } from "lucide-react"
import { WatchlistStock, EventNewsData } from "@/types/domain"

export interface TimelineEvent {
  id: string
  date: string
  label: string
  shortLabel: string
  tone: 'up' | 'down'
}

export interface EventDetail {
  title: string
  summary: string
  observations: { text: string; sources: { name: string; url: string }[] }[]
  insights: any[]
  tone: 'up' | 'down'
  newsImpactSummary: string | null
  sources: { name: string; url: string }[]
}

interface CatalystChartPanelProps {
  selectedStockInfo: WatchlistStock | undefined
  stockHistoryRangeLabel: string | null
  stockHistoryStatusMessage: string | null
  shouldShowStockSkeleton: boolean
  candlestickSeriesData: any[]
  macroLineSeries: { time: string; value: number }[] | undefined
  priceAxisRange: { min: number; max: number } | null
  inflectionLines: ChartInflectionLine[]
  hasDynamicEvents: boolean
  eventTimelineEmptyMessage: string | null
  dynamicEventTimeline: TimelineEvent[]
  selectedEventId: string | null
  onEventSelect: (id: string) => void
  selectedEventDetail: EventDetail | null
  eventNewsData: Record<string, EventNewsData>
}

export function CatalystChartPanel({
  selectedStockInfo,
  stockHistoryRangeLabel,
  stockHistoryStatusMessage,
  shouldShowStockSkeleton,
  candlestickSeriesData,
  macroLineSeries,
  priceAxisRange,
  inflectionLines,
  hasDynamicEvents,
  eventTimelineEmptyMessage,
  dynamicEventTimeline,
  selectedEventId,
  onEventSelect,
  selectedEventDetail,
  eventNewsData,
}: CatalystChartPanelProps) {
  return (
    <div className="flex-1 h-full min-h-0 flex flex-col overflow-hidden min-w-[150px] ml-6 chart-container">
      {/* 상단: 주가 차트 */}
      <Card className="bg-card flex flex-col min-h-0 flex-1">
        <CardHeader className="pb-2 flex-shrink-0">
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span>
              {selectedStockInfo ? `${selectedStockInfo.name} (${selectedStockInfo.ticker})` : '일별 주가 데이터'}
            </span>
            {stockHistoryRangeLabel && !stockHistoryStatusMessage && (
              <span className="text-xs text-muted-foreground">표시 범위: {stockHistoryRangeLabel}</span>
            )}
          </CardDescription>
          {stockHistoryStatusMessage && (
            <p className="text-xs text-muted-foreground">{stockHistoryStatusMessage}</p>
          )}
        </CardHeader>
        <CardContent className="p-4 flex-1 min-h-0">
          {shouldShowStockSkeleton ? (
            <div className="h-full flex flex-col gap-3">
              <div className="flex-[3] min-h-0">
                <Skeleton className="w-full h-full rounded-xl" />
              </div>
              <div className="flex-[2] min-h-0 pt-3 border-t space-y-3">
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-6 w-20 rounded-full" />
                  ))}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-3">
              <div className="flex-[3] min-h-0">
                <LightweightCandlestickChart
                  data={candlestickSeriesData}
                  macroSeries={macroLineSeries}
                  macroSeriesColor="rgb(26, 77, 214)"
                  priceRange={priceAxisRange}
                  inflectionLines={inflectionLines}
                  className="w-full h-full"
                  chartType="candle"
                />
              </div>

              {/* 이벤트 분석: 차트와 통합 표시 (해석 및 가능성 제외) */}
              <div className="flex-[2] min-h-0 overflow-auto pt-3 border-t">
                <div className="flex flex-wrap gap-2 mb-3 text-xs min-h-[30px]">
                  {!hasDynamicEvents ? (
                    <span className="text-muted-foreground text-sm">{eventTimelineEmptyMessage}</span>
                  ) : (
                    dynamicEventTimeline.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => onEventSelect(event.id)}
                        className={`px-2 py-1 rounded-full border transition-colors ${selectedEventId === event.id
                          ? event.tone === 'up'
                            ? 'bg-green-50 text-green-700 border-green-400'
                            : 'bg-red-50 text-red-700 border-red-400'
                          : 'bg-card border-border text-muted-foreground hover:bg-muted/60'
                          }`}
                      >
                        {event.shortLabel ?? event.label}
                      </button>
                    ))
                  )}
                </div>

                {!hasDynamicEvents ? (
                  <div className="text-sm text-muted-foreground">{eventTimelineEmptyMessage}</div>
                ) : selectedEventDetail ? (
                  <div className={"p-4 rounded-lg border border-border bg-card"}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-foreground">{selectedEventDetail.title}</h3>
                      <Badge className={selectedEventDetail.tone === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {selectedEventDetail.tone === 'up' ? '상승 이벤트' : '하락 이벤트'}
                      </Badge>
                    </div>
                    {!selectedEventDetail.newsImpactSummary && (
                      <StreamingText
                        key={selectedEventId ?? 'event-summary-inline'}
                        text={selectedEventDetail.summary}
                        speed={28}
                        className="text-sm text-muted-foreground mt-2 inline-block leading-relaxed"
                      />
                    )}

                    {selectedEventDetail.newsImpactSummary && (
                      <div className="mt-3">
                        <h4 className="font-semibold text-sm text-foreground mb-2">뉴스 임팩트 요약</h4>
                        <StreamingText
                          key={`${selectedEventId ?? 'news-impact-inline'}-impact`}
                          text={selectedEventDetail.newsImpactSummary}
                          speed={24}
                          className="text-sm text-muted-foreground leading-relaxed"
                        />
                      </div>
                    )}

                    {/* Real news events from API */}
                    {selectedEventId && (() => {
                      const newsData = eventNewsData[selectedEventId]

                      if (newsData?.loading) {
                        return (
                          <div className="mt-3">
                            <h4 className="font-semibold text-sm text-foreground mb-2">관련 뉴스 검색 결과</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <span>뉴스를 검색하고 있습니다...</span>
                            </div>
                          </div>
                        )
                      }

                      if (newsData?.error) {
                        return (
                          <div className="mt-3">
                            <h4 className="font-semibold text-sm text-foreground mb-2">관련 뉴스 검색 결과</h4>
                            <div className="text-sm text-red-600 py-2">
                              오류: {newsData.error}
                            </div>
                          </div>
                        )
                      }

                      if (newsData?.events && newsData.events.length > 0) {
                        return (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-sm text-foreground">관련 뉴스 검색 결과</h4>
                            </div>
                            <div className="space-y-2">
                              {newsData.events.map((event, idx) => (
                                <a
                                  key={idx}
                                  href={event.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block p-3 rounded-lg border border-border bg-card hover:bg-muted/60 transition-colors">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                                        {event.title}
                                      </h5>
                                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                        {event.snippet}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{event.source}</span>
                                        {event.date && (
                                          <>
                                            <span>•</span>
                                            <span>{event.date}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div className="mt-3 text-sm text-muted-foreground">
                          해당 변곡점에서 검색된 최신 뉴스가 없습니다.
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">이벤트를 선택하면 상세 내용을 확인할 수 있습니다.</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


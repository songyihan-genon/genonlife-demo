import { useRef } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { StreamingText } from "@/components/ui/streaming-text"
import { SourceChips } from "@/components/ui/source-chips"
import { StockDetails, StockNews, WatchlistStock } from "@/types/domain"
import { hyundaiSummaryBullets } from "@/lib/mock/stock-data"
import { ObservationsList } from "./observations-list"
import { StreamingList } from "./streaming-list"

interface CatalystRightPanelProps {
  width: number
  stockDetails: StockDetails | null
  selectedStockInfo: WatchlistStock | undefined
  isStockDetailsLoading: boolean
  stockNews: StockNews | null
  isStockNewsLoading: boolean
  selectedStock: string
}

export function CatalystRightPanel({
  width,
  stockDetails,
  selectedStockInfo,
  isStockDetailsLoading,
  stockNews,
  isStockNewsLoading,
  selectedStock,
}: CatalystRightPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className="h-full min-h-0 overflow-hidden flex-shrink-0"
      style={{ width: `${width}px` }}
    >
      <Card className="bg-card h-full flex flex-col">
        {/* 리포트 콘텐츠 */}
        <CardContent className="p-0 flex-1 min-h-0">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-4 space-y-6">
              {/* 종목 프로필 & 메트릭 */}
              <section className="space-y-3">
                <h2 className="font-semibold text-lg">종목 프로필</h2>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="text-base font-semibold text-foreground flex items-center gap-2">
                        {stockDetails ? `${stockDetails.name} (${stockDetails.ticker})` : selectedStockInfo ? `${selectedStockInfo.name} (${selectedStockInfo.ticker})` : '종목 선택'}
                      </div>
                      {selectedStockInfo && (
                        <div className="text-sm text-muted-foreground">
                          {(selectedStockInfo.market || selectedStockInfo.sector || (stockDetails?.market_cap ? (stockDetails.market_cap / 100000000).toFixed(0) + '억원' : null) || '정보 없음')}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {isStockDetailsLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                          </div>
                        ) : (
                          stockDetails?.description ? (
                            <MarkdownRenderer
                              content={stockDetails.description}
                              className="text-sm text-muted-foreground [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4"
                            />
                          ) : (
                            '해당 종목의 프로필 정보가 없습니다.'
                          )
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {[
                        { label: '시가총액', value: stockDetails?.market_cap ? `${(stockDetails.market_cap / 1000000000000).toFixed(1)}조` : '-' },
                        { label: 'PER (TTM)', value: stockDetails?.per ? stockDetails.per.toFixed(2) : '-' },
                        { label: 'EPS (TTM)', value: stockDetails?.eps ? stockDetails.eps.toLocaleString() : '-' },
                        { label: 'ROE', value: stockDetails?.roe ? (stockDetails.roe * 100).toFixed(2) + '%' : '-' },
                      ].map((m, idx) => (
                        <div
                          key={`${m.label}-${idx}`}
                          className="p-3 rounded border border-border bg-muted/40"
                        >
                          <div className="text-xs text-muted-foreground">{m.label}</div>
                          <div className="text-sm font-semibold text-foreground">{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* 최근 이벤트 (뉴스) */}
              <section className="space-y-3">
                <h2 className="font-semibold text-lg">최근 이벤트</h2>
                <div className="p-4 rounded-lg border bg-card">
                  {isStockNewsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <div className="flex gap-2 pt-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                  ) : stockNews?.news && stockNews.news.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {stockNews.summary ? (
                          <StreamingText
                            text={stockNews.summary}
                            speed={30}
                          />
                        ) : (
                          "최근 주요 뉴스를 분석하고 있습니다."
                        )}
                      </div>
                      <div className="pt-1">
                        <SourceChips
                          sources={stockNews.news.map(n => ({ name: n.source, url: n.url }))}
                          className="flex-wrap"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      최근 3일간 검색된 주요 뉴스가 없습니다.
                    </div>
                  )}
                </div>
              </section>

              {/* 전체 요약 */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  AI 전망
                </h2>
                <div className="p-4 rounded-lg space-y-3 border border-primary/40 bg-muted/40 min-h-[160px]">
                  {selectedStock === '005380' && (
                    <>
                      <h3 className="font-semibold text-blue-900">주요 결론</h3>
                      <ObservationsList
                        items={hyundaiSummaryBullets}
                        withSources={true}
                        enableStreaming={true}
                      />
                      <div className="mt-3 p-3 bg-card rounded border border-border">
                        <h4 className="font-medium text-foreground mb-2">예상 시나리오(영향 범위 — 현대차/관련 JV)</h4>
                        <div className="text-sm space-y-1 text-foreground">
                          <p><span className="font-medium text-red-600">단기(1주):</span> 운영·물류 중단·주장·조사로 불확실성 급증 → 가동률·공급 차질로 실적·주가에 소폭~중간 하방 충격 (예: -3% ~ -8% 범위 가능, 이벤트 강도에 따라 다름).</p>
                          <p><span className="font-medium text-blue-600">중기(1–3개월):</span> 수사·비자·인력복구·공장 안전·허가 이슈로 가동 재개 지연 → 생산 일정·납기 재조정 및 비용 상승(대체인력·지연보상 등). (중기 영향: 매출/공급 차질로 -8% ~ -20% 시나리오).</p>
                          <p><span className="font-medium text-green-600">장기(6개월+):</span> 외교적 해결·현지 대체인력 확보·현지투자 확대 등이 정리되면 정상화 가능. 다만, 투자 신뢰·정책 리스크로 향후 미국 투자비용(리스크 프리미엄)·운영정책 재설계 필요 — 장기 영향은 회사 대응에 따라 +10%~+30% 또는 회복 지연 시 저성장 시나리오.</p>
                        </div>
                      </div>
                    </>
                  )}
                  {selectedStock === '005930' && (
                    <>
                      <h3 className="font-semibold text-blue-900">주요 결론</h3>
                      <StreamingList
                        items={[
                          "1. **외생 요인**(높음): 미·중 무역 갈등 심화, EU 규제 리스크",
                          "2. **기업 요인**(중간): Tesla 신모델 출시와 FSD 업데이트로 긍정적 모멘텀",
                          "3. **섹터 요인**(중간): 중국 EV 경쟁 심화, 글로벌 보조금 축소 우려",
                          "4. **매크로 요인**(낮음): 연준 금리 정책이 성장주 밸류에이션에 압박",
                          "5. **비정형 요인**(낮음): SNS 기대감과 Cybertruck 지연 루머 혼재"
                        ]}
                        className="space-y-2 text-sm text-blue-800 list-disc pl-5"
                        enableStreaming={true}
                      />
                      <div className="mt-3 p-3 bg-card rounded border">
                        <h4 className="font-medium text-gray-900 mb-2">예상 시나리오</h4>
                        <div className="text-sm space-y-1 text-[#1a2438]">
                          <p><span className="font-medium text-red-600">단기(1주):</span> -2~4% 조정 (금리 영향)</p>
                          <p><span className="font-medium text-blue-600">중기(1-3개월):</span> -10~15% 대기 (섹터 경쟁 심화)</p>
                          <p><span className="font-medium text-green-600">장기(6개월+):</span> +20~40% 상승 (기술 혁신과 시장 점유율 확대)</p>
                        </div>
                      </div>
                    </>
                  )}
                  {selectedStock !== '005380' && selectedStock !== '005930' && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-blue-900">주요 결론</h3>
                      <StreamingList
                        items={[
                          "1. 해당 종목의 AI 분석 리포트가 준비 중입니다.",
                          "2. 실시간 데이터 기반 자동 분석 기능이 곧 제공될 예정입니다."
                        ]}
                        className="space-y-2 text-sm text-blue-800 list-disc pl-5"
                        enableStreaming={true}
                      />
                    </div>
                  )}
                </div>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}


import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PenSquare, Eye, EyeOff } from "lucide-react"
import { WatchlistStock, StockQuote } from "@/types/domain"
import { formatPriceByCurrency, normalizeCurrencyValue } from "@/lib/mock/stock-data"
import { MACRO_INDICATORS } from "./constants"

interface CatalystLeftPanelProps {
  activeTab: 'stocks' | 'macro'
  onTabChange: (tab: 'stocks' | 'macro') => void
  
  // Stock Tab Props
  stockSearch: string
  onStockSearchChange: (value: string) => void
  isWatchlistLoading: boolean
  watchlistError: string | null
  filteredWatchlist: WatchlistStock[]
  selectedStock: string
  onStockSelect: (ticker: string) => void
  stockQuotes: Record<string, StockQuote>
  onOpenWatchlistEditor: () => void
  
  // Macro Tab Props
  macroSearch: string
  onMacroSearchChange: (value: string) => void
  selectedMacroIndicator: string
  onMacroSelect: (id: string) => void
  macroValues: Record<string, string>
  isMacroValuesLoading: boolean
  onToggleMacroVisibility: () => void
}

export function CatalystLeftPanel({
  activeTab,
  onTabChange,
  stockSearch,
  onStockSearchChange,
  isWatchlistLoading,
  watchlistError,
  filteredWatchlist,
  selectedStock,
  onStockSelect,
  stockQuotes,
  onOpenWatchlistEditor,
  macroSearch,
  onMacroSearchChange,
  selectedMacroIndicator,
  onMacroSelect,
  macroValues,
  isMacroValuesLoading,
  onToggleMacroVisibility,
}: CatalystLeftPanelProps) {
  return (
    <div className="w-[230px] h-full min-h-0 flex flex-col gap-4 overflow-hidden flex-shrink-0">
      <Card className="bg-card flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-0 flex-shrink-0">
          <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'stocks' | 'macro')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stocks" className="text-sm">종목</TabsTrigger>
              <TabsTrigger value="macro" className="text-sm">매크로 지표</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'stocks' | 'macro')} className="h-full flex flex-col">
            <TabsContent value="stocks" className="m-0 flex-1 min-h-0 flex flex-col">
              <div className="p-3 pb-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={stockSearch}
                    onChange={(e) => onStockSearchChange(e.target.value)}
                    placeholder="종목명/티커/시장 검색"
                    className="h-8 text-sm flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={onOpenWatchlistEditor}
                  >
                    <PenSquare className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  {isWatchlistLoading && <p className="text-blue-600">리스트를 불러오는 중입니다...</p>}
                  {watchlistError && <p className="text-red-500">{watchlistError}</p>}
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-0.5 p-3 pt-0">
                  {filteredWatchlist.length === 0 ? (
                    <div className="text-xs text-muted-foreground px-2 py-6 text-center">
                      검색 결과가 없습니다.
                    </div>
                  ) : (
                    filteredWatchlist.map((stock) => (
                      <Button
                        key={stock.id || stock.ticker}
                        variant="ghost"
                        className={`w-full justify-start text-left h-auto p-2 hover:bg-muted/60 ${selectedStock === stock.ticker ? 'bg-primary/5 border-primary/40 border' : ''
                          }`}
                        onClick={() => onStockSelect(stock.ticker)}
                      >
                        <div className="flex flex-col items-start w-full">
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-semibold text-foreground">{stock.ticker}</span>
                            <span className="text-xs text-muted-foreground">
                              {stock.market || stock.sector || '시장 미지정'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm text-muted-foreground truncate">{stock.name}</span>
                            <div className="flex items-center gap-2 ml-2">
                              {(() => {
                                const quote = stockQuotes[stock.ticker]
                                const fallbackPrice =
                                  stock.price == null
                                    ? null
                                    : typeof stock.price === 'number'
                                      ? stock.price
                                      : Number(String(stock.price).replace(/,/g, ""))
                                const price = typeof quote?.price === 'number' ? quote.price : fallbackPrice
                                const currency = normalizeCurrencyValue(stock.currency, stock.market)
                                const fallbackChange =
                                  stock.changePercent == null
                                    ? null
                                    : typeof stock.changePercent === 'number'
                                      ? stock.changePercent
                                      : Number(String(stock.changePercent).replace('%', ''))
                                const change = typeof quote?.changePercent === 'number'
                                  ? quote.changePercent
                                  : fallbackChange

                                return (
                                  <>
                                    <span className="text-xs font-medium text-foreground">
                                      {typeof price === 'number' && !Number.isNaN(price)
                                        ? formatPriceByCurrency(price, currency)
                                        : " - "}
                                    </span>
                                    <span
                                      className={`text-xs font-medium ${typeof change === 'number'
                                        ? change < 0
                                          ? 'text-red-600'
                                          : 'text-green-600'
                                        : 'text-muted-foreground'
                                        }`}
                                    >
                                      {typeof change === 'number' && !Number.isNaN(change)
                                        ? `${change.toFixed(2)}%`
                                        : "--"}
                                    </span>
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="macro" className="m-0 flex-1 min-h-0">
              <div className="p-3 pb-2 flex gap-2">
                <Input
                  value={macroSearch}
                  onChange={(e) => onMacroSearchChange(e.target.value)}
                  placeholder="지표 검색"
                  className="h-8 text-sm flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${selectedMacroIndicator ? "text-foreground" : "text-muted-foreground"}`}
                  onClick={onToggleMacroVisibility}
                  title={selectedMacroIndicator ? "지표 숨기기" : "지표 보이기"}
                >
                  {selectedMacroIndicator ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
              <ScrollArea className="h-[calc(100%-44px)]">
                <div className="space-y-0.5 p-3 pt-0">
                  {MACRO_INDICATORS
                    .filter((indicator) => {
                      if (!macroSearch.trim()) return true
                      const q = macroSearch.trim().toLowerCase()
                      return (
                        indicator.id.toLowerCase().includes(q) ||
                        indicator.name.toLowerCase().includes(q)
                      )
                    })
                    .map((indicator) => (
                      <Button
                        key={indicator.id}
                        variant="ghost"
                        className={`w-full justify-between p-2 h-auto hover:bg-muted/60 ${selectedMacroIndicator === indicator.id ? 'bg-primary/5 border-primary/40 border' : ''
                          }`}
                        onClick={() => onMacroSelect(indicator.id)}
                      >
                        <div className="text-left flex-1">
                          <div className="font-medium text-sm text-foreground">{indicator.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {isMacroValuesLoading 
                              ? "로딩 중..." 
                              : macroValues[indicator.id] || "-"}
                          </div>
                        </div>
                      </Button>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}


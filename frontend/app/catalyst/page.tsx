"use client"

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

import {
  WatchlistStock,
  EventNewsData,
  StockQuote,
  StockDataPoint,
  StockDetails,
  StockNews
} from "@/types/domain"

import {
  samsungUniverseStocks,
  createDefaultWatchlist,
  usdKrwRateMap,
  ensureCurrencyOnStocks,
} from "@/lib/mock/stock-data"

import { computeInflectionLines } from '@/lib/inflection'
import { type ChartInflectionLine } from '@/components/lightweight-candlestick-chart'

// New Components
import { ResizeHandle } from '@/components/catalyst/resize-handle'
import { WatchlistEditorDialog } from '@/components/catalyst/watchlist-editor-dialog'
import { CatalystLeftPanel } from '@/components/catalyst/catalyst-left-panel'
import { CatalystRightPanel } from '@/components/catalyst/catalyst-right-panel'
import { CatalystChartPanel, EventDetail } from '@/components/catalyst/catalyst-chart-panel'
import { MACRO_INDICATORS } from '@/components/catalyst/constants'

export default function CorrelationAnalysisAdvancedPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const userId = user?.id ?? null
  
  // UI State
  const [rightPanelWidth, setRightPanelWidth] = useState(380)
  const [leftPanelTab, setLeftPanelTab] = useState<'stocks' | 'macro'>('stocks')
  const [isDragging, setIsDragging] = useState<'right' | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  
  // Search State
  const [stockSearch, setStockSearch] = useState("")
  const [macroSearch, setMacroSearch] = useState("")
  
  // Selection State
  const [selectedStock, setSelectedStock] = useState('005380') // 기본값: 현대차
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedMacroIndicator, setSelectedMacroIndicator] = useState('US10Y') // 기본값: 미국채 10년물 금리
  const [lastSelectedMacroIndicator, setLastSelectedMacroIndicator] = useState<string | null>(null)

  // Data State
  const [stockQuotes, setStockQuotes] = useState<Record<string, StockQuote>>({})
  const [stockHistoricalData, setStockHistoricalData] = useState<StockDataPoint[]>([])
  const [stockInflectionLines, setStockInflectionLines] = useState<ChartInflectionLine[]>([])
  const [isStockHistoryLive, setIsStockHistoryLive] = useState(false)
  const [isStockHistoryLoading, setIsStockHistoryLoading] = useState(false)
  const [stockHistoryError, setStockHistoryError] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)

  // Macro Data State
  const [macroSeriesData, setMacroSeriesData] = useState<{ time: string, value: number }[]>([])
  const [isMacroLoading, setIsMacroLoading] = useState(false)
  const [macroValues, setMacroValues] = useState<Record<string, string>>({})
  const [isMacroValuesLoading, setIsMacroValuesLoading] = useState(false)

  // Watchlist State
  const [userWatchlist, setUserWatchlist] = useState<WatchlistStock[]>(() => createDefaultWatchlist())
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false)
  const [watchlistServerError, setWatchlistServerError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Stock Details & News State
  const [eventNewsData, setEventNewsData] = useState<Record<string, EventNewsData>>({})
  const [stockDetails, setStockDetails] = useState<StockDetails | null>(null)
  const [isStockDetailsLoading, setIsStockDetailsLoading] = useState(false)
  const [stockNews, setStockNews] = useState<StockNews | null>(null)
  const [isStockNewsLoading, setIsStockNewsLoading] = useState(false)

  const stockMetaMap = useMemo(() => {
    const map = new Map<string, WatchlistStock>()
    userWatchlist.forEach(stock => {
      map.set(stock.ticker, stock)
    })
    samsungUniverseStocks.forEach(stock => {
      if (!map.has(stock.ticker)) {
        map.set(stock.ticker, stock)
      }
    })
    return map
  }, [userWatchlist])

  // --- Effects ---

  // 1. Fetch Stock Details
  useEffect(() => {
    if (!selectedStock) return

    const fetchDetails = async () => {
      setIsStockDetailsLoading(true)
      setStockDetails(null)
      setStockNews(null)
      setIsStockNewsLoading(true)

      let stockName = ""

      // 1. Fetch Stock Info
      try {
        const res = await fetch(`/api/stocks/${selectedStock}`)
        if (res.ok) {
          const data = await res.json()
          setStockDetails(data)
          stockName = data.name
        } else {
          console.error("Failed to fetch stock details")
        }
      } catch (e) {
        console.error("Error fetching stock info:", e)
      }

      // 2. Fetch Stock News
      const fallbackName = stockMetaMap.get(selectedStock)?.name || ""
      const nameToUse = stockName || fallbackName

      try {
        const newsRes = await fetch(`/api/stocks/${selectedStock}/news?name=${encodeURIComponent(nameToUse)}`)
        if (newsRes.ok) {
          const newsData = await newsRes.json()
          setStockNews(newsData)
        }
      } catch (error) {
        console.error("Error fetching stock news:", error)
      } finally {
        setIsStockDetailsLoading(false)
        setIsStockNewsLoading(false)
      }
    }

    fetchDetails()
  }, [selectedStock, stockMetaMap])

  // 2. Fetch Macro History
  useEffect(() => {
    if (!selectedMacroIndicator) {
      setMacroSeriesData([])
      return
    }

    const fetchMacroData = async () => {
      setIsMacroLoading(true)
      try {
        const res = await fetch(`/api/macro/${selectedMacroIndicator}/history?days=45`)
        if (res.ok) {
          const data = await res.json()
          setMacroSeriesData(data)
        } else {
          setMacroSeriesData([])
        }
      } catch (e) {
        console.error("Error fetching macro data:", e)
        setMacroSeriesData([])
      } finally {
        setIsMacroLoading(false)
      }
    }

    fetchMacroData()
  }, [selectedMacroIndicator])

  // 3. Fetch Latest Macro Values
  useEffect(() => {
    const fetchLatestValues = async () => {
      setIsMacroValuesLoading(true)
      const results: Record<string, string> = {}
      
      try {
        await Promise.all(MACRO_INDICATORS.map(async (indicator) => {
          try {
            const res = await fetch(`/api/macro/${indicator.id}/history?days=10`)
            if (res.ok) {
              const data = await res.json()
              if (Array.isArray(data) && data.length > 0) {
                const lastItem = data[data.length - 1]
                let formattedValue = String(lastItem.value)
                
                if (indicator.format === 'percent') {
                  formattedValue = `${lastItem.value.toFixed(2)}%`
                } else if (indicator.format === 'currency') {
                  formattedValue = lastItem.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                } else if (indicator.format === 'dollar') {
                  formattedValue = `$${lastItem.value.toFixed(2)}`
                } else if (indicator.format === 'number') {
                  formattedValue = lastItem.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                } else if (indicator.format === 'billion') {
                  formattedValue = `$${lastItem.value.toLocaleString()}B`
                }
                
                results[indicator.id] = formattedValue
              }
            }
          } catch (e) {
            // Ignore
          }
        }))
        
        setMacroValues(results)
      } catch (e) {
        console.error("Error fetching macro values", e)
      } finally {
        setIsMacroValuesLoading(false)
      }
    }
    
    fetchLatestValues()
  }, [])

  // 4. Initial Watchlist Selection
  useEffect(() => {
    if (!userWatchlist.length) return
    if (!userWatchlist.some(stock => stock.ticker === selectedStock)) {
      setSelectedStock(userWatchlist[0].ticker)
    }
  }, [userWatchlist, selectedStock])

  // 5. Fetch Watchlist
  useEffect(() => {
    let cancelled = false

    if (!userId) {
      setUserWatchlist(createDefaultWatchlist())
      setWatchlistServerError(null)
      return
    }

    const fetchWatchlist = async () => {
      setIsWatchlistLoading(true)
      setWatchlistServerError(null)
      try {
        const res = await fetch(`/watchlists/${userId}`, { cache: "no-store" })
        if (!res.ok) throw new Error(`failed to load watchlist: ${res.status}`)
        
        const payload = await res.json()
        const stocks = Array.isArray(payload?.stocks) ? payload.stocks as WatchlistStock[] : []
        if (!cancelled) {
          const normalizedStocks = stocks.length ? ensureCurrencyOnStocks(stocks) : createDefaultWatchlist()
          setUserWatchlist(normalizedStocks)
        }
      } catch (error) {
        console.error("watchlist fetch error", error)
        if (!cancelled) {
          setWatchlistServerError("종목 리스트를 불러오지 못했습니다. 기본 리스트를 표시합니다.")
          setUserWatchlist(createDefaultWatchlist())
        }
      } finally {
        if (!cancelled) setIsWatchlistLoading(false)
      }
    }

    fetchWatchlist()
    return () => { cancelled = true }
  }, [userId])

  // 6. Fetch Quotes
  useEffect(() => {
    const tickers = Array.from(new Set(userWatchlist.map((s) => s.ticker))).filter(Boolean)
    if (!tickers.length) return

    const fetchQuotes = async () => {
      try {
        const res = await fetch("/api/stock/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers }),
        })
        if (res.ok) {
          const data: Record<string, StockQuote> = await res.json()
          setStockQuotes(data)
        }
      } catch (error) {
        console.error("stock quotes request error", error)
      }
    }

    fetchQuotes()
  }, [userWatchlist])

  // 7. Fetch Stock History
  useEffect(() => {
    let cancelled = false
    if (!selectedStock) return

    const fetchHistory = async () => {
      setIsStockHistoryLoading(true)
      setStockHistoryError(null)
      setStockHistoricalData([])
      setStockInflectionLines([])
      setIsStockHistoryLive(false)
      setSelectedEventId(null)

      try {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 45)
        const endDate = new Date()
        const params = new URLSearchParams({
          symbol: selectedStock,
          page_size: '300',
          date_from: startDate.toISOString().split('T')[0],
          date_to: endDate.toISOString().split('T')[0],
        })
        const res = await fetch(`/api/stock/history?${params.toString()}`, { cache: "no-store" })

        if (!res.ok) throw new Error(`history request failed: ${res.status}`)

        const payload = await res.json()
        const rows = Array.isArray(payload?.data) ? (payload.data as StockDataPoint[]) : []
        const inflectionFromApi: ChartInflectionLine[] = Array.isArray(payload?.inflectionLines)
          ? payload.inflectionLines
          : []

        if (!cancelled) {
          if (rows.length) {
            const normalized = rows.map((row) => ({
              ...row,
              price: (typeof row.price === 'number' ? row.price : row.close) ?? 0,
              usdkrw: row.usdkrw ?? usdKrwRateMap[row.date],
            }))
            setStockHistoricalData(normalized)
            setStockInflectionLines(inflectionFromApi)
            setIsStockHistoryLive(true)
            setIsUsingFallback(false)
          } else {
            setStockHistoricalData([])
            setStockInflectionLines([])
            setIsStockHistoryLive(true)
            setIsUsingFallback(false)
            setStockHistoryError("표시할 주가 데이터가 없습니다.")
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("failed to fetch stock history", error)
          setStockHistoricalData([])
          setStockInflectionLines([])
          setIsStockHistoryLive(true)
          setStockHistoryError("주가 데이터를 불러오는데 실패했습니다.")
          setIsUsingFallback(false)
        }
      } finally {
        if (!cancelled) setIsStockHistoryLoading(false)
      }
    }

    fetchHistory()
    return () => { cancelled = true }
  }, [selectedStock])

  // 8. Resize Logic
  useEffect(() => {
    setIsMounted(true)
  }, []);

  useEffect(() => {
    if (!isMounted) return
    const calculateDimensions = () => {
      const availableWidth = window.innerWidth - 230 - 48
      const targetRight = Math.floor(availableWidth * 0.35)
      const newRightPanelWidth = Math.max(300, targetRight)
      setRightPanelWidth(newRightPanelWidth)
    }
    calculateDimensions()
    window.addEventListener('resize', calculateDimensions)
    return () => window.removeEventListener('resize', calculateDimensions)
  }, [isMounted]);

  // --- Handlers ---

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging('right')
    const handleMouseMove = (e: MouseEvent) => {
      const availableWidth = window.innerWidth - 230 - 48
      const newWidth = Math.max(300, Math.min(availableWidth - 300, window.innerWidth - e.clientX - 24))
      setRightPanelWidth(newWidth)
    }
    const handleMouseUp = () => {
      setIsDragging(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  const handleSaveWatchlist = async (newStocks: WatchlistStock[]) => {
    if (userId) {
      const response = await fetch(`/watchlists/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stocks: newStocks }),
      })
      
      const text = await response.text()
      let payload: any = null
      try { payload = JSON.parse(text) } catch {}

      if (!response.ok) {
        const detail = (payload?.detail || payload?.error) || text || `watchlist save failed (${response.status})`
        throw new Error(detail as string)
      }
      
      if (payload?.stocks && Array.isArray(payload.stocks)) {
        setUserWatchlist(ensureCurrencyOnStocks(payload.stocks))
      }
    } else {
       // No user, just update local state
       setUserWatchlist(ensureCurrencyOnStocks(newStocks))
    }

    setIsEditDialogOpen(false)
    toast({
      title: "종목 리스트가 저장되었습니다.",
      description: "왼쪽 종목 패널이 최신 목록으로 갱신되었습니다.",
    })
  }

  const handleToggleMacroVisibility = useCallback(() => {
    if (selectedMacroIndicator) {
      setLastSelectedMacroIndicator(selectedMacroIndicator)
      setSelectedMacroIndicator("")
    } else {
      if (lastSelectedMacroIndicator) {
        setSelectedMacroIndicator(lastSelectedMacroIndicator)
      } else {
        setSelectedMacroIndicator("US10Y")
      }
    }
  }, [selectedMacroIndicator, lastSelectedMacroIndicator])

  const handleEventSelect = useCallback((eventId: string) => {
    setSelectedEventId((prev) => (prev === eventId ? null : eventId))
  }, [])

  const fetchEventNews = useCallback(async (date: string, stockName: string, stockCode: string, eventId: string) => {
    if (eventNewsData[eventId]?.events.length > 0 || eventNewsData[eventId]?.loading) return

    setEventNewsData(prev => ({
      ...prev,
      [eventId]: { events: [], cached: false, loading: true, error: null, summary: null }
    }))

    try {
      const response = await fetch('/api/events/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, stock_name: stockName, stock_code: stockCode })
      })

      if (!response.ok) throw new Error(`Failed to fetch events: ${response.statusText}`)
      const data = await response.json()

      setEventNewsData(prev => ({
        ...prev,
        [eventId]: {
          events: data.events || [],
          cached: data.cached || false,
          loading: false,
          error: null,
          summary: typeof data.summary === 'string' ? data.summary : null,
        }
      }))
    } catch (error) {
      setEventNewsData(prev => ({
        ...prev,
        [eventId]: {
          events: [], cached: false, loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch events',
          summary: null,
        }
      }))
    }
  }, [eventNewsData])

  // --- Computed Values ---

  const filteredWatchlist = useMemo(() => {
    const query = stockSearch.trim().toLowerCase()
    if (!query) return userWatchlist
    return userWatchlist.filter(stock => {
      const ticker = stock.ticker?.toLowerCase() ?? ""
      const name = stock.name?.toLowerCase() ?? ""
      const sector = stock.sector?.toLowerCase() ?? ""
      const market = stock.market?.toLowerCase() ?? ""
      return ticker.includes(query) || name.includes(query) || sector.includes(query) || market.includes(query)
    })
  }, [stockSearch, userWatchlist])

  const candleData = useMemo(() => {
    const result: any[] = []
    let prevClose: number | null = null

    for (const point of stockHistoricalData) {
      const close = typeof point.close === 'number' ? point.close : point.price
      if (typeof close !== 'number' || Number.isNaN(close)) continue

      const open = typeof point.open === 'number' ? point.open : prevClose ?? close
      const baseVolatility = Math.max(close * 0.005, 1000)
      const high = typeof point.high === 'number' ? point.high : Math.max(open, close) + baseVolatility * 0.5
      const low = typeof point.low === 'number' ? point.low : Math.min(open, close) - baseVolatility * 0.5
      
      result.push({
        ...point,
        open, close, high, low,
        isUp: close >= open,
      })
      prevClose = close
    }
    return result
  }, [stockHistoricalData])

  const [priceDomainMin, priceDomainMax] = useMemo(() => {
    if (!candleData.length) return [0, 0]
    let minLow = Number.POSITIVE_INFINITY
    let maxHigh = Number.NEGATIVE_INFINITY
    for (const point of candleData) {
      if (typeof point.low === 'number' && !Number.isNaN(point.low)) minLow = Math.min(minLow, point.low)
      if (typeof point.high === 'number' && !Number.isNaN(point.high)) maxHigh = Math.max(maxHigh, point.high)
    }
    
    const quote = stockQuotes[selectedStock]
    if (!Number.isFinite(minLow) || !Number.isFinite(maxHigh) || minLow === Infinity || maxHigh === -Infinity) {
      const fallback = quote?.price ?? candleData[candleData.length - 1].close ?? 0
      return [fallback * 0.8, fallback * 1.2]
    }
    return [minLow * 0.95, maxHigh * 1.05]
  }, [candleData, stockQuotes, selectedStock])

  const priceAxisRange = candleData.length ? { min: priceDomainMin, max: priceDomainMax } : null

  const inflectionLines = useMemo(() => {
    if (stockInflectionLines.length) return stockInflectionLines
    return computeInflectionLines(candleData)
  }, [candleData, stockInflectionLines])

  const candlestickSeriesData = useMemo(() => 
    candleData.map((point) => ({
      time: point.date,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
    })),
  [candleData])

  const macroLineSeries = useMemo(() => {
    if (!macroSeriesData.length) return undefined
    return macroSeriesData
  }, [macroSeriesData])

  const dynamicEventTimeline = useMemo(() => {
    if (inflectionLines.length === 0) return []
    return inflectionLines.map((inflection) => {
      const date = inflection.time
      const direction = inflection.direction
      const dateObj = new Date(date)
      const month = dateObj.getMonth() + 1
      const day = dateObj.getDate()
      const shortLabel = `${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')}`
      return {
        id: `inflection-${date}`,
        date: date,
        label: `${month}월 ${day}일 ${direction === 'up' ? '상승' : '하락'}`,
        shortLabel: `${shortLabel} ${direction === 'up' ? '↑' : '↓'}`,
        tone: direction as 'up' | 'down'
      }
    })
  }, [inflectionLines])

  const hasDynamicEvents = dynamicEventTimeline.length > 0

  const selectedEventDetail: EventDetail | null = useMemo(() => {
    if (!selectedEventId) return null
    const event = dynamicEventTimeline.find(e => e.id === selectedEventId)
    if (!event) return null
    
    const newsData = eventNewsData[selectedEventId]
    const eventCount = newsData?.events?.length ?? 0
    const observationEvents = newsData?.events?.slice(0, 3) ?? []
    const sourceEvents = newsData?.events?.slice(0, 5) ?? []

    const summaryText = newsData?.summary && newsData.summary.trim().length ? newsData.summary.trim() : null
    const stockLabel = stockMetaMap.get(selectedStock)?.name ?? '해당 종목'
    
    const ensureSentence = (text: string | null | undefined) => {
      if (!text) return ''
      const trimmed = text.trim()
      if (!trimmed.length) return ''
      return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
    }

    const fallbackNewsLead = observationEvents.length > 0
      ? `${observationEvents[0].source} 기사 '${observationEvents[0].title}'을 중심으로 정리된 내용입니다`
      : `${event.date} 변곡점에 대한 관련 뉴스를 정리하고 있습니다`
    
    const newsImpactSummary = [
      ensureSentence(summaryText ?? fallbackNewsLead),
      observationEvents.length > 1 ? ensureSentence(`추가 기사(${observationEvents.slice(1, 3).map(item => item.source).join(', ')})도 같은 방향성을 전합니다`) : '',
      ensureSentence(event.tone === 'up' ? `${stockLabel} 주가에는 수급과 심리에 긍정적인 모멘텀으로 작용할 가능성이 큽니다` : `${stockLabel} 주가에는 실적과 심리에 하방 압력으로 작용해 단기 변동성을 키울 수 있습니다`)
    ].filter(Boolean).join(' ')

    return {
      title: event.label,
      summary: summaryText ? summaryText : eventCount > 0 ? `${event.date} 날짜에 ${eventCount}개의 관련 뉴스를 확인했습니다.` : `${event.date} 날짜의 변곡점입니다. 관련 뉴스를 검색 중입니다.`,
      observations: observationEvents.map(newsEvent => ({
        text: newsEvent.title,
        sources: [{ name: newsEvent.source, url: newsEvent.url }]
      })) || [],
      insights: [],
      tone: event.tone,
      newsImpactSummary: newsImpactSummary || null,
      sources: sourceEvents.map(newsEvent => ({ name: newsEvent.source, url: newsEvent.url })) || []
    }
  }, [selectedEventId, dynamicEventTimeline, eventNewsData, selectedStock, stockMetaMap])

  // Auto-select logic for events
  useEffect(() => {
    if (dynamicEventTimeline.length > 0) {
      setSelectedEventId(prev => {
        if (prev && dynamicEventTimeline.some(event => event.id === prev)) return prev
        return null
      })
    } else {
      setSelectedEventId(null)
    }
  }, [selectedStock, dynamicEventTimeline])

  // Fetch news on selection
  useEffect(() => {
    if (!selectedEventId) return
    const event = dynamicEventTimeline.find(e => e.id === selectedEventId)
    if (!event) return
    const stock = stockMetaMap.get(selectedStock)
    const stockName = stock?.name || selectedStock 
    fetchEventNews(event.date, stockName, selectedStock, event.id)
  }, [selectedEventId, selectedStock, dynamicEventTimeline, fetchEventNews, stockMetaMap])

  const stockHistoryStatusMessage = isStockHistoryLoading
    ? '실제 주가 데이터를 불러오는 중입니다...'
    : stockHistoryError
      ? '실제 주가 데이터를 불러오지 못했습니다.'
      : isUsingFallback
        ? 'API 연결 실패로 시뮬레이션 데이터를 표시합니다.'
        : !stockHistoricalData.length
          ? '표시할 실제 주가 데이터가 없습니다.'
          : null

  const stockHistoryRangeLabel = useMemo(() => {
    if (!isStockHistoryLive || !stockHistoricalData.length) return null
    const first = stockHistoricalData[0]?.date
    const last = stockHistoricalData[stockHistoricalData.length - 1]?.date
    if (!first || !last) return null
    const fmt = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-')
      return (!y || !m || !d) ? dateStr : `${m}.${d}`
    }
    return `${fmt(first)} ~ ${fmt(last)}`
  }, [stockHistoricalData, isStockHistoryLive])

  const shouldShowStockSkeleton = isStockHistoryLoading || (!isStockHistoryLoading && !stockHistoricalData.length && !stockHistoryError)
  const eventTimelineEmptyMessage = stockHistoryError
    ? '주가 데이터를 불러오지 못해 변곡점을 계산할 수 없습니다.'
    : '표시할 변곡점이 없습니다. 데이터 범위를 넓혀 다시 시도해주세요.'

  return (
    <>
      <WatchlistEditorDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        initialWatchlist={userWatchlist}
        onSave={handleSaveWatchlist}
      />

      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-0">
          <h2 className="text-3xl font-bold text-foreground mb-2">상관관계 분석</h2>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden p-6 bg-background">
          <div className="h-full flex">
            {/* Left Panel */}
            <CatalystLeftPanel
              activeTab={leftPanelTab}
              onTabChange={setLeftPanelTab}
              stockSearch={stockSearch}
              onStockSearchChange={setStockSearch}
              isWatchlistLoading={isWatchlistLoading}
              watchlistError={watchlistServerError}
              filteredWatchlist={filteredWatchlist}
              selectedStock={selectedStock}
              onStockSelect={setSelectedStock}
              stockQuotes={stockQuotes}
              onOpenWatchlistEditor={() => setIsEditDialogOpen(true)}
              macroSearch={macroSearch}
              onMacroSearchChange={setMacroSearch}
              selectedMacroIndicator={selectedMacroIndicator}
              onMacroSelect={setSelectedMacroIndicator}
              macroValues={macroValues}
              isMacroValuesLoading={isMacroValuesLoading}
              onToggleMacroVisibility={handleToggleMacroVisibility}
            />

            {/* Center Panel */}
            <CatalystChartPanel
              selectedStockInfo={stockMetaMap.get(selectedStock)}
              stockHistoryRangeLabel={stockHistoryRangeLabel}
              stockHistoryStatusMessage={stockHistoryStatusMessage}
              shouldShowStockSkeleton={shouldShowStockSkeleton}
              candlestickSeriesData={candlestickSeriesData}
              macroLineSeries={macroLineSeries}
              priceAxisRange={priceAxisRange}
              inflectionLines={inflectionLines}
              hasDynamicEvents={hasDynamicEvents}
              eventTimelineEmptyMessage={eventTimelineEmptyMessage}
              dynamicEventTimeline={dynamicEventTimeline}
              selectedEventId={selectedEventId}
              onEventSelect={handleEventSelect}
              selectedEventDetail={selectedEventDetail}
              eventNewsData={eventNewsData}
            />

            {/* Resize Handle */}
            <ResizeHandle
              onMouseDown={handleMouseDown}
              className="mx-2"
              direction="vertical"
            />

            {/* Right Panel */}
            <CatalystRightPanel
              width={rightPanelWidth}
              stockDetails={stockDetails}
              selectedStockInfo={stockMetaMap.get(selectedStock)}
              isStockDetailsLoading={isStockDetailsLoading}
              stockNews={stockNews}
              isStockNewsLoading={isStockNewsLoading}
              selectedStock={selectedStock}
            />
          </div>
        </div>
      </div>
    </>
  )
}

import { NextRequest, NextResponse } from "next/server"
import { getRedisClient } from "@/lib/redis"
import { computeInflectionLines, type InflectionLine } from "@/lib/inflection"

export const dynamic = "force-dynamic"

type StockHistoryPoint = {
  date: string
  price: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
  value?: number
  change?: number
  changePercent?: number
}

const DEFAULT_WINDOW_DAYS = 45
const getTodayDate = () => new Date().toISOString().split("T")[0]
const MAX_PAGE_SIZE = 1000
const CACHE_TTL_SECONDS = 3600 // 1 hour cache

type StockHistoryResponse = {
  data: StockHistoryPoint[]
  inflectionLines: InflectionLine[]
}

const toNumber = (value: unknown): number | null => {
  if (value == null) return null
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return null
    const normalized = trimmed.replace(/,/g, "")
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const pickNumber = (...candidates: unknown[]): number | undefined => {
  for (const candidate of candidates) {
    const parsed = toNumber(candidate)
    if (parsed != null && !Number.isNaN(parsed)) {
      return parsed
    }
  }
  return undefined
}

const normalizeDate = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return null
    const simple = trimmed.split("T")[0]
    if (/^\d{4}-\d{2}-\d{2}$/.test(simple)) {
      return simple
    }
    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0]
    }
    return null
  }
  if (typeof value === "number") {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0]
    }
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split("T")[0]
  }
  return null
}

const normalizeHistoryItem = (item: Record<string, unknown>): StockHistoryPoint | null => {
  const date =
    normalizeDate(item.date) ??
    normalizeDate(item.trading_date) ??
    normalizeDate(item.base_date) ??
    normalizeDate(item.price_date)

  if (!date) return null

  const close =
    pickNumber(item.close, item.close_price, item.closing_price, item.price, item.last) ??
    pickNumber(item.trade_price)

  if (close == null) return null

  const open = pickNumber(item.open, item.open_price, item.begin, item.begin_price) ?? close
  const high = pickNumber(item.high, item.high_price, item.max_price) ?? Math.max(open, close)
  const low = pickNumber(item.low, item.low_price, item.min_price) ?? Math.min(open, close)
  const volume = pickNumber(item.volume, item.trading_volume, item.volume_qty, item.qty)
  const value = pickNumber(item.value, item.transaction_value, item.trading_value, item.amount)
  const change = pickNumber(item.change, item.change_price)
  const changePercent = pickNumber(
    item.change_rate,
    item.changePercent,
    item.change_pct,
    item.percent_change,
  )

  const point: StockHistoryPoint = {
    date,
    price: close,
    close,
    open,
    high,
    low,
  }

  if (typeof volume === "number" && !Number.isNaN(volume)) {
    point.volume = volume
  }
  if (typeof value === "number" && !Number.isNaN(value)) {
    point.value = value
  }
  if (typeof change === "number" && !Number.isNaN(change)) {
    point.change = change
  }
  if (typeof changePercent === "number" && !Number.isNaN(changePercent)) {
    point.changePercent = changePercent
  }

  return point
}

const getDefaultDateFrom = () => {
  const date = new Date()
  date.setDate(date.getDate() - DEFAULT_WINDOW_DAYS)
  return date.toISOString().split("T")[0]
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get("symbol")

    if (!symbol) {
      return NextResponse.json({ error: "symbol is required" }, { status: 400 })
    }

    const apiKey = process.env.DEEPSEARCH_API_KEY
    if (!apiKey) {
      console.error("DEEPSEARCH_API_KEY is not set")
      return NextResponse.json({ error: "server config error" }, { status: 500 })
    }

    const pageSizeParam = Number(searchParams.get("page_size"))
    const pageSize = Number.isFinite(pageSizeParam)
      ? Math.max(1, Math.min(MAX_PAGE_SIZE, Math.floor(pageSizeParam)))
      : 120

    const pageParam = Number(searchParams.get("page"))
    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1

    const period = searchParams.get("period")
    const dateFrom = searchParams.get("date_from") ?? getDefaultDateFrom()
    const dateTo = searchParams.get("date_to") ?? getTodayDate()

    // Generate cache key based on symbol and date range
    const cacheKey = `stock:history:${symbol}:${dateFrom}:${dateTo}:${pageSize}`

    // Try to get from Redis cache
    const redis = getRedisClient()
    if (redis) {
      try {
        const cachedData = await redis.get(cacheKey)
        if (cachedData) {
          console.log(`Cache hit for stock history: ${cacheKey}`)
          const parsed = JSON.parse(cachedData)
          return NextResponse.json(parsed)
        }
      } catch (cacheError) {
        console.error("Redis cache read error:", cacheError)
        // Continue to fetch from API if cache fails
      }
    }

    const query = new URLSearchParams()
    query.set("api_key", apiKey)
    query.set("page", String(page))
    query.set("page_size", String(pageSize))
    if (period) {
      query.set("period", period)
    } else if (dateFrom) {
      query.set("date_from", dateFrom)
    }
    query.set("date_to", dateTo)

    const url = `https://api-v2.deepsearch.com/v2/companies/${encodeURIComponent(
      symbol,
    )}/stock?${query.toString()}`

    const res = await fetch(url)
    if (!res.ok) {
      console.error("DeepSearch stock history error", symbol, res.status)
      return NextResponse.json(
        { error: "failed to fetch stock history" },
        { status: res.status || 502 },
      )
    }

    const payload: any = await res.json()
    const rows: Record<string, unknown>[] = Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload?.data)
        ? payload.data
        : []

    const normalized = rows
      .map((row) => normalizeHistoryItem(row))
      .filter((point): point is StockHistoryPoint => point !== null)
      .sort((a, b) => a.date.localeCompare(b.date))

    const inflectionLines = computeInflectionLines(normalized)
    const response: StockHistoryResponse = { data: normalized, inflectionLines }

    // Cache the result in Redis
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(response))
        console.log(`Cached stock history: ${cacheKey} (TTL: ${CACHE_TTL_SECONDS}s)`)
      } catch (cacheError) {
        console.error("Redis cache write error:", cacheError)
        // Continue even if caching fails
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("stock/history handler error", error)
    return NextResponse.json({ error: "internal server error" }, { status: 500 })
  }
}

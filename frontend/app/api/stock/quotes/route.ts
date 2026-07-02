import { NextRequest, NextResponse } from "next/server"

type StockQuote = {
  price: number
  changePercent: number
}

type CachedQuote = {
  quote: StockQuote
  fetchedAt: number
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1시간
const quoteCache: Record<string, CachedQuote> = {}

const isFresh = (cached?: CachedQuote) =>
  !!cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS

const toNumber = (value: unknown): number => {
  if (value == null) return NaN
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const trimmed = value.replace(/[%\s,]/g, "")
    const n = parseFloat(trimmed)
    return Number.isNaN(n) ? NaN : n
  }
  return NaN
}

export async function POST(req: NextRequest) {
  try {
    const { tickers } = await req.json()

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ error: "tickers required" }, { status: 400 })
    }

    const apiKey = process.env.DEEPSEARCH_API_KEY
    if (!apiKey) {
      console.error("DEEPSEARCH_API_KEY is not set")
      return NextResponse.json({ error: "server config error" }, { status: 500 })
    }

    const result: Record<string, StockQuote> = {}

    for (const rawTicker of tickers as string[]) {
      const cached = quoteCache[rawTicker]
      if (isFresh(cached)) {
        result[rawTicker] = cached.quote
        continue
      }

      const symbol = rawTicker

      try {
        // 최근 2개 일자(오늘 + 전일)를 가져와서 전일대비 등락률을 계산
        const url = `https://api-v2.deepsearch.com/v2/companies/${encodeURIComponent(
          symbol
        )}/stock?api_key=${encodeURIComponent(apiKey)}&page_size=2&page=1`

        const res = await fetch(url)
        if (!res.ok) {
          console.error("DeepSearch response not ok", symbol, res.status)
          continue
        }

        const data: any = await res.json()

        const items = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.data)
          ? data.data
          : []

        if (!items.length) {
          console.warn("DeepSearch returned no items", symbol, data)
          continue
        }

        const latest = items[0]
        const previous = items[1]

        const latestPriceRaw =
          latest.close ??
          latest.close_price ??
          latest.price ??
          latest.last ??
          null

        const latestPrice = toNumber(latestPriceRaw)

        let changePercent: number

        if (previous) {
          const prevPriceRaw =
            previous.close ??
            previous.close_price ??
            previous.price ??
            previous.last ??
            null

          const prevPrice = toNumber(prevPriceRaw)

          if (!Number.isNaN(latestPrice) && !Number.isNaN(prevPrice) && prevPrice !== 0) {
            changePercent = ((latestPrice - prevPrice) / prevPrice) * 100
          } else {
            const changeField =
              latest.change_rate ??
              latest.changePercent ??
              latest.change_pct ??
              latest.percent_change ??
              null
            const fallbackChange = toNumber(changeField)
            changePercent = Number.isNaN(fallbackChange) ? 0 : fallbackChange
          }
        } else {
          const changeField =
            latest.change_rate ??
            latest.changePercent ??
            latest.change_pct ??
            latest.percent_change ??
            null
          const fallbackChange = toNumber(changeField)
          changePercent = Number.isNaN(fallbackChange) ? 0 : fallbackChange
        }

        if (!Number.isNaN(latestPrice)) {
          const quote: StockQuote = {
            price: latestPrice,
            changePercent,
          }

          result[rawTicker] = quote
          quoteCache[rawTicker] = {
            quote,
            fetchedAt: Date.now(),
          }
        } else {
          console.warn("DeepSearch latest price is NaN", symbol, latest)
        }
      } catch (error) {
        console.error("DeepSearch fetch error", symbol, error)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("stock/quotes handler error", error)
    return NextResponse.json({ error: "internal server error" }, { status: 500 })
  }
}


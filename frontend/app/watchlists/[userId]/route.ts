import { NextRequest, NextResponse } from "next/server"
import { getResearchApiBaseUrl } from "@/lib/api-endpoints"
import { ensureCurrencyOnStocks, samsungUniverseStocks } from "@/lib/mock/stock-data"

const API_BASE_URL = getResearchApiBaseUrl()

type RouteContext = {
  params: { userId: string }
}

const parseResponse = async (response: Response) => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const FALLBACK_WATCHLIST = ensureCurrencyOnStocks(
  samsungUniverseStocks.map(stock => ({ ...stock, id: stock.id ?? `fallback-${stock.ticker}` }))
)

const fallbackResponse = () => ({
  stocks: FALLBACK_WATCHLIST,
})

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const userId = params?.userId
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  try {
    const response = await fetch(`${API_BASE_URL}/watchlists/user/${encodeURIComponent(userId)}`, {
      cache: "no-store",
    })
    const data = await parseResponse(response)

    if (!response.ok) {
      console.error("watchlists GET proxy failed with status", response.status)
      return NextResponse.json(fallbackResponse(), { status: 200 })
    }

    const stocks = Array.isArray(data?.stocks) ? ensureCurrencyOnStocks(data.stocks) : FALLBACK_WATCHLIST
    return NextResponse.json({ stocks }, { status: response.status })
  } catch (error) {
    console.error("watchlists GET proxy failed", error)
    return NextResponse.json(fallbackResponse(), { status: 200 })
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const userId = params?.userId
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  try {
    const payload = await req.text()
    const response = await fetch(`${API_BASE_URL}/watchlists/user/${encodeURIComponent(userId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    })
    const data = await parseResponse(response)
    return NextResponse.json(data ?? {}, { status: response.status })
  } catch (error) {
    console.error("watchlists PUT proxy failed", error)
    return NextResponse.json({ error: "failed to save watchlist" }, { status: 500 })
  }
}

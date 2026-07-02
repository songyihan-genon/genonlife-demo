import { NextRequest, NextResponse } from "next/server"
import { getResearchApiBaseUrl } from "@/lib/api-endpoints"

const API_BASE = getResearchApiBaseUrl()

const parseResponse = async (response: Response) => {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

type RouteContext = {
  params: { ticker: string }
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const ticker = params?.ticker
  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const query = new URLSearchParams(searchParams)

  const queryString = query.toString()
  const backendUrl = `${API_BASE}/api/stocks/${encodeURIComponent(ticker)}/news${
    queryString ? `?${queryString}` : ""
  }`

  try {
    const backendResponse = await fetch(
      backendUrl,
      { cache: "no-store" },
    )
    const data = await parseResponse(backendResponse)

    if (!backendResponse.ok) {
      console.error("stock news proxy error", backendResponse.status, data)
    }

    return NextResponse.json(data ?? {}, { status: backendResponse.status })
  } catch (error) {
    console.error("stock news proxy failed", error)
    return NextResponse.json({ error: "Failed to fetch stock news" }, { status: 500 })
  }
}

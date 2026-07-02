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

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const ticker = params?.ticker
  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 })
  }

  try {
    const backendResponse = await fetch(
      `${API_BASE}/api/stocks/${encodeURIComponent(ticker)}`,
      { cache: "no-store" },
    )
    const data = await parseResponse(backendResponse)

    if (!backendResponse.ok) {
      console.error("stocks proxy error", backendResponse.status, data)
    }

    return NextResponse.json(data ?? {}, { status: backendResponse.status })
  } catch (error) {
    console.error("stocks proxy failed", error)
    return NextResponse.json({ error: "Failed to fetch stock info" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getResearchApiBaseUrl } from "@/lib/api-endpoints"

const API_BASE = getResearchApiBaseUrl()

export async function GET(
  req: NextRequest,
  { params }: { params: { indicatorId: string } }
) {
  const indicatorId = params.indicatorId
  if (!indicatorId) {
    return NextResponse.json({ error: "indicatorId is required" }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const days = searchParams.get("days") || "45"

  try {
    const backendResponse = await fetch(
      `${API_BASE}/macro/${indicatorId}/history?days=${days}`,
      { cache: "no-store" }
    )

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch macro history" },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("macro history proxy failed", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


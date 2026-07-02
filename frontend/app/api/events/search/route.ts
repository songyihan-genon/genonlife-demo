import { NextRequest, NextResponse } from "next/server"
import { getResearchApiBaseUrl } from "@/lib/api-endpoints"

const API_BASE =
  process.env.BACKEND_API_BASE_URL ||
  process.env.RESEARCH_API_BASE_URL ||
  process.env.NEXT_PUBLIC_RESEARCH_API_BASE_URL ||
  getResearchApiBaseUrl() ||
  "http://localhost:5588"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const backendResponse = await fetch(`${API_BASE}/api/events/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await backendResponse.json()
    return NextResponse.json(data, { status: backendResponse.status })
  } catch (error) {
    console.error("events/search proxy error", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    )
  }
}

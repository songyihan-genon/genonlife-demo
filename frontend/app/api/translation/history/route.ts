import { NextResponse } from "next/server"
import { getTranslationApiBaseUrl } from "@/lib/api-endpoints"

const BASE_URL = getTranslationApiBaseUrl()

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const response = await fetch(`${BASE_URL}/history`, {
      method: "GET",
      cache: "no-store",
    })
    const text = await response.text()
    try {
      const json = text ? JSON.parse(text) : {}
      return NextResponse.json(json, { status: response.status })
    } catch {
      return new NextResponse(text, { status: response.status })
    }
  } catch (error) {
    console.error("[translation] failed to fetch history:", error)
    return NextResponse.json({ detail: "Failed to fetch translation history" }, { status: 500 })
  }
}

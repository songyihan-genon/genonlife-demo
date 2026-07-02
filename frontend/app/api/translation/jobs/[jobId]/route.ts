import { NextRequest, NextResponse } from "next/server"
import { getTranslationApiBaseUrl } from "@/lib/api-endpoints"

const BASE_URL = getTranslationApiBaseUrl()

export async function GET(_request: NextRequest, context: { params: { jobId: string } }) {
  const { jobId } = context.params
  try {
    const response = await fetch(`${BASE_URL}/jobs/${jobId}`, {
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
    console.error("[translation] failed to fetch job:", error)
    return NextResponse.json({ detail: "Failed to fetch job status" }, { status: 500 })
  }
}

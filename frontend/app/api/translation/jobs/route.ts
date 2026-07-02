import { NextRequest, NextResponse } from "next/server"
import { getTranslationApiBaseUrl } from "@/lib/api-endpoints"

const BASE_URL = getTranslationApiBaseUrl()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const response = await fetch(`${BASE_URL}/jobs`, {
      method: "POST",
      body: formData,
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
    console.error("[translation] failed to create job:", error)
    return NextResponse.json({ detail: "Failed to create translation job" }, { status: 500 })
  }
}

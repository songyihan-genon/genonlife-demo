import { NextRequest, NextResponse } from "next/server"
import { getTranslationApiBaseUrl } from "@/lib/api-endpoints"

const BASE_URL = getTranslationApiBaseUrl()

export async function GET(request: NextRequest, context: { params: { jobId: string } }) {
  const { jobId } = context.params
  try {
    const backendUrl = new URL(`${BASE_URL}/jobs/${jobId}/source`)
    const fileId = request.nextUrl.searchParams.get("fileId")
    if (fileId) {
      backendUrl.searchParams.set("file_id", fileId)
    }
    const response = await fetch(backendUrl, {
      method: "GET",
      cache: "no-store",
    })
    if (!response.ok) {
      const text = await response.text()
      try {
        const json = text ? JSON.parse(text) : {}
        return NextResponse.json(json, { status: response.status })
      } catch {
        return new NextResponse(text, { status: response.status })
      }
    }
    const arrayBuffer = await response.arrayBuffer()
    const headers = new Headers()
    headers.set(
      "Content-Type",
      response.headers.get("Content-Type") || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
    const disposition = response.headers.get("Content-Disposition")
    if (disposition) {
      headers.set("Content-Disposition", disposition)
    }
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("[translation] failed to download source:", error)
    return NextResponse.json({ detail: "Failed to download source document" }, { status: 500 })
  }
}

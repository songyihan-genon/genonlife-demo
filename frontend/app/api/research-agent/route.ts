import { NextRequest, NextResponse } from 'next/server'
import { getResearchAgentEndpoint } from '@/lib/api-endpoints'

const RESEARCH_API_ENDPOINT = getResearchAgentEndpoint()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, chatId, messages = [] } = body

    // 5588 서버로 전송할 데이터 구성
    const requestData = {
      question,
      chatId: chatId, // 클라이언트에서 생성한 ID 사용
      userInfo: null // 필요시 사용자 정보 추가
    }

    // 5588 서버와 SSE 연결
    const response = await fetch(RESEARCH_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-from': 'internal'
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Research API responded with ${response.status}: ${errorText}`)
    }

    // 백엔드 응답을 그대로 클라이언트로 전달 (Pass-through)
    // 헤더 설정은 SSE를 위해 중요함
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      },
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

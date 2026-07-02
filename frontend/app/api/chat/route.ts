import { NextRequest, NextResponse } from 'next/server'
// removed mock streaming dependencies

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ""
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

const SYSTEM_PROMPTS = {
  "insight-partner": `당신은 전문적인 리서치 인사이트 파트너입니다. 
데이터 분석, 시장 조사, 트렌드 분석 등 고급 리서치 작업을 수행합니다.
깊이 있는 분석과 전문적인 인사이트를 제공하며, 데이터 기반의 결론을 도출합니다.
항상 한국어로 응답하세요.`,
  
  "supporting-agent": `당신은 리서치 서포팅 에이전트입니다.
번역, 요약, 문서 변환, 간단한 분석 등의 지원 업무를 담당합니다.
효율적이고 정확한 작업 수행을 목표로 하며, 사용자의 작업을 돕습니다.
항상 한국어로 응답하세요.`
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, taskMode = "research-insight" } = body

    // Removed special-case mock streaming logic

    // taskMode에 따라 적절한 시스템 프롬프트 선택
    const mode = taskMode === "research-insight" ? "insight-partner" : "supporting-agent"
    const systemPrompt = SYSTEM_PROMPTS[mode as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS["insight-partner"]
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "qwen/qwen3-next-80b-a3b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 4000,
        temperature: 0.7
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API responded with ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || "응답을 생성할 수 없습니다."
    
    // 스트리밍 형식으로 응답 (프론트엔드가 기대하는 형식)
    const responseText = `data: ${JSON.stringify({ content })}\n\ndata: [DONE]\n\n`
    
    return new NextResponse(responseText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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

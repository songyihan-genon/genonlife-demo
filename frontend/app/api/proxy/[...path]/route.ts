import { NextRequest, NextResponse } from "next/server"

/**
 * 백엔드 API를 프록시하는 Next.js API 라우트
 * 
 * 사용법:
 * - 프론트엔드: /api/proxy/auth/google
 * - 실제 백엔드: Docker 네트워크 내부에서는 http://api:5588/auth/google
 * 
 * 이렇게 하면 브라우저는 같은 도메인(https://research-dev.genon.ai:3443)으로만 요청하고,
 * Next.js 서버가 내부적으로 백엔드로 프록시합니다.
 */
// Docker 네트워크 내부에서는 서비스 이름으로 접근
const BACKEND_URL = process.env.BACKEND_URL || process.env.RESEARCH_API_ENDPOINT?.replace('/chat/research', '') || "http://api:5588"

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path, "GET")
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path, "POST")
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path, "PUT")
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path, "DELETE")
}

async function handleProxy(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // 경로 조합: /api/proxy/auth/google -> /auth/google
    const backendPath = `/${pathSegments.join("/")}`
    
    // 쿼리 파라미터 가져오기
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    const url = queryString 
      ? `${BACKEND_URL}${backendPath}?${queryString}`
      : `${BACKEND_URL}${backendPath}`

    console.log(`[proxy] Proxying ${method} ${backendPath} to ${url}`)
    console.log(`[proxy] BACKEND_URL env: ${process.env.BACKEND_URL}`)

    // 요청 본문 가져오기
    let body: string | undefined
    const contentType = request.headers.get("content-type")
    if (method !== "GET" && method !== "DELETE") {
      // 모든 POST, PUT 요청의 본문을 가져옴
      try {
        body = await request.text()
        console.log(`[proxy] Request body length: ${body?.length}, content: ${body?.substring(0, 200)}`)
      } catch (e) {
        console.error(`[proxy] Error reading request body:`, e)
      }
    }
    
    // Content-Type이 없으면 JSON으로 설정
    if (method === "POST" && body && !contentType) {
      filteredHeaders["Content-Type"] = "application/json"
    }

    // 백엔드로 요청 전달
    // Docker 네트워크 내부에서는 서비스 이름(api)으로 접근 가능
    // 헤더 필터링: 브라우저에서 온 헤더 중 일부는 제거해야 함
    const excludedHeaders = [
      'host',
      'content-length',
      'connection',
      'keep-alive',
      'upgrade',
      'proxy-connection',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailer',
      'transfer-encoding',
    ]
    
    const filteredHeaders: Record<string, string> = {}
    
    // Content-Type 설정 (우선순위: 요청 헤더 > 기본값)
    if (contentType) {
      filteredHeaders["Content-Type"] = contentType
    } else if (method === "POST" || method === "PUT") {
      // POST/PUT 요청에 본문이 있으면 JSON으로 설정
      filteredHeaders["Content-Type"] = "application/json"
    }
    
    // 필요한 헤더만 전달 (Content-Type은 이미 설정했으므로 제외)
    for (const [key, value] of request.headers.entries()) {
      const lowerKey = key.toLowerCase()
      if (!excludedHeaders.includes(lowerKey) && 
          lowerKey !== "content-type" && 
          value) {
        filteredHeaders[key] = value
      }
    }
    
    const fetchOptions: RequestInit = {
      method,
      headers: filteredHeaders,
      body: body || undefined,
      redirect: 'manual', // 리다이렉트를 수동으로 처리 (OAuth 리다이렉트 처리용)
    }
    
    // POST 요청인데 본문이 없으면 빈 문자열로 설정하지 않음
    if (method === "POST" && !body) {
      delete fetchOptions.body
    }

    // 타임아웃 설정 (30초)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    fetchOptions.signal = controller.signal

    console.log(`[proxy] Fetch options:`, {
      method: fetchOptions.method,
      headers: filteredHeaders,
      hasBody: !!fetchOptions.body,
      bodyLength: fetchOptions.body?.toString().length,
    })
    
    let backendResponse: Response
    try {
      backendResponse = await fetch(url, fetchOptions)
      clearTimeout(timeoutId)
      console.log(`[proxy] Backend response status: ${backendResponse.status}`)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error(`[proxy] Fetch error details:`, {
        url,
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        cause: fetchError instanceof Error && 'cause' in fetchError ? fetchError.cause : undefined,
      })
      // 네트워크 에러인 경우 더 자세한 정보 출력
      if (fetchError instanceof Error && fetchError.message.includes('fetch failed')) {
        console.error(`[proxy] Network error - 백엔드 서비스(${url})에 연결할 수 없습니다.`)
        console.error(`[proxy] Docker 네트워크 확인: api 서비스가 실행 중인지 확인하세요.`)
      }
      throw fetchError
    }

    // 리다이렉트인 경우 (OAuth 리다이렉트 등)
    if (backendResponse.status >= 300 && backendResponse.status < 400) {
      const location = backendResponse.headers.get("location")
      if (location) {
        console.log(`[proxy] Redirecting to: ${location}`)
        // 리다이렉트를 브라우저로 직접 전달
        return NextResponse.redirect(location, { 
          status: backendResponse.status as 301 | 302 | 303 | 307 | 308
        })
      }
    }

    // 응답 데이터 가져오기
    const data = await backendResponse.text()
    
    // Content-Type 확인
    const responseContentType = backendResponse.headers.get("content-type")
    
    // JSON인 경우 파싱
    if (responseContentType?.includes("application/json")) {
      try {
        return NextResponse.json(JSON.parse(data), { 
          status: backendResponse.status,
          headers: {
            // 필요한 경우 CORS 헤더 추가
          },
        })
      } catch (e) {
        // JSON 파싱 실패 시 원본 텍스트 반환
        return new NextResponse(data, {
          status: backendResponse.status,
          headers: {
            "Content-Type": responseContentType || "text/plain",
          },
        })
      }
    }
    
    // 일반 텍스트 응답
    return new NextResponse(data, {
      status: backendResponse.status,
      headers: {
        "Content-Type": responseContentType || "text/plain",
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error(`[proxy] Error proxying ${method} ${pathSegments.join("/")}:`, errorMessage)
    console.error(`[proxy] Error stack:`, errorStack)
    console.error(`[proxy] BACKEND_URL: ${BACKEND_URL}`)
    console.error(`[proxy] Full URL: ${BACKEND_URL}/${pathSegments.join("/")}`)
    
    return NextResponse.json(
      { 
        error: "Proxy error", 
        message: errorMessage,
        backendUrl: BACKEND_URL,
        path: pathSegments.join("/")
      },
      { status: 500 }
    )
  }
}


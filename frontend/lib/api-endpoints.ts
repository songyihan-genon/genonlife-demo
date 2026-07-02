// 서버 사이드에서 사용할 기본 URL
const DEFAULT_BASE_URL =
  process.env.RESEARCH_API_BASE_URL ||
  process.env.NEXT_PUBLIC_RESEARCH_API_BASE_URL ||
  "http://localhost:5588"

function extractOrigin(endpoint?: string | null) {
  if (!endpoint) {
    return null
  }

  try {
    return new URL(endpoint).origin
  } catch (error) {
    console.warn("[research-api] Invalid RESEARCH_API_ENDPOINT:", endpoint, error)
    return null
  }
}

/**
 * 클라이언트 사이드에서 런타임에 백엔드 URL을 동적으로 결정
 * 서버 사이드에서는 환경 변수 사용
 */
export function getResearchApiBaseUrl() {
  // 서버 사이드 (SSR)
  if (typeof window === "undefined") {
    return extractOrigin(process.env.RESEARCH_API_ENDPOINT) || DEFAULT_BASE_URL
  }

  // 클라이언트 사이드: 런타임에 동적으로 결정
  // 1. window 객체에서 설정된 값 확인 (런타임 설정 - 최우선)
  if (typeof window !== "undefined" && (window as any).__BACKEND_URL__) {
    return (window as any).__BACKEND_URL__
  }

  // 2. 환경 변수 확인 (빌드 타임 설정)
  if (process.env.NEXT_PUBLIC_RESEARCH_API_BASE_URL) {
    const envUrl = process.env.NEXT_PUBLIC_RESEARCH_API_BASE_URL
    // localhost가 아닌 경우에만 사용 (서버 환경에서 명시적으로 설정된 경우)
    if (!envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl
    }
  }

  // 3. 현재 도메인 기반으로 백엔드 URL 생성 (런타임 결정)
  const origin = window.location.origin
  const hostname = window.location.hostname
  const protocol = window.location.protocol
  const port = window.location.port

  // 로컬 환경: localhost:5054 -> localhost:5588
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5588"
  }

  // 서버 환경: 백엔드가 도메인 연결이 안 되어 있는 경우
  // 프록시를 사용 (같은 도메인으로 접근)
  // 예: https://research-dev.genon.ai:3443/api/proxy/auth/google
  // 이렇게 하면 브라우저는 같은 도메인으로만 요청하고,
  // Next.js 서버가 내부적으로 백엔드(localhost:5588)로 프록시합니다.
  return `${protocol}//${hostname}${port ? `:${port}` : ""}/api/proxy`
}

export function getResearchAgentEndpoint() {
  return process.env.RESEARCH_API_ENDPOINT || `${getResearchApiBaseUrl()}/chat/research`
}

export function getTranslationApiBaseUrl() {
  return `${getResearchApiBaseUrl()}/translation`
}

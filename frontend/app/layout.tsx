import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { LayoutContent } from "@/components/layout-content"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "AI Portal",
  description: "Shinhan Life AI portal demo for customer service, operations, and productivity workflows",
  generator: "v0.app",
}

// 데모는 전부 클라이언트 인터랙션(useSearchParams·localStorage 등) — 정적 프리렌더 대신 동적 렌더링으로 빌드 프리렌더 에러 방지
export const dynamic = "force-dynamic"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // 런타임 백엔드 URL 설정 (서버 사이드에서 환경 변수 읽기)
  const backendUrl = process.env.NEXT_PUBLIC_RESEARCH_API_BASE_URL || "http://localhost:5588"

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" as="style" crossOrigin="" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
        {/* 런타임 백엔드 URL을 클라이언트에 전달 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var backendUrl = ${JSON.stringify(backendUrl)};
                var hostname = window.location.hostname;
                var protocol = window.location.protocol;
                
                // 로컬 환경
                if (hostname === "localhost" || hostname === "127.0.0.1") {
                  backendUrl = "http://localhost:5588";
                } else {
                  // 서버 환경: 백엔드가 도메인 연결이 안 되어 있는 경우 프록시 사용
                  // 환경 변수가 localhost가 아니면 사용 (명시적으로 설정된 경우)
                  if (backendUrl && !backendUrl.includes("localhost") && !backendUrl.includes("127.0.0.1")) {
                    // 이미 올바른 URL이 설정되어 있음 (백엔드도 도메인 연결됨)
                  } else {
                    // 프록시 사용: 같은 도메인으로 접근
                    // 예: https://research-dev.genon.ai:3443/api/proxy/auth/google
                    var port = window.location.port;
                    backendUrl = protocol + "//" + hostname + (port ? ":" + port : "") + "/api/proxy";
                  }
                }
                
                window.__BACKEND_URL__ = backendUrl;
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

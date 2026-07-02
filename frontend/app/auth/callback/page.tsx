"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, AlertCircle } from "lucide-react"
import { getResearchApiBaseUrl } from "@/lib/api-endpoints"

function AuthCallbackPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoading, isAuthenticated } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isExchanging, setIsExchanging] = useState(false)
  const hasProcessed = useRef(false)

  useEffect(() => {
    // 한 번만 처리되도록 보장
    if (hasProcessed.current) return
    
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const token = searchParams.get("token")
    
    // 이미 토큰이 있으면 (기존 방식)
    if (token) {
      hasProcessed.current = true
      if (!isLoading && isAuthenticated) {
        router.replace("/")
      }
      return
    }
    
    // authorization code가 있으면 백엔드로 전달하여 토큰으로 교환
    if (code && state) {
      hasProcessed.current = true
      setIsExchanging(true)
      exchangeCodeForToken(code, state)
    } else if (!code && !token && !isLoading) {
      hasProcessed.current = true
      setError("인증 코드를 받지 못했습니다.")
    }
  }, [searchParams, isLoading, isAuthenticated, router])

  const exchangeCodeForToken = async (code: string, state: string) => {
    try {
      const response = await fetch(`${getResearchApiBaseUrl()}/auth/google/exchange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, state }),
      })

      if (!response.ok) {
        let errorMessage = "토큰 교환 실패"
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorData.error || JSON.stringify(errorData)
        } catch (e) {
          // JSON 파싱 실패 시 상태 텍스트 사용
          errorMessage = response.statusText || `HTTP ${response.status}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // 토큰을 localStorage에 저장
      localStorage.setItem("ai-research-portal.auth.token", data.access_token)
      localStorage.setItem("ai-research-portal.auth.user", JSON.stringify(data.user))
      
      // 페이지 새로고침 없이 라우터로 이동 (더 빠름)
      router.replace("/")
    } catch (err) {
      console.error("토큰 교환 중 오류:", err)
      setError(err instanceof Error ? err.message : "인증 처리 중 오류가 발생했습니다.")
      setIsExchanging(false)
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <AlertCircle className="mb-4 h-8 w-8 text-red-500" />
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => router.replace("/")}
          className="text-sm text-blue-500 hover:underline"
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <Loader2 className="mb-4 h-8 w-8 animate-spin" />
      <p className="text-sm text-muted-foreground">구글 계정을 확인하고 있습니다...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AuthCallbackPageContent />
    </Suspense>
  )
}

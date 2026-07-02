"use client"

import { useState, useEffect, type SVGProps } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { PortalLogo } from "@/components/portal-logo"

export function Login() {
  const { loginWithGoogle, loginAsDemo, isAuthenticated } = useAuth()
  const searchParams = useSearchParams()
  const wasRedirected = searchParams.get('redirected') === 'true'
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const router = useRouter()

  const handleGoogleLogin = async () => {
    try {
      setError("")
      setIsLoading(true)
      await loginWithGoogle()
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : "구글 로그인 중 오류가 발생했습니다."
      setError(message)
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    try {
      setError("")
      setIsDemoLoading(true)
      await loginAsDemo()
      router.replace("/")
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : "데모 로그인 중 오류가 발생했습니다."
      setError(message)
    } finally {
      setIsDemoLoading(false)
    }
  }

  // After successful authentication, redirect to the main app page and clean the query param
  useEffect(() => {
    if (isAuthenticated) {
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('redirected')
      router.replace('/' + cleanUrl.search)
    }
  }, [isAuthenticated, router])

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300 px-6">
      <ThemeToggle className="absolute top-6 right-6" />
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border/50 bg-card/80 p-8 shadow-xl backdrop-blur-sm dark:border-white/10">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <PortalLogo className="justify-center" />
          </div>
          <p className="text-sm text-muted-foreground">사내 Google Workspace 계정으로 안전하게 로그인하세요.</p>
        </div>

        {wasRedirected && (
          <div className="rounded-lg border border-[#9DCBF5] bg-[#fff4e5] px-4 py-3 text-sm text-[#005BAC] dark:border-[#00A3E0]/30 dark:bg-[#005BAC]/10 dark:text-[#ffd7a3] flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">로그인이 필요합니다</p>
              <p className="text-xs mt-1 opacity-90">해당 페이지에 접근하려면 먼저 로그인해주세요.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Button
            type="button"
            disabled={isLoading || isDemoLoading}
            onClick={handleGoogleLogin}
            className="w-full justify-center gap-3 rounded-lg border border-gray-200 bg-white/90 py-3 text-base font-medium text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-70 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100 dark:hover:bg-gray-900"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon className="h-5 w-5" />
            )}
            Google 계정으로 로그인
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading || isDemoLoading}
            onClick={handleDemoLogin}
            className="w-full justify-center gap-3 rounded-lg py-3 text-base font-medium"
          >
            {isDemoLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : null}
            데모로 바로 입장
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Google 로그인은 추후 설정 후 연결하고, 지금은 데모 진입으로 화면 확인이 가능합니다.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" {...props}>
      <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.6 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C33.6 4.3 28.9 2.5 24 2.5 12 2.5 2.5 12 2.5 24S12 45.5 24 45.5 45.5 36 45.5 24c0-1.3-.1-2.7-.3-4z" />
      <path fill="#34A853" d="M6.6 14.9l6.7 4.9C14.9 16.1 18.9 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C33.6 4.3 28.9 2.5 24 2.5c-7.7 0-14.2 4.4-17.4 10.8z" />
      <path fill="#FBBC05" d="M24 45.5c6.2 0 11.5-2.1 15.3-5.6l-7.1-5.7c-2.1 1.4-4.8 2.3-8.2 2.3-6.1 0-11.3-4.1-13.1-9.7l-6.7 5.2C7.4 39.9 15 45.5 24 45.5z" />
      <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.9 2.6-2.6 4.6-4.7 6l7.1 5.7C40.6 42 45.5 36 45.5 24c0-1.3-.1-2.7-.3-4z" />
    </svg>
  )
}

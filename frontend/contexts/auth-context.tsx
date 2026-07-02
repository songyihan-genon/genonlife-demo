"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { getResearchApiBaseUrl } from "@/lib/api-endpoints"

interface User {
  id: string
  email: string
  name: string
  picture?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  loginWithGoogle: () => Promise<void>
  loginAsDemo: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = "ai-research-portal.auth.token"
const USER_KEY = "ai-research-portal.auth.user"

function normalizeUser(user: User): User {
  if (user.id === "demo-user" || user.email === "demo@kangwonland.local") {
    return {
      ...user,
      name: "제논",
      email: "demo@kangwonland.local",
    }
  }

  return user
}

function toBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ""
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function createDemoToken(user: User) {
  const header = toBase64Utf8(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const payload = toBase64Utf8(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      iat: Math.floor(Date.now() / 1000),
      demo: true,
    }),
  )

  return `${header}.${payload}.demo-signature`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 로컬 스토리지에서 토큰과 사용자 정보 로드
    const loadSession = () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY)
        const storedUser = localStorage.getItem(USER_KEY)

        if (token && storedUser) {
          // JWT 토큰의 만료 시간을 클라이언트에서 확인 (서버 요청 없이)
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const exp = payload.exp * 1000 // JWT exp는 초 단위, Date는 밀리초
            const now = Date.now()
            
            if (exp > now) {
              // 토큰이 유효하면 저장된 사용자 정보 사용
              const user = normalizeUser(JSON.parse(storedUser))
              setUser(user)
              localStorage.setItem(USER_KEY, JSON.stringify(user))
            } else {
              // 토큰이 만료되었으면 삭제
              localStorage.removeItem(TOKEN_KEY)
              localStorage.removeItem(USER_KEY)
              setUser(null)
            }
          } catch (error) {
            // JWT 파싱 실패 시 삭제
            console.error("토큰 파싱 중 오류:", error)
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("세션 로드 중 오류:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()

    // URL에서 토큰이 있는지 확인 (OAuth 콜백)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get("token")
      if (token) {
        handleAuthCallback(token)
      }
    }
  }, [])

  const handleAuthCallback = async (token: string) => {
    try {
      const response = await fetch(`${getResearchApiBaseUrl()}/auth/verify?token=${token}`)
      if (response.ok) {
        const data = await response.json()
        localStorage.setItem(TOKEN_KEY, token)
        const normalizedUser = normalizeUser(data.user)
        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser))
        setUser(normalizedUser)
        // URL에서 토큰 제거
        const url = new URL(window.location.href)
        url.searchParams.delete("token")
        window.history.replaceState({}, "", url.toString())
      } else {
        throw new Error("토큰 검증 실패")
      }
    } catch (error) {
      console.error("인증 콜백 처리 중 오류:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    try {
      // 백엔드의 Google OAuth 엔드포인트로 리다이렉트
      const backendUrl = getResearchApiBaseUrl()
      window.location.href = `${backendUrl}/auth/google`
    } catch (error) {
      console.error("Google 로그인 시작 중 오류:", error)
      throw error
    }
  }

  const loginAsDemo = async () => {
    const demoUser = {
      id: "demo-user",
      email: "demo@kangwonland.local",
      name: "제논",
      picture: undefined,
    }

    const token = createDemoToken(demoUser)
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(demoUser))
    setUser(demoUser)
  }

  const logout = async () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setUser(null)
    } catch (error) {
      console.error("로그아웃 중 오류:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        loginWithGoogle,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

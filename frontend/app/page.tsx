"use client"

import { Suspense, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

function HomePageContent() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    router.replace(isAuthenticated ? "/main" : "/login")
  }, [isAuthenticated, router])

  return <div className="min-h-screen bg-background" />
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomePageContent />
    </Suspense>
  )
}
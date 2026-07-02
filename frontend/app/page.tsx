"use client"

import { Suspense, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Login } from "@/components/login"
import { ChatInterface } from "@/components/chat-interface"
import { FormattingTool } from "@/components/FormattingTool"
import { DocumentationTool } from "@/components/DocumentationTool"
import { TranslationTool } from "@/components/TranslationTool"
import { useSearchParams } from "next/navigation"

function HomePageContent() {
  const { isAuthenticated } = useAuth()
  const searchParams = useSearchParams()
  const taskParam = searchParams.get("task")

  const initialTaskMode = useMemo(() => {
    if (taskParam === "formatting" || taskParam === "documentation" || taskParam === "translation") {
      return taskParam as "formatting" | "documentation" | "translation"
    }
    return "research-insight" as const
  }, [taskParam])

  if (!isAuthenticated) {
    return <Login />
  }

  if (taskParam === "formatting") {
    return <FormattingTool />
  }

  if (taskParam === "documentation") {
    return <DocumentationTool />
  }

  if (taskParam === "translation") {
    return <TranslationTool />
  }

  return <ChatInterface className="h-full" initialTaskMode={initialTaskMode} />
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomePageContent />
    </Suspense>
  )
}

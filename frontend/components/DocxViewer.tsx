"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

type DocxViewerProps = {
  file?: Blob | null
  emptyHint?: string
  className?: string
  viewportClassName?: string
}

let docxRendererPromise: Promise<typeof import("docx-preview")> | null = null

export function DocxViewer({ file, emptyHint, className, viewportClassName }: DocxViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ""

    if (!file) {
      setLoading(false)
      setError(null)
      return
    }

    const renderDoc = async () => {
      setLoading(true)
      setError(null)

      try {
        const buffer = await file.arrayBuffer()
        if (cancelled) return
        const { renderAsync } = await loadDocxRenderer()
        if (cancelled) return
        await renderAsync(buffer, container, undefined, {
          inWrapper: false,
          breakPages: false,
          experimental: true,
        })
      } catch (err) {
        if (!cancelled) {
          console.error("[docx-viewer] preview failed", err)
          setError("문서 미리보기를 불러올 수 없습니다.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    renderDoc()

    return () => {
      cancelled = true
      container.innerHTML = ""
    }
  }, [file])

  return (
    <div className={cn("relative rounded-md border border-dashed bg-muted/30", className)}>
      <div
        ref={containerRef}
        className={cn("docx-viewer h-[420px] overflow-auto px-4 py-4 bg-background", viewportClassName)}
      />
      {!file && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground px-6">
          <FileText className="h-5 w-5" />
          <p>{emptyHint || "DOCX 파일을 선택하면 미리보기가 여기에 표시됩니다."}</p>
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-md bg-background/80 text-sm font-medium text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>문서 미리보기를 불러오는 중...</span>
        </div>
      )}
      {error && (
        <div className="absolute bottom-3 left-3 right-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}

function loadDocxRenderer() {
  if (!docxRendererPromise) {
    docxRendererPromise = import("docx-preview")
  }
  return docxRendererPromise
}

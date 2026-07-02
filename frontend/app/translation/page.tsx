"use client"

import { TranslationTool } from "@/components/TranslationTool"

export default function TranslationPage() {
  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Document Analysis</p>
          <h1 className="text-3xl font-bold text-foreground">문서분석 지원</h1>
          <p className="text-sm text-muted-foreground">
            업로드한 문서를 기준으로 번역 결과와 정리본을 확인하는 화면입니다.
          </p>
        </div>
        <TranslationTool />
      </div>
    </div>
  )
}

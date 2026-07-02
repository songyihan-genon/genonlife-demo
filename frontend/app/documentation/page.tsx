"use client"

import { DocumentationTool } from "@/components/DocumentationTool"

export default function DocumentationPage() {
  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Document Support</p>
          <h1 className="text-3xl font-bold text-foreground">문서작성 지원</h1>
          <p className="text-sm text-muted-foreground">
            전자결재, 제안요청서, 보도자료 초안을 빠르게 생성하고 편집하는 화면입니다.
          </p>
        </div>
        <DocumentationTool />
      </div>
    </div>
  )
}

"use client"

import { FormattingTool } from "@/components/FormattingTool"

export default function ResortCustomerSupportPage() {
  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-5xl space-y-4 px-6 py-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Legacy Sample</p>
          <h1 className="text-3xl font-bold text-foreground">레거시 민원처리 샘플</h1>
          <p className="text-sm text-muted-foreground">
            민원 접수 확인, 보완 서류 요청, 처리 결과 안내 문구를 생성하는 샘플 화면입니다.
          </p>
        </div>
        <FormattingTool />
      </div>
    </div>
  )
}

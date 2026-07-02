import { BookOpen, ExternalLink } from "lucide-react"
import type { CaseDetail, SokChunk } from "@/lib/audit/types"

interface SokPanelProps {
  detail: CaseDetail | null
}

export function SokPanel({ detail }: SokPanelProps) {
  if (!detail) {
    return (
      <div className="flex min-h-[240px] flex-col rounded-lg border border-dashed border-border bg-card shadow-sm">
        <header className="border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-semibold text-foreground">오안내 판정 근거</h2>
        </header>
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          건을 선택하면 관련 약관·내규가 표시됩니다.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">오안내 판정 근거</h2>
        </div>
        <span className="text-[11px] text-muted-foreground">AI가 참고한 약관·내규</span>
      </header>

      <p className="border-b border-border bg-input/50 px-4 py-2 text-xs text-muted-foreground">
        AI가 참고한 부분은 본문에서 <mark className="rounded-sm bg-amber-200/70 px-1 text-amber-900">노란색</mark>으로 표시되어 있습니다.
      </p>

      <div className="flex flex-col gap-3 p-4">
        {detail.knowledgeChunks.map((chunk, idx) => (
          <KnowledgeChunk key={idx} chunk={chunk} fallbackHighlight={detail.highlightChunk} />
        ))}
      </div>
    </div>
  )
}

function KnowledgeChunk({
  chunk,
  fallbackHighlight,
}: {
  chunk: SokChunk
  fallbackHighlight: string
}) {
  const target = chunk.highlight ?? fallbackHighlight
  return (
    <article className="rounded-md border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-foreground">{chunk.source}</h3>
        <a
          href={chunk.link}
          className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          원본 보기
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/85">
        {target ? highlightWithin(chunk.content, target) : chunk.content}
      </p>
    </article>
  )
}

function highlightWithin(content: string, target: string) {
  const idx = content.indexOf(target)
  if (idx === -1) return content
  const before = content.slice(0, idx)
  const after = content.slice(idx + target.length)
  return (
    <>
      {before}
      <mark className="rounded-sm bg-amber-200/70 px-1 font-semibold text-amber-900">
        {target}
      </mark>
      {after}
    </>
  )
}

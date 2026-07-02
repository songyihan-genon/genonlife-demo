import { ExternalLink } from "lucide-react"
import { SourceInfo } from "@/types/domain"
import { getNewsSourceFaviconUrl } from "@/lib/mock/stock-data"

export const SourceChips = ({ sources, className = "" }: { sources?: SourceInfo[]; className?: string }) => {
  if (!sources || sources.length === 0) return null

  const containerClassName = ['flex flex-wrap items-center gap-2', className].filter(Boolean).join(' ')

  return (
    <div className={containerClassName}>
      {sources.map((source, idx) => {
        const faviconUrl = getNewsSourceFaviconUrl(source)
        const chip = (
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-card border border-border rounded-full text-xs text-muted-foreground hover:bg-muted/60 transition-colors">
            <img
              src={faviconUrl}
              alt={`${source.name} favicon`}
              className="w-4 h-4 rounded"
              loading="lazy"
            />
            <span className="text-foreground">{source.name}</span>
            {source.url && <ExternalLink className="w-3 h-3 text-muted-foreground" aria-hidden="true" />}
          </div>
        )

        return source.url ? (
          <a
            key={`${source.name}-${idx}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            {chip}
          </a>
        ) : (
          <span key={`${source.name}-${idx}`} className="inline-flex">
            {chip}
          </span>
        )
      })}
    </div>
  )
}


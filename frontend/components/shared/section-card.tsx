import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SectionCardProps {
  title?: ReactNode
  description?: ReactNode
  /** 카드 좌측 강조 바 색. 기본은 토큰 없음(기본 border). */
  accentColor?: string
  headerRight?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

/**
 * 목업 전반에서 쓰는 섹션 카드 래퍼.
 *
 * 기존 portal의 `Card` 톤(`border-border/70 bg-card/95`)을 유지하면서,
 * 왼쪽에 얇은 컬러 바로 단계/영역을 시각 구분할 수 있도록 한 얇은 확장.
 */
export function SectionCard({
  title,
  description,
  accentColor,
  headerRight,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/70 bg-card/95 py-0",
        className,
      )}
    >
      {accentColor ? (
        <div
          aria-hidden
          className="absolute left-0 top-0 h-full w-1"
          style={{ backgroundColor: accentColor }}
        />
      ) : null}
      <CardContent className={cn("flex flex-col gap-4 px-6 py-5", contentClassName)}>
        {(title || description || headerRight) && (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {title ? (
                <div className="text-base font-semibold text-foreground">{title}</div>
              ) : null}
              {description ? (
                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

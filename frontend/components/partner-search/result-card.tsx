import { Building2, MapPin, Phone } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { Partner } from "./types"

interface ResultCardProps {
  partner: Partner
  /** 약칭/유사 명칭 매칭 하이라이트용 부분 문자열 */
  highlight?: string
}

function highlightText(text: string, query?: string) {
  if (!query) return text
  const idx = text.indexOf(query)
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="rounded-sm bg-sky-100 px-0.5 text-foreground">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  )
}

/**
 * 하이브리드 검색 결과 카드.
 * 메타필터 점수와 벡터 유사도를 함께 보여주고,
 * 약칭 검색 데모에서는 일치 구간을 연한 노랑으로 하이라이트한다.
 */
export function ResultCard({ partner, highlight }: ResultCardProps) {
  return (
    <Card className={cn("border-border/70 bg-card/95 py-0")}>
      <CardContent className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <h4 className="text-base font-semibold text-foreground">
              {highlightText(partner.name, highlight)}
            </h4>
            {partner.shortName ? (
              <span className="text-xs text-muted-foreground">
                약칭 · {highlightText(partner.shortName, highlight)}
              </span>
            ) : null}
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-border/60 bg-background/70 text-[10px] text-muted-foreground"
          >
            {partner.region} · {partner.institutionType}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1">
          {partner.programs.map((program) => (
            <Badge
              key={program}
              variant="secondary"
              className="bg-[#e8f0fe] text-[10px] font-medium text-[#1B3A4B] hover:bg-[#e8f0fe]"
            >
              {program}
            </Badge>
          ))}
        </div>

        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{partner.address}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="font-mono">{partner.phone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3 w-3 shrink-0" />
            <span>{partner.department}</span>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap gap-1.5 border-t border-border/50 pt-2">
          <Badge
            variant="outline"
            className="border-[#4A90D9]/40 bg-[#4A90D9]/5 text-[10px] font-medium text-[#1B3A4B]"
          >
            메타필터 점수 {partner.metaScore.toFixed(2)}
          </Badge>
          <Badge
            variant="outline"
            className="border-violet-300/60 bg-violet-50 text-[10px] font-medium text-violet-700"
          >
            벡터 유사도 {partner.vectorScore.toFixed(2)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

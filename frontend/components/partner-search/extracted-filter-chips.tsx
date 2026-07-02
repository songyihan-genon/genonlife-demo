import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import type { ExtractedFilter, FilterCategory } from "./types"

interface ExtractedFilterChipsProps {
  filters: ExtractedFilter[]
}

const categoryStyles: Record<FilterCategory, string> = {
  지역: "border-[#4A90D9]/40 bg-[#4A90D9]/10 text-[#1B3A4B]",
  제도: "border-emerald-300/60 bg-emerald-50 text-emerald-700",
  기관유형: "border-violet-300/60 bg-violet-50 text-violet-700",
}

/**
 * "검색 조건 자동 추출" 단계 하단의 필터 칩 행.
 * 카테고리별로 테두리·배경 색을 달리해 메타필터 구성 요소를 시각화한다.
 */
export function ExtractedFilterChips({ filters }: ExtractedFilterChipsProps) {
  if (filters.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.map((filter) => (
        <Badge
          key={`${filter.category}-${filter.label}`}
          variant="outline"
          className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", categoryStyles[filter.category])}
        >
          {filter.label}
        </Badge>
      ))}
    </div>
  )
}

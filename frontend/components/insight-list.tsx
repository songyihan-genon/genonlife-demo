"use client"

import { useState, useMemo } from "react"
import { useInsightHistory, Insight } from "@/hooks/use-insight"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Calendar, Clock, TrendingUp, Loader2 } from "lucide-react"

const FILTER_TAGS = [
    { label: "전체", keywords: [] },
    { label: "민원/상담", keywords: ["민원", "상담", "대기시간", "접수"] },
    { label: "규정/지식", keywords: ["규정", "faq", "복무", "지식"] },
    { label: "기관/연계", keywords: ["협약기관", "업무담당자", "연계", "기관"] },
    { label: "민원/품질", keywords: ["민원해결", "재문의율", "표준답변", "품질"] },
    { label: "채권양수도/TBD", keywords: ["채권양수도", "tbd", "시범구축"] },
    { label: "문서/분석", keywords: ["문서분석", "요약", "faq", "문서"] },
]

interface InsightListProps {
    onSelectInsight: (insight: Insight) => void
}

export default function InsightList({ onSelectInsight }: InsightListProps) {
    const { insights, isLoading, error } = useInsightHistory()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedFilter, setSelectedFilter] = useState<string>(FILTER_TAGS[0].label)

    const normalize = (value: string) => value.toLowerCase()

    const matchesFilterTag = (insight: Insight, keywords: string[]) => {
        if (keywords.length === 0) {
            return true
        }

        const normalizedTags = insight.tags.map(tag => normalize(tag))
        const normalizedCategory = normalize(insight.category || "")

        return keywords.some(keyword => {
            const normalizedKeyword = normalize(keyword)
            return (
                normalizedTags.some(tag => tag.includes(normalizedKeyword)) ||
                normalizedCategory.includes(normalizedKeyword)
            )
        })
    }

    // Filter insights
    const filteredInsights = useMemo(() => {
        const activeFilter = FILTER_TAGS.find(tag => tag.label === selectedFilter) || FILTER_TAGS[0]

        return insights.filter(insight => {
            const matchesSearch =
                insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                insight.summary.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesTag = matchesFilterTag(insight, activeFilter.keywords)

            return matchesSearch && matchesTag
        })
    }, [insights, searchQuery, selectedFilter])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                인사이트를 불러오는 중입니다...
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500">목록을 불러오는데 실패했습니다.</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    다시 시도
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="인사이트 검색..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
                    {FILTER_TAGS.map((tag) => (
                        <Button
                            key={tag.label}
                            variant={selectedFilter === tag.label ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedFilter(tag.label)}
                            className="whitespace-nowrap"
                        >
                            {tag.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInsights.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        검색 결과가 없습니다.
                    </div>
                ) : (
                    filteredInsights.map((insight) => (
                        <Card
                            key={insight.id}
                            className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-border overflow-hidden flex flex-col h-full"
                            onClick={() => onSelectInsight(insight)}
                        >
                            <div className="relative h-48 bg-muted overflow-hidden">
                                {insight.thumbnail ? (
                                    <img
                                        src={insight.thumbnail}
                                        alt={insight.title}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/40">
                                        <TrendingUp className="h-12 w-12 text-blue-200 dark:text-blue-700" />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3">
                                    <Badge className="bg-white/90 text-black hover:bg-white/100 dark:bg-black/80 dark:text-white">
                                        {insight.category}
                                    </Badge>
                                </div>
                            </div>

                            <CardContent className="p-5 flex flex-col flex-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> {insight.generated_at}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {insight.read_time}
                                    </span>
                                </div>

                                <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-[#005BAC] transition-colors">
                                    {insight.title}
                                </h3>

                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                                    {insight.summary}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t">
                                    <div className="flex gap-1 overflow-hidden">
                                        {insight.tags.slice(0, 2).map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-xs px-2 py-0 h-5">
                                                #{tag}
                                            </Badge>
                                        ))}
                                        {insight.tags.length > 2 && (
                                            <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                                                +{insight.tags.length - 2}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

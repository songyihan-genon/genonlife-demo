"use client"
import { useEffect, useRef, useState } from "react"
import { useInsight } from "@/hooks/use-insight"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, Calendar, Clock, ArrowLeft } from "lucide-react"
import { Insight } from "@/hooks/use-insight"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface InsightViewProps {
    insight?: Insight | null
    onBack?: () => void
}

export default function InsightView({ insight: propInsight, onBack }: InsightViewProps) {
    // If prop is provided, use it. Otherwise fetch latest (legacy behavior support)
    const { insight: fetchedInsight, isLoading, error } = useInsight()

    const insight = propInsight || fetchedInsight
    const isPropMode = !!propInsight
    const heroSectionRef = useRef<HTMLDivElement | null>(null)
    const [isTitleCompact, setIsTitleCompact] = useState(false)

    useEffect(() => {
        setIsTitleCompact(false)
        if (typeof window === "undefined") return
        const target = heroSectionRef.current
        if (!target) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsTitleCompact(!entry.isIntersecting)
            },
            { threshold: 0.35 }
        )

        observer.observe(target)

        return () => {
            observer.disconnect()
        }
    }, [insight?.id])

    if (!isPropMode && isLoading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-64 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        )
    }

    if (!isPropMode && error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-red-500 mb-2">인사이트를 불러오는데 실패했습니다.</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    다시 시도
                </Button>
            </div>
        )
    }

    const impactStyles = {
        positive: {
            label: "수혜",
            badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-100",
            dotClass: "bg-emerald-500"
        },
        negative: {
            label: "피해",
            badgeClass: "bg-rose-50 text-rose-700 border border-rose-100",
            dotClass: "bg-rose-500"
        },
        neutral: {
            label: "중립",
            badgeClass: "bg-slate-100 text-slate-600 border border-slate-200",
            dotClass: "bg-slate-400"
        }
    }

    if (!insight) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-muted-foreground">오늘의 인사이트가 아직 생성되지 않았습니다.</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {onBack && (
                <div className="sticky top-0 z-30 bg-white dark:bg-[rgb(33,33,33)] border-b border-slate-200 dark:border-zinc-700 px-6">
                    <div className="flex justify-between items-start gap-4 py-3">
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            className="pl-0 pr-4 text-sm font-medium text-[#6B4423] dark:text-slate-200 hover:bg-transparent hover:text-[#005BAC] dark:hover:text-[#00A3E0]"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> 목록으로 돌아가기
                        </Button>
                        {insight && (
                            <div className="text-xs text-muted-foreground text-right leading-tight space-y-1">
                                <span className="flex items-center justify-end gap-1">
                                    <Calendar className="h-3 w-3" /> {insight.generated_at}
                                </span>
                                <span className="flex items-center justify-end gap-1">
                                    <Clock className="h-3 w-3" /> {insight.read_time}
                                </span>
                            </div>
                        )}
                    </div>
                    {insight && (
                        <p
                            className={`pb-3 text-base font-semibold text-[#1a2a5b] dark:text-slate-200 transition-all duration-300 ${
                                isTitleCompact ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                            }`}
                        >
                            {insight.title}
                        </p>
                    )}
                </div>
            )}

            {/* Header Section */}
            <div ref={heroSectionRef} className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="default" className="bg-[#005BAC] hover:bg-[#004F9E]">
                        Today's Insight
                    </Badge>
                    <Badge variant="outline" className="dark:border-slate-700 dark:text-slate-300">{insight.category}</Badge>
                </div>

                <h1 className="text-[clamp(1.75rem,3vw,2.75rem)] font-bold text-[#1a2a5b] dark:text-white leading-tight tracking-tight">
                    {insight.title}
                </h1>

                <p className="text-base md:text-lg text-muted-foreground dark:text-slate-300 leading-relaxed">
                    {insight.summary}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                    {insight.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            #{tag}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="border-b border-slate-200 dark:border-zinc-700" />

            {/* Main Content - Markdown Rendering */}
            <div>
                {insight.content ? (
                    <MarkdownRenderer
                        content={insight.content}
                        className="max-w-none prose-slate dark:prose-invert prose-headings:text-[#1a2a5b] dark:prose-headings:text-white"
                    />
                ) : (
                    <div className="border border-red-200 bg-red-50 p-4 rounded">
                        <p className="text-red-600">콘텐츠를 불러오지 못했습니다.</p>
                    </div>
                )}
            </div>

            {/* Related Companies Section */}
            {insight.related_companies && insight.related_companies.length > 0 && (
                <div className="mt-8 pt-8 border-t dark:border-zinc-700">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                        <TrendingUp className="h-5 w-5 text-[#005BAC]" />
                        관련 기업 영향 분석
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insight.related_companies.map((company) => {
                            const style = impactStyles[company.impact as keyof typeof impactStyles] || impactStyles.neutral
                            return (
                                <div
                                    key={company.code}
                                    className="rounded-2xl border border-slate-200 dark:border-none bg-white/90 dark:bg-zinc-800 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-[#111827] dark:text-slate-100">{company.name}</h3>
                                            <span className="text-xs text-muted-foreground">{company.code}</span>
                                        </div>
                                        <Badge className={`text-xs font-semibold px-3 py-1 ${style.badgeClass}`}>
                                            {style.label}
                                        </Badge>
                                    </div>
                                    <div className="mt-4 flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${style.dotClass}`} aria-hidden />
                                        <p className="leading-relaxed">
                                            {company.reason}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

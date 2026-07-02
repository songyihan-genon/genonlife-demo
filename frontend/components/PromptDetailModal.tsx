"use client"

import { Eye, Heart, Clock, User, Copy, Check } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { type Prompt } from "./PromptCard"

interface PromptDetailModalProps {
  prompt: Prompt | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLike?: (id: string) => void
}

export function PromptDetailModal({ prompt, open, onOpenChange, onLike }: PromptDetailModalProps) {
  const [copied, setCopied] = useState(false)

  if (!prompt) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy prompt:", error)
    }
  }

  const handleLike = () => {
    onLike?.(prompt.id)
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "방금 전"
    if (diffInHours < 24) return `${diffInHours}시간 전`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}일 전`
    if (diffInHours < 720) return `${Math.floor(diffInHours / 168)}주 전`
    return `${Math.floor(diffInHours / 720)}개월 전`
  }

  const getSectorColor = (sector: string) => {
    const colors = {
      counseling: "bg-blue-100 text-blue-800 border-blue-100",
      knowledge: "bg-sky-100 text-sky-800 border-sky-100",
      document: "bg-blue-100 text-blue-800 border-blue-100",
      complaint: "bg-rose-100 text-rose-800 border-rose-100",
      assignment: "bg-cyan-100 text-cyan-800 border-cyan-100",
      analytics: "bg-emerald-100 text-emerald-800 border-emerald-100",
      operation: "bg-purple-100 text-purple-800 border-purple-100",
    }
    return colors[sector as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-100"
  }

  const getSectorDisplayName = (sector: string) => {
    const names = {
      counseling: "민원 상담",
      knowledge: "규정/지식",
      document: "문서 작성",
      complaint: "민원 처리",
      assignment: "담당자 배정",
      analytics: "데이터 분석",
      operation: "운영 관리",
    }
    return names[sector as keyof typeof names] || sector
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold pr-8">
            {prompt.aiTitle ?? prompt.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{prompt.author}{prompt.department ? ` · ${prompt.department}` : ""}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatTimeAgo(prompt.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{prompt.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{prompt.likes.toLocaleString()}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={prompt.isLiked ? "text-red-500" : ""}
              >
                <Heart className={`h-4 w-4 mr-1 ${prompt.isLiked ? "fill-current" : ""}`} />
                좋아요
              </Button>
            </div>
          </div>

          {/* Tags and Sector */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getSectorColor(prompt.sector)}>
              {getSectorDisplayName(prompt.sector)}
            </Badge>

            {prompt.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs" style={{ backgroundColor: 'white', color: 'rgb(20, 40, 168)', borderColor: 'rgb(20, 40, 168)' }}>
                #{tag}
              </Badge>
            ))}

            {/* trending badge removed as requested */}
          </div>

          <Separator />

          {/* Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">프롬프트 내용</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    복사
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                  {prompt.content}
                </pre>
              </div>
            </div>
          </div>

          {/* Usage Tips */}
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              💡 사용 팁
            </h4>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>• 템플릿을 복사한 뒤 기관명, 규정명, 민원 유형 등 실제 정보로 바꿔 사용하세요</li>
              <li>• 상담 문구, 규정 검색, 문서 작성 목적에 따라 어조와 출력 형식을 함께 지정하면 좋습니다</li>
              <li>• 내부 검토가 필요한 문안은 생성 결과를 바로 발송하지 말고 담당자 확인을 거치세요</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

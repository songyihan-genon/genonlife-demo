"use client"

import { useState } from "react"
import type { KeyboardEvent } from "react"
import { ArrowUp, Mic, Paperclip } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface ChatInputBarProps {
  /** 입력창 플레이스홀더 */
  placeholder?: string
  /** true면 Paperclip·Mic 보조 버튼을 숨기고 텍스트 + 전송만 노출 */
  hideAuxButtons?: boolean
  className?: string
}

/**
 * 목업용 채팅 입력 바 — 기존 포털 `components/chat/chat-input.tsx` 의 스타일을 채택.
 *
 * 특징:
 * - Textarea 기반 (`min-h-[120px] rounded-3xl`)
 * - 연한 블루 톤 보더 + 블루 글로우 섀도우
 * - 원형 주황 전송 버튼 (`#005BAC` → hover `#004F9E`)
 * - Paperclip · Mic 보조 버튼은 목업 확장 (첨부·음성 인입 자리)
 *
 * 기존 `chat-input.tsx` 와 다르게:
 * - `useChat` 상태 의존 제거 → 로컬 `useState` 로 입력 값 관리 (mockup)
 * - 외곽 `pb-20` wrapper 제거 (우리 페이지는 플로우 안에 배치)
 * - 전송 동작은 placeholder — 실제 API 호출 없음
 */
export function ChatInputBar({
  placeholder = "메시지를 입력하세요...",
  hideAuxButtons = false,
  className,
}: ChatInputBarProps) {
  const [message, setMessage] = useState("")

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return
    if (e.shiftKey) return // 줄바꿈 허용
    if (e.nativeEvent.isComposing) return
    e.preventDefault()
    // Mockup: 실제 전송 없이 입력만 비움
    setMessage("")
  }

  return (
    <div className={cn("relative", className)}>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[120px] resize-none rounded-3xl border border-[#EBEFF5] bg-card px-7 py-6 pr-16 shadow-[0_0_10px_rgba(21,58,212,0.08)] dark:border-none dark:bg-[#414141]"
      />

      {/* 보조 버튼 그룹 — 좌하단 (hideAuxButtons 시 숨김) */}
      {!hideAuxButtons ? (
        <div className="absolute bottom-3 left-4 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label="파일 첨부"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label="음성 입력"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {/* 전송 버튼 — 우하단 */}
      <div className="absolute bottom-3 right-3">
        <Button
          type="button"
          size="icon"
          disabled={!message.trim()}
          className="h-10 w-10 rounded-full bg-[#005BAC] text-white hover:bg-[#004F9E] disabled:bg-[#005BAC]/50"
          aria-label="전송"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

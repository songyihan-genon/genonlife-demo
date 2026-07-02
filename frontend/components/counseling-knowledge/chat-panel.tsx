"use client"

import { useState } from "react"
import Image from "next/image"
import { AlertTriangle, ArrowLeft, CheckCircle2, Info, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ChatInputBar } from "@/components/shared"
import { cn } from "@/lib/utils"

import { AnswerCard } from "./answer-card"
import { InlineReasoningTrace } from "./inline-reasoning-trace"
import type { ChatMessage } from "./types"

interface ChatPanelProps {
  messages: ChatMessage[]
  /** "← 새 대화 시작" 클릭 시 호출 — 초기 화면 복귀 */
  onNewConversation: () => void
}

/**
 * SFR-015 채팅 UI.
 *
 * 기존 포털 `chat-interface` / `chat/chat-list` 와 동일한 **플랫 레이아웃**으로
 * 렌더한다. 외곽 카드 경계선 없이 메시지 리스트 + 입력 바만 배경 위에 떠 있고,
 * 주황 포인트(아바타 로고·전송 버튼)와 `bg-[#F0F4FA]` 사용자 버블을 사용한다.
 * 상단 "← 새 대화 시작" 버튼으로 초기 화면(`InitialScreen`) 으로 돌아갈 수 있다.
 */
export function ChatPanel({ messages, onNewConversation }: ChatPanelProps) {
  const [advisoryConfirmed, setAdvisoryConfirmed] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 툴바 — 새 대화 시작 */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onNewConversation}
          className="gap-1.5 text-muted-foreground hover:text-[#005BAC]"
        >
          <ArrowLeft className="h-4 w-4" />
          새 대화 시작
        </Button>
      </div>

      {/* 메시지 리스트 */}
      <div className="flex flex-col gap-6">
        {messages.map((msg) => {
          if (msg.role === "user") {
            return (
              <div
                key={msg.id}
                className="ml-auto flex w-full flex-row-reverse gap-4"
              >
                <div className="h-8 w-8 flex-shrink-0" />
                <div className="max-w-md rounded-2xl bg-[#F0F4FA] px-4 py-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-black">
                    {msg.text}
                  </p>
                  {msg.piiOriginal ? (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      <span>PII 자동 마스킹 적용됨</span>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          }

          // ── 최종 답변 (full width AnswerCard)
          if (msg.final && msg.answer) {
            // 역질문 → 사용자 재확답을 거친 시나리오라면 트레이스 ①을
            // "역질문으로 확정" 상태로 전환 (원래 1차 저신뢰 배지 대신)
            const confirmedByClarify = msg.intent?.triggeredClarify === true
            return (
              <div key={msg.id} className="flex w-full items-start gap-4">
                <AgentAvatar />
                <div className="min-w-0 flex-1">
                  <AnswerCard
                    answer={msg.answer}
                    intent={msg.intent}
                    retrieval={msg.retrieval}
                    relevance={msg.relevance}
                    confirmedByClarify={confirmedByClarify}
                  />
                </div>
              </div>
            )
          }

          // ── 참고 정보 확인 요청 (advisory-confirm) 버블
          if (msg.tone === "advisory-confirm") {
            return (
              <div key={msg.id} className="flex w-full items-start gap-4">
                <AgentAvatar />
                <div className="flex max-w-[85%] flex-col gap-3 rounded-2xl border border-[#005BAC]/30 bg-[#EEF7FF]/40 px-4 py-3">
                  <div className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#005BAC]" />
                    <p>{msg.text}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={advisoryConfirmed}
                      onClick={() => setAdvisoryConfirmed(true)}
                      className={cn(
                        "gap-1.5 text-xs",
                        advisoryConfirmed
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "bg-[#005BAC] text-white hover:bg-[#004F9E]",
                      )}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {advisoryConfirmed ? "확인 완료" : "확인했습니다"}
                    </Button>
                  </div>
                </div>
              </div>
            )
          }

          // ── 역질문(clarify) 버블
          const clarify = msg.tone === "clarify"
          return (
            <div key={msg.id} className="flex w-full items-start gap-4">
              <AgentAvatar clarify={clarify} />
              <div
                className={cn(
                  "flex max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm leading-6",
                  clarify
                    ? "border border-[#8C8C8C]/40 bg-[#8C8C8C]/10 text-foreground"
                    : "border border-border/70 bg-card text-foreground",
                )}
              >
                {clarify ? (
                  <>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[#8C8C8C]">
                      역질문 · 영역 확인
                    </div>
                    {msg.intent ? <InlineReasoningTrace intent={msg.intent} /> : null}
                  </>
                ) : null}
                <div>{msg.text}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 공유 채팅 입력 바 — 기존 포털 chat-input.tsx 스타일 채택 */}
      <ChatInputBar placeholder="메시지를 입력하세요..." />
    </div>
  )
}

/**
 * 에이전트 아바타 — 포털 공통 주황 로고 이미지 사용.
 * 역질문 상태에서는 톤을 살짝 낮춘 회색 오버레이로 구분한다.
 */
function AgentAvatar({ clarify = false }: { clarify?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center",
        clarify && "opacity-60 grayscale",
      )}
    >
      <Image
        src="/shinhanlife-ai-mark.svg"
        alt="상담지식 에이전트"
        width={32}
        height={32}
        className="h-8 w-8 object-contain"
      />
      {clarify ? (
        <div
          className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-background bg-[#8C8C8C] text-white"
          aria-hidden
        >
          <AlertTriangle className="h-2.5 w-2.5" />
        </div>
      ) : null}
    </div>
  )
}

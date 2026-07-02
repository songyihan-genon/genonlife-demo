"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import {
  AlertTriangle,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Paperclip,
  ShieldAlert,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChatInputBar } from "@/components/shared"
import { cn } from "@/lib/utils"

import { piiDetection, sampleFiles } from "./mock-data"
import type { DataGuideScenario, SampleFileKind } from "./types"

interface ConversationViewProps {
  scenario: DataGuideScenario
  /** 에이전트 응답 영역 (mode별로 부모가 주입) */
  agentResponse: ReactNode
  /** "← 새 대화" 버튼 클릭 시 호출 — 초기 화면 복귀 */
  onNewConversation: () => void
}

/**
 * SFR-016 채팅 뷰 — 포털 `chat-interface` 와 동일한 플랫 레이아웃.
 *
 * 외곽 카드 경계선 없이 메시지·에이전트 응답·입력창이 배경 위에 직접 흐른다.
 * 입력창은 공유 `ChatInputBar` 를 사용해 포털 기존 `chat/chat-input` 스타일을
 * 그대로 채택한다 (Textarea + rounded-3xl + 원형 주황 전송 버튼).
 */
export function ConversationView({
  scenario,
  agentResponse,
  onNewConversation,
}: ConversationViewProps) {
  const file = sampleFiles[scenario.fileKind]
  const clarify = scenario.clarifyTurn

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
        {/* 사용자 Turn 1 — 초기 질의 + 파일 첨부 칩 */}
        <UserMessageBubble text={scenario.userQuery} file={file} />

        {clarify ? (
          scenario.mode === "pii-blocked" ? (
            <>
              {/* Agent PII 경고 카드 — PiiBlockedCard와 동일한 디자인 */}
              <div className="flex w-full items-start gap-4">
                <AgentAvatar />
                <div className="min-w-0 flex-1">
                  <PiiWarningCard />
                </div>
              </div>

              {/* 사용자 재업로드 — 파일 칩 포함 */}
              <UserMessageBubble text={clarify.userFollowUp} file={file} />
            </>
          ) : (
            <>
              {/* Agent 역질문 */}
              <ClarifyBubble text={clarify.agentQuestion} />

              {/* 사용자 재답변 */}
              <UserMessageBubble text={clarify.userFollowUp} />
            </>
          )
        ) : null}

        {/* Agent 최종 응답 */}
        <div className="flex w-full items-start gap-4">
          <AgentAvatar />
          <div className="min-w-0 flex-1">{agentResponse}</div>
        </div>
      </div>

      {/* 채팅 입력 바 — 차단 상태에서는 숨김 (CTA가 유일한 다음 행동) */}
      {scenario.mode !== "pii-blocked" && scenario.mode !== "missing-data" ? (
        <ChatInputBar placeholder="분석할 내용을 입력하세요..." hideAuxButtons />
      ) : null}
    </div>
  )
}

/**
 * Agent 주황 로고 아바타 — 포털 `chat-list` 와 동일한 32×32 이미지.
 */
function AgentAvatar({ clarify = false }: { clarify?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center",
        clarify && "opacity-70 grayscale",
      )}
    >
      <Image
        src="/shinhanlife-ai-mark.svg"
        alt="데이터길잡이 에이전트"
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

/** 사용자 말풍선 — 질의 + (선택) 파일 첨부 칩 */
function UserMessageBubble({
  text,
  file,
}: {
  text: string
  file?: { kind: SampleFileKind; name: string; sizeLabel: string }
}) {
  return (
    <div className="ml-auto flex w-full flex-row-reverse gap-4">
      <div className="h-8 w-8 flex-shrink-0" />
      <div className="flex max-w-md flex-col gap-2 rounded-2xl bg-[#F0F4FA] px-4 py-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-black">
          {text}
        </p>
        {file ? (
          <FileAttachChip
            kind={file.kind}
            name={file.name}
            size={file.sizeLabel}
          />
        ) : null}
      </div>
    </div>
  )
}

/** Agent 중간 응답 버블 — 역질문(회색) 또는 PII 경고(amber) */
function ClarifyBubble({
  text,
  label = "역질문 · 정보 확인",
  tone = "neutral",
}: {
  text: string
  label?: string
  tone?: "neutral" | "warning"
}) {
  const isWarning = tone === "warning"
  return (
    <div className="flex w-full items-start gap-4">
      <AgentAvatar clarify />
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2 rounded-2xl border px-4 py-3",
          isWarning
            ? "border-sky-300 bg-sky-50/60"
            : "border-[#8C8C8C]/40 bg-[#8C8C8C]/10",
        )}
      >
        <div
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wide",
            isWarning ? "text-sky-700" : "text-[#8C8C8C]",
          )}
        >
          {label}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {text}
        </p>
      </div>
    </div>
  )
}

/**
 * PII 경고 카드 — PiiBlockedCard와 동일한 디자인 구조를 경고 톤으로 재현.
 * "PII 탐지 시 경고를 표시" 요구사항의 1단계 시각화.
 */
function PiiWarningCard() {
  return (
    <div className="rounded-xl border border-[#005BAC]/40 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF7FF] text-[#005BAC]">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              개인정보 탐지 · 업로드 차단
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              업로드 파일에서 개인정보(PII)가 탐지되어 분석을 진행할 수 없습니다.
              비식별화된 파일로 다시 업로드해 주세요.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-medium text-muted-foreground">
              탐지 내역
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className="border-[#005BAC]/40 bg-[#EEF7FF] text-[#1B3A4B]"
              >
                주민등록번호 {piiDetection.rrn}건
              </Badge>
              <Badge
                variant="outline"
                className="border-[#005BAC]/40 bg-[#EEF7FF] text-[#1B3A4B]"
              >
                전화번호 {piiDetection.phone}건
              </Badge>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
              관리자가 등록한 비식별화 자료만 분석 대상으로 제공됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FileAttachChip({
  kind,
  name,
  size,
}: {
  kind: SampleFileKind
  name: string
  size: string
}) {
  const Icon =
    kind === "xlsx"
      ? FileSpreadsheet
      : kind === "hwpx"
        ? FileText
        : ShieldAlert

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 self-end rounded-lg border border-[#005BAC]/40 bg-white px-3 py-1.5 text-[11px] text-[#1B3A4B] shadow-sm",
      )}
    >
      <Paperclip className="h-3 w-3 text-muted-foreground" />
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium">{name}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">{size}</span>
    </div>
  )
}

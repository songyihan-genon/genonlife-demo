"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import type { ComponentType, ReactNode } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Bot,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleDot,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  ExternalLink,
  FileCheck2,
  FileText,
  Headphones,
  Layers,
  Loader2,
  MessageSquare,
  PhoneOutgoing,
  ScrollText,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  UserRound,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { StreamingText } from "@/components/ui/streaming-text"
import { cn } from "@/lib/utils"

/* ================================================================== */
/* RAG 지식 답변 (약관 요약 · 업무 기준 검색 — 지식성 질의에만 사용)    */
/* ================================================================== */

type Topic = "consent" | "claim" | "autodebit" | "surrender" | null

interface KnowledgeSource {
  type: "약관" | "업무기준" | "상품"
  label: string
}

interface Answer {
  summary: string
  bullets: string[]
  sources: KnowledgeSource[]
  standard: string
}

function generateAnswer(query: string): Answer {
  if (/(자동이체|계좌|납입|카드)/.test(query)) {
    return {
      summary: "보험료 자동이체 계좌 변경은 본인 명의 계좌만 가능하며, 출금일 5영업일 전 신청 시 당월분부터 적용됩니다.",
      bullets: ["본인 명의 계좌 원칙 (타인 명의 시 예금주 동의 필요)", "출금일 5영업일 전 신청 → 당월 / 이후 → 익월 적용", "카드납 전환은 신용·체크카드 모두 가능"],
      sources: [{ type: "업무기준", label: "수금·자동이체 업무지침 제8조" }],
      standard: "월대체·보험금 접수 진행 중 계약은 변경 제한될 수 있어 계약별 상태 확인 필요(→ 업무정보 참고).",
    }
  }
  if (/(해지|환급|해약)/.test(query)) {
    return {
      summary: "무배당 종신보험 해지환급금은 경과기간 기준으로 산출되며, 해지 시 보장 종료·재가입 제한을 반드시 고지해야 합니다.",
      bullets: ["해지환급금 = 책임준비금 − 해지공제액", "해지 시 주계약·특약 보장 동시 종료", "해지방어 스크립트 우선 안내 권장"],
      sources: [{ type: "약관", label: "종신보험 약관 제30조(해지환급금)" }, { type: "업무기준", label: "해지방어 상담 가이드" }],
      standard: "해지 전 보장 상실·재가입 제한 고지 의무. 예상 환급금 등 실 수치는 업무정보(처리계) 조회값을 확인.",
    }
  }
  if (/(개인정보|녹취|본인확인|동의)/.test(query)) {
    return {
      summary: "상담 시작 전 통화 녹취 고지와 개인정보 수집·이용 동의가 필요하며, 고객의 명시적 동의 이후 본인 확인을 거쳐 상담을 진행합니다.",
      bullets: ["통화 녹취 사실 고지(필수)", "개인정보 수집·이용 동의 — 필수 항목 동의 후 진행", "본인 확인(성명·생년월일 등)"],
      sources: [{ type: "업무기준", label: "상담 운영 지침 · 개인정보 처리방침" }],
      standard: "필수 항목 동의 거부 시 일부 업무 처리 제한. 동의 여부는 시스템에 기록.",
    }
  }
  if (/(청약|철회)/.test(query)) {
    return {
      summary: "청약 철회는 보험증권을 받은 날부터 15일 이내(청약일로부터 30일 초과 시 제한) 가능하며, 철회 시 납입 보험료를 전액 환급합니다.",
      bullets: ["철회 기간: 증권 수령 15일 / 청약 30일 이내", "전화·서면·모바일 앱으로 신청 가능", "철회 시 기납입 보험료 전액 환급"],
      sources: [{ type: "약관", label: "보험약관 청약 철회 조항" }, { type: "업무기준", label: "청약철회 처리지침" }],
      standard: "전문보험계약자·일부 상품(자동차 등)은 청약 철회가 제한될 수 있음.",
    }
  }
  if (/(실효|미납|연체|부활)/.test(query)) {
    return {
      summary: "보험료 미납 시 납입최고(독촉) 기간을 거쳐 계약이 실효되며, 실효 후 일정 기간 내 부활 청약이 가능합니다.",
      bullets: ["납입기일 후 납입최고기간(약 2개월) 경과 시 실효", "실효일로부터 3년 이내 부활 청약 가능", "부활 시 미납 보험료+이자 납입 및 건강 고지 필요"],
      sources: [{ type: "약관", label: "보험료 납입·실효·부활 조항" }],
      standard: "부활은 심사 결과에 따라 거절될 수 있으며, 실효 기간 중 보장은 적용되지 않음.",
    }
  }
  if (/(지연|지급지연|이자)/.test(query)) {
    return {
      summary: "보험금 지급이 약정 기일을 초과하면 지연이자가 가산되어 지급됩니다.",
      bullets: ["지급기일 초과 시 지연이자 가산", "지연이자율은 약관·시행세칙 기준 적용", "서류 보완 등 고객 귀책 기간은 산정에서 제외"],
      sources: [{ type: "약관", label: "보험금 지급(지연이자) 조항" }, { type: "업무기준", label: "지연이자 산정지침" }],
      standard: "지연이자율·기산일은 약관 기준을 확인 후 안내.",
    }
  }
  // 기본: 보험금 청구 추가서류 — 접수 단계는 상품 무관, 공통 손해 입증 서류 기준으로 안내(지식).
  // 고객의 실제 제출/미제출 현황은 RAG가 아닌 업무정보에서 제공.
  return {
    summary: "보험금 청구 접수 시 필요한 공통 구비서류 기준으로 안내드립니다. 기본 서류는 진료비계산서, 진료비 세부내역서이며 고액·특정 질환은 진단서가 추가됩니다.",
    bullets: ["진료비계산서 (공통 필수)", "진료비 세부내역서 (비급여 항목 확인용)", "진단서·소견서 (고액·특정 질환 청구 시)"],
    sources: [{ type: "약관", label: "보험금 청구서류 기준(약관 제12조)" }, { type: "업무기준", label: "보험금 청구 업무매뉴얼 v3.2" }],
    standard: "위 서류는 청구 시 공통 구비서류 기준입니다. 고객의 실제 제출/미제출 현황은 업무정보에서 확인하세요.",
  }
}

const faqPresets = ["청약 철회 가능 기간은?", "보험료 미납 시 실효·부활 기준은?", "보험금 지급 지연 시 이자 기준은?"]

/* ================================================================== */
/* 시나리오                                                            */
/* ================================================================== */

type Speaker = "customer" | "agent"
type HighlightTarget = "context" | "guide" | "rag" | "work" | "next" | null

interface ScenarioStep {
  bubble: { speaker: Speaker; time: string; text: string }
  highlightInBubble?: string[] // 버블 본문에서 강조할 키워드 원문(추출 근거)
  keywords?: string[] // 키워드 패널에 등록할 '업무' 키워드
  autoKeyword?: string // 자동 선택(하이라이트)할 키워드
  query?: string // RAG 지식 질의 (지식성 질의만)
  awaitContract?: string // 답변 후, 사용자가 이 계약을 직접 클릭해야 다음 발화로 진행
  claimGate?: boolean // 답변 후, 업무정보 '청구진행 현황' 탭으로 전환하고 1초 뒤 다음 발화
  quietHighlight?: boolean // 키워드 칩 / RAG 창 하이라이트 생략
  fast?: boolean // 마무리 구간 — 타이핑 빠르게 + 발화 간 지연 최소(0.1초)
  effects?: {
    announce?: string[] // FCR 안내 완료(고객 동의 대기)
    confirm?: string[] // FCR 고객 동의/확인 완료
    syncAnnounce?: { id: string; phrase: string }[] // 상담사 안내 문구 시점에 FCR 안내(노란색)
    syncConfirm?: { id: string; phrase: string }[] // 고객 동의 문구 시점에 FCR 확인(초록색)
    flags?: string[]
    topic?: Topic
    contract?: string
    script?: string
    scriptStep?: number // 상담사 발화 중 강조할 추천 스크립트 단계 인덱스
    highlight?: HighlightTarget
    lightSms?: boolean // 추천 패널의 'SMS 안내 발송' 액션 점등(마무리)
  }
}

const SCENARIO: ScenarioStep[] = [
  // 0 — 인사 · 본인확인/동의 요청
  {
    bubble: { speaker: "agent", time: "10:21", text: "안녕하세요, 제논라이프 상담사 김제나입니다. 통화 내용은 녹취되며, 상담을 위해 본인 확인과 개인정보 수집·이용 동의가 필요합니다." },
    effects: {
      flags: ["lapse", "renewal", "claim"],
      syncAnnounce: [
        { id: "record", phrase: "녹취되며" },
        { id: "verify", phrase: "본인 확인" },
        { id: "privacy", phrase: "개인정보 수집·이용 동의" },
      ],
      script: "intro",
      topic: "consent",
    },
  },
  // 1 — 고객: 동의(→FCR 초록 확인) + 추가서류 질의
  {
    bubble: { speaker: "customer", time: "10:21", text: "네, 동의합니다. 본인은 김민준이고요. 그런데 보험금 청구에 추가 서류가 필요하다고 문자가 와서요. 어떤 걸 더 내야 하죠?" },
    highlightInBubble: ["추가 서류"],
    keywords: ["추가서류"],
    effects: {
      topic: "claim",
      script: "claim", // 고객 발화 종료·키워드 추출 후 스크립트 가이드 갱신 → 이후 상담사 발화
    },
  },
  // 2 — 상담사: 조회 안내(대기 멘트) + RAG 추천질문/답변 + 실손 계약 확인 게이트
  {
    bubble: { speaker: "agent", time: "10:22", text: "청구하신 건을 조회해 보겠습니다. 잠시만 기다려 주세요." },
    autoKeyword: "추가서류",
    query: "해당 고객 보험금 청구 시 필요한 추가 서류는?",
    claimGate: true,
    quietHighlight: true,
    effects: { topic: "claim", script: "claim" },
  },
  // 3 — 상담사: 미제출 안내
  {
    bubble: { speaker: "agent", time: "10:22", text: "확인해 보니 진료비 세부내역서가 미제출 상태입니다. 병원 원무과에서 발급 후 앱으로 제출해 주세요." },
    // 심사 소요기간은 안내하지 않았으므로 claim-period는 미체크(pending) 유지
    effects: { confirm: ["claim-doc", "claim-channel"], scriptStep: 1, highlight: "next" },
  },
  // 4 — 고객: 자동이체 변경 질의 (키워드 추출만, 즉답은 상담사가)
  {
    bubble: { speaker: "customer", time: "10:23", text: "아 네 알겠습니다. 그리고 보험료 자동이체 계좌도 바꾸고 싶은데 가능할까요?" },
    highlightInBubble: ["자동이체 계좌"],
    keywords: ["자동이체 계좌변경"],
    effects: { topic: "autodebit", script: "autodebit" },
  },
  // 5 — 상담사: 즉답 안내 → 이어서 RAG 검색(추천 질문)
  {
    bubble: { speaker: "agent", time: "10:23", text: "네, 본인 명의 계좌로 변경 가능합니다. 처리 가능 여부와 유의사항 확인해 드리겠습니다." },
    autoKeyword: "자동이체 계좌변경",
    query: "자동이체 계좌 변경 기준 알려줘",
    effects: { topic: "autodebit", confirm: ["ad-owner"], scriptStep: 0, highlight: "rag" },
  },
  // 6 — 상담사: RAG 검색 후 추가 답변
  {
    bubble: { speaker: "agent", time: "10:24", text: "출금일 5영업일 전 신청 시 당월분부터 적용됩니다. 카드납 전환은 신용·체크카드 모두 가능합니다." },
    effects: { confirm: ["ad-apply", "ad-card"], scriptStep: 1 },
  },
  // 7 — 고객: 해지환급금 질의 (RAG 기반)
  {
    bubble: { speaker: "customer", time: "10:24", text: "아 네 마지막으로, 예전에 가입한 종신보험 해지하면 환급금 얼마 나오는지도 궁금해요." },
    highlightInBubble: ["해지", "환급금"],
    keywords: ["해지환급금"],
    autoKeyword: "해지환급금",
    query: "해지환급금 안내 시 유의할 점은?",
    effects: { topic: "surrender", script: "surrender", highlight: "rag" },
  },
  // 8 — 상담사: 해지 시 보장 종료 선고지 → 종신보험 상품 클릭(정보 확인) 대기
  {
    bubble: { speaker: "agent", time: "10:25", text: "예상 해지환급금 안내 전, 해지 시 보장이 종료되고 재가입에 제한이 있는 점 먼저 말씀드립니다." },
    awaitContract: "SL-1180-3372",
    effects: { confirm: ["sr-loss", "sr-rejoin"], scriptStep: 0 },
  },
  // 9 — 상담사: 예상 환급금 대략 안내 + 문자 발송 제안
  {
    bubble: { speaker: "agent", time: "10:25", text: "조회해 보니 예상 환급금은 약 1,842만원입니다. 해지 시점에 따라 달라질 수 있어, 정확한 금액은 문자로도 보내드리겠습니다." },
    effects: { confirm: ["sr-refund"], scriptStep: 2, highlight: "next" },
  },
  // 10 — 고객: 문자 수신 동의 (마무리 구간 — 빠른 진행)
  {
    bubble: { speaker: "customer", time: "10:26", text: "네, 문자로 받아볼게요." },
    fast: true,
    effects: { highlight: "next" },
  },
  // 11 — 상담사: 문자 발송 안내
  {
    bubble: { speaker: "agent", time: "10:26", text: "네, 예상 환급금 안내와 오늘 상담 내용을 문자로 보내드리겠습니다." },
    fast: true,
  },
  // 12 — 상담사: 상담 마무리 인사 → 통화 종료 후 SMS 후속작업 점등
  {
    bubble: { speaker: "agent", time: "10:27", text: "더 궁금하신 점 있으시면 언제든 연락 주세요. 상담사 김제나였습니다." },
    fast: true,
    effects: { lightSms: true, highlight: "next" },
  },
  // 13 — 고객: 감사 인사로 마무리
  {
    bubble: { speaker: "customer", time: "10:27", text: "네, 감사합니다." },
    fast: true,
  },
]

const STREAM_SPEED = 96 // STT 타이핑 속도(ms/char)
const FAST_SPEED = 64 // 마무리 구간 타이핑 속도(ms/char) — 기본(96) 대비 1.5배 빠름
const streamDuration = (text: string, fast?: boolean) => Math.min(120 + text.length * (fast ? FAST_SPEED : STREAM_SPEED), fast ? 2500 : 9000)

/* ================================================================== */
/* 데이터 정의                                                         */
/* ================================================================== */

interface ChatMsg extends Partial<Answer> {
  id: string
  role: "user" | "assistant"
  content: string
}

type FcrStatus = "pending" | "confirmed"

interface ChecklistItem {
  id: string
  label: string
  auto?: boolean // 안내/동의가 시나리오로 자동 진행되는 항목
  required?: boolean
  consent?: boolean // 고객 '동의'가 필요한 항목 (안내→동의 2단계)
}

// FCR 필수 안내도 추천 스크립트처럼 대화 주제(키워드)별로 제시
const fcrByScript: Record<string, ChecklistItem[]> = {
  intro: [
    { id: "record", label: "통화 녹취 고지", auto: true, required: true, consent: true },
    { id: "privacy", label: "개인정보 수집·이용 동의", auto: true, required: true, consent: true },
    { id: "verify", label: "본인 확인", auto: true, required: true, consent: true },
  ],
  claim: [
    { id: "claim-doc", label: "추가서류·처리절차 안내", auto: true, required: true },
    { id: "claim-channel", label: "모바일 제출 경로 안내", auto: true },
    { id: "claim-period", label: "심사 소요기간 안내", auto: true },
  ],
  autodebit: [
    { id: "ad-owner", label: "본인 명의 계좌 확인", auto: true, required: true },
    { id: "ad-apply", label: "변경 적용일(5영업일) 안내", auto: true },
    { id: "ad-card", label: "카드납 전환 안내", auto: true },
  ],
  surrender: [
    { id: "sr-loss", label: "해지 시 보장 종료 고지", auto: true, required: true },
    { id: "sr-rejoin", label: "재가입 제한 고지", auto: true, required: true },
    { id: "sr-refund", label: "예상 환급금 안내", auto: true },
  ],
}

// gated: 고객 상황에 따라 달라지는 안내(실제 확인 후 노출). 미지정 단계는 토픽 선택 시 항상 미리 노출
const scripts: Record<string, { title: string; steps: { phase: string; text: string; gated?: boolean }[] }> = {
  intro: {
    title: "도입 · 본인확인 · 동의",
    steps: [
      { phase: "도입", text: "안녕하세요, 제논라이프 상담사 김제나입니다." },
      { phase: "녹취·동의 고지", text: "통화가 녹취되며 개인정보 수집·이용 동의가 필요합니다. 동의하시겠어요?" },
      { phase: "본인확인", text: "본인 확인을 위해 성함과 생년월일을 말씀해 주시겠어요?" },
    ],
  },
  claim: {
    title: "보험금 청구 서류 안내",
    steps: [
      { phase: "확인", text: "청구하신 건을 조회해 보겠습니다. 잠시만 기다려 주세요." },
      { phase: "안내", text: "진료비 세부내역서가 미제출 상태입니다. 병원 원무과 발급 후 앱으로 제출해 주세요.", gated: true },
      { phase: "마무리", text: "서류가 접수되면 통상 3영업일 이내 심사가 진행됩니다." },
    ],
  },
  autodebit: {
    title: "자동이체 계좌 변경 안내",
    steps: [
      { phase: "도입", text: "자동이체 계좌 변경 도와드리겠습니다. 본인 명의 계좌이신가요?" },
      { phase: "안내", text: "출금일 5영업일 전까지 신청하시면 이번 달부터 새 계좌로 출금됩니다." },
      { phase: "마무리", text: "변경 내역은 문자로도 안내드리겠습니다." },
    ],
  },
  surrender: {
    title: "해지환급금 · 해지방어 안내",
    steps: [
      { phase: "선고지", text: "해지환급금 안내 전, 해지 시 보장이 종료되는 점 먼저 말씀드립니다." },
      { phase: "방어", text: "보장을 유지하면서 부담을 줄이는 방법도 함께 안내드릴까요?" },
      { phase: "안내", text: "예상 환급금을 대략 안내드리고, 정확한 금액은 문자로도 발송하세요.", gated: true },
    ],
  },
}

interface ContractDetail {
  figures: [string, string, ("wallet" | "shield" | "card")?][] // 월보험료 / 해지환급금 / 갱신주기
  infoGroups: { id: string; title: string; sub?: string; rows: [string, string][] }[] // 항목별 실제 정보(가능 여부 X)
  cautions: string[]
}

// 접수 단계 손해 입증 서류는 상품 무관·공통 — 청구 1건 기준(업무정보 상단에 1회 표시)
const CLAIM_DOCS: { required: string; status: "제출 완료" | "미제출" }[] = [
  { required: "진료비계산서(영수증)", status: "제출 완료" },
  { required: "진료비 세부내역서", status: "미제출" },
  { required: "진단서 (고액·특정질환 시)", status: "미제출" },
]

// 고객정보(정보계 연동) — 상담 시 참고하는 핵심 고객 정보, 그룹별 테이블
const CUSTOMER_INFO: { group: string; rows: [string, string][] }[] = [
  {
    group: "인적 사항",
    rows: [
      ["고객명", "김민준"],
      ["생년월일", "1985.07.12 (만 39세)"],
      ["성별", "남"],
      ["휴대폰", "010-3***-**42"],
    ],
  },
  {
    group: "고객 구분",
    rows: [
      ["고객번호", "C-10294857"],
      ["고객등급", "우량 (Gold)"],
      ["세그먼트", "장기 유지 · 다보유"],
      ["본인확인", "완료 (ARS 인증)"],
    ],
  },
  {
    group: "거래 현황",
    rows: [
      ["보유 계약", "2건 (유효 2)"],
      ["월 납입 합계", "180,400원"],
      ["거래 기간", "8년 2개월 (최초 2018.07)"],
      ["마케팅 수신", "동의 (문자·앱 PUSH)"],
    ],
  },
]

// 진행 중 보험금 청구(고객 단위 · 상품 미할당) — 접수 단계는 서류 누락 검토, 보장 상품은 심사 단계에서 결정
const CLAIM_PROGRESS = {
  active: true,
  stage: "접수중" as ClaimStage,
  claimNo: "CLM-20260514-0032",
  filedAt: "2026.05.14",
  docs: CLAIM_DOCS,
  coverage: ["실손 의료비 비례 보상", "종신 특약 정액 보장"],
}

// 가입상품 — 납입 상태(정상 납입/미납/실효) + 접수 단계(접수중/심사중/지급완료/해당없음) 2종 태그
type PayStatus = "정상 납입" | "미납" | "실효"
type ClaimStage = "접수중" | "심사중" | "지급완료" | "해당없음"
const contracts: { no: string; name: string; pay: PayStatus; claim: ClaimStage }[] = [
  // 보험금 청구 1건은 접수 단계에서 상품 미할당 — 실손·종신(특약) 모두 보장 후보로 '접수중'
  { no: "SL-2048-5521", name: "(무)제논실손의료비보험", pay: "정상 납입", claim: "접수중" },
  { no: "SL-1180-3372", name: "(무)제논종신보험", pay: "정상 납입", claim: "접수중" },
]
function payTone(s: PayStatus): string {
  return s === "정상 납입"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : s === "미납"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-red-200 bg-red-50 text-red-600"
}
function claimTone(s: ClaimStage): string {
  return s === "심사중"
    ? "border-sky-200 bg-sky-50 text-sky-700"
    : s === "접수중"
      ? "border-[#bad6f4] bg-[#f2f8ff] text-[#0f3468]"
      : s === "지급완료"
        ? "border-slate-200 bg-slate-50 text-slate-600"
        : "border-slate-200 bg-slate-50 text-slate-400"
}

const contractDetail: Record<string, ContractDetail> = {
  "SL-2048-5521": {
    figures: [
      ["월 보험료", "32,400원", "wallet"],
      ["해지환급금(예상)", "없음 (소멸성)", "shield"],
      ["갱신주기", "1년 갱신 · 2026.03", "card"],
    ],
    infoGroups: [
      {
        id: "payment",
        title: "자동이체·납입 정보",
        sub: "수금계 연동",
        rows: [
          ["납입 방법", "자동이체 · 제논카드 ****-21"],
          ["출금일", "매월 25일"],
          ["납입 현황", "정상 납입 (당월 출금 완료)"],
        ],
      },
      {
        id: "policy",
        title: "계약 정보",
        rows: [
          ["가입일", "2021.03.15"],
          ["보험기간", "1년 갱신형 · 100세 만기"],
          ["피보험자", "김민준 (본인)"],
        ],
      },
    ],
    cautions: ["보험금 접수 진행 중 — 계약 변경 처리 시 유의", "갱신 안내장 발송 이력 있음"],
  },
  "SL-1180-3372": {
    figures: [
      ["월 보험료", "148,000원", "wallet"],
      ["해지환급금(예상)", "18,420,000원", "shield"],
      ["갱신주기", "비갱신 · 종신보장", "card"],
    ],
    infoGroups: [
      {
        id: "payment",
        title: "자동이체·납입 정보",
        sub: "수금계 연동",
        rows: [
          ["납입 방법", "자동이체 · 제논은행 ****-21"],
          ["출금일", "매월 5일"],
          ["납입 현황", "정상 납입 (86/240회)"],
        ],
      },
      {
        id: "policy",
        title: "계약 정보",
        rows: [
          ["가입일", "2018.07.20"],
          ["보험기간", "종신 · 20년납"],
          ["부가 특약", "수술·입원일당·진단 특약"],
          ["피보험자", "김민준 (본인)"],
        ],
      },
    ],
    cautions: ["정상 납입 중 (자동이체)", "과거 실효 후 부활 이력 1건", "해지환급금 문의 시 해지방어 안내 필수"],
  },
}

const flagMeta: Record<string, { icon: ComponentType<{ className?: string }>; label: string; tone: "danger" | "warn" }> = {
  lapse: { icon: AlertTriangle, label: "실효 이력 3건", tone: "danger" },
  renewal: { icon: FileText, label: "갱신 안내장 수령", tone: "warn" },
  claim: { icon: ShieldCheck, label: "보험금 접수 중", tone: "warn" },
}

const figureIcon = { wallet: Wallet, shield: ShieldCheck, card: CreditCard }

/* ================================================================== */
/* Main                                                                */
/* ================================================================== */

/* ================================================================== */
/* 콜 대기(기본) 화면 — 특정 고객과 무관. 빈 시간 업무 숙지용             */
/* 메뉴 '실시간 고객 상담' 직접 진입 시 노출. 데모 케이스(김민준)는 콜    */
/* 인입 또는 하위 '데모 케이스' 메뉴로 진입(demoCase="kim").             */
/* ================================================================== */

// 제논라이프 전체 판매 상품 카탈로그(업무정보 — 콜 대기 시 노출)
const PRODUCTS: { cat: string; items: { name: string; code: string; tag?: string }[] }[] = [
  { cat: "보장성 · 종신/정기", items: [
    { name: "(무)제논종신보험", code: "WL", tag: "대표" },
    { name: "(무)제논정기보험", code: "TL" },
    { name: "(무)제논더든든종신보험", code: "WL+" },
  ] },
  { cat: "건강 · 질병", items: [
    { name: "(무)제논암보험", code: "CA" },
    { name: "(무)제논건강보험", code: "HE" },
    { name: "(무)제논치아보험", code: "DN" },
    { name: "(무)제논간병보험(장기요양)", code: "LTC" },
  ] },
  { cat: "실손 · 의료비", items: [
    { name: "(무)제논실손의료비보험", code: "MX", tag: "대표" },
    { name: "(무)제논수술비보험", code: "SG" },
  ] },
  { cat: "저축 · 연금", items: [
    { name: "(무)제논연금보험", code: "PN" },
    { name: "(무)제논변액연금보험", code: "VA" },
    { name: "(무)제논저축보험", code: "SV" },
  ] },
  { cat: "운전자 · 상해", items: [
    { name: "(무)제논운전자보험", code: "DR" },
    { name: "(무)제논상해보험", code: "AC" },
  ] },
  { cat: "어린이", items: [
    { name: "(무)제논어린이보험", code: "KI" },
  ] },
]

// 상단 컨텍스트 바 — 연결된 고객 없음(대기)
function IdleContextBar() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#dbe5f1] bg-white px-5 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <Headphones className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold text-[#10233f]">상담 대기 중</span>
            <Badge variant="outline" className="h-4 gap-1 border-emerald-200 bg-emerald-50 px-1.5 text-[9px] text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 수신 대기</Badge>
          </div>
          <div className="text-[10.5px] text-muted-foreground">연결된 고객 없음 · 콜이 인입되면 고객 정보가 자동 연동됩니다</div>
        </div>
      </div>
      <div className="ml-auto hidden text-[10.5px] text-muted-foreground lg:block">빈 시간에는 상담 가이드 · 상품 정보 · 지식 검색으로 업무를 숙지하세요</div>
    </div>
  )
}

// STT 패널 — 콜 대기 상태
function IdleSTT() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#f7fafe] px-6 text-center">
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4fb]">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0f3468]/15" />
        <Headphones className="relative h-6 w-6 text-[#0f3468]/60" />
      </span>
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-[#10233f]">콜 대기 중</p>
        <p className="text-[11px] leading-5 text-muted-foreground">콜이 연결되면 실시간 STT가<br />고객·상담사 발화를 자동으로 받아씁니다.</p>
      </div>
    </div>
  )
}

// 콜 대기 시 참고하는 상담 가이드 — 필수 응대 절차 + 자주 들어오는 상담
type GuideTag = "필수" | "자주" | "주의"
const IDLE_GUIDES: { key: string; title: string; tag: GuideTag; steps: { phase: string; text: string }[] }[] = [
  {
    key: "intro", title: "도입 · 본인확인 · 동의", tag: "필수",
    steps: [
      { phase: "도입 인사", text: "안녕하세요, 제논라이프 상담사 ○○○입니다. 무엇을 도와드릴까요?" },
      { phase: "녹취 고지", text: "상담 품질 향상을 위해 통화 내용이 녹취됨을 안내합니다." },
      { phase: "개인정보 동의", text: "상담을 위해 개인정보 수집·이용 동의가 필요함을 안내하고 동의 여부를 확인합니다." },
      { phase: "본인 확인", text: "성함·생년월일 또는 계약번호로 본인 확인을 진행합니다." },
      { phase: "대리인 확인", text: "계약자 본인이 아닌 경우 위임 관계와 위임장 여부를 확인합니다." },
    ],
  },
  {
    key: "claim", title: "보험금 청구 접수 · 서류 안내", tag: "자주",
    steps: [
      { phase: "접수 확인", text: "청구 건을 조회하고 사고·진료 내용 및 청구 보장을 확인합니다." },
      { phase: "구비서류 안내", text: "청구서, 진료비계산서·세부내역서, 고액·특정질환 시 진단서 등 기본 서류를 안내합니다." },
      { phase: "제출 방법", text: "모바일 앱·팩스·방문 등 제출 경로와 원본/사본 기준을 안내합니다." },
      { phase: "심사 일정", text: "서류 접수 후 통상 3영업일 이내 심사가 진행됨을 안내합니다." },
      { phase: "지급 안내", text: "지급 계좌·예상 지급일을 확인하고 부지급·일부지급 가능성을 사전 고지합니다." },
    ],
  },
  {
    key: "autodebit", title: "자동이체 · 납입 계좌 변경", tag: "자주",
    steps: [
      { phase: "권한 확인", text: "계좌 변경 권한이 있는 계약자 본인인지 확인합니다." },
      { phase: "계좌 수집", text: "변경할 본인 명의 계좌 또는 카드 정보를 확인합니다." },
      { phase: "적용 시점", text: "출금일 5영업일 전까지 신청 시 당월부터 새 계좌로 출금됨을 안내합니다." },
      { phase: "납입 방법 전환", text: "계좌납 ↔ 카드납 전환 가능 여부와 카드 한도 영향을 안내합니다." },
      { phase: "마무리", text: "변경 내역을 문자로 안내하고 다음 출금 예정일을 확인합니다." },
    ],
  },
  {
    key: "lapse", title: "보험료 미납 · 실효 · 부활", tag: "주의",
    steps: [
      { phase: "현황 확인", text: "미납 회차와 납입최고기간 경과 여부를 확인합니다." },
      { phase: "실효 고지", text: "납입최고기간이 지나면 계약이 실효됨을 명확히 고지합니다." },
      { phase: "부활 안내", text: "실효일로부터 3년 이내 부활 청약이 가능함을 안내합니다." },
      { phase: "부활 조건", text: "미납 보험료·연체이자 납입과 건강 고지(재심사)가 필요함을 고지합니다." },
      { phase: "유지 대안", text: "감액·납입유예 등 계약을 유지할 수 있는 방법을 함께 제시합니다." },
    ],
  },
  {
    key: "surrender", title: "해지환급금 · 해지 방어", tag: "주의",
    steps: [
      { phase: "선고지", text: "해지 시 보장이 종료되고 동일 조건 재가입이 제한될 수 있음을 먼저 고지합니다." },
      { phase: "사유 청취", text: "해지 사유(보험료 부담·자금 필요 등)를 확인합니다." },
      { phase: "방어 안내", text: "감액완납·납입유예·약관대출 등 유지 대안을 제시합니다." },
      { phase: "환급금 안내", text: "예상 환급금은 경과기간·약관대출 잔액에 따라 달라짐을 안내합니다." },
      { phase: "처리", text: "해지 의사가 확정되면 절차·지급 일정을 안내하고 문자로 재안내합니다." },
    ],
  },
  {
    key: "loan", title: "약관대출 신청 · 상환", tag: "자주",
    steps: [
      { phase: "한도 조회", text: "해지환급금을 기준으로 대출 가능 한도를 조회합니다." },
      { phase: "금리 안내", text: "적용 금리와 이자 부과 방식(복리·정산 시점)을 안내합니다." },
      { phase: "신청", text: "대출 신청 경로와 입금 예정 일정을 안내합니다." },
      { phase: "상환", text: "수시·자동 상환 방법과 미상환 시 환급금 차감 영향을 고지합니다." },
    ],
  },
  {
    key: "beneficiary", title: "계약자 · 수익자 변경", tag: "자주",
    steps: [
      { phase: "권한 확인", text: "변경 권한자(계약자) 본인 여부를 확인합니다." },
      { phase: "필요 서류", text: "변경 신청서·신분증·관계 증빙 등 필요 서류를 안내합니다." },
      { phase: "유의사항", text: "수익자 변경 시 피보험자 서면 동의가 필요할 수 있음을 고지합니다." },
      { phase: "처리", text: "접수 경로와 처리 소요일을 안내하고 완료 시 통지를 약속합니다." },
    ],
  },
  {
    key: "complaint", title: "민원 · 불만 응대", tag: "필수",
    steps: [
      { phase: "경청·공감", text: "고객의 불만을 끊지 않고 끝까지 경청하며 공감을 표현합니다." },
      { phase: "사실 확인", text: "상담 이력·처리 내역을 조회해 사실관계를 확인합니다." },
      { phase: "해결 제시", text: "가능한 해결 방안과 처리 일정을 명확하게 안내합니다." },
      { phase: "이관·콜백", text: "즉시 해결이 어려우면 담당 부서 이관 또는 콜백을 예약합니다." },
      { phase: "기록", text: "민원 내용과 처리 결과를 접촉이력에 정확히 기록합니다." },
    ],
  },
]

// 상담 가이드 패널 — 필수·자주 상담 가이드(콜 대기 시 참고/숙지)
function IdleGuide() {
  const [open, setOpen] = useState<string>(IDLE_GUIDES[0].key)
  const tagTone: Record<GuideTag, string> = {
    필수: "border-[#bad6f4] bg-[#f2f8ff] text-[#0b4f91]",
    자주: "border-sky-200 bg-sky-50 text-sky-700",
    주의: "border-amber-200 bg-amber-50 text-amber-700",
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mb-1.5 flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
        <Sparkles className="h-3 w-3 text-[#8fb4df]" /> 필수 응대 절차 · 자주 들어오는 상담 가이드
      </div>
      <div className="space-y-1.5">
        {IDLE_GUIDES.map((g) => {
          const isOpen = open === g.key
          return (
            <div key={g.key} className={cn("overflow-hidden rounded-lg border bg-white", isOpen ? "border-[#cfe0f1]" : "border-[#e2eaf4]")}>
              <button type="button" onClick={() => setOpen(isOpen ? "" : g.key)} className={cn("flex w-full items-center gap-1.5 px-2.5 py-2 text-left outline-none focus:outline-none focus-visible:outline-none", isOpen && "bg-[#f2f8ff]")}>
                <ClipboardCheck className="h-3.5 w-3.5 shrink-0 text-[#0f3468]" />
                <span className="text-[11.5px] font-semibold text-[#10233f]">{g.title}</span>
                <span className={cn("shrink-0 rounded-full border px-1.5 py-0.5 text-[8.5px] font-semibold", tagTone[g.tag])}>{g.tag}</span>
                <span className="ml-auto shrink-0 text-[9px] text-muted-foreground">{isOpen ? "접기 ▲" : "보기 ▼"}</span>
              </button>
              {isOpen ? (
                <ol className="space-y-1.5 border-t border-[#eef3f9] px-2.5 py-2">
                  {g.steps.map((st, i) => (
                    <li key={i} className="flex gap-2 text-[10.5px] leading-4">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0f3468]/10 text-[8px] font-bold text-[#0f3468]">{i + 1}</span>
                      <span><span className="font-semibold text-[#0b4f91]">{st.phase}</span> · <span className="text-[#10233f]">{st.text}</span></span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 업무정보 패널 — 제논라이프 전체 상품 리스트
function IdleProducts() {
  return (
    <Card className="flex h-full flex-col overflow-hidden gap-0 py-0">
      <CardHeader className="shrink-0 border-b bg-white px-3 pb-1.5 pt-2">
        <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#10233f]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0f3468]" /> 제논라이프 상품
        </div>
        <div className="mt-0.5 text-[10px] text-muted-foreground">전체 판매 상품 — 콜 연동 시 고객 보유 계약으로 전환</div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2.5">
        {PRODUCTS.map((g) => (
          <div key={g.cat}>
            <div className="mb-1 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground/70">{g.cat}</div>
            <div className="space-y-1">
              {g.items.map((p) => (
                <div key={p.name} className="flex items-center gap-2 rounded-lg border border-[#e2eaf4] bg-white px-2.5 py-1.5">
                  <span className="flex h-6 w-7 shrink-0 items-center justify-center rounded-md bg-[#0f3468]/10 text-[8.5px] font-bold text-[#0f3468]">{p.code}</span>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#10233f]">{p.name}</span>
                  {p.tag ? <span className="shrink-0 rounded-full border border-[#bad6f4] bg-[#f2f8ff] px-1.5 py-0.5 text-[8.5px] font-semibold text-[#0b4f91]">{p.tag}</span> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ================================================================== */
/* 아웃바운드 후속 재안내 콜 — 품질검수 조치(정해린) 전용 짧은 시나리오   */
/* 상담사가 정정 내용을 유선 재안내하는 상황을 자동 재생.                 */
/* ================================================================== */

type OutLine = { speaker: "agent" | "customer"; time: string; text: string; note?: string }

const HAERIN_CALL: OutLine[] = [
  { speaker: "agent", time: "14:02", text: "안녕하세요, 제논라이프 상담사 김제나입니다. 정해린 고객님 되실까요? 지난 5월 13일 해지환급금 상담 건 관련해 정정 안내차 연락드렸습니다.", note: "도입 · 본인확인 · 연락 사유 고지" },
  { speaker: "customer", time: "14:02", text: "네, 맞아요. 무슨 일이시죠?" },
  { speaker: "agent", time: "14:03", text: "먼저 지난 상담에서 해지환급금 환급률을 100%로 안내드렸는데, 확인 결과 가입 5년 경과 기준 약관상 80%가 정확합니다. 잘못 안내드린 점 사과드립니다.", note: "오안내 정정 — 환급률 100% → 80%" },
  { speaker: "customer", time: "14:03", text: "아… 제가 들었던 거랑 다르네요. 그럼 환급금이 더 적은 거예요?" },
  { speaker: "agent", time: "14:04", text: "네, 정정된 80% 기준으로 안내드리며 정확한 예상 환급금은 문자로 다시 보내드리겠습니다. 또한 해지 시 보장이 종료되고 동일 조건의 재가입이 제한될 수 있다는 점도 함께 안내드립니다.", note: "누락 고지 보완 — 보장 종료·재가입 제한" },
  { speaker: "customer", time: "14:04", text: "알겠습니다. 정정해서 다시 알려줘서 고마워요." },
  { speaker: "agent", time: "14:05", text: "이용에 불편을 드려 죄송합니다. 정정 내용은 문자로도 발송해 드리겠습니다. 추가 문의는 1588-0000으로 연락 주세요. 감사합니다.", note: "마무리 · 정정 문자 발송 안내" },
]

// 아웃바운드 컨텍스트 바 — 정해린 후속 재안내 발신 대상
function HaerinContextBar() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#dbe5f1] bg-white px-5 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#153AD4]/10 text-[#153AD4]">
          <PhoneOutgoing className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold text-[#10233f]">정해린 고객님</span>
            <Badge variant="outline" className="h-4 gap-1 border-[#bad6f4] bg-[#f2f8ff] px-1.5 text-[9px] text-[#0b4f91]">아웃바운드 · 후속 재안내</Badge>
          </div>
          <div className="text-[10.5px] text-muted-foreground">(무)제논저축보험 · 해지환급금 정정 안내 · 품질검수 조치 CL-20260513-027</div>
        </div>
      </div>
      <div className="ml-auto hidden text-[10.5px] text-muted-foreground lg:block">관리자 조치필요 통보 → 상담사 후속 유선 재안내</div>
    </div>
  )
}

// STT 패널 — 정해린 아웃바운드 후속 재안내 통화 발화를 순차 스트리밍(기존 STT 레이아웃 재사용)
function HaerinSTT() {
  const [shown, setShown] = useState(0)
  const [streamed, setStreamed] = useState<Set<number>>(new Set())
  const [started, setStarted] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  // 발신 연결(약 1.4초) 후 첫 발화 노출 시작
  useEffect(() => {
    const t = window.setTimeout(() => { setStarted(true); setShown(1) }, 1400)
    timers.current.push(t)
    const list = timers.current
    return () => list.forEach((id) => window.clearTimeout(id))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [shown, streamed])

  const ended = shown >= HAERIN_CALL.length && streamed.has(HAERIN_CALL.length - 1)

  // 모든 STT 발화 재생 + 통화 종료 시점 → 정해린 후속조치 완료 기록(상담이력 생성 트리거)
  useEffect(() => {
    if (!ended) return
    try {
      const KEY = "genon:followup"
      const all = JSON.parse(window.localStorage.getItem(KEY) || "{}") || {}
      const id = "CL-20260513-027"
      const prev = all[id] || {}
      const items = Array.from(new Set([...(prev.actionItems || []), "재안내 전화"]))
      all[id] = { ...prev, actionDone: true, actionAt: prev.actionAt ?? new Date().toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }), actionItems: items }
      window.localStorage.setItem(KEY, JSON.stringify(all))
      window.dispatchEvent(new Event("genon:followup-changed"))
    } catch { /* 데모 */ }
  }, [ended])

  return (
    <>
    <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7fafe] px-3 py-3">
      {!started ? (
        <div className="flex items-center gap-2 px-1 py-4 text-[11px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0f3468]" /> 정해린 고객 연결 중…
        </div>
      ) : null}
      {HAERIN_CALL.slice(0, shown).map((l, i) => {
        const isAgent = l.speaker === "agent"
        const streaming = i === shown - 1 && !streamed.has(i)
        return (
          <div key={i} className={cn("flex animate-in fade-in duration-500", isAgent ? "justify-end slide-in-from-right-2" : "justify-start slide-in-from-left-2")}>
            <div className={cn("max-w-[94%] rounded-2xl px-3 py-2 text-left text-[12px] leading-5 shadow-sm", isAgent ? "rounded-tr-sm border border-[#cfe0f1] bg-[#eef4fb] text-[#27456b]" : "rounded-tl-sm border bg-white text-[#10233f]")}>
              <div className="mb-0.5 flex items-center gap-1 text-[9px] opacity-70">
                <span>{isAgent ? "상담사" : "고객"}</span>
                <span>{l.time}</span>
              </div>
              {streaming ? (
                <StreamingText
                  text={l.text}
                  isActive
                  speed={FAST_SPEED}
                  onComplete={() => {
                    setStreamed((prev) => (prev.has(i) ? prev : new Set(prev).add(i)))
                    if (i + 1 < HAERIN_CALL.length) {
                      const t = window.setTimeout(() => setShown(i + 2), 650)
                      timers.current.push(t)
                    }
                  }}
                />
              ) : (
                l.text
              )}
            </div>
          </div>
        )
      })}
      {ended ? (
        <div className="flex items-center justify-center gap-1.5 rounded-lg border border-[#e2eaf4] bg-white px-2 py-1.5 text-[10px] font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> 통화가 종료되었습니다
        </div>
      ) : started ? (
        <div className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> 수신 중…
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
    <p className="shrink-0 px-3 pb-2 pt-1 text-center text-[10px] leading-tight text-muted-foreground/60">
      후속 재안내 통화 발화가 실시간 STT로 자동 기록됩니다.
    </p>
    </>
  )
}

export function CounselingAssistantView({ demoCase }: { demoCase?: string | null } = {}) {
  const haerin = demoCase === "haerin" // 정해린 아웃바운드 후속 재안내 — 기존 화면 + STT 발화만 재생
  const idle = demoCase !== "kim" // 데모 케이스(김민준 자동재생)가 아니면 콜 대기 기본 화면
  const [step, setStep] = useState(-1) // -1: 진입 부팅(패널 로딩) → 0부터 시나리오 시작
  const [workLoading, setWorkLoading] = useState(true) // 진입 시 업무정보 로딩
  const [visibleCount, setVisibleCount] = useState(0)
  const [visibleKeywords, setVisibleKeywords] = useState<string[]>([])
  const [extractingKw, setExtractingKw] = useState(false) // 발화 종료 후 키워드 추출 로딩
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null)
  const [topicKeyword, setTopicKeyword] = useState<string | null>(null)
  const [revealedFlags, setRevealedFlags] = useState<string[]>([])
  const [confirmed, setConfirmed] = useState<string[]>([])
  const [fcrAuto, setFcrAuto] = useState(true) // FCR 자동/수동 체크 모드
  const fcrAutoRef = useRef(true)
  useEffect(() => { fcrAutoRef.current = fcrAuto }, [fcrAuto])
  const [streamedIdx, setStreamedIdx] = useState<Set<number>>(new Set())
  const [highlightIdx, setHighlightIdx] = useState<Set<number>>(new Set()) // 발화 본문 하이라이트는 키워드 추출 시점에 노출
  const [highlight, setHighlight] = useState<HighlightTarget>(null)
  const [activeScript, setActiveScript] = useState<string>("intro")
  const [fcrLoading, setFcrLoading] = useState(false) // FCR 필수 안내 카드 내용 갱신 로딩
  const [activeScriptStep, setActiveScriptStep] = useState<number | null>(null) // 상담사 발화 중 사용한 스크립트 단계 강조
  const [scriptReveal, setScriptReveal] = useState<number>(scripts.intro.steps.length) // 발화 진행에 따라 노출된 스크립트 단계 수

  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState("")
  const [thinking, setThinking] = useState(false)
  const [pendingQuery, setPendingQuery] = useState<string | null>(null)
  const [useKnowledge, setUseKnowledge] = useState(true)
  const [useWorkInfo, setUseWorkInfo] = useState(true)

  const [activeContract, setActiveContract] = useState<string>("ALL")
  const [pendingContract, setPendingContract] = useState<string | null>(null)
  const [workTab, setWorkTab] = useState<"customer" | "products" | "claim">("customer")
  const [pendingClaimTab, setPendingClaimTab] = useState(false) // 사용자가 청구진행 현황 탭을 눌러야 진행
  const [smsLit, setSmsLit] = useState(false)
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({})
  const [coachMsgs, setCoachMsgs] = useState<{ role: "admin" | "agent" | "system"; text: string; time: string }[]>([]) // 관리자 코칭 메시지(발화 싱크)

  const timers = useRef<number[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const sttEndRef = useRef<HTMLDivElement>(null)
  const pendingSentRef = useRef(false)

  const schedule = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  const ANSWER_DELAY = 2600 // 지식 검색·유추 로딩을 충분히 보여준 뒤 답변

  const runQuery = (text: string) => {
    const q = text.trim()
    if (!q) return
    setMessages((prev) => [...prev, { id: `u-${prev.length}-${q.length}`, role: "user", content: q }])
    setThinking(true)
    schedule(() => {
      const ans = generateAnswer(q)
      setMessages((prev) => [...prev, { id: `a-${prev.length}`, role: "assistant", content: ans.summary, ...ans }])
      setThinking(false)
    }, ANSWER_DELAY)
  }

  // 추천 질문 전송 — 사용자가 직접 누를 때만 실행(중복 방지) + 답변 후 시나리오 재개
  const sendPending = (q: string) => {
    if (pendingSentRef.current) return
    pendingSentRef.current = true
    setPendingQuery(null)
    setHighlight(null)
    runQuery(q)
    const cur = SCENARIO[step]
    const afterAnswer = ANSWER_DELAY + 400
    if (cur?.claimGate) {
      // 답변 후: 사용자가 업무정보 '청구진행 현황' 탭을 직접 클릭하도록 유도(자동 전환 X)
      schedule(() => {
        setPendingClaimTab(true)
        setHighlight("work")
      }, afterAnswer)
    } else if (cur?.awaitContract) {
      // 답변 후: 전체계약에서 하이라이트된 계약을 사용자가 직접 클릭해야 다음 발화로 진행
      schedule(() => {
        setActiveContract("ALL")
        setHighlight("work")
      }, afterAnswer)
      schedule(() => setHighlight((c) => (c === "work" ? null : c)), afterAnswer + 2200)
    } else {
      // RAG 답변을 얻은 뒤 약 0.5초 후 다음 발화 진행
      const advanceAt = afterAnswer + 100
      const target = cur?.effects?.highlight
      if (target) {
        schedule(() => setHighlight(target), afterAnswer)
        schedule(() => setHighlight((c) => (c === target ? null : c)), advanceAt)
      }
      schedule(() => setStep((s) => s + 1), advanceAt)
    }
  }

  // 업무정보 탭 클릭 — '청구진행 현황' 탭을 직접 누르면 1초 뒤 미제출 안내(다음 발화) 진행
  const handleWorkTab = (t: "customer" | "products" | "claim") => {
    setWorkTab(t)
    if (t === "claim" && pendingClaimTab) {
      setPendingClaimTab(false)
      setHighlight("work")
      schedule(() => setHighlight((c) => (c === "work" ? null : c)), 1000)
      schedule(() => setStep((s) => s + 1), 1000)
    }
  }

  // 업무정보에서 계약 선택 — 대기 중인 계약을 클릭(정보 확인)하면 0.5초 뒤 다음 발화 진행
  const handleContractSelect = (no: string) => {
    setActiveContract(no)
    if (pendingContract && no === pendingContract) {
      setPendingContract(null)
      setHighlight("work")
      schedule(() => setHighlight((c) => (c === "work" ? null : c)), 700)
      schedule(() => setStep((s) => s + 1), 500)
    }
  }

  // ---- 진입 부팅: 업무정보·가이드 0.5초 로딩 → 1초 뒤 첫 발화 ----
  useEffect(() => {
    if (idle) return // 콜 대기(기본) 화면: 시나리오 자동재생 안 함
    setFcrLoading(true)
    setWorkLoading(true)
    const t1 = window.setTimeout(() => {
      setFcrLoading(false)
      setWorkLoading(false)
    }, 500)
    const t2 = window.setTimeout(() => setStep(0), 1500)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- 시나리오 드라이버 (자동 재생 + 무한 루프) ----
  useEffect(() => {
    if (step < 0) return () => clearTimers() // 부팅 중에는 대기
    if (step >= SCENARIO.length) {
      return () => clearTimers() // 마지막 화면 유지 — 자동 재시작(루프) 없음
    }

    const s = SCENARIO[step]
    const stream = streamDuration(s.bubble.text, s.fast) // 발화 타이핑(스트리밍) 완료 시점

    // 현실적 처리 파이프라인 타이밍 — STT 완료 → 키워드 추출(지연) → 키워드 기반 가이드/FCR/스크립트 fetch(지연)
    const hasKw = !!s.keywords?.length
    const KW_AT = stream + 500 // 발화 종료 후 키워드 추출 시작
    const KW_DONE = KW_AT + 1200 // 키워드 추출 완료(노출)
    const GUIDE_AT = (hasKw ? KW_DONE : stream) + 300 // 키워드 확정 후 가이드/FCR 로딩 시작
    const GUIDE_DONE = GUIDE_AT + 1100 // 가이드/FCR/스크립트 갱신 완료
    const scriptChanged = !!s.effects?.script && s.effects.script !== activeScript

    setVisibleCount(step + 1)

    const e = s.effects
    if (e?.flags) setRevealedFlags((prev) => Array.from(new Set([...prev, ...e.flags!])))
    if (e?.contract) setActiveContract(e.contract)
    if (e?.script) {
      const sc = e.script
      const total = scripts[sc]?.steps.length ?? 0
      // 도입(intro)만 전체 노출, 그 외 주제는 발화로 도달한 단계까지만 점진 노출
      const reveal = sc === "intro" && e.scriptStep === undefined ? total : Math.max(1, (e.scriptStep ?? -1) + 1)
      if (scriptChanged) {
        // 새 주제 → 키워드 확정 후 가이드/FCR 로딩을 거쳐 스크립트·필수안내 갱신
        schedule(() => setFcrLoading(true), GUIDE_AT)
        schedule(() => {
          setActiveScript(sc)
          setScriptReveal(reveal)
          setFcrLoading(false)
        }, GUIDE_DONE)
        // 고객 질의로 가이드가 갱신된 경우, 추천 응대 멘트(첫 단계)를 잠깐 하이라이트
        if (s.bubble.speaker === "customer") {
          schedule(() => setActiveScriptStep(0), GUIDE_DONE + 150)
          schedule(() => setActiveScriptStep((cur) => (cur === 0 ? null : cur)), GUIDE_DONE + 1450)
        }
      } else {
        setActiveScript(sc)
        setScriptReveal((r) => Math.max(r, reveal))
      }
    }

    // 상담사 발화 = 사용한 추천 스크립트 '단계'를 파란색 강조 + 해당 단계까지 노출
    if (s.bubble.speaker === "agent" && e?.scriptStep !== undefined) {
      const stepIdx = e.scriptStep
      const startAt = scriptChanged ? GUIDE_DONE : stream + 200 // 새 스크립트면 로딩 후, 아니면 발화 직후
      schedule(() => {
        setActiveScriptStep(stepIdx)
        setScriptReveal((r) => Math.max(r, stepIdx + 1))
      }, startAt)
      schedule(() => setActiveScriptStep((cur) => (cur === stepIdx ? null : cur)), startAt + 1300)
    } else {
      setActiveScriptStep(null)
    }
    if (e?.lightSms) schedule(() => setSmsLit(true), stream + 300)

    // 발화 종료(스트리밍 완료) 후 키워드 추출 — 추출 로딩(약 1.2초)을 보여준 뒤 키워드 노출
    if (s.keywords?.length) {
      const kws = s.keywords
      schedule(() => setExtractingKw(true), KW_AT)
      schedule(() => {
        setVisibleKeywords((prev) => Array.from(new Set([...prev, ...kws])))
        setTopicKeyword(kws[kws.length - 1])
        setExtractingKw(false)
        // 키워드 추출과 동시에 발화 본문 하이라이트 노출
        if (s.highlightInBubble?.length) setHighlightIdx((prev) => (prev.has(step) ? prev : new Set(prev).add(step)))
      }, KW_DONE)
    }
    // FCR 자동 체크 — 자동 모드일 때만, 상담사 고지 발화 종료 후 순차적으로 초록(완료) 체크(하이라이트 없음)
    const autoCheck = (id: string) => {
      if (!fcrAutoRef.current) return // 수동 모드: 상담사가 직접 체크
      setConfirmed((prev) => (prev.includes(id) ? prev : [...prev, id]))
    }
    if (e?.syncAnnounce) {
      e.syncAnnounce.forEach(({ id }, i) => schedule(() => autoCheck(id), stream + 300 + i * 500))
    }
    if (e?.syncConfirm) {
      e.syncConfirm.forEach(({ id }, i) => schedule(() => autoCheck(id), stream + 400 + i * 500))
    }
    if (e?.announce) {
      e.announce.forEach((cid, i) => schedule(() => autoCheck(cid), stream + 300 + i * 500))
    }
    if (e?.confirm) {
      e.confirm.forEach((cid, i) => schedule(() => autoCheck(cid), stream + 300 + i * 500))
    }
    // 관리자 코칭 — 해당 단계 발화가 끝난 뒤(싱크) 순차 전달
    const coach = COACH_TIMELINE[step]
    if (coach) {
      coach.forEach((c, idx) =>
        schedule(() => setCoachMsgs((m) => [...m, { role: c.role ?? "admin", text: c.text, time: c.time }]), stream + 900 + idx * 1300),
      )
    }
    // FCR 마지막 체크 시점(있으면) — 다음 발화는 마지막 체크 +0.5초 뒤
    const fcrOffsets: number[] = []
    if (e?.syncAnnounce?.length) fcrOffsets.push(300 + (e.syncAnnounce.length - 1) * 500)
    if (e?.syncConfirm?.length) fcrOffsets.push(400 + (e.syncConfirm.length - 1) * 500)
    if (e?.announce?.length) fcrOffsets.push(300 + (e.announce.length - 1) * 500)
    if (e?.confirm?.length) fcrOffsets.push(300 + (e.confirm.length - 1) * 500)
    const fcrLastAt = fcrOffsets.length ? stream + Math.max(...fcrOffsets) : stream
    if (s.query) {
      // 발화 종료 → 키워드 확정 → 추천 질문 카드 생성(가이드 로딩 이후) → 사용자 전송 대기
      const q = s.query
      const quiet = !!s.quietHighlight // 키워드 칩·상담어시스턴트(RAG) 창 하이라이트 생략
      const queryAt = GUIDE_AT + 300 // 가이드/키워드 처리 후 추천 질문 노출
      if (s.autoKeyword && !quiet) schedule(() => setActiveKeyword(s.autoKeyword!), queryAt - 600)
      schedule(() => {
        setActiveKeyword(null)
        pendingSentRef.current = false
        setPendingQuery(q)
        if (s.awaitContract) setPendingContract(s.awaitContract) // 추천 질문과 동시에 대상 계약 하이라이트
        if (!quiet) setHighlight("rag")
      }, queryAt)
      schedule(() => setHighlight((cur) => (cur === "rag" ? null : cur)), queryAt + 1800)
      // 자동 전송/진행 없음 — 사용자가 추천 질문의 '전송'을 눌러야 답변 후 시나리오가 이어짐(sendPending)
    } else if (s.awaitContract) {
      // 발화 후: 사용자가 해당 가입상품을 직접 클릭해 정보 확인하면 진행(자동 진행 X)
      const target = s.awaitContract
      const at = Math.max(stream + 600, fcrLastAt + 500)
      schedule(() => {
        setPendingContract(target) // 가입상품 탭 전환 + 해당 상품 강조(WorkInfo)
        setHighlight("work")
      }, at)
    } else {
      // 마무리(fast)는 타이핑 후 0.1초, 새 주제면 가이드 갱신 후, 아니면 (FCR 마지막 +0.5초)와 ~1.4초 중 늦은 시점
      const advanceAt = s.fast ? stream + 100 : scriptChanged ? GUIDE_DONE + 1600 : Math.max(stream + 1400, fcrLastAt + 500)
      if (e?.highlight) {
        const target = e.highlight
        schedule(() => setHighlight(target), stream + 300)
        schedule(() => setHighlight((cur) => (cur === target ? null : cur)), advanceAt)
      }
      schedule(() => setStep(step + 1), advanceAt)
    }

    return () => clearTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, thinking])

  useEffect(() => {
    sttEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    // 마지막 발화가 스트리밍되는 동안엔 글자가 늘어나며 아래로 밀리므로 주기적으로 하단 유지
    const lastIdx = visibleCount - 1
    if (lastIdx < 0 || streamedIdx.has(lastIdx)) return
    const id = window.setInterval(() => {
      sttEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }, 200)
    return () => window.clearInterval(id)
  }, [visibleCount, streamedIdx])

  // 데모 리플레이 — 상담사 발화 버블 클릭 시 해당 시점으로 되돌려 다시 재생
  const jumpTo = (i: number) => {
    clearTimers()
    const flags = new Set<string>()
    const kws: string[] = []
    const confirmedIds = new Set<string>()
    const hi = new Set<number>()
    let script = "intro"
    let reveal = scripts.intro.steps.length
    let sms = false
    for (let n = 0; n < i; n++) {
      const st = SCENARIO[n]
      const e = st.effects
      e?.flags?.forEach((f) => flags.add(f))
      st.keywords?.forEach((k) => kws.push(k))
      if (st.highlightInBubble?.length) hi.add(n)
      const stepReveal = (e?.script ?? script) === "intro" && e?.scriptStep === undefined ? scripts[e?.script ?? script]?.steps.length ?? 0 : Math.max(1, (e?.scriptStep ?? -1) + 1)
      if (e?.script && e.script !== script) {
        script = e.script
        reveal = stepReveal
      } else if (e?.script || e?.scriptStep !== undefined) {
        reveal = Math.max(reveal, stepReveal)
      }
      e?.syncAnnounce?.forEach((x) => confirmedIds.add(x.id))
      e?.syncConfirm?.forEach((x) => confirmedIds.add(x.id))
      e?.announce?.forEach((id) => confirmedIds.add(id))
      e?.confirm?.forEach((id) => confirmedIds.add(id))
      if (e?.lightSms) sms = true
    }
    // 리플레이 지점 이전의 RAG 질의·답변 복원(대상 단계의 예상 질문은 드라이버가 다시 생성)
    const msgs: ChatMsg[] = []
    const cmsgs: { role: "admin" | "agent" | "system"; text: string; time: string }[] = []
    for (let n = 0; n < i; n++) {
      const q = SCENARIO[n].query
      if (q) {
        msgs.push({ id: `u-${n}`, role: "user", content: q })
        const ans = generateAnswer(q)
        msgs.push({ id: `a-${n}`, role: "assistant", content: ans.summary, ...ans })
      }
      COACH_TIMELINE[n]?.forEach((c) => cmsgs.push({ role: c.role ?? "admin", text: c.text, time: c.time }))
    }
    setCoachMsgs(cmsgs)
    setRevealedFlags([...flags])
    setVisibleKeywords([...new Set(kws)])
    setConfirmed([...confirmedIds])
    setManualChecks({})
    setActiveScript(script)
    setScriptReveal(reveal)
    setActiveScriptStep(null)
    setSmsLit(sms)
    setHighlightIdx(hi)
    setTopicKeyword(kws.length ? kws[kws.length - 1] : null)
    setMessages(msgs)
    setThinking(false)
    setPendingQuery(null)
    setActiveKeyword(null)
    setExtractingKw(false)
    setHighlight(null)
    setWorkTab("customer")
    setPendingClaimTab(false)
    setActiveContract("ALL")
    setPendingContract(null)
    setFcrLoading(false)
    setWorkLoading(false)
    pendingSentRef.current = false
    setStreamedIdx(new Set(Array.from({ length: i }, (_, k) => k))) // 해당 발화는 다시 스트리밍
    setStep(i)
  }

  const statusOf = (id: string): FcrStatus => {
    if (manualChecks[id] !== undefined) return manualChecks[id] ? "confirmed" : "pending"
    if (confirmed.includes(id)) return "confirmed"
    return "pending"
  }
  const checklist = (fcrByScript[activeScript] ?? []).map((c) => ({ ...c, status: statusOf(c.id) }))
  const pending = checklist.filter((c) => c.status !== "confirmed").length
  const ended = step >= SCENARIO.length // 시나리오 종료(통화 종료)

  // 통화 종료 시 헤더의 '내 상태'를 자동으로 통화 대기로 전환(리플레이로 재개되면 통화 중 복귀)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("genon:call-status", { detail: { ended } }))
  }, [ended])

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f1f5fb]">
      {haerin ? <HaerinContextBar /> : idle ? <IdleContextBar /> : <ContextBar revealed={revealedFlags} hot={highlight === "context"} />}

      <div className="flex min-h-0 flex-1">
        {/* ===== 1) 실시간 STT ===== */}
        <aside className="flex min-w-[260px] flex-col border-r border-[#d4e0ef] bg-white" style={{ flex: "1.5 1 0%" }}>
          <PanelHead icon={Headphones} title="실시간 STT">
            {haerin ? (
              <Badge variant="outline" className="gap-1 border-[#bad6f4] bg-[#f2f8ff] text-[10px] text-[#0f3468]">
                <CircleDot className="h-3 w-3 animate-pulse fill-emerald-500 text-emerald-500" /> 통화 중 · 아웃바운드
              </Badge>
            ) : idle ? (
              <Badge variant="outline" className="gap-1 border-[#d6dde6] bg-[#f3f5f8] text-[10px] text-[#5b6b80]">
                <CircleDot className="h-3 w-3 fill-slate-400 text-slate-400" /> 콜 대기 중
              </Badge>
            ) : ended ? (
              <Badge variant="outline" className="gap-1 border-[#d6dde6] bg-[#f3f5f8] text-[10px] text-[#5b6b80]">
                <CircleDot className="h-3 w-3 fill-slate-400 text-slate-400" /> 통화 종료
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-[#bad6f4] bg-[#f2f8ff] text-[10px] text-[#0f3468]">
                <CircleDot className="h-3 w-3 animate-pulse fill-emerald-500 text-emerald-500" /> 통화 중
              </Badge>
            )}
          </PanelHead>

          {haerin ? <HaerinSTT /> : idle ? <IdleSTT /> : (<>
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7fafe] px-3 py-3">
            {SCENARIO.slice(0, visibleCount).map((s, i) => {
              const isAgent = s.bubble.speaker === "agent"
              const bid = `b${i}`
              const isLast = i === visibleCount - 1
              const streaming = isLast && !streamedIdx.has(i)
              return (
                <div key={bid} className={cn("flex animate-in fade-in duration-500", isAgent ? "justify-end slide-in-from-right-2" : "justify-start slide-in-from-left-2")}>
                  <button
                    type="button"
                    onClick={() => (isAgent ? jumpTo(i) : setInput(s.bubble.text))}
                    title={isAgent ? "이 시점으로 리플레이" : "질문창에 채우기"}
                    className={cn(
                      "max-w-[94%] rounded-2xl px-3 py-2 text-left text-[12px] leading-5 shadow-sm transition-all hover:ring-2 hover:ring-[#0f3468]/40 hover:ring-offset-1",
                      isAgent ? "rounded-tr-sm border border-[#cfe0f1] bg-[#eef4fb] text-[#27456b]" : "rounded-tl-sm border bg-white text-[#10233f]",
                    )}
                  >
                    <div className="mb-0.5 flex items-center gap-1 text-[9px] opacity-70">
                      <span>{isAgent ? "상담사" : "고객"}</span>
                      <span>{s.bubble.time}</span>
                    </div>
                    {streaming ? (
                      <StreamingText
                        text={s.bubble.text}
                        isActive
                        speed={s.fast ? FAST_SPEED : STREAM_SPEED}
                        onComplete={() => setStreamedIdx((prev) => (prev.has(i) ? prev : new Set(prev).add(i)))}
                      />
                    ) : (
                      highlightText(s.bubble.text, highlightIdx.has(i) ? s.highlightInBubble : undefined)
                    )}
                  </button>
                </div>
              )
            })}
            {ended ? (
              <div className="flex items-center justify-center gap-1.5 rounded-lg border border-[#e2eaf4] bg-white px-2 py-1.5 text-[10px] font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> 통화가 종료되었습니다
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> 수신 중…
              </div>
            )}
            <div ref={sttEndRef} />
          </div>

          <p className="shrink-0 px-3 pb-2 pt-1 text-center text-[10px] leading-tight text-muted-foreground/60">
            고객 발화를 클릭하면 RAG 질문창에 자동으로 입력됩니다.
          </p>
          </>)}

        </aside>

        {/* ===== 2) 상담 가이드 (STT 옆, 동일 크기 / 스크롤 없이 3카드) ===== */}
        <aside className="hidden min-w-[244px] flex-col overflow-hidden border-r border-[#d4e0ef] bg-white lg:flex" style={{ flex: "1.15 1 0%" }}>
          <PanelHead icon={ClipboardCheck} title="상담 가이드" hot={!idle && highlight === "guide"} />
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden bg-[#f7fafe] p-2">
            {idle ? <IdleGuide /> : (<>
            <GuideKeywords keywords={visibleKeywords} activeKeyword={activeKeyword} topicKeyword={topicKeyword} onAsk={runQuery} extracting={extractingKw} />
            <GuidePlan
              checklist={checklist}
              pending={pending}
              loading={fcrLoading}
              auto={fcrAuto}
              onAuto={() => setFcrAuto((v) => !v)}
              onToggle={(id) => setManualChecks((p) => ({ ...p, [id]: statusOf(id) !== "confirmed" }))}
              scriptKey={activeScript}
              activeStep={activeScriptStep}
              revealCount={scriptReveal}
            />
            </>)}
          </div>
          <CoachingChat
            connected={!idle && step >= COACH_CONNECT_STEP}
            messages={coachMsgs}
            onSend={(t) => setCoachMsgs((m) => [...m, { role: "agent", text: t, time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }) }])}
          />
        </aside>

        {/* ===== 3) RAG 상담지식 어시스턴트 (중앙) ===== */}
        <section className="flex min-w-[330px] flex-col bg-white" style={{ flex: "2.5 1 0%" }}>
          <div className="flex h-10 shrink-0 items-center border-b bg-gradient-to-r from-[#f2f8ff] to-white px-5">
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-[#0f3468]" />
                <div className="leading-tight">
                  <div className="text-[12.5px] font-bold text-[#10233f]">상담지식 어시스턴트 (RAG)</div>
                  <div className="text-[9.5px] text-muted-foreground">약관 요약 · 업무 기준 등 지식 질의응답</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Toggle label="업무지식" on={useKnowledge} onClick={() => setUseKnowledge((v) => !v)} />
                <Toggle label="업무정보" on={useWorkInfo} onClick={() => setUseWorkInfo((v) => !v)} />
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#f7fafe] px-5 py-4">
            {messages.length === 0 && !thinking ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <Bot className="mb-2 h-7 w-7 text-[#bad6f4]" />
                <p className="text-[12.5px] leading-5 text-muted-foreground">{idle ? <>약관·업무 기준을 검색해<br />빈 시간에 미리 학습해 두세요.</> : <>약관·업무 기준 관련 질의가 감지되면<br />지식 답변을 자동으로 제공합니다.</>}</p>
                <div className="mt-4 w-full max-w-[420px]">
                  <div className="mb-1.5 text-[10.5px] font-semibold text-muted-foreground">자주 묻는 질의 (FAQ)</div>
                  <div className="space-y-1.5">
                    {faqPresets.map((f) => (
                      <button key={f} type="button" onClick={() => runQuery(f)} className="flex w-full items-center gap-2 rounded-xl border border-[#dbe5f1] bg-white px-3 py-2 text-left text-[12px] text-[#0f3468] shadow-sm transition-colors hover:border-[#0f3468] hover:bg-[#f2f8ff]">
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#8fb4df]" /> {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((m) => (m.role === "user" ? <UserMessage key={m.id} text={m.content} /> : <AssistantMessage key={m.id} msg={m} />))}
                {thinking ? <ThinkingSteps /> : null}
              </>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="shrink-0 border-t bg-white px-5 py-3">
            {pendingQuery ? (
              <div className="mb-2 flex">
                <div className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#0f3468] bg-[#f2f8ff] px-2.5 py-1 shadow-sm ring-2 ring-[#0f3468]/40 animate-in fade-in slide-in-from-bottom-1">
                  <Sparkles className="h-3 w-3 shrink-0 text-[#0f3468]" />
                  <span className="text-[11px] font-semibold text-[#10233f]">{pendingQuery}</span>
                </div>
              </div>
            ) : (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {faqPresets.map((f) => (
                  <button key={f} type="button" onClick={() => runQuery(f)} className="inline-flex items-center gap-1 rounded-full border border-[#dbe5f1] bg-[#f7fafe] px-2 py-0.5 text-[10px] text-[#0f3468] transition-colors hover:border-[#0f3468] hover:bg-[#f2f8ff]">
                    <Sparkles className="h-2.5 w-2.5" /> {f}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(ev) => setInput(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key !== "Enter") return
                  if (pendingQuery) sendPending(pendingQuery)
                  else {
                    runQuery(input)
                    setInput("")
                  }
                }}
                placeholder={pendingQuery ? "추천 질문을 전송하려면 전송 버튼을 누르세요" : "약관·업무 기준을 자연어로 문의하세요"}
                className="h-10 text-[13px]"
              />
              <Button
                className={cn("h-10 shrink-0 bg-[#0f3468] hover:bg-[#084780]", pendingQuery && "animate-pulse ring-2 ring-[#0f3468]/50")}
                onClick={() => {
                  if (pendingQuery) sendPending(pendingQuery)
                  else {
                    runQuery(input)
                    setInput("")
                  }
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* ===== 4) 우측: 업무정보(상) + 추천(하) ===== */}
        <aside className="hidden min-w-[300px] flex-col border-l border-[#d4e0ef] bg-[#f1f5fb] xl:flex" style={{ flex: "1.7 1 0%" }}>
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
            <div className="min-h-0 flex-1">
              {idle ? <IdleProducts /> : <WorkInfo activeContract={activeContract} pendingContract={pendingContract} onSelect={handleContractSelect} hot={highlight === "work"} tab={workTab} onTabChange={handleWorkTab} pulseTab={pendingClaimTab ? "claim" : null} loading={workLoading} />}
            </div>
            <NextActions smsLit={!idle && smsLit} />
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ================================================================== */
/* 공용                                                                */
/* ================================================================== */

const hotRing = "ring-2 ring-[#0f3468]/70 ring-offset-1 transition-shadow"

// 고객 발화에서 키워드 추출 근거를 노란색으로 강조 (스트리밍 완료 후 지속 표시)
function highlightText(text: string, terms?: string[]): ReactNode {
  if (!terms?.length) return text
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const re = new RegExp(`(${escaped.join("|")})`, "g")
  return text.split(re).map((part, i) =>
    terms.includes(part) ? (
      <mark key={i} className="rounded-sm bg-amber-200 text-amber-900">
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}

function PanelHead({ icon: Icon, title, hot, children }: { icon: ComponentType<{ className?: string }>; title: string; hot?: boolean; children?: ReactNode }) {
  return (
    <div className={cn("flex h-10 shrink-0 items-center justify-between border-b bg-gradient-to-r from-[#f2f8ff] to-white px-4", hot && "from-[#e6f0fb]")}>
      <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#10233f]">
        <Icon className="h-3.5 w-3.5 text-[#0f3468]" /> {title}
      </div>
      {children}
    </div>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10.5px] font-medium transition-colors", on ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#dbe5f1] bg-white text-muted-foreground")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", on ? "bg-emerald-300" : "bg-slate-300")} /> {label}
    </button>
  )
}

function ContextBar({ revealed, hot }: { revealed: string[]; hot: boolean }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#dbe5f1] bg-white px-5 py-2.5", hot && "bg-[#f2f8ff]")}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f3468]/10 text-[#0f3468]">
          <UserRound className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold text-[#10233f]">김민준 고객님</span>
            <Badge className="h-4 bg-[#0f3468] px-1.5 text-[9px] hover:bg-[#0f3468]">우량</Badge>
          </div>
          <div className="text-[10.5px] text-muted-foreground">상담 ID CL-20260514-018 · C-10294857 · Tele-Pro 연동</div>
        </div>
      </div>
      <div className="hidden h-7 w-px bg-[#e2eaf4] md:block" />
      <div className={cn("flex flex-wrap items-center gap-1.5 rounded-lg px-1", hot && hotRing)}>
        {revealed.length === 0 ? (
          <span className="text-[10.5px] text-muted-foreground/70">고객 이력 조회 중…</span>
        ) : (
          revealed.map((id) => {
            const f = flagMeta[id]
            if (!f) return null
            return (
              <span key={id} className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-medium", f.tone === "danger" ? "border-red-200 bg-red-50 text-red-600" : "border-amber-200 bg-amber-50 text-amber-700")}>
                <f.icon className="h-3.5 w-3.5" /> {f.label}
              </span>
            )
          })
        )}
      </div>
      <div className="ml-auto hidden text-[10.5px] text-muted-foreground lg:block">최근 상담: 05.12 진료비 세부내역서 보완 요청</div>
    </div>
  )
}

/* ---------------- 가이드(좌측 2열) ---------------- */

function MiniCard({ icon: Icon, title, right, below, hot, children, className, bodyScroll }: { icon: ComponentType<{ className?: string }>; title: string; right?: ReactNode; below?: ReactNode; hot?: boolean; children: ReactNode; className?: string; bodyScroll?: boolean }) {
  return (
    <Card className={cn("overflow-hidden gap-0 py-0 transition-shadow", bodyScroll && "flex flex-col", hot && hotRing, className)}>
      <CardHeader className="shrink-0 border-b bg-white px-2.5 pt-2 [.border-b]:pb-1">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#10233f]">
            <Icon className="h-3.5 w-3.5 text-[#0f3468]" /> {title}
          </div>
          {right}
        </div>
        {below ? <div className="mt-0.5">{below}</div> : null}
      </CardHeader>
      <CardContent className={cn("px-1.5 pb-1.5 pt-1.5", bodyScroll && "min-h-0 flex-1 overflow-y-auto")}>{children}</CardContent>
    </Card>
  )
}

function GuideKeywords({ keywords, activeKeyword, topicKeyword, onAsk, hot, extracting }: { keywords: string[]; activeKeyword: string | null; topicKeyword: string | null; onAsk: (q: string) => void; hot?: boolean; extracting?: boolean }) {
  return (
    <MiniCard icon={Tag} title="대화 키워드" hot={hot} className="shrink-0">
      <div className="flex min-h-[22px] flex-nowrap items-center gap-1 overflow-x-auto [scrollbar-width:thin]">
        {extracting ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#bad6f4] bg-[#f2f8ff] px-2 py-0.5 text-[10px] text-[#0f3468] animate-in fade-in duration-200">
            <Loader2 className="h-3 w-3 animate-spin" /> 대화 키워드 추출 중…
          </span>
        ) : keywords.length === 0 ? (
          <span className="text-[10px] text-muted-foreground/70">대화에서 키워드를 추출합니다…</span>
        ) : (
          [...keywords].reverse().map((k) => {
            const current = k === topicKeyword
            const active = k === activeKeyword
            return (
              <button
                key={k}
                type="button"
                onClick={() => onAsk(k)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10.5px] transition-colors animate-in fade-in zoom-in duration-300",
                  current || active ? "border-[#0f3468] bg-[#0f3468] text-white" : "border-[#bad6f4] bg-[#f2f8ff] text-[#0f3468] hover:bg-[#0f3468] hover:text-white",
                  active && "animate-pulse",
                )}
              >
                {k}
              </button>
            )
          })
        )}
      </div>
    </MiniCard>
  )
}

// 상담 진행 가이드 — 필수 안내(FCR 체크) + 추천 응대 멘트를 같은 주제 단계로 통합
function GuidePlan({ checklist, pending, loading, auto, onAuto, onToggle, scriptKey, activeStep, revealCount }: { checklist: (ChecklistItem & { status: FcrStatus })[]; pending: number; loading?: boolean; auto: boolean; onAuto: () => void; onToggle: (id: string) => void; scriptKey: string; activeStep: number | null; revealCount: number }) {
  const s = scripts[scriptKey] ?? scripts.intro
  // 일반 안내(gated 아님)는 토픽 선택 시 항상 노출, 상황별 안내(gated)는 진행 단계(revealCount)에 도달해야 노출
  const shown = s.steps.map((st, idx) => ({ st, idx })).filter(({ st, idx }) => !st.gated || idx < Math.max(0, revealCount))
  return (
    <MiniCard
      icon={ClipboardCheck}
      title="스크립트 가이드"
      bodyScroll
      className="min-h-0 flex-1"
      below={<span className="inline-flex items-center gap-1 rounded-full border border-[#bad6f4] bg-[#f2f8ff] px-2 py-0.5 text-[10px] font-medium text-[#0f3468]"><Tag className="h-2.5 w-2.5" /> {s.title}</span>}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#bad6f4] bg-[#f7fbff] py-3 text-[10.5px] text-[#0f3468] animate-in fade-in duration-200">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> 가이드 갱신 중…
        </div>
      ) : (
        <div className="space-y-2.5 animate-in fade-in duration-300">
          {/* FCR 체크리스트 */}
          <div>
            <div className="mb-1 flex items-center gap-1.5 px-0.5">
              <span className="flex items-center gap-1 text-[9.5px] font-bold text-[#0f3468]"><ShieldCheck className="h-3 w-3" /> FCR 체크리스트</span>
              <span className="ml-auto flex items-center gap-1.5">
                {/* 자동/수동 스위치 */}
                <button type="button" role="switch" aria-checked={auto} onClick={onAuto} className="flex items-center gap-1">
                  <span className={cn("text-[9px] font-semibold", auto ? "text-[#0f3468]" : "text-muted-foreground")}>{auto ? "자동" : "수동"}</span>
                  <span className={cn("relative h-3.5 w-6 rounded-full transition-colors", auto ? "bg-[#0f3468]" : "bg-slate-300")}>
                    <span className={cn("absolute top-[3px] h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-all", auto ? "left-[12px]" : "left-[3px]")} />
                  </span>
                </button>
                <Badge variant="outline" className={cn("h-4 px-1.5 text-[9px]", pending ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700")}>{pending ? `${checklist.length - pending}/${checklist.length}` : "완료"}</Badge>
              </span>
            </div>
            <div className="space-y-1">
              {checklist.map((c) => {
                const isDone = c.status === "confirmed"
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onToggle(c.id)}
                    className={cn(
                      "flex w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-left transition-colors",
                      isDone ? "border-emerald-200 bg-emerald-50/60" : "border-[#e2eaf4] bg-white hover:bg-muted/40",
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
                    <span className={cn("truncate text-[11.5px] font-medium", isDone ? "text-emerald-800" : "text-[#10233f]")}>{c.label}</span>
                    <div className="ml-auto flex shrink-0 items-center gap-1">
                      {c.required ? <span className={cn("rounded px-1 text-[8px] font-medium", isDone ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-500")}>필수</span> : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 추천 응대 멘트 */}
          <div className="border-t border-[#eef3f9] pt-2">
            <p className="mb-1 flex items-center gap-1 px-0.5 text-[9.5px] font-bold text-[#0f3468]"><ScrollText className="h-3 w-3" /> 추천 응대 멘트</p>
            <div className="space-y-1">
              {shown.length === 0 ? (
                <span className="px-0.5 text-[10px] text-muted-foreground/70">상담 진행에 따라 멘트가 제시됩니다…</span>
              ) : null}
              {shown.map(({ st, idx }) => {
                const active = idx === activeStep
                return (
                  <div
                    key={st.phase}
                    className={cn(
                      "rounded-lg border px-2 py-1 transition-colors",
                      active ? "border-[#0f3468] bg-[#f2f8ff] ring-1 ring-[#0f3468]/50" : "border-[#e2eaf4] bg-[#fbfdff]",
                    )}
                  >
                    <span className="mr-1 inline-block rounded-full bg-[#0f3468]/10 px-1.5 py-0.5 text-[8.5px] font-bold text-[#0f3468]">{st.phase}</span>
                    <span className="text-[11px] leading-4 text-[#10233f]">{st.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </MiniCard>
  )
}

/* ---------------- 관리자 코칭 메신저 (실시간 청취·코칭) ---------------- */

// 시나리오 step별 관리자 코칭 메시지(실시간 청취 기반)
const COACH_CONNECT_STEP = 7 // 고객 해지환급금 질의 시점에 관리자 입장
type CoachMsg = { text: string; time: string; role?: "admin" | "system" }
const COACH_TIMELINE: Record<number, CoachMsg[]> = {
  // 7 — 고객 해지환급금 문의 시점: 관리자 입장 + 모니터링 시작 + 정확성 유의
  7: [
    { text: "박관리 관리자가 상담에 접속하였습니다.", time: "10:24", role: "system" },
    { text: "상담 모니터링을 시작합니다.", time: "10:24" },
    { text: "해지환급금 안내 시 금액·보장 안내 정확성에 유의해 주세요.", time: "10:24" },
  ],
  // 8 — 상담사 보장 종료·재가입 제한 고지 후: 피드백 + 환급금 안내 코칭
  8: [
    { text: "해지 시 보장 종료·재가입 제한을 먼저 고지하셨네요 👍 좋습니다.", time: "10:25" },
    { text: "예상 환급금은 경과 시점·약관대출 잔액에 따라 달라집니다. 구두는 '약'으로만 안내하고 정확액은 문자로 — 지금처럼 진행하세요.", time: "10:25" },
  ],
}

function CoachingChat({ connected, messages, onSend }: { connected: boolean; messages: { role: "admin" | "agent" | "system"; text: string; time: string }[]; onSend: (text: string) => void }) {
  const msgs = messages
  const [input, setInput] = useState("")
  const [expanded, setExpanded] = useState(false) // 기본: 최소화(헤더+입력만)
  const [flash, setFlash] = useState(false) // 접속 직후 잠깐 하이라이트(업무정보와 동일 톤)
  const endRef = useRef<HTMLDivElement>(null)

  // 관리자 입장(접속) 시 자동으로 펼침 + 몇 초간 하이라이트 후 해제
  useEffect(() => {
    if (!connected) return
    setExpanded(true)
    setFlash(true)
    const t = window.setTimeout(() => setFlash(false), 3000)
    return () => window.clearTimeout(t)
  }, [connected])

  useEffect(() => {
    if (expanded) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [msgs.length, expanded])

  const send = () => {
    const t = input.trim()
    if (!t) return
    onSend(t)
    setInput("")
  }

  return (
    <div className={cn("flex shrink-0 flex-col border-t border-[#d4e0ef] bg-white transition-shadow duration-500", expanded ? "h-[280px]" : "h-[116px]", flash && "ring-2 ring-[#0f3468]/70 ring-offset-1")}>
      {/* 헤더 — 클릭 시 최소화/펼치기 */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex shrink-0 items-center gap-1.5 border-b border-[#cfe0f1] bg-gradient-to-r from-[#eef4fb] to-[#f7fbff] px-3 py-2 text-left transition-colors hover:from-[#e3eefb]"
      >
        <ShieldCheck className={cn("h-3.5 w-3.5", connected ? "text-[#0f3468]" : "text-muted-foreground/50")} />
        <span className="text-[11px] font-bold text-[#10233f]">관리자 코칭</span>
        {connected ? (
          <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> 실시간 청취 중
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> 미접속
          </span>
        )}
        <span className="ml-auto text-[9px] text-muted-foreground">{expanded ? "최소화" : "펼치기"}</span>
        <ChevronUp className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      {/* 메시지 — 최소화 시에도 일부 표시 */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[#f7fafe] px-2.5 py-2">
          {msgs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-[10px] leading-4 text-muted-foreground">
              {connected ? "관리자가 상담을 청취하고 있습니다." : "관리자 접속 대기 중입니다."}
            </div>
          ) : null}
          {msgs.map((m, i) => {
            if (m.role === "system") {
              return (
                <div key={i} className="flex items-center justify-center gap-1.5 py-0.5">
                  <span className="rounded-full bg-[#e7edf5] px-2 py-0.5 text-[9px] font-medium text-[#5b6b80]">{m.text}</span>
                </div>
              )
            }
            const admin = m.role === "admin"
            return (
              <div key={i} className={cn("flex flex-col", admin ? "items-start" : "items-end")}>
                <span className="mb-0.5 px-0.5 text-[8.5px] text-muted-foreground">{admin ? "박관리 관리자" : "나"} · {m.time}</span>
                <div
                  className={cn(
                    "max-w-[85%] border px-2.5 py-1.5 text-[11px] leading-4",
                    admin ? "rounded-[3px] rounded-tl-[1px] border-[#dbe5f1] bg-white text-[#10233f]" : "rounded-[3px] rounded-tr-[1px] border-[#0f3468] bg-[#0f3468] text-white",
                  )}
                >
                  {m.text}
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

      {/* 입력 */}
      <div className="flex shrink-0 items-center gap-1.5 border-t border-[#e2eaf4] px-2.5 py-1.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send() }}
          placeholder="메시지 입력"
          className="h-7 rounded-[4px] border-[#dbe5f1] bg-white text-[10.5px] placeholder:text-[9.5px]"
        />
        <Button size="sm" onClick={send} disabled={!input.trim()} className="h-7 shrink-0 rounded-[4px] bg-[#0f3468] px-2.5 text-[10.5px] hover:bg-[#0b2547] disabled:opacity-40">
          전송
        </Button>
      </div>
    </div>
  )
}

/* ---------------- RAG 메시지 ---------------- */

function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-[#cfe0f1] bg-[#eef4fb] px-4 py-2.5 text-[13px] leading-6 text-[#27456b] shadow-sm">{text}</div>
    </div>
  )
}

function AssistantMessage({ msg }: { msg: ChatMsg }) {
  return (
    <div className="flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0f3468]/10 text-[#0f3468]">
        <Bot className="h-4 w-4" />
      </div>
      <div className="min-w-0 max-w-[88%] space-y-2.5">
        <div className="rounded-2xl rounded-tl-sm border bg-white px-4 py-3 shadow-sm">
          <p className="text-[13px] font-semibold leading-6 text-[#10233f]">{msg.content}</p>
          {msg.bullets?.length ? (
            <ul className="mt-2 space-y-1">
              {msg.bullets.map((b) => (
                <li key={b} className="flex gap-1.5 text-[12.5px] leading-5 text-[#33445c]">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#0f3468]" /> {b}
                </li>
              ))}
            </ul>
          ) : null}
          {msg.standard ? (
            <div className="mt-2.5 rounded-lg border border-dashed border-[#bad6f4] bg-[#f2f8ff] px-3 py-2 text-[11.5px] leading-5 text-[#0f3468]">
              <span className="font-semibold">업무 기준 · </span>
              {msg.standard}
            </div>
          ) : null}
        </div>
        {msg.sources?.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-[10.5px] font-semibold text-muted-foreground">
              <BookOpen className="h-3 w-3" /> 출처
            </span>
            {msg.sources.map((s) => (
              <span key={s.label} className="inline-flex items-center gap-1 rounded-lg border border-[#dbe5f1] bg-white px-2 py-1 text-[10.5px]">
                <Badge variant="outline" className={cn("h-3.5 px-1 text-[8px]", s.type === "약관" ? "border-indigo-200 bg-indigo-50 text-indigo-600" : "border-emerald-200 bg-emerald-50 text-emerald-600")}>{s.type}</Badge>
                <span className="text-[#10233f]">{s.label}</span>
                <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

const THINK_STEPS = ["고객 의도 분석", "사내 지식베이스 검색", "관련 약관·지침 추출", "출처 검증", "답변 생성"]

function ThinkingSteps() {
  // 단계가 하나씩 진행되며 유추 과정을 충분히 보여줌
  const [done, setDone] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setDone((d) => Math.min(d + 1, THINK_STEPS.length)), 480)
    return () => window.clearInterval(t)
  }, [])

  return (
    <div className="flex gap-2.5 animate-in fade-in duration-300">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0f3468]/10 text-[#0f3468]">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border bg-white px-4 py-3 shadow-sm">
        <div className="mb-1.5 text-[10.5px] font-semibold text-[#0f3468]">지식 검색·유추 중…</div>
        <div className="space-y-1">
          {THINK_STEPS.map((s, i) => {
            const isDone = i < done
            const isCurrent = i === done
            if (i > done) return null
            return (
              <div key={s} className="flex items-center gap-1.5 text-[11.5px] animate-in fade-in slide-in-from-left-1 duration-300">
                {isDone ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin text-[#0f3468]" />
                )}
                <span className={isCurrent ? "font-medium text-[#10233f]" : "text-muted-foreground"}>{s}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------------- 우측 업무정보 ---------------- */

export function WorkInfo({ activeContract, pendingContract, onSelect, hot, tab, onTabChange, pulseTab, loading }: { activeContract: string; pendingContract?: string | null; onSelect: (no: string) => void; hot?: boolean; tab: "customer" | "products" | "claim"; onTabChange: (t: "customer" | "products" | "claim") => void; pulseTab?: string | null; loading?: boolean }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ payment: true })
  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }))
  const setTab = onTabChange
  // 시나리오: 상품 하이라이트/펼침이 지정되면 가입상품 탭으로 전환
  useEffect(() => {
    if (pendingContract || (activeContract && activeContract !== "ALL")) onTabChange("products")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingContract, activeContract])

  const TABS = [
    { key: "customer", label: "고객정보" },
    { key: "products", label: "가입상품" },
    { key: "claim", label: "청구진행 현황" },
  ] as const

  return (
    <Card className={cn("flex h-full flex-col overflow-hidden gap-0 py-0 transition-shadow", hot && hotRing)}>
      {/* 제목 */}
      <div className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-2 text-[12.5px] font-bold text-[#10233f]">
        <Layers className="h-4 w-4 text-[#0f3468]" /> 업무 정보
      </div>
      {/* 책갈피 탭 바 */}
      <div className="flex shrink-0 items-end gap-1 border-b border-[#cdddef] px-2">
        {TABS.map((t) => {
          const active = tab === t.key
          const pulse = pulseTab === t.key && !active
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "-mb-px flex items-center gap-1 rounded-t-lg border border-b-0 px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                active ? "border-[#cdddef] bg-white text-[#0f3468]" : "border-transparent bg-[#e9f0f8] text-[#5b6b80] hover:bg-[#f0f6fc]",
              )}
            >
              {t.label}
              {t.key === "claim" && CLAIM_PROGRESS.active ? <span className={cn("inline-block h-1.5 w-1.5 rounded-full", active ? "bg-[#0f3468]" : pulse ? "animate-pulse bg-[#0f3468]" : "bg-[#9bb0c8]")} /> : null}
            </button>
          )
        })}
      </div>

      <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2.5 pb-2.5 pt-2.5">

        {loading ? (
          <div className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#bad6f4] bg-[#f7fbff] py-4 text-[10.5px] text-[#0f3468] animate-in fade-in duration-200">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> 고객·계약 정보 불러오는 중…
          </div>
        ) : (
        <>

        {/* 고객정보 — 정보계 조회 화면형 테이블 */}
        {tab === "customer" ? (
          <div className="space-y-2">
            {CUSTOMER_INFO.map((g) => (
              <div key={g.group} className="overflow-hidden border border-[#d4dfec]">
                <div className="border-b border-[#d4dfec] bg-[#eef3f9] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#33445c]">{g.group}</div>
                <table className="w-full border-collapse">
                  <tbody>
                    {g.rows.map(([k, v], i) => (
                      <tr key={k} className={cn(i > 0 && "border-t border-[#eef3f9]")}>
                        <td className="w-[84px] border-r border-[#eef3f9] bg-[#f7fafd] px-2.5 py-1.5 align-middle text-[10px] text-muted-foreground">{k}</td>
                        <td className="px-2.5 py-1.5 text-[11.5px] font-medium text-[#10233f]">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : null}

        {/* 청구진행 현황 */}
        {tab === "claim" ? (
          CLAIM_PROGRESS.active ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md border border-[#dbe9f7] bg-[#f2f8ff] px-2.5 py-2">
                <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-[#0f3468]" />
                <div className="min-w-0">
                  <div className="text-[10px] text-muted-foreground">청구 {CLAIM_PROGRESS.claimNo} · 접수 {CLAIM_PROGRESS.filedAt}</div>
                </div>
                <Badge variant="outline" className={cn("ml-auto h-4 px-1.5 text-[9px]", claimTone(CLAIM_PROGRESS.stage))}>{CLAIM_PROGRESS.stage}</Badge>
              </div>
              <div>
                <p className="mb-1 px-0.5 text-[10px] font-semibold text-[#33445c]">손해 입증 서류 <span className="font-normal text-muted-foreground">· 상품 무관 공통</span></p>
                <div className="space-y-1">
                  {CLAIM_PROGRESS.docs.map((d) => (
                    <div key={d.required} className="flex items-center justify-between rounded-md border border-[#eef3f9] bg-white px-2 py-1.5">
                      <span className="text-[11px] text-[#10233f]">{d.required}</span>
                      <Badge variant="outline" className={cn("h-4 px-1.5 text-[9px]", d.status === "제출 완료" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600")}>{d.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-1.5 rounded-md border border-dashed border-[#bad6f4] bg-[#f7fbff] px-2 py-1.5">
                <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-[#0f3468]" />
                <p className="text-[10px] leading-4 text-[#33445c]">
                  <span className="font-semibold text-[#0f3468]">심사 시 보장 후보</span> · {CLAIM_PROGRESS.coverage.join(" / ")}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 py-8 text-center text-muted-foreground">
              <FileCheck2 className="h-6 w-6 text-[#c3d4e8]" />
              <span className="text-[11px]">진행 중인 보험금 청구가 없습니다</span>
            </div>
          )
        ) : null}

        {/* 가입상품 — 클릭 시 인라인 토글로 상세 노출 */}
        {tab === "products" ? (
          <div className="space-y-1.5">
            {contracts.map((c) => {
              const awaiting = pendingContract === c.no
              const expanded = activeContract === c.no
              const detail = contractDetail[c.no]
              return (
                <div
                  key={c.no}
                  className={cn(
                    "overflow-hidden rounded-lg border transition-colors",
                    awaiting ? "border-[#0f3468] ring-2 ring-[#0f3468]/60 animate-pulse" : expanded ? "border-[#0f3468]/40" : "border-[#e2eaf4]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(expanded && !awaiting ? "ALL" : c.no)}
                    className={cn("flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors", expanded ? "bg-[#f2f8ff]" : "bg-white hover:bg-[#f7fbff]")}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold text-[#10233f]">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">{c.no}</div>
                    </div>
                    <Badge variant="outline" className={cn("h-4 shrink-0 px-1.5 text-[9px]", payTone(c.pay))}>{c.pay}</Badge>
                    <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                  </button>

                  {expanded && detail ? (
                    <div className="space-y-2 border-t border-[#eef3f9] bg-white/40 p-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      {/* 핵심 지표 */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {detail.figures.map(([label, value, kind]) => {
                          const Icon = figureIcon[kind ?? "wallet"]
                          return (
                            <div key={label} className="rounded-md border border-[#eef3f9] bg-white px-2 py-1.5">
                              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                <Icon className="h-3 w-3 text-[#8fb4df]" /> {label}
                              </div>
                              <div className="mt-0.5 text-[11px] font-bold text-[#10233f]">{value}</div>
                            </div>
                          )
                        })}
                      </div>
                      {detail.infoGroups.map((grp) => (
                        <WorkSection key={grp.id} icon={grp.id === "payment" ? CreditCard : FileText} title={grp.title} sub={grp.sub} open={!!open[grp.id]} onToggle={() => toggle(grp.id)}>
                          <div className="space-y-1">
                            {grp.rows.map(([label, value]) => (
                              <div key={label} className="flex items-center justify-between gap-2 rounded-md border border-[#eef3f9] bg-white px-2 py-1.5">
                                <span className="shrink-0 text-[11px] text-muted-foreground">{label}</span>
                                <span className="text-right text-[11.5px] font-medium text-[#10233f]">{value}</span>
                              </div>
                            ))}
                          </div>
                        </WorkSection>
                      ))}
                      {detail.cautions.length ? (
                        <WorkSection icon={AlertTriangle} title="처리 시 유의사항" tone="amber" open={!!open.cautions} onToggle={() => toggle("cautions")}>
                          <ul className="space-y-0.5">
                            {detail.cautions.map((ct) => (
                              <li key={ct} className="text-[10.5px] leading-4 text-amber-800">· {ct}</li>
                            ))}
                          </ul>
                        </WorkSection>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : null}
        </>
        )}
      </CardContent>
    </Card>
  )
}

function WorkSection({ icon: Icon, title, sub, tone, open, onToggle, children }: { icon: ComponentType<{ className?: string }>; title: string; sub?: string; tone?: "amber"; open: boolean; onToggle: () => void; children: ReactNode }) {
  const amber = tone === "amber"
  return (
    <div className={cn("overflow-hidden rounded-lg border", amber ? "border-amber-200" : "border-[#c7ddf4]")}>
      <button type="button" onClick={onToggle} className={cn("flex w-full items-center gap-1 px-2.5 py-1.5 text-left transition-colors", amber ? "bg-amber-50/70 hover:bg-amber-50" : "bg-[#f7fbff] hover:bg-[#eef6ff]")}>
        <Icon className={cn("h-3.5 w-3.5 shrink-0", amber ? "text-amber-600" : "text-[#0f3468]")} />
        <span className={cn("text-[11px] font-bold", amber ? "text-amber-700" : "text-[#0f3468]")}>{title}</span>
        {sub ? <span className="text-[9.5px] font-normal text-muted-foreground">({sub})</span> : null}
        <ChevronDown className={cn("ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="border-t border-[#eef3f9] bg-white/40 p-2 animate-in fade-in slide-in-from-top-1 duration-200">{children}</div> : null}
    </div>
  )
}


/* ---------------- 우측 추천(Next step + 액션) ---------------- */

function NextActions({ smsLit }: { smsLit?: boolean }) {
  const actions = [
    { id: "sms", icon: MessageSquare, label: "SMS 안내 발송", desc: "상담 요약 문자 생성", href: "/post-consultation?task=sms" },
    { id: "history", icon: ClipboardList, label: "접촉이력 등록", desc: "Tele-Pro 이력 자동 작성", href: "/post-consultation?task=contact" },
  ]
  return (
    <Card className="overflow-hidden gap-0 py-0 transition-shadow">
      <CardHeader className="border-b bg-white px-4 pb-1.5 pt-2">
        <div className="flex items-center gap-2 text-[13px] font-bold text-[#10233f]">
          <ClipboardCheck className="h-4 w-4 text-[#0f3468]" /> 후속 작업
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 px-3 pb-3 pt-2">
        {actions.map((a) => {
          const lit = smsLit && a.id === "sms"
          return (
            <Link
              key={a.label}
              href={a.href}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                lit ? "border-[#0f3468] bg-[#f2f8ff] ring-2 ring-[#0f3468]/60 animate-pulse" : "border-[#dbe5f1] bg-white hover:border-[#0f3468] hover:bg-[#f2f8ff]",
              )}
            >
              <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", lit ? "bg-[#0f3468] text-white" : "bg-[#0f3468]/10 text-[#0f3468]")}>
                <a.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11.5px] font-semibold text-[#10233f]">{a.label}{lit ? " · 발송 대기" : ""}</div>
                <div className="text-[10px] text-muted-foreground">{a.desc}</div>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

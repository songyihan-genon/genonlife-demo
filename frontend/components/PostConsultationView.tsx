"use client"

import { Fragment, Suspense, useEffect, useRef, useState } from "react"
import type { ComponentType, ReactNode } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ArrowRight,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  Headphones,
  History,
  ListChecks,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  UserRound,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

/* ================================================================== */
/* 타입                                                                */
/* ================================================================== */

type AuditResult = "통과" | "주의" | "위반"
// AI 자동 검수는 모든 상담에 대해 항상 수행됨 → 상태는 '휴먼 리뷰' 진행 단계를 의미
type ReviewStatus = "리뷰 대기" | "리뷰 완료"

interface ContactType {
  rank: string
  title: string
  weight: string
  importance: string
  major: string
  middle: string
  minor: string
  draft?: string // 유형별 요약 초안(줄글)
  draftFields?: { label: string; value: string }[] // 유형별 요약 초안(명사형 템플릿)
  draftBody?: string // 유형별 요약 초안(게시판/메일형 본문)
}

interface AuditItem {
  id: string
  label: string
  result: AuditResult
  note: string
}

interface Reference {
  type: "약관" | "구비서류" | "업무기준"
  label: string
  excerpt: string
}

interface Consultation {
  id: string
  customer: string
  customerNo: string
  time: string
  date: string
  channel: string
  audited?: boolean
  agent?: string
  topics: string[]
  keywords: string[]
  smsSent: boolean
  contactRegistered: boolean
  transcript: { speaker: "agent" | "customer"; time: string; text: string; seg?: string }[]
  status: ReviewStatus
  sttCorrections: { before: string; after: string }[]
  summary: string
  contactTypes: ContactType[]
  processing: { item: string; status: string; location?: string; expectedScript?: string }[]
  references: Reference[]
  smsDraft: string
  audit: AuditItem[]
}

/* ================================================================== */
/* 더미 데이터 — 주제별 템플릿 + 시드 조합으로 생성                      */
/* ================================================================== */

type Cat = "consult3" | "claimDoc" | "claimReceipt" | "autodebit" | "surrender" | "lapse" | "premium" | "beneficiary" | "address" | "loan" | "renewal"

interface Template {
  topics: string[]
  keywords: string[]
  summary: string[]
  transcript: { speaker: "agent" | "customer"; time: string; text: string; seg?: string }[]
  contactTypes: ContactType[]
  processing?: { item: string; status: string; location?: string; expectedScript?: string }[]
  references: Reference[]
  smsDraft: string[]
  audit: AuditItem[]
  sttCorrections: { before: string; after: string }[]
}

const TEMPLATES: Record<Cat, Template> = {
  consult3: {
    topics: ["보험금 청구 추가서류", "자동이체 변경", "해지환급금"],
    keywords: ["실손 청구", "진료비 세부내역서", "자동이체 계좌", "본인 명의", "해지환급금", "보장 종료"],
    summary: [
      "고객은 실손 보험금 청구 추가 서류, 보험료 자동이체 계좌 변경, 종신보험 해지환급금을 순차로 문의함.",
      "진료비 세부내역서 미제출 안내, 자동이체 변경 기준 안내(접수 대기), 해지 시 보장 종료 고지 및 예상 환급금 조회 안내를 진행함.",
    ],
    transcript: [
      { speaker: "agent", time: "10:21", text: "안녕하세요, 제논라이프 상담사 김제나입니다. 통화 내용은 녹취되며, 본인 확인과 개인정보 수집·이용 동의가 필요합니다." },
      { speaker: "customer", time: "10:21", text: "네, 동의합니다. 보험금 청구에 추가 서류가 필요하다고 문자가 와서요. 어떤 걸 더 내야 하죠?", seg: "1" },
      { speaker: "agent", time: "10:22", text: "확인해 보니 진료비 세부내역서가 미제출 상태입니다. 병원 원무과 발급 후 앱으로 제출해 주세요.", seg: "1" },
      { speaker: "customer", time: "10:23", text: "그리고 보험료 자동이체 계좌도 바꾸고 싶은데 가능할까요?", seg: "2" },
      { speaker: "agent", time: "10:23", text: "본인 명의 계좌로 변경 가능합니다. 출금일 5영업일 전 신청 시 당월부터 적용됩니다.", seg: "2" },
      { speaker: "customer", time: "10:24", text: "마지막으로, 예전에 가입한 종신보험 해지하면 환급금 얼마 나오는지도 궁금해요.", seg: "3" },
      { speaker: "agent", time: "10:25", text: "해지 시 보장이 종료되는 점 먼저 안내드리며, 예상 환급금은 조회 화면에서 확인 후 정확히 안내드리겠습니다.", seg: "3" },
      { speaker: "customer", time: "10:26", text: "네, 문자로 환급금 관련 안내 부탁드려요." },
    ],
    contactTypes: [
      {
        rank: "1", title: "보험금 청구 서류 보완", weight: "50%", importance: "높음", major: "보험금 청구", middle: "접수 단계", minor: "서류 보완",
        draftBody: [
          "[고객 문의] 실손 보험금 청구 추가서류",
          "- 추가서류 제출 문자를 받고 어떤 서류를 더 내야 하는지 문의",
          "",
          "[확인 내용] 진료비 세부내역서 미제출",
          "- 청구 건 조회 결과 진료비 세부내역서가 미제출 상태임을 확인",
          "",
          "[안내 내용]",
          "- 병원 원무과에서 진료비 세부내역서 발급 후 제논라이프 앱 > 추가서류 제출 메뉴로 업로드하도록 안내",
          "- 서류 완비 시 통상 3영업일 이내 심사가 진행됨을 안내",
          "",
          "[처리 결과] 추가서류 제출 안내 완료",
        ].join("\n"),
      },
      {
        rank: "2", title: "자동이체 계좌 변경", weight: "30%", importance: "보통", major: "수금/납입", middle: "자동이체", minor: "계좌 변경",
        draftBody: [
          "[고객 문의] 보험료 자동이체 계좌 변경",
          "- 자동이체 출금 계좌를 변경하고 싶다고 문의",
          "",
          "[안내 내용]",
          "- 본인 명의 계좌로만 변경 가능함을 안내",
          "- 출금일 5영업일 전 신청 시 당월분부터 적용됨을 안내",
          "",
          "[처리 결과] 변경 가능 안내 완료 · 계좌 변경 접수 대기",
          "- 변경 접수는 미처리 상태로 후속 처리 필요",
        ].join("\n"),
      },
      {
        rank: "3", title: "해지환급금 안내", weight: "20%", importance: "보통", major: "계약 변경", middle: "해지", minor: "환급금 조회",
        draftBody: [
          "[고객 문의] 종신보험 해지환급금",
          "- 예전에 가입한 종신보험 해지 시 예상 환급금이 궁금하다고 문의",
          "",
          "[안내 내용]",
          "- 해지 시 보장이 종료되고 재가입이 제한될 수 있음을 먼저 고지",
          "- 예상 환급금은 조회 화면에서 확인 후 정확히 안내 예정임을 설명",
          "",
          "[처리 결과] 해지방어 안내 완료",
        ].join("\n"),
      },
    ],
    processing: [
      { item: "진료비 세부내역서 추가 제출 안내", status: "안내 완료" },
      { item: "자동이체 계좌 변경 접수", status: "접수 대기" },
      { item: "해지방어 안내·예상 환급금 조회 안내", status: "안내 완료" },
    ],
    references: [
      { type: "약관", label: "실손의료비보험 약관 제12조(청구서류)", excerpt: "청구 시 진료비계산서·세부내역서·진단서 등 증빙 서류 제출." },
      { type: "업무기준", label: "수금·자동이체 업무지침 제8조", excerpt: "본인 명의 계좌 원칙, 출금일 5영업일 전 신청 시 당월 적용." },
      { type: "약관", label: "종신보험 약관 제30조(해지환급금)", excerpt: "해지환급금 = 책임준비금 − 해지공제액, 해지 시 주계약·특약 보장 동시 종료." },
    ],
    smsDraft: [
      "[제논라이프] 상담 안내",
      "안녕하세요, 김민준 고객님. 금일 상담해 주신 내용 안내드립니다.",
      "",
      "1) 보험금 청구 추가서류",
      "- 진료비 세부내역서가 미제출 상태입니다. 병원 원무과 발급 후 제논라이프 앱 > 추가서류 제출 메뉴로 올려주시면 통상 3영업일 이내 심사가 진행됩니다.",
      "",
      "2) 자동이체 계좌 변경",
      "- 본인 명의 계좌로 변경 가능하며, 출금일 5영업일 전 신청 시 당월분부터 적용됩니다.",
      "",
      "3) 해지환급금 안내",
      "- (무)제논종신보험 기준 예상 해지환급금은 18,420,000원입니다. 해지 시 보장이 종료되고 재가입이 제한될 수 있는 점 유의해 주세요.",
      "",
      "감사합니다.",
    ],
    audit: [
      { id: "m1", label: "본인확인·녹취·동의 이행", result: "통과", note: "도입부 절차 정상 이행" },
      { id: "m2", label: "안내 정확성(다중 문의)", result: "통과", note: "약관·업무지침 기준 일치" },
      { id: "m3", label: "오안내 여부", result: "통과", note: "사실과 다른 안내 미검출" },
      { id: "m4", label: "업무 누락 여부", result: "주의", note: "자동이체 변경 접수 미처리 — 후속 처리 필요" },
    ],
    sttCorrections: [
      { before: "진료비 셰부내역서", after: "진료비 세부내역서" },
      { before: "해지 환금금", after: "해지 환급금" },
    ],
  },
  claimDoc: {
    topics: ["보험금 청구", "서류 보완"],
    keywords: ["실손 청구", "진료비 세부내역서", "미제출 서류", "모바일 제출", "심사 소요기간"],
    summary: [
      "고객은 실손의료비 보험금 청구 건의 추가 제출 서류를 문의했습니다.",
      "진료비 세부내역서가 미제출 상태임을 안내하고, 병원 원무과 발급 후 모바일 앱 제출 경로와 심사 소요기간(통상 3영업일)을 설명했습니다.",
    ],
    transcript: [
      { speaker: "agent", time: "00:00", text: "안녕하세요, 제논라이프 상담사 김제나입니다. 본인 확인 후 도와드리겠습니다." },
      { speaker: "customer", time: "00:20", text: "보험금 청구에 추가 서류가 필요하다고 문자가 와서요. 어떤 걸 더 내야 하죠?" },
      { speaker: "agent", time: "00:42", text: "진료비 세부내역서가 미제출 상태입니다. 병원 원무과 발급 후 앱으로 제출해 주세요." },
    ],
    contactTypes: [{ rank: "1", title: "보험금 청구 서류 보완", weight: "100%", importance: "높음", major: "보험금 청구", middle: "접수 단계", minor: "서류 보완" }],
    references: [{ type: "약관", label: "실손의료비보험 약관 제12조(청구서류)", excerpt: "보험금 청구 시 진료비계산서·세부내역서·진단서 등 보장 항목별 증빙 서류를 제출해야 함." }],
    smsDraft: ["[제논라이프] 보험금 청구 안내", "문의하신 청구 건은 진료비 세부내역서 추가 제출이 필요합니다. 제논라이프 앱 > 추가서류 제출로 올려주세요.", "감사합니다."],
    audit: [
      { id: "a1", label: "본인확인·녹취·동의 이행", result: "통과", note: "도입부 절차 정상 이행" },
      { id: "a2", label: "구비서류 안내 정확성", result: "통과", note: "약관 제12조 기준과 일치" },
      { id: "a3", label: "오안내 여부", result: "통과", note: "사실과 다른 안내 미검출" },
      { id: "a4", label: "업무 누락 여부", result: "통과", note: "추가 처리 건 없음" },
    ],
    sttCorrections: [{ before: "진료비 셰부내역서", after: "진료비 세부내역서" }],
  },
  claimReceipt: {
    topics: ["보험금 청구", "접수"],
    keywords: ["실손 청구", "청구 접수", "진료비계산서", "구비서류", "심사 진행"],
    summary: [
      "고객은 실손의료비 보험금 청구 접수와 절차, 필요 서류를 문의했습니다.",
      "청구 접수를 완료하고 기본 구비서류(진료비계산서·세부내역서)와 심사 소요기간을 안내했습니다.",
    ],
    transcript: [
      { speaker: "agent", time: "00:00", text: "안녕하세요, 제논라이프입니다. 무엇을 도와드릴까요?" },
      { speaker: "customer", time: "00:18", text: "실손 보험금 청구하려고요. 어떻게 하면 되나요?" },
      { speaker: "agent", time: "00:36", text: "청구 접수 도와드리겠습니다. 진료비계산서와 세부내역서가 필요합니다." },
    ],
    contactTypes: [{ rank: "1", title: "보험금 청구 접수", weight: "100%", importance: "높음", major: "보험금 청구", middle: "접수 단계", minor: "접수 확인" }],
    processing: [
      { item: "실손 보험금 청구 접수", status: "접수 완료" },
      { item: "구비서류·심사 소요기간 안내", status: "안내 완료" },
    ],
    references: [{ type: "구비서류", label: "실손 청구 구비서류 안내", excerpt: "기본: 진료비계산서, 진료비 세부내역서 / 고액·특정질환: 진단서 추가." }],
    smsDraft: ["[제논라이프] 보험금 청구 접수 안내", "실손의료비 보험금 청구가 접수되었습니다. 서류 완비 시 통상 3영업일 이내 심사가 진행됩니다.", "감사합니다."],
    audit: [
      { id: "a1", label: "본인확인·동의 이행", result: "통과", note: "정상" },
      { id: "a2", label: "청구 절차 안내 정확성", result: "통과", note: "구비서류 기준 일치" },
      { id: "a3", label: "오안내 여부", result: "통과", note: "이상 없음" },
      { id: "a4", label: "업무 누락 여부", result: "통과", note: "접수 완료" },
    ],
    sttCorrections: [{ before: "실손 보엄금", after: "실손 보험금" }],
  },
  autodebit: {
    topics: ["수금/납입", "자동이체 변경"],
    keywords: ["자동이체", "본인 명의 계좌", "출금일", "카드납 전환", "당월 적용"],
    summary: [
      "고객은 보험료 자동이체 계좌 변경 가능 여부와 적용 시점을 문의했습니다.",
      "본인 명의 계좌로 변경 가능하며 출금일 5영업일 전 신청 시 당월 적용, 카드납 전환도 가능함을 안내했습니다.",
    ],
    transcript: [
      { speaker: "agent", time: "00:00", text: "안녕하세요, 제논라이프입니다." },
      { speaker: "customer", time: "00:16", text: "보험료 자동이체 계좌를 바꾸고 싶은데 가능한가요?" },
      { speaker: "agent", time: "00:34", text: "본인 명의 계좌로 변경 가능합니다. 출금일 5영업일 전 신청 시 당월부터 적용됩니다." },
    ],
    contactTypes: [{ rank: "1", title: "자동이체 계좌 변경", weight: "100%", importance: "보통", major: "수금/납입", middle: "자동이체", minor: "계좌 변경" }],
    processing: [
      { item: "자동이체 변경 가능 여부·기준 안내", status: "안내 완료" },
      { item: "계좌 변경 접수", status: "접수 대기" },
    ],
    references: [{ type: "업무기준", label: "수금·자동이체 업무지침 제8조", excerpt: "본인 명의 계좌 원칙, 출금일 5영업일 전 신청 시 당월 적용, 카드납 전환 가능." }],
    smsDraft: ["[제논라이프] 자동이체 변경 안내", "자동이체 계좌 변경은 본인 명의 계좌로 가능하며, 출금일 5영업일 전 신청 시 당월분부터 적용됩니다.", "감사합니다."],
    audit: [
      { id: "a1", label: "본인확인·동의 이행", result: "통과", note: "정상" },
      { id: "a2", label: "변경 기준 안내 정확성", result: "통과", note: "업무지침 제8조 일치" },
      { id: "a3", label: "오안내 여부", result: "통과", note: "이상 없음" },
      { id: "a4", label: "업무 누락 여부", result: "주의", note: "변경 안내만 완료, 접수 미처리 — 후속 처리 필요" },
    ],
    sttCorrections: [{ before: "자동이채 계좌", after: "자동이체 계좌" }],
  },
  surrender: {
    topics: ["계약 변경", "해지환급금"],
    keywords: ["해지환급금", "보장 종료", "해지방어", "재가입 제한", "예상 환급금"],
    summary: [
      "고객은 종신보험 해지 시 예상 환급금을 문의했습니다.",
      "해지 시 보장 종료·재가입 제한을 먼저 고지하고, 예상 환급금은 조회 화면 확인 후 안내하며 해지방어 대안을 함께 제시했습니다.",
    ],
    transcript: [
      { speaker: "agent", time: "00:00", text: "안녕하세요, 제논라이프입니다." },
      { speaker: "customer", time: "00:18", text: "종신보험 해지하면 환급금이 얼마 나오나요?" },
      { speaker: "agent", time: "00:38", text: "해지 시 보장이 종료되는 점 먼저 안내드리며, 예상 환급금은 조회 후 정확히 안내드리겠습니다." },
    ],
    contactTypes: [{ rank: "1", title: "해지환급금 안내", weight: "100%", importance: "보통", major: "계약 변경", middle: "해지", minor: "환급금 조회" }],
    references: [{ type: "약관", label: "종신보험 약관 제30조(해지환급금)", excerpt: "해지환급금 = 책임준비금 − 해지공제액, 해지 시 주계약·특약 보장 동시 종료." }],
    smsDraft: ["[제논라이프] 해지환급금 안내", "해지 시 보장이 종료되며 재가입이 제한될 수 있습니다. 예상 환급금은 조회 결과 기준으로 별도 안내드립니다.", "감사합니다."],
    audit: [
      { id: "a1", label: "본인확인·동의 이행", result: "통과", note: "정상" },
      { id: "a2", label: "해지 시 보장 종료 고지", result: "통과", note: "불완전판매 방지 고지 확인" },
      { id: "a3", label: "오안내 여부", result: "통과", note: "이상 없음" },
      { id: "a4", label: "업무 누락 여부", result: "통과", note: "해지방어 대안 안내 완료" },
    ],
    sttCorrections: [{ before: "해지 환금금", after: "해지 환급금" }],
  },
  lapse: {
    topics: ["수금/납입", "실효·부활"],
    keywords: ["보험료 미납", "납입최고기간", "실효", "부활 청약", "건강 고지"],
    summary: [
      "고객은 보험료 미납으로 인한 실효 시점과 부활 조건을 문의했습니다.",
      "납입최고기간 경과 시 실효되며 실효일로부터 3년 이내 부활 청약이 가능하고, 미납 보험료·이자 납입 및 건강 고지가 필요함을 안내했습니다.",
    ],
    transcript: [
      { speaker: "agent", time: "00:00", text: "안녕하세요, 제논라이프입니다. 무엇을 도와드릴까요?" },
      { speaker: "customer", time: "00:20", text: "보험료를 못 냈는데 언제 실효되나요? 부활도 가능한가요?" },
      { speaker: "agent", time: "00:40", text: "납입최고기간 경과 시 실효되며, 실효 후 3년 이내 부활 청약이 가능합니다." },
    ],
    contactTypes: [
      { rank: "1", title: "납입·실효 안내", weight: "62%", importance: "높음", major: "수금/납입", middle: "실효", minor: "납입최고", draft: "보험료 미납으로 인한 실효 가능 시점을 문의하여, 납입최고기간 경과 시 계약이 실효됨을 안내함." },
      { rank: "2", title: "부활 청약 안내", weight: "38%", importance: "보통", major: "계약 변경", middle: "부활", minor: "청약 조건", draft: "실효 후 부활 가능 여부를 문의하여, 실효일로부터 3년 이내 부활 청약이 가능하며 미납 보험료·이자 납입 및 건강 고지가 필요함을 안내함." },
    ],
    references: [{ type: "약관", label: "보험료 납입·실효·부활 조항", excerpt: "납입기일 후 납입최고기간 경과 시 실효, 실효일로부터 3년 내 부활 청약 가능." }],
    smsDraft: ["[제논라이프] 실효·부활 안내", "보험료 미납 시 납입최고기간 경과 후 실효될 수 있으며, 실효 후 3년 이내 부활 청약이 가능합니다.", "감사합니다."],
    audit: [
      { id: "a1", label: "본인확인·동의 이행", result: "통과", note: "정상" },
      { id: "a2", label: "실효·부활 기준 안내 정확성", result: "통과", note: "약관 기준 일치" },
      { id: "a3", label: "오안내 여부", result: "주의", note: "부활 이자율 구체 수치 안내 — 시행세칙 재확인 필요" },
      { id: "a4", label: "업무 누락 여부", result: "통과", note: "추가 처리 건 없음" },
    ],
    sttCorrections: [{ before: "부할 청약", after: "부활 청약" }],
  },
  premium: {
    topics: ["수금/납입", "납입 유예"],
    keywords: ["납입 유예", "보험료 경감", "유예 기간", "연체 이자", "자동 복원"],
    summary: [
      "고객은 보험료 부담으로 납입 유예 가능 여부를 문의했습니다.",
      "유예 신청 기준과 유예 기간, 유예 종료 후 납입 재개·연체 처리 기준을 안내했습니다.",
    ],
    transcript: [
      { speaker: "agent", time: "00:00", text: "안녕하세요, 제논라이프입니다." },
      { speaker: "customer", time: "00:16", text: "보험료가 부담돼서요. 잠시 납입을 미룰 수 있을까요?" },
      { speaker: "agent", time: "00:36", text: "납입 유예 신청이 가능하며, 유예 기간과 종료 후 재개 기준을 안내드리겠습니다." },
    ],
    contactTypes: [{ rank: "1", title: "보험료 납입 유예 안내", weight: "100%", importance: "보통", major: "수금/납입", middle: "유예", minor: "납입 유예" }],
    references: [{ type: "업무기준", label: "납입 유예 처리지침", excerpt: "유예 신청 시 일정 기간 납입 유예 가능, 유예 종료 후 납입 재개 및 미납분 정산 필요." }],
    smsDraft: ["[제논라이프] 납입 유예 안내", "보험료 납입 유예 신청이 가능하며, 유예 종료 후 납입 재개 및 미납분 정산이 필요합니다.", "감사합니다."],
    audit: [
      { id: "a1", label: "본인확인·동의 이행", result: "통과", note: "정상" },
      { id: "a2", label: "유예 기준 안내 정확성", result: "통과", note: "처리지침 일치" },
      { id: "a3", label: "오안내 여부", result: "통과", note: "이상 없음" },
      { id: "a4", label: "업무 누락 여부", result: "통과", note: "추가 처리 건 없음" },
    ],
    sttCorrections: [{ before: "납입 유에", after: "납입 유예" }],
  },
  beneficiary: {
    topics: ["계약 변경", "수익자 변경"],
    keywords: ["보험수익자", "수익자 변경", "본인 신청", "서면 동의", "신분증 확인"],
    summary: [
      "고객은 보험수익자 변경 절차와 필요 서류를 문의했습니다.",
      "계약자 본인 신청 원칙과 수익자 변경 신청서·신분증 등 구비서류, 처리 소요기간을 안내했습니다.",
    ],
    transcript: [
      { speaker: "agent", time: "00:00", text: "안녕하세요, 제논라이프입니다." },
      { speaker: "customer", time: "00:18", text: "보험금 받는 사람을 바꾸고 싶은데 어떻게 하나요?" },
      { speaker: "agent", time: "00:38", text: "계약자 본인 신청으로 수익자 변경이 가능하며, 변경 신청서와 신분증이 필요합니다." },
    ],
    contactTypes: [{ rank: "1", title: "수익자 변경 안내", weight: "100%", importance: "보통", major: "계약 변경", middle: "수익자", minor: "변경 신청" }],
    processing: [
      { item: "수익자 변경 절차·구비서류 안내", status: "안내 완료" },
      { item: "변경 신청 접수", status: "접수 대기" },
    ],
    references: [{ type: "업무기준", label: "수익자 변경 처리지침", excerpt: "계약자 본인 신청 원칙, 변경 신청서·신분증 등 구비서류 확인 후 처리." }],
    smsDraft: ["[제논라이프] 수익자 변경 안내", "수익자 변경은 계약자 본인 신청으로 가능하며, 변경 신청서와 신분증이 필요합니다.", "감사합니다."],
    audit: [
      { id: "a1", label: "본인확인·동의 이행", result: "통과", note: "정상" },
      { id: "a2", label: "변경 절차 안내 정확성", result: "통과", note: "처리지침 일치" },
      { id: "a3", label: "오안내 여부", result: "통과", note: "이상 없음" },
      { id: "a4", label: "업무 누락 여부", result: "통과", note: "추가 처리 건 없음" },
    ],
    sttCorrections: [{ before: "수익차 변경", after: "수익자 변경" }],
  },
  address: {
    topics: ["계약 변경", "주소·연락처"],
    keywords: ["주소 변경", "연락처 변경", "본인 인증", "안내문 수령지", "즉시 반영"],
    summary: [
      "고객은 주소 및 연락처 변경을 요청했습니다.",
      "본인 인증 후 주소·휴대전화 정보를 변경하고, 안내문 수령지에 즉시 반영됨을 안내했습니다.",
    ],
    transcript: [
      { speaker: "agent", time: "00:00", text: "안녕하세요, 제논라이프입니다." },
      { speaker: "customer", time: "00:14", text: "이사해서 주소랑 연락처를 바꾸고 싶어요." },
      { speaker: "agent", time: "00:32", text: "본인 인증 후 변경 도와드리겠습니다. 안내문 수령지에 바로 반영됩니다." },
    ],
    contactTypes: [{ rank: "1", title: "주소·연락처 변경", weight: "100%", importance: "낮음", major: "계약 변경", middle: "고객정보", minor: "주소·연락처" }],
    references: [{ type: "업무기준", label: "고객정보 변경 처리지침", excerpt: "본인 인증 후 주소·연락처 즉시 변경, 안내문 수령지 자동 반영." }],
    smsDraft: ["[제논라이프] 고객정보 변경 안내", "요청하신 주소·연락처 변경이 정상 처리되었습니다. 안내문 수령지에 즉시 반영됩니다.", "감사합니다."],
    audit: [
      { id: "a1", label: "본인확인·동의 이행", result: "통과", note: "정상" },
      { id: "a2", label: "변경 처리 정확성", result: "통과", note: "정상 반영" },
      { id: "a3", label: "오안내 여부", result: "통과", note: "이상 없음" },
      { id: "a4", label: "업무 누락 여부", result: "통과", note: "추가 처리 건 없음" },
    ],
    sttCorrections: [],
  },
  loan: {
    topics: ["대출", "약관대출"],
    keywords: ["약관대출", "대출 한도", "해지환급금 기준", "대출 이자율", "상환 방법"],
    summary: [
      "고객은 약관대출 가능 한도와 이자율, 상환 방법을 문의했습니다.",
      "해지환급금 범위 내 대출 가능 한도와 이자율, 수시 상환 방법을 안내했습니다.",
    ],
    transcript: [
      { speaker: "agent", time: "00:00", text: "안녕하세요, 제논라이프입니다." },
      { speaker: "customer", time: "00:16", text: "약관대출 받을 수 있나요? 한도랑 이자가 궁금해요." },
      { speaker: "agent", time: "00:36", text: "해지환급금 범위 내에서 대출 가능하며, 이자율과 상환 방법을 안내드리겠습니다." },
    ],
    contactTypes: [{ rank: "1", title: "약관대출 안내", weight: "100%", importance: "보통", major: "대출", middle: "약관대출", minor: "한도·이자" }],
    references: [{ type: "약관", label: "보험계약대출 조항", excerpt: "해지환급금 일정 범위 내 대출 가능, 약정 이자율 적용, 수시 상환 가능." }],
    smsDraft: ["[제논라이프] 약관대출 안내", "약관대출은 해지환급금 범위 내에서 가능하며, 약정 이자율이 적용되고 수시 상환이 가능합니다.", "감사합니다."],
    audit: [
      { id: "a1", label: "본인확인·동의 이행", result: "통과", note: "정상" },
      { id: "a2", label: "대출 기준 안내 정확성", result: "통과", note: "약관 기준 일치" },
      { id: "a3", label: "오안내 여부", result: "통과", note: "이상 없음" },
      { id: "a4", label: "업무 누락 여부", result: "통과", note: "추가 처리 건 없음" },
    ],
    sttCorrections: [{ before: "약간대출", after: "약관대출" }],
  },
  renewal: {
    topics: ["갱신", "갱신 안내"],
    keywords: ["갱신 보험료", "갱신 주기", "보장 변경", "갱신 거절", "안내장"],
    summary: [
      "아웃바운드로 갱신 도래 계약의 갱신 보험료와 보장 변경 사항을 안내했습니다.",
      "갱신 주기·예상 보험료와 갱신 거절 시 보장 종료 사항을 설명하고 갱신 의사를 확인했습니다.",
    ],
    transcript: [
      { speaker: "agent", time: "00:00", text: "안녕하세요, 제논라이프입니다. 갱신 안내차 연락드렸습니다." },
      { speaker: "customer", time: "00:18", text: "갱신하면 보험료가 얼마나 오르나요?" },
      { speaker: "agent", time: "00:38", text: "갱신 주기와 예상 보험료, 보장 변경 사항을 안내드리겠습니다." },
    ],
    contactTypes: [{ rank: "1", title: "갱신 안내", weight: "100%", importance: "보통", major: "갱신", middle: "갱신 안내", minor: "보험료·보장" }],
    references: [{ type: "업무기준", label: "갱신 안내 업무지침", excerpt: "갱신 도래 계약은 갱신 보험료·보장 변경 사항 고지, 갱신 거절 시 보장 종료." }],
    smsDraft: ["[제논라이프] 갱신 안내", "갱신 도래 계약의 예상 보험료와 보장 변경 사항을 안내드립니다. 자세한 내용은 안내장을 참고해 주세요.", "감사합니다."],
    audit: [
      { id: "a1", label: "본인확인·동의 이행", result: "통과", note: "정상" },
      { id: "a2", label: "갱신 조건 안내 정확성", result: "통과", note: "업무지침 일치" },
      { id: "a3", label: "오안내 여부", result: "통과", note: "이상 없음" },
      { id: "a4", label: "업무 누락 여부", result: "통과", note: "갱신 의사 확인 완료" },
    ],
    sttCorrections: [],
  },
}

interface Seed {
  id: string
  customer: string
  no: string
  date: string
  start: string
  end: string
  channel: string
  cat: Cat
  review: ReviewStatus
  contact: boolean
  sms: boolean
  audited?: boolean // true면 오늘 건이라도 AI 일괄 검수 완료(통과/감지) 상태로 취급
  agent?: string // 담당 상담사(센터 전체 — 미지정 시 id 해시로 배정)
}

const SEEDS: Seed[] = [
  // 오늘(2026-05-14) 상담 14건 — 업무 종료 후 일괄 검수(전부 AI 검수 중). 홈 '오늘 상담 이력' 회원 포함.
  { id: "CL-20260514-018", customer: "김민준", no: "C-10294857", date: "2026-05-14", start: "17:18", end: "17:24", channel: "콜센터 인바운드", cat: "consult3", review: "리뷰 대기", contact: false, sms: false },
  { id: "CL-20260514-022", customer: "이준호", no: "C-10455821", date: "2026-05-14", start: "09:18", end: "09:25", channel: "콜센터 인바운드", cat: "claimDoc", review: "리뷰 대기", contact: true, sms: true },
  { id: "CL-20260514-025", customer: "최유진", no: "C-10478003", date: "2026-05-14", start: "09:41", end: "09:48", channel: "모바일 앱", cat: "claimReceipt", review: "리뷰 대기", contact: true, sms: true },
  { id: "CL-20260514-021", customer: "박서윤", no: "C-10387442", date: "2026-05-14", start: "11:05", end: "11:11", channel: "콜센터 인바운드", cat: "lapse", review: "리뷰 대기", contact: true, sms: true },
  { id: "CL-20260514-029", customer: "정민서", no: "C-10588021", date: "2026-05-14", start: "11:32", end: "11:39", channel: "콜센터 인바운드", cat: "surrender", review: "리뷰 대기", contact: true, sms: false },
  { id: "CL-20260514-033", customer: "강도윤", no: "C-10491264", date: "2026-05-14", start: "12:48", end: "12:54", channel: "콜센터 인바운드", cat: "autodebit", review: "리뷰 대기", contact: true, sms: true },
  { id: "CL-20260514-037", customer: "윤서아", no: "C-10502347", date: "2026-05-14", start: "13:20", end: "13:27", channel: "콜센터 아웃바운드", cat: "renewal", review: "리뷰 대기", contact: true, sms: true },
  { id: "CL-20260514-041", customer: "박지훈", no: "C-10593344", date: "2026-05-14", start: "13:55", end: "14:01", channel: "챗봇 이관", cat: "loan", review: "리뷰 대기", contact: false, sms: false },
  { id: "CL-20260514-044", customer: "김하늘", no: "C-10601287", date: "2026-05-14", start: "14:30", end: "14:36", channel: "모바일 앱", cat: "beneficiary", review: "리뷰 대기", contact: false, sms: false },
  { id: "CL-20260514-048", customer: "한지우", no: "C-10519882", date: "2026-05-14", start: "15:12", end: "15:19", channel: "콜센터 인바운드", cat: "premium", review: "리뷰 대기", contact: false, sms: true },
  { id: "CL-20260514-052", customer: "오세훈", no: "C-10533471", date: "2026-05-14", start: "15:40", end: "15:46", channel: "콜센터 인바운드", cat: "address", review: "리뷰 대기", contact: false, sms: true },
  { id: "CL-20260514-056", customer: "서민재", no: "C-10548190", date: "2026-05-14", start: "16:10", end: "16:17", channel: "모바일 앱", cat: "claimDoc", review: "리뷰 대기", contact: false, sms: false },
  { id: "CL-20260514-060", customer: "임채원", no: "C-10551023", date: "2026-05-14", start: "16:35", end: "16:41", channel: "콜센터 인바운드", cat: "renewal", review: "리뷰 대기", contact: false, sms: false },
  { id: "CL-20260514-064", customer: "신예은", no: "C-10567744", date: "2026-05-14", start: "17:02", end: "17:08", channel: "콜센터 인바운드", cat: "surrender", review: "리뷰 대기", contact: false, sms: false },
  { id: "CL-20260513-027", customer: "정해린", no: "C-10422190", date: "2026-05-13", start: "17:42", end: "17:48", channel: "챗봇 이관", cat: "autodebit", review: "리뷰 대기", contact: false, sms: true, agent: "김제나" },
  { id: "CL-20260513-088", customer: "강도윤", no: "C-10491264", date: "2026-05-13", start: "09:48", end: "09:55", channel: "콜센터 인바운드", cat: "claimReceipt", review: "리뷰 완료", contact: true, sms: true },
  { id: "CL-20260513-092", customer: "윤서아", no: "C-10502347", date: "2026-05-13", start: "10:33", end: "10:39", channel: "콜센터 아웃바운드", cat: "renewal", review: "리뷰 대기", contact: false, sms: false },
  { id: "CL-20260513-097", customer: "김민준", no: "C-10294857", date: "2026-05-13", start: "16:20", end: "16:25", channel: "콜센터 인바운드", cat: "autodebit", review: "리뷰 완료", contact: true, sms: true },
  { id: "CL-20260512-061", customer: "한지우", no: "C-10519882", date: "2026-05-12", start: "11:14", end: "11:21", channel: "콜센터 인바운드", cat: "beneficiary", review: "리뷰 대기", contact: false, sms: false },
  { id: "CL-20260512-066", customer: "오세훈", no: "C-10533471", date: "2026-05-12", start: "13:55", end: "14:02", channel: "챗봇 이관", cat: "loan", review: "리뷰 완료", contact: true, sms: true },
  { id: "CL-20260512-070", customer: "서민재", no: "C-10548190", date: "2026-05-12", start: "15:40", end: "15:46", channel: "콜센터 인바운드", cat: "premium", review: "리뷰 대기", contact: true, sms: false },
  { id: "CL-20260509-040", customer: "임채원", no: "C-10551023", date: "2026-05-09", start: "10:05", end: "10:12", channel: "모바일 앱", cat: "claimDoc", review: "리뷰 완료", contact: true, sms: true },
  { id: "CL-20260509-044", customer: "신예은", no: "C-10567744", date: "2026-05-09", start: "14:28", end: "14:33", channel: "콜센터 인바운드", cat: "surrender", review: "리뷰 대기", contact: false, sms: false },
  { id: "CL-20260508-019", customer: "박서윤", no: "C-10387442", date: "2026-05-08", start: "09:30", end: "09:37", channel: "콜센터 인바운드", cat: "premium", review: "리뷰 완료", contact: true, sms: true },
  { id: "CL-20260507-052", customer: "김민준", no: "C-10294857", date: "2026-05-07", start: "11:48", end: "11:54", channel: "콜센터 인바운드", cat: "claimReceipt", review: "리뷰 완료", contact: true, sms: true },
  { id: "CL-20260506-073", customer: "정해린", no: "C-10422190", date: "2026-05-06", start: "16:10", end: "16:15", channel: "챗봇 이관", cat: "address", review: "리뷰 완료", contact: true, sms: true },
  { id: "CL-20260502-081", customer: "강도윤", no: "C-10491264", date: "2026-05-02", start: "13:22", end: "13:29", channel: "콜센터 인바운드", cat: "lapse", review: "리뷰 완료", contact: true, sms: false },
  { id: "CL-20260428-033", customer: "윤서아", no: "C-10502347", date: "2026-04-28", start: "10:50", end: "10:57", channel: "콜센터 아웃바운드", cat: "renewal", review: "리뷰 완료", contact: true, sms: true },
  { id: "CL-20260415-066", customer: "이준호", no: "C-10455821", date: "2026-04-15", start: "15:18", end: "15:24", channel: "콜센터 인바운드", cat: "loan", review: "리뷰 완료", contact: true, sms: true },
  { id: "CL-20251218-204", customer: "김민준", no: "C-10294857", date: "2025-12-18", start: "14:02", end: "14:09", channel: "콜센터 인바운드", cat: "claimReceipt", review: "리뷰 완료", contact: true, sms: true },
  { id: "CL-20251105-118", customer: "최유진", no: "C-10478003", date: "2025-11-05", start: "11:33", end: "11:40", channel: "모바일 앱", cat: "beneficiary", review: "리뷰 완료", contact: true, sms: true },
  { id: "CL-20250722-090", customer: "한지우", no: "C-10519882", date: "2025-07-22", start: "09:41", end: "09:47", channel: "콜센터 인바운드", cat: "autodebit", review: "리뷰 완료", contact: true, sms: true },
  { id: "CL-20250310-051", customer: "오세훈", no: "C-10533471", date: "2025-03-10", start: "13:12", end: "13:18", channel: "콜센터 인바운드", cat: "surrender", review: "리뷰 완료", contact: true, sms: true },
  { id: "CL-20240916-077", customer: "박서윤", no: "C-10387442", date: "2024-09-16", start: "10:25", end: "10:31", channel: "콜센터 인바운드", cat: "premium", review: "리뷰 완료", contact: true, sms: true },
]

// 검수 데모용 상담 오버라이드(정해린 2건) — 후처리검수 agent의 work/guidance 시나리오 기반
// 정해린(C-10422190) 해지환급금 안내 문자 — 직전 발송본(오안내 100%·보장종료 고지 누락) / 정정본(80%·고지 보완)
const HAERIN_ORIGINAL_SMS = [
  "[제논라이프] 해지환급금 안내",
  "안녕하세요, 정해린 고객님. 제논라이프입니다.",
  "문의하신 (무)제논종신보험 해지환급금을 안내드립니다.",
  "· 예상 해지환급금 : 약 18,420,000원 (현재 적립액 기준)",
  "· 적용 환급률 : 100% (납입 보험료 기준)",
  "정확한 금액은 해지 신청 시점에 따라 달라질 수 있으며, 제논라이프 앱 마이페이지 또는 1588-0000에서 조회하실 수 있습니다.",
  "감사합니다.",
].join("\n")
const HAERIN_CORRECTED_SMS = [
  "[제논라이프] 해지환급금 안내 (정정)",
  "안녕하세요, 정해린 고객님. 제논라이프입니다.",
  "앞서 안내드린 해지환급금 환급률을 바로잡아 다시 안내드립니다.",
  "· 적용 환급률 : 80% (가입 5년 경과 기준 약관상 환급률)",
  "· 예상 해지환급금 : 약 14,736,000원 (책임준비금 − 해지공제액 기준, 변동 가능)",
  "또한 해지 시 보장이 종료되며 동일 조건의 재가입이 제한될 수 있으니, 해지 전 신중히 검토해 주시기 바랍니다.",
  "앞선 안내로 불편을 드린 점 사과드립니다. 자세한 사항은 1588-0000으로 문의해 주세요. 감사합니다.",
].join("\n")

const AUDIT_DEMO_OVERRIDES: Record<string, Partial<Consultation>> = {
  // 1차(최초 가입 상담): 신규 가입 매뉴얼 수행 누락(3/8) — work 시나리오
  "CL-20260506-073": {
    status: "리뷰 대기",
    topics: ["신규 가입 상담"],
    keywords: ["신규가입", "가입설계", "자동이체"],
    summary: "신규 종신보험 가입 상담 진행. 가입 절차·설계·자동이체를 안내함.",
    transcript: [
      { speaker: "customer", time: "16:10", text: "가입하고 싶은데요, 어떻게 해야 하나요?" },
      { speaker: "agent", time: "16:10", text: "네 안녕하세요 고객님, 제논라이프 상담센터입니다. 가입 도와드리겠습니다." },
      { speaker: "agent", time: "16:11", text: "본 통화는 품질 향상을 위해 녹음되고 있음을 알려드립니다." },
      { speaker: "customer", time: "16:11", text: "네 알겠습니다." },
      { speaker: "agent", time: "16:12", text: "개인정보 수집 및 이용에 동의하시겠습니까?" },
      { speaker: "customer", time: "16:12", text: "동의합니다." },
      { speaker: "agent", time: "16:14", text: "가입설계서 발송에 동의하시겠습니까?" },
      { speaker: "customer", time: "16:14", text: "네 좋아요." },
    ],
    references: [
      { type: "업무기준", label: "신규 가입 상담 매뉴얼 v4.0", excerpt: "신규 가입 상담은 인사·본인확인·녹취 고지·수집 동의·제3자 동의·가입설계 동의·인출 동의·마무리 안내 8개 항목을 순서대로 이행해야 한다." },
    ],
    processing: [
      { item: "인사 멘트", status: "수행", location: "발화 #2", expectedScript: "안녕하세요, 제논라이프 ○○입니다" },
      { item: "본인확인 멘트", status: "미수행", location: "미수행", expectedScript: "주민등록번호 앞 6자리를 말씀해 주시겠어요?" },
      { item: "녹취 고지", status: "수행", location: "발화 #3", expectedScript: "본 통화는 녹음되고 있음을 알려드립니다" },
      { item: "수집 동의", status: "수행", location: "발화 #5", expectedScript: "개인정보 수집 및 이용에 동의하시겠습니까?" },
      { item: "제3자 동의", status: "미수행", location: "미수행", expectedScript: "타인 정보 이용에 동의하시겠습니까?" },
      { item: "가입 설계 동의", status: "수행", location: "발화 #7", expectedScript: "가입설계서 발송에 동의하시겠습니까?" },
      { item: "인출 동의", status: "미수행", location: "미수행", expectedScript: "보험료 자동 인출에 동의하시겠습니까?" },
      { item: "마무리 안내", status: "수행", location: "발화 #8", expectedScript: "추가 문의 사항이 있으시면 언제든 연락 주세요" },
    ],
    audit: [
      { id: "g", label: "오안내 여부(안내 정확성)", result: "통과", note: "사실과 다른 안내가 검출되지 않았습니다." },
      { id: "w", label: "업무 누락 여부", result: "위반", note: "신규 가입 매뉴얼 8개 항목 중 본인확인·제3자 동의·인출 동의 3개 항목이 미수행되었습니다." },
    ],
  },
  // 2차: 해지 환급률 오안내 — guidance 시나리오(K20260512-K123)
  "CL-20260513-027": {
    status: "리뷰 대기",
    topics: ["해지환급금 문의"],
    keywords: ["해지환급금", "환급률", "해지", "종신보험"],
    summary: "가입 5년 경과 종신보험의 해지환급금을 문의함. 본인확인 후 예상 환급률을 100%로 안내하고 상담을 종료함.",
    smsDraft: HAERIN_ORIGINAL_SMS, // 첫 상담에서 발송한 해지환급금 안내 — cat(autodebit) 템플릿 대신 사용
    sttCorrections: [
      { before: "환금률", after: "환급률" },
      { before: "해지 환급", after: "해지환급금" },
    ],
    contactTypes: [
      {
        rank: "1", title: "해지환급금 안내", weight: "100%", importance: "보통",
        major: "계약 변경", middle: "해지·환급", minor: "환급금 조회",
        draft: "가입 5년 경과 종신보험의 해지환급금을 문의하여, 예상 환급률 100% 기준으로 안내함. 정확한 예상 환급금은 조회 후 안내 예정.",
      },
    ],
    transcript: [
      { speaker: "agent", time: "13:30", text: "네 안녕하세요 고객님, 제논라이프 상담센터입니다. 무엇을 도와드릴까요?" },
      { speaker: "customer", time: "13:30", text: "제가 종신보험 가입한 지 5년 정도 됐는데요, 지금 해지하면 돈을 얼마나 돌려받을 수 있나 해서요." },
      { speaker: "agent", time: "13:31", text: "네 고객님, 해지 환급금 문의 주셨군요. 본인 확인부터 도와드리겠습니다. 성함과 생년월일 말씀해 주시겠어요?" },
      { speaker: "customer", time: "13:31", text: "정해린이고요, 90년 3월 12일이요." },
      { speaker: "agent", time: "13:32", text: "확인되었습니다. 그럼 환급률 안내드리면, 이 상품의 환급률은 100%입니다. 납입하신 금액 그대로 받으실 수 있어요." },
      { speaker: "customer", time: "13:32", text: "아 100%면 낸 거 다 받는 거네요? 손해는 안 보겠네요." },
      { speaker: "agent", time: "13:33", text: "네 맞습니다. 해지하시면 100% 환급되십니다." },
      { speaker: "customer", time: "13:33", text: "알겠습니다. 그럼 좀 더 생각해보고 다시 연락드릴게요." },
      { speaker: "agent", time: "13:34", text: "네 고객님, 추가로 궁금하신 점 있으시면 언제든 연락 주세요. 감사합니다." },
    ],
    references: [
      { type: "약관", label: "종신보험 약관 제22조(환급률)", excerpt: "본 상품의 환급률은 가입 후 5년 경과 시 80%, 10년 경과 시 100%이며, 경과 연수에 따라 차등 적용된다." },
      { type: "업무기준", label: "내규 5장 3절(환급률 안내 기준)", excerpt: "상담사는 환급률 안내 시 고객의 가입 경과 연수를 반드시 확인하고, 해당 시점의 환급률을 정확히 안내해야 한다. 100%로 일괄 안내하는 것은 금지된다." },
    ],
    processing: [
      { item: "본인확인", status: "수행", location: "발화 #3", expectedScript: "성함과 생년월일을 말씀해 주시겠어요?" },
      { item: "해지 문의 안내 시 보장 종료·재가입 제한 고지", status: "미수행", location: "미수행", expectedScript: "해지 시 보장이 종료되고 재가입에 제한이 있을 수 있습니다." },
      { item: "해지 환급금 안내", status: "안내 완료", location: "발화 #5" },
    ],
    audit: [
      { id: "g", label: "오안내 여부(안내 정확성)", result: "위반", note: "가입 5년 경과 환급률을 100%로 안내했으나 약관상 80%이므로 오안내(환급률 과다 안내)." },
      { id: "w", label: "업무 누락 여부", result: "위반", note: "해지 문의 안내 시 보장 종료·재가입 제한 고지가 누락되었습니다." },
    ],
  },
}

// 검수 완료 후 — 담당 상담사 과거 이력 기반 패턴 분석/재발방지 액션(데모: 상담건 id 기준)
interface AgentPattern {
  windowLabel: string
  totalCalls: number
  flaggedCalls: number
  topMissed: { item: string; count: number }[]
  history: { date: string; callId: string; missing: string; verdict: string; reeducation: boolean }[]
  actions: { label: string; desc: string; tone: "warn" | "info" }[]
}
const AGENT_PATTERN_OVERRIDES: Record<string, AgentPattern> = {
  // 정해린 1차(가입 상담) 담당 상담사의 최근 패턴 — 본인확인/동의 절차 반복 누락
  "CL-20260506-073": {
    windowLabel: "최근 3개월",
    totalCalls: 38,
    flaggedCalls: 4,
    topMissed: [
      { item: "본인확인 멘트", count: 3 },
      { item: "제3자 동의", count: 2 },
      { item: "인출 동의", count: 1 },
    ],
    history: [
      { date: "2026-04-15", callId: "K20260415-K087", missing: "본인확인", verdict: "확정 · 재교육 대상", reeducation: true },
      { date: "2026-03-20", callId: "K20260320-K042", missing: "-", verdict: "정상 처리", reeducation: false },
      { date: "2026-02-08", callId: "K20260208-K025", missing: "녹취 고지, 수집 동의", verdict: "확정 · 재교육 대상", reeducation: true },
    ],
    actions: [
      { label: "재발방지 점검 등록", desc: "본인확인 멘트 누락이 3개월 내 3회 반복 — 재발방지 체크리스트에 등록", tone: "warn" },
      { label: "재교육 대상 지정", desc: "신규 가입 매뉴얼 중 본인확인·제3자·인출 동의 절차 집중 재교육 권장", tone: "warn" },
      { label: "코칭 메모 전달", desc: "다음 가입 상담 전 본인확인 절차 리마인드 메모 자동 발송", tone: "info" },
    ],
  },
}

// 안내 검수 완료 후 — 오안내 정정(고객 안내 발송) + 상담사 교육 등 후속 조치
interface GuideFollowup {
  correction: { channel: string; summary: string; draft: string }
  actions: { label: string; desc: string; tone: "warn" | "info" }[]
}
const GUIDE_FOLLOWUP_OVERRIDES: Record<string, GuideFollowup> = {
  // 정해린 2차(환급률 오안내) — 고객 정정 안내 + 상담사 재교육
  "CL-20260513-027": {
    correction: {
      channel: "알림톡 + 정정 콜백",
      summary: "잘못 안내된 환급률(100%)을 정정하여 가입 5년 경과 시 정확한 환급률(80%)을 고객에게 재안내",
      draft: "[제논라이프] 정해린 고객님, 앞서 안내드린 해지 환급률 관련하여 정정 안내드립니다. 가입 5년 경과 시 환급률은 80%이며, 정확한 예상 환급금은 담당 상담사가 콜백으로 안내드리겠습니다. 문의 1588-0000",
    },
    actions: [
      { label: "고객 정정 안내 발송", desc: "알림톡으로 정정 환급률(80%) 안내 발송 + 정정 콜백 예약", tone: "warn" },
      { label: "상담사 재교육 지정", desc: "환급률 안내 기준(경과 연수별 차등) 재교육 — 100% 일괄 안내 금지 강조", tone: "warn" },
      { label: "지식카드 재숙지 알림", desc: "약관 제22조·내규 5장 3절을 담당 상담사 지식카드로 푸시", tone: "info" },
    ],
  },
}

// 실시간 상담 중 관리자 코칭 이력(데모: 김민준 실시간 상담 건) — 상담 상세에 기록
const COACH_HISTORY: Record<string, { summary: string; messages: { time: string; role: "system" | "admin"; text: string }[] }> = {
  "CL-20260514-018": {
    summary: "해지환급금 안내 단계에서 박관리 관리자가 실시간 청취하며, 금액·보장 안내 정확성과 필수 고지 절차를 코칭했습니다.",
    messages: [
      { time: "10:24", role: "system", text: "박관리 관리자가 상담에 접속하였습니다." },
      { time: "10:24", role: "system", text: "상담 모니터링을 시작합니다." },
      { time: "10:24", role: "admin", text: "해지환급금 안내 시 금액·보장 안내 정확성에 유의해 주세요." },
      { time: "10:25", role: "admin", text: "해지 시 보장 종료·재가입 제한을 먼저 고지하셨네요 👍 좋습니다." },
      { time: "10:26", role: "admin", text: "예상 환급금은 경과 시점·약관대출 잔액에 따라 달라집니다. 구두는 ‘약’으로만 안내하고 정확액은 문자로 — 지금처럼 진행하세요." },
    ],
  },
}

// 데모 날짜를 오늘 기준으로 동적 관리 — 목업의 고정 날짜(ORIG_TODAY 기준)를 실제 오늘 기준으로 평행 이동
const DAY_MS = 86400000
function fmtDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }
const ORIG_TODAY = "2026-05-14" // 목업이 작성된 기준일
const REAL_TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })()
const ORIG_TODAY_MS = new Date(`${ORIG_TODAY}T00:00:00`).getTime()
// 고정 날짜 문자열 → 오늘 기준 상대 날짜로 변환(상대 간격 보존: ORIG_TODAY→오늘, ORIG_TODAY-1→어제 …)
function remapDate(orig: string): string {
  const delta = Math.round((new Date(`${orig}T00:00:00`).getTime() - ORIG_TODAY_MS) / DAY_MS)
  return fmtDate(new Date(REAL_TODAY.getTime() + delta * DAY_MS))
}
const TODAY = fmtDate(REAL_TODAY)

function buildConsultation(s: Seed): Consultation {
  const t = TEMPLATES[s.cat]
  const sd = remapDate(s.date) // 오늘 기준 동적 날짜
  const base: Consultation = {
    id: s.id,
    customer: s.customer,
    customerNo: s.no,
    date: sd,
    time: `${sd.replace(/-/g, ".")} ${s.start}~${s.end}`,
    channel: s.channel,
    topics: t.topics,
    keywords: t.keywords,
    smsSent: s.sms,
    contactRegistered: s.contact,
    transcript: t.transcript,
    status: s.review,
    sttCorrections: t.sttCorrections,
    summary: t.summary.join("\n"),
    contactTypes: t.contactTypes,
    processing: t.processing ?? t.contactTypes.map((ct) => ({ item: `${ct.title} 안내`, status: "안내 완료" })),
    references: t.references,
    smsDraft: t.smsDraft.join("\n"),
    audit: t.audit,
    audited: s.audited,
    agent: s.agent,
  }
  return { ...base, ...(AUDIT_DEMO_OVERRIDES[s.id] ?? {}) }
}

/* 오늘(센터 전체) 일괄 검수 완료 더미 100건 — 다수 상담사·고객·유형으로 분포 */
const BULK_AGENTS = ["김제나", "이수민", "박정우", "한도현", "최가람", "정유진", "강하늘", "윤지호", "서민아", "조은채", "임수호", "배정후"]
// 고객명 — 절반은 4050~60대 세대 느낌 이름, 절반은 2030대 이름 혼합
const BULK_NAMES = ["김영호", "이서아", "박정숙", "최하준", "정명자", "강경수", "윤지호", "조영순", "임도현", "한미숙", "오상철", "신복순", "권태양", "배준서", "백순자", "노아인", "문영근", "류세아", "차종근", "양세빈", "지영수", "송민규", "황말순", "고나윤", "남광수"]
const BULK_CATS: Cat[] = ["consult3", "claimDoc", "claimReceipt", "autodebit", "surrender", "lapse", "premium", "beneficiary", "address", "loan", "renewal"]
const BULK_CHANNELS = ["콜센터 인바운드", "콜센터 아웃바운드", "모바일 앱", "챗봇 이관"]
const fmtMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
// 금일 검수대기 배치 — 전 센터 다수 상담사(상담사별 본인 건도 충분히 누적) · audited여도 오늘은 검수대기
const TODAY_BULK: Seed[] = Array.from({ length: 180 }, (_, k) => {
  const n = k + 1
  const startMin = 9 * 60 + ((k * 53) % 520) // 09:00~17:40 분산(상담 마감 18시 이내)
  return {
    id: `CL-20260514-${String(1000 + n)}`,
    customer: BULK_NAMES[(k * 7) % BULK_NAMES.length],
    no: `C-${10600000 + n * 37}`,
    date: "2026-05-14",
    start: fmtMin(startMin),
    end: fmtMin(startMin + 5 + (k % 6)),
    channel: BULK_CHANNELS[k % BULK_CHANNELS.length],
    cat: BULK_CATS[(k * 3) % BULK_CATS.length],
    review: "리뷰 대기" as ReviewStatus,
    contact: k % 3 !== 0,
    sms: k % 2 === 0,
    audited: true,
    agent: BULK_AGENTS[k % BULK_AGENTS.length],
  }
})

/* 작일~6일 전(최근 7일) 일괄 검수 완료 더미 — 대량(전 센터). 날짜=200건 블록, 상담사=균등 분배 */
const PAST_DATES = ["2026-05-13", "2026-05-12", "2026-05-11", "2026-05-10", "2026-05-09", "2026-05-08"] // remapDate로 오늘−1~−6일에 매핑
const PAST_BULK: Seed[] = Array.from({ length: 1200 }, (_, k) => {
  const n = k + 1
  const d = PAST_DATES[Math.min(PAST_DATES.length - 1, Math.floor(k / 200))] // 날짜별 200건 블록
  const startMin = 9 * 60 + ((k * 31) % 520) // 09:00~17:40 분산(상담 마감 18시 이내)
  return {
    id: `CL-${d.replace(/-/g, "")}-${1000 + n}`,
    customer: BULK_NAMES[(k * 7) % BULK_NAMES.length],
    no: `C-${10700000 + n * 41}`,
    date: d,
    start: fmtMin(startMin),
    end: fmtMin(startMin + 5 + (k % 6)),
    channel: BULK_CHANNELS[k % BULK_CHANNELS.length],
    cat: BULK_CATS[(k * 3) % BULK_CATS.length],
    review: "리뷰 완료" as ReviewStatus,
    contact: k % 2 === 0,
    sms: k % 3 !== 0,
    audited: true,
    agent: BULK_AGENTS[k % BULK_AGENTS.length], // 12명 균등 → 상담사별 최근 7일 100건+
  }
})

const CONSULTATIONS: Consultation[] = [...SEEDS, ...TODAY_BULK, ...PAST_BULK].map(buildConsultation)

/* 회원 프로필 — 상담 이해를 위한 고객 단위 정보 */
interface CustomerProfile {
  grade: "우량" | "일반" | "관리"
  products: {
    name: string
    status: string
    no?: string
    figures?: { label: string; value: string }[]
    surrender?: { formula: string; breakdown: { label: string; value: string; strong?: boolean }[]; notes: string[] }
    claimDocs?: { required: string; status: "제출 완료" | "미제출" }[]
    cautions?: string[]
  }[]
  predictedNext: string
  status: string
  actions: { label: string; tone: "warn" | "info" }[]
}

const CUSTOMERS: Record<string, CustomerProfile> = {
  // 정해린 — 해지환급금 환급률 오안내(100%→80%) 정정 대상
  "C-10422190": {
    grade: "관리",
    products: [
      {
        name: "(무)제논종신보험",
        status: "정상 납입",
        no: "SL-2207-9043",
        figures: [
          { label: "월 보험료", value: "112,000원" },
          { label: "가입금액", value: "1억원" },
          { label: "경과기간", value: "5년 2개월" },
          { label: "예상 해지환급금", value: "14,736,000원 (환급률 80%)" },
        ],
        cautions: [
          "가입 5년 경과 — 약관상 환급률 80% 적용 (10년 경과 시 100%)",
          "해지 시 주계약·특약 보장 종료, 동일 조건 재가입 제한",
        ],
        surrender: {
          formula: "해지환급금 = 납입 보험료 누계 × 환급률(경과 연수별)",
          breakdown: [
            { label: "납입 보험료 누계", value: "18,420,000원" },
            { label: "적용 환급률 (5년 경과)", value: "80%" },
            { label: "예상 해지환급금", value: "14,736,000원", strong: true },
          ],
          notes: [
            "가입 5년 경과 기준 약관상 환급률은 80%이며, 10년 경과 시 100%입니다.",
            "해지 시 주계약·특약 보장이 동시에 종료되고 동일 조건 재가입이 제한될 수 있습니다.",
            "정확한 금액은 해지 신청 시점의 조회 화면 기준으로 확정됩니다.",
          ],
        },
      },
    ],
    predictedNext: "해지 진행 여부 및 예상 환급금·해지방어 상담 문의가 예상됩니다.",
    status: "가입 5년 경과 장기 유지 고객. 최근 문의 빈도가 늘어 관리 대상으로 분류됩니다.",
    actions: [
      { label: "안내 정확성에 민감한 고객 — 금액·조건은 재확인 후 안내", tone: "warn" },
      { label: "장기 유지 고객 — 관계 유지·혜택 관점으로 응대 권장", tone: "info" },
      { label: "디지털 채널(앱·문자) 이용에 익숙 — 안내문 발송 선호", tone: "info" },
    ],
  },
  "C-10294857": {
    grade: "우량",
    products: [
      {
        name: "(무)제논실손의료비보험",
        status: "청구 접수 중",
        no: "SL-2048-5521",
        figures: [
          { label: "월 보험료", value: "32,400원" },
          { label: "가입금액", value: "5,000만원" },
          { label: "갱신주기", value: "1년 (2026.03 갱신)" },
        ],
        claimDocs: [
          { required: "진료비계산서", status: "제출 완료" },
          { required: "진료비 세부내역서", status: "미제출" },
          { required: "진단서 (고액 시)", status: "미제출" },
        ],
        cautions: ["보험금 접수 진행 중 — 변경 처리 시 계약 상태 확인 필요", "갱신 안내장 발송 이력 있음"],
      },
      {
        name: "(무)제논종신보험",
        status: "정상 납입",
        no: "SL-1180-3372",
        figures: [
          { label: "월 보험료", value: "148,000원" },
          { label: "해지환급금(예상)", value: "18,420,000원" },
          { label: "경과기간", value: "8년 3개월" },
        ],
        cautions: ["과거 실효 후 부활 이력 1건", "해지환급금 문의 시 해지방어 안내 필수"],
        surrender: {
          formula: "해지환급금 = 책임준비금 − 해지공제액",
          breakdown: [
            { label: "책임준비금", value: "20,100,000원" },
            { label: "해지공제액 (미상각 신계약비)", value: "− 1,680,000원" },
            { label: "예상 해지환급금", value: "18,420,000원", strong: true },
          ],
          notes: [
            "경과기간·납입 상태에 따라 환급금은 변동될 수 있습니다.",
            "해지 시 주계약·특약 보장이 동시에 종료되며, 동일 조건 재가입이 제한될 수 있습니다.",
            "정확한 금액은 해지 신청 시점의 조회 화면 기준으로 확정됩니다.",
            "납입 10년 미만 중도 해지 시 환급률이 낮을 수 있습니다.",
          ],
        },
      },
    ],
    predictedNext: "진료비 세부내역서 제출 후 청구 심사 결과·지급 시점 재문의 가능성이 높습니다.",
    status: "보험금 청구 진행 중 · 최근 자동이체 계좌 변경. 청구 서류 보완이 핵심 이슈입니다.",
    actions: [
      { label: "진료비 세부내역서 미제출 — 제출 안내 필요", tone: "warn" },
      { label: "자동이체 변경 접수 완료 여부 확인", tone: "info" },
    ],
  },
  "C-10387442": {
    grade: "관리",
    products: [
      { name: "(무)제논종신보험", status: "납입 유예" },
      { name: "(무)제논암보험", status: "정상 납입" },
    ],
    predictedNext: "납입 유예 종료 시점과 재개 보험료, 실효 여부 문의가 예상됩니다.",
    status: "보험료 납입 부담으로 유예·실효 상담 반복. 이탈 위험 관리 대상입니다.",
    actions: [
      { label: "납입 유예 종료 도래 — 재개 안내 필요", tone: "warn" },
      { label: "실효 예방 위해 납입 방법 변경 제안 검토", tone: "info" },
    ],
  },
  "C-10455821": {
    grade: "관리",
    products: [
      { name: "(무)제논종신보험", status: "해지 검토" },
      { name: "(무)제논변액연금보험", status: "약관대출 실행" },
    ],
    predictedNext: "해지환급금 재확인 또는 해지 신청, 약관대출 상환 관련 문의가 예상됩니다.",
    status: "해지 의향 표출 + 약관대출 보유 → 해지방어 우선 대상입니다.",
    actions: [
      { label: "해지방어 상담 권장 (보장 종료·재가입 제한 고지)", tone: "warn" },
      { label: "약관대출 잔액·상환 방법 안내", tone: "info" },
    ],
  },
  "C-10478003": {
    grade: "일반",
    products: [
      { name: "(무)제논종신보험", status: "정상 납입" },
      { name: "(무)제논어린이보험", status: "정상 납입" },
    ],
    predictedNext: "수익자 변경 서류 접수·처리 완료 여부 문의가 예상됩니다.",
    status: "고객정보·수익자 변경 진행 중. 계약 상태 안정적입니다.",
    actions: [{ label: "수익자 변경 구비서류 수령 확인", tone: "info" }],
  },
  "C-10491264": {
    grade: "일반",
    products: [
      { name: "(무)제논실손의료비보험", status: "청구 접수" },
      { name: "(무)제논종신보험", status: "부활 이력" },
    ],
    predictedNext: "보험금 지급 결과 및 과거 실효 계약의 부활 가능 여부 문의가 예상됩니다.",
    status: "보험금 청구 접수 + 과거 실효·부활 이력 보유.",
    actions: [{ label: "부활 청약 가능 기간 안내", tone: "info" }],
  },
  "C-10502347": {
    grade: "일반",
    products: [
      { name: "(무)제논실손의료비보험", status: "갱신 도래" },
      { name: "(무)제논정기보험", status: "정상 납입" },
    ],
    predictedNext: "갱신 보험료 인상 폭과 보장 변경 사항에 대한 문의가 예상됩니다.",
    status: "실손 갱신 도래 — 보험료 인상 안내 및 갱신 의사 확인 대상입니다.",
    actions: [{ label: "갱신 의사 재확인 및 인상 사유 안내", tone: "warn" }],
  },
  "C-10519882": {
    grade: "일반",
    products: [
      { name: "(무)제논종신보험", status: "정상 납입" },
      { name: "(무)제논변액연금보험", status: "정상 납입" },
    ],
    predictedNext: "수익자 변경 처리 결과 및 계좌 변경 적용 확인 문의가 예상됩니다.",
    status: "수익자·계좌 변경 진행. 계약 상태 안정적입니다.",
    actions: [{ label: "수익자 변경 서류 접수 확인", tone: "info" }],
  },
  "C-10533471": {
    grade: "관리",
    products: [
      { name: "(무)제논변액연금보험", status: "약관대출 실행" },
      { name: "(무)제논종신보험", status: "해지 검토" },
    ],
    predictedNext: "약관대출 상환과 종신보험 해지 관련 문의가 예상됩니다.",
    status: "약관대출 보유 + 해지 검토 이력 → 해지방어·상환 안내 대상입니다.",
    actions: [
      { label: "해지방어 상담 권장", tone: "warn" },
      { label: "약관대출 상환 안내", tone: "info" },
    ],
  },
  "C-10548190": {
    grade: "관리",
    products: [{ name: "(무)제논종신보험", status: "납입 유예 신청" }],
    predictedNext: "납입 유예 종료 후 재개 시점과 미납분 정산 문의가 예상됩니다.",
    status: "보험료 납입 부담으로 유예 신청. 납입 재개 관리 필요합니다.",
    actions: [{ label: "납입 재개 시점 안내 및 경감 방안 검토", tone: "warn" }],
  },
  "C-10551023": {
    grade: "일반",
    products: [{ name: "(무)제논실손의료비보험", status: "청구 진행" }],
    predictedNext: "추가 서류 완비 후 청구 심사 결과 문의가 예상됩니다.",
    status: "보험금 청구 서류 보완 진행 중.",
    actions: [{ label: "구비서류 완비 여부 확인", tone: "info" }],
  },
  "C-10567744": {
    grade: "관리",
    products: [{ name: "(무)제논종신보험", status: "해지 검토" }],
    predictedNext: "해지환급금 재확인 또는 해지 신청 문의가 예상됩니다.",
    status: "해지 의향 표출 → 해지방어 대상입니다.",
    actions: [{ label: "해지방어 상담 권장 (대안 상품 제시)", tone: "warn" }],
  },
  "C-10588021": {
    grade: "일반",
    products: [{ name: "(무)제논종신보험", status: "해지 검토" }],
    predictedNext: "예상 해지환급금 재확인 및 해지 진행 여부 문의가 예상됩니다.",
    status: "해지환급금 안내 문자 발송 요청. 해지방어 여지 확인 필요합니다.",
    actions: [{ label: "해지방어 상담 권장 (보장 종료·재가입 제한 고지)", tone: "warn" }],
  },
  "C-10593344": {
    grade: "일반",
    products: [{ name: "(무)제논종신보험", status: "정상 납입" }],
    predictedNext: "약관대출 실행 절차와 이자율·상환 방법 문의가 예상됩니다.",
    status: "약관대출 한도 문의. 계약 상태 안정적입니다.",
    actions: [{ label: "약관대출 가능 한도·이자율 안내", tone: "info" }],
  },
  "C-10601287": {
    grade: "일반",
    products: [{ name: "(무)제논종신보험", status: "정상 납입" }],
    predictedNext: "수익자 변경 서류 접수·처리 완료 여부 문의가 예상됩니다.",
    status: "수익자 변경 신청 진행 중. 계약 상태 안정적입니다.",
    actions: [{ label: "수익자 변경 구비서류 수령 확인", tone: "info" }],
  },
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]
function weekdayOf(date: string): string {
  return WEEKDAYS[new Date(date).getDay()]
}

// 7일 이내면 오늘/어제/N일 전, 그 외엔 날짜 표기 (TODAY 기준)
function relativeDay(date: string): string {
  const d = Math.round((new Date(TODAY).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  if (d <= 0) return "오늘"
  if (d === 1) return "어제"
  if (d <= 7) return `${d}일 전`
  return date.replace(/-/g, ".")
}

// "YYYY.MM.DD HH:MM~HH:MM" → 통화 시간(분)
function durationMin(time: string): number {
  const range = time.slice(11) // "10:21~10:27"
  const [a, b] = range.split("~")
  const toMin = (s: string) => {
    const [h, m] = s.split(":").map(Number)
    return h * 60 + m
  }
  if (!a || !b) return 0
  return Math.max(0, toMin(b) - toMin(a))
}

// "HH:MM" → 분
const hmToMin = (hm: string) => {
  const [h, m] = hm.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

// 접촉 유형 세부 분류 — 대분류 › 중분류 › 소분류 (종속 선택)
const TAXONOMY: Record<string, Record<string, string[]>> = {
  "보험금 청구": {
    "접수 단계": ["서류 보완", "접수 확인", "서류 제출", "청구 취소"],
    "심사 단계": ["추가 서류 요청", "심사 진행 안내"],
    "지급 단계": ["지급 예정 안내", "지급 완료", "부지급 안내"],
  },
  "수금/납입": {
    자동이체: ["계좌 변경", "이체일 변경", "납부방법 변경"],
    실효: ["납입최고", "실효 예정 안내"],
    부활: ["청약 조건", "부활 절차"],
    유예: ["납입 유예"],
  },
  "계약 변경": {
    해지: ["환급금 조회", "해지 신청", "보장 종료 안내"],
    수익자: ["변경 신청"],
    고객정보: ["주소·연락처", "연락처 변경"],
    부활: ["청약 조건"],
  },
  갱신: {
    "갱신 안내": ["보험료·보장", "갱신 조건"],
  },
  대출: {
    약관대출: ["한도·이자", "상환"],
  },
}
const MAJORS = Object.keys(TAXONOMY)
const middlesOf = (major: string) => Object.keys(TAXONOMY[major] ?? {})
const minorsOf = (major: string, middle: string) => TAXONOMY[major]?.[middle] ?? []
const optsWith = (cur: string, list: string[]) => Array.from(new Set([cur, ...list]))
const SEG_COLORS = ["bg-[#005bac]", "bg-[#5b9bd5]", "bg-[#a9cdec]", "bg-[#7fc7ff]"]

// 초안 톤 — 칩 선택 시 프롬프트에 채워지는 지시문 + 톤별 샘플 초안(데모: 김민준 CL-20260514-018)
const TONE_PROMPT: Record<string, string> = {
  "CX 톤 반영": "고객 친화적인 CX 톤으로 따뜻하고 명확하게 안내해줘",
  "정중하게": "격식을 갖춘 정중한 존댓말로 안내해줘",
  "간결하게": "핵심만 간결하게 요약해서 안내해줘",
  "핵심만 3줄": "가장 중요한 내용만 3줄 이내로 요약해줘",
}
// "CX 톤 반영"은 기존(원본) 초안 data.smsDraft 을 그대로 사용 → TONE_SAMPLE 미등록 시 폴백
const TONE_SAMPLE: Record<string, string> = {
  정중하게: [
    "[제논라이프] 상담 안내드립니다",
    "김민준 고객님, 금일 상담해 주신 내용에 대해 정중히 안내드립니다.",
    "1) 보험금 청구 — 진료비 세부내역서가 미제출 상태이오니, 병원 원무과에서 발급 후 제논라이프 앱으로 제출하여 주시기 바랍니다. (서류 완비 시 통상 3영업일 이내 심사)",
    "2) 자동이체 — 본인 명의 계좌로 변경이 가능하며, 출금일 5영업일 전 신청 시 당월분부터 적용됩니다.",
    "3) 해지환급금 — (무)제논종신보험 기준 예상 18,420,000원이며, 해지 시 보장이 종료되는 점 유의하여 주시기 바랍니다.",
    "감사합니다.",
  ].join("\n"),
  간결하게: [
    "[제논라이프] 상담 안내",
    "김민준님, 안내드립니다.",
    "· 진료비 세부내역서 추가 제출 필요 (앱 제출, 3영업일 심사)",
    "· 자동이체: 본인 명의 계좌, 출금 5영업일 전 신청 시 당월 적용",
    "· 종신 해지환급금 예상 18,420,000원 (해지 시 보장 종료)",
    "감사합니다.",
  ].join("\n"),
  "핵심만 3줄": [
    "[제논라이프] 김민준님 안내",
    "① 진료비 세부내역서 앱 제출 → 3영업일 심사  ② 자동이체 본인명의·출금 5영업일 전 당월적용  ③ 종신 해지환급금 예상 18,420,000원(해지 시 보장종료)",
    "자세한 사항은 회신 또는 1588-XXXX로 문의 바랍니다.",
  ].join("\n"),
}
function draftForTone(d: Consultation, tone: string): string {
  if (d.id === "CL-20260514-018" && TONE_SAMPLE[tone]) return TONE_SAMPLE[tone]
  // 정해린 — 오안내(환급률) 정정 + 누락 고지(보장 종료·재가입 제한) 반영 재안내 문자(재생성 결과)
  if (d.id === "CL-20260513-027") return HAERIN_CORRECTED_SMS
  return d.smsDraft
}

// 발췌 근거 → A4/PDF형 서류 목업 본문 생성 (excerpt가 강조 표시됨)
function refDoc(ref: Reference): { docNo: string; revised: string; sections: { heading: string; lines: string[] }[] } {
  if (ref.type === "약관") {
    return {
      docNo: "DOC-약관-2024-12",
      revised: "2024.01.01 개정",
      sections: [
        { heading: "제1조 (목적)", lines: ["이 약관은 보험계약자와 회사 간의 권리·의무 및 보험금의 지급에 관한 사항을 정함을 목적으로 합니다."] },
        { heading: ref.label, lines: [ref.excerpt, "제출된 서류가 미비한 경우 회사는 서류 보완을 요청할 수 있으며, 보완에 소요되는 기간은 보험금 지급기일 산정에서 제외됩니다.", "증빙 서류의 종류 및 세부 기준은 보장 항목과 청구 유형에 따라 달리 적용될 수 있습니다."] },
        { heading: "제13조 (보험금의 지급절차)", lines: ["회사는 청구서류를 접수한 날부터 약관에서 정한 기일 이내에 보험금을 지급합니다.", "지급기일을 초과하는 경우 약관에 따른 지연이자를 더하여 지급합니다."] },
      ],
    }
  }
  if (ref.type === "구비서류") {
    return {
      docNo: "DOC-서류안내-2024-03",
      revised: "2024.03.02 개정",
      sections: [
        { heading: "1. 기본 구비서류", lines: ["보험금 청구서 (회사 소정 양식)", "청구인 신분증 사본", ref.excerpt] },
        { heading: "2. 추가 구비서류", lines: ["고액·특정 질환 청구 시: 진단서 또는 소견서", "사고 관련 청구 시: 사고사실확인원 등"] },
        { heading: "3. 제출 방법", lines: ["모바일 앱(추가서류 제출 메뉴), 팩스, 영업점 방문 중 선택하여 제출", "서류 완비 시 통상 3영업일 이내 심사가 진행됩니다."] },
      ],
    }
  }
  return {
    docNo: "DOC-업무지침-2024-08",
    revised: "2024.02.15 개정",
    sections: [
      { heading: "1. 목적", lines: ["본 지침은 관련 업무의 일관된 처리 기준을 정하여 정확하고 신속한 상담·처리를 지원함을 목적으로 한다."] },
      { heading: "2. 처리 기준", lines: [ref.excerpt, "신청 시점 및 계약 상태에 따라 적용일이 달라질 수 있으므로, 처리 전 계약 상태를 반드시 확인한다."] },
      { heading: "3. 유의사항", lines: ["보험금 접수·심사 진행 중인 계약은 일부 변경 처리가 제한될 수 있다.", "처리 결과는 고객에게 안내하고 처리 시스템에 기록한다."] },
    ],
  }
}

// 유형별 요약 초안 본문(게시판/메일형) 생성
function deriveDraftBody(t: ContactType): string {
  if (t.draftBody) return t.draftBody
  if (t.draftFields?.length) return t.draftFields.map((f) => `[${f.label}] ${f.value}`).join("\n")
  if (t.draft) return `[고객 문의] ${t.title}\n- ${t.draft}`
  return `[고객 문의] ${t.title}\n- `
}

/* ================================================================== */
/* Main                                                                */
/* ================================================================== */

type PeriodKey = "today" | "7d" | "30d" | "all"
const PERIODS: { id: PeriodKey; label: string; cutoff?: string }[] = [
  { id: "today", label: "오늘", cutoff: TODAY },
  { id: "7d", label: "최근 7일", cutoff: remapDate("2026-05-07") },
  { id: "30d", label: "최근 30일", cutoff: remapDate("2026-04-14") },
  { id: "all", label: "전체 (3년)" },
]
type ReviewFilter = "all" | "waiting" | "done"

// 품질검수 후속조치(정해린)로 생성되는 새 상담 이력 — 오늘자 후속 재안내 콜/문자 기록
const FOLLOWUP_BASE_ID = "CL-20260513-027"
const FOLLOWUP_REC_ID = `${FOLLOWUP_BASE_ID}-t01` // 부모건(027)을 참조하는 후속 이력(원장 관리식)
// 조치완료 더미 건의 후속 이력 번호(정해린 외) — 부모건-t01 형식, 표시용 더미(클릭 이동 없음)
function dummyFollowupId(c: Consultation): string {
  return `${c.id}-t01`
}
// 상담이력조회 필터 — 세션 내 유지(첫 진입만 역할 기본값, 이후 마지막 조작 필터로 복귀)
type PcFilter = { period?: PeriodKey; review?: ReviewFilter; view?: "call" | "agent" | "customer"; agentFilter?: string; centerFilter?: string }
function readPcFilter(): PcFilter | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(window.sessionStorage.getItem("genon:pc:filter") || "null") } catch { return null }
}
const FOLLOWUP_TRANSCRIPT: { speaker: "agent" | "customer"; time: string; text: string }[] = [
  { speaker: "agent", time: "17:52", text: "안녕하세요, 제논라이프 상담사 김제나입니다. 정해린 고객님 되실까요? 지난 5월 13일 해지환급금 상담 건 관련해 정정 안내차 연락드렸습니다." },
  { speaker: "customer", time: "17:52", text: "네, 맞아요. 무슨 일이시죠?" },
  { speaker: "agent", time: "17:53", text: "앞선 상담에서 해지환급금 환급률을 100%로 안내드렸는데, 확인 결과 가입 5년 경과 기준 약관상 80%가 정확합니다. 잘못 안내드린 점 사과드립니다." },
  { speaker: "customer", time: "17:54", text: "아, 제가 들었던 거랑 다르네요. 그럼 환급금이 줄어드는 거예요?" },
  { speaker: "agent", time: "17:55", text: "네, 정정된 80% 기준으로 안내드리며, 해지 시 보장이 종료되고 동일 조건의 재가입이 제한될 수 있다는 점도 함께 안내드립니다. 정확한 예상 환급금은 문자로 다시 보내드리겠습니다." },
  { speaker: "customer", time: "17:56", text: "알겠습니다. 정정해서 다시 알려줘서 고마워요." },
  { speaker: "agent", time: "17:57", text: "이용에 불편을 드려 죄송합니다. 정정 내용은 문자로도 발송해 드리겠습니다. 추가 문의는 1588-0000으로 연락 주세요. 감사합니다." },
]
// followup(localStorage) 의 후속조치 완료 여부로 새 이력을 동적으로 생성
function buildFollowupRecord(fu?: Followup): Consultation | null {
  if (!fu?.actionDone) return null
  const items = fu.actionItems ?? []
  const sentSms = !!fu.smsSent || items.some((it) => /문자|SMS/.test(it))
  const base = buildConsultation({
    id: FOLLOWUP_REC_ID,
    customer: "정해린",
    no: "C-10422190",
    date: ORIG_TODAY, // buildConsultation의 remapDate를 거쳐 실제 오늘로 매핑
    start: "17:52", // 금일 더미 최대 시각(~17:50) 직후, 상담 마감 18시 이내 → 오늘 목록 최상단
    end: "17:58",
    channel: "콜센터 아웃바운드",
    cat: "surrender",
    review: "리뷰 완료",
    contact: true,
    sms: sentSms,
    agent: "김제나",
  })
  return {
    ...base,
    topics: ["해지환급금 재안내"],
    keywords: ["환급률 정정", "보장 종료 고지", "재가입 제한"],
    summary: "앞선 해지환급금 안내의 환급률 오안내(100%→80%)를 정정하고, 보장 종료·재가입 제한을 재안내함.",
    transcript: FOLLOWUP_TRANSCRIPT,
    smsSent: sentSms, // 방금 발송한 정정 문자 → 발송완료
    contactRegistered: false, // 접촉이력은 등록한 적 없음
    smsDraft: fu.smsText || HAERIN_CORRECTED_SMS,
  }
}

export function PostConsultationView() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <PostConsultationInner />
    </Suspense>
  )
}

function PostConsultationInner() {
  const sp = useSearchParams()
  const task = sp.get("task") // null(이력 조회) | contact | sms | audit
  const idParam = sp.get("id") // 상담이력에서 선택해 진입한 상담 건
  const auditParam = sp.get("audit") // guide | task — 검수 진입 시 기본 탭
  const fromAudit = sp.get("from") === "audit" // 상담 품질검수 후속조치로 진입 → 정정 재생성 시나리오
  const viewParam = sp.get("view") // 후속 이력 진입 시 자동으로 펼칠 후속작업(sms/contact)
  const [selectedId, setSelectedId] = useState(CONSULTATIONS[0].id)
  const [period, setPeriod] = useState<PeriodKey>(() => readPcFilter()?.period ?? "today") // 세션 저장 필터 우선, 없으면 오늘
  const [view, setView] = useState<"call" | "agent" | "customer">(() => readPcFilter()?.view ?? "call")
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>(() => readPcFilter()?.review ?? "all")
  const [aiFilter, setAiFilter] = useState<"all" | "통과" | "감지">("all") // AI 1차 검수 필터(독립)
  const [humanFilter, setHumanFilter] = useState<AdminState | "all">("all") // 휴먼 2차 검수 필터(독립)
  const [role, setRole] = useState<"agent" | "admin">("agent")
  const [agentFilter, setAgentFilter] = useState(() => readPcFilter()?.agentFilter ?? "전체") // 관리자: 센터 전체 상담사 필터
  const [centerFilter, setCenterFilter] = useState(() => readPcFilter()?.centerFilter ?? "전체") // 관리자: 센터별 필터
  // 역할 설정 + '세션 최초 진입'에만 역할 기본 필터 적용(이후엔 저장된 마지막 필터 유지)
  useEffect(() => {
    try {
      const isAdmin = localStorage.getItem("genon:role") === "admin"
      if (isAdmin) setRole("admin")
      const firstThisSession = !window.sessionStorage.getItem("genon:pc:seen")
      window.sessionStorage.setItem("genon:pc:seen", "1")
      if (firstThisSession) {
        if (isAdmin) { setReviewFilter("done"); setPeriod("7d") } else { setReviewFilter("all"); setPeriod("today") }
      }
    } catch { /* 데모 */ }
  }, [])
  // 조작한 필터를 세션에 저장 → 재진입 시 마지막 화면으로 복귀
  useEffect(() => {
    try { window.sessionStorage.setItem("genon:pc:filter", JSON.stringify({ period, review: reviewFilter, view, agentFilter, centerFilter })) } catch { /* 데모 */ }
  }, [period, reviewFilter, view, agentFilter, centerFilter])
  const ME = "김제나" // 로그인 상담사

  // 후속조치(localStorage) 로드 → 정해린 조치완료 시 새 상담 이력을 동적으로 데이터셋에 병합
  const [followupAll, setFollowupAll] = useState<Record<string, Followup>>({})
  // 데모 초기화는 /post-consultation '첫 진입' 시점(부모)에서 최우선 실행 → 접촉이력 등록 화면에 먼저 들어가 등록해도 지워지지 않도록
  useEffect(() => { resetDemoFollowupOnce(); setFollowupAll(readAllFollowups()) }, [])
  // 화면 전환(task/id 변경)·창 포커스 시 후속조치 상태 재로딩 → 조치 완료 시 새 이력 즉시 반영
  useEffect(() => { setFollowupAll(readAllFollowups()) }, [task, idParam])
  useEffect(() => {
    const load = () => setFollowupAll(readAllFollowups())
    const onVis = () => { if (document.visibilityState === "visible") load() }
    window.addEventListener("focus", load)
    window.addEventListener("pageshow", load)
    window.addEventListener("genon:followup-changed", load)
    window.addEventListener("storage", load)
    document.addEventListener("visibilitychange", onVis)
    return () => { window.removeEventListener("focus", load); window.removeEventListener("pageshow", load); window.removeEventListener("genon:followup-changed", load); window.removeEventListener("storage", load); document.removeEventListener("visibilitychange", onVis) }
  }, [])
  const followupRec = buildFollowupRecord(followupAll[FOLLOWUP_BASE_ID])
  const DATASET = followupRec ? [followupRec, ...CONSULTATIONS] : CONSULTATIONS

  const selected = DATASET.find((c) => c.id === idParam) ?? DATASET.find((c) => c.id === selectedId) ?? DATASET[0]
  const cutoff = PERIODS.find((p) => p.id === period)?.cutoff
  const q = query.trim()

  const filtered = DATASET.filter((c) => (period === "today" ? c.date === TODAY : !cutoff || c.date >= cutoff))
    .filter((c) => !startDate || c.date >= startDate)
    .filter((c) => !endDate || c.date <= endDate)
    // 상담사 뷰: 본인 상담만 / 관리자 뷰: 센터 전체 + 센터·상담사 필터
    .filter((c) => (role === "admin" ? (centerFilter === "전체" || consultCenter(c) === centerFilter) : true))
    .filter((c) => (role === "admin" ? (agentFilter === "전체" || consultAgent(c) === agentFilter) : consultAgent(c) === ME))
    .filter((c) => {
      if (reviewFilter === "all") return true
      const waiting = reviewOf(c).ai === "검수중" // AI 검수 대기(오늘 일괄 검수 전)
      return reviewFilter === "waiting" ? waiting : !waiting
    })
    // AI 1차 · 휴먼 2차 검수 — 각각 독립 필터
    .filter((c) => {
      if (aiFilter === "all" && humanFilter === "all") return true
      const rv = effAdminOf(reviewOf(c), followupAll[c.id])
      if (aiFilter !== "all" && rv.ai !== aiFilter) return false
      // 표시되는 휴먼검수 상태 기준(관리자에겐 미검토 건이 '검토필요')
      const effA = role === "admin" && rv.pending ? "검토필요" : rv.admin
      if (humanFilter !== "all" && effA !== humanFilter) return false
      return true
    })
    .filter((c) => !q || c.customer.includes(q) || c.id.includes(q) || c.topics.some((t) => t.includes(q)) || c.keywords.some((k) => k.includes(q)))
    // 검수완료에서 데모(정해린) 최상단 고정 → 그 외 날짜·시간 최신순
    .sort((a, b) => {
      if (reviewFilter === "done") {
        const demo = "CL-20260513-027"
        if (a.id === demo && b.id !== demo) return -1
        if (b.id === demo && a.id !== demo) return 1
      }
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return a.time < b.time ? 1 : a.time > b.time ? -1 : 0
    })

  // 페이지네이션 — 15건씩
  const PER = 15
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER))
  const safePage = Math.min(page, pageCount - 1)
  const paged = filtered.slice(safePage * PER, safePage * PER + PER)
  // 필터·뷰 변경 시 첫 페이지로
  useEffect(() => { setPage(0) }, [query, period, reviewFilter, agentFilter, centerFilter, view, startDate, endDate])

  // 그룹 — 고객별 / 상담사별 (현재 페이지 기준)
  const groups: { key: string; label: string; sub: string; calls: Consultation[] }[] = []
  paged.forEach((c) => {
    const key = view === "agent" ? consultAgent(c) : c.customerNo
    let g = groups.find((x) => x.key === key)
    if (!g) { g = { key, label: view === "agent" ? consultAgent(c) : c.customer, sub: view === "agent" ? "" : c.customerNo, calls: [] }; groups.push(g) }
    g.calls.push(c)
  })

  // 기본(이력 조회): 테이블 중심 풀와이드 탐색 화면
  if (task === null) {
    return (
      <HistoryExplorer
        filtered={paged}
        groups={groups}
        total={filtered.length}
        page={safePage}
        pageCount={pageCount}
        setPage={setPage}
        selected={selected}
        selectedId={selectedId}
        onSelect={setSelectedId}
        period={period}
        setPeriod={setPeriod}
        query={query}
        setQuery={setQuery}
        view={view}
        setView={setView}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        reviewFilter={reviewFilter}
        setReviewFilter={setReviewFilter}
        agentFilter={agentFilter}
        setAgentFilter={setAgentFilter}
        centerFilter={centerFilter}
        setCenterFilter={setCenterFilter}
        aiFilter={aiFilter}
        setAiFilter={setAiFilter}
        humanFilter={humanFilter}
        setHumanFilter={setHumanFilter}
        autoOpenId={idParam}
        autoView={viewParam}
      />
    )
  }

  // 하위 작업(접촉이력/SMS/검수): 선택된 상담의 작업 상세 (풀와이드) — 상담 이력 조회로 복귀
  // 통합 상단 바(h-14 = 56px)를 제외한 뷰포트 높이로 고정 → 페이지 스크롤 방지
  return (
    <div className="flex h-[calc(100vh-34px)] min-h-0 overflow-hidden bg-[#f1f5fb]">
      {task === "audit-result" ? (
        <AuditResultView key={selected.id} data={selected} />
      ) : (
        <Detail key={`${selected.id}-${task}-${auditParam ?? ""}-${fromAudit ? "audit" : ""}`} data={selected} task={task} initialAuditTab={auditParam === "task" ? "task" : "guide"} fromAudit={fromAudit} />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  const tone = status === "리뷰 완료" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
  return <Badge variant="outline" className={cn("h-4 px-1.5 text-[9px]", tone)}>{status}</Badge>
}


/* ================================================================== */
/* 상담 검수 결과 — 안내검수·업무검수를 탭 구분 없이 하나로 통합 표시        */
/* ================================================================== */
function AuditResultView({ data }: { data: Consultation }) {
  // reviewOf를 권위로 검수 결과를 구성 — 목록 상태(감지/통과)와 상세 화면을 항상 일치시킴
  const rvBase = reviewOf(data)
  const detected = rvBase.ai === "감지"
  const guideN = rvBase.guideN
  const workN = rvBase.workN
  const clean = !detected
  const sevVerdict: AuditVerdict = rvBase.severity === "경미" ? "주의" : "위반"
  const tg = guideAuditOf(data) // 템플릿 검수 노트(있으면 사용, 없으면 합성)
  const tw = workAuditOf(data)
  const g = {
    verdict: (guideN > 0 ? (tg.verdict !== "정상" ? tg.verdict : sevVerdict) : "정상") as AuditVerdict,
    note: guideN > 0 ? (tg.verdict !== "정상" ? tg.note : "AI 검수 결과 약관·업무기준과 다른 안내(오안내)가 감지되었습니다.") : tg.note,
  }
  const w = {
    verdict: (workN > 0 ? (tw.verdict !== "정상" ? tw.verdict : sevVerdict) : "정상") as AuditVerdict,
    note: workN > 0 ? (tw.verdict !== "정상" ? tw.note : "AI 검수 결과 필수 안내·고지 항목의 누락이 감지되었습니다.") : tw.note,
    missing: tw.missing,
  }
  // 판정별 대표 헤드라인(중복 없이 케이스를 요약)
  const gHead = g.verdict === "정상" ? "오안내 없음 · 안내 정확" : g.verdict === "위반" ? "환급률 오안내 확인" : "안내 정확성 주의 · 재확인 필요"
  const wHead = w.verdict === "정상" ? "필수 안내 정상 수행" : w.verdict === "위반" ? "필수 고지 누락 확인" : "안내 절차 주의 · 재확인 필요"
  const insight = clean
    ? "검출된 오안내·안내 누락이 없어 별도 후속 조치가 필요하지 않습니다."
    : `${[guideN > 0 ? "환급률 오안내" : null, workN > 0 ? "필수 고지 누락" : null].filter(Boolean).join(" 및 ")}이(가) 확인되어 고객 재안내·정정 조치가 권고됩니다.`
  const missCount = data.processing.filter((p) => p.status.includes("대기") || p.status.includes("미")).length
  const [previewRef, setPreviewRef] = useState<Reference | null>(null)
  const [auditTab, setAuditTab] = useState<"guide" | "work">("guide") // 오안내/안내 누락 밑줄 탭
  // 후속조치(localStorage) 반영 — 조치완료/검토완료 상태를 검수결과 화면에도 반영
  const [followup, setFollowup] = useState<Followup>({})
  useEffect(() => {
    const load = () => { try { setFollowup(readAllFollowups()[data.id] ?? {}) } catch { /* 데모 */ } }
    load()
    window.addEventListener("genon:followup-changed", load)
    window.addEventListener("focus", load)
    return () => { window.removeEventListener("genon:followup-changed", load); window.removeEventListener("focus", load) }
  }, [data.id])
  // 휴먼(2차) 검수 — 관리자 분류 상태(후속조치 진행 반영)
  const admin = effAdminOf(reviewOf(data), followup).admin // "검수완료" | "필요" | "완료" | "이관" | null
  const actionOptions: { label: string; desc: string; icon: ComponentType<{ className?: string }> }[] = [
    { label: "재안내 전화", desc: "정정 내용 유선 재안내 + 콜백 예약", icon: PhoneCall },
    { label: "정정 문자 발송", desc: "정정 내용 SMS 발송", icon: MessageSquare },
  ]
  // 관리자가 AI 검수 결과를 검토해 위반 사항과 기준을 재고지하는 검토 의견(상담사 열람용)
  const HUMAN_COMMENT: Record<string, string> = {
    "CL-20260513-027": "AI 검수 결과 검토 결과, 가입 5년 경과 고객에게 환급률을 100%로 안내한 것은 약관상 80% 기준에 위배되며, 해지 문의 안내 시 보장 종료·재가입 제한 고지가 누락된 것이 확인됩니다. 고객에게 정정 환급률(80%) 재안내가 필요하며, 환급률 안내 시 가입 경과 연수 확인 절차를 준수해야 합니다.",
    "CL-20260513-097": "AI 검수에서 감지된 오안내 2건을 검토한 결과 안내 오류가 확인되어 고객 정정 안내를 완료하였습니다. 안내 전 약관 수치 확인 절차의 준수가 요구됩니다.",
    "CL-20260512-070": "AI 검수에서 감지된 오안내 및 필수 고지 누락을 검토한 결과 모두 사실로 확인되어 고객 정정 안내와 정정 문자 발송을 완료하였습니다. 안내 정확성과 필수 고지 절차 준수가 요구됩니다.",
    "CL-20260512-066": "AI 검수에서 감지된 안내 누락 항목에 대한 추가 확인이 필요하여 담당자로 이관 처리하였습니다.",
  }
  // 검토필요(휴먼검수 전)은 아직 코멘트가 작성되지 않은 백지 상태 / 판정별 기본 코멘트
  const adminComment = reviewOf(data).pending
    ? ""
    : (HUMAN_COMMENT[data.id] ?? (
        clean ? "검출된 오안내·안내 누락이 없어 별도 조치가 필요하지 않습니다."
        : reviewOf(data).admin === "이관" ? "사실관계 추가 확인과 보상·배상 범위 판단이 필요하여 고객서비스부로 이관하여 후속 처리합니다. 이관 부서의 검토 결과에 따라 고객 회신이 진행됩니다."
        : reviewOf(data).admin === "검수완료" ? "AI 검수에서 감지된 항목을 검토한 결과 안내상 중대한 오류로 보기 어려워 추가 조치 없이 검토 완료 처리합니다. 동일 유형 안내 시 기준 준수를 권고합니다."
        // 조치 필요/완료 — 담당 상담사에게 직접 전달하는 업무지시(조치 필요 시점 작성, 이후 갱신 없음)
        : "감지된 오안내·안내 누락 사항을 확인하고 고객에게 정정 내용을 재안내해 주세요. 안내 시 약관 기준과 가입 경과 연수를 반드시 확인하고, 처리 후 접촉이력에 결과를 남겨 주세요."
      ))
  // 관리자 휴먼 검수 입력 — 판정 선택 + 코멘트 작성 + 후속 조치 선택
  const STATUS_OPTS: { key: AdminState; label: string }[] = [
    { key: "필요", label: "후속 조치 필요" },
    { key: "이관", label: "고객서비스 이관" },
  ]
  const [humanStatus, setHumanStatus] = useState<AdminState>(reviewOf(data).pending ? "검토필요" : (admin ?? "검토필요"))
  const [comment, setComment] = useState(adminComment)
  const [actSel, setActSel] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  // 로그인 역할 — 관리자: 직접 코멘트 작성·조치 선택 / 상담사: 결과 열람(읽기 전용)
  const [role, setRole] = useState<"agent" | "admin">("agent")
  useEffect(() => { try { if (localStorage.getItem("genon:role") === "admin") setRole("admin") } catch { /* 데모 */ } }, [])
  // 후속조치 — 상담사가 audit-result에서 직접 처리(실제 화면 이동 + 이력 기록)
  const wdRouter = useRouter()
  const actedItems = followup.actionItems ?? []
  const wdAct = (item: string) => {
    const isCall = /전화|상담/.test(item)
    const isSms = /문자|SMS/.test(item)
    // 재안내 전화/정정 문자는 실제 완료 시점(통화 종료 / 문자 발송)에만 기록 → 클릭 시엔 이동만(그래야 '나갔을 때만' 표기됨)
    if (!isCall && !isSms) {
      const prev = readAllFollowups()[data.id] ?? {}
      const items = [...new Set([...(prev.actionItems ?? []), item])]
      writeFollowup(data.id, { actionDone: true, actionAt: prev.actionAt ?? new Date().toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }), actionItems: items })
    }
    wdRouter.push(isSms ? `/post-consultation?task=sms&id=${data.id}&from=audit` : isCall ? `/insight-chat?agent=assistant&feature=counseling${data.id === "CL-20260513-027" ? "&case=haerin" : ""}` : `/post-consultation?task=contact&id=${data.id}`)
  }
  // 헤더 상태 — 후속조치 완료 시 'admin'(완료/검수완료)이 우선, 그 외엔 관리자 수동 판정(humanStatus)
  const dispStatus: AdminState | null = role === "admin" ? (followup.actionDone ? admin : humanStatus) : (actedItems.length ? "완료" : admin)
  // 검토 완료 및 종결 상태 — 관리자가 종결했거나 이미 검토완료된 건
  const closed = saved || !!followup.adminClosed || dispStatus === "검수완료"
  // 조치완료 건은 종결 후에도 '상담사 조치 내역' 패널을 그대로 박제
  const showActed = admin === "완료" || (closed && !!followup.actionDone)
  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-[#f1f5fb]">
      {/* 상단 바 — 고객 정보 한눈에(접촉이력·SMS 화면과 동일 톤) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#dbe5f1] bg-white px-5 py-2.5">
        <Link href="/post-consultation" className="inline-flex items-center gap-1 rounded-md border border-[#dbe5f1] bg-white px-2 py-1 text-[11px] font-medium text-[#0b4f91] transition-colors hover:bg-[#f2f8ff]">← 상담 이력 조회</Link>
        <div className="h-7 w-px bg-[#e2eaf4]" />
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#005bac]/10 text-[#005bac]"><UserRound className="h-4 w-4" /></div>
          <div className="leading-tight">
            <div className="text-[13px] font-bold text-[#10233f]">{data.customer} 고객님</div>
            <div className="text-[10.5px] text-muted-foreground">{data.customerNo} · {data.channel} · {data.time}</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md border border-[#bad6f4] bg-[#f2f8ff] px-2 py-1 text-[10.5px] text-[#0b4f91]"><PhoneCall className="h-3.5 w-3.5" /> 상담 ID {data.id}</span>
          <span className="inline-flex items-center gap-1 rounded-md border border-[#dbe5f1] bg-white px-2 py-1 text-[10.5px] text-[#33445c]"><FileCheck2 className="h-3.5 w-3.5 text-[#0b4f91]" /> 검토자 <span className="font-semibold text-[#10233f]">박관리</span></span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700"><CheckCircle2 className="h-3 w-3" /> 관리자 2차 검토 완료</span>
        </div>
      </div>

      {/* 좌: 상담 대화 / 우: 통합 검수 결과 */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* 좌측: 상담 대화 */}
        <div className="flex min-h-0 flex-col border-r border-[#d4e0ef] bg-white">
          <div className="shrink-0 border-b border-[#e2eaf4] px-4 py-2.5 text-[11px] font-bold text-[#0b4f91]">
            <span className="inline-flex items-center gap-1.5"><PhoneCall className="h-3.5 w-3.5" /> 상담 대화 <span className="font-normal text-muted-foreground">· {data.time}</span></span>
          </div>
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-8 py-4">
            {data.transcript.map((s, i) => {
              const isCustomer = s.speaker === "customer"
              return (
                <div key={i} className={cn("flex gap-2", isCustomer ? "justify-start" : "justify-end")}>
                  {isCustomer ? <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e3ebf4] text-muted-foreground"><User className="h-3.5 w-3.5" /></div> : null}
                  <div className={cn("flex max-w-[80%] flex-col gap-0.5", isCustomer ? "items-start" : "items-end")}>
                    <span className="text-[9px] text-muted-foreground">{isCustomer ? "고객" : "상담사"} · {s.time}</span>
                    <p className={cn("rounded-2xl px-3 py-1.5 text-[11.5px] leading-5", isCustomer ? "rounded-bl-sm border border-[#e2eaf4] bg-white text-[#10233f]" : "rounded-br-sm bg-[#005bac] text-white")}>{s.text}</p>
                  </div>
                  {!isCustomer ? <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#005bac]/10 text-[#005bac]"><Headphones className="h-3.5 w-3.5" /></div> : null}
                </div>
              )
            })}
          </div>
        </div>

        {/* 우측: 안내·업무 통합 결과 */}
        <div className="flex min-h-0 flex-col bg-white">
          <div className="shrink-0 border-b border-[#e2eaf4] px-[72px] py-2.5 text-[11px] font-bold text-[#0b4f91]">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> 상담 내역 검수 결과</span>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-[72px] py-5">
            {/* 종합 — 내용 유지, 폰트·여백 최소화 */}
            <div className={cn("rounded-lg border px-2.5 py-2", clean ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50")}>
              <div className="flex items-center gap-1.5">
                {clean ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}
                <span className="text-[11px] font-bold text-[#10233f]">AI 검수 종합</span>
                <span className="ml-auto flex items-center gap-1">
                  {clean ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-px text-[9px] font-medium text-emerald-700">통과</span>
                  ) : (
                    <>
                      {guideN > 0 ? <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-px text-[9px] font-medium text-amber-700">오안내 {guideN}건</span> : null}
                      {workN > 0 ? <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-px text-[9px] font-medium text-amber-700">안내누락 {workN}건</span> : null}
                    </>
                  )}
                </span>
              </div>
              <p className="mt-1 text-[10.5px] leading-4 text-[#33445c]"><span className="font-semibold text-[#10233f]">문의 · </span>{shortSummary(data)}</p>
              <p className="mt-1 flex items-start gap-1 rounded border border-[#dbe5f1] bg-white/70 px-1.5 py-1 text-[10.5px] leading-4 text-[#10233f]"><Sparkles className="mt-px h-3 w-3 shrink-0 text-[#0b4f91]" /> {insight}</p>
            </div>

            {/* 오안내 / 안내 누락 — 밑줄 탭 */}
            <div>
              <div className="flex gap-1 border-b border-[#dbe5f1]">
                {([["guide", "오안내 검수", g.verdict], ["work", "안내 누락 검수", w.verdict]] as const).map(([k, label, verdict]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setAuditTab(k)}
                    className={cn("relative flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold transition-colors", auditTab === k ? "text-[#0b4f91]" : "text-muted-foreground hover:text-[#33445c]")}
                  >
                    {label}
                    {verdict !== "정상" ? <span className={cn("h-1.5 w-1.5 rounded-full", verdict === "위반" ? "bg-red-500" : "bg-amber-500")} /> : null}
                    {auditTab === k ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#0b4f91]" /> : null}
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-3">
                {auditTab === "guide" ? (
                  <>
                    {/* 판정 — 헤드라인 + 평가 사유 */}
                    <div className={cn("rounded-lg border p-3", g.verdict === "정상" ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/60")}>
                      <div className="flex items-center gap-2">
                        {g.verdict === "정상" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />}
                        <span className={cn("text-[12px] font-bold", g.verdict === "정상" ? "text-emerald-900" : "text-red-900")}>{gHead}</span>
                        <span className="ml-auto"><SeverityChip verdict={g.verdict} /></span>
                      </div>
                      <p className="mt-1.5 text-[11.5px] leading-5 text-[#10233f]"><span className="font-semibold">평가 사유 · </span>{g.note}</p>
                    </div>
                    {/* 판정 근거 */}
                    {data.references.length ? (
                      <div className="rounded-lg border border-[#e2eaf4] bg-[#fbfdff] p-3">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-[#0b4f91]" />
                          <span className="text-[10px] font-bold text-[#0b4f91]">판정 근거</span>
                          <span className="text-[9.5px] text-muted-foreground">AI가 참고한 약관·내규</span>
                        </div>
                        <div className="space-y-1.5">
                          {data.references.map((r) => (
                            <div key={r.label} className="rounded-md border border-[#dbe5f1] bg-white px-2.5 py-2">
                              <div className="flex items-start justify-between gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10233f]">
                                  <span className="rounded-sm bg-[#eef4fb] px-1 py-0.5 text-[9px] font-semibold text-[#0b4f91]">{r.type}</span>
                                  {r.label}
                                </span>
                                <button type="button" onClick={() => setPreviewRef(r)} className="inline-flex shrink-0 items-center gap-1 text-[10.5px] font-medium text-[#0b4f91] underline-offset-4 hover:underline">원본 보기 <ExternalLink className="h-3 w-3" /></button>
                              </div>
                              <p className="mt-1 text-[11px] leading-5 text-[#33445c]"><mark className="rounded-sm bg-amber-200/70 px-1 font-medium text-amber-900">{r.excerpt}</mark></p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    {/* 판정 — 헤드라인 + 평가 사유 */}
                    <div className={cn("rounded-lg border p-3", w.verdict === "정상" ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/60")}>
                      <div className="flex items-center gap-2">
                        {w.verdict === "정상" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />}
                        <span className={cn("text-[12px] font-bold", w.verdict === "정상" ? "text-emerald-900" : "text-red-900")}>{wHead}</span>
                        <span className="ml-auto"><SeverityChip verdict={w.verdict} /></span>
                      </div>
                      <p className="mt-1.5 text-[11.5px] leading-5 text-[#10233f]"><span className="font-semibold">평가 사유 · </span>{w.note}</p>
                    </div>
                    {/* 매뉴얼 항목별 수행 여부 */}
                    <div className="rounded-lg border border-[#e2eaf4] bg-white p-3">
                      <div className="mb-2 flex items-center gap-1.5">
                        <ListChecks className="h-3.5 w-3.5 text-[#0b4f91]" />
                        <span className="text-[10px] font-bold text-[#0b4f91]">매뉴얼 항목별 수행 여부</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">총 {data.processing.length}개 중 <span className="font-bold text-red-600">{missCount}개</span> 미수행</span>
                      </div>
                      <div className="flex items-center gap-2 border-b border-[#e2eaf4] px-2.5 pb-1 text-[9px] font-semibold text-muted-foreground">
                        <span className="w-4 text-center">#</span>
                        <span className="flex-1">매뉴얼 항목</span>
                        <span className="w-[64px] text-center">위치</span>
                        <span className="w-[42px] text-center">수행</span>
                      </div>
                      <div className="overflow-hidden rounded-b-md">
                        {data.processing.map((p, i) => {
                          const ok = !(p.status.includes("대기") || p.status.includes("미"))
                          return (
                            <div key={i} className={cn("px-2.5 py-1.5", i > 0 && "border-t border-[#eef2f7]")}>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="w-4 text-center font-mono text-[9.5px] text-muted-foreground">{i + 1}</span>
                                <span className={cn("flex-1", ok ? "text-[#10233f]" : "font-semibold text-red-700")}>{p.item}</span>
                                <span className={cn("w-[64px] text-center font-mono text-[9.5px]", ok ? "text-muted-foreground" : "font-semibold text-red-500")}>{p.location ?? "-"}</span>
                                <span className="flex w-[42px] justify-center">
                                  {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── 휴먼 검수 — 관리자: 직접 작성 / 상담사: 결과 열람 ── */}
            <div className="flex items-center gap-1.5 border-b border-[#dbe5f1] pb-1.5 pt-2 text-[11.5px] font-bold text-[#10233f]">
              <FileCheck2 className="h-4 w-4 text-[#0b4f91]" /> 휴먼 검수
              <span className="ml-auto flex items-center gap-1.5">
                {dispStatus ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#475569]">
                      {closed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : dispStatus === "필요" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> : dispStatus === "검토필요" ? <FileCheck2 className="h-3.5 w-3.5 text-[#0b4f91]" /> : <CheckCircle2 className={cn("h-3.5 w-3.5", dispStatus === "완료" ? "text-emerald-500" : "text-slate-400")} />}
                      {closed ? "검토 완료 및 종결" : dispStatus === "검토필요" ? "검토 필요" : dispStatus === "필요" ? "후속 조치 필요" : dispStatus === "완료" ? "조치 완료" : "고객서비스 이관"}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">·</span>
                  </>
                ) : null}
                <span className="text-[10px] font-normal text-muted-foreground">검토자 <span className="font-semibold text-[#10233f]">박관리</span></span>
                {role === "admin" && !closed ? (
                  <Button size="sm" onClick={() => { setFollowup((f) => ({ ...f, adminClosed: true })); writeFollowup(data.id, { adminClosed: true }); setSaved(true) }} className="h-7 gap-1 bg-[#005bac] text-[11px] hover:bg-[#084780]"><CheckCircle2 className="h-3.5 w-3.5" /> 검토 완료 및 종결</Button>
                ) : null}
              </span>
            </div>

            {role === "admin" ? (
              /* 관리자 — 코멘트(좌) + (조치완료 시) 상담사 조치 내역 / (그 외) 검수 판정(우) */
              <div className="grid grid-cols-[1fr_200px] gap-2.5">
                <div className="rounded-lg border border-[#e2eaf4] bg-white p-2.5">
                  <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><MessageSquare className="h-3 w-3" /> 관리자 코멘트 <span className="font-normal text-muted-foreground">· 상담사 전달</span></div>
                  <Textarea value={comment} onChange={(e) => { setComment(e.target.value); setSaved(false) }} placeholder="검토 의견·정정 및 재고지 사항을 상담사에게 작성하세요." className="min-h-[68px] text-[11px] leading-5 caret-[#005bac]" />
                  {showActed || closed ? null : <p className="mt-1.5 text-[9.5px] leading-4 text-muted-foreground">{humanStatus === "필요" ? "담당 상담사에게 전달되어 후속조치가 진행됩니다." : "검토 판정과 코멘트를 작성한 뒤 우측 상단에서 종결하세요."}</p>}
                </div>
                {showActed ? (
                  <div className="rounded-lg border border-[#e2eaf4] bg-[#fbfdff] p-2.5">
                    <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><ListChecks className="h-3.5 w-3.5 text-[#0b4f91]" /> 상담사 조치 내역</div>
                    <div className="space-y-2">
                      {(actedItems.length ? actedItems : ["정정 문자 발송"]).map((it) => {
                        const isSmsItem = /문자|SMS/.test(it)
                        const is027 = data.id === FOLLOWUP_BASE_ID
                        const recId = is027 ? FOLLOWUP_REC_ID : dummyFollowupId(data)
                        // 정정 문자 발송 — 라벨 아래 줄에 발송 이력번호(정해린=클릭 시 이력 열람)
                        if (isSmsItem) {
                          const inner = (
                            <>
                              <span className="flex items-center gap-1.5"><ClipboardCheck className="h-3.5 w-3.5 shrink-0 text-[#0b4f91]" />{it}</span>
                              <span className={cn("pl-5 font-mono text-[9px]", is027 ? "text-[#0b4f91]" : "text-[#5b6b80]")}>{recId}</span>
                            </>
                          )
                          return is027 ? (
                            <Link key={it} href={`/post-consultation?id=${FOLLOWUP_REC_ID}&view=sms`} className="flex flex-col gap-1 rounded-md border border-[#bad6f4] bg-[#f2f8ff] px-2 py-1.5 text-[11px] font-medium text-[#10233f] transition-colors hover:bg-[#e3f0fc]">{inner}</Link>
                          ) : (
                            <div key={it} className="flex flex-col gap-1 rounded-md border border-[#dbe5f1] bg-white px-2 py-1.5 text-[11px] font-medium text-[#10233f]">{inner}</div>
                          )
                        }
                        return (
                          <div key={it} className="flex items-center gap-1.5 rounded-md border border-[#dbe5f1] bg-white px-2 py-1.5 text-[11px] font-medium text-[#10233f]">
                            <ClipboardCheck className="h-3.5 w-3.5 shrink-0 text-[#0b4f91]" />{it}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#e2eaf4] bg-[#fbfdff] p-2.5">
                    <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><ListChecks className="h-3 w-3" /> 검수 판정</div>
                    <div className="space-y-1">
                      {STATUS_OPTS.map((o) => {
                        const on = humanStatus === o.key
                        return (
                          <button key={o.key} type="button" onClick={() => { setHumanStatus(o.key); setSaved(false) }}
                            className={cn("flex w-full items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-[11px] transition-colors",
                              on ? "border-[#005bac] bg-[#f2f8ff] font-semibold text-[#0b4f91]" : "border-[#dbe5f1] bg-white text-[#33445c] hover:bg-[#f7fafe]")}>
                            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full border", on ? "border-[#005bac] bg-[#005bac]" : "border-slate-300")} />
                            {o.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 상담사 — 관리자 검수 결과 열람(읽기 전용) */
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-[#e2eaf4] bg-[#fbfdff] p-2.5">
                  <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><MessageSquare className="h-3 w-3" /> 관리자 코멘트</div>
                  <p className="text-[11px] leading-5 text-[#10233f]">{adminComment}</p>
                </div>
                <div className="rounded-lg border border-[#e2eaf4] bg-white p-2.5">
                  {admin === "검토필요" ? (
                    <>
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><FileCheck2 className="h-3 w-3" /> 관리자 검토 대기</div>
                      <p className="text-[11px] leading-5 text-[#10233f]">관리자 2차 검토가 진행될 예정입니다.</p>
                    </>
                  ) : admin === "이관" ? (
                    <>
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><ArrowRight className="h-3 w-3" /> 고객서비스 이관</div>
                      <p className="text-[11px] leading-5 text-[#10233f]">고객 서비스팀으로 이관되어 후속 처리가 진행될 예정입니다.</p>
                    </>
                  ) : clean || admin === "검수완료" ? (
                    <>
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><CheckCircle2 className="h-3 w-3 text-[#0b4f91]" /> 검토 완료 및 종결</div>
                      <p className="text-[11px] leading-5 text-[#10233f]">오안내·안내 누락이 확인되지 않아 별도 후속 조치가 필요하지 않습니다.</p>
                    </>
                  ) : admin === "완료" ? (
                    <>
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><ClipboardCheck className="h-3 w-3 text-[#0b4f91]" /> 완료된 조치</div>
                      <div className="space-y-1.5">
                        {/* 실제 수행한 조치만 표시 — 재안내 전화는 통화가 나갔을 때(actionItems 포함)만 노출, 폴백은 정정 문자 발송 */}
                        {(actedItems.length ? actedItems : ["정정 문자 발송"]).map((label) => {
                          const isSmsItem = /문자|SMS/.test(label)
                          const is027 = data.id === FOLLOWUP_BASE_ID
                          const recId = is027 ? FOLLOWUP_REC_ID : dummyFollowupId(data)
                          // 정정 문자 발송 — 라벨 아래 줄에 발송 이력번호(정해린=클릭 시 이력 열람)
                          if (isSmsItem) {
                            const inner = (
                              <>
                                <span className="flex items-center gap-1.5"><ClipboardCheck className="h-3.5 w-3.5 shrink-0 text-[#0b4f91]" />{label}</span>
                                <span className={cn("pl-5 font-mono text-[9px]", is027 ? "text-[#0b4f91]" : "text-[#5b6b80]")}>{recId}</span>
                              </>
                            )
                            return is027 ? (
                              <Link key={label} href={`/post-consultation?id=${FOLLOWUP_REC_ID}&view=sms`} className="flex flex-col gap-1 rounded-md border border-[#bad6f4] bg-[#f2f8ff] px-2 py-1.5 text-[11px] font-medium text-[#10233f] transition-colors hover:bg-[#e3f0fc]">{inner}</Link>
                            ) : (
                              <div key={label} className="flex flex-col gap-1 rounded-md border border-[#dbe5f1] bg-white px-2 py-1.5 text-[11px] font-medium text-[#10233f]">{inner}</div>
                            )
                          }
                          return (
                            <div key={label} className="flex items-center gap-1.5 rounded-md border border-[#dbe5f1] bg-white px-2 py-1.5 text-[11px] font-medium text-[#10233f]">
                              <ClipboardCheck className="h-3.5 w-3.5 shrink-0 text-[#0b4f91]" />{label}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]"><ListChecks className="h-3 w-3 text-[#0b4f91]" /> 후속 조치</div>
                      <div className="space-y-1">
                        {actionOptions.map((o) => { const acted = actedItems.includes(o.label); return (
                          <button key={o.label} type="button" onClick={() => wdAct(o.label)} className="flex w-full items-center gap-2 rounded-md border border-[#dbe5f1] bg-white px-2 py-1.5 text-left transition-colors hover:border-[#005bac] hover:bg-[#f2f8ff]">
                            {acted ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#0b4f91]" /> : <o.icon className="h-3.5 w-3.5 shrink-0 text-[#0b4f91]" />}
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-medium text-[#10233f]">{o.label}</div>
                              <div className="truncate text-[9.5px] leading-tight text-muted-foreground">{o.desc}</div>
                            </div>
                            <ArrowRight className="h-3 w-3 shrink-0 text-[#0b4f91] opacity-50" />
                          </button>
                        ) })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 판정 근거 원본 미리보기 */}
      {previewRef ? (
        (() => {
          const doc = refDoc(previewRef)
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setPreviewRef(null)}>
              <div className="flex max-h-[88vh] w-full max-w-[620px] flex-col overflow-hidden rounded-lg border border-[#cdd9e8] bg-[#3a4250] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2 px-4 py-2.5 text-white">
                  <BookOpen className="h-4 w-4 text-[#9cc6f0]" />
                  <span className="text-[12px] font-semibold">{previewRef.label}</span>
                  <span className="rounded bg-white/15 px-1.5 py-0.5 text-[9px]">{previewRef.type}</span>
                  <span className="ml-auto text-[10px] text-white/60">{doc.docNo}</span>
                  <button type="button" onClick={() => setPreviewRef(null)} className="ml-2 rounded p-1 text-white/80 hover:bg-white/15 hover:text-white" aria-label="닫기">✕</button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  <div className="mx-auto w-full max-w-[480px] rounded-sm bg-white px-10 py-9 shadow-xl">
                    <div className="mb-1 flex items-center justify-between text-[8.5px] text-muted-foreground">
                      <span className="font-semibold text-[#10233f]">제논라이프생명보험(주)</span>
                      <span>{doc.docNo} · {doc.revised}</span>
                    </div>
                    <div className="mb-5 border-b-2 border-[#10233f] pb-2.5 text-center">
                      <div className="text-[9px] tracking-widest text-muted-foreground">{previewRef.type.toUpperCase()}</div>
                      <h3 className="mt-0.5 text-[15px] font-bold leading-6 text-[#10233f]">{previewRef.label}</h3>
                    </div>
                    <div className="space-y-4">
                      {doc.sections.map((s) => (
                        <div key={s.heading}>
                          <div className="mb-1.5 text-[12px] font-bold text-[#10233f]">{s.heading}</div>
                          <div className="space-y-1.5 pl-1">
                            {s.lines.map((l, i) =>
                              l === previewRef.excerpt ? (
                                <p key={i} className="rounded-sm bg-[#fff3b0] px-1.5 py-1 text-[11px] font-medium leading-6 text-[#10233f]">{l}</p>
                              ) : (
                                <p key={i} className="text-[11px] leading-6 text-[#33445c]">{l}</p>
                              ),
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 flex items-center justify-between border-t border-[#e2eaf4] pt-2 text-[8.5px] text-muted-foreground">
                      <span>본 문서는 데모용 목업이며 실제 약관·지침과 다를 수 있습니다.</span>
                      <span>- 1 / 1 -</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-2.5">
                  <span className="inline-flex items-center gap-1 text-[10px] text-white/70">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#fff3b0]" /> 노란색 강조 = 검수 판정에 인용된 발췌 항목
                  </span>
                  <Button size="sm" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/15 hover:text-white" onClick={() => setPreviewRef(null)}>닫기</Button>
                </div>
              </div>
            </div>
          )
        })()
      ) : null}
    </section>
  )
}

/* 후속 작업 처리 상태(데모) — 화면 이동 간 유지: SMS 발송/접촉이력 등록 + 처리 원문을 상담ID별로 localStorage에 저장 */
type Followup = { smsSent?: boolean; smsText?: string; contactRegistered?: boolean; contactText?: string; contactItems?: { label: string; body: string }[]; vocExp?: "일반 문의" | "불만 VoC"; actionDone?: boolean; actionAt?: string; actionItems?: string[]; adminClosed?: boolean }
const FOLLOWUP_KEY = "genon:followup"
function readAllFollowups(): Record<string, Followup> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(window.localStorage.getItem(FOLLOWUP_KEY) || "{}") || {}
  } catch {
    return {}
  }
}
function writeFollowup(id: string, patch: Followup) {
  if (typeof window === "undefined") return
  try {
    const all = JSON.parse(window.localStorage.getItem(FOLLOWUP_KEY) || "{}")
    all[id] = { ...all[id], ...patch }
    window.localStorage.setItem(FOLLOWUP_KEY, JSON.stringify(all))
    window.dispatchEvent(new Event("genon:followup-changed")) // 구독 컴포넌트 즉시 재로딩
  } catch {
    /* 데모 — 저장 실패 무시 */
  }
}
// 데모 대상(김민준)의 후속업무 상태를 전체 새로고침 시 1회만 초기화 —
// 모듈 스코프 플래그는 새로고침(JS 재실행) 때 리셋되고, SPA 내 화면 이동에서는 유지되므로
// "새로고침=데모 처음부터(미등록/미발송)", "흐름 중 이동=등록/발송 상태 유지"가 양립한다.
let demoFollowupResetDone = false
function resetDemoFollowupOnce() {
  if (demoFollowupResetDone || typeof window === "undefined") return
  demoFollowupResetDone = true
  try {
    // 세션 최초 진입 시에만 데모 대상(정해린 027·김민준 018) 후속조치 초기화 → 조치필요·아웃바운드 이력 미노출로 시작.
    // 이후 같은 세션에서는(새로고침·재진입 포함) 초기화하지 않아 모든 작업이 유지됨. 새 세션(새 탭)에서만 다시 초기화.
    if (window.sessionStorage.getItem("genon:demoReset") === "1") return
    window.sessionStorage.setItem("genon:demoReset", "1")
    const all = JSON.parse(window.localStorage.getItem(FOLLOWUP_KEY) || "{}")
    let changed = false
    for (const id of [DEMO_CONSULT_ID, "CL-20260513-027"]) { if (all[id]) { delete all[id]; changed = true } }
    if (changed) window.localStorage.setItem(FOLLOWUP_KEY, JSON.stringify(all))
  } catch {
    /* 데모 — 무시 */
  }
}

/* ================================================================== */
/* 이력 조회(기본) — 테이블 탐색 + 선택 상담 상세                       */
/* ================================================================== */

const ACTION_META: { task: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { task: "contact", label: "접촉이력 등록", icon: ClipboardCheck },
  { task: "sms", label: "SMS 안내", icon: MessageSquare },
  { task: "audit", label: "오안내·누락 검수", icon: ShieldCheck },
]

function HistoryExplorer({
  filtered,
  groups,
  total,
  page,
  pageCount,
  setPage,
  selected,
  selectedId,
  onSelect,
  period,
  setPeriod,
  query,
  setQuery,
  view,
  setView,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  reviewFilter,
  setReviewFilter,
  agentFilter,
  setAgentFilter,
  centerFilter,
  setCenterFilter,
  aiFilter,
  setAiFilter,
  humanFilter,
  setHumanFilter,
  autoOpenId,
  autoView,
}: {
  filtered: Consultation[]
  groups: { key: string; label: string; sub: string; calls: Consultation[] }[]
  total: number
  page: number
  pageCount: number
  setPage: (updater: (p: number) => number) => void
  selected: Consultation
  selectedId: string
  onSelect: (id: string) => void
  period: PeriodKey
  setPeriod: (p: PeriodKey) => void
  query: string
  setQuery: (q: string) => void
  view: "call" | "agent" | "customer"
  setView: (v: "call" | "agent" | "customer") => void
  startDate: string
  setStartDate: (v: string) => void
  endDate: string
  setEndDate: (v: string) => void
  reviewFilter: ReviewFilter
  setReviewFilter: (v: ReviewFilter) => void
  agentFilter: string
  setAgentFilter: (v: string) => void
  centerFilter: string
  setCenterFilter: (v: string) => void
  aiFilter: "all" | "통과" | "감지"
  setAiFilter: (v: "all" | "통과" | "감지") => void
  humanFilter: AdminState | "all"
  setHumanFilter: (v: AdminState | "all") => void
  autoOpenId?: string | null
  autoView?: string | null
}) {
  const [showTranscript, setShowTranscript] = useState(false)
  const [openFilter, setOpenFilter] = useState<"ai" | "human" | null>(null) // 열 헤더 드롭다운(필터) 열림 상태
  const [drawerOpen, setDrawerOpen] = useState(false) // 우측 상세 서랍 — 행 클릭 시 고객 정보 표시
  // ?id= 로 진입(예: 후속 이력 보기) 시 해당 건의 상세 카드를 자동으로 열어 활성화
  useEffect(() => { if (autoOpenId) { onSelect(autoOpenId); setDrawerOpen(true); if (autoView === "sms" || autoView === "contact") setViewTask(autoView) } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [autoOpenId, autoView])
  const router = useRouter()
  // 로그인 역할 — 관리자: 검토 대기 건 '검토 필요'(검수 진입) / 상담사: 목업 조치 상태 그대로
  const [role, setRole] = useState<"agent" | "admin">("agent")
  useEffect(() => { try { if (localStorage.getItem("genon:role") === "admin") setRole("admin") } catch { /* 데모 */ } }, [])
  // 후속 작업 처리 상태(SMS 발송/접촉이력 등록) — 화면 이동 후 복귀 시 localStorage에서 복원
  const [followups, setFollowups] = useState<Record<string, Followup>>({}) // 전체 상담(테이블 칩 연동)
  const [viewTask, setViewTask] = useState<"sms" | "contact" | null>(null) // 완료 버튼 클릭 시 처리 원문 표시
  const [coachOpen, setCoachOpen] = useState(false) // 관리자 코칭 이력 — 기본 접힘
  useEffect(() => {
    resetDemoFollowupOnce() // 전체 새로고침 시 데모 대상(김민준) 후속업무 초기화 → 미등록/미발송으로 시작
    setFollowups(readAllFollowups())
  }, [])
  const followup = followups[selected.id] ?? {}
  useEffect(() => {
    // 후속 이력 링크(?id=...&view=sms) 진입 시 해당 후속작업을 펼친 상태로, 그 외엔 접힘
    setViewTask(selected.id === autoOpenId && (autoView === "sms" || autoView === "contact") ? autoView : null)
  }, [selected.id])
  // 통화 건 클릭 → 우측 서랍에 해당 상담의 고객 정보 표시(검수는 카드 하단 버튼으로 진입)
  const selectRow = (id: string) => {
    onSelect(id)
    setDrawerOpen(true)
  }
  const showAgent = role === "admin" // 관리자: 담당 상담사 컬럼 상시 노출
  const cols = drawerOpen ? 4 : showAgent ? 10 : 9 // 상세 열림: 상담일시·상담건·고객·요약 / 관리자 10 / 상담사 9

  // 상담 상세 서랍이 열리면 좌측 앱 사이드바를 자동 축소(닫으면 복원)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("genon:sidebar-collapse", { detail: { collapsed: drawerOpen } }))
  }, [drawerOpen])
  // 화면 이탈 시 사이드바 복원
  useEffect(() => () => {
    window.dispatchEvent(new CustomEvent("genon:sidebar-collapse", { detail: { collapsed: false } }))
  }, [])

  // 전체 현황 (정보 중심)
  const totalAll = CONSULTATIONS.length
  const uniqueCustomers = new Set(CONSULTATIONS.map((c) => c.customerNo)).size
  const monthCount = CONSULTATIONS.filter((c) => c.date.startsWith(TODAY.slice(0, 7))).length
  const avgDurAll = Math.round(CONSULTATIONS.reduce((s, c) => s + durationMin(c.time), 0) / CONSULTATIONS.length)

  // 선택 고객 단위 정보·통계
  const profile = CUSTOMERS[selected.customerNo]
  const followupRecDetail = buildFollowupRecord(followups[FOLLOWUP_BASE_ID]) // 후속건(-t01)도 동일 고객 이력에 포함
  const calls = [...CONSULTATIONS, ...(followupRecDetail ? [followupRecDetail] : [])].filter((c) => c.customerNo === selected.customerNo)
  const sameCustomer = calls.filter((c) => c.id !== selected.id)
  // 원장 타임라인 — 날짜 최신순 + 후속건(-t01)을 부모건 바로 아래(브랜치)로 배치
  const isBranchId = (id: string) => /-t\d+$/.test(id)
  const timeline = (() => {
    // 현재 보는 건을 포함한 동일 고객 전체 이력(이력서처럼 최신순), 후속건(-t01)은 부모건 바로 아래 브랜치로 배치
    const base = [...sameCustomer, selected]
    const sorted = base.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    const out = sorted.filter((c) => !isBranchId(c.id))
    for (const br of sorted.filter((c) => isBranchId(c.id))) {
      const pid = br.id.replace(/-t\d+$/, "")
      const idx = out.findIndex((c) => c.id === pid)
      if (idx >= 0) out.splice(idx + 1, 0, br) // 부모 아래(브랜치)
      else out.push(br) // 부모가 목록에 없으면 브랜치 표시 없이 일반 항목으로
    }
    return out
  })()
  const timelineIds = new Set(timeline.map((c) => c.id))
  const totalCalls = calls.length
  const avgDur = Math.round(calls.reduce((s, c) => s + durationMin(c.time), 0) / calls.length)
  const dates = calls.map((c) => c.date).sort()
  const lastDate = dates[dates.length - 1]
  let intervalLabel = "단일 상담"
  if (dates.length > 1) {
    const span = (new Date(dates[dates.length - 1]).getTime() - new Date(dates[0]).getTime()) / (1000 * 60 * 60 * 24)
    intervalLabel = `평균 ${Math.max(1, Math.round(span / (dates.length - 1)))}일`
  }
  const gradeTone = profile?.grade === "우량" ? "border-[#bad6f4] bg-[#005bac] text-white" : profile?.grade === "관리" ? "border-slate-400 bg-slate-500 text-white" : "border-slate-200 bg-slate-100 text-slate-600"
  // 완료 판정은 목록 테이블과 동일 소스(contactDoneOf/smsStateOf + followup)로 → 테이블·상세 카드 정합
  const actionDone: Record<string, boolean> = {
    contact: contactDoneOf(selected) || !!followup.contactRegistered,
    sms: smsStateOf(selected) === "발송" || !!followup.smsSent,
    audit: selected.status === "리뷰 완료",
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#f1f5fb]">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#dbe5f1] bg-white px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-8 w-8 items-center justify-center", role === "admin" ? "rounded-lg bg-[#0f3468]/10 text-[#0f3468]" : "rounded-full bg-[#005bac]/10 text-[#005bac]")}>
            {role === "admin" ? <ShieldCheck className="h-4 w-4" /> : <History className="h-4 w-4" />}
          </div>
          <div className="leading-tight">
            <div className="text-[14.5px] font-bold tracking-tight text-[#10233f]">{role === "admin" ? "상담 품질 검수" : "상담 이력 조회"}</div>
            <div className="text-[10.5px] text-muted-foreground">{role === "admin" ? "센터 전체 상담 · AI 1차 검수 결과 · 휴먼 2차 검수" : "최근 3년 상담 회원 이력 · 대화 원문 · 요약 · 처리 기록"}</div>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <MiniStat label="전체 상담" value={totalAll} />
          <MiniStat label="상담 회원" value={uniqueCustomers} />
          <MiniStat label="이번 달" value={monthCount} />
          <MiniStat label="평균 통화(분)" value={avgDurAll} />
        </div>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#dbe5f1] bg-white px-5 py-2">
        {/* 관리자 — 센터 · 상담사 필터(전면 배치) */}
        {role === "admin" ? (
          <>
            <div className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <select value={centerFilter} onChange={(e) => setCenterFilter(e.target.value)}
                className="rounded-md border border-[#dbe5f1] bg-white px-2 py-1 text-[10.5px] font-medium text-[#33445c] outline-none focus:border-[#005bac]">
                <option value="전체">센터 전체</option>
                {ALL_CENTERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
              <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}
                className="rounded-md border border-[#dbe5f1] bg-white px-2 py-1 text-[10.5px] font-medium text-[#33445c] outline-none focus:border-[#005bac]">
                <option value="전체">상담사 전체</option>
                {ALL_AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="h-4 w-px bg-[#e2eaf4]" />
          </>
        ) : null}
        {/* 보기 */}
        <div className="flex items-center gap-1">
          {([
            { id: "call", label: "통화별", icon: PhoneCall },
            { id: "agent", label: "상담사별", icon: UserRound },
            { id: "customer", label: "고객별", icon: Users },
          ] as const).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                "flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors",
                view === v.id ? "border-[#005bac] bg-[#f2f8ff] text-[#0b4f91]" : "border-[#e2eaf4] bg-white text-muted-foreground hover:bg-muted/40",
              )}
            >
              <v.icon className="h-3.5 w-3.5" /> {v.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-[#e2eaf4]" />

        <div className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPeriod(p.id)
                setStartDate("")
                setEndDate("")
                // 최근 7일/30일 → 검수완료(어제 건부터) / 오늘 → 전체(오늘은 전부 검수대기라 검수완료가 없음)
                if (p.id === "7d" || p.id === "30d") setReviewFilter("done")
                else if (p.id === "today") setReviewFilter("all")
              }}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10.5px] transition-colors",
                period === p.id && !startDate && !endDate ? "border-[#005bac] bg-[#005bac] text-white" : "border-[#dbe5f1] bg-white text-[#33445c] hover:bg-muted/40",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-[#e2eaf4]" />

        {/* 날짜 직접 지정 */}
        <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setPeriod("all")
            }}
            className="h-7 rounded-md border border-[#dbe5f1] bg-white px-1.5 text-[10.5px] text-[#10233f]"
          />
          <span>~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setPeriod("all")
            }}
            className="h-7 rounded-md border border-[#dbe5f1] bg-white px-1.5 text-[10.5px] text-[#10233f]"
          />
          {startDate || endDate ? (
            <button type="button" onClick={() => { setStartDate(""); setEndDate("") }} className="rounded-md border border-[#dbe5f1] px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/40">
              초기화
            </button>
          ) : null}
        </div>

        <div className="h-4 w-px bg-[#e2eaf4]" />

        {/* 검수 상태 */}
        <div className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
          {([
            { id: "all", label: "전체" },
            { id: "waiting", label: "검수 대기" },
            { id: "done", label: "검수 완료" },
          ] as const).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => { setReviewFilter(r.id) }}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10.5px] transition-colors",
                reviewFilter === r.id ? "border-[#005bac] bg-[#005bac] text-white" : "border-[#dbe5f1] bg-white text-[#33445c] hover:bg-muted/40",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

      </div>

      {/* 본문: 테이블(전체폭) + 상세 서랍(열리면 약 1:3) */}
      <div className="flex min-h-0 flex-1">
        <div className={cn("min-w-0 overflow-y-auto", drawerOpen ? "flex-[2] px-4 py-3" : "flex-1 px-8 py-5")}>
          <div className={cn("mb-2 flex items-center justify-between gap-3 px-1 text-[10.5px] text-muted-foreground", !drawerOpen && "mx-auto w-full max-w-[1180px]")}>
            <span>총 <span className="font-bold text-[#10233f]">{total}</span>건 조회{pageCount > 1 ? <span className="ml-1 text-muted-foreground">· {page + 1}/{pageCount} 페이지 (15건씩)</span> : null}</span>
            {!drawerOpen ? <span>행을 클릭하면 우측에서 상담 상세를 확인할 수 있습니다.</span> : null}
          </div>
          <div className={cn("overflow-x-auto border border-[#dbe5f1] bg-white", !drawerOpen && "mx-auto w-full max-w-[1180px]")}>
            <table className={cn("w-full border-collapse text-left", !drawerOpen && "table-fixed")}>
              {!drawerOpen ? (
                <colgroup>
                  <col className="w-[92px]" />{/* 상담일시 */}
                  <col className="w-[140px]" />{/* 상담 건(상담ID, 후속건 -t01 등 긴 ID 대응) */}
                  {showAgent ? <col className="w-[84px]" /> : null}{/* 상담사 */}
                  <col className="w-[80px]" />{/* 채널 */}
                  <col className="w-[84px]" />{/* 고객 */}
                  <col />{/* 문의 내용 요약 — 나머지 폭 */}
                  <col className="w-[72px]" />{/* 접촉이력 */}
                  <col className="w-[64px]" />{/* SMS */}
                  <col className="w-[100px]" />{/* AI 검수 */}
                  <col className="w-[104px]" />{/* 휴먼 검수 */}
                </colgroup>
              ) : null}
              <thead className="bg-white text-[10.5px] text-[#5b7396] [&_tr:last-child>th]:border-b [&_tr:last-child>th]:border-[#dbe5f1]">
                {drawerOpen ? (
                  <tr>
                    <Th>상담일시</Th>
                    <Th>상담 건</Th>
                    <Th>고객</Th>
                    <Th wide>문의 내용 요약</Th>
                  </tr>
                ) : (
                  <>
                    <tr className="text-[9.5px] font-bold text-[#3a5e8c]">
                      <th colSpan={showAgent ? 6 : 5} className="bg-[#eef4fb] px-3 py-1 text-center">상담 이력</th>
                      <th colSpan={2} className="border-l border-[#dbe5f1] bg-[#eef4fb] px-3 py-1 text-center">후속 업무</th>
                      <th colSpan={2} className="border-l border-[#dbe5f1] bg-[#eaf1fb] px-3 py-1 text-center font-bold text-[#0f3468]">상담 내용 검수</th>
                    </tr>
                    <tr>
                      <Th>상담일시</Th>
                      <Th>상담 건</Th>
                      {showAgent ? <Th>상담사</Th> : null}
                      <Th>채널</Th>
                      <Th>고객</Th>
                      <Th wide>문의 내용 요약</Th>
                      <Th center divide>접촉이력</Th>
                      <Th center>SMS</Th>
                      <Th center divide>
                        <div className="relative inline-block">
                          <button type="button" onClick={() => setOpenFilter(openFilter === "ai" ? null : "ai")} className={cn("inline-flex items-center gap-0.5 font-semibold transition-colors hover:text-[#0b4f91]", aiFilter !== "all" && "text-[#0b4f91]")}>
                            AI 검수 <ChevronDown className="h-3 w-3" />
                          </button>
                          {openFilter === "ai" ? (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenFilter(null)} />
                              <div className="absolute left-1/2 top-full z-50 mt-1 min-w-[84px] -translate-x-1/2 rounded-md border border-[#dbe5f1] bg-white py-1 shadow-md">
                                {([["all", "전체"], ["통과", "통과"], ["감지", "감지"]] as const).map(([v, l]) => (
                                  <button key={v} type="button" onClick={() => { setAiFilter(v); setOpenFilter(null) }} className={cn("block w-full whitespace-nowrap px-3 py-1 text-center text-[10.5px] hover:bg-[#f2f8ff]", aiFilter === v ? "font-semibold text-[#0b4f91]" : "font-normal text-[#33445c]")}>{l}</button>
                                ))}
                              </div>
                            </>
                          ) : null}
                        </div>
                      </Th>
                      <Th center>
                        <span className="inline-flex items-center">
                        <div className="relative inline-block">
                          <button type="button" onClick={() => setOpenFilter(openFilter === "human" ? null : "human")} className={cn("inline-flex items-center gap-0.5 font-semibold transition-colors hover:text-[#0b4f91]", humanFilter !== "all" && "text-[#0b4f91]")}>
                            휴먼 검수 <ChevronDown className="h-3 w-3" />
                          </button>
                          {openFilter === "human" ? (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenFilter(null)} />
                              <div className="absolute left-1/2 top-full z-50 mt-1 min-w-[88px] -translate-x-1/2 rounded-md border border-[#dbe5f1] bg-white py-1 shadow-md">
                                {([["all", "전체"], ["검토필요", "검토 필요"], ["필요", "후속 조치 필요"], ["완료", "조치완료"], ["이관", "고객서비스 이관"], ["검수완료", "검토 완료"]] as const).map(([v, l]) => (
                                  <button key={v} type="button" onClick={() => { setHumanFilter(v as AdminState | "all"); setOpenFilter(null) }} className={cn("block w-full whitespace-nowrap px-3 py-1 text-center text-[10.5px] hover:bg-[#f2f8ff]", (humanFilter ?? "all") === v ? "font-semibold text-[#0b4f91]" : "font-normal text-[#33445c]")}>{l}</button>
                                ))}
                              </div>
                            </>
                          ) : null}
                        </div>
                        <span className="group/hint relative ml-1 inline-flex align-middle">
                            <span className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-slate-300 text-[8px] font-bold leading-none text-slate-400 transition-colors group-hover/hint:border-[#0b4f91] group-hover/hint:text-[#0b4f91]">?</span>
                            <span className="pointer-events-none absolute right-0 top-full z-40 mt-1.5 hidden w-[228px] rounded-sm border border-slate-300 bg-slate-100 px-2.5 py-2 text-left font-normal shadow-md group-hover/hint:block">
                              {([
                                ["검토 필요", "관리자 2차 검토 대기 건"],
                                ["후속 조치 필요", "상담사 후속 조치가 필요한 건"],
                                ["조치 완료", "필요한 후속 조치가 완료된 건"],
                                ["고객서비스 이관", "고객 서비스팀으로 이관한 건"],
                                ["검토 완료", "관리자 검토가 종결된 건"],
                              ] as const).map(([label, desc]) => (
                                <span key={label} className="mt-1.5 flex gap-1.5 first:mt-0">
                                  <span className="w-[74px] shrink-0 whitespace-nowrap text-[9.5px] font-semibold text-slate-700">{label}</span>
                                  <span className="flex-1 text-[9.5px] leading-snug text-slate-500">{desc}</span>
                                </span>
                              ))}
                            </span>
                          </span>
                        </span>
                      </Th>
                    </tr>
                  </>
                )}
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={cols} className="p-8 text-center text-[11.5px] text-muted-foreground">조건에 맞는 상담이 없습니다.</td>
                  </tr>
                ) : view === "call" ? (
                  filtered.map((c) => <Row key={c.id} c={c} selected={c.id === selectedId} onSelect={selectRow} compact={drawerOpen} isAdmin={showAgent} role={role} fu={followups[c.id]} />)
                ) : (
                  groups.map((g) => (
                    <Fragment key={g.key}>
                      <tr className="bg-[#eef3fa]">
                        <td colSpan={cols} className="px-3 py-1.5">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0b4f91]">
                            <UserRound className="h-3.5 w-3.5" /> {g.label}{view === "agent" ? " 상담사" : " 고객"}
                            <span className="rounded-full bg-white px-1.5 text-[9.5px]">{g.calls.length}건</span>
                            {g.sub ? <span className="font-normal text-muted-foreground">{g.sub}</span> : null}
                          </span>
                        </td>
                      </tr>
                      {g.calls.map((c) => <Row key={c.id} c={c} selected={c.id === selectedId} onSelect={selectRow} compact={drawerOpen} isAdmin={showAgent} role={role} grouped fu={followups[c.id]} />)}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 하단 바 — 검색(좌) + 페이지네이션(우) */}
          <div className={cn("mt-3 flex flex-wrap items-center gap-3 border-t border-[#dbe5f1] pt-3", !drawerOpen && "mx-auto w-full max-w-[1180px]")}>
            <div className="relative w-[220px]">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="고객명 · 상담ID · 주제 · 키워드" className="h-7 pl-6 text-[10px] md:text-[10px]" />
            </div>
            {pageCount > 1 ? (
              <div className="ml-auto flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                <button type="button" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded-md border border-[#dbe5f1] bg-white px-2 py-1 font-medium text-[#33445c] transition-colors hover:bg-muted/40 disabled:opacity-40">이전</button>
                <span className="tabular-nums">페이지 <span className="font-bold text-[#0b4f91]">{page + 1}</span> / {pageCount}</span>
                <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} className="rounded-md border border-[#dbe5f1] bg-white px-2 py-1 font-medium text-[#33445c] transition-colors hover:bg-muted/40 disabled:opacity-40">다음</button>
              </div>
            ) : null}
          </div>
        </div>

        {/* 선택 상담 상세 — 서랍(드로어): 행 클릭 시 슬라이드 활성화 */}
        <aside className={cn("flex min-h-0 flex-col border-l border-[#d4e0ef] bg-[#f1f5fb] transition-all duration-300", drawerOpen ? "min-w-0 flex-[3]" : "w-0 overflow-hidden border-l-0")}>
          <div className={cn("flex min-h-0 flex-1 flex-col", !drawerOpen && "hidden")}>
            {/* 헤더(닫기) */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#d4e0ef] bg-white px-3 py-1.5">
              <span className="text-[11px] font-bold text-[#0b4f91]">상담 상세</span>
              <button type="button" onClick={() => setDrawerOpen(false)} className="rounded p-1 text-[13px] leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="닫기">✕</button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-[10%] my-[5%] overflow-hidden rounded-sm border border-[#cdd9e8] bg-white pb-12 shadow-sm">
            {/* 차트 헤더 */}
            <div className="border-b border-[#005bac] bg-gradient-to-b from-[#e9f2fc] to-white px-14 pb-12 pt-7">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#005bac] text-white">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-bold text-[#10233f]">{selected.customer} 고객님</span>
                    {profile ? <span className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-semibold", gradeTone)}>{profile.grade}</span> : null}
                  </div>
                  <div className="truncate text-[10.5px] text-muted-foreground">{selected.customerNo} · {selected.channel}</div>
                </div>
              </div>
              {/* 핵심 지표 */}
              <div className="mt-2.5 grid grid-cols-4 gap-px overflow-hidden rounded border border-[#cdd9e8] bg-[#cdd9e8]">
                <ChartStat label="누적 상담" value={`${totalCalls}건`} />
                <ChartStat label="상담 주기" value={intervalLabel} />
                <ChartStat label="평균 통화" value={`${avgDur}분`} />
                <ChartStat label="최근 상담" value={relativeDay(lastDate)} />
              </div>
            </div>

            {/* 차트 본문 — 구분선으로 나뉜 카드형 섹션 */}
            {profile ? (
              <Section icon={ShieldCheck} title="가입 상품">
                <div className="space-y-1">
                  {profile.products.map((p) => (
                    <div key={p.name} className="flex items-center justify-between gap-2 rounded-lg border border-[#e2eaf4] bg-white px-2 py-1.5">
                      <span className="truncate text-[11px] font-medium text-[#10233f]">{p.name}</span>
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            <Section icon={MessageSquare} title="상담 요약">
              <div className="space-y-4">
                {/* 대화 주제 키워드 */}
                <div>
                  <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground"><Sparkles className="h-3 w-3" /> 대화 주제 키워드</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.keywords.map((k) => (
                      <span key={k} className="rounded-md border border-[#bad6f4] bg-[#f2f8ff] px-1.5 py-0.5 text-[10px] font-medium text-[#0b4f91]">#{k}</span>
                    ))}
                  </div>
                </div>
                {/* 대화 원문 — 펴기/접기 */}
                <div>
                  <button type="button" onClick={() => setShowTranscript(!showTranscript)} className="flex w-full items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                    <PhoneCall className="h-3 w-3" /> 대화 원문
                    <span className="ml-auto font-medium text-[#0b4f91]">{showTranscript ? "원문 접기 ▲" : "원문 펴기 ▼"}</span>
                  </button>
                  {showTranscript ? (
                    <div className="mt-1.5 space-y-2 rounded-lg border border-[#e2eaf4] bg-[#fbfdff] p-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {selected.transcript.map((t, i) => {
                        const isAgent = t.speaker === "agent"
                        return (
                          <div key={i} className={cn("flex", isAgent ? "justify-end" : "justify-start")}>
                            <div className={cn("max-w-[90%] rounded-lg px-2.5 py-1.5 text-[11px] leading-5", isAgent ? "border border-[#cfe0f1] bg-[#eef4fb] text-[#27456b]" : "border bg-white text-[#10233f]")}>
                              <span className="mr-1 text-[9px] opacity-60">{isAgent ? "상담사" : "고객"}</span>
                              <div>{t.text}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
                {/* 이번 상담 요약 */}
                <div>
                  <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground"><MessageSquare className="h-3 w-3" /> 이번 상담 요약</div>
                  <p className="whitespace-pre-line rounded-lg border border-[#e2eaf4] bg-[#fbfdff] p-2.5 text-[11.5px] leading-5 text-[#10233f]">{selected.summary}</p>
                </div>
                {/* 관리자 코칭 이력 — 요약 상시 + 원문 펴기 */}
                {COACH_HISTORY[selected.id] ? (() => {
                  const coachMsgs = COACH_HISTORY[selected.id].messages.filter((m) => m.role === "admin")
                  return (
                    <div>
                      <button type="button" onClick={() => setCoachOpen((v) => !v)} className="flex w-full items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                        <Headphones className="h-3 w-3" /> 관리자 코칭 이력
                        <span className="ml-auto font-medium text-[#0b4f91]">{coachOpen ? "원문 접기 ▲" : "원문 펴기 ▼"}</span>
                      </button>
                      <p className="mt-1.5 rounded-lg border border-[#cfe0f1] bg-[#f7fbff] px-2.5 py-2 text-[11px] leading-5 text-[#0b4f91]">{COACH_HISTORY[selected.id].summary}</p>
                      {coachOpen ? (
                        <div className="mt-1.5 space-y-1.5 rounded-lg border border-[#e2eaf4] bg-[#fbfdff] p-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                          {coachMsgs.map((m, i) => (
                            <div key={i} className="rounded-lg border border-[#e2eaf4] bg-white px-2.5 py-1.5">
                              <div className="mb-0.5 flex items-center gap-1 text-[9px] text-muted-foreground"><span className="font-semibold text-[#0b4f91]">박관리 관리자</span> · {m.time}</div>
                              <p className="text-[11px] leading-5 text-[#10233f]">{m.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )
                })() : null}
                {/* 다음 예상 문의 */}
                {profile ? (
                  <div>
                    <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground"><Sparkles className="h-3 w-3" /> 다음 예상 문의</div>
                    <p className="rounded-lg border border-[#bad6f4] bg-[#f2f8ff] px-2.5 py-2 text-[11px] leading-5 text-[#0b4f91]">{profile.predictedNext}</p>
                  </div>
                ) : null}
              </div>
            </Section>

            <Section icon={ClipboardCheck} title="후속 작업">
              {role === "admin" ? (
                <p className="mb-2 text-[10px] leading-4 text-muted-foreground">후속 업무는 담당 상담사가 처리합니다 · 관리자는 처리 상태만 확인합니다.</p>
              ) : actionDone.sms || actionDone.contact ? (
                <p className="mb-2 text-[10px] leading-4 text-muted-foreground">완료된 작업을 누르면 처리 내용을 확인할 수 있어요.</p>
              ) : null}
              <div className="space-y-1.5">
                {ACTION_META.filter((a) => a.task !== "audit").map((a) => {
                  const done = actionDone[a.task]
                  const open = viewTask === a.task
                  const name = a.task === "sms" ? "SMS 안내" : "접촉이력"
                  const cta = a.task === "sms" ? "발송" : "등록"
                  const content = a.task === "sms" ? followup.smsText || selected.smsDraft : followup.contactText || selected.summary
                  // 완료 → 펼쳐서 처리 원문 확인(아코디언), 미완료 → 등록/발송하러 이동
                  return done ? (
                    <div key={a.task} className="overflow-hidden rounded-lg border border-[#bad6f4] bg-[#f2f8ff]">
                      <button
                        type="button"
                        onClick={() => setViewTask((cur) => (cur === a.task ? null : (a.task as "sms" | "contact")))}
                        className="flex min-h-[40px] w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-[#e3f0fc]"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0b4f91]" />
                        <span className="text-[11.5px] font-semibold text-[#10233f]">{name}</span>
                        <span className="rounded-full border border-[#bad6f4] bg-white px-1.5 py-0.5 text-[9px] font-medium text-[#0b4f91]">완료</span>
                        <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-medium text-[#0b4f91]">
                          {open ? "접기" : "내용 보기"} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
                        </span>
                      </button>
                      {open ? (
                        <div className="border-t border-[#cfe0f1] bg-white px-2.5 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-[#0b4f91]">
                            {a.task === "sms" ? <MessageSquare className="h-3 w-3" /> : <ClipboardCheck className="h-3 w-3" />}
                            {a.task === "sms" ? "발송된 문자 원문" : "등록된 접촉이력"}
                          </div>
                          {a.task === "contact" ? (() => {
                            const exp = followup.vocExp ?? "일반 문의"
                            const items = followup.contactItems ?? selected.contactTypes.map((ct) => ({ label: `${ct.major} › ${ct.middle} › ${ct.minor}`, body: ct.draft ?? selected.summary }))
                            return (
                              <div className="space-y-2">
                                {items.map((it, i) => (
                                  <div key={i}>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10.5px] font-semibold text-[#10233f]">{i + 1}. {it.label}</span>
                                      <span className={cn("ml-auto shrink-0 rounded-full border px-1.5 py-0.5 text-[8.5px] font-semibold", exp === "불만 VoC" ? "border-slate-500 bg-slate-600 text-white" : "border-slate-300 bg-slate-100 text-slate-600")}>{exp}</span>
                                    </div>
                                    {it.body ? <p className="mt-0.5 whitespace-pre-line pl-3.5 text-[10.5px] leading-4 text-muted-foreground">{it.body}</p> : null}
                                  </div>
                                ))}
                              </div>
                            )
                          })() : (
                            <p className="whitespace-pre-line text-[11px] leading-5 text-[#10233f]">{content}</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : role === "admin" ? (
                    <div key={a.task} className="flex min-h-[40px] w-full items-center gap-2 rounded-lg border border-[#eef1f6] bg-[#fafbfd] px-2.5 py-2">
                      <a.icon className="h-3.5 w-3.5 shrink-0 text-[#b3bdca]" />
                      <span className="text-[11.5px] font-medium text-[#9aa6b6]">{name}</span>
                      <span className="ml-auto rounded-md border border-[#e2e8f0] bg-[#f1f3f7] px-2.5 py-1 text-[10px] font-semibold text-[#b3bdca]">{a.task === "sms" ? "미발송" : "미등록"}</span>
                    </div>
                  ) : (
                    <Link
                      key={a.task}
                      href={`/post-consultation?task=${a.task}&id=${selected.id}`}
                      onClick={() => onSelect(selected.id)}
                      className="group flex min-h-[40px] w-full items-center gap-2 rounded-lg border border-[#e2eaf4] bg-white px-2.5 py-2 transition-colors hover:border-[#bad6f4] hover:bg-[#f7fafe]"
                    >
                      <a.icon className="h-3.5 w-3.5 shrink-0 text-[#5b6b80]" />
                      <span className="text-[11.5px] font-medium text-[#10233f]">{name}</span>
                      <span className="ml-auto rounded-md border border-[#bad6f4] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#0b4f91] transition-colors group-hover:border-[#005bac] group-hover:bg-[#005bac] group-hover:text-white">{cta}</span>
                    </Link>
                  )
                })}
              </div>
            </Section>

            <Section icon={AlertTriangle} title="민원 전이 위험도 · 주의사항">
              {(() => { const risk = predictRisk(selected); const cautions = profile ? profile.actions.map((a) => a.label) : cautionsOf(selected); return (
                <div className="space-y-2.5">
                  {/* 민원 전이 위험도 */}
                  <div>
                    <div className="mb-1 text-[9.5px] font-bold text-muted-foreground">민원 전이 위험도</div>
                    <div className="flex items-center gap-2">
                      <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold", RISK_TONE[risk.level])}>{risk.level}</span>
                      <span className="text-[10px] leading-4 text-muted-foreground">{risk.reason}</span>
                    </div>
                  </div>
                  {/* 상담 주의사항 */}
                  <div>
                    <div className="mb-1 text-[9.5px] font-bold text-muted-foreground">상담 주의사항</div>
                    <ul className="space-y-0.5">
                      {cautions.map((label) => (
                        <li key={label} className="flex gap-1.5 text-[10.5px] leading-4 text-[#33445c]">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#94a3b8]" />{label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) })()}
            </Section>

            {timeline.length > 0 ? (
              <Section icon={ClipboardList} title={`동일 고객 상담 이력 (${timeline.length})`}>
                <div className="pt-0.5">
                  {timeline.map((c, i) => {
                    const last = i === timeline.length - 1
                    // 후속건은 '부모건이 목록에 있을 때만' 브랜치로 표시(부모 없으면 일반 항목)
                    const branch = isBranchId(c.id) && timelineIds.has(c.id.replace(/-t\d+$/, ""))
                    const current = c.id === selected.id
                    return (
                      <button key={c.id} type="button" onClick={() => { onSelect(c.id); router.push(`/post-consultation?id=${c.id}`) }} className="group flex w-full gap-2 text-left">
                        {/* 타임라인 레일 — 원장(부모)만 도트, 후속건은 도트 없이 세로선만 이어 원장 라인 유지 */}
                        <div className="flex w-2 shrink-0 flex-col items-center">
                          {branch ? (
                            !last ? <span className="w-px flex-1 bg-[#e2eaf4]" /> : null
                          ) : (
                            <>
                              {/* 현재 보는 원장 건만 파란 도트로 현재 시점 명시(호버로 색이 바뀌지 않음), 나머지 원장은 아웃라인 */}
                              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full border-2", current ? "border-[#005bac] bg-[#005bac]" : "border-[#bad6f4] bg-white")} />
                              {!last ? <span className="w-px flex-1 bg-[#e2eaf4]" /> : null}
                            </>
                          )}
                        </div>
                        <div className={cn("min-w-0 flex-1 px-2 py-1", !last && "mb-1", branch && "ml-3")}>
                          <span className="flex items-center gap-1 truncate text-[11px] font-medium text-[#10233f]">
                            {branch ? <span className={cn("shrink-0", current ? "text-[#005bac]" : "text-[#94a3b8]")}>↳</span> : null}
                            {c.date.replace(/-/g, ".")} · {c.topics.join(", ")}
                          </span>
                          <span className="block text-[9.5px] font-mono text-muted-foreground underline-offset-2 group-hover:text-[#0b4f91] group-hover:underline">{c.id}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Section>
            ) : null}

            {/* 카드 최하단 — 상담 내용 AI 검수 요약 + 2차 검수 진입 */}
            <Section icon={ShieldCheck} title="상담 내용 검수">
              {(() => {
                const orig = reviewOf(selected)
                const rv = effAdminOf(orig, followup)
                // 검수 대기(오늘 일괄 검수 전) — 김민준
                if (rv.ai === "검수중") {
                  return (
                    <div className="flex items-center gap-2.5 rounded-lg border border-[#dbe5f1] bg-[#f7fafe] px-3 py-3">
                      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-sky-500" />
                      <div className="leading-tight">
                        <div className="text-[11.5px] font-semibold text-[#10233f]">AI 검수 대기</div>
                        <div className="text-[10px] text-muted-foreground">업무 종료 후 일괄 검수가 진행됩니다.</div>
                      </div>
                    </div>
                  )
                }
                const detected = rv.ai === "감지"
                const effAdmin = role === "admin" && rv.pending ? "검토필요" : rv.admin
                // 진행 상태 바(stepper) — 검토필요 → (조치필요 → 조치완료) → 검토완료/종결
                const acted = !!followup.actionDone
                const closed = !!followup.adminClosed
                const smsRecId = selected.id === FOLLOWUP_BASE_ID ? FOLLOWUP_REC_ID : dummyFollowupId(selected)
                // 조치 완료 옆에 붙는 정정문자 재발송 이력 링크
                const smsHistLink = (
                  <Link
                    href={`/post-consultation?id=${smsRecId}&view=sms`}
                    onClick={(e) => e.stopPropagation()}
                    className="ml-0.5 shrink-0 text-[9.5px] font-medium text-[#0b4f91] underline-offset-2 hover:underline"
                  >
                    (정정문자 재발송 / <span className="font-mono">{smsRecId}</span>)
                  </Link>
                )
                const steps: { label: string; state: "done" | "current"; extra?: ReactNode }[] = []
                if (effAdmin === "검토필요") {
                  steps.push({ label: "검토 필요", state: "current" })
                } else if (orig.admin === "필요") {
                  steps.push({ label: "검토 필요", state: "done" })
                  if (!acted) {
                    steps.push({ label: "조치 필요", state: "current" })
                  } else if (!closed) {
                    steps.push({ label: "조치 필요", state: "done" }, { label: "조치 완료", state: "current", extra: smsHistLink })
                  } else {
                    steps.push({ label: "조치 필요", state: "done" }, { label: "조치 완료", state: "done", extra: smsHistLink }, { label: "검토 완료 · 종결", state: "current" })
                  }
                } else if (orig.admin === "완료") {
                  // 시드 조치완료 건 — 전체 경로(검토필요 → 조치필요 → 조치완료) 표시
                  steps.push({ label: "검토 필요", state: "done" }, { label: "조치 필요", state: "done" }, { label: "조치 완료", state: closed ? "done" : "current", extra: smsHistLink })
                  if (closed) steps.push({ label: "검토 완료 · 종결", state: "current" })
                } else if (orig.admin === "이관") {
                  steps.push({ label: "검토 필요", state: "done" }, { label: "고객서비스 이관", state: "current" })
                } else {
                  steps.push({ label: "검토 필요", state: "done" }, { label: "검토 완료 · 종결", state: "current" })
                }
                // AI 1차 + 휴먼 2차를 한 박스에. 박스 클릭 시 결과 화면으로 이동
                return (
                  <>
                  {/* 진행 상태 바 */}
                  <div className="mb-2 flex flex-wrap items-center gap-x-1 gap-y-1">
                    {steps.map((s, i) => (
                      <Fragment key={s.label}>
                        {i > 0 ? <ChevronRight className="h-3 w-3 shrink-0 text-[#c3ccd8]" /> : null}
                        <span className="inline-flex items-center gap-1">
                          <span className={cn("flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold", s.state === "current" ? "bg-[#0b4f91] text-white" : "border border-[#94a3b8] bg-white text-[#94a3b8]")}>
                            {s.state === "done" ? <Check className="h-2.5 w-2.5" /> : i + 1}
                          </span>
                          <span className={cn("text-[10px] leading-none", s.state === "current" ? "font-bold text-[#0b4f91]" : "font-medium text-[#64748b]")}>{s.label}</span>
                          {s.extra}
                        </span>
                      </Fragment>
                    ))}
                    {/* 검토가 이뤄진 건은 우측 정렬로 검토자 표기 */}
                    {effAdmin !== "검토필요" ? <span className="ml-auto shrink-0 text-[9.5px] text-muted-foreground">(검토자 박관리)</span> : null}
                  </div>
                  <Link
                    href={`/post-consultation?task=audit-result&id=${selected.id}`}
                    className={cn("block rounded-lg border px-3 py-2.5 transition-colors", detected ? "border-[#bad6f4] bg-[#f2f8ff] hover:bg-[#e3f0fc]" : "border-[#dbe5f1] bg-[#f7fafe] hover:bg-[#eef4fb]")}
                  >
                    {/* 상단 — 감지 결과 + 휴먼검수 상태(조치 필요 강조) */}
                    <div className="flex items-center gap-2">
                      {detected ? <AlertCircle className="h-4 w-4 shrink-0 text-[#0b4f91]" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-[#64748b]" />}
                      <span className="text-[11.5px] font-semibold text-[#10233f]">{detected ? "오안내·안내 누락 감지" : "검출 항목 없음 · 통과"}</span>
                      <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 self-center text-[10px] font-medium text-[#0b4f91]">결과 보기 <ArrowRight className="h-3 w-3" /></span>
                    </div>
                    {/* 하단 — 감지 건수 칩 + 심각도 + 검토자 */}
                    {detected ? (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-6">
                        {rv.guideN > 0 ? <span className="rounded-md border border-[#e2eaf4] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#33445c]">오안내 {rv.guideN}건</span> : null}
                        {rv.workN > 0 ? <span className="rounded-md border border-[#e2eaf4] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#33445c]">안내 누락 {rv.workN}건</span> : null}
                        {rv.severity ? (
                          <span className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-semibold", rv.severity === "심각" ? "border-red-200 bg-red-50 text-red-600" : "border-[#d4dbe6] bg-[#f4f6f9] text-[#64748b]")}>{rv.severity}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </Link>
                  </>
                )
              })()}
            </Section>
          </div>
          </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

function Row({ c, selected, onSelect, grouped, compact, isAdmin, role, fu }: { c: Consultation; selected: boolean; onSelect: (id: string) => void; grouped?: boolean; compact?: boolean; isAdmin?: boolean; role?: "agent" | "admin"; fu?: Followup }) {
  const done = c.status === "리뷰 완료"
  // 후속 작업 처리 상태(localStorage) 반영 — 등록/발송 시 칩도 완료로 전환
  const contactDone = contactDoneOf(c) || !!fu?.contactRegistered
  const smsSent = fu?.smsSent || smsStateOf(c) === "발송"
  const rv = effAdminOf(reviewOf(c), fu) // 상담 내용 검수(AI 1차 / 관리자 2차) + 후속조치 진행 반영
  const auditable = rv.ai !== "검수중" // 검수 완료(통과·감지) → 결과 페이지 진입 가능
  const auditHref = `/post-consultation?task=audit-result&id=${c.id}`
  const [auditHover, setAuditHover] = useState(false) // 검수 두 셀(AI·휴먼) 공통 호버
  // 접촉이력·SMS·2차검수 전부 완료된 건만 행 전체 음영(그 외 흰색)
  // SMS 미요청 = 발송 불필요 → 완료로 간주(발송요청 대기만 미완료)
  const allDone = contactDone && smsStateOf(c) !== "요청" && done
  return (
    <tr
      onClick={() => onSelect(c.id)}
      className={cn("group cursor-pointer border-t border-[#eef3f9] align-middle text-[11.5px] transition-colors", selected && compact ? "bg-[#f2f8ff]" : allDone ? "bg-[#f8fbff]" : "hover:bg-[#f7fafe]")}
    >
      <td className={cn("whitespace-nowrap px-3 py-1.5", grouped && "pl-5")}>
        <div className="text-[10.5px] font-semibold text-[#10233f]">{c.date.replace(/-/g, ".")} ({weekdayOf(c.date)})</div>
        <div className="text-[9.5px] text-muted-foreground">{c.time.slice(11)}</div>
      </td>
      {compact ? (
        <>
          <td className="whitespace-nowrap px-3 py-1.5"><span className="font-mono text-[10px] font-semibold text-[#10233f]">{c.id}</span></td>
          <td className="whitespace-nowrap px-3 py-1.5">
            <div className="font-semibold text-[#10233f]">{c.customer}</div>
            <div className="text-[10px] text-muted-foreground">{c.customerNo}</div>
          </td>
          <td className="w-full px-3 py-1.5">
            <div className="flex flex-wrap gap-1">
              {c.keywords.slice(0, 4).map((k) => (
                <span key={k} className="rounded border border-[#dbe5f1] bg-[#f7fafe] px-1.5 py-0.5 text-[9px] text-[#0b4f91]">#{k}</span>
              ))}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{shortSummary(c)}</div>
          </td>
        </>
      ) : (
        <>
          <td className="whitespace-nowrap pl-3 pr-5 py-1.5"><span className="font-mono text-[10px] font-semibold text-[#10233f]">{c.id}</span></td>
          {isAdmin ? (
            <td className="whitespace-nowrap pl-3 pr-1 py-1.5">
              <div className="font-medium text-[#10233f]">{consultAgent(c)}</div>
              <div className="font-mono text-[9px] text-muted-foreground">{agentEmpNo(consultAgent(c))}</div>
            </td>
          ) : null}
          <td className="whitespace-nowrap pl-1 pr-3 py-1.5 text-[10.5px] text-[#33445c]">{c.channel}</td>
          <td className="whitespace-nowrap pl-3 pr-2 py-1.5">
            <div className="font-semibold text-[#10233f]">{c.customer}</div>
            <div className="text-[10px] text-muted-foreground">{c.customerNo}</div>
          </td>
          {/* 상담 요약: 키워드(최대 4개, 1줄) + 간단 요약(○○ 문의) */}
          <td className="overflow-hidden px-2 py-1.5">
            <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
              {c.keywords.slice(0, 4).map((k) => (
                <span key={k} className="shrink-0 rounded border border-[#dbe5f1] bg-[#f7fafe] px-1.5 py-0.5 text-[9px] text-[#0b4f91]">#{k}</span>
              ))}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{shortSummary(c)}</div>
          </td>
          {/* 후속 업무(접촉이력·SMS) — 후속조치 진행 모니터링 */}
          <td className="whitespace-nowrap border-l border-[#eef3f9] px-2 py-1.5 text-center align-middle">
            {contactDone || role === "admin" ? (
              <DoneChip done={contactDone} doneLabel="등록완료" pendLabel="미등록" />
            ) : (
              <CellLink href={`/post-consultation?task=contact&id=${c.id}`} title="접촉이력 등록 화면으로 이동">
                <DoneChip done={false} doneLabel="등록완료" pendLabel="미등록" />
              </CellLink>
            )}
          </td>
          <td className="whitespace-nowrap px-2 py-1.5 text-center align-middle">
            {!smsSent && smsStateOf(c) === "요청" && role !== "admin" ? (
              <CellLink href={`/post-consultation?task=sms&id=${c.id}`} title="SMS 안내 작성 화면으로 이동">
                <SmsChip c={c} forceSent={false} />
              </CellLink>
            ) : (
              <SmsChip c={c} forceSent={smsSent} />
            )}
          </td>
          {/* 상담 내용 검수(메인) — 두 셀 묶음 호버 강조 · 클릭 시 검수 결과(통과 포함) */}
          <td onMouseEnter={() => auditable && setAuditHover(true)} onMouseLeave={() => setAuditHover(false)}
            className={cn("whitespace-nowrap border-l border-[#dbe5f1] p-0 text-center align-middle transition-colors", auditable && "cursor-pointer", auditable && auditHover && "bg-[#e6f0fb]")}>
            {auditable ? (
              <Link href={auditHref} onClick={(e) => e.stopPropagation()} title="상담 검수 결과 보기" className="flex h-full w-full items-center justify-center px-2.5 py-2.5">
                <AiReviewCell s={rv} />
              </Link>
            ) : <div className="px-2.5 py-1.5"><AiReviewCell s={rv} /></div>}
          </td>
          <td onMouseEnter={() => auditable && setAuditHover(true)} onMouseLeave={() => setAuditHover(false)}
            className={cn("whitespace-nowrap p-0 text-center align-middle transition-colors", auditable && "cursor-pointer", auditable && auditHover && "bg-[#e6f0fb]")}>
            {auditable ? (
              <Link href={auditHref} onClick={(e) => e.stopPropagation()} title="상담 검수 결과 보기" className="flex h-full w-full items-center justify-center px-2.5 py-2.5">
                <AdminReviewCell s={role === "admin" && rv.pending ? { ...rv, admin: "검토필요" } : rv} />
              </Link>
            ) : <div className="px-2.5 py-1.5"><AdminReviewCell s={rv} /></div>}
          </td>
        </>
      )}
    </tr>
  )
}

// 차분한 상태 표기 — 작은 점 + 중립 라벨. 색은 의미별(완료=그린, 대기=앰버, 조치=레드, 중립=그레이)로 최소화
function StatusTag({ tone, label, pulse }: { tone: "neutral" | "done" | "pending" | "action"; label: string; pulse?: boolean }) {
  const dot = tone === "action" ? "bg-red-500" : tone === "pending" ? "bg-slate-400" : tone === "done" ? "bg-emerald-500" : "bg-slate-300"
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10px]">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot, pulse && "animate-pulse")} />
      <span className={tone === "action" ? "font-semibold text-red-600" : "text-[#475569]"}>{label}</span>
    </span>
  )
}
function DoneChip({ done, doneLabel, pendLabel }: { done: boolean; doneLabel: string; pendLabel: string }) {
  return <StatusTag tone={done ? "done" : "pending"} label={done ? doneLabel : pendLabel} />
}
// 테이블 셀의 미처리 후속업무/검수 결과를 클릭하면 해당 처리·검수 화면으로 바로 이동(행 선택과 분리 — 호버 시 화살표로 안내)
function CellLink({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      title={title}
      className="group/cl relative inline-flex items-center gap-0.5 underline-offset-[3px] hover:underline"
    >
      {children}
      <ArrowRight className="h-2.5 w-2.5 shrink-0 text-[#0b4f91] opacity-0 transition-opacity group-hover/cl:opacity-70" />
    </Link>
  )
}

function Th({ children, center, wide, divide }: { children: React.ReactNode; center?: boolean; wide?: boolean; divide?: boolean }) {
  return <th className={cn("py-2 font-semibold", wide ? "w-full px-3" : center ? "px-1.5 text-center" : "px-3", divide && "border-l border-[#dbe5f1]")}>{children}</th>
}

function Section({ icon: Icon, title, children }: { icon: ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[#e3e9f1] px-14 py-6">
      <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold text-[#0b4f91]">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      {children}
    </div>
  )
}

function ChartStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-1.5 py-1.5 text-center">
      <div className="text-[9px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[11px] font-bold text-[#10233f]">{value}</div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2eaf4] bg-[#f7fafe] px-2 py-1">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-[12.5px] font-bold text-[#10233f]">{value}</span>
    </span>
  )
}


// 상담 건에서 검수 결과 파생(안내검수=오안내 / 업무검수=누락)
type AuditVerdict = "정상" | "주의" | "위반"
const AUDIT_RANK: Record<string, number> = { 통과: 0, 정상: 0, 주의: 1, 위반: 2 }
function guideAuditOf(c: Consultation): { verdict: AuditVerdict; note: string } {
  const items = c.audit.filter((a) => a.label.includes("오안내") || a.label.includes("정확"))
  let worst: AuditResult = "통과"
  let note = "사실과 다른 안내가 검출되지 않았습니다."
  for (const it of items) if ((AUDIT_RANK[it.result] ?? 0) > (AUDIT_RANK[worst] ?? 0)) { worst = it.result; note = it.note }
  return { verdict: (worst === "통과" ? "정상" : worst) as AuditVerdict, note }
}
function workAuditOf(c: Consultation): { verdict: AuditVerdict; note: string; missing: string[] } {
  const items = c.audit.filter((a) => a.label.includes("누락"))
  let worst: AuditResult = "통과"
  let note = "업무 누락이 검출되지 않았습니다."
  for (const it of items) if ((AUDIT_RANK[it.result] ?? 0) > (AUDIT_RANK[worst] ?? 0)) { worst = it.result; note = it.note }
  const missing = c.processing.filter((p) => p.status.includes("대기") || p.status.includes("미")).map((p) => p.item)
  return { verdict: (worst === "통과" ? "정상" : worst) as AuditVerdict, note, missing }
}
function VerdictChip({ verdict }: { verdict: AuditVerdict }) {
  const tone =
    verdict === "위반" ? "border-red-200 bg-red-50 text-red-600" : verdict === "주의" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
  return <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium", tone)}>{verdict}</span>
}
// 검수 판정을 심각도(통과/경미/심각)로 표기
function SeverityChip({ verdict }: { verdict: AuditVerdict }) {
  if (verdict === "정상") return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> 통과</span>
  const severe = verdict === "위반"
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", severe ? "border-red-300 bg-red-100 text-red-700" : "border-amber-300 bg-amber-100 text-amber-700")}><AlertCircle className="h-3 w-3" /> {severe ? "심각" : "경미"}</span>
}

// 안내검수(오안내) / 업무검수(업무누락) — 통과 / N건 감지로 통일
function guideCountOf(c: Consultation): number {
  const { verdict } = guideAuditOf(c)
  if (verdict === "정상") return 0
  return Math.max(1, c.audit.filter((a) => (a.label.includes("오안내") || a.label.includes("정확")) && a.result !== "통과").length)
}
function workCountOf(c: Consultation): number {
  return workAuditOf(c).verdict === "정상" ? 0 : Math.max(1, workAuditOf(c).missing.length)
}
function shortSummary(c: Consultation): string {
  return `${c.topics.join(", ")} 문의`
}
// AI 예상 민원 전이 위험 — 고객 톤·민감 키워드·문의 유형 기준(데모: 키워드 휴리스틱)
type RiskLevel = "저위험" | "중위험" | "고위험"
function predictRisk(c: Consultation): { level: RiskLevel; reason: string } {
  const text = `${c.topics.join(" ")} ${c.keywords.join(" ")} ${c.summary}`
  if (c.customer === "김민준")
    return { level: "중위험", reason: "보험금 청구 서류(세부내역서 등) 미제출 — 추가 서류 재안내 필요 정황, 처리 지연 시 불만 전이 주의" }
  if (/불만|항의|민원|법적|소송|금융감독|폭언|강하게|화가/.test(text))
    return { level: "고위험", reason: "강한 불만·항의 정황과 민감 키워드 감지 — 응대 톤 격앙, 외부기관 전이 가능성" }
  if (/청구|서류|세부내역서|진단서|보완|미제출/.test(text))
    return { level: "중위험", reason: "보험금 청구 서류 미비 — 추가 서류 재안내 필요 정황, 처리 지연 시 불만 전이 주의" }
  if (/해지|환급|오안내|누락|지연|부지급|실효|미납|정정/.test(text))
    return { level: "중위험", reason: "해지·환급/지연 등 민감 키워드와 정정·재안내 정황 — 응대 톤 보통, 전이 주의" }
  return { level: "저위험", reason: "단순 문의 중심, 응대 톤 안정 — 전이 가능성 낮음" }
}
const RISK_TONE: Record<RiskLevel, string> = {
  저위험: "border-slate-200 bg-slate-50 text-slate-500",
  중위험: "border-slate-300 bg-slate-100 text-slate-600",
  고위험: "border-slate-500 bg-slate-600 text-white",
}
// 상담 주의사항 — 프로필이 없는 일반 상담에도 표시할 기본 주의사항(키워드 기반)
function cautionsOf(c: Consultation): string[] {
  const text = `${c.topics.join(" ")} ${c.keywords.join(" ")} ${c.summary}`
  const list: string[] = []
  if (/해지|환급/.test(text)) list.push("해지 시 보장 종료·동일 조건 재가입 제한을 반드시 고지")
  if (/환급률|오안내|정정/.test(text)) list.push("환급률 등 수치·조건은 약관·가입 경과 연수 기준으로 재확인 후 안내")
  if (/청구|서류|세부내역서|보완/.test(text)) list.push("보험금 청구 구비서류 완비 여부 확인 후 안내")
  if (/납입|미납|실효|자동이체|수금/.test(text)) list.push("납입·실효 관련 안내 시 처리 기한과 재개 조건 정확히 고지")
  list.push("응대 톤·감정 상태를 모니터링하고, 불만 고조 시 상급자·담당 부서로 연계")
  return list.slice(0, 3)
}

// 데모 대상 상담(실시간 상담 직후 건) — 접촉이력/SMS는 실제 처리(followup) 전까지 미처리로 고정
const DEMO_CONSULT_ID = "CL-20260514-018"

// 후속업무(접촉이력/SMS) — 날짜 순서 기반: 과거는 완료, 최근 일부만 미처리
const CONSULT_DATE_RANK: Record<string, number> = Object.fromEntries(
  [...CONSULTATIONS].sort((a, b) => (a.date < b.date ? 1 : -1)).map((c, i) => [c.id, i]),
)
// 오늘 건의 시간 내림차순 순위(0 = 가장 최근) — 상위 N건만 미처리 표시에 사용
const TODAY_TIME_RANK: Record<string, number> = Object.fromEntries(
  CONSULTATIONS.filter((c) => c.date === TODAY)
    .sort((a, b) => (a.time < b.time ? 1 : a.time > b.time ? -1 : 0))
    .map((c, i) => [c.id, i]),
)
const followRank = (c: Consultation) => CONSULT_DATE_RANK[c.id] ?? 99
function contactDoneOf(c: Consultation): boolean {
  if (c.id === FOLLOWUP_REC_ID) return false // 후속 재안내 이력 — 접촉이력 등록한 적 없음
  if (c.id === DEMO_CONSULT_ID) return false // 등록화면에서 직접 등록해야만 완료(followup이 별도 반영)
  if (c.date === TODAY) return (TODAY_TIME_RANK[c.id] ?? 0) >= 3 // 최근 상위 3건만 미등록, 나머지 등록완료
  return followRank(c) >= 3 // 최근 3건만 미등록
}
function smsStateOf(c: Consultation): "미요청" | "요청" | "발송" {
  if (c.id === FOLLOWUP_REC_ID) return "발송" // 후속 재안내 이력 — 방금 정정 문자 발송 완료
  if (c.id === DEMO_CONSULT_ID) return "요청" // 발송화면에서 직접 발송해야만 완료(followup이 별도 반영)
  if (c.date === TODAY) {
    const r = TODAY_TIME_RANK[c.id] ?? 0
    if (r < 3) return "요청" // 최근 상위 3건 발송요청
    if (r % 3 === 1) return "미요청" // 중간중간 미요청
    return "발송"
  }
  const r = followRank(c)
  if (r < 2) return "요청" // 최근 2건 발송요청
  if (r % 6 === 5) return "미요청" // 과거 일부 미요청
  return "발송"
}

// 상담 내용 검수 — AI 1차 검수(검수중/통과/오안내·안내누락 감지) → 관리자 2차 검수(조치 필요/완료)
type AdminState = "검토필요" | "검수완료" | "필요" | "완료" | "이관"
// pending: 관리자 2차 검토 대기(관리자에겐 '검토 필요', 상담사에겐 admin 값 그대로 노출)
type ReviewState = { ai: "검수중" | "통과" | "감지"; guideN: number; workN: number; admin: AdminState | null; severity?: "경미" | "심각"; pending?: boolean }
// 데모 다양성: 감지 + 휴먼 검수 결과(조치 필요/완료/관리자 이관)가 섞이도록 일부(작일 이전) 상담을 큐레이션
const REVIEW_OVERRIDES: Record<string, ReviewState> = {
  "CL-20260513-027": { ai: "감지", guideN: 1, workN: 1, admin: "필요", severity: "심각" }, // 정해린 — 관리자가 조치 필요 통보 → 상담사 후속조치 → 조치 완료 → 관리자 검토 완료 종결(데모 시나리오)
  "CL-20260513-097": { ai: "감지", guideN: 2, workN: 0, admin: "검토필요", severity: "심각", pending: true }, // 김민준 과거 건 — AI 감지, 휴먼검수 전(백지·코멘트 없음)
  "CL-20260512-066": { ai: "감지", guideN: 0, workN: 1, admin: "이관", severity: "경미" }, // 안내누락 1 → 관리자 이관
  "CL-20260512-070": { ai: "감지", guideN: 1, workN: 1, admin: "완료", severity: "심각" }, // 오안내·안내누락 복합 → 조치 완료
}
function reviewOf(c: Consultation): ReviewState {
  // 데모 큐레이션 건(정해린 027 등)은 날짜 규칙보다 우선 — 항상 고정된 검수 상태로 노출
  const ov = REVIEW_OVERRIDES[c.id]
  if (ov) return ov
  // 오늘 상담은 업무 종료 후 일괄 검수 → AI 검수 미완료 건은 'AI 검수 중'(휴먼 검수 전)
  // 후속 재안내 이력(오늘 생성)도 동일하게 검수 대기로 표기
  if (c.date === TODAY) return { ai: "검수중", guideN: 0, workN: 0, admin: null } // 검수는 매일 상담 종료 후 배치 → 오늘 건은 전부 검수 대기
  // 일괄 검수 완료 더미(센터 전체) — id 해시 기반 분포(약 90% 통과 / 약 10% 감지)
  if (c.audited) {
    let h = 0; for (const ch of c.id) h = (h * 31 + ch.charCodeAt(0)) % 100000
    if (h % 10 !== 0) return { ai: "통과", guideN: 0, workN: 0, admin: null } // 약 90% 통과
    // 약 10% 감지 → 오안내/누락 건수 다양화 + 휴먼 검수 분포(검토완료·조치완료·이관·최근 일부 조치필요)
    const COMBOS: [number, number][] = [[1, 0], [2, 0], [0, 1], [0, 2], [1, 1], [2, 1], [1, 2], [2, 2]]
    const [guideN, workN] = COMBOS[Math.floor(h / 10) % COMBOS.length]
    const severe = guideN + workN >= 2
    const recent = c.date >= remapDate("2026-05-12") // 오늘-2 이상(비교적 최신)
    const r = Math.floor(h / 100) % 100
    const admin: AdminState =
      recent && r < 25 ? "필요" // 최근 감지 중 일부: 상담사 조치 필요(미조치)
        : r < 55 ? "검수완료" // 절반가량: 검토 완료(조치 불필요)
        : r < 82 ? "완료" // 조치 완료
        : "이관" // 고객서비스 이관
    return { ai: "감지", guideN, workN, admin, severity: severe ? "심각" : "경미" }
  }
  // 작일 이전(목요일=오늘 이전) 건은 일괄 검수 완료 상태 — '검수 중' 없이 통과/감지로만 표기
  const guideN = guideCountOf(c)
  const workN = workCountOf(c)
  if (guideN + workN > 0) {
    const r = followRank(c) % 4
    const admin: AdminState = r === 0 ? "완료" : r === 1 ? "필요" : r === 2 ? "이관" : "검수완료" // 감지 → 휴먼 검수: 조치 완료/필요/관리자 이관/검토 완료(조치 불필요)
    return { ai: "감지", guideN, workN, admin, severity: guideN + workN >= 2 ? "심각" : "경미" }
  }
  return { ai: "통과", guideN: 0, workN: 0, admin: null } // 통과 → 검수 생략(휴먼 검수 공란)
}
// 상담 내용 검수 — 후속업무(점+라벨)와 구분되게 '태그(필)' 형식. 라이트 톤·각진형으로 차분하게
// AI 검수 — 블루 계열 태그(검수대기/통과/감지 건수) + 감지 시 경미·심각 배지를 오버랩
function AiReviewCell({ s }: { s: ReviewState }) {
  if (s.ai === "검수중")
    return <span className="inline-flex items-center gap-1 rounded-sm border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-500"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" /> 검수 대기</span>
  if (s.ai === "통과")
    return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400"><CheckCircle2 className="h-3 w-3" /> 통과</span>
  const severe = s.severity === "심각"
  const cat = s.guideN > 0 && s.workN > 0 ? `오안내 ${s.guideN}·누락 ${s.workN}` : s.guideN > 0 ? `오안내 ${s.guideN}건` : `안내누락 ${s.workN}건`
  return (
    <span className="relative inline-flex">
      <span className="rounded-sm border border-slate-300 bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-700 whitespace-nowrap">{cat}</span>
      <span className={cn("absolute -right-1.5 -top-1.5 rounded-sm border px-1 text-[8px] font-bold leading-[1.3]", severe ? "border-red-200 bg-red-100 text-red-600" : "border-slate-300 bg-slate-100 text-slate-600")}>{s.severity ?? "경미"}</span>
    </span>
  )
}
// 휴먼 검수 — 테두리·배경 없는 '아이콘 + 텍스트' 고스트 스타일. 아이콘에만 옅은 의미색
function AdminReviewCell({ s }: { s: ReviewState }) {
  const base = "inline-flex items-center justify-center gap-1 text-[10px] font-medium text-[#475569]"
  if (s.admin === "검토필요")
    return <span className={base}><FileCheck2 className="h-3.5 w-3.5 text-[#0b4f91]" /> 검토 필요</span>
  if (s.admin === "검수완료")
    return <span className={base}><CheckCircle2 className="h-3.5 w-3.5 text-slate-400" /> 검토 완료</span>
  if (s.admin === "필요")
    return <span className={base}><AlertTriangle className="h-3.5 w-3.5 text-slate-400" /> 후속 조치 필요</span>
  if (s.admin === "완료")
    return <span className={base}><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 조치 완료</span>
  if (s.admin === "이관")
    return <span className={base}><CheckCircle2 className="h-3.5 w-3.5 text-slate-400" /> 고객서비스 이관</span>
  return null
}
// 조치 필요 건의 실제 진행 상태(상담사 후속조치/관리자 종결을 followup에 반영) — 표/상세/검수 공통
function effAdminOf(s: ReviewState, fu?: Followup): ReviewState {
  if (s.admin !== "필요" || !fu) return s
  if (fu.adminClosed) return { ...s, admin: "검수완료" }
  if (fu.actionDone) return { ...s, admin: "완료" }
  return s
}

// 담당 상담사(데모: 상담ID 기반 안정 매핑)
const AGENT_POOL = ["김제나", "이수민", "박정우", "한도현", "최가람", "정유진"]
function consultAgent(c: Consultation): string {
  if (c.agent) return c.agent
  // 데모: 김민준 상담은 로그인 상담사(김제나)가 직접 담당 → 검토자도 본인 가능
  if (c.customer === "김민준") return "김제나"
  let h = 0
  for (const ch of c.id) h = (h + ch.charCodeAt(0)) % AGENT_POOL.length
  return AGENT_POOL[h]
}
// 센터 전체 담당 상담사 목록(관리자 필터용)
const ALL_AGENTS = Array.from(new Set(CONSULTATIONS.map(consultAgent))).sort((a, b) => a.localeCompare(b, "ko"))
// 센터(데모: 상담사명 기반 결정적 배정) — 관리자 센터별 필터용
const ALL_CENTERS = ["서울 · 잠실1센터", "서울 · 강남2센터", "경기 · 분당센터"]
function consultCenter(c: Consultation): string {
  const a = consultAgent(c)
  let h = 0; for (const ch of a) h += ch.charCodeAt(0)
  return ALL_CENTERS[h % ALL_CENTERS.length]
}
// 사번(데모: 상담사명 기반 결정적)
function agentEmpNo(name: string): string {
  let h = 0; for (const ch of name) h += ch.charCodeAt(0)
  return `E${21 + (h % 5)}${String(1000 + (h * 7) % 9000)}`
}

// 담당 상담사의 과거 상담 이력 기반 패턴 분석(큐레이션 우선, 없으면 이력에서 파생)
function agentPatternOf(c: Consultation): AgentPattern {
  const curated = AGENT_PATTERN_OVERRIDES[c.id]
  if (curated) return curated
  const agent = consultAgent(c)
  const past = CONSULTATIONS.filter((x) => consultAgent(x) === agent && x.id !== c.id)
  const counts: Record<string, number> = {}
  const history: AgentPattern["history"] = []
  for (const x of past) {
    const w = workAuditOf(x)
    w.missing.forEach((m) => (counts[m] = (counts[m] ?? 0) + 1))
    if (w.missing.length) history.push({ date: x.date, callId: x.id, missing: w.missing.join(", "), verdict: "확정 · 재교육 대상", reeducation: true })
  }
  const topMissed = Object.entries(counts).map(([item, count]) => ({ item, count })).sort((a, b) => b.count - a.count).slice(0, 3)
  const actions: AgentPattern["actions"] = topMissed.length
    ? [{ label: "재발방지 점검 등록", desc: `${topMissed[0].item} 누락이 반복 확인됨 — 재발방지 체크리스트 등록 권장`, tone: "warn" }]
    : [{ label: "이상 패턴 없음", desc: "최근 이력에서 반복 누락 패턴이 확인되지 않았습니다", tone: "info" }]
  return { windowLabel: "최근 이력", totalCalls: past.length + 1, flaggedCalls: history.length, topMissed, history: history.slice(0, 3), actions }
}

// 안내 검수 후속 조치(큐레이션 우선, 없으면 고객명 기반 일반 정정 안내로 파생)
function guideFollowupOf(c: Consultation): GuideFollowup {
  const curated = GUIDE_FOLLOWUP_OVERRIDES[c.id]
  if (curated) return curated
  return {
    correction: {
      channel: "알림톡",
      summary: "오안내된 내용을 정정하여 정확한 정보를 고객에게 재안내",
      draft: `[제논라이프] ${c.customer} 고객님, 앞서 안내드린 내용에 일부 정정이 있어 안내드립니다. 정확한 내용은 담당 상담사가 콜백으로 안내드리겠습니다. 문의 1588-0000`,
    },
    actions: [
      { label: "고객 정정 안내 발송", desc: "정정 내용을 알림톡으로 발송 + 정정 콜백 예약", tone: "warn" },
      { label: "상담사 재교육 지정", desc: "오안내 항목 관련 약관·내규 재교육 권장", tone: "warn" },
      { label: "지식카드 재숙지 알림", desc: "판정 근거 약관·내규를 담당 상담사 지식카드로 푸시", tone: "info" },
    ],
  }
}
function SmsChip({ c, forceSent }: { c: Consultation; forceSent?: boolean }) {
  const s = forceSent ? "발송" : smsStateOf(c)
  if (s === "발송") return <StatusTag tone="done" label="발송완료" />
  if (s === "요청") return <StatusTag tone="pending" label="발송요청" />
  return <StatusTag tone="neutral" label="미요청" />
}

/* ================================================================== */
/* 선택 상담 작업 — 접촉이력 / SMS / 검수                              */
/* ================================================================== */

function Detail({ data, task, initialAuditTab, fromAudit }: { data: Consultation; task: string | null; initialAuditTab?: "guide" | "task"; fromAudit?: boolean }) {
  const isAudit = task === "audit" // 오안내·누락 검수 상세(안내/업무 탭) 화면
  // 접촉이력
  const [registered, setRegistered] = useState(data.contactRegistered)
  const [reflecting, setReflecting] = useState(false) // 등록 → 상담 개요 반영 로딩
  const register = () => {
    setRegistered(true)
    setReflecting(true)
    window.setTimeout(() => setReflecting(false), 1100)
    // 등록한 접촉이력 — 유형별(대>중>소분류 + 요약)을 구조화 저장 → 이력 조회 카드에서 번호·요약으로 표시
    const items = typeList
      .filter((t) => includeRanks.has(t.rank))
      .map((t) => {
        const c = cls[t.rank] ?? { major: t.major, middle: t.middle, minor: t.minor }
        return { label: `${c.major} › ${c.middle} › ${c.minor}`, body: (bodies[t.rank] ?? "").trim() }
      })
    const text = items.map((it) => `[${it.label}]\n${it.body}`).join("\n\n")
    writeFollowup(data.id, { contactRegistered: true, contactText: text, contactItems: items, vocExp })
  }
  const [primaryRank, setPrimaryRank] = useState(data.contactTypes[0]?.rank ?? "1")
  const [includeRanks, setIncludeRanks] = useState<Set<string>>(new Set(data.contactTypes.map((t) => t.rank)))
  // 유형별 요약 초안 — 명사형 템플릿(편집 가능)
  const [bodies, setBodies] = useState<Record<string, string>>(() =>
    Object.fromEntries(data.contactTypes.map((t) => [t.rank, deriveDraftBody(t)])),
  )
  const setBody = (rank: string, val: string) => setBodies((prev) => ({ ...prev, [rank]: val }))
  // 유형 탭 + 편집 가능한 세부 분류
  const [activeTab, setActiveTab] = useState(data.contactTypes[0]?.rank ?? "1")
  const [cls, setCls] = useState<Record<string, { major: string; middle: string; minor: string }>>(() =>
    Object.fromEntries(data.contactTypes.map((t) => [t.rank, { major: t.major, middle: t.middle, minor: t.minor }])),
  )
  // 대분류 변경 시 중·소분류, 중분류 변경 시 소분류를 새 상위에 맞춰 재설정(종속)
  const setClsField = (rank: string, key: "major" | "middle" | "minor", val: string) =>
    setCls((prev) => {
      const cur = prev[rank] ?? { major: MAJORS[0], middle: "", minor: "" }
      let next = { ...cur, [key]: val }
      if (key === "major") {
        const m = middlesOf(val)[0] ?? ""
        next = { major: val, middle: m, minor: minorsOf(val, m)[0] ?? "" }
      } else if (key === "middle") {
        next = { ...next, minor: minorsOf(cur.major, val)[0] ?? "" }
      }
      return { ...prev, [rank]: next }
    })
  // 편집 가능한 유형 목록(제목 수정 · 추가)
  const [typeList, setTypeList] = useState<ContactType[]>(data.contactTypes)
  const [editingTab, setEditingTab] = useState<string | null>(null)
  const renameType = (rank: string, title: string) => setTypeList((prev) => prev.map((t) => (t.rank === rank ? { ...t, title } : t)))
  const addType = () => {
    const rank = `new-${typeList.length + 1}`
    const major0 = MAJORS[0]
    const middle0 = middlesOf(major0)[0] ?? ""
    const minor0 = minorsOf(major0, middle0)[0] ?? ""
    const nt: ContactType = { rank, title: "새 유형", weight: "—", importance: "보통", major: major0, middle: middle0, minor: minor0 }
    setTypeList((prev) => [...prev, nt])
    setCls((prev) => ({ ...prev, [rank]: { major: nt.major, middle: nt.middle, minor: nt.minor } }))
    setBodies((prev) => ({ ...prev, [rank]: "[고객 문의] \n- " }))
    setIncludeRanks((prev) => new Set(prev).add(rank))
    setActiveTab(rank)
    setEditingTab(rank)
  }
  const isMulti = typeList.length > 1

  // 접촉이력 등록: 종료된 상담 분석 → 단계별 자동 생성 연출(0=분석중 … 4=완료)
  const [genStep, setGenStep] = useState(0)
  useEffect(() => {
    if (task !== "contact") {
      setGenStep(4)
      return
    }
    setGenStep(0)
    const timers: number[] = []
    ;[800, 1750, 2700, 3650].forEach((ms, i) => timers.push(window.setTimeout(() => setGenStep(i + 1), ms)))
    return () => timers.forEach((id) => window.clearTimeout(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id, task])
  const genSummaryReady = genStep >= 1
  const genTypesReady = genStep >= 2
  const genDraftReady = genStep >= 3
  const genFollowReady = genStep >= 4
  const genDone = genStep >= 4

  const [showTranscript, setShowTranscript] = useState(true)
  const [showFollow, setShowFollow] = useState(false) // 후속 조치 — 기본 접힘(헤더만)
  const [overall, setOverall] = useState(data.summary)
  const [editOverall, setEditOverall] = useState(false)
  const [vocExp, setVocExp] = useState<"일반 문의" | "불만 VoC">("일반 문의") // 접촉이력 — 고객 경험(기본: 일반 문의)
  const [openType, setOpenType] = useState<string | null>(null) // 상담개요에서 펼친 유형
  // 해당 토픽 시작 지점 대화로 원문 자동 스크롤(닫혀 있으면 펼친 뒤)
  const scrollToSeg = (rank: string) => {
    if (!data.transcript.some((t) => t.seg === rank)) return
    setShowTranscript(true)
    window.setTimeout(() => document.getElementById(`seg-${data.id}-${rank}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60)
  }
  const fmtMS = (min: number) => `${String(Math.max(0, Math.round(min))).padStart(2, "0")}:00` // 통화 시작 기준 상대시간
  // 전체 통화시간 내 토픽 발생 구간
  const callTimes = data.transcript.map((t) => hmToMin(t.time))
  const callStart = callTimes.length ? Math.min(...callTimes) : 0
  const callEnd = callTimes.length ? Math.max(...callTimes) : 0
  const callTotal = Math.max(1, callEnd - callStart)
  const segSpan = (rank: string) => {
    const lines = data.transcript.filter((t) => t.seg === rank)
    if (!lines.length) return null
    const s = hmToMin(lines[0].time)
    const e = hmToMin(lines[lines.length - 1].time)
    return { left: ((s - callStart) / callTotal) * 100, width: Math.max(12, ((e - s) / callTotal) * 100), startT: lines[0].time, endT: lines[lines.length - 1].time }
  }
  const history = CONSULTATIONS.filter((c) => c.customerNo === data.customerNo).sort((a, b) => (a.date < b.date ? 1 : -1))
  const toggleInclude = (rank: string) => {
    setIncludeRanks((prev) => {
      const n = new Set(prev)
      if (n.has(rank)) n.delete(rank)
      else n.add(rank)
      return n
    })
    // 우선 등록 유형을 해제하면 다른 유형으로 우선 지정 이동
    setPrimaryRank((cur) => (cur === rank ? data.contactTypes.find((t) => t.rank !== rank)?.rank ?? cur : cur))
  }

  // SMS
  const [sms, setSms] = useState("")
  const [sent, setSent] = useState(data.smsSent)
  const [sending, setSending] = useState(false) // 발송 처리 중(...) 애니메이션
  // 발송 안내용 마스킹 휴대폰 번호(고객번호 기반 데모)
  const phoneDigits = data.customerNo.replace(/\D/g, "")
  const maskedPhone = `010-${(phoneDigits.slice(2, 6) || "0000")}-••••`
  const [previewRef, setPreviewRef] = useState<Reference | null>(null) // 발췌 근거 문서 미리보기
  const [regenerating, setRegenerating] = useState(false)
  // 상담 품질검수 후속조치(정정 문자 재발송) 진입 — 직전 발송본 표시 → 재생성 후 재발송
  const correctionMode = task === "sms" && !!fromAudit
  // 직전 발송 문자 = 실제로 발송된 안내 초안(정정본이 아니라 직전 발송 원문)
  const prevSentDraft = data.smsDraft
  // 문자 초안 작성 어시스턴트 — 대화형 정보 검색/검증 (실시간 데모: 메시지 순차 표시)
  type Surrender = { formula: string; breakdown: { label: string; value: string; strong?: boolean }[]; notes: string[] }
  type ChatMsg = { role: "assistant" | "user"; text: string; cites?: Reference[]; products?: { name: string; status: string }[]; calc?: Surrender; step?: { n: number; label: string } }
  const custProducts = CUSTOMERS[data.customerNo]?.products ?? []
  const surrenderInfo = custProducts.find((p) => p.surrender)?.surrender
  const surrenderRef = data.references.find((r) => r.label.includes("종신") || r.label.includes("해지"))
  const seedMsgs: ChatMsg[] = [
    { role: "assistant", step: { n: 1, label: "상담내용 및 요청 분석" }, text: `${data.customer} 고객님 상담을 분석했어요. 추가서류·자동이체·해지환급금을 순차로 문의하셨고, 통화 마무리에 해지환급금 관련 안내 문자를 요청하셨습니다.` },
    { role: "assistant", step: { n: 2, label: "정보 조회" }, text: "가입 상품을 조회했어요. 문자에 필요한 계약 정보를 확인합니다.", products: custProducts.map((p) => ({ name: p.name, status: p.status })) },
    ...(surrenderInfo
      ? [{ role: "assistant" as const, step: { n: 3, label: "근거 및 답변 작성" }, text: "해지환급금은 (무)제논종신보험 약관 기준 아래와 같이 산출됩니다.", calc: surrenderInfo, cites: surrenderRef ? [surrenderRef] : undefined }]
      : []),
    {
      role: "assistant",
      step: { n: 4, label: "초안 내용 요약" },
      text: "문자 안내에 반영할 핵심 정보입니다. 칩을 눌러 약관·매뉴얼 원문을 검증하세요.\n· 보험금 청구 — 진료비 세부내역서 미제출, 앱 제출 후 통상 3영업일 심사\n· 자동이체 — 본인 명의 계좌, 출금일 5영업일 전 신청 시 당월 적용\n· 해지환급금 — 18,420,000원 (책임준비금 − 해지공제액)",
      cites: data.references,
    },
  ]
  // 품질검수 후속조치 진입 시 — 지적사항(오안내·고지 누락) 기반 정정 재생성 시나리오
  const correctionSeed: ChatMsg[] = [
    { role: "assistant", step: { n: 1, label: "품질검수 지적사항 분석" }, text: `${data.customer} 고객님 건의 상담 품질검수 결과를 확인했어요. 직전 발송 문자에서 다음 2건이 지적되었습니다.\n· 오안내 — 해지환급금 환급률을 100%로 안내 (약관상 가입 5년 경과 기준 80%)\n· 고지 누락 — 해지 시 보장 종료·동일 조건 재가입 제한 안내 누락` },
    { role: "assistant", step: { n: 2, label: "직전 발송 문자 점검" }, text: "우측에 직전 발송된 안내 문자를 불러왔어요. 환급률 100% 표기와 보장 종료 고지 누락이 확인됩니다." },
    { role: "assistant", step: { n: 3, label: "정정 근거 확인" }, text: "약관 제22조(해지환급금)·내규 5장 3절 기준으로 환급률은 가입 5년 경과 기준 80%가 정확합니다. 해지 시 보장 종료·재가입 제한 고지도 반드시 포함되어야 합니다.", cites: surrenderRef ? [surrenderRef] : data.references.slice(0, 1) },
    { role: "assistant", step: { n: 4, label: "안내 초안 재생성 준비" }, text: "우측에 직전 발송 문자를 불러왔습니다. 가운데 ‘초안 생성’을 누르면 지적된 오안내·누락 고지를 반영해 안내 문구를 다시 생성합니다." },
  ]
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [typing, setTyping] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [tone, setTone] = useState("CX 톤 반영")
  const [tonePrompt, setTonePrompt] = useState("")
  const [sourcesReady, setSourcesReady] = useState(false) // 좌측 근거 정리 완료 → 가운데 브리지 활성화
  const [needGen, setNeedGen] = useState(false) // 반영할 새 근거가 있을 때만 생성 화살표 깜빡임
  const chatEndRef = useRef<HTMLDivElement>(null)
  const sendChat = (q: string) => {
    const text = q.trim()
    if (!text) return
    setChat((c) => [...c, { role: "user", text }])
    setChatInput("")
    setTyping(true)
    window.setTimeout(() => {
      setChat((c) => [...c, { role: "assistant", text: "관련 근거 자료에서 확인했습니다. 아래 원문으로 검증하실 수 있으며, 우측에서 톤을 골라 초안에 반영하세요.", cites: data.references }])
      setTyping(false)
      setNeedGen(true) // 새 근거 반영 필요 → 생성 화살표 다시 깜빡임
    }, 900)
  }

  // 검수 (휴먼 리뷰) — 상태 표시용
  const review = data.status === "리뷰 완료" ? "승인" : "대기"

  // 오안내·업무 누락 검수 — 건별 상세(안내/업무 분기) + 2차 검수 결과 기록
  const [auditTab, setAuditTab] = useState<"guide" | "task">(initialAuditTab ?? "guide")
  const [auditResults, setAuditResults] = useState<Record<string, { decision: "agree" | "recheck"; comment: string; at: string }>>({})
  const [commentDraft, setCommentDraft] = useState("")
  const isReviewed = (id: string) => !!auditResults[id]
  const recordAudit = (id: string, decision: "agree" | "recheck") => {
    const at = new Date().toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    setAuditResults((p) => ({ ...p, [id]: { decision, comment: commentDraft.trim(), at } }))
  }
  const clearAudit = (id: string) => setAuditResults((p) => { const n = { ...p }; delete n[id]; return n })
  // 건/탭 변경 시 코멘트 입력칸을 기록된 값으로 동기화
  useEffect(() => {
    setCommentDraft(auditResults[`${data.id}-${auditTab}`]?.comment ?? "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id, auditTab])


  const regenerate = () => {
    setRegenerating(true)
    setNeedGen(false) // 생성 시작 → 더 이상 깜빡이지 않음
    window.setTimeout(() => {
      setRegenerating(false)
      setSms(draftForTone(data, tone))
      if (correctionMode) setSent(false) // 재생성한 초안을 다시 발송할 수 있도록 발송완료 해제
    }, 1300)
  }

  // 실시간 데모: 어시스턴트 메시지를 순차 표시 → 마지막에 초안 자동 생성
  useEffect(() => {
    if (task !== "sms") return
    const playlist = correctionMode ? correctionSeed : seedMsgs
    setChat([])
    setTyping(false)
    // 정정 모드: 직전 발송본을 우측에 즉시 노출(미발송 상태로 '직전 발송 문자' 안내) / 일반 모드: 빈 초안
    setSms(correctionMode ? prevSentDraft : "")
    if (correctionMode) setSent(false)
    setSourcesReady(false)
    setNeedGen(false)
    const timers: number[] = []
    let t = 500
    playlist.forEach((msg, i) => {
      timers.push(window.setTimeout(() => setTyping(true), t))
      t += 850
      timers.push(
        window.setTimeout(() => {
          setChat((c) => [...c, msg])
          setTyping(i < playlist.length - 1)
        }, t),
      )
      t += 600 // 스텝 간 약간의 딜레이(0.3초 추가)
    })
    // 자동 생성 대신: 근거 정리 완료 → 가운데 브리지 버튼 활성화(상담사가 좌측 근거를 우측으로 전달)
    timers.push(window.setTimeout(() => { setSourcesReady(true); setNeedGen(true) }, t + 200))
    return () => timers.forEach((id) => window.clearTimeout(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id, task])

  // 채팅 자동 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [chat.length, typing])

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      {/* 상단 컨텍스트 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#dbe5f1] bg-white px-5 py-2.5">
        <Link href="/post-consultation" className="inline-flex items-center gap-1 rounded-md border border-[#dbe5f1] bg-white px-2 py-1 text-[11px] font-medium text-[#0b4f91] transition-colors hover:bg-[#f2f8ff]">
          ← 상담 이력 조회
        </Link>
        <div className="h-7 w-px bg-[#e2eaf4]" />
        {isAudit ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#005bac]/10 text-[#005bac]">
                <UserRound className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-bold text-[#10233f]">{data.customer} 고객님</div>
                <div className="text-[10.5px] text-muted-foreground">{data.customerNo} · {data.channel} · {data.time}</div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-[#bad6f4] bg-[#f2f8ff] px-2 py-1 text-[10.5px] text-[#0b4f91]">
                <PhoneCall className="h-3.5 w-3.5" /> 상담 ID {data.id}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-[#dbe5f1] bg-white px-2 py-1 text-[10.5px] text-[#33445c]">
                <Headphones className="h-3.5 w-3.5 text-[#0b4f91]" /> 담당 <span className="font-semibold text-[#10233f]">{consultAgent(data)}</span>
              </span>
              <StatusBadge status={data.status} />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#005bac]/10 text-[#005bac]">
                <UserRound className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-bold text-[#10233f]">{data.customer} 고객님</div>
                <div className="text-[10.5px] text-muted-foreground">{data.customerNo} · {data.channel} · {data.time}</div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-[#bad6f4] bg-[#f2f8ff] px-2 py-1 text-[10.5px] text-[#0b4f91]">
                <PhoneCall className="h-3.5 w-3.5" /> 상담 ID {data.id}
              </span>
              <StatusBadge status={review === "승인" ? "리뷰 완료" : data.status} />
            </div>
          </>
        )}
      </div>

      <div className={cn("min-h-0 flex-1", task === "contact" || isAudit ? "overflow-hidden" : "overflow-y-auto p-5")}>
        {task === "contact" ? (
          <div className="flex h-full min-h-0">
              {/* Panel 1: 접촉 이력 + 후속 조치 — 최우측 배치 */}
              <div className="order-3 flex min-h-0 min-w-0 flex-col bg-white" style={{ flex: "0.65 1 0%" }}>
                <SectionCard icon={History} title="접촉 이력" desc="고객 상담 이력 타임라인" fill flat>
                  <div className="relative space-y-3 border-l-2 border-[#e3e9f1] pl-4">
                    {history.map((c) => {
                      const isCurrent = c.id === data.id
                      return (
                        <div key={c.id} className="relative">
                          <span className={cn("absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white", isCurrent ? "bg-[#005bac]" : "bg-[#cdd9e8]")} />
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-bold text-[#10233f]">{c.date.replace(/-/g, ".")}</span>
                            <span className="text-[9.5px] text-muted-foreground">{relativeDay(c.date)}</span>
                            {isCurrent ? <span className="rounded-full bg-[#005bac] px-1.5 py-0.5 text-[8.5px] font-medium text-white">현재</span> : null}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {c.topics.map((tp) => (
                              <span key={tp} className="rounded-full border border-[#dbe5f1] bg-[#f7fafe] px-1.5 py-0.5 text-[9px] text-[#33445c]">{tp}</span>
                            ))}
                          </div>
                          <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{c.summary.split("\n")[0]}</p>
                        </div>
                      )
                    })}
                  </div>
                </SectionCard>

                {/* 후속 조치 — 헤더만(기본 접힘), 패널 하단 */}
                <div className="shrink-0 overflow-hidden border-t border-[#d4e0ef] bg-white">
                  <button
                    type="button"
                    onClick={() => setShowFollow((v) => !v)}
                    className={cn("flex w-full items-center gap-1.5 bg-white px-3 py-2 text-left", showFollow && "border-b border-[#e2eaf4]")}
                  >
                    <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-[#005bac]" />
                    <div className="text-[12px] font-bold text-[#10233f]">후속 조치</div>
                    {genFollowReady && data.processing.some((p) => p.status.includes("대기")) ? (
                      <Badge variant="outline" className="h-4 shrink-0 border-amber-200 bg-amber-50 px-1.5 text-[9px] text-amber-700">
                        {data.processing.filter((p) => p.status.includes("대기")).length}건 대기
                      </Badge>
                    ) : null}
                    <span className="ml-auto shrink-0 text-[10.5px] font-medium text-[#0b4f91]">{showFollow ? "접기 ▲" : "펴기 ▼"}</span>
                  </button>
                  {showFollow ? (
                    <div className="p-2.5">
                      {!genFollowReady ? (
                        <GenLoading label="후속 조치 도출 중…" lines={3} />
                      ) : (
                        <div className="animate-in fade-in duration-300">
                          <div className="space-y-1">
                            {data.processing.map((p) => {
                              const done = !p.status.includes("대기")
                              return (
                                <div key={p.item} className="flex items-center justify-between gap-2 rounded-lg border border-[#e2eaf4] bg-white px-2.5 py-1.5">
                                  <span className="text-[11px] text-[#10233f]">{p.item}</span>
                                  <Badge variant="outline" className={cn("h-4 shrink-0 px-1.5 text-[9px]", done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>{p.status}</Badge>
                                </div>
                              )
                            })}
                          </div>
                          {data.processing.some((p) => p.status.includes("대기")) ? (
                            <p className="mt-2 flex items-start gap-1 rounded-lg bg-amber-50/70 px-2 py-1.5 text-[10.5px] leading-4 text-amber-800">
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> 접수 대기 건이 있어 후속 처리가 필요합니다.
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Panel 2: 상담 개요 + 원문 — 최좌측 배치 */}
              <div className="order-1 flex min-h-0 min-w-0 flex-col border-r border-[#d4e0ef] bg-white" style={{ flex: "0.85 1 0%" }}>
                <SectionCard icon={Sparkles} title="상담 개요" desc="전체 요약 · 유형별 요약" fill flat>
                  {!genSummaryReady ? (
                    <div>
                      <GenLoading label="상담 내용을 분석해 요약을 생성 중…" lines={4} />
                    </div>
                  ) : (
                  <div className="animate-in fade-in duration-500">
                  {/* 전체 요약 — 불릿 / 편집 */}
                  <div className="mb-2 px-1.5 py-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[9.5px] font-bold text-[#0b4f91]">전체 요약</span>
                      <button type="button" onClick={() => setEditOverall((v) => !v)} className="text-[9.5px] font-medium text-[#0b4f91] hover:underline">
                        {editOverall ? "완료" : "✎ 편집"}
                      </button>
                    </div>
                    {editOverall ? (
                      <Textarea value={overall} onChange={(e) => setOverall(e.target.value)} autoFocus className="min-h-[64px] text-[11px] leading-4 caret-[#005bac]" />
                    ) : (
                      <ul className="space-y-0.5">
                        {overall.split("\n").map((line) => (
                          <li key={line} className="flex gap-1.5 text-[11px] leading-4 text-[#10233f]">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#005bac]" /> {line}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* 유형별 — 등록 전 점선(비활성) / 등록 후 활성(상세 토글) */}
                  <div className="space-y-1">
                    {!registered ? (
                      <div className="flex items-center gap-1.5 rounded-lg border border-dashed border-[#cdd9e8] bg-[#fafcfe] px-2.5 py-2">
                        <ListChecks className="h-3.5 w-3.5 shrink-0 text-[#b6c3d6]" />
                        <span className="text-[11px] font-medium text-[#9aabc2]">접촉 유형 별 요약</span>
                        <span className="ml-auto shrink-0 text-[9px] text-[#b6c3d6]">등록 후 확인</span>
                      </div>
                    ) : reflecting ? (
                      <GenLoading label="등록한 접촉 이력을 상담 개요에 반영 중…" lines={3} />
                    ) : (
                      typeList.map((t, i) => {
                      const open = openType === t.rank
                      return (
                        <div key={t.rank} className={cn("overflow-hidden rounded-lg border animate-in fade-in duration-300", open ? "border-[#005bac]" : "border-[#e2eaf4]")}>
                          <button
                            type="button"
                            onClick={() => {
                              const willOpen = !open
                              setOpenType(willOpen ? t.rank : null)
                              if (willOpen) setShowTranscript(false) // 상세 펼치면 원문 통화 내용 자동 접기
                            }}
                            className={cn("flex w-full items-center gap-1.5 px-2 py-1.5 text-left", open && "bg-[#f2f8ff]")}
                          >
                            <span className={cn("h-2 w-2 shrink-0 rounded-sm", SEG_COLORS[i % SEG_COLORS.length])} />
                            <span className="text-[11px] font-semibold text-[#10233f]">{t.title}</span>
                            <span className="ml-auto shrink-0 text-[9px] text-muted-foreground">{open ? "접기 ▲" : "상세 ▼"}</span>
                          </button>
                          {open ? (
                            <div className="whitespace-pre-line border-t border-[#eef3f9] px-2 py-1.5 text-[10.5px] leading-4 text-[#10233f]">{bodies[t.rank] ?? ""}</div>
                          ) : null}
                        </div>
                      )
                      })
                    )}
                  </div>
                  </div>
                  )}
                </SectionCard>

                <div className="shrink-0 overflow-hidden border-t border-[#d4e0ef] bg-white">
                  <button
                    type="button"
                    onClick={() => setShowTranscript((v) => !v)}
                    className={cn("flex w-full items-center gap-1.5 bg-white px-3.5 py-2 text-left", showTranscript && "border-b border-[#e2eaf4]")}
                  >
                    <PhoneCall className="h-3.5 w-3.5 shrink-0 text-[#005bac]" />
                    <div className="text-[12px] font-bold text-[#10233f]">원문 통화 내용</div>
                    <span className="ml-auto text-[10.5px] font-medium text-[#0b4f91]">{showTranscript ? "접기 ▲" : "펴기 ▼"}</span>
                  </button>
                  {showTranscript ? (
                    <div className="px-4 py-3.5">
                      <div className="h-[42vh] space-y-2 overflow-y-auto pr-1">
                    {data.transcript.map((t, i) => {
                      const isAgent = t.speaker === "agent"
                      const segStart = t.seg && t.seg !== data.transcript[i - 1]?.seg
                      const segIdx = t.seg ? typeList.findIndex((ct) => ct.rank === t.seg) : -1
                      const segTitle = segIdx >= 0 ? typeList[segIdx].title : null
                      return (
                        <Fragment key={i}>
                          {segStart ? (
                            <div id={`seg-${data.id}-${t.seg}`} className="flex items-center gap-2 pt-1 scroll-mt-2">
                              <span className={cn("h-2 w-2 shrink-0 rounded-full", SEG_COLORS[segIdx % SEG_COLORS.length])} />
                              <span className="text-[9.5px] font-bold text-[#0b4f91]">{segTitle}</span>
                              <div className="h-px flex-1 bg-[#e3e9f1]" />
                            </div>
                          ) : null}
                          <div className={cn("flex", isAgent ? "justify-end" : "justify-start")}>
                            <div className={cn("max-w-[90%] rounded-xl px-2.5 py-1.5 text-[11px] leading-5", isAgent ? "rounded-tr-sm border border-[#cfe0f1] bg-[#eef4fb] text-[#27456b]" : "rounded-tl-sm border bg-white text-[#10233f]")}>
                              <div className="mb-0.5 text-[9px] opacity-60">{isAgent ? "상담사" : "고객"} · {t.time}</div>
                              {t.text}
                            </div>
                          </div>
                        </Fragment>
                      )
                    })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Panel 3: 접촉 유형 · 요약 초안(탭) — 가운데 배치 */}
              <div className="order-2 flex min-h-0 min-w-0 flex-col border-r border-[#d4e0ef] bg-white" style={{ flex: "1.25 1 0%" }}>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {/* 제목 헤더 — 상담 개요와 동일 높이/폰트 + 구분선 */}
                  <div className="shrink-0 border-b border-[#e2eaf4] bg-white px-[18px] pt-2 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5 text-[#005bac]" />
                      <div className="leading-tight">
                        <div className="text-[12px] font-bold text-[#10233f]">접촉 유형 분류 · 등록</div>
                        <div className="truncate text-[10px] text-muted-foreground">의도 분석 · 요약 초안 편집</div>
                      </div>
                    </div>
                  </div>
                  {/* 탭 */}
                  <div className="shrink-0 border-b border-[#e2eaf4] bg-white px-[18px] pt-2">
                    {!registered ? (
                      !genTypesReady ? (
                        <div className="mt-2 flex items-center gap-1.5 py-1 text-[11px] font-medium text-[#0b4f91]">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> 접촉 유형 분류 중…
                        </div>
                      ) : (
                      <div className="mt-2 flex flex-wrap items-end gap-1 animate-in fade-in duration-500">
                        {typeList.map((t) => {
                          const active = t.rank === activeTab
                          const inc = includeRanks.has(t.rank)
                          const editing = editingTab === t.rank
                          return (
                            <div
                              key={t.rank}
                              onClick={() => {
                                setActiveTab(t.rank)
                                scrollToSeg(t.rank)
                              }}
                              className={cn(
                                "-mb-px flex cursor-pointer items-center gap-1 rounded-t-lg border border-b-0 px-2.5 py-1.5 text-[11px] transition-colors",
                                active ? "border-[#cdddef] bg-white font-bold text-[#0b4f91]" : "border-transparent bg-[#e3eefb] font-medium text-[#5b6b80] hover:bg-[#eef4fb]",
                              )}
                            >
                              {t.rank === primaryRank ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#005bac]" /> : null}
                              {editing ? (
                                <input
                                  autoFocus
                                  value={t.title}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => renameType(t.rank, e.target.value)}
                                  onBlur={() => setEditingTab(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") setEditingTab(null)
                                  }}
                                  className="w-24 rounded border border-[#bad6f4] bg-white px-1 text-[11px] text-[#10233f] outline-none focus:border-[#005bac]"
                                />
                              ) : (
                                <span className="whitespace-nowrap">{t.title}</span>
                              )}
                              {!inc ? <span className="text-[8.5px] text-slate-400">제외</span> : null}
                              {active && !editing ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingTab(t.rank)
                                  }}
                                  className="ml-0.5 text-[10px] text-[#9aabc2] hover:text-[#005bac]"
                                  title="제목 수정"
                                >
                                  ✎
                                </button>
                              ) : null}
                            </div>
                          )
                        })}
                        <button type="button" onClick={addType} className="-mb-px rounded-t-lg border border-b-0 border-dashed border-[#bad6f4] px-2 py-1.5 text-[11px] font-medium text-[#0b4f91] hover:bg-[#eef4fb]">
                          + 유형 추가
                        </button>
                      </div>
                      )
                    ) : (
                      <div className="py-1.5 text-[10.5px] font-medium text-emerald-700">등록 완료 — 아래 등록 내용 확인</div>
                    )}
                  </div>

                  {/* 본문 (스크롤) */}
                  <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-3.5">
                    {!genDraftReady ? (
                      <GenLoading label="유형별 요약 초안 생성 중…" lines={6} />
                    ) : (
                    <div className="animate-in fade-in duration-500">
                    {/* 통화 구간 — 전체 통화시간 내 토픽 발생 위치 */}
                    {isMulti ? (
                      <div className="mb-3">
                        <div className="mb-1 flex items-center justify-between text-[9px] text-muted-foreground">
                          <span>00:00</span>
                          <span>{fmtMS(callTotal)}</span>
                        </div>
                        <div className="relative h-4 w-full overflow-hidden rounded bg-[#eef3f9]">
                          {typeList.map((t) => {
                            const sp = segSpan(t.rank)
                            if (!sp) return null
                            const active = t.rank === activeTab
                            return (
                              <button
                                key={t.rank}
                                type="button"
                                onClick={() => {
                                  setActiveTab(t.rank)
                                  scrollToSeg(t.rank)
                                }}
                                title={`${t.title} · ${fmtMS(hmToMin(sp.startT) - callStart)}~${fmtMS(hmToMin(sp.endT) - callStart)}`}
                                style={{ left: `${sp.left}%`, width: `${sp.width}%` }}
                                className={cn("absolute inset-y-0 rounded bg-[#005bac] transition-opacity", active ? "" : "opacity-45 hover:opacity-70")}
                              />
                            )
                          })}
                        </div>
                      </div>
                    ) : null}
                    {registered ? (
                      <div className="space-y-2">
                        {typeList
                          .filter((t) => includeRanks.has(t.rank))
                          .map((t) => {
                            const c = cls[t.rank] ?? { major: t.major, middle: t.middle, minor: t.minor }
                            return (
                              <div key={t.rank} className={cn("rounded-lg border p-2.5", t.rank === primaryRank ? "border-[#005bac] bg-[#f2f8ff]" : "border-[#e2eaf4] bg-[#fbfdff]")}>
                                <div className="flex items-center gap-1.5">
                                  {t.rank === primaryRank ? <Badge className="h-4 bg-[#005bac] px-1.5 text-[9px] hover:bg-[#005bac]">우선</Badge> : null}
                                  <span className="text-[12px] font-semibold text-[#10233f]">{t.title}</span>
                                  <span className="ml-auto text-[9px] text-muted-foreground">{c.major} › {c.middle} › {c.minor}</span>
                                </div>
                                <div className="mt-1.5 whitespace-pre-line text-[10.5px] leading-4 text-[#10233f]">{bodies[t.rank] ?? ""}</div>
                              </div>
                            )
                          })}
                      </div>
                    ) : (
                      (() => {
                        const at = typeList.find((t) => t.rank === activeTab) ?? typeList[0]
                        const inc = includeRanks.has(at.rank)
                        const isPrimary = at.rank === primaryRank
                        const c = cls[at.rank] ?? { major: at.major, middle: at.middle, minor: at.minor }
                        return (
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="inline-flex items-center gap-1.5 text-[11px] text-[#10233f]">
                                <input type="checkbox" checked={inc} onChange={() => toggleInclude(at.rank)} className="h-3.5 w-3.5 accent-[#005bac]" /> 등록 포함
                              </label>
                              <span className={cn("rounded-full px-1.5 py-0.5 text-[8.5px] font-medium", at.importance === "높음" ? "bg-red-50 text-red-600" : at.importance === "보통" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500")}>중요도 {at.importance}</span>
                              <div className="ml-auto">
                                {isPrimary ? (
                                  <Badge className="h-4 bg-[#005bac] px-1.5 text-[9px] hover:bg-[#005bac]">우선 등록</Badge>
                                ) : inc ? (
                                  <button type="button" onClick={() => setPrimaryRank(at.rank)} className="rounded-full border border-[#bad6f4] px-1.5 py-0.5 text-[9px] text-[#0b4f91] hover:bg-[#f2f8ff]">우선 지정</button>
                                ) : null}
                              </div>
                            </div>

                            <div>
                              <div className="mb-0.5 text-[9.5px] font-bold text-[#0b4f91]">세부 분류</div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {([
                                  ["major", "대분류", MAJORS],
                                  ["middle", "중분류", middlesOf(c.major)],
                                  ["minor", "소분류", minorsOf(c.major, c.middle)],
                                ] as const).map(([key, label, opts]) => (
                                  <label key={key} className="block">
                                    <span className="text-[8.5px] text-muted-foreground">{label}</span>
                                    <select
                                      value={c[key]}
                                      onChange={(e) => setClsField(at.rank, key, e.target.value)}
                                      className="mt-0.5 w-full rounded-md border border-[#dbe5f1] bg-white px-1.5 py-1 text-[10.5px] text-[#10233f] outline-none focus:border-[#005bac]"
                                    >
                                      {optsWith(c[key], opts).map((o) => (
                                        <option key={o} value={o}>{o}</option>
                                      ))}
                                    </select>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="mb-1 text-[9.5px] font-bold text-[#0b4f91]">고객 경험</div>
                              <div className="flex gap-1.5">
                                {(["일반 문의", "불만 VoC"] as const).map((v) => (
                                  <button key={v} type="button" onClick={() => setVocExp(v)}
                                    className={cn("flex-1 rounded-md border px-2 py-1 text-[10.5px] font-medium transition-colors", vocExp === v ? "border-[#005bac] bg-[#f2f8ff] text-[#0b4f91]" : "border-[#dbe5f1] bg-white text-[#9aa6b6] hover:bg-[#f7fafe]")}>{v}</button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="mb-1 flex items-center gap-1.5 text-[9.5px] font-bold text-[#0b4f91]">
                                <Sparkles className="h-3 w-3" /> 요약 초안
                                <span className="font-normal text-muted-foreground">[항목] 머리말 + 세부 내용</span>
                                <span className="ml-auto inline-flex items-center gap-1 font-normal text-[#005bac]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#005bac]" /> 편집 가능</span>
                              </div>
                              <Textarea
                                value={bodies[at.rank] ?? ""}
                                onChange={(e) => setBody(at.rank, e.target.value)}
                                autoFocus
                                className="min-h-[200px] text-[11.5px] leading-5 caret-[#005bac]"
                              />
                            </div>
                          </div>
                        )
                      })()
                    )}
                    </div>
                    )}
                  </div>

                  {/* 푸터: 등록 버튼 (카드 내부 · 카드가 뷰를 채우므로 하단 고정) */}
                  <div className="flex shrink-0 items-center gap-2 border-t border-[#e2eaf4] bg-[#f7fafe] px-3.5 py-2.5">
                    {registered ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" /> 등록 완료 · {includeRanks.size}건</span>
                        <Button size="sm" variant="outline" className="ml-auto" onClick={() => setRegistered(false)}>수정</Button>
                      </>
                    ) : (
                      <>
                        <span className="truncate text-[10.5px] text-muted-foreground">
                          {genDone ? (
                            <>우선 <span className="font-semibold text-[#10233f]">{(typeList.find((t) => t.rank === primaryRank) ?? typeList[0]).title}</span> · 총 {includeRanks.size}건</>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#0b4f91]"><RefreshCw className="h-3 w-3 animate-spin" /> 자동 생성 중… 완료 후 등록할 수 있습니다</span>
                          )}
                        </span>
                        <Button size="sm" className="ml-auto shrink-0 bg-[#005bac] hover:bg-[#084780]" onClick={register} disabled={!genDone}>
                          <ClipboardCheck className="mr-1.5 h-4 w-4" /> 접촉이력 등록 ({includeRanks.size}건)
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
          </div>
        ) : task === "sms" ? (
          <div className="h-full">
            <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1fr)]">
              {/* 좌: 메일 초안 작성 어시스턴트 (대화형 정보 검색·검증) */}
              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#dbe5f1] bg-white">
                <div className="flex shrink-0 items-center gap-2 border-b border-[#e2eaf4] px-4 py-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#005bac]/10 text-[#005bac]"><Sparkles className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#10233f]">문자 초안 작성 어시스턴트</div>
                    <div className="text-[10.5px] text-muted-foreground">상담·가입상품·약관을 대화형으로 검색·검증</div>
                  </div>
                </div>
                {/* 메시지 */}
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f7fafe] p-3">
                  {chat.map((m, i) =>
                    m.role === "assistant" ? (
                      <div key={i} className="flex gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#005bac]/10 text-[#005bac]"><Sparkles className="h-3.5 w-3.5" /></div>
                        <div className="flex min-w-0 max-w-[90%] flex-col gap-1">
                          {m.step ? (
                            <span className="pl-1 text-[9.5px] font-medium text-[#9aabc2]">STEP {m.step.n}. {m.step.label}</span>
                          ) : null}
                          <div className="rounded-2xl rounded-tl-sm border border-[#dbe5f1] bg-white px-3 py-2 shadow-sm">
                          <p className="whitespace-pre-line text-[11.5px] leading-5 text-[#10233f]">{m.text}</p>
                          {m.products?.length ? (
                            <div className="mt-1.5 space-y-1">
                              {m.products.map((p) => (
                                <div key={p.name} className="flex items-center justify-between gap-2 rounded-md border border-[#e2eaf4] bg-[#fbfdff] px-2 py-1">
                                  <span className="truncate text-[10.5px] font-medium text-[#10233f]">{p.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          {m.calc ? (
                            <div className="mt-1.5 rounded-lg border border-[#c7ddf4] bg-[#f7fbff] p-2">
                              <div className="rounded-md border border-[#dbe5f1] bg-white px-2 py-1 text-center text-[10.5px] font-semibold text-[#10233f]">{m.calc.formula}</div>
                              <div className="mt-1 grid gap-0.5 sm:grid-cols-3">
                                {m.calc.breakdown.map((b) => (
                                  <div key={b.label} className={cn("rounded px-1.5 py-1 text-[9.5px]", b.strong ? "bg-[#005bac] text-white" : "bg-white text-[#33445c]")}>
                                    <div className={b.strong ? "text-white/80" : "text-muted-foreground"}>{b.label}</div>
                                    <div className="font-bold tabular-nums">{b.value}</div>
                                  </div>
                                ))}
                              </div>
                              <ul className="mt-1 space-y-0.5 border-t border-[#dbe9f7] pt-1">
                                {m.calc.notes.map((n) => (
                                  <li key={n} className="flex gap-1 text-[9px] leading-4 text-muted-foreground"><span className="text-[#0b4f91]">·</span> {n}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {m.cites?.length ? (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1 border-t border-[#eef3f9] pt-1.5">
                              <span className="text-[9px] font-semibold text-muted-foreground">근거</span>
                              {m.cites.map((r) => (
                                <button key={r.label} type="button" onClick={() => setPreviewRef(r)} className="inline-flex items-center gap-1 rounded-full border border-[#bad6f4] bg-[#f2f8ff] px-1.5 py-0.5 text-[9px] text-[#0b4f91] hover:bg-[#e3f0fc]">
                                  <BookOpen className="h-2.5 w-2.5" />
                                  {r.label.length > 20 ? r.label.slice(0, 20) + "…" : r.label}
                                </button>
                              ))}
                            </div>
                          ) : null}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="flex justify-end">
                        <div className="max-w-[90%] rounded-2xl rounded-tr-sm border border-[#cfe0f1] bg-[#eef4fb] px-3 py-2 text-[11.5px] leading-5 text-[#27456b] shadow-sm">{m.text}</div>
                      </div>
                    ),
                  )}
                  {typing ? (
                    <div className="flex gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#005bac]/10 text-[#005bac]"><Sparkles className="h-3.5 w-3.5" /></div>
                      <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-sm border border-[#dbe5f1] bg-white px-3 py-2 shadow-sm">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9aabc2] [animation-delay:-0.2s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9aabc2] [animation-delay:-0.1s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9aabc2]" />
                      </div>
                    </div>
                  ) : null}
                  <div ref={chatEndRef} />
                </div>
                {/* 컴포저 (추천 질의 + 입력) — 우측 푸터와 동일한 3행 구조로 높이 정렬 */}
                <div className="flex shrink-0 flex-col gap-2 border-t border-[#e2eaf4] bg-white p-2.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="mr-0.5 inline-flex items-center gap-1 text-[9.5px] font-bold text-[#0b4f91]"><Search className="h-3 w-3" /> 추천 질의</span>
                    {["해지환급금 산출 근거는?", "환급금 수령방법은?", "추가서류 제출 방법은?", "자동이체 변경 기준은?"].map((q) => (
                      <button key={q} type="button" onClick={() => sendChat(q)} className="rounded-full border border-[#dbe5f1] bg-[#f7fafe] px-2 py-0.5 text-[10px] text-[#0b4f91] transition-colors hover:border-[#005bac] hover:bg-[#f2f8ff]">{q}</button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") sendChat(chatInput)
                      }}
                      placeholder="안내에 필요한 정보를 검색 또는 추가 지시를 작성하세요 (예: 환급금 수령방법도 안내)"
                      className="h-9 text-[12px]"
                    />
                    <Button size="sm" className="h-9 shrink-0 bg-[#005bac] hover:bg-[#084780]" onClick={() => sendChat(chatInput)}><Send className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>

              {/* 가운데: 좌측 근거 → 우측 초안 변환 브리지 */}
              <div className="flex items-center justify-center py-2 xl:py-0">
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <button
                    type="button"
                    onClick={regenerate}
                    disabled={!sourcesReady || regenerating || !needGen}
                    title="좌측 근거로 초안 생성"
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-md transition-all",
                      regenerating
                        ? "border-[#005bac] bg-[#005bac] text-white"
                        : sourcesReady && needGen
                          ? "border-[#005bac] bg-[#005bac] text-white hover:scale-110 motion-safe:animate-pulse"
                          : "cursor-not-allowed border-[#dbe5f1] bg-white text-[#b6c3d6]",
                    )}
                  >
                    {regenerating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5 xl:rotate-0 rotate-90" />}
                  </button>
                  <span className={cn("max-w-[72px] text-[9.5px] font-medium leading-tight", sourcesReady && needGen ? "text-[#0b4f91]" : "text-muted-foreground")}>
                    초안 생성
                  </span>
                </div>
              </div>

              {/* 우: 안내 문구 초안 */}
              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#dbe5f1] bg-white">
                <div className="flex shrink-0 items-center gap-2 border-b border-[#e2eaf4] px-4 py-3">
                  <MessageSquare className="h-4 w-4 text-[#005bac]" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#10233f]">문자 안내 초안</div>
                    <div className="text-[10.5px] text-muted-foreground">어시스턴트 근거 기반 · 상담사 편집</div>
                  </div>
                  {sent ? (
                    <span className="ml-auto inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-[#005bac] px-3 text-[12px] font-semibold text-white">
                      <CheckCircle2 className="h-4 w-4" /> 발송완료
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      className="ml-auto h-8 shrink-0 bg-[#005bac] hover:bg-[#084780]"
                      onClick={() => {
                        setSending(true)
                        window.setTimeout(() => {
                          setSending(false)
                          setSent(true)
                          // 문자 발송 완료 → 조치완료 처리 + 후속 이력 생성 트리거
                          // (정정 문자 재발송 진입이거나 '조치 필요' 건이면 발송 시점에 조치완료로 기록)
                          const isFollowupAction = correctionMode || reviewOf(data).admin === "필요"
                          const prev = readAllFollowups()[data.id] ?? {}
                          const items = [...new Set([...(prev.actionItems ?? []), "정정 문자 발송"])]
                          writeFollowup(data.id, {
                            smsSent: true,
                            smsText: sms,
                            ...(isFollowupAction ? { actionDone: true, actionAt: prev.actionAt ?? new Date().toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }), actionItems: items } : {}),
                          })
                        }, 1300)
                      }}
                      disabled={!sms || regenerating || sending}
                    >
                      {sending ? <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
                      {sending ? "발송 중…" : "발송하기"}
                    </Button>
                  )}
                </div>
                <div className="relative min-h-0 flex-1 p-3.5">
                  {sending ? (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-white/70 backdrop-blur-[1px] animate-in fade-in duration-150">
                      <div className="inline-flex items-center gap-1.5 rounded-2xl border border-[#dbe5f1] bg-white px-4 py-2.5 shadow-sm">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[#005bac] [animation-delay:-0.2s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[#005bac] [animation-delay:-0.1s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[#005bac]" />
                      </div>
                      <span className="text-[11px] font-medium text-[#0b4f91]">문자를 발송하고 있습니다…</span>
                    </div>
                  ) : null}
                  {regenerating ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[#bad6f4] bg-[#f7fafe] text-[11.5px] text-[#0b4f91]">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      근거를 종합해 안내 문구를 생성 중입니다…
                    </div>
                  ) : sms ? (
                    <div className="flex h-full flex-col gap-2">
                      {sent ? (
                        <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 animate-in fade-in slide-in-from-top-1 duration-200">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {data.customer} 고객님 {maskedPhone} 로 발송되었습니다.
                        </div>
                      ) : correctionMode && sms === prevSentDraft ? (
                        <div className="flex items-start gap-1.5 rounded-md border border-[#dbe5f1] bg-[#f7fafe] px-2.5 py-1.5 text-[11px] font-medium text-[#0b4f91] animate-in fade-in slide-in-from-top-1 duration-200">
                          <History className="h-3.5 w-3.5 shrink-0" /> {data.customer} 고객님 {maskedPhone}에 발송된 문자입니다. 초안을 생성하여 재발송 가능합니다.
                        </div>
                      ) : null}
                      <Textarea value={sms} onChange={(e) => setSms(e.target.value)} disabled={sent || sending || (correctionMode && sms === prevSentDraft)} className={cn("flex-1 resize-none text-[12.5px] leading-6", (sent || sending || (correctionMode && sms === prevSentDraft)) && "bg-[#f7fafe] text-muted-foreground")} />
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1.5 whitespace-pre-line rounded-md border border-dashed border-[#dbe5f1] bg-[#f7fafe] px-6 text-center text-[11px] leading-5 text-muted-foreground">
                      <Sparkles className="h-5 w-5 text-[#bad6f4]" />
                      {sourcesReady
                        ? "가운데 생성 버튼을 눌러\n근거를 전달하면 안내 문구 초안이 만들어집니다."
                        : "어시스턴트가 상담·가입상품·약관 근거를 정리하면\n안내 문구 초안을 생성할 수 있습니다."}
                    </div>
                  )}
                </div>
                {/* 초안 톤 수정 — 좌측 컴포저와 동일한 3행 구조로 높이 정렬 */}
                <div className="flex shrink-0 flex-col gap-2 border-t border-[#e2eaf4] bg-[#f7fafe] p-2.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="mr-0.5 inline-flex items-center gap-1 text-[9.5px] font-bold text-[#0b4f91]"><Sparkles className="h-3 w-3" /> 초안 톤 수정</span>
                    {["CX 톤 반영", "정중하게", "간결하게", "핵심만 3줄"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        disabled={sent}
                        onClick={() => {
                          setTone(t)
                          setTonePrompt(TONE_PROMPT[t] ?? "")
                        }}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                          tone === t ? "border-[#005bac] bg-[#005bac] text-white" : "border-[#dbe5f1] bg-white text-[#0b4f91] hover:border-[#005bac] hover:bg-[#f2f8ff]",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <Input
                      value={tonePrompt}
                      onChange={(e) => setTonePrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") regenerate()
                      }}
                      disabled={sent}
                      placeholder="톤·문구 교정 지시 (예: 좀 더 정중하게)"
                      className="h-9 bg-white text-[12px]"
                    />
                    <Button size="sm" variant="outline" className="h-9 shrink-0" onClick={regenerate} disabled={regenerating || !sms || sent}>
                      <RefreshCw className={cn("mr-1 h-3.5 w-3.5", regenerating && "animate-spin")} /> 재생성
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : isAudit ? (
          (() => {
            const g = guideAuditOf(data)
            const w = workAuditOf(data)
            const key = `${data.id}-${auditTab}`
            const reviewed = isReviewed(key)
            return (
              <div className="flex h-full min-h-0 flex-col">
                {/* 안내 검수 / 업무 검수 분기 탭 */}
                <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#d4e0ef] bg-white px-4 py-2.5">
                  <div className="flex items-center gap-1 rounded-lg border border-[#dbe5f1] bg-[#f7fafe] p-0.5">
                    {([["guide", "안내 검수", g.verdict], ["task", "업무 검수", w.verdict]] as const).map(([k, l, v]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setAuditTab(k)}
                        className={cn("flex items-center gap-1 rounded-md px-3 py-1 text-[11.5px] font-semibold transition-colors", auditTab === k ? "bg-[#005bac] text-white" : "text-[#33445c] hover:bg-white")}
                      >
                        {l}
                        <span className={cn("rounded-full px-1 text-[9px]", auditTab === k ? "bg-white/20 text-white" : v === "정상" ? "bg-emerald-100 text-emerald-700" : v === "위반" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>{v}</span>
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground">상담 종료 후 Agent가 1차 검수한 결과입니다. 검토자(2차)가 확인 후 결과를 기록합니다.</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] text-muted-foreground"><FileCheck2 className="h-3.5 w-3.5 text-[#0b4f91]" /> 검토자 <span className="font-semibold text-[#10233f]">김제나</span></span>
                </div>

                {/* 좌: 상담 대화 / 우: 검수 결과·승인 */}
                <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  {/* 좌측: 상담 대화 */}
                  <div className="flex min-h-0 flex-col border-r border-[#d4e0ef] bg-white">
                    <div className="shrink-0 border-b border-[#e2eaf4] px-4 py-2.5 text-[11px] font-bold text-[#0b4f91]">
                      <span className="inline-flex items-center gap-1.5"><PhoneCall className="h-3.5 w-3.5" /> 상담 대화 <span className="font-normal text-muted-foreground">· {data.customer} · {data.id}</span></span>
                    </div>
                    <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4">
                      {data.transcript.map((s, i) => {
                        const isCustomer = s.speaker === "customer"
                        return (
                          <div key={i} className={cn("flex gap-2", isCustomer ? "justify-start" : "justify-end")}>
                            {isCustomer ? <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e3ebf4] text-muted-foreground"><User className="h-3.5 w-3.5" /></div> : null}
                            <div className={cn("flex max-w-[80%] flex-col gap-0.5", isCustomer ? "items-start" : "items-end")}>
                              <span className="text-[9px] text-muted-foreground">{isCustomer ? "고객" : "상담사"} · {s.time}</span>
                              <p className={cn("rounded-2xl px-3 py-1.5 text-[11.5px] leading-5", isCustomer ? "rounded-bl-sm border border-[#e2eaf4] bg-white text-[#10233f]" : "rounded-br-sm bg-[#005bac] text-white")}>{s.text}</p>
                            </div>
                            {!isCustomer ? <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#005bac]/10 text-[#005bac]"><Headphones className="h-3.5 w-3.5" /></div> : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 우측: 검수 결과 + 승인 */}
                  <div className="flex min-h-0 flex-col bg-white">
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                    {auditTab === "guide" ? (
                      <>
                        {/* 검수 완료 시 — 핵심만 재가공한 결과 요약 */}
                        {reviewed ? (
                          <div className="rounded-lg border border-[#cfd9e6] bg-[#fbfdff] p-3">
                            <div className="mb-2 flex items-center gap-2">
                              <ClipboardCheck className="h-4 w-4 text-[#0b4f91]" />
                              <span className="text-[12px] font-bold text-[#10233f]">안내 검수 결과 요약</span>
                              <span className="ml-auto"><VerdictChip verdict={g.verdict} /></span>
                            </div>
                            <div className="space-y-1.5">
                              {[
                                { label: "판정", value: g.verdict === "정상" ? "오안내 없음 — 안내 정확" : "오안내 확인 — 안내 정확성 위반", warn: g.verdict !== "정상" },
                                { label: "문의", value: shortSummary(data) },
                                { label: "핵심 사유", value: g.note },
                                ...(data.references.length ? [{ label: "판정 근거", value: data.references.map((r) => r.label).join("  ·  ") }] : []),
                              ].map((row) => (
                                <div key={row.label} className="flex gap-2">
                                  <span className="mt-px w-[64px] shrink-0 rounded-md bg-[#eef4fb] px-1.5 py-0.5 text-center text-[10px] font-semibold text-[#0b4f91]">{row.label}</span>
                                  <p className={cn("flex-1 text-[11.5px] leading-5", row.warn ? "font-semibold text-red-700" : "text-[#10233f]")}>{row.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {!reviewed ? (
                        <>
                        {/* 상담 요약 — 간단한 문의사항과 안내 내용 */}
                        <div className="rounded-lg border border-[#e2eaf4] bg-white p-3">
                          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold text-[#0b4f91]"><Sparkles className="h-3.5 w-3.5" /> 상담 요약 <span className="font-normal text-muted-foreground">· AI 자동 요약</span></div>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <span className="mt-px w-[58px] shrink-0 rounded-md bg-[#eef4fb] px-1.5 py-0.5 text-center text-[10px] font-semibold text-[#0b4f91]">문의</span>
                              <p className="flex-1 text-[11.5px] leading-5 text-[#10233f]">{shortSummary(data)}</p>
                            </div>
                            <div className="flex gap-2">
                              <span className="mt-px w-[58px] shrink-0 rounded-md bg-[#eef4fb] px-1.5 py-0.5 text-center text-[10px] font-semibold text-[#0b4f91]">안내</span>
                              <p className="flex-1 text-[11.5px] leading-5 text-[#33445c]">{data.summary.split("\n")[0]}</p>
                            </div>
                          </div>
                        </div>
                        <div className={cn("rounded-lg border p-3", g.verdict === "정상" ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/60")}>
                          <div className="flex items-center gap-2">
                            {g.verdict === "정상" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                            <span className={cn("text-[12px] font-bold", g.verdict === "정상" ? "text-emerald-900" : "text-red-900")}>AI 1차 검수 · 안내 정확성</span>
                            <span className="ml-auto"><VerdictChip verdict={g.verdict} /></span>
                          </div>
                          <p className="mt-2 text-[11.5px] leading-5 text-[#10233f]"><span className="font-semibold">평가 사유 · </span>{g.note}</p>
                        </div>
                        {data.references.length ? (
                          <div className="rounded-lg border border-[#cfe0f1] bg-[#f7fbff] p-3">
                            <div className="mb-1.5 flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-[#0b4f91]" />
                              <span className="text-[10px] font-bold text-[#0b4f91]">오안내 검수 판정 근거</span>
                              <span className="text-[9.5px] text-muted-foreground">AI가 참고한 약관·내규</span>
                            </div>
                            <div className="space-y-1.5">
                              {data.references.map((r) => (
                                <div key={r.label} className="rounded-md border border-[#dbe5f1] bg-white px-2.5 py-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10233f]">
                                      <span className="rounded-sm bg-[#eef4fb] px-1 py-0.5 text-[9px] font-semibold text-[#0b4f91]">{r.type}</span>
                                      {r.label}
                                    </span>
                                    <button type="button" onClick={() => setPreviewRef(r)} className="inline-flex shrink-0 items-center gap-1 text-[10.5px] font-medium text-[#0b4f91] underline-offset-4 hover:underline">원본 보기 <ExternalLink className="h-3 w-3" /></button>
                                  </div>
                                  <p className="mt-1 text-[11px] leading-5 text-[#33445c]"><mark className="rounded-sm bg-amber-200/70 px-1 font-medium text-amber-900">{r.excerpt}</mark></p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        </>
                        ) : null}
                        {/* 검수 완료 시 — 오안내 정정(고객 안내 발송)·상담사 교육 후속 조치 */}
                        {reviewed ? (
                          g.verdict === "정상" ? (
                            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                              <p className="text-[11px] leading-5 text-emerald-900"><span className="font-bold">후속 조치 불필요</span> · 오안내가 확인되지 않아 별도 정정·교육 조치가 필요하지 않습니다.</p>
                            </div>
                          ) : (() => {
                            const fu = guideFollowupOf(data)
                            const agent = consultAgent(data)
                            return (
                              <div className="rounded-lg border border-[#cfe0f1] bg-[#f7fbff] p-3">
                                <div className="mb-2 flex items-center gap-1.5">
                                  <Sparkles className="h-3.5 w-3.5 text-[#0b4f91]" />
                                  <span className="text-[10px] font-bold text-[#0b4f91]">후속 조치 · 고객 정정 및 교육</span>
                                  <span className="ml-auto text-[9.5px] text-muted-foreground">담당 <span className="font-semibold text-[#10233f]">{agent}</span> 상담사</span>
                                </div>
                                {/* 고객 정정 안내(정보 발송) */}
                                <div className="rounded-md border border-amber-200 bg-amber-50/60 p-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <Send className="h-3.5 w-3.5 text-amber-600" />
                                    <span className="text-[10.5px] font-bold text-amber-900">고객 정정 안내 발송</span>
                                    <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">{fu.correction.channel}</span>
                                  </div>
                                  <p className="mt-1 text-[10.5px] leading-4 text-amber-900/90">{fu.correction.summary}</p>
                                  <p className="mt-1.5 rounded border border-amber-200 bg-white px-2 py-1.5 text-[10.5px] leading-4 text-[#33445c]">{fu.correction.draft}</p>
                                </div>
                                {/* 권장 조치 */}
                                <div className="mt-2 space-y-1">
                                  <div className="text-[10px] font-semibold text-[#33445c]">권장 조치</div>
                                  {fu.actions.map((a) => (
                                    <button key={a.label} type="button" className={cn("flex w-full items-start gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors", a.tone === "warn" ? "border-amber-200 bg-amber-50/70 hover:bg-amber-50" : "border-sky-200 bg-sky-50/60 hover:bg-sky-50")}>
                                      {a.tone === "warn" ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" /> : <ClipboardList className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />}
                                      <span className="min-w-0">
                                        <span className={cn("block text-[11px] font-bold", a.tone === "warn" ? "text-amber-900" : "text-sky-900")}>{a.label}</span>
                                        <span className="block text-[10px] leading-4 text-muted-foreground">{a.desc}</span>
                                      </span>
                                      <ArrowRight className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", a.tone === "warn" ? "text-amber-500" : "text-sky-500")} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )
                          })()
                        ) : null}
                      </>
                    ) : (
                      <>
                        {/* 검수 완료 시 — 핵심만 재가공한 결과 요약 */}
                        {reviewed ? (
                          <div className="rounded-lg border border-[#cfd9e6] bg-[#fbfdff] p-3">
                            <div className="mb-2 flex items-center gap-2">
                              <ClipboardCheck className="h-4 w-4 text-[#0b4f91]" />
                              <span className="text-[12px] font-bold text-[#10233f]">업무 검수 결과 요약</span>
                              <span className="ml-auto"><VerdictChip verdict={w.verdict} /></span>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex gap-2">
                                <span className="mt-px w-[64px] shrink-0 rounded-md bg-[#eef4fb] px-1.5 py-0.5 text-center text-[10px] font-semibold text-[#0b4f91]">판정</span>
                                <p className={cn("flex-1 text-[11.5px] leading-5", w.verdict === "정상" ? "text-[#10233f]" : "font-semibold text-red-700")}>{w.verdict === "정상" ? "업무 누락 없음 — 매뉴얼 정상 수행" : `업무 누락 확인 — 매뉴얼 ${w.missing.length}개 항목 미수행`}</p>
                              </div>
                              {w.missing.length ? (
                                <div className="flex gap-2">
                                  <span className="mt-px w-[64px] shrink-0 rounded-md bg-[#eef4fb] px-1.5 py-0.5 text-center text-[10px] font-semibold text-[#0b4f91]">누락 항목</span>
                                  <div className="flex flex-1 flex-wrap gap-1">
                                    {w.missing.map((m) => (
                                      <span key={m} className="rounded-md border border-red-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-red-700">{m}</span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              <div className="flex gap-2">
                                <span className="mt-px w-[64px] shrink-0 rounded-md bg-[#eef4fb] px-1.5 py-0.5 text-center text-[10px] font-semibold text-[#0b4f91]">핵심 사유</span>
                                <p className="flex-1 text-[11.5px] leading-5 text-[#10233f]">{w.note}</p>
                              </div>
                            </div>
                          </div>
                        ) : null}
                        {!reviewed ? (
                        <>
                        <div className={cn("rounded-lg border p-3", w.verdict === "정상" ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/60")}>
                          <div className="flex items-center gap-2">
                            {w.verdict === "정상" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                            <span className={cn("text-[12px] font-bold", w.verdict === "정상" ? "text-emerald-900" : "text-red-900")}>AI 1차 검수 · 업무 누락</span>
                            <span className="ml-auto"><VerdictChip verdict={w.verdict} /></span>
                          </div>
                          <p className="mt-2 text-[11.5px] leading-5 text-[#10233f]"><span className="font-semibold">평가 사유 · </span>{w.note}</p>
                          {w.missing.length ? (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-semibold text-foreground">미수행/대기 항목 ·</span>
                              {w.missing.map((m) => (
                                <span key={m} className="rounded-md border border-red-200 bg-white px-2 py-0.5 text-[10px] font-medium text-red-700">{m}</span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        {/* 매뉴얼 항목별 수행 여부 */}
                        {(() => {
                          const missCount = data.processing.filter((p) => p.status.includes("대기") || p.status.includes("미")).length
                          return (
                            <div className="rounded-lg border border-[#e2eaf4] bg-white p-3">
                              <div className="mb-2 flex items-center gap-1.5">
                                <ListChecks className="h-3.5 w-3.5 text-[#0b4f91]" />
                                <span className="text-[10px] font-bold text-[#0b4f91]">매뉴얼 항목별 수행 여부</span>
                                <span className="ml-auto text-[10px] text-muted-foreground">총 {data.processing.length}개 중 <span className="font-bold text-red-600">{missCount}개</span> 미수행</span>
                              </div>
                              {/* 헤더 행 */}
                              <div className="flex items-center gap-2 border-b border-[#e2eaf4] px-2.5 pb-1 text-[9px] font-semibold text-muted-foreground">
                                <span className="w-4 text-center">#</span>
                                <span className="flex-1">매뉴얼 항목</span>
                                <span className="w-[64px] text-center">위치</span>
                                <span className="w-[42px] text-center">수행</span>
                              </div>
                              <div className="overflow-hidden rounded-b-md">
                                {data.processing.map((p, i) => {
                                  const ok = !(p.status.includes("대기") || p.status.includes("미"))
                                  return (
                                    <div key={i} className={cn("px-2.5 py-1.5", i > 0 && "border-t border-[#eef2f7]", !ok && "bg-red-50/50")}>
                                      <div className="flex items-center gap-2 text-[11px]">
                                        <span className="w-4 text-center font-mono text-[9.5px] text-muted-foreground">{i + 1}</span>
                                        <span className={cn("flex-1", ok ? "text-[#10233f]" : "font-semibold text-red-900")}>{p.item}</span>
                                        <span className={cn("w-[64px] text-center font-mono text-[9.5px]", ok ? "text-muted-foreground" : "font-semibold text-red-600")}>{p.location ?? "-"}</span>
                                        <span className="flex w-[42px] justify-center">
                                          {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                                        </span>
                                      </div>
                                      {!ok && p.expectedScript ? (
                                        <div className="mt-1 pl-6 text-[10px] leading-4 text-red-700/90">
                                          <span className="font-semibold">기대 멘트 · </span>“{p.expectedScript}”
                                        </div>
                                      ) : null}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })()}
                        </>
                        ) : null}
                        {/* 검수 완료 시 — 담당 상담사 패턴 분석 · 재발방지 액션 */}
                        {reviewed ? (() => {
                          const pat = agentPatternOf(data)
                          const agent = consultAgent(data)
                          return (
                            <div className="rounded-lg border border-[#cfe0f1] bg-[#f7fbff] p-3">
                              <div className="mb-2 flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-[#0b4f91]" />
                                <span className="text-[10px] font-bold text-[#0b4f91]">상담사 패턴 분석 · 재발방지</span>
                                <span className="ml-auto text-[9.5px] text-muted-foreground"><span className="font-semibold text-[#10233f]">{agent}</span> 상담사 · {pat.windowLabel}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-[#dbe5f1] bg-[#dbe5f1]">
                                <div className="bg-white px-2 py-1.5 text-center"><div className="text-[9px] text-muted-foreground">분석 상담</div><div className="text-[13px] font-bold text-[#10233f]">{pat.totalCalls}건</div></div>
                                <div className="bg-white px-2 py-1.5 text-center"><div className="text-[9px] text-muted-foreground">미수행 검출</div><div className="text-[13px] font-bold text-red-600">{pat.flaggedCalls}건</div></div>
                                <div className="bg-white px-2 py-1.5 text-center"><div className="text-[9px] text-muted-foreground">반복 항목</div><div className="text-[13px] font-bold text-[#10233f]">{pat.topMissed.length}종</div></div>
                              </div>
                              {pat.topMissed.length ? (
                                <div className="mt-2">
                                  <div className="mb-1 text-[10px] font-semibold text-[#33445c]">반복 미수행 항목</div>
                                  <div className="flex flex-wrap gap-1">
                                    {pat.topMissed.map((t) => (
                                      <span key={t.item} className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-red-700">{t.item} <span className="rounded-full bg-red-100 px-1 text-[9px] font-bold">{t.count}회</span></span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              {pat.history.length ? (
                                <div className="mt-2">
                                  <div className="mb-1 text-[10px] font-semibold text-[#33445c]">과거 검수 이력</div>
                                  <div className="overflow-hidden rounded-md border border-[#e2eaf4] bg-white">
                                    {pat.history.map((h, i) => (
                                      <div key={h.callId} className={cn("flex items-center gap-2 px-2.5 py-1.5 text-[10.5px]", i > 0 && "border-t border-[#eef2f7]")}>
                                        <span className="w-[64px] shrink-0 font-mono text-[9.5px] tabular-nums text-muted-foreground">{h.date.replace(/-/g, ".")}</span>
                                        <span className="flex-1 truncate text-[#10233f]">{h.missing === "-" ? "누락 없음" : h.missing}</span>
                                        <Badge variant="outline" className={cn("h-4 shrink-0 px-1.5 text-[9px]", h.reeducation ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700")}>{h.verdict}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              <div className="mt-2 space-y-1">
                                <div className="text-[10px] font-semibold text-[#33445c]">권장 조치</div>
                                {pat.actions.map((a) => (
                                  <button key={a.label} type="button" className={cn("flex w-full items-start gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors", a.tone === "warn" ? "border-amber-200 bg-amber-50/70 hover:bg-amber-50" : "border-sky-200 bg-sky-50/60 hover:bg-sky-50")}>
                                    {a.tone === "warn" ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" /> : <ClipboardList className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />}
                                    <span className="min-w-0">
                                      <span className={cn("block text-[11px] font-bold", a.tone === "warn" ? "text-amber-900" : "text-sky-900")}>{a.label}</span>
                                      <span className="block text-[10px] leading-4 text-muted-foreground">{a.desc}</span>
                                    </span>
                                    <ArrowRight className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", a.tone === "warn" ? "text-amber-500" : "text-sky-500")} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })() : null}
                      </>
                    )}
                  </div>

                    {/* 2차 검수 결과 기록 / 승인 */}
                    <div className="shrink-0 border-t border-[#e2eaf4] bg-[#f7fafe] p-3">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold text-[#0b4f91]"><MessageSquare className="h-3.5 w-3.5" /> 2차 검수 결과 기록 · {auditTab === "guide" ? "안내검수" : "업무검수"}</div>
                      {reviewed ? (
                        (() => {
                          const rec = auditResults[key]
                          const agree = rec.decision === "agree"
                          return (
                            <div className={cn("rounded-lg border p-3", agree ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60")}>
                              <div className="flex items-center gap-2">
                                {agree ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <RotateCcw className="h-4 w-4 text-amber-600" />}
                                <span className={cn("text-[12px] font-bold", agree ? "text-emerald-900" : "text-amber-900")}>{agree ? "AI 판정 동의" : "재검토 필요"}</span>
                                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", agree ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>기록 완료</span>
                                <button type="button" onClick={() => clearAudit(key)} className="ml-auto inline-flex items-center gap-1 text-[10.5px] font-medium text-[#0b4f91] hover:underline"><RefreshCw className="h-3 w-3" /> 수정</button>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1"><FileCheck2 className="h-3 w-3" /> 검토자 <span className="font-semibold text-[#10233f]">김제나</span></span>
                                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {rec.at} 기록</span>
                              </div>
                              <p className="mt-2 rounded-md border border-[#e2eaf4] bg-white px-2.5 py-1.5 text-[11px] leading-5 text-[#33445c]">
                                <span className="font-semibold text-[#0b4f91]">검토 의견 · </span>{rec.comment || "(코멘트 없음)"}
                              </p>
                            </div>
                          )
                        })()
                      ) : (
                        <>
                          <Textarea value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} placeholder="검토 의견·수정 코멘트 (예: 안내 범위 재교육 필요)" className="mb-2 min-h-[56px] text-[11.5px] leading-5" />
                          <div className="flex items-center gap-2">
                            <span className="mr-auto text-[10.5px] text-muted-foreground">AI 1차 판정에 대한 검수 결과를 선택하세요.</span>
                            <Button size="sm" variant="outline" className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => recordAudit(key, "recheck")}><RotateCcw className="h-3.5 w-3.5" /> 재검토 필요</Button>
                            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => recordAudit(key, "agree")}><CheckCircle2 className="h-3.5 w-3.5" /> AI 판정 동의</Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()
        ) : null}
      </div>

      {/* 발췌 근거 — A4/PDF형 서류 미리보기 */}
      {previewRef ? (
        (() => {
          const doc = refDoc(previewRef)
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setPreviewRef(null)}>
              <div className="flex max-h-[88vh] w-full max-w-[620px] flex-col overflow-hidden rounded-lg border border-[#cdd9e8] bg-[#3a4250] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* 뷰어 상단 바 */}
                <div className="flex items-center gap-2 px-4 py-2.5 text-white">
                  <BookOpen className="h-4 w-4 text-[#9cc6f0]" />
                  <span className="text-[12px] font-semibold">{previewRef.label}</span>
                  <span className="rounded bg-white/15 px-1.5 py-0.5 text-[9px]">{previewRef.type}</span>
                  <span className="ml-auto text-[10px] text-white/60">{doc.docNo}</span>
                  <button type="button" onClick={() => setPreviewRef(null)} className="ml-2 rounded p-1 text-white/80 hover:bg-white/15 hover:text-white" aria-label="닫기">✕</button>
                </div>
                {/* A4 페이지 */}
                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  <div className="mx-auto w-full max-w-[480px] rounded-sm bg-white px-10 py-9 shadow-xl">
                    {/* 문서 머리글 */}
                    <div className="mb-1 flex items-center justify-between text-[8.5px] text-muted-foreground">
                      <span className="font-semibold text-[#10233f]">제논라이프생명보험(주)</span>
                      <span>{doc.docNo} · {doc.revised}</span>
                    </div>
                    <div className="mb-5 border-b-2 border-[#10233f] pb-2.5 text-center">
                      <div className="text-[9px] tracking-widest text-muted-foreground">{previewRef.type.toUpperCase()}</div>
                      <h3 className="mt-0.5 text-[15px] font-bold leading-6 text-[#10233f]">{previewRef.label}</h3>
                    </div>
                    {/* 본문 */}
                    <div className="space-y-4">
                      {doc.sections.map((s) => (
                        <div key={s.heading}>
                          <div className="mb-1.5 text-[12px] font-bold text-[#10233f]">{s.heading}</div>
                          <div className="space-y-1.5 pl-1">
                            {s.lines.map((l, i) =>
                              l === previewRef.excerpt ? (
                                <p key={i} className="rounded-sm bg-[#fff3b0] px-1.5 py-1 text-[11px] font-medium leading-6 text-[#10233f]">{l}</p>
                              ) : (
                                <p key={i} className="text-[11px] leading-6 text-[#33445c]">{l}</p>
                              ),
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* 문서 바닥글 */}
                    <div className="mt-8 flex items-center justify-between border-t border-[#e2eaf4] pt-2 text-[8.5px] text-muted-foreground">
                      <span>본 문서는 데모용 목업이며 실제 약관·지침과 다를 수 있습니다.</span>
                      <span>- 1 / 1 -</span>
                    </div>
                  </div>
                </div>
                {/* 뷰어 하단 바 */}
                <div className="flex items-center justify-between gap-2 px-4 py-2.5">
                  <span className="inline-flex items-center gap-1 text-[10px] text-white/70">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#fff3b0]" /> 노란색 강조 = SMS 안내에 반영된 발췌 항목
                  </span>
                  <Button size="sm" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/15 hover:text-white" onClick={() => setPreviewRef(null)}>닫기</Button>
                </div>
              </div>
            </div>
          )
        })()
      ) : null}
    </section>
  )
}

/* ================================================================== */
/* 공용                                                                */
/* ================================================================== */

// 자동 생성 중 로딩 표시(스피너 + 스켈레톤)
function GenLoading({ label, lines = 3 }: { label: string; lines?: number }) {
  return (
    <div className="space-y-2 py-1">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#0b4f91]">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> {label}
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-3 animate-pulse rounded bg-[#e8eef6]" style={{ width: `${90 - i * 14}%` }} />
        ))}
      </div>
    </div>
  )
}

function SectionCard({ icon: Icon, title, desc, children, fill, flat }: { icon: ComponentType<{ className?: string }>; title: string; desc: string; children: React.ReactNode; fill?: boolean; flat?: boolean }) {
  return (
    <Card className={cn("gap-0 overflow-hidden py-0", flat ? "rounded-none border-0 shadow-none" : "rounded-lg", fill && "flex min-h-0 flex-1 flex-col")}>
      <CardHeader className="shrink-0 gap-0 border-b bg-white px-3 pt-2 [.border-b]:pb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-[#005bac]" />
          <div className="leading-tight">
            <div className="text-[12px] font-bold text-[#10233f]">{title}</div>
            <div className="text-[10px] text-muted-foreground">{desc}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("px-4 py-2.5", fill && "min-h-0 flex-1 overflow-y-auto")}>{children}</CardContent>
    </Card>
  )
}



"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileUploadBox } from "@/components/FileUploadBox"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import {
  ArrowRight,
  ArrowUp,
  Bot,
  Database,
  GitFork,
  Loader2,
  MessageSquare,
  RotateCcw,
  Search,
  Sparkles,
  Upload,
  User,
} from "lucide-react"

// ─────────────────────────────────────────────
// Demo Data (SFR-022)
// ─────────────────────────────────────────────

type TransferRecord = {
  id: string
  transferor: string       // 양도 기관명
  transferee: string       // 양수 기관명
  portfolioName: string    // 채권군명
  productType: string      // 채권 유형
  fromDate: string         // 양도 시작
  toDate: string           // 양도 종료
  caseCount: number        // 건수
  amount: number           // 금액(만원)
  source: string           // 데이터 출처
  uploadedAt: string       // 업로드 일시
  transferType: "매각" | "합병"  // 이전 유형 (SFR-022)
}

const DEMO_RECORDS: TransferRecord[] = [
  {
    id: "tx-001",
    transferor: "현대카드",
    transferee: "JT친애저축은행",
    portfolioName: "현대카드 장기연체 채권군",
    productType: "카드채권",
    fromDate: "2022-01",
    toDate: "2022-12",
    caseCount: 5230,
    amount: 18_500_000,
    source: "채권기관 변경 신고",
    uploadedAt: "2026-03-10 09:12",
    transferType: "매각",
  },
  {
    id: "tx-002",
    transferor: "현대카드",
    transferee: "미래자산관리",
    portfolioName: "현대카드 장기연체 채권군",
    productType: "카드채권",
    fromDate: "2022-03",
    toDate: "2022-12",
    caseCount: 2100,
    amount: 7_200_000,
    source: "채권기관 변경 신고",
    uploadedAt: "2026-03-10 09:12",
    transferType: "매각",
  },
  {
    id: "tx-003",
    transferor: "JT친애저축은행",
    transferee: "KB자산관리대부",
    portfolioName: "현대카드 장기연체 채권군",
    productType: "카드채권",
    fromDate: "2023-06",
    toDate: "2024-01",
    caseCount: 3100,
    amount: 10_900_000,
    source: "과거 양수도 이력 CSV",
    uploadedAt: "2026-03-10 09:12",
    transferType: "매각",
  },
  {
    id: "tx-004",
    transferor: "JT친애저축은행",
    transferee: "하나에셋대부",
    portfolioName: "현대카드 장기연체 채권군",
    productType: "카드채권",
    fromDate: "2024-03",
    toDate: "2024-09",
    caseCount: 1580,
    amount: 5_400_000,
    source: "과거 양수도 이력 CSV",
    uploadedAt: "2026-03-10 09:12",
    transferType: "매각",
  },
  {
    id: "tx-005",
    transferor: "미래자산관리",
    transferee: "우리채권관리",
    portfolioName: "현대카드 장기연체 채권군",
    productType: "카드채권",
    fromDate: "2023-01",
    toDate: "2023-12",
    caseCount: 1900,
    amount: 6_300_000,
    source: "과거 양수도 이력 CSV",
    uploadedAt: "2026-03-10 09:12",
    transferType: "매각",
  },
  {
    id: "tx-006",
    transferor: "삼성카드",
    transferee: "SBI저축은행",
    portfolioName: "삼성카드 개인신용대출 채권군",
    productType: "신용대출",
    fromDate: "2021-06",
    toDate: "2022-06",
    caseCount: 4100,
    amount: 22_800_000,
    source: "채권기관 변경 신고",
    uploadedAt: "2026-03-10 09:15",
    transferType: "매각",
  },
  {
    id: "tx-007",
    transferor: "SBI저축은행",
    transferee: "예스에셋",
    portfolioName: "삼성카드 개인신용대출 채권군",
    productType: "신용대출",
    fromDate: "2023-03",
    toDate: "2023-09",
    caseCount: 2800,
    amount: 15_200_000,
    source: "과거 양수도 이력 CSV",
    uploadedAt: "2026-03-10 09:15",
    transferType: "매각",
  },
  {
    id: "tx-008",
    transferor: "SBI저축은행",
    transferee: "M자산관리",
    portfolioName: "삼성카드 개인신용대출 채권군",
    productType: "신용대출",
    fromDate: "2024-01",
    toDate: "2024-06",
    caseCount: 1200,
    amount: 6_800_000,
    source: "과거 양수도 이력 CSV",
    uploadedAt: "2026-03-10 09:15",
    transferType: "매각",
  },
  {
    id: "tx-009",
    transferor: "KB국민카드",
    transferee: "웰컴저축은행",
    portfolioName: "KB국민카드 장기연체 채권군",
    productType: "카드채권",
    fromDate: "2022-03",
    toDate: "2023-03",
    caseCount: 6800,
    amount: 31_400_000,
    source: "채권기관 변경 신고",
    uploadedAt: "2026-03-10 09:20",
    transferType: "합병",
  },
  {
    id: "tx-010",
    transferor: "웰컴저축은행",
    transferee: "KB자산관리대부",
    portfolioName: "KB국민카드 장기연체 채권군",
    productType: "카드채권",
    fromDate: "2024-06",
    toDate: "2024-12",
    caseCount: 4200,
    amount: 19_600_000,
    source: "과거 양수도 이력 CSV",
    uploadedAt: "2026-03-10 09:20",
    transferType: "매각",
  },
  {
    id: "tx-011",
    transferor: "제논카드",
    transferee: "한국자산관리공사",
    portfolioName: "제논카드 연체 신용대출 채권군",
    productType: "신용대출",
    fromDate: "2021-09",
    toDate: "2022-09",
    caseCount: 3500,
    amount: 14_200_000,
    source: "채권기관 변경 신고",
    uploadedAt: "2026-03-11 10:05",
    transferType: "매각",
  },
  {
    id: "tx-012",
    transferor: "한국자산관리공사",
    transferee: "하나에셋대부",
    portfolioName: "제논카드 연체 신용대출 채권군",
    productType: "신용대출",
    fromDate: "2023-09",
    toDate: "2024-03",
    caseCount: 2200,
    amount: 8_900_000,
    source: "과거 양수도 이력 CSV",
    uploadedAt: "2026-03-11 10:05",
    transferType: "매각",
  },
]

type InferenceResult = {
  institution: string
  institutionType: string
  probability: number
  caseCount: number
  chain: string[]
  confidence: number
  yearlyTrend: { year: string; caseCount: number }[]   // SFR-022: 연도별 트렌드
  edgeTypes: ("매각" | "합병")[]                        // SFR-022: 합병/매각 구분 (chain.length-1 개)
}

type ReverseResult = {
  portfolioName: string
  originator: string
  productType: string
  arrivalPath: string[]
  caseCount: number
  fromDate: string
  toDate: string
  edgeTypes: ("매각" | "합병")[]  // SFR-022: 합병/매각 구분 (arrivalPath.length-1 개)
}

const INFERENCE_DEMO: Record<string, InferenceResult[]> = {
  "현대카드": [
    {
      institution: "KB자산관리대부", institutionType: "자산관리사", probability: 0.50, caseCount: 3100,
      chain: ["현대카드", "JT친애저축은행", "KB자산관리대부"], confidence: 0.92,
      yearlyTrend: [{ year: "2022", caseCount: 1820 }, { year: "2023", caseCount: 980 }, { year: "2024", caseCount: 300 }],
      edgeTypes: ["매각", "매각"],
    },
    {
      institution: "우리채권관리", institutionType: "채권관리사", probability: 0.25, caseCount: 1900,
      chain: ["현대카드", "미래자산관리", "우리채권관리"], confidence: 0.88,
      yearlyTrend: [{ year: "2022", caseCount: 900 }, { year: "2023", caseCount: 1000 }],
      edgeTypes: ["매각", "매각"],
    },
    {
      institution: "하나에셋대부", institutionType: "대부업체", probability: 0.25, caseCount: 1580,
      chain: ["현대카드", "JT친애저축은행", "하나에셋대부"], confidence: 0.85,
      yearlyTrend: [{ year: "2024", caseCount: 1580 }],
      edgeTypes: ["매각", "매각"],
    },
  ],
  "삼성카드": [
    {
      institution: "예스에셋", institutionType: "자산관리사", probability: 0.70, caseCount: 2800,
      chain: ["삼성카드", "SBI저축은행", "예스에셋"], confidence: 0.91,
      yearlyTrend: [{ year: "2021", caseCount: 1200 }, { year: "2022", caseCount: 1600 }, { year: "2023", caseCount: 2800 }],
      edgeTypes: ["매각", "매각"],
    },
    {
      institution: "M자산관리", institutionType: "자산관리사", probability: 0.30, caseCount: 1200,
      chain: ["삼성카드", "SBI저축은행", "M자산관리"], confidence: 0.84,
      yearlyTrend: [{ year: "2023", caseCount: 600 }, { year: "2024", caseCount: 1200 }],
      edgeTypes: ["매각", "매각"],
    },
  ],
  "KB국민카드": [
    {
      institution: "KB자산관리대부", institutionType: "자산관리사", probability: 0.62, caseCount: 4200,
      chain: ["KB국민카드", "웰컴저축은행", "KB자산관리대부"], confidence: 0.93,
      yearlyTrend: [{ year: "2022", caseCount: 2100 }, { year: "2023", caseCount: 3400 }, { year: "2024", caseCount: 4200 }],
      edgeTypes: ["합병", "매각"],
    },
    {
      institution: "웰컴저축은행", institutionType: "저축은행", probability: 0.38, caseCount: 2600,
      chain: ["KB국민카드", "웰컴저축은행"], confidence: 0.79,
      yearlyTrend: [{ year: "2022", caseCount: 4700 }, { year: "2023", caseCount: 2600 }],
      edgeTypes: ["합병"],
    },
  ],
  "제논카드": [
    {
      institution: "하나에셋대부", institutionType: "대부업체", probability: 0.63, caseCount: 2200,
      chain: ["제논카드", "한국자산관리공사", "하나에셋대부"], confidence: 0.90,
      yearlyTrend: [{ year: "2021", caseCount: 800 }, { year: "2022", caseCount: 1500 }, { year: "2023", caseCount: 2200 }],
      edgeTypes: ["매각", "매각"],
    },
    {
      institution: "한국자산관리공사", institutionType: "공공기관", probability: 0.37, caseCount: 1300,
      chain: ["제논카드", "한국자산관리공사"], confidence: 0.75,
      yearlyTrend: [{ year: "2021", caseCount: 2200 }, { year: "2022", caseCount: 1300 }],
      edgeTypes: ["매각"],
    },
  ],
}

const REVERSE_DEMO: Record<string, ReverseResult[]> = {
  "KB자산관리대부": [
    { portfolioName: "현대카드 장기연체 채권군", originator: "현대카드", productType: "카드채권", arrivalPath: ["현대카드", "JT친애저축은행", "KB자산관리대부"], caseCount: 3100, fromDate: "2023-06", toDate: "2024-01", edgeTypes: ["매각", "매각"] },
    { portfolioName: "KB국민카드 장기연체 채권군", originator: "KB국민카드", productType: "카드채권", arrivalPath: ["KB국민카드", "웰컴저축은행", "KB자산관리대부"], caseCount: 4200, fromDate: "2024-06", toDate: "2024-12", edgeTypes: ["합병", "매각"] },
  ],
  "하나에셋대부": [
    { portfolioName: "현대카드 장기연체 채권군", originator: "현대카드", productType: "카드채권", arrivalPath: ["현대카드", "JT친애저축은행", "하나에셋대부"], caseCount: 1580, fromDate: "2024-03", toDate: "2024-09", edgeTypes: ["매각", "매각"] },
    { portfolioName: "제논카드 연체 신용대출 채권군", originator: "제논카드", productType: "신용대출", arrivalPath: ["제논카드", "한국자산관리공사", "하나에셋대부"], caseCount: 2200, fromDate: "2023-09", toDate: "2024-03", edgeTypes: ["매각", "매각"] },
  ],
  "예스에셋": [
    { portfolioName: "삼성카드 개인신용대출 채권군", originator: "삼성카드", productType: "신용대출", arrivalPath: ["삼성카드", "SBI저축은행", "예스에셋"], caseCount: 2800, fromDate: "2023-03", toDate: "2023-09", edgeTypes: ["매각", "매각"] },
  ],
  "M자산관리": [
    { portfolioName: "삼성카드 개인신용대출 채권군", originator: "삼성카드", productType: "신용대출", arrivalPath: ["삼성카드", "SBI저축은행", "M자산관리"], caseCount: 1200, fromDate: "2024-01", toDate: "2024-06", edgeTypes: ["매각", "매각"] },
  ],
  "우리채권관리": [
    { portfolioName: "현대카드 장기연체 채권군", originator: "현대카드", productType: "카드채권", arrivalPath: ["현대카드", "미래자산관리", "우리채권관리"], caseCount: 1900, fromDate: "2023-01", toDate: "2023-12", edgeTypes: ["매각", "매각"] },
  ],
}

const KNOWN_ORIGINATORS = ["현대카드", "삼성카드", "KB국민카드", "제논카드"]
const KNOWN_TARGETS = ["KB자산관리대부", "하나에셋대부", "예스에셋", "M자산관리", "우리채권관리"]



function formatAmount(amount: number) {
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}조`
  if (amount >= 10_000) return `${(amount / 10_000).toFixed(0)}억`
  return `${amount.toLocaleString()}만`
}

function formatCount(n: number) {
  return n.toLocaleString() + "건"
}

// ─────────────────────────────────────────────
// Tab 1: 지식베이스 관리
// ─────────────────────────────────────────────

function KnowledgeBasePanel() {
  const [records, setRecords] = useState<TransferRecord[]>(DEMO_RECORDS)
  const [files, setFiles] = useState<File[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [filter, setFilter] = useState("")

  const filtered = records.filter(
    (r) =>
      !filter ||
      r.transferor.includes(filter) ||
      r.transferee.includes(filter) ||
      r.portfolioName.includes(filter),
  )

  const handleImport = async () => {
    if (!files.length) return
    setIsImporting(true)
    await new Promise((r) => setTimeout(r, 1200))
    // Demo: prepend mock imported record
    const newRecord: TransferRecord = {
      id: `tx-import-${Date.now()}`,
      transferor: "롯데카드",
      transferee: "OK저축은행",
      portfolioName: "롯데카드 단기연체 채권군",
      productType: "카드채권",
      fromDate: "2025-01",
      toDate: "2025-06",
      caseCount: 3840,
      amount: 16_200_000,
      source: files[0].name,
      uploadedAt: new Date().toLocaleString("ko-KR", { hour12: false }).replace(".", "-").replace(".", "-"),
      transferType: "매각",
    }
    setRecords((prev) => [newRecord, ...prev])
    setFiles([])
    setIsImporting(false)
  }


  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Section header */}
      <div className="px-6 py-3 border-b bg-background shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">채권양수도 이력 데이터 학습 및 관리</p>
            <p className="text-xs text-muted-foreground mt-0.5">기간계 CSV 데이터를 업로드하여 지식베이스를 구성하고 관리합니다.</p>
          </div>
          <span className="text-[10px] text-[#153AD4] bg-[#153AD4]/8 border border-[#153AD4]/20 rounded-full px-2.5 py-0.5 font-medium">
            {records.length}건 적재
          </span>
        </div>
      </div>
      {/* CSV upload bar */}
      <div className="px-5 py-3 border-b bg-muted/10 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <FileUploadBox
              files={files}
              onFilesChange={(next) => setFiles(next.slice(0, 1))}
              accept=".csv,.xlsx"
              placeholder="CSV / XLSX 업로드 (필수 컬럼: 양도기관, 양수기관, 양도시작, 양도종료, 건수)"
              multiple={false}
            />
          </div>
          <Button
            onClick={handleImport}
            disabled={!files.length || isImporting}
            size="sm"
            className="shrink-0 bg-[#153AD4] hover:bg-[#153AD4]/90 text-white"
          >
            {isImporting ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />구성 중...</>
            ) : (
              <><Upload className="h-3.5 w-3.5 mr-1.5" />지식베이스 추가</>
            )}
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 px-5 py-2 border-b bg-muted/5 shrink-0">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="기관명·채권군 검색"
          className="h-7 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-[#153AD4]/30 w-52"
        />
        <span className="text-xs text-muted-foreground">{filtered.length}/{records.length}건</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-muted/40 z-10">
            <tr>
              {["양도 기관명", "양수 기관명", "채권군명", "유형", "이전 유형", "양도 기간", "건수", "금액", "출처", "업로드"].map((h, i) => (
                <th key={h} className={`py-2.5 text-left font-semibold text-muted-foreground border-b whitespace-nowrap ${i === 0 ? "pl-6 pr-4" : "px-4"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} className={`border-b transition-colors hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                <td className="pl-6 pr-4 py-2.5 font-medium whitespace-nowrap">{r.transferor}</td>
                <td className="px-4 py-2.5 text-[#153AD4] font-medium whitespace-nowrap">{r.transferee}</td>
                <td className="px-4 py-2.5 text-muted-foreground max-w-[180px] truncate" title={r.portfolioName}>{r.portfolioName}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className="rounded-full border px-2 py-0.5 text-[10px]">{r.productType}</span>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    r.transferType === "합병"
                      ? "border-sky-400 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400"
                      : "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                  }`}>{r.transferType}</span>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{r.fromDate} ~ {r.toDate}</td>
                <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">{formatCount(r.caseCount)}</td>
                <td className="px-4 py-2.5 whitespace-nowrap tabular-nums text-muted-foreground">{formatAmount(r.amount)}</td>
                <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{r.source}</td>
                <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground text-[10px]">{r.uploadedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab 2: 양도 기관 추론
// ─────────────────────────────────────────────

function InferencePanel() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<InferenceResult[] | null>(null)
  const [queriedInstitution, setQueriedInstitution] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (institution?: string) => {
    const target = institution ?? query.trim()
    if (!target) return
    setIsLoading(true)
    setResults(null)
    await new Promise((r) => setTimeout(r, 1400))
    const key = KNOWN_ORIGINATORS.find((k) => target.includes(k) || k.includes(target)) ?? target
    setResults(INFERENCE_DEMO[key] ?? [])
    setQueriedInstitution(key)
    setIsLoading(false)
  }

  const handleReset = () => {
    setQuery("")
    setResults(null)
    setQueriedInstitution("")
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Section header */}
      <div className="px-6 py-3 border-b bg-background shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">양도 대상 기관 예상 목록 제공</p>
            <p className="text-xs text-muted-foreground mt-0.5">원채권 기관명을 입력하면 이형 그래프 탐색을 통해 현재 채권 보유 가능성이 높은 기관과 확률을 추론합니다.</p>
          </div>
        </div>
      </div>
      {/* Query bar */}
      <div className="px-5 py-3 border-b bg-muted/10 shrink-0">
        <div className="flex gap-2 max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="원채권 기관명 입력 (예: 현대카드)"
            className="flex-1 h-9 rounded-lg border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-[#153AD4]/30"
          />
          <Button
            onClick={() => handleSearch()}
            disabled={!query.trim() || isLoading}
            size="sm"
            className="bg-[#153AD4] hover:bg-[#153AD4]/90 text-white"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
          {results !== null && (
            <Button variant="ghost" size="icon" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          </div>
          {/* Quick pick */}
          <div className="flex gap-2 flex-wrap">
            {KNOWN_ORIGINATORS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setQuery(k); handleSearch(k) }}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-muted transition-colors"
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-[#153AD4]" />
            <p className="text-sm">이형 그래프 탐색 중...</p>
            <p className="text-xs opacity-60">양수도 이력 → 재양도 경로 → 최종 기관 추론</p>
          </div>
        )}

        {/* No result */}
        {results !== null && !isLoading && results.length === 0 && (
          <div className="rounded-xl border border-dashed bg-muted/10 px-6 py-10 text-center text-sm text-muted-foreground">
            <p>"{queriedInstitution}"에 대한 추론 결과가 없습니다.</p>
            <p className="text-xs mt-1 opacity-60">지식베이스에 해당 기관의 양수도 이력이 없거나 종착 기관입니다.</p>
          </div>
        )}

        {/* Results */}
        {results !== null && !isLoading && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                추론 결과 — <span className="text-[#153AD4]">{queriedInstitution}</span> 채권 현재 보유 기관
              </p>
              <span className="text-xs text-muted-foreground">{results.length}개 기관</span>
            </div>

            <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-900/10 px-4 py-3">
              <p className="text-xs text-sky-700 dark:text-sky-400">
                ⚠ 본 결과는 과거 양수도 이력 기반 AI 추론이며, 실제 현황과 다를 수 있습니다. 반드시 공식 확인 후 활용하세요.
              </p>
            </div>

            <div className="space-y-3">
              {results
                .sort((a, b) => b.probability - a.probability)
                .map((item, i) => (
                  <div key={item.institution} className="rounded-xl border bg-card overflow-hidden">
                    <div className="flex items-center gap-4 px-5 py-4">
                      {/* Rank */}
                      <span
                        className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                          i === 0
                            ? "bg-[#153AD4] text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-semibold text-sm">{item.institution}</span>
                          <span className="text-[10px] rounded-full border px-2 py-0.5 text-muted-foreground">{item.institutionType}</span>
                        </div>
                        {/* Probability bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#153AD4] transition-all"
                              style={{ width: `${item.probability * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold tabular-nums text-[#153AD4] w-10 text-right">
                            {(item.probability * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          추정 {formatCount(item.caseCount)} · 신뢰도 {(item.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* 연도별 트렌드 (SFR-022) */}
                    {item.yearlyTrend.length > 0 && (
                      <div className="px-5 py-3 border-t bg-muted/5">
                        <p className="text-[10px] font-semibold text-muted-foreground mb-2">연도별 양수도 추이</p>
                        <div className="space-y-1.5">
                          {(() => {
                            const max = Math.max(...item.yearlyTrend.map((t) => t.caseCount))
                            return item.yearlyTrend.map((t) => (
                              <div key={t.year} className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground w-10 shrink-0">{t.year}년</span>
                                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-[#153AD4]/40 transition-all"
                                    style={{ width: `${(t.caseCount / max) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] tabular-nums text-[#153AD4] w-14 text-right shrink-0">
                                  {t.caseCount.toLocaleString()}건
                                </span>
                              </div>
                            ))
                          })()}
                        </div>
                      </div>
                    )}

                    {/* 합병/매각 구분 요약 */}
                    <div className="px-5 py-2.5 border-t bg-muted/5 flex items-center justify-end gap-1">
                      {Array.from(new Set(item.edgeTypes)).map((t) => (
                        <span key={t} className={`text-[10px] rounded-full border px-2 py-0.5 font-semibold ${
                          t === "합병"
                            ? "border-sky-400 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400"
                            : "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                        }`}>{t}</span>
                      ))}
                      <span className="text-[10px] text-muted-foreground">이전</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Graph note */}
            <div className="rounded-xl border border-[#153AD4]/15 bg-[#153AD4]/3 px-4 py-3 text-xs text-[#153AD4] space-y-1">
              <p className="font-semibold">추론 근거</p>
              <p>· {queriedInstitution} 노드 기준 하위 재양도 경로를 지식베이스에서 탐색</p>
              <p>· 종착 노드(재양도 이력 없음) 기관의 건수 비율을 확률로 환산</p>
              <p>· 지식베이스 포함 이력 건수 기준 가중치 적용</p>
            </div>
          </div>
        )}
      </div>
  )
}

// ─────────────────────────────────────────────
// (역방향 검색 제거됨 — 내부 기능)
// ─────────────────────────────────────────────

function ReverseSearchPanel() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ReverseResult[] | null>(null)
  const [queriedInstitution, setQueriedInstitution] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (institution?: string) => {
    const target = institution ?? query.trim()
    if (!target) return
    setIsLoading(true)
    setResults(null)
    await new Promise((r) => setTimeout(r, 1100))
    const key = KNOWN_TARGETS.find((k) => target.includes(k) || k.includes(target)) ?? target
    setResults(REVERSE_DEMO[key] ?? [])
    setQueriedInstitution(key)
    setIsLoading(false)
  }

  const handleReset = () => {
    setQuery("")
    setResults(null)
    setQueriedInstitution("")
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full px-6 py-6 space-y-6">
        {/* Input */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">현재 보유 기관 역추적</p>
          <p className="text-xs text-muted-foreground">
            현재 채권을 보유하고 있을 것으로 의심되는 기관명을 입력하면, 해당 기관이 보유 중일 채권군과 원채권 기관까지의 양수도 경로를 역방향으로 탐색합니다.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="예: KB자산관리대부"
              className="flex-1 h-10 rounded-lg border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-[#153AD4]/30"
            />
            <Button
              onClick={() => handleSearch()}
              disabled={!query.trim() || isLoading}
              className="bg-[#153AD4] hover:bg-[#153AD4]/90 text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
            {results !== null && (
              <Button variant="ghost" size="icon" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
          {/* Quick pick */}
          <div className="flex gap-2 flex-wrap">
            {KNOWN_TARGETS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setQuery(k); handleSearch(k) }}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-muted transition-colors"
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-[#153AD4]" />
            <p className="text-sm">역방향 그래프 탐색 중...</p>
            <p className="text-xs opacity-60">현재 기관 → 상위 양도 기관 → 원채권 기관 역추적</p>
          </div>
        )}

        {/* No result */}
        {results !== null && !isLoading && results.length === 0 && (
          <div className="rounded-xl border border-dashed bg-muted/10 px-6 py-10 text-center text-sm text-muted-foreground">
            <p>"{queriedInstitution}"에 대한 역방향 탐색 결과가 없습니다.</p>
            <p className="text-xs mt-1 opacity-60">지식베이스에 해당 기관으로 연결된 양수도 이력이 없습니다.</p>
          </div>
        )}

        {/* Results */}
        {results !== null && !isLoading && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                역추적 결과 — <span className="text-[#153AD4]">{queriedInstitution}</span> 추정 보유 채권군
              </p>
              <span className="text-xs text-muted-foreground">{results.length}개 채권군</span>
            </div>

            <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-900/10 px-4 py-3">
              <p className="text-xs text-sky-700 dark:text-sky-400">
                ⚠ 역방향 탐색 결과는 과거 양수도 이력 기반 추론입니다. 실제 보유 현황은 공식 확인이 필요합니다.
              </p>
            </div>

            <div className="space-y-3">
              {results.map((item) => (
                <div key={item.portfolioName} className="rounded-xl border bg-card overflow-hidden">
                  <div className="px-5 py-4 bg-[#153AD4]/3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm">{item.portfolioName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          원채권 기관: {item.originator} · {item.productType}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs rounded-full border px-2 py-0.5 bg-background">{formatCount(item.caseCount)}</span>
                    </div>
                  </div>
                  <div className="px-5 py-3 border-t">
                    <p className="text-[10px] text-muted-foreground mb-2">양수도 경로 (역방향)</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {[...item.arrivalPath].reverse().map((node, ni) => {
                        // 역방향이므로 edgeTypes도 reverse
                        const reversedEdgeTypes = [...item.edgeTypes].reverse()
                        return (
                          <span key={ni} className="flex items-center gap-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                ni === 0
                                  ? "bg-[#153AD4]/10 text-[#153AD4] font-semibold"
                                  : ni === item.arrivalPath.length - 1
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {node}
                            </span>
                            {ni < item.arrivalPath.length - 1 && (
                              <span className="flex items-center gap-0.5">
                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 rotate-180" />
                                <span className={`text-[9px] rounded px-1 py-0.5 font-semibold leading-none ${
                                  reversedEdgeTypes[ni] === "합병"
                                    ? "bg-sky-50 text-sky-700 border border-sky-300 dark:bg-sky-900/20 dark:text-sky-400"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400"
                                }`}>{reversedEdgeTypes[ni]}</span>
                              </span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      양수 기간: {item.fromDate} ~ {item.toDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[#153AD4]/15 bg-[#153AD4]/3 px-4 py-3 text-xs text-[#153AD4] space-y-1">
              <p className="font-semibold">역방향 탐색 방법</p>
              <p>· 대상 기관 노드에서 상위 TRANSFEROR 엣지를 역방향 탐색</p>
              <p>· 원채권 기관(OWNS_ORIGINALLY)까지 경로를 완전 추적</p>
              <p>· 채권군별 최종 도달 경로만 표시 (중간 경로 요약)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab 4: AI 채팅
// ─────────────────────────────────────────────

type ChatMsg = {
  id: string
  role: "user" | "assistant"
  content: string
}

type ChatResponse = { content: string }

const CHAT_SEED: ChatMsg[] = [
  {
    id: "seed-u1",
    role: "user",
    content: "현대카드 장기연체 채권은 현재 어느 기관이 갖고 있을 가능성이 높아?",
  },
  {
    id: "seed-a1",
    role: "assistant",
    content: [
      "지식베이스 탐색을 수행한 결과입니다.",
      "",
      "### 현대카드 장기연체 채권군 — 현재 보유 기관 추론",
      "",
      "| 순위 | 기관 | 유형 | 추정 건수 | 확률 | 신뢰도 |",
      "|------|------|------|-----------|------|--------|",
      "| 1 | **KB자산관리대부** | 자산관리사 | 3,100건 | **50%** | 92% |",
      "| 2 | 우리채권관리 | 채권관리사 | 1,900건 | 25% | 88% |",
      "| 3 | 하나에셋대부 | 대부업체 | 1,580건 | 25% | 85% |",
      "",
      "&nbsp;",
      "",
      "> ⚠ 본 결과는 지식베이스 기반 AI 추론이며, 실제 현황과 다를 수 있습니다. 공식 확인 후 활용하세요.",
    ].join("\n"),
  },
]

function generateChatResponse(userMsg: string): ChatResponse {
  const msg = userMsg

  if (msg.includes("현대카드")) {
    return {
      content: [
        "지식베이스 탐색을 수행한 결과입니다.",
        "",
        "**현대카드 장기연체 채권군** 추론 결과입니다.",
        "",
        "| 기관 | 확률 | 추정 건수 |",
        "|------|------|-----------|",
        "| KB자산관리대부 | 50% | 3,100건 |",
        "| 우리채권관리 | 25% | 1,900건 |",
        "| 하나에셋대부 | 25% | 1,580건 |",
        "",
        "> ⚠ 지식베이스 기반 추론입니다. 실제 현황은 공식 확인이 필요합니다.",
      ].join("\n"),
    }
  }

  if (msg.includes("삼성카드")) {
    return {
      content: [
        "지식베이스 탐색을 수행한 결과입니다.",
        "",
        "**삼성카드 개인신용대출 채권군** 추론 결과입니다.",
        "",
        "| 기관 | 확률 | 추정 건수 |",
        "|------|------|-----------|",
        "| 예스에셋 | 70% | 2,800건 |",
        "| M자산관리 | 30% | 1,200건 |",
        "",
        "> ⚠ 지식베이스 기반 추론입니다.",
      ].join("\n"),
    }
  }

  if (msg.includes("KB국민카드") || msg.includes("국민카드")) {
    return {
      content: [
        "지식베이스 탐색을 수행한 결과입니다.",
        "",
        "**KB국민카드 장기연체 채권군** 추론 결과입니다.",
        "",
        "| 기관 | 확률 | 추정 건수 |",
        "|------|------|-----------|",
        "| KB자산관리대부 | 62% | 4,200건 |",
        "| 웰컴저축은행 | 38% | 2,600건 |",
        "",
        "> ⚠ 지식베이스 기반 추론입니다.",
      ].join("\n"),
    }
  }

  if (msg.includes("제논카드")) {
    return {
      content: [
        "지식베이스 탐색을 수행한 결과입니다.",
        "",
        "**제논카드 연체 신용대출 채권군** 추론 결과입니다.",
        "",
        "| 기관 | 확률 | 추정 건수 |",
        "|------|------|-----------|",
        "| 하나에셋대부 | 63% | 2,200건 |",
        "| 한국자산관리공사 | 37% | 1,300건 |",
        "",
        "> ⚠ 지식베이스 기반 추론입니다.",
      ].join("\n"),
    }
  }

  if (msg.includes("KB자산관리대부") || msg.includes("kb자산")) {
    return {
      content: [
        "지식베이스 탐색을 수행한 결과입니다.",
        "",
        "**KB자산관리대부** 역방향 탐색 결과입니다.",
        "",
        "**1. 현대카드 장기연체 채권군** — 양수 기간 2023-06 ~ 2024-01 / 3,100건",
        "",
        "**2. KB국민카드 장기연체 채권군** — 양수 기간 2024-06 ~ 2024-12 / 4,200건",
        "",
        "> ⚠ 지식베이스 기반 추론입니다.",
      ].join("\n"),
    }
  }

  if (msg.includes("하나에셋")) {
    return {
      content: [
        "지식베이스 탐색을 수행한 결과입니다.",
        "",
        "**하나에셋대부** 보유 채권 내역입니다.",
        "",
        "**1. 현대카드 장기연체 채권군** — 양수 기간 2024-03 ~ 2024-09 / 1,580건",
        "",
        "**2. 제논카드 연체 신용대출 채권군** — 양수 기간 2023-09 ~ 2024-03 / 2,200건",
        "",
        "> ⚠ 지식베이스 기반 추론입니다.",
      ].join("\n"),
    }
  }

  if (msg.includes("건수") && (msg.includes("많") || msg.includes("최대") || msg.includes("최고"))) {
    return {
      content: [
        "지식베이스 내 **양수도 건수 상위** 이벤트입니다.",
        "",
        "| 순위 | 양도기관 | 양수기관 | 건수 | 기간 |",
        "|------|----------|----------|------|------|",
        "| 1 | KB국민카드 | 웰컴저축은행 | **6,800건** | 2022-03~2023-03 |",
        "| 2 | 현대카드 | JT친애저축은행 | **5,230건** | 2022-01~2022-12 |",
        "| 3 | 삼성카드 | SBI저축은행 | **4,100건** | 2021-06~2022-06 |",
        "| 4 | 웰컴저축은행 | KB자산관리대부 | **4,200건** | 2024-06~2024-12 |",
        "| 5 | 제논카드 | 한국자산관리공사 | **3,500건** | 2021-09~2022-09 |",
      ].join("\n"),
    }
  }

  if (msg.includes("이력") || msg.includes("현황") || msg.includes("전체") || msg.includes("지식베이스")) {
    return {
      content: [
        "현재 지식베이스에 구성된 **채권양수도 이력 현황**입니다.",
        "",
        "| 구분 | 내용 |",
        "|------|------|",
        "| 총 이벤트 수 | 12건 |",
        "| 원채권 기관 | 현대카드, 삼성카드, KB국민카드, 제논카드 |",
        "| 중간 양수 기관 | JT친애저축은행, SBI저축은행, 웰컴저축은행, 미래자산관리, 한국자산관리공사 |",
        "| 최종 보유 기관 | KB자산관리대부, 하나에셋대부, 우리채권관리, 예스에셋, M자산관리 |",
        "| 총 양수도 건수 | 약 40,810건 |",
        "| 데이터 출처 | 채권기관 변경 신고 / 과거 양수도 이력 CSV |",
        "",
        "추론 또는 역방향 탐색을 원하시면 기관명을 말씀해주세요.",
      ].join("\n"),
    }
  }

  if (msg.includes("역방향") || msg.includes("어디서") || msg.includes("출처") || msg.includes("원채권")) {
    return {
      content: [
        "역방향 탐색은 **현재 보유 기관에서 원채권 기관까지 역추적**하는 기능입니다.",
        "",
        "탐색 가능한 기관 목록:",
        "- **KB자산관리대부** — 현대카드, KB국민카드 채권 보유 추정",
        "- **하나에셋대부** — 현대카드, 제논카드 채권 보유 추정",
        "- **예스에셋** — 삼성카드 채권 보유 추정",
        "- **M자산관리** — 삼성카드 채권 보유 추정",
        "- **우리채권관리** — 현대카드 채권 보유 추정",
        "",
        "구체적인 기관명을 말씀해 주시면 상세 역추적 결과를 보여드리겠습니다.",
      ].join("\n"),
    }
  }

  return {
    content: [
      "안녕하세요. **채권양수도 에이전트**입니다.",
      "",
      "아래와 같은 질의를 처리할 수 있습니다.",
      "",
      "- **채권 위치 추론**: \"현대카드 채권이 지금 어디 있나요?\"",
      "- **역방향 탐색**: \"KB자산관리대부가 가진 채권의 원출처는?\"",
      "- **이력 현황**: \"전체 양수도 이력을 보여줘\"",
      "- **건수/규모 조회**: \"건수가 가장 많은 거래는?\"",
      "",
      "질문을 입력해 주세요.",
    ].join("\n"),
  }
}

function ChatPanel() {
  const [messages, setMessages] = useState<ChatMsg[]>(CHAT_SEED)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    await new Promise((r) => setTimeout(r, 1200))

    const { content } = generateChatResponse(text)
    const assistantMsg: ChatMsg = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content,
    }
    setMessages((prev) => [...prev, assistantMsg])
    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const SUGGESTIONS = [
    "현대카드 장기연체 채권은 지금 어느 기관에 있나?",
    "KB자산관리대부가 보유한 채권의 원출처를 추적해줘",
    "건수가 가장 많은 양수도 이벤트는?",
    "전체 양수도 이력 현황을 요약해줘",
  ]

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Section header */}
      <div className="px-6 py-3 border-b bg-[#153AD4]/5 shrink-0">
        <p className="text-sm font-semibold text-[#153AD4]">질의-응답</p>
        <p className="text-xs text-muted-foreground mt-0.5">채권 보유 기관 추론, 양수도 이력 현황 등을 자연어로 질문하세요.</p>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "items-start"}`}>
            {/* Avatar */}
            <div
              className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-white ${
                msg.role === "user" ? "bg-slate-500" : "bg-[#153AD4]"
              }`}
            >
              {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Bubble */}
            {msg.role === "user" ? (
              <div className="max-w-[70%] rounded-2xl rounded-tr-none bg-[#153AD4] px-4 py-3 text-sm leading-6 text-white">
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ) : (
              <div className="flex-1 min-w-0 space-y-3">
                <div className="rounded-2xl rounded-tl-none bg-muted/60 border px-4 py-3 text-sm leading-6">
                  <MarkdownRenderer content={msg.content} />
                </div>

                {/* Graph visualization — per institution */}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#153AD4] text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-muted/60 border px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#153AD4]" />
              <span className="text-xs text-muted-foreground">그래프 탐색 중...</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-6 pb-3 flex gap-2 flex-wrap shrink-0">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setInput(s); textareaRef.current?.focus() }}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted transition-colors text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t px-6 py-4 shrink-0">
        <div className="relative max-w-4xl mx-auto">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="채권 위치 추론에 대해 질문하세요..."
            className="min-h-[80px] pr-14 resize-none border border-[#EBEFF5] shadow-[0_0_10px_rgba(21,58,212,0.08)] rounded-2xl px-5 py-4 dark:bg-[#414141] dark:border-none"
            disabled={isLoading}
          />
          <div className="absolute bottom-3 right-3">
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-9 w-9 rounded-full bg-[#153AD4] text-white hover:bg-[#153AD4]/90"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────
// Main DebtTransferTool
// ─────────────────────────────────────────────

export function DebtTransferTool() {
  const searchParams = useSearchParams()
  const tab = searchParams?.get("tab") ?? "knowledge"

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {tab === "knowledge" && <KnowledgeBasePanel />}
      {tab === "inference" && <InferencePanel />}
      {tab === "chat" && <ChatPanel />}
    </div>
  )
}

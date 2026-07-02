/**
 * SFR-016 목업 하드코딩 데이터.
 * 실제 파일 I/O 없이 데모 흐름을 재현하기 위한 정적 자료만 모음.
 */

import type {
  AdminDataset,
  AnalysisResultRow,
  CitationSnippet,
  DataColumn,
  DocumentTreeNode,
  MetricRow,
  SampleFile,
  SampleFileKind,
  SummaryParagraph,
} from "./types"

export const sampleFiles: Record<SampleFileKind, SampleFile> = {
  xlsx: {
    kind: "xlsx",
    name: "상담이력_2026Q1_비식별.xlsx",
    sizeLabel: "3.8 MB · 12,482 행",
  },
  hwpx: {
    kind: "hwpx",
    name: "채무조정업무규정_개정안.hwpx",
    sizeLabel: "1.2 MB · 42 페이지",
  },
  "xlsx-pii": {
    kind: "xlsx-pii",
    name: "민원이력_원본_2026Q1.xlsx",
    sizeLabel: "4.1 MB · 15,203 행",
  },
  "xlsx-incomplete": {
    kind: "xlsx-incomplete",
    name: "상담이력_간소화_2026Q1.xlsx",
    sizeLabel: "1.1 MB · 4,210 행",
  },
}

/** PII 차단 시나리오에서 탐지된 개인정보 건수 (목업 고정값) */
export const piiDetection = {
  rrn: 2,
  phone: 5,
}

export const dataColumns: DataColumn[] = [
  {
    name: "상담일시",
    dtype: "datetime",
    examples: ["2026-01-03 09:14:22"],
  },
  {
    name: "상담유형",
    dtype: "string",
    examples: ["개인채무조정", "새출발기금"],
  },
  {
    name: "상담방법",
    dtype: "string",
    examples: ["전화", "방문", "온라인"],
  },
  {
    name: "처리시간_분",
    dtype: "int",
    examples: ["18", "32", "45"],
  },
  {
    name: "만족도",
    dtype: "int (1~5)",
    examples: ["4", "5"],
  },
  {
    name: "상담결과",
    dtype: "string",
    examples: ["완료", "후속조치 필요", "타부서 이관"],
  },
  {
    name: "담당부서",
    dtype: "string",
    examples: ["서울중앙지부", "대구지부"],
  },
  {
    name: "연령대",
    dtype: "string",
    examples: ["30대", "50대", "60대 이상"],
  },
  {
    name: "채무규모_만원",
    dtype: "int",
    examples: ["5,000", "15,000"],
  },
  {
    name: "연체기간_일",
    dtype: "int",
    examples: ["90", "180", "365"],
  },
]

export const generatedPythonCode = `import pandas as pd

# 1) 업로드 파일 로드 (격리 환경의 임시 경로)
df = pd.read_excel("/sandbox/uploads/상담이력_2026Q1.xlsx")

# 2) PII 마스킹 컬럼 제외, 분석 대상 컬럼만 선택
cols = ["상담일시", "상담유형", "처리시간_분", "만족도", "담당부서"]
df = df[cols].dropna(subset=["상담유형", "처리시간_분"])

# 3) 상담유형별 평균 처리시간 / 건수 집계
agg = (
    df.groupby("상담유형", as_index=False)
      .agg(avg_minutes=("처리시간_분", "mean"),
           count=("상담유형", "size"),
           avg_csat=("만족도", "mean"))
      .sort_values("avg_minutes", ascending=False)
)

# 4) 결과 직렬화 (상위 에이전트로 반환)
result = agg.round(2).to_dict(orient="records")
`

export const analysisChartData: AnalysisResultRow[] = [
  { category: "개인채무조정", avgMinutes: 34.2, count: 4128 },
  { category: "새출발기금", avgMinutes: 28.6, count: 2964 },
  { category: "소액대출 상담", avgMinutes: 21.4, count: 1873 },
  { category: "사전채무조정", avgMinutes: 19.8, count: 1502 },
  { category: "신용교육 문의", avgMinutes: 12.1, count: 1215 },
  { category: "기타 안내", avgMinutes: 8.7, count: 800 },
]

export const analysisMetrics: MetricRow[] = [
  { label: "전체 상담 건수", value: "12,482건", delta: "+6.3% QoQ" },
  { label: "평균 처리시간", value: "24.1분", delta: "-2.4분 QoQ" },
  { label: "평균 만족도", value: "4.3 / 5.0", delta: "+0.1" },
  { label: "최다 유형", value: "개인채무조정 (33.1%)" },
  { label: "완료율", value: "87.4%", delta: "+3.2%p QoQ" },
  { label: "평균 채무규모", value: "8,420만원" },
]

/**
 * 분석 결과에서 도출된 주요 인사이트 — 사용자에게 핵심 발견사항을 요약해 전달.
 */
export const analysisInsights: string[] = [
  "개인채무조정 상담이 평균 34.2분으로 가장 오래 걸리며, 전체 상담의 33.1%를 차지합니다. 상담사 배치 시 우선 고려가 필요합니다.",
  "신용교육 문의는 평균 12.1분으로 가장 빠르게 처리되고 있어, 온라인 채널 전환 시 효율 개선 여지가 큽니다.",
  "전체 평균 처리시간이 전분기 대비 2.4분 감소했으나, 개인채무조정은 오히려 1.8분 증가해 유형별 차이가 확대되고 있습니다.",
  "50대 이상 연령대의 상담 만족도(4.5/5.0)가 30대(4.1/5.0)보다 높은데, 상담방법 선호도 차이(방문 vs 온라인)가 영향으로 보입니다.",
]

export const documentTree: DocumentTreeNode[] = [
  {
    id: "ch1",
    title: "제1장 총칙",
    children: [
      { id: "ch1-1", title: "제1조 목적" },
      { id: "ch1-2", title: "제2조 정의" },
      { id: "ch1-3", title: "제3조 적용 범위" },
    ],
  },
  {
    id: "ch2",
    title: "제2장 채무조정 기준",
    children: [
      { id: "ch2-1", title: "제4조 신청 자격" },
      { id: "ch2-2", title: "제5조 조정 대상 채무" },
      { id: "ch2-3", title: "제6조 상환능력 평가" },
    ],
  },
  {
    id: "ch3",
    title: "제3장 심의 및 의결",
    children: [
      { id: "ch3-1", title: "제7조 심의위원회 구성" },
      { id: "ch3-2", title: "제8조 의결 정족수" },
    ],
  },
  {
    id: "ch4",
    title: "제4장 사후 관리",
    children: [
      { id: "ch4-1", title: "제9조 이행 점검" },
      { id: "ch4-2", title: "제10조 실효 및 해지" },
    ],
  },
]

export const citationSnippets: Record<string, CitationSnippet> = {
  "p.3 제2조": {
    id: "p.3 제2조",
    label: "제1장 제2조 (정의)",
    quote:
      '"채무조정"이란 채무자의 상환능력을 평가하여 원리금 감면, 상환기간 연장 등 채무 구조를 재조정하는 일련의 절차를 말한다.',
  },
  "p.7 제4조제2항": {
    id: "p.7 제4조제2항",
    label: "제2장 제4조 제2항",
    quote:
      "개정안은 신청 자격 중 총부채 상한을 기존 15억 원에서 25억 원으로 상향하고, 연체 기간 요건을 3개월에서 1개월로 완화한다.",
  },
  "p.12 제5조": {
    id: "p.12 제5조",
    label: "제2장 제5조 (조정 대상 채무)",
    quote:
      "조정 대상 채무의 범위에 보증채무 및 구상채권을 포함하되, 고의적 연체로 판단되는 채무는 제외한다.",
  },
  "p.18 제6조제1항": {
    id: "p.18 제6조제1항",
    label: "제2장 제6조 제1항",
    quote:
      "상환능력 평가는 월 가처분소득 대비 원리금 비율(DSR)과 자산 실사 결과를 종합하여 산정한다.",
  },
}

export const summaryParagraphs: SummaryParagraph[] = [
  {
    body:
      "개정안의 핵심은 채무조정 신청 자격 완화입니다. 총부채 상한을 15억 원에서 25억 원으로 상향하고, 연체 기간 요건을 3개월에서 1개월로 단축하여 조기 개입 범위를 대폭 확대합니다. 이로 인해 종전에는 신청 자격이 없었던 고액 채무자와 단기 연체자도 제도권에 진입할 수 있게 됩니다.",
    citations: ["p.7 제4조제2항"],
  },
  {
    body:
      "조정 대상 채무 범위가 명확해졌습니다. 기존 원리금 채무 외에 보증채무와 구상채권을 포함하되, 고의적 연체가 확인되는 채무는 제외하는 원칙이 신설되었습니다. 이를 통해 선의의 채무자는 더 넓은 범위의 채무를 정리할 수 있고, 악의적 사례는 사전에 걸러집니다.",
    citations: ["p.3 제2조", "p.12 제5조"],
  },
  {
    body:
      "상환능력 평가 방식이 DSR 기반 정량 평가와 자산 실사 결과를 결합하는 방식으로 일원화됩니다. 종전에는 지부별로 판정 기준에 편차가 있었으나, 개정안 시행 이후에는 전국 동일 기준 적용으로 심사 투명성이 강화될 것으로 기대됩니다.",
    citations: ["p.18 제6조제1항"],
  },
  {
    body:
      "사후관리 조항이 신설 수준으로 구체화되었습니다. 이행 점검 주기를 분기 단위로 명시하고, 연속 2회 미이행 시 자동 실효 사유로 규정했습니다. 조정 이후의 재연체 리스크를 선제적으로 관리하려는 의도입니다.",
    citations: ["p.18 제6조제1항"],
  },
]

/**
 * 문서 분석에서 도출된 주요 인사이트 — 변경 사항의 실무 영향을 요약.
 */
export const documentInsights: string[] = [
  "총부채 상한 상향(15억→25억)으로 채무조정 신청 가능 인원이 약 30~40% 증가할 것으로 추정됩니다. 상담 인력 확충과 심사 프로세스 보강이 선제적으로 필요합니다.",
  "연체 기간 완화(3개월→1개월)로 초기 연체 단계에서의 조기 개입이 가능해져, 장기 연체로의 악화를 예방하는 효과가 기대됩니다.",
  "보증채무·구상채권 포함은 다수 채권자에 대한 통합 조정을 가능하게 하나, 채권금융회사 간 이해관계 조정 복잡도가 높아질 수 있습니다.",
  "DSR 기반 평가 일원화로 지부별 심사 편차는 줄지만, 자산 실사 기준의 세부 운영 지침이 아직 미비하여 후속 시행세칙 개정이 필요할 것으로 보입니다.",
]

/**
 * 사용자에게 노출되는 활용 데이터 목록.
 * - 비식별화 완료된 데이터만 포함 (진행 중·검토 필요는 관리자 전용 → 미노출)
 * - 데이터분석 모드 맥락이므로 XLSX/CSV만 (HWPX/PDF는 문서분석 모드 맥락)
 */
export const adminDatasets: AdminDataset[] = [
  {
    name: "상담이력_2026Q1.xlsx",
    owner: "상담운영팀",
    registeredAt: "2026-04-02",
    status: "비식별화 완료",
  },
  {
    name: "새출발기금_신청현황_202603.csv",
    owner: "새출발사업단",
    registeredAt: "2026-03-25",
    status: "비식별화 완료",
  },
  {
    name: "소액대출_상환추이_202601_03.xlsx",
    owner: "리스크관리팀",
    registeredAt: "2026-03-18",
    status: "비식별화 완료",
  },
  {
    name: "신용교육_만족도_2025H2.xlsx",
    owner: "교육운영팀",
    registeredAt: "2026-02-11",
    status: "비식별화 완료",
  },
]

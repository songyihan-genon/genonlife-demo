import {
  WatchlistStock,
  CurrencyCode,
  SourceInfo,
  TextWithSources,
  EventNewsItem,
  EventNewsData,
  StockQuote,
  StockDataPoint,
  NarrativeSection,
  SimpleEvent,
  StockDetails,
} from "@/types/domain"

export const samsungUniverseStocks: WatchlistStock[] = [
  { id: "005380-default", ticker: "005380", name: "현대차", sector: "자동차", market: "KOSPI", marketCap: "대형주", price: "219,000", changePercent: "-5.35", currency: 'KRW' },
  { id: "005930-default", ticker: "005930", name: "삼성전자", sector: "반도체", market: "KOSPI", marketCap: "대형주", price: "84,100", changePercent: "+0.71", currency: 'KRW' },
  { id: "000660-default", ticker: "000660", name: "SK하이닉스", sector: "반도체", market: "KOSPI", marketCap: "대형주", price: "361,000", changePercent: "-2.08", currency: 'KRW' },
  { id: "035420-default", ticker: "035420", name: "NAVER", sector: "IT서비스", market: "KOSPI", marketCap: "대형주", price: "231,000", changePercent: "+1.73", currency: 'KRW' },
  { id: "051910-default", ticker: "051910", name: "LG화학", sector: "화학", market: "KOSPI", marketCap: "대형주", price: "290,500", changePercent: "-2.68", currency: 'KRW' },
  { id: "068270-default", ticker: "068270", name: "셀트리온", sector: "바이오", market: "KOSPI", marketCap: "대형주", price: "175,200", changePercent: "+4.89", currency: 'KRW' },
  { id: "GOOGL-default", ticker: "GOOGL", name: "Alphabet A", sector: "IT서비스", market: "NASDAQ", marketCap: "대형주", price: "178.20", changePercent: "+1.25", currency: 'USD' }
]

export const DEFAULT_WATCHLIST: WatchlistStock[] = [
  {
    ...samsungUniverseStocks[0],
    id: "default-watchlist-005380",
  },
  {
    ...samsungUniverseStocks[6],
    id: "default-watchlist-GOOGL",
  },
]

export const STOCK_MARKET_OPTIONS = ["KOSPI", "KOSDAQ", "NASDAQ", "NYSE", "ETF", "기타"]
export const DEFAULT_CURRENCY: CurrencyCode = 'KRW'
export const MARKET_DEFAULT_CURRENCY: Record<string, CurrencyCode> = {
  KOSPI: 'KRW',
  KOSDAQ: 'KRW',
  NASDAQ: 'USD',
  NYSE: 'USD',
  ETF: 'KRW',
  기타: 'KRW',
}
export const CURRENCY_OPTIONS: { value: CurrencyCode; label: string }[] = [
  { value: 'KRW', label: 'KRW (원)' },
  { value: 'USD', label: 'USD ($)' },
]

export const getDefaultCurrencyForMarket = (market?: string | null): CurrencyCode => {
  const normalizedMarket = market?.toUpperCase()
  if (normalizedMarket && MARKET_DEFAULT_CURRENCY[normalizedMarket]) {
    return MARKET_DEFAULT_CURRENCY[normalizedMarket]
  }
  return DEFAULT_CURRENCY
}

export const normalizeCurrencyValue = (currency?: string | null, market?: string | null): CurrencyCode => {
  const normalizedCurrency = currency?.toUpperCase() as CurrencyCode | undefined
  if (normalizedCurrency && CURRENCY_OPTIONS.some(option => option.value === normalizedCurrency)) {
    return normalizedCurrency
  }
  return getDefaultCurrencyForMarket(market)
}

export const formatPriceByCurrency = (price: number, currency: CurrencyCode) => {
  if (currency === 'USD') {
    return `$${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  return `${price.toLocaleString('ko-KR')}원`
}

export const ensureCurrencyOnStocks = (stocks: WatchlistStock[]): WatchlistStock[] =>
  stocks.map(stock => ({
    ...stock,
    currency: normalizeCurrencyValue(stock.currency, stock.market),
  }))

export const createDefaultWatchlist = () => ensureCurrencyOnStocks(DEFAULT_WATCHLIST.map(stock => ({ ...stock })))

export const generateStockId = () => {
  const cryptoObj = typeof globalThis !== "undefined" ? (globalThis.crypto as Crypto | undefined) : undefined
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID()
  }
  return `stock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const NEWS_SOURCE_META: Record<string, { domain: string }> = {
  '연합뉴스': { domain: 'yna.co.kr' },
  '경제일보': { domain: 'edaily.co.kr' },
  '머니투데이': { domain: 'mt.co.kr' },
  '로이터': { domain: 'reuters.com' },
  'Reuters': { domain: 'reuters.com' },
  '블룸버그': { domain: 'bloomberg.com' },
  'Bloomberg': { domain: 'bloomberg.com' },
  '뉴욕타임즈': { domain: 'nytimes.com' },
  'The New York Times': { domain: 'nytimes.com' },
  'AP 통신': { domain: 'apnews.com' },
  'The Washington Post': { domain: 'washingtonpost.com' },
  '워싱턴포스트': { domain: 'washingtonpost.com' },
  '월스트리트저널': { domain: 'wsj.com' },
  'Wall Street Journal': { domain: 'wsj.com' },
  'Los Angeles Times': { domain: 'latimes.com' },
  'Financial Times': { domain: 'ft.com' },
  '파이낸셜타임즈': { domain: 'ft.com' },
  'CNBC': { domain: 'cnbc.com' },
  'S&P Global': { domain: 'spglobal.com' },
  '기획재정부': { domain: 'moef.go.kr' },
  '서울경제': { domain: 'sedaily.com' },
  '현대차 IR': { domain: 'hyundai.com' },
  '외교부': { domain: 'mofa.go.kr' },
  '한국거래소': { domain: 'krx.co.kr' },
  '한국경제': { domain: 'hankyung.com' },
  '조선비즈': { domain: 'biz.chosun.com' }
}

export const getNewsSourceFaviconUrl = (source: SourceInfo) => {
  if (source.url) {
    try {
      const hostname = new URL(source.url).hostname
      return `https://www.google.com/s2/favicons?domain=${hostname}`
    } catch (error) {
      console.warn('잘못된 뉴스 URL:', source.url, error)
    }
  }

  const mapped = NEWS_SOURCE_META[source.name]
  if (mapped?.domain) {
    return `https://www.google.com/s2/favicons?domain=${mapped.domain}`
  }

  return 'https://www.google.com/s2/favicons?domain=news.google.com'
}

export const macroIndicators = [
  { id: "usdkrw", name: "USD/KRW 환율", value: "1,340.50", change: "+8.20", unit: "원", selected: true },
  { id: "kospi", name: "KOSPI 지수", value: "2,645.32", change: "+12.34", unit: "P" },
  { id: "kosdaq", name: "KOSDAQ 지수", value: "824.15", change: "-5.67", unit: "P" },
  { id: "jpykrw", name: "JPY/KRW 환율", value: "9.12", change: "-0.15", unit: "원" },
  { id: "eurkrw", name: "EUR/KRW 환율", value: "1,458.75", change: "+3.40", unit: "원" },
  { id: "kr10y", name: "한국 10년 국채금리", value: "3.45%", change: "+0.08", unit: "%" },
  { id: "us10y", name: "미국 10년 국채금리", value: "4.25%", change: "+0.05", unit: "%" },
  { id: "oil", name: "두바이유", value: "$85.60", change: "+1.85", unit: "/배럴" },
  { id: "gold", name: "금 선물", value: "$1,965.80", change: "-8.40", unit: "/온스" },
  { id: "copper", name: "구리 선물", value: "$8,250", change: "+125", unit: "/톤" },
  { id: "vix", name: "VIX 공포지수", value: "18.42", change: "-1.23", unit: "" },
  { id: "dxy", name: "달러인덱스", value: "102.85", change: "+0.45", unit: "" }
]

export const stockProfileMap: Record<string, {
  summary: string
  metrics: { label: string; value: string }[]
}> = {
  "005380": {
    summary: "현대차는 글로벌 완성차 제조사로 EV/배터리 JV 투자 확대 중",
    metrics: [
      { label: "PER", value: "7.9x" },
      { label: "PBR", value: "0.65x" },
      { label: "ROE", value: "8.5%" },
    ],
  },
  "005930": {
    summary: "삼성전자는 메모리 반도체 및 모바일 기기 글로벌 리더",
    metrics: [
      { label: "PER", value: "14.2x" },
      { label: "PBR", value: "1.8x" },
      { label: "ROE", value: "12.3%" },
    ],
  },
}

export const mockStockDetailsMap: Record<string, StockDetails> = {
  "005380": {
    ticker: "005380",
    name: "현대차",
    description: "현대차는 전기차·배터리 JV 투자를 확대하며 글로벌 생산 체제를 고도화하고 있습니다.",
    market_cap: 55_000_000_000_000,
    per: 7.9,
    eps: 28_500,
    roe: 0.085,
    currency: "KRW",
    cached: true,
  },
  "005930": {
    ticker: "005930",
    name: "삼성전자",
    description: "삼성전자는 메모리 반도체와 모바일 기기 분야의 글로벌 리더로, AI 수요에 맞춘 HBM 투자를 확대 중입니다.",
    market_cap: 480_000_000_000_000,
    per: 14.2,
    eps: 4_500,
    roe: 0.123,
    currency: "KRW",
    cached: true,
  },
  "000660": {
    ticker: "000660",
    name: "SK하이닉스",
    description: "SK하이닉스는 고대역폭 메모리(HBM)와 DDR5 등 첨단 메모리 제품에서 경쟁력을 확보하고 있습니다.",
    market_cap: 80_000_000_000_000,
    per: 18.3,
    eps: 19_200,
    roe: 0.098,
    currency: "KRW",
    cached: true,
  },
  "035420": {
    ticker: "035420",
    name: "NAVER",
    description: "네이버는 검색·커머스·핀테크와 함께 클라우드, 하이퍼클로바X 등 AI 서비스 투자를 강화하고 있습니다.",
    market_cap: 37_000_000_000_000,
    per: 26.5,
    eps: 3_100,
    roe: 0.112,
    currency: "KRW",
    cached: true,
  },
  "051910": {
    ticker: "051910",
    name: "LG화학",
    description: "LG화학은 전지소재, 첨단소재, 생명과학을 아우르는 종합 화학 기업으로 배터리 핵심소재 투자를 확대 중입니다.",
    market_cap: 43_000_000_000_000,
    per: 21.1,
    eps: 10_200,
    roe: 0.074,
    currency: "KRW",
    cached: true,
  },
  "068270": {
    ticker: "068270",
    name: "셀트리온",
    description: "셀트리온은 바이오시밀러와 케미컬 의약품을 중심으로 글로벌 헬스케어 플랫폼 전환을 추진하고 있습니다.",
    market_cap: 24_000_000_000_000,
    per: 35.4,
    eps: 3_600,
    roe: 0.096,
    currency: "KRW",
    cached: true,
  },
}

export const recentEventsMap: Record<string, SimpleEvent[]> = {
  "005380": [
    { type: "뉴스", date: "09.15", title: "현대차 주가 급락", summary: "조지아 공장 관련 법집행 이슈 재부각, 투자심리 위축" },
    { type: "뉴스", date: "09.11", title: "현대차 주가 상승", summary: "불확실성 완화 기대와 순환매 유입으로 반등" },
    { type: "공시", date: "08.13", title: "현지 투자 관련 업데이트", summary: "생산 일정 조정 및 JV 투자 확대 계획 점검" },
  ],
  "005930": [
    { type: "실적", date: "09.10", title: "분기 실적 프리뷰", summary: "메모리 가격 반등으로 실적 개선 기대" },
    { type: "뉴스", date: "09.05", title: "HBM 수주 확대", summary: "AI 수요 견조, HBM 증설 계획 긍정" },
    { type: "공시", date: "08.28", title: "자사주 취득", summary: "주주환원 강화 신호로 시장 우호적" },
  ],
}

export const usdKrwExchangeRateData = [
  { date: '2025-07-25', rate: 1383.64 },
  { date: '2025-07-28', rate: 1389.58 },
  { date: '2025-07-29', rate: 1388.39 },
  { date: '2025-07-30', rate: 1393.18 },
  { date: '2025-07-31', rate: 1392.47 },
  { date: '2025-08-01', rate: 1389.03 },
  { date: '2025-08-04', rate: 1385.57 },
  { date: '2025-08-05', rate: 1386.79 },
  { date: '2025-08-06', rate: 1384.67 },
  { date: '2025-08-07', rate: 1383.70 },
  { date: '2025-08-08', rate: 1388.83 },
  { date: '2025-08-11', rate: 1390.86 },
  { date: '2025-08-12', rate: 1384.17 },
  { date: '2025-08-13', rate: 1379.80 },
  { date: '2025-08-14', rate: 1388.95 },
  { date: '2025-08-15', rate: 1388.97 },
  { date: '2025-08-18', rate: 1388.88 },
  { date: '2025-08-19', rate: 1393.26 },
  { date: '2025-08-20', rate: 1397.88 },
  { date: '2025-08-21', rate: 1401.19 },
  { date: '2025-08-22', rate: 1384.20 },
  { date: '2025-08-25', rate: 1390.57 },
  { date: '2025-08-26', rate: 1395.08 },
  { date: '2025-08-27', rate: 1393.30 },
  { date: '2025-08-28', rate: 1385.55 },
  { date: '2025-08-29', rate: 1388.97 },
  { date: '2025-09-01', rate: 1393.05 },
  { date: '2025-09-02', rate: 1395.80 },
  { date: '2025-09-03', rate: 1390.42 },
  { date: '2025-09-04', rate: 1393.52 },
  { date: '2025-09-05', rate: 1386.42 },
  { date: '2025-09-08', rate: 1385.28 },
  { date: '2025-09-09', rate: 1389.25 },
  { date: '2025-09-10', rate: 1389.34 },
  { date: '2025-09-11', rate: 1389.66 },
  { date: '2025-09-12', rate: 1393.03 },
  { date: '2025-09-15', rate: 1385.13 }
]

export const usdKrwRateMap: Record<string, number> = usdKrwExchangeRateData.reduce(
  (acc, entry) => {
    acc[entry.date] = entry.rate
    return acc
  },
  {} as Record<string, number>
)

export const hyundaiStockData: StockDataPoint[] = [
  { date: '2025-07-25', price: 216500, volume: 425678, usdkrw: 1383.64 },
  { date: '2025-07-28', price: 218500, volume: 532104, usdkrw: 1389.58 },
  { date: '2025-07-29', price: 218000, volume: 387456, usdkrw: 1388.39 },
  { date: '2025-07-30', price: 223000, volume: 298732, usdkrw: 1393.18 },
  { date: '2025-07-31', price: 213000, volume: 445123, usdkrw: 1392.47 },
  { date: '2025-08-01', price: 210000, volume: 356789, usdkrw: 1389.03, eventId: 'event-2025-08-01' },
  { date: '2025-08-04', price: 211000, volume: 612345, usdkrw: 1385.57 },
  { date: '2025-08-05', price: 210500, volume: 398456, usdkrw: 1386.79 },
  { date: '2025-08-06', price: 210500, volume: 467890, usdkrw: 1384.67 },
  { date: '2025-08-07', price: 212500, volume: 543210, usdkrw: 1383.70 },
  { date: '2025-08-08', price: 212500, volume: 421678, usdkrw: 1388.83 },
  { date: '2025-08-11', price: 212500, volume: 389456, usdkrw: 1390.86 },
  { date: '2025-08-12', price: 213000, volume: 512789, usdkrw: 1384.17 },
  { date: '2025-08-13', price: 216000, volume: 445123, usdkrw: 1379.80, eventId: 'event-2025-08-13' },
  { date: '2025-08-14', price: 217500, volume: 367890, usdkrw: 1388.95 },
  { date: '2025-08-15', price: 216500, volume: 298765, usdkrw: 1388.97 },
  { date: '2025-08-18', price: 216500, volume: 298765, usdkrw: 1388.88 },
  { date: '2025-08-19', price: 219000, volume: 234567, usdkrw: 1393.26 },
  { date: '2025-08-20', price: 220500, volume: 345678, usdkrw: 1397.88 },
  { date: '2025-08-21', price: 221500, volume: 456789, usdkrw: 1401.19 },
  { date: '2025-08-22', price: 220000, volume: 398456, usdkrw: 1384.20 },
  { date: '2025-08-25', price: 222000, volume: 567890, usdkrw: 1390.57 },
  { date: '2025-08-26', price: 218500, volume: 423456, usdkrw: 1395.08 },
  { date: '2025-08-27', price: 220000, volume: 489123, usdkrw: 1393.30 },
  { date: '2025-08-28', price: 222000, volume: 534567, usdkrw: 1385.55 },
  { date: '2025-08-29', price: 220000, volume: 612345, usdkrw: 1388.97 },
  { date: '2025-09-01', price: 220500, volume: 445678, usdkrw: 1393.05 },
  { date: '2025-09-02', price: 220000, volume: 378901, usdkrw: 1395.80 },
  { date: '2025-09-03', price: 221500, volume: 523456, usdkrw: 1390.42 },
  { date: '2025-09-04', price: 221500, volume: 467890, usdkrw: 1393.52 },
  { date: '2025-09-05', price: 220000, volume: 425678, usdkrw: 1386.42 },
  { date: '2025-09-08', price: 218500, volume: 532104, usdkrw: 1385.28 },
  { date: '2025-09-09', price: 219000, volume: 387456, usdkrw: 1389.25 },
  { date: '2025-09-10', price: 220500, volume: 298732, usdkrw: 1389.34 },
  { date: '2025-09-11', price: 223000, volume: 445123, usdkrw: 1389.66, eventId: 'event-2025-09-11' },
  { date: '2025-09-12', price: 223500, volume: 356789, usdkrw: 1393.03 },
  { date: '2025-09-15', price: 215000, volume: 612345, usdkrw: 1385.13, eventId: 'event-2025-09-15' }
]

export const mockStockData: StockDataPoint[] = []

export const stockDataMap: Record<string, StockDataPoint[]> = {
  "005380": hyundaiStockData,
  "005930": mockStockData,
  "000660": mockStockData,
  "035420": mockStockData,
  "051910": mockStockData,
  "068270": mockStockData
}

export const hyundaiSummaryBullets: TextWithSources[] = [
  {
    text: '[1] 외생 요인: 2025년 9월 초 발생한 대규모 이민단속(약 475명 체포)·연관 행정수사로 초래된 운영중단·외교 마찰이 당면 리스크. 단기 가동·공급망·인력 충원에 직접적 영향.',
    sources: [
    ],
  },
  {
    text: '[2] 기업 요인: 공장 가동 지연·안전 사고(건설 단계 사망·사고 보고)·현지 운영(기술이전·현지인력 역량) 문제가 실적·스케줄에 미치는 영향 큼. 현대 측은 투자 확대·확장 계획을 발표했으나(확장 투자 발표는 시장 반응 분산).',
    sources: [
    ],
  },
  {
    text: '[3] 섹터 요인: 미국 내 배터리·EV 산업의 정책·규제(배출 규제·보조금 등) 변화와 글로벌 배터리 공급망 압력은 공장 가치와 경쟁력에 영향. 업계 전반에서 이번 사태가 투자·현지화 전략 재검토 촉발.',
    sources: [
    ],
  },
  {
    text: '[4] 매크로 요인: 미·한 외교·무역 관계, 달러·금리·인플레이션 등은 직접적이진 않지만 투자 환경·공급망 비용·현지 인건비·보험·계약 리스크에 파급. 특히 한·미 관계 악화 시 한국기업 리스크 프리미엄 상승 가능.',
    sources: [
    ],
  },
  {
    text: '[5] 비정형 요인: SNS·현지 여론, 주한동포·한인 노동자 이슈, 지역 주민 시위·환경 이슈(예: 수자원 합의 등)가 평판·정책 여론에 미세 영향.',
    sources: [
      { name: 'The Washington Post', url: 'https://www.washingtonpost.com/world/2025/09/09/us-korea-relations-trade/' },
      { name: 'Financial Times', url: 'https://www.ft.com/content/us-korea-manufacturing-investment-risk' },
      { name: '연합뉴스', url: 'https://www.yna.co.kr/view/AKR20250912087600001' },
      { name: '조선비즈', url: 'https://biz.chosun.com/industry/car/2025/09/13/HF6VT4ZACPBNHD3MXNQH7QNG7I/' }
    ],
  },
]

export const hyundaiNarratives: Record<'external' | 'sector' | 'macro' | 'unstructured', NarrativeSection> = {
  external: {
    headline: '현재 이벤트(핵심)',
    paragraphs: [
      {
        text: '2025년 9월 초 미국 조지아주에서 발생한 대규모 이민 단속(약 475명 체포)과 연관 행정 수사가 생산라인 가동 중단과 외교 마찰을 일으키며 직간접적 리스크를 확대하고 있습니다.',
        sources: [
          { name: 'The Washington Post', url: 'https://www.washingtonpost.com/business/2025/09/10/hyundai-georgia-plant-raid-updates/' },
          { name: 'AP 통신', url: 'https://apnews.com/article/hyundai-georgia-plant-investigation-2025' }
        ]
      }
    ]
  },
  sector: {
    headline: '현재 이벤트(핵심)',
    paragraphs: [
      {
        text: '이번 사태는 단일 기업 이슈를 넘어 미국 내 배터리·EV 산업의 투자 리스크로 인식될 가능성이 높아졌으며, 다른 외국계 투자에도 파급이 예상됩니다.',
        sources: [
          { name: 'Battery Technology', url: 'https://www.batterytech.com/news/2025/09/us-ev-investment-risk-assessment' },
          { name: 'Reuters', url: 'https://www.reuters.com/business/autos-transportation/us-ev-policy-shifts-raise-questions-2025-09-07/' }
        ]
      }
    ]
  },
  macro: {
    headline: '현재 이벤트(핵심)',
    paragraphs: [
      {
        text: '미·한 외교 관계 경색과 달러 강세, 금리 불확실성이 미국 현지 투자 여건을 압박하며 비용 구조와 자본 조달 환경에 영향을 주고 있습니다.',
        sources: [
          { name: 'The Washington Post', url: 'https://www.washingtonpost.com/world/2025/09/09/us-korea-relations-trade/' },
          { name: 'Financial Times', url: 'https://www.ft.com/content/us-korea-manufacturing-investment-risk' }
        ]
      }
    ]
  },
  unstructured: {
    headline: '현재 이벤트(핵심)',
    paragraphs: [
      {
        text: 'SNS·언론을 통한 인권·비자·노동자 처우 관련 여론 확산, 현지 시위·항의 등으로 기업 평판 악화 가능성이 높습니다. 또한, 한인사회·한국 내 여론이 정치적 압력으로 번질 소지도 있습니다.',
        sources: [
          { name: '연합뉴스', url: 'https://www.yna.co.kr/view/AKR20250912087600001' },
          { name: 'The Washington Post', url: 'https://www.washingtonpost.com/us-policy/2025/09/12/hyundai-labor-advocacy/' }
        ]
      }
    ]
  }
}

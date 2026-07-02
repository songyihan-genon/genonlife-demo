"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Globe, Clock, Zap } from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
// tabs 제거: 단일 뷰로 통합

// 샘플 이벤트 데이터 (메인 페이지와 동일)
const sampleEvents = [
  {
    id: "samsung-q3-2025",
    title: "삼성전자 3분기 실적 발표",
    description: "삼성전자 2025년 3분기 실적 발표 - HBM 및 파운드리 부문 실적 개선으로 영업이익 5.2조 원 예상",
    category: "기업실적",
    severity: "high" as const,
    probability: 95,
    impact: { market: 18, economy: 12, social: 8 },
    duration: "1일",
    region: "한국",
    relatedSectors: ["반도체", "메모리", "전자"],
    tags: ["삼성전자", "3분기", "실적발표", "HBM", "파운드리"],
    createdAt: "2025-09-25"
  },
  {
    id: "1",
    title: "미국 연준 금리 인상",
    description: "미국 연방준비제도가 기준금리를 0.5%p 인상할 경우의 시나리오",
    category: "경제정책",
    severity: "high" as const,
    probability: 75,
    impact: { market: -15, economy: -8, social: -5 },
    duration: "6개월",
    region: "미국",
    relatedSectors: ["금융", "부동산", "소비재"],
    tags: ["금리", "통화정책", "인플레이션"],
    createdAt: "2024-01-15"
  },
  {
    id: "2",
    title: "테슬라: 옵션 거래 급증",
    description: "2025년 9월 12일 만기 $360 콜옵션에 120,000건이 넘는 거래가 한날 집중적으로 이루어지면서 테슬라 주가가 4.3% 급등하는 이벤트가 발생했습니다.",
    category: "기술혁신",
    severity: "medium" as const,
    probability: 85,
    impact: { market: 15, economy: 8, social: 5 },
    duration: "1일",
    region: "미국",
    relatedSectors: ["테크", "자동차", "옵션거래"],
    tags: ["테슬라", "옵션", "급등"],
    createdAt: "2024-09-12"
  },
  {
    id: "3",
    title: "엔비디아: 중국 수출 라이선스 및 콘퍼런스 발표",
    description: "미국 정부가 최근 엔비디아와 AMD에 중국향 AI 칩 수출 허가 라이선스를 발급하고, 그 대가로 중국 매출의 15%를 미국에 넘기는 조치를 단행했습니다.",
    category: "지정학",
    severity: "high" as const,
    probability: 70,
    impact: { market: 20, economy: 15, social: 8 },
    duration: "6개월",
    region: "글로벌",
    relatedSectors: ["반도체", "AI", "중국사업"],
    tags: ["엔비디아", "중국", "라이선스"],
    createdAt: "2024-09-10"
  },
  {
    id: "4",
    title: "애플: 아이폰 에어/17 출시 이벤트",
    description: "9월 9일, 애플은 대대적인 제품 발표 행사를 통해 초박형 '아이폰 에어'를 공개하며 수년 만에 가장 큰 디자인 혁신을 선보였습니다.",
    category: "기술혁신",
    severity: "medium" as const,
    probability: 90,
    impact: { market: 12, economy: 10, social: 15 },
    duration: "3개월",
    region: "글로벌",
    relatedSectors: ["테크", "스마트폰", "소비자전자"],
    tags: ["애플", "아이폰", "신제품"],
    createdAt: "2024-09-09"
  }
]

// 과거 유사 이벤트 데이터
const historicalCases = {
  "samsung-q3-2025": [
    {
      id: "case1",
      title: "2025년 2분기 삼성전자 실적 발표",
      description: "HBM 메모리 호황으로 예상을 뛰어넘는 실적 발표",
      beforePrice: 73000,
      afterPrice: 84500,
      changePercent: 15.8,
      period: "1주일",
      analysis: "HBM 메모리 수요 급증과 파운드리 부문 회복으로 주가 급등, AI 투자 확대 기대감 반영",
      newsSource: {
        headline: "삼성전자, HBM3E 양산 본격화…AI 반도체 수혜 확산",
        excerpt: "삼성전자가 2분기 실적에서 HBM 메모리 매출이 전분기 대비 200% 증가했다고 발표했다. 특히 차세대 HBM3E 제품의 주요 고객사 검증이 완료되면서 하반기 대량 공급이 본격화될 것으로 전망된다고 밝혔다.",
        source: "한국경제신문",
        date: "2025.07.31",
        link: "https://www.hankyung.com/article/2024073112345"
      },
      analystReport: {
        firm: "미래에셋증권",
        analyst: "김동원",
        title: "삼성전자 목표주가 상향 조정",
        excerpt: "HBM 사업부문의 수익성 개선이 예상보다 빠르게 진행되고 있다. 2024년 하반기 HBM 매출은 전년 동기 대비 500% 이상 성장할 것으로 예상하며, 이는 전체 메모리 부문 수익성에 긍정적 영향을 미칠 것이다.",
        rating: "매수",
        targetPrice: "₩95,000",
        pdfLink: "/reports/mirae_samsung_20240731.pdf"
      }
    },
    {
      id: "case2",
      title: "2025년 2분기 SK하이닉스 실적 발표",
      description: "메모리 반도체 업황 회복과 HBM 성과 공개",
      beforePrice: 320000,
      afterPrice: 356000,
      changePercent: 11.3,
      period: "2주일",
      analysis: "메모리 반도체 슈퍼 사이클 기대감과 AI 관련 투자 테마로 강세 지속",
      newsSource: {
        headline: "SK하이닉스 'HBM3' 본격 출하…엔비디아와 협력 확대",
        excerpt: "SK하이닉스가 4분기 실적 발표에서 HBM3 제품의 엔비디아 공급이 본격화되었다고 밝혔다. 회사는 2024년 AI 메모리 시장에서의 점유율 확대를 위해 HBM4 개발에도 착수했다고 발표했다.",
        source: "매일경제",
        date: "2025.07.25",
        link: "https://www.mk.co.kr/news/stock/10926543"
      },
      analystReport: {
        firm: "NH투자증권",
        analyst: "도현우",
        title: "SK하이닉스, AI 메모리 선도 기업으로 부상",
        excerpt: "SK하이닉스의 HBM 사업이 본격적인 수익 창출 단계에 진입했다. 엔비디아와의 파트너십 강화로 2024년 HBM 매출은 전년 대비 300% 이상 증가할 것으로 전망된다.",
        rating: "매수",
        targetPrice: "₩380,000",
        pdfLink: "/reports/nh_hynix_20240125.pdf"
      }
    }
  ],
  "1": [
    {
      id: "case1",
      title: "2022년 3월 연준 금리 인상 (0.25%p)",
      description: "코로나19 이후 첫 금리 인상으로 시장에 큰 충격",
      beforePrice: 4280,
      afterPrice: 4170,
      changePercent: -2.6,
      period: "1주일",
      analysis: "금융주는 상승했지만 테크주와 성장주가 크게 하락하며 전체적으로 부정적 반응"
    },
    {
      id: "case2",
      title: "2018년 12월 연준 금리 인상 (0.25%p)",
      description: "연속 4차례 금리 인상으로 경기 둔화 우려 증폭",
      beforePrice: 2700,
      afterPrice: 2416,
      changePercent: -10.5,
      period: "2주일",
      analysis: "시장이 과도한 긴축 우려로 급락, 이후 연준이 완화적 스탠스로 선회"
    }
  ],
  "2": [
    {
      id: "case1",
      title: "2021년 1월 GameStop 옵션 거래 급증",
      description: "레딧 투자자들의 대량 옵션 매수로 주가 급등",
      beforePrice: 17.25,
      afterPrice: 347.51,
      changePercent: 1914.7,
      period: "2주일",
      analysis: "옵션 시장의 감마 스퀴즈 현상으로 극적인 주가 상승, 이후 급락"
    },
    {
      id: "case2",
      title: "2020년 8월 테슬라 옵션 거래 급증",
      description: "S&P 500 편입 기대감과 옵션 거래 증가",
      beforePrice: 1374,
      afterPrice: 2213,
      changePercent: 61.0,
      period: "3주일",
      analysis: "기관투자자들의 헤지 거래와 개인투자자 FOMO가 결합된 상승세"
    }
  ],
  "3": [
    {
      id: "case1",
      title: "2019년 5월 화웨이 제재 발표",
      description: "미국이 화웨이에 대한 수출 제재를 발표",
      beforePrice: 158,
      afterPrice: 144,
      changePercent: -8.9,
      period: "1주일",
      analysis: "초기 부정적 반응 이후, 대체 시장 확보 기대감으로 회복"
    },
    {
      id: "case2",
      title: "2020년 9월 중국 반도체 제재 강화",
      description: "트럼프 행정부의 중국 반도체 기업 제재 확대",
      beforePrice: 108,
      afterPrice: 125,
      changePercent: 15.7,
      period: "2주일",
      analysis: "제재로 인한 경쟁사 감소 효과가 단기적으로 긍정적 영향"
    }
  ],
  "4": [
    {
      id: "case1",
      title: "2020년 10월 아이폰 12 출시",
      description: "5G 지원 아이폰 12 시리즈 공개",
      beforePrice: 108,
      afterPrice: 125,
      changePercent: 15.7,
      period: "2주일",
      analysis: "5G 기술과 새로운 디자인에 대한 기대감으로 주가 상승"
    },
    {
      id: "case2",
      title: "2017년 9월 아이폰 X 출시",
      description: "아이폰 10주년 기념 혁신적 디자인 공개",
      beforePrice: 160,
      afterPrice: 175,
      changePercent: 9.4,
      period: "1주일",
      analysis: "Face ID와 전면 스크린 디자인 혁신으로 프리미엄 가격 정당화"
    }
  ]
}

// AI 분석 코멘트
const aiAnalysis = {
  "samsung-q3-2025": "삼성전자의 3분기 실적은 시장 예상을 15% 상회하는 어닝 서프라이즈를 기록할 것으로 예상됩니다. 특히 HBM 메모리 출하량이 전분기 대비 120% 증가할 경우, 이는 시장 기대치를 20% 뛰어넘는 수준입니다. 과거 사례를 보면, 영업이익 서프라이즈와 HBM 성장이 동시에 나타날 때 주가는 20-25% 급등하는 패턴을 보였습니다. AI 반도체 슈퍼사이클의 핵심 수혜주로서 삼성전자의 HBM 독점적 지위는 장기적 성장 동력을 제공할 것입니다.",
  "1": "과거 사례를 분석하면, 금리 인상 발표 직후 단기적으로 주식시장이 하락하는 패턴을 보입니다. 특히 0.5%p라는 큰 폭의 인상은 2018년 사례와 유사하게 시장에 충격을 줄 가능성이 높습니다. 다만 현재 인플레이션 상황과 경제 펀더멘털을 고려할 때, 초기 충격 이후 점진적 회복이 예상됩니다.",
  "2": "테슬라의 옵션 거래 급증은 GameStop 사례처럼 감마 스퀴즈 현상을 유발할 수 있습니다. 120,000건의 콜옵션 거래는 시장 메이커들의 헤지 매수를 촉발시켜 추가 상승 동력을 제공할 것으로 예상됩니다. 다만 옵션 만료일이 가까워질수록 변동성이 증가할 수 있어 주의가 필요합니다.",
  "3": "중국 수출 라이선스 허가는 엔비디아에게 매우 긍정적인 신호입니다. 과거 제재 관련 사례들을 보면, 불확실성 해소가 주가에 즉각적인 긍정적 영향을 미쳤습니다. 중국 시장에서의 수익성 회복과 AI 칩 수요 증가를 고려할 때, 지속적인 상승세가 예상됩니다.",
  "4": "애플의 신제품 출시는 역사적으로 주가에 긍정적 영향을 미쳤습니다. 특히 아이폰 에어의 혁신적 디자인은 아이폰 X 출시 때와 유사한 패턴을 보일 것으로 예상됩니다. eSIM 기술과 자체 5G 모뎀 탑재는 장기적 경쟁력 강화 요소로 작용할 것입니다."
}

// 시나리오 목업 데이터 (보수/기준/낙관)
const scenarioMock: Record<string, Array<{
  case: '보수' | '기준' | '낙관'
  thesis: string
  expectedRange: string
  timeframe: string
  probability: number
  drivers: string[]
  hedges: string[]
}>> = {
  'samsung-q3-2025': [
    {
      case: '보수',
      thesis: 'HBM 출하 차질 또는 가격 둔화로 실적 모멘텀 저하',
      expectedRange: '-8% ~ -3%',
      timeframe: '2주',
      probability: 25,
      drivers: ['HBM ASP 하락', '파운드리 가동률 미회복'],
      hedges: ['KOSPI 푸트 스프레드', 'USDKRW 롱']
    },
    {
      case: '기준',
      thesis: 'HBM/파운드리 모두 컨센서스 소폭 상회, 가이던스 중립',
      expectedRange: '+1% ~ +6%',
      timeframe: '1개월',
      probability: 50,
      drivers: ['HBM3E 양산 확대', 'AI 서버 수요 견조'],
      hedges: ['반도체 인버스 소량', '변동성 매도 일부 청산']
    },
    {
      case: '낙관',
      thesis: 'HBM 증설+수율 개선으로 어닝 서프라이즈 및 가이던스 상향',
      expectedRange: '+8% ~ +15%',
      timeframe: '1~2개월',
      probability: 25,
      drivers: ['주요 고객사 추가 수주', 'HBM 공급 타이트'],
      hedges: ['리스크 한도 상향 금지', '익절 트레일링 스탑']
    }
  ],
  '1': [
    { case: '보수', thesis: '긴축 가속 신호로 리스크 오프', expectedRange: '-6% ~ -3%', timeframe: '2주', probability: 35, drivers: ['점도표 상향', '실업률 하락 지속'], hedges: ['장단기 금리 롱', 'S&P 푸트'] },
    { case: '기준', thesis: '매파적이나 예상 범위, 단기 변동 후 안정', expectedRange: '-1% ~ +2%', timeframe: '2주', probability: 45, drivers: ['핵심물가 둔화', '포워드가이던스 중립'], hedges: ['듀레이션 중립', '디펜시브 팩터'] },
    { case: '낙관', thesis: '완화적 뉘앙스로 랠리', expectedRange: '+3% ~ +6%', timeframe: '2주', probability: 20, drivers: ['성장 둔화 우려', '연내 동결 시사'], hedges: ['밸류 팩터 일부 이익실현'] }
  ]
}

// 레짐/포지셔닝 목업 데이터
const regimeMock: Record<string, {
  past: { liquidity: string; volatility: string; momentum: string }
  current: { liquidity: string; volatility: string; momentum: string }
  guidance: { tilts: string[]; hedges: string[]; notes: string }
}> = {
  'samsung-q3-2025': {
    past: { liquidity: '중립+', volatility: '낮음', momentum: '강함' },
    current: { liquidity: '중립', volatility: '보통', momentum: '강함' },
    guidance: {
      tilts: ['반도체/AI 비중 유지', '퀄리티 팩터 우선'],
      hedges: ['지수 푸트 1~2% OTM', 'USD 헷지 50%'],
      notes: '레짐 유사도가 높아 과거 평균 경로에 준하는 반응 예상'
    }
  },
  '1': {
    past: { liquidity: '낮음', volatility: '높음', momentum: '약함' },
    current: { liquidity: '중립-', volatility: '보통+', momentum: '혼조' },
    guidance: {
      tilts: ['디펜시브(필수소비/헬스케어)', '밸류/단기퀀트 강화'],
      hedges: ['듀레이션 롱 일부', '크레딧 스프레드 헷지'],
      notes: '유동성 여건이 과거 대비 완화되어 하방은 완만할 가능성'
    }
  }
}

// 시뮬레이션 변수 정의 (목업 단계: 제거 예정)
const simulationVariables = {
  "samsung-q3-2025": [
    { name: "영업이익 서프라이즈 비율", min: -10, max: 25, default: 15, unit: "%", impact: "short" },
    { name: "HBM 출하량 증가율(전분기대비)", min: 80, max: 200, default: 120, unit: "%", impact: "long" }
  ],
  "1": [
    { name: "인플레이션 압력", min: 0, max: 100, default: 70, unit: "%" },
    { name: "경기 둔화 우려", min: 0, max: 100, default: 60, unit: "%" }
  ],
  "2": [
    { name: "옵션 거래량", min: 50000, max: 200000, default: 120000, unit: "건" },
    { name: "시장 심리", min: 0, max: 100, default: 75, unit: "%" }
  ],
  "3": [
    { name: "중국 시장 접근성", min: 0, max: 100, default: 70, unit: "%" },
    { name: "AI 칩 수요", min: 0, max: 100, default: 85, unit: "%" }
  ],
  "4": [
    { name: "제품 혁신도", min: 0, max: 100, default: 80, unit: "%" },
    { name: "시장 수용성", min: 0, max: 100, default: 75, unit: "%" }
  ]
}

// 기본 주가 차트 데이터
const generateChartData = (eventId: string, variable1: number, variable2: number) => {
  // 삼성전자 실제 주가 데이터 (D-day를 9/25로 설정)
  const generateSamsungData = () => {
    const realPrices = [
      // { date: "9/29/25", price: 73400, dDay: "D-10" },
      // { date: "9/30/25", price: 75400, dDay: "D-9" },
      // { date: "10/1/25", price: 76500, dDay: "D-8" },
      // { date: "10/2/25", price: 79400, dDay: "D-7" },
      // { date: "10/3/25", price: 78200, dDay: "D-6" },
      { date: "10/3/25", price: 80500, dDay: "D-5" },
      { date: "10/4/25", price: 79700, dDay: "D-4" },
      { date: "10/5/25", price: 83500, dDay: "D-3" },
      { date: "10/6/25", price: 82700, dDay: "D-2" },
      { date: "10/7/25", price: 83400, dDay: "D-1" }
    ]

    return realPrices.map(item => ({
      date: item.dDay,
      fullDate: item.date,
      price: item.price,
      pastPrice: item.price, // 과거 데이터용
      futurePrice: null, // 과거 구간에서는 null
      type: "past"
    }))
  }

  const pastData = eventId === "samsung-q3-2025" ? generateSamsungData() : 
    // 기존 로직 유지 (다른 이벤트들용)
    (() => {
      const pastData = []
      let price = 100
      const dates = ["D-9", "D-8", "D-7", "D-6", "D-5", "D-4", "D-3", "D-2", "D-1"]

      for (let i = 0; i < dates.length; i++) {
        const dailyChange = (Math.random() - 0.5) * 4
        const trend = 0.2
        price = price * (1 + (dailyChange + trend) / 100)
        price = Math.max(price, 50)

        pastData.push({
          date: dates[i],
          price: Math.round(price * 100) / 100,
          pastPrice: Math.round(price * 100) / 100,
          futurePrice: null,
          type: "past"
        })
      }
      return pastData
    })()

  const lastPastPrice = pastData[pastData.length - 1].price

  // 현재 (이벤트 발생일 D-day) - 삼성전자의 경우 실제 가격 사용
  const currentPrice = eventId === "samsung-q3-2025" ? 86100 : lastPastPrice
  const currentData = [{ 
    date: "D-day", 
    fullDate: eventId === "samsung-q3-2025" ? "10/8/25" : "2025-10-8",
    price: currentPrice,
    pastPrice: currentPrice, // D-day는 양쪽 라인에 모두 포함
    futurePrice: currentPrice,
    type: "current" 
  }]

  // 변수값에 따른 가격 변화 계산
  let priceMultiplier = 1

  switch(eventId) {
    case "samsung-q3-2025": // 삼성전자 3분기 실적
      // variable1: 영업이익 서프라이즈 비율 (단기 영향)
      // variable2: HBM 출하량 증가율 (장기 영향)
      const earningsSurprise = variable1 / 100 // 단기적 영향
      const hbmGrowth = (variable2 - 100) / 100 // 장기적 영향
      // 단기: 영업이익 서프라이즈는 즉각적이지만 감소, 장기: HBM은 지속적 성장
      priceMultiplier = 1 + (earningsSurprise * 0.20) + (hbmGrowth * 0.12)
      break
    case "1": // 금리 인상
      priceMultiplier = 1 - (variable1 * 0.0008 + variable2 * 0.0012)
      break
    case "2": // 테슬라 옵션
      priceMultiplier = 1 + (variable1 * 0.000005 + variable2 * 0.0002)
      break
    case "3": // 엔비디아 라이선스
      priceMultiplier = 1 + (variable1 * 0.0025 + variable2 * 0.0015)
      break
    case "4": // 애플 신제품
      priceMultiplier = 1 + (variable1 * 0.002 + variable2 * 0.0022)
      break
  }

  // 미래 데이터 (이벤트 발생 후 10일)
  const futureData = []
  let futurePrice = currentPrice

  // 첫날 이벤트 즉시 반영 (D+1)
  futurePrice = futurePrice * priceMultiplier
  futureData.push({
    date: "D+1",
    fullDate: eventId === "samsung-q3-2025" ? "10/9/25" : "2024-09-11",
    price: Math.round(futurePrice),
    pastPrice: null,
    futurePrice: Math.round(futurePrice),
    type: "future"
  })

  // 이후 날짜들에는 점진적 변화와 변동성 추가 (D+2 ~ D+10)
  for (let i = 2; i <= 10; i++) {
    const daysSinceEvent = i - 1
    
    if (eventId === "samsung-q3-2025") {
      // 삼성전자: 단기/장기 영향 차별화
      const earningsSurprise = variable1 / 100
      const hbmGrowth = (variable2 - 100) / 100
      
      // 단기 영향 (영업이익 서프라이즈): 빠르게 감소
      const shortTermDecay = Math.pow(0.85, daysSinceEvent)
      const shortTermImpact = earningsSurprise * 0.20 * shortTermDecay * 0.3
      
      // 장기 영향 (HBM 출하량): 천천히 감소하며 지속
      const longTermDecay = Math.pow(0.98, daysSinceEvent)
      const longTermImpact = hbmGrowth * 0.12 * longTermDecay * 0.4
      
      const totalImpact = shortTermImpact + longTermImpact
      
      // 현실적인 일일 변동성 (-2% ~ +2%)
      const volatility = futurePrice * (Math.random() - 0.5) * 0.04
      
      futurePrice = futurePrice * (1 + totalImpact) + volatility
    } else {
      // 기존 로직 (다른 이벤트들)
      const trendDecay = Math.pow(0.95, daysSinceEvent)
      const remainingImpact = (priceMultiplier - 1) * trendDecay * 0.3
      const volatility = futurePrice * (Math.random() - 0.5) * 0.04
      
      futurePrice = futurePrice * (1 + remainingImpact) + volatility
    }

    // 가격이 너무 낮아지지 않도록 보정
    futurePrice = Math.max(futurePrice, currentPrice * 0.8)

    futureData.push({
      date: `D+${i}`,
      fullDate: eventId === "samsung-q3-2025" ? `10/${8+i}/25` : `2024-09-${10+i}`,
      price: Math.round(futurePrice),
      pastPrice: null,
      futurePrice: Math.round(futurePrice),
      type: "future"
    })
  }

  return [...pastData, ...currentData, ...futureData]
}

// 스트리밍 텍스트 애니메이션 훅
const useStreamingText = (text: string, speed: number = 30) => {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setDisplayedText("")
    setIsComplete(false)
    
    if (!text) return

    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        setIsComplete(true)
        clearInterval(timer)
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed])

  return { displayedText, isComplete }
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState(sampleEvents.find(e => e.id === eventId))
  // 인터랙티브 시뮬레이터 제거: 관련 상태 삭제
  const [currentDate, setCurrentDate] = useState(new Date())

  const analysis = aiAnalysis[eventId as keyof typeof aiAnalysis] || ""
  const { displayedText: streamedAnalysis, isComplete } = useStreamingText(analysis, 25)

  // D-Day 계산 (10월 8일 2025년)
  const dDayDate = new Date(2025, 9, 8) // 월은 0부터 시작 (9 = 10월)
  const today = new Date()
  const timeDiff = dDayDate.getTime() - today.getTime()
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
  
  // 현재 날짜 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 인터랙티브 시뮬레이터 제거: 변수 초기화 로직 삭제

  // 인터랙티브 시뮬레이터 제거: 차트 데이터 생성/애니메이션 로직 삭제

  if (!event) {
    return <div>이벤트를 찾을 수 없습니다.</div>
  }

  const cases = historicalCases[eventId as keyof typeof historicalCases] || []
  const scenarios = scenarioMock[eventId] || scenarioMock['1']
  const regime = regimeMock[eventId] || regimeMock['1']
  // 이벤트 브리핑용 예상 일자 표시: 삼성은 D-Day 고정, 그외는 createdAt 사용
  const expectedDateStr = (() => {
    try {
      if (event.id === 'samsung-q3-2025') {
        const d = new Date(2025, 9, 8)
        return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
      }
      if ((event as any).createdAt) {
        const d = new Date((event as any).createdAt as string)
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
        }
      }
    } catch {}
    return '미정'
  })()

  // 시나리오 기대 범위 색상: +만 있으면 초록, -만 있으면 빨강, 혼재면 기본색
  const rangeColorClass = (range: string) => {
    const hasPlus = /\+/.test(range)
    const hasMinus = /-/.test(range)
    if (hasPlus && !hasMinus) return 'text-green-600'
    if (hasMinus && !hasPlus) return 'text-red-600'
    return 'text-foreground'
  }
  
  // 인터랙티브 시뮬레이터 제거: 파생 데이터 삭제

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{event.title}</h1>
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-lg font-bold text-blue-600">
              D-Day: 10월 8일 ({daysDiff > 0 ? `D-${daysDiff}` : daysDiff === 0 ? 'D-Day' : `D+${Math.abs(daysDiff)}`})
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            현재: {currentDate.toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'short'
            })} {currentDate.toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽 컬럼: 이벤트 브리핑 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 이벤트 브리핑 */}
          <Card className="bg-card">
            <CardHeader className="bg-card">
              <CardTitle>이벤트 브리핑</CardTitle>
            </CardHeader>
            <CardContent className="bg-card space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <Globe className="h-3 w-3 mr-1" />
                  {event.region}
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {expectedDateStr}
                </Badge>
                {event.relatedSectors.slice(0, 3).map((sector, index) => (
                  <Badge key={index} className="text-xs" style={{backgroundColor: '#F0F4FA', color: '#153AD4'}}>
                    {sector}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </CardContent>
          </Card>

          {/* 이벤트 시나리오 */}
          <Card className="bg-card">
            <CardHeader className="bg-card">
              <CardTitle>이벤트 시나리오</CardTitle>
              <CardDescription>보수 / 기준 / 낙관 — 3가지 케이스</CardDescription>
            </CardHeader>
            <CardContent className="bg-card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scenarios.map((s) => (
                  <div key={s.case} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{s.case}</div>
                      <Badge variant="outline" className="text-xs">확률 {s.probability}%</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{s.thesis}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">기대 범위</span>
                      <span className={`${rangeColorClass(s.expectedRange)} font-semibold`}>{s.expectedRange}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">기간</span>
                      <span>{s.timeframe}</span>
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1">주요 드라이버</div>
                      <div className="flex flex-wrap gap-1">
                        {s.drivers.map((d) => (
                          <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1">헤지/리스크 관리</div>
                      <div className="flex flex-wrap gap-1">
                        {s.hedges.map((h) => (
                          <Badge key={h} variant="outline" className="text-xs">{h}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 포지셔닝 가이드 */}
          <Card className="bg-card">
            <CardHeader className="bg-card">
              <CardTitle>포지셔닝 가이드</CardTitle>
              <CardDescription>과거 레짐 vs 현재 레짐 비교</CardDescription>
            </CardHeader>
            <CardContent className="bg-card space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <div className="text-xs font-semibold mb-2">과거 레짐</div>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between"><span>유동성</span><span className="font-medium">{regime.past.liquidity}</span></div>
                    <div className="flex justify-between"><span>변동성</span><span className="font-medium">{regime.past.volatility}</span></div>
                    <div className="flex justify-between"><span>모멘텀</span><span className="font-medium">{regime.past.momentum}</span></div>
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-xs font-semibold mb-2">현재 레짐</div>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between"><span>유동성</span><span className="font-medium">{regime.current.liquidity}</span></div>
                    <div className="flex justify-between"><span>변동성</span><span className="font-medium">{regime.current.volatility}</span></div>
                    <div className="flex justify-between"><span>모멘텀</span><span className="font-medium">{regime.current.momentum}</span></div>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <div className="text-xs font-semibold mb-2">가이드</div>
                <div className="text-xs text-muted-foreground mb-2">{regime.guidance.notes}</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {regime.guidance.tilts.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {regime.guidance.hedges.map((h) => (
                    <Badge key={h} variant="outline" className="text-xs">{h}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽 컬럼: 유사 과거 이벤트 */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card h-fit">
            <CardHeader className="bg-card">
              <CardTitle>유사 과거 이벤트</CardTitle>
            </CardHeader>
            <CardContent className="bg-card">
              {/* 상단 AI 코멘트 */}
              <div className="bg-card border border-border p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm text-primary">AI 분석</span>
                  {!isComplete && (
                    <div className="ml-auto">
                      <div className="animate-pulse w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  {streamedAnalysis}
                  {!isComplete && (
                    <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse"></span>
                  )}
                </p>
              </div>

              {/* 유사 이벤트 케이스들 */}
              <div className="space-y-4 max-h-[900px] overflow-y-auto pr-2">
                {cases.map((case_) => {
                  const totalDays = 20
                  const start = case_.beforePrice
                  const target = case_.afterPrice
                  const series = Array.from({ length: totalDays + 1 }, (_, i) => {
                    const t = i / totalDays
                    const eased = 1 - Math.pow(1 - t, 2)
                    const value = start + (target - start) * eased
                    return { day: i === 0 ? 'D-0' : `D+${i}`, value }
                  })
                  return (
                    <div key={case_.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-sm">{case_.title}</h4>
                        <Badge variant={case_.changePercent >= 0 ? 'default' : 'destructive'}>
                          {case_.changePercent >= 0 ? '+' : ''}{case_.changePercent}%
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>이전: ₩{case_.beforePrice.toLocaleString()}</span>
                        <span>이후: ₩{case_.afterPrice.toLocaleString()}</span>
                        <span>기간: {case_.period}</span>
                      </div>
                      {case_.description && (
                        <p className="text-xs text-muted-foreground">{case_.description}</p>
                      )}
                      <p className="text-xs bg-muted p-2 rounded">{case_.analysis}</p>

                      {case_.newsSource && (
                        <div className="border rounded-md p-3">
                          <div className="text-xs font-medium mb-1">뉴스</div>
                          <div className="text-sm font-medium">{case_.newsSource.headline}</div>
                          <p className="text-xs text-muted-foreground mt-1">{case_.newsSource.excerpt}</p>
                          <div className="flex justify-between items-center text-xs mt-2">
                            <span className="text-muted-foreground">{case_.newsSource.source} | {case_.newsSource.date}</span>
                            <a href={case_.newsSource.link} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">원문 보기 →</a>
                          </div>
                        </div>
                      )}

                      {case_.analystReport && (
                        <div className="border rounded-md p-3">
                          <div className="text-xs font-medium mb-1">애널리스트 리포트</div>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium">{case_.analystReport.title}</div>
                              <p className="text-xs text-muted-foreground mt-1">{case_.analystReport.excerpt}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{case_.analystReport.rating}</Badge>
                              <span className="text-xs font-medium text-green-600">{case_.analystReport.targetPrice}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs mt-2">
                            <span className="text-muted-foreground">{case_.analystReport.firm} | {case_.analystReport.analyst}</span>
                            <a href={case_.analystReport.pdfLink} className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">리포트 PDF →</a>
                          </div>
                        </div>
                      )}

                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`g-${case_.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" hide/>
                            <YAxis hide domain={[Math.min(start, target) * 0.95, Math.max(start, target) * 1.05]} />
                            <Tooltip
                              formatter={(v: number) => `₩${Math.round(v).toLocaleString()}`}
                              contentStyle={{
                                backgroundColor: "var(--card)",
                                border: "1px solid var(--border)",
                                borderRadius: "0.5rem",
                                color: "var(--foreground)",
                              }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#2563eb" fillOpacity={1} fill={`url(#g-${case_.id})`} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>이전: ₩{start.toLocaleString()}</span>
                        <span>이후: ₩{target.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}

export type CurrencyCode = 'KRW' | 'USD'

export type WatchlistStock = {
  id: string
  ticker: string
  name: string
  market?: string | null
  sector?: string | null
  marketCap?: string | null
  price?: string | number | null
  changePercent?: string | number | null
  currency?: CurrencyCode | null
}

export type SourceInfo = { name: string; url?: string }
export type TextWithSources = { text: string; sources?: SourceInfo[] }

export type EventNewsItem = {
  title: string
  url: string
  snippet: string
  source: string
  date?: string
}

export type EventNewsData = {
  events: EventNewsItem[]
  cached: boolean
  loading: boolean
  error: string | null
  summary: string | null
}

export type StockQuote = {
  price: number
  changePercent: number
}

export type StockDataPoint = {
  date: string
  price: number
  volume?: number
  usdkrw?: number
  open?: number
  high?: number
  low?: number
  close?: number
  eventId?: string
}

export type NarrativeSection = {
  headline: string
  paragraphs: {
    text: string
    sources: SourceInfo[]
  }[]
}

export type SimpleEvent = { type: "뉴스" | "공시" | "실적"; title: string; date: string; summary: string }

export type StockDetails = {
  ticker: string
  name: string
  description: string | null
  market_cap: number | null
  per: number | null
  eps: number | null
  roe: number | null
  currency: string | null
  cached: boolean
}

export type StockNewsItem = {
  title: string
  url: string
  source: string
  date?: string
}

export type StockNews = {
  ticker: string
  summary: string | null
  news: StockNewsItem[]
  cached: boolean
}


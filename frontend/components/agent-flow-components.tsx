import React from 'react'
import { cn } from '@/lib/utils'

interface AgentFlowComponentProps {
  nodeLabel: string
  data: any
  className?: string
  activeSteps?: Set<string>
}

export function AgentFlowComponent({ nodeLabel, data, className, activeSteps }: AgentFlowComponentProps) {
  const content = data?.output?.content

  let parsedContent: any = {}
  try {
    if (typeof content === 'string') {
      parsedContent = JSON.parse(content)
    } else {
      parsedContent = content || {}
    }
  } catch (error) {
    console.error('Failed to parse agent flow content:', error)
    parsedContent = { error: 'Failed to parse content' }
  }

  switch (nodeLabel) {
    case 'Visible Reasoner':
      return <ReasoningComponent content={parsedContent} className={className} activeSteps={activeSteps} />
    case 'Visible Query Generator':
      return <QueryGeneratorComponent content={parsedContent} className={className} activeSteps={activeSteps} />
    case 'Visible URL':
      return <URLReaderComponent content={parsedContent} className={className} activeSteps={activeSteps} />
    case 'company_info':
    case 'market_indicies':
    case 'single_stock_price':
      return <DeepSearchComponent nodeLabel={nodeLabel} content={parsedContent} className={className} activeSteps={activeSteps} />
    case 'Chart Generator':
      return <ChartGeneratorComponent content={parsedContent} className={className} activeSteps={activeSteps} />
    default:
      return <DefaultAgentComponent nodeLabel={nodeLabel} content={parsedContent} className={className} activeSteps={activeSteps} />
  }
}

function ReasoningComponent({ content, className, activeSteps }: { content: any, className?: string, activeSteps?: Set<string> }) {
  // reasoning 토큰 파싱 및 정리
  const parseReasoning = (rawRationale: string): string => {
    if (!rawRationale || typeof rawRationale !== 'string') return '추론 중...'

    // XML 태그들을 제거하고 내용만 추출
    let cleaned = rawRationale
      .replace(/<think>/g, '')
      .replace(/<\/think>/g, '')
      .replace(/<tool_call>/g, '')
      .replace(/<\/tool_call>/g, '')
      .replace(/<arg_key>.*?<\/arg_key>/g, '')
      .replace(/<arg_value>(.*?)<\/arg_value>/g, '$1')
      .replace(/\[{"q":\s*"([^"]+)".*?}\]/g, '검색: "$1"')
      .trim()

    // 연속된 개행 제거
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

    return cleaned || '추론 중...'
  }

  const rationale = parseReasoning(content.visible_rationale)
  const isActive = activeSteps?.has('reasoning') || false

  return (
    <div className={cn("w-full mb-2 pl-4 border-l-2 border-gray-300", className)}>
      <div className="text-[#005BAC] font-medium text-sm mb-1">
        추론
      </div>
      <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
        {rationale}
      </div>
    </div>
  )
}

function QueryGeneratorComponent({ content, className, activeSteps }: { content: any, className?: string, activeSteps?: Set<string> }) {
  const queries = content.visible_web_search_query || []
  const isActive = activeSteps?.has('web-searching') || false

  return (
    <div className={cn("w-full mb-2 pl-4 border-l-2 border-gray-300", className)}>
      <div className="text-[#005BAC] font-medium text-sm mb-1">
        Web Searching
      </div>
      <div className="space-x-2">
        {Array.isArray(queries) && queries.length > 0 ? (
          queries.map((query, index) => (
            <span
              key={index}
              className="inline-block bg-gray-100 px-2 py-1 rounded text-xs text-gray-700"
            >
              {query}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-500">검색 쿼리 생성 중...</span>
        )}
      </div>
    </div>
  )
}

function URLReaderComponent({ content, className, activeSteps }: { content: any, className?: string, activeSteps?: Set<string> }) {
  const url = content.visible_url || ''
  const previousUrls = content.previous_urls || []
  const isActive = activeSteps?.has('reading') || false

  const getDomain = (url: string) => {
    try {
      const parsed = new URL(url)
      let domain = parsed.hostname
      if (domain.startsWith('www.')) {
        domain = domain.slice(4)
      }
      return domain
    } catch {
      return url
    }
  }

  // 모든 URL 목록 (이전 URL들 + 현재 URL)
  const allUrls = [...previousUrls, url].filter(Boolean)

  return (
    <div className={cn("w-full mb-2 pl-4 border-l-2 border-gray-300", className)}>
      <div className="text-[#005BAC] font-medium text-sm mb-1">
        Reading
      </div>
      <div className="space-x-2">
        {allUrls.length > 0 ? (
          allUrls.map((urlItem, index) => (
            <a
              key={index}
              href={urlItem}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#3A4D9B] underline hover:text-[#153AD4]"
            >
              {getDomain(urlItem)}
            </a>
          ))
        ) : (
          <span className="text-xs text-gray-500">웹 페이지 읽는 중...</span>
        )}
      </div>
    </div>
  )
}

function ChartGeneratorComponent({ content, className, activeSteps }: { content: any, className?: string, activeSteps?: Set<string> }) {
  const chartGenerationInfo = content.visible_chart_generation || {}
  const isActive = activeSteps?.has('chart generator') || false

  // data_json이 문자열로 전달되는 경우 파싱
  let chartData: any = {}
  try {
    if (typeof chartGenerationInfo.data_json === 'string') {
      chartData = JSON.parse(chartGenerationInfo.data_json)
    } else {
      chartData = chartGenerationInfo.data_json || {}
    }
  } catch (error) {
    console.error('Failed to parse chart data:', error)
    chartData = { error: 'Failed to parse chart data' }
  }

  return (
    <div className={cn("w-full mb-2 pl-4 border-l-2 border-gray-300", className)}>
      <div className="text-[#005BAC] font-medium text-sm">
        Chart Generator
      </div>
    </div>
  )
}

function DeepSearchComponent({ nodeLabel, content, className, activeSteps }: { nodeLabel: string, content: any, className?: string, activeSteps?: Set<string> }) {
  const getDisplayName = (nodeLabel: string) => {
    switch (nodeLabel) {
      case 'company_info': return '기업 정보 조회'
      case 'market_indicies': return '시장 지수 조회'
      case 'single_stock_price': return '주가 정보 조회'
      default: return nodeLabel
    }
  }

  return (
    <div className={cn("w-full mb-2 pl-4 border-l-2 border-gray-300", className)}>
      <div className="text-[#005BAC] font-medium text-sm">
        {getDisplayName(nodeLabel)}
      </div>
    </div>
  )
}

function DefaultAgentComponent({ nodeLabel, content, className, activeSteps }: { nodeLabel: string, content: any, className?: string, activeSteps?: Set<string> }) {
  const isActive = activeSteps?.has(nodeLabel.toLowerCase()) || false

  return (
    <div className={cn("w-full mb-2 pl-4 border-l-2 border-gray-300", className)}>
      <div className="text-[#005BAC] font-medium text-sm">
        {nodeLabel}
      </div>
    </div>
  )
}

// 소스 문서 컴포넌트
interface SourceDocumentsProps {
  documents: any[]
  className?: string
}

export function SourceDocumentsComponent({ className }: SourceDocumentsProps) {
  return (
    <div className={cn("w-full mb-2 pl-4 border-l-2 border-gray-300", className)}>
      <div className="text-[#005BAC] font-medium text-sm">
        참고 문서
      </div>
    </div>
  )
}

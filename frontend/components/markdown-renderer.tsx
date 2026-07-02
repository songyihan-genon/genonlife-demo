import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'
import { processContentWithPDFCitations } from '@/lib/pdf-citation-utils'
import HyundaiCharts from './hyundai-charts'

import { processContentWithCitations } from '@/lib/citation-utils'

interface MarkdownRendererProps {
  content: string
  className?: string
  sourceDocuments?: any[]
  toolState?: any
  paginate?: boolean
  streamAnimation?: boolean
  onPDFClick?: (filename: string, filePath: string) => void
}

const PX_PER_MM = 96 / 25.4
const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297
const PAGE_PADDING_MM = 20

const PAGE_INNER_HEIGHT_PX = (PAGE_HEIGHT_MM - PAGE_PADDING_MM * 2) * PX_PER_MM
const PAGE_INNER_WIDTH_PX = (PAGE_WIDTH_MM - PAGE_PADDING_MM * 2) * PX_PER_MM

export function MarkdownRenderer({
  content,
  className,
  sourceDocuments = [],
  toolState,
  paginate = false,
  streamAnimation = false,
  onPDFClick
}: MarkdownRendererProps) {
  // Process content to replace PDF citations with icons and URL citations with chips
  const processedContent = useMemo(() => {
    const withPDF = processContentWithPDFCitations(content, onPDFClick)
    return processContentWithCitations(withPDF, toolState)
  }, [content, onPDFClick, toolState])
  const containerRef = useRef<HTMLDivElement | null>(null)

  const components = useMemo(() => ({
    table: ({ children }: { children: React.ReactNode }) => (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-300 dark:border-gray-700">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children: React.ReactNode }) => (
      <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
    ),
    th: ({ children }: { children: React.ReactNode }) => (
      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-300 dark:border-gray-700">
        {children}
      </th>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
        {children}
      </td>
    ),
    a: ({ href, children, className: anchorClassName }: { href?: string; children: React.ReactNode; className?: string }) => {
      if (anchorClassName?.includes('citation-link') || anchorClassName?.includes('citation-chip')) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-2.5 py-1 mx-1 text-xs font-medium !text-gray-700 !bg-gray-100 border border-gray-200 rounded-full hover:!bg-gray-200 transition-colors no-underline dark:!text-gray-200 dark:!bg-gray-700 dark:border-gray-600 dark:hover:!bg-gray-600"
          >
            {children}
          </a>
        )
      }

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#005BAC] hover:text-[#004F9E] dark:text-[#00A3E0] dark:hover:text-[#FFD199] underline"
        >
          {children}
        </a>
      )
    },
    div: ({ node, children, ...props }: { node?: any; children: React.ReactNode }) => {
      const className = node?.properties?.className || []

      if (className.includes('page-break')) {
        return (
          <div className="page-break" {...props}>
            {children}
          </div>
        )
      }

      // 차트 렌더링을 위한 커스텀 div
      if (className.includes('hyundai-charts')) {
        return <HyundaiCharts />
      }

      return (
        <div {...props}>
          {children}
        </div>
      )
    },
    code: ({ inline, className: codeClassName, children }: { inline?: boolean; className?: string; children: React.ReactNode }) => {
      if (inline) {
        return (
          <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm rounded">
            {children}
          </code>
        )
      }

      return (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code className={codeClassName}>{children}</code>
        </pre>
      )
    },
    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc list-outside ml-6 space-y-1 text-gray-700 dark:text-gray-100">
        {children}
      </ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="list-decimal list-outside ml-6 space-y-1 text-gray-700 dark:text-gray-100">
        {children}
      </ol>
    ),
    li: ({ children }: { children: React.ReactNode }) => (
      <li className="text-gray-700 dark:text-gray-100">
        {children}
      </li>
    ),
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 mt-6">
        {children}
      </h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-5">
        {children}
      </h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2 mt-4">
        {children}
      </h3>
    ),
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-4 border-[#005BAC] pl-4 italic text-gray-600 dark:text-gray-400 my-4">
        {children}
      </blockquote>
    ),
    p: ({ children }: { children: React.ReactNode }) => (
      <p className="text-gray-700 dark:text-gray-100 leading-relaxed mb-3">
        {children}
      </p>
    ),
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100">
        {children}
      </strong>
    ),
    em: ({ children }: { children: React.ReactNode }) => (
      <em className="italic text-gray-700 dark:text-gray-300">
        {children}
      </em>
    ),
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <img
        src={src}
        alt={alt}
        className="max-w-full h-auto rounded-lg shadow-sm my-4"
      />
    ),
    hr: () => (
      <hr className="border-t border-gray-300 my-6" />
    )
  }), [])

  const measurementRef = useRef<HTMLDivElement | null>(null)
  const renderedContentRef = useRef<HTMLDivElement | null>(null)
  const [pages, setPages] = useState<string[]>([])
  const [reflowTrigger, setReflowTrigger] = useState(0)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [displayedContent, setDisplayedContent] = useState('')
  const [isStreamingComplete, setIsStreamingComplete] = useState(false)

  // 먼저 페이지 분할을 수행
  useEffect(() => {
    if (!paginate) return

    // 전체 컨텐츠를 먼저 페이지별로 분할
    const contentParts = processedContent.split('<div class="page-break" />')
    const computedPages: string[] = []

    contentParts.forEach((part, index) => {
      if (part.trim().length > 0) {
        computedPages.push(part.trim())
      }
    })

    // 만약 page-break가 없다면 전체 컨텐츠를 첫 번째 페이지로
    if (computedPages.length === 0 && processedContent.trim().length > 0) {
      computedPages.push(processedContent)
    }

    setPages(computedPages)
    setCurrentPageIndex(0) // 첫 페이지부터 시작
  }, [processedContent, paginate, reflowTrigger])

  // 스트리밍 애니메이션 효과 (첫 번째 페이지에만 적용)
  useEffect(() => {
    if (!streamAnimation || pages.length === 0) {
      setDisplayedContent('')
      setIsStreamingComplete(true)
      return
    }

    const firstPageContent = pages[0] || ''
    setDisplayedContent('')
    setIsStreamingComplete(false)

    let currentIndex = 0
    const streamingInterval = setInterval(() => {
      if (currentIndex >= firstPageContent.length) {
        setIsStreamingComplete(true)
        clearInterval(streamingInterval)
        return
      }

      // 문자 단위로 스트리밍 (더 부드러운 효과)
      const charsToAdd = Math.min(2, firstPageContent.length - currentIndex) // 한번에 1-2글자씩
      currentIndex += charsToAdd

      setDisplayedContent(firstPageContent.substring(0, currentIndex))
    }, 30) // 30ms마다 문자 추가

    return () => {
      clearInterval(streamingInterval)
    }
  }, [pages, streamAnimation])

  useEffect(() => {
    if (!paginate) return
    const measurementElement = measurementRef.current
    if (!measurementElement) return

    const handleResize = () => {
      setReflowTrigger((prev) => prev + 1)
    }

    window.addEventListener('resize', handleResize)

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      setReflowTrigger((prev) => prev + 1)
    })

    resizeObserver.observe(measurementElement)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [paginate])

  useEffect(() => {
    if (!onPDFClick) return

    const container = containerRef.current
    if (!container) return

    const handleClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('.pdf-citation-interactive')
      if (!target || !container.contains(target)) return

      event.preventDefault()

      const filename = target.getAttribute('data-pdf-filename')
      const filePath = target.getAttribute('data-pdf-path')

      if (filename && filePath) {
        onPDFClick(filename, filePath)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return

      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('.pdf-citation-interactive')
      if (!target || !container.contains(target)) return

      event.preventDefault()

      const filename = target.getAttribute('data-pdf-filename')
      const filePath = target.getAttribute('data-pdf-path')

      if (filename && filePath) {
        onPDFClick(filename, filePath)
      }
    }

    container.addEventListener('click', handleClick)
    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('click', handleClick)
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [processedContent, onPDFClick])

  useEffect(() => {
    if (!toolState?.id_to_iframe) return
    const container = containerRef.current
    if (!container) return

    const pending = container.querySelectorAll<HTMLDivElement>('.chart-embed-wrapper[data-chart-ready=\"false\"][data-chart-id]')
    pending.forEach(wrapper => {
      const chartId = wrapper.getAttribute('data-chart-id')
      if (!chartId) return
      const iframeHtml = toolState.id_to_iframe?.[chartId]
      if (!iframeHtml) return
      
      // Create iframe element with srcdoc
      const iframe = document.createElement('iframe')
      iframe.srcdoc = iframeHtml
      iframe.style.width = '100%'
      iframe.style.minHeight = '400px' // 초기 최소 높이
      iframe.style.border = '1px solid #e5e7eb'
      iframe.style.borderRadius = '0.5rem'
      iframe.style.backgroundColor = 'white'
      iframe.style.transition = 'height 0.3s ease'
      iframe.setAttribute('data-chart-iframe', chartId)
      
      // Clear wrapper and append iframe
      wrapper.innerHTML = ''
      wrapper.appendChild(iframe)
      wrapper.setAttribute('data-chart-ready', 'true')
    })
  }, [toolState, processedContent])

  // postMessage를 수신하여 iframe 높이를 동적으로 조정
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 보안: 필요에 따라 origin 검증 추가 가능
      if (event.data?.type === 'chart-resize' && event.data?.height) {
        const container = containerRef.current
        if (!container) return

        // 메시지를 보낸 iframe 찾기
        const iframes = container.querySelectorAll<HTMLIFrameElement>('iframe[data-chart-iframe]')
        iframes.forEach(iframe => {
          if (iframe.contentWindow === event.source) {
            // 패딩을 고려하여 높이 설정
            const newHeight = Math.max(event.data.height + 20, 300) // 최소 300px
            iframe.style.height = `${newHeight}px`
          }
        })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [processedContent])

  if (paginate) {
    return (
      <div ref={containerRef} className={cn('flex flex-col items-center gap-6 w-full py-8', className)}>
        <div className="flex flex-col items-center gap-6">
          {pages.length === 0 && streamAnimation && (
            <div
              className="relative bg-white shadow-lg border border-slate-200 box-border"
              style={{
                width: `${PAGE_WIDTH_MM}mm`,
                height: `${PAGE_HEIGHT_MM}mm`,
                padding: `${PAGE_PADDING_MM}mm`
              }}
            >
              <div
                className="prose prose-sm max-w-none h-full flex flex-col"
                style={{
                  minHeight: `${PAGE_INNER_HEIGHT_PX}px`
                }}
              >
                <div className="text-slate-400 italic flex items-center">
                  문서를 생성하고 있습니다...
                  <span className="ml-1 animate-pulse">|</span>
                </div>
              </div>
              <div className="absolute bottom-6 right-8 text-xs text-slate-400">
                Page 1
              </div>
            </div>
          )}
          {pages.map((pageContent, index) => {
            // 첫 페이지이면서 스트리밍 중인 경우 displayedContent 사용
            const contentToRender = (index === 0 && streamAnimation && !isStreamingComplete)
              ? displayedContent
              : pageContent;

            return (
              <div
                key={index}
                className="relative bg-white shadow-lg border border-slate-200 box-border"
                style={{
                  width: `${PAGE_WIDTH_MM}mm`,
                  height: `${PAGE_HEIGHT_MM}mm`,
                  padding: `${PAGE_PADDING_MM}mm`
                }}
              >
                <div
                  className="prose prose-sm prose-ul:list-outside prose-ol:list-outside prose-li:marker:text-gray-500 max-w-none h-full relative overflow-hidden"
                  style={{
                    minHeight: `${PAGE_INNER_HEIGHT_PX}px`
                  }}
                >
                  <div className="relative">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={components as any}
                    >
                      {contentToRender}
                    </ReactMarkdown>
                    {streamAnimation && index === 0 && !isStreamingComplete && (
                      <span className="text-gray-700 animate-pulse">|</span>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-6 right-8 text-xs text-slate-400">
                  Page {index + 1}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('prose prose-sm max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components as any}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

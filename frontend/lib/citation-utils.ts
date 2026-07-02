
import { PDFViewerState } from "./pdf-citation-utils"

// 출처 표기를 HTML 링크로 변환하는 함수
export const replaceCitationSegment = (
  segment: string,
  toolState: any
): string => {
  try {
    // 정확한 패턴 확인
    if (!segment.startsWith("【") || !segment.endsWith("】")) {
      return segment
    }

    const bodyRaw = segment.slice(1, -1)
    const body = bodyRaw.trim()

    // 1. Check if this is a chart iframe reference (e.g., "0:chart", "1:chart")
    const idToIframe = toolState?.id_to_iframe || {}
    if (idToIframe[body]) {
      // Return a wrapper div that will be filled by the useEffect in markdown-renderer
      return `<div class="chart-embed-wrapper my-6" data-chart-id="${body}" data-chart-ready="false"></div>`
    }

    // 2. URL Citation 패턴 확인
    const ids = body.match(/\d+:\d+/g)
    if (!ids) {
      return " " // 빈 공백 반환하여 줄바꿈 자연스럽게 유지
    }

    const idToUrl = toolState?.id_to_url || {}
    const mappedUrls = ids
      .filter(id => idToUrl[id]) // 존재하는 URL만 필터링
      .map(id => idToUrl[id])

    if (mappedUrls.length === 0) {
      return " " // URL이 없으면 빈 공백 반환하여 줄바꿈 자연스럽게 유지
    }

    const getDomain = (url: string) => {
      try {
        const parsed = new URL(url)
        let domain = parsed.hostname
        if (domain.startsWith('www.')) {
          domain = domain.slice(4)
        }
        return domain
      } catch {
        return "link"
      }
    }

    // HTML a 태그로 변환
    const styledLinks = mappedUrls.map(url =>
      `<a href="${url}" target="_blank" class="citation-chip"><strong>${getDomain(url)}</strong></a>`
    )

    return " " + styledLinks.join(" ") + " " // 앞뒤에 공백 추가하여 줄바꿈과의 연결 자연스럽게 유지
  } catch (error) {
    console.error('Citation replacement error:', error)
    return segment // 파싱 실패 시 원본 세그먼트 반환
  }
}

// 전체 텍스트에서 인용구를 찾아 변환하는 함수
export const processContentWithCitations = (content: string, toolState: any): string => {
  if (!content) return content

  return content.replace(/【[^】]+】/g, (match) => {
    return replaceCitationSegment(match, toolState)
  })
}

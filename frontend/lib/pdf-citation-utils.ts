import React from 'react'

export interface PDFCitation {
  fullMatch: string
  filename: string
  originalText: string
  isAvailable?: boolean
  filePath?: string
}

export interface PDFViewerState {
  isVisible: boolean
  currentPDF: string | null
  filename: string | null
}

// PDF 파일들이 있는 디렉토리 경로
const VECTOR_DB_FILES_PATH = '/vector-db-files'

// 사용 가능한 PDF 파일들 목록 (실제 환경에서는 API 호출로 가져와야 함)
const AVAILABLE_PDF_FILES = [
  '2025021310192999E_01.pdf',
  '2025030616360442K_01.pdf',
  '2025040217141493K_01.pdf', 
  '2025041016295888E_01.pdf',
  '2025042409294659K_01.pdf'
]

/**
 * PDF 파일이 vector-db-files 폴더에 존재하는지 확인
 */
export function isPDFAvailable(filename: string): boolean {
  return AVAILABLE_PDF_FILES.includes(filename)
}

/**
 * PDF 파일의 전체 경로 생성
 */
export function getPDFPath(filename: string): string {
  return `${VECTOR_DB_FILES_PATH}/${filename}`
}

/**
 * PDF 인용 패턴을 감지하고 파싱하는 함수
 * 패턴: (Source: filename.pdf) 또는 백슬래시가 있는 경우도 처리
 */
export function parsePDFCitations(text: string): PDFCitation[] {
  const citations: PDFCitation[] = []
  
  // 백슬래시가 있는 경우와 없는 경우 모두 처리
  // 패턴 1: 일반적인 (Source: filename.pdf)
  // 패턴 2: 백슬래시가 있는 \(Source: filename.pdf\)
  
  const patterns = [
    /\(Source:\s*([^)]*\.pdf)\)/gi,                    // 일반적인 경우
    /\\\(Source:\s*([^)]*\.pdf)\\\)/gi,               // 백슬래시가 앞뒤에 있는 경우
    /\\\(Source:\s*([^)]*\.pdf)\)/gi,                 // 앞에만 백슬래시
    /\(Source:\s*([^)]*\.pdf)\\\)/gi                  // 뒤에만 백슬래시
  ]
  
  patterns.forEach(regex => {
    let match
    // 각 패턴에 대해 전체 텍스트를 다시 스캔
    regex.lastIndex = 0
    while ((match = regex.exec(text)) !== null) {
      const filename = match[1].trim()
      
      // 중복 방지를 위해 이미 같은 파일명이 있는지 확인
      const isDuplicate = citations.some(citation => citation.filename === filename)
      
      if (!isDuplicate) {
        const isAvailable = isPDFAvailable(filename)
        citations.push({
          fullMatch: match[0],
          filename: filename,
          originalText: match[0],
          isAvailable: isAvailable,
          filePath: isAvailable ? getPDFPath(filename) : undefined
        })
      }
    }
  })
  
  return citations
}

/**
 * PDF 인용을 클릭 가능한 아이콘으로 치환하는 함수
 */
export function replacePDFCitations(text: string, onPDFClick?: (filename: string, filePath: string) => void): string {
  let result = text
  
  // 백슬래시가 있는 경우와 없는 경우 모두 처리하는 정규식 패턴들
  const patterns = [
    /\(Source:\s*([^)]*\.pdf)\)/gi,                    // 일반적인 경우
    /\\\(Source:\s*([^)]*\.pdf)\\\)/gi,               // 백슬래시가 앞뒤에 있는 경우
    /\\\(Source:\s*([^)]*\.pdf)\)/gi,                 // 앞에만 백슬래시
    /\(Source:\s*([^)]*\.pdf)\\\)/gi                  // 뒤에만 백슬래시
  ]
  
  patterns.forEach(regex => {
    result = result.replace(regex, (_, filename) => {
      const trimmedFilename = filename.trim()
      const isAvailable = isPDFAvailable(trimmedFilename)
      const filePath = isAvailable ? getPDFPath(trimmedFilename) : ''
      
      // PDF 아이콘을 클릭 가능하게 만들고, 사용 가능한 경우와 아닌 경우 스타일 다르게 적용
      const iconClass = isAvailable 
        ? 'pdf-citation-icon available text-blue-600 hover:text-blue-800' 
        : 'pdf-citation-icon unavailable text-gray-400'

      const safeFilenameAttr = trimmedFilename.replace(/"/g, '&quot;')
      const safeFilePathAttr = filePath.replace(/"/g, '&quot;')

      const interactiveAttributes = isAvailable && onPDFClick
        ? `data-pdf-filename="${safeFilenameAttr}" data-pdf-path="${safeFilePathAttr}" role="button" tabindex="0"`
        : ''

      const interactiveClass = isAvailable && onPDFClick
        ? ' pdf-citation-interactive cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200'
        : ''
      
      return `<span class="pdf-citation-wrapper inline-flex items-center gap-1${interactiveClass}" ${interactiveAttributes} title="${trimmedFilename}${isAvailable ? ' (클릭하여 보기)' : ' (파일 없음)'}">
        <svg class="${iconClass}" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="text-sm ${isAvailable ? 'text-blue-600' : 'text-gray-400'}">${trimmedFilename}</span>
      </span>`
    })
  })
  
  return result
}

/**
 * React 컴포넌트에서 사용할 수 있는 PDF 인용 치환 함수
 */
export function processContentWithPDFCitations(content: string, onPDFClick?: (filename: string, filePath: string) => void): string {
  return replacePDFCitations(content, onPDFClick)
}
"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PDFViewerProps {
  isVisible: boolean
  filename: string | null
  filePath: string | null
  onClose: () => void
  className?: string
}

export function PDFViewer({ 
  isVisible, 
  filename, 
  filePath, 
  onClose, 
  className 
}: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isVisible && filePath) {
      console.log('PDF Viewer opening with:', { filename, filePath })
      setIsLoading(true)
      setError(null)
      
      // PDF 로딩 시뮬레이션
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, filePath, filename])

  if (!isVisible) {
    return null
  }

  const handleDownload = () => {
    if (filePath && filename) {
      const link = document.createElement('a')
      link.href = filePath
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className={cn(
      "fixed inset-y-0 right-0 w-1/2 bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col",
      "transform transition-transform duration-300 ease-in-out",
      isVisible ? "translate-x-0" : "translate-x-full",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-blue-600"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 className="font-semibold text-gray-900 truncate max-w-64">
              {filename || 'PDF 문서'}
            </h3>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={!filePath}
            title="다운로드"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            title="닫기"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">PDF를 로딩하고 있습니다...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="text-red-500">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M15 9l-6 6" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 9l6 6" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div>
                <p className="text-red-600 font-medium">PDF를 불러올 수 없습니다</p>
                <p className="text-gray-500 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : filePath ? (
          <iframe
            src={`${filePath}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
            className="w-full h-full border-0"
            title={`PDF Viewer - ${filename}`}
            onLoad={() => {
              console.log('PDF iframe loaded successfully')
              setIsLoading(false)
            }}
            onError={(e) => {
              console.error('PDF iframe load error:', e)
              setIsLoading(false)
              setError('PDF 파일을 로드할 수 없습니다.')
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="text-gray-400">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <div>
                <p className="text-gray-600 font-medium">PDF 파일이 선택되지 않았습니다</p>
                <p className="text-gray-500 text-sm mt-1">채팅에서 PDF 인용을 클릭해보세요</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with file info */}
      {filename && filePath && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>출처: {filename}</span>
            <span className="text-xs text-gray-500">
              vector-db-files 폴더
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PDFViewer
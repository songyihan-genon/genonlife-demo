"use client"

import React from 'react'
import { MarkdownRenderer } from './markdown-renderer'

export function PDFCitationTest() {
  const sampleContent = `
# 테스트 문서

이것은 PDF 인용 기능을 테스트하는 샘플 문서입니다.

일반적인 내용입니다 (Source: 2025030616360442K_01.pdf)

백슬래시가 있는 경우: \\(Source: 2025041016295888E_01.pdf\\)

추가적인 내용과 함께 또 다른 PDF 인용이 있습니다 (Source: 삼성증권-현대차-251001.pdf)

이 내용은 PDF 인용이 없는 일반적인 텍스트입니다.

마지막으로 또 다른 PDF 인용입니다 (Source: ENG-hyundai-motors.pdf)
  `

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">PDF Citation Test</h2>
      <div className="border rounded-lg p-4 bg-gray-50">
        <MarkdownRenderer content={sampleContent} />
      </div>
    </div>
  )
}
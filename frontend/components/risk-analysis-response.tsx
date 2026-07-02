"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

interface RiskAnalysisProps {
  content: string
}

export function RiskAnalysisResponse({ content }: RiskAnalysisProps) {
  return (
    <div className="max-w-4xl bg-white p-6 rounded-xl border border-slate-200 shadow-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-lg border border-[#EBEFF5] shadow-sm mt-4 mb-6">
              <table className="min-w-full border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#F6F8FC] text-gray-900 text-sm">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[#EBEFF5]">
              {children}
            </tbody>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-semibold border border-[#EBEFF5]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 align-top text-sm text-gray-700 border border-[#EBEFF5]">
              {children}
            </td>
          ),
          h1: ({ children }) => (
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-base font-semibold text-gray-900 mt-4 mb-2">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 mb-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 mb-4">
              {children}
            </ol>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700">
              {children}
            </em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-sky-400 pl-4 italic text-gray-700 my-4">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-t border-sky-200" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
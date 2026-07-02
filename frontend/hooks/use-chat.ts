"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Message, processEvent, EventContext } from "@/lib/event-system"
import { processContentWithPDFCitations, PDFViewerState } from "@/lib/pdf-citation-utils"
import { replaceCitationSegment } from "@/lib/citation-utils"

export interface UseChatProps {
    initialMessage?: string
    disableAutoScroll?: boolean
    historyKey?: string
    seedMessages?: Message[]
}

function cloneMessages(messages: Message[]) {
    return messages.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
    }))
}

export function useChat({ initialMessage, disableAutoScroll = false, historyKey, seedMessages = [] }: UseChatProps = {}) {
    const router = useRouter()
    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [activeSteps, setActiveSteps] = useState<Set<string>>(new Set())
    const [sourceDocuments, setSourceDocuments] = useState<any[]>([])
    const [toolState, setToolState] = useState<any>(null)
    const [pdfViewer, setPdfViewer] = useState<PDFViewerState>({
        isVisible: false,
        currentPDF: null,
        filename: null
    })

    // 페이지 세션 동안 유지되는 chatId 생성
    const [chatId] = useState(() =>
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    )

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesAreaRef = useRef<HTMLDivElement>(null)
    const hasAutoSent = useRef(false)

    useEffect(() => {
        if (!historyKey) {
            if (seedMessages.length > 0) {
                setMessages(cloneMessages(seedMessages))
            }
            return
        }

        try {
            const raw = localStorage.getItem(historyKey)
            if (!raw) {
                if (seedMessages.length > 0) {
                    setMessages(cloneMessages(seedMessages))
                }
                return
            }

            const parsed = JSON.parse(raw) as Message[]
            setMessages(cloneMessages(parsed))
        } catch (error) {
            console.error("Failed to load chat history:", error)
            if (seedMessages.length > 0) {
                setMessages(cloneMessages(seedMessages))
            }
        }
    }, [historyKey, seedMessages])

    useEffect(() => {
        if (!historyKey) return

        try {
            localStorage.setItem(historyKey, JSON.stringify(messages))
        } catch (error) {
            console.error("Failed to save chat history:", error)
        }
    }, [historyKey, messages])

    // 출처 파싱을 위한 상태 Refs
    const citationBufferRef = useRef("")
    const insideCitationRef = useRef(false)

    // PDF 뷰어 제어
    const showPDFViewer = useCallback((filename: string, filePath: string) => {
        setPdfViewer({
            isVisible: true,
            currentPDF: filePath,
            filename: filename
        })
    }, [])

    const closePDFViewer = useCallback(() => {
        setPdfViewer({
            isVisible: false,
            currentPDF: null,
            filename: null
        })
    }, [])

    const scrollToBottom = useCallback(() => {
        try {
            if (messagesAreaRef.current) {
                messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight
                return
            }
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "end"
                })
            }
        } catch (error) {
            console.error('Scroll error:', error)
        }
    }, [])

    // 메시지 변경 시 스크롤
    useEffect(() => {
        if (disableAutoScroll) return
        const timer = setTimeout(scrollToBottom, 100)
        return () => clearTimeout(timer)
    }, [messages, scrollToBottom, disableAutoScroll])

    // 로딩 상태 변경 시 스크롤
    useEffect(() => {
        if (disableAutoScroll) return
        if (!isLoading) {
            const timer = setTimeout(scrollToBottom, 200)
            return () => clearTimeout(timer)
        }
    }, [isLoading, scrollToBottom, disableAutoScroll])

    // 초기 메시지 자동 전송
    useEffect(() => {
        if (initialMessage && !hasAutoSent.current) {
            hasAutoSent.current = true
            setMessage(initialMessage)
            setTimeout(() => {
                handleSendMessage(initialMessage)
                router.replace('/insight-chat', { scroll: false })
            }, 100)
        }
    }, [initialMessage, router])

    // 스트리밍 텍스트 처리 (PDF 인용 및 Citation 파싱)
    const processTokenWithCitations = useCallback((text: string): { processedText: string; shouldAppend: boolean } => {
        let result = ""
        let i = 0
        const n = text.length

        while (i < n) {
            if (insideCitationRef.current) {
                citationBufferRef.current += text[i]
                i++

                const closeIdx = citationBufferRef.current.indexOf("】")
                if (closeIdx !== -1) {
                    const segment = citationBufferRef.current.substring(0, closeIdx + 1)
                    const remainder = citationBufferRef.current.substring(closeIdx + 1)

                    const replaced = replaceCitationSegment(segment, toolState)
                    result += replaced

                    citationBufferRef.current = ""
                    insideCitationRef.current = false

                    if (remainder) {
                        const remainderResult = processTokenWithCitations(remainder)
                        result += remainderResult.processedText
                    }
                }
            } else {
                const startIdx = text.indexOf("【", i)
                if (startIdx === -1) {
                    const chunk = text.substring(i)
                    const processedChunk = processContentWithPDFCitations(chunk, showPDFViewer)
                    result += processedChunk
                    break
                }

                if (startIdx > i) {
                    const chunk = text.substring(i, startIdx)
                    const processedChunk = processContentWithPDFCitations(chunk, showPDFViewer)
                    result += processedChunk
                }

                insideCitationRef.current = true
                citationBufferRef.current = "【"
                i = startIdx + 1
            }
        }

        return { processedText: result, shouldAppend: true }
    }, [toolState, showPDFViewer])

    const handleSendMessage = async (messageText: string) => {
        if (!messageText.trim()) return

        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            content: messageText.trim(),
            role: "user",
            timestamp: new Date(),
            sessionId: sessionId
        }

        setMessages(prev => [...prev, userMessage])
        setMessage("")
        setIsLoading(true)

        if (messages.length === 0) {
            setSourceDocuments([])
            setToolState(null)
        }
        citationBufferRef.current = ""
        insideCitationRef.current = false

        try {
            // localhost:5588 서버로만 요청
            const response = await fetch("/api/research-agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: messageText.trim(),
                    chatId: chatId,
                    messages: messages
                        .filter(msg => msg.role === "user" || msg.role === "assistant")
                        .map(msg => ({ role: msg.role, content: msg.content }))
                })
            })

            if (!response.ok) throw new Error("Failed to get response")

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (reader) {
                let buffer = ""
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) {
                        setIsLoading(false)
                        break
                    }

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ""

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6)
                            if (data === '[DONE]') {
                                setIsLoading(false)
                                break
                            }

                            try {
                                const parsed = JSON.parse(data)
                                const event = parsed.event
                                const eventData = parsed.data

                                const eventContext: EventContext = {
                                    setMessages,
                                    setActiveSteps,
                                    setSourceDocuments,
                                    setToolState,
                                    setIsLoading,
                                    scrollToBottom,
                                    toolState,
                                    citationBufferRef,
                                    insideCitationRef,
                                    sessionId
                                }

                                processEvent(event, eventData, eventContext)

                            } catch (parseError) {
                                console.error("Error parsing streaming data:", parseError)
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error sending message:", error)
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                content: "죄송합니다. 응답을 가져오는 중 오류가 발생했습니다.",
                role: "assistant",
                timestamp: new Date(),
                sessionId: sessionId
            }
            setMessages(prev => [...prev, errorMessage])
            setActiveSteps(new Set())
        } finally {
            setIsLoading(false)
        }
    }

    return {
        message,
        setMessage,
        setMessages,
        messages,
        isLoading,
        activeSteps,
        sourceDocuments,
        toolState,
        pdfViewer,
        messagesAreaRef,
        messagesEndRef,
        handleSendMessage,
        showPDFViewer,
        closePDFViewer,
        processContentWithPDFCitations // 렌더링 시 사용하기 위해 노출
    }
}

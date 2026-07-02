import { useEffect, useRef } from "react"
import { Message } from "@/lib/event-system"
import { AgentFlowComponent, SourceDocumentsComponent } from "@/components/agent-flow-components"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { PDFViewerState } from "@/lib/pdf-citation-utils"
import { cn } from "@/lib/utils"

interface ChatListProps {
    messages: Message[]
    activeSteps: Set<string>
    sourceDocuments: any[]
    toolState: any
    pdfViewer: PDFViewerState
    isLoading: boolean
    messagesEndRef: React.RefObject<HTMLDivElement>
    onPDFClick: (filename: string, filePath: string) => void
    processContentWithPDFCitations: (text: string, onPDFClick: (filename: string, filePath: string) => void) => string
}

export function ChatList({
    messages,
    activeSteps,
    sourceDocuments,
    toolState,
    pdfViewer,
    isLoading,
    messagesEndRef,
    onPDFClick,
    processContentWithPDFCitations
}: ChatListProps) {

    const lastScrolledMessageId = useRef<string | null>(null)

    // 사용자 메시지가 추가될 때만 스크롤 (에이전트 답변 생성 시에는 스크롤 하지 않음)
    useEffect(() => {
        // 메시지 리스트를 뒤에서부터 탐색하여 마지막 사용자 메시지를 찾음
        let lastUserMessage = null
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                lastUserMessage = messages[i]
                break
            }
        }

        // 새로운 사용자 메시지가 발견되었을 때만 스크롤 실행
        if (lastUserMessage && lastUserMessage.id !== lastScrolledMessageId.current) {
            lastScrolledMessageId.current = lastUserMessage.id

            // DOM 렌더링 시간을 고려하여 약간의 지연 후 스크롤
            setTimeout(() => {
                const element = document.getElementById(`message-${lastUserMessage.id}`)
                if (element) {
                    element.scrollIntoView({
                        block: 'start',
                        behavior: 'smooth'
                    })
                }
            }, 100)
        }
    }, [messages])

    const handlePDFCitationClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement
        const container = target.closest('.pdf-citation-interactive') as HTMLElement
        if (container) {
            const filename = container.getAttribute('data-pdf-filename')
            const filePath = container.getAttribute('data-pdf-path')
            if (filename && filePath) {
                onPDFClick(filename, filePath)
            }
        }
    }

    const handlePDFCitationKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return

        const target = event.target as HTMLElement
        const container = target.closest('.pdf-citation-interactive') as HTMLElement
        if (container) {
            event.preventDefault()
            const filename = container.getAttribute('data-pdf-filename')
            const filePath = container.getAttribute('data-pdf-path')
            if (filename && filePath) {
                onPDFClick(filename, filePath)
            }
        }
    }

    const renderMessages = () => {
        const groupedMessages: JSX.Element[] = []
        let currentAssistantGroup: Message[] = []
        let assistantGroupKey = ''

        const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null

        const flushAssistantGroup = () => {
            if (currentAssistantGroup.length > 0) {
                const lastInGroup = currentAssistantGroup[currentAssistantGroup.length - 1]
                const isLastGroup = lastInGroup.id === lastMessageId

                groupedMessages.push(
                    <div key={assistantGroupKey} className="flex gap-4 w-full items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                            <img src="/shinhanlife-ai-mark.svg" alt="AI Portal Logo" className="w-8 h-8" />
                        </div>
                        <div className="flex-1 min-w-0 max-w-3xl" onClick={handlePDFCitationClick} onKeyDown={handlePDFCitationKeyDown}>
                            {currentAssistantGroup.map((msg, index) => {
                                if (msg.role === "agent-flow" && msg.agentFlowData) {
                                    return (
                                        <AgentFlowComponent
                                            key={msg.id}
                                            nodeLabel={msg.agentFlowData.nodeLabel}
                                            data={msg.agentFlowData.data}
                                            activeSteps={activeSteps}
                                        />
                                    )
                                }

                                if (msg.role === "source-documents" && msg.sourceDocuments) {
                                    return (
                                        <SourceDocumentsComponent
                                            key={msg.id}
                                            documents={msg.sourceDocuments}
                                        />
                                    )
                                }

                                if (msg.role === "reasoning") {
                                    return (
                                        <AgentFlowComponent
                                            key={msg.id}
                                            nodeLabel="Visible Reasoner"
                                            data={{
                                                output: {
                                                    content: JSON.stringify({ visible_rationale: msg.content })
                                                }
                                            }}
                                            activeSteps={activeSteps}
                                        />
                                    )
                                }

                                if (msg.role === "assistant") {
                                    const processedContent = processContentWithPDFCitations(msg.content, onPDFClick)

                                    return (
                                        <div key={msg.id} className="px-0 py-3 w-full text-black dark:text-white">
                                            {msg.isMarkdown || msg.content.includes('#') ? (
                                                <MarkdownRenderer
                                                    content={msg.content}
                                                    className="text-black dark:text-white [&_*]:text-black dark:[&_*]:text-white [&_a]:text-[#3A4D9B] dark:[&_a]:text-[#60A5FA] [&_a:hover]:text-[#153AD4] dark:[&_a:hover]:text-[#93C5FD] [&_code]:bg-gray-200 dark:[&_code]:bg-gray-700 [&_code]:text-black dark:[&_code]:text-white"
                                                    sourceDocuments={sourceDocuments}
                                                    toolState={toolState}
                                                    onPDFClick={onPDFClick}
                                                />
                                            ) : (
                                                <div
                                                    className="whitespace-pre-wrap text-sm leading-relaxed"
                                                    dangerouslySetInnerHTML={{ __html: processedContent }}
                                                />
                                            )}
                                        </div>
                                    )
                                }

                                return null
                            })}
                        </div>
                    </div>
                )
                currentAssistantGroup = []
            }
        }

        let userMsgIndex = 0

        messages.forEach((msg) => {
            if (msg.role === "user") {
                flushAssistantGroup()
                const roundNum = ++userMsgIndex
                groupedMessages.push(
                    <div key={msg.id} className="space-y-2">
                        {roundNum > 1 && (
                            <div className="flex items-center gap-3 py-1">
                                <div className="flex-1 h-px bg-border/60" />
                                <span className="text-[10px] text-muted-foreground/60 font-medium tracking-wide">질의 {roundNum}</span>
                                <div className="flex-1 h-px bg-border/60" />
                            </div>
                        )}
                        <div
                            id={`message-${msg.id}`}
                            className="flex gap-4 w-full ml-auto flex-row-reverse scroll-mt-56"
                        >
                            <div className="flex-shrink-0 w-8 h-8"></div>
                            <div className="px-4 py-3 max-w-md bg-[#F0F4FA] text-black rounded-2xl">
                                <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                            </div>
                        </div>
                    </div>
                )
            } else if (msg.role === "agent-flow" || msg.role === "source-documents" || msg.role === "reasoning" || msg.role === "assistant") {
                if (currentAssistantGroup.length === 0) {
                    assistantGroupKey = `assistant-group-${msg.sessionId || msg.id}`
                }
                currentAssistantGroup.push(msg)
            }
        })

        flushAssistantGroup()
        return groupedMessages
    }

    return (
        <div
            className={cn(
                "insight-chat-messages w-full max-w-5xl mx-auto px-6 pt-6 pb-32 space-y-6 transition-all duration-300",
                pdfViewer.isVisible ? "mr-[50%]" : ""
            )}
        >
            {renderMessages()}

            {isLoading && (
                <div className="flex gap-4 w-full">
                    <div className="flex-shrink-0 w-8 h-8"></div>
                    <div className="px-4 py-3 max-w-md bg-gray-100 text-black rounded-2xl">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    )
}

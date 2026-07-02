"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUp, Paperclip, Bot, User, FileText, File, Globe, X, Lightbulb, ChevronDown, Download, Loader2, Upload, History, PanelRightOpen, PanelRightClose } from "lucide-react"
import { cn, extractKoreanName } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { GenPortalHome } from "@/components/genportal-home"
// Removed WorldClocks import as per request

type ChatMode = "supporting-agent"
type TaskMode = "research-insight" | "formatting" | "documentation" | "translation" | null

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface AttachedDocument {
  id: string
  name: string
  content: string
  type: string
}

interface TranslatedDocument {
  id: string
  originalId: string
  name: string
  content: string
  targetLanguage: string
}

interface TranslationHistoryItem {
  id: string
  timestamp: number
  originalName: string
  translatedName: string
  lang: string
  content?: string
}

interface ChatInterfaceProps {
  className?: string
  initialTaskMode?: "research-insight" | "formatting" | "documentation" | "translation"
}

// Removed market tickers data as per request

import { useAuth } from "@/contexts/auth-context"

export function ChatInterface({ className, initialTaskMode }: ChatInterfaceProps) {
  const { user } = useAuth()
  const router = useRouter()
  const displayName =
    extractKoreanName(user?.name || user?.user_metadata?.full_name) ||
    user?.email?.split("@")[0] ||
    "사용자"
  const [message, setMessage] = useState("")
  const [mode, setMode] = useState<ChatMode>("supporting-agent")
  const [taskMode, setTaskMode] = useState<TaskMode>(initialTaskMode ?? "research-insight")
  useEffect(() => {
    if (initialTaskMode) {
      setTaskMode(initialTaskMode)
    }
  }, [initialTaskMode])
  const exampleListRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [attachedDocuments, setAttachedDocuments] = useState<AttachedDocument[]>([
    {
      id: "1",
      name: "제논라이프-상담응대-운영안내.pdf",
      content: "/report-pdf/삼성증권-현대차-251001.pdf",
      type: "PDF"
    }
  ])
  const [translatedDocuments, setTranslatedDocuments] = useState<TranslatedDocument[]>([])
  const [selectedTranslatedDocument, setSelectedTranslatedDocument] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<string | null>("1")
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; name: string; type: string }[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileIndex, setFileIndex] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState("english")
  const [isTranslating, setIsTranslating] = useState(false)
  const [history, setHistory] = useState<TranslationHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(true)

  // Load and persist translation history
  useEffect(() => {
    try {
      const raw = localStorage.getItem("translation_history_v1")
      if (raw) setHistory(JSON.parse(raw) as TranslationHistoryItem[])
    } catch { }
  }, [])
  useEffect(() => {
    try { localStorage.setItem("translation_history_v1", JSON.stringify(history)) } catch { }
  }, [history])

  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const handleTranslate = async () => {
    const languageMap: { [key: string]: string } = {
      english: "영어",
      japanese: "일본어",
      chinese: "중국어",
      korean: "한국어",
      french: "프랑스어",
      german: "독일어",
      spanish: "스페인어"
    }

    setIsTranslating(true)

    // 번역 시뮬레이션 (2초 대기)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 번역된 문서를 추가
    if (attachedDocuments.length > 0) {
      const selectedDoc = attachedDocuments.find(doc => doc.id === selectedDocument)
      if (selectedDoc) {
        // 영어로 번역할 때는 영어 PDF 사용, 다른 언어는 원본 사용
        const translatedContent = selectedLanguage === 'english'
          ? '/report-pdf/(ENG)-hyundai-motors.pdf'
          : selectedDoc.content;

        const newTranslatedDoc: TranslatedDocument = {
          id: `t${Date.now()}`,
          originalId: selectedDoc.id,
          name: `${selectedDoc.name.replace('.pdf', '')} (${languageMap[selectedLanguage]} 번역).pdf`,
          content: translatedContent,
          targetLanguage: languageMap[selectedLanguage]
        }

        setTranslatedDocuments(prev => [...prev, newTranslatedDoc])
        setSelectedTranslatedDocument(newTranslatedDoc.id)

        // Save to local history
        const hist: TranslationHistoryItem = {
          id: `${Date.now()}`,
          timestamp: Date.now(),
          originalName: selectedDoc.name,
          translatedName: newTranslatedDoc.name,
          lang: languageMap[selectedLanguage],
          content: newTranslatedDoc.content
        }
        setHistory(prev => [hist, ...prev])
      }
    }

    setIsTranslating(false)
  }

  const handleDownload = (doc: TranslatedDocument) => {
    // 실제로는 번역된 PDF 파일을 다운로드해야 하지만, 데모용으로 원본 파일 다운로드
    const link = document.createElement('a')
    link.href = doc.content
    link.download = doc.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // File upload for attached documents
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleFilePick = () => fileInputRef.current?.click()
  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const docs: AttachedDocument[] = []
    Array.from(files).forEach((f) => {
      const url = URL.createObjectURL(f)
      const type = f.type?.toLowerCase().includes("pdf") ? "PDF" : (f.type || "FILE")
      docs.push({ id: `${Date.now()}-${f.name}`, name: f.name, content: url, type })
    })
    setAttachedDocuments(prev => [...prev, ...docs])
    if (docs.length > 0) setSelectedDocument(docs[0].id)
    e.currentTarget.value = ""
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const sampleFiles = [
      "제논라이프-상담응대-운영안내.pdf",
      "제논라이프-보험금청구-상담매뉴얼.pdf",
      "제논라이프-사내규정-검색기준.pdf",
      "제논라이프-운영데이터-월간리포트.pdf",
      "제논라이프-민원사례-VOC-요약.pdf"
    ]

    const selectedFile = sampleFiles[fileIndex % sampleFiles.length]
    const newFile = {
      id: Date.now().toString(),
      name: selectedFile,
      type: "PDF"
    }

    setAttachedFiles(prev => [...prev, newFile])
    setFileIndex(prev => prev + 1)
  }

  const handleSend = async () => {
    if (message.trim()) {
      // For formatting and documentation, keep UI blank for now
      if (taskMode === "formatting" || taskMode === "documentation") {
        return
      }
      // If Research Agent is selected, navigate to insight-chat with the message
      if (taskMode === "research-insight") {
        const encodedMessage = encodeURIComponent(message.trim())
        router.push(`/insight-chat?message=${encodedMessage}`)
        return
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        content: message.trim(),
        role: "user",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage])
      setMessage("")
      setIsLoading(true)

      // Create a placeholder assistant message that will be updated with streaming content
      const assistantMessageId = (Date.now() + 1).toString()
      const assistantMessage: Message = {
        id: assistantMessageId,
        content: "",
        role: "assistant",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage.content,
            taskMode: taskMode
          })
        })

        if (!response.ok) {
          throw new Error("Failed to get response")
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (reader) {
          let buffer = ""

          while (true) {
            const { done, value } = await reader.read()

            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')

            // Keep the last incomplete line in buffer
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)

                if (data === '[DONE]') {
                  break
                }

                try {
                  const parsed = JSON.parse(data)

                  if (parsed.error) {
                    throw new Error(parsed.error)
                  }

                  if (parsed.done) {
                    break
                  }

                  if (parsed.content) {
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: msg.content + parsed.content }
                          : msg
                      )
                    )
                  }
                } catch (parseError) {
                  console.error("Error parsing streaming data:", parseError)
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error sending message:", error)
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: "죄송합니다. 응답을 가져오는 중 오류가 발생했습니다." }
              : msg
          )
        )
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Always show example list on landing; task mode switching UI removed
  const handleTaskModeSelect = (newTaskMode: TaskMode) => {
    setTaskMode(newTaskMode)
  }

  // For translation mode, land directly on the document view (no chat landing)
  if (messages.length === 0 && taskMode !== "translation") {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background/95 to-background">
        <div className="flex flex-1 justify-center px-4 pb-10 pt-10">
          <div className="w-full max-w-6xl space-y-8">
            <GenPortalHome displayName={displayName} />

            <div className="mx-auto w-full max-w-4xl space-y-4">
              <div className="space-y-1 text-left">
                <h2 className="text-xl font-semibold text-foreground">빠른 질문 시작</h2>
                <p className="text-sm text-muted-foreground">
                  포털에서 원하는 서비스를 선택하거나, 아래 입력창에서 바로 질문을 시작할 수 있습니다.
                </p>
              </div>

              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{file.name}</span>
                      <button
                        onClick={() => removeAttachedFile(file.id)}
                        className="ml-1 text-gray-600 hover:text-gray-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div
                className={cn(
                  "relative",
                  isDragOver && "ring-2 ring-[#005BAC] ring-offset-2 rounded-lg"
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isDragOver ? "파일을 여기에 드롭하세요..." : "어떤 도움이 필요하신가요?"}
                  className={cn(
                    "min-h-[100px] w-full pr-20 resize-none rounded-2xl border border-input bg-card p-5 text-foreground transition-all dark:border-none dark:bg-[#414141]",
                    message.trim() && "ring-1 ring-primary/40",
                    isDragOver && "bg-muted"
                  )}
                  disabled={isLoading}
                />

                {/* Action Buttons */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!message.trim() || isLoading}
                    className="h-8 w-8 rounded-full bg-[#005BAC] text-white hover:bg-[#004F9E]"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Example Lists (buttons removed) */}
              <div className="flex flex-col items-center justify-center gap-3 pt-2">
                {taskMode && (
                  <div ref={exampleListRef} className="mt-2 w-full rounded-lg bg-transparent p-4">
                    <div className="space-y-2 text-left">
                      {taskMode === "research-insight" && (
                        <>
                          <div
                            className="text-sm text-muted-foreground hover:text-foreground cursor-pointer p-3 rounded transition-colors text-left w-full overflow-hidden whitespace-nowrap text-ellipsis hover:bg-muted/60"
                            onClick={() => setMessage("채무조정 상담을 처음 문의한 고객에게 보낼 안내 메시지를 정중하고 이해하기 쉽게 정리해줘.")}
                          >
                            채무조정 상담을 처음 문의한 고객에게 보낼 안내 메시지를 정중하고 이해하기 쉽게 정리해줘.
                          </div>
                          <div className="w-full h-px bg-border" style={{ height: '0.5px' }}></div>
                          <div
                            className="text-sm text-muted-foreground hover:text-foreground cursor-pointer p-3 rounded transition-colors text-left w-full overflow-hidden whitespace-nowrap text-ellipsis hover:bg-muted/60"
                            onClick={() => setMessage("법령과 사규 기준으로 수의계약 검토 시 꼭 확인해야 할 체크리스트를 만들어줘.")}
                          >
                            법령과 사규 기준으로 수의계약 검토 시 꼭 확인해야 할 체크리스트를 만들어줘.
                          </div>
                          <div className="w-full h-px bg-border" style={{ height: '0.5px' }}></div>
                          <div
                            className="text-sm text-muted-foreground hover:text-foreground cursor-pointer p-3 rounded transition-colors text-left w-full overflow-hidden whitespace-nowrap text-ellipsis hover:bg-muted/60"
                            onClick={() => setMessage("상담 안내 메시지를 생성하는 API를 만든다고 할 때 요청과 응답 예시를 작성해줘.")}
                          >
                            상담 안내 메시지를 생성하는 API를 만든다고 할 때 요청과 응답 예시를 작성해줘.
                          </div>

                        </>
                      )}
                      {taskMode === "formatting" && (<></>)}
                      {taskMode === "documentation" && (<></>)}
                      {taskMode === "translation" && (
                        <>
                          <div
                            className="text-sm text-muted-foreground hover:text-foreground cursor-pointer p-3 rounded transition-colors text-left w-full overflow-hidden whitespace-nowrap text-ellipsis hover:bg-muted/60"
                            onClick={() => setMessage("리포트 자료 영어로 번역해줘")}
                          >
                            리포트 자료 영어로 번역해줘
                          </div>
                          <div className="w-full h-px bg-gray-200" style={{ height: '0.5px' }}></div>
                          <div
                            className="text-sm text-gray-600 hover:text-gray-800 cursor-pointer p-3 rounded transition-colors text-left w-full overflow-hidden whitespace-nowrap text-ellipsis"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F4FA'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => setMessage("중국어로 변환해줘")}
                          >
                            중국어로 변환해줘
                          </div>
                          <div className="w-full h-px bg-gray-200" style={{ height: '0.5px' }}></div>
                          <div
                            className="text-sm text-gray-600 hover:text-gray-800 cursor-pointer p-3 rounded transition-colors text-left w-full overflow-hidden whitespace-nowrap text-ellipsis"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F4FA'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => setMessage("일본어로 번역해줄래?")}
                          >
                            일본어로 번역해줄래?
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Supporting Agent Mode - Three Panel Layout
  if (taskMode === "translation" || messages.length > 0) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        {/* Header with mode indicator */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">리서치 어시스턴트</h2>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(v => !v)} title={showHistory ? "히스토리 숨기기" : "히스토리 보이기"}>
                {showHistory ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Two Panel Layout */}
        <div className={cn("flex-1 flex overflow-hidden h-full relative", showHistory ? "pr-[340px]" : "")}>
          {/* Left Panel - Attached Documents (1/2 width) */}
          <div className="w-1/2 border-r border-border bg-muted/30 flex flex-col h-full">
            <div className="p-4 border-b border-border flex-shrink-0 h-16 flex items-center justify-between">
              <h3 className="font-medium text-sm">첨부된 문서</h3>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf"
                  multiple
                  className="hidden"
                  onChange={onFilesSelected}
                />
                <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={handleFilePick}>
                  <Upload className="h-3 w-3 mr-1" /> 파일 업로드
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {/* Document List */}
              <div className="p-2 space-y-1 flex-shrink-0 h-20 overflow-y-auto border-b border-border">
                {attachedDocuments.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    첨부된 문서가 없습니다
                  </div>
                ) : (
                  attachedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className={cn(
                        "p-2 rounded border cursor-pointer transition-colors text-xs",
                        selectedDocument === doc.id
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background hover:bg-muted"
                      )}
                      onClick={() => setSelectedDocument(doc.id)}
                    >
                      <div className="font-medium truncate">{doc.name}</div>
                    </div>
                  ))
                )}
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 min-h-0 bg-card">
                <div className="h-full p-2">
                  {selectedDocument ? (
                    <iframe
                      src={`${attachedDocuments.find(doc => doc.id === selectedDocument)?.content}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full border rounded bg-card"
                      title="PDF Viewer"
                    />
                  ) : (
                    <div className="w-full h-full border rounded flex items-center justify-center bg-muted/50">
                      <span className="text-muted-foreground text-sm">문서를 선택해주세요</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Translated Documents (1/2 width) */}
          <div className="w-1/2 bg-muted/20 flex flex-col h-full">
            <div className="p-4 border-b border-border flex-shrink-0 h-16 flex items-center">
              <div className="flex items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">번역된 문서</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue placeholder="언어 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">영어</SelectItem>
                      <SelectItem value="japanese">일본어</SelectItem>
                      <SelectItem value="chinese">중국어</SelectItem>
                      <SelectItem value="korean">한국어</SelectItem>
                      <SelectItem value="french">프랑스어</SelectItem>
                      <SelectItem value="german">독일어</SelectItem>
                      <SelectItem value="spanish">스페인어</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleTranslate}
                    disabled={attachedDocuments.length === 0 || isTranslating}
                    className="h-8 px-3 text-xs"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        번역 중...
                      </>
                    ) : (
                      "번역하기"
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {/* Translated Document List */}
              <div className="p-2 space-y-1 flex-shrink-0 h-20 overflow-y-auto border-b border-border">
                {translatedDocuments.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    번역된 문서가 없습니다
                  </div>
                ) : (
                  translatedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className={cn(
                        "p-2 rounded border transition-colors text-xs flex items-center justify-between",
                        selectedTranslatedDocument === doc.id
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background hover:bg-muted"
                      )}
                    >
                      <div
                        className="font-medium truncate cursor-pointer flex-1"
                        onClick={() => setSelectedTranslatedDocument(doc.id)}
                      >
                        {doc.name}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 ml-2 flex-shrink-0 hover:bg-gray-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(doc)
                        }}
                        title="다운로드"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>


              {/* Translated PDF Viewer */}
              <div className="flex-1 min-h-0 bg-card">
                <div className="h-full p-2">
                  {selectedTranslatedDocument ? (
                    <iframe
                      src={`${translatedDocuments.find(doc => doc.id === selectedTranslatedDocument)?.content}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full border rounded bg-card"
                      title="Translated PDF Viewer"
                    />
                  ) : (
                    <div className="w-full h-full border rounded flex items-center justify-center bg-muted/50">
                      <span className="text-muted-foreground text-sm">번역된 문서가 없습니다</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Global Slide-out History Panel at far right */}
          <div className={cn(
            "absolute inset-y-0 right-0 w-[340px] bg-card border-l border-border shadow-lg transform transition-transform duration-300",
            showHistory ? "translate-x-0" : "translate-x-full"
          )}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-start">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <History className="h-4 w-4" /> 번역 히스토리
                </div>
              </div>
              <div className="flex-1 overflow-auto p-3 space-y-2">
                {history.length === 0 ? (
                  <div className="text-center text-muted-foreground text-xs py-4">내역이 없습니다.</div>
                ) : (
                  history.map(h => (
                    <div key={h.id} className="p-2 border rounded bg-background">
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(h.timestamp).toLocaleString()} • {h.lang}
                      </div>
                      <div className="text-xs font-medium truncate" title={h.translatedName}>{h.translatedName}</div>
                      <div className="mt-2 flex items-center gap-2">
                        {h.content ? (
                          <>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => {
                              const id = `h${Date.now()}`
                              setTranslatedDocuments(prev => [...prev, { id, originalId: id, name: h.translatedName, content: h.content!, targetLanguage: h.lang }])
                              setSelectedTranslatedDocument(id)
                            }}>열기</Button>
                            <Button size="sm" className="h-7 px-2 text-xs" onClick={() => {
                              const a = document.createElement('a')
                              a.href = h.content!
                              a.download = h.translatedName
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                            }}>다운로드</Button>
                          </>
                        ) : (
                          <div className="text-[11px] text-muted-foreground">파일 경로가 없어 미리보기를 지원하지 않습니다.</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

}

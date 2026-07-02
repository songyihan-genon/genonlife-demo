import { Dispatch, SetStateAction } from 'react'

// 메시지 타입 정의 (export로 다른 파일에서 재사용 가능)
export interface Message {
  id: string
  content: string
  role: "user" | "assistant" | "agent-flow" | "source-documents" | "reasoning"
  timestamp: Date
  agentFlowData?: any
  sourceDocuments?: any[]
  isMarkdown?: boolean
  eventType?: string  // 이벤트 타입 추가
  sessionId?: string  // 세션 ID 추가 (같은 질문에 대한 응답들을 그룹핑)
}

// 이벤트 처리 컨텍스트
export interface EventContext {
  setMessages: Dispatch<SetStateAction<Message[]>>
  setActiveSteps: Dispatch<SetStateAction<Set<string>>>
  setSourceDocuments: Dispatch<SetStateAction<any[]>>
  setToolState: Dispatch<SetStateAction<any>>
  setIsLoading: Dispatch<SetStateAction<boolean>>
  scrollToBottom: () => void
  toolState: any
  citationBufferRef: React.MutableRefObject<string>
  insideCitationRef: React.MutableRefObject<boolean>
  sessionId: string  // 현재 세션 ID
}

// 이벤트 처리 결과
export interface EventResult {
  shouldContinue?: boolean
  error?: string
}

// 확장된 이벤트 컨텍스트 (핸들러에서 사용)
export interface ExtendedEventContext extends EventContext {
  currentEventType: string
}

// 이벤트 핸들러 타입
export type EventHandler = (eventData: any, context: ExtendedEventContext) => EventResult

// 이벤트 핸들러 맵
export const EVENT_HANDLERS: Record<string, EventHandler> = {
  tool_state: handleToolStateEvent,
  reasoning_progress: handleReasoningProgressEvent,
  reasoning_token: handleReasoningProgressEvent, // reasoning_token도 reasoning으로 처리
  agentFlowExecutedData: handleAgentFlowEvent,
  sourceDocuments: handleSourceDocumentsEvent,
  token: handleTokenEvent,
  citation_update: handleCitationUpdateEvent,
  result: handleResultEvent,
  error: handleErrorEvent,
  // 금융 이벤트들은 실제로는 agentFlowExecutedData로 처리됨
}

// 유틸리티 함수: 새 메시지 ID 생성
function generateMessageId(eventType: string): string {
  return `${eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 중앙화된 이벤트 처리 함수
export function processEvent(event: string, eventData: any, context: EventContext): EventResult {
  const handler = EVENT_HANDLERS[event]

  if (!handler) {
    console.log('Unknown event:', event, eventData)
    return { shouldContinue: true }
  }

  try {
    console.log(`📋 PROCESSING EVENT: ${event}`)

    // 이벤트 처리 전에 현재 이벤트 타입을 컨텍스트에 전달
    const eventContext = {
      ...context,
      currentEventType: event
    }

    const result = handler(eventData, eventContext)
    return result
  } catch (error) {
    console.error(`Error processing event ${event}:`, error)
    return { error: `Failed to process ${event} event` }
  }
}

// === 개별 이벤트 핸들러들 ===

function handleToolStateEvent(eventData: any, context: ExtendedEventContext): EventResult {
  context.setToolState(eventData)
  return { shouldContinue: true }
}

function handleReasoningProgressEvent(eventData: any, context: ExtendedEventContext): EventResult {
  // 추론 단계 활성화
  context.setActiveSteps(prev => new Set(prev).add('reasoning'))

  context.setMessages(prev => {
    // 마지막 메시지가 같은 세션의 reasoning 메시지인지 확인
    const lastMessage = prev[prev.length - 1]
    const isLastReasoningMessage = lastMessage &&
      lastMessage.role === 'reasoning' &&
      lastMessage.sessionId === context.sessionId &&
      (lastMessage.eventType === 'reasoning_progress' || lastMessage.eventType === 'reasoning_token')

    if (isLastReasoningMessage) {
      // 마지막 reasoning 메시지에 append
      const updatedMessages = [...prev]
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        content: lastMessage.content + eventData
      }
      console.log('🧠 APPENDING REASONING to:', lastMessage.id)
      return updatedMessages
    } else {
      // 새로운 reasoning 메시지 생성
      const reasoningMessage: Message = {
        id: generateMessageId('reasoning'),
        content: eventData,
        role: 'reasoning',
        timestamp: new Date(),
        eventType: context.currentEventType,
        sessionId: context.sessionId
      }
      console.log('🧠 NEW REASONING MESSAGE:', reasoningMessage.id)
      return [...prev, reasoningMessage]
    }
  })

  setTimeout(context.scrollToBottom, 10)
  return { shouldContinue: true }
}

function handleAgentFlowEvent(eventData: any, context: ExtendedEventContext): EventResult {
  const nodeLabel = eventData.nodeLabel

  console.log('🚀 AGENT FLOW EVENT:', { nodeLabel })

  context.setActiveSteps(prev => {
    const newActiveSteps = new Set<string>()

    // 현재 단계만 활성화
    if (nodeLabel === 'Visible Reasoner') {
      newActiveSteps.add('reasoning')
    } else if (nodeLabel === 'Visible Query Generator') {
      newActiveSteps.add('web-searching')
    } else if (nodeLabel === 'Visible URL') {
      newActiveSteps.add('reading')
    } else {
      newActiveSteps.add(nodeLabel.toLowerCase())
    }

    return newActiveSteps
  })

  // 항상 새로운 agent-flow 메시지 생성
  const agentFlowMessage: Message = {
    id: generateMessageId('agent-flow'),
    content: '',
    role: 'agent-flow',
    timestamp: new Date(),
    agentFlowData: eventData,
    eventType: context.currentEventType,
    sessionId: context.sessionId
  }

  context.setMessages(prev => [...prev, agentFlowMessage])
  console.log('🚀 NEW AGENT FLOW MESSAGE:', agentFlowMessage.id)

  setTimeout(context.scrollToBottom, 10)
  return { shouldContinue: true }
}

function handleSourceDocumentsEvent(eventData: any, context: ExtendedEventContext): EventResult {
  const sourceDocsArray = Array.isArray(eventData) ? eventData : [eventData]

  // 전역 sourceDocuments에 추가
  context.setSourceDocuments(prev => [...prev, ...sourceDocsArray])

  // 항상 새로운 source-documents 메시지 생성
  const sourceDocsMessage: Message = {
    id: generateMessageId('source-docs'),
    content: '',
    role: 'source-documents',
    timestamp: new Date(),
    sourceDocuments: sourceDocsArray,
    eventType: context.currentEventType,
    sessionId: context.sessionId
  }

  context.setMessages(prev => [...prev, sourceDocsMessage])
  console.log('📄 NEW SOURCE DOCS MESSAGE:', sourceDocsMessage.id)

  setTimeout(context.scrollToBottom, 10)
  return { shouldContinue: true }
}

function handleTokenEvent(eventData: any, context: ExtendedEventContext): EventResult {
  if (eventData && typeof eventData === 'string') {
    context.setMessages(prev => {
      // 마지막 메시지가 같은 세션의 assistant 토큰 메시지인지 확인
      const lastMessage = prev[prev.length - 1]
      const isLastTokenMessage = lastMessage &&
        lastMessage.role === 'assistant' &&
        lastMessage.sessionId === context.sessionId &&
        lastMessage.eventType === 'token'

      if (isLastTokenMessage) {
        // 마지막 토큰 메시지에 append (개행 문자 보존)
        const updatedMessages = [...prev]
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          content: lastMessage.content + eventData  // 개행 문자 그대로 보존
        }
        console.log('🔥 APPENDING TOKEN to:', lastMessage.id, 'length:', eventData.length)
        return updatedMessages
      } else {
        // 새로운 assistant 메시지는 실제 내용이 있을 때만 생성
        if (eventData.trim()) {  // 공백/개행만 있는 토큰으로는 새 메시지를 만들지 않음
          const assistantMessage: Message = {
            id: generateMessageId('assistant'),
            content: eventData,
            role: "assistant",
            timestamp: new Date(),
            isMarkdown: true,
            eventType: context.currentEventType,
            sessionId: context.sessionId
          }
          console.log('🔥 NEW ASSISTANT TOKEN MESSAGE:', assistantMessage.id, 'length:', eventData.length)
          return [...prev, assistantMessage]
        }
        // 빈 토큰은 무시
        return prev
      }
    })

    // 토큰이 추가될 때마다 스크롤
    setTimeout(context.scrollToBottom, 10)
  }
  return { shouldContinue: true }
}

function handleCitationUpdateEvent(eventData: any, context: ExtendedEventContext): EventResult {
  // citation 업데이트는 새로운 메시지로 처리
  const updatedText = eventData.updatedText
  if (updatedText) {
    const citationMessage: Message = {
      id: generateMessageId('citation'),
      content: updatedText,
      role: "assistant",
      timestamp: new Date(),
      isMarkdown: true,
      eventType: context.currentEventType,
      sessionId: context.sessionId
    }

    context.setMessages(prev => [...prev, citationMessage])
    console.log('🔄 NEW CITATION MESSAGE:', citationMessage.id)

    setTimeout(context.scrollToBottom, 10)
  }
  return { shouldContinue: true }
}

function handleResultEvent(eventData: any, context: ExtendedEventContext): EventResult {
  // 최종 결과 - 모든 단계 비활성화 및 로딩 상태 해제
  console.log('✅ RESULT: Session completed')

  // 모든 단계 비활성화
  context.setActiveSteps(new Set())
  context.setIsLoading(false)
  return { shouldContinue: true }
}

function handleErrorEvent(eventData: any, context: ExtendedEventContext): EventResult {
  throw new Error(eventData)
}


// === 유틸리티 함수들 ===
// 기존의 복잡한 순서 관리 로직들은 제거됨
// 이제 단순히 timestamp 순서대로 메시지가 추가됨


import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUp } from "lucide-react"
import { useRef } from "react"
import type { KeyboardEvent } from "react"

interface ChatInputProps {
    message: string
    setMessage: (message: string) => void
    handleSend: () => void
    isLoading: boolean
    compact?: boolean
}

export function ChatInput({ message, setMessage, handleSend, isLoading, compact = false }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== "Enter") return

        if (e.shiftKey) {
            // Manually insert a newline so Shift+Enter still works while we manage Enter presses.
            e.preventDefault()
            const textarea = textareaRef.current
            if (!textarea) return

            const selectionStart = textarea.selectionStart ?? message.length
            const selectionEnd = textarea.selectionEnd ?? message.length
            const nextValue = `${message.slice(0, selectionStart)}\n${message.slice(selectionEnd)}`

            setMessage(nextValue)

            requestAnimationFrame(() => {
                const nextCursor = selectionStart + 1
                textarea.selectionStart = nextCursor
                textarea.selectionEnd = nextCursor
            })
            return
        }

        if (e.nativeEvent.isComposing) {
            return
        }

        e.preventDefault()
        handleSend()
    }

    return (
        <div className={`bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 ${compact ? "" : "pb-20"}`}>
            <div className="max-w-4xl mx-auto">
                <div className="relative">
                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="메시지를 입력하세요..."
                        className="min-h-[120px] pr-16 resize-none border border-[#EBEFF5] shadow-[0_0_10px_rgba(21,58,212,0.08)] rounded-3xl px-7 py-6 dark:bg-[#414141] dark:border-none"
                        disabled={isLoading}
                    />
                    <div className="absolute bottom-3 right-3">
                        <Button
                            size="icon"
                            onClick={handleSend}
                            disabled={!message.trim() || isLoading}
                            className="h-10 w-10 rounded-full bg-[#005BAC] text-white hover:bg-[#004F9E]"
                        >
                            <ArrowUp className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

import { useState, useEffect } from 'react'
import { StreamingText } from "@/components/ui/streaming-text"
import { SourceChips } from "@/components/ui/source-chips"
import { TextWithSources } from "@/types/domain"

const renderBulletWithSources = (content: string | TextWithSources): TextWithSources =>
  typeof content === 'string' ? { text: content } : content

interface ObservationsListProps {
  items: (string | TextWithSources)[]
  withSources?: boolean
  className?: string
  enableStreaming?: boolean
}

export const ObservationsList = ({
  items,
  withSources = false,
  className = '',
  enableStreaming = false,
}: ObservationsListProps) => {
  const [visibleItems, setVisibleItems] = useState(0)

  useEffect(() => {
    if (!enableStreaming) {
      setVisibleItems(items.length)
      return
    }

    setVisibleItems(0)
    const timer = setInterval(() => {
      setVisibleItems(prev => {
        if (prev >= items.length) {
          clearInterval(timer)
          return prev
        }
        return prev + 1
      })
    }, 800) // 800ms delay between each item

    return () => clearInterval(timer)
  }, [items.length, enableStreaming])

  return (
    <ul className={["space-y-2 text-sm text-muted-foreground list-disc pl-5", className].filter(Boolean).join(' ')}>
      {items.slice(0, visibleItems).map((item, idx) => {
        const { text, sources } = renderBulletWithSources(item)
        const isLastVisible = idx === visibleItems - 1

        return (
          <li key={idx} className="space-y-1" data-summary-text={!withSources ? 'true' : undefined}>
            {enableStreaming ? (
              <StreamingText
                text={text}
                isActive={isLastVisible}
                speed={25}
              />
            ) : (
              <span>{text}</span>
            )}
            {withSources && <SourceChips sources={sources} className="ml-[-6px]" />}
          </li>
        )
      })}
    </ul>
  )
}


import { useState, useEffect } from 'react'
import { StreamingText } from "@/components/ui/streaming-text"

interface StreamingListProps {
  items: string[]
  className?: string
  enableStreaming?: boolean
}

export const StreamingList = ({
  items,
  className = "space-y-2 text-sm text-blue-800 list-disc pl-5",
  enableStreaming = true,
}: StreamingListProps) => {
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
    <ul className={className}>
      {items.slice(0, visibleItems).map((item, idx) => {
        const isLastVisible = idx === visibleItems - 1
        return (
          <li key={idx}>
            {enableStreaming ? (
              <StreamingText
                text={item}
                isActive={isLastVisible}
                speed={25}
              />
            ) : (
              item
            )}
          </li>
        )
      })}
    </ul>
  )
}


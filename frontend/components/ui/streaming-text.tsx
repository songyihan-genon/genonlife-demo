"use client"

import { useState, useEffect, useRef } from "react"

export const useStreamingText = (text: string, isActive: boolean = true, speed: number = 35) => {
  const [displayText, setDisplayText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isActive) {
      setDisplayText(text)
      setIsComplete(true)
      return
    }

    setDisplayText("")
    setIsComplete(false)

    if (!text) return

    let currentIndex = 0

    const typeNextChar = () => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex))
        currentIndex += 1

        if (currentIndex <= text.length) {
          timeoutRef.current = setTimeout(typeNextChar, speed)
        } else {
          setIsComplete(true)
        }
      }
    }

    timeoutRef.current = setTimeout(typeNextChar, 100)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [text, isActive, speed])

  return { displayText, isComplete }
}

export const StreamingText = ({
  text,
  isActive = true,
  speed = 35,
  className = "",
  onComplete,
}: {
  text: string
  isActive?: boolean
  speed?: number
  className?: string
  onComplete?: () => void
}) => {
  const { displayText, isComplete } = useStreamingText(text, isActive, speed)

  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete()
    }
  }, [isComplete, onComplete])

  return (
    <span className={className}>
      {displayText}
      {!isComplete && isActive && text && (
        <span className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5 animate-pulse" />
      )}
    </span>
  )
}


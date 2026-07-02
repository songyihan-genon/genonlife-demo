"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type WordItem = [string, number]

interface WordCloudCanvasProps {
  list: WordItem[]
  selectedWord?: string | null
  onWordClick?: (word: string | null) => void
  className?: string
  style?: React.CSSProperties
  seed?: number
  grayscaleOthers?: boolean
}

export default function WordCloudCanvas({
  list,
  selectedWord = null,
  onWordClick,
  className,
  style,
  seed,
  grayscaleOthers = true,
}: WordCloudCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const wordColorMapRef = useRef<Record<string, string>>({})

  // Observe container size changes for responsive re-render
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const { width, height } = entry.contentRect
        setSize({ width, height })
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Stable seeded random generator
  const randomSeed = useMemo(() => seed ?? Math.random() * 1000, [seed])
  const seededRandom = useMemo(() => {
    let value = randomSeed
    return () => {
      const x = Math.sin(value++) * 10000
      return x - Math.floor(x)
    }
  }, [randomSeed])

  // Color resolver with memoized map across renders
  const getWordColor = useMemo(() => {
    return (word: string) => {
      if (selectedWord && word === selectedWord) return "#153AD4"
      if (grayscaleOthers && selectedWord) return "#838991"

      if (!wordColorMapRef.current[word]) {
        const palette = [
          "#3A4D9B", "#3A4D9B", "#3A4D9B",
          "#0081B8", "#0081B8", "#0081B8",
          "#83AA19", "#7C4C13",
        ]
        let hash = 0
        for (let i = 0; i < word.length; i++) {
          hash = ((hash << 5) - hash) + word.charCodeAt(i)
          hash |= 0
        }
        wordColorMapRef.current[word] = palette[Math.abs(hash) % palette.length]
      }
      return wordColorMapRef.current[word]
    }
  }, [selectedWord, grayscaleOthers])

  // Render wordcloud when inputs change or size updates
  useEffect(() => {
    let cancelled = false
    const render = async () => {
      if (!canvasRef.current || !containerRef.current) return
      setLoading(true)

      const { default: WordCloud } = await import("wordcloud")
      if (cancelled) return

      const canvas = canvasRef.current
      const dpr = window.devicePixelRatio || 1
      const width = Math.floor(containerRef.current.clientWidth)
      const height = Math.floor(containerRef.current.clientHeight)

      // Configure canvas for DPR
      canvas.width = Math.max(width, 1) * dpr
      canvas.height = Math.max(height, 1) * dpr
      canvas.style.width = width + "px"
      canvas.style.height = height + "px"

      const ctx = canvas.getContext("2d")
      if (ctx) ctx.scale(dpr, dpr)

      // No work to do if size is 0
      if (width === 0 || height === 0) {
        setLoading(false)
        return
      }

      WordCloud(canvas, {
        list,
        gridSize: Math.round(8 * width / 500),
        weightFactor: (size: number) => Math.pow(size, 0.85) * width / 600,
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: getWordColor as any,
        rotateRatio: 0,
        backgroundColor: "transparent",
        shuffle: false,
        drawOutOfBound: false,
        shrinkToFit: true,
        origin: [width / 2, height / 2],
        random: seededRandom as any,
        click: (item: any) => {
          if (onWordClick) {
            if (item && item[0]) onWordClick(item[0] as string)
            else onWordClick(null)
          }
        },
        hover: (item: any) => {
          if (!canvas) return
          canvas.style.cursor = item && item[0] ? "pointer" : "default"
        },
      })

      // clear loading after a tick
      setTimeout(() => { if (!cancelled) setLoading(false) }, 300)
    }

    render()
    return () => { cancelled = true }
  }, [list, selectedWord, seededRandom, getWordColor, size.width, size.height])

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)} style={style}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full bg-transparent" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          로딩 중...
        </div>
      )}
    </div>
  )
}


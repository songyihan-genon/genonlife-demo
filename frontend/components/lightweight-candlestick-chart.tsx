"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CandlestickSeries,
  ColorType,
  IChartApi,
  ISeriesApi,
  LineSeries,
  Time,
  createChart,
} from "lightweight-charts"
import type { InflectionLine } from "@/lib/inflection"

type Candle = {
  time: string
  open: number
  high: number
  low: number
  close: number
}

type LinePoint = {
  time: string
  value: number
}

type PriceRange = {
  min: number
  max: number
}

export type ChartInflectionLine = InflectionLine

type Props = {
  data: Candle[]
  macroSeries?: LinePoint[]
  macroSeriesColor?: string
  priceRange?: PriceRange | null
  className?: string
  inflectionLines?: ChartInflectionLine[]
  chartType?: 'candle' | 'line'
}

const formatDisplayDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${month}/${day}`
}

const toCandlestickData = (source: Candle[]) =>
  source
    .filter(
      (point) =>
        typeof point.open === "number" &&
        typeof point.high === "number" &&
        typeof point.low === "number" &&
        typeof point.close === "number",
    )
    .map((point) => ({
      time: point.time as Time,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
    }))

const toLineDataFromCandle = (source: Candle[]) =>
  source
    .filter((point) => typeof point.close === "number")
    .map((point) => ({
      time: point.time as Time,
      value: point.close,
    }))

const toLineData = (source?: LinePoint[]) =>
  (source ?? [])
    .filter(
      (point) =>
        typeof point.value === "number" && point.value !== null && point.time,
    )
    .map((point) => ({
      time: point.time as Time,
      value: point.value,
    }))

export const LightweightCandlestickChart = ({
  data,
  macroSeries,
  macroSeriesColor = "#83AA19",
  priceRange,
  className,
  inflectionLines,
  chartType = 'candle',
}: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const macroSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const [linePositions, setLinePositions] = useState<
    (ChartInflectionLine & { x: number })[]
  >([])

  const candleData = useMemo(() => toCandlestickData(data), [data])
  const lineData = useMemo(() => toLineDataFromCandle(data), [data])
  const macroData = useMemo(() => toLineData(macroSeries), [macroSeries])

  const updateLinePositions = useCallback(() => {
    if (!chartRef.current || !inflectionLines?.length) {
      setLinePositions([])
      return
    }

    const timeScale = chartRef.current.timeScale()
    const mapped = inflectionLines
      .map((line) => {
        const coordinate = timeScale.timeToCoordinate(line.time as Time)
        if (coordinate === null || coordinate === undefined) {
          return null
        }
        return { ...line, x: coordinate as number }
      })
      .filter((line): line is ChartInflectionLine & { x: number } => !!line)

    setLinePositions(mapped)
  }, [inflectionLines])

  useEffect(() => {
    if (!containerRef.current) return

    const { clientWidth, clientHeight } = containerRef.current
    const chart = createChart(containerRef.current, {
      width: clientWidth,
      height: clientHeight || 320,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
        fontSize: 12,
        fontFamily: "var(--font-sans, 'Inter', sans-serif)",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.15)" },
        horzLines: { color: "rgba(148, 163, 184, 0.15)" },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        secondsVisible: false,
        timeVisible: true,
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      leftPriceScale: {
        visible: false,
        borderVisible: false,
        scaleMargins: {
          top: 0.2,
          bottom: 0.2,
        },
      },
    })

    chartRef.current = chart

    // Create series based on chartType
    if (chartType === 'candle') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#16a34a",
        downColor: "#dc2626",
        wickUpColor: "#16a34a",
        wickDownColor: "#dc2626",
        borderVisible: false,
        priceFormat: {
          type: "price",
          precision: 0,
          minMove: 1,
        },
      })
      candleSeriesRef.current = candleSeries
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#2563eb",
        lineWidth: 2,
        priceFormat: {
          type: "price",
          precision: 0,
          minMove: 1,
        },
      })
      lineSeriesRef.current = lineSeries
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (!chartRef.current || !entries.length) return
      const { width, height: nextHeight } = entries[0].contentRect
      chartRef.current.applyOptions({ width, height: nextHeight })
      chartRef.current.timeScale().fitContent()
      updateLinePositions()
    })

    resizeObserver.observe(containerRef.current)

    chart.timeScale().fitContent()

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      lineSeriesRef.current = null
      macroSeriesRef.current = null
    }
  }, [updateLinePositions, chartType])

  useEffect(() => {
    if (!chartRef.current) return
    
    // 왼쪽 축 가시성 설정
    chartRef.current.applyOptions({
      leftPriceScale: {
        visible: macroData.length > 0,
        borderVisible: false,
        scaleMargins: {
          top: 0.2,
          bottom: 0.2,
        },
      },
    })

    if (macroData.length > 0) {
      if (!macroSeriesRef.current) {
        macroSeriesRef.current = chartRef.current.addSeries(LineSeries, {
          color: macroSeriesColor,
          lineWidth: 2,
          priceScaleId: "left",
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceFormat: {
            type: "price",
            precision: 2,
            minMove: 0.01,
          },
        })
      } else {
        macroSeriesRef.current.applyOptions({ color: macroSeriesColor })
      }
      macroSeriesRef.current.setData(macroData)
      
      // 매크로 데이터가 추가되었을 때도 차트 범위를 조정
      chartRef.current.timeScale().fitContent()
    } else if (macroSeriesRef.current && chartRef.current) {
      chartRef.current.removeSeries(macroSeriesRef.current)
      macroSeriesRef.current = null
    }
  }, [macroData, macroSeriesColor])

  useEffect(() => {
    if (chartType === 'candle') {
      if (candleSeriesRef.current) {
        candleSeriesRef.current.setData(candleData)
      }
    } else {
      if (lineSeriesRef.current) {
        lineSeriesRef.current.setData(lineData)
      }
    }
    
    chartRef.current?.timeScale().fitContent()
    updateLinePositions()
  }, [candleData, lineData, updateLinePositions, chartType])

  useEffect(() => {
    const targetSeries = chartType === 'candle' ? candleSeriesRef.current : lineSeriesRef.current
    if (!targetSeries) return

    if (priceRange && Number.isFinite(priceRange.min) && Number.isFinite(priceRange.max)) {
      targetSeries.applyOptions({
        autoscaleInfoProvider: () => ({
          priceRange: {
            minValue: priceRange.min,
            maxValue: priceRange.max,
          },
        }),
      })
    } else {
      targetSeries.applyOptions({
        autoscaleInfoProvider: undefined,
      })
    }
  }, [priceRange, chartType])

  useEffect(() => {
    if (!chartRef.current) return
    const timeScale = chartRef.current.timeScale()
    const handler = () => updateLinePositions()
    timeScale.subscribeVisibleLogicalRangeChange(handler)
    return () => timeScale.unsubscribeVisibleLogicalRangeChange(handler)
  }, [updateLinePositions])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(() => {
      updateLinePositions()
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [updateLinePositions])

  const wrapperClassName = className
    ? `${className} relative`
    : "relative w-full h-full"

  return (
    <div className={wrapperClassName}>
      <div ref={containerRef} className="w-full h-full" />
      {linePositions.length > 0 && (
        <div className="pointer-events-none absolute inset-0 select-none">
          {linePositions.map((line, idx) => (
            <Fragment key={`${line.time}-${line.direction}-${idx}`}>
              <div
                className="absolute inset-y-4 flex flex-col items-center"
                style={{
                  left: `${line.x}px`,
                  transform: "translateX(-0.5px)",
                }}
              >
                <div
                  className="w-px flex-1"
                  style={{
                    background:
                      line.direction === "up"
                        ? "linear-gradient(180deg, rgba(34,197,94,0.85) 0%, rgba(34,197,94,0.2) 100%)"
                        : "linear-gradient(180deg, rgba(248,113,113,0.85) 0%, rgba(248,113,113,0.2) 100%)",
                  }}
                />
              </div>
              <div
                className="absolute text-[10px] font-semibold tracking-wide text-foreground/70"
                style={{
                  left: `${line.x}px`,
                  transform: "translateX(-50%)",
                  bottom: -10,
                }}
              >
                {formatDisplayDate(line.time)}
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}

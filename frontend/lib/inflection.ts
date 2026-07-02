import { differenceInCalendarDays } from "date-fns"

export type InflectionInputPoint = {
  date: string
  close?: number
  price?: number
}

export type InflectionLine = {
  time: string
  direction: "up" | "down"
  label?: string
}

const movingAverage = (values: number[], window: number) => {
  if (!values.length || window <= 1) return [...values]
  return values.map((_, idx) => {
    const start = Math.max(0, idx - window + 1)
    const subset = values.slice(start, idx + 1)
    const sum = subset.reduce((acc, val) => acc + val, 0)
    return sum / subset.length
  })
}

export const computeInflectionLines = (
  points: InflectionInputPoint[],
): InflectionLine[] => {
  const normalized = points
    .map((point) => {
      const close =
        typeof point.close === "number"
          ? point.close
          : typeof point.price === "number"
            ? point.price
            : null
      if (!point.date || close === null || Number.isNaN(close)) return null
      return { date: point.date, close }
    })
    .filter(
      (entry): entry is { date: string; close: number } => entry !== null,
    )
    .sort((a, b) => a.date.localeCompare(b.date))

  if (normalized.length < 5) {
    return []
  }

  const closes = normalized.map((entry) => entry.close)
  const smoothingWindow = Math.min(
    5,
    Math.max(3, Math.floor(normalized.length / 12)),
  )
  const smoothed =
    smoothingWindow > 1 ? movingAverage(closes, smoothingWindow) : closes

  const MIN_CHANGE_PCT = 0.0015
  const MIN_GAP = 3
  const LOOKBACK = 2
  const pivots: { index: number; direction: "up" | "down" }[] = []

  for (let i = 1; i < smoothed.length - 1; i += 1) {
    const prev = smoothed[i - 1]
    const curr = smoothed[i]
    const next = smoothed[i + 1]
    if (
      prev === undefined ||
      curr === undefined ||
      next === undefined ||
      !Number.isFinite(prev) ||
      !Number.isFinite(curr) ||
      !Number.isFinite(next)
    ) {
      continue
    }

    const prevDelta = curr - prev
    const nextDelta = next - curr
    const prevPct = prev !== 0 ? Math.abs(prevDelta / prev) : Math.abs(prevDelta)
    const nextPct = curr !== 0 ? Math.abs(nextDelta / curr) : Math.abs(nextDelta)

    if (Math.max(prevPct, nextPct) < MIN_CHANGE_PCT) {
      continue
    }

    let direction: "up" | "down" | null = null
    if (prevDelta <= 0 && nextDelta > 0) {
      direction = "up"
    } else if (prevDelta >= 0 && nextDelta < 0) {
      direction = "down"
    }
    if (!direction) continue

    const start = Math.max(0, i - LOOKBACK)
    const end = Math.min(normalized.length - 1, i + LOOKBACK)
    let pivotIndex = start

    for (let j = start; j <= end; j += 1) {
      const candidate = normalized[j].close
      const currentPivotValue = normalized[pivotIndex].close
      if (direction === "up") {
        if (candidate < currentPivotValue) {
          pivotIndex = j
        }
      } else if (candidate > currentPivotValue) {
        pivotIndex = j
      }
    }

    const lastPivot = pivots[pivots.length - 1]
    if (lastPivot && pivotIndex - lastPivot.index < MIN_GAP) {
      if (lastPivot.direction === direction) {
        const shouldReplace =
          (direction === "up" &&
            normalized[pivotIndex].close < normalized[lastPivot.index].close) ||
          (direction === "down" &&
            normalized[pivotIndex].close > normalized[lastPivot.index].close)
        if (shouldReplace) {
          lastPivot.index = pivotIndex
        }
      }
      continue
    }

    pivots.push({ index: pivotIndex, direction })
  }

  return pivots.map((pivot, idx) => {
    const currentDate = normalized[pivot.index].date
    let label: string | undefined
    if (idx > 0) {
      const prevDate = normalized[pivots[idx - 1].index].date
      const diffDays = Math.abs(
        differenceInCalendarDays(new Date(currentDate), new Date(prevDate)),
      )
      if (Number.isFinite(diffDays) && diffDays > 0) {
        label = `${diffDays}일`
      }
    }
    return {
      time: currentDate,
      direction: pivot.direction,
      label,
    }
  })
}

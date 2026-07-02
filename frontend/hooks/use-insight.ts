import { useState, useEffect } from 'react'

export interface RelatedCompany {
    name: string
    code: string
    impact: string
    reason: string
}

export interface Insight {
    id: string
    title: string
    summary: string
    content: string
    category: string
    tags: string[]
    generated_at: string
    read_time: string
    thumbnail?: string
    related_companies: RelatedCompany[]
}

export function useInsight() {
    const [insight, setInsight] = useState<Insight | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchInsight() {
            try {
                setIsLoading(true)
                const response = await fetch('/api/insights/latest')
                if (!response.ok) {
                    throw new Error('Failed to fetch insight')
                }
                const data = await response.json()
                setInsight(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                setIsLoading(false)
            }
        }

        fetchInsight()
    }, [])

    return { insight, isLoading, error }
}

export function useInsightHistory() {
    const [insights, setInsights] = useState<Insight[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchHistory() {
            try {
                setIsLoading(true)
                const response = await fetch('/api/insights/history')
                if (!response.ok) {
                    throw new Error('Failed to fetch insight history')
                }
                const data = await response.json()
                setInsights(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                setIsLoading(false)
            }
        }

        fetchHistory()
    }, [])

    return { insights, isLoading, error }
}

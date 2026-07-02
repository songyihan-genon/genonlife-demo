import { NextResponse } from 'next/server'
import { getResearchApiBaseUrl } from '@/lib/api-endpoints'

const API_BASE_URL = getResearchApiBaseUrl()

export async function POST() {
    try {
        const response = await fetch(`${API_BASE_URL}/insights/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Failed to generate insight:', error)
        return NextResponse.json(
            { error: 'Failed to generate insight' },
            { status: 500 }
        )
    }
}

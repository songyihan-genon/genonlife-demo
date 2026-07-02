import { NextRequest, NextResponse } from 'next/server'
import { getResearchApiBaseUrl } from '@/lib/api-endpoints'

const API_BASE_URL = getResearchApiBaseUrl()

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${API_BASE_URL}/insights/latest`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        })

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'Insight not found' }, { status: 404 })
            }
            throw new Error(`Backend responded with ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Insight API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export const dynamic = 'force-dynamic'

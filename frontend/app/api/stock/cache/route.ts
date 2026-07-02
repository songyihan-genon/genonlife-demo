import { NextRequest, NextResponse } from "next/server"
import { getRedisClient } from "@/lib/redis"

/**
 * API endpoint to clear stock history cache
 * This is useful when you want to force fresh data retrieval
 */
export async function POST(req: NextRequest) {
    try {
        const redis = getRedisClient()

        if (!redis) {
            return NextResponse.json(
                { error: "Redis is not available" },
                { status: 503 }
            )
        }

        // Get all stock history cache keys
        const keys = await redis.keys("stock:history:*")

        if (keys.length === 0) {
            return NextResponse.json({
                message: "No stock history cache found",
                deletedCount: 0
            })
        }

        // Delete all stock history cache keys
        const deletedCount = await redis.del(...keys)

        console.log(`Cleared ${deletedCount} stock history cache entries`)

        return NextResponse.json({
            message: "Stock history cache cleared successfully",
            deletedCount,
            keys
        })
    } catch (error) {
        console.error("Error clearing stock cache:", error)
        return NextResponse.json(
            { error: "Failed to clear cache" },
            { status: 500 }
        )
    }
}

export async function GET(req: NextRequest) {
    try {
        const redis = getRedisClient()

        if (!redis) {
            return NextResponse.json(
                { error: "Redis is not available" },
                { status: 503 }
            )
        }

        // Get all stock history cache keys
        const keys = await redis.keys("stock:history:*")

        return NextResponse.json({
            cacheCount: keys.length,
            keys
        })
    } catch (error) {
        console.error("Error checking stock cache:", error)
        return NextResponse.json(
            { error: "Failed to check cache" },
            { status: 500 }
        )
    }
}

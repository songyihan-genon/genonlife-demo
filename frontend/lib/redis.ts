import { Redis } from 'ioredis'

let redis: Redis | null = null

export function getRedisClient(): Redis | null {
    if (redis) {
        return redis
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0'

    try {
        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times: number) {
                const delay = Math.min(times * 50, 2000)
                return delay
            },
        })

        redis.on('error', (err: Error) => {
            console.error('Redis client error:', err)
        })

        redis.on('connect', () => {
            console.log('Redis client connected')
        })

        return redis
    } catch (error) {
        console.error('Failed to create Redis client:', error)
        return null
    }
}

export async function closeRedisClient() {
    if (redis) {
        await redis.quit()
        redis = null
    }
}

#!/usr/bin/env node

/**
 * Script to clear Redis cache for stock history data
 * This ensures fresh data is fetched and inflection points are recalculated
 */

const Redis = require('ioredis')

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/0'

async function clearStockCache() {
    const redis = new Redis(REDIS_URL)

    try {
        console.log('Connecting to Redis...')

        // Find all stock history cache keys
        const keys = await redis.keys('stock:history:*')

        if (keys.length === 0) {
            console.log('No stock history cache found.')
            return
        }

        console.log(`Found ${keys.length} cached stock history entries:`)
        keys.forEach(key => console.log(`  - ${key}`))

        // Delete all stock history cache keys
        const result = await redis.del(...keys)
        console.log(`\nSuccessfully deleted ${result} cache entries.`)
        console.log('Stock history cache has been cleared!')

    } catch (error) {
        console.error('Error clearing cache:', error)
        process.exit(1)
    } finally {
        await redis.quit()
    }
}

clearStockCache()

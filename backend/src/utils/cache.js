import Redis from 'ioredis';
import NodeCache from 'node-cache';
import logger from '../server/logger.js';

class CacheService {
    constructor() {
        this.memoryCache = new NodeCache({ stdTTL: 86400 }); // Default 24h
        this.redis = null;
        this.useRedis = false;

        if (process.env.REDIS_URL) {
            this.redis = new Redis(process.env.REDIS_URL);

            this.redis.on('connect', () => {
                this.useRedis = true;
                logger.info('Redis connected');
            });

            this.redis.on('error', (err) => {
                this.useRedis = false;
                logger.warn('Redis connection failed, falling back to memory cache', err.message);
            });
        } else {
            logger.info('No REDIS_URL found, using in-memory cache');
        }
    }

    /**
     * Get value from cache or fetch using the provided function
     * @param {string} key - Cache key
     * @param {function} fetchFn - Async function to fetch data if cache miss
     * @param {number} ttl - Time to live in seconds (default 24h)
     */
    async getOrSet(key, fetchFn, ttl = 86400) {
        // Try getting from cache
        try {
            if (this.useRedis) {
                const cached = await this.redis.get(key);
                if (cached) {
                    return JSON.parse(cached);
                }
            } else {
                const cached = this.memoryCache.get(key);
                if (cached) {
                    return cached;
                }
            }
        } catch (e) {
            logger.warn(`Cache get failed for ${key}: ${e.message}`);
        }

        // Fetch fresh data
        const data = await fetchFn();

        // Set cache
        if (data) {
            try {
                if (this.useRedis) {
                    await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
                } else {
                    this.memoryCache.set(key, data, ttl);
                }
            } catch (e) {
                logger.warn(`Cache set failed for ${key}: ${e.message}`);
            }
        }

        return data;
    }
}

export const cacheService = new CacheService();

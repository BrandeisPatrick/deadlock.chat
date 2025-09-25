/**
 * Data Cache Service
 * Centralized caching mechanism for all API responses
 */

class DataCacheService {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
    }

    /**
     * Generate cache key from URL and params
     */
    generateKey(url, params = {}) {
        const paramString = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        return `${url}${paramString ? '?' + paramString : ''}`;
    }

    /**
     * Get cached data if not expired
     */
    get(url, params = {}) {
        const key = this.generateKey(url, params);
        const cached = this.cache.get(key);
        
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > cached.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    /**
     * Set cache data with optional TTL
     */
    set(url, params, data, ttl = null) {
        const key = this.generateKey(url, params);
        this.cache.set(key, {
            data: data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL
        });
    }

    /**
     * Clear specific cache entry
     */
    clear(url, params = {}) {
        const key = this.generateKey(url, params);
        this.cache.delete(key);
    }

    /**
     * Clear all cache entries
     */
    clearAll() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const now = Date.now();
        let valid = 0;
        let expired = 0;
        
        this.cache.forEach(entry => {
            if (now - entry.timestamp > entry.ttl) {
                expired++;
            } else {
                valid++;
            }
        });
        
        return {
            total: this.cache.size,
            valid,
            expired
        };
    }

    /**
     * Clean expired entries
     */
    cleanExpired() {
        const now = Date.now();
        const keysToDelete = [];
        
        this.cache.forEach((entry, key) => {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        });
        
        keysToDelete.forEach(key => this.cache.delete(key));
        return keysToDelete.length;
    }
}

// Export singleton instance
const cacheService = new DataCacheService();

// Auto-clean expired entries every minute
setInterval(() => {
    const cleaned = cacheService.cleanExpired();
    if (cleaned > 0) {
        console.log(`[Cache] Cleaned ${cleaned} expired entries`);
    }
}, 60000);

export default cacheService;
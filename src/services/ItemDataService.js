// Item Data Service
// Handles all API calls and data fetching for items

import { API_CONFIG, buildApiUrl, buildAssetUrl } from '../config/apiConfig.js';

export class ItemDataService {
    constructor() {
        this.cache = new Map();
        this.lastRequestTime = 0;
    }

    /**
     * Rate limiting - ensure 1 second between requests
     */
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minDelay = API_CONFIG.REQUEST_DELAY;
        
        if (timeSinceLastRequest < minDelay) {
            const waitTime = minDelay - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }

    /**
     * Generic API request with caching and error handling
     */
    async makeApiRequest(url, cacheKey = null) {
        // Check cache first
        if (cacheKey && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < API_CONFIG.CACHE_DURATION) {
                return cached.data;
            }
        }

        // Rate limiting
        await this.waitForRateLimit();

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cache the result
            if (cacheKey) {
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
            }
            
            return data;
            
        } catch (error) {
            console.error(`❌ API request failed for ${url}:`, error);
            throw error;
        }
    }

    /**
     * Fetch all items from assets API
     */
    async fetchItems() {
        const url = buildAssetUrl(API_CONFIG.ENDPOINTS.ITEMS);
        console.log('📡 [Item Stats] Fetching items data...');
        
        const items = await this.makeApiRequest(url, 'items');
        console.log(`✅ [Item Stats] Fetched ${items.length} items`);
        
        return items;
    }

    /**
     * Fetch all heroes from assets API
     */
    async fetchHeroes() {
        const url = buildAssetUrl(API_CONFIG.ENDPOINTS.HEROES);
        console.log('📡 [Item Stats] Fetching heroes data...');
        
        const heroes = await this.makeApiRequest(url, 'heroes');
        console.log(`✅ [Item Stats] Fetched ${heroes.length} heroes`);
        
        return heroes;
    }

    /**
     * Fetch build statistics from analytics API
     */
    async fetchBuildStats(heroId = null) {
        const baseUrl = buildApiUrl(API_CONFIG.ENDPOINTS.BUILD_ITEM_STATS);
        const url = heroId ? `${baseUrl}?hero_id=${heroId}` : baseUrl;
        const cacheKey = heroId ? `build-stats-hero-${heroId}` : 'build-stats';
        
        console.log(`📡 [Item Stats] Fetching build statistics${heroId ? ` for hero ${heroId}` : ''}...`);
        
        const buildStats = await this.makeApiRequest(url, cacheKey);
        console.log(`✅ [Item Stats] Fetched ${buildStats.length} build statistics`);
        
        return buildStats;
    }

    /**
     * Fetch item win/loss statistics from analytics API
     */
    async fetchItemStats(heroId = null) {
        const baseUrl = buildApiUrl(API_CONFIG.ENDPOINTS.ITEM_STATS);
        const url = heroId ? `${baseUrl}?hero_id=${heroId}` : baseUrl;
        const cacheKey = heroId ? `item-stats-hero-${heroId}` : 'item-stats';
        
        console.log(`📡 [Item Stats] Fetching item win/loss statistics${heroId ? ` for hero ${heroId}` : ''}...`);
        
        const itemStats = await this.makeApiRequest(url, cacheKey);
        console.log(`✅ [Item Stats] Fetched ${itemStats.length} item win/loss statistics`);
        
        return itemStats;
    }

    /**
     * Fetch hero statistics from analytics API
     */
    async fetchHeroStats() {
        const url = buildApiUrl(API_CONFIG.ENDPOINTS.HERO_STATS);
        console.log('📡 [Item Stats] Fetching hero statistics...');
        
        const heroStats = await this.makeApiRequest(url, 'hero-stats');
        console.log(`✅ [Item Stats] Fetched ${heroStats.length} hero statistics`);
        
        return heroStats;
    }

    /**
     * Clear cache (useful for development)
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ [Item Data Service] Cache cleared');
    }
}
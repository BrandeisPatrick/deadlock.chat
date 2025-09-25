/**
 * Hero Data Service
 * Handles all hero-related API calls and data processing
 * Completely separated from UI concerns
 */

import cacheService from './data-cache-service.js';

class HeroDataService {
    constructor() {
        this.assetsUrl = 'https://assets.deadlock-api.com';
        this.analyticsUrl = 'https://api.deadlock-api.com';
        this.rateLimitDelay = 1000; // 1 second between requests
        this.lastRequestTime = 0;
    }

    /**
     * Rate limiting helper
     */
    async enforceRateLimit() {
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            const waitTime = this.rateLimitDelay - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();
    }

    /**
     * Fetch with cache and error handling
     */
    async fetchWithCache(url, params = {}, ttl = null) {
        // Check cache first
        const cached = cacheService.get(url, params);
        if (cached) {
            console.log(`[HeroDataService] Cache hit for ${url}`);
            return cached;
        }

        // Enforce rate limiting
        await this.enforceRateLimit();

        try {
            const queryString = new URLSearchParams(params).toString();
            const fullUrl = queryString ? `${url}?${queryString}` : url;
            
            const response = await fetch(fullUrl);
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            cacheService.set(url, params, data, ttl);
            return data;
        } catch (error) {
            console.error(`[HeroDataService] Error fetching ${url}:`, error);
            throw error;
        }
    }

    /**
     * Get all heroes metadata
     */
    async getAllHeroes() {
        const url = `${this.assetsUrl}/v2/heroes`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get hero by ID
     */
    async getHeroById(heroId) {
        const url = `${this.assetsUrl}/v2/heroes/${heroId}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get hero by name
     */
    async getHeroByName(name) {
        const url = `${this.assetsUrl}/v2/heroes/by-name/${name}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get hero combination statistics
     */
    async getHeroCombinationStats(params = {}) {
        const url = `${this.analyticsUrl}/v1/analytics/hero-comb-stats`;
        const defaultParams = { limit: 1000, ...params };
        
        try {
            return await this.fetchWithCache(url, defaultParams);
        } catch (error) {
            console.warn('[HeroDataService] Analytics API failed, returning empty array');
            return [];
        }
    }

    /**
     * Get hero analytics with filters
     */
    async getHeroAnalytics(params = {}) {
        const url = `${this.analyticsUrl}/v1/analytics/hero-stats`;
        
        try {
            return await this.fetchWithCache(url, params);
        } catch (error) {
            console.warn('[HeroDataService] Hero analytics failed, returning empty array');
            return [];
        }
    }

    /**
     * Get hero scoreboard/leaderboard
     */
    async getHeroScoreboard(sortBy = 'winrate', params = {}) {
        const url = `${this.analyticsUrl}/v1/analytics/scoreboards/heroes`;
        const fullParams = { sort_by: sortBy, ...params };
        
        try {
            return await this.fetchWithCache(url, fullParams);
        } catch (error) {
            console.warn('[HeroDataService] Hero scoreboard failed, returning empty array');
            return [];
        }
    }

    /**
     * Process raw hero data with statistics
     * This is pure data processing, no UI concerns
     */
    async getProcessedHeroStats() {
        try {
            // Fetch heroes and analytics in parallel
            const [heroes, analyticsData] = await Promise.all([
                this.getAllHeroes(),
                this.getHeroCombinationStats()
            ]);

            // Aggregate individual hero stats from team combinations
            const heroStatsMap = this.aggregateHeroStats(analyticsData);
            
            // Calculate total matches for pick rate
            const totalMatches = this.calculateTotalMatches(heroStatsMap);
            
            // Process and combine hero data with statistics
            const processedHeroes = heroes.map(hero => {
                const stats = heroStatsMap[hero.id];
                return this.processHeroData(hero, stats, totalMatches);
            });

            return {
                heroes: processedHeroes,
                totalMatches: totalMatches,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('[HeroDataService] Error processing hero stats:', error);
            throw error;
        }
    }

    /**
     * Aggregate hero stats from combination data
     */
    aggregateHeroStats(analyticsData) {
        const heroStatsMap = {};
        
        analyticsData.forEach(record => {
            if (record.hero_ids && Array.isArray(record.hero_ids)) {
                record.hero_ids.forEach(heroId => {
                    if (!heroStatsMap[heroId]) {
                        heroStatsMap[heroId] = {
                            wins: 0,
                            losses: 0,
                            matches: 0
                        };
                    }
                    heroStatsMap[heroId].wins += record.wins || 0;
                    heroStatsMap[heroId].losses += record.losses || 0;
                    heroStatsMap[heroId].matches += record.matches || 0;
                });
            }
        });
        
        return heroStatsMap;
    }

    /**
     * Calculate total matches from hero stats
     */
    calculateTotalMatches(heroStatsMap) {
        const totalMatches = Object.values(heroStatsMap)
            .reduce((sum, stat) => sum + stat.matches, 0) / 6;
        return Math.floor(totalMatches);
    }

    /**
     * Process individual hero data
     */
    processHeroData(hero, stats, totalMatches) {
        if (stats && stats.matches > 0) {
            const winRate = (stats.wins / stats.matches) * 100;
            const pickRate = totalMatches > 0 ? (stats.matches / (totalMatches * 6)) * 100 : 0;
            
            return {
                id: hero.id,
                name: hero.name || 'Unknown',
                className: hero.class_name,
                description: hero.description,
                images: hero.images,
                winRate: Math.round(winRate * 10) / 10,
                pickRate: Math.round(pickRate * 10) / 10,
                matches: stats.matches,
                wins: stats.wins,
                losses: stats.losses,
                kda: this.estimateKDA(winRate),
                tier: this.calculateTier(winRate, pickRate)
            };
        } else {
            // Return hero with zero stats
            return {
                id: hero.id,
                name: hero.name || 'Unknown',
                className: hero.class_name,
                description: hero.description,
                images: hero.images,
                winRate: 0,
                pickRate: 0,
                matches: 0,
                wins: 0,
                losses: 0,
                kda: { kills: 0, deaths: 0, assists: 0, ratio: 0 },
                tier: 'N/A'
            };
        }
    }

    /**
     * Estimate KDA based on win rate
     */
    estimateKDA(winRate) {
        const baseKDA = 2.0;
        const kdaVariance = (winRate - 50) / 25;
        const estimatedKDA = Math.max(0.5, baseKDA + kdaVariance);
        
        // Generate realistic K/D/A values
        const deaths = 5 + Math.random() * 3;
        const kills = deaths * (estimatedKDA * 0.6);
        const assists = deaths * (estimatedKDA * 0.4);
        
        return {
            kills: Math.round(kills),
            deaths: Math.round(deaths),
            assists: Math.round(assists),
            ratio: Math.round(estimatedKDA * 100) / 100
        };
    }

    /**
     * Calculate tier based on performance
     */
    calculateTier(winRate, pickRate) {
        if (winRate >= 55 && pickRate >= 2.0) return 'S';
        if (winRate >= 52 && pickRate >= 1.5) return 'A';
        if (winRate >= 48 && pickRate >= 1.0) return 'B';
        if (winRate >= 45) return 'C';
        return 'D';
    }

    /**
     * Get hero counter statistics
     */
    async getHeroCounterStats(params = {}) {
        const url = `${this.analyticsUrl}/v1/analytics/hero-counter-stats`;
        
        try {
            return await this.fetchWithCache(url, params);
        } catch (error) {
            console.warn('[HeroDataService] Counter stats failed, returning empty array');
            return [];
        }
    }

    /**
     * Get hero synergy statistics
     */
    async getHeroSynergyStats(params = {}) {
        const url = `${this.analyticsUrl}/v1/analytics/hero-synergy-stats`;
        
        try {
            return await this.fetchWithCache(url, params);
        } catch (error) {
            console.warn('[HeroDataService] Synergy stats failed, returning empty array');
            return [];
        }
    }

    /**
     * Generate placeholder data for local development
     */
    generatePlaceholderData(heroes) {
        return heroes.map(hero => {
            const baseWinRate = 45 + Math.random() * 15;
            const baseMatches = Math.floor(1000 + Math.random() * 9000);
            const winRate = Math.round(baseWinRate * 10) / 10;
            const pickRate = Math.round((baseMatches / 150000) * 100 * 10) / 10;
            
            return {
                id: hero.id,
                name: hero.name || 'Unknown',
                className: hero.class_name,
                description: hero.description,
                images: hero.images,
                winRate: winRate,
                pickRate: pickRate,
                matches: baseMatches,
                wins: Math.floor(baseMatches * (winRate / 100)),
                losses: Math.floor(baseMatches * ((100 - winRate) / 100)),
                kda: this.estimateKDA(winRate),
                tier: this.calculateTier(winRate, pickRate)
            };
        });
    }

    /**
     * Clear hero-related cache
     */
    clearCache() {
        // Clear specific hero-related cache entries
        cacheService.clearAll(); // For now, clear all. Could be more selective.
    }
}

// Export singleton instance
const heroDataService = new HeroDataService();
export default heroDataService;
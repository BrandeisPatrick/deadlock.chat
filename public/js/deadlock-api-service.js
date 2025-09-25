/**
 * DeadlockAPIService - Enhanced API service using official Deadlock API endpoints
 * Provides comprehensive access to match data, player profiles, leaderboards, and assets
 */

// Note: Hero mappings and bigint utils are loaded globally via window object

class DeadlockAPIService {
    constructor() {
        // Check if running locally or on Vercel
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocal) {
            // For local development, use the direct API endpoint
            this.baseUrl = 'https://api.deadlock-api.com/v1';
        } else {
            // For production (Vercel), use the proxy endpoints
            this.baseUrl = '/api';
        }
        
        this.assetsUrl = 'https://assets.deadlock-api.com';
        this.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.rateLimitDelay = 1000; // 1 second between requests
        this.lastRequestTime = 0;
        
    }

    /**
     * Generic fetch wrapper with error handling and caching
     */
    async fetchWithCache(url, options = {}) {
        
        const cacheKey = url;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        // Rate limiting
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            const waitTime = this.rateLimitDelay - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();

        try {
            // Direct API call - no CORS proxy needed!
            // The API has proper CORS headers (Access-Control-Allow-Origin: *)
            const response = await fetch(url, {
                ...options,
                headers: this.headers
            });


            if (!response.ok) {
                // Check for rate limit error
                if (response.status === 429) {
                    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
                }
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Cache successful responses
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get detailed match information including all player stats
     * @param {string} matchId - The match ID
     * @returns {Promise<Object>} Complete match details
     */
    async getMatchDetails(matchId) {
        // Use the metadata endpoint which is actually available
        const url = `${this.baseUrl}/matches/${matchId}/metadata`;
        const data = await this.fetchWithCache(url);
        
        // Transform match data to include additional calculated stats
        if (data && data.match_info && data.match_info.players) {
            data.match_info.players = data.match_info.players.map(player => ({
                ...player,
                kda: this.calculateKDA(player.kills, player.deaths, player.assists),
                damagePerMinute: this.calculatePerMinute(player.player_damage, data.match_info.duration_s),
                healingPerMinute: this.calculatePerMinute(player.healing_output, data.match_info.duration_s),
                netWorthPerMinute: this.calculatePerMinute(player.net_worth, data.match_info.duration_s)
            }));
        }
        
        return data;
    }

    /**
     * Get comprehensive player profile with statistics
     * @param {string} playerId - The player's Steam ID
     * @returns {Promise<Object>} Player profile data
     */
    async getPlayerProfile(playerId) {
        const url = `${this.baseUrl}/players/${playerId}`;
        const profileData = await this.fetchWithCache(url);

        // Try to enrich the profile with the Steam display name
        try {
            const steamData = await this.getSteamUsers([playerId]);
            const players = steamData?.response?.players;
            if (players && players.length > 0) {
                profileData.displayName = players[0].personaname;
                profileData.personaname = players[0].personaname;
            }
        } catch (err) {
            console.warn('Failed to fetch Steam display name', err);
        }

        return profileData;
    }

    /**
     * Get player match history with pagination
     * @param {string} playerId - The player's Steam ID
     * @param {number} limit - Number of matches to fetch (default: 50)
     * @param {number} offset - Offset for pagination (default: 0)
     * @param {boolean} onlyStoredHistory - Use ClickHouse stored data to bypass rate limits (default: true)
     * @returns {Promise<Object>} Player match history
     */
    async getPlayerMatchHistory(playerId, limit = 50, offset = 0, onlyStoredHistory = true) {
        let url = `${this.baseUrl}/players/${playerId}/match-history?limit=${limit}&offset=${offset}`;
        
        // Add only_stored_history parameter to bypass rate limiting
        if (onlyStoredHistory) {
            url += '&only_stored_history=true';
        }
        
        const data = await this.fetchWithCache(url);
        
        // Handle both array and object response formats
        const matches = Array.isArray(data) ? data : (data.matches || []);
        
        // Calculate additional statistics
        if (matches.length > 0) {
            const stats = this.calculatePlayerStats(matches);
            
            // Return consistent format
            return {
                matches: matches,
                statistics: stats,
                totalMatches: matches.length,
                matchesAnalyzed: Math.min(matches.length, limit)
            };
        }
        
        return data;
    }

    /**
     * Fetch Steam profile names for players
     */
    async fetchSteamNames(players) {
        const playersWithNames = [];
        
        // Always fetch Steam names for match analysis
        console.log('🔍 [Steam Names] Fetching Steam usernames for', players.length, 'players');
        
        for (const player of players) {
            const playerCopy = { ...player };
            
            try {
                // Convert 32-bit account ID to 64-bit Steam ID with BigInt fallback
                const steamId64 = window.accountIdToSteamId64(player.accountId);
                console.log(`🔍 [Steam Names] Converting account ID ${player.accountId} to Steam ID ${steamId64}`);
                
                // Use Vercel serverless function
                const response = await fetch(`/api/steam-user?steamids=${steamId64}`);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.response && data.response.players && data.response.players.length > 0) {
                        const steamPlayer = data.response.players[0];
                        playerCopy.displayName = steamPlayer.personaname;
                        playerCopy.steamName = steamPlayer.personaname;
                        playerCopy.steamAvatarUrl = steamPlayer.avatarfull || steamPlayer.avatarmedium;
                        console.log(`✅ [Steam Names] Found username: ${steamPlayer.personaname} for account ID ${player.accountId}`);
                    } else {
                        console.warn(`⚠️ [Steam Names] No Steam player data found for account ID ${player.accountId}`);
                        playerCopy.displayName = `Player ${player.accountId}`;
                        playerCopy.steamName = `Player ${player.accountId}`;
                    }
                } else {
                    console.error(`❌ [Steam Names] Steam API request failed with status ${response.status} for account ID ${player.accountId}`);
                    playerCopy.displayName = `Player ${player.accountId}`;
                    playerCopy.steamName = `Player ${player.accountId}`;
                }
            } catch (error) {
                console.error(`❌ [Steam Names] Error fetching Steam name for account ID ${player.accountId}:`, error);
                playerCopy.displayName = `Player ${player.accountId}`;
                playerCopy.steamName = `Player ${player.accountId}`;
            }
            
            playersWithNames.push(playerCopy);
            
            // Small delay to be respectful to the Steam API
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        return playersWithNames;
    }

    /**
     * Get match metadata including all player information
     * @param {string} matchId - The match ID
     * @returns {Promise<Object>} Match metadata with player details
     */
    async getMatchMetadata(matchId) {
        const url = `${this.baseUrl}/matches/${matchId}/metadata`;
        const data = await this.fetchWithCache(url);
        
        if (data && data.match_info && data.match_info.players) {
            // Extract player IDs and basic info
            const players = data.match_info.players.map((player, index) => {
                // More robust stats extraction
                const finalStats = player.stats && player.stats.length > 0 
                    ? player.stats[player.stats.length - 1] 
                    : player; // Fallback to player object itself if no stats array
                
                const playerData = {
                    accountId: player.account_id,
                    playerSlot: player.player_slot,
                    team: player.player_slot <= 6 ? 0 : 1, // Fix: API uses 1-12, so slots 1-6 = team 0, slots 7-12 = team 1
                    heroId: player.hero_id,
                    kills: finalStats.kills || player.kills || 0,
                    deaths: finalStats.deaths || player.deaths || 0,
                    assists: finalStats.assists || player.assists || 0,
                    netWorth: finalStats.net_worth || player.net_worth || 0,
                    lastHits: finalStats.creep_kills || player.last_hits || 0,
                    denies: finalStats.denies || player.denies || 0,
                    heroLevel: finalStats.level || player.level || 0,
                    // Add player damage and healing
                    playerDamage: finalStats.player_damage || player.player_damage || 0,
                    healingOutput: finalStats.healing_output || player.healing_output || 0,
                    // Add player name if available
                    playerName: player.player_name || player.name || null
                };
                return playerData;
            });
            
            data.playersSummary = players;
            
            // Fetch Steam names for all players
            data.playersSummary = await this.fetchSteamNames(players);
            
        }
        
        return data;
    }

    /**
     * Get leaderboard data
     * @param {string} region - Region code (optional)
     * @param {number} limit - Number of entries (default: 100)
     * @returns {Promise<Object>} Leaderboard data
     */
    async getLeaderboard(region = null, limit = 100) {
        let url = `${this.baseUrl}/leaderboard?limit=${limit}`;
        if (region) {
            url += `&region=${region}`;
        }
        return await this.fetchWithCache(url);
    }

    /**
     * Get statistics for all players in a match
     * @param {string} matchId - The match ID
     * @param {number} matchHistoryLimit - Number of past matches to analyze per player (default: 50)
     * @returns {Promise<Object>} All players' statistics from the match
     */
    async getAllPlayersFromMatch(matchId, matchHistoryLimit = 50) {
        try {
            // First get match metadata to get all player IDs
            const matchData = await this.getMatchMetadata(matchId);
            
            if (!matchData || !matchData.playersSummary) {
                throw new Error('Could not retrieve match data');
            }
            
            const players = matchData.playersSummary;
            
            const allPlayerStats = [];
            
            // Fetch stats for each player with minimal delay
            for (let i = 0; i < players.length; i++) {
                const player = players[i];
                
                try {
                    const playerStats = await this.getPlayerMatchHistory(
                        player.accountId, 
                        matchHistoryLimit, 
                        0, 
                        true // Use only_stored_history to bypass rate limits
                    );
                    
                    allPlayerStats.push({
                        ...player,
                        statistics: playerStats.statistics,
                        totalGames: playerStats.totalMatches
                    });
                    
                    // Small delay to be polite to the server
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    allPlayerStats.push({
                        ...player,
                        error: error.message
                    });
                }
            }
            
            const result = {
                matchId,
                matchInfo: matchData.match_info,
                players: allPlayerStats,
                teams: {
                    team0: allPlayerStats.filter(p => p.team === 0),
                    team1: allPlayerStats.filter(p => p.team === 1)
                }
            };
            
            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get hero/build information
     * @param {string} heroId - The hero ID
     * @returns {Promise<Object>} Hero build data
     */
    async getHeroBuild(heroId) {
        const url = `${this.baseUrl}/builds/${heroId}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get ranks/badge tiers information
     * @returns {Promise<Array>} Array of rank tiers with images and colors
     */
    async getRanks() {
        const url = `${this.assetsUrl}/v2/ranks`;
        return await this.fetchWithCache(url);
    }

    /**
     * Convert rank name to badge level for API filtering
     * @param {number} tier - Rank tier (0-11)
     * @param {number} subRank - Sub-rank within tier (1-6)
     * @returns {number} Badge level (0-116)
     */
    rankToBadgeLevel(tier, subRank) {
        return tier * 6 + (subRank - 1);
    }

    /**
     * Get hero statistics with optional filtering
     * @param {Object} params - Filter parameters
     * @returns {Promise<Array>} Hero statistics data
     */
    async getHeroAnalytics(params = {}) {
        let url = `${this.baseUrl}/analytics/hero-stats`;
        const queryParams = new URLSearchParams();
        
        if (params.minTimestamp) queryParams.append('min_unix_timestamp', params.minTimestamp);
        if (params.maxTimestamp) queryParams.append('max_unix_timestamp', params.maxTimestamp);
        if (params.minBadge) queryParams.append('min_average_badge', params.minBadge);
        if (params.maxBadge) queryParams.append('max_average_badge', params.maxBadge);
        if (params.minDuration) queryParams.append('min_duration_s', params.minDuration);
        if (params.maxDuration) queryParams.append('max_duration_s', params.maxDuration);
        
        if (queryParams.toString()) url += `?${queryParams.toString()}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get hero scoreboard/leaderboard
     * @param {string} sortBy - Metric to sort by (winrate, avg_kills_per_match, etc.)
     * @param {Object} params - Additional filter parameters
     * @returns {Promise<Array>} Hero scoreboard data
     */
    async getHeroScoreboard(sortBy = 'winrate', params = {}) {
        let url = `${this.baseUrl}/analytics/scoreboards/heroes?sort_by=${sortBy}`;
        
        if (params.order) url += `&order=${params.order}`;
        if (params.minMatches) url += `&min_matches=${params.minMatches}`;
        if (params.minTimestamp) url += `&min_unix_timestamp=${params.minTimestamp}`;
        if (params.maxTimestamp) url += `&max_unix_timestamp=${params.maxTimestamp}`;
        if (params.minBadge) url += `&min_average_badge=${params.minBadge}`;
        if (params.maxBadge) url += `&max_average_badge=${params.maxBadge}`;
        
        return await this.fetchWithCache(url);
    }

    /**
     * Get player scoreboard/leaderboard
     * @param {string} sortBy - Metric to sort by
     * @param {Object} params - Additional filter parameters
     * @returns {Promise<Array>} Player scoreboard data
     */
    async getPlayerScoreboard(sortBy = 'winrate', params = {}) {
        let url = `${this.baseUrl}/analytics/scoreboards/players?sort_by=${sortBy}`;
        
        if (params.order) url += `&order=${params.order}`;
        if (params.minMatches) url += `&min_matches=${params.minMatches}`;
        if (params.minTimestamp) url += `&min_unix_timestamp=${params.minTimestamp}`;
        if (params.maxTimestamp) url += `&max_unix_timestamp=${params.maxTimestamp}`;
        if (params.minBadge) url += `&min_average_badge=${params.minBadge}`;
        if (params.maxBadge) url += `&max_average_badge=${params.maxBadge}`;
        
        return await this.fetchWithCache(url);
    }

    /**
     * Get hero vs hero counter statistics
     * @param {Object} params - Filter parameters
     * @returns {Promise<Array>} Hero counter matchup data
     */
    async getHeroCounterStats(params = {}) {
        let url = `${this.baseUrl}/analytics/hero-counter-stats`;
        const queryParams = new URLSearchParams();
        
        if (params.minTimestamp) queryParams.append('min_unix_timestamp', params.minTimestamp);
        if (params.maxTimestamp) queryParams.append('max_unix_timestamp', params.maxTimestamp);
        if (params.minBadge) queryParams.append('min_average_badge', params.minBadge);
        if (params.maxBadge) queryParams.append('max_average_badge', params.maxBadge);
        
        if (queryParams.toString()) url += `?${queryParams.toString()}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get hero combination/synergy statistics
     * @param {Object} params - Filter parameters including combination size
     * @returns {Promise<Array>} Hero combination statistics
     */
    async getHeroCombinationStats(params = {}) {
        let url = `${this.baseUrl}/analytics/hero-comb-stats`;
        const queryParams = new URLSearchParams();
        
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.minTimestamp) queryParams.append('min_unix_timestamp', params.minTimestamp);
        if (params.maxTimestamp) queryParams.append('max_unix_timestamp', params.maxTimestamp);
        if (params.minBadge) queryParams.append('min_average_badge', params.minBadge);
        if (params.maxBadge) queryParams.append('max_average_badge', params.maxBadge);
        if (params.combinationSize) queryParams.append('combination_size', params.combinationSize);
        if (params.includeHeroes) queryParams.append('include_heroes', params.includeHeroes.join(','));
        if (params.excludeHeroes) queryParams.append('exclude_heroes', params.excludeHeroes.join(','));
        
        if (queryParams.toString()) url += `?${queryParams.toString()}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get hero synergy statistics (pair analysis)
     * @param {Object} params - Filter parameters
     * @returns {Promise<Array>} Hero synergy data
     */
    async getHeroSynergyStats(params = {}) {
        let url = `${this.baseUrl}/analytics/hero-synergy-stats`;
        const queryParams = new URLSearchParams();
        
        if (params.minTimestamp) queryParams.append('min_unix_timestamp', params.minTimestamp);
        if (params.maxTimestamp) queryParams.append('max_unix_timestamp', params.maxTimestamp);
        if (params.minBadge) queryParams.append('min_average_badge', params.minBadge);
        if (params.maxBadge) queryParams.append('max_average_badge', params.maxBadge);
        
        if (queryParams.toString()) url += `?${queryParams.toString()}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get ability order statistics for builds
     * @param {Object} params - Filter parameters
     * @returns {Promise<Array>} Ability order statistics
     */
    async getAbilityOrderStats(params = {}) {
        let url = `${this.baseUrl}/analytics/ability-order-stats`;
        const queryParams = new URLSearchParams();
        
        if (params.heroId) queryParams.append('hero_id', params.heroId);
        if (params.minTimestamp) queryParams.append('min_unix_timestamp', params.minTimestamp);
        if (params.maxTimestamp) queryParams.append('max_unix_timestamp', params.maxTimestamp);
        if (params.minBadge) queryParams.append('min_average_badge', params.minBadge);
        if (params.maxBadge) queryParams.append('max_average_badge', params.maxBadge);
        
        if (queryParams.toString()) url += `?${queryParams.toString()}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get build item statistics
     * @param {Object} params - Filter parameters
     * @returns {Promise<Array>} Build item statistics
     */
    async getBuildItemStats(params = {}) {
        let url = `${this.baseUrl}/analytics/build-item-stats`;
        const queryParams = new URLSearchParams();
        
        if (params.limit) queryParams.append('limit', params.limit || 100);
        if (params.heroId) queryParams.append('hero_id', params.heroId);
        if (params.minTimestamp) queryParams.append('min_unix_timestamp', params.minTimestamp);
        if (params.maxTimestamp) queryParams.append('max_unix_timestamp', params.maxTimestamp);
        if (params.minBadge) queryParams.append('min_average_badge', params.minBadge);
        if (params.maxBadge) queryParams.append('max_average_badge', params.maxBadge);
        
        if (queryParams.toString()) url += `?${queryParams.toString()}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get items by type (ability/weapon/upgrade)
     * @param {string} type - Item type
     * @returns {Promise<Array>} Items of specified type
     */
    async getItemsByType(type) {
        const url = `${this.assetsUrl}/v2/items/by-type/${type}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get items by hero ID
     * @param {number} heroId - Hero ID
     * @returns {Promise<Array>} Items used by the hero
     */
    async getItemsByHeroId(heroId) {
        const url = `${this.assetsUrl}/v2/items/by-hero-id/${heroId}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get single hero by ID
     * @param {number} heroId - Hero ID
     * @returns {Promise<Object>} Hero data
     */
    async getHeroById(heroId) {
        const url = `${this.assetsUrl}/v2/heroes/${heroId}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get hero by name
     * @param {string} name - Hero name
     * @returns {Promise<Object>} Hero data
     */
    async getHeroByName(name) {
        const url = `${this.assetsUrl}/v2/heroes/by-name/${name}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get all items data
     * @returns {Promise<Array>} Array of all items
     */
    async getAllItems() {
        const url = `${this.assetsUrl}/v2/items`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get single item by ID or class name
     * @param {string|number} idOrClassName - Item ID or class name
     * @returns {Promise<Object>} Item data
     */
    async getItem(idOrClassName) {
        const url = `${this.assetsUrl}/v2/items/${idOrClassName}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get build tags
     * @returns {Promise<Array>} Build tags data
     */
    async getBuildTags() {
        const url = `${this.assetsUrl}/v2/build-tags`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get client versions
     * @returns {Promise<Array>} Client version numbers
     */
    async getClientVersions() {
        const url = `${this.assetsUrl}/v2/client-versions`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get map data
     * @returns {Promise<Object>} Map details including radius and objectives
     */
    async getMapData() {
        const url = `${this.assetsUrl}/v1/map`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get color definitions
     * @returns {Promise<Object>} Color definitions used in game UI
     */
    async getColors() {
        const url = `${this.assetsUrl}/v1/colors`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get icon assets
     * @returns {Promise<Object>} Dictionary of icon assets
     */
    async getIcons() {
        const url = `${this.assetsUrl}/v1/icons`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get sound assets
     * @returns {Promise<Object>} Dictionary of sound assets
     */
    async getSounds() {
        const url = `${this.assetsUrl}/v1/sounds`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get analytics data - DEPRECATED: Use specific analytics endpoints instead
     * @param {Object} params - Query parameters for analytics
     * @returns {Promise<Object>} Analytics data
     */
    async getAnalytics(params = {}) {
        console.warn('getAnalytics is deprecated, use specific endpoints like getBuildItemStats or getHeroCombinationStats');
        throw new Error('Analytics endpoint not available - use specific analytics endpoints instead');
    }

    async getPatches() {
        const url = `https://api.deadlock-api.com/v1/patches`;
        return await this.fetchWithCache(url);
    }

    async getItemStats(patch) {
        // Use the working build-item-stats endpoint
        const url = `https://api.deadlock-api.com/v1/analytics/build-item-stats?limit=100`;
        return await this.fetchWithCache(url);
    }

    async getHeroStats(patch) {
        // Use the working hero-comb-stats endpoint and filter for single heroes
        const url = `https://api.deadlock-api.com/v1/analytics/hero-comb-stats?limit=1000`;
        const data = await this.fetchWithCache(url);
        // Filter for single hero stats (where hero_ids.length === 1)
        return data.filter(stat => stat.hero_ids && stat.hero_ids.length === 1);
    }

    /**
     * Get Steam user info from our serverless function
     * @param {string[]} steamIds - Array of Steam IDs
     * @returns {Promise<Object>} Steam user data
     */
    async getSteamUsers(steamIds) {
        // Check if running locally - disable Steam API for local development
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocal) {
            return null;
        }
        
        // Use the serverless function to bypass CORS and hide API key
        const url = `/api/steam-user?steamids=${steamIds.join(',')}`;
        
        // This endpoint is not cached as it's a proxy
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Steam user API failed: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch Steam user data:", error);
            return null;
        }
    }

    /**
     * Get all hero data and cache it.
     * @returns {Promise<Object[]>} Array of hero data objects.
     */
    async getAllHeroes() {
        const url = `${this.assetsUrl}/v2/heroes`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get hero asset URL by hero ID
     * @param {number} heroId - The hero ID
     * @returns {Promise<string>} Asset URL for the hero's card image.
     */
    async getHeroCardAssetUrlById(heroId) {
        const heroClassName = window.getHeroClassName(heroId);
        if (!heroClassName) {
            console.warn(`Unknown hero ID: ${heroId}`);
            return null;
        }
        return await this.getHeroCardAssetUrl(heroClassName);
    }

    /**
     * Get hero asset URL by class name
     * @param {string} heroClassName - The hero's class name (e.g., 'hero_atlas' for Abrams)
     * @returns {Promise<string>} Asset URL for the hero's card image.
     */
    async getHeroCardAssetUrl(heroClassName) {
        try {
            const allHeroes = await this.getAllHeroes();
            const hero = allHeroes.find(h => h.class_name === heroClassName);
            
            if (hero && hero.images && hero.images.icon_hero_card) {
                return hero.images.icon_hero_card;
            }
            
            // Try alternative image properties if main one doesn't exist
            if (hero && hero.images) {
                const alternativeImages = [
                    hero.images.card,
                    hero.images.portrait,
                    hero.images.icon,
                    hero.images.thumbnail
                ];
                
                for (const imgUrl of alternativeImages) {
                    if (imgUrl) return imgUrl;
                }
            }
            
            // Extract slug from class name for fallback URL
            const slug = heroClassName.replace('hero_', '');
            return `${this.assetsUrl}/heroes/${slug}/card.png`;
            
        } catch (error) {
            console.warn(`Error fetching hero asset for ${heroClassName}:`, error);
            // Extract slug from class name for fallback URL
            const slug = heroClassName.replace('hero_', '');
            return `${this.assetsUrl}/heroes/${slug}/card.png`;
        }
    }

    /**
     * Get hero thumbnail URL with fallback strategy
     * Uses local hero thumbnails due to persistent API issues
     * @param {number} heroId - The hero ID
     * @returns {Promise<string|null>} - Image URL or null for text fallback
     */
    async getHeroThumbnailUrl(heroId) {
        // Skip API calls entirely due to persistent CORS issues
        // Use local thumbnails directly for better performance
        return this.getLocalHeroThumbnailUrl(heroId);
    }

    /**
     * Get hero minimap image URL from API (most reliable method)
     * @param {number} heroId - The hero ID
     * @returns {Promise<string|null>} - Image URL or null if not found
     */
    async getHeroMinimapImageUrl(heroId) {
        try {
            const allHeroes = await this.getAllHeroes();
            const hero = allHeroes.find(h => h.id === heroId);
            
            if (hero && hero.images) {
                // Use minimap image (webp preferred)
                if (hero.images.minimap_image_webp) {
                    return hero.images.minimap_image_webp;
                }
                if (hero.images.minimap_image) {
                    return hero.images.minimap_image;
                }
                // Fallback to small icon
                if (hero.images.icon_image_small_webp) {
                    return hero.images.icon_image_small_webp;
                }
                if (hero.images.icon_image_small) {
                    return hero.images.icon_image_small;
                }
            }
            
            return null;
        } catch (error) {
            console.warn(`Error fetching hero minimap image for ID ${heroId}:`, error);
            return this.getLocalHeroThumbnailUrl(heroId);
        }
    }

    /**
     * Get local hero thumbnail URL by hero ID (fallback method)
     * @param {number} heroId - The hero ID to get thumbnail for
     * @returns {string|null} - Local thumbnail URL or null if not found
     */
    getLocalHeroThumbnailUrl(heroId) {
        const heroClassName = window.getHeroClassName(heroId);
        const heroName = window.getHeroName(heroId);
        
        console.log(`🖼️ [Hero Image] Getting thumbnail for Hero ID ${heroId} (${heroName})`);
        console.log(`🖼️ [Hero Image] Class name: ${heroClassName}`);
        
        if (!heroClassName) {
            console.warn(`⚠️ [Hero Image] No class name found for hero ID ${heroId}`);
            return null;
        }
        
        // Use Deadlock API CDN for hero images with correct format
        const heroSlug = heroClassName.replace('hero_', '');
        const imageUrl = `https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/${heroSlug}_mm.webp`;
        
        console.log(`🖼️ [Hero Image] Generated URL: ${imageUrl}`);
        return imageUrl;
    }

    /**
     * Get hero asset URL by class name
     * @param {string} heroClassName - The hero's class name (e.g., 'hero_atlas' for Abrams)
     * @returns {Promise<string>} Asset URL for the hero's card image.
     */
    async getHeroCardAssetUrl(heroClassName) {
        try {
            const allHeroes = await this.getAllHeroes();
            const hero = allHeroes.find(h => h.class_name.toLowerCase() === heroClassName.toLowerCase()); // Case-insensitive comparison
            
            let imageUrl = null;

            if (hero && hero.images) {
                if (hero.images.icon_hero_card) {
                    imageUrl = hero.images.icon_hero_card;
                } else {
                    const alternativeImages = [
                        hero.images.card,
                        hero.images.portrait,
                        hero.images.icon,
                        hero.images.thumbnail
                    ];
                    
                    for (const imgUrl of alternativeImages) {
                        if (imgUrl) {
                            imageUrl = imgUrl;
                            break;
                        }
                    }
                }
            }
            
            // Fallback to constructed URL if no image found in API response
            if (!imageUrl) {
                const slug = heroClassName.replace('hero_', '');
                imageUrl = `${this.assetsUrl}/heroes/${slug}/card.png`;
            }
            
            return imageUrl;
            
        } catch (error) {
            console.warn(`Error fetching hero asset for ${heroClassName}:`, error);
            // Extract slug from class name for fallback URL
            const slug = heroClassName.replace('hero_', '');
            const fallbackUrl = `${this.assetsUrl}/heroes/${slug}/card.png`;
            return fallbackUrl;
        }
    }

    /**
     * Get item asset URL
     * @param {number|string} itemId - Item ID or name
     * @param {string} category - Item category (weapon, vitality, spirit)
     * @returns {string} Asset URL
     */
    getItemAssetUrl(itemId, category = 'vitality') {
        // Map of item IDs to their actual names for the asset URLs
        const itemNameMap = {
            // Weapon items
            2163598980: 'high_velocity_mag',
            3731635960: 'monster_rounds',
            1955841979: 'headshot_booster',
            2829638276: 'close_quarters',
            380806748: 'kinetic_dash',
            1414025773: 'long_range',
            3862866912: 'rapid_rounds',
            
            // Vitality items
            3261353684: 'healing_rite',
            915014646: 'extra_health',
            1710079648: 'sprint_boots',
            2519598785: 'melee_lifesteal',
            3140772621: 'extra_regen',
            3491236900: 'extra_stamina',
            343572757: 'fortitude',
            1250307611: 'restorative_locket',
            
            // Spirit items
            3970837787: 'mystic_burst',
            3585132399: 'ammo_scavenger',
            3357231760: 'mystic_reach',
            7409189: 'spirit_strike',
            3270001687: 'quicksilver_reload',
            
            // Add fallback for cheat_death example
            0: 'cheat_death'
        };
        
        // Determine the category based on item ID ranges or mapping
        const categoryMap = {
            weapon: ['high_velocity_mag', 'monster_rounds', 'headshot_booster', 'close_quarters', 'kinetic_dash', 'long_range', 'rapid_rounds'],
            vitality: ['healing_rite', 'extra_health', 'sprint_boots', 'melee_lifesteal', 'extra_regen', 'extra_stamina', 'fortitude', 'restorative_locket', 'cheat_death'],
            spirit: ['mystic_burst', 'ammo_scavenger', 'mystic_reach', 'spirit_strike', 'quicksilver_reload']
        };
        
        let itemName;
        if (typeof itemId === 'string') {
            // If it's already a string name, clean it up
            itemName = itemId.toLowerCase().replace(/[\s-]+/g, '_');
        } else if (itemNameMap[itemId]) {
            // If we have a mapping for this ID
            itemName = itemNameMap[itemId];
        } else {
            // Fallback to a default item
            console.warn(`Unknown item ID: ${itemId}, using fallback`);
            itemName = 'cheat_death';
        }
        
        // Determine category from item name
        let itemCategory = category;
        for (const [cat, items] of Object.entries(categoryMap)) {
            if (items.includes(itemName)) {
                itemCategory = cat;
                break;
            }
        }
        
        return `https://assets-bucket.deadlock-api.com/assets-api-res/images/items/${itemCategory}/${itemName}_sm.png`;
    }

    /**
     * Calculate KDA ratio
     */
    calculateKDA(kills, deaths, assists) {
        const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
        return Math.round(kda * 100) / 100;
    }

    /**
     * Calculate per-minute statistics
     */
    calculatePerMinute(value, durationSeconds) {
        if (!durationSeconds || durationSeconds === 0) return 0;
        const minutes = durationSeconds / 60;
        return Math.round((value / minutes) * 10) / 10;
    }

    /**
     * Calculate player statistics from match history
     */
    calculatePlayerStats(matches) {
        if (!matches || matches.length === 0) return null;

        const stats = {
            totalMatches: matches.length,
            wins: 0,
            losses: 0,
            winRate: 0,
            averageKills: 0,
            averageDeaths: 0,
            averageAssists: 0,
            averageKDA: 0,
            kdaStdDev: 0,
            heroStats: {},
            recentForm: []
        };

        let totalKills = 0;
        let totalDeaths = 0;
        let totalAssists = 0;
        const kdaValues = [];

        matches.forEach((match, index) => {
            // Support both API response formats
            const kills = match.player_kills || match.kills || 0;
            const deaths = match.player_deaths || match.deaths || 0;
            const assists = match.player_assists || match.assists || 0;
            const matchResult = Number(match.match_result); // winning team

            // Determine player's team
            let playerTeam = null;
            if (match.team !== undefined) {
                playerTeam = Number(match.team);
            } else if (match.player_team !== undefined) {
                playerTeam = Number(match.player_team);
            } else if (match.player_slot !== undefined) {
                playerTeam = Number(match.player_slot) <= 6 ? 0 : 1;
            }

            const heroId = match.hero_id;

            // Win/loss tracking based on team
            const playerWon = playerTeam !== null && !Number.isNaN(matchResult)
                ? playerTeam === matchResult
                : matchResult === 0;

            if (playerWon) {
                stats.wins++;
            } else {
                stats.losses++;
            }

            // Recent form (last 10 matches)
            if (index < 10) {
                stats.recentForm.push(playerWon ? 'W' : 'L');
            }

            // KDA tracking
            totalKills += kills;
            totalDeaths += deaths;
            totalAssists += assists;
            const matchKDA = this.calculateKDA(kills, deaths, assists);
            kdaValues.push(matchKDA);

            // Hero-specific stats
            if (heroId) {
                if (!stats.heroStats[heroId]) {
                    stats.heroStats[heroId] = {
                        matches: 0,
                        wins: 0,
                        losses: 0,
                        winRate: 0,
                        totalKills: 0,
                        totalDeaths: 0,
                        totalAssists: 0
                    };
                }
                
                stats.heroStats[heroId].matches++;
                if (playerWon) {
                    stats.heroStats[heroId].wins++;
                } else {
                    stats.heroStats[heroId].losses++;
                }
                stats.heroStats[heroId].totalKills += kills;
                stats.heroStats[heroId].totalDeaths += deaths;
                stats.heroStats[heroId].totalAssists += assists;
            }
        });

        // Calculate averages
        stats.winRate = Math.round((stats.wins / stats.totalMatches) * 100);
        stats.averageKills = Math.round((totalKills / stats.totalMatches) * 10) / 10;
        stats.averageDeaths = Math.round((totalDeaths / stats.totalMatches) * 10) / 10;
        stats.averageAssists = Math.round((totalAssists / stats.totalMatches) * 10) / 10;
        stats.averageKDA = this.calculateKDA(totalKills, totalDeaths, totalAssists);

        if (kdaValues.length > 0) {
            const mean = stats.averageKDA;
            const variance = kdaValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / kdaValues.length;
            stats.kdaStdDev = Math.round(Math.sqrt(variance) * 100) / 100;
        }

        // Calculate hero win rates
        Object.keys(stats.heroStats).forEach(heroId => {
            const heroStat = stats.heroStats[heroId];
            heroStat.winRate = Math.round((heroStat.wins / heroStat.matches) * 100);
            heroStat.averageKDA = this.calculateKDA(
                heroStat.totalKills,
                heroStat.totalDeaths,
                heroStat.totalAssists
            );
        });

        return stats;
    }

    /**
     * Get hero image map for all heroes (hero ID -> image URL)
     * Static mapping to avoid CORS issues with assets API - Updated for CORS fix
     * @returns {Object} - Map of hero IDs to their image URLs
     */
    getHeroImageMap() {
        // Updated mapping using new assets-bucket endpoint with _mm.webp format
        const HERO_IMAGE_MAPPING = {
            1: 'inferno_mm.webp',      // Infernus
            2: 'gigawatt_mm.webp',     // Seven
            3: 'hornet_mm.webp',       // Vindicta
            4: 'ghost_mm.webp',        // Lady Geist (updated from spectre)
            6: 'atlas_mm.webp',        // Abrams (updated from bull)
            7: 'wraith_mm.webp',       // Wraith
            8: 'forge_mm.webp',        // McGinnis (updated from engineer)
            10: 'chrono_mm.webp',      // Paradox
            11: 'dynamo_mm.webp',      // Dynamo (updated from sumo)
            12: 'kelvin_mm.webp',      // Kelvin
            13: 'haze_mm.webp',        // Haze
            15: 'bebop_mm.webp',       // Bebop
            16: 'nano_mm.webp',        // Calico
            17: 'orion_mm.webp',       // Grey Talon (updated from archer)
            18: 'krill_mm.webp',       // Mo & Krill (updated from digger)
            19: 'shiv_mm.webp',        // Shiv
            20: 'tengu_mm.webp',       // Ivy
            25: 'warden_mm.webp',      // Warden
            27: 'yamato_mm.webp',      // Yamato
            31: 'lash_mm.webp',        // Lash
            35: 'viscous_mm.webp',     // Viscous
            50: 'synth_mm.webp',       // Pocket
            52: 'mirage_mm.webp',      // Mirage
            58: 'kali_mm.webp',        // Vyper (using kali slug)
            60: 'magician_mm.webp',    // Sinclair
            63: 'vampirebat_mm.webp',  // Mina
            64: 'drifter_mm.webp',     // Drifter
            66: 'frank_mm.webp',       // Frank (Victor)
            67: 'bookworm_mm.webp',    // Bookworm (Paige)
            69: 'doorman_mm.webp',     // Doorman
            72: 'punkgoat_mm.webp',    // Billy
        };

        const BASE_URL = 'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/';
        const imageMap = {};

        // Convert mapping to full URLs
        for (const [heroId, imageName] of Object.entries(HERO_IMAGE_MAPPING)) {
            imageMap[parseInt(heroId)] = BASE_URL + imageName;
        }

        return imageMap;
    }

    /**
     * Test all hero icon URLs and report mapping issues
     * @returns {Promise<Object>} - Report of all hero icon URL statuses
     */
    async testAllHeroIcons() {
        try {
            const allHeroes = await this.getAllHeroes();
            const report = {
                working: [],
                broken: [],
                missing_mapping: []
            };
            
            for (const hero of allHeroes) {
                const heroId = hero.id;
                const heroName = hero.name;
                const className = hero.class_name;
                
                // Test API method (most reliable)
                const apiImageUrl = hero.images?.minimap_image_webp || hero.images?.minimap_image;
                
                // Test local mapping method
                const localImageUrl = this.getLocalHeroThumbnailUrl(heroId);
                
                const result = {
                    id: heroId,
                    name: heroName,
                    className: className,
                    apiImageUrl,
                    localImageUrl,
                    status: apiImageUrl ? 'working' : 'missing_api_image'
                };
                
                if (apiImageUrl) {
                    report.working.push(result);
                } else if (!window.getHeroClassName(heroId)) {
                    report.missing_mapping.push(result);
                } else {
                    report.broken.push(result);
                }
            }
            
            return report;
        } catch (error) {
            console.error('Error testing hero icons:', error);
            return null;
        }
    }

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Export for use in other modules
export default DeadlockAPIService;
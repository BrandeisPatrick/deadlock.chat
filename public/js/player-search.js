/**
 * Player Search Module - Handle player search functionality for Deadlock Match Analyzer
 */

import DeadlockAPIService from './deadlock-api-service.js';
// Note: Hero mappings and bigint utils are loaded globally via window object

// Helper function to check if running locally
function isLocalDevelopment() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

const DEFAULT_RECENT_MATCH_LIMIT = 20;

class PlayerSearch {
    constructor() {
        this.deadlockAPI = new DeadlockAPIService();
        this.playerCache = new Map(); // Cache player name -> account ID mappings
        this.matchCache = new Map(); // Cache account ID -> recent matches (5 min TTL)
        this.fairnessCache = new Map(); // Cache match ID -> fairness score
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Parse Steam input to extract vanity URL or Steam ID
     */
    parsePlayerInput(input) {
        const trimmed = input.trim();
        
        // Check if it's a full Steam profile URL
        const steamProfileRegex = /steamcommunity\.com\/(id|profiles)\/([^\/\?]+)/i;
        const match = trimmed.match(steamProfileRegex);
        
        if (match) {
            const [, type, identifier] = match;
            if (type === 'id') {
                // Vanity URL (e.g., steamcommunity.com/id/vanityName/)
                return { type: 'vanity', value: identifier };
            } else if (type === 'profiles') {
                // Direct SteamID64 (e.g., steamcommunity.com/profiles/76561198148166542/)
                return { type: 'steamid64', value: identifier };
            }
        }
        
        // Check if it looks like a Steam ID 64 (17 digits starting with 7656119)
        if (/^7656119\d{10}$/.test(trimmed)) {
            return { type: 'steamid64', value: trimmed };
        }
        
        // Also accept shorter numeric IDs that might be partial SteamID64s
        if (/^\d{17}$/.test(trimmed) && trimmed.startsWith('76561')) {
            return { type: 'steamid64', value: trimmed };
        }
        
        // Check if it looks like a Deadlock account ID (shorter number)
        if (/^\d{8,10}$/.test(trimmed)) {
            // This might be a Deadlock account ID, convert it to SteamID64
            const steamId64 = (BigInt(trimmed) + BigInt('76561197960265728')).toString();
            return { type: 'steamid64', value: steamId64 };
        }
        
        // Process username/vanity URL
        let processedValue = trimmed;
        
        // Remove common URL prefixes if user pasted them accidentally
        processedValue = processedValue.replace(/^https?:\/\/(www\.)?steamcommunity\.com\/(id\/)?/i, '');
        
        // Otherwise, treat as vanity URL that needs resolution
        return { type: 'vanity', value: processedValue };
    }

    /**
     * Search for a player using Steam profile URL or vanity name
     */
    async searchPlayer(query) {
        try {
            const parsed = this.parsePlayerInput(query);
            const cacheKey = `${parsed.type}:${parsed.value}`;

            if (this.playerCache.has(cacheKey)) {
                const cached = this.playerCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                    return cached.data;
                }
            }

            let steamResponse;
            let steamId64 = null;

            // If we have a direct SteamID64, use it directly
            if (parsed.type === 'steamid64') {
                steamId64 = parsed.value;
                
                // Try Steam API first, but fallback to basic data if it fails
                try {
                    const steamApiUrl = `/api/steam-user?steamids=${encodeURIComponent(steamId64)}`;
                    
                    const response = await fetch(steamApiUrl);
                    
                    if (response.ok) {
                        steamResponse = await response.json();
                        
                        if (steamResponse.response && steamResponse.response.players && steamResponse.response.players.length > 0) {
                            steamResponse.playerData = steamResponse.response.players[0];
                            steamResponse.resolved = true;
                            steamResponse.steamid = steamId64;
                            steamResponse.deadlockAccountId = steamId64;
                        } else {
                            console.warn('⚠️ [Player Search] No players found in Steam API response');
                        }
                    } else {
                        const errorText = await response.text();
                        console.error('❌ [Player Search] Steam API error:', errorText);
                    }
                } catch (error) {
                    console.warn('Steam API failed, using basic profile data:', error);
                }
                
                // If Steam API failed, create basic profile data
                if (!steamResponse || !steamResponse.resolved) {
                    steamResponse = {
                        playerData: {
                            personaname: `Player_${steamId64.substring(steamId64.length - 8)}`, // Use last 8 digits as fallback name
                            avatarfull: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMUUyOTNCIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjNjQ3NDhCIi8+CjxlbGxpcHNlIGN4PSI1MCIgY3k9Ijc1IiByeD0iMjUiIHJ5PSIyMCIgZmlsbD0iIzY0NzQ4QiIvPgo8L3N2Zz4=',
                            steamid: steamId64
                        },
                        resolved: true,
                        steamid: steamId64,
                        deadlockAccountId: steamId64
                    };
                }
            }
            // For vanity URLs, resolve to SteamID64 first
            else if (parsed.type === 'vanity') {
                
                try {
                    // Step 1: Resolve vanity URL to SteamID64
                    const vanityResponse = await fetch(`/api/steam-user?vanityurl=${encodeURIComponent(parsed.value)}`);
                    
                    if (vanityResponse.ok) {
                        const vanityData = await vanityResponse.json();
                        if (vanityData.resolved && vanityData.steamid) {
                            steamId64 = vanityData.steamid;
                            
                            // Step 2: Get Steam profile info
                            const profileResponse = await fetch(`/api/steam-user?steamids=${steamId64}`);
                            if (profileResponse.ok) {
                                steamResponse = await profileResponse.json();
                                if (steamResponse.response && steamResponse.response.players && steamResponse.response.players.length > 0) {
                                    steamResponse.playerData = steamResponse.response.players[0];
                                    steamResponse.resolved = true;
                                    steamResponse.steamid = steamId64;
                                    steamResponse.deadlockAccountId = steamId64;
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Vanity URL resolution failed:', error);
                }
                
                // If vanity URL resolution failed, suggest using SteamID64 instead
                if (!steamResponse || !steamResponse.resolved) {
                    throw new Error(`Could not resolve vanity URL "${parsed.value}". Steam API may be unavailable. Please try using your full Steam profile URL (steamcommunity.com/profiles/76561198xxxxxxxxx) instead.`);
                }
            }

            // If all searches failed, throw error
            if (!steamResponse || !steamResponse.resolved || !steamId64) {
                throw new Error(`Steam profile "${query}" not found. Please check the profile URL or vanity name and try again.`);
            }

            // Store the resolved SteamID64 for future use
            steamResponse.steamId64 = steamId64;

            this.playerCache.set(cacheKey, {
                data: steamResponse,
                timestamp: Date.now()
            });

            return steamResponse;

        } catch (error) {
            console.error('Player search error:', error);
            throw error;
        }
    }

    /**
     * Fetch recent matches for a player using SteamID64
     * Since the Deadlock API doesn't have direct player match endpoints,
     * we'll use the existing DeadlockAPIService method which uses match history
     */
    async fetchPlayerRecentMatches(steamId64, limit = DEFAULT_RECENT_MATCH_LIMIT) {
        
        // Show progress bar immediately when starting
        this.showMatchLoadingProgress(true);
        this.updateMatchLoadingProgress(0, limit, 'Connecting to API...');
        
        try {
            // Check cache first
            const cacheKey = `matches:${steamId64}`;
            
            if (this.matchCache.has(cacheKey)) {
                const cached = this.matchCache.get(cacheKey);
                const isValid = Date.now() - cached.timestamp < this.CACHE_TTL;
                
                if (isValid) {
                    
                    // Show quick progress for cached results
                    this.updateMatchLoadingProgress(limit, limit, '✅ Loading from cache...');
                    await new Promise(resolve => setTimeout(resolve, 300));
                    this.showMatchLoadingProgress(false);
                    
                    return cached.data;
                }
            }
            
            this.updateMatchLoadingProgress(1, limit, 'Converting Steam ID...');
            
            
            // Convert SteamID64 to account ID for Deadlock API with BigInt fallback
            const accountId = window.steamId64ToAccountId(steamId64);
            this.updateMatchLoadingProgress(2, limit, 'Fetching match history...');
            
            // Use the local API proxy endpoint which will handle CORS and route to Deadlock API
            const matchHistoryUrl = `/api/players/${accountId}/match-history`;
            
            let response, matchData;
            
            try {
                response = await fetch(matchHistoryUrl);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch match history: ${response.status} ${response.statusText}`);
                }
                
                this.updateMatchLoadingProgress(3, limit, 'Parsing match data...');
                matchData = await response.json();
                
                // Log structure of first match to understand data format
                if (matchData.length > 0) {
                } else {
                }
            } catch (error) {
                console.error('Error fetching match history:', error);
                throw error;
            }
            
            if (!Array.isArray(matchData)) {
                throw new Error('Invalid match history response format');
            }
            
            // Debug the filtering step by step
            const filteredMatches = matchData.filter((match, index) => {
                const hasMatchId = match.match_id && match.match_id !== '0';
                if (!hasMatchId) {
                    // Skip matches without valid match IDs
                }
                return hasMatchId;
            });
            
            // Process matches with the correct API response format
            const topMatches = filteredMatches.slice(0, limit);
            
            this.updateMatchLoadingProgress(4, limit, 'Processing matches...');
            
            // Debug: Log the first match to understand the structure
            if (topMatches.length > 0) {
                console.log('🔍 Sample match data structure:', JSON.stringify(topMatches[0], null, 2));
            }
            
            const validMatches = topMatches.map((match, index) => {
                // Update progress for each match processed
                this.updateMatchLoadingProgress(4 + index + 1, limit, `Processing match ${index + 1} of ${topMatches.length}...`);
                
                // Handle both possible timestamp formats (seconds or milliseconds)
                let startTimeMs;
                if (match.start_time) {
                    // If timestamp is in seconds (typical Unix timestamp < year 3000), convert to ms
                    const timestamp = Number(match.start_time);
                    startTimeMs = timestamp < 32503680000 ? timestamp * 1000 : timestamp;
                } else {
                    startTimeMs = Date.now(); // Fallback to current time
                }

                // Extract K/D/A values with multiple possible field names
                const kills = match.kills || match.player_kills || match.hero_kills || 0;
                const deaths = match.deaths || match.player_deaths || match.hero_deaths || 0;
                const assists = match.assists || match.player_assists || match.hero_assists || 0;

                // Determine win/loss with improved logic
                let isWin = false;
                
                // Method 1: Check if player_team_result exists (new API format)
                if (match.player_team_result !== undefined) {
                    isWin = match.player_team_result === 1 || match.player_team_result === true;
                }
                // Method 2: Check match_result field
                else if (match.match_result !== undefined) {
                    const resultValue = Number(match.match_result);
                    // If we have team information, compare against match result
                    if (match.team !== undefined) {
                        isWin = Number(match.team) === resultValue;
                    } else if (match.player_team !== undefined) {
                        isWin = Number(match.player_team) === resultValue;
                    } else if (match.player_slot !== undefined) {
                        const team = Number(match.player_slot) < 6 ? 0 : 1;
                        isWin = team === resultValue;
                    } else {
                        // Fallback: treat result 1 as win, 0 as loss
                        isWin = resultValue === 1;
                    }
                }
                // Method 3: Check for direct win field
                else if (match.win !== undefined) {
                    isWin = Boolean(match.win);
                }

                return {
                    matchId: match.match_id,
                    heroId: match.hero_id,
                    heroName: window.getHeroName(match.hero_id),
                    heroColor: window.getHeroColor(match.hero_id),
                    kills: kills,
                    deaths: deaths,
                    assists: assists,
                    result: isWin ? 'win' : 'loss',
                    startTime: new Date(startTimeMs).toISOString(),
                    duration: match.match_duration_s || match.duration || 0,
                    playerDamage: match.player_damage || 0,
                    netWorth: match.net_worth || match.player_net_worth || 0,
                    lastHits: match.last_hits || match.player_last_hits || 0,
                    rawMatch: match // Keep for debugging
                };
            }).sort((a, b) => new Date(b.startTime) - new Date(a.startTime)); // Sort by most recent
            
            
            const result = {
                matches: validMatches,
                totalMatches: matchData.length,
                statistics: this.calculateBasicStats(validMatches)
            };
            
            // Cache the result
            this.matchCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
            
            // Show completion before hiding
            this.updateMatchLoadingProgress(limit, limit, `✅ All ${validMatches.length} matches loaded successfully!`);
            
            // Wait briefly to show completion message
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Hide progress bar
            this.showMatchLoadingProgress(false);
            
            return result;
            
        } catch (error) {
            // Hide progress bar on error
            this.showMatchLoadingProgress(false);
            console.error('Error fetching player matches:', error);
            throw error;
        }
    }

    /**
     * Calculate basic statistics from match data
     */
    calculateBasicStats(matches) {
        if (!matches || matches.length === 0) {
            return {
                winRate: 0,
                averageKDA: 0,
                averageKills: 0,
                averageDeaths: 0,
                averageAssists: 0
            };
        }

        const wins = matches.filter(m => m.result === 'win').length;
        const totalKills = matches.reduce((sum, m) => sum + (m.kills || 0), 0);
        const totalDeaths = matches.reduce((sum, m) => sum + (m.deaths || 0), 0);
        const totalAssists = matches.reduce((sum, m) => sum + (m.assists || 0), 0);

        return {
            winRate: Math.round((wins / matches.length) * 100),
            averageKDA: totalDeaths > 0 ? Math.round(((totalKills + totalAssists) / totalDeaths) * 100) / 100 : totalKills + totalAssists,
            averageKills: Math.round((totalKills / matches.length) * 10) / 10,
            averageDeaths: Math.round((totalDeaths / matches.length) * 10) / 10,
            averageAssists: Math.round((totalAssists / matches.length) * 10) / 10
        };
    }

    /**
     * Calculate overall fairness score comparing both teams
     */
    calculateFairnessScore(team0Players, team1Players) {
        const avg = (players, field) => {
            const values = players.filter(p => p.statistics).map(p => p.statistics[field] || 0);
            return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        };

        const std = (players, field) => {
            const values = players.filter(p => p.statistics).map(p => p.statistics[field] || 0);
            if (values.length === 0) return 0;
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
            return Math.sqrt(variance);
        };

       const bigBrotherPenalty = (players) => {
            const values = players.filter(p => p.statistics).map(p => p.statistics.averageKDA || 0);
            if (values.length === 0) return 0;
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
            const sd = Math.sqrt(variance);
            return Math.min(sd, 5);
       };

        // Heavy penalty when a single player's KDA greatly exceeds all players on the other team
        const extremeKdaGapPenalty = (teamA, teamB) => {
            const getMax = team => {
                const values = team.filter(p => p.statistics).map(p => p.statistics.averageKDA || 0);
                return values.length ? Math.max(...values) : 0;
            };
            const maxA = getMax(teamA);
            const maxB = getMax(teamB);
            const diff = Math.abs(maxA - maxB);
            return diff >= 0.5 ? diff * 20 : 0;
        };

        const avgKDA0 = avg(team0Players, 'averageKDA');
        const avgKDA1 = avg(team1Players, 'averageKDA');
        const avgWR0 = avg(team0Players, 'winRate');
        const avgWR1 = avg(team1Players, 'winRate');

        const kdaDiff = Math.abs(avgKDA0 - avgKDA1);
        const wrDiff = Math.abs(avgWR0 - avgWR1);
        const avgDMG0 = avg(team0Players, 'damagePerMinute');
        const avgDMG1 = avg(team1Players, 'damagePerMinute');
        const avgNW0  = avg(team0Players, 'netWorthPerMinute');
        const avgNW1  = avg(team1Players, 'netWorthPerMinute');

        const stdPenalty = std(team0Players, 'kdaStdDev') + std(team1Players, 'kdaStdDev');
        const bbPenalty = bigBrotherPenalty(team0Players) + bigBrotherPenalty(team1Players);

       const dmgDiff = Math.abs(avgDMG0 - avgDMG1);
       const nwDiff  = Math.abs(avgNW0  - avgNW1);
        const kdaGapPenalty = extremeKdaGapPenalty(team0Players, team1Players);

       let score = 10;
       score -= kdaDiff * 14; // very sensitive to KDA difference

        if (score < 0) score = 0;
        if (score > 10) score = 10;
        return score.toFixed(1);
    }

    /**
     * Fetch fairness score for a match (with caching)
     */
    async fetchFairnessScore(matchId) {
        const cached = this.fairnessCache.get(matchId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.score;
        }

        try {
            const data = await this.deadlockAPI.getAllPlayersFromMatch(matchId);
            if (!data || !data.teams) return null;
            const score = this.calculateFairnessScore(data.teams.team0, data.teams.team1);
            this.fairnessCache.set(matchId, { score, timestamp: Date.now() });
            return score;
        } catch (err) {
            console.error('Failed to fetch fairness score for', matchId, err);
            return null;
        }
    }

    /**
     * Gradually load fairness scores and update match cards
     * @param {Array} matches - Array of match objects or IDs
     */
    async loadFairnessScores(matches) {
        for (const m of matches) {
            const matchId = typeof m === 'object' ? m.matchId : m;
            try {
                const score = await this.fetchFairnessScore(matchId);
                const badge = document.querySelector(`.match-card[data-match-id="${matchId}"] .fairness-badge`);
                if (badge) {
                    badge.textContent = score !== null ? score : 'N/A';
                }
            } catch (err) {
                console.error('Error loading fairness for', matchId, err);
            }

            // Small delay so scores appear progressively
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    /**
     * Create HTML for match table row
     */
    createMatchTableRow(matchData, index) {
        const matchDate = new Date(matchData.startTime);
        const dateStr = matchDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        const timeStr = matchDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
        
        const kda = `${matchData.kills}/${matchData.deaths}/${matchData.assists}`;
        const kdaRatio = matchData.deaths > 0 ? 
            ((matchData.kills + matchData.assists) / matchData.deaths).toFixed(2) : 
            (matchData.kills + matchData.assists).toFixed(2);
        
        return `
            <tr class="match-table-row" data-match-id="${matchData.matchId}">
                <td class="table-cell-date">
                    <div class="date-wrapper">
                        <div class="date-main">${dateStr}</div>
                        <div class="date-time">${timeStr}</div>
                    </div>
                </td>
                <td class="table-cell-match-id">
                    <span class="match-id-short" title="${matchData.matchId}">
                        ${String(matchData.matchId).substring(0, 8)}...
                    </span>
                </td>
                <td class="table-cell-hero">
                    <div class="hero-cell" style="--hero-color: ${matchData.heroColor}">
                        <span class="hero-name">${matchData.heroName || 'Unknown'}</span>
                    </div>
                </td>
                <td class="table-cell-kda">
                    <div class="kda-cell">
                        <span class="kda-numbers">${kda}</span>
                        <span class="kda-ratio">(${kdaRatio})</span>
                    </div>
                </td>
                <td class="table-cell-result">
                    <span class="result-badge ${matchData.result}">
                        ${matchData.result === 'win' ? '✓ WIN' : '✗ LOSS'}
                    </span>
                </td>
                <td class="table-cell-actions">
                    <button class="table-action-btn" onclick="if(window.handleMatchFromTab) window.handleMatchFromTab('${matchData.matchId}')" title="View Match Details">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M6 3l7 5-7 5V3z"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Create HTML for a match tab
     */
    async createMatchTab(matchData, index, isActive = false) {
        // Get hero image from API instead of local files
        const heroImageUrl = await this.deadlockAPI.getHeroThumbnailUrl(matchData.heroId);
        const kda = `${matchData.kills}/${matchData.deaths}/${matchData.assists}`;
        const resultClass = matchData.result === 'win' ? 'win' : 'loss';
        const resultIcon = matchData.result === 'win' ? '🏆' : '💀';
        const activeClass = isActive ? 'active' : '';

        // Fairness will be loaded asynchronously later
        const fairnessDisplay = '...';

        // Format start time
        const matchDate = new Date(matchData.startTime);
        const timeAgo = this.getTimeAgo(matchDate);
        
        return `
            <div class="enhanced-match-card ${activeClass}" data-match-id="${matchData.matchId}" data-index="${index}">
                <div class="match-card-header">
                    <div class="hero-section">
                        <div class="hero-avatar-enhanced" style="border-color: ${matchData.heroColor};">
                            ${heroImageUrl ? `
                                <img src="${heroImageUrl}" alt="${matchData.heroName}" 
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                                     class="hero-avatar-img">
                                <div class="hero-fallback-enhanced" style="display: none;">
                                    <span class="hero-initials">${matchData.heroName?.substring(0, 2) || '?'}</span>
                                </div>
                            ` : `
                                <div class="hero-fallback-enhanced">
                                    <span class="hero-initials">${matchData.heroName?.substring(0, 2) || '?'}</span>
                                </div>
                            `}
                        </div>
                        <div class="hero-details">
                            <div class="hero-name-enhanced">${matchData.heroName || 'Unknown'}</div>
                            <div class="match-time-enhanced">
                                <svg class="time-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1"/>
                                    <path stroke="currentColor" stroke-linecap="round" stroke-width="1" d="M6 3v3l2 2"/>
                                </svg>
                                ${timeAgo}
                            </div>
                        </div>
                    </div>
                    <div class="match-result-enhanced ${resultClass}">
                        <div class="result-badge">
                            <span class="result-icon">${resultIcon}</span>
                            <span class="result-text">${matchData.result?.toUpperCase() || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="match-stats-section">
                    <div class="kda-display">
                        <div class="kda-label">K/D/A</div>
                        <div class="kda-value-enhanced">${kda}</div>
                    </div>
                    <div class="match-details">
                        <div class="detail-item">
                            <svg class="detail-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <rect x="2" y="3" width="8" height="6" rx="1" stroke="currentColor" stroke-width="1"/>
                                <path stroke="currentColor" stroke-linecap="round" stroke-width="1" d="M4 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"/>
                            </svg>
                            <span class="detail-text">ID: ${String(matchData.matchId).substring(0, 8)}...</span>
                        </div>
                    </div>
                </div>
                
                <div class="match-actions">
                    <div class="fairness-section">
                        <div class="fairness-display" id="fairness-display-${matchData.matchId}">
                            <span class="fairness-label">Match Fairness:</span>
                            <span class="fairness-value" id="fairness-value-${matchData.matchId}">Not calculated</span>
                        </div>
                        <button class="fairness-btn" onclick="calculateFairnessScore('${matchData.matchId}')" id="fairness-btn-${matchData.matchId}">
                            <svg class="fairness-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1"/>
                                <path stroke="currentColor" stroke-linecap="round" stroke-width="1" d="M4 6h4m-2-2v4"/>
                            </svg>
                            <span>Calculate Fairness</span>
                        </button>
                    </div>
                    <button class="enhanced-action-btn" onclick="if(window.handleMatchFromTab) window.handleMatchFromTab('${matchData.matchId}')">
                        <svg class="action-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M1 7h12m-6-6l6 6-6 6"/>
                        </svg>
                        <span>View Details</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render player search results
     */
    async renderPlayerSearchResults(playerData, matchHistory) {
        
        const playerInfoCard = document.getElementById('playerInfoCard');
        const matchTabsWrapper = document.getElementById('matchTabsWrapper');
        const playerSearchResults = document.getElementById('playerSearchResults');
        
        if (!playerInfoCard || !matchTabsWrapper || !playerSearchResults) {
            console.error('Missing DOM elements - they may not be created yet');
            // Create a fallback display
            const resultsContainer = document.getElementById('playerResults');
            if (resultsContainer) {
                resultsContainer.innerHTML = this.createFallbackDisplay(playerData, matchHistory);
                return;
            }
            throw new Error('Required DOM elements not found');
        }
        
        // Create player info card
        const steamProfile = playerData.playerData || {};
        const stats = matchHistory.statistics || {};
        
        playerInfoCard.innerHTML = `
            <div class="enhanced-player-header">
                <div class="player-avatar-section">
                    <div class="player-avatar-wrapper">
                        <img src="${steamProfile.avatarfull || steamProfile.avatarmedium || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMUUyOTNCIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjNjQ3NDhCIi8+CjxlbGxpcHNlIGN4PSI1MCIgY3k9Ijc1IiByeD0iMjUiIHJ5PSIyMCIgZmlsbD0iIzY0NzQ4QiIvPgo8L3N2Zz4='}" 
                             alt="Player Avatar" class="player-avatar-img">
                        <div class="player-status-indicator"></div>
                    </div>
                </div>
                <div class="player-details-section">
                    <div class="player-name-group">
                        <h3 class="player-name">${steamProfile.personaname || 'Unknown Player'}</h3>
                        <div class="player-badges">
                            <span class="badge badge-steam">Steam Player</span>
                        </div>
                    </div>
                    <div class="player-meta">
                        <div class="meta-item">
                            <svg class="meta-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 2C8 2 5 3 5 6v3c0 3 3 4 3 4s3-1 3-4V6c0-3-3-4-3-4z"/>
                            </svg>
                            <span>Steam ID: ${String(playerData.steamId64 || playerData.steamid || '').substring(0, 8)}...</span>
                        </div>
                        <div class="meta-item">
                            <svg class="meta-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 1l2.5 5h5.5l-4.5 4 1.5 5.5L8 12l-4.5 3.5L5 10l-4.5-4h5.5L8 1z"/>
                            </svg>
                            <a href="https://steamcommunity.com/profiles/${playerData.steamId64 || playerData.steamid}" target="_blank" class="steam-profile-link">View Steam Profile</a>
                        </div>
                    </div>
                </div>
                <div class="player-stats-highlight">
                    <div class="stat-highlight">
                        <div class="stat-highlight-value">${matchHistory.totalMatches || 0}</div>
                        <div class="stat-highlight-label">Total Matches</div>
                    </div>
                </div>
            </div>
            
            <div class="player-stats-grid">
                <div class="stat-card stat-winrate">
                    <div class="stat-card-content">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-info">
                            <div class="stat-value">${stats.winRate || 0}%</div>
                            <div class="stat-label">Win Rate</div>
                        </div>
                    </div>
                    <div class="stat-progress">
                        <div class="stat-progress-bar" style="width: ${stats.winRate || 0}%"></div>
                    </div>
                </div>
                <div class="stat-card stat-kda">
                    <div class="stat-card-content">
                        <div class="stat-icon">⚔️</div>
                        <div class="stat-info">
                            <div class="stat-value">${stats.averageKDA || 0}</div>
                            <div class="stat-label">Avg KDA</div>
                        </div>
                    </div>
                </div>
                <div class="stat-card stat-kills">
                    <div class="stat-card-content">
                        <div class="stat-icon">💀</div>
                        <div class="stat-info">
                            <div class="stat-value">${stats.averageKills || 0}</div>
                            <div class="stat-label">Avg Kills</div>
                        </div>
                    </div>
                </div>
                <div class="stat-card stat-performance">
                    <div class="stat-card-content">
                        <div class="stat-icon">📊</div>
                        <div class="stat-info">
                            <div class="stat-value">${stats.averageKills || 0}/${stats.averageDeaths || 0}/${stats.averageAssists || 0}</div>
                            <div class="stat-label">K/D/A Ratio</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Store matches for view switching
        this.currentMatches = matchHistory.matches;
        
        // Create match cards
        if (matchHistory.matches && matchHistory.matches.length > 0) {
            
            // Update matches count badge
            const matchesCountBadge = document.getElementById('matchesCountBadge');
            const matchesCount = document.getElementById('matchesCount');
            if (matchesCountBadge && matchesCount) {
                matchesCount.textContent = matchHistory.matches.length;
                matchesCountBadge.style.display = 'block';
            }
            
            // Default to card view
            await this.renderMatchesAsCards(matchHistory.matches);

            // Fairness scores temporarily disabled for player searches to reduce API calls
            // this.loadFairnessScores(matchHistory.matches);
        } else {
            matchTabsWrapper.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <p>No recent matches found for this player.</p>
                    <p class="text-sm mt-2">The player may not have played recently or their match history is private.</p>
                </div>
            `;
        }
        
        // Show the results section
        playerSearchResults.classList.remove('hidden');
        
        // Scroll to results
        playerSearchResults.scrollIntoView({ behavior: 'smooth' });
        
    }

    /**
     * Render matches as cards
     */
    async renderMatchesAsCards(matches) {
        const matchTabsWrapper = document.getElementById('matchTabsWrapper');
        if (!matchTabsWrapper) return;
        
        const cardPromises = matches.map(async (match, index) => {
            return await this.createMatchTab(match, index, false);
        });
        const cardsHTML = (await Promise.all(cardPromises)).join('');
        
        matchTabsWrapper.innerHTML = cardsHTML;
        matchTabsWrapper.className = 'match-tabs-wrapper card-view';
        
        // Add click event listeners to cards
        const matchCards = matchTabsWrapper.querySelectorAll('.enhanced-match-card');
        matchCards.forEach((card) => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.enhanced-action-btn')) return;
                
                matchCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                const matchId = card.dataset.matchId;
            });
        });
    }
    
    /**
     * Render matches as table
     */
    renderMatchesAsTable(matches) {
        const matchTabsWrapper = document.getElementById('matchTabsWrapper');
        if (!matchTabsWrapper) return;
        
        const tableHTML = `
            <table class="matches-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Match ID</th>
                        <th>Hero</th>
                        <th>K/D/A</th>
                        <th>Result</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${matches.map((match, index) => this.createMatchTableRow(match, index)).join('')}
                </tbody>
            </table>
        `;
        
        matchTabsWrapper.innerHTML = tableHTML;
        matchTabsWrapper.className = 'match-tabs-wrapper table-view';
        
        // Add hover effect to rows
        const rows = matchTabsWrapper.querySelectorAll('.match-table-row');
        rows.forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('.table-action-btn')) return;
                
                const matchId = row.dataset.matchId;
                if (matchId && window.handleMatchFromTab) {
                    window.handleMatchFromTab(matchId);
                }
            });
        });
    }

    /**
     * Create fallback display when DOM elements are missing
     */
    createFallbackDisplay(playerData, matchHistory) {
        const steamProfile = playerData.playerData || {};
        const stats = matchHistory.statistics || {};
        const matches = matchHistory.matches || [];
        
        return `
            <!-- Player Info Card -->
            <div class="result-item" id="playerInfoCard" style="margin-bottom: var(--space-lg);">
                <div style="display: flex; gap: var(--space-lg); margin-bottom: var(--space-lg);">
                    <div style="position: relative; width: 80px; height: 80px;">
                        <img src="${steamProfile.avatarfull || steamProfile.avatarmedium || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMUUyOTNCIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjNjQ3NDhCIi8+CjxlbGxpcHNlIGN4PSI1MCIgY3k9Ijc1IiByeD0iMjUiIHJ5PSIyMCIgZmlsbD0iIzY0NzQ4QiIvPgo8L3N2Zz4='}" 
                             alt="Player Avatar" style="width: 100%; height: 100%; border: 2px solid var(--accent);">
                    </div>
                    <div style="flex: 1;">
                        <h4 style="font-size: 1.5rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 var(--space-sm) 0;">${steamProfile.personaname || 'Unknown Player'}</h4>
                        <p style="font-family: var(--font-mono); opacity: 0.8; margin: 0;">Steam ID: ${String(playerData.steamId64 || playerData.steamid || '').substring(0, 16)}...</p>
                        <a href="https://steamcommunity.com/profiles/${playerData.steamId64 || playerData.steamid}" target="_blank" 
                           style="color: var(--accent); text-decoration: none; font-family: var(--font-mono); font-size: 0.875rem;">🔗 VIEW STEAM PROFILE</a>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 800; color: var(--accent);">${matchHistory.totalMatches || 0}</div>
                        <div style="font-family: var(--font-mono); font-size: 0.875rem; opacity: 0.8; text-transform: uppercase;">Total Matches</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-md);">
                    <div style="background: var(--primary); border: 2px solid var(--secondary); padding: var(--space-md);">
                        <div style="font-size: 1.25rem; font-weight: 800; text-transform: uppercase;">${stats.winRate || 0}%</div>
                        <div style="font-family: var(--font-mono); font-size: 0.875rem; opacity: 0.8;">Win Rate</div>
                    </div>
                    <div style="background: var(--primary); border: 2px solid var(--secondary); padding: var(--space-md);">
                        <div style="font-size: 1.25rem; font-weight: 800; text-transform: uppercase;">${stats.averageKDA || 0}</div>
                        <div style="font-family: var(--font-mono); font-size: 0.875rem; opacity: 0.8;">Avg KDA</div>
                    </div>
                    <div style="background: var(--primary); border: 2px solid var(--secondary); padding: var(--space-md);">
                        <div style="font-size: 1.25rem; font-weight: 800; text-transform: uppercase;">${stats.averageKills || 0}/${stats.averageDeaths || 0}/${stats.averageAssists || 0}</div>
                        <div style="font-family: var(--font-mono); font-size: 0.875rem; opacity: 0.8;">K/D/A Ratio</div>
                    </div>
                </div>
            </div>
            
            <!-- Match History Section -->
            <div class="result-item" id="playerSearchResults">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
                    <h4 style="font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">
                        Recent Matches
                        <span style="background: var(--accent); color: var(--primary); padding: 4px 8px; font-size: 0.75rem; margin-left: var(--space-sm); font-weight: 800;">
                            ${matches.length}
                        </span>
                    </h4>
                    <div style="display: flex; gap: 2px;">
                        <button onclick="toggleMatchView('card')" 
                                style="background: var(--secondary); color: var(--primary); border: 2px solid var(--secondary); padding: var(--space-sm) var(--space-md); cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 0.75rem;"
                                onmouseover="this.style.boxShadow='0 0 0 2px var(--accent)'; this.style.borderColor='var(--accent)';"
                                onmouseout="this.style.boxShadow=''; this.style.borderColor='var(--secondary)';">
                            CARD VIEW
                        </button>
                        <button onclick="toggleMatchView('table')" 
                                style="background: var(--primary); border: 2px solid var(--secondary); color: var(--secondary); padding: var(--space-sm) var(--space-md); cursor: pointer; font-weight: 800; text-transform: uppercase; font-size: 0.75rem;"
                                onmouseover="this.style.boxShadow='0 0 0 2px var(--accent)'; this.style.borderColor='var(--accent)';"
                                onmouseout="this.style.boxShadow=''; this.style.borderColor='var(--secondary)';">
                            TABLE VIEW
                        </button>
                    </div>
                </div>
                
                <div id="matchTabsWrapper" class="match-tabs-wrapper card-view">
                    ${matches.length > 0 ? 
                        matches.map((match, index) => this.createSimpleMatchCard(match, index)).join('')
                    : `
                        <div style="text-align: center; padding: var(--space-xl); font-family: var(--font-mono); opacity: 0.8;">
                            <p>NO RECENT MATCHES FOUND FOR THIS PLAYER.</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }
    
    /**
     * Create simple match card for fallback display
     */
    createSimpleMatchCard(match, index) {
        const matchDate = new Date(match.startTime);
        const dateStr = matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const kda = `${match.kills}/${match.deaths}/${match.assists}`;
        const isWin = match.result === 'win';
        
        return `
            <div style="background: var(--primary); border: 2px solid var(--secondary); padding: var(--space-md); cursor: pointer; transition: all 0.3s var(--ease-out); position: relative;" 
                 onmouseover="this.style.borderWidth='4px'; this.style.transform='translateX(4px)'; this.style.boxShadow='0 0 0 2px var(--secondary)';" 
                 onmouseout="this.style.borderWidth='2px'; this.style.transform=''; this.style.boxShadow='';"
                 onclick="if(window.handleMatchFromTab) window.handleMatchFromTab('${match.matchId}')">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);">
                    <div>
                        <h4 style="font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; color: ${isWin ? 'var(--accent)' : 'var(--secondary)'};">${match.heroName || 'UNKNOWN'}</h4>
                        <p style="font-family: var(--font-mono); opacity: 0.8; margin: 0; font-size: 0.75rem;">${dateStr} ${timeStr}</p>
                    </div>
                    <div style="background: ${isWin ? 'var(--accent)' : 'var(--secondary)'}; color: var(--primary); padding: 4px 8px; font-weight: 800; font-size: 0.75rem;">
                        ${isWin ? '✓ WIN' : '✗ LOSS'}
                    </div>
                </div>
                
                <div style="border-top: 2px solid var(--secondary); padding-top: var(--space-sm); display: flex; justify-content: space-between;">
                    <div>
                        <p style="font-family: var(--font-mono); opacity: 0.8; margin: 0; font-size: 0.75rem; text-transform: uppercase;">K/D/A</p>
                        <div style="font-weight: 800; font-size: 1.125rem; text-transform: uppercase;">${kda}</div>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-family: var(--font-mono); opacity: 0.8; margin: 0; font-size: 0.75rem; text-transform: uppercase;">Match ID</p>
                        <div style="font-family: var(--font-mono); font-size: 0.875rem;">${String(match.matchId).substring(0, 8)}...</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Format numbers for display
     */
    formatNumber(num) {
        if (typeof num !== 'number' || isNaN(num)) return '0';
        
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1).replace('.0', '') + 'K';
        }
        return Math.round(num).toString();
    }

    /**
     * Get human-readable time ago string
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else {
            return `${diffDays}d ago`;
        }
    }

    /**
     * Show/hide match loading progress bar
     */
    showMatchLoadingProgress(show) {
        const progressContainer = document.getElementById('matchesLoadingProgress');
        const matchTabsWrapper = document.getElementById('matchTabsWrapper');
        
        if (progressContainer) {
            progressContainer.style.display = show ? 'block' : 'none';
        }
        
        if (matchTabsWrapper && show) {
            matchTabsWrapper.innerHTML = ''; // Clear existing matches while loading
        }
        
        if (show) {
            this.updateMatchLoadingProgress(0, DEFAULT_RECENT_MATCH_LIMIT); // Reset progress to default fetch count
        }
    }
    
    /**
     * Update match loading progress
     */
    updateMatchLoadingProgress(current, total, statusMessage = null) {
        const progressContainer = document.getElementById('matchesLoadingProgress');
        if (!progressContainer || progressContainer.style.display === 'none') {
            return; // Don't try to update progress if container is hidden
        }
        
        const progressFill = document.getElementById('matchesProgressFill');
        const progressText = document.getElementById('matchesProgressText');
        
        if (progressFill && progressText) {
            const percentage = Math.min((current / total) * 100, 100);
            progressFill.style.width = `${percentage}%`;
            
            if (statusMessage) {
                progressText.textContent = statusMessage;
            } else {
                progressText.textContent = `${current} of ${total} matches loaded`;
            }
        } else {
            console.error('Progress elements not found!', { progressFill: !!progressFill, progressText: !!progressText });
        }
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.playerCache.clear();
        this.matchCache.clear();
    }
    
    /**
     * Clear just match cache (for debugging)
     */
    clearMatchCache() {
        this.matchCache.clear();
    }
}

// Export the class
export default PlayerSearch;

// Also create a singleton instance for easy access
export const playerSearch = new PlayerSearch();

// Global function for calculating fairness score on demand
window.calculateFairnessScore = async function(matchId) {
    const button = document.getElementById(`fairness-btn-${matchId}`);
    const valueElement = document.getElementById(`fairness-value-${matchId}`);
    
    if (!button || !valueElement) {
        console.error('Fairness UI elements not found for match:', matchId);
        return;
    }
    
    // Update button to show loading state
    const originalText = button.innerHTML;
    button.innerHTML = `
        <svg class="fairness-icon animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1" stroke-dasharray="8 8"/>
        </svg>
        <span>Calculating...</span>
    `;
    button.disabled = true;
    
    try {
        // Use the existing fairness score calculation method
        const score = await playerSearch.fetchFairnessScore(matchId);
        
        if (score !== null && score !== undefined) {
            valueElement.textContent = `${score}/10`;
            valueElement.className = `fairness-value ${getFairnessScoreClass(parseFloat(score))}`;
            
            // Update button to show success
            button.innerHTML = `
                <svg class="fairness-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2 6l3 3 5-6"/>
                </svg>
                <span>Calculated</span>
            `;
            button.disabled = true;
            button.classList.add('calculated');
        } else {
            throw new Error('Could not calculate fairness score');
        }
    } catch (error) {
        console.error('Failed to calculate fairness score for match:', matchId, error);
        valueElement.textContent = 'Failed to calculate';
        valueElement.className = 'fairness-value fairness-error';
        
        // Reset button to allow retry
        button.innerHTML = originalText;
        button.disabled = false;
    }
};

// Helper function to get CSS class based on fairness score
function getFairnessScoreClass(score) {
    if (score >= 8) return 'fairness-excellent';
    if (score >= 6) return 'fairness-good';
    if (score >= 4) return 'fairness-fair';
    return 'fairness-poor';
}

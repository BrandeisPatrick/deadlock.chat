/**
 * API Configuration for Deadlock Web Application
 * 
 * This file contains all the API endpoints and configuration settings
 * for integrating with the official Deadlock API tools
 */

const API_CONFIG = {
    // Main API endpoints
    mainAPI: {
        baseUrl: 'https://api.deadlock-api.com/api/v1',
        endpoints: {
            // Match endpoints
            matchDetails: '/matches/{matchId}',
            matchMetadata: '/matches/{matchId}/metadata',
            
            // Player endpoints
            playerProfile: '/players/{playerId}',
            playerMatchHistory: '/players/{playerId}/match-history',
            
            // Leaderboard
            leaderboard: '/leaderboard',
            
            // Analytics
            analytics: '/analytics',
            
            // Builds
            heroBuilds: '/builds/{heroId}',
            
            // Patches
            patches: '/patches',
            
            // General info
            info: '/info'
        }
    },
    
    // Assets API
    assetsAPI: {
        baseUrl: 'https://assets.deadlock-api.com',
        endpoints: {
            heroIcon: '/heroes/{heroId}/icon.png',
            heroPortrait: '/heroes/{heroId}/portrait.png',
            heroAbility: '/heroes/{heroId}/abilities/{abilityId}.png',
            itemIcon: '/items/{itemId}.png'
        }
    },
    
    // Streamkit API (if available)
    streamkitAPI: {
        baseUrl: 'https://streamkit.deadlock-api.com',
        endpoints: {
            currentMatch: '/current-match',
            overlay: '/overlay'
        }
    },
    
    
    
    // Cache settings
    cache: {
        enabled: true,
        defaultTimeout: 5 * 60 * 1000, // 5 minutes
        matchDataTimeout: 10 * 60 * 1000, // 10 minutes for match data
        playerDataTimeout: 5 * 60 * 1000, // 5 minutes for player data
        leaderboardTimeout: 30 * 60 * 1000, // 30 minutes for leaderboard
        assetTimeout: 24 * 60 * 60 * 1000 // 24 hours for assets
    },
    
    // Request settings
    request: {
        timeout: 30000, // 30 seconds
        retries: 3,
        retryDelay: 1000 // 1 second
    },
    
    // Feature flags
    features: {
        useEnhancedAPI: true,
        enableAssets: true,
        enableStreamkit: false,
        enableAnalytics: true,
        enableLeaderboard: true,
        
        useMockData: false
    }
};

// Export for use in other modules
// Make API_CONFIG globally available
window.API_CONFIG = API_CONFIG;
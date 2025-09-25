// API Configuration
// Centralized configuration for all Deadlock API endpoints and settings

export const API_CONFIG = {
    // Base URLs
    BASE_URL: '/api',
    ASSETS_BASE_URL: 'https://assets.deadlock-api.com',
    ANALYTICS_BASE_URL: 'https://api.deadlock-api.com',
    ASSETS_BUCKET_URL: 'https://assets-bucket.deadlock-api.com/assets-api-res',
    
    // API Endpoints
    ENDPOINTS: {
        // Assets API
        HEROES: '/v2/heroes',
        ITEMS: '/v2/items',
        RANKS: '/v2/ranks',
        
        // Analytics API  
        HERO_STATS: '/v1/analytics/hero-stats',
        ITEM_STATS: '/v1/analytics/item-stats',
        BUILD_ITEM_STATS: '/v1/analytics/build-item-stats',
        HERO_SCOREBOARDS: '/v1/analytics/scoreboards/heroes',
        PLAYER_SCOREBOARDS: '/v1/analytics/scoreboards/players',
        
        // Match data
        MATCH_METADATA: '/v1/matches',
        PLAYER_DATA: '/v1/players',
        PLAYER_MATCH_HISTORY: '/match-history'
    },
    
    // Request settings
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
    REQUEST_DELAY: 1000, // 1 second between requests for rate limiting
    TIMEOUT: 10000, // 10 seconds
    
    // Image paths
    IMAGE_PATHS: {
        OPTIMIZED_ITEMS: '/images/items',
        API_UPGRADES: '/images/upgrades',
        HERO_THUMBNAILS: '/downloads/hero_thumbnails'
    },
    
    // Development settings
    IS_LOCAL: window.location.hostname === 'localhost' || 
              window.location.hostname === '127.0.0.1' ||
              window.location.hostname.includes('localhost'),
              
    // Error handling
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000 // 2 seconds
};

// Helper function to build complete API URLs
export function buildApiUrl(endpoint, baseUrl = API_CONFIG.ANALYTICS_BASE_URL) {
    return `${baseUrl}${endpoint}`;
}

// Helper function to build asset URLs
export function buildAssetUrl(path) {
    return `${API_CONFIG.ASSETS_BUCKET_URL}${path}`;
}

// Helper function to build optimized item image URL
export function buildOptimizedItemImageUrl(category, imageName) {
    return buildAssetUrl(`${API_CONFIG.IMAGE_PATHS.OPTIMIZED_ITEMS}/${category}/${imageName}_sm.png`);
}

export default API_CONFIG;
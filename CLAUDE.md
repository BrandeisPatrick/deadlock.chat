# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build Commands
```bash
# Build CSS for development (watch mode)
npm run build-css

# Build CSS for production (minified)
npm run build-css-prod

# Full build (static files already in public/)
npm run build
```

### Development Workflow
- No test framework is currently configured (`npm test` exits with error)
- Static files are served from the `public/` directory
- CSS is generated using Tailwind CSS from `src/input.css`
- The application is deployed on Vercel with serverless functions

## Architecture Overview

### Frontend Architecture
This is a single-page web application for analyzing Deadlock game match data with three main sections:

1. **Dashboard** (`public/index.html`): Match and player search interface
2. **Hero Stats**: Hero performance statistics and rankings  
3. **Item Stats**: Item usage and effectiveness data

### Key Components
- **Main App** (`public/index.html` + `public/js/app-init-refactored.js`): Navigation, section management, and search functionality
- **API Service** (`public/js/deadlock-api-service.js`): Handles all API calls to Deadlock API with caching and rate limiting
- **Hero Stats** (`public/js/components/hero-stats-ui.js`): Hero data visualization and management
- **Item Stats** (`public/js/item-stats.js`): Item usage and effectiveness data
- **Player Search** (`public/js/player-search.js`): Player lookup and profile management

### API Architecture
The application uses a hybrid API approach:
- **Proxy Functions** (`api/`): Custom serverless functions for Steam API integration and CORS handling
  - `deadlock-proxy.mjs`: Generic proxy for Deadlock API requests
  - `steam-user.mjs`: Steam user profile data fetching
- **Direct API Calls**: Most Deadlock API calls go directly to `https://api.deadlock-api.com/v1/`
- **Vercel Rewrites**: API routing configured in `vercel.json` redirects `/api/*` to appropriate endpoints

### Data Flow
1. User searches by match ID or player profile
2. API service fetches data from Deadlock API (with rate limiting and caching)
3. Data is processed and displayed using Chart.js for visualizations
4. Hero and item statistics are aggregated across multiple matches

### Asset Management
- Hero thumbnails stored in `public/downloads/hero_thumbnails/`
- Hero name mapping handled by `public/hero_mapping/hero-mappings.js`
- CSS built with Tailwind CSS from `src/input.css` to `styles.css` (needs to be generated)

### Deployment Configuration
- Hosted on Vercel with serverless function timeout of 10 seconds
- CORS headers configured for API endpoints
- API rewrites proxy most requests to external Deadlock API

## File Organization

```
public/
├── index.html                     # Main HTML file
├── js/                            # JavaScript modules
│   ├── app-init-refactored.js     # Application initialization
│   ├── deadlock-api-service.js    # API service layer
│   ├── item-stats.js              # Item statistics
│   ├── player-search.js           # Player search functionality
│   ├── simple-stats.js            # Basic statistics
│   └── components/
│       └── hero-stats-ui.js       # Hero statistics UI
├── config/api-config.js           # API configuration
├── hero_mapping/                  # Hero data mappings
└── downloads/hero_thumbnails/     # Hero image assets

api/                               # Serverless functions
├── deadlock-proxy.mjs             # Generic API proxy
└── steam-user.mjs                 # Steam API integration

src/                               # Source files (refactoring in progress)
├── input.css                      # Tailwind CSS input file
└── components/                    # Refactored components (not yet integrated)
```

## Important Notes

- The application handles BigInt values for Steam IDs using `bigint-utils.js`
- Rate limiting is implemented (1 second between API requests)
- All API responses are cached for 5 minutes
- The app uses ES6 modules throughout the frontend
- No backend framework - pure serverless functions with static frontend

## Deadlock API Documentation

### Assets API (https://assets.deadlock-api.com)
The assets site is public and provides static game data with CORS headers enabled for direct browser access.

#### Heroes Endpoints
- **GET /v2/heroes** - Returns array of all hero objects with metadata, images, abilities
  - Optional query params: `language`, `client_version`, `active_only`
- **GET /v2/heroes/{id}** - Returns single hero by numeric ID
- **GET /v2/heroes/by-name/{name}** - Fetches hero by name

#### Items Endpoints  
- **GET /v2/items** - Returns all abilities, weapons and upgrades
- **GET /v2/items/{id_or_class_name}** - Returns single item by ID or class name
- **GET /v2/items/by-type/{type}** - Returns items filtered by type (ability/weapon/upgrade)
- **GET /v2/items/by-hero-id/{id}** - Returns items used by specific hero

#### Other Assets
- **GET /v2/ranks** - Ranking tiers (Obscurus, Phantom, Eternus) with images and colors
- **GET /v2/build-tags** - Tags used in hero build guides
- **GET /v2/client-versions** - Valid client version numbers
- **GET /v1/map** - Map details (radius, objective positions)
- **GET /v1/colors** - Color definitions used in game UI
- **GET /v1/icons** - Dictionary of icon assets
- **GET /v1/sounds** - Dictionary of sound assets

### Analytics API (https://api.deadlock-api.com)
Provides game statistics including win rates, K/D/A, pick rates, and match data. Protected by Cloudflare in production.

#### Hero Statistics
- **GET /v1/analytics/hero-stats** - Aggregated performance statistics per hero
  - Returns: `hero_id`, `matches`, `wins`, `losses`, `total_kills`, `total_deaths`, `total_assists`, `net_worth`, `last_hits`
  - Filters: `min/max_unix_timestamp`, `min/max_duration_s`, `min/max_average_badge`
  
- **GET /v1/analytics/scoreboards/heroes** - Hero leaderboard
  - Required: `sort_by` parameter (winrate, avg_kills_per_match, avg_deaths_per_match, etc.)
  - Returns ranked list with `hero_id` and metric value
  - Filters: `order`, `min_matches`, time range, badge level

- **GET /v1/analytics/scoreboards/players** - Player leaderboard with same metrics as hero scoreboard

#### Hero Matchups & Synergies
- **GET /v1/analytics/hero-counter-stats** - Hero vs hero matchup statistics
  - Returns kills, deaths, assists, win counts, net worth for each matchup
  
- **GET /v1/analytics/hero-comb-stats** - Hero combination statistics
  - Filter `hero_ids.length === 1` for individual hero stats
  - Parameters: `combination_size`, `include_heroes`, `exclude_heroes`, `limit`
  
- **GET /v1/analytics/hero-synergy-stats** - Statistics for hero pairs on same team
  - Returns matches, wins, kills, deaths, assists, last hits, net worth

#### Build Statistics
- **GET /v1/analytics/ability-order-stats** - Ability leveling statistics by hero
- **GET /v1/analytics/build-item-stats** - Item purchase statistics in builds

#### Match Data
- **GET /v1/matches/{matchId}/metadata** - Detailed match information
  - Returns `match_info` with overall details and `players` array with performance data
  
- **GET /v1/players/{playerId}** - Player profile data
- **GET /v1/players/{playerId}/match-history** - Player match history
  - Parameters: `limit`, `offset`, `only_stored_history=true` (bypasses rate limits)

### Rank/Badge Level Filtering
Convert rank names to badge levels for API filtering:
- Formula: `badge_level = tier * 6 + (sub_rank - 1)`
- Example: Phantom 1 (tier 9, sub-rank 1) = 9×6 + 0 = 54
- Example: Eternus 6 (tier 11, sub-rank 6) = 11×6 + 5 = 71
- Use as `min_average_badge=54&max_average_badge=71`

### Time Filtering
- Use Unix timestamps for date filtering
- Latest patch (Aug 18, 2025): `min_unix_timestamp=1755489600`
- Current time: Use `Date.now() / 1000` for max_unix_timestamp

### Implementation Notes

1. **Combining Hero Data with Statistics**:
   - Call `/v2/heroes` for metadata (names, images)
   - Call `/v1/analytics/hero-stats` for performance data
   - Calculate: Win rate = wins/matches, K/D/A = (kills+assists)/deaths
   - Join data by hero_id for complete profiles

2. **CORS Handling**:
   - Assets API: Direct browser access allowed
   - Analytics API: May require proxy/serverless function
   - Use Vercel rewrites in production

3. **Rate Limiting**:
   - Implement 1-second delay between requests
   - Cache responses for 5 minutes
   - Use `only_stored_history=true` for player data to avoid limits

4. **Error Handling**:
   - Graceful fallbacks for missing data
   - Show placeholder UI when APIs unavailable
   - Retry with exponential backoff for 429 errors
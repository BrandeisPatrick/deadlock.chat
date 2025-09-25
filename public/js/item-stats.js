// Simple Item Statistics Module - Table View

// Global mapping storage for debugging
window.itemImageMappings = [];

// Helper function to show specific item mapping
window.showItemMapping = function(itemName) {
    const mapping = window.itemImageMappings.find(m => 
        m.name.toLowerCase().includes(itemName.toLowerCase())
    );
    if (mapping) {
        console.table([mapping]);
        return mapping;
    } else {
        return null;
    }
};

// Helper to show all category mismatches
window.showCategoryMismatches = function() {
    const mismatches = window.itemImageMappings.filter(m => 
        m.apiCategory !== 'none' && m.apiCategory !== 'unknown' && 
        m.apiCategory !== m.detectedCategory && 
        !m.apiCategory.includes(m.detectedCategory)
    );
    console.table(mismatches);
    return mismatches;
};

// Mobile detection helper
function isMobileDevice() {
    return window.innerWidth <= 768 || 
           ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0);
}

export async function initializeItemStats() {
    
    // Clear previous mappings
    window.itemImageMappings = [];
    
    // Show loading state
    const container = document.getElementById('item-stats-container');
    if (!container) {
        console.error('❌ [Item Stats] Container not found');
        return;
    }
    
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div class="spinner" style="margin: 0 auto 1rem;"></div>
            <p style="color: var(--text-primary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Loading item statistics...</p>
        </div>
    `;
    
    try {
        // Fetch items data
        const itemsResponse = await fetch('https://assets.deadlock-api.com/v2/items');
        const itemsData = await itemsResponse.json();
        
        // Fetch heroes data for filtering
        const heroesResponse = await fetch('https://assets.deadlock-api.com/v2/heroes');
        const heroesData = await heroesResponse.json();
        
        // Fetch item statistics (initially without hero filter)
        const statsData = await fetchItemStatistics();
        
        // Process and display items with enhanced statistics
        displaySimpleItemTable(container, itemsData, statsData.buildStats, statsData.itemStats, statsData.totalBuilds, heroesData);
        
    } catch (error) {
        console.error('❌ [Item Stats] Error loading items:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <h3 style="margin-bottom: 0.5rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Failed to Load Items</h3>
                <p style="color: var(--text-secondary);">Unable to fetch item statistics.</p>
                <button onclick="window.loadItemStats()" class="btn">Retry</button>
            </div>
        `;
    }
}

// Helper function to fetch item statistics with optional hero filtering
async function fetchItemStatistics(heroId = null) {
    const results = { buildStats: null, itemStats: null, totalBuilds: 0 };
    
    // Build hero query parameter
    const heroParam = heroId && heroId !== 'all' ? `?hero_id=${heroId}` : '';
    
    // Fetch build statistics for usage data
    try {
        
        let buildResponse;
        try {
            buildResponse = await fetch(`https://api.deadlock-api.com/v1/analytics/build-item-stats${heroParam}`);
        } catch (corsError) {
            buildResponse = await fetch('/api/deadlock-proxy?url=' + encodeURIComponent(`https://api.deadlock-api.com/v1/analytics/build-item-stats${heroParam}`));
        }
        
        if (buildResponse.ok) {
            results.buildStats = await buildResponse.json();
            
            // Calculate total builds for usage percentage
            results.totalBuilds = results.buildStats.reduce((sum, stat) => sum + (stat.builds || 0), 0);
        } else {
        }
    } catch (error) {
    }
    
    // Fetch item statistics for win/loss data
    try {
        
        let itemStatsResponse;
        try {
            itemStatsResponse = await fetch(`https://api.deadlock-api.com/v1/analytics/item-stats${heroParam}`);
        } catch (corsError) {
            itemStatsResponse = await fetch('/api/deadlock-proxy?url=' + encodeURIComponent(`https://api.deadlock-api.com/v1/analytics/item-stats${heroParam}`));
        }
        
        if (itemStatsResponse.ok) {
            results.itemStats = await itemStatsResponse.json();
        } else {
        }
    } catch (error) {
    }
    
    return results;
}

// Manual name mappings for items with different image names
const IMAGE_NAME_EXCEPTIONS = {
    'Extended Magazine': 'basic_magazine',
    'Compress Cooldown': 'improved_cooldown',
    'Spellslinger': 'spell_slinger'
    // 'Bullet Armor' mapping to be added when found
};

// Helper function to convert item name to snake_case
function toSnakeCase(str) {
    return str
        .toLowerCase()
        .replace(/'/g, '') // Remove apostrophes completely
        .replace(/[^a-z0-9]+/g, '_') // Replace other non-alphanumeric with underscores
        .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
}

// Get the correct image name for an item, checking exceptions first
function getItemImageName(itemName) {
    // Check for manual exceptions first
    if (IMAGE_NAME_EXCEPTIONS[itemName]) {
        return IMAGE_NAME_EXCEPTIONS[itemName];
    }
    // Otherwise use normal snake_case conversion
    return toSnakeCase(itemName);
}

// Proper game category mappings based on actual item locations
// These are confirmed by testing the actual image URLs
const ITEM_CATEGORIES = {
    // WEAPON ITEMS (damage, fire rate, ammo, bullets)
    'monster rounds': 'weapon',
    'hollow point': 'weapon',
    'slowing bullets': 'weapon',
    'tesla bullets': 'weapon',
    'spirit shredder bullets': 'weapon',
    'mystic shot': 'weapon',
    'spirit rend': 'weapon',
    'sekhmet\'s spirit': 'weapon',
    'headshot booster': 'weapon',
    'point blank': 'weapon',
    'close quarters': 'weapon',
    'long range': 'weapon',
    'pristine emblem': 'weapon',
    'basic magazine': 'weapon',
    'burst fire': 'weapon',
    'kinetic dash': 'weapon',
    'shadow weave': 'weapon',
    'slowing hex': 'spirit',
    'silencer': 'weapon',
    'active reload': 'weapon',
    'backstabber': 'weapon',
    'blood tribute': 'weapon',
    'express shot': 'weapon',
    'spellslinger': 'weapon',
    'cultist sacrifice': 'weapon',
    
    // VITALITY ITEMS (health, armor, healing, survivability)
    'phantom strike': 'vitality',
    'vampiric burst': 'vitality',
    'enchanter\'s emblem': 'vitality',  // Exception: mods_tech but vitality in game
    'spirit resilience': 'vitality',
    'extra health': 'vitality',
    'toughness': 'vitality',
    'bullet armor': 'vitality',
    'spirit armor': 'vitality',
    'healing rite': 'vitality',
    'health nova': 'vitality',
    'lifestrike': 'vitality',
    'leech': 'vitality',
    'fortitude': 'vitality',
    'divine barrier': 'vitality',
    'enduring spirit': 'vitality',
    'restoration shot': 'vitality',
    'return fire': 'vitality',
    'reactive barrier': 'vitality',
    'debuff remover': 'vitality',
    'rescue beam': 'vitality',
    'metal skin': 'vitality',
    'colossus': 'vitality',
    'spellbreaker': 'vitality',  // Anti-magic vitality item
    'juggernaut': 'vitality',    // Tank vitality item
    'counterspell': 'vitality',  // Another anti-magic vitality item
    'healbane': 'vitality',       // Healing reduction item (API says vitality despite mods_tech path)
    
    // SPIRIT ITEMS (ability power, cooldowns, spirit)
    'mystic burst': 'spirit',
    'improved cooldown': 'spirit',
    'superior cooldown': 'spirit',
    'transcendent cooldown': 'spirit',
    'boundless spirit': 'spirit',
    'echo shard': 'spirit',
    'refresher': 'spirit',
    'improved spirit': 'spirit',
    'superior spirit': 'spirit',
    'ethereal shift': 'spirit',
    'mystic reach': 'spirit',
    'quicksilver reload': 'spirit',
    'surge of power': 'spirit',
    'diviner\'s kevlar': 'spirit',
    'torment pulse': 'spirit',
    'knockdown': 'spirit',
    'compress cooldown': 'spirit',
    'mercurial magnum': 'spirit',  // Spirit item (API says spirit despite mods_weapon path)
};

// Items that don't exist in /items/ endpoint - fallback to API images only
const ITEMS_WITHOUT_OPTIMIZED_IMAGES = new Set([
    'bullet armor',  // Still needs mapping
    'weapon_upgrade_t1',
    'weapon_upgrade_t2', 
    'weapon_upgrade_t3',
    'weapon_upgrade_t4',
    'weapon_upgrade_t5',
    'upgrade_clip_size_fixed_t3',
    'upgrade_clip_size_2',
    'upgrade_clip_size_3',
    'transcendence'  // Different from 'transcendent cooldown'
]);

// Helper function to determine item category
function determineItemCategory(item) {
    const nameLower = item.name.toLowerCase();
    
    // First check our known mappings
    if (ITEM_CATEGORIES[nameLower]) {
        return ITEM_CATEGORIES[nameLower];
    }
    
    // For items not in our mapping, try to determine from the API image path
    // This is not 100% reliable but gives us a starting point
    if (item.image) {
        // The API paths don't directly map to game categories
        // mods_weapon -> usually weapon items
        // mods_armor -> usually vitality items  
        // mods_tech -> usually spirit items
        // mods_utility -> mixed, often weapon
        
        if (item.image.includes('/mods_weapon/')) {
            // Most weapon mods are weapon category
            return 'weapon';
        }
        if (item.image.includes('/mods_armor/')) {
            // Armor mods are vitality
            return 'vitality';
        }
        if (item.image.includes('/mods_tech/')) {
            // Tech mods are usually spirit, but check for exceptions
            if (nameLower.includes('armor') || nameLower.includes('health') || 
                nameLower.includes('resilience') || nameLower.includes('emblem')) {
                // These are likely vitality despite being in tech
                return 'vitality';
            }
            return 'spirit';
        }
        if (item.image.includes('/mods_utility/')) {
            // Utility is mixed - try to guess based on name
            if (nameLower.includes('health') || nameLower.includes('armor')) {
                return 'vitality';
            }
            if (nameLower.includes('cooldown') || nameLower.includes('spirit')) {
                return 'spirit';
            }
            return 'weapon'; // Default utility to weapon
        }
    }
    
    // Last resort: guess based on name patterns
    if (nameLower.includes('bullet') || nameLower.includes('shot') || 
        nameLower.includes('rounds') || nameLower.includes('ammo')) {
        return 'weapon';
    }
    if (nameLower.includes('health') || nameLower.includes('armor') || 
        nameLower.includes('healing') || nameLower.includes('vitality')) {
        return 'vitality';
    }
    if (nameLower.includes('cooldown') || nameLower.includes('spirit') || 
        nameLower.includes('ability')) {
        return 'spirit';
    }
    
    // Default to weapon if we can't determine
    return 'weapon';
}

// Helper function to generate the new image URL format
function generateItemImageUrl(item) {
    // Generate the correct image name (with exceptions handled)
    const snakeName = getItemImageName(item.name);
    const nameLower = item.name.toLowerCase();
    
    // Check if this item doesn't have optimized images - fallback only
    if (ITEMS_WITHOUT_OPTIMIZED_IMAGES.has(nameLower)) {
        const mapping = {
            name: item.name,
            snakeName: snakeName,
            apiImage: item.image || 'NO API IMAGE',
            detectedCategory: 'FALLBACK_ONLY',
            generatedUrl: 'SKIPPED - No optimized image available',
            apiCategory: item.image ? (item.image.match(/\/mods_(\w+)\//)?.[1] || 'unknown') : 'none',
            status: 'fallback_only'
        };
        window.itemImageMappings.push(mapping);
        
        return {
            primary: item.image || null,
            fallback: item.image || null
        };
    }
    
    // Use the API's item_slot_type if available, otherwise determine category
    const category = item.item_slot_type || determineItemCategory(item);
    
    // Build the new URL
    const newUrl = `https://assets-bucket.deadlock-api.com/assets-api-res/images/items/${category}/${snakeName}_sm.png`;
    
    // Store mapping for debugging
    const mapping = {
        name: item.name,
        snakeName: snakeName,
        apiImage: item.image || 'NO API IMAGE',
        detectedCategory: category,
        generatedUrl: newUrl,
        apiCategory: item.image ? (item.image.match(/\/mods_(\w+)\//)?.[1] || 'unknown') : 'none',
        status: 'optimized'
    };
    
    // Add to global mappings
    window.itemImageMappings.push(mapping);
    
    // Return URLs with fallback
    return {
        primary: newUrl,
        fallback: item.image || null
    };
}

function displaySimpleItemTable(container, itemsData, buildStats, itemStats, totalBuilds, heroesData) {
    // Store state for filters and sorting
    if (!window.itemStatsState) {
        window.itemStatsState = {
            categoryFilter: 'all',
            tierFilter: 'all',
            sortBy: 'usage',
            sortOrder: 'desc',
            heroFilter: 'all',
            view: 'table'
        };
    }
    
    // Create build stats lookup for usage data
    const buildStatsMap = new Map();
    if (buildStats) {
        buildStats.forEach(stat => {
            buildStatsMap.set(stat.item_id, stat);
        });
    }
    
    // Create item stats lookup for win rate data
    const itemStatsMap = new Map();
    if (itemStats) {
        itemStats.forEach(stat => {
            // Calculate win rate from wins and matches
            const winRate = stat.matches > 0 ? (stat.wins / stat.matches * 100) : 0;
            itemStatsMap.set(stat.item_id, {
                ...stat,
                winRate: winRate
            });
        });
    }
    
    
    // Filter for purchasable upgrade items - items with a cost value
    const items = itemsData
        .filter(item => {
            // Only include items that have a cost (purchasable items)
            // and are not test/debug items
            return item.name && 
                   item.cost !== undefined && 
                   item.cost !== null &&
                   parseInt(item.cost) > 0 &&
                   !item.class_name?.includes('test') &&
                   !item.class_name?.includes('debug') &&
                   !item.name.includes('Melee') &&
                   !item.class_name?.includes('weapon_set') &&
                   !item.class_name?.includes('ability_');
        })
        .map(item => {
            const buildData = buildStatsMap.get(item.id);
            const itemStatData = itemStatsMap.get(item.id);
            
            // Cost is at the root level of the item
            const cost = parseInt(item.cost) || 0;
            
            // Use actual tier and category from API
            const tier = item.item_tier || 1;
            const category = item.item_slot_type || 'unknown';
            
            // Calculate usage percentage from build data
            const usageCount = buildData ? buildData.builds : 0;
            const usagePercent = totalBuilds > 0 ? (usageCount / totalBuilds * 100) : 0;
            
            // Get win rate from item stats
            const winRate = itemStatData ? itemStatData.winRate : 0;
            const matches = itemStatData ? itemStatData.matches : 0;
            
            // Generate optimized image URLs
            const imageUrls = generateItemImageUrl(item);
            
            return {
                id: item.id,
                name: item.name,
                tier: tier,
                cost: cost,
                category: category, // weapon, vitality, or spirit
                image: item.image || item.image_webp,
                imageOptimized: imageUrls?.primary,
                imageFallback: imageUrls?.fallback || item.image || item.image_webp || null,
                usage: usageCount,
                usagePercent: usagePercent,
                winRate: winRate,
                matches: matches,
                wins: itemStatData ? itemStatData.wins : 0,
                hasData: !!buildData || !!itemStatData,
                hasWinData: !!itemStatData
            };
        })
        ;
    
    // Apply filters
    let filteredItems = items.filter(item => {
        // Hide items without win rate data
        if (!item.hasWinData || item.winRate <= 0) {
            return false;
        }
        
        // Category filter
        if (window.itemStatsState.categoryFilter !== 'all' && 
            item.category !== window.itemStatsState.categoryFilter) {
            return false;
        }
        
        // Tier filter
        if (window.itemStatsState.tierFilter !== 'all' && 
            item.tier !== parseInt(window.itemStatsState.tierFilter)) {
            return false;
        }
        
        return true;
    });
    
    // Apply sorting
    filteredItems.sort((a, b) => {
        let comparison = 0;
        
        switch (window.itemStatsState.sortBy) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'winrate':
                comparison = (a.winRate || 0) - (b.winRate || 0);
                break;
            case 'usage':
                comparison = a.usage - b.usage;
                break;
            case 'pickrate':
                comparison = a.usagePercent - b.usagePercent;
                break;
            default:
                comparison = a.usage - b.usage;
        }
        
        // Apply sort order
        return window.itemStatsState.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    
    // Output debug information
    
    // Count by status
    const optimizedItems = window.itemImageMappings.filter(m => m.status === 'optimized').length;
    const fallbackOnlyItems = window.itemImageMappings.filter(m => m.status === 'fallback_only').length;
    
    
    // Show mismatches (only for optimized items)
    const mismatches = window.itemImageMappings.filter(m => 
        m.status === 'optimized' &&
        m.apiCategory !== 'none' && m.apiCategory !== 'unknown' && 
        m.apiCategory !== m.detectedCategory && 
        !m.apiCategory.includes(m.detectedCategory)
    );
    
    if (mismatches.length > 0) {
        console.table(mismatches.slice(0, 10)); // Show first 10 mismatches
    } else {
    }
    
    // Show items without API images
    const noApiImage = window.itemImageMappings.filter(m => m.apiImage === 'NO API IMAGE');
    if (noApiImage.length > 0) {
        console.table(noApiImage.slice(0, 10)); // Show first 10
    }
    
    // Show fallback-only items
    const fallbackItems = window.itemImageMappings.filter(m => m.status === 'fallback_only');
    if (fallbackItems.length > 0) {
        console.table(fallbackItems.map(m => ({ name: m.name, reason: 'No optimized image available' })));
    }
    
    // Store in window for manual inspection
    
    const tierColors = {
        1: '#22c55e',  // Green - T1
        2: '#3b82f6',  // Blue - T2
        3: '#a855f7',  // Purple - T3
        4: '#ef4444'   // Red - T4
    };
    
    const categoryColors = {
        'weapon': '#f97316',   // Orange
        'vitality': '#22c55e',  // Green
        'spirit': '#a855f7'     // Purple
    };
    
    let html = `
        <div>
            <!-- Filter Controls -->
            <div class="item-stats-filters" style="margin-bottom: 1rem;">
                <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; margin-bottom: 1rem;">
                    <!-- Hero Filter -->
                    <div style="flex: 0 0 auto; min-width: 120px;">
                        <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Hero</label>
                        <select id="itemHeroFilter" class="form-input">
                            <option value="all">All Heroes</option>
                            ${heroesData && heroesData.length > 0 ? 
                                heroesData
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(hero => `<option value="${hero.id}" ${window.itemStatsState.heroFilter === hero.id.toString() ? 'selected' : ''}>${hero.name}</option>`)
                                    .join('')
                                : ''
                            }
                        </select>
                    </div>
                    
                    <!-- Category Filter -->
                    <div style="flex: 0 0 auto; min-width: 120px;">
                        <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Category</label>
                        <select id="itemCategoryFilter" class="form-input">
                            <option value="all">All Categories</option>
                            <option value="weapon" ${window.itemStatsState.categoryFilter === 'weapon' ? 'selected' : ''}>Weapon</option>
                            <option value="vitality" ${window.itemStatsState.categoryFilter === 'vitality' ? 'selected' : ''}>Vitality</option>
                            <option value="spirit" ${window.itemStatsState.categoryFilter === 'spirit' ? 'selected' : ''}>Spirit</option>
                        </select>
                    </div>
                    
                    <!-- Tier Filter -->
                    <div style="flex: 0 0 auto; min-width: 120px;">
                        <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Tier</label>
                        <select id="itemTierFilter" class="form-input">
                            <option value="all">All Tiers</option>
                            <option value="1" ${window.itemStatsState.tierFilter === '1' ? 'selected' : ''}>Tier 1</option>
                            <option value="2" ${window.itemStatsState.tierFilter === '2' ? 'selected' : ''}>Tier 2</option>
                            <option value="3" ${window.itemStatsState.tierFilter === '3' ? 'selected' : ''}>Tier 3</option>
                            <option value="4" ${window.itemStatsState.tierFilter === '4' ? 'selected' : ''}>Tier 4</option>
                        </select>
                    </div>
                    
                    <!-- Sort By -->
                    <div style="flex: 0 0 auto; min-width: 120px;">
                        <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Sort By</label>
                        <select id="itemSortBy" class="form-input">
                            <option value="name" ${window.itemStatsState.sortBy === 'name' ? 'selected' : ''}>Name</option>
                            <option value="winrate" ${window.itemStatsState.sortBy === 'winrate' ? 'selected' : ''}>Win Rate</option>
                            <option value="usage" ${window.itemStatsState.sortBy === 'usage' ? 'selected' : ''}>Usage</option>
                            <option value="pickrate" ${window.itemStatsState.sortBy === 'pickrate' ? 'selected' : ''}>Pick %</option>
                        </select>
                    </div>
                    
                    <!-- Sort Order -->
                    <div style="flex: 0; min-width: 100px;">
                        <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Order</label>
                        <button id="itemSortOrder" style="
                            width: 100%;
                            min-height: 44px;
                            background: var(--primary);
                            color: var(--secondary);
                            border: 2px solid var(--secondary);
                            padding: 0.75rem 1rem;
                            font-weight: 800;
                            text-transform: uppercase;
                            letter-spacing: 0.1em;
                            cursor: pointer;
                            transition: all 0.3s var(--ease-out);
                            font-size: 0.875rem;
                            box-sizing: border-box;
                        " onmouseover="this.style.background='var(--bg-card)'; this.style.borderColor='var(--accent)'" 
                           onmouseout="this.style.background='var(--primary)'; this.style.borderColor='var(--secondary)'">
                            ${window.itemStatsState.sortOrder === 'desc' ? '↓ DESC' : '↑ ASC'}
                        </button>
                    </div>
                    
                    <!-- View Toggle -->
                    <div style="flex: 0; min-width: 140px;">
                        <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">View</label>
                        <div class="item-view-controls" style="display: flex; gap: 0;">
                            <button id="itemViewCards" style="
                                flex: 1;
                                min-height: 44px;
                                background: ${window.itemStatsState.view === 'cards' ? 'var(--accent)' : 'var(--primary)'};
                                color: ${window.itemStatsState.view === 'cards' ? 'var(--primary)' : 'var(--secondary)'};
                                border: 2px solid var(--secondary);
                                border-right: none;
                                padding: 0.75rem 1rem;
                                font-weight: 800;
                                text-transform: uppercase;
                                letter-spacing: 0.1em;
                                cursor: pointer;
                                transition: all 0.3s var(--ease-out);
                                font-size: 0.875rem;
                                box-sizing: border-box;
                            " onmouseover="if('${window.itemStatsState.view}' !== 'cards') { this.style.background='var(--bg-card)'; }" 
                               onmouseout="if('${window.itemStatsState.view}' !== 'cards') { this.style.background='var(--primary)'; }">
                                CARDS
                            </button>
                            <button id="itemViewTable" style="
                                flex: 1;
                                min-height: 44px;
                                background: ${window.itemStatsState.view === 'table' ? 'var(--accent)' : 'var(--primary)'};
                                color: ${window.itemStatsState.view === 'table' ? 'var(--primary)' : 'var(--secondary)'};
                                border: 2px solid var(--secondary);
                                padding: 0.75rem 1rem;
                                font-weight: 800;
                                text-transform: uppercase;
                                letter-spacing: 0.1em;
                                cursor: pointer;
                                transition: all 0.3s var(--ease-out);
                                font-size: 0.875rem;
                                box-sizing: border-box;
                            " onmouseover="if('${window.itemStatsState.view}' !== 'table') { this.style.background='var(--bg-card)'; }" 
                               onmouseout="if('${window.itemStatsState.view}' !== 'table') { this.style.background='var(--primary)'; }">
                                TABLE
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Stats Summary -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; text-align: center;">
                    <div style="padding: 0 1rem;">
                        <div style="font-size: 1.5rem; font-weight: 900; color: var(--accent);">${filteredItems.length}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Showing</div>
                    </div>
                    <div style="border-left: 2px solid var(--border); border-right: 2px solid var(--border); padding: 0 1rem;">
                        <div style="font-size: 1.5rem; font-weight: 900; color: var(--secondary);">${items.length}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Total Items</div>
                    </div>
                    <div style="padding: 0 1rem;">
                        <div style="font-size: 1.5rem; font-weight: 900; color: var(--success);">${filteredItems.filter(i => i.hasData).length}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">With Stats</div>
                    </div>
                </div>
            </div>
            
            ${window.itemStatsState.view === 'cards' ? 
                `<div class="item-cards-grid" style="
                    display: grid;
                    grid-template-columns: ${isMobileDevice() ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))'};
                    gap: ${isMobileDevice() ? '0.5rem' : '1rem'};
                    padding: ${isMobileDevice() ? '0.25rem' : '1rem'};
                ">` :
                `<div style="
                    overflow-x: auto; 
                    -webkit-overflow-scrolling: touch;
                ">
                    <table style="width: 100%; border-collapse: collapse; background: var(--primary); border: 2px solid var(--secondary);">
                        <thead>
                            <tr style="background: var(--secondary); color: var(--primary);">
                                <th style="padding: 1rem; text-align: left; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid var(--primary);">#</th>
                                <th style="padding: 1rem; text-align: left; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid var(--primary);">Name</th>
                                <th style="padding: 1rem; text-align: center; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid var(--primary);">Tier</th>
                                <th style="padding: 1rem; text-align: center; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid var(--primary);">Category</th>
                                <th style="padding: 1rem; text-align: center; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid var(--primary);">
                                    Win Rate${window.itemStatsState.heroFilter !== 'all' && heroesData ? 
                                        `<br><span style="font-size: 0.7rem; opacity: 0.8;">(as ${heroesData.find(h => h.id.toString() === window.itemStatsState.heroFilter)?.name || 'Hero'})</span>` : 
                                        ''
                                    }
                                </th>
                                <th style="padding: 1rem; text-align: center; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid var(--primary);">Usage</th>
                                <th style="padding: 1rem; text-align: center; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid var(--primary);">Pick %</th>
                            </tr>
                        </thead>
                        <tbody>`
            }
    `;
    
    filteredItems.forEach((item, index) => {
        if (window.itemStatsState.view === 'cards') {
            // Card view
            html += `
                <div class="item-card" style="
                    background: var(--primary);
                    border: 2px solid var(--secondary);
                    border-radius: 0;
                    padding: 1.5rem;
                    transition: all 0.3s var(--ease-out);
                    position: relative;
                    overflow: hidden;
                " onmouseover="this.style.borderWidth='4px'; this.style.borderColor='var(--accent)'; this.style.boxShadow='0 0 0 2px var(--accent)';" 
                   onmouseout="this.style.borderWidth='2px'; this.style.borderColor='var(--secondary)'; this.style.boxShadow='none';">
                    
                    <!-- Card Header -->
                    <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem;">
                        ${(item.imageOptimized || item.imageFallback) ? `
                            <img 
                                src="${item.imageOptimized || item.imageFallback}" 
                                alt="${item.name}" 
                                loading="lazy"
                                onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';"
                                style="
                                    width: 64px;
                                    height: 64px;
                                    border-radius: 0;
                                    border: 2px solid var(--secondary);
                                    background: var(--primary);
                                    flex-shrink: 0;
                                "
                            />
                            <div style="
                                width: 64px;
                                height: 64px;
                                background: var(--primary);
                                border: 2px solid var(--secondary);
                                border-radius: 0;
                                display: none;
                                align-items: center;
                                justify-content: center;
                                font-size: 1.5rem;
                                color: var(--text-secondary);
                                flex-shrink: 0;
                            ">🛡️</div>
                        ` : `
                            <div style="
                                width: 64px;
                                height: 64px;
                                background: var(--primary);
                                border: 2px solid var(--secondary);
                                border-radius: 0;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 1.5rem;
                                color: var(--text-secondary);
                                flex-shrink: 0;
                            ">🛡️</div>
                        `}
                        
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <span style="
                                    background: var(--secondary);
                                    color: var(--primary);
                                    border: 2px solid var(--secondary);
                                    padding: 0.25rem 0.5rem;
                                    font-size: 0.75rem;
                                    font-weight: 800;
                                    text-transform: uppercase;
                                    letter-spacing: 0.05em;
                                    border-radius: 0;
                                ">#${index + 1}</span>
                                
                                <div style="
                                    background: var(--secondary);
                                    color: var(--primary);
                                    border: 2px solid ${tierColors[item.tier] || '#666'};
                                    padding: 0.25rem 0.5rem;
                                    font-weight: 800;
                                    text-transform: uppercase;
                                    letter-spacing: 0.05em;
                                    font-size: 0.75rem;
                                    border-radius: 0;
                                ">T${item.tier}</div>
                                
                                <div style="
                                    background: var(--secondary);
                                    color: var(--primary);
                                    border: 2px solid ${categoryColors[item.category] || '#666'};
                                    padding: 0.25rem 0.75rem;
                                    font-weight: 800;
                                    font-size: 0.7rem;
                                    border-radius: 0;
                                    text-transform: uppercase;
                                    letter-spacing: 0.05em;
                                ">${item.category}</div>
                            </div>
                            
                            <h3 style="
                                font-size: 1.25rem;
                                font-weight: 800;
                                color: var(--text-primary);
                                margin: 0 0 0.25rem 0;
                                line-height: 1.2;
                                text-transform: uppercase;
                                letter-spacing: 0.05em;
                            ">${item.name}</h3>
                            
                            <div style="
                                font-size: 0.875rem;
                                color: #fbbf24;
                                font-weight: 600;
                                display: flex;
                                align-items: center;
                                gap: 0.25rem;
                            ">
                                💰 ${item.cost.toLocaleString()} souls
                            </div>
                        </div>
                    </div>
                    
                    <!-- Card Stats -->
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 1rem;
                        margin-top: 1rem;
                        padding-top: 1rem;
                        border-top: 2px solid var(--secondary);
                    ">
                        <div style="text-align: center;">
                            <div style="
                                font-size: 1.5rem;
                                font-weight: 800;
                                color: ${item.winRate >= 52 ? '#22c55e' : item.winRate >= 48 ? '#fbbf24' : '#ef4444'};
                                margin-bottom: 0.25rem;
                            ">${item.winRate.toFixed(1)}%</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Win Rate</div>
                        </div>
                        
                        <div style="text-align: center;">
                            <div style="
                                font-size: 1.5rem;
                                font-weight: 800;
                                color: var(--text-primary);
                                margin-bottom: 0.25rem;
                            ">${item.usagePercent.toFixed(1)}%</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Usage</div>
                        </div>
                        
                        <div style="text-align: center;">
                            <div style="
                                font-size: 1.5rem;
                                font-weight: 800;
                                color: var(--secondary);
                                margin-bottom: 0.25rem;
                            ">${item.usagePercent.toFixed(1)}%</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Pick Rate</div>
                        </div>
                    </div>
                    
                    ${item.hasWinData && item.matches > 0 ? `
                        <div style="
                            margin-top: 1rem;
                            padding-top: 1rem;
                            border-top: 1px solid var(--border);
                            font-size: 0.75rem;
                            color: var(--text-secondary);
                            text-align: center;
                        ">
                            Based on ${item.matches.toLocaleString()} matches
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            // Table view
            html += `
                <tr style="border-bottom: 2px solid var(--border); transition: all 0.3s var(--ease-out);" 
                    onmouseover="this.style.background='var(--bg-card)'; this.style.borderColor='var(--accent)'" 
                    onmouseout="this.style.background='transparent'; this.style.borderColor='var(--border)'">
                    
                    <td style="padding: 0.75rem; color: var(--text-secondary); font-weight: 600;">
                        ${index + 1}
                    </td>
                
                <td style="padding: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        ${(item.imageOptimized || item.imageFallback) ? `
                            <img 
                                src="${item.imageOptimized || item.imageFallback}" 
                                alt="${item.name}" 
                                loading="lazy"
                                onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';"
                                style="
                                    width: 40px;
                                    height: 40px;
                                    object-fit: contain;
                                    border: 2px solid var(--secondary);
                                    background: var(--primary);
                                    border-radius: 0;
                                ">
                            <div style="
                                width: 40px;
                                height: 40px;
                                background: var(--primary);
                                border: 2px solid var(--secondary);
                                border-radius: 0;
                                display: none;
                                align-items: center;
                                justify-content: center;
                                font-size: 1.2rem;
                                color: var(--text-secondary);
                            ">🛡️</div>
                        ` : `
                            <div style="
                                width: 40px;
                                height: 40px;
                                background: var(--primary);
                                border: 2px solid var(--secondary);
                                border-radius: 0;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 1.2rem;
                                color: var(--text-secondary);
                            ">🛡️</div>
                        `}
                        <div>
                            <div style="font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em;">${item.name}</div>
                            <div style="font-size: 0.7rem; color: #fbbf24; margin-top: 0.125rem;">💰 ${item.cost.toLocaleString()}</div>
                        </div>
                    </div>
                </td>
                
                <td style="padding: 0.75rem; text-align: center;">
                    <div style="
                        background: var(--secondary);
                        color: var(--primary);
                        border: 2px solid ${tierColors[item.tier] || '#666'};
                        padding: 0.25rem 0.5rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        font-size: 0.8rem;
                        border-radius: 0;
                        display: inline-block;
                        min-width: 40px;
                    ">
                        T${item.tier}
                    </div>
                </td>
                
                <td style="padding: 0.75rem; text-align: center;">
                    <div style="
                        background: var(--secondary);
                        color: var(--primary);
                        border: 2px solid ${categoryColors[item.category] || '#666'};
                        padding: 0.25rem 0.75rem;
                        font-weight: 800;
                        font-size: 0.75rem;
                        border-radius: 0;
                        display: inline-block;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    ">
                        ${item.category}
                    </div>
                </td>
                
                <td style="padding: 0.75rem; text-align: center;">
                    ${item.hasWinData && item.winRate > 0 ? `
                        <div style="
                            font-size: 1rem;
                            font-weight: 700;
                            color: ${item.winRate >= 52 ? '#22c55e' : item.winRate >= 48 ? '#fbbf24' : '#ef4444'};
                        ">
                            ${item.winRate.toFixed(1)}%
                        </div>
                    ` : `
                        <span style="color: var(--text-secondary); font-style: italic;">-</span>
                    `}
                </td>
                
                <td style="padding: 0.75rem; text-align: center; font-weight: 600; color: var(--text-primary);">
                    ${item.usage > 0 ? `
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                            <span style="font-size: 1rem; font-weight: 700;">${item.usage.toLocaleString()}</span>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">builds</span>
                        </div>
                    ` : `
                        <span style="color: var(--text-secondary); font-style: italic;">-</span>
                    `}
                </td>
                
                <td style="padding: 0.75rem; text-align: center;">
                    ${item.usagePercent > 0 ? `
                        <div style="
                            font-size: 0.875rem;
                            font-weight: 600;
                            color: ${item.usagePercent >= 10 ? '#22c55e' : item.usagePercent >= 5 ? '#fbbf24' : 'var(--text-secondary)'};
                        ">
                            ${item.usagePercent.toFixed(2)}%
                        </div>
                    ` : `
                        <span style="color: var(--text-secondary); font-style: italic;">-</span>
                    `}
                </td>
            </tr>
            `;
        }
    });
    
    // Close the container based on view type
    if (window.itemStatsState.view === 'cards') {
        html += `</div>`;
    } else {
        html += `
                    </tbody>
                </table>
            </div>`;
    }
    
    html += `
            <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border); font-size: 0.875rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <strong style="color: var(--text-primary);">Legend:</strong>
                        <div style="margin-top: 0.25rem; color: var(--text-secondary);">
                            <div>• <span style="color: #22c55e;">Green</span> = High win rate (≥52%)</div>
                            <div>• <span style="color: #fbbf24;">Yellow</span> = Average (48-52%)</div>
                            <div>• <span style="color: #ef4444;">Red</span> = Low win rate (<48%)</div>
                        </div>
                    </div>
                    <div>
                        <strong style="color: var(--text-primary);">Tiers:</strong>
                        <div style="margin-top: 0.25rem; color: var(--text-secondary);">
                            <div>• T1 = Weapon items (500 souls)</div>
                            <div>• T2 = Vitality items (1,250+ souls)</div>
                            <div>• T3 = Spirit items (3,000+ souls)</div>
                            <div>• T4 = Flex items (6,200+ souls)</div>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    `;
    
    container.innerHTML = html;
    
    // Add event listeners for filters and sorting
    const heroFilter = document.getElementById('itemHeroFilter');
    const categoryFilter = document.getElementById('itemCategoryFilter');
    const tierFilter = document.getElementById('itemTierFilter');
    const sortBy = document.getElementById('itemSortBy');
    const sortOrder = document.getElementById('itemSortOrder');
    const viewCards = document.getElementById('itemViewCards');
    const viewTable = document.getElementById('itemViewTable');
    
    if (heroFilter) {
        heroFilter.addEventListener('change', async (e) => {
            window.itemStatsState.heroFilter = e.target.value;
            
            // Show loading state
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <div class="spinner" style="margin: 0 auto 1rem;"></div>
                    <p style="color: var(--text-primary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Loading hero-specific statistics...</p>
                </div>
            `;
            
            // Refetch data with hero filter
            const heroStatsData = await fetchItemStatistics(window.itemStatsState.heroFilter);
            displaySimpleItemTable(container, itemsData, heroStatsData.buildStats, heroStatsData.itemStats, heroStatsData.totalBuilds, heroesData);
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            window.itemStatsState.categoryFilter = e.target.value;
            displaySimpleItemTable(container, itemsData, buildStats, itemStats, totalBuilds, heroesData);
        });
    }
    
    if (tierFilter) {
        tierFilter.addEventListener('change', (e) => {
            window.itemStatsState.tierFilter = e.target.value;
            displaySimpleItemTable(container, itemsData, buildStats, itemStats, totalBuilds, heroesData);
        });
    }
    
    if (sortBy) {
        sortBy.addEventListener('change', (e) => {
            window.itemStatsState.sortBy = e.target.value;
            displaySimpleItemTable(container, itemsData, buildStats, itemStats, totalBuilds, heroesData);
        });
    }
    
    if (sortOrder) {
        sortOrder.addEventListener('click', () => {
            window.itemStatsState.sortOrder = window.itemStatsState.sortOrder === 'desc' ? 'asc' : 'desc';
            displaySimpleItemTable(container, itemsData, buildStats, itemStats, totalBuilds, heroesData);
        });
    }
    
    // View toggle event handlers
    if (viewCards) {
        viewCards.addEventListener('click', () => {
            window.itemStatsState.view = 'cards';
            displaySimpleItemTable(container, itemsData, buildStats, itemStats, totalBuilds, heroesData);
        });
    }
    
    if (viewTable) {
        viewTable.addEventListener('click', () => {
            window.itemStatsState.view = 'table';
            displaySimpleItemTable(container, itemsData, buildStats, itemStats, totalBuilds, heroesData);
        });
    }
    
}

// Export for global access
window.loadItemStats = initializeItemStats;
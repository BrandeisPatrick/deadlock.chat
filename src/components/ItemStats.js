// Item Statistics Module
// Main coordinator for item statistics functionality

import { ItemDataService } from '../services/ItemDataService.js';
import { ItemStatsTable } from './ItemStatsTable.js';
import { generateItemImageUrl } from '../utils/itemImageMapping.js';

export class ItemStats {
    constructor() {
        this.dataService = new ItemDataService();
        this.table = null;
        this.container = null;
    }

    /**
     * Initialize the item stats module
     */
    async initialize() {
        console.log('🎮 [Item Stats] Initializing item statistics...');
        
        // Find container
        this.container = document.getElementById('item-stats-container');
        if (!this.container) {
            console.error('❌ [Item Stats] Container not found');
            return;
        }

        // Show loading state
        this.showLoading();

        try {
            // Fetch all required data
            const [items, heroes, heroStats, buildStats, itemStats] = await Promise.all([
                this.dataService.fetchItems(),
                this.dataService.fetchHeroes(),
                this.dataService.fetchHeroStats(),
                this.dataService.fetchBuildStats(),
                this.dataService.fetchItemStats()
            ]);

            // Process the data
            const processedItems = this.processItemsData(items, buildStats, itemStats);
            console.log(`📊 [Item Stats] Processed ${processedItems.length} items for display`);

            // Initialize table component
            this.table = new ItemStatsTable(this.container);
            this.table.setHeroes(heroes, heroStats);
            this.table.setItems(processedItems);

            // Set up hero filter change handler
            this.setupHeroFilterHandler();

            console.log('✅ [Item Stats] Initialization complete');

        } catch (error) {
            console.error('❌ [Item Stats] Initialization failed:', error);
            this.showError('Failed to load item statistics. Please try refreshing the page.');
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div class="spinner" style="margin: 0 auto 1rem; width: 40px; height: 40px; border: 3px solid var(--border); border-top: 3px solid var(--accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="color: var(--text-primary);">Loading item statistics...</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    /**
     * Show error state
     */
    showError(message) {
        this.container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="color: var(--error); font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                <p style="color: var(--text-primary); margin-bottom: 1rem;">${message}</p>
                <button onclick="window.location.reload()" 
                        style="padding: 0.5rem 1rem; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }

    /**
     * Process items data by combining with build and win/loss statistics
     */
    processItemsData(items, buildStats, itemStats) {
        // Create lookup maps
        const buildDataMap = new Map();
        const itemStatDataMap = new Map();
        
        buildStats.forEach(stat => {
            buildDataMap.set(stat.item_id, stat);
        });

        itemStats.forEach(stat => {
            itemStatDataMap.set(stat.item_id, {
                ...stat,
                winRate: stat.wins && stat.matches ? (stat.wins / stat.matches) * 100 : 0
            });
        });

        // Calculate total builds for usage percentage
        const totalBuilds = buildStats.reduce((sum, stat) => sum + (stat.builds || 0), 0);
        console.log(`📊 [Item Stats] Total builds tracked: ${totalBuilds.toLocaleString()}`);

        // Filter and process items
        const processedItems = [];
        
        for (const item of items) {
            // Skip non-purchasable items
            if (!item.cost || parseInt(item.cost) <= 0) continue;
            if (item.class_name?.includes('test') || item.class_name?.includes('debug')) continue;
            if (item.name.includes('Melee')) continue;
            if (item.class_name?.includes('weapon_set')) continue;
            if (item.class_name?.includes('ability_')) continue;

            const itemId = item.id;
            const buildData = buildDataMap.get(itemId);
            const itemStatData = itemStatDataMap.get(itemId);

            // Calculate statistics
            const cost = parseInt(item.cost) || 0;
            const tier = item.item_tier || 1;
            const category = item.item_slot_type || 'unknown';
            
            const usageCount = buildData ? buildData.builds : 0;
            const usagePercent = totalBuilds > 0 ? (usageCount / totalBuilds * 100) : 0;
            
            const winRate = itemStatData ? itemStatData.winRate : 0;
            const matches = itemStatData ? itemStatData.matches : 0;

            // Generate image URLs
            const imageUrls = generateItemImageUrl(item);

            const processedItem = {
                id: itemId,
                name: item.name,
                cost: cost,
                tier: tier,
                category: category,
                usageCount: usageCount,
                usagePercent: usagePercent,
                winRate: winRate,
                matches: matches,
                imageUrls: imageUrls,
                // Keep original item data for debugging
                originalItem: item
            };

            processedItems.push(processedItem);
        }

        // Filter items with win rate data
        const itemsWithWinRate = processedItems.filter(item => item.winRate > 0);
        console.log(`📊 [Item Stats] Items with win rate data: ${itemsWithWinRate.length}`);

        // Sort by win rate descending
        itemsWithWinRate.sort((a, b) => b.winRate - a.winRate);

        return itemsWithWinRate;
    }

    /**
     * Set up hero filter change handler
     */
    setupHeroFilterHandler() {
        // Store original items for filtering
        this.originalItems = null;
        
        // Listen for hero filter changes (will be set up after render)
        const checkForHeroFilter = () => {
            const heroFilter = document.getElementById('hero-filter');
            if (heroFilter && !heroFilter.dataset.listenerAttached) {
                heroFilter.dataset.listenerAttached = 'true';
                heroFilter.addEventListener('change', async (e) => {
                    await this.handleHeroFilterChange(e.target.value);
                });
            } else if (!heroFilter) {
                // Try again after a short delay if filter not found
                setTimeout(checkForHeroFilter, 100);
            }
        };
        
        checkForHeroFilter();
    }

    /**
     * Handle hero filter change
     */
    async handleHeroFilterChange(selectedHeroId) {
        console.log(`🔄 [Item Stats] Filtering by hero: ${selectedHeroId}`);
        
        // Store original items if not already stored
        if (!this.originalItems && selectedHeroId !== 'all') {
            this.originalItems = this.table.items;
        }
        
        // Show loading state
        this.showLoading();
        
        try {
            let buildStats, itemStats;
            
            if (selectedHeroId === 'all') {
                // Reset to all heroes data
                if (this.originalItems) {
                    this.table.setItems(this.originalItems);
                    return;
                }
                // Fallback: refetch all data
                buildStats = await this.dataService.fetchBuildStats();
                itemStats = await this.dataService.fetchItemStats();
            } else {
                // Fetch hero-specific data
                const heroId = parseInt(selectedHeroId);
                buildStats = await this.dataService.fetchBuildStats(heroId);
                itemStats = await this.dataService.fetchItemStats(heroId);
            }
            
            // Get items data (should be cached)
            const items = await this.dataService.fetchItems();
            
            // Process the filtered data
            const processedItems = this.processItemsData(items, buildStats, itemStats);
            console.log(`📊 [Item Stats] Processed ${processedItems.length} hero-specific items`);
            
            // Update table with new data
            this.table.setItems(processedItems);
            
        } catch (error) {
            console.error('❌ [Item Stats] Hero filter failed:', error);
            this.showError('Failed to filter by hero. Please try again.');
        }
    }

    /**
     * Refresh data (useful for development)
     */
    async refresh() {
        this.dataService.clearCache();
        this.originalItems = null;
        await this.initialize();
    }
}

// Export for use in other modules
export async function initializeItemStats() {
    const itemStats = new ItemStats();
    await itemStats.initialize();
    
    // Make available globally for debugging
    window.itemStats = itemStats;
    
    return itemStats;
}
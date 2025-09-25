// Item Statistics Table Component
// Handles rendering and interaction for the item statistics table

import { generateItemImageUrl } from '../utils/itemImageMapping.js';

export class ItemStatsTable {
    constructor(container) {
        this.container = container;
        this.items = [];
        this.filteredItems = [];
        this.heroes = [];
        this.validHeroes = [];
        this.currentView = 'table';
        this.currentSort = { field: 'winRate', direction: 'desc' };
        this.currentFilters = {
            category: 'all',
            tier: 'all',
            hero: 'all',
            minWinRate: 0,
            maxWinRate: 100
        };
    }

    /**
     * Set the items data and trigger initial render
     */
    setItems(items) {
        this.items = items;
        this.filteredItems = [...items];
        this.applyFilters();
        this.render();
    }

    /**
     * Set hero data for filtering
     */
    setHeroes(heroes, heroStats) {
        this.heroes = heroes;
        
        // Create a map of hero stats for quick lookup
        const heroStatsMap = new Map();
        heroStats.forEach(stat => {
            if (stat.matches > 0 && stat.wins > 0) {
                heroStatsMap.set(stat.hero_id, {
                    matches: stat.matches,
                    wins: stat.wins,
                    winRate: (stat.wins / stat.matches) * 100
                });
            }
        });

        // Filter heroes that have valid stats
        this.validHeroes = heroes
            .filter(hero => heroStatsMap.has(hero.id))
            .map(hero => ({
                ...hero,
                stats: heroStatsMap.get(hero.id)
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        console.log(`📊 [Item Stats] Found ${this.validHeroes.length} heroes with valid stats`);
    }

    /**
     * Apply current filters to the items
     */
    applyFilters() {
        this.filteredItems = this.items.filter(item => {
            // Category filter
            if (this.currentFilters.category !== 'all' && item.category !== this.currentFilters.category) {
                return false;
            }
            
            // Tier filter
            if (this.currentFilters.tier !== 'all' && item.tier !== parseInt(this.currentFilters.tier)) {
                return false;
            }
            
            // Win rate filter
            const winRate = item.winRate || 0;
            if (winRate < this.currentFilters.minWinRate || winRate > this.currentFilters.maxWinRate) {
                return false;
            }
            
            return true;
        });
        
        this.sortItems();
    }

    /**
     * Sort items based on current sort settings
     */
    sortItems() {
        this.filteredItems.sort((a, b) => {
            let aVal = a[this.currentSort.field] || 0;
            let bVal = b[this.currentSort.field] || 0;
            
            // Handle string comparisons
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            const modifier = this.currentSort.direction === 'asc' ? 1 : -1;
            
            if (aVal < bVal) return -1 * modifier;
            if (aVal > bVal) return 1 * modifier;
            return 0;
        });
    }

    /**
     * Generate filter controls HTML
     */
    generateFilterControls() {
        // Generate hero options
        const heroOptions = this.validHeroes.map(hero => 
            `<option value="${hero.id}">${hero.name} (${hero.stats.matches.toLocaleString()} matches)</option>`
        ).join('');

        return `
            <div class="filter-controls" style="margin-bottom: 1rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
                <select id="category-filter" style="padding: 0.5rem; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px;">
                    <option value="all">All Categories</option>
                    <option value="weapon">Weapon</option>
                    <option value="vitality">Vitality</option>
                    <option value="spirit">Spirit</option>
                </select>
                
                <select id="tier-filter" style="padding: 0.5rem; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px;">
                    <option value="all">All Tiers</option>
                    <option value="1">Tier 1</option>
                    <option value="2">Tier 2</option>
                    <option value="3">Tier 3</option>
                    <option value="4">Tier 4</option>
                </select>

                <select id="hero-filter" style="padding: 0.5rem; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px; min-width: 180px;">
                    <option value="all">All Heroes (${this.validHeroes.length})</option>
                    ${heroOptions}
                </select>
                
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <label style="color: var(--text-secondary); font-size: 0.875rem;">Win Rate:</label>
                    <input type="number" id="min-winrate" value="0" min="0" max="100" 
                           style="width: 70px; padding: 0.25rem; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px;">
                    <span style="color: var(--text-secondary);">-</span>
                    <input type="number" id="max-winrate" value="100" min="0" max="100"
                           style="width: 70px; padding: 0.25rem; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px;">
                    <span style="color: var(--text-secondary); font-size: 0.875rem;">%</span>
                </div>
                
                <div style="display: flex; gap: 0.5rem;">
                    <button id="view-table" class="view-btn ${this.currentView === 'table' ? 'active' : ''}" 
                            style="padding: 0.5rem 1rem; background: ${this.currentView === 'table' ? 'var(--accent)' : 'var(--bg-card)'}; 
                                   color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px; cursor: pointer;">
                        Table
                    </button>
                    <button id="view-cards" class="view-btn ${this.currentView === 'cards' ? 'active' : ''}"
                            style="padding: 0.5rem 1rem; background: ${this.currentView === 'cards' ? 'var(--accent)' : 'var(--bg-card)'}; 
                                   color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px; cursor: pointer;">
                        Cards
                    </button>
                </div>
                
                <div style="margin-left: auto; color: var(--text-secondary); font-size: 0.875rem;">
                    Showing ${this.filteredItems.length} of ${this.items.length} items
                </div>
            </div>
        `;
    }

    /**
     * Generate table view HTML
     */
    generateTableView() {
        const rows = this.filteredItems.map(item => this.generateTableRow(item)).join('');
        
        return `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                    <thead>
                        <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border);">
                            <th class="sortable" data-field="name" style="padding: 1rem; text-align: left; cursor: pointer; user-select: none;">
                                Item ${this.getSortIcon('name')}
                            </th>
                            <th class="sortable" data-field="category" style="padding: 1rem; text-align: left; cursor: pointer; user-select: none;">
                                Category ${this.getSortIcon('category')}
                            </th>
                            <th class="sortable" data-field="tier" style="padding: 1rem; text-align: center; cursor: pointer; user-select: none;">
                                Tier ${this.getSortIcon('tier')}
                            </th>
                            <th class="sortable" data-field="cost" style="padding: 1rem; text-align: center; cursor: pointer; user-select: none;">
                                Cost ${this.getSortIcon('cost')}
                            </th>
                            <th class="sortable" data-field="winRate" style="padding: 1rem; text-align: center; cursor: pointer; user-select: none;">
                                Win Rate ${this.getSortIcon('winRate')}
                            </th>
                            <th class="sortable" data-field="matches" style="padding: 1rem; text-align: center; cursor: pointer; user-select: none;">
                                Matches ${this.getSortIcon('matches')}
                            </th>
                            <th class="sortable" data-field="usagePercent" style="padding: 1rem; text-align: center; cursor: pointer; user-select: none;">
                                Usage ${this.getSortIcon('usagePercent')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Generate a table row for an item
     */
    generateTableRow(item) {
        const imageUrls = generateItemImageUrl(item);
        const tierColor = this.getTierColor(item.tier);
        
        return `
            <tr style="border-bottom: 1px solid var(--border); transition: background-color 0.2s;" 
                onmouseover="this.style.background='var(--bg-secondary)'" 
                onmouseout="this.style.background='transparent'">
                <td style="padding: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        ${this.generateItemImage(imageUrls, item.name)}
                        <span style="font-weight: 500;">${item.name}</span>
                    </div>
                </td>
                <td style="padding: 1rem;">
                    <span style="color: ${this.getCategoryColor(item.category)}; text-transform: capitalize;">
                        ${item.category}
                    </span>
                </td>
                <td style="padding: 1rem; text-align: center;">
                    <span style="background: ${tierColor}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem;">
                        Tier ${item.tier}
                    </span>
                </td>
                <td style="padding: 1rem; text-align: center; font-family: var(--font-mono);">
                    ${item.cost ? item.cost.toLocaleString() : 'N/A'}
                </td>
                <td style="padding: 1rem; text-align: center;">
                    <span style="color: ${this.getWinRateColor(item.winRate)}; font-weight: 600;">
                        ${item.winRate ? item.winRate.toFixed(1) + '%' : 'N/A'}
                    </span>
                </td>
                <td style="padding: 1rem; text-align: center; font-family: var(--font-mono);">
                    ${item.matches ? item.matches.toLocaleString() : 'N/A'}
                </td>
                <td style="padding: 1rem; text-align: center;">
                    ${item.usagePercent ? item.usagePercent.toFixed(1) + '%' : 'N/A'}
                </td>
            </tr>
        `;
    }

    /**
     * Generate item image with fallback
     */
    generateItemImage(imageUrls, itemName) {
        return `
            <img src="${imageUrls.primary}" alt="${itemName}" loading="lazy"
                 onerror="this.onerror=null; this.src='${imageUrls.fallback || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMmEyYTJhIiByeD0iNCIvPgo8dGV4dCB4PSIyMCIgeT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+PzwvdGV4dD4KPC9zdmc+'}';"
                 style="width: 40px; height: 40px; object-fit: contain; border: 1px solid var(--border); 
                        background: rgba(0,0,0,0.1); border-radius: 4px;">
        `;
    }

    /**
     * Get sort indicator icon
     */
    getSortIcon(field) {
        if (this.currentSort.field !== field) return '↕️';
        return this.currentSort.direction === 'asc' ? '↑' : '↓';
    }

    /**
     * Get color for tier badge
     */
    getTierColor(tier) {
        const colors = {
            1: '#4a5568',
            2: '#2d3748', 
            3: '#1a202c',
            4: '#000000'
        };
        return colors[tier] || colors[1];
    }

    /**
     * Get color for category
     */
    getCategoryColor(category) {
        const colors = {
            weapon: '#ff6b6b',
            vitality: '#51cf66',
            spirit: '#74c0fc'
        };
        return colors[category] || '#ffffff';
    }

    /**
     * Get color for win rate
     */
    getWinRateColor(winRate) {
        if (!winRate) return 'var(--text-secondary)';
        if (winRate >= 55) return 'var(--success)';
        if (winRate <= 45) return 'var(--error)';
        return 'var(--text-primary)';
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Filter controls
        const categoryFilter = document.getElementById('category-filter');
        const tierFilter = document.getElementById('tier-filter');
        const heroFilter = document.getElementById('hero-filter');
        const minWinRate = document.getElementById('min-winrate');
        const maxWinRate = document.getElementById('max-winrate');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.applyFilters();
                this.render();
            });
        }

        if (tierFilter) {
            tierFilter.addEventListener('change', (e) => {
                this.currentFilters.tier = e.target.value;
                this.applyFilters();
                this.render();
            });
        }

        if (heroFilter) {
            heroFilter.addEventListener('change', (e) => {
                this.currentFilters.hero = e.target.value;
                this.applyFilters();
                this.render();
            });
        }

        // Sort controls
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', (e) => {
                const field = e.target.dataset.field;
                if (this.currentSort.field === field) {
                    this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.currentSort.field = field;
                    this.currentSort.direction = 'desc';
                }
                this.sortItems();
                this.render();
            });
        });
    }

    /**
     * Render the complete table component
     */
    render() {
        const html = `
            ${this.generateFilterControls()}
            ${this.generateTableView()}
        `;
        
        this.container.innerHTML = html;
        this.attachEventListeners();
    }
}
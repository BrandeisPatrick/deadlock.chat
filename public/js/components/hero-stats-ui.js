/**
 * Hero Stats UI Component
 * Pure UI rendering - no API calls, only accepts data and returns HTML
 */

class HeroStatsUI {
    constructor() {
        this.currentView = 'cards';
        this.currentSort = 'winrate';
    }

    /**
     * Main render method
     */
    render(heroes, options = {}) {
        const { view = this.currentView, sort = this.currentSort } = options;
        
        // Sort heroes based on criteria
        const sortedHeroes = this.sortHeroes(heroes, sort);
        
        // Render based on view type
        if (view === 'cards') {
            return this.renderCardView(sortedHeroes);
        } else {
            return this.renderTableView(sortedHeroes);
        }
    }

    /**
     * Render loading state
     */
    renderLoading() {
        return `
            <div style="text-align: center; padding: 2rem;">
                <div class="spinner" style="margin: 0 auto 1rem;"></div>
                <p style="color: var(--text-primary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Loading all heroes and analytics data...</p>
            </div>
        `;
    }

    /**
     * Render error state
     */
    renderError(error) {
        return `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <h3 style="margin-bottom: 0.5rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Failed to Load Heroes</h3>
                <p style="color: var(--text-secondary);">${error.message}</p>
                <button onclick="window.retryHeroStats()" class="btn">Retry</button>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    renderEmpty() {
        return `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🦸</div>
                <h3 style="font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">No Hero Data Available</h3>
                <p style="color: var(--text-secondary);">Hero statistics will appear here once data is loaded.</p>
            </div>
        `;
    }

    /**
     * Sort heroes based on criteria
     */
    sortHeroes(heroes, sortBy) {
        const heroArray = [...heroes]; // Create copy to avoid mutation
        
        switch (sortBy) {
            case 'winrate':
                return heroArray.sort((a, b) => b.winRate - a.winRate);
            case 'pickrate':
                return heroArray.sort((a, b) => b.pickRate - a.pickRate);
            case 'matches':
                return heroArray.sort((a, b) => b.matches - a.matches);
            case 'name':
                return heroArray.sort((a, b) => a.name.localeCompare(b.name));
            case 'tier':
                const tierOrder = { 'S': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'N/A': 5 };
                return heroArray.sort((a, b) => {
                    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
                    return tierDiff !== 0 ? tierDiff : b.winRate - a.winRate;
                });
            default:
                return heroArray.sort((a, b) => b.winRate - a.winRate);
        }
    }

    /**
     * Render card view
     */
    renderCardView(heroes) {
        const cards = heroes.map(hero => this.renderHeroCard(hero)).join('');
        
        return `
            <div style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 1rem;
                padding: 1rem;
                overflow-y: auto;
                max-height: none;
                width: 100%;
                box-sizing: border-box;
            ">
                ${cards}
            </div>
        `;
    }

    /**
     * Render individual hero card
     */
    renderHeroCard(hero) {
        const tierColor = this.getTierColor(hero.tier);
        const imageUrl = this.getHeroImageUrl(hero);
        const isLeaked = hero.matches === 0;
        
        return `
            <div class="hero-card" style="
                background: var(--primary);
                border: 2px solid var(--secondary);
                border-radius: 0;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.3s var(--ease-out);
                position: relative;
                ${isLeaked ? 'opacity: 0.6; filter: grayscale(50%);' : ''}
            " onmouseover="this.style.borderWidth='4px'; this.style.borderColor='var(--accent)'; this.style.boxShadow='0 0 0 2px var(--accent)'" 
               onmouseout="this.style.borderWidth='2px'; this.style.borderColor='var(--secondary)'; this.style.boxShadow='none'">
                
                <!-- Tier Badge -->
                <div style="
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    background: var(--secondary);
                    color: var(--primary);
                    border: 2px solid ${tierColor};
                    padding: 0.25rem 0.5rem;
                    border-radius: 0;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-size: 0.75rem;
                    z-index: 1;
                ">${isLeaked ? 'LEAKED' : hero.tier}</div>
                
                <!-- Leaked indicator -->
                ${isLeaked ? `
                <div style="
                    position: absolute;
                    top: 0.5rem;
                    left: 0.5rem;
                    background: #e74c3c;
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 0.65rem;
                    z-index: 1;
                ">🔒 UNRELEASED</div>
                ` : ''}
                
                <!-- Hero Image -->
                <div style="
                    width: 100%;
                    height: 120px;
                    background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.8)),
                                url('${imageUrl}') center/cover;
                    position: relative;
                ">
                    <div style="
                        position: absolute;
                        bottom: 0.5rem;
                        left: 0.5rem;
                        right: 0.5rem;
                        color: white;
                        font-weight: bold;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.8);
                    ">${hero.name}</div>
                </div>
                
                <!-- Stats -->
                <div style="padding: 0.75rem; background: var(--primary); border-top: 2px solid var(--secondary);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Win Rate</span>
                        <span style="color: ${this.getWinRateColor(hero.winRate)}; font-weight: 800;">
                            ${hero.winRate.toFixed(1)}%
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: var(--text-secondary); font-size: 0.75rem;">Pick Rate</span>
                        <span style="color: var(--text-primary);">${hero.pickRate.toFixed(1)}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Matches</span>
                        <span style="color: var(--text-primary); font-weight: 600;">${this.formatNumber(hero.matches)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">KDA</span>
                        <span style="color: var(--text-primary); font-weight: 600;">${hero.kda.ratio.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render table view
     */
    renderTableView(heroes) {
        const rows = heroes.map((hero, index) => this.renderHeroRow(hero, index + 1)).join('');
        
        return `
            <div style="overflow-x: auto; border: 2px solid var(--secondary); border-radius: 0;">
                <table style="width: 100%; border-collapse: collapse; background: var(--primary);">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--secondary); background: var(--secondary); color: var(--primary);">
                            <th style="text-align: left; padding: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">#</th>
                            <th style="text-align: left; padding: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Hero</th>
                            <th style="text-align: center; padding: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Tier</th>
                            <th style="text-align: right; padding: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Win Rate</th>
                            <th style="text-align: right; padding: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Pick Rate</th>
                            <th style="text-align: right; padding: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Matches</th>
                            <th style="text-align: center; padding: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">K/D/A</th>
                            <th style="text-align: right; padding: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">KDA</th>
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
     * Render individual hero row
     */
    renderHeroRow(hero, rank) {
        const tierColor = this.getTierColor(hero.tier);
        const imageUrl = this.getHeroImageUrl(hero);
        
        return `
            <tr style="border-bottom: 2px solid var(--border); transition: all 0.3s var(--ease-out);"
                onmouseover="this.style.background='var(--bg-card)'; this.style.borderColor='var(--accent)'"
                onmouseout="this.style.background='transparent'; this.style.borderColor='var(--border)'">
                
                <td style="padding: 1rem; color: var(--text-secondary); font-weight: 600;">${rank}</td>
                
                <td style="padding: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <img src="${imageUrl}" alt="${hero.name}" style="
                            width: 40px;
                            height: 40px;
                            border: 2px solid var(--secondary);
                            border-radius: 0;
                            object-fit: cover;
                        ">
                        <span style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${hero.name}</span>
                    </div>
                </td>
                
                <td style="padding: 1rem; text-align: center;">
                    <span style="
                        background: var(--secondary);
                        color: var(--primary);
                        border: 2px solid ${tierColor};
                        padding: 0.25rem 0.5rem;
                        border-radius: 0;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        font-size: 0.875rem;
                    ">${hero.tier}</span>
                </td>
                
                <td style="padding: 1rem; text-align: right; color: ${this.getWinRateColor(hero.winRate)}; font-weight: 800;">
                    ${hero.winRate.toFixed(1)}%
                </td>
                
                <td style="padding: 1rem; text-align: right; font-weight: 600;">
                    ${hero.pickRate.toFixed(1)}%
                </td>
                
                <td style="padding: 1rem; text-align: right; font-weight: 600;">
                    ${this.formatNumber(hero.matches)}
                </td>
                
                <td style="padding: 1rem; text-align: center; color: var(--text-secondary); font-family: var(--font-mono);">
                    ${hero.kda.kills}/${hero.kda.deaths}/${hero.kda.assists}
                </td>
                
                <td style="padding: 1rem; text-align: right; font-weight: 700;">
                    ${hero.kda.ratio.toFixed(2)}
                </td>
            </tr>
        `;
    }

    /**
     * Get hero image URL with fallback
     */
    getHeroImageUrl(hero) {
        if (hero.images?.selection_image) {
            return hero.images.selection_image;
        }
        if (hero.images?.icon_image_small) {
            return hero.images.icon_image_small;
        }

        // Use hero mapping function for consistent URL generation
        if (hero.id && window.getHeroImageUrl) {
            const mappedUrl = window.getHeroImageUrl(hero.id);
            if (mappedUrl) {
                return mappedUrl;
            }
        }

        // Fallback to CDN using className or name
        const heroSlug = hero.className?.replace('hero_', '') || hero.name.toLowerCase();
        return `https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/${heroSlug}_mm.webp`;
    }

    /**
     * Get tier color
     */
    getTierColor(tier) {
        const colors = {
            'S': 'var(--accent)',
            'A': '#00ff41',
            'B': '#ffa500',
            'C': '#ffff00',
            'D': '#a0a0a0',
            'N/A': 'var(--text-secondary)'
        };
        return colors[tier] || colors['N/A'];
    }

    /**
     * Get win rate color
     */
    getWinRateColor(winRate) {
        if (winRate >= 55) return 'var(--success)';
        if (winRate >= 52) return '#00ff41';
        if (winRate >= 48) return '#ffa500';
        if (winRate >= 45) return '#ff8041';
        return 'var(--error)';
    }

    /**
     * Format large numbers
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    /**
     * Update view setting
     */
    setView(view) {
        this.currentView = view;
    }

    /**
     * Update sort setting
     */
    setSort(sort) {
        this.currentSort = sort;
    }
}

// Export singleton instance
const heroStatsUI = new HeroStatsUI();
export default heroStatsUI;
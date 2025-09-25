/**
 * Simple Stats - Clean Version
 * Uses the new architecture with separated data and UI layers
 */

// Global variables for the modules
let heroDataService, heroStatsUI, appState;
let heroStatsController;

// Load modules and initialize
async function initializeModules() {
    try {
        const modules = await Promise.all([
            import('./services/hero-data-service.js'),
            import('./components/hero-stats-ui.js'),
            import('./state/app-state.js')
        ]);
        
        heroDataService = modules[0].default;
        heroStatsUI = modules[1].default;
        appState = modules[2].default;
        
        return true;
    } catch (error) {
        console.error('Failed to load refactored modules:', error);
        return false;
    }
}

// Controller class that coordinates between data and UI
class HeroStatsController {
    constructor() {
        this.container = null;
        this.unsubscribers = [];
        this.isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.initialized = false;
    }

    async initialize() {
        
        // Load modules first if not done already
        if (!heroDataService) {
            const success = await initializeModules();
            if (!success) {
                console.error('Failed to load modules, falling back to old implementation');
                return false;
            }
        }
        
        this.container = document.getElementById('hero-stats-container');
        if (!this.container) {
            console.error('Hero stats container not found');
            return false;
        }

        // Set up state subscriptions
        this.setupStateSubscriptions();
        
        // Set up UI event handlers
        this.setupEventHandlers();
        
        // Load initial data
        await this.loadHeroStats();
        
        this.initialized = true;
        return true;
    }

    setupStateSubscriptions() {
        if (!appState) return;
        
        // Subscribe to hero data changes
        const dataUnsubscribe = appState.subscribe('heroes.data', (heroes) => {
            if (heroes && heroes.length > 0) {
                this.renderWithLeakedToggle();
            }
        });
        this.unsubscribers.push(dataUnsubscribe);

        // Subscribe to view changes
        const viewUnsubscribe = appState.subscribe('heroes.view', () => {
            this.renderWithLeakedToggle();
        });
        this.unsubscribers.push(viewUnsubscribe);

        // Subscribe to sort changes
        const sortUnsubscribe = appState.subscribe('heroes.sort', () => {
            this.renderWithLeakedToggle();
        });
        this.unsubscribers.push(sortUnsubscribe);

        // Subscribe to loading state
        const loadingUnsubscribe = appState.subscribe('heroes.loading', (loading) => {
            if (loading && heroStatsUI) {
                this.container.innerHTML = heroStatsUI.renderLoading();
            }
        });
        this.unsubscribers.push(loadingUnsubscribe);

        // Subscribe to error state
        const errorUnsubscribe = appState.subscribe('heroes.error', (error) => {
            if (error && heroStatsUI) {
                this.container.innerHTML = heroStatsUI.renderError(error);
            }
        });
        this.unsubscribers.push(errorUnsubscribe);
    }

    setupEventHandlers() {
        // View toggle buttons
        document.addEventListener('click', (e) => {
            if (e.target.dataset.view && appState && heroStatsUI) {
                const view = e.target.dataset.view;
                appState.setHeroView(view);
                heroStatsUI.setView(view);
                
                // Update active button styling
                document.querySelectorAll('[data-view]').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.view === view);
                });
            }
        });

        // Sort selector
        const sortSelect = document.getElementById('heroSortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                if (appState && heroStatsUI) {
                    appState.setHeroSort(e.target.value);
                    heroStatsUI.setSort(e.target.value);
                }
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshHeroStats');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadHeroStats(true);
            });
        }

        // Global retry function for error state
        window.retryHeroStats = () => {
            this.loadHeroStats(true);
        };
    }

    async loadHeroStats(forceRefresh = false) {
        if (!heroDataService || !appState) {
            console.error('Modules not loaded');
            return;
        }

        try {
            // Set loading state
            appState.setHeroLoading(true);
            
            // Clear cache if force refresh
            if (forceRefresh) {
                heroDataService.clearCache();
            }

            // Check if we should use placeholder data for local development
            let heroesData = [];
            
            if (this.isLocal) {
                
                try {
                    const result = await heroDataService.getProcessedHeroStats();
                    
                    // Check if we got real data
                    const hasRealData = result.heroes.some(h => h.matches > 0);
                    
                    if (hasRealData) {
                        heroesData = result.heroes;
                        appState.setHeroData(result.heroes);
                    } else {
                        throw new Error('No real data available');
                    }
                } catch (error) {
                    
                    // Fetch heroes and generate placeholder data
                    const heroes = await heroDataService.getAllHeroes();
                    const placeholderData = heroDataService.generatePlaceholderData(heroes);
                    heroesData = placeholderData;
                    appState.setHeroData(placeholderData);
                }
            } else {
                // Production environment - fetch real data
                const result = await heroDataService.getProcessedHeroStats();
                heroesData = result.heroes;
                appState.setHeroData(result.heroes);
            }

            // Separate heroes with data from leaked heroes (zero matches)
            const activeHeroes = heroesData.filter(hero => hero.matches > 0);
            const leakedHeroes = heroesData.filter(hero => hero.matches === 0);
            
            
            // Store leaked heroes in appState for toggle functionality
            appState.setState('heroes.leakedHeroes', leakedHeroes);
            appState.setState('heroes.showLeaked', false);
            appState.setHeroData(activeHeroes); // Only show active heroes initially
            
            // Fix container styles to ensure scrolling works
            this.container.style.height = 'auto';
            
            // Setup the leaked heroes button
            this.setupLeakedHeroesButton(leakedHeroes);
            
            // Render heroes normally
            const html = heroStatsUI.render(activeHeroes, { view: 'cards', sort: 'winrate' });
            this.container.innerHTML = html;

            // Update status indicator
            const statusEl = document.getElementById('heroStatsStatus');
            if (statusEl) {
                statusEl.innerHTML = '<span>●</span><span>Live Data</span>';
                statusEl.className = 'status status-success';
            }

        } catch (error) {
            console.error('Error loading hero stats:', error);
            appState.setHeroError(error);
            
            // Update status indicator
            const statusEl = document.getElementById('heroStatsStatus');
            if (statusEl) {
                statusEl.innerHTML = '<span>●</span><span>Error</span>';
                statusEl.className = 'status status-error';
            }
        }
    }

    renderHeroes() {
        
        if (!appState || !heroStatsUI) {
            return;
        }
        
        const state = appState.getState('heroes');
        
        if (!state.data || state.data.length === 0) {
            this.container.innerHTML = heroStatsUI.renderEmpty();
            return;
        }

        const html = heroStatsUI.render(state.data, {
            view: state.view,
            sort: state.sort
        });
        
        this.container.innerHTML = html;
        
    }

    setupLeakedHeroesButton(leakedHeroes) {
        const toggleButton = document.getElementById('toggleLeakedHeroes');
        const buttonText = document.getElementById('leakedButtonText');
        
        if (leakedHeroes.length > 0) {
            // Show the button and set up click handler
            toggleButton.style.display = 'block';
            toggleButton.onclick = () => window.heroStats.toggleLeaked();
            
            // Update button text based on current state
            const showLeaked = appState.getState('heroes.showLeaked') || false;
            buttonText.textContent = showLeaked ? 'Hide Leaked' : 'Show Leaked';
        } else {
            // Hide the button if no leaked heroes
            toggleButton.style.display = 'none';
        }
    }

    renderWithLeakedToggle() {
        const state = appState.getState('heroes');
        const activeHeroes = state.data || [];
        const leakedHeroes = state.leakedHeroes || [];
        const showLeaked = state.showLeaked || false;
        
        // Determine which heroes to display
        const heroesToShow = showLeaked ? [...activeHeroes, ...leakedHeroes] : activeHeroes;
        
        // Update button text
        const buttonText = document.getElementById('leakedButtonText');
        if (buttonText) {
            buttonText.textContent = showLeaked ? 'Hide Leaked' : 'Show Leaked';
        }
        
        // Render heroes
        const html = heroStatsUI.render(heroesToShow, {
            view: state.view || 'cards',
            sort: state.sort || 'winrate'
        });
        
        this.container.innerHTML = html;
        
    }

    reRenderWithCurrentState() {
        if (!appState) return;
        
        this.renderWithLeakedToggle();
    }

    destroy() {
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];
        this.initialized = false;
    }
}

// Create controller instance
heroStatsController = new HeroStatsController();

// Enhanced window function for compatibility with existing code
window.loadHeroStats = async function() {
    
    try {
        const success = await heroStatsController.initialize();
        if (success) {
        } else {
            console.warn('Falling back to basic implementation');
            // Fallback to basic implementation here if needed
        }
    } catch (error) {
        console.error('Failed to load hero stats:', error);
    }
};

// Additional API for programmatic control
window.heroStats = {
    refresh: () => heroStatsController.loadHeroStats(true),
    setView: (view) => {
        if (appState && heroStatsUI) {
            appState.setHeroView(view);
            heroStatsUI.setView(view);
            // Re-render with current leaked state
            heroStatsController.reRenderWithCurrentState();
        }
    },
    setSort: (sort) => {
        if (appState && heroStatsUI) {
            appState.setHeroSort(sort);
            heroStatsUI.setSort(sort);
            // Re-render with current leaked state
            heroStatsController.reRenderWithCurrentState();
        }
    },
    toggleLeaked: () => {
        if (appState) {
            const currentState = appState.getState('heroes.showLeaked') || false;
            appState.setState('heroes.showLeaked', !currentState);
            // Re-render with new leaked state
            heroStatsController.reRenderWithCurrentState();
        }
    },
    getState: () => appState ? appState.getState('heroes') : null,
    controller: heroStatsController
};

// Register that the functions are available

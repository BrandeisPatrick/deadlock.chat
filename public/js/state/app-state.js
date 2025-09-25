/**
 * Application State Management
 * Central state store with observer pattern for reactive updates
 */

class AppState {
    constructor() {
        this.state = {
            heroes: {
                data: [],
                loading: false,
                error: null,
                lastUpdated: null,
                view: 'cards',
                sort: 'winrate',
                filter: null
            },
            items: {
                data: [],
                loading: false,
                error: null,
                lastUpdated: null,
                view: 'grid',
                category: 'all'
            },
            player: {
                currentPlayer: null,
                matchHistory: [],
                loading: false,
                error: null
            },
            ui: {
                activeSection: 'dashboard',
                sidebarCollapsed: false,
                theme: 'dark'
            }
        };
        
        this.listeners = new Map();
        this.nextListenerId = 1;
    }

    /**
     * Get current state or specific path
     */
    getState(path = null) {
        if (!path) return this.state;
        
        const keys = path.split('.');
        let current = this.state;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }
        
        return current;
    }

    /**
     * Update state and notify listeners
     */
    setState(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        let current = this.state;
        for (const key of keys) {
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
        
        const oldValue = current[lastKey];
        current[lastKey] = value;
        
        // Notify listeners
        this.notifyListeners(path, value, oldValue);
    }

    /**
     * Merge partial state update
     */
    mergeState(path, partialState) {
        const currentState = this.getState(path);
        if (typeof currentState === 'object' && !Array.isArray(currentState)) {
            const mergedState = { ...currentState, ...partialState };
            this.setState(path, mergedState);
        } else {
            this.setState(path, partialState);
        }
    }

    /**
     * Subscribe to state changes
     */
    subscribe(path, callback) {
        const id = this.nextListenerId++;
        
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Map());
        }
        
        this.listeners.get(path).set(id, callback);
        
        // Return unsubscribe function
        return () => {
            const pathListeners = this.listeners.get(path);
            if (pathListeners) {
                pathListeners.delete(id);
                if (pathListeners.size === 0) {
                    this.listeners.delete(path);
                }
            }
        };
    }

    /**
     * Notify listeners of state changes
     */
    notifyListeners(path, newValue, oldValue) {
        // Notify direct listeners
        const directListeners = this.listeners.get(path);
        if (directListeners) {
            directListeners.forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error(`Error in state listener for ${path}:`, error);
                }
            });
        }
        
        // Notify parent path listeners
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            const parentListeners = this.listeners.get(parentPath);
            if (parentListeners) {
                const parentState = this.getState(parentPath);
                parentListeners.forEach(callback => {
                    try {
                        callback(parentState, null, parentPath);
                    } catch (error) {
                        console.error(`Error in parent state listener for ${parentPath}:`, error);
                    }
                });
            }
        }
        
        // Notify wildcard listeners
        const wildcardListeners = this.listeners.get('*');
        if (wildcardListeners) {
            wildcardListeners.forEach(callback => {
                try {
                    callback(this.state, { path, newValue, oldValue }, '*');
                } catch (error) {
                    console.error('Error in wildcard state listener:', error);
                }
            });
        }
    }

    /**
     * Hero state helpers
     */
    setHeroData(heroes) {
        this.mergeState('heroes', {
            data: heroes,
            loading: false,
            error: null,
            lastUpdated: Date.now()
        });
    }

    setHeroLoading(loading) {
        this.setState('heroes.loading', loading);
    }

    setHeroError(error) {
        this.mergeState('heroes', {
            loading: false,
            error: error
        });
    }

    setHeroView(view) {
        this.setState('heroes.view', view);
    }

    setHeroSort(sort) {
        this.setState('heroes.sort', sort);
    }

    /**
     * Item state helpers
     */
    setItemData(items) {
        this.mergeState('items', {
            data: items,
            loading: false,
            error: null,
            lastUpdated: Date.now()
        });
    }

    setItemLoading(loading) {
        this.setState('items.loading', loading);
    }

    setItemError(error) {
        this.mergeState('items', {
            loading: false,
            error: error
        });
    }

    /**
     * Player state helpers
     */
    setCurrentPlayer(player) {
        this.setState('player.currentPlayer', player);
    }

    setMatchHistory(matches) {
        this.setState('player.matchHistory', matches);
    }

    /**
     * UI state helpers
     */
    setActiveSection(section) {
        this.setState('ui.activeSection', section);
    }

    toggleSidebar() {
        this.setState('ui.sidebarCollapsed', !this.state.ui.sidebarCollapsed);
    }

    /**
     * Reset state
     */
    reset() {
        this.state = {
            heroes: {
                data: [],
                loading: false,
                error: null,
                lastUpdated: null,
                view: 'cards',
                sort: 'winrate',
                filter: null
            },
            items: {
                data: [],
                loading: false,
                error: null,
                lastUpdated: null,
                view: 'grid',
                category: 'all'
            },
            player: {
                currentPlayer: null,
                matchHistory: [],
                loading: false,
                error: null
            },
            ui: {
                activeSection: 'dashboard',
                sidebarCollapsed: false,
                theme: 'dark'
            }
        };
        
        // Notify all listeners of reset
        this.notifyListeners('*', this.state, null);
    }

    /**
     * Debug helper - log current state
     */
    debug() {
        console.log('Current App State:', JSON.parse(JSON.stringify(this.state)));
        console.log('Active Listeners:', this.listeners.size);
        this.listeners.forEach((listeners, path) => {
            console.log(`  ${path}: ${listeners.size} listeners`);
        });
    }
}

// Export singleton instance
const appState = new AppState();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
    window.appState = appState;
}

export default appState;
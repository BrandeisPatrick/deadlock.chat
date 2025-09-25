/**
 * Container Query Polyfill - Provides container query functionality for older browsers
 * Enables component-level responsive design based on container width
 */
class ContainerQueryPolyfill {
    constructor() {
        this.containers = new Map();
        this.resizeObserver = null;
        this.mutationObserver = null;
        this.isSupported = this.checkNativeSupport();
        
        if (!this.isSupported) {
            this.init();
        }
    }
    
    /**
     * Check if container queries are natively supported
     */
    checkNativeSupport() {
        try {
            return CSS.supports('container-type: inline-size');
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Initialize the polyfill
     */
    init() {
        if (typeof ResizeObserver === 'undefined') {
            console.warn('ContainerQueryPolyfill: ResizeObserver not supported');
            return;
        }
        
        this.setupResizeObserver();
        this.setupMutationObserver();
        this.scanExistingElements();
    }
    
    /**
     * Setup ResizeObserver to watch container size changes
     */
    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                this.handleContainerResize(entry.target, entry.contentRect);
            });
        });
    }
    
    /**
     * Setup MutationObserver to watch for new elements
     */
    setupMutationObserver() {
        this.mutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.scanElement(node);
                    }
                });
            });
        });
        
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Scan existing elements for container query attributes
     */
    scanExistingElements() {
        this.scanElement(document.body);
    }
    
    /**
     * Scan an element and its children for container query attributes
     */
    scanElement(element) {
        // Check the element itself
        if (element.hasAttribute && element.hasAttribute('data-container-query')) {
            this.registerContainer(element);
        }
        
        // Check child elements
        if (element.querySelectorAll) {
            const containers = element.querySelectorAll('[data-container-query]');
            containers.forEach(container => {
                this.registerContainer(container);
            });
        }
    }
    
    /**
     * Register a container for container queries
     * Expected data-container-query format: "sm:320,md:480,lg:768"
     */
    registerContainer(container) {
        if (this.containers.has(container)) return;
        
        const queryString = container.getAttribute('data-container-query');
        if (!queryString) return;
        
        const queries = this.parseQueries(queryString);
        if (queries.length === 0) return;
        
        this.containers.set(container, queries);
        
        if (this.resizeObserver) {
            this.resizeObserver.observe(container);
        }
        
        // Initial check
        const rect = container.getBoundingClientRect();
        this.handleContainerResize(container, rect);
    }
    
    /**
     * Parse container query string into structured data
     * Format: "sm:320,md:480,lg:768" or "small:320px,medium:480px"
     */
    parseQueries(queryString) {
        const queries = [];
        const parts = queryString.split(',');
        
        parts.forEach(part => {
            const [name, widthStr] = part.trim().split(':');
            if (name && widthStr) {
                const width = parseInt(widthStr.replace('px', ''));
                if (!isNaN(width)) {
                    queries.push({
                        name: name.trim(),
                        minWidth: width,
                        className: `container-${name.trim()}`
                    });
                }
            }
        });
        
        // Sort by minWidth for proper application
        queries.sort((a, b) => a.minWidth - b.minWidth);
        
        return queries;
    }
    
    /**
     * Handle container resize and apply appropriate classes
     */
    handleContainerResize(container, rect) {
        const queries = this.containers.get(container);
        if (!queries) return;
        
        const width = rect.width;
        
        // Remove all container query classes first
        queries.forEach(query => {
            container.classList.remove(query.className);
        });
        
        // Apply classes for matching queries
        queries.forEach(query => {
            if (width >= query.minWidth) {
                container.classList.add(query.className);
            }
        });
        
        // Dispatch custom event for additional handling
        const event = new CustomEvent('containerresize', {
            detail: {
                width,
                height: rect.height,
                queries: queries.filter(q => width >= q.minWidth)
            }
        });
        container.dispatchEvent(event);
    }
    
    /**
     * Manually register a container with custom queries
     */
    register(container, queries) {
        if (!container) return;
        
        const parsedQueries = Array.isArray(queries) ? queries : this.parseQueries(queries);
        this.containers.set(container, parsedQueries);
        
        if (this.resizeObserver) {
            this.resizeObserver.observe(container);
        }
        
        // Initial check
        const rect = container.getBoundingClientRect();
        this.handleContainerResize(container, rect);
    }
    
    /**
     * Unregister a container
     */
    unregister(container) {
        if (!container) return;
        
        const queries = this.containers.get(container);
        if (queries) {
            // Remove all container query classes
            queries.forEach(query => {
                container.classList.remove(query.className);
            });
        }
        
        this.containers.delete(container);
        
        if (this.resizeObserver) {
            this.resizeObserver.unobserve(container);
        }
    }
    
    /**
     * Get current container state
     */
    getContainerState(container) {
        const queries = this.containers.get(container);
        if (!queries) return null;
        
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        
        return {
            width,
            height: rect.height,
            activeQueries: queries.filter(q => width >= q.minWidth),
            allQueries: queries
        };
    }
    
    /**
     * Update all containers (useful after layout changes)
     */
    updateAll() {
        this.containers.forEach((queries, container) => {
            const rect = container.getBoundingClientRect();
            this.handleContainerResize(container, rect);
        });
    }
    
    /**
     * Add predefined container query configurations
     */
    addPreset(name, queries) {
        this.presets = this.presets || new Map();
        this.presets.set(name, queries);
    }
    
    /**
     * Apply preset to container
     */
    applyPreset(container, presetName) {
        if (!this.presets || !this.presets.has(presetName)) {
            console.warn(`ContainerQueryPolyfill: Preset "${presetName}" not found`);
            return;
        }
        
        const queries = this.presets.get(presetName);
        this.register(container, queries);
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        this.containers.clear();
        
        if (this.presets) {
            this.presets.clear();
        }
    }
    
    /**
     * Get polyfill status and information
     */
    getStatus() {
        return {
            isNativeSupported: this.isSupported,
            isPolyfillActive: !this.isSupported,
            containerCount: this.containers.size,
            hasResizeObserver: typeof ResizeObserver !== 'undefined'
        };
    }
}

/**
 * Container Query Helper - Utility functions for working with container queries
 */
class ContainerQueryHelper {
    constructor(polyfill) {
        this.polyfill = polyfill;
    }
    
    /**
     * Create responsive grid with container queries
     */
    createResponsiveGrid(container, config = {}) {
        const defaultConfig = {
            queries: 'xs:0,sm:320,md:480,lg:768,xl:1024',
            gridClass: 'responsive-grid',
            ...config
        };
        
        container.classList.add(defaultConfig.gridClass);
        container.setAttribute('data-container-query', defaultConfig.queries);
        
        if (this.polyfill) {
            this.polyfill.registerContainer(container);
        }
    }
    
    /**
     * Create responsive card layout
     */
    createResponsiveCards(container, config = {}) {
        const defaultConfig = {
            queries: 'sm:320,md:480,lg:768',
            cardClass: 'responsive-card',
            ...config
        };
        
        container.classList.add('card-container');
        container.setAttribute('data-container-query', defaultConfig.queries);
        
        // Apply card class to children
        const cards = container.children;
        Array.from(cards).forEach(card => {
            card.classList.add(defaultConfig.cardClass);
        });
        
        if (this.polyfill) {
            this.polyfill.registerContainer(container);
        }
    }
    
    /**
     * Create responsive hero stats layout
     */
    createResponsiveHeroStats(container) {
        container.classList.add('hero-cards-grid');
        container.setAttribute('data-container-query', 'xs:0,sm:320,md:480,lg:768,xl:1024');
        
        if (this.polyfill) {
            this.polyfill.registerContainer(container);
        }
    }
    
    /**
     * Watch container for size changes
     */
    watchContainer(container, callback) {
        if (!container || typeof callback !== 'function') return;
        
        const handler = (event) => {
            callback(event.detail);
        };
        
        container.addEventListener('containerresize', handler);
        
        return () => {
            container.removeEventListener('containerresize', handler);
        };
    }
}

// Initialize global instance
let containerQueryPolyfill = null;
let containerQueryHelper = null;

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    const initPolyfill = () => {
        containerQueryPolyfill = new ContainerQueryPolyfill();
        containerQueryHelper = new ContainerQueryHelper(containerQueryPolyfill);
        
        // Add common presets
        containerQueryPolyfill.addPreset('mobile-first', [
            { name: 'xs', minWidth: 0, className: 'container-xs' },
            { name: 'sm', minWidth: 320, className: 'container-sm' },
            { name: 'md', minWidth: 480, className: 'container-md' },
            { name: 'lg', minWidth: 768, className: 'container-lg' },
            { name: 'xl', minWidth: 1024, className: 'container-xl' }
        ]);
        
        containerQueryPolyfill.addPreset('hero-stats', [
            { name: 'single', minWidth: 0, className: 'hero-single-col' },
            { name: 'double', minWidth: 480, className: 'hero-double-col' },
            { name: 'triple', minWidth: 720, className: 'hero-triple-col' },
            { name: 'quad', minWidth: 960, className: 'hero-quad-col' }
        ]);
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPolyfill);
    } else {
        initPolyfill();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ContainerQueryPolyfill, ContainerQueryHelper };
} else if (typeof window !== 'undefined') {
    window.ContainerQueryPolyfill = ContainerQueryPolyfill;
    window.ContainerQueryHelper = ContainerQueryHelper;
    
    // Make instances available globally
    Object.defineProperty(window, 'containerQueryPolyfill', {
        get: () => containerQueryPolyfill
    });
    
    Object.defineProperty(window, 'containerQueryHelper', {
        get: () => containerQueryHelper
    });
}
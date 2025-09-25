/**
 * ResponsiveGridSystem - Advanced grid system with dynamic column calculation
 * Provides intelligent grid layouts that adapt to viewport and container sizes
 */
class ResponsiveGridSystem {
    constructor(layoutController, containerQueryPolyfill) {
        this.layoutController = layoutController;
        this.containerQuery = containerQueryPolyfill;
        this.grids = new Map();
        this.defaultConfigs = new Map();
        
        this.init();
    }
    
    /**
     * Initialize the grid system
     */
    init() {
        this.setupDefaultConfigs();
        this.bindEvents();
        this.scanExistingGrids();
    }
    
    /**
     * Setup default grid configurations
     */
    setupDefaultConfigs() {
        // Hero statistics grid
        this.defaultConfigs.set('hero-stats', {
            minColumnWidth: 280,
            maxColumns: 4,
            gap: 'var(--space-md)',
            aspectRatio: null,
            breakpoints: {
                mobile: { columns: 1, minWidth: 250, gap: 'var(--space-sm)' },
                tablet: { columns: 2, minWidth: 280, gap: 'var(--space-md)' },
                desktop: { columns: 'auto', minWidth: 300, gap: 'var(--space-lg)' }
            },
            containerQueries: 'xs:0,sm:320,md:480,lg:768,xl:1024',
            itemClass: 'hero-card',
            responsive: true
        });
        
        // General card grid
        this.defaultConfigs.set('card-grid', {
            minColumnWidth: 300,
            maxColumns: 3,
            gap: 'var(--space-lg)',
            aspectRatio: null,
            breakpoints: {
                mobile: { columns: 1, minWidth: 280, gap: 'var(--space-md)' },
                tablet: { columns: 2, minWidth: 300, gap: 'var(--space-lg)' },
                desktop: { columns: 'auto', minWidth: 320, gap: 'var(--space-xl)' }
            },
            containerQueries: 'sm:320,md:480,lg:768,xl:1024',
            itemClass: 'grid-item',
            responsive: true
        });
        
        // Data visualization grid
        this.defaultConfigs.set('data-grid', {
            minColumnWidth: 200,
            maxColumns: 6,
            gap: 'var(--space-sm)',
            aspectRatio: '1/1',
            breakpoints: {
                mobile: { columns: 2, minWidth: 150, gap: 'var(--space-xs)' },
                tablet: { columns: 3, minWidth: 180, gap: 'var(--space-sm)' },
                desktop: { columns: 'auto', minWidth: 200, gap: 'var(--space-md)' }
            },
            containerQueries: 'xs:0,sm:320,md:480,lg:768',
            itemClass: 'data-item',
            responsive: true
        });
        
        // Compact grid for small items
        this.defaultConfigs.set('compact-grid', {
            minColumnWidth: 120,
            maxColumns: 8,
            gap: 'var(--space-xs)',
            aspectRatio: '1/1',
            breakpoints: {
                mobile: { columns: 3, minWidth: 100, gap: 'var(--space-xs)' },
                tablet: { columns: 4, minWidth: 120, gap: 'var(--space-sm)' },
                desktop: { columns: 'auto', minWidth: 140, gap: 'var(--space-sm)' }
            },
            containerQueries: 'xs:0,sm:320,md:480,lg:768',
            itemClass: 'compact-item',
            responsive: true
        });
    }
    
    /**
     * Create a responsive grid
     */
    createGrid(container, configName = 'card-grid', customConfig = {}) {
        if (!container) return null;
        
        const baseConfig = this.defaultConfigs.get(configName) || this.defaultConfigs.get('card-grid');
        const config = { ...baseConfig, ...customConfig };
        
        // Store grid configuration
        this.grids.set(container, {
            config,
            configName,
            lastUpdate: Date.now()
        });
        
        // Apply initial grid setup
        this.setupGridContainer(container, config);
        
        // Register for container queries if enabled
        if (config.responsive && this.containerQuery) {
            this.containerQuery.register(container, config.containerQueries);
        }
        
        // Apply initial layout
        this.updateGridLayout(container);
        
        return {
            container,
            config,
            update: () => this.updateGridLayout(container),
            destroy: () => this.destroyGrid(container)
        };
    }
    
    /**
     * Setup grid container with base styles
     */
    setupGridContainer(container, config) {
        container.classList.add('responsive-grid');
        container.style.display = 'grid';
        container.style.width = '100%';
        container.style.gap = config.gap;
        
        // Add configuration classes
        container.setAttribute('data-grid-type', config.configName || 'custom');
        
        // Apply aspect ratio if specified
        if (config.aspectRatio) {
            container.style.setProperty('--grid-aspect-ratio', config.aspectRatio);
        }
        
        // Setup grid items
        this.setupGridItems(container, config);
    }
    
    /**
     * Setup grid items with appropriate classes and styles
     */
    setupGridItems(container, config) {
        const items = container.children;
        
        Array.from(items).forEach(item => {
            if (config.itemClass) {
                item.classList.add(config.itemClass);
            }
            
            // Apply aspect ratio to items if specified
            if (config.aspectRatio) {
                item.style.aspectRatio = config.aspectRatio;
            }
            
            // Ensure items are properly sized
            item.style.minWidth = '0';
            item.style.minHeight = '0';
        });
    }
    
    /**
     * Update grid layout based on current container size
     */
    updateGridLayout(container) {
        const gridData = this.grids.get(container);
        if (!gridData) return;
        
        const { config } = gridData;
        const containerWidth = container.offsetWidth;
        
        if (containerWidth === 0) return; // Container not visible
        
        // Calculate optimal grid layout
        const layout = this.calculateGridLayout(containerWidth, config);
        
        // Apply layout to container
        this.applyGridLayout(container, layout, config);
        
        // Update last update timestamp
        gridData.lastUpdate = Date.now();
        
        // Dispatch custom event
        const event = new CustomEvent('gridupdate', {
            detail: { layout, config, containerWidth }
        });
        container.dispatchEvent(event);
    }
    
    /**
     * Calculate optimal grid layout
     */
    calculateGridLayout(containerWidth, config) {
        const viewport = this.layoutController.viewportManager.getCurrentViewport();
        const deviceType = viewport.deviceType;
        
        // Check if we have a device-specific breakpoint configuration
        const breakpointConfig = config.breakpoints[deviceType];
        
        if (breakpointConfig && breakpointConfig.columns !== 'auto') {
            return {
                columns: breakpointConfig.columns,
                columnWidth: Math.max(
                    breakpointConfig.minWidth,
                    containerWidth / breakpointConfig.columns
                ),
                gap: breakpointConfig.gap || config.gap,
                method: 'breakpoint'
            };
        }
        
        // Calculate based on minimum column width
        const minWidth = breakpointConfig?.minWidth || config.minColumnWidth;
        const possibleColumns = Math.floor(containerWidth / minWidth);
        const columns = Math.min(Math.max(1, possibleColumns), config.maxColumns);
        const actualColumnWidth = containerWidth / columns;
        
        return {
            columns,
            columnWidth: actualColumnWidth,
            gap: breakpointConfig?.gap || config.gap,
            method: 'calculated'
        };
    }
    
    /**
     * Apply calculated layout to grid container
     */
    applyGridLayout(container, layout, config) {
        // Apply grid template columns
        container.style.gridTemplateColumns = `repeat(${layout.columns}, 1fr)`;
        container.style.gap = layout.gap;
        
        // Add column count class
        container.classList.remove(...Array.from({ length: 8 }, (_, i) => `grid-${i + 1}-col`));
        container.classList.add(`grid-${layout.columns}-col`);
        
        // Add layout method class
        container.classList.toggle('grid-breakpoint-layout', layout.method === 'breakpoint');
        container.classList.toggle('grid-calculated-layout', layout.method === 'calculated');
        
        // Update CSS custom properties for advanced styling
        container.style.setProperty('--grid-columns', layout.columns);
        container.style.setProperty('--grid-column-width', `${layout.columnWidth}px`);
        container.style.setProperty('--grid-gap', layout.gap);
    }
    
    /**
     * Scan existing elements for grid attributes
     */
    scanExistingGrids() {
        const grids = document.querySelectorAll('[data-grid]');
        grids.forEach(grid => {
            const configName = grid.getAttribute('data-grid');
            const customConfig = this.parseGridConfig(grid);
            this.createGrid(grid, configName, customConfig);
        });
    }
    
    /**
     * Parse grid configuration from data attributes
     */
    parseGridConfig(element) {
        const config = {};
        
        // Parse data attributes
        const minWidth = element.getAttribute('data-grid-min-width');
        if (minWidth) config.minColumnWidth = parseInt(minWidth);
        
        const maxColumns = element.getAttribute('data-grid-max-columns');
        if (maxColumns) config.maxColumns = parseInt(maxColumns);
        
        const gap = element.getAttribute('data-grid-gap');
        if (gap) config.gap = gap;
        
        const aspectRatio = element.getAttribute('data-grid-aspect-ratio');
        if (aspectRatio) config.aspectRatio = aspectRatio;
        
        const itemClass = element.getAttribute('data-grid-item-class');
        if (itemClass) config.itemClass = itemClass;
        
        const responsive = element.getAttribute('data-grid-responsive');
        if (responsive !== null) config.responsive = responsive !== 'false';
        
        return config;
    }
    
    /**
     * Add custom grid configuration
     */
    addGridConfig(name, config) {
        this.defaultConfigs.set(name, config);
    }
    
    /**
     * Get grid configuration
     */
    getGridConfig(name) {
        return this.defaultConfigs.get(name);
    }
    
    /**
     * Update all grids
     */
    updateAllGrids() {
        this.grids.forEach((gridData, container) => {
            this.updateGridLayout(container);
        });
    }
    
    /**
     * Destroy a grid
     */
    destroyGrid(container) {
        if (!container) return;
        
        // Remove from tracking
        this.grids.delete(container);
        
        // Unregister from container queries
        if (this.containerQuery) {
            this.containerQuery.unregister(container);
        }
        
        // Remove grid classes
        container.classList.remove('responsive-grid');
        container.classList.remove(...Array.from({ length: 8 }, (_, i) => `grid-${i + 1}-col`));
        container.classList.remove('grid-breakpoint-layout', 'grid-calculated-layout');
        
        // Reset styles
        container.style.display = '';
        container.style.gridTemplateColumns = '';
        container.style.gap = '';
        container.removeAttribute('data-grid-type');
        
        // Remove custom properties
        container.style.removeProperty('--grid-columns');
        container.style.removeProperty('--grid-column-width');
        container.style.removeProperty('--grid-gap');
        container.style.removeProperty('--grid-aspect-ratio');
    }
    
    /**
     * Get grid statistics
     */
    getGridStats(container) {
        const gridData = this.grids.get(container);
        if (!gridData) return null;
        
        const containerWidth = container.offsetWidth;
        const layout = this.calculateGridLayout(containerWidth, gridData.config);
        
        return {
            containerWidth,
            layout,
            config: gridData.config,
            itemCount: container.children.length,
            lastUpdate: gridData.lastUpdate
        };
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Listen for viewport changes
        if (this.layoutController.viewportManager) {
            this.layoutController.viewportManager.onViewportChange(() => {
                // Debounce grid updates
                clearTimeout(this.updateTimeout);
                this.updateTimeout = setTimeout(() => {
                    this.updateAllGrids();
                }, 100);
            });
        }
        
        // Listen for DOM mutations to handle new grids
        if (typeof MutationObserver !== 'undefined') {
            this.mutationObserver = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.scanNewElement(node);
                        }
                    });
                });
            });
            
            this.mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
    
    /**
     * Scan new element for grid attributes
     */
    scanNewElement(element) {
        // Check the element itself
        if (element.hasAttribute && element.hasAttribute('data-grid')) {
            const configName = element.getAttribute('data-grid');
            const customConfig = this.parseGridConfig(element);
            this.createGrid(element, configName, customConfig);
        }
        
        // Check child elements
        if (element.querySelectorAll) {
            const grids = element.querySelectorAll('[data-grid]');
            grids.forEach(grid => {
                const configName = grid.getAttribute('data-grid');
                const customConfig = this.parseGridConfig(grid);
                this.createGrid(grid, configName, customConfig);
            });
        }
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        // Destroy all grids
        this.grids.forEach((_, container) => {
            this.destroyGrid(container);
        });
        
        // Cleanup observers
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        // Clear timeouts
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        // Clear maps
        this.grids.clear();
        this.defaultConfigs.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponsiveGridSystem;
} else if (typeof window !== 'undefined') {
    window.ResponsiveGridSystem = ResponsiveGridSystem;
}
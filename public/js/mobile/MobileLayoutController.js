/**
 * MobileLayoutController - Manages responsive layout adjustments and UI element positioning
 * Handles dynamic grid calculations, responsive card layouts, flexible spacing, and viewport-aware positioning
 */
class MobileLayoutController {
    constructor(viewportManager) {
        this.viewportManager = viewportManager;
        this.gridConfigs = new Map();
        this.spacingSystem = null;
        this.containerQueries = new Map();
        this.positionedElements = new WeakMap();
        this.repositionCallbacks = new Set();
        
        this.init();
    }
    
    /**
     * Initialize the layout controller
     */
    init() {
        this.setupSpacingSystem();
        this.setupGridSystem();
        this.setupContainerQueries();
        this.setupPositioningSystem();
        this.bindEvents();
    }
    
    /**
     * Setup UI element positioning system
     */
    setupPositioningSystem() {
        this.positioningConfig = {
            // Minimum distance from viewport edges (in pixels)
            edgeBuffer: 8,
            // Preferred positioning order for dropdowns
            dropdownPreference: ['bottom-left', 'bottom-right', 'top-left', 'top-right'],
            // Preferred positioning order for tooltips
            tooltipPreference: ['top', 'bottom', 'left', 'right'],
            // Modal positioning constraints
            modalConstraints: {
                minMargin: 16,
                maxWidth: '90vw',
                maxHeight: '90vh'
            }
        };
    }
    
    /**
     * Setup flexible spacing system that adapts to screen size
     */
    setupSpacingSystem() {
        this.spacingSystem = {
            // Base spacing values (in rem)
            base: {
                xs: 0.25,
                sm: 0.5,
                md: 1,
                lg: 1.5,
                xl: 2,
                '2xl': 3
            },
            
            // Mobile scaling factors
            mobile: {
                xs: 0.125,
                sm: 0.375,
                md: 0.75,
                lg: 1,
                xl: 1.25,
                '2xl': 1.5
            },
            
            // Tablet scaling factors
            tablet: {
                xs: 0.1875,
                sm: 0.4375,
                md: 0.875,
                lg: 1.25,
                xl: 1.625,
                '2xl': 2.25
            }
        };
        
        this.updateSpacingVariables();
    }
    
    /**
     * Update CSS custom properties for spacing based on device type
     */
    updateSpacingVariables() {
        const deviceType = this.viewportManager.getCurrentViewport().deviceType;
        const spacing = this.spacingSystem[deviceType] || this.spacingSystem.base;
        
        const root = document.documentElement;
        Object.entries(spacing).forEach(([key, value]) => {
            root.style.setProperty(`--space-${key}`, `${value}rem`);
        });
        
        // Set mobile-specific margin
        const mobileMargin = deviceType === 'mobile' ? '0.75rem' : '1rem';
        root.style.setProperty('--mobile-margin', mobileMargin);
    }
    
    /**
     * Setup dynamic grid system
     */
    setupGridSystem() {
        // Default grid configurations
        this.gridConfigs.set('hero-stats', {
            minColumnWidth: 280,
            maxColumns: 4,
            gap: 'var(--space-md)',
            breakpoints: {
                mobile: { columns: 1, minWidth: 250 },
                tablet: { columns: 2, minWidth: 280 },
                desktop: { columns: 'auto', minWidth: 300 }
            }
        });
        
        this.gridConfigs.set('card-grid', {
            minColumnWidth: 300,
            maxColumns: 3,
            gap: 'var(--space-lg)',
            breakpoints: {
                mobile: { columns: 1, minWidth: 280 },
                tablet: { columns: 2, minWidth: 300 },
                desktop: { columns: 'auto', minWidth: 320 }
            }
        });
        
        this.gridConfigs.set('data-grid', {
            minColumnWidth: 200,
            maxColumns: 6,
            gap: 'var(--space-sm)',
            breakpoints: {
                mobile: { columns: 1, minWidth: 180 },
                tablet: { columns: 3, minWidth: 200 },
                desktop: { columns: 'auto', minWidth: 220 }
            }
        });
    }
    
    /**
     * Calculate optimal grid columns based on viewport width
     */
    calculateGridColumns(containerWidth, config) {
        const { minColumnWidth, maxColumns, breakpoints } = config;
        const deviceType = this.viewportManager.getCurrentViewport().deviceType;
        
        // Use breakpoint-specific configuration if available
        if (breakpoints[deviceType]) {
            const breakpointConfig = breakpoints[deviceType];
            if (breakpointConfig.columns !== 'auto') {
                return {
                    columns: breakpointConfig.columns,
                    columnWidth: Math.max(breakpointConfig.minWidth, containerWidth / breakpointConfig.columns)
                };
            }
        }
        
        // Calculate based on container width and minimum column width
        const possibleColumns = Math.floor(containerWidth / minColumnWidth);
        const columns = Math.min(possibleColumns, maxColumns);
        const actualColumnWidth = containerWidth / columns;
        
        return {
            columns: Math.max(1, columns),
            columnWidth: actualColumnWidth
        };
    }
    
    /**
     * Apply grid layout to container
     */
    applyGridLayout(container, configName = 'card-grid') {
        if (!container) return;
        
        const config = this.gridConfigs.get(configName);
        if (!config) return;
        
        const containerWidth = container.offsetWidth;
        const { columns, columnWidth } = this.calculateGridColumns(containerWidth, config);
        
        // Apply CSS Grid properties
        container.style.display = 'grid';
        container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        container.style.gap = config.gap;
        container.style.width = '100%';
        
        // Add responsive class for additional styling
        container.classList.add(`grid-${columns}-col`);
        
        // Remove old grid classes
        for (let i = 1; i <= 6; i++) {
            if (i !== columns) {
                container.classList.remove(`grid-${i}-col`);
            }
        }
        
        return { columns, columnWidth };
    }
    
    /**
     * Create responsive card layout system for hero statistics
     */
    createHeroStatsLayout(container) {
        if (!container) return;
        
        const viewport = this.viewportManager.getCurrentViewport();
        const isMobile = viewport.deviceType === 'mobile';
        
        // Apply hero-specific grid configuration
        const gridResult = this.applyGridLayout(container, 'hero-stats');
        
        // Add hero-specific classes
        container.classList.add('hero-cards-grid');
        container.classList.toggle('mobile-layout', isMobile);
        
        // Configure card sizing within the grid
        const cards = container.querySelectorAll('.hero-card');
        cards.forEach(card => {
            this.optimizeHeroCard(card, isMobile);
        });
        
        return gridResult;
    }
    
    /**
     * Optimize individual hero card for mobile
     */
    optimizeHeroCard(card, isMobile) {
        if (!card) return;
        
        card.classList.toggle('mobile-card', isMobile);
        
        if (isMobile) {
            // Mobile-specific card optimizations
            card.style.padding = 'var(--space-sm)';
            card.style.borderRadius = '8px';
            
            // Optimize hero image size
            const heroImage = card.querySelector('.hero-image');
            if (heroImage) {
                heroImage.style.width = '40px';
                heroImage.style.height = '40px';
                heroImage.style.fontSize = '1rem';
            }
            
            // Optimize hero info
            const heroInfo = card.querySelector('.hero-info h3');
            if (heroInfo) {
                heroInfo.style.fontSize = '0.875rem';
                heroInfo.style.lineHeight = '1.2';
            }
            
            // Optimize stats grid
            const statsGrid = card.querySelector('.hero-stats');
            if (statsGrid) {
                statsGrid.style.gridTemplateColumns = '1fr 1fr';
                statsGrid.style.gap = 'var(--space-sm)';
            }
        } else {
            // Reset to default styles for larger screens
            card.style.padding = '';
            card.style.borderRadius = '';
        }
    }
    
    /**
     * Setup container query polyfill for component-level responsiveness
     */
    setupContainerQueries() {
        // Simple container query polyfill using ResizeObserver
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(entries => {
                entries.forEach(entry => {
                    this.handleContainerResize(entry.target, entry.contentRect);
                });
            });
        }
    }
    
    /**
     * Register container for container queries
     */
    registerContainer(container, queries) {
        if (!container || !this.resizeObserver) return;
        
        this.containerQueries.set(container, queries);
        this.resizeObserver.observe(container);
        
        // Initial check
        const rect = container.getBoundingClientRect();
        this.handleContainerResize(container, rect);
    }
    
    /**
     * Handle container resize for container queries
     */
    handleContainerResize(container, rect) {
        const queries = this.containerQueries.get(container);
        if (!queries) return;
        
        const width = rect.width;
        
        // Apply container query classes
        Object.entries(queries).forEach(([className, minWidth]) => {
            if (width >= minWidth) {
                container.classList.add(className);
            } else {
                container.classList.remove(className);
            }
        });
    }
    
    /**
     * Create responsive data table layout
     */
    createResponsiveTable(table) {
        if (!table) return;
        
        const viewport = this.viewportManager.getCurrentViewport();
        const isMobile = viewport.deviceType === 'mobile';
        
        if (isMobile) {
            // Convert table to card layout on mobile
            this.convertTableToCards(table);
        } else {
            // Restore table layout on larger screens
            this.restoreTableLayout(table);
        }
    }
    
    /**
     * Convert table to card layout for mobile
     */
    convertTableToCards(table) {
        if (!table || table.classList.contains('mobile-cards')) return;
        
        const rows = table.querySelectorAll('tbody tr');
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (headers[index]) {
                    cell.setAttribute('data-label', headers[index]);
                }
            });
        });
        
        table.classList.add('mobile-cards');
    }
    
    /**
     * Restore table layout from card layout
     */
    restoreTableLayout(table) {
        if (!table || !table.classList.contains('mobile-cards')) return;
        
        const cells = table.querySelectorAll('td[data-label]');
        cells.forEach(cell => {
            cell.removeAttribute('data-label');
        });
        
        table.classList.remove('mobile-cards');
    }
    
    /**
     * Update layout when viewport changes
     */
    updateLayout() {
        this.updateSpacingVariables();
        
        // Update all registered grids
        const grids = document.querySelectorAll('[data-grid]');
        grids.forEach(grid => {
            const configName = grid.dataset.grid || 'card-grid';
            this.applyGridLayout(grid, configName);
        });
        
        // Update hero stats layouts
        const heroGrids = document.querySelectorAll('.hero-cards-grid');
        heroGrids.forEach(grid => {
            this.createHeroStatsLayout(grid);
        });
        
        // Update responsive tables
        const tables = document.querySelectorAll('table[data-responsive]');
        tables.forEach(table => {
            this.createResponsiveTable(table);
        });
        
        // Reposition all tracked UI elements
        this.repositionAllElements();
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Listen for viewport changes
        this.viewportManager.onViewportChange(() => {
            this.updateLayout();
        });
        
        // Listen for DOM changes to auto-apply layouts
        if (typeof MutationObserver !== 'undefined') {
            this.mutationObserver = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.initializeNewElements(node);
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
     * Initialize layout for newly added elements
     */
    initializeNewElements(element) {
        // Auto-apply grid layouts
        if (element.hasAttribute('data-grid')) {
            const configName = element.dataset.grid || 'card-grid';
            this.applyGridLayout(element, configName);
        }
        
        // Auto-apply hero stats layout
        if (element.classList.contains('hero-cards-grid')) {
            this.createHeroStatsLayout(element);
        }
        
        // Auto-apply responsive table layout
        if (element.tagName === 'TABLE' && element.hasAttribute('data-responsive')) {
            this.createResponsiveTable(element);
        }
        
        // Check child elements
        const gridElements = element.querySelectorAll('[data-grid]');
        gridElements.forEach(grid => {
            const configName = grid.dataset.grid || 'card-grid';
            this.applyGridLayout(grid, configName);
        });
        
        const heroGrids = element.querySelectorAll('.hero-cards-grid');
        heroGrids.forEach(grid => {
            this.createHeroStatsLayout(grid);
        });
        
        const tables = element.querySelectorAll('table[data-responsive]');
        tables.forEach(table => {
            this.createResponsiveTable(table);
        });
    }
    
    /**
     * Get current spacing value for a given size
     */
    getSpacing(size) {
        const deviceType = this.viewportManager.getCurrentViewport().deviceType;
        const spacing = this.spacingSystem[deviceType] || this.spacingSystem.base;
        return spacing[size] || spacing.md;
    }
    
    /**
     * Add custom grid configuration
     */
    addGridConfig(name, config) {
        this.gridConfigs.set(name, config);
    }
    
    /**
     * Get grid configuration
     */
    getGridConfig(name) {
        return this.gridConfigs.get(name);
    }
    
    // ===== UI ELEMENT POSITIONING SYSTEM =====
    
    /**
     * Adjust dropdown position to keep it within viewport bounds
     * @param {HTMLElement} dropdown - The dropdown element to position
     * @param {HTMLElement} trigger - The element that triggered the dropdown
     * @param {Object} options - Positioning options
     */
    adjustDropdownPosition(dropdown, trigger, options = {}) {
        if (!dropdown || !trigger) return null;
        
        const viewport = this.viewportManager.getCurrentViewport();
        const safeAreas = this.viewportManager.getSafeAreas();
        const config = { ...this.positioningConfig, ...options };
        
        // Get trigger element bounds
        const triggerRect = trigger.getBoundingClientRect();
        const dropdownRect = dropdown.getBoundingClientRect();
        
        // Calculate available space in each direction
        const availableSpace = {
            top: triggerRect.top - safeAreas.top - config.edgeBuffer,
            bottom: viewport.height - triggerRect.bottom - safeAreas.bottom - config.edgeBuffer,
            left: triggerRect.left - safeAreas.left - config.edgeBuffer,
            right: viewport.width - triggerRect.right - safeAreas.right - config.edgeBuffer
        };
        
        // Find optimal position
        const optimalPosition = this.calculateOptimalDropdownPosition(
            triggerRect, 
            dropdownRect, 
            availableSpace, 
            config.dropdownPreference
        );
        
        // Apply positioning
        this.applyDropdownPosition(dropdown, trigger, optimalPosition);
        
        // Store positioning info for repositioning
        this.positionedElements.set(dropdown, {
            type: 'dropdown',
            trigger,
            position: optimalPosition,
            options: config
        });
        
        return optimalPosition;
    }
    
    /**
     * Calculate optimal dropdown position based on available space
     */
    calculateOptimalDropdownPosition(triggerRect, dropdownRect, availableSpace, preferences) {
        const positions = {
            'bottom-left': {
                x: triggerRect.left,
                y: triggerRect.bottom,
                fits: availableSpace.bottom >= dropdownRect.height && availableSpace.left >= dropdownRect.width
            },
            'bottom-right': {
                x: triggerRect.right - dropdownRect.width,
                y: triggerRect.bottom,
                fits: availableSpace.bottom >= dropdownRect.height && availableSpace.right >= dropdownRect.width
            },
            'top-left': {
                x: triggerRect.left,
                y: triggerRect.top - dropdownRect.height,
                fits: availableSpace.top >= dropdownRect.height && availableSpace.left >= dropdownRect.width
            },
            'top-right': {
                x: triggerRect.right - dropdownRect.width,
                y: triggerRect.top - dropdownRect.height,
                fits: availableSpace.top >= dropdownRect.height && availableSpace.right >= dropdownRect.width
            }
        };
        
        // Try preferred positions first
        for (const preference of preferences) {
            if (positions[preference] && positions[preference].fits) {
                return { ...positions[preference], placement: preference };
            }
        }
        
        // If no preferred position fits, find the best available space
        const bestFit = Object.entries(positions).reduce((best, [placement, pos]) => {
            const spaceScore = this.calculateSpaceScore(pos, availableSpace, placement);
            return spaceScore > best.score ? { placement, ...pos, score: spaceScore } : best;
        }, { score: -1 });
        
        return bestFit.score > -1 ? bestFit : positions['bottom-left'];
    }
    
    /**
     * Calculate space score for positioning
     */
    calculateSpaceScore(position, availableSpace, placement) {
        const [vertical, horizontal] = placement.split('-');
        let score = 0;
        
        // Prefer positions with more available space
        if (vertical === 'bottom') score += availableSpace.bottom;
        if (vertical === 'top') score += availableSpace.top;
        if (horizontal === 'left') score += availableSpace.left;
        if (horizontal === 'right') score += availableSpace.right;
        
        return score;
    }
    
    /**
     * Apply calculated position to dropdown
     */
    applyDropdownPosition(dropdown, trigger, position) {
        const viewport = this.viewportManager.getCurrentViewport();
        const safeAreas = this.viewportManager.getSafeAreas();
        
        // Ensure position stays within safe areas
        const constrainedX = Math.max(
            safeAreas.left + this.positioningConfig.edgeBuffer,
            Math.min(position.x, viewport.width - safeAreas.right - dropdown.offsetWidth - this.positioningConfig.edgeBuffer)
        );
        
        const constrainedY = Math.max(
            safeAreas.top + this.positioningConfig.edgeBuffer,
            Math.min(position.y, viewport.height - safeAreas.bottom - dropdown.offsetHeight - this.positioningConfig.edgeBuffer)
        );
        
        // Apply positioning styles
        dropdown.style.position = 'fixed';
        dropdown.style.left = `${constrainedX}px`;
        dropdown.style.top = `${constrainedY}px`;
        dropdown.style.zIndex = '1000';
        
        // Add positioning class for styling
        dropdown.classList.add('positioned-dropdown');
        dropdown.setAttribute('data-placement', position.placement || 'bottom-left');
    }
    
    /**
     * Position modal dialogs and overlays within safe areas
     * @param {HTMLElement} modal - The modal element to position
     * @param {Object} options - Positioning options
     */
    repositionModal(modal, options = {}) {
        if (!modal) return null;
        
        const viewport = this.viewportManager.getCurrentViewport();
        const safeAreas = this.viewportManager.getSafeAreas();
        const config = { ...this.positioningConfig.modalConstraints, ...options };
        
        // Calculate available space within safe areas
        const availableWidth = viewport.width - safeAreas.left - safeAreas.right - (config.minMargin * 2);
        const availableHeight = viewport.height - safeAreas.top - safeAreas.bottom - (config.minMargin * 2);
        
        // Calculate modal dimensions
        const modalWidth = Math.min(modal.offsetWidth, availableWidth, this.parseSize(config.maxWidth, viewport.width));
        const modalHeight = Math.min(modal.offsetHeight, availableHeight, this.parseSize(config.maxHeight, viewport.height));
        
        // Center modal within safe area
        const x = safeAreas.left + (availableWidth - modalWidth) / 2 + config.minMargin;
        const y = safeAreas.top + (availableHeight - modalHeight) / 2 + config.minMargin;
        
        // Apply positioning
        modal.style.position = 'fixed';
        modal.style.left = `${x}px`;
        modal.style.top = `${y}px`;
        modal.style.width = `${modalWidth}px`;
        modal.style.maxHeight = `${modalHeight}px`;
        modal.style.zIndex = '1050';
        modal.style.overflow = 'auto';
        
        // Add positioning class
        modal.classList.add('positioned-modal');
        
        // Store positioning info
        this.positionedElements.set(modal, {
            type: 'modal',
            position: { x, y, width: modalWidth, height: modalHeight },
            options: config
        });
        
        return { x, y, width: modalWidth, height: modalHeight };
    }
    
    /**
     * Create tooltip/popover positioning system with automatic edge detection
     * @param {HTMLElement} tooltip - The tooltip element to position
     * @param {HTMLElement} target - The target element the tooltip points to
     * @param {Object} options - Positioning options
     */
    positionTooltip(tooltip, target, options = {}) {
        if (!tooltip || !target) return null;
        
        const viewport = this.viewportManager.getCurrentViewport();
        const safeAreas = this.viewportManager.getSafeAreas();
        const config = { ...this.positioningConfig, ...options };
        
        // Get target element bounds
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // Calculate available space around target
        const availableSpace = {
            top: targetRect.top - safeAreas.top - config.edgeBuffer,
            bottom: viewport.height - targetRect.bottom - safeAreas.bottom - config.edgeBuffer,
            left: targetRect.left - safeAreas.left - config.edgeBuffer,
            right: viewport.width - targetRect.right - safeAreas.right - config.edgeBuffer
        };
        
        // Find optimal position
        const optimalPosition = this.calculateOptimalTooltipPosition(
            targetRect,
            tooltipRect,
            availableSpace,
            config.tooltipPreference
        );
        
        // Apply positioning
        this.applyTooltipPosition(tooltip, target, optimalPosition);
        
        // Store positioning info
        this.positionedElements.set(tooltip, {
            type: 'tooltip',
            target,
            position: optimalPosition,
            options: config
        });
        
        return optimalPosition;
    }
    
    /**
     * Calculate optimal tooltip position
     */
    calculateOptimalTooltipPosition(targetRect, tooltipRect, availableSpace, preferences) {
        const offset = 8; // Distance from target element
        
        const positions = {
            'top': {
                x: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
                y: targetRect.top - tooltipRect.height - offset,
                fits: availableSpace.top >= tooltipRect.height + offset
            },
            'bottom': {
                x: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
                y: targetRect.bottom + offset,
                fits: availableSpace.bottom >= tooltipRect.height + offset
            },
            'left': {
                x: targetRect.left - tooltipRect.width - offset,
                y: targetRect.top + (targetRect.height - tooltipRect.height) / 2,
                fits: availableSpace.left >= tooltipRect.width + offset
            },
            'right': {
                x: targetRect.right + offset,
                y: targetRect.top + (targetRect.height - tooltipRect.height) / 2,
                fits: availableSpace.right >= tooltipRect.width + offset
            }
        };
        
        // Try preferred positions first
        for (const preference of preferences) {
            if (positions[preference] && positions[preference].fits) {
                return { ...positions[preference], placement: preference };
            }
        }
        
        // Find position with most available space
        const bestFit = Object.entries(positions).reduce((best, [placement, pos]) => {
            const space = placement === 'top' || placement === 'bottom' ? 
                availableSpace[placement] : availableSpace[placement];
            return space > best.space ? { placement, ...pos, space } : best;
        }, { space: -1 });
        
        return bestFit.space > -1 ? bestFit : positions['bottom'];
    }
    
    /**
     * Apply calculated position to tooltip
     */
    applyTooltipPosition(tooltip, target, position) {
        const viewport = this.viewportManager.getCurrentViewport();
        const safeAreas = this.viewportManager.getSafeAreas();
        
        // Constrain position within viewport
        const constrainedX = Math.max(
            safeAreas.left + this.positioningConfig.edgeBuffer,
            Math.min(position.x, viewport.width - safeAreas.right - tooltip.offsetWidth - this.positioningConfig.edgeBuffer)
        );
        
        const constrainedY = Math.max(
            safeAreas.top + this.positioningConfig.edgeBuffer,
            Math.min(position.y, viewport.height - safeAreas.bottom - tooltip.offsetHeight - this.positioningConfig.edgeBuffer)
        );
        
        // Apply positioning
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${constrainedX}px`;
        tooltip.style.top = `${constrainedY}px`;
        tooltip.style.zIndex = '1100';
        
        // Add positioning classes
        tooltip.classList.add('positioned-tooltip');
        tooltip.setAttribute('data-placement', position.placement || 'bottom');
    }
    
    /**
     * Utility function to calculate optimal positioning for any floating element
     * @param {HTMLElement} element - The element to position
     * @param {HTMLElement} reference - The reference element (optional)
     * @param {Object} constraints - Positioning constraints
     */
    calculateOptimalPosition(element, reference = null, constraints = {}) {
        if (!element) return null;
        
        const viewport = this.viewportManager.getCurrentViewport();
        const safeAreas = this.viewportManager.getSafeAreas();
        const elementRect = element.getBoundingClientRect();
        
        const defaultConstraints = {
            preferredX: 'center',  // 'left', 'center', 'right'
            preferredY: 'center',  // 'top', 'center', 'bottom'
            offsetX: 0,
            offsetY: 0,
            minMargin: this.positioningConfig.edgeBuffer
        };
        
        const config = { ...defaultConstraints, ...constraints };
        
        // Calculate base position
        let x, y;
        
        if (reference) {
            const refRect = reference.getBoundingClientRect();
            
            // Calculate X position relative to reference
            switch (config.preferredX) {
                case 'left':
                    x = refRect.left + config.offsetX;
                    break;
                case 'right':
                    x = refRect.right - elementRect.width + config.offsetX;
                    break;
                case 'center':
                default:
                    x = refRect.left + (refRect.width - elementRect.width) / 2 + config.offsetX;
                    break;
            }
            
            // Calculate Y position relative to reference
            switch (config.preferredY) {
                case 'top':
                    y = refRect.top + config.offsetY;
                    break;
                case 'bottom':
                    y = refRect.bottom - elementRect.height + config.offsetY;
                    break;
                case 'center':
                default:
                    y = refRect.top + (refRect.height - elementRect.height) / 2 + config.offsetY;
                    break;
            }
        } else {
            // Center in viewport if no reference
            x = (viewport.width - elementRect.width) / 2 + config.offsetX;
            y = (viewport.height - elementRect.height) / 2 + config.offsetY;
        }
        
        // Constrain within safe areas
        const constrainedX = Math.max(
            safeAreas.left + config.minMargin,
            Math.min(x, viewport.width - safeAreas.right - elementRect.width - config.minMargin)
        );
        
        const constrainedY = Math.max(
            safeAreas.top + config.minMargin,
            Math.min(y, viewport.height - safeAreas.bottom - elementRect.height - config.minMargin)
        );
        
        return {
            x: constrainedX,
            y: constrainedY,
            width: elementRect.width,
            height: elementRect.height,
            constrained: constrainedX !== x || constrainedY !== y
        };
    }
    
    /**
     * Reposition all tracked elements (called on viewport changes)
     */
    repositionAllElements() {
        this.positionedElements.forEach((info, element) => {
            if (!document.contains(element)) {
                this.positionedElements.delete(element);
                return;
            }
            
            switch (info.type) {
                case 'dropdown':
                    this.adjustDropdownPosition(element, info.trigger, info.options);
                    break;
                case 'modal':
                    this.repositionModal(element, info.options);
                    break;
                case 'tooltip':
                    this.positionTooltip(element, info.target, info.options);
                    break;
            }
        });
        
        // Call registered reposition callbacks
        this.repositionCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.warn('Error in reposition callback:', error);
            }
        });
    }
    
    /**
     * Register a callback to be called when elements are repositioned
     */
    onReposition(callback) {
        this.repositionCallbacks.add(callback);
        return () => this.repositionCallbacks.delete(callback);
    }
    
    /**
     * Remove element from positioning tracking
     */
    untrackElement(element) {
        this.positionedElements.delete(element);
    }
    
    /**
     * Parse size value (supports px, %, vw, vh)
     */
    parseSize(size, referenceSize) {
        if (typeof size === 'number') return size;
        if (typeof size !== 'string') return 0;
        
        if (size.endsWith('px')) {
            return parseInt(size);
        } else if (size.endsWith('%')) {
            return (parseInt(size) / 100) * referenceSize;
        } else if (size.endsWith('vw')) {
            return (parseInt(size) / 100) * this.viewportManager.getCurrentViewport().width;
        } else if (size.endsWith('vh')) {
            return (parseInt(size) / 100) * this.viewportManager.getCurrentViewport().height;
        }
        
        return parseInt(size) || 0;
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
        
        this.gridConfigs.clear();
        this.containerQueries.clear();
        this.positionedElements = new WeakMap();
        this.repositionCallbacks.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileLayoutController;
} else if (typeof window !== 'undefined') {
    window.MobileLayoutController = MobileLayoutController;
}
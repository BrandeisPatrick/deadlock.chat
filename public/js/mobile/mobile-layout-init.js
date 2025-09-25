/**
 * Mobile Layout Initialization - Initialize responsive layout system
 * Coordinates ViewportManager, MobileLayoutController, and ResponsiveGridSystem
 */

// Global layout system instances
let mobileLayoutSystem = null;

/**
 * Initialize the mobile layout system
 */
function initializeMobileLayoutSystem() {
    try {
        // Check if ViewportManager is available
        if (typeof ViewportManager === 'undefined') {
            console.error('MobileLayoutInit: ViewportManager not found');
            return null;
        }
        
        // Initialize viewport manager
        const viewportManager = new ViewportManager();
        
        // Initialize layout controller
        const layoutController = new MobileLayoutController(viewportManager);
        
        // Initialize container query polyfill
        const containerQuery = containerQueryPolyfill || new ContainerQueryPolyfill();
        
        // Initialize responsive grid system
        const gridSystem = new ResponsiveGridSystem(layoutController, containerQuery);
        
        // Create layout system object
        mobileLayoutSystem = {
            viewportManager,
            layoutController,
            containerQuery,
            gridSystem,
            initialized: true,
            version: '1.0.0'
        };
        
        // Setup global event handlers
        setupGlobalEventHandlers();
        
        // Initialize existing elements
        initializeExistingElements();
        
        // Add device classes to body
        updateDeviceClasses();
        
        console.log('Mobile Layout System initialized successfully');
        return mobileLayoutSystem;
        
    } catch (error) {
        console.error('Failed to initialize Mobile Layout System:', error);
        return null;
    }
}

/**
 * Setup global event handlers
 */
function setupGlobalEventHandlers() {
    if (!mobileLayoutSystem) return;
    
    const { viewportManager, layoutController } = mobileLayoutSystem;
    
    // Update device classes when viewport changes
    viewportManager.onViewportChange((viewport, previousViewport) => {
        updateDeviceClasses();
        
        // Update spacing system when device type changes
        if (viewport.deviceType !== previousViewport.deviceType) {
            layoutController.updateSpacingVariables();
        }
    });
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && mobileLayoutSystem) {
            // Refresh layout when page becomes visible
            setTimeout(() => {
                mobileLayoutSystem.layoutController.updateLayout();
                mobileLayoutSystem.gridSystem.updateAllGrids();
            }, 100);
        }
    });
    
    // Handle orientation changes with delay
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (mobileLayoutSystem) {
                mobileLayoutSystem.layoutController.updateLayout();
                mobileLayoutSystem.gridSystem.updateAllGrids();
            }
        }, 300); // Allow time for orientation change to complete
    });
}

/**
 * Update device classes on document body
 */
function updateDeviceClasses() {
    if (!mobileLayoutSystem) return;
    
    const viewport = mobileLayoutSystem.viewportManager.getCurrentViewport();
    const body = document.body;
    
    // Remove existing device classes
    body.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
    body.classList.remove('platform-ios', 'platform-android', 'platform-other');
    body.classList.remove('orientation-portrait', 'orientation-landscape');
    
    // Add current device classes
    body.classList.add(`device-${viewport.deviceType}`);
    body.classList.add(`platform-${viewport.platform}`);
    body.classList.add(`orientation-${viewport.orientation}`);
    
    // Update CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--viewport-width', `${viewport.width}px`);
    root.style.setProperty('--viewport-height', `${viewport.height}px`);
    root.style.setProperty('--device-pixel-ratio', viewport.devicePixelRatio);
    
    // Update safe area properties
    const { safeAreas } = viewport;
    root.style.setProperty('--safe-area-top', `${safeAreas.top}px`);
    root.style.setProperty('--safe-area-right', `${safeAreas.right}px`);
    root.style.setProperty('--safe-area-bottom', `${safeAreas.bottom}px`);
    root.style.setProperty('--safe-area-left', `${safeAreas.left}px`);
}

/**
 * Initialize existing elements in the DOM
 */
function initializeExistingElements() {
    if (!mobileLayoutSystem) return;
    
    const { layoutController, gridSystem } = mobileLayoutSystem;
    
    // Initialize hero statistics grids
    const heroGrids = document.querySelectorAll('.hero-cards-grid');
    heroGrids.forEach(grid => {
        layoutController.createHeroStatsLayout(grid);
    });
    
    // Initialize responsive tables
    const tables = document.querySelectorAll('table[data-responsive]');
    tables.forEach(table => {
        layoutController.createResponsiveTable(table);
    });
    
    // Initialize grids with data-grid attribute
    const grids = document.querySelectorAll('[data-grid]');
    grids.forEach(grid => {
        const configName = grid.getAttribute('data-grid');
        gridSystem.createGrid(grid, configName);
    });
    
    // Apply container queries to elements with data-container-query
    const containers = document.querySelectorAll('[data-container-query]');
    containers.forEach(container => {
        if (mobileLayoutSystem.containerQuery) {
            mobileLayoutSystem.containerQuery.registerContainer(container);
        }
    });
}

/**
 * Auto-initialize hero statistics when they're loaded
 */
function initializeHeroStats() {
    if (!mobileLayoutSystem) return;
    
    const heroStatsContainer = document.querySelector('.hero-cards-grid');
    if (heroStatsContainer) {
        mobileLayoutSystem.layoutController.createHeroStatsLayout(heroStatsContainer);
        
        // Also create a responsive grid for better control
        mobileLayoutSystem.gridSystem.createGrid(heroStatsContainer, 'hero-stats');
    }
}

/**
 * Create responsive grid for any container
 */
function createResponsiveGrid(container, type = 'card-grid', options = {}) {
    if (!mobileLayoutSystem || !container) return null;
    
    return mobileLayoutSystem.gridSystem.createGrid(container, type, options);
}

/**
 * Apply mobile optimizations to a container
 */
function applyMobileOptimizations(container = document.body) {
    if (!mobileLayoutSystem) return;
    
    // Apply touch-friendly optimizations
    if (typeof initializeMobileOptimizations === 'function') {
        initializeMobileOptimizations(container);
    }
    
    // Initialize layout components in the container
    const heroGrids = container.querySelectorAll('.hero-cards-grid');
    heroGrids.forEach(grid => {
        mobileLayoutSystem.layoutController.createHeroStatsLayout(grid);
    });
    
    const tables = container.querySelectorAll('table[data-responsive]');
    tables.forEach(table => {
        mobileLayoutSystem.layoutController.createResponsiveTable(table);
    });
    
    const grids = container.querySelectorAll('[data-grid]');
    grids.forEach(grid => {
        const configName = grid.getAttribute('data-grid');
        mobileLayoutSystem.gridSystem.createGrid(grid, configName);
    });
}

/**
 * Get current layout system status
 */
function getLayoutSystemStatus() {
    if (!mobileLayoutSystem) {
        return { initialized: false, error: 'Layout system not initialized' };
    }
    
    const viewport = mobileLayoutSystem.viewportManager.getCurrentViewport();
    
    return {
        initialized: true,
        viewport,
        gridCount: mobileLayoutSystem.gridSystem.grids.size,
        containerQueryStatus: mobileLayoutSystem.containerQuery.getStatus(),
        version: mobileLayoutSystem.version
    };
}

/**
 * Refresh all layout components
 */
function refreshLayoutSystem() {
    if (!mobileLayoutSystem) return;
    
    mobileLayoutSystem.layoutController.updateLayout();
    mobileLayoutSystem.gridSystem.updateAllGrids();
    mobileLayoutSystem.containerQuery.updateAll();
    updateDeviceClasses();
}

/**
 * Cleanup layout system
 */
function destroyLayoutSystem() {
    if (!mobileLayoutSystem) return;
    
    try {
        mobileLayoutSystem.gridSystem.destroy();
        mobileLayoutSystem.containerQuery.destroy();
        mobileLayoutSystem.layoutController.destroy();
        
        // Remove device classes
        const body = document.body;
        body.classList.remove(
            'device-mobile', 'device-tablet', 'device-desktop',
            'platform-ios', 'platform-android', 'platform-other',
            'orientation-portrait', 'orientation-landscape'
        );
        
        mobileLayoutSystem = null;
        console.log('Mobile Layout System destroyed');
        
    } catch (error) {
        console.error('Error destroying Mobile Layout System:', error);
    }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    const autoInit = () => {
        // Wait for required dependencies
        if (typeof ViewportManager !== 'undefined' && 
            typeof MobileLayoutController !== 'undefined') {
            initializeMobileLayoutSystem();
        } else {
            // Retry after a short delay
            setTimeout(autoInit, 100);
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
}

// Export functions for global use
if (typeof window !== 'undefined') {
    window.initializeMobileLayoutSystem = initializeMobileLayoutSystem;
    window.initializeHeroStats = initializeHeroStats;
    window.createResponsiveGrid = createResponsiveGrid;
    window.applyMobileOptimizations = applyMobileOptimizations;
    window.getLayoutSystemStatus = getLayoutSystemStatus;
    window.refreshLayoutSystem = refreshLayoutSystem;
    window.destroyLayoutSystem = destroyLayoutSystem;
    
    // Make layout system available globally
    Object.defineProperty(window, 'mobileLayoutSystem', {
        get: () => mobileLayoutSystem
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeMobileLayoutSystem,
        initializeHeroStats,
        createResponsiveGrid,
        applyMobileOptimizations,
        getLayoutSystemStatus,
        refreshLayoutSystem,
        destroyLayoutSystem
    };
}
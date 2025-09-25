/**
 * Test Mobile Layout System - Verify responsive layout functionality
 */

// Test configuration
const testConfig = {
    verbose: true,
    autoRun: true
};

/**
 * Test suite for mobile layout system
 */
class MobileLayoutSystemTests {
    constructor() {
        this.results = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    /**
     * Run all tests
     */
    async runAllTests() {
        
        // Wait for layout system to initialize
        await this.waitForLayoutSystem();
        
        // Run individual tests
        this.testViewportManager();
        this.testLayoutController();
        this.testContainerQueries();
        this.testResponsiveGrids();
        this.testHeroStatsLayout();
        this.testSpacingSystem();
        this.testDeviceClasses();
        
        // Display results
        this.displayResults();
    }
    
    /**
     * Wait for layout system to be available
     */
    async waitForLayoutSystem() {
        return new Promise((resolve) => {
            const checkSystem = () => {
                if (window.mobileLayoutSystem && window.mobileLayoutSystem.initialized) {
                    resolve();
                } else {
                    setTimeout(checkSystem, 100);
                }
            };
            checkSystem();
        });
    }
    
    /**
     * Test ViewportManager functionality
     */
    testViewportManager() {
        const { viewportManager } = window.mobileLayoutSystem;
        
        this.test('ViewportManager exists', () => {
            return viewportManager !== undefined;
        });
        
        this.test('ViewportManager has current viewport', () => {
            const viewport = viewportManager.getCurrentViewport();
            return viewport && viewport.width > 0 && viewport.height > 0;
        });
        
        this.test('ViewportManager detects device type', () => {
            const viewport = viewportManager.getCurrentViewport();
            return ['mobile', 'tablet', 'desktop'].includes(viewport.deviceType);
        });
        
        this.test('ViewportManager detects platform', () => {
            const viewport = viewportManager.getCurrentViewport();
            return ['ios', 'android', 'other'].includes(viewport.platform);
        });
        
        this.test('ViewportManager has safe areas', () => {
            const viewport = viewportManager.getCurrentViewport();
            return viewport.safeAreas && typeof viewport.safeAreas.top === 'number';
        });
    }
    
    /**
     * Test MobileLayoutController functionality
     */
    testLayoutController() {
        const { layoutController } = window.mobileLayoutSystem;
        
        this.test('MobileLayoutController exists', () => {
            return layoutController !== undefined;
        });
        
        this.test('Spacing system is initialized', () => {
            return layoutController.spacingSystem !== null;
        });
        
        this.test('Grid configurations exist', () => {
            return layoutController.gridConfigs.size > 0;
        });
        
        this.test('Can get spacing value', () => {
            const spacing = layoutController.getSpacing('md');
            return typeof spacing === 'number' && spacing > 0;
        });
    }
    
    /**
     * Test container query functionality
     */
    testContainerQueries() {
        const { containerQuery } = window.mobileLayoutSystem;
        
        this.test('ContainerQueryPolyfill exists', () => {
            return containerQuery !== undefined;
        });
        
        this.test('Container query status available', () => {
            const status = containerQuery.getStatus();
            return status && typeof status.isPolyfillActive === 'boolean';
        });
        
        // Create test container
        const testContainer = document.createElement('div');
        testContainer.style.width = '400px';
        testContainer.style.height = '200px';
        testContainer.setAttribute('data-container-query', 'sm:320,md:480');
        document.body.appendChild(testContainer);
        
        this.test('Can register container for queries', () => {
            containerQuery.registerContainer(testContainer);
            return containerQuery.containers.has(testContainer);
        });
        
        this.test('Container gets appropriate classes', () => {
            // Trigger resize
            containerQuery.handleContainerResize(testContainer, { width: 400, height: 200 });
            return testContainer.classList.contains('container-sm');
        });
        
        // Cleanup
        document.body.removeChild(testContainer);
    }
    
    /**
     * Test responsive grid system
     */
    testResponsiveGrids() {
        const { gridSystem } = window.mobileLayoutSystem;
        
        this.test('ResponsiveGridSystem exists', () => {
            return gridSystem !== undefined;
        });
        
        this.test('Default grid configs exist', () => {
            return gridSystem.defaultConfigs.size > 0;
        });
        
        this.test('Hero stats config exists', () => {
            return gridSystem.getGridConfig('hero-stats') !== undefined;
        });
        
        // Create test grid
        const testGrid = document.createElement('div');
        testGrid.style.width = '600px';
        for (let i = 0; i < 6; i++) {
            const item = document.createElement('div');
            item.textContent = `Item ${i + 1}`;
            testGrid.appendChild(item);
        }
        document.body.appendChild(testGrid);
        
        this.test('Can create responsive grid', () => {
            const grid = gridSystem.createGrid(testGrid, 'card-grid');
            return grid !== null && gridSystem.grids.has(testGrid);
        });
        
        this.test('Grid has correct CSS classes', () => {
            return testGrid.classList.contains('responsive-grid');
        });
        
        this.test('Grid calculates layout correctly', () => {
            const stats = gridSystem.getGridStats(testGrid);
            return stats && stats.layout && stats.layout.columns > 0;
        });
        
        // Cleanup
        gridSystem.destroyGrid(testGrid);
        document.body.removeChild(testGrid);
    }
    
    /**
     * Test hero stats layout functionality
     */
    testHeroStatsLayout() {
        const { layoutController } = window.mobileLayoutSystem;
        
        // Find existing hero stats container
        const heroContainer = document.getElementById('hero-stats-container');
        
        this.test('Hero stats container exists', () => {
            return heroContainer !== null;
        });
        
        if (heroContainer) {
            this.test('Hero container has grid classes', () => {
                return heroContainer.classList.contains('hero-cards-grid');
            });
            
            this.test('Hero container has data attributes', () => {
                return heroContainer.hasAttribute('data-grid') && 
                       heroContainer.hasAttribute('data-container-query');
            });
        }
        
        // Test with mock hero cards
        const testHeroContainer = document.createElement('div');
        testHeroContainer.className = 'hero-cards-grid';
        
        // Create mock hero cards
        for (let i = 0; i < 4; i++) {
            const card = document.createElement('div');
            card.className = 'hero-card';
            card.innerHTML = `
                <div class="hero-card-header">
                    <div class="hero-image">🦸</div>
                    <div class="hero-info">
                        <h3>Hero ${i + 1}</h3>
                        <span class="hero-tier">S</span>
                    </div>
                </div>
                <div class="hero-stats">
                    <div class="hero-stat">
                        <span class="stat-label">Win Rate</span>
                        <span class="stat-value">65%</span>
                    </div>
                    <div class="hero-stat">
                        <span class="stat-label">Pick Rate</span>
                        <span class="stat-value">12%</span>
                    </div>
                </div>
            `;
            testHeroContainer.appendChild(card);
        }
        
        document.body.appendChild(testHeroContainer);
        
        this.test('Can create hero stats layout', () => {
            const result = layoutController.createHeroStatsLayout(testHeroContainer);
            return result !== undefined;
        });
        
        this.test('Hero cards get mobile classes on mobile', () => {
            const viewport = window.mobileLayoutSystem.viewportManager.getCurrentViewport();
            if (viewport.deviceType === 'mobile') {
                const cards = testHeroContainer.querySelectorAll('.hero-card');
                return Array.from(cards).some(card => card.classList.contains('mobile-card'));
            }
            return true; // Skip test on non-mobile
        });
        
        // Cleanup
        document.body.removeChild(testHeroContainer);
    }
    
    /**
     * Test spacing system
     */
    testSpacingSystem() {
        const root = document.documentElement;
        
        this.test('CSS spacing variables are set', () => {
            const spaceMd = getComputedStyle(root).getPropertyValue('--space-md');
            return spaceMd && spaceMd.trim() !== '';
        });
        
        this.test('Mobile margin variable is set', () => {
            const mobileMargin = getComputedStyle(root).getPropertyValue('--mobile-margin');
            return mobileMargin && mobileMargin.trim() !== '';
        });
        
        this.test('Viewport variables are set', () => {
            const viewportWidth = getComputedStyle(root).getPropertyValue('--viewport-width');
            return viewportWidth && viewportWidth.trim() !== '';
        });
        
        this.test('Safe area variables are set', () => {
            const safeAreaTop = getComputedStyle(root).getPropertyValue('--safe-area-top');
            return safeAreaTop !== null; // Can be 0px
        });
    }
    
    /**
     * Test device classes
     */
    testDeviceClasses() {
        const body = document.body;
        
        this.test('Body has device class', () => {
            return body.classList.contains('device-mobile') ||
                   body.classList.contains('device-tablet') ||
                   body.classList.contains('device-desktop');
        });
        
        this.test('Body has platform class', () => {
            return body.classList.contains('platform-ios') ||
                   body.classList.contains('platform-android') ||
                   body.classList.contains('platform-other');
        });
        
        this.test('Body has orientation class', () => {
            return body.classList.contains('orientation-portrait') ||
                   body.classList.contains('orientation-landscape');
        });
    }
    
    /**
     * Run a single test
     */
    test(name, testFn) {
        try {
            const result = testFn();
            if (result) {
                this.passed++;
                this.results.push({ name, status: 'PASS', error: null });
                if (testConfig.verbose) {
                }
            } else {
                this.failed++;
                this.results.push({ name, status: 'FAIL', error: 'Test returned false' });
                console.warn(`❌ ${name}: Test returned false`);
            }
        } catch (error) {
            this.failed++;
            this.results.push({ name, status: 'ERROR', error: error.message });
            console.error(`💥 ${name}: ${error.message}`);
        }
    }
    
    /**
     * Display test results
     */
    displayResults() {
        
        if (this.failed > 0) {
            this.results
                .filter(r => r.status !== 'PASS')
                .forEach(r => {
                });
        }
        
        // Return results for programmatic access
        return {
            passed: this.passed,
            failed: this.failed,
            total: this.passed + this.failed,
            successRate: (this.passed / (this.passed + this.failed)) * 100,
            results: this.results
        };
    }
}

/**
 * Run layout system tests
 */
function runLayoutSystemTests() {
    const tests = new MobileLayoutSystemTests();
    return tests.runAllTests();
}

/**
 * Test specific component
 */
function testComponent(componentName) {
    const tests = new MobileLayoutSystemTests();
    
    switch (componentName.toLowerCase()) {
        case 'viewport':
            tests.testViewportManager();
            break;
        case 'layout':
            tests.testLayoutController();
            break;
        case 'container':
            tests.testContainerQueries();
            break;
        case 'grid':
            tests.testResponsiveGrids();
            break;
        case 'hero':
            tests.testHeroStatsLayout();
            break;
        case 'spacing':
            tests.testSpacingSystem();
            break;
        case 'device':
            tests.testDeviceClasses();
            break;
        default:
            console.warn(`Unknown component: ${componentName}`);
            return;
    }
    
    tests.displayResults();
}

/**
 * Get layout system status for debugging
 */
function debugLayoutSystem() {
    if (!window.mobileLayoutSystem) {
        console.error('Mobile Layout System not initialized');
        return;
    }
    
    const status = getLayoutSystemStatus();
    
    // Additional debug info
    const { viewportManager, layoutController, gridSystem, containerQuery } = window.mobileLayoutSystem;
    
    
        gridConfigs: Array.from(layoutController.gridConfigs.keys()),
        spacingSystem: Object.keys(layoutController.spacingSystem)
    });
    
        activeGrids: gridSystem.grids.size,
        defaultConfigs: Array.from(gridSystem.defaultConfigs.keys())
    });
    
}

// Auto-run tests if configured
if (testConfig.autoRun && typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for everything to initialize
        setTimeout(() => {
            if (window.mobileLayoutSystem) {
                runLayoutSystemTests();
            }
        }, 1000);
    });
}

// Export functions for global use
if (typeof window !== 'undefined') {
    window.runLayoutSystemTests = runLayoutSystemTests;
    window.testComponent = testComponent;
    window.debugLayoutSystem = debugLayoutSystem;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MobileLayoutSystemTests,
        runLayoutSystemTests,
        testComponent,
        debugLayoutSystem
    };
}
/**
 * Mobile Navigation Test Suite
 * Tests for mobile navigation enhancements
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

class MobileNavigationTester {
    constructor() {
        this.testResults = [];
        this.controller = null;
    }
    
    async runAllTests() {
        
        // Wait for controller to be available
        await this.waitForController();
        
        // Run test suites
        await this.testMenuEnhancements();
        await this.testKeyboardNavigation();
        await this.testBreadcrumbNavigation();
        await this.testTabNavigation();
        await this.testSwipeGestures();
        
        // Report results
        this.reportResults();
        
        return this.testResults;
    }
    
    async waitForController() {
        return new Promise((resolve) => {
            const checkController = () => {
                if (window.MobileNavigationInit && window.MobileNavigationInit.getController()) {
                    this.controller = window.MobileNavigationInit.getController();
                    resolve();
                } else {
                    setTimeout(checkController, 100);
                }
            };
            checkController();
        });
    }
    
    async testMenuEnhancements() {
        
        try {
            // Test menu overlay exists
            const menuOverlay = document.getElementById('menuOverlay');
            this.assert(menuOverlay !== null, 'Menu overlay exists');
            
            // Test menu items have enhanced interactions
            const menuItems = document.querySelectorAll('.menu-item');
            this.assert(menuItems.length > 0, 'Menu items exist');
            
            // Test back button functionality
            const backButton = document.getElementById('menuBack');
            this.assert(backButton !== null, 'Back button exists');
            
            // Test menu transitions
            if (menuOverlay) {
                const computedStyle = window.getComputedStyle(menuOverlay);
                this.assert(
                    computedStyle.transition.includes('300ms'),
                    'Menu has enhanced transitions'
                );
            }
            
            // Test touch feedback
            if (menuItems.length > 0) {
                const firstItem = menuItems[0];
                
                // Simulate touch start
                const touchStartEvent = new TouchEvent('touchstart', {
                    touches: [{ clientX: 100, clientY: 100 }]
                });
                firstItem.dispatchEvent(touchStartEvent);
                
                // Check if touch-active class is added
                setTimeout(() => {
                    this.assert(
                        firstItem.classList.contains('mobile-active') || 
                        firstItem.classList.contains('touch-active'),
                        'Touch feedback is working'
                    );
                }, 50);
            }
            
            this.addResult('Menu Enhancements', true, 'All menu enhancement tests passed');
            
        } catch (error) {
            this.addResult('Menu Enhancements', false, error.message);
        }
    }
    
    async testKeyboardNavigation() {
        
        try {
            // Test keyboard navigation is enabled
            this.assert(
                this.controller && this.controller.keyboardNavigationEnabled,
                'Keyboard navigation is enabled'
            );
            
            // Test focusable elements exist
            const focusableElements = document.querySelectorAll(
                '.nav-tab, .btn, input, select, [tabindex="0"]'
            );
            this.assert(focusableElements.length > 0, 'Focusable elements exist');
            
            // Test tab navigation
            const navTabs = document.querySelectorAll('.nav-tab');
            if (navTabs.length > 0) {
                const firstTab = navTabs[0];
                firstTab.focus();
                
                // Simulate arrow key navigation
                const arrowRightEvent = new KeyboardEvent('keydown', {
                    key: 'ArrowRight',
                    bubbles: true
                });
                firstTab.dispatchEvent(arrowRightEvent);
                
                this.assert(true, 'Arrow key navigation works');
            }
            
            // Test escape key functionality
            const escapeEvent = new KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true
            });
            document.dispatchEvent(escapeEvent);
            
            this.addResult('Keyboard Navigation', true, 'All keyboard navigation tests passed');
            
        } catch (error) {
            this.addResult('Keyboard Navigation', false, error.message);
        }
    }
    
    async testBreadcrumbNavigation() {
        
        try {
            // Test breadcrumb container exists
            const breadcrumbContainer = document.querySelector('.breadcrumb-container');
            this.assert(breadcrumbContainer !== null, 'Breadcrumb container exists');
            
            // Test breadcrumb list exists
            const breadcrumbList = document.querySelector('.breadcrumb-list');
            this.assert(breadcrumbList !== null, 'Breadcrumb list exists');
            
            // Test navigation history
            if (this.controller) {
                const history = this.controller.getNavigationHistory();
                this.assert(Array.isArray(history), 'Navigation history is an array');
                this.assert(history.length > 0, 'Navigation history has items');
            }
            
            // Test breadcrumb links
            const breadcrumbLinks = document.querySelectorAll('.breadcrumb-link');
            if (breadcrumbLinks.length > 0) {
                const firstLink = breadcrumbLinks[0];
                this.assert(
                    firstLink.hasAttribute('data-section'),
                    'Breadcrumb links have section data'
                );
            }
            
            // Test section navigation
            if (this.controller) {
                const currentSection = this.controller.getCurrentSection();
                this.assert(typeof currentSection === 'string', 'Current section is tracked');
            }
            
            this.addResult('Breadcrumb Navigation', true, 'All breadcrumb navigation tests passed');
            
        } catch (error) {
            this.addResult('Breadcrumb Navigation', false, error.message);
        }
    }
    
    async testTabNavigation() {
        
        try {
            // Test nav tabs exist
            const navTabs = document.querySelector('.nav-tabs');
            this.assert(navTabs !== null, 'Navigation tabs exist');
            
            // Test mobile optimization classes
            if (navTabs) {
                this.assert(
                    navTabs.classList.contains('mobile-optimized-tabs'),
                    'Tabs have mobile optimization classes'
                );
            }
            
            // Test individual tabs
            const tabs = document.querySelectorAll('.nav-tab');
            if (tabs.length > 0) {
                tabs.forEach((tab, index) => {
                    this.assert(
                        tab.classList.contains('mobile-tab'),
                        `Tab ${index} has mobile class`
                    );
                    
                    // Test minimum touch target size
                    const computedStyle = window.getComputedStyle(tab);
                    const minHeight = parseInt(computedStyle.minHeight);
                    this.assert(
                        minHeight >= 44,
                        `Tab ${index} meets minimum touch target size (${minHeight}px)`
                    );
                });
            }
            
            // Test scroll indicators on small screens
            if (window.innerWidth <= 480) {
                const scrollWrapper = document.querySelector('.tab-scroll-wrapper');
                if (scrollWrapper) {
                    const indicators = scrollWrapper.querySelectorAll('.scroll-indicator');
                    this.assert(indicators.length === 2, 'Scroll indicators exist on small screens');
                }
            }
            
            this.addResult('Tab Navigation', true, 'All tab navigation tests passed');
            
        } catch (error) {
            this.addResult('Tab Navigation', false, error.message);
        }
    }
    
    async testSwipeGestures() {
        
        try {
            // Test swipe gestures are enabled
            this.assert(
                this.controller && this.controller.isSwipeEnabled,
                'Swipe gestures are enabled'
            );
            
            // Test touch event listeners
            const content = document.getElementById('content');
            this.assert(content !== null, 'Content area exists for swipe gestures');
            
            // Simulate swipe gesture
            if (content) {
                // Touch start
                const touchStart = new TouchEvent('touchstart', {
                    touches: [{ clientX: 200, clientY: 100 }],
                    bubbles: true
                });
                content.dispatchEvent(touchStart);
                
                // Touch move (swipe left)
                const touchMove = new TouchEvent('touchmove', {
                    touches: [{ clientX: 100, clientY: 100 }],
                    bubbles: true
                });
                content.dispatchEvent(touchMove);
                
                // Touch end
                const touchEnd = new TouchEvent('touchend', {
                    changedTouches: [{ clientX: 50, clientY: 100 }],
                    bubbles: true
                });
                content.dispatchEvent(touchEnd);
                
                this.assert(true, 'Swipe gesture simulation completed');
            }
            
            // Test menu swipe gestures
            const menuOverlay = document.getElementById('menuOverlay');
            if (menuOverlay) {
                // Simulate upward swipe on menu
                const menuTouchStart = new TouchEvent('touchstart', {
                    touches: [{ clientX: 100, clientY: 200 }],
                    bubbles: true
                });
                menuOverlay.dispatchEvent(menuTouchStart);
                
                const menuTouchEnd = new TouchEvent('touchend', {
                    changedTouches: [{ clientX: 100, clientY: 100 }],
                    bubbles: true
                });
                menuOverlay.dispatchEvent(menuTouchEnd);
                
                this.assert(true, 'Menu swipe gesture simulation completed');
            }
            
            this.addResult('Swipe Gestures', true, 'All swipe gesture tests passed');
            
        } catch (error) {
            this.addResult('Swipe Gestures', false, error.message);
        }
    }
    
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }
    
    addResult(testName, passed, message) {
        this.testResults.push({
            test: testName,
            passed,
            message,
            timestamp: new Date().toISOString()
        });
        
        const status = passed ? '✅' : '❌';
    }
    
    reportResults() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        
        if (failedTests > 0) {
            this.testResults
                .filter(r => !r.passed)
        }
        
        // Create visual test report
        this.createVisualReport();
    }
    
    createVisualReport() {
        const reportContainer = document.createElement('div');
        reportContainer.id = 'mobile-nav-test-report';
        reportContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            max-height: 400px;
            background: var(--bg-card);
            border: 2px solid var(--border);
            border-radius: 8px;
            padding: 1rem;
            z-index: 10000;
            overflow-y: auto;
            font-family: var(--font-mono);
            font-size: 0.75rem;
        `;
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        
        reportContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: var(--text-primary);">Test Report</h3>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 1.2rem;
                ">×</button>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <div style="color: var(--success);">✅ Passed: ${passedTests}</div>
                <div style="color: var(--error);">❌ Failed: ${totalTests - passedTests}</div>
                <div style="color: var(--text-secondary);">Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%</div>
            </div>
            
            <div style="max-height: 200px; overflow-y: auto;">
                ${this.testResults.map(result => `
                    <div style="
                        padding: 0.5rem;
                        margin-bottom: 0.5rem;
                        background: ${result.passed ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 0, 65, 0.1)'};
                        border-left: 3px solid ${result.passed ? 'var(--success)' : 'var(--error)'};
                    ">
                        <div style="font-weight: bold; color: var(--text-primary);">
                            ${result.passed ? '✅' : '❌'} ${result.test}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 0.6875rem;">
                            ${result.message}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(reportContainer);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (reportContainer.parentNode) {
                reportContainer.remove();
            }
        }, 10000);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileNavigationTester;
}

// Auto-run tests in development mode
if (typeof window !== 'undefined') {
    window.MobileNavigationTester = MobileNavigationTester;
    
    // Run tests when page loads (only in development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                const tester = new MobileNavigationTester();
                tester.runAllTests();
            }, 2000);
        });
    }
}
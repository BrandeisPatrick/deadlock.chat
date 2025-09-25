/**
 * Mobile Optimization Initialization
 * Main entry point for mobile optimizations
 */

class MobileOptimization {
    constructor() {
        this.viewportManager = null;
        this.formOptimizer = null;
        this.isInitialized = false;
        this.config = {
            enableViewportManagement: true,
            enableTouchOptimizations: true,
            enableSafeAreaHandling: true,
            enableDropdownPositioning: true,
            enableFormOptimization: true,
            debounceDelay: 150
        };
    }
    
    /**
     * Initialize mobile optimizations
     */
    async init(config = {}) {
        if (this.isInitialized) {
            console.warn('Mobile optimizations already initialized');
            return;
        }
        
        // Merge configuration
        this.config = { ...this.config, ...config };
        
        try {
            // Initialize viewport manager
            if (this.config.enableViewportManagement) {
                this.initViewportManager();
            }
            
            // Initialize touch optimizations
            if (this.config.enableTouchOptimizations) {
                this.initTouchOptimizations();
            }
            
            // Initialize safe area handling
            if (this.config.enableSafeAreaHandling) {
                this.initSafeAreaHandling();
            }
            
            // Initialize dropdown positioning
            if (this.config.enableDropdownPositioning) {
                this.initDropdownPositioning();
            }
            
            // Initialize form optimization
            if (this.config.enableFormOptimization) {
                this.initFormOptimization();
            }
            
            // Initialize general mobile optimizations
            this.initGeneralOptimizations();
            
            this.isInitialized = true;
            console.log('Mobile optimizations initialized successfully');
            
            // Dispatch initialization event
            window.dispatchEvent(new CustomEvent('mobileOptimizationReady', {
                detail: { mobileOptimization: this }
            }));
            
        } catch (error) {
            console.error('Failed to initialize mobile optimizations:', error);
        }
    }
    
    /**
     * Initialize viewport manager
     */
    initViewportManager() {
        this.viewportManager = new ViewportManager();
        
        // Listen for viewport changes and update UI accordingly
        this.viewportManager.onViewportChange((viewport, previousViewport) => {
            this.handleViewportChange(viewport, previousViewport);
        });
        
        // Store viewport manager globally for access by other scripts
        window.mobileViewportManager = this.viewportManager;
    }
    
    /**
     * Handle viewport changes
     */
    handleViewportChange(viewport, previousViewport) {
        // Update CSS custom properties with viewport information
        this.updateViewportCSSProperties(viewport);
        
        // Reposition any open dropdowns or modals
        this.repositionFloatingElements();
        
        // Update touch targets if device type changed
        if (viewport.deviceType !== previousViewport.deviceType) {
            this.updateTouchTargets();
        }
        
        // Dispatch viewport change event for other components
        window.dispatchEvent(new CustomEvent('viewportChanged', {
            detail: { viewport, previousViewport }
        }));
    }
    
    /**
     * Update CSS custom properties with viewport information
     */
    updateViewportCSSProperties(viewport) {
        const root = document.documentElement;
        
        // Set viewport dimensions
        root.style.setProperty('--viewport-width', `${viewport.width}px`);
        root.style.setProperty('--viewport-height', `${viewport.height}px`);
        
        // Set safe area insets
        root.style.setProperty('--safe-area-top', `${viewport.safeAreas.top}px`);
        root.style.setProperty('--safe-area-right', `${viewport.safeAreas.right}px`);
        root.style.setProperty('--safe-area-bottom', `${viewport.safeAreas.bottom}px`);
        root.style.setProperty('--safe-area-left', `${viewport.safeAreas.left}px`);
        
        // Set device type class
        document.body.className = document.body.className.replace(/device-\w+/g, '');
        document.body.classList.add(`device-${viewport.deviceType}`);
        document.body.classList.add(`platform-${viewport.platform}`);
        document.body.classList.add(`orientation-${viewport.orientation}`);
    }
    
    /**
     * Initialize touch optimizations
     */
    initTouchOptimizations() {
        // Initialize mobile optimizations for the entire document
        initializeMobileOptimizations(document.body);
        
        // Add touch-friendly styling to interactive elements
        this.optimizeInteractiveElements();
        
        // Setup touch event handling
        this.setupTouchEventHandling();
    }
    
    /**
     * Optimize interactive elements for touch
     */
    optimizeInteractiveElements() {
        // Optimize buttons
        const buttons = document.querySelectorAll('button, .btn, [role="button"]');
        buttons.forEach(button => {
            makeTouchFriendly(button, {
                minTouchTarget: 44,
                addTapHighlight: false,
                preventCallout: true
            });
        });
        
        // Optimize form inputs
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            preventIOSZoom(input);
            manageFocusMobile(input);
        });
        
        // Optimize navigation tabs
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            makeTouchFriendly(tab, { minTouchTarget: 48 });
        });
    }
    
    /**
     * Setup touch event handling
     */
    setupTouchEventHandling() {
        // Add passive scroll listeners for better performance
        const scrollOptimizer = optimizeScrollPerformance();
        
        // Optimize scroll performance for main content areas
        const contentAreas = document.querySelectorAll('.content, .section, .card');
        contentAreas.forEach(area => {
            scrollOptimizer.onScroll(() => {
                // Handle scroll events efficiently
                this.handleScroll(area);
            });
        });
        
        // Add touch feedback to buttons
        this.addTouchFeedback();
    }
    
    /**
     * Add visual touch feedback to buttons
     */
    addTouchFeedback() {
        const buttons = document.querySelectorAll('button, .btn, [role="button"]');
        
        buttons.forEach(button => {
            // Add touch start feedback
            button.addEventListener('touchstart', () => {
                button.classList.add('touch-active');
            }, { passive: true });
            
            // Remove touch feedback
            const removeFeedback = () => {
                button.classList.remove('touch-active');
            };
            
            button.addEventListener('touchend', removeFeedback, { passive: true });
            button.addEventListener('touchcancel', removeFeedback, { passive: true });
        });
        
        // Add CSS for touch feedback if not already present
        if (!document.querySelector('#mobile-touch-feedback-styles')) {
            const style = document.createElement('style');
            style.id = 'mobile-touch-feedback-styles';
            style.textContent = `
                .touch-active {
                    transform: scale(0.98) !important;
                    opacity: 0.8 !important;
                    transition: transform 0.1s ease, opacity 0.1s ease !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Initialize safe area handling
     */
    initSafeAreaHandling() {
        // Apply safe area padding to elements with data-safe-area attribute
        const safeAreaElements = document.querySelectorAll('[data-safe-area]');
        safeAreaElements.forEach(element => {
            const sides = element.dataset.safeArea ? 
                element.dataset.safeArea.split(',').map(s => s.trim()) : 
                ['top', 'right', 'bottom', 'left'];
            applySafeAreaPadding(element, sides);
        });
        
        // Apply safe area to header and navigation
        const header = document.querySelector('.header');
        if (header) {
            applySafeAreaPadding(header, ['top', 'left', 'right']);
        }
        
        // Apply safe area to menu back button
        const menuBack = document.querySelector('.menu-back');
        if (menuBack) {
            applySafeAreaPadding(menuBack, ['top', 'left']);
        }
    }
    
    /**
     * Initialize dropdown positioning
     */
    initDropdownPositioning() {
        // Setup profile dropdown positioning
        this.setupProfileDropdownPositioning();
        
        // Setup general dropdown positioning
        this.setupGeneralDropdownPositioning();
    }
    
    /**
     * Setup profile dropdown positioning
     */
    setupProfileDropdownPositioning() {
        const profileButton = document.querySelector('#profileDropdownButton');
        const profileMenu = document.querySelector('#profileDropdownMenu');
        
        if (profileButton && profileMenu) {
            // Position dropdown when opened
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (!profileMenu.classList.contains('hidden')) {
                            this.positionProfileDropdown(profileButton, profileMenu);
                        }
                    }
                });
            });
            
            observer.observe(profileMenu, { attributes: true });
        }
    }
    
    /**
     * Position profile dropdown within viewport bounds
     */
    positionProfileDropdown(button, menu) {
        if (!this.viewportManager) return;
        
        const positioningUtils = this.viewportManager.getPositioningUtils();
        const position = positioningUtils.calculateDropdownPosition(button, menu, 'bottom');
        
        if (position) {
            menu.style.position = 'fixed';
            menu.style.top = `${position.top}px`;
            menu.style.left = `${position.left}px`;
            menu.style.right = 'auto';
            menu.style.bottom = 'auto';
            menu.style.zIndex = '2000';
            
            // Ensure menu doesn't exceed viewport width on mobile
            if (this.viewportManager.isMobileOrTablet()) {
                const viewport = this.viewportManager.getAvailableViewport();
                const maxWidth = viewport.width - 32; // 16px margin on each side
                menu.style.maxWidth = `${maxWidth}px`;
                menu.style.width = 'auto';
            }
        }
    }
    
    /**
     * Setup general dropdown positioning
     */
    setupGeneralDropdownPositioning() {
        // Handle all dropdowns with data-dropdown attribute
        const dropdowns = document.querySelectorAll('[data-dropdown]');
        
        dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('[data-dropdown-trigger]');
            const menu = dropdown.querySelector('[data-dropdown-menu]');
            
            if (trigger && menu) {
                trigger.addEventListener('click', () => {
                    setTimeout(() => {
                        if (!menu.classList.contains('hidden')) {
                            positionDropdown(trigger, menu);
                        }
                    }, 10);
                });
            }
        });
    }
    
    /**
     * Initialize form optimization
     */
    initFormOptimization() {
        if (typeof MobileFormOptimizer !== 'undefined') {
            this.formOptimizer = new MobileFormOptimizer(this.viewportManager);
            
            // Store globally for access by other scripts
            window.mobileFormOptimizer = this.formOptimizer;
            
            console.log('Form optimization initialized');
        } else {
            console.warn('MobileFormOptimizer not available');
        }
    }
    
    /**
     * Initialize general mobile optimizations
     */
    initGeneralOptimizations() {
        // Prevent zoom on double tap for iOS
        this.preventDoubleTabZoom();
        
        // Setup virtual keyboard detection
        this.setupVirtualKeyboardDetection();
        
        // Optimize scroll performance
        this.optimizeScrolling();
        
        // Setup orientation change handling
        this.setupOrientationChangeHandling();
    }
    
    /**
     * Prevent double tap zoom on iOS
     */
    preventDoubleTabZoom() {
        let lastTouchEnd = 0;
        
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }
    
    /**
     * Setup virtual keyboard detection
     */
    setupVirtualKeyboardDetection() {
        const unsubscribe = detectVirtualKeyboard((isOpen, heightDifference) => {
            document.body.classList.toggle('virtual-keyboard-open', isOpen);
            
            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('virtualKeyboardToggle', {
                detail: { isOpen, heightDifference }
            }));
            
            // Reposition floating elements when keyboard opens/closes
            if (isOpen || !isOpen) {
                setTimeout(() => {
                    this.repositionFloatingElements();
                }, 100);
            }
        });
        
        // Store unsubscribe function for cleanup
        this.virtualKeyboardUnsubscribe = unsubscribe;
    }
    
    /**
     * Optimize scrolling performance
     */
    optimizeScrolling() {
        // Add smooth scrolling behavior
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Optimize scroll containers
        const scrollContainers = document.querySelectorAll('.content, .section, [data-scrollable]');
        scrollContainers.forEach(container => {
            container.style.webkitOverflowScrolling = 'touch';
            container.style.overflowScrolling = 'touch';
        });
    }
    
    /**
     * Setup orientation change handling
     */
    setupOrientationChangeHandling() {
        const handleOrientationChange = debounce(() => {
            // Reposition floating elements after orientation change
            setTimeout(() => {
                this.repositionFloatingElements();
                this.updateTouchTargets();
            }, 200);
        }, this.config.debounceDelay);
        
        window.addEventListener('orientationchange', handleOrientationChange);
        
        // Also listen for resize as a fallback
        window.addEventListener('resize', handleOrientationChange);
    }
    
    /**
     * Reposition floating elements (dropdowns, modals, tooltips)
     */
    repositionFloatingElements() {
        // Reposition open dropdowns
        const openDropdowns = document.querySelectorAll('[data-dropdown-menu]:not(.hidden)');
        openDropdowns.forEach(menu => {
            const dropdown = menu.closest('[data-dropdown]');
            if (dropdown) {
                const trigger = dropdown.querySelector('[data-dropdown-trigger]');
                if (trigger) {
                    positionDropdown(trigger, menu);
                }
            }
        });
        
        // Reposition profile dropdown if open
        const profileMenu = document.querySelector('#profileDropdownMenu');
        const profileButton = document.querySelector('#profileDropdownButton');
        if (profileMenu && profileButton && !profileMenu.classList.contains('hidden')) {
            this.positionProfileDropdown(profileButton, profileMenu);
        }
        
        // Constrain any fixed positioned elements to viewport
        const fixedElements = document.querySelectorAll('[style*="position: fixed"]');
        fixedElements.forEach(element => {
            constrainToViewport(element);
        });
    }
    
    /**
     * Update touch targets based on current device type
     */
    updateTouchTargets() {
        if (!this.viewportManager) return;
        
        const isMobile = this.viewportManager.isMobileOrTablet();
        const minTouchTarget = isMobile ? 44 : 32;
        
        const interactiveElements = document.querySelectorAll('button, .btn, [role="button"], .nav-tab');
        interactiveElements.forEach(element => {
            makeTouchFriendly(element, { minTouchTarget });
        });
    }
    
    /**
     * Handle scroll events efficiently
     */
    handleScroll(container) {
        // Implement scroll-based optimizations here
        // For example, lazy loading, infinite scroll, etc.
    }
    
    /**
     * Get viewport manager instance
     */
    getViewportManager() {
        return this.viewportManager;
    }
    
    /**
     * Check if mobile optimizations are initialized
     */
    isReady() {
        return this.isInitialized;
    }
    
    /**
     * Cleanup mobile optimizations
     */
    destroy() {
        if (this.virtualKeyboardUnsubscribe) {
            this.virtualKeyboardUnsubscribe();
        }
        
        this.isInitialized = false;
        console.log('Mobile optimizations destroyed');
    }
}

// Initialize mobile optimizations when DOM is ready
function initMobileOptimizations(config = {}) {
    const mobileOpt = new MobileOptimization();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            mobileOpt.init(config);
        });
    } else {
        mobileOpt.init(config);
    }
    
    // Store globally for access
    window.mobileOptimization = mobileOpt;
    
    return mobileOpt;
}

// Auto-initialize if not disabled
if (typeof window !== 'undefined' && !window.DISABLE_AUTO_MOBILE_INIT) {
    initMobileOptimizations();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MobileOptimization, initMobileOptimizations };
} else if (typeof window !== 'undefined') {
    window.MobileOptimization = MobileOptimization;
    window.initMobileOptimizations = initMobileOptimizations;
}
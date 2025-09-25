/**
 * Mobile Navigation Initialization
 * Integrates mobile navigation enhancements with existing application
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

(function() {
    'use strict';
    
    let mobileNavController = null;
    let isInitialized = false;
    
    /**
     * Initialize mobile navigation enhancements
     */
    function initMobileNavigation() {
        if (isInitialized) return;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initMobileNavigation);
            return;
        }
        
        // Initialize mobile navigation controller
        if (typeof MobileNavigationController !== 'undefined') {
            mobileNavController = new MobileNavigationController();
            
            // Integrate with existing navigation functions
            integrateWithExistingNavigation();
            
            // Setup mobile-specific event listeners
            setupMobileEventListeners();
            
            // Add mobile navigation hints
            addMobileNavigationHints();
            
            isInitialized = true;
            console.log('✅ Mobile navigation initialization complete');
        } else {
            console.warn('⚠️ MobileNavigationController not found, retrying...');
            setTimeout(initMobileNavigation, 100);
        }
    }
    
    /**
     * Integrate with existing navigation functions
     */
    function integrateWithExistingNavigation() {
        // Override existing switchSection function to work with breadcrumbs
        const originalSwitchSection = window.switchSection;
        
        if (originalSwitchSection) {
            window.switchSection = function(sectionName) {
                // Call original function
                const result = originalSwitchSection.call(this, sectionName);
                
                // Notify mobile navigation controller
                if (mobileNavController) {
                    document.dispatchEvent(new CustomEvent('sectionChange', {
                        detail: { section: sectionName }
                    }));
                }
                
                return result;
            };
        }
        
        // Enhance existing menu functions
        const originalShowMenu = window.showMenu;
        const originalHideMenu = window.hideMenu;
        
        if (originalShowMenu) {
            window.showMenu = function() {
                const result = originalShowMenu.call(this);
                
                // Add mobile-specific enhancements
                addMobileMenuEnhancements();
                
                return result;
            };
        }
        
        if (originalHideMenu) {
            window.hideMenu = function() {
                const result = originalHideMenu.call(this);
                
                // Clean up mobile enhancements
                cleanupMobileMenuEnhancements();
                
                return result;
            };
        }
    }
    
    /**
     * Setup mobile-specific event listeners
     */
    function setupMobileEventListeners() {
        // Handle orientation changes
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleResize);
        
        // Handle visibility changes (app backgrounding)
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Handle focus changes for accessibility
        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);
        
        // Handle touch events for better mobile interaction
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        // Handle keyboard events for navigation
        document.addEventListener('keydown', handleKeyDown);
    }
    
    /**
     * Add mobile navigation hints and tutorials
     */
    function addMobileNavigationHints() {
        // Only show hints on first visit
        if (localStorage.getItem('mobile-nav-hints-shown')) return;
        
        // Create swipe hint element
        const swipeHint = document.createElement('div');
        swipeHint.className = 'swipe-hint';
        swipeHint.textContent = '← Swipe to navigate between tabs →';
        document.body.appendChild(swipeHint);
        
        // Show hint briefly
        setTimeout(() => {
            swipeHint.classList.add('show');
        }, 1000);
        
        setTimeout(() => {
            swipeHint.classList.remove('show');
            setTimeout(() => {
                swipeHint.remove();
            }, 300);
        }, 4000);
        
        // Mark hints as shown
        localStorage.setItem('mobile-nav-hints-shown', 'true');
    }
    
    /**
     * Event Handlers
     */
    
    function handleOrientationChange() {
        // Delay to allow for orientation change to complete
        setTimeout(() => {
            if (mobileNavController) {
                // Update navigation layout for new orientation
                updateNavigationLayout();
                
                // Recalculate scroll indicators if needed
                updateScrollIndicators();
            }
        }, 100);
    }
    
    function handleResize() {
        // Throttle resize events
        clearTimeout(window.mobileNavResizeTimeout);
        window.mobileNavResizeTimeout = setTimeout(() => {
            updateNavigationLayout();
            updateScrollIndicators();
        }, 150);
    }
    
    function handleVisibilityChange() {
        if (document.hidden) {
            // App is backgrounded - pause animations
            pauseAnimations();
        } else {
            // App is foregrounded - resume animations
            resumeAnimations();
        }
    }
    
    function handleFocusIn(e) {
        // Ensure focused elements are visible
        if (e.target.matches('.nav-tab, .breadcrumb-link, .menu-item')) {
            e.target.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }
    
    function handleFocusOut(e) {
        // Clean up focus-related styles
        if (e.target.matches('.nav-tab, .breadcrumb-link, .menu-item')) {
            e.target.blur();
        }
    }
    
    function handleTouchStart(e) {
        // Add touch feedback to interactive elements
        if (e.target.matches('.nav-tab, .breadcrumb-link, .menu-item, .btn')) {
            e.target.classList.add('touch-active');
        }
    }
    
    function handleTouchEnd(e) {
        // Remove touch feedback
        setTimeout(() => {
            document.querySelectorAll('.touch-active').forEach(el => {
                el.classList.remove('touch-active');
            });
        }, 150);
    }
    
    function handleKeyDown(e) {
        // Handle global keyboard shortcuts
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        
        switch (e.key) {
            case 'h':
            case 'H':
                if (!isInputFocused()) {
                    e.preventDefault();
                    if (mobileNavController) {
                        mobileNavController.navigateToSection('home');
                    }
                }
                break;
                
            case 'm':
            case 'M':
                if (!isInputFocused()) {
                    e.preventDefault();
                    window.showMenu();
                }
                break;
        }
    }
    
    /**
     * Helper Functions
     */
    
    function addMobileMenuEnhancements() {
        const menuOverlay = document.getElementById('menuOverlay');
        if (!menuOverlay) return;
        
        // Add mobile-specific classes
        menuOverlay.classList.add('mobile-enhanced');
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }
    
    function cleanupMobileMenuEnhancements() {
        const menuOverlay = document.getElementById('menuOverlay');
        if (menuOverlay) {
            menuOverlay.classList.remove('mobile-enhanced');
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
    }
    
    function updateNavigationLayout() {
        const navTabs = document.querySelector('.nav-tabs');
        if (!navTabs) return;
        
        // Update tab layout based on screen size
        const screenWidth = window.innerWidth;
        
        if (screenWidth <= 480) {
            // Very small screens - enable horizontal scrolling
            navTabs.style.overflowX = 'auto';
            navTabs.style.flexWrap = 'nowrap';
        } else if (screenWidth <= 768) {
            // Mobile screens - allow wrapping
            navTabs.style.overflowX = 'visible';
            navTabs.style.flexWrap = 'wrap';
        } else {
            // Larger screens - normal layout
            navTabs.style.overflowX = 'visible';
            navTabs.style.flexWrap = 'nowrap';
        }
    }
    
    function updateScrollIndicators() {
        const scrollWrappers = document.querySelectorAll('.tab-scroll-wrapper');
        
        scrollWrappers.forEach(wrapper => {
            const container = wrapper.querySelector('.nav-tabs');
            const leftIndicator = wrapper.querySelector('.scroll-indicator.left');
            const rightIndicator = wrapper.querySelector('.scroll-indicator.right');
            
            if (!container || !leftIndicator || !rightIndicator) return;
            
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            
            leftIndicator.style.opacity = scrollLeft > 0 ? '1' : '0';
            rightIndicator.style.opacity = scrollLeft < scrollWidth - clientWidth ? '1' : '0';
        });
    }
    
    function pauseAnimations() {
        document.body.classList.add('animations-paused');
        
        const style = document.createElement('style');
        style.id = 'pause-animations';
        style.textContent = `
            .animations-paused * {
                animation-play-state: paused !important;
                transition-duration: 0s !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    function resumeAnimations() {
        document.body.classList.remove('animations-paused');
        
        const pauseStyle = document.getElementById('pause-animations');
        if (pauseStyle) {
            pauseStyle.remove();
        }
    }
    
    function isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.tagName === 'SELECT' ||
            activeElement.isContentEditable
        );
    }
    
    /**
     * Public API
     */
    window.MobileNavigationInit = {
        init: initMobileNavigation,
        getController: () => mobileNavController,
        isInitialized: () => isInitialized
    };
    
    // Auto-initialize on mobile devices
    if (window.innerWidth <= 768 || 'ontouchstart' in window) {
        initMobileNavigation();
    }
    
})();
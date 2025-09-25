/**
 * Mobile Navigation Controller
 * Enhances navigation and menu systems for mobile devices
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

class MobileNavigationController {
    constructor() {
        this.isInitialized = false;
        this.currentSection = 'home';
        this.navigationHistory = ['home'];
        this.swipeThreshold = 50;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isSwipeEnabled = true;
        this.keyboardNavigationEnabled = true;
        
        // Animation settings
        this.animationDuration = 300;
        this.easeFunction = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        this.setupMobileMenuEnhancements();
        this.setupKeyboardNavigation();
        this.setupBreadcrumbNavigation();
        this.setupMobileTabNavigation();
        this.setupSwipeGestures();
        this.setupAnimationEnhancements();
        
        this.isInitialized = true;
        console.log('✅ MobileNavigationController initialized');
    }
    
    /**
     * Enhance mobile menu transitions and animations
     * Requirement: 2.1, 2.2
     */
    setupMobileMenuEnhancements() {
        const menuOverlay = document.getElementById('menuOverlay');
        const menuItems = document.querySelectorAll('.menu-item');
        const menuBack = document.getElementById('menuBack');
        
        if (!menuOverlay) return;
        
        // Enhanced menu show/hide animations
        this.enhanceMenuTransitions(menuOverlay);
        
        // Improve menu item interactions
        menuItems.forEach((item, index) => {
            this.enhanceMenuItemInteraction(item, index);
        });
        
        // Enhanced back button behavior
        if (menuBack) {
            this.enhanceBackButton(menuBack);
        }
        
        // Add mobile-specific menu behaviors
        this.addMobileMenuBehaviors(menuOverlay);
    }
    
    enhanceMenuTransitions(menuOverlay) {
        // Add CSS classes for enhanced animations
        menuOverlay.style.transition = `all ${this.animationDuration}ms ${this.easeFunction}`;
        
        // Override existing show/hide functions with enhanced animations
        const originalShowMenu = window.showMenu;
        const originalHideMenu = window.hideMenu;
        
        window.showMenu = () => {
            menuOverlay.classList.remove('hidden');
            menuOverlay.style.transform = 'translateY(0)';
            menuOverlay.style.opacity = '1';
            
            // Animate menu items with stagger effect
            const menuItems = menuOverlay.querySelectorAll('.menu-item');
            menuItems.forEach((item, index) => {
                item.style.transform = 'translateX(-100%)';
                item.style.opacity = '0';
                
                setTimeout(() => {
                    item.style.transition = `all ${this.animationDuration}ms ${this.easeFunction}`;
                    item.style.transform = 'translateX(0)';
                    item.style.opacity = '1';
                }, index * 50);
            });
            
            document.body.style.overflow = 'hidden';
            document.getElementById('menuBack').classList.add('show');
        };
        
        window.hideMenu = () => {
            const menuItems = menuOverlay.querySelectorAll('.menu-item');
            
            // Animate out menu items
            menuItems.forEach((item, index) => {
                setTimeout(() => {
                    item.style.transform = 'translateX(-100%)';
                    item.style.opacity = '0';
                }, index * 30);
            });
            
            // Hide menu overlay after items animate out
            setTimeout(() => {
                menuOverlay.classList.add('hidden');
                menuOverlay.style.transform = 'translateY(-100%)';
                menuOverlay.style.opacity = '0';
                document.body.style.overflow = 'auto';
                document.getElementById('menuBack').classList.remove('show');
            }, menuItems.length * 30 + 100);
        };
    }
    
    enhanceMenuItemInteraction(item, index) {
        // Add touch feedback
        item.addEventListener('touchstart', (e) => {
            item.style.transform = 'scale(0.98)';
            item.style.transition = 'transform 0.1s ease';
        }, { passive: true });
        
        item.addEventListener('touchend', (e) => {
            item.style.transform = 'scale(1)';
            
            // Add haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        }, { passive: true });
        
        // Enhanced hover effects for mobile
        item.addEventListener('touchstart', () => {
            item.classList.add('mobile-active');
        }, { passive: true });
        
        item.addEventListener('touchend', () => {
            setTimeout(() => {
                item.classList.remove('mobile-active');
            }, 150);
        }, { passive: true });
    }
    
    enhanceBackButton(backButton) {
        // Add enhanced back button animation
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Add click animation
            backButton.style.transform = 'scale(0.9) rotate(-10deg)';
            backButton.style.transition = 'transform 0.1s ease';
            
            setTimeout(() => {
                backButton.style.transform = 'scale(1) rotate(0deg)';
                window.showMenu();
            }, 100);
        });
        
        // Add touch feedback
        backButton.addEventListener('touchstart', () => {
            if (navigator.vibrate) {
                navigator.vibrate(5);
            }
        }, { passive: true });
    }
    
    addMobileMenuBehaviors(menuOverlay) {
        // Close menu on outside tap (for mobile)
        menuOverlay.addEventListener('touchstart', (e) => {
            if (e.target === menuOverlay) {
                window.hideMenu();
            }
        }, { passive: true });
        
        // Prevent scroll when menu is open
        menuOverlay.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    /**
     * Add keyboard navigation support for menu systems
     * Requirement: 2.2
     */
    setupKeyboardNavigation() {
        if (!this.keyboardNavigationEnabled) return;
        
        let currentFocusIndex = 0;
        const focusableElements = this.getFocusableElements();
        
        document.addEventListener('keydown', (e) => {
            if (!this.isMenuVisible()) return;
            
            switch (e.key) {
                case 'ArrowDown':
                case 'Tab':
                    e.preventDefault();
                    this.focusNext(focusableElements, currentFocusIndex);
                    currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    this.focusPrevious(focusableElements, currentFocusIndex);
                    currentFocusIndex = currentFocusIndex === 0 ? focusableElements.length - 1 : currentFocusIndex - 1;
                    break;
                    
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    this.activateCurrentElement(focusableElements[currentFocusIndex]);
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    window.showMenu();
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    this.focusFirst(focusableElements);
                    currentFocusIndex = 0;
                    break;
                    
                case 'End':
                    e.preventDefault();
                    this.focusLast(focusableElements);
                    currentFocusIndex = focusableElements.length - 1;
                    break;
            }
        });
        
        // Tab navigation for content sections
        this.setupTabKeyboardNavigation();
    }
    
    getFocusableElements() {
        const menuVisible = this.isMenuVisible();
        
        if (menuVisible) {
            return Array.from(document.querySelectorAll('.menu-item, .menu-back'));
        } else {
            return Array.from(document.querySelectorAll('.nav-tab, .btn, input, select, [tabindex="0"]'));
        }
    }
    
    setupTabKeyboardNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');
        let currentTabIndex = 0;
        
        navTabs.forEach((tab, index) => {
            tab.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        currentTabIndex = index === 0 ? navTabs.length - 1 : index - 1;
                        navTabs[currentTabIndex].focus();
                        break;
                        
                    case 'ArrowRight':
                        e.preventDefault();
                        currentTabIndex = (index + 1) % navTabs.length;
                        navTabs[currentTabIndex].focus();
                        break;
                        
                    case 'Home':
                        e.preventDefault();
                        navTabs[0].focus();
                        currentTabIndex = 0;
                        break;
                        
                    case 'End':
                        e.preventDefault();
                        navTabs[navTabs.length - 1].focus();
                        currentTabIndex = navTabs.length - 1;
                        break;
                }
            });
        });
    }
    
    focusNext(elements, currentIndex) {
        const nextIndex = (currentIndex + 1) % elements.length;
        elements[nextIndex].focus();
    }
    
    focusPrevious(elements, currentIndex) {
        const prevIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
        elements[prevIndex].focus();
    }
    
    focusFirst(elements) {
        if (elements.length > 0) {
            elements[0].focus();
        }
    }
    
    focusLast(elements) {
        if (elements.length > 0) {
            elements[elements.length - 1].focus();
        }
    }
    
    activateCurrentElement(element) {
        if (element) {
            element.click();
        }
    }
    
    isMenuVisible() {
        const menuOverlay = document.getElementById('menuOverlay');
        return menuOverlay && !menuOverlay.classList.contains('hidden');
    }
    
    /**
     * Implement breadcrumb navigation for better mobile UX
     * Requirement: 2.3
     */
    setupBreadcrumbNavigation() {
        this.createBreadcrumbContainer();
        this.updateBreadcrumbs();
        
        // Listen for section changes to update breadcrumbs
        document.addEventListener('sectionChange', (e) => {
            this.addToNavigationHistory(e.detail.section);
            this.updateBreadcrumbs();
        });
    }
    
    createBreadcrumbContainer() {
        const header = document.querySelector('.header .container');
        if (!header) return;
        
        const breadcrumbContainer = document.createElement('div');
        breadcrumbContainer.className = 'breadcrumb-container';
        breadcrumbContainer.innerHTML = `
            <nav class="breadcrumb-nav" aria-label="Breadcrumb navigation">
                <ol class="breadcrumb-list"></ol>
            </nav>
        `;
        
        header.appendChild(breadcrumbContainer);
    }
    
    updateBreadcrumbs() {
        const breadcrumbList = document.querySelector('.breadcrumb-list');
        if (!breadcrumbList) return;
        
        const sectionNames = {
            'home': 'Dashboard',
            'player-search': 'Player Search',
            'match-search': 'Match Analysis',
            'hero-stats': 'Hero Stats',
            'item-stats': 'Item Stats'
        };
        
        breadcrumbList.innerHTML = this.navigationHistory
            .map((section, index) => {
                const isLast = index === this.navigationHistory.length - 1;
                const sectionName = sectionNames[section] || section;
                
                if (isLast) {
                    return `<li class="breadcrumb-item current" aria-current="page">${sectionName}</li>`;
                } else {
                    return `
                        <li class="breadcrumb-item">
                            <button class="breadcrumb-link" data-section="${section}">
                                ${sectionName}
                            </button>
                            <span class="breadcrumb-separator">›</span>
                        </li>
                    `;
                }
            })
            .join('');
        
        // Add click handlers for breadcrumb navigation
        breadcrumbList.querySelectorAll('.breadcrumb-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.navigateToSection(section);
            });
        });
    }
    
    addToNavigationHistory(section) {
        // Remove section from history if it already exists
        const existingIndex = this.navigationHistory.indexOf(section);
        if (existingIndex !== -1) {
            this.navigationHistory.splice(existingIndex + 1);
        } else {
            this.navigationHistory.push(section);
        }
        
        // Limit history to 5 items for mobile
        if (this.navigationHistory.length > 5) {
            this.navigationHistory = this.navigationHistory.slice(-5);
        }
        
        this.currentSection = section;
    }
    
    navigateToSection(section) {
        // Trigger section change
        if (window.switchSection) {
            window.switchSection(section);
        }
        
        // Update history
        this.addToNavigationHistory(section);
        this.updateBreadcrumbs();
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('sectionChange', {
            detail: { section }
        }));
    }
    
    /**
     * Create mobile-optimized tab navigation with proper spacing
     * Requirement: 2.4
     */
    setupMobileTabNavigation() {
        const navTabs = document.querySelector('.nav-tabs');
        if (!navTabs) return;
        
        this.optimizeTabSpacing(navTabs);
        this.addTabScrolling(navTabs);
        this.enhanceTabInteractions(navTabs);
    }
    
    optimizeTabSpacing(navTabs) {
        // Add mobile-optimized classes
        navTabs.classList.add('mobile-optimized-tabs');
        
        const tabs = navTabs.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.classList.add('mobile-tab');
            
            // Ensure proper touch targets
            const computedStyle = window.getComputedStyle(tab);
            const minHeight = parseInt(computedStyle.minHeight);
            if (minHeight < 44) {
                tab.style.minHeight = '44px';
            }
        });
    }
    
    addTabScrolling(navTabs) {
        // Make tabs horizontally scrollable on very small screens
        if (window.innerWidth <= 480) {
            navTabs.style.overflowX = 'auto';
            navTabs.style.scrollBehavior = 'smooth';
            navTabs.style.webkitOverflowScrolling = 'touch';
            
            // Add scroll indicators
            this.addScrollIndicators(navTabs);
        }
    }
    
    addScrollIndicators(container) {
        const wrapper = document.createElement('div');
        wrapper.className = 'tab-scroll-wrapper';
        container.parentNode.insertBefore(wrapper, container);
        wrapper.appendChild(container);
        
        const leftIndicator = document.createElement('div');
        leftIndicator.className = 'scroll-indicator left';
        leftIndicator.innerHTML = '‹';
        
        const rightIndicator = document.createElement('div');
        rightIndicator.className = 'scroll-indicator right';
        rightIndicator.innerHTML = '›';
        
        wrapper.appendChild(leftIndicator);
        wrapper.appendChild(rightIndicator);
        
        // Update indicators based on scroll position
        const updateIndicators = () => {
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            
            leftIndicator.style.opacity = scrollLeft > 0 ? '1' : '0';
            rightIndicator.style.opacity = scrollLeft < scrollWidth - clientWidth ? '1' : '0';
        };
        
        container.addEventListener('scroll', updateIndicators);
        updateIndicators();
        
        // Add click handlers for indicators
        leftIndicator.addEventListener('click', () => {
            container.scrollBy({ left: -100, behavior: 'smooth' });
        });
        
        rightIndicator.addEventListener('click', () => {
            container.scrollBy({ left: 100, behavior: 'smooth' });
        });
    }
    
    enhanceTabInteractions(navTabs) {
        const tabs = navTabs.querySelectorAll('.nav-tab');
        
        tabs.forEach(tab => {
            // Add touch feedback
            tab.addEventListener('touchstart', () => {
                tab.classList.add('touch-active');
                if (navigator.vibrate) {
                    navigator.vibrate(5);
                }
            }, { passive: true });
            
            tab.addEventListener('touchend', () => {
                setTimeout(() => {
                    tab.classList.remove('touch-active');
                }, 150);
            }, { passive: true });
            
            // Improve focus visibility
            tab.addEventListener('focus', () => {
                tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            });
        });
    }
    
    /**
     * Add swipe gestures for tab switching and menu navigation
     * Requirement: 2.1, 2.2
     */
    setupSwipeGestures() {
        if (!this.isSwipeEnabled) return;
        
        this.setupTabSwipeGestures();
        this.setupMenuSwipeGestures();
    }
    
    setupTabSwipeGestures() {
        const content = document.getElementById('content');
        if (!content) return;
        
        let startX = 0;
        let startY = 0;
        let isSwipeGesture = false;
        
        content.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipeGesture = false;
        }, { passive: true });
        
        content.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            
            const diffX = Math.abs(currentX - startX);
            const diffY = Math.abs(currentY - startY);
            
            // Determine if this is a horizontal swipe
            if (diffX > diffY && diffX > 10) {
                isSwipeGesture = true;
            }
        }, { passive: true });
        
        content.addEventListener('touchend', (e) => {
            if (!isSwipeGesture || !startX) return;
            
            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;
            
            if (Math.abs(diffX) > this.swipeThreshold) {
                if (diffX > 0) {
                    // Swipe left - next tab
                    this.switchToNextTab();
                } else {
                    // Swipe right - previous tab
                    this.switchToPreviousTab();
                }
                
                // Add haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            }
            
            startX = 0;
            startY = 0;
            isSwipeGesture = false;
        }, { passive: true });
    }
    
    setupMenuSwipeGestures() {
        const menuOverlay = document.getElementById('menuOverlay');
        if (!menuOverlay) return;
        
        let startY = 0;
        
        menuOverlay.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        menuOverlay.addEventListener('touchend', (e) => {
            if (!startY) return;
            
            const endY = e.changedTouches[0].clientY;
            const diffY = startY - endY;
            
            // Swipe up to hide menu
            if (diffY > this.swipeThreshold) {
                window.hideMenu();
                
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            }
            
            startY = 0;
        }, { passive: true });
    }
    
    switchToNextTab() {
        const tabs = document.querySelectorAll('.nav-tab');
        const activeTab = document.querySelector('.nav-tab.active');
        
        if (!activeTab || tabs.length === 0) return;
        
        const currentIndex = Array.from(tabs).indexOf(activeTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        
        tabs[nextIndex].click();
    }
    
    switchToPreviousTab() {
        const tabs = document.querySelectorAll('.nav-tab');
        const activeTab = document.querySelector('.nav-tab.active');
        
        if (!activeTab || tabs.length === 0) return;
        
        const currentIndex = Array.from(tabs).indexOf(activeTab);
        const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        
        tabs[prevIndex].click();
    }
    
    /**
     * Setup animation enhancements for mobile
     */
    setupAnimationEnhancements() {
        // Add CSS for enhanced animations
        this.addAnimationStyles();
        
        // Reduce animations on low-end devices
        this.optimizeAnimationsForDevice();
    }
    
    addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .mobile-active {
                transform: scale(0.98) !important;
                opacity: 0.8 !important;
                transition: transform 0.1s ease, opacity 0.1s ease !important;
            }
            
            .mobile-optimized-tabs {
                scroll-behavior: smooth;
                -webkit-overflow-scrolling: touch;
            }
            
            .mobile-tab {
                transition: all 0.2s ease;
                position: relative;
            }
            
            .mobile-tab:focus {
                outline: 2px solid var(--accent);
                outline-offset: 2px;
            }
            
            .breadcrumb-container {
                margin-top: 1rem;
                padding: 0.5rem 0;
                border-top: 1px solid var(--border);
            }
            
            .breadcrumb-list {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                list-style: none;
                margin: 0;
                padding: 0;
                flex-wrap: wrap;
            }
            
            .breadcrumb-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
            }
            
            .breadcrumb-link {
                background: none;
                border: none;
                color: var(--accent);
                cursor: pointer;
                text-decoration: underline;
                font-size: inherit;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                transition: background-color 0.2s ease;
            }
            
            .breadcrumb-link:hover,
            .breadcrumb-link:focus {
                background-color: var(--bg-card);
                outline: none;
            }
            
            .breadcrumb-separator {
                color: var(--text-secondary);
                font-weight: bold;
            }
            
            .breadcrumb-item.current {
                color: var(--text-primary);
                font-weight: 600;
            }
            
            .tab-scroll-wrapper {
                position: relative;
            }
            
            .scroll-indicator {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 30px;
                height: 30px;
                background: var(--bg-card);
                border: 1px solid var(--border);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 10;
                transition: opacity 0.2s ease;
                font-size: 1.2rem;
                color: var(--text-primary);
            }
            
            .scroll-indicator.left {
                left: -15px;
            }
            
            .scroll-indicator.right {
                right: -15px;
            }
            
            .scroll-indicator:hover {
                background: var(--accent);
                color: var(--primary);
            }
            
            @media (max-width: 768px) {
                .breadcrumb-container {
                    margin-top: 0.5rem;
                    padding: 0.25rem 0;
                }
                
                .breadcrumb-item {
                    font-size: 0.75rem;
                }
                
                .breadcrumb-link {
                    padding: 0.125rem 0.25rem;
                    min-height: 32px;
                    display: flex;
                    align-items: center;
                }
            }
            
            @media (max-width: 480px) {
                .breadcrumb-list {
                    gap: 0.25rem;
                }
                
                .breadcrumb-item {
                    font-size: 0.6875rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    optimizeAnimationsForDevice() {
        // Detect low-end devices and reduce animations
        const isLowEndDevice = this.detectLowEndDevice();
        
        if (isLowEndDevice) {
            this.animationDuration = 150;
            document.documentElement.style.setProperty('--animation-duration', '150ms');
            
            // Disable complex animations
            const style = document.createElement('style');
            style.textContent = `
                .menu-marquee {
                    animation: none !important;
                }
                
                .marquee-content {
                    animation: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    detectLowEndDevice() {
        // Simple heuristics to detect low-end devices
        const hardwareConcurrency = navigator.hardwareConcurrency || 1;
        const deviceMemory = navigator.deviceMemory || 1;
        
        return hardwareConcurrency <= 2 || deviceMemory <= 2;
    }
    
    /**
     * Public API methods
     */
    
    enableSwipeGestures() {
        this.isSwipeEnabled = true;
        this.setupSwipeGestures();
    }
    
    disableSwipeGestures() {
        this.isSwipeEnabled = false;
    }
    
    enableKeyboardNavigation() {
        this.keyboardNavigationEnabled = true;
    }
    
    disableKeyboardNavigation() {
        this.keyboardNavigationEnabled = false;
    }
    
    getCurrentSection() {
        return this.currentSection;
    }
    
    getNavigationHistory() {
        return [...this.navigationHistory];
    }
    
    clearNavigationHistory() {
        this.navigationHistory = [this.currentSection];
        this.updateBreadcrumbs();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileNavigationController;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    window.MobileNavigationController = MobileNavigationController;
}
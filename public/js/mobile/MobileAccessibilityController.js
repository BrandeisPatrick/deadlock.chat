/**
 * Mobile Accessibility Controller
 * Implements accessibility improvements for mobile devices
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

class MobileAccessibilityController {
    constructor(viewportManager = null) {
        this.viewportManager = viewportManager || window.mobileViewportManager;
        this.isInitialized = false;
        this.focusHistory = [];
        this.currentFocusIndex = -1;
        this.isHighContrastMode = false;
        this.screenReaderAnnouncements = [];
        this.liveRegion = null;
        this.focusTraps = new Map();
        
        this.config = {
            // Focus management
            focusOutlineWidth: '3px',
            focusOutlineColor: '#00ff41',
            focusOutlineOffset: '2px',
            
            // Screen reader
            announcementDelay: 100,
            maxAnnouncements: 5,
            
            // High contrast
            contrastRatios: {
                normal: 4.5,
                large: 3.0,
                enhanced: 7.0
            },
            
            // Touch targets
            minTouchTarget: 44,
            recommendedTouchTarget: 48
        };
        
        this.init();
    }
    
    /**
     * Initialize mobile accessibility features
     */
    init() {
        if (this.isInitialized) return;
        
        try {
            this.implementARIALabelsAndRoles();
            this.setupScreenReaderSupport();
            this.createKeyboardNavigationSystem();
            this.implementHighContrastMode();
            this.setupFocusManagement();
            this.enhanceInteractiveElements();
            this.setupAccessibilityEventHandlers();
            
            this.isInitialized = true;
            console.log('✅ MobileAccessibilityController initialized');
            
            // Dispatch initialization event
            window.dispatchEvent(new CustomEvent('mobileAccessibilityReady', {
                detail: { controller: this }
            }));
            
        } catch (error) {
            console.error('❌ Failed to initialize MobileAccessibilityController:', error);
        }
    }
    
    /**
     * Implement proper ARIA labels and roles for all interactive elements
     * Requirement: 6.1
     */
    implementARIALabelsAndRoles() {
        // Navigation elements
        this.enhanceNavigationAccessibility();
        
        // Form elements
        this.enhanceFormAccessibility();
        
        // Menu and dropdown elements
        this.enhanceMenuAccessibility();
        
        // Button elements
        this.enhanceButtonAccessibility();
        
        // Content sections
        this.enhanceContentAccessibility();
        
        // Interactive cards and components
        this.enhanceComponentAccessibility();
    }
    
    enhanceNavigationAccessibility() {
        // Main navigation
        const nav = document.querySelector('.nav');
        if (nav) {
            nav.setAttribute('role', 'navigation');
            nav.setAttribute('aria-label', 'Main navigation');
        }
        
        // Navigation tabs
        const navTabs = document.querySelector('.nav-tabs');
        if (navTabs) {
            navTabs.setAttribute('role', 'tablist');
            navTabs.setAttribute('aria-label', 'Content sections');
        }
        
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach((tab, index) => {
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', tab.classList.contains('active') ? 'true' : 'false');
            tab.setAttribute('aria-controls', this.getTabPanelId(tab));
            tab.setAttribute('tabindex', tab.classList.contains('active') ? '0' : '-1');
            
            // Add descriptive labels
            const tabText = tab.textContent.trim();
            tab.setAttribute('aria-label', `${tabText} section`);
        });
        
        // Menu overlay
        const menuOverlay = document.getElementById('menuOverlay');
        if (menuOverlay) {
            menuOverlay.setAttribute('role', 'dialog');
            menuOverlay.setAttribute('aria-modal', 'true');
            menuOverlay.setAttribute('aria-label', 'Main menu');
            menuOverlay.setAttribute('aria-hidden', menuOverlay.classList.contains('hidden') ? 'true' : 'false');
        }
        
        // Menu items
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const link = item.querySelector('.menu-link');
            if (link) {
                link.setAttribute('role', 'menuitem');
                const linkText = link.textContent.trim();
                link.setAttribute('aria-label', `Navigate to ${linkText}`);
            }
        });
        
        // Back button
        const backButton = document.getElementById('menuBack');
        if (backButton) {
            backButton.setAttribute('aria-label', 'Go back to main menu');
            backButton.setAttribute('role', 'button');
        }
    }
    
    enhanceFormAccessibility() {
        // Form groups
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            const label = group.querySelector('.form-label');
            const input = group.querySelector('.form-input, input, select, textarea');
            
            if (label && input) {
                // Ensure proper label association
                const labelId = label.id || `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const inputId = input.id || `input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                label.id = labelId;
                input.id = inputId;
                label.setAttribute('for', inputId);
                input.setAttribute('aria-labelledby', labelId);
                
                // Add required indicator
                if (input.hasAttribute('required')) {
                    input.setAttribute('aria-required', 'true');
                    if (!label.textContent.includes('*')) {
                        label.innerHTML += ' <span aria-label="required">*</span>';
                    }
                }
                
                // Add invalid state support
                input.setAttribute('aria-invalid', 'false');
            }
        });
        
        // Search inputs
        const searchInputs = document.querySelectorAll('input[type="search"], #playerSearchInput');
        searchInputs.forEach(input => {
            input.setAttribute('role', 'searchbox');
            input.setAttribute('aria-label', input.placeholder || 'Search');
            
            // Add search suggestions support
            const suggestionsList = input.nextElementSibling;
            if (suggestionsList && suggestionsList.classList.contains('suggestions')) {
                const listId = `suggestions-${input.id}`;
                suggestionsList.id = listId;
                suggestionsList.setAttribute('role', 'listbox');
                input.setAttribute('aria-owns', listId);
                input.setAttribute('aria-autocomplete', 'list');
            }
        });
        
        // Dropdown selects
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            select.setAttribute('aria-haspopup', 'listbox');
            
            // Add descriptive labels for hero sort select
            if (select.classList.contains('hero-sort-select')) {
                select.setAttribute('aria-label', 'Sort heroes by criteria');
            }
        });
    }
    
    enhanceMenuAccessibility() {
        // Profile dropdown
        const profileButton = document.getElementById('profileDropdownButton');
        const profileMenu = document.getElementById('profileDropdownMenu');
        
        if (profileButton && profileMenu) {
            profileButton.setAttribute('aria-haspopup', 'menu');
            profileButton.setAttribute('aria-expanded', 'false');
            profileButton.setAttribute('aria-controls', profileMenu.id);
            profileButton.setAttribute('aria-label', 'User profile menu');
            
            profileMenu.setAttribute('role', 'menu');
            profileMenu.setAttribute('aria-labelledby', profileButton.id);
            
            // Profile menu items
            const menuItems = profileMenu.querySelectorAll('.profile-option, .dropdown-option');
            menuItems.forEach(item => {
                item.setAttribute('role', 'menuitem');
                item.setAttribute('tabindex', '-1');
                
                // Add descriptive labels
                const text = item.textContent.trim();
                if (text.includes('Load')) {
                    item.setAttribute('aria-label', `Load profile: ${text.replace('Load Profile: ', '')}`);
                } else if (text.includes('Delete')) {
                    item.setAttribute('aria-label', `Delete profile: ${text.replace('Delete Profile: ', '')}`);
                }
            });
        }
        
        // Custom dropdowns
        const customDropdowns = document.querySelectorAll('[data-dropdown]');
        customDropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('[data-dropdown-trigger], button');
            const menu = dropdown.querySelector('[data-dropdown-menu], .dropdown-menu');
            
            if (trigger && menu) {
                trigger.setAttribute('aria-haspopup', 'menu');
                trigger.setAttribute('aria-expanded', 'false');
                trigger.setAttribute('aria-controls', menu.id || `menu-${Date.now()}`);
                
                menu.setAttribute('role', 'menu');
                menu.setAttribute('aria-labelledby', trigger.id || `trigger-${Date.now()}`);
            }
        });
    }
    
    enhanceButtonAccessibility() {
        const buttons = document.querySelectorAll('button, .btn');
        buttons.forEach(button => {
            // Ensure proper role
            if (!button.getAttribute('role')) {
                button.setAttribute('role', 'button');
            }
            
            // Add descriptive labels for icon-only buttons
            if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
                if (button.classList.contains('menu-toggle')) {
                    button.setAttribute('aria-label', 'Toggle main menu');
                } else if (button.id === 'refreshHeroStats') {
                    button.setAttribute('aria-label', 'Refresh hero statistics');
                } else if (button.textContent.includes('↻')) {
                    button.setAttribute('aria-label', 'Refresh data');
                }
            }
            
            // Add pressed state for toggle buttons
            if (button.classList.contains('toggle') || button.getAttribute('aria-pressed')) {
                button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
            }
            
            // Ensure minimum touch target size
            this.ensureMinimumTouchTarget(button);
        });
    }
    
    enhanceContentAccessibility() {
        // Main content sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.setAttribute('role', 'tabpanel');
            section.setAttribute('aria-hidden', section.classList.contains('active') ? 'false' : 'true');
            
            // Add section labels
            const sectionId = section.id;
            if (sectionId) {
                const sectionNames = {
                    'home': 'Dashboard',
                    'player-search': 'Player Search',
                    'match-search': 'Match Analysis', 
                    'hero-stats': 'Hero Statistics',
                    'item-stats': 'Item Statistics'
                };
                
                const sectionName = sectionNames[sectionId] || sectionId;
                section.setAttribute('aria-label', `${sectionName} section`);
            }
        });
        
        // Cards
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.setAttribute('role', 'region');
            
            const cardTitle = card.querySelector('.card-title');
            if (cardTitle) {
                const titleId = cardTitle.id || `title-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                cardTitle.id = titleId;
                card.setAttribute('aria-labelledby', titleId);
            }
        });
        
        // Hero cards
        const heroCards = document.querySelectorAll('.hero-card');
        heroCards.forEach(card => {
            card.setAttribute('role', 'article');
            card.setAttribute('tabindex', '0');
            
            const heroName = card.querySelector('.hero-info h3');
            if (heroName) {
                const heroNameText = heroName.textContent.trim();
                card.setAttribute('aria-label', `Hero statistics for ${heroNameText}`);
            }
        });
        
        // Loading states
        const loadingElements = document.querySelectorAll('.loading, .spinner');
        loadingElements.forEach(element => {
            element.setAttribute('role', 'status');
            element.setAttribute('aria-live', 'polite');
            element.setAttribute('aria-label', 'Loading content');
        });
    }
    
    enhanceComponentAccessibility() {
        // Grid containers
        const grids = document.querySelectorAll('.grid, .hero-cards-grid');
        grids.forEach(grid => {
            grid.setAttribute('role', 'grid');
            grid.setAttribute('aria-label', 'Data grid');
        });
        
        // Tables
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            table.setAttribute('role', 'table');
            
            const caption = table.querySelector('caption');
            if (!caption) {
                const newCaption = document.createElement('caption');
                newCaption.textContent = 'Data table';
                newCaption.className = 'sr-only';
                table.insertBefore(newCaption, table.firstChild);
            }
        });
        
        // Progress indicators
        const progressElements = document.querySelectorAll('[data-progress]');
        progressElements.forEach(element => {
            element.setAttribute('role', 'progressbar');
            element.setAttribute('aria-valuemin', '0');
            element.setAttribute('aria-valuemax', '100');
            
            const value = element.dataset.progress || '0';
            element.setAttribute('aria-valuenow', value);
            element.setAttribute('aria-valuetext', `${value}% complete`);
        });
    }
    
    /**
     * Add screen reader support for dynamic content updates
     * Requirement: 6.2
     */
    setupScreenReaderSupport() {
        this.createLiveRegion();
        this.setupDynamicContentAnnouncements();
        this.setupFormValidationAnnouncements();
        this.setupNavigationAnnouncements();
        this.setupDataUpdateAnnouncements();
    }
    
    createLiveRegion() {
        // Create a live region for screen reader announcements
        this.liveRegion = document.createElement('div');
        this.liveRegion.id = 'sr-live-region';
        this.liveRegion.setAttribute('aria-live', 'polite');
        this.liveRegion.setAttribute('aria-atomic', 'true');
        this.liveRegion.className = 'sr-only';
        
        // Create an assertive region for urgent announcements
        this.assertiveRegion = document.createElement('div');
        this.assertiveRegion.id = 'sr-assertive-region';
        this.assertiveRegion.setAttribute('aria-live', 'assertive');
        this.assertiveRegion.setAttribute('aria-atomic', 'true');
        this.assertiveRegion.className = 'sr-only';
        
        document.body.appendChild(this.liveRegion);
        document.body.appendChild(this.assertiveRegion);
    }
    
    announceToScreenReader(message, priority = 'polite') {
        if (!message || typeof message !== 'string') return;
        
        const region = priority === 'assertive' ? this.assertiveRegion : this.liveRegion;
        
        // Clear previous announcement
        region.textContent = '';
        
        // Add new announcement with slight delay to ensure it's read
        setTimeout(() => {
            region.textContent = message;
            
            // Clear after announcement to prevent re-reading
            setTimeout(() => {
                region.textContent = '';
            }, 1000);
        }, this.config.announcementDelay);
        
        // Track announcements
        this.screenReaderAnnouncements.push({
            message,
            priority,
            timestamp: Date.now()
        });
        
        // Limit announcement history
        if (this.screenReaderAnnouncements.length > this.config.maxAnnouncements) {
            this.screenReaderAnnouncements.shift();
        }
    }
    
    setupDynamicContentAnnouncements() {
        // Announce section changes
        document.addEventListener('sectionChange', (e) => {
            const sectionNames = {
                'home': 'Dashboard',
                'player-search': 'Player Search',
                'match-search': 'Match Analysis',
                'hero-stats': 'Hero Statistics',
                'item-stats': 'Item Statistics'
            };
            
            const sectionName = sectionNames[e.detail.section] || e.detail.section;
            this.announceToScreenReader(`Navigated to ${sectionName} section`);
        });
        
        // Announce menu state changes
        const menuOverlay = document.getElementById('menuOverlay');
        if (menuOverlay) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const isHidden = menuOverlay.classList.contains('hidden');
                        menuOverlay.setAttribute('aria-hidden', isHidden ? 'true' : 'false');
                        
                        if (!isHidden) {
                            this.announceToScreenReader('Main menu opened');
                        } else {
                            this.announceToScreenReader('Main menu closed');
                        }
                    }
                });
            });
            
            observer.observe(menuOverlay, { attributes: true, attributeFilter: ['class'] });
        }
        
        // Announce dropdown state changes
        this.setupDropdownAnnouncements();
    }
    
    setupDropdownAnnouncements() {
        const profileButton = document.getElementById('profileDropdownButton');
        const profileMenu = document.getElementById('profileDropdownMenu');
        
        if (profileButton && profileMenu) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && 
                        (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                        
                        const isVisible = profileMenu.style.display === 'block' && 
                                        !profileMenu.classList.contains('hidden');
                        
                        profileButton.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
                        
                        if (isVisible) {
                            this.announceToScreenReader('Profile menu opened');
                        } else {
                            this.announceToScreenReader('Profile menu closed');
                        }
                    }
                });
            });
            
            observer.observe(profileMenu, { 
                attributes: true, 
                attributeFilter: ['style', 'class'] 
            });
        }
    }
    
    setupFormValidationAnnouncements() {
        // Listen for validation messages
        document.addEventListener('validationMessage', (e) => {
            const { message, type, element } = e.detail;
            const fieldName = this.getFieldName(element);
            
            if (type === 'error') {
                this.announceToScreenReader(`Error in ${fieldName}: ${message}`, 'assertive');
            } else {
                this.announceToScreenReader(`${fieldName}: ${message}`);
            }
        });
        
        // Announce form submission results
        document.addEventListener('formSubmit', (e) => {
            const { success, message } = e.detail;
            
            if (success) {
                this.announceToScreenReader(`Form submitted successfully. ${message || ''}`);
            } else {
                this.announceToScreenReader(`Form submission failed. ${message || 'Please check for errors.'}`, 'assertive');
            }
        });
    }
    
    setupNavigationAnnouncements() {
        // Announce tab changes
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabText = tab.textContent.trim();
                this.announceToScreenReader(`Selected ${tabText} tab`);
            });
        });
        
        // Announce breadcrumb navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('breadcrumb-link')) {
                const sectionName = e.target.textContent.trim();
                this.announceToScreenReader(`Navigating to ${sectionName}`);
            }
        });
    }
    
    setupDataUpdateAnnouncements() {
        // Announce data loading states
        document.addEventListener('dataLoading', (e) => {
            const { type } = e.detail;
            this.announceToScreenReader(`Loading ${type} data`);
        });
        
        document.addEventListener('dataLoaded', (e) => {
            const { type, count } = e.detail;
            let message = `${type} data loaded`;
            
            if (count !== undefined) {
                message += `. ${count} items found`;
            }
            
            this.announceToScreenReader(message);
        });
        
        document.addEventListener('dataError', (e) => {
            const { type, error } = e.detail;
            this.announceToScreenReader(`Error loading ${type} data: ${error}`, 'assertive');
        });
    }
    
    getFieldName(element) {
        if (!element) return 'field';
        
        // Try to get field name from label
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) {
            return label.textContent.replace('*', '').trim();
        }
        
        // Try to get from aria-label
        if (element.getAttribute('aria-label')) {
            return element.getAttribute('aria-label');
        }
        
        // Try to get from placeholder
        if (element.placeholder) {
            return element.placeholder;
        }
        
        // Fallback to element type or id
        return element.type || element.id || 'field';
    }
    
    /**
     * Create keyboard navigation system that works with mobile browsers
     * Requirement: 6.3
     */
    createKeyboardNavigationSystem() {
        this.setupFocusableElementsManagement();
        this.setupKeyboardShortcuts();
        this.setupSkipLinks();
        this.setupFocusIndicators();
        this.setupMobileKeyboardSupport();
    }
    
    setupFocusableElementsManagement() {
        // Define focusable element selectors
        this.focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled])',
            '[role="menuitem"]:not([disabled])',
            '[role="tab"]:not([disabled])'
        ].join(', ');
        
        // Update tabindex for proper tab order
        this.updateTabOrder();
        
        // Handle dynamic content
        this.observeFocusableElements();
    }
    
    updateTabOrder() {
        const focusableElements = document.querySelectorAll(this.focusableSelectors);
        
        focusableElements.forEach((element, index) => {
            // Skip elements that already have explicit tabindex
            if (element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '0') {
                return;
            }
            
            // Set appropriate tabindex based on visibility and context
            if (this.isElementVisible(element)) {
                element.setAttribute('tabindex', '0');
            } else {
                element.setAttribute('tabindex', '-1');
            }
        });
    }
    
    observeFocusableElements() {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || 
                    (mutation.type === 'attributes' && 
                     ['style', 'class', 'hidden', 'disabled'].includes(mutation.attributeName))) {
                    shouldUpdate = true;
                }
            });
            
            if (shouldUpdate) {
                setTimeout(() => this.updateTabOrder(), 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class', 'hidden', 'disabled']
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip if user is typing in an input
            if (this.isTypingContext(e.target)) return;
            
            switch (e.key) {
                case 'Escape':
                    this.handleEscapeKey(e);
                    break;
                    
                case 'Tab':
                    this.handleTabKey(e);
                    break;
                    
                case 'Enter':
                case ' ':
                    this.handleActivationKey(e);
                    break;
                    
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    this.handleArrowKeys(e);
                    break;
                    
                case 'Home':
                case 'End':
                    this.handleHomeEndKeys(e);
                    break;
            }
            
            // Custom shortcuts
            if (e.altKey) {
                switch (e.key) {
                    case 'm':
                        e.preventDefault();
                        this.toggleMainMenu();
                        break;
                        
                    case 's':
                        e.preventDefault();
                        this.focusSearchInput();
                        break;
                        
                    case 'h':
                        e.preventDefault();
                        this.focusMainHeading();
                        break;
                }
            }
        });
    }
    
    handleEscapeKey(e) {
        // Close any open modals or dropdowns
        const openModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
        if (openModal) {
            e.preventDefault();
            this.closeModal(openModal);
            return;
        }
        
        const openDropdown = document.querySelector('[aria-expanded="true"]');
        if (openDropdown) {
            e.preventDefault();
            this.closeDropdown(openDropdown);
            return;
        }
        
        // Return focus to main content
        const mainContent = document.querySelector('main, [role="main"], .content');
        if (mainContent) {
            mainContent.focus();
        }
    }
    
    handleTabKey(e) {
        const focusableElements = this.getFocusableElements();
        const currentIndex = focusableElements.indexOf(document.activeElement);
        
        if (e.shiftKey) {
            // Shift+Tab - previous element
            if (currentIndex <= 0) {
                e.preventDefault();
                focusableElements[focusableElements.length - 1].focus();
            }
        } else {
            // Tab - next element
            if (currentIndex >= focusableElements.length - 1) {
                e.preventDefault();
                focusableElements[0].focus();
            }
        }
    }
    
    handleActivationKey(e) {
        const target = e.target;
        
        // Handle custom interactive elements
        if (target.getAttribute('role') === 'button' || 
            target.getAttribute('role') === 'menuitem' ||
            target.classList.contains('hero-card')) {
            
            e.preventDefault();
            target.click();
        }
    }
    
    handleArrowKeys(e) {
        const target = e.target;
        const role = target.getAttribute('role');
        
        // Handle tab navigation
        if (role === 'tab') {
            e.preventDefault();
            this.navigateTabs(e.key, target);
        }
        
        // Handle menu navigation
        if (role === 'menuitem') {
            e.preventDefault();
            this.navigateMenu(e.key, target);
        }
        
        // Handle grid navigation
        if (target.closest('[role="grid"]')) {
            e.preventDefault();
            this.navigateGrid(e.key, target);
        }
    }
    
    handleHomeEndKeys(e) {
        const focusableElements = this.getFocusableElements();
        
        if (e.key === 'Home') {
            e.preventDefault();
            focusableElements[0].focus();
        } else if (e.key === 'End') {
            e.preventDefault();
            focusableElements[focusableElements.length - 1].focus();
        }
    }
    
    setupSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#navigation" class="skip-link">Skip to navigation</a>
            <a href="#search" class="skip-link">Skip to search</a>
        `;
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
        
        // Add target elements if they don't exist
        this.ensureSkipTargets();
    }
    
    ensureSkipTargets() {
        const mainContent = document.querySelector('.content, main');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
        
        const navigation = document.querySelector('.nav, nav');
        if (navigation && !navigation.id) {
            navigation.id = 'navigation';
        }
        
        const searchInput = document.querySelector('#playerSearchInput, input[type="search"]');
        if (searchInput && !searchInput.id) {
            searchInput.id = 'search';
        }
    }
    
    setupFocusIndicators() {
        // Enhanced focus indicators for better visibility
        const style = document.createElement('style');
        style.textContent = `
            .focus-visible,
            *:focus-visible {
                outline: ${this.config.focusOutlineWidth} solid ${this.config.focusOutlineColor} !important;
                outline-offset: ${this.config.focusOutlineOffset} !important;
                box-shadow: 0 0 0 1px ${this.config.focusOutlineColor} !important;
            }
            
            /* High contrast focus indicators */
            @media (prefers-contrast: high) {
                .focus-visible,
                *:focus-visible {
                    outline-color: #ffffff !important;
                    box-shadow: 0 0 0 1px #ffffff, 0 0 0 3px #000000 !important;
                }
            }
            
            /* Remove default focus outline to use custom one */
            *:focus {
                outline: none;
            }
            
            /* Skip links styling */
            .skip-links {
                position: absolute;
                top: -100px;
                left: 0;
                z-index: 10000;
            }
            
            .skip-link {
                position: absolute;
                top: 0;
                left: 0;
                background: var(--bg-primary);
                color: var(--text-primary);
                padding: 8px 16px;
                text-decoration: none;
                border: 2px solid var(--accent);
                border-radius: 4px;
                font-weight: bold;
                transform: translateY(-100%);
                transition: transform 0.2s ease;
            }
            
            .skip-link:focus {
                transform: translateY(100%);
                outline: 2px solid var(--accent);
                outline-offset: 2px;
            }
            
            /* Screen reader only content */
            .sr-only {
                position: absolute !important;
                width: 1px !important;
                height: 1px !important;
                padding: 0 !important;
                margin: -1px !important;
                overflow: hidden !important;
                clip: rect(0, 0, 0, 0) !important;
                white-space: nowrap !important;
                border: 0 !important;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    setupMobileKeyboardSupport() {
        // Handle virtual keyboard on mobile
        if (this.viewportManager) {
            this.viewportManager.onViewportChange(() => {
                this.updateFocusForViewport();
            });
        }
        
        // Handle touch and keyboard interaction
        document.addEventListener('touchstart', () => {
            document.body.classList.add('using-touch');
            document.body.classList.remove('using-keyboard');
        }, { passive: true });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('using-keyboard');
                document.body.classList.remove('using-touch');
            }
        });
    }
    
    /**
     * Implement high contrast mode support with proper color adjustments
     * Requirement: 6.3
     */
    implementHighContrastMode() {
        this.detectHighContrastPreference();
        this.createHighContrastToggle();
        this.setupContrastAdjustments();
        this.monitorContrastChanges();
    }
    
    detectHighContrastPreference() {
        // Check system preference
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
        
        // Check stored preference
        const storedPreference = localStorage.getItem('highContrastMode');
        
        this.isHighContrastMode = prefersHighContrast || storedPreference === 'true';
        
        if (this.isHighContrastMode) {
            this.enableHighContrastMode();
        }
    }
    
    createHighContrastToggle() {
        const toggle = document.createElement('button');
        toggle.id = 'high-contrast-toggle';
        toggle.className = 'accessibility-toggle';
        toggle.setAttribute('aria-label', 'Toggle high contrast mode');
        toggle.setAttribute('aria-pressed', this.isHighContrastMode ? 'true' : 'false');
        toggle.innerHTML = `
            <span class="toggle-icon">🎨</span>
            <span class="toggle-text">High Contrast</span>
        `;
        
        toggle.addEventListener('click', () => {
            this.toggleHighContrastMode();
        });
        
        // Add to header or create accessibility toolbar
        const header = document.querySelector('.header .container');
        if (header) {
            header.appendChild(toggle);
        }
    }
    
    toggleHighContrastMode() {
        this.isHighContrastMode = !this.isHighContrastMode;
        
        if (this.isHighContrastMode) {
            this.enableHighContrastMode();
        } else {
            this.disableHighContrastMode();
        }
        
        // Update toggle state
        const toggle = document.getElementById('high-contrast-toggle');
        if (toggle) {
            toggle.setAttribute('aria-pressed', this.isHighContrastMode ? 'true' : 'false');
        }
        
        // Store preference
        localStorage.setItem('highContrastMode', this.isHighContrastMode.toString());
        
        // Announce change
        this.announceToScreenReader(
            `High contrast mode ${this.isHighContrastMode ? 'enabled' : 'disabled'}`
        );
    }
    
    enableHighContrastMode() {
        document.body.classList.add('high-contrast-mode');
        this.applyHighContrastStyles();
    }
    
    disableHighContrastMode() {
        document.body.classList.remove('high-contrast-mode');
        this.removeHighContrastStyles();
    }
    
    applyHighContrastStyles() {
        const style = document.createElement('style');
        style.id = 'high-contrast-styles';
        style.textContent = `
            .high-contrast-mode {
                --primary: #000000;
                --secondary: #ffffff;
                --accent: #ffff00;
                --bg-primary: #000000;
                --bg-secondary: #000000;
                --bg-card: #000000;
                --text-primary: #ffffff;
                --text-secondary: #ffffff;
                --border: #ffffff;
                --success: #00ff00;
                --error: #ff0000;
            }
            
            .high-contrast-mode * {
                background-color: #000000 !important;
                color: #ffffff !important;
                border-color: #ffffff !important;
            }
            
            .high-contrast-mode button,
            .high-contrast-mode .btn {
                background-color: #ffffff !important;
                color: #000000 !important;
                border: 2px solid #ffffff !important;
            }
            
            .high-contrast-mode button:hover,
            .high-contrast-mode .btn:hover,
            .high-contrast-mode button:focus,
            .high-contrast-mode .btn:focus {
                background-color: #ffff00 !important;
                color: #000000 !important;
                border-color: #ffff00 !important;
            }
            
            .high-contrast-mode input,
            .high-contrast-mode select,
            .high-contrast-mode textarea {
                background-color: #ffffff !important;
                color: #000000 !important;
                border: 2px solid #ffffff !important;
            }
            
            .high-contrast-mode input:focus,
            .high-contrast-mode select:focus,
            .high-contrast-mode textarea:focus {
                background-color: #ffff00 !important;
                color: #000000 !important;
                border-color: #ffff00 !important;
            }
            
            .high-contrast-mode a {
                color: #ffff00 !important;
                text-decoration: underline !important;
            }
            
            .high-contrast-mode a:hover,
            .high-contrast-mode a:focus {
                color: #ffffff !important;
                background-color: #ffff00 !important;
            }
            
            .high-contrast-mode .nav-tab.active {
                background-color: #ffff00 !important;
                color: #000000 !important;
            }
            
            .high-contrast-mode .hero-card,
            .high-contrast-mode .card {
                border: 3px solid #ffffff !important;
            }
            
            .high-contrast-mode .validation-message {
                background-color: #ff0000 !important;
                color: #ffffff !important;
                border: 2px solid #ffffff !important;
            }
            
            .high-contrast-mode .menu-overlay {
                background-color: #000000 !important;
            }
            
            .high-contrast-mode .menu-item {
                border-color: #ffffff !important;
            }
            
            .high-contrast-mode .menu-link {
                color: #ffffff !important;
            }
            
            .high-contrast-mode .menu-marquee {
                background-color: #ffffff !important;
            }
            
            .high-contrast-mode .marquee-text {
                color: #000000 !important;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    removeHighContrastStyles() {
        const existingStyle = document.getElementById('high-contrast-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
    }
    
    setupContrastAdjustments() {
        // Monitor contrast ratio and adjust as needed
        this.checkContrastRatios();
    }
    
    checkContrastRatios() {
        // This would typically involve more complex color analysis
        // For now, we'll ensure minimum contrast ratios are met
        const elements = document.querySelectorAll('*');
        
        elements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const backgroundColor = styles.backgroundColor;
            const color = styles.color;
            
            // Simple contrast check (would need more sophisticated implementation)
            if (this.isHighContrastMode && backgroundColor !== 'rgba(0, 0, 0, 0)') {
                this.ensureMinimumContrast(element, backgroundColor, color);
            }
        });
    }
    
    ensureMinimumContrast(element, backgroundColor, textColor) {
        // Simplified contrast enforcement
        if (this.isHighContrastMode) {
            element.style.backgroundColor = '#000000';
            element.style.color = '#ffffff';
        }
    }
    
    monitorContrastChanges() {
        // Listen for system contrast preference changes
        const contrastQuery = window.matchMedia('(prefers-contrast: high)');
        contrastQuery.addListener((e) => {
            if (e.matches && !this.isHighContrastMode) {
                this.enableHighContrastMode();
            } else if (!e.matches && this.isHighContrastMode) {
                // Only disable if user hasn't manually enabled it
                const manuallyEnabled = localStorage.getItem('highContrastMode') === 'true';
                if (!manuallyEnabled) {
                    this.disableHighContrastMode();
                }
            }
        });
    }
    
    /**
     * Add focus management system for modal dialogs and dropdowns
     * Requirement: 6.4
     */
    setupFocusManagement() {
        this.setupModalFocusManagement();
        this.setupDropdownFocusManagement();
        this.setupFocusTrapping();
        this.setupFocusRestoration();
    }
    
    setupModalFocusManagement() {
        // Monitor for modal dialogs
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const modal = node.querySelector('[role="dialog"]') || 
                                    (node.getAttribute && node.getAttribute('role') === 'dialog' ? node : null);
                        
                        if (modal) {
                            this.setupModalFocus(modal);
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Handle existing modals
        const existingModals = document.querySelectorAll('[role="dialog"]');
        existingModals.forEach(modal => {
            this.setupModalFocus(modal);
        });
    }
    
    setupModalFocus(modal) {
        // Store the element that had focus before modal opened
        const previouslyFocused = document.activeElement;
        
        // Set up focus trap
        this.createFocusTrap(modal, previouslyFocused);
        
        // Focus the modal or first focusable element
        const firstFocusable = modal.querySelector(this.focusableSelectors);
        if (firstFocusable) {
            firstFocusable.focus();
        } else {
            modal.setAttribute('tabindex', '-1');
            modal.focus();
        }
        
        // Handle modal close
        const closeModal = () => {
            this.removeFocusTrap(modal);
            if (previouslyFocused && previouslyFocused.focus) {
                previouslyFocused.focus();
            }
        };
        
        // Listen for modal close events
        modal.addEventListener('modalClose', closeModal);
        
        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        
        // Store cleanup function
        modal._focusCleanup = () => {
            document.removeEventListener('keydown', handleEscape);
            modal.removeEventListener('modalClose', closeModal);
        };
    }
    
    setupDropdownFocusManagement() {
        // Profile dropdown
        const profileButton = document.getElementById('profileDropdownButton');
        const profileMenu = document.getElementById('profileDropdownMenu');
        
        if (profileButton && profileMenu) {
            this.setupDropdownFocus(profileButton, profileMenu);
        }
        
        // Other dropdowns
        const dropdowns = document.querySelectorAll('[data-dropdown]');
        dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('[data-dropdown-trigger], button');
            const menu = dropdown.querySelector('[data-dropdown-menu], .dropdown-menu');
            
            if (trigger && menu) {
                this.setupDropdownFocus(trigger, menu);
            }
        });
    }
    
    setupDropdownFocus(trigger, menu) {
        let isOpen = false;
        
        const openDropdown = () => {
            isOpen = true;
            
            // Create focus trap
            this.createFocusTrap(menu, trigger);
            
            // Focus first menu item
            const firstMenuItem = menu.querySelector('[role="menuitem"]');
            if (firstMenuItem) {
                firstMenuItem.focus();
            }
            
            // Update ARIA
            trigger.setAttribute('aria-expanded', 'true');
        };
        
        const closeDropdown = () => {
            isOpen = false;
            
            // Remove focus trap
            this.removeFocusTrap(menu);
            
            // Return focus to trigger
            trigger.focus();
            
            // Update ARIA
            trigger.setAttribute('aria-expanded', 'false');
        };
        
        // Monitor dropdown visibility
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                    
                    const wasOpen = isOpen;
                    const isNowOpen = menu.style.display === 'block' && 
                                    !menu.classList.contains('hidden');
                    
                    if (!wasOpen && isNowOpen) {
                        setTimeout(openDropdown, 10);
                    } else if (wasOpen && !isNowOpen) {
                        closeDropdown();
                    }
                }
            });
        });
        
        observer.observe(menu, { 
            attributes: true, 
            attributeFilter: ['style', 'class'] 
        });
        
        // Handle keyboard navigation within menu
        menu.addEventListener('keydown', (e) => {
            if (!isOpen) return;
            
            const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"]'));
            const currentIndex = menuItems.indexOf(document.activeElement);
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % menuItems.length;
                    menuItems[nextIndex].focus();
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    const prevIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
                    menuItems[prevIndex].focus();
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    menuItems[0].focus();
                    break;
                    
                case 'End':
                    e.preventDefault();
                    menuItems[menuItems.length - 1].focus();
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    closeDropdown();
                    break;
            }
        });
    }
    
    createFocusTrap(container, returnFocus) {
        const focusableElements = container.querySelectorAll(this.focusableSelectors);
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        const trapFocus = (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        };
        
        document.addEventListener('keydown', trapFocus);
        
        // Store trap info
        this.focusTraps.set(container, {
            trapFocus,
            returnFocus,
            firstFocusable,
            lastFocusable
        });
    }
    
    removeFocusTrap(container) {
        const trapInfo = this.focusTraps.get(container);
        if (trapInfo) {
            document.removeEventListener('keydown', trapInfo.trapFocus);
            this.focusTraps.delete(container);
        }
    }
    
    setupFocusTrapping() {
        // Handle focus trapping for dynamically created elements
        document.addEventListener('focustrap:create', (e) => {
            const { container, returnFocus } = e.detail;
            this.createFocusTrap(container, returnFocus);
        });
        
        document.addEventListener('focustrap:remove', (e) => {
            const { container } = e.detail;
            this.removeFocusTrap(container);
        });
    }
    
    setupFocusRestoration() {
        // Track focus history for better restoration
        document.addEventListener('focusin', (e) => {
            this.focusHistory.push({
                element: e.target,
                timestamp: Date.now()
            });
            
            // Limit history size
            if (this.focusHistory.length > 10) {
                this.focusHistory.shift();
            }
        });
    }
    
    /**
     * Enhance interactive elements for accessibility
     */
    enhanceInteractiveElements() {
        this.enhanceTouchTargets();
        this.addKeyboardSupport();
        this.improveVisualFeedback();
    }
    
    enhanceTouchTargets() {
        const interactiveElements = document.querySelectorAll(this.focusableSelectors);
        
        interactiveElements.forEach(element => {
            this.ensureMinimumTouchTarget(element);
        });
    }
    
    ensureMinimumTouchTarget(element) {
        const rect = element.getBoundingClientRect();
        const minSize = this.config.minTouchTarget;
        
        if (rect.width < minSize || rect.height < minSize) {
            element.style.minWidth = `${minSize}px`;
            element.style.minHeight = `${minSize}px`;
            element.style.display = element.style.display || 'inline-flex';
            element.style.alignItems = 'center';
            element.style.justifyContent = 'center';
        }
    }
    
    addKeyboardSupport() {
        // Add keyboard support to elements that need it
        const customInteractive = document.querySelectorAll('.hero-card, [data-clickable]');
        
        customInteractive.forEach(element => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
            
            if (!element.getAttribute('role')) {
                element.setAttribute('role', 'button');
            }
            
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    element.click();
                }
            });
        });
    }
    
    improveVisualFeedback() {
        // Add visual feedback for interactive elements
        const style = document.createElement('style');
        style.textContent = `
            .accessibility-toggle {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9999;
                background: var(--bg-card);
                border: 2px solid var(--border);
                color: var(--text-primary);
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s ease;
            }
            
            .accessibility-toggle:hover,
            .accessibility-toggle:focus {
                background: var(--accent);
                color: var(--primary);
                transform: scale(1.05);
            }
            
            .toggle-icon {
                font-size: 16px;
            }
            
            @media (max-width: 768px) {
                .accessibility-toggle {
                    top: 5px;
                    right: 5px;
                    padding: 6px 10px;
                    font-size: 12px;
                }
                
                .toggle-text {
                    display: none;
                }
            }
            
            /* Enhanced interactive feedback */
            [role="button"]:not(button):hover,
            .hero-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            [role="button"]:not(button):active,
            .hero-card:active {
                transform: translateY(0);
            }
            
            /* Improved focus indicators for touch devices */
            @media (hover: none) {
                .focus-visible,
                *:focus-visible {
                    outline-width: 4px !important;
                    outline-offset: 4px !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Setup accessibility event handlers
     */
    setupAccessibilityEventHandlers() {
        // Handle viewport changes
        if (this.viewportManager) {
            this.viewportManager.onViewportChange(() => {
                this.updateAccessibilityForViewport();
            });
        }
        
        // Handle dynamic content changes
        document.addEventListener('DOMContentLoaded', () => {
            this.updateTabOrder();
        });
        
        // Handle section changes
        document.addEventListener('sectionChange', () => {
            setTimeout(() => {
                this.updateTabOrder();
                this.updateAccessibilityForNewContent();
            }, 100);
        });
    }
    
    updateAccessibilityForViewport() {
        // Update touch targets for current viewport
        this.enhanceTouchTargets();
        
        // Update focus management for mobile
        this.updateFocusForViewport();
    }
    
    updateFocusForViewport() {
        const isMobile = this.viewportManager && this.viewportManager.isMobileOrTablet();
        
        if (isMobile) {
            // Larger focus indicators for mobile
            document.documentElement.style.setProperty('--focus-outline-width', '4px');
            document.documentElement.style.setProperty('--focus-outline-offset', '4px');
        } else {
            // Standard focus indicators for desktop
            document.documentElement.style.setProperty('--focus-outline-width', '2px');
            document.documentElement.style.setProperty('--focus-outline-offset', '2px');
        }
    }
    
    updateAccessibilityForNewContent() {
        // Re-apply accessibility enhancements to new content
        this.implementARIALabelsAndRoles();
        this.enhanceInteractiveElements();
        this.updateTabOrder();
    }
    
    /**
     * Utility methods
     */
    
    getFocusableElements() {
        return Array.from(document.querySelectorAll(this.focusableSelectors))
            .filter(element => this.isElementVisible(element) && !element.disabled);
    }
    
    isElementVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               element.offsetParent !== null &&
               !element.hasAttribute('hidden');
    }
    
    isTypingContext(element) {
        const typingElements = ['INPUT', 'TEXTAREA', 'SELECT'];
        return typingElements.includes(element.tagName) ||
               element.contentEditable === 'true';
    }
    
    getTabPanelId(tab) {
        // Extract panel ID from tab
        const tabText = tab.textContent.trim().toLowerCase().replace(/\s+/g, '-');
        return tabText;
    }
    
    navigateTabs(direction, currentTab) {
        const tabs = Array.from(document.querySelectorAll('.nav-tab'));
        const currentIndex = tabs.indexOf(currentTab);
        let nextIndex;
        
        if (direction === 'ArrowLeft') {
            nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        } else if (direction === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % tabs.length;
        }
        
        if (nextIndex !== undefined) {
            tabs[nextIndex].focus();
            tabs[nextIndex].click();
        }
    }
    
    navigateMenu(direction, currentItem) {
        const menuItems = Array.from(currentItem.closest('[role="menu"]').querySelectorAll('[role="menuitem"]'));
        const currentIndex = menuItems.indexOf(currentItem);
        let nextIndex;
        
        if (direction === 'ArrowUp') {
            nextIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
        } else if (direction === 'ArrowDown') {
            nextIndex = (currentIndex + 1) % menuItems.length;
        }
        
        if (nextIndex !== undefined) {
            menuItems[nextIndex].focus();
        }
    }
    
    navigateGrid(direction, currentElement) {
        const grid = currentElement.closest('[role="grid"]');
        const gridItems = Array.from(grid.querySelectorAll('[tabindex="0"], [role="gridcell"]'));
        const currentIndex = gridItems.indexOf(currentElement);
        
        // Simple grid navigation (would need more sophisticated implementation for complex grids)
        let nextIndex;
        
        switch (direction) {
            case 'ArrowUp':
                nextIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowDown':
                nextIndex = Math.min(gridItems.length - 1, currentIndex + 1);
                break;
            case 'ArrowLeft':
                nextIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowRight':
                nextIndex = Math.min(gridItems.length - 1, currentIndex + 1);
                break;
        }
        
        if (nextIndex !== undefined && gridItems[nextIndex]) {
            gridItems[nextIndex].focus();
        }
    }
    
    toggleMainMenu() {
        const menuOverlay = document.getElementById('menuOverlay');
        if (menuOverlay) {
            if (menuOverlay.classList.contains('hidden')) {
                if (window.showMenu) window.showMenu();
            } else {
                if (window.hideMenu) window.hideMenu();
            }
        }
    }
    
    focusSearchInput() {
        const searchInput = document.querySelector('#playerSearchInput, input[type="search"]');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    focusMainHeading() {
        const mainHeading = document.querySelector('h1, .welcome-title, .card-title');
        if (mainHeading) {
            mainHeading.setAttribute('tabindex', '-1');
            mainHeading.focus();
        }
    }
    
    closeModal(modal) {
        // Trigger modal close event
        modal.dispatchEvent(new CustomEvent('modalClose'));
        
        // Hide modal
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
    
    closeDropdown(trigger) {
        // Find associated dropdown
        const dropdownId = trigger.getAttribute('aria-controls');
        const dropdown = dropdownId ? document.getElementById(dropdownId) : 
                        trigger.nextElementSibling;
        
        if (dropdown) {
            dropdown.style.display = 'none';
            dropdown.classList.add('hidden');
            trigger.setAttribute('aria-expanded', 'false');
        }
    }
    
    /**
     * Public API methods
     */
    
    announceMessage(message, priority = 'polite') {
        this.announceToScreenReader(message, priority);
    }
    
    enableHighContrast() {
        if (!this.isHighContrastMode) {
            this.toggleHighContrastMode();
        }
    }
    
    disableHighContrast() {
        if (this.isHighContrastMode) {
            this.toggleHighContrastMode();
        }
    }
    
    focusElement(element) {
        if (element && element.focus) {
            element.focus();
        }
    }
    
    createFocusTrapForElement(element, returnFocus) {
        this.createFocusTrap(element, returnFocus);
    }
    
    removeFocusTrapForElement(element) {
        this.removeFocusTrap(element);
    }
    
    getAccessibilityStatus() {
        return {
            isInitialized: this.isInitialized,
            isHighContrastMode: this.isHighContrastMode,
            focusTrapsActive: this.focusTraps.size,
            recentAnnouncements: this.screenReaderAnnouncements.slice(-3)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileAccessibilityController;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    window.MobileAccessibilityController = MobileAccessibilityController;
}
/**
 * MobileFormOptimizer - Optimizes form inputs and controls for mobile interaction
 * Handles iOS zoom prevention, dropdown enhancements, validation feedback, and virtual keyboard detection
 */
class MobileFormOptimizer {
    constructor(viewportManager = null) {
        this.viewportManager = viewportManager || window.mobileViewportManager;
        this.isInitialized = false;
        this.virtualKeyboardHeight = 0;
        this.isVirtualKeyboardOpen = false;
        this.focusedElement = null;
        this.originalViewportHeight = window.innerHeight;
        
        this.config = {
            minFontSize: 16, // Minimum font size to prevent iOS zoom
            touchTargetSize: 44, // Minimum touch target size
            validationDelay: 300, // Delay before showing validation
            keyboardDetectionThreshold: 150, // Height change threshold for keyboard detection
            animationDuration: 300 // Animation duration for transitions
        };
        
        this.init();
    }
    
    /**
     * Initialize mobile form optimizations
     */
    init() {
        if (this.isInitialized) return;
        
        try {
            this.setupIOSZoomPrevention();
            this.enhanceDropdowns();
            this.setupValidationFeedback();
            this.setupVirtualKeyboardDetection();
            this.optimizeFormInputs();
            this.setupFormEventHandlers();
            
            this.isInitialized = true;
            console.log('MobileFormOptimizer initialized successfully');
            
            // Dispatch initialization event
            window.dispatchEvent(new CustomEvent('mobileFormOptimizerReady', {
                detail: { optimizer: this }
            }));
            
        } catch (error) {
            console.error('Failed to initialize MobileFormOptimizer:', error);
        }
    }
    
    /**
     * Setup iOS zoom prevention for form inputs
     */
    setupIOSZoomPrevention() {
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            this.preventIOSZoom(input);
        });
        
        // Watch for dynamically added inputs
        this.observeNewInputs();
    }
    
    /**
     * Prevent iOS zoom on input focus by ensuring minimum font size
     */
    preventIOSZoom(input) {
        if (!input) return;
        
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (!isIOS) return;
        
        // Get current font size
        const computedStyle = window.getComputedStyle(input);
        const currentFontSize = parseFloat(computedStyle.fontSize);
        
        // Set minimum font size to prevent zoom
        if (currentFontSize < this.config.minFontSize) {
            input.style.fontSize = `${this.config.minFontSize}px`;
        }
        
        // Ensure input has proper styling for iOS
        input.style.webkitBorderRadius = '0';
        input.style.borderRadius = '0';
        input.style.webkitAppearance = 'none';
        input.style.appearance = 'none';
        
        // Add iOS-specific class for additional styling
        input.classList.add('ios-optimized');
    }
    
    /**
     * Enhance dropdown and select element styling for mobile interaction
     */
    enhanceDropdowns() {
        const selects = document.querySelectorAll('select');
        const customDropdowns = document.querySelectorAll('[data-dropdown]');
        
        // Enhance native select elements
        selects.forEach(select => {
            this.enhanceNativeSelect(select);
        });
        
        // Enhance custom dropdowns
        customDropdowns.forEach(dropdown => {
            this.enhanceCustomDropdown(dropdown);
        });
        
        // Enhance profile dropdown specifically
        this.enhanceProfileDropdown();
    }
    
    /**
     * Enhance native select elements for mobile
     */
    enhanceNativeSelect(select) {
        if (!select) return;
        
        // Ensure minimum touch target size
        select.style.minHeight = `${this.config.touchTargetSize}px`;
        select.style.minWidth = `${this.config.touchTargetSize}px`;
        
        // Prevent iOS zoom
        this.preventIOSZoom(select);
        
        // Add mobile-friendly styling
        select.classList.add('mobile-optimized-select');
        
        // Improve visual feedback
        select.addEventListener('focus', () => {
            select.classList.add('select-focused');
        });
        
        select.addEventListener('blur', () => {
            select.classList.remove('select-focused');
        });
        
        // Handle change events with better UX
        select.addEventListener('change', (e) => {
            this.handleSelectChange(e.target);
        });
    }
    
    /**
     * Enhance custom dropdown elements
     */
    enhanceCustomDropdown(dropdown) {
        const trigger = dropdown.querySelector('[data-dropdown-trigger]') || 
                       dropdown.querySelector('button') ||
                       dropdown.querySelector('.dropdown-trigger');
        const menu = dropdown.querySelector('[data-dropdown-menu]') ||
                    dropdown.querySelector('.dropdown-menu');
        
        if (!trigger || !menu) return;
        
        // Ensure touch-friendly trigger
        trigger.style.minHeight = `${this.config.touchTargetSize}px`;
        trigger.style.minWidth = `${this.config.touchTargetSize}px`;
        
        // Add mobile-specific event handlers
        this.setupDropdownInteraction(trigger, menu, dropdown);
    }
    
    /**
     * Enhance profile dropdown specifically
     */
    enhanceProfileDropdown() {
        const profileButton = document.querySelector('#profileDropdownButton');
        const profileMenu = document.querySelector('#profileDropdownMenu');
        
        if (!profileButton || !profileMenu) return;
        
        // Ensure proper mobile sizing
        profileButton.style.minHeight = `${this.config.touchTargetSize}px`;
        
        // Add mobile-specific positioning
        this.setupProfileDropdownPositioning(profileButton, profileMenu);
        
        // Enhance menu items for touch interaction
        const menuItems = profileMenu.querySelectorAll('.profile-option, .dropdown-option');
        menuItems.forEach(item => {
            item.style.minHeight = `${this.config.touchTargetSize}px`;
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.padding = '12px 16px';
            
            // Add touch feedback
            item.addEventListener('touchstart', () => {
                item.classList.add('touch-active');
            }, { passive: true });
            
            item.addEventListener('touchend', () => {
                item.classList.remove('touch-active');
            }, { passive: true });
        });
    }
    
    /**
     * Setup dropdown interaction for mobile
     */
    setupDropdownInteraction(trigger, menu, dropdown) {
        let isOpen = false;
        
        const toggleDropdown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            isOpen = !isOpen;
            
            if (isOpen) {
                this.openDropdown(menu, trigger);
            } else {
                this.closeDropdown(menu);
            }
        };
        
        // Handle both click and touch events
        trigger.addEventListener('click', toggleDropdown);
        trigger.addEventListener('touchend', (e) => {
            e.preventDefault();
            toggleDropdown(e);
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && isOpen) {
                this.closeDropdown(menu);
                isOpen = false;
            }
        });
        
        // Handle keyboard navigation
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDropdown(e);
            }
        });
    }
    
    /**
     * Open dropdown with mobile-optimized positioning
     */
    openDropdown(menu, trigger) {
        menu.style.display = 'block';
        menu.classList.remove('hidden');
        
        // Position dropdown within viewport bounds
        this.positionDropdownMobile(trigger, menu);
        
        // Add animation
        menu.style.opacity = '0';
        menu.style.transform = 'translateY(-10px)';
        
        requestAnimationFrame(() => {
            menu.style.transition = `opacity ${this.config.animationDuration}ms ease, transform ${this.config.animationDuration}ms ease`;
            menu.style.opacity = '1';
            menu.style.transform = 'translateY(0)';
        });
        
        // Scroll into view if needed
        setTimeout(() => {
            if (this.viewportManager && this.viewportManager.isMobileOrTablet()) {
                menu.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
    }
    
    /**
     * Close dropdown with animation
     */
    closeDropdown(menu) {
        menu.style.transition = `opacity ${this.config.animationDuration}ms ease, transform ${this.config.animationDuration}ms ease`;
        menu.style.opacity = '0';
        menu.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            menu.style.display = 'none';
            menu.classList.add('hidden');
        }, this.config.animationDuration);
    }
    
    /**
     * Position dropdown for mobile devices
     */
    positionDropdownMobile(trigger, menu) {
        if (!this.viewportManager) {
            // Fallback positioning
            this.positionDropdownFallback(trigger, menu);
            return;
        }
        
        const positioningUtils = this.viewportManager.getPositioningUtils();
        const position = positioningUtils.calculateDropdownPosition(trigger, menu, 'bottom');
        
        if (position) {
            menu.style.position = 'fixed';
            menu.style.top = `${position.top}px`;
            menu.style.left = `${position.left}px`;
            menu.style.zIndex = '2000';
            
            // Ensure menu fits within viewport on mobile
            if (this.viewportManager.isMobileOrTablet()) {
                const viewport = this.viewportManager.getAvailableViewport();
                const maxWidth = Math.min(viewport.width - 32, 400); // Max 400px or viewport - margins
                menu.style.maxWidth = `${maxWidth}px`;
                menu.style.width = 'auto';
                menu.style.maxHeight = `${viewport.height * 0.6}px`; // Max 60% of viewport height
                menu.style.overflowY = 'auto';
            }
        }
    }
    
    /**
     * Fallback positioning when ViewportManager is not available
     */
    positionDropdownFallback(trigger, menu) {
        const triggerRect = trigger.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        let top = triggerRect.bottom + 4;
        let left = triggerRect.left;
        
        // Adjust if menu would go off-screen horizontally
        if (left + menuRect.width > viewport.width - 16) {
            left = viewport.width - menuRect.width - 16;
        }
        if (left < 16) {
            left = 16;
        }
        
        // Adjust if menu would go off-screen vertically
        if (top + menuRect.height > viewport.height - 16) {
            top = triggerRect.top - menuRect.height - 4;
            if (top < 16) {
                top = 16;
            }
        }
        
        menu.style.position = 'fixed';
        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
        menu.style.zIndex = '2000';
        
        // Mobile-specific constraints
        if (window.innerWidth <= 768) {
            menu.style.maxWidth = `${viewport.width - 32}px`;
            menu.style.maxHeight = `${viewport.height * 0.6}px`;
            menu.style.overflowY = 'auto';
        }
    }
    
    /**
     * Setup profile dropdown positioning
     */
    setupProfileDropdownPositioning(button, menu) {
        const positionProfileMenu = () => {
            this.positionDropdownMobile(button, menu);
        };
        
        // Position when menu becomes visible
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (menu.style.display === 'block' && !menu.classList.contains('hidden')) {
                        setTimeout(positionProfileMenu, 10);
                    }
                }
            });
        });
        
        observer.observe(menu, { attributes: true, attributeFilter: ['style'] });
        
        // Reposition on viewport changes
        if (this.viewportManager) {
            this.viewportManager.onViewportChange(() => {
                if (menu.style.display === 'block' && !menu.classList.contains('hidden')) {
                    positionProfileMenu();
                }
            });
        }
    }
    
    /**
     * Add mobile-friendly validation feedback with proper positioning
     */
    setupValidationFeedback() {
        const forms = document.querySelectorAll('form');
        const inputs = document.querySelectorAll('input, textarea, select');
        
        // Setup validation for individual inputs
        inputs.forEach(input => {
            this.setupInputValidation(input);
        });
        
        // Setup form submission validation
        forms.forEach(form => {
            this.setupFormValidation(form);
        });
    }
    
    /**
     * Setup validation for individual input
     */
    setupInputValidation(input) {
        let validationTimeout;
        
        const showValidation = (message, type = 'error') => {
            this.showValidationMessage(input, message, type);
        };
        
        const hideValidation = () => {
            this.hideValidationMessage(input);
        };
        
        // Validate on input with debouncing
        input.addEventListener('input', () => {
            clearTimeout(validationTimeout);
            validationTimeout = setTimeout(() => {
                this.validateInput(input, showValidation, hideValidation);
            }, this.config.validationDelay);
        });
        
        // Validate on blur
        input.addEventListener('blur', () => {
            clearTimeout(validationTimeout);
            this.validateInput(input, showValidation, hideValidation);
        });
        
        // Clear validation on focus
        input.addEventListener('focus', () => {
            hideValidation();
        });
    }
    
    /**
     * Validate individual input
     */
    validateInput(input, showValidation, hideValidation) {
        const value = input.value.trim();
        const type = input.type;
        const required = input.hasAttribute('required');
        
        // Clear previous validation
        hideValidation();
        
        // Required field validation
        if (required && !value) {
            showValidation('This field is required', 'error');
            return false;
        }
        
        // Type-specific validation
        if (value) {
            switch (type) {
                case 'email':
                    if (!this.isValidEmail(value)) {
                        showValidation('Please enter a valid email address', 'error');
                        return false;
                    }
                    break;
                case 'url':
                    if (!this.isValidURL(value)) {
                        showValidation('Please enter a valid URL', 'error');
                        return false;
                    }
                    break;
                case 'tel':
                    if (!this.isValidPhone(value)) {
                        showValidation('Please enter a valid phone number', 'error');
                        return false;
                    }
                    break;
            }
        }
        
        // Custom validation for Steam profile inputs
        if (input.id === 'playerSearchInput') {
            if (value && !this.isValidSteamProfile(value)) {
                showValidation('Please enter a valid Steam profile URL or player name', 'error');
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Show validation message with mobile-optimized positioning
     */
    showValidationMessage(input, message, type = 'error') {
        // Remove existing validation message
        this.hideValidationMessage(input);
        
        // Create validation message element
        const validationEl = document.createElement('div');
        validationEl.className = `validation-message validation-${type}`;
        validationEl.textContent = message;
        validationEl.setAttribute('data-validation-for', input.id || 'input');
        
        // Style the validation message
        Object.assign(validationEl.style, {
            position: 'absolute',
            zIndex: '1000',
            backgroundColor: type === 'error' ? '#ff0041' : '#00ff41',
            color: type === 'error' ? '#ffffff' : '#000000',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '300px',
            wordWrap: 'break-word',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            opacity: '0',
            transform: 'translateY(-10px)',
            transition: 'opacity 200ms ease, transform 200ms ease'
        });
        
        // Position the validation message
        document.body.appendChild(validationEl);
        this.positionValidationMessage(input, validationEl);
        
        // Animate in
        requestAnimationFrame(() => {
            validationEl.style.opacity = '1';
            validationEl.style.transform = 'translateY(0)';
        });
        
        // Store reference for cleanup
        input._validationMessage = validationEl;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideValidationMessage(input);
        }, 5000);
    }
    
    /**
     * Position validation message relative to input
     */
    positionValidationMessage(input, validationEl) {
        const inputRect = input.getBoundingClientRect();
        const validationRect = validationEl.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        let top = inputRect.bottom + 8;
        let left = inputRect.left;
        
        // Adjust horizontal position to stay within viewport
        if (left + validationRect.width > viewport.width - 16) {
            left = viewport.width - validationRect.width - 16;
        }
        if (left < 16) {
            left = 16;
        }
        
        // Adjust vertical position if not enough space below
        if (top + validationRect.height > viewport.height - 16) {
            top = inputRect.top - validationRect.height - 8;
            if (top < 16) {
                top = 16;
            }
        }
        
        validationEl.style.top = `${top}px`;
        validationEl.style.left = `${left}px`;
    }
    
    /**
     * Hide validation message
     */
    hideValidationMessage(input) {
        if (input._validationMessage) {
            const validationEl = input._validationMessage;
            validationEl.style.opacity = '0';
            validationEl.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                if (validationEl.parentNode) {
                    validationEl.parentNode.removeChild(validationEl);
                }
            }, 200);
            
            delete input._validationMessage;
        }
    }
    
    /**
     * Setup form validation
     */
    setupFormValidation(form) {
        form.addEventListener('submit', (e) => {
            const isValid = this.validateForm(form);
            if (!isValid) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }
    
    /**
     * Validate entire form
     */
    validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        let isValid = true;
        
        inputs.forEach(input => {
            const inputValid = this.validateInput(input, 
                (message, type) => this.showValidationMessage(input, message, type),
                () => this.hideValidationMessage(input)
            );
            if (!inputValid) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    /**
     * Implement virtual keyboard detection and layout adjustment
     */
    setupVirtualKeyboardDetection() {
        this.originalViewportHeight = window.innerHeight;
        
        // Use Visual Viewport API if available (better for mobile)
        if (window.visualViewport) {
            this.setupVisualViewportAPI();
        } else {
            // Fallback to window resize detection
            this.setupResizeDetection();
        }
        
        // Setup focus/blur handlers for inputs
        this.setupInputFocusHandlers();
    }
    
    /**
     * Setup Visual Viewport API for keyboard detection
     */
    setupVisualViewportAPI() {
        const handleViewportChange = () => {
            const currentHeight = window.visualViewport.height;
            const heightDifference = this.originalViewportHeight - currentHeight;
            
            this.handleVirtualKeyboardChange(heightDifference > this.config.keyboardDetectionThreshold, heightDifference);
        };
        
        window.visualViewport.addEventListener('resize', handleViewportChange);
    }
    
    /**
     * Setup resize detection fallback
     */
    setupResizeDetection() {
        let resizeTimeout;
        
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const currentHeight = window.innerHeight;
                const heightDifference = this.originalViewportHeight - currentHeight;
                
                this.handleVirtualKeyboardChange(heightDifference > this.config.keyboardDetectionThreshold, heightDifference);
            }, 100);
        };
        
        window.addEventListener('resize', handleResize);
    }
    
    /**
     * Setup input focus handlers
     */
    setupInputFocusHandlers() {
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                this.focusedElement = e.target;
                this.handleInputFocus(e.target);
            });
            
            input.addEventListener('blur', (e) => {
                this.handleInputBlur(e.target);
                if (this.focusedElement === e.target) {
                    this.focusedElement = null;
                }
            });
        });
    }
    
    /**
     * Handle virtual keyboard visibility change
     */
    handleVirtualKeyboardChange(isOpen, heightDifference) {
        this.isVirtualKeyboardOpen = isOpen;
        this.virtualKeyboardHeight = isOpen ? heightDifference : 0;
        
        // Update body class
        document.body.classList.toggle('virtual-keyboard-open', isOpen);
        
        // Update CSS custom property
        document.documentElement.style.setProperty('--virtual-keyboard-height', `${this.virtualKeyboardHeight}px`);
        
        // Adjust layout for focused element
        if (isOpen && this.focusedElement) {
            this.adjustLayoutForKeyboard(this.focusedElement);
        } else if (!isOpen) {
            this.restoreLayoutAfterKeyboard();
        }
        
        // Reposition floating elements
        setTimeout(() => {
            this.repositionFloatingElements();
        }, 100);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('virtualKeyboardToggle', {
            detail: { isOpen, heightDifference, focusedElement: this.focusedElement }
        }));
    }
    
    /**
     * Handle input focus
     */
    handleInputFocus(input) {
        // Prevent iOS zoom
        this.preventIOSZoom(input);
        
        // Add focused class for styling
        input.classList.add('input-focused');
        
        // Scroll input into view with delay to allow keyboard to appear
        setTimeout(() => {
            this.scrollInputIntoView(input);
        }, 300);
    }
    
    /**
     * Handle input blur
     */
    handleInputBlur(input) {
        // Remove focused class
        input.classList.remove('input-focused');
        
        // Hide validation message
        this.hideValidationMessage(input);
    }
    
    /**
     * Adjust layout when virtual keyboard is open
     */
    adjustLayoutForKeyboard(focusedElement) {
        if (!focusedElement) return;
        
        // Scroll focused element into view
        this.scrollInputIntoView(focusedElement);
        
        // Adjust fixed positioned elements
        const fixedElements = document.querySelectorAll('.header, .menu-back, [style*="position: fixed"]');
        fixedElements.forEach(element => {
            if (element.style.position === 'fixed') {
                element.style.transform = `translateY(-${Math.min(this.virtualKeyboardHeight / 2, 100)}px)`;
            }
        });
    }
    
    /**
     * Restore layout after virtual keyboard closes
     */
    restoreLayoutAfterKeyboard() {
        // Remove transforms from fixed elements
        const fixedElements = document.querySelectorAll('.header, .menu-back, [style*="position: fixed"]');
        fixedElements.forEach(element => {
            element.style.transform = '';
        });
    }
    
    /**
     * Scroll input into view considering virtual keyboard
     */
    scrollInputIntoView(input) {
        if (!input) return;
        
        const inputRect = input.getBoundingClientRect();
        const viewportHeight = window.innerHeight - this.virtualKeyboardHeight;
        const targetY = viewportHeight / 2; // Center of visible area
        
        const scrollOffset = inputRect.top - targetY;
        
        if (Math.abs(scrollOffset) > 50) { // Only scroll if significant offset
            window.scrollBy({
                top: scrollOffset,
                behavior: 'smooth'
            });
        }
    }
    
    /**
     * Reposition floating elements when keyboard state changes
     */
    repositionFloatingElements() {
        // Reposition validation messages
        const validationMessages = document.querySelectorAll('.validation-message');
        validationMessages.forEach(message => {
            const inputId = message.getAttribute('data-validation-for');
            const input = document.getElementById(inputId) || document.querySelector('input');
            if (input) {
                this.positionValidationMessage(input, message);
            }
        });
        
        // Reposition dropdowns
        const openDropdowns = document.querySelectorAll('[style*="display: block"]');
        openDropdowns.forEach(dropdown => {
            if (dropdown.classList.contains('dropdown-menu') || dropdown.id === 'profileDropdownMenu') {
                const trigger = dropdown.previousElementSibling || 
                              document.querySelector(`[aria-controls="${dropdown.id}"]`) ||
                              document.querySelector('#profileDropdownButton');
                if (trigger) {
                    this.positionDropdownMobile(trigger, dropdown);
                }
            }
        });
    }
    
    /**
     * Optimize form inputs for mobile interaction
     */
    optimizeFormInputs() {
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Ensure minimum touch target size
            input.style.minHeight = `${this.config.touchTargetSize}px`;
            
            // Add mobile-optimized classes
            input.classList.add('mobile-optimized-input');
            
            // Optimize touch behavior
            input.style.touchAction = 'manipulation';
            input.style.webkitTapHighlightColor = 'transparent';
            
            // Prevent callout on long press
            input.style.webkitTouchCallout = 'none';
            
            // Optimize for different input types
            this.optimizeInputByType(input);
        });
    }
    
    /**
     * Optimize input based on its type
     */
    optimizeInputByType(input) {
        const type = input.type;
        
        switch (type) {
            case 'search':
                input.setAttribute('autocomplete', 'off');
                input.setAttribute('autocorrect', 'off');
                input.setAttribute('autocapitalize', 'off');
                input.setAttribute('spellcheck', 'false');
                break;
            case 'email':
                input.setAttribute('autocomplete', 'email');
                input.setAttribute('autocorrect', 'off');
                input.setAttribute('autocapitalize', 'off');
                break;
            case 'tel':
                input.setAttribute('autocomplete', 'tel');
                break;
            case 'url':
                input.setAttribute('autocomplete', 'url');
                input.setAttribute('autocorrect', 'off');
                input.setAttribute('autocapitalize', 'off');
                break;
        }
    }
    
    /**
     * Setup form event handlers
     */
    setupFormEventHandlers() {
        // Handle select change events
        document.addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT') {
                this.handleSelectChange(e.target);
            }
        });
        
        // Handle form submission
        document.addEventListener('submit', (e) => {
            if (e.target.tagName === 'FORM') {
                this.handleFormSubmit(e);
            }
        });
    }
    
    /**
     * Handle select change with mobile optimizations
     */
    handleSelectChange(select) {
        // Add visual feedback
        select.classList.add('select-changed');
        setTimeout(() => {
            select.classList.remove('select-changed');
        }, 200);
        
        // Trigger custom event
        select.dispatchEvent(new CustomEvent('mobileSelectChange', {
            detail: { value: select.value, select }
        }));
    }
    
    /**
     * Handle form submit with mobile optimizations
     */
    handleFormSubmit(e) {
        const form = e.target;
        
        // Validate form
        const isValid = this.validateForm(form);
        
        if (!isValid) {
            e.preventDefault();
            
            // Focus first invalid input
            const firstInvalidInput = form.querySelector('input:invalid, textarea:invalid, select:invalid') ||
                                    form.querySelector('.validation-error');
            if (firstInvalidInput) {
                firstInvalidInput.focus();
                this.scrollInputIntoView(firstInvalidInput);
            }
        }
    }
    
    /**
     * Observe new inputs added to the DOM
     */
    observeNewInputs() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the node itself is an input
                        if (node.matches && node.matches('input, textarea, select')) {
                            this.optimizeNewInput(node);
                        }
                        
                        // Check for inputs within the added node
                        const inputs = node.querySelectorAll && node.querySelectorAll('input, textarea, select');
                        if (inputs) {
                            inputs.forEach(input => this.optimizeNewInput(input));
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Optimize newly added input
     */
    optimizeNewInput(input) {
        this.preventIOSZoom(input);
        this.setupInputValidation(input);
        
        // Ensure minimum touch target size
        input.style.minHeight = `${this.config.touchTargetSize}px`;
        
        // Add mobile-optimized classes
        input.classList.add('mobile-optimized-input');
        
        // Setup focus handlers
        input.addEventListener('focus', (e) => {
            this.focusedElement = e.target;
            this.handleInputFocus(e.target);
        });
        
        input.addEventListener('blur', (e) => {
            this.handleInputBlur(e.target);
            if (this.focusedElement === e.target) {
                this.focusedElement = null;
            }
        });
    }
    
    // Validation helper methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }
    
    isValidSteamProfile(input) {
        const steamUrlRegex = /^https?:\/\/(www\.)?steamcommunity\.com\/(profiles|id)\/[a-zA-Z0-9_-]+\/?$/;
        const steamIdRegex = /^[0-9]{17}$/;
        
        return steamUrlRegex.test(input) || steamIdRegex.test(input) || input.length >= 3;
    }
    
    /**
     * Get current virtual keyboard state
     */
    getVirtualKeyboardState() {
        return {
            isOpen: this.isVirtualKeyboardOpen,
            height: this.virtualKeyboardHeight,
            focusedElement: this.focusedElement
        };
    }
    
    /**
     * Check if optimizer is initialized
     */
    isReady() {
        return this.isInitialized;
    }
    
    /**
     * Cleanup and destroy optimizer
     */
    destroy() {
        // Remove validation messages
        const validationMessages = document.querySelectorAll('.validation-message');
        validationMessages.forEach(message => message.remove());
        
        // Remove event listeners (would need to store references for proper cleanup)
        // For now, just mark as not initialized
        this.isInitialized = false;
        
        console.log('MobileFormOptimizer destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileFormOptimizer;
} else if (typeof window !== 'undefined') {
    window.MobileFormOptimizer = MobileFormOptimizer;
}
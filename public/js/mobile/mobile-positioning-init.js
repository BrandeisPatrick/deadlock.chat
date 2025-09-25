/**
 * Mobile UI Element Positioning System Initialization
 * Sets up automatic positioning for dropdowns, modals, and tooltips
 */

class MobilePositioningInit {
    constructor() {
        this.viewportManager = null;
        this.layoutController = null;
        this.initialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Wait for dependencies
            await this.waitForDependencies();
            
            // Initialize managers
            this.viewportManager = new ViewportManager();
            this.layoutController = new MobileLayoutController(this.viewportManager);
            
            // Setup automatic positioning
            this.setupAutomaticPositioning();
            
            // Setup global event handlers
            this.setupGlobalHandlers();
            
            this.initialized = true;
            console.log('Mobile positioning system initialized');
            
            // Dispatch initialization event
            document.dispatchEvent(new CustomEvent('mobilePositioningReady', {
                detail: {
                    viewportManager: this.viewportManager,
                    layoutController: this.layoutController
                }
            }));
            
        } catch (error) {
            console.error('Failed to initialize mobile positioning system:', error);
        }
    }
    
    async waitForDependencies() {
        const checkDependencies = () => {
            return typeof ViewportManager !== 'undefined' && 
                   typeof MobileLayoutController !== 'undefined';
        };
        
        if (checkDependencies()) return;
        
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds timeout
            
            const interval = setInterval(() => {
                attempts++;
                
                if (checkDependencies()) {
                    clearInterval(interval);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error('Dependencies not loaded within timeout'));
                }
            }, 100);
        });
    }
    
    setupAutomaticPositioning() {
        // Setup automatic dropdown positioning
        this.setupDropdownPositioning();
        
        // Setup automatic modal positioning
        this.setupModalPositioning();
        
        // Setup automatic tooltip positioning
        this.setupTooltipPositioning();
        
        // Setup form element positioning
        this.setupFormElementPositioning();
    }
    
    setupDropdownPositioning() {
        // Handle Bootstrap-style dropdowns
        document.addEventListener('click', (e) => {
            const dropdownToggle = e.target.closest('[data-bs-toggle="dropdown"], .dropdown-toggle');
            if (!dropdownToggle) return;
            
            e.preventDefault();
            
            // Find or create dropdown menu
            let dropdown = dropdownToggle.nextElementSibling;
            if (!dropdown || !dropdown.classList.contains('dropdown-menu')) {
                dropdown = dropdownToggle.parentElement.querySelector('.dropdown-menu');
            }
            
            if (dropdown) {
                // Close other dropdowns
                this.closeAllDropdowns();
                
                // Position and show dropdown
                this.layoutController.adjustDropdownPosition(dropdown, dropdownToggle);
                dropdown.classList.add('show');
                
                // Add click outside handler
                setTimeout(() => {
                    this.addClickOutsideHandler(dropdown, dropdownToggle);
                }, 0);
            }
        });
        
        // Handle custom dropdown triggers
        document.addEventListener('click', (e) => {
            const customTrigger = e.target.closest('[data-dropdown-target]');
            if (!customTrigger) return;
            
            e.preventDefault();
            
            const targetSelector = customTrigger.dataset.dropdownTarget;
            const dropdown = document.querySelector(targetSelector);
            
            if (dropdown) {
                // Toggle dropdown
                if (dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                    this.layoutController.untrackElement(dropdown);
                } else {
                    this.closeAllDropdowns();
                    this.layoutController.adjustDropdownPosition(dropdown, customTrigger);
                    dropdown.classList.add('show');
                    
                    setTimeout(() => {
                        this.addClickOutsideHandler(dropdown, customTrigger);
                    }, 0);
                }
            }
        });
    }
    
    setupModalPositioning() {
        // Handle Bootstrap-style modals
        document.addEventListener('click', (e) => {
            const modalTrigger = e.target.closest('[data-bs-toggle="modal"]');
            if (!modalTrigger) return;
            
            const targetSelector = modalTrigger.dataset.bsTarget || modalTrigger.dataset.target;
            if (!targetSelector) return;
            
            const modal = document.querySelector(targetSelector);
            if (!modal) return;
            
            e.preventDefault();
            this.showModal(modal);
        });
        
        // Handle custom modal triggers
        document.addEventListener('click', (e) => {
            const customTrigger = e.target.closest('[data-modal-target]');
            if (!customTrigger) return;
            
            const targetSelector = customTrigger.dataset.modalTarget;
            const modal = document.querySelector(targetSelector);
            
            if (modal) {
                e.preventDefault();
                this.showModal(modal);
            }
        });
        
        // Handle modal close buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-bs-dismiss="modal"], .modal-close, .modal-backdrop')) {
                const modal = e.target.closest('.modal') || 
                             document.querySelector('.modal.show');
                if (modal) {
                    this.hideModal(modal);
                }
            }
        });
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal.show');
                if (modal) {
                    this.hideModal(modal);
                }
            }
        });
    }
    
    setupTooltipPositioning() {
        // Handle elements with title attribute
        document.addEventListener('mouseenter', (e) => {
            if (e.target.title && !e.target.dataset.tooltipDisabled) {
                this.showTooltip(e.target, e.target.title);
            }
        });
        
        document.addEventListener('mouseleave', (e) => {
            if (e.target.title) {
                this.hideTooltip(e.target);
            }
        });
        
        // Handle custom tooltip triggers
        document.addEventListener('mouseenter', (e) => {
            const tooltipTrigger = e.target.closest('[data-tooltip]');
            if (tooltipTrigger && !tooltipTrigger.title) {
                this.showTooltip(tooltipTrigger, tooltipTrigger.dataset.tooltip);
            }
        });
        
        document.addEventListener('mouseleave', (e) => {
            const tooltipTrigger = e.target.closest('[data-tooltip]');
            if (tooltipTrigger) {
                this.hideTooltip(tooltipTrigger);
            }
        });
        
        // Handle focus for accessibility
        document.addEventListener('focusin', (e) => {
            if (e.target.dataset.tooltip) {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            }
        });
        
        document.addEventListener('focusout', (e) => {
            if (e.target.dataset.tooltip) {
                this.hideTooltip(e.target);
            }
        });
    }
    
    setupFormElementPositioning() {
        // Handle select dropdowns
        document.addEventListener('focus', (e) => {
            if (e.target.tagName === 'SELECT' && this.viewportManager.isMobile()) {
                // Ensure select is visible when opened
                setTimeout(() => {
                    e.target.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 100);
            }
        });
        
        // Handle date/time pickers
        document.addEventListener('focus', (e) => {
            if ((e.target.type === 'date' || e.target.type === 'time' || e.target.type === 'datetime-local') 
                && this.viewportManager.isMobile()) {
                // Ensure picker is visible
                setTimeout(() => {
                    e.target.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 100);
            }
        });
    }
    
    setupGlobalHandlers() {
        // Close dropdowns on scroll
        document.addEventListener('scroll', () => {
            this.closeAllDropdowns();
        }, { passive: true });
        
        // Reposition elements on resize
        window.addEventListener('resize', () => {
            if (this.layoutController) {
                this.layoutController.updateLayout();
            }
        });
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (this.layoutController) {
                    this.layoutController.updateLayout();
                }
            }, 100);
        });
    }
    
    showModal(modal) {
        // Create backdrop if it doesn't exist
        let backdrop = document.querySelector('.modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            document.body.appendChild(backdrop);
        }
        
        // Position modal
        this.layoutController.repositionModal(modal);
        
        // Show modal
        backdrop.classList.add('show');
        modal.classList.add('show');
        
        // Prevent body scroll
        document.body.classList.add('modal-open');
        
        // Focus management
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }
    
    hideModal(modal) {
        modal.classList.remove('show');
        
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.classList.remove('show');
            setTimeout(() => backdrop.remove(), 150);
        }
        
        // Restore body scroll
        document.body.classList.remove('modal-open');
        
        // Untrack modal
        this.layoutController.untrackElement(modal);
    }
    
    showTooltip(target, text) {
        // Remove existing tooltip
        this.hideTooltip(target);
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'positioned-tooltip';
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        this.layoutController.positionTooltip(tooltip, target);
        
        // Show tooltip
        tooltip.classList.add('show');
        
        // Store reference
        target._tooltip = tooltip;
    }
    
    hideTooltip(target) {
        if (target._tooltip) {
            target._tooltip.remove();
            target._tooltip = null;
        }
    }
    
    closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu.show, .positioned-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
            this.layoutController.untrackElement(dropdown);
        });
    }
    
    addClickOutsideHandler(dropdown, trigger) {
        const handleClickOutside = (e) => {
            if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
                dropdown.classList.remove('show');
                this.layoutController.untrackElement(dropdown);
                document.removeEventListener('click', handleClickOutside);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
    }
    
    // Public API methods
    getLayoutController() {
        return this.layoutController;
    }
    
    getViewportManager() {
        return this.viewportManager;
    }
    
    isInitialized() {
        return this.initialized;
    }
}

// Initialize when DOM is ready
let mobilePositioningInstance = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        mobilePositioningInstance = new MobilePositioningInit();
    });
} else {
    mobilePositioningInstance = new MobilePositioningInit();
}

// Export for global access
if (typeof window !== 'undefined') {
    window.MobilePositioningInit = MobilePositioningInit;
    window.getMobilePositioning = () => mobilePositioningInstance;
}
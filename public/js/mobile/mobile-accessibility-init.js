/**
 * Mobile Accessibility Initialization
 * Initializes and configures the Mobile Accessibility Controller
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

(function() {
    'use strict';
    
    let mobileAccessibilityController = null;
    
    /**
     * Initialize Mobile Accessibility Controller
     */
    function initializeMobileAccessibility() {
        try {
            // Wait for ViewportManager if it exists
            const viewportManager = window.mobileViewportManager || null;
            
            // Create and initialize the controller
            mobileAccessibilityController = new MobileAccessibilityController(viewportManager);
            
            // Make it globally available
            window.mobileAccessibilityController = mobileAccessibilityController;
            
            console.log('✅ Mobile Accessibility Controller initialized successfully');
            
            // Setup integration with other mobile components
            setupComponentIntegration();
            
            // Setup custom event handlers
            setupCustomEventHandlers();
            
            // Setup accessibility monitoring
            setupAccessibilityMonitoring();
            
        } catch (error) {
            console.error('❌ Failed to initialize Mobile Accessibility Controller:', error);
        }
    }
    
    /**
     * Setup integration with other mobile components
     */
    function setupComponentIntegration() {
        // Integration with MobileFormOptimizer
        document.addEventListener('mobileFormOptimizerReady', (e) => {
            const formOptimizer = e.detail.optimizer;
            
            // Enhance form validation with accessibility announcements
            enhanceFormValidationAccessibility(formOptimizer);
        });
        
        // Integration with MobileLayoutController
        document.addEventListener('mobileLayoutReady', (e) => {
            const layoutController = e.detail.controller;
            
            // Enhance layout changes with accessibility announcements
            enhanceLayoutAccessibility(layoutController);
        });
        
        // Integration with MobileNavigationController
        document.addEventListener('mobileNavigationReady', (e) => {
            const navigationController = e.detail.controller;
            
            // Enhance navigation with accessibility features
            enhanceNavigationAccessibility(navigationController);
        });
    }
    
    /**
     * Enhance form validation with accessibility announcements
     */
    function enhanceFormValidationAccessibility(formOptimizer) {
        // Listen for validation events and announce them
        document.addEventListener('input', (e) => {
            const input = e.target;
            if (input.matches('input, textarea, select')) {
                // Debounce validation announcements
                clearTimeout(input._validationTimeout);
                input._validationTimeout = setTimeout(() => {
                    checkAndAnnounceValidation(input);
                }, 500);
            }
        });
        
        document.addEventListener('blur', (e) => {
            const input = e.target;
            if (input.matches('input, textarea, select')) {
                checkAndAnnounceValidation(input);
            }
        });
    }
    
    function checkAndAnnounceValidation(input) {
        if (!mobileAccessibilityController) return;
        
        const isValid = input.checkValidity();
        const fieldName = getFieldName(input);
        
        if (!isValid) {
            const validationMessage = input.validationMessage || 'Invalid input';
            mobileAccessibilityController.announceMessage(
                `Error in ${fieldName}: ${validationMessage}`,
                'assertive'
            );
            input.setAttribute('aria-invalid', 'true');
        } else {
            input.setAttribute('aria-invalid', 'false');
        }
    }
    
    function getFieldName(input) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) return label.textContent.replace('*', '').trim();
        
        if (input.getAttribute('aria-label')) {
            return input.getAttribute('aria-label');
        }
        
        if (input.placeholder) {
            return input.placeholder;
        }
        
        return input.name || input.type || 'field';
    }
    
    /**
     * Enhance layout changes with accessibility announcements
     */
    function enhanceLayoutAccessibility(layoutController) {
        // Announce layout changes
        document.addEventListener('layoutChange', (e) => {
            if (mobileAccessibilityController) {
                const { type, details } = e.detail;
                let message = '';
                
                switch (type) {
                    case 'gridUpdate':
                        message = `Grid layout updated to ${details.columns} columns`;
                        break;
                    case 'viewportChange':
                        message = `Layout adapted for ${details.deviceType} device`;
                        break;
                    case 'orientationChange':
                        message = `Screen orientation changed to ${details.orientation}`;
                        break;
                    default:
                        message = 'Layout updated';
                }
                
                mobileAccessibilityController.announceMessage(message);
            }
        });
    }
    
    /**
     * Enhance navigation with accessibility features
     */
    function enhanceNavigationAccessibility(navigationController) {
        // Announce navigation changes
        document.addEventListener('navigationChange', (e) => {
            if (mobileAccessibilityController) {
                const { type, details } = e.detail;
                let message = '';
                
                switch (type) {
                    case 'tabChange':
                        message = `Switched to ${details.tabName} tab`;
                        break;
                    case 'sectionChange':
                        message = `Navigated to ${details.sectionName} section`;
                        break;
                    case 'menuToggle':
                        message = details.isOpen ? 'Menu opened' : 'Menu closed';
                        break;
                    default:
                        message = 'Navigation updated';
                }
                
                mobileAccessibilityController.announceMessage(message);
            }
        });
    }
    
    /**
     * Setup custom event handlers for accessibility
     */
    function setupCustomEventHandlers() {
        // Handle data loading states
        setupDataLoadingAccessibility();
        
        // Handle dynamic content changes
        setupDynamicContentAccessibility();
        
        // Handle error states
        setupErrorAccessibility();
        
        // Handle success states
        setupSuccessAccessibility();
    }
    
    function setupDataLoadingAccessibility() {
        // Listen for data loading events
        document.addEventListener('dataLoadStart', (e) => {
            if (mobileAccessibilityController) {
                const { type } = e.detail;
                mobileAccessibilityController.announceMessage(`Loading ${type} data`);
            }
        });
        
        document.addEventListener('dataLoadComplete', (e) => {
            if (mobileAccessibilityController) {
                const { type, count, success } = e.detail;
                
                if (success) {
                    let message = `${type} data loaded successfully`;
                    if (count !== undefined) {
                        message += `. ${count} items found`;
                    }
                    mobileAccessibilityController.announceMessage(message);
                } else {
                    mobileAccessibilityController.announceMessage(
                        `Failed to load ${type} data`,
                        'assertive'
                    );
                }
            }
        });
    }
    
    function setupDynamicContentAccessibility() {
        // Monitor DOM changes for accessibility updates
        const observer = new MutationObserver((mutations) => {
            let hasSignificantChanges = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check for significant content additions
                            if (node.matches('.card, .hero-card, .section, [role="region"]')) {
                                hasSignificantChanges = true;
                            }
                        }
                    });
                }
            });
            
            if (hasSignificantChanges && mobileAccessibilityController) {
                // Re-apply accessibility enhancements to new content
                setTimeout(() => {
                    mobileAccessibilityController.updateAccessibilityForNewContent();
                }, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    function setupErrorAccessibility() {
        // Handle error states
        document.addEventListener('error', (e) => {
            if (mobileAccessibilityController && e.detail) {
                const { message, type } = e.detail;
                mobileAccessibilityController.announceMessage(
                    `Error: ${message}`,
                    'assertive'
                );
            }
        });
        
        // Handle form submission errors
        document.addEventListener('formError', (e) => {
            if (mobileAccessibilityController) {
                const { message, fieldErrors } = e.detail;
                
                mobileAccessibilityController.announceMessage(
                    `Form submission failed: ${message}`,
                    'assertive'
                );
                
                if (fieldErrors && fieldErrors.length > 0) {
                    setTimeout(() => {
                        mobileAccessibilityController.announceMessage(
                            `Please check ${fieldErrors.length} field${fieldErrors.length > 1 ? 's' : ''} for errors`,
                            'assertive'
                        );
                    }, 1000);
                }
            }
        });
    }
    
    function setupSuccessAccessibility() {
        // Handle success states
        document.addEventListener('success', (e) => {
            if (mobileAccessibilityController && e.detail) {
                const { message, type } = e.detail;
                mobileAccessibilityController.announceMessage(`Success: ${message}`);
            }
        });
        
        // Handle form submission success
        document.addEventListener('formSuccess', (e) => {
            if (mobileAccessibilityController) {
                const { message } = e.detail;
                mobileAccessibilityController.announceMessage(
                    `Form submitted successfully: ${message}`
                );
            }
        });
    }
    
    /**
     * Setup accessibility monitoring and reporting
     */
    function setupAccessibilityMonitoring() {
        // Monitor accessibility violations (basic checks)
        setInterval(() => {
            if (mobileAccessibilityController) {
                performBasicAccessibilityChecks();
            }
        }, 30000); // Check every 30 seconds
        
        // Setup performance monitoring for accessibility features
        setupAccessibilityPerformanceMonitoring();
    }
    
    function performBasicAccessibilityChecks() {
        const issues = [];
        
        // Check for missing alt text on images
        const images = document.querySelectorAll('img:not([alt])');
        if (images.length > 0) {
            issues.push(`${images.length} images missing alt text`);
        }
        
        // Check for buttons without accessible names
        const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        const emptyButtons = Array.from(buttons).filter(btn => !btn.textContent.trim());
        if (emptyButtons.length > 0) {
            issues.push(`${emptyButtons.length} buttons without accessible names`);
        }
        
        // Check for form inputs without labels
        const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
        const unlabeledInputs = Array.from(inputs).filter(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            return !label && input.type !== 'hidden' && input.type !== 'submit';
        });
        if (unlabeledInputs.length > 0) {
            issues.push(`${unlabeledInputs.length} form inputs without labels`);
        }
        
        // Log issues for debugging (in development)
        if (issues.length > 0 && window.location.hostname === 'localhost') {
            console.warn('Accessibility issues detected:', issues);
        }
    }
    
    function setupAccessibilityPerformanceMonitoring() {
        // Monitor focus management performance
        let focusChangeCount = 0;
        let lastFocusTime = Date.now();
        
        document.addEventListener('focusin', () => {
            focusChangeCount++;
            const now = Date.now();
            
            // Reset counter every minute
            if (now - lastFocusTime > 60000) {
                focusChangeCount = 1;
                lastFocusTime = now;
            }
            
            // Warn if too many focus changes (potential accessibility issue)
            if (focusChangeCount > 50) {
                console.warn('High focus change frequency detected - potential accessibility issue');
            }
        });
        
        // Monitor screen reader announcement frequency
        if (mobileAccessibilityController) {
            const originalAnnounce = mobileAccessibilityController.announceToScreenReader;
            let announcementCount = 0;
            let lastAnnouncementTime = Date.now();
            
            mobileAccessibilityController.announceToScreenReader = function(message, priority) {
                announcementCount++;
                const now = Date.now();
                
                // Reset counter every minute
                if (now - lastAnnouncementTime > 60000) {
                    announcementCount = 1;
                    lastAnnouncementTime = now;
                }
                
                // Warn if too many announcements
                if (announcementCount > 20) {
                    console.warn('High screen reader announcement frequency - may overwhelm users');
                }
                
                return originalAnnounce.call(this, message, priority);
            };
        }
    }
    
    /**
     * Utility functions for accessibility integration
     */
    function announceMessage(message, priority = 'polite') {
        if (mobileAccessibilityController) {
            mobileAccessibilityController.announceMessage(message, priority);
        }
    }
    
    function enableHighContrast() {
        if (mobileAccessibilityController) {
            mobileAccessibilityController.enableHighContrast();
        }
    }
    
    function disableHighContrast() {
        if (mobileAccessibilityController) {
            mobileAccessibilityController.disableHighContrast();
        }
    }
    
    function focusElement(element) {
        if (mobileAccessibilityController) {
            mobileAccessibilityController.focusElement(element);
        }
    }
    
    // Make utility functions globally available
    window.mobileAccessibility = {
        announceMessage,
        enableHighContrast,
        disableHighContrast,
        focusElement,
        getController: () => mobileAccessibilityController
    };
    
    /**
     * Initialize when DOM is ready
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMobileAccessibility);
    } else {
        // DOM is already ready
        setTimeout(initializeMobileAccessibility, 100);
    }
    
    /**
     * Handle page visibility changes
     */
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && mobileAccessibilityController) {
            // Re-check accessibility when page becomes visible
            setTimeout(() => {
                mobileAccessibilityController.updateAccessibilityForNewContent();
            }, 500);
        }
    });
    
    /**
     * Handle orientation changes
     */
    window.addEventListener('orientationchange', () => {
        if (mobileAccessibilityController) {
            setTimeout(() => {
                mobileAccessibilityController.updateAccessibilityForViewport();
                mobileAccessibilityController.announceMessage(
                    `Screen orientation changed to ${screen.orientation ? screen.orientation.type : 'unknown'}`
                );
            }, 500);
        }
    });
    
    /**
     * Export for testing and debugging
     */
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            initializeMobileAccessibility,
            setupComponentIntegration,
            setupCustomEventHandlers,
            setupAccessibilityMonitoring
        };
    }
    
})();
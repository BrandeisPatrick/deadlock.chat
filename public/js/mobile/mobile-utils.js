/**
 * Mobile Utility Functions
 * Collection of utility functions for mobile optimization
 */

/**
 * Debounce function to limit the rate of function execution
 */
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(this, args);
    };
}

/**
 * Throttle function to limit function execution to once per specified interval
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Check if device supports touch
 */
function isTouchDevice() {
    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
    );
}

/**
 * Check if device is likely mobile based on user agent and screen size
 */
function isMobileDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    const hasMobileKeyword = mobileKeywords.some(keyword => userAgent.includes(keyword));
    const hasSmallScreen = window.innerWidth <= 768;
    
    return hasMobileKeyword || (hasSmallScreen && isTouchDevice());
}

/**
 * Get device pixel ratio for high-DPI displays
 */
function getDevicePixelRatio() {
    return window.devicePixelRatio || 1;
}

/**
 * Convert CSS pixels to device pixels
 */
function cssToDevicePixels(cssPixels) {
    return cssPixels * getDevicePixelRatio();
}

/**
 * Convert device pixels to CSS pixels
 */
function deviceToCssPixels(devicePixels) {
    return devicePixels / getDevicePixelRatio();
}

/**
 * Check if element is visible in viewport
 */
function isElementInViewport(element, threshold = 0) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
        rect.top >= -threshold &&
        rect.left >= -threshold &&
        rect.bottom <= windowHeight + threshold &&
        rect.right <= windowWidth + threshold
    );
}

/**
 * Scroll element into view with mobile-friendly options
 */
function scrollIntoViewMobile(element, options = {}) {
    if (!element) return;
    
    const defaultOptions = {
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
    };
    
    const scrollOptions = { ...defaultOptions, ...options };
    
    // Use native scrollIntoView if available
    if (element.scrollIntoView) {
        element.scrollIntoView(scrollOptions);
    } else {
        // Fallback for older browsers
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetTop = rect.top + scrollTop - 100; // 100px offset from top
        
        window.scrollTo({
            top: targetTop,
            behavior: scrollOptions.behavior || 'smooth'
        });
    }
}

/**
 * Prevent iOS zoom on input focus
 */
function preventIOSZoom(inputElement) {
    if (!inputElement) return;
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return;
    
    // Set font-size to 16px or larger to prevent zoom
    const currentFontSize = window.getComputedStyle(inputElement).fontSize;
    const fontSize = parseFloat(currentFontSize);
    
    if (fontSize < 16) {
        inputElement.style.fontSize = '16px';
    }
}

/**
 * Add touch-friendly styling to buttons
 */
function makeTouchFriendly(element, options = {}) {
    if (!element) return;
    
    const defaults = {
        minTouchTarget: 44, // Minimum touch target size in pixels
        addTapHighlight: true,
        preventCallout: true
    };
    
    const config = { ...defaults, ...options };
    
    // Ensure minimum touch target size
    const rect = element.getBoundingClientRect();
    if (rect.width < config.minTouchTarget || rect.height < config.minTouchTarget) {
        element.style.minWidth = `${config.minTouchTarget}px`;
        element.style.minHeight = `${config.minTouchTarget}px`;
        element.style.display = element.style.display || 'inline-flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
    }
    
    // Remove tap highlight if requested
    if (!config.addTapHighlight) {
        element.style.webkitTapHighlightColor = 'transparent';
    }
    
    // Prevent callout menu on long press
    if (config.preventCallout) {
        element.style.webkitTouchCallout = 'none';
        element.style.webkitUserSelect = 'none';
        element.style.userSelect = 'none';
    }
    
    // Add touch action for better performance
    element.style.touchAction = 'manipulation';
}

/**
 * Detect virtual keyboard visibility (mobile)
 */
function detectVirtualKeyboard(callback) {
    if (!callback || typeof callback !== 'function') return;
    
    let initialViewportHeight = window.innerHeight;
    let currentViewportHeight = window.innerHeight;
    
    const checkKeyboard = () => {
        currentViewportHeight = window.innerHeight;
        const heightDifference = initialViewportHeight - currentViewportHeight;
        const threshold = 150; // Minimum height change to consider keyboard open
        
        const isKeyboardOpen = heightDifference > threshold;
        callback(isKeyboardOpen, heightDifference);
    };
    
    // Use visual viewport API if available (better for mobile)
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', checkKeyboard);
        return () => window.visualViewport.removeEventListener('resize', checkKeyboard);
    } else {
        // Fallback to window resize
        const debouncedCheck = debounce(checkKeyboard, 100);
        window.addEventListener('resize', debouncedCheck);
        return () => window.removeEventListener('resize', debouncedCheck);
    }
}

/**
 * Get safe area insets using CSS environment variables
 */
function getSafeAreaInsets() {
    const style = getComputedStyle(document.documentElement);
    
    return {
        top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
        right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
        bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
        left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0
    };
}

/**
 * Apply safe area padding to element
 */
function applySafeAreaPadding(element, sides = ['top', 'right', 'bottom', 'left']) {
    if (!element) return;
    
    const safeAreas = getSafeAreaInsets();
    
    sides.forEach(side => {
        if (safeAreas[side] > 0) {
            element.style[`padding${side.charAt(0).toUpperCase() + side.slice(1)}`] = 
                `max(${safeAreas[side]}px, var(--space-md, 1rem))`;
        }
    });
}

/**
 * Position element within viewport bounds
 */
function constrainToViewport(element, margin = 8) {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    
    let newLeft = rect.left;
    let newTop = rect.top;
    
    // Constrain horizontal position
    if (rect.left < margin) {
        newLeft = margin;
    } else if (rect.right > viewport.width - margin) {
        newLeft = viewport.width - rect.width - margin;
    }
    
    // Constrain vertical position
    if (rect.top < margin) {
        newTop = margin;
    } else if (rect.bottom > viewport.height - margin) {
        newTop = viewport.height - rect.height - margin;
    }
    
    // Apply new position if changed
    if (newLeft !== rect.left || newTop !== rect.top) {
        element.style.position = 'fixed';
        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
    }
}

/**
 * Create a mobile-optimized dropdown positioning function
 */
function positionDropdown(triggerElement, dropdownElement, preferredPosition = 'bottom') {
    if (!triggerElement || !dropdownElement) return;
    
    const triggerRect = triggerElement.getBoundingClientRect();
    const dropdownRect = dropdownElement.getBoundingClientRect();
    const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    const margin = 8;
    
    let position = {
        left: triggerRect.left,
        top: preferredPosition === 'bottom' ? triggerRect.bottom : triggerRect.top - dropdownRect.height
    };
    
    // Adjust horizontal position to stay within viewport
    if (position.left + dropdownRect.width > viewport.width - margin) {
        position.left = viewport.width - dropdownRect.width - margin;
    }
    if (position.left < margin) {
        position.left = margin;
    }
    
    // Adjust vertical position if dropdown would go off-screen
    if (preferredPosition === 'bottom' && position.top + dropdownRect.height > viewport.height - margin) {
        // Try positioning above
        const topPosition = triggerRect.top - dropdownRect.height;
        if (topPosition >= margin) {
            position.top = topPosition;
        } else {
            // Keep at bottom but adjust to fit
            position.top = viewport.height - dropdownRect.height - margin;
        }
    } else if (preferredPosition === 'top' && position.top < margin) {
        // Try positioning below
        const bottomPosition = triggerRect.bottom;
        if (bottomPosition + dropdownRect.height <= viewport.height - margin) {
            position.top = bottomPosition;
        } else {
            // Keep at top but adjust to fit
            position.top = margin;
        }
    }
    
    // Apply position
    dropdownElement.style.position = 'fixed';
    dropdownElement.style.left = `${position.left}px`;
    dropdownElement.style.top = `${position.top}px`;
    dropdownElement.style.zIndex = '9999';
}

/**
 * Add passive event listeners for better scroll performance
 */
function addPassiveEventListener(element, event, handler, options = {}) {
    const passiveOptions = { passive: true, ...options };
    element.addEventListener(event, handler, passiveOptions);
    
    return () => element.removeEventListener(event, handler, passiveOptions);
}

/**
 * Optimize scroll performance by using passive listeners and RAF
 */
function optimizeScrollPerformance(scrollContainer = window) {
    let ticking = false;
    
    const handleScroll = (callback) => {
        if (!ticking) {
            requestAnimationFrame(() => {
                if (callback) callback();
                ticking = false;
            });
            ticking = true;
        }
    };
    
    return {
        onScroll: (callback) => {
            const scrollHandler = () => handleScroll(callback);
            return addPassiveEventListener(scrollContainer, 'scroll', scrollHandler);
        }
    };
}

/**
 * Mobile-friendly focus management
 */
function manageFocusMobile(element) {
    if (!element) return;
    
    // Prevent zoom on iOS when focusing inputs
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        preventIOSZoom(element);
    }
    
    // Scroll element into view when focused
    element.addEventListener('focus', () => {
        setTimeout(() => {
            scrollIntoViewMobile(element, { block: 'center' });
        }, 300); // Delay to allow virtual keyboard to appear
    });
}

/**
 * Initialize mobile optimizations for a container
 */
function initializeMobileOptimizations(container = document.body) {
    // Make all buttons touch-friendly
    const buttons = container.querySelectorAll('button, .btn, [role="button"]');
    buttons.forEach(button => makeTouchFriendly(button));
    
    // Optimize form inputs
    const inputs = container.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        preventIOSZoom(input);
        manageFocusMobile(input);
    });
    
    // Add passive scroll listeners to scrollable elements
    const scrollableElements = container.querySelectorAll('[data-scrollable], .scrollable');
    scrollableElements.forEach(element => {
        optimizeScrollPerformance(element);
    });
    
    // Apply safe area padding to elements with data-safe-area attribute
    const safeAreaElements = container.querySelectorAll('[data-safe-area]');
    safeAreaElements.forEach(element => {
        const sides = element.dataset.safeArea.split(',').map(s => s.trim());
        applySafeAreaPadding(element, sides);
    });
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        throttle,
        isTouchDevice,
        isMobileDevice,
        getDevicePixelRatio,
        cssToDevicePixels,
        deviceToCssPixels,
        isElementInViewport,
        scrollIntoViewMobile,
        preventIOSZoom,
        makeTouchFriendly,
        detectVirtualKeyboard,
        getSafeAreaInsets,
        applySafeAreaPadding,
        constrainToViewport,
        positionDropdown,
        addPassiveEventListener,
        optimizeScrollPerformance,
        manageFocusMobile,
        initializeMobileOptimizations
    };
} else if (typeof window !== 'undefined') {
    // Make functions available globally
    Object.assign(window, {
        debounce,
        throttle,
        isTouchDevice,
        isMobileDevice,
        getDevicePixelRatio,
        cssToDevicePixels,
        deviceToCssPixels,
        isElementInViewport,
        scrollIntoViewMobile,
        preventIOSZoom,
        makeTouchFriendly,
        detectVirtualKeyboard,
        getSafeAreaInsets,
        applySafeAreaPadding,
        constrainToViewport,
        positionDropdown,
        addPassiveEventListener,
        optimizeScrollPerformance,
        manageFocusMobile,
        initializeMobileOptimizations
    });
}
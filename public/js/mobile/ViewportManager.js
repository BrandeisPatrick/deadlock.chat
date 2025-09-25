/**
 * ViewportManager - Handles device detection, viewport calculations, and safe area management
 * Provides centralized viewport management for mobile optimization
 */
class ViewportManager {
    constructor() {
        this.viewport = {
            width: 0,
            height: 0,
            devicePixelRatio: 1,
            orientation: 'portrait',
            safeAreas: { top: 0, right: 0, bottom: 0, left: 0 },
            deviceType: 'desktop',
            platform: 'other'
        };
        
        this.callbacks = [];
        this.debounceTimer = null;
        this.debounceDelay = 150; // ms
        
        this.init();
    }
    
    /**
     * Initialize viewport manager
     */
    init() {
        this.updateViewport();
        this.detectPlatform();
        this.setupEventListeners();
        this.detectSafeAreas();
    }
    
    /**
     * Update viewport dimensions and properties
     */
    updateViewport() {
        this.viewport.width = window.innerWidth;
        this.viewport.height = window.innerHeight;
        this.viewport.devicePixelRatio = window.devicePixelRatio || 1;
        this.viewport.orientation = this.getOrientation();
        this.viewport.deviceType = this.getDeviceType();
    }
    
    /**
     * Detect device platform (iOS, Android, other)
     */
    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (/iphone|ipad|ipod/.test(userAgent)) {
            this.viewport.platform = 'ios';
        } else if (/android/.test(userAgent)) {
            this.viewport.platform = 'android';
        } else {
            this.viewport.platform = 'other';
        }
    }
    
    /**
     * Get current device orientation
     */
    getOrientation() {
        if (screen.orientation && screen.orientation.angle !== undefined) {
            return Math.abs(screen.orientation.angle) === 90 ? 'landscape' : 'portrait';
        }
        
        // Fallback for older browsers
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }
    
    /**
     * Determine device type based on screen size
     */
    getDeviceType() {
        const width = this.viewport.width;
        
        if (width <= 768) {
            return width <= 480 ? 'mobile' : 'tablet';
        }
        
        return 'desktop';
    }
    
    /**
     * Detect safe areas for notched devices
     */
    detectSafeAreas() {
        // Use CSS environment variables for safe areas (iOS 11.2+)
        const computedStyle = getComputedStyle(document.documentElement);
        
        // Try to get safe area values
        const safeAreaTop = this.parseSafeAreaValue(computedStyle.getPropertyValue('env(safe-area-inset-top)'));
        const safeAreaRight = this.parseSafeAreaValue(computedStyle.getPropertyValue('env(safe-area-inset-right)'));
        const safeAreaBottom = this.parseSafeAreaValue(computedStyle.getPropertyValue('env(safe-area-inset-bottom)'));
        const safeAreaLeft = this.parseSafeAreaValue(computedStyle.getPropertyValue('env(safe-area-inset-left)'));
        
        this.viewport.safeAreas = {
            top: safeAreaTop,
            right: safeAreaRight,
            bottom: safeAreaBottom,
            left: safeAreaLeft
        };
        
        // Fallback detection for devices without CSS env() support
        if (this.viewport.platform === 'ios' && this.hasNotch()) {
            this.estimateSafeAreas();
        }
    }
    
    /**
     * Parse safe area CSS value to pixels
     */
    parseSafeAreaValue(value) {
        if (!value || value === '') return 0;
        
        // Remove 'px' and convert to number
        const numValue = parseFloat(value.replace('px', ''));
        return isNaN(numValue) ? 0 : numValue;
    }
    
    /**
     * Check if device likely has a notch (heuristic approach)
     */
    hasNotch() {
        // iPhone X and newer have specific screen dimensions
        const { width, height } = this.viewport;
        const ratio = Math.max(width, height) / Math.min(width, height);
        
        // iPhone X+ have aspect ratios around 2.16:1 or higher
        return ratio > 2.1 && this.viewport.platform === 'ios';
    }
    
    /**
     * Estimate safe areas for devices without CSS env() support
     */
    estimateSafeAreas() {
        const { orientation } = this.viewport;
        
        if (orientation === 'portrait') {
            // Portrait mode - notch at top, home indicator at bottom
            this.viewport.safeAreas.top = 44; // Status bar + notch
            this.viewport.safeAreas.bottom = 34; // Home indicator
        } else {
            // Landscape mode - notch on side, smaller bottom safe area
            this.viewport.safeAreas.left = 44;
            this.viewport.safeAreas.right = 44;
            this.viewport.safeAreas.bottom = 21;
        }
    }
    
    /**
     * Setup event listeners for viewport changes
     */
    setupEventListeners() {
        // Debounced resize handler
        window.addEventListener('resize', () => {
            this.handleViewportChange();
        }, { passive: true });
        
        // Orientation change handler
        window.addEventListener('orientationchange', () => {
            // Delay to allow browser to update dimensions
            setTimeout(() => {
                this.handleViewportChange();
            }, 100);
        }, { passive: true });
        
        // Visual viewport API for better mobile support
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.handleViewportChange();
            }, { passive: true });
        }
    }
    
    /**
     * Handle viewport changes with debouncing
     */
    handleViewportChange() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            const previousViewport = { ...this.viewport };
            this.updateViewport();
            this.detectSafeAreas();
            
            // Notify callbacks of viewport change
            this.callbacks.forEach(callback => {
                try {
                    callback(this.viewport, previousViewport);
                } catch (error) {
                    console.error('ViewportManager callback error:', error);
                }
            });
        }, this.debounceDelay);
    }
    
    /**
     * Get current viewport information
     */
    getCurrentViewport() {
        return { ...this.viewport };
    }
    
    /**
     * Check if current device is mobile
     */
    isMobile() {
        return this.viewport.deviceType === 'mobile';
    }
    
    /**
     * Check if current device is tablet
     */
    isTablet() {
        return this.viewport.deviceType === 'tablet';
    }
    
    /**
     * Check if current device is mobile or tablet
     */
    isMobileOrTablet() {
        return this.isMobile() || this.isTablet();
    }
    
    /**
     * Get current orientation
     */
    getOrientation() {
        return this.viewport.orientation;
    }
    
    /**
     * Get safe area insets
     */
    getSafeAreas() {
        return { ...this.viewport.safeAreas };
    }
    
    /**
     * Get platform information
     */
    getPlatform() {
        return this.viewport.platform;
    }
    
    /**
     * Register callback for viewport changes
     */
    onViewportChange(callback) {
        if (typeof callback === 'function') {
            this.callbacks.push(callback);
        }
        
        // Return unsubscribe function
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1) {
                this.callbacks.splice(index, 1);
            }
        };
    }
    
    /**
     * Get viewport-aware positioning utilities
     */
    getPositioningUtils() {
        return new ViewportPositioningUtils(this);
    }
    
    /**
     * Check if element would be outside viewport bounds
     */
    isElementOutsideViewport(element, margin = 0) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const { width, height } = this.viewport;
        const { top, right, bottom, left } = this.viewport.safeAreas;
        
        return (
            rect.left < (left + margin) ||
            rect.top < (top + margin) ||
            rect.right > (width - right - margin) ||
            rect.bottom > (height - bottom - margin)
        );
    }
    
    /**
     * Get available viewport dimensions (excluding safe areas)
     */
    getAvailableViewport() {
        const { width, height, safeAreas } = this.viewport;
        
        return {
            width: width - safeAreas.left - safeAreas.right,
            height: height - safeAreas.top - safeAreas.bottom,
            left: safeAreas.left,
            top: safeAreas.top,
            right: width - safeAreas.right,
            bottom: height - safeAreas.bottom
        };
    }
}

/**
 * ViewportPositioningUtils - Utility functions for viewport-aware positioning
 */
class ViewportPositioningUtils {
    constructor(viewportManager) {
        this.viewportManager = viewportManager;
    }
    
    /**
     * Calculate optimal position for dropdown to stay within viewport
     */
    calculateDropdownPosition(triggerElement, dropdownElement, preferredPosition = 'bottom') {
        if (!triggerElement || !dropdownElement) return null;
        
        const triggerRect = triggerElement.getBoundingClientRect();
        const dropdownRect = dropdownElement.getBoundingClientRect();
        const viewport = this.viewportManager.getAvailableViewport();
        
        let position = {
            top: 0,
            left: 0,
            position: preferredPosition
        };
        
        // Calculate horizontal position
        position.left = Math.max(
            viewport.left,
            Math.min(
                triggerRect.left,
                viewport.right - dropdownRect.width
            )
        );
        
        // Calculate vertical position
        if (preferredPosition === 'bottom') {
            const bottomSpace = viewport.bottom - triggerRect.bottom;
            if (bottomSpace >= dropdownRect.height) {
                position.top = triggerRect.bottom;
            } else {
                // Not enough space below, try above
                const topSpace = triggerRect.top - viewport.top;
                if (topSpace >= dropdownRect.height) {
                    position.top = triggerRect.top - dropdownRect.height;
                    position.position = 'top';
                } else {
                    // Not enough space above either, position at bottom with scroll
                    position.top = Math.max(viewport.top, viewport.bottom - dropdownRect.height);
                }
            }
        } else {
            // Preferred position is 'top'
            const topSpace = triggerRect.top - viewport.top;
            if (topSpace >= dropdownRect.height) {
                position.top = triggerRect.top - dropdownRect.height;
            } else {
                // Not enough space above, try below
                const bottomSpace = viewport.bottom - triggerRect.bottom;
                if (bottomSpace >= dropdownRect.height) {
                    position.top = triggerRect.bottom;
                    position.position = 'bottom';
                } else {
                    // Not enough space below either, position at top
                    position.top = viewport.top;
                }
            }
        }
        
        return position;
    }
    
    /**
     * Calculate optimal position for modal to stay centered within safe areas
     */
    calculateModalPosition(modalElement) {
        if (!modalElement) return null;
        
        const modalRect = modalElement.getBoundingClientRect();
        const viewport = this.viewportManager.getAvailableViewport();
        
        return {
            top: Math.max(
                viewport.top,
                viewport.top + (viewport.height - modalRect.height) / 2
            ),
            left: Math.max(
                viewport.left,
                viewport.left + (viewport.width - modalRect.width) / 2
            )
        };
    }
    
    /**
     * Calculate position for tooltip/popover with edge detection
     */
    calculateTooltipPosition(triggerElement, tooltipElement, preferredSide = 'top') {
        if (!triggerElement || !tooltipElement) return null;
        
        const triggerRect = triggerElement.getBoundingClientRect();
        const tooltipRect = tooltipElement.getBoundingClientRect();
        const viewport = this.viewportManager.getAvailableViewport();
        const margin = 8; // Minimum margin from viewport edge
        
        let position = {
            top: 0,
            left: 0,
            side: preferredSide
        };
        
        // Try preferred side first
        const positions = this.calculateAllTooltipPositions(triggerRect, tooltipRect, viewport, margin);
        
        // Check if preferred position fits
        if (positions[preferredSide] && this.isPositionValid(positions[preferredSide], tooltipRect, viewport)) {
            return positions[preferredSide];
        }
        
        // Try other positions in order of preference
        const fallbackOrder = ['top', 'bottom', 'right', 'left'];
        for (const side of fallbackOrder) {
            if (positions[side] && this.isPositionValid(positions[side], tooltipRect, viewport)) {
                return positions[side];
            }
        }
        
        // If no position fits perfectly, use the one with least overflow
        return this.getBestFitPosition(positions, tooltipRect, viewport);
    }
    
    /**
     * Calculate all possible tooltip positions
     */
    calculateAllTooltipPositions(triggerRect, tooltipRect, viewport, margin) {
        return {
            top: {
                top: triggerRect.top - tooltipRect.height - margin,
                left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
                side: 'top'
            },
            bottom: {
                top: triggerRect.bottom + margin,
                left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
                side: 'bottom'
            },
            left: {
                top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
                left: triggerRect.left - tooltipRect.width - margin,
                side: 'left'
            },
            right: {
                top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
                left: triggerRect.right + margin,
                side: 'right'
            }
        };
    }
    
    /**
     * Check if position is valid (within viewport bounds)
     */
    isPositionValid(position, elementRect, viewport) {
        return (
            position.left >= viewport.left &&
            position.top >= viewport.top &&
            position.left + elementRect.width <= viewport.right &&
            position.top + elementRect.height <= viewport.bottom
        );
    }
    
    /**
     * Get position with least overflow when no perfect fit exists
     */
    getBestFitPosition(positions, elementRect, viewport) {
        let bestPosition = null;
        let minOverflow = Infinity;
        
        Object.values(positions).forEach(position => {
            const overflow = this.calculateOverflow(position, elementRect, viewport);
            if (overflow < minOverflow) {
                minOverflow = overflow;
                bestPosition = position;
            }
        });
        
        return bestPosition;
    }
    
    /**
     * Calculate how much a position overflows the viewport
     */
    calculateOverflow(position, elementRect, viewport) {
        const right = position.left + elementRect.width;
        const bottom = position.top + elementRect.height;
        
        const overflowLeft = Math.max(0, viewport.left - position.left);
        const overflowTop = Math.max(0, viewport.top - position.top);
        const overflowRight = Math.max(0, right - viewport.right);
        const overflowBottom = Math.max(0, bottom - viewport.bottom);
        
        return overflowLeft + overflowTop + overflowRight + overflowBottom;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ViewportManager, ViewportPositioningUtils };
} else if (typeof window !== 'undefined') {
    window.ViewportManager = ViewportManager;
    window.ViewportPositioningUtils = ViewportPositioningUtils;
}
/**
 * Platform Optimization Initialization
 * Initializes platform-specific optimizations for mobile devices
 */

// Initialize platform optimizations when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializePlatformOptimizations();
});

/**
 * Initialize all platform optimizations
 */
function initializePlatformOptimizations() {
    console.log('Initializing platform optimizations...');
    
    try {
        // Initialize platform optimizer
        const platformOptimizer = new PlatformOptimizer();
        
        // Store reference globally for access from other modules
        window.platformOptimizer = platformOptimizer;
        
        // Setup platform-specific event handlers
        setupPlatformEventHandlers(platformOptimizer);
        
        // Setup PWA features
        setupPWAFeatures(platformOptimizer);
        
        // Setup device-specific features
        setupDeviceFeatures(platformOptimizer);
        
        console.log('Platform optimizations initialized successfully');
        
        // Dispatch custom event to notify other modules
        document.dispatchEvent(new CustomEvent('platformOptimizationsReady', {
            detail: { platformOptimizer }
        }));
        
    } catch (error) {
        console.error('Failed to initialize platform optimizations:', error);
    }
}

/**
 * Setup platform-specific event handlers
 */
function setupPlatformEventHandlers(platformOptimizer) {
    const platform = platformOptimizer.getPlatformInfo();
    
    // Handle visibility change for PWA
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            // App became visible - refresh if needed
            handleAppVisible(platformOptimizer);
        } else {
            // App became hidden - cleanup if needed
            handleAppHidden(platformOptimizer);
        }
    });
    
    // Handle online/offline status
    window.addEventListener('online', function() {
        handleOnlineStatus(true, platformOptimizer);
    });
    
    window.addEventListener('offline', function() {
        handleOnlineStatus(false, platformOptimizer);
    });
    
    // Handle app install events
    window.addEventListener('beforeinstallprompt', function(e) {
        handleInstallPrompt(e, platformOptimizer);
    });
    
    window.addEventListener('appinstalled', function() {
        handleAppInstalled(platformOptimizer);
    });
    
    // Platform-specific event handlers
    if (platform.platform === 'ios') {
        setupIOSEventHandlers(platformOptimizer);
    } else if (platform.platform === 'android') {
        setupAndroidEventHandlers(platformOptimizer);
    }
}

/**
 * Setup PWA-specific features
 */
function setupPWAFeatures(platformOptimizer) {
    // Check if running as PWA
    if (platformOptimizer.isStandalone) {
        document.body.classList.add('pwa-mode');
        
        // Setup PWA-specific navigation
        setupPWANavigation();
        
        // Setup PWA-specific UI adjustments
        setupPWAUI();
    }
    
    // Setup service worker communication
    if ('serviceWorker' in navigator) {
        setupServiceWorkerCommunication();
    }
}

/**
 * Setup device-specific features
 */
function setupDeviceFeatures(platformOptimizer) {
    const capabilities = platformOptimizer.capabilities;
    
    // Setup vibration feedback if supported
    if (capabilities.vibration) {
        setupVibrationFeedback();
    }
    
    // Setup orientation handling if supported
    if (capabilities.orientationLock) {
        setupOrientationHandling();
    }
    
    // Setup web share if supported
    if (capabilities.webShare) {
        setupWebShareFeatures();
    }
    
    // Setup device motion if supported
    if (capabilities.deviceMotion) {
        setupDeviceMotionFeatures();
    }
}

/**
 * Setup iOS-specific event handlers
 */
function setupIOSEventHandlers(platformOptimizer) {
    // Handle iOS-specific viewport changes
    window.addEventListener('orientationchange', function() {
        // Delay to allow iOS to complete orientation change
        setTimeout(() => {
            handleIOSOrientationChange(platformOptimizer);
        }, 100);
    });
    
    // Handle iOS keyboard events
    window.addEventListener('focusin', function(e) {
        if (e.target.matches('input, textarea')) {
            handleIOSKeyboardShow(e.target);
        }
    });
    
    window.addEventListener('focusout', function(e) {
        if (e.target.matches('input, textarea')) {
            handleIOSKeyboardHide(e.target);
        }
    });
    
    // Handle iOS safe area changes
    if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
        setupIOSSafeAreaHandling();
    }
}

/**
 * Setup Android-specific event handlers
 */
function setupAndroidEventHandlers(platformOptimizer) {
    // Handle Android back button
    window.addEventListener('popstate', function(e) {
        handleAndroidBackButton(e, platformOptimizer);
    });
    
    // Handle Android keyboard events
    window.addEventListener('resize', function() {
        handleAndroidKeyboardResize();
    });
    
    // Setup Android-specific touch handling
    setupAndroidTouchHandling();
}

/**
 * Handle app becoming visible
 */
function handleAppVisible(platformOptimizer) {
    console.log('App became visible');
    
    // Refresh data if needed
    // Check for updates
    // Resume animations
}

/**
 * Handle app becoming hidden
 */
function handleAppHidden(platformOptimizer) {
    console.log('App became hidden');
    
    // Pause animations
    // Save state
    // Cleanup resources
}

/**
 * Handle online/offline status changes
 */
function handleOnlineStatus(isOnline, platformOptimizer) {
    console.log('Network status changed:', isOnline ? 'online' : 'offline');
    
    document.body.classList.toggle('offline', !isOnline);
    
    if (isOnline) {
        // Sync pending data
        // Refresh content
        showNetworkStatus('Back online', 'success');
    } else {
        // Show offline message
        showNetworkStatus('You are offline', 'warning');
    }
}

/**
 * Handle install prompt
 */
function handleInstallPrompt(e, platformOptimizer) {
    console.log('Install prompt available');
    e.preventDefault();
    
    // Store the event for later use
    window.deferredPrompt = e;
    
    // Show custom install UI
    showInstallPrompt(e);
}

/**
 * Handle app installed
 */
function handleAppInstalled(platformOptimizer) {
    console.log('App was installed');
    
    // Hide install prompt
    hideInstallPrompt();
    
    // Show success message
    showNetworkStatus('App installed successfully!', 'success');
    
    // Track installation
    if (typeof gtag !== 'undefined') {
        gtag('event', 'app_installed', {
            event_category: 'PWA',
            event_label: platformOptimizer.platform
        });
    }
}

/**
 * Setup PWA navigation
 */
function setupPWANavigation() {
    // Add PWA-specific navigation behavior
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href]');
        if (link && link.href.startsWith(window.location.origin)) {
            // Handle internal navigation for PWA
            handlePWANavigation(e, link);
        }
    });
}

/**
 * Setup PWA UI adjustments
 */
function setupPWAUI() {
    // Add PWA-specific UI elements
    const header = document.querySelector('.header, .navbar');
    if (header) {
        header.classList.add('pwa-header');
    }
    
    // Add status bar spacer for iOS
    if (window.platformOptimizer?.platform === 'ios') {
        const statusBar = document.createElement('div');
        statusBar.className = 'status-bar-spacer';
        document.body.insertBefore(statusBar, document.body.firstChild);
    }
}

/**
 * Setup service worker communication
 */
function setupServiceWorkerCommunication() {
    navigator.serviceWorker.addEventListener('message', function(event) {
        console.log('Message from service worker:', event.data);
        
        if (event.data.type === 'UPDATE_AVAILABLE') {
            showUpdatePrompt();
        }
    });
    
    // Check for service worker updates
    navigator.serviceWorker.ready.then(function(registration) {
        registration.addEventListener('updatefound', function() {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', function() {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    showUpdatePrompt();
                }
            });
        });
    });
}

/**
 * Setup vibration feedback
 */
function setupVibrationFeedback() {
    // Add vibration to button clicks
    document.addEventListener('click', function(e) {
        if (e.target.matches('button, .btn, [role="button"]')) {
            navigator.vibrate([10]); // Short vibration
        }
    });
    
    // Add vibration to form submissions
    document.addEventListener('submit', function(e) {
        navigator.vibrate([20, 10, 20]); // Double vibration
    });
}

/**
 * Setup orientation handling
 */
function setupOrientationHandling() {
    const handleOrientationChange = () => {
        const orientation = screen.orientation?.type || 
                          (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
        
        document.body.classList.remove('orientation-portrait', 'orientation-landscape');
        document.body.classList.add(`orientation-${orientation.includes('portrait') ? 'portrait' : 'landscape'}`);
        
        // Dispatch orientation change event
        document.dispatchEvent(new CustomEvent('orientationChanged', {
            detail: { orientation }
        }));
    };

    if (screen.orientation) {
        screen.orientation.addEventListener('change', handleOrientationChange);
    } else {
        window.addEventListener('orientationchange', handleOrientationChange);
    }

    // Initial orientation
    handleOrientationChange();
}

/**
 * Setup web share features
 */
function setupWebShareFeatures() {
    document.addEventListener('click', async function(e) {
        if (e.target.matches('.share-btn, [data-share]')) {
            e.preventDefault();
            
            const shareData = {
                title: document.title,
                text: 'Check out Deadlock Analytics',
                url: window.location.href
            };

            try {
                await navigator.share(shareData);
            } catch (error) {
                console.log('Share failed:', error);
                // Fallback to clipboard
                copyToClipboard(shareData.url);
            }
        }
    });
}

/**
 * Setup device motion features
 */
function setupDeviceMotionFeatures() {
    // Request permission for device motion on iOS 13+
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        // Will be requested when needed
    }
    
    // Setup shake detection for refresh
    let lastShake = 0;
    window.addEventListener('devicemotion', function(e) {
        const acceleration = e.accelerationIncludingGravity;
        const threshold = 15;
        
        if (acceleration && 
            (Math.abs(acceleration.x) > threshold || 
             Math.abs(acceleration.y) > threshold || 
             Math.abs(acceleration.z) > threshold)) {
            
            const now = Date.now();
            if (now - lastShake > 1000) { // Debounce
                lastShake = now;
                handleShakeGesture();
            }
        }
    });
}

/**
 * Handle iOS orientation change
 */
function handleIOSOrientationChange(platformOptimizer) {
    // Force viewport recalculation
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        const content = viewport.content;
        viewport.content = content;
    }
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
}

/**
 * Handle iOS keyboard show
 */
function handleIOSKeyboardShow(input) {
    // Scroll input into view
    setTimeout(() => {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
}

/**
 * Handle iOS keyboard hide
 */
function handleIOSKeyboardHide(input) {
    // Reset viewport
    window.scrollTo(0, 0);
}

/**
 * Setup iOS safe area handling
 */
function setupIOSSafeAreaHandling() {
    // Monitor safe area changes
    const observer = new ResizeObserver(() => {
        updateSafeAreaVars();
    });
    
    observer.observe(document.documentElement);
    updateSafeAreaVars();
}

/**
 * Update safe area CSS variables
 */
function updateSafeAreaVars() {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    const safeAreaTop = computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0px';
    const safeAreaBottom = computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0px';
    
    root.style.setProperty('--safe-area-top', safeAreaTop);
    root.style.setProperty('--safe-area-bottom', safeAreaBottom);
}

/**
 * Handle Android back button
 */
function handleAndroidBackButton(e, platformOptimizer) {
    // Handle back navigation for PWA
    const modal = document.querySelector('.modal.active');
    const menu = document.querySelector('.mobile-menu.active');
    
    if (modal) {
        e.preventDefault();
        modal.classList.remove('active');
    } else if (menu) {
        e.preventDefault();
        menu.classList.remove('active');
    }
}

/**
 * Handle Android keyboard resize
 */
function handleAndroidKeyboardResize() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

/**
 * Setup Android touch handling
 */
function setupAndroidTouchHandling() {
    // Add ripple effect to buttons
    document.addEventListener('touchstart', function(e) {
        if (e.target.matches('button, .btn, [role="button"]')) {
            addRippleEffect(e.target, e.touches[0]);
        }
    });
}

/**
 * Add ripple effect to element
 */
function addRippleEffect(element, touch) {
    const rect = element.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: translate(-50%, -50%);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * Show network status message
 */
function showNetworkStatus(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `network-toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#00ff41' : type === 'warning' ? '#ff8800' : '#0080ff'};
        color: black;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        animation: toast-slide-in 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toast-slide-out 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Show install prompt
 */
function showInstallPrompt(deferredPrompt) {
    const prompt = document.createElement('div');
    prompt.className = 'install-prompt';
    prompt.innerHTML = `
        <div class="install-icon">📱</div>
        <div class="install-text">
            <div>Install Deadlock Analytics</div>
            <div style="font-size: 12px; opacity: 0.7;">Get the full app experience</div>
        </div>
        <div class="install-actions">
            <button class="btn btn-secondary install-dismiss">Later</button>
            <button class="btn btn-primary install-accept">Install</button>
        </div>
    `;
    
    document.body.appendChild(prompt);
    
    // Handle install actions
    prompt.querySelector('.install-accept').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('Install outcome:', outcome);
        }
        prompt.remove();
    });
    
    prompt.querySelector('.install-dismiss').addEventListener('click', () => {
        prompt.remove();
    });
}

/**
 * Hide install prompt
 */
function hideInstallPrompt() {
    const prompt = document.querySelector('.install-prompt');
    if (prompt) {
        prompt.remove();
    }
}

/**
 * Show update prompt
 */
function showUpdatePrompt() {
    const prompt = document.createElement('div');
    prompt.className = 'update-prompt';
    prompt.innerHTML = `
        <div class="update-icon">🔄</div>
        <div class="update-text">
            <div>Update Available</div>
            <div style="font-size: 12px; opacity: 0.7;">Restart to get the latest features</div>
        </div>
        <div class="update-actions">
            <button class="btn btn-secondary update-dismiss">Later</button>
            <button class="btn btn-primary update-accept">Update</button>
        </div>
    `;
    
    document.body.appendChild(prompt);
    
    // Handle update actions
    prompt.querySelector('.update-accept').addEventListener('click', () => {
        window.location.reload();
    });
    
    prompt.querySelector('.update-dismiss').addEventListener('click', () => {
        prompt.remove();
    });
}

/**
 * Handle PWA navigation
 */
function handlePWANavigation(e, link) {
    // Add custom PWA navigation logic here if needed
    // For now, use default navigation
}

/**
 * Handle shake gesture
 */
function handleShakeGesture() {
    console.log('Shake gesture detected');
    
    // Add shake gesture actions here
    // For example: refresh data, show debug info, etc.
    
    // Vibrate to confirm gesture
    if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
    }
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNetworkStatus('Copied to clipboard', 'success');
    } catch (error) {
        console.log('Clipboard copy failed:', error);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes toast-slide-in {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes toast-slide-out {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
    
    @keyframes ripple-animation {
        to { width: 100px; height: 100px; opacity: 0; }
    }
`;
document.head.appendChild(style);
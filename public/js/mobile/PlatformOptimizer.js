/**
 * Platform-Specific Optimization Controller
 * Handles iOS Safari, Android Chrome, and PWA optimizations
 */
class PlatformOptimizer {
    constructor() {
        this.platform = this.detectPlatform();
        this.isStandalone = this.detectStandalone();
        this.capabilities = this.detectCapabilities();
        
        this.init();
    }

    /**
     * Detect the current platform
     */
    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform?.toLowerCase() || '';
        
        if (/iphone|ipad|ipod/.test(userAgent) || /mac/.test(platform)) {
            return 'ios';
        } else if (/android/.test(userAgent)) {
            return 'android';
        } else if (/windows/.test(userAgent) || /win/.test(platform)) {
            return 'windows';
        }
        
        return 'other';
    }

    /**
     * Detect if running as standalone PWA
     */
    detectStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://');
    }

    /**
     * Detect device capabilities
     */
    detectCapabilities() {
        return {
            vibration: 'vibrate' in navigator,
            orientationLock: 'orientation' in screen || 'lockOrientation' in screen,
            touchForce: 'ontouchforcechange' in document,
            deviceMotion: 'DeviceMotionEvent' in window,
            deviceOrientation: 'DeviceOrientationEvent' in window,
            webShare: 'share' in navigator,
            installPrompt: 'onbeforeinstallprompt' in window
        };
    }

    /**
     * Initialize platform-specific optimizations
     */
    init() {
        this.applyPlatformStyles();
        this.setupTouchBehaviors();
        this.setupSafeAreas();
        this.setupPWAFeatures();
        this.setupDeviceFeatures();
        
        console.log('Platform Optimizer initialized:', {
            platform: this.platform,
            standalone: this.isStandalone,
            capabilities: this.capabilities
        });
    }

    /**
     * Apply platform-specific CSS styles
     */
    applyPlatformStyles() {
        const body = document.body;
        
        // Add platform class
        body.classList.add(`platform-${this.platform}`);
        
        if (this.isStandalone) {
            body.classList.add('standalone-app');
        }

        // iOS-specific optimizations
        if (this.platform === 'ios') {
            this.applyIOSOptimizations();
        }
        
        // Android-specific optimizations
        if (this.platform === 'android') {
            this.applyAndroidOptimizations();
        }
    }

    /**
     * Apply iOS Safari-specific optimizations
     */
    applyIOSOptimizations() {
        const meta = document.createElement('meta');
        
        // Ensure viewport-fit=cover is set for safe areas
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta && !viewportMeta.content.includes('viewport-fit=cover')) {
            viewportMeta.content += ', viewport-fit=cover';
        }

        // Add iOS-specific meta tags
        const iosMetas = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'apple-touch-fullscreen', content: 'yes' },
            { name: 'format-detection', content: 'telephone=no' }
        ];

        iosMetas.forEach(metaData => {
            if (!document.querySelector(`meta[name="${metaData.name}"]`)) {
                const meta = document.createElement('meta');
                meta.name = metaData.name;
                meta.content = metaData.content;
                document.head.appendChild(meta);
            }
        });

        // Apply iOS-specific CSS
        this.addIOSStyles();
    }

    /**
     * Apply Android Chrome optimizations
     */
    applyAndroidOptimizations() {
        // Add Android-specific meta tags
        const androidMetas = [
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'theme-color', content: '#000000' },
            { name: 'msapplication-navbutton-color', content: '#000000' }
        ];

        androidMetas.forEach(metaData => {
            if (!document.querySelector(`meta[name="${metaData.name}"]`)) {
                const meta = document.createElement('meta');
                meta.name = metaData.name;
                meta.content = metaData.content;
                document.head.appendChild(meta);
            }
        });

        // Apply Android-specific CSS
        this.addAndroidStyles();
    }

    /**
     * Setup platform-specific touch behaviors
     */
    setupTouchBehaviors() {
        const style = document.createElement('style');
        
        let css = `
            /* Base touch optimizations */
            * {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
            
            /* Allow text selection for content areas */
            input, textarea, [contenteditable], .selectable-text {
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
                user-select: text;
            }
            
            /* Interactive elements should have tap highlights */
            button, .btn, [role="button"], a, .clickable {
                -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1);
                cursor: pointer;
            }
        `;

        // iOS-specific touch behaviors
        if (this.platform === 'ios') {
            css += `
                /* iOS-specific touch optimizations */
                .platform-ios {
                    -webkit-overflow-scrolling: touch;
                }
                
                .platform-ios input[type="text"],
                .platform-ios input[type="email"],
                .platform-ios input[type="password"],
                .platform-ios input[type="search"],
                .platform-ios textarea {
                    font-size: 16px !important; /* Prevent zoom on focus */
                    -webkit-appearance: none;
                    border-radius: 0;
                }
                
                .platform-ios button {
                    -webkit-appearance: none;
                    border-radius: 8px;
                }
            `;
        }

        // Android-specific touch behaviors
        if (this.platform === 'android') {
            css += `
                /* Android-specific touch optimizations */
                .platform-android button {
                    background-clip: padding-box;
                }
                
                .platform-android .ripple-effect {
                    position: relative;
                    overflow: hidden;
                }
            `;
        }

        style.textContent = css;
        document.head.appendChild(style);
    }

    /**
     * Setup safe area handling for iOS
     */
    setupSafeAreas() {
        if (this.platform !== 'ios') return;

        const style = document.createElement('style');
        style.textContent = `
            /* iOS Safe Area Support */
            .platform-ios {
                padding-top: env(safe-area-inset-top);
                padding-right: env(safe-area-inset-right);
                padding-bottom: env(safe-area-inset-bottom);
                padding-left: env(safe-area-inset-left);
            }
            
            .platform-ios .safe-area-top {
                padding-top: env(safe-area-inset-top);
            }
            
            .platform-ios .safe-area-bottom {
                padding-bottom: env(safe-area-inset-bottom);
            }
            
            .platform-ios .safe-area-left {
                padding-left: env(safe-area-inset-left);
            }
            
            .platform-ios .safe-area-right {
                padding-right: env(safe-area-inset-right);
            }
            
            /* Header adjustments for notched devices */
            .platform-ios .header,
            .platform-ios .navbar {
                padding-top: calc(1rem + env(safe-area-inset-top));
            }
            
            /* Footer adjustments for home indicator */
            .platform-ios .footer,
            .platform-ios .bottom-nav {
                padding-bottom: calc(1rem + env(safe-area-inset-bottom));
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Setup PWA features
     */
    setupPWAFeatures() {
        // Handle install prompt
        if (this.capabilities.installPrompt) {
            this.setupInstallPrompt();
        }

        // Setup service worker if not already registered
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }

        // Add PWA manifest if not present
        this.ensurePWAManifest();
    }

    /**
     * Setup device-specific features
     */
    setupDeviceFeatures() {
        // Vibration support
        if (this.capabilities.vibration) {
            this.setupVibrationFeedback();
        }

        // Orientation lock support
        if (this.capabilities.orientationLock) {
            this.setupOrientationHandling();
        }

        // Web Share API
        if (this.capabilities.webShare) {
            this.setupWebShare();
        }
    }

    /**
     * Add iOS-specific styles
     */
    addIOSStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* iOS-specific styling */
            .platform-ios {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .platform-ios .btn {
                border-radius: 8px;
                font-weight: 600;
            }
            
            .platform-ios .card {
                border-radius: 12px;
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
            }
            
            .platform-ios .modal {
                border-radius: 12px 12px 0 0;
            }
            
            /* iOS-style scrollbars */
            .platform-ios ::-webkit-scrollbar {
                width: 3px;
                height: 3px;
            }
            
            .platform-ios ::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .platform-ios ::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Add Android-specific styles
     */
    addAndroidStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Android Material Design styling */
            .platform-android {
                font-family: 'Roboto', 'Noto Sans', sans-serif;
            }
            
            .platform-android .btn {
                border-radius: 4px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .platform-android .card {
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            
            .platform-android .modal {
                border-radius: 8px;
            }
            
            /* Material Design elevation */
            .platform-android .elevation-1 {
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            }
            
            .platform-android .elevation-2 {
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            }
            
            .platform-android .elevation-3 {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Setup install prompt handling
     */
    setupInstallPrompt() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button or banner
            this.showInstallOption(deferredPrompt);
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallOption();
        });
    }

    /**
     * Register service worker
     */
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }

    /**
     * Ensure PWA manifest is present
     */
    ensurePWAManifest() {
        if (!document.querySelector('link[rel="manifest"]')) {
            const link = document.createElement('link');
            link.rel = 'manifest';
            link.href = '/manifest.json';
            document.head.appendChild(link);
        }
    }

    /**
     * Setup vibration feedback
     */
    setupVibrationFeedback() {
        // Add vibration to button clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .btn, [role="button"]')) {
                this.vibrate([10]); // Short vibration
            }
        });
    }

    /**
     * Setup orientation handling
     */
    setupOrientationHandling() {
        const handleOrientationChange = () => {
            // Add orientation class to body
            const orientation = screen.orientation?.type || 
                              (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
            
            document.body.classList.remove('orientation-portrait', 'orientation-landscape');
            document.body.classList.add(`orientation-${orientation.includes('portrait') ? 'portrait' : 'landscape'}`);
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
     * Setup Web Share API
     */
    setupWebShare() {
        // Add share functionality to share buttons
        document.addEventListener('click', async (e) => {
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
                    this.copyToClipboard(shareData.url);
                }
            }
        });
    }

    /**
     * Show install option
     */
    showInstallOption(deferredPrompt) {
        // Create install button if it doesn't exist
        if (!document.querySelector('.install-btn')) {
            const installBtn = document.createElement('button');
            installBtn.className = 'install-btn btn';
            installBtn.textContent = 'Install App';
            installBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                background: var(--accent, #ff0080);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
            `;

            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log('Install prompt outcome:', outcome);
                    deferredPrompt = null;
                }
            });

            document.body.appendChild(installBtn);
        }
    }

    /**
     * Hide install option
     */
    hideInstallOption() {
        const installBtn = document.querySelector('.install-btn');
        if (installBtn) {
            installBtn.remove();
        }
    }

    /**
     * Vibrate with pattern
     */
    vibrate(pattern) {
        if (this.capabilities.vibration) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('Copied to clipboard');
        } catch (error) {
            console.log('Clipboard copy failed:', error);
        }
    }

    /**
     * Get platform information
     */
    getPlatformInfo() {
        return {
            platform: this.platform,
            standalone: this.isStandalone,
            capabilities: this.capabilities
        };
    }

    /**
     * Lock orientation (if supported)
     */
    async lockOrientation(orientation = 'portrait') {
        if (this.capabilities.orientationLock && screen.orientation?.lock) {
            try {
                await screen.orientation.lock(orientation);
                return true;
            } catch (error) {
                console.log('Orientation lock failed:', error);
                return false;
            }
        }
        return false;
    }

    /**
     * Unlock orientation
     */
    unlockOrientation() {
        if (this.capabilities.orientationLock && screen.orientation?.unlock) {
            screen.orientation.unlock();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformOptimizer;
}
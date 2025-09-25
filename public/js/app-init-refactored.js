// Application Initialization - Refactored Version
// This script initializes the new modular application structure

import { initializeApp } from '../../src/components/AppController.js';

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded
    initializeApp();
}

// Make initialization function available globally for debugging
window.initializeApp = initializeApp;
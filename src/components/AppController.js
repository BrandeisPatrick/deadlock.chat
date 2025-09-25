// Application Controller
// Handles main application logic and section navigation

import { initializeItemStats } from './ItemStats.js';

export class AppController {
    constructor() {
        this.currentSection = 'dashboard';
        this.initializedSections = new Set();
        this.sections = {
            'dashboard': this.initializeDashboard.bind(this),
            'hero-stats': this.initializeHeroStats.bind(this),
            'item-stats': this.initializeItemStats.bind(this)
        };
    }

    /**
     * Initialize the application
     */
    async initialize() {
        console.log('🎮 [App] Initializing application...');
        
        // Set up navigation
        this.setupNavigation();
        
        // Initialize default section
        await this.showSection('dashboard');
        
        console.log('✅ [App] Application initialized');
    }

    /**
     * Set up navigation event listeners
     */
    setupNavigation() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', async (e) => {
                const sectionId = e.target.dataset.section;
                if (sectionId) {
                    await this.showSection(sectionId);
                }
            });
        });

        // Menu navigation (if exists)
        document.querySelectorAll('[data-target]').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const sectionId = e.target.dataset.target;
                if (sectionId) {
                    await this.showSection(sectionId);
                }
            });
        });
    }

    /**
     * Show a specific section
     */
    async showSection(sectionId) {
        console.log(`🔄 [App] Switching to section: ${sectionId}`);
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });

        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        const activeTab = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Initialize section if needed
        if (!this.initializedSections.has(sectionId)) {
            await this.initializeSection(sectionId);
        }

        this.currentSection = sectionId;
    }

    /**
     * Initialize a specific section
     */
    async initializeSection(sectionId) {
        if (this.sections[sectionId]) {
            try {
                console.log(`🔧 [App] Initializing ${sectionId}...`);
                await this.sections[sectionId]();
                this.initializedSections.add(sectionId);
                this.updateSectionStatus(sectionId, 'success');
                console.log(`✅ [App] ${sectionId} initialized successfully`);
            } catch (error) {
                console.error(`❌ [App] Failed to initialize ${sectionId}:`, error);
                this.updateSectionStatus(sectionId, 'error');
                this.showSectionError(sectionId, error.message);
            }
        }
    }

    /**
     * Update section status indicator
     */
    updateSectionStatus(sectionId, status) {
        const statusEl = document.getElementById(`${sectionId}-status`);
        if (statusEl) {
            statusEl.className = `status status-${status}`;
            const text = status === 'success' ? 'Live' : status === 'error' ? 'Error' : 'Loading';
            statusEl.innerHTML = `<span>●</span><span>${text}</span>`;
        }
    }

    /**
     * Show error in section
     */
    showSectionError(sectionId, message) {
        const container = document.getElementById(`${sectionId}-container`);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <div style="color: var(--error); font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                    <p style="color: var(--text-primary); margin-bottom: 1rem;">Failed to load ${sectionId}: ${message}</p>
                    <button onclick="window.location.reload()" 
                            style="padding: 0.5rem 1rem; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Initialize dashboard section
     */
    async initializeDashboard() {
        // Dashboard initialization logic would go here
        console.log('📊 [Dashboard] Initializing...');
    }

    /**
     * Initialize hero stats section
     */
    async initializeHeroStats() {
        console.log('🦸 [Hero Stats] Initializing...');
        // Hero stats initialization would be imported and called here
    }

    /**
     * Initialize item stats section
     */
    async initializeItemStats() {
        console.log('🛡️ [Item Stats] Initializing...');
        const container = document.getElementById('item-stats-container');
        if (!container) {
            // Create container if it doesn't exist
            const section = document.getElementById('item-stats');
            if (section) {
                section.innerHTML = '<div id="item-stats-container"></div>';
            }
        }
        
        await initializeItemStats();
    }
}

// Global initialization function for backward compatibility
export async function initializeApp() {
    const app = new AppController();
    await app.initialize();
    
    // Make available globally for debugging
    window.app = app;
    
    return app;
}
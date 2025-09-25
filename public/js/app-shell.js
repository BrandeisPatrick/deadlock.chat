// Global state
let currentSection = 'home';
window.currentSection = currentSection;
let menuVisible = true;

// Show menu (landing page) - Force reload to initial state
function showMenu() {
    window.location.href = '/';  // Forces a full page reload to the base URL
}

// Hide menu and show content
function hideMenu() {
    const overlay = document.getElementById('menuOverlay');
    const content = document.getElementById('content');

    menuVisible = false;

    overlay.classList.add('hidden');
    content.classList.add('show');
    document.body.style.overflow = '';
}

// Loading overlay functions
function showSectionLoadingOverlay() {
    let overlay = document.getElementById('section-loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'section-loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>Loading data...</p>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeIn 0.2s ease-out;
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
}

function hideSectionLoadingOverlay() {
    const overlay = document.getElementById('section-loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Section switching
window.switchSection = async function(sectionId) {
    // Show loading overlay immediately for sections that need data loading
    const needsLoading = ['hero-stats', 'item-stats'].includes(sectionId) && !initializedSections.has(sectionId);
    if (needsLoading) {
        showSectionLoadingOverlay();
    }
    
    // Update current section
    currentSection = sectionId;
    window.currentSection = currentSection;
    // Keep URL in sync for shareable links
    try { window.location.hash = sectionId; } catch {}
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.section === sectionId) {
            tab.classList.add('active');
        }
    });
    
    // Ensure section markup is present (lazy load partials)
    if (typeof window.loadSectionView === 'function') {
        await window.loadSectionView(sectionId);
    }
    // Initialize section-specific functionality
    await initializeSection(sectionId);
    
    // Hide loading overlay after initialization
    if (needsLoading) {
        hideSectionLoadingOverlay();
    }
    
    // Hide menu and show content
    hideMenu();
}


// Initialize section-specific functionality
async function initializeSection(sectionId) {
    if (initializedSections.has(sectionId)) {
        return; // Already initialized
    }

    try {
        switch (sectionId) {
            case 'player-search':
                try {
                    // Ensure SavedProfilesManager is ready and bound to fresh DOM
                    if (!window.savedProfiles) {
                        window.savedProfiles = new SavedProfilesManager();
                    } else {
                        // Re-bind dropdown/save listeners and re-render options
                        window.savedProfiles.setupProfileDropdown();
                        window.savedProfiles.setupSaveButton();
                        await window.savedProfiles.loadProfiles();
                    }
                    
                    // Add event listener for the search button
                    const searchBtn = document.getElementById('playerSearchBtn');
                    if (searchBtn && !searchBtn.dataset.bound) {
                        searchBtn.addEventListener('click', searchPlayer);
                        searchBtn.dataset.bound = 'true';
                    }
                } catch (e) {
                    console.warn('Player search UI init warning:', e);
                }
                initializedSections.add(sectionId);
                break;
            case 'hero-stats':
                console.log('🦸 Initializing hero stats...');
                
                // Update status to loading
                const heroStatus = document.getElementById('heroStatsStatus');
                if (heroStatus) {
                    heroStatus.innerHTML = '<span>●</span><span>Loading</span>';
                    heroStatus.className = 'status status-loading';
                }
                
                try {
                    await window.loadHeroStats();
                    console.log('✅ Hero stats initialized');
                    
                    // Update status to success
                    if (heroStatus) {
                        heroStatus.innerHTML = '<span>●</span><span>Live Data</span>';
                        heroStatus.className = 'status status-success';
                    }
                    
                    initializedSections.add(sectionId);
                } catch (error) {
                    console.error('❌ Hero stats initialization failed:', error);
                    
                    // Update status to error
                    if (heroStatus) {
                        heroStatus.innerHTML = '<span>●</span><span>Error</span>';
                        heroStatus.className = 'status status-error';
                    }
                }
                break;
            
            case 'item-stats':
                console.log('🛡️ Initializing item stats...');
                try {
                    // Use simple item stats implementation
                    await window.loadItemStats();
                    
                    // Update status indicator
                    const statusEl = document.getElementById('item-stats-status');
                    if (statusEl) {
                        statusEl.className = 'status status-success';
                        statusEl.innerHTML = '<span>●</span><span>Live</span>';
                    }
                    
                    initializedSections.add(sectionId);
                    console.log('✅ Item stats initialized successfully');
                } catch (error) {
                    console.error('Failed to initialize item stats:', error);
                    const container = document.getElementById('item-stats-container');
                    if (container) {
                        container.innerHTML = `
                            <div style="text-align: center; padding: 2rem;">
                                <div style="font-size: 3rem;">❌</div>
                                <p>Failed to load item statistics</p>
                            </div>
                        `;
                    }
                }
                break;
        }
    } catch (error) {
        console.error(`❌ Error initializing ${sectionId}:`, error);
    }
}

// Navigation tab handlers
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const sectionId = this.dataset.section;
            switchSection(sectionId);
        });
    });
});

// Initialize sections tracking
let initializedSections = new Set();

const LEGACY_PROFILE_NAME_MAP = {
    '🏎️ M Vestappen': 'M Vestappen',
    '🍳 Anthony Bourdain Swag': 'Anthony Bourdain Swag',
    '🐸 Frog': 'Frog',
    '🗑️ I\'m Garbage': 'I\'m Garbage',
    '💊 Pepto-Bismol': 'Pepto-Bismol',
    '🦇 Bat': 'Bat'
};

// Saved Profiles System
class SavedProfilesManager {
    constructor() {
        this.storageKey = 'deadlock_saved_profiles';
        this.currentSearchResult = null;
        this.init();
    }
    
    async init() {
        this.setupProfileDropdown();
        this.setupSaveButton();
        await this.loadProfiles();
    }
    
    setupProfileDropdown() {
        const profileButton = document.getElementById('profileDropdownButton');
        const profileMenu = document.getElementById('profileDropdownMenu');
        
        if (!profileButton || !profileMenu) return;
        
        // Prevent duplicate bindings when section is reloaded
        if (profileButton.dataset.bound === 'true') {
            return;
        }
        profileButton.dataset.bound = 'true';
        
        // Enhanced mobile interaction
        const toggleDropdown = (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const isOpen = profileMenu.style.display === 'block';
            
            if (isOpen) {
                profileMenu.style.display = 'none';
                profileButton.setAttribute('aria-expanded', 'false');
            } else {
                profileMenu.style.display = 'block';
                profileButton.setAttribute('aria-expanded', 'true');
                
                // Auto-scroll into view on mobile
                if (window.innerWidth <= 768) {
                    setTimeout(() => {
                        profileMenu.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'nearest' 
                        });
                    }, 100);
                }
            }
        };
        
        profileButton.addEventListener('click', toggleDropdown);
        profileButton.addEventListener('touchend', toggleDropdown);
        
        profileMenu.addEventListener('click', (e) => {
            const option = e.target.closest('.profile-option');
            if (!option) return;
            
            const profileId = option.getAttribute('data-value');
            if (profileId) {
                this.loadProfile(profileId);
            }
            
            profileMenu.style.display = 'none';
            profileButton.setAttribute('aria-expanded', 'false');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileButton.contains(e.target) && !profileMenu.contains(e.target)) {
                profileMenu.style.display = 'none';
                profileButton.setAttribute('aria-expanded', 'false');
            }
        });
    }
    
    setupSaveButton() {
        const saveBtn = document.getElementById('saveProfileBtn');
        if (!saveBtn) return;
        // Prevent duplicate bindings
        if (saveBtn.dataset.bound === 'true') return;
        saveBtn.dataset.bound = 'true';
        saveBtn.addEventListener('click', () => {
            this.showSaveDialog();
        });
    }
    
    async loadProfiles() {
        try {
            const profiles = await this.getProfiles();
            if (profiles.length === 0) {
                this.addDefaultProfiles();
                return;
            }
            this.renderProfileDropdown(profiles);
        } catch (error) {
            console.error('Error loading profiles:', error);
            this.addDefaultProfiles();
        }
    }
    
    addDefaultProfiles() {
        const defaultProfiles = [
            {
                id: 'profile_m_vestappen',
                name: 'M Vestappen',
                query: 'https://steamcommunity.com/profiles/76561198148166542/',
                created: Date.now() - 86400000,
                lastUsed: Date.now() - 86400000,
                type: 'steam_profile'
            },
            {
                id: 'profile_anthony_bourdain',
                name: 'Anthony Bourdain Swag',
                query: 'https://steamcommunity.com/id/TheDolanizor',
                created: Date.now() - 172800000,
                lastUsed: Date.now() - 172800000,
                type: 'steam_profile'
            },
            {
                id: 'profile_frog',
                name: 'Frog',
                query: 'https://steamcommunity.com/profiles/76561199836706201',
                created: Date.now() - 259200000,
                lastUsed: Date.now() - 259200000,
                type: 'steam_profile'
            },
            {
                id: 'profile_garbage',
                name: 'I\'m Garbage',
                query: 'https://steamcommunity.com/profiles/76561198148166542',
                created: Date.now() - 345600000,
                lastUsed: Date.now() - 345600000,
                type: 'steam_profile'
            },
            {
                id: 'profile_pepto',
                name: 'Pepto-Bismol',
                query: 'https://steamcommunity.com/id/fisting_300_bucks',
                created: Date.now() - 432000000,
                lastUsed: Date.now() - 432000000,
                type: 'steam_profile'
            },
            {
                id: 'profile_bat',
                name: 'Bat',
                query: 'https://steamcommunity.com/profiles/76561199866750761/',
                created: Date.now() - 604800000,
                lastUsed: Date.now() - 604800000,
                type: 'steam_profile'
            }
        ];
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(defaultProfiles));
            console.log('✅ Added default Steam profiles:', defaultProfiles.map(p => p.name));
            this.loadProfiles();
        } catch (error) {
            console.error('Error adding default profiles:', error);
        }
    }
    
    async getProfiles() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                return [];
            }

            const parsed = JSON.parse(stored);
            return this.sanitizeProfiles(Array.isArray(parsed) ? parsed : []);
        } catch (error) {
            console.error('Error loading profiles:', error);
            return [];
        }
    }

    sanitizeProfiles(profiles) {
        if (!Array.isArray(profiles)) {
            return [];
        }

        let needsUpdate = false;
        const sanitized = profiles.map(profile => {
            if (!profile || typeof profile !== 'object') {
                return profile;
            }

            const normalizedName = LEGACY_PROFILE_NAME_MAP[profile.name];
            if (normalizedName && normalizedName !== profile.name) {
                needsUpdate = true;
                return { ...profile, name: normalizedName };
            }

            return profile;
        });

        if (needsUpdate) {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(sanitized));
            } catch (error) {
                console.error('Error updating saved profiles during sanitization:', error);
            }
        }

        return sanitized;
    }
    
    async saveProfile(profile) {
        const profiles = await this.getProfiles();
        const existingIndex = profiles.findIndex(p => p.id === profile.id);
        
        if (existingIndex >= 0) {
            profiles[existingIndex] = profile;
        } else {
            profiles.push(profile);
        }
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(profiles));
            await this.loadProfiles();
            console.log('✅ Profile saved:', profile.name);
        } catch (error) {
            console.error('❌ Failed to save profile:', error);
        }
    }
    
    async loadProfile(profileId) {
        const profiles = await this.getProfiles();
        const profile = profiles.find(p => p.id === profileId);
        
        if (!profile) {
            console.error('Profile not found:', profileId);
            return;
        }
        
        const searchInput = document.getElementById('playerSearchInput');
        if (searchInput) {
            searchInput.value = profile.query;
        }
        
        const dropdownText = document.querySelector('#profileDropdownButton .dropdown-text');
        if (dropdownText) {
            dropdownText.textContent = profile.name;
        }
        
        console.log('🎯 Loaded profile:', profile.name);
    }
    
    renderProfileDropdown(profiles) {
        const profileMenu = document.getElementById('profileDropdownMenu');
        if (!profileMenu) return;
        
        if (profiles.length === 0) {
            profileMenu.innerHTML = `
                <div class="dropdown-option profile-option" data-value="" style="
                    padding: var(--space-md);
                    border-bottom: 1px solid var(--border);
                    cursor: pointer;
                    color: var(--text-secondary);
                    font-style: italic;
                ">
                    <span>No saved profiles</span>
                </div>
            `;
            return;
        }
        
        const optionsHTML = profiles.map(profile => {
            const initials = this.getInitials(profile.name);
            const lastUsed = new Date(profile.lastUsed).toLocaleDateString();
            
            return `
                <div class="dropdown-option profile-option" data-value="${profile.id}" style="
                    padding: var(--space-md);
                    border-bottom: 1px solid var(--border);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    transition: all 0.3s;
                " onmouseover="this.style.background='var(--bg-card)'; this.style.borderColor='var(--accent)';"
                   onmouseout="this.style.background='transparent'; this.style.borderColor='var(--border)';">
                    <div style="
                        width: 32px;
                        height: 32px;
                        border: 2px solid var(--secondary);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 800;
                        font-size: 0.875rem;
                    ">${initials}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: var(--font-size-small);">${profile.name}</div>
                        <div style="color: var(--text-secondary); font-size: var(--font-size-micro);">Last used: ${lastUsed}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        profileMenu.innerHTML = optionsHTML;
    }
    
    getInitials(name) {
        const emojiMatch = name.match(/^[\u{1F600}-\u{1F64F}]|^[\u{1F300}-\u{1F5FF}]|^[\u{1F680}-\u{1F6FF}]|^[\u{2600}-\u{26FF}]|^[\u{2700}-\u{27BF}]/u);
        if (emojiMatch) {
            return emojiMatch[0];
        }
        
        const textOnly = name.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
        return textOnly.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
    }
    
    showSaveDialog() {
        if (!this.currentSearchResult) return;
        
        const name = prompt('Enter a name for this profile:');
        if (!name) return;
        
        const profile = {
            id: 'profile_' + Date.now(),
            name: name,
            query: this.currentSearchResult.query,
            created: Date.now(),
            lastUsed: Date.now(),
            type: 'steam_profile'
        };
        
        this.saveProfile(profile);
    }
    
    onSearchSuccess(query, result) {
        this.currentSearchResult = { query, result };
        
        const saveBtn = document.getElementById('saveProfileBtn');
        if (saveBtn) {
            saveBtn.style.display = 'block';
        }
    }
}

// Create global instances
let savedProfiles;
let playerSearch;

// Steam API configuration
// Steam API key will be injected by serverless function
const STEAM_API_KEY = null;
const STEAM_API_BASE = 'https://api.steampowered.com';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Parse Steam URL to extract SteamID64 or vanity name
function parseSteamInput(input) {
    const trimmed = input.trim();
    
    // Check if it's a full Steam profile URL
    const steamProfileRegex = /steamcommunity\.com\/(id|profiles)\/([^\/\?]+)/i;
    const match = trimmed.match(steamProfileRegex);
    
    if (match) {
        const [, type, identifier] = match;
        if (type === 'profiles') {
            // Direct SteamID64 (e.g., steamcommunity.com/profiles/76561198148166542/)
            return { type: 'steamid64', value: identifier };
        } else if (type === 'id') {
            // Vanity URL (e.g., steamcommunity.com/id/vanityName/) - now supported!
            return { type: 'vanity', value: identifier };
        }
    }
    
    // Check if it looks like a Steam ID 64 (17 digits starting with 7656119)
    if (/^7656119\d{10}$/.test(trimmed)) {
        return { type: 'steamid64', value: trimmed };
    }
    
    // Assume it's a vanity name if it's alphanumeric
    if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        return { type: 'vanity', value: trimmed };
    }
    
    throw new Error('Please provide a valid Steam profile URL, SteamID64, or vanity name.');
}

// Resolve vanity URL to SteamID64 using Steam API
async function resolveVanityUrl(vanityName) {
    console.log('🔍 Resolving vanity URL:', vanityName);
    
    const steamUrl = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${encodeURIComponent(vanityName)}`;
    const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(steamUrl)}`;
    
    console.log('🌐 Using CORS proxy URL:', proxiedUrl);
    
    try {
        const response = await fetch(proxiedUrl);
        if (!response.ok) {
            throw new Error(`Steam API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Steam API response:', data);
        
        if (data.response && data.response.success === 1) {
            return data.response.steamid;
        } else {
            throw new Error('Vanity URL not found or invalid');
        }
    } catch (error) {
        console.error('❌ Failed to resolve vanity URL:', error);
        throw new Error(`Could not resolve vanity URL "${vanityName}": ${error.message}`);
    }
}

// Get Steam user profile data
async function getSteamUserProfile(steamId64) {
    console.log('👤 Getting Steam profile for:', steamId64);
    
    const steamUrl = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId64}`;
    const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(steamUrl)}`;
    
    console.log('🌐 Using CORS proxy URL:', proxiedUrl);
    
    try {
        const response = await fetch(proxiedUrl);
        if (!response.ok) {
            throw new Error(`Steam API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Steam profile data:', data);
        
        if (data.response && data.response.players && data.response.players.length > 0) {
            return data.response.players[0];
        } else {
            throw new Error('Steam profile not found');
        }
    } catch (error) {
        console.error('❌ Failed to get Steam profile:', error);
        throw new Error(`Could not get Steam profile: ${error.message}`);
    }
}

// Fetch real player data from Deadlock API using proxy
async function fetchRealPlayerData(steamId64) {
    console.log('🔍 Fetching real player data for SteamID64:', steamId64);
    
    try {
        // Convert Steam ID to Account ID for Deadlock API
        const accountId = window.steamId64ToAccountId ? window.steamId64ToAccountId(steamId64) : (steamId64 - 76561197960265728);
        console.log('🔄 Converted SteamID64 to AccountID:', steamId64, '→', accountId);
        
        // Try to get recent match history using Vercel rewrite - this is the only player endpoint available
        const matchHistoryUrl = `/api/players/${accountId}/match-history?limit=10`;
        console.log('📡 Fetching match history via Vercel rewrite:', matchHistoryUrl);
        
        const matchResponse = await fetch(matchHistoryUrl);
        
        if (!matchResponse.ok) {
            throw new Error(`Player not found in Deadlock database (HTTP ${matchResponse.status})`);
        }
        
        const matchData = await matchResponse.json();
        console.log('✅ Got match data:', matchData);
        
        // The match data is an array of match objects
        const matchHistory = Array.isArray(matchData) ? matchData : [];
        console.log(`✅ Found ${matchHistory.length} recent matches for account ID ${accountId}`);
        
        // Return structured player data
        return {
            displayName: `Player_${steamId64.substring(steamId64.length - 8)}`, // Fallback name
            steamId64: steamId64,
            steamid: steamId64,
            accountId: accountId,
            recentMatches: matchHistory,
            matchCount: matchHistory.length,
            resolved: true
        };
        
    } catch (error) {
        console.error('❌ Failed to fetch player data:', error);
        throw error;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ Application initialized');
    
    // Initialize saved profiles system
    savedProfiles = new SavedProfilesManager();
    
    // Initialize player search system
    try {
        const PlayerSearchModule = await import('./player-search.js');
        playerSearch = new PlayerSearchModule.default();
        console.log('✅ Player search module initialized');
    } catch (error) {
        console.error('❌ Failed to initialize player search:', error);
    }
});

// Toggle between card and table view for match history
window.toggleMatchView = function(viewType) {
    const cardBtn = document.getElementById('cardViewBtn');
    const tableBtn = document.getElementById('tableViewBtn');
    const wrapper = document.getElementById('matchTabsWrapper');
    
    // Also try to find buttons in the fallback display
    const fallbackCardBtn = document.querySelector('button[onclick="toggleMatchView(\'card\')"]');
    const fallbackTableBtn = document.querySelector('button[onclick="toggleMatchView(\'table\')"]');
    
    // Update button states
    if (viewType === 'card') {
        // Update main buttons
        if (cardBtn && tableBtn) {
            cardBtn.classList.add('active');
            tableBtn.classList.remove('active');
        }
        // Update fallback buttons
        if (fallbackCardBtn && fallbackTableBtn) {
            fallbackCardBtn.style.background = 'var(--secondary)';
            fallbackCardBtn.style.color = 'var(--primary)';
            fallbackTableBtn.style.background = 'var(--primary)';
            fallbackTableBtn.style.color = 'var(--secondary)';
        }
        
        // Re-render as cards if we have matches
        if (playerSearch && playerSearch.currentMatches) {
            playerSearch.renderMatchesAsCards(playerSearch.currentMatches);
        } else if (wrapper) {
            wrapper.className = 'match-tabs-wrapper card-view';
        }
    } else if (viewType === 'table') {
        // Update main buttons
        if (cardBtn && tableBtn) {
            tableBtn.classList.add('active');
            cardBtn.classList.remove('active');
        }
        // Update fallback buttons
        if (fallbackCardBtn && fallbackTableBtn) {
            fallbackTableBtn.style.background = 'var(--secondary)';
            fallbackTableBtn.style.color = 'var(--primary)';
            fallbackCardBtn.style.background = 'var(--primary)';
            fallbackCardBtn.style.color = 'var(--secondary)';
        }
        
        // Re-render as table if we have matches
        if (playerSearch && playerSearch.currentMatches) {
            playerSearch.renderMatchesAsTable(playerSearch.currentMatches);
        } else if (wrapper) {
            wrapper.className = 'match-tabs-wrapper table-view';
        }
    }
};

// Handle match click from tab/card - directly load match analysis
window.handleMatchFromTab = async function(matchId) {
    if (!matchId) return;

    console.log('🔧 NEW handleMatchFromTab version - Loading match analysis for:', matchId);

    // Switch to match search section and wait for it to load
    await switchSection('match-search');

    // Wait for the DOM elements to be available with retry logic
    let attempts = 0;
    const maxAttempts = 20;
    let matchInput = null;

    while (attempts < maxAttempts) {
        matchInput = document.getElementById('matchSearchInput');
        if (matchInput) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
    }

    if (!matchInput) {
        console.error('Could not find match search input after waiting');
        return;
    }

    // Set the match ID in the input field
    matchInput.value = matchId;

    // Call searchMatch with the matchId directly instead of relying on input
    try {
        await searchMatchWithId(matchId);
    } catch (error) {
        console.error('Failed to load match analysis:', error);
        const results = document.getElementById('matchResults');
        if (results) {
            results.innerHTML = `
                <div class="result-item error">
                    <h4>❌ Failed to Load Match</h4>
                    <p style="color: var(--text-secondary);">Match ID: ${matchId}</p>
                    <p style="color: var(--error); margin-top: 1rem;">
                        ${error.message || 'Unable to fetch match data. Please try again.'}
                    </p>
                </div>
            `;
        }
    }
};

// Search functionality
async function searchPlayer() {
    const input = document.getElementById('playerSearchInput');
    const results = document.getElementById('playerResults');
    
    if (!input.value.trim()) {
        alert('Please enter a player name or Steam profile URL');
        return;
    }
    
    if (!playerSearch) {
        results.innerHTML = `
            <div class="result-item">
                <h4>❌ Player Search Service Unavailable</h4>
                <p style="color: var(--text-secondary);">Player search module failed to initialize. Please refresh the page.</p>
            </div>
        `;
        return;
    }
    
    // Clear previous results first
    const playerInfoCard = document.getElementById('playerInfoCard');
    const playerSearchResults = document.getElementById('playerSearchResults');
    if (playerInfoCard) playerInfoCard.classList.add('hidden');
    if (playerSearchResults) playerSearchResults.classList.add('hidden');
    
    results.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <span>Searching for player...</span>
        </div>
    `;
    
    try {
        console.log('🔍 Searching for player:', input.value);
        
        // Use the playerSearch module's searchPlayer method
        const playerData = await playerSearch.searchPlayer(input.value);
        console.log('✅ Got player data:', playerData);
        
        // Fetch recent matches (20 by default)
        const matchHistory = await playerSearch.fetchPlayerRecentMatches(playerData.steamId64 || playerData.steamid);
        console.log('✅ Got match history:', matchHistory);
        
        // Clear loading message
        results.innerHTML = '';
        
        // Render the results using our new method
        await playerSearch.renderPlayerSearchResults(playerData, matchHistory);
        
        // Notify saved profiles of successful search
        if (savedProfiles && input.value.trim()) {
            savedProfiles.onSearchSuccess(input.value, playerData);
        }
        
    } catch (error) {
        console.error('❌ Player search failed:', error);
        
        results.innerHTML = `
            <div class="result-item">
                <h4 style="color: var(--error);">❌ Player Search Failed</h4>
                <p style="color: var(--text-secondary);">Search query: ${input.value}</p>
                <p style="color: var(--text-secondary); margin-top: 1rem;">
                    ${error.message || 'Unable to find player. Please check the Steam profile URL or player name and try again.'}
                </p>
                <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border);">
                    <div style="font-weight: 700; margin-bottom: 0.5rem;">💡 Tips:</div>
                    <ul style="margin: 0; padding-left: 1rem; font-size: 0.875rem; color: var(--text-secondary);">
                        <li>Use the full Steam profile URL (e.g., https://steamcommunity.com/profiles/...)</li>
                        <li>Check if the Steam profile is public</li>
                        <li>Try using the Steam vanity URL (e.g., https://steamcommunity.com/id/username)</li>
                    </ul>
                </div>
            </div>
        `;
    }
}

// Search match with a specific ID (used by handleMatchFromTab)
async function searchMatchWithId(matchId) {
    if (!matchId) return;

    const results = document.getElementById('matchResults');
    if (!results) {
        console.warn('Match results element not found');
        return;
    }

    await performMatchSearch(matchId, results);
}

async function searchMatch() {
    const input = document.getElementById('matchSearchInput');
    const results = document.getElementById('matchResults');

    // Handle case where input doesn't exist yet (called before section is loaded)
    if (!input) {
        console.warn('Match search input not found - section may not be loaded yet');
        return;
    }

    // Use default match ID if no input provided
    if (!input.value.trim()) {
        input.value = '30603272';
    }

    const matchId = input.value.trim();
    await performMatchSearch(matchId, results);
}

// Common function to perform the actual match search
async function performMatchSearch(matchId, results) {
    
    results.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <span>Analyzing match...</span>
        </div>
    `;
    
    try {
        // Wait for API service to be available
        if (!window.apiService) {
            await new Promise(resolve => {
                if (window.apiService) {
                    resolve();
                } else {
                    window.addEventListener('apiServiceReady', resolve, { once: true });
                }
            });
        }
        
        // Fetch match data
        const matchData = await window.apiService.getMatchMetadata(matchId);
        
        if (!matchData || !matchData.match_info) {
            throw new Error('Match not found or invalid match ID');
        }
        
        // Display match analysis
        await displayMatchAnalysis(matchData, matchId, window.apiService);
        
    } catch (error) {
        console.error('Error fetching match data:', error);
        results.innerHTML = `
            <div class="result-item error">
                <h4>❌ Failed to Load Match</h4>
                <p style="color: var(--text-secondary);">Match ID: ${matchId}</p>
                <p style="color: var(--error); margin-top: 1rem;">
                    ${error.message || 'Unable to fetch match data. Please check the match ID and try again.'}
                </p>
            </div>
        `;
    }
}

function getHeroEmoji(heroId) {
    const emojiMap = {
        1: "🔥", // Infernus
        2: "⚡", // Seven
        3: "🏹", // Vindicta
        4: "👻", // Lady Geist
        6: "🛡️", // Abrams
        7: "💨", // Wraith
        8: "🔧", // McGinnis
        10: "⏰", // Paradox
        11: "🌪️", // Dynamo
        12: "❄️", // Kelvin
        13: "🌸", // Haze
        14: "⭐", // Holliday
        15: "🤖", // Bebop
        16: "🐱", // Calico
        17: "🎯", // Grey Talon
        18: "🦀", // Mo & Krill
        19: "🗡️", // Shiv
        20: "🌿", // Ivy
        21: "⚔️", // Kali
        25: "🛡️", // Warden
        27: "🗾", // Yamato
        31: "🪢", // Lash
        35: "🫧", // Viscous
        50: "💰", // Pocket
        52: "🌀", // Mirage
        58: "🐍", // Vyper
        63: "🦇", // Mina (vampire bat)
        64: "🌊", // Drifter
        66: "🧪", // Frank (Victor)
        67: "📚", // Bookworm (Paige)
        69: "🚪", // Doorman
        72: "🐐", // Billy (punkgoat)
    };
    return emojiMap[heroId] || "🦸";
}

// Debug function to test hero image mapping
function testHeroImages() {
    if (!window.apiService) {
        window.apiService = new window.DeadlockAPIService();
    }
    
    console.log('Testing hero image mapping...');
    const imageMap = window.apiService.getHeroImageMap();
    console.log('Hero image map:', imageMap);
    
    // Test specific heroes that had issues
    console.log('Abrams (ID 6):', imageMap[6]);
    console.log('Grey Talon (ID 17):', imageMap[17]);
    
    return imageMap;
}

// Make the test function globally available
window.testHeroImages = testHeroImages;

async function displayMatchAnalysis(matchData, matchId, apiService) {
    const results = document.getElementById('matchResults');
    const matchInfo = matchData.match_info;
    const players = matchInfo.players || [];
    const playersSummary = matchData.playersSummary || []; // Steam names are here
    
    // Get hero image mapping for real hero icons (static mapping, no API call needed)
    console.log('apiService object:', apiService);
    console.log('apiService methods:', Object.getOwnPropertyNames(apiService));
    
    let heroImageMap = {};
    if (apiService && typeof apiService.getHeroImageMap === 'function') {
        heroImageMap = apiService.getHeroImageMap();
        console.log('Hero image map loaded:', Object.keys(heroImageMap).length, 'heroes');
    } else {
        console.warn('getHeroImageMap method not available, using fallback');
        // Fallback to window.getHeroThumbnailUrl if available
        heroImageMap = {};
    }
    
    // Calculate match statistics
    const matchDuration = Math.floor(matchInfo.duration_s / 60); // Convert to minutes
    const winningTeam = matchInfo.winning_team;
    
    // Create a map of account_id to Steam names for quick lookup
    const steamNameMap = new Map();
    playersSummary.forEach(p => {
        steamNameMap.set(p.accountId, {
            displayName: p.displayName || p.steamName || `Player ${p.accountId}`,
            steamAvatarUrl: p.steamAvatarUrl
        });
    });
    
    // Separate teams based on player_slot (1-6 = team 0, 7-12 = team 1)
    const team1 = players.filter(p => p.player_slot <= 6);
    const team2 = players.filter(p => p.player_slot > 6);
    
    let html = `
        <div class="result-item">
            <h3>🎮 Match Analysis</h3>
            <div class="match-header">
                <span class="match-id">Match ID: ${matchId}</span>
                <span class="match-duration">🕐 ${matchDuration} minutes</span>
                <span class="winning-team">🏆 Team ${winningTeam + 1} Victory</span>
            </div>
        </div>
    `;
    
    // Generate team HTML separately for parallel display
    const teamHtmls = [];
    
    [team1, team2].forEach((team, teamIndex) => {
        const isWinning = teamIndex === winningTeam;
        
        // Calculate team totals
        const teamKills = team.reduce((sum, p) => {
            const finalStats = p.stats && p.stats.length > 0 ? p.stats[p.stats.length - 1] : p;
            return sum + (finalStats.kills || p.kills || 0);
        }, 0);
        const teamDeaths = team.reduce((sum, p) => {
            const finalStats = p.stats && p.stats.length > 0 ? p.stats[p.stats.length - 1] : p;
            return sum + (finalStats.deaths || p.deaths || 0);
        }, 0);
        const teamNetWorth = team.reduce((sum, p) => {
            const finalStats = p.stats && p.stats.length > 0 ? p.stats[p.stats.length - 1] : p;
            return sum + (finalStats.net_worth || p.net_worth || 0);
        }, 0);
        
        let teamHtml = `
            <div class="result-item team-section ${isWinning ? 'winning-team' : 'losing-team'}">
                <div class="team-header">
                    <h4>${isWinning ? '👑' : '💀'} Team ${teamIndex + 1} ${isWinning ? '(Victory)' : '(Defeat)'}</h4>
                    <div class="team-summary">
                        <span class="team-stat">${teamKills} Kills</span>
                        <span class="team-stat">${teamDeaths} Deaths</span>
                        <span class="team-stat">${Math.floor(teamNetWorth / 1000)}k Net Worth</span>
                    </div>
                </div>
                <div class="team-stats">
        `;
        
        team.forEach(player => {
            // Get final stats (last entry in stats array or player object directly)
            const finalStats = player.stats && player.stats.length > 0 
                ? player.stats[player.stats.length - 1] 
                : player;
            
            const kills = finalStats.kills || player.kills || 0;
            const deaths = finalStats.deaths || player.deaths || 0;
            const assists = finalStats.assists || player.assists || 0;
            const netWorth = finalStats.net_worth || player.net_worth || 0;
            const level = finalStats.level || player.level || 1;
            const lastHits = finalStats.creep_kills || player.last_hits || 0;
            
            const kda = `${kills}/${deaths}/${assists}`;
            const kdRatio = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
            
            // Get hero name from mapping
            const heroName = window.getHeroName ? window.getHeroName(player.hero_id) : `Hero ${player.hero_id}`;
            
            // Get Steam username from our Steam name map
            const steamData = steamNameMap.get(player.account_id);
            const playerName = steamData ? steamData.displayName : `Player ${player.account_id}`;
            const steamAvatar = steamData ? steamData.steamAvatarUrl : null;
            
            // Get real hero image URL
            const heroImageUrl = heroImageMap[player.hero_id];
            const heroEmoji = getHeroEmoji(player.hero_id); // Fallback emoji
            
            teamHtml += `
                <div class="player-row">
                    <div class="player-hero">
                        ${heroImageUrl ? 
                            `<img src="${heroImageUrl}" alt="${heroName}" class="hero-icon" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
                             <div class="hero-icon-wrapper hero-fallback" style="display: none;">
                                 <span class="hero-emoji">${heroEmoji}</span>
                             </div>` :
                            `<div class="hero-icon-wrapper">
                                 <span class="hero-emoji">${heroEmoji}</span>
                             </div>`
                        }
                        <div class="hero-details">
                            <span class="player-name">${playerName}</span>
                            <span class="hero-name">${heroName}</span>
                            <span class="player-meta">Level ${level}</span>
                        </div>
                    </div>
                    <div class="player-stats">
                        <div class="stat-item">
                            <span class="stat-label">K/D/A</span>
                            <span class="kda">${kda}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">K/D</span>
                            <span class="kd-ratio">${kdRatio}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Net Worth</span>
                            <span class="net-worth">${Math.floor(netWorth / 1000)}k</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        teamHtml += `
                </div>
            </div>
        `;
        
        teamHtmls.push(teamHtml);
    });
    
    // Add mobile toggle bar and wrap both teams in parallel container
    html += `
        <div class="mobile-team-toggle">
            <button class="team-toggle-btn active" data-team="0">
                ${winningTeam === 0 ? '👑' : '💀'} Team 1 ${winningTeam === 0 ? '(Victory)' : '(Defeat)'}
            </button>
            <button class="team-toggle-btn" data-team="1">
                ${winningTeam === 1 ? '👑' : '💀'} Team 2 ${winningTeam === 1 ? '(Victory)' : '(Defeat)'}
            </button>
        </div>
        <div class="teams-container">
            <div class="team-wrapper" data-team="0">
                ${teamHtmls[0]}
            </div>
            <div class="team-wrapper" data-team="1">
                ${teamHtmls[1]}
            </div>
        </div>
    `;
    
    results.innerHTML = html;
    
    // Initialize mobile team toggle functionality
    setupMobileTeamToggle();
}

function setupMobileTeamToggle() {
    const toggleButtons = document.querySelectorAll('.team-toggle-btn');
    const teamWrappers = document.querySelectorAll('.team-wrapper');
    
    if (toggleButtons.length === 0) return; // No toggle buttons found
    
    // Set initial state - show team 0 on mobile
    if (window.innerWidth <= 768) {
        teamWrappers.forEach((wrapper, index) => {
            wrapper.classList.toggle('active', index === 0);
        });
    }
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const teamIndex = parseInt(this.dataset.team);
            
            // Update button states
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update team visibility
            teamWrappers.forEach((wrapper, index) => {
                wrapper.classList.toggle('active', index === teamIndex);
            });
        });
    });
}

// Show menu on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !menuVisible) {
        showMenu();
    }
});

// Initialize - start with menu visible
document.addEventListener('DOMContentLoaded', function() {
    // Don't hide body overflow to allow page scrolling
    
    // Mobile-specific optimizations
    if (window.innerWidth <= 768) {
        // Prevent double-tap zoom on buttons and form elements
        document.addEventListener('touchend', function(e) {
            if (e.target.matches('button, .btn, input, select')) {
                e.preventDefault();
                e.target.click();
            }
        });
        
        // Improve scroll performance
        document.addEventListener('touchstart', function() {}, {passive: true});
        document.addEventListener('touchmove', function() {}, {passive: true});
        
        // Handle viewport changes (address bar hide/show)
        let viewportHeight = window.innerHeight;
        const updateViewportHeight = () => {
            const currentHeight = window.innerHeight;
            if (Math.abs(currentHeight - viewportHeight) > 100) {
                viewportHeight = currentHeight;
                document.documentElement.style.setProperty('--viewport-height', `${currentHeight}px`);
            }
        };
        
        window.addEventListener('resize', updateViewportHeight);
        window.addEventListener('orientationchange', updateViewportHeight);
        updateViewportHeight();
    }
});

// Expose functions to window for inline onclick handlers
window.searchMatch = searchMatch;
window.searchMatchWithId = searchMatchWithId;
window.showMenu = showMenu;

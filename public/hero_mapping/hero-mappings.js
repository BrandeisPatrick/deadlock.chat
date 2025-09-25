/**
 * Deadlock Hero Mappings
 * Generated from official API data
 * Last updated: 2025-08-31 (Added new heroes: Drifter, Billy, Mina, Paige/Bookworm, Victor/Frank, Doorman)
 * 
 * This file contains all hero mappings including:
 * - Display names to slugs (for asset URLs)
 * - IDs to display names
 * - IDs to class names
 * - Complete hero data
 */

// Display Name to Slug Mapping (e.g., "Abrams" -> "atlas")
const HERO_DISPLAY_TO_SLUG = {
    "Infernus": "inferno",
    "Seven": "gigawatt",
    "Vindicta": "hornet",
    "Lady Geist": "ghost",
    "Abrams": "atlas",
    "Wraith": "wraith",
    "McGinnis": "forge",
    "Paradox": "chrono",
    "Dynamo": "dynamo",
    "Kelvin": "kelvin",
    "Haze": "haze",
    "Holliday": "astro",
    "Bebop": "bebop",
    "Calico": "nano",
    "Grey Talon": "orion",
    "Mo & Krill": "krill",
    "Shiv": "shiv",
    "Ivy": "tengu",
    "Kali": "kali",
    "Warden": "warden",
    "Yamato": "yamato",
    "Lash": "lash",
    "Viscous": "viscous",
    "Gunslinger": "gunslinger",
    "The Boss": "yakuza",
    "Tokamak": "tokamak",
    "Wrecker": "wrecker",
    "Rutger": "rutger",
    "Pocket": "synth",
    "Thumper": "thumper",
    "Mirage": "mirage",
    "Fathom": "slork",
    "Cadence": "cadence",
    "Bomber": "bomber",
    "Shield Guy": "shieldguy",
    "Vyper": "kali",
    "Vandal": "vandal",
    "Sinclair": "magician",
    "Trapper": "trapper",
    "Raven": "operative",
    "Mina": "vampirebat",
    "Drifter": "drifter",
    "Priest": "priest",
    "Frank": "frank",
    "Bookworm": "bookworm",
    "Boho": "boho",
    "Doorman": "doorman",
    "Skyrunner": "skyrunner",
    "Swan": "swan",
    "Billy": "punkgoat"
};

// Slug to Display Name Mapping (e.g., "atlas" -> "Abrams")
const HERO_SLUG_TO_DISPLAY = {
    "inferno": "Infernus",
    "gigawatt": "Seven",
    "hornet": "Vindicta",
    "ghost": "Lady Geist",
    "atlas": "Abrams",
    "wraith": "Wraith",
    "forge": "McGinnis",
    "chrono": "Paradox",
    "dynamo": "Dynamo",
    "kelvin": "Kelvin",
    "haze": "Haze",
    "astro": "Holliday",
    "bebop": "Bebop",
    "nano": "Calico",
    "orion": "Grey Talon",
    "krill": "Mo & Krill",
    "shiv": "Shiv",
    "tengu": "Ivy",
    "kali": "Kali",
    "warden": "Warden",
    "yamato": "Yamato",
    "lash": "Lash",
    "viscous": "Viscous",
    "gunslinger": "Gunslinger",
    "yakuza": "The Boss",
    "tokamak": "Tokamak",
    "wrecker": "Wrecker",
    "rutger": "Rutger",
    "synth": "Pocket",
    "thumper": "Thumper",
    "mirage": "Mirage",
    "slork": "Fathom",
    "cadence": "Cadence",
    "bomber": "Bomber",
    "shieldguy": "Shield Guy",
    "vandal": "Vandal",
    "magician": "Sinclair",
    "trapper": "Trapper",
    "operative": "Raven",
    "vampirebat": "Mina",
    "drifter": "Drifter",
    "priest": "Priest",
    "frank": "Frank",
    "bookworm": "Bookworm",
    "boho": "Boho",
    "doorman": "Doorman",
    "skyrunner": "Skyrunner",
    "swan": "Swan",
    "punkgoat": "Billy"
};

// ID to Display Name Mapping
const HERO_ID_TO_NAME = {
    1: "Infernus",
    2: "Seven",
    3: "Vindicta",
    4: "Lady Geist",
    6: "Abrams",
    7: "Wraith",
    8: "McGinnis",
    10: "Paradox",
    11: "Dynamo",
    12: "Kelvin",
    13: "Haze",
    14: "Holliday",
    15: "Bebop",
    16: "Calico",
    17: "Grey Talon",
    18: "Mo & Krill",
    19: "Shiv",
    20: "Ivy",
    21: "Kali",
    25: "Warden",
    27: "Yamato",
    31: "Lash",
    35: "Viscous",
    38: "Gunslinger",
    39: "The Boss",
    47: "Tokamak",
    48: "Wrecker",
    49: "Rutger",
    50: "Pocket",
    51: "Thumper",
    52: "Mirage",
    53: "Fathom",
    54: "Cadence",
    56: "Bomber",
    57: "Shield Guy",
    58: "Vyper",
    59: "Vandal",
    60: "Sinclair",
    61: "Trapper",
    62: "Raven",
    63: "Mina",
    64: "Drifter",
    65: "Priest",
    66: "Frank",
    67: "Bookworm",
    68: "Boho",
    69: "Doorman",
    70: "Skyrunner",
    71: "Swan",
    72: "Billy"
};

// ID to Class Name Mapping
const HERO_ID_TO_CLASS = {
    1: "hero_inferno",
    2: "hero_gigawatt",
    3: "hero_hornet",
    4: "hero_ghost",
    6: "hero_atlas",
    7: "hero_wraith",
    8: "hero_forge",
    10: "hero_chrono",
    11: "hero_dynamo",
    12: "hero_kelvin",
    13: "hero_haze",
    14: "hero_astro",
    15: "hero_bebop",
    16: "hero_nano",
    17: "hero_orion",
    18: "hero_krill",
    19: "hero_shiv",
    20: "hero_tengu",
    21: "hero_kali",
    25: "hero_warden",
    27: "hero_yamato",
    31: "hero_lash",
    35: "hero_viscous",
    38: "hero_gunslinger",
    39: "hero_yakuza",
    47: "hero_tokamak",
    48: "hero_wrecker",
    49: "hero_rutger",
    50: "hero_synth",
    51: "hero_thumper",
    52: "hero_mirage",
    53: "hero_slork",
    54: "hero_cadence",
    56: "hero_bomber",
    57: "hero_shieldguy",
    58: "hero_kali",
    59: "hero_vandal",
    60: "hero_magician",
    61: "hero_trapper",
    62: "hero_operative",
    63: "hero_vampirebat",
    64: "hero_drifter",
    65: "hero_priest",
    66: "hero_frank",
    67: "hero_bookworm",
    68: "hero_boho",
    69: "hero_doorman",
    70: "hero_skyrunner",
    71: "hero_swan",
    72: "hero_punkgoat"
};

// Hero color themes for visual distinction
const HERO_COLORS = {
    1: "#FF4500", // Infernus - Red Orange
    2: "#ADFF2F", // Seven - Green Yellow  
    3: "#800080", // Vindicta - Purple
    4: "#8A2BE2", // Lady Geist - Blue Violet
    6: "#8B4513", // Abrams - Brown
    7: "#191970", // Wraith - Midnight Blue
    8: "#B8860B", // McGinnis - Dark Goldenrod
    10: "#00CED1", // Paradox - Dark Turquoise
    11: "#FF1493", // Dynamo - Deep Pink
    12: "#00BFFF", // Kelvin - Deep Sky Blue
    13: "#696969", // Haze - Dim Gray
    14: "#FFD700", // Holliday - Gold
    15: "#FF69B4", // Bebop - Hot Pink
    16: "#F0E68C", // Calico - Khaki
    17: "#32CD32", // Grey Talon - Lime Green
    18: "#4B0082", // Mo & Krill - Indigo
    19: "#DC143C", // Shiv - Crimson
    20: "#228B22", // Ivy - Forest Green
    21: "#8B008B", // Kali - Dark Magenta
    25: "#2F4F4F", // Warden - Dark Slate Gray
    27: "#FF6347", // Yamato - Tomato
    31: "#9370DB", // Lash - Medium Purple
    35: "#00FA9A", // Viscous - Medium Spring Green
    38: "#CD853F", // Gunslinger - Peru
    39: "#8B0000", // The Boss - Dark Red
    47: "#00FF7F", // Tokamak - Spring Green
    48: "#A0522D", // Wrecker - Sienna
    49: "#483D8B", // Rutger - Dark Slate Blue
    50: "#FF00FF", // Pocket - Magenta
    51: "#D2691E", // Thumper - Chocolate
    52: "#7B68EE", // Mirage - Medium Slate Blue
    53: "#20B2AA", // Fathom - Light Sea Green
    54: "#DA70D6", // Cadence - Orchid
    56: "#FF8C00", // Bomber - Dark Orange
    57: "#4682B4", // Shield Guy - Steel Blue
    58: "#9400D3", // Vyper - Violet
    59: "#B22222", // Vandal - Fire Brick
    60: "#6A5ACD", // Sinclair - Slate Blue
    61: "#8B4513", // Trapper - Saddle Brown
    62: "#2F4F4F", // Raven - Dark Slate Gray
    63: "#800000", // Mina - Maroon
    64: "#708090", // Drifter - Slate Gray
    65: "#F0F8FF", // Priest - Alice Blue
    66: "#556B2F", // Frank - Dark Olive Green
    67: "#8B7355", // Bookworm - Burlywood
    68: "#FF1493", // Boho - Deep Pink
    69: "#696969", // Doorman - Dim Gray
    70: "#87CEEB", // Skyrunner - Sky Blue
    71: "#FFF0F5", // Swan - Lavender Blush
    72: "#FF69B4"  // Billy - Hot Pink
};

// List of currently playable heroes (as of latest update)
// This can be used to filter out unreleased/test heroes
const PLAYABLE_HERO_IDS = [
    1,  // Infernus
    2,  // Seven
    3,  // Vindicta
    4,  // Lady Geist
    6,  // Abrams
    7,  // Wraith
    8,  // McGinnis
    10, // Paradox
    11, // Dynamo
    12, // Kelvin
    13, // Haze
    14, // Holliday
    15, // Bebop
    17, // Grey Talon
    18, // Mo & Krill
    19, // Shiv
    20, // Ivy
    25, // Warden
    27, // Yamato
    31, // Lash
    35, // Viscous
    50, // Pocket
    52, // Mirage
    58, // Vyper
    63, // Mina
    64, // Drifter  
    66, // Frank (Victor)
    67, // Bookworm (Paige)
    69, // Doorman
    72  // Billy
];

/**
 * Get hero slug from display name
 * @param {string} displayName - Hero display name (e.g., "Abrams")
 * @returns {string|null} - Hero slug (e.g., "atlas") or null if not found
 */
function getHeroSlug(displayName) {
    return HERO_DISPLAY_TO_SLUG[displayName] || null;
}

/**
 * Get hero display name from ID
 * @param {number} heroId - Hero ID
 * @returns {string} - Hero display name or "Unknown Hero"
 */
function getHeroName(heroId) {
    return HERO_ID_TO_NAME[heroId] || `Hero ${heroId}`;
}

/**
 * Get hero class name from ID
 * @param {number} heroId - Hero ID
 * @returns {string|null} - Hero class name or null
 */
function getHeroClassName(heroId) {
    return HERO_ID_TO_CLASS[heroId] || null;
}

/**
 * Get hero color from ID
 * @param {number} heroId - Hero ID
 * @returns {string} - Hero color hex code
 */
function getHeroColor(heroId) {
    return HERO_COLORS[heroId] || '#6b7280'; // Default gray
}

/**
 * Check if a hero is currently playable
 * @param {number} heroId - Hero ID
 * @returns {boolean} - True if hero is playable
 */
function isHeroPlayable(heroId) {
    return PLAYABLE_HERO_IDS.includes(heroId);
}

/**
 * Get hero image URL from hero ID using the assets-bucket endpoint
 * @param {number} heroId - Hero ID
 * @returns {string|null} - Hero image URL or null if not found
 */
function getHeroImageUrl(heroId) {
    const heroName = getHeroName(heroId);
    if (!heroName || heroName.startsWith('Hero ')) {
        return null; // Hero not found
    }

    // Get the slug from the display name
    const slug = getHeroSlug(heroName);
    if (!slug) {
        return null; // Slug not found
    }

    return `https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/${slug}_mm.webp`;
}

/**
 * Get hero image URL from hero name using the assets-bucket endpoint
 * @param {string} heroName - Hero display name (e.g., "Sinclair")
 * @returns {string|null} - Hero image URL or null if not found
 */
function getHeroImageUrlByName(heroName) {
    const slug = getHeroSlug(heroName);
    if (!slug) {
        return null; // Slug not found
    }

    return `https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/${slug}_mm.webp`;
}

// Make all functions and constants globally available
window.HERO_DISPLAY_TO_SLUG = HERO_DISPLAY_TO_SLUG;
window.HERO_SLUG_TO_DISPLAY = HERO_SLUG_TO_DISPLAY;
window.HERO_ID_TO_NAME = HERO_ID_TO_NAME;
window.HERO_ID_TO_CLASS = HERO_ID_TO_CLASS;
window.HERO_COLORS = HERO_COLORS;
window.PLAYABLE_HERO_IDS = PLAYABLE_HERO_IDS;
window.getHeroSlug = getHeroSlug;
window.getHeroName = getHeroName;
window.getHeroClassName = getHeroClassName;
window.getHeroColor = getHeroColor;
window.isHeroPlayable = isHeroPlayable;
window.getHeroImageUrl = getHeroImageUrl;
window.getHeroImageUrlByName = getHeroImageUrlByName;
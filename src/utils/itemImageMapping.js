// Item Image Mapping Utilities
// Handles all logic for generating optimized image URLs and fallbacks

// Manual name mappings for items with different image names
export const IMAGE_NAME_EXCEPTIONS = {
    'Extended Magazine': 'basic_magazine',
    'Compress Cooldown': 'improved_cooldown',
    'Spellslinger': 'spell_slinger'
};

// Proper game category mappings based on actual item locations
export const ITEM_CATEGORIES = {
    // WEAPON ITEMS (damage, fire rate, ammo, bullets)
    'monster rounds': 'weapon',
    'hollow point': 'weapon',
    'slowing bullets': 'weapon',
    'tesla bullets': 'weapon',
    'spirit shredder bullets': 'weapon',
    'mystic shot': 'weapon',
    'spirit rend': 'weapon',
    'sekhmet\'s spirit': 'weapon',
    'headshot booster': 'weapon',
    'point blank': 'weapon',
    'close quarters': 'weapon',
    'long range': 'weapon',
    'pristine emblem': 'weapon',
    'basic magazine': 'weapon',
    'burst fire': 'weapon',
    'kinetic dash': 'weapon',
    'shadow weave': 'weapon',
    'slowing hex': 'spirit',
    'silencer': 'weapon',
    'active reload': 'weapon',
    'backstabber': 'weapon',
    'blood tribute': 'weapon',
    'express shot': 'weapon',
    'spellslinger': 'weapon',
    'cultist sacrifice': 'weapon',
    
    // VITALITY ITEMS (health, armor, healing, survivability)
    'phantom strike': 'vitality',
    'vampiric burst': 'vitality',
    'enchanter\'s emblem': 'vitality',  // Exception: mods_tech but vitality in game
    'spirit resilience': 'vitality',
    'extra health': 'vitality',
    'toughness': 'vitality',
    'bullet armor': 'vitality',
    'spirit armor': 'vitality',
    'healing rite': 'vitality',
    'health nova': 'vitality',
    'lifestrike': 'vitality',
    'leech': 'vitality',
    'fortitude': 'vitality',
    'divine barrier': 'vitality',
    'enduring spirit': 'vitality',
    'restoration shot': 'vitality',
    'return fire': 'vitality',
    'reactive barrier': 'vitality',
    'debuff remover': 'vitality',
    'rescue beam': 'vitality',
    'metal skin': 'vitality',
    'colossus': 'vitality',
    'spellbreaker': 'vitality',  // Anti-magic vitality item
    'juggernaut': 'vitality',    // Tank vitality item
    'counterspell': 'vitality',  // Another anti-magic vitality item
    'healbane': 'vitality',      // Healing reduction item (API says vitality despite mods_tech path)
    
    // SPIRIT ITEMS (ability power, cooldowns, spirit)
    'mystic burst': 'spirit',
    'improved cooldown': 'spirit',
    'superior cooldown': 'spirit',
    'transcendent cooldown': 'spirit',
    'boundless spirit': 'spirit',
    'mystic reach': 'spirit',
    'quicksilver reload': 'spirit',
    'surge of power': 'spirit',
    'diviner\'s kevlar': 'spirit',
    'torment pulse': 'spirit',
    'knockdown': 'spirit',
    'compress cooldown': 'spirit',
    'mercurial magnum': 'spirit',  // Spirit item (API says spirit despite mods_weapon path)
};

// Items that don't exist in /items/ endpoint - fallback to API images only
export const ITEMS_WITHOUT_OPTIMIZED_IMAGES = new Set([
    'bullet armor',  // Still needs mapping
    'weapon_upgrade_t1',
    'weapon_upgrade_t2', 
    'weapon_upgrade_t3',
    'weapon_upgrade_t4',
    'weapon_upgrade_t5',
    'upgrade_clip_size_fixed_t3',
    'upgrade_clip_size_2',
    'upgrade_clip_size_3',
    'transcendence'  // Different from 'transcendent cooldown'
]);

/**
 * Convert item name to snake_case for URL generation
 */
export function toSnakeCase(str) {
    return str
        .toLowerCase()
        .replace(/'/g, '') // Remove apostrophes completely
        .replace(/[^a-z0-9]+/g, '_') // Replace other non-alphanumeric with underscores
        .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
}

/**
 * Get the correct image name for an item, checking exceptions first
 */
export function getItemImageName(itemName) {
    // Check for manual exceptions first
    if (IMAGE_NAME_EXCEPTIONS[itemName]) {
        return IMAGE_NAME_EXCEPTIONS[itemName];
    }
    // Otherwise use normal snake_case conversion
    return toSnakeCase(itemName);
}

/**
 * Determine item category for image URL generation
 */
export function determineItemCategory(item) {
    const nameLower = item.name.toLowerCase();
    
    // First check our known mappings
    if (ITEM_CATEGORIES[nameLower]) {
        return ITEM_CATEGORIES[nameLower];
    }
    
    // For items not in our mapping, try to determine from the API image path
    if (item.image) {
        if (item.image.includes('/mods_weapon/')) {
            return 'weapon';
        }
        if (item.image.includes('/mods_armor/')) {
            return 'vitality';
        }
        if (item.image.includes('/mods_tech/')) {
            // Tech mods are usually spirit, but check for exceptions
            if (nameLower.includes('armor') || nameLower.includes('health') || 
                nameLower.includes('resilience') || nameLower.includes('emblem')) {
                return 'vitality';
            }
            return 'spirit';
        }
        if (item.image.includes('/mods_utility/')) {
            // Utility is mixed - try to guess based on name
            if (nameLower.includes('health') || nameLower.includes('armor')) {
                return 'vitality';
            }
            if (nameLower.includes('cooldown') || nameLower.includes('spirit')) {
                return 'spirit';
            }
            return 'weapon'; // Default utility to weapon
        }
    }
    
    // Last resort: guess based on name patterns
    if (nameLower.includes('bullet') || nameLower.includes('shot') || 
        nameLower.includes('rounds') || nameLower.includes('ammo')) {
        return 'weapon';
    }
    if (nameLower.includes('health') || nameLower.includes('armor') || 
        nameLower.includes('healing')) {
        return 'vitality';
    }
    if (nameLower.includes('cooldown') || nameLower.includes('spirit') || 
        nameLower.includes('magic')) {
        return 'spirit';
    }
    
    return 'weapon'; // Default fallback
}

/**
 * Generate optimized image URL for an item with fallback
 */
export function generateItemImageUrl(item) {
    // Generate the correct image name (with exceptions handled)
    const snakeName = getItemImageName(item.name);
    const nameLower = item.name.toLowerCase();
    
    // Check if this item should skip optimized images entirely
    if (ITEMS_WITHOUT_OPTIMIZED_IMAGES.has(nameLower)) {
        return {
            primary: item.image || null,
            fallback: item.image || null,
            status: 'fallback_only'
        };
    }
    
    // Use the API's item_slot_type if available, otherwise determine category
    const category = item.item_slot_type || determineItemCategory(item);
    
    // Build the optimized URL
    const optimizedUrl = `https://assets-bucket.deadlock-api.com/assets-api-res/images/items/${category}/${snakeName}_sm.png`;
    
    // Return URLs with fallback
    return {
        primary: optimizedUrl,
        fallback: item.image || null,
        status: 'optimized',
        category: category,
        imageName: snakeName
    };
}
// Item Statistics Module - Refactored to use modular architecture
// This is a bridge file that imports the new modular components

import { initializeItemStats } from '../../src/components/ItemStats.js';

// Re-export the main initialization function for backward compatibility
export { initializeItemStats };
# Refactored Source Code Architecture

This directory contains the refactored, modular version of the Deadlock Analytics application.

## 🏗️ Directory Structure

```
src/
├── components/          # UI Components & Controllers
│   ├── AppController.js       # Main app navigation & lifecycle
│   ├── ItemStats.js          # Item statistics coordinator
│   └── ItemStatsTable.js     # Table rendering component
├── services/           # Data Services
│   └── ItemDataService.js    # API calls & data fetching
├── utils/              # Pure Utility Functions
│   └── itemImageMapping.js   # Image URL generation & mapping
├── config/             # Configuration
│   └── apiConfig.js          # API endpoints & settings
└── styles/             # Component Styles
    └── components.css        # Modular CSS for components
```

## 🎯 Architecture Overview

### **Separation of Concerns**
- **Components**: Handle UI rendering and user interaction
- **Services**: Manage data fetching and API communication
- **Utils**: Pure functions for data transformation
- **Config**: Centralized configuration management

### **Key Improvements**
1. **Modular Design**: Each file has a single, focused responsibility
2. **Reusable Components**: UI components can be easily reused
3. **Centralized Configuration**: All API settings in one place
4. **Better Error Handling**: Consistent error states across components
5. **Easier Testing**: Pure functions and isolated components

## 📦 Component Details

### AppController.js
- **Purpose**: Main application controller and navigation
- **Responsibilities**: Section switching, initialization lifecycle
- **Dependencies**: Component modules for each section

### ItemStats.js
- **Purpose**: Coordinates item statistics functionality
- **Responsibilities**: Data fetching, processing, component orchestration
- **Dependencies**: ItemDataService, ItemStatsTable, utilities

### ItemStatsTable.js
- **Purpose**: Renders and manages the item statistics table
- **Responsibilities**: Table rendering, filtering, sorting, user interaction
- **Dependencies**: Image mapping utilities

### ItemDataService.js
- **Purpose**: Handles all API communication for item data
- **Responsibilities**: API calls, caching, rate limiting, error handling
- **Dependencies**: API configuration

### itemImageMapping.js
- **Purpose**: Manages item image URL generation and mapping
- **Responsibilities**: Name normalization, category detection, URL generation
- **Dependencies**: None (pure utility functions)

## 🔧 Usage

### **Using the Refactored Components**

```javascript
// Initialize the entire application
import { initializeApp } from './components/AppController.js';
await initializeApp();

// Or initialize just item stats
import { initializeItemStats } from './components/ItemStats.js';
await initializeItemStats();
```

### **Using Individual Services**

```javascript
// Data service
import { ItemDataService } from './services/ItemDataService.js';
const dataService = new ItemDataService();
const items = await dataService.fetchItems();

// Image utilities
import { generateItemImageUrl } from './utils/itemImageMapping.js';
const imageUrls = generateItemImageUrl(item);
```

## 🎨 Styling

Component styles are located in `src/styles/components.css` and use CSS custom properties from the main application:

```css
/* These variables are defined in the main app */
var(--bg-primary)
var(--text-primary)
var(--accent)
var(--border)
```

## 🔄 Migration Guide

### **From Old Structure**
```javascript
// OLD: Monolithic approach
import { initializeItemStats } from './public/js/item-stats.js';

// NEW: Modular approach  
import { initializeItemStats } from './src/components/ItemStats.js';
```

### **Backward Compatibility**
The file `public/js/item-stats-refactored.js` provides a bridge to maintain backward compatibility while using the new architecture.

## 🐛 Debugging

### **Global Debug Objects**
When initialized, components expose themselves globally for debugging:

```javascript
// Available in browser console
window.app          // AppController instance
window.itemStats    // ItemStats instance
```

### **Debug Utilities**
```javascript
// Clear API cache
window.itemStats.dataService.clearCache();

// Refresh data
await window.itemStats.refresh();
```

## 📊 Performance Benefits

1. **Reduced Bundle Size**: Only load components as needed
2. **Better Caching**: Modular API service with intelligent caching
3. **Faster Development**: Hot reload works better with smaller files
4. **Memory Efficiency**: Components can be garbage collected when not in use

## 🚀 Future Enhancements

1. **TypeScript**: Add type safety to the modular structure
2. **Testing**: Unit tests for pure utility functions
3. **Bundle Optimization**: Code splitting and tree shaking
4. **Component Library**: Extract reusable components for other projects
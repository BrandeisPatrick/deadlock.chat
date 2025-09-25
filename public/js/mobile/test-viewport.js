/**
 * Test script for ViewportManager functionality
 * This can be run in the browser console to verify mobile optimization is working
 */

function testViewportManager() {
    
    // Check if ViewportManager is available
    if (typeof ViewportManager === 'undefined') {
        console.error('ViewportManager not found! Make sure the script is loaded.');
        return false;
    }
    
    // Create a test instance
    const testManager = new ViewportManager();
    
    // Test basic functionality
    
    // Test viewport change callback
    const unsubscribe = testManager.onViewportChange((viewport, previous) => {
    });
    
    // Test positioning utilities
    const positioningUtils = testManager.getPositioningUtils();
    
    // Test available viewport calculation
    const availableViewport = testManager.getAvailableViewport();
    
    
    // Clean up
    setTimeout(() => {
        unsubscribe();
    }, 1000);
    
    return true;
}

function testMobileUtils() {
    
    // Test device detection
    
    // Test safe area detection
    
    // Test utility functions
    const testElement = document.createElement('div');
    testElement.style.position = 'fixed';
    testElement.style.top = '10px';
    testElement.style.left = '10px';
    testElement.style.width = '100px';
    testElement.style.height = '100px';
    document.body.appendChild(testElement);
    
    
    // Test touch-friendly optimization
    makeTouchFriendly(testElement);
    
    // Clean up test element
    document.body.removeChild(testElement);
    
    return true;
}

function testMobileOptimization() {
    
    // Check if global instance exists
    if (window.mobileOptimization) {
        
        const viewportManager = window.mobileOptimization.getViewportManager();
        if (viewportManager) {
        }
    } else {
        console.warn('Global mobile optimization instance not found');
    }
    
    return true;
}

function runAllTests() {
    
    const tests = [
        { name: 'ViewportManager', fn: testViewportManager },
        { name: 'Mobile Utils', fn: testMobileUtils },
        { name: 'Mobile Optimization', fn: testMobileOptimization }
    ];
    
    const results = tests.map(test => {
        try {
            const result = test.fn();
            return { name: test.name, passed: result };
        } catch (error) {
            console.error(`❌ ${test.name} test failed:`, error);
            return { name: test.name, passed: false, error };
        }
    });
    
    results.forEach(result => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        if (result.error) {
            console.error('Error:', result.error);
        }
    });
    
    const passedCount = results.filter(r => r.passed).length;
    
    return results;
}

// Make test functions available globally
if (typeof window !== 'undefined') {
    window.testViewportManager = testViewportManager;
    window.testMobileUtils = testMobileUtils;
    window.testMobileOptimization = testMobileOptimization;
    window.runAllTests = runAllTests;
}

// Auto-run tests if in development mode
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Wait for mobile optimization to initialize
    window.addEventListener('mobileOptimizationReady', () => {
        setTimeout(runAllTests, 500);
    });
}
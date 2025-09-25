/**
 * Test script for MobileFormOptimizer
 * Run this in browser console to test form optimization features
 */

function testMobileFormOptimizer() {
    
    // Check if MobileFormOptimizer is available
    if (typeof MobileFormOptimizer === 'undefined') {
        console.error('❌ MobileFormOptimizer not found');
        return;
    }
    
    // Check if optimizer is initialized
    if (window.mobileFormOptimizer && window.mobileFormOptimizer.isReady()) {
    } else {
        window.testFormOptimizer = new MobileFormOptimizer();
    }
    
    const optimizer = window.mobileFormOptimizer || window.testFormOptimizer;
    
    // Test 1: Check iOS zoom prevention
    const testInput = document.querySelector('#playerSearchInput');
    if (testInput) {
        const fontSize = window.getComputedStyle(testInput).fontSize;
        
        if (parseFloat(fontSize) >= 16) {
        } else {
        }
    }
    
    // Test 2: Check touch target sizes
    const buttons = document.querySelectorAll('button, .btn');
    let touchTargetsPassed = 0;
    
    buttons.forEach((button, index) => {
        const rect = button.getBoundingClientRect();
        const minSize = 44;
        
        if (rect.width >= minSize && rect.height >= minSize) {
            touchTargetsPassed++;
        } else {
        }
    });
    
    
    // Test 3: Check dropdown positioning
    const profileButton = document.querySelector('#profileDropdownButton');
    const profileMenu = document.querySelector('#profileDropdownMenu');
    
    if (profileButton && profileMenu) {
        
        // Test dropdown opening
        profileButton.click();
        
        setTimeout(() => {
            const menuRect = profileMenu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            const isWithinViewport = 
                menuRect.left >= 0 && 
                menuRect.top >= 0 && 
                menuRect.right <= viewportWidth && 
                menuRect.bottom <= viewportHeight;
            
            if (isWithinViewport) {
            } else {
            }
            
            // Close dropdown
            profileButton.click();
        }, 100);
    } else {
    }
    
    // Test 4: Check virtual keyboard detection
    const keyboardState = optimizer.getVirtualKeyboardState();
    
    // Test 5: Check form validation
    if (testInput) {
        // Test email validation
        testInput.type = 'email';
        testInput.value = 'invalid-email';
        testInput.dispatchEvent(new Event('blur'));
        
        setTimeout(() => {
            const validationMessage = document.querySelector('.validation-message');
            if (validationMessage) {
            } else {
            }
            
            // Clean up
            testInput.type = 'text';
            testInput.value = '';
        }, 500);
    }
    
    // Test 6: Check viewport manager integration
    if (window.mobileViewportManager) {
        const viewport = window.mobileViewportManager.getCurrentViewport();
    } else {
    }
    
}

// Auto-run tests when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(testMobileFormOptimizer, 1000);
    });
} else {
    setTimeout(testMobileFormOptimizer, 1000);
}

// Make test function available globally
window.testMobileFormOptimizer = testMobileFormOptimizer;
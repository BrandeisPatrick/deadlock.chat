/**
 * Test file for UI Element Positioning System
 * Demonstrates dropdown, modal, and tooltip positioning functionality
 */

class PositioningSystemTest {
    constructor() {
        this.viewportManager = null;
        this.layoutController = null;
        this.testElements = new Map();
        
        this.init();
    }
    
    async init() {
        // Wait for dependencies to load
        await this.waitForDependencies();
        
        // Initialize managers
        this.viewportManager = new ViewportManager();
        this.layoutController = new MobileLayoutController(this.viewportManager);
        
        // Create test interface
        this.createTestInterface();
        
        // Bind events
        this.bindEvents();
        
    }
    
    async waitForDependencies() {
        const checkDependencies = () => {
            return typeof ViewportManager !== 'undefined' && 
                   typeof MobileLayoutController !== 'undefined';
        };
        
        if (checkDependencies()) return;
        
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (checkDependencies()) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }
    
    createTestInterface() {
        // Create test container
        const testContainer = document.createElement('div');
        testContainer.id = 'positioning-test-container';
        testContainer.innerHTML = `
            <div class="test-header">
                <h2>UI Element Positioning System Test</h2>
                <p>Test dropdown, modal, and tooltip positioning on different screen sizes</p>
            </div>
            
            <div class="test-section">
                <h3>Dropdown Positioning Tests</h3>
                <div class="test-buttons">
                    <button id="test-dropdown-tl" class="test-btn" data-position="top-left">
                        Top Left Dropdown
                    </button>
                    <button id="test-dropdown-tr" class="test-btn" data-position="top-right">
                        Top Right Dropdown
                    </button>
                    <button id="test-dropdown-bl" class="test-btn" data-position="bottom-left">
                        Bottom Left Dropdown
                    </button>
                    <button id="test-dropdown-br" class="test-btn" data-position="bottom-right">
                        Bottom Right Dropdown
                    </button>
                    <button id="test-dropdown-center" class="test-btn" data-position="center">
                        Center Dropdown
                    </button>
                </div>
            </div>
            
            <div class="test-section">
                <h3>Modal Positioning Tests</h3>
                <div class="test-buttons">
                    <button id="test-modal-small" class="test-btn">Small Modal</button>
                    <button id="test-modal-large" class="test-btn">Large Modal</button>
                    <button id="test-modal-content" class="test-btn">Content Modal</button>
                </div>
            </div>
            
            <div class="test-section">
                <h3>Tooltip Positioning Tests</h3>
                <div class="test-buttons">
                    <button id="test-tooltip-top" class="test-btn" data-tooltip="This tooltip should appear above the button">
                        Top Tooltip
                    </button>
                    <button id="test-tooltip-bottom" class="test-btn" data-tooltip="This tooltip should appear below the button">
                        Bottom Tooltip
                    </button>
                    <button id="test-tooltip-left" class="test-btn" data-tooltip="This tooltip should appear to the left of the button">
                        Left Tooltip
                    </button>
                    <button id="test-tooltip-right" class="test-btn" data-tooltip="This tooltip should appear to the right of the button">
                        Right Tooltip
                    </button>
                </div>
            </div>
            
            <div class="test-section">
                <h3>Edge Case Tests</h3>
                <div class="test-buttons">
                    <button id="test-edge-cases" class="test-btn">Test All Edge Cases</button>
                    <button id="test-viewport-changes" class="test-btn">Test Viewport Changes</button>
                    <button id="clear-all" class="test-btn danger">Clear All Elements</button>
                </div>
            </div>
            
            <div class="test-info">
                <h4>Test Information</h4>
                <div id="test-results"></div>
            </div>
        `;
        
        // Add styles
        testContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            max-height: 80vh;
            overflow-y: auto;
            background: var(--bg-secondary, #1a1a1a);
            border: 1px solid var(--border-color, #333);
            border-radius: 12px;
            padding: 20px;
            z-index: 2000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: var(--text-primary, #ffffff);
        `;
        
        document.body.appendChild(testContainer);
        
        // Add test styles
        this.addTestStyles();
    }
    
    addTestStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .test-header h2 {
                margin: 0 0 8px 0;
                font-size: 18px;
                color: var(--text-primary, #ffffff);
            }
            
            .test-header p {
                margin: 0 0 20px 0;
                font-size: 12px;
                color: var(--text-secondary, #888);
                line-height: 1.4;
            }
            
            .test-section {
                margin-bottom: 20px;
            }
            
            .test-section h3 {
                margin: 0 0 12px 0;
                font-size: 14px;
                color: var(--text-primary, #ffffff);
                border-bottom: 1px solid var(--border-color, #333);
                padding-bottom: 4px;
            }
            
            .test-buttons {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .test-btn {
                padding: 8px 12px;
                background: var(--bg-hover, #2a2a2a);
                border: 1px solid var(--border-color, #333);
                border-radius: 6px;
                color: var(--text-primary, #ffffff);
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.15s ease;
            }
            
            .test-btn:hover {
                background: var(--bg-active, #333);
            }
            
            .test-btn.danger {
                background: #dc3545;
                border-color: #dc3545;
            }
            
            .test-btn.danger:hover {
                background: #c82333;
            }
            
            .test-info {
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid var(--border-color, #333);
            }
            
            .test-info h4 {
                margin: 0 0 8px 0;
                font-size: 12px;
                color: var(--text-secondary, #888);
            }
            
            #test-results {
                font-size: 11px;
                color: var(--text-secondary, #888);
                line-height: 1.4;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    bindEvents() {
        // Dropdown tests
        document.getElementById('test-dropdown-tl').addEventListener('click', (e) => {
            this.testDropdown(e.target, 'top-left');
        });
        
        document.getElementById('test-dropdown-tr').addEventListener('click', (e) => {
            this.testDropdown(e.target, 'top-right');
        });
        
        document.getElementById('test-dropdown-bl').addEventListener('click', (e) => {
            this.testDropdown(e.target, 'bottom-left');
        });
        
        document.getElementById('test-dropdown-br').addEventListener('click', (e) => {
            this.testDropdown(e.target, 'bottom-right');
        });
        
        document.getElementById('test-dropdown-center').addEventListener('click', (e) => {
            this.testDropdown(e.target, 'center');
        });
        
        // Modal tests
        document.getElementById('test-modal-small').addEventListener('click', () => {
            this.testModal('small');
        });
        
        document.getElementById('test-modal-large').addEventListener('click', () => {
            this.testModal('large');
        });
        
        document.getElementById('test-modal-content').addEventListener('click', () => {
            this.testModal('content');
        });
        
        // Tooltip tests
        document.getElementById('test-tooltip-top').addEventListener('mouseenter', (e) => {
            this.testTooltip(e.target, 'top');
        });
        
        document.getElementById('test-tooltip-bottom').addEventListener('mouseenter', (e) => {
            this.testTooltip(e.target, 'bottom');
        });
        
        document.getElementById('test-tooltip-left').addEventListener('mouseenter', (e) => {
            this.testTooltip(e.target, 'left');
        });
        
        document.getElementById('test-tooltip-right').addEventListener('mouseenter', (e) => {
            this.testTooltip(e.target, 'right');
        });
        
        // Hide tooltips on mouse leave
        ['test-tooltip-top', 'test-tooltip-bottom', 'test-tooltip-left', 'test-tooltip-right'].forEach(id => {
            document.getElementById(id).addEventListener('mouseleave', (e) => {
                this.hideTooltip(e.target);
            });
        });
        
        // Edge case tests
        document.getElementById('test-edge-cases').addEventListener('click', () => {
            this.testEdgeCases();
        });
        
        document.getElementById('test-viewport-changes').addEventListener('click', () => {
            this.testViewportChanges();
        });
        
        document.getElementById('clear-all').addEventListener('click', () => {
            this.clearAllElements();
        });
    }
    
    testDropdown(trigger, position) {
        // Create dropdown element
        const dropdown = document.createElement('div');
        dropdown.className = 'test-dropdown';
        dropdown.innerHTML = `
            <div class="dropdown-item">Option 1</div>
            <div class="dropdown-item">Option 2</div>
            <div class="dropdown-item">Option 3</div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item">Settings</div>
            <div class="dropdown-item">Logout</div>
        `;
        
        document.body.appendChild(dropdown);
        
        // Position dropdown
        const result = this.layoutController.adjustDropdownPosition(dropdown, trigger);
        
        // Show dropdown
        dropdown.classList.add('show');
        
        // Store for cleanup
        this.testElements.set(`dropdown-${Date.now()}`, dropdown);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (document.contains(dropdown)) {
                dropdown.remove();
            }
        }, 3000);
        
        this.updateTestResults(`Dropdown positioned at ${position}: ${JSON.stringify(result)}`);
    }
    
    testModal(type) {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        document.body.appendChild(backdrop);
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'test-modal';
        
        let content = '';
        switch (type) {
            case 'small':
                content = `
                    <div class="modal-header">
                        <h3 class="modal-title">Small Modal</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>This is a small modal for testing positioning.</p>
                    </div>
                `;
                break;
            case 'large':
                content = `
                    <div class="modal-header">
                        <h3 class="modal-title">Large Modal</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>This is a large modal with lots of content to test positioning with different sizes.</p>
                        ${Array(20).fill('<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>').join('')}
                    </div>
                `;
                break;
            case 'content':
                content = `
                    <div class="modal-header">
                        <h3 class="modal-title">Content Modal</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <h4>Form Example</h4>
                        <form>
                            <div style="margin-bottom: 16px;">
                                <label>Name:</label>
                                <input type="text" style="width: 100%; padding: 8px; margin-top: 4px;">
                            </div>
                            <div style="margin-bottom: 16px;">
                                <label>Email:</label>
                                <input type="email" style="width: 100%; padding: 8px; margin-top: 4px;">
                            </div>
                            <div style="margin-bottom: 16px;">
                                <label>Message:</label>
                                <textarea style="width: 100%; padding: 8px; margin-top: 4px; height: 100px;"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn">Cancel</button>
                        <button class="btn btn-primary">Submit</button>
                    </div>
                `;
                break;
        }
        
        modal.innerHTML = content;
        document.body.appendChild(modal);
        
        // Position modal
        const result = this.layoutController.repositionModal(modal);
        
        // Show modal
        backdrop.classList.add('show');
        modal.classList.add('show');
        
        // Add close functionality
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                backdrop.remove();
                modal.remove();
            });
        }
        
        // Close on backdrop click
        backdrop.addEventListener('click', () => {
            backdrop.remove();
            modal.remove();
        });
        
        // Store for cleanup
        this.testElements.set(`modal-${Date.now()}`, { modal, backdrop });
        
        this.updateTestResults(`Modal (${type}) positioned: ${JSON.stringify(result)}`);
    }
    
    testTooltip(target, preferredPosition) {
        // Remove existing tooltip
        this.hideTooltip(target);
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'test-tooltip';
        tooltip.textContent = target.dataset.tooltip || 'Test tooltip';
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const options = {
            tooltipPreference: [preferredPosition, 'top', 'bottom', 'left', 'right']
        };
        const result = this.layoutController.positionTooltip(tooltip, target, options);
        
        // Show tooltip
        tooltip.classList.add('show');
        
        // Store reference on target for cleanup
        target._tooltip = tooltip;
        
        this.updateTestResults(`Tooltip positioned (${preferredPosition}): ${JSON.stringify(result)}`);
    }
    
    hideTooltip(target) {
        if (target._tooltip) {
            target._tooltip.remove();
            target._tooltip = null;
        }
    }
    
    testEdgeCases() {
        this.updateTestResults('Testing edge cases...');
        
        // Test dropdown at screen edges
        const edgePositions = [
            { top: '10px', left: '10px' },
            { top: '10px', right: '10px' },
            { bottom: '10px', left: '10px' },
            { bottom: '10px', right: '10px' }
        ];
        
        edgePositions.forEach((pos, index) => {
            setTimeout(() => {
                const trigger = document.createElement('button');
                trigger.textContent = `Edge ${index + 1}`;
                trigger.style.position = 'fixed';
                Object.assign(trigger.style, pos);
                trigger.style.zIndex = '1500';
                
                document.body.appendChild(trigger);
                
                // Test dropdown
                setTimeout(() => {
                    this.testDropdown(trigger, `edge-${index + 1}`);
                }, 100);
                
                // Cleanup
                setTimeout(() => {
                    trigger.remove();
                }, 4000);
            }, index * 1000);
        });
    }
    
    testViewportChanges() {
        this.updateTestResults('Testing viewport change handling...');
        
        // Create a modal and dropdown
        this.testModal('small');
        
        setTimeout(() => {
            const trigger = document.querySelector('#test-dropdown-center');
            this.testDropdown(trigger, 'viewport-test');
            
            // Simulate viewport change
            setTimeout(() => {
                this.layoutController.updateLayout();
                this.updateTestResults('Viewport change simulated - elements should reposition');
            }, 1000);
        }, 500);
    }
    
    clearAllElements() {
        // Remove all test elements
        this.testElements.forEach((element, key) => {
            if (element.modal && element.backdrop) {
                element.modal.remove();
                element.backdrop.remove();
            } else if (element.remove) {
                element.remove();
            }
        });
        
        this.testElements.clear();
        
        // Remove any remaining positioned elements
        document.querySelectorAll('.positioned-dropdown, .positioned-modal, .positioned-tooltip').forEach(el => {
            el.remove();
        });
        
        document.querySelectorAll('.modal-backdrop').forEach(el => {
            el.remove();
        });
        
        this.updateTestResults('All test elements cleared');
    }
    
    updateTestResults(message) {
        const results = document.getElementById('test-results');
        if (results) {
            const timestamp = new Date().toLocaleTimeString();
            results.innerHTML = `[${timestamp}] ${message}<br>${results.innerHTML}`;
            
            // Keep only last 10 messages
            const lines = results.innerHTML.split('<br>');
            if (lines.length > 10) {
                results.innerHTML = lines.slice(0, 10).join('<br>');
            }
        }
        
    }
}

// Initialize test when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PositioningSystemTest();
    });
} else {
    new PositioningSystemTest();
}

// Export for manual testing
if (typeof window !== 'undefined') {
    window.PositioningSystemTest = PositioningSystemTest;
}
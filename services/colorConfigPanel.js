/**
 * Live Color Configuration Panel
 * Creates a developer panel for real-time color editing in F12 console
 */

class ColorConfigPanel {
    constructor() {
        this.panel = null;
        this.isVisible = false;
        this.originalColors = {};
        this.init();
    }

    init() {
        // Store original colors for reset functionality
        this.storeOriginalColors();
        
        // Restore saved colors from previous session
        this.restoreSavedColors();
        
        // Add global function to window for easy console access
        window.showColorConfig = () => this.show();
        window.hideColorConfig = () => this.hide();
        window.resetColors = () => this.resetColors();
        window.clearSavedColors = () => this.clearSavedColors();
        
        // Add keyboard shortcut (Ctrl+Shift+C)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.toggle();
            }
        });

        console.log('%cColor Config Panel Loaded!', 'color: #f0d060; font-size: 16px; font-weight: bold;');
        console.log('%cUsage:', 'color: #f0d060; font-weight: bold;');
        console.log('  showColorConfig()   - Show the color panel');
        console.log('  hideColorConfig()   - Hide the color panel');
        console.log('  resetColors()       - Reset all colors to defaults');
        console.log('  clearSavedColors()  - Clear saved colors from session');
        console.log('  Ctrl+Shift+C        - Toggle panel visibility');
        console.log('%cPersistence:', 'color: #2ecc71; font-weight: bold;');
        console.log('  Colors persist across page navigation automatically!');
        console.log('  Colors are cleared when you close the browser.');
    }

    storeOriginalColors() {
        const root = document.documentElement;
        const styles = getComputedStyle(root);
        
        // Get all CSS custom properties
        const cssVars = [
            '--primary-color',
            '--background-dark',
            '--text-white',
            '--text-contrast',
            '--text-light',
            '--text-secondary',
            '--text-placeholder',
            '--accent-error',
            '--accent-success',
            '--accent-warning',
            '--bg-top',
            '--bg-middle',
            '--bg-bottom',
            '--ocean-fog-surface',
            '--ocean-fog-deep',
            '--ocean-ambient-light',
            '--ocean-directional-light',
            '--ocean-cursor-light',
            '--ocean-cursor-ambient',
            '--ocean-particle-layer-2',
            '--ocean-particle-layer-3'
        ];

        cssVars.forEach(varName => {
            this.originalColors[varName] = styles.getPropertyValue(varName).trim();
        });
    }

    // Save current colors to session storage
    saveColors() {
        const currentColors = {};
        Object.keys(this.originalColors).forEach(cssVar => {
            const currentValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
            // Only save if different from original
            if (currentValue !== this.originalColors[cssVar]) {
                currentColors[cssVar] = currentValue;
            }
        });
        
        if (Object.keys(currentColors).length > 0) {
            sessionStorage.setItem('aquarex-custom-colors', JSON.stringify(currentColors));
            console.log('%c💾 Colors saved for session!', 'color: #2ecc71; font-weight: bold;');
        }
    }

    // Restore saved colors from session storage
    restoreSavedColors() {
        try {
            const savedColors = sessionStorage.getItem('aquarex-custom-colors');
            if (savedColors) {
                const colors = JSON.parse(savedColors);
                let restoredCount = 0;
                
                Object.entries(colors).forEach(([cssVar, value]) => {
                    document.documentElement.style.setProperty(cssVar, value);
                    restoredCount++;
                });
                
                if (restoredCount > 0) {
                    console.log(`%c🎨 Restored ${restoredCount} custom colors from previous session!`, 'color: #f0d060; font-weight: bold;');
                    
                    // Update ocean background if ocean colors were restored
                    setTimeout(() => {
                        if (window.oceanBackground) {
                            window.oceanBackground.updateColors();
                        }
                    }, 100);
                }
            }
        } catch (error) {
            console.warn('Failed to restore saved colors:', error);
        }
    }

    // Clear saved colors from session storage
    clearSavedColors() {
        sessionStorage.removeItem('aquarex-custom-colors');
        console.log('%c🗑️ Saved colors cleared!', 'color: #ff9800; font-weight: bold;');
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'color-config-panel';
        panel.innerHTML = `
            <style>
                #color-config-panel {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 350px;
                    max-height: 80vh;
                    background: rgba(0, 0, 0, 0.95);
                    border: 2px solid var(--primary-color);
                    border-radius: 12px;
                    padding: 20px;
                    z-index: 10000;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    color: white;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(20px);
                    overflow-y: auto;
                    font-size: 13px;
                }

                #color-config-panel h2 {
                    margin: 0 0 15px 0;
                    color: var(--primary-color);
                    font-size: 18px;
                    text-align: center;
                    border-bottom: 2px solid var(--primary-color);
                    padding-bottom: 10px;
                }

                .color-section {
                    margin-bottom: 20px;
                }

                .color-section h3 {
                    margin: 0 0 10px 0;
                    color: var(--primary-color);
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .color-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    gap: 10px;
                }

                .color-item label {
                    flex: 1;
                    font-size: 11px;
                    color: #ccc;
                }

                .color-item input[type="color"] {
                    width: 40px;
                    height: 30px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    background: none;
                }

                .color-item input[type="text"] {
                    width: 70px;
                    height: 30px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid #444;
                    border-radius: 4px;
                    color: white;
                    text-align: center;
                    font-size: 11px;
                    font-family: monospace;
                }

                .panel-controls {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                    padding-top: 15px;
                    border-top: 1px solid #444;
                }

                .panel-controls button {
                    flex: 1;
                    padding: 8px 12px;
                    background: var(--primary-color);
                    color: var(--text-contrast);
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                    transition: all 0.2s ease;
                }

                .panel-controls button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }

                .panel-controls button.secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .close-btn {
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    background: none;
                    border: none;
                    color: var(--primary-color);
                    font-size: 20px;
                    cursor: pointer;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s ease;
                }

                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                #color-config-panel::-webkit-scrollbar {
                    width: 8px;
                }

                #color-config-panel::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }

                #color-config-panel::-webkit-scrollbar-thumb {
                    background: var(--primary-color);
                    border-radius: 4px;
                }
            </style>

            <button class="close-btn" onclick="hideColorConfig()">×</button>
            <h2>Live Color Editor</h2>
            
            <div class="color-section">
                <h3>Primary Colors</h3>
                ${this.createColorInput('--primary-color', 'Primary Color')}
                ${this.createColorInput('--background-dark', 'Background Dark')}
            </div>

            <div class="color-section">
                <h3>Text Colors</h3>
                ${this.createColorInput('--text-white', 'Text White')}
                ${this.createColorInput('--text-contrast', 'Text Contrast')}
                ${this.createColorInput('--text-light', 'Text Light')}
            </div>

            <div class="color-section">
                <h3>Accent Colors</h3>
                ${this.createColorInput('--accent-error', 'Error/Warning')}
                ${this.createColorInput('--accent-success', 'Success')}
                ${this.createColorInput('--accent-warning', 'Warning')}
            </div>

            <div class="color-section">
                <h3>Background Gradient</h3>
                ${this.createColorInput('--bg-top', 'Gradient Top')}
                ${this.createColorInput('--bg-middle', 'Gradient Middle')}
                ${this.createColorInput('--bg-bottom', 'Gradient Bottom')}
            </div>

            <div class="color-section">
                <h3>Ocean Colors</h3>
                ${this.createColorInput('--ocean-fog-surface', 'Surface Fog')}
                ${this.createColorInput('--ocean-fog-deep', 'Deep Ocean')}
                ${this.createColorInput('--ocean-ambient-light', 'Ambient Light')}
                ${this.createColorInput('--ocean-directional-light', 'Directional Light')}
                ${this.createColorInput('--ocean-particle-layer-2', 'Particles Mid')}
                ${this.createColorInput('--ocean-particle-layer-3', 'Particles Far')}
            </div>

            <div class="panel-controls">
                <button onclick="window.colorConfig.resetColors()">Reset</button>
                <button onclick="window.colorConfig.exportColors()" class="secondary">Export</button>
                <button onclick="hideColorConfig()" class="secondary">Close</button>
            </div>
        `;

        return panel;
    }

    createColorInput(cssVar, label) {
        const currentColor = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
        const hexColor = this.rgbToHex(currentColor) || currentColor;
        
        return `
            <div class="color-item">
                <label>${label}</label>
                <input type="color" value="${hexColor}" oninput="window.colorConfig.updateColor('${cssVar}', this.value)">
                <input type="text" value="${hexColor}" oninput="window.colorConfig.updateColor('${cssVar}', this.value)" placeholder="#000000">
            </div>
        `;
    }

    updateColor(cssVar, value) {
        // Update CSS variable
        document.documentElement.style.setProperty(cssVar, value);
        
        // Update both color picker and text input
        const panel = document.getElementById('color-config-panel');
        if (panel) {
            const colorInputs = panel.querySelectorAll(`input[oninput*="${cssVar}"]`);
            colorInputs.forEach(input => {
                if (input.value !== value) {
                    input.value = value;
                }
            });
        }
        
        // Update ocean background if ocean colors changed
        if (cssVar.startsWith('--ocean-') && window.oceanBackground) {
            setTimeout(() => {
                window.oceanBackground.updateColors();
            }, 50);
        }

        // Auto-save colors to session storage
        this.saveColors();

        console.log(`%c🎨 Updated ${cssVar}: ${value}`, 'color: #f0d060;');
    }

    rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb;
        
        const result = rgb.match(/\d+/g);
        if (!result || result.length < 3) return rgb;
        
        const r = parseInt(result[0]);
        const g = parseInt(result[1]);
        const b = parseInt(result[2]);
        
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    show() {
        if (this.isVisible) return;
        
        this.panel = this.createPanel();
        document.body.appendChild(this.panel);
        this.isVisible = true;
        
        // Make panel draggable
        this.makeDraggable();
        
        console.log('%c🎨 Color Config Panel Opened!', 'color: #f0d060; font-weight: bold;');
    }

    hide() {
        if (!this.isVisible || !this.panel) return;
        
        document.body.removeChild(this.panel);
        this.panel = null;
        this.isVisible = false;
        
        console.log('%c🎨 Color Config Panel Closed!', 'color: #f0d060; font-weight: bold;');
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    resetColors() {
        Object.keys(this.originalColors).forEach(cssVar => {
            document.documentElement.style.setProperty(cssVar, this.originalColors[cssVar]);
        });
        
        // Clear saved colors from session storage
        this.clearSavedColors();
        
        // Update ocean background
        if (window.oceanBackground) {
            setTimeout(() => {
                window.oceanBackground.updateColors();
            }, 50);
        }
        
        // Refresh panel if visible
        if (this.isVisible) {
            this.hide();
            setTimeout(() => this.show(), 100);
        }
        
        console.log('%c🎨 All colors reset to defaults!', 'color: #f0d060; font-weight: bold;');
    }

    exportColors() {
        const currentColors = {};
        Object.keys(this.originalColors).forEach(cssVar => {
            currentColors[cssVar] = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
        });
        
        const cssOutput = Object.entries(currentColors)
            .map(([prop, value]) => `    ${prop}: ${value};`)
            .join('\n');
        
        console.log('%c🎨 Current Color Configuration:', 'color: #f0d060; font-weight: bold; font-size: 14px;');
        console.log(`%c:root {\n${cssOutput}\n}`, 'color: #ccc; font-family: monospace; white-space: pre;');
        
        // Also copy to clipboard if available
        if (navigator.clipboard) {
            navigator.clipboard.writeText(`:root {\n${cssOutput}\n}`).then(() => {
                console.log('%c📋 CSS copied to clipboard!', 'color: #2ecc71; font-weight: bold;');
            });
        }
    }

    makeDraggable() {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        const header = this.panel.querySelector('h2');
        
        header.style.cursor = 'move';
        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === header) {
                isDragging = true;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                const panel = document.getElementById('color-config-panel');
                if (panel) {
                    panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
                }
            }
        }

        function dragEnd() {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }
    }
}

// Initialize the color config panel
window.colorConfig = new ColorConfigPanel();

// Export for use in other files
window.ColorConfigPanel = ColorConfigPanel;
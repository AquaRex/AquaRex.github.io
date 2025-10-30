// Color Configuration Menu
class ColorConfigMenu {
    constructor() {
        this.isDragging = false;
        this.currentX = 0;
        this.currentY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        
        // Store original values
        this.originalColors = {
            primary: '#aba9a2',
            secondary: '#18140c',
            accent: '#d05252'
        };
        
        this.init();
    }
    
    init() {
        this.createMenu();
        this.attachEventListeners();
        this.loadCurrentColors();
        this.addKeyboardShortcut();
    }
    
    createMenu() {
        const menu = document.createElement('div');
        menu.className = 'color-config-menu show'; // Start with 'show' class
        menu.id = 'colorConfigMenu';
        
        const isDarkMode = document.body.classList.contains('dark-mode');
        const currentMode = isDarkMode ? 'Dark Mode' : 'Light Mode';
        
        menu.innerHTML = `
            <div class="color-config-header" id="colorConfigHeader">
                <span class="color-config-title">Color Configuration</span>
                <button class="color-config-close" id="colorConfigClose">CLOSE</button>
            </div>
            
            <div class="color-config-body">
                <div class="color-config-group">
                    <label class="color-config-label">Primary Color</label>
                    <div class="color-config-input-wrapper">
                        <input type="text" class="color-config-text-input" id="primaryColorText" placeholder="#aba9a2">
                        <input type="color" class="color-config-color-input" id="primaryColorPicker">
                    </div>
                </div>
                
                <div class="color-config-group">
                    <label class="color-config-label">Secondary Color</label>
                    <div class="color-config-input-wrapper">
                        <input type="text" class="color-config-text-input" id="secondaryColorText" placeholder="#18140c">
                        <input type="color" class="color-config-color-input" id="secondaryColorPicker">
                    </div>
                </div>
                
                <div class="color-config-group">
                    <label class="color-config-label">Accent Color</label>
                    <div class="color-config-input-wrapper">
                        <input type="text" class="color-config-text-input" id="accentColorText" placeholder="#d05252">
                        <input type="color" class="color-config-color-input" id="accentColorPicker">
                    </div>
                </div>
                
                <div style="padding: 20px; border: 2px solid var(--secondary-color); margin-top: 20px; font-size: 0.65rem; letter-spacing: 1px; opacity: 0.7; line-height: 1.6;">
                    NOTE: In dark mode, Primary and Secondary colors automatically swap roles. Primary becomes background, Secondary becomes text.
                </div>
            </div>
            
            <div class="color-config-footer">
                <button class="color-config-button" id="applyColors">Apply</button>
                <button class="color-config-button reset" id="resetColors">Reset</button>
            </div>
        `;
        
        document.body.appendChild(menu);
    }
    
    addKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+C or Cmd+Shift+C to toggle menu
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                const menu = document.getElementById('colorConfigMenu');
                menu.classList.toggle('show');
                if (menu.classList.contains('show')) {
                    this.loadCurrentColors();
                }
            }
            // ESC to close menu
            if (e.key === 'Escape') {
                const menu = document.getElementById('colorConfigMenu');
                if (menu.classList.contains('show')) {
                    menu.classList.remove('show');
                }
            }
        });
    }
    
    attachEventListeners() {
        const menu = document.getElementById('colorConfigMenu');
        const header = document.getElementById('colorConfigHeader');
        const closeBtn = document.getElementById('colorConfigClose');
        const applyBtn = document.getElementById('applyColors');
        const resetBtn = document.getElementById('resetColors');
        
        // Close menu
        closeBtn.addEventListener('click', () => {
            menu.classList.remove('show');
        });
        
        // Dragging
        header.addEventListener('mousedown', (e) => this.dragStart(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.dragEnd());
        
        // Sync text and color inputs
        this.syncInputs('primaryColor', 'primaryColorText', 'primaryColorPicker');
        this.syncInputs('secondaryColor', 'secondaryColorText', 'secondaryColorPicker');
        this.syncInputs('accentColor', 'accentColorText', 'accentColorPicker');
        
        // Apply button
        applyBtn.addEventListener('click', () => this.applyColors());
        
        // Reset button
        resetBtn.addEventListener('click', () => this.resetColors());
    }
    
    syncInputs(name, textId, pickerId) {
        const textInput = document.getElementById(textId);
        const pickerInput = document.getElementById(pickerId);
        
        textInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                pickerInput.value = value;
                this.applyColorsRealtime();
            }
        });
        
        pickerInput.addEventListener('input', (e) => {
            textInput.value = e.target.value;
            this.applyColorsRealtime();
        });
    }
    
    applyColorsRealtime() {
        const root = document.documentElement;
        
        // Get values from inputs
        const light = document.getElementById('primaryColorText').value;
        const dark = document.getElementById('secondaryColorText').value;
        const accent = document.getElementById('accentColorText').value;
        
        // Apply immediately to the base color variables
        if (/^#[0-9A-Fa-f]{6}$/.test(light)) {
            root.style.setProperty('--color-light', light);
        }
        if (/^#[0-9A-Fa-f]{6}$/.test(dark)) {
            root.style.setProperty('--color-dark', dark);
        }
        if (/^#[0-9A-Fa-f]{6}$/.test(accent)) {
            root.style.setProperty('--accent-color', accent);
        }
    }
    
    loadCurrentColors() {
        const root = document.documentElement;
        
        // Get the base color values, not the assigned ones
        const lightColor = getComputedStyle(root).getPropertyValue('--color-light').trim();
        const darkColor = getComputedStyle(root).getPropertyValue('--color-dark').trim();
        const accentColor = getComputedStyle(root).getPropertyValue('--accent-color').trim();
        
        // Set values in inputs (showing light as primary, dark as secondary)
        document.getElementById('primaryColorText').value = lightColor;
        document.getElementById('primaryColorPicker').value = lightColor;
        document.getElementById('secondaryColorText').value = darkColor;
        document.getElementById('secondaryColorPicker').value = darkColor;
        document.getElementById('accentColorText').value = accentColor;
        document.getElementById('accentColorPicker').value = accentColor;
    }
    
    applyColors() {
        const root = document.documentElement;
        
        // Get values from inputs
        const light = document.getElementById('primaryColorText').value;
        const dark = document.getElementById('secondaryColorText').value;
        const accent = document.getElementById('accentColorText').value;
        
        // Update stored values
        this.originalColors.primary = light;
        this.originalColors.secondary = dark;
        this.originalColors.accent = accent;
        
        // Apply to the base color variables (already applied in realtime, but ensure it's set)
        root.style.setProperty('--color-light', light);
        root.style.setProperty('--color-dark', dark);
        root.style.setProperty('--accent-color', accent);
        
        // Save to localStorage
        localStorage.setItem('customColors', JSON.stringify(this.originalColors));
    }
    
    resetColors() {
        const root = document.documentElement;
        const defaultColors = {
            primary: '#aba9a2',
            secondary: '#18140c',
            accent: '#d05252'
        };
        
        // Reset stored values
        this.originalColors = JSON.parse(JSON.stringify(defaultColors));
        
        // Remove inline styles from base variables
        root.style.removeProperty('--color-light');
        root.style.removeProperty('--color-dark');
        root.style.removeProperty('--accent-color');
        
        // Clear localStorage
        localStorage.removeItem('customColors');
        
        // Reload current colors
        this.loadCurrentColors();
    }
    
    dragStart(e) {
        const menu = document.getElementById('colorConfigMenu');
        this.initialX = e.clientX - this.xOffset;
        this.initialY = e.clientY - this.yOffset;
        
        if (e.target === document.getElementById('colorConfigHeader') || 
            e.target.closest('#colorConfigHeader')) {
            this.isDragging = true;
        }
    }
    
    drag(e) {
        if (this.isDragging) {
            e.preventDefault();
            const menu = document.getElementById('colorConfigMenu');
            
            this.currentX = e.clientX - this.initialX;
            this.currentY = e.clientY - this.initialY;
            
            this.xOffset = this.currentX;
            this.yOffset = this.currentY;
            
            // Calculate actual position on screen
            const actualTop = 50 + this.currentY;
            const actualRight = 132 - this.currentX; // Right positioning works inversely
            
            menu.style.transform = `translate(${this.currentX}px, ${this.currentY}px)`;
            menu.style.top = '50px';
            menu.style.right = '132px';
            
            // Update position display in real-time
            const titleElement = menu.querySelector('.color-config-title');
            if (titleElement) {
                titleElement.textContent = `Color Configuration - Position: Top: ${actualTop}px, Right: ${actualRight}px`;
            }
        }
    }
    
    dragEnd() {
        this.initialX = this.currentX;
        this.initialY = this.currentY;
        this.isDragging = false;
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.colorConfigMenu = new ColorConfigMenu();
        
        // Load saved colors if they exist
        const savedColors = localStorage.getItem('customColors');
        if (savedColors) {
            const colors = JSON.parse(savedColors);
            window.colorConfigMenu.originalColors = colors;
            window.colorConfigMenu.applyColors();
        }
    });
} else {
    window.colorConfigMenu = new ColorConfigMenu();
    
    // Load saved colors if they exist
    const savedColors = localStorage.getItem('customColors');
    if (savedColors) {
        const colors = JSON.parse(savedColors);
        window.colorConfigMenu.originalColors = colors;
        window.colorConfigMenu.applyColors();
    }
}
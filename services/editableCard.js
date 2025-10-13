/**
 * Editable Card System
 * Creates a card with selection border, corner elements, and 3D rotation
 * Based on the visual style from the main page's Thomas Hetland card
 */

class EditableCard {
    constructor(options = {}) {
        // Configuration options
        this.options = {
            targetElement: options.targetElement || null,
            enableRotation: options.enableRotation !== false,
            rotationIntensity: options.rotationIntensity || 12,
            fadeInDuration: options.fadeInDuration || 800,
            cornerColor: options.cornerColor || 'var(--primary-color)',
            borderStyle: options.borderStyle || 'dotted',
            alwaysVisible: options.alwaysVisible || false,
            showSelectionHandles: options.showSelectionHandles || false,
            showGizmoOnHover: options.showGizmoOnHover !== false,
            showCornerElements: options.showCornerElements !== false, // Show dotted corner brackets
            showGizmo: options.showGizmo !== false, // Show 3D gizmo
            enableHoverGlow: options.enableHoverGlow || false, // Enable yellow glow on hover
            onRotationChange: options.onRotationChange || null
        };

        // State
        this.mouseX = 0;
        this.mouseY = 0;
        this.allowRotation = false;
        this.isInitialized = false;

        // DOM elements
        this.cornerElements = [];
        this.gizmo = null;
        
        // Store original styles for hover effects
        this.originalBoxShadow = null;
        this.originalBorder = null;

        this.init();
    }

    init() {
        if (!this.options.targetElement) {
            console.error('EditableCard: Missing required targetElement');
            return;
        }

        console.log('EditableCard: Initializing card for element:', this.options.targetElement);
        
        this.createCardFrame();
        this.setupEventListeners();
        this.startFadeInAnimation();
        this.isInitialized = true;
        console.log('EditableCard: Successfully initialized');
    }

    createCardFrame() {
        const target = this.options.targetElement;
        
        // Add the exact same styling as .brand from main page
        target.classList.add('editable-card');
        target.style.position = 'relative';
        target.style.transformStyle = 'preserve-3d';
        target.style.willChange = 'transform';
        target.style.backfaceVisibility = 'hidden';
        
        // Apply the exact same styles as .brand with !important to override project CSS
        // Ensure proper stacking context for backdrop-filter
        target.style.setProperty('isolation', 'isolate', 'important');
        target.style.setProperty('position', 'relative', 'important');
        target.style.setProperty('z-index', '10', 'important');
        
        target.style.setProperty('border', '2px solid var(--primary-border)', 'important');
        target.style.setProperty('border-radius', '8px', 'important');
        target.style.setProperty('background', 'var(--glass-background)', 'important');
        target.style.setProperty('backdrop-filter', 'blur(15px)', 'important');
        target.style.setProperty('-webkit-backdrop-filter', 'blur(15px)', 'important'); // Safari support
        // Only add transition for hover glow elements, not rotation
        if (this.options.enableHoverGlow) {
            target.style.setProperty('transition', 'box-shadow 0.3s ease, filter 0.3s ease', 'important');
        }
        const originalBoxShadow = '0 8px 32px var(--shadow-strong), 0 0 20px var(--primary-transparent-light)';
        target.style.setProperty('box-shadow', originalBoxShadow, 'important');
        
        // Store original styles for hover effects
        this.originalBoxShadow = originalBoxShadow;
        
        console.log('EditableCard: Applied styles to element:', target);
        console.log('EditableCard: backdrop-filter should be:', target.style.backdropFilter);
        console.log('EditableCard: -webkit-backdrop-filter should be:', target.style.webkitBackdropFilter);
        console.log('EditableCard: isolation should be:', target.style.isolation);
        
        // Create the exact same pseudo-elements as main page
        this.createPseudoElements();
        
        // Create corner elements (dotted) - exact same as main page
        if (this.options.showCornerElements) {
            this.createCornerElements();
        }
        
        // Create selection handles
        if (this.options.showSelectionHandles) {
            this.createSelectionHandles();
        }
        
        // Create gizmo canvas
        if (this.options.showGizmo) {
            this.createGizmoCanvas();
        }
    }

    createPseudoElements() {
        // Inject CSS for pseudo-elements - EXACT same as main page .brand
        const styleId = 'editable-card-pseudo-styles';
        if (!document.querySelector(`#${styleId}`)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .editable-card::before,
                .editable-card::after {
                    content: '';
                    position: absolute !important;
                    width: 20px !important;
                    height: 20px !important;
                    border: 3px solid var(--primary-color) !important;
                    z-index: 999 !important;
                }
                .editable-card::before {
                    top: -3px !important;
                    left: -3px !important;
                    border-right: none !important;
                    border-bottom: none !important;
                    border-top-left-radius: 8px !important;
                }
                .editable-card::after {
                    bottom: -3px !important;
                    right: -3px !important;
                    border-left: none !important;
                    border-top: none !important;
                    border-bottom-right-radius: 8px !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    createCornerElements() {
        const target = this.options.targetElement;
        const positions = ['tl', 'tr', 'bl', 'br'];
        
        console.log('EditableCard: Creating corner elements for:', target);
        
        positions.forEach(position => {
            const corner = document.createElement('div');
            corner.className = `corner-${position}`;
            
            // EXACT same styling as main page .brand .corner-*
            corner.style.position = 'absolute';
            corner.style.width = '15px';
            corner.style.height = '15px';
            corner.style.border = '2px dotted var(--primary-color)';
            corner.style.zIndex = '9999'; // Make sure corners are visible

            // Position corners - EXACT same as main page
            switch(position) {
                case 'tl':
                    corner.style.top = '-8px';
                    corner.style.left = '-8px';
                    corner.style.borderRight = 'none';
                    corner.style.borderBottom = 'none';
                    break;
                case 'tr':
                    corner.style.top = '-8px';
                    corner.style.right = '-8px';
                    corner.style.borderLeft = 'none';
                    corner.style.borderBottom = 'none';
                    break;
                case 'bl':
                    corner.style.bottom = '-8px';
                    corner.style.left = '-8px';
                    corner.style.borderRight = 'none';
                    corner.style.borderTop = 'none';
                    break;
                case 'br':
                    corner.style.bottom = '-8px';
                    corner.style.right = '-8px';
                    corner.style.borderLeft = 'none';
                    corner.style.borderTop = 'none';
                    break;
            }

            target.appendChild(corner);
            this.cornerElements.push(corner);
            console.log('EditableCard: Created corner element:', position, corner);
        });
        
        console.log('EditableCard: Total corner elements created:', this.cornerElements.length);
    }

    createSelectionHandles() {
        const target = this.options.targetElement;
        this.selectionHandles = [];
        
        // Create 8 selection handles: 4 corners + 4 edges
        const handlePositions = [
            { class: 'handle-nw', cursor: 'nw-resize', top: '-6px', left: '-6px' },
            { class: 'handle-n', cursor: 'n-resize', top: '-6px', left: '50%', transform: 'translateX(-50%)' },
            { class: 'handle-ne', cursor: 'ne-resize', top: '-6px', right: '-6px' },
            { class: 'handle-e', cursor: 'e-resize', top: '50%', right: '-6px', transform: 'translateY(-50%)' },
            { class: 'handle-se', cursor: 'se-resize', bottom: '-6px', right: '-6px' },
            { class: 'handle-s', cursor: 's-resize', bottom: '-6px', left: '50%', transform: 'translateX(-50%)' },
            { class: 'handle-sw', cursor: 'sw-resize', bottom: '-6px', left: '-6px' },
            { class: 'handle-w', cursor: 'w-resize', top: '50%', left: '-6px', transform: 'translateY(-50%)' }
        ];
        
        handlePositions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `selection-handle ${pos.class}`;
            
            // Base handle styling
            handle.style.position = 'absolute';
            handle.style.width = '12px';
            handle.style.height = '12px';
            handle.style.backgroundColor = 'var(--primary-color)';
            handle.style.border = '2px solid #000';
            handle.style.borderRadius = '2px';
            handle.style.cursor = pos.cursor;
            handle.style.zIndex = '1000';
            handle.style.opacity = '0';
            handle.style.transition = 'opacity 0.2s ease';
            handle.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
            
            // Position the handle
            if (pos.top) handle.style.top = pos.top;
            if (pos.bottom) handle.style.bottom = pos.bottom;
            if (pos.left) handle.style.left = pos.left;
            if (pos.right) handle.style.right = pos.right;
            if (pos.transform) handle.style.transform = pos.transform;
            
            target.appendChild(handle);
            this.selectionHandles.push(handle);
        });
    }

    createGizmoCanvas() {
        const target = this.options.targetElement;
        
        console.log('EditableCard: Creating gizmo canvas for:', target);
        console.log('EditableCard: showGizmoOnHover option:', this.options.showGizmoOnHover);
        
        // Create canvas exactly like main page
        this.gizmoCanvas = document.createElement('canvas');
        this.gizmoCanvas.id = `gizmoCanvas-${Math.random().toString(36).substr(2, 9)}`;
        
        // Position gizmo in top-LEFT corner
        this.gizmoCanvas.style.position = 'absolute';
        this.gizmoCanvas.style.top = '-85px';
        this.gizmoCanvas.style.left = '-85px';
        this.gizmoCanvas.style.width = '140px';
        this.gizmoCanvas.style.height = '140px';
        this.gizmoCanvas.style.pointerEvents = 'none';
        this.gizmoCanvas.style.zIndex = '9999';
        this.gizmoCanvas.style.display = 'block';
        this.gizmoCanvas.style.opacity = this.options.showGizmoOnHover ? '0' : '1';
        this.gizmoCanvas.style.transition = 'opacity 0.2s ease';
        
        target.appendChild(this.gizmoCanvas);
        
        console.log('EditableCard: Gizmo canvas created with opacity:', this.gizmoCanvas.style.opacity);
        
        // Initialize the canvas with basic gizmo drawing (can be enhanced later)
        this.initializeGizmoCanvas();
    }

    initializeGizmoCanvas() {
        const canvas = this.gizmoCanvas;
        const ctx = canvas.getContext('2d');
        canvas.width = 140;
        canvas.height = 140;
        
        // Blender-style 3D Move Gizmo
        ctx.clearRect(0, 0, 140, 140);
        
        // Position gizmo
        const centerX = 80;
        const centerY = 80;
        const axisLength = 60;
        const arrowHeadLength = 10;
        const arrowHeadWidth = 3;
        
        // Enable anti-aliasing
        ctx.imageSmoothingEnabled = true;
        ctx.lineWidth = 1.5; // Keep thin lines like Blender
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        
        // X-axis (Left - Red)
        ctx.strokeStyle = '#ff0000';
        ctx.fillStyle = '#ff0000';
        
        // X axis line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - axisLength + arrowHeadLength, centerY);
        ctx.stroke();
        
        // X arrow head (triangle)
        ctx.beginPath();
        ctx.moveTo(centerX - axisLength, centerY); // tip
        ctx.lineTo(centerX - axisLength + arrowHeadLength, centerY - arrowHeadWidth);
        ctx.lineTo(centerX - axisLength + arrowHeadLength, centerY + arrowHeadWidth);
        ctx.closePath();
        ctx.fill();
        
        // Y-axis (Up - Green)
        ctx.strokeStyle = '#00ff00';
        ctx.fillStyle = '#00ff00';
        
        // Y axis line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY - axisLength + arrowHeadLength);
        ctx.stroke();
        
        // Y arrow head (triangle)
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - axisLength); // tip
        ctx.lineTo(centerX - arrowHeadWidth, centerY - axisLength + arrowHeadLength);
        ctx.lineTo(centerX + arrowHeadWidth, centerY - axisLength + arrowHeadLength);
        ctx.closePath();
        ctx.fill();
        
        // Center origin point (blue circle)
        ctx.fillStyle = '#0080ff';
        ctx.strokeStyle = '#0080ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }

    setupEventListeners() {
        const target = this.options.targetElement;

        // Mouse movement handler
        this.handleMove = (e) => {
            // Handle both mouse and touch events
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            // Normalised mouse coordinates
            this.mouseX = (clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(clientY / window.innerHeight) * 2 + 1;

            // Apply rotation if enabled and rotation is allowed
            if (this.options.enableRotation && this.allowRotation) {
                const rect = target.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const deltaX = clientX - centerX;
                const deltaY = clientY - centerY;
                
                // Calculate aspect ratio compensation for consistent rotation feel
                const aspectRatio = window.innerWidth / window.innerHeight;
                
                // More robust aspect ratio compensation that works better on extreme aspect ratios
                const baseIntensity = this.options.rotationIntensity;
                let rotationIntensityX, rotationIntensityY;
                
                if (aspectRatio > 1) {
                    // Landscape: reduce horizontal sensitivity, increase vertical
                    rotationIntensityX = baseIntensity * Math.min(1 + (aspectRatio - 1) * 0.5, 1.5);
                    rotationIntensityY = baseIntensity;
                } else {
                    // Portrait: reduce vertical sensitivity, increase horizontal  
                    rotationIntensityX = baseIntensity;
                    rotationIntensityY = baseIntensity * Math.min(1 + (1/aspectRatio - 1) * 0.5, 1.5);
                }
                
                const rotateX = (deltaY / window.innerHeight) * rotationIntensityY;
                const rotateY = (deltaX / window.innerWidth) * rotationIntensityX;

                // Apply transform
                target.style.transform = 
                    `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;

                // Trigger callback if provided
                if (this.options.onRotationChange) {
                    this.options.onRotationChange({
                        rotateX: -rotateX,
                        rotateY: rotateY,
                        mouseX: this.mouseX,
                        mouseY: this.mouseY
                    });
                }
            }
        };

        // Mouse enter handler
        this.handleEnter = () => {
            // Show selection handles on hover
            this.selectionHandles?.forEach(handle => {
                handle.style.opacity = '1';
            });
            
            // Show gizmo if enabled
            if (this.options.showGizmoOnHover && this.gizmoCanvas) {
                this.gizmoCanvas.style.opacity = '1';
            }
            
            // Add hover glow effect if enabled
            if (this.options.enableHoverGlow) {
                const target = this.options.targetElement;
                const glowBoxShadow = `
                    0 12px 40px rgba(0, 0, 0, 0.4), 
                    0 0 25px var(--primary-glow),
                    0 0 50px var(--primary-transparent-heavy),
                    0 0 100px var(--primary-transparent-light)
                `;
                target.style.setProperty('box-shadow', glowBoxShadow, 'important');
                // Only add border glow, don't change existing border
                target.style.setProperty('filter', 'drop-shadow(0 0 10px var(--primary-glow))', 'important');
                target.style.setProperty('transform', target.style.transform + ' translateY(-2px)', 'important');
            }
        };

        // Mouse leave handler - reset rotation only
        this.handleLeave = () => {
            // Hide selection handles
            this.selectionHandles?.forEach(handle => {
                handle.style.opacity = '0';
            });
            
            // Hide gizmo if enabled
            if (this.options.showGizmoOnHover && this.gizmoCanvas) {
                this.gizmoCanvas.style.opacity = '0';
            }
            
            // Remove hover glow effect if enabled
            if (this.options.enableHoverGlow) {
                const target = this.options.targetElement;
                target.style.setProperty('box-shadow', this.originalBoxShadow, 'important');
                target.style.removeProperty('filter');
                // Remove the translateY offset by resetting the transform
                const currentTransform = target.style.transform.replace(' translateY(-2px)', '');
                target.style.setProperty('transform', currentTransform, 'important');
            }
            
            if (this.options.enableRotation) {
                target.style.transform = 
                    'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';

                if (this.options.onRotationChange) {
                    this.options.onRotationChange({
                        rotateX: 0,
                        rotateY: 0,
                        mouseX: 0,
                        mouseY: 0
                    });
                }
            }
        };

        // Add global event listeners for mouse tracking
        document.addEventListener('mousemove', this.handleMove);
        document.addEventListener('touchmove', this.handleMove, { passive: false });
        target.addEventListener('mouseenter', this.handleEnter);
        target.addEventListener('mouseleave', this.handleLeave);
        target.addEventListener('touchstart', this.handleEnter);
        document.addEventListener('touchend', this.handleLeave);
    }

    showFrame() {
        // The frame is always visible since we match main page exactly
        // No need to do anything special
    }

    hideFrame() {
        // The frame is always visible since we match main page exactly
        // No need to do anything special
    }

    startFadeInAnimation() {
        // Enable card rotation after fade-in animation completes
        setTimeout(() => {
            this.allowRotation = true;
        }, this.options.fadeInDuration);
    }

    // Public methods
    setRotation(rotateX, rotateY) {
        if (this.options.targetElement) {
            this.options.targetElement.style.transform = 
                `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
        }
    }

    reset() {
        this.setRotation(0, 0);
        this.hideFrame();
    }

    destroy() {
        const target = this.options.targetElement;
        
        if (target) {
            // Remove event listeners
            document.removeEventListener('mousemove', this.handleMove);
            document.removeEventListener('touchmove', this.handleMove);
            target.removeEventListener('mouseenter', this.handleEnter);
            target.removeEventListener('mouseleave', this.handleLeave);
            target.removeEventListener('touchstart', this.handleEnter);
            document.removeEventListener('touchend', this.handleLeave);

            // Remove corner elements
            this.cornerElements.forEach(corner => {
                if (corner.parentNode) {
                    corner.parentNode.removeChild(corner);
                }
            });

            // Remove selection handles
            this.selectionHandles?.forEach(handle => {
                if (handle.parentNode) {
                    handle.parentNode.removeChild(handle);
                }
            });

            // Remove gizmo canvas
            if (this.gizmoCanvas && this.gizmoCanvas.parentNode) {
                this.gizmoCanvas.parentNode.removeChild(this.gizmoCanvas);
            }

            // Reset styles
            target.classList.remove('editable-card');
            target.style.transform = '';
        }

        this.cornerElements = [];
        this.selectionHandles = [];
        this.gizmoCanvas = null;
        this.isInitialized = false;
    }

    // Static method to create multiple cards
    static createForElements(selector, options = {}) {
        const elements = document.querySelectorAll(selector);
        const cards = [];

        elements.forEach(element => {
            const card = new EditableCard({
                targetElement: element,
                ...options
            });
            cards.push(card);
        });

        return cards;
    }
}

// Export for use in other files
window.EditableCard = EditableCard;
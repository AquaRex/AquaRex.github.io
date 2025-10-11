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
            cornerColor: options.cornerColor || '#f0d060',
            borderStyle: options.borderStyle || 'dotted',
            alwaysVisible: options.alwaysVisible || false,
            showGizmoOnHover: options.showGizmoOnHover !== false,
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
        target.style.setProperty('border', '2px solid rgba(240, 208, 96, 0.4)', 'important');
        target.style.setProperty('border-radius', '8px', 'important');
        target.style.setProperty('background', 'rgba(255, 255, 255, 0.03)', 'important');
        target.style.setProperty('backdrop-filter', 'blur(10px)', 'important');
        target.style.setProperty('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.3)', 'important');
        
        // Create the exact same pseudo-elements as main page
        this.createPseudoElements();
        
        // Create corner elements (dotted) - exact same as main page
        this.createCornerElements();
        
        // Create gizmo canvas
        this.createGizmoCanvas();
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
                    border: 3px solid #f0d060 !important;
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
        
        positions.forEach(position => {
            const corner = document.createElement('div');
            corner.className = `corner-${position}`;
            
            // EXACT same styling as main page .brand .corner-*
            corner.style.position = 'absolute';
            corner.style.width = '15px';
            corner.style.height = '15px';
            corner.style.border = '2px dotted #f0d060';

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
        });
    }

    createGizmoCanvas() {
        const target = this.options.targetElement;
        
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
        
        target.appendChild(this.gizmoCanvas);
        
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
        ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
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

            // Apply rotation if enabled and on desktop
            if (this.options.enableRotation && window.innerWidth > 768 && this.allowRotation) {
                const rect = target.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const deltaX = clientX - centerX;
                const deltaY = clientY - centerY;
                const rotateX = (deltaY / window.innerHeight) * this.options.rotationIntensity;
                const rotateY = (deltaX / window.innerWidth) * this.options.rotationIntensity;

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
            // Frame is always visible, no need to show/hide
        };

        // Mouse leave handler - reset rotation only
        this.handleLeave = () => {
            if (this.options.enableRotation && window.innerWidth > 768) {
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
        document.addEventListener('touchmove', this.handleMove);
        target.addEventListener('mouseenter', this.handleEnter);
        target.addEventListener('mouseleave', this.handleLeave);
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
            document.removeEventListener('touchend', this.handleLeave);

            // Remove corner elements
            this.cornerElements.forEach(corner => {
                if (corner.parentNode) {
                    corner.parentNode.removeChild(corner);
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
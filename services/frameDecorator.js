/**
 * Frame Decorator System
 * Modular system for applying different visual frames/borders to elements
 */

class FrameDecorator {
    constructor(options = {}) {
        this.options = {
            enabled: options.enabled !== false,
            frameType: options.frameType || 'none', // 'none', 'editableCard', 'neonGlow', 'retro', etc.
            ...options
        };
        this.decoratedElements = new Map();
    }

    // Apply decoration to an element
    decorate(element, customOptions = {}) {
        if (!this.options.enabled || !element) return null;

        const frameOptions = { ...this.options, ...customOptions };
        const decorator = this.createDecorator(frameOptions.frameType, element, frameOptions);
        
        if (decorator) {
            this.decoratedElements.set(element, decorator);
        }
        
        return decorator;
    }

    // Create specific decorator based on type
    createDecorator(frameType, element, options) {
        switch (frameType) {
            case 'editableCard':
                return this.createEditableCardDecorator(element, options);
            case 'neonGlow':
                return this.createNeonGlowDecorator(element, options);
            case 'retro':
                return this.createRetroDecorator(element, options);
            case 'minimal':
                return this.createMinimalDecorator(element, options);
            case 'none':
            default:
                return null;
        }
    }

    // EditableCard decorator (uses existing EditableCard system)
    createEditableCardDecorator(element, options) {
        if (!window.EditableCard) {
            console.warn('EditableCard class not available');
            return null;
        }

        const cardOptions = {
            targetElement: element,
            enableRotation: options.enableRotation !== false,
            rotationIntensity: options.rotationIntensity || 8,
            fadeInDuration: options.fadeInDuration || 800,
            cornerColor: options.cornerColor || '#f0d060',
            borderStyle: options.borderStyle || 'dotted',
            alwaysVisible: options.alwaysVisible !== false,
            showGizmoOnHover: options.showGizmoOnHover !== false
        };

        try {
            return new EditableCard(cardOptions);
        } catch (error) {
            console.error('Error creating EditableCard decorator:', error);
            return null;
        }
    }

    // Neon glow decorator
    createNeonGlowDecorator(element, options) {
        const glowColor = options.glowColor || '#00ffff';
        const glowIntensity = options.glowIntensity || '20px';
        
        element.style.transition = 'all 0.3s ease';
        element.style.boxShadow = `0 0 ${glowIntensity} ${glowColor}40`;
        element.style.border = `2px solid ${glowColor}60`;
        
        const hoverHandler = () => {
            element.style.boxShadow = `0 0 ${parseInt(glowIntensity) * 1.5}px ${glowColor}80`;
            element.style.transform = 'translateY(-5px) scale(1.02)';
        };
        
        const leaveHandler = () => {
            element.style.boxShadow = `0 0 ${glowIntensity} ${glowColor}40`;
            element.style.transform = 'translateY(0) scale(1)';
        };
        
        element.addEventListener('mouseenter', hoverHandler);
        element.addEventListener('mouseleave', leaveHandler);
        
        return {
            type: 'neonGlow',
            element,
            destroy: () => {
                element.removeEventListener('mouseenter', hoverHandler);
                element.removeEventListener('mouseleave', leaveHandler);
                element.style.boxShadow = '';
                element.style.border = '';
                element.style.transform = '';
            }
        };
    }

    // Retro/vintage decorator
    createRetroDecorator(element, options) {
        const retroColor = options.retroColor || '#d4af37';
        
        // Create retro frame elements
        const frameWrapper = document.createElement('div');
        frameWrapper.className = 'retro-frame-wrapper';
        frameWrapper.style.cssText = `
            position: relative;
            padding: 12px;
            background: linear-gradient(45deg, ${retroColor}20, transparent, ${retroColor}20);
            border: 3px solid ${retroColor};
            border-image: linear-gradient(45deg, ${retroColor}, #ffffff40, ${retroColor}) 1;
            box-shadow: inset 0 0 20px ${retroColor}30, 0 0 20px ${retroColor}50;
            transition: all 0.4s ease;
        `;
        
        // Wrap the element
        element.parentNode.insertBefore(frameWrapper, element);
        frameWrapper.appendChild(element);
        
        const hoverHandler = () => {
            frameWrapper.style.transform = 'scale(1.02) translateY(-3px)';
            frameWrapper.style.boxShadow = `inset 0 0 30px ${retroColor}50, 0 0 30px ${retroColor}70`;
        };
        
        const leaveHandler = () => {
            frameWrapper.style.transform = 'scale(1) translateY(0)';
            frameWrapper.style.boxShadow = `inset 0 0 20px ${retroColor}30, 0 0 20px ${retroColor}50`;
        };
        
        frameWrapper.addEventListener('mouseenter', hoverHandler);
        frameWrapper.addEventListener('mouseleave', leaveHandler);
        
        return {
            type: 'retro',
            element,
            frameWrapper,
            destroy: () => {
                frameWrapper.removeEventListener('mouseenter', hoverHandler);
                frameWrapper.removeEventListener('mouseleave', leaveHandler);
                if (frameWrapper.parentNode) {
                    frameWrapper.parentNode.insertBefore(element, frameWrapper);
                    frameWrapper.parentNode.removeChild(frameWrapper);
                }
            }
        };
    }

    // Minimal decorator
    createMinimalDecorator(element, options) {
        const accentColor = options.accentColor || '#f0d060';
        
        element.style.cssText += `
            border-left: 4px solid ${accentColor};
            padding-left: 16px;
            transition: all 0.3s ease;
            position: relative;
        `;
        
        // Add subtle hover effect
        const hoverHandler = () => {
            element.style.borderLeftWidth = '6px';
            element.style.transform = 'translateX(4px)';
        };
        
        const leaveHandler = () => {
            element.style.borderLeftWidth = '4px';
            element.style.transform = 'translateX(0)';
        };
        
        element.addEventListener('mouseenter', hoverHandler);
        element.addEventListener('mouseleave', leaveHandler);
        
        return {
            type: 'minimal',
            element,
            destroy: () => {
                element.removeEventListener('mouseenter', hoverHandler);
                element.removeEventListener('mouseleave', leaveHandler);
                element.style.borderLeft = '';
                element.style.paddingLeft = '';
                element.style.transform = '';
            }
        };
    }

    // Remove decoration from an element
    undecorate(element) {
        const decorator = this.decoratedElements.get(element);
        if (decorator && decorator.destroy) {
            decorator.destroy();
        }
        this.decoratedElements.delete(element);
    }

    // Switch frame type for all decorated elements
    switchFrameType(newFrameType, options = {}) {
        const elements = Array.from(this.decoratedElements.keys());
        
        // Clear existing decorations
        elements.forEach(element => this.undecorate(element));
        
        // Update frame type
        this.options.frameType = newFrameType;
        this.options = { ...this.options, ...options };
        
        // Re-apply with new frame type
        elements.forEach(element => this.decorate(element));
    }

    // Get all decorated elements
    getDecoratedElements() {
        return Array.from(this.decoratedElements.keys());
    }

    // Clean up all decorations
    destroyAll() {
        this.decoratedElements.forEach((decorator, element) => {
            if (decorator && decorator.destroy) {
                decorator.destroy();
            }
        });
        this.decoratedElements.clear();
    }

    // Static method to create preset configurations
    static createPreset(presetName) {
        const presets = {
            editableCard: {
                frameType: 'editableCard',
                enableRotation: true,
                rotationIntensity: 8,
                cornerColor: '#f0d060',
                borderStyle: 'dotted',
                alwaysVisible: true
            },
            neonCyan: {
                frameType: 'neonGlow',
                glowColor: '#00ffff',
                glowIntensity: '15px'
            },
            neonPurple: {
                frameType: 'neonGlow',
                glowColor: '#9f00ff',
                glowIntensity: '20px'
            },
            retroGold: {
                frameType: 'retro',
                retroColor: '#d4af37'
            },
            retroCopper: {
                frameType: 'retro',
                retroColor: '#b87333'
            },
            minimalGold: {
                frameType: 'minimal',
                accentColor: '#f0d060'
            },
            minimalBlue: {
                frameType: 'minimal',
                accentColor: '#4a9eff'
            },
            none: {
                frameType: 'none'
            }
        };
        
        return presets[presetName] || presets.none;
    }
}

// Export for use in other files
window.FrameDecorator = FrameDecorator;
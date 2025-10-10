/**
 * Rotatable Card System
 * Creates a 3D card with selection border, corner elements, and 3D gizmo
 * Reusable for any DOM element that needs this editor-style selection interface
 */

class RotatableCard {
    constructor(options = {}) {
        // Configuration options
        this.options = {
            targetElement: options.targetElement || null, // DOM element to attach card to
            cardScene: options.cardScene || null, // Three.js scene for card
            cardCamera: options.cardCamera || null, // Three.js camera for card
            cardRenderer: options.cardRenderer || null, // Three.js renderer for card
            cardWidth: options.cardWidth || 8,
            cardHeight: options.cardHeight || 4,
            gizmoPosition: options.gizmoPosition || { x: -2.35, y: 1.15, z: 0 },
            enableRotation: options.enableRotation !== false, // Default true
            fadeInDuration: options.fadeInDuration || 1000,
            rotationIntensity: options.rotationIntensity || 25,
            onRotationChange: options.onRotationChange || null // Callback for rotation changes
        };

        // State
        this.mouseX = 0;
        this.mouseY = 0;
        this.allowRotation = false;
        this.gizmoFadeProgress = 0;
        this.gizmoFadeStartTime = null;

        // Three.js objects
        this.cardPlane = null;
        this.brandGizmoGroup = null;

        this.init();
    }

    init() {
        if (!this.options.targetElement || !this.options.cardScene || !this.options.cardCamera) {
            console.error('RotatableCard: Missing required options (targetElement, cardScene, cardCamera)');
            return;
        }

        this.createCardPlane();
        this.createGizmo();
        this.setupEventListeners();
        this.startFadeInAnimation();
    }

    createCardPlane() {
        // 3D Card Plane (Represents the target element in 3D space)
        const cardPlaneGeometry = new THREE.PlaneGeometry(this.options.cardWidth, this.options.cardHeight);
        const cardPlaneMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        this.cardPlane = new THREE.Mesh(cardPlaneGeometry, cardPlaneMaterial);
        this.cardPlane.position.set(0, 0, 0);
        this.options.cardScene.add(this.cardPlane);
    }

    createGizmo() {
        // Brand Corner Gizmo (Attached to card plane)
        this.brandGizmoGroup = new THREE.Group();

        // Create small arrows for the gizmo
        const smallArrowY = this.createSmallArrow(0x00FF00, null);
        const smallArrowX = this.createSmallArrow(0xFF0000, {
            x: 0,
            y: 0,
            z: -Math.PI / 2
        });
        const smallArrowZ = this.createSmallArrow(0x0000FF, {
            x: Math.PI / 2,
            y: 0,
            z: 0
        });

        this.brandGizmoGroup.add(smallArrowY);
        this.brandGizmoGroup.add(smallArrowX);
        this.brandGizmoGroup.add(smallArrowZ);

        // Center sphere
        const smallCenterGeometry = new THREE.SphereGeometry(0.015, 16, 16);
        const smallCenterMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 1.0
        });
        const smallCenterSphere = new THREE.Mesh(smallCenterGeometry, smallCenterMaterial);
        this.brandGizmoGroup.add(smallCenterSphere);

        // Position gizmo at specified position
        this.brandGizmoGroup.position.set(
            this.options.gizmoPosition.x,
            this.options.gizmoPosition.y,
            this.options.gizmoPosition.z
        );

        // Start with gizmo invisible to match card fade-in animation
        this.brandGizmoGroup.traverse((obj) => {
            if (obj.material) {
                obj.material.opacity = 0;
            }
        });

        // Add gizmo as child of card plane so it inherits transformations
        this.cardPlane.add(this.brandGizmoGroup);
    }

    createSmallArrow(color, rotation) {
        const group = new THREE.Group();

        const shaftGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8);
        const shaftMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1.0
        });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.y = 0.3;

        const headGeometry = new THREE.ConeGeometry(0.045, 0.12, 8);
        const headMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1.0
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.66;

        group.add(shaft);
        group.add(head);

        if (rotation) {
            group.rotation.set(rotation.x, rotation.y, rotation.z);
        }

        group.scale.set(0.35, 0.35, 0.35);
        return group;
    }

    setupEventListeners() {
        // Mouse movement handler
        this.handleMove = (e) => {
            // Handle both mouse and touch events
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            // Normalised mouse coordinates for Three.js (-1 to 1)
            this.mouseX = (clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(clientY / window.innerHeight) * 2 + 1;

            // Apply rotation to target element if enabled
            if (this.options.enableRotation && this.options.targetElement && window.innerWidth > 768 && this.allowRotation) {
                const rect = this.options.targetElement.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const deltaX = clientX - centerX;
                const deltaY = clientY - centerY;
                const rotateX = (deltaY / window.innerHeight) * this.options.rotationIntensity;
                const rotateY = (deltaX / window.innerWidth) * this.options.rotationIntensity;

                // Apply transform to DOM element
                this.options.targetElement.style.transform = 
                    `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;

                // Update card plane to match rotation
                if (this.cardPlane) {
                    this.cardPlane.rotation.x = THREE.MathUtils.degToRad(rotateX);
                    this.cardPlane.rotation.y = THREE.MathUtils.degToRad(rotateY);
                }

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

        // Mouse leave handler
        this.handleLeave = () => {
            if (this.options.enableRotation && this.options.targetElement && window.innerWidth > 768) {
                this.options.targetElement.style.transform = 
                    'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
                
                if (this.cardPlane) {
                    this.cardPlane.rotation.x = 0;
                    this.cardPlane.rotation.y = 0;
                }

                // Trigger callback if provided
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

        // Add event listeners
        document.addEventListener('mousemove', this.handleMove);
        document.addEventListener('touchmove', this.handleMove);
        document.addEventListener('mouseleave', this.handleLeave);
        document.addEventListener('touchend', this.handleLeave);
    }

    startFadeInAnimation() {
        // Enable card rotation after fade-in animation completes
        setTimeout(() => {
            this.allowRotation = true;
        }, this.options.fadeInDuration);
    }

    update() {
        // Fade in gizmo during first second
        if (this.gizmoFadeProgress < 1) {
            if (this.gizmoFadeStartTime === null) {
                this.gizmoFadeStartTime = performance.now();
            }
            const elapsed = performance.now() - this.gizmoFadeStartTime;
            this.gizmoFadeProgress = Math.min(elapsed / this.options.fadeInDuration, 1);

            if (this.brandGizmoGroup) {
                this.brandGizmoGroup.traverse((obj) => {
                    if (obj.material && obj.material.transparent) {
                        obj.material.opacity = this.gizmoFadeProgress;
                    }
                });
            }
        }
    }

    // Methods to control the card
    setRotation(rotateX, rotateY) {
        if (this.options.targetElement) {
            this.options.targetElement.style.transform = 
                `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
        }
        
        if (this.cardPlane) {
            this.cardPlane.rotation.x = THREE.MathUtils.degToRad(-rotateX);
            this.cardPlane.rotation.y = THREE.MathUtils.degToRad(rotateY);
        }
    }

    resetRotation() {
        this.setRotation(0, 0);
    }

    setGizmoPosition(x, y, z) {
        if (this.brandGizmoGroup) {
            this.brandGizmoGroup.position.set(x, y, z);
        }
    }

    setGizmoVisibility(visible) {
        if (this.brandGizmoGroup) {
            this.brandGizmoGroup.visible = visible;
        }
    }

    enableRotation() {
        this.options.enableRotation = true;
        this.allowRotation = true;
    }

    disableRotation() {
        this.options.enableRotation = false;
        this.resetRotation();
    }

    // Cleanup method
    dispose() {
        // Remove event listeners
        document.removeEventListener('mousemove', this.handleMove);
        document.removeEventListener('touchmove', this.handleMove);
        document.removeEventListener('mouseleave', this.handleLeave);
        document.removeEventListener('touchend', this.handleLeave);

        // Clean up Three.js objects
        if (this.brandGizmoGroup) {
            this.brandGizmoGroup.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
        }

        if (this.cardPlane) {
            if (this.cardPlane.geometry) this.cardPlane.geometry.dispose();
            if (this.cardPlane.material) this.cardPlane.material.dispose();
        }

        // Remove from scene
        if (this.options.cardScene && this.cardPlane) {
            this.options.cardScene.remove(this.cardPlane);
        }

        // Reset target element
        if (this.options.targetElement) {
            this.options.targetElement.style.transform = '';
        }
    }

    // Getters
    getRotation() {
        if (!this.cardPlane) return { x: 0, y: 0 };
        return {
            x: THREE.MathUtils.radToDeg(this.cardPlane.rotation.x),
            y: THREE.MathUtils.radToDeg(this.cardPlane.rotation.y)
        };
    }

    getMousePosition() {
        return {
            x: this.mouseX,
            y: this.mouseY
        };
    }
}

// Export for use in other files
window.RotatableCard = RotatableCard;
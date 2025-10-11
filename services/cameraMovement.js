/**
 * Camera Movement System
 * Handles mouse tracking, cursor light effects, and camera parallax movement
 */

class CameraMovement {
    constructor() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.cursorX = 0;
        this.cursorY = 0;
        this.isMoving = false;
        this.cameras = [];
        this.easingFactor = 0.05;
        
        // Base positions for cameras (can be modified by scroll effects)
        this.baseCameraPositions = new Map();
        
        this.init();
    }

    init() {
        this.setupCursorLight();
        this.setupEventListeners();
    }

    setupCursorLight() {
        // Create cursor light element if it doesn't exist
        let cursorLight = document.getElementById('cursorLight');
        if (!cursorLight) {
            cursorLight = document.createElement('div');
            cursorLight.id = 'cursorLight';
            cursorLight.className = 'cursor-light';
            document.body.appendChild(cursorLight);
        }
        this.cursorLight = cursorLight;
    }

    setupEventListeners() {
        const handleMove = (e) => {
            // Handle both mouse and touch events
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            this.cursorX = clientX;
            this.cursorY = clientY;

            // Normalised mouse coordinates for Three.js (-1 to 1)
            this.mouseX = (clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(clientY / window.innerHeight) * 2 + 1;

            // DOM Cursor Light update
            this.cursorLight.style.left = this.cursorX + 'px';
            this.cursorLight.style.top = this.cursorY + 'px';
            this.cursorLight.style.opacity = '1';
            this.isMoving = true;

            // Debounce to fade out the light when movement stops
            clearTimeout(this.cursorTimeout);
            this.cursorTimeout = setTimeout(() => {
                this.isMoving = false;
            }, 100);
        };

        const handleLeave = () => {
            this.cursorLight.style.opacity = '0';
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('mouseleave', handleLeave);
        document.addEventListener('touchend', handleLeave);
    }

    // Register cameras for parallax movement
    addCamera(camera, parallaxIntensity = 0.5) {
        this.cameras.push({
            camera: camera,
            parallaxIntensity: parallaxIntensity
        });
        
        // Store the initial base position
        this.baseCameraPositions.set(camera, {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        });
    }

    // Update camera positions based on mouse movement
    updateCameras() {
        this.cameras.forEach(({ camera, parallaxIntensity }) => {
            const basePos = this.baseCameraPositions.get(camera);
            if (basePos) {
                // Calculate target position: base position + parallax offset
                const targetX = basePos.x + (this.mouseX * parallaxIntensity);
                const targetY = basePos.y + (this.mouseY * parallaxIntensity);
                
                // Apply easing to reach target position
                camera.position.x += (targetX - camera.position.x) * this.easingFactor;
                camera.position.y += (targetY - camera.position.y) * this.easingFactor;
                // Don't modify Z position to preserve scroll-based depth changes
            }
        });
    }

    // Update base position for a camera (used by scroll effects)
    updateCameraBasePosition(camera, x, y, z) {
        const basePos = this.baseCameraPositions.get(camera);
        if (basePos) {
            if (x !== undefined) basePos.x = x;
            if (y !== undefined) basePos.y = y;
            if (z !== undefined) basePos.z = z;
        }
    }

    // Get current mouse position (normalized -1 to 1)
    getMousePosition() {
        return {
            x: this.mouseX,
            y: this.mouseY,
            cursorX: this.cursorX,
            cursorY: this.cursorY
        };
    }

    // Update method to be called in animation loop
    update() {
        this.updateCameras();
    }
}

// Export for use in other files
window.CameraMovement = CameraMovement;
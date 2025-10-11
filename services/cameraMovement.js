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
    }

    // Update camera positions based on mouse movement
    updateCameras() {
        this.cameras.forEach(({ camera, parallaxIntensity }) => {
            // Camera Parallax: moves subtly with the mouse
            camera.position.x += (this.mouseX * parallaxIntensity - camera.position.x) * this.easingFactor;
            camera.position.y += (this.mouseY * parallaxIntensity - camera.position.y) * this.easingFactor;
        });
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
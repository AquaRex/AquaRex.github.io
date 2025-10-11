/**
 * Scene Manager
 * Handles Three.js scene setup, renderers, and main animation loop
 */

class SceneManager {
    constructor() {
        this.scene = null;
        this.cardScene = null;
        this.camera = null;
        this.cardCamera = null;
        this.renderer = null;
        this.cardRenderer = null;
        this.systems = [];
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        this.setupCanvases();
        this.setupScenes();
        this.setupCameras();
        this.setupRenderers();
        this.setupResizeHandler();
        this.isInitialized = true;
    }

    setupCanvases() {
        // Get or create main 3D canvas
        this.canvas = document.getElementById('canvas3d');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'canvas3d';
            document.body.appendChild(this.canvas);
        }

        // Get or create card gizmo canvas
        this.canvasCardGizmo = document.getElementById('canvasCardGizmo');
        if (!this.canvasCardGizmo) {
            this.canvasCardGizmo = document.createElement('canvas');
            this.canvasCardGizmo.id = 'canvasCardGizmo';
            document.body.appendChild(this.canvasCardGizmo);
        }
    }

    setupScenes() {
        // Background scene
        this.scene = new THREE.Scene();
        
        // Foreground scene for card gizmo
        this.cardScene = new THREE.Scene();
    }

    setupCameras() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.cardCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.camera.position.z = 5;
        this.cardCamera.position.z = 4;
    }

    setupRenderers() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });

        this.cardRenderer = new THREE.WebGLRenderer({
            canvas: this.canvasCardGizmo,
            alpha: true,
            antialias: true
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x1f3d38, 1);

        this.cardRenderer.setSize(window.innerWidth, window.innerHeight);
        this.cardRenderer.setPixelRatio(window.devicePixelRatio);
        this.cardRenderer.setClearColor(0x000000, 0);
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.cardCamera.aspect = window.innerWidth / window.innerHeight;
            this.cardCamera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.cardRenderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // Add a system to be updated in the animation loop
    addSystem(system) {
        this.systems.push(system);
    }

    // Main animation loop
    animate() {
        if (!this.isInitialized) return;

        requestAnimationFrame(() => this.animate());

        // Update all registered systems
        this.systems.forEach(system => {
            if (system && typeof system.update === 'function') {
                system.update();
            }
        });

        // Camera look-at for both scenes
        this.camera.lookAt(this.scene.position);
        this.cardCamera.lookAt(this.cardScene.position);

        // Render both scenes
        this.renderer.render(this.scene, this.camera);
        this.cardRenderer.render(this.cardScene, this.cardCamera);
    }

    // Start the animation loop
    start() {
        this.animate();
    }

    // Get scene objects for other systems
    getScene() {
        return this.scene;
    }

    getCardScene() {
        return this.cardScene;
    }

    getCamera() {
        return this.camera;
    }

    getCardCamera() {
        return this.cardCamera;
    }
}

// Export for use in other files
window.SceneManager = SceneManager;
/**
 * Submarine System
 * Handles 3D submarine model loading, spotlights, animation, and flicker effects
 */

class Submarine {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.gizmoGroup = new THREE.Group();
        this.spotlights = [];
        this.spotlightBeams = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.clock = new THREE.Clock();
        
        // Animation variables for spotlights
        this.lastFlickerTime = 0;
        this.nextFlickerInterval = 10000 + Math.random() * 10000; // 10-20 seconds
        this.FLICKER_DURATION = 100;
        this.isFlickering = false;
        this.flickerCounter = 0;
        this.MAX_FLICKERS = 3;
        this.lastFlickerStateChangeTime = 0;
        this.currentFlickerStateDuration = 0;
        this.maxFlickersInSequence = 0;
        
        this.init();
    }

    init() {
        this.setupGroup();
        this.loadModel();
        this.scene.add(this.gizmoGroup);
    }

    setupGroup() {
        // Position the submarine group
        this.gizmoGroup.position.set(-12, 0, -15);
        this.gizmoGroup.rotation.set(Math.PI / 8, Math.PI / -2, 0);
        this.gizmoGroup.scale.set(0.8, 0.8, 0.8);
        // Store the base rotation for the 'looking around' movement
        this.gizmoGroup.userData.baseRotationY = this.gizmoGroup.rotation.y;
    }

    loadModel() {
        const MODEL_URL = '/models/submarine.glb';
        const loader = new THREE.GLTFLoader();

        loader.load(
            MODEL_URL,
            (gltf) => this.onModelLoaded(gltf),
            (xhr) => console.log('Submarine: ' + (xhr.loaded / xhr.total * 100) + '% loaded'),
            (error) => {
                console.error('Error loading submarine GLB model:', error);
                console.log('Make sure the file exists at: ' + MODEL_URL);
            }
        );
    }

    onModelLoaded(gltf) {
        console.log('Submarine GLB Model loaded successfully!');

        const model = gltf.scene;

        // Debug: Log model info
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        console.log('Submarine model size:', size);
        console.log('Submarine model center:', box.getCenter(new THREE.Vector3()));

        // Scale and position the model
        model.scale.set(1, 1, 1);
        model.rotation.set(0, Math.PI / 4, 0);
        model.position.set(0, 0, 0);

        // Make model materials BLACK and receive lighting
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshLambertMaterial({
                    color: 0x0a0a0a,
                    emissive: 0x000000,
                    emissiveIntensity: 0
                });
                child.material.needsUpdate = true;
                console.log('Found submarine mesh:', child.name, 'Material set to black');
            }
        });

        // Add spotlights to the submarine
        this.addSpotlights(model);

        this.gizmoGroup.add(model);
        console.log('Submarine model added to scene at position:', this.gizmoGroup.position);
    }

    addSpotlights(model) {
        const spotlightPositions = [
            { pos: [0.5, 0.3, 0.2], target: [0.5, 0.3, 6] }, // Front right
            { pos: [0.5, 0.3, -0.2], target: [0.5, 0.3, 6] }, // Front left
            { pos: [0.5, -0.3, 0], target: [0.5, -0.3, 6] } // Front bottom
        ];

        spotlightPositions.forEach((spotData, index) => {
            // Spotlight housing
            const housingGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.12, 8);
            const housingMaterial = new THREE.MeshLambertMaterial({
                color: 0x1a1a1a,
                emissive: 0x0a0a0a,
                emissiveIntensity: 0.2
            });
            const housing = new THREE.Mesh(housingGeometry, housingMaterial);
            housing.rotation.z = Math.PI / 2;
            housing.position.set(spotData.pos[0], spotData.pos[1], spotData.pos[2]);
            model.add(housing);

            // Glowing lens
            const lensGeometry = new THREE.CircleGeometry(0.06, 16);
            const lensMaterial = new THREE.MeshBasicMaterial({
                color: 0xf0d060,
                emissive: 0xf0d060,
                emissiveIntensity: 1
            });
            const lens = new THREE.Mesh(lensGeometry, lensMaterial);
            lens.position.set(spotData.pos[0], spotData.pos[1], spotData.pos[2] + 0.07);
            model.add(lens);

            // Volumetric light beam (cone)
            const beamLength = 8;
            const beamGeometry = new THREE.ConeGeometry(0.06, beamLength, 16, 1, true);
            const beamMaterial = new THREE.MeshBasicMaterial({
                color: 0xf0d060,
                transparent: true,
                opacity: 0.18,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.rotation.x = Math.PI / 2;
            beam.position.set(spotData.pos[0], spotData.pos[1], spotData.pos[2] + beamLength / 2);
            model.add(beam);

            // Actual Three.js SpotLight for lighting
            const spotlight = new THREE.SpotLight(0xf0d060, 1.5, 12, Math.PI / 8, 0.5, 1);
            spotlight.position.set(spotData.pos[0], spotData.pos[1], spotData.pos[2]);
            spotlight.target.position.set(spotData.target[0], spotData.target[1], spotData.target[2]);
            model.add(spotlight);
            model.add(spotlight.target);

            // Store beam for animation
            beam.userData.isSpotlightBeam = true;
            beam.userData.baseOpacity = 0.18;
            beam.userData.index = index;

            // Store references for animation
            this.spotlights.push(spotlight);
            this.spotlightBeams.push(beam);
        });
    }

    updateMousePosition(mouseX, mouseY) {
        this.mouseX = mouseX;
        this.mouseY = mouseY;
    }

    update() {
        const elapsedTime = this.clock.getElapsedTime();

        // Update submarine position based on mouse (parallax effect)
        const easingFactorCamera = 0.05;
        const gizmoTargetX = -12 + this.mouseX * 0.2;
        const gizmoTargetY = 0 + this.mouseY * 0.2;

        this.gizmoGroup.position.x += (gizmoTargetX - this.gizmoGroup.position.x) * easingFactorCamera;
        this.gizmoGroup.position.y += (gizmoTargetY - this.gizmoGroup.position.y) * easingFactorCamera;

        // Update spotlights
        this.updateSpotlights(elapsedTime);
    }

    updateSpotlights(elapsedTime) {
        // Slight movement (looking around)
        const movementIntensity = 0.05;
        const movementSpeed = 0.2;

        // Gently oscillate the entire group's Y rotation
        this.gizmoGroup.rotation.y = this.gizmoGroup.userData.baseRotationY + Math.sin(elapsedTime * movementSpeed) * movementIntensity;

        // Flicker effect
        const currentTime = Date.now();
        const timeSinceLastFlicker = currentTime - this.lastFlickerTime;

        // Start a new flicker sequence
        if (!this.isFlickering && timeSinceLastFlicker > this.nextFlickerInterval) {
            this.isFlickering = true;
            this.flickerCounter = 0;
            this.lastFlickerTime = currentTime;
            this.lastFlickerStateChangeTime = currentTime;
            
            // Randomize total number of on/off states (2 to 8 total blinks)
            this.maxFlickersInSequence = Math.floor(Math.random() * 7) + 2;

            // Set the duration for the very first state
            this.currentFlickerStateDuration = 100 + Math.random() * 200;
        }

        // Execute flicker states
        if (this.isFlickering) {
            const timeSinceLastStateChange = currentTime - this.lastFlickerStateChangeTime;

            // Check if the current state duration has passed
            if (timeSinceLastStateChange > this.currentFlickerStateDuration) {
                
                this.flickerCounter++;

                // Check if the sequence is finished
                if (this.flickerCounter > this.maxFlickersInSequence * 2) {
                    this.isFlickering = false;
                    this.lastFlickerTime = currentTime;
                    // Randomize the next long interval (10 to 20 seconds)
                    this.nextFlickerInterval = 10000 + Math.random() * 10000;

                    // Ensure lights are back to full power
                    this.spotlights.forEach((spotlight, index) => {
                        spotlight.intensity = 1.5;
                        this.spotlightBeams[index].material.opacity = this.spotlightBeams[index].userData.baseOpacity;
                    });
                    return;
                }

                // A new state begins
                this.lastFlickerStateChangeTime = currentTime;
                
                const isVisible = (this.flickerCounter % 2 === 0);

                this.spotlights.forEach((spotlight, index) => {
                    const beam = this.spotlightBeams[index];
                    
                    if (isVisible) {
                        // SET TO BRIGHT/ON STATE
                        spotlight.intensity = 1.5;
                        beam.material.opacity = beam.userData.baseOpacity;
                        
                        // Randomize the duration of the next ON state
                        this.currentFlickerStateDuration = 50 + Math.random() * 100;
                    } else {
                        // SET TO DIM/OFF STATE
                        const minDropIntensity = 0.05;
                        const maxDropIntensity = 0.3;
                        const flickerDrop = minDropIntensity + Math.random() * (maxDropIntensity - minDropIntensity);

                        spotlight.intensity = flickerDrop;
                        beam.material.opacity = 0.02;
                        
                        // Randomize the duration of the next OFF state
                        this.currentFlickerStateDuration = 20 + Math.random() * 80;
                    }
                });
            }
        }
    }

    dispose() {
        if (this.gizmoGroup) {
            this.scene.remove(this.gizmoGroup);
        }
    }
}

// Export for use in other files
window.Submarine = Submarine;
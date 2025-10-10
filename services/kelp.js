/**
 * Kelp System
 * Handles kelp/seaweed GLB loading, positioning, and swaying animation
 */

class Kelp {
    constructor(scene) {
        this.scene = scene;
        this.kelpGroup = new THREE.Group();
        this.kelpObjects = [];
        this.kelpCount = 150;
        
        this.init();
    }

    init() {
        this.loadModel();
        this.scene.add(this.kelpGroup);
    }

    loadModel() {
        const KELP_MODEL_URL = '/models/kelp.glb';
        const loader = new THREE.GLTFLoader();

        loader.load(
            KELP_MODEL_URL,
            (gltf) => this.onModelLoaded(gltf),
            (xhr) => console.log('Kelp: ' + (xhr.loaded / xhr.total * 100) + '% loaded'),
            (error) => {
                console.error('Error loading kelp GLB model:', error);
                console.log('Make sure the file exists at: ' + KELP_MODEL_URL);
            }
        );
    }

    onModelLoaded(gltf) {
        console.log('Kelp GLB Model loaded successfully!');

        const kelpModel = gltf.scene;

        // Debug: Log model info
        const box = new THREE.Box3().setFromObject(kelpModel);
        const size = box.getSize(new THREE.Vector3());
        console.log('Kelp model size:', size);

        // Make kelp materials receive lighting with deep green color
        kelpModel.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshLambertMaterial({
                    color: 0x3d664c,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide
                });
                child.material.needsUpdate = true;
            }
        });

        // Create multiple kelp instances
        this.createKelpInstances(kelpModel);

        console.log(`Created ${this.kelpCount} kelp instances`);
    }

    createKelpInstances(kelpModel) {
        for (let i = 0; i < this.kelpCount; i++) {
            // Clone the model for each instance
            const kelp = kelpModel.clone();

            // Calculate depth-based positioning
            const kelpZ = (Math.random() * -35) - 7;
            const depthFactor = (kelpZ + 5) / -25;
            const minScale = 0.8;
            const maxScale = 2.0;
            const scale = minScale + depthFactor * (maxScale - minScale);

            // Set scale based on depth
            kelp.scale.set(scale, scale, scale);

            // Position kelp
            kelp.position.set(
                (Math.random() - 0.5) * 50,
                -15 - (Math.random() * 3), // Anchor below viewable area
                kelpZ
            );

            // Random rotation
            kelp.rotation.y = Math.random() * Math.PI * 2;

            // Store original rotation for animation
            kelp.userData = {
                baseRotationX: kelp.rotation.x,
                baseRotationZ: kelp.rotation.z,
                animationOffset: Math.random() * Math.PI * 2, // Random phase offset
                swayIntensityX: 0.05 + Math.random() * 0.03, // Randomize sway intensity
                swayIntensityZ: 0.05 + Math.random() * 0.03,
                swaySpeed: 0.8 + Math.random() * 0.4 // Randomize sway speed
            };

            this.kelpGroup.add(kelp);
            this.kelpObjects.push(kelp);
        }
    }

    update() {
        // Kelp animation (subtle swaying)
        const time = performance.now() * 0.0001;
        
        this.kelpObjects.forEach((kelp, index) => {
            const userData = kelp.userData;
            
            // Use individual animation properties for more varied motion
            kelp.rotation.x = userData.baseRotationX + Math.sin(time * userData.swaySpeed + userData.animationOffset) * userData.swayIntensityX;
            kelp.rotation.z = userData.baseRotationZ + Math.cos(time * userData.swaySpeed * 0.7 + userData.animationOffset) * userData.swayIntensityZ;
        });
    }

    dispose() {
        this.kelpObjects.forEach(kelp => {
            if (kelp.geometry) kelp.geometry.dispose();
            if (kelp.material) {
                if (Array.isArray(kelp.material)) {
                    kelp.material.forEach(mat => mat.dispose());
                } else {
                    kelp.material.dispose();
                }
            }
        });
        
        if (this.kelpGroup) {
            this.scene.remove(this.kelpGroup);
        }
        
        this.kelpObjects = [];
    }
}

// Export for use in other files
window.Kelp = Kelp;
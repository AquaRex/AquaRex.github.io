/**
 * Ocean Background System
 * Handles particle systems, basic lighting, fog, and scene setup
 */

class OceanBackground {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.particleSystems = [];
        this.velocities = [];
        this.originalPositions = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.clock = new THREE.Clock();
        this.scrollDepth = 0;
        
        // Store original fog and lighting values
        this.originalFogColor = 0x1f3d38;
        this.originalFogDensity = 0.08;
        this.targetFogColor = 0x0a1a18; // Much darker for deep ocean
        this.targetFogDensity = 0.15;   // Denser fog
        
        this.init();
    }

    init() {
        this.setupFog();
        this.setupLighting();
        this.setupParticles();
    }

    setupFog() {
        this.scene.fog = new THREE.FogExp2(this.originalFogColor, this.originalFogDensity);
        this.scene.background = new THREE.Color(this.originalFogColor);
    }

    setupLighting() {
        // Subtle ambient light to illuminate dark areas with a hint of green
        this.ambientLight = new THREE.AmbientLight(0x3a6855, 0.15);
        this.scene.add(this.ambientLight);

        // Directional light for subtle shadows/depth
        this.directionalLight = new THREE.DirectionalLight(0x5a8870, 0.15);
        this.directionalLight.position.set(-5, 8, 3);
        this.scene.add(this.directionalLight);

        // Mouse-following point light (gold/yellow color)
        this.cursorPointLight = new THREE.PointLight(0xf0d060, 2.5, 30);
        this.cursorPointLight.position.set(0, 0, 5);
        this.scene.add(this.cursorPointLight);

        this.cursorAmbientLight = new THREE.PointLight(0xe0c850, 1.2, 25);
        this.cursorAmbientLight.position.set(0, 0, 4);
        this.scene.add(this.cursorAmbientLight);
    }

    createParticleTexture() {
        // Create a 2D canvas for a soft, glowing particle texture
        const canvas2d = document.createElement('canvas');
        canvas2d.width = 32;
        canvas2d.height = 32;
        const ctx = canvas2d.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(canvas2d);
    }

    setupParticles() {
        const particleTexture = this.createParticleTexture();

        // Particle layer 1 (Foreground/Interactive)
        this.createParticleLayer1(particleTexture);
        
        // Particle layer 2 (Mid-ground)
        this.createParticleLayer2(particleTexture);
        
        // Particle layer 3 (Far background)
        this.createParticleLayer3(particleTexture);
    }

    createParticleLayer1(particleTexture) {
        const particleCount = 10000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        this.velocities = [];
        this.originalPositions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 18;
            positions[i3 + 1] = (Math.random() - 0.5) * 18;
            positions[i3 + 2] = (Math.random() - 0.5) * 8;

            this.originalPositions[i3] = positions[i3];
            this.originalPositions[i3 + 1] = positions[i3 + 1];
            this.originalPositions[i3 + 2] = positions[i3 + 2];

            // Base color for particles (light green/white)
            colors[i3] = 0.8;
            colors[i3 + 1] = 0.9;
            colors[i3 + 2] = 0.8;

            this.velocities.push({
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.008 + 0.003, // Slight upward drift
                z: (Math.random() - 0.5) * 0.01
            });
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.035,
            transparent: true,
            opacity: 0.25,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            map: particleTexture,
            depthWrite: false,
            vertexColors: true
        });

        this.particleSystem1 = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.particleSystem1);
        this.particleSystems.push(this.particleSystem1);
    }

    createParticleLayer2(particleTexture) {
        const particleCount2 = 7000;
        const particles2 = new THREE.BufferGeometry();
        const positions2 = new Float32Array(particleCount2 * 3);

        for (let i = 0; i < particleCount2; i++) {
            const i3 = i * 3;
            positions2[i3] = (Math.random() - 0.5) * 22;
            positions2[i3 + 1] = (Math.random() - 0.5) * 22;
            positions2[i3 + 2] = (Math.random() - 0.5) * 10;
        }

        particles2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));

        const particleMaterial2 = new THREE.PointsMaterial({
            size: 0.022,
            color: 0xc5d5b0,
            transparent: true,
            opacity: 0.22,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            map: particleTexture,
            depthWrite: false
        });

        this.particleSystem2 = new THREE.Points(particles2, particleMaterial2);
        this.scene.add(this.particleSystem2);
        this.particleSystems.push(this.particleSystem2);
    }

    createParticleLayer3(particleTexture) {
        const particleCount3 = 4000;
        const particles3 = new THREE.BufferGeometry();
        const positions3 = new Float32Array(particleCount3 * 3);

        for (let i = 0; i < particleCount3; i++) {
            const i3 = i * 3;
            positions3[i3] = (Math.random() - 0.5) * 26;
            positions3[i3 + 1] = (Math.random() - 0.5) * 26;
            positions3[i3 + 2] = (Math.random() - 0.5) * 12;
        }

        particles3.setAttribute('position', new THREE.BufferAttribute(positions3, 3));

        const particleMaterial3 = new THREE.PointsMaterial({
            size: 0.018,
            color: 0xb5d5c5,
            transparent: true,
            opacity: 0.16,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            map: particleTexture,
            depthWrite: false
        });

        this.particleSystem3 = new THREE.Points(particles3, particleMaterial3);
        this.scene.add(this.particleSystem3);
        this.particleSystems.push(this.particleSystem3);
    }

    updateMousePosition(mouseX, mouseY) {
        this.mouseX = mouseX;
        this.mouseY = mouseY;
    }

    updateScrollDepth(scrollProgress) {
        this.scrollDepth = scrollProgress;
        
        // Interpolate fog color from original to target based on scroll
        const originalColor = new THREE.Color(this.originalFogColor);
        const targetColor = new THREE.Color(this.targetFogColor);
        const currentColor = originalColor.clone().lerp(targetColor, scrollProgress);
        
        // Update fog
        if (this.scene.fog) {
            this.scene.fog.color = currentColor;
            this.scene.fog.density = this.originalFogDensity + (this.targetFogDensity - this.originalFogDensity) * scrollProgress;
        }
        
        // Update renderer background color to match fog
        this.scene.background = currentColor;
        
        // Reduce ambient lighting intensity as we go deeper
        if (this.ambientLight) {
            this.ambientLight.intensity = 0.15 * (1 - scrollProgress * 0.7); // Reduce by up to 70%
        }
        
        if (this.directionalLight) {
            this.directionalLight.intensity = 0.15 * (1 - scrollProgress * 0.8); // Reduce by up to 80%
        }
        
        // Make cursor lights slightly dimmer in deep water
        if (this.cursorPointLight) {
            this.cursorPointLight.intensity = 2.5 * (1 - scrollProgress * 0.3);
        }
        
        if (this.cursorAmbientLight) {
            this.cursorAmbientLight.intensity = 1.2 * (1 - scrollProgress * 0.3);
        }
    }

    update() {
        const elapsedTime = this.clock.getElapsedTime();

        // Update cursor lights
        const lightX = this.mouseX * 10;
        const lightY = this.mouseY * 10;

        this.cursorPointLight.position.x = lightX;
        this.cursorPointLight.position.y = lightY;
        this.cursorPointLight.intensity = 2.5;

        this.cursorAmbientLight.position.x = lightX;
        this.cursorAmbientLight.position.y = lightY;
        this.cursorAmbientLight.intensity = 1.5;

        // Update particle systems
        this.updateParticleLayer1(elapsedTime, lightX, lightY);
        this.updateParticleLayer2();
        this.updateParticleLayer3();
    }

    updateParticleLayer1(elapsedTime, lightX, lightY) {
        const particleCount = 10000;
        const positions = this.particleSystem1.geometry.attributes.position.array;
        const colors = this.particleSystem1.geometry.attributes.color.array;

        for (let i = 0; i < particleCount * 3; i += 3) {
            const index = i / 3;

            // Repulsion logic
            const dx = this.mouseX * 5 - positions[i];
            const dy = this.mouseY * 5 - positions[i + 1];
            const dz = 3 - positions[i + 2];
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < 1.2) {
                const force = (1.2 - distance) * 0.012;
                positions[i] -= dx * force;
                positions[i + 1] -= dy * force;
                positions[i + 2] -= dz * force;
            }

            // Light interaction logic
            const lightDistance = Math.sqrt(
                Math.pow(lightX - positions[i], 2) +
                Math.pow(lightY - positions[i + 1], 2) +
                Math.pow(5 - positions[i + 2], 2)
            );

            const maxLightDistance = 8;
            let lightIntensity = 0;
            if (lightDistance < maxLightDistance) {
                lightIntensity = Math.pow(1 - (lightDistance / maxLightDistance), 3);
                lightIntensity *= 1.5;
            }

            // Interpolate colors between base (green-white) and light (gold)
            const baseR = 0.8, baseG = 0.9, baseB = 0.8;
            const lightR = 0.95, lightG = 0.85, lightB = 0.4;

            colors[i] = baseR + (lightR - baseR) * lightIntensity;
            colors[i + 1] = baseG + (lightG - baseG) * lightIntensity;
            colors[i + 2] = baseB + (lightB - baseB) * lightIntensity;

            // Simple drift based on initial velocity
            positions[i] += this.velocities[index].x;
            positions[i + 1] += this.velocities[index].y;
            positions[i + 2] += this.velocities[index].z;

            // Constant jitter/wiggle for perpetual motion
            const jitterSpeed = 0.001;
            positions[i] += Math.sin(elapsedTime * 0.5 + index * 0.1) * jitterSpeed;
            positions[i + 1] += Math.cos(elapsedTime * 0.6 + index * 0.1) * jitterSpeed;
            positions[i + 2] += Math.sin(elapsedTime * 0.7 + index * 0.1) * jitterSpeed * 0.5;

            // Damping to original position
            positions[i] += (this.originalPositions[i] - positions[i]) * 0.005;
            positions[i + 1] += (this.originalPositions[i + 1] - positions[i + 1]) * 0.005;
            positions[i + 2] += (this.originalPositions[i + 2] - positions[i + 2]) * 0.005;

            // Boundary wrap-around
            if (Math.abs(positions[i]) > 18) positions[i] = this.originalPositions[i] * -1;
            if (Math.abs(positions[i + 1]) > 18) positions[i + 1] = this.originalPositions[i + 1] * -1;
            if (Math.abs(positions[i + 2]) > 10) positions[i + 2] = this.originalPositions[i + 2] * -1;
        }

        this.particleSystem1.geometry.attributes.position.needsUpdate = true;
        this.particleSystem1.geometry.attributes.color.needsUpdate = true;
    }

    updateParticleLayer2() {
        const particleCount2 = 7000;
        const positions2 = this.particleSystem2.geometry.attributes.position.array;
        for (let i = 0; i < particleCount2 * 3; i += 3) {
            positions2[i + 1] += 0.005;
            if (positions2[i + 1] > 17) positions2[i + 1] = -17;
        }
        this.particleSystem2.geometry.attributes.position.needsUpdate = true;
    }

    updateParticleLayer3() {
        const particleCount3 = 4000;
        const positions3 = this.particleSystem3.geometry.attributes.position.array;
        for (let i = 0; i < particleCount3 * 3; i += 3) {
            positions3[i] += 0.003;
            positions3[i + 1] += 0.004;
            if (positions3[i + 1] > 20) positions3[i + 1] = -20;
            if (Math.abs(positions3[i]) > 20) positions3[i] = positions3[i] * -1;
        }
        this.particleSystem3.geometry.attributes.position.needsUpdate = true;
    }

    dispose() {
        this.particleSystems.forEach(system => {
            if (system.geometry) system.geometry.dispose();
            if (system.material) system.material.dispose();
            this.scene.remove(system);
        });
    }
}

// Export for use in other files
window.OceanBackground = OceanBackground;
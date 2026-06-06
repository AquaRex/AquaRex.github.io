# Services Documentation

This directory contains reusable components for the AquaRex website that can be shared across multiple pages.

## Core Systems

### SceneManager (`sceneManager.js`)
Handles Three.js scene setup, renderers, cameras, and the main animation loop.

**Usage:**
```javascript
// Initialize the scene manager
const sceneManager = new SceneManager();

// Get scene references for other systems
const scene = sceneManager.getScene();
const camera = sceneManager.getCamera();

// Add systems to the animation loop
sceneManager.addSystem({
    update: () => {
        // Your update logic here
    }
});

// Start the animation loop
sceneManager.start();
```

### CameraMovement (`cameraMovement.js`)
Handles mouse tracking, cursor light effects, and camera parallax movement.

**Usage:**
```javascript
// Initialize camera movement system
const cameraMovement = new CameraMovement();

// Register cameras for parallax movement
cameraMovement.addCamera(camera, 0.5); // 0.5 is parallax intensity

// Get current mouse position in update loop
const mousePos = cameraMovement.getMousePosition();
// Returns: { x, y, cursorX, cursorY }

// Update in animation loop
cameraMovement.update();
```

### OceanBackground (`oceanBackground.js`)
Creates particle systems, lighting, and fog effects for the ocean scene.

**Usage:**
```javascript
// Initialize with scene and camera
const oceanBackground = new OceanBackground(scene, camera);

// Update with mouse position and animate
oceanBackground.updateMousePosition(mouseX, mouseY);
oceanBackground.update();
```

### Submarine, Kelp (`submarine.js`, `kelp.js`)
Additional 3D elements for the ocean scene.

### EditableCard (`editableCard.js`)
Interactive 3D frame effects for DOM elements (used by the home page).

## The "cv3" system (CV, Projects, Project detail)

The CV (`/cv/`), projects gallery (`/projects/`), and each per-project detail
page share one design language called **cv3**. There is a single source of truth
for it:

### `styles/cv3.css` — design system (single source of truth)
Design tokens (colors, spacing, the `--frame` **border** token, the `--btn-*`
**button** tokens), the reusable `.cv3-frame` and `.cv3-btn` components, plus the
shared layout shell (reset/base, outer wrapper, nav, body grid, sections + strip,
sidebar cards). **Edit a border or button here once and it changes everywhere.**

Page-specific styles live next to their page and only hold what is unique:
- `cv/cv.css` — hero, timeline fields, contact/skills, the compact CV project row.
- `projects/projects.css` — the tall gallery card, search/filters, detail popup.
- `services/projectDetail.css` — the `.pd-*` detail layout (it `@import`s `cv3.css`).

### Render engines (one module per page)
- `cv/cvView.js` — renders `CV_DATA` into the CV shell (`window.renderCv3`).
- `projects/projectsView.js` — builds the gallery, filters, and search.
- `services/projectDetail.js` — renders a single project's detail page.

### Data (single source of truth)
- `projects/projects.js` (`PROJECTS_DATA`) — every project. Its bootstrap merges
  the matching entries back into `CV_DATA` at runtime, so `cv/cv.js` holds only
  CV structure (profile, experience, education, companies) and no project copies.

### Editing (localhost only — same component for Create and Edit)
- `dataEditor.js` — the generic modal/field/save engine (one place for buttons,
  field widgets, uploads). `projectEditor.js` and `cvEditor.js` build their
  Create/Edit modals on top of it; the project field list is defined once in
  `projectEditor.js` (`projectFieldDefs`) and reused by both New and Edit.
- Saves go to the local `dev-server.py` (`/__save`, `/__save-cv`, uploads).

## Example: Creating a New Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Include Three.js and services -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="services/sceneManager.js"></script>
    <script src="services/cameraMovement.js"></script>
    <script src="services/oceanBackground.js"></script>
    <script src="services/submarine.js"></script>
    <script src="services/kelp.js"></script>
    <!-- Add other services as needed -->
</head>
<body>
    <canvas id="canvas3d"></canvas>
    <canvas id="canvasCardGizmo"></canvas>
    <div class="cursor-light" id="cursorLight"></div>
    
    <!-- Your page content here -->
    
    <script>
        window.addEventListener('load', () => {
            // Initialize core systems
            const sceneManager = new SceneManager();
            const cameraMovement = new CameraMovement();
            
            // Get scene references
            const scene = sceneManager.getScene();
            const camera = sceneManager.getCamera();
            
            // Initialize background systems
            const oceanBackground = new OceanBackground(scene, camera);
            const submarine = new Submarine(scene, camera);
            const kelp = new Kelp(scene);
            
            // Register camera for parallax movement
            cameraMovement.addCamera(camera, 0.5);
            
            // Add systems to scene manager for animation loop
            sceneManager.addSystem({
                update: () => {
                    const mousePos = cameraMovement.getMousePosition();
                    
                    // Update background systems
                    oceanBackground.updateMousePosition(mousePos.x, mousePos.y);
                    oceanBackground.update();
                    
                    submarine.updateMousePosition(mousePos.x, mousePos.y);
                    submarine.update();
                    
                    kelp.update();
                    
                    // Update camera movement
                    cameraMovement.update();
                    
                    // Add any page-specific updates here
                }
            });
            
            // Add page-specific initialization here
            
            // Start the animation loop
            sceneManager.start();
        });
    </script>
</body>
</html>
```

## CSS Requirements

Make sure to include the cursor light styles in your CSS:

```css
.cursor-light {
    position: fixed;
    width: 2400px;
    height: 2400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(240, 208, 96, 0.015) 0%, rgba(240, 208, 96, 0.008) 35%, rgba(240, 208, 96, 0.004) 60%, rgba(240, 208, 96, 0.001) 80%, transparent 100%);
    pointer-events: none;
    z-index: 1;
    transform: translate(-50%, -50%);
    mix-blend-mode: screen;
    opacity: 0;
    transition: opacity 0.4s ease;
    filter: blur(80px);
}

#canvas3d {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    filter: blur(2px);
}

#canvasCardGizmo {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 11;
    pointer-events: none;
}
```

## Benefits

- **No code duplication** - Shared systems across all pages
- **Consistent experience** - Same ocean background and interactions everywhere
- **Easy maintenance** - Update one file to affect all pages
- **Modular design** - Only include the services you need for each page
- **Clean separation** - Page-specific logic stays in the page, reusable systems are separate
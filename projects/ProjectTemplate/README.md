# Project Page Template Component System

This system provides a reusable, configurable component for creating consistent project showcase pages on the AquaRex website, similar to how `EditableCard`, `Header`, and other components work.

## Structure

```
services/
├── projectPageTemplate.js    # Main component class
├── projectPageTemplate.css   # Shared styles for all project pages
projects/
├── ProjectTemplate/
│   ├── template.html         # Static template (legacy/reference)
│   └── README.md            # This file
└── [ProjectName]/
    └── index.html           # Minimal page that instantiates the component
```

## Using the Component System

### Method 1: Component Instantiation (Recommended)

1. **Create Project Directory**: Create a new folder under `projects/` with your project name
2. **Create Minimal HTML**: Create basic HTML structure with container and imports
3. **Configure Component**: Instantiate `ProjectPageTemplate` with your project data
4. **Customize**: Use component methods to modify content dynamically

### Basic Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Project - Hetland</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../../styles/colors.css">
    <link rel="stylesheet" href="../../styles/selection.css">
    <link rel="stylesheet" href="../../services/projectPageTemplate.css">
    <!-- Include other services as needed -->
    <script src="../../services/projectPageTemplate.js"></script>
</head>
<body>
    <!-- 3D Background Elements (if using) -->
    <canvas id="canvas3d"></canvas>
    <div class="fog-overlay"></div>
    <div class="cursor-light" id="cursorLight"></div>
    <div class="vignette"></div>
    
    <!-- Container for the component -->
    <div class="content"></div>
    
    <script>
        window.addEventListener('load', () => {
            const projectTemplate = new ProjectPageTemplate({
                container: document.querySelector('.content'),
                project: {
                    // Your project configuration here
                }
            });
        });
    </script>
</body>
</html>
```

### Component Configuration

Configure the component by passing an options object to the constructor:

```javascript
const projectTemplate = new ProjectPageTemplate({
    container: document.querySelector('.content'), // Required
    
    project: {
        // Basic Information
        title: 'Your Project Name',
        subtitle: 'Brief description of your project',
        image: '../../assets/images/projects/your-project.jpg',
        status: 'Published', // Published, Development, Completed, etc.
        date: 'Released October 2025',
        technologies: ['Unity', 'C#', 'WebGL'], // Array of tech used
        tags: ['WebApp', 'Game', 'Mobile'], // Array of tags
        
        // Navigation
        homeUrl: '../../index.html',
        projectsUrl: '../index.html',
        
        // Links/Actions
        links: [
            {
                url: 'https://yourproject.com',
                text: 'Try It Live',
                icon: 'fas fa-external-link-alt',
                type: '' // or 'secondary'
            }
        ],
        
        // Content
        description: `<p>Your project description in HTML format</p>`,
        
        features: [
            {
                icon: 'fas fa-star',
                title: 'Feature Name',
                description: 'Feature description'
            }
        ],
        
        media: [
            {
                src: '../../assets/images/projects/screenshot1.jpg',
                caption: 'Screenshot description'
            }
        ],
        
        technicalDetails: [
            { label: 'Engine', value: 'Unity 2022.3' },
            { label: 'Platform', value: 'Web' }
        ],
        
        challenges: [
            {
                title: 'Challenge Name',
                description: 'Description of challenge and solution'
            }
        ]
    },
    
    // Section Visibility (optional - all true by default)
    showNavigation: true,
    showHero: true,
    showDescription: true,
    showFeatures: true,
    showMedia: true,
    showTechnical: true,
    showChallenges: true,
    showFooter: true
});
```

### Dynamic Updates

The component provides methods for dynamic content updates:

```javascript
// Update entire project data
projectTemplate.updateProject({ title: 'New Title' });

// Add individual items
projectTemplate.addFeature({
    icon: 'fas fa-new',
    title: 'New Feature',
    description: 'Added after initialization'
});

projectTemplate.addMediaItem({
    src: 'new-image.jpg',
    caption: 'New screenshot'
});

projectTemplate.addChallenge({
    title: 'New Challenge',
    description: 'Challenge description'
});

// Show/hide sections
projectTemplate.showSection('media');
projectTemplate.hideSection('challenges');

// Get elements for custom manipulation
const heroElement = projectTemplate.getElement('hero');
const allElements = projectTemplate.getAllElements();

// Get current project data
const currentData = projectTemplate.getProjectData();
```

## CSS Classes and Components

### Status Badges
- `.status-published` - Green (success)
- `.status-development` - Orange (warning) 
- `.status-completed` - Green (success)
- `.status-paused` - Orange (warning)
- `.status-cancelled` - Red (error)
- `.status-archived` - Blue-gray

### Button Types
- `.action-button` - Primary action button (yellow)
- `.action-button.secondary` - Secondary action button (transparent)
- `.nav-button` - Navigation button

### Card Components
- `.feature-card` - Feature highlight cards
- `.tech-card` - Technical specification cards
- `.challenge-item` - Challenge/solution items
- `.media-item` - Media gallery items

### Layout Sections
- `.project-hero` - Hero section with image and main content
- `.project-section` - Content sections
- `.features-section` - Features grid section
- `.media-section` - Screenshots/media section
- `.technical-section` - Technical details section
- `.challenges-section` - Challenges and solutions section

## Design System Integration

The template automatically integrates with:
- **Colors**: Uses variables from `../../styles/colors.css`
- **3D Background**: Same ocean background system as main site
- **Responsive Design**: Mobile-optimized layouts
- **Animations**: Consistent fade-in animations
- **Typography**: Matches main site typography

## File Paths

When creating a project page, ensure these paths are correct:
- CSS: `../../styles/colors.css` and `../ProjectTemplate/project-template.css`
- JavaScript: `../../services/*.js`
- Images: `../../assets/images/projects/`
- Navigation: `../../index.html` (home) and `../index.html` (projects)

## Example Usage

See `projects/TinyVoters/index.html` for a complete example implementation.

## Future Enhancements

Consider implementing:
1. **Template Generator Script**: Automate placeholder replacement
2. **Project Data JSON**: Store project data in JSON format
3. **Build System**: Automated template processing
4. **CMS Integration**: Content management for easier updates

## Component Benefits

1. **Reusable**: Edit `projectPageTemplate.js` and all project pages update automatically
2. **Configurable**: Each project can customize sections and content through configuration
3. **Dynamic**: Add/remove content after initialization without rebuilding HTML
4. **Consistent**: Ensures all project pages follow the same design patterns
5. **Maintainable**: Central location for template logic and styling

## Best Practices

1. **Images**: Optimize all images for web (WebP format recommended)
2. **Configuration**: Store complex project data in separate JS files and import if needed
3. **Performance**: Use the component's section visibility options to hide unused sections
4. **Updates**: Use the dynamic update methods rather than rebuilding the entire component
5. **Testing**: Test all interactive elements and responsive behavior

## Examples

### Basic Project Page
```javascript
new ProjectPageTemplate({
    container: document.querySelector('.content'),
    project: {
        title: 'Simple Project',
        subtitle: 'A basic project example',
        image: '../../assets/images/projects/simple.jpg',
        status: 'Development'
    },
    showMedia: false,
    showChallenges: false
});
```

### Complex Project with All Sections
See `projects/TinyVoters/index.html` for a complete implementation example.

## Migration from Static Template

If you have existing static project pages, you can migrate them by:

1. Extracting content from HTML into the configuration object
2. Replacing static HTML with component instantiation
3. Updating any custom styling to work with the component structure
4. Testing all functionality and links
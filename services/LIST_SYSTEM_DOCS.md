# Generic List System Documentation

The list system has been refactored to be completely modular and reusable. You can now create different types of lists with different visual designs easily.

## Architecture

### 1. **ListManager** (Generic Base Class)
- Handles all list logic: add, remove, update, search, sort
- Frame application (editableCard, neonGlow, minimal)
- Event handling and click actions
- JSON import/export

### 2. **Element Templates** (Visual Design)
- Define how each list item looks
- Specify default frame type
- Handle data formatting and rendering

### 3. **Specific Managers** (Convenience Wrappers)
- Extend ListManager with domain-specific methods
- Maintain backward compatibility

## Usage Examples

### Example 1: Projects (Current Implementation)

```javascript
// Initialize project list manager
const projectManager = new ProjectListManager('.projects-list');

// Add projects using simple API
projectManager.addProject({
    title: 'My Awesome Project',
    description: 'A cool web application with Three.js',
    tags: ['JavaScript', 'Three.js', 'CSS'],
    startDate: '2024-10-01',
    status: 'active',
    icon: 'fas fa-rocket',
    link: 'https://github.com/user/project'
    // No need to specify 'id' - auto-generated
    // No need to specify 'frameType' - defaults to 'editableCard'
});
```

### Example 2: Blog Posts (New)

```javascript
// Initialize generic list manager with blog template
const blogManager = new ListManager('.blog-list', BlogListElement, {
    itemName: 'blog post',
    defaultFrameType: 'minimal'
});

// Add blog posts
blogManager.addListElement({
    title: 'Getting Started with Three.js',
    description: 'Learn the basics of 3D web graphics...',
    author: 'Thomas Hetland',
    publishDate: '2024-10-01',
    readTime: 8,
    tags: ['Three.js', 'Tutorial', 'JavaScript'],
    link: '/blog/getting-started-threejs'
    // Uses minimal frame by default (defined in BlogListElement)
});
```

### Example 3: Portfolio Items (New)

```javascript
// Create custom portfolio template
class PortfolioListElement {
    getDefaultFrameType() {
        return 'neonGlow'; // Fancy glow effect
    }
    
    createTemplate() {
        return `
            <div class="portfolio-item" data-item-id="{{id}}">
                <img src="{{image}}" alt="{{title}}">
                <h3>{{title}}</h3>
                <p>{{description}}</p>
                <div class="tech-stack">{{techStack}}</div>
            </div>
        `;
    }
    
    render(item) {
        return this.createTemplate()
            .replace(/{{id}}/g, item.id)
            .replace(/{{title}}/g, item.title)
            .replace(/{{description}}/g, item.description)
            .replace(/{{image}}/g, item.image || '/default.jpg')
            .replace(/{{techStack}}/g, item.techStack?.join(', ') || '');
    }
}

// Use it
const portfolioManager = new ListManager('.portfolio-grid', PortfolioListElement);

portfolioManager.addListElement({
    title: 'E-commerce Platform',
    description: 'Full-stack shopping application',
    image: '/images/ecommerce.jpg',
    techStack: ['React', 'Node.js', 'MongoDB'],
    link: 'https://demo.ecommerce.com'
    // Uses neonGlow frame automatically
});
```

## Key Benefits

### ✅ **No More Redundant Parameters**
- **Before**: Had to specify `id` manually
- **After**: Auto-generated from title

### ✅ **Flexible Visual Design**
```javascript
// Each template defines its own look and default frame
class ProjectListElement {
    getDefaultFrameType() { return 'editableCard'; }
}

class BlogListElement {
    getDefaultFrameType() { return 'minimal'; }
}

class PortfolioListElement {
    getDefaultFrameType() { return 'neonGlow'; }
}
```

### ✅ **Clean API**
```javascript
// Simple and consistent across all list types
manager.addListElement(data);
manager.removeListElement(id);
manager.updateListElement(id, changes);
manager.searchListElements(query);
manager.sortListElements(field, direction);
```

### ✅ **Frame Customization**
```javascript
// Override frame type per item
manager.addListElement({
    title: 'Special Project',
    frameType: 'neonGlow', // Override default
    frameOptions: {
        glowColor: '#ff00ff',
        rotationIntensity: 15
    }
});
```

## Migration Guide

### Old Way (Projects Only)
```javascript
projectManager.addProject({
    id: 'my-project', // ❌ Manual ID
    title: 'My Project',
    frameType: 'editableCard' // ❌ Always had to specify
});
```

### New Way (Any List Type)
```javascript
projectManager.addProject({
    title: 'My Project', // ✅ ID auto-generated
    link: 'https://...' // ✅ Click action
    // ✅ frameType from template default
});
```

## Available Frame Types

1. **`editableCard`** - Interactive 3D card with handles and gizmo
2. **`neonGlow`** - Glowing border effect
3. **`minimal`** - Simple left border accent
4. **`none`** - No frame styling

## Creating New List Types

1. Create an element template class
2. Define `getDefaultFrameType()` and `render()` methods
3. Use with ListManager or create a specific manager class

This system makes the codebase truly modular and reusable across different pages and content types!
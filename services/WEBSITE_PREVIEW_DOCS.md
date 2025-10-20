# Website Preview Component

A reusable JavaScript component for displaying live websites in embedded frames with customizable styling and device mockups.

## Features

- 📱 **Phone Preview**: Complete with phone frame styling and decorative elements
- 💻 **Desktop Preview**: Clean browser-like appearance  
- 📟 **Tablet Preview**: Medium-sized device styling
- 🎨 **Custom Styling**: Fully customizable dimensions, colors, and borders
- 🔄 **Loading States**: Built-in loading spinner and error handling
- 🖱️ **Interactive**: Optional click-to-open functionality
- 📱 **Responsive**: Automatic scaling on mobile devices

## Basic Usage

### Quick Setup

```javascript
// Include the files
<link rel="stylesheet" href="services/websitePreview.css">
<script src="services/websitePreview.js"></script>
```

### Creating Previews

```javascript
// Phone Preview
const phonePreview = WebsitePreview.createPhonePreview(
    document.getElementById('container'),
    'https://example.com'
);

// Desktop Preview  
const desktopPreview = WebsitePreview.createDesktopPreview(
    document.getElementById('container'),
    'https://github.com'
);

// Tablet Preview
const tabletPreview = WebsitePreview.createTabletPreview(
    document.getElementById('container'),
    'https://codepen.io'
);
```

### Custom Configuration

```javascript
const customPreview = new WebsitePreview({
    container: document.getElementById('myContainer'),
    url: 'https://example.com',
    
    // Dimensions
    width: 400,
    height: 600,
    
    // Styling
    previewType: 'phone', // 'phone', 'desktop', 'tablet', 'custom'
    borderRadius: '25px',
    backgroundColor: '#f0f0f0',
    border: '3px solid #333',
    
    // Phone-specific options
    showPhoneFrame: true,
    phoneColor: '#2c2c2c',
    
    // Interaction
    allowInteraction: true,
    openInNewTab: true,
    
    // Loading & Error handling
    showLoadingSpinner: true,
    loadingText: 'Loading website...',
    errorText: 'Unable to load website',
    fallbackImage: 'path/to/fallback.jpg',
    
    // Callbacks
    onLoad: (preview) => console.log('Loaded!'),
    onError: (preview) => console.log('Error loading'),
    onClick: (url, preview) => window.open(url, '_blank')
});
```

## Methods

### Instance Methods

```javascript
// Update the displayed URL
preview.updateUrl('https://new-url.com');

// Refresh the current page
preview.refresh();

// Resize the preview
preview.resize(500, 700);

// Remove from DOM
preview.destroy();
```

### Static Helper Methods

```javascript
// Pre-configured device previews
WebsitePreview.createPhonePreview(container, url, options);
WebsitePreview.createDesktopPreview(container, url, options);
WebsitePreview.createTabletPreview(container, url, options);
```

## Integration with ProjectPageTemplate

The WebsitePreview component is integrated with the ProjectPageTemplate system. To show a live website instead of a static image:

```javascript
const project = new ProjectPageTemplate({
    container: document.querySelector('.content'),
    project: {
        title: 'My Project',
        subtitle: 'Description...',
        liveUrl: 'https://myproject.com', // Live website URL
        image: 'fallback-image.jpg',      // Fallback if live preview fails
        // ... other project data
    }
});
```

## Examples

### Basic Phone Preview

```html
<div id="phoneContainer"></div>
<script>
    const preview = WebsitePreview.createPhonePreview(
        document.getElementById('phoneContainer'),
        'https://tinyvoters.app',
        {
            openInNewTab: true,
            onLoad: () => console.log('Website loaded!')
        }
    );
</script>
```

### Custom Styled Preview

```javascript
const customPreview = new WebsitePreview({
    container: document.getElementById('custom'),
    url: 'https://example.com',
    width: 600,
    height: 400,
    previewType: 'custom',
    borderRadius: '15px',
    border: '2px solid gold',
    backgroundColor: '#fff',
    showPhoneFrame: false,
    openInNewTab: true
});
```

### Dynamic URL Updates

```javascript
// Create preview
const preview = WebsitePreview.createDesktopPreview(
    document.getElementById('container'),
    'https://github.com'
);

// Update URL later
document.getElementById('updateBtn').onclick = () => {
    const newUrl = document.getElementById('urlInput').value;
    preview.updateUrl(newUrl);
};
```

## CSS Classes

- `.website-preview` - Main container
- `.preview-phone` - Phone-specific styling
- `.preview-desktop` - Desktop-specific styling  
- `.preview-tablet` - Tablet-specific styling
- `.preview-custom` - Custom preview styling
- `.website-preview-loading` - Loading state container

## Browser Compatibility

- Modern browsers with iframe support
- Mobile responsive design included
- Fallback handling for loading failures

## Security Notes

- Some websites may block embedding via iframe (X-Frame-Options)
- HTTPS sites may not load in HTTP contexts
- Consider using fallback images for critical previews

## Demo

See `websitePreview-demo.html` for a complete working example with different preview types and interactive controls.
/**
 * Generic List Manager
 * Handles list data and rendering using any template engine
 * Can be used for projects, blog posts, portfolio items, etc.
 */

class ListManager {
    constructor(containerSelector, templateClass, options = {}) {
        this.container = document.querySelector(containerSelector);
        this.items = [];
        this.templateEngine = new templateClass();
        this.options = {
            defaultFrameType: options.defaultFrameType || 'none',
            itemName: options.itemName || 'item', // For logging/debugging
            ...options
        };
        
        if (!this.container) {
            console.error(`ListManager: Container not found: ${containerSelector}`);
            return;
        }
        
        this.init();
    }

    init() {
        this.render();
    }

    // Generic method to add any list element (main API for users)
    addListElement(itemData) {
        // Auto-generate ID from title if not provided (users shouldn't need to specify this)
        const item = {
            id: this.generateId(itemData.title || 'untitled'),
            frameType: itemData.frameType || this.templateEngine.getDefaultFrameType?.() || this.options.defaultFrameType,
            frameOptions: itemData.frameOptions || {}, // Options for customizing the frame
            link: itemData.link || '#', // Default to # if no link provided
            ...itemData
        };
        
        this.items.push(item);
        this.render();
        return item;
    }

    // Remove an item by ID
    removeListElement(itemId) {
        const index = this.items.findIndex(p => p.id === itemId);
        if (index !== -1) {
            const removed = this.items.splice(index, 1)[0];
            this.render();
            return removed;
        }
        return null;
    }

    // Get item by ID
    getListElement(itemId) {
        return this.items.find(p => p.id === itemId);
    }

    // Update item by ID
    updateListElement(itemId, updates) {
        const item = this.getListElement(itemId);
        if (item) {
            Object.assign(item, updates);
            this.render();
            return item;
        }
        return null;
    }

    // Get all items
    getAllListElements() {
        return [...this.items];
    }

    // Filter items
    filterListElements(filterFn) {
        return this.items.filter(filterFn);
    }

    // Clear all items
    clearListElements() {
        this.items = [];
        this.render();
    }

    // Generate a unique ID from title
    generateId(title) {
        let baseId = title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
        
        // Ensure uniqueness by checking existing items
        let uniqueId = baseId;
        let counter = 1;
        
        while (this.items.some(item => item.id === uniqueId)) {
            uniqueId = `${baseId}-${counter}`;
            counter++;
        }
        
        return uniqueId;
    }

    // Use template engine to render a single item
    renderItem(item) {
        return this.templateEngine.render(item);
    }

    // Filtering functionality
    filterItems(filters = {}) {
        this.currentFilters = filters;
        this.render();
    }

    // Get filtered items based on current filters
    getFilteredItems() {
        if (!this.currentFilters) {
            return this.items;
        }

        return this.items.filter(item => {
            // Search filter (title, description, and tags)
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase();
                const titleMatch = item.title.toLowerCase().includes(searchTerm);
                const descMatch = item.description && item.description.toLowerCase().includes(searchTerm);
                const tagMatch = item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm));
                if (!titleMatch && !descMatch && !tagMatch) {
                    return false;
                }
            }

            // Tag filter (support multiple tags)
            if (this.currentFilters.tags && this.currentFilters.tags.length > 0) {
                if (!item.tags || !this.currentFilters.tags.some(tag => item.tags.includes(tag))) {
                    return false;
                }
            }

            // Status filter (support multiple statuses)
            if (this.currentFilters.statuses && this.currentFilters.statuses.length > 0) {
                if (!this.currentFilters.statuses.includes(item.status)) {
                    return false;
                }
            }

            return true;
        });
    }

    // Get all unique tags from items
    getAllTags() {
        const tags = new Set();
        this.items.forEach(item => {
            if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }

    // Clear all filters
    clearFilters() {
        this.currentFilters = {};
        this.render();
    }

    // Render all items using template engine
    render() {
        if (!this.container) return;

        const filteredItems = this.getFilteredItems();
        const itemsHtml = filteredItems.map(item => 
            this.renderItem(item)
        ).join('');

        this.container.innerHTML = itemsHtml;
        this.addEventListeners();
        this.applyIndividualFrames();
    }

    // Change the visual template
    setTemplate(templateName) {
        if (templateName && this.templateEngine.usePreset) {
            this.templateEngine.usePreset(templateName);
        }
        this.render(); // Re-render with new template
    }

    // Apply individual frames based on each item's frameType
    applyIndividualFrames() {
        // Add a small delay to ensure DOM is fully rendered
        setTimeout(() => {
            this.items.forEach(item => {
                const element = this.container.querySelector(`[data-item-id="${item.id}"]`);
                if (element && item.frameType && item.frameType !== 'none') {
                    // Check if frame has already been applied to avoid duplicates
                    if (!element.hasAttribute('data-frame-applied')) {
                        this.applyFrameToElement(element, item.frameType, item.frameOptions);
                        element.setAttribute('data-frame-applied', item.frameType);
                    }
                }
            });
        }, 100);
    }

    // Apply specific frame type to a single element
    applyFrameToElement(element, frameType, options = {}) {
        switch (frameType) {
            case 'editableCard':
                if (window.EditableCard) {
                    new EditableCard({
                        targetElement: element,
                        enableRotation: options.enableRotation !== false,
                        rotationIntensity: options.rotationIntensity || 8,
                        cornerColor: options.cornerColor || '#f0d060',
                        alwaysVisible: options.alwaysVisible !== false,
                        showGizmoOnHover: false, 
                        showSelectionHandles: options.showSelectionHandles || false,
                        showCornerElements: options.showCornerElements !== false,
                        showGizmo: options.showGizmo !== false,
                        ...options
                    });
                }
                break;
            case 'neonGlow':
                this.applyNeonGlow(element, options);
                break;
            case 'minimal':
                this.applyMinimalFrame(element, options);
                break;
        }
    }

    // Simple neon glow effect
    applyNeonGlow(element, options = {}) {
        const glowColor = options.glowColor || '#00ffff';
        // Use !important to override existing styles
        element.style.setProperty('box-shadow', `0 0 20px ${glowColor}60, 0 0 40px ${glowColor}30`, 'important');
        element.style.setProperty('border', `3px solid ${glowColor}`, 'important');
        element.style.setProperty('border-radius', '12px', 'important');
    }

    // Simple minimal frame
    applyMinimalFrame(element, options = {}) {
        const accentColor = options.accentColor || '#f0d060';
        element.style.borderLeft = `4px solid ${accentColor}`;
        element.style.paddingLeft = '16px';
    }

    // Set custom template HTML
    setCustomTemplate(templateHtml) {
        if (this.templateEngine.setTemplate) {
            this.templateEngine.setTemplate(templateHtml);
        }
        this.render();
    }

    // Add event listeners to item elements
    addEventListeners() {
        const itemRows = this.container.querySelectorAll(`[data-item-id]`);
        
        itemRows.forEach(row => {
            const itemId = row.dataset.itemId;
            
            // Add click handlers
            row.addEventListener('click', (e) => {
                this.onItemClick(itemId, e);
            });

            // Add right-click context menu for editing (optional)
            row.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.onItemRightClick(itemId, e);
            });
        });
    }

    // Handle item click
    onItemClick(itemId, event) {
        const item = this.getListElement(itemId);
        if (item && item.link) {
            console.log(`${this.options.itemName} clicked:`, item);
            
            // Handle different types of links
            if (item.link.startsWith('http://') || item.link.startsWith('https://')) {
                // External link - open in new tab
                window.open(item.link, '_blank');
            } else if (item.link.startsWith('javascript:')) {
                // JavaScript function call
                eval(item.link.replace('javascript:', ''));
            } else if (item.link !== '#') {
                // Internal link - navigate to page
                window.location.href = item.link;
            }
            // If link is '#', do nothing (placeholder)
        }
    }

    // Handle item right-click (for editing)
    onItemRightClick(itemId, event) {
        const item = this.getListElement(itemId);
        if (item) {
            // You can add context menu or editing functionality here
        }
    }

    // Utility methods for easy item management

    // Load items from JSON data
    loadFromJSON(jsonData) {
        try {
            if (Array.isArray(jsonData)) {
                this.items = jsonData;
            } else if (jsonData.items && Array.isArray(jsonData.items)) {
                this.items = jsonData.items;
            } else {
                throw new Error('Invalid JSON format');
            }
            this.render();
            return true;
        } catch (error) {
            console.error(`Error loading ${this.options.itemName}s from JSON:`, error);
            return false;
        }
    }

    // Export items to JSON
    exportToJSON() {
        return JSON.stringify({
            items: this.items,
            exportDate: new Date().toISOString()
        }, null, 2);
    }

    // Search items by title, description, or tags
    searchListElements(query) {
        const lowerQuery = query.toLowerCase();
        return this.items.filter(item => 
            (item.title && item.title.toLowerCase().includes(lowerQuery)) ||
            (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
        );
    }

    // Sort items by field
    sortListElements(field, direction = 'asc') {
        this.items.sort((a, b) => {
            const aVal = a[field] || '';
            const bVal = b[field] || '';
            
            if (direction === 'desc') {
                return bVal > aVal ? 1 : -1;
            }
            return aVal > bVal ? 1 : -1;
        });
        this.render();
    }
}

// Export for use in other files
window.ListManager = ListManager;
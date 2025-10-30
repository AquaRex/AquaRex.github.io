/**
 * Project List Element Template
 * Defines the visual design and structure for project entries
 * Uses editableCard frames by default
 */

class ProjectListElement {
    constructor() {
        // Define the base template structure
        this.template = this.createTemplate();
        // Inject CSS styles for this element type
        this.injectStyles();
    }

    // Get the default frame type for this element type
    // Removed to allow ProjectListManager to control the default frame type
    // getDefaultFrameType() {
    //     return 'neonGlow';
    // }

    // Create the HTML template for a project entry
    createTemplate() {
        return `
            <div class="project-row" data-item-id="{{id}}">
                <div class="project-header-image">
                    {{headerImageContent}}
                </div>
                <div class="project-content-wrapper">
                    <div class="project-main">
                        <h2 class="project-title">{{title}}</h2>
                        <p class="project-description">{{description}}</p>
                        <div class="project-tags">
                            {{tags}}
                        </div>
                    </div>
                    <div class="project-meta">
                        <div class="meta-item">
                            <span class="meta-label">Started</span>
                            <span class="meta-value">{{startDate}}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Status</span>
                            {{statusBadge}}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate header image content for the top of the card
    generateHeaderImageContent(project) {
        // Check for headerImage first, then fallback to image for backward compatibility
        const imageSource = project.headerImage || project.image;
        if (imageSource && imageSource.trim() !== '') {
            return `<img src="${imageSource}" alt="${project.title}">`;
        } else {
            // Default placeholder for header image area
            return `<div class="project-header-placeholder">📸</div>`;
        }
    }

    // Generate image content (icon or actual image) for bottom area
    generateImageContent(project) {
        if (project.image && project.image.trim() !== '') {
            return `<img src="${project.image}" alt="${project.title}">`;
        } else {
            const iconClass = project.icon || 'fas fa-code';
            return `<i class="${iconClass} project-image-placeholder"></i>`;
        }
    }

    // Generate tags HTML
    generateTags(tags) {
        if (!Array.isArray(tags) || tags.length === 0) {
            return '';
        }
        return tags.map(tag => `<span class="project-tag">${tag}</span>`).join('');
    }

    // Generate status badge with flexible text and optional color
    generateStatusBadge(status, statusColor = null) {
        if (!status) status = 'Active';
        
        // If status is an object with text and color properties
        let statusText = status;
        let color = statusColor;
        
        if (typeof status === 'object') {
            statusText = status.text || status.label || 'Active';
            color = status.color || statusColor;
        }
        
        // Default colors for common status types (case-insensitive) - matching ProjectPageTemplate
        const defaultColors = {
            'development': '#f39121',     // Orange  
            'completed': '#2ecc71',       // Success Green (matching --accent-success)
            'published': '#2ecc71',       // Success Green (matching --accent-success) 
            'paused': '#f39121',          // Orange
            'review': '#e2e2e2',          // White
            'archived': '#516488',        // Blue-Gray
            'cancelled': '#F44336',       // Red
            'testing': '#fdd629',         // Yellow
            'abandoned': '#747474'        // Gray
        };
        
        // Use provided color, or try to match default color, or use default blue
        if (!color) {
            const normalizedStatus = statusText.toLowerCase();
            color = defaultColors[normalizedStatus] || '#f0d060'; // Default to site's gold color
        }
        
        // Generate unique class name from status text for custom styling
        const statusClass = `status-${statusText.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        
        return `<span class="status-badge ${statusClass}" style="background-color: ${color}; color: var(--text-contrast); padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">${statusText}</span>`;
    }

    // Format date to "Jan 2024" style
    formatDate(dateString) {
        if (!dateString || dateString === 'Unknown') return 'Unknown';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // If it's not a valid date, return as is
                return dateString;
            }
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            return `${months[date.getMonth()]} ${date.getFullYear()}`;
        } catch (error) {
            return dateString;
        }
    }

    // Render a single project using the template
    render(projectData) {
        // Ensure required fields have defaults
        const project = {
            id: projectData.id || this.generateId(projectData.title || 'untitled'),
            title: projectData.title || 'Untitled Project',
            description: projectData.description || 'No description available.',
            icon: projectData.icon || 'fas fa-code',
            image: projectData.image || null,
            tags: projectData.tags || [],
            startDate: projectData.startDate || 'Unknown',
            status: projectData.status || 'active',
            ...projectData
        };

        // Generate dynamic content
        const headerImageContent = this.generateHeaderImageContent(project);
        const imageContent = this.generateImageContent(project);
        const tagsHtml = this.generateTags(project.tags);
        const statusBadge = this.generateStatusBadge(project.status, project.statusColor);
        const formattedDate = this.formatDate(project.startDate);

        // Replace template placeholders
        let html = this.template
            .replace(/\{\{id\}\}/g, project.id)
            .replace(/\{\{title\}\}/g, project.title)
            .replace(/\{\{description\}\}/g, project.description)
            .replace(/\{\{startDate\}\}/g, formattedDate)
            .replace(/\{\{headerImageContent\}\}/g, headerImageContent)
            .replace(/\{\{imageContent\}\}/g, imageContent)
            .replace(/\{\{tags\}\}/g, tagsHtml)
            .replace(/\{\{statusBadge\}\}/g, statusBadge);

        return html;
    }

    // Generate ID from title
    generateId(title) {
        return title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
    }

    // Allow customization of the template
    setTemplate(newTemplate) {
        this.template = newTemplate;
    }

    // Get the current template
    getTemplate() {
        return this.template;
    }

    // Custom template variations (optional presets)
    static getMinimalTemplate() {
        return `
            <div class="project-row project-row--minimal" data-project-id="{{id}}">
                <div class="project-content-wrapper">
                    <div class="project-main">
                        <h3 class="project-title">{{title}}</h3>
                        <p class="project-description">{{description}}</p>
                    </div>
                    <div class="project-meta">
                        {{statusBadge}}
                    </div>
                </div>
            </div>
        `;
    }

    static getDetailedTemplate() {
        return `
            <div class="project-row project-row--detailed" data-project-id="{{id}}">
                <div class="project-image-container">
                    {{imageContent}}
                </div>
                <div class="project-content-wrapper">
                    <div class="project-main">
                        <h2 class="project-title">{{title}}</h2>
                        <p class="project-description">{{description}}</p>
                        <div class="project-tags">
                            {{tags}}
                        </div>
                        <div class="project-extra-info">
                            <span class="project-date">Started: {{startDate}}</span>
                        </div>
                    </div>
                    <div class="project-meta">
                        <div class="meta-item">
                            <span class="meta-label">Status</span>
                            {{statusBadge}}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Apply a preset template
    usePreset(presetName) {
        switch (presetName) {
            case 'minimal':
                this.setTemplate(ProjectListElement.getMinimalTemplate());
                break;
            case 'detailed':
                this.setTemplate(ProjectListElement.getDetailedTemplate());
                break;
            default:
                // Keep current template
                break;
        }
    }

    // Inject CSS styles for project list elements
    injectStyles() {
        // Check if styles are already injected
        if (document.querySelector('#project-list-element-styles')) {
            return;
        }

        const styles = `
            <style id="project-list-element-styles">
                .project-row {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    margin-bottom: 3rem;
                    padding: 0;
                    min-height: 600px;
                    border-radius: 12px;
                    cursor: pointer;
                    overflow: visible; /* Allow corner elements and gizmo to show */
                }

                /* Hover effects are now handled by EditableCard frame */

                .project-header-image {
                    width: 100%;
                    height: 440px;
                    background: linear-gradient(135deg, var(--primary-transparent-light) 0%, var(--primary-transparent-medium) 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px 12px 0 0;
                    position: relative;
                    overflow: hidden;
                }

                .project-header-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center center; /* Default center positioning for all images */
                }

                .project-header-placeholder {
                    font-size: 3rem;
                    color: var(--primary-glow);
                    text-align: center;
                }

                .project-content-wrapper {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 1.5rem;
                    padding: 2rem;
                    min-height: 160px;
                }

                .project-main {
                    flex: 1;
                    text-align: left;
                }

                .project-title {
                    font-size: 1.6rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: var(--primary-color);
                }

                .project-description {
                    font-size: 1rem;
                    color: var(--text);
                    margin-bottom: 0.75rem;
                    line-height: 1.4;
                }

                .project-tags {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    align-items: flex-end;
                }

                .project-tag {
                    background: var(--primary-transparent-light);
                    color: var(--primary-color);
                    padding: 0.4rem 0.8rem;
                    border-radius: 16px;
                    font-size: 0.8rem;
                    border: 2px solid var(--primary-glow);
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .project-tag:hover {
                    background: var(--primary-transparent-medium);
                    border-color: var(--primary-border-strong);
                }

                .project-meta {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 3rem;
                    text-align: right;
                    flex-shrink: 0;
                    width: 260px;
                    padding: 0;
                    justify-content: end;
                    align-items: start;
                }

                .meta-item {
                    display: flex;
                    flex-direction: column;
                    text-align: right;
                    min-width: 90px;
                }

                .meta-item:first-child {
                    align-items: flex-start;
                    text-align: left;
                }

                .meta-item:last-child {
                    align-items: flex-end;
                    text-align: right;
                }

                .meta-label {
                    font-size: 1rem;
                    color: var(--text-header);
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    font-weight: 600;
                    margin-bottom: 0.8rem;
                    line-height: 1.2;
                    height: 1.2rem;
                }

                .meta-value {
                    font-size: 0.85rem;
                    color: var(--text);
                    font-weight: 500;
                    line-height: 1.3;
                    height: auto;
                }

                .meta-item:first-child .meta-value {
                    margin-top: 0.4rem;
                }

                .status-badge {
                    padding: 0.5rem 1rem;
                    border-radius: 16px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    text-align: center;
                    white-space: nowrap;
                    min-width: 95px;
                    box-sizing: border-box;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(5px);
                }

                .status-badge:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px var(--shadow-light);
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

}

// Export for use in other files
window.ProjectListElement = ProjectListElement;
/**
 * Project List Element Template
 * Defines the visual design and structure for project entries
 */

class ProjectListElement {
    constructor() {
        // Define the base template structure
        this.template = this.createTemplate();
    }

    // Create the HTML template for a project entry
    createTemplate() {
        return `
            <div class="project-row" data-project-id="{{id}}">
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

    // Generate image content (icon or actual image)
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
        return tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('');
    }

    // Generate status badge
    generateStatusBadge(status) {
        const statusConfig = {
            active: {
                class: 'status-active',
                label: 'Active'
            },
            completed: {
                class: 'status-completed',
                label: 'Completed'
            },
            paused: {
                class: 'status-paused',
                label: 'Paused'
            },
            archived: {
                class: 'status-archived',
                label: 'Archived'
            }
        };

        const config = statusConfig[status] || statusConfig.active;
        return `<span class="status-badge ${config.class}">${config.label}</span>`;
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
        const imageContent = this.generateImageContent(project);
        const tagsHtml = this.generateTags(project.tags);
        const statusBadge = this.generateStatusBadge(project.status);

        // Replace template placeholders
        let html = this.template
            .replace(/\{\{id\}\}/g, project.id)
            .replace(/\{\{title\}\}/g, project.title)
            .replace(/\{\{description\}\}/g, project.description)
            .replace(/\{\{startDate\}\}/g, project.startDate)
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


}

// Export for use in other files
window.ProjectListElement = ProjectListElement;
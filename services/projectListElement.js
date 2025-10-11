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
        if (project.headerImage && project.headerImage.trim() !== '') {
            return `<img src="${project.headerImage}" alt="${project.title}">`;
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
        const headerImageContent = this.generateHeaderImageContent(project);
        const imageContent = this.generateImageContent(project);
        const tagsHtml = this.generateTags(project.tags);
        const statusBadge = this.generateStatusBadge(project.status);

        // Replace template placeholders
        let html = this.template
            .replace(/\{\{id\}\}/g, project.id)
            .replace(/\{\{title\}\}/g, project.title)
            .replace(/\{\{description\}\}/g, project.description)
            .replace(/\{\{startDate\}\}/g, project.startDate)
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
                    transition: all 0.3s ease;
                    cursor: pointer;
                    overflow: visible; /* Allow corner elements and gizmo to show */
                }

                .project-row:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 25px rgba(240, 208, 96, 0.15);
                }

                .project-header-image {
                    width: 100%;
                    height: 400px;
                    background: linear-gradient(135deg, rgba(240, 208, 96, 0.1) 0%, rgba(240, 208, 96, 0.05) 100%);
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
                }

                .project-header-placeholder {
                    font-size: 3rem;
                    color: rgba(240, 208, 96, 0.6);
                    text-align: center;
                }

                .project-content-wrapper {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    gap: 1.5rem;
                    padding: 2rem;
                    height: 200px;
                }

                .project-main {
                    flex: 1;
                    text-align: left;
                }

                .project-title {
                    font-size: 1.6rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: #f0d060;
                }

                .project-description {
                    font-size: 1rem;
                    color: #d0e8dc;
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
                    background: rgba(240, 208, 96, 0.15);
                    color: #f0d060;
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    border: 2px solid rgba(240, 208, 96, 0.6);
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .project-tag:hover {
                    background: rgba(240, 208, 96, 0.25);
                    border-color: rgba(240, 208, 96, 0.8);
                }

                .project-meta {
                    display: flex;
                    flex-direction: row;
                    gap: 1.5rem;
                    align-items: flex-end;
                    text-align: right;
                    flex-shrink: 0;
                    width: 200px;
                    padding: 0;
                    justify-content: space-between;
                }

                .meta-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                    align-items: flex-end;
                    min-width: 80px;
                    flex: 1;
                }

                .meta-label {
                    font-size: 0.65rem;
                    color: #b8cfc0;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    font-weight: 600;
                    margin-bottom: 0.1rem;
                }

                .meta-value {
                    font-size: 0.85rem;
                    color: #d0e8dc;
                    font-weight: 500;
                    line-height: 1.3;
                }

                .status-badge {
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    text-align: center;
                    white-space: nowrap;
                    min-width: 80px;
                    box-sizing: border-box;
                }

                .status-active {
                    background: rgba(76, 175, 80, 0.2);
                    color: #4CAF50;
                    border: 1px solid rgba(76, 175, 80, 0.4);
                }

                .status-completed {
                    background: rgba(33, 150, 243, 0.2);
                    color: #2196F3;
                    border: 1px solid rgba(33, 150, 243, 0.4);
                }

                .status-paused {
                    background: rgba(255, 152, 0, 0.2);
                    color: #FF9800;
                    border: 1px solid rgba(255, 152, 0, 0.4);
                }

                .status-archived {
                    background: rgba(158, 158, 158, 0.2);
                    color: #9E9E9E;
                    border: 1px solid rgba(158, 158, 158, 0.4);
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

}

// Export for use in other files
window.ProjectListElement = ProjectListElement;
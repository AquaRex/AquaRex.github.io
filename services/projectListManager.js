/**
 * Project List Manager
 * Handles project data and rendering using ProjectListElement templates
 */

class ProjectListManager {
    constructor(containerSelector = '.projects-list', options = {}) {
        this.container = document.querySelector(containerSelector);
        this.projects = [];
        this.templateEngine = new ProjectListElement();
        
        if (!this.container) {
            console.error('ProjectListManager: Container not found');
            return;
        }
        
        this.init();
    }

    init() {
        // Don't load default projects - let the user add them manually
        this.render();
    }

    // Simple method to add a project (main API for users)
    addProject(projectData) {
        const project = {
            id: projectData.id || this.generateId(projectData.title || 'untitled'),
            ...projectData
        };
        
        this.projects.push(project);
        this.render();
        return project;
    }



    // Remove a project by ID
    removeProject(projectId) {
        const index = this.projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            const removed = this.projects.splice(index, 1)[0];
            this.render();
            return removed;
        }
        return null;
    }

    // Update a project
    updateProject(projectId, updateData) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            Object.assign(project, updateData);
            this.render();
            return project;
        }
        return null;
    }

    // Get project by ID
    getProject(projectId) {
        return this.projects.find(p => p.id === projectId);
    }

    // Get all projects
    getAllProjects() {
        return [...this.projects];
    }

    // Filter projects
    getProjectsByStatus(status) {
        return this.projects.filter(p => p.status === status);
    }

    getFeaturedProjects() {
        return this.projects.filter(p => p.featured);
    }

    // Generate a unique ID from title
    generateId(title) {
        return title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
    }

    // Use template engine to render a single project
    renderProject(project) {
        return this.templateEngine.render(project);
    }

    // Render all projects using template engine
    render() {
        if (!this.container) return;

        const projectsHtml = this.projects.map(project => 
            this.renderProject(project)
        ).join('');

        this.container.innerHTML = projectsHtml;
        this.addEventListeners();
    }



    // Change the visual template
    setTemplate(templateName) {
        if (templateName) {
            this.templateEngine.usePreset(templateName);
        }
        this.render(); // Re-render with new template
    }

    // Set custom template HTML
    setCustomTemplate(templateHtml) {
        this.templateEngine.setTemplate(templateHtml);
        this.render();
    }

    // Add event listeners to project elements
    addEventListeners() {
        const projectRows = this.container.querySelectorAll('.project-row');
        
        projectRows.forEach(row => {
            const projectId = row.dataset.projectId;
            
            // Add hover effects or click handlers here
            row.addEventListener('click', (e) => {
                this.onProjectClick(projectId, e);
            });

            // Add right-click context menu for editing (optional)
            row.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.onProjectRightClick(projectId, e);
            });
        });
    }

    // Handle project click
    onProjectClick(projectId, event) {
        const project = this.getProject(projectId);
        if (project) {
            console.log('Project clicked:', project);
            // You can add custom click behavior here
            // For example: navigate to project detail page
            // window.location.href = `/projects/${projectId}`;
        }
    }

    // Handle project right-click (for editing)
    onProjectRightClick(projectId, event) {
        const project = this.getProject(projectId);
        if (project) {
            console.log('Project right-clicked:', project);
            // You can add context menu or editing functionality here
        }
    }

    // Utility methods for easy project management

    // Load projects from JSON data
    loadFromJSON(jsonData) {
        try {
            if (Array.isArray(jsonData)) {
                this.projects = jsonData;
            } else if (jsonData.projects && Array.isArray(jsonData.projects)) {
                this.projects = jsonData.projects;
            } else {
                throw new Error('Invalid JSON format');
            }
            this.render();
            return true;
        } catch (error) {
            console.error('Error loading projects from JSON:', error);
            return false;
        }
    }

    // Export projects to JSON
    exportToJSON() {
        return JSON.stringify({
            projects: this.projects,
            exportDate: new Date().toISOString()
        }, null, 2);
    }

    // Sort projects
    sortProjects(sortBy = 'startDate', ascending = false) {
        this.projects.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            // Handle date sorting
            if (sortBy === 'startDate') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            if (aVal < bVal) return ascending ? -1 : 1;
            if (aVal > bVal) return ascending ? 1 : -1;
            return 0;
        });

        this.render();
    }

    // Search projects
    searchProjects(query) {
        const searchTerm = query.toLowerCase();
        return this.projects.filter(project => 
            project.title.toLowerCase().includes(searchTerm) ||
            project.description.toLowerCase().includes(searchTerm) ||
            project.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    // Filter and render search results
    renderSearchResults(query) {
        const results = this.searchProjects(query);
        const originalProjects = [...this.projects];
        
        this.projects = results;
        this.render();
        
        // Return a function to restore original projects
        return () => {
            this.projects = originalProjects;
            this.render();
        };
    }

    // Clear all projects
    clear() {
        this.projects = [];
        this.render();
    }

    // Get project statistics
    getStats() {
        const stats = {
            total: this.projects.length,
            active: 0,
            completed: 0,
            paused: 0,
            archived: 0,
            featured: 0
        };

        this.projects.forEach(project => {
            stats[project.status] = (stats[project.status] || 0) + 1;
            if (project.featured) stats.featured++;
        });

        return stats;
    }
}

// Export for use in other files
window.ProjectListManager = ProjectListManager;
/**
 * Project Page Template Component
 * A reusable component for creating project showcase pages
 * Similar to EditableCard, Header, etc. - instantiable and configurable
 * 
 * IMPORTANT: This template does NOT control:
 * - Background/ocean systems (handled by individual project pages)
 * - Color themes (each project uses its own colors.css file)
 * - Page-specific styling (controlled by project's index.html)
 * 
 * Each project page should:
 * 1. Include its own colors.css file
 * 2. Optionally include oceanBackground.js and related 3D systems
 * 3. Initialize ColorConfigPanel for page-specific color customization
 */

class ProjectPageTemplate {
    constructor(options = {}) {
        this.options = {
            // Container element where the template will be rendered
            container: options.container || document.querySelector('.content'),
            
            // Project information
            project: {
                title: options.project?.title || 'Project Title',
                subtitle: options.project?.subtitle || 'Project description goes here',
                image: options.project?.image || '',
                status: options.project?.status || 'Development',
                date: options.project?.date || new Date().getFullYear(),
                technologies: options.project?.technologies || [],
                tags: options.project?.tags || [],
                links: options.project?.links || [],
                
                // Content sections
                description: options.project?.description || '',
                features: options.project?.features || [],
                media: options.project?.media || [],
                technicalDetails: options.project?.technicalDetails || [],
                challenges: options.project?.challenges || [],
                
                // Navigation
                homeUrl: options.project?.homeUrl || '../../index.html',
                projectsUrl: options.project?.projectsUrl || '../index.html'
            },
            
            // Template configuration
            showNavigation: options.showNavigation !== false,
            showHero: options.showHero !== false,
            showDescription: options.showDescription !== false,
            showFeatures: options.showFeatures !== false,
            showMedia: options.showMedia === true, // Disabled by default
            showTechnical: options.showTechnical === true, // Disabled by default
            showChallenges: options.showChallenges === true, // Disabled by default
            showFooter: options.showFooter !== false,
            
            // Animation settings
            animationDelay: options.animationDelay || 0.2,
            
            // Callbacks
            onRender: options.onRender || null,
            onNavigate: options.onNavigate || null
        };

        // Internal state
        this.elements = {};
        this.isRendered = false;
        
        this.init();
    }

    init() {
        console.log('ProjectPageTemplate: Initializing template for project:', this.options.project.title);
        this.render();
        this.setupEventListeners();
        
        if (this.options.onRender) {
            this.options.onRender(this);
        }
    }

    render() {
        if (!this.options.container) {
            console.error('ProjectPageTemplate: Container element not found');
            return;
        }

        // Clear existing content
        this.options.container.innerHTML = '';

        // Render each section
        if (this.options.showNavigation) this.renderNavigation();
        if (this.options.showHero) this.renderHero();
        if (this.options.showDescription) this.renderDescription();
        if (this.options.showFeatures) this.renderFeatures();
        if (this.options.showMedia) this.renderMedia();
        if (this.options.showTechnical) this.renderTechnical();
        if (this.options.showChallenges) this.renderChallenges();
        if (this.options.showFooter) this.renderFooter();

        this.isRendered = true;
    }

    renderNavigation() {
        const nav = document.createElement('header');
        nav.className = 'project-header';
        nav.innerHTML = `
            <nav class="project-nav">
                <a href="${this.options.project.homeUrl}" class="nav-link">
                    <i class="fas fa-home"></i>
                    <span>Home</span>
                </a>
                <a href="${this.options.project.projectsUrl}" class="nav-link">
                    <i class="fas fa-arrow-left"></i>
                    <span>Projects</span>
                </a>
            </nav>
        `;
        
        document.body.appendChild(nav);
        this.elements.navigation = nav;
    }

    renderHero() {
        console.log('🎬 renderHero() called');
        console.log('Project data:', this.options.project);
        console.log('liveUrl:', this.options.project.liveUrl);
        console.log('image:', this.options.project.image);
        
        const hero = document.createElement('section');
        hero.className = 'project-hero';
        
        const statusClass = this.options.project.status.toLowerCase().replace(/\s+/g, '-');
        const tagBadges = this.options.project.tags.map(tag => 
            `<span class="tag-badge">${tag}</span>`
        ).join('');
        
        const actionButtons = this.options.project.links.map(link => 
            `<a href="${link.url}" target="_blank" class="action-button ${link.type || ''}">
                <i class="${link.icon || 'fas fa-external-link-alt'}"></i>
                ${link.text}
            </a>`
        ).join('');

        hero.innerHTML = `
            <div class="hero-top-section">
                <div class="hero-content">
                    <div class="project-badges">
                        <span class="status-badge status-${statusClass}">${this.options.project.status}</span>
                        ${tagBadges}
                    </div>
                    <h1 class="project-title">${this.options.project.title}</h1>
                    <p class="project-subtitle">${this.options.project.subtitle}</p>
                    <div class="project-meta">
                        <div class="meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${this.options.project.date}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-code"></i>
                            <span>${this.options.project.technologies.join(', ')}</span>
                        </div>
                    </div>
                    <div class="hero-actions">
                        ${actionButtons}
                    </div>
                </div>
            </div>
            <div class="hero-preview">
                <div class="phone-mockup" style="position: relative; width: 400px; height: 880px; background: #000; border-radius: 50px; padding: 8px; box-shadow: 0 25px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);">
                    <div class="phone-screen" style="width: 100%; height: 100%; border-radius: 42px; overflow: hidden; background: #000;">
                        <iframe src="${this.options.project.liveUrl || 'http://tinyvoters.app'}" style="width: 100%; height: 100%; border: none; border-radius: 42px;" title="Live Preview"></iframe>
                    </div>
                </div>
            </div>
            <div class="project-section about-section">
                <h2 class="section-title">About This Project</h2>
                <div class="section-content">
                    ${this.options.project.description || ''}
                </div>
            </div>
        `;

        this.options.container.appendChild(hero);
        this.elements.hero = hero;
    }

    renderDescription() {
        // Description is now rendered as part of the hero grid layout
        // This method is kept for compatibility but does nothing
        return;
    }

    renderFeatures() {
        if (!this.options.project.features.length) return;

        const section = document.createElement('section');
        section.className = 'project-section features-section';
        
        const featureCards = this.options.project.features.map(feature => `
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="${feature.icon || 'fas fa-star'}"></i>
                </div>
                <h3 class="feature-title">${feature.title}</h3>
                <p class="feature-description">${feature.description}</p>
            </div>
        `).join('');

        section.innerHTML = `
            <h2 class="section-title">Key Features</h2>
            <div class="features-grid">
                ${featureCards}
            </div>
        `;

        this.options.container.appendChild(section);
        this.elements.features = section;
    }

    renderMedia() {
        if (!this.options.project.media.length) return;

        const section = document.createElement('section');
        section.className = 'project-section media-section';
        
        const mediaItems = this.options.project.media.map(item => `
            <div class="media-item">
                ${item.type === 'video' 
                    ? `<video src="${item.src}" controls></video>`
                    : `<img src="${item.src}" alt="${item.caption || ''}" class="lazy-load">`
                }
                ${item.caption ? `<div class="media-caption">${item.caption}</div>` : ''}
            </div>
        `).join('');

        section.innerHTML = `
            <h2 class="section-title">Screenshots & Media</h2>
            <div class="media-gallery">
                ${mediaItems}
            </div>
        `;

        this.options.container.appendChild(section);
        this.elements.media = section;
    }

    renderTechnical() {
        if (!this.options.project.technicalDetails.length) return;

        const section = document.createElement('section');
        section.className = 'project-section technical-section';
        
        const techCards = this.options.project.technicalDetails.map(detail => `
            <div class="tech-card">
                <h4>${detail.label}</h4>
                <p>${detail.value}</p>
            </div>
        `).join('');

        section.innerHTML = `
            <h2 class="section-title">Technical Details</h2>
            <div class="technical-grid">
                ${techCards}
            </div>
        `;

        this.options.container.appendChild(section);
        this.elements.technical = section;
    }

    renderChallenges() {
        if (!this.options.project.challenges.length) return;

        const section = document.createElement('section');
        section.className = 'project-section challenges-section';
        
        const challengeItems = this.options.project.challenges.map(challenge => `
            <div class="challenge-item">
                <h3 class="challenge-title">${challenge.title}</h3>
                <p class="challenge-description">${challenge.description}</p>
            </div>
        `).join('');

        section.innerHTML = `
            <h2 class="section-title">Challenges & Solutions</h2>
            <div class="challenges-content">
                ${challengeItems}
            </div>
        `;

        this.options.container.appendChild(section);
        this.elements.challenges = section;
    }

    renderFooter() {
        const footer = document.createElement('section');
        footer.className = 'project-footer';
        
        const footerActions = this.options.project.links.map(link => 
            `<a href="${link.url}" target="_blank" class="action-button ${link.type || ''}">
                <i class="${link.icon || 'fas fa-external-link-alt'}"></i>
                ${link.text}
            </a>`
        ).join('');

        footer.innerHTML = `
            <div class="footer-actions">
                ${footerActions}
            </div>
            <div class="project-navigation">
                <a href="${this.options.project.projectsUrl}" class="nav-button">
                    <i class="fas fa-arrow-left"></i>
                    Back to Projects
                </a>
            </div>
        `;

        this.options.container.appendChild(footer);
        this.elements.footer = footer;
    }

    setupEventListeners() {
        // Handle image loading
        const images = this.options.container.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });
            
            img.addEventListener('error', () => {
                img.classList.add('error');
                console.warn('ProjectPageTemplate: Failed to load image:', img.src);
            });
        });

        // Handle navigation clicks
        const navLinks = this.options.container.querySelectorAll('a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Navigation callback
        if (this.options.onNavigate) {
            const allLinks = this.options.container.querySelectorAll('a');
            allLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    this.options.onNavigate(e, link);
                });
            });
        }
    }

    // Public methods for dynamic updates
    updateProject(newProjectData) {
        this.options.project = { ...this.options.project, ...newProjectData };
        this.render();
        this.setupEventListeners();
    }

    addFeature(feature) {
        this.options.project.features.push(feature);
        if (this.isRendered && this.options.showFeatures) {
            this.renderFeatures();
        }
    }

    addMediaItem(mediaItem) {
        this.options.project.media.push(mediaItem);
        if (this.isRendered && this.options.showMedia) {
            this.renderMedia();
        }
    }

    addChallenge(challenge) {
        this.options.project.challenges.push(challenge);
        if (this.isRendered && this.options.showChallenges) {
            this.renderChallenges();
        }
    }

    // Section visibility controls
    showSection(sectionName) {
        this.options[`show${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`] = true;
        this.render();
        this.setupEventListeners();
    }

    hideSection(sectionName) {
        this.options[`show${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`] = false;
        if (this.elements[sectionName]) {
            this.elements[sectionName].remove();
            delete this.elements[sectionName];
        }
    }

    // Cleanup method
    destroy() {
        if (this.elements.navigation) {
            this.elements.navigation.remove();
        }
        
        if (this.options.container) {
            this.options.container.innerHTML = '';
        }
        
        this.elements = {};
        this.isRendered = false;
    }

    // Utility methods
    getElement(sectionName) {
        return this.elements[sectionName] || null;
    }

    getAllElements() {
        return { ...this.elements };
    }

    getProjectData() {
        return { ...this.options.project };
    }
    
    // WebsitePreview management
    updatePreviewUrl(newUrl) {
        this.options.project.liveUrl = newUrl;
        if (this.websitePreview) {
            this.websitePreview.updateUrl(newUrl);
        }
    }
    
    refreshPreview() {
        if (this.websitePreview) {
            this.websitePreview.refresh();
        }
    }
    
    getWebsitePreview() {
        return this.websitePreview;
    }
}
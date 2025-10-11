class Header {
    constructor(options = {}) {
        this.options = {
            homeUrl: options.homeUrl || '/',
            logoText: options.logoText || 'HETLAND',
            title: options.title || 'Hetland - Home',
            ariaLabel: options.ariaLabel || 'Go to home page',
            position: options.position || { top: '2rem', left: '2rem' },
            zIndex: options.zIndex || 15,
            ...options
        };
        
        this.headerElement = null;
        this.init();
    }

    init() {
        this.createHeader();
        this.appendToDOM();
        this.setupEventListeners();
    }

    createHeader() {
        // Create the main logo link element
        this.headerElement = document.createElement('a');
        this.headerElement.href = this.options.homeUrl;
        this.headerElement.className = 'company-logo';
        this.headerElement.title = this.options.title;
        this.headerElement.setAttribute('aria-label', this.options.ariaLabel);

        // Create the SVG logo
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '200');
        svg.setAttribute('height', '60');
        svg.setAttribute('viewBox', '0 0 200 60');

        // Create SVG defs and styles
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        style.textContent = `
            .logo-text {
                fill: #d0e8dc;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-weight: 900;
                font-size: 28px;
                letter-spacing: 2px;
                transition: fill 0.3s ease;
            }
        `;
        defs.appendChild(style);
        svg.appendChild(defs);

        // Create the text element
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '10');
        text.setAttribute('y', '35');
        text.setAttribute('class', 'logo-text');
        text.textContent = this.options.logoText;
        svg.appendChild(text);

        this.headerElement.appendChild(svg);
        
        // Apply styles
        this.applyStyles();
    }

    applyStyles() {
        // Apply positioning and styling
        this.headerElement.style.position = 'fixed';
        this.headerElement.style.top = this.options.position.top;
        this.headerElement.style.left = this.options.position.left;
        this.headerElement.style.zIndex = this.options.zIndex;
        this.headerElement.style.width = '150px';
        this.headerElement.style.height = 'auto';
        this.headerElement.style.cursor = 'pointer';
        this.headerElement.style.transition = 'all 0.3s ease';
        this.headerElement.style.opacity = '0.9';
        
        // Animation
        this.headerElement.style.animation = 'fadeInDown 1s ease 0.3s backwards';
        
        // Add hover styles via CSS if not already present
        this.addHoverStyles();
    }

    addHoverStyles() {
        // Check if styles already exist
        if (document.querySelector('#header-hover-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'header-hover-styles';
        style.textContent = `
            .company-logo:hover {
                transform: scale(1.05);
                opacity: 1;
                filter: drop-shadow(0 0 15px rgba(240, 208, 96, 0.3));
            }
            .company-logo:hover .logo-text {
                fill: #f0d060;
            }
            .company-logo svg {
                width: 100%;
                height: auto;
            }
            
            /* Animation keyframes if not already present */
            @keyframes fadeInDown {
                from {
                    opacity: 0;
                    transform: translateY(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Add any specific event listeners if needed
        this.headerElement.addEventListener('click', (e) => {
            // Optional: Add analytics or custom navigation logic here
            // For now, just let the default link behavior work
        });
    }

    appendToDOM() {
        // Append to body
        document.body.appendChild(this.headerElement);
    }

    // Public methods for customization
    updateLogoText(newText) {
        const textElement = this.headerElement.querySelector('.logo-text');
        if (textElement) {
            textElement.textContent = newText;
        }
    }

    updateHomeUrl(newUrl) {
        this.options.homeUrl = newUrl;
        this.headerElement.href = newUrl;
    }

    hide() {
        this.headerElement.style.display = 'none';
    }

    show() {
        this.headerElement.style.display = 'block';
    }

    destroy() {
        if (this.headerElement && this.headerElement.parentNode) {
            this.headerElement.parentNode.removeChild(this.headerElement);
        }
        
        // Remove styles if no other headers exist
        const existingHeaders = document.querySelectorAll('.company-logo');
        if (existingHeaders.length === 0) {
            const styleElement = document.querySelector('#header-hover-styles');
            if (styleElement) {
                styleElement.remove();
            }
        }
    }
}

// Auto-initialize header when script loads
(function() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeHeader);
    } else {
        initializeHeader();
    }
    
    function initializeHeader() {
        // Create header automatically
        window.siteHeader = new Header();
    }
})();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Header;
}
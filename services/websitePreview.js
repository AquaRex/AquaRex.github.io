/**
 * Website Preview Component
 * A reusable component for displaying live websites in embedded frames
 * Can be used in phone mockups, desktop previews, or any custom container
 */

class WebsitePreview {
    constructor(options = {}) {
        this.options = {
            // Container element where the preview will be rendered
            container: options.container || null,
            
            // Website URL to display
            url: options.url || '',
            
            // Preview dimensions
            width: options.width || 320,
            height: options.height || 640,
            
            // Preview type and styling
            previewType: options.previewType || 'phone', // 'phone', 'desktop', 'tablet', 'custom'
            
            // Custom styling options
            borderRadius: options.borderRadius || '25px',
            backgroundColor: options.backgroundColor || '#f0f0f0',
            border: options.border || '3px solid #333',
            boxShadow: options.boxShadow || '0 25px 80px rgba(0, 0, 0, 0.3)',
            
            // Phone-specific options
            showPhoneFrame: options.showPhoneFrame !== false,
            phoneColor: options.phoneColor || '#2c2c2c',
            
            // Loading and error handling
            showLoadingSpinner: options.showLoadingSpinner !== false,
            loadingText: options.loadingText || 'Loading website...',
            errorText: options.errorText || 'Unable to load website',
            fallbackImage: options.fallbackImage || null,
            
            // Interaction options
            allowInteraction: options.allowInteraction !== false,
            openInNewTab: options.openInNewTab !== false,
            
            // Callbacks
            onLoad: options.onLoad || null,
            onError: options.onError || null,
            onClick: options.onClick || null
        };
        
        this.isLoaded = false;
        this.hasError = false;
        this.element = null;
        this.iframe = null;
        
        if (this.options.container) {
            this.render();
        }
    }
    
    render() {
        if (!this.options.container) {
            console.error('WebsitePreview: No container specified');
            return;
        }
        
        // Create the main preview container
        this.element = document.createElement('div');
        this.element.className = `website-preview preview-${this.options.previewType}`;
        
        // Apply custom styling
        this.element.style.width = `${this.options.width}px`;
        this.element.style.height = `${this.options.height}px`;
        this.element.style.borderRadius = this.options.borderRadius;
        this.element.style.backgroundColor = this.options.backgroundColor;
        this.element.style.border = this.options.border;
        this.element.style.boxShadow = this.options.boxShadow;
        this.element.style.position = 'relative';
        this.element.style.overflow = 'hidden';
        
        // Add phone frame if specified
        if (this.options.showPhoneFrame && this.options.previewType === 'phone') {
            this.addPhoneFrame();
        }
        
        // Create iframe container
        const iframeContainer = document.createElement('div');
        iframeContainer.className = 'iframe-container';
        iframeContainer.style.width = '100%';
        iframeContainer.style.height = '100%';
        iframeContainer.style.position = 'relative';
        
        // Create loading spinner
        if (this.options.showLoadingSpinner) {
            this.createLoadingSpinner(iframeContainer);
        }
        
        // Create iframe
        this.createIframe(iframeContainer);
        
        // Add click handler if needed
        if (this.options.openInNewTab || this.options.onClick) {
            this.element.style.cursor = 'pointer';
            this.element.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.options.onClick) {
                    this.options.onClick(this.options.url, this);
                } else if (this.options.openInNewTab) {
                    window.open(this.options.url, '_blank');
                }
            });
        }
        
        this.element.appendChild(iframeContainer);
        this.options.container.appendChild(this.element);
        
        return this.element;
    }
    
    addPhoneFrame() {
        // Add phone-style decorative elements
        this.element.style.background = `linear-gradient(145deg, ${this.options.phoneColor}, #1a1a1a)`;
        this.element.style.padding = '20px';
        
        // Top notch/speaker
        const topNotch = document.createElement('div');
        topNotch.className = 'phone-notch';
        topNotch.style.position = 'absolute';
        topNotch.style.top = '35px';
        topNotch.style.left = '50%';
        topNotch.style.transform = 'translateX(-50%)';
        topNotch.style.width = '100px';
        topNotch.style.height = '6px';
        topNotch.style.backgroundColor = '#555';
        topNotch.style.borderRadius = '3px';
        topNotch.style.zIndex = '10';
        this.element.appendChild(topNotch);
        
        // Home button
        const homeButton = document.createElement('div');
        homeButton.className = 'phone-home-button';
        homeButton.style.position = 'absolute';
        homeButton.style.bottom = '22px';
        homeButton.style.left = '50%';
        homeButton.style.transform = 'translateX(-50%)';
        homeButton.style.width = '70px';
        homeButton.style.height = '70px';
        homeButton.style.background = 'radial-gradient(circle, #333 30%, transparent 30%)';
        homeButton.style.borderRadius = '50%';
        homeButton.style.border = '3px solid #444';
        homeButton.style.zIndex = '10';
        this.element.appendChild(homeButton);
        
        // Inner screen area
        const screenArea = document.createElement('div');
        screenArea.className = 'phone-screen-area';
        screenArea.style.position = 'absolute';
        screenArea.style.top = '20px';
        screenArea.style.left = '20px';
        screenArea.style.right = '20px';
        screenArea.style.bottom = '20px';
        screenArea.style.borderRadius = '38px';
        screenArea.style.overflow = 'hidden';
        screenArea.style.border = '3px solid rgba(255, 255, 255, 0.1)';
        this.element.appendChild(screenArea);
    }
    
    createLoadingSpinner(container) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'website-preview-loading';
        loadingDiv.style.position = 'absolute';
        loadingDiv.style.top = '0';
        loadingDiv.style.left = '0';
        loadingDiv.style.width = '100%';
        loadingDiv.style.height = '100%';
        loadingDiv.style.display = 'flex';
        loadingDiv.style.alignItems = 'center';
        loadingDiv.style.justifyContent = 'center';
        loadingDiv.style.backgroundColor = 'rgba(240, 240, 240, 0.9)';
        loadingDiv.style.zIndex = '5';
        
        loadingDiv.innerHTML = `
            <div style="text-align: center; color: #666;">
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                <div>${this.options.loadingText}</div>
            </div>
        `;
        
        // Add CSS animation for spinner
        if (!document.getElementById('website-preview-styles')) {
            const style = document.createElement('style');
            style.id = 'website-preview-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        container.appendChild(loadingDiv);
        this.loadingElement = loadingDiv;
    }
    
    createIframe(container) {
        this.iframe = document.createElement('iframe');
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';
        this.iframe.style.border = 'none';
        this.iframe.style.borderRadius = 'inherit';
        
        if (!this.options.allowInteraction) {
            this.iframe.style.pointerEvents = 'none';
        }
        
        // Handle iframe load events
        this.iframe.addEventListener('load', () => {
            console.log('🔄 Iframe load event fired for:', this.options.url);
            try {
                // Try to access iframe content to see if it actually loaded
                const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow.document;
                if (iframeDoc && iframeDoc.title) {
                    console.log('✅ Iframe content accessible, title:', iframeDoc.title);
                    this.isLoaded = true;
                } else {
                    console.log('⚠️ Iframe loaded but content not accessible (likely CORS blocked)');
                    this.isLoaded = true; // Still consider it loaded even if we can't access content
                }
            } catch (e) {
                console.log('⚠️ Iframe loaded but content blocked by CORS policy');
                this.isLoaded = true; // Still consider it loaded
            }
            
            if (this.loadingElement) {
                this.loadingElement.style.display = 'none';
            }
            if (this.options.onLoad) {
                this.options.onLoad(this);
            }
        });
        
        this.iframe.addEventListener('error', () => {
            console.log('❌ Iframe error event fired for:', this.options.url);
            this.hasError = true;
            this.showError();
            if (this.options.onError) {
                this.options.onError(this);
            }
        });
        
        // Handle cases where iframe content fails to load
        setTimeout(() => {
            if (!this.isLoaded && !this.hasError) {
                console.log('⏰ Iframe timeout - no load or error event after 10 seconds');
                this.hasError = true;
                this.showError();
                if (this.options.onError) {
                    this.options.onError(this);
                }
            }
        }, 10000); // 10 second timeout
        
        if (this.options.url) {
            console.log('🚀 Setting iframe src to:', this.options.url);
            this.iframe.src = this.options.url;
        }
        
        container.appendChild(this.iframe);
    }
    
    showError() {
        if (this.loadingElement) {
            this.loadingElement.innerHTML = `
                <div style="text-align: center; color: #e74c3c;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
                    <div>${this.options.errorText}</div>
                    ${this.options.fallbackImage ? `<img src="${this.options.fallbackImage}" style="max-width: 100%; margin-top: 10px; border-radius: 8px;" alt="Preview">` : ''}
                </div>
            `;
            this.loadingElement.style.display = 'flex';
        }
    }
    
    // Public methods
    updateUrl(newUrl) {
        this.options.url = newUrl;
        this.isLoaded = false;
        this.hasError = false;
        
        if (this.loadingElement) {
            this.loadingElement.style.display = 'flex';
            this.loadingElement.innerHTML = `
                <div style="text-align: center; color: #666;">
                    <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                    <div>${this.options.loadingText}</div>
                </div>
            `;
        }
        
        if (this.iframe) {
            this.iframe.src = newUrl;
        }
    }
    
    refresh() {
        if (this.iframe && this.options.url) {
            this.iframe.src = this.iframe.src; // Force reload
        }
    }
    
    resize(width, height) {
        this.options.width = width;
        this.options.height = height;
        
        if (this.element) {
            this.element.style.width = `${width}px`;
            this.element.style.height = `${height}px`;
        }
    }
    
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.iframe = null;
        this.loadingElement = null;
    }
    
    // Static helper methods
    static createPhonePreview(container, url, options = {}) {
        return new WebsitePreview({
            container,
            url,
            previewType: 'phone',
            width: 320,
            height: 640,
            ...options
        });
    }
    
    static createDesktopPreview(container, url, options = {}) {
        return new WebsitePreview({
            container,
            url,
            previewType: 'desktop',
            width: 800,
            height: 600,
            borderRadius: '8px',
            showPhoneFrame: false,
            ...options
        });
    }
    
    static createTabletPreview(container, url, options = {}) {
        return new WebsitePreview({
            container,
            url,
            previewType: 'tablet',
            width: 500,
            height: 700,
            borderRadius: '20px',
            showPhoneFrame: false,
            ...options
        });
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebsitePreview;
}
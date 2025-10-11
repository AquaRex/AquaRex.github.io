/**
 * Blog List Element Template
 * Defines the visual design and structure for blog post entries
 * Uses minimal frames by default
 */

class BlogListElement {
    constructor() {
        this.template = this.createTemplate();
    }

    // Get the default frame type for this element type
    getDefaultFrameType() {
        return 'minimal';
    }

    // Create the HTML template for a blog post entry
    createTemplate() {
        return `
            <div class="blog-row" data-item-id="{{id}}">
                <div class="blog-date">
                    <span class="blog-month">{{month}}</span>
                    <span class="blog-day">{{day}}</span>
                    <span class="blog-year">{{year}}</span>
                </div>
                <div class="blog-content">
                    <h3 class="blog-title">{{title}}</h3>
                    <p class="blog-excerpt">{{description}}</p>
                    <div class="blog-tags">
                        {{tags}}
                    </div>
                    <div class="blog-meta">
                        <span class="blog-author">By {{author}}</span>
                        <span class="blog-read-time">{{readTime}} min read</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate tags HTML
    generateTags(post) {
        if (!post.tags || post.tags.length === 0) return '';
        
        return post.tags.map(tag => 
            `<span class="blog-tag">${tag}</span>`
        ).join('');
    }

    // Parse date for display
    parseDate(dateString) {
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        return {
            month: months[date.getMonth()],
            day: date.getDate().toString().padStart(2, '0'),
            year: date.getFullYear()
        };
    }

    // Main render method
    render(post) {
        const dateInfo = this.parseDate(post.publishDate || post.startDate || new Date());
        
        return this.template
            .replace(/{{id}}/g, post.id)
            .replace(/{{title}}/g, post.title || 'Untitled')
            .replace(/{{description}}/g, post.description || post.excerpt || '')
            .replace(/{{author}}/g, post.author || 'Anonymous')
            .replace(/{{readTime}}/g, post.readTime || '5')
            .replace(/{{month}}/g, dateInfo.month)
            .replace(/{{day}}/g, dateInfo.day)
            .replace(/{{year}}/g, dateInfo.year)
            .replace(/{{tags}}/g, this.generateTags(post));
    }
}

// Export for use in other files
window.BlogListElement = BlogListElement;
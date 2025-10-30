function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        return '';
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function safeSetHTML(element, htmlContent, isTemplate = false) {
    if (!element) return;
    
    if (isTemplate) {
        element.innerHTML = htmlContent;
    } else {
        element.textContent = htmlContent;
    }
}

function safeSetInnerHTML(element, htmlContent) {
    if (!element) return;
    
    const tempDiv = document.createElement('div');
    tempDiv.textContent = htmlContent;
    element.innerHTML = tempDiv.innerHTML;
}

function createSafeElement(tag, textContent, className = '') {
    const element = document.createElement(tag);
    if (textContent) {
        element.textContent = textContent;
    }
    if (className) {
        element.className = className;
    }
    return element;
}

window.escapeHtml = escapeHtml;
window.safeSetHTML = safeSetHTML;
window.safeSetInnerHTML = safeSetInnerHTML;
window.createSafeElement = createSafeElement;
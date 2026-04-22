/* ==========================================================================
   CV3 Shared Layout — shadow-layer + dark-mode persistence
   Shared between cv3 and any extension pages (e.g. cvprojects).

   Required DOM:
     - <div id="cv3NavShadowLayer" aria-hidden="true"></div>
     - <div id="cv3ShadowLayer" aria-hidden="true"></div>
     - <div id="cv3RenderRoot"> ... page content ... </div>
     - <button id="cv3DarkToggle">  (in nav)
     - <button id="cv3GlassToggle"> (in nav, with .is-active by default)

   localStorage keys (shared across cv3 ↔ cvprojects):
     - cv3-dark-mode      "1" | "0"
     - cv3-shadow-visible "1" | "0"
   ========================================================================== */

(function () {
    'use strict';

    /* ===== SVG ICONS ===== */
    const SUN_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>`;
    const MOON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>`;

    /* ===== STATE ===== */
    let shadowSyncFrame = null;
    let hoveredKeys = new Set();
    let bottomLayerVisible = false;

    const HOVER_SELECTOR = [
        '.cv3-nav-toggle',
        '.cv3-nav-back',
        '.cv3-hero-link',
        '.cv3-field',
        '.cv3-project',
        '.cv3-skill-tag',
        '.cv3-read-more',
        '.cv3-popup-close',
        '.cvp-filter-tag',
        '.cvp-filter-clear',
        '.cv3-project-tag',
        'a'
    ].join(', ');

    /* ===== HELPERS ===== */
    function stripIdsFromClone(root) {
        if (!root || root.nodeType !== Node.ELEMENT_NODE) return;
        root.removeAttribute('id');
        root.removeAttribute('onclick');
        root.querySelectorAll('[id], [onclick]').forEach((node) => {
            node.removeAttribute('id');
            node.removeAttribute('onclick');
        });
    }

    function assignShadowKeys(sourceRoot) {
        const nodes = sourceRoot.querySelectorAll(HOVER_SELECTOR);
        nodes.forEach((node, index) => { node.dataset.shadowKey = String(index); });
    }

    function applyHoveredState() {
        const renderRoot  = document.getElementById('cv3RenderRoot');
        const shadowLayer = document.getElementById('cv3ShadowLayer');
        if (!renderRoot || !shadowLayer) return;

        renderRoot.querySelectorAll('.is-hovered').forEach((n) => n.classList.remove('is-hovered'));
        shadowLayer.querySelectorAll('.is-hovered').forEach((n) => n.classList.remove('is-hovered'));

        hoveredKeys.forEach((key) => {
            const src   = renderRoot.querySelector(`[data-shadow-key="${key}"]`);
            const clone = shadowLayer.querySelector(`[data-shadow-key="${key}"]`);
            if (src)   src.classList.add('is-hovered');
            if (clone) clone.classList.add('is-hovered');
        });
    }

    function collectHoverKeys(target, root) {
        const keys = new Set();
        let cur = target;
        while (cur && cur !== root) {
            if (cur.matches && cur.matches(HOVER_SELECTOR) && cur.dataset.shadowKey) {
                keys.add(cur.dataset.shadowKey);
            }
            cur = cur.parentElement;
        }
        return keys;
    }

    function updateHoveredKeys(nextKeys) {
        const changed = nextKeys.size !== hoveredKeys.size || [...nextKeys].some((k) => !hoveredKeys.has(k));
        if (!changed) return;
        hoveredKeys = nextKeys;
        applyHoveredState();
    }

    /* ===== SHADOW SYNC ===== */
    function syncShadowLayer() {
        shadowSyncFrame = null;
        const renderRoot  = document.getElementById('cv3RenderRoot');
        const shadowLayer = document.getElementById('cv3ShadowLayer');
        if (!renderRoot || !shadowLayer) return;
        if (!bottomLayerVisible) return;

        const rootStyle = getComputedStyle(document.documentElement);
        const offsetX = parseFloat(rootStyle.getPropertyValue('--cv3-shadow-offset-x')) || 0;
        const offsetY = parseFloat(rootStyle.getPropertyValue('--cv3-shadow-offset-y')) || 0;

        const rect = renderRoot.getBoundingClientRect();
        shadowLayer.style.top    = `${window.scrollY + rect.top + offsetY}px`;
        shadowLayer.style.left   = `${window.scrollX + rect.left + offsetX}px`;
        shadowLayer.style.width  = `${rect.width}px`;
        shadowLayer.style.height = `${renderRoot.offsetHeight}px`;

        assignShadowKeys(renderRoot);

        const clone = renderRoot.cloneNode(true);
        stripIdsFromClone(clone);
        clone.style.margin = '0';
        shadowLayer.innerHTML = '';
        shadowLayer.appendChild(clone);

        applyHoveredState();
    }

    function scheduleShadowSync() {
        if (shadowSyncFrame !== null) return;
        shadowSyncFrame = window.requestAnimationFrame(syncShadowLayer);
    }

    function setBottomLayerVisible(visible, persist) {
        bottomLayerVisible = !!visible;
        const shadowLayer    = document.getElementById('cv3ShadowLayer');
        const navShadowLayer = document.getElementById('cv3NavShadowLayer');
        const glassBtn       = document.getElementById('cv3GlassToggle');
        if (shadowLayer)    shadowLayer.style.display = bottomLayerVisible ? '' : 'none';
        if (navShadowLayer) navShadowLayer.style.display = 'none';
        if (glassBtn) {
            glassBtn.classList.toggle('is-active', !bottomLayerVisible);
            glassBtn.setAttribute('aria-pressed', bottomLayerVisible ? 'true' : 'false');
            glassBtn.title = bottomLayerVisible ? 'Hide Shadow Layer' : 'Show Shadow Layer';
        }
        if (persist) {
            try { localStorage.setItem('cv3-shadow-visible', bottomLayerVisible ? '1' : '0'); } catch (_) {}
        }
        if (bottomLayerVisible) scheduleShadowSync();
    }

    function initShadowLayer() {
        const root = document.getElementById('cv3RenderRoot');
        if (!root) return;

        const mo = new MutationObserver(() => scheduleShadowSync());
        mo.observe(root, { subtree: true, childList: true, characterData: true, attributes: true });

        root.addEventListener('pointermove', (e) => {
            updateHoveredKeys(collectHoverKeys(e.target, root));
        });
        root.addEventListener('pointerleave', () => updateHoveredKeys(new Set()));

        window.addEventListener('scroll', scheduleShadowSync, { passive: true });
        window.addEventListener('resize', scheduleShadowSync);
        window.addEventListener('load', scheduleShadowSync);
    }

    /* ===== DARK MODE ===== */
    function applyDarkMode(isDark) {
        document.body.classList.toggle('dark-mode', !!isDark);
        const toggle = document.getElementById('cv3DarkToggle');
        if (toggle) toggle.innerHTML = isDark ? MOON_SVG : SUN_SVG;
    }

    function initDarkMode() {
        const toggle = document.getElementById('cv3DarkToggle');
        let isDark = false;
        try { isDark = localStorage.getItem('cv3-dark-mode') === '1'; } catch (_) {}
        applyDarkMode(isDark);

        if (toggle) {
            toggle.addEventListener('click', (e) => {
                if (e.shiftKey && typeof window.toggleColorConfigurator === 'function') {
                    window.toggleColorConfigurator();
                    return;
                }
                const next = !document.body.classList.contains('dark-mode');
                applyDarkMode(next);
                try { localStorage.setItem('cv3-dark-mode', next ? '1' : '0'); } catch (_) {}
                scheduleShadowSync();
            });
        }
    }

    /* ===== GLASS TOGGLE ===== */
    function initGlassToggle() {
        const glassToggle = document.getElementById('cv3GlassToggle');
        if (!glassToggle) return;
        glassToggle.addEventListener('click', () => {
            setBottomLayerVisible(!bottomLayerVisible, true);
        });
        let stored = '0';
        try { stored = localStorage.getItem('cv3-shadow-visible') || '0'; } catch (_) {}
        setBottomLayerVisible(stored === '1', false);
    }

    /* ===== INIT ===== */
    function init() {
        initDarkMode();
        initShadowLayer();
        initGlassToggle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ===== PUBLIC API ===== */
    window.cv3Layout = {
        scheduleShadowSync,
        setBottomLayerVisible,
        applyDarkMode,
    };
})();

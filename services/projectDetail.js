/* =================================================================
   PROJECT DETAIL PAGE — renderer
   Looks up window.PROJECT_REF = { company, name } in window.CV_DATA
   and renders a CV3-style detail page into <div id="pdRoot"></div>.
   ================================================================= */
(function () {
    function esc(v) {
        return String(v ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function slugify(s) {
        return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    }

    function findProject(ref) {
        const data = window.CV_DATA || {};
        const wantCompany = (ref.company || '').toLowerCase();
        const wantName    = (ref.name || '').toLowerCase();

        const groups = [];
        (data.experience || []).forEach(e => {
            if ((e.projects || []).length) {
                groups.push({ company: e.org || e.title, projects: e.projects });
            }
        });
        (data.projects || []).forEach(g => {
            if ((g.projects || []).length) {
                groups.push({ company: g.title, projects: g.projects });
            }
        });

        for (const g of groups) {
            if (g.company.toLowerCase() !== wantCompany) continue;
            const p = g.projects.find(p => (p.name || '').toLowerCase() === wantName);
            if (p) return { project: p, group: g };
        }
        return { project: null, group: null };
    }

    /* ===== ICONS ===== */
    const _SI = body =>
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true">${body}</svg>`;
    const ICONS = {
        image:    _SI('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>'),
        info:     _SI('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'),
        desc:     _SI('<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/>'),
        tags:     _SI('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'),
        link:     _SI('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
        company:  _SI('<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'),
        related:  _SI('<polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/>'),
        media:    _SI('<rect x="3" y="3" width="18" height="14" rx="2" ry="2"/><circle cx="9" cy="9" r="1.5"/><polyline points="21,13 16,8 7,17"/><line x1="3" y1="21" x2="21" y2="21"/>'),
    };

    /* ===== RENDER ===== */
    function render() {
        const root = document.getElementById('pdRoot');
        const ref  = window.PROJECT_REF || {};
        const { project, group } = findProject(ref);

        if (!project) {
            root.innerHTML = `
                <div id="cv3NavShadowLayer" aria-hidden="true"></div>
                <div id="cv3ShadowLayer" aria-hidden="true"></div>
                <div id="cv3RenderRoot">
                    <div class="cv3-outer">
                        <nav class="cv3-nav">
                            <div class="cv3-nav-left">THOMAS HETLAND <span style="opacity:0.5">/ NOT FOUND</span></div>
                        </nav>
                        <div class="cv3-section">
                            <div class="cv3-section-content">
                                <h2>Project not found</h2>
                                <p>Could not find <code>${esc(ref.name)}</code> under <code>${esc(ref.company)}</code> in CV data.</p>
                            </div>
                        </div>
                    </div>
                </div>`;
            return;
        }

        const name        = esc(project.name || '');
        const summary     = esc(project.summary || '');
        const description = (project.popupDescription || project.summary || '')
            .split(/\n+/).map(p => `<p>${esc(p)}</p>`).join('');
        const image       = esc(project.image || '');
        const heroVideo   = esc(project.heroVideo || '');
        const tags        = (project.tags || []);
        const date        = esc(project.date || '');
        const status      = esc(project.status || 'Published');
        const companyName = esc(group.company);

        const heroMediaHtml = heroVideo
            ? `<div class="pd-hero"><video class="pd-hero-video" src="${heroVideo}" ${image ? `poster="${image}"` : ''} autoplay muted loop playsinline preload="metadata"></video></div>`
            : (image ? `<div class="pd-hero"><img src="${image}" alt="${name}"></div>` : '');

        const tagsHtml = tags.length
            ? `<div class="pd-tags">${tags.map(t => `<span class="pd-tag">${esc(t)}</span>`).join('')}</div>`
            : '<p style="color:var(--muted);font-size:0.8rem;">No tags</p>';

        // Sibling projects (within same group)
        const siblings = (group.projects || []).filter(p =>
            (p.name || '').toLowerCase() !== (project.name || '').toLowerCase()
        );
        const siblingsHtml = siblings.length
            ? `<div class="pd-related">
                ${siblings.map(s => {
                    const sName = esc(s.name || '');
                    const sImg  = esc(s.image || '');
                    const sUrl  = projectDetailUrlFor(group.company, s);
                    return `<a class="pd-related-item" href="${esc(sUrl)}">
                        <div class="pd-related-thumb">${sImg ? `<img src="${sImg}" alt="${sName}">` : ''}</div>
                        <div class="pd-related-name">${sName}</div>
                    </a>`;
                }).join('')}
            </div>`
            : '<p style="color:var(--muted);font-size:0.8rem;">No other projects.</p>';

        const sectionsHtml = `
            <main class="cv3-main">
                <section class="cv3-section">
                    <div class="cv3-strip">${ICONS.image}<span class="cv3-strip-num">01</span></div>
                    ${heroMediaHtml}
                    <h1 class="pd-title">${name}</h1>
                    <p class="pd-subtitle">${summary}</p>
                </section>

                <section class="cv3-section">
                    <div class="cv3-strip">${ICONS.desc}<span class="cv3-strip-num">02</span></div>
                    <div class="cv3-section-header">${ICONS.desc} OVERVIEW</div>
                    <div class="cv3-section-content">
                        <div class="pd-desc">${description}</div>
                    </div>
                </section>

                <section class="cv3-section pd-media-section" id="pdMediaSection" hidden>
                    <div class="cv3-strip">${ICONS.media}<span class="cv3-strip-num">03</span></div>
                    <div class="cv3-section-header">${ICONS.media} MEDIA</div>
                    <div class="cv3-section-content">
                        <div class="pd-media" id="pdMediaGrid"></div>
                    </div>
                </section>

                <section class="cv3-section">
                    <div class="cv3-strip">${ICONS.tags}<span class="cv3-strip-num">04</span></div>
                    <div class="cv3-section-header">${ICONS.tags} TECHNOLOGIES</div>
                    <div class="cv3-section-content">${tagsHtml}</div>
                </section>
            </main>`;

        const sidebarHtml = `
            <aside class="cv3-sidebar">
                <div class="cv3-sidebar-card">
                    <div class="cv3-sidebar-card-header">
                        ${ICONS.info}
                        <span class="cv3-sidebar-card-header-text">PROJECT INFO</span>
                    </div>
                    <div class="cv3-sidebar-card-body">
                        <div class="pd-info-row">
                            <span class="pd-info-label">Company</span>
                            <span class="pd-info-value">${companyName}</span>
                        </div>
                        ${date ? `
                        <div class="pd-info-row">
                            <span class="pd-info-label">Date</span>
                            <span class="pd-info-value">${date}</span>
                        </div>` : ''}
                        <div class="pd-info-row">
                            <span class="pd-info-label">Status</span>
                            <span class="pd-status-pill" data-status-tag="${status}">${status}</span>
                        </div>
                    </div>
                </div>

                <div class="cv3-sidebar-card">
                    <div class="cv3-sidebar-card-header">
                        ${ICONS.related}
                        <span class="cv3-sidebar-card-header-text">MORE FROM ${companyName.toUpperCase()}</span>
                    </div>
                    <div class="cv3-sidebar-card-body">${siblingsHtml}</div>
                </div>
            </aside>`;

        root.innerHTML = `
            <div id="cv3NavShadowLayer" aria-hidden="true"></div>
            <div id="cv3ShadowLayer" aria-hidden="true"></div>
            <div id="cv3RenderRoot">
            <div class="cv3-outer">
                <nav class="cv3-nav">
                    <div class="cv3-nav-left">THOMAS HETLAND <span style="opacity:0.5">/ ${companyName.toUpperCase()} / ${name}</span></div>
                    <div class="cv3-nav-right">
                        <a href="/projects/" class="cv3-nav-back" title="All Projects" aria-label="All Projects">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <line x1="19" y1="12" x2="5" y2="12"/>
                                <polyline points="12 19 5 12 12 5"/>
                            </svg>
                        </a>
                        <button class="cv3-nav-toggle is-active" id="cv3GlassToggle" title="Show Shadow Layer" aria-label="Toggle shadow layer" aria-pressed="false">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <circle cx="8.2" cy="11.0" r="3.6" opacity="0.95"></circle>
                                <circle cx="14.9" cy="8.2" r="2.4" opacity="0.75"></circle>
                                <circle cx="14.8" cy="15.2" r="3.2" opacity="0.85"></circle>
                            </svg>
                        </button>
                        <button class="cv3-nav-toggle" id="cv3DarkToggle" aria-label="Toggle dark mode">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                            </svg>
                        </button>
                    </div>
                </nav>
                <div class="cv3-body">
                    ${sectionsHtml}
                    ${sidebarHtml}
                </div>
            </div>
            </div>`;

        document.title = `${project.name} — ${group.company} — Thomas Hetland`;
        setupHeroVideo(root);

        const folderName = [slugify(group.company), slugify(project.name)].filter(Boolean).join('_');
        loadMedia(folderName);
    }

    function setupHeroVideo(root) {
        const video = root.querySelector('.pd-hero-video');
        if (!video) return;
        const hero = video.closest('.pd-hero');
        const poster = video.getAttribute('poster') || '';
        video.muted = true;
        video.defaultMuted = true;
        video.loop = true;
        video.removeAttribute('controls');

        const fallbackToPoster = () => {
            if (!hero || !poster) return;
            hero.innerHTML = `<img src="${esc(poster)}" alt="">`;
        };

        const tryAutoplay = () => {
            const p = video.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
        };
        tryAutoplay();

        const showControls = () => video.setAttribute('controls', 'controls');
        const hideControls = () => video.removeAttribute('controls');

        video.addEventListener('mouseenter', showControls);
        video.addEventListener('mouseleave', hideControls);
        video.addEventListener('focus', showControls);
        video.addEventListener('blur', hideControls);
        video.addEventListener('error', fallbackToPoster, { once: true });
    }

    function loadMedia(projectSlug) {
        const section = document.getElementById('pdMediaSection');
        const grid    = document.getElementById('pdMediaGrid');
        if (!section || !grid || !projectSlug) return;

        const ref  = window.PROJECT_REF || {};
        const { project } = findProject(ref);
        const excludedPaths = new Set([project && project.image, project && project.heroVideo].filter(Boolean).map(String));

        const imageFolder = `/assets/images/projects/${projectSlug}/`;
        const videoFolder = `/assets/videos/projects/${projectSlug}/`;

        // Load gallery.json (order + captions) in parallel with manifest.json
        // (raw file list). gallery.json wins for ordering and provides
        // captions; manifest.json fills in any files not yet in gallery.json.
        Promise.all([
            fetch(`${imageFolder}gallery.json`,  { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(`${imageFolder}manifest.json`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(`${videoFolder}manifest.json`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]).then(([gallery, imageManifest, videoManifest]) => {
            const imageManifestKnown = Array.isArray(imageManifest);
            const videoManifestKnown = Array.isArray(videoManifest);
            const imageOnDisk = new Set(
                imageManifestKnown
                    ? imageManifest.filter(n => typeof n === 'string')
                    : []
            );
            const videoOnDisk = new Set(
                videoManifestKnown
                    ? videoManifest.filter(n => typeof n === 'string')
                    : []
            );
            const kindFromName = (name) => /\.(mp4|webm|ogg|mov|m4v)$/i.test(name) ? 'video' : 'image';
            const buildPath = (name, kind) => `${kind === 'video' ? videoFolder : imageFolder}${name}`;
            let items = [];
            if (Array.isArray(gallery)) {
                items = gallery
                    .map(it => {
                        if (!it || typeof it !== 'object') return null;
                        if (typeof it.path === 'string' && it.path) {
                            const path = String(it.path);
                            if (excludedPaths.has(path)) return null;
                            const name = path.split('/').pop() || '';
                            return {
                                path,
                                name,
                                kind: kindFromName(name),
                                caption: String(it.caption || ''),
                            };
                        }
                        if (typeof it.name === 'string' && it.name) {
                            const kind = kindFromName(it.name);
                            const path = buildPath(it.name, kind);
                            if (excludedPaths.has(path)) return null;
                            return {
                                path,
                                name: it.name,
                                kind,
                                caption: String(it.caption || ''),
                            };
                        }
                        return null;
                    })
                    .filter(Boolean);
            }
            // Keep only files that still exist on disk for local media folders.
            items = items.filter(it => {
                const n = it.name || '';
                if (!n) return false;
                return it.kind === 'video'
                    ? (!videoManifestKnown || videoOnDisk.has(n))
                    : (!imageManifestKnown || imageOnDisk.has(n));
            });

            // Append any on-disk files not already represented (no caption).
            const known = new Set(items.map(it => it.path));
            if (imageOnDisk.size) {
                [...imageOnDisk]
                    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
                    .forEach(name => {
                        const path = `${imageFolder}${name}`;
                        if (!known.has(path) && !excludedPaths.has(path)) items.push({ path, name, kind: 'image', caption: '' });
                    });
            }
            if (videoOnDisk.size) {
                [...videoOnDisk]
                    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
                    .forEach(name => {
                        const path = `${videoFolder}${name}`;
                        if (!known.has(path) && !excludedPaths.has(path)) items.push({ path, name, kind: 'video', caption: '' });
                    });
            }
            if (!items.length) return;

            grid.innerHTML = items.map((it, i) => {
                const src = it.path;
                return `<a class="pd-media-item" href="${esc(src)}" data-index="${i}" data-kind="${esc(it.kind)}">
                    ${it.kind === 'video'
                        ? `<video src="${esc(src)}" muted playsinline preload="metadata"></video>`
                        : `<img src="${esc(src)}" alt="${esc(it.caption || it.name)}" loading="lazy">`}
                </a>`;
            }).join('');
            grid.querySelectorAll('.pd-media-item video').forEach(v => {
                v.pause();
                v.currentTime = 0;
                v.addEventListener('mouseenter', () => {
                    v.play().catch(() => {});
                });
                v.addEventListener('mouseleave', () => {
                    v.pause();
                    v.currentTime = 0;
                });
            });
            section.hidden = false;
            installLightbox(grid, items.map(it => ({ src: it.path, kind: it.kind, caption: it.caption })));
        });
    }

    function installLightbox(grid, slides) {
        let overlay = document.getElementById('pdLightbox');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'pdLightbox';
            overlay.className = 'pd-lightbox';
            overlay.innerHTML = `
                <button class="pd-lightbox-btn pd-lightbox-close" type="button" aria-label="Close">&times;</button>
                <button class="pd-lightbox-btn pd-lightbox-prev" type="button" aria-label="Previous">&#8592;</button>
                <button class="pd-lightbox-btn pd-lightbox-next" type="button" aria-label="Next">&#8594;</button>
                <img class="pd-lightbox-img" alt="">
                <video class="pd-lightbox-video" controls playsinline preload="metadata"></video>
                <div class="pd-lightbox-caption"></div>
                <div class="pd-lightbox-counter"></div>`;
            document.body.appendChild(overlay);
        }
        const imgEl     = overlay.querySelector('.pd-lightbox-img');
        const videoEl   = overlay.querySelector('.pd-lightbox-video');
        const counterEl = overlay.querySelector('.pd-lightbox-counter');
        const captionEl = overlay.querySelector('.pd-lightbox-caption');
        const closeBtn  = overlay.querySelector('.pd-lightbox-close');
        const prevBtn   = overlay.querySelector('.pd-lightbox-prev');
        const nextBtn   = overlay.querySelector('.pd-lightbox-next');

        let index = 0;
        function show(i) {
            if (!slides.length) return;
            index = ((i % slides.length) + slides.length) % slides.length;
            const s = slides[index];
            if (s.kind === 'video') {
                imgEl.style.display = 'none';
                imgEl.removeAttribute('src');
                videoEl.style.display = 'block';
                videoEl.src = s.src;
                videoEl.play().catch(() => {});
            } else {
                videoEl.style.display = 'none';
                videoEl.pause();
                videoEl.removeAttribute('src');
                imgEl.style.display = '';
                imgEl.src = s.src;
            }
            counterEl.textContent = `${index + 1} / ${slides.length}`;
            const cap = (s.caption || '').trim();
            captionEl.textContent = cap;
            captionEl.style.display = cap ? '' : 'none';
        }
        function open(i) {
            show(i);
            overlay.classList.add('is-open');
            document.addEventListener('keydown', onKey);
        }
        function close() {
            overlay.classList.remove('is-open');
            imgEl.removeAttribute('src');
            videoEl.pause();
            videoEl.removeAttribute('src');
            document.removeEventListener('keydown', onKey);
        }
        function onKey(e) {
            if (e.key === 'Escape')      close();
            else if (e.key === 'ArrowLeft')  show(index - 1);
            else if (e.key === 'ArrowRight') show(index + 1);
        }

        closeBtn.onclick = close;
        prevBtn.onclick  = (e) => { e.stopPropagation(); show(index - 1); };
        nextBtn.onclick  = (e) => { e.stopPropagation(); show(index + 1); };
        overlay.onclick  = (e) => { if (e.target === overlay) close(); };

        grid.querySelectorAll('.pd-media-item').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                open(parseInt(a.dataset.index, 10) || 0);
            });
        });
    }

    function projectDetailUrlFor(company, project) {
        const cSlug = slugify(company);
        const pSlug = slugify(project.name);
        return `/projects/${cSlug}/${pSlug}/`;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }
})();

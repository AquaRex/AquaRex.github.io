/* =================================================================
   PROJECTS GALLERY VIEW — builds the /projects/ gallery, sidebar
   filters, search, and status/tag toggles from window.CV_DATA /
   PROJECTS_DATA. Extracted from the page's inline <script>.
   ================================================================= */
(function () {
    /* ===== HELPERS ===== */
    function esc(v) {
        return String(v ?? '')
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
            .replace(/'/g,'&#39;');
    }
    function formatDate(d) {
        if (!d) return '';
        const dt = new Date(d);
        if (!isNaN(dt.getTime())) {
            return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }).toUpperCase();
        }
        return d;
    }
    function projectUrl(p) {
        const overrides = {
            'tiny voters': '/projects/TinyVoters/',
        };
        const key = (p.name || '').toLowerCase();
        if (overrides[key]) return overrides[key];
        if (p && p.link && typeof p.link === 'object' && p.link.url) return p.link.url;
        if (typeof p.link === 'string') return p.link;
        // fall back to a generated detail-page URL based on company + name
        if (p._company && p.name) {
            const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
            return `/projects/${slug(p._company)}/${slug(p.name)}/`;
        }
        return '';
    }
    function projectStatus(p) {
        return p.status || 'Published';
    }

    /* ===== BUILD GROUPS BY COMPANY ===== */
    const data = window.CV_DATA || {};
    const groups = [];

    (data.experience || []).forEach(exp => {
        if ((exp.projects || []).length) {
            groups.push({
                company:  exp.org || exp.title || 'Experience',
                logo:     exp.logo || null,
                type:     'experience',
                projects: exp.projects.map(p => ({ ...p, _company: exp.org || exp.title })),
            });
        }
    });
    (data.projects || []).forEach(group => {
        if ((group.projects || []).length) {
            groups.push({
                company:  group.title || 'Projects',
                logo:     group.logo || null,
                type:     'projects',
                projects: group.projects.map(p => ({ ...p, _company: group.title })),
            });
        }
    });

    const allProjectsFlat = groups.flatMap(g => g.projects);

    /* ===== STATE ===== */
    const _initialParams = new URLSearchParams(location.search);
    const _initialTags     = (_initialParams.get('tags') || _initialParams.get('tag') || '')
        .split(',').map(s => s.trim()).filter(Boolean);
    const _initialStatuses = (_initialParams.get('status') || '')
        .split(',').map(s => s.trim()).filter(Boolean);
    const _initialCompanies = (_initialParams.get('company') || '')
        .split(',').map(s => s.trim()).filter(Boolean);
    const activeTags      = new Set(_initialTags.map(s => s.toLowerCase()));
    const activeStatuses  = new Set(_initialStatuses.map(s => s.toLowerCase()));
    const activeCompanies = new Set(_initialCompanies.map(s => s.toLowerCase()));
    let searchQuery = (_initialParams.get('q') || '').trim();

    /* ===== UNIQUE TAGS / STATUSES / COMPANIES ===== */
    // Case-insensitive dedup keeping the first-seen casing, plus trim.
    function uniqLabels(values) {
        const seen = new Map(); // key: lowercased+trimmed, value: first-seen original
        values.forEach(v => {
            if (v == null) return;
            const original = String(v).trim();
            if (!original) return;
            const key = original.toLowerCase();
            if (!seen.has(key)) seen.set(key, original);
        });
        return [...seen.values()].sort((a, b) => a.localeCompare(b));
    }
    // Build tag list: CV skills first (in skills order), then any extra
    // project tags below in alphabetical order.
    function buildTagList(projectTags, skills) {
        const projectMap = new Map();
        projectTags.forEach(v => {
            if (v == null) return;
            const original = String(v).trim();
            if (!original) return;
            const key = original.toLowerCase();
            if (!projectMap.has(key)) projectMap.set(key, original);
        });
        const result = [];
        const used = new Set();
        (skills || []).forEach(s => {
            const original = String(s || '').trim();
            if (!original) return;
            const key = original.toLowerCase();
            if (used.has(key)) return;
            used.add(key);
            // Prefer a project's casing if available, otherwise show the skill label.
            result.push(projectMap.get(key) || original);
        });
        const extras = [...projectMap.entries()]
            .filter(([k]) => !used.has(k))
            .map(([, v]) => v)
            .sort((a, b) => a.localeCompare(b));
        return result.concat(extras);
    }
    const allTags      = buildTagList(allProjectsFlat.flatMap(p => p.tags || []), data.skills || []);
    const allStatuses  = uniqLabels(allProjectsFlat.map(projectStatus));
    const allCompanies = groups.map(g => g.company);

    /* ===== ICONS ===== */
    const _SI = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true">${body}</svg>`;
    const ICONS = {
        experience: _SI('<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'),
        projects:   _SI('<polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/>'),
    };

    /* One project card (link). */
    function projectCardHtml(p) {
        const name    = esc(p.name || '');
        const date    = esc(formatDate(p.date));
        const summary = esc(p.summary || '');
        const img     = esc(p.image || '');
        const heroVideo = esc(p.heroVideo || '');
        const linkUrl = esc(projectUrl(p));
        const status  = esc(projectStatus(p));
        const company = esc(p._company || '');
        const tags    = p.tags || [];
        const tagsHtml = `<div class="cv3-project-tags">${tags.map(t =>
            `<span class="cv3-project-tag${activeTags.has((t||'').toLowerCase()) ? ' is-active-filter' : ''}" data-tag="${esc(t)}">${esc(t)}</span>`
        ).join('')}</div>`;
        const isExternal = linkUrl && /^https?:\/\//.test(linkUrl);
        return `<a class="cv3-project${heroVideo ? ' has-hover-video' : ''}" href="${linkUrl || '#'}"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''}
                    data-tags='${esc(JSON.stringify(tags))}'
                    data-status="${status}"
                    data-company="${company}"
                    data-name="${name}"
                    data-search="${esc((name + ' ' + summary + ' ' + tags.join(' ')).toLowerCase())}">
            <div class="cv3-project-thumb">
                ${img ? `<img src="${img}" alt="${name}">` : '<span class="cv3-project-thumb-ph">IMG</span>'}
            ${heroVideo ? `<video class="cv3-project-thumb-video" src="${heroVideo}" muted playsinline preload="metadata"></video>` : ''}
            </div>
            <div class="cv3-project-info">
                <h4 class="cv3-project-name">${name}</h4>
                <span class="cv3-project-date"><span class="cv3-project-status" data-status-tag="${status}">${status}</span>${date}</span>
                <p class="cv3-project-desc">${summary}</p>
                ${tagsHtml}
            </div>
        </a>`;
    }

    /* A group card: a project-like header that toggles open to reveal its
       member project cards nested below. */
    function groupCardHtml(item) {
        const g = item.group;
        const name = esc(g.name || '');
        const img  = esc(g.image || '');
        const summary = esc(g.summary || '');
        const company = esc(g._company || '');
        const count = item.members.length;
        const members = item.members.map(m => projectCardHtml(m.project)).join('');
        return `<div class="cv3-group" data-company="${company}" data-group-name="${name}">
            <div class="cv3-project cv3-group-head" role="button" tabindex="0" aria-expanded="false" aria-label="Toggle group: ${name}">
                <div class="cv3-project-thumb">
                    ${img ? `<img src="${img}" alt="${name}">` : '<span class="cv3-project-thumb-ph">GROUP</span>'}
                </div>
                <div class="cv3-project-info">
                    <h4 class="cv3-project-name">${name} <span class="cv3-group-chevron" aria-hidden="true">▸</span></h4>
                    <span class="cv3-project-date">${count} project${count === 1 ? '' : 's'}</span>
                    ${summary ? `<p class="cv3-project-desc">${summary}</p>` : ''}
                </div>
            </div>
            <div class="cv3-group-members">${members}</div>
        </div>`;
    }

    /* ===== RENDER SECTIONS (one per company) ===== */
    function renderSections() {
        const main = document.getElementById('cvpMain');
        main.innerHTML = groups.map((group, gi) => {
            const num  = String(gi + 1).padStart(2, '0');
            const icon = ICONS[group.type] || ICONS.projects;
            const tree = window.ProjectGroups
                ? window.ProjectGroups.organize(group.projects)
                : group.projects.map(p => ({ type: 'project', project: p }));
            const cardsHtml = tree
                .map(item => item.type === 'group' ? groupCardHtml(item) : projectCardHtml(item.project))
                .join('');

            return `<section class="cv3-section" data-company="${esc(group.company)}">
                <div class="cv3-strip">
                    ${icon}
                    <span class="cv3-strip-num">${num}</span>
                </div>
                <div class="cv3-section-header">${icon} ${esc(group.company)}</div>
                <div class="cvp-projects">
                    ${cardsHtml}
                    <p class="cvp-no-results" style="display:none;">No projects match this filter</p>
                </div>
            </section>`;
        }).join('');
    }

    /* ===== RENDER FILTERS ===== */
    function renderFilters() {
        document.getElementById('cvpFilterCompany').innerHTML = allCompanies.map(c =>
            `<button class="cvp-filter-tag${activeCompanies.has(c.toLowerCase()) ? ' is-active' : ''}" data-company="${esc(c)}">${esc(c)}</button>`
        ).join('');
        document.getElementById('cvpFilterTags').innerHTML = allTags.map(t =>
            `<button class="cvp-filter-tag${activeTags.has((t||'').toLowerCase()) ? ' is-active' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`
        ).join('');
        document.getElementById('cvpFilterStatus').innerHTML = allStatuses.map(s =>
            `<button class="cvp-filter-tag${activeStatuses.has((s||'').toLowerCase()) ? ' is-active' : ''}" data-status="${esc(s)}">${esc(s)}</button>`
        ).join('');

        const hasFilter = activeTags.size + activeStatuses.size + activeCompanies.size > 0 || !!searchQuery;
        document.getElementById('cvpFilterClear').classList.toggle('visible', hasFilter);
    }

    /* ===== APPLY FILTER ===== */
    function applyFilter() {
        const hasTag     = activeTags.size > 0;
        const hasStatus  = activeStatuses.size > 0;
        const hasCompany = activeCompanies.size > 0;
        const q          = searchQuery.toLowerCase();

        // Filter only real project cards — group heads aren't projects.
        document.querySelectorAll('.cv3-project:not(.cv3-group-head)').forEach(card => {
            const tags    = JSON.parse(card.dataset.tags || '[]').map(t => (t||'').toLowerCase());
            const status  = (card.dataset.status  || '').toLowerCase();
            const company = (card.dataset.company || '').toLowerCase();
            const search  = card.dataset.search || '';
            const tagOk     = !hasTag     || tags.some(t => activeTags.has(t));
            const statusOk  = !hasStatus  || activeStatuses.has(status);
            const companyOk = !hasCompany || activeCompanies.has(company);
            const searchOk  = !q || search.includes(q);
            card.classList.toggle('is-hidden', !(tagOk && statusOk && companyOk && searchOk));
        });

        // A group shows when at least one member matches. While filtering,
        // auto-open groups with matches so they're visible; collapse back when
        // the filters are cleared (so it returns to the user-controlled state).
        const filtering = hasTag || hasStatus || hasCompany || !!q;
        document.querySelectorAll('.cv3-group').forEach(grp => {
            const members = [...grp.querySelectorAll('.cv3-project:not(.cv3-group-head)')];
            const anyVisible = members.some(m => !m.classList.contains('is-hidden'));
            grp.classList.toggle('is-hidden', members.length > 0 && !anyVisible);
            if (filtering) grp.classList.toggle('is-open', anyVisible);
            else grp.classList.remove('is-open');
        });

        document.querySelectorAll('.cv3-project-tag').forEach(el => {
            el.classList.toggle('is-active-filter', activeTags.has((el.dataset.tag||'').toLowerCase()));
        });
        document.querySelectorAll('.cvp-filter-tag[data-tag]').forEach(el => {
            el.classList.toggle('is-active', activeTags.has((el.dataset.tag||'').toLowerCase()));
        });
        document.querySelectorAll('.cvp-filter-tag[data-status]').forEach(el => {
            el.classList.toggle('is-active', activeStatuses.has((el.dataset.status||'').toLowerCase()));
        });
        document.querySelectorAll('.cvp-filter-tag[data-company]').forEach(el => {
            el.classList.toggle('is-active', activeCompanies.has((el.dataset.company||'').toLowerCase()));
        });

        /* per-section no-results + hide empty sections */
        document.querySelectorAll('.cv3-section').forEach(sec => {
            const cards = [...sec.querySelectorAll('.cv3-project:not(.cv3-group-head)')];
            const visible = cards.some(c => !c.classList.contains('is-hidden'));
            const no = sec.querySelector('.cvp-no-results');
            if (no) no.style.display = (cards.length && !visible) ? 'block' : 'none';
            sec.style.display = visible ? '' : 'none';
        });

        const hasFilter = hasTag || hasStatus || hasCompany || !!searchQuery;
        document.getElementById('cvpFilterClear').classList.toggle('visible', hasFilter);

        /* persist URL */
        const url = new URL(location.href);
        url.searchParams.delete('tag');
        if (activeTags.size)      url.searchParams.set('tags', [...activeTags].join(','));
        else                       url.searchParams.delete('tags');
        if (activeStatuses.size)  url.searchParams.set('status', [...activeStatuses].join(','));
        else                       url.searchParams.delete('status');
        if (activeCompanies.size) url.searchParams.set('company', [...activeCompanies].join(','));
        else                       url.searchParams.delete('company');
        if (searchQuery)          url.searchParams.set('q', searchQuery);
        else                       url.searchParams.delete('q');
        history.replaceState(null, '', url);
    }

    function toggle(set, value) {
        const k = (value || '').toLowerCase();
        if (!k) return;
        if (set.has(k)) set.delete(k); else set.add(k);
    }

    function bindProjectHoverVideos() {
        document.querySelectorAll('.cv3-project.has-hover-video').forEach(card => {
            const video = card.querySelector('.cv3-project-thumb-video');
            if (!video || video.dataset.hoverBound === '1') return;
            video.dataset.hoverBound = '1';
            const playVideo = () => video.play().catch(() => {});
            const stopVideo = () => {
                video.pause();
                try { video.currentTime = 0; } catch (_) {}
            };
            card.addEventListener('mouseenter', playVideo);
            card.addEventListener('mouseleave', stopVideo);
            card.addEventListener('focusin', playVideo);
            card.addEventListener('focusout', stopVideo);
        });
    }

    /* ===== EVENTS ===== */
    document.addEventListener('click', e => {
        // Group header toggles its members open/closed.
        const head = e.target.closest('.cv3-group-head');
        if (head && !e.target.closest('.cv3-project-status, .cv3-project-tag')) {
            e.preventDefault();
            const grp = head.closest('.cv3-group');
            if (grp) {
                const open = grp.classList.toggle('is-open');
                head.setAttribute('aria-expanded', open ? 'true' : 'false');
            }
            return;
        }
        const cardStatus = e.target.closest('.cv3-project-status');
        if (cardStatus) {
            e.preventDefault(); e.stopPropagation();
            toggle(activeStatuses, cardStatus.dataset.statusTag);
            applyFilter(); renderFilters(); return;
        }
        const cardTag = e.target.closest('.cv3-project-tag');
        if (cardTag) {
            e.preventDefault(); e.stopPropagation();
            toggle(activeTags, cardTag.dataset.tag);
            applyFilter(); renderFilters(); return;
        }
        const tagBtn = e.target.closest('.cvp-filter-tag[data-tag]');
        if (tagBtn) { toggle(activeTags, tagBtn.dataset.tag); applyFilter(); renderFilters(); return; }
        const statusBtn = e.target.closest('.cvp-filter-tag[data-status]');
        if (statusBtn) { toggle(activeStatuses, statusBtn.dataset.status); applyFilter(); renderFilters(); return; }
        const companyBtn = e.target.closest('.cvp-filter-tag[data-company]');
        if (companyBtn) { toggle(activeCompanies, companyBtn.dataset.company); applyFilter(); renderFilters(); return; }
        if (e.target.closest('#cvpFilterClear')) {
            activeTags.clear(); activeStatuses.clear(); activeCompanies.clear();
            searchQuery = '';
            document.getElementById('cvpSearch').value = '';
            applyFilter(); renderFilters(); return;
        }
    });

    /* ===== SEARCH ===== */
    const searchInput = document.getElementById('cvpSearch');
    searchInput.value = searchQuery;
    searchInput.addEventListener('input', e => {
        searchQuery = e.target.value.trim();
        applyFilter();
    });

    /* ===== BACK BUTTON ===== */
    // Remember the original "outside" page the visitor came from when
    // they first entered the /projects/ flow, and keep using that as
    // the back target even after they've navigated into and back out
    // of individual project detail pages. Navigating between pages
    // inside /projects/ does NOT overwrite the entry referrer.
    const backBtn = document.getElementById('cvpBackBtn');
    if (backBtn) {
        const STORAGE_KEY = 'cvp-entry-referrer';
        let entryReferrer = null;
        try {
            if (document.referrer) {
                const ref = new URL(document.referrer);
                const cameFromInsideProjects =
                    ref.origin === location.origin &&
                    ref.pathname.startsWith('/projects/');
                if (ref.origin === location.origin && !cameFromInsideProjects) {
                    // Fresh entry from outside /projects/ — record it.
                    sessionStorage.setItem(STORAGE_KEY, ref.href);
                }
            }
            entryReferrer = sessionStorage.getItem(STORAGE_KEY);
        } catch (_) { /* sessionStorage may be unavailable */ }

        const target = entryReferrer || '/';
        backBtn.setAttribute('href', target);
        backBtn.addEventListener('click', e => {
            e.preventDefault();
            location.href = target;
        });
    }

    /* ===== INIT ===== */
    renderSections();
    bindProjectHoverVideos();
    renderFilters();
    applyFilter();
})();

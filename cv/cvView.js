/* =================================================================
   CV VIEW — renders window.CV_DATA into the static CV shell in
   cv/index.html. Extracted from the page's inline <script> so the CV
   render engine is a real module (see also services/cvEditor.js which
   calls window.renderCv3 after edits).
   ================================================================= */
/* ===== HELPERS ===== */
function escapeHtml(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const _S  = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="1em" height="1em" aria-hidden="true">${body}</svg>`;
const _SI = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true">${body}</svg>`;

/* Strip icon lookup — add new keys here to support new icon types */
const SECTION_ICONS = {
    'summary':    _SI('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>'),
    'experience': _SI('<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'),
    'education':  _SI('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>'),
    'projects':   _SI('<polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/>'),
};
const ABOUT_ICONS = {
    'location':      _S('<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
    'phone':         _S('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l.91-1.85a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>'),
    'email':         _S('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'),
    'date of birth': _S('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
    'language':      _S('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
    'social':        _S('<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>')
};

function getAboutIcon(label) {
    return ABOUT_ICONS[(label || '').toLowerCase()] || _S('<circle cx="12" cy="12" r="10"/>');
}

function isLogoPath(src) {
    if (!src) return false;
    const s = String(src).trim();
    return s.includes('/') || /^https?:/i.test(s) || /^data:/i.test(s);
}
function renderLogo(logo, logoDark) {
    if (!logo && !logoDark) return '';
    let html = '';
    
    // Render light mode logo
    if (logo) {
        if (logo.src) {
            if (isLogoPath(logo.src)) {
                html += `<img class="cv3-field-logo-img cv3-field-logo-light" src="${escapeHtml(logo.src)}" alt="${escapeHtml(logo.alt || '')}">`;                    } else {
                html += `<span class="cv3-field-logo-text cv3-field-logo-light">${escapeHtml(logo.src)}</span>`;                    }
        } else if (logo.placeholder) {
            html += `<span class="cv3-field-logo-placeholder cv3-field-logo-light">${escapeHtml(String(logo.placeholder).toUpperCase())}</span>`;                }
    }
    
    // Render dark mode logo
    if (logoDark) {
        if (logoDark.src) {
            if (isLogoPath(logoDark.src)) {
                html += `<img class="cv3-field-logo-img cv3-field-logo-dark" src="${escapeHtml(logoDark.src)}" alt="${escapeHtml(logoDark.alt || '')}">`;                    } else {
                html += `<span class="cv3-field-logo-text cv3-field-logo-dark">${escapeHtml(logoDark.src)}</span>`;                    }
        } else if (logoDark.placeholder) {
            html += `<span class="cv3-field-logo-placeholder cv3-field-logo-dark">${escapeHtml(String(logoDark.placeholder).toUpperCase())}</span>`;                }
    }
    
    return html;
}

function projectDetailSlug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/* One project card. Returns '' when the project is hidden from the CV and
   we're not editing. `basePath` is its CV_DATA edit path; `ctx` carries the
   company display name/slug + org logo + edit flag. */
function renderProjectCard(p, basePath, ctx) {
    const showOnCv = p.showOnCv !== false; // default true
    if (!ctx.isEdit && !showOnCv) return '';
    const name     = escapeHtml(p.name || '');
    const date     = escapeHtml(p.date || '');
    const summary  = escapeHtml(p.summary || '');
    const popupDesc = escapeHtml(p.popupDescription || p.summary || '');
    const img      = escapeHtml(p.image || '');
    const heroVideo = escapeHtml(p.heroVideo || '');
    const linkLabel = escapeHtml((p.link && p.link.label) || '');
    const linkUrl   = escapeHtml((p.link && p.link.url) || '');
    const showOnCard = !!(p.link && p.link.showOnCard);
    const tags     = p.tags || [];
    const detailUrl = (ctx.companySlug && p.name)
        ? `/projects/${ctx.companySlug}/${projectDetailSlug(p.name)}/?from=cv`
        : '';
    const tagsHtml = `<div class="cv3-project-tags" data-edit-list="${basePath}.tags">${tags.map((t, ti) => `<span class="cv3-project-tag" data-edit-item="${basePath}.tags.${ti}"><span class="cv3-project-tag-text" data-edit-path="${basePath}.tags.${ti}">${escapeHtml(t)}</span></span>`).join('')}</div>`;
    const cardBtnHtml = (showOnCard && linkUrl)
        ? `<a class="cv3-project-link-btn" href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkLabel || 'Visit project'}</a>`
        : '';
    const hiddenClass = showOnCv ? '' : ' cv3-project-cv-hidden';
    return `<div class="cv3-project${hiddenClass}${heroVideo ? ' has-hover-video' : ''}"
                 data-edit-item="${basePath}"
                 data-title="${name}"
                 data-name="${name}"
                 data-date="${date}"
                 data-desc="${popupDesc}"
                 data-img="${img}"
                 data-tags="${escapeHtml(JSON.stringify(tags))}"
                 data-org-logo="${ctx.logoSrc}"
                 data-org-logo-alt="${ctx.logoAlt}"
                 data-link-label="${linkLabel}"
                 data-link-url="${linkUrl}"
                 data-company="${ctx.company}"
                 data-group="${escapeHtml(p.group || '')}"
                 data-detail-url="${escapeHtml(detailUrl)}"
                 role="link"
                 tabindex="0"
                 aria-label="Open project details: ${name}">
        <div class="cv3-project-thumb">
            ${img
                ? `<img src="${img}" alt="${name}">`
                : `<span class="cv3-project-thumb-ph">IMG</span>`}
            ${heroVideo ? `<video class="cv3-project-thumb-video" src="${heroVideo}" muted playsinline preload="metadata"></video>` : ''}
            <span class="cv3-edit-thumb-path cv3-edit-only" data-edit-path="${basePath}.image" data-edit-type="image-src">${img || 'image path…'}</span>
        </div>
        <div class="cv3-project-info">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px;">
                <h4 class="cv3-project-name" style="margin-bottom:0;" data-edit-path="${basePath}.name">${name}</h4>
                ${tagsHtml}
            </div>
            <span class="cv3-project-date" data-edit-path="${basePath}.date">${date}</span>
            <p class="cv3-project-desc" data-edit-path="${basePath}.summary">${summary}</p>
            <p class="cv3-project-popupdesc cv3-edit-only" data-edit-path="${basePath}.popupDescription" data-edit-type="multiline">${popupDesc}</p>
            ${cardBtnHtml}
            <div class="cv3-project-link-edit cv3-edit-only">
                <span class="cv3-edit-link-toggle">Show in CV:
                    <span class="cv3-edit-bool ${showOnCv ? 'is-on' : 'is-off'}" data-edit-path="${basePath}.showOnCv" data-edit-type="bool">${showOnCv ? 'YES' : 'NO'}</span>
                </span>
                <span class="cv3-edit-link-label">Button label: <span data-edit-path="${basePath}.link.label">${linkLabel}</span></span>
                <span class="cv3-edit-link-url">URL: <span data-edit-path="${basePath}.link.url">${linkUrl}</span></span>
                <span class="cv3-edit-link-toggle">Show on card:
                    <span class="cv3-edit-bool ${showOnCard ? 'is-on' : 'is-off'}" data-edit-path="${basePath}.link.showOnCard" data-edit-type="bool">${showOnCard ? 'YES' : 'NO'}</span>
                </span>
            </div>
        </div>
    </div>`;
}

/* A group card: looks like a project card but toggles open to reveal its
   member project cards nested beneath it. */
function renderGroupCard(item, parentPath, ctx) {
    const g = item.group;
    const basePath = `${parentPath}.projects.${item.index}`;
    const name = escapeHtml(g.name || '');
    const img  = escapeHtml(g.image || '');
    const summary = escapeHtml(g.summary || '');
    const membersHtml = item.members
        .map(m => renderProjectCard(m.project, `${parentPath}.projects.${m.index}`, ctx))
        .join('');
    const visibleCount = item.members.filter(m => m.project.showOnCv !== false).length;
    const count = ctx.isEdit ? item.members.length : visibleCount;
    if (!ctx.isEdit && visibleCount === 0) return '';
    return `<div class="cv3-group" data-edit-item="${basePath}" data-group-name="${name}" data-company="${ctx.company}">
        <div class="cv3-project cv3-group-head" role="button" tabindex="0" aria-expanded="false" aria-label="Toggle group: ${name}">
            <div class="cv3-project-thumb">
                ${img ? `<img src="${img}" alt="${name}">` : `<span class="cv3-project-thumb-ph">GROUP</span>`}
            </div>
            <div class="cv3-project-info">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px;">
                    <h4 class="cv3-project-name" style="margin-bottom:0;" data-edit-path="${basePath}.name">${name}</h4>
                    <span class="cv3-group-chevron" aria-hidden="true">▸</span>
                </div>
                <span class="cv3-project-date">${count} project${count === 1 ? '' : 's'}</span>
                ${summary ? `<p class="cv3-project-desc">${summary}</p>` : ''}
            </div>
        </div>
        <div class="cv3-group-members">${membersHtml}</div>
    </div>`;
}

function renderProjects(projects, orgLogo, parentPath, companyName) {
    const ctx = {
        isEdit: document.body.classList.contains('cv-edit-mode'),
        logoSrc: escapeHtml((orgLogo && orgLogo.src) || ''),
        logoAlt: escapeHtml((orgLogo && orgLogo.alt) || ''),
        company: escapeHtml(companyName || ''),
        companySlug: projectDetailSlug(companyName),
    };
    const tree = window.ProjectGroups
        ? window.ProjectGroups.organize(projects || [])
        : (projects || []).map((p, i) => ({ type: 'project', project: p, index: i }));
    const itemsHtml = tree.map(item => {
        if (item.type === 'group') return renderGroupCard(item, parentPath, ctx);
        return renderProjectCard(item.project, `${parentPath}.projects.${item.index}`, ctx);
    }).join('');
    return `<div class="cv3-projects-list" data-edit-list="${parentPath}.projects">${itemsHtml}</div>`;
}

/* ===== DATE HELPERS (month/year) =====
   Shared with services/cvEditor.js via window.CV3Dates. Entries may carry
   structured startDate/endDate ("YYYY-MM" | "YYYY" | ""), or a legacy freeform
   `date` string. An empty endDate on a structured entry means "Present". */
const CV3_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function ymParse(s) {
    if (!s) return '';
    const str = String(s).trim();
    let m = str.match(/^(\d{4})(?:-(\d{1,2}))?$/);
    if (m) return m[2] ? `${m[1]}-${String(+m[2]).padStart(2, '0')}` : m[1];
    m = str.match(/([A-Za-z]{3,})\.?\s*(\d{4})/);
    if (m) {
        const i = CV3_MONTHS.findIndex(x => x.toLowerCase() === m[1].slice(0, 3).toLowerCase());
        return i >= 0 ? `${m[2]}-${String(i + 1).padStart(2, '0')}` : m[2];
    }
    m = str.match(/(\d{4})/);
    return m ? m[1] : '';
}
function ymSplitLegacy(dateStr) {
    const parts = String(dateStr || '').split(/\s*[-–—]\s*/);
    return [ymParse(parts[0] || ''), ymParse(parts[1] || '')];
}
function ymFormat(ym) {
    if (!ym) return '';
    const m = String(ym).match(/^(\d{4})(?:-(\d{1,2}))?$/);
    if (!m) return String(ym);
    return m[2] ? `${CV3_MONTHS[(+m[2]) - 1] || ''} ${m[1]}`.trim() : m[1];
}
function ymKey(ym) {
    const m = String(ym || '').match(/^(\d{4})(?:-(\d{1,2}))?$/);
    return m ? (+m[1]) * 100 + (m[2] ? +m[2] : 0) : -1;
}
function entryDates(item) {
    const structured = ('startDate' in item) || ('endDate' in item);
    if (structured) {
        const start = item.startDate || '';
        const end = item.endDate || '';
        return { start, end, present: !!start && !end, structured: true };
    }
    const [start, end] = ymSplitLegacy(item.date);
    return { start, end, present: false, structured: false };
}
function entrySortKey(item) {
    const { start, end, present } = entryDates(item);
    const endK = present ? 9999999 : (ymKey(end) >= 0 ? ymKey(end) : ymKey(start));
    return endK * 1000000 + (ymKey(start) >= 0 ? ymKey(start) : 0);
}
window.CV3Dates = { ymParse, ymSplitLegacy, ymFormat, ymKey, entryDates };

function renderField(item, combineTitleOrg, path) {
    const isEdit = document.body.classList.contains('cv-edit-mode');
    // Hide entire company/section entry if explicitly opted out (cv.js: "showOnCv": false)
    if (!isEdit && item && item.showOnCv === false) {
        return '';
    }
    // Hide field if it has a projects array and all projects are hidden in CV
    if (!isEdit && Array.isArray(item.projects) && item.projects.length > 0
        && item.projects.every(p => p && p.showOnCv === false)) {
        return '';
    }
    const title        = escapeHtml(item.title || '');
    const org          = escapeHtml(item.org || '');
    const rawDesc      = item.description || '';
    const descHtml     = Array.isArray(rawDesc)
        ? `<p class="cv3-field-desc" data-edit-path="${path}.description" data-edit-type="multiline-array">${rawDesc.map(escapeHtml).join('<br>')}</p>`
        : `<p class="cv3-field-desc" data-edit-path="${path}.description" data-edit-type="multiline">${escapeHtml(rawDesc)}</p>`;
    const rawDate      = item.date || '';
    const logoHtml     = renderLogo(item.logo, item.logoDark);
    const projectsHtml = item.projects !== undefined ? renderProjects(item.projects || [], item.logo, path, item.org || item.title || '') : '';
    const titleInner = combineTitleOrg && org
        ? `<span data-edit-path="${path}.org">${org}</span> <span class="cv3-field-title-role">- <span data-edit-path="${path}.title">${title}</span></span>`
        : `<span data-edit-path="${path}.title">${title}</span>`;
    const orgLine      = !combineTitleOrg && org
        ? `<p class="cv3-field-org" data-edit-path="${path}.org">${org}</p>`
        : '';

    /* Date: structured start/end (empty end = "Present"), or legacy freeform. */
    const dd = entryDates(item);
    let dateText;
    if (dd.structured) {
        const startTxt = ymFormat(dd.start);
        const endTxt   = dd.end ? ymFormat(dd.end) : (dd.start ? 'Present' : '');
        dateText = startTxt ? (startTxt + (endTxt ? ` — ${endTxt}` : '')) : '';
    } else {
        const dateParts = rawDate.split(/\s*[-–—]\s*/);
        const dateStart = dateParts[0] || rawDate;
        const dateEnd   = dateParts[1] || '';
        dateText = rawDate ? (dateStart + (dateEnd ? ` — ${dateEnd}` : '')) : '';
    }
    const dateHtml = `<div class="cv3-field-date" data-edit-path="${path}.date">${escapeHtml(dateText)}</div>`;

    return `<div class="cv3-field" data-edit-item="${path}">
        ${dateHtml}
        <div class="cv3-field-logo">${logoHtml || ''}<span class="cv3-edit-logo-path cv3-edit-only" data-edit-path="${path}.logo.src" data-edit-type="image-src">${escapeHtml((item.logo && item.logo.src) || '')}</span><span class="cv3-edit-logo-path cv3-edit-only" data-edit-path="${path}.logoDark.src" data-edit-type="image-src">${escapeHtml((item.logoDark && item.logoDark.src) || '')}</span></div>
        <h3 class="cv3-field-title">${titleInner}</h3>
        ${orgLine}
        ${descHtml}
        ${projectsHtml}
    </div>`;
}

/* ===== DYNAMIC SECTION BUILDER ===== */
function renderSectionHtml(section, num, data, sectionIndex) {
    const numStr  = String(num).padStart(2, '0');
    const iconSvg = SECTION_ICONS[section.icon] || SECTION_ICONS['summary'];
    const title   = escapeHtml(section.title || '');

    let contentHtml = '';
    if (section.type === 'summary') {
        contentHtml = `<div class="cv3-section-content"><p class="cv3-field-desc" data-edit-path="summary" data-edit-type="multiline">${escapeHtml(data.summary || '')}</p></div>`;
    } else if (section.type === 'fields') {
        const isEdit = document.body.classList.contains('cv-edit-mode');
        const items     = data[section.dataKey] || [];
        // Render in stored (manual) order — companies are reordered by drag in
        // edit mode. The date is still shown per entry (start/end/Present).
        const renderedItems = items.map((item, i) => renderField(item, !!section.combineTitleOrg, `${section.dataKey}.${i}`));
        // If not editing, and section originally had items but all rendered empty, skip the whole section
        if (!isEdit && items.length > 0 && renderedItems.every(s => !s)) {
            return '';
        }
        contentHtml = `<div class="cv3-fields" data-edit-list="${section.dataKey}">${renderedItems.join('')}</div>`;
    } else if (section.type === 'button') {
        const btn = section.button || {};
        const btnUrl   = escapeHtml(btn.url || '#');
        const btnPath  = `sections.${sectionIndex}.button`;
        return `<section class="cv3-section cv3-dynamic-section cv3-section-button-only" data-edit-item="sections.${sectionIndex}">
            <a class="cv3-section-button" href="${btnUrl}" target="_blank" rel="noopener noreferrer" data-edit-path="sections.${sectionIndex}.title">${title}</a>
            <div class="cv3-section-button-edit cv3-edit-only">
                <span class="cv3-edit-link-url">URL: <span class="cv3-edit-inline" data-edit-path="${btnPath}.url" data-placeholder="https://example.com">${escapeHtml(btn.url || '')}</span></span>
            </div>
        </section>`;
    }

    // `fields` sections render each company as its own bracket on the right
    // (see .cv3-fields-section in cv.css); other section types keep one box.
    const fieldsCls = section.type === 'fields' ? ' cv3-fields-section' : '';
    return `<section class="cv3-section cv3-dynamic-section${fieldsCls}" data-edit-item="sections.${sectionIndex}">
        <div class="cv3-strip">${iconSvg}<span class="cv3-strip-num">${numStr}</span></div>
        <div class="cv3-section-header" data-edit-path="sections.${sectionIndex}.title">${title}</div>
        ${contentHtml}
    </section>`;
}

/* ===== RENDER ===== */
function renderCv3() {
    const data = window.CV_DATA;
    if (!data) return;

    /* Nav */
    const navLabel = document.getElementById('cv3NavLabel');
    if (navLabel && data.profile) {
        navLabel.innerHTML = `<span data-edit-path="profile.name">${escapeHtml(data.profile.name || '')}</span> <span style="opacity:0.5">/ CV-PORTFOLIO</span>`;
    }

    /* Hero */
    const heroName = document.getElementById('cv3HeroName');
    const heroRole = document.getElementById('cv3HeroRole');
    if (heroName) { heroName.textContent = data.profile?.name || ''; heroName.setAttribute('data-edit-path', 'profile.name'); }
    if (heroRole) { heroRole.textContent = data.profile?.role || ''; heroRole.setAttribute('data-edit-path', 'profile.role'); }

    /* Hero photo */
    const heroPhoto = document.getElementById('cv3HeroPhoto');
    if (heroPhoto && data.profile?.photo?.src) {
        heroPhoto.innerHTML = `<img src="${escapeHtml(data.profile.photo.src)}" alt="${escapeHtml(data.profile.photo.alt || '')}"><div class="cv3-hero-photo-fade"></div><span class="cv3-edit-photo-path cv3-edit-only" data-edit-path="profile.photo.src" data-edit-type="image-src">${escapeHtml(data.profile.photo.src)}</span>`;
    }

    /* Sidebar photo */
    const sidePhoto = document.getElementById('cv3Photo');
    if (sidePhoto && data.profile?.photo?.src) {
        sidePhoto.innerHTML = `<img src="${escapeHtml(data.profile.photo.src)}" alt="${escapeHtml(data.profile.photo.alt || '')}"><span class="cv3-edit-photo-path cv3-edit-only" data-edit-path="profile.photo.src" data-edit-type="image-src">${escapeHtml(data.profile.photo.src)}</span>`;
    }

    /* Dynamic sections (02+) from CV_DATA.sections — clear any previous render first */
    const mainEl = document.getElementById('cv3Main');
    if (mainEl && data.sections) {
        mainEl.querySelectorAll('.cv3-dynamic-section').forEach(n => n.remove());
        const hero = mainEl.querySelector('#cv3-hero');
        const sectionsHtml = data.sections
            .map((section, i) => renderSectionHtml(section, i + 2, data, i))
            .join('');
        if (hero) {
            hero.insertAdjacentHTML('afterend', sectionsHtml);
        } else {
            mainEl.insertAdjacentHTML('beforeend', sectionsHtml);
        }
    }

    /* Contact & Info — about array */
    const contactList = document.getElementById('cv3ContactList');
    if (contactList) {
        contactList.setAttribute('data-edit-list', 'about');
        contactList.innerHTML = (data.about || []).map((item, i) => {
            const label     = escapeHtml(item.label || '');
            const valueText = escapeHtml(item.value || '');
            const iconHtml  = getAboutIcon(item.label || '');
            const hrefText  = escapeHtml(item.href || '');
            const valueHtml = item.href
                ? `<a href="${escapeHtml(item.href)}"${item.target ? ` target="${escapeHtml(item.target)}" rel="noopener noreferrer"` : ''} data-edit-path="about.${i}.value">${valueText}</a>`
                : `<span data-edit-path="about.${i}.value">${valueText}</span>`;
            return `<li class="cv3-info-item" data-edit-item="about.${i}">
                <div class="cv3-info-icon">${iconHtml}</div>
                <div class="cv3-info-text">
                    <span class="cv3-info-label" data-edit-path="about.${i}.label">${label}</span>
                    <span class="cv3-info-value">${valueHtml}</span>
                    <span class="cv3-edit-href cv3-edit-only" data-edit-path="about.${i}.href" data-edit-type="href">${hrefText}</span>
                </div>
            </li>`;
        }).join('');
    }

    /* Skills */
    const skillsEl = document.getElementById('cv3SkillsList');
    if (skillsEl) {
        skillsEl.setAttribute('data-edit-list', 'skills');
        skillsEl.innerHTML = (data.skills || [])
            .map((s, i) => `<a class="cv3-skill-tag" href="/projects/?tags=${encodeURIComponent(s)}" data-edit-item="skills.${i}"><span class="cv3-skill-tag-text" data-edit-path="skills.${i}">${escapeHtml(s)}</span></a>`)
            .join('');
    }

    bindProjectHoverVideos();

    /* Notify editor (if loaded) so it can rebind controls */
    if (window.cvEditor && window.cvEditor.onRender) window.cvEditor.onRender();
}
window.renderCv3 = renderCv3;

function navigateToProjectDetail(project) {
    if (!project) return;
    const detailUrl = (project.dataset.detailUrl || '').trim();
    if (!detailUrl) return;
    if (detailUrl.startsWith('/') || detailUrl.startsWith('http://') || detailUrl.startsWith('https://')) {
        window.location.href = detailUrl;
    }
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

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
    renderCv3();

    /* Group expand/collapse — works in any mode (view + edit). */
    document.addEventListener('click', e => {
        const head = e.target.closest('.cv3-group-head');
        if (!head) return;
        // Don't toggle when interacting with edit chrome / links inside the head.
        if (e.target.closest('.cv-section-pill, .cv-proj-reorder, .de-edit-btn, button, a')) return;
        const group = head.closest('.cv3-group');
        if (!group) return;
        e.preventDefault();
        const open = group.classList.toggle('is-open');
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    /* Click delegation */
    document.addEventListener('click', e => {
        /* Keep card clicks available for editors while in edit mode */
        if (document.body.classList.contains('cv-edit-mode')) return;
        /* Group heads toggle (handled above) — never navigate. */
        if (e.target.closest('.cv3-group-head')) return;

        const project = e.target.closest('.cv3-project');
        if (project) {
            /* let the on-card link button navigate normally */
            if (e.target.closest('.cv3-project-link-btn')) return;
            navigateToProjectDetail(project);
            return;
        }
    });

    document.addEventListener('keydown', (e) => {
        if (document.body.classList.contains('cv-edit-mode')) return;
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const project = e.target.closest('.cv3-project');
        if (!project) return;
        if (e.target.closest('.cv3-project-link-btn')) return;
        e.preventDefault();
        navigateToProjectDetail(project);
    });

    /* Keyboard shortcut for color configurator */
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
            e.preventDefault();
            toggleColorConfigurator();
        }
    });

    /* Hide configurator on init */
    setColorConfiguratorVisible(false);
    setTimeout(() => setColorConfiguratorVisible(false), 0);
    setTimeout(() => setColorConfiguratorVisible(false), 120);
});

/* ===== COLOR CONFIGURATOR HELPERS ===== */
function setColorConfiguratorVisible(visible) {
    const menu = document.getElementById('colorConfigMenu');
    if (!menu) return;
    menu.classList.toggle('show', !!visible);
}
function toggleColorConfigurator() {
    const menu = document.getElementById('colorConfigMenu');
    if (!menu) return;
    menu.classList.toggle('show');
}

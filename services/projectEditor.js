/* =================================================================
   PROJECT EDITOR — localhost-only.

   Adds an "Edit" pill to each project card on /projects/ and a
   floating "Edit Project" pill on per-project detail pages
   (where window.PROJECT_REF is set). Saves via /__save which
   rewrites projects/projects.js.

   All UI/save plumbing lives in services/dataEditor.js.
   ================================================================= */
(function () {
    'use strict';
    const DE = window.DataEditor;
    if (!DE || !DE.IS_LOCAL) return;
    DE.injectStyles();

    /* ---------- find a PROJECTS_DATA entry ---------- */
    function findEntry(company, name) {
        const data = window.PROJECTS_DATA || [];
        const c = (company || '').toLowerCase();
        const n = (name || '').toLowerCase();
        return data.find(p =>
            (p.company || '').toLowerCase() === c &&
            (p.name || '').toLowerCase() === n
        );
    }

    /* ---------- collect every tag known across PROJECTS_DATA ---------- */
    function knownTags() {
        const set = new Set();
        (window.PROJECTS_DATA || []).forEach(p => {
            (p.tags || []).forEach(t => { if (t) set.add(String(t).trim()); });
        });
        return [...set].sort((a, b) => a.localeCompare(b));
    }

    /* ---------- match the slug rule used by projectDetail.js ---------- */
    function projectSlug(name) {
        return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    }
    function folderSlug(company, name) {
        const c = projectSlug(company);
        const n = projectSlug(name);
        if (c && n) return `${c}_${n}`;
        return c || n;
    }

    /* ---------- open project editor for an entry ---------- */
    function editProject(entry) {
        const link = entry.link || {};
        const companies = knownCompanies();
        // Make sure the entry's current company appears in the dropdown.
        if (entry.company && !companies.includes(entry.company)) {
            companies.unshift(entry.company);
        }
        const slug = folderSlug(entry.company, entry.name);
        const heroDir   = slug ? `assets/images/projects/${slug}` : 'assets/images/projects';
        const mediaDir  = heroDir;
        DE.openModal({
            title:    'Edit Project',
            subtitle: `${entry.company || ''} · ${entry.name || ''}`,
            fields: [
                { key: 'name',                label: 'Name',                       type: 'text',     value: entry.name },
                { key: 'company',             label: 'Company',                    type: 'select',   value: entry.company, options: companies },
                { key: 'date',                label: 'Date',                       type: 'text',     value: entry.date,        placeholder: 'YYYY-MM-DD or freeform' },
                { key: 'status',              label: 'Status',                     type: 'text',     value: entry.status,      placeholder: 'Published / Development / ...' },
                { key: 'image',               label: 'Hero Image',                 type: 'image',    value: entry.image,       full: true, targetDir: heroDir, filename: `${slug || 'hero'}.{ext}` },
                { key: '__media',             label: 'Media gallery',              type: 'image-gallery', full: true, targetDir: mediaDir },
                { key: 'tags',                label: 'Tags',                       type: 'tags',     value: entry.tags || [],  full: true, suggestions: knownTags() },
                { key: 'summary',             label: 'Summary (card description)', type: 'textarea', value: entry.summary,     full: true, rows: 3 },
                { key: 'popupDescription',    label: 'Popup / Detail Description', type: 'textarea', value: entry.popupDescription, full: true, rows: 6 },
                { key: 'link.url',            label: 'Link URL',                   type: 'text',     value: link.url },
                { key: 'link.label',          label: 'Link Label',                 type: 'text',     value: link.label },
                { key: 'link.showOnCard',     label: 'Show link on card',          type: 'bool',     value: !!link.showOnCard },
                { key: 'showOnCv',            label: 'Show on CV',                 type: 'bool',     value: entry.showOnCv !== false },
            ],
            onSave: async (values) => {
                // Strip transient gallery key — it's not part of the data.
                delete values.__media;
                Object.entries(values).forEach(([k, v]) => DE.setPath(entry, k, v));
                // Trim empty optional fields
                ['date', 'status'].forEach(k => { if (entry[k] === '') delete entry[k]; });
                if (entry.link && !entry.link.url && !entry.link.label && entry.link.showOnCard === false) {
                    delete entry.link;
                }
                if (entry.showOnCv === true) delete entry.showOnCv;
                await DE.saveJson('/__save', { projects: window.PROJECTS_DATA });
            },
        });
    }
    // Expose so cvEditor can delegate.
    window.ProjectEditor = { editProject, findEntry };

    /* ---------- known companies (defined in cv.js) ----------
       Companies are managed exclusively from the CV. We collect the
       org name from every entry in any `fields`-type CV section
       (Experience, Education, ...) plus the title of every group in
       cv.projects (e.g. "Side-Projects"). Existing PROJECTS_DATA
       company strings are folded in too so legacy entries stay
       editable, but no new company can be created from here. */
    function knownCompanies() {
        const set = new Set();
        const cv = window.CV_DATA || {};
        const sections = Array.isArray(cv.sections) ? cv.sections : [];
        sections.forEach(sec => {
            if (!sec || sec.type !== 'fields' || !sec.dataKey) return;
            const arr = cv[sec.dataKey];
            if (!Array.isArray(arr)) return;
            arr.forEach(item => {
                const name = (item && (item.org || item.title)) || '';
                if (name) set.add(String(name).trim());
            });
        });
        (cv.projects || []).forEach(g => { if (g && g.title) set.add(String(g.title).trim()); });
        (window.PROJECTS_DATA || []).forEach(p => {
            if (p.company) set.add(String(p.company).trim());
        });
        return [...set].filter(Boolean).sort((a, b) => a.localeCompare(b));
    }

    /* ---------- create a brand-new project entry ---------- */
    function createNewProject() {
        const companies = knownCompanies();
        const draft = {
            name: '',
            company: companies[0] || '',
            date: '',
            status: 'Development',
            image: '',
            tags: [],
            summary: '',
            popupDescription: '',
            link: { url: '', label: '', showOnCard: false },
            showOnCv: true,
        };
        DE.openModal({
            title:    'New Project',
            subtitle: 'Add a new entry to PROJECTS_DATA',
            fields: [
                { key: 'name',                label: 'Name',                       type: 'text',     value: draft.name },
                { key: 'company',             label: 'Company',                    type: 'select',   value: draft.company, options: companies },
                { key: 'date',                label: 'Date',                       type: 'text',     value: draft.date,   placeholder: 'YYYY-MM-DD or freeform' },
                { key: 'status',              label: 'Status',                     type: 'text',     value: draft.status, placeholder: 'Published / Development / ...' },
                { key: 'image',               label: 'Image (path or URL)',        type: 'text',     value: draft.image,  full: true },
                { key: 'tags',                label: 'Tags',                       type: 'tags',     value: draft.tags,   full: true, suggestions: knownTags() },
                { key: 'summary',             label: 'Summary (card description)', type: 'textarea', value: draft.summary, full: true, rows: 3 },
                { key: 'popupDescription',    label: 'Popup / Detail Description', type: 'textarea', value: draft.popupDescription, full: true, rows: 6 },
                { key: 'link.url',            label: 'Link URL',                   type: 'text',     value: draft.link.url },
                { key: 'link.label',          label: 'Link Label',                 type: 'text',     value: draft.link.label },
                { key: 'link.showOnCard',     label: 'Show link on card',          type: 'bool',     value: draft.link.showOnCard },
                { key: 'showOnCv',            label: 'Show on CV',                 type: 'bool',     value: draft.showOnCv },
            ],
            onSave: async (values) => {
                const entry = {};
                Object.entries(values).forEach(([k, v]) => DE.setPath(entry, k, v));
                if (!entry.name || !String(entry.name).trim()) {
                    throw new Error('Name is required');
                }
                if (!entry.company || !String(entry.company).trim()) {
                    throw new Error('Company is required');
                }
                ['date', 'status'].forEach(k => { if (entry[k] === '') delete entry[k]; });
                if (entry.link && !entry.link.url && !entry.link.label && entry.link.showOnCard === false) {
                    delete entry.link;
                }
                if (entry.showOnCv === true) delete entry.showOnCv;

                window.PROJECTS_DATA = window.PROJECTS_DATA || [];
                // Guard against duplicates.
                if (findEntry(entry.company, entry.name)) {
                    throw new Error(`A project named "${entry.name}" already exists under "${entry.company}".`);
                }
                window.PROJECTS_DATA.push(entry);
                await DE.saveJson('/__save', { projects: window.PROJECTS_DATA });
                // Reload so all renderers (gallery, filters, CV) pick up the new entry.
                location.reload();
            },
        });
    }

    /* ---------- floating "+ New Project" button (edit mode only) ---------- */
    function ensureAddButton() {
        if (window.PROJECT_REF && window.PROJECT_REF.company && window.PROJECT_REF.name) return;
        if (!hasGalleryTargets()) return;
        if (document.querySelector('.de-add-project-btn')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'de-edit-toggle de-add-project-btn';
        btn.textContent = '+ New Project';
        btn.style.right = '160px';
        btn.style.background = 'var(--de-bg, #fff)';
        btn.style.color = 'var(--de-dark, #111)';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            createNewProject();
        });
        // Only show while edit mode is active.
        const sync = () => {
            btn.style.display = document.body.classList.contains('de-edit-mode') ? '' : 'none';
        };
        sync();
        new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        document.body.appendChild(btn);
    }
    /* ---------- attach "Edit" pill to gallery cards ---------- */
    function attachGalleryButtons() {
        document.querySelectorAll('a.cv3-project[data-name][data-company]').forEach(card => {
            if (card.querySelector('.de-edit-btn')) return;
            card.classList.add('de-edit-host');
            const btn = DE.makeEditButton({
                onClick: () => {
                    const company = card.getAttribute('data-company');
                    const name = card.getAttribute('data-name');
                    const entry = findEntry(company, name);
                    if (!entry) {
                        alert(`Project not found in PROJECTS_DATA:\n${company} / ${name}`);
                        return;
                    }
                    editProject(entry);
                },
            });
            card.appendChild(btn);
        });
    }

    /* ---------- attach floating button on detail pages ---------- */
    function attachDetailButton() {
        const ref = window.PROJECT_REF;
        if (!ref || !ref.company || !ref.name) return;
        if (document.querySelector('.de-detail-edit')) return;
        const entry = findEntry(ref.company, ref.name);
        if (!entry) return;
        // Detail pages don't need an edit-mode toggle — the button just
        // opens the project modal directly.
        DE.injectStyles();
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'de-edit-toggle de-detail-edit';
        btn.textContent = 'Edit Project';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            editProject(entry);
        });
        document.body.appendChild(btn);
    }

    /* ---------- bootstrap ---------- */
    function hasGalleryTargets() {
        return !!document.querySelector('a.cv3-project[data-name][data-company]');
    }
    let toggleInstalled = false;
    function ensureToggle() {
        if (toggleInstalled) return;
        // CV page installs its own "Edit CV" toggle via cvEditor.
        if (window.cvEditor) return;
        // Detail pages get a direct-open button instead of an edit-mode toggle.
        if (window.PROJECT_REF && window.PROJECT_REF.company && window.PROJECT_REF.name) return;
        if (!hasGalleryTargets()) return;
        toggleInstalled = true;
        DE.installEditToggle({
            storageKey: 'projects-edit-mode',
            label: 'Edit Page',
            doneLabel: 'Done',
        });
    }
    function init() {
        if (!window.PROJECTS_DATA) return;
        ensureToggle();
        ensureAddButton();
        attachGalleryButtons();
        attachDetailButton();
        const mo = new MutationObserver(() => {
            ensureToggle();
            ensureAddButton();
            attachGalleryButtons();
            attachDetailButton();
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

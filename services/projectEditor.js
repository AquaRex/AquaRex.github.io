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

    /* ---------- open project editor for an entry ---------- */
    function editProject(entry) {
        const link = entry.link || {};
        DE.openModal({
            title:    'Edit Project',
            subtitle: `${entry.company || ''} · ${entry.name || ''}`,
            fields: [
                { key: 'name',                label: 'Name',                       type: 'text',     value: entry.name },
                { key: 'company',             label: 'Company',                    type: 'text',     value: entry.company },
                { key: 'date',                label: 'Date',                       type: 'text',     value: entry.date,        placeholder: 'YYYY-MM-DD or freeform' },
                { key: 'status',              label: 'Status',                     type: 'text',     value: entry.status,      placeholder: 'Published / Development / ...' },
                { key: 'image',               label: 'Image (path or URL)',        type: 'text',     value: entry.image,       full: true },
                { key: 'tags',                label: 'Tags',                       type: 'tags',     value: entry.tags || [],  full: true, suggestions: knownTags() },
                { key: 'summary',             label: 'Summary (card description)', type: 'textarea', value: entry.summary,     full: true, rows: 3 },
                { key: 'popupDescription',    label: 'Popup / Detail Description', type: 'textarea', value: entry.popupDescription, full: true, rows: 6 },
                { key: 'link.url',            label: 'Link URL',                   type: 'text',     value: link.url },
                { key: 'link.label',          label: 'Link Label',                 type: 'text',     value: link.label },
                { key: 'link.showOnCard',     label: 'Show link on card',          type: 'bool',     value: !!link.showOnCard },
                { key: 'showOnCv',            label: 'Show on CV',                 type: 'bool',     value: entry.showOnCv !== false },
            ],
            onSave: async (values) => {
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
        attachGalleryButtons();
        attachDetailButton();
        const mo = new MutationObserver(() => {
            ensureToggle();
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

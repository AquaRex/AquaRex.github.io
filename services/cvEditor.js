/* =================================================================
   CV EDITOR — localhost-only, per-section modals.

   Top-right "Edit CV" pill toggles edit mode. In edit mode:
     • A pill appears next to each editable section (Profile,
       Summary, Contacts, Skills, every dynamic section).
     • A floating "+ Add Section" button appears at the bottom of
       the main column.
     • Each project row under an experience/projects section gets
       small ↑ ↓ pills for reordering (rewrites PROJECTS_DATA).

   Each pill opens a focused modal scoped to that section.
   Saves go to /__save-cv (CV) or /__save (PROJECTS_DATA reorder).
   ================================================================= */
(function () {
    'use strict';

    const DE = window.DataEditor;
    if (!DE || !DE.IS_LOCAL) return;
    if (!window.CV_DATA || typeof window.renderCv3 !== 'function') return;

    DE.injectStyles();

    /* ---------- styles ---------- */
    const style = document.createElement('style');
    style.textContent = `
        /* Hide legacy inline edit affordances baked into the renderer.
           (Default-hidden in cv/index.html too, for the production case where
           this localhost-only file isn't loaded.) */
        .cv3-edit-only { display: none !important; }
        body.cv-edit-mode .cv3-edit-only { display: revert !important; }

        /* Hide DataEditor's generic per-item pills on the CV page. */
        body .de-edit-btn.de-pos-fixed { display: none !important; }

        /* Pills attached to sections only show in edit mode. */
        body:not(.de-edit-mode) .cv-section-pill,
        body:not(.de-edit-mode) .cv-add-section,
        body:not(.de-edit-mode) .cv-proj-reorder { display: none !important; }

        .cv-section-pill {
            background: var(--accent-color, #fbc25b);
            color: var(--dark, #151312);
            border: 2px solid var(--border, #151312);
            border-radius: 0;
            padding: 4px 12px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.6rem; font-weight: 800;
            letter-spacing: 2px; text-transform: uppercase;
            cursor: pointer;
            margin-left: 8px;
            vertical-align: middle;
        }
        .cv-section-pill:hover { filter: brightness(0.95); }
        .cv-section-pill.is-floating {
            position: absolute;
            top: 8px; right: 8px;
            z-index: 4;
        }

        /* Sidebar card pill — sits inline in the header next to the title. */
        .cv3-sidebar-card-header { position: relative; }
        .cv3-sidebar-card-header .cv-section-pill { margin-left: auto; }

        /* Each dynamic section becomes a positioning context for its pill. */
        .cv3-dynamic-section { position: relative; }
        .cv3-section-header  { position: relative; }

        /* Add-section button at bottom of main. */
        .cv-add-section {
            display: block;
            margin: var(--sp-5, 20px) 0;
            padding: 10px 18px;
            background: var(--bg, #e0dcd9);
            color: var(--text, #151312);
            border: 2px dashed var(--border, #151312);
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.7rem; font-weight: 800;
            letter-spacing: 3px; text-transform: uppercase;
            cursor: pointer;
            width: 100%;
        }
        .cv-add-section:hover {
            background: var(--accent-color, #fbc25b);
            border-style: solid;
        }
        .cv-add-company-inline {
            margin: 0 var(--sp-5, 20px) var(--sp-4, 16px);
            width: auto;
            padding: 6px 14px;
            font-size: 0.65rem;
            letter-spacing: 2px;
        }
        .cv-entry-pill {
            position: absolute;
            bottom: 8px; right: 8px;
            margin-left: 0;
            z-index: 3;
        }

        .cv3-project { position: relative; }
        .cv-drag-ghost { opacity: 0.4; }

        /* Drag affordance: the natural left/header zone of each draggable item
           becomes the grab handle, marked by a dotted overlay on hover (edit
           mode only). Section = strip/header, company = logo+title, project /
           group = the left image. */
        body.cv-edit-mode .cv3-dynamic-section .cv3-strip,
        body.cv-edit-mode .cv3-field-logo,
        body.cv-edit-mode .cv3-field-title,
        body.cv-edit-mode .cv3-project-thumb { cursor: grab; }
        /* .cv3-strip is already absolutely positioned and the thumbs are
           relative; only the logo/title headers need a positioning context
           for the overlay. */
        body.cv-edit-mode .cv3-field-logo,
        body.cv-edit-mode .cv3-field-title { position: relative; }
        body.cv-edit-mode .cv3-dynamic-section .cv3-strip:active,
        body.cv-edit-mode .cv3-field-logo:active,
        body.cv-edit-mode .cv3-field-title:active,
        body.cv-edit-mode .cv3-project-thumb:active { cursor: grabbing; }

        body.cv-edit-mode .cv3-dynamic-section:hover > .cv3-strip::after,
        body.cv-edit-mode .cv3-field:hover > .cv3-field-title::after,
        body.cv-edit-mode .cv3-field:hover .cv3-field-logo::after,
        body.cv-edit-mode .cv3-project:hover > .cv3-project-thumb::after {
            content: '';
            position: absolute;
            inset: 0;
            border: 2px dotted var(--accent-color, #fbc25b);
            background: color-mix(in srgb, var(--accent-color, #fbc25b) 14%, transparent);
            pointer-events: none;
            z-index: 5;
        }
        /* Make an empty company logo still present a grab target. */
        body.cv-edit-mode .cv3-field-logo { min-height: 22px; }

        /* Per-project / per-group Edit pill — top-right inside the card. */
        .cv-proj-edit.cv-section-pill {
            position: absolute;
            top: 6px; right: 6px;
            z-index: 6;
            margin-left: 0;
        }

        /* New Project / New Group toolbar under each company. */
        .cv-proj-tools {
            display: flex;
            gap: 8px;
            margin: 0 var(--sp-5, 20px) var(--sp-4, 16px);
        }
        .cv-proj-tools .cv-add-company-inline { margin: 0; flex: 1; }
        body:not(.de-edit-mode) .cv-proj-tools { display: none !important; }
    `;
    document.head.appendChild(style);

    /* ---------- helpers ---------- */
    function descToString(v) {
        if (Array.isArray(v)) return v.join('\n');
        return v == null ? '' : String(v);
    }
    function stringToDesc(originalShape, str) {
        if (Array.isArray(originalShape)) {
            return str.split('\n').map(s => s.trim()).filter(Boolean);
        }
        return str;
    }
    function companySlug(name) {
        return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    }
    function knownTagPool(extra) {
        const set = new Set();
        (extra || []).forEach(s => { if (s) set.add(String(s).trim()); });
        (window.PROJECTS_DATA || []).forEach(p => {
            (p.tags || []).forEach(t => { if (t) set.add(String(t).trim()); });
        });
        return [...set].sort((a, b) => a.localeCompare(b));
    }

    /* ---------- merge PROJECTS_DATA into CV (mirrors projects.js bootstrap) ---------- */
    function mergeProjectsIntoCv() {
        const cv = window.CV_DATA;
        if (!cv) return;
        function projectsForCompany(name) {
            const want = (name || '').toLowerCase();
            return (window.PROJECTS_DATA || [])
                .filter(p => (p.company || '').toLowerCase() === want)
                .map(p => { const { company, ...rest } = p; return rest; });
        }
        (cv.experience || []).forEach(exp => {
            const m = projectsForCompany(exp.org);
            if (m.length) exp.projects = m;
        });
        (cv.projects || []).forEach(group => {
            const m = projectsForCompany(group.title);
            if (m.length) group.projects = m;
        });
    }

    async function saveCv() {
        await DE.saveJson('/__save-cv', { cv: window.CV_DATA });
    }
    async function saveProjects() {
        await DE.saveJson('/__save', { projects: window.PROJECTS_DATA });
    }
    function refreshCv() {
        mergeProjectsIntoCv();
        try { window.renderCv3(); } catch (_) {}
    }

    /* =============================================================
       Section modals
       ============================================================= */

    /* --- Profile --- */
    function openProfileModal() {
        const p = window.CV_DATA.profile || (window.CV_DATA.profile = {});
        const photo = p.photo || (p.photo = {});
        DE.openModal({
            title: 'Edit Profile',
            subtitle: 'Hero name, role, and photo',
            reloadOnSave: false,
            fields: [
                { key: 'name', label: 'Name', type: 'text', value: p.name || '' },
                { key: 'role', label: 'Role', type: 'text', value: p.role || '' },
                { key: 'photo.src', label: 'Photo', type: 'image', full: true, value: photo.src || '', targetDir: 'assets/profile', filename: 'ProfilePicture.{ext}' },
                { key: 'photo.alt', label: 'Photo Alt', type: 'text', full: true, value: photo.alt || '' },
            ],
            onSave: async (vals) => {
                p.name = vals.name;
                p.role = vals.role;
                p.photo = p.photo || {};
                p.photo.src = vals['photo.src'];
                p.photo.alt = vals['photo.alt'];
                await saveCv();
            },
            onReload: refreshCv,
        });
    }

    /* --- Summary --- */
    function openSummaryModal() {
        DE.openModal({
            title: 'Edit Summary',
            reloadOnSave: false,
            fields: [
                { key: 'summary', label: 'Summary', type: 'textarea', rows: 6, full: true,
                  value: window.CV_DATA.summary || '' },
            ],
            onSave: async (vals) => { window.CV_DATA.summary = vals.summary; await saveCv(); },
            onReload: refreshCv,
        });
    }

    /* --- Contacts --- */
    function openContactsModal() {
        DE.openModal({
            title: 'Edit Contact & Info',
            subtitle: 'Add, remove, reorder rows',
            reloadOnSave: false,
            fields: [
                {
                    key: 'about', label: 'Contacts', type: 'rows', full: true,
                    value: window.CV_DATA.about || [],
                    addLabel: 'Add Contact',
                    columns: [
                        { key: 'label', label: 'Label', type: 'text' },
                        { key: 'value', label: 'Value', type: 'text' },
                        { key: 'href',  label: 'Link (optional)', type: 'text', full: true },
                    ],
                },
            ],
            onSave: async (vals) => {
                const out = (vals.about || []).map(r => {
                    const o = { label: r.label, value: r.value };
                    if (r.href) o.href = r.href;
                    return o;
                }).filter(r => r.label || r.value);
                window.CV_DATA.about = out;
                await saveCv();
            },
            onReload: refreshCv,
        });
    }

    /* --- Skills --- */
    function openSkillsModal() {
        DE.openModal({
            title: 'Edit Skills',
            subtitle: 'Type & comma to add. Click a suggestion to include.',
            reloadOnSave: false,
            fields: [
                {
                    key: 'skills', label: 'Skills', type: 'tags', full: true,
                    value: window.CV_DATA.skills || [],
                    suggestions: knownTagPool(window.CV_DATA.skills || []),
                },
            ],
            onSave: async (vals) => {
                window.CV_DATA.skills = Array.isArray(vals.skills) ? vals.skills : [];
                await saveCv();
            },
            onReload: refreshCv,
        });
    }

    /* --- Section (dynamic) --- */
    function openSectionModal(idx) {
        const sec = window.CV_DATA.sections[idx];
        if (!sec) return;

        const fields = [
            { key: '__title', label: 'Section Title', type: 'text', value: sec.title || '' },
            { key: '__icon',  label: 'Icon Key',     type: 'text', value: sec.icon || '',
              placeholder: 'summary | experience | education | projects' },
            { key: '__type',  label: 'Type',         type: 'text', value: sec.type || 'fields',
              placeholder: 'summary | fields | button' },
        ];

        if (sec.type === 'fields' && sec.dataKey) {
            fields.push({ key: '__dataKey', label: 'Data Key', type: 'text',
                value: sec.dataKey, placeholder: 'experience | education | projects' });
        }

        DE.openModal({
            title: `Edit Section: ${sec.title || sec.dataKey || ''}`,
            subtitle: `sections.${idx} — section settings only. Edit individual companies via their own Edit pill.`,
            reloadOnSave: false,
            fields,
            onSave: async (vals) => {
                sec.title = vals.__title;
                if (vals.__icon) sec.icon = vals.__icon; else delete sec.icon;
                sec.type = vals.__type || 'fields';
                if (sec.type === 'fields' && vals.__dataKey) {
                    sec.dataKey = vals.__dataKey;
                }
                await saveCv();
            },
            onReload: refreshCv,
            extraButtons: [],
        });
    }

    /* --- Company date helpers (delegate to cvView's shared CV3Dates) --- */
    function entryDates(entry) {
        if (window.CV3Dates && typeof window.CV3Dates.entryDates === 'function') {
            return window.CV3Dates.entryDates(entry);
        }
        return { start: '', end: '' };
    }

    /* --- Copy an uploaded logo into assets/logos with a name based on the
           company. No-op for external URLs or files already named correctly. --- */
    async function finalizeLogo(path, slug, suffix) {
        const p = String(path || '').trim();
        if (!p) return '';
        if (/^https?:\/\//i.test(p)) return p;            // external URL — leave as-is
        if (!/\/assets\/logos\//.test(p)) return p;       // not one of our uploads
        const clean = p.split('?')[0].split('#')[0];
        const ext = (clean.split('.').pop() || 'png').toLowerCase();
        const desired = `/assets/logos/${slug}${suffix}.${ext}`;
        if (p === desired) return p;                       // already correctly named
        try {
            const copied = await DE.cloneMediaToTarget({
                sourcePath: p,
                targetDir: 'assets/logos',
                filenameTemplate: `${slug}${suffix}.{ext}`,
            });
            if (copied && copied !== p) {
                try { await DE.deleteMediaPath(p); } catch (_) { /* keep copy if cleanup fails */ }
            }
            return copied || p;
        } catch (_) {
            return p;
        }
    }

    /* --- Shared field list for Add Company + Edit Company (single source) --- */
    function companyFieldDefs(entry, sectionField) {
        const slug = companySlug(entry.org || entry.title);
        const d = entryDates(entry);
        const fields = [];
        if (sectionField) fields.push(sectionField);
        fields.push(
            { key: 'org',         label: 'Company / Org', type: 'text',      value: entry.org || '', full: true },
            { key: 'title',       label: 'Title / Role',  type: 'text',      value: entry.title || '' },
            { key: 'startDate',   label: 'Start',         type: 'monthyear', value: d.start || '' },
            { key: 'endDate',     label: 'End',           type: 'monthyear', value: d.end || '', hint: 'Leave the year empty for “Present”.' },
            { key: 'description', label: 'Description',   type: 'textarea',  value: descToString(entry.description), full: true, rows: 4 },
            { key: 'logoSrc',     label: 'Logo',          type: 'image',     value: (entry.logo && entry.logo.src) || '', full: true, targetDir: 'assets/logos', filename: slug ? `${slug}_logo.{ext}` : 'logo.{ext}' },
            { key: 'logoDarkSrc', label: 'Dark logo',     type: 'image',     value: (entry.logoDark && entry.logoDark.src) || '', full: true, targetDir: 'assets/logos', filename: slug ? `${slug}_logo_dark.{ext}` : 'logo_dark.{ext}' }
        );
        return fields;
    }

    /* --- Apply modal values onto a company entry (Add + Edit share this) --- */
    async function applyCompanyValues(entry, vals) {
        entry.org   = String(vals.org || '').trim();
        entry.title = vals.title || '';
        entry.description = stringToDesc(entry.description, vals.description || '');
        // Structured month/year dates; empty end (with a start) means "Present".
        if (vals.startDate) entry.startDate = vals.startDate; else delete entry.startDate;
        if (vals.endDate)   entry.endDate   = vals.endDate;   else delete entry.endDate;
        delete entry.date; // retire the legacy freeform date once migrated
        const slug = companySlug(entry.org || entry.title) || 'logo';
        const logo     = await finalizeLogo(vals.logoSrc,     slug, '_logo');
        const logoDark = await finalizeLogo(vals.logoDarkSrc, slug, '_logo_dark');
        if (logo)     entry.logo     = Object.assign({}, entry.logo,     { src: logo });     else delete entry.logo;
        if (logoDark) entry.logoDark = Object.assign({}, entry.logoDark, { src: logoDark }); else delete entry.logoDark;
    }

    /* --- Edit a single company entry --- */
    function openEntryModal(dataKey, idx) {
        const arr = window.CV_DATA[dataKey];
        const entry = arr && arr[idx];
        if (!entry) return;

        DE.openModal({
            title: `Edit: ${entry.org || entry.title || '(unnamed)'}`,
            subtitle: `${dataKey}.${idx}`,
            reloadOnSave: false,
            fields: companyFieldDefs(entry, null),
            onSave: async (vals) => {
                await applyCompanyValues(entry, vals);
                await saveCv();
            },
            onReload: refreshCv,
            extraButtons: [
                {
                    label: 'Delete',
                    danger: true,
                    onClick: async () => {
                        const name = entry.org || entry.title || '(unnamed)';
                        if (!confirm(`Delete "${name}" from ${dataKey}? Projects under this company stay in PROJECTS_DATA.`)) {
                            return { keepOpen: true };
                        }
                        arr.splice(idx, 1);
                        await saveCv();
                    },
                },
            ],
        });
    }


    /* --- Add new company (quick add: prepend an entry to a fields section) --- */
    function listFieldsSections() {
        const out = [];
        const sections = window.CV_DATA.sections || [];
        sections.forEach((sec, i) => {
            if (sec.type !== 'fields' || !sec.dataKey) return;
            if (!Array.isArray(window.CV_DATA[sec.dataKey])) return;
            out.push({
                value: sec.dataKey,
                label: `${sec.title || sec.dataKey} (${sec.dataKey})`,
                index: i,
            });
        });
        return out;
    }

    function openAddCompanyModal(presetDataKey) {
        const targets = listFieldsSections();
        if (!targets.length) {
            alert('No "fields" sections exist yet. Create one first via "+ Add Section".');
            return;
        }
        const initial = (presetDataKey && targets.find(t => t.value === presetDataKey))
            ? presetDataKey
            : targets[0].value;
        const sectionField = (targets.length === 1 || presetDataKey)
            ? { key: 'section', label: 'Section', type: 'text',
                value: (targets.find(t => t.value === initial) || targets[0]).label,
                placeholder: '' }
            : { key: 'section', label: 'Add to section', type: 'select',
                value: initial,
                options: targets.map(t => ({ value: t.value, label: t.label })) };
        DE.openModal({
            title: 'Add Company',
            subtitle: 'Adds a new entry. Becomes selectable in the project Company dropdown.',
            reloadOnSave: false,
            fields: companyFieldDefs({}, sectionField),
            onSave: async (vals) => {
                // If the section field is read-only text (preset/single), the
                // value is the human label — fall back to the resolved initial.
                const dk = (presetDataKey || targets.length === 1)
                    ? initial
                    : vals.section;
                if (!Array.isArray(window.CV_DATA[dk])) window.CV_DATA[dk] = [];
                const org = String(vals.org || '').trim();
                if (!org) {
                    throw new Error('Company / Org Name is required');
                }
                const exists = window.CV_DATA[dk].some(e =>
                    (e.org || e.title || '').toLowerCase() === org.toLowerCase()
                );
                if (exists) {
                    throw new Error(`"${org}" already exists in ${dk}`);
                }
                const entry = {};
                await applyCompanyValues(entry, vals);
                // Newest-first ordering is handled at render time by date.
                window.CV_DATA[dk].unshift(entry);
                await saveCv();
            },
            onReload: refreshCv,
        });
    }

    /* --- Add new section --- */
    function openAddSectionModal() {
        DE.openModal({
            title: 'Add Section',
            subtitle: 'Choose a type. "fields" sections list entries (experience, etc).',
            reloadOnSave: false,
            fields: [
                { key: 'title', label: 'Title', type: 'text', value: 'NEW SECTION' },
                { key: 'icon',  label: 'Icon Key', type: 'text', value: 'summary',
                  placeholder: 'summary | experience | education | projects' },
                { key: 'type',  label: 'Type', type: 'text', value: 'fields',
                  placeholder: 'summary | fields | button' },
                { key: 'dataKey', label: 'Data Key (for fields)', type: 'text', value: '',
                  placeholder: 'experience | education | projects | <new>', full: true },
            ],
            onSave: async (vals) => {
                const sec = { title: vals.title, type: vals.type || 'fields' };
                if (vals.icon) sec.icon = vals.icon;
                if (sec.type === 'fields') {
                    sec.dataKey = vals.dataKey || 'extra';
                    if (!Array.isArray(window.CV_DATA[sec.dataKey])) {
                        window.CV_DATA[sec.dataKey] = [];
                    }
                }
                window.CV_DATA.sections = window.CV_DATA.sections || [];
                window.CV_DATA.sections.push(sec);
                await saveCv();
            },
            onReload: refreshCv,
        });
    }

    /* --- Delete section confirmation --- */
    async function deleteSection(idx) {
        const sec = window.CV_DATA.sections[idx];
        if (!sec) return;
        if (!confirm(`Delete section "${sec.title || sec.dataKey || ''}"? The underlying data array is kept.`)) return;
        window.CV_DATA.sections.splice(idx, 1);
        try { await saveCv(); refreshCv(); }
        catch (e) { alert('Save failed: ' + e.message); }
    }

    /* =============================================================
       Drag-and-drop reordering (SortableJS, lazy-loaded, edit-mode only)
       -------------------------------------------------------------
       Sections + companies persist to CV_DATA (/__save-cv); projects +
       groups persist to PROJECTS_DATA (/__save). After any drop we rebuild
       the affected array from the new DOM order, save, and re-render.
       ============================================================= */
    const SORTABLE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.6/Sortable.min.js';
    let sortableLoading = null;
    function loadSortable() {
        if (window.Sortable) return Promise.resolve();
        if (sortableLoading) return sortableLoading;
        sortableLoading = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = SORTABLE_SRC;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
        return sortableLoading;
    }

    let sortables = [];
    function destroySortables() {
        sortables.forEach(s => { try { s.destroy(); } catch (_) {} });
        sortables = [];
    }

    function companyForField(fieldEl) {
        if (!fieldEl) return '';
        const path = fieldEl.getAttribute('data-edit-item') || '';
        const m = path.match(/^([A-Za-z0-9_]+)\.(\d+)$/);
        if (!m) return '';
        const entry = (window.CV_DATA[m[1]] || [])[+m[2]];
        return (entry && (entry.org || entry.title)) || '';
    }


    function initSortables() {
        if (!document.body.classList.contains('cv-edit-mode')) { destroySortables(); return; }
        if (!window.Sortable) { loadSortable().then(initSortables).catch(() => {}); return; }
        destroySortables();
        const S = window.Sortable;
        // Drag handles are the natural "left/header" zones of each item (the
        // dotted hover overlay marks them). No separate handle buttons.
        const base = { animation: 150, ghostClass: 'cv-drag-ghost', fallbackOnBody: true };

        // Sections (dynamic only — the static hero stays put). Handle: the
        // black strip / section header.
        const main = document.getElementById('cv3Main');
        if (main) sortables.push(new S(main, Object.assign({}, base, {
            draggable: '.cv3-dynamic-section',
            handle: '.cv3-strip, .cv3-section-header',
            onEnd: persistSectionsFromDom,
        })));

        // Companies within each fields section. Handle: the logo / title header.
        document.querySelectorAll('.cv3-fields').forEach(fields => {
            const sectionEl = fields.closest('.cv3-dynamic-section');
            const p = sectionEl && sectionEl.getAttribute('data-edit-item') || '';
            const m = p.match(/^sections\.(\d+)$/);
            const sec = m && window.CV_DATA.sections[+m[1]];
            if (!sec || !sec.dataKey) return;
            sortables.push(new S(fields, Object.assign({}, base, {
                draggable: '.cv3-field',
                handle: '.cv3-field-logo, .cv3-field-title',
                onEnd: () => persistCompaniesFromDom(fields, sec.dataKey),
            })));
        });

        // Projects + groups within each company; members within each group.
        // A shared per-company group lets projects move into/out of groups.
        // Handle: the left image / thumbnail of each card.
        document.querySelectorAll('.cv3-projects-list').forEach(list => {
            const company = companyForField(list.closest('.cv3-field'));
            if (!company) return;
            const groupName = 'cvproj-' + company.toLowerCase();
            sortables.push(new S(list, Object.assign({}, base, {
                group: { name: groupName, pull: true, put: true },
                draggable: '.cv3-project, .cv3-group',
                handle: '.cv3-project-thumb',
                onEnd: () => persistProjectsFromDom(list),
            })));
            list.querySelectorAll('.cv3-group-members').forEach(members => {
                sortables.push(new S(members, Object.assign({}, base, {
                    group: {
                        name: groupName, pull: true,
                        // Members can't contain nested groups.
                        put: (_to, _from, dragEl) => !dragEl.classList.contains('cv3-group'),
                    },
                    draggable: '.cv3-project',
                    handle: '.cv3-project-thumb',
                    onEnd: () => persistProjectsFromDom(list),
                })));
            });
        });
    }

    /* Rebuild CV_DATA.sections from the DOM order of dynamic sections. */
    function persistSectionsFromDom() {
        const main = document.getElementById('cv3Main');
        if (!main) return;
        const order = [...main.querySelectorAll(':scope > .cv3-dynamic-section')].map(el => {
            const m = (el.getAttribute('data-edit-item') || '').match(/^sections\.(\d+)$/);
            return m ? window.CV_DATA.sections[+m[1]] : null;
        }).filter(Boolean);
        if (order.length !== window.CV_DATA.sections.length) { refreshCv(); return; }
        window.CV_DATA.sections = order;
        saveCv().then(refreshCv).catch(e => alert('Save failed: ' + e.message));
    }

    /* Rebuild CV_DATA[dataKey] from the DOM order of its company cards. */
    function persistCompaniesFromDom(fields, dataKey) {
        const arr = window.CV_DATA[dataKey];
        if (!Array.isArray(arr)) return;
        const order = [...fields.querySelectorAll(':scope > .cv3-field')].map(el => {
            const m = (el.getAttribute('data-edit-item') || '').match(new RegExp(`^${dataKey}\\.(\\d+)$`));
            return m ? arr[+m[1]] : null;
        }).filter(Boolean);
        if (order.length !== arr.length) { refreshCv(); return; }
        window.CV_DATA[dataKey] = order;
        saveCv().then(refreshCv).catch(e => alert('Save failed: ' + e.message));
    }

    /* Rebuild one company's entries in PROJECTS_DATA from the DOM order of its
       project cards + groups (with members nested), preserving the company's
       position in the overall array and setting/clearing each project's group. */
    function persistProjectsFromDom(list) {
        const company = companyForField(list.closest('.cv3-field'));
        if (!company || !Array.isArray(window.PROJECTS_DATA)) return;
        const lc = s => String(s || '').toLowerCase();
        const isCompany = p => lc(p.company) === lc(company);
        const byName = new Map();
        window.PROJECTS_DATA.forEach(p => { if (isCompany(p)) byName.set(lc(p.name), p); });

        const ordered = [];
        const take = (name, group) => {
            const e = byName.get(lc(name));
            if (!e) return;
            if (group) e.group = group; else delete e.group;
            ordered.push(e);
        };
        [...list.children].forEach(child => {
            if (child.classList.contains('cv3-group')) {
                const gname = child.getAttribute('data-group-name') || '';
                take(gname, null); // the group entry itself
                const members = child.querySelector('.cv3-group-members');
                if (members) [...members.querySelectorAll(':scope > .cv3-project')].forEach(m =>
                    take(m.getAttribute('data-name') || m.getAttribute('data-title') || '', gname));
            } else if (child.classList.contains('cv3-project')) {
                take(child.getAttribute('data-name') || child.getAttribute('data-title') || '', null);
            }
        });
        if (!ordered.length) { refreshCv(); return; }

        // Splice the rebuilt company block back where it started.
        const arr = window.PROJECTS_DATA;
        const firstIdx = arr.findIndex(isCompany);
        const before = firstIdx < 0 ? 0 : arr.slice(0, firstIdx).filter(p => !isCompany(p)).length;
        const without = arr.filter(p => !isCompany(p));
        without.splice(Math.min(before, without.length), 0, ...ordered);
        window.PROJECTS_DATA = without;
        saveProjects().then(refreshCv).catch(e => alert('Save failed: ' + e.message));
    }

    /* =============================================================
       Pill attachment (per render)
       ============================================================= */
    function clearPills() {
        document.querySelectorAll('.cv-section-pill, .cv-add-section, .cv-proj-tools').forEach(n => n.remove());
    }

    function pill(label, onClick, opts = {}) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cv-section-pill' + (opts.floating ? ' is-floating' : '');
        b.textContent = label;
        b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onClick(e); });
        return b;
    }

    function attachPills() {
        clearPills();

        // Profile (hero)
        const hero = document.getElementById('cv3-hero');
        if (hero) hero.appendChild(pill('Edit Profile', openProfileModal, { floating: true }));

        // Contacts card header
        const contactList = document.getElementById('cv3ContactList');
        const contactCard = contactList && contactList.closest('.cv3-sidebar-card');
        const contactHeader = contactCard && contactCard.querySelector('.cv3-sidebar-card-header');
        if (contactHeader) contactHeader.appendChild(pill('Edit', openContactsModal));

        // Skills card header
        const skillsList = document.getElementById('cv3SkillsList');
        const skillsCard = skillsList && skillsList.closest('.cv3-sidebar-card');
        const skillsHeader = skillsCard && skillsCard.querySelector('.cv3-sidebar-card-header');
        if (skillsHeader) skillsHeader.appendChild(pill('Edit', openSkillsModal));

        // Dynamic sections
        document.querySelectorAll('.cv3-dynamic-section').forEach(sectionEl => {
            const path = sectionEl.getAttribute('data-edit-item') || '';
            const m = path.match(/^sections\.(\d+)$/);
            if (!m) return;
            const idx = +m[1];
            const sec = window.CV_DATA.sections && window.CV_DATA.sections[idx];
            if (!sec) return;

            const editFn = sec.type === 'summary' ? openSummaryModal : () => openSectionModal(idx);
            const wrapper = document.createElement('div');
            wrapper.className = 'cv-section-pill is-floating';
            wrapper.style.display = 'flex';
            wrapper.style.gap = '4px';
            wrapper.style.padding = '0';
            wrapper.style.background = 'transparent';
            wrapper.style.border = 'none';

            const editBtn = pill('Edit', editFn);
            editBtn.classList.remove('is-floating');
            wrapper.appendChild(editBtn);

            const delBtn = pill('×', () => deleteSection(idx));
            delBtn.classList.remove('is-floating');
            delBtn.style.padding = '4px 8px';
            wrapper.appendChild(delBtn);

            sectionEl.appendChild(wrapper);

            // Per-company affordances: company Edit pill, project/group Edit
            // pills, drag handles, and a New Project / New Group toolbar.
            if (sec.type === 'fields' && sec.dataKey && Array.isArray(window.CV_DATA[sec.dataKey])) {
                sectionEl.querySelectorAll('.cv3-field[data-edit-item]').forEach(fieldEl => {
                    const fpath = fieldEl.getAttribute('data-edit-item') || '';
                    const fm = fpath.match(new RegExp(`^${sec.dataKey}\\.(\\d+)$`));
                    if (!fm) return;
                    const ei = +fm[1];
                    const entry = window.CV_DATA[sec.dataKey][ei];
                    const companyName = (entry && (entry.org || entry.title)) || '';

                    if (!fieldEl.querySelector(':scope > .cv-entry-pill')) {
                        const editEntry = pill('Edit', () => openEntryModal(sec.dataKey, ei));
                        editEntry.classList.add('cv-entry-pill');
                        fieldEl.appendChild(editEntry);
                    }

                    const PE = window.ProjectEditor;
                    if (!companyName || !PE) return;
                    const list = fieldEl.querySelector('.cv3-projects-list');
                    if (list) {
                        // Edit pill on each standalone / member project card.
                        list.querySelectorAll('.cv3-project:not(.cv3-group-head)').forEach(card => {
                            if (card.querySelector(':scope > .cv-proj-edit')) return;
                            const pname = card.getAttribute('data-name') || card.getAttribute('data-title') || '';
                            const ep = pill('Edit', () => { const en = PE.findEntry(companyName, pname); if (en) PE.editProject(en); });
                            ep.classList.add('cv-proj-edit');
                            card.appendChild(ep);
                        });
                        // Edit pill on each group head.
                        list.querySelectorAll('.cv3-group').forEach(grp => {
                            const head = grp.querySelector('.cv3-group-head');
                            if (!head) return;
                            if (head.querySelector(':scope > .cv-proj-edit')) return;
                            const gname = grp.getAttribute('data-group-name') || '';
                            const ep = pill('Edit', () => { const en = PE.findEntry(companyName, gname); if (en) PE.editGroup(en); });
                            ep.classList.add('cv-proj-edit');
                            head.appendChild(ep);
                        });
                    }
                    // New Project / New Group toolbar (reuses the gallery modals).
                    if (!fieldEl.querySelector(':scope > .cv-proj-tools')) {
                        const tools = document.createElement('div');
                        tools.className = 'cv-proj-tools';
                        const np = document.createElement('button');
                        np.type = 'button'; np.className = 'cv-add-section cv-add-company-inline';
                        np.textContent = '+ New Project';
                        np.addEventListener('click', e => { e.preventDefault(); PE.createNewProject({ company: companyName }); });
                        const ng = document.createElement('button');
                        ng.type = 'button'; ng.className = 'cv-add-section cv-add-company-inline';
                        ng.textContent = '+ New Group';
                        ng.addEventListener('click', e => { e.preventDefault(); PE.createNewGroup({ company: companyName }); });
                        tools.appendChild(np);
                        tools.appendChild(ng);
                        fieldEl.appendChild(tools);
                    }
                });
            }

            // Per-section "+ Add Company" button at the bottom of `fields`
            // sections backed by an array — adds a new entry directly to that section.
            if (sec.type === 'fields' && sec.dataKey && Array.isArray(window.CV_DATA[sec.dataKey])) {
                const addEntry = document.createElement('button');
                addEntry.type = 'button';
                addEntry.className = 'cv-add-section cv-add-company-inline';
                addEntry.textContent = '+ Add Company';
                addEntry.addEventListener('click', (e) => {
                    e.preventDefault();
                    openAddCompanyModal(sec.dataKey);
                });
                sectionEl.appendChild(addEntry);
            }
        });

        // Add Section button at bottom of main
        const main = document.getElementById('cv3Main');
        if (main && !main.querySelector(':scope > .cv-add-section')) {
            const add = document.createElement('button');
            add.type = 'button';
            add.className = 'cv-add-section';
            add.textContent = '+ Add Section';
            add.addEventListener('click', openAddSectionModal);
            main.appendChild(add);
        }

        // Drag-and-drop reordering (replaces the old up/down pills).
        initSortables();
    }

    /* =============================================================
       Edit-mode toggle
       ============================================================= */
    DE.installEditToggle({
        storageKey: 'cv3-edit-mode',
        label: 'Edit CV',
        doneLabel: 'Done',
        // Mirror onto legacy class name still referenced by cv/index.html.
        onChange: (on) => {
            document.body.classList.toggle('cv-edit-mode', on);
            if (on) loadSortable().then(initSortables).catch(() => {});
            else destroySortables();
        },
    });

    document.addEventListener('DOMContentLoaded', () => {
        // Pills are attached after every render via cvEditor.onRender.
        attachPills();
    });

    window.cvEditor = { onRender: attachPills };
})();

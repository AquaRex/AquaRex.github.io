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
        /* Hide legacy inline edit affordances baked into the renderer. */
        .cv3-edit-only { display: none !important; }

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

        /* Project reorder pills — top-left inside each .cv3-project. */
        .cv3-project { position: relative; }
        .cv-proj-reorder {
            position: absolute;
            top: 6px; left: 6px;
            z-index: 4;
            display: flex; gap: 4px;
        }
        .cv-proj-reorder button {
            background: var(--accent-color, #fbc25b);
            color: var(--dark, #151312);
            border: 2px solid var(--border, #151312);
            border-radius: 0;
            width: 28px; height: 24px;
            font-size: 14px; font-weight: 900;
            line-height: 1;
            cursor: pointer;
            padding: 0;
        }
        .cv-proj-reorder button:hover { filter: brightness(0.95); }
        .cv-proj-reorder button:disabled { opacity: 0.3; cursor: not-allowed; }
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
                { key: 'photo.src', label: 'Photo URL', type: 'text', full: true, value: photo.src || '' },
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
            const entries = window.CV_DATA[sec.dataKey] || [];
            fields.push({
                key: '__entries', label: `${sec.dataKey} entries`, type: 'rows', full: true,
                value: entries.map(e => ({
                    date:  e.date  || '',
                    title: e.title || '',
                    org:   e.org   || '',
                    description: descToString(e.description),
                    logoSrc: (e.logo && e.logo.src) || '',
                })),
                addLabel: 'Add Entry',
                columns: [
                    { key: 'date',        label: 'Date',  type: 'text' },
                    { key: 'title',       label: 'Title', type: 'text' },
                    { key: 'org',         label: 'Org',   type: 'text', full: true },
                    { key: 'description', label: 'Description', type: 'textarea', rows: 3, full: true },
                    { key: 'logoSrc',     label: 'Logo URL', type: 'text', full: true },
                ],
            });
        }

        DE.openModal({
            title: `Edit Section: ${sec.title || sec.dataKey || ''}`,
            subtitle: `sections.${idx}`,
            reloadOnSave: false,
            fields,
            onSave: async (vals) => {
                sec.title = vals.__title;
                if (vals.__icon) sec.icon = vals.__icon; else delete sec.icon;
                sec.type = vals.__type || 'fields';
                if (sec.type === 'fields') {
                    if (vals.__dataKey) sec.dataKey = vals.__dataKey;
                    const dk = sec.dataKey;
                    if (dk && Array.isArray(vals.__entries)) {
                        const original = window.CV_DATA[dk] || [];
                        const out = vals.__entries.map((r, i) => {
                            const orig = original[i] || {};
                            const entry = {
                                date:  r.date,
                                title: r.title,
                                org:   r.org,
                                description: stringToDesc(orig.description, r.description || ''),
                            };
                            if (r.logoSrc) entry.logo = { src: r.logoSrc };
                            // Preserve untouched extras (e.g. projects) when the row index aligns.
                            if (orig.projects) entry.projects = orig.projects;
                            return entry;
                        });
                        window.CV_DATA[dk] = out;
                    }
                }
                await saveCv();
            },
            onReload: refreshCv,
            extraButtons: [],
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
       Project reorder (modifies PROJECTS_DATA)
       ============================================================= */
    function reorderProject(company, name, dir) {
        if (!Array.isArray(window.PROJECTS_DATA)) return;
        const arr = window.PROJECTS_DATA;
        const ofCompany = arr
            .map((p, i) => ({ p, i }))
            .filter(x => (x.p.company || '').toLowerCase() === (company || '').toLowerCase());
        const localIdx = ofCompany.findIndex(x => (x.p.name || '').toLowerCase() === (name || '').toLowerCase());
        if (localIdx < 0) return;
        const swapWith = localIdx + dir;
        if (swapWith < 0 || swapWith >= ofCompany.length) return;
        const a = ofCompany[localIdx].i;
        const b = ofCompany[swapWith].i;
        [arr[a], arr[b]] = [arr[b], arr[a]];
        saveProjects().then(refreshCv).catch(e => alert('Save failed: ' + e.message));
    }

    /* =============================================================
       Pill attachment (per render)
       ============================================================= */
    function clearPills() {
        document.querySelectorAll('.cv-section-pill, .cv-add-section, .cv-proj-reorder').forEach(n => n.remove());
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

        // Project reorder pills
        document.querySelectorAll('.cv3-project[data-edit-item]').forEach(card => {
            const path = card.getAttribute('data-edit-item');
            const m = path.match(/^(experience|projects)\.(\d+)\.projects\.(\d+)$/);
            if (!m) return;
            const cat = m[1], parentIdx = +m[2], projIdx = +m[3];
            const parent = (window.CV_DATA[cat] || [])[parentIdx];
            const company = parent && (cat === 'experience' ? parent.org : parent.title);
            const proj = parent && parent.projects && parent.projects[projIdx];
            if (!company || !proj) return;

            const ofCompanyCount = (window.PROJECTS_DATA || [])
                .filter(p => (p.company || '').toLowerCase() === (company || '').toLowerCase()).length;

            const tools = document.createElement('div');
            tools.className = 'cv-proj-reorder';
            const up = document.createElement('button');
            up.type = 'button'; up.textContent = '↑'; up.title = 'Move up';
            up.disabled = projIdx === 0;
            up.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); reorderProject(company, proj.name, -1); });
            const down = document.createElement('button');
            down.type = 'button'; down.textContent = '↓'; down.title = 'Move down';
            down.disabled = projIdx === ofCompanyCount - 1;
            down.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); reorderProject(company, proj.name, 1); });
            tools.appendChild(up);
            tools.appendChild(down);
            card.appendChild(tools);
        });
    }

    /* =============================================================
       Edit-mode toggle
       ============================================================= */
    DE.installEditToggle({
        storageKey: 'cv3-edit-mode',
        label: 'Edit CV',
        doneLabel: 'Done',
        // Mirror onto legacy class name still referenced by cv/index.html.
        onChange: (on) => document.body.classList.toggle('cv-edit-mode', on),
    });

    document.addEventListener('DOMContentLoaded', () => {
        // Pills are attached after every render via cvEditor.onRender.
        attachPills();
    });

    window.cvEditor = { onRender: attachPills };
})();

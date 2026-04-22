/* ================================================================
   CV Editor (localhost-only)
   --------------------------------------------------------------
   - Only loads when the page is served from localhost / 127.0.0.1
   - Edits CV_DATA in-memory and re-renders via window.renderCv3()
   - Save = downloads an updated cv/cv.js; commit it manually
   ================================================================ */

(function () {
    'use strict';

    /* ---------- Localhost gate ---------- */
    const host = location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '' || location.protocol === 'file:';
    if (!isLocal) return;

    /* ---------- State ---------- */
    let originalData = null;  // snapshot for cancel (start of current edit session)
    let editMode     = false;
    let dirty        = false;  // edits made in current edit session
    let sessionDirty = false;  // changes applied via Test but not yet downloaded
    let bar, dirtyDot, editBtn, saveBtn, cancelBtn, testBtn, downloadBtn;

    /* ---------- DOM helpers ---------- */
    function el(tag, attrs = {}, children = []) {
        const n = document.createElement(tag);
        for (const k in attrs) {
            if (k === 'class') n.className = attrs[k];
            else if (k === 'text') n.textContent = attrs[k];
            else if (k.startsWith('on') && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
            else n.setAttribute(k, attrs[k]);
        }
        (Array.isArray(children) ? children : [children]).forEach(c => {
            if (c == null) return;
            n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
        });
        return n;
    }

    /* ---------- Path utilities ---------- */
    function getByPath(obj, path) {
        return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
    }
    function setByPath(obj, path, value) {
        const parts = path.split('.');
        let cur = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const k = parts[i];
            if (cur[k] == null) {
                // auto-create: number -> array element, else object
                const nextK = parts[i + 1];
                cur[k] = /^\d+$/.test(nextK) ? [] : {};
            }
            cur = cur[k];
        }
        cur[parts[parts.length - 1]] = value;
    }
    function deleteByPath(obj, path) {
        const parts = path.split('.');
        const last = parts.pop();
        const parent = parts.reduce((o, k) => (o == null ? undefined : o[k]), obj);
        if (!parent) return;
        if (Array.isArray(parent) && /^\d+$/.test(last)) parent.splice(parseInt(last, 10), 1);
        else delete parent[last];
    }

    /* ---------- Status pill ---------- */
    let statusEl = null;
    let statusTimer = null;
    function showStatus(msg, kind = 'info', sticky = false) {
        if (statusEl) statusEl.remove();
        statusEl = el('div', { class: `cv-editor-status ${kind}`, text: msg });
        document.body.appendChild(statusEl);
        clearTimeout(statusTimer);
        if (!sticky) statusTimer = setTimeout(() => { statusEl && statusEl.remove(); statusEl = null; }, 4000);
    }

    /* ================================================================
       TOOLBAR
       ================================================================ */
    function buildBar() {
        bar = el('div', { class: 'cv-editor-bar' });
        editBtn     = el('button', { class: 'primary',   text: 'Edit',           onclick: enterEditMode });
        testBtn     = el('button', { class: 'primary',   text: 'Test',           onclick: testChanges, title: 'Apply changes for this session without saving to disk' });
        saveBtn     = el('button', { class: 'primary',   text: 'Download cv.js', onclick: saveChanges });
        downloadBtn = el('button', { class: 'primary',   text: 'Download cv.js', onclick: downloadSession, title: 'Save tested changes to cv.js' });
        cancelBtn   = el('button', { class: 'secondary', text: 'Cancel',         onclick: cancelChanges });
        document.body.appendChild(bar);
        refreshBar();
    }

    function refreshBar() {
        bar.innerHTML = '';
        if (editMode) {
            if (dirty) {
                dirtyDot = el('span', { class: 'dirty-dot', title: 'Unsaved changes' });
                testBtn.innerHTML = '';
                testBtn.appendChild(dirtyDot);
                testBtn.appendChild(document.createTextNode('Test'));
            } else {
                testBtn.textContent = 'Test';
            }
            bar.appendChild(testBtn);
            bar.appendChild(saveBtn);
            bar.appendChild(cancelBtn);
        } else {
            bar.appendChild(editBtn);
            if (sessionDirty) {
                downloadBtn.innerHTML = '';
                downloadBtn.appendChild(el('span', { class: 'dirty-dot', title: 'Tested but not saved' }));
                downloadBtn.appendChild(document.createTextNode('Download cv.js'));
                bar.appendChild(downloadBtn);
            }
        }
    }

    /* ================================================================
       SERIALIZATION
       ================================================================ */
    function serializeCvJs(data) {
        const json = JSON.stringify(data, null, 4);
        return 'window.CV_DATA = ' + json + ';\n';
    }

    function downloadCvJs(content) {
        const blob = new Blob([content], { type: 'application/javascript' });
        const url  = URL.createObjectURL(blob);
        const a    = el('a', { href: url, download: 'cv.js' });
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    /* ================================================================
       EDIT MODE
       ================================================================ */
    function enterEditMode() {
        originalData = JSON.parse(JSON.stringify(window.CV_DATA || {}));
        editMode = true;
        dirty = false;
        if (saveBtn) saveBtn.disabled = false;
        document.body.classList.add('cv-edit-mode');
        // Re-render so view-mode-hidden items reappear under edit mode
        window.renderCv3 && window.renderCv3();
        bindEditableElements(document);
        injectAddButtons();
        injectReorderHandles();
        refreshBar();
        showStatus('Edit mode: click any text to edit. "Test" applies for this session, "Download cv.js" saves to disk.', 'info');
    }

    function exitEditMode(discard) {
        if (discard && originalData) {
            window.CV_DATA = originalData;
        }
        editMode = false;
        dirty = false;
        originalData = null;
        document.body.classList.remove('cv-edit-mode');
        removeEditControls();
        // Re-render so attribute-bound values (href, src, data-*) reflect latest CV_DATA
        window.renderCv3 && window.renderCv3();
        refreshBar();
    }

    function removeEditControls() {
        document.querySelectorAll('.cv-edit-add-btn, .cv-edit-del-btn, .cv-edit-move-btn').forEach(n => n.remove());
        document.querySelectorAll('[data-edit-list]').forEach(n => { n.__cvEditAddBound = false; });
        document.querySelectorAll('[data-edit-path]').forEach(n => {
            n.removeAttribute('contenteditable');
            n.__cvEditorBound = false;
        });
    }

    function markDirty() {
        dirty = true;
        refreshBar();
    }

    function bindEditableElements(root) {
        root.querySelectorAll('[data-edit-path]').forEach(bindEditable);
    }

    function bindEditable(node) {
        if (node.__cvEditorBound) return;
        node.__cvEditorBound = true;
        const path = node.getAttribute('data-edit-path');
        const type = node.getAttribute('data-edit-type') || 'text';

        if (type === 'bool') {
            node.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const cur = !!getByPath(window.CV_DATA, path);
                setByPath(window.CV_DATA, path, !cur);
                markDirty();
                window.renderCv3 && window.renderCv3();
            });
            return;
        }

        node.setAttribute('contenteditable', 'plaintext-only');
        node.addEventListener('focus', (e) => e.stopPropagation());
        node.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && type !== 'multiline' && type !== 'multiline-array') {
                e.preventDefault();
                node.blur();
            }
        });
        node.addEventListener('blur', () => commitEdit(node, path, type));
        // Prevent link nav when a click lands on a contenteditable <a>
        if (node.tagName === 'A') {
            node.addEventListener('click', (e) => { if (editMode) e.preventDefault(); });
        }
    }

    function commitEdit(node, path, type) {
        let value = node.innerText.trim();
        const current = getByPath(window.CV_DATA, path);

        if (type === 'multiline-array') {
            const arr = value.split(/\n+/).map(s => s.trim()).filter(Boolean);
            if (JSON.stringify(arr) === JSON.stringify(current)) return;
            setByPath(window.CV_DATA, path, arr);
            markDirty();
            return;
        }

        // For skills, an empty value means delete
        if (path.startsWith('skills.') && value === '') {
            deleteByPath(window.CV_DATA, path);
            markDirty();
            window.renderCv3();
            return;
        }

        if (value === current) return;
        setByPath(window.CV_DATA, path, value);
        markDirty();
    }

    /* ---------- Add / delete controls ---------- */
    function injectAddButtons() {
        // Add "× delete" to each edit-item
        document.querySelectorAll('[data-edit-item]').forEach(injectDelButton);

        // Add "+ Add" for each edit-list
        document.querySelectorAll('[data-edit-list]').forEach(injectAddButton);

        // Add "+ Add Section" at bottom of main
        injectAddSectionButton();
    }

    function injectDelButton(node) {
        if (node.querySelector(':scope > .cv-edit-del-btn')) return;
        const path = node.getAttribute('data-edit-item');
        const btn = el('button', {
            class: 'cv-edit-del-btn',
            title: 'Delete',
            text: '×',
            onclick: (e) => {
                e.stopPropagation();
                const itemName = shortLabelForPath(path);
                if (!confirm(`Delete ${itemName}?`)) return;
                deleteByPath(window.CV_DATA, path);
                markDirty();
                window.renderCv3();
            }
        });
        node.appendChild(btn);
    }

    function shortLabelForPath(p) {
        if (p.startsWith('skills.')) return 'this skill';
        if (p.startsWith('about.')) return 'this contact entry';
        if (p.startsWith('experience.') && p.includes('.projects.')) return 'this project';
        if (p.startsWith('experience.')) return 'this experience entry';
        if (p.startsWith('education.')) return 'this education entry';
        if (p.startsWith('sections.')) return 'this section';
        return 'this item';
    }

    function injectAddButton(container) {
        if (container.__cvEditAddBound) return;
        container.__cvEditAddBound = true;
        const listPath = container.getAttribute('data-edit-list');
        const btn = el('button', {
            class: 'cv-edit-add-btn',
            text: '+ Add ' + addLabelForListPath(listPath),
            onclick: (e) => {
                e.preventDefault();
                addItemToList(listPath);
            }
        });
        container.insertAdjacentElement('afterend', btn);
    }

    function addLabelForListPath(p) {
        if (p === 'skills') return 'Skill';
        if (p === 'about') return 'Contact Entry';
        if (p === 'experience') return 'Experience';
        if (p === 'education') return 'Education';
        if (p.endsWith('.projects')) return 'Project';
        if (p.endsWith('.tags')) return 'Tag';
        return 'Item';
    }

    function addItemToList(listPath) {
        const list = getByPath(window.CV_DATA, listPath);
        if (!Array.isArray(list)) {
            // Auto-create if missing (e.g. tags: [] on a new project)
            setByPath(window.CV_DATA, listPath, []);
        }
        const arr = getByPath(window.CV_DATA, listPath);
        const blank = blankItemFor(listPath);
        if (blank === null) {
            const v = prompt('Value:');
            if (v == null || v.trim() === '') return;
            arr.push(v.trim());
        } else {
            arr.push(blank);
        }
        markDirty();
        window.renderCv3();
    }

    function blankItemFor(path) {
        if (path === 'skills') return null; // prompt
        if (path.endsWith('.tags')) return null;
        if (path === 'about') return { label: 'New', value: 'value' };
        if (path === 'experience') return { date: '', title: 'Role', org: 'Organization', description: 'Describe your role.', logo: { src: '', alt: '' }, projects: [] };
        if (path === 'education') return { date: '', title: 'Institution', org: '', description: 'Details.', logo: { src: '', alt: '' } };
        if (path.endsWith('.projects')) return { name: 'New Project', date: '', summary: 'Short summary.', popupDescription: 'Longer description.', image: '', tags: [], showOnCv: true, link: { label: '', url: '', showOnCard: false } };
        return {};
    }

    function injectAddSectionButton() {
        if (document.getElementById('cvEditAddSection')) return;
        const main = document.getElementById('cv3Main');
        if (!main) return;
        const btn = el('button', {
            id: 'cvEditAddSection',
            class: 'cv-edit-add-btn cv-edit-section-add',
            text: '+ Add Section',
            onclick: addSection
        });
        main.appendChild(btn);
    }

    function addSection() {
        const type = prompt('Section type? (summary | fields | button)', 'fields');
        if (!type) return;
        if (type !== 'summary' && type !== 'fields' && type !== 'button') { alert('Type must be "summary", "fields", or "button".'); return; }
        const title = prompt('Section title?', 'NEW SECTION');
        if (!title) return;
        const section = { icon: 'projects', title, type };
        if (type === 'fields') {
            const dataKey = prompt('Data key (e.g. "projects", "awards")?', 'projects');
            if (!dataKey) return;
            section.dataKey = dataKey;
            if (!Array.isArray(window.CV_DATA[dataKey])) window.CV_DATA[dataKey] = [];
        }
        if (type === 'button') {
            section.button = { label: 'Click me', url: 'https://example.com' };
        }
        window.CV_DATA.sections = window.CV_DATA.sections || [];
        window.CV_DATA.sections.push(section);
        markDirty();
        window.renderCv3();
    }

    /* ================================================================
       REORDER (up / down buttons)
       ================================================================ */
    function injectReorderHandles() {
        document.querySelectorAll('[data-edit-list]').forEach(container => {
            const listPath = container.getAttribute('data-edit-list');
            const items = container.querySelectorAll(`:scope > [data-edit-item^="${listPath}."]`);
            const arr = getByPath(window.CV_DATA, listPath) || [];
            items.forEach((item) => {
                if (item.querySelector(':scope > .cv-edit-move-up, :scope > .cv-edit-move-down')) return;
                const idx = getItemIndex(item, listPath);
                const upBtn = el('button', {
                    class: 'cv-edit-move-btn cv-edit-move-up',
                    title: 'Move up',
                    text: '\u2191',
                    onclick: (e) => { e.stopPropagation(); moveItem(listPath, idx, idx - 1); }
                });
                const downBtn = el('button', {
                    class: 'cv-edit-move-btn cv-edit-move-down',
                    title: 'Move down',
                    text: '\u2193',
                    onclick: (e) => { e.stopPropagation(); moveItem(listPath, idx, idx + 1); }
                });
                if (idx === 0) upBtn.disabled = true;
                if (idx === arr.length - 1) downBtn.disabled = true;
                item.appendChild(upBtn);
                item.appendChild(downBtn);
            });
        });
    }

    function moveItem(listPath, fromIdx, toIdx) {
        const arr = getByPath(window.CV_DATA, listPath);
        if (!Array.isArray(arr)) return;
        if (toIdx < 0 || toIdx >= arr.length || fromIdx === toIdx) return;
        const [moved] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, moved);
        markDirty();
        window.renderCv3();
    }

    function getItemIndex(node, listPath) {
        const ref = node.getAttribute('data-edit-item');
        const m = ref && ref.match(new RegExp('^' + escapeReg(listPath) + '\\.(\\d+)$'));
        return m ? parseInt(m[1], 10) : -1;
    }
    function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    /* ================================================================
       SAVE / TEST / CANCEL
       ================================================================ */
    function testChanges() {
        // Exit edit chrome but KEEP in-memory edits for this session.
        if (dirty) sessionDirty = true;
        exitEditMode(false);
        showStatus(sessionDirty
            ? 'Changes applied for this session. Click "Download cv.js" when ready to save.'
            : 'No changes to test.', 'ok');
    }

    async function saveChanges() {
        if (!dirty && !sessionDirty) { exitEditMode(false); return; }
        try {
            const content = serializeCvJs(window.CV_DATA);
            downloadCvJs(content);
            sessionDirty = false;
            exitEditMode(false);
            showStatus('Downloaded cv.js — replace cv/cv.js in the repo and commit.', 'ok');
        } catch (e) {
            showStatus('Save failed: ' + e.message, 'error', true);
        }
    }

    function downloadSession() {
        try {
            const content = serializeCvJs(window.CV_DATA);
            downloadCvJs(content);
            sessionDirty = false;
            refreshBar();
            showStatus('Downloaded cv.js — replace cv/cv.js in the repo and commit.', 'ok');
        } catch (e) {
            showStatus('Save failed: ' + e.message, 'error', true);
        }
    }

    function cancelChanges() {
        if (dirty && !confirm('Discard changes made since you clicked Edit?')) return;
        exitEditMode(true);
        showStatus('Changes discarded.', 'ok');
    }

    /* ================================================================
       PUBLIC / INIT
       ================================================================ */
    window.cvEditor = {
        onRender() {
            // Called by renderCv3 after re-render; re-attach edit controls.
            if (!editMode) return;
            bindEditableElements(document);
            injectAddButtons();
            injectReorderHandles();
        }
    };

    function init() {
        buildBar();
        // Suppress link navigation in edit mode for any <a> inside an editable item
        document.addEventListener('click', (e) => {
            if (!editMode) return;
            const a = e.target.closest && e.target.closest('a');
            if (!a) return;
            if (a.closest('[data-edit-item], [data-edit-path], [data-edit-list]')) {
                e.preventDefault();
            }
        }, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

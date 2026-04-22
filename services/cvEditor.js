/* ================================================================
   CV Editor
   --------------------------------------------------------------
   - Login = paste a GitHub fine-grained Personal Access Token
     (scoped to this repo, Contents: write)
   - Persists edits in-memory, re-renders via window.renderCv3()
   - On Save: commits the updated cv.js back to GitHub via API
   ---
   NOTE: "OAuth via third-party service" would require a backend
   to exchange the client secret. Using a PAT keeps this static.
   ================================================================ */

(function () {
    'use strict';

    /* ---------- Storage keys ---------- */
    const LS_TOKEN  = 'cv-editor-gh-token';
    const LS_REPO   = 'cv-editor-gh-repo';    // "owner/repo"
    const LS_PATH   = 'cv-editor-gh-path';    // "cv/cv.js"
    const LS_BRANCH = 'cv-editor-gh-branch';  // "main"

    /* ---------- State ---------- */
    let originalData = null;  // snapshot for cancel
    let editMode     = false;
    let dirty        = false;
    let bar, dirtyDot, editBtn, saveBtn, cancelBtn, loginBtn, logoutBtn, settingsBtn;

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
        loginBtn    = el('button', { class: 'primary', text: 'Login', onclick: openLoginModal });
        settingsBtn = el('button', { class: 'secondary', text: 'Settings', onclick: openSettingsModal });
        editBtn     = el('button', { class: 'primary', text: 'Edit', onclick: enterEditMode });
        saveBtn     = el('button', { class: 'primary', text: 'Save', onclick: saveChanges });
        cancelBtn   = el('button', { class: 'secondary', text: 'Cancel', onclick: cancelChanges });
        logoutBtn   = el('button', { class: 'danger', text: 'Logout', onclick: logout });
        document.body.appendChild(bar);
        refreshBar();
    }

    function refreshBar() {
        bar.innerHTML = '';
        const hasToken = !!localStorage.getItem(LS_TOKEN);
        if (!hasToken) {
            bar.appendChild(loginBtn);
            return;
        }
        if (editMode) {
            if (dirty) {
                dirtyDot = el('span', { class: 'dirty-dot', title: 'Unsaved changes' });
                saveBtn.innerHTML = '';
                saveBtn.appendChild(dirtyDot);
                saveBtn.appendChild(document.createTextNode('Save'));
            } else {
                saveBtn.textContent = 'Save';
            }
            bar.appendChild(saveBtn);
            bar.appendChild(cancelBtn);
        } else {
            bar.appendChild(editBtn);
            bar.appendChild(settingsBtn);
        }
    }

    /* ================================================================
       LOGIN / SETTINGS MODALS
       ================================================================ */
    function closeModal() {
        document.querySelectorAll('.cv-editor-modal-overlay').forEach(n => n.remove());
    }

    function openLoginModal() {
        closeModal();
        const repoInput   = el('input', { type: 'text', placeholder: 'owner/repo (e.g. AquaRex/AquaRex.github.io)', value: localStorage.getItem(LS_REPO) || guessRepo() });
        const pathInput   = el('input', { type: 'text', placeholder: 'cv/cv.js', value: localStorage.getItem(LS_PATH) || 'cv/cv.js' });
        const branchInput = el('input', { type: 'text', placeholder: 'main', value: localStorage.getItem(LS_BRANCH) || 'main' });
        const tokenInput  = el('input', { type: 'password', placeholder: 'github_pat_...' });
        const errorMsg    = el('div', { class: 'error-msg' });

        const loginAction = async () => {
            errorMsg.textContent = '';
            const repo = repoInput.value.trim();
            const path = pathInput.value.trim();
            const branch = branchInput.value.trim() || 'main';
            const token = tokenInput.value.trim();
            if (!repo || !path || !token) { errorMsg.textContent = 'Repo, path, and token are required.'; return; }
            if (!/^[^/]+\/[^/]+$/.test(repo)) { errorMsg.textContent = 'Repo must be in the form "owner/repo".'; return; }
            errorMsg.textContent = 'Validating…';
            const ok = await validateToken(token, repo, path, branch);
            if (ok !== true) { errorMsg.textContent = 'Failed: ' + ok; return; }
            localStorage.setItem(LS_TOKEN, token);
            localStorage.setItem(LS_REPO, repo);
            localStorage.setItem(LS_PATH, path);
            localStorage.setItem(LS_BRANCH, branch);
            closeModal();
            refreshBar();
            showStatus('Logged in.', 'ok');
        };

        const modal = el('div', { class: 'cv-editor-modal' }, [
            el('h2', { text: 'Login to Edit' }),
            el('p', { text: 'Paste a GitHub fine-grained Personal Access Token with "Contents: write" permission on this repository. Everything is stored locally in your browser.' }),
            el('label', { text: 'Repository' }),
            repoInput,
            el('label', { text: 'File path' }),
            pathInput,
            el('label', { text: 'Branch' }),
            branchInput,
            el('label', { text: 'GitHub Personal Access Token' }),
            tokenInput,
            errorMsg,
            el('div', { class: 'actions' }, [
                el('button', { class: 'secondary', text: 'Cancel', onclick: closeModal }),
                el('button', { text: 'Login', onclick: loginAction })
            ])
        ]);
        const overlay = el('div', { class: 'cv-editor-modal-overlay' }, [modal]);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
        document.body.appendChild(overlay);
        tokenInput.focus();
    }

    function openSettingsModal() {
        closeModal();
        const repoInput   = el('input', { type: 'text', value: localStorage.getItem(LS_REPO) || '' });
        const pathInput   = el('input', { type: 'text', value: localStorage.getItem(LS_PATH) || 'cv/cv.js' });
        const branchInput = el('input', { type: 'text', value: localStorage.getItem(LS_BRANCH) || 'main' });

        const save = () => {
            localStorage.setItem(LS_REPO, repoInput.value.trim());
            localStorage.setItem(LS_PATH, pathInput.value.trim());
            localStorage.setItem(LS_BRANCH, branchInput.value.trim() || 'main');
            closeModal();
            showStatus('Settings saved.', 'ok');
        };

        const modal = el('div', { class: 'cv-editor-modal' }, [
            el('h2', { text: 'Settings' }),
            el('label', { text: 'Repository' }), repoInput,
            el('label', { text: 'File path' }), pathInput,
            el('label', { text: 'Branch' }), branchInput,
            el('div', { class: 'actions' }, [
                el('button', { class: 'danger', text: 'Logout', onclick: () => { closeModal(); logout(); } }),
                el('button', { class: 'secondary', text: 'Cancel', onclick: closeModal }),
                el('button', { text: 'Save', onclick: save })
            ])
        ]);
        const overlay = el('div', { class: 'cv-editor-modal-overlay' }, [modal]);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
        document.body.appendChild(overlay);
    }

    function guessRepo() {
        // Custom domain? fall back to hard default for this project.
        const host = location.hostname;
        if (host.endsWith('.github.io')) {
            const owner = host.split('.')[0];
            return `${owner}/${host}`;
        }
        return 'AquaRex/AquaRex.github.io';
    }

    function logout() {
        if (editMode && dirty) {
            if (!confirm('You have unsaved changes. Logout anyway?')) return;
        }
        localStorage.removeItem(LS_TOKEN);
        if (editMode) exitEditMode(true);
        refreshBar();
        showStatus('Logged out.', 'ok');
    }

    /* ================================================================
       GITHUB API
       ================================================================ */
    function ghHeaders() {
        return {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${localStorage.getItem(LS_TOKEN)}`,
            'X-GitHub-Api-Version': '2022-11-28'
        };
    }

    async function validateToken(token, repo, path, branch) {
        try {
            const res = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`, {
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${token}`,
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });
            if (res.status === 401) return 'invalid token';
            if (res.status === 404) return 'file or repo not found (check path/branch)';
            if (!res.ok) return `HTTP ${res.status}`;
            return true;
        } catch (e) {
            return e.message || 'network error';
        }
    }

    async function fetchCurrentSha() {
        const repo   = localStorage.getItem(LS_REPO);
        const path   = localStorage.getItem(LS_PATH);
        const branch = localStorage.getItem(LS_BRANCH) || 'main';
        const res = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`, { headers: ghHeaders() });
        if (!res.ok) throw new Error(`Fetch SHA failed: HTTP ${res.status}`);
        const json = await res.json();
        return json.sha;
    }

    async function commitFile(content, message) {
        const repo   = localStorage.getItem(LS_REPO);
        const path   = localStorage.getItem(LS_PATH);
        const branch = localStorage.getItem(LS_BRANCH) || 'main';
        const sha    = await fetchCurrentSha();
        const encoded = b64encodeUtf8(content);
        const res = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}`, {
            method: 'PUT',
            headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, content: encoded, sha, branch })
        });
        if (!res.ok) {
            let errTxt;
            try { errTxt = (await res.json()).message; } catch { errTxt = `HTTP ${res.status}`; }
            throw new Error(errTxt);
        }
        return await res.json();
    }

    function b64encodeUtf8(str) {
        // Handles non-ASCII safely
        return btoa(unescape(encodeURIComponent(str)));
    }

    /* ================================================================
       SERIALIZATION
       ================================================================ */
    function serializeCvJs(data) {
        // JSON.stringify produces valid JS for plain data objects.
        const json = JSON.stringify(data, null, 4);
        return 'window.CV_DATA = ' + json + ';\n';
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
        bindEditableElements(document);
        injectAddButtons();
        injectReorderHandles();
        refreshBar();
        showStatus('Edit mode: click any text to edit. Changes commit to GitHub on Save.', 'info');
    }

    function exitEditMode(discard) {
        if (discard && originalData) {
            window.CV_DATA = originalData;
            window.renderCv3 && window.renderCv3();
        }
        editMode = false;
        dirty = false;
        originalData = null;
        document.body.classList.remove('cv-edit-mode');
        removeEditControls();
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
        if (path.endsWith('.projects')) return { name: 'New Project', date: '', summary: 'Short summary.', popupDescription: 'Longer description.', image: '', tags: [] };
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
        const type = prompt('Section type? (summary | fields)', 'fields');
        if (!type) return;
        if (type !== 'summary' && type !== 'fields') { alert('Type must be "summary" or "fields".'); return; }
        const title = prompt('Section title?', 'NEW SECTION');
        if (!title) return;
        const section = { icon: 'projects', title, type };
        if (type === 'fields') {
            const dataKey = prompt('Data key (e.g. "projects", "awards")?', 'projects');
            if (!dataKey) return;
            section.dataKey = dataKey;
            if (!Array.isArray(window.CV_DATA[dataKey])) window.CV_DATA[dataKey] = [];
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
       SAVE / CANCEL
       ================================================================ */
    async function saveChanges() {
        if (!dirty) { exitEditMode(false); return; }
        saveBtn.disabled = true;
        showStatus('Committing to GitHub…', 'info', true);
        try {
            const content = serializeCvJs(window.CV_DATA);
            const result  = await commitFile(content, 'chore(cv): update content via in-browser editor');
            exitEditMode(false);
            showStatus(`Saved. Commit ${result.commit.sha.slice(0, 7)}.`, 'ok');
        } catch (e) {
            showStatus('Save failed: ' + e.message, 'error', true);
            saveBtn.disabled = false;
        }
    }

    function cancelChanges() {
        if (dirty && !confirm('Discard all unsaved changes?')) return;
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

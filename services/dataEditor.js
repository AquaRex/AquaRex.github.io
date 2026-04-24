/* =================================================================
   DATA EDITOR — shared localhost-only edit-modal infrastructure.

   Used by both projectEditor.js (PROJECTS_DATA → /__save) and
   cvEditor.js (CV_DATA → /__save-cv). Provides:

     DataEditor.IS_LOCAL                 true on localhost / 127.0.0.1
     DataEditor.injectStyles()           one-time CSS injection
     DataEditor.makeEditButton({...})    yellow CV3-style "Edit" pill
     DataEditor.openModal({...})         generic field-driven modal
     DataEditor.escapeHtml(s)
     DataEditor.escapeAttr(s)
     DataEditor.setPath(obj, path, val)  dotted-path setter

   openModal options:
     title       — header label (UPPERCASE shown)
     subtitle    — small line under header
     fields      — [{ key, label, type, value, placeholder?, full? }]
                   types: 'text' | 'textarea' | 'tags' | 'bool'
                   key supports dots ('link.url') for nested writes
                   full=true → row spans both columns
     onSave(values)  async function. Throw to surface error.
                     Resolve normally to trigger reload.
     reloadOnSave  boolean (default true). Set false to call a
                   provided onReload() instead — used by CV editor
                   to re-render without losing scroll position.
     onReload      optional async callback invoked after successful
                   save when reloadOnSave=false.

   Visual language matches the CV3 design system: square corners,
   2px borders, accent color, uppercase tracked labels, Segoe UI.
   ================================================================= */
(function () {
    'use strict';

    const HOST = location.hostname;
    const IS_LOCAL = HOST === 'localhost' || HOST === '127.0.0.1' || HOST === '::1';

    /* ---------- shared styles (idempotent injection) ---------- */
    const CSS = `
        :root {
            --de-accent: var(--accent-color, #fbc25b);
            --de-bg:     var(--bg, #e0dcd9);
            --de-text:   var(--text, #151312);
            --de-border: var(--border, #151312);
            --de-muted:  var(--muted, #6b6664);
            --de-dark:   var(--dark, #151312);
        }

        /* --- Edit pill (used by both editors) --- */
        .de-edit-btn {
            background: var(--de-accent);
            color: var(--color-dark, #151312);
            border: 2px solid var(--de-border);
            border-radius: 0;
            padding: 6px 12px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.65rem;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            cursor: pointer;
            transition: background 0.2s, color 0.2s, opacity 0.2s;
        }
        .de-edit-btn:hover {
            background: var(--de-dark);
            color: var(--de-bg);
        }
        .de-edit-btn.de-pos-absolute {
            position: absolute;
            top: var(--sp-3, 12px);
            right: var(--sp-3, 12px);
            z-index: 5;
            opacity: 0;
        }
        .de-edit-btn.de-pos-fixed {
            position: fixed;
            top: var(--sp-4, 16px);
            right: var(--sp-4, 16px);
            z-index: 9998;
        }
        .de-edit-host:hover > .de-edit-btn.de-pos-absolute,
        .de-edit-btn:focus-visible { opacity: 1; }
        .de-edit-host { position: relative; }

        /* Hide all per-item edit pills unless edit mode is active. */
        body:not(.de-edit-mode) .de-edit-btn { display: none !important; }

        /* --- Top-right "Edit" toggle pill --- */
        .de-edit-toggle {
            position: fixed;
            top: 16px; right: 16px;
            z-index: 9997;
            background: var(--de-accent);
            color: var(--de-dark);
            border: 2px solid var(--de-border);
            border-radius: 0;
            padding: 10px 18px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.7rem; font-weight: 800;
            letter-spacing: 3px; text-transform: uppercase;
            cursor: pointer;
        }
        .de-edit-toggle:hover { filter: brightness(0.95); }
        body.de-edit-mode .de-edit-toggle {
            background: var(--de-dark);
            color: var(--de-bg);
        }

        /* --- Modal --- */
        .de-overlay {
            position: fixed; inset: 0;
            background: color-mix(in srgb, var(--de-dark) 78%, transparent);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999;
            padding: var(--sp-6, 24px);
            font-family: 'Segoe UI', Arial, sans-serif;
        }
        .de-modal {
            background: var(--de-bg);
            color: var(--de-text);
            border: 2px solid var(--de-border);
            width: min(760px, 100%);
            max-height: 90vh;
            display: flex; flex-direction: column;
            box-shadow: 0 20px 60px rgba(0,0,0,0.45);
        }
        .de-modal-head {
            display: flex; align-items: center; justify-content: space-between;
            gap: var(--sp-4, 16px);
            padding: var(--sp-4, 16px) var(--sp-6, 24px);
            border-bottom: 2px solid var(--de-border);
        }
        .de-modal-head h3 {
            margin: 0;
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 3px;
            text-transform: uppercase;
        }
        .de-modal-head .de-sub {
            display: block;
            font-size: 0.6rem;
            font-weight: 600;
            letter-spacing: 2px;
            color: var(--de-muted);
            margin-top: 4px;
            text-transform: uppercase;
        }
        .de-close {
            background: none;
            border: 2px solid transparent;
            color: var(--de-text);
            font-size: 22px;
            line-height: 1;
            width: 32px; height: 32px;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: border-color 0.15s, background 0.15s;
        }
        .de-close:hover {
            border-color: var(--de-border);
            background: var(--de-accent);
        }

        .de-modal-body {
            padding: var(--sp-6, 24px);
            overflow: auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--sp-5, 20px);
        }
        .de-modal-body .de-full { grid-column: 1 / -1; }
        .de-field { display: flex; flex-direction: column; gap: var(--sp-1, 4px); }
        .de-field label {
            font-size: 0.6rem;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--de-muted);
        }
        .de-field input[type=text],
        .de-field textarea {
            background: var(--de-bg);
            color: var(--de-text);
            border: 2px solid var(--de-border);
            border-radius: 0;
            padding: 8px 10px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.85rem;
            line-height: 1.4;
            outline: none;
            transition: background 0.15s;
        }
        .de-field input[type=text]:focus,
        .de-field textarea:focus {
            background: color-mix(in srgb, var(--de-bg) 85%, var(--de-accent));
        }
        .de-field textarea { resize: vertical; min-height: 80px; }
        .de-field select {
            background: var(--de-bg);
            color: var(--de-text);
            border: 2px solid var(--de-border);
            border-radius: 0;
            padding: 8px 10px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.85rem;
            line-height: 1.4;
            outline: none;
            cursor: pointer;
        }
        .de-field .de-select-custom {
            margin-top: 6px;
            background: var(--de-bg);
            color: var(--de-text);
            border: 2px dashed var(--de-border);
            border-radius: 0;
            padding: 6px 8px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.8rem;
            outline: none;
        }

        .de-checkbox {
            display: flex; align-items: center; gap: var(--sp-2, 8px);
            padding: var(--sp-3, 12px) 0;
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--de-text);
            cursor: pointer;
            user-select: none;
        }
        .de-checkbox input[type=checkbox] {
            appearance: none;
            -webkit-appearance: none;
            width: 18px; height: 18px;
            border: 2px solid var(--de-border);
            background: var(--de-bg);
            display: inline-grid;
            place-content: center;
            cursor: pointer;
            margin: 0;
        }
        .de-checkbox input[type=checkbox]:checked { background: var(--de-accent); }
        .de-checkbox input[type=checkbox]:checked::after {
            content: '';
            width: 10px; height: 6px;
            border-left: 2px solid var(--de-dark);
            border-bottom: 2px solid var(--de-dark);
            transform: rotate(-45deg) translate(1px, -1px);
        }

        .de-modal-foot {
            display: flex; align-items: center; gap: var(--sp-3, 12px);
            padding: var(--sp-4, 16px) var(--sp-6, 24px);
            border-top: 2px solid var(--de-border);
        }
        .de-status {
            flex: 1;
            font-size: 0.65rem;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--de-muted);
        }
        .de-status.is-error { color: #c0392b; }
        .de-status.is-ok    { color: var(--de-text); }
        .de-btn {
            background: var(--de-bg);
            color: var(--de-text);
            border: 2px solid var(--de-border);
            border-radius: 0;
            padding: 10px var(--sp-5, 20px);
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.7rem;
            font-weight: 800;
            letter-spacing: 3px;
            text-transform: uppercase;
            cursor: pointer;
            transition: background 0.2s, color 0.2s;
        }
        .de-btn:hover { background: var(--de-dark); color: var(--de-bg); }
        .de-btn-primary { background: var(--de-dark); color: var(--de-bg); }
        .de-btn-primary:hover { background: var(--de-accent); color: var(--de-dark); }
        .de-btn-danger { background: #b3261e; color: #fff; border-color: #b3261e; margin-right: auto; }
        .de-btn-danger:hover { background: #8c1d18; border-color: #8c1d18; }
        .de-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        @media (max-width: 640px) {
            .de-modal-body { grid-template-columns: 1fr; }
        }

        .de-section-header {
            font-size: 0.7rem;
            font-weight: 800;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: var(--de-text);
            border-bottom: 2px solid var(--de-border);
            padding-bottom: var(--sp-2, 8px);
            margin-top: var(--sp-3, 12px);
        }
        .de-section-header:first-child { margin-top: 0; }

        /* --- Tag chip input --- */
        .de-tags { display: flex; flex-direction: column; gap: var(--sp-2, 8px); }
        .de-tags-box {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 6px;
            border: 2px solid var(--de-border);
            background: var(--de-bg);
            min-height: 42px;
            align-items: center;
        }
        .de-tags-box:focus-within {
            background: color-mix(in srgb, var(--de-bg) 85%, var(--de-accent));
        }
        .de-tags-chips { display: contents; }
        .de-tag-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: var(--de-accent);
            color: var(--de-dark);
            border: 2px solid var(--de-border);
            padding: 2px 4px 2px 8px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .de-tag-chip-x {
            background: none;
            border: none;
            color: var(--de-dark);
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
            padding: 2px 4px;
            font-weight: 800;
        }
        .de-tag-chip-x:hover { color: #c0392b; }
        .de-tags-input {
            flex: 1;
            min-width: 120px;
            border: none;
            outline: none;
            background: transparent;
            color: var(--de-text);
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.85rem;
            padding: 4px;
        }
        .de-tags-suggest {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .de-tag-suggest {
            background: var(--de-bg);
            color: var(--de-text);
            border: 2px solid var(--de-border);
            padding: 2px 8px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            cursor: pointer;
            opacity: 0.7;
        }
        .de-tag-suggest:hover { opacity: 1; background: var(--de-accent); }
        .de-tags-suggest:empty { display: none; }

        /* --- rows (dynamic list of homogeneous records) --- */
        .de-rows { display: flex; flex-direction: column; gap: var(--sp-3, 12px); }
        .de-row {
            border: 2px solid var(--de-border);
            background: color-mix(in srgb, var(--de-bg) 92%, transparent);
            padding: var(--sp-3, 12px);
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--sp-3, 12px);
            position: relative;
        }
        .de-row > .de-full { grid-column: 1 / -1; }
        .de-row-controls {
            grid-column: 1 / -1;
            display: flex;
            justify-content: flex-end;
            gap: 4px;
            margin-top: 4px;
        }
        .de-row-btn {
            background: var(--de-bg);
            color: var(--de-text);
            border: 2px solid var(--de-border);
            padding: 2px 8px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.65rem;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            cursor: pointer;
            min-width: 28px;
        }
        .de-row-btn:hover { background: var(--de-accent); }
        .de-row-btn.is-danger:hover { background: #c0392b; color: #fff; }
        .de-row-add {
            align-self: flex-start;
            background: var(--de-bg);
            color: var(--de-text);
            border: 2px solid var(--de-border);
            padding: 6px 14px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.7rem;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            cursor: pointer;
        }
        .de-row-add:hover { background: var(--de-accent); }
        .de-row-empty {
            color: var(--de-muted);
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            padding: var(--sp-3, 12px) 0;
        }
    `;
    let stylesInjected = false;
    function injectStyles() {
        if (stylesInjected) return;
        stylesInjected = true;
        const el = document.createElement('style');
        el.textContent = CSS;
        document.head.appendChild(el);
    }

    /* ---------- helpers ---------- */
    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

    function setPath(obj, path, value) {
        const parts = String(path).split('.');
        let cur = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
            cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = value;
    }
    function getPath(obj, path) {
        return String(path).split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
    }

    /* ---------- tag chip widget ---------- */
    function setupTagsWidget(root) {
        const chipsHost = root.querySelector('.de-tags-chips');
        const input     = root.querySelector('.de-tags-input');
        const sugHost   = root.querySelector('.de-tags-suggest');

        let selected;
        try { selected = JSON.parse(root.dataset.initial || '[]'); } catch (_) { selected = []; }
        let suggestions;
        try { suggestions = JSON.parse(root.dataset.suggestions || '[]'); } catch (_) { suggestions = []; }

        const norm = (s) => String(s || '').trim();
        const eq   = (a, b) => a.toLowerCase() === b.toLowerCase();

        function persist() {
            root.dataset.value = JSON.stringify(selected);
        }
        function renderChips() {
            chipsHost.innerHTML = selected.map((t, i) =>
                `<span class="de-tag-chip">${escapeHtml(t)}<button type="button" class="de-tag-chip-x" data-i="${i}" aria-label="Remove">&times;</button></span>`
            ).join('');
        }
        function renderSuggest() {
            const remaining = suggestions
                .map(norm)
                .filter(s => s && !selected.some(x => eq(x, s)));
            sugHost.innerHTML = remaining.map(s =>
                `<button type="button" class="de-tag-suggest">${escapeHtml(s)}</button>`
            ).join('');
        }
        function refresh() { persist(); renderChips(); renderSuggest(); }

        function add(tag) {
            const t = norm(tag);
            if (!t) return;
            if (selected.some(x => eq(x, t))) return;
            selected.push(t);
            refresh();
        }
        function removeAt(i) {
            selected.splice(i, 1);
            refresh();
        }

        input.addEventListener('keydown', (e) => {
            if (e.key === ',' || e.key === 'Enter' || e.key === 'Tab') {
                if (input.value.trim()) {
                    e.preventDefault();
                    add(input.value);
                    input.value = '';
                }
            } else if (e.key === 'Backspace' && !input.value && selected.length) {
                removeAt(selected.length - 1);
            }
        });
        input.addEventListener('input', () => {
            // Support paste of "a, b, c"
            if (input.value.includes(',')) {
                const parts = input.value.split(',');
                const tail = parts.pop();
                parts.forEach(add);
                input.value = tail.trim();
            }
        });
        input.addEventListener('blur', () => {
            if (input.value.trim()) { add(input.value); input.value = ''; }
        });

        chipsHost.addEventListener('click', (e) => {
            const btn = e.target.closest('.de-tag-chip-x');
            if (!btn) return;
            removeAt(+btn.dataset.i);
        });
        sugHost.addEventListener('click', (e) => {
            const btn = e.target.closest('.de-tag-suggest');
            if (!btn) return;
            add(btn.textContent);
        });

        refresh();
    }

    /* ---------- rows widget (dynamic homogeneous list) ---------- */
    function setupRowsWidget(root) {
        let cols = [];
        let rows = [];
        try { cols = JSON.parse(root.dataset.columns || '[]'); } catch (_) {}
        try { rows = JSON.parse(root.dataset.initial || '[]'); } catch (_) {}
        const canAdd     = root.dataset.canAdd     !== '0';
        const canRemove  = root.dataset.canRemove  !== '0';
        const canReorder = root.dataset.canReorder !== '0';
        const addLabel   = root.dataset.addLabel   || 'Add Row';

        function blankRow() {
            const r = {};
            cols.forEach(c => { r[c.key] = c.type === 'tags' ? [] : (c.type === 'bool' ? false : ''); });
            return r;
        }

        function colInputHtml(col, val, ri) {
            const id = `${ri}__${col.key}`;
            const fullCls = col.full ? ' de-full' : '';
            if (col.type === 'textarea') {
                return `<div class="de-field${fullCls}">
                    <label>${escapeHtml(col.label)}</label>
                    <textarea data-col="${escapeAttr(col.key)}" rows="${col.rows || 3}">${escapeHtml(val ?? '')}</textarea>
                </div>`;
            }
            if (col.type === 'bool') {
                return `<label class="de-checkbox${fullCls}">
                    <input type="checkbox" data-col="${escapeAttr(col.key)}" ${val ? 'checked' : ''}>
                    <span>${escapeHtml(col.label)}</span>
                </label>`;
            }
            return `<div class="de-field${fullCls}">
                <label>${escapeHtml(col.label)}</label>
                <input type="text" data-col="${escapeAttr(col.key)}" value="${escapeAttr(val ?? '')}" placeholder="${escapeAttr(col.placeholder || '')}">
            </div>`;
        }

        function render() {
            const list = rows.map((r, ri) => {
                const fields = cols.map(c => colInputHtml(c, r[c.key], ri)).join('');
                const ctrls = [];
                if (canReorder) {
                    ctrls.push(`<button type="button" class="de-row-btn de-row-up" data-i="${ri}" title="Move up">↑</button>`);
                    ctrls.push(`<button type="button" class="de-row-btn de-row-down" data-i="${ri}" title="Move down">↓</button>`);
                }
                if (canRemove) {
                    ctrls.push(`<button type="button" class="de-row-btn is-danger de-row-del" data-i="${ri}" title="Remove">×</button>`);
                }
                return `<div class="de-row" data-i="${ri}">
                    ${fields}
                    ${ctrls.length ? `<div class="de-row-controls">${ctrls.join('')}</div>` : ''}
                </div>`;
            }).join('');
            const addBtn = canAdd ? `<button type="button" class="de-row-add">+ ${escapeHtml(addLabel)}</button>` : '';
            const empty = rows.length ? '' : `<div class="de-row-empty">— No entries —</div>`;
            root.innerHTML = list + empty + addBtn;
        }

        function readDom() {
            // Sync DOM input values back into rows array (preserving order).
            const out = [];
            root.querySelectorAll(':scope > .de-row').forEach((rowEl) => {
                const r = {};
                cols.forEach(c => {
                    const input = rowEl.querySelector(`[data-col="${CSS.escape(c.key)}"]`);
                    if (!input) { r[c.key] = c.type === 'tags' ? [] : ''; return; }
                    if (input.type === 'checkbox') r[c.key] = input.checked;
                    else r[c.key] = input.value;
                });
                out.push(r);
            });
            return out;
        }

        root.addEventListener('click', (e) => {
            const t = e.target;
            if (t.matches('.de-row-add')) {
                rows = readDom();
                rows.push(blankRow());
                render();
                return;
            }
            if (t.matches('.de-row-del')) {
                rows = readDom();
                rows.splice(+t.dataset.i, 1);
                render();
                return;
            }
            if (t.matches('.de-row-up')) {
                rows = readDom();
                const i = +t.dataset.i;
                if (i > 0) [rows[i - 1], rows[i]] = [rows[i], rows[i - 1]];
                render();
                return;
            }
            if (t.matches('.de-row-down')) {
                rows = readDom();
                const i = +t.dataset.i;
                if (i < rows.length - 1) [rows[i + 1], rows[i]] = [rows[i], rows[i + 1]];
                render();
                return;
            }
        });

        // Stash a reader on the element for readRowsWidget.
        root.__deReadRows = readDom;
        render();
    }
    function readRowsWidget(root) {
        if (typeof root.__deReadRows === 'function') return root.__deReadRows();
        return [];
    }

    /* ---------- edit button factory ---------- */
    function makeEditButton({ label = 'Edit', floating = false, onClick } = {}) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'de-edit-btn ' + (floating ? 'de-pos-fixed' : 'de-pos-absolute');
        btn.textContent = label;
        if (onClick) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                onClick(e);
            });
        }
        return btn;
    }

    /* ---------- top-right edit-mode toggle ---------- */
    function installEditToggle({
        storageKey = 'de-edit-mode',
        label = 'Edit',
        doneLabel = 'Done',
        onChange,
    } = {}) {
        injectStyles();
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'de-edit-toggle';
        const apply = (on, persist) => {
            document.body.classList.toggle('de-edit-mode', !!on);
            btn.textContent = on ? doneLabel : label;
            if (persist) {
                try { localStorage.setItem(storageKey, on ? '1' : '0'); } catch (_) {}
            }
            if (typeof onChange === 'function') onChange(!!on);
        };
        btn.addEventListener('click', () => {
            apply(!document.body.classList.contains('de-edit-mode'), true);
        });
        const mount = () => {
            if (!btn.isConnected) document.body.appendChild(btn);
            let initial = false;
            try { initial = localStorage.getItem(storageKey) === '1'; } catch (_) {}
            apply(initial, false);
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', mount);
        } else {
            mount();
        }
        return btn;
    }

    /* ---------- modal ---------- */
    let modalOpen = false;

    function renderField(f) {
        const v = f.value;
        const cls = 'de-field' + (f.full ? ' de-full' : '');
        if (f.type === 'header') {
            return `<div class="de-section-header de-full">${escapeHtml(f.label)}</div>`;
        }
        if (f.type === 'bool') {
            return `<label class="de-checkbox${f.full ? ' de-full' : ''}">
                <input type="checkbox" data-key="${escapeAttr(f.key)}" ${v ? 'checked' : ''}>
                <span>${escapeHtml(f.label)}</span>
            </label>`;
        }
        if (f.type === 'textarea') {
            return `<div class="${cls}">
                <label>${escapeHtml(f.label)}</label>
                <textarea data-key="${escapeAttr(f.key)}" rows="${f.rows || 4}" placeholder="${escapeAttr(f.placeholder || '')}">${escapeHtml(v ?? '')}</textarea>
            </div>`;
        }
        if (f.type === 'select') {
            const options = Array.isArray(f.options) ? f.options : [];
            const current = v == null ? '' : String(v);
            const seen = new Set();
            const opts = [];
            if (f.placeholder) {
                opts.push(`<option value="" ${current ? '' : 'selected'} disabled>${escapeHtml(f.placeholder)}</option>`);
            }
            options.forEach(opt => {
                const value = typeof opt === 'object' ? String(opt.value ?? '') : String(opt);
                const label = typeof opt === 'object' ? String(opt.label ?? value) : String(opt);
                if (seen.has(value)) return;
                seen.add(value);
                opts.push(`<option value="${escapeAttr(value)}"${value === current ? ' selected' : ''}>${escapeHtml(label)}</option>`);
            });
            // If allowCustom, include the current value even if not in the option list.
            if (f.allowCustom && current && !seen.has(current)) {
                opts.unshift(`<option value="${escapeAttr(current)}" selected>${escapeHtml(current)}</option>`);
            }
            const customHtml = f.allowCustom
                ? `<input type="text" class="de-select-custom" data-for="${escapeAttr(f.key)}" placeholder="${escapeAttr(f.customPlaceholder || 'Or type a new value…')}" value="">`
                : '';
            return `<div class="${cls}">
                <label>${escapeHtml(f.label)}</label>
                <select data-key="${escapeAttr(f.key)}">${opts.join('')}</select>
                ${customHtml}
            </div>`;
        }
        if (f.type === 'tags') {
            const selected = Array.isArray(v) ? v.slice() : (v ? String(v).split(',').map(t => t.trim()).filter(Boolean) : []);
            const suggestions = Array.isArray(f.suggestions) ? f.suggestions : [];
            return `<div class="${cls}">
                <label>${escapeHtml(f.label)}</label>
                <div class="de-tags" data-key="${escapeAttr(f.key)}" data-value-type="tags"
                     data-suggestions='${escapeAttr(JSON.stringify(suggestions))}'
                     data-initial='${escapeAttr(JSON.stringify(selected))}'>
                    <div class="de-tags-box">
                        <div class="de-tags-chips"></div>
                        <input type="text" class="de-tags-input" placeholder="${escapeAttr(f.placeholder || 'Type a tag, press , or Enter…')}">
                    </div>
                    <div class="de-tags-suggest"></div>
                </div>
            </div>`;
        }
        if (f.type === 'rows') {
            const rows = Array.isArray(v) ? v : [];
            const cols = Array.isArray(f.columns) ? f.columns : [];
            return `<div class="de-field de-full">
                <label>${escapeHtml(f.label)}</label>
                <div class="de-rows" data-key="${escapeAttr(f.key)}" data-value-type="rows"
                     data-columns='${escapeAttr(JSON.stringify(cols))}'
                     data-initial='${escapeAttr(JSON.stringify(rows))}'
                     data-can-add="${f.canAdd === false ? '0' : '1'}"
                     data-can-remove="${f.canRemove === false ? '0' : '1'}"
                     data-can-reorder="${f.canReorder === false ? '0' : '1'}"
                     data-add-label="${escapeAttr(f.addLabel || 'Add Row')}">
                </div>
            </div>`;
        }
        // default: text
        return `<div class="${cls}">
            <label>${escapeHtml(f.label)}</label>
            <input type="text" data-key="${escapeAttr(f.key)}" value="${escapeAttr(v ?? '')}" placeholder="${escapeAttr(f.placeholder || '')}">
        </div>`;
    }

    function readField(el) {
        const type = el.getAttribute('data-value-type');
        if (el.type === 'checkbox') return el.checked;
        if (type === 'tags') {
            try { return JSON.parse(el.dataset.value || '[]'); }
            catch (_) { return []; }
        }
        if (type === 'rows') {
            return readRowsWidget(el);
        }
        if (el.tagName === 'SELECT') {
            const custom = el.parentElement && el.parentElement.querySelector(`.de-select-custom[data-for="${el.getAttribute('data-key')}"]`);
            const customVal = custom && custom.value.trim();
            return customVal || el.value;
        }
        return el.value;
    }

    function openModal({ title, subtitle, fields, onSave, reloadOnSave = true, onReload, extraButtons } = {}) {
        if (modalOpen) return;
        modalOpen = true;

        const extraBtnsHtml = (Array.isArray(extraButtons) ? extraButtons : [])
            .map((b, i) => `<button class="de-btn de-extra ${b.danger ? 'de-btn-danger' : ''}" type="button" data-extra="${i}">${escapeHtml(b.label || 'Action')}</button>`)
            .join('');

        const overlay = document.createElement('div');
        overlay.className = 'de-overlay';
        overlay.innerHTML = `
            <div class="de-modal" role="dialog" aria-modal="true" aria-labelledby="de-modal-title">
                <div class="de-modal-head">
                    <div>
                        <h3 id="de-modal-title">${escapeHtml(title || 'Edit')}</h3>
                        ${subtitle ? `<span class="de-sub">${escapeHtml(subtitle)}</span>` : ''}
                    </div>
                    <button class="de-close" type="button" aria-label="Close">&times;</button>
                </div>
                <div class="de-modal-body">
                    ${(fields || []).map(renderField).join('')}
                </div>
                <div class="de-modal-foot">
                    ${extraBtnsHtml}
                    <span class="de-status"></span>
                    <button class="de-btn de-cancel" type="button">Cancel</button>
                    <button class="de-btn de-btn-primary de-save" type="button">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelectorAll('.de-tags').forEach(setupTagsWidget);
        overlay.querySelectorAll('.de-rows').forEach(setupRowsWidget);

        const close = () => {
            modalOpen = false;
            overlay.remove();
            document.removeEventListener('keydown', onKey);
        };
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', onKey);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        overlay.querySelector('.de-close').addEventListener('click', close);
        overlay.querySelector('.de-cancel').addEventListener('click', close);

        const statusEl = overlay.querySelector('.de-status');
        const saveBtn = overlay.querySelector('.de-save');

        // Wire extra buttons (e.g. Delete). They run their handler and then,
        // unless { keepOpen: true } is returned, close the modal and refresh.
        overlay.querySelectorAll('.de-extra').forEach((btn) => {
            const cfg = extraButtons[+btn.dataset.extra];
            btn.addEventListener('click', async () => {
                btn.disabled = true;
                statusEl.classList.remove('is-error', 'is-ok');
                statusEl.textContent = 'Working…';
                try {
                    const result = await cfg.onClick();
                    if (result && result.keepOpen) {
                        statusEl.textContent = '';
                        btn.disabled = false;
                        return;
                    }
                    statusEl.classList.add('is-ok');
                    if (reloadOnSave) {
                        statusEl.textContent = 'Done · Reloading';
                        setTimeout(() => location.reload(), 200);
                    } else {
                        statusEl.textContent = 'Done';
                        if (onReload) { try { await onReload(); } catch (_) {} }
                        setTimeout(close, 200);
                    }
                } catch (err) {
                    statusEl.classList.add('is-error');
                    statusEl.textContent = 'Failed: ' + (err && err.message ? err.message : err);
                    btn.disabled = false;
                }
            });
        });

        saveBtn.addEventListener('click', async () => {
            saveBtn.disabled = true;
            statusEl.classList.remove('is-error', 'is-ok');
            statusEl.textContent = 'Saving…';

            const values = {};
            overlay.querySelectorAll('[data-key]').forEach(el => {
                values[el.getAttribute('data-key')] = readField(el);
            });

            try {
                await onSave(values);
                statusEl.classList.add('is-ok');
                if (reloadOnSave) {
                    statusEl.textContent = 'Saved · Reloading';
                    setTimeout(() => location.reload(), 200);
                } else {
                    statusEl.textContent = 'Saved';
                    if (onReload) {
                        try { await onReload(); } catch (_) {}
                    }
                    setTimeout(close, 250);
                }
            } catch (err) {
                statusEl.classList.add('is-error');
                statusEl.textContent = 'Save failed: ' + (err && err.message ? err.message : err);
                saveBtn.disabled = false;
            }
        });
    }

    /* ---------- generic save POST ---------- */
    async function saveJson(endpoint, body) {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
            throw new Error(data.error || `HTTP ${res.status}`);
        }
        return data;
    }

    window.DataEditor = {
        IS_LOCAL,
        injectStyles,
        makeEditButton,
        installEditToggle,
        openModal,
        escapeHtml,
        escapeAttr,
        setPath,
        getPath,
        saveJson,
    };
})();

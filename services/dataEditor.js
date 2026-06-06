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
    // NOTE: named EDITOR_CSS (not CSS) so it doesn't shadow the global CSS
    // interface — readDom() below relies on the real CSS.escape().
    const EDITOR_CSS = `
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
        .de-monthyear { display: flex; gap: 8px; align-items: center; }
        .de-monthyear .de-my-month { flex: 0 0 auto; }
        .de-monthyear .de-my-year {
            width: 92px;
            background: var(--de-bg);
            color: var(--de-text);
            border: 2px solid var(--de-border);
            border-radius: 0;
            padding: 8px 10px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.85rem;
            line-height: 1.4;
            outline: none;
        }
        .de-monthyear .de-my-year:focus { background: color-mix(in srgb, var(--de-bg) 85%, var(--de-accent)); }
        .de-hint { display: block; margin-top: 4px; color: var(--de-muted); font-size: 0.72rem; }
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

        /* ===== Image upload widgets ===== */
        .de-image {
            display: flex;
            gap: 14px;
            align-items: stretch;
        }
        .de-image-drop {
            flex: 0 0 140px;
            min-height: 120px;
            border: 2px dashed var(--de-border);
            background: var(--de-bg);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            cursor: pointer;
            overflow: hidden;
            text-align: center;
        }
        .de-image-drop.is-dragover { border-color: var(--de-accent); background: #fff8e6; }
        .de-image-drop.is-uploading { opacity: 0.55; }
        .de-image-drop img {
            max-width: 100%;
            max-height: 140px;
            object-fit: contain;
            display: block;
        }
        .de-image-drop video {
            max-width: 100%;
            max-height: 140px;
            object-fit: contain;
            display: block;
            background: #000;
        }
        .de-image-drop-hint {
            font-size: 0.6rem;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: var(--de-muted);
            padding: 6px;
            line-height: 1.3;
        }
        .de-image-side {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
        }
        .de-image-side input[type="text"] {
            width: 100%;
            background: var(--de-bg);
            color: var(--de-text);
            border: 2px solid var(--de-border);
            border-radius: 0;
            padding: 8px 10px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 0.75rem;
        }
        .de-image-side-row {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }
        .de-image-side-row .de-row-btn { min-width: auto; }
        .de-image-status {
            font-size: 0.65rem;
            color: var(--de-muted);
            min-height: 1em;
        }
        .de-image-status.is-error { color: #c0392b; }

        .de-gallery {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .de-gallery-drop {
            border: 2px dashed var(--de-border);
            background: var(--de-bg);
            padding: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            cursor: pointer;
            font-size: 0.65rem;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: var(--de-muted);
        }
        .de-gallery-drop.is-dragover { border-color: var(--de-accent); background: #fff8e6; }
        .de-gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 10px;
        }
        .de-gallery-tile {
            position: relative;
            border: 2px solid var(--de-border);
            background: var(--de-bg);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            cursor: grab;
            user-select: none;
            transition: opacity 0.15s, border-color 0.15s, transform 0.15s;
        }
        .de-gallery-tile.is-dragging { opacity: 0.4; cursor: grabbing; }
        .de-gallery-tile.is-drop-target { border-color: var(--de-accent); transform: translateY(-2px); }
        .de-gallery-tile-img {
            position: relative;
            aspect-ratio: 1 / 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: #000;
        }
        .de-gallery-tile img {
            max-width: 100%;
            max-height: 100%;
            object-fit: cover;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        .de-gallery-tile video {
            max-width: 100%;
            max-height: 100%;
            object-fit: cover;
            width: 100%;
            height: 100%;
            pointer-events: none;
            background: #000;
        }
        .de-gallery-tile-type {
            position: absolute;
            left: 4px;
            top: 4px;
            z-index: 2;
            background: rgba(0,0,0,0.7);
            color: #fff;
            border: 1px solid rgba(255,255,255,0.5);
            padding: 2px 6px;
            font-size: 0.55rem;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .de-gallery-tile-name {
            display: block;
            font-size: 0.55rem;
            font-weight: 700;
            letter-spacing: 0.5px;
            padding: 4px 6px;
            color: var(--de-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border-top: 1px solid var(--de-border);
        }
        .de-gallery-tile-caption {
            width: 100%;
            border: none;
            border-top: 1px solid var(--de-border);
            padding: 6px 8px;
            font-size: 0.7rem;
            font-family: inherit;
            background: transparent;
            color: inherit;
            outline: none;
            cursor: text;
        }
        .de-gallery-tile-caption:focus { background: #fff8e6; }
        .de-gallery-del {
            position: absolute;
            top: 4px; right: 4px;
            width: 22px; height: 22px;
            border: none;
            background: rgba(0,0,0,0.65);
            color: #fff;
            font-size: 1rem;
            line-height: 1;
            cursor: pointer;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
            transition: background 0.15s;
        }
        .de-gallery-del:hover { background: #c0392b; }
        .de-gallery-actions {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-top: 8px;
            flex-wrap: wrap;
        }
        .de-gallery-url {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1 1 320px;
            min-width: 260px;
        }
        .de-gallery-url input {
            flex: 1 1 auto;
            min-width: 180px;
            border: 2px solid var(--de-border);
            background: var(--de-bg);
            color: var(--de-dark);
            padding: 8px 10px;
            font-size: 0.72rem;
            font-family: inherit;
            outline: none;
        }
        .de-gallery-url input:focus { background: #fff8e6; }
        .de-gallery-url button {
            border: 2px solid var(--de-border);
            background: var(--de-bg);
            color: var(--de-dark);
            font-size: 0.68rem;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding: 8px 10px;
            cursor: pointer;
            white-space: nowrap;
        }
        .de-gallery-url button:hover {
            background: var(--de-dark);
            color: var(--de-bg);
        }
        .de-gallery-save {
            border: 2px solid var(--de-border);
            background: var(--de-accent, #f6c244);
            color: #000;
            font-size: 0.7rem;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding: 8px 14px;
            cursor: pointer;
        }
        .de-gallery-save[disabled] { opacity: 0.4; cursor: not-allowed; }
        .de-gallery-hint {
            font-size: 0.65rem;
            color: var(--de-muted);
        }
        .de-gallery-tile iframe {
            width: 100%;
            height: 100%;
            border: 0;
            pointer-events: none;
            background: #000;
        }
    `;
    let stylesInjected = false;
    function injectStyles() {
        if (stylesInjected) return;
        stylesInjected = true;
        const el = document.createElement('style');
        el.textContent = EDITOR_CSS;
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

    /* ---------- image upload widgets ---------- */

    // Read a File as base64 (without the data: prefix).
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => {
                const s = String(r.result || '');
                const i = s.indexOf(',');
                resolve(i >= 0 ? s.slice(i + 1) : s);
            };
            r.onerror = () => reject(r.error || new Error('read failed'));
            r.readAsDataURL(file);
        });
    }

    // POST a file to upload endpoint(s). Returns the saved web path.
    // Files ≥ 5 MB are sent as raw binary to /__upload-binary to avoid
    // base64 overhead; smaller files fall back to JSON base64 for compat.
    async function uploadFile({ file, targetDir, filenameTemplate }) {
        if (!file) throw new Error('no file');
        if (!targetDir) throw new Error('no target dir');
        const original = String(file.name || 'image');
        const dot = original.lastIndexOf('.');
        const baseExt = dot >= 0 ? original.slice(dot + 1).toLowerCase() : 'jpg';
        let filename = original;
        if (filenameTemplate) {
            filename = filenameTemplate.replace(/\{ext\}/gi, baseExt);
            if (!/\.[a-z0-9]+$/i.test(filename)) {
                filename = `${filename}.${baseExt}`;
            }
        }

        // For large files use raw binary upload to avoid base64 overhead.
        if (file.size >= 5 * 1024 * 1024) {
            let res = null;
            try {
                res = await fetch('/__upload-binary', {
                    method: 'POST',
                    headers: {
                        'Content-Type': file.type || 'application/octet-stream',
                        'X-Target-Dir': targetDir,
                        'X-Filename': filename,
                    },
                    body: file,
                });
            } catch (err) {
                const msg = err && err.message ? err.message : 'Failed to fetch';
                throw new Error(`Cannot reach upload endpoint (${msg}). Start or restart dev-server.py and reload.`);
            }
            let json = null;
            try { json = await res.json(); } catch (_) {}
            if (res.ok && json && json.ok) return json.path;
            throw new Error((json && json.error) || `upload failed (${res.status})`);
        }

        // Small files: existing base64 JSON path.
        const dataBase64 = await readFileAsBase64(file);
        const payload = { targetDir, filename, dataBase64 };
        const endpoints = ['/__upload-file', '/__upload-image'];
        let lastError = null;
        for (const endpoint of endpoints) {
            let res = null;
            try {
                res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } catch (err) {
                lastError = err;
                continue;
            }
            let json = null;
            try { json = await res.json(); } catch (_) {}
            if (res.ok && json && json.ok) {
                return json.path;
            }
            if (res.status === 404) {
                lastError = new Error('upload endpoint not found');
                continue;
            }
            throw new Error((json && json.error) || `upload failed (${res.status})`);
        }
        const networkMsg = lastError && lastError.message ? lastError.message : 'Failed to fetch';
        throw new Error(`Cannot reach upload endpoint (${networkMsg}). Start or restart dev-server.py and reload.`);
    }

    // Backward-compatible helper used by existing image widgets.
    async function uploadImage({ file, targetDir, filenameTemplate }) {
        return uploadFile({ file, targetDir, filenameTemplate });
    }

    function fileNameFromPath(path) {
        const clean = String(path || '').split('?')[0].split('#')[0];
        const idx = clean.lastIndexOf('/');
        return idx >= 0 ? clean.slice(idx + 1) : clean;
    }

    async function cloneMediaToTarget({ sourcePath, targetDir, filenameTemplate }) {
        const sourceName = fileNameFromPath(sourcePath) || 'media';
        const res = await fetch(sourcePath, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to read source media (${res.status})`);
        const blob = await res.blob();
        const file = new File([blob], sourceName, { type: blob.type || undefined });
        return uploadFile({ file, targetDir, filenameTemplate });
    }

    function releaseMediaPath(path) {
        const target = String(path || '').trim();
        if (!target) return;
        const matchPath = (value) => {
            if (!value) return false;
            try {
                const url = new URL(value, location.href);
                return url.pathname === target;
            } catch (_) {
                return value === target;
            }
        };
        document.querySelectorAll('video').forEach(video => {
            const attrSrc = video.getAttribute('src') || '';
            const current = video.currentSrc || attrSrc;
            if (!matchPath(attrSrc) && !matchPath(current)) return;
            try { video.pause(); } catch (_) {}
            try { video.removeAttribute('src'); } catch (_) {}
            try { video.load(); } catch (_) {}
        });
    }

    function parseProjectMediaPath(path) {
        const normalizedPath = String(path || '').trim().startsWith('/')
            ? String(path || '').trim()
            : ('/' + String(path || '').trim().replace(/^\/+/, ''));
        const fileExt = (() => {
            const clean = fileNameFromPath(normalizedPath);
            const idx = clean.lastIndexOf('.');
            return idx >= 0 ? clean.slice(idx).toLowerCase() : '';
        })();
        const marker = '/projects/';
        const markerIdx = normalizedPath.indexOf(marker);
        if (markerIdx < 0) throw new Error('Invalid media path');
        const dirAndFile = normalizedPath.slice(markerIdx + marker.length);
        const slash = dirAndFile.lastIndexOf('/');
        if (slash < 0) throw new Error('Invalid media path');
        const slug = dirAndFile.slice(0, slash);
        const filename = dirAndFile.slice(slash + 1);
        const isVideo = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'].includes(fileExt);
        return {
            normalizedPath,
            filename,
            targetDir: isVideo
                ? `assets/videos/projects/${slug}`
                : `assets/images/projects/${slug}`,
        };
    }

    async function deleteMediaPath(path) {
        const { normalizedPath, filename, targetDir } = parseProjectMediaPath(path);
        releaseMediaPath(normalizedPath);
        const res = await fetch('/__delete-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetDir, filename }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
            throw new Error((data && data.error) || `HTTP ${res.status}`);
        }
        return data;
    }

    function setupImageWidget(root) {
        const drop      = root.querySelector('[data-role="drop"]');
        const input     = root.querySelector('input[type="text"][data-key]');
        const status    = root.querySelector('[data-role="status"]');
        const pickBtn   = root.querySelector('[data-role="pick"]');
        const clearBtn  = root.querySelector('[data-role="clear"]');
        const targetDir = root.getAttribute('data-target-dir') || '';
        const tpl       = root.getAttribute('data-filename-template') || '';
        const uploadKind = root.getAttribute('data-upload-kind') === 'video' ? 'video' : 'image';
        const isVideo = uploadKind === 'video';
        const isExternalUrl = (p) => /^https?:\/\//i.test(String(p || '').trim());
        const parseExternalEmbed = (rawUrl) => {
            const src = String(rawUrl || '').trim();
            if (!/^https?:\/\//i.test(src)) return null;
            let u;
            try { u = new URL(src); } catch (_) { return null; }
            const host = (u.hostname || '').toLowerCase().replace(/^www\./, '');

            if (host === 'youtu.be') {
                const id = u.pathname.split('/').filter(Boolean)[0] || '';
                if (!id) return null;
                return { embedUrl: `https://www.youtube.com/embed/${id}` };
            }
            if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
                if (u.pathname === '/watch') {
                    const id = u.searchParams.get('v') || '';
                    if (!id) return null;
                    return { embedUrl: `https://www.youtube.com/embed/${id}` };
                }
                const parts = u.pathname.split('/').filter(Boolean);
                if (parts[0] === 'embed' && parts[1]) {
                    return { embedUrl: `https://www.youtube.com/embed/${parts[1]}` };
                }
            }
            if (host === 'vimeo.com' || host === 'player.vimeo.com') {
                const parts = u.pathname.split('/').filter(Boolean);
                let id = '';
                if (host === 'player.vimeo.com') {
                    id = (parts[0] === 'video' && parts[1]) ? parts[1] : '';
                } else {
                    id = parts.find(part => /^\d+$/.test(part)) || '';
                }
                if (!id) return null;
                return { embedUrl: `https://player.vimeo.com/video/${id}` };
            }
            if (host === 'drive.google.com' || host === 'docs.google.com') {
                const parts = u.pathname.split('/').filter(Boolean);
                let id = '';
                const fileIdx = parts.indexOf('file');
                const dIdx = parts.indexOf('d');
                if (fileIdx >= 0 && dIdx === fileIdx + 1 && parts[dIdx + 1]) {
                    id = parts[dIdx + 1];
                }
                if (!id) id = u.searchParams.get('id') || '';
                if (!id && parts[0] === 'uc') id = u.searchParams.get('id') || '';
                if (!id) return null;
                return { embedUrl: `https://drive.google.com/file/d/${id}/preview` };
            }
            return null;
        };
        const embedPlaybackUrl = (rawUrl, { showControls = false } = {}) => {
            const base = String(rawUrl || '').trim();
            if (!base) return '';
            let u;
            try { u = new URL(base); } catch (_) { return base; }
            const host = (u.hostname || '').toLowerCase().replace(/^www\./, '');
            if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
                const parts = u.pathname.split('/').filter(Boolean);
                const id = (parts[0] === 'embed' && parts[1]) ? parts[1] : '';
                u.searchParams.set('autoplay', '1');
                u.searchParams.set('mute', '1');
                u.searchParams.set('playsinline', '1');
                u.searchParams.set('rel', '0');
                u.searchParams.set('modestbranding', '1');
                u.searchParams.set('loop', '1');
                if (id) u.searchParams.set('playlist', id);
                u.searchParams.set('controls', showControls ? '1' : '0');
                u.searchParams.set('iv_load_policy', '3');
                return u.toString();
            }
            if (host === 'player.vimeo.com' || host === 'vimeo.com') {
                u.searchParams.set('autoplay', '1');
                u.searchParams.set('muted', '1');
                u.searchParams.set('loop', '1');
                u.searchParams.set('autopause', '0');
                u.searchParams.set('controls', showControls ? '1' : '0');
                u.searchParams.set('title', '0');
                u.searchParams.set('byline', '0');
                u.searchParams.set('portrait', '0');
                return u.toString();
            }
            if (host === 'drive.google.com' || host === 'docs.google.com') {
                u.searchParams.set('autoplay', '1');
                return u.toString();
            }
            return base;
        };
        const normalizeWidgetPath = (rawPath) => {
            const trimmed = String(rawPath || '').trim();
            if (!trimmed) return '';
            if (!isVideo) return trimmed;
            if (!isExternalUrl(trimmed)) return trimmed;
            const embed = parseExternalEmbed(trimmed);
            return embed ? embed.embedUrl : trimmed;
        };
        if (!drop || !input) return;

        const renderPreview = (path) => {
            if (!path) return `<div class="de-image-drop-hint">Drop ${isVideo ? 'video' : 'image'}<br>or click</div>`;
            if (isVideo) {
                const embed = parseExternalEmbed(path);
                if (embed) {
                    return `<iframe aria-hidden="true" src="${escapeAttr(embedPlaybackUrl(embed.embedUrl, { showControls: false }))}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
                }
                return `<video aria-hidden="true" src="${escapeAttr(path)}" muted playsinline preload="metadata"></video>`;
            }
            return `<img alt="" src="${escapeAttr(path)}">`;
        };

        const setPath = (rawPath) => {
            const path = normalizeWidgetPath(rawPath);
            input.value = path || '';
            drop.innerHTML = renderPreview(path);
            if (isVideo) {
                const v = drop.querySelector('video');
                if (v) {
                    v.muted = true;
                    v.play().catch(() => {});
                }
            }
        };
        const setStatus = (text, isError) => {
            if (!status) return;
            status.textContent = text || '';
            status.classList.toggle('is-error', !!isError);
        };

        // Sync preview when the user types a new path manually.
        input.addEventListener('change', () => setPath(input.value.trim()));
        input.addEventListener('blur',   () => setPath(input.value.trim()));

        if (clearBtn) {
            clearBtn.addEventListener('click', () => { setPath(''); setStatus(''); });
        }

        // Hidden file picker reused for click + "Choose…".
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = isVideo ? 'video/*' : 'image/*';
        fileInput.style.display = 'none';
        root.appendChild(fileInput);
        const openPicker = () => fileInput.click();
        if (pickBtn) pickBtn.addEventListener('click', openPicker);
        drop.addEventListener('click', (e) => {
            if (e.target.closest('img,button,input')) return;
            openPicker();
        });
        drop.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); }
        });

        const handleFile = async (file) => {
            if (!file) return;
            if (!targetDir) {
                setStatus('No target directory configured for this field.', true);
                return;
            }
            drop.classList.add('is-uploading');
            setStatus('Uploading…');
            try {
                const path = await uploadFile({ file, targetDir, filenameTemplate: tpl });
                setPath(path);
                setStatus('Saved · ' + path);
            } catch (err) {
                setStatus(err && err.message ? err.message : String(err), true);
            } finally {
                drop.classList.remove('is-uploading');
            }
        };

        fileInput.addEventListener('change', () => {
            const f = fileInput.files && fileInput.files[0];
            if (f) handleFile(f);
            fileInput.value = '';
        });

        ['dragenter', 'dragover'].forEach(ev => {
            drop.addEventListener(ev, (e) => {
                e.preventDefault(); e.stopPropagation();
                drop.classList.add('is-dragover');
            });
        });
        ['dragleave', 'dragend'].forEach(ev => {
            drop.addEventListener(ev, (e) => {
                e.preventDefault(); e.stopPropagation();
                drop.classList.remove('is-dragover');
            });
        });
        drop.addEventListener('drop', (e) => {
            e.preventDefault(); e.stopPropagation();
            drop.classList.remove('is-dragover');
            // Internal drop from a gallery tile → set path directly, skip upload.
            const internal = e.dataTransfer && e.dataTransfer.getData('application/x-gallery-path');
            const internalKind = e.dataTransfer && e.dataTransfer.getData('application/x-gallery-kind');
            const wantsKind = isVideo ? 'video' : 'image';
            if (internal && internalKind && internalKind !== wantsKind) {
                setStatus(`Only ${wantsKind}s can be dropped here.`, true);
                return;
            }
            if (internal) {
                if (!targetDir) {
                    setStatus('No target directory configured for this field.', true);
                    return;
                }
                drop.classList.add('is-uploading');
                setStatus('Copying from media…');
                cloneMediaToTarget({ sourcePath: internal, targetDir, filenameTemplate: tpl })
                    .then((path) => {
                        setPath(path);
                        setStatus(`${isVideo ? 'Hero video' : 'Hero image'} set · ` + path);
                    })
                    .catch((err) => {
                        setStatus(err && err.message ? err.message : String(err), true);
                    })
                    .finally(() => {
                        drop.classList.remove('is-uploading');
                    });
                return;
            }
            const droppedUri = (e.dataTransfer && (e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain'))) || '';
            const droppedUrl = String(droppedUri || '').trim();
            if (droppedUrl && /^https?:\/\//i.test(droppedUrl)) {
                if (isVideo) {
                    const normalized = normalizeWidgetPath(droppedUrl);
                    const embed = parseExternalEmbed(normalized);
                    if (embed || /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(normalized)) {
                        setPath(normalized);
                        setStatus('Hero video URL set · ' + normalized);
                        return;
                    }
                    setStatus('Only YouTube/Vimeo or direct video URLs are supported here.', true);
                    return;
                }
                setPath(droppedUrl);
                setStatus('Image URL set · ' + droppedUrl);
                return;
            }
            const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            if (f) handleFile(f);
        });

        setPath(input.value.trim());
    }

    function setupGalleryWidget(root) {
        const drop      = root.querySelector('[data-role="drop"]');
        const grid      = root.querySelector('[data-role="grid"]');
        const status    = root.querySelector('[data-role="status"]');
        const targetDir = root.getAttribute('data-target-dir') || '';
        const videoTargetDir = root.getAttribute('data-video-target-dir') || '';
        let excludedPaths;
        try { excludedPaths = JSON.parse(root.getAttribute('data-exclude-paths') || '[]'); } catch (_) { excludedPaths = []; }
        const excluded = new Set((Array.isArray(excludedPaths) ? excludedPaths : []).filter(Boolean).map(p => String(p).trim()));
        if (!drop || !grid) return;

        const setStatus = (text, isError) => {
            if (!status) return;
            status.textContent = text || '';
            status.classList.toggle('is-error', !!isError);
        };

        // In-memory model: [{ path, name, caption, kind }] in display order.
        let items = [];
        let dirty = false;
        let pendingDeletes = [];

        const dirBase = (dir) => '/' + String(dir || '').replace(/^\/+/, '').replace(/\/$/, '');
        const imageBase = () => dirBase(targetDir);
        const videoBase = () => dirBase(videoTargetDir);
        const extOf = (name) => {
            const i = String(name || '').lastIndexOf('.');
            return i >= 0 ? String(name).slice(i).toLowerCase() : '';
        };
        const isVideoExt = (ext) => ['.mp4', '.webm', '.ogg', '.mov', '.m4v'].includes(ext);
        const kindFromName = (name) => (isVideoExt(extOf(name)) ? 'video' : 'image');
        const pathFor = (name, kind) => `${kind === 'video' ? videoBase() : imageBase()}/${name}`;
        const isExternalUrl = (p) => /^https?:\/\//i.test(String(p || '').trim());
        const parseExternalEmbed = (rawUrl) => {
            const src = String(rawUrl || '').trim();
            if (!/^https?:\/\//i.test(src)) return null;
            let u;
            try { u = new URL(src); } catch (_) { return null; }
            const host = (u.hostname || '').toLowerCase().replace(/^www\./, '');

            if (host === 'youtu.be') {
                const id = u.pathname.split('/').filter(Boolean)[0] || '';
                if (!id) return null;
                return { embedUrl: `https://www.youtube.com/embed/${id}`, name: `youtube:${id}`, kind: 'embed' };
            }
            if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
                if (u.pathname === '/watch') {
                    const id = u.searchParams.get('v') || '';
                    if (!id) return null;
                    return { embedUrl: `https://www.youtube.com/embed/${id}`, name: `youtube:${id}`, kind: 'embed' };
                }
                const parts = u.pathname.split('/').filter(Boolean);
                if (parts[0] === 'embed' && parts[1]) {
                    const id = parts[1];
                    return { embedUrl: `https://www.youtube.com/embed/${id}`, name: `youtube:${id}`, kind: 'embed' };
                }
            }
            if (host === 'vimeo.com' || host === 'player.vimeo.com') {
                const parts = u.pathname.split('/').filter(Boolean);
                let id = '';
                if (host === 'player.vimeo.com') {
                    id = (parts[0] === 'video' && parts[1]) ? parts[1] : '';
                } else {
                    id = parts.find(part => /^\d+$/.test(part)) || '';
                }
                if (!id) return null;
                return { embedUrl: `https://player.vimeo.com/video/${id}`, name: `vimeo:${id}`, kind: 'embed' };
            }
            if (host === 'drive.google.com' || host === 'docs.google.com') {
                const parts = u.pathname.split('/').filter(Boolean);
                let id = '';
                const fileIdx = parts.indexOf('file');
                const dIdx = parts.indexOf('d');
                if (fileIdx >= 0 && dIdx === fileIdx + 1 && parts[dIdx + 1]) {
                    id = parts[dIdx + 1];
                }
                if (!id) id = u.searchParams.get('id') || '';
                if (!id && parts[0] === 'uc') id = u.searchParams.get('id') || '';
                if (!id) return null;
                return { embedUrl: `https://drive.google.com/file/d/${id}/preview`, name: `gdrive:${id}`, kind: 'embed' };
            }
            return null;
        };
        const embedPlaybackUrl = (rawUrl, { showControls = false } = {}) => {
            const base = String(rawUrl || '').trim();
            if (!base) return '';
            let u;
            try { u = new URL(base); } catch (_) { return base; }
            const host = (u.hostname || '').toLowerCase().replace(/^www\./, '');
            if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
                const parts = u.pathname.split('/').filter(Boolean);
                const id = (parts[0] === 'embed' && parts[1]) ? parts[1] : '';
                u.searchParams.set('autoplay', '1');
                u.searchParams.set('mute', '1');
                u.searchParams.set('playsinline', '1');
                u.searchParams.set('rel', '0');
                u.searchParams.set('modestbranding', '1');
                u.searchParams.set('loop', '1');
                if (id) u.searchParams.set('playlist', id);
                u.searchParams.set('controls', showControls ? '1' : '0');
                u.searchParams.set('iv_load_policy', '3');
                return u.toString();
            }
            if (host === 'player.vimeo.com' || host === 'vimeo.com') {
                u.searchParams.set('autoplay', '1');
                u.searchParams.set('muted', '1');
                u.searchParams.set('loop', '1');
                u.searchParams.set('autopause', '0');
                u.searchParams.set('controls', showControls ? '1' : '0');
                u.searchParams.set('title', '0');
                u.searchParams.set('byline', '0');
                u.searchParams.set('portrait', '0');
                return u.toString();
            }
            if (host === 'drive.google.com' || host === 'docs.google.com') {
                u.searchParams.set('autoplay', '1');
                return u.toString();
            }
            return base;
        };
        const normalizePath = (p) => {
            const s = String(p || '').trim();
            if (!s) return '';
            if (isExternalUrl(s)) return s;
            return s.startsWith('/') ? s : ('/' + s.replace(/^\/+/, ''));
        };
        const nameFromPath = (p) => {
            if (isExternalUrl(p)) {
                const embed = parseExternalEmbed(p);
                if (embed) return embed.name;
                return 'external-video';
            }
            const s = normalizePath(p);
            const i = s.lastIndexOf('/');
            return i >= 0 ? s.slice(i + 1) : s;
        };
        const kindFromPath = (p) => {
            const embed = parseExternalEmbed(p);
            if (embed) return 'embed';
            return kindFromName(nameFromPath(p));
        };

        function markDirty(d) {
            dirty = d;
        }

        function queueDelete(path) {
            const normalized = normalizePath(path);
            if (!normalized) return;
            if (!pendingDeletes.includes(normalized)) pendingDeletes.push(normalized);
        }

        function renderTiles() {
            grid.innerHTML = items.map((it, i) => `
                <div class="de-gallery-tile" data-index="${i}" data-name="${escapeAttr(it.name)}" data-path="${escapeAttr(it.path)}" data-kind="${escapeAttr(it.kind)}">
                    <button type="button" class="de-gallery-del" data-role="del" title="Remove">&times;</button>
                    <span class="de-gallery-tile-type">${escapeHtml(it.kind)}</span>
                    <div class="de-gallery-tile-img" draggable="true" data-role="drag" title="Drag to reorder">
                        ${it.kind === 'video'
                            ? `<video muted loop playsinline preload="metadata" src="${escapeAttr(it.path)}" draggable="false"></video>`
                            : it.kind === 'embed'
                                ? `<iframe src="${escapeAttr(embedPlaybackUrl(it.path, { showControls: false }))}" title="Embedded video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin"></iframe>`
                            : `<img alt="" src="${escapeAttr(it.path)}" draggable="false">`}
                    </div>
                    <span class="de-gallery-tile-name" title="${escapeAttr(it.name)}">${escapeHtml(it.name)}</span>
                    <input class="de-gallery-tile-caption"
                           data-role="caption"
                           type="text"
                           placeholder="Caption (shown on click)"
                           value="${escapeAttr(it.caption || '')}">
                </div>
            `).join('');
            wireTiles();
        }

        function wireTiles() {
            grid.querySelectorAll('.de-gallery-tile').forEach(tile => {
                const idx = parseInt(tile.dataset.index, 10);

                tile.querySelector('[data-role="del"]').addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const name = tile.dataset.name;
                    const path = tile.dataset.path;
                    if (!confirm(`Remove "${name}"?`)) return;
                    deleteImage(name, path);
                });

                const cap = tile.querySelector('[data-role="caption"]');
                cap.addEventListener('input', () => {
                    items[idx].caption = cap.value;
                    markDirty(true);
                });

                tile.addEventListener('dragstart', (e) => {
                    if (!e.target.closest('[data-role="drag"]')) {
                        e.preventDefault();
                        return;
                    }
                    tile.classList.add('is-dragging');
                    e.dataTransfer.effectAllowed = 'copyMove';
                    e.dataTransfer.setData('text/plain', String(idx));
                    e.dataTransfer.setData('application/x-gallery-path', items[idx].path);
                    e.dataTransfer.setData('application/x-gallery-kind', items[idx].kind);
                });
                tile.addEventListener('dragend', () => tile.classList.remove('is-dragging'));
                tile.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    tile.classList.add('is-drop-target');
                });
                tile.addEventListener('dragleave', () => tile.classList.remove('is-drop-target'));
                tile.addEventListener('drop', (e) => {
                    e.preventDefault();
                    tile.classList.remove('is-drop-target');
                    const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                    const to   = idx;
                    if (Number.isNaN(from) || from === to) return;
                    const moved = items.splice(from, 1)[0];
                    items.splice(to, 0, moved);
                    markDirty(true);
                    renderTiles();
                });
            });
        }

        async function deleteImage(name, path) {
            const normalizedPath = normalizePath(path);
            if (normalizedPath.startsWith('/')) queueDelete(normalizedPath);
            items = items.filter(it => it.path !== normalizedPath);
            renderTiles();
            markDirty(true);
            setStatus(`Marked ${name} for removal. Save to apply changes.`);
        }

        async function flushDeletes() {
            if (!pendingDeletes.length) return;
            const remaining = [];
            for (const path of pendingDeletes) {
                try {
                    await deleteMediaPath(path);
                } catch (err) {
                    const message = err && err.message ? err.message : String(err);
                    if (!/file not found/i.test(message)) {
                        remaining.push(path);
                    }
                }
            }
            pendingDeletes = remaining;
            if (pendingDeletes.length) {
                throw new Error('Some files could not be deleted.');
            }
        }

        async function saveOrder() {
            // Pull live captions out of the DOM so we never send stale model data.
            const liveItems = Array.from(grid.querySelectorAll('.de-gallery-tile')).map(tile => {
                const name = tile.dataset.name;
                const path = normalizePath(tile.dataset.path || '');
                const capEl = tile.querySelector('[data-role="caption"]');
                return { path, name, caption: capEl ? capEl.value : '' };
            });
            // Sync back into the in-memory model so subsequent edits start from truth.
            items = liveItems.map(it => ({ ...it, kind: kindFromPath(it.path) }));
            setStatus('Saving order & captions…');
            const res = await fetch('/__save-gallery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetDir, videoTargetDir, items: liveItems }),
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok || !j.ok) {
                const msg = (j && j.error) || `HTTP ${res.status}`;
                setStatus('Gallery save failed: ' + msg, true);
                throw new Error('gallery save: ' + msg);
            }
            await flushDeletes();
            markDirty(false);
            setStatus('Gallery saved.');
        }

        // Expose for modal's main Save flow to flush before reloading.
        root._saveGallery = saveOrder;
        root._isGalleryDirty = () => dirty;

        // Inject hint row (once). Captions/order persist via the modal's main Save.
        if (!root.querySelector('.de-gallery-actions')) {
            const bar = document.createElement('div');
            bar.className = 'de-gallery-actions';
            bar.innerHTML = `
                <div class="de-gallery-url">
                    <input type="url" data-role="embed-url" placeholder="Paste YouTube/Vimeo URL and click Add URL">
                    <button type="button" data-role="add-url">Add URL</button>
                </div>
                <span class="de-gallery-hint">Drag tiles to reorder · type captions inline · click × to remove · saved with the project</span>
            `;
            root.appendChild(bar);
            const urlInput = bar.querySelector('[data-role="embed-url"]');
            const addUrlBtn = bar.querySelector('[data-role="add-url"]');
            const addUrl = () => {
                const raw = urlInput ? String(urlInput.value || '').trim() : '';
                if (!raw) {
                    setStatus('Paste a YouTube or Vimeo URL first.', true);
                    return;
                }
                const embed = parseExternalEmbed(raw);
                if (!embed) {
                    setStatus('Only YouTube/Vimeo URLs are supported for embeds.', true);
                    return;
                }
                const path = embed.embedUrl;
                if (items.some(it => it.path === path)) {
                    setStatus('This URL is already in the gallery.', true);
                    return;
                }
                items.push({ path, name: embed.name, kind: 'embed', caption: '' });
                markDirty(true);
                renderTiles();
                if (urlInput) urlInput.value = '';
                setStatus('Added embedded video URL.');
            };
            if (addUrlBtn) addUrlBtn.addEventListener('click', addUrl);
            if (urlInput) {
                urlInput.addEventListener('keydown', (e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    addUrl();
                });
            }
        }

        const refresh = async () => {
            items = [];
            pendingDeletes = [];
            grid.innerHTML = '';
            if (!targetDir) return;
            const base = imageBase();
            try {
                // Prefer gallery.json (order + captions). Fall back to manifest.json.
                let res = await fetch(`${base}/gallery.json`, { cache: 'no-store' });
                if (res.ok) {
                    const list = await res.json();
                    if (Array.isArray(list)) {
                        items = list
                            .map(it => {
                                if (!it || typeof it !== 'object') return null;
                                const caption = String(it.caption || '');
                                if (typeof it.path === 'string' && it.path) {
                                    const path = normalizePath(it.path);
                                    if (excluded.has(path)) return null;
                                    return {
                                        path,
                                        name: nameFromPath(path),
                                        kind: kindFromPath(path),
                                        caption,
                                    };
                                }
                                if (typeof it.name === 'string' && it.name) {
                                    const kind = kindFromName(it.name);
                                    const path = pathFor(it.name, kind);
                                    if (excluded.has(path)) return null;
                                    return {
                                        path,
                                        name: it.name,
                                        kind,
                                        caption,
                                    };
                                }
                                return null;
                            })
                            .filter(Boolean);
                    }
                }
                // Always cross-check against manifest.json so newly-uploaded files
                // (not yet in gallery.json) still show up.
                let imageManifestKnown = false;
                res = await fetch(`${base}/manifest.json`, { cache: 'no-store' });
                if (res.ok) {
                    const all = await res.json();
                    if (Array.isArray(all)) {
                        imageManifestKnown = true;
                        const known = new Set(items.map(it => it.path));
                        all.forEach(name => {
                            if (typeof name === 'string' && name) {
                                const path = `${imageBase()}/${name}`;
                                if (!known.has(path) && !excluded.has(path)) {
                                    items.push({ path, name, kind: 'image', caption: '' });
                                }
                            }
                        });
                    }
                }
                let videoManifestKnown = false;
                if (videoTargetDir) {
                    const vBase = videoBase();
                    res = await fetch(`${vBase}/manifest.json`, { cache: 'no-store' });
                    if (res.ok) {
                        const all = await res.json();
                        if (Array.isArray(all)) {
                            videoManifestKnown = true;
                            const known = new Set(items.map(it => it.path));
                            all.forEach(name => {
                                if (typeof name === 'string' && name) {
                                    const path = `${vBase}/${name}`;
                                    if (!known.has(path) && !excluded.has(path)) {
                                        items.push({ path, name, kind: 'video', caption: '' });
                                    }
                                }
                            });
                        }
                    }
                }
                const imageOnDisk = new Set();
                const videoOnDisk = new Set();
                if (imageManifestKnown) {
                    const manifest = await fetch(`${base}/manifest.json`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
                    if (Array.isArray(manifest)) manifest.forEach(name => { if (typeof name === 'string' && name) imageOnDisk.add(`${imageBase()}/${name}`); });
                }
                if (videoManifestKnown) {
                    const vBase = videoBase();
                    const manifest = await fetch(`${vBase}/manifest.json`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
                    if (Array.isArray(manifest)) manifest.forEach(name => { if (typeof name === 'string' && name) videoOnDisk.add(`${vBase}/${name}`); });
                }
                const beforePrune = items.length;
                items = items.filter(it => {
                    if (it.kind === 'embed') return true;
                    if (it.kind === 'video' && videoManifestKnown) return videoOnDisk.has(it.path);
                    if (it.kind === 'image' && imageManifestKnown) return imageOnDisk.has(it.path);
                    return true;
                });
                if (items.length !== beforePrune) {
                    renderTiles();
                    await saveOrder();
                }
                setStatus('');
            } catch (err) {
                setStatus('Failed loading media gallery. Reload page and try again.', true);
            }
            renderTiles();
            markDirty(false);
        };

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,video/*';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        root.appendChild(fileInput);
        drop.addEventListener('click', () => fileInput.click());
        drop.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
        });

        const handleFiles = async (files) => {
            if (!files || !files.length) return;
            if (!targetDir) {
                setStatus('No target directory configured for this gallery.', true);
                return;
            }
            const list = Array.from(files);
            let done = 0, failed = 0;
            for (const f of list) {
                setStatus(`Uploading ${done + 1}/${list.length}…`);
                try {
                    const uploadDir = (String(f.type || '').startsWith('video/') && videoTargetDir)
                        ? videoTargetDir
                        : targetDir;
                    await uploadFile({ file: f, targetDir: uploadDir });
                    done++;
                }
                catch (_) { failed++; }
            }
            setStatus(failed
                ? `Uploaded ${done}, ${failed} failed.`
                : `Uploaded ${done} media file${done === 1 ? '' : 's'}.`,
                failed > 0);
            await refresh();
        };

        fileInput.addEventListener('change', () => {
            handleFiles(fileInput.files);
            fileInput.value = '';
        });

        ['dragenter', 'dragover'].forEach(ev => {
            drop.addEventListener(ev, (e) => {
                e.preventDefault(); e.stopPropagation();
                drop.classList.add('is-dragover');
            });
        });
        ['dragleave', 'dragend'].forEach(ev => {
            drop.addEventListener(ev, (e) => {
                e.preventDefault(); e.stopPropagation();
                drop.classList.remove('is-dragover');
            });
        });
        drop.addEventListener('drop', (e) => {
            e.preventDefault(); e.stopPropagation();
            drop.classList.remove('is-dragover');
            const files = e.dataTransfer && e.dataTransfer.files;
            if (files && files.length) handleFiles(files);
        });

        refresh();
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
        if (f.type === 'image') {
            // Single-image drop zone with a synced text path input.
            const targetDir   = f.targetDir || '';
            const filenameTpl = f.filename  || '';
            const current     = v == null ? '' : String(v);
            return `<div class="${cls}">
                <label>${escapeHtml(f.label)}</label>
                <div class="de-image" data-value-type="image"
                     data-target-dir="${escapeAttr(targetDir)}"
                     data-filename-template="${escapeAttr(filenameTpl)}">
                    <div class="de-image-drop" data-role="drop" tabindex="0">
                        ${current
                            ? `<img alt="" src="${escapeAttr(current)}">`
                            : `<div class="de-image-drop-hint">Drop image<br>or click</div>`}
                    </div>
                    <div class="de-image-side">
                        <input type="text" data-key="${escapeAttr(f.key)}" value="${escapeAttr(current)}" placeholder="${escapeAttr(f.placeholder || '/assets/...')}">
                        <div class="de-image-side-row">
                            <button type="button" class="de-row-btn" data-role="pick">Choose…</button>
                            <button type="button" class="de-row-btn is-danger" data-role="clear">Clear</button>
                        </div>
                        <div class="de-image-status" data-role="status"></div>
                    </div>
                </div>
            </div>`;
        }
        if (f.type === 'video') {
            // Single-video drop zone with a synced text path input.
            const targetDir   = f.targetDir || '';
            const filenameTpl = f.filename  || '';
            const current     = v == null ? '' : String(v);
            return `<div class="${cls}">
                <label>${escapeHtml(f.label)}</label>
                <div class="de-image" data-value-type="image"
                     data-upload-kind="video"
                     data-target-dir="${escapeAttr(targetDir)}"
                     data-filename-template="${escapeAttr(filenameTpl)}">
                    <div class="de-image-drop" data-role="drop" tabindex="0">
                        ${current
                            ? `<video aria-hidden="true" src="${escapeAttr(current)}" muted playsinline preload="metadata"></video>`
                            : `<div class="de-image-drop-hint">Drop video<br>or click</div>`}
                    </div>
                    <div class="de-image-side">
                        <input type="text" data-key="${escapeAttr(f.key)}" value="${escapeAttr(current)}" placeholder="${escapeAttr(f.placeholder || '/assets/...')}">
                        <div class="de-image-side-row">
                            <button type="button" class="de-row-btn" data-role="pick">Choose…</button>
                            <button type="button" class="de-row-btn is-danger" data-role="clear">Clear</button>
                        </div>
                        <div class="de-image-status" data-role="status"></div>
                    </div>
                </div>
            </div>`;
        }
        if (f.type === 'image-gallery') {
            // Multi-image upload area for a fixed folder. Does not store a
            // value into the form payload — drops just upload to disk.
            const targetDir = f.targetDir || '';
            const videoTargetDir = f.videoTargetDir || '';
            const excludePaths = Array.isArray(f.excludePaths) ? f.excludePaths : [];
            return `<div class="de-field de-full">
                <label>${escapeHtml(f.label)}</label>
                <div class="de-gallery" data-value-type="gallery"
                     data-target-dir="${escapeAttr(targetDir)}"
                     data-video-target-dir="${escapeAttr(videoTargetDir)}"
                     data-exclude-paths='${escapeAttr(JSON.stringify(excludePaths))}'>
                    <div class="de-gallery-drop" data-role="drop" tabindex="0">
                        Drop media (images/videos) here, or click to choose
                    </div>
                    <div class="de-gallery-grid" data-role="grid"></div>
                    <div class="de-image-status" data-role="status"></div>
                </div>
            </div>`;
        }
        if (f.type === 'monthyear') {
            // Reusable month + year picker. Stores "YYYY-MM" (or "YYYY" if no
            // month, or "" if empty) in a hidden input read like any other field.
            const val = v == null ? '' : String(v);
            const mm  = val.match(/^(\d{4})(?:-(\d{1,2}))?$/);
            const yr  = mm ? mm[1] : '';
            const mo  = mm && mm[2] ? String(+mm[2]).padStart(2, '0') : '';
            const MONTHS = [['', '— Month'], ['01', 'Jan'], ['02', 'Feb'], ['03', 'Mar'],
                ['04', 'Apr'], ['05', 'May'], ['06', 'Jun'], ['07', 'Jul'], ['08', 'Aug'],
                ['09', 'Sep'], ['10', 'Oct'], ['11', 'Nov'], ['12', 'Dec']];
            return `<div class="${cls}">
                <label>${escapeHtml(f.label)}</label>
                <div class="de-monthyear">
                    <select class="de-my-month" aria-label="${escapeAttr(f.label)} month">
                        ${MONTHS.map(([mv, mn]) => `<option value="${mv}"${mv === mo ? ' selected' : ''}>${escapeHtml(mn)}</option>`).join('')}
                    </select>
                    <input type="text" class="de-my-year" inputmode="numeric" maxlength="4" placeholder="${escapeAttr(f.placeholder || 'Year')}" value="${escapeAttr(yr)}">
                    <input type="hidden" data-key="${escapeAttr(f.key)}" value="${escapeAttr(val)}">
                </div>
                ${f.hint ? `<small class="de-hint">${escapeHtml(f.hint)}</small>` : ''}
            </div>`;
        }
        // default: text
        return `<div class="${cls}">
            <label>${escapeHtml(f.label)}</label>
            <input type="text" data-key="${escapeAttr(f.key)}" value="${escapeAttr(v ?? '')}" placeholder="${escapeAttr(f.placeholder || '')}">
        </div>`;
    }

    function setupMonthYearWidget(root) {
        const month  = root.querySelector('.de-my-month');
        const year   = root.querySelector('.de-my-year');
        const hidden = root.querySelector('input[type="hidden"][data-key]');
        if (!month || !year || !hidden) return;
        const sync = () => {
            const y = String(year.value || '').replace(/[^0-9]/g, '').slice(0, 4);
            if (year.value !== y) year.value = y;
            const m = String(month.value || '').trim();
            hidden.value = y ? (m ? `${y}-${m}` : y) : '';
        };
        month.addEventListener('change', sync);
        year.addEventListener('input', sync);
        year.addEventListener('change', sync);
        sync();
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
        overlay.querySelectorAll('.de-image').forEach(setupImageWidget);
        overlay.querySelectorAll('.de-gallery').forEach(setupGalleryWidget);
        overlay.querySelectorAll('.de-monthyear').forEach(setupMonthYearWidget);

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

            try {
                // Collect field values inside the try so a reader throwing
                // surfaces as "Save failed" rather than a stuck "Saving…".
                const values = {};
                overlay.querySelectorAll('[data-key]').forEach(el => {
                    values[el.getAttribute('data-key')] = readField(el);
                });
                // Flush any gallery edits (captions / order) first. Always
                // run — the dirty flag is best-effort and easy to miss.
                const galleryRoots = overlay.querySelectorAll('.de-gallery');
                for (const gr of galleryRoots) {
                    if (typeof gr._saveGallery === 'function') {
                        await gr._saveGallery();
                    }
                }
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
        uploadFile,
        uploadImage,
        cloneMediaToTarget,
        deleteMediaPath,
    };
})();

#!/usr/bin/env python3
"""
Local development server.

Serves the static site exactly like `python3 -m http.server`, but also
accepts POST /__save with a JSON body of the shape:

    { "projects": [ ...PROJECTS_DATA array... ] }

and rewrites projects/projects.js using a fixed template (header
comment, grouped-by-company body, bootstrap footer).

Bound to 127.0.0.1 only — this endpoint MUST NOT be reachable from
the network.

Usage:
    python3 dev-server.py            # port 8080
    python3 dev-server.py 9000       # custom port
"""

from __future__ import annotations

import json
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROJECTS_FILE = ROOT / "projects" / "projects.js"
CV_FILE = ROOT / "cv" / "cv.js"

FILE_HEADER = """\
/* =================================================================
   PROJECTS DATA \u2014 single source of truth for every project shown on
   the site (CV experience listings, /projects/ gallery, /cvprojects/,
   and per-project detail pages at /projects/<company>/<name>/).

   Each entry declares which company/category it belongs to via
   `company`. Companies are defined in cv.js (experience[].org and
   projects[].title \u2014 e.g. "Side-Projects").

   At the bottom of this file a bootstrap walks window.CV_DATA and
   re-populates the matching `projects` arrays in-place, so no
   downstream renderer has to know about this split.

   NOTE: This file is rewritten by dev-server.py when projects are
   edited via the localhost visual editor. Manual edits are preserved
   inside individual entries; section grouping comments are
   regenerated on save.
   ================================================================= */
window.PROJECTS_DATA = [
"""

FILE_FOOTER = """\
];

/* =================================================================
   BOOTSTRAP \u2014 merge PROJECTS_DATA back into CV_DATA so existing
   renderers that read CV_DATA.experience[].projects and
   CV_DATA.projects[].projects keep working unchanged.
   ================================================================= */
(function mergeIntoCv() {
    const cv = window.CV_DATA;
    if (!cv) return;

    function projectsForCompany(companyName) {
        const want = (companyName || '').toLowerCase();
        return window.PROJECTS_DATA
            .filter(p => (p.company || '').toLowerCase() === want)
            .map(p => { const { company, ...rest } = p; return rest; });
    }

    (cv.experience || []).forEach(exp => {
        const matches = projectsForCompany(exp.org);
        if (matches.length) exp.projects = matches;
    });

    (cv.projects || []).forEach(group => {
        const matches = projectsForCompany(group.title);
        if (matches.length) group.projects = matches;
    });
})();
"""


def serialize_projects(projects: list[dict]) -> str:
    """Render PROJECTS_DATA as JS with grouped section comments."""
    # Preserve the order companies first appear in.
    seen: list[str] = []
    for p in projects:
        c = p.get("company") or "Other"
        if c not in seen:
            seen.append(c)

    parts: list[str] = []
    for idx, company in enumerate(seen):
        parts.append(f"    /* ===== {company} ===== */\n")
        group = [p for p in projects if (p.get("company") or "Other") == company]
        for j, entry in enumerate(group):
            body = json.dumps(entry, indent=4, ensure_ascii=False)
            # Re-indent so the opening `{` aligns with 4-space indent.
            body = "\n".join(("    " + line) if line else line for line in body.splitlines())
            tail = "," if not (idx == len(seen) - 1 and j == len(group) - 1) else ""
            parts.append(body + tail + "\n")
        if idx != len(seen) - 1:
            parts.append("\n")

    return FILE_HEADER + "".join(parts) + FILE_FOOTER


def serialize_cv(cv: dict) -> str:
    """Render CV_DATA as a plain JS assignment with 4-space JSON indent."""
    return "window.CV_DATA = " + json.dumps(cv, indent=4, ensure_ascii=False) + ";\n"


class DevHandler(SimpleHTTPRequestHandler):
    # Serve from project root regardless of cwd.
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):  # noqa: N802 (stdlib naming)
        if self.path == "/__save":
            return self._handle_save_projects()
        if self.path == "/__save-cv":
            return self._handle_save_cv()
        self._send_json(404, {"ok": False, "error": "not found"})

    def _read_loopback_json(self) -> dict | None:
        if self.client_address[0] not in ("127.0.0.1", "::1"):
            self._send_json(403, {"ok": False, "error": "loopback only"})
            return None
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > 5_000_000:
            self._send_json(400, {"ok": False, "error": "bad length"})
            return None
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception as exc:  # noqa: BLE001
            self._send_json(400, {"ok": False, "error": f"bad json: {exc}"})
            return None

    def _handle_save_projects(self):
        data = self._read_loopback_json()
        if data is None:
            return
        try:
            projects = data.get("projects")
            if not isinstance(projects, list):
                raise ValueError("projects must be a list")
            for p in projects:
                if not isinstance(p, dict):
                    raise ValueError("each project must be an object")
            text = serialize_projects(projects)
            PROJECTS_FILE.write_text(text, encoding="utf-8")
        except Exception as exc:  # noqa: BLE001
            self._send_json(400, {"ok": False, "error": str(exc)})
            return
        self._send_json(200, {"ok": True, "count": len(projects)})

    def _handle_save_cv(self):
        data = self._read_loopback_json()
        if data is None:
            return
        try:
            cv = data.get("cv")
            if not isinstance(cv, dict):
                raise ValueError("cv must be an object")
            text = serialize_cv(cv)
            CV_FILE.write_text(text, encoding="utf-8")
        except Exception as exc:  # noqa: BLE001
            self._send_json(400, {"ok": False, "error": str(exc)})
            return
        self._send_json(200, {"ok": True})

    def end_headers(self):
        # Disable caching so edits show up on reload immediately.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = ThreadingHTTPServer(("127.0.0.1", port), DevHandler)
    print(f"Dev server (with /__save) on http://127.0.0.1:{port}")
    print(f"Editing rewrites: {PROJECTS_FILE.relative_to(ROOT)}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()


if __name__ == "__main__":
    main()

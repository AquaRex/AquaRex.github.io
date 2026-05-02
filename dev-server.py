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
import re
import base64
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROJECTS_FILE = ROOT / "projects" / "projects.js"
CV_FILE = ROOT / "cv" / "cv.js"
PROJECT_IMAGES_DIR = ROOT / "assets" / "images" / "projects"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"}

# Directories under ROOT that the upload endpoint is allowed to write into.
UPLOAD_ALLOWED_PREFIXES = (
    "assets/images/",
    "assets/logos/",
    "assets/profile/",
)
MAX_UPLOAD_BYTES = 30_000_000  # 30 MB

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

    def do_GET(self):  # noqa: N802 (stdlib naming)
        # Auto-regenerate manifest.json for project image folders so
        # dropping a new image into /assets/images/projects/<slug>/
        # is immediately picked up locally and committed for prod.
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        prefix = "/assets/images/projects/"
        if path.startswith(prefix) and path.endswith("/manifest.json"):
            slug = path[len(prefix):-len("/manifest.json")]
            if slug and "/" not in slug and ".." not in slug:
                self._regenerate_manifest(slug)
        return super().do_GET()

    def _regenerate_manifest(self, slug: str) -> None:
        folder = PROJECT_IMAGES_DIR / slug
        if not folder.is_dir():
            return
        try:
            files = sorted(
                p.name for p in folder.iterdir()
                if p.is_file()
                and p.suffix.lower() in IMAGE_EXTENSIONS
                and not p.name.startswith(".")
            )
            (folder / "manifest.json").write_text(
                json.dumps(files, indent=2) + "\n", encoding="utf-8"
            )
        except OSError:
            pass

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
        if self.path == "/__upload-image":
            return self._handle_upload_image()
        if self.path == "/__delete-image":
            return self._handle_delete_image()
        if self.path == "/__save-gallery":
            return self._handle_save_gallery()
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

    def _read_loopback_json_large(self) -> dict | None:
        """Same as _read_loopback_json but with the upload size cap."""
        if self.client_address[0] not in ("127.0.0.1", "::1"):
            self._send_json(403, {"ok": False, "error": "loopback only"})
            return None
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_UPLOAD_BYTES:
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

    def _handle_upload_image(self):
        data = self._read_loopback_json_large()
        if data is None:
            return
        try:
            target_dir = str(data.get("targetDir") or "").strip().lstrip("/")
            filename   = str(data.get("filename")  or "").strip()
            data_b64   = data.get("dataBase64")
            if not target_dir or not filename or not isinstance(data_b64, str):
                raise ValueError("targetDir, filename and dataBase64 required")
            if ".." in target_dir.split("/"):
                raise ValueError("targetDir may not contain ..")
            if not any(target_dir.startswith(p) for p in UPLOAD_ALLOWED_PREFIXES):
                raise ValueError(
                    "targetDir must start with one of: "
                    + ", ".join(UPLOAD_ALLOWED_PREFIXES)
                )

            # Sanitise filename: keep alnum, dot, dash, underscore. Collapse
            # everything else to '-'. Force a single extension that we allow.
            name = re.sub(r"[^A-Za-z0-9._-]+", "-", filename).strip("-._")
            if not name:
                raise ValueError("invalid filename")
            stem, dot, ext = name.rpartition(".")
            if not dot:
                raise ValueError("filename must include extension")
            ext = "." + ext.lower()
            if ext not in IMAGE_EXTENSIONS:
                raise ValueError(f"extension {ext} not allowed")
            if not stem:
                raise ValueError("filename stem required")

            folder = (ROOT / target_dir).resolve()
            # Make sure we stay strictly under ROOT (defence in depth — the
            # prefix check above already prevents escape).
            if ROOT not in folder.parents and folder != ROOT:
                raise ValueError("targetDir escapes workspace")
            folder.mkdir(parents=True, exist_ok=True)

            # Decode payload (allow data: URLs by stripping the prefix).
            if "," in data_b64 and data_b64.lstrip().startswith("data:"):
                data_b64 = data_b64.split(",", 1)[1]
            try:
                blob = base64.b64decode(data_b64, validate=True)
            except Exception as exc:  # noqa: BLE001
                raise ValueError(f"bad base64: {exc}") from exc
            if not blob:
                raise ValueError("empty file")
            if len(blob) > MAX_UPLOAD_BYTES:
                raise ValueError("file too large")

            # Resolve a non-colliding filename.
            candidate = folder / f"{stem}{ext}"
            i = 2
            while candidate.exists():
                candidate = folder / f"{stem}-{i}{ext}"
                i += 1
            candidate.write_bytes(blob)

            web_path = "/" + str(candidate.relative_to(ROOT)).replace("\\", "/")
        except Exception as exc:  # noqa: BLE001
            self._send_json(400, {"ok": False, "error": str(exc)})
            return
        self._send_json(200, {"ok": True, "path": web_path})

    def _resolve_allowed_dir(self, target_dir: str) -> Path:
        """Validate target_dir against allowlist and return resolved Path."""
        target_dir = target_dir.strip().lstrip("/")
        if not target_dir:
            raise ValueError("targetDir required")
        if ".." in target_dir.split("/"):
            raise ValueError("targetDir may not contain ..")
        if not any(target_dir.startswith(p) for p in UPLOAD_ALLOWED_PREFIXES):
            raise ValueError(
                "targetDir must start with one of: "
                + ", ".join(UPLOAD_ALLOWED_PREFIXES)
            )
        folder = (ROOT / target_dir).resolve()
        if ROOT not in folder.parents and folder != ROOT:
            raise ValueError("targetDir escapes workspace")
        return folder

    def _safe_image_name(self, name: str) -> str:
        """Validate a filename refers to a single image file in a folder.

        Used for delete/gallery-save where the name must match a file
        that already exists on disk — so we MUST preserve the literal
        name (spaces, casing, etc.) rather than rewriting it.
        """
        clean = str(name or "").strip()
        if not clean or "/" in clean or "\\" in clean or clean in (".", ".."):
            raise ValueError(f"invalid filename: {name!r}")
        if "\x00" in clean:
            raise ValueError(f"invalid filename: {name!r}")
        ext = Path(clean).suffix.lower()
        if ext not in IMAGE_EXTENSIONS:
            raise ValueError(f"extension {ext} not allowed")
        return clean

    def _handle_delete_image(self):
        data = self._read_loopback_json()
        if data is None:
            return
        try:
            folder = self._resolve_allowed_dir(str(data.get("targetDir") or ""))
            name   = self._safe_image_name(str(data.get("filename") or ""))
            target = folder / name
            if not target.is_file():
                raise ValueError("file not found")
            # Defence in depth — make sure the resolved path is inside folder.
            if folder not in target.resolve().parents:
                raise ValueError("path escapes target dir")
            target.unlink()
            # Drop entry from gallery.json if present.
            gallery_path = folder / "gallery.json"
            if gallery_path.is_file():
                try:
                    items = json.loads(gallery_path.read_text(encoding="utf-8"))
                    if isinstance(items, list):
                        items = [
                            it for it in items
                            if not (isinstance(it, dict) and it.get("name") == name)
                        ]
                        gallery_path.write_text(
                            json.dumps(items, indent=2, ensure_ascii=False) + "\n",
                            encoding="utf-8",
                        )
                except (OSError, ValueError):
                    pass
        except Exception as exc:  # noqa: BLE001
            self._send_json(400, {"ok": False, "error": str(exc)})
            return
        self._send_json(200, {"ok": True})

    def _handle_save_gallery(self):
        data = self._read_loopback_json()
        if data is None:
            return
        try:
            folder = self._resolve_allowed_dir(str(data.get("targetDir") or ""))
            items_in = data.get("items")
            if not isinstance(items_in, list):
                raise ValueError("items must be a list")
            existing = {
                p.name for p in folder.iterdir()
                if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
            }
            seen: set[str] = set()
            cleaned: list[dict] = []
            for it in items_in:
                if not isinstance(it, dict):
                    raise ValueError("each item must be an object")
                name = self._safe_image_name(str(it.get("name") or ""))
                if name not in existing:
                    raise ValueError(f"unknown file: {name}")
                if name in seen:
                    raise ValueError(f"duplicate file: {name}")
                seen.add(name)
                caption = str(it.get("caption") or "")
                if len(caption) > 500:
                    raise ValueError("caption too long")
                cleaned.append({"name": name, "caption": caption})
            (folder / "gallery.json").write_text(
                json.dumps(cleaned, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
        except Exception as exc:  # noqa: BLE001
            self._send_json(400, {"ok": False, "error": str(exc)})
            return
        self._send_json(200, {"ok": True, "count": len(cleaned)})

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

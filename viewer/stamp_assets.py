"""
Stamp the website's CSS/JS links with a hash of their content (cache busting),
and inject/update the website version number (vX.Y.Z / tem-vX.Y.Z) and project
log/todo links in every page's eyebrow, top toolbar, and footer.

Run before publishing (the exporter runs it too):

    python viewer/stamp_assets.py
"""

import hashlib
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
REPO_URL = "https://github.com/BartonChenTW/taiwan-energy-model"
REF = re.compile(r'(["\'])(assets/[\w.-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?\1')
VER_BADGE_RE = re.compile(r'\s*<a class="ver-badge"[^>]*>.*?</a>')
VER_TOOLBAR_RE = re.compile(r'\s*<a class="ghost ver-toolbar"[^>]*>.*?</a>')
EYEBROW_RE = re.compile(r'(<div class="eyebrow">)(.*?)(</div>)', re.S)
TOOLBAR_RE = re.compile(r'([ \t]*)(<div class="toolbar">)')
FOOTER_META_RE = re.compile(r'\s*<div class="footer-meta">.*?</div>', re.S)


def repo_version(root=ROOT) -> str:
    """Return latest tem-v* git tag, falling back to short commit hash."""
    try:
        tag = subprocess.check_output(
            ["git", "describe", "--tags", "--match", "tem-v*", "--abbrev=0"],
            cwd=root, text=True, stderr=subprocess.DEVNULL,
        ).strip()
        if tag:
            return tag
    except Exception:
        pass
    try:
        sha = subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=root, text=True, stderr=subprocess.DEVNULL,
        ).strip()
        if sha:
            return f"git-{sha}"
    except Exception:
        pass
    return "dev"


def stamp(docs=DOCS):
    changed = []
    versions = {}
    ver = repo_version()
    ver_num = ver[4:] if ver.startswith("tem-v") else ver
    tag_url = f"{REPO_URL}/releases/tag/{ver}" if ver.startswith("tem-v") else f"{REPO_URL}/tags"
    ver_display = f"{ver_num} ({ver})" if ver_num != ver else ver

    badge_html = (
        f' <a class="ver-badge" href="{tag_url}" rel="noopener" title="Website release version ({ver})">'
        f'<span class="t-en">Version</span><span class="t-zh">版本</span> {ver_num}</a>'
    )
    footer_meta_html = (
        f'\n      <div class="footer-meta">'
        f'<span class="t-en">Version:</span><span class="t-zh">網站版本：</span>'
        f'<a class="ver-badge" href="{tag_url}" rel="noopener">{ver_display}</a>'
        f'<a href="{REPO_URL}/blob/main/CHANGELOG.md" rel="noopener"><span class="t-en">Changelog</span><span class="t-zh">更新紀錄</span></a>'
        f'<a href="{REPO_URL}/blob/main/notes/log.md" rel="noopener"><span class="t-en">Project log</span><span class="t-zh">專案日誌</span></a>'
        f'<a href="{REPO_URL}/blob/main/notes/todo.md" rel="noopener"><span class="t-en">Todo / Roadmap</span><span class="t-zh">待辦與規劃</span></a>'
        f'<a href="{REPO_URL}/blob/main/model.lock" rel="noopener">model.lock</a>'
        f'</div>'
    )

    for page in sorted(docs.glob("*.html")):
        text = page.read_text(encoding="utf-8")

        def repl(m):
            rel = m.group(2)
            if rel not in versions:
                f = docs / rel
                versions[rel] = hashlib.sha256(f.read_bytes()).hexdigest()[:8] if f.exists() else None
            v = versions[rel]
            return m.group(0) if v is None else f"{m.group(1)}{rel}?v={v}{m.group(1)}"

        new = REF.sub(repl, text)

        # Inject/update version badge in .eyebrow
        def eb_repl(m):
            inner = VER_BADGE_RE.sub("", m.group(2)).rstrip()
            return f"{m.group(1)}{inner}{badge_html}{m.group(3)}"

        new = EYEBROW_RE.sub(eb_repl, new, count=1)

        # Inject/update version + Log buttons inside top-right .toolbar
        new = VER_TOOLBAR_RE.sub("", new)

        def tb_repl(m):
            indent = m.group(1) + "  "
            return (
                f"{m.group(1)}{m.group(2)}\n"
                f'{indent}<a class="ghost ver-toolbar" href="{REPO_URL}/blob/main/CHANGELOG.md" rel="noopener" title="Version &amp; Changelog">{ver_num}</a>\n'
                f'{indent}<a class="ghost ver-toolbar" href="{REPO_URL}/blob/main/notes/log.md" rel="noopener" title="Project log"><span class="t-en">Log</span><span class="t-zh">日誌</span></a>'
            )

        new = TOOLBAR_RE.sub(tb_repl, new, count=1)

        # Inject/update version + log/todo links inside <footer>
        new = FOOTER_META_RE.sub("", new)
        if "</footer>" in new:
            new = new.replace("</footer>", f"{footer_meta_html}\n    </footer>", 1)

        if new != text:
            page.write_text(new, encoding="utf-8")
            changed.append(page.name)
    return changed, versions


if __name__ == "__main__":
    changed, versions = stamp()
    print(f"repo version: {repo_version()}")
    for rel, v in sorted(versions.items()):
        print(f"{rel}?v={v}")
    print(f"updated {len(changed)} page(s): {', '.join(changed) or 'none'}")

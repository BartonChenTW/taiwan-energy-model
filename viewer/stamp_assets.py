"""
Stamp the website's CSS/JS links with a hash of their content (cache busting).

GitHub Pages lets browsers cache files for 10 minutes or more, so after a change
visitors may keep running an old script. This rewrites every
``assets/<file>.js`` / ``.css`` reference in ``docs/*.html`` to
``assets/<file>.js?v=<first 8 hex of its SHA-256>``, so a changed file gets a
new URL and is fetched again, while unchanged files stay cached.

Run before publishing (the exporter runs it too):

    python pypsa_tw/viewer/stamp_assets.py
"""

import hashlib
import re
from pathlib import Path

DOCS = Path(__file__).resolve().parents[2] / "docs"
REF = re.compile(r'(["\'])(assets/[\w.-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?\1')


def stamp(docs=DOCS):
    changed = []
    versions = {}
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
        if new != text:
            page.write_text(new, encoding="utf-8")
            changed.append(page.name)
    return changed, versions


if __name__ == "__main__":
    changed, versions = stamp()
    for rel, v in sorted(versions.items()):
        print(f"{rel}?v={v}")
    print(f"updated {len(changed)} page(s): {', '.join(changed) or 'none'}")

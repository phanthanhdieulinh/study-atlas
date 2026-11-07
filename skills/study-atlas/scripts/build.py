#!/usr/bin/env python3
"""Build one self-contained Study Atlas HTML file from a work folder.

Usage: python build.py WORKDIR OUTPUT.html [--skip-validate]

WORKDIR holds course.json and units/NN.json (see references/schema.md).
The HTML needs no server: open it straight from disk. Progress is saved in the
browser's localStorage. Source links are relative, so keep the HTML in the same
folder as the files named in course.json "sources".
"""
import html, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets")
sys.path.insert(0, HERE)
from validate import validate, load_work, stats  # noqa: E402

def build(work, out, skip_validate=False):
    if not skip_validate:
        E, W = validate(work, os.path.dirname(os.path.abspath(out)))
        for w in W: print("WARN ", w)
        if E:
            for e in E: print("ERROR", e)
            raise SystemExit("Fix the errors above, then build again.")
    course, units = load_work(work)
    units = [u for _, u in sorted(units, key=lambda x: x[1]["n"])]
    hl, num = [], []
    for u in units:
        u.setdefault("traps", [])
        for q in u.pop("hl", []): hl.append([u["n"]] + q)
        for q in u.pop("num", []): num.append([u["n"]] + q)
    data = dict(course)
    data["units"], data["hl"], data["num"] = units, hl, num
    meta = course["meta"]
    js_data = json.dumps(data, ensure_ascii=False).replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    app = open(os.path.join(ASSETS, "app.js"), encoding="utf8").read()
    css = open(os.path.join(ASSETS, "style.css"), encoding="utf8").read()
    unit = meta.get("unitName", "Week")
    ns = [u["n"] for u in units]
    tag = f"{meta.get('code') or ''}{' · ' if meta.get('code') else ''}{unit.upper()}S {min(ns)}–{max(ns)}"
    title = meta.get("appTitle") or f"{meta.get('code') or meta['title']} Study Atlas"
    views = "map guide cards test drills sheet progress".split()
    page = f"""<!doctype html>
<html lang="{html.escape(meta.get('lang', 'en'))}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{html.escape(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Source+Sans+3:wght@400;500;600;700&family=Zilla+Slab:wght@600;700&display=swap">
<style>{css}</style></head><body>
<header class="bar"><div class="brand"><b>{html.escape(meta.get('brand', 'Study Atlas'))}</b><span>{html.escape(tag)}</span></div><nav class="tabs" role="tablist" aria-label="Sections"></nav><button class="iconbtn" id="theme" aria-label="Switch light or dark theme">Theme</button></header>
<main>{''.join(f'<section class="view" id="v-{v}" hidden></section>' for v in views)}</main>
<script>const COURSE={js_data};
{app}</script></body></html>"""
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    open(out, "w", encoding="utf8").write(page)
    print(f"Built {out} ({len(page)//1024} KB): {stats(work)}")

if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] in ("-h", "--help"): raise SystemExit(__doc__)
    build(sys.argv[1], sys.argv[2], "--skip-validate" in sys.argv)

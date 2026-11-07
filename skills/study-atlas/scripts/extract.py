#!/usr/bin/env python3
"""Extract study material into plain files Claude can read and cite.

Usage: python extract.py OUT_DIR INPUT [INPUT ...] [--render]
  INPUT    files or folders: .pdf (best), .pptx, .docx, .txt, .md
  --render also save a PNG of every page that has a figure (photo, chart,
           diagram) or little or no text, so Claude can see what the text
           layer misses.

Writes to OUT_DIR:
  manifest.json      one entry per unit: number, file, pages, image-only pages
  uNN.txt            page text, pages separated by "--- pN ---"
  uNN_emph.json      {"p12": ["phrase", ...]} text the source emphasises:
                     bold, coloured, highlighted (PDF highlight annotations,
                     coloured boxes behind text, PPTX/DOCX highlight)
  uNN_nums.json      {"p12": ["sentence with a number", ...]}
  img/uNN_pPP.png    page renders (with --render) of every page listed in
                     manifest "figure_pages" (image-only pages are a subset)

Needs: pymupdf for PDFs (pip install pymupdf). Optional: python-pptx, python-docx.
Unit numbers come from names like "Week 3", "Lecture 03", "Ch 3", "Topic 3",
"Unit 3", "Session 3", "L3" or a leading number; otherwise files are numbered
in name order. Check manifest.json and rename files if the guess is wrong.
"""
import collections, glob, json, os, re, sys

UNIT_RE = re.compile(r"(?:week|wk|lecture|lect|lec|chapter|ch|topic|unit|session|module|mod|class|seminar|day|part|l|w)[\s._-]*0*(\d{1,3})(?!\d)", re.I)
NUM_RE = re.compile(r"\d")
BOILER = re.compile(r"copyright|all rights reserved|©|confidential|^\s*\d{1,3}\s*$", re.I)

def unit_of(path, fallback):
    name = os.path.splitext(os.path.basename(path))[0]
    m = UNIT_RE.search(name)
    if m: return int(m.group(1))
    m = re.match(r"\s*0*(\d{1,3})(?!\d)", name)
    return int(m.group(1)) if m else fallback

def sentences_with_numbers(text):
    """Group lines into bullets/sentences (a line starting lower-case continues
    the previous one), then keep the ones that carry a real number."""
    chunks, cur = [], ""
    for line in text.splitlines():
        line = line.strip()
        if not line: continue
        if cur and (line[0].islower() or line[0] in "(,;%" or not re.search(r"[.:;!?]$", cur) and len(cur) < 60 and not re.match(r"[❑•▪●◦■□➢►\-–]", line)):
            cur += " " + line
        else:
            if cur: chunks.append(cur)
            cur = line
    if cur: chunks.append(cur)
    out = []
    for c in chunks:
        c = re.sub(r"^[❑•▪●◦■□➢►\-–]\s*", "", c)
        c = re.sub(r"^\(?\d{1,2}[.)]\s+", "", c)                     # list numbering "1." "2)"
        c = re.sub(r"https?://\S+|www\.\S+", "", c)                   # URLs
        c = re.sub(r"(\s+\d{1,2}\.)+$", "", c)                         # trailing list number "HEADING 1."
        c = re.sub(r"\s+\d{1,3}$", "", c).strip()                      # trailing slide number
        core = re.sub(r"(?:[A-Z][a-z]?\d+)+[a-z]?", "", c)           # chemical formulas: CO2, CH4, N2O
        core = UNIT_RE.sub("", core)                                    # "Week 12", "Lecture 3"
        if len(c) < 4 or not NUM_RE.search(core) or BOILER.search(c): continue
        if re.fullmatch(r"[\d\s.,:/()-]+", c): continue
        if re.fullmatch(r"[^\d]*\(?(19|20)\d\d\)?[.,]?", c) and len(c) > 60: continue   # citation, only a year
        out.append(c[:400])
    return out

def is_plain(c):
    """Greys/black/white count as body text, not emphasis."""
    r, g, b = (c >> 16) & 255, (c >> 8) & 255, c & 255
    return max(r, g, b) - min(r, g, b) < 40

# ---------------- PDF ----------------
def pdf_pages(path, out_img=None, unit=None):
    import pymupdf
    doc = pymupdf.open(path)
    sizes = collections.Counter()
    for p in doc:
        for b in p.get_text("dict")["blocks"]:
            for l in b.get("lines", []):
                for s in l["spans"]:
                    if s["text"].strip(): sizes[round(s["size"])] += len(s["text"])
    body = sizes.most_common(1)[0][0] if sizes else 12
    # strings repeated on most pages are headers/footers
    rep = collections.Counter()
    for p in doc:
        seen = set(l.strip() for l in p.get_text().splitlines() if l.strip())
        rep.update(seen)
    boiler = {k for k, v in rep.items() if len(doc) > 3 and v >= 0.5 * len(doc)}
    pages = []
    for p in doc:
        H = p.rect.height
        text = "\n".join(l for l in p.get_text().splitlines() if l.strip() not in boiler)
        # coloured boxes behind text and highlight annotations
        marks = []
        for d in p.get_drawings():
            f = d.get("fill")
            if f and len(f) == 3:
                r, g, b = f
                if max(f) - min(f) > 0.25 and min(f) > 0.45 and d["rect"].height < H * 0.12:
                    marks.append(d["rect"])
        for a in p.annots() or []:
            if a.type[1] in ("Highlight", "Underline", "Squiggly"):
                marks.append(a.rect)
        emph = []
        for b in p.get_text("dict")["blocks"]:
            cur, gap = "", ""
            for l in b.get("lines", []):
                for s in l["spans"]:
                    t = s["text"]
                    big = s["size"] >= body * 1.5 or s["bbox"][1] < H * 0.1
                    on = (not big) and t.strip() and t.strip() not in boiler and (
                        (s["flags"] & 16) or "bold" in s["font"].lower() or "black" in s["font"].lower()
                        or not is_plain(s["color"])
                        or any(pymupdf.Rect(s["bbox"]).intersects(m) for m in marks))
                    if on:
                        cur += gap + t; gap = ""
                    elif cur and len(t.strip()) <= 2 and not re.search(r"[A-Za-z]{2}", t):
                        gap += t            # bridge "°", "-", spaces inside an emphasised phrase
                    else:
                        if cur.strip(): emph.append(re.sub(r"\s+", " ", cur).strip())
                        cur, gap = "", ""
                if cur: gap += " "          # phrase continues onto the next line
            if cur.strip(): emph.append(re.sub(r"\s+", " ", cur).strip())
        emph = [e for e in dict.fromkeys(emph) if len(e) > 2 and not re.fullmatch(r"[\d\W]+", e) and not BOILER.search(e)]
        img_only = len(re.sub(r"\s", "", text)) < 60
        area = p.rect.width * p.rect.height
        fig = sum(pymupdf.Rect(i["bbox"]).intersect(p.rect).get_area() for i in p.get_image_info()) / area
        vec = sum(1 for d in p.get_drawings() if d["rect"].width * d["rect"].height < area * 0.5)
        has_fig = img_only or fig > 0.12 or vec > 40   # photos, charts, diagrams
        if out_img is not None and has_fig:
            z = 1400 / p.rect.width
            p.get_pixmap(matrix=pymupdf.Matrix(z, z)).save(os.path.join(out_img, f"u{unit:02d}_p{p.number+1}.png"))
        pages.append((text, emph, bool(img_only), bool(has_fig)))
    return pages

# ---------------- PPTX ----------------
def pptx_pages(path):
    from pptx import Presentation
    prs = Presentation(path)
    pages = []
    for slide in prs.slides:
        texts, emph, pics = [], [], 0
        for sh in slide.shapes:
            if sh.shape_type == 13: pics += 1
            if not sh.has_text_frame: continue
            for para in sh.text_frame.paragraphs:
                line = "".join(r.text for r in para.runs)
                if line.strip(): texts.append(line)
                for r in para.runs:
                    f = r.font
                    hl = False
                    try: hl = f.color and f.color.type is not None and f.color.rgb is not None and not is_plain(int(str(f.color.rgb), 16))
                    except Exception: pass
                    if (f.bold or hl or r._r.find(".//{http://schemas.openxmlformats.org/drawingml/2006/main}highlight") is not None) and r.text.strip():
                        emph.append(r.text.strip())
        if slide.has_notes_slide and slide.notes_slide.notes_text_frame.text.strip():
            texts.append("[Speaker notes] " + slide.notes_slide.notes_text_frame.text)
        text = "\n".join(texts)
        pages.append((text, list(dict.fromkeys(emph)), len(text) < 60 and pics > 0, pics > 0))
    return pages

# ---------------- DOCX / text ----------------
def docx_pages(path):
    import docx
    d = docx.Document(path)
    text, emph = [], []
    for para in d.paragraphs:
        if para.text.strip(): text.append(para.text)
        for r in para.runs:
            if r.text.strip() and (r.bold or r.font.highlight_color is not None or para.style.name.lower().startswith("heading")):
                emph.append(r.text.strip())
    # one "page" per ~3000 chars so refs stay useful
    full, pages, buf = "\n".join(text), [], ""
    for line in full.splitlines():
        buf += line + "\n"
        if len(buf) > 3000: pages.append(buf); buf = ""
    if buf: pages.append(buf)
    return [(p, [e for e in emph if e in p], False, False) for p in pages]

def text_pages(path):
    full = open(path, encoding="utf8", errors="replace").read()
    chunks = re.split(r"\n(?=#{1,2} )", full) if path.endswith(".md") else [full[i:i+3000] for i in range(0, len(full), 3000)]
    out = []
    for c in chunks:
        emph = re.findall(r"\*\*(.+?)\*\*|__(.+?)__|==(.+?)==", c)
        out.append((c, [next(x for x in e if x) for e in emph], False, False))
    return out

READERS = {".pdf": pdf_pages, ".pptx": pptx_pages, ".docx": docx_pages, ".txt": text_pages, ".md": text_pages}

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) < 2: raise SystemExit(__doc__)
    out, inputs, render = args[0], args[1:], "--render" in sys.argv
    files = []
    for i in inputs:
        if os.path.isdir(i):
            for ext in READERS: files += glob.glob(os.path.join(i, "**", "*" + ext), recursive=True)
        elif os.path.exists(i): files.append(i)
        else: print("skip, not found:", i)
    files = sorted(set(f for f in files if os.path.splitext(f)[1].lower() in READERS and not os.path.basename(f).startswith(("~$", "."))))
    if not files: raise SystemExit("No .pdf/.pptx/.docx/.txt/.md files found.")
    os.makedirs(out, exist_ok=True)
    img = os.path.join(out, "img")
    if render: os.makedirs(img, exist_ok=True)
    used, manifest = set(), []
    for k, f in enumerate(files, 1):
        n = unit_of(f, k)
        while n in used: n += 100  # clash: keep both, flag it
        used.add(n)
        ext = os.path.splitext(f)[1].lower()
        try:
            pages = pdf_pages(f, img if render else None, n) if ext == ".pdf" else READERS[ext](f)
        except ImportError as e:
            print(f"skip {f}: install the reader first ({e.name}). For .pptx you can also export to PDF.")
            continue
        txt, emph, nums, imgs, figs = [], {}, {}, [], []
        for i, (t, e, io, fg) in enumerate(pages, 1):
            txt.append(f"--- p{i} ---\n{t}")
            if e: emph[f"p{i}"] = e
            s = sentences_with_numbers(t)
            if s: nums[f"p{i}"] = s
            if io: imgs.append(i)
            if fg: figs.append(i)
        open(os.path.join(out, f"u{n:02d}.txt"), "w", encoding="utf8").write("\n".join(txt))
        json.dump(emph, open(os.path.join(out, f"u{n:02d}_emph.json"), "w", encoding="utf8"), ensure_ascii=False, indent=0)
        json.dump(nums, open(os.path.join(out, f"u{n:02d}_nums.json"), "w", encoding="utf8"), ensure_ascii=False, indent=0)
        manifest.append({"unit": n, "file": os.path.abspath(f), "name": os.path.basename(f), "pages": len(pages),
                         "chars": sum(len(p[0]) for p in pages), "emphasised": sum(len(v) for v in emph.values()),
                         "number_sentences": sum(len(v) for v in nums.values()), "image_only_pages": imgs, "figure_pages": figs,
                         "unit_from_name": unit_of(f, None) is not None})
    manifest.sort(key=lambda m: m["unit"])
    json.dump(manifest, open(os.path.join(out, "manifest.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    for m in manifest:
        flag = "" if m["unit_from_name"] else "  (unit number guessed from order)"
        print(f"unit {m['unit']:>3}  {m['pages']:>3} pages  {m['emphasised']:>4} emphasised  {m['number_sentences']:>4} number lines  {len(m['image_only_pages']):>2} image-only {len(m['figure_pages']):>3} with figures  {m['name']}{flag}")

if __name__ == "__main__":
    main()

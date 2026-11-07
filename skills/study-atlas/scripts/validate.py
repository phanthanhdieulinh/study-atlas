#!/usr/bin/env python3
"""Validate a Study Atlas work folder (course.json + units/*.json).

Usage: python validate.py WORKDIR [--html-dir DIR]
  --html-dir  folder the final HTML will live in; source files are checked relative to it.
Exits 1 if there are errors. Warnings never fail the run.
"""
import json, os, re, sys, glob

def load_work(work):
    cpath = os.path.join(work, "course.json")
    course = json.load(open(cpath, encoding="utf8"))
    units = []
    for f in sorted(glob.glob(os.path.join(work, "units", "*.json"))):
        try:
            units.append((os.path.basename(f), json.load(open(f, encoding="utf8"))))
        except json.JSONDecodeError as e:
            raise SystemExit(f"ERROR {f}: not valid JSON ({e})")
    return course, units

def validate(work, html_dir=None):
    E, W = [], []
    err = lambda m: E.append(m)
    warn = lambda m: W.append(m)
    try:
        course, units = load_work(work)
    except FileNotFoundError as e:
        return [f"missing file: {e.filename}"], []
    meta = course.get("meta", {})
    for k in ("title", "unitName"):
        if not meta.get(k): err(f"course.json meta.{k} is required")
    U1 = (meta.get("unitName") or "W")[0].upper()
    ref_re = re.compile(r"^(%s\d+ p\d+)(, %s\d+ p\d+)*$" % (U1, U1))
    themes = course.get("themes", {})
    if not themes: err("course.json themes: give 1-6 groups, keys t1..t6")
    for k in themes:
        if k not in {f"t{i}" for i in range(1, 7)}: err(f"theme key {k!r} must be t1..t6")
    if not units: err("units/ has no unit files")
    nums = set()
    exam = meta.get("exam", {})
    for fn, u in units:
        where = f"units/{fn}"
        for k in ("n", "th", "title", "short", "idea", "sections", "map", "cards", "mcq"):
            if k not in u: err(f"{where}: missing {k}")
        n = u.get("n")
        if not isinstance(n, int): err(f"{where}: n must be an integer"); continue
        if n in nums: err(f"{where}: duplicate unit number {n}")
        nums.add(n)
        if u.get("th") not in themes: err(f"{where}: th {u.get('th')!r} is not a theme key")
        if len(u.get("short", "")) > 32: warn(f"{where}: short title over 32 chars, it will crowd the map")
        for i, s in enumerate(u.get("sections", [])):
            if not s.get("h") or not s.get("b"): err(f"{where} sections[{i}]: needs h and b")
            if re.search(r"<script|on\w+=", s.get("b", ""), re.I): err(f"{where} sections[{i}]: no scripts or inline handlers")
            for wdg in re.findall(r"data-widget=['\"]([^'\"]+)", s.get("b", "")):
                kind, _, idx = wdg.partition(":")
                pool = {"sort": "sorts", "tree": "trees", "calc": "calcs"}.get(kind)
                if kind == "notes": continue
                if not pool: err(f"{where}: unknown widget {wdg!r}")
                elif int(idx or 0) >= len(course.get(pool, [])): err(f"{where}: widget {wdg!r} has no {pool}[{idx or 0}]")
        for i, t in enumerate(u.get("map", [])):
            if not (isinstance(t, list) and len(t) >= 2): err(f"{where} map[{i}]: [label, detail, [[label, detail], ...]]")
            for j, l in enumerate(t[2] if len(t) > 2 else []):
                if not (isinstance(l, list) and 1 <= len(l) <= 2): err(f"{where} map[{i}][2][{j}]: [label] or [label, detail]")
        for i, c in enumerate(u.get("cards", [])):
            if not (isinstance(c, list) and len(c) == 2 and all(isinstance(x, str) and x.strip() for x in c)): err(f"{where} cards[{i}]: [question, answer]")
        def chk_q(q, i, kind, has_ans):
            L = 5 if has_ans else 4
            if not (isinstance(q, list) and len(q) == L): err(f"{where} {kind}[{i}]: wrong shape"); return
            stem, opts = q[0], q[1]
            why, ref = (q[3], q[4]) if has_ans else (q[2], q[3])
            if not isinstance(opts, list) or len(opts) != 4 or len(set(opts)) != 4 or not all(isinstance(o, str) and o.strip() for o in opts):
                err(f"{where} {kind}[{i}]: needs 4 distinct non-empty options")
            if has_ans and q[2] not in (0, 1, 2, 3): err(f"{where} {kind}[{i}]: answer index must be 0-3")
            if ref and not ref_re.match(ref): err(f"{where} {kind}[{i}]: ref {ref!r} should look like '{U1}{n} p12'")
            if ref and not ref.startswith(f"{U1}{n} ") and kind != "mcq": warn(f"{where} {kind}[{i}]: ref {ref} points at another unit")
            if not ref and meta.get("mode") != "topic": warn(f"{where} {kind}[{i}]: no page ref")
            if len(why.split()) > 45: warn(f"{where} {kind}[{i}]: explanation is long ({len(why.split())} words)")
            if any(o.lower() in ("all of the above", "none of the above") for o in opts): err(f"{where} {kind}[{i}]: no all/none of the above")
            if re.search(r"\b(NOT|EXCEPT)\b", stem): warn(f"{where} {kind}[{i}]: negative stem (NOT/EXCEPT); prefer a positive question")
            lens = [len(o) for o in opts]
            a = q[2] if has_ans else 0
            if a in (0, 1, 2, 3) and lens[a] > 2.2 * max(min(lens), 8) and lens[a] == max(lens): warn(f"{where} {kind}[{i}]: correct option is much longer than the rest (gives it away)")
            return stem
        for kind, has_ans in (("mcq", True), ("hl", False), ("num", False)):
            seen = set()
            for i, q in enumerate(u.get(kind, [])):
                st = chk_q(q, i, kind, has_ans)
                if st in seen: warn(f"{where} {kind}[{i}]: duplicate stem")
                seen.add(st)
        if len(u.get("cards", [])) < 6: warn(f"{where}: only {len(u.get('cards', []))} flashcards")
        if len(u.get("mcq", [])) < 6: warn(f"{where}: only {len(u.get('mcq', []))} practice questions")
    # cross-unit extras
    def unit_ok(w, where):
        if w not in nums: err(f"{where}: unit {w} does not exist")
    for i, s in enumerate(course.get("seq", [])):
        if len(s.get("i", [])) < 3: err(f"seq[{i}]: needs 3+ items")
        unit_ok(s.get("w"), f"seq[{i}]")
    for i, l in enumerate(course.get("lists", [])):
        unit_ok(l.get("w"), f"lists[{i}]")
        for j, it in enumerate(l.get("i", [])):
            try: re.compile(it[1], re.I)
            except re.error: err(f"lists[{i}].i[{j}]: bad regex {it[1]!r}")
            if not re.search(it[1], it[0], re.I): warn(f"lists[{i}].i[{j}]: regex {it[1]!r} does not match its own label {it[0]!r}")
    if 0 < len(course.get("pairs", [])) < 6: warn("pairs: the match drill needs 6+ pairs, so it will be hidden")
    for i, nn in enumerate(course.get("nums", [])):
        if len(nn) != 3 or not isinstance(nn[2], int): err(f"nums[{i}]: must be [fact, value, unitNumber] where unitNumber is the integer unit it comes from, e.g. [\"Tax rate\", \"21%\", 8]")
        else: unit_ok(nn[2], f"nums[{i}]")
    for i, t in enumerate(course.get("threads", [])):
        for w in t.get("w", []): unit_ok(w, f"threads[{i}]")
    for i, f in enumerate(course.get("flags", [])):
        if not all(f.get(k) for k in ("w", "s", "f")): err(f"flags[{i}]: needs w, s, f")
    for i, s in enumerate(course.get("sorts", [])):
        for j, it in enumerate(s.get("items", [])):
            if not (0 <= it[1] < len(s.get("cats", []))): err(f"sorts[{i}].items[{j}]: category index out of range")
    for i, t in enumerate(course.get("trees", [])):
        nodes, ends = t.get("nodes", {}), t.get("ends", {})
        if t.get("start") not in nodes: err(f"trees[{i}]: start node missing")
        for k, nd in nodes.items():
            for tgt in nd[2:4]:
                if tgt not in nodes and tgt not in ends: err(f"trees[{i}].{k}: target {tgt!r} is not a node or end")
    for i, c in enumerate(course.get("calcs", [])):
        if not c.get("inputs") or not c.get("out"): err(f"calcs[{i}]: needs inputs and out")
    # sources
    srcs = course.get("sources", {})
    for k, f in srcs.items():
        if int(k) not in nums: warn(f"sources: unit {k} has no unit file")
        if html_dir and not os.path.exists(os.path.join(html_dir, f)): warn(f"sources: {f!r} is not next to the HTML, so its links will not open")
    return E, W

def stats(work):
    course, units = load_work(work)
    tot = {k: sum(len(u.get(k, [])) for _, u in units) for k in ("cards", "mcq", "hl", "num")}
    return f"{len(units)} units, " + ", ".join(f"{v} {k}" for k, v in tot.items())

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"): raise SystemExit(__doc__)
    hd = sys.argv[sys.argv.index("--html-dir") + 1] if "--html-dir" in sys.argv else None
    E, W = validate(sys.argv[1], hd)
    for w in W: print("WARN ", w)
    for e in E: print("ERROR", e)
    if not E: print(f"PASSED with {len(W)} warning(s) to review:" if W else "PASSED:", stats(sys.argv[1]))
    else: print(f"FAILED: {len(E)} error(s), {len(W)} warning(s)")
    sys.exit(1 if E else 0)

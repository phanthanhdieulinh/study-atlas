---
name: study-atlas
description: Build a complete, interactive, offline study app for a course or topic as one HTML file. It includes a mind map with recall mode, a study guide per unit, spaced-repetition flashcards, practice tests with a timed mock exam, a test on only the highlighted or bold text, a test on every number in the materials, drills and a cheat sheet. Every answer links back to the source page. Use it when someone wants revision, exam-prep or learning material from their lecture slides, PDFs, notes or textbook chapters, whether given as a folder, as uploaded files, or as just a course or topic name. Trigger phrases include "study atlas", "help me revise", "make study material", "exam prep from these slides" and "turn my notes into flashcards and a quiz".
---

# Study Atlas

Build a single self-contained HTML study app from course materials, or from a topic name when there are no materials. The app shell, styling and build steps are already written. Your job is the content: read everything, understand it, and write accurate study material and questions into JSON files. The scripts check those files and assemble the app.

The bar is set by what a strong student would make for themselves the week before an exam. That means complete coverage, the course's own wording, every number, every emphasised term, and the places where the slides are wrong flagged honestly.

## 0. Work out the input

| What the user gives | Where the files are | Mode |
|---|---|---|
| A folder path ("from the PDFs in this folder") | That folder | `materials` |
| Uploaded or attached files ("from the PDFs I upload here") | The paths the conversation shows for the attachments. On claude.ai they are usually in `/mnt/user-data/uploads/`; look there if no path is shown. | `materials` |
| Only a course or topic name ("for Corporate Finance") | None | `topic` (see `references/topic-mode.md`) |

If they give both files and a topic name, use the files and treat the name as the title.

Ask at most one short question before starting, and only if you can't infer it: what the exam looks like (number of questions, minutes, format). If the materials state the exam format, use that. If nobody knows, use 20 questions in 30 minutes and say so at the end.

If the user names an output file or folder, use it. Otherwise call the file `<Course> Study Atlas.html`.

## 1. Set up and extract

```bash
pip install pymupdf            # PDFs; add python-pptx / python-docx if those formats are present
python <skill>/scripts/extract.py WORK/extract <files-or-folder> --render
```

`WORK` is a scratch folder. `<skill>` is this skill's folder. The extractor writes the following, one set per unit:
- `uNN.txt`: page text.
- `uNN_emph.json`: what the source emphasises (bold, colour, highlights).
- `uNN_nums.json`: lines that contain a number.
- `img/`: PNG renders of every page with a figure (photo, chart, diagram) or with no text layer.
- `manifest.json`.

`uNN_emph.json` and `uNN_nums.json` are candidate lists, not answer keys. They still contain some agenda items, headings and citations, so drop those as you go.

Read `manifest.json`. Check that the unit numbering matches the course order. Decide what to do with files that aren't lectures, such as past papers, readings or a syllabus. A past paper is good for working out the exam style and for checking coverage, but don't copy its questions. Then:

- Read every `uNN.txt` in full.
- Look at every PNG in `img/`, which covers every page in each unit's `figure_pages`. Charts, timelines, diagrams and screenshots often hold the numbers and frameworks that exams test, and the text layer misses them. This is the step people skip. Don't skip it.

## 2. Plan the course (course.json)

Write `WORK/course.json`. The exact shape is in `references/schema.md`. Decide:

- **meta:** code, title, subtitle, `unitName` (Week, Lecture, Chapter, whatever the course uses), exam settings, and `mode`.
- **themes:** 1–6 groups of units (keys `t1`…`t6`), for colour coding. Group by the course's own arc.
- **sources:** unit number → file name. Use the name as the file will sit next to the HTML. See step 5.

## 3. Write the units

There is one file per unit, `WORK/units/NN.json`. Each holds:
- the study guide sections and exam traps
- the mind-map branches
- flashcards
- practice MCQs
- `hl`: questions on emphasised text only
- `num`: questions on every number

Follow `references/writing-guide.md`. It has the coverage targets, question rules and the HTML components the guide can use. Hard rules:

- Use only facts from the materials, with a page ref like `W3 p26`. Never invent a fact, a figure or a page number.
- Questions have 4 options with the **correct one first**; the app shuffles them. Explanations are 30 words or fewer and quote the material.
- Shapes differ. `mcq` is `[stem, options, 0, why, ref]` with an answer index. `hl` and `num` are `[stem, options, why, ref]` with no index, because the correct option is always first.
- `hl` covers every meaningful emphasised term in `uNN_emph.json`. `num` covers every meaningful number in `uNN_nums.json` and on the image pages. Skip page numbers, copyright lines and citation years.
- When slides contradict each other or are wrong, say so in the explanation and add an entry to `flags` in course.json.

**Parallelise when you can.** If you have a subagent or Task tool and there are more than 3 units, split the units into 2–4 contiguous ranges. Give each range to a subagent using the brief in `references/subagent-brief.md`, so each one writes only its own `units/NN.json` files. Write course.json yourself, and review a sample of each subagent's output before building. Without subagents, write the units one at a time.

## 4. Cross-unit material (back in course.json)

Once the units exist, add whichever of these the course supports:
- `seq`: things that come in an order.
- `lists`: named sets, for "name them all".
- `pairs`: term ↔ definition.
- `nums`: a cheat-sheet table of the key numbers. Each entry is `[fact, value, unitNumber]`, where the third item is the integer unit the fact comes from, not a unit of measure.
- `confuse`: easily confused pairs.
- `threads`: topics that recur across units.
- `flags`: source errors and clashes.

Interactive extras are optional; add them only where the course has the right structure:
- `sorts`: classify items into categories.
- `trees`: yes/no decision trees.
- `calcs`: small calculators for formulas the course uses.

Embed one in a guide section with `<div data-widget='calc:0'></div>`.

## 5. Validate, build, check

```bash
python <skill>/scripts/validate.py WORK --html-dir <where the HTML will live>
python <skill>/scripts/build.py WORK "<output folder>/<Course> Study Atlas.html"
```

Fix every ERROR. "PASSED with N warnings" still needs a read: fix the warnings that matter, such as missing refs, giveaway options or negative stems.

**Where to save the HTML.** Source links are relative, so they only open when the HTML sits next to the source files.
- **Materials from a local folder:** save the HTML in that same folder.
- **Uploaded files** (e.g. claude.ai): save to the outputs folder (`/mnt/user-data/outputs/` on claude.ai), set `sources` to the original file names, and tell the user to put the HTML in the same folder as their copies of the files.
- **Topic mode:** there are no sources; leave `sources` empty.

If you have a browser tool, open the file and check each tab:
- The map renders.
- A guide page shows its widgets.
- A practice question shows its source link.
- The highlights and numbers sets start.
- The console has no errors.

## 6. Hand over

Tell the user, briefly:
- where the file is and that it works offline
- that progress saves in the browser, and that Progress → Export makes a backup
- the counts: units, flashcards, MCQs, highlight and number questions
- slide errors you flagged
- anything you couldn't read or had to guess, such as unit order, exam format or unreadable pages

In topic mode, say plainly that the content comes from public sources, not their course, and that they should check it against their syllabus.

## Files in this skill

- `scripts/extract.py`: PDF/PPTX/DOCX/TXT/MD → text, emphasis, numbers, page renders.
- `scripts/validate.py`: schema and quality checks.
- `scripts/build.py`: course.json + units → one HTML file. It runs the validator first.
- `assets/app.js`, `assets/style.css`: the app. Don't edit them per course; everything course-specific goes in the JSON.
- `references/schema.md`: every field, with examples.
- `references/writing-guide.md`: coverage targets, question craft, guide HTML components.
- `references/subagent-brief.md`: the brief to give parallel writers.
- `references/topic-mode.md`: building from a topic name with no materials.

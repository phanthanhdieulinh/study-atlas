# Writing guide

## Coverage targets per unit

Scale these targets to how much content the unit has. A 50-slide unit gets the top of each range, and a 6-slide admin week can have almost nothing.

| Part | Target |
|---|---|
| Guide sections | 4–8, covering every slide that carries content, in the course's order |
| Exam traps | 2–6 |
| Map branches | 4–8 topics, each with 2–8 leaves |
| Flashcards | 10–20 |
| Practice MCQs | 12–25, mixing recall, understanding and application |
| `hl` | one question per distinct emphasised concept; aim for every meaningful item in `uNN_emph.json` |
| `num` | one question per distinct meaningful number; aim for every one in `uNN_nums.json` and on image pages |

**What counts as emphasised:** bold, coloured or highlighted text. When the emphasised text is only a label, such as "Definition:", "Scope 2" or "Challenge:", the question tests what the source says about that labelled thing. Leave out navigation: agenda slides, "Thank you", the lecturer's name, section numbers and feedback URLs.

**What's examinable:** everything taught, including context and case slides such as market infographics and company examples. Weight these lighter than core concepts: one or two questions each, not ten. Course admin, like exam date, room or format, belongs in `meta.exam` and not in questions.

**What counts as a number:** figures, percentages, money, dates and years of events, thresholds, counts ("the seven principles"), multipliers, factors, and the results of worked calculations. When a slide shows a calculation, ask for the result. Where it helps, also ask for an input or a factor. Leave out slide numbers, copyright years, citation years and image credits. If you work out a result the slide doesn't state, say so in `why`.

## Question craft

- **The stem stands on its own.** Name the scheme, country, framework or unit, as in "Under the EU ETS…". Don't use "According to the slide…" with no subject.
- **The correct option goes first.** The app shuffles the options.
- **Distractors are the same kind as the answer and plausible.**
  - For numbers, use nearby values, other numbers from the course, swapped units or a wrong year.
  - For concepts, use sibling concepts from the same course.
  - Keep all four a similar length, so the longest option isn't always the right one.
- **Banned:** "all of the above", "none of the above", jokes, and trick negatives ("Which is NOT…") unless the course itself uses them.
- **`why`:** 30 words or fewer, plain language, and it quotes the fact from the source. Name a slide clash if there is one.
- **`ref`:** the exact page or slide in that unit's file. Several are allowed. Never guess a page; check it in `uNN.txt` or the render.
- **No invented facts.** Everything must come from the materials. In topic mode, it must come from a source you actually read.
- **Course wording.** Mirror the materials' terms, because exams usually mark the course's own phrasing.

## Mock-exam realism

If there is a past paper or a stated format, match its style: question length, scenario versus definition questions, and number of options. Spread the MCQs across a unit's topics instead of clustering them on one slide.

## Guide HTML components

Write tight, scannable notes rather than paragraphs copied from the slides. Wrap key terms in `<b>`, because "Hide key terms" turns every `<b>` in a section into a click-to-reveal blank. Never use `<script>`, inline `on…=` handlers or external images.

| Component | HTML |
|---|---|
| Paragraph / list | `<p>`, `<ul><li>`, `<ol><li>`, two-column list `<ol class='cols'>` |
| Card | `<div class='box'><h4>Title</h4><p>…</p></div>` |
| Side by side | `<div class='two'>box box</div>`, `<div class='three'>box box box</div>` |
| Table | `<div class='scroll'><table class='t'><tr><th>…</th></tr><tr><td>…</td></tr></table></div>` |
| Timeline | `<div class='tl'><div><b>2015</b>Paris Agreement</div><div><b>2021</b>…</div></div>` |
| Flow | `<div class='flow'><div><b>Step</b><span>detail</span></div><div class='to'>&rarr;</div><div class='hl'><b>Key step</b><span>detail</span></div></div>` |
| Memory hook | `<p class='memo'>Memory hook: <b>G-I-I-I</b>. Goal, Inventory, Impact, Interpretation.</p>` |
| Warning / slide error | `<p class='warn'>The slide says X; it should be Y.</p>` |
| Widget | `<div data-widget='sort:0'></div>`, `'tree:0'`, `'calc:0'`, `'notes'`. The index points into course.json. |
| Sub/superscript | `CO<sub>2</sub>`, `r<sup>n</sup>` |

Use single quotes inside the HTML so the JSON stays readable.

Memory hooks help most with ordered steps and named sets. Make them meaningful. An acronym of the actual first letters beats an invented phrase that doesn't match.

## Honesty

- If a page is unreadable even when rendered, say so in your hand-over. Don't paper over it.
- When the slides are wrong, teach the slide's wording, since that's likely to be marked, and give the correction in a `warn` block and in `flags`.
- If the unit order or the exam format is a guess, say so in the hand-over.

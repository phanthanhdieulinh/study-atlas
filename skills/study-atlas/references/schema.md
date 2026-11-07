# Data schema

A work folder looks like this:

```
WORK/
├── course.json        course-wide settings and cross-unit material
└── units/
    ├── 01.json        one file per unit (week, lecture, chapter…)
    ├── 02.json
    └── …
```

All text is plain UTF-8. Only guide `sections[].b` is HTML. Page refs use the first letter of `unitName` plus the unit number, then the page: `W3 p26`. List several refs with commas: `W3 p26, W3 p30`.

## course.json

```json
{
  "meta": {
    "code": "FIN 2004",
    "title": "Corporate Finance",
    "subtitle": "Twelve weeks, from time value to capital structure.",
    "unitName": "Week",
    "brand": "Study Atlas",
    "mode": "materials",
    "exam": { "count": 20, "minutes": 45, "desc": "The syllabus says: 20 MCQs, 45 minutes, closed book." },
    "sourceNote": "",
    "storageKey": ""
  },
  "sources": { "1": "FIN2004 Week 1.pdf", "2": "FIN2004 Week 2.pdf" },
  "themes": { "t1": ["Foundations", "W1–3"], "t2": ["Valuation", "W4–7"], "t3": ["Financing", "W8–12"] },

  "seq":     [ { "t": "Capital budgeting steps", "w": 5, "i": ["Estimate cash flows", "Pick a discount rate", "Compute NPV", "Decide"] } ],
  "lists":   [ { "t": "Four Porter forces besides rivalry", "w": 2, "i": [["Buyers", "buyer"], ["Suppliers", "supplier"], ["New entrants", "entra|new"], ["Substitutes", "substitut"]] } ],
  "pairs":   [ ["NPV", "Present value of inflows minus outflows"], ["IRR", "Rate that makes NPV zero"] ],
  "nums":    [ ["Corporate tax rate used in examples", "21%", 8] ],
  "confuse": [ ["IRR vs NPV", "IRR is a rate, NPV is a dollar amount. When they conflict, NPV wins."] ],
  "threads": [ { "t": "Discount rates", "w": [3, 5, 9], "d": "Introduced as time value, used in NPV, then derived as WACC." } ],
  "flags":   [ { "w": "W6 p14, W7 p3", "s": "p14 gives beta as 1.2; p3 repeats the example with 1.3.", "f": "The worked answer uses 1.2." } ],

  "sorts": [ { "t": "Operating, investing or financing?", "w": 4, "cats": ["Operating", "Investing", "Financing"],
               "items": [["Buying a machine", 1], ["Paying a dividend", 2], ["Paying suppliers", 0]] } ],
  "trees": [ { "t": "Which valuation method?", "w": 6, "intro": "Pick a company and answer each question.", "start": "Q1",
               "nodes": { "Q1": ["Cash flows", "Are cash flows predictable?", "Q2", "MULT"], "Q2": ["Dividends", "Does it pay steady dividends?", "DDM", "DCF"] },
               "ends":  { "DDM": ["Dividend discount model", "good", ""], "DCF": ["Free cash flow DCF", "good", ""], "MULT": ["Multiples", "warn", "Use with care."] } } ],
  "calcs": [ { "t": "Present value", "w": 3, "intro": "One payment in the future.",
               "inputs": [ { "id": "fv", "label": "Future value", "type": "number", "value": 1000, "min": 0, "step": 10 },
                           { "id": "r", "label": "Rate", "unit": "%", "min": 0, "max": 20, "step": 0.5, "value": 8 },
                           { "id": "n", "label": "Years", "min": 1, "max": 40, "value": 10 } ],
               "out": "`PV = $${fmt(fv/Math.pow(1+r/100,n))}`", "note": "fmt(x, decimals) formats numbers." } ]
}
```

### meta

| Field | Required | Meaning |
|---|---|---|
| `title` | yes | Course name. |
| `unitName` | yes | What a unit is called: `Week`, `Lecture`, `Chapter`, `Topic`… Its first letter is used in refs. |
| `code` | no | Course code. It shows on the map root and in the header. |
| `subtitle` | no | One line under the map root. |
| `brand` | no | Name in the header. Default "Study Atlas". |
| `mode` | no | `materials` (default) or `topic`. Topic mode shows a "check against your syllabus" notice. |
| `exam` | no | `count` questions and `minutes` for the mock exam, plus `desc`, a sentence describing the real exam and where that comes from. |
| `sourceNote` | no | Custom text for the topic-mode notice. |
| `storageKey` | no | localStorage key. It defaults to one made from the code or title. Change it to give a rebuilt course a fresh progress slate. |

### Cross-unit material

`w` always means a unit number that exists. All of these are optional, and the app hides any tab or section that has no data.

- `seq`: items in their correct order, used for the ordering drill. Give at least 3 items.
- `lists`: for "name them all". Each item is `[label, regex]`, where the regex matches the typed answer case-insensitively, so keep it forgiving (`"stakeholder"`, `"govern|regulator"`). The regex must match its own label.
- `pairs`: used for the matching drill, which needs at least 6.
- `nums`: `[fact, value, unitNumber]`. `unitNumber` is the integer unit the fact comes from (for example `8`), not a unit of measure, so put measurement units in `value` (`"61.46 kg CO2/MMBtu"`). If a fact spans several units, use the first one. These are shown as the cheat-sheet "numbers to memorise" table with a cover/reveal button.
- `confuse`: `[title, explanation]`.
- `threads`: `{t, w:[units], d}`.
- `flags`: `{w: refs, s: what the source says, f: the fix or the clash}`.
- `sorts`: `items` are `[text, categoryIndex]`.
- `trees`: `nodes` are `id: [stage label, yes/no question, yesTarget, noTarget]`. A target is another node id or a key of `ends`. `ends` are `id: [result, tone, explanation]`, where tone is `good`, `warn` or `bad`.
- `calcs`: `inputs` are range sliders by default; use `"type":"number"` for a free number box. `out` is a JavaScript expression that uses the input ids as variables, plus `fmt(x, d)`, and returns a string. Keep `out` to arithmetic and template strings.

## units/NN.json

```json
{
  "n": 3,
  "th": "t1",
  "title": "Time value of money",
  "short": "Time value",
  "idea": "A dollar today is worth more than a dollar later, and every valuation in the course rests on that.",
  "sections": [
    { "h": "Present and future value", "b": "<p>Discounting turns a <b>future value</b> into a <b>present value</b>: PV = FV / (1 + r)<sup>n</sup>.</p><div data-widget='calc:0'></div>" }
  ],
  "traps": ["The slide's annuity formula assumes payments at the END of each year."],
  "map": [
    ["Discounting", "Bringing future cash back to today", [["PV formula", "FV / (1+r)^n"], ["Discount rate", "The opportunity cost of capital"]]],
    ["Annuities", "Equal payments for a fixed term", [["Ordinary annuity"], ["Annuity due", "Payments at the start"]]]
  ],
  "cards": [ ["What does discounting do?", "Converts a future amount into today's value using a rate."] ],
  "mcq":   [ ["$1,000 in 10 years at 8% is worth today about:", ["$463", "$500", "$926", "$2,159"], 0, "1000 / 1.08^10 = 463 (slide 12).", "W3 p12"] ],
  "hl":    [ ["The slide defines the discount rate as the…", ["Opportunity cost of capital", "Inflation rate", "Bank deposit rate", "Risk-free rate only"], "Bolded on p9: 'the opportunity cost of capital'.", "W3 p9"] ],
  "num":   [ ["What is the worked PV on slide 12?", ["$463", "$436", "$540", "$926"], "1000 / 1.08^10 = 463.", "W3 p12"] ]
}
```

| Field | Meaning |
|---|---|
| `n` | Unit number. Unique and an integer, and it matches the source file's unit. |
| `th` | Theme key from `course.json` `themes`. |
| `title`, `short` | Full title, and a short label of 32 characters or fewer for the map and lists. |
| `idea` | One sentence on why this unit matters. |
| `sections` | `{h, b}`. `b` is HTML; see writing-guide.md for the components. `<b>` marks key terms, and "Hide key terms" turns them into blanks. |
| `traps` | Exam traps: places students go wrong, slide quirks. |
| `map` | Mind-map branches: `[label, detail, [[leaf label, leaf detail], …]]`. Leaf detail is optional. |
| `cards` | `[question, answer]`. |
| `mcq` | `[stem, [4 options], answerIndex, why, ref]`. Put the correct answer first and use `0`. Note that this is the only shape with an index. |
| `hl` | `[stem, [4 options, correct first], why, ref]`, on emphasised text only. |
| `num` | `[stem, [4 options, correct first], why, ref]`, on numbers only. |

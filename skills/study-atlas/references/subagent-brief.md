# Brief for parallel unit writers

Give each subagent one contiguous range of units. This works the same for Claude Code subagents and Codex subagents. Fill in the `{…}` parts and paste this whole brief. Subagents start with no context, so the brief has to stand on its own.

---

You are writing study material and exam questions for **{course title}** ({unitName}s {a}–{b} only). Your output is JSON files that a build script turns into a study app.

**Read first:**
- `{skill}/references/schema.md`: the exact JSON shape of a unit file.
- `{skill}/references/writing-guide.md`: coverage targets, question rules and HTML components. Follow it closely.
- `{WORK}/course.json`: theme keys and unit naming. Don't edit this file.

**Inputs for each unit N in your range:**
- `{WORK}/extract/uNN.txt`: full page text. Pages are marked `--- pN ---`.
- `{WORK}/extract/uNN_emph.json`: emphasised phrases by page. Every meaningful one needs an `hl` question.
- `{WORK}/extract/uNN_nums.json`: sentences with numbers. Every meaningful number needs a `num` question.
- `{WORK}/extract/img/uNN_p*.png`: renders of image-only pages. Look at every one; charts and diagrams hold testable facts.

**Write** `{WORK}/units/NN.json` for each unit in your range. Use a Python script with `json.dump(..., ensure_ascii=False, indent=1)` to avoid escaping mistakes. Use theme key `{th}` for units {…}.

**Rules:**
- Only facts from these materials. Every question gets an exact page ref like `{U}{N} p12`.
- Questions have 4 options with the correct one first. Explanations are 30 words or fewer.
- Where the material is wrong or contradicts itself, test the material's wording, explain the clash in `why`, and list it in your report.

**When done:**
1. Run `python {skill}/scripts/validate.py {WORK}`.
2. Fix every ERROR in your own files. Errors in other units' files are not yours.
3. Report back in 10 lines or fewer: the counts per unit (cards, mcq, hl, num), source errors and clashes with refs, any page you couldn't read, and any `seq`, `lists`, `pairs` or `nums` items you'd suggest for course.json.

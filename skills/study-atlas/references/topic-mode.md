# Topic mode: building from a name only

Use this mode when the user gives a course or topic name, such as "make me a study atlas for Corporate Finance", and no materials.

## Scope it first

- Use the course code or university if the user gave one. If you can find that course's public syllabus, follow its unit list and order.
- Otherwise, build a standard introductory sequence for the topic: 8–12 units, the order a typical first course would teach. Tell the user the unit list in your hand-over so they can adjust it.
- Set `meta.mode` to `"topic"`, set `unitName` to `"Topic"` or `"Unit"`, and leave `sources` as `{}`.

## Research

- With a web search tool, read authoritative sources: university open courseware, standard-setter and regulator sites, encyclopaedic references, and well-known textbooks' public pages. Note the URL for each fact you use.
- Without web access, use only well-established textbook knowledge. Say so in `meta.sourceNote`, for example: "Written from general knowledge without your course materials or live sources. Check figures against your syllabus."
- Be extra careful with numbers. Prefer stable, well-known figures, and give the year for anything that changes, such as rates, thresholds and market sizes.

## What changes from materials mode

- **Refs:** leave `ref` as `""`. Put the source name in `why` instead, for example "(IFRS Foundation, 2023)". The validator accepts empty refs in topic mode.
- **`hl` set:** there is no source emphasis, so leave `hl` empty unless the user supplies materials later.
- **`num` set:** cover the field's key numbers: formulas' constants, landmark dates, standard thresholds and canonical worked examples.
- **`flags`:** use these for common misconceptions and places where sources disagree.

## Hand-over

Say plainly in the hand-over that this was built from public sources, not their course. Offer to rebuild from their own slides when they have them, since that version will match their exam far better.

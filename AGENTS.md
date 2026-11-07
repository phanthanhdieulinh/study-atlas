# Working on this repository

This repo is the **Study Atlas** agent skill. It runs in Claude (Claude Code and claude.ai) and in OpenAI Codex. The skill itself is in `skills/study-atlas/`. Everything else is packaging, docs and a demo.

## Layout

- `skills/study-atlas/SKILL.md`: the method the agent follows. Its frontmatter `name` and `description` are what Claude and Codex use to decide when to load the skill. Keep `name` lowercase-hyphenated and the description under 1024 characters.
- `skills/study-atlas/scripts/`: `extract.py`, `validate.py` and `build.py`. They need Python 3.9+ and `pymupdf`.
- `skills/study-atlas/assets/`: the app (`app.js`, `style.css`). It must stay course-agnostic, because all course content comes from JSON.
- `skills/study-atlas/references/`: the schema, writing guide, subagent brief and topic mode.
- `skills/study-atlas/agents/openai.yaml`: optional Codex/ChatGPT UI metadata.
- `.claude-plugin/`: the Claude Code plugin and marketplace manifests.
- `examples/demo-topic/`: a tiny course for testing the build.

## Before committing

```bash
python examples/demo-topic/make_demo.py
python skills/study-atlas/scripts/build.py examples/demo-topic /tmp/demo.html
```

- The build must pass. If you changed `assets/app.js`, open the HTML and click through every tab.
- Never commit course materials (PDF, PPTX, DOCX) or generated atlases, because they usually contain copyrighted content. `.gitignore` blocks the common cases.

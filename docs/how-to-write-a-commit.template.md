# How to Write a Commit (AI Agents)

Repositories using `@scottnath/devx` for semantic-release use [Gitmoji](https://gitmoji.dev) for commit messages. Follow these rules when writing commits.

## Format

```
<emoji> Short description

Optional body

Optional footer (e.g. issue refs: #123)
```

- Use the raw emoji character **or** the `:code:` shorthand — both are valid.
- Keep the subject line under ~50 characters when practical.
- Use imperative mood: "Add feature" not "Added feature".

## Emoji Reference

<!-- EMOJI_SECTION_START -->
This section is replaced by the extract script.
<!-- EMOJI_SECTION_END -->

## Examples

```
✨ Add legislator vote history endpoint

🐛 Fix null handling when bill actions are missing

💥 Remove deprecated getLegislators() export

⬆️ Bump typescript to 5.9.3

📝 Update README with setup instructions

🧪 Add coverage for congress-api error paths
```

## Reserved

Do not use `:bookmark:` manually — it is created by semantic-release for version tags.

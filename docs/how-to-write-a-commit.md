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
### Major

| Emoji | Code | Release type | When to use |
|-------|------|--------------|-------|
| 💥 | `:boom:` | **major** | Introduce breaking changes. |

### Minor

| Emoji | Code | Release type | When to use |
|-------|------|--------------|-------|
| ✨ | `:sparkles:` | **minor** | Introduce new features. |
| 🆕 | `:new:` | **minor** | New feature or capability |

### Patch

| Emoji | Code | Release type | When to use |
|-------|------|--------------|-------|
| 🎨 | `:art:` | **patch** | Improve structure / format of the code. |
| ⚡️ | `:zap:` | **patch** | Improve performance. |
| 🔥 | `:fire:` | **patch** | Remove code or files. |
| 🐛 | `:bug:` | **patch** | Fix a bug. |
| 📝 | `:memo:` | **patch** | Add or update documentation. |
| 🚀 | `:rocket:` | **patch** | Deploy stuff. |
| ✅ | `:white_check_mark:` | **patch** | Add, update, or pass tests. |
| 🚧 | `:construction:` | **patch** | Work in progress. |
| ♻️ | `:recycle:` | **patch** | Refactor code. |
| ➕ | `:heavy_plus_sign:` | **patch** | Add a dependency. |
| ➖ | `:heavy_minus_sign:` | **patch** | Remove a dependency. |
| 👽️ | `:alien:` | **patch** | Update code due to external API changes. |
| ♿️ | `:wheelchair:` | **patch** | Improve accessibility. |
| 🍻 | `:beers:` | **patch** | Write code drunkenly. |
| 🤡 | `:clown_face:` | **patch** | Mock things. |
| 🥚 | `:egg:` | **patch** | Add or update an easter egg. |
| ✈️ | `:airplane:` | **patch** | Improve offline support. |
| 🔧 | `:wrench:` | **patch** | Add or update configuration files. |
| 🚑️ | `:ambulance:` | **patch** | Critical hotfix. |
| 🔒️ | `:lock:` | **patch** | Fix security or privacy issues. |
| ⬆️ | `:arrow_up:` | **patch** | Upgrade dependencies. |

*Other gitmojis also trigger patch — this table shows common ones.*

### Reserved (do not use manually)

| Emoji | Code | Notes |
|-------|------|-------|
| 🔖 | `:bookmark:` | Created by semantic-release for version tags |
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

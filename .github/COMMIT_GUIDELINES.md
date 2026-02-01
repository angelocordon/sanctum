# Git Commit Guidelines

When creating commits for this repository, follow these rules:

## Core Rules

**Before committing, run `npm run lint` to ensure code quality.** For more details, see the [Copilot Instructions](.github/copilot-instructions.md#testing-changes).

1. **Do not commit an empty commit.** Do not make a commit without any changes.
2. **Short (72 chars or less) summary in imperative mood**
3. **Blank line separating summary from body**
4. **Body paragraphs wrapped at 72 characters**
5. **Write in imperative mood:** "Fix bug" not "Fixed bug" or "Fixes bug"
6. **Avoid listing file changes** - git shows that; focus on what and why
7. **Body sentences start with imperative verbs without subjects** (e.g., "Improves" not "This improves")
8. **Separate paragraphs with blank lines** when needed

## Subject Line Rule

A properly formed git commit subject line should complete this sentence:

```
If applied, this commit will [your subject line here]
```

## Examples

### Example 1: Add filter by date functionality

```
Add filter by date functionality

Implement --since, --today, --week, and --month flags for the log
command to allow filtering entries by date range.

Allows users to quickly view accomplishments from specific time
periods without manually searching through all entries.
```

### Example 2: Refactor into internal package structure

```
Refactor into internal package structure

Extract commands, models, and utilities from monolithic main.go
into a clean internal package structure following Go best
practices. Improves code organization, maintainability, and
separation of concerns.

The new structure makes it easier to test individual components,
add new commands, and maintain clear boundaries between different
parts of the application. Package naming uses domain-specific
terms (entries, models, commands) for better code readability.
```

## Tips

- Use the present tense and imperative voice for commit messages
- Explain *what* changed and *why*, not *how* it changed
- Keep the subject line focused on the main change
- Use the body to provide context and motivation for the change

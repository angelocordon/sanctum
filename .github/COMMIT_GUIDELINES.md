# Git Commit Guidelines

When creating commits for this repository, follow these rules:

## Core Rules

**Before committing, run `npm run lint` to ensure code quality.** For more details, see the [Copilot Instructions](.github/copilot-instructions.md#testing-changes).

1. **Do not commit an empty commit.** Do not make a commit without any changes.
2. **Short (72 chars or less) summary in imperative mood**
3. **Keep commit messages concise** - prefer shorter, focused messages over lengthy descriptions
4. **Blank line separating summary from body**
5. **Body paragraphs wrapped at 72 characters**
6. **Write in imperative mood:** "Fix bug" not "Fixed bug" or "Fixes bug"
7. **Avoid listing file changes** - git shows that; focus on what and why
8. **Body sentences start with imperative verbs without subjects** (e.g., "Improves" not "This improves")
9. **Separate paragraphs with blank lines** when needed

## Authorship Rules

When the coding agent (GitHub Copilot) makes changes through autonomous actions:

- **Author:** Set to `Copilot <copilot@github.com>`
- **Co-author:** Add the human collaborator using the `Co-authored-by:` trailer

Example:
```
Add click-and-drag rectangle drawing

Implement interactive rectangle creation by clicking and dragging.
Users can draw rectangles when Space is not pressed, with 6×6 inch
minimum size, centered dimension labels, and semi-transparent styling.

Co-authored-by: Human Name <human@example.com>
```

When the human makes changes directly, use standard git authorship.

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
```

### Example 2: Refactor into internal package structure

```
Refactor into internal package structure

Extract commands, models, and utilities from monolithic main.go
into a clean internal package structure following Go best
practices.
```

### Example 3: Agent-authored commit with co-author

```
Add click-and-drag rectangle drawing

Implement interactive rectangle creation by clicking and dragging.
Users can draw rectangles when Space is not pressed, with 6×6 inch
minimum size, centered dimension labels, and semi-transparent styling.

Co-authored-by: Angelo Cordon <angelo@example.com>
```

## Tips

- Use the present tense and imperative voice for commit messages
- Explain *what* changed and *why*, not *how* it changed
- Keep the subject line focused on the main change
- Use the body to provide context and motivation for the change

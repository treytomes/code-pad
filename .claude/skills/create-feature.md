# Create Feature

Start work on a new feature with proper GitHub issue workflow.

## Usage

```
/create-feature [feature-name] [description]
```

## Description

Creates a GitHub issue, sets up branch, and provides implementation guidance for a new feature.

## Steps

1. **Create GitHub issue**
```bash
gh issue create \
  --title "Add [feature-name]" \
  --body "## Description
[description]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Implementation Notes
- Technical details

## Testing
- Unit tests required
- E2E tests if user-facing" \
  --label "enhancement"
```

2. **Assign to appropriate milestone**
```bash
gh issue edit <issue-number> --milestone "v0.1.0 - Pre-Release"
```

3. **Create feature branch** (optional)
```bash
git checkout -b feature/<feature-name>
```

4. **Remind about patterns**
- Follow architecture decisions (.claude/memory/architecture-decisions.md)
- Follow code patterns (.claude/memory/patterns-to-follow.md)
- Avoid common pitfalls (.claude/memory/common-pitfalls.md)

5. **Testing reminder**
- Write tests first or immediately after
- Aim for 80%+ coverage on backend, 70%+ on components
- Test happy path, edge cases, and error handling

## Example

```bash
/create-feature "keyboard shortcuts" "Add Ctrl+B for bold text in editor"
```

Creates issue:
```
Title: Add keyboard shortcuts
Labels: enhancement
Milestone: v0.1.0 - Pre-Release

Body:
## Description
Add Ctrl+B for bold text in editor

## Acceptance Criteria
- [ ] Ctrl+B toggles bold formatting
- [ ] Works on selected text
- [ ] Shows in menu with shortcut hint
- [ ] Documented in wiki

## Implementation Notes
- Use Monaco editor commands API
- Add to application menu
- Update keyboard shortcuts documentation

## Testing
- Unit tests for shortcut handler
- E2E test for user workflow
```

## Workflow

1. Run `/create-feature`
2. Implement feature (reference issue number)
3. Write tests
4. Run `/test-suite` to verify
5. Commit with issue reference: `feat: Add feature (#XX)`
6. Close issue when complete

## Related

- GitHub Issue Workflow in CLAUDE.md
- PROJECT-PLAN.md for milestone planning
- /release-check before marking ready for release

# Create Feature

Start work on a new feature using spec-driven development workflow.

## Usage

```
/create-feature [feature-name] [description]
```

## Description

Creates a GitHub issue with complete specification, following spec-driven development principles:
1. Specification Phase (Issue with acceptance criteria)
2. Test-Driven Development (Write tests first)
3. Implementation Phase (Make tests pass)
4. Verification Phase (Ensure quality)

## Steps

### 1. **Create GitHub Issue with Spec**
```bash
gh issue create \
  --title "feat: [feature-name]" \
  --body "## User Story
As a [role], I want [feature] so that [benefit].

## Acceptance Criteria
- [ ] Testable criterion 1
- [ ] Testable criterion 2
- [ ] Testable criterion 3

## Edge Cases
- [ ] Handles null/undefined input
- [ ] Handles empty input
- [ ] Handles boundary values
- [ ] Handles error conditions

## API/Interface (if applicable)
\`\`\`typescript
interface NewFeature {
  method(param: Type): ReturnType;
}
\`\`\`

## UI Changes (if applicable)
- Button added to toolbar
- Modal displays settings form

## Implementation Notes
- Technical approach
- Dependencies
- Files to modify

## Testing Requirements
- Unit tests: 80%+ coverage
- E2E tests if user-facing
- Test edge cases and errors

## Related
- Depends on: #XX
- Blocks: #YY" \
  --label "enhancement"
```

### 2. **Assign to Milestone**
```bash
gh issue edit <issue-number> --milestone "v0.X.0"
```

### 3. **For Complex Features: Create Spec Document**
```bash
# Only for features taking >2 hours to implement
mkdir -p specs
cat > specs/feature-name.md << 'EOF'
# Feature Name

## Overview
Brief description and purpose.

## User Stories
1. As a [role], I want [feature] so that [benefit]

## Requirements
### Functional
- FR-1: System shall do X
- FR-2: User can do Y

### Non-Functional
- NFR-1: Performance requirement
- NFR-2: Security requirement

## API Design
\`\`\`typescript
interface Feature {
  method(param: Type): ReturnType;
}
\`\`\`

## Test Cases
| ID | Scenario | Input | Expected Output |
|----|----------|-------|-----------------|
| TC-1 | Happy path | Valid | Success |
| TC-2 | Error case | Invalid | Error |

## Implementation Plan
1. Step 1: Description
2. Step 2: Description

## Acceptance Criteria
- [ ] All test cases pass
- [ ] E2E tests written
- [ ] Documentation updated
- [ ] No regressions
EOF
```

### 4. **Write Tests First (TDD)**
```bash
# Create test file
cat > tests/unit/feature-name.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { FeatureName } from '../../src/feature-name';

describe('FeatureName', () => {
  it('should do expected thing', () => {
    const result = feature.method(input);
    expect(result).toBe(expected);
    // This WILL fail - that's the point!
  });
});
EOF

# Run tests (they should fail)
npm test -- feature-name.test.ts
```

### 5. **Implement Feature**
- Implement only what's in the spec
- Make tests pass one by one
- Don't add features not in spec

### 6. **Verify Quality**
- [ ] All tests pass
- [ ] Coverage meets thresholds
- [ ] Manual testing confirms UX
- [ ] Documentation updated
- [ ] No regressions

### 7. **Commit and Close**
```bash
git add -A
git commit -m "feat: Add feature-name (#XX)

Implements spec in issue #XX.

Changes:
- Change 1
- Change 2

Fixes #XX"

gh issue close XX --comment "Implemented in commit $(git rev-parse HEAD)"
```

### 8. **Reminders**
- Follow spec-driven workflow (.claude/memory/spec-driven-development.md)
- Follow architecture decisions (.claude/memory/architecture-decisions.md)
- Follow code patterns (.claude/memory/patterns-to-follow.md)
- Avoid common pitfalls (.claude/memory/common-pitfalls.md)

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

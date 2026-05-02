---
name: Spec-Driven Development
description: Specification-first development workflow to improve collaboration and reduce frustration
type: feedback
---

## Principle

**Write specifications BEFORE implementation code.**

Clear requirements before coding eliminates guesswork, improves collaboration, and reduces frustration.

## Why Spec-Driven Development?

- **Reduces frustration**: Clear requirements eliminate ambiguity
- **Improves collaboration**: Anyone can implement from a good spec
- **Prevents scope creep**: Spec is the contract
- **Catches edge cases early**: Thinking through specs reveals corner cases
- **Easier maintenance**: Specs explain "why" when code only shows "how"
- **Refactoring confidence**: Tests based on specs survive implementation changes

**How to apply**: For every feature or bug fix, create a spec (GitHub Issue or document) with acceptance criteria BEFORE writing code. Write tests that expect the behavior BEFORE implementing.

---

## Workflow

### 1. Specification Phase (FIRST!)

**a) Create GitHub Issue**
```bash
gh issue create --title "feat: Feature name" \
                --label enhancement \
                --milestone "v0.X.0"
```

**b) Write Specification**

Required sections in issue:
- **User Story**: As a [role], I want [feature] so that [benefit]
- **Acceptance Criteria**: Testable checklist
- **Edge Cases**: Null/empty inputs, boundaries, errors
- **API Contract**: TypeScript interfaces (if applicable)
- **UI Changes**: Mockups or descriptions (if applicable)

**c) For Complex Features: Create Spec Document**
```bash
# specs/feature-name.md
- Overview
- User Stories
- Requirements (Functional & Non-Functional)
- API/Interface Design
- UI/UX Design
- Test Cases (table format)
- Implementation Plan
- Acceptance Criteria
```

### 2. Test-Driven Development

**Write tests BEFORE implementing:**

```typescript
// Test that expects the behavior
test('should do expected thing', async () => {
  const result = await feature.execute(input);
  expect(result).toBe(expected);
  // This WILL fail initially - that's the point!
});
```

**TDD Cycle**:
1. **Red**: Write test that fails
2. **Green**: Write minimal code to make it pass
3. **Refactor**: Clean up while keeping tests green

### 3. Implementation Phase

Rules:
- ✅ Implement only what's in the spec
- ✅ Make tests pass one by one
- ✅ Refactor after tests pass
- ❌ Don't add features not in spec ("gold plating")
- ❌ Don't skip edge cases from spec

### 4. Verification Phase

Before closing issue:
- [ ] All automated tests pass
- [ ] Manual testing confirms UX
- [ ] Documentation updated (if user-facing)
- [ ] Code reviewed (against spec)
- [ ] No regressions (existing tests pass)

### 5. Completion

```bash
# Commit with issue reference
git commit -m "feat: Feature description (#42)

Implements spec in issue #42.

Changes:
- Change 1
- Change 2

Fixes #42"

# Close issue
gh issue close 42 --comment "Implemented in commit $(git rev-parse HEAD)"
```

---

## GitHub Issue Template

```markdown
## User Story
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
- Button added to X
- Modal displays Y
- Error message shows Z

## Related
- Depends on: #XX
- Blocks: #YY
- Related: #ZZ
```

---

## Feature Spec Document Template

For complex features, create `specs/feature-name.md`:

```markdown
# Feature Name

## Overview
Brief description and purpose.

## User Stories
1. As a [role], I want [feature] so that [benefit]
2. As a [role], I want [feature] so that [benefit]

## Requirements

### Functional Requirements
- FR-1: System shall do X
- FR-2: User can do Y

### Non-Functional Requirements
- NFR-1: Performance requirement
- NFR-2: Security requirement

## API/Interface Design
\`\`\`typescript
interface Feature {
  method(param: Type): ReturnType;
}
\`\`\`

## UI/UX Design
- Wireframes or descriptions
- User interaction flows
- Error states

## Test Cases
| ID | Scenario | Input | Expected Output |
|----|----------|-------|-----------------|
| TC-1 | Happy path | Valid | Success |
| TC-2 | Error case | Invalid | Error |

## Implementation Plan
1. Step 1: Description
2. Step 2: Description
3. Step 3: Description

## Acceptance Criteria
- [ ] All test cases pass
- [ ] E2E tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No regressions
```

---

## Real Example: Stop Button Feature

### Specification (Issue #32)
```markdown
## User Story
As a user, I want to stop long-running code immediately
so that I don't waste time waiting.

## Acceptance Criteria
- [ ] Stop button visible during execution
- [ ] Stop button replaces Run button (no confusion)
- [ ] Clicking Stop terminates process within 2 seconds
- [ ] Output shows partial results before stop
- [ ] Stop button disappears when execution completes

## API Contract
\`\`\`typescript
interface CodeExecutor {
  execute(code: string): Promise<ExecutionResult>;
  stop(): void; // New method
}
\`\`\`

## UI Changes
- Run button replaced by Stop button during execution
- Stop button is red (danger style) with stop icon
```

### Tests Written First
```typescript
test('should show Stop button during execution', async () => {
  await clickRun(window);
  await expect(window.locator('button:has-text("Stop")')).toBeVisible();
});

test('should terminate execution within 2 seconds', async () => {
  await clickRun(window);
  const startTime = Date.now();
  await clickStop(window);
  await waitForExecutionComplete(window, 2000);
  const elapsed = Date.now() - startTime;
  expect(elapsed).toBeLessThan(2000);
});
```

### Implementation
```typescript
// CSharpExecutor
private currentProcess: ChildProcess | null = null;

stop(): void {
  if (this.currentProcess) {
    this.currentProcess.kill('SIGTERM');
    setTimeout(() => {
      if (this.currentProcess && !this.currentProcess.killed) {
        this.currentProcess.kill('SIGKILL');
      }
    }, 2000);
  }
}

// App.tsx - UI
{!isRunning ? (
  <Button type="primary" onClick={handleRun}>Run Code</Button>
) : (
  <Button danger onClick={handleStop} icon={<StopOutlined />}>Stop</Button>
)}
```

### Result
- ✅ All tests pass
- ✅ Acceptance criteria met
- ✅ Issue closed with commit reference

---

## Benefits Observed

Based on implementing this workflow:

1. **Fewer bugs**: Edge cases caught in spec phase
2. **Better collaboration**: Clear specs enable independent work
3. **Less rework**: Implementation matches requirements first time
4. **Easier reviews**: Compare implementation to spec
5. **Living documentation**: Tests document expected behavior
6. **Confident refactoring**: Specs/tests survive code changes

---

## When to Skip Spec-First

Okay to skip formal spec for:
- Trivial typo fixes
- Obvious formatting changes
- Documentation updates (non-code)
- Emergency hotfixes (but add tests after!)

**Rule of thumb**: If it takes more than 30 minutes to implement, write a spec first.

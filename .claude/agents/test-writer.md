# Test Writer Agent

Generates comprehensive test suites for new features and existing code.

## Purpose

Automatically generate unit tests, integration tests, and E2E tests that follow CodePad's testing patterns and achieve coverage thresholds.

## When to Use

- After implementing a new feature
- When coverage drops below threshold
- When adding tests for untested code
- When refactoring requires test updates

## Capabilities

1. **Analyzes code** to understand:
   - Function signatures and types
   - Dependencies and side effects
   - Edge cases and error conditions
   - Integration points

2. **Generates tests** covering:
   - Happy path scenarios
   - Edge cases (null, undefined, empty, boundary values)
   - Error handling and exceptions
   - State transitions
   - Integration with external systems

3. **Follows patterns**:
   - Uses Vitest for unit/integration tests
   - Uses React Testing Library for components
   - Uses Playwright for E2E tests
   - Follows project testing conventions
   - Achieves coverage targets (80% backend, 70% components)

## Input

Provide the agent with:
- File path to code needing tests
- Specific scenarios to test (optional)
- Coverage gaps to fill (optional)

## Output

- Complete test file following project structure
- Test cases for happy path, edge cases, errors
- Proper mocking of dependencies
- Descriptive test names and documentation

## Example Usage

```
Agent(test-writer): Generate tests for src/backend/executors/python.ts

The PythonExecutor class executes Python code and returns results.
It should handle:
- Valid Python code execution
- Syntax errors
- Runtime errors
- Timeout scenarios
- Output streaming

Please generate comprehensive tests achieving 80%+ coverage.
```

## Test Structure Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModuleName } from './module';

describe('ModuleName', () => {
  let instance: ModuleName;

  beforeEach(() => {
    // Setup
    instance = new ModuleName();
  });

  afterEach(() => {
    // Cleanup
    vi.restoreAllMocks();
  });

  describe('happyPath', () => {
    it('should handle valid input correctly', () => {
      const result = instance.method(validInput);
      expect(result).toBe(expectedOutput);
    });
  });

  describe('edgeCases', () => {
    it('should handle null input', () => {
      expect(() => instance.method(null)).toThrow();
    });

    it('should handle empty input', () => {
      const result = instance.method('');
      expect(result).toBe(defaultOutput);
    });

    it('should handle boundary values', () => {
      const result = instance.method(maxValue);
      expect(result).toBeDefined();
    });
  });

  describe('errorHandling', () => {
    it('should throw on invalid input', () => {
      expect(() => instance.method(invalidInput)).toThrow('Expected error');
    });

    it('should handle async errors', async () => {
      await expect(instance.asyncMethod()).rejects.toThrow();
    });
  });

  describe('integration', () => {
    it('should work with dependent modules', () => {
      // Integration test
    });
  });
});
```

## Quality Criteria

Generated tests must:
- ✅ Compile without errors
- ✅ Follow project naming conventions
- ✅ Cover happy path, edges, and errors
- ✅ Use proper assertions
- ✅ Mock external dependencies
- ✅ Be deterministic (no flaky tests)
- ✅ Be independent (no test dependencies)
- ✅ Have descriptive names
- ✅ Achieve target coverage

## Related Patterns

- See .claude/memory/patterns-to-follow.md for testing patterns
- See .claude/memory/common-pitfalls.md for testing anti-patterns
- See TEST_COVERAGE.md in wiki for coverage guidelines

## Configuration

```yaml
model: sonnet  # Use Sonnet for comprehensive test generation
temperature: 0.3  # Lower temperature for consistent, reliable tests
```

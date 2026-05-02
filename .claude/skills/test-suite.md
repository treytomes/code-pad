# Test Suite

Run the complete test suite with coverage reporting.

## Usage

```
/test-suite
```

## Description

Executes all unit tests, integration tests, and E2E tests with coverage reports.

## Steps

1. **Run unit and integration tests with coverage**
```bash
npm test -- --coverage
```

2. **Display coverage summary**
```bash
cat coverage/coverage-summary.json | jq '.total'
```

3. **Run E2E tests** (if Playwright configured)
```bash
npm run test:e2e
```

4. **Check for test failures**
- Exit code 0 = all passed
- Non-zero = failures detected

## Coverage Thresholds

- Backend modules: ≥ 80%
- React components: ≥ 70%
- Utilities: ≥ 90%

## Output

- Test results summary
- Coverage percentages per file type
- List of files below threshold
- Total test count and duration

## Interpreting Results

**All tests passed, coverage met**:
```
✅ All tests passed (XX tests)
✅ Coverage thresholds met
   - Backend: XX%
   - Components: XX%
   - Utilities: XX%
```

**Some tests failed**:
```
❌ X tests failed
See output above for details
```

**Coverage below threshold**:
```
⚠️  Coverage below threshold:
   - src/backend/module.ts: XX% (need 80%)
   - src/renderer/Component.tsx: XX% (need 70%)
```

## Tips

- Run `/test-suite` before committing
- Run `/test-suite` before creating PR
- Add tests if coverage dropped
- Fix failing tests before proceeding

## Related

- TEST_COVERAGE.md in wiki for detailed coverage info
- TESTING-CHECKLIST.md for manual testing procedures

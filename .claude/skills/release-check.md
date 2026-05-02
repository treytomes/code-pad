# Release Check

Verify that the project is ready for release.

## Usage

```
/release-check
```

## Description

Runs a comprehensive check to ensure all requirements for releasing a new version are met.

## Steps

1. **Check for uncommitted changes**
```bash
git status --porcelain
```

2. **Run linter**
```bash
npm run lint
```

3. **Run all tests**
```bash
npm test
npm run test:e2e
```

4. **Check test coverage**
```bash
npm test -- --coverage
```

5. **Build project**
```bash
npm run build
```

6. **Check open issues in current milestone**
```bash
gh issue list --milestone "v0.1.0 - Pre-Release" --state open
```

7. **Verify CHANGELOG is up to date**
```bash
cat CHANGELOG.md | head -20
```

8. **Check package.json version**
```bash
cat package.json | grep version
```

## Success Criteria

- ✅ No uncommitted changes (or only intentional ones)
- ✅ No linting errors
- ✅ All tests passing
- ✅ Test coverage above thresholds (80% backend, 70% components)
- ✅ Build completes successfully
- ✅ No open issues in release milestone
- ✅ CHANGELOG updated with release notes
- ✅ Version number incremented appropriately

## Output

Provides a checklist-style report:
- ✅ Item passed
- ❌ Item failed (with details)
- ⚠️  Item needs attention

## Related

- See TESTING-CHECKLIST.md in wiki for manual testing steps
- See PROJECT-PLAN.md for release requirements

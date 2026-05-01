# Contributing to CodePad

Thank you for considering contributing to CodePad! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project follows a simple code of conduct: be respectful, constructive, and collaborative. We're all here to build something useful together.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report:
1. Check the [existing issues](https://github.com/treytomes/code-pad/issues) to avoid duplicates
2. Try the latest version to see if the issue is already fixed
3. Check [TESTING-CHECKLIST.md](TESTING-CHECKLIST.md) to verify expected behavior

When creating a bug report, use the bug report template and include:
- Clear steps to reproduce
- Expected vs actual behavior
- Your environment (OS, CodePad version, .NET version)
- Relevant code samples and logs

### Suggesting Features

Feature requests are welcome! Use the feature request template and:
- Clearly describe the problem you're trying to solve
- Explain why existing features don't address it
- Provide examples or mockups if possible
- Consider implementation complexity

### Pull Requests

#### Before Starting
1. Check existing issues and PRs to avoid duplicate work
2. For major changes, open an issue first to discuss the approach
3. Make sure you can build and test the project locally

#### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/code-pad.git
cd code-pad

# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Run tests
npm test

# Run linter
npm run lint

# Type check
npm run typecheck
```

#### Code Guidelines

**TypeScript**:
- Use TypeScript for all new code
- Avoid `any` types; use specific types or `unknown`
- Follow existing code style (enforced by ESLint/Prettier)

**React Components**:
- Use functional components with hooks
- Keep components focused and single-purpose
- Use meaningful prop and state names
- Add comments for complex logic, not obvious code

**Testing**:
- Write unit tests for new features (Vitest)
- Maintain >80% test coverage
- Test edge cases and error conditions
- Update TESTING-CHECKLIST.md for manual test scenarios

**Commits**:
- Use conventional commit format: `type: description`
  - `feat:` new features
  - `fix:` bug fixes
  - `docs:` documentation changes
  - `test:` test additions/changes
  - `refactor:` code refactoring
  - `chore:` maintenance tasks
- Keep commits focused and atomic
- Write clear, descriptive commit messages

**Code Style**:
- Run `npm run format` before committing
- ESLint and Prettier are configured
- Use Husky pre-commit hooks (automatically installed)

#### Pull Request Process

1. **Fork and Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**:
   - Follow code guidelines
   - Add/update tests
   - Update documentation

3. **Test Thoroughly**:
   ```bash
   npm test              # Unit tests
   npm run lint          # Linting
   npm run typecheck     # Type checking
   npm run build         # Production build
   ```

4. **Commit and Push**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**:
   - Use the PR template
   - Link related issues
   - Describe what changed and why
   - Include screenshots for UI changes
   - Request review from maintainers

6. **Address Feedback**:
   - Respond to review comments
   - Make requested changes
   - Push updates to the same branch

#### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Self-reviewed my own code
- [ ] Commented complex/non-obvious code
- [ ] Updated documentation (README, CHANGELOG, etc.)
- [ ] Added tests for new functionality
- [ ] All tests pass locally
- [ ] No new linting errors
- [ ] Tested on relevant platforms (Windows/macOS/Linux)

## Project Structure

```
code-pad/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React UI components
│   ├── backend/        # Business logic (executors, formatters, etc.)
│   ├── shared/         # Shared utilities (logger, types)
│   └── preload/        # Electron preload script (IPC bridge)
├── tests/
│   ├── unit/           # Unit tests
│   └── e2e/            # End-to-end tests
├── assets/             # Icons, images
└── .github/            # CI/CD workflows
```

## Development Workflow

### Running Locally
```bash
npm run dev              # Start Vite dev server (renderer only)
npm run electron:dev     # Build and run Electron app
npm run logs             # View application logs
```

### Building for Production
```bash
npm run build            # Build main and renderer
npm run electron:build   # Package for current platform
npm run build:prod       # Clean, build, and package
```

### Testing
```bash
npm test                 # Run unit tests (watch mode)
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run E2E tests
npm run test:all         # Run all tests
```

## Architecture Overview

**Main Process** (`src/main/`):
- Electron main process
- IPC handlers
- Database operations
- Code execution management
- Menu system

**Renderer Process** (`src/renderer/`):
- React application
- UI components
- State management
- User interactions

**Backend** (`src/backend/`):
- Code executors (C#, future: Python, JS)
- Output formatters (JSON, tables)
- Database schema and migrations
- Import/export logic

**Preload Script** (`src/preload/`):
- Context bridge for IPC
- Exposes safe API to renderer

## Areas Needing Help

We'd especially welcome contributions in these areas:

### Phase 2 Features (See PROJECT-PLAN.md)
- NuGet package support
- Python language support
- Database connectivity
- Git integration for snippets
- Light theme

### Documentation
- Video tutorials
- User guides
- API documentation
- More code examples

### Testing
- E2E test scenarios
- Cross-platform testing
- Performance testing

### Infrastructure
- macOS code signing
- Windows code signing
- Auto-update mechanism
- Crash reporting

## Questions?

- Open an issue for questions
- Check [README.md](README.md) for basic info
- Review [PROJECT-PLAN.md](PROJECT-PLAN.md) for roadmap
- See [TESTING-CHECKLIST.md](TESTING-CHECKLIST.md) for testing

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- Git commit history (use Co-Authored-By for pair programming)
- Release notes
- Project documentation

Thank you for contributing to CodePad! 🎉

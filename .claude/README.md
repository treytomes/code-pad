# Claude Code Project Configuration

This folder contains project-specific configuration for Claude Code, enhancing AI-assisted development on the CodePad project.

## Overview

The `.claude` folder enables:
- **Persistent memory** across Claude Code sessions
- **Custom skills** (slash commands) for common workflows
- **Specialized agents** for specific tasks

All Claude Code instances working on this project share this configuration, ensuring consistent context and capabilities.

## Structure

```
.claude/
├── README.md                           # This file
├── memory/                             # Project memory (shared context)
│   ├── architecture-decisions.md      # Key architectural choices
│   ├── patterns-to-follow.md          # Code patterns and conventions
│   └── common-pitfalls.md             # Known issues and gotchas
├── skills/                             # Custom slash commands
│   ├── release-check.md               # /release-check
│   ├── test-suite.md                  # /test-suite
│   └── create-feature.md              # /create-feature
└── agents/                             # Specialized AI agents
    ├── test-writer.md                 # Generate comprehensive tests
    ├── code-reviewer.md               # Perform code reviews
    └── documentation-writer.md        # Create wiki documentation
```

## Memory Files

Memory files provide persistent context about the project that Claude Code instances can reference.

### architecture-decisions.md
Documents key architectural decisions and their rationale:
- Technology stack choices
- Module system design
- Execution strategies
- State management approaches
- Security considerations

### patterns-to-follow.md
Established code patterns and conventions:
- Naming conventions
- File organization
- Component structure
- Error handling patterns
- Testing patterns
- Performance patterns

### common-pitfalls.md
Known issues and anti-patterns to avoid:
- Build issues (better-sqlite3, Electron in WSL)
- TypeScript pitfalls
- React anti-patterns
- IPC gotchas
- Database issues
- Testing mistakes

## Skills (Slash Commands)

Custom workflow commands invoked with `/skill-name`.

### /release-check
Comprehensive pre-release verification:
- Checks for uncommitted changes
- Runs linter and tests
- Verifies test coverage
- Checks milestone issues
- Validates CHANGELOG and version

**Usage**: `/release-check`

### /test-suite
Runs complete test suite with coverage:
- Unit and integration tests
- E2E tests (if available)
- Coverage reporting
- Threshold validation

**Usage**: `/test-suite`

### /create-feature
Initiates new feature development:
- Creates GitHub issue
- Sets up branch (optional)
- Provides implementation checklist
- Reminds about testing requirements

**Usage**: `/create-feature [name] [description]`

## Agents

Specialized AI agents for specific tasks. Spawn with `Agent(agent-name, prompt)`.

### test-writer
Generates comprehensive test suites:
- Analyzes code structure
- Creates unit, integration, and E2E tests
- Follows project testing patterns
- Achieves coverage targets (80% backend, 70% components)
- Includes edge cases and error scenarios

**When to use**:
- After implementing features
- When coverage drops
- When refactoring code

**Example**:
```
Agent(test-writer): Generate tests for src/backend/executors/python.ts
covering valid execution, errors, timeouts, and output streaming.
```

### code-reviewer
Performs thorough code reviews:
- Checks code quality and patterns
- Validates security and performance
- Ensures test coverage
- Verifies documentation
- Provides structured feedback (critical/suggestions/nitpicks/praise)

**When to use**:
- Before committing significant changes
- Before creating pull requests
- When reviewing contributor PRs

**Example**:
```
Agent(code-reviewer): Review changes in PR #45 focusing on
security implications of the new Python executor.
```

### documentation-writer
Creates wiki documentation:
- Feature documentation for users
- API documentation for developers
- Setup and troubleshooting guides
- Architecture documentation
- Follows project style guidelines

**When to use**:
- After implementing features
- When adding public APIs
- When creating guides
- When updating architecture

**Example**:
```
Agent(documentation-writer): Create wiki page for the new Python
execution feature, including setup, usage examples, and troubleshooting.
```

## How to Use

### Using Memory
Memory files are automatically loaded into Claude Code's context. Just reference them:
```
"Check the architecture-decisions memory for context on why we use dotnet build"
"Follow the patterns in patterns-to-follow.md"
"Avoid the pitfall mentioned in common-pitfalls.md about CS1109"
```

### Using Skills
Invoke with slash command in Claude Code:
```
/release-check
/test-suite
/create-feature "keyboard shortcuts" "Add Ctrl+B for bold"
```

### Using Agents
Spawn agents with specific prompts:
```
Agent(test-writer): Generate tests for src/backend/new-module.ts

Agent(code-reviewer): Review the changes in this commit for
security issues and pattern consistency.

Agent(documentation-writer): Create a wiki page documenting
the .Dump() extension method with examples.
```

## Maintenance

### Updating Memory
When you make significant architectural decisions or establish new patterns:
1. Update relevant memory file
2. Add date and brief description of change
3. Commit with descriptive message

### Adding Skills
To add a new skill:
1. Create `skills/new-skill.md`
2. Follow existing skill format
3. Document usage, steps, and output
4. Update this README

### Adding Agents
To add a new agent:
1. Create `agents/new-agent.md`
2. Define purpose, capabilities, and templates
3. Specify quality criteria
4. Update this README

### Best Practices
- Keep memory files concise and focused
- Update memory when patterns change
- Skills should be reusable workflows
- Agents should be specialized and focused
- Document changes in commit messages

## Benefits

**For AI Assistants (Claude)**:
- Consistent context across sessions
- Access to project-specific knowledge
- Specialized capabilities for common tasks
- Better understanding of patterns and decisions

**For Developers**:
- Faster onboarding (memory captures context)
- Consistent code patterns
- Automated workflows (skills)
- High-quality generated code (agents)
- Better collaboration (shared context)

## Related

- **CLAUDE.md** (root): AI assistant guidelines for this project
- **GitHub Wiki**: https://github.com/treytomes/code-pad/wiki
- **Project Board**: https://github.com/users/treytomes/projects/2

---

**Created**: 2026-05-02  
**Last Updated**: 2026-05-02  
**Maintained By**: CodePad Team

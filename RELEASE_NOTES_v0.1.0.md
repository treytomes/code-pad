# CodePad v0.1.0 - Pre-Release

**Release Date**: May 2, 2026

We're excited to announce the first pre-release of **CodePad** - a cross-platform code scratchpad inspired by LINQPad for rapid C# prototyping and experimentation!

## 🎉 What is CodePad?

CodePad is a lightweight desktop application that lets you write, execute, and visualize C# code instantly without creating projects or managing build configurations. Perfect for:

- **Quick prototyping** - Test ideas in seconds
- **Learning C#** - Experiment with language features
- **Code snippets** - Build a personal library of reusable code
- **Data exploration** - Use `.Dump()` to visualize objects

## ✨ Headline Features

### 1. LINQPad-style .Dump() Extension

The killer feature - automatically format any object as beautiful JSON output:

```csharp
var person = new { Name = "Alice", Age = 30, City = "Seattle" };
person.Dump("Person Details");

var users = new[] { new { Id = 1, Name = "Bob" }, new { Id = 2, Name = "Carol" } };
users.Dump("User List");
```

`.Dump()` works with:
- Anonymous objects
- Arrays and collections
- Complex nested structures
- Primitive values
- Custom classes

Method chaining supported for LINQ pipelines!

### 2. Built-in Samples

Learn by example with 12 categorized samples:
- **Getting Started** - Hello World, variables, LINQ basics
- **.Dump() Extension** - Object inspection, arrays, method chaining
- **Long-Running Tasks** - Thread.Sleep, async operations
- **Output Formats** - Tables, markdown, complex objects

### 3. Execution Control

- **Configurable timeout** - Set limits or disable for indefinite execution
- **Stop button** - Cancel long-running code immediately
- **Real-time output** - Streaming results as code executes
- **Live timing** - Millisecond counter during execution

### 4. Smart Window Management

- **Persistent state** - Window size, position, and maximized state remembered
- **Multi-display safe** - Automatically repositions if displays change
- **Resizable panels** - Sidebar and output heights saved

### 5. Snippet Library

Organize and access your code:
- Save unlimited snippets
- Star favorites for quick access
- Recently opened tracking (last 5)
- Search by name
- Import/Export for sharing
- Unsaved changes tracking with warnings

## 🔧 Technical Highlights

- **No external tools required** - Uses `dotnet build` (part of .NET SDK)
- **Monaco Editor** - Same editor as VS Code with IntelliSense
- **SQLite storage** - Fast, reliable snippet persistence
- **Cross-platform** - Windows, macOS, Linux
- **Automated E2E tests** - Playwright + Electron testing
- **CI/CD pipeline** - GitHub Actions for quality assurance

## 📋 System Requirements

- **.NET SDK 8.0 or later** - [Download here](https://dotnet.microsoft.com/download)
- **Windows 10+** / **macOS 10.15+** / **Linux** (modern distro)

## 🚀 Getting Started

1. Download the installer for your platform from [Releases](https://github.com/treytomes/code-pad/releases/tag/v0.1.0)
2. Install .NET SDK 8.0+ if not already installed
3. Run CodePad
4. Try the samples (click Samples tab)
5. Press F5 to execute code

## 📸 Screenshots

![CodePad Main Interface](docs/images/screenshot-1.png)

## ⚠️ Known Limitations

This is a pre-release focused on C# execution:

- **C# only** - Python/JavaScript coming in Phase 2
- **No NuGet packages** - External dependencies not yet supported
- **Dark theme only** - Light theme in Phase 2
- **Single snippet at a time** - Tabs coming in Phase 2

## 🐛 Bug Reports & Feedback

Found a bug or have a suggestion?
- [Open an issue](https://github.com/treytomes/code-pad/issues/new)
- [View project board](https://github.com/users/treytomes/projects/2)

## 🙏 Acknowledgments

Inspired by [LINQPad](https://www.linqpad.net/) by Joseph Albahari - the gold standard for .NET scratchpads.

Built with:
- Electron 30
- React 19
- Monaco Editor
- TypeScript 6
- Ant Design

Special thanks to the open-source community and early testers!

## 📅 What's Next (Phase 2)

- NuGet package support
- Multi-language support (Python, JavaScript)
- Light theme
- Multiple tabs
- Database connectivity
- Enhanced output visualization

---

**Download CodePad v0.1.0**: [Releases Page](https://github.com/treytomes/code-pad/releases/tag/v0.1.0)

**Documentation**: [GitHub Wiki](https://github.com/treytomes/code-pad/wiki)

**Source Code**: [GitHub Repository](https://github.com/treytomes/code-pad)

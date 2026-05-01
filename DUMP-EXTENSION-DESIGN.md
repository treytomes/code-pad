# .Dump() Extension Method Design

## Overview
Implement a LINQPad-style `.Dump()` extension method that automatically serializes objects to JSON for rich visualization in CodePad's output display.

## Goals
1. **Convenience**: `myObject.Dump()` instead of `Console.WriteLine(JsonSerializer.Serialize(...))`
2. **Optional Labels**: `myObject.Dump("User Info")` to add section headers
3. **Automatic Spacing**: Insert blank lines between dumps for section separation
4. **Type Detection**: Smart handling of different types (primitives, collections, objects)

## Usage Examples

### Basic Usage
```csharp
var person = new { Name = "John", Age = 30 };
person.Dump(); // → JSON tree view

var users = new[] { new { Id = 1, Name = "Alice" }, new { Id = 2, Name = "Bob" } };
users.Dump(); // → JSON array tree view
```

### With Labels
```csharp
person.Dump("Person Details"); // → Header + JSON tree view
users.Dump("User List");       // → Header + JSON array tree view
```

### Multiple Dumps
```csharp
// Each automatically separated with blank lines
var config = new { Theme = "Dark", FontSize = 14 };
config.Dump("Settings");

var data = GetUsers();
data.Dump("Active Users");

var stats = new { Total = 100, Active = 75 };
stats.Dump("Statistics");
```

### Chaining Support
```csharp
// Return the value for chaining
var result = GetData()
    .Dump("Raw Data")
    .Where(x => x.Active)
    .Dump("Filtered Data")
    .ToList();
```

## Implementation Approach

### Option 1: Built-in Extension Class (Recommended)
**Pros:**
- No imports needed, always available
- Pre-compiled, no runtime overhead
- Can be versioned with CodePad
- Easy to maintain

**Cons:**
- Need to inject into C# scripts automatically
- Requires special handling during compilation

**How it works:**
```csharp
// CodePad auto-injects this at the top of every script:
#region CodePad Extensions (Auto-injected)
public static class DumpExtensions
{
    private static int _dumpCount = 0;
    
    public static T Dump<T>(this T obj, string label = null)
    {
        // Add blank line separator (except first dump)
        if (_dumpCount++ > 0)
        {
            Console.WriteLine();
        }
        
        // Output label if provided
        if (!string.IsNullOrEmpty(label))
        {
            Console.WriteLine($"=== {label} ===");
        }
        
        // Serialize to JSON
        var json = System.Text.Json.JsonSerializer.Serialize(obj, new System.Text.Json.JsonSerializerOptions 
        { 
            WriteIndented = true,
            ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
        });
        
        Console.WriteLine(json);
        
        return obj; // Enable chaining
    }
    
    public static T Dump<T>(this T obj, string label, int maxDepth)
    {
        // Support depth limiting for deep object graphs
        // ...
    }
}
#endregion
```

### Option 2: NuGet Package
**Pros:**
- Standard .NET distribution
- Can be used outside CodePad
- Easy version updates

**Cons:**
- Requires NuGet support (Phase 2 feature)
- User must reference it: `#r "nuget: CodePad.Extensions"`
- Not available until NuGet support is implemented

**How it works:**
```csharp
#r "nuget: CodePad.Extensions, 0.1.0"
using CodePad;

myObject.Dump("Result");
```

### Option 3: Script Template with Extensions
**Pros:**
- Visible to user, can be customized
- No magic injection
- Easy to understand

**Cons:**
- Clutters the editor with boilerplate
- User might accidentally delete it
- Not as clean as LINQPad

**How it works:**
```csharp
// User sees this at the top of new snippets:
using System;
using System.Text.Json;

public static class Extensions {
    public static T Dump<T>(this T obj, string label = null) { /* ... */ }
}

// User code below
var data = new { Name = "Test" };
data.Dump();
```

## Recommended Implementation: Option 1 (Auto-Injection)

### Phase 1: Simple Implementation
1. **Inject Extension Class**: Prepend every C# script with the DumpExtensions class
2. **Basic JSON Serialization**: Use System.Text.Json with WriteIndented
3. **Blank Line Separation**: Track dump count, add `Console.WriteLine()` between dumps
4. **Optional Labels**: Output label as plain text header before JSON

### Phase 2: Enhanced Features
1. **Depth Limiting**: `obj.Dump("Deep Object", maxDepth: 3)`
2. **Custom Formatters**: `obj.Dump(format: DumpFormat.Table)` for collections
3. **Dump Options**: `obj.Dump(new DumpOptions { ShowTypes = true, MaxItems = 50 })`
4. **HTML Output**: `obj.DumpHtml()` for custom HTML rendering

## Technical Considerations

### Injection Strategy
Modify `CSharpExecutor` to inject the extension class before compilation:

```typescript
// src/backend/executors/csharp.ts
private injectDumpExtensions(code: string): string {
  const dumpExtensions = `
#region CodePad Extensions
using System;
using System.Text.Json;
using System.Text.Json.Serialization;

public static class DumpExtensions
{
    private static int _dumpCount = 0;
    
    public static T Dump<T>(this T obj, string label = null)
    {
        if (_dumpCount++ > 0)
        {
            Console.WriteLine();
        }
        
        if (!string.IsNullOrEmpty(label))
        {
            Console.WriteLine($"=== {label} ===");
        }
        
        var json = JsonSerializer.Serialize(obj, new JsonSerializerOptions 
        { 
            WriteIndented = true,
            ReferenceHandler = ReferenceHandler.IgnoreCycles
        });
        
        Console.WriteLine(json);
        return obj;
    }
}
#endregion

`;

  // Inject after using statements, before first executable line
  return this.insertAfterUsings(code, dumpExtensions);
}
```

### Label Rendering
Labels should render as plain text sections, separate from the JSON output:

**Output:**
```
=== Person Details ===
{
  "Name": "John",
  "Age": 30
}

=== User List ===
[
  { "Id": 1, "Name": "Alice" },
  { "Id": 2, "Name": "Bob" }
]
```

**Parsing:** The output formatter detects:
1. Plain text label line (starts with `===`)
2. Blank line
3. JSON content
4. Blank line (separator)

### Circular Reference Handling
Use `ReferenceHandler.IgnoreCycles` to prevent infinite loops on circular references:

```csharp
var options = new JsonSerializerOptions 
{ 
    ReferenceHandler = ReferenceHandler.IgnoreCycles 
};
```

### Performance Considerations
- Static `_dumpCount` is fine for single-execution context
- Reset count at start of each execution (inject reset code)
- Consider max object size limits to prevent memory issues

## UI Enhancements

### Label Display
Update `OutputDisplay` to detect and render labels differently:
- Labels: Bold text, slightly larger, accent color
- Content: Normal JSON/table rendering below label

### Section Dividers
Already implemented! Blank lines create section dividers with visual separation.

### Collapsible Sections (Future)
Make each `.Dump()` output collapsible by label:
```
▼ Person Details
  { ... JSON tree view ... }
  
▼ User List  
  [ ... JSON tree view ... ]
```

## Example Output

### Input Code:
```csharp
var settings = new { Theme = "Dark", FontSize = 14, AutoSave = true };
settings.Dump("Application Settings");

var users = new[] {
    new { Id = 1, Name = "Alice", Role = "Admin" },
    new { Id = 2, Name = "Bob", Role = "Developer" }
};
users.Dump("Active Users");

var stats = new { TotalUsers = 2, AdminCount = 1, LastLogin = DateTime.Now };
stats.Dump("Statistics");
```

### Output Visualization:
```
=== Application Settings ===
{
  "Theme": "Dark",
  "FontSize": 14,
  "AutoSave": true
}

=== Active Users ===
[
  {
    "Id": 1,
    "Name": "Alice",
    "Role": "Admin"
  },
  {
    "Id": 2,
    "Name": "Bob",
    "Role": "Developer"
  }
]

=== Statistics ===
{
  "TotalUsers": 2,
  "AdminCount": 1,
  "LastLogin": "2026-05-01T23:15:42.123Z"
}
```

Each section would render with:
- Label as plain text (styled)
- JSON as collapsible tree view
- Visual divider between sections

## Migration Path

### Phase 1 (v0.2.0):
- Auto-inject DumpExtensions class
- Basic .Dump() and .Dump(label)
- Automatic blank line separation
- Update default snippet to demonstrate .Dump()

### Phase 2 (v0.3.0):
- Enhanced label rendering (styled headers)
- Collapsible sections by label
- Depth limiting options
- Custom serialization options

### Phase 3 (v0.4.0):
- NuGet package: CodePad.Extensions
- DumpHtml() for custom HTML
- DumpTable() to force table view
- Dump configuration in settings

## Questions to Consider

1. **Should labels always create a separate text section?**
   - Yes - makes parsing easier and allows styled headers

2. **Should .Dump() return the object for chaining?**
   - Yes - matches LINQPad behavior

3. **How to handle very large objects?**
   - Add MaxDepth option (default: 10)
   - Truncate large collections (default: first 100 items)
   - Show "... N more items" indicator

4. **Should we support .Dump() on primitives?**
   - Yes, but format nicely: `42.Dump("Answer")` → `=== Answer ===\n42`

5. **How to handle exceptions during serialization?**
   - Catch JsonException and output plain text: `[Dump Error: {exception.Message}]`

## User-Defined Extensions (Phase 2+)

### Design Consideration: Extension Scripts
Allow users to create and import their own extension methods alongside the built-in ones.

**User Experience:**
```csharp
// User creates a saved extension script in CodePad
// File: MyExtensions.csx (stored in user's extensions folder)

public static class MyExtensions
{
    public static T Log<T>(this T obj, string prefix = "")
    {
        Console.WriteLine($"{prefix}: {obj}");
        return obj;
    }
    
    public static IEnumerable<T> DumpTable<T>(this IEnumerable<T> items)
    {
        // Custom table formatter
        return items;
    }
}
```

**Usage in Snippets:**
```csharp
#load "MyExtensions.csx"  // Load user extension

var data = GetData()
    .Log("Raw")           // User's extension
    .Where(x => x.Active)
    .Dump("Filtered")     // Built-in extension
    .DumpTable();         // User's custom table formatter
```

**Implementation Strategy:**
1. **Extensions Folder**: `~/.codepad/extensions/` for user scripts
2. **Extension Manager UI**: List, create, edit, delete extension scripts
3. **Auto-Load Option**: Setting to auto-load specific extensions
4. **Compilation**: Load and compile extension scripts before user code
5. **Namespace Isolation**: Each extension in its own region, avoid conflicts

**Settings UI:**
- Enable/disable auto-load per extension
- Edit extensions in-app (like snippets)
- Import/export extension scripts
- Extension templates (starter code)

**Injection Order:**
```
1. Built-in DumpExtensions (always first)
2. User extensions (loaded via #load or auto-load)
3. User's snippet code
```

**Phase 2 Features:**
- Extension management UI
- `#load` directive support
- Auto-load setting per extension
- Extension import/export

**Phase 3 Features:**
- Extension marketplace/sharing
- Version control for extensions
- Extension dependencies
- Hot-reload extensions without restart

**Technical Notes:**
- Extensions compile once per session, cached for performance
- Use C# Script (.csx) format for extensions
- Support Roslyn scripting directives (#r, #load)
- Validate extensions don't conflict with built-ins

## Next Steps

1. Implement `injectDumpExtensions()` in CSharpExecutor
2. Update default snippet to use .Dump() instead of JsonSerializer
3. Add tests for dump extension injection
4. Update RICH-OUTPUT-TESTING.md with .Dump() examples
5. Consider label parsing and styled rendering (Phase 2)
6. Design extension folder structure and management UI (Phase 2)

# Rich Output Testing Guide

## Overview
CodePad now includes rich output visualization that automatically detects and formats:
- **JSON**: Tree view with collapsible nodes
- **Tables**: Grid rendering with headers and pagination
- **HTML**: Basic HTML rendering
- **Plain text**: Fallback for simple output

## Testing Rich Output

### 1. JSON Output

Run this code to test JSON tree view:

```csharp
using System;
using System.Text.Json;

var person = new {
    Name = "John Doe",
    Age = 30,
    Email = "john@example.com",
    Address = new {
        Street = "123 Main St",
        City = "Springfield",
        Zip = "12345"
    },
    Skills = new[] { "C#", "JavaScript", "Python" }
};

Console.WriteLine(JsonSerializer.Serialize(person, new JsonSerializerOptions { WriteIndented = true }));
```

**Expected**: Collapsible tree view with:
- Blue/cyan colors for object/array types
- Green for numbers
- Orange for strings
- Type indicators (Object{5}, Array[3])

### 2. Table Output

Run this code to test table rendering:

```csharp
using System;

Console.WriteLine("| ID | Name  | Role       |");
Console.WriteLine("|----|-------|------------|");
Console.WriteLine("| 1  | Alice | Admin      |");
Console.WriteLine("| 2  | Bob   | Developer  |");
Console.WriteLine("| 3  | Carol | Designer   |");
```

**Expected**: Ant Design table with:
- Column headers
- Sortable columns
- Proper cell alignment
- Pagination if >20 rows

### 3. Array Output

Run this code to test array formatting:

```csharp
using System;
using System.Text.Json;

var users = new[] {
    new { Id = 1, Name = "Alice", Role = "Admin" },
    new { Id = 2, Name = "Bob", Role = "Developer" },
    new { Id = 3, Name = "Carol", Role = "Designer" }
};

Console.WriteLine(JsonSerializer.Serialize(users, new JsonSerializerOptions { WriteIndented = true }));
```

**Expected**: Tree view showing:
- Array[3] at root
- Each item expandable
- Object properties visible

### 4. Plain Text (Fallback)

Run this code:

```csharp
using System;

Console.WriteLine("Hello, World!");
Console.WriteLine("This is plain text output.");
Console.WriteLine("No special formatting needed.");
```

**Expected**: Plain monospace text, left-aligned

## Troubleshooting

### Rich Output Not Showing

**Problem**: Output still appears as plain text

**Solutions**:
1. **Rebuild the app** from Windows CMD:
   ```cmd
   npm run build
   npm run electron:dev
   ```

2. **Check output format**: Ensure JSON is properly formatted:
   - Must start with `{` or `[`
   - Must be valid JSON (use `JsonSerializer`)
   - Must be indented (use `WriteIndented = true`)

3. **View console logs**: Check Developer Tools (View > Toggle DevTools)
   - Look for React errors
   - Check if OutputDisplay component is loading

### JSON Not Detected

**Problem**: JSON shows as plain text instead of tree view

**Common Causes**:
- Missing `System.Text.Json` namespace
- Forgot `WriteIndented = true`
- JSON string has extra text before/after
- Invalid JSON syntax

**Fix**:
```csharp
using System.Text.Json;  // ← Add this

var data = new { Name = "Test" };
Console.WriteLine(JsonSerializer.Serialize(data, new JsonSerializerOptions {
    WriteIndented = true  // ← Required for detection
}));
```

### Tables Not Rendering

**Problem**: Pipe-delimited tables show as plain text

**Requirements**:
- First line must have `|` separators
- Header separator line (optional): `|----|----|`
- Consistent number of columns
- At least 2 columns

**Valid Format**:
```
| Col1 | Col2 |
|------|------|
| Val1 | Val2 |
```

## Default Code

The default snippet demonstrates all rich output types. Press F5 to see:
1. JSON object with nested structure
2. Array of objects
3. Pipe-delimited table
4. Statistics object

## Implementation Details

### Auto-Detection Logic

The `detectOutputFormat()` function checks:
1. **JSON**: Starts with `{` or `[`, valid JSON.parse()
2. **Table**: Multiple lines with consistent `|` or `\t` separators
3. **HTML**: Starts/ends with `<>` tags
4. **Plain**: Everything else (fallback)

### Components

- **OutputDisplay**: Smart router, auto-detects format
- **JsonOutput**: Ant Design Tree component
- **TableOutput**: Ant Design Table component  
- **PlainOutput**: Simple pre-formatted text

### File Locations

- Backend logic: `src/backend/output-formatter.ts`
- React components: `src/renderer/components/OutputDisplay/`
- Tests: `tests/unit/output-formatter.test.ts`

## Known Limitations

- **Stdout/Stderr separation**: Not yet implemented (Phase 2)
- **Syntax highlighting**: Limited to JSON colors (more in Phase 2)
- **Large outputs**: May be slow (virtual scrolling in Phase 2)
- **HTML**: Basic rendering only, no scripting

## Tips

- Use `System.Text.Json` instead of `Newtonsoft.Json` for best results
- Always use `WriteIndented = true` for JSON
- Keep table columns consistent
- For large data, consider pagination in your C# code

## Feedback

If rich output isn't working as expected:
1. Check this guide
2. View logs: `npm run logs` (or `npm run logs:windows`)
3. Report issue: https://github.com/treytomes/code-pad/issues

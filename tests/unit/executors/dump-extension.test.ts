import { describe, it, expect, beforeAll } from 'vitest';
import { CSharpExecutor } from '../../../src/backend/executors/csharp';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Check if dotnet is available
let dotnetAvailable = false;
beforeAll(async () => {
  try {
    await execAsync('dotnet --version');
    dotnetAvailable = true;
  } catch {
    dotnetAvailable = false;
    console.warn('⚠️  .NET SDK not found - Dump extension tests will be skipped');
  }
});

describe('Dump Extension', () => {
  const executor = new CSharpExecutor();

  it.skipIf(!dotnetAvailable)('should inject DumpExtensions class', async () => {
    const code = `
using System;

var data = new { Name = "Test", Value = 42 };
data.Dump();
`;
    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"Name"');
    expect(result.stdout).toContain('"Test"');
    expect(result.stdout).toContain('"Value"');
    expect(result.stdout).toContain('42');
  });

  it.skipIf(!dotnetAvailable)('should support labeled dumps', async () => {
    const code = `
using System;

var person = new { Name = "Alice", Age = 30 };
person.Dump("Person Info");
`;
    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('=== Person Info ===');
    expect(result.stdout).toContain('"Name"');
    expect(result.stdout).toContain('"Alice"');
  });

  it.skipIf(!dotnetAvailable)('should add spacing between multiple dumps', async () => {
    const code = `
using System;

var first = new { Value = 1 };
first.Dump("First");

var second = new { Value = 2 };
second.Dump("Second");
`;
    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('=== First ===');
    expect(result.stdout).toContain('=== Second ===');

    // Should have blank line between dumps
    const lines = result.stdout.split('\n');
    const firstIndex = lines.findIndex(l => l.includes('First'));
    const secondIndex = lines.findIndex(l => l.includes('Second'));

    expect(secondIndex).toBeGreaterThan(firstIndex);

    // Check for blank line between sections
    const betweenLines = lines.slice(firstIndex + 1, secondIndex);
    const hasBlankLine = betweenLines.some(l => l.trim() === '');
    expect(hasBlankLine).toBe(true);
  });

  it.skipIf(!dotnetAvailable)('should support chaining', async () => {
    const code = `
using System;
using System.Linq;

var numbers = new[] { 1, 2, 3, 4, 5 };
var result = numbers
    .Dump("Original")
    .Where(n => n > 2)
    .Dump("Filtered")
    .Sum();

Console.WriteLine($"Sum: {result}");
`;
    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('=== Original ===');
    expect(result.stdout).toContain('=== Filtered ===');
    expect(result.stdout).toContain('Sum: 12');
  });

  it.skipIf(!dotnetAvailable)('should handle arrays and collections', async () => {
    const code = `
using System;
using System.Linq;

var users = new[] {
    new { Id = 1, Name = "Alice" },
    new { Id = 2, Name = "Bob" }
};
users.Dump("Users");
`;
    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('=== Users ===');
    expect(result.stdout).toContain('"Alice"');
    expect(result.stdout).toContain('"Bob"');

    // Should be valid JSON array
    const lines = result.stdout.split('\n');
    const jsonStartIndex = lines.findIndex(l => l.trim() === '[');
    expect(jsonStartIndex).toBeGreaterThan(-1);
  });

  it.skipIf(!dotnetAvailable)('should handle primitives', async () => {
    const code = `
using System;

42.Dump("The Answer");
"Hello World".Dump("Greeting");
true.Dump("Boolean");
`;
    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('=== The Answer ===');
    expect(result.stdout).toContain('42');
    expect(result.stdout).toContain('=== Greeting ===');
    expect(result.stdout).toContain('"Hello World"');
    expect(result.stdout).toContain('=== Boolean ===');
    expect(result.stdout).toContain('true');
  });

  it.skipIf(!dotnetAvailable)('should handle nested objects', async () => {
    const code = `
using System;

var config = new {
    AppName = "CodePad",
    Version = "0.1.0",
    Settings = new {
        Theme = "Dark",
        FontSize = 14,
        Features = new[] { "Syntax Highlighting", "Auto-complete", "Dump Method" }
    }
};
config.Dump("Configuration");
`;
    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('=== Configuration ===');
    expect(result.stdout).toContain('"AppName"');
    expect(result.stdout).toContain('"CodePad"');
    expect(result.stdout).toContain('"Settings"');
    expect(result.stdout).toContain('"Theme"');
    expect(result.stdout).toContain('"Dark"');
    expect(result.stdout).toContain('"Features"');
  });

  it.skipIf(!dotnetAvailable)('should work without using statements', async () => {
    // Test that DumpExtensions includes necessary using statements
    const code = `
var simple = new { Test = "No using statements" };
simple.Dump("Simple Test");
`;
    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('=== Simple Test ===');
    expect(result.stdout).toContain('"Test"');
  });

  it.skipIf(!dotnetAvailable)('should handle null values', async () => {
    const code = `
using System;

string nullString = null;
nullString.Dump("Null String");

var objWithNull = new { Name = "Test", Value = (string)null };
objWithNull.Dump("Object with Null");
`;
    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('=== Null String ===');
    expect(result.stdout).toContain('null');
    expect(result.stdout).toContain('=== Object with Null ===');
  });

  it.skipIf(!dotnetAvailable)('should not break with circular references', async () => {
    // ReferenceHandler.IgnoreCycles should handle this
    const code = `
using System;
using System.Collections.Generic;

class Node {
    public string Name { get; set; }
    public List<Node> Children { get; set; } = new List<Node>();
}

var root = new Node { Name = "Root" };
var child = new Node { Name = "Child" };
root.Children.Add(child);
child.Children.Add(root); // Circular reference

root.Dump("Tree with Cycle");
`;
    const result = await executor.execute(code);

    // Should not crash, even with circular reference
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('=== Tree with Cycle ===');
  });
});

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

  it.skipIf(!dotnetAvailable)(
    'should produce all four sections in LINQ pipeline chaining (regression: exit vs close event)',
    // This test guards against a bug where the executor resolved on the 'exit' event
    // before all stdout data had been flushed. The fix is to resolve on 'close' instead,
    // which fires only after all stdio streams have ended.
    async () => {
      const code = `
using System;
using System.Linq;

var products = new[] {
    new { Id = 1, Name = "Laptop", Price = 999.99, Category = "Electronics", InStock = true },
    new { Id = 2, Name = "Mouse", Price = 29.99, Category = "Electronics", InStock = true },
    new { Id = 3, Name = "Desk", Price = 299.99, Category = "Furniture", InStock = false },
    new { Id = 4, Name = "Chair", Price = 199.99, Category = "Furniture", InStock = true },
    new { Id = 5, Name = "Monitor", Price = 349.99, Category = "Electronics", InStock = true }
};

var expensiveElectronics = products
    .Dump("All Products")
    .Where(p => p.Category == "Electronics")
    .Dump("Electronics Only")
    .Where(p => p.Price > 100)
    .Dump("Expensive Electronics")
    .OrderByDescending(p => p.Price)
    .Dump("Sorted by Price")
    .ToArray();

Console.WriteLine($"Found {expensiveElectronics.Length} products");
`;
      const chunks: string[] = [];
      const result = await executor.execute(code, {}, (chunk) => chunks.push(chunk));

      expect(result.exitCode).toBe(0);

      // All four section headers must appear in the final accumulated output
      expect(result.stdout).toContain('=== All Products ===');
      expect(result.stdout).toContain('=== Electronics Only ===');
      expect(result.stdout).toContain('=== Expensive Electronics ===');
      expect(result.stdout).toContain('=== Sorted by Price ===');

      // Each section header must be followed by a JSON array
      const sections = result.stdout.split(/\n\s*\n/);
      const labelledSections = sections.filter((s) => s.startsWith('==='));
      expect(labelledSections).toHaveLength(4);
      labelledSections.forEach((section) => {
        // After the label line there must be a JSON array
        const afterLabel = section.replace(/^===.+===\n/, '').trim();
        expect(afterLabel).toMatch(/^\[/);
        expect(afterLabel).toMatch(/\]$/);
      });

      // All streamed chunks must combine to the full output
      const accumulated = chunks.join('');
      expect(accumulated).toContain('=== All Products ===');
      expect(accumulated).toContain('=== Sorted by Price ===');
    },
    60000
  );

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

  it.skipIf(!dotnetAvailable)(
    'ProgressReporter should not conflict when user declares their own progress variable (regression: CS0128)',
    async () => {
      // Mirrors the sample script exactly — user declares var progress themselves.
      // If the script builder also injects var progress, CS0128 fires.
      const code = `
using System;
using System.Threading;

var progress = new ProgressReporter(max: 3, label: "Test");
progress.Report(1);
progress.Report(2);
progress.Complete();
Console.WriteLine("done");
`;
      const result = await executor.execute(code);
      expect(result.exitCode, result.stderr).toBe(0);
      expect(result.stdout).toContain('##CODEPAD:PROGRESS:');
      expect(result.stdout).toContain('done');
    },
    60000
  );

  it.skipIf(!dotnetAvailable)(
    'ProgressReporter should compile and emit sentinel lines (regression: backslash in interpolation hole)',
    async () => {
      const code = `
using System;
using System.Threading;

var p = new ProgressReporter(max: 3, label: "Test");
p.Report(1);
p.Report(2, "Step 2");
p.Complete("Done");
`;
      const result = await executor.execute(code);

      expect(result.exitCode, result.stderr).toBe(0);
      expect(result.stdout).toContain('##CODEPAD:PROGRESS:');

      const lines = result.stdout.split('\n').filter((l) => l.startsWith('##CODEPAD:PROGRESS:'));
      expect(lines).toHaveLength(3);

      // Each line must carry valid JSON after the prefix
      for (const line of lines) {
        const json = line.slice('##CODEPAD:PROGRESS:'.length);
        expect(() => JSON.parse(json), `invalid JSON: ${json}`).not.toThrow();
      }

      // Last line must be complete (value === max)
      const last = JSON.parse(lines[2].slice('##CODEPAD:PROGRESS:'.length));
      expect(last.value).toBe(3);
      expect(last.max).toBe(3);
    },
    60000
  );

  it.skipIf(!dotnetAvailable)(
    'DumpContainer should emit sentinel lines and final content should match last Refresh call',
    async () => {
      const code = `
using System;
using System.Threading;

var counter = new DumpContainer("Test Counter", 0);

for (int i = 1; i <= 3; i++)
{
    Thread.Sleep(50);
    counter.Content = i;
    counter.Refresh();
}

Console.WriteLine("done");
`;
      const result = await executor.execute(code);

      expect(result.exitCode, result.stderr).toBe(0);
      expect(result.stdout).toContain('done');

      // Must emit at least one container sentinel
      const containerLines = result.stdout
        .split('\n')
        .filter((l) => l.startsWith('##CODEPAD:CONTAINER:'));
      expect(containerLines.length).toBeGreaterThanOrEqual(1);

      // All container lines must carry valid JSON with an id field
      for (const line of containerLines) {
        const json = JSON.parse(line.slice('##CODEPAD:CONTAINER:'.length));
        expect(typeof json.id).toBe('string');
        expect(json.id.length).toBeGreaterThan(0);
      }

      // All sentinels must share the same id (same container)
      const ids = containerLines.map((l) => {
        const json = JSON.parse(l.slice('##CODEPAD:CONTAINER:'.length));
        return json.id as string;
      });
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(1);

      // The last sentinel should have content = 3 (final value)
      const lastJson = JSON.parse(containerLines.at(-1)!.slice('##CODEPAD:CONTAINER:'.length));
      expect(lastJson.content).toBe(3);
    },
    60000
  );
});

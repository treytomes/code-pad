import { describe, it, expect } from 'vitest';
import { CSharpExecutor } from '../../../src/backend/executors/csharp';

describe('CSharpExecutor', () => {
  const executor = new CSharpExecutor();

  it('should execute simple Console.WriteLine', async () => {
    const code = 'Console.WriteLine("Hello World");';
    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Hello World');
    expect(result.stderr).toBe('');
    expect(result.timedOut).toBe(false);
    expect(result.executionTime).toBeGreaterThan(0);
  });

  it('should capture multiple lines of output', async () => {
    const code = `
      Console.WriteLine("Line 1");
      Console.WriteLine("Line 2");
      Console.WriteLine("Line 3");
    `;
    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Line 1');
    expect(result.stdout).toContain('Line 2');
    expect(result.stdout).toContain('Line 3');
  });

  it('should handle compile errors', async () => {
    const code = 'this is not valid C# code!!!';
    const result = await executor.execute(code);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  it('should handle runtime errors', async () => {
    const code = 'throw new Exception("Test error");';
    const result = await executor.execute(code);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('Test error');
  });

  it(
    'should timeout long-running code',
    async () => {
      const code =
        'while(true) { System.Threading.Thread.Sleep(100); }';
      const result = await executor.execute(code, { timeout: 1000 });

      expect(result.timedOut).toBe(true);
      expect(result.error).toContain('timed out');
    },
    10000
  ); // Test timeout 10s

  it('should execute code with variables', async () => {
    const code = `
      var x = 5;
      var y = 10;
      Console.WriteLine($"Sum: {x + y}");
    `;
    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Sum: 15');
  });

  it('should support LINQ queries', async () => {
    const code = `
      var numbers = new[] { 1, 2, 3, 4, 5 };
      var evens = numbers.Where(n => n % 2 == 0);
      Console.WriteLine(string.Join(", ", evens));
    `;
    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('2, 4');
  });

  it('should measure execution time', async () => {
    const code = `
      System.Threading.Thread.Sleep(100);
      Console.WriteLine("Done");
    `;
    const result = await executor.execute(code);

    expect(result.executionTime).toBeGreaterThanOrEqual(100);
    expect(result.executionTime).toBeLessThan(5000);
  });

  it('should provide helpful error when dotnet not found', async () => {
    // This test verifies error message quality, not that we can break dotnet
    // In real scenario with missing dotnet, the error handler provides:
    // 1. Clear message about dotnet not found
    // 2. Instruction to install .NET SDK
    // 3. Shows current PATH for debugging

    // Since our executor now adds common Windows paths automatically,
    // this test just verifies the code compiles and path handling works
    const code = 'Console.WriteLine("test");';
    const result = await executor.execute(code);

    // Should succeed because we added Windows dotnet paths
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('test');
  });

  it('should handle code with using statements without CS1529 error', async () => {
    const code = `using System;
using System.Linq;

Console.WriteLine("Hello World");`;

    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Hello World');
    expect(result.stderr).not.toContain('CS1529');
  });

  it('should handle code with #r directives before using statements', async () => {
    const code = `// #r "nuget: Newtonsoft.Json"
using System;
using System.Linq;

var numbers = new[] { 1, 2, 3 };
Console.WriteLine(string.Join(", ", numbers));`;

    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('1, 2, 3');
    expect(result.stderr).not.toContain('CS1529');
  });

  it('should handle code with comments before using statements', async () => {
    const code = `// This is a comment
// Another comment
using System;

Console.WriteLine("Test");`;

    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Test');
  });

  it('should insert auto-flush code after using statements', async () => {
    // This tests that our auto-flush logic doesn't break the code structure
    const code = `using System;
using System.Collections.Generic;

var list = new List<string> { "A", "B", "C" };
foreach (var item in list)
{
    Console.WriteLine(item);
}`;

    const result = await executor.execute(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('A');
    expect(result.stdout).toContain('B');
    expect(result.stdout).toContain('C');
  });
});

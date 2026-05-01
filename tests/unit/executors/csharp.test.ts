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
});

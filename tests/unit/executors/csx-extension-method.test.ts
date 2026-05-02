import { describe, it, expect, beforeAll } from 'vitest';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
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
    console.warn('⚠️  .NET SDK not found - C# script extension method tests will be skipped');
  }
});

describe('C# Script Extension Methods', () => {
  /**
   * Helper to execute a .csx script and return the result
   */
  async function executeCsxScript(code: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const fileName = `test-${randomUUID()}.csx`;
    const filePath = join(tmpdir(), fileName);

    try {
      await fs.writeFile(filePath, code, 'utf-8');

      const { stdout, stderr } = await execAsync(`dotnet script "${filePath}"`, {
        timeout: 5000
      });

      return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || '',
        exitCode: error.code || 1
      };
    } finally {
      try {
        await fs.unlink(filePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  it.skipIf(!dotnetAvailable)('should demonstrate the CS1109 error with naive approach', async () => {
    // This is what we tried initially - extension class after using statements
    const code = `using System;

public static class MyExtensions
{
    public static void Test(this string s)
    {
        Console.WriteLine($"Test: {s}");
    }
}

"Hello".Test();
`;

    const result = await executeCsxScript(code);

    // This SHOULD fail with CS1109 (extension methods must be in top-level class)
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('CS1109');
    expect(result.stderr).toContain('top level static class');
  });

  it.skipIf(!dotnetAvailable)('should work with LINQPad-style wrapper approach', async () => {
    // LINQPad approach: wrap user code in a class/method
    const code = `using System;

public static class MyExtensions
{
    public static void Test(this string s)
    {
        Console.WriteLine($"Test: {s}");
    }
}

public class UserQuery
{
    public void Main()
    {
        "Hello".Test();
    }
}

new UserQuery().Main();
`;

    const result = await executeCsxScript(code);

    // This should succeed
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Test: Hello');
    expect(result.stderr).toBe('');
  });

  it.skipIf(!dotnetAvailable)('should demonstrate .Dump() extension with wrapper', async () => {
    // Test our actual .Dump() pattern
    const code = `using System;
using System.Text.Json;

public static class DumpExtensions
{
    public static T Dump<T>(this T obj, string label = null)
    {
        if (!string.IsNullOrEmpty(label))
        {
            Console.WriteLine($"=== {label} ===");
        }

        var json = JsonSerializer.Serialize(obj, new JsonSerializerOptions { WriteIndented = true });
        Console.WriteLine(json);

        return obj;
    }
}

public class UserQuery
{
    public void Main()
    {
        var person = new { Name = "Alice", Age = 30 };
        person.Dump("Person");
    }
}

new UserQuery().Main();
`;

    const result = await executeCsxScript(code);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('=== Person ===');
    expect(result.stdout).toContain('"Name"');
    expect(result.stdout).toContain('"Alice"');
    expect(result.stdout).toContain('"Age"');
    expect(result.stdout).toContain('30');
  });

  it.skipIf(!dotnetAvailable)('should verify our actual injection produces working code', async () => {
    // Simulate what our CSharpExecutor.createTempFile() should produce
    const userCode = `using System;
using System.Linq;

var numbers = new[] { 1, 2, 3 };
numbers.Dump("Numbers");
`;

    // This is what our injection should create
    const lines = userCode.split('\n');
    let firstCodeLineIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('#r ') || trimmed.startsWith('using ')) {
        firstCodeLineIndex = i + 1;
      } else if (trimmed.length > 0 && !trimmed.startsWith('//')) {
        break;
      }
    }

    const directivesAndUsings = lines.slice(0, firstCodeLineIndex);
    const actualUserCode = lines.slice(firstCodeLineIndex);

    const dumpExtensions = [
      'public static class DumpExtensions',
      '{',
      '    public static T Dump<T>(this T obj, string label = null)',
      '    {',
      '        if (!string.IsNullOrEmpty(label)) System.Console.WriteLine($"=== {label} ===");',
      '        var json = System.Text.Json.JsonSerializer.Serialize(obj, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });',
      '        System.Console.WriteLine(json);',
      '        return obj;',
      '    }',
      '}'
    ];

    const wrappedUserCode = [
      'public class UserQuery',
      '{',
      '    public void Main()',
      '    {',
      ...actualUserCode.map(line => '        ' + line),
      '    }',
      '}',
      'new UserQuery().Main();'
    ];

    const processedCode = [
      ...directivesAndUsings,
      ...dumpExtensions,
      ...wrappedUserCode
    ].join('\n');

    console.log('=== Generated Code ===');
    console.log(processedCode);
    console.log('======================');

    const result = await executeCsxScript(processedCode);

    if (result.exitCode !== 0) {
      console.error('STDERR:', result.stderr);
      console.error('STDOUT:', result.stdout);
    }

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('=== Numbers ===');
    expect(result.stdout).toContain('[');
    expect(result.stdout).toContain('1');
    expect(result.stdout).toContain('2');
    expect(result.stdout).toContain('3');
  });
});

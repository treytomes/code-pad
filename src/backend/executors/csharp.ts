/**
 * C# Code Executor using dotnet-script
 *
 * Executes C# code via dotnet-script CLI and captures output.
 */

import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { QueryType, NuGetReference } from '../../shared/types';

// Import logger - but make it optional for tests
let _logInfo: (msg: string, ...args: any[]) => void = console.log;
let logError: (msg: string, error?: any) => void = console.error;
let _logDebug: (msg: string, ...args: any[]) => void = console.log;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const logger = require('../../shared/logger');
  _logInfo = logger.logInfo;
  logError = logger.logError;
  _logDebug = logger.logDebug;
} catch (_e) {
  // Logger not available (e.g., in tests), use console
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  timedOut: boolean;
  error?: string;
}

export interface ExecutionOptions {
  timeout?: number; // milliseconds, default 30000 (30s), or 0 to disable timeout
  workingDirectory?: string;
  queryType?: QueryType; // defaults to 'statements'
  usings?: string[]; // additional namespace imports
  references?: NuGetReference[]; // NuGet package references
}

export class CSharpExecutor {
  private currentProcess: ChildProcess | null = null;

  /**
   * Stop the currently running execution
   */
  stop(): void {
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM');

      // Force kill after 2 seconds
      setTimeout(() => {
        if (this.currentProcess && !this.currentProcess.killed) {
          this.currentProcess.kill('SIGKILL');
        }
      }, 2000);
    }
  }

  /**
   * Find dotnet executable path
   */
  private findDotnetPath(): string {
    // On Windows, add common .NET installation paths
    if (process.platform === 'win32') {
      const commonPaths = [
        'C:\\Program Files\\dotnet',
        'C:\\Program Files (x86)\\dotnet',
        process.env.ProgramFiles + '\\dotnet',
        process.env['ProgramFiles(x86)'] + '\\dotnet',
      ];

      return commonPaths.filter(Boolean).join(';') + ';';
    }
    return '';
  }

  /**
   * Execute C# code and return results
   */
  async execute(
    code: string,
    options: ExecutionOptions = {},
    onOutputChunk?: (chunk: string, isError: boolean) => void
  ): Promise<ExecutionResult> {
    const timeout = options.timeout || 30000;
    const startTime = Date.now();

    _logDebug(`Starting C# code execution (timeout: ${timeout}ms)`);

    // Create temporary file for code
    const tempFile = await this.createTempFile(code, options.queryType ?? 'statements', options.usings ?? [], options.references ?? []);

    _logDebug(`Created temp file: ${tempFile}`);

    try {
      const result = await this.runDotnetScript(tempFile.path, timeout, tempFile.references, onOutputChunk);

      const executionTime = Date.now() - startTime;
      _logDebug(
        `C# execution completed: exitCode=${result.exitCode}, time=${executionTime}ms, timedOut=${result.timedOut}`
      );

      return {
        ...result,
        executionTime,
      };
    } catch (error) {
      logError('C# execution failed', error);
      throw error;
    } finally {
      // Cleanup temp file
      await this.deleteTempFile(tempFile.path);
    }
  }

  /**
   * Get the DumpExtensions class code (uses fully-qualified names to avoid using statements)
   */
  private getDumpExtensions(): string[] {
    return [
      '#region CodePad Extensions',
      '// Auto-injected by CodePad - provides .Dump() extension method',
      'public static class DumpExtensions',
      '{',
      '    /// <summary>',
      '    /// Dumps the object as formatted JSON to the console.',
      '    /// Returns the object for method chaining.',
      '    /// </summary>',
      '    /// <param name="obj">The object to dump</param>',
      '    /// <param name="label">Optional label to display before the output</param>',
      '    // Overload for IEnumerable<T>: materialises to array before dumping so the',
      '    // sequence can continue to be used in LINQ chains after .Dump().',
      '    public static TItem[] Dump<TItem>(this System.Collections.Generic.IEnumerable<TItem> seq, string label = null)',
      '    {',
      '        var arr = System.Linq.Enumerable.ToArray(seq);',
      '        DumpObject(arr, label);',
      '        return arr;',
      '    }',
      '    ',
      '    public static T Dump<T>(this T obj, string label = null)',
      '    {',
      '        DumpObject(obj, label);',
      '        return obj;',
      '    }',
      '    ',
      '    private static void DumpObject(object obj, string label)',
      '    {',
      '        // Output label if provided',
      '        if (!string.IsNullOrEmpty(label))',
      '        {',
      '            System.Console.WriteLine($"=== {label} ===");',
      '        }',
      '        ',
      '        // Strings are written directly — JsonSerializer would HTML-encode and quote them',
      '        if (obj is string s)',
      '        {',
      '            System.Console.WriteLine(s);',
      '        }',
      '        else',
      '        {',
      '            try',
      '            {',
      '                var json = System.Text.Json.JsonSerializer.Serialize(obj, new System.Text.Json.JsonSerializerOptions',
      '                {',
      '                    WriteIndented = true,',
      '                    ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles,',
      '                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never',
      '                });',
      '                System.Console.WriteLine(json);',
      '            }',
      '            catch (System.Exception ex)',
      '            {',
      '                System.Console.WriteLine($"[Dump Error: {ex.Message}]");',
      '                System.Console.WriteLine(obj?.ToString() ?? "null");',
      '            }',
      '        }',
      '        // Trailing blank line so the next output (another .Dump() or a',
      '        // Console.WriteLine) always starts a new section for the renderer.',
      '        System.Console.WriteLine();',
      '    }',
      '}',
      '#endregion',
      '',
    ];
  }

  private getContainerExtensions(): string[] {
    // DumpContainer: a mutable output slot. Each instance owns a stable ID.
    // Calling Refresh() emits a sentinel that the renderer uses to replace
    // the slot's content in-place rather than appending a new section.
    // JSON building uses concatenation — no backslash escapes inside ${}
    // expression holes (C# restriction).
    return [
      '#region CodePad DumpContainer',
      'public class DumpContainer',
      '{',
      '    private const string _prefix = "##CODEPAD:CONTAINER:";',
      '    private string _id;',
      '    private string _label;',
      '    private object _lastEmitted = new object(); // sentinel "not yet emitted"',
      '    public object Content { get; set; }',
      '    public DumpContainer(object initialContent = null) : this(null, initialContent) { }',
      '    public DumpContainer(string label, object initialContent = null)',
      '    {',
      '        _id = System.Guid.NewGuid().ToString("N");',
      '        _label = label;',
      '        Content = initialContent;',
      '        Refresh();',
      '    }',
      '    public void Refresh()',
      '    {',
      '        // Skip if content hasn\'t changed since last emit (avoid flicker)',
      '        if (System.Object.ReferenceEquals(Content, _lastEmitted)) return;',
      '        if (Content is System.ValueType || Content == null)',
      '        {',
      '            var str = (Content == null) ? "null" : Content.ToString();',
      '            if (_lastEmitted is string last && last == str) return;',
      '            _lastEmitted = str;',
      '            Emit(Content);',
      '        }',
      '        else',
      '        {',
      '            _lastEmitted = Content;',
      '            Emit(Content);',
      '        }',
      '    }',
      '    private void Emit(object value)',
      '    {',
      '        string payload;',
      '        if (value == null)',
      '        {',
      '            payload = "null";',
      '        }',
      '        else if (value is string s)',
      '        {',
      '            // Embed string as JSON string value to preserve quoting on the renderer side',
      '            var escaped = s.Replace("\\\\", "\\\\\\\\").Replace("\\"", "\\\\\\"");',
      '            payload = "\\"" + escaped + "\\"";',
      '        }',
      '        else',
      '        {',
      '            try',
      '            {',
      '                payload = System.Text.Json.JsonSerializer.Serialize(value, new System.Text.Json.JsonSerializerOptions',
      '                {',
      '                    WriteIndented = false,',
      '                    ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles,',
      '                });',
      '            }',
      '            catch',
      '            {',
      '                payload = "\\"" + value.ToString()?.Replace("\\"", "\\\\\\"") + "\\"";',
      '            }',
      '        }',
      '        var labelPart = _label != null',
      '            ? ",\\"label\\":\\"" + _label.Replace("\\\\", "\\\\\\\\").Replace("\\"", "\\\\\\"") + "\\""',
      '            : "";',
      '        System.Console.WriteLine(_prefix + "{\\"id\\":\\"" + _id + "\\"" + labelPart + ",\\"content\\":" + payload + "}");',
      '        System.Console.Out.Flush();',
      '    }',
      '}',
      '#endregion',
      '',
    ];
  }

  private getProgressExtensions(): string[] {
    // NOTE: C# does not allow backslash escapes inside interpolation holes ($"{...}").
    // Build JSON by concatenation so that quote characters never appear inside {}.
    return [
      '#region CodePad Progress',
      'public class ProgressReporter : System.IProgress<int>',
      '{',
      '    private const string _prefix = "##CODEPAD:PROGRESS:";',
      '    private int _max;',
      '    private string _label;',
      '    public ProgressReporter(int max = 100, string label = null) { _max = max; _label = label; }',
      '    private static string Json(int value, int max, string label)',
      '    {',
      '        var core = "{\\"value\\":" + value + ",\\"max\\":" + max;',
      '        if (label != null)',
      '            core += ",\\"label\\":\\"" + label.Replace("\\\\", "\\\\\\\\").Replace("\\"", "\\\\\\"") + "\\"";',
      '        return core + "}";',
      '    }',
      '    public void Report(int value)',
      '    {',
      '        System.Console.WriteLine(_prefix + Json(value, _max, _label));',
      '    }',
      '    public void Report(int value, string label)',
      '    {',
      '        System.Console.WriteLine(_prefix + Json(value, _max, label));',
      '    }',
      '    public void Complete(string label = null)',
      '    {',
      '        System.Console.WriteLine(_prefix + Json(_max, _max, label ?? _label ?? "Done"));',
      '    }',
      '}',
      '#endregion',
      '',
    ];
  }

  /**
   * Extract leading directives and using statements from user code.
   * Returns { preamble: string[], body: string[], inlineRefs: NuGetReference[] }.
   *
   * Recognises #r "nuget:PackageName/Version" (and without version) as inline
   * NuGet references and strips them from the preamble so they don't appear in
   * the compiled source, returning them as structured NuGetReference objects.
   */
  private splitPreamble(code: string): { preamble: string[]; body: string[]; inlineRefs: NuGetReference[] } {
    const lines = code.split('\n');
    let splitIndex = 0;
    const inlineRefs: NuGetReference[] = [];

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      // #r "nuget:PackageName" or #r "nuget:PackageName/Version"
      const nugetMatch = trimmed.match(/^#r\s+"nuget:([^/"]+)(?:\/([^"]+))?"/i);
      if (nugetMatch) {
        inlineRefs.push({ name: nugetMatch[1].trim(), version: nugetMatch[2]?.trim() ?? '*' });
        splitIndex = i + 1;
      } else if (trimmed.startsWith('#r ') || trimmed.startsWith('using ')) {
        splitIndex = i + 1;
      } else if (trimmed.length > 0 && !trimmed.startsWith('//')) {
        break;
      }
    }

    // Strip inline nuget directives from preamble — they'd cause compiler errors
    const preamble = lines
      .slice(0, splitIndex)
      .filter((line) => !line.trim().match(/^#r\s+"nuget:/i));

    return { preamble, body: lines.slice(splitIndex), inlineRefs };
  }

  private buildStatementsScript(preamble: string[], body: string[], extraUsings: string[]): string {
    const usingLines = extraUsings.map((u) => `using ${u};`);
    return [
      ...preamble,
      ...usingLines,
      ...this.getDumpExtensions(),
      ...this.getContainerExtensions(),
      ...this.getProgressExtensions(),
      '',
      'public class Program',
      '{',
      '    public static void Main(string[] args)',
      '    {',
      '        System.Console.SetOut(new System.IO.StreamWriter(System.Console.OpenStandardOutput()) { AutoFlush = true });',
      '        System.Console.SetError(new System.IO.StreamWriter(System.Console.OpenStandardError()) { AutoFlush = true });',
      '        ',
      ...body.map((line) => '        ' + line),
      '    }',
      '}',
    ].join('\n');
  }

  private buildExpressionScript(preamble: string[], body: string[], extraUsings: string[]): string {
    // Treat the entire body as a single expression — strip trailing semicolons/whitespace
    const expression = body.join('\n').replace(/;\s*$/, '').trim();
    const usingLines = extraUsings.map((u) => `using ${u};`);

    return [
      ...preamble,
      ...usingLines,
      ...this.getDumpExtensions(),
      ...this.getContainerExtensions(),
      ...this.getProgressExtensions(),
      '',
      'public class Program',
      '{',
      '    public static void Main(string[] args)',
      '    {',
      '        System.Console.SetOut(new System.IO.StreamWriter(System.Console.OpenStandardOutput()) { AutoFlush = true });',
      '        System.Console.SetError(new System.IO.StreamWriter(System.Console.OpenStandardError()) { AutoFlush = true });',
      `        (${expression}).Dump();`,
      '    }',
      '}',
    ].join('\n');
  }

  private buildProgramScript(preamble: string[], body: string[], extraUsings: string[]): string {
    // User owns Main() — inject DumpExtensions and ProgressReporter after user code
    const usingLines = extraUsings.map((u) => `using ${u};`);
    return [
      ...preamble,
      ...usingLines,
      '',
      ...body,
      '',
      ...this.getDumpExtensions(),
      ...this.getContainerExtensions(),
      ...this.getProgressExtensions(),
    ].join('\n');
  }

  /**
   * Create temporary .cs file with code wrapped according to the query type.
   */
  private async createTempFile(code: string, queryType: QueryType, extraUsings: string[], references: NuGetReference[]): Promise<{ path: string; references: NuGetReference[] }> {
    const fileName = `codepad-${randomUUID()}.cs`;
    const filePath = join(tmpdir(), fileName);

    const { preamble, body, inlineRefs } = this.splitPreamble(code);

    // Merge inline #r "nuget:..." refs with per-script references, deduplicating by name
    const mergedRefs = [...references];
    for (const ref of inlineRefs) {
      if (!mergedRefs.some((r) => r.name.toLowerCase() === ref.name.toLowerCase())) {
        mergedRefs.push(ref);
      }
    }

    let processedCode: string;
    switch (queryType) {
      case 'expression':
        processedCode = this.buildExpressionScript(preamble, body, extraUsings);
        break;
      case 'program':
        processedCode = this.buildProgramScript(preamble, body, extraUsings);
        break;
      case 'statements':
      default:
        processedCode = this.buildStatementsScript(preamble, body, extraUsings);
        break;
    }

    await fs.writeFile(filePath, processedCode, 'utf-8');

    // Save debug copy for inspection
    try {
      await fs.writeFile(join(tmpdir(), 'codepad-last-execution.cs'), processedCode, 'utf-8');
    } catch (_e) {
      // Ignore debug save errors
    }

    return { path: filePath, references: mergedRefs };
  }

  /**
   * Delete temporary file and associated build artifacts
   */
  private async deleteTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);

      // Also delete build artifacts
      const csprojPath = filePath.replace('.cs', '.csproj');
      const dllPath = filePath.replace('.cs', '.dll');
      const pdbPath = filePath.replace('.cs', '.pdb');

      await fs.unlink(csprojPath).catch(() => {});
      await fs.unlink(dllPath).catch(() => {});
      await fs.unlink(pdbPath).catch(() => {});
    } catch (error) {
      // Ignore errors, temp files will be cleaned up by OS
      console.warn(`Failed to delete temp file: ${filePath}`, error);
    }
  }

  /**
   * Run dotnet program and capture output (compile with csc and execute)
   */
  private runDotnetScript(
    scriptPath: string,
    timeout: number,
    references: NuGetReference[],
    onOutputChunk?: (chunk: string, isError: boolean) => void
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const runAsync = async () => {
        let stdout = '';
        let stderr = '';
        let timedOut = false;
        let killed = false;

        const env = { ...process.env };
        const _pathSeparator = process.platform === 'win32' ? ';' : ':';
        const dotnetCommonPaths = this.findDotnetPath();

        env.PATH = `${dotnetCommonPaths}${env.PATH || ''}`;
        env.DOTNET_CLI_TELEMETRY_OPTOUT = '1';

        // Use dotnet build to compile the .cs file into an assembly
        // This is more reliable than dotnet-script and works with our Program.Main() structure
        const _outputDll = scriptPath.replace('.cs', '.dll');
        const _outputExe = scriptPath.replace('.cs', '.exe');

        try {
          // Step 1: Create a simple project directory structure
          // dotnet build expects .csproj and .cs to be in same directory
          const projectDir = join(tmpdir(), `codepad-project-${randomUUID()}`);
          await fs.mkdir(projectDir, { recursive: true });

          const projectName = 'CodePadScript';
          const csFileName = 'Program.cs';
          const csFilePath = join(projectDir, csFileName);
          const csprojPath = join(projectDir, `${projectName}.csproj`);

          // Copy the temp .cs file to the project directory
          const originalCode = await fs.readFile(scriptPath, 'utf-8');
          await fs.writeFile(csFilePath, originalCode, 'utf-8');

          // Build NuGet package references
          const nugetRefs = references
            .filter((r: NuGetReference) => r.name && r.version)
            .map((r: NuGetReference) => `    <PackageReference Include="${r.name}" Version="${r.version}" />`)
            .join('\n');
          const itemGroup = nugetRefs
            ? `\n  <ItemGroup>\n${nugetRefs}\n  </ItemGroup>`
            : '';

          // Create a proper .csproj file
          const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <NoWarn>CS0105;CS8625</NoWarn>
  </PropertyGroup>${itemGroup}
</Project>`;

          await fs.writeFile(csprojPath, csprojContent, 'utf-8');

          _logDebug(`Created project at: ${projectDir}`);
          _logDebug(`Compiling ${csFileName}`);

          // Compile
          const compileResult = await new Promise<{
            stdout: string;
            stderr: string;
            exitCode: number;
          }>((compileResolve) => {
            let compileStdout = '';
            let compileStderr = '';

            const compileProcess = spawn(
              'dotnet',
              ['build', csprojPath, '-o', join(projectDir, 'bin')],
              {
                cwd: projectDir,
                env,
              }
            );

            compileProcess.stdout?.on('data', (data) => {
              compileStdout += data.toString();
            });

            compileProcess.stderr?.on('data', (data) => {
              compileStderr += data.toString();
            });

            let compileExitCode = 0;
            compileProcess.on('exit', (code) => {
              compileExitCode = code || 0;
            });
            compileProcess.on('close', () => {
              compileResolve({ stdout: compileStdout, stderr: compileStderr, exitCode: compileExitCode });
            });

            compileProcess.on('error', (error) => {
              compileResolve({ stdout: '', stderr: error.message, exitCode: -1 });
            });
          });

          // If compilation failed, return the compile error with detailed info
          if (compileResult.exitCode !== 0) {
            logError('Compilation failed', {
              exitCode: compileResult.exitCode,
              stdout: compileResult.stdout,
              stderr: compileResult.stderr,
            });

            // Combine stdout and stderr for full error context
            const fullError = [
              'Compilation failed:',
              '',
              compileResult.stderr.trim(),
              compileResult.stdout.trim(),
            ]
              .filter(Boolean)
              .join('\n');

            resolve({
              stdout: '',
              stderr: fullError,
              exitCode: compileResult.exitCode,
              executionTime: 0,
              timedOut: false,
              error: 'Compilation failed',
            });
            return;
          }

          // Step 2: Execute the compiled DLL
          const compiledDll = join(projectDir, 'bin', `${projectName}.dll`);
          _logDebug(`Executing: ${compiledDll}`);

          const childProcess: ChildProcess = spawn('dotnet', [compiledDll], {
            cwd: projectDir,
            env,
          });

          // Store reference for stop() method
          this.currentProcess = childProcess;

          // Set timeout (if not disabled)
          let timer: NodeJS.Timeout | null = null;
          if (timeout > 0) {
            timer = setTimeout(() => {
              timedOut = true;
              killed = true;
              childProcess.kill('SIGTERM');

              // Force kill after 2 seconds
              setTimeout(() => {
                if (!childProcess.killed) {
                  childProcess.kill('SIGKILL');
                }
              }, 2000);
            }, timeout);
          }

          // Capture stdout
          childProcess.stdout?.on('data', (data) => {
            const chunk = data.toString();
            stdout += chunk;

            // Emit chunk for streaming
            if (onOutputChunk) {
              onOutputChunk(chunk, false);
            }
          });

          // Capture stderr
          childProcess.stderr?.on('data', (data) => {
            const chunk = data.toString();
            stderr += chunk;

            // Emit chunk for streaming
            if (onOutputChunk) {
              onOutputChunk(chunk, true);
            }
          });

          // Use 'close' (not 'exit') so all stdout/stderr data has been flushed
          // before we resolve. 'exit' fires when the process exits but stdio streams
          // may still have buffered data that arrives after cleanup() removes the
          // IPC listener, causing the tail of streaming output to be lost.
          let exitCode = 0;
          childProcess.on('exit', (code) => {
            exitCode = code || 0;
          });

          childProcess.on('close', async () => {
            if (timer) clearTimeout(timer);
            this.currentProcess = null;

            // Cleanup project directory
            try {
              await fs.rm(projectDir, { recursive: true, force: true });
            } catch (_e) {
              // Ignore cleanup errors
            }

            resolve({
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              exitCode,
              executionTime: 0, // Set by caller
              timedOut,
              error: killed ? 'Execution timed out or was stopped' : undefined,
            });
          });

          // Handle errors
          childProcess.on('error', (error) => {
            if (timer) clearTimeout(timer);
            this.currentProcess = null;

            let errorMessage = error.message;

            // Provide helpful error message for ENOENT (command not found)
            if (error.message.includes('ENOENT')) {
              errorMessage = `dotnet command not found. Please ensure .NET SDK is installed and available in PATH.\n\nError: ${error.message}\n\nCurrent PATH: ${env.PATH?.substring(0, 200)}...`;
            }

            resolve({
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              exitCode: -1,
              executionTime: 0,
              timedOut: false,
              error: errorMessage,
            });
          });
        } catch (error: any) {
          // Handle compilation errors
          resolve({
            stdout: '',
            stderr: error.message || 'Unknown compilation error',
            exitCode: -1,
            executionTime: 0,
            timedOut: false,
            error: error.message,
          });
        }
      };

      // Call the async function
      runAsync();
    });
  }
}

// Export singleton instance
export const csharpExecutor = new CSharpExecutor();

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
    const tempFile = await this.createTempFile(code);
    _logDebug(`Created temp file: ${tempFile}`);

    try {
      const result = await this.runDotnetScript(tempFile, timeout, onOutputChunk);

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
      await this.deleteTempFile(tempFile);
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
      '    private static int _dumpCount = 0;',
      '    ',
      '    /// <summary>',
      '    /// Dumps the object as formatted JSON to the console.',
      '    /// Returns the object for method chaining.',
      '    /// </summary>',
      '    /// <param name="obj">The object to dump</param>',
      '    /// <param name="label">Optional label to display before the output</param>',
      '    public static T Dump<T>(this T obj, string label = null)',
      '    {',
      '        // Add blank line separator (except first dump)',
      '        if (_dumpCount++ > 0)',
      '        {',
      '            System.Console.WriteLine();',
      '        }',
      '        ',
      '        // Output label if provided',
      '        if (!string.IsNullOrEmpty(label))',
      '        {',
      '            System.Console.WriteLine($"=== {label} ===");',
      '        }',
      '        ',
      '        // Serialize to JSON using fully-qualified names',
      '        try',
      '        {',
      '            var json = System.Text.Json.JsonSerializer.Serialize(obj, new System.Text.Json.JsonSerializerOptions',
      '            {',
      '                WriteIndented = true,',
      '                ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles,',
      '                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never',
      '            });',
      '            ',
      '            System.Console.WriteLine(json);',
      '        }',
      '        catch (System.Exception ex)',
      '        {',
      '            // Fallback to ToString() if serialization fails',
      '            System.Console.WriteLine($"[Dump Error: {ex.Message}]");',
      '            System.Console.WriteLine(obj?.ToString() ?? "null");',
      '        }',
      '        ',
      '        return obj;',
      '    }',
      '}',
      '#endregion',
      '',
    ];
  }

  /**
   * Create temporary .cs file with code (NOT .csx - we compile as a regular program)
   */
  private async createTempFile(code: string): Promise<string> {
    const fileName = `codepad-${randomUUID()}.cs`;
    const filePath = join(tmpdir(), fileName);

    // Also save to a debug location for inspection
    const debugPath = join(tmpdir(), 'codepad-last-execution.cs');

    // LINQPad approach: Wrap user code in a class/method to avoid top-level statement issues
    // This keeps extension classes truly top-level

    // Split into directives/usings vs everything else
    const lines = code.split('\n');
    let firstCodeLineIndex = 0;

    // Find where actual code begins (skip #r and using statements)
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('#r ') || trimmed.startsWith('using ')) {
        firstCodeLineIndex = i + 1;
      } else if (trimmed.length > 0 && !trimmed.startsWith('//')) {
        // Found first real code line (not comment, not blank)
        break;
      }
    }

    const directivesAndUsings = lines.slice(0, firstCodeLineIndex);
    const userCode = lines.slice(firstCodeLineIndex);

    const dumpExtensions = this.getDumpExtensions();

    // Create proper C# program structure with Program.Main() entry point
    // This is a standard console app, not a script, so no implicit wrapping
    const wrappedProgram = [
      ...dumpExtensions,
      '',
      'public class Program',
      '{',
      '    public static void Main(string[] args)',
      '    {',
      '        // Auto-flush console for streaming output',
      '        System.Console.SetOut(new System.IO.StreamWriter(System.Console.OpenStandardOutput()) { AutoFlush = true });',
      '        System.Console.SetError(new System.IO.StreamWriter(System.Console.OpenStandardError()) { AutoFlush = true });',
      '        ',
      '        // User code begins here',
      ...userCode.map((line) => '        ' + line), // Indent user code by 8 spaces
      '    }',
      '}',
    ];

    // Assemble in correct order:
    // 1. Directives and usings
    // 2. DumpExtensions (top-level class - not nested!)
    // 3. Program class with Main() entry point containing user code
    const processedCode = [...directivesAndUsings, ...wrappedProgram].join('\n');

    await fs.writeFile(filePath, processedCode, 'utf-8');

    // Save debug copy for inspection
    try {
      await fs.writeFile(debugPath, processedCode, 'utf-8');
      console.log(`[DEBUG] Generated code saved to: ${debugPath}`);
    } catch (_e) {
      // Ignore debug save errors
    }

    return filePath;
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

          // Create a proper .csproj file
          const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>disable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
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

            compileProcess.on('exit', (code) => {
              compileResolve({ stdout: compileStdout, stderr: compileStderr, exitCode: code || 0 });
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

          // Handle exit
          childProcess.on('exit', async (code) => {
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
              exitCode: code || 0,
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

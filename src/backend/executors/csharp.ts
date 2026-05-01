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
  timeout?: number; // milliseconds, default 30000 (30s)
  workingDirectory?: string;
}

export class CSharpExecutor {
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

    logDebug(`Starting C# code execution (timeout: ${timeout}ms)`);

    // Create temporary file for code
    const tempFile = await this.createTempFile(code);
    logDebug(`Created temp file: ${tempFile}`);

    try {
      const result = await this.runDotnetScript(tempFile, timeout, onOutputChunk);

      const executionTime = Date.now() - startTime;
      logDebug(`C# execution completed: exitCode=${result.exitCode}, time=${executionTime}ms, timedOut=${result.timedOut}`);

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
   * Create temporary .csx file with code
   */
  private async createTempFile(code: string): Promise<string> {
    const fileName = `codepad-${randomUUID()}.csx`;
    const filePath = join(tmpdir(), fileName);

    // Insert auto-flush code AFTER #r directives and using statements
    // to avoid CS1529 (using must precede other elements)
    const lines = code.split('\n');
    let insertIndex = 0;

    // Find the last #r directive or using statement
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('#r ') || trimmed.startsWith('using ')) {
        insertIndex = i + 1;
      } else if (trimmed && !trimmed.startsWith('//')) {
        // Stop at first non-comment, non-using, non-#r line
        break;
      }
    }

    // Insert auto-flush code after using statements (using fully-qualified names)
    const autoFlushCode = [
      '// Auto-flush console output for real-time streaming',
      'System.Console.SetOut(new System.IO.StreamWriter(System.Console.OpenStandardOutput()) { AutoFlush = true });',
      'System.Console.SetError(new System.IO.StreamWriter(System.Console.OpenStandardError()) { AutoFlush = true });',
      ''
    ];

    lines.splice(insertIndex, 0, ...autoFlushCode);
    const unbufferedCode = lines.join('\n');

    await fs.writeFile(filePath, unbufferedCode, 'utf-8');

    return filePath;
  }

  /**
   * Delete temporary file
   */
  private async deleteTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore errors, temp files will be cleaned up by OS
      console.warn(`Failed to delete temp file: ${filePath}`, error);
    }
  }

  /**
   * Run dotnet script and capture output
   */
  private runDotnetScript(
    scriptPath: string,
    timeout: number,
    onOutputChunk?: (chunk: string, isError: boolean) => void
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let killed = false;

      // Spawn dotnet script process
      const env = { ...process.env };

      // Build PATH with dotnet locations
      const pathSeparator = process.platform === 'win32' ? ';' : ':';
      const dotnetCommonPaths = this.findDotnetPath();

      // Add .dotnet/tools to PATH (needed for dotnet-script)
      const dotnetToolsPath = join(
        env.HOME || env.USERPROFILE || '',
        '.dotnet',
        'tools'
      );

      // Combine all paths: common dotnet paths + dotnet tools + existing PATH
      env.PATH = `${dotnetCommonPaths}${dotnetToolsPath}${pathSeparator}${env.PATH || ''}`;
      env.DOTNET_CLI_TELEMETRY_OPTOUT = '1'; // Disable telemetry

      const childProcess: ChildProcess = spawn('dotnet', ['script', scriptPath], {
        cwd: tmpdir(),
        env,
      });

      // Set timeout
      const timer = setTimeout(() => {
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
      childProcess.on('exit', (code) => {
        clearTimeout(timer);

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || 0,
          executionTime: 0, // Set by caller
          timedOut,
          error: killed ? 'Execution timed out' : undefined,
        });
      });

      // Handle errors
      childProcess.on('error', (error) => {
        clearTimeout(timer);

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
    });
  }
}

// Export singleton instance
export const csharpExecutor = new CSharpExecutor();

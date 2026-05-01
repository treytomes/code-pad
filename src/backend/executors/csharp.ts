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
   * Execute C# code and return results
   */
  async execute(
    code: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const timeout = options.timeout || 30000;
    const startTime = Date.now();

    // Create temporary file for code
    const tempFile = await this.createTempFile(code);

    try {
      const result = await this.runDotnetScript(tempFile, timeout);

      return {
        ...result,
        executionTime: Date.now() - startTime,
      };
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

    await fs.writeFile(filePath, code, 'utf-8');

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
    timeout: number
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let killed = false;

      // Spawn dotnet script process
      const env = { ...process.env };

      // Add .dotnet/tools to PATH (needed on Linux/macOS where it's not automatic)
      const dotnetToolsPath = join(
        env.HOME || env.USERPROFILE || '',
        '.dotnet',
        'tools'
      );
      const pathSeparator = process.platform === 'win32' ? ';' : ':';
      env.PATH = `${dotnetToolsPath}${pathSeparator}${env.PATH || ''}`;
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
        stdout += data.toString();
      });

      // Capture stderr
      childProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
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

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: -1,
          executionTime: 0,
          timedOut: false,
          error: error.message,
        });
      });
    });
  }
}

// Export singleton instance
export const csharpExecutor = new CSharpExecutor();

import { spawn, ChildProcess } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { ExecutionOptions, ExecutionResult } from '../../shared/types';
import { detectPythonRuntime } from './python-runtime';

export class PythonExecutor {
  private process: ChildProcess | null = null;
  private pythonCommand: string = 'python3';

  /**
   * Initialize executor and detect Python runtime
   */
  async initialize(customPath?: string): Promise<boolean> {
    const runtimeInfo = await detectPythonRuntime(customPath);
    if (runtimeInfo.available && runtimeInfo.path) {
      this.pythonCommand = runtimeInfo.path;
      return true;
    }
    return false;
  }

  /**
   * Execute Python code and return result
   */
  async execute(code: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    const startTime = Date.now();
    const timeout = options.timeout ?? 30000;

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Create temporary script file
      const tempFile = join(tmpdir(), `codepad-${Date.now()}-${Math.random().toString(36).slice(2)}.py`);

      try {
        writeFileSync(tempFile, code, 'utf-8');
      } catch (error) {
        resolve({
          stdout: '',
          stderr: `Failed to create temp file: ${error}`,
          exitCode: -1,
          executionTime: Date.now() - startTime,
          error: String(error),
        });
        return;
      }

      // Spawn Python process
      this.process = spawn(this.pythonCommand, [tempFile], {
        cwd: options.workingDirectory,
        env: {
          ...process.env,
          ...options.env,
          PYTHONIOENCODING: 'utf-8', // Ensure UTF-8 output
          PYTHONUNBUFFERED: '1', // Unbuffered output for real-time streaming
        },
      });

      // Capture stdout
      this.process.stdout?.on('data', (data) => {
        stdout += data.toString('utf-8');
      });

      // Capture stderr
      this.process.stderr?.on('data', (data) => {
        stderr += data.toString('utf-8');
      });

      // Handle process completion
      this.process.on('close', (exitCode) => {
        // Cleanup temp file
        try {
          unlinkSync(tempFile);
        } catch {
          // Ignore cleanup errors
        }

        const executionTime = Date.now() - startTime;

        // Map temp file path in errors to user-friendly name
        const mappedStderr = this.mapErrorPaths(stderr, tempFile);

        resolve({
          stdout,
          stderr: timedOut ? mappedStderr + '\n[Execution timeout exceeded]' : mappedStderr,
          exitCode: exitCode ?? -1,
          executionTime,
          error: timedOut ? 'Execution timeout exceeded' : undefined,
        });

        this.process = null;
      });

      // Handle spawn errors
      this.process.on('error', (error) => {
        try {
          unlinkSync(tempFile);
        } catch {
          // Ignore cleanup errors
        }

        resolve({
          stdout,
          stderr: `Failed to spawn Python process: ${error.message}`,
          exitCode: -1,
          executionTime: Date.now() - startTime,
          error: error.message,
        });

        this.process = null;
      });

      // Timeout handling
      if (timeout > 0) {
        setTimeout(() => {
          if (this.process) {
            timedOut = true;
            this.process.kill('SIGTERM');
            // Force kill after 1 second if still running
            setTimeout(() => {
              if (this.process) {
                this.process.kill('SIGKILL');
              }
            }, 1000);
          }
        }, timeout);
      }
    });
  }

  /**
   * Stop currently executing Python script
   */
  stop(): void {
    if (this.process) {
      this.process.kill('SIGTERM');
      // Force kill after 1 second if still running
      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
          this.process = null;
        }
      }, 1000);
    }
  }

  /**
   * Map temp file paths in error messages to user-friendly names
   */
  private mapErrorPaths(stderr: string, tempFile: string): string {
    // Replace temp file path with "script.py" for readability
    return stderr.replace(new RegExp(tempFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'script.py');
  }
}

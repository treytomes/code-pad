import { spawn, ChildProcess } from 'child_process';
import { writeFileSync, unlinkSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import type { ExecutionOptions, ExecutionResult } from '../../shared/types';
import { detectPythonRuntime } from './python-runtime';

export class PythonExecutor {
  private process: ChildProcess | null = null;
  private pythonCommand: string | null = null;
  private initialized: boolean = false;

  /**
   * Initialize executor and detect Python runtime
   */
  async initialize(customPath?: string): Promise<boolean> {
    const runtimeInfo = await detectPythonRuntime(customPath);
    if (runtimeInfo.available && runtimeInfo.path) {
      this.pythonCommand = runtimeInfo.path;
      this.initialized = true;
      return true;
    }
    this.initialized = true; // Mark as attempted
    return false;
  }

  /**
   * Execute Python code and return result
   * Auto-initializes on first use if not already initialized
   */
  async execute(code: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    // Auto-initialize on first use
    if (!this.initialized) {
      await this.initialize();
    }

    // Check if Python is available
    if (!this.pythonCommand) {
      return {
        stdout: '',
        stderr: 'Python runtime not found. Please install Python 3.8+ and ensure it is in PATH.',
        exitCode: -1,
        executionTime: 0,
        error: 'Python runtime not found',
      };
    }
    const startTime = Date.now();
    const timeout = options.timeout ?? 30000;

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Store command in local variable for type safety
      const pythonCmd = this.pythonCommand!;

      // Create temporary script file with injected dump function
      const tempFile = join(tmpdir(), `codepad-${Date.now()}-${Math.random().toString(36).slice(2)}.py`);

      try {
        const fullCode = this.injectDumpExtensions(code);
        writeFileSync(tempFile, fullCode, 'utf-8');
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
      this.process = spawn(pythonCmd, [tempFile], {
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
   * Inject dump() function at the beginning of user code
   */
  private injectDumpExtensions(userCode: string): string {
    try {
      // Read the dump extensions from the file
      const dumpExtensionsPath = join(__dirname, 'python-dump.py');
      const dumpExtensions = readFileSync(dumpExtensionsPath, 'utf-8');

      // Inject at the beginning with a separator comment
      return `${dumpExtensions}\n\n# === User Code ===\n${userCode}`;
    } catch (error) {
      // If we can't load the extensions, just return user code
      // (dump() won't be available but code will still run)
      console.error('Failed to load Python dump extensions:', error);
      return userCode;
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

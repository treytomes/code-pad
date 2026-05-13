import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PythonExecutor } from '../../../src/backend/executors/python';
import * as child_process from 'child_process';
import * as fs from 'fs';

// Mock child_process and fs
vi.mock('child_process');
vi.mock('fs');

describe('PythonExecutor', () => {
  let executor: PythonExecutor;
  let mockProcess: any;

  beforeEach(() => {
    executor = new PythonExecutor();

    // Create a mock child process
    mockProcess = {
      stdout: {
        on: vi.fn(),
      },
      stderr: {
        on: vi.fn(),
      },
      on: vi.fn(),
      kill: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should execute Python code and return stdout', async () => {
      // Setup
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
      vi.spyOn(child_process, 'spawn').mockReturnValue(mockProcess as any);

      // Mock stdout data
      mockProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from('Hello, Python!\n'));
        }
      });

      // Mock process close
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      // Execute
      const result = await executor.execute('print("Hello, Python!")');

      // Verify
      expect(result.stdout).toBe('Hello, Python!\n');
      expect(result.stderr).toBe('');
      expect(result.exitCode).toBe(0);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should capture stderr on error', async () => {
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
      vi.spyOn(child_process, 'spawn').mockReturnValue(mockProcess as any);

      // Mock stderr data
      mockProcess.stderr.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from('NameError: name "x" is not defined\n'));
        }
      });

      // Mock process close with error code
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });

      // Execute
      const result = await executor.execute('print(x)');

      // Verify
      expect(result.stderr).toContain('NameError');
      expect(result.exitCode).toBe(1);
    });

    it('should respect timeout setting', async () => {
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
      vi.spyOn(child_process, 'spawn').mockReturnValue(mockProcess as any);

      // Mock process that doesn't close immediately
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          // Don't close - let timeout handle it
        }
      });

      // Execute with very short timeout
      const promise = executor.execute('import time; time.sleep(100)', { timeout: 100 });

      // Wait a bit longer than timeout
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify kill was called
      expect(mockProcess.kill).toHaveBeenCalled();
    });

    it('should handle UTF-8 output correctly', async () => {
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
      vi.spyOn(child_process, 'spawn').mockReturnValue(mockProcess as any);

      // Mock UTF-8 output with emojis
      mockProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from('Hello 🐍 Python! 你好'));
        }
      });

      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      // Execute
      const result = await executor.execute('print("Hello 🐍 Python! 你好")');

      // Verify
      expect(result.stdout).toBe('Hello 🐍 Python! 你好');
    });

    it('should map temp file paths in errors to script.py', async () => {
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
      vi.spyOn(child_process, 'spawn').mockReturnValue(mockProcess as any);

      // Mock stderr with temp file path
      mockProcess.stderr.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from('  File "/tmp/codepad-12345.py", line 1\nSyntaxError: invalid syntax\n'));
        }
      });

      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });

      // Execute
      const result = await executor.execute('invalid python code');

      // Verify temp path is mapped to script.py
      expect(result.stderr).toContain('script.py');
      expect(result.stderr).not.toContain('codepad-');
    });

    it('should handle spawn errors', async () => {
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
      vi.spyOn(child_process, 'spawn').mockReturnValue(mockProcess as any);

      // Mock spawn error
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('ENOENT: python3 not found')), 10);
        }
      });

      // Execute
      const result = await executor.execute('print("test")');

      // Verify
      expect(result.exitCode).toBe(-1);
      expect(result.stderr).toContain('Failed to spawn Python process');
      expect(result.error).toBeDefined();
    });

    it('should handle file write errors', async () => {
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      // Execute
      const result = await executor.execute('print("test")');

      // Verify
      expect(result.exitCode).toBe(-1);
      expect(result.stderr).toContain('Failed to create temp file');
      expect(result.error).toBeDefined();
    });

    it('should support timeout = 0 (disabled)', async () => {
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
      vi.spyOn(child_process, 'spawn').mockReturnValue(mockProcess as any);

      mockProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from('Output'));
        }
      });

      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 50);
        }
      });

      // Execute with timeout disabled
      const result = await executor.execute('print("test")', { timeout: 0 });

      // Verify - should complete without timeout
      expect(result.stdout).toBe('Output');
      expect(result.exitCode).toBe(0);
      // Kill should not be called since timeout is disabled
      expect(mockProcess.kill).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should kill running process', async () => {
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
      vi.spyOn(child_process, 'spawn').mockReturnValue(mockProcess as any);

      // Start execution but don't close
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        // Keep process running
      });

      // Start execution in background
      const promise = executor.execute('import time; time.sleep(100)');

      // Give it time to start
      await new Promise(resolve => setTimeout(resolve, 10));

      // Stop execution
      executor.stop();

      // Verify kill was called
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should do nothing if no process is running', () => {
      // Should not throw
      expect(() => executor.stop()).not.toThrow();
    });
  });
});

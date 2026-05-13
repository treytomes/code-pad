import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PythonExecutor } from '../../../src/backend/executors/python';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, readFileSync } from 'fs';
import type { ChildProcess } from 'child_process';

// Mock dependencies
vi.mock('child_process');
vi.mock('fs');

describe('PythonExecutor - dump() extension', () => {
  let executor: PythonExecutor;
  let mockProcess: Partial<ChildProcess>;

  beforeEach(() => {
    executor = new PythonExecutor();

    // Mock successful Python detection
    vi.spyOn(executor as any, 'initialize').mockResolvedValue(true);
    (executor as any).pythonCommand = '/usr/bin/python3';
    (executor as any).initialized = true;

    // Mock child process
    mockProcess = {
      stdout: {
        on: vi.fn(),
      } as any,
      stderr: {
        on: vi.fn(),
      } as any,
      on: vi.fn(),
      kill: vi.fn(),
    };

    vi.mocked(spawn).mockReturnValue(mockProcess as ChildProcess);
    vi.mocked(writeFileSync).mockImplementation(() => {});
    vi.mocked(unlinkSync).mockImplementation(() => {});

    // Mock readFileSync to return dump extensions
    vi.mocked(readFileSync).mockReturnValue(`
def dump(obj, label=None):
    if label:
        print(f"=== {label} ===")
    print(str(obj))
    print()
    return obj

d = dump
`);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should inject dump() function into user code', async () => {
    const userCode = 'print("Hello")';
    let capturedCode = '';

    // Capture the code written to temp file
    vi.mocked(writeFileSync).mockImplementation((path, content) => {
      if (typeof content === 'string') {
        capturedCode = content;
      }
    });

    // Simulate process completion
    vi.mocked(spawn).mockImplementationOnce((cmd, args, options) => {
      setTimeout(() => {
        const closeCallback = (mockProcess.on as any).mock.calls.find(
          ([event]: [string, any]) => event === 'close'
        )?.[1];
        closeCallback?.(0);
      }, 10);
      return mockProcess as ChildProcess;
    });

    await executor.execute(userCode);

    expect(capturedCode).toContain('def dump(obj');
    expect(capturedCode).toContain('# === User Code ===');
    expect(capturedCode).toContain(userCode);
  });

  it('should support dump() with labels', async () => {
    const code = `
users = [{"name": "Alice", "age": 30}]
dump(users, "Users")
`;

    vi.mocked(spawn).mockImplementationOnce((cmd, args, options) => {
      setTimeout(() => {
        const stdoutCallback = (mockProcess.stdout!.on as any).mock.calls.find(
          ([event]: [string, any]) => event === 'data'
        )?.[1];

        // Simulate dump output with label
        stdoutCallback?.(Buffer.from('=== Users ===\n'));
        stdoutCallback?.(Buffer.from('[\n  {\n    "name": "Alice",\n    "age": 30\n  }\n]\n\n'));

        const closeCallback = (mockProcess.on as any).mock.calls.find(
          ([event]: [string, any]) => event === 'close'
        )?.[1];
        closeCallback?.(0);
      }, 10);
      return mockProcess as ChildProcess;
    });

    const result = await executor.execute(code);

    expect(result.stdout).toContain('=== Users ===');
    expect(result.stdout).toContain('"name": "Alice"');
    expect(result.exitCode).toBe(0);
  });

  it('should support dump() without labels', async () => {
    const code = `
data = {"status": "ok", "count": 42}
dump(data)
`;

    vi.mocked(spawn).mockImplementationOnce((cmd, args, options) => {
      setTimeout(() => {
        const stdoutCallback = (mockProcess.stdout!.on as any).mock.calls.find(
          ([event]: [string, any]) => event === 'data'
        )?.[1];

        // Simulate dump output without label
        stdoutCallback?.(Buffer.from('{\n  "status": "ok",\n  "count": 42\n}\n\n'));

        const closeCallback = (mockProcess.on as any).mock.calls.find(
          ([event]: [string, any]) => event === 'close'
        )?.[1];
        closeCallback?.(0);
      }, 10);
      return mockProcess as ChildProcess;
    });

    const result = await executor.execute(code);

    expect(result.stdout).toContain('"status": "ok"');
    expect(result.stdout).toContain('"count": 42');
    expect(result.exitCode).toBe(0);
  });

  it('should support dump() chaining (returns object)', async () => {
    const code = `
result = dump({"value": 100})
print(f"Type: {type(result)}")
`;

    vi.mocked(spawn).mockImplementationOnce((cmd, args, options) => {
      setTimeout(() => {
        const stdoutCallback = (mockProcess.stdout!.on as any).mock.calls.find(
          ([event]: [string, any]) => event === 'data'
        )?.[1];

        // Simulate dump output + chaining test
        stdoutCallback?.(Buffer.from('{\n  "value": 100\n}\n\n'));
        stdoutCallback?.(Buffer.from("Type: <class 'dict'>\n"));

        const closeCallback = (mockProcess.on as any).mock.calls.find(
          ([event]: [string, any]) => event === 'close'
        )?.[1];
        closeCallback?.(0);
      }, 10);
      return mockProcess as ChildProcess;
    });

    const result = await executor.execute(code);

    expect(result.stdout).toContain('"value": 100');
    expect(result.stdout).toContain("Type: <class 'dict'>");
    expect(result.exitCode).toBe(0);
  });

  it('should handle dump() with primitives', async () => {
    const code = `
dump(42, "Answer")
dump("Hello", "Greeting")
dump([1, 2, 3], "Numbers")
`;

    vi.mocked(spawn).mockImplementationOnce((cmd, args, options) => {
      setTimeout(() => {
        const stdoutCallback = (mockProcess.stdout!.on as any).mock.calls.find(
          ([event]: [string, any]) => event === 'data'
        )?.[1];

        // Simulate dump outputs
        stdoutCallback?.(Buffer.from('=== Answer ===\n42\n\n'));
        stdoutCallback?.(Buffer.from('=== Greeting ===\nHello\n\n'));
        stdoutCallback?.(Buffer.from('=== Numbers ===\n[\n  1,\n  2,\n  3\n]\n\n'));

        const closeCallback = (mockProcess.on as any).mock.calls.find(
          ([event]: [string, any]) => event === 'close'
        )?.[1];
        closeCallback?.(0);
      }, 10);
      return mockProcess as ChildProcess;
    });

    const result = await executor.execute(code);

    expect(result.stdout).toContain('=== Answer ===');
    expect(result.stdout).toContain('42');
    expect(result.stdout).toContain('=== Greeting ===');
    expect(result.stdout).toContain('Hello');
    expect(result.stdout).toContain('=== Numbers ===');
    expect(result.exitCode).toBe(0);
  });

  it('should gracefully handle missing dump extensions file', async () => {
    // Mock readFileSync to throw error (file not found)
    vi.mocked(readFileSync).mockImplementationOnce(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    const userCode = 'print("Hello")';
    let capturedCode = '';

    vi.mocked(writeFileSync).mockImplementation((path, content) => {
      if (typeof content === 'string') {
        capturedCode = content;
      }
    });

    vi.mocked(spawn).mockImplementationOnce((cmd, args, options) => {
      setTimeout(() => {
        const closeCallback = (mockProcess.on as any).mock.calls.find(
          ([event]: [string, any]) => event === 'close'
        )?.[1];
        closeCallback?.(0);
      }, 10);
      return mockProcess as ChildProcess;
    });

    // Should still execute, just without dump() function
    await executor.execute(userCode);

    expect(capturedCode).toBe(userCode); // No injection if file missing
  });

  it('should handle dump() with alias d()', async () => {
    const code = `
d({"short": "alias"}, "Using d()")
`;

    vi.mocked(spawn).mockImplementationOnce((cmd, args, options) => {
      setTimeout(() => {
        const stdoutCallback = (mockProcess.stdout!.on as any).mock.calls.find(
          ([event]: [string, any]) => event === 'data'
        )?.[1];

        // Simulate dump output using alias
        stdoutCallback?.(Buffer.from('=== Using d() ===\n'));
        stdoutCallback?.(Buffer.from('{\n  "short": "alias"\n}\n\n'));

        const closeCallback = (mockProcess.on as any).mock.calls.find(
          ([event]: [string, any]) => event === 'close'
        )?.[1];
        closeCallback?.(0);
      }, 10);
      return mockProcess as ChildProcess;
    });

    const result = await executor.execute(code);

    expect(result.stdout).toContain('=== Using d() ===');
    expect(result.stdout).toContain('"short": "alias"');
    expect(result.exitCode).toBe(0);
  });

  it('should handle arrays of objects (table format)', async () => {
    const code = `
users = [
    {"name": "Alice", "age": 30, "city": "NYC"},
    {"name": "Bob", "age": 25, "city": "SF"}
]
dump(users, "Users")
`;

    vi.mocked(spawn).mockImplementationOnce((cmd, args, options) => {
      setTimeout(() => {
        const stdoutCallback = (mockProcess.stdout!.on as any).mock.calls.find(
          ([event]: [string, any]) => event === 'data'
        )?.[1];

        // Simulate dump output for array of objects
        stdoutCallback?.(Buffer.from('=== Users ===\n'));
        stdoutCallback?.(
          Buffer.from(
            '[\n  {\n    "name": "Alice",\n    "age": 30,\n    "city": "NYC"\n  },\n  {\n    "name": "Bob",\n    "age": 25,\n    "city": "SF"\n  }\n]\n\n'
          )
        );

        const closeCallback = (mockProcess.on as any).mock.calls.find(
          ([event]: [string, any]) => event === 'close'
        )?.[1];
        closeCallback?.(0);
      }, 10);
      return mockProcess as ChildProcess;
    });

    const result = await executor.execute(code);

    expect(result.stdout).toContain('=== Users ===');
    expect(result.stdout).toContain('"name": "Alice"');
    expect(result.stdout).toContain('"name": "Bob"');
    expect(result.exitCode).toBe(0);
  });
});

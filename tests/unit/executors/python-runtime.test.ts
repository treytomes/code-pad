import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectPythonRuntime } from '../../../src/backend/executors/python-runtime';
import { promisify } from 'util';
import { exec } from 'child_process';

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('util', () => ({
  promisify: vi.fn((fn) => fn),
}));

const execAsync = promisify(exec);

describe('detectPythonRuntime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should detect python3 with valid version', async () => {
    // Mock python3 --version
    vi.mocked(execAsync).mockResolvedValueOnce({
      stdout: 'Python 3.11.5\n',
      stderr: '',
    } as any);

    // Mock which/where python3
    vi.mocked(execAsync).mockResolvedValueOnce({
      stdout: '/usr/bin/python3\n',
      stderr: '',
    } as any);

    const result = await detectPythonRuntime();

    expect(result.available).toBe(true);
    expect(result.version).toBe('3.11.5');
    expect(result.path).toBe('/usr/bin/python3');
    expect(result.error).toBeUndefined();
  });

  it('should fall back to python if python3 not found', async () => {
    // Mock python3 --version failure
    vi.mocked(execAsync)
      .mockRejectedValueOnce(new Error('Command not found'))
      // Mock python --version success
      .mockResolvedValueOnce({
        stdout: 'Python 3.10.0\n',
        stderr: '',
      } as any)
      // Mock which/where python
      .mockResolvedValueOnce({
        stdout: '/usr/bin/python\n',
        stderr: '',
      } as any);

    const result = await detectPythonRuntime();

    expect(result.available).toBe(true);
    expect(result.version).toBe('3.10.0');
    expect(result.path).toBe('/usr/bin/python');
  });

  it('should reject Python version < 3.8', async () => {
    // Mock python3 --version with old version
    vi.mocked(execAsync).mockResolvedValueOnce({
      stdout: 'Python 3.7.0\n',
      stderr: '',
    } as any);

    const result = await detectPythonRuntime();

    expect(result.available).toBe(false);
    expect(result.version).toBe('3.7.0');
    expect(result.error).toContain('3.8+ required');
  });

  it('should accept Python 3.8', async () => {
    vi.mocked(execAsync)
      .mockResolvedValueOnce({
        stdout: 'Python 3.8.0\n',
        stderr: '',
      } as any)
      .mockResolvedValueOnce({
        stdout: '/usr/bin/python3\n',
        stderr: '',
      } as any);

    const result = await detectPythonRuntime();

    expect(result.available).toBe(true);
    expect(result.version).toBe('3.8.0');
  });

  it('should accept Python 3.12+', async () => {
    vi.mocked(execAsync)
      .mockResolvedValueOnce({
        stdout: 'Python 3.12.1\n',
        stderr: '',
      } as any)
      .mockResolvedValueOnce({
        stdout: '/usr/bin/python3\n',
        stderr: '',
      } as any);

    const result = await detectPythonRuntime();

    expect(result.available).toBe(true);
    expect(result.version).toBe('3.12.1');
  });

  it('should reject Python 2.x', async () => {
    vi.mocked(execAsync)
      .mockRejectedValueOnce(new Error('Command not found'))
      .mockResolvedValueOnce({
        stdout: 'Python 2.7.18\n',
        stderr: '',
      } as any);

    const result = await detectPythonRuntime();

    expect(result.available).toBe(false);
    expect(result.error).toContain('3.8+ required');
  });

  it('should return error when Python not found', async () => {
    // Mock all commands failing
    vi.mocked(execAsync)
      .mockRejectedValueOnce(new Error('Command not found'))
      .mockRejectedValueOnce(new Error('Command not found'));

    const result = await detectPythonRuntime();

    expect(result.available).toBe(false);
    expect(result.error).toBe('Python 3.8+ not found in PATH');
  });

  it('should handle custom Python path', async () => {
    vi.mocked(execAsync)
      .mockResolvedValueOnce({
        stdout: 'Python 3.11.0\n',
        stderr: '',
      } as any)
      .mockResolvedValueOnce({
        stdout: '/opt/custom/python3\n',
        stderr: '',
      } as any);

    const result = await detectPythonRuntime('/opt/custom/python3');

    expect(result.available).toBe(true);
    expect(result.version).toBe('3.11.0');
  });

  it('should handle Windows paths', async () => {
    // Mock Windows path output
    vi.mocked(execAsync)
      .mockResolvedValueOnce({
        stdout: 'Python 3.11.5\n',
        stderr: '',
      } as any)
      .mockResolvedValueOnce({
        stdout: 'C:\\Python311\\python.exe\nC:\\Python310\\python.exe\n',
        stderr: '',
      } as any);

    const result = await detectPythonRuntime();

    expect(result.available).toBe(true);
    expect(result.path).toBe('C:\\Python311\\python.exe'); // Takes first result
  });

  it('should handle version check timeout', async () => {
    // Mock timeout error
    vi.mocked(execAsync).mockRejectedValueOnce(new Error('Timeout'));

    const result = await detectPythonRuntime();

    expect(result.available).toBe(false);
    expect(result.error).toBe('Python 3.8+ not found in PATH');
  });

  it('should handle malformed version output', async () => {
    vi.mocked(execAsync).mockResolvedValueOnce({
      stdout: 'Something unexpected\n',
      stderr: '',
    } as any);

    const result = await detectPythonRuntime();

    // Should continue to next command since version didn't match
    expect(result.available).toBe(false);
  });

  it('should fallback to command name when path detection fails', async () => {
    vi.mocked(execAsync)
      .mockResolvedValueOnce({
        stdout: 'Python 3.11.5\n',
        stderr: '',
      } as any)
      .mockRejectedValueOnce(new Error('which failed'));

    const result = await detectPythonRuntime();

    expect(result.available).toBe(true);
    expect(result.path).toBe('python3'); // Falls back to command name
  });
});

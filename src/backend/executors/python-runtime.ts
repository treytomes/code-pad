import { exec } from 'child_process';
import { promisify } from 'util';
import type { PythonRuntimeInfo } from '../../shared/types';

const execAsync = promisify(exec);

/**
 * Detect Python runtime available on the system
 * Tries python3 first (preferred), then python
 * Requires version >= 3.8
 */
export async function detectPythonRuntime(
  customPath?: string
): Promise<PythonRuntimeInfo> {
  const commands = customPath ? [customPath] : ['python3', 'python'];

  for (const cmd of commands) {
    try {
      // Get version
      const { stdout: versionOutput } = await execAsync(`${cmd} --version`, {
        timeout: 5000,
      });
      const versionMatch = versionOutput.trim().match(/Python (\d+\.\d+\.\d+)/);

      if (!versionMatch) {
        continue;
      }

      const version = versionMatch[1];
      const [major, minor] = version.split('.').map(Number);

      // Check version >= 3.8
      if (major < 3 || (major === 3 && minor < 8)) {
        return {
          available: false,
          version,
          error: `Python ${version} found, but 3.8+ required`,
        };
      }

      // Get path
      let path: string | undefined;
      try {
        const isWindows = process.platform === 'win32';
        const whichCmd = isWindows ? `where ${cmd}` : `which ${cmd}`;
        const { stdout: pathOutput } = await execAsync(whichCmd, {
          timeout: 5000,
        });
        path = pathOutput.trim().split('\n')[0]; // Take first result on Windows
      } catch {
        // Path detection failed, but we know it's available
        path = cmd;
      }

      return {
        available: true,
        version,
        path,
      };
    } catch (error) {
      // Command failed, try next
      continue;
    }
  }

  return {
    available: false,
    error: 'Python 3.8+ not found in PATH',
  };
}

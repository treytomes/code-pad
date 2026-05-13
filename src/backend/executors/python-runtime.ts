import { exec } from 'child_process';
import { promisify } from 'util';
import type { PythonRuntimeInfo } from '../../shared/types';

const execAsync = promisify(exec);

// Import logger - but make it optional for tests
let logInfo: (msg: string, ...args: any[]) => void = console.log;
let logError: (msg: string, error?: any) => void = console.error;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const logger = require('../../shared/logger');
  logInfo = logger.logInfo;
  logError = logger.logError;
} catch (_e) {
  // Logger not available (e.g., in tests), use console
}

/**
 * Detect Python runtime available on the system
 * Tries python3 first (preferred on Unix), python on Windows
 * Requires version >= 3.8
 */
export async function detectPythonRuntime(
  customPath?: string
): Promise<PythonRuntimeInfo> {
  // On Windows, try 'python' first; on Unix, try 'python3' first
  const isWindows = process.platform === 'win32';
  const commands = customPath
    ? [customPath]
    : isWindows
    ? ['python', 'python3']
    : ['python3', 'python'];

  logInfo(`Detecting Python runtime (platform: ${process.platform})...`);

  for (const cmd of commands) {
    try {
      logInfo(`Trying command: ${cmd} --version`);

      // Get version
      const { stdout: versionOutput, stderr: versionError } = await execAsync(`${cmd} --version`, {
        timeout: 5000,
      });

      logInfo(`Version output: ${versionOutput.trim()}`);
      if (versionError) {
        logInfo(`Version stderr: ${versionError.trim()}`);
      }

      const versionMatch = versionOutput.trim().match(/Python (\d+\.\d+\.\d+)/);

      if (!versionMatch) {
        logInfo(`No version match found, trying next command`);
        continue;
      }

      const version = versionMatch[1];
      const [major, minor] = version.split('.').map(Number);

      logInfo(`Detected Python ${version} (major: ${major}, minor: ${minor})`);

      // Check version >= 3.8
      if (major < 3 || (major === 3 && minor < 8)) {
        logError(`Python ${version} found, but 3.8+ required`);
        return {
          available: false,
          version,
          error: `Python ${version} found, but 3.8+ required`,
        };
      }

      // Get path
      let path: string | undefined;
      try {
        const whichCmd = isWindows ? `where ${cmd}` : `which ${cmd}`;
        logInfo(`Getting path with: ${whichCmd}`);
        const { stdout: pathOutput } = await execAsync(whichCmd, {
          timeout: 5000,
        });
        // Split by newlines (handle both \r\n and \n), take first, and trim whitespace
        const paths = pathOutput.split(/\r?\n/).map(p => p.trim()).filter(p => p.length > 0);
        path = paths[0];
        logInfo(`Python path: "${path}" (found ${paths.length} matches)`);
      } catch (pathError) {
        // Path detection failed, but we know it's available
        logInfo(`Path detection failed, using command name: ${cmd}`);
        path = cmd;
      }

      logInfo(`Python runtime detected successfully: ${version} at ${path}`);
      return {
        available: true,
        version,
        path,
      };
    } catch (error) {
      // Command failed, try next
      logInfo(`Command ${cmd} failed: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
  }

  logError('Python 3.8+ not found in PATH');
  return {
    available: false,
    error: 'Python 3.8+ not found in PATH',
  };
}

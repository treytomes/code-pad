import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

const execAsync = promisify(exec);

// Import logger - but make it optional for tests
let logInfo: (msg: string, ...args: any[]) => void = console.log;
let logError: (msg: string, error?: any) => void = console.error;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const logger = require('../shared/logger');
  logInfo = logger.logInfo;
  logError = logger.logError;
} catch (_e) {
  // Logger not available (e.g., in tests), use console
}

export interface VirtualEnvironmentInfo {
  exists: boolean;
  path?: string;
  pythonPath?: string;
  pipPath?: string;
}

export interface PackageInstallResult {
  success: boolean;
  installedPackages: string[];
  failedPackages: string[];
  stdout: string;
  stderr: string;
}

export class PipManager {
  private venvPath: string;
  private pythonPath: string;
  private pipPath: string;

  constructor() {
    // Use app.getPath('userData') for cross-platform support
    // e.g., ~/.config/codepad/venv on Linux, %APPDATA%\codepad\venv on Windows
    this.venvPath = path.join(app.getPath('userData'), 'venv');

    // Platform-specific paths
    if (process.platform === 'win32') {
      this.pythonPath = path.join(this.venvPath, 'Scripts', 'python.exe');
      this.pipPath = path.join(this.venvPath, 'Scripts', 'pip.exe');
    } else {
      this.pythonPath = path.join(this.venvPath, 'bin', 'python');
      this.pipPath = path.join(this.venvPath, 'bin', 'pip');
    }
  }

  /**
   * Get information about the virtual environment
   */
  async getVenvInfo(): Promise<VirtualEnvironmentInfo> {
    const exists = fs.existsSync(this.venvPath);
    if (!exists) {
      return { exists: false };
    }

    return {
      exists: true,
      path: this.venvPath,
      pythonPath: this.pythonPath,
      pipPath: this.pipPath,
    };
  }

  /**
   * Create the CodePad virtual environment
   */
  async createVenv(): Promise<{ success: boolean; error?: string }> {
    try {
      logInfo('Creating virtual environment at:', this.venvPath);

      // Find system Python
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

      // Check if Python is available
      try {
        await execAsync(`${pythonCmd} --version`);
      } catch (error) {
        logError('Python not found', error);
        return {
          success: false,
          error: 'Python not found. Please install Python 3.8+ and ensure it is in PATH.',
        };
      }

      // Create venv
      logInfo(`Running: ${pythonCmd} -m venv "${this.venvPath}"`);
      await execAsync(`${pythonCmd} -m venv "${this.venvPath}"`, {
        timeout: 120000, // 2 minute timeout
      });

      // Upgrade pip
      logInfo('Upgrading pip...');
      await execAsync(`"${this.pythonPath}" -m pip install --upgrade pip`, {
        timeout: 120000,
      });

      logInfo('Virtual environment created successfully');
      return { success: true };
    } catch (error) {
      logError('Failed to create virtual environment', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Install packages to the virtual environment
   */
  async installPackages(packages: string[]): Promise<PackageInstallResult> {
    const result: PackageInstallResult = {
      success: false,
      installedPackages: [],
      failedPackages: [],
      stdout: '',
      stderr: '',
    };

    if (packages.length === 0) {
      result.success = true;
      return result;
    }

    // Ensure venv exists
    const venvInfo = await this.getVenvInfo();
    if (!venvInfo.exists) {
      logInfo('Virtual environment does not exist, creating...');
      const createResult = await this.createVenv();
      if (!createResult.success) {
        result.stderr = `Failed to create virtual environment: ${createResult.error}`;
        result.failedPackages = packages;
        return result;
      }
    }

    // Install all packages in one command for efficiency
    try {
      logInfo(`Installing packages: ${packages.join(', ')}`);
      const pkgList = packages.map((p) => `"${p}"`).join(' ');
      const { stdout, stderr } = await execAsync(`"${this.pipPath}" install ${pkgList}`, {
        timeout: 300000, // 5 minute timeout
      });

      result.stdout = stdout;
      result.stderr = stderr;

      // Parse output to determine which packages were installed
      // Look for "Successfully installed" line
      const successMatch = stdout.match(/Successfully installed (.+)/);
      if (successMatch) {
        const installed = successMatch[1].trim().split(/\s+/);
        result.installedPackages = installed;
      } else {
        // If no "Successfully installed" line, assume all succeeded (might be already installed)
        result.installedPackages = packages;
      }

      result.success = true;
      logInfo(`Successfully installed: ${result.installedPackages.join(', ')}`);
    } catch (error) {
      logError('Package installation failed', error);
      result.failedPackages = packages;
      result.stderr += error instanceof Error ? error.message : String(error);
      result.success = false;
    }

    return result;
  }

  /**
   * List installed packages in the virtual environment
   */
  async listInstalled(): Promise<Record<string, string>> {
    try {
      const venvInfo = await this.getVenvInfo();
      if (!venvInfo.exists) {
        return {};
      }

      const { stdout } = await execAsync(`"${this.pipPath}" list --format=json`, {
        timeout: 30000,
      });

      const packages = JSON.parse(stdout) as Array<{ name: string; version: string }>;

      const result: Record<string, string> = {};
      for (const pkg of packages) {
        result[pkg.name] = pkg.version;
      }

      return result;
    } catch (error) {
      logError('Failed to list installed packages', error);
      return {};
    }
  }

  /**
   * Get the Python path from the virtual environment (for execution)
   */
  getPythonPath(): string | undefined {
    const venvInfo = fs.existsSync(this.venvPath);
    return venvInfo ? this.pythonPath : undefined;
  }
}

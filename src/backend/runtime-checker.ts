import { execFile } from 'child_process';
import { promisify } from 'util';
import { logInfo, logError, logWarn } from '../shared/logger';

const execFileAsync = promisify(execFile);

export interface RuntimeInfo {
  hasDotnet: boolean;
  hasDotnetScript: boolean;
  dotnetVersion?: string;
  dotnetScriptVersion?: string;
  error?: string;
}

/**
 * Check if .NET SDK is installed and available
 */
async function checkDotnetSdk(): Promise<{ available: boolean; version?: string }> {
  try {
    const { stdout } = await execFileAsync('dotnet', ['--version'], {
      timeout: 5000,
    });
    const version = stdout.trim();
    logInfo(`Found .NET SDK version: ${version}`);
    return { available: true, version };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      logWarn('.NET SDK not found in PATH');
    } else {
      logError('Error checking .NET SDK', error);
    }
    return { available: false };
  }
}

/**
 * Check if dotnet-script is installed
 */
async function checkDotnetScript(): Promise<{ available: boolean; version?: string }> {
  try {
    const { stdout } = await execFileAsync('dotnet-script', ['--version'], {
      timeout: 5000,
    });
    const version = stdout.trim();
    logInfo(`Found dotnet-script version: ${version}`);
    return { available: true, version };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      logWarn('dotnet-script not found in PATH');
    } else {
      logError('Error checking dotnet-script', error);
    }
    return { available: false };
  }
}

/**
 * Check all runtime requirements
 */
export async function checkRuntimeRequirements(): Promise<RuntimeInfo> {
  logInfo('Checking runtime requirements...');

  const [dotnet, dotnetScript] = await Promise.all([checkDotnetSdk(), checkDotnetScript()]);

  const info: RuntimeInfo = {
    hasDotnet: dotnet.available,
    hasDotnetScript: dotnetScript.available,
    dotnetVersion: dotnet.version,
    dotnetScriptVersion: dotnetScript.version,
  };

  if (!info.hasDotnet) {
    info.error = '.NET SDK is not installed or not found in PATH';
    logError('Runtime check failed: .NET SDK missing');
  } else if (!info.hasDotnetScript) {
    info.error = 'dotnet-script is not installed';
    logError('Runtime check failed: dotnet-script missing');
  } else {
    logInfo('All runtime requirements met');
  }

  return info;
}

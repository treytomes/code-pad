/**
 * Startup timing telemetry for measuring application performance.
 * Records key milestones during application startup.
 */

export interface StartupTiming {
  processStart: number;          // Always 0 (reference point)
  electronReady: number;         // ms from process start
  windowCreated: number;         // ms from process start
  windowShown: number;           // ms from process start
  databaseConnected: number;     // ms from process start
  reactMounted: number;          // ms from process start
  monacoLoaded: number;          // ms from process start
  appInteractive: number;        // ms from process start (all critical components ready)
}

export interface StartupTimingData {
  timing: Partial<StartupTiming>;
  startTime: number;             // performance.now() when tracking started
}

class StartupTimingTracker {
  private timing: Partial<StartupTiming> = { processStart: 0 };
  private startTime: number;

  constructor() {
    // Use performance.now() for high-resolution timing
    this.startTime = performance.now();
  }

  /**
   * Mark a milestone in the startup sequence
   */
  mark(milestone: keyof Omit<StartupTiming, 'processStart'>): void {
    if (!this.timing[milestone]) {
      const elapsed = performance.now() - this.startTime;
      this.timing[milestone] = Math.round(elapsed);
    }
  }

  /**
   * Get current timing data
   */
  getTiming(): Partial<StartupTiming> {
    return { ...this.timing };
  }

  /**
   * Get formatted timing report
   */
  getReport(): string {
    const lines: string[] = ['=== Startup Timing Report ==='];

    const milestones: Array<keyof StartupTiming> = [
      'processStart',
      'electronReady',
      'windowCreated',
      'windowShown',
      'databaseConnected',
      'reactMounted',
      'monacoLoaded',
      'appInteractive',
    ];

    let previous = 0;
    for (const milestone of milestones) {
      const time = this.timing[milestone];
      if (time !== undefined) {
        const delta = time - previous;
        lines.push(`  ${milestone.padEnd(20)} ${String(time).padStart(6)}ms (+${delta}ms)`);
        previous = time;
      }
    }

    return lines.join('\n');
  }

  /**
   * Check if target metrics are met
   */
  checkTargets(): {
    windowVisible: { actual: number; target: number; met: boolean };
    appInteractive: { actual: number; target: number; met: boolean };
  } {
    const windowVisible = this.timing.windowShown ?? 0;
    const appInteractive = this.timing.appInteractive ?? 0;

    return {
      windowVisible: {
        actual: windowVisible,
        target: 2000,
        met: windowVisible <= 2000,
      },
      appInteractive: {
        actual: appInteractive,
        target: 3000,
        met: appInteractive <= 3000,
      },
    };
  }
}

// Global singleton tracker
export const startupTiming = new StartupTimingTracker();

/**
 * Log startup timing to console in development mode
 */
export function logStartupTiming(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(startupTiming.getReport());

    const targets = startupTiming.checkTargets();
    console.log('\n=== Performance Targets ===');
    console.log(
      `  Window visible:   ${targets.windowVisible.actual}ms / ${targets.windowVisible.target}ms ${
        targets.windowVisible.met ? '✅' : '❌'
      }`
    );
    console.log(
      `  App interactive:  ${targets.appInteractive.actual}ms / ${targets.appInteractive.target}ms ${
        targets.appInteractive.met ? '✅' : '❌'
      }`
    );
  }
}

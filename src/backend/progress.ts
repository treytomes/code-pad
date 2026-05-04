export const PROGRESS_PREFIX = '##CODEPAD:PROGRESS:';

export interface ProgressEvent {
  value: number;
  max: number;
  label?: string;
}

export function parseProgressLine(line: string): ProgressEvent | null {
  if (!line.startsWith(PROGRESS_PREFIX)) return null;
  try {
    const raw = JSON.parse(line.slice(PROGRESS_PREFIX.length)) as Record<string, unknown>;
    const max = typeof raw.max === 'number' ? raw.max : 100;
    const rawValue = typeof raw.value === 'number' ? raw.value : 0;
    const value = Math.max(0, Math.min(max, rawValue));
    const label = typeof raw.label === 'string' ? raw.label : undefined;
    return { value, max, label };
  } catch {
    return null;
  }
}

export function extractProgressEvents(chunk: string): ProgressEvent[] {
  return chunk
    .split('\n')
    .map(parseProgressLine)
    .filter((e): e is ProgressEvent => e !== null);
}

export function stripProgressLines(output: string): string {
  return output
    .split('\n')
    .filter((line) => !line.startsWith(PROGRESS_PREFIX))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n'); // collapse any blank-line runs left behind
}

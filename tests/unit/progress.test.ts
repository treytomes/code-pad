import { describe, it, expect } from 'vitest';
import {
  PROGRESS_PREFIX,
  parseProgressLine,
  extractProgressEvents,
  stripProgressLines,
} from '../../src/backend/progress';

describe('parseProgressLine', () => {
  it('parses a full progress line with all fields', () => {
    const line = `${PROGRESS_PREFIX}{"value":50,"max":100,"label":"Processing..."}`;
    const result = parseProgressLine(line);
    expect(result).not.toBeNull();
    expect(result?.value).toBe(50);
    expect(result?.max).toBe(100);
    expect(result?.label).toBe('Processing...');
  });

  it('parses a progress line with only value and max', () => {
    const line = `${PROGRESS_PREFIX}{"value":3,"max":10}`;
    const result = parseProgressLine(line);
    expect(result).not.toBeNull();
    expect(result?.value).toBe(3);
    expect(result?.max).toBe(10);
    expect(result?.label).toBeUndefined();
  });

  it('returns null for non-progress lines', () => {
    expect(parseProgressLine('Hello, world!')).toBeNull();
    expect(parseProgressLine('=== Label ===')).toBeNull();
    expect(parseProgressLine('')).toBeNull();
  });

  it('returns null for malformed JSON after prefix', () => {
    const line = `${PROGRESS_PREFIX}not-json`;
    expect(parseProgressLine(line)).toBeNull();
  });

  it('clamps value to [0, max]', () => {
    const over = `${PROGRESS_PREFIX}{"value":150,"max":100}`;
    expect(parseProgressLine(over)?.value).toBe(100);

    const under = `${PROGRESS_PREFIX}{"value":-5,"max":100}`;
    expect(parseProgressLine(under)?.value).toBe(0);
  });

  it('uses default max of 100 when not specified', () => {
    const line = `${PROGRESS_PREFIX}{"value":42}`;
    const result = parseProgressLine(line);
    expect(result?.max).toBe(100);
  });
});

describe('extractProgressEvents', () => {
  it('returns progress events from a chunk containing one progress line', () => {
    const chunk = `${PROGRESS_PREFIX}{"value":25,"max":100,"label":"Step 1"}\n`;
    const events = extractProgressEvents(chunk);
    expect(events).toHaveLength(1);
    expect(events[0].value).toBe(25);
    expect(events[0].label).toBe('Step 1');
  });

  it('returns empty array when no progress lines', () => {
    expect(extractProgressEvents('Hello\nWorld\n')).toHaveLength(0);
  });

  it('handles multiple progress lines in one chunk', () => {
    const chunk =
      `${PROGRESS_PREFIX}{"value":10,"max":100}\n` +
      `${PROGRESS_PREFIX}{"value":20,"max":100}\n`;
    const events = extractProgressEvents(chunk);
    expect(events).toHaveLength(2);
    expect(events[0].value).toBe(10);
    expect(events[1].value).toBe(20);
  });
});

describe('stripProgressLines', () => {
  it('removes progress lines from output', () => {
    const output =
      `Hello\n${PROGRESS_PREFIX}{"value":50,"max":100}\nWorld\n`;
    expect(stripProgressLines(output)).toBe('Hello\nWorld\n');
  });

  it('returns unchanged string when no progress lines', () => {
    expect(stripProgressLines('just plain text\n')).toBe('just plain text\n');
  });

  it('handles progress lines at start and end', () => {
    const output =
      `${PROGRESS_PREFIX}{"value":0,"max":10}\nSome output\n${PROGRESS_PREFIX}{"value":10,"max":10}\n`;
    expect(stripProgressLines(output)).toBe('Some output\n');
  });
});

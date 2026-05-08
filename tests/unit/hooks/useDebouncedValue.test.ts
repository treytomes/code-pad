import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDebouncedValue } from '../../../src/renderer/hooks/useDebouncedValue';

describe('useDebouncedValue', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    // Initial value
    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 300 });

    // Should still show old value immediately after change
    expect(result.current).toBe('initial');

    // Wait for debounce delay
    await waitFor(
      () => {
        expect(result.current).toBe('updated');
      },
      { timeout: 400 }
    );
  });

  it('should cancel previous debounce on rapid changes', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      {
        initialProps: { value: 'initial' },
      }
    );

    // Rapid changes
    rerender({ value: 'a' });
    vi.advanceTimersByTime(100);

    rerender({ value: 'ab' });
    vi.advanceTimersByTime(100);

    rerender({ value: 'abc' });
    vi.advanceTimersByTime(100);

    // Still showing initial because we haven't waited full 300ms since last change
    expect(result.current).toBe('initial');

    // Now wait full 300ms from last change
    vi.advanceTimersByTime(200);

    // Should show final value
    expect(result.current).toBe('abc');

    vi.useRealTimers();
  });

  it('should handle different delay values', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      {
        initialProps: { value: 'initial', delay: 100 },
      }
    );

    rerender({ value: 'updated', delay: 100 });

    // Wait 100ms
    vi.advanceTimersByTime(100);

    expect(result.current).toBe('updated');

    vi.useRealTimers();
  });

  it('should handle non-string values', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      {
        initialProps: { value: 0 },
      }
    );

    expect(result.current).toBe(0);

    rerender({ value: 42 });
    vi.advanceTimersByTime(300);

    expect(result.current).toBe(42);

    vi.useRealTimers();
  });

  it('should handle object values', async () => {
    vi.useFakeTimers();

    const initialObj = { name: 'Alice', age: 30 };
    const updatedObj = { name: 'Bob', age: 25 };

    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      {
        initialProps: { value: initialObj },
      }
    );

    expect(result.current).toBe(initialObj);

    rerender({ value: updatedObj });
    vi.advanceTimersByTime(300);

    expect(result.current).toBe(updatedObj);

    vi.useRealTimers();
  });

  it('should use default delay of 300ms when not specified', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });

    // Before 300ms
    vi.advanceTimersByTime(299);
    expect(result.current).toBe('initial');

    // At 300ms
    vi.advanceTimersByTime(1);
    expect(result.current).toBe('updated');

    vi.useRealTimers();
  });
});

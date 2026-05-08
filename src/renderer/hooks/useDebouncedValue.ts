import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing a value.
 * Returns the debounced value after the specified delay.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 *
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebouncedValue(searchQuery, 300);
 *
 * // Use debouncedQuery for expensive operations
 * useEffect(() => {
 *   performSearch(debouncedQuery);
 * }, [debouncedQuery]);
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timer to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancel timer if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

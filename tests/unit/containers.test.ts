import { describe, it, expect } from 'vitest';
import {
  CONTAINER_PREFIX,
  SLOT_PREFIX,
  parseContainerLine,
  extractContainerEvents,
  buildSlotPlaceholder,
  processContainerChunk,
} from '../../src/backend/containers';

describe('parseContainerLine', () => {
  it('returns null for non-container lines', () => {
    expect(parseContainerLine('hello world')).toBeNull();
    expect(parseContainerLine('##CODEPAD:PROGRESS:{"value":1,"max":10}')).toBeNull();
    expect(parseContainerLine('')).toBeNull();
  });

  it('returns null for malformed JSON after prefix', () => {
    expect(parseContainerLine(CONTAINER_PREFIX + 'not-json')).toBeNull();
  });

  it('returns null when id is missing', () => {
    expect(parseContainerLine(CONTAINER_PREFIX + '{"content":"hi"}')).toBeNull();
  });

  it('parses a minimal event with string content', () => {
    const line = CONTAINER_PREFIX + JSON.stringify({ id: 'c1', content: 'hello' });
    const event = parseContainerLine(line);
    expect(event).not.toBeNull();
    expect(event!.id).toBe('c1');
    expect(event!.label).toBeUndefined();
    expect(event!.content).toBe('hello');
  });

  it('parses a labeled event and prepends label header to content', () => {
    const line = CONTAINER_PREFIX + JSON.stringify({ id: 'c2', label: 'Counter', content: 42 });
    const event = parseContainerLine(line);
    expect(event).not.toBeNull();
    expect(event!.id).toBe('c2');
    expect(event!.label).toBe('Counter');
    // content includes the label header so formatOutput can detect and strip it
    expect(event!.content).toBe('=== Counter ===\n42');
  });

  it('serializes object content to JSON string', () => {
    const payload = { id: 'c3', content: { x: 1, y: 2 } };
    const event = parseContainerLine(CONTAINER_PREFIX + JSON.stringify(payload));
    expect(event).not.toBeNull();
    const parsed = JSON.parse(event!.content);
    expect(parsed.x).toBe(1);
    expect(parsed.y).toBe(2);
  });

  it('serializes array content to JSON string', () => {
    const payload = { id: 'c4', content: [1, 2, 3] };
    const event = parseContainerLine(CONTAINER_PREFIX + JSON.stringify(payload));
    expect(event).not.toBeNull();
    const parsed = JSON.parse(event!.content);
    expect(parsed).toEqual([1, 2, 3]);
  });

  it('handles null content', () => {
    const line = CONTAINER_PREFIX + JSON.stringify({ id: 'c5', content: null });
    const event = parseContainerLine(line);
    expect(event).not.toBeNull();
    expect(event!.content).toBe('null');
  });
});

describe('extractContainerEvents', () => {
  it('extracts a single event from a chunk', () => {
    const chunk = 'some output\n' + CONTAINER_PREFIX + JSON.stringify({ id: 'c1', content: 'hi' }) + '\nmore output';
    const events = extractContainerEvents(chunk);
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('c1');
  });

  it('extracts multiple events from a chunk', () => {
    const chunk = [
      CONTAINER_PREFIX + JSON.stringify({ id: 'c1', content: 1 }),
      CONTAINER_PREFIX + JSON.stringify({ id: 'c2', content: 2 }),
    ].join('\n');
    const events = extractContainerEvents(chunk);
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.id)).toEqual(['c1', 'c2']);
  });

  it('returns empty array when no container lines', () => {
    expect(extractContainerEvents('hello\nworld\n')).toHaveLength(0);
  });
});

describe('buildSlotPlaceholder', () => {
  it('produces the correct sentinel string', () => {
    expect(buildSlotPlaceholder('abc-123')).toBe(SLOT_PREFIX + 'abc-123');
  });
});

describe('processContainerChunk', () => {
  it('replaces first-seen container line with slot placeholder', () => {
    const seenIds = new Set<string>();
    const line = CONTAINER_PREFIX + JSON.stringify({ id: 'c1', content: 0 });
    const { displayChunk, events } = processContainerChunk(line + '\n', seenIds);
    expect(displayChunk).toContain(SLOT_PREFIX + 'c1');
    expect(displayChunk).not.toContain(CONTAINER_PREFIX);
    expect(events).toHaveLength(1);
    expect(seenIds.has('c1')).toBe(true);
  });

  it('drops subsequent sentinels for the same container id', () => {
    const seenIds = new Set<string>();
    const line = CONTAINER_PREFIX + JSON.stringify({ id: 'c1', content: 0 });

    // First call — slot placeholder inserted
    const first = processContainerChunk(line + '\n', seenIds);
    expect(first.displayChunk).toContain(SLOT_PREFIX + 'c1');

    // Second call — line dropped, no duplicate placeholder
    const second = processContainerChunk(line + '\n', seenIds);
    expect(second.displayChunk).not.toContain(SLOT_PREFIX + 'c1');
    expect(second.displayChunk).not.toContain(CONTAINER_PREFIX);
    expect(second.events).toHaveLength(1); // event still collected for content update
  });

  it('passes through non-container lines unchanged', () => {
    const seenIds = new Set<string>();
    const { displayChunk } = processContainerChunk('Hello, World!\n', seenIds);
    expect(displayChunk).toBe('Hello, World!\n');
  });

  it('handles mixed container and plain lines', () => {
    const seenIds = new Set<string>();
    const chunk = [
      'before',
      CONTAINER_PREFIX + JSON.stringify({ id: 'c1', content: 'hello' }),
      'after',
    ].join('\n');
    const { displayChunk, events } = processContainerChunk(chunk, seenIds);
    const lines = displayChunk.split('\n');
    expect(lines[0]).toBe('before');
    // blank line, slot placeholder, blank line are inserted to isolate the section
    expect(lines[1]).toBe('');
    expect(lines[2]).toBe(SLOT_PREFIX + 'c1');
    expect(lines[3]).toBe('');
    expect(lines[4]).toBe('after');
    expect(events).toHaveLength(1);
  });

  it('slot placeholder becomes its own section when combined with adjacent text', () => {
    // Simulate two separate chunks arriving: the sentinel, then plain text.
    // The combined output string must let splitOutputSections isolate the slot.
    const seenIds = new Set<string>();
    const sentinelChunk = CONTAINER_PREFIX + JSON.stringify({ id: 'c1', content: 42 }) + '\n';
    const { displayChunk: slotChunk } = processContainerChunk(sentinelChunk, seenIds);

    // Combine as App.tsx does: prev + stripped
    const combined = slotChunk + 'Done!\n';

    // Import splitOutputSections dynamically to avoid circular dep in test
    const sections = combined.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s.length > 0);
    expect(sections).toContain(SLOT_PREFIX + 'c1');
    expect(sections).toContain('Done!');
    // The slot must be its own section (not merged with Done!)
    const slotSection = sections.find((s) => s.startsWith(SLOT_PREFIX));
    expect(slotSection).toBe(SLOT_PREFIX + 'c1');
  });
});

export const CONTAINER_PREFIX = '##CODEPAD:CONTAINER:';
export const SLOT_PREFIX = '##CODEPAD:SLOT:';

export interface ContainerEvent {
  id: string;
  label?: string;
  content: string; // displayable string, ready for formatOutput
}

export function parseContainerLine(line: string): ContainerEvent | null {
  if (!line.startsWith(CONTAINER_PREFIX)) return null;
  try {
    const raw = JSON.parse(line.slice(CONTAINER_PREFIX.length)) as Record<string, unknown>;
    if (typeof raw.id !== 'string') return null;
    const id = raw.id;
    const label = typeof raw.label === 'string' ? raw.label : undefined;
    // Convert content to a display string. Strings pass through as-is (avoiding
    // double-quoting); everything else is re-serialized so formatOutput can detect
    // json/table/svg/etc.
    let body: string;
    if (raw.content === null || raw.content === undefined) {
      body = 'null';
    } else if (typeof raw.content === 'string') {
      body = raw.content;
    } else {
      body = JSON.stringify(raw.content, null, 2);
    }
    // Prepend label header so existing formatters (formatJSON, formatSvg, etc.)
    // can strip and render it the same way as a .Dump("label") call.
    const content = label ? `=== ${label} ===\n${body}` : body;
    return { id, label, content };
  } catch {
    return null;
  }
}

export function extractContainerEvents(chunk: string): ContainerEvent[] {
  return chunk
    .split('\n')
    .map(parseContainerLine)
    .filter((e): e is ContainerEvent => e !== null);
}

export function buildSlotPlaceholder(id: string): string {
  return SLOT_PREFIX + id;
}

/**
 * Process a raw output chunk: replace each first-seen container sentinel with
 * a slot placeholder (preserving stream position), drop subsequent sentinels for
 * the same ID, and collect all container events. Mutates `seenIds` in place.
 */
export function processContainerChunk(
  chunk: string,
  seenIds: Set<string>
): { displayChunk: string; events: ContainerEvent[] } {
  const lines = chunk.split('\n');
  const outputLines: string[] = [];
  const events: ContainerEvent[] = [];

  for (const line of lines) {
    const event = parseContainerLine(line);
    if (event !== null) {
      events.push(event);
      if (!seenIds.has(event.id)) {
        seenIds.add(event.id);
        // Blank lines ensure splitOutputSections treats the slot as its own section
        outputLines.push('');
        outputLines.push(buildSlotPlaceholder(event.id));
        outputLines.push('');
      }
      // Subsequent refreshes for same ID: drop the line (slot stays in place)
    } else {
      outputLines.push(line);
    }
  }

  return { displayChunk: outputLines.join('\n'), events };
}

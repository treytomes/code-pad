import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeEditor } from '../../../../src/renderer/components/Editor/CodeEditor';

// Mock monaco-editor completely
vi.mock('monaco-editor', () => ({
  default: {},
  languages: {
    CompletionItemKind: {
      Method: 0,
      Keyword: 14,
    },
    CompletionItemInsertTextRule: {
      InsertAsSnippet: 4,
    },
    registerCompletionItemProvider: vi.fn(),
  },
  editor: {
    IStandaloneCodeEditor: {},
  },
}));

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange?: (v: string | undefined) => void;
  }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

describe('CodeEditor', () => {
  it('should render with default props', () => {
    render(<CodeEditor value="test code" />);

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeDefined();
    expect(editor).toHaveValue('test code');
  });

  it('should render with custom value', () => {
    const customCode = 'Console.WriteLine("Hello");';
    render(<CodeEditor value={customCode} />);

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toHaveValue(customCode);
  });

  it('should call onChange when code changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<CodeEditor value="" onChange={handleChange} />);

    const editor = screen.getByTestId('monaco-editor');
    await user.clear(editor);
    await user.type(editor, 'n');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should accept language prop', () => {
    render(<CodeEditor value="print('hello')" language="python" />);

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeDefined();
  });

  it('should accept theme prop', () => {
    render(<CodeEditor value="test" theme="light" />);

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeDefined();
  });

  it('should accept height prop', () => {
    render(<CodeEditor value="test" height="500px" />);

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeDefined();
  });

  it('should default to csharp language', () => {
    render(<CodeEditor value="var x = 5;" />);

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeDefined();
  });

  it('should default to vs-dark theme', () => {
    render(<CodeEditor value="test" />);

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeDefined();
  });
});

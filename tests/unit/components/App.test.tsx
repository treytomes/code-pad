import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../../src/renderer/App';

// Mock Monaco Editor
vi.mock('monaco-editor', () => ({
  default: {},
  languages: {
    CompletionItemKind: { Method: 0, Keyword: 14 },
    CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
    registerCompletionItemProvider: vi.fn(),
  },
  editor: { IStandaloneCodeEditor: {} },
}));

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

// Mock window.electronAPI
const mockElectronAPI = {
  executeCode: vi.fn(),
  onOutputChunk: vi.fn(() => vi.fn()), // Returns cleanup function
  db: {
    createSnippet: vi.fn(),
    updateSnippet: vi.fn(),
    deleteSnippet: vi.fn(),
    listSnippets: vi.fn(),
    incrementExecution: vi.fn(),
  },
};

(global as any).window = {
  electronAPI: mockElectronAPI,
};

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.db.listSnippets.mockResolvedValue([]);
    mockElectronAPI.executeCode.mockResolvedValue({
      stdout: 'Hello World',
      stderr: '',
      exitCode: 0,
      executionTime: 100,
      timedOut: false,
    });
  });

  it('should render with default code', () => {
    render(<App />);

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeDefined();
    expect((editor as HTMLTextAreaElement).value).toContain('Welcome to CodePad');
  });

  it('should show "Save As..." button when no snippet is loaded', () => {
    render(<App />);

    const saveButton = screen.getByText('Save As...');
    expect(saveButton).toBeDefined();
  });

  it('should show "Save" and "Save As..." buttons when snippet is loaded', async () => {
    const user = userEvent.setup();
    const mockSnippet = {
      id: '123',
      name: 'Test Snippet',
      language: 'csharp',
      code: 'Console.WriteLine("Test");',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      executionCount: 0,
    };

    mockElectronAPI.db.listSnippets.mockResolvedValue([mockSnippet]);
    mockElectronAPI.db.createSnippet.mockResolvedValue(mockSnippet);

    render(<App />);

    // Create and load a snippet by saving
    const saveAsButton = screen.getByText('Save As...');
    await user.click(saveAsButton);

    // Fill in snippet name in modal
    const nameInput = await screen.findByPlaceholderText(/name/i);
    await user.type(nameInput, 'Test Snippet');

    const confirmButton = screen.getByText('OK');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockElectronAPI.db.createSnippet).toHaveBeenCalled();
    });

    // Now should show both Save and Save As buttons
    await waitFor(() => {
      expect(screen.getByText('Save')).toBeDefined();
      expect(screen.getAllByText('Save As...').length).toBeGreaterThan(0);
    });
  });

  it('should call updateSnippet when Save is clicked', async () => {
    const user = userEvent.setup();
    const mockSnippet = {
      id: '123',
      name: 'Test Snippet',
      language: 'csharp',
      code: 'Console.WriteLine("Test");',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      executionCount: 0,
    };

    mockElectronAPI.db.createSnippet.mockResolvedValue(mockSnippet);
    mockElectronAPI.db.listSnippets.mockResolvedValue([mockSnippet]);

    render(<App />);

    // Create a snippet first
    const saveAsButton = screen.getByText('Save As...');
    await user.click(saveAsButton);

    const nameInput = await screen.findByPlaceholderText(/name/i);
    await user.type(nameInput, 'Test Snippet');

    const confirmButton = screen.getByText('OK');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockElectronAPI.db.createSnippet).toHaveBeenCalled();
    });

    // Modify the code
    const editor = screen.getByTestId('monaco-editor');
    await user.clear(editor);
    await user.type(editor, 'var x = 5;');

    // Click Save
    const saveButton = await screen.findByText('Save');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockElectronAPI.db.updateSnippet).toHaveBeenCalledWith('123', {
        code: expect.any(String),
      });
    });
  });

  it('should create new snippet when Save As is clicked on loaded snippet', async () => {
    const user = userEvent.setup();
    const existingSnippet = {
      id: '123',
      name: 'Existing Snippet',
      language: 'csharp',
      code: 'Console.WriteLine("Existing");',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      executionCount: 0,
    };

    const newSnippet = {
      id: '456',
      name: 'New Copy',
      language: 'csharp',
      code: 'Console.WriteLine("Existing");',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      executionCount: 0,
    };

    mockElectronAPI.db.createSnippet
      .mockResolvedValueOnce(existingSnippet)
      .mockResolvedValueOnce(newSnippet);
    mockElectronAPI.db.listSnippets.mockResolvedValue([existingSnippet]);

    render(<App />);

    // Create first snippet
    const initialSaveAs = screen.getByText('Save As...');
    await user.click(initialSaveAs);

    let nameInput = await screen.findByPlaceholderText(/name/i);
    await user.type(nameInput, 'Existing Snippet');

    let confirmButton = screen.getByText('OK');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockElectronAPI.db.createSnippet).toHaveBeenCalledTimes(1);
    });

    // Now click Save As again to create a copy
    const saveAsButtons = await screen.findAllByText('Save As...');
    await user.click(saveAsButtons[0]);

    nameInput = await screen.findByPlaceholderText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'New Copy');

    confirmButton = screen.getByText('OK');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockElectronAPI.db.createSnippet).toHaveBeenCalledTimes(2);
      expect(mockElectronAPI.db.createSnippet).toHaveBeenLastCalledWith({
        name: 'New Copy',
        language: 'csharp',
        code: expect.any(String),
      });
    });
  });

  it('should execute code when Run Code button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    const runButton = screen.getByText('Run Code');
    await user.click(runButton);

    await waitFor(() => {
      expect(mockElectronAPI.executeCode).toHaveBeenCalled();
    });
  });

  it('should handle keyboard shortcut Ctrl+S for save', async () => {
    const user = userEvent.setup();
    const mockSnippet = {
      id: '123',
      name: 'Test',
      language: 'csharp',
      code: 'var x = 1;',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      executionCount: 0,
    };

    mockElectronAPI.db.createSnippet.mockResolvedValue(mockSnippet);
    mockElectronAPI.db.listSnippets.mockResolvedValue([mockSnippet]);

    render(<App />);

    // First save to create snippet
    await user.keyboard('{Control>}s{/Control}');

    await waitFor(() => {
      const modal = screen.queryByRole('dialog');
      expect(modal).toBeTruthy();
    });
  });

  it('should handle keyboard shortcut F5 for run', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('{F5}');

    await waitFor(() => {
      expect(mockElectronAPI.executeCode).toHaveBeenCalled();
    });
  });

  it('should handle keyboard shortcut Ctrl+N for new snippet', async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByTestId('monaco-editor');

    // Type some code
    await user.clear(editor);
    await user.type(editor, 'var x = 5;');

    // Press Ctrl+N
    await user.keyboard('{Control>}n{/Control}');

    // Should reset to default code
    await waitFor(() => {
      expect((editor as HTMLTextAreaElement).value).toContain(
        'Welcome to CodePad'
      );
    });
  });

  it('should display execution time after running code', async () => {
    const user = userEvent.setup();
    render(<App />);

    const runButton = screen.getByText('Run Code');
    await user.click(runButton);

    await waitFor(() => {
      // Look for execution time display (should show something like "100ms")
      const timeDisplay = screen.queryByText(/\d+ms/);
      expect(timeDisplay).toBeTruthy();
    });
  });

  it('should show loading state while code is running', async () => {
    const user = userEvent.setup();

    // Make execution take longer
    mockElectronAPI.executeCode.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                stdout: 'Done',
                stderr: '',
                exitCode: 0,
                executionTime: 500,
                timedOut: false,
              }),
            500
          )
        )
    );

    render(<App />);

    const runButton = screen.getByText('Run Code');
    await user.click(runButton);

    // Button should show loading state
    await waitFor(() => {
      expect(runButton.getAttribute('class')).toContain('loading');
    });
  });

  it('should clear output when Clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Run code first to generate output
    const runButton = screen.getByText('Run Code');
    await user.click(runButton);

    await waitFor(() => {
      expect(screen.getByText(/Hello World/)).toBeDefined();
    });

    // Click Clear button
    const clearButton = screen.getByTitle(/clear/i);
    await user.click(clearButton);

    // Output should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/Hello World/)).toBeNull();
    });
  });
});

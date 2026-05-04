import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
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
  default: ({ value, onChange }: { value: string; onChange?: (v: string | undefined) => void }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

// Capture the output chunk callback so tests can trigger streaming output
let outputChunkCallback: ((chunk: string, isError: boolean) => void) | null = null;

// Mock window.electronAPI
const mockElectronAPI = {
  executeCode: vi.fn(),
  stopExecution: vi.fn(),
  checkRuntime: vi.fn(),
  installDotnetScript: vi.fn(),
  onDotnetScriptInstallResult: vi.fn(() => vi.fn()), // Returns cleanup function
  onOutputChunk: vi.fn((cb: (chunk: string, isError: boolean) => void) => {
    outputChunkCallback = cb;
    return vi.fn(); // cleanup function
  }),
  onOutputDone: vi.fn(() => Promise.resolve()),
  onMenuEvent: vi.fn(() => vi.fn()), // Returns cleanup function
  exportSnippet: vi.fn(),
  importSnippet: vi.fn(),
  exportAllSnippets: vi.fn(),
  versions: {
    electron: '1.0.0',
    chrome: '100.0.0',
    node: '18.0.0',
  },
  db: {
    createSnippet: vi.fn(),
    getSnippet: vi.fn(),
    updateSnippet: vi.fn(),
    deleteSnippet: vi.fn(),
    listSnippets: vi.fn(),
    incrementExecution: vi.fn(),
    toggleStarred: vi.fn(),
    getStarredSnippets: vi.fn(),
    getRecentlyOpened: vi.fn(),
    getAllTags: vi.fn(),
    updateLastOpened: vi.fn(),
  },
};

(window as any).electronAPI = mockElectronAPI;

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    outputChunkCallback = null;
    // Suppress WelcomeModal so it doesn't interfere with dialog queries
    localStorage.setItem('codepad-welcomed', '1');
    mockElectronAPI.onOutputChunk.mockImplementation(
      (cb: (chunk: string, isError: boolean) => void) => {
        outputChunkCallback = cb;
        return vi.fn();
      }
    );
    mockElectronAPI.db.listSnippets.mockResolvedValue([]);
    mockElectronAPI.db.getStarredSnippets.mockResolvedValue([]);
    mockElectronAPI.db.getRecentlyOpened.mockResolvedValue([]);
    mockElectronAPI.db.toggleStarred.mockResolvedValue(true);
    mockElectronAPI.db.updateLastOpened.mockResolvedValue(true);
    mockElectronAPI.db.getAllTags.mockResolvedValue([]);
    mockElectronAPI.checkRuntime.mockResolvedValue({
      hasDotnet: true,
      hasDotnetScript: true,
      dotnetVersion: '8.0.0',
      dotnetScriptVersion: '1.5.0',
    });
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
      expect(screen.getByTitle(/^Save \(Ctrl\+S\)/)).toBeDefined();
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

    // Click Save — button title is stable even when text shows "Save *" for unsaved changes
    const saveButton = await screen.findByTitle(/^Save \(Ctrl\+S\)/);
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockElectronAPI.db.updateSnippet).toHaveBeenCalledWith('123', {
        code: expect.any(String),
        queryType: expect.any(String),
        usings: expect.any(Array),
        references: expect.any(Array),
        tags: expect.any(Array),
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
        queryType: expect.any(String),
        usings: expect.any(Array),
        references: expect.any(Array),
        tags: expect.any(Array),
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

    // Type some code (causes unsaved changes)
    await user.clear(editor);
    await user.type(editor, 'var x = 5;');

    // Confirm discard dialog when triggered by Ctrl+N
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    // Press Ctrl+N
    await user.keyboard('{Control>}n{/Control}');

    // Should reset to default code
    await waitFor(() => {
      expect((editor as HTMLTextAreaElement).value).toContain('// Welcome to CodePad');
    });
  });

  it('should display execution time after running code', async () => {
    const user = userEvent.setup();
    render(<App />);

    const runButton = screen.getByText('Run Code');
    await user.click(runButton);

    await waitFor(() => {
      // Look for execution time display (should show something like "100ms")
      const timeDisplays = screen.queryAllByText(/\d+ms/);
      expect(timeDisplays.length).toBeGreaterThan(0);
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

    // While running, the Run Code button is replaced by a Stop button
    await waitFor(() => {
      expect(screen.getByText('Stop')).toBeDefined();
    });
  });

  it('should clear output when Clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Run code — output arrives via streaming chunks, not result.stdout
    const runButton = screen.getByText('Run Code');
    await user.click(runButton);

    // Emit output via the streaming callback before execution resolves
    await waitFor(() => {
      expect(outputChunkCallback).not.toBeNull();
    });
    act(() => {
      outputChunkCallback!('Hello World', false);
    });

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

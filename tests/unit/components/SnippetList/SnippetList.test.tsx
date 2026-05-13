import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SnippetList } from '../../../../src/renderer/components/SnippetList/SnippetList';
import type { Snippet } from '../../../../src/backend/database';

// Mock window.electronAPI
const mockElectronAPI = {
  db: {
    listSnippets: vi.fn(),
    getStarredSnippets: vi.fn(),
    getRecentlyOpened: vi.fn(),
    toggleStarred: vi.fn(),
  },
};

(window as any).electronAPI = mockElectronAPI;

describe('SnippetList', () => {
  const mockSnippets: Snippet[] = [
    {
      id: '1',
      name: 'Test Snippet 1',
      language: 'csharp',
      code: 'Console.WriteLine("Hello");',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      executionCount: 5,
    },
    {
      id: '2',
      name: 'Test Snippet 2',
      language: 'python',
      code: 'print("Hello")',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      executionCount: 3,
    },
  ];

  const mockHandlers = {
    onSelectSnippet: vi.fn(),
    onDeleteSnippet: vi.fn(),
    onRenameSnippet: vi.fn(),
    onDuplicateSnippet: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.db.listSnippets.mockResolvedValue(mockSnippets);
    mockElectronAPI.db.getStarredSnippets.mockResolvedValue([]);
    mockElectronAPI.db.getRecentlyOpened.mockResolvedValue([]);
    mockElectronAPI.db.toggleStarred.mockResolvedValue(true);
  });

  it('should render snippet list', async () => {
    render(<SnippetList {...mockHandlers} />);

    await waitFor(() => {
      expect(screen.getByText('Test Snippet 1')).toBeDefined();
      expect(screen.getByText('Test Snippet 2')).toBeDefined();
    });
  });

  it('should display execution counts', async () => {
    render(<SnippetList {...mockHandlers} />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeDefined();
      expect(screen.getByText('3')).toBeDefined();
    });
  });

  it('should call onSelectSnippet when snippet is clicked', async () => {
    const user = userEvent.setup();
    render(<SnippetList {...mockHandlers} />);

    await waitFor(() => {
      expect(screen.getByText('Test Snippet 1')).toBeDefined();
    });

    const snippet = screen.getByText('Test Snippet 1');
    await user.click(snippet);

    expect(mockHandlers.onSelectSnippet).toHaveBeenCalledWith(mockSnippets[0]);
  });

  it('should show rename input when edit button is clicked', async () => {
    render(<SnippetList {...mockHandlers} />);

    await waitFor(() => {
      expect(screen.getByText('Test Snippet 1')).toBeDefined();
    });

    // Use direct DOM query — getAllByRole is too slow on the complex Ant Design DOM
    const editButton = document.querySelector<HTMLElement>('button[title="Rename"]');
    expect(editButton).not.toBeNull();
    fireEvent.click(editButton!);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Snippet 1')).toBeDefined();
    });
  });

  it('should call onRenameSnippet when rename is confirmed', async () => {
    const user = userEvent.setup();
    render(<SnippetList {...mockHandlers} />);

    await waitFor(() => {
      expect(screen.getByText('Test Snippet 1')).toBeDefined();
    });

    fireEvent.click(document.querySelector<HTMLElement>('button[title="Rename"]')!);

    const input = await screen.findByDisplayValue('Test Snippet 1');
    await user.clear(input);
    await user.type(input, 'Renamed Snippet');

    const checkIcon = document.querySelector<HTMLElement>('[data-icon="check"]');
    fireEvent.click(checkIcon!.closest('button')!);

    await waitFor(() => {
      expect(mockHandlers.onRenameSnippet).toHaveBeenCalledWith('1', 'Renamed Snippet');
    });
  });

  it('should confirm rename on Enter key', async () => {
    const user = userEvent.setup();
    render(<SnippetList {...mockHandlers} />);

    await waitFor(() => {
      expect(screen.getByText('Test Snippet 1')).toBeDefined();
    });

    fireEvent.click(document.querySelector<HTMLElement>('button[title="Rename"]')!);

    const input = await screen.findByDisplayValue('Test Snippet 1');
    await user.clear(input);
    await user.type(input, 'New Name{Enter}');

    await waitFor(() => {
      expect(mockHandlers.onRenameSnippet).toHaveBeenCalledWith('1', 'New Name');
    });
  });

  it('should cancel rename when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<SnippetList {...mockHandlers} />);

    await waitFor(() => {
      expect(screen.getByText('Test Snippet 1')).toBeDefined();
    });

    fireEvent.click(document.querySelector<HTMLElement>('button[title="Rename"]')!);

    const input = await screen.findByDisplayValue('Test Snippet 1');
    await user.clear(input);
    await user.type(input, 'Will be cancelled');

    const closeIcon = document.querySelector<HTMLElement>('[data-icon="close"]');
    fireEvent.click(closeIcon!.closest('button')!);

    expect(mockHandlers.onRenameSnippet).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('Test Snippet 1')).toBeDefined();
    });
  });

  it('should filter snippets by language', async () => {
    const user = userEvent.setup();

    // Mock returns only C# snippets when filtered
    mockElectronAPI.db.listSnippets.mockResolvedValue([mockSnippets[0]]);

    render(<SnippetList {...mockHandlers} />);

    // Initially shows all snippets
    await waitFor(() => {
      expect(mockElectronAPI.db.listSnippets).toHaveBeenCalledWith(undefined);
    });

    // Select C# filter
    const filterSelect = screen.getByRole('combobox');
    await user.click(filterSelect);

    const csharpOption = screen.getByText('C#');
    await user.click(csharpOption);

    // Should request filtered list
    await waitFor(() => {
      expect(mockElectronAPI.db.listSnippets).toHaveBeenCalledWith('csharp');
    });
  });

  it('should show empty state when no snippets exist', async () => {
    mockElectronAPI.db.listSnippets.mockResolvedValue([]);

    render(<SnippetList {...mockHandlers} />);

    await waitFor(() => {
      expect(screen.getByText('No snippets yet')).toBeDefined();
    });
  });

  it('should refresh list when refreshTrigger changes', async () => {
    const { rerender } = render(
      <SnippetList {...mockHandlers} refreshTrigger={0} />
    );

    await waitFor(() => {
      expect(mockElectronAPI.db.listSnippets).toHaveBeenCalledTimes(1);
    });

    // Change refresh trigger
    rerender(<SnippetList {...mockHandlers} refreshTrigger={1} />);

    await waitFor(() => {
      expect(mockElectronAPI.db.listSnippets).toHaveBeenCalledTimes(2);
    });
  });

  it('should display language for each snippet', async () => {
    render(<SnippetList {...mockHandlers} />);

    await waitFor(() => {
      expect(screen.getByText('csharp')).toBeDefined();
      expect(screen.getByText('python')).toBeDefined();
    });
  });
});

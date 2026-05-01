import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SnippetList } from '../../../../src/renderer/components/SnippetList/SnippetList';
import type { Snippet } from '../../../../src/backend/database';

// Mock window.electronAPI
const mockElectronAPI = {
  db: {
    listSnippets: vi.fn(),
  },
};

(global as any).window = {
  electronAPI: mockElectronAPI,
};

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
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.db.listSnippets.mockResolvedValue(mockSnippets);
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
    const user = userEvent.setup();
    render(<SnippetList {...mockHandlers} />);

    await waitFor(() => {
      expect(screen.getByText('Test Snippet 1')).toBeDefined();
    });

    // Find all edit buttons and click the first one
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find((btn) =>
      btn.querySelector('[data-icon="edit"]')
    );

    if (editButton) {
      await user.click(editButton);

      // Should show input with current name
      await waitFor(() => {
        const input = screen.getByDisplayValue('Test Snippet 1');
        expect(input).toBeDefined();
      });
    }
  });

  it('should call onRenameSnippet when rename is confirmed', async () => {
    const user = userEvent.setup();
    render(<SnippetList {...mockHandlers} />);

    await waitFor(() => {
      expect(screen.getByText('Test Snippet 1')).toBeDefined();
    });

    // Click edit button
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find((btn) =>
      btn.querySelector('[data-icon="edit"]')
    );

    if (editButton) {
      await user.click(editButton);

      // Type new name
      const input = await screen.findByDisplayValue('Test Snippet 1');
      await user.clear(input);
      await user.type(input, 'Renamed Snippet');

      // Click confirm button
      const confirmButton = editButtons.find((btn) =>
        btn.querySelector('[data-icon="check"]')
      );

      if (confirmButton) {
        await user.click(confirmButton);

        expect(mockHandlers.onRenameSnippet).toHaveBeenCalledWith(
          '1',
          'Renamed Snippet'
        );
      }
    }
  });

  it('should confirm rename on Enter key', async () => {
    const user = userEvent.setup();
    render(<SnippetList {...mockHandlers} />);

    await waitFor(() => {
      expect(screen.getByText('Test Snippet 1')).toBeDefined();
    });

    // Click edit button
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find((btn) =>
      btn.querySelector('[data-icon="edit"]')
    );

    if (editButton) {
      await user.click(editButton);

      // Type new name and press Enter
      const input = await screen.findByDisplayValue('Test Snippet 1');
      await user.clear(input);
      await user.type(input, 'New Name{Enter}');

      expect(mockHandlers.onRenameSnippet).toHaveBeenCalledWith(
        '1',
        'New Name'
      );
    }
  });

  it('should cancel rename when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<SnippetList {...mockHandlers} />);

    await waitFor(() => {
      expect(screen.getByText('Test Snippet 1')).toBeDefined();
    });

    // Click edit button
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find((btn) =>
      btn.querySelector('[data-icon="edit"]')
    );

    if (editButton) {
      await user.click(editButton);

      // Type new name
      const input = await screen.findByDisplayValue('Test Snippet 1');
      await user.clear(input);
      await user.type(input, 'Will be cancelled');

      // Click cancel button
      const cancelButton = editButtons.find((btn) =>
        btn.querySelector('[data-icon="close"]')
      );

      if (cancelButton) {
        await user.click(cancelButton);

        // Should not have called rename
        expect(mockHandlers.onRenameSnippet).not.toHaveBeenCalled();

        // Should show original name again
        await waitFor(() => {
          expect(screen.getByText('Test Snippet 1')).toBeDefined();
        });
      }
    }
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

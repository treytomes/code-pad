import { dialog } from 'electron';
import { promises as fs } from 'fs';
import * as path from 'path';
import { logInfo, logError } from '../shared/logger';

/**
 * Export snippet code to a .cs file
 */
export async function exportSnippetToFile(
  snippetName: string,
  code: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const defaultFileName = `${snippetName.replace(/[^a-z0-9]/gi, '_')}.cs`;

    const result = await dialog.showSaveDialog({
      title: 'Export Snippet',
      defaultPath: defaultFileName,
      filters: [
        { name: 'C# Files', extensions: ['cs'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      logInfo('Export canceled by user');
      return { success: false, error: 'Export canceled' };
    }

    await fs.writeFile(result.filePath, code, 'utf-8');
    logInfo(`Snippet exported to: ${result.filePath}`);

    return { success: true, filePath: result.filePath };
  } catch (error) {
    logError('Failed to export snippet', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Import code from a .cs file
 */
export async function importSnippetFromFile(): Promise<{
  success: boolean;
  name?: string;
  code?: string;
  error?: string;
}> {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Import Snippet',
      filters: [
        { name: 'C# Files', extensions: ['cs', 'csx'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      logInfo('Import canceled by user');
      return { success: false, error: 'Import canceled' };
    }

    const filePath = result.filePaths[0];
    const code = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, path.extname(filePath));

    logInfo(`Snippet imported from: ${filePath}`);

    return { success: true, name: fileName, code };
  } catch (error) {
    logError('Failed to import snippet', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Export all snippets to a JSON file
 */
export async function exportAllSnippets(
  snippets: Array<{ name: string; language: string; code: string; starred: boolean }>
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Export All Snippets',
      defaultPath: 'codepad-snippets.json',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      logInfo('Export all canceled by user');
      return { success: false, error: 'Export canceled' };
    }

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      snippets,
    };

    await fs.writeFile(
      result.filePath,
      JSON.stringify(exportData, null, 2),
      'utf-8'
    );
    logInfo(`All snippets exported to: ${result.filePath}`);

    return { success: true, filePath: result.filePath };
  } catch (error) {
    logError('Failed to export all snippets', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

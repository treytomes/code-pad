// Track React initialization time
const reactStartTime = performance.now();

import React, { useState, useRef, useCallback } from 'react';
import {
  Button,
  Layout,
  Modal,
  Input,
  message,
  Space,
  Select,
  ConfigProvider,
  theme as antTheme,
} from 'antd';
import type { QueryType, NuGetReference, Language } from '../shared/types';
import { startupTiming, logStartupTiming } from '../shared/startup-timing';
import {
  SaveOutlined,
  PlusOutlined,
  ClearOutlined,
  CopyOutlined,
  ExportOutlined,
  ImportOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
  StopOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { CodeEditor } from './components/Editor';
import { SnippetList } from './components/SnippetList';
import { RuntimeWarning } from './components/RuntimeWarning';
import { PythonWarning } from './components/PythonWarning';
import { OutputDisplay } from './components/OutputDisplay';
import { StatusBar } from './components/StatusBar';

// Lazy-load modal components - they're not needed on initial render
const AboutDialog = React.lazy(() =>
  import('./components/AboutDialog').then((m) => ({ default: m.AboutDialog }))
);
const SettingsModal = React.lazy(() =>
  import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);
const WelcomeModal = React.lazy(() =>
  import('./components/WelcomeModal').then((m) => ({ default: m.WelcomeModal }))
);
const KeyboardShortcutsModal = React.lazy(() =>
  import('./components/KeyboardShortcutsModal').then((m) => ({
    default: m.KeyboardShortcutsModal,
  }))
);
const ScriptPropertiesModal = React.lazy(() =>
  import('./components/ScriptPropertiesModal').then((m) => ({ default: m.default }))
);
const PythonPackagesModal = React.lazy(() =>
  import('./components/PythonPackagesModal').then((m) => ({ default: m.default }))
);

// Import types separately (types don't affect bundle)
import type { ScriptProperties } from './components/ScriptPropertiesModal';
import type { Snippet } from '../backend/database';
import { extractProgressEvents, stripProgressLines, type ProgressEvent } from '../backend/progress';
import { processContainerChunk, type ContainerEvent } from '../backend/containers';

const { Header, Content, Sider } = Layout;

const DEFAULT_CODE_STATEMENTS = `// Welcome to CodePad — Statements mode
// Write C# statements. Use .Dump() to display results. Press F5 to run.

using System;
using System.Linq;

// Simple object with label
var person = new {
    Name = "John Doe",
    Age = 30,
    Skills = new[] { "C#", "JavaScript", "Python" }
};
person.Dump("Person Details");

// Array of objects renders as a table
var users = new[] {
    new { Id = 1, Name = "Alice", Role = "Admin",     Active = true  },
    new { Id = 2, Name = "Bob",   Role = "Developer", Active = true  },
    new { Id = 3, Name = "Carol", Role = "Designer",  Active = false }
};
users.Dump("User List");

// .Dump() returns the value, so you can chain it
var activeNames = users
    .Where(u => u.Active)
    .Dump("Active Users")
    .Select(u => u.Name)
    .ToArray();

Console.WriteLine($"Active: {string.Join(", ", activeNames)}");
`;

const DEFAULT_CODE_EXPRESSION = `// Welcome to CodePad — Expression mode
// Type a single C# expression. The result is automatically displayed.
// No .Dump() needed — press F5 to run.

Enumerable.Range(1, 10)
    .Where(x => x % 2 == 0)
    .Select(x => new { Value = x, Square = x * x })
`;

const DEFAULT_CODE_PROGRAM = `// Welcome to CodePad — Program mode
// Write a complete C# program with your own Main() method.
// Helper methods and classes are allowed. Press F5 to run.

using System;
using System.Linq;

static void Main()
{
    var numbers = Enumerable.Range(1, 5).ToArray();
    numbers.Dump("Numbers");

    Console.WriteLine($"Sum: {Sum(numbers)}");
    Console.WriteLine($"Max: {numbers.Max()}");
}

static int Sum(int[] values) => values.Sum();
`;

const DEFAULT_CODE: Record<string, string> = {
  statements: DEFAULT_CODE_STATEMENTS,
  expression: DEFAULT_CODE_EXPRESSION,
  program: DEFAULT_CODE_PROGRAM,
};

function App() {
  // Load saved settings from localStorage
  const loadSavedSettings = () => {
    try {
      const stored = localStorage.getItem('codepad-settings');
      if (stored) {
        const s = JSON.parse(stored);
        return {
          outputHeight: s.outputHeight ?? 200,
          sidebarWidth: s.sidebarWidth ?? 250,
          timeout: s.timeout ?? 30000,
          theme: (s.theme ?? 'system') as 'dark' | 'light' | 'system',
          fontSize: s.fontSize ?? 14,
          tabSize: s.tabSize ?? 4,
          wordWrap: s.wordWrap ?? false,
          minimap: s.minimap ?? false,
          lineNumbers: s.lineNumbers ?? true,
          folding: s.folding ?? true,
          parameterHints: s.parameterHints ?? true,
          targetFramework: s.targetFramework ?? 'net8.0',
        };
      }
    } catch (e) {
      console.error('Failed to load saved settings:', e);
    }
    return {
      outputHeight: 200,
      sidebarWidth: 250,
      timeout: 30000,
      theme: 'system' as const,
      fontSize: 14,
      tabSize: 4,
      wordWrap: false,
      minimap: false,
      lineNumbers: true,
      folding: true,
      parameterHints: true,
      targetFramework: 'net8.0',
    };
  };

  const savedSettings = loadSavedSettings();

  const [code, setCode] = useState(DEFAULT_CODE_STATEMENTS);
  const [output, setOutput] = useState('');
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [containerContents, setContainerContents] = useState<Map<string, string>>(new Map());
  const containerSeenIdsRef = useRef<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const executionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const executionStartRef = useRef<number>(0);
  const [outputHeight, setOutputHeight] = useState(savedSettings.outputHeight);
  const [sidebarWidth, setSidebarWidth] = useState(savedSettings.sidebarWidth);
  const [timeout, _setTimeout] = useState(savedSettings.timeout);
  const [appTheme, setAppTheme] = useState<'dark' | 'light' | 'system'>(savedSettings.theme);
  const [editorFontSize, setEditorFontSize] = useState(savedSettings.fontSize);
  const [editorTabSize, setEditorTabSize] = useState(savedSettings.tabSize);
  const [editorWordWrap, setEditorWordWrap] = useState(savedSettings.wordWrap);
  const [editorMinimap, setEditorMinimap] = useState(savedSettings.minimap);
  const [editorLineNumbers, setEditorLineNumbers] = useState(savedSettings.lineNumbers);
  const [editorFolding, setEditorFolding] = useState(savedSettings.folding);
  const [editorParameterHints, setEditorParameterHints] = useState(savedSettings.parameterHints);
  const [targetFramework, setTargetFramework] = useState(savedSettings.targetFramework);

  const resolveTheme = (t: 'dark' | 'light' | 'system'): 'dark' | 'light' => {
    if (t === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return t;
  };
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const savedCodeRef = useRef<string>(DEFAULT_CODE_STATEMENTS);
  const [isDraggingOutput, setIsDraggingOutput] = useState(false);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [currentSnippetId, setCurrentSnippetId] = useState<string | null>(null);
  const [currentSamplePackages, setCurrentSamplePackages] = useState<string[] | null>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [keyboardShortcutsVisible, setKeyboardShortcutsVisible] = useState(false);
  const [snippetName, setSnippetName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorColumn, setCursorColumn] = useState(1);
  const [language, setLanguage] = useState<Language>('csharp');
  const [pythonAvailable, setPythonAvailable] = useState<boolean | null>(null);
  const [queryType, setQueryType] = useState<QueryType>('statements');
  const [scriptProperties, setScriptProperties] = useState<ScriptProperties>({ usings: [], references: [], localReferences: [], tags: [] });
  const [scriptPropertiesVisible, setScriptPropertiesVisible] = useState(false);
  const [pythonPackagesVisible, setPythonPackagesVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);

  // Startup timing - track React mount
  React.useEffect(() => {
    const reactMountTime = performance.now() - reactStartTime;
    startupTiming.mark('reactMounted');

    if (process.env.NODE_ENV === 'development') {
      console.log(`React mounted in ${Math.round(reactMountTime)}ms`);
    }

    // Mark app as interactive once database and Monaco are ready
    // This will be updated by database load and Monaco load events
    const checkInteractive = setTimeout(() => {
      startupTiming.mark('appInteractive');
      logStartupTiming();
    }, 100);

    return () => clearTimeout(checkInteractive);
  }, []);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    setHasUnsavedChanges(newCode !== savedCodeRef.current);
  }, []);

  const handleCursorChange = useCallback((line: number, col: number) => {
    setCursorLine(line);
    setCursorColumn(col);
  }, []);

  const handleStop = async () => {
    try {
      await window.electronAPI.stopExecution();
      message.info('Execution stopped');
    } catch (error) {
      console.error('Failed to stop execution:', error);
      message.error('Failed to stop execution');
    }
  };

  const handleRun = async () => {
    // Check if this sample requires packages that aren't installed
    if (currentSamplePackages && currentSamplePackages.length > 0) {
      const packageList = currentSamplePackages.join(', ');
      const userChoice = window.confirm(
        `This sample requires the following pip packages:\n${packageList}\n\n` +
        `These packages are not installed yet. Would you like to:\n\n` +
        `• Click OK to copy this sample to "My Snippets" where you can install the packages\n` +
        `• Click Cancel to run anyway (will fail with ModuleNotFoundError)`
      );

      if (userChoice) {
        // Copy the sample to My Snippets
        await handleDuplicateSnippet({
          id: `sample-temp-${Date.now()}`,
          name: snippetName || 'Untitled',
          language,
          code,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          executionCount: 0,
          starred: false,
          lastOpenedAt: null,
          queryType,
          usings: scriptProperties.usings,
          references: scriptProperties.references,
          localReferences: scriptProperties.localReferences,
          tags: scriptProperties.tags,
        } as Snippet, currentSamplePackages);

        message.info(`Sample copied to "My Snippets". Click Script Properties to install packages.`);
        return; // Don't run
      }
      // User chose to run anyway despite missing packages
    }

    setIsRunning(true);
    setOutput('');
    setProgressEvents([]);
    setContainerContents(new Map());
    containerSeenIdsRef.current = new Set();

    // Start live timer
    executionStartRef.current = performance.now();
    setExecutionTime(0);

    executionTimerRef.current = setInterval(() => {
      const elapsed = Math.round(performance.now() - executionStartRef.current);
      setExecutionTime(elapsed);
    }, 100); // Update every 100ms

    // Subscribe to streaming output — intercept progress and container sentinel lines
    const cleanup = window.electronAPI.onOutputChunk((chunk: string, _isError: boolean) => {
      // Route container sentinels: insert slot placeholders (first sight) or update contents
      const { displayChunk, events: containerEvents } = processContainerChunk(
        chunk,
        containerSeenIdsRef.current
      );
      if (containerEvents.length > 0) {
        setContainerContents((prev) => {
          const next = new Map(prev);
          containerEvents.forEach((e: ContainerEvent) => next.set(e.id, e.content));
          return next;
        });
      }

      // Route progress sentinels
      const events = extractProgressEvents(displayChunk);
      if (events.length > 0) {
        setProgressEvents((prev) => [...prev, ...events]);
      }
      const stripped = stripProgressLines(displayChunk);
      if (stripped) {
        setOutput((prev) => prev + stripped);
      }
    });

    try {
      let result: any;
      if (language === 'python') {
        // Python execution - no streaming output yet, no onOutputDone needed
        result = await window.electronAPI.executePython(code, { timeout });

        // Stop timer and set final time
        if (executionTimerRef.current) {
          clearInterval(executionTimerRef.current);
          executionTimerRef.current = null;
        }
        const finalTime = result.executionTime;
        setExecutionTime(finalTime);

        // Clean up output subscription
        cleanup();

        // Display Python output
        if (result.stdout) {
          setOutput(result.stdout);
        }
        if (result.stderr) {
          setOutput((prev) => prev + (prev ? '\n' : '') + result.stderr);
        }
      } else {
        // C# execution with streaming output
        [result] = await Promise.all([
          window.electronAPI.executeCode(code, {
            timeout,
            queryType,
            usings: scriptProperties.usings,
            references: scriptProperties.references,
            localReferences: scriptProperties.localReferences,
            targetFramework,
          }),
          window.electronAPI.onOutputDone(),
        ]);

        // Stop timer and set final time
        if (executionTimerRef.current) {
          clearInterval(executionTimerRef.current);
          executionTimerRef.current = null;
        }
        const finalTime = Math.round(performance.now() - executionStartRef.current);
        setExecutionTime(finalTime);

        // Clean up output subscription — safe now that onOutputDone has resolved,
        // meaning the 'execution-output-done' sentinel has been received and all
        // preceding chunks are guaranteed to have arrived.
        cleanup();
      }

      // Show error if execution failed
      if (result.exitCode !== 0) {
        setOutput(
          (prev) =>
            prev +
            `\n\nError (exit code ${result.exitCode}):\n${result.stderr || result.error || 'Unknown error'}`
        );
      } else if (!result.stdout && !result.stderr) {
        setOutput((prev) => prev || '(no output)');
      }

      // Increment execution count if snippet is loaded
      if (currentSnippetId) {
        await window.electronAPI.db.incrementExecution(currentSnippetId);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      // Stop timer on error
      if (executionTimerRef.current) {
        clearInterval(executionTimerRef.current);
        executionTimerRef.current = null;
      }
      setExecutionTime(null);

      // Clean up output subscription
      cleanup();

      setOutput(`Failed to execute: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveNew = () => {
    setSnippetName('');
    setSaveModalVisible(true);
  };

  const handleSaveAs = () => {
    setSnippetName('');
    setSaveModalVisible(true);
  };

  const handleSaveExisting = async () => {
    if (!currentSnippetId) return;

    try {
      await window.electronAPI.db.updateSnippet(currentSnippetId, {
        code,
        queryType,
        usings: scriptProperties.usings,
        references: scriptProperties.references,
        localReferences: scriptProperties.localReferences,
        tags: scriptProperties.tags,
      });
      savedCodeRef.current = code;
      setHasUnsavedChanges(false);
      message.success('Snippet saved');
      setRefreshTrigger((prev) => prev + 1);
    } catch (_error) {
      message.error('Failed to save snippet');
    }
  };

  const handleSaveConfirm = async () => {
    if (!snippetName.trim()) {
      message.error('Please enter a snippet name');
      return;
    }

    try {
      const snippet = await window.electronAPI.db.createSnippet({
        name: snippetName,
        language,
        code,
        queryType,
        usings: scriptProperties.usings,
        references: scriptProperties.references,
        localReferences: scriptProperties.localReferences,
        tags: scriptProperties.tags,
      });

      setCurrentSnippetId(snippet.id);
      savedCodeRef.current = code;
      setHasUnsavedChanges(false);
      message.success('Snippet saved');
      setSaveModalVisible(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (_error) {
      message.error('Failed to save snippet');
    }
  };

  const handleSelectSnippet = async (snippet: Snippet) => {
    // Warn if there are unsaved changes
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Do you want to discard them?');
      if (!confirmed) {
        return;
      }
    }

    setCode(snippet.code);
    savedCodeRef.current = snippet.code;
    setHasUnsavedChanges(false);
    setCurrentSnippetId(snippet.id);
    setLanguage((snippet.language as Language) ?? 'csharp');
    setQueryType(snippet.queryType ?? 'statements');
    setScriptProperties({ usings: snippet.usings ?? [], references: snippet.references ?? [], localReferences: snippet.localReferences ?? [], tags: snippet.tags ?? [] });
    setOutput('');

    // Store sample packages if this is a sample (has _samplePackages property)
    const samplePackages = (snippet as any)._samplePackages;
    setCurrentSamplePackages(samplePackages || null);

    // Update last opened timestamp
    try {
      await window.electronAPI.db.updateLastOpened(snippet.id);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to update last opened:', error);
    }
  };

  const handleDeleteSnippet = async (id: string) => {
    try {
      await window.electronAPI.db.deleteSnippet(id);
      message.success('Snippet deleted');

      if (currentSnippetId === id) {
        setCurrentSnippetId(null);
        const defaultCode = DEFAULT_CODE[queryType] ?? DEFAULT_CODE_STATEMENTS;
        setCode(defaultCode);
        savedCodeRef.current = defaultCode;
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      message.error('Failed to delete snippet');
    }
  };

  const handleRenameSnippet = async (id: string, newName: string) => {
    try {
      await window.electronAPI.db.updateSnippet(id, { name: newName });
      message.success('Snippet renamed');
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      message.error('Failed to rename snippet');
    }
  };

  const handleDuplicateSnippet = async (snippet: Snippet, packages?: string[]) => {
    try {
      const newSnippet = await window.electronAPI.db.createSnippet({
        name: `${snippet.name} (Copy)`,
        language: snippet.language,
        code: snippet.code,
        queryType: snippet.queryType,
        usings: snippet.usings ?? [],
        references: snippet.references ?? [],
        localReferences: snippet.localReferences ?? [],
        tags: snippet.tags ?? [],
      });

      // Add packages if provided (for Python samples)
      if (packages && packages.length > 0 && snippet.language === 'python') {
        for (const pkg of packages) {
          await window.electronAPI.db.addSnippetPackage(newSnippet.id, pkg);
        }
      }

      message.success('Snippet duplicated');
      setRefreshTrigger((prev) => prev + 1);

      // Optionally open the duplicated snippet
      setCode(newSnippet.code);
      savedCodeRef.current = newSnippet.code;
      setHasUnsavedChanges(false);
      setCurrentSnippetId(newSnippet.id);
      setLanguage((newSnippet.language as Language) ?? 'csharp');
      setQueryType(newSnippet.queryType ?? 'statements');
      setScriptProperties({ usings: newSnippet.usings ?? [], references: newSnippet.references ?? [], localReferences: newSnippet.localReferences ?? [], tags: newSnippet.tags ?? [] });
      setOutput('');
    } catch (error) {
      message.error('Failed to duplicate snippet');
    }
  };

  const handleNewSnippet = () => {
    // Warn if there are unsaved changes
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Do you want to discard them?');
      if (!confirmed) {
        return;
      }
    }

    setCode(DEFAULT_CODE_STATEMENTS);
    savedCodeRef.current = DEFAULT_CODE_STATEMENTS;
    setHasUnsavedChanges(false);
    setCurrentSnippetId(null);
    setQueryType('statements');
    setScriptProperties({ usings: [], references: [], localReferences: [], tags: [] });
    setOutput('');
  };

  const handleClearOutput = () => {
    setOutput('');
    setExecutionTime(null);
    if (executionTimerRef.current) {
      clearInterval(executionTimerRef.current);
      executionTimerRef.current = null;
    }
  };

  const handleCopyOutput = async () => {
    if (!output) {
      message.warning('No output to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      message.success('Output copied to clipboard');
    } catch (error) {
      message.error('Failed to copy to clipboard');
    }
  };

  const handleOutputMouseDown = () => {
    setIsDraggingOutput(true);
  };

  const handleSidebarMouseDown = () => {
    setIsDraggingSidebar(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingOutput && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      const minHeight = 100;
      const maxHeight = containerRect.height - 200;
      setOutputHeight(Math.max(minHeight, Math.min(maxHeight, newHeight)));
    }

    if (isDraggingSidebar && layoutRef.current) {
      const layoutRect = layoutRef.current.getBoundingClientRect();
      const newWidth = e.clientX - layoutRect.left;
      const minWidth = 150;
      const maxWidth = 500;
      setSidebarWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    }
  };

  const handleMouseUp = () => {
    const wasDraggingOutput = isDraggingOutput;
    const wasDraggingSidebar = isDraggingSidebar;

    setIsDraggingOutput(false);
    setIsDraggingSidebar(false);

    // Save panel dimensions to localStorage when resize completes
    if (wasDraggingOutput || wasDraggingSidebar) {
      try {
        const stored = localStorage.getItem('codepad-settings');
        const settings = stored ? JSON.parse(stored) : {};
        const updatedSettings = {
          ...settings,
          outputHeight,
          sidebarWidth,
        };
        localStorage.setItem('codepad-settings', JSON.stringify(updatedSettings));
      } catch (e) {
        console.error('Failed to save panel dimensions:', e);
      }
    }
  };

  React.useEffect(() => {
    if (isDraggingOutput || isDraggingSidebar) {
      document.addEventListener('mouseup', handleMouseUp as any);
      document.addEventListener('mousemove', handleMouseMove as any);
      return () => {
        document.removeEventListener('mouseup', handleMouseUp as any);
        document.removeEventListener('mousemove', handleMouseMove as any);
      };
    }
  }, [isDraggingOutput, isDraggingSidebar]);

  // Import/Export handlers
  const handleExport = async () => {
    if (!currentSnippetId) {
      message.warning('No snippet selected to export');
      return;
    }

    try {
      const snippet = await window.electronAPI.db.getSnippet(currentSnippetId);
      if (!snippet) {
        message.error('Snippet not found');
        return;
      }

      const result = await window.electronAPI.exportSnippet(snippet.name, code);
      if (result.success) {
        message.success(`Exported to ${result.filePath}`);
      } else if (result.error !== 'Export canceled') {
        message.error(`Export failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export snippet');
    }
  };

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.importSnippet();
      if (result.success && result.name && result.code) {
        // Create new snippet from imported code
        const newSnippet = await window.electronAPI.db.createSnippet({
          name: result.name,
          language: 'csharp',
          code: result.code,
        });

        setCurrentSnippetId(newSnippet.id);
        setCode(result.code);
        setRefreshTrigger((prev) => prev + 1);
        message.success(`Imported ${result.name}`);
      } else if (result.error !== 'Import canceled') {
        message.error(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      message.error('Failed to import snippet');
    }
  };

  const handleExportAll = async () => {
    try {
      const snippets = await window.electronAPI.db.listSnippets();
      if (snippets.length === 0) {
        message.warning('No snippets to export');
        return;
      }

      const exportData = snippets.map((s) => ({
        name: s.name,
        language: s.language,
        code: s.code,
        starred: s.starred,
      }));

      const result = await window.electronAPI.exportAllSnippets(exportData);
      if (result.success) {
        message.success(`Exported ${snippets.length} snippets to ${result.filePath}`);
      } else if (result.error !== 'Export canceled') {
        message.error(`Export failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Export all error:', error);
      message.error('Failed to export snippets');
    }
  };

  // Menu event handlers
  React.useEffect(() => {
    const cleanups: (() => void)[] = [];

    // New Snippet
    cleanups.push(window.electronAPI.onMenuEvent('menu-new-snippet', handleNewSnippet));

    // Save
    cleanups.push(
      window.electronAPI.onMenuEvent('menu-save', () => {
        if (currentSnippetId) {
          handleSaveExisting();
        } else {
          handleSaveNew();
        }
      })
    );

    // Save As
    cleanups.push(window.electronAPI.onMenuEvent('menu-save-as', handleSaveAs));

    // Import
    cleanups.push(window.electronAPI.onMenuEvent('menu-import', handleImport));

    // Export
    cleanups.push(window.electronAPI.onMenuEvent('menu-export', handleExport));

    // Export All
    cleanups.push(window.electronAPI.onMenuEvent('menu-export-all', handleExportAll));

    // Run
    cleanups.push(
      window.electronAPI.onMenuEvent('menu-run', () => {
        if (!isRunning) {
          handleRun();
        }
      })
    );

    // Clear Output
    cleanups.push(window.electronAPI.onMenuEvent('menu-clear-output', handleClearOutput));

    // About
    cleanups.push(window.electronAPI.onMenuEvent('menu-about', () => setAboutVisible(true)));

    // Settings
    cleanups.push(window.electronAPI.onMenuEvent('menu-settings', () => setSettingsVisible(true)));

    // Keyboard Shortcuts
    cleanups.push(
      window.electronAPI.onMenuEvent('menu-keyboard-shortcuts', () =>
        setKeyboardShortcutsVisible(true)
      )
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [currentSnippetId, isRunning, code]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (executionTimerRef.current) {
        clearInterval(executionTimerRef.current);
      }
    };
  }, []);

  // Check Python runtime availability on mount and when settings change
  React.useEffect(() => {
    const checkPython = async () => {
      try {
        const stored = localStorage.getItem('codepad-settings');
        const pythonPath = stored ? JSON.parse(stored).pythonPath : undefined;
        const runtimeInfo = await window.electronAPI.checkPythonRuntime(pythonPath);
        setPythonAvailable(runtimeInfo.available);
      } catch (error) {
        console.error('Failed to check Python runtime:', error);
        setPythonAvailable(false);
      }
    };
    checkPython();
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+S or Cmd+Shift+S - Save As
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleSaveAs();
      }
      // Ctrl+S or Cmd+S - Save
      else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentSnippetId) {
          handleSaveExisting();
        } else {
          handleSaveNew();
        }
      }
      // F5 - Run code
      else if (e.key === 'F5') {
        e.preventDefault();
        if (!isRunning) {
          handleRun();
        }
      }
      // F1 - Keyboard shortcuts
      else if (e.key === 'F1') {
        e.preventDefault();
        setKeyboardShortcutsVisible(true);
      }
      // Ctrl+N or Cmd+N - New snippet
      else if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewSnippet();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSnippetId, isRunning, code]);

  const isDark = resolveTheme(appTheme) === 'dark';

  const themeConfig = isDark
    ? {
        algorithm: antTheme.darkAlgorithm,
        token: {
          colorBgBase: '#1e1e1e',
          colorBgContainer: '#252526',
          colorBgElevated: '#252526',
          colorBgLayout: '#1e1e1e',
          colorBorder: '#2d2d30',
          colorPrimary: '#007acc',
          colorText: '#cccccc',
          colorTextSecondary: '#858585',
          colorTextTertiary: '#6e6e6e',
          colorBgTextHover: '#2a2d2e',
          colorBgTextActive: '#264f78',
        },
        components: {
          Layout: {
            headerBg: '#323233',
            headerPadding: '0 16px',
            headerHeight: 48,
            siderBg: '#252526',
            bodyBg: '#1e1e1e',
          },
          Button: { colorBgContainer: '#2d2d30', colorBorder: '#2d2d30' },
          Input: { colorBgContainer: '#181818' },
          Select: { colorBgContainer: '#181818', colorBgElevated: '#252526' },
        },
      }
    : {
        algorithm: antTheme.defaultAlgorithm,
        token: { colorPrimary: '#007acc' },
      };

  const bgMain = isDark ? '#1e1e1e' : '#f5f5f5';
  const bgHeader = isDark ? '#323233' : '#ffffff';
  const bgSider = isDark ? '#252526' : '#fafafa';
  const borderColor = isDark ? '#2d2d30' : '#d9d9d9';
  const monacoTheme = isDark ? ('vs-dark' as const) : ('light' as const);

  return (
    <ConfigProvider theme={themeConfig}>
      <Layout style={{ height: '100vh', background: bgMain }}>
        <RuntimeWarning />
        <React.Suspense fallback={null}>
          <WelcomeModal forceOpen={welcomeVisible || undefined} onClose={() => setWelcomeVisible(false)} />
        </React.Suspense>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 16px',
            background: bgHeader,
            borderBottom: `1px solid ${borderColor}`,
            height: '48px',
            lineHeight: '48px',
          }}
        >
          <h1
            style={{
              color: isDark ? '#cccccc' : '#1f1f1f',
              margin: 0,
              fontSize: '14px',
              fontWeight: 400,
              letterSpacing: '0.5px',
            }}
          >
            CodePad
          </h1>
          <div style={{ flex: 1 }} />
          <Space>
            <Select
              value={language}
              onChange={(val: Language) => {
                setLanguage(val);
                if (currentSnippetId) {
                  window.electronAPI.db.updateSnippet(currentSnippetId, { language: val });
                }
                // Clear output when switching languages
                setOutput('');
              }}
              style={{ width: 100 }}
              title="Programming Language"
              options={[
                { value: 'csharp', label: 'C#' },
                { value: 'python', label: 'Python' },
              ]}
            />
            <Select
              value={queryType}
              onChange={(val: QueryType) => {
                setQueryType(val);
                if (currentSnippetId) {
                  window.electronAPI.db.updateSnippet(currentSnippetId, { queryType: val });
                } else {
                  // Unsaved scratch buffer — load the matching default
                  const defaultCode = DEFAULT_CODE[val] ?? DEFAULT_CODE_STATEMENTS;
                  setCode(defaultCode);
                  savedCodeRef.current = defaultCode;
                  setHasUnsavedChanges(false);
                }
              }}
              style={{ width: 140 }}
              title="Query Type"
              options={[
                { value: 'statements', label: 'Statements' },
                { value: 'expression', label: 'Expression' },
                { value: 'program', label: 'Program' },
              ]}
              disabled={language === 'python'}
            />
            <Button
              icon={<SettingOutlined />}
              onClick={() => {
                if (language === 'python') {
                  setPythonPackagesVisible(true);
                } else {
                  setScriptPropertiesVisible(true);
                }
              }}
              title={
                language === 'python'
                  ? 'Python Packages (pip)'
                  : 'Script Properties (namespaces & NuGet references)'
              }
            />
            <Button icon={<PlusOutlined />} onClick={handleNewSnippet} title="New Snippet (Ctrl+N)">
              New
            </Button>
            <Button icon={<ImportOutlined />} onClick={handleImport} title="Import from .cs file">
              Import
            </Button>
            {currentSnippetId ? (
              <>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveExisting}
                  title="Save (Ctrl+S)"
                  danger={hasUnsavedChanges}
                >
                  {hasUnsavedChanges ? 'Save *' : 'Save'}
                </Button>
                <Button
                  icon={<SaveOutlined />}
                  onClick={handleSaveAs}
                  title="Save As (Ctrl+Shift+S)"
                >
                  Save As...
                </Button>
                <Button icon={<ExportOutlined />} onClick={handleExport} title="Export to .cs file">
                  Export
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveNew}
                title="Save As (Ctrl+S)"
              >
                Save As...
              </Button>
            )}
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportAll}
              title="Export all snippets to JSON"
            >
              Export All
            </Button>
            {!isRunning ? (
              <Button type="primary" onClick={handleRun}>
                Run Code
              </Button>
            ) : (
              <Button danger onClick={handleStop} icon={<StopOutlined />}>
                Stop
              </Button>
            )}
          </Space>
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            onClick={() => setAboutVisible(true)}
            title="About CodePad"
            style={{ color: isDark ? '#858585' : '#666666' }}
          />
        </Header>

        <Layout ref={layoutRef} style={{ background: bgMain }}>
          <Sider
            width={sidebarWidth}
            theme={isDark ? 'dark' : 'light'}
            style={{
              background: bgSider,
              borderRight: `1px solid ${borderColor}`,
              position: 'relative',
            }}
          >
            <SnippetList
              onSelectSnippet={handleSelectSnippet}
              onDeleteSnippet={handleDeleteSnippet}
              onRenameSnippet={handleRenameSnippet}
              onDuplicateSnippet={handleDuplicateSnippet}
              refreshTrigger={refreshTrigger}
              isDark={isDark}
            />
            {/* Sidebar resize handle */}
            <div
              onMouseDown={handleSidebarMouseDown}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                cursor: 'ew-resize',
                backgroundColor: 'transparent',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#007acc';
              }}
              onMouseLeave={(e) => {
                if (!isDraggingSidebar) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            />
          </Sider>

          <Content
            ref={containerRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onMouseMove={handleMouseMove}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                background: bgMain,
              }}
            >
              <CodeEditor
                value={code}
                onChange={handleCodeChange}
                language={language}
                theme={monacoTheme}
                onCursorChange={handleCursorChange}
                fontSize={editorFontSize}
                tabSize={editorTabSize}
                wordWrap={editorWordWrap}
                minimap={editorMinimap}
                lineNumbers={editorLineNumbers}
                folding={editorFolding}
                parameterHints={editorParameterHints}
              />
            </div>

            {/* Output panel resize handle */}
            <div
              onMouseDown={handleOutputMouseDown}
              style={{
                height: '4px',
                backgroundColor: borderColor,
                cursor: 'ns-resize',
                userSelect: 'none',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#007acc';
              }}
              onMouseLeave={(e) => {
                if (!isDraggingOutput) {
                  e.currentTarget.style.backgroundColor = borderColor;
                }
              }}
            />

            <div
              style={{
                height: `${outputHeight}px`,
                backgroundColor: isDark ? '#181818' : '#ffffff',
                borderTop: `1px solid ${borderColor}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Output panel header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderBottom: `1px solid ${borderColor}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <strong
                    style={{
                      color: '#4ec9b0',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: 600,
                    }}
                  >
                    Output
                  </strong>
                  {executionTime !== null && (
                    <span
                      style={{
                        color: isDark ? '#858585' : '#666666',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {executionTime}ms
                    </span>
                  )}
                </div>
                <Space size="small">
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={handleCopyOutput}
                    title="Copy to clipboard"
                    style={{ color: isDark ? '#858585' : '#666666' }}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={handleClearOutput}
                    title="Clear output"
                    style={{ color: isDark ? '#858585' : '#666666' }}
                  />
                </Space>
              </div>

              {/* Output content */}
              <div
                data-testid="output-panel"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  background: isDark ? '#1e1e1e' : '#fafafa',
                }}
              >
                {output ? (
                  <OutputDisplay output={output} progressEvents={progressEvents} containerContents={containerContents} />
                ) : (
                  <div style={{ padding: '12px' }}>
                    {language === 'python' && pythonAvailable === false ? (
                      <PythonWarning isDark={isDark} />
                    ) : (
                      <div
                        style={{
                          color: isDark ? '#858585' : '#666666',
                          fontStyle: 'italic',
                        }}
                      >
                        Click &ldquo;Run Code&rdquo; to execute
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Content>
        </Layout>

        <StatusBar
          language={language}
          isRunning={isRunning}
          cursorLine={cursorLine}
          cursorColumn={cursorColumn}
          executionTime={executionTime}
          targetFramework={targetFramework}
        />

        <Modal
          title="Save Snippet"
          open={saveModalVisible}
          onOk={handleSaveConfirm}
          onCancel={() => setSaveModalVisible(false)}
        >
          <Input
            placeholder="Enter snippet name"
            value={snippetName}
            onChange={(e) => setSnippetName(e.target.value)}
            onPressEnter={handleSaveConfirm}
            autoFocus
          />
        </Modal>

        <React.Suspense fallback={null}>
          <AboutDialog visible={aboutVisible} onClose={() => setAboutVisible(false)} />
        </React.Suspense>
        <React.Suspense fallback={null}>
          <KeyboardShortcutsModal
            visible={keyboardShortcutsVisible}
            onClose={() => setKeyboardShortcutsVisible(false)}
            isDark={isDark}
          />
        </React.Suspense>
        <React.Suspense fallback={null}>
          <SettingsModal
            visible={settingsVisible}
            onClose={() => setSettingsVisible(false)}
            onThemeChange={setAppTheme}
            onShowWelcome={() => setWelcomeVisible(true)}
            onSettingsSaved={() => {
              const s = loadSavedSettings();
              setEditorFontSize(s.fontSize);
              setEditorTabSize(s.tabSize);
              setEditorWordWrap(s.wordWrap);
              setEditorMinimap(s.minimap);
              setEditorLineNumbers(s.lineNumbers);
              setEditorFolding(s.folding);
              setEditorParameterHints(s.parameterHints);
              setTargetFramework(s.targetFramework);
            }}
          />
        </React.Suspense>
        <React.Suspense fallback={null}>
          <ScriptPropertiesModal
            open={scriptPropertiesVisible}
            properties={scriptProperties}
            isDark={isDark}
            onOk={(props) => {
              setScriptProperties(props);
              if (currentSnippetId) {
                window.electronAPI.db.updateSnippet(currentSnippetId, {
                  usings: props.usings,
                  references: props.references,
                  localReferences: props.localReferences,
                  tags: props.tags,
                });
              }
              setScriptPropertiesVisible(false);
            }}
            onCancel={() => setScriptPropertiesVisible(false)}
          />
        </React.Suspense>
        <React.Suspense fallback={null}>
          <PythonPackagesModal
            open={pythonPackagesVisible}
            snippetId={currentSnippetId}
            isDark={isDark}
            onCancel={() => setPythonPackagesVisible(false)}
          />
        </React.Suspense>
      </Layout>
    </ConfigProvider>
  );
}

export default App;

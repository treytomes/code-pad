import React, { useState, useRef } from 'react';
import { Button, Layout, Modal, Input, message, Space } from 'antd';
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
} from '@ant-design/icons';
import { CodeEditor } from './components/Editor';
import { SnippetList } from './components/SnippetList';
import { RuntimeWarning } from './components/RuntimeWarning';
import { AboutDialog } from './components/AboutDialog';
import { SettingsModal } from './components/SettingsModal';
import { OutputDisplay } from './components/OutputDisplay';
import type { Snippet } from '../backend/database';

const { Header, Content, Sider } = Layout;

const DEFAULT_CODE = `// Welcome to CodePad v0.1.0!
// Press F5 to run | Ctrl+S to save | Ctrl+N for new snippet

using System;
using System.Linq;

// CodePad includes a .Dump() extension method (like LINQPad)
// It automatically outputs objects as JSON with optional labels

// 1. Simple object with label
var person = new {
    Name = "John Doe",
    Age = 30,
    Email = "john@example.com",
    Address = new {
        Street = "123 Main St",
        City = "Springfield",
        Zip = "12345"
    },
    Skills = new[] { "C#", "JavaScript", "Python" }
};
person.Dump("Person Details");

// 2. Array/collection - renders as tree view
var users = new[] {
    new { Id = 1, Name = "Alice", Role = "Admin", Active = true },
    new { Id = 2, Name = "Bob", Role = "Developer", Active = true },
    new { Id = 3, Name = "Carol", Role = "Designer", Active = false }
};
users.Dump("User List");

// 3. Chaining support - dump intermediate results
var activeUsers = users
    .Where(u => u.Active)
    .Dump("Active Users Only")
    .Select(u => u.Name)
    .ToArray();

// 4. Statistics object
var stats = new {
    TotalUsers = users.Length,
    ActiveCount = users.Count(u => u.Active),
    Roles = users.Select(u => u.Role).Distinct().ToArray(),
    Timestamp = DateTime.Now
};
stats.Dump("Statistics");

// 💡 Tips:
// - .Dump() automatically adds spacing between sections
// - Use .Dump("Label") to add headers
// - Returns the object for LINQ chaining
// - Works with any serializable type
// - You can still use Console.WriteLine() for plain text

Console.WriteLine("✨ Try .Dump() on your own objects!");
`;

function App() {
  // Load saved settings from localStorage
  const loadSavedSettings = () => {
    try {
      const stored = localStorage.getItem('codepad-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        return {
          outputHeight: settings.outputHeight ?? 200,
          sidebarWidth: settings.sidebarWidth ?? 250,
          timeout: settings.timeout ?? 30000,
        };
      }
    } catch (e) {
      console.error('Failed to load saved settings:', e);
    }
    return { outputHeight: 200, sidebarWidth: 250, timeout: 30000 };
  };

  const savedSettings = loadSavedSettings();

  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const executionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const executionStartRef = useRef<number>(0);
  const [outputHeight, setOutputHeight] = useState(savedSettings.outputHeight);
  const [sidebarWidth, setSidebarWidth] = useState(savedSettings.sidebarWidth);
  const [timeout, _setTimeout] = useState(savedSettings.timeout);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const savedCodeRef = useRef<string>(DEFAULT_CODE);
  const [isDraggingOutput, setIsDraggingOutput] = useState(false);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [currentSnippetId, setCurrentSnippetId] = useState<string | null>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [snippetName, setSnippetName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    // Check if code has changed from saved version
    setHasUnsavedChanges(newCode !== savedCodeRef.current);
  };

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
    setIsRunning(true);
    setOutput('');

    // Start live timer
    executionStartRef.current = performance.now();
    setExecutionTime(0);

    executionTimerRef.current = setInterval(() => {
      const elapsed = Math.round(performance.now() - executionStartRef.current);
      setExecutionTime(elapsed);
    }, 100); // Update every 100ms

    // Subscribe to streaming output
    const cleanup = window.electronAPI.onOutputChunk((chunk: string, _isError: boolean) => {
      setOutput((prev) => prev + chunk);
    });

    try {
      const result = await window.electronAPI.executeCode(code, { timeout });

      // Stop timer and set final time
      if (executionTimerRef.current) {
        clearInterval(executionTimerRef.current);
        executionTimerRef.current = null;
      }
      const finalTime = Math.round(performance.now() - executionStartRef.current);
      setExecutionTime(finalTime);

      // Clean up output subscription
      cleanup();

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
      await window.electronAPI.db.updateSnippet(currentSnippetId, { code });
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
        language: 'csharp',
        code,
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
    setOutput('');

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
        setCode(DEFAULT_CODE);
        savedCodeRef.current = DEFAULT_CODE;
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

  const handleDuplicateSnippet = async (snippet: Snippet) => {
    try {
      const newSnippet = await window.electronAPI.db.createSnippet({
        name: `${snippet.name} (Copy)`,
        language: snippet.language,
        code: snippet.code,
      });
      message.success('Snippet duplicated');
      setRefreshTrigger((prev) => prev + 1);

      // Optionally open the duplicated snippet
      setCode(newSnippet.code);
      savedCodeRef.current = newSnippet.code;
      setHasUnsavedChanges(false);
      setCurrentSnippetId(newSnippet.id);
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

    setCode(DEFAULT_CODE);
    savedCodeRef.current = DEFAULT_CODE;
    setHasUnsavedChanges(false);
    setCurrentSnippetId(null);
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

  return (
    <Layout style={{ height: '100vh', background: '#1e1e1e' }}>
      <RuntimeWarning />
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 16px',
          background: '#323233',
          borderBottom: '1px solid #2d2d30',
          height: '48px',
          lineHeight: '48px',
        }}
      >
        <h1
          style={{
            color: '#cccccc',
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
              <Button icon={<SaveOutlined />} onClick={handleSaveAs} title="Save As (Ctrl+Shift+S)">
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
          style={{ color: '#858585' }}
        />
      </Header>

      <Layout ref={layoutRef} style={{ background: '#1e1e1e' }}>
        <Sider
          width={sidebarWidth}
          theme="dark"
          style={{
            background: '#252526',
            borderRight: '1px solid #2d2d30',
            position: 'relative',
          }}
        >
          <SnippetList
            onSelectSnippet={handleSelectSnippet}
            onDeleteSnippet={handleDeleteSnippet}
            onRenameSnippet={handleRenameSnippet}
            onDuplicateSnippet={handleDuplicateSnippet}
            refreshTrigger={refreshTrigger}
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
              background: '#1e1e1e',
            }}
          >
            <CodeEditor value={code} onChange={handleCodeChange} />
          </div>

          {/* Output panel resize handle */}
          <div
            onMouseDown={handleOutputMouseDown}
            style={{
              height: '4px',
              backgroundColor: '#2d2d30',
              cursor: 'ns-resize',
              userSelect: 'none',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#007acc';
            }}
            onMouseLeave={(e) => {
              if (!isDraggingOutput) {
                e.currentTarget.style.backgroundColor = '#2d2d30';
              }
            }}
          />

          <div
            style={{
              height: `${outputHeight}px`,
              backgroundColor: '#181818',
              borderTop: '1px solid #2d2d30',
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
                borderBottom: '1px solid #2d2d30',
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
                      color: '#858585',
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
                  style={{ color: '#858585' }}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={handleClearOutput}
                  title="Clear output"
                  style={{ color: '#858585' }}
                />
              </Space>
            </div>

            {/* Output content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                background: '#1e1e1e',
              }}
            >
              {output ? (
                <OutputDisplay output={output} />
              ) : (
                <div
                  style={{
                    padding: '12px',
                    color: '#858585',
                    fontStyle: 'italic',
                  }}
                >
                  Click &ldquo;Run Code&rdquo; to execute
                </div>
              )}
            </div>
          </div>
        </Content>
      </Layout>

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

      <AboutDialog visible={aboutVisible} onClose={() => setAboutVisible(false)} />
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </Layout>
  );
}

export default App;

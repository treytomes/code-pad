import React, { useState, useRef } from 'react';
import { Button, Layout, Modal, Input, message, Space } from 'antd';
import {
  SaveOutlined,
  PlusOutlined,
  ClearOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { CodeEditor } from './components/Editor';
import { SnippetList } from './components/SnippetList';
import type { Snippet } from '../backend/database';

const { Header, Content, Sider } = Layout;

const DEFAULT_CODE = `// Welcome to CodePad!
// Try editing this C# code

var message = "Hello from CodePad!";
Console.WriteLine(message);

var numbers = new[] { 1, 2, 3, 4, 5 };
var sum = numbers.Sum();
Console.WriteLine($"Sum: {sum}");
`;

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [outputHeight, setOutputHeight] = useState(200);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isDraggingOutput, setIsDraggingOutput] = useState(false);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [currentSnippetId, setCurrentSnippetId] = useState<string | null>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [snippetName, setSnippetName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Executing...');

    try {
      const result = await window.electronAPI.executeCode(code);

      if (result.exitCode === 0) {
        setOutput(result.stdout || '(no output)');
      } else {
        setOutput(
          `Error (exit code ${result.exitCode}):\n${result.stderr || result.error || 'Unknown error'}`
        );
      }

      // Increment execution count if snippet is loaded
      if (currentSnippetId) {
        await window.electronAPI.db.incrementExecution(currentSnippetId);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      setOutput(
        `Failed to execute: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveNew = () => {
    setSnippetName('');
    setSaveModalVisible(true);
  };

  const handleSaveExisting = async () => {
    if (!currentSnippetId) return;

    try {
      await window.electronAPI.db.updateSnippet(currentSnippetId, { code });
      message.success('Snippet updated');
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      message.error('Failed to update snippet');
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
      message.success('Snippet saved');
      setSaveModalVisible(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      message.error('Failed to save snippet');
    }
  };

  const handleSelectSnippet = (snippet: Snippet) => {
    setCode(snippet.code);
    setCurrentSnippetId(snippet.id);
    setOutput('');
  };

  const handleDeleteSnippet = async (id: string) => {
    try {
      await window.electronAPI.db.deleteSnippet(id);
      message.success('Snippet deleted');

      if (currentSnippetId === id) {
        setCurrentSnippetId(null);
        setCode(DEFAULT_CODE);
      }
    } catch (error) {
      message.error('Failed to delete snippet');
    }
  };

  const handleNewSnippet = () => {
    setCode(DEFAULT_CODE);
    setCurrentSnippetId(null);
    setOutput('');
  };

  const handleClearOutput = () => {
    setOutput('');
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
    setIsDraggingOutput(false);
    setIsDraggingSidebar(false);
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

  return (
    <Layout style={{ height: '100vh', background: '#1e1e1e' }}>
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
        <Space>
          <Button
            icon={<PlusOutlined />}
            onClick={handleNewSnippet}
            title="New Snippet"
          >
            New
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={currentSnippetId ? handleSaveExisting : handleSaveNew}
          >
            {currentSnippetId ? 'Update' : 'Save As...'}
          </Button>
          <Button type="primary" onClick={handleRun} loading={isRunning}>
            Run Code
          </Button>
        </Space>
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
                padding: '12px',
                color: '#cccccc',
                fontFamily: "'Consolas', 'Courier New', monospace",
                fontSize: '13px',
                overflowY: 'auto',
              }}
            >
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  color: '#cccccc',
                }}
              >
                {output || 'Click "Run Code" to execute'}
              </pre>
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
    </Layout>
  );
}

export default App;

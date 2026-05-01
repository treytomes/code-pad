import React, { useState, useRef } from 'react';
import { Button, Layout, Modal, Input, message, Space } from 'antd';
import { SaveOutlined, PlusOutlined } from '@ant-design/icons';
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
  const [isDragging, setIsDragging] = useState(false);
  const [currentSnippetId, setCurrentSnippetId] = useState<string | null>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [snippetName, setSnippetName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newHeight = containerRect.bottom - e.clientY;
    const minHeight = 100;
    const maxHeight = containerRect.height - 200;

    setOutputHeight(Math.max(minHeight, Math.min(maxHeight, newHeight)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp as any);
      return () =>
        document.removeEventListener('mouseup', handleMouseUp as any);
    }
  }, [isDragging]);

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

      <Layout style={{ background: '#1e1e1e' }}>
        <Sider
          width={250}
          theme="dark"
          style={{
            background: '#252526',
            borderRight: '1px solid #2d2d30',
          }}
        >
          <SnippetList
            onSelectSnippet={handleSelectSnippet}
            onDeleteSnippet={handleDeleteSnippet}
            refreshTrigger={refreshTrigger}
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

          {/* Resize handle */}
          <div
            onMouseDown={handleMouseDown}
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
              if (!isDragging) {
                e.currentTarget.style.backgroundColor = '#2d2d30';
              }
            }}
          />

          <div
            style={{
              height: `${outputHeight}px`,
              padding: '12px',
              backgroundColor: '#181818',
              color: '#cccccc',
              fontFamily: "'Consolas', 'Courier New', monospace",
              fontSize: '13px',
              overflowY: 'auto',
              borderTop: '1px solid #2d2d30',
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
            <pre
              style={{
                margin: '8px 0 0 0',
                whiteSpace: 'pre-wrap',
                color: '#cccccc',
              }}
            >
              {output || 'Click "Run Code" to execute'}
            </pre>
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

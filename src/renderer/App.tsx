import React, { useState, useRef } from 'react';
import { Button, Layout } from 'antd';
import { CodeEditor } from './components/Editor';

const { Header, Content } = Layout;

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
    } catch (error) {
      setOutput(
        `Failed to execute: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsRunning(false);
    }
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
      return () => document.removeEventListener('mouseup', handleMouseUp as any);
    }
  }, [isDragging]);

  return (
    <Layout style={{ height: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 16px',
        }}
      >
        <h1 style={{ color: 'white', margin: 0 }}>CodePad</h1>
        <Button type="primary" onClick={handleRun} loading={isRunning}>
          Run Code
        </Button>
      </Header>
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
            border: '1px solid #d9d9d9',
            borderBottom: 'none',
          }}
        >
          <CodeEditor value={code} onChange={handleCodeChange} />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            height: '4px',
            backgroundColor: '#d9d9d9',
            cursor: 'ns-resize',
            userSelect: 'none',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1890ff';
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.backgroundColor = '#d9d9d9';
            }
          }}
        />

        <div
          style={{
            height: `${outputHeight}px`,
            border: '1px solid #d9d9d9',
            borderTop: 'none',
            padding: '8px',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            fontFamily: 'monospace',
            fontSize: '14px',
            overflowY: 'auto',
          }}
        >
          <strong style={{ color: '#4ec9b0' }}>Output:</strong>
          <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>
            {output || 'Click "Run Code" to execute'}
          </pre>
        </div>
      </Content>
    </Layout>
  );
}

export default App;

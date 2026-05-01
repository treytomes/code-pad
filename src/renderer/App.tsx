import React, { useState } from 'react';
import { Button, Layout, Typography } from 'antd';
import { CodeEditor } from './components/Editor';

const { Header, Content } = Layout;
const { Paragraph } = Typography;

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

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h1 style={{ color: 'white', margin: 0 }}>CodePad</h1>
        <Button type="primary" onClick={handleRun} loading={isRunning}>
          Run Code
        </Button>
      </Header>
      <Content style={{ padding: '20px', display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, border: '1px solid #d9d9d9' }}>
          <CodeEditor value={code} onChange={handleCodeChange} />
        </div>
        <div
          style={{
            width: '400px',
            border: '1px solid #d9d9d9',
            padding: '10px',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            fontFamily: 'monospace',
            fontSize: '14px',
            overflowY: 'auto',
          }}
        >
          <strong style={{ color: '#4ec9b0' }}>Output:</strong>
          <pre style={{ margin: '10px 0', whiteSpace: 'pre-wrap' }}>
            {output || 'Click "Run Code" to execute'}
          </pre>
        </div>
      </Content>
    </Layout>
  );
}

export default App;

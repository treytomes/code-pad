import React, { useState } from 'react';
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

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    console.log('Code changed:', newCode.substring(0, 50) + '...');
  };

  const handleRun = () => {
    console.log('Running code:', code);
    // TODO: Integrate with C# executor
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h1 style={{ color: 'white', margin: 0 }}>CodePad</h1>
        <Button type="primary" onClick={handleRun}>
          Run Code
        </Button>
      </Header>
      <Content style={{ padding: '20px' }}>
        <div style={{ height: '100%', border: '1px solid #d9d9d9' }}>
          <CodeEditor value={code} onChange={handleCodeChange} />
        </div>
      </Content>
    </Layout>
  );
}

export default App;

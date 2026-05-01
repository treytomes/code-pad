import React from 'react';
import { Button } from 'antd';

function App() {
  const handleClick = () => {
    console.log('Button clicked!');
    // Test the electron API
    if (window.electronAPI) {
      console.log('Electron API:', window.electronAPI.ping());
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>CodePad - Hello World</h1>
      <p>Welcome to CodePad! This is a proof-of-concept Electron + React app.</p>
      <Button type="primary" onClick={handleClick}>
        Test Button
      </Button>
    </div>
  );
}

export default App;

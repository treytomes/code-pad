import React from 'react';
import { Alert } from 'antd';
import { WarningOutlined } from '@ant-design/icons';

interface PythonWarningProps {
  isDark?: boolean;
}

export const PythonWarning: React.FC<PythonWarningProps> = ({ isDark = true }) => {
  const isWindows = navigator.userAgent.includes('Windows');
  const isMac = navigator.userAgent.includes('Mac');
  const isLinux = !isWindows && !isMac;

  return (
    <Alert
      message="Python Not Found"
      description={
        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '12px' }}>
            Python 3.8 or higher is required to run Python scripts in CodePad.
          </p>
          <p style={{ marginBottom: '8px', fontWeight: 600 }}>Installation Instructions:</p>
          <ul style={{ marginBottom: '12px', paddingLeft: '20px' }}>
            {isWindows && (
              <>
                <li>
                  Download from{' '}
                  <a
                    href="https://www.python.org/downloads/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#1890ff' }}
                  >
                    python.org/downloads
                  </a>
                </li>
                <li>During installation, check "Add Python to PATH"</li>
                <li>Or install via Microsoft Store: <code>winget install Python.Python.3.12</code></li>
              </>
            )}
            {isMac && (
              <>
                <li>
                  Using Homebrew: <code style={{ background: isDark ? '#2d2d2d' : '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>brew install python3</code>
                </li>
                <li>
                  Or download from{' '}
                  <a
                    href="https://www.python.org/downloads/macos/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#1890ff' }}
                  >
                    python.org
                  </a>
                </li>
              </>
            )}
            {isLinux && (
              <>
                <li>
                  Ubuntu/Debian: <code style={{ background: isDark ? '#2d2d2d' : '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>sudo apt install python3</code>
                </li>
                <li>
                  Fedora: <code style={{ background: isDark ? '#2d2d2d' : '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>sudo dnf install python3</code>
                </li>
                <li>
                  Arch: <code style={{ background: isDark ? '#2d2d2d' : '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>sudo pacman -S python</code>
                </li>
              </>
            )}
          </ul>
          <p style={{ marginBottom: '8px' }}>
            After installation, restart CodePad for changes to take effect.
          </p>
          <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: 0 }}>
            Or set a custom Python path in <strong>Settings → Execution → Python Interpreter</strong>
          </p>
        </div>
      }
      type="warning"
      icon={<WarningOutlined />}
      showIcon
      style={{
        marginTop: '16px',
        border: isDark ? '1px solid #faad14' : '1px solid #ffc53d',
        background: isDark ? '#2d2410' : '#fffbe6',
      }}
    />
  );
};

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import './styles/index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
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
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
        },
        components: {
          Layout: {
            headerBg: '#323233',
            headerPadding: '0 16px',
            headerHeight: 48,
            siderBg: '#252526',
            bodyBg: '#1e1e1e',
          },
          Button: {
            colorBgContainer: '#2d2d30',
            colorBorder: '#2d2d30',
          },
          Input: {
            colorBgContainer: '#181818',
          },
          Select: {
            colorBgContainer: '#181818',
            colorBgElevated: '#252526',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);

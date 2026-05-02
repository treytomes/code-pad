import React, { useEffect, useState } from 'react';
import { Modal, Typography, Button, Alert } from 'antd';
import { WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Link, Text } = Typography;

interface RuntimeInfo {
  hasDotnet: boolean;
  hasDotnetScript: boolean;
  dotnetVersion?: string;
  dotnetScriptVersion?: string;
  error?: string;
}

export const RuntimeWarning: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);
  const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfo | null>(null);

  const checkRuntime = async () => {
    setChecking(true);
    try {
      const info = await window.electronAPI.checkRuntime();
      setRuntimeInfo(info);

      // Show warning if requirements not met
      if (!info.hasDotnet || !info.hasDotnetScript) {
        setVisible(true);
      }
    } catch (error) {
      console.error('Failed to check runtime:', error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkRuntime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return null;
  }

  if (!runtimeInfo || (runtimeInfo.hasDotnet && runtimeInfo.hasDotnetScript)) {
    return null;
  }

  return (
    <Modal
      open={visible}
      onCancel={() => setVisible(false)}
      footer={[
        <Button key="close" type="primary" onClick={() => setVisible(false)}>
          I&apos;ll Install Later
        </Button>,
      ]}
      width={600}
      closable={false}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <WarningOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
        <Title level={3}>Runtime Requirements Missing</Title>

        <div style={{ textAlign: 'left', marginTop: '24px' }}>
          {!runtimeInfo.hasDotnet && (
            <Alert
              message=".NET SDK Not Found"
              description={
                <>
                  <Paragraph>CodePad requires the .NET SDK to execute C# code.</Paragraph>
                  <Paragraph>
                    <strong>To install:</strong>
                  </Paragraph>
                  <ol style={{ marginLeft: '20px' }}>
                    <li>
                      Download from{' '}
                      <Link href="https://dotnet.microsoft.com/download" target="_blank">
                        https://dotnet.microsoft.com/download
                      </Link>
                    </li>
                    <li>Install the latest .NET SDK (8.0 or later recommended)</li>
                    <li>Restart CodePad after installation</li>
                  </ol>
                </>
              }
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {runtimeInfo.hasDotnet && runtimeInfo.dotnetVersion && (
            <Alert
              message={
                <>
                  <CheckCircleOutlined style={{ marginRight: '8px' }} />
                  .NET SDK {runtimeInfo.dotnetVersion} Found
                </>
              }
              type="success"
              showIcon={false}
              style={{ marginBottom: '16px' }}
            />
          )}

          {!runtimeInfo.hasDotnetScript && (
            <Alert
              message="dotnet-script Not Found"
              description={
                <>
                  <Paragraph>CodePad uses dotnet-script to run C# code as scripts.</Paragraph>
                  <Paragraph>
                    <strong>To install:</strong>
                  </Paragraph>
                  <ol style={{ marginLeft: '20px' }}>
                    <li>Open a terminal or command prompt</li>
                    <li>
                      Run: <Text code>dotnet tool install -g dotnet-script</Text>
                    </li>
                    <li>Restart CodePad after installation</li>
                  </ol>
                </>
              }
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {runtimeInfo.hasDotnetScript && runtimeInfo.dotnetScriptVersion && (
            <Alert
              message={
                <>
                  <CheckCircleOutlined style={{ marginRight: '8px' }} />
                  dotnet-script {runtimeInfo.dotnetScriptVersion} Found
                </>
              }
              type="success"
              showIcon={false}
              style={{ marginBottom: '16px' }}
            />
          )}

          <Paragraph style={{ marginTop: '16px', fontSize: '12px', color: '#858585' }}>
            You can continue using CodePad, but C# code execution will not work until these
            requirements are installed.
          </Paragraph>
        </div>
      </div>
    </Modal>
  );
};

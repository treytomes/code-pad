import React, { useEffect, useState } from 'react';
import { Modal, Typography, Button, Alert, Spin } from 'antd';
import { WarningOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';

const { Title, Paragraph, Link, Text } = Typography;

interface RuntimeInfo {
  hasDotnet: boolean;
  hasDotnetScript: boolean;
  dotnetVersion?: string;
  dotnetScriptVersion?: string;
  error?: string;
}

type InstallState = 'idle' | 'installing' | 'success' | 'error';

export const RuntimeWarning: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);
  const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfo | null>(null);
  const [installState, setInstallState] = useState<InstallState>('idle');
  const [installError, setInstallError] = useState<string | undefined>(undefined);

  const checkRuntime = async () => {
    setChecking(true);
    try {
      const info = await window.electronAPI.checkRuntime();
      setRuntimeInfo(info);

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

    // Listen for background auto-install result
    const cleanup = window.electronAPI.onDotnetScriptInstallResult((result) => {
      if (result.success) {
        setInstallState('success');
        // Auto-close after 2 seconds on success
        setTimeout(() => setVisible(false), 2000);
      } else {
        setInstallState('error');
        setInstallError(result.error);
      }
    });

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstallNow = async () => {
    setInstallState('installing');
    setInstallError(undefined);
    try {
      const result = await window.electronAPI.installDotnetScript();
      if (result.success) {
        setInstallState('success');
        setTimeout(() => setVisible(false), 2000);
      } else {
        setInstallState('error');
        setInstallError(result.error);
      }
    } catch (error) {
      setInstallState('error');
      setInstallError(error instanceof Error ? error.message : String(error));
    }
  };

  if (checking) {
    return null;
  }

  if (!runtimeInfo || (runtimeInfo.hasDotnet && runtimeInfo.hasDotnetScript)) {
    return null;
  }

  const canAutoInstall = runtimeInfo.hasDotnet && !runtimeInfo.hasDotnetScript;

  const footer = [
    <Button key="close" onClick={() => setVisible(false)} disabled={installState === 'installing'}>
      I&apos;ll Install Later
    </Button>,
  ];

  if (canAutoInstall && installState !== 'success') {
    footer.unshift(
      <Button
        key="install"
        type="primary"
        onClick={handleInstallNow}
        disabled={installState === 'installing'}
        icon={installState === 'installing' ? <LoadingOutlined /> : undefined}
      >
        {installState === 'installing' ? 'Installing...' : 'Install Now'}
      </Button>
    );
  }

  return (
    <Modal
      open={visible}
      onCancel={() => installState !== 'installing' && setVisible(false)}
      footer={footer}
      width={600}
      closable={false}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {installState === 'success' ? (
          <CheckCircleOutlined
            style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }}
          />
        ) : (
          <WarningOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
        )}
        <Title level={3}>
          {installState === 'success' ? 'dotnet-script Installed!' : 'Runtime Requirements Missing'}
        </Title>

        {installState === 'installing' && (
          <div style={{ margin: '24px 0', textAlign: 'center' }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: '16px' }}>
              Installing dotnet-script, please wait…
            </Paragraph>
          </div>
        )}

        {installState === 'success' && (
          <Paragraph style={{ marginTop: '16px', color: '#52c41a' }}>
            dotnet-script was installed successfully. This window will close automatically.
          </Paragraph>
        )}

        {installState === 'error' && installError && (
          <Alert
            message="Installation Failed"
            description={
              <>
                <Paragraph>{installError}</Paragraph>
                <Paragraph>
                  <strong>Manual install:</strong> Open a terminal and run:{' '}
                  <Text code>dotnet tool install -g dotnet-script</Text>
                </Paragraph>
              </>
            }
            type="error"
            showIcon
            style={{ marginBottom: '16px', textAlign: 'left' }}
          />
        )}

        {installState === 'idle' && (
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
                    {canAutoInstall ? (
                      <Paragraph>
                        Click <strong>Install Now</strong> to install it automatically, or run
                        manually: <Text code>dotnet tool install -g dotnet-script</Text>
                      </Paragraph>
                    ) : (
                      <>
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
                    )}
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
        )}
      </div>
    </Modal>
  );
};

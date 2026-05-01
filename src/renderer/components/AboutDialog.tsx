import React from 'react';
import { Modal, Typography, Divider, Space, Tag } from 'antd';
import { GithubOutlined, CodeOutlined } from '@ant-design/icons';

const { Title, Paragraph, Link, Text } = Typography;

interface AboutDialogProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ visible, onClose }) => {
  const version = '0.1.0';
  const electronVersion = window.electronAPI.versions.electron;
  const chromeVersion = window.electronAPI.versions.chrome;
  const nodeVersion = window.electronAPI.versions.node;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <CodeOutlined style={{ fontSize: '64px', color: '#007acc', marginBottom: '16px' }} />

        <Title level={2} style={{ margin: '8px 0' }}>
          CodePad
        </Title>

        <Text type="secondary" style={{ fontSize: '16px' }}>
          Version {version}
        </Text>

        <Divider />

        <div style={{ textAlign: 'left' }}>
          <Paragraph>
            A cross-platform code scratchpad and rapid prototyping tool inspired by LINQPad.
            Execute code snippets across multiple programming languages without the overhead
            of creating full projects.
          </Paragraph>

          <Paragraph strong style={{ marginTop: '16px', marginBottom: '8px' }}>
            Features:
          </Paragraph>
          <ul style={{ paddingLeft: '20px', marginTop: '0' }}>
            <li>C# code execution with dotnet-script</li>
            <li>Monaco Editor with IntelliSense</li>
            <li>Real-time streaming output</li>
            <li>Starred snippets & search</li>
            <li>Import/Export snippets</li>
            <li>Cross-platform support</li>
          </ul>

          <Divider />

          <div style={{ marginBottom: '16px' }}>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
              Built with:
            </Text>
            <Space wrap>
              <Tag color="blue">Electron {electronVersion}</Tag>
              <Tag color="green">Node {nodeVersion}</Tag>
              <Tag color="cyan">Chrome {chromeVersion}</Tag>
              <Tag color="purple">React 19</Tag>
              <Tag color="orange">TypeScript</Tag>
            </Space>
          </div>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <Space direction="vertical" size="small">
              <Link
                href="https://github.com/treytomes/code-pad"
                target="_blank"
              >
                <GithubOutlined style={{ marginRight: '8px' }} />
                View on GitHub
              </Link>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                MIT License © 2026 CodePad Team
              </Text>
            </Space>
          </div>
        </div>
      </div>
    </Modal>
  );
};

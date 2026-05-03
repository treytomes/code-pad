import React, { useState } from 'react';
import { Modal, Typography } from 'antd';
import {
  ThunderboltOutlined,
  SaveOutlined,
  CodeOutlined,
  AppstoreOutlined,
  BulbOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const STORAGE_KEY = 'codepad-welcomed';

interface TipProps {
  icon: React.ReactNode;
  shortcut: string;
  description: string;
}

const Tip: React.FC<TipProps> = ({ icon, shortcut, description }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
    <div style={{ fontSize: '20px', marginTop: '1px', flexShrink: 0 }}>{icon}</div>
    <div>
      <Text code style={{ fontSize: '13px' }}>
        {shortcut}
      </Text>
      <span style={{ marginLeft: '8px', fontSize: '13px' }}>{description}</span>
    </div>
  </div>
);

export const WelcomeModal: React.FC = () => {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <Modal
      open={visible}
      onCancel={handleDismiss}
      onOk={handleDismiss}
      okText="Get Started"
      cancelButtonProps={{ style: { display: 'none' } }}
      width={480}
      title={null}
      centered
    >
      <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
        <Title level={3} style={{ marginBottom: '4px' }}>
          Welcome to CodePad
        </Title>
        <Paragraph style={{ color: '#858585', marginBottom: '24px' }}>
          A C# scratchpad for rapid prototyping — no project setup required.
        </Paragraph>
      </div>

      <Tip
        icon={<ThunderboltOutlined style={{ color: '#4ec9b0' }} />}
        shortcut="F5"
        description="Run your code instantly"
      />
      <Tip
        icon={<SaveOutlined style={{ color: '#007acc' }} />}
        shortcut="Ctrl+S"
        description="Save the current snippet"
      />
      <Tip
        icon={<CodeOutlined style={{ color: '#ce9178' }} />}
        shortcut=".Dump()"
        description='Output any object as structured JSON — try person.Dump("label")'
      />
      <Tip
        icon={<AppstoreOutlined style={{ color: '#569cd6' }} />}
        shortcut="Samples tab"
        description="12 ready-to-run examples in the sidebar"
      />
      <Tip
        icon={<BulbOutlined style={{ color: '#dcdcaa' }} />}
        shortcut="Ctrl+N"
        description="Start a fresh snippet at any time"
      />
    </Modal>
  );
};

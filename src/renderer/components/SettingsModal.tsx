import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Form, InputNumber, Select, Switch, Button, message, Divider } from 'antd';
import type { TabsProps } from 'antd';

const { Option } = Select;

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Settings {
  // Editor settings
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;

  // Execution settings
  timeout: number;
  autoSave: boolean;

  // UI settings
  theme: 'dark' | 'light';
  sidebarWidth: number;
  outputHeight: number;
}

const DEFAULT_SETTINGS: Settings = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
  timeout: 30000,
  autoSave: false,
  theme: 'dark',
  sidebarWidth: 250,
  outputHeight: 200,
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = () => {
    // TODO: Load from database
    const stored = localStorage.getItem('codepad-settings');
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  };

  const handleSave = () => {
    try {
      // TODO: Save to database via IPC
      localStorage.setItem('codepad-settings', JSON.stringify(settings));
      message.success('Settings saved');
      setHasChanges(false);
      onClose();

      // Reload to apply changes
      window.location.reload();
    } catch (error) {
      console.error('Failed to save settings:', error);
      message.error('Failed to save settings');
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
    message.info('Settings reset to defaults (click Save to apply)');
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const editorTab = (
    <Form layout="vertical" style={{ marginTop: '16px' }}>
      <Form.Item label="Font Size">
        <InputNumber
          min={10}
          max={32}
          value={settings.fontSize}
          onChange={(value) => updateSetting('fontSize', value || 14)}
          addonAfter="px"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="Tab Size">
        <Select
          value={settings.tabSize}
          onChange={(value) => updateSetting('tabSize', value)}
        >
          <Option value={2}>2 spaces</Option>
          <Option value={4}>4 spaces</Option>
          <Option value={8}>8 spaces</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Word Wrap">
        <Switch
          checked={settings.wordWrap}
          onChange={(checked) => updateSetting('wordWrap', checked)}
        />
        <span style={{ marginLeft: '8px', color: '#858585', fontSize: '12px' }}>
          Wrap long lines
        </span>
      </Form.Item>

      <Form.Item label="Line Numbers">
        <Switch
          checked={settings.lineNumbers}
          onChange={(checked) => updateSetting('lineNumbers', checked)}
        />
        <span style={{ marginLeft: '8px', color: '#858585', fontSize: '12px' }}>
          Show line numbers in editor
        </span>
      </Form.Item>

      <Form.Item label="Minimap">
        <Switch
          checked={settings.minimap}
          onChange={(checked) => updateSetting('minimap', checked)}
        />
        <span style={{ marginLeft: '8px', color: '#858585', fontSize: '12px' }}>
          Show code minimap (requires reload)
        </span>
      </Form.Item>
    </Form>
  );

  const executionTab = (
    <Form layout="vertical" style={{ marginTop: '16px' }}>
      <Form.Item label="Execution Timeout">
        <InputNumber
          min={0}
          max={300000}
          step={5000}
          value={settings.timeout}
          onChange={(value) => updateSetting('timeout', value ?? 30000)}
          addonAfter="ms"
          style={{ width: '100%' }}
        />
        <div style={{ marginTop: '4px', color: '#858585', fontSize: '12px' }}>
          Maximum execution time. Set to 0 to disable timeout (run indefinitely). Use Stop button to cancel.
        </div>
      </Form.Item>

      <Form.Item label="Auto-Save">
        <Switch
          checked={settings.autoSave}
          onChange={(checked) => updateSetting('autoSave', checked)}
        />
        <span style={{ marginLeft: '8px', color: '#858585', fontSize: '12px' }}>
          Automatically save snippets after execution
        </span>
      </Form.Item>
    </Form>
  );

  const appearanceTab = (
    <Form layout="vertical" style={{ marginTop: '16px' }}>
      <Form.Item label="Theme">
        <Select
          value={settings.theme}
          onChange={(value) => updateSetting('theme', value)}
          disabled
        >
          <Option value="dark">Dark (VS Code)</Option>
          <Option value="light">Light (Coming Soon)</Option>
        </Select>
        <div style={{ marginTop: '4px', color: '#858585', fontSize: '12px' }}>
          Light theme support coming in Phase 2
        </div>
      </Form.Item>

      <Divider />

      <div style={{ color: '#858585', fontSize: '12px', marginBottom: '8px' }}>
        Panel sizes can be adjusted by dragging the borders
      </div>

      <Form.Item label="Default Sidebar Width">
        <InputNumber
          min={150}
          max={500}
          value={settings.sidebarWidth}
          onChange={(value) => updateSetting('sidebarWidth', value || 250)}
          addonAfter="px"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="Default Output Height">
        <InputNumber
          min={100}
          max={600}
          value={settings.outputHeight}
          onChange={(value) => updateSetting('outputHeight', value || 200)}
          addonAfter="px"
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );

  const items: TabsProps['items'] = [
    {
      key: 'editor',
      label: 'Editor',
      children: editorTab,
    },
    {
      key: 'execution',
      label: 'Execution',
      children: executionTab,
    },
    {
      key: 'appearance',
      label: 'Appearance',
      children: appearanceTab,
    },
  ];

  return (
    <Modal
      title="Settings"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="reset" onClick={handleReset}>
          Reset to Defaults
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave} disabled={!hasChanges}>
          Save
        </Button>,
      ]}
    >
      <Tabs items={items} />
    </Modal>
  );
};

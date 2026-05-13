import React, { useState, useEffect } from 'react';
import {
  Modal,
  Tabs,
  Form,
  InputNumber,
  Select,
  Switch,
  Button,
  message,
  Divider,
  Input,
  Spin,
} from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';

const { Option } = Select;

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onThemeChange?: (theme: 'dark' | 'light' | 'system') => void;
  onSettingsSaved?: () => void;
  onShowWelcome?: () => void;
}

interface Settings {
  // Editor settings
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  folding: boolean;
  parameterHints: boolean;

  // Execution settings
  timeout: number;
  autoSave: boolean;
  targetFramework: string;
  pythonPath?: string;

  // UI settings
  theme: 'dark' | 'light' | 'system';
  sidebarWidth: number;
  outputHeight: number;
}

const DEFAULT_SETTINGS: Settings = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
  folding: true,
  parameterHints: true,
  timeout: 30000,
  autoSave: false,
  targetFramework: 'net8.0',
  pythonPath: undefined,
  theme: 'system',
  sidebarWidth: 250,
  outputHeight: 200,
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onThemeChange,
  onSettingsSaved,
  onShowWelcome,
}) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [dbPath, setDbPath] = useState('');
  const [dbChanging, setDbChanging] = useState(false);
  const [installedFrameworks, setInstalledFrameworks] = useState<string[]>(['net8.0']);
  const [frameworksLoading, setFrameworksLoading] = useState(false);

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

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSettings();
      window.electronAPI.getDbPath().then(setDbPath).catch(console.error);
      setFrameworksLoading(true);
      window.electronAPI.getInstalledFrameworks()
        .then((frameworks) => {
          setInstalledFrameworks(frameworks);
        })
        .catch(() => setInstalledFrameworks(['net8.0']))
        .finally(() => setFrameworksLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleChangeDbPath = async () => {
    setDbChanging(true);
    try {
      const result = await window.electronAPI.setDbPath();
      if (result.success && result.path) {
        setDbPath(result.path);
        message.success('Database location updated. Restart may be needed for full effect.');
      } else if (result.error && result.error !== 'Canceled') {
        message.error(`Failed to change database location: ${result.error}`);
      }
    } finally {
      setDbChanging(false);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem('codepad-settings', JSON.stringify(settings));
      message.success('Settings saved');
      setHasChanges(false);
      onThemeChange?.(settings.theme);
      onSettingsSaved?.();
      onClose();
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
    setSettings((prev) => ({ ...prev, [key]: value }));
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
        <Select value={settings.tabSize} onChange={(value) => updateSetting('tabSize', value)}>
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
          Show code minimap
        </span>
      </Form.Item>

      <Form.Item label="Code Folding">
        <Switch
          checked={settings.folding}
          onChange={(checked) => updateSetting('folding', checked)}
        />
        <span style={{ marginLeft: '8px', color: '#858585', fontSize: '12px' }}>
          Show fold/unfold controls in the gutter
        </span>
      </Form.Item>

      <Form.Item label="Parameter Hints">
        <Switch
          checked={settings.parameterHints}
          onChange={(checked) => updateSetting('parameterHints', checked)}
        />
        <span style={{ marginLeft: '8px', color: '#858585', fontSize: '12px' }}>
          Show method signature help while typing
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
          Maximum execution time. Set to 0 to disable timeout (run indefinitely). Use Stop button to
          cancel.
        </div>
      </Form.Item>

      <Form.Item
        label="Target Framework"
        extra="Select the .NET version to compile against. Use a version that matches your referenced assemblies."
      >
        <Spin spinning={frameworksLoading} size="small">
          <Select
            value={settings.targetFramework}
            onChange={(value) => updateSetting('targetFramework', value)}
            style={{ width: '100%' }}
          >
            {installedFrameworks.map((fw) => (
              <Option key={fw} value={fw}>{fw}</Option>
            ))}
            {!installedFrameworks.includes(settings.targetFramework) && (
              <Option value={settings.targetFramework}>{settings.targetFramework}</Option>
            )}
          </Select>
        </Spin>
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

      <Divider />

      <Form.Item
        label="Python Interpreter Path"
        extra="Optional: Specify a custom Python interpreter path. Leave empty to auto-detect python3/python in PATH."
      >
        <Input
          placeholder="e.g., /usr/bin/python3 or C:\Python312\python.exe"
          value={settings.pythonPath}
          onChange={(e) => updateSetting('pythonPath', e.target.value || undefined)}
          allowClear
        />
      </Form.Item>
    </Form>
  );

  const appearanceTab = (
    <Form layout="vertical" style={{ marginTop: '16px' }}>
      <Form.Item label="Theme">
        <Select value={settings.theme} onChange={(value) => updateSetting('theme', value)}>
          <Option value="system">System Default</Option>
          <Option value="dark">Dark (VS Code)</Option>
          <Option value="light">Light</Option>
        </Select>
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

      <Divider />

      <Form.Item
        label="Database Location"
        extra="Changing this copies your existing snippets to the new location."
      >
        <Input.Group compact>
          <Input value={dbPath} readOnly style={{ width: 'calc(100% - 110px)' }} />
          <Button
            icon={<FolderOpenOutlined />}
            onClick={handleChangeDbPath}
            loading={dbChanging}
            style={{ width: '110px' }}
          >
            Change…
          </Button>
        </Input.Group>
      </Form.Item>

      <Divider />

      <Form.Item label="Welcome Screen">
        <Button onClick={() => { onClose(); onShowWelcome?.(); }}>
          Show Welcome Screen
        </Button>
        <div style={{ marginTop: '4px', color: '#858585', fontSize: '12px' }}>
          Re-open the getting started guide
        </div>
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

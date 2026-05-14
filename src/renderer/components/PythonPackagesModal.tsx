import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Space, Typography, Table, Tag, message, Progress, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import type { SnippetPackage } from '../../backend/database';
import type { PackageInstallResult, VirtualEnvironmentInfo } from '../../backend/pip-manager';

const { Text } = Typography;

interface Props {
  open: boolean;
  snippetId: string | null;
  onCancel: () => void;
  isDark?: boolean;
}

export default function PythonPackagesModal({ open, snippetId, onCancel, isDark = true }: Props) {
  const [packages, setPackages] = useState<SnippetPackage[]>([]);
  const [installedPackages, setInstalledPackages] = useState<Record<string, string>>({});
  const [venvInfo, setVenvInfo] = useState<VirtualEnvironmentInfo | null>(null);
  const [newPackageName, setNewPackageName] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success' | 'error'>('idle');
  const [installMessage, setInstallMessage] = useState('');

  // Load snippet packages and venv info when modal opens
  useEffect(() => {
    if (open && snippetId) {
      loadPackages();
      loadVenvInfo();
      loadInstalledPackages();
    }
  }, [open, snippetId]);

  const loadPackages = async () => {
    if (!snippetId) return;
    try {
      const pkgs = await window.electronAPI.db.getSnippetPackages(snippetId);
      setPackages(pkgs);
    } catch (error) {
      message.error('Failed to load packages');
      console.error('Failed to load packages:', error);
    }
  };

  const loadVenvInfo = async () => {
    try {
      const info = await window.electronAPI.venvGetInfo();
      setVenvInfo(info);
    } catch (error) {
      console.error('Failed to load venv info:', error);
    }
  };

  const loadInstalledPackages = async () => {
    try {
      const installed = await window.electronAPI.pipListInstalled();
      setInstalledPackages(installed);
    } catch (error) {
      console.error('Failed to load installed packages:', error);
    }
  };

  const addPackage = async () => {
    const name = newPackageName.trim();
    if (!name || !snippetId) return;

    // Basic validation: alphanumeric, hyphens, underscores, and version specs
    if (!/^[a-zA-Z0-9_-]+([<>=!]+[0-9.]+)?$/.test(name)) {
      message.error('Invalid package name. Use format: package-name or package-name>=1.0.0');
      return;
    }

    try {
      // Parse package name and version
      const match = name.match(/^([a-zA-Z0-9_-]+)([<>=!]+[0-9.]+)?$/);
      const packageName = match?.[1] || name;
      const packageVersion = match?.[2] || undefined;

      const pkg = await window.electronAPI.db.addSnippetPackage(snippetId, packageName, packageVersion);
      setPackages([...packages, pkg]);
      setNewPackageName('');
      message.success(`Added ${packageName}`);
    } catch (error) {
      message.error('Failed to add package');
      console.error('Failed to add package:', error);
    }
  };

  const removePackage = async (packageName: string) => {
    if (!snippetId) return;

    try {
      await window.electronAPI.db.removeSnippetPackage(snippetId, packageName);
      setPackages(packages.filter((p) => p.packageName !== packageName));
      message.success(`Removed ${packageName}`);
    } catch (error) {
      message.error('Failed to remove package');
      console.error('Failed to remove package:', error);
    }
  };

  const installPackages = async () => {
    if (packages.length === 0) {
      message.warning('No packages to install');
      return;
    }

    setIsInstalling(true);
    setInstallStatus('installing');
    setInstallProgress(0);
    setInstallMessage('Installing packages...');

    try {
      // Create venv if it doesn't exist
      if (!venvInfo?.exists) {
        setInstallMessage('Creating virtual environment...');
        const createResult = await window.electronAPI.venvCreate();
        if (!createResult.success) {
          throw new Error(createResult.error || 'Failed to create virtual environment');
        }
        setInstallProgress(20);
      } else {
        setInstallProgress(20);
      }

      // Build package list with versions
      const packageSpecs = packages.map((p) =>
        p.packageVersion ? `${p.packageName}${p.packageVersion}` : p.packageName
      );

      setInstallMessage(`Installing ${packageSpecs.join(', ')}...`);
      setInstallProgress(40);

      const result: PackageInstallResult = await window.electronAPI.pipInstallPackages(packageSpecs);

      setInstallProgress(100);

      if (result.success) {
        setInstallStatus('success');
        setInstallMessage(
          `Successfully installed: ${result.installedPackages.join(', ') || packageSpecs.join(', ')}`
        );
        message.success('Packages installed successfully');

        // Reload installed packages list
        await loadInstalledPackages();
      } else {
        setInstallStatus('error');
        setInstallMessage(`Failed to install some packages:\n${result.stderr}`);
        message.error('Some packages failed to install');
      }
    } catch (error) {
      setInstallStatus('error');
      setInstallMessage(`Installation error: ${error instanceof Error ? error.message : String(error)}`);
      message.error('Package installation failed');
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
      // Reset after 5 seconds
      setTimeout(() => {
        setInstallStatus('idle');
        setInstallProgress(0);
      }, 5000);
    }
  };

  const isPackageInstalled = (packageName: string): boolean => {
    return packageName in installedPackages;
  };

  const getInstalledVersion = (packageName: string): string | undefined => {
    return installedPackages[packageName];
  };

  const inputStyle: React.CSSProperties = {
    background: isDark ? '#3c3c3c' : '#ffffff',
    borderColor: isDark ? '#555' : '#d9d9d9',
    color: isDark ? '#cccccc' : '#000000',
  };

  const columns = [
    {
      title: 'Package',
      dataIndex: 'packageName',
      key: 'packageName',
      render: (name: string, record: SnippetPackage) => (
        <Space>
          <Text style={{ color: isDark ? '#cccccc' : '#000000' }}>
            {name}
            {record.packageVersion && (
              <Text style={{ color: isDark ? '#858585' : '#666666' }}> {record.packageVersion}</Text>
            )}
          </Text>
          {isPackageInstalled(name) ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              {getInstalledVersion(name)}
            </Tag>
          ) : (
            <Tag icon={<WarningOutlined />} color="warning">
              Not Installed
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: any, record: SnippetPackage) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removePackage(record.packageName)}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={<Text style={{ color: isDark ? '#cccccc' : '#000000' }}>Python Script Properties</Text>}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Close
        </Button>,
      ]}
      width={700}
      style={{ top: 40 }}
      styles={{
        body: { background: isDark ? '#1e1e1e' : '#ffffff', maxHeight: '70vh', overflowY: 'auto' },
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Virtual Environment Info */}
        <div>
          <Text style={{ color: isDark ? '#858585' : '#666666', fontSize: '12px' }}>
            Virtual Environment:{' '}
            {venvInfo?.exists ? (
              <Text style={{ color: '#4ec9b0' }}>✓ Active</Text>
            ) : (
              <Text style={{ color: '#ce9178' }}>Not Created</Text>
            )}
          </Text>
          {venvInfo?.path && (
            <div style={{ marginTop: 4 }}>
              <Text style={{ color: isDark ? '#858585' : '#666666', fontSize: '11px' }}>
                {venvInfo.path}
              </Text>
            </div>
          )}
        </div>

        {/* Add Package Input */}
        <div>
          <Text style={{ color: isDark ? '#cccccc' : '#000000', marginBottom: 8, display: 'block' }}>
            Add pip Package
          </Text>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="requests, numpy>=1.20.0, pandas"
              value={newPackageName}
              onChange={(e) => setNewPackageName(e.target.value)}
              onPressEnter={addPackage}
              style={inputStyle}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={addPackage}>
              Add
            </Button>
          </Space.Compact>
          <Text style={{ color: isDark ? '#858585' : '#666666', fontSize: '11px', marginTop: 4 }}>
            Examples: requests, numpy&gt;=1.20.0, pandas==2.0.0
          </Text>
        </div>

        {/* Packages Table */}
        <div>
          <Text
            style={{
              color: isDark ? '#cccccc' : '#000000',
              marginBottom: 8,
              display: 'block',
              fontWeight: 500,
            }}
          >
            Packages ({packages.length})
          </Text>
          <Table
            dataSource={packages}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            locale={{ emptyText: 'No packages added yet' }}
            style={{ background: isDark ? '#252526' : '#fafafa' }}
          />
        </div>

        {/* Install Button */}
        {packages.length > 0 && (
          <Button
            type="primary"
            block
            onClick={installPackages}
            loading={isInstalling}
            disabled={isInstalling}
          >
            {isInstalling ? 'Installing...' : 'Install All Packages'}
          </Button>
        )}

        {/* Installation Progress */}
        {installStatus === 'installing' && (
          <div>
            <Progress percent={installProgress} status="active" />
            <Text style={{ color: isDark ? '#858585' : '#666666', fontSize: '12px' }}>
              {installMessage}
            </Text>
          </div>
        )}

        {/* Installation Result */}
        {installStatus === 'success' && (
          <Alert
            message="Packages Installed Successfully"
            description={installMessage}
            type="success"
            showIcon
            closable
            onClose={() => setInstallStatus('idle')}
          />
        )}

        {installStatus === 'error' && (
          <Alert
            message="Package Installation Failed"
            description={<pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px' }}>{installMessage}</pre>}
            type="error"
            showIcon
            closable
            onClose={() => setInstallStatus('idle')}
          />
        )}
      </Space>
    </Modal>
  );
}

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Space, Typography, Divider, Table } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { NuGetReference } from '../../shared/types';

const { Text } = Typography;

export interface ScriptProperties {
  usings: string[];
  references: NuGetReference[];
}

interface Props {
  open: boolean;
  properties: ScriptProperties;
  onOk: (properties: ScriptProperties) => void;
  onCancel: () => void;
  isDark?: boolean;
}

export default function ScriptPropertiesModal({ open, properties, onOk, onCancel, isDark = true }: Props) {
  const [usings, setUsings] = useState<string[]>([]);
  const [references, setReferences] = useState<NuGetReference[]>([]);
  const [newUsing, setNewUsing] = useState('');
  const [newRefName, setNewRefName] = useState('');
  const [newRefVersion, setNewRefVersion] = useState('');

  useEffect(() => {
    if (open) {
      setUsings([...properties.usings]);
      setReferences([...properties.references]);
      setNewUsing('');
      setNewRefName('');
      setNewRefVersion('');
    }
  }, [open, properties]);

  const addUsing = () => {
    const trimmed = newUsing.trim();
    if (!trimmed || usings.includes(trimmed)) return;
    setUsings([...usings, trimmed]);
    setNewUsing('');
  };

  const removeUsing = (index: number) => {
    setUsings(usings.filter((_, i) => i !== index));
  };

  const addReference = () => {
    const name = newRefName.trim();
    const version = newRefVersion.trim();
    if (!name || !version) return;
    setReferences([...references, { name, version }]);
    setNewRefName('');
    setNewRefVersion('');
  };

  const removeReference = (index: number) => {
    setReferences(references.filter((_, i) => i !== index));
  };

  const handleOk = () => {
    onOk({ usings, references });
  };

  const inputStyle: React.CSSProperties = {
    background: isDark ? '#3c3c3c' : '#ffffff',
    borderColor: isDark ? '#555' : '#d9d9d9',
    color: isDark ? '#cccccc' : '#1f1f1f',
  };

  const labelStyle: React.CSSProperties = {
    color: isDark ? '#cccccc' : '#1f1f1f',
    fontSize: 13,
    fontWeight: 600,
    display: 'block',
    marginBottom: 8,
  };

  const subtextStyle: React.CSSProperties = {
    color: isDark ? '#858585' : '#666',
    fontSize: 12,
    display: 'block',
    marginBottom: 8,
  };

  return (
    <Modal
      title="Script Properties"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="OK"
      width={560}
    >
      {/* Namespace Imports */}
      <Text style={labelStyle}>Namespace Imports</Text>
      <Text style={subtextStyle}>Added as <code>using</code> statements at the top of every execution.</Text>

      <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }}>
        {usings.map((u, i) => (
          <Space key={i} style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text style={{ color: isDark ? '#cccccc' : '#1f1f1f', fontFamily: 'monospace' }}>{u}</Text>
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => removeUsing(i)}
            />
          </Space>
        ))}
      </Space>

      <Space.Compact style={{ width: '100%', marginBottom: 4 }}>
        <Input
          placeholder="e.g. Newtonsoft.Json"
          value={newUsing}
          onChange={(e) => setNewUsing(e.target.value)}
          onPressEnter={addUsing}
          style={inputStyle}
        />
        <Button icon={<PlusOutlined />} onClick={addUsing}>Add</Button>
      </Space.Compact>

      <Divider style={{ margin: '16px 0' }} />

      {/* NuGet References */}
      <Text style={labelStyle}>NuGet References</Text>
      <Text style={subtextStyle}>Packages are restored automatically before compilation.</Text>

      {references.length > 0 && (
        <Table
          dataSource={references.map((r, i) => ({ ...r, key: i }))}
          pagination={false}
          size="small"
          style={{ marginBottom: 12 }}
          columns={[
            { title: 'Package', dataIndex: 'name', key: 'name' },
            { title: 'Version', dataIndex: 'version', key: 'version', width: 120 },
            {
              title: '',
              key: 'action',
              width: 40,
              render: (_: any, __: any, index: number) => (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeReference(index)}
                />
              ),
            },
          ]}
        />
      )}

      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="Package name"
          value={newRefName}
          onChange={(e) => setNewRefName(e.target.value)}
          onPressEnter={addReference}
          style={{ ...inputStyle, flex: 2 }}
        />
        <Input
          placeholder="Version"
          value={newRefVersion}
          onChange={(e) => setNewRefVersion(e.target.value)}
          onPressEnter={addReference}
          style={{ ...inputStyle, width: 120 }}
        />
        <Button icon={<PlusOutlined />} onClick={addReference}>Add</Button>
      </Space.Compact>
    </Modal>
  );
}

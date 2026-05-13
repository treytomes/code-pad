import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Space, Typography, Divider, Table, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { NuGetReference, LocalAssemblyReference } from '../../shared/types';

const { Text } = Typography;

export interface ScriptProperties {
  usings: string[];
  references: NuGetReference[];
  localReferences: LocalAssemblyReference[];
  tags: string[];
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
  const [localReferences, setLocalReferences] = useState<LocalAssemblyReference[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newUsing, setNewUsing] = useState('');
  const [newRefName, setNewRefName] = useState('');
  const [newRefVersion, setNewRefVersion] = useState('');
  const [newLocalRefPath, setNewLocalRefPath] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (open) {
      setUsings([...properties.usings]);
      setReferences([...properties.references]);
      setLocalReferences([...(properties.localReferences ?? [])]);
      setTags([...(properties.tags ?? [])]);
      setNewUsing('');
      setNewRefName('');
      setNewRefVersion('');
      setNewLocalRefPath('');
      setNewTag('');
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

  const addLocalReference = () => {
    const path = newLocalRefPath.trim();
    if (!path || localReferences.some((r) => r.path === path)) return;
    setLocalReferences([...localReferences, { path }]);
    setNewLocalRefPath('');
  };

  const removeLocalReference = (index: number) => {
    setLocalReferences(localReferences.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const trimmed = newTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!trimmed || tags.includes(trimmed)) return;
    setTags([...tags, trimmed]);
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleOk = () => {
    onOk({ usings, references, localReferences, tags });
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
          style={{ width: '100%', marginBottom: 12, tableLayout: 'fixed' }}
          columns={[
            { title: 'Package', dataIndex: 'name', key: 'name', ellipsis: true },
            { title: 'Version', dataIndex: 'version', key: 'version', width: 120, ellipsis: true },
            {
              title: '',
              key: 'action',
              width: 48,
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

      <Divider style={{ margin: '16px 0' }} />

      {/* Local Assembly References */}
      <Text style={labelStyle}>Local Assembly References</Text>
      <Text style={subtextStyle}>
        Paths to local <code>.dll</code> files. Relative paths are resolved from the project directory.
        You can also use <code>#r "path/to/assembly.dll"</code> inline in your script.
      </Text>

      {localReferences.length > 0 && (
        <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }}>
          {localReferences.map((ref, i) => (
            <Space key={i} style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text style={{ color: isDark ? '#cccccc' : '#1f1f1f', fontFamily: 'monospace', fontSize: 12 }}>
                {ref.path}
              </Text>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => removeLocalReference(i)}
              />
            </Space>
          ))}
        </Space>
      )}

      <Space.Compact style={{ width: '100%', marginBottom: 4 }}>
        <Input
          placeholder="e.g. /path/to/MyLibrary.dll"
          value={newLocalRefPath}
          onChange={(e) => setNewLocalRefPath(e.target.value)}
          onPressEnter={addLocalReference}
          style={inputStyle}
        />
        <Button icon={<PlusOutlined />} onClick={addLocalReference}>Add</Button>
      </Space.Compact>

      <Divider style={{ margin: '16px 0' }} />

      {/* Tags */}
      <Text style={labelStyle}>Tags</Text>
      <Text style={subtextStyle}>Organise snippets. Tags are lowercase and hyphen-separated.</Text>

      <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tags.map((tag) => (
          <Tag
            key={tag}
            closable
            onClose={() => removeTag(tag)}
            color="blue"
          >
            {tag}
          </Tag>
        ))}
      </div>

      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="e.g. linq, data, demo"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onPressEnter={addTag}
          style={inputStyle}
        />
        <Button icon={<PlusOutlined />} onClick={addTag}>Add</Button>
      </Space.Compact>
    </Modal>
  );
}

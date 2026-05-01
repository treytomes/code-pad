import React, { useEffect, useState } from 'react';
import { List, Button, Empty, Popconfirm, Typography, Select, Input, Space, Divider } from 'antd';
import {
  DeleteOutlined,
  PlayCircleOutlined,
  CodeOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  StarOutlined,
  StarFilled,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { Snippet } from '../../../backend/database';

const { Text } = Typography;
const { Option } = Select;

interface SnippetListProps {
  onSelectSnippet: (snippet: Snippet) => void;
  onDeleteSnippet: (id: string) => void;
  onRenameSnippet: (id: string, newName: string) => void;
  refreshTrigger?: number;
}

export const SnippetList: React.FC<SnippetListProps> = ({
  onSelectSnippet,
  onDeleteSnippet,
  onRenameSnippet,
  refreshTrigger,
}) => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [starredSnippets, setStarredSnippets] = useState<Snippet[]>([]);
  const [recentSnippets, setRecentSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<string | undefined>(
    undefined
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const loadSnippets = async () => {
    setLoading(true);
    try {
      const [list, starred, recent] = await Promise.all([
        window.electronAPI.db.listSnippets(languageFilter),
        window.electronAPI.db.getStarredSnippets(),
        window.electronAPI.db.getRecentlyOpened(5),
      ]);
      setSnippets(list);
      setStarredSnippets(starred);
      setRecentSnippets(recent);
    } catch (error) {
      console.error('Failed to load snippets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnippets();
  }, [languageFilter, refreshTrigger]);

  const handleDelete = async (id: string) => {
    await onDeleteSnippet(id);
    loadSnippets();
  };

  const handleStartRename = (snippet: Snippet, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(snippet.id);
    setEditingName(snippet.name);
  };

  const handleConfirmRename = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!editingName.trim()) {
      return;
    }
    await onRenameSnippet(id, editingName);
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingName('');
  };

  const handleToggleStar = async (snippet: Snippet, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await window.electronAPI.db.toggleStarred(snippet.id);
      loadSnippets();
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const renderSnippetItem = (snippet: Snippet) => (
    <List.Item
      key={snippet.id}
      style={{
        padding: '8px 12px',
        cursor: 'pointer',
        borderBottom: '1px solid #2d2d30',
        background: 'transparent',
        transition: 'background-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#2a2d2e';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onClick={() => onSelectSnippet(snippet)}
    >
      <List.Item.Meta
        avatar={
          <CodeOutlined style={{ fontSize: '20px', color: '#858585' }} />
        }
        title={
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {editingId === snippet.id ? (
              <>
                <Input
                  size="small"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onPressEnter={(e) => handleConfirmRename(snippet.id, e as any)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  style={{ flex: 1 }}
                />
                <Space size={0}>
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={(e) => handleConfirmRename(snippet.id, e)}
                    style={{ color: '#4ec9b0' }}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={handleCancelRename}
                    style={{ color: '#f48771' }}
                  />
                </Space>
              </>
            ) : (
              <>
                <Text strong style={{ color: '#cccccc', flex: 1 }}>
                  {snippet.name}
                </Text>
                <Space size={0}>
                  <Button
                    type="text"
                    size="small"
                    icon={snippet.starred ? <StarFilled /> : <StarOutlined />}
                    onClick={(e) => handleToggleStar(snippet, e)}
                    style={{
                      color: snippet.starred ? '#ffc107' : '#858585',
                    }}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => handleStartRename(snippet, e)}
                    style={{ color: '#858585' }}
                  />
                  <Popconfirm
                    title="Delete this snippet?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDelete(snippet.id);
                    }}
                    okText="Yes"
                    cancelText="No"
                    onCancel={(e) => e?.stopPropagation()}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </Space>
              </>
            )}
          </div>
        }
        description={
          <div>
            <Text
              type="secondary"
              style={{ fontSize: '12px', color: '#858585' }}
            >
              {snippet.language}
            </Text>
            {snippet.executionCount > 0 && (
              <Text
                type="secondary"
                style={{
                  fontSize: '12px',
                  marginLeft: '8px',
                  color: '#858585',
                }}
              >
                <PlayCircleOutlined /> {snippet.executionCount}
              </Text>
            )}
          </div>
        }
      />
    </List.Item>
  );

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#252526',
      }}
    >
      <div
        style={{
          padding: '8px',
          borderBottom: '1px solid #2d2d30',
          background: '#252526',
        }}
      >
        <Select
          placeholder="Filter by language"
          allowClear
          style={{ width: '100%' }}
          onChange={setLanguageFilter}
          value={languageFilter}
        >
          <Option value="csharp">C#</Option>
          <Option value="python">Python</Option>
          <Option value="javascript">JavaScript</Option>
        </Select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: '#252526' }}>
        {/* Starred Snippets Section */}
        {starredSnippets.length > 0 && (
          <>
            <div
              style={{
                padding: '12px 12px 8px',
                borderBottom: '1px solid #2d2d30',
              }}
            >
              <Text
                strong
                style={{
                  color: '#ffc107',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <StarFilled /> Starred
              </Text>
            </div>
            <List
              dataSource={starredSnippets}
              renderItem={(snippet) => renderSnippetItem(snippet)}
              split={false}
            />
            <Divider style={{ margin: '8px 0', backgroundColor: '#2d2d30' }} />
          </>
        )}

        {/* Recently Opened Section */}
        {recentSnippets.length > 0 && (
          <>
            <div
              style={{
                padding: '12px 12px 8px',
                borderBottom: '1px solid #2d2d30',
              }}
            >
              <Text
                strong
                style={{
                  color: '#569cd6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ClockCircleOutlined /> Recently Opened
              </Text>
            </div>
            <List
              dataSource={recentSnippets}
              renderItem={(snippet) => renderSnippetItem(snippet)}
              split={false}
            />
            <Divider style={{ margin: '8px 0', backgroundColor: '#2d2d30' }} />
          </>
        )}

        {/* All Snippets Section */}
        <div
          style={{
            padding: '12px 12px 8px',
            borderBottom: '1px solid #2d2d30',
          }}
        >
          <Text strong style={{ color: '#cccccc' }}>
            All Snippets
          </Text>
        </div>
        <List
          loading={loading}
          dataSource={snippets}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No snippets yet"
              />
            ),
          }}
          split={false}
          renderItem={(snippet) => renderSnippetItem(snippet)}
        />
      </div>
    </div>
  );
};

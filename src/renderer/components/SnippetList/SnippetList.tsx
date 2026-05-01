import React, { useEffect, useState } from 'react';
import { List, Button, Empty, Popconfirm, Typography, Select } from 'antd';
import {
  DeleteOutlined,
  PlayCircleOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import type { Snippet } from '../../../backend/database';

const { Text } = Typography;
const { Option } = Select;

interface SnippetListProps {
  onSelectSnippet: (snippet: Snippet) => void;
  onDeleteSnippet: (id: string) => void;
  refreshTrigger?: number;
}

export const SnippetList: React.FC<SnippetListProps> = ({
  onSelectSnippet,
  onDeleteSnippet,
  refreshTrigger,
}) => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<string | undefined>(
    undefined
  );

  const loadSnippets = async () => {
    setLoading(true);
    try {
      const list = await window.electronAPI.db.listSnippets(languageFilter);
      setSnippets(list);
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
          renderItem={(snippet) => (
            <List.Item
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
                avatar={<CodeOutlined style={{ fontSize: '20px' }} />}
                title={
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text strong>{snippet.name}</Text>
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
                  </div>
                }
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {snippet.language}
                    </Text>
                    {snippet.executionCount > 0 && (
                      <Text
                        type="secondary"
                        style={{ fontSize: '12px', marginLeft: '8px' }}
                      >
                        <PlayCircleOutlined /> {snippet.executionCount}
                      </Text>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

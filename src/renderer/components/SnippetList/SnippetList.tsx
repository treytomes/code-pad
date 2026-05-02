import React, { useEffect, useState, useMemo } from 'react';
import { List, Button, Empty, Popconfirm, Typography, Select, Input, Space, Divider, Tabs } from 'antd';
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
  SearchOutlined,
  CopyOutlined,
  BookOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import type { Snippet } from '../../../backend/database';
import { SAMPLES, SAMPLE_CATEGORIES, type SampleSnippet } from '../../../shared/samples';

const { Text } = Typography;
const { Option } = Select;

interface SnippetListProps {
  onSelectSnippet: (snippet: Snippet) => void;
  onDeleteSnippet: (id: string) => void;
  onRenameSnippet: (id: string, newName: string) => void;
  onDuplicateSnippet: (snippet: Snippet) => void;
  refreshTrigger?: number;
}

export const SnippetList: React.FC<SnippetListProps> = ({
  onSelectSnippet,
  onDeleteSnippet,
  onRenameSnippet,
  onDuplicateSnippet,
  refreshTrigger,
}) => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [starredSnippets, setStarredSnippets] = useState<Snippet[]>([]);
  const [recentSnippets, setRecentSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<string | undefined>(
    undefined
  );
  const [searchText, setSearchText] = useState('');
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

  // Filter snippets by search text
  const filterBySearch = (snippetList: Snippet[]) => {
    if (!searchText.trim()) {
      return snippetList;
    }
    const search = searchText.toLowerCase();
    return snippetList.filter(snippet =>
      snippet.name.toLowerCase().includes(search)
    );
  };

  // Memoized filtered lists
  const filteredStarred = useMemo(() => filterBySearch(starredSnippets), [starredSnippets, searchText]);
  const filteredRecent = useMemo(() => filterBySearch(recentSnippets), [recentSnippets, searchText]);
  const filteredSnippets = useMemo(() => filterBySearch(snippets), [snippets, searchText]);

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
                    title="Rename"
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSnippet(snippet);
                    }}
                    style={{ color: '#858585' }}
                    title="Duplicate"
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

  // Render a sample snippet item
  const renderSampleItem = (sample: SampleSnippet) => (
    <List.Item
      onClick={() => {
        // Convert sample to snippet format for loading
        onSelectSnippet({
          id: sample.id,
          name: sample.name,
          language: sample.language,
          code: sample.code,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          executionCount: 0,
          starred: false,
          lastOpened: null,
        } as Snippet);
      }}
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid #2d2d30',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#2a2d2e';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <List.Item.Meta
        avatar={<BookOutlined style={{ fontSize: '20px', color: '#4ec9b0' }} />}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text strong style={{ color: '#cccccc', flex: 1 }}>
              {sample.name}
            </Text>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateSnippet({
                  id: sample.id,
                  name: `${sample.name} (Copy)`,
                  language: sample.language,
                  code: sample.code,
                  createdAt: new Date().toISOString(),
                  modifiedAt: new Date().toISOString(),
                  executionCount: 0,
                  starred: false,
                  lastOpened: null,
                } as Snippet);
              }}
              style={{ color: '#858585' }}
              title="Copy to My Snippets"
            />
          </div>
        }
        description={
          <Text type="secondary" style={{ fontSize: '12px', color: '#858585' }}>
            {sample.description}
          </Text>
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
      <Tabs
        defaultActiveKey="my-snippets"
        style={{ height: '100%' }}
        items={[
          {
            key: 'my-snippets',
            label: (
              <span>
                <FolderOutlined /> My Snippets
              </span>
            ),
            children: (
              <>
                <div
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #2d2d30',
                    background: '#252526',
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
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
          <Input
            placeholder="Search snippets..."
            prefix={<SearchOutlined style={{ color: '#858585' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              backgroundColor: '#3c3c3c',
              borderColor: '#2d2d30',
              color: '#cccccc',
            }}
          />
        </Space>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: '#252526' }}>
        {/* Starred Snippets Section */}
        {filteredStarred.length > 0 && (
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
                {searchText && (
                  <Text style={{ fontSize: '12px', color: '#858585', marginLeft: '8px' }}>
                    ({filteredStarred.length}/{starredSnippets.length})
                  </Text>
                )}
              </Text>
            </div>
            <List
              dataSource={filteredStarred}
              renderItem={(snippet) => renderSnippetItem(snippet)}
              split={false}
            />
            <Divider style={{ margin: '8px 0', backgroundColor: '#2d2d30' }} />
          </>
        )}

        {/* Recently Opened Section */}
        {filteredRecent.length > 0 && (
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
                {searchText && (
                  <Text style={{ fontSize: '12px', color: '#858585', marginLeft: '8px' }}>
                    ({filteredRecent.length}/{recentSnippets.length})
                  </Text>
                )}
              </Text>
            </div>
            <List
              dataSource={filteredRecent}
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
            {searchText && (
              <Text style={{ fontSize: '12px', color: '#858585', marginLeft: '8px' }}>
                ({filteredSnippets.length}/{snippets.length})
              </Text>
            )}
          </Text>
        </div>
        <List
          loading={loading}
          dataSource={filteredSnippets}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={searchText ? `No snippets found matching "${searchText}"` : "No snippets yet"}
              />
            ),
          }}
          split={false}
          renderItem={(snippet) => renderSnippetItem(snippet)}
        />
      </div>
              </>
            ),
          },
          {
            key: 'samples',
            label: (
              <span>
                <BookOutlined /> Samples
              </span>
            ),
            children: (
              <div style={{ height: '100%', overflowY: 'auto', background: '#252526' }}>
                {SAMPLE_CATEGORIES.map((category) => {
                  const samples = SAMPLES.filter((s) => s.category === category);
                  return (
                    <div key={category}>
                      <div
                        style={{
                          padding: '12px 12px 8px',
                          borderBottom: '1px solid #2d2d30',
                          background: '#1e1e1e',
                        }}
                      >
                        <Text strong style={{ color: '#4ec9b0' }}>
                          {category}
                        </Text>
                      </div>
                      <List
                        dataSource={samples}
                        renderItem={renderSampleItem}
                        split={false}
                      />
                    </div>
                  );
                })}
              </div>
            ),
          },
        ]}
        tabBarStyle={{
          background: '#252526',
          borderBottom: '1px solid #2d2d30',
          margin: 0,
          padding: '0 8px',
        }}
        className="snippet-tabs"
      />
    </div>
  );
};

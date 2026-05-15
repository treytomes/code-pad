import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  List,
  Button,
  Empty,
  Popconfirm,
  Typography,
  Select,
  Input,
  Space,
  Divider,
  Tag,
} from 'antd';
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
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

const { Text } = Typography;
const { Option } = Select;

interface SnippetListProps {
  onSelectSnippet: (snippet: Snippet) => void;
  onDeleteSnippet: (id: string) => void;
  onRenameSnippet: (id: string, newName: string) => void;
  onDuplicateSnippet: (snippet: Snippet) => void;
  refreshTrigger?: number;
  isDark?: boolean;
}

export const SnippetList: React.FC<SnippetListProps> = ({
  onSelectSnippet,
  onDeleteSnippet,
  onRenameSnippet,
  onDuplicateSnippet,
  refreshTrigger,
  isDark = true,
}) => {
  const bg = isDark ? '#252526' : '#fafafa';
  const bgAlt = isDark ? '#1e1e1e' : '#f0f0f0';
  const border = isDark ? '#2d2d30' : '#e8e8e8';
  const textPrimary = isDark ? '#cccccc' : '#1f1f1f';
  const textSecondary = isDark ? '#858585' : '#666666';
  const hoverBg = isDark ? '#2a2d2e' : '#e6f4ff';
  const inputBg = isDark ? '#3c3c3c' : '#ffffff';
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [starredSnippets, setStarredSnippets] = useState<Snippet[]>([]);
  const [recentSnippets, setRecentSnippets] = useState<Snippet[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [activeTab, setActiveTab] = useState<'my-snippets' | 'samples'>('my-snippets');
  const [sampleLanguageFilter, setSampleLanguageFilter] = useState<'all' | 'csharp' | 'python'>(() => {
    // Load from localStorage or default to 'all'
    const saved = localStorage.getItem('codepad:samples:languageFilter');
    return (saved as 'all' | 'csharp' | 'python') || 'all';
  });

  // Debounce search text with 300ms delay (local database query, fast)
  const debouncedSearchText = useDebouncedValue(searchText, 300);

  // Save sample language filter to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('codepad:samples:languageFilter', sampleLanguageFilter);
  }, [sampleLanguageFilter]);

  const loadSnippets = useCallback(async () => {
    setLoading(true);
    try {
      const [list, starred, recent, tags] = await Promise.all([
        window.electronAPI.db.listSnippets(languageFilter, activeTag ?? undefined),
        window.electronAPI.db.getStarredSnippets(),
        window.electronAPI.db.getRecentlyOpened(5),
        window.electronAPI.db.getAllTags(),
      ]);
      setSnippets(list);
      setStarredSnippets(starred);
      setRecentSnippets(recent);
      setAllTags(tags);
    } catch (error) {
      console.error('Failed to load snippets:', error);
    } finally {
      setLoading(false);
    }
  }, [languageFilter, activeTag]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSnippets();
  }, [loadSnippets, refreshTrigger]);

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

  // Filter snippets by search text (uses debounced value)
  const filterBySearch = useCallback(
    (snippetList: Snippet[]) => {
      if (!debouncedSearchText.trim()) {
        return snippetList;
      }
      const search = debouncedSearchText.toLowerCase();
      return snippetList.filter((snippet) => snippet.name.toLowerCase().includes(search));
    },
    [debouncedSearchText]
  );

  // Memoized filtered lists (use debounced search text)
  const filteredStarred = useMemo(
    () => filterBySearch(starredSnippets),
    [starredSnippets, filterBySearch]
  );
  const filteredRecent = useMemo(
    () => filterBySearch(recentSnippets),
    [recentSnippets, filterBySearch]
  );
  const filteredSnippets = useMemo(
    () => filterBySearch(snippets),
    [snippets, filterBySearch]
  );

  const renderSnippetItem = (snippet: Snippet) => (
    <List.Item
      key={snippet.id}
      style={{
        padding: '8px 12px',
        cursor: 'pointer',
        borderBottom: `1px solid ${border}`,
        background: 'transparent',
        transition: 'background-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onClick={() => onSelectSnippet(snippet)}
    >
      <List.Item.Meta
        avatar={<CodeOutlined style={{ fontSize: '20px', color: textSecondary }} />}
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
                <Text strong style={{ color: textPrimary, flex: 1 }}>
                  {snippet.name}
                </Text>
                <Space size={0}>
                  <Button
                    type="text"
                    size="small"
                    icon={snippet.starred ? <StarFilled /> : <StarOutlined />}
                    onClick={(e) => handleToggleStar(snippet, e)}
                    style={{
                      color: snippet.starred ? '#ffc107' : textSecondary,
                    }}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => handleStartRename(snippet, e)}
                    style={{ color: textSecondary }}
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
                    style={{ color: textSecondary }}
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
            <Text type="secondary" style={{ fontSize: '12px', color: textSecondary }}>
              {snippet.language}
            </Text>
            {snippet.executionCount > 0 && (
              <Text
                type="secondary"
                style={{
                  fontSize: '12px',
                  marginLeft: '8px',
                  color: textSecondary,
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
      data-testid={`sample-item-${sample.id}`}
      onClick={() => {
        // Convert sample to snippet format for loading
        onSelectSnippet({
          id: sample.id,
          name: sample.name,
          language: sample.language,
          code: sample.code,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          executionCount: 0,
          starred: false,
          lastOpenedAt: null,
        } as Snippet);
      }}
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: `1px solid ${border}`,
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <List.Item.Meta
        avatar={<BookOutlined style={{ fontSize: '20px', color: '#4ec9b0' }} />}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text strong style={{ color: textPrimary, flex: 1 }}>
              {sample.name}
            </Text>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={async (e) => {
                e.stopPropagation();
                const newSnippet = {
                  id: sample.id,
                  name: `${sample.name} (Copy)`,
                  language: sample.language,
                  code: sample.code,
                  createdAt: Date.now(),
                  modifiedAt: Date.now(),
                  executionCount: 0,
                  starred: false,
                  lastOpenedAt: null,
                } as Snippet;

                // Duplicate the snippet first
                onDuplicateSnippet(newSnippet);

                // If sample has packages, add them to the new snippet after a brief delay
                // (to allow the snippet to be created first)
                if (sample.packages && sample.packages.length > 0 && sample.language === 'python') {
                  setTimeout(async () => {
                    try {
                      // Get the most recently created snippet (should be our duplicate)
                      const snippets = await window.electronAPI.db.listSnippets('python');
                      const newestSnippet = snippets.find(s => s.name === `${sample.name} (Copy)`);

                      if (newestSnippet) {
                        // Add each package to the duplicated snippet
                        for (const pkg of sample.packages!) {
                          await window.electronAPI.db.addSnippetPackage(newestSnippet.id, pkg);
                        }
                      }
                    } catch (error) {
                      console.error('Failed to add packages to duplicated sample:', error);
                    }
                  }, 500);
                }
              }}
              style={{ color: textSecondary }}
              title="Copy to My Snippets"
            />
          </div>
        }
        description={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Text type="secondary" style={{ fontSize: '12px', color: textSecondary }}>
              {sample.description}
            </Text>
            {sample.packages && sample.packages.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <Text style={{ fontSize: '11px', color: '#ce9178' }}>Requires:</Text>
                {sample.packages.map((pkg) => (
                  <Tag
                    key={pkg}
                    style={{
                      fontSize: '10px',
                      padding: '0 4px',
                      margin: 0,
                      background: '#3c2c1e',
                      border: '1px solid #ce9178',
                      color: '#ce9178',
                    }}
                  >
                    {pkg}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        }
      />
    </List.Item>
  );

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    flexShrink: 0,
    borderBottom: `1px solid ${border}`,
    background: bg,
    padding: '0 8px',
  };

  const makeTabButtonStyle = (key: string): React.CSSProperties => ({
    padding: '8px 12px',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: activeTab === key ? '#007acc' : textSecondary,
    borderBottom: activeTab === key ? '2px solid #007acc' : '2px solid transparent',
    fontFamily: 'inherit',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '-1px',
  });

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: bg,
        overflow: 'hidden',
      }}
    >
      {/* Custom tab bar — onMouseDown prevents focus leaving the editor */}
      <div style={tabBarStyle}>
        <button
          data-testid="tab-my-snippets"
          style={makeTabButtonStyle('my-snippets')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setActiveTab('my-snippets')}
        >
          <FolderOutlined /> My Snippets
        </button>
        <button
          data-testid="tab-samples"
          style={makeTabButtonStyle('samples')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setActiveTab('samples')}
        >
          <BookOutlined /> Samples
        </button>
      </div>

      {/* My Snippets pane */}
      {activeTab === 'my-snippets' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              padding: '8px',
              borderBottom: `1px solid ${border}`,
              background: bg,
              flexShrink: 0,
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
                prefix={<SearchOutlined style={{ color: textSecondary }} />}
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  backgroundColor: inputBg,
                  borderColor: border,
                  color: textPrimary,
                }}
              />
            </Space>
          </div>

          {/* Tag filter chips */}
          {allTags.length > 0 && (
            <div style={{ padding: '4px 8px 6px', borderBottom: `1px solid ${border}`, display: 'flex', flexWrap: 'wrap', gap: 4, flexShrink: 0 }}>
              {allTags.map((tag) => (
                <Tag
                  key={tag}
                  color={activeTag === tag ? 'blue' : undefined}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: activeTag === tag ? undefined : (isDark ? '#2d2d30' : '#f0f0f0'),
                    borderColor: activeTag === tag ? undefined : border,
                    color: activeTag === tag ? undefined : textSecondary,
                    margin: 0,
                  }}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', background: bg }}>
            {/* Starred Snippets Section */}
            {filteredStarred.length > 0 && (
              <>
                <div
                  style={{
                    padding: '12px 12px 8px',
                    borderBottom: `1px solid ${border}`,
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
                      <Text
                        style={{ fontSize: '12px', color: textSecondary, marginLeft: '8px' }}
                      >
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
                <Divider style={{ margin: '8px 0', backgroundColor: border }} />
              </>
            )}

            {/* Recently Opened Section */}
            {filteredRecent.length > 0 && (
              <>
                <div
                  style={{
                    padding: '12px 12px 8px',
                    borderBottom: `1px solid ${border}`,
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
                      <Text
                        style={{ fontSize: '12px', color: textSecondary, marginLeft: '8px' }}
                      >
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
                <Divider style={{ margin: '8px 0', backgroundColor: border }} />
              </>
            )}

            {/* All Snippets Section */}
            <div
              style={{
                padding: '12px 12px 8px',
                borderBottom: `1px solid ${border}`,
              }}
            >
              <Text strong style={{ color: textPrimary }}>
                All Snippets
                {searchText && (
                  <Text style={{ fontSize: '12px', color: textSecondary, marginLeft: '8px' }}>
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
                    description={
                      searchText
                        ? `No snippets found matching "${searchText}"`
                        : 'No snippets yet'
                    }
                  />
                ),
              }}
              split={false}
              renderItem={(snippet) => renderSnippetItem(snippet)}
            />
          </div>
        </div>
      )}

      {/* Samples pane */}
      {activeTab === 'samples' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: bg, minHeight: 0 }}>
          {/* Language filter for samples */}
          <div
            style={{
              padding: '12px',
              borderBottom: `1px solid ${border}`,
              background: bgAlt,
            }}
          >
            <Space size="small">
              <Text style={{ color: textSecondary, fontSize: '12px' }}>Language:</Text>
              <Button
                size="small"
                type={sampleLanguageFilter === 'all' ? 'primary' : 'text'}
                onClick={() => setSampleLanguageFilter('all')}
                style={{
                  borderRadius: '4px',
                  fontSize: '12px',
                  height: '24px',
                  padding: '0 12px',
                }}
              >
                All
              </Button>
              <Button
                size="small"
                type={sampleLanguageFilter === 'csharp' ? 'primary' : 'text'}
                onClick={() => setSampleLanguageFilter('csharp')}
                style={{
                  borderRadius: '4px',
                  fontSize: '12px',
                  height: '24px',
                  padding: '0 12px',
                }}
              >
                C#
              </Button>
              <Button
                size="small"
                type={sampleLanguageFilter === 'python' ? 'primary' : 'text'}
                onClick={() => setSampleLanguageFilter('python')}
                style={{
                  borderRadius: '4px',
                  fontSize: '12px',
                  height: '24px',
                  padding: '0 12px',
                }}
              >
                Python
              </Button>
            </Space>
          </div>

          {/* Samples list with filtering */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {SAMPLE_CATEGORIES.map((category) => {
              // Filter samples by category and language
              const samples = SAMPLES.filter((s) => {
                if (s.category !== category) return false;
                if (sampleLanguageFilter === 'all') return true;
                return s.language === sampleLanguageFilter;
              });

              // Skip empty categories
              if (samples.length === 0) return null;

              return (
                <div key={category}>
                  <div
                    style={{
                      padding: '12px 12px 8px',
                      borderBottom: `1px solid ${border}`,
                      background: bgAlt,
                    }}
                  >
                    <Text strong style={{ color: '#4ec9b0' }}>
                      {category} ({samples.length})
                    </Text>
                  </div>
                  <List dataSource={samples} renderItem={renderSampleItem} split={false} />
                </div>
              );
            })}
            {/* Empty state when no samples match filter */}
            {SAMPLES.filter((s) =>
              sampleLanguageFilter === 'all' ? true : s.language === sampleLanguageFilter
            ).length === 0 && (
              <Empty
                description={
                  <span style={{ color: textSecondary }}>
                    No samples found for {sampleLanguageFilter === 'csharp' ? 'C#' : 'Python'}.
                    <br />
                    Switch to &quot;All&quot; to see all available samples.
                  </span>
                }
                style={{ marginTop: '60px' }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

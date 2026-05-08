import React from 'react';
import { Modal, Table, Typography, Divider } from 'antd';

const { Title, Text } = Typography;

interface KeyboardShortcutsModalProps {
  visible: boolean;
  onClose: () => void;
  isDark?: boolean;
}

interface Shortcut {
  shortcut: string;
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // File Operations
  { category: 'File', shortcut: 'Ctrl+N', description: 'New snippet' },
  { category: 'File', shortcut: 'Ctrl+S', description: 'Save snippet' },
  { category: 'File', shortcut: 'Ctrl+Shift+S', description: 'Save As...' },
  { category: 'File', shortcut: 'Ctrl+O', description: 'Import from file' },
  { category: 'File', shortcut: 'Ctrl+E', description: 'Export to file' },

  // Edit Operations
  { category: 'Edit', shortcut: 'Ctrl+Z', description: 'Undo' },
  { category: 'Edit', shortcut: 'Ctrl+Y', description: 'Redo' },
  { category: 'Edit', shortcut: 'Ctrl+X', description: 'Cut' },
  { category: 'Edit', shortcut: 'Ctrl+C', description: 'Copy' },
  { category: 'Edit', shortcut: 'Ctrl+V', description: 'Paste' },
  { category: 'Edit', shortcut: 'Ctrl+A', description: 'Select all' },
  { category: 'Edit', shortcut: 'Ctrl+F', description: 'Find in editor' },
  { category: 'Edit', shortcut: 'Ctrl+H', description: 'Replace in editor' },
  { category: 'Edit', shortcut: 'Ctrl+,', description: 'Open Settings' },

  // View Operations
  { category: 'View', shortcut: 'Ctrl+B', description: 'Toggle sidebar' },
  { category: 'View', shortcut: 'Ctrl+J', description: 'Toggle output panel' },
  { category: 'View', shortcut: 'Ctrl+0', description: 'Reset zoom' },
  { category: 'View', shortcut: 'Ctrl++', description: 'Zoom in' },
  { category: 'View', shortcut: 'Ctrl+-', description: 'Zoom out' },
  { category: 'View', shortcut: 'F11', description: 'Toggle fullscreen' },

  // Run Operations
  { category: 'Run', shortcut: 'F5', description: 'Run code' },
  { category: 'Run', shortcut: 'Shift+F5', description: 'Stop execution' },
  { category: 'Run', shortcut: 'Ctrl+K', description: 'Clear output' },

  // Navigation
  { category: 'Navigation', shortcut: 'Tab', description: 'Next element' },
  { category: 'Navigation', shortcut: 'Shift+Tab', description: 'Previous element' },
  { category: 'Navigation', shortcut: 'Arrow Keys', description: 'Navigate lists' },
  { category: 'Navigation', shortcut: 'Enter', description: 'Activate / Open' },
  { category: 'Navigation', shortcut: 'Escape', description: 'Close / Cancel' },

  // Editor (Monaco)
  { category: 'Editor', shortcut: 'Ctrl+Space', description: 'Trigger IntelliSense' },
  { category: 'Editor', shortcut: 'Ctrl+.', description: 'Quick actions' },
  { category: 'Editor', shortcut: 'F12', description: 'Go to definition' },
  { category: 'Editor', shortcut: 'Shift+F12', description: 'Find references' },
  { category: 'Editor', shortcut: 'Ctrl+/', description: 'Toggle line comment' },
  { category: 'Editor', shortcut: 'Ctrl+K Ctrl+C', description: 'Comment lines' },
  { category: 'Editor', shortcut: 'Ctrl+K Ctrl+U', description: 'Uncomment lines' },
  { category: 'Editor', shortcut: 'Alt+Up/Down', description: 'Move line up/down' },
  { category: 'Editor', shortcut: 'Shift+Alt+Up/Down', description: 'Copy line up/down' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  visible,
  onClose,
  isDark = true,
}) => {
  const bg = isDark ? '#252526' : '#ffffff';
  const textPrimary = isDark ? '#cccccc' : '#1f1f1f';
  const textSecondary = isDark ? '#858585' : '#666666';
  const border = isDark ? '#2d2d30' : '#e8e8e8';

  // Group shortcuts by category
  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  const renderCategorySection = (category: string) => {
    const categoryShortcuts = shortcuts.filter((s) => s.category === category);

    return (
      <div key={category} style={{ marginBottom: '24px' }}>
        <Title
          level={5}
          style={{
            color: '#4ec9b0',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {category}
        </Title>
        <Table
          dataSource={categoryShortcuts}
          columns={[
            {
              title: 'Shortcut',
              dataIndex: 'shortcut',
              key: 'shortcut',
              width: '40%',
              render: (text: string) => (
                <Text
                  keyboard
                  style={{
                    backgroundColor: isDark ? '#1e1e1e' : '#f0f0f0',
                    color: textPrimary,
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${border}`,
                  }}
                >
                  {text}
                </Text>
              ),
            },
            {
              title: 'Description',
              dataIndex: 'description',
              key: 'description',
              render: (text: string) => (
                <Text style={{ color: textSecondary, fontSize: '13px' }}>{text}</Text>
              ),
            },
          ]}
          pagination={false}
          showHeader={false}
          size="small"
          style={{
            backgroundColor: bg,
          }}
          rowKey={(record) => `${record.category}-${record.shortcut}`}
        />
      </div>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>⌨️</span>
          <Text strong style={{ fontSize: '16px', color: textPrimary }}>
            Keyboard Shortcuts
          </Text>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      styles={{
        body: {
          backgroundColor: bg,
          maxHeight: '70vh',
          overflowY: 'auto',
          padding: '24px',
        },
      }}
    >
      <Text style={{ color: textSecondary, fontSize: '13px', display: 'block', marginBottom: '20px' }}>
        Use these keyboard shortcuts to navigate and control CodePad efficiently.
      </Text>

      {categories.map((category) => renderCategorySection(category))}

      <Divider style={{ margin: '20px 0', borderColor: border }} />

      <Text style={{ color: textSecondary, fontSize: '12px', fontStyle: 'italic' }}>
        Note: On macOS, use Cmd instead of Ctrl for most shortcuts.
      </Text>
    </Modal>
  );
};

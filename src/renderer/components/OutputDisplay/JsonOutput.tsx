import React, { useState } from 'react';
import { Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';

const { Text } = Typography;

interface JsonOutputProps {
  content: string;
  metadata?: any;
}

function parseJsonToTree(data: any, key: string = 'root'): DataNode {
  if (data === null) {
    return {
      title: <span><Text type="secondary">{key}:</Text> <Text style={{ color: '#6d9cbe' }}>null</Text></span>,
      key,
      isLeaf: true,
    };
  }

  if (data === undefined) {
    return {
      title: <span><Text type="secondary">{key}:</Text> <Text style={{ color: '#858585' }}>undefined</Text></span>,
      key,
      isLeaf: true,
    };
  }

  const type = typeof data;

  // Primitive types
  if (type === 'string') {
    return {
      title: (
        <span>
          <Text type="secondary">{key}:</Text> <Text style={{ color: '#ce9178' }}>&ldquo;{data}&rdquo;</Text>
        </span>
      ),
      key,
      isLeaf: true,
    };
  }

  if (type === 'number') {
    return {
      title: (
        <span>
          <Text type="secondary">{key}:</Text> <Text style={{ color: '#b5cea8' }}>{data}</Text>
        </span>
      ),
      key,
      isLeaf: true,
    };
  }

  if (type === 'boolean') {
    return {
      title: (
        <span>
          <Text type="secondary">{key}:</Text> <Text style={{ color: '#569cd6' }}>{data.toString()}</Text>
        </span>
      ),
      key,
      isLeaf: true,
    };
  }

  // Arrays
  if (Array.isArray(data)) {
    const children = data.map((item, index) =>
      parseJsonToTree(item, `${key}[${index}]`)
    );

    return {
      title: (
        <span>
          <Text type="secondary">{key}:</Text> <Text style={{ color: '#4ec9b0' }}>Array[{data.length}]</Text>
        </span>
      ),
      key,
      children,
    };
  }

  // Objects
  if (type === 'object') {
    const entries = Object.entries(data);
    const children = entries.map(([objKey, value]) =>
      parseJsonToTree(value, `${key}.${objKey}`)
    );

    return {
      title: (
        <span>
          <Text type="secondary">{key}:</Text> <Text style={{ color: '#4ec9b0' }}>Object{`{${entries.length}}`}</Text>
        </span>
      ),
      key,
      children,
    };
  }

  // Fallback
  return {
    title: <span><Text type="secondary">{key}:</Text> {String(data)}</span>,
    key,
    isLeaf: true,
  };
}

export const JsonOutput: React.FC<JsonOutputProps> = ({ content, metadata }) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['root']);

  let treeData: DataNode[];
  try {
    const parsed = JSON.parse(content);
    treeData = [parseJsonToTree(parsed, 'root')];
  } catch (error) {
    return (
      <div style={{ padding: '12px', color: '#f48771' }}>
        <Text type="danger">Invalid JSON: {error instanceof Error ? error.message : String(error)}</Text>
        <pre style={{ marginTop: '8px', color: '#cccccc' }}>{content}</pre>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '12px',
        background: '#1e1e1e',
      }}
    >
      {metadata?.label && (
        <div style={{ marginBottom: '12px', color: '#4ec9b0', fontSize: '14px', fontWeight: 'bold' }}>
          {metadata.label}
        </div>
      )}
      {metadata && (
        <div style={{ marginBottom: '12px', color: '#858585', fontSize: '12px' }}>
          <Text type="secondary">
            {metadata.type === 'array' ? 'Array' : 'Object'} • {metadata.length} {metadata.type === 'array' ? 'items' : 'properties'}
          </Text>
        </div>
      )}

      <Tree
        showLine
        defaultExpandAll
        expandedKeys={expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys)}
        treeData={treeData}
        style={{
          background: 'transparent',
          color: '#cccccc',
        }}
      />
    </div>
  );
};

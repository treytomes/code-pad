import React from 'react';
import type { ProgressEvent } from '../../../backend/progress';

interface ProgressBarProps {
  events: ProgressEvent[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ events }) => {
  if (events.length === 0) return null;

  const latest = events[events.length - 1];
  const pct = latest.max > 0 ? Math.min(100, (latest.value / latest.max) * 100) : 0;
  const done = latest.value >= latest.max;

  return (
    <div
      data-testid="progress-bar"
      style={{
        padding: '10px 12px 8px',
        borderBottom: '1px solid #2d2d30',
        background: '#1e1e1e',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
          fontSize: '12px',
          color: '#cccccc',
        }}
      >
        <span>{latest.label ?? 'Progress'}</span>
        <span style={{ color: done ? '#4ec9b0' : '#858585' }}>
          {latest.value} / {latest.max} ({Math.round(pct)}%)
        </span>
      </div>
      <div
        style={{
          height: '6px',
          background: '#2d2d30',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: done ? '#4ec9b0' : '#007acc',
            borderRadius: '3px',
            transition: 'width 0.15s ease, background 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};

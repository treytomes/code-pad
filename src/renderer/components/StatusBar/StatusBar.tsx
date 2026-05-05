import React from 'react';

interface StatusBarProps {
  language: string;
  isRunning: boolean;
  cursorLine: number;
  cursorColumn: number;
  executionTime: number | null;
  targetFramework?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  language,
  isRunning,
  cursorLine,
  cursorColumn,
  executionTime,
  targetFramework,
}) => {
  const languageLabel: Record<string, string> = {
    csharp: 'C#',
    python: 'Python',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
  };

  return (
    <div
      style={{
        height: '22px',
        background: '#007acc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        fontSize: '12px',
        color: '#ffffff',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span>{languageLabel[language] ?? language}</span>
        {targetFramework && (
          <span style={{ opacity: 0.8 }}>{targetFramework}</span>
        )}
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isRunning ? (
            <>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#4ec9b0',
                  display: 'inline-block',
                  animation: 'pulse 1s ease-in-out infinite',
                }}
              />
              Executing…
            </>
          ) : (
            'Ready'
          )}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {executionTime !== null && <span style={{ opacity: 0.85 }}>{executionTime}ms</span>}
        <span>
          Ln {cursorLine}, Col {cursorColumn}
        </span>
      </div>
    </div>
  );
};

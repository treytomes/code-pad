import React, { useRef } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  theme?: 'vs-dark' | 'light';
  readOnly?: boolean;
  height?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'csharp',
  theme = 'vs-dark',
  readOnly = false,
  height = '100%',
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    // Configure C# language features
    monaco.languages.registerCompletionItemProvider('csharp', {
      provideCompletionItems: () => {
        const suggestions = [
          {
            label: 'Console.WriteLine',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'Console.WriteLine($1);',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Writes a line to the console',
          },
          {
            label: 'var',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'var ${1:name} = ${2:value};',
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Declares an implicitly-typed local variable',
          },
        ];
        return { suggestions };
      },
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (onChange && value !== undefined) {
      onChange(value);
    }
  };

  return (
    <MonacoEditor
      height={height}
      language={language}
      theme={theme}
      value={value}
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
      options={{
        readOnly,
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        folding: true,
        renderWhitespace: 'selection',
        wordWrap: 'off',
        tabSize: 4,
        insertSpaces: true,
      }}
    />
  );
};

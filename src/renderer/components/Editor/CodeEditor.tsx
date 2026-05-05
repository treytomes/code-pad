import React, { useRef } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onCursorChange?: (line: number, column: number) => void;
  language?: string;
  theme?: 'vs-dark' | 'light';
  readOnly?: boolean;
  height?: string;
  fontSize?: number;
  tabSize?: number;
  wordWrap?: boolean;
  minimap?: boolean;
  lineNumbers?: boolean;
  folding?: boolean;
  parameterHints?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  onCursorChange,
  language = 'csharp',
  theme = 'vs-dark',
  readOnly = false,
  height = '100%',
  fontSize = 14,
  tabSize = 4,
  wordWrap = false,
  minimap = false,
  lineNumbers = true,
  folding = true,
  parameterHints = true,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    if (onCursorChange) {
      editor.onDidChangeCursorPosition((e) => {
        onCursorChange(e.position.lineNumber, e.position.column);
      });
    }

    // Configure C# language features
    monaco.languages.registerCompletionItemProvider('csharp', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: monaco.languages.CompletionItem[] = [
          {
            label: 'Console.WriteLine',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'Console.WriteLine($1);',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Writes a line to the console',
            range,
          },
          {
            label: 'var',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'var ${1:name} = ${2:value};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Declares an implicitly-typed local variable',
            range,
          },
        ];
        return { suggestions };
      },
    });

    // Signature help (parameter hints) for common .NET methods
    monaco.languages.registerSignatureHelpProvider('csharp', {
      signatureHelpTriggerCharacters: ['(', ','],
      signatureHelpRetriggerCharacters: [','],
      provideSignatureHelp: (model, position) => {
        const lineContent = model.getLineContent(position.lineNumber);
        const textBefore = lineContent.substring(0, position.column - 1);

        // Find the nearest open call — walk back to match a known method name
        const callMatch = textBefore.match(/(\w[\w.]*)\s*\(([^)]*)$/);
        if (!callMatch) return null;

        const methodName = callMatch[1];
        const argsBefore = callMatch[2];
        const activeParameter = (argsBefore.match(/,/g) || []).length;

        type SigDef = { label: string; doc: string; params: { label: string; doc: string }[] };
        const signatures: Record<string, SigDef> = {
          'Console.WriteLine': {
            label: 'Console.WriteLine(value)',
            doc: 'Writes the specified value, followed by a newline, to the standard output.',
            params: [{ label: 'value', doc: 'The value to write.' }],
          },
          'Console.Write': {
            label: 'Console.Write(value)',
            doc: 'Writes the specified value to the standard output.',
            params: [{ label: 'value', doc: 'The value to write.' }],
          },
          'Console.ReadLine': {
            label: 'Console.ReadLine()',
            doc: 'Reads the next line of characters from the standard input.',
            params: [],
          },
          Dump: {
            label: 'Dump(label?)',
            doc: 'Outputs the object to the CodePad output panel.',
            params: [{ label: 'label', doc: 'Optional label shown above the output.' }],
          },
          'string.Format': {
            label: 'string.Format(format, args)',
            doc: 'Replaces format items in a string with the string representations of the args.',
            params: [
              { label: 'format', doc: 'A composite format string.' },
              { label: 'args', doc: 'Objects to format.' },
            ],
          },
        };

        const sig = signatures[methodName];
        if (!sig) return null;

        return {
          value: {
            signatures: [
              {
                label: sig.label,
                documentation: { value: sig.doc },
                parameters: sig.params.map((p) => ({
                  label: p.label,
                  documentation: { value: p.doc },
                })),
              },
            ],
            activeSignature: 0,
            activeParameter: Math.min(activeParameter, Math.max(0, sig.params.length - 1)),
          },
          dispose: () => {},
        };
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
        minimap: { enabled: minimap },
        fontSize,
        lineNumbers: lineNumbers ? 'on' : 'off',
        roundedSelection: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        // Code folding (#48)
        folding,
        foldingStrategy: 'indentation',
        showFoldingControls: 'always',
        // Find widget — enabled by default; Ctrl+F / Ctrl+H open it natively (#46)
        find: {
          addExtraSpaceOnTop: false,
          seedSearchStringFromSelection: 'selection',
        },
        // Parameter hints and hover (#48)
        parameterHints: { enabled: parameterHints, cycle: true },
        hover: { enabled: true, delay: 300 },
        // General quality-of-life
        renderWhitespace: 'selection',
        wordWrap: wordWrap ? 'on' : 'off',
        tabSize,
        insertSpaces: true,
        quickSuggestions: { other: true, comments: false, strings: false },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
      }}
    />
  );
};

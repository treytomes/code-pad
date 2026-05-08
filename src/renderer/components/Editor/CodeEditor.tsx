import React, { useRef } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Track if language providers have been registered to avoid duplicate registrations
let languageProvidersRegistered = false;

/**
 * Register C# language providers once globally.
 * Called on first editor mount.
 */
function registerCSharpLanguageProviders() {
  if (languageProvidersRegistered) return;
  languageProvidersRegistered = true;

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
        // Keywords
        {
          label: 'var',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'var ${1:name} = ${2:value};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Declares an implicitly-typed local variable',
          range,
          sortText: '0_var',
        },
        {
          label: 'using',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'using ${1:System};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Adds a namespace import',
          range,
          sortText: '0_using',
        },
        {
          label: 'class',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'class ${1:ClassName}\n{\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Defines a class',
          range,
          sortText: '0_class',
        },
        {
          label: 'interface',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'interface ${1:IName}\n{\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Defines an interface',
          range,
          sortText: '0_interface',
        },
        {
          label: 'foreach',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'foreach (var ${1:item} in ${2:collection})\n{\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Iterates over a collection',
          range,
          sortText: '0_foreach',
        },
        {
          label: 'for',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++)\n{\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Standard for loop',
          range,
          sortText: '0_for',
        },
        {
          label: 'while',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'while (${1:condition})\n{\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'While loop',
          range,
          sortText: '0_while',
        },
        {
          label: 'if',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'if (${1:condition})\n{\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Conditional statement',
          range,
          sortText: '0_if',
        },
        {
          label: 'try',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'try\n{\n\t$0\n}\ncatch (Exception ex)\n{\n\t\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Exception handling',
          range,
          sortText: '0_try',
        },
        {
          label: 'async',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'async ${1:Task} ${2:MethodName}()\n{\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Async method declaration',
          range,
          sortText: '0_async',
        },
        {
          label: 'await',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'await ${1:task}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Awaits an async operation',
          range,
          sortText: '0_await',
        },

        // Console methods
        {
          label: 'Console.WriteLine',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'Console.WriteLine($1);',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Writes a line to the console',
          range,
          sortText: '1_WriteLine',
        },
        {
          label: 'Console.Write',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'Console.Write($1);',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Writes to the console without newline',
          range,
          sortText: '1_Write',
        },
        {
          label: 'Console.ReadLine',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'Console.ReadLine()',
          documentation: 'Reads a line from standard input',
          range,
          sortText: '1_ReadLine',
        },

        // Common .NET types
        {
          label: 'List<T>',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'List<${1:T}>',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Generic list collection',
          range,
          sortText: '2_List',
        },
        {
          label: 'Dictionary<TKey, TValue>',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'Dictionary<${1:TKey}, ${2:TValue}>',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Generic dictionary collection',
          range,
          sortText: '2_Dictionary',
        },
        {
          label: 'Task',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'Task',
          documentation: 'Represents an asynchronous operation',
          range,
          sortText: '2_Task',
        },
        {
          label: 'Task<T>',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'Task<${1:T}>',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Asynchronous operation with result',
          range,
          sortText: '2_Task<T>',
        },
        {
          label: 'IEnumerable<T>',
          kind: monaco.languages.CompletionItemKind.Interface,
          insertText: 'IEnumerable<${1:T}>',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Sequence of elements',
          range,
          sortText: '2_IEnumerable',
        },
        {
          label: 'StringBuilder',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'StringBuilder',
          documentation: 'Mutable string builder',
          range,
          sortText: '2_StringBuilder',
        },
        {
          label: 'DateTime',
          kind: monaco.languages.CompletionItemKind.Struct,
          insertText: 'DateTime',
          documentation: 'Date and time representation',
          range,
          sortText: '2_DateTime',
        },
        {
          label: 'TimeSpan',
          kind: monaco.languages.CompletionItemKind.Struct,
          insertText: 'TimeSpan',
          documentation: 'Time interval',
          range,
          sortText: '2_TimeSpan',
        },
        {
          label: 'Guid',
          kind: monaco.languages.CompletionItemKind.Struct,
          insertText: 'Guid',
          documentation: 'Globally unique identifier',
          range,
          sortText: '2_Guid',
        },
        {
          label: 'HttpClient',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'HttpClient',
          documentation: 'HTTP client for making requests',
          range,
          sortText: '2_HttpClient',
        },
        {
          label: 'StreamReader',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'StreamReader',
          documentation: 'Reads characters from a stream',
          range,
          sortText: '2_StreamReader',
        },
        {
          label: 'StreamWriter',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'StreamWriter',
          documentation: 'Writes characters to a stream',
          range,
          sortText: '2_StreamWriter',
        },
        {
          label: 'JsonSerializer',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'JsonSerializer',
          documentation: 'JSON serialization (System.Text.Json)',
          range,
          sortText: '2_JsonSerializer',
        },

        // CodePad-specific APIs
        {
          label: 'Dump',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'Dump($1)',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Outputs the object to CodePad output panel (extension method)',
          range,
          sortText: '1_Dump',
        },
        {
          label: 'ProgressReporter',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'new ProgressReporter(${1:"Task Name"})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Creates a progress reporter for CodePad output panel',
          range,
          sortText: '2_ProgressReporter',
        },
        {
          label: 'Container.New',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'Container.New(${1:"Container Name"})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Creates a live-update container in CodePad output',
          range,
          sortText: '1_Container',
        },

        // LINQ methods
        {
          label: 'Select',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'Select(x => ${1:x})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Projects each element (LINQ)',
          range,
          sortText: '3_Select',
        },
        {
          label: 'Where',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'Where(x => ${1:condition})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Filters elements (LINQ)',
          range,
          sortText: '3_Where',
        },
        {
          label: 'OrderBy',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'OrderBy(x => ${1:x.Property})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Sorts in ascending order (LINQ)',
          range,
          sortText: '3_OrderBy',
        },
        {
          label: 'GroupBy',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'GroupBy(x => ${1:x.Property})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Groups by key (LINQ)',
          range,
          sortText: '3_GroupBy',
        },
        {
          label: 'ToList',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'ToList()',
          documentation: 'Converts to List<T> (LINQ)',
          range,
          sortText: '3_ToList',
        },
        {
          label: 'ToArray',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'ToArray()',
          documentation: 'Converts to array (LINQ)',
          range,
          sortText: '3_ToArray',
        },
        {
          label: 'First',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'First()',
          documentation: 'Returns first element (LINQ)',
          range,
          sortText: '3_First',
        },
        {
          label: 'Any',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'Any()',
          documentation: 'Checks if any elements exist (LINQ)',
          range,
          sortText: '3_Any',
        },
        {
          label: 'Count',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'Count()',
          documentation: 'Counts elements (LINQ)',
          range,
          sortText: '3_Count',
        },
        {
          label: 'Sum',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'Sum()',
          documentation: 'Sums numeric values (LINQ)',
          range,
          sortText: '3_Sum',
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
        // Console methods
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

        // CodePad-specific
        Dump: {
          label: 'Dump(label?)',
          doc: 'Outputs the object to the CodePad output panel. Extension method available on all objects.',
          params: [{ label: 'label', doc: 'Optional label shown above the output.' }],
        },
        'ProgressReporter': {
          label: 'new ProgressReporter(name)',
          doc: 'Creates a progress reporter that displays in the CodePad output panel.',
          params: [{ label: 'name', doc: 'The name of the task being tracked.' }],
        },
        'Container.New': {
          label: 'Container.New(name)',
          doc: 'Creates a live-update container in CodePad output. Returns IContainer.',
          params: [{ label: 'name', doc: 'The name of the container.' }],
        },

        // String methods
        'string.Format': {
          label: 'string.Format(format, args)',
          doc: 'Replaces format items in a string with the string representations of the args.',
          params: [
            { label: 'format', doc: 'A composite format string.' },
            { label: 'args', doc: 'Objects to format.' },
          ],
        },
        'string.Join': {
          label: 'string.Join(separator, values)',
          doc: 'Concatenates the elements of a collection using the specified separator.',
          params: [
            { label: 'separator', doc: 'The separator string.' },
            { label: 'values', doc: 'The collection to join.' },
          ],
        },

        // Collections
        'List': {
          label: 'new List<T>()',
          doc: 'Creates a new generic list.',
          params: [],
        },
        'Dictionary': {
          label: 'new Dictionary<TKey, TValue>()',
          doc: 'Creates a new generic dictionary.',
          params: [],
        },

        // LINQ methods
        'Select': {
          label: 'Select(selector)',
          doc: 'Projects each element of a sequence into a new form.',
          params: [{ label: 'selector', doc: 'A transform function (x => ...).' }],
        },
        'Where': {
          label: 'Where(predicate)',
          doc: 'Filters elements based on a condition.',
          params: [{ label: 'predicate', doc: 'A condition function (x => bool).' }],
        },
        'OrderBy': {
          label: 'OrderBy(keySelector)',
          doc: 'Sorts elements in ascending order by key.',
          params: [{ label: 'keySelector', doc: 'A key selector function (x => key).' }],
        },
        'GroupBy': {
          label: 'GroupBy(keySelector)',
          doc: 'Groups elements by key.',
          params: [{ label: 'keySelector', doc: 'A key selector function (x => key).' }],
        },
        'ToList': {
          label: 'ToList()',
          doc: 'Converts a sequence to a List<T>.',
          params: [],
        },
        'ToArray': {
          label: 'ToArray()',
          doc: 'Converts a sequence to an array.',
          params: [],
        },
        'First': {
          label: 'First()',
          doc: 'Returns the first element of a sequence.',
          params: [],
        },
        'Any': {
          label: 'Any(predicate?)',
          doc: 'Determines whether any elements satisfy a condition.',
          params: [{ label: 'predicate', doc: 'Optional condition (x => bool).' }],
        },
        'Count': {
          label: 'Count()',
          doc: 'Returns the number of elements in a sequence.',
          params: [],
        },
        'Sum': {
          label: 'Sum()',
          doc: 'Computes the sum of numeric values.',
          params: [],
        },

        // Async
        'Task.Delay': {
          label: 'Task.Delay(milliseconds)',
          doc: 'Creates a task that completes after a specified delay.',
          params: [{ label: 'milliseconds', doc: 'The delay in milliseconds.' }],
        },
        'Task.Run': {
          label: 'Task.Run(action)',
          doc: 'Queues work to run on the thread pool.',
          params: [{ label: 'action', doc: 'The work to execute.' }],
        },
        'Task.WhenAll': {
          label: 'Task.WhenAll(tasks)',
          doc: 'Creates a task that completes when all tasks complete.',
          params: [{ label: 'tasks', doc: 'Array of tasks to wait for.' }],
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
}

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

    // Register language providers once globally (safe to call multiple times)
    registerCSharpLanguageProviders();

    if (onCursorChange) {
      editor.onDidChangeCursorPosition((e) => {
        onCursorChange(e.position.lineNumber, e.position.column);
      });
    }
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

import { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { MONACO_OPTIONS } from '../utils/constants';

const PASSTHROUGH_KEYS = new Set([
  'Backspace', 'Delete', 'Enter', 'Tab', 'Escape',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Home', 'End', 'PageUp', 'PageDown',
  'Shift', 'Control', 'Alt', 'Meta', 'CapsLock',
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
]);

function registerCompletions(monaco) {

  // ── Python ──────────────────────────────────────────────────────────
  monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['.', ' '],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
        startColumn: word.startColumn, endColumn: word.endColumn,
      };
      const s = (label, insertText, documentation) => ({
        label, insertText, documentation, range,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      });
      return { suggestions: [
        s('print',   'print(${1:value})',                          'Print to stdout'),
        s('def',     'def ${1:name}(${2:params}):\n\t${3:pass}',  'Define function'),
        s('class',   'class ${1:Name}:\n\tdef __init__(self):\n\t\t${2:pass}', 'Define class'),
        s('for',     'for ${1:item} in ${2:iterable}:\n\t${3:pass}', 'For loop'),
        s('while',   'while ${1:condition}:\n\t${2:pass}',        'While loop'),
        s('if',      'if ${1:condition}:\n\t${2:pass}',           'If statement'),
        s('ifelse',  'if ${1:condition}:\n\t${2:pass}\nelse:\n\t${3:pass}', 'If/else'),
        s('try',     'try:\n\t${1:pass}\nexcept ${2:Exception} as e:\n\t${3:pass}', 'Try/except'),
        s('import',  'import ${1:module}',                        'Import module'),
        s('from',    'from ${1:module} import ${2:name}',         'From import'),
        s('lambda',  'lambda ${1:params}: ${2:expr}',             'Lambda'),
        s('listcomp','[${1:expr} for ${2:item} in ${3:iterable}]','List comprehension'),
        s('dictcomp','{${1:k}: ${2:v} for ${3:item} in ${4:iterable}}', 'Dict comprehension'),
        s('with',    'with ${1:expr} as ${2:var}:\n\t${3:pass}',  'Context manager'),
        s('main',    'if __name__ == "__main__":\n\t${1:main()}', 'Main guard'),
      ]};
    },
  });

  // ── JavaScript ──────────────────────────────────────────────────────
  monaco.languages.registerCompletionItemProvider('javascript', {
    triggerCharacters: ['.', ' '],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
        startColumn: word.startColumn, endColumn: word.endColumn,
      };
      const s = (label, insertText, documentation) => ({
        label, insertText, documentation, range,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      });
      return { suggestions: [
        s('log',      'console.log(${1:value});',                  'Console log'),
        s('fn',       'function ${1:name}(${2:params}) {\n\t${3}\n}', 'Function'),
        s('arrow',    'const ${1:name} = (${2:params}) => {\n\t${3}\n};', 'Arrow function'),
        s('const',    'const ${1:name} = ${2:value};',             'Const'),
        s('let',      'let ${1:name} = ${2:value};',               'Let'),
        s('for',      'for (let ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}', 'For loop'),
        s('forof',    'for (const ${1:item} of ${2:iterable}) {\n\t${3}\n}', 'For of'),
        s('forin',    'for (const ${1:key} in ${2:object}) {\n\t${3}\n}', 'For in'),
        s('while',    'while (${1:condition}) {\n\t${2}\n}',       'While loop'),
        s('if',       'if (${1:condition}) {\n\t${2}\n}',          'If'),
        s('ifelse',   'if (${1:condition}) {\n\t${2}\n} else {\n\t${3}\n}', 'If/else'),
        s('try',      'try {\n\t${1}\n} catch (${2:err}) {\n\t${3}\n}', 'Try/catch'),
        s('class',    'class ${1:Name} {\n\tconstructor(${2:params}) {\n\t\t${3}\n\t}\n}', 'Class'),
        s('promise',  'new Promise((resolve, reject) => {\n\t${1}\n});', 'Promise'),
        s('async',    'async function ${1:name}(${2:params}) {\n\t${3}\n}', 'Async function'),
        s('await',    'const ${1:result} = await ${2:promise};',   'Await'),
        s('import',   "import ${1:name} from '${2:module}';",      'Import'),
      ]};
    },
  });

  // ── TypeScript (same as JS + types) ─────────────────────────────────
  monaco.languages.registerCompletionItemProvider('typescript', {
    triggerCharacters: ['.', ' ', ':'],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
        startColumn: word.startColumn, endColumn: word.endColumn,
      };
      const s = (label, insertText, documentation) => ({
        label, insertText, documentation, range,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      });
      return { suggestions: [
        s('interface', 'interface ${1:Name} {\n\t${2:key}: ${3:type};\n}', 'Interface'),
        s('type',      'type ${1:Name} = ${2:type};',              'Type alias'),
        s('enum',      'enum ${1:Name} {\n\t${2:Value}\n}',        'Enum'),
        s('fn',        'function ${1:name}(${2:params}): ${3:void} {\n\t${4}\n}', 'Function'),
        s('arrow',     'const ${1:name} = (${2:params}): ${3:type} => {\n\t${4}\n};', 'Arrow'),
        s('async',     'async function ${1:name}(${2:params}): Promise<${3:void}> {\n\t${4}\n}', 'Async'),
        s('class',     'class ${1:Name} implements ${2:Interface} {\n\tconstructor(${3:params}) {\n\t\t${4}\n\t}\n}', 'Class'),
        s('generic',   'function ${1:name}<T>(${2:arg}: T): T {\n\t${3}\n}', 'Generic function'),
      ]};
    },
  });

  // ── Java ─────────────────────────────────────────────────────────────
  monaco.languages.registerCompletionItemProvider('java', {
    triggerCharacters: ['.', ' '],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
        startColumn: word.startColumn, endColumn: word.endColumn,
      };
      const s = (label, insertText, documentation) => ({
        label, insertText, documentation, range,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      });
      return { suggestions: [
        s('main',    'public static void main(String[] args) {\n\t${1}\n}', 'Main method'),
        s('sout',    'System.out.println(${1});',                'Print'),
        s('soutf',   'System.out.printf("${1}%n", ${2});',       'Printf'),
        s('class',   'public class ${1:Name} {\n\t${2}\n}',      'Class'),
        s('method',  'public ${1:void} ${2:name}(${3:params}) {\n\t${4}\n}', 'Method'),
        s('for',     'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}', 'For loop'),
        s('foreach', 'for (${1:Type} ${2:item} : ${3:list}) {\n\t${4}\n}', 'For each'),
        s('while',   'while (${1:condition}) {\n\t${2}\n}',      'While'),
        s('if',      'if (${1:condition}) {\n\t${2}\n}',         'If'),
        s('try',     'try {\n\t${1}\n} catch (${2:Exception} e) {\n\te.printStackTrace();\n}', 'Try/catch'),
        s('interface','public interface ${1:Name} {\n\t${2}\n}', 'Interface'),
        s('extends', 'public class ${1:Child} extends ${2:Parent} {\n\t${3}\n}', 'Extends'),
        s('arr',     '${1:int}[] ${2:arr} = new ${1:int}[${3:size}];', 'Array'),
        s('list',    'List<${1:String}> ${2:list} = new ArrayList<>();', 'ArrayList'),
        s('map',     'Map<${1:String}, ${2:Object}> ${3:map} = new HashMap<>();', 'HashMap'),
      ]};
    },
  });

  // ── C++ ──────────────────────────────────────────────────────────────
  monaco.languages.registerCompletionItemProvider('cpp', {
    triggerCharacters: ['.', ':', '>'],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
        startColumn: word.startColumn, endColumn: word.endColumn,
      };
      const s = (label, insertText, documentation) => ({
        label, insertText, documentation, range,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      });
      return { suggestions: [
        s('main',    '#include <iostream>\nusing namespace std;\n\nint main() {\n\t${1}\n\treturn 0;\n}', 'Main'),
        s('cout',    'cout << ${1} << endl;',                    'Print'),
        s('cin',     'cin >> ${1};',                             'Input'),
        s('include', '#include <${1:iostream}>',                 'Include'),
        s('for',     'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}', 'For loop'),
        s('while',   'while (${1:condition}) {\n\t${2}\n}',     'While'),
        s('if',      'if (${1:condition}) {\n\t${2}\n}',        'If'),
        s('class',   'class ${1:Name} {\npublic:\n\t${2}\n};',  'Class'),
        s('struct',  'struct ${1:Name} {\n\t${2}\n};',          'Struct'),
        s('vector',  'vector<${1:int}> ${2:v};',                'Vector'),
        s('map',     'map<${1:string}, ${2:int}> ${3:m};',      'Map'),
        s('fn',      '${1:void} ${2:name}(${3:params}) {\n\t${4}\n}', 'Function'),
        s('try',     'try {\n\t${1}\n} catch (exception& e) {\n\t${2}\n}', 'Try/catch'),
        s('ptr',     '${1:int}* ${2:ptr} = &${3:var};',         'Pointer'),
        s('lambda',  'auto ${1:fn} = [${2:}](${3:params}) {\n\t${4}\n};', 'Lambda'),
      ]};
    },
  });

  // ── C ────────────────────────────────────────────────────────────────
  monaco.languages.registerCompletionItemProvider('c', {
    triggerCharacters: ['.', '>'],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
        startColumn: word.startColumn, endColumn: word.endColumn,
      };
      const s = (label, insertText, documentation) => ({
        label, insertText, documentation, range,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      });
      return { suggestions: [
        s('main',    '#include <stdio.h>\n\nint main() {\n\t${1}\n\treturn 0;\n}', 'Main'),
        s('printf',  'printf("${1}\\n"${2});',                  'Printf'),
        s('scanf',   'scanf("${1}", &${2});',                   'Scanf'),
        s('include', '#include <${1:stdio.h}>',                 'Include'),
        s('for',     'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}', 'For loop'),
        s('while',   'while (${1:condition}) {\n\t${2}\n}',    'While'),
        s('if',      'if (${1:condition}) {\n\t${2}\n}',       'If'),
        s('struct',  'struct ${1:Name} {\n\t${2}\n};',         'Struct'),
        s('fn',      '${1:void} ${2:name}(${3:params}) {\n\t${4}\n}', 'Function'),
        s('arr',     '${1:int} ${2:arr}[${3:size}];',          'Array'),
        s('ptr',     '${1:int}* ${2:ptr} = &${3:var};',        'Pointer'),
        s('malloc',  '${1:int}* ${2:ptr} = malloc(sizeof(${1:int}) * ${3:n});', 'Malloc'),
      ]};
    },
  });

  // ── Go ───────────────────────────────────────────────────────────────
  monaco.languages.registerCompletionItemProvider('go', {
    triggerCharacters: ['.', ' '],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
        startColumn: word.startColumn, endColumn: word.endColumn,
      };
      const s = (label, insertText, documentation) => ({
        label, insertText, documentation, range,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      });
      return { suggestions: [
        s('main',   'package main\n\nimport "fmt"\n\nfunc main() {\n\t${1}\n}', 'Main'),
        s('fmt',    'fmt.Println(${1})',                        'Println'),
        s('fn',     'func ${1:name}(${2:params}) ${3:type} {\n\t${4}\n}', 'Function'),
        s('for',    'for ${1:i} := 0; ${1:i} < ${2:n}; ${1:i}++ {\n\t${3}\n}', 'For loop'),
        s('range',  'for ${1:i}, ${2:v} := range ${3:slice} {\n\t${4}\n}', 'Range'),
        s('if',     'if ${1:condition} {\n\t${2}\n}',          'If'),
        s('iferr',  'if err != nil {\n\treturn ${1:err}\n}',   'Error check'),
        s('struct', 'type ${1:Name} struct {\n\t${2:Field} ${3:type}\n}', 'Struct'),
        s('goroutine', 'go func() {\n\t${1}\n}()',             'Goroutine'),
        s('chan',   '${1:ch} := make(chan ${2:int})',           'Channel'),
        s('defer',  'defer ${1:fn}()',                         'Defer'),
        s('map',    '${1:m} := make(map[${2:string}]${3:int})','Map'),
      ]};
    },
  });

  // ── Rust ─────────────────────────────────────────────────────────────
  monaco.languages.registerCompletionItemProvider('rust', {
    triggerCharacters: ['.', ':', '!'],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
        startColumn: word.startColumn, endColumn: word.endColumn,
      };
      const s = (label, insertText, documentation) => ({
        label, insertText, documentation, range,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      });
      return { suggestions: [
        s('main',   'fn main() {\n\t${1}\n}',                  'Main'),
        s('println','println!("${1}", ${2});',                  'Println'),
        s('fn',     'fn ${1:name}(${2:params}) -> ${3:type} {\n\t${4}\n}', 'Function'),
        s('for',    'for ${1:item} in ${2:iter} {\n\t${3}\n}', 'For loop'),
        s('while',  'while ${1:condition} {\n\t${2}\n}',       'While'),
        s('if',     'if ${1:condition} {\n\t${2}\n}',          'If'),
        s('match',  'match ${1:value} {\n\t${2:pattern} => ${3:expr},\n\t_ => ${4:expr},\n}', 'Match'),
        s('struct', 'struct ${1:Name} {\n\t${2:field}: ${3:type},\n}', 'Struct'),
        s('impl',   'impl ${1:Name} {\n\tfn ${2:method}(&self) {\n\t\t${3}\n\t}\n}', 'Impl'),
        s('enum',   'enum ${1:Name} {\n\t${2:Variant},\n}',   'Enum'),
        s('let',    'let ${1:name} = ${2:value};',             'Let'),
        s('letmut', 'let mut ${1:name} = ${2:value};',         'Let mut'),
        s('vec',    'let ${1:v}: Vec<${2:i32}> = vec![${3}];', 'Vec'),
        s('option', 'let ${1:val}: Option<${2:type}> = ${3:Some(value)};', 'Option'),
        s('result', 'let ${1:val}: Result<${2:Ok}, ${3:Err}> = ${4};', 'Result'),
      ]};
    },
  });
}

let completionsRegistered = false;

export default function CodeEditor({ language, code, onChange }) {
  const editorRef = useRef(null);

  function handleMount(editor, monaco) {
    editorRef.current = editor;

    // Register completions only once
    if (!completionsRegistered) {
      registerCompletions(monaco);
      completionsRegistered = true;
    }

    const KM = monaco.KeyMod;
    const KC = monaco.KeyCode;
    editor.addCommand(KM.CtrlCmd | KC.KeyD, () => {});
    editor.addCommand(KM.CtrlCmd | KM.Shift | KC.KeyK, () => {});

    editor.onKeyDown((e) => {
      const isModified = e.ctrlKey || e.metaKey || e.altKey;
      const key = e.browserEvent?.key ?? '';
      const isPrintable = !isModified && key.length === 1 && !PASSTHROUGH_KEYS.has(key);
      if (isPrintable) e.browserEvent.stopPropagation();
    });

    editor.focus();
  }

  return (
    <div
      className="editor-wrap"
      style={{ flex: 1 }}
      onKeyDown={e => {
        const isModified = e.ctrlKey || e.metaKey || e.altKey;
        const isPrintable = !isModified && e.key.length === 1 && !PASSTHROUGH_KEYS.has(e.key);
        if (isPrintable) e.stopPropagation();
      }}
    >
      <Editor
        height="100%"
        language={language}
        value={code}
        onChange={onChange}
        onMount={handleMount}
        theme="vs-dark"
        options={MONACO_OPTIONS}
        loading={
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: 'var(--text-2)', fontFamily: 'var(--font-ui)',
            fontSize: 13, gap: 8,
          }}>
            <div className="spinner" />
            Loading editor…
          </div>
        }
      />
    </div>
  );
}
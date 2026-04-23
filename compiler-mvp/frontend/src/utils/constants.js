export const LANGUAGES = [
  { id: 'python', label: 'Python', monacoId: 'python', ext: '.py' },
  { id: 'cpp',    label: 'C++',    monacoId: 'cpp',    ext: '.cpp' },
  { id: 'c',      label: 'C',      monacoId: 'c',      ext: '.c' },
  { id: 'java',   label: 'Java',   monacoId: 'java',   ext: '.java' },
];

export const DEFAULT_CODE = {
  python: `# Python — Hello World
def greet(name):
    return f"Hello, {name}!"

names = ["World", "CodeForge", "Python"]
for name in names:
    print(greet(name))
`,

  cpp: `// C++ — Hello World
#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    vector<string> names = {"World", "CodeForge", "C++"};
    for (const auto& name : names) {
        cout << "Hello, " << name << "!" << endl;
    }
    return 0;
}
`,

  c: `// C — Hello World
#include <stdio.h>

void greet(const char* name) {
    printf("Hello, %s!\\n", name);
}

int main() {
    char* names[] = {"World", "CodeForge", "C"};
    int n = sizeof(names) / sizeof(names[0]);
    for (int i = 0; i < n; i++) {
        greet(names[i]);
    }
    return 0;
}
`,

  java: `// Java — Hello World
public class Main {
    static String greet(String name) {
        return "Hello, " + name + "!";
    }

    public static void main(String[] args) {
        String[] names = {"World", "CodeForge", "Java"};
        for (String name : names) {
            System.out.println(greet(name));
        }
    }
}
`,
};

export const MONACO_OPTIONS = {
  fontSize: 13.5,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  renderLineHighlight: 'line',
  wordWrap: 'on',
  tabSize: 4,
  insertSpaces: true,
  autoIndent: 'full',
  formatOnPaste: true,
  folding: true,
  bracketPairColorization: { enabled: true },
  padding: { top: 12, bottom: 12 },
  scrollbar: {
    verticalScrollbarSize: 6,
    horizontalScrollbarSize: 6,
  },
  quickSuggestions: {
    other: true,
    comments: false,
    strings: true,
  },
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on',
  tabCompletion: 'on',
  wordBasedSuggestions: 'matchingDocuments',
  suggest: {
    showSnippets: true,
    showKeywords: true,
    showWords: true,
    filterGraceful: true,
    snippetsPreventQuickSuggestions: false,
  },
};
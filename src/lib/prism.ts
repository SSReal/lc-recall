import Prism from 'prismjs';

// Import essential language grammars
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-swift';

const LANGUAGE_ALIASES: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    python3: 'python',
    cpp: 'cpp',
    'c++': 'cpp',
    cs: 'csharp',
    'c#': 'csharp',
    golang: 'go',
    rs: 'rust',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    kt: 'kotlin',
    rb: 'ruby',
};

const DISPLAY_NAMES: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    cpp: 'C++',
    c: 'C',
    csharp: 'C#',
    java: 'Java',
    go: 'Go',
    rust: 'Rust',
    sql: 'SQL',
    bash: 'Bash',
    json: 'JSON',
    yaml: 'YAML',
    markdown: 'Markdown',
    ruby: 'Ruby',
    kotlin: 'Kotlin',
    swift: 'Swift',
    html: 'HTML',
    css: 'CSS',
};

/**
 * Heuristically detect programming language from code snippet content
 */
export function detectLanguage(code: string): string {
    const trimmed = code.trim();

    // Python indicators
    if (
        /\b(def\s+\w+\s*\(|elif\b|import\s+\w+|from\s+\w+\s+import|self\.|__init__|print\(|None|True|False)\b/.test(trimmed) ||
        /#\s*type:\s*ignore/.test(trimmed)
    ) {
        return 'python';
    }

    // C++ indicators
    if (
        /#include\s*<|\bstd::|vector<|unordered_map<|nullptr\b|cout\s*<<|\bcin\s*>>/.test(trimmed)
    ) {
        return 'cpp';
    }

    // Java indicators
    if (
        /\b(public\s+class|private\s+void|public\s+static\s+void\s+main|System\.out\.print|new\s+ArrayList|new\s+HashMap)\b/.test(trimmed)
    ) {
        return 'java';
    }

    // Go indicators
    if (
        /\b(package\s+\w+|func\s+\w+|fmt\.Print|make\(chan\b|make\(map\[)/.test(trimmed)
    ) {
        return 'go';
    }

    // Rust indicators
    if (
        /\b(fn\s+\w+|let\s+mut\b|impl\s+|println!|Vec::new|Option<|Result<)/.test(trimmed)
    ) {
        return 'rust';
    }

    // SQL indicators
    if (
        /^\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|WITH\s+\w+\s+AS)\b/i.test(trimmed)
    ) {
        return 'sql';
    }

    // TypeScript / JavaScript indicators
    if (
        /\b(function|const|let|var|class\s+\w+|interface\s+\w+|type\s+\w+\s*=|import\s+.*\s+from|export\s+(default|const|function))\b/.test(trimmed) ||
        /=>/.test(trimmed)
    ) {
        if (
            /:\s*(number|string|boolean|any|void|never|Record<|Array<|Map<|Set<)/.test(trimmed) ||
            /<[A-Z]\w*>/.test(trimmed) ||
            /\bas\s+(const|[A-Z]\w*)/.test(trimmed) ||
            /\binterface\s+\w+/.test(trimmed)
        ) {
            return 'typescript';
        }
        return 'javascript';
    }

    // Default fallback for LeetCode
    return 'typescript';
}

/**
 * Normalize and resolve language identifier
 */
export function resolveLanguage(lang?: string): string {
    if (!lang) return 'typescript';
    const lower = lang.toLowerCase().trim();
    return LANGUAGE_ALIASES[lower] || lower;
}

/**
 * Get display label for a language
 */
export function getLanguageDisplayName(lang: string): string {
    const resolved = resolveLanguage(lang);
    return DISPLAY_NAMES[resolved] || resolved.toUpperCase();
}

/**
 * Syntax highlight a code string safely into HTML using Prism
 */
export function highlightCode(code: string, language?: string): { html: string; language: string; displayName: string } {
    let resolved = resolveLanguage(language);

    // If no language specified or resolved grammar not found, attempt detection
    if (!language || !Prism.languages[resolved]) {
        const detected = detectLanguage(code);
        if (Prism.languages[detected]) {
            resolved = detected;
        }
    }

    const grammar = Prism.languages[resolved] || Prism.languages.clike;

    if (!grammar) {
        // Fallback: escape HTML
        const escaped = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return { html: escaped, language: resolved, displayName: getLanguageDisplayName(resolved) };
    }

    try {
        const html = Prism.highlight(code, grammar, resolved);
        return { html, language: resolved, displayName: getLanguageDisplayName(resolved) };
    } catch {
        const escaped = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return { html: escaped, language: resolved, displayName: getLanguageDisplayName(resolved) };
    }
}

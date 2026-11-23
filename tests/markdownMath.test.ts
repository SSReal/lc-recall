import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

describe('Markdown and LaTeX Math Rendering', () => {
    function renderMarkdown(content: string): string {
        return ReactDOMServer.renderToStaticMarkup(
            React.createElement(ReactMarkdown, {
                remarkPlugins: [remarkGfm, remarkMath],
                rehypePlugins: [[rehypeKatex, { throwOnError: false }]],
            }, content)
        );
    }

    test('renders standard markdown elements (bold, lists, tables, code)', () => {
        const markdown = `
# Title
This is **bold** and *italic* text.

- Item 1
- Item 2

| Col 1 | Col 2 |
|---|---|
| A | B |

\`\`\`ts
const x = 10;
\`\`\`
`;
        const html = renderMarkdown(markdown);
        assert.match(html, /<h1>Title<\/h1>/);
        assert.match(html, /<strong>bold<\/strong>/);
        assert.match(html, /<em>italic<\/em>/);
        assert.match(html, /<li>Item 1<\/li>\s*<li>Item 2<\/li>/);
        assert.match(html, /<table>/);
        assert.match(html, /<pre><code class="language-ts">/);
    });

    test('renders display math blocks enclosed in $$...$$', () => {
        const content = `
Calculate the recurrence:

$$
T(n) = 2T\\left(\\frac{n}{2}\\right) + O(n)
$$

By the Master Theorem, $T(n) = O(n \\log n)$.
`;
        const html = renderMarkdown(content);

        // Display math rendered with katex-display
        assert.match(html, /class="katex-display"/);
        assert.match(html, /class="katex"/);
        assert.match(html, /annotation encoding="application\/x-tex">T\(n\) = 2T/);

        // Inline math rendered with katex
        assert.match(html, /annotation encoding="application\/x-tex">T\(n\) = O\(n \\log n\)<\/annotation>/);
    });

    test('renders inline math expressions enclosed in $...$', () => {
        const content = 'The time complexity is $O(V + E)$ and space is $O(V)$.';
        const html = renderMarkdown(content);

        assert.match(html, /class="katex"/);
        assert.match(html, /annotation encoding="application\/x-tex">O\(V \+ E\)<\/annotation>/);
        assert.match(html, /annotation encoding="application\/x-tex">O\(V\)<\/annotation>/);
    });

    test('handles mathematical symbols, fractions, and superscripts', () => {
        const content = 'Quadratic formula: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$';
        const html = renderMarkdown(content);

        assert.match(html, /class="katex"/);
        assert.match(html, /sqrt/);
        assert.match(html, /mfrac/);
    });

    test('gracefully recovers without throwing on invalid math syntax', () => {
        const brokenContent = 'Here is broken math: $$\\frac{unclosed$$ and text continues.';
        assert.doesNotThrow(() => {
            const html = renderMarkdown(brokenContent);
            assert.match(html, /katex-error/);
            assert.match(html, /text continues/);
        });
    });
});

import React, { type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, useMantineColorScheme } from '@mantine/core';
import { CodeBlock } from './CodeBlock';

export interface MarkdownRendererProps {
    content: string;
    style?: React.CSSProperties;
    className?: string;
}

export function MarkdownRenderer({ content, style, className }: MarkdownRendererProps) {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    if (!content) return null;

    return (
        <Box
            className={`markdown-body ${className || ''}`}
            style={{
                color: isDark ? '#eef4fb' : '#212529',
                ...style
            }}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Intercept fenced code blocks to render with Prism syntax highlighting & copy button
                    pre({ children }: ComponentPropsWithoutRef<'pre'>) {
                        if (React.isValidElement<ComponentPropsWithoutRef<'code'>>(children)) {
                            const codeProps = children.props;
                            const classAttr = codeProps.className || '';
                            const match = /language-(\w+)/.exec(classAttr);
                            const lang = match ? match[1] : undefined;
                            const codeString = String(codeProps.children || '').replace(/\n$/, '');
                            return <CodeBlock code={codeString} language={lang} />;
                        }
                        return <pre>{children}</pre>;
                    },

                    // Open links safely in a new tab without leaving the review session
                    a({ href, children }: ComponentPropsWithoutRef<'a'>) {
                        return (
                            <a href={href} target="_blank" rel="noopener noreferrer">
                                {children}
                            </a>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </Box>
    );
}

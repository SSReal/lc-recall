import React, { type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Text, useMantineColorScheme } from '@mantine/core';
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
                lineHeight: 1.65,
                fontSize: 14.5,
                color: isDark ? '#eef4fb' : '#212529',
                wordBreak: 'break-word',
                ...style
            }}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Fenced code blocks
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

                    // Inline code
                    code({ children, className: codeClassName, ...props }: ComponentPropsWithoutRef<'code'>) {
                        return (
                            <code
                                className={codeClassName}
                                style={{
                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                    fontSize: '0.88em',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: isDark ? 'rgba(169, 206, 244, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                                    color: isDark ? '#a9cef4' : '#1c6ca1',
                                    border: isDark ? '1px solid rgba(169, 206, 244, 0.2)' : '1px solid rgba(0, 0, 0, 0.08)',
                                    whiteSpace: 'break-spaces'
                                }}
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },

                    // Paragraphs
                    p({ children }: ComponentPropsWithoutRef<'p'>) {
                        return (
                            <Text
                                component="p"
                                style={{
                                    margin: '0 0 10px 0',
                                    lineHeight: 1.68,
                                    fontSize: 'inherit'
                                }}
                            >
                                {children}
                            </Text>
                        );
                    },

                    // Headings
                    h1({ children }: ComponentPropsWithoutRef<'h1'>) {
                        return (
                            <h1
                                style={{
                                    fontSize: '1.45rem',
                                    fontWeight: 700,
                                    margin: '18px 0 10px 0',
                                    color: isDark ? '#ffffff' : '#111827',
                                    borderBottom: isDark ? '1px solid #1e2f38' : '1px solid #e5e7eb',
                                    paddingBottom: 6
                                }}
                            >
                                {children}
                            </h1>
                        );
                    },
                    h2({ children }: ComponentPropsWithoutRef<'h2'>) {
                        return (
                            <h2
                                style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    margin: '16px 0 8px 0',
                                    color: isDark ? '#ffffff' : '#111827',
                                    borderBottom: isDark ? '1px solid #1e2f38' : '1px solid #e5e7eb',
                                    paddingBottom: 4
                                }}
                            >
                                {children}
                            </h2>
                        );
                    },
                    h3({ children }: ComponentPropsWithoutRef<'h3'>) {
                        return (
                            <h3
                                style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    margin: '14px 0 6px 0',
                                    color: isDark ? '#e0effb' : '#1f2937'
                                }}
                            >
                                {children}
                            </h3>
                        );
                    },
                    h4({ children }: ComponentPropsWithoutRef<'h4'>) {
                        return (
                            <h4
                                style={{
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    margin: '12px 0 4px 0',
                                    color: isDark ? '#e0effb' : '#1f2937'
                                }}
                            >
                                {children}
                            </h4>
                        );
                    },

                    // Lists
                    ul({ children }: ComponentPropsWithoutRef<'ul'>) {
                        return (
                            <ul
                                style={{
                                    margin: '6px 0 12px 0',
                                    paddingLeft: 22,
                                    listStyleType: 'disc'
                                }}
                            >
                                {children}
                            </ul>
                        );
                    },
                    ol({ children }: ComponentPropsWithoutRef<'ol'>) {
                        return (
                            <ol
                                style={{
                                    margin: '6px 0 12px 0',
                                    paddingLeft: 22
                                }}
                            >
                                {children}
                            </ol>
                        );
                    },
                    li({ children }: ComponentPropsWithoutRef<'li'>) {
                        return (
                            <li
                                style={{
                                    margin: '4px 0',
                                    lineHeight: 1.65
                                }}
                            >
                                {children}
                            </li>
                        );
                    },

                    // Blockquote
                    blockquote({ children }: ComponentPropsWithoutRef<'blockquote'>) {
                        return (
                            <blockquote
                                style={{
                                    margin: '10px 0',
                                    padding: '8px 14px',
                                    borderLeft: '4px solid #7ea0b7',
                                    background: isDark ? 'rgba(126, 160, 183, 0.08)' : '#f8f9fa',
                                    borderRadius: '0 6px 6px 0',
                                    color: isDark ? '#c5d9e8' : '#495057'
                                }}
                            >
                                {children}
                            </blockquote>
                        );
                    },

                    // Tables
                    table({ children }: ComponentPropsWithoutRef<'table'>) {
                        return (
                            <div style={{ overflowX: 'auto', margin: '12px 0' }}>
                                <table
                                    style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: 13.5,
                                        border: isDark ? '1px solid #1e2f38' : '1px solid #e5e7eb'
                                    }}
                                >
                                    {children}
                                </table>
                            </div>
                        );
                    },
                    thead({ children }: ComponentPropsWithoutRef<'thead'>) {
                        return (
                            <thead
                                style={{
                                    background: isDark ? '#081414' : '#f3f4f6',
                                    borderBottom: isDark ? '2px solid #26353e' : '2px solid #d1d5db'
                                }}
                            >
                                {children}
                            </thead>
                        );
                    },
                    th({ children }: ComponentPropsWithoutRef<'th'>) {
                        return (
                            <th
                                style={{
                                    padding: '8px 12px',
                                    textAlign: 'left',
                                    fontWeight: 600,
                                    border: isDark ? '1px solid #1e2f38' : '1px solid #e5e7eb'
                                }}
                            >
                                {children}
                            </th>
                        );
                    },
                    td({ children }: ComponentPropsWithoutRef<'td'>) {
                        return (
                            <td
                                style={{
                                    padding: '7px 12px',
                                    border: isDark ? '1px solid #162329' : '1px solid #e5e7eb'
                                }}
                            >
                                {children}
                            </td>
                        );
                    },

                    // Links
                    a({ href, children }: ComponentPropsWithoutRef<'a'>) {
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: isDark ? '#a9cef4' : '#1d6fba',
                                    textDecoration: 'underline',
                                    textUnderlineOffset: '2px'
                                }}
                            >
                                {children}
                            </a>
                        );
                    },

                    // Horizontal Rule
                    hr() {
                        return (
                            <hr
                                style={{
                                    border: 'none',
                                    borderTop: isDark ? '1px solid #1e2f38' : '1px solid #e5e7eb',
                                    margin: '18px 0'
                                }}
                            />
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </Box>
    );
}

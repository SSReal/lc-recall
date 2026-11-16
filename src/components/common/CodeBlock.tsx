import { useMemo } from 'react';
import { Box, Group, Badge, Button, CopyButton, Tooltip, useMantineColorScheme } from '@mantine/core';
import { highlightCode } from '../../lib/prism';

export interface CodeBlockProps {
    code: string;
    language?: string;
    maxHeight?: number | string;
    copyable?: boolean;
    showHeader?: boolean;
}

export function CodeBlock({
    code,
    language,
    maxHeight,
    copyable = true,
    showHeader = true
}: CodeBlockProps) {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    const cleanCode = useMemo(() => {
        return code ? code.trim() : '';
    }, [code]);

    const { html, displayName } = useMemo(() => {
        return highlightCode(cleanCode, language);
    }, [cleanCode, language]);

    if (!cleanCode) return null;

    return (
        <Box
            style={{
                borderRadius: 8,
                overflow: 'hidden',
                border: isDark ? '1px solid #16242c' : '1px solid #e1e4e8',
                background: isDark ? '#020909' : '#f6f8fa',
                margin: '12px 0'
            }}
        >
            {showHeader && (
                <Group
                    justify="space-between"
                    align="center"
                    px="sm"
                    py={6}
                    style={{
                        background: isDark ? '#071314' : '#edf2f7',
                        borderBottom: isDark ? '1px solid #16242c' : '1px solid #e2e8f0'
                    }}
                >
                    <Badge
                        size="xs"
                        variant="subtle"
                        color="ice"
                        style={{
                            fontWeight: 600,
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase',
                            fontSize: 11
                        }}
                    >
                        {displayName}
                    </Badge>

                    {copyable && (
                        <CopyButton value={cleanCode} timeout={2000}>
                            {({ copied, copy }) => (
                                <Tooltip label={copied ? 'Copied to clipboard' : 'Copy code'} withArrow position="left">
                                    <Button
                                        size="compact-xs"
                                        variant="subtle"
                                        color={copied ? 'teal' : 'gray'}
                                        onClick={copy}
                                        style={{
                                            fontSize: 11,
                                            height: 22,
                                            fontWeight: 500,
                                            color: copied ? undefined : (isDark ? '#7ea0b7' : '#597081')
                                        }}
                                    >
                                        {copied ? '✓ Copied' : 'Copy'}
                                    </Button>
                                </Tooltip>
                            )}
                        </CopyButton>
                    )}
                </Group>
            )}

            <Box
                style={{
                    maxHeight: maxHeight || undefined,
                    overflowY: maxHeight ? 'auto' : undefined,
                    overflowX: 'auto',
                    padding: '12px 14px'
                }}
            >
                <pre
                    style={{
                        margin: 0,
                        padding: 0,
                        background: 'transparent',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: 13.5,
                        lineHeight: 1.55,
                        color: isDark ? '#e0effb' : '#24292e',
                        whiteSpace: 'pre',
                        wordBreak: 'normal',
                        tabSize: 4
                    }}
                >
                    <code
                        className={`language-${language || 'auto'}`}
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                </pre>
            </Box>
        </Box>
    );
}

import { Group, Title, Button, Badge, ActionIcon, useMantineColorScheme, Tooltip, Box } from '@mantine/core';

interface HeaderProps {
    activeTab: 'review' | 'cards' | 'stats';
    onTabChange: (tab: 'review' | 'cards' | 'stats') => void;
    dueCount: number;
    totalCount: number;
    onAddCard: () => void;
    onOpenLLMImport: () => void;
    onOpenSettings: () => void;
}

export function Header({
    activeTab,
    onTabChange,
    dueCount,
    totalCount,
    onAddCard,
    onOpenLLMImport,
    onOpenSettings
}: HeaderProps) {
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    const getNavStyle = (tab: 'review' | 'cards' | 'stats') => {
        const isActive = activeTab === tab;
        return {
            background: isActive ? (isDark ? 'rgba(169, 206, 244, 0.14)' : '#e7f5ff') : 'transparent',
            color: isActive ? (isDark ? '#a9cef4' : '#1971c2') : (isDark ? '#7ea0b7' : '#475569'),
            fontWeight: isActive ? 600 : 500,
            border: isActive ? (isDark ? '1px solid rgba(169, 206, 244, 0.32)' : '1px solid #a5d8ff') : '1px solid transparent'
        };
    };

    return (
        <Box
            component="header"
            style={{
                borderBottom: isDark ? '1px solid #1a2932' : '1px solid #e2e8f0',
                padding: '12px 24px',
                background: isDark ? 'rgba(7, 19, 20, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}
        >
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
                <Group gap="sm" align="center">
                    <Box
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: isDark ? '#a9cef4' : '#1971c2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isDark ? '#040f0f' : '#ffffff',
                            fontWeight: 800,
                            fontSize: 15
                        }}
                    >
                        LC
                    </Box>
                    <div>
                        <Group gap="xs" align="center">
                            <Title order={3} style={{ letterSpacing: '-0.5px', margin: 0, fontSize: 18 }}>
                                LC Recall
                            </Title>
                            <Badge size="xs" variant="light" color="ice">
                                FSRS v7
                            </Badge>
                        </Group>
                        <span style={{ fontSize: 12, color: isDark ? '#7ea0b7' : '#64748b' }}>
                            Active Spaced Repetition for LeetCode
                        </span>
                    </div>
                </Group>

                <Group gap="xs">
                    <Button
                        variant="subtle"
                        size="sm"
                        style={getNavStyle('review')}
                        onClick={() => onTabChange('review')}
                        rightSection={
                            dueCount > 0 ? (
                                <Badge size="sm" color="rose" circle variant="filled">
                                    {dueCount}
                                </Badge>
                            ) : undefined
                        }
                    >
                        Review
                    </Button>

                    <Button
                        variant="subtle"
                        size="sm"
                        style={getNavStyle('cards')}
                        onClick={() => onTabChange('cards')}
                        rightSection={
                            <Badge size="sm" variant="light" color="ice">
                                {totalCount}
                            </Badge>
                        }
                    >
                        All Cards
                    </Button>

                    <Button
                        variant="subtle"
                        size="sm"
                        style={getNavStyle('stats')}
                        onClick={() => onTabChange('stats')}
                    >
                        Analytics
                    </Button>
                </Group>

                <Group gap="xs">
                    <Button
                        variant="light"
                        color={isDark ? 'ice' : 'blue'}
                        size="sm"
                        onClick={onOpenLLMImport}
                        leftSection={<span style={{ fontSize: 13 }}>✨</span>}
                        style={{
                            fontWeight: 600,
                            border: isDark ? '1px solid rgba(169, 206, 244, 0.35)' : '1px solid #c7e2f8'
                        }}
                    >
                        AI Prompt Import
                    </Button>

                    <Button
                        variant="filled"
                        size="sm"
                        onClick={onAddCard}
                        style={{
                            background: isDark ? '#a9cef4' : '#1971c2',
                            color: isDark ? '#040f0f' : '#ffffff',
                            fontWeight: 600,
                            border: 'none'
                        }}
                    >
                        + Add Card
                    </Button>

                    <Tooltip label="Import, Export & Settings" withArrow>
                        <ActionIcon
                            variant="default"
                            size="lg"
                            radius="md"
                            onClick={onOpenSettings}
                            aria-label="Settings"
                            style={{
                                background: isDark ? '#0d191a' : '#ffffff',
                                borderColor: isDark ? '#1e2f38' : '#e2e8f0',
                                color: isDark ? '#a9cef4' : '#334155'
                            }}
                        >
                            ⚙️
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label={isDark ? "Switch to light mode" : "Switch to dark mode"} withArrow>
                        <ActionIcon
                            variant="default"
                            size="lg"
                            radius="md"
                            onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
                            aria-label="Toggle color scheme"
                            style={{
                                background: isDark ? '#0d191a' : '#ffffff',
                                borderColor: isDark ? '#1e2f38' : '#e2e8f0',
                                color: isDark ? '#a9cef4' : '#334155'
                            }}
                        >
                            {isDark ? '☀️' : '🌙'}
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>
        </Box>
    );
}

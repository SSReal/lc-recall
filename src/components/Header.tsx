import { Group, Title, Button, Badge, ActionIcon, useMantineColorScheme, Tooltip, Box } from '@mantine/core';

interface HeaderProps {
    activeTab: 'review' | 'cards' | 'stats';
    onTabChange: (tab: 'review' | 'cards' | 'stats') => void;
    dueCount: number;
    totalCount: number;
    onAddCard: () => void;
    onOpenSettings: () => void;
}

export function Header({
    activeTab,
    onTabChange,
    dueCount,
    totalCount,
    onAddCard,
    onOpenSettings
}: HeaderProps) {
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    const getNavStyle = (tab: 'review' | 'cards' | 'stats') => {
        const isActive = activeTab === tab;
        return {
            background: isActive ? (isDark ? 'rgba(169, 206, 244, 0.14)' : '#e0effb') : 'transparent',
            color: isActive ? (isDark ? '#a9cef4' : '#2b587a') : (isDark ? '#7ea0b7' : '#597081'),
            fontWeight: isActive ? 600 : 500,
            border: isActive ? (isDark ? '1px solid rgba(169, 206, 244, 0.32)' : '1px solid #c7e2f8') : '1px solid transparent'
        };
    };

    return (
        <Box
            component="header"
            style={{
                borderBottom: isDark ? '1px solid #1a2932' : '1px solid var(--mantine-color-default-border)',
                padding: '12px 24px',
                background: isDark ? 'rgba(7, 19, 20, 0.9)' : 'rgba(255, 255, 255, 0.92)',
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
                            background: '#a9cef4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#040f0f',
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
                        <span style={{ fontSize: 12, color: isDark ? '#7ea0b7' : 'var(--mantine-color-dimmed)' }}>
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
                        variant="filled"
                        size="sm"
                        onClick={onAddCard}
                        style={{
                            background: '#a9cef4',
                            color: '#040f0f',
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
                                background: isDark ? '#0d191a' : undefined,
                                borderColor: isDark ? '#1e2f38' : undefined,
                                color: isDark ? '#a9cef4' : undefined
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
                                background: isDark ? '#0d191a' : undefined,
                                borderColor: isDark ? '#1e2f38' : undefined,
                                color: isDark ? '#a9cef4' : undefined
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

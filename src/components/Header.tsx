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

    return (
        <Box
            component="header"
            style={{
                borderBottom: '1px solid var(--mantine-color-default-border)',
                padding: '12px 24px',
                background: isDark ? 'var(--mantine-color-dark-7)' : 'white',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}
        >
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
                <Group gap="sm" align="center">
                    <Box
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #FFA116 0%, #FF6B00 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: 18,
                            boxShadow: '0 2px 8px rgba(255, 107, 0, 0.3)'
                        }}
                    >
                        LC
                    </Box>
                    <div>
                        <Group gap="xs" align="center">
                            <Title order={3} style={{ letterSpacing: '-0.5px', margin: 0 }}>
                                LC Recall
                            </Title>
                            <Badge size="xs" variant="light" color="orange">
                                FSRS v7
                            </Badge>
                        </Group>
                        <span style={{ fontSize: 12, color: 'var(--mantine-color-dimmed)' }}>
                            Active Spaced Repetition for LeetCode
                        </span>
                    </div>
                </Group>

                <Group gap="xs">
                    <Button
                        variant={activeTab === 'review' ? 'filled' : 'subtle'}
                        color="orange"
                        size="sm"
                        onClick={() => onTabChange('review')}
                        rightSection={
                            dueCount > 0 ? (
                                <Badge size="sm" color="red" circle variant="filled">
                                    {dueCount}
                                </Badge>
                            ) : undefined
                        }
                    >
                        Review
                    </Button>

                    <Button
                        variant={activeTab === 'cards' ? 'filled' : 'subtle'}
                        color="gray"
                        size="sm"
                        onClick={() => onTabChange('cards')}
                        rightSection={
                            <Badge size="sm" variant="light" color="gray">
                                {totalCount}
                            </Badge>
                        }
                    >
                        All Cards
                    </Button>

                    <Button
                        variant={activeTab === 'stats' ? 'filled' : 'subtle'}
                        color="gray"
                        size="sm"
                        onClick={() => onTabChange('stats')}
                    >
                        Analytics
                    </Button>
                </Group>

                <Group gap="xs">
                    <Button
                        variant="gradient"
                        gradient={{ from: 'orange', to: 'yellow', deg: 90 }}
                        size="sm"
                        onClick={onAddCard}
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
                        >
                            {isDark ? '☀️' : '🌙'}
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>
        </Box>
    );
}

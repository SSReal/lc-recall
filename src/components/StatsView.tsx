import { useMemo, useState } from 'react';
import {
    Paper,
    Title,
    Text,
    SimpleGrid,
    Group,
    Badge,
    Box,
    Progress,
    Stack,
    useMantineColorScheme
} from '@mantine/core';
import type { Flashcard } from '../../types/flashcard';

interface StatsViewProps {
    cards: Flashcard[];
}

export function StatsView({ cards }: StatsViewProps) {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';
    const [now] = useState(() => Date.now());

    const stats = useMemo(() => {
        const total = cards.length;
        let dueNow = 0;
        let totalReps = 0;
        let totalStability = 0;
        let newCount = 0;
        let learningCount = 0;
        let reviewCount = 0;

        const difficultyCount = { Easy: 0, Medium: 0, Hard: 0, Unspecified: 0 };
        const tagMap: Record<string, number> = {};

        cards.forEach((c) => {
            const dueTime = c.fsrs.dueAt instanceof Date
                ? c.fsrs.dueAt.getTime()
                : new Date(c.fsrs.dueAt).getTime();
            if (dueTime <= now) dueNow++;

            totalReps += c.fsrs.reps || 0;
            totalStability += c.fsrs.stability || 0;

            if (c.fsrs.reps === 0) newCount++;
            else if (c.fsrs.reps < 3) learningCount++;
            else reviewCount++;

            if (c.difficulty) difficultyCount[c.difficulty]++;
            else difficultyCount.Unspecified++;

            c.tags?.forEach((t) => {
                tagMap[t] = (tagMap[t] || 0) + 1;
            });
        });

        const sortedTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]);
        const avgStability = total > 0 ? (totalStability / total).toFixed(1) : '0';

        return {
            total,
            dueNow,
            totalReps,
            avgStability,
            newCount,
            learningCount,
            reviewCount,
            difficultyCount,
            topTags: sortedTags.slice(0, 8)
        };
    }, [cards, now]);

    const retentionPct = stats.total > 0
        ? Math.round((stats.reviewCount / stats.total) * 100)
        : 0;

    const paperStyle = {
        background: isDark ? 'var(--mantine-color-dark-6)' : '#ffffff',
        borderColor: isDark ? 'var(--mantine-color-dark-4)' : '#e2e8f0',
        boxShadow: isDark ? undefined : '0 1px 3px rgba(0, 0, 0, 0.04)'
    };

    return (
        <Box style={{ maxWidth: 900, margin: '24px auto' }}>
            <Title order={2} mb="lg" style={{ fontWeight: 700 }}>
                FSRS Memory & Progress Analytics
            </Title>

            {/* Overview Stats */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="lg">
                <Paper p="md" radius="lg" withBorder style={paperStyle}>
                    <Text size="xs" c={isDark ? 'dimmed' : '#64748b'} tt="uppercase" fw={700}>
                        Total Cards
                    </Text>
                    <Title order={2} mt={4}>
                        {stats.total}
                    </Title>
                    <Text size="xs" c={isDark ? 'dimmed' : '#64748b'} mt={4}>
                        Across all topics
                    </Text>
                </Paper>

                <Paper p="md" radius="lg" withBorder style={paperStyle}>
                    <Text size="xs" c={isDark ? 'dimmed' : '#64748b'} tt="uppercase" fw={700}>
                        Due Today
                    </Text>
                    <Title order={2} mt={4} c={stats.dueNow > 0 ? (isDark ? 'red' : '#e03131') : (isDark ? 'teal' : '#099268')}>
                        {stats.dueNow}
                    </Title>
                    <Text size="xs" c={isDark ? 'dimmed' : '#64748b'} mt={4}>
                        {stats.dueNow > 0 ? 'Ready for review' : 'All caught up!'}
                    </Text>
                </Paper>

                <Paper p="md" radius="lg" withBorder style={paperStyle}>
                    <Text size="xs" c={isDark ? 'dimmed' : '#64748b'} tt="uppercase" fw={700}>
                        Total Reviews
                    </Text>
                    <Title order={2} mt={4} c={isDark ? '#a9cef4' : '#1971c2'}>
                        {stats.totalReps}
                    </Title>
                    <Text size="xs" c={isDark ? 'dimmed' : '#64748b'} mt={4}>
                        Completed reps
                    </Text>
                </Paper>

                <Paper p="md" radius="lg" withBorder style={paperStyle}>
                    <Text size="xs" c={isDark ? 'dimmed' : '#64748b'} tt="uppercase" fw={700}>
                        Avg Memory Stability
                    </Text>
                    <Title order={2} mt={4} c={isDark ? 'blue' : '#1864ab'}>
                        {stats.avgStability}d
                    </Title>
                    <Text size="xs" c={isDark ? 'dimmed' : '#64748b'} mt={4}>
                        FSRS memory half-life
                    </Text>
                </Paper>
            </SimpleGrid>

            {/* Memory Stage & Difficulty Breakdown */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="lg">
                <Paper p="lg" radius="lg" withBorder style={paperStyle}>
                    <Title order={4} mb="md">
                        Learning Progression
                    </Title>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm">Mastery / Retention</Text>
                        <Text size="sm" fw={700}>{retentionPct}%</Text>
                    </Group>
                    <Progress value={retentionPct} color="teal" size="lg" radius="xl" mb="lg" />

                    <Stack gap="sm">
                        <Group justify="space-between">
                            <Group gap="xs">
                                <Badge size="xs" color="gray" circle />
                                <Text size="sm">New (0 reviews)</Text>
                            </Group>
                            <Text size="sm" fw={600}>{stats.newCount}</Text>
                        </Group>

                        <Group justify="space-between">
                            <Group gap="xs">
                                <Badge size="xs" color={isDark ? 'ice' : 'blue'} circle />
                                <Text size="sm">Learning (1-2 reviews)</Text>
                            </Group>
                            <Text size="sm" fw={600}>{stats.learningCount}</Text>
                        </Group>

                        <Group justify="space-between">
                            <Group gap="xs">
                                <Badge size="xs" color="teal" circle />
                                <Text size="sm">Mastered (3+ reviews)</Text>
                            </Group>
                            <Text size="sm" fw={600}>{stats.reviewCount}</Text>
                        </Group>
                    </Stack>
                </Paper>

                <Paper p="lg" radius="lg" withBorder style={paperStyle}>
                    <Title order={4} mb="md">
                        Difficulty Breakdown
                    </Title>
                    <Stack gap="md">
                        <div>
                            <Group justify="space-between" mb={4}>
                                <Text size="sm" c={isDark ? 'teal' : '#099268'} fw={600}>Easy</Text>
                                <Text size="sm">{stats.difficultyCount.Easy}</Text>
                            </Group>
                            <Progress
                                value={stats.total ? (stats.difficultyCount.Easy / stats.total) * 100 : 0}
                                color="teal"
                                size="sm"
                            />
                        </div>

                        <div>
                            <Group justify="space-between" mb={4}>
                                <Text size="sm" c={isDark ? '#a9cef4' : '#1971c2'} fw={600}>Medium</Text>
                                <Text size="sm">{stats.difficultyCount.Medium}</Text>
                            </Group>
                            <Progress
                                value={stats.total ? (stats.difficultyCount.Medium / stats.total) * 100 : 0}
                                color={isDark ? 'ice' : 'blue'}
                                size="sm"
                            />
                        </div>

                        <div>
                            <Group justify="space-between" mb={4}>
                                <Text size="sm" c={isDark ? 'rose' : '#e03131'} fw={600}>Hard</Text>
                                <Text size="sm">{stats.difficultyCount.Hard}</Text>
                            </Group>
                            <Progress
                                value={stats.total ? (stats.difficultyCount.Hard / stats.total) * 100 : 0}
                                color={isDark ? 'rose' : 'red'}
                                size="sm"
                            />
                        </div>
                    </Stack>
                </Paper>
            </SimpleGrid>

            {/* Top Topics / Patterns */}
            {stats.topTags.length > 0 && (
                <Paper p="lg" radius="lg" withBorder style={paperStyle}>
                    <Title order={4} mb="md">
                        Top Algorithm Patterns & Tags
                    </Title>
                    <Group gap="sm">
                        {stats.topTags.map(([tag, count]) => (
                            <Badge
                                key={tag}
                                size="lg"
                                variant="light"
                                color={isDark ? 'ice' : 'blue'}
                                style={{ textTransform: 'none' }}
                            >
                                {tag} ({count})
                            </Badge>
                        ))}
                    </Group>
                </Paper>
            )}
        </Box>
    );
}

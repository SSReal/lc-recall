import { useState, useMemo } from 'react';
import {
    TextInput,
    Select,
    Table,
    Badge,
    Group,
    ActionIcon,
    Text,
    Paper,
    Button,
    Box,
    Anchor,
    Tooltip,
    Pagination,
    useMantineColorScheme
} from '@mantine/core';
import type { Flashcard, ProblemDifficulty } from '../../types/flashcard';
import { formatInterval } from '../../lib/fsrs';

interface CardListProps {
    cards: Flashcard[];
    onEditCard: (card: Flashcard) => void;
    onDeleteCard: (id: string) => void;
    onAddCard: () => void;
}

export function CardList({ cards, onEditCard, onDeleteCard, onAddCard }: CardListProps) {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';
    const [search, setSearch] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedTag, setSelectedTag] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [now] = useState(() => Date.now());
    const pageSize = 10;

    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        cards.forEach(c => c.tags?.forEach(t => tagSet.add(t)));
        return Array.from(tagSet).sort();
    }, [cards]);

    const filteredCards = useMemo(() => {
        return cards.filter(card => {
            const matchesSearch =
                search === '' ||
                card.title?.toLowerCase().includes(search.toLowerCase()) ||
                card.question.toLowerCase().includes(search.toLowerCase()) ||
                card.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));

            const matchesDifficulty =
                difficultyFilter === 'all' || card.difficulty === difficultyFilter;

            const matchesTag =
                selectedTag === 'all' || (card.tags && card.tags.includes(selectedTag));

            const dueTime = card.fsrs.dueAt instanceof Date
                ? card.fsrs.dueAt.getTime()
                : new Date(card.fsrs.dueAt).getTime();
            const isDue = dueTime <= now;

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'due' && isDue) ||
                (statusFilter === 'new' && card.fsrs.reps === 0) ||
                (statusFilter === 'learning' && card.fsrs.reps > 0 && card.fsrs.reps < 3) ||
                (statusFilter === 'review' && card.fsrs.reps >= 3);

            return matchesSearch && matchesDifficulty && matchesTag && matchesStatus;
        });
    }, [cards, search, difficultyFilter, selectedTag, statusFilter, now]);

    const totalPages = Math.ceil(filteredCards.length / pageSize) || 1;
    const paginatedCards = filteredCards.slice((page - 1) * pageSize, page * pageSize);

    const getDifficultyColor = (diff?: ProblemDifficulty) => {
        switch (diff) {
            case 'Easy': return 'teal';
            case 'Medium': return 'ice';
            case 'Hard': return 'rose';
            default: return 'gray';
        }
    };

    return (
        <Box style={{ maxWidth: 1000, margin: '24px auto' }}>
            <Group justify="space-between" mb="md" wrap="wrap">
                <Text size="xl" fw={700}>
                    Problem Deck ({cards.length})
                </Text>
                <Button
                    onClick={onAddCard}
                    style={{ background: '#a9cef4', color: '#040f0f', fontWeight: 600, border: 'none' }}
                >
                    + Add Flashcard
                </Button>
            </Group>

            {/* Filter Bar */}
            <Paper
                p="md"
                radius="lg"
                withBorder
                mb="lg"
                style={{
                    background: isDark ? 'var(--mantine-color-dark-6)' : 'white',
                    borderColor: isDark ? 'var(--mantine-color-dark-4)' : undefined
                }}
            >
                <Group gap="sm" wrap="wrap">
                    <TextInput
                        placeholder="Search by title, question or tag..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.currentTarget.value);
                            setPage(1);
                        }}
                        style={{ flex: 1, minWidth: 220 }}
                    />

                    <Select
                        placeholder="Difficulty"
                        value={difficultyFilter}
                        onChange={(val) => {
                            setDifficultyFilter(val || 'all');
                            setPage(1);
                        }}
                        data={[
                            { label: 'All Difficulties', value: 'all' },
                            { label: 'Easy', value: 'Easy' },
                            { label: 'Medium', value: 'Medium' },
                            { label: 'Hard', value: 'Hard' }
                        ]}
                        style={{ width: 150 }}
                    />

                    <Select
                        placeholder="Status"
                        value={statusFilter}
                        onChange={(val) => {
                            setStatusFilter(val || 'all');
                            setPage(1);
                        }}
                        data={[
                            { label: 'All Statuses', value: 'all' },
                            { label: 'Due Now', value: 'due' },
                            { label: 'New', value: 'new' },
                            { label: 'Learning', value: 'learning' },
                            { label: 'Mastered', value: 'review' }
                        ]}
                        style={{ width: 140 }}
                    />

                    {allTags.length > 0 && (
                        <Select
                            placeholder="Search & filter tag..."
                            searchable
                            clearable
                            nothingFoundMessage="No tags found"
                            value={selectedTag === 'all' ? null : selectedTag}
                            onChange={(val) => {
                                setSelectedTag(val || 'all');
                                setPage(1);
                            }}
                            data={allTags.map(t => ({ label: t, value: t }))}
                            style={{ minWidth: 190 }}
                        />
                    )}
                </Group>
            </Paper>

            {/* Cards Table */}
            {filteredCards.length === 0 ? (
                <Paper
                    p="xl"
                    radius="lg"
                    withBorder
                    ta="center"
                    style={{
                        background: isDark ? 'var(--mantine-color-dark-6)' : 'white',
                        borderColor: isDark ? 'var(--mantine-color-dark-4)' : undefined
                    }}
                >
                    <Text c="dimmed">No flashcards found matching your filters.</Text>
                </Paper>
            ) : (
                <Paper
                    radius="lg"
                    withBorder
                    style={{
                        overflowX: 'auto',
                        background: isDark ? 'var(--mantine-color-dark-6)' : 'white',
                        borderColor: isDark ? 'var(--mantine-color-dark-4)' : undefined
                    }}
                >
                    <Table highlightOnHover verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Problem</Table.Th>
                                <Table.Th>Difficulty</Table.Th>
                                <Table.Th>Tags</Table.Th>
                                <Table.Th>Due / Status</Table.Th>
                                <Table.Th>Reps</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {paginatedCards.map((card) => {
                                const dueAt = card.fsrs.dueAt instanceof Date
                                    ? card.fsrs.dueAt
                                    : new Date(card.fsrs.dueAt);
                                const isDue = dueAt.getTime() <= now;

                                return (
                                    <Table.Tr key={card.id}>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Text fw={600} size="sm">
                                                    {card.title || card.question.slice(0, 30)}
                                                </Text>
                                                {card.url && (
                                                    <Anchor
                                                        href={card.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        size="xs"
                                                        c="dimmed"
                                                    >
                                                        ↗
                                                    </Anchor>
                                                )}
                                            </Group>
                                            <Text size="xs" c="dimmed" lineClamp={1}>
                                                {card.question}
                                            </Text>
                                        </Table.Td>

                                        <Table.Td>
                                            {card.difficulty && (
                                                <Badge
                                                    size="sm"
                                                    variant="light"
                                                    color={getDifficultyColor(card.difficulty)}
                                                >
                                                    {card.difficulty}
                                                </Badge>
                                            )}
                                        </Table.Td>

                                        <Table.Td>
                                            <Group gap={4}>
                                                {card.tags?.slice(0, 3).map((tag) => (
                                                    <Badge key={tag} size="xs" variant="outline" color="gray">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {(card.tags?.length || 0) > 3 && (
                                                    <Text size="xs" c="dimmed">
                                                        +{card.tags!.length - 3}
                                                    </Text>
                                                )}
                                            </Group>
                                        </Table.Td>

                                        <Table.Td>
                                            {isDue ? (
                                                <Badge size="sm" color="rose" variant="filled">
                                                    Due Now
                                                </Badge>
                                            ) : (
                                                <Badge size="sm" color="ice" variant="light">
                                                    in {formatInterval(dueAt)}
                                                </Badge>
                                            )}
                                        </Table.Td>

                                        <Table.Td>
                                            <Text size="sm">{card.fsrs.reps || 0}</Text>
                                        </Table.Td>

                                        <Table.Td style={{ textAlign: 'right' }}>
                                            <Group justify="flex-end" gap="xs">
                                                <Tooltip label="Edit Card">
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="gray"
                                                        onClick={() => onEditCard(card)}
                                                    >
                                                        ✏️
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="Delete Card">
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="red"
                                                        onClick={() => {
                                                            if (confirm(`Delete "${card.title || 'this card'}"?`)) {
                                                                onDeleteCard(card.id);
                                                            }
                                                        }}
                                                    >
                                                        🗑️
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Paper>
            )}

            {totalPages > 1 && (
                <Group justify="center" mt="lg">
                    <Pagination total={totalPages} value={page} onChange={setPage} color="ice" />
                </Group>
            )}
        </Box>
    );
}

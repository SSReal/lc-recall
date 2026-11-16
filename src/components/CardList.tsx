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
    Modal,
    Stack,
    useMantineColorScheme
} from '@mantine/core';
import type { Flashcard, ProblemDifficulty } from '../../types/flashcard';
import { formatInterval } from '../../lib/fsrs';
import { MarkdownRenderer } from './common/MarkdownRenderer';
import { CodeBlock } from './common/CodeBlock';
import { IconPencil, IconTrash, IconExternalLink } from '@tabler/icons-react';

interface CardListProps {
    cards: Flashcard[];
    onEditCard: (card: Flashcard) => void;
    onDeleteCard: (id: string) => void;
    onAddCard: () => void;
    onOpenLLMImport?: () => void;
}

export function CardList({ cards, onEditCard, onDeleteCard, onAddCard, onOpenLLMImport }: CardListProps) {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';
    const [search, setSearch] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedTag, setSelectedTag] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [viewingCard, setViewingCard] = useState<Flashcard | null>(null);
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
            case 'Medium': return isDark ? 'ice' : 'blue';
            case 'Hard': return isDark ? 'rose' : 'red';
            default: return 'gray';
        }
    };

    return (
        <Box style={{ maxWidth: 1000, margin: '24px auto' }}>
            <Group justify="space-between" mb="md" wrap="wrap">
                <Text size="xl" fw={700}>
                    Problem Deck ({cards.length})
                </Text>
                <Group gap="xs">
                    {onOpenLLMImport && (
                        <Button
                            variant="light"
                            color={isDark ? 'ice' : 'blue'}
                            size="sm"
                            onClick={onOpenLLMImport}
                            leftSection={<span style={{ fontSize: 13 }}>✨</span>}
                            style={{ fontWeight: 600 }}
                        >
                            AI Import
                        </Button>
                    )}
                    <Button
                        onClick={onAddCard}
                        style={{ background: isDark ? '#a9cef4' : '#1971c2', color: isDark ? '#040f0f' : '#ffffff', fontWeight: 600, border: 'none' }}
                    >
                        + Add Flashcard
                    </Button>
                </Group>
            </Group>

            {/* Filter Bar */}
            <Paper
                p="md"
                radius="lg"
                withBorder
                mb="lg"
                style={{
                    background: isDark ? 'var(--mantine-color-dark-6)' : '#ffffff',
                    borderColor: isDark ? 'var(--mantine-color-dark-4)' : '#e2e8f0',
                    boxShadow: isDark ? undefined : '0 1px 3px rgba(0, 0, 0, 0.04)'
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
                        background: isDark ? 'var(--mantine-color-dark-6)' : '#ffffff',
                        borderColor: isDark ? 'var(--mantine-color-dark-4)' : '#e2e8f0',
                        boxShadow: isDark ? undefined : '0 1px 3px rgba(0, 0, 0, 0.04)'
                    }}
                >
                    <Text c={isDark ? 'dimmed' : '#64748b'}>No flashcards found matching your filters.</Text>
                </Paper>
            ) : (
                <Paper
                    radius="lg"
                    withBorder
                    style={{
                        overflowX: 'auto',
                        background: isDark ? 'var(--mantine-color-dark-6)' : '#ffffff',
                        borderColor: isDark ? 'var(--mantine-color-dark-4)' : '#e2e8f0',
                        boxShadow: isDark ? undefined : '0 1px 3px rgba(0, 0, 0, 0.04)'
                    }}
                >
                    <Table highlightOnHover verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Problem</Table.Th>
                                <Table.Th>Difficulty</Table.Th>
                                <Table.Th>Tags</Table.Th>
                                <Table.Th style={{ minWidth: 125 }}>Due / Status</Table.Th>
                                <Table.Th>Reps</Table.Th>
                                <Table.Th style={{ textAlign: 'right', width: 90, minWidth: 90 }}>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {paginatedCards.map((card) => {
                                const dueAt = card.fsrs.dueAt instanceof Date
                                    ? card.fsrs.dueAt
                                    : new Date(card.fsrs.dueAt);
                                const isDue = dueAt.getTime() <= now;

                                return (
                                    <Table.Tr
                                        key={card.id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setViewingCard(card)}
                                    >
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
                                                        c={isDark ? "dimmed" : "#1971c2"}
                                                        style={{ display: 'inline-flex', alignItems: 'center' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <IconExternalLink size={12} />
                                                    </Anchor>
                                                )}
                                            </Group>
                                            <Text size="xs" c={isDark ? "dimmed" : "#334155"} lineClamp={1}>
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
                                                    <Badge
                                                        key={tag}
                                                        size="xs"
                                                        variant="outline"
                                                        color={isDark ? "gray" : "blue"}
                                                        style={{
                                                            borderColor: isDark ? undefined : '#cbd5e1',
                                                            color: isDark ? undefined : '#0f172a',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {(card.tags?.length || 0) > 3 && (
                                                    <Text size="xs" c={isDark ? "dimmed" : "#334155"} fw={600}>
                                                        +{card.tags!.length - 3}
                                                    </Text>
                                                )}
                                            </Group>
                                        </Table.Td>

                                        <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                            {isDue ? (
                                                <Badge
                                                    size="sm"
                                                    color={isDark ? 'rose' : 'red'}
                                                    variant="filled"
                                                    styles={{ label: { overflow: 'visible' } }}
                                                >
                                                    Due Now
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    size="sm"
                                                    color={isDark ? 'ice' : 'blue'}
                                                    variant="light"
                                                    styles={{ label: { overflow: 'visible' } }}
                                                >
                                                    in {formatInterval(dueAt)}
                                                </Badge>
                                            )}
                                        </Table.Td>

                                        <Table.Td>
                                            <Text size="sm" fw={600} c={isDark ? undefined : '#0f172a'}>{card.fsrs.reps || 0}</Text>
                                        </Table.Td>

                                        <Table.Td style={{ textAlign: 'right', width: 90, minWidth: 90, whiteSpace: 'nowrap' }}>
                                            <Group justify="flex-end" gap={4} wrap="nowrap" align="center" style={{ display: 'inline-flex' }}>
                                                <Tooltip label="Edit Card" withArrow>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="gray"
                                                        size="sm"
                                                        radius="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEditCard(card);
                                                        }}
                                                        aria-label="Edit Card"
                                                    >
                                                        <IconPencil size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="Delete Card" withArrow>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="red"
                                                        size="sm"
                                                        radius="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm(`Delete "${card.title || 'this card'}"?`)) {
                                                                onDeleteCard(card.id);
                                                            }
                                                        }}
                                                        aria-label="Delete Card"
                                                    >
                                                        <IconTrash size={16} />
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
                    <Pagination total={totalPages} value={page} onChange={setPage} color={isDark ? 'ice' : 'blue'} />
                </Group>
            )}

            {/* View Card Detail Modal with Markdown and Syntax Highlighting */}
            <Modal
                opened={Boolean(viewingCard)}
                onClose={() => setViewingCard(null)}
                title={viewingCard?.title || 'Flashcard Details'}
                size="lg"
                centered
                styles={{
                    content: {
                        backgroundColor: isDark ? '#071314' : '#ffffff'
                    }
                }}
            >
                {viewingCard && (
                    <Stack gap="md">
                        <Group justify="space-between" align="center" wrap="wrap">
                            <Group gap="xs">
                                {viewingCard.difficulty && (
                                    <Badge size="sm" variant="light" color={getDifficultyColor(viewingCard.difficulty)}>
                                        {viewingCard.difficulty}
                                    </Badge>
                                )}
                                {viewingCard.tags?.map((tag) => (
                                    <Badge
                                        key={tag}
                                        size="xs"
                                        variant="outline"
                                        color={isDark ? "gray" : "blue"}
                                        style={{
                                            borderColor: isDark ? undefined : '#cbd5e1',
                                            color: isDark ? undefined : '#0f172a',
                                            fontWeight: 500
                                        }}
                                    >
                                        #{tag}
                                    </Badge>
                                ))}
                            </Group>
                            {viewingCard.url && (
                                <Anchor
                                    href={viewingCard.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="sm"
                                    c={isDark ? '#a9cef4' : '#1971c2'}
                                    style={{ fontWeight: 600 }}
                                >
                                    Open in LeetCode ↗
                                </Anchor>
                            )}
                        </Group>

                        {/* Problem Description */}
                        <Box
                            p="md"
                            style={{
                                borderRadius: 8,
                                background: isDark ? '#061213' : '#f8fafc',
                                border: isDark ? '1px solid #162329' : '1px solid #cbd5e1'
                            }}
                        >
                            <Text size="xs" fw={700} c={isDark ? '#7ea0b7' : '#0f172a'} tt="uppercase" mb={6} style={{ letterSpacing: '0.5px' }}>
                                Problem Description
                            </Text>
                            <MarkdownRenderer content={viewingCard.question} />
                        </Box>

                        {/* Intuition & Solution */}
                        <Box
                            p="md"
                            style={{
                                borderRadius: 8,
                                borderLeft: isDark ? '4px solid #a9cef4' : '4px solid #1971c2',
                                background: isDark ? '#081414' : '#f8fafc',
                                borderTop: isDark ? '1px solid #162329' : '1px solid #cbd5e1',
                                borderRight: isDark ? '1px solid #162329' : '1px solid #cbd5e1',
                                borderBottom: isDark ? '1px solid #162329' : '1px solid #cbd5e1'
                            }}
                        >
                            <Text size="xs" fw={700} c={isDark ? '#a9cef4' : '#1971c2'} tt="uppercase" mb={6} style={{ letterSpacing: '0.5px' }}>
                                Intuition & Approach
                            </Text>
                            <MarkdownRenderer content={viewingCard.answer} />
                        </Box>

                        {/* Complexity Badges */}
                        {(viewingCard.timeComplexity || viewingCard.spaceComplexity) && (
                            <Group gap="sm">
                                {viewingCard.timeComplexity && (
                                    <Badge size="md" variant="light" color={isDark ? 'ice' : 'blue'}>
                                        Time: {viewingCard.timeComplexity}
                                    </Badge>
                                )}
                                {viewingCard.spaceComplexity && (
                                    <Badge
                                        size="md"
                                        variant="light"
                                        color="gray"
                                        style={{
                                            color: isDark ? '#7ea0b7' : '#0f172a',
                                            background: isDark ? undefined : '#e2e8f0',
                                            fontWeight: 600
                                        }}
                                    >
                                        Space: {viewingCard.spaceComplexity}
                                    </Badge>
                                )}
                            </Group>
                        )}

                        {/* Code Snippet */}
                        {viewingCard.codeSnippet && (
                            <div>
                                <Text size="xs" fw={700} c={isDark ? '#7ea0b7' : '#0f172a'} tt="uppercase" mb={6} style={{ letterSpacing: '0.5px' }}>
                                    Optimal Implementation
                                </Text>
                                <CodeBlock code={viewingCard.codeSnippet} maxHeight={300} />
                            </div>
                        )}

                        <Group justify="flex-end" mt="sm">
                            <Button
                                variant="default"
                                onClick={() => setViewingCard(null)}
                            >
                                Close
                            </Button>
                            <Button
                                leftSection={<IconPencil size={15} />}
                                style={{ background: isDark ? '#a9cef4' : '#1971c2', color: isDark ? '#040f0f' : '#ffffff', fontWeight: 600, border: 'none' }}
                                onClick={() => {
                                    const cardToEdit = viewingCard;
                                    setViewingCard(null);
                                    onEditCard(cardToEdit);
                                }}
                            >
                                Edit Card
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Box>
    );
}

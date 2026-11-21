import { useState, useEffect, useCallback } from 'react';
import {
    Paper,
    Title,
    Text,
    Badge,
    Button,
    Group,
    Stack,
    Progress,
    Box,
    Anchor,
    SimpleGrid,
    Card,
    ActionIcon,
    Tooltip,
    useMantineColorScheme
} from '@mantine/core';
import { IconArrowsShuffle } from '@tabler/icons-react';
import type { Flashcard } from '../../types/flashcard';
import { Rating, reviewFSRSCard, getNextIntervalEstimates } from '../../lib/fsrs';
import { distributeAndShuffleCards } from '../../lib/shuffle';
import type { Grade } from 'ts-fsrs';
import { MarkdownRenderer } from './common/MarkdownRenderer';
import { CodeBlock } from './common/CodeBlock';

interface ReviewSessionProps {
    allCards: Flashcard[];
    onUpdateCard: (updatedCard: Flashcard) => void;
    onBrowseCards: () => void;
}

function sortByDueTime(cards: Flashcard[]): Flashcard[] {
    return [...cards].sort((a, b) => {
        const timeA = a.fsrs.dueAt instanceof Date ? a.fsrs.dueAt.getTime() : new Date(a.fsrs.dueAt).getTime();
        const timeB = b.fsrs.dueAt instanceof Date ? b.fsrs.dueAt.getTime() : new Date(b.fsrs.dueAt).getTime();
        return timeA - timeB;
    });
}

function prepareQueue(cards: Flashcard[], shouldShuffle: boolean): Flashcard[] {
    return shouldShuffle ? distributeAndShuffleCards(cards) : sortByDueTime(cards);
}

export function ReviewSession({ allCards, onUpdateCard, onBrowseCards }: ReviewSessionProps) {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';
    const [currentTime] = useState(() => Date.now());
    const [shuffleEnabled, setShuffleEnabled] = useState(() => {
        const stored = localStorage.getItem('lc_recall_shuffle_enabled');
        return stored === null ? true : stored === 'true';
    });

    // Cards due for review (dueAt <= currentTime or new cards)
    const [queue, setQueue] = useState<Flashcard[]>(() => {
        const dueCards = allCards.filter(card => {
            const dueTime = card.fsrs.dueAt instanceof Date
                ? card.fsrs.dueAt.getTime()
                : new Date(card.fsrs.dueAt).getTime();
            return dueTime <= currentTime;
        });
        const stored = localStorage.getItem('lc_recall_shuffle_enabled');
        const shouldShuffle = stored === null ? true : stored === 'true';
        return prepareQueue(dueCards, shouldShuffle);
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [revealedCardId, setRevealedCardId] = useState<string | null>(null);
    const [reviewedCount, setReviewedCount] = useState(0);
    const [intervals, setIntervals] = useState<Record<Grade, string>>({
        1: '',
        2: '',
        3: '',
        4: ''
    });

    const handleReshuffleRemaining = useCallback(() => {
        if (currentIndex >= queue.length - 1) return;
        const reviewed = queue.slice(0, currentIndex);
        const remaining = queue.slice(currentIndex);
        const reshuffledRemaining = distributeAndShuffleCards(remaining);
        setQueue([...reviewed, ...reshuffledRemaining]);
        setRevealedCardId(null);
    }, [currentIndex, queue]);

    const handleToggleShuffle = useCallback(() => {
        const next = !shuffleEnabled;
        setShuffleEnabled(next);
        localStorage.setItem('lc_recall_shuffle_enabled', String(next));
        if (currentIndex < queue.length) {
            const reviewed = queue.slice(0, currentIndex);
            const remaining = queue.slice(currentIndex);
            const reordered = prepareQueue(remaining, next);
            setQueue([...reviewed, ...reordered]);
            setRevealedCardId(null);
        }
    }, [shuffleEnabled, currentIndex, queue]);

    const handleStartCramMode = useCallback(() => {
        const prepared = prepareQueue(allCards, shuffleEnabled);
        setQueue(prepared);
        setCurrentIndex(0);
        setReviewedCount(0);
        setRevealedCardId(null);
    }, [allCards, shuffleEnabled]);

    const currentCard = queue[currentIndex];
    const isAnswerRevealed = Boolean(currentCard && revealedCardId === currentCard.id);

    // Compute interval previews whenever currentCard changes
    useEffect(() => {
        if (!currentCard) return;
        let isMounted = true;
        getNextIntervalEstimates(currentCard.fsrs).then(res => {
            if (isMounted) setIntervals(res);
        });
        return () => {
            isMounted = false;
        };
    }, [currentCard]);

    const handleRating = useCallback(async (grade: Grade) => {
        if (!currentCard) return;

        try {
            const updatedFsrs = await reviewFSRSCard(currentCard.fsrs, grade);
            const updatedCard: Flashcard = {
                ...currentCard,
                fsrs: updatedFsrs
            };

            onUpdateCard(updatedCard);
            setReviewedCount(prev => prev + 1);

            // If 'Again', re-insert at end of queue for practice
            if (grade === Rating.Again) {
                setQueue(prev => [...prev, updatedCard]);
            }
        } catch (err) {
            console.error("Error rating flashcard:", err);
        } finally {
            setRevealedCardId(null);
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentCard, onUpdateCard]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                if (currentCard) {
                    setRevealedCardId(prev => (prev === currentCard.id ? null : currentCard.id));
                }
            } else if (isAnswerRevealed) {
                if (e.key === '1') handleRating(1);
                else if (e.key === '2') handleRating(2);
                else if (e.key === '3') handleRating(3);
                else if (e.key === '4') handleRating(4);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentCard, isAnswerRevealed, handleRating]);

    // Empty state: No cards due or session finished
    if (!currentCard || currentIndex >= queue.length) {
        return (
            <Paper
                p="xl"
                radius="lg"
                withBorder
                style={{
                    maxWidth: 650,
                    margin: '40px auto',
                    textAlign: 'center',
                    background: isDark ? '#0d191a' : '#ffffff',
                    borderColor: isDark ? '#1e2f38' : '#e2e8f0',
                    boxShadow: isDark ? '0 8px 32px rgba(4, 15, 15, 0.6)' : '0 4px 20px rgba(0, 0, 0, 0.05)'
                }}
            >
                <Box style={{ fontSize: 56, marginBottom: 16 }}>🎉</Box>
                <Title order={2} mb="xs">
                    {reviewedCount > 0 ? "Review Session Complete!" : "All Caught Up!"}
                </Title>
                <Text c={isDark ? "dimmed" : "#334155"} fw={500} mb="lg">
                    {reviewedCount > 0
                        ? `Great work! You reviewed ${reviewedCount} card${reviewedCount > 1 ? 's' : ''} in this session.`
                        : "There are no flashcards due for review right now."}
                </Text>

                <Group justify="center" gap="sm">
                    {allCards.length > 0 && (
                        <Button
                            variant="light"
                            color="ice"
                            onClick={handleStartCramMode}
                            leftSection={<IconArrowsShuffle size={16} />}
                            style={{ fontWeight: 500 }}
                        >
                            Cram Mode ({shuffleEnabled ? 'Shuffled' : 'Due Order'})
                        </Button>
                    )}
                    <Button variant="default" onClick={onBrowseCards}>
                        Browse All Cards
                    </Button>
                </Group>
            </Paper>
        );
    }

    const progressValue = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

    const difficultyColor =
        currentCard.difficulty === 'Easy'
            ? 'teal'
            : currentCard.difficulty === 'Hard'
                ? 'rose'
                : 'ice';

    return (
        <Box style={{ maxWidth: 780, margin: '24px auto' }}>
            {/* Session Progress Header */}
            <Group justify="space-between" align="center" mb="xs">
                <Group gap="xs" align="center">
                    <Text size="sm" c={isDark ? 'dimmed' : '#64748b'} fw={500}>
                        Card {currentIndex + 1} of {queue.length}
                    </Text>
                    {queue.length - currentIndex > 1 && (
                        <Tooltip label="Reshuffle remaining cards" withArrow position="top">
                            <ActionIcon
                                variant="subtle"
                                color={isDark ? 'ice' : 'blue'}
                                size="sm"
                                onClick={handleReshuffleRemaining}
                                aria-label="Reshuffle remaining cards"
                            >
                                <IconArrowsShuffle size={15} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                </Group>

                <Group gap="xs" align="center">
                    <Tooltip
                        label={
                            shuffleEnabled
                                ? "Cards are randomized & topic-distributed. Click to switch to due date order."
                                : "Cards are ordered by due date. Click to randomize & distribute topics."
                        }
                        withArrow
                        position="top"
                    >
                        <Badge
                            variant={shuffleEnabled ? 'light' : 'outline'}
                            color={shuffleEnabled ? 'teal' : 'gray'}
                            size="sm"
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={handleToggleShuffle}
                            leftSection={<IconArrowsShuffle size={12} />}
                        >
                            {shuffleEnabled ? 'Shuffled' : 'Due Order'}
                        </Badge>
                    </Tooltip>

                    <Badge
                        variant="outline"
                        color="gray"
                        style={{ borderColor: isDark ? '#26353e' : '#cbd5e1', color: isDark ? '#7ea0b7' : '#475569' }}
                    >
                        Press Space to reveal / 1-4 to rate
                    </Badge>
                </Group>
            </Group>
            <Progress value={progressValue} color="ice" size="xs" radius="xl" mb="lg" />

            {/* Flashcard Paper */}
            <Paper
                p="xl"
                radius="lg"
                withBorder
                style={{
                    position: 'relative',
                    background: isDark ? '#0d191a' : '#ffffff',
                    borderColor: isDark ? '#1e2f38' : '#e2e8f0',
                    boxShadow: isDark ? '0 12px 40px rgba(4, 15, 15, 0.7)' : '0 4px 24px rgba(0, 0, 0, 0.06)'
                }}
            >
                {/* Top metadata */}
                <Group justify="space-between" align="flex-start" mb="md">
                    <div>
                        <Group gap="xs" mb={6}>
                            {currentCard.difficulty && (
                                <Badge color={difficultyColor} variant="light" size="sm">
                                    {currentCard.difficulty}
                                </Badge>
                            )}
                            {isAnswerRevealed &&
                                currentCard.tags?.map(tag => (
                                    <Badge
                                        key={tag}
                                        variant="outline"
                                        color={isDark ? "gray" : "blue"}
                                        size="sm"
                                        style={{ textTransform: 'none', color: isDark ? '#7ea0b7' : '#0f172a', borderColor: isDark ? undefined : '#cbd5e1', fontWeight: 500 }}
                                    >
                                        #{tag}
                                    </Badge>
                                ))}
                        </Group>
                        <Title order={3} style={{ letterSpacing: '-0.3px', fontWeight: 700 }}>
                            {currentCard.title || currentCard.question.slice(0, 40)}
                        </Title>
                    </div>

                    {currentCard.url && (
                        <Anchor
                            href={currentCard.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="sm"
                            c={isDark ? '#a9cef4' : '#1971c2'}
                            underline="hover"
                            style={{ fontWeight: 600 }}
                        >
                            Open in LeetCode ↗
                        </Anchor>
                    )}
                </Group>

                {/* Question Section */}
                <Card
                    withBorder
                    p="md"
                    radius="md"
                    mb="lg"
                    style={{
                        background: isDark ? '#061213' : '#f8fafc',
                        borderColor: isDark ? '#162329' : '#cbd5e1'
                    }}
                >
                    <Text size="xs" fw={700} c={isDark ? '#7ea0b7' : '#0f172a'} tt="uppercase" mb={8} style={{ letterSpacing: '0.5px' }}>
                        Problem / Challenge
                    </Text>
                    <MarkdownRenderer content={currentCard.question} />
                </Card>

                {/* Solution Reveal Button */}
                {!isAnswerRevealed ? (
                    <Box style={{ textAlign: 'center', margin: '36px 0 16px' }}>
                        <Button
                            size="md"
                            variant="filled"
                            onClick={() => setRevealedCardId(currentCard.id)}
                            style={{
                                minWidth: 240,
                                background: isDark ? '#a9cef4' : '#1971c2',
                                color: isDark ? '#040f0f' : '#ffffff',
                                fontWeight: 700,
                                letterSpacing: '0.2px',
                                border: 'none'
                            }}
                        >
                            Show Solution (Space)
                        </Button>
                    </Box>
                ) : (
                    /* Revealed Answer Section */
                    <Stack gap="md" mt="lg">
                        <Box
                            p="md"
                            style={{
                                borderRadius: 10,
                                borderLeft: isDark ? '4px solid #a9cef4' : '4px solid #1971c2',
                                background: isDark ? '#081414' : '#f8fafc',
                                borderTop: isDark ? '1px solid #162329' : '1px solid #e2e8f0',
                                borderRight: isDark ? '1px solid #162329' : '1px solid #e2e8f0',
                                borderBottom: isDark ? '1px solid #162329' : '1px solid #e2e8f0'
                            }}
                        >
                            <Text size="xs" fw={700} c={isDark ? '#a9cef4' : '#1971c2'} tt="uppercase" mb={8} style={{ letterSpacing: '0.5px' }}>
                                Intuition & Approach
                            </Text>
                            <MarkdownRenderer content={currentCard.answer} />
                        </Box>

                        {/* Complexity Badges */}
                        {(currentCard.timeComplexity || currentCard.spaceComplexity) && (
                            <Group gap="sm">
                                {currentCard.timeComplexity && (
                                    <Badge size="md" variant="light" color="ice">
                                        Time: {currentCard.timeComplexity}
                                    </Badge>
                                )}
                                {currentCard.spaceComplexity && (
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
                                        Space: {currentCard.spaceComplexity}
                                    </Badge>
                                )}
                            </Group>
                        )}

                        {/* Code Snippet */}
                        {currentCard.codeSnippet && (
                            <div>
                                <Text size="xs" fw={700} c={isDark ? '#7ea0b7' : '#0f172a'} tt="uppercase" mb={6} style={{ letterSpacing: '0.5px' }}>
                                    Optimal Implementation
                                </Text>
                                <CodeBlock code={currentCard.codeSnippet} maxHeight={340} />
                            </div>
                        )}

                        {/* FSRS Rating Buttons - Subtle Red to Green progression */}
                        <Box mt="lg">
                            <Text size="xs" fw={700} c={isDark ? '#7ea0b7' : '#0f172a'} tt="uppercase" ta="center" mb="xs">
                                How well did you recall this solution?
                            </Text>
                            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                                {/* 1. Again - Subtle Red */}
                                <Button
                                    variant="default"
                                    size="md"
                                    onClick={() => handleRating(1)}
                                    style={{
                                        background: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
                                        borderColor: isDark ? 'rgba(239, 68, 68, 0.32)' : '#fca5a5',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Stack gap={2} align="center">
                                        <Text size="sm" fw={700} c={isDark ? '#f87171' : '#b91c1c'}>1. Again</Text>
                                        <Text size="xs" c={isDark ? '#fca5a5' : '#991b1b'} opacity={0.95}>{intervals[1] || '<1m'}</Text>
                                    </Stack>
                                </Button>

                                {/* 2. Hard - Subtle Amber/Orange */}
                                <Button
                                    variant="default"
                                    size="md"
                                    onClick={() => handleRating(2)}
                                    style={{
                                        background: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb',
                                        borderColor: isDark ? 'rgba(245, 158, 11, 0.32)' : '#fcd34d',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Stack gap={2} align="center">
                                        <Text size="sm" fw={700} c={isDark ? '#fbbf24' : '#92400e'}>2. Hard</Text>
                                        <Text size="xs" c={isDark ? '#fde68a' : '#78350f'} opacity={0.95}>{intervals[2] || '~12h'}</Text>
                                    </Stack>
                                </Button>

                                {/* 3. Good - Subtle Light Green */}
                                <Button
                                    variant="default"
                                    size="md"
                                    onClick={() => handleRating(3)}
                                    style={{
                                        background: isDark ? 'rgba(52, 211, 153, 0.12)' : '#f0fdf4',
                                        borderColor: isDark ? 'rgba(52, 211, 153, 0.32)' : '#86efac',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Stack gap={2} align="center">
                                        <Text size="sm" fw={700} c={isDark ? '#6ee7b7' : '#166534'}>3. Good</Text>
                                        <Text size="xs" c={isDark ? '#a7f3d0' : '#14532d'} opacity={0.95}>{intervals[3] || '~3d'}</Text>
                                    </Stack>
                                </Button>

                                {/* 4. Easy - Subtle Emerald Green */}
                                <Button
                                    variant="default"
                                    size="md"
                                    onClick={() => handleRating(4)}
                                    style={{
                                        background: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5',
                                        borderColor: isDark ? 'rgba(16, 185, 129, 0.42)' : '#6ee7b7',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Stack gap={2} align="center">
                                        <Text size="sm" fw={700} c={isDark ? '#34d399' : '#065f46'}>4. Easy</Text>
                                        <Text size="xs" c={isDark ? '#6ee7b7' : '#064e3b'} opacity={0.95}>{intervals[4] || '~1w'}</Text>
                                    </Stack>
                                </Button>
                            </SimpleGrid>
                        </Box>
                    </Stack>
                )}
            </Paper>
        </Box>
    );
}

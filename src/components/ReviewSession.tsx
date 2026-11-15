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
    Code,
    Anchor,
    SimpleGrid,
    Card,
    useMantineColorScheme
} from '@mantine/core';
import type { Flashcard } from '../../types/flashcard';
import { Rating, reviewFSRSCard, getNextIntervalEstimates } from '../../lib/fsrs';
import type { Grade } from 'ts-fsrs';

interface ReviewSessionProps {
    allCards: Flashcard[];
    onUpdateCard: (updatedCard: Flashcard) => void;
    onBrowseCards: () => void;
}

export function ReviewSession({ allCards, onUpdateCard, onBrowseCards }: ReviewSessionProps) {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';
    const [currentTime] = useState(() => Date.now());

    // Cards due for review (dueAt <= currentTime or new cards)
    const [queue, setQueue] = useState<Flashcard[]>(() => {
        return allCards.filter(card => {
            const dueTime = card.fsrs.dueAt instanceof Date
                ? card.fsrs.dueAt.getTime()
                : new Date(card.fsrs.dueAt).getTime();
            return dueTime <= currentTime;
        });
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
                    background: isDark ? '#0d191a' : 'white',
                    borderColor: isDark ? '#1e2f38' : undefined,
                    boxShadow: isDark ? '0 8px 32px rgba(4, 15, 15, 0.6)' : undefined
                }}
            >
                <Box style={{ fontSize: 56, marginBottom: 16 }}>🎉</Box>
                <Title order={2} mb="xs">
                    {reviewedCount > 0 ? "Review Session Complete!" : "All Caught Up!"}
                </Title>
                <Text c="dimmed" mb="lg">
                    {reviewedCount > 0
                        ? `Great work! You reviewed ${reviewedCount} card${reviewedCount > 1 ? 's' : ''} in this session.`
                        : "There are no flashcards due for review right now."}
                </Text>

                <Group justify="center" gap="sm">
                    {allCards.length > 0 && (
                        <Button
                            variant="light"
                            color="ice"
                            onClick={() => {
                                setQueue([...allCards]);
                                setCurrentIndex(0);
                                setReviewedCount(0);
                                setRevealedCardId(null);
                            }}
                            style={{ fontWeight: 500 }}
                        >
                            Cram Mode (Review All Cards)
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
            <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed" fw={500}>
                    Card {currentIndex + 1} of {queue.length}
                </Text>
                <Badge
                    variant="outline"
                    color="gray"
                    style={{ borderColor: isDark ? '#26353e' : undefined, color: isDark ? '#7ea0b7' : undefined }}
                >
                    Press Space to reveal / 1-4 to rate
                </Badge>
            </Group>
            <Progress value={progressValue} color="ice" size="xs" radius="xl" mb="lg" />

            {/* Flashcard Paper */}
            <Paper
                p="xl"
                radius="lg"
                withBorder
                style={{
                    position: 'relative',
                    background: isDark ? '#0d191a' : 'white',
                    borderColor: isDark ? '#1e2f38' : undefined,
                    boxShadow: isDark ? '0 12px 40px rgba(4, 15, 15, 0.7)' : undefined
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
                                        variant="subtle"
                                        color="gray"
                                        size="sm"
                                        style={{ textTransform: 'none', color: isDark ? '#7ea0b7' : undefined }}
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
                            c="#a9cef4"
                            underline="hover"
                            style={{ fontWeight: 500 }}
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
                        background: isDark ? '#061213' : '#f8f9fa',
                        borderColor: isDark ? '#162329' : undefined
                    }}
                >
                    <Text size="xs" fw={700} c={isDark ? '#7ea0b7' : 'dimmed'} tt="uppercase" mb={8} style={{ letterSpacing: '0.5px' }}>
                        Problem / Challenge
                    </Text>
                    <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 15 }}>
                        {currentCard.question}
                    </Text>
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
                                background: '#a9cef4',
                                color: '#040f0f',
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
                                borderLeft: '4px solid #a9cef4',
                                background: isDark ? '#081414' : '#f8f9fa',
                                borderTop: isDark ? '1px solid #162329' : undefined,
                                borderRight: isDark ? '1px solid #162329' : undefined,
                                borderBottom: isDark ? '1px solid #162329' : undefined
                            }}
                        >
                            <Text size="xs" fw={700} c="#a9cef4" tt="uppercase" mb={8} style={{ letterSpacing: '0.5px' }}>
                                Intuition & Approach
                            </Text>
                            <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14.5 }}>
                                {currentCard.answer}
                            </Text>
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
                                    <Badge size="md" variant="light" color="gray" style={{ color: isDark ? '#7ea0b7' : undefined }}>
                                        Space: {currentCard.spaceComplexity}
                                    </Badge>
                                )}
                            </Group>
                        )}

                        {/* Code Snippet */}
                        {currentCard.codeSnippet && (
                            <div>
                                <Text size="xs" fw={700} c={isDark ? '#7ea0b7' : 'dimmed'} tt="uppercase" mb={6} style={{ letterSpacing: '0.5px' }}>
                                    Optimal Implementation
                                </Text>
                                <Code
                                    block
                                    style={{
                                        maxHeight: 300,
                                        overflowY: 'auto',
                                        background: isDark ? '#020909' : '#f8f9fa',
                                        border: isDark ? '1px solid #16242c' : '1px solid #e9ecef',
                                        borderRadius: 8,
                                        padding: 14,
                                        fontSize: 13.5,
                                        lineHeight: 1.5,
                                        color: isDark ? '#e0effb' : undefined
                                    }}
                                >
                                    {currentCard.codeSnippet}
                                </Code>
                            </div>
                        )}

                        {/* FSRS Rating Buttons - Subtle Red to Green progression */}
                        <Box mt="lg">
                            <Text size="xs" fw={700} c={isDark ? '#7ea0b7' : 'dimmed'} tt="uppercase" ta="center" mb="xs">
                                How well did you recall this solution?
                            </Text>
                            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                                {/* 1. Again - Subtle Red */}
                                <Button
                                    variant="default"
                                    size="md"
                                    onClick={() => handleRating(1)}
                                    style={{
                                        background: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                                        borderColor: isDark ? 'rgba(239, 68, 68, 0.32)' : 'rgba(239, 68, 68, 0.25)',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Stack gap={2} align="center">
                                        <Text size="sm" fw={700} c={isDark ? '#f87171' : '#dc2626'}>1. Again</Text>
                                        <Text size="xs" c={isDark ? '#fca5a5' : '#b91c1c'} opacity={0.85}>{intervals[1] || '<1m'}</Text>
                                    </Stack>
                                </Button>

                                {/* 2. Hard - Subtle Amber/Orange */}
                                <Button
                                    variant="default"
                                    size="md"
                                    onClick={() => handleRating(2)}
                                    style={{
                                        background: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                                        borderColor: isDark ? 'rgba(245, 158, 11, 0.32)' : 'rgba(245, 158, 11, 0.25)',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Stack gap={2} align="center">
                                        <Text size="sm" fw={700} c={isDark ? '#fbbf24' : '#d97706'}>2. Hard</Text>
                                        <Text size="xs" c={isDark ? '#fde68a' : '#b45309'} opacity={0.85}>{intervals[2] || '~12h'}</Text>
                                    </Stack>
                                </Button>

                                {/* 3. Good - Subtle Light Green */}
                                <Button
                                    variant="default"
                                    size="md"
                                    onClick={() => handleRating(3)}
                                    style={{
                                        background: isDark ? 'rgba(52, 211, 153, 0.12)' : 'rgba(52, 211, 153, 0.08)',
                                        borderColor: isDark ? 'rgba(52, 211, 153, 0.32)' : 'rgba(52, 211, 153, 0.25)',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Stack gap={2} align="center">
                                        <Text size="sm" fw={700} c={isDark ? '#6ee7b7' : '#059669'}>3. Good</Text>
                                        <Text size="xs" c={isDark ? '#a7f3d0' : '#047857'} opacity={0.85}>{intervals[3] || '~3d'}</Text>
                                    </Stack>
                                </Button>

                                {/* 4. Easy - Subtle Emerald Green */}
                                <Button
                                    variant="default"
                                    size="md"
                                    onClick={() => handleRating(4)}
                                    style={{
                                        background: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)',
                                        borderColor: isDark ? 'rgba(16, 185, 129, 0.42)' : 'rgba(16, 185, 129, 0.35)',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Stack gap={2} align="center">
                                        <Text size="sm" fw={700} c={isDark ? '#34d399' : '#047857'}>4. Easy</Text>
                                        <Text size="xs" c={isDark ? '#6ee7b7' : '#065f46'} opacity={0.9}>{intervals[4] || '~1w'}</Text>
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

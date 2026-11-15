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
    Card
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
            <Paper p="xl" radius="md" withBorder style={{ maxWidth: 650, margin: '40px auto', textAlign: 'center' }}>
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
                            color="orange"
                            onClick={() => {
                                setQueue([...allCards]);
                                setCurrentIndex(0);
                                setReviewedCount(0);
                                setRevealedCardId(null);
                            }}
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
            ? 'red'
            : 'orange';

    return (
        <Box style={{ maxWidth: 760, margin: '24px auto' }}>
            {/* Session Progress Header */}
            <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">
                    Card {currentIndex + 1} of {queue.length}
                </Text>
                <Badge variant="outline" color="gray">
                    Press Space to reveal / 1-4 to rate
                </Badge>
            </Group>
            <Progress value={progressValue} color="orange" size="sm" radius="xl" mb="lg" />

            {/* Flashcard Paper */}
            <Paper p="xl" radius="md" withBorder shadow="sm" style={{ position: 'relative' }}>
                {/* Top metadata */}
                <Group justify="space-between" align="flex-start" mb="md">
                    <div>
                        <Group gap="xs" mb={4}>
                            {currentCard.difficulty && (
                                <Badge color={difficultyColor} variant="light">
                                    {currentCard.difficulty}
                                </Badge>
                            )}
                            {isAnswerRevealed &&
                                currentCard.tags?.map(tag => (
                                    <Badge key={tag} variant="subtle" color="gray" size="sm">
                                        #{tag}
                                    </Badge>
                                ))}
                        </Group>
                        <Title order={3} style={{ letterSpacing: '-0.3px' }}>
                            {currentCard.title || currentCard.question.slice(0, 40)}
                        </Title>
                    </div>

                    {currentCard.url && (
                        <Anchor
                            href={currentCard.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="sm"
                            c="orange"
                            underline="hover"
                        >
                            Open in LeetCode ↗
                        </Anchor>
                    )}
                </Group>

                {/* Question Section */}
                <Card withBorder p="md" radius="sm" mb="lg" style={{ background: 'var(--mantine-color-default-hover)' }}>
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={6}>
                        Problem / Challenge
                    </Text>
                    <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {currentCard.question}
                    </Text>
                </Card>

                {/* Solution Reveal Button */}
                {!isAnswerRevealed ? (
                    <Box style={{ textAlign: 'center', margin: '32px 0 16px' }}>
                        <Button
                            size="lg"
                            color="orange"
                            variant="filled"
                            onClick={() => setRevealedCardId(currentCard.id)}
                            style={{ minWidth: 260 }}
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
                                borderRadius: 8,
                                borderLeft: '4px solid var(--mantine-color-orange-filled)',
                                background: 'var(--mantine-color-default-hover)'
                            }}
                        >
                            <Text size="xs" fw={700} c="orange" tt="uppercase" mb={6}>
                                Intuition & Approach
                            </Text>
                            <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                {currentCard.answer}
                            </Text>
                        </Box>

                        {/* Complexity Badges */}
                        {(currentCard.timeComplexity || currentCard.spaceComplexity) && (
                            <Group gap="sm">
                                {currentCard.timeComplexity && (
                                    <Badge size="md" variant="light" color="blue">
                                        Time: {currentCard.timeComplexity}
                                    </Badge>
                                )}
                                {currentCard.spaceComplexity && (
                                    <Badge size="md" variant="light" color="indigo">
                                        Space: {currentCard.spaceComplexity}
                                    </Badge>
                                )}
                            </Group>
                        )}

                        {/* Code Snippet */}
                        {currentCard.codeSnippet && (
                            <div>
                                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>
                                    Optimal Implementation
                                </Text>
                                <Code block style={{ maxHeight: 280, overflowY: 'auto' }}>
                                    {currentCard.codeSnippet}
                                </Code>
                            </div>
                        )}

                        {/* FSRS Rating Buttons */}
                        <Box mt="lg">
                            <Text size="xs" fw={700} c="dimmed" tt="uppercase" ta="center" mb="xs">
                                How well did you recall this solution?
                            </Text>
                            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                                <Button
                                    color="red"
                                    variant="light"
                                    size="md"
                                    onClick={() => handleRating(1)}
                                >
                                    <Stack gap={2} align="center">
                                        <Text size="sm" fw={700}>1. Again</Text>
                                        <Text size="xs" opacity={0.8}>{intervals[1] || '<1m'}</Text>
                                    </Stack>
                                </Button>

                                <Button
                                    color="orange"
                                    variant="light"
                                    size="md"
                                    onClick={() => handleRating(2)}
                                >
                                    <Stack gap={2} align="center">
                                        <Text size="sm" fw={700}>2. Hard</Text>
                                        <Text size="xs" opacity={0.8}>{intervals[2] || '~12h'}</Text>
                                    </Stack>
                                </Button>

                                <Button
                                    color="teal"
                                    variant="light"
                                    size="md"
                                    onClick={() => handleRating(3)}
                                >
                                    <Stack gap={2} align="center">
                                        <Text size="sm" fw={700}>3. Good</Text>
                                        <Text size="xs" opacity={0.8}>{intervals[3] || '~4d'}</Text>
                                    </Stack>
                                </Button>

                                <Button
                                    color="blue"
                                    variant="light"
                                    size="md"
                                    onClick={() => handleRating(4)}
                                >
                                    <Stack gap={2} align="center">
                                        <Text size="sm" fw={700}>4. Easy</Text>
                                        <Text size="xs" opacity={0.8}>{intervals[4] || '~1mo'}</Text>
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

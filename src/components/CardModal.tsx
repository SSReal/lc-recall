import { useState } from 'react';
import {
    Modal,
    TextInput,
    Textarea,
    TagsInput,
    Button,
    Group,
    Stack,
    Grid,
    SegmentedControl,
    Box,
    Text,
    useMantineColorScheme
} from '@mantine/core';
import type { Flashcard, ProblemDifficulty } from '../../types/flashcard';
import { createNewSchedulerCard } from '../../lib/fsrs';
import { MarkdownRenderer } from './common/MarkdownRenderer';
import { CodeBlock } from './common/CodeBlock';

interface CardModalProps {
    opened: boolean;
    onClose: () => void;
    onSave: (card: Flashcard) => void;
    initialCard?: Flashcard | null;
}

interface CardModalFormProps {
    initialCard?: Flashcard | null;
    onClose: () => void;
    onSave: (card: Flashcard) => void;
}

function CardModalForm({ initialCard, onClose, onSave }: CardModalFormProps) {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    const [title, setTitle] = useState(initialCard?.title || '');
    const [difficulty, setDifficulty] = useState<ProblemDifficulty>(initialCard?.difficulty || 'Medium');
    const [url, setUrl] = useState(initialCard?.url || '');
    const [tags, setTags] = useState<string[]>(initialCard?.tags || []);
    const [question, setQuestion] = useState(initialCard?.question || '');
    const [answer, setAnswer] = useState(initialCard?.answer || '');
    const [codeSnippet, setCodeSnippet] = useState(initialCard?.codeSnippet || '');
    const [timeComplexity, setTimeComplexity] = useState(initialCard?.timeComplexity || 'O(n)');
    const [spaceComplexity, setSpaceComplexity] = useState(initialCard?.spaceComplexity || 'O(1)');
    const [isSaving, setIsSaving] = useState(false);

    // Write / Preview tabs
    const [questionTab, setQuestionTab] = useState<'write' | 'preview'>('write');
    const [answerTab, setAnswerTab] = useState<'write' | 'preview'>('write');
    const [codeTab, setCodeTab] = useState<'write' | 'preview'>('write');

    const handleSave = async () => {
        if (!question.trim() || !answer.trim()) return;
        setIsSaving(true);
        try {
            const fsrsCard = initialCard?.fsrs || (await createNewSchedulerCard());
            const card: Flashcard = {
                id: initialCard?.id || crypto.randomUUID(),
                title: title.trim() || question.slice(0, 30),
                difficulty,
                url: url.trim() || undefined,
                tags,
                question: question.trim(),
                answer: answer.trim(),
                codeSnippet: codeSnippet.trim() || undefined,
                timeComplexity: timeComplexity.trim() || undefined,
                spaceComplexity: spaceComplexity.trim() || undefined,
                createdAt: initialCard?.createdAt || Date.now(),
                fsrs: fsrsCard
            };
            onSave(card);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Stack gap="md">
            <TextInput
                label="Problem Title / Name"
                placeholder="e.g. 206. Reverse Linked List"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                required
            />

            <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                        <span style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 4 }}>
                            Difficulty
                        </span>
                        <SegmentedControl
                            fullWidth
                            value={difficulty}
                            onChange={(val) => setDifficulty(val as ProblemDifficulty)}
                            data={[
                                { label: 'Easy', value: 'Easy' },
                                { label: 'Medium', value: 'Medium' },
                                { label: 'Hard', value: 'Hard' }
                            ]}
                            color={
                                difficulty === 'Easy' ? 'teal' : difficulty === 'Medium' ? 'ice' : 'rose'
                            }
                        />
                    </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                        label="LeetCode URL"
                        placeholder="https://leetcode.com/problems/..."
                        value={url}
                        onChange={(e) => setUrl(e.currentTarget.value)}
                    />
                </Grid.Col>
            </Grid>

            <TagsInput
                label="Tags / Patterns"
                placeholder="Type tag and press enter (e.g. DP, Two Pointers, Trees)"
                value={tags}
                onChange={setTags}
            />

            {/* Question / Problem Description with Markdown Preview */}
            <Box>
                <Group justify="space-between" align="center" mb={6}>
                    <Text size="sm" fw={500}>
                        Question / Problem Description <span style={{ color: '#fa5252' }}>*</span>
                    </Text>
                    <SegmentedControl
                        size="xs"
                        value={questionTab}
                        onChange={(val) => setQuestionTab(val as 'write' | 'preview')}
                        data={[
                            { label: 'Write (Markdown)', value: 'write' },
                            { label: 'Preview', value: 'preview' }
                        ]}
                    />
                </Group>
                {questionTab === 'write' ? (
                    <Textarea
                        placeholder="Summarize the problem statement, constraints, or the core challenge (Markdown supported)..."
                        minRows={3}
                        autosize
                        value={question}
                        onChange={(e) => setQuestion(e.currentTarget.value)}
                        required
                    />
                ) : (
                    <Box
                        p="md"
                        style={{
                            borderRadius: 8,
                            border: isDark ? '1px solid #1e2f38' : '1px solid #e2e8f0',
                            background: isDark ? '#061213' : '#f8f9fa',
                            minHeight: 88
                        }}
                    >
                        {question.trim() ? (
                            <MarkdownRenderer content={question} />
                        ) : (
                            <Text size="sm" c="dimmed" fs="italic">
                                Nothing to preview. Type markdown in the Write tab.
                            </Text>
                        )}
                    </Box>
                )}
            </Box>

            {/* Solution / Approach / Intuition with Markdown Preview */}
            <Box>
                <Group justify="space-between" align="center" mb={6}>
                    <Text size="sm" fw={500}>
                        Solution / Approach / Intuition <span style={{ color: '#fa5252' }}>*</span>
                    </Text>
                    <SegmentedControl
                        size="xs"
                        value={answerTab}
                        onChange={(val) => setAnswerTab(val as 'write' | 'preview')}
                        data={[
                            { label: 'Write (Markdown)', value: 'write' },
                            { label: 'Preview', value: 'preview' }
                        ]}
                    />
                </Group>
                {answerTab === 'write' ? (
                    <Textarea
                        placeholder="Explain the step-by-step intuition, algorithm, edge cases, and why it works (Markdown supported)..."
                        minRows={4}
                        autosize
                        value={answer}
                        onChange={(e) => setAnswer(e.currentTarget.value)}
                        required
                    />
                ) : (
                    <Box
                        p="md"
                        style={{
                            borderRadius: 8,
                            border: isDark ? '1px solid #1e2f38' : '1px solid #e2e8f0',
                            background: isDark ? '#061213' : '#f8f9fa',
                            minHeight: 110
                        }}
                    >
                        {answer.trim() ? (
                            <MarkdownRenderer content={answer} />
                        ) : (
                            <Text size="sm" c="dimmed" fs="italic">
                                Nothing to preview. Type markdown in the Write tab.
                            </Text>
                        )}
                    </Box>
                )}
            </Box>

            <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                        label="Time Complexity"
                        placeholder="e.g. O(n) or O(log n)"
                        value={timeComplexity}
                        onChange={(e) => setTimeComplexity(e.currentTarget.value)}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                        label="Space Complexity"
                        placeholder="e.g. O(1) or O(n)"
                        value={spaceComplexity}
                        onChange={(e) => setSpaceComplexity(e.currentTarget.value)}
                    />
                </Grid.Col>
            </Grid>

            {/* Code Snippet with Syntax Preview */}
            <Box>
                <Group justify="space-between" align="center" mb={6}>
                    <Text size="sm" fw={500}>
                        Code Snippet / Implementation (Optional)
                    </Text>
                    <SegmentedControl
                        size="xs"
                        value={codeTab}
                        onChange={(val) => setCodeTab(val as 'write' | 'preview')}
                        data={[
                            { label: 'Write Code', value: 'write' },
                            { label: 'Preview Syntax', value: 'preview' }
                        ]}
                    />
                </Group>
                {codeTab === 'write' ? (
                    <Textarea
                        placeholder="// Optimal clean solution snippet in your language of choice (auto-detected syntax highlighting)..."
                        minRows={4}
                        autosize
                        value={codeSnippet}
                        onChange={(e) => setCodeSnippet(e.currentTarget.value)}
                        styles={{ input: { fontFamily: 'monospace', fontSize: 13 } }}
                    />
                ) : (
                    <Box style={{ minHeight: 88 }}>
                        {codeSnippet.trim() ? (
                            <CodeBlock code={codeSnippet} maxHeight={300} />
                        ) : (
                            <Box
                                p="md"
                                style={{
                                    borderRadius: 8,
                                    border: isDark ? '1px solid #1e2f38' : '1px solid #e2e8f0',
                                    background: isDark ? '#061213' : '#f8f9fa'
                                }}
                            >
                                <Text size="sm" c="dimmed" fs="italic">
                                    No code snippet entered yet.
                                </Text>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    loading={isSaving}
                    disabled={!question.trim() || !answer.trim()}
                    style={{ background: '#a9cef4', color: '#040f0f', fontWeight: 600, border: 'none' }}
                >
                    {initialCard ? 'Save Changes' : 'Create Card'}
                </Button>
            </Group>
        </Stack>
    );
}

export function CardModal({ opened, onClose, onSave, initialCard }: CardModalProps) {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={initialCard ? 'Edit Flashcard' : 'Add New LeetCode Flashcard'}
            size="lg"
            centered
        >
            <CardModalForm
                key={initialCard ? initialCard.id : 'new-card'}
                initialCard={initialCard}
                onClose={onClose}
                onSave={onSave}
            />
        </Modal>
    );
}

import { useState, useMemo } from 'react';
import {
    Modal,
    Tabs,
    TextInput,
    Textarea,
    Select,
    SegmentedControl,
    NumberInput,
    Grid,
    Button,
    CopyButton,
    Group,
    Stack,
    Badge,
    Text,
    Paper,
    Alert,
    Tooltip,
    ActionIcon,
    Box,
    Anchor,
    useMantineColorScheme
} from '@mantine/core';
import type { Flashcard, ProblemDifficulty } from '../../types/flashcard';
import { CodeBlock } from './common/CodeBlock';
import { MarkdownRenderer } from './common/MarkdownRenderer';
import {
    generateLLMPrompt,
    parseLLMFlashcardResponse,
    convertDraftsToFlashcards,
    detectPlatformAndSlug,
    type SupportedLanguage,
    type CardCountOption,
    type DetailDepth,
    type ParsedFlashcardDraft
} from '../../lib/promptGenerator';

interface LLMPromptImportModalProps {
    opened: boolean;
    onClose: () => void;
    onImportCards: (newCards: Flashcard[]) => void;
    onNavigateTab?: (tab: 'review' | 'cards' | 'stats') => void;
}

export function LLMPromptImportModal({
    opened,
    onClose,
    onImportCards,
    onNavigateTab
}: LLMPromptImportModalProps) {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    const [activeTab, setActiveTab] = useState<string | null>('prompt');

    // Prompt generator state
    const [url, setUrl] = useState('');
    const [language, setLanguage] = useState<SupportedLanguage>('Python 3');
    const [cardCount, setCardCount] = useState<CardCountOption>('1');
    const [customCardCount, setCustomCardCount] = useState<number>(3);
    const [depth, setDepth] = useState<DetailDepth>('balanced');
    const [customNotes, setCustomNotes] = useState('');

    // Import state
    const [jsonInput, setJsonInput] = useState('');
    const [parseError, setParseError] = useState<string | null>(null);
    const [parsedDrafts, setParsedDrafts] = useState<ParsedFlashcardDraft[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importedSuccessCount, setImportedSuccessCount] = useState<number | null>(null);

    // Platform detection for prompt generator
    const platformInfo = useMemo(() => detectPlatformAndSlug(url), [url]);

    // Live generated prompt
    const generatedPrompt = useMemo(() => {
        return generateLLMPrompt({
            url: url.trim(),
            language,
            cardCount,
            customCardCount,
            depth,
            customNotes: customNotes.trim()
        });
    }, [url, language, cardCount, customCardCount, depth, customNotes]);

    // Handle JSON parsing
    const handleParseJSON = (rawText: string) => {
        setJsonInput(rawText);
        setImportedSuccessCount(null);
        if (!rawText.trim()) {
            setParseError(null);
            setParsedDrafts([]);
            return;
        }

        try {
            const drafts = parseLLMFlashcardResponse(rawText, url.trim() || undefined);
            setParsedDrafts(drafts);
            setParseError(null);
        } catch (err: unknown) {
            setParsedDrafts([]);
            setParseError(err instanceof Error ? err.message : 'Invalid JSON');
        }
    };

    // Remove single draft from preview
    const handleRemoveDraft = (indexToRemove: number) => {
        setParsedDrafts(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    // Confirm import
    const handleConfirmImport = async () => {
        if (parsedDrafts.length === 0) return;
        setIsImporting(true);
        try {
            const newFlashcards = await convertDraftsToFlashcards(parsedDrafts);
            onImportCards(newFlashcards);
            setImportedSuccessCount(newFlashcards.length);
            setParsedDrafts([]);
            setJsonInput('');
            setParseError(null);
        } catch (err: unknown) {
            setParseError(err instanceof Error ? err.message : 'Failed to create cards');
        } finally {
            setIsImporting(false);
        }
    };

    const handleResetAll = () => {
        setUrl('');
        setLanguage('Python 3');
        setCardCount('1');
        setCustomCardCount(3);
        setDepth('balanced');
        setCustomNotes('');
        setJsonInput('');
        setParseError(null);
        setParsedDrafts([]);
        setImportedSuccessCount(null);
        setActiveTab('prompt');
    };

    const getDifficultyColor = (diff: ProblemDifficulty) => {
        switch (diff) {
            case 'Easy': return 'teal';
            case 'Medium': return 'ice';
            case 'Hard': return 'rose';
            default: return 'gray';
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs" align="center">
                    <Box
                        style={{
                            background: isDark ? '#a9cef4' : '#1971c2',
                            color: isDark ? '#040f0f' : '#ffffff',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontWeight: 800,
                            fontSize: 13
                        }}
                    >
                        AI
                    </Box>
                    <Text fw={700} size="md">
                        Custom LLM Prompt & Flashcard Importer
                    </Text>
                </Group>
            }
            size="xl"
            centered
            styles={{
                content: {
                    backgroundColor: isDark ? '#071314' : '#ffffff'
                }
            }}
        >
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List mb="md">
                    <Tabs.Tab
                        value="prompt"
                        leftSection={<span style={{ fontSize: 14 }}>🪄</span>}
                    >
                        1. Generate Prompt
                    </Tabs.Tab>
                    <Tabs.Tab
                        value="import"
                        leftSection={<span style={{ fontSize: 14 }}>📥</span>}
                        rightSection={
                            parsedDrafts.length > 0 ? (
                                <Badge size="xs" color="teal" variant="filled">
                                    {parsedDrafts.length}
                                </Badge>
                            ) : undefined
                        }
                    >
                        2. Paste JSON & Import
                    </Tabs.Tab>
                </Tabs.List>

                {/* TAB 1: PROMPT GENERATOR */}
                <Tabs.Panel value="prompt">
                    <Stack gap="md">
                        <div>
                            <Text size="sm" c="dimmed" mb="xs">
                                Enter a LeetCode or Codeforces problem URL. Customize your prompt parameters below, copy the prompt into any LLM (ChatGPT, Claude, Gemini, DeepSeek), and paste the result into the Import tab.
                            </Text>

                            <TextInput
                                label="Problem Link or Identifier"
                                placeholder="e.g. https://leetcode.com/problems/two-sum/ or https://codeforces.com/problemset/problem/4/A"
                                value={url}
                                onChange={(e) => setUrl(e.currentTarget.value)}
                                rightSection={
                                    url.trim() ? (
                                        <Badge
                                            size="sm"
                                            variant="light"
                                            color={
                                                platformInfo.platform === 'LeetCode'
                                                    ? 'teal'
                                                    : platformInfo.platform === 'Codeforces'
                                                    ? 'ice'
                                                    : 'gray'
                                            }
                                        >
                                            {platformInfo.platform}
                                        </Badge>
                                    ) : undefined
                                }
                            />

                            {platformInfo.inferredTitle && (
                                <Text size="xs" c="ice" mt={4}>
                                    Detected: <strong>{platformInfo.inferredTitle}</strong> ({platformInfo.platform})
                                </Text>
                            )}

                            {/* Quick example problem links */}
                            <Group gap={6} mt={6}>
                                <Text size="xs" c={isDark ? "dimmed" : "#0f172a"} fw={600}>
                                    Quick Examples:
                                </Text>
                                <Anchor
                                    size="xs"
                                    c={isDark ? undefined : "#1971c2"}
                                    onClick={() => setUrl('https://leetcode.com/problems/two-sum/')}
                                    style={{ cursor: 'pointer', fontWeight: 500 }}
                                >
                                    LeetCode Two Sum
                                </Anchor>
                                <Text size="xs" c={isDark ? "dimmed" : "#64748b"}>•</Text>
                                <Anchor
                                    size="xs"
                                    c={isDark ? undefined : "#1971c2"}
                                    onClick={() => setUrl('https://leetcode.com/problems/trapping-rain-water/')}
                                    style={{ cursor: 'pointer', fontWeight: 500 }}
                                >
                                    Trapping Rain Water
                                </Anchor>
                                <Text size="xs" c={isDark ? "dimmed" : "#64748b"}>•</Text>
                                <Anchor
                                    size="xs"
                                    c={isDark ? undefined : "#1971c2"}
                                    onClick={() => setUrl('https://codeforces.com/problemset/problem/4/A')}
                                    style={{ cursor: 'pointer', fontWeight: 500 }}
                                >
                                    Codeforces 4A (Watermelon)
                                </Anchor>
                            </Group>
                        </div>

                        <Grid>
                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                <Select
                                    label="Target Language for Code"
                                    value={language}
                                    onChange={(val) => setLanguage((val as SupportedLanguage) || 'Python 3')}
                                    data={[
                                        { label: 'Python 3', value: 'Python 3' },
                                        { label: 'C++', value: 'C++' },
                                        { label: 'Java', value: 'Java' },
                                        { label: 'TypeScript', value: 'TypeScript' },
                                        { label: 'JavaScript', value: 'JavaScript' },
                                        { label: 'Go', value: 'Go' },
                                        { label: 'Rust', value: 'Rust' },
                                        { label: 'No Code Snippet (Pseudocode)', value: 'No Code Snippet' }
                                    ]}
                                />
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                <Text size="sm" fw={500} mb={4}>
                                    Detail & Depth
                                </Text>
                                <SegmentedControl
                                    fullWidth
                                    value={depth}
                                    onChange={(val) => setDepth(val as DetailDepth)}
                                    data={[
                                        { label: 'Concise', value: 'concise' },
                                        { label: 'Balanced', value: 'balanced' },
                                        { label: 'Deep Dive', value: 'deep' }
                                    ]}
                                    color="ice"
                                />
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, sm: 12 }}>
                                <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
                                    <Box style={{ flex: 1, minWidth: 220 }}>
                                        <Text size="sm" fw={500} mb={4}>
                                            Number of Flashcards
                                        </Text>
                                        <SegmentedControl
                                            fullWidth
                                            value={cardCount}
                                            onChange={(val) => setCardCount(val as CardCountOption)}
                                            data={[
                                                { label: '1 Card', value: '1' },
                                                { label: '2–4 Cards', value: '2-4' },
                                                { label: 'Custom', value: 'custom' }
                                            ]}
                                            color="ice"
                                        />
                                    </Box>

                                    {cardCount === 'custom' && (
                                        <NumberInput
                                            label="Cards to Generate"
                                            value={customCardCount}
                                            onChange={(val) => setCustomCardCount(typeof val === 'number' ? Math.max(1, Math.min(10, val)) : 3)}
                                            min={1}
                                            max={10}
                                            style={{ width: 140 }}
                                        />
                                    )}
                                </Group>
                            </Grid.Col>
                        </Grid>

                        <Textarea
                            label="Personal Notes / Focus Weaknesses (Optional)"
                            placeholder="e.g. Focus on the O(n) two-pointer invariant, explain why the greedy choice is safe, or highlight edge case when len(nums) <= 2"
                            minRows={2}
                            autosize
                            value={customNotes}
                            onChange={(e) => setCustomNotes(e.currentTarget.value)}
                        />

                        {/* Generated Prompt Preview */}
                        <div>
                            <Group justify="space-between" align="center" mb={6}>
                                <Text size="sm" fw={600}>
                                    Customized Prompt
                                </Text>
                                <CopyButton value={generatedPrompt} timeout={2000}>
                                    {({ copied, copy }) => (
                                        <Button
                                            size="xs"
                                            color={copied ? 'teal' : 'ice'}
                                            variant={copied ? 'filled' : 'light'}
                                            onClick={copy}
                                        >
                                            {copied ? '✓ Copied to Clipboard!' : '📋 Copy Prompt'}
                                        </Button>
                                    )}
                                </CopyButton>
                            </Group>

                            <Paper
                                p="sm"
                                radius="md"
                                withBorder
                                style={{
                                    background: isDark ? '#020909' : '#f8f9fa',
                                    borderColor: isDark ? 'var(--mantine-color-dark-4)' : undefined,
                                    maxHeight: 220,
                                    overflowY: 'auto',
                                    fontFamily: 'monospace',
                                    fontSize: 12,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    lineHeight: 1.4
                                }}
                            >
                                {generatedPrompt}
                            </Paper>
                        </div>

                        <Group justify="space-between" mt="xs">
                            <Text size="xs" c="dimmed">
                                Works with Claude 3.5 Sonnet, ChatGPT, Gemini, DeepSeek, or local LLMs.
                            </Text>

                            <Button
                                rightSection="→"
                                onClick={() => setActiveTab('import')}
                                style={{ background: isDark ? '#a9cef4' : '#1971c2', color: isDark ? '#040f0f' : '#ffffff', fontWeight: 600, border: 'none' }}
                            >
                                Next: Paste LLM Output
                            </Button>
                        </Group>
                    </Stack>
                </Tabs.Panel>

                {/* TAB 2: PASTE & IMPORT */}
                <Tabs.Panel value="import">
                    <Stack gap="md">
                        {importedSuccessCount !== null && (
                            <Alert
                                color="teal"
                                title="Import Successful!"
                                withCloseButton
                                onClose={() => setImportedSuccessCount(null)}
                            >
                                <Text size="sm" mb="xs">
                                    Successfully imported <strong>{importedSuccessCount}</strong> flashcard{importedSuccessCount > 1 ? 's' : ''} into your deck with fresh FSRS-7 schedules!
                                </Text>
                                <Group gap="xs">
                                    <Button
                                        size="xs"
                                        color="teal"
                                        variant="light"
                                        onClick={() => {
                                            onClose();
                                            onNavigateTab?.('review');
                                        }}
                                    >
                                        Start Reviewing Now
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="default"
                                        onClick={() => {
                                            onClose();
                                            onNavigateTab?.('cards');
                                        }}
                                    >
                                        View in Cards List
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        onClick={handleResetAll}
                                    >
                                        Import Another Problem
                                    </Button>
                                </Group>
                            </Alert>
                        )}

                        <div>
                            <Text fw={600} size="sm" mb={4}>
                                Paste LLM JSON Response
                            </Text>
                            <Text size="xs" c="dimmed" mb="xs">
                                Paste the exact output from your LLM below. Markdown fences (```json ... ```) and conversational wrapping will be automatically parsed and cleaned.
                            </Text>

                            <Textarea
                                placeholder='Paste your JSON response here, e.g.:&#10;[&#10;  {&#10;    "title": "1. Two Sum",&#10;    "difficulty": "Easy",&#10;    "question": "Given an array...",&#10;    "answer": "Use a hash map to store complements...",&#10;    "timeComplexity": "O(n)",&#10;    "spaceComplexity": "O(n)"&#10;  }&#10;]'
                                minRows={5}
                                autosize
                                value={jsonInput}
                                onChange={(e) => handleParseJSON(e.currentTarget.value)}
                                styles={{ input: { fontFamily: 'monospace', fontSize: 13 } }}
                            />
                        </div>

                        {parseError && (
                            <Alert color="rose" title="JSON Parsing Issue">
                                <Text size="xs">{parseError}</Text>
                            </Alert>
                        )}

                        {/* Cards Preview */}
                        {parsedDrafts.length > 0 && (
                            <div>
                                <Group justify="space-between" align="center" mb="xs">
                                    <Group gap="xs">
                                        <Text fw={600} size="sm">
                                            Cards Ready to Import:
                                        </Text>
                                        <Badge color="ice" variant="filled" size="sm">
                                            {parsedDrafts.length}
                                        </Badge>
                                    </Group>

                                    <Button
                                        onClick={handleConfirmImport}
                                        loading={isImporting}
                                        size="sm"
                                        style={{
                                            background: isDark ? '#a9cef4' : '#1971c2',
                                            color: isDark ? '#040f0f' : '#ffffff',
                                            fontWeight: 600,
                                            border: 'none'
                                        }}
                                    >
                                        Import {parsedDrafts.length} Flashcard{parsedDrafts.length > 1 ? 's' : ''} into Deck
                                    </Button>
                                </Group>

                                <Stack gap="sm">
                                    {parsedDrafts.map((draft, idx) => (
                                        <Paper
                                            key={idx}
                                            p="md"
                                            radius="md"
                                            withBorder
                                            style={{
                                                background: isDark ? 'var(--mantine-color-dark-6)' : '#ffffff',
                                                borderColor: isDark ? 'var(--mantine-color-dark-4)' : '#e2e8f0'
                                            }}
                                        >
                                            <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
                                                <div>
                                                    <Group gap="xs" mb={2}>
                                                        <Text fw={600} size="sm">
                                                            {draft.title || `Card #${idx + 1}`}
                                                        </Text>
                                                        <Badge
                                                            size="xs"
                                                            color={getDifficultyColor(draft.difficulty)}
                                                            variant="light"
                                                        >
                                                            {draft.difficulty}
                                                        </Badge>
                                                        {draft.url && (
                                                            <Anchor
                                                                href={draft.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                size="xs"
                                                                c="dimmed"
                                                            >
                                                                ↗ Link
                                                            </Anchor>
                                                        )}
                                                    </Group>

                                                    <Group gap={4}>
                                                        {draft.tags.map((t) => (
                                                            <Badge key={t} size="xs" variant="outline" color="gray">
                                                                {t}
                                                            </Badge>
                                                        ))}
                                                        {draft.timeComplexity && (
                                                            <Badge size="xs" variant="dot" color="ice">
                                                                Time: {draft.timeComplexity}
                                                            </Badge>
                                                        )}
                                                        {draft.spaceComplexity && (
                                                            <Badge size="xs" variant="dot" color="ice">
                                                                Space: {draft.spaceComplexity}
                                                            </Badge>
                                                        )}
                                                    </Group>
                                                </div>

                                                <Tooltip label="Remove this card before importing">
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="gray"
                                                        size="sm"
                                                        onClick={() => handleRemoveDraft(idx)}
                                                    >
                                                        ✕
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>

                                            <Box mb="xs">
                                                <Text size="xs" fw={700} c={isDark ? "dimmed" : "#0f172a"} mb={2}>
                                                    Question:
                                                </Text>
                                                <MarkdownRenderer content={draft.question} />
                                            </Box>

                                            <Box mb="xs">
                                                <Text size="xs" fw={700} c={isDark ? "dimmed" : "#0f172a"} mb={2}>
                                                    Answer / Intuition:
                                                </Text>
                                                <MarkdownRenderer content={draft.answer} />
                                            </Box>

                                            {draft.codeSnippet && (
                                                <Box>
                                                    <Text size="xs" fw={700} c={isDark ? "dimmed" : "#0f172a"} mb={2}>
                                                        Code Snippet:
                                                    </Text>
                                                    <CodeBlock
                                                        code={draft.codeSnippet}
                                                        maxHeight={160}
                                                        showHeader={false}
                                                    />
                                                </Box>
                                            )}
                                        </Paper>
                                    ))}
                                </Stack>
                            </div>
                        )}

                        <Group justify="space-between" mt="xs">
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => setActiveTab('prompt')}
                            >
                                ← Back to Prompt Generator
                            </Button>

                            {parsedDrafts.length > 0 && (
                                <Button
                                    onClick={handleConfirmImport}
                                    loading={isImporting}
                                    size="sm"
                                    style={{
                                        background: isDark ? '#a9cef4' : '#1971c2',
                                        color: isDark ? '#040f0f' : '#ffffff',
                                        fontWeight: 600,
                                        border: 'none'
                                    }}
                                >
                                    Import {parsedDrafts.length} Flashcard{parsedDrafts.length > 1 ? 's' : ''} into Deck
                                </Button>
                            )}
                        </Group>
                    </Stack>
                </Tabs.Panel>
            </Tabs>
        </Modal>
    );
}

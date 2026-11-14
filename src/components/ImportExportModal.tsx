import { useState } from 'react';
import {
    Modal,
    Button,
    Stack,
    Textarea,
    Text,
    Divider,
    Alert
} from '@mantine/core';
import type { Flashcard } from '../../types/flashcard';
import { exportFlashcardsJSON, importFlashcardsJSON } from '../../lib/storage';
import { createStarterCards } from '../../lib/starterCards';

interface ImportExportModalProps {
    opened: boolean;
    onClose: () => void;
    cards: Flashcard[];
    onCardsUpdated: (cards: Flashcard[]) => void;
}

export function ImportExportModal({
    opened,
    onClose,
    cards,
    onCardsUpdated
}: ImportExportModalProps) {
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleExport = () => {
        const json = exportFlashcardsJSON(cards);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lc-recall-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setSuccessMsg('Flashcards exported successfully!');
        setError(null);
    };

    const handleImport = () => {
        if (!jsonInput.trim()) {
            setError('Please paste JSON data first.');
            return;
        }
        try {
            const imported = importFlashcardsJSON(jsonInput);
            onCardsUpdated(imported);
            setSuccessMsg(`Successfully imported ${imported.length} flashcards!`);
            setError(null);
            setJsonInput('');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to parse JSON.';
            setError(message);
            setSuccessMsg(null);
        }
    };

    const handleResetDefault = async () => {
        if (confirm('This will replace your current flashcards with the default LeetCode starter deck. Continue?')) {
            const starters = await createStarterCards();
            onCardsUpdated(starters);
            setSuccessMsg('Reset to starter deck complete!');
            setError(null);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Backup, Restore & Settings"
            size="md"
            centered
        >
            <Stack gap="md">
                {error && (
                    <Alert color="red" title="Error">
                        {error}
                    </Alert>
                )}
                {successMsg && (
                    <Alert color="teal" title="Success">
                        {successMsg}
                    </Alert>
                )}

                <div>
                    <Text fw={600} size="sm" mb={4}>
                        Export Backup
                    </Text>
                    <Text size="xs" c="dimmed" mb="sm">
                        Download all your flashcards, notes, and FSRS review history as a JSON file.
                    </Text>
                    <Button variant="default" onClick={handleExport} fullWidth>
                        Download Deck Backup (.json)
                    </Button>
                </div>

                <Divider my="xs" />

                <div>
                    <Text fw={600} size="sm" mb={4}>
                        Import Deck
                    </Text>
                    <Text size="xs" c="dimmed" mb="sm">
                        Paste a previously exported JSON backup to load your cards.
                    </Text>
                    <Textarea
                        placeholder='[{"id": "...", "question": "...", "fsrs": {...}}]'
                        minRows={3}
                        autosize
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.currentTarget.value)}
                        mb="sm"
                    />
                    <Button color="orange" onClick={handleImport} fullWidth disabled={!jsonInput.trim()}>
                        Import Flashcards
                    </Button>
                </div>

                <Divider my="xs" />

                <div>
                    <Text fw={600} size="sm" mb={4} c="red">
                        Reset Deck
                    </Text>
                    <Text size="xs" c="dimmed" mb="sm">
                        Restore the default curated LeetCode Blind 75 starter deck.
                    </Text>
                    <Button variant="outline" color="red" onClick={handleResetDefault} fullWidth>
                        Reset to Starter Deck
                    </Button>
                </div>
            </Stack>
        </Modal>
    );
}

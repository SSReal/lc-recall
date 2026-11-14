import { useState, useEffect, useMemo } from 'react';
import { Container, Loader, Center, Box, Text } from '@mantine/core';
import type { Flashcard } from '../types/flashcard';
import { initializeFlashcards, saveFlashcards } from '../lib/storage';
import { Header } from './components/Header';
import { ReviewSession } from './components/ReviewSession';
import { CardList } from './components/CardList';
import { StatsView } from './components/StatsView';
import { CardModal } from './components/CardModal';
import { ImportExportModal } from './components/ImportExportModal';

export default function App() {
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'review' | 'cards' | 'stats'>('review');
    const [currentTime] = useState(() => Date.now());

    // Modals
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Initial load
    useEffect(() => {
        initializeFlashcards()
            .then((loaded) => {
                setCards(loaded);
            })
            .catch((err) => {
                console.error("Failed to load cards:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // Calculate due count
    const dueCount = useMemo(() => {
        return cards.filter((c) => {
            const dueTime = c.fsrs.dueAt instanceof Date
                ? c.fsrs.dueAt.getTime()
                : new Date(c.fsrs.dueAt).getTime();
            return dueTime <= currentTime;
        }).length;
    }, [cards, currentTime]);

    const handleSaveCard = (savedCard: Flashcard) => {
        setCards((prev) => {
            const exists = prev.some((c) => c.id === savedCard.id);
            const updated = exists
                ? prev.map((c) => (c.id === savedCard.id ? savedCard : c))
                : [savedCard, ...prev];
            saveFlashcards(updated);
            return updated;
        });
        setEditingCard(null);
    };

    const handleUpdateCard = (updatedCard: Flashcard) => {
        setCards((prev) => {
            const updated = prev.map((c) => (c.id === updatedCard.id ? updatedCard : c));
            saveFlashcards(updated);
            return updated;
        });
    };

    const handleDeleteCard = (id: string) => {
        setCards((prev) => {
            const updated = prev.filter((c) => c.id !== id);
            saveFlashcards(updated);
            return updated;
        });
    };

    const handleCardsUpdated = (newCards: Flashcard[]) => {
        setCards(newCards);
        saveFlashcards(newCards);
    };

    const handleOpenEdit = (card: Flashcard) => {
        setEditingCard(card);
        setIsCardModalOpen(true);
    };

    const handleOpenAdd = () => {
        setEditingCard(null);
        setIsCardModalOpen(true);
    };

    if (loading) {
        return (
            <Center style={{ height: '100vh', flexDirection: 'column', gap: 16 }}>
                <Loader color="orange" size="lg" />
                <Text size="sm" c="dimmed">
                    Initializing LeetCode Recall & FSRS Scheduler...
                </Text>
            </Center>
        );
    }

    return (
        <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header
                activeTab={activeTab}
                onTabChange={setActiveTab}
                dueCount={dueCount}
                totalCount={cards.length}
                onAddCard={handleOpenAdd}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            <Container size="lg" py="md" style={{ flex: 1, width: '100%' }}>
                {activeTab === 'review' && (
                    <ReviewSession
                        key={cards.length}
                        allCards={cards}
                        onUpdateCard={handleUpdateCard}
                        onBrowseCards={() => setActiveTab('cards')}
                    />
                )}

                {activeTab === 'cards' && (
                    <CardList
                        cards={cards}
                        onEditCard={handleOpenEdit}
                        onDeleteCard={handleDeleteCard}
                        onAddCard={handleOpenAdd}
                    />
                )}

                {activeTab === 'stats' && <StatsView cards={cards} />}
            </Container>

            <CardModal
                opened={isCardModalOpen}
                onClose={() => {
                    setIsCardModalOpen(false);
                    setEditingCard(null);
                }}
                onSave={handleSaveCard}
                initialCard={editingCard}
            />

            <ImportExportModal
                opened={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                cards={cards}
                onCardsUpdated={handleCardsUpdated}
            />
        </Box>
    );
}

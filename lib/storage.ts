import type { Flashcard, FSRSCard, CardType } from "../types/flashcard";
import { createStarterCards } from "./starterCards";

const STORAGE_KEY = "flashcards";

export function convertToFSRSCard(cardData: CardType): FSRSCard {
    return {
        ...cardData,
        dueAt: cardData.dueAt instanceof Date ? cardData.dueAt.getTime() : new Date(cardData.dueAt).getTime(),
        lastReviewAt: cardData.lastReviewAt
            ? (cardData.lastReviewAt instanceof Date ? cardData.lastReviewAt.getTime() : new Date(cardData.lastReviewAt).getTime())
            : null
    };
}

export function convertToDefaultSchedulerCard(fsrsCard: FSRSCard): CardType {
    return {
        ...fsrsCard,
        dueAt: new Date(fsrsCard.dueAt),
        lastReviewAt: fsrsCard.lastReviewAt ? new Date(fsrsCard.lastReviewAt) : null
    } as CardType;
}

export function saveFlashcards(flashcards: Flashcard[]): void {
    const serialized = flashcards.map(card => ({
        ...card,
        fsrs: convertToFSRSCard(card.fsrs)
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}

export function getFlashcards(): Flashcard[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((item: Record<string, unknown>) => ({
            ...item,
            fsrs: convertToDefaultSchedulerCard(item.fsrs as FSRSCard)
        } as Flashcard));
    } catch (e) {
        console.error("Failed to parse flashcards from localStorage:", e);
        return [];
    }
}

export async function initializeFlashcards(): Promise<Flashcard[]> {
    const existing = getFlashcards();
    if (existing.length > 0) {
        return existing;
    }
    const starters = await createStarterCards();
    saveFlashcards(starters);
    return starters;
}

export function exportFlashcardsJSON(flashcards: Flashcard[]): string {
    const serialized = flashcards.map(card => ({
        ...card,
        fsrs: convertToFSRSCard(card.fsrs)
    }));
    return JSON.stringify(serialized, null, 2);
}

export function importFlashcardsJSON(jsonString: string): Flashcard[] {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
        throw new Error("Invalid format: expected JSON array of flashcards");
    }
    const imported: Flashcard[] = parsed.map((item: Record<string, unknown>) => {
        if (!item.id || !item.question || !item.answer || !item.fsrs) {
            throw new Error("Invalid flashcard object missing required fields");
        }
        return {
            ...item,
            fsrs: convertToDefaultSchedulerCard(item.fsrs as FSRSCard)
        } as Flashcard;
    });
    saveFlashcards(imported);
    return imported;
}

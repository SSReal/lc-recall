import type { Flashcard } from '../types/flashcard';

/**
 * Standard Fisher-Yates (Knuth) shuffle algorithm.
 * Returns a new shuffled copy of the input array.
 */
export function shuffleArray<T>(array: readonly T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    return shuffled;
}

/**
 * Shuffles flashcards while intelligently distributing topics (tags) and difficulties
 * to prevent consecutive clustering of the same problem category or difficulty.
 * 
 * This implements interleaved practice (a key cognitive learning principle),
 * ensuring variety between consecutive flashcards while maintaining randomness.
 */
export function distributeAndShuffleCards(cards: readonly Flashcard[]): Flashcard[] {
    if (cards.length <= 2) {
        return shuffleArray(cards);
    }

    // Step 1: Start with a random shuffle to remove any input order bias
    const pool = shuffleArray(cards);
    const remaining = [...pool];
    const result: Flashcard[] = [];

    // Step 2: Pick the first card at random
    const firstIndex = Math.floor(Math.random() * remaining.length);
    result.push(remaining.splice(firstIndex, 1)[0]);

    // Step 3: Greedily pick subsequent cards that minimize topic and difficulty repetition
    while (remaining.length > 0) {
        const prevCard = result[result.length - 1];
        const prevTags = new Set((prevCard.tags || []).map(t => t.toLowerCase().trim()));
        const prevDifficulty = prevCard.difficulty;

        // Count tag frequencies in remaining cards to prevent starvation
        const remainingTagCounts = new Map<string, number>();
        for (const card of remaining) {
            for (const tag of card.tags || []) {
                const key = tag.toLowerCase().trim();
                remainingTagCounts.set(key, (remainingTagCounts.get(key) || 0) + 1);
            }
        }

        let bestScore = Infinity;
        let candidates: number[] = [];

        for (let i = 0; i < remaining.length; i++) {
            const card = remaining[i];
            let penalty = 0;

            // Penalty for overlapping tags (shared topic/category)
            if (card.tags && card.tags.length > 0 && prevTags.size > 0) {
                const overlapCount = card.tags.filter(t => prevTags.has(t.toLowerCase().trim())).length;
                if (overlapCount > 0) {
                    penalty += 100 * overlapCount;
                }
            } else if ((!card.tags || card.tags.length === 0) && prevTags.size === 0) {
                // Both untagged
                penalty += 20;
            }

            // Penalty for same difficulty in a row
            if (card.difficulty && prevDifficulty && card.difficulty === prevDifficulty) {
                penalty += 15;
            }

            // Starvation relief: if this card has tags that are very common in remaining cards,
            // discount penalty so we interleave them throughout rather than clumping at the end
            let maxCategoryRemaining = 0;
            for (const tag of card.tags || []) {
                const count = remainingTagCounts.get(tag.toLowerCase().trim()) || 0;
                if (count > maxCategoryRemaining) {
                    maxCategoryRemaining = count;
                }
            }
            penalty -= maxCategoryRemaining * 8;

            // Random jitter to break ties and prevent deterministic repetition
            penalty += (Math.random() * 5);

            if (penalty < bestScore - 0.001) {
                bestScore = penalty;
                candidates = [i];
            } else if (Math.abs(penalty - bestScore) <= 6) {
                candidates.push(i);
            }
        }

        // Pick randomly among top candidate cards
        const chosenCandidateIdx = candidates[Math.floor(Math.random() * candidates.length)];
        const [chosenCard] = remaining.splice(chosenCandidateIdx, 1);
        result.push(chosenCard);
    }

    return result;
}

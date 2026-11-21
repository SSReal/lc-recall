import test from 'node:test';
import assert from 'node:assert';
import { shuffleArray, distributeAndShuffleCards } from '../lib/shuffle.ts';
import type { Flashcard } from '../types/flashcard.ts';

function createDummyCard(id: string, tags: string[] = [], difficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy'): Flashcard {
    return {
        id,
        question: `Question ${id}`,
        answer: `Answer ${id}`,
        tags,
        difficulty,
        fsrs: {
            cardId: id,
            dueAt: new Date(),
            lastReviewAt: null,
            stability: 0,
            stabilityFast: 0,
            difficulty: 0,
            state: 0,
            scheduleStatus: 'new',
            reps: 0,
            lapses: 0,
            scheduledDays: 0,
            learningStep: 0
        }
    };
}

test('shuffleArray: handles empty and single item arrays', () => {
    assert.deepStrictEqual(shuffleArray([]), []);
    assert.deepStrictEqual(shuffleArray([42]), [42]);
});

test('shuffleArray: preserves all elements and does not mutate original', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const originalCopy = [...original];
    const shuffled = shuffleArray(original);

    assert.strictEqual(shuffled.length, original.length);
    assert.deepStrictEqual([...shuffled].sort((a, b) => a - b), original);
    assert.deepStrictEqual(original, originalCopy, 'Original array must not be mutated');
});

test('distributeAndShuffleCards: handles small arrays', () => {
    assert.deepStrictEqual(distributeAndShuffleCards([]), []);

    const card1 = createDummyCard('1');
    const result1 = distributeAndShuffleCards([card1]);
    assert.strictEqual(result1.length, 1);
    assert.strictEqual(result1[0].id, '1');

    const card2 = createDummyCard('2');
    const result2 = distributeAndShuffleCards([card1, card2]);
    assert.strictEqual(result2.length, 2);
    const ids = result2.map(c => c.id).sort();
    assert.deepStrictEqual(ids, ['1', '2']);
});

test('distributeAndShuffleCards: preserves all cards without duplicates or losses', () => {
    const cards = [
        createDummyCard('1', ['Array'], 'Easy'),
        createDummyCard('2', ['Array'], 'Easy'),
        createDummyCard('3', ['Tree'], 'Medium'),
        createDummyCard('4', ['Dynamic Programming'], 'Hard'),
        createDummyCard('5', ['Graph'], 'Medium'),
        createDummyCard('6', ['Tree'], 'Easy'),
    ];

    const result = distributeAndShuffleCards(cards);
    assert.strictEqual(result.length, cards.length);

    const resultIds = result.map(c => c.id).sort();
    const originalIds = cards.map(c => c.id).sort();
    assert.deepStrictEqual(resultIds, originalIds);
});

test('distributeAndShuffleCards: distributes distinct categories and reduces consecutive overlaps', () => {
    // 3 Array cards, 3 Tree cards, 3 Graph cards
    const cards = [
        createDummyCard('a1', ['Array']),
        createDummyCard('a2', ['Array']),
        createDummyCard('a3', ['Array']),
        createDummyCard('t1', ['Tree']),
        createDummyCard('t2', ['Tree']),
        createDummyCard('t3', ['Tree']),
        createDummyCard('g1', ['Graph']),
        createDummyCard('g2', ['Graph']),
        createDummyCard('g3', ['Graph']),
    ];

    let totalConsecutiveTagOverlaps = 0;
    const runs = 20;

    for (let r = 0; r < runs; r++) {
        const distributed = distributeAndShuffleCards(cards);
        assert.strictEqual(distributed.length, cards.length);

        for (let i = 0; i < distributed.length - 1; i++) {
            const currentTag = distributed[i].tags![0];
            const nextTag = distributed[i + 1].tags![0];
            if (currentTag === nextTag) {
                totalConsecutiveTagOverlaps++;
            }
        }
    }

    // In a completely blocked list, 6 out of 8 transitions (75%) are consecutive overlaps (120 per 20 runs).
    // With distributed interleaving across 3 balanced categories, consecutive overlaps should be near 0.
    const averageOverlapsPerRun = totalConsecutiveTagOverlaps / runs;
    assert.ok(averageOverlapsPerRun < 1.5, `Expected average consecutive overlaps to be < 1.5, got ${averageOverlapsPerRun}`);
});

test('distributeAndShuffleCards: produces randomized order across multiple runs', () => {
    const cards = [
        createDummyCard('1', ['Array'], 'Easy'),
        createDummyCard('2', ['String'], 'Medium'),
        createDummyCard('3', ['Tree'], 'Hard'),
        createDummyCard('4', ['Dynamic Programming'], 'Medium'),
        createDummyCard('5', ['Graph'], 'Hard'),
        createDummyCard('6', ['Hash Table'], 'Easy'),
        createDummyCard('7', ['Binary Search'], 'Medium'),
        createDummyCard('8', ['Two Pointers'], 'Easy'),
    ];

    const order1 = distributeAndShuffleCards(cards).map(c => c.id).join(',');
    let gotDifferentOrder = false;

    for (let i = 0; i < 5; i++) {
        const order2 = distributeAndShuffleCards(cards).map(c => c.id).join(',');
        if (order1 !== order2) {
            gotDifferentOrder = true;
            break;
        }
    }

    assert.strictEqual(gotDifferentOrder, true, 'Shuffling must produce different orders across runs');
});

test('distributeAndShuffleCards: handles cards with no tags or empty tags without error', () => {
    const cards = [
        createDummyCard('1', []),
        createDummyCard('2', undefined as unknown as string[]),
        createDummyCard('3', ['Tree']),
        createDummyCard('4', []),
    ];

    const result = distributeAndShuffleCards(cards);
    assert.strictEqual(result.length, 4);
    assert.deepStrictEqual(result.map(c => c.id).sort(), ['1', '2', '3', '4']);
});

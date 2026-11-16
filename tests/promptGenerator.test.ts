import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    detectPlatformAndSlug,
    generateLLMPrompt,
    parseLLMFlashcardResponse,
    convertDraftsToFlashcards,
    normalizeDifficulty,
    cleanComplexity
} from '../lib/promptGenerator.ts';

describe('promptGenerator: detectPlatformAndSlug', () => {
    test('detects LeetCode problem URLs correctly', () => {
        const res = detectPlatformAndSlug('https://leetcode.com/problems/trapping-rain-water/');
        assert.equal(res.platform, 'LeetCode');
        assert.equal(res.slug, 'trapping-rain-water');
        assert.equal(res.inferredTitle, 'Trapping Rain Water');
    });

    test('detects LeetCode URLs with query parameters and subpaths', () => {
        const res = detectPlatformAndSlug('https://leetcode.com/problems/two-sum/description/?envType=study-plan-v2');
        assert.equal(res.platform, 'LeetCode');
        assert.equal(res.slug, 'two-sum');
        assert.equal(res.inferredTitle, 'Two Sum');
    });

    test('detects Codeforces problemset URLs', () => {
        const res = detectPlatformAndSlug('https://codeforces.com/problemset/problem/4/A');
        assert.equal(res.platform, 'Codeforces');
        assert.equal(res.slug, '4A');
        assert.equal(res.inferredTitle, 'Codeforces 4A');
    });

    test('detects Codeforces contest URLs', () => {
        const res = detectPlatformAndSlug('https://codeforces.com/contest/1899/problem/C');
        assert.equal(res.platform, 'Codeforces');
        assert.equal(res.slug, '1899C');
        assert.equal(res.inferredTitle, 'Codeforces Contest 1899 Problem C');
    });

    test('falls back gracefully on generic or empty inputs', () => {
        assert.equal(detectPlatformAndSlug('').platform, 'Competitive Programming');
        assert.equal(detectPlatformAndSlug('https://example.com/algo-problem').platform, 'Competitive Programming');
    });
});

describe('promptGenerator: generateLLMPrompt', () => {
    test('generates valid customized prompt containing problem URL and language', () => {
        const prompt = generateLLMPrompt({
            url: 'https://leetcode.com/problems/two-sum/',
            language: 'Python 3',
            cardCount: '1',
            depth: 'balanced',
            customNotes: 'Focus on single-pass hash map'
        });

        assert.match(prompt, /leetcode\.com\/problems\/two-sum/);
        assert.match(prompt, /Python 3/);
        assert.match(prompt, /Focus on single-pass hash map/);
        assert.match(prompt, /OUTPUT FORMAT REQUIREMENT/);
        assert.match(prompt, /JSON Schema/);
    });

    test('adjusts instructions based on 2-4 cards and deep depth options', () => {
        const prompt = generateLLMPrompt({
            url: 'https://codeforces.com/problemset/problem/4/A',
            language: 'C++',
            cardCount: '2-4',
            depth: 'deep'
        });

        assert.match(prompt, /2 to 4 distinct focused flashcards/);
        assert.match(prompt, /Provide in-depth explanation/);
        assert.match(prompt, /C\+\+/);
    });

    test('supports custom card count in prompt', () => {
        const prompt = generateLLMPrompt({
            url: 'https://leetcode.com/problems/trapping-rain-water/',
            language: 'Java',
            cardCount: 'custom',
            customCardCount: 5,
            depth: 'balanced'
        });

        assert.match(prompt, /Create exactly 5 distinct, high-quality flashcards/);
    });
});

describe('promptGenerator: normalizeDifficulty', () => {
    test('maps variations of difficulty accurately', () => {
        assert.equal(normalizeDifficulty('Easy'), 'Easy');
        assert.equal(normalizeDifficulty('easy'), 'Easy');
        assert.equal(normalizeDifficulty('Medium'), 'Medium');
        assert.equal(normalizeDifficulty('medium'), 'Medium');
        assert.equal(normalizeDifficulty('Hard'), 'Hard');
        assert.equal(normalizeDifficulty('hard'), 'Hard');
        assert.equal(normalizeDifficulty('unknown'), 'Medium');
    });
});

describe('promptGenerator: parseLLMFlashcardResponse', () => {
    test('parses raw JSON array of flashcards', () => {
        const json = JSON.stringify([
            {
                title: 'Two Sum',
                difficulty: 'Easy',
                question: 'How to find two numbers that sum up to target in O(n)?',
                answer: 'Use a hash map to record seen elements and their indices.',
                timeComplexity: 'O(n)',
                spaceComplexity: 'O(n)',
                tags: ['Array', 'Hash Table']
            }
        ]);

        const drafts = parseLLMFlashcardResponse(json);
        assert.equal(drafts.length, 1);
        assert.equal(drafts[0].title, 'Two Sum');
        assert.equal(drafts[0].difficulty, 'Easy');
        assert.equal(drafts[0].timeComplexity, 'O(n)');
        assert.deepEqual(drafts[0].tags, ['Array', 'Hash Table']);
    });

    test('parses JSON wrapped inside markdown code fences (```json ... ```)', () => {
        const fenced = `Here is the flashcard you requested:

\`\`\`json
[
  {
    "title": "Reverse Linked List",
    "difficulty": "Easy",
    "question": "What is the three-pointer technique for reversing a singly-linked list in place?",
    "answer": "Maintain prev, curr, and next pointers while updating curr.next = prev.",
    "codeSnippet": "let prev = null, curr = head; while (curr) { ... }"
  }
]
\`\`\`

Hope this helps!`;

        const drafts = parseLLMFlashcardResponse(fenced, 'https://leetcode.com/problems/reverse-linked-list/');
        assert.equal(drafts.length, 1);
        assert.equal(drafts[0].title, 'Reverse Linked List');
        assert.equal(drafts[0].url, 'https://leetcode.com/problems/reverse-linked-list/');
        assert.match(drafts[0].codeSnippet!, /let prev = null/);
    });

    test('parses wrapped object like { flashcards: [...] } or { cards: [...] }', () => {
        const wrapped = JSON.stringify({
            cards: [
                {
                    question: 'Kadane algorithm invariant',
                    answer: 'At each index i, either extend current subarray or start fresh from nums[i].'
                }
            ]
        });

        const drafts = parseLLMFlashcardResponse(wrapped);
        assert.equal(drafts.length, 1);
        assert.equal(drafts[0].question, 'Kadane algorithm invariant');
        assert.equal(drafts[0].difficulty, 'Medium'); // default
    });

    test('parses single flashcard object { question, answer }', () => {
        const single = JSON.stringify({
            title: 'Watermelon CF 4A',
            question: 'When can a positive integer w be divided into two even parts?',
            answer: 'When w is even and w > 2.',
            difficulty: 'Easy'
        });

        const drafts = parseLLMFlashcardResponse(single);
        assert.equal(drafts.length, 1);
        assert.equal(drafts[0].title, 'Watermelon CF 4A');
    });

    test('cleans verbose explanations from complexity fields during parsing', () => {
        const verbose = JSON.stringify([
            {
                title: '42. Trapping Rain Water - An In-Depth Look',
                question: 'What is the two-pointer approach?',
                answer: 'Track leftMax and rightMax pointers.',
                timeComplexity: 'O(n) - where n is the number of elements in the height array because we scan it once',
                spaceComplexity: 'O(1) auxiliary memory since only two pointer variables are used'
            }
        ]);

        const drafts = parseLLMFlashcardResponse(verbose);
        assert.equal(drafts[0].timeComplexity, 'O(n)');
        assert.equal(drafts[0].spaceComplexity, 'O(1)');
    });

    test('throws error when JSON is invalid or empty', () => {
        assert.throws(() => parseLLMFlashcardResponse(''), /Input is empty/);
        assert.throws(() => parseLLMFlashcardResponse('{ not valid json }'), /Failed to parse JSON/);
    });

    test('throws error when required fields are missing', () => {
        const missingAnswer = JSON.stringify([{ question: 'Only question' }]);
        assert.throws(() => parseLLMFlashcardResponse(missingAnswer), /missing a required "answer" field/);
    });
});

describe('promptGenerator: cleanComplexity', () => {
    test('extracts clean Big-O and trims long sentences', () => {
        assert.equal(cleanComplexity('O(n)'), 'O(n)');
        assert.equal(cleanComplexity('O(n log n)'), 'O(n log n)');
        assert.equal(cleanComplexity('O(V + E)'), 'O(V + E)');
        assert.equal(cleanComplexity('O(n) - linear scan over nums'), 'O(n)');
        assert.equal(cleanComplexity('O(1): constant auxiliary space'), 'O(1)');
        assert.equal(cleanComplexity(''), undefined);
        assert.equal(cleanComplexity(undefined), undefined);
    });
});

describe('promptGenerator: convertDraftsToFlashcards', () => {
    test('converts drafts into valid Flashcards with fresh FSRS cards and IDs', async () => {
        const drafts = [
            {
                title: 'Test Card',
                difficulty: 'Hard' as const,
                question: 'Question?',
                answer: 'Answer.',
                tags: ['DP'],
                timeComplexity: 'O(n^2)'
            }
        ];

        const flashcards = await convertDraftsToFlashcards(drafts);
        assert.equal(flashcards.length, 1);
        assert.ok(flashcards[0].id);
        assert.equal(flashcards[0].title, 'Test Card');
        assert.equal(flashcards[0].difficulty, 'Hard');
        assert.ok(flashcards[0].fsrs);
        assert.equal(flashcards[0].fsrs.reps, 0);
        assert.equal(flashcards[0].fsrs.stability, 0);
        assert.equal(flashcards[0].fsrs.stabilityFast, 0);
    });
});

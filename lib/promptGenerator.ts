import type { Flashcard, ProblemDifficulty } from '../types/flashcard.ts';
import { createNewSchedulerCard } from './fsrs.ts';

export type SupportedLanguage =
    | 'Python 3'
    | 'C++'
    | 'Java'
    | 'TypeScript'
    | 'JavaScript'
    | 'Go'
    | 'Rust'
    | 'No Code Snippet';

export type CardCountOption = '1' | '2-4' | 'custom';

export type CardGenerationStyle =
    | 'single'
    | 'multi'
    | 'intuition';

export type DetailDepth =
    | 'balanced'
    | 'concise'
    | 'deep';

export interface PromptOptions {
    url: string;
    language: SupportedLanguage;
    cardCount?: CardCountOption;
    customCardCount?: number;
    style?: CardGenerationStyle;
    depth: DetailDepth;
    customNotes?: string;
}

export interface PlatformInfo {
    platform: 'LeetCode' | 'Codeforces' | 'Competitive Programming';
    slug?: string;
    inferredTitle?: string;
}

/**
 * Detects the platform and extracts a readable problem title or slug from the URL.
 */
export function detectPlatformAndSlug(rawUrl: string): PlatformInfo {
    const trimmed = rawUrl.trim();
    if (!trimmed) {
        return { platform: 'Competitive Programming' };
    }

    try {
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        const host = urlObj.hostname.toLowerCase();
        const pathname = urlObj.pathname;

        if (host.includes('leetcode.com') || host.includes('leetcode.cn')) {
            // Match /problems/:slug/
            const match = pathname.match(/\/problems\/([^/]+)/);
            if (match && match[1]) {
                const slug = match[1];
                const inferredTitle = slug
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                return {
                    platform: 'LeetCode',
                    slug,
                    inferredTitle
                };
            }
            return { platform: 'LeetCode' };
        }

        if (host.includes('codeforces.com')) {
            // Codeforces patterns: /problemset/problem/:contestId/:index or /contest/:contestId/problem/:index
            const matchProblemset = pathname.match(/\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/i);
            if (matchProblemset) {
                const contestId = matchProblemset[1];
                const index = matchProblemset[2].toUpperCase();
                return {
                    platform: 'Codeforces',
                    slug: `${contestId}${index}`,
                    inferredTitle: `Codeforces ${contestId}${index}`
                };
            }

            const matchContest = pathname.match(/\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/i);
            if (matchContest) {
                const contestId = matchContest[1];
                const index = matchContest[2].toUpperCase();
                return {
                    platform: 'Codeforces',
                    slug: `${contestId}${index}`,
                    inferredTitle: `Codeforces Contest ${contestId} Problem ${index}`
                };
            }

            return { platform: 'Codeforces' };
        }
    } catch {
        // Not a full URL, might be a slug or problem title
    }

    return { platform: 'Competitive Programming' };
}

/**
 * Builds a prompt for an LLM to generate flashcards matching the app's JSON schema.
 */
export function generateLLMPrompt(options: PromptOptions): string {
    const { url, language, cardCount, customCardCount, style, depth, customNotes } = options;
    const platformInfo = detectPlatformAndSlug(url);

    // Resolve card count & style instruction
    const resolvedCount = cardCount || (style === 'single' ? '1' : style === 'multi' ? '2-4' : '1');

    const cardCountInstruction = resolvedCount === '1'
        ? `Create exactly 1 comprehensive, high-yield flashcard that captures the optimal algorithm, intuition, step-by-step approach, complexity, and code.`
        : resolvedCount === '2-4'
        ? `Create 2 to 4 distinct focused flashcards:
1. Pattern & Mental Model: What makes this problem trigger this pattern? The high-level intuition and core invariant.
2. Algorithm Steps & Edge Cases: Step-by-step logic, tricky edge cases, and pitfalls to avoid.
3. Implementation & Complexity: Optimal code snippet, time complexity, and space complexity analysis.`
        : resolvedCount === 'custom'
        ? `Create exactly ${Math.max(1, Math.min(10, customCardCount || 3))} distinct, high-quality flashcards breaking down this problem from multiple angles (e.g. Core Pattern & Invariants, Algorithmic Approach, Tricky Edge Cases & Bug Traps, Implementation & Complexity Trade-offs).`
        : `Create 1 to 2 conceptual flashcards focusing strictly on Pattern Recognition, Problem Invariants, and the "Aha!" insight without getting bogged down in boilerplate code.`;

    const depthInstruction = depth === 'concise'
        ? `Keep answers concise and punchy with bullet points suitable for rapid spaced repetition review. Focus on active recall triggers.`
        : depth === 'deep'
        ? `Provide in-depth explanation: break down why naive approaches fail, provide clear algorithmic steps, walk through a concrete example if helpful, and detail exact space/time trade-offs.`
        : `Balance clarity and brevity: explain the core intuition clearly, provide numbered steps for the algorithm, and list notable edge cases.`;

    const codeInstruction = language === 'No Code Snippet'
        ? `Do NOT include full code snippets; provide pseudocode or algorithmic steps in the answer instead.`
        : `Provide optimal, clean, idiomatic code in ${language} with brief inline comments highlighting the critical lines.`;

    const customNotesSection = customNotes && customNotes.trim()
        ? `\nAdditional Focus / Personal Notes to address:\n"""\n${customNotes.trim()}\n"""\n`
        : '';

    return `You are an expert algorithms and competitive programming coach specializing in spaced repetition flashcards for technical interviews.

Please generate active-recall flashcard(s) for the following problem:
- Problem Link: ${url.trim() || 'Specified Problem'}
- Platform: ${platformInfo.platform}${platformInfo.inferredTitle ? `\n- Problem Title / ID: ${platformInfo.inferredTitle}` : ''}

Card Specifications:
- Card Count: ${cardCountInstruction}
- Depth: ${depthInstruction}
- Code Snippet: ${codeInstruction}${customNotesSection}

Guidelines for Quality Flashcards:
1. Active Recall: The "question" must prompt active problem-solving (e.g., "How do you detect...", "What invariant ensures O(n)...", "Explain the optimal approach for..."), rather than asking to recite trivial text.
2. Intuition First: The "answer" must clearly articulate the "Aha!" moment and why this data structure or approach was chosen over alternatives.
3. Complexities (STRICT Big-O Only): "timeComplexity" and "spaceComplexity" MUST be concise Big-O notation ONLY (e.g. "O(n)", "O(n log k)", "O(1)"). Never include sentences, rationale, or explanations inside complexity fields. Put all complexity explanations and step-by-step reasoning inside the "answer" field.
4. Short Text Fields:
   - "title": Short problem name and number only (e.g. "42. Trapping Rain Water"). Do NOT include descriptions or sentences.
   - "difficulty": Exactly one word: "Easy", "Medium", or "Hard".
   - "tags": Array of 2 to 4 short 1-2 word topic tags (e.g. ["Array", "Two Pointers"]). Do NOT include sentences in tags.
   - All explanations, walkthroughs, and edge cases belong strictly in the "answer" field.

OUTPUT FORMAT REQUIREMENT:
You MUST respond with ONLY a valid JSON array of flashcard objects (or enclosed in a \`\`\`json \`\`\` markdown block). Do NOT include any introductory or concluding conversational prose.

JSON Schema:
[
  {
    "title": "Problem Number and Name only (e.g., 42. Trapping Rain Water)",
    "difficulty": "Easy",
    "url": "${url.trim() || 'https://leetcode.com/problems/...'}",
    "tags": ["Array", "Two Pointers"],
    "question": "Front of card: The active recall prompt or challenge question",
    "answer": "Back of card: Intuition, step-by-step approach, complexity rationale, and edge cases",
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(1)",
    "codeSnippet": ${language === 'No Code Snippet' ? '""' : `"// Clean ${language} code snippet"`}
  }
]`;
}

export interface ParsedFlashcardDraft {
    title: string;
    difficulty: ProblemDifficulty;
    question: string;
    answer: string;
    url?: string;
    tags: string[];
    timeComplexity?: string;
    spaceComplexity?: string;
    codeSnippet?: string;
}

/**
 * Normalizes difficulty string to 'Easy' | 'Medium' | 'Hard'
 */
export function normalizeDifficulty(diff?: unknown): ProblemDifficulty {
    if (typeof diff !== 'string') return 'Medium';
    const clean = diff.trim().toLowerCase();
    if (clean.includes('easy')) return 'Easy';
    if (clean.includes('hard')) return 'Hard';
    if (clean.includes('medium')) return 'Medium';
    return 'Medium';
}

/**
 * Sanitizes and cleans complexity strings to ensure they remain concise Big-O notation,
 * stripping extraneous sentences or paragraphs if the LLM leaked explanations.
 */
export function cleanComplexity(raw?: unknown): string | undefined {
    if (typeof raw !== 'string') return undefined;
    const trimmed = raw.trim();
    if (!trimmed) return undefined;

    // If string has a clear Big-O pattern at the start (e.g. O(n), O(log n), O(1), O(V+E))
    const bigOMatch = trimmed.match(/^([O\u0398\u03A9]\s*\([^)]+\)|[O\u0398\u03A9]\s*\d+)/i);
    if (bigOMatch) {
        // If there is extra explanatory text following the Big-O expression, extract just the Big-O
        if (trimmed.length > 25 || trimmed.includes(' - ') || trimmed.includes(': ') || trimmed.includes(', ')) {
            return bigOMatch[1].replace(/\s+/g, '');
        }
    }

    // If it has separators like " - " or ": "
    if (trimmed.includes(' - ') || trimmed.includes(': ')) {
        const firstPart = trimmed.split(/ - |: /)[0].trim();
        if (/^[O\u0398\u03A9]/i.test(firstPart) && firstPart.length <= 25) {
            return firstPart;
        }
    }

    // Limit maximum length to prevent paragraph leaks
    return trimmed.length > 30 ? trimmed.slice(0, 30).trim() : trimmed;
}

/**
 * Parses LLM JSON output from a string, handling markdown fences, loose wrappers, and raw arrays.
 */
export function parseLLMFlashcardResponse(
    rawText: string,
    fallbackUrl?: string
): ParsedFlashcardDraft[] {
    if (!rawText || !rawText.trim()) {
        throw new Error('Input is empty. Please paste the JSON output from your LLM.');
    }

    let cleaned = rawText.trim();

    // Strip markdown code fences if present (```json ... ``` or ``` ...)
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        cleaned = codeBlockMatch[1].trim();
    } else {
        // Find outermost [ ... ] or { ... }
        const firstBracket = cleaned.indexOf('[');
        const firstBrace = cleaned.indexOf('{');
        let startIndex = -1;
        let isArray = false;

        if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
            startIndex = firstBracket;
            isArray = true;
        } else if (firstBrace !== -1) {
            startIndex = firstBrace;
            isArray = false;
        }

        if (startIndex !== -1) {
            const lastIndex = isArray ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');
            if (lastIndex > startIndex) {
                cleaned = cleaned.substring(startIndex, lastIndex + 1).trim();
            }
        }
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(cleaned);
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Invalid JSON syntax';
        throw new Error(`Failed to parse JSON: ${errorMsg}. Please ensure the LLM provided valid JSON.`, {
            cause: err
        });
    }

    // Unwrap if wrapped in an object like { flashcards: [...] } or { cards: [...] }
    let rawCards: unknown[];
    if (Array.isArray(parsed)) {
        rawCards = parsed;
    } else if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        if (Array.isArray(obj.flashcards)) {
            rawCards = obj.flashcards;
        } else if (Array.isArray(obj.cards)) {
            rawCards = obj.cards;
        } else if (Array.isArray(obj.problems)) {
            rawCards = obj.problems;
        } else if (Array.isArray(obj.data)) {
            rawCards = obj.data;
        } else if (obj.question && obj.answer) {
            // Single flashcard object
            rawCards = [obj];
        } else {
            throw new Error(
                'Unexpected JSON structure. Expected a JSON array of flashcards, or an object containing a "flashcards" or "cards" list.'
            );
        }
    } else {
        throw new Error('Invalid JSON format: expected an array or object of flashcards.');
    }

    if (rawCards.length === 0) {
        throw new Error('No flashcards found in the provided JSON array.');
    }

    const drafts: ParsedFlashcardDraft[] = rawCards.map((item, idx) => {
        if (!item || typeof item !== 'object') {
            throw new Error(`Item #${idx + 1} is not a valid flashcard object.`);
        }
        const cardObj = item as Record<string, unknown>;

        const question = typeof cardObj.question === 'string' ? cardObj.question.trim() : '';
        const answer = typeof cardObj.answer === 'string' ? cardObj.answer.trim() : '';

        if (!question) {
            throw new Error(`Flashcard #${idx + 1} is missing a required "question" field.`);
        }
        if (!answer) {
            throw new Error(`Flashcard #${idx + 1} is missing a required "answer" field.`);
        }

        const rawTitle = typeof cardObj.title === 'string' && cardObj.title.trim()
            ? cardObj.title.trim()
            : question.slice(0, 40);
        // Keep title concise (no multi-line or paragraph titles)
        const title = rawTitle.split('\n')[0].slice(0, 80).trim();

        const difficulty = normalizeDifficulty(cardObj.difficulty);

        const cardUrl = typeof cardObj.url === 'string' && cardObj.url.trim()
            ? cardObj.url.trim()
            : (fallbackUrl?.trim() || undefined);

        let tags: string[] = [];
        if (Array.isArray(cardObj.tags)) {
            tags = cardObj.tags
                .filter(t => typeof t === 'string' && t.trim().length > 0)
                .map(t => (t as string).trim().slice(0, 30));
        }

        const timeComplexity = cleanComplexity(cardObj.timeComplexity);
        const spaceComplexity = cleanComplexity(cardObj.spaceComplexity);

        const codeSnippet = typeof cardObj.codeSnippet === 'string' && cardObj.codeSnippet.trim()
            ? cardObj.codeSnippet.trim()
            : undefined;

        return {
            title,
            difficulty,
            question,
            answer,
            url: cardUrl,
            tags,
            timeComplexity,
            spaceComplexity,
            codeSnippet
        };
    });

    return drafts;
}

/**
 * Converts validated drafts into full Flashcard objects with newly initialized FSRS-7 cards.
 */
export async function convertDraftsToFlashcards(
    drafts: ParsedFlashcardDraft[]
): Promise<Flashcard[]> {
    const flashcards: Flashcard[] = [];

    for (const draft of drafts) {
        const fsrsCard = await createNewSchedulerCard();
        flashcards.push({
            id: crypto.randomUUID(),
            title: draft.title,
            difficulty: draft.difficulty,
            url: draft.url,
            tags: draft.tags,
            question: draft.question,
            answer: draft.answer,
            timeComplexity: draft.timeComplexity,
            spaceComplexity: draft.spaceComplexity,
            codeSnippet: draft.codeSnippet,
            createdAt: Date.now(),
            fsrs: fsrsCard
        });
    }

    return flashcards;
}

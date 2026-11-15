import { DefaultScheduler, Rating } from "ts-fsrs";
import type { DefaultSchedulerCard, DefaultSchedulerCardInput, Grade } from "ts-fsrs";

export { Rating };

export type FSRSCardType = DefaultSchedulerCard<'FSRS-7'>;
export type FSRSCardInputType = DefaultSchedulerCardInput<'FSRS-7'>;

type SchedulerType = Awaited<ReturnType<typeof DefaultScheduler<'FSRS-7'>>>;
let schedulerPromise: Promise<SchedulerType> | null = null;

export async function getScheduler(): Promise<SchedulerType> {
    if (!schedulerPromise) {
        schedulerPromise = DefaultScheduler<'FSRS-7'>({ version: 'FSRS-7' });
    }
    return schedulerPromise;
}

export async function createNewSchedulerCard(): Promise<FSRSCardType> {
    const scheduler = await getScheduler();
    return scheduler.newCard();
}

/**
 * FSRS-7 Dual Memory State Sanitization:
 *
 * In FSRS-7, the memory model tracks dual stabilities:
 *  - `stability`: Standard long-term memory stability.
 *  - `stabilityFast`: Short-term fast-decay stability (for same-day/short intervals).
 *
 * In ts-fsrs, the FSRS-7 scheduler enforces strict validation:
 *  1. Unreviewed cards must have: stability === 0 && stabilityFast === 0 && difficulty === 0
 *  2. Reviewed cards must have: stability > 0 && stabilityFast > 0
 *     (otherwise throwing `FSRSValidationError: Invalid FSRS7 memory state: both stabilities must be positive`).
 *
 * Significance of `0.8`:
 * In the official FSRS-7 specification in ts-fsrs (`models/fsrs-7.ts`), initial stabilityFast
 * is calculated as: `stabilityFast = roundTo(stability * 0.8, 8)`.
 * When cards saved under earlier schemas (FSRS-4/5/6) exist in localStorage without `stabilityFast`,
 * this ratio accurately migrates their memory state without corrupting scheduling intervals.
 */
function sanitizeMemoryState(card: FSRSCardType): FSRSCardType {
    // Legacy migration: card was reviewed under an older schema, but lacks stabilityFast
    if (card.stability > 0 && card.stabilityFast <= 0) {
        return {
            ...card,
            stabilityFast: Number((card.stability * 0.8).toFixed(8))
        };
    }

    // New/unreviewed card: ensure all 3 memory state fields are strictly 0
    if (card.stability <= 0 || card.stabilityFast <= 0) {
        return {
            ...card,
            stability: 0,
            stabilityFast: 0,
            difficulty: 0
        };
    }

    return card;
}

export async function reviewFSRSCard(
    card: FSRSCardType,
    grade: Grade
): Promise<FSRSCardType> {
    const scheduler = await getScheduler();
    const result = scheduler.review({ card: sanitizeMemoryState(card), grade });
    return result.card;
}

export function formatInterval(dueDate: Date, baseDate: Date = new Date()): string {
    const diffMs = dueDate.getTime() - baseDate.getTime();
    if (diffMs <= 0) return "now";

    const diffMinutes = Math.round(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `${Math.max(1, diffMinutes)}m`;

    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return `${diffDays}d`;

    const diffMonths = Math.round(diffDays / 30.4);
    if (diffMonths < 12) return `${diffMonths}mo`;

    const diffYears = (diffDays / 365.25).toFixed(1);
    return `${diffYears}y`;
}

export async function getNextIntervalEstimates(
    card: FSRSCardType,
    baseDate: Date = new Date()
): Promise<Record<Grade, string>> {
    const scheduler = await getScheduler();
    const estimates: Record<Grade, string> = {
        1: '<1m',
        2: '~12h',
        3: '~3d',
        4: '~1w'
    };

    const sanitized = sanitizeMemoryState(card);
    const reviewGrades: Grade[] = [1, 2, 3, 4];

    for (const g of reviewGrades) {
        try {
            const preview = scheduler.review({ card: sanitized, grade: g });
            estimates[g] = formatInterval(preview.card.dueAt, baseDate);
        } catch {
            // Keep default fallback
        }
    }

    return estimates;
}

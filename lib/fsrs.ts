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

function sanitizeMemoryState(card: FSRSCardType): FSRSCardType {
    if (card.stability > 0 && card.stabilityFast <= 0) {
        return {
            ...card,
            stabilityFast: Number((card.stability * 0.8).toFixed(8))
        };
    }
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

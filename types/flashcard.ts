import type { DefaultSchedulerCard } from "ts-fsrs";

export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';

export type CardType = DefaultSchedulerCard<'FSRS-7'>;

export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    title?: string;
    difficulty?: ProblemDifficulty;
    codeSnippet?: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    url?: string;
    tags?: string[];
    createdAt?: number;
    fsrs: CardType;
}

export type FSRSCard = Omit<CardType, "dueAt" | "lastReviewAt"> & {
    dueAt: number;
    lastReviewAt: number | null;
};

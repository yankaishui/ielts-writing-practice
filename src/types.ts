export const questionTypes = [
  "Opinion",
  "Discussion",
  "Advantages / Disadvantages",
  "Problem / Solution",
  "Two-part Question",
] as const;
export const languageCategories = [
  "Spelling",
  "Capitalization",
  "Article",
  "Singular/Plural",
  "Subject-Verb Agreement",
  "Tense",
  "Preposition",
  "Pronoun",
  "Word Form",
  "Word Choice",
  "Collocation",
  "Sentence Structure",
  "Sentence Fragment",
  "Run-on Sentence",
  "Punctuation",
] as const;
export const writingCategories = [
  "Task Understanding",
  "Position Clarity",
  "Idea Development",
  "Supporting Detail",
  "Logical Organisation",
  "Repetition",
] as const;
export const strengthCategories = [
  "Vocabulary",
  "Collocation",
  "Sentence Structure",
  "Logical Organisation",
  "Idea Development",
  "Supporting Detail",
  "Introduction",
  "Conclusion",
] as const;
export const dimensions = {
  taskUnderstanding: "Task Understanding",
  positionClarity: "Position Clarity",
  ideaDevelopment: "Idea Development",
  supportingDetail: "Supporting Detail",
  logicalOrganisation: "Logical Organisation",
  vocabularyUse: "Vocabulary Use",
  grammarAccuracy: "Grammar Accuracy",
  sentenceRange: "Sentence Range",
} as const;
export const scoreLabels = {
  taskResponse: "Task Response",
  coherenceCohesion: "Coherence and Cohesion",
  lexicalResource: "Lexical Resource",
  grammaticalRangeAccuracy: "Grammatical Range and Accuracy",
} as const;
export type Dimension = keyof typeof dimensions;
export type ScoreKey = keyof typeof scoreLabels;
export interface Question {
  custom?: boolean;
  provided?: { year: number; number: number };
  source?: { url: string; name: string };
  id: string;
  text: string;
  questionType: (typeof questionTypes)[number];
  topic: string;
}
export interface ScoreResult {
  score: number;
  reason: string;
}
export type DiagnosticScores = Record<Dimension, number>;
export interface Problem {
  type: "language_error" | "writing_issue";
  category: string;
  confidence: "High" | "Medium" | null;
  originalQuote: string;
  correction: string;
  explanation: string;
  howToImprove: string;
  otherOccurrences: string[];
}
export interface Strength {
  category: string;
  originalQuote: string;
  whyItWorks: string;
}
export interface Upgrade {
  original: string;
  improved: string;
  reason: string;
}
export interface UsefulExpression {
  expression: string;
  meaning: string;
  example: string;
  source: "Student" | "Suggested";
}
export interface Assessment {
  scores: Record<ScoreKey, ScoreResult>;
  diagnostics: DiagnosticScores;
  problems: Problem[];
  strengths: Strength[];
  upgrades: Upgrade[];
  usefulExpressions: UsefulExpression[];
  nextPriority: { dimension: string; reason: string; action: string };
}
export interface FocusEvent {
  startTime: string;
  returnTime: string;
  duration: number;
}
export type PracticeKind =
  "Full Essay" | "Introduction" | "Body Paragraph" | "Conclusion";
export interface EssayAttempt {
  id: string;
  questionId: string;
  question: string;
  questionType: Question["questionType"];
  topic: string;
  text: string;
  startTime: string;
  finishTime: string;
  duration: number;
  wordCount: number;
  focusEvents: FocusEvent[];
  totalTimeAway: number;
  longestPause: number;
  inputEvents: number;
  createdAt: string;
  mode: "Practice" | "Strict";
  kind: PracticeKind;
  version: "Exam" | "Revision" | "Rewrite";
  parentId?: string;
  demo?: boolean;
}
export interface SavedExpression {
  id: string;
  expression: string;
  meaning: string;
  example: string;
  sourceEssayId: string;
  type: "Strength" | "Useful Expression" | "Upgrade";
  dateSaved: string;
  status: "Learning" | "Mastered";
}
export interface UserStats {
  essaysCompleted: number;
  sessionsThisWeek: number;
  currentStreak: number;
  latestBand: number | null;
  weakestArea: string | null;
}
export interface Draft {
  key: string;
  text: string;
  started: number | null;
  limit: number;
  mode: "Practice" | "Strict";
  focusEvents: FocusEvent[];
  awayStarted: number | null;
  lastInput: number | null;
  longestPause: number;
  inputEvents: number;
}

export interface FocusPractice {
  id: string;
  essayId: string;
  dimension: string;
  goal: string;
  original: string;
  paragraphIndex: number;
  revised: string;
  startedAt: string;
  finishedAt: string | null;
  duration: number;
  checks: string[];
  reflection: string;
}

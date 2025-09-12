// Fix: The original file contained implementation logic and a circular import instead of type definitions. The content has been replaced with the correct exported types for the application.
export enum TestId {
    BELBIN = 'belbin',
    SOCIAL_COLOR = 'social_color',
    LEARNING_STYLE = 'learning_style',
}

export interface Score {
    id: string;
    name: string;
    score: number;
    color: string;
}

export interface QuestionOption {
    text: string;
    scores: Record<string, number>;
}

export interface Question {
    id: string;
    text: string;
    options: QuestionOption[];
}

export interface ResultProfile {
    name: string;
    color: string;
    description: string;
}

export interface Test {
    id: TestId;
    name: string;
    description: string;
    duration: string;
    questions: Question[];
    resultProfiles: Record<string, ResultProfile>;
}

export type UserAnswers = Record<string, QuestionOption>;

export interface TestResult {
    testId: TestId;
    testName: string;
    scores: Score[];
    interpretation: string;
    submitted_at: string; // Added completion date
}

export interface User {
    user_id: string;
    first_name: string;
    last_name: string;
}

export interface BootstrapPayload {
    first_name: string;
    last_name: string;
    kvkk_accept: boolean;
}

export interface BootstrapResponse {
    device_token: string;
    recovery_code: string;
    user: User;
}

export interface PairResponse {
    device_token: string;
    user: User;
}

export class ApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

// Types for the Orientation Module
export interface OrientationStep {
    id: string;
    type: 'welcome' | 'reading' | 'test';
    title: string;
    content: string; // Description or content for the step
    testId?: TestId; // Link to a test if type is 'test'
}

export type OrientationData = Record<string, { title: string; steps: OrientationStep[] }>;

// Type for saving test progress
export interface TestProgress {
    currentQuestionIndex: number;
    answers: UserAnswers;
}

// Type for the centralized Data Context
export interface DataContextType {
    tests: Test[];
    orientationData: OrientationData;
    allOrientationSteps: OrientationStep[];
    completedOrientationSteps: string[];
    pastResults: TestResult[];
    isLoading: boolean;
    refreshData: () => Promise<void>;
}

// Type for Gemini Chat
export interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  isLoading?: boolean;
}
// Core types
export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface Document {
  id: number;
  user_id: number;
  subject: string;
  file_type: string;
  file_key: string;
  original_filename: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export interface LearningSession {
  id: number;
  user_id: number;
  name: string;
  description: string;
  subject: "MATH" | "MEDICINE" | "COMPUTER_SCIENCE";
  created_at: string;
  updated_at: string;
  document_count?: number;
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

export interface MCQResponse {
  success: boolean;
  questions: MCQQuestion[];
  totalQuestions: number;
  sessionId: number;
  error?: string;
}

export interface CreateLearningSessionRequest {
  name: string;
  description: string;
  subject: "MATH" | "MEDICINE" | "COMPUTER_SCIENCE";
  documents: File[];
}

export interface LearningSessionResponse {
  success: boolean;
  session?: LearningSession;
  documents?: Document[];
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// UI State types
export type ViewType = "home" | "login" | "onboarding" | "dashboard";

export interface NewSessionForm {
  name: string;
  description: string;
  files: File[];
}

export interface MCQState {
  questions: MCQQuestion[];
  userAnswers: number[];
  submitted: boolean;
  score: { correct: number; total: number };
  loading: boolean;
}

// Subject mapping
export const SUBJECTS = ["Math", "Medicine", "Computer Science"] as const;
export type SubjectType = typeof SUBJECTS[number];

export const SUBJECT_MAP: Record<SubjectType, string> = {
  Math: "MATH",
  Medicine: "MEDICINE",
  "Computer Science": "COMPUTER_SCIENCE",
} as const;

export const REVERSE_SUBJECT_MAP: Record<string, SubjectType> = {
  MATH: "Math",
  MEDICINE: "Medicine",
  COMPUTER_SCIENCE: "Computer Science",
} as const;

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  score: number;
  totalTimeMs: number;
  isFinished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionClient {
  id: number;
  orderNum: number;
  question: string;
  options: string[];
}

export interface QuestionAdmin extends QuestionClient {
  correctIndex: number;
  explanation: string;
}

export interface PlayerAnswerRecord {
  id: number;
  playerId: string;
  questionId: number;
  questionText: string;
  options: string[];
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
  timeSpentMs: number;
  createdAt: string;
}

export interface SubmitAnswerPayload {
  playerId: string;
  questionId: number;
  selectedIndex: number | null; // null if time expired
  timeSpentMs: number;
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
  currentScore: number;
  totalTimeMs: number;
  isFinished: boolean;
  questionIndex: number;
  totalQuestions: number;
}

export interface LeaderboardEntry {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  score: number;
  totalTimeMs: number;
  isFinished: boolean;
  rank: number;
  answersCount: number;
}

export interface TriviaSettings {
  birthdayPerson: string;
  eventTitle: string;
  questionTimerSeconds: number;
}


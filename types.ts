export interface Student {
  code: string;
  name: string;
  group: string;
}

export interface Question {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface ExamConfig {
  type: 'Lesson' | 'Unit';
  title: string;
  questionCount: number;
  hardQuestions: number;
}

export interface Lesson {
  title: string;
}

export interface Unit {
  title: string;
  lessons: Lesson[];
}

export interface Term {
  termTitle: string;
  units: Unit[];
}

export type View = 'login' | 'dashboard' | 'exam' | 'results';
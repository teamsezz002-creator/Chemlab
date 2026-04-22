export type Reactivity = 'High' | 'Medium' | 'Low' | 'None';

export interface Metal {
  id: string;
  name: string;
  chemical: string;
  reactivity: Reactivity;
  description: string;
  color: string;
  iconType: string;
}

export interface Task {
  id: string;
  description: string;
  isCompleted: boolean;
}

export interface Scenario {
  id: number;
  title: string;
  intro: string;
  objective: string;
  targetMetalId?: string;
  targetWaterLevel?: number;
  quiz?: Quiz;
}

export interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface UserStats {
  score: number;
  level: number;
  completedLevels: number[];
  highestStreak: number;
}

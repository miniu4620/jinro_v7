export type PersonalityTypeId =
  | 'apple'
  | 'dragonfruit'
  | 'blueberry'
  | 'grapefruit'
  | 'banana'
  | 'strawberry'
  | 'watermelon'
  | 'lime'
  | 'carrot'
  | 'avocado';

export interface PersonalityType {
  id: PersonalityTypeId;
  name: string;
  nameKo: string;
  emoji: string;
  flavor: string;
  colorName: string;
  bgGradient: string;
  badgeColor: string;
  cardBorder: string;
  keywords: string[];
  summary: string;
  defaultDescription: string;
  recommendedFields: string[];
  recommendedMajors: string[];
  mentorQuotes: string[];
  craftKit: {
    title: string;
    description: string;
    clayColor: string;
    toppings: string[];
    sauce: string;
  };
}

export interface QuizChoice {
  text: string;
  subtext?: string;
  extraversion: number; // +1 for E, -1 for I
  feeling: number;      // +1 for F, -1 for T
  reaction: string;
  types: PersonalityTypeId[];
}

export interface QuizQuestion {
  id: number;
  scenario: string;
  title: string;
  badge: string;
  choices: [QuizChoice, QuizChoice];
}

export interface GuestbookEntry {
  id: string;
  nickname: string;
  personalityType: string;
  message: string;
  sticker: string;
  likes: number;
  createdAt: string;
}

export interface RankingRecord {
  id: string;
  nickname: string;
  timeSeconds: number;
  moves: number;
  createdAt: string;
}

export type AppScreen = 'start' | 'quiz' | 'result' | 'craft' | 'game' | 'guestbook';

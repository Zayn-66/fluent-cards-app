
export interface WordCard {
  id: string;
  english: string;
  chinese: string;
  order: number;
}

export interface VocabularyDeck {
  id: string;
  order: number;
  title: string;
  cards: WordCard[];
  createdAt: number;
}

export interface WrongWord extends WordCard {
  failedAt: number; // 时间戳
  errorCount: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  AUTH = 'AUTH',
  CREATE_DECK = 'CREATE_DECK',
  VIEW_DECK = 'VIEW_DECK',
  TEST_SETUP = 'TEST_SETUP',
  TESTING = 'TESTING',
  TEST_RESULT = 'TEST_RESULT',
  WRONG_WORDS = 'WRONG_WORDS',
  WRONG_WORDS_PRACTICE = 'WRONG_WORDS_PRACTICE',
  WRONG_WORDS_SUMMARY = 'WRONG_WORDS_SUMMARY', // 新增：错题复习总结
  FAVORITES = 'FAVORITES',
  REVIEW_SETUP = 'REVIEW_SETUP',
  AI_REVIEW_SESSION = 'AI_REVIEW_SESSION',
  AI_REVIEW_COMPLETE = 'AI_REVIEW_COMPLETE',
  AI_STORY_SESSION = 'AI_STORY_SESSION', // 新增：故事模式视图
  RECITATION_SETUP = 'RECITATION_SETUP',
  RECITATION_SESSION = 'RECITATION_SESSION'
}

export enum TestPhase {
  MULTIPLE_CHOICE = 1,
  INPUT_CHINESE = 2,
  INPUT_ENGLISH = 3
}

export enum ReviewMode {
  SENTENCE = 'SENTENCE',
  STORY = 'STORY'
}

export interface ReviewSentence {
  word: string;
  chinese: string;
  sentence: string;
  translation: string;
}

export interface StoryData {
  title: string;
  englishStory: string;
  chineseStory: string;
  targetWords: string[]; // 包含的单词列表
}

export interface RecitationWord extends WordCard {
  isHiddenEnglish: boolean;
  isHiddenChinese: boolean;
}

export interface TestResultRecord {
  id: string;
  word: string;
  correctAnswer: string;
  userInput: string;
  isCorrect: boolean;
  phase: TestPhase;
}

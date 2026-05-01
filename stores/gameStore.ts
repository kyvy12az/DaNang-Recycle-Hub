import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameBadge, GameQuestion, GameSummary, GameStreakTier, GameWasteGroup } from '@/types';
import { GAME_DAILY_PLAY_LIMIT, gameBadges, gameQuestions, gameStreakTiers } from '@/mocks/game';

const getDateKey = (date: Date) => date.toISOString().slice(0, 10);

const isConsecutiveDay = (previousDateKey: string | null, currentDateKey: string) => {
  if (!previousDateKey) return false;
  const previousDate = new Date(`${previousDateKey}T00:00:00`);
  const currentDate = new Date(`${currentDateKey}T00:00:00`);
  const diffDays = Math.round((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

interface GameState {
  totalPoints: number;
  dailyPoints: number;
  dailyPlaysUsed: number;
  dailyPlaysLimit: number;
  streakDays: number;
  lastPlayedDate: string | null;
  unlockedBadgeIds: string[];
  awardedStreakDays: number[];
  lastAnswerCorrect: boolean | null;
  lastQuestionId: string | null;
  questions: GameQuestion[];
  currentQuestionIndex: number;
  currentQuestion: GameQuestion | null;
  streakTiers: GameStreakTier[];
  badges: GameBadge[];

  hydrateGameDay: () => void;
  startGameSession: () => void;
  submitAnswer: (answer: GameWasteGroup) => { correct: boolean; pointsEarned: number; explanation: string } | null;
  nextQuestion: () => void;
  addPoints: (points: number) => void;
  claimStreakReward: (days: number) => number;
  resetDailyPlaysForDev: () => void;
  getSummary: () => GameSummary;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      totalPoints: 0,
      dailyPoints: 0,
      dailyPlaysUsed: 0,
      dailyPlaysLimit: GAME_DAILY_PLAY_LIMIT,
      streakDays: 0,
      lastPlayedDate: null,
      unlockedBadgeIds: [],
      awardedStreakDays: [],
      lastAnswerCorrect: null,
      lastQuestionId: null,
      questions: gameQuestions,
      currentQuestionIndex: 0,
      currentQuestion: gameQuestions[0] || null,
      streakTiers: gameStreakTiers,
      badges: gameBadges,

      hydrateGameDay: () => {
        const currentDateKey = getDateKey(new Date());
        const previousDateKey = get().lastPlayedDate;

        if (previousDateKey === currentDateKey) {
          return;
        }

        set((state) => ({
          dailyPoints: 0,
          dailyPlaysUsed: 0,
          lastPlayedDate: currentDateKey,
          streakDays: isConsecutiveDay(previousDateKey, currentDateKey) ? state.streakDays + 1 : previousDateKey ? 1 : state.streakDays || 1,
        }));
      },

      startGameSession: () => {
        const pickedQuestions = [...gameQuestions].sort(() => Math.random() - 0.5);
        set({
          questions: pickedQuestions,
          currentQuestionIndex: 0,
          currentQuestion: pickedQuestions[0] || null,
        });
      },

      submitAnswer: (answer) => {
        const question = get().currentQuestion;
        if (!question || get().dailyPlaysUsed >= get().dailyPlaysLimit) {
          return null;
        }

        const isCorrect = question.answer === answer;
        const pointsEarned = isCorrect ? 20 : 5;
        const nextDailyPoints = get().dailyPoints + pointsEarned;
        const nextTotalPoints = get().totalPoints + pointsEarned;

        const unlockedBadgeIds = get().badges
          .filter((badge) => nextTotalPoints >= badge.pointsRequired)
          .map((badge) => badge.id);

        set((state) => ({
          totalPoints: nextTotalPoints,
          dailyPoints: nextDailyPoints,
          dailyPlaysUsed: state.dailyPlaysUsed + 1,
          lastAnswerCorrect: isCorrect,
          lastQuestionId: question.id,
          unlockedBadgeIds,
          badges: state.badges.map((badge) => ({
            ...badge,
            unlocked: nextTotalPoints >= badge.pointsRequired,
          })),
        }));

        return {
          correct: isCorrect,
          pointsEarned,
          explanation: question.explanation,
        };
      },

      nextQuestion: () => {
        const nextIndex = get().currentQuestionIndex + 1;
        const nextQuestion = get().questions[nextIndex] || null;
        set({ currentQuestionIndex: nextIndex, currentQuestion: nextQuestion });
      },

      addPoints: (points) =>
        set((state) => ({
          totalPoints: state.totalPoints + points,
          dailyPoints: state.dailyPoints + points,
        })),

      claimStreakReward: (days) => {
        const tier = get().streakTiers.find((item) => item.days === days);
        if (!tier) return 0;
        if (get().awardedStreakDays.includes(days)) return 0;

        set((state) => ({
          totalPoints: state.totalPoints + tier.rewardPoints,
          dailyPoints: state.dailyPoints + tier.rewardPoints,
          awardedStreakDays: [...state.awardedStreakDays, days],
        }));

        return tier.rewardPoints;
      },

      resetDailyPlaysForDev: () => {
        const pickedQuestions = [...gameQuestions].sort(() => Math.random() - 0.5);
        set({
          dailyPoints: 0,
          dailyPlaysUsed: 0,
          dailyPlaysLimit: GAME_DAILY_PLAY_LIMIT,
          lastAnswerCorrect: null,
          lastQuestionId: null,
          lastPlayedDate: getDateKey(new Date()),
          questions: pickedQuestions,
          currentQuestionIndex: 0,
          currentQuestion: pickedQuestions[0] || null,
        });
      },

      getSummary: () => ({
        totalPoints: get().totalPoints,
        dailyPoints: get().dailyPoints,
        dailyPlaysUsed: get().dailyPlaysUsed,
        dailyPlaysLimit: get().dailyPlaysLimit,
        streakDays: get().streakDays,
        unlockedBadgeIds: get().unlockedBadgeIds,
        lastPlayedDate: get().lastPlayedDate,
      }),
    }),
    {
      name: 'game-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        totalPoints: state.totalPoints,
        dailyPoints: state.dailyPoints,
        dailyPlaysUsed: state.dailyPlaysUsed,
        dailyPlaysLimit: state.dailyPlaysLimit,
        streakDays: state.streakDays,
        lastPlayedDate: state.lastPlayedDate,
        unlockedBadgeIds: state.unlockedBadgeIds,
        awardedStreakDays: state.awardedStreakDays,
      }),
    }
  )
);
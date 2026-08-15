export const STAR_VALUES = {
  HABIT_DAY: 1,
  CHORE_STANDARD: 2,
  CHORE_BIG: 5,
  NOMINATION_KINDNESS: 5,
  NOMINATION_ABOVE_AND_BEYOND: 10,
} as const;

export const DEFAULT_HABIT_TARGET_BONUS = 2;

export const MIN_ACTIVE_HABITS_PER_PLAYER = 3;
export const MAX_ACTIVE_HABITS_PER_PLAYER = 5;
export const MAX_NOMINATIONS_GIVEN_PER_WEEK = 3;
export const SHIELDS_PER_QUARTER = 1;
export const CASH_OUT_MIN_STARS = 400;

/** Bonus is awarded exactly when a player's consecutive-complete-week streak reaches this length. */
export const STREAK_BONUSES: { weeks: number; bonus: number }[] = [
  { weeks: 2, bonus: 5 },
  { weeks: 4, bonus: 10 },
  { weeks: 8, bonus: 20 },
  { weeks: 12, bonus: 30 },
  { weeks: 24, bonus: 75 },
  { weeks: 52, bonus: 200 },
];

/** Cost no stars — unlocked once lifetime stars reach the threshold. */
export const MID_SEASON_MILESTONES: { stars: number; unlocks: string }[] = [
  { stars: 200, unlocks: "Pick the Friday movie" },
  { stars: 300, unlocks: "Pick a restaurant, family goes" },
  { stars: 500, unlocks: "A day out of your choosing" },
];

export type ChoreTier = "STANDARD" | "BIG";
export type NominationTier = "KINDNESS" | "ABOVE_AND_BEYOND";
export type WeekStatus = "OPEN" | "LOCKED";

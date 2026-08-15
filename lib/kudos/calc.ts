import {
  CASH_OUT_MIN_STARS,
  STAR_VALUES,
  STREAK_BONUSES,
  type ChoreTier,
  type NominationTier,
} from "./constants";

export interface HabitProgressInput {
  habitId: string;
  weeklyTargetDays: number;
  targetBonusStars: number;
  daysChecked: number;
}

export interface PlayerWeekInput {
  habits: HabitProgressInput[];
  chores: { tier: ChoreTier }[];
  nominationsReceived: { tier: NominationTier }[];
  deductions: { stars: number }[];
  priorStreakLength: number;
  shieldAvailable: boolean;
}

export interface WeekResultCalc {
  habitStars: number;
  habitTargetBonusStars: number;
  choreStars: number;
  nominationStars: number;
  deductionStars: number;
  streakBonusStars: number;
  weekComplete: boolean;
  shieldUsed: boolean;
  streakLengthAfter: number;
  totalStars: number;
}

function choreStarValue(tier: ChoreTier): number {
  return tier === "BIG" ? STAR_VALUES.CHORE_BIG : STAR_VALUES.CHORE_STANDARD;
}

function nominationStarValue(tier: NominationTier): number {
  return tier === "ABOVE_AND_BEYOND"
    ? STAR_VALUES.NOMINATION_ABOVE_AND_BEYOND
    : STAR_VALUES.NOMINATION_KINDNESS;
}

function streakBonusFor(streakLength: number): number {
  return STREAK_BONUSES.find((b) => b.weeks === streakLength)?.bonus ?? 0;
}

/**
 * Pure star/streak math for one player's week. No I/O — same function backs
 * both the live GM preview and the huddle lock, so they can never diverge.
 */
export function calcWeekResult(input: PlayerWeekInput): WeekResultCalc {
  const habitStars = input.habits.reduce((sum, h) => sum + h.daysChecked * STAR_VALUES.HABIT_DAY, 0);

  const habitTargetBonusStars = input.habits.reduce(
    (sum, h) => sum + (h.daysChecked >= h.weeklyTargetDays ? h.targetBonusStars : 0),
    0,
  );

  const choreStars = input.chores.reduce((sum, c) => sum + choreStarValue(c.tier), 0);

  const nominationStars = input.nominationsReceived.reduce(
    (sum, n) => sum + nominationStarValue(n.tier),
    0,
  );

  const deductionStars = -input.deductions.reduce((sum, d) => sum + d.stars, 0);

  // A week with no active habits can't be judged "complete" — nothing was hit.
  const weekComplete =
    input.habits.length > 0 && input.habits.every((h) => h.daysChecked >= h.weeklyTargetDays);

  const shieldUsed = !weekComplete && input.shieldAvailable;
  const effectiveComplete = weekComplete || shieldUsed;

  const streakLengthAfter = effectiveComplete ? input.priorStreakLength + 1 : 0;
  const streakBonusStars = streakBonusFor(streakLengthAfter);

  const totalStars =
    habitStars +
    habitTargetBonusStars +
    choreStars +
    nominationStars +
    deductionStars +
    streakBonusStars;

  return {
    habitStars,
    habitTargetBonusStars,
    choreStars,
    nominationStars,
    deductionStars,
    streakBonusStars,
    weekComplete,
    shieldUsed,
    streakLengthAfter,
    totalStars,
  };
}

export function canCashOut(lifetimeStars: number): boolean {
  return lifetimeStars >= CASH_OUT_MIN_STARS;
}

export function giftValueCents(lifetimeStars: number, baseRateCents: number): number {
  return lifetimeStars * baseRateCents;
}

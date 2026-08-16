import { differenceInCalendarWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";
import { calcWeekResult, type PlayerWeekInput, type WeekResultCalc } from "./calc";
import { DEFAULT_HABIT_TARGET_BONUS, STREAK_SHIELDS_PER_QUARTER } from "./constants";
import { weekBounds } from "./week";

async function getGameSettings() {
  const season = await prisma.season.findFirst({ orderBy: { startDate: "desc" } });
  if (!season) throw new Error("No season configured — run the seed script first");
  return season;
}

/**
 * Finds the Week row containing `date`, creating it if needed. weekNumber is derived
 * from the chronological offset from the season's first week — not "last created + 1" —
 * so it stays correct no matter what order weeks get touched in.
 */
export async function getOrCreateWeekFor(date: Date) {
  const season = await getGameSettings();
  const { start, end } = weekBounds(date);

  const existing = await prisma.week.findFirst({
    where: { seasonId: season.id, startDate: start },
  });
  if (existing) return existing;

  const seasonFirstWeekStart = weekBounds(season.startDate).start;
  const weekNumber =
    differenceInCalendarWeeks(start, seasonFirstWeekStart, { weekStartsOn: 1 }) + 1;

  return prisma.week.create({
    data: {
      seasonId: season.id,
      weekNumber,
      startDate: start,
      endDate: end,
      status: "OPEN",
    },
  });
}

/** The week to show/act on right now — clamped to the season's first week if opened early. */
export async function getCurrentWeek() {
  const season = await getGameSettings();
  const now = new Date();
  const referenceDate = now < season.startDate ? season.startDate : now;
  return getOrCreateWeekFor(referenceDate);
}

export async function getPlayers() {
  return prisma.player.findMany({ orderBy: { sortOrder: "asc" } });
}

/** Active habits for a player during a given week. validToWeek is an exclusive end boundary. */
export async function getActiveHabits(playerId: string, weekId: string) {
  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekId },
    select: { startDate: true },
  });

  return prisma.habit.findMany({
    where: {
      playerId,
      validFromWeek: { startDate: { lte: week.startDate } },
      OR: [
        { validToWeekId: null },
        { validToWeek: { startDate: { gt: week.startDate } } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
}

async function getPriorStreakLength(playerId: string, beforeWeekStart: Date): Promise<number> {
  const lastResult = await prisma.weekResult.findFirst({
    where: { playerId, week: { startDate: { lt: beforeWeekStart } } },
    orderBy: { week: { startDate: "desc" } },
  });
  return lastResult?.streakLengthAfter ?? 0;
}

function calendarQuarterIndex(date: Date): number {
  return date.getFullYear() * 4 + Math.floor(date.getMonth() / 3);
}

/** Two shields are added each calendar quarter; unused shields carry forward. */
export async function streakShieldBalance(playerId: string, asOf: Date = new Date()): Promise<number> {
  const firstSeason = await prisma.season.findFirst({
    orderBy: { startDate: "asc" },
    select: { startDate: true },
  });
  if (!firstSeason || asOf < firstSeason.startDate) return 0;

  const quartersEarned =
    calendarQuarterIndex(asOf) - calendarQuarterIndex(firstSeason.startDate) + 1;
  const used = await prisma.streakShieldUse.count({
    where: { playerId, week: { startDate: { lte: asOf } } },
  });

  return Math.max(0, quartersEarned * STREAK_SHIELDS_PER_QUARTER - used);
}

/** Assembles calc.ts input for one player/week straight from the database. */
export async function buildPlayerWeekInput(
  playerId: string,
  weekId: string,
  options: { useShield?: boolean } = {},
): Promise<PlayerWeekInput> {
  const week = await prisma.week.findUniqueOrThrow({ where: { id: weekId } });
  const habits = await getActiveHabits(playerId, weekId);

  const habitsWithChecks = await Promise.all(
    habits.map(async (habit) => {
      const daysChecked = await prisma.habitCheck.count({
        where: { habitId: habit.id, weekId, done: true },
      });
      return {
        habitId: habit.id,
        weeklyTargetDays: habit.weeklyTargetDays,
        targetBonusStars: habit.targetBonusStars ?? DEFAULT_HABIT_TARGET_BONUS,
        daysChecked,
      };
    }),
  );

  const [chores, nominationsReceived, deductions, priorStreakLength, shieldBalance] = await Promise.all([
    prisma.chore.findMany({ where: { weekId, playerId }, select: { tier: true } }),
    prisma.nomination.findMany({ where: { weekId, toPlayerId: playerId }, select: { tier: true } }),
    prisma.deduction.findMany({ where: { weekId, playerId }, select: { stars: true } }),
    getPriorStreakLength(playerId, week.startDate),
    streakShieldBalance(playerId, week.startDate),
  ]);

  return {
    habits: habitsWithChecks,
    chores: chores as { tier: "STANDARD" | "BIG" }[],
    nominationsReceived: nominationsReceived as { tier: "KINDNESS" | "ABOVE_AND_BEYOND" }[],
    deductions,
    priorStreakLength,
    shieldAvailable: shieldBalance > 0,
    useShield: options.useShield ?? false,
  };
}

/** Live, unsaved preview — same calc as lockWeek, so it can never diverge from what gets banked. */
export async function previewPlayerWeekResult(playerId: string, weekId: string): Promise<WeekResultCalc> {
  const input = await buildPlayerWeekInput(playerId, weekId);
  return calcWeekResult(input);
}

/** % of this week's active-habit targets hit so far, each habit capped at 100% of its own target. */
export async function weeklyCompletionPercent(playerId: string, weekId: string): Promise<number> {
  const input = await buildPlayerWeekInput(playerId, weekId);
  if (input.habits.length === 0) return 0;
  const totalTarget = input.habits.reduce((sum, h) => sum + h.weeklyTargetDays, 0);
  const totalChecked = input.habits.reduce(
    (sum, h) => sum + Math.min(h.daysChecked, h.weeklyTargetDays),
    0,
  );
  return totalTarget === 0 ? 0 : Math.round((totalChecked / totalTarget) * 100);
}

export async function latestStreakLength(playerId: string): Promise<number> {
  const lastResult = await prisma.weekResult.findFirst({
    where: { playerId },
    orderBy: { week: { startDate: "desc" } },
  });
  return lastResult?.streakLengthAfter ?? 0;
}

export async function nominationsGivenCountThisWeek(playerId: string, weekId: string): Promise<number> {
  return prisma.nomination.count({ where: { weekId, fromPlayerId: playerId } });
}

/** Sum of totalStars across all locked weeks for a player — the banked lifetime total. */
export async function playerStarBalance(playerId: string): Promise<{
  earned: number;
  cashedOut: number;
  available: number;
}> {
  const [earnedResult, cashOutResult] = await Promise.all([
    prisma.weekResult.aggregate({
      where: { playerId },
      _sum: { totalStars: true },
    }),
    prisma.cashOut.aggregate({
      where: { playerId },
      _sum: { points: true },
    }),
  ]);

  const earned = earnedResult._sum.totalStars ?? 0;
  const cashedOut = cashOutResult._sum.points ?? 0;
  return { earned, cashedOut, available: Math.max(0, earned - cashedOut) };
}

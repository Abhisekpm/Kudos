"use server";

import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireGm } from "@/lib/session";
import {
  buildPlayerWeekInput,
  getActiveHabits,
  getCurrentWeek,
  getOrCreateWeekFor,
  getPlayers,
  nominationsGivenCountThisWeek,
} from "@/lib/kudos/data";
import { calcWeekResult } from "@/lib/kudos/calc";
import {
  MAX_ACTIVE_HABITS_PER_PLAYER,
  MAX_NOMINATIONS_GIVEN_PER_WEEK,
  MIN_ACTIVE_HABITS_PER_PLAYER,
} from "@/lib/kudos/constants";

async function assertWeekOpen(weekId: string) {
  const week = await prisma.week.findUniqueOrThrow({ where: { id: weekId } });
  if (week.status === "LOCKED") {
    throw new Error("This week is locked — it can't be edited anymore.");
  }
  return week;
}

function assertHabitTargetDays(weeklyTargetDays: number) {
  if (!Number.isInteger(weeklyTargetDays) || weeklyTargetDays < 1 || weeklyTargetDays > 7) {
    throw new Error("A habit goal must be between 1 and 7 days per week.");
  }
}

async function getNextWeek() {
  const currentWeek = await getCurrentWeek();
  const nextWeekStart = new Date(currentWeek.endDate);
  nextWeekStart.setDate(nextWeekStart.getDate() + 1);
  return getOrCreateWeekFor(nextWeekStart);
}

export async function setHabitCheck(habitId: string, dateIso: string, done: boolean) {
  await requireGm();
  if (typeof done !== "boolean") {
    throw new Error("Habit check state must be true or false.");
  }

  const week = await getCurrentWeek();
  await assertWeekOpen(week.id);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(week.startDate, index));
  const date = weekDays.find((day) => day.toISOString().slice(0, 10) === dateIso);
  if (!date) throw new Error("Habit checks must be inside the current week.");

  const habit = await prisma.habit.findUniqueOrThrow({ where: { id: habitId } });

  const activeHabits = await getActiveHabits(habit.playerId, week.id);
  if (!activeHabits.some((activeHabit) => activeHabit.id === habit.id)) {
    throw new Error("This habit is not active for the current week.");
  }

  const dateRangeStart = new Date(`${dateIso}T00:00:00.000Z`);
  const dateRangeEnd = new Date(dateRangeStart);
  dateRangeEnd.setUTCDate(dateRangeEnd.getUTCDate() + 1);
  const existing = await prisma.habitCheck.findFirst({
    where: {
      habitId,
      weekId: week.id,
      date: { gte: dateRangeStart, lt: dateRangeEnd },
    },
  });

  if (done && !existing) {
    await prisma.habitCheck.create({
      data: { habitId, weekId: week.id, playerId: habit.playerId, date, done: true },
    });
  } else if (done && existing && !existing.done) {
    await prisma.habitCheck.update({
      where: { id: existing.id },
      data: { done: true },
    });
  } else if (!done && existing) {
    await prisma.habitCheck.delete({ where: { id: existing.id } });
  }

  revalidatePath("/gm");
  revalidatePath("/gm/week");
  revalidatePath("/play");
  revalidatePath(`/play/${habit.playerId}`);

  return { checked: done };
}

export async function addChore(playerId: string, tier: "STANDARD" | "BIG", description: string) {
  await requireGm();
  const week = await getCurrentWeek();
  await assertWeekOpen(week.id);

  await prisma.chore.create({
    data: { weekId: week.id, playerId, tier, description, date: new Date() },
  });

  revalidatePath("/gm");
  revalidatePath("/play");
}

export async function addNomination(
  fromPlayerId: string,
  toPlayerId: string,
  tier: "KINDNESS" | "ABOVE_AND_BEYOND",
  reason: string,
) {
  await requireGm();
  if (fromPlayerId === toPlayerId) {
    throw new Error("No self-nominations.");
  }

  const week = await getCurrentWeek();
  await assertWeekOpen(week.id);

  const givenCount = await nominationsGivenCountThisWeek(fromPlayerId, week.id);
  if (givenCount >= MAX_NOMINATIONS_GIVEN_PER_WEEK) {
    throw new Error(`Max ${MAX_NOMINATIONS_GIVEN_PER_WEEK} nominations given per week.`);
  }

  await prisma.nomination.create({
    data: { weekId: week.id, fromPlayerId, toPlayerId, tier, reason, date: new Date() },
  });

  revalidatePath("/gm");
  revalidatePath("/play");
}

export async function addDeduction(playerId: string, stars: number, reason: string) {
  await requireGm();
  if (stars <= 0) {
    throw new Error("Deduction must be a positive number of stars.");
  }
  const week = await getCurrentWeek();
  await assertWeekOpen(week.id);

  await prisma.deduction.create({
    data: { weekId: week.id, playerId, stars, reason },
  });

  revalidatePath("/gm");
  revalidatePath("/play");
}

/** Closes the current habit and opens a replacement starting next week, per §3. */
export async function swapHabit(
  oldHabitId: string,
  newName: string,
  newWeeklyTargetDays: number,
) {
  await requireGm();
  assertHabitTargetDays(newWeeklyTargetDays);

  const oldHabit = await prisma.habit.findUniqueOrThrow({ where: { id: oldHabitId } });
  const nextWeek = await getNextWeek();

  await prisma.$transaction(async (tx) => {
    await tx.habit.update({
      where: { id: oldHabitId },
      data: { validToWeekId: nextWeek.id },
    });

    const scheduledReplacement = await tx.habit.findFirst({
      where: { replacesHabitId: oldHabit.id, validFromWeekId: nextWeek.id },
    });

    if (scheduledReplacement) {
      await tx.habit.update({
        where: { id: scheduledReplacement.id },
        data: { name: newName, weeklyTargetDays: newWeeklyTargetDays },
      });
    } else {
      await tx.habit.create({
        data: {
          playerId: oldHabit.playerId,
          name: newName,
          weeklyTargetDays: newWeeklyTargetDays,
          targetBonusStars: oldHabit.targetBonusStars,
          validFromWeekId: nextWeek.id,
          replacesHabitId: oldHabit.id,
        },
      });
    }
  });

  revalidatePath(`/gm/players/${oldHabit.playerId}`);
  revalidatePath("/gm");
  revalidatePath("/play");
}

export async function addHabit(playerId: string, name: string, weeklyTargetDays: number) {
  await requireGm();
  assertHabitTargetDays(weeklyTargetDays);

  const week = await getCurrentWeek();
  const activeHabits = await getActiveHabits(playerId, week.id);
  if (activeHabits.length >= MAX_ACTIVE_HABITS_PER_PLAYER) {
    throw new Error(`Max ${MAX_ACTIVE_HABITS_PER_PLAYER} active habits per player.`);
  }

  await prisma.habit.create({
    data: { playerId, name, weeklyTargetDays, targetBonusStars: 2, validFromWeekId: week.id },
  });

  revalidatePath(`/gm/players/${playerId}`);
  revalidatePath("/gm");
  revalidatePath("/play");
}

export async function retireHabit(habitId: string) {
  await requireGm();

  const habit = await prisma.habit.findUniqueOrThrow({ where: { id: habitId } });
  const nextWeek = await getNextWeek();
  const nextWeekHabits = await getActiveHabits(habit.playerId, nextWeek.id);

  if (nextWeekHabits.length <= MIN_ACTIVE_HABITS_PER_PLAYER) {
    throw new Error(`Each player must keep at least ${MIN_ACTIVE_HABITS_PER_PLAYER} active habits.`);
  }

  await prisma.$transaction([
    prisma.habit.deleteMany({
      where: { replacesHabitId: habit.id, validFromWeekId: nextWeek.id },
    }),
    prisma.habit.update({
      where: { id: habit.id },
      data: { validToWeekId: nextWeek.id },
    }),
  ]);

  revalidatePath(`/gm/players/${habit.playerId}`);
  revalidatePath("/gm");
  revalidatePath("/play");
}

export async function addChoreForm(formData: FormData) {
  const playerId = String(formData.get("playerId"));
  const tier = String(formData.get("tier")) as "STANDARD" | "BIG";
  const description = String(formData.get("description") ?? "").trim();
  if (!description) throw new Error("Chore needs a short description.");
  await addChore(playerId, tier, description);
}

export async function addNominationForm(formData: FormData) {
  const fromPlayerId = String(formData.get("fromPlayerId"));
  const toPlayerId = String(formData.get("toPlayerId"));
  const tier = String(formData.get("tier")) as "KINDNESS" | "ABOVE_AND_BEYOND";
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Nomination needs a short reason.");
  await addNomination(fromPlayerId, toPlayerId, tier, reason);
}

export async function addDeductionForm(formData: FormData) {
  const playerId = String(formData.get("playerId"));
  const stars = Number(formData.get("stars"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Deduction needs a reason — both parents must agree.");
  await addDeduction(playerId, stars, reason);
}

export async function addHabitForm(formData: FormData) {
  const playerId = String(formData.get("playerId"));
  const name = String(formData.get("name") ?? "").trim();
  const weeklyTargetDays = Number(formData.get("weeklyTargetDays"));
  if (!name) throw new Error("Habit needs a name.");
  await addHabit(playerId, name, weeklyTargetDays);
}

export async function swapHabitForm(formData: FormData) {
  const oldHabitId = String(formData.get("oldHabitId"));
  const name = String(formData.get("name") ?? "").trim();
  const weeklyTargetDays = Number(formData.get("weeklyTargetDays"));
  if (!name) throw new Error("Habit needs a name.");
  await swapHabit(oldHabitId, name, weeklyTargetDays);
}

export async function retireHabitForm(formData: FormData) {
  await retireHabit(String(formData.get("habitId")));
}

export async function lockCurrentWeek() {
  await requireGm();
  const week = await getCurrentWeek();
  await assertWeekOpen(week.id);

  const players = await getPlayers();

  await prisma.$transaction(async (tx) => {
    for (const player of players) {
      const input = await buildPlayerWeekInput(player.id, week.id);
      const result = calcWeekResult(input);

      await tx.weekResult.create({
        data: {
          weekId: week.id,
          playerId: player.id,
          habitStars: result.habitStars,
          habitTargetBonusStars: result.habitTargetBonusStars,
          choreStars: result.choreStars,
          nominationStars: result.nominationStars,
          deductionStars: result.deductionStars,
          streakBonusStars: result.streakBonusStars,
          weekComplete: result.weekComplete,
          shieldUsed: result.shieldUsed,
          streakLengthAfter: result.streakLengthAfter,
          totalStars: result.totalStars,
        },
      });

      if (result.shieldUsed) {
        const week1 = await tx.week.findUniqueOrThrow({ where: { id: week.id } });
        const quarter = `${week1.startDate.getFullYear()}-Q${Math.floor(week1.startDate.getMonth() / 3) + 1}`;
        await tx.streakShieldUse.create({
          data: { playerId: player.id, weekId: week.id, quarter },
        });
      }
    }

    await tx.week.update({
      where: { id: week.id },
      data: { status: "LOCKED", lockedAt: new Date() },
    });
  });

  revalidatePath("/gm");
  revalidatePath("/gm/week");
  revalidatePath("/play");
}

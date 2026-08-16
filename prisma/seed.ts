import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";
import { weekBounds } from "../lib/kudos/week";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const GAME_START = new Date("2026-08-03T00:00:00");

const PLAYERS = [
  { name: "Kashi", isParent: false, sortOrder: 0 },
  { name: "Eshaan", isParent: false, sortOrder: 1 },
  { name: "Nupur", isParent: true, sortOrder: 2 },
  { name: "Abhishek", isParent: true, sortOrder: 3 },
] as const;

const STARTING_HABITS: Record<string, { name: string; weeklyTargetDays: number }[]> = {
  Abhishek: [
    { name: "Gym", weeklyTargetDays: 3 },
    { name: "Meditate 10 min", weeklyTargetDays: 5 },
    { name: "Lights out by 11pm", weeklyTargetDays: 5 },
  ],
  Nupur: [
    { name: "Gym", weeklyTargetDays: 3 },
    { name: "Home-cooked dinner", weeklyTargetDays: 4 },
    { name: "Evening walk", weeklyTargetDays: 4 },
  ],
  Eshaan: [
    { name: "Gym", weeklyTargetDays: 4 },
    { name: "45 min on research goal", weeklyTargetDays: 4 },
    { name: "Assigned chores done without a reminder", weeklyTargetDays: 5 },
    { name: "Read something not for school", weeklyTargetDays: 3 },
  ],
  Kashi: [
    { name: "Read 20 min", weeklyTargetDays: 5 },
    { name: "Maths practice 20 min", weeklyTargetDays: 4 },
    { name: "TV/screens under 1 hr", weeklyTargetDays: 5 },
    { name: "Assigned chores done without a reminder", weeklyTargetDays: 5 },
  ],
};

async function main() {
  const game = await prisma.season.create({
    data: {
      name: "Ongoing game",
      startDate: GAME_START,
      baseRateCents: 10,
    },
  });

  const { start, end } = weekBounds(GAME_START);
  const week1 = await prisma.week.create({
    data: {
      seasonId: game.id,
      weekNumber: 1,
      startDate: start,
      endDate: end,
      status: "OPEN",
    },
  });

  for (const p of PLAYERS) {
    const player = await prisma.player.create({ data: p });

    for (const habit of STARTING_HABITS[p.name] ?? []) {
      await prisma.habit.create({
        data: {
          playerId: player.id,
          name: habit.name,
          weeklyTargetDays: habit.weeklyTargetDays,
          targetBonusStars: 2,
          validFromWeekId: week1.id,
        },
      });
    }
  }

  console.log(`Seeded ongoing game (${game.id}), Week 1 (${week1.id}), ${PLAYERS.length} players.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

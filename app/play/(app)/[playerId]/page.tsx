import { addDays } from "date-fns";
import Link from "next/link";
import { LogoStar, PlayerAvatar, StarCount } from "@/components/KudosUI";
import { CashOutForm } from "@/components/CashOutForm";
import { prisma } from "@/lib/prisma";
import { avatarForPlayer } from "@/lib/kudos/avatars";
import {
  getActiveHabits,
  getCurrentWeek,
  latestStreakLength,
  playerStarBalance,
  streakShieldBalance,
} from "@/lib/kudos/data";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  const week = await getCurrentWeek();
  const [habits, streak, starBalance, shieldBalance, recentCashOuts] = await Promise.all([
    getActiveHabits(playerId, week.id),
    latestStreakLength(playerId),
    playerStarBalance(playerId),
    streakShieldBalance(playerId, week.startDate),
    prisma.cashOut.findMany({
      where: { playerId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(week.startDate, i));

  const habitsWithDays = await Promise.all(
    habits.map(async (habit) => {
      const checks = await prisma.habitCheck.findMany({
        where: { habitId: habit.id, weekId: week.id, done: true },
      });
      const doneDays = weekDays.map((day) =>
        checks.some((check) => check.date.toISOString().slice(0, 10) === day.toISOString().slice(0, 10)),
      );
      return { habit, doneDays };
    }),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/play" className="text-sm text-kudos-ink/50">
        ← Back
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <PlayerAvatar name={player.name} src={avatarForPlayer(player.name)} size="lg" />
          <h1 className="text-3xl font-bold text-kudos-ink">{player.name}</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-full bg-kudos-purple-light px-3 py-1.5 text-sm font-bold text-kudos-purple-dark">
            🛡️ {shieldBalance} {shieldBalance === 1 ? "shield" : "shields"}
          </span>
          <span className="text-lg font-semibold text-kudos-purple">Streak #{streak}</span>
        </div>
      </header>

      <section className="rounded-3xl bg-kudos-card p-5 shadow-sm">
        <div className="grid grid-cols-[minmax(6rem,1.6fr)_repeat(7,minmax(1.5rem,1fr))] items-center gap-1 text-center text-sm text-kudos-ink/50 sm:grid-cols-[minmax(10rem,2fr)_repeat(7,minmax(1.75rem,1fr))] sm:gap-2">
          <span />
          {DAY_LABELS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        {habitsWithDays.map(({ habit, doneDays }) => (
          <div
            key={habit.id}
            className="mt-3 grid grid-cols-[minmax(6rem,1.6fr)_repeat(7,minmax(1.5rem,1fr))] items-center gap-1 sm:grid-cols-[minmax(10rem,2fr)_repeat(7,minmax(1.75rem,1fr))] sm:gap-2"
          >
            <div className="pr-2 break-words">
              <p className="text-sm font-medium leading-5 text-kudos-ink">{habit.name}</p>
              <p className="mt-0.5 text-xs font-medium text-kudos-purple-dark">
                Goal: {habit.weeklyTargetDays} {habit.weeklyTargetDays === 1 ? "day" : "days"}/week
              </p>
            </div>
            {doneDays.map((done, i) => (
              <span
                key={i}
                className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  done ? "bg-kudos-purple text-white" : "bg-kudos-purple-light text-kudos-ink/30"
                }`}
              >
                {done ? <LogoStar className="text-white" /> : null}
              </span>
            ))}
          </div>
        ))}
        {habitsWithDays.length === 0 ? (
          <p className="mt-3 text-sm text-kudos-ink/50">No active habits.</p>
        ) : null}
      </section>

      <section className="flex flex-col items-center gap-2 rounded-3xl bg-kudos-card p-6 shadow-sm sm:p-8">
        <p className="text-sm text-kudos-ink/60">Points available</p>
        <StarCount className="text-5xl text-kudos-ink">{starBalance.available}</StarCount>
        <p className="text-xs text-kudos-ink-soft">
          {starBalance.earned} earned · {starBalance.cashedOut} cashed out
        </p>
        <CashOutForm playerId={playerId} availablePoints={starBalance.available} />
      </section>

      {recentCashOuts.length > 0 ? (
        <section className="rounded-3xl bg-kudos-card p-5 shadow-sm">
          <h2 className="font-extrabold text-kudos-ink">Recent cash-outs</h2>
          <ul className="mt-3 divide-y divide-kudos-ink/8 text-sm">
            {recentCashOuts.map((cashOut) => (
              <li key={cashOut.id} className="flex items-center justify-between gap-4 py-2">
                <span className="text-kudos-ink-soft">{cashOut.createdAt.toLocaleDateString()}</span>
                <span className="font-bold text-kudos-ink">{cashOut.points} points</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-center text-xs leading-5 text-kudos-ink-soft">
        Two streak shields are added every three months. Unused shields carry forward and are only spent when chosen at the weekly huddle.
      </p>
    </div>
  );
}

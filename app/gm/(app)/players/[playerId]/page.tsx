import Link from "next/link";
import { format } from "date-fns";
import { HabitPlanEditor } from "@/components/HabitPlanEditor";
import { KudosBadge, KudosCard } from "@/components/KudosUI";
import { prisma } from "@/lib/prisma";
import { getActiveHabits, getCurrentWeek, getOrCreateWeekFor } from "@/lib/kudos/data";

export default async function PlayerHabitsPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const currentWeek = await getCurrentWeek();
  const nextWeekStart = new Date(currentWeek.endDate);
  nextWeekStart.setDate(nextWeekStart.getDate() + 1);
  const nextWeek = await getOrCreateWeekFor(nextWeekStart);

  const [player, habits, activeHabits, nextWeekHabits] = await Promise.all([
    prisma.player.findUniqueOrThrow({ where: { id: playerId } }),
    prisma.habit.findMany({ where: { playerId }, orderBy: { createdAt: "asc" } }),
    getActiveHabits(playerId, currentWeek.id),
    getActiveHabits(playerId, nextWeek.id),
  ]);

  const activeIds = new Set(activeHabits.map((habit) => habit.id));
  const pastHabits = habits.filter(
    (habit) => !activeIds.has(habit.id) && habit.validFromWeekId !== nextWeek.id,
  );
  const nextWeekRows = nextWeekHabits.map((habit) => ({
    key: habit.id,
    sourceHabitId:
      habit.validFromWeekId === nextWeek.id ? (habit.replacesHabitId ?? "") : habit.id,
    name: habit.name,
    weeklyTargetDays: habit.weeklyTargetDays,
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/gm" className="text-sm font-medium text-kudos-ink-soft hover:text-kudos-purple-dark">
        ← Back to today
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-kudos-purple-dark">Manage habits</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-kudos-ink">{player.name}</h1>
        </div>
        <KudosBadge tone="purple">
          {activeHabits.length} this week · {nextWeekHabits.length} next week
        </KudosBadge>
      </header>

      <KudosCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-kudos-ink">Next week’s habit list</h2>
            <p className="mt-1 max-w-lg text-sm leading-6 text-kudos-ink-soft">
              Write each habit and the number of times it must be completed for the week. Add, edit, or remove as many rows as you need.
            </p>
          </div>
          <KudosBadge tone="sun">Starts {format(nextWeek.startDate, "MMM d")}</KudosBadge>
        </div>
        <HabitPlanEditor playerId={player.id} initialRows={nextWeekRows} />

        <p className="mt-4 rounded-xl bg-kudos-sun/15 px-3 py-2 text-xs leading-5 text-kudos-ink-soft">
          Saving changes only updates the plan beginning next week. This week’s habits, checkmarks, and results stay unchanged.
        </p>
      </KudosCard>

      {pastHabits.length > 0 ? (
        <KudosCard className="p-5">
          <details>
            <summary className="cursor-pointer font-extrabold text-kudos-ink">
              Retired habit history ({pastHabits.length})
            </summary>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-kudos-ink-soft">
              {pastHabits.map((habit) => (
                <li key={habit.id}>
                  {habit.name} · {habit.weeklyTargetDays}x/week
                </li>
              ))}
            </ul>
          </details>
        </KudosCard>
      ) : null}
    </div>
  );
}

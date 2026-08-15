import Link from "next/link";
import { KudosBadge, KudosButton, KudosCard } from "@/components/KudosUI";
import { prisma } from "@/lib/prisma";
import {
  MAX_ACTIVE_HABITS_PER_PLAYER,
  MIN_ACTIVE_HABITS_PER_PLAYER,
} from "@/lib/kudos/constants";
import { getActiveHabits, getCurrentWeek, getOrCreateWeekFor } from "@/lib/kudos/data";
import { addHabitForm, retireHabitForm, swapHabitForm } from "../../../actions";

const fieldClass =
  "min-h-11 rounded-xl border border-kudos-ink/12 bg-white px-3 py-2 text-sm text-kudos-ink outline-none transition-[border-color,box-shadow] placeholder:text-kudos-ink/35 focus:border-kudos-purple focus:ring-4 focus:ring-kudos-purple/10";

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
  const scheduledReplacements = new Map(
    habits
      .filter((habit) => habit.validFromWeekId === nextWeek.id && habit.replacesHabitId)
      .map((habit) => [habit.replacesHabitId!, habit]),
  );
  const pastHabits = habits.filter(
    (habit) => !activeIds.has(habit.id) && habit.validFromWeekId !== nextWeek.id,
  );
  const removalDisabled = nextWeekHabits.length <= MIN_ACTIVE_HABITS_PER_PLAYER;

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
        <KudosBadge tone={activeHabits.length < MIN_ACTIVE_HABITS_PER_PLAYER ? "coral" : "purple"}>
          {activeHabits.length} active · {MIN_ACTIVE_HABITS_PER_PLAYER}–{MAX_ACTIVE_HABITS_PER_PLAYER} allowed
        </KudosBadge>
      </header>

      <KudosCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-kudos-ink">Active habits</h2>
            <p className="mt-1 max-w-lg text-sm leading-6 text-kudos-ink-soft">
              Edits and removals begin next week so this week&apos;s progress and past results stay accurate.
            </p>
          </div>
          {nextWeekHabits.length !== activeHabits.length ? (
            <KudosBadge tone="sun">{nextWeekHabits.length} planned next week</KudosBadge>
          ) : null}
        </div>

        <ul className="mt-5 flex flex-col gap-3">
          {activeHabits.map((habit) => {
            const scheduled = scheduledReplacements.get(habit.id);

            return (
              <li key={habit.id} className="rounded-2xl border border-kudos-purple/10 bg-kudos-purple-light/45 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-kudos-ink">{habit.name}</p>
                    <p className="mt-1 text-xs font-bold text-kudos-purple-dark">
                      Goal: {habit.weeklyTargetDays} {habit.weeklyTargetDays === 1 ? "day" : "days"}/week
                    </p>
                  </div>
                  {scheduled ? <KudosBadge tone="sun">Change scheduled</KudosBadge> : null}
                </div>

                {scheduled ? (
                  <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs text-kudos-ink-soft">
                    Next week: <strong className="text-kudos-ink">{scheduled.name}</strong> · {scheduled.weeklyTargetDays}x/week
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-start gap-2 border-t border-kudos-ink/8 pt-3">
                  <details className="min-w-0 flex-1">
                    <summary className="inline-flex min-h-10 cursor-pointer items-center rounded-xl px-3 py-2 text-sm font-bold text-kudos-purple-dark hover:bg-white/70">
                      Edit habit
                    </summary>
                    <form action={swapHabitForm} className="mt-3 grid gap-3 rounded-2xl bg-white/75 p-3 sm:grid-cols-[1fr_9rem]">
                      <input type="hidden" name="oldHabitId" value={habit.id} />
                      <label className="flex flex-col gap-1.5 text-xs font-bold text-kudos-ink-soft">
                        Habit name
                        <input
                          name="name"
                          required
                          defaultValue={scheduled?.name ?? habit.name}
                          className={fieldClass}
                        />
                      </label>
                      <label className="flex flex-col gap-1.5 text-xs font-bold text-kudos-ink-soft">
                        Days per week
                        <input
                          name="weeklyTargetDays"
                          type="number"
                          required
                          min={1}
                          max={7}
                          defaultValue={scheduled?.weeklyTargetDays ?? habit.weeklyTargetDays}
                          className={fieldClass}
                        />
                      </label>
                      <div className="sm:col-span-2">
                        <KudosButton type="submit" size="sm" variant="dark">
                          Save for next week
                        </KudosButton>
                      </div>
                    </form>
                  </details>

                  <form action={retireHabitForm}>
                    <input type="hidden" name="habitId" value={habit.id} />
                    <button
                      type="submit"
                      disabled={removalDisabled}
                      title={removalDisabled ? `Each player must keep at least ${MIN_ACTIVE_HABITS_PER_PLAYER} habits` : "Remove this habit starting next week"}
                      className="min-h-10 rounded-xl px-3 py-2 text-sm font-bold text-kudos-danger transition-colors hover:bg-kudos-coral/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove next week
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>

        {activeHabits.length < MAX_ACTIVE_HABITS_PER_PLAYER ? (
          <form action={addHabitForm} className="mt-6 border-t border-kudos-ink/10 pt-5">
            <input type="hidden" name="playerId" value={player.id} />
            <h3 className="text-base font-extrabold text-kudos-ink">Add a habit</h3>
            <p className="mt-1 text-xs text-kudos-ink-soft">New habits begin this week.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
              <label className="flex flex-col gap-1.5 text-xs font-bold text-kudos-ink-soft">
                Habit name
                <input name="name" required placeholder="e.g. Read for 20 minutes" className={fieldClass} />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold text-kudos-ink-soft">
                Days per week
                <input
                  name="weeklyTargetDays"
                  type="number"
                  required
                  min={1}
                  max={7}
                  defaultValue={5}
                  className={fieldClass}
                />
              </label>
              <KudosButton type="submit" size="sm" variant="dark">
                Add habit
              </KudosButton>
            </div>
          </form>
        ) : (
          <p className="mt-5 border-t border-kudos-ink/10 pt-5 text-sm text-kudos-ink-soft">
            This player has the maximum of {MAX_ACTIVE_HABITS_PER_PLAYER} active habits.
          </p>
        )}
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

import { addDays, format, isSameDay } from "date-fns";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getActiveHabits,
  getCurrentWeek,
  getPlayers,
  previewPlayerWeekResult,
} from "@/lib/kudos/data";
import { HabitCheckbox } from "@/components/HabitCheckbox";
import { StarCount } from "@/components/KudosUI";
import { addChoreForm, addDeductionForm, addNominationForm } from "../actions";

export default async function GmDashboard() {
  const now = new Date();

  const week = await getCurrentWeek();
  const players = await getPlayers();
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(week.startDate, index));

  const playerData = await Promise.all(
    players.map(async (player) => {
      const [habits, checks, preview] = await Promise.all([
        getActiveHabits(player.id, week.id),
        prisma.habitCheck.findMany({
          where: { playerId: player.id, weekId: week.id, done: true },
          select: { habitId: true, date: true },
        }),
        previewPlayerWeekResult(player.id, week.id),
      ]);
      const habitsWithStatus = habits.map((habit) => {
        const doneDays = weekDays.map((day) =>
          checks.some(
            (check) =>
              check.habitId === habit.id &&
              check.date.toISOString().slice(0, 10) === day.toISOString().slice(0, 10),
          ),
        );
        return { habit, doneDays, daysChecked: doneDays.filter(Boolean).length };
      });
      return { player, habitsWithStatus, preview };
    }),
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-kudos-purple-dark">Gamemaster check-off</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-kudos-ink">This week&apos;s habits</h1>
          <p className="mt-1 text-sm text-kudos-ink-soft">
            Week {week.weekNumber} · {format(week.startDate, "MMM d")}–{format(week.endDate, "MMM d")}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${week.status === "LOCKED" ? "bg-kudos-ink/8 text-kudos-ink-soft" : "bg-kudos-mint/25 text-[#1e6b57]"}`}>
          {week.status === "LOCKED" ? "Week locked" : "Week open"}
        </span>
      </header>

      {playerData.map(({ player, habitsWithStatus, preview }) => (
        <section key={player.id} className="rounded-[1.75rem] border border-white/80 bg-kudos-card p-4 shadow-kudos-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-extrabold text-kudos-ink">{player.name}</p>
              <Link
                href={`/gm/players/${player.id}`}
                className="mt-1 inline-flex min-h-8 items-center rounded-lg px-2 text-xs font-bold text-kudos-purple-dark transition-colors hover:bg-kudos-purple-light"
              >
                Manage habits →
              </Link>
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold text-kudos-purple-dark">
                <StarCount className="text-kudos-purple-dark">{preview.totalStars}</StarCount> this week
              </p>
              <p className="mt-1 text-xs text-kudos-ink-soft">Streak after week: {preview.streakLengthAfter}</p>
            </div>
          </div>

          {habitsWithStatus.length > 0 ? (
            <div className="mt-4 overflow-x-auto overscroll-x-contain pb-2">
              <div className="min-w-[38rem]">
                <div className="grid grid-cols-[minmax(11rem,2fr)_repeat(7,minmax(2.5rem,1fr))] items-end gap-2 text-center">
                  <span className="sticky left-0 z-20 self-stretch bg-kudos-card pb-1 text-left text-xs font-bold text-kudos-ink-soft shadow-[10px_0_14px_-14px_rgba(31,20,71,0.7)]">
                    Habit and weekly goal
                  </span>
                  {weekDays.map((day) => {
                    const today = isSameDay(day, now);
                    return (
                      <time
                        key={day.toISOString()}
                        dateTime={format(day, "yyyy-MM-dd")}
                        className={`mx-auto flex min-w-10 flex-col items-center rounded-xl px-1 py-1 text-xs ${today ? "bg-kudos-purple-light font-extrabold text-kudos-purple-dark" : "font-bold text-kudos-ink-soft"}`}
                      >
                        <span>{format(day, "EEE")}</span>
                        <span className="mt-0.5 text-[0.65rem] opacity-75">{format(day, "d")}</span>
                      </time>
                    );
                  })}
                </div>

                <div className="mt-2 flex flex-col gap-1">
                  {habitsWithStatus.map(({ habit, doneDays, daysChecked }) => (
                    <div
                      key={habit.id}
                      className="group/row grid min-h-16 grid-cols-[minmax(11rem,2fr)_repeat(7,minmax(2.5rem,1fr))] items-center gap-2 rounded-2xl px-2 py-2 transition-colors hover:bg-kudos-purple-light/35"
                    >
                      <div className="sticky left-0 z-10 -ml-2 flex min-h-16 min-w-0 flex-col justify-center bg-kudos-card py-2 pl-2 pr-3 shadow-[10px_0_14px_-14px_rgba(31,20,71,0.7)] transition-colors group-hover/row:bg-[#f7f3ff]">
                        <p className="text-sm font-bold leading-5 text-kudos-ink">{habit.name}</p>
                        <p className="mt-0.5 text-xs font-bold text-kudos-purple-dark">
                          Goal: {habit.weeklyTargetDays} {habit.weeklyTargetDays === 1 ? "day" : "days"}/week · {daysChecked} done
                        </p>
                      </div>
                      {weekDays.map((day, dayIndex) => (
                        <HabitCheckbox
                          key={`${day.toISOString()}-${doneDays[dayIndex]}`}
                          habitId={habit.id}
                          date={format(day, "yyyy-MM-dd")}
                          initialChecked={doneDays[dayIndex]}
                          disabled={week.status === "LOCKED"}
                          label={`${habit.name} completed on ${format(day, "EEEE, MMMM d")}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-kudos-purple-light/35 p-4 text-sm text-kudos-ink-soft">
              No active habits — add one from this player&apos;s Manage habits page.
            </p>
          )}
        </section>
      ))}

      <LogSomethingSection players={players} />
    </div>
  );
}

function LogSomethingSection({ players }: { players: { id: string; name: string }[] }) {
  return (
    <section className="rounded-3xl bg-kudos-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-kudos-ink">Log something</h2>

      <form action={addChoreForm} className="mt-4 flex flex-col gap-2 border-t border-kudos-ink/10 pt-4">
        <p className="text-sm font-medium text-kudos-ink/70">Chore</p>
        <div className="flex gap-2">
          <select name="playerId" className="flex-1 rounded-lg border border-kudos-ink/15 px-2 py-2 text-sm">
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select name="tier" className="rounded-lg border border-kudos-ink/15 px-2 py-2 text-sm">
            <option value="STANDARD">Standard (2 ✦)</option>
            <option value="BIG">Big job (5 ✦)</option>
          </select>
        </div>
        <input
          name="description"
          placeholder="What did they do?"
          className="rounded-lg border border-kudos-ink/15 px-2 py-2 text-sm"
        />
        <button type="submit" className="self-start rounded-lg bg-kudos-ink px-4 py-2 text-sm font-semibold text-white">
          Add chore
        </button>
      </form>

      <form action={addNominationForm} className="mt-4 flex flex-col gap-2 border-t border-kudos-ink/10 pt-4">
        <p className="text-sm font-medium text-kudos-ink/70">Nomination</p>
        <div className="flex gap-2">
          <select name="fromPlayerId" className="flex-1 rounded-lg border border-kudos-ink/15 px-2 py-2 text-sm">
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} nominates…
              </option>
            ))}
          </select>
          <select name="toPlayerId" className="flex-1 rounded-lg border border-kudos-ink/15 px-2 py-2 text-sm">
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <select name="tier" className="rounded-lg border border-kudos-ink/15 px-2 py-2 text-sm">
          <option value="KINDNESS">Kindness (5 ✦)</option>
          <option value="ABOVE_AND_BEYOND">Above &amp; beyond (10 ✦)</option>
        </select>
        <input
          name="reason"
          placeholder="What happened?"
          className="rounded-lg border border-kudos-ink/15 px-2 py-2 text-sm"
        />
        <button type="submit" className="self-start rounded-lg bg-kudos-ink px-4 py-2 text-sm font-semibold text-white">
          Add nomination
        </button>
      </form>

      <form action={addDeductionForm} className="mt-4 flex flex-col gap-2 border-t border-kudos-ink/10 pt-4">
        <p className="text-sm font-medium text-kudos-ink/70">Deduction (both parents agree)</p>
        <div className="flex gap-2">
          <select name="playerId" className="flex-1 rounded-lg border border-kudos-ink/15 px-2 py-2 text-sm">
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            name="stars"
            type="number"
            min={1}
            defaultValue={1}
            className="w-20 rounded-lg border border-kudos-ink/15 px-2 py-2 text-sm"
          />
        </div>
        <input
          name="reason"
          placeholder="Reason"
          className="rounded-lg border border-kudos-ink/15 px-2 py-2 text-sm"
        />
        <button type="submit" className="self-start rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
          Apply deduction
        </button>
      </form>
    </section>
  );
}

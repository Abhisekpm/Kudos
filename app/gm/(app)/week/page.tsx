import { format } from "date-fns";
import { StarCount } from "@/components/KudosUI";
import { getCurrentWeek, getPlayers, previewPlayerWeekResult } from "@/lib/kudos/data";
import { lockCurrentWeek } from "../../actions";

export default async function WeekHuddlePage() {
  const week = await getCurrentWeek();
  const players = await getPlayers();

  const results = await Promise.all(
    players.map(async (player) => ({
      player,
      result: await previewPlayerWeekResult(player.id, week.id),
    })),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold text-kudos-ink">Weekly Huddle</h1>
        <p className="mt-1 text-sm text-kudos-ink/60">
          Week {week.weekNumber} — {format(week.startDate, "MMM d")} to {format(week.endDate, "MMM d")} ·{" "}
          {week.status === "LOCKED" ? "locked" : "open"}
        </p>
        <p className="mt-3 max-w-xl text-sm leading-6 text-kudos-ink-soft">
          Review everyone&apos;s habits, bonuses, deductions, streaks, and final star total together. When everything looks right, lock the week to permanently bank its stars.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {results.map(({ player, result }) => (
          <section key={player.id} className="rounded-3xl bg-kudos-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-kudos-ink">{player.name}</h2>
              <StarCount className="text-lg text-kudos-purple">{result.totalStars}</StarCount>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-kudos-ink/70">
              <dt>Habits</dt>
              <dd><StarCount>{result.habitStars}</StarCount></dd>
              <dt>Target bonus</dt>
              <dd><StarCount>{result.habitTargetBonusStars}</StarCount></dd>
              <dt>Chores</dt>
              <dd><StarCount>{result.choreStars}</StarCount></dd>
              <dt>Nominations</dt>
              <dd><StarCount>{result.nominationStars}</StarCount></dd>
              <dt>Deductions</dt>
              <dd><StarCount>{result.deductionStars}</StarCount></dd>
              <dt>Streak bonus</dt>
              <dd><StarCount>{result.streakBonusStars}</StarCount></dd>
            </dl>
            <p className="mt-3 text-sm">
              {result.weekComplete
                ? "✅ Week complete"
                : result.shieldUsed
                  ? "🛡️ Incomplete — Streak Shield used"
                  : "Week incomplete"}{" "}
              · Streak after this week: {result.streakLengthAfter}
            </p>
          </section>
        ))}
      </div>

      {week.status === "OPEN" ? (
        <form action={lockCurrentWeek}>
          <button
            type="submit"
            className="w-full rounded-xl bg-kudos-ink px-4 py-4 text-lg font-semibold text-white"
          >
            Lock &amp; bank stars for this week
          </button>
        </form>
      ) : (
        <p className="text-center text-sm text-kudos-ink/50">This week is locked and banked.</p>
      )}
    </div>
  );
}

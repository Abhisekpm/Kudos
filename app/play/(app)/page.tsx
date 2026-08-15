import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { PlayerAvatar } from "@/components/KudosUI";
import { avatarForPlayer } from "@/lib/kudos/avatars";
import {
  getActiveSeason,
  getCurrentWeek,
  getPlayers,
  latestStreakLength,
  weeklyCompletionPercent,
} from "@/lib/kudos/data";

export default async function PlayBoard() {
  const season = await getActiveSeason();

  if (new Date() < season.startDate) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
        <KudosLogoHeading />
        <p className="text-kudos-ink/60">
          {season.name} starts {format(season.startDate, "EEEE, MMM d")}!
        </p>
      </div>
    );
  }

  const week = await getCurrentWeek();
  const players = await getPlayers();

  const rows = await Promise.all(
    players.map(async (player) => ({
      player,
      streak: await latestStreakLength(player.id),
      percent: await weeklyCompletionPercent(player.id, week.id),
    })),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8">
      <KudosLogoHeading />

      <div className="flex flex-col gap-3">
        {rows.map(({ player, streak, percent }) => (
          <Link
            key={player.id}
            href={`/play/${player.id}`}
            className="flex items-center gap-4 rounded-3xl bg-kudos-card p-4 shadow-sm"
          >
            <PlayerAvatar name={player.name} src={avatarForPlayer(player.name)} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-kudos-ink">{player.name}</p>
                <p className="text-sm text-kudos-ink/60">Streak #{streak}</p>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-kudos-purple-light">
                <div
                  className="h-full rounded-full bg-kudos-purple"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-kudos-ink/50">{percent}% of this week&apos;s habits done</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function KudosLogoHeading() {
  return (
    <h1 className="relative mx-auto h-20 w-64 overflow-hidden" aria-label="Kudos">
      <Image
        src="/logo.jpeg"
        alt=""
        fill
        priority
        sizes="256px"
        className="object-cover mix-blend-multiply"
      />
    </h1>
  );
}

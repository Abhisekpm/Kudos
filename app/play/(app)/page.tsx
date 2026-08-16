import Image from "next/image";
import Link from "next/link";
import { PlayerAvatar } from "@/components/KudosUI";
import { avatarForPlayer } from "@/lib/kudos/avatars";
import {
  getCurrentWeek,
  getPlayers,
  latestStreakLength,
  playerStarBalance,
  streakShieldBalance,
  weeklyCompletionPercent,
} from "@/lib/kudos/data";

export default async function PlayBoard() {
  const week = await getCurrentWeek();
  const players = await getPlayers();

  const rows = await Promise.all(
    players.map(async (player) => {
      const [streak, percent, shieldBalance, starBalance] = await Promise.all([
        latestStreakLength(player.id),
        weeklyCompletionPercent(player.id, week.id),
        streakShieldBalance(player.id, week.startDate),
        playerStarBalance(player.id),
      ]);
      return { player, streak, percent, shieldBalance, starBalance };
    }),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8">
      <KudosLogoHeading />

      <div className="flex flex-col gap-3">
        {rows.map(({ player, streak, percent, shieldBalance, starBalance }) => (
          <Link
            key={player.id}
            href={`/play/${player.id}`}
            className="flex items-center gap-4 rounded-3xl bg-kudos-card p-4 shadow-sm"
          >
            <PlayerAvatar name={player.name} src={avatarForPlayer(player.name)} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-kudos-ink">{player.name}</p>
                <div className="flex items-center gap-2 text-sm text-kudos-ink/60">
                  <span>🛡️ {shieldBalance}</span>
                  <span>Streak #{streak}</span>
                </div>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-kudos-purple-light">
                <div
                  className="h-full rounded-full bg-kudos-purple"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-kudos-ink/50">{percent}% of this week&apos;s habits done</p>
              <p className="mt-1 text-xs font-bold text-kudos-purple-dark">
                {starBalance.available} points available
              </p>
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

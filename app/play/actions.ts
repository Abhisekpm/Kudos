"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlay } from "@/lib/session";

export type CashOutState = {
  error?: string;
  success?: string;
};

export async function cashOutPoints(
  _previousState: CashOutState,
  formData: FormData,
): Promise<CashOutState> {
  await requirePlay();

  const playerId = String(formData.get("playerId") ?? "");
  const points = Number(formData.get("points"));
  if (!playerId) return { error: "Player is required." };
  if (!Number.isInteger(points) || points <= 0) {
    return { error: "Choose a whole number of points greater than zero." };
  }

  try {
    const remaining = await prisma.$transaction(async (tx) => {
      await tx.player.findUniqueOrThrow({ where: { id: playerId }, select: { id: true } });
      const earnedResult = await tx.weekResult.aggregate({
        where: { playerId },
        _sum: { totalStars: true },
      });
      const cashOutResult = await tx.cashOut.aggregate({
        where: { playerId },
        _sum: { points: true },
      });
      const available =
        (earnedResult._sum.totalStars ?? 0) - (cashOutResult._sum.points ?? 0);
      if (points > available) {
        throw new Error(`Only ${Math.max(0, available)} points are available.`);
      }

      await tx.cashOut.create({ data: { playerId, points } });
      return available - points;
    });

    revalidatePath("/play");
    revalidatePath(`/play/${playerId}`);
    return {
      success: `${points} ${points === 1 ? "point" : "points"} cashed out. ${remaining} remaining.`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Cash-out could not be completed." };
  }
}

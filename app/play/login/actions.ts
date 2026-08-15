"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export async function loginPlay(_prevState: { error?: string } | undefined, formData: FormData) {
  const passcode = String(formData.get("passcode") ?? "");
  const expected = process.env.PLAY_PASSCODE;

  if (!expected) {
    return { error: "Server is missing PLAY_PASSCODE — set it in .env" };
  }
  if (passcode !== expected) {
    return { error: "Wrong passcode" };
  }

  const session = await getSession();
  // Don't downgrade an existing GM session — GM can already see everything Play can.
  if (session.role !== "gm") {
    session.role = "player";
    await session.save();
  }
  redirect("/play");
}

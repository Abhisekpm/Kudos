"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export async function loginGm(_prevState: { error?: string } | undefined, formData: FormData) {
  const passcode = String(formData.get("passcode") ?? "");
  const expected = process.env.GM_PASSCODE;

  if (!expected) {
    return { error: "Server is missing GM_PASSCODE — set it in .env" };
  }
  if (passcode !== expected) {
    return { error: "Wrong passcode" };
  }

  const session = await getSession();
  session.role = "gm";
  await session.save();
  redirect("/gm");
}

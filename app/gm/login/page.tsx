"use client";

import { useActionState } from "react";
import { KudosBadge, KudosButton, KudosCard } from "@/components/KudosUI";
import { loginGm } from "./actions";

export default function GmLoginPage() {
  const [state, formAction, pending] = useActionState(loginGm, undefined);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <KudosCard elevated className="animate-kudos-pop-in w-full max-w-sm p-7 sm:p-8">
        <KudosBadge tone="neutral">Parents only</KudosBadge>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-kudos-ink">Gamemaster</h1>
        <p className="mt-2 text-sm leading-6 text-kudos-ink-soft">Manage habits, log stars, and prepare the weekly huddle.</p>
        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <label htmlFor="gm-passcode" className="text-sm font-bold text-kudos-ink">
            Gamemaster passcode
          </label>
          <input
            id="gm-passcode"
            type="password"
            name="passcode"
            autoFocus
            inputMode="numeric"
            autoComplete="current-password"
            className="min-h-12 rounded-2xl border border-kudos-ink/12 bg-white px-4 py-3 text-lg text-kudos-ink shadow-inner outline-none transition-[border-color,box-shadow] placeholder:text-kudos-ink/35 focus:border-kudos-purple focus:ring-4 focus:ring-kudos-purple/10"
            placeholder="Passcode"
          />
          {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          <KudosButton
            type="submit"
            disabled={pending}
            variant="dark"
            size="lg"
            className="mt-1 w-full"
          >
            {pending ? "Checking…" : "Enter"}
          </KudosButton>
        </form>
      </KudosCard>
    </main>
  );
}

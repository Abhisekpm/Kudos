"use client";

import { useActionState } from "react";
import { KudosButton, KudosCard, Sparkle } from "@/components/KudosUI";
import { loginPlay } from "./actions";

export default function PlayLoginPage() {
  const [state, formAction, pending] = useActionState(loginPlay, undefined);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12">
      <Sparkle className="animate-kudos-float absolute right-[18%] top-[18%] text-2xl opacity-45" />
      <KudosCard elevated className="animate-kudos-pop-in w-full max-w-sm p-7 sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-kudos-purple-light text-xl text-kudos-purple-dark">
          <span aria-hidden="true">✦</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-kudos-ink">Family board</h1>
        <p className="mt-2 text-sm leading-6 text-kudos-ink-soft">Enter the family passcode to see everyone&apos;s progress.</p>
        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <label htmlFor="play-passcode" className="text-sm font-bold text-kudos-ink">
            Family passcode
          </label>
          <input
            id="play-passcode"
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

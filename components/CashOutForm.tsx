"use client";

import { useActionState } from "react";
import { cashOutPoints, type CashOutState } from "@/app/play/actions";
import { KudosButton } from "@/components/KudosUI";

const initialState: CashOutState = {};

export function CashOutForm({
  playerId,
  availablePoints,
}: {
  playerId: string;
  availablePoints: number;
}) {
  const [state, action, pending] = useActionState(cashOutPoints, initialState);

  return (
    <form action={action} className="mt-4 w-full border-t border-kudos-ink/10 pt-4">
      <input type="hidden" name="playerId" value={playerId} />
      <label className="block text-left text-xs font-bold text-kudos-ink-soft" htmlFor="cash-out-points">
        Points to cash out
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="cash-out-points"
          name="points"
          type="number"
          inputMode="numeric"
          min={1}
          max={availablePoints}
          step={1}
          required
          disabled={availablePoints === 0 || pending}
          placeholder="0"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-kudos-ink/12 bg-white px-3 py-2 text-sm text-kudos-ink outline-none focus:border-kudos-purple focus:ring-4 focus:ring-kudos-purple/10 disabled:bg-kudos-ink/5"
        />
        <KudosButton type="submit" size="sm" variant="dark" disabled={availablePoints === 0 || pending}>
          {pending ? "Cashing out…" : "Cash out"}
        </KudosButton>
      </div>
      {availablePoints === 0 ? (
        <p className="mt-2 text-xs text-kudos-ink-soft">There are no points available to cash out yet.</p>
      ) : null}
      {state.error ? <p className="mt-2 text-sm font-bold text-kudos-danger">{state.error}</p> : null}
      {state.success ? <p className="mt-2 text-sm font-bold text-[#1e6b57]">{state.success}</p> : null}
    </form>
  );
}

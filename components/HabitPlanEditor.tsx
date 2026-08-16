"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { saveHabitPlanForm } from "@/app/gm/actions";
import { KudosButton } from "@/components/KudosUI";

type HabitPlanRow = {
  key: string;
  sourceHabitId: string;
  name: string;
  weeklyTargetDays: number;
};

const fieldClass =
  "min-h-11 w-full rounded-xl border border-kudos-ink/12 bg-white px-3 py-2 text-sm text-kudos-ink outline-none transition-[border-color,box-shadow] placeholder:text-kudos-ink/35 focus:border-kudos-purple focus:ring-4 focus:ring-kudos-purple/10";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <KudosButton type="submit" size="sm" variant="dark" disabled={pending}>
      {pending ? "Saving…" : "Save next week’s habits"}
    </KudosButton>
  );
}

export function HabitPlanEditor({
  playerId,
  initialRows,
}: {
  playerId: string;
  initialRows: HabitPlanRow[];
}) {
  const [rows, setRows] = useState(initialRows);

  function addRow() {
    setRows((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        sourceHabitId: "",
        name: "",
        weeklyTargetDays: 5,
      },
    ]);
  }

  function updateRow(key: string, patch: Partial<Pick<HabitPlanRow, "name" | "weeklyTargetDays">>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key));
  }

  return (
    <form action={saveHabitPlanForm}>
      <input type="hidden" name="playerId" value={playerId} />

      <div className="mt-5 overflow-x-auto rounded-2xl border border-kudos-ink/10">
        <table className="w-full min-w-[30rem] border-collapse text-left">
          <thead className="bg-kudos-purple-light/80 text-xs font-extrabold uppercase tracking-wide text-kudos-purple-dark">
            <tr>
              <th className="px-4 py-3">Habit</th>
              <th className="w-36 px-4 py-3">Times per week</th>
              <th className="w-16 px-3 py-3 text-right"><span className="sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kudos-ink/8 bg-white/70">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="p-3 align-top">
                  <input type="hidden" name="sourceHabitId" value={row.sourceHabitId} />
                  <label className="sr-only" htmlFor={`habit-${row.key}`}>Habit</label>
                  <input
                    id={`habit-${row.key}`}
                    name="name"
                    required
                    value={row.name}
                    onChange={(event) => updateRow(row.key, { name: event.target.value })}
                    placeholder="Write a habit"
                    className={fieldClass}
                  />
                </td>
                <td className="p-3 align-top">
                  <label className="sr-only" htmlFor={`target-${row.key}`}>Times per week</label>
                  <input
                    id={`target-${row.key}`}
                    name="weeklyTargetDays"
                    type="number"
                    required
                    min={1}
                    max={7}
                    step={1}
                    value={row.weeklyTargetDays}
                    onChange={(event) => updateRow(row.key, { weeklyTargetDays: Number(event.target.value) })}
                    className={fieldClass}
                  />
                </td>
                <td className="p-2 text-center align-middle">
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl px-2 py-2 text-2xl font-bold leading-none text-kudos-danger transition-colors hover:bg-kudos-coral/15"
                    aria-label={`Remove ${row.name || "new habit"} from next week`}
                    title="Remove from next week"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-kudos-ink-soft">
                  No habits are planned for next week. Add a row whenever you’re ready.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <KudosButton type="button" size="sm" variant="secondary" onClick={addRow}>
          + Add habit row
        </KudosButton>
        <SaveButton />
      </div>
    </form>
  );
}

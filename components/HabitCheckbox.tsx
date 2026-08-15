"use client";

import { useState, useTransition } from "react";
import { setHabitCheck } from "@/app/gm/actions";
import { LogoStar } from "@/components/KudosUI";

export function HabitCheckbox({
  habitId,
  date,
  initialChecked,
  label,
  disabled = false,
}: {
  habitId: string;
  date: string;
  initialChecked: boolean;
  label: string;
  disabled?: boolean;
}) {
  const [checked, setChecked] = useState(initialChecked);
  const [saveFailed, setSaveFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <label
      className="group relative mx-auto inline-flex cursor-pointer rounded-full has-[:disabled]:cursor-not-allowed"
      title={saveFailed ? "Could not save this check-off. Please try again." : undefined}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled || pending}
        onChange={(event) => {
          const nextChecked = event.currentTarget.checked;
          setChecked(nextChecked);
          setSaveFailed(false);
          startTransition(async () => {
            try {
              const result = await setHabitCheck(habitId, date, nextChecked);
              setChecked(result.checked);
            } catch {
              setChecked(!nextChecked);
              setSaveFailed(true);
            }
          });
        }}
        className="peer sr-only"
        aria-label={label}
      />
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full bg-kudos-purple-light shadow-inner transition-[transform,background-color,box-shadow,opacity] duration-200 group-hover:scale-110 peer-checked:scale-105 peer-checked:bg-kudos-purple peer-checked:shadow-kudos-sm peer-focus-visible:ring-4 peer-focus-visible:ring-kudos-purple/30 peer-disabled:scale-100 peer-disabled:opacity-45 sm:h-9 sm:w-9 ${saveFailed ? "ring-2 ring-red-500" : ""}`}
      >
        {checked ? <LogoStar className="text-white" /> : null}
      </span>
      <span className="sr-only" aria-live="polite">
        {saveFailed ? "Could not save this check-off. Please try again." : ""}
      </span>
    </label>
  );
}

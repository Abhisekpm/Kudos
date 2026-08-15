import { endOfWeek, startOfWeek } from "date-fns";

/** Weeks run Monday–Sunday, matching the Sunday-evening huddle. */
export function weekBounds(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function quarterLabel(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${quarter}`;
}

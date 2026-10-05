export const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const DAY_LABELS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Returns the Monday (as YYYY-MM-DD) of the week containing `date`. */
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return toISODateOnly(d);
}

export function toISODateOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Shift a YYYY-MM-DD weekStart by N weeks and return the new weekStart string. */
export function shiftWeek(weekStart, deltaWeeks) {
  const d = new Date(`${weekStart}T00:00:00`);
  d.setDate(d.getDate() + deltaWeeks * 7);
  return toISODateOnly(d);
}

/** Returns the actual calendar date (YYYY-MM-DD) for a given dayIndex (0=Mon..6=Sun) within a week. */
export function dateForDayIndex(weekStart, dayIndex) {
  const d = new Date(`${weekStart}T00:00:00`);
  d.setDate(d.getDate() + dayIndex);
  return d;
}

export function formatWeekRangeLabel(weekStart) {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const opts = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

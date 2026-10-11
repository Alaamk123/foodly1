const RECIPE = {
  pending: { label: "قيد المراجعة", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  approved: { label: "مقبولة", cls: "bg-green-50 text-green-700 ring-green-200" },
  rejected: { label: "مرفوضة", cls: "bg-red-50 text-red-700 ring-red-200" },
};

// "placed" is the original status stored by the backend; it means "waiting".
const ORDER = {
  placed: { label: "قيد الانتظار", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  processing: { label: "قيد المعالجة", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  completed: { label: "مكتمل", cls: "bg-green-50 text-green-700 ring-green-200" },
  cancelled: { label: "ملغي", cls: "bg-red-50 text-red-700 ring-red-200" },
};

export const ORDER_STATUS_LABELS = Object.fromEntries(Object.entries(ORDER).map(([k, v]) => [k, v.label]));

export default function StatusBadge({ kind = "recipe", status }) {
  const map = kind === "order" ? ORDER : RECIPE;
  const s = map[status] || { label: status, cls: "bg-primary-50 text-primary-700 ring-primary-200" };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${s.cls}`}>{s.label}</span>;
}

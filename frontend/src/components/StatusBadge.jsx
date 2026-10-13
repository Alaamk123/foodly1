import { useLanguage } from "../i18n/LanguageContext";

// Colours only; the labels come from the translation file (status.recipe.* / status.order.*).
const RECIPE = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-green-50 text-green-700 ring-green-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

// "placed" is the original status stored by the backend; it means "waiting".
const ORDER = {
  placed: "bg-amber-50 text-amber-700 ring-amber-200",
  processing: "bg-sky-50 text-sky-700 ring-sky-200",
  completed: "bg-green-50 text-green-700 ring-green-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
};

export const ORDER_STATUSES = Object.keys(ORDER);

export default function StatusBadge({ kind = "recipe", status }) {
  const { t } = useLanguage();
  const map = kind === "order" ? ORDER : RECIPE;
  const cls = map[status] || "bg-primary-50 text-primary-700 ring-primary-200";
  const key = `status.${kind}.${status}`;
  const label = t(key);
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${cls}`}>{label === key ? status : label}</span>;
}

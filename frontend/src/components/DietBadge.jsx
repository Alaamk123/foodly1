const DIET_COLORS = {
  Keto: "bg-purple-50 text-purple-700",
  Vegetarian: "bg-green-50 text-green-700",
  Vegan: "bg-emerald-50 text-emerald-700",
  "Low Carb": "bg-blue-50 text-blue-700",
  Paleo: "bg-amber-50 text-amber-700",
  "Gluten Free": "bg-yellow-50 text-yellow-800",
  "Dairy Free": "bg-sky-50 text-sky-700",
  Pescatarian: "bg-cyan-50 text-cyan-700",
};

export default function DietBadge({ tag }) {
  const colorClass = DIET_COLORS[tag] || "bg-primary-50 text-primary-700";
  return <span className={`badge ${colorClass}`}>{tag}</span>;
}

import { useEffect, useState } from "react";
import { X, Search, Clock, Flame } from "lucide-react";
import { fetchRecipes } from "../api/client";
import DietBadge from "./DietBadge";
import RecipeImage from "./RecipeImage";
import LoadingSpinner from "./LoadingSpinner";

export default function RecipePickerModal({ dayLabel, mealType, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchRecipes({ search, limit: 20 })
      .then((res) => setRecipes(res.data))
      .catch((err) => {
        if (!controller.signal.aborted) console.error(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [search]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-primary-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-400">
              {dayLabel} · {mealType}
            </p>
            <h2 className="font-display text-lg font-bold text-primary-900">Choose a recipe</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-primary-400 hover:bg-primary-50 hover:text-primary-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-primary-100 px-5 py-3">
          <div className="flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2">
            <Search size={16} className="text-primary-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes..."
              className="w-full bg-transparent text-sm text-primary-800 outline-none placeholder:text-primary-300"
            />
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <LoadingSpinner label="Finding recipes..." />
          ) : recipes.length === 0 ? (
            <p className="py-10 text-center text-sm text-primary-400">No recipes match your search.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recipes.map((recipe) => (
                <li key={recipe._id}>
                  <button
                    onClick={() => onSelect(recipe)}
                    className="flex w-full items-center gap-3 rounded-xl2 p-2 text-left transition-colors hover:bg-primary-50"
                  >
                    <RecipeImage src={recipe.image} alt={recipe.title} className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-semibold text-primary-900">{recipe.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-primary-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame size={12} /> {recipe.calories} cal
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {recipe.dietTags?.slice(0, 3).map((t) => (
                          <DietBadge key={t} tag={t} />
                        ))}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

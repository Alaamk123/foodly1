import { useEffect, useState } from "react";
import { X, Search, Clock, Flame } from "lucide-react";
import { fetchRecipes } from "../api/client";
import DietBadge from "./DietBadge";
import RecipeImage from "./RecipeImage";
import LoadingSpinner from "./LoadingSpinner";
import { useLanguage } from "../i18n/LanguageContext";

export default function RecipePickerModal({ dayLabel, mealType, onSelect, onClose }) {
  const { t, localizeRecipe } = useLanguage();
  const [search, setSearch] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // `ignore` drops the response of an outdated search (fast typing, or modal closed)
    let ignore = false;
    setLoading(true);
    setError(false);
    // limit 50 = the API maximum, so every recipe is available to pick
    fetchRecipes({ search, limit: 50 })
      .then((res) => {
        if (!ignore) setRecipes(res.data);
      })
      .catch((err) => {
        console.error(err);
        if (!ignore) setError(true);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
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
            <h2 className="font-display text-lg font-bold text-primary-900">{t("picker.title")}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-primary-400 hover:bg-primary-50 hover:text-primary-700"
            aria-label={t("common.close")}
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
              placeholder={t("picker.search")}
              className="w-full bg-transparent text-sm text-primary-800 outline-none placeholder:text-primary-300"
            />
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <LoadingSpinner label={t("picker.loading")} />
          ) : error ? (
            <p className="py-10 text-center text-sm text-red-600">{t("picker.error")}</p>
          ) : recipes.length === 0 ? (
            <p className="py-10 text-center text-sm text-primary-400">{t("picker.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recipes.map((raw) => {
                const recipe = localizeRecipe(raw);
                return (
                <li key={raw._id}>
                  <button
                    onClick={() => onSelect(raw)}
                    className="flex w-full items-center gap-3 rounded-xl2 p-2 text-start transition-colors hover:bg-primary-50"
                  >
                    <RecipeImage src={recipe.image} alt={recipe.title} className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-semibold text-primary-900">{recipe.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-primary-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {t("common.minutes", { n: recipe.prepTimeMinutes + recipe.cookTimeMinutes })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame size={12} /> {t("common.cal", { n: recipe.calories })}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {recipe.dietTags?.slice(0, 3).map((tag) => (
                          <DietBadge key={tag} tag={tag} />
                        ))}
                      </div>
                    </div>
                  </button>
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, X, Flame, ShoppingBasket, Trash2 } from "lucide-react";
import { fetchMealPlan, addMealToPlan, removeMealFromPlan, clearWeek } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { shiftWeek, formatWeekRangeLabel, dateForDayIndex } from "../utils/date";
import { useLanguage } from "../i18n/LanguageContext";
import RecipePickerModal from "../components/RecipePickerModal";
import LoadingSpinner from "../components/LoadingSpinner";
import RecipeImage from "../components/RecipeImage";

const MEAL_TYPES = ["breakfast", "lunch", "dinner"];

// Daily calorie totals computed from the meals we already have (the add/remove
// endpoints return the plan without dailyTotals).
const computeDailyTotals = (meals = []) => {
  const totals = Array.from({ length: 7 }, () => 0);
  meals.forEach((m) => {
    if (m.recipe && typeof m.recipe === "object") totals[m.dayIndex] += m.recipe.calories || 0;
  });
  return totals;
};

export default function WeeklyPlanner() {
  const { currentWeekStart, setCurrentWeekStart } = useAuth();
  const { t, term, locale, isRTL, apiError, localizeRecipe } = useLanguage();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickerTarget, setPickerTarget] = useState(null); // { dayIndex, mealType }
  const [error, setError] = useState("");

  // Always holds the week currently on screen, so a slow response for a week the
  // user has already left can never overwrite the one they are looking at.
  const weekRef = useRef(currentWeekStart);
  weekRef.current = currentWeekStart;

  const loadPlan = useCallback(async () => {
    const week = currentWeekStart;
    setLoading(true);
    setError("");
    try {
      const data = await fetchMealPlan(week);
      if (weekRef.current === week) setPlan(data);
    } catch (err) {
      console.error(err);
      if (weekRef.current === week) setError(apiError(err, "planner.loadError"));
    } finally {
      if (weekRef.current === week) setLoading(false);
    }
  }, [currentWeekStart, apiError]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  // A slot's `recipe` can come back as null if the recipe it pointed to was
  // deleted from the database (for example after re-running the seed script
  // while an older plan still referenced the old recipe ids). Filtering
  // those out here means a stale slot behaves like an empty one instead of
  // crashing the whole page.
  const getSlot = (dayIndex, mealType) =>
    plan?.meals?.find((m) => m.dayIndex === dayIndex && m.mealType === mealType && m.recipe);

  const applyPlan = (week, updated) => {
    if (weekRef.current !== week) return; // user already moved to another week
    setPlan({ ...updated, dailyTotals: computeDailyTotals(updated.meals) });
  };

  const handleSelectRecipe = async (recipe) => {
    const { dayIndex, mealType } = pickerTarget;
    const week = currentWeekStart;
    setPickerTarget(null);
    setError("");
    try {
      const updated = await addMealToPlan(week, { dayIndex, mealType, recipeId: recipe._id });
      applyPlan(week, updated);
    } catch (err) {
      console.error(err);
      setError(apiError(err, "planner.addError"));
    }
  };

  const handleRemove = async (slotId) => {
    const week = currentWeekStart;
    setError("");
    try {
      const updated = await removeMealFromPlan(week, slotId);
      applyPlan(week, updated);
    } catch (err) {
      console.error(err);
      setError(apiError(err, "planner.removeError"));
    }
  };

  const handleClearWeek = async () => {
    if (!confirm(t("planner.confirmClear"))) return;
    setError("");
    try {
      await clearWeek(currentWeekStart);
      loadPlan();
    } catch (err) {
      console.error(err);
      setError(apiError(err, "planner.clearError"));
    }
  };

  const weeklyCalories = plan?.dailyTotals?.reduce((sum, c) => sum + c, 0) || 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-title">{t("planner.title")}</h1>
          <p className="text-sm text-primary-500">{t("planner.subtitle")}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-card ring-1 ring-black/5">
            <button
              onClick={() => setCurrentWeekStart(shiftWeek(currentWeekStart, -1))}
              className="rounded-full p-2 text-primary-500 hover:bg-primary-50"
              aria-label={t("planner.prevWeek")}
            >
              {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <span className="px-2 text-sm font-semibold text-primary-700">
              {formatWeekRangeLabel(currentWeekStart, locale)}
            </span>
            <button
              onClick={() => setCurrentWeekStart(shiftWeek(currentWeekStart, 1))}
              className="rounded-full p-2 text-primary-500 hover:bg-primary-50"
              aria-label={t("planner.nextWeek")}
            >
              {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
          <button onClick={handleClearWeek} className="btn-secondary !px-4 !py-2.5 text-sm">
            <Trash2 size={15} /> {t("planner.clear")}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label={t("common.close")} className="flex-shrink-0 text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner label={t("planner.loading")} />
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between rounded-xl2 bg-primary-500 px-5 py-4 text-white shadow-card">
            <div className="flex items-center gap-2">
              <Flame size={20} />
              <span className="font-display font-bold">{t("planner.plannedKcal", { n: weeklyCalories.toLocaleString(locale) })}</span>
            </div>
            <Link to="/grocery-list" className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25">
              <ShoppingBasket size={16} /> {t("planner.viewGrocery")}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {t("days.full").map((label, dayIndex) => {
              const date = dateForDayIndex(currentWeekStart, dayIndex);
              const dayCalories = plan?.dailyTotals?.[dayIndex] || 0;

              return (
                <div key={label} className="card flex flex-col gap-3 p-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="font-display text-sm font-bold text-primary-900">{t("days.short")[dayIndex]}</p>
                      <p className="text-[11px] text-primary-400">
                        {date.toLocaleDateString(locale, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    {dayCalories > 0 && (
                      <span className="text-[11px] font-semibold text-primary-400">{t("common.kcal", { n: dayCalories.toLocaleString(locale) })}</span>
                    )}
                  </div>

                  {MEAL_TYPES.map((mealType) => {
                    const slot = getSlot(dayIndex, mealType);
                    return (
                      <div key={mealType}>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-primary-300">
                          {term("mealTypes", mealType)}
                        </p>
                        {slot ? (
                          <div className="group relative overflow-hidden rounded-xl bg-primary-50">
                            <Link to={`/recipes/${slot.recipe._id}`} className="flex items-center gap-2 p-2">
                              <RecipeImage src={slot.recipe.image} alt={localizeRecipe(slot.recipe).title} className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
                              <span className="line-clamp-2 text-xs font-semibold text-primary-800">
                                {localizeRecipe(slot.recipe).title}
                              </span>
                            </Link>
                            <button
                              onClick={() => handleRemove(slot._id)}
                              className="absolute end-1 top-1 rounded-full bg-white/90 p-1 text-primary-400 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:text-accent-600"
                              aria-label={t("planner.remove")}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPickerTarget({ dayIndex, mealType })}
                            aria-label={`${t("planner.addMeal")}: ${label} · ${term("mealTypes", mealType)}`}
                            className="flex w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary-100 py-3 text-primary-300 transition-colors hover:border-primary-300 hover:text-primary-500"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}

      {pickerTarget && (
        <RecipePickerModal
          dayLabel={t("days.full")[pickerTarget.dayIndex]}
          mealType={term("mealTypes", pickerTarget.mealType)}
          onSelect={handleSelectRecipe}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}

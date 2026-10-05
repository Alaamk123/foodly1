import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, X, Flame, ShoppingBasket, Trash2 } from "lucide-react";
import { fetchMealPlan, addMealToPlan, removeMealFromPlan, clearWeek } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { DAY_LABELS, DAY_LABELS_SHORT, shiftWeek, formatWeekRangeLabel, dateForDayIndex } from "../utils/date";
import RecipePickerModal from "../components/RecipePickerModal";
import LoadingSpinner from "../components/LoadingSpinner";
import RecipeImage from "../components/RecipeImage";

const MEAL_TYPES = ["breakfast", "lunch", "dinner"];

export default function WeeklyPlanner() {
  const { currentWeekStart, setCurrentWeekStart } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickerTarget, setPickerTarget] = useState(null); // { dayIndex, mealType }

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMealPlan(currentWeekStart);
      setPlan(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

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

  const handleSelectRecipe = async (recipe) => {
    const { dayIndex, mealType } = pickerTarget;
    setPickerTarget(null);
    try {
      const updated = await addMealToPlan(currentWeekStart, {
        dayIndex,
        mealType,
        recipeId: recipe._id,
      });
      setPlan((prev) => ({ ...prev, meals: updated.meals, dailyTotals: prev?.dailyTotals }));
      loadPlan();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (slotId) => {
    try {
      const updated = await removeMealFromPlan(currentWeekStart, slotId);
      setPlan((prev) => ({ ...prev, meals: updated.meals }));
      loadPlan();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearWeek = async () => {
    if (!confirm("Clear all meals planned for this week?")) return;
    await clearWeek(currentWeekStart);
    loadPlan();
  };

  const weeklyCalories = plan?.dailyTotals?.reduce((sum, c) => sum + c, 0) || 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-title">Weekly Meal Planner</h1>
          <p className="text-sm text-primary-500">Tap any empty slot to add a recipe for that meal.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-card ring-1 ring-black/5">
            <button
              onClick={() => setCurrentWeekStart(shiftWeek(currentWeekStart, -1))}
              className="rounded-full p-2 text-primary-500 hover:bg-primary-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-2 text-sm font-semibold text-primary-700">
              {formatWeekRangeLabel(currentWeekStart)}
            </span>
            <button
              onClick={() => setCurrentWeekStart(shiftWeek(currentWeekStart, 1))}
              className="rounded-full p-2 text-primary-500 hover:bg-primary-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button onClick={handleClearWeek} className="btn-secondary !px-4 !py-2.5 text-sm">
            <Trash2 size={15} /> Clear
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading your week..." />
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between rounded-xl2 bg-primary-500 px-5 py-4 text-white shadow-card">
            <div className="flex items-center gap-2">
              <Flame size={20} />
              <span className="font-display font-bold">{weeklyCalories.toLocaleString()} kcal planned this week</span>
            </div>
            <Link to="/grocery-list" className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25">
              <ShoppingBasket size={16} /> View Grocery List
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {DAY_LABELS.map((label, dayIndex) => {
              const date = dateForDayIndex(currentWeekStart, dayIndex);
              const dayCalories = plan?.dailyTotals?.[dayIndex] || 0;

              return (
                <div key={label} className="card flex flex-col gap-3 p-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="font-display text-sm font-bold text-primary-900">{DAY_LABELS_SHORT[dayIndex]}</p>
                      <p className="text-[11px] text-primary-400">
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    {dayCalories > 0 && (
                      <span className="text-[11px] font-semibold text-primary-400">{dayCalories} kcal</span>
                    )}
                  </div>

                  {MEAL_TYPES.map((mealType) => {
                    const slot = getSlot(dayIndex, mealType);
                    return (
                      <div key={mealType}>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-primary-300">
                          {mealType}
                        </p>
                        {slot ? (
                          <div className="group relative overflow-hidden rounded-xl bg-primary-50">
                            <Link to={`/recipes/${slot.recipe._id}`} className="flex items-center gap-2 p-2">
                              <RecipeImage src={slot.recipe.image} alt={slot.recipe.title} className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
                              <span className="line-clamp-2 text-xs font-semibold text-primary-800">
                                {slot.recipe.title}
                              </span>
                            </Link>
                            <button
                              onClick={() => handleRemove(slot._id)}
                              className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-primary-400 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:text-accent-600"
                              aria-label="Remove meal"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPickerTarget({ dayIndex, mealType })}
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
          dayLabel={DAY_LABELS[pickerTarget.dayIndex]}
          mealType={pickerTarget.mealType}
          onSelect={handleSelectRecipe}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}

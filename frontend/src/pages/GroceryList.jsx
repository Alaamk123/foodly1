import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Carrot,
  Beef,
  Milk,
  Croissant,
  Package,
  Snowflake,
  Sparkles,
  ShoppingBasket,
} from "lucide-react";
import { fetchGroceryList } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { shiftWeek, formatWeekRangeLabel } from "../utils/date";
import LoadingSpinner from "../components/LoadingSpinner";


const CATEGORY_ICONS = {
  Produce: Carrot,
  "Meat & Seafood": Beef,
  "Dairy & Eggs": Milk,
  Bakery: Croissant,
  Pantry: Package,
  Frozen: Snowflake,
  "Spices & Condiments": Sparkles,
  Other: ShoppingBasket,
};

function storageKey(userId, weekStart) {
  return `foodly_checked_${userId}_${weekStart}`;
}

export default function GroceryList() {
  const { user, currentWeekStart, setCurrentWeekStart } = useAuth();
  const userId = user.id; // only used to keep each user's check-marks separate in localStorage
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGroceryList(currentWeekStart);
      setList(data);

      const saved = localStorage.getItem(storageKey(userId, currentWeekStart));
      setChecked(saved ? JSON.parse(saved) : {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId, currentWeekStart]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const toggleItem = (itemKey) => {
    setChecked((prev) => {
      const next = { ...prev, [itemKey]: !prev[itemKey] };
      localStorage.setItem(storageKey(userId, currentWeekStart), JSON.stringify(next));
      return next;
    });
  };

  const { totalItems, checkedCount } = useMemo(() => {
    if (!list) return { totalItems: 0, checkedCount: 0 };
    const allKeys = list.categories.flatMap((c) => c.items.map((it) => `${c.category}:${it.name}`));
    return {
      totalItems: allKeys.length,
      checkedCount: allKeys.filter((k) => checked[k]).length,
    };
  }, [list, checked]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-title">Grocery List</h1>
          <p className="text-sm text-primary-500">
            Automatically built from everything planned this week, grouped by aisle.
          </p>
        </div>

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
      </div>

      {loading ? (
        <LoadingSpinner label="Building your grocery list..." />
      ) : !list || list.categories.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display font-bold text-primary-800">No meals planned yet.</p>
          <p className="mt-1 text-sm text-primary-500">
            Add recipes to your weekly planner and they'll show up here automatically.
          </p>
          <Link to="/planner" className="btn-primary mt-5 inline-flex">
            Go to Meal Planner
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 card flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-display font-bold text-primary-900">
                {checkedCount} of {totalItems} items checked
              </p>
              <p className="text-xs text-primary-400">
                From {list.recipeCount} recipe{list.recipeCount !== 1 ? "s" : ""} planned this week
              </p>
            </div>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-primary-100">
              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${totalItems ? (checkedCount / totalItems) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {list.categories.map(({ category, items }) => {
              const Icon = CATEGORY_ICONS[category] || ShoppingBasket;
              return (
                <div key={category} className="card overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-primary-50 bg-primary-50/60 px-5 py-3">
                    <Icon size={18} className="text-primary-500" />
                    <h2 className="font-display font-bold text-primary-800">{category}</h2>
                    <span className="ml-auto text-xs font-semibold text-primary-400">{items.length} items</span>
                  </div>
                  <ul>
                    {items.map((item) => {
                      const key = `${category}:${item.name}`;
                      const isChecked = !!checked[key];
                      return (
                        <li key={key} className="border-b border-primary-50 last:border-b-0">
                          <button
                            onClick={() => toggleItem(key)}
                            className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-primary-50/50"
                          >
                            {isChecked ? (
                              <CheckCircle2 size={20} className="flex-shrink-0 text-primary-500" />
                            ) : (
                              <Circle size={20} className="flex-shrink-0 text-primary-200" />
                            )}
                            <span className={`flex-1 text-sm ${isChecked ? "text-primary-300 line-through" : "text-primary-800"}`}>
                              {item.name}
                            </span>
                            <span className={`text-sm font-semibold ${isChecked ? "text-primary-300" : "text-primary-500"}`}>
                              {item.quantity} {item.unit}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

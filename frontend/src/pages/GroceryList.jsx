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
  Cookie,
  Sparkles,
  ShoppingBasket,
  ShoppingCart,
} from "lucide-react";
import { fetchGroceryList } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { shiftWeek, formatWeekRangeLabel } from "../utils/date";
import LoadingSpinner from "../components/LoadingSpinner";
import { useLanguage } from "../i18n/LanguageContext";


const CATEGORY_ICONS = {
  Produce: Carrot,
  "Meat & Seafood": Beef,
  "Dairy & Eggs": Milk,
  Bakery: Croissant,
  Pantry: Package,
  Frozen: Snowflake,
  "Spices & Condiments": Sparkles,
  "Spices & Seasonings": Sparkles, // the name stored in the database
  Snacks: Cookie,
  Other: ShoppingBasket,
};

function storageKey(userId, weekStart) {
  return `foodly_checked_${userId}_${weekStart}`;
}

export default function GroceryList() {
  const { user, currentWeekStart, setCurrentWeekStart } = useAuth();
  const { t, term, ingredient, locale, isRTL } = useLanguage();
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
          <h1 className="section-title">{t("grocery.title")}</h1>
          <Link to="/checkout" className="btn-accent mt-4 inline-flex">
          <ShoppingCart size={18} /> {t("grocery.checkout")}
          </Link>
          <p className="text-sm text-primary-500">
            {t("grocery.sub")}
          </p>
        </div>

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
      </div>

      {loading ? (
        <LoadingSpinner label={t("grocery.loading")} />
      ) : !list || list.categories.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display font-bold text-primary-800">{t("grocery.emptyTitle")}</p>
          <p className="mt-1 text-sm text-primary-500">
            {t("grocery.emptyText")}
          </p>
          <Link to="/planner" className="btn-primary mt-5 inline-flex">
            {t("grocery.goPlanner")}
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 card flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-display font-bold text-primary-900">
                {t("grocery.checked", { checked: checkedCount, total: totalItems })}
              </p>
              <p className="text-xs text-primary-400">
                {t("grocery.fromRecipes", { n: list.recipeCount })}
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
                    <h2 className="font-display font-bold text-primary-800">{term("categories", category)}</h2>
                    <span className="ms-auto text-xs font-semibold text-primary-400">{t("grocery.itemsCount", { n: items.length })}</span>
                  </div>
                  <ul>
                    {items.map((item) => {
                      const key = `${category}:${item.name}`;
                      const isChecked = !!checked[key];
                      return (
                        <li key={key} className="border-b border-primary-50 last:border-b-0">
                          <button
                            onClick={() => toggleItem(key)}
                            className="flex w-full items-center gap-3 px-5 py-3 text-start transition-colors hover:bg-primary-50/50"
                          >
                            {isChecked ? (
                              <CheckCircle2 size={20} className="flex-shrink-0 text-primary-500" />
                            ) : (
                              <Circle size={20} className="flex-shrink-0 text-primary-200" />
                            )}
                            <span className={`flex-1 text-sm ${isChecked ? "text-primary-300 line-through" : "text-primary-800"}`}>
                              {ingredient(item.name)}
                            </span>
                            <span className={`text-sm font-semibold ${isChecked ? "text-primary-300" : "text-primary-500"}`}>
                              {item.quantity} {term("units", item.unit)}
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

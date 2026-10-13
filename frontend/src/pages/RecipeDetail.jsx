import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, Flame, Users, ChefHat, ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { fetchRecipeById } from "../api/client";
import DietBadge from "../components/DietBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import RecipeImage from "../components/RecipeImage";
import RatingBox from "../components/RatingBox";
import { StarDisplay } from "../components/StarRating";
import { useLanguage } from "../i18n/LanguageContext";

export default function RecipeDetail() {
  const { id } = useParams();
  const { t, term, ingredient, localizeRecipe, isRTL } = useLanguage();
  const [rawRecipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({}); // tick ingredients while cooking

  useEffect(() => {
    setLoading(true);
    fetchRecipeById(id)
      .then(setRecipe)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const recipe = localizeRecipe(rawRecipe);

  if (loading) return <LoadingSpinner label={t("recipe.loading")} />;
  if (!recipe) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="font-display font-bold text-primary-800">{t("recipe.notFound")}</p>
        <Link to="/recipes" className="btn-primary mt-4 inline-flex">
          {t("recipe.backToRecipes")}
        </Link>
      </div>
    );
  }

  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-4 sm:px-6">
      <Link to="/recipes" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline">
        <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} /> {t("recipe.back")}
      </Link>

      <div className="overflow-hidden rounded-xl2 shadow-card">
        <RecipeImage src={recipe.image} alt={recipe.title} className="h-64 w-full object-cover sm:h-80" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {recipe.dietTags?.map((tag) => (
          <DietBadge key={tag} tag={tag} />
        ))}
      </div>

      <h1 className="mt-3 font-display text-3xl font-extrabold text-primary-900">{recipe.title}</h1>
      <p className="mt-2 text-primary-600">{recipe.description}</p>
      <div className="mt-3">
        <StarDisplay average={recipe.ratingAverage} count={recipe.ratingCount} size={18} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Clock} label={t("recipe.totalTime")} value={t("common.minutes", { n: totalTime })} />
        <Stat icon={Flame} label={t("recipe.caloriesPerServing")} value={`~${t("common.kcal", { n: recipe.calories })}`} />
        <Stat icon={Users} label={t("recipe.servings")} value={recipe.servings} />
        <Stat icon={ChefHat} label={t("recipe.difficulty")} value={term("difficulty", recipe.difficulty)} />
      </div>

      <RatingBox recipeId={recipe._id} onRated={(stats) => setRecipe((r) => ({ ...r, ...stats }))} />

      <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
        <div className="md:col-span-1">
          <h2 className="font-display text-lg font-bold text-primary-900">{t("recipe.ingredients")}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {recipe.ingredients.map((ing, idx) => {
              const isChecked = checked[idx];
              return (
                <li key={idx}>
                  <button
                    onClick={() => setChecked((p) => ({ ...p, [idx]: !p[idx] }))}
                    className="flex w-full items-center gap-2 text-start text-sm text-primary-700"
                  >
                    {isChecked ? (
                      <CheckCircle2 size={18} className="flex-shrink-0 text-primary-500" />
                    ) : (
                      <Circle size={18} className="flex-shrink-0 text-primary-200" />
                    )}
                    <span className={isChecked ? "text-primary-300 line-through" : ""}>
                      {ing.quantity} {term("units", ing.unit)} {ingredient(ing.name)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h2 className="font-display text-lg font-bold text-primary-900">{t("recipe.instructions")}</h2>
          <ol className="mt-3 flex flex-col gap-4">
            {recipe.steps.map((step, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                  {idx + 1}
                </span>
                <p className="text-sm leading-relaxed text-primary-700">{step}</p>
              </li>
            ))}
          </ol>

          {recipe.tips && (
            <div className="mt-6 rounded-xl2 bg-primary-50 p-4 text-sm text-primary-700">
              <span className="font-display font-bold text-primary-800">{t("recipe.tip")}</span>
              {recipe.tips}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="card flex flex-col items-center gap-1 py-3 text-center">
      <Icon size={18} className="text-primary-500" />
      <p className="text-sm font-bold text-primary-900">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-primary-400">{label}</p>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookMarked, Plus, Clock } from "lucide-react";
import { fetchMySubmissions } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import StatusBadge from "../components/StatusBadge";
import RecipeImage from "../components/RecipeImage";
import LoadingSpinner from "../components/LoadingSpinner";

export default function MyRecipes() {
  const { t, apiError, locale } = useLanguage();
  const formatDate = (iso) => new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
  const NOTE = { pending: t("myRecipes.notePending"), approved: t("myRecipes.noteApproved") };
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMySubmissions()
      .then((res) => setRecipes(res.data))
      .catch((err) => setError(apiError(err, "myRecipes.loadError")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="section-title flex items-center gap-2">
          <BookMarked size={24} /> {t("myRecipes.title")}
        </h1>
        <Link to="/submit-recipe" className="btn-accent !px-5 !py-2.5 text-sm">
          <Plus size={16} /> {t("myRecipes.add")}
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner label={t("myRecipes.loading")} />
      ) : error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : recipes.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-display font-bold text-primary-800">{t("myRecipes.emptyTitle")}</p>
          <p className="mt-1 text-sm text-primary-500">{t("myRecipes.emptyText")}</p>
          <Link to="/submit-recipe" className="btn-primary mt-4">
            {t("myRecipes.add")}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {recipes.map((r) => (
            <li key={r._id} className="card flex flex-col gap-3 p-4 sm:flex-row">
              <RecipeImage src={r.image} alt={r.title} className="h-32 w-full shrink-0 rounded-xl object-cover sm:h-24 sm:w-32" />
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-display font-bold text-primary-900">{r.title}</h2>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-primary-400">
                  <Clock size={12} /> {t("myRecipes.submittedOn", { date: formatDate(r.createdAt) })}
                </p>

                {r.status === "rejected" ? (
                  <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">
                    <span className="font-bold">{t("myRecipes.rejectReason")}</span>
                    {r.rejectionReason || t("myRecipes.noReason")}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-primary-600">{NOTE[r.status]}</p>
                )}

                {r.status === "approved" && (
                  <Link to={`/recipes/${r._id}`} className="mt-2 inline-block text-sm font-bold text-accent-600 hover:underline">
                    {t("myRecipes.viewInCatalog")}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, X, Check, Ban, Clock, Users, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { adminFetchRecipes, adminFetchRecipe, adminApproveRecipe, adminRejectRecipe } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import AdminTabs from "../components/AdminTabs";
import StatusBadge from "../components/StatusBadge";
import RecipeImage from "../components/RecipeImage";
import LoadingSpinner from "../components/LoadingSpinner";

const FILTERS = [
  { key: "", labelKey: "paging.all" },
  { key: "pending", labelKey: "status.recipe.pending" },
  { key: "approved", labelKey: "status.recipe.approved" },
  { key: "rejected", labelKey: "status.recipe.rejected" },
];

const formatDate = (iso, locale) => new Date(iso).toLocaleString(locale, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AdminRecipes() {
  const { t, apiError, locale, isRTL } = useLanguage();
  const Prev = isRTL ? ChevronRight : ChevronLeft;
  const Next = isRTL ? ChevronLeft : ChevronRight;
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [list, setList] = useState({ data: [], counts: {}, pagination: { totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    adminFetchRecipes({ status: status || undefined, page, limit: 20 })
      .then(setList)
      .catch((err) => setError(apiError(err, "adminRecipes.loadError")))
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(load, [load]);

  const { counts, pagination } = list;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="section-title mb-4 flex items-center gap-2">
        <ShieldCheck size={24} /> {t("adminRecipes.panel")}
      </h1>
      <AdminTabs />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label={t("adminRecipes.filterLabel")}>
        {FILTERS.map((f) => {
          const count = f.key ? counts[f.key] : undefined;
          const active = status === f.key;
          return (
            <button
              key={f.key || "all"}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setStatus(f.key);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors ${active ? "bg-accent-500 text-white ring-accent-500" : "bg-white text-primary-600 ring-primary-100 hover:bg-primary-50"}`}
            >
              {t(f.labelKey)}
              {count !== undefined && <span className="ms-1.5 opacity-80">({count})</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner label={t("common.loading")} />
      ) : error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : list.data.length === 0 ? (
        <p className="card p-8 text-center text-sm text-primary-500">{t("adminRecipes.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.data.map((r) => (
            <li key={r._id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <RecipeImage src={r.image} alt={r.title} className="h-28 w-full shrink-0 rounded-xl object-cover sm:h-20 sm:w-28" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display font-bold text-primary-900">{r.title}</h2>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 text-xs text-primary-500">
                  {t("adminRecipes.by")} <span className="font-semibold">{r.submittedBy?.name || t("adminRecipes.deletedUser")}</span> · {formatDate(r.createdAt, locale)}
                </p>
              </div>
              <button className="btn-secondary !px-4 !py-2 text-sm" onClick={() => setSelectedId(r._id)}>
                {t("adminRecipes.review")}
              </button>
            </li>
          ))}
        </ul>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button className="btn-secondary !px-4 !py-2" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label={t("paging.prev")}>
            <Prev size={18} />
          </button>
          <span className="text-sm font-semibold text-primary-700">
            {page} / {pagination.totalPages}
          </span>
          <button className="btn-secondary !px-4 !py-2" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} aria-label={t("paging.next")}>
            <Next size={18} />
          </button>
        </div>
      )}

      {selectedId && <ReviewModal id={selectedId} onClose={() => setSelectedId(null)} onChanged={load} />}
    </div>
  );
}

function ReviewModal({ id, onClose, onChanged }) {
  const { t, term, ingredient, apiError, locale, isRTL } = useLanguage();
  const sep = isRTL ? "، " : ", ";
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    adminFetchRecipe(id)
      .then(setRecipe)
      .catch((err) => setError(apiError(err, "adminRecipes.detailError")));
  }, [id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const act = async (fn) => {
    setBusy(true);
    setError("");
    try {
      const updated = await fn();
      setRecipe(updated);
      setRejecting(false);
      onChanged();
    } catch (err) {
      setError(apiError(err, "adminRecipes.actionError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("adminRecipes.modalLabel")}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-cream-50 p-5 shadow-card-hover sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-primary-900">{t("adminRecipes.modalTitle")}</h2>
          <button onClick={onClose} aria-label={t("common.close")} className="rounded-full p-2 text-primary-500 hover:bg-primary-50">
            <X size={20} />
          </button>
        </div>

        {!recipe && !error && <LoadingSpinner label={t("common.loading")} />}
        {error && (
          <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        {recipe && (
          <>
            <RecipeImage src={recipe.image} alt={recipe.title} className="h-48 w-full rounded-xl object-cover" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-extrabold text-primary-900">{recipe.title}</h3>
              <StatusBadge status={recipe.status} />
            </div>
            <p className="mt-1 text-xs text-primary-500">
              {t("adminRecipes.submitter")} <span className="font-semibold">{recipe.submittedBy?.name}</span> ({recipe.submittedBy?.email}) · {formatDate(recipe.createdAt, locale)}
            </p>
            {recipe.description && <p className="mt-3 text-sm text-primary-700">{recipe.description}</p>}

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-primary-600">
              <span className="flex items-center gap-1">
                <Clock size={15} /> {t("common.minutes", { n: recipe.prepTimeMinutes + recipe.cookTimeMinutes })}
              </span>
              <span className="flex items-center gap-1">
                <Users size={15} /> {t("adminRecipes.servingsN", { n: recipe.servings })}
              </span>
              <span className="flex items-center gap-1">
                <Flame size={15} /> {t("common.cal", { n: recipe.calories })}
              </span>
              <span>{t("adminRecipes.difficulty")} {term("difficulty", recipe.difficulty)}</span>
            </div>
            {(recipe.dietTags?.length > 0 || recipe.allergens?.length > 0) && (
              <p className="mt-2 text-xs text-primary-500">
                {recipe.dietTags?.length > 0 && <>{t("adminRecipes.tags")} {recipe.dietTags.map((d) => term("diets", d)).join(sep)} </>}
                {recipe.allergens?.length > 0 && <>· {t("adminRecipes.allergens")} {recipe.allergens.map((a) => term("allergens", a)).join(sep)}</>}
              </p>
            )}

            <h4 className="mt-4 font-display font-bold text-primary-900">{t("adminRecipes.ingredients")}</h4>
            <ul className="mt-1 list-inside list-disc text-sm text-primary-700">
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>
                  {ing.quantity} {term("units", ing.unit)} {ingredient(ing.name)} <span className="text-xs text-primary-400">({term("categories", ing.category)})</span>
                </li>
              ))}
            </ul>

            <h4 className="mt-4 font-display font-bold text-primary-900">{t("adminRecipes.steps")}</h4>
            <ol className="mt-1 list-inside list-decimal space-y-1 text-sm text-primary-700">
              {recipe.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            {recipe.tips && (
              <p className="mt-3 rounded-lg bg-primary-50 p-2 text-sm text-primary-700">
                <span className="font-bold">{t("adminRecipes.tips")}</span>
                {recipe.tips}
              </p>
            )}

            {recipe.status === "rejected" && recipe.rejectionReason && (
              <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">
                <span className="font-bold">{t("adminRecipes.rejectReason")}</span>
                {recipe.rejectionReason}
              </p>
            )}

            {/* ---- actions ---- */}
            <div className="mt-5 border-t border-primary-100 pt-4">
              {rejecting ? (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-primary-800" htmlFor="reject-reason">
                    {t("adminRecipes.reasonLabel")}
                  </label>
                  <textarea
                    id="reject-reason"
                    rows={3}
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-primary-100 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                  <div className="flex gap-2">
                    <button disabled={busy} className="btn-accent !bg-red-600 hover:!bg-red-700" onClick={() => act(() => adminRejectRecipe(recipe._id, reason))}>
                      <Ban size={16} /> {t("adminRecipes.confirmReject")}
                    </button>
                    <button disabled={busy} className="btn-secondary" onClick={() => setRejecting(false)}>
                      {t("paging.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recipe.status !== "approved" && (
                    <button disabled={busy} className="btn-primary" onClick={() => act(() => adminApproveRecipe(recipe._id))}>
                      <Check size={16} /> {t("adminRecipes.approve")}
                    </button>
                  )}
                  {recipe.status !== "rejected" && (
                    <button disabled={busy} className="btn-secondary !text-red-600" onClick={() => setRejecting(true)}>
                      <Ban size={16} /> {t("adminRecipes.reject")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
